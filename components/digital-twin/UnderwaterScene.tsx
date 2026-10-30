'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import { loadSubseaAssets, Loaded3DAssets } from '@/lib/3d/asset-loader';
import { Model9SplicingAssembly } from '@/lib/3d/models/Model9SplicingAssembly';
import { Model12InspectionEquipment } from '@/lib/3d/models/Model12InspectionEquipment';
import { FaultIncident } from '@/lib/types';

export type CameraPerspective = 'Orbit' | 'Surface Vessel' | 'ROV Cam' | 'Macro Splice';

export interface UnderwaterSceneHandle {
  setPerspective: (perspective: CameraPerspective) => void;
  setSimulationStage: (stage: number, progress: number) => void;
  captureFrame: () => string;
  setDepthLevel: (depthMeters: number) => void;
}

interface UnderwaterSceneProps {
  activeFault: FaultIncident;
  onSimulationMilestone?: (stageName: string, progress: number) => void;
  isGhostMode?: boolean;
}

export const UnderwaterScene = forwardRef<UnderwaterSceneHandle, UnderwaterSceneProps>(function UnderwaterScene(
  { activeFault, onSimulationMilestone, isGhostMode = false },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [perspective, setPerspectiveState] = useState<CameraPerspective>('ROV Cam');
  const [simulationStage, setStageState] = useState<number>(5);
  const [stageProgress, setProgressState] = useState<number>(0.35);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const model9Ref = useRef<Model9SplicingAssembly | null>(null);
  const model12Ref = useRef<Model12InspectionEquipment | null>(null);

  const vesselGroupRef = useRef<THREE.Group | null>(null);
  const rovGroupRef = useRef<THREE.Group | null>(null);
  const hoistCableRef = useRef<THREE.Line | null>(null);
  const craneHookRef = useRef<THREE.Group | null>(null);
  const cableLeftRef = useRef<THREE.Line | null>(null);
  const cableRightRef = useRef<THREE.Line | null>(null);
  const marineSnowRef = useRef<THREE.Points | null>(null);

  // Camera targets
  const targetCamPos = useRef(new THREE.Vector3(0, -18, 5));
  const targetLookAt = useRef(new THREE.Vector3(0, -20, 0));

  // Expose imperative handle methods
  useImperativeHandle(ref, () => ({
    setPerspective(p: CameraPerspective) {
      setPerspectiveState(p);
      updateCameraTargets(p);
    },
    setSimulationStage(stage: number, progress: number) {
      setStageState(stage);
      setProgressState(progress);
    },
    captureFrame() {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return rendererRef.current.domElement.toDataURL('image/png');
      }
      return '';
    },
    setDepthLevel(depthMeters: number) {
      if (cameraRef.current) {
        // Map depth 0 to 4820m to y: 0 to -20
        const y = -(depthMeters / 4820) * 20;
        cameraRef.current.position.y = y;
      }
    },
  }));

  const updateCameraTargets = (persp: CameraPerspective) => {
    switch (persp) {
      case 'Surface Vessel':
        targetCamPos.current.set(4, 2.5, 8);
        targetLookAt.current.set(0, 0, 0);
        break;
      case 'ROV Cam':
        targetCamPos.current.set(0, -17.5, 4.5);
        targetLookAt.current.set(0, -19.5, 0);
        break;
      case 'Macro Splice':
        targetCamPos.current.set(0, -18.8, 1.2);
        targetLookAt.current.set(0, -19.0, 0);
        break;
      case 'Orbit':
      default:
        targetCamPos.current.set(8, -15, 12);
        targetLookAt.current.set(0, -19.5, 0);
        break;
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Abyssal deep ocean fog
    scene.background = new THREE.Color(0x020b18);
    scene.fog = new THREE.FogExp2(0x020b18, 0.045);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 150);
    camera.position.set(0, -18, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // Needed for screenshot PDF capture
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 2. Lighting setup
    const ambientLight = new THREE.AmbientLight(0x0a223e, 1.2);
    scene.add(ambientLight);

    const sunlight = new THREE.DirectionalLight(0x13bfd3, 0.8);
    sunlight.position.set(5, 20, 5);
    scene.add(sunlight);

    // Deep water localized spot
    const benthicKeyLight = new THREE.SpotLight(0xdff9fc, 4.5, 30, Math.PI / 4, 0.4);
    benthicKeyLight.position.set(0, -10, 5);
    benthicKeyLight.target.position.set(0, -20, 0);
    scene.add(benthicKeyLight);
    scene.add(benthicKeyLight.target);

    // 3. Seabed Bathymetry Floor (Abyssal Plain at y = -20)
    const floorGeo = new THREE.PlaneGeometry(80, 80, 64, 64);
    floorGeo.rotateX(-Math.PI / 2);
    // Displace vertices slightly for realistic natural topography
    const posAttr = floorGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const bump = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.7 + Math.sin(x * 0.4) * 0.25;
      posAttr.setY(i, bump);
    }
    floorGeo.computeVertexNormals();

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x14202e,
      roughness: 0.85,
      metalness: 0.1,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -20;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 4. Submarine Cable Routes on Seafloor with severance break
    const createSubseaCableLine = (points: THREE.Vector3[], color: number) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.08, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.4,
        metalness: 0.6,
      });
      return new THREE.Mesh(tubeGeo, tubeMat);
    };

    // Left severed cable segment (arriving from landing station)
    const leftPoints = [
      new THREE.Vector3(-35, -20, -5),
      new THREE.Vector3(-15, -19.8, -2),
      new THREE.Vector3(-4, -19.5, -0.5),
      new THREE.Vector3(-0.6, -19.2, 0),
    ];
    const leftCable = createSubseaCableLine(leftPoints, 0x1677b8);
    scene.add(leftCable);

    // Right severed cable segment (heading transoceanic)
    const rightPoints = [
      new THREE.Vector3(0.6, -19.2, 0),
      new THREE.Vector3(4, -19.5, 0.5),
      new THREE.Vector3(15, -19.8, 2),
      new THREE.Vector3(35, -20, 5),
    ];
    const rightCable = createSubseaCableLine(rightPoints, 0x1677b8);
    scene.add(rightCable);

    // 5. Model 9: Splicing & Joint Assembly (centered between severed ends at y = -19.0)
    const model9 = new Model9SplicingAssembly();
    model9.group.position.set(0, -19.1, 0);
    model9.group.scale.setScalar(1.2);
    scene.add(model9.group);
    model9Ref.current = model9;

    // 6. Mini ROV Guardian with Model 12 Inspection Equipment
    const rovGroup = new THREE.Group();
    rovGroup.position.set(0, -17.5, 1.5);
    scene.add(rovGroup);
    rovGroupRef.current = rovGroup;

    // ROV Chassis Body (High-tech yellow/dark navy work-class chassis)
    const chassisGeo = new THREE.BoxGeometry(1.2, 0.7, 1.6);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x0e2a47,
      roughness: 0.35,
      metalness: 0.7,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    rovGroup.add(chassis);

    // ROV Flotation Pack (Yellow synthetic syntactic foam)
    const foamGeo = new THREE.BoxGeometry(1.24, 0.25, 1.5);
    const foamMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const foam = new THREE.Mesh(foamGeo, foamMat);
    foam.position.y = 0.42;
    rovGroup.add(foam);

    // Thruster ducts (4 horizontal + 2 vertical)
    const thrusterGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.28, 16);
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const addThruster = (x: number, y: number, z: number, rx: number, ry: number) => {
      const th = new THREE.Mesh(thrusterGeo, thrusterMat);
      th.position.set(x, y, z);
      th.rotation.set(rx, ry, 0);
      rovGroup.add(th);
    };
    addThruster(-0.68, 0, 0.6, 0, Math.PI / 4);
    addThruster(0.68, 0, 0.6, 0, -Math.PI / 4);
    addThruster(-0.68, 0, -0.6, 0, -Math.PI / 4);
    addThruster(0.68, 0, -0.6, 0, Math.PI / 4);
    addThruster(-0.4, 0.3, 0, Math.PI / 2, 0);
    addThruster(0.4, 0.3, 0, Math.PI / 2, 0);

    // Model 12 Inspection Equipment forward payload
    const model12 = new Model12InspectionEquipment();
    model12.group.position.set(0, -0.2, 0.85);
    rovGroup.add(model12.group);
    model12Ref.current = model12;

    // Umbilical Tether Cable (leads from ROV up to sea surface at y = 0)
    const tetherPoints = [
      new THREE.Vector3(0, -17.0, 1.2),
      new THREE.Vector3(-1.5, -12.0, 2.0),
      new THREE.Vector3(1.2, -6.0, 3.5),
      new THREE.Vector3(0, 0, 5.0),
    ];
    const tetherCurve = new THREE.CatmullRomCurve3(tetherPoints);
    const tetherGeo = new THREE.TubeGeometry(tetherCurve, 32, 0.025, 8, false);
    const tetherMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const tetherMesh = new THREE.Mesh(tetherGeo, tetherMat);
    scene.add(tetherMesh);

    // 7. Surface DP2 Repair Vessel (Floating at y = 0)
    const vesselGroup = new THREE.Group();
    vesselGroup.position.set(0, 0, 5);
    scene.add(vesselGroup);
    vesselGroupRef.current = vesselGroup;

    // 8. Marine Snow Particle System (floating particles in water)
    const snowCount = 400;
    const snowGeo = new THREE.BufferGeometry();
    const snowPos = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount; i++) {
      snowPos[i * 3] = (Math.random() - 0.5) * 30;
      snowPos[i * 3 + 1] = -Math.random() * 20;
      snowPos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.08,
      transparent: true,
      opacity: 0.6,
    });
    const marineSnow = new THREE.Points(snowGeo, snowMat);
    scene.add(marineSnow);
    marineSnowRef.current = marineSnow;

    // Load External 3D GLB Models asynchronously
    loadSubseaAssets().then((assets) => {
      // 1. Cargo Ship
      if (assets.cargoShip && vesselGroupRef.current) {
        assets.cargoShip.scale.setScalar(0.08);
        assets.cargoShip.position.set(0, 0.3, 0);
        vesselGroupRef.current.add(assets.cargoShip);
      }
      // 2. Crane Hook Block
      if (assets.craneHook) {
        assets.craneHook.scale.setScalar(0.25);
        assets.craneHook.position.set(0, -18.2, 0);
        scene.add(assets.craneHook);
        craneHookRef.current = assets.craneHook;
      }
      // 3. Robotic Arm mounted on ROV
      if (assets.roboticArm && rovGroupRef.current) {
        assets.roboticArm.scale.setScalar(0.22);
        assets.roboticArm.position.set(0.45, -0.35, 0.7);
        assets.roboticArm.rotation.set(Math.PI / 4, 0, 0);
        rovGroupRef.current.add(assets.roboticArm);
      }
      // 4. Topography / Reef Formations
      if (assets.reefWalls) {
        assets.reefWalls.scale.setScalar(0.04);
        assets.reefWalls.position.set(-14, -20, -8);
        scene.add(assets.reefWalls);
      }
      setAssetsLoaded(true);
    });

    // Handle Window Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Render Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const timeMs = clock.getElapsedTime() * 1000;

      // 1. Smooth Camera Damping towards Target
      camera.position.lerp(targetCamPos.current, 0.045);
      const currentLookAt = new THREE.Vector3();
      camera.getWorldDirection(currentLookAt);
      currentLookAt.add(camera.position);
      currentLookAt.lerp(targetLookAt.current, 0.05);
      camera.lookAt(targetLookAt.current);

      // 2. ROV gentle hovering motion
      if (rovGroupRef.current) {
        const hoverY = -17.5 + Math.sin(timeMs * 0.0012) * 0.15;
        const pitch = Math.sin(timeMs * 0.0008) * 0.03;
        const roll = Math.cos(timeMs * 0.001) * 0.02;
        rovGroupRef.current.position.y = hoverY;
        rovGroupRef.current.rotation.x = pitch;
        rovGroupRef.current.rotation.z = roll;
      }

      // 3. Update Model 12 Inspection Equipment
      if (model12Ref.current) {
        model12Ref.current.update(timeMs, true);
      }

      // 4. Update Model 9 Splicing Assembly based on simulation progress
      if (model9Ref.current) {
        model9Ref.current.update(stageProgress, timeMs);
      }

      // 5. Marine snow drifting downwards
      if (marineSnowRef.current) {
        const pos = marineSnowRef.current.geometry.attributes.position;
        for (let i = 1; i < pos.count * 3; i += 3) {
          pos.array[i] -= 0.008;
          if (pos.array[i] < -20) pos.array[i] = 0;
        }
        pos.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      model9.dispose();
      model12.dispose();
    };
  }, [stageProgress]);

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

      {/* Camera View Switcher Buttons */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-[#071322]/85 backdrop-blur-md p-1.5 rounded-xl border border-white/10 font-mono text-xs">
        {(['ROV Cam', 'Macro Splice', 'Orbit', 'Surface Vessel'] as const).map((view) => (
          <button
            key={view}
            onClick={() => {
              setPerspectiveState(view);
              updateCameraTargets(view);
            }}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              perspective === view
                ? 'bg-[#184872] text-cyan-300 font-bold border border-cyan-400/30'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Real-time Benthic HUD Telemetry Strip */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 bg-[#071322]/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 font-mono text-xs text-white">
        <div>
          <span className="text-[9px] text-[#91A1AF] block">BENTHIC DEPTH</span>
          <strong className="text-cyan-300">-{activeFault.depthMeters}m</strong>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div>
          <span className="text-[9px] text-[#91A1AF] block">OPTICAL LOSS</span>
          <strong className="text-rose-400">{activeFault.opticalLossDb} dB</strong>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div>
          <span className="text-[9px] text-[#91A1AF] block">ROV STATUS</span>
          <strong className="text-emerald-400">ACTIVE INSPECTION</strong>
        </div>
      </div>
    </div>
  );
});
