'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Model9SplicingAssembly } from '@/lib/3d/models/Model9SplicingAssembly';
import { Model12InspectionEquipment } from '@/lib/3d/models/Model12InspectionEquipment';
import { FaultIncident } from '@/lib/types';

export type CameraPerspective = string;

export interface UnderwaterSceneHandle {
  setPerspective?: (perspective: string) => void;
  setSimulationStage: (stageIndex: number, stageProgress: number) => void;
  captureFrame: () => string;
  setDepthLevel?: (depthMeters: number) => void;
}

interface UnderwaterSceneProps {
  activeFault: FaultIncident;
  currentStage?: number;
  stageProgress?: number;
  isGhostMode?: boolean;
}

const UnderwaterScene = forwardRef<UnderwaterSceneHandle, UnderwaterSceneProps>(
  (
    {
      activeFault,
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

    // Asset References
    const shipGroupRef = useRef<THREE.Group | null>(null);
    const rovGroupRef = useRef<THREE.Group | null>(null);
    const model12Ref = useRef<Model12InspectionEquipment | null>(null);
    const model9Ref = useRef<Model9SplicingAssembly | null>(null);
    const opticalPulseMeshRef = useRef<THREE.Mesh | null>(null);
    const opticalPulsePosRef = useRef<number>(0);
    const tetherMeshRef = useRef<THREE.Mesh | null>(null);
    const marineSnowRef = useRef<THREE.Points | null>(null);

    // Camera targets (driven by narrative sequence)
    const targetCamPos = useRef(new THREE.Vector3(10, 4.5, 16));
    const targetLookAt = useRef(new THREE.Vector3(0, 0.8, 6.0));

    // Drag Orbit tracking
    const isDragging = useRef(false);
    const prevMousePos = useRef({ x: 0, y: 0 });
    const orbitOffset = useRef(new THREE.Vector2(0, 0));

    // Internal simulation stage state
    const [stageState, setStageState] = useState(currentStage);
    const [progressState, setProgressState] = useState(stageProgress);
    const stageStateRef = useRef(currentStage);
    const progressStateRef = useRef(stageProgress);

    useEffect(() => {
      stageStateRef.current = stageState;
      progressStateRef.current = progressState;
    }, [stageState, progressState]);

    // Expose imperative handle methods
    useImperativeHandle(ref, () => ({
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
        if (cameraRef.current && stageStateRef.current <= 1) {
          const y = -(depthMeters / 4820) * 16.0;
          targetCamPos.current.y = THREE.MathUtils.lerp(4.5, -14.0, depthMeters / 4820);
        }
      },
    }));

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

      // Oceanic atmosphere (deep blue water interior for simulation)
      scene.background = new THREE.Color(0x021424);
      scene.fog = new THREE.FogExp2(0x03192c, 0.016);

      const camera = new THREE.PerspectiveCamera(
        46,
        container.clientWidth / container.clientHeight,
        0.1,
        350
      );
      camera.position.set(10, 4.5, 16);
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
      renderer.toneMappingExposure = 1.35;
      rendererRef.current = renderer;

      // 2. Multi-Directional Lighting (Surface daylight + ambient + benthic repair spotlights)
      const sunLight = new THREE.DirectionalLight(0xfffbeb, 4.0);
      sunLight.position.set(18, 40, 24);
      sunLight.castShadow = true;
      scene.add(sunLight);

      const skyLight = new THREE.HemisphereLight(0x7dd3fc, 0x0c314f, 2.4);
      scene.add(skyLight);

      const ambientLight = new THREE.AmbientLight(0x08253d, 2.2);
      scene.add(ambientLight);

      // Benthic key spotlight illuminating the damaged cable zone
      const benthicKeyLight = new THREE.SpotLight(0xfff7ed, 6.8, 45, Math.PI / 3.2, 0.45, 1.1);
      benthicKeyLight.position.set(0, -11, 6);
      benthicKeyLight.target.position.set(0, -19.2, 0);
      benthicKeyLight.castShadow = true;
      scene.add(benthicKeyLight);
      scene.add(benthicKeyLight.target);

      // 3. Seabed Baseline for Cable
      const seafloorGeo = new THREE.PlaneGeometry(140, 140, 48, 48);
      seafloorGeo.rotateX(-Math.PI / 2);
      const seafloorMat = new THREE.MeshStandardMaterial({
        color: 0x162432,
        roughness: 0.9,
        metalness: 0.1,
      });
      const seafloorMesh = new THREE.Mesh(seafloorGeo, seafloorMat);
      seafloorMesh.position.y = -19.5;
      seafloorMesh.receiveShadow = true;
      scene.add(seafloorMesh);

      // 4. Physical Submarine Fiber Optic Cable on Seafloor
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

      // 5. Surface Repair Ship (cargo-ship.glb)
      const shipGroup = new THREE.Group();
      shipGroup.position.set(0, 0.25, 6.0);
      scene.add(shipGroup);
      shipGroupRef.current = shipGroup;

      const gltfLoader = new GLTFLoader();
      gltfLoader.load(
        '/models/cargo-ship.glb',
        (gltf) => {
          const shipModel = gltf.scene;
          shipModel.scale.setScalar(0.14);
          shipModel.position.set(0, 0, 0);
          shipModel.rotation.y = Math.PI / 2;
          shipModel.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          shipGroup.add(shipModel);
        },
        undefined,
        (err) => {
          console.warn('Could not load cargo-ship.glb, using vessel hull fallback:', err);
          // Clean vessel hull fallback
          const hullGeo = new THREE.BoxGeometry(2.4, 1.2, 5.8);
          const hullMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
          const hull = new THREE.Mesh(hullGeo, hullMat);
          shipGroup.add(hull);
        }
      );

      // 6. Primary Subsea Vehicle: Work-Class ROV
      const rovGroup = new THREE.Group();
      // Starts on the ship launch davit at surface
      rovGroup.position.set(0.6, 1.3, 5.2);
      scene.add(rovGroup);
      rovGroupRef.current = rovGroup;

      // Syntactic Foam Pack (High-Visibility Offshore Yellow)
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

      // Forward sensor headlights
      const rovHeadlight = new THREE.SpotLight(0xfff7ed, 4.5, 18, Math.PI / 4, 0.5);
      rovHeadlight.position.set(0, 0, 0.9);
      rovHeadlight.target.position.set(0, -0.5, 3.5);
      rovGroup.add(rovHeadlight);
      rovGroup.add(rovHeadlight.target);

      // Model 12 Inspection Equipment
      const model12 = new Model12InspectionEquipment();
      model12.group.position.set(0, -0.15, 0.95);
      rovGroup.add(model12.group);
      model12Ref.current = model12;

      // 7. Dynamic Umbilical Tether Line (Reeling from ship to ROV)
      const initialTetherCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.6, 1.4, 5.2),
        new THREE.Vector3(0.6, 1.35, 5.2),
      ]);
      const tetherGeo = new THREE.TubeGeometry(initialTetherCurve, 16, 0.035, 8, false);
      const tetherMat = new THREE.MeshStandardMaterial({ color: 0xe99a65, roughness: 0.5 });
      const tetherMesh = new THREE.Mesh(tetherGeo, tetherMat);
      scene.add(tetherMesh);
      tetherMeshRef.current = tetherMesh;

      // Marine Snow Particles in water column
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

      // Mouse Drag Controls for free 3D viewing
      const handlePointerDown = (e: PointerEvent) => {
        isDragging.current = true;
        prevMousePos.current = { x: e.clientX, y: e.clientY };
      };

      const handlePointerMove = (e: PointerEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - prevMousePos.current.x;
        const dy = e.clientY - prevMousePos.current.y;
        prevMousePos.current = { x: e.clientX, y: e.clientY };

        orbitOffset.current.x += dx * 0.006;
        orbitOffset.current.y = Math.max(-1.2, Math.min(1.2, orbitOffset.current.y + dy * 0.006));
      };

      const handlePointerUp = () => {
        isDragging.current = false;
      };

      canvas.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);

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

        const stage = stageStateRef.current;
        const progress = THREE.MathUtils.clamp(progressStateRef.current, 0, 1);

        // A. Ship gentle surface heave & sway
        if (shipGroupRef.current) {
          const heave = 0.25 + Math.sin(timeMs * 0.001) * 0.08;
          const pitch = Math.sin(timeMs * 0.0008) * 0.02;
          const roll = Math.cos(timeMs * 0.0006) * 0.025;
          shipGroupRef.current.position.y = heave;
          shipGroupRef.current.rotation.x = pitch;
          shipGroupRef.current.rotation.z = roll;
        }

        // B. Cinematic Narrative: Ship -> Release ROV into Water -> Work on Cable
        let targetROVX = 0;
        let targetROVY = -17.2;
        let targetROVZ = 1.8;
        let targetPitch = 0;

        if (stage === 0) {
          // STEP 1 & 2: Show Ship and releasing ROV into water from the aft davit
          // ROV lowers from ship deck (0.6, 1.3, 5.2) down through the surface into the water (0, -2.5, 5.6)
          targetROVX = THREE.MathUtils.lerp(0.6, 0.0, progress);
          targetROVY = THREE.MathUtils.lerp(1.3, -2.5, progress);
          targetROVZ = THREE.MathUtils.lerp(5.2, 5.6, progress);
          targetPitch = THREE.MathUtils.lerp(0.0, -0.28, Math.min(1.0, progress * 1.5));

          // Camera frames the ship and the ROV being released into the water
          targetCamPos.current.set(
            11 + orbitOffset.current.x * 5,
            4.0 + orbitOffset.current.y * 4,
            16
          );
          targetLookAt.current.set(0, 0.4, 5.8);
        } else if (stage === 1) {
          // STEP 2: ROV descending through water column down to seabed cable
          targetROVX = Math.sin(progress * Math.PI * 2) * 0.3;
          targetROVY = THREE.MathUtils.lerp(-2.5, -17.2, progress);
          targetROVZ = THREE.MathUtils.lerp(5.6, 1.8, progress);
          targetPitch = THREE.MathUtils.lerp(-0.28, 0.0, Math.pow(progress, 0.7));

          // Camera smoothly descends along with the ROV
          const camY = THREE.MathUtils.lerp(3.0, -15.5, progress) + orbitOffset.current.y * 3;
          const camZ = THREE.MathUtils.lerp(14.0, 5.5, progress);
          targetCamPos.current.set(8 + orbitOffset.current.x * 4, camY, camZ);
          targetLookAt.current.set(targetROVX, targetROVY, targetROVZ);
        } else if (stage >= 2 && stage <= 8) {
          // STEP 3: ROV actively working on the cable!
          targetROVX = 0;
          targetROVY = -17.2 + Math.sin(timeMs * 0.0015) * 0.05;
          targetROVZ = 1.8;
          targetPitch = Math.sin(timeMs * 0.001) * 0.015;

          // Camera immersively frames the ROV and the cable joint
          targetCamPos.current.set(
            3.5 + orbitOffset.current.x * 4,
            -16.5 + orbitOffset.current.y * 3,
            4.8
          );
          targetLookAt.current.set(0, -18.8, 0.2);
        } else {
          // Post-repair inspection hover
          targetROVX = 0;
          targetROVY = -16.2 + Math.sin(timeMs * 0.0015) * 0.05;
          targetROVZ = 2.2;
          targetPitch = Math.sin(timeMs * 0.001) * 0.015;

          targetCamPos.current.set(
            6.0 + orbitOffset.current.x * 4,
            -15.0 + orbitOffset.current.y * 3,
            6.5
          );
          targetLookAt.current.set(0, -18.6, 0.5);
        }

        // Interpolate ROV position & rotation
        if (rovGroupRef.current) {
          rovGroupRef.current.position.x = THREE.MathUtils.lerp(rovGroupRef.current.position.x, targetROVX, 0.08);
          rovGroupRef.current.position.y = THREE.MathUtils.lerp(rovGroupRef.current.position.y, targetROVY, 0.08);
          rovGroupRef.current.position.z = THREE.MathUtils.lerp(rovGroupRef.current.position.z, targetROVZ, 0.08);
          rovGroupRef.current.rotation.x = THREE.MathUtils.lerp(rovGroupRef.current.rotation.x, targetPitch, 0.08);

          // Dynamic Umbilical Tether Line unreeling from ship winch (0, 0.8, 5.0) down to ROV
          if (tetherMeshRef.current) {
            const p0 = new THREE.Vector3(0, 0.8, 5.2); // Ship winch origin
            const rovP = rovGroupRef.current.position;
            const p3 = new THREE.Vector3(rovP.x, rovP.y + 0.45, rovP.z);
            const midY = (p0.y + p3.y) * 0.5;
            const p1 = new THREE.Vector3(-0.7, midY + 1.0, (p0.z + p3.z) * 0.55 + 0.3);
            const p2 = new THREE.Vector3(0.5, midY - 1.0, (p0.z + p3.z) * 0.45 - 0.2);
            const tCurve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
            tetherMeshRef.current.geometry.dispose();
            tetherMeshRef.current.geometry = new THREE.TubeGeometry(tCurve, 32, 0.035, 8, false);
          }
        }

        // Smooth Camera Movement
        camera.position.lerp(targetCamPos.current, 0.05);
        camera.lookAt(targetLookAt.current);

        // Model 12 Inspection Equipment forward multibeam sweep
        if (model12Ref.current) {
          const isScanning = stage >= 2 && stage <= 4;
          model12Ref.current.update(timeMs, isScanning);
        }

        // Model 9 Splicing Assembly (Universal Joint Fixing Animation)
        if (model9Ref.current) {
          let model9Progress = 0;
          if (stage >= 5 && stage <= 7) {
            model9Progress = (stage - 5 + progress) / 3.0;
          } else if (stage > 7) {
            model9Progress = 1.0;
          }
          model9Ref.current.update(model9Progress, timeMs);
        }

        // Optical Pulse traveling along cable on Stage 8 and Stage 11
        if (opticalPulseMeshRef.current) {
          if (stage === 8 || stage === 11) {
            opticalPulseMeshRef.current.visible = true;
            opticalPulsePosRef.current = (opticalPulsePosRef.current + 0.015) % 1.0;
            const px = -45 + opticalPulsePosRef.current * 90;
            const pz = (px / 45) * 6;
            opticalPulseMeshRef.current.position.set(px, -19.4, pz);
          } else {
            opticalPulseMeshRef.current.visible = false;
          }
        }

        // Marine Snow Drift
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
        canvas.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        if (model9Ref.current) model9Ref.current.dispose();
        if (model12Ref.current) model12Ref.current.dispose();
        renderer.dispose();
      };
    }, []);

    return (
      <div ref={containerRef} className="relative w-full h-full min-h-[580px] bg-[#021424] overflow-hidden select-none font-sans">
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

        {/* Narrative Phase Status Pill (Top Left - No Clunky View Buttons) */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 bg-[#F7F3EA]/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#D4C4A8] shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C87954] animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#454640]">
              {stageState === 0 && 'Surface Ship · ROV Release'}
              {stageState === 1 && 'Subsea Descent · Transit to Seabed'}
              {stageState >= 2 && stageState <= 4 && 'Benthic Survey · Multibeam Cable Scan'}
              {stageState >= 5 && stageState <= 7 && 'Cable Joint · Fusion Arc Splice'}
              {stageState >= 8 && 'Network Continuity · Testing & Restoration'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E8D9BF] text-[#454640] font-semibold border border-[#D4C4A8]">
              Drag to Orbit View
            </span>
          </div>
        </div>

        {/* Top-Right Telemetry & Environment HUD */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5 bg-[#F7F3EA]/95 backdrop-blur-md px-4 py-3 rounded-xl border border-[#D4C4A8] shadow-md font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#83B9A9]" />
            <span className="text-xs uppercase tracking-wider text-[#454640] font-bold">
              Subsea Digital Twin
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#A69B89] text-right">
            <span>Surface Vessel:</span>
            <span className="text-[#454640] font-bold">CS Sovereign (DP2)</span>
            <span>Target Depth:</span>
            <span className="text-[#454640] font-mono font-bold">-{activeFault.depthMeters} m</span>
            <span>Hydrostatic Pressure:</span>
            <span className="text-[#454640] font-mono font-bold">{(activeFault.depthMeters * 0.01).toFixed(1)} MPa</span>
            <span>Status:</span>
            <span className="text-[#687B59] font-bold">
              {stageState === 0 ? 'DEPLOYING ROV' : stageState === 1 ? 'DESCENT IN PROGRESS' : 'ACTIVE ON CABLE'}
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
              {stageState <= 0 && 'Surface Vessel Releases ROV into Water'}
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
