'use client';

/**
 * SubseaSimulation.tsx
 *
 * 4-Stage sequential subsea simulation:
 *   Stage 1 — Earth Globe (network overview, fault beacon)
 *   Stage 2 — Sea Surface (ship sailing on ocean_wave.glb)
 *   Stage 3 — ROV Descent (white path line from ship hull to seabed, ROV follows)
 *   Stage 4 — Seabed Orbital (orbital view of cable, fault, ROV repair)
 *
 * No tab buttons. User advances via a single "Next" arrow at the bottom,
 * or it auto-advances after the descent animation completes.
 */

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FaultIncident } from '@/lib/types';
import { Model9SplicingAssembly } from '@/lib/3d/models/Model9SplicingAssembly';
import { Model12InspectionEquipment } from '@/lib/3d/models/Model12InspectionEquipment';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SimStage = 1 | 2 | 3 | 4;

export interface SubseaSimulationHandle {
  captureFrame: () => string;
}

interface Props {
  activeFault: FaultIncident;
  currentRepairStage?: number; // 0-11 from ghost mode timeline
  isGhostMode?: boolean;
  onStageChange?: (stage: SimStage) => void;
}

// ─── Stage metadata ───────────────────────────────────────────────────────────

const STAGE_LABELS: Record<SimStage, string> = {
  1: 'Network Overview — Global Cable Map',
  2: 'Sea Surface — Vessel Transit',
  3: 'ROV Descent — Water Column',
  4: 'Seabed — Cable Repair Operations',
};

const STAGE_SUBLABELS: Record<SimStage, string> = {
  1: 'Fault beacon active at 12.31°N 43.49°E',
  2: 'CS Sovereign (DP2) en-route to fault coordinates',
  3: 'ROV deploying on umbilical — 4,120 m descent',
  4: 'Orbital inspection — Drag to rotate view',
};

// ─── Main Component ───────────────────────────────────────────────────────────

const SubseaSimulation = forwardRef<SubseaSimulationHandle, Props>(
  ({ activeFault, currentRepairStage = 0, isGhostMode = false, onStageChange }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [stage, setStage] = useState<SimStage>(1);
    const [descentProgress, setDescentProgress] = useState(0); // 0→1 during stage 3
    const stageRef = useRef<SimStage>(1);
    const descentRef = useRef(0);

    // Three.js core refs (persisted across stages via single scene)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const clockRef = useRef(new THREE.Clock());
    const animIdRef = useRef<number>(0);
    const orbitControlsRef = useRef<OrbitControls | null>(null);

    // Scene object refs
    const globeGroupRef = useRef<THREE.Group | null>(null);
    const shipGroupRef = useRef<THREE.Group | null>(null);
    const rovGroupRef = useRef<THREE.Group | null>(null);
    const oceanSurfaceRef = useRef<THREE.Group | null>(null);
    const seabedGroupRef = useRef<THREE.Group | null>(null);
    const descentLineRef = useRef<THREE.Line | null>(null);
    const tetherLineRef = useRef<THREE.Line | null>(null);
    const faultBeaconRef = useRef<THREE.Mesh | null>(null);
    const model9Ref = useRef<Model9SplicingAssembly | null>(null);
    const model12Ref = useRef<Model12InspectionEquipment | null>(null);
    const marineSnowRef = useRef<THREE.Points | null>(null);

    // Camera animation target
    const camTargetPos = useRef(new THREE.Vector3(0, 0, 8));
    const camTargetLook = useRef(new THREE.Vector3(0, 0, 0));

    // Drag orbit for stages 1-3 (manual, no OrbitControls)
    const isDragging = useRef(false);
    const prevMouse = useRef({ x: 0, y: 0 });
    const orbitOffset = useRef(new THREE.Vector2(0, 0));

    // ── Expose captureFrame ──────────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      captureFrame() {
        const r = rendererRef.current;
        const s = sceneRef.current;
        const c = cameraRef.current;
        if (r && s && c) {
          r.render(s, c);
          return r.domElement.toDataURL('image/png');
        }
        return '';
      },
    }));

    // ── Stage navigation ─────────────────────────────────────────────────────
    const goToStage = useCallback(
      (next: SimStage) => {
        stageRef.current = next;
        setStage(next);
        onStageChange?.(next);

        const oc = orbitControlsRef.current;
        if (oc) {
          // Only enable OrbitControls in stage 4
          oc.enabled = next === 4;
        }

        // Reset descent progress when entering stage 3
        if (next === 3) {
          descentRef.current = 0;
          setDescentProgress(0);
        }
      },
      [onStageChange]
    );

    const handleNext = useCallback(() => {
      const cur = stageRef.current;
      if (cur < 4) goToStage((cur + 1) as SimStage);
    }, [goToStage]);

    const handlePrev = useCallback(() => {
      const cur = stageRef.current;
      if (cur > 1) goToStage((cur - 1) as SimStage);
    }, [goToStage]);

    // ── Three.js scene initialisation ────────────────────────────────────────
    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      // ── Renderer ──────────────────────────────────────────────────────────
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
      renderer.toneMappingExposure = 1.2;
      rendererRef.current = renderer;

      // ── Scene ─────────────────────────────────────────────────────────────
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // ── Camera ────────────────────────────────────────────────────────────
      const camera = new THREE.PerspectiveCamera(
        48,
        container.clientWidth / container.clientHeight,
        0.1,
        600
      );
      camera.position.set(0, 0, 8);
      cameraRef.current = camera;

      // ── OrbitControls (stage 4 only) ──────────────────────────────────────
      const oc = new OrbitControls(camera, renderer.domElement);
      oc.enableDamping = true;
      oc.dampingFactor = 0.07;
      oc.minDistance = 2;
      oc.maxDistance = 40;
      oc.enabled = false; // enabled only in stage 4
      orbitControlsRef.current = oc;

      // ── Global Lighting ───────────────────────────────────────────────────
      const ambient = new THREE.AmbientLight(0xfff8f0, 1.2);
      scene.add(ambient);

      const sunLight = new THREE.DirectionalLight(0xfffbeb, 4.0);
      sunLight.position.set(20, 40, 20);
      sunLight.castShadow = true;
      scene.add(sunLight);

      const skyHemi = new THREE.HemisphereLight(0x87ceeb, 0x1a3a4a, 1.8);
      scene.add(skyHemi);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STAGE 1 — GLOBE GROUP
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const globeGroup = new THREE.Group();
      globeGroup.visible = true;
      scene.add(globeGroup);
      globeGroupRef.current = globeGroup;

      const gltfLoader = new GLTFLoader();

      // Load Model 1 (globe_ribbons.gltf) — same as CableGlobe3D approach
      gltfLoader.load(
        '/models/model1/globe_ribbons.gltf',
        (gltf) => {
          const cableModel = gltf.scene;
          // Z-up fix: Model 1 has North Pole at +Z
          cableModel.rotation.order = 'YXZ';
          cableModel.rotation.x = -Math.PI / 2;

          // Apply Earth texture from disk
          const texLoader = new THREE.TextureLoader();
          texLoader.load('/models/model1/gltf_embedded_0.png', (tex) => {
            tex.flipY = false;
            tex.colorSpace = THREE.SRGBColorSpace;
            cableModel.traverse((child) => {
              const mesh = child as THREE.Mesh;
              if (mesh.isMesh) {
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach((m) => {
                    if ((m as THREE.MeshStandardMaterial).map !== undefined) {
                      (m as THREE.MeshStandardMaterial).map = tex;
                      m.needsUpdate = true;
                    }
                  });
                } else {
                  const mat = mesh.material as THREE.MeshStandardMaterial;
                  mat.map = tex;
                  mat.needsUpdate = true;
                }
              }
            });
          });

          globeGroup.add(cableModel);
        },
        undefined,
        () => {
          // Fallback globe sphere
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 64, 32),
            new THREE.MeshStandardMaterial({ color: 0x1a4a6e, roughness: 0.6 })
          );
          globeGroup.add(sphere);
        }
      );

      // Fault beacon on globe surface (terracotta pulsing ring)
      const beaconGeo = new THREE.SphereGeometry(0.06, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xc87954 });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      // Approximate fault position on globe surface (lat 12.31°N, lon 43.49°E)
      const faultPhi = THREE.MathUtils.degToRad(90 - activeFault.lat);
      const faultTheta = THREE.MathUtils.degToRad(activeFault.lon);
      // Model 1 scale factor ~2950 units = Earth radius; we use normalised sphere r=2.55
      const r = 2.55;
      beaconMesh.position.set(
        r * Math.sin(faultPhi) * Math.cos(faultTheta),
        r * Math.cos(faultPhi),
        r * Math.sin(faultPhi) * Math.sin(faultTheta)
      );
      globeGroup.add(beaconMesh);
      faultBeaconRef.current = beaconMesh;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STAGE 2 — SEA SURFACE GROUP (ocean_wave.glb + ship)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const oceanSurfaceGroup = new THREE.Group();
      oceanSurfaceGroup.visible = false;
      scene.add(oceanSurfaceGroup);
      oceanSurfaceRef.current = oceanSurfaceGroup;

      // Ocean wave model
      gltfLoader.load(
        '/models/ocean-surface/ocean_wave.glb',
        (gltf) => {
          const waveModel = gltf.scene;
          // Scale down to fit viewport — original may be very large
          const box = new THREE.Box3().setFromObject(waveModel);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetSize = 40; // world units
          waveModel.scale.setScalar(targetSize / maxDim);

          // Flatten to Y=0 surface
          const center = box.getCenter(new THREE.Vector3());
          waveModel.position.sub(center.multiplyScalar(targetSize / maxDim));
          waveModel.position.y = 0;

          waveModel.traverse((child) => {
            const m = child as THREE.Mesh;
            if (m.isMesh) {
              m.receiveShadow = true;
              m.castShadow = false;
            }
          });
          oceanSurfaceGroup.add(waveModel);
        },
        undefined,
        () => {
          // Fallback: procedural animated ocean plane
          const geo = new THREE.PlaneGeometry(60, 60, 80, 80);
          geo.rotateX(-Math.PI / 2);
          const mat = new THREE.MeshStandardMaterial({
            color: 0x1a7a8a,
            roughness: 0.2,
            metalness: 0.4,
            transparent: true,
            opacity: 0.88,
          });
          const plane = new THREE.Mesh(geo, mat);
          plane.name = 'oceanFallback';
          oceanSurfaceGroup.add(plane);
        }
      );

      // Sky environment for stage 2
      scene.background = new THREE.Color(0x87ceeb); // sky blue (only visible in stage 2)

      // Ship group
      const shipGroup = new THREE.Group();
      shipGroup.position.set(0, 0.5, 0);
      oceanSurfaceGroup.add(shipGroup);
      shipGroupRef.current = shipGroup;

      gltfLoader.load(
        '/models/cargo-ship.glb',
        (gltf) => {
          const shipModel = gltf.scene;
          shipModel.scale.setScalar(0.12);
          shipModel.rotation.y = Math.PI / 2;
          shipModel.traverse((child) => {
            const m = child as THREE.Mesh;
            if (m.isMesh) {
              m.castShadow = true;
              m.receiveShadow = true;
            }
          });
          shipGroup.add(shipModel);
        },
        undefined,
        () => {
          // Fallback hull
          const hull = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.8, 8),
            new THREE.MeshStandardMaterial({ color: 0x334155 })
          );
          shipGroup.add(hull);
        }
      );

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STAGE 3 — ROV DESCENT GROUP (white path line)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // The ROV group is reused from stage 2 / 3 / 4
      const rovGroup = new THREE.Group();
      rovGroup.position.set(0, 0.5, 0);
      rovGroup.visible = false;
      scene.add(rovGroup);
      rovGroupRef.current = rovGroup;

      // ROV body
      const foamMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.32, 1.8),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.2 })
      );
      foamMesh.position.y = 0.35;
      foamMesh.castShadow = true;
      rovGroup.add(foamMesh);

      const chassisMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.36, 0.72, 1.76),
        new THREE.MeshStandardMaterial({ color: 0x454640, roughness: 0.3, metalness: 0.8 })
      );
      chassisMesh.castShadow = true;
      rovGroup.add(chassisMesh);

      // Thrusters
      const thrusterGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.32, 12);
      const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x687b59, metalness: 0.8 });
      [
        [-0.76, 0, 0.65, 0, Math.PI / 4],
        [0.76, 0, 0.65, 0, -Math.PI / 4],
        [-0.76, 0, -0.65, 0, -Math.PI / 4],
        [0.76, 0, -0.65, 0, Math.PI / 4],
        [-0.45, 0.32, 0, Math.PI / 2, 0],
        [0.45, 0.32, 0, Math.PI / 2, 0],
      ].forEach(([x, y, z, rx, ry]) => {
        const pod = new THREE.Mesh(thrusterGeo, thrusterMat);
        pod.position.set(x, y, z);
        pod.rotation.set(rx, ry, 0);
        pod.castShadow = true;
        rovGroup.add(pod);
      });

      // ROV headlight
      const rovLight = new THREE.SpotLight(0xfff7ed, 4.5, 18, Math.PI / 4, 0.5);
      rovLight.position.set(0, 0, 0.9);
      rovLight.target.position.set(0, -0.5, 3.5);
      rovGroup.add(rovLight);
      rovGroup.add(rovLight.target);

      // Model 12 inspection equipment on ROV
      const model12 = new Model12InspectionEquipment();
      model12.group.position.set(0, -0.15, 0.95);
      rovGroup.add(model12.group);
      model12Ref.current = model12;

      // White descent line (ship hull → seabed)
      // Will be dynamically updated each frame during stage 3
      const descentLinePts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -30, 0),
      ];
      const descentLineGeo = new THREE.BufferGeometry().setFromPoints(descentLinePts);
      const descentLine = new THREE.Line(
        descentLineGeo,
        new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.9 })
      );
      descentLine.visible = false;
      scene.add(descentLine);
      descentLineRef.current = descentLine;

      // Tether line (ship winch → ROV during descent)
      const tetherLinePts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
      const tetherLineGeo = new THREE.BufferGeometry().setFromPoints(tetherLinePts);
      const tetherLine = new THREE.Line(
        tetherLineGeo,
        new THREE.LineBasicMaterial({ color: 0xe99a65, linewidth: 1 })
      );
      tetherLine.visible = false;
      scene.add(tetherLine);
      tetherLineRef.current = tetherLine;

      // Marine snow particles (visible in stages 3 & 4)
      const snowCount = 600;
      const snowGeo = new THREE.BufferGeometry();
      const snowPos = new Float32Array(snowCount * 3);
      for (let i = 0; i < snowCount; i++) {
        snowPos[i * 3] = (Math.random() - 0.5) * 40;
        snowPos[i * 3 + 1] = Math.random() * 35 - 30;
        snowPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
      }
      snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
      const marineSnow = new THREE.Points(
        snowGeo,
        new THREE.PointsMaterial({ color: 0x83b9a9, size: 0.1, transparent: true, opacity: 0.45 })
      );
      marineSnow.visible = false;
      scene.add(marineSnow);
      marineSnowRef.current = marineSnow;

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // STAGE 4 — SEABED GROUP
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      const seabedGroup = new THREE.Group();
      seabedGroup.visible = false;
      scene.add(seabedGroup);
      seabedGroupRef.current = seabedGroup;

      // Seabed plane
      const seafloorGeo = new THREE.PlaneGeometry(120, 120, 40, 40);
      seafloorGeo.rotateX(-Math.PI / 2);
      const seafloorMesh = new THREE.Mesh(
        seafloorGeo,
        new THREE.MeshStandardMaterial({ color: 0x162432, roughness: 0.9, metalness: 0.1 })
      );
      seafloorMesh.position.y = -19.5;
      seafloorMesh.receiveShadow = true;
      seabedGroup.add(seafloorMesh);

      // Cables
      const makeCable = (points: THREE.Vector3[], color: number) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const mesh = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 64, 0.13, 16, false),
          new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.55 })
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
      };

      seabedGroup.add(
        makeCable(
          [
            new THREE.Vector3(-45, -19.4, -6),
            new THREE.Vector3(-12, -19.7, -1),
            new THREE.Vector3(-0.5, -19.2, 0),
          ],
          0x454640
        )
      );
      seabedGroup.add(
        makeCable(
          [
            new THREE.Vector3(0.5, -19.2, 0),
            new THREE.Vector3(12, -19.7, 1),
            new THREE.Vector3(45, -19.4, 6),
          ],
          0x454640
        )
      );

      // Fault marker (terracotta glow ring)
      const faultMarker = new THREE.Mesh(
        new THREE.TorusGeometry(0.6, 0.1, 16, 48),
        new THREE.MeshBasicMaterial({ color: 0xc87954 })
      );
      faultMarker.rotation.x = Math.PI / 2;
      faultMarker.position.set(0, -19.1, 0);
      seabedGroup.add(faultMarker);

      // Model 9 Splicing Assembly
      const model9 = new Model9SplicingAssembly();
      model9.group.position.set(0, -19.1, 0);
      model9.group.scale.setScalar(1.25);
      seabedGroup.add(model9.group);
      model9Ref.current = model9;

      // Benthic key spotlight
      const benthicLight = new THREE.SpotLight(0xfff7ed, 6.0, 50, Math.PI / 3.2, 0.45, 1.1);
      benthicLight.position.set(0, -10, 6);
      benthicLight.target.position.set(0, -19.2, 0);
      benthicLight.castShadow = true;
      seabedGroup.add(benthicLight);
      seabedGroup.add(benthicLight.target);

      // ROV starts at surface; will be repositioned when stage 4 is active
      // (rovGroup is separate from seabedGroup so it can animate freely)

      // ── Resize ──────────────────────────────────────────────────────────────
      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener('resize', handleResize);

      // ── Pointer drag (manual orbit for stages 1-3) ──────────────────────────
      const handlePointerDown = (e: PointerEvent) => {
        if (stageRef.current === 4) return; // let OrbitControls handle stage 4
        isDragging.current = true;
        prevMouse.current = { x: e.clientX, y: e.clientY };
      };
      const handlePointerMove = (e: PointerEvent) => {
        if (!isDragging.current || stageRef.current === 4) return;
        const dx = e.clientX - prevMouse.current.x;
        const dy = e.clientY - prevMouse.current.y;
        prevMouse.current = { x: e.clientX, y: e.clientY };
        orbitOffset.current.x += dx * 0.005;
        orbitOffset.current.y = THREE.MathUtils.clamp(
          orbitOffset.current.y + dy * 0.004,
          -1.2,
          1.2
        );
      };
      const handlePointerUp = () => {
        isDragging.current = false;
      };
      canvas.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);

      // ── Animation Loop ───────────────────────────────────────────────────────
      const animate = () => {
        animIdRef.current = requestAnimationFrame(animate);
        const t = clockRef.current.getElapsedTime();
        const ms = t * 1000;
        const s = stageRef.current;

        // ── STAGE VISIBILITY ──────────────────────────────────────────────
        if (globeGroupRef.current) globeGroupRef.current.visible = s === 1;
        if (oceanSurfaceRef.current) oceanSurfaceRef.current.visible = s === 2;
        if (rovGroupRef.current) rovGroupRef.current.visible = s === 3 || s === 4;
        if (descentLineRef.current) descentLineRef.current.visible = s === 3;
        if (tetherLineRef.current) tetherLineRef.current.visible = s === 3;
        if (seabedGroupRef.current) seabedGroupRef.current.visible = s === 4;
        if (marineSnowRef.current) marineSnowRef.current.visible = s === 3 || s === 4;

        // ── BACKGROUND & FOG ─────────────────────────────────────────────
        if (s === 1) {
          scene.background = new THREE.Color(0x0a0e1a);
          scene.fog = null;
        } else if (s === 2) {
          scene.background = new THREE.Color(0x87ceeb);
          scene.fog = new THREE.FogExp2(0x87ceeb, 0.005);
        } else if (s === 3) {
          // Fade from sky to deep water as ROV descends
          const depth = descentRef.current;
          const skyColor = new THREE.Color(0x1a6a8a);
          const deepColor = new THREE.Color(0x021424);
          const bg = skyColor.lerp(deepColor, depth);
          scene.background = bg;
          scene.fog = new THREE.FogExp2(bg.getHex(), 0.01 + depth * 0.02);
        } else {
          scene.background = new THREE.Color(0x021424);
          scene.fog = new THREE.FogExp2(0x03192c, 0.016);
        }

        // ── STAGE 1 — GLOBE ANIMATION ─────────────────────────────────────
        if (s === 1 && globeGroupRef.current) {
          // Slow auto-rotation + user drag
          globeGroupRef.current.rotation.y = t * 0.06 + orbitOffset.current.x;
          // Camera
          camTargetPos.current.set(
            0 + Math.sin(orbitOffset.current.x * 0.3) * 0.5,
            orbitOffset.current.y * 1.5,
            7
          );
          camTargetLook.current.set(0, 0, 0);

          // Beacon pulse
          if (faultBeaconRef.current) {
            const scale = 1.0 + Math.sin(ms * 0.003) * 0.4;
            faultBeaconRef.current.scale.setScalar(scale);
          }
        }

        // ── STAGE 2 — SHIP ON OCEAN SURFACE ──────────────────────────────
        if (s === 2) {
          if (shipGroupRef.current) {
            // Gentle heave & sway
            shipGroupRef.current.position.y = 0.5 + Math.sin(ms * 0.001) * 0.08;
            shipGroupRef.current.rotation.x = Math.sin(ms * 0.0008) * 0.02;
            shipGroupRef.current.rotation.z = Math.cos(ms * 0.0006) * 0.025;
          }
          // Animate ocean fallback wave
          const fallback = oceanSurfaceRef.current?.getObjectByName('oceanFallback') as THREE.Mesh;
          if (fallback) {
            const geo = fallback.geometry as THREE.PlaneGeometry;
            const pos = geo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
              const x = pos.getX(i);
              const z = pos.getZ(i);
              pos.setY(i, Math.sin(x * 0.3 + t * 1.2) * 0.25 + Math.cos(z * 0.35 + t * 0.9) * 0.18);
            }
            pos.needsUpdate = true;
            geo.computeVertexNormals();
          }
          // Camera: slightly elevated, looking at ship from the side
          camTargetPos.current.set(
            12 + orbitOffset.current.x * 5,
            5 + orbitOffset.current.y * 3,
            8
          );
          camTargetLook.current.set(0, 0.5, 0);
        }

        // ── STAGE 3 — ROV DESCENT ─────────────────────────────────────────
        if (s === 3 && rovGroupRef.current) {
          // Auto-advance descent
          const newDescent = Math.min(1.0, descentRef.current + 0.0012);
          descentRef.current = newDescent;
          setDescentProgress(newDescent);

          // ROV position: starts at ship (y=0) descends to seabed (y=-28)
          const rovY = THREE.MathUtils.lerp(0, -28, newDescent);
          const rovX = Math.sin(newDescent * Math.PI * 1.5) * 0.4; // gentle drift
          rovGroupRef.current.position.set(rovX, rovY, 0);
          rovGroupRef.current.rotation.x = THREE.MathUtils.lerp(0, -0.2, Math.min(1, newDescent * 2));

          // Update descent line (from ship winch to ROV top)
          if (descentLineRef.current) {
            const shipWinch = new THREE.Vector3(0, 0.5, 0);
            const rovTop = new THREE.Vector3(rovX, rovY + 0.45, 0);
            const pts = [shipWinch, rovTop];
            descentLineRef.current.geometry.setFromPoints(pts);
          }

          // Tether from ship winch to ROV (dashed orange catenary)
          if (tetherLineRef.current) {
            const p0 = new THREE.Vector3(0, 0.5, 0);
            const rovP = rovGroupRef.current.position;
            const p3 = new THREE.Vector3(rovP.x, rovP.y + 0.45, rovP.z);
            const mid = new THREE.Vector3(
              (p0.x + p3.x) * 0.5 - 0.5,
              (p0.y + p3.y) * 0.5,
              (p0.z + p3.z) * 0.5
            );
            tetherLineRef.current.geometry.setFromPoints([p0, mid, p3]);
          }

          // Camera follows ROV descent
          const camY = THREE.MathUtils.lerp(4, -25, newDescent);
          camTargetPos.current.set(
            6 + orbitOffset.current.x * 4,
            camY + orbitOffset.current.y * 3,
            8
          );
          camTargetLook.current.set(rovX, rovY, 0);

          // Marine snow drift
          if (marineSnowRef.current) {
            const positions = marineSnowRef.current.geometry.attributes.position
              .array as Float32Array;
            for (let i = 1; i < positions.length; i += 3) {
              positions[i] -= 0.015;
              if (positions[i] < -30) positions[i] = 2;
            }
            marineSnowRef.current.geometry.attributes.position.needsUpdate = true;
          }

          // Auto-advance to stage 4 when descent completes
          if (newDescent >= 1.0 && stageRef.current === 3) {
            // Small delay then transition
            setTimeout(() => {
              if (stageRef.current === 3) {
                goToStage(4);
              }
            }, 1200);
          }
        }

        // ── STAGE 4 — SEABED ORBITAL ──────────────────────────────────────
        if (s === 4) {
          // ROV hovering near cable
          if (rovGroupRef.current) {
            rovGroupRef.current.position.set(
              0.6,
              -17.2 + Math.sin(ms * 0.0015) * 0.06,
              1.8
            );
            rovGroupRef.current.rotation.x = Math.sin(ms * 0.001) * 0.015;
          }

          // Model 12 scanning
          if (model12Ref.current) {
            const isScanning = currentRepairStage >= 2 && currentRepairStage <= 4;
            model12Ref.current.update(ms, isScanning);
          }

          // Model 9 splicing
          if (model9Ref.current) {
            let prog = 0;
            if (currentRepairStage >= 5 && currentRepairStage <= 7) {
              prog = (currentRepairStage - 5) / 3.0;
            } else if (currentRepairStage > 7) {
              prog = 1.0;
            }
            model9Ref.current.update(prog, ms);
          }

          // Marine snow
          if (marineSnowRef.current) {
            const positions = marineSnowRef.current.geometry.attributes.position
              .array as Float32Array;
            for (let i = 1; i < positions.length; i += 3) {
              positions[i] -= 0.01;
              if (positions[i] < -22) positions[i] = 0;
            }
            marineSnowRef.current.geometry.attributes.position.needsUpdate = true;
          }

          // OrbitControls handles camera in stage 4
          oc.update();
          renderer.render(scene, camera);
          return; // skip manual camera update below
        }

        // ── CAMERA SMOOTH FOLLOW (stages 1-3) ────────────────────────────
        camera.position.lerp(camTargetPos.current, 0.04);
        camera.lookAt(camTargetLook.current);

        renderer.render(scene, camera);
      };

      animate();

      // Set initial OrbitControls target for stage 4
      oc.target.set(0, -18, 0);
      camera.position.set(10, -12, 12);

      return () => {
        cancelAnimationFrame(animIdRef.current);
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        oc.dispose();
        if (model9Ref.current) model9Ref.current.dispose();
        if (model12Ref.current) model12Ref.current.dispose();
        renderer.dispose();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Stage → OrbitControls sync ───────────────────────────────────────────
    useEffect(() => {
      const oc = orbitControlsRef.current;
      if (!oc) return;
      oc.enabled = stage === 4;
    }, [stage]);

    // ── Render ───────────────────────────────────────────────────────────────
    const pct = Math.round(descentProgress * 100);

    return (
      <div ref={containerRef} className="relative w-full h-full min-h-[580px] overflow-hidden select-none font-sans">
        {/* WebGL Canvas */}
        <canvas
          ref={canvasRef}
          className={`w-full h-full block ${stage === 4 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
        />

        {/* ── Top-left Stage Label ── */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 bg-[#F7F3EA]/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#D4C4A8] shadow-md">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              stage === 4 ? 'bg-[#A8B99A]' : 'bg-[#C87954] animate-pulse'
            }`}
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#454640]">{STAGE_LABELS[stage]}</span>
            <span className="text-[10px] text-[#A69B89]">{STAGE_SUBLABELS[stage]}</span>
          </div>
        </div>

        {/* ── Top-right Telemetry ── */}
        <div className="absolute top-4 right-4 z-20 bg-[#F7F3EA]/95 backdrop-blur-md px-4 py-3 rounded-xl border border-[#D4C4A8] shadow-md font-sans">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#83B9A9]" />
            <span className="text-xs uppercase tracking-wider text-[#454640] font-bold">
              Subsea Digital Twin
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#A69B89] text-right">
            <span>Surface Vessel:</span>
            <span className="text-[#454640] font-bold">CS Sovereign (DP2)</span>
            <span>Target Depth:</span>
            <span className="text-[#454640] font-mono font-bold">-{activeFault.depthMeters} m</span>
            <span>Fault Position:</span>
            <span className="text-[#454640] font-mono font-bold">
              {activeFault.lat}°N {activeFault.lon}°E
            </span>
            {stage === 3 && (
              <>
                <span>ROV Descent:</span>
                <span className="text-[#C87954] font-mono font-bold">{pct}%</span>
              </>
            )}
            {stage === 4 && (
              <>
                <span>ROV Status:</span>
                <span className="text-[#A8B99A] font-bold">ACTIVE ON CABLE</span>
              </>
            )}
          </div>
        </div>

        {/* ── Stage 3 Descent Progress Bar ── */}
        {stage === 3 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 w-64">
            <div className="flex justify-between text-[10px] text-[#F7F3EA]/80 mb-1">
              <span>Surface (0 m)</span>
              <span>Seabed ({activeFault.depthMeters} m)</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-center text-[10px] text-[#F7F3EA]/70 mt-1">
              ROV descending — {Math.round(descentProgress * activeFault.depthMeters)} m
            </div>
          </div>
        )}

        {/* ── Bottom Navigation (4 dots + Prev / Next) ── */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
          {/* Prev */}
          <button
            onClick={handlePrev}
            disabled={stage === 1}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F7F3EA]/90 border border-[#D4C4A8] text-[#454640] hover:bg-[#E8D9BF] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            title="Previous stage"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Stage dots */}
          <div className="flex items-center gap-2">
            {([1, 2, 3, 4] as SimStage[]).map((s) => (
              <button
                key={s}
                onClick={() => goToStage(s)}
                title={STAGE_LABELS[s]}
                className={`transition-all rounded-full ${
                  stage === s
                    ? 'w-5 h-5 bg-[#C87954] border-2 border-[#C87954]'
                    : 'w-3 h-3 bg-[#F7F3EA]/60 border border-[#D4C4A8] hover:bg-[#E8D9BF]'
                }`}
              />
            ))}
          </div>

          {/* Next */}
          <button
            onClick={handleNext}
            disabled={stage === 4}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#C87954] border border-[#C87954] text-white hover:bg-[#b56843] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            title="Next stage"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* ── Stage 4: Orbit hint ── */}
        {stage === 4 && (
          <div className="absolute bottom-5 right-5 z-20 text-[10px] text-[#F7F3EA]/60 flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Drag to orbit · Scroll to zoom
          </div>
        )}
      </div>
    );
  }
);

SubseaSimulation.displayName = 'SubseaSimulation';
export { SubseaSimulation };
export default SubseaSimulation;

