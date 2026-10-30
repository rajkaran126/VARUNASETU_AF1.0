'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { Model9SplicingAssembly } from '@/lib/3d/models/Model9SplicingAssembly';
import { Model12InspectionEquipment } from '@/lib/3d/models/Model12InspectionEquipment';
import { FaultIncident } from '@/lib/types';

export type CameraPerspective = 'ROV Cam' | 'Macro Splice' | 'Orbit' | 'Surface Vessel';

export interface UnderwaterSceneHandle {
  setPerspective: (perspective: CameraPerspective) => void;
  setSimulationStage: (stageIndex: number, stageProgress: number) => void;
  captureFrame: () => string;
  setDepthLevel?: (depthMeters: number) => void;
}

interface UnderwaterSceneProps {
  activeFault: FaultIncident;
  activePerspective?: CameraPerspective;
  currentStage?: number;
  stageProgress?: number;
  isGhostMode?: boolean;
}

const UnderwaterScene = forwardRef<UnderwaterSceneHandle, UnderwaterSceneProps>(
  (
    {
      activeFault,
      activePerspective = 'ROV Cam',
      currentStage = 0,
      stageProgress = 0,
      isGhostMode = false,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Three.js References
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

    // ROV & Cable References
    const rovGroupRef = useRef<THREE.Group | null>(null);
    const model12Ref = useRef<Model12InspectionEquipment | null>(null);
    const model9Ref = useRef<Model9SplicingAssembly | null>(null);
    const opticalPulseMeshRef = useRef<THREE.Mesh | null>(null);
    const opticalPulsePosRef = useRef<number>(0);
    const tetherMeshRef = useRef<THREE.Mesh | null>(null);
    const marineSnowRef = useRef<THREE.Points | null>(null);

    // Camera targets
    const targetCamPos = useRef(new THREE.Vector3(0, 1.8, 8.5));
    const targetLookAt = useRef(new THREE.Vector3(0, 0.5, 6.0));

    // Internal state
    const [perspectiveState, setPerspectiveState] = useState<CameraPerspective>(activePerspective);
    const [stageState, setStageState] = useState(currentStage);
    const [progressState, setProgressState] = useState(stageProgress);
    const stageStateRef = useRef(currentStage);
    const progressStateRef = useRef(stageProgress);

    useEffect(() => {
      stageStateRef.current = stageState;
      progressStateRef.current = progressState;
    }, [stageState, progressState]);

    // Update targets on perspective change
    const updateCameraTargets = (persp: CameraPerspective) => {
      switch (persp) {
        case 'Surface Vessel':
          targetCamPos.current.set(12, 4.5, 18);
          targetLookAt.current.set(0, 0.5, 6.0);
          break;
        case 'ROV Cam':
          if (rovGroupRef.current) {
            const p = rovGroupRef.current.position;
            targetCamPos.current.set(p.x, p.y + 1.1, p.z + 2.8);
            targetLookAt.current.set(p.x, p.y - 0.2, p.z - 2.5);
          } else {
            targetCamPos.current.set(0, 1.8, 8.5);
            targetLookAt.current.set(0, 0.5, 6.0);
          }
          break;
        case 'Macro Splice':
          targetCamPos.current.set(0, -18.4, 1.6);
          targetLookAt.current.set(0, -19.0, 0);
          break;
        case 'Orbit':
        default:
          targetCamPos.current.set(12, -13.5, 14);
          targetLookAt.current.set(0, -18.5, 0);
          break;
      }
    };

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
        if (cameraRef.current && perspectiveState === 'Orbit') {
          const y = -(depthMeters / 4820) * 19.0;
          cameraRef.current.position.y = y;
        }
      },
    }));

    useEffect(() => {
      updateCameraTargets(activePerspective);
      setPerspectiveState(activePerspective);
    }, [activePerspective]);

    useEffect(() => {
      setStageState(currentStage);
      setProgressState(stageProgress);
    }, [currentStage, stageProgress]);

    // Main Three.js Scene Setup
    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      // 1. Scene, Camera, Renderer
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Deep oceanic atmosphere
      scene.background = new THREE.Color(0x021324);
      scene.fog = new THREE.FogExp2(0x03182b, 0.016);

      const camera = new THREE.PerspectiveCamera(
        48,
        container.clientWidth / container.clientHeight,
        0.1,
        350
      );
      camera.position.set(0, 2.0, 9.0);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      rendererRef.current = renderer;

      // 2. Lighting: Sun radiance + Ambient radiance + Benthic spotlight
      const sunLight = new THREE.DirectionalLight(0xfff7ed, 3.8);
      sunLight.position.set(20, 35, 25);
      sunLight.castShadow = true;
      scene.add(sunLight);

      const hemiLight = new THREE.HemisphereLight(0x4a7c91, 0x07273d, 2.2);
      scene.add(hemiLight);

      const ambientLight = new THREE.AmbientLight(0x0a263d, 2.4);
      scene.add(ambientLight);

      // Benthic key spotlight illuminating cable repair zone
      const benthicKeyLight = new THREE.SpotLight(0xfff7ed, 6.5, 45, Math.PI / 3.2, 0.45, 1.1);
      benthicKeyLight.position.set(0, -11, 6);
      benthicKeyLight.target.position.set(0, -19.2, 0);
      benthicKeyLight.castShadow = true;
      scene.add(benthicKeyLight);
      scene.add(benthicKeyLight.target);

      // Neutral seabed baseline supporting the submarine cable
      const seafloorGeo = new THREE.PlaneGeometry(120, 120, 48, 48);
      seafloorGeo.rotateX(-Math.PI / 2);
      const seafloorMat = new THREE.MeshStandardMaterial({
        color: 0x1a2632,
        roughness: 0.9,
        metalness: 0.1,
      });
      const seafloorMesh = new THREE.Mesh(seafloorGeo, seafloorMat);
      seafloorMesh.position.y = -19.5;
      seafloorMesh.receiveShadow = true;
      scene.add(seafloorMesh);

      // 3. Submarine Fiber Optic Cable on Seafloor
      const createSeafloorCable = (points: THREE.Vector3[], color: number) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.13, 16, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.45,
          metalness: 0.55,
        });
        const mesh = new THREE.Mesh(tubeGeo, tubeMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      };

      // Left cable segment leading towards fault
      const leftCablePoints = [
        new THREE.Vector3(-45, -19.4, -6),
        new THREE.Vector3(-25, -19.5, -3),
        new THREE.Vector3(-12, -19.7, -1),
        new THREE.Vector3(-4, -19.6, -0.4),
        new THREE.Vector3(-0.5, -19.2, 0),
      ];
      const leftCable = createSeafloorCable(leftCablePoints, 0x454640);
      scene.add(leftCable);

      // Right cable segment
      const rightCablePoints = [
        new THREE.Vector3(0.5, -19.2, 0),
        new THREE.Vector3(4, -19.6, 0.4),
        new THREE.Vector3(12, -19.7, 1),
        new THREE.Vector3(25, -19.5, 3),
        new THREE.Vector3(45, -19.4, 6),
      ];
      const rightCable = createSeafloorCable(rightCablePoints, 0x454640);
      scene.add(rightCable);

      // Model 9: Submarine Cable Splicing Assembly (Universal Joint)
      const model9 = new Model9SplicingAssembly();
      model9.group.position.set(0, -19.1, 0);
      model9.group.scale.setScalar(1.25);
      scene.add(model9.group);
      model9Ref.current = model9;

      // Optical Continuity Laser Pulse (Stage 8 and 11)
      const pulseGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0x83b9a9,
        transparent: true,
        opacity: 0.9,
      });
      const opticalPulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      opticalPulseMesh.position.set(-45, -19.4, -6);
      opticalPulseMesh.visible = false;
      scene.add(opticalPulseMesh);
      opticalPulseMeshRef.current = opticalPulseMesh;

      // 4. Primary Subsea Vehicle: Work-Class ROV
      const rovGroup = new THREE.Group();
      // Starts at surface deployment location
      rovGroup.position.set(0, 0.5, 6.0);
      scene.add(rovGroup);
      rovGroupRef.current = rovGroup;

      // Syntactic Foam Pack (Offshore Yellow)
      const foamGeo = new THREE.BoxGeometry(1.4, 0.32, 1.8);
      const foamMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.35,
        metalness: 0.2,
      });
      const foam = new THREE.Mesh(foamGeo, foamMat);
      foam.position.y = 0.45;
      foam.castShadow = true;
      rovGroup.add(foam);

      // Structural Spaceframe Chassis
      const chassisGeo = new THREE.BoxGeometry(1.36, 0.72, 1.76);
      const chassisMat = new THREE.MeshStandardMaterial({
        color: 0x454640,
        roughness: 0.3,
        metalness: 0.8,
      });
      const chassis = new THREE.Mesh(chassisGeo, chassisMat);
      chassis.castShadow = true;
      rovGroup.add(chassis);

      // Hydraulic Thrusters
      const thrusterGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.32, 16);
      const thrusterMat = new THREE.MeshStandardMaterial({
        color: 0x687b59,
        metalness: 0.8,
        roughness: 0.25,
      });
      const addThrusterPod = (x: number, y: number, z: number, rx: number, ry: number) => {
        const pod = new THREE.Mesh(thrusterGeo, thrusterMat);
        pod.position.set(x, y, z);
        pod.rotation.set(rx, ry, 0);
        pod.castShadow = true;
        rovGroup.add(pod);
      };
      addThrusterPod(-0.76, 0, 0.65, 0, Math.PI / 4);
      addThrusterPod(0.76, 0, 0.65, 0, -Math.PI / 4);
      addThrusterPod(-0.76, 0, -0.65, 0, -Math.PI / 4);
      addThrusterPod(0.76, 0, -0.65, 0, Math.PI / 4);
      addThrusterPod(-0.45, 0.32, 0, Math.PI / 2, 0);
      addThrusterPod(0.45, 0.32, 0, Math.PI / 2, 0);

      // Model 12 Inspection Equipment
      const model12 = new Model12InspectionEquipment();
      model12.group.position.set(0, -0.15, 0.95);
      rovGroup.add(model12.group);
      model12Ref.current = model12;

      // Dynamic Umbilical Tether Cable
      const initialTetherCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.5, 6.0),
        new THREE.Vector3(-0.3, 0.2, 5.8),
        new THREE.Vector3(0.2, 0.0, 5.9),
        new THREE.Vector3(0, 0.5, 6.0),
      ]);
      const tetherGeo = new THREE.TubeGeometry(initialTetherCurve, 32, 0.035, 8, false);
      const tetherMat = new THREE.MeshStandardMaterial({ color: 0xe99a65, roughness: 0.5 });
      const tetherMesh = new THREE.Mesh(tetherGeo, tetherMat);
      scene.add(tetherMesh);
      tetherMeshRef.current = tetherMesh;

      // Marine Snow Particles
      const snowCount = 400;
      const snowGeo = new THREE.BufferGeometry();
      const snowPos = new Float32Array(snowCount * 3);
      for (let i = 0; i < snowCount; i++) {
        snowPos[i * 3] = (Math.random() - 0.5) * 36;
        snowPos[i * 3 + 1] = -Math.random() * 20;
        snowPos[i * 3 + 2] = (Math.random() - 0.5) * 36;
      }
      snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
      const snowMat = new THREE.PointsMaterial({
        color: 0x83b9a9,
        size: 0.08,
        transparent: true,
        opacity: 0.5,
      });
      const marineSnow = new THREE.Points(snowGeo, snowMat);
      scene.add(marineSnow);
      marineSnowRef.current = marineSnow;

      // Resize Handler
      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener('resize', handleResize);

      // Animation Loop
      let animId: number;
      const clock = new THREE.Clock();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const timeMs = clock.getElapsedTime() * 1000;

        // 1. Compute Continuous Motion of ROV from Ship (Surface) to Cable (Seabed)
        if (rovGroupRef.current) {
          let targetROVX = 0;
          let targetROVY = -17.2;
          let targetROVZ = 1.8;
          let targetPitch = 0;

          const stage = stageStateRef.current;
          const progress = THREE.MathUtils.clamp(progressStateRef.current, 0, 1);

          if (stage === 0) {
            // Stage 0: Surface Dispatch & Deployment from Ship (y: 0.5 -> -4.0, z: 6.0 -> 5.0)
            targetROVX = 0;
            targetROVY = THREE.MathUtils.lerp(0.5, -4.0, progress);
            targetROVZ = THREE.MathUtils.lerp(6.0, 5.0, progress);
            targetPitch = THREE.MathUtils.lerp(0.0, -0.35, Math.min(1.0, progress * 1.8));
          } else if (stage === 1) {
            // Stage 1: Water Column Descent down to Seabed Cable (y: -4.0 -> -17.2, z: 5.0 -> 1.8)
            targetROVX = Math.sin(progress * Math.PI * 2) * 0.35;
            targetROVY = THREE.MathUtils.lerp(-4.0, -17.2, progress);
            targetROVZ = THREE.MathUtils.lerp(5.0, 1.8, progress);
            targetPitch = THREE.MathUtils.lerp(-0.35, 0.0, Math.pow(progress, 0.7));
          } else if (stage >= 2 && stage <= 8) {
            // Active cable repair & inspection position at seabed
            targetROVX = 0;
            targetROVY = -17.2 + Math.sin(timeMs * 0.0015) * 0.06;
            targetROVZ = 1.8;
            targetPitch = Math.sin(timeMs * 0.001) * 0.02;
          } else {
            // Post-repair inspection hover
            targetROVX = 0;
            targetROVY = -16.2 + Math.sin(timeMs * 0.0015) * 0.06;
            targetROVZ = 2.2;
            targetPitch = Math.sin(timeMs * 0.001) * 0.015;
          }

          // Smooth interpolation
          rovGroupRef.current.position.x = THREE.MathUtils.lerp(rovGroupRef.current.position.x, targetROVX, 0.08);
          rovGroupRef.current.position.y = THREE.MathUtils.lerp(rovGroupRef.current.position.y, targetROVY, 0.08);
          rovGroupRef.current.position.z = THREE.MathUtils.lerp(rovGroupRef.current.position.z, targetROVZ, 0.08);
          rovGroupRef.current.rotation.x = THREE.MathUtils.lerp(rovGroupRef.current.rotation.x, targetPitch, 0.08);

          // 2. Dynamic Tether Umbilical connecting Surface Ship origin to ROV
          if (tetherMeshRef.current) {
            const p0 = new THREE.Vector3(0, 0.5, 6.0); // Surface ship origin
            const rovP = rovGroupRef.current.position;
            const p3 = new THREE.Vector3(rovP.x, rovP.y + 0.45, rovP.z);
            const midY = (p0.y + p3.y) * 0.5;
            const p1 = new THREE.Vector3(-0.9, midY + 1.2, (p0.z + p3.z) * 0.6 + 0.3);
            const p2 = new THREE.Vector3(0.6, midY - 1.2, (p0.z + p3.z) * 0.4 - 0.2);
            const tCurve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
            tetherMeshRef.current.geometry.dispose();
            tetherMeshRef.current.geometry = new THREE.TubeGeometry(tCurve, 32, 0.035, 8, false);
          }

          // 3. Dynamic Camera Tracking in ROV Cam
          if (perspectiveState === 'ROV Cam') {
            const rovP = rovGroupRef.current.position;
            targetCamPos.current.set(rovP.x, rovP.y + 1.1, rovP.z + 2.8);
            targetLookAt.current.set(rovP.x, rovP.y - 0.2, rovP.z - 2.5);
          }
        }

        // Camera Smooth Lerp
        camera.position.lerp(targetCamPos.current, 0.05);
        camera.lookAt(targetLookAt.current);

        // 4. Update Model 12 Inspection Equipment
        if (model12Ref.current) {
          const isScanning = stageStateRef.current === 2 || stageStateRef.current === 3;
          model12Ref.current.update(timeMs, isScanning);
        }

        // 5. Update Model 9 Splicing Assembly (Universal Joint Fixing Animation)
        if (model9Ref.current) {
          let model9Progress = 0;
          if (stageStateRef.current >= 5 && stageStateRef.current <= 7) {
            model9Progress = (stageStateRef.current - 5 + progressStateRef.current) / 3.0;
          } else if (stageStateRef.current > 7) {
            model9Progress = 1.0;
          }
          model9Ref.current.update(model9Progress, timeMs);
        }

        // 6. Optical Pulse traveling along cable on Stage 8 and Stage 11
        if (opticalPulseMeshRef.current) {
          if (stageStateRef.current === 8 || stageStateRef.current === 11) {
            opticalPulseMeshRef.current.visible = true;
            opticalPulsePosRef.current = (opticalPulsePosRef.current + 0.015) % 1.0;
            const px = -45 + opticalPulsePosRef.current * 90;
            const pz = (px / 45) * 6;
            opticalPulseMeshRef.current.position.set(px, -19.4, pz);
          } else {
            opticalPulseMeshRef.current.visible = false;
          }
        }

        // 7. Marine Snow Drift
        if (marineSnowRef.current) {
          const positions = marineSnowRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 1; i < positions.length; i += 3) {
            positions[i] -= 0.01;
            if (positions[i] < -20) positions[i] = 0;
          }
          marineSnowRef.current.geometry.attributes.position.needsUpdate = true;
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        if (model9Ref.current) model9Ref.current.dispose();
        if (model12Ref.current) model12Ref.current.dispose();
        renderer.dispose();
      };
    }, [perspectiveState]);

    return (
      <div ref={containerRef} className="relative w-full h-full min-h-[580px] bg-[#021324] overflow-hidden select-none font-sans">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top-Left Perspective Navigation Toolbar (PARJANYAḤ Light Theme, Modern Sans) */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-[#F7F3EA]/95 backdrop-blur-md px-3 py-2 rounded-xl border border-[#D4C4A8] shadow-md">
          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#454640] px-2 py-0.5 rounded bg-[#E8D9BF] border border-[#D4C4A8]">
            View Camera
          </span>
          {(['ROV Cam', 'Macro Splice', 'Orbit', 'Surface Vessel'] as CameraPerspective[]).map((persp) => (
            <button
              key={persp}
              onClick={() => {
                setPerspectiveState(persp);
                updateCameraTargets(persp);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                perspectiveState === persp
                  ? 'bg-[#83B9A9] text-[#454640] font-bold shadow-xs'
                  : 'bg-white/90 text-[#454640] hover:bg-[#E8D9BF] border border-[#D4C4A8]'
              }`}
            >
              {persp}
            </button>
          ))}
        </div>

        {/* Top-Right Telemetry & Environment HUD */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 bg-[#F7F3EA]/95 backdrop-blur-md px-4 py-3 rounded-xl border border-[#D4C4A8] shadow-md font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C87954] animate-pulse" />
            <span className="text-xs uppercase tracking-wider text-[#454640] font-bold">
              Subsea Digital Twin
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#A69B89] text-right">
            <span>Bathymetry Depth:</span>
            <span className="text-[#454640] font-mono font-bold">4,820 m</span>
            <span>Hydrostatic Pressure:</span>
            <span className="text-[#454640] font-mono font-bold">48.2 MPa</span>
            <span>Water Temperature:</span>
            <span className="text-[#454640] font-mono font-bold">1.8 °C</span>
            <span>Status:</span>
            <span className="text-[#687B59] font-bold">
              ROV LINKED & ACTIVE
            </span>
          </div>
        </div>

        {/* Bottom-Left Real-Time Operational Sequence Monitor */}
        <div className="absolute bottom-4 left-4 z-20 bg-[#F7F3EA]/95 backdrop-blur-md px-4 py-3 rounded-xl border border-[#D4C4A8] shadow-md max-w-sm font-sans">
          <div className="text-[11px] uppercase tracking-wider text-[#A69B89] mb-1 font-semibold">
            Physical Repair Timeline
          </div>
          <div className="text-sm font-bold text-[#454640] flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#83B9A9] text-[#454640] font-mono text-xs font-bold border border-[#687B59]/30">
              STAGE {stageState} / 11
            </span>
            <span className="text-xs font-medium">
              {stageState <= 0 && 'Surface Dispatch & ROV Deployment'}
              {stageState === 1 && 'Water Column Descent & Cable Approach'}
              {stageState === 2 && 'Benthic Survey & Multibeam Sonar Scan'}
              {stageState === 3 && 'Manipulator Alignment & Clamping'}
              {stageState === 4 && 'Cable Bight Lift & Preparation'}
              {stageState === 5 && 'Model 9 Fiber Cleave & Core Alignment'}
              {stageState === 6 && 'High-Voltage Fusion Arc Splicing'}
              {stageState === 7 && 'Universal Joint Pressure Sealing'}
              {stageState === 8 && 'OTDR Optical Continuity Pulse'}
              {stageState >= 9 && stageState <= 10 && 'Benthic Lay & Seabed Reburial'}
              {stageState === 11 && 'Network Restoration Confirmed'}
            </span>
          </div>
        </div>
      </div>
    );
  }
);

UnderwaterScene.displayName = 'UnderwaterScene';

export { UnderwaterScene };
export default UnderwaterScene;
