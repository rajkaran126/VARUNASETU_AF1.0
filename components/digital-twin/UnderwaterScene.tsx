"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { loadSubseaAssets } from '@/lib/3d/asset-loader';
import { Model9SplicingAssembly } from '@/lib/3d/models/Model9SplicingAssembly';
import { Model12InspectionEquipment } from '@/lib/3d/models/Model12InspectionEquipment';

export type CameraPerspective = 'ROV Cam' | 'Macro Splice' | 'Orbit' | 'Surface Vessel';

export interface UnderwaterSceneHandle {
  setPerspective: (perspective: CameraPerspective) => void;
  setSimulationStage: (stage: number, progress: number) => void;
  captureFrame: () => string;
  setDepthLevel: (depthMeters: number) => void;
}

interface UnderwaterSceneProps {
  currentStage?: number;
  stageProgress?: number;
  activePerspective?: CameraPerspective;
  isGhostModeActive?: boolean;
  isGhostMode?: boolean;
  activeFault?: any;
}

const UnderwaterScene = forwardRef<UnderwaterSceneHandle, UnderwaterSceneProps>(
  (
    {
      currentStage = 0,
      stageProgress = 0,
      activePerspective = 'Orbit',
      isGhostModeActive = false,
      isGhostMode = false,
      activeFault,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Three.js core references
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

    // Dynamic scene elements
    const rovGroupRef = useRef<THREE.Group | null>(null);
    const roboticArmRef = useRef<THREE.Group | null>(null);
    const craneHookRef = useRef<THREE.Group | null>(null);
    const hoistCableRef = useRef<THREE.Mesh | null>(null);
    const vesselGroupRef = useRef<THREE.Group | null>(null);
    const model9Ref = useRef<Model9SplicingAssembly | null>(null);
    const model12Ref = useRef<Model12InspectionEquipment | null>(null);
    const opticalPulseMeshRef = useRef<THREE.Mesh | null>(null);
    const opticalPulsePosRef = useRef<number>(0);
    const marineSnowRef = useRef<THREE.Points | null>(null);
    const oceanSurfaceMeshRef = useRef<THREE.Mesh | null>(null);
    const daylightSunRef = useRef<THREE.DirectionalLight | null>(null);
    const skyHemiLightRef = useRef<THREE.HemisphereLight | null>(null);

    // Camera targets
    const targetCamPos = useRef(new THREE.Vector3(12, -14, 15));
    const targetLookAt = useRef(new THREE.Vector3(0, -19.0, 0));

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

    const [assetsLoaded, setAssetsLoaded] = useState(false);

    // Update targets on perspective change
    const updateCameraTargets = (persp: CameraPerspective) => {
      switch (persp) {
        case 'Surface Vessel':
          // Daylight Surface View framing the ship in full daylight
          targetCamPos.current.set(18, 5.5, 24);
          targetLookAt.current.set(0, 0.8, 6);
          break;
        case 'ROV Cam':
          // ROV First-person pilot view over inspection sensors
          targetCamPos.current.set(0, -16.2, 4.2);
          targetLookAt.current.set(0, -18.8, 0.5);
          break;
        case 'Macro Splice':
          // Macro inspection view right in front of Model 9 with seabed background
          targetCamPos.current.set(0, -18.5, 1.6);
          targetLookAt.current.set(0, -19.0, 0);
          break;
        case 'Orbit':
        default:
          // Dramatic operational orbit framing the repair within the seabed canyon
          targetCamPos.current.set(12, -13.5, 15);
          targetLookAt.current.set(0, -19.0, 0);
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
        if (cameraRef.current && perspectiveState !== 'Macro Splice' && perspectiveState !== 'ROV Cam') {
          // Map depth 0 to 4820m to y: 0 to -19.0
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

      // Atmospheric Color Scheme: Transitions dynamically from Daylight Sky to Deep Abyssal Blue
      const initialSkyColor = new THREE.Color(0x03182b);
      scene.background = initialSkyColor;
      const sceneFog = new THREE.FogExp2(0x04213d, 0.018);
      scene.fog = sceneFog;

      const camera = new THREE.PerspectiveCamera(
        48,
        container.clientWidth / container.clientHeight,
        0.1,
        350
      );
      camera.position.set(12, -13.5, 15);
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

      // 2. Multi-Tier Lighting: Daylight Sun at Surface + Oceanic Ambient + Benthic Spotlights
      // A. Surface Daylight Sun
      const daylightSun = new THREE.DirectionalLight(0xfffbeb, 4.2);
      daylightSun.position.set(25, 45, 30);
      daylightSun.castShadow = true;
      daylightSun.shadow.mapSize.width = 2048;
      daylightSun.shadow.mapSize.height = 2048;
      daylightSun.shadow.camera.near = 1;
      daylightSun.shadow.camera.far = 120;
      daylightSun.shadow.camera.left = -40;
      daylightSun.shadow.camera.right = 40;
      daylightSun.shadow.camera.top = 40;
      daylightSun.shadow.camera.bottom = -40;
      scene.add(daylightSun);
      daylightSunRef.current = daylightSun;

      // Daylight sky hemisphere light
      const skyHemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x075985, 2.2);
      scene.add(skyHemiLight);
      skyHemiLightRef.current = skyHemiLight;

      // B. Ambient oceanic radiance (ensures objects are clearly visible, never pitch black)
      const ambientLight = new THREE.AmbientLight(0x0b3a62, 2.6);
      scene.add(ambientLight);

      // C. Deep water sunlight shafts penetrating down to seabed
      const downwellingLight = new THREE.DirectionalLight(0x2dd4bf, 2.0);
      downwellingLight.position.set(8, 30, 10);
      scene.add(downwellingLight);

      // D. Deep trench benthic key spotlight illuminating repair area
      const benthicKeyLight = new THREE.SpotLight(0xebf8ff, 7.0, 45, Math.PI / 3.2, 0.45, 1.1);
      benthicKeyLight.position.set(0, -11, 6);
      benthicKeyLight.target.position.set(0, -19.2, 0);
      benthicKeyLight.castShadow = true;
      scene.add(benthicKeyLight);
      scene.add(benthicKeyLight.target);

      // E. Wide-angle backdrop wash lights highlighting the underlying sea environment
      const backdropWashLeft = new THREE.SpotLight(0x13bfd3, 4.5, 55, Math.PI / 2.8, 0.5);
      backdropWashLeft.position.set(-18, -10, -5);
      backdropWashLeft.target.position.set(-15, -19.5, -15);
      scene.add(backdropWashLeft);
      scene.add(backdropWashLeft.target);

      const backdropWashRight = new THREE.SpotLight(0x0284c7, 4.2, 55, Math.PI / 2.8, 0.5);
      backdropWashRight.position.set(18, -10, -5);
      backdropWashRight.target.position.set(15, -19.5, -15);
      scene.add(backdropWashRight);
      scene.add(backdropWashRight.target);

      // 3. Daytime Ocean Water Surface Plane at y = 0
      const waterGeo = new THREE.PlaneGeometry(160, 160, 64, 64);
      waterGeo.rotateX(-Math.PI / 2);
      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.1,
        metalness: 0.35,
        transparent: true,
        opacity: 0.78,
      });
      const waterMesh = new THREE.Mesh(waterGeo, waterMat);
      waterMesh.position.y = 0;
      waterMesh.receiveShadow = true;
      scene.add(waterMesh);
      oceanSurfaceMeshRef.current = waterMesh;

      // 4. Underlying Sea Environment (Seabed Bathymetry at y = -19.5)
      const floorGeo = new THREE.PlaneGeometry(140, 140, 96, 96);
      floorGeo.rotateX(-Math.PI / 2);
      // Realistic bathymetric displacement: submarine canyon trench along x-axis
      const posAttr = floorGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);
        // Central trench depression near z ~ 0
        const trench = -Math.exp(-(z * z) / 45.0) * 1.5;
        // Natural undulating abyssal silt dunes and rocky rises
        const dune =
          Math.sin(x * 0.12) * Math.cos(z * 0.1) * 0.7 +
          Math.sin(x * 0.28 + z * 0.2) * 0.3;
        posAttr.setY(i, trench + dune);
      }
      floorGeo.computeVertexNormals();

      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x182a3a,
        roughness: 0.88,
        metalness: 0.12,
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.y = -19.5;
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);

      // 5. Physical Submarine Fiber Optic Cable on Seafloor
      const createSeafloorCable = (points: THREE.Vector3[], color: number) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.12, 16, false);
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

      // Left cable segment (from landing station towards fault)
      const leftCablePoints = [
        new THREE.Vector3(-45, -19.4, -6),
        new THREE.Vector3(-25, -19.5, -3),
        new THREE.Vector3(-12, -19.7, -1),
        new THREE.Vector3(-4, -19.6, -0.4),
        new THREE.Vector3(-0.5, -19.2, 0),
      ];
      const leftCable = createSeafloorCable(leftCablePoints, 0x1677b8);
      scene.add(leftCable);

      // Right cable segment (transoceanic route towards fault)
      const rightCablePoints = [
        new THREE.Vector3(0.5, -19.2, 0),
        new THREE.Vector3(4, -19.6, 0.4),
        new THREE.Vector3(12, -19.7, 1),
        new THREE.Vector3(25, -19.5, 3),
        new THREE.Vector3(45, -19.4, 6),
      ];
      const rightCable = createSeafloorCable(rightCablePoints, 0x1677b8);
      scene.add(rightCable);

      // Optical Data Continuity Laser Pulse (glowing photon wave traveling along cable)
      const pulseGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const opticalPulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      opticalPulseMesh.position.set(-45, -19.4, -6);
      opticalPulseMesh.visible = false;
      scene.add(opticalPulseMesh);
      opticalPulseMeshRef.current = opticalPulseMesh;

      // 6. Model 9: Submarine Cable Splicing and Joint Assembly (Universal Joint)
      const model9 = new Model9SplicingAssembly();
      model9.group.position.set(0, -19.1, 0);
      model9.group.scale.setScalar(1.25);
      scene.add(model9.group);
      model9Ref.current = model9;

      // 7. Primary Subsea Vehicle: Work-Class ROV with Model 12 Inspection Suite
      const rovGroup = new THREE.Group();
      rovGroup.position.set(0, -17.2, 1.8);
      scene.add(rovGroup);
      rovGroupRef.current = rovGroup;

      // High-Strength Synthetic Syntactic Foam Pack (High-Visibility Offshore Yellow)
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

      // Titanium Structural Spaceframe Chassis (Midnight Navy)
      const chassisGeo = new THREE.BoxGeometry(1.36, 0.72, 1.76);
      const chassisMat = new THREE.MeshStandardMaterial({
        color: 0x0b1d33,
        roughness: 0.3,
        metalness: 0.8,
      });
      const chassis = new THREE.Mesh(chassisGeo, chassisMat);
      chassis.castShadow = true;
      rovGroup.add(chassis);

      // Hydraulic Vectored Thrusters (4 Horizontal + 2 Vertical)
      const thrusterGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.32, 16);
      const thrusterMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.85,
        roughness: 0.2,
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

      // Model 12 Inspection Equipment Forward Sensor Suite
      const model12 = new Model12InspectionEquipment();
      model12.group.position.set(0, -0.15, 0.95);
      rovGroup.add(model12.group);
      model12Ref.current = model12;

      // Umbilical Tether Cable leading up through the water column to surface ship
      const tetherPoints = [
        new THREE.Vector3(0, -16.8, 1.4),
        new THREE.Vector3(-2.2, -11.0, 2.5),
        new THREE.Vector3(1.5, -5.0, 4.0),
        new THREE.Vector3(0, 0.2, 5.8),
      ];
      const tetherCurve = new THREE.CatmullRomCurve3(tetherPoints);
      const tetherGeo = new THREE.TubeGeometry(tetherCurve, 36, 0.035, 8, false);
      const tetherMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
      const tetherMesh = new THREE.Mesh(tetherGeo, tetherMat);
      scene.add(tetherMesh);

      // 8. Surface DP2 Cable Repair Vessel (CS Sovereign class, floating at y = 0.2 in Daylight)
      const vesselGroup = new THREE.Group();
      vesselGroup.position.set(0, 0.2, 6.0);
      scene.add(vesselGroup);
      vesselGroupRef.current = vesselGroup;

      // 9. Heavy Crane Hook Block & Vertical Hoist Wire
      const hoistPoints = [
        new THREE.Vector3(0, 0.5, 6.0), // From ship deck crane
        new THREE.Vector3(0, -18.2, 0), // Down to repair hook
      ];
      const hoistCurve = new THREE.CatmullRomCurve3(hoistPoints);
      const hoistGeo = new THREE.TubeGeometry(hoistCurve, 16, 0.018, 6, false);
      const hoistMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9 });
      const hoistCable = new THREE.Mesh(hoistGeo, hoistMat);
      scene.add(hoistCable);
      hoistCableRef.current = hoistCable;

      // 10. Marine Snow Particles in Water Column
      const snowCount = 450;
      const snowGeo = new THREE.BufferGeometry();
      const snowPos = new Float32Array(snowCount * 3);
      for (let i = 0; i < snowCount; i++) {
        snowPos[i * 3] = (Math.random() - 0.5) * 36;
        snowPos[i * 3 + 1] = -Math.random() * 20;
        snowPos[i * 3 + 2] = (Math.random() - 0.5) * 36;
      }
      snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
      const snowMat = new THREE.PointsMaterial({
        color: 0x93c5fd,
        size: 0.09,
        transparent: true,
        opacity: 0.55,
      });
      const marineSnow = new THREE.Points(snowGeo, snowMat);
      scene.add(marineSnow);
      marineSnowRef.current = marineSnow;

      // 11. Asynchronously Load Real 3D GLB & OBJ Assets
      loadSubseaAssets().then((assets) => {
        // A. Cargo Ship (Surface repair vessel in Daylight)
        if (assets.cargoShip && vesselGroupRef.current) {
          assets.cargoShip.scale.setScalar(0.14);
          assets.cargoShip.position.set(0, 0.25, 0);
          assets.cargoShip.rotation.y = Math.PI / 2;
          vesselGroupRef.current.add(assets.cargoShip);
        }

        // B. Crane Hook Block (Suspended from lift cable)
        if (assets.craneHook) {
          assets.craneHook.scale.setScalar(0.35);
          assets.craneHook.position.set(0, -18.2, 0);
          scene.add(assets.craneHook);
          craneHookRef.current = assets.craneHook;
        }

        // C. Articulated Robotic Manipulator (Mounted to ROV chassis)
        if (assets.roboticArm && rovGroupRef.current) {
          assets.roboticArm.scale.setScalar(0.28);
          assets.roboticArm.position.set(0.55, -0.4, 0.8);
          assets.roboticArm.rotation.set(Math.PI / 4, 0, 0);
          rovGroupRef.current.add(assets.roboticArm);
          roboticArmRef.current = assets.roboticArm;
        }

        // D. Geological Formations / Reef Walls (Underlying Sea Environment Framing the Trench)
        if (assets.reefWalls) {
          const reefL = assets.reefWalls.clone();
          reefL.scale.setScalar(0.07);
          reefL.position.set(-18, -19.5, -12);
          scene.add(reefL);

          const reefR = assets.reefWalls.clone();
          reefR.scale.setScalar(0.065);
          reefR.position.set(20, -19.5, 10);
          reefR.rotation.y = Math.PI;
          scene.add(reefR);

          // Additional background ridge backdrop
          const reefBackdrop = assets.reefWalls.clone();
          reefBackdrop.scale.setScalar(0.08);
          reefBackdrop.position.set(0, -19.2, -18);
          reefBackdrop.rotation.y = Math.PI / 2;
          scene.add(reefBackdrop);
        }

        // E. Ocean Floor OBJ Mesh if loaded
        if (assets.oceanFloorMesh) {
          assets.oceanFloorMesh.scale.setScalar(22);
          assets.oceanFloorMesh.position.set(0, -19.5, 0);
          if (assets.seafloorTexture) {
            assets.oceanFloorMesh.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                m.material = new THREE.MeshStandardMaterial({
                  map: assets.seafloorTexture || null,
                  normalMap: assets.seafloorNormal || null,
                  roughnessMap: assets.seafloorRoughness || null,
                  roughness: 0.85,
                  metalness: 0.1,
                });
                m.receiveShadow = true;
              }
            });
          }
          scene.add(assets.oceanFloorMesh);
        } else if (assets.seafloorTexture) {
          // Apply textures to procedural floor
          floorMat.map = assets.seafloorTexture || null;
          floorMat.normalMap = assets.seafloorNormal || null;
          floorMat.roughnessMap = assets.seafloorRoughness || null;
          floorMat.needsUpdate = true;
        }

        setAssetsLoaded(true);
      });

      // Window resize handler
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

        // 1. Smooth Camera Interpolation towards Target
        camera.position.lerp(targetCamPos.current, 0.05);
        const currentLookAt = new THREE.Vector3();
        camera.getWorldDirection(currentLookAt);
        currentLookAt.add(camera.position);
        currentLookAt.lerp(targetLookAt.current, 0.06);
        camera.lookAt(targetLookAt.current);

        // 2. Dynamic Daylight Atmosphere Transition based on Camera Depth
        // When camera is near sea surface (y > -5), transition to bright daylight sky and sunlight
        const surfaceT = THREE.MathUtils.clamp((camera.position.y + 7.0) / 12.0, 0, 1);
        const deepSkyColor = new THREE.Color(0x03182b);
        const daylightSkyColor = new THREE.Color(0x7dd3fc);
        scene.background = deepSkyColor.clone().lerp(daylightSkyColor, surfaceT);

        if (scene.fog) {
          (scene.fog as THREE.FogExp2).density = THREE.MathUtils.lerp(0.018, 0.003, surfaceT);
          (scene.fog as THREE.FogExp2).color.lerpColors(new THREE.Color(0x04213d), new THREE.Color(0xbae6fd), surfaceT);
        }

        if (daylightSunRef.current) {
          daylightSunRef.current.intensity = THREE.MathUtils.lerp(1.8, 5.0, surfaceT);
        }
        if (skyHemiLightRef.current) {
          skyHemiLightRef.current.intensity = THREE.MathUtils.lerp(1.0, 3.2, surfaceT);
        }

        // 3. Gentle Ocean Surface Wave Ripple Animation
        if (oceanSurfaceMeshRef.current) {
          const pos = oceanSurfaceMeshRef.current.geometry.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const wave = Math.sin(x * 0.15 + timeMs * 0.0015) * Math.cos(z * 0.12 + timeMs * 0.0012) * 0.15;
            pos.setY(i, wave);
          }
          pos.needsUpdate = true;
        }

        // 4. Surface Vessel gentle sea heave & pitch
        if (vesselGroupRef.current) {
          const heave = 0.2 + Math.sin(timeMs * 0.0012) * 0.14;
          const pitch = Math.sin(timeMs * 0.0009) * 0.025;
          const roll = Math.cos(timeMs * 0.0007) * 0.035;
          vesselGroupRef.current.position.y = heave;
          vesselGroupRef.current.rotation.x = pitch;
          vesselGroupRef.current.rotation.z = roll;
        }

        // 5. Physical Repair Sequence Driving Model Animations
        if (rovGroupRef.current) {
          let baseROVY = -17.2;
          let baseROVZ = 1.8;

          if (stageStateRef.current <= 1) {
            // ROV descending from surface
            baseROVY = -14.0 + (stageStateRef.current + progressStateRef.current) * -1.6;
          } else if (stageStateRef.current >= 9) {
            // ROV ascending slightly to monitor lay
            baseROVY = -16.5;
          }

          // Gentle buoyancy hover oscillation
          const hoverY = baseROVY + Math.sin(timeMs * 0.0015) * 0.12;
          const hoverPitch = Math.sin(timeMs * 0.001) * 0.025;
          rovGroupRef.current.position.y = hoverY;
          rovGroupRef.current.position.z = baseROVZ;
          rovGroupRef.current.rotation.x = hoverPitch;
        }

        // 6. Robotic Manipulator physical interaction
        if (roboticArmRef.current) {
          if (stageStateRef.current >= 3 && stageStateRef.current <= 7) {
            // Arm extends down towards the damaged cable
            roboticArmRef.current.rotation.x = THREE.MathUtils.lerp(
              roboticArmRef.current.rotation.x,
              Math.PI / 2.6,
              0.05
            );
            roboticArmRef.current.position.y = THREE.MathUtils.lerp(
              roboticArmRef.current.position.y,
              -0.55,
              0.05
            );
          } else {
            // Arm parked in standby stow position
            roboticArmRef.current.rotation.x = THREE.MathUtils.lerp(
              roboticArmRef.current.rotation.x,
              Math.PI / 4,
              0.05
            );
            roboticArmRef.current.position.y = THREE.MathUtils.lerp(
              roboticArmRef.current.position.y,
              -0.4,
              0.05
            );
          }
        }

        // 7. Crane Hook Block physical hoist
        if (craneHookRef.current) {
          let hookY = -18.2;
          if (stageStateRef.current === 4 || stageStateRef.current === 5) {
            // Hook lifts cable bight up by 0.8m for jointing
            hookY = -18.2 + Math.min(1.0, progressStateRef.current * 2) * 0.8;
          } else if (stageStateRef.current >= 9) {
            // Hook lowers back to seabed
            hookY = -18.2;
          }
          craneHookRef.current.position.y = hookY;
        }

        // 8. Update Model 12 Inspection Equipment
        if (model12Ref.current) {
          const isScanning = stageStateRef.current === 2 || stageStateRef.current === 3;
          model12Ref.current.update(timeMs, isScanning);
        }

        // 9. Update Model 9 Splicing Assembly
        if (model9Ref.current) {
          let model9Progress = 0;
          if (stageStateRef.current >= 5 && stageStateRef.current <= 7) {
            // Normalized progress across stages 5, 6, 7
            model9Progress = (stageStateRef.current - 5 + progressStateRef.current) / 3.0;
          } else if (stageStateRef.current > 7) {
            model9Progress = 1.0;
          }
          model9Ref.current.update(model9Progress, timeMs);
        }

        // 10. Optical Pulse traveling along cable on Stage 8 and Stage 11
        if (opticalPulseMeshRef.current) {
          if (stageStateRef.current === 8 || stageStateRef.current === 11) {
            opticalPulseMeshRef.current.visible = true;
            opticalPulsePosRef.current = (opticalPulsePosRef.current + 0.015) % 1.0;
            // Traverse from -45 to +45 along x
            const px = -45 + opticalPulsePosRef.current * 90;
            const pz = (px / 45) * 6;
            opticalPulseMeshRef.current.position.set(px, -19.4, pz);
          } else {
            opticalPulseMeshRef.current.visible = false;
          }
        }

        // 11. Marine Snow particle drift
        if (marineSnowRef.current) {
          const positions = marineSnowRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 1; i < positions.length; i += 3) {
            positions[i] -= 0.012;
            if (positions[i] < -20) {
              positions[i] = 0;
            }
          }
          marineSnowRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Render Frame
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
    }, []);

    return (
      <div ref={containerRef} className="relative w-full h-full min-h-[580px] bg-[#03182b] overflow-hidden select-none">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Top-Left Perspective Navigation Toolbar */}
        <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-[#0b1d33]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-2xl">
          <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
            VIEW CAM
          </span>
          {(['ROV Cam', 'Macro Splice', 'Orbit', 'Surface Vessel'] as CameraPerspective[]).map((persp) => (
            <button
              key={persp}
              onClick={() => {
                setPerspectiveState(persp);
                updateCameraTargets(persp);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                perspectiveState === persp
                  ? 'bg-cyan-500 text-[#0b1d33] font-bold shadow-lg shadow-cyan-500/30'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {persp}
            </button>
          ))}
        </div>

        {/* Top-Right Telemetry & Environment HUD */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 bg-[#0b1d33]/90 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-cyan-300 font-semibold">
              SUBSEA DIGITAL TWIN
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-white/70 text-right">
            <span>BATHYMETRY DEPTH:</span>
            <span className="text-white font-bold">4,820 m</span>
            <span>HYDROSTATIC PRESS:</span>
            <span className="text-white font-bold">48.2 MPa</span>
            <span>WATER TEMP:</span>
            <span className="text-white font-bold">1.8 °C</span>
            <span>ENVIRONMENT:</span>
            <span className={assetsLoaded ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              {assetsLoaded ? "OCEAN FLOOR LINKED" : "LOADING TERRAIN"}
            </span>
          </div>
        </div>

        {/* Bottom-Left Real-Time Operational Sequence Monitor */}
        <div className="absolute bottom-4 left-4 z-20 bg-[#0b1d33]/90 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shadow-2xl max-w-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-white/50 mb-1">
            PHYSICAL REPAIR TIMELINE
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono text-xs border border-cyan-800">
              STAGE {stageState} / 11
            </span>
            <span>
              {stageState <= 1 && 'Surface Dispatch & ROV Descent'}
              {stageState === 2 && 'Benthic Survey & Multibeam Sonar Scan'}
              {stageState === 3 && 'Manipulator Alignment & Clamping'}
              {stageState === 4 && 'Crane Hoist & Cable Bight Lift'}
              {stageState === 5 && 'Model 9 Fiber Cleave & Alignment'}
              {stageState === 6 && 'High-Voltage Fusion Arc Splicing'}
              {stageState === 7 && 'Universal Joint Pressure Sealing'}
              {stageState === 8 && 'OTDR Optical Continuity Pulse'}
              {stageState >= 9 && stageState <= 10 && 'Benthic Lay & Seabed Reburial'}
              {stageState === 11 && 'Network Restoration Confirmed'}
            </span>
          </div>
        </div>

        {/* Subtle Underwater Ambient Vignette */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_45%,transparent_50%,rgba(3,24,43,0.7)_100%)]" />
      </div>
    );
  }
);

UnderwaterScene.displayName = 'UnderwaterScene';

export { UnderwaterScene };
export default UnderwaterScene;
