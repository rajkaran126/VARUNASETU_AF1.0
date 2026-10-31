'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWorkspace } from '@/lib/workspace-context';
import type * as THREE from 'three';

/* =========================================================
   VARUNASETU — Submarine Cable Break & Recovery Simulation
   Refined Dark Theme: Pure Black (#000000 / #080808)
   Zero dark-blue palette.
   Accents: Terracotta (#C87954), Coral Orange (#E99A65),
   Emerald (#10B981), Sea Glass (#83B9A9), Warm Sand (#D4C4A8),
   Crisp White (#FFFFFF), Neutral Gray (#8A8A8A).

   Typography: Space Grotesk / Plus Jakarta Sans & IBM Plex Mono.
   ========================================================= */

const PHASE_TIMES = {
  BREAK: 8,
  AI_DETECT: 14,
  ALT_ROUTE: 22,
  SHIP_ARRIVE: 30,
  ROV_DEPLOY: 38,
  ROV_REPAIR: 48,
  RESTORED: 62,
} as const;

export default function CableBreakSim() {
  const mountRef = useRef<HTMLDivElement>(null);
  const { activeFault, selectedCable } = useWorkspace();
  const faultName = activeFault?.cableName || selectedCable?.name || 'SEA-ME-WE 4';
  const faultStation = activeFault?.nearestLandingStation || 'Zafarana / Suez Transit Corridor';
  const faultLoc = activeFault ? `${activeFault.lat.toFixed(2)}°N, ${activeFault.lon.toFixed(2)}°E` : '27.88°N, 34.28°E';
  const faultDepth = activeFault ? `${activeFault.depthMeters.toLocaleString()}m` : '850m';

  // HUD DOM refs — updated directly to avoid React re-render cost
  const h = {
    phase:        useRef<HTMLDivElement>(null),
    srcDot:       useRef<HTMLSpanElement>(null),
    srcLabel:     useRef<HTMLSpanElement>(null),
    cblDot:       useRef<HTMLSpanElement>(null),
    cblLabel:     useRef<HTMLSpanElement>(null),
    dstDot:       useRef<HTMLSpanElement>(null),
    dstLabel:     useRef<HTMLSpanElement>(null),
    simTime:      useRef<HTMLSpanElement>(null),
    throughput:   useRef<HTMLSpanElement>(null),
    thruBar:      useRef<HTMLDivElement>(null),
    latency:      useRef<HTMLSpanElement>(null),
    latBar:       useRef<HTMLDivElement>(null),
    pktLoss:      useRef<HTMLSpanElement>(null),
    health:       useRef<HTMLSpanElement>(null),
    healthBar:    useRef<HTMLDivElement>(null),
    fibers:       useRef<HTMLSpanElement>(null),
    aiPanel:      useRef<HTMLDivElement>(null),
    aiLog:        useRef<HTMLDivElement>(null),
    alertBox:     useRef<HTMLDivElement>(null),
    alertText:    useRef<HTMLDivElement>(null),
    faultTag:     useRef<HTMLDivElement>(null),
    srcCard:      useRef<HTMLDivElement>(null),
    srcCardStat:  useRef<HTMLSpanElement>(null),
    dstCard:      useRef<HTMLDivElement>(null),
    dstCardStat:  useRef<HTMLSpanElement>(null),
    rovPanel:     useRef<HTMLDivElement>(null),
    rovDepth:     useRef<HTMLSpanElement>(null),
    rovStatus:    useRef<HTMLSpanElement>(null),
    rovTask:      useRef<HTMLSpanElement>(null),
    scanLine:     useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!mountRef.current) return;
    let animId = 0;
    let disposed = false;

    async function boot() {
      const THREE = await import('three');
      const { OrbitControls } = await import(
        'three/examples/jsm/controls/OrbitControls.js'
      );
      const { GLTFLoader } = await import(
        'three/examples/jsm/loaders/GLTFLoader.js'
      );
      const gltfLoader = new GLTFLoader();

      /* ─── RENDERER ─── */
      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(mountRef.current!.clientWidth, mountRef.current!.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
      mountRef.current!.appendChild(renderer.domElement);

      /* ─── SCENE (BRIGHT DAYLIGHT ENVIRONMENT) ─── */
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xd8eaf7);
      scene.fog = new THREE.FogExp2(0xd8eaf7, 0.008);

      /* ─── CAMERA ─── */
      const W = mountRef.current!.clientWidth;
      const H = mountRef.current!.clientHeight;
      const camera = new THREE.PerspectiveCamera(58, W / H, 0.1, 600);
      camera.position.set(0, 9, 36);
      camera.lookAt(0, -5, 0);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, -5, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance = 8;
      controls.maxDistance = 90;
      controls.maxPolarAngle = Math.PI * 0.88;
      controls.update();

      /* ─── LIGHTS (FULL DAYLIGHT SUN & SKY AMBIENCE) ─── */
      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      scene.add(new THREE.HemisphereLight(0xedf6fc, 0x6e8a7c, 1.8));

      const sun = new THREE.DirectionalLight(0xfffaed, 3.2);
      sun.position.set(22, 48, 26);
      sun.castShadow = true;
      scene.add(sun);

      const srcLight = new THREE.PointLight(0xfff4e6, 3.2, 14);
      srcLight.position.set(-23, 2, 0);
      scene.add(srcLight);

      const dstLight = new THREE.PointLight(0xfff4e6, 3.2, 14);
      dstLight.position.set(23, 2, 0);
      scene.add(dstLight);

      const faultLight = new THREE.PointLight(0xc87954, 0, 12);
      faultLight.position.set(3, -8, 0);
      scene.add(faultLight);

      /* ─── SEABED (VOLCANIC BASALT BLACK) ─── */
      const sbGeo = new THREE.PlaneGeometry(90, 45, 90, 45);
      sbGeo.rotateX(-Math.PI / 2);
      const sbPos = sbGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < sbPos.count; i++) {
        const x = sbPos.getX(i), z = sbPos.getZ(i);
        sbPos.setY(i,
          -12
          + Math.sin(x * 0.28) * Math.cos(z * 0.35) * 1.6
          + Math.sin(x * 0.14 + 1.2) * Math.cos(z * 0.22 + 2.1) * 2.4
          + (Math.random() - 0.5) * 0.5,
        );
      }
      sbGeo.computeVertexNormals();
      const seabed = new THREE.Mesh(sbGeo, new THREE.MeshLambertMaterial({ color: 0x3d4842 }));
      seabed.receiveShadow = true;
      scene.add(seabed);

      // Helper to compute exact seabed elevation at any (x, z)
      function getSeabedY(x: number, z: number): number {
        return (
          -12
          + Math.sin(x * 0.28) * Math.cos(z * 0.35) * 1.6
          + Math.sin(x * 0.14 + 1.2) * Math.cos(z * 0.22 + 2.1) * 2.4
        );
      }

      // Benthic Seaweed Flora (GLB Asset: /models/sea_weed.glb from ns2)
      // Converted to pure static meshes with skinning stripped to prevent bone/mesh artifacts at water surface (0, 0, 0)
      const weedClumps: THREE.Group[] = [];
      gltfLoader.load(
        '/models/sea_weed.glb',
        (gltf) => {
          // Extract clean unskinned static meshes
          const staticWeedTemplate = new THREE.Group();
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              const geom = mesh.geometry.clone();
              // Remove skeletal skinning bindings so no vertices bind to the origin (0, 0, 0)
              geom.deleteAttribute('skinIndex');
              geom.deleteAttribute('skinWeight');
              geom.deleteAttribute('JOINTS_0');
              geom.deleteAttribute('WEIGHTS_0');
              const mat = mesh.material;
              const staticMesh = new THREE.Mesh(geom, mat);
              staticMesh.castShadow = true;
              staticMesh.receiveShadow = true;
              staticWeedTemplate.add(staticMesh);
            }
          });

          // Coordinates positioned strictly in deep seabed basin (-13 to +13), flanking cable
          const weedCoords: [number, number, number, number][] = [
            [-13, -0.6, 0.35, 1.2],
            [-12,  0.8, 0.40, 2.5],
            [-10, -0.8, 0.38, 0.4],
            [-9,   1.2, 0.42, 1.9],
            [-7,  -0.5, 0.35, 3.1],
            [-6,   1.5, 0.40, 0.8],
            [-4,  -0.7, 0.38, 2.2],
            [-3,   1.0, 0.42, 1.4],
            [-1,  -1.1, 0.36, 0.6],
            [ 0,   0.9, 0.40, 2.8],
            [ 1,  -0.8, 0.38, 1.1],
            [ 2,   1.2, 0.35, 2.0],
            [ 4,  -0.9, 0.42, 0.3],
            [ 5,   1.0, 0.36, 1.7],
            [ 7,  -1.3, 0.40, 2.6],
            [ 8,   0.7, 0.38, 0.9],
            [10,  -0.5, 0.42, 1.5],
            [11,   1.1, 0.35, 2.4],
            [12,  -0.8, 0.38, 0.2],
            [13,   0.6, 0.40, 1.8],
            // Along alternative optical bypass furrow
            [-10, -8.2, 0.38, 1.0],
            [-5,  -9.2, 0.40, 2.3],
            [ 0,  -9.8, 0.42, 0.7],
            [ 5,  -9.0, 0.38, 1.6],
            [10,  -8.0, 0.35, 2.9],
          ];

          weedCoords.forEach(([wx, wz, ws, wr]) => {
            const clump = staticWeedTemplate.clone(true);
            clump.scale.setScalar(ws);
            clump.rotation.y = wr;
            // Rooted strictly on the deep ocean floor (y ≈ -10.5 to -11.5, never near surface)
            const seabedY = getSeabedY(wx, wz);
            clump.position.set(wx, seabedY, wz);
            scene.add(clump);
            weedClumps.push(clump);
          });
        },
        undefined,
        (err) => console.warn('Could not load sea_weed.glb', err)
      );

      // Floating marine sediment dust (Warm Gold / Pale Sand)
      const bioGeo = new THREE.BufferGeometry();
      const bioN = 220;
      const bioPos = new Float32Array(bioN * 3);
      for (let i = 0; i < bioN; i++) {
        bioPos[i*3]   = (Math.random()-0.5)*70;
        bioPos[i*3+1] = -2 - Math.random()*14;
        bioPos[i*3+2] = (Math.random()-0.5)*35;
      }
      bioGeo.setAttribute('position', new THREE.BufferAttribute(bioPos, 3));
      const bioMesh = new THREE.Points(bioGeo, new THREE.PointsMaterial({
        size: 0.12, color: 0xd4c4a8, transparent: true, opacity: 0.45,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      scene.add(bioMesh);

      /* ─── OCEAN SURFACE (NEUTRAL CHARCOAL WATER SPECULAR) ─── */
      const oceanGeo = new THREE.PlaneGeometry(90, 45, 90, 45);
      oceanGeo.rotateX(-Math.PI / 2);
      const oceanOrigY = new Float32Array(oceanGeo.attributes.position.count);
      for (let i = 0; i < oceanOrigY.length; i++) oceanOrigY[i] = 0;
      const oceanMat = new THREE.MeshPhongMaterial({
        color: 0x1d8a8a, emissive: 0x062828,
        specular: 0xffffff,
        transparent: true, opacity: 0.62, shininess: 180,
        side: THREE.DoubleSide,
      });
      const ocean = new THREE.Mesh(oceanGeo, oceanMat);
      ocean.position.y = 0;
      scene.add(ocean);
      const oceanPos = oceanGeo.attributes.position as THREE.BufferAttribute;
      const oceanOrigX = new Float32Array(oceanPos.count);
      const oceanOrigZ = new Float32Array(oceanPos.count);
      for (let i = 0; i < oceanPos.count; i++) {
        oceanOrigX[i] = oceanPos.getX(i);
        oceanOrigZ[i] = oceanPos.getZ(i);
      }

      /* ─── LANDING STATIONS & COASTAL INDUSTRIAL PLANT (factory_plant.glb from ns2) ─── */
      function buildStation(x: number) {
        const g = new THREE.Group();
        const metMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const yelMat = new THREE.MeshPhongMaterial({ color: 0xc87954, emissive: 0x4a2414, emissiveIntensity: 0.4 });

        // Cable conduit into seabed
        const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 9, 8), metMat);
        cd.position.y = -3;
        g.add(cd);

        // Connection terminal riser & telemetry mast
        const riser = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 2.4), metMat);
        riser.position.y = 1.0;
        g.add(riser);

        const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), yelMat);
        beacon.position.set(0, 2.2, 0);
        g.add(beacon);

        g.position.set(x, 0, 0);
        scene.add(g);
        return g;
      }
      buildStation(-23);
      buildStation(23);

      // Load Industrial Facility / Building Model (factory_plant.glb from ns2)
      // Horizontal orientation — naturally flat on the coastal terrain (zero vertical tilt)
      gltfLoader.load(
        '/models/factory_plant.glb',
        (gltf) => {
          // West Shore Facility (horizontal flat alignment)
          const plantWest = gltf.scene;
          plantWest.rotation.set(0, 0, 0);
          plantWest.scale.setScalar(0.042);

          plantWest.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Ground flat to coastal surface (y = 0.8)
          const boxWest = new THREE.Box3().setFromObject(plantWest);
          plantWest.position.set(-28, 0.8 - boxWest.min.y, 0);
          scene.add(plantWest);

          // East Shore Facility (horizontal flat alignment facing opposite across the sea)
          const plantEast = plantWest.clone(true);
          plantEast.rotation.set(0, Math.PI, 0);
          const boxEast = new THREE.Box3().setFromObject(plantEast);
          plantEast.position.set(28, 0.8 - boxEast.min.y, 0);
          scene.add(plantEast);
        },
        undefined,
        (err) => console.warn('Could not load factory_plant.glb', err)
      );

      // Landmass
      function addLand(x: number) {
        const lMat = new THREE.MeshLambertMaterial({ color: 0x6e685f });
        const sMat = new THREE.MeshLambertMaterial({ color: 0x8a7f72 });
        const land = new THREE.Mesh(new THREE.BoxGeometry(14, 3.5, 22), lMat);
        land.position.set(x, -1, 0); scene.add(land);
        const shore = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 22), sMat);
        shore.position.set(x + (x < 0 ? 8 : -8), -0.4, 0); scene.add(shore);
      }
      addLand(-30); addLand(30);

      /* ─── CABLE PATHS ─── */
      const BREAK_T = 0.46;

      const cPts = [
        new THREE.Vector3(-23, -4, 0),
        new THREE.Vector3(-18, -7.5, 0.6),
        new THREE.Vector3(-13, -10, -1.2),
        new THREE.Vector3(-8,  -11,  1.8),
        new THREE.Vector3(-3,  -10.5, 0.6),
        new THREE.Vector3(0,   -11.5, -0.6),
        new THREE.Vector3(3,   -10,   0),      // ← break zone
        new THREE.Vector3(7.5, -10.5, -1.2),
        new THREE.Vector3(12,  -9.5,  1.2),
        new THREE.Vector3(17,  -8,   -0.6),
        new THREE.Vector3(20,  -6,    0),
        new THREE.Vector3(23,  -4,    0),
      ];
      const fullCurve  = new THREE.CatmullRomCurve3(cPts);
      const breakPos   = fullCurve.getPoint(BREAK_T);

      // Sample sub-curves at break
      const pts1: THREE.Vector3[] = [], pts2: THREE.Vector3[] = [];
      for (let i = 0; i <= 60; i++) {
        pts1.push(fullCurve.getPoint(i / 60 * BREAK_T));
      }
      for (let i = 0; i <= 60; i++) {
        pts2.push(fullCurve.getPoint(BREAK_T + i / 60 * (1 - BREAK_T)));
      }
      const curve1 = new THREE.CatmullRomCurve3(pts1.filter((_,i) => i % 4===0 || i===pts1.length-1));
      const curve2 = new THREE.CatmullRomCurve3(pts2.filter((_,i) => i % 4===0 || i===pts2.length-1));

      const altPts = [
        new THREE.Vector3(-23, -4, 0),
        new THREE.Vector3(-18, -7.5, 0.6),
        new THREE.Vector3(-13, -10, -1.2),
        new THREE.Vector3(-8,  -11,  1.8),
        new THREE.Vector3(-3,  -10.5, 0.6),
        new THREE.Vector3(-1,  -9.5,  4),
        new THREE.Vector3(2.5, -8.5,  7.5),
        new THREE.Vector3(7,   -9.5,  6),
        new THREE.Vector3(11,  -10,   3.5),
        new THREE.Vector3(14,  -9.5,  1.5),
        new THREE.Vector3(17,  -8,   -0.6),
        new THREE.Vector3(20,  -6,    0),
        new THREE.Vector3(23,  -4,    0),
      ];
      const altCurve = new THREE.CatmullRomCurve3(altPts);

      function makeTube(curve: THREE.CatmullRomCurve3, col: number, segments = 120) {
        const geo = new THREE.TubeGeometry(curve, segments, 0.13, 8, false);
        const mat = new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: 0.45, shininess: 90 });
        return new THREE.Mesh(geo, mat);
      }

      // Normal cable: Sea Glass Green (0x83B9A9)
      const cableFull = makeTube(fullCurve, 0x83b9a9);
      scene.add(cableFull);

      // Severed cable: Terracotta (#C87954)
      const cable1 = makeTube(curve1, 0xc87954); cable1.visible = false; scene.add(cable1);
      const cable2 = makeTube(curve2, 0xc87954); cable2.visible = false; scene.add(cable2);

      // Alternative reroute: Coral Orange (#E99A65)
      const cableAlt = makeTube(altCurve, 0xe99a65); cableAlt.visible = false; scene.add(cableAlt);

      /* ─── DATA PARTICLES (WHITE / SEA GLASS GLOW) ─── */
      const PN = 70;
      const pGeo = new THREE.BufferGeometry();
      const pBuf = new Float32Array(PN * 3);
      const pTs  = Array.from({length: PN}, (_, i) => i / PN);
      pGeo.setAttribute('position', new THREE.BufferAttribute(pBuf, 3));
      const pMesh = new THREE.Points(pGeo, new THREE.PointsMaterial({
        size: 0.40, color: 0xffffff, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      scene.add(pMesh);

      // Alt-route particles (Coral Orange Glow)
      const apBuf = new Float32Array(PN * 3);
      const apGeo = new THREE.BufferGeometry();
      const apTs  = Array.from({length: PN}, (_, i) => i / PN);
      apGeo.setAttribute('position', new THREE.BufferAttribute(apBuf, 3));
      const apMat = new THREE.PointsMaterial({
        size: 0.40, color: 0xe99a65, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const apMesh = new THREE.Points(apGeo, apMat);
      scene.add(apMesh);

      /* ─── SPARKS AT BREAK (TERRACOTTA / EMBER) ─── */
      const SN = 180;
      const sparkBuf = new Float32Array(SN * 3);
      const sparkGeo = new THREE.BufferGeometry();
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkBuf, 3));
      const sparkMat = new THREE.PointsMaterial({
        size: 0.24, color: 0xc87954, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const sparkMesh = new THREE.Points(sparkGeo, sparkMat);
      scene.add(sparkMesh);
      const sparkVel = Array.from({length: SN}, () => ({
        vx: (Math.random()-0.5)*0.6, vy: (Math.random()-0.5)*0.6, vz: (Math.random()-0.5)*0.6,
        life: Math.random(),
      }));

      // Electrical arc (Coral Orange zig-zag line at break)
      const arcPts: THREE.Vector3[] = [];
      for (let i = 0; i < 12; i++) {
        arcPts.push(new THREE.Vector3(
          breakPos.x + (Math.random()-0.5)*1.2,
          breakPos.y + (Math.random()-0.5)*1.2,
          breakPos.z + (Math.random()-0.5)*1.2,
        ));
      }
      const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
      const arcLine = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({
        color: 0xe99a65, transparent: true, opacity: 0,
      }));
      scene.add(arcLine);

      // Warning ring (Terracotta #C87954)
      const ringMat = new THREE.MeshPhongMaterial({ color: 0xc87954, emissive: 0xc87954, emissiveIntensity: 1.2, transparent: true, opacity: 0 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.09, 8, 40), ringMat);
      ring.position.copy(breakPos);
      scene.add(ring);

      /* ─── REPAIR SHIP (GLB ASSET) ─── */
      const ship = new THREE.Group();
      ship.position.set(-42, 0.4, 0); // starts off-screen at west sea perimeter
      scene.add(ship);

      gltfLoader.load(
        '/models/cargo-ship.glb',
        (gltf) => {
          const shipModel = gltf.scene;
          shipModel.scale.setScalar(0.18);
          shipModel.rotation.y = Math.PI / 2;
          shipModel.position.set(0, 0, 0);
          shipModel.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          ship.add(shipModel);
        },
        undefined,
        (err) => {
          console.warn('Fallback: cargo-ship.glb', err);
          const hull = new THREE.Mesh(new THREE.BoxGeometry(7, 1.6, 3), new THREE.MeshPhongMaterial({ color: 0x222222 }));
          hull.position.y = 0.8;
          ship.add(hull);
        }
      );

      /* ─── ROV (GLB ASSET) ─── */
      const rov = new THREE.Group();
      rov.position.set(breakPos.x, 0.4, 0);
      rov.visible = false;
      scene.add(rov);

      // ROV spotlight
      const rovSpot = new THREE.SpotLight(0xffffff, 0, 16, Math.PI / 6, 0.5);
      rovSpot.position.set(0, 0.2, 0.9);
      rovSpot.target.position.set(0, -0.4, 4.0);
      rov.add(rovSpot);
      rov.add(rovSpot.target);

      gltfLoader.load(
        '/models/one-person-submarine-0b9d14.glb',
        (gltf) => {
          const rovModel = gltf.scene;
          rovModel.scale.setScalar(0.75);
          rovModel.position.set(0, 0, 0);
          rovModel.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          rov.add(rovModel);
        },
        undefined,
        (err) => {
          console.warn('Fallback: one-person-submarine-0b9d14.glb', err);
          const fallback = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.65, 0.9), new THREE.MeshPhongMaterial({ color: 0xc87954 }));
          rov.add(fallback);
        }
      );

      // Tether
      const tetherBuf = new Float32Array(6);
      const tetherGeo = new THREE.BufferGeometry();
      tetherGeo.setAttribute('position', new THREE.BufferAttribute(tetherBuf, 3));
      const tetherLine = new THREE.Line(tetherGeo, new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0 }));
      scene.add(tetherLine);

      /* ─── BUBBLES ─── */
      const BN = 40;
      const bubBuf = new Float32Array(BN * 3);
      const bubGeo = new THREE.BufferGeometry();
      bubGeo.setAttribute('position', new THREE.BufferAttribute(bubBuf, 3));
      const bubMat = new THREE.PointsMaterial({ size: 0.14, color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const bubMesh = new THREE.Points(bubGeo, bubMat);
      scene.add(bubMesh);
      const bubData = Array.from({length: BN}, () => ({
        x: 0, y: breakPos.y, z: 0,
        sp: 0.04 + Math.random()*0.05,
        ox: Math.random()*Math.PI*2,
      }));

      /* ─── SIMULATION STATE ─── */
      let phase = 0;
      let t = 0;
      const triggered: Record<string, boolean> = {};

      /* ─── HUD HELPERS ─── */
      function dot(el: HTMLSpanElement | null, col: string) {
        if (!el) return;
        el.style.background = col;
        el.style.boxShadow = `0 0 8px ${col}`;
      }
      function setBar(el: HTMLDivElement | null, pct: number, col: string) {
        if (!el) return;
        el.style.width = `${pct}%`;
        el.style.background = col;
      }

      function addAILine(text: string, cls: string, delayMs: number) {
        setTimeout(() => {
          if (!h.aiLog.current) return;
          const d = document.createElement('div');
          d.style.cssText = `font-size:10px;font-family:'IBM Plex Mono', monospace;line-height:1.8;opacity:0;transition:opacity .35s;`;
          // ok -> Emerald (#10B981), crit -> Terracotta (#C87954), warn -> Coral Orange (#E99A65), info -> Crisp White/Gray (#E5E5E5)
          d.style.color = cls === 'ok' ? '#10B981' : cls === 'crit' ? '#C87954' : cls === 'warn' ? '#E99A65' : '#D4D4D4';
          d.textContent = `> ${text}`;
          h.aiLog.current.appendChild(d);
          h.aiLog.current.scrollTop = 9999;
          setTimeout(() => { d.style.opacity = '1'; }, 30);
        }, delayMs);
      }

      function setPhaseText(txt: string) {
        if (h.phase.current) h.phase.current.textContent = txt;
      }

      /* ─── PHASE TRIGGERS ─── */
      function triggerBreak() {
        phase = 1;
        setPhaseText('◈ PHASE 2: CABLE RUPTURE DETECTED — EMERGENCY PROTOCOL ACTIVE');
        cableFull.visible = false;
        cable1.visible = true; cable2.visible = true;
        sparkMat.opacity = 1;
        (arcLine.material as THREE.LineBasicMaterial).opacity = 0.9;
        ringMat.opacity = 0.85;
        faultLight.intensity = 8;

        // HUD status
        if (h.alertBox.current) h.alertBox.current.style.opacity = '1';
        if (h.faultTag.current) h.faultTag.current.style.opacity = '1';
        dot(h.cblDot.current, '#C87954'); if (h.cblLabel.current) h.cblLabel.current.textContent = 'CABLE: SEVERED';
        dot(h.dstDot.current, '#C87954'); if (h.dstLabel.current) h.dstLabel.current.textContent = 'DESTINATION: LOST';
        if (h.throughput.current) { h.throughput.current.textContent = '0.0 Tbps'; h.throughput.current.style.color = '#C87954'; }
        setBar(h.thruBar.current, 0, '#C87954');
        if (h.latency.current) { h.latency.current.textContent = '∞ ms'; h.latency.current.style.color = '#C87954'; }
        if (h.pktLoss.current) { h.pktLoss.current.textContent = '100%'; h.pktLoss.current.style.color = '#C87954'; }
        if (h.health.current) { h.health.current.textContent = 'SEVERED'; h.health.current.style.color = '#C87954'; }
        setBar(h.healthBar.current, 4, '#C87954');
        if (h.fibers.current) { h.fibers.current.textContent = '0 / 8'; h.fibers.current.style.color = '#C87954'; }
        if (h.dstCardStat.current) { h.dstCardStat.current.textContent = 'SIGNAL LOST'; h.dstCardStat.current.style.color = '#C87954'; }
      }

      function triggerAI() {
        phase = 2;
        setPhaseText('◈ PHASE 3: AI FAULT DETECTION SYSTEM ACTIVATED');
        if (h.aiPanel.current) h.aiPanel.current.style.opacity = '1';
        if (h.scanLine.current) h.scanLine.current.style.display = 'block';
        if (h.alertBox.current) setTimeout(() => { if (h.alertBox.current) h.alertBox.current.style.opacity = '0'; }, 3200);

        addAILine('INITIATING FAULT DETECTION PROTOCOL...', 'info', 0);
        addAILine('Scanning optical fiber telemetry (OTDR)...', 'info', 900);
        addAILine('Pulse transmitted across all 8 fibers.', 'info', 1800);
        addAILine('FAULT CONFIRMED: Complete signal loss.', 'crit', 2700);
        addAILine('Triangulating fault coordinates...', 'warn', 3600);
        addAILine('FAULT LOCATION: 12.31°N, 43.49°E', 'ok', 5000);
        addAILine('DEPTH ESTIMATE: 4,200 ± 80 m', 'info', 5700);
        addAILine('Break length: ~3.2 km', 'info', 6400);
        addAILine('Analyzing alternative cable routes...', 'info', 7200);
        addAILine('SEA-ME-WE 5 — available (rerouting feasible)', 'ok', 8400);
        addAILine('I-ME-WE — 60% capacity (secondary)', 'warn', 9100);
        addAILine('AI FAULT DETECTION COMPLETE OK', 'ok', 9900);
      }

      function triggerAltRoute() {
        phase = 3;
        setPhaseText('◈ PHASE 4: ALTERNATIVE ROUTE ESTABLISHED — REROUTING TRAFFIC');
        if (h.scanLine.current) h.scanLine.current.style.display = 'none';
        cableAlt.visible = true;
        apMat.opacity = 0.9;

        if (h.throughput.current) { h.throughput.current.textContent = '2.1 Tbps'; h.throughput.current.style.color = '#E99A65'; }
        setBar(h.thruBar.current, 44, '#E99A65');
        if (h.latency.current) { h.latency.current.textContent = '31.5 ms'; h.latency.current.style.color = '#E99A65'; }
        if (h.pktLoss.current) { h.pktLoss.current.textContent = '0.8%'; h.pktLoss.current.style.color = '#E99A65'; }
        if (h.health.current) { h.health.current.textContent = 'ALT ROUTE'; h.health.current.style.color = '#E99A65'; }
        setBar(h.healthBar.current, 44, '#E99A65');
        dot(h.dstDot.current, '#E99A65'); if (h.dstLabel.current) h.dstLabel.current.textContent = 'DESTINATION: REROUTED';
        if (h.dstCardStat.current) { h.dstCardStat.current.textContent = 'ALT ROUTE ACTIVE'; h.dstCardStat.current.style.color = '#E99A65'; }

        addAILine('--- REROUTING INITIATED ---', 'warn', 600);
        addAILine('Traffic shifted to SEA-ME-WE 5.', 'info', 1500);
        addAILine('Throughput: 2.1 Tbps (44% nominal).', 'warn', 2400);
        addAILine('Connectivity RESTORED via alt route. OK', 'ok', 3300);
        addAILine('Dispatching repair vessel VSS Varunasetu...', 'info', 4200);
      }

      function triggerShip() {
        phase = 4;
        setPhaseText('◈ PHASE 5: REPAIR VESSEL "VSS VARUNASETU" SAILING TO SITE');
        addAILine('VSS Varunasetu dispatched. (ETA: 14h)', 'info', 400);
        addAILine('[Simulation accelerated for demo]', 'info', 1200);
      }

      function triggerROVDeploy() {
        phase = 5;
        setPhaseText('◈ PHASE 6: VESSEL ARRIVED AT CENTER — ROV DEPLOYING FROM SHIP');
        rov.visible = true;
        // ROV emerges directly from bottom hull of ship at surface level
        rov.position.set(ship.position.x, 0.2, 0);
        (tetherLine.material as THREE.LineBasicMaterial).opacity = 0.85;
        bubMat.opacity = 0.65;
        if (h.rovPanel.current) h.rovPanel.current.style.opacity = '1';
        addAILine('--- VESSEL ON STATION AT FAULT SITE ---', 'ok', 0);
        addAILine('VSS Varunasetu stationed directly above fault.', 'info', 500);
        addAILine('ROV NEMO-7 released from vessel hull sliding down...', 'ok', 1000);
        addAILine('Descending at 1.8 m/s towards seabed cable furrow...', 'info', 1800);
      }

      function triggerROVRepair() {
        phase = 6;
        setPhaseText('◈ PHASE 7: ROV ON-SITE — MECHANICAL SPLICE REPAIR UNDERWAY');
        if (h.rovStatus.current) { h.rovStatus.current.textContent = 'ON-SITE'; h.rovStatus.current.style.color = '#10B981'; }
        if (h.rovTask.current) h.rovTask.current.textContent = 'SPLICE REPAIR';
        rovSpot.intensity = 3.5;
        addAILine('ROV reached seabed (4,200m).', 'ok', 0);
        addAILine('Fault section located visually.', 'ok', 800);
        addAILine('Mechanical splice repair initiated...', 'info', 1600);
        addAILine('Fiber alignment: IN PROGRESS...', 'info', 3500);
        addAILine('Pressure sleeve installed.', 'ok', 6000);
        addAILine('Signal test: PASS on 8/8 fibers. OK', 'ok', 8000);
        addAILine('Full capacity restoration imminent.', 'ok', 9500);
      }

      function triggerRestored() {
        phase = 7;
        setPhaseText('◈ PHASE 8: CABLE FULLY RESTORED — 4.8 TBPS OPERATIONAL');
        cable1.visible = false; cable2.visible = false;
        cableAlt.visible = false; apMat.opacity = 0;
        cableFull.visible = true;
        (cableFull.material as THREE.MeshPhongMaterial).color.set(0x10b981);
        (cableFull.material as THREE.MeshPhongMaterial).emissive.set(0x10b981);
        (cableFull.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.55;
        sparkMat.opacity = 0; ringMat.opacity = 0; faultLight.intensity = 0;
        (arcLine.material as THREE.LineBasicMaterial).opacity = 0;
        if (h.faultTag.current) h.faultTag.current.style.opacity = '0';

        if (h.throughput.current) { h.throughput.current.textContent = '4.8 Tbps'; h.throughput.current.style.color = '#10B981'; }
        setBar(h.thruBar.current, 96, '#10b981');
        if (h.latency.current) { h.latency.current.textContent = '12.3 ms'; h.latency.current.style.color = '#10B981'; }
        if (h.pktLoss.current) { h.pktLoss.current.textContent = '0.02%'; h.pktLoss.current.style.color = '#10B981'; }
        if (h.health.current) { h.health.current.textContent = 'RESTORED'; h.health.current.style.color = '#10B981'; }
        setBar(h.healthBar.current, 100, '#10b981');
        if (h.fibers.current) { h.fibers.current.textContent = '8 / 8'; h.fibers.current.style.color = '#10B981'; }
        dot(h.cblDot.current, '#10B981'); if (h.cblLabel.current) h.cblLabel.current.textContent = 'CABLE: NOMINAL';
        dot(h.dstDot.current, '#10B981'); if (h.dstLabel.current) h.dstLabel.current.textContent = 'DESTINATION: ONLINE';
        if (h.dstCardStat.current) { h.dstCardStat.current.textContent = 'RECEIVING'; h.dstCardStat.current.style.color = '#10B981'; }
        rovSpot.intensity = 0;
        addAILine('--- REPAIR COMPLETE OK ---', 'ok', 200);
        addAILine('Cable restored to full capacity.', 'ok', 1000);
        addAILine('All 8 fibers operational. OK', 'ok', 1800);
        addAILine('ROV NEMO-7 ascending to surface.', 'info', 2600);
      }

      /* ─── MAIN ANIMATION LOOP ─── */
      let rovDepthVal = 0;
      const clock = new THREE.Clock();

      function loop() {
        if (disposed) return;
        animId = requestAnimationFrame(loop);
        const dt = Math.min(clock.getDelta(), 0.05);
        t += dt;

        // Clock for HUD
        const mm = String(Math.floor(t/60)).padStart(2,'0');
        const ss = String(Math.floor(t%60)).padStart(2,'0');
        if (h.simTime.current) h.simTime.current.textContent = `SIMULATION TIME: 00:${mm}:${ss}`;

        /* — Phase transitions — */
        if (!triggered.break     && t > PHASE_TIMES.BREAK)       { triggered.break = true;      triggerBreak();     }
        if (!triggered.ai        && t > PHASE_TIMES.AI_DETECT)    { triggered.ai = true;          triggerAI();        }
        if (!triggered.alt       && t > PHASE_TIMES.ALT_ROUTE)    { triggered.alt = true;         triggerAltRoute();  }
        if (!triggered.ship      && t > PHASE_TIMES.SHIP_ARRIVE)  { triggered.ship = true;        triggerShip();      }
        if (!triggered.rov       && t > PHASE_TIMES.ROV_DEPLOY)   { triggered.rov = true;         triggerROVDeploy(); }
        if (!triggered.repair    && t > PHASE_TIMES.ROV_REPAIR)   { triggered.repair = true;      triggerROVRepair(); }
        if (!triggered.restored  && t > PHASE_TIMES.RESTORED)     { triggered.restored = true;    triggerRestored();  }

        /* — Ocean waves — */
        for (let i = 0; i < oceanPos.count; i++) {
          const ox = oceanOrigX[i], oz = oceanOrigZ[i];
          const w = Math.sin(ox*0.28 + t*1.3)*0.28 + Math.sin(oz*0.38 + t*0.85)*0.18 + Math.sin((ox+oz)*0.18+t)*0.12;
          oceanPos.setY(i, w);
        }
        oceanPos.needsUpdate = true;
        oceanGeo.computeVertexNormals();

        /* — Bio particles drift — */
        for (let i = 0; i < bioN; i++) {
          let py = bioPos[i*3+1];
          py += 0.006;
          if (py > 0) py = -2 - Math.random()*12;
          bioPos[i*3+1] = py;
          bioPos[i*3]   += Math.sin(t*0.4 + i)*0.003;
        }
        bioGeo.attributes.position.needsUpdate = true;

        /* ── Seaweed Gentle Ocean Sway ── */
        for (let i = 0; i < weedClumps.length; i++) {
          const w = weedClumps[i];
          w.rotation.z = Math.sin(t * 1.4 + i * 0.9) * 0.07;
          w.rotation.x = Math.cos(t * 1.1 + i * 0.7) * 0.05;
        }

        /* — Data particles — */
        const PSPD = 0.0045;
        for (let i = 0; i < PN; i++) {
          if (phase === 0 || phase === 7) {
            pTs[i] = (pTs[i] + PSPD) % 1;
            const p = (phase === 7 ? fullCurve : fullCurve).getPoint(pTs[i]);
            pBuf[i*3]=p.x; pBuf[i*3+1]=p.y; pBuf[i*3+2]=p.z;
          } else if (phase >= 1 && phase < 3) {
            // Only source side
            pTs[i] = (pTs[i] + PSPD);
            if (pTs[i] >= BREAK_T - 0.04) pTs[i] = (i/PN)*BREAK_T*0.5;
            const p = fullCurve.getPoint(Math.min(pTs[i], BREAK_T-0.04));
            pBuf[i*3]=p.x; pBuf[i*3+1]=p.y; pBuf[i*3+2]=p.z;
          } else {
            // Alt route particles active
            apTs[i] = (apTs[i] + PSPD) % 1;
            const ap = altCurve.getPoint(apTs[i]);
            apBuf[i*3]=ap.x; apBuf[i*3+1]=ap.y; apBuf[i*3+2]=ap.z;
            // Keep main cable particles at source side only
            pTs[i] = (pTs[i] + PSPD);
            if (pTs[i] >= BREAK_T - 0.04) pTs[i] = (i/PN)*BREAK_T*0.5;
            const p = fullCurve.getPoint(Math.min(pTs[i], BREAK_T-0.04));
            pBuf[i*3]=p.x; pBuf[i*3+1]=p.y; pBuf[i*3+2]=p.z;
          }
        }
        pGeo.attributes.position.needsUpdate = true;
        apGeo.attributes.position.needsUpdate = true;

        /* — Sparks — */
        if (phase >= 1 && phase < 7) {
          for (let i = 0; i < SN; i++) {
            const sv = sparkVel[i];
            sv.life -= dt*2;
            if (sv.life <= 0) {
              sv.life = 0.4 + Math.random()*0.6;
              sparkBuf[i*3]   = breakPos.x + (Math.random()-0.5)*0.4;
              sparkBuf[i*3+1] = breakPos.y + (Math.random()-0.5)*0.4;
              sparkBuf[i*3+2] = breakPos.z + (Math.random()-0.5)*0.4;
              sv.vx = (Math.random()-0.5)*0.6; sv.vy = (Math.random()-0.5)*0.5; sv.vz = (Math.random()-0.5)*0.5;
            } else {
              sparkBuf[i*3]   += sv.vx*dt*2.5;
              sparkBuf[i*3+1] += sv.vy*dt*2.5 - dt*0.4;
              sparkBuf[i*3+2] += sv.vz*dt*2.5;
            }
          }
          sparkGeo.attributes.position.needsUpdate = true;
          sparkMat.opacity = 0.6 + Math.sin(t*22)*0.4;
          faultLight.intensity = 5 + Math.sin(t*18)*3.5;

          // Arc flicker
          (arcLine.material as THREE.LineBasicMaterial).opacity = 0.5 + Math.sin(t*30)*0.5;
          const arcPos = arcGeo.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < 12; i++) {
            arcPos.setX(i, breakPos.x + (Math.random()-0.5)*1.1);
            arcPos.setY(i, breakPos.y + (Math.random()-0.5)*1.1);
            arcPos.setZ(i, breakPos.z + (Math.random()-0.5)*0.8);
          }
          arcGeo.attributes.position.needsUpdate = true;

          // Ring pulse
          ringMat.opacity = 0.4 + Math.sin(t*5)*0.45;
          ring.scale.setScalar(1 + Math.sin(t*2.5)*0.12);
          ring.rotation.z = t*0.6;
        }

        /* ── Ship sailing ── */
        if (phase === 4) {
          if (ship.position.x < breakPos.x - 0.1) {
            ship.position.x += dt * 5.2;
          } else {
            ship.position.x = breakPos.x;
            // WHEN SHIP REACHES THE CENTER: Trigger ROV deploy from ship sliding down
            if (!triggered.rov) {
              triggered.rov = true;
              triggerROVDeploy();
            }
          }
          ship.position.y = 0.4 + Math.sin(t*0.85)*0.12;
          ship.rotation.z = Math.sin(t*0.7)*0.02;
        } else if (phase >= 5) {
          // Ship stays stationary on station above fault site
          ship.position.x = breakPos.x;
          ship.position.y = 0.4 + Math.sin(t*0.85)*0.12;
          ship.rotation.z = Math.sin(t*0.7)*0.02;
        }

        /* ── ROV sliding down from ship ── */
        if (phase === 5) {
          if (rov.position.y > breakPos.y + 1.05) {
            // Smoothly slide down through the water column
            rov.position.y -= dt * 2.2;
            const progress = (0.2 - rov.position.y) / (0.2 - (breakPos.y + 1.05));
            rovDepthVal = Math.min(4200, Math.floor(Math.max(0, progress) * 4200));
            if (h.rovDepth.current) h.rovDepth.current.textContent = `${rovDepthVal.toLocaleString()} m`;
          } else {
            // ROV reached the seabed cable -> begin repair
            if (!triggered.repair) {
              triggered.repair = true;
              triggerROVRepair();
            }
          }
          // Tether update from ship hull to descending ROV
          tetherBuf[0] = ship.position.x;     tetherBuf[1] = ship.position.y + 0.8; tetherBuf[2] = 0;
          tetherBuf[3] = rov.position.x;      tetherBuf[4] = rov.position.y + 0.3;  tetherBuf[5] = 0;
          tetherGeo.attributes.position.needsUpdate = true;

          // Bubbles
          for (let i = 0; i < BN; i++) {
            const b = bubData[i];
            b.y += b.sp;
            if (b.y > 0) { b.y = rov.position.y; b.x = rov.position.x + (Math.random()-0.5)*0.5; }
            bubBuf[i*3]   = b.x + Math.sin(t*2 + b.ox)*0.15;
            bubBuf[i*3+1] = b.y;
            bubBuf[i*3+2] = b.z + Math.cos(t*2 + b.ox)*0.15;
          }
          bubGeo.attributes.position.needsUpdate = true;
        }

        /* ── ROV repairing ── */
        if (phase === 6) {
          rov.position.x = breakPos.x + Math.sin(t*1.2)*0.15;
          rov.position.y = breakPos.y + 1.0 + Math.sin(t*0.8)*0.08;
          rov.rotation.y = Math.sin(t*0.5)*0.1;
          rovSpot.intensity = 3.5 + Math.sin(t*8)*0.8;
          // Tether update
          tetherBuf[0] = ship.position.x;     tetherBuf[1] = ship.position.y + 0.8; tetherBuf[2] = 0;
          tetherBuf[3] = rov.position.x;      tetherBuf[4] = rov.position.y + 0.3;  tetherBuf[5] = 0;
          tetherGeo.attributes.position.needsUpdate = true;
        }

        controls.update();
        renderer.render(scene, camera);
      }

      loop();

      /* ─── RESIZE ─── */
      function onResize() {
        if (!mountRef.current) return;
        const nW = mountRef.current.clientWidth;
        const nH = mountRef.current.clientHeight;
        camera.aspect = nW / nH;
        camera.updateProjectionMatrix();
        renderer.setSize(nW, nH);
      }
      window.addEventListener('resize', onResize);

      /* ─── CLEANUP ─── */
      return () => {
        disposed = true;
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        if (mountRef.current?.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
      };
    }

    const cleanup = boot().catch(err => {
      console.error('CableBreakSim boot error:', err);
      return undefined;
    });
    return () => { cleanup.then(fn => fn?.()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── JSX ─── */
  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden select-none"
      style={{
        background: '#000000',
        fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Three.js canvas mount */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* ── TOP BAR (BLACK GLASS · REFINED TYPOGRAPHY) ── */}
      <div
        className="absolute top-0 left-0 right-0 h-13 flex items-center justify-between px-6 z-20"
        style={{
          background: 'rgba(5, 5, 5, 0.92)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#C87954',
              display: 'inline-block',
              boxShadow: '0 0 10px rgba(200, 121, 84, 0.8)',
              animation: 'pulse 2s infinite',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: '#FFFFFF' }}>
            VARUNASETU
          </span>
          <span style={{ fontSize: 10, color: '#8A8A8A', fontWeight: 500, letterSpacing: 1.5 }}>
            / SUBMARINE CABLE DIGITAL TWIN
          </span>
        </div>

        <div className="flex items-center gap-6">
          {[
            { dot: h.srcDot, label: h.srcLabel, initDot: '#10B981', initLabel: 'SOURCE: ONLINE' },
            { dot: h.cblDot, label: h.cblLabel, initDot: '#10B981', initLabel: 'CABLE: NOMINAL' },
            { dot: h.dstDot, label: h.dstLabel, initDot: '#10B981', initLabel: 'DESTINATION: ONLINE' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2" style={{ fontSize: 11, letterSpacing: 0.5 }}>
              <span
                ref={s.dot}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  display: 'inline-block',
                  background: s.initDot,
                  boxShadow: `0 0 6px ${s.initDot}`,
                }}
              />
              <span ref={s.label} style={{ color: '#E5E5E5', fontWeight: 600 }}>
                {s.initLabel}
              </span>
            </div>
          ))}
          <span
            ref={h.simTime}
            style={{
              fontSize: 11,
              color: '#F5F5F5',
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            SIMULATION TIME: 00:00:00
          </span>
        </div>

        <Link
          href="/workspace"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#FFFFFF',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            padding: '6px 14px',
            borderRadius: 8,
            textDecoration: 'none',
            transition: 'all .2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
        >
          ← EXIT SIM
        </Link>
      </div>

      {/* ── SCAN LINE (AI phase) ── */}
      <div
        ref={h.scanLine}
        style={{
          display: 'none',
          position: 'absolute',
          left: 0,
          right: 0,
          height: 2,
          top: 0,
          zIndex: 15,
          background: 'linear-gradient(90deg, transparent, rgba(200, 121, 84, 0.8), transparent)',
          animation: 'scanDown 3.5s linear infinite',
        }}
      />

      {/* ── LEFT PANEL: NETWORK TELEMETRY ── */}
      <div
        className="absolute z-20"
        style={{
          top: 64,
          left: 16,
          width: 230,
          background: 'rgba(8, 8, 8, 0.90)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: 12,
          padding: 15,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: 2,
            color: '#C87954',
            fontWeight: 700,
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            paddingBottom: 8,
            marginBottom: 12,
          }}
        >
          {`// NETWORK TELEMETRY`}
        </div>

        {[
          { label: 'THROUGHPUT', valRef: h.throughput, barRef: h.thruBar, initVal: '4.8 Tbps', initPct: 96, initCol: '#10B981' },
          { label: 'LATENCY',    valRef: h.latency,    barRef: h.latBar,  initVal: '12.3 ms',  initPct: 88, initCol: '#10B981' },
        ].map((row, i) => (
          <div key={i} style={{ marginTop: i ? 11 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#8A8A8A', fontWeight: 600, letterSpacing: 0.8 }}>{row.label}</span>
              <span ref={row.valRef} style={{ fontSize: 11, color: '#10B981', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{row.initVal}</span>
            </div>
            <div style={{ height: 4, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
              <div ref={row.barRef} style={{ height: '100%', borderRadius: 2, background: row.initCol, width: `${row.initPct}%`, transition: 'width .6s ease, background .6s ease' }} />
            </div>
          </div>
        ))}

        {[
          { label: 'PACKET LOSS', valRef: h.pktLoss, initVal: '0.02%' },
          { label: 'CABLE DEPTH', initVal: '4,200 m' },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 }}>
            <span style={{ fontSize: 10, color: '#8A8A8A', fontWeight: 600, letterSpacing: 0.8 }}>{row.label}</span>
            <span ref={'valRef' in row ? row.valRef : undefined} style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>{'initVal' in row ? row.initVal : ''}</span>
          </div>
        ))}

        <div style={{ marginTop: 11 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#8A8A8A', fontWeight: 600, letterSpacing: 0.8 }}>CABLE HEALTH</span>
            <span ref={h.health} style={{ fontSize: 11, color: '#10B981', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>NOMINAL</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
            <div ref={h.healthBar} style={{ height: '100%', borderRadius: 2, background: '#10B981', width: '100%', transition: 'width .6s ease, background .6s ease' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 }}>
          <span style={{ fontSize: 10, color: '#8A8A8A', fontWeight: 600, letterSpacing: 0.8 }}>ACTIVE FIBERS</span>
          <span ref={h.fibers} style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>8 / 8</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 11 }}>
          <span style={{ fontSize: 10, color: '#8A8A8A', fontWeight: 600, letterSpacing: 0.8 }}>SEA TEMP</span>
          <span style={{ fontSize: 11, color: '#FFFFFF', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>2.4°C</span>
        </div>
      </div>

      {/* ── RIGHT PANEL: AI LOG ── */}
      <div
        ref={h.aiPanel}
        className="absolute z-20"
        style={{
          top: 64,
          right: 16,
          width: 290,
          background: 'rgba(8, 8, 8, 0.90)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: 12,
          padding: 15,
          backdropFilter: 'blur(16px)',
          opacity: 0,
          transition: 'opacity .5s ease',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: 2,
            color: '#C87954',
            fontWeight: 700,
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            paddingBottom: 8,
            marginBottom: 10,
          }}
        >
          {`// AI FAULT ANALYSIS`}
        </div>
        <div ref={h.aiLog} style={{ maxHeight: 240, overflowY: 'auto' }} />
      </div>

      {/* ── CENTER ALERT ── */}
      <div
        ref={h.alertBox}
        className="absolute z-20"
        style={{
          top: '42%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          textAlign: 'center',
          opacity: 0,
          transition: 'opacity .35s ease',
          pointerEvents: 'none',
          background: 'rgba(12, 6, 6, 0.95)',
          border: '1px solid #C87954',
          borderRadius: 12,
          padding: '18px 30px',
          boxShadow: '0 12px 40px rgba(200, 121, 84, 0.35)',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 1.5, color: '#C87954' }}>
           CRITICAL ALERT: SUBMARINE CABLE FAILURE DETECTED
        </div>
        <div style={{ fontSize: 11, color: '#FFFFFF', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, letterSpacing: 1, marginTop: 8 }}>
          FAULT: {faultName.toUpperCase()} &nbsp;|&nbsp; {faultLoc} &nbsp;|&nbsp; DEPTH: {faultDepth}
        </div>
      </div>

      {/* ── FAULT TAG (world-space approximation) ── */}
      <div ref={h.faultTag} className="absolute z-20" style={{ top: '47%', left: '52%', opacity: 0, transition: 'opacity .5s ease', pointerEvents: 'none' }}>
        <div
          style={{
            background: 'rgba(15, 6, 6, 0.94)',
            border: '1px solid #C87954',
            borderRadius: 8,
            padding: '7px 13px',
            fontSize: 10,
            color: '#C87954',
            fontWeight: 700,
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: 0.5,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(200, 121, 84, 0.3)',
          }}
        >
          ⊗ {faultName}<br />{faultLoc}<br />DEPTH: {faultDepth}
        </div>
      </div>

      {/* ── STATION CARDS ── */}
      <div
        ref={h.srcCard}
        className="absolute z-20"
        style={{
          bottom: 56,
          left: 250,
          background: 'rgba(8, 8, 8, 0.90)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: 10,
          padding: '10px 15px',
          backdropFilter: 'blur(12px)',
          minWidth: 170,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: 1, color: '#FFFFFF', fontWeight: 700, marginBottom: 4 }}>
          ◈ MUMBAI LANDING STN
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span ref={h.srcCardStat} style={{ fontSize: 9, color: '#10B981', fontWeight: 700, letterSpacing: 0.6 }}>
            TRANSMITTING
          </span>
        </div>
        <div style={{ marginTop: 4, fontSize: 9, color: '#8A8A8A', fontFamily: "'IBM Plex Mono', monospace" }}>
          19.07°N, 72.88°E
        </div>
      </div>

      <div
        ref={h.dstCard}
        className="absolute z-20"
        style={{
          bottom: 56,
          right: 250,
          background: 'rgba(8, 8, 8, 0.90)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: 10,
          padding: '10px 15px',
          backdropFilter: 'blur(12px)',
          minWidth: 170,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: 1, color: '#FFFFFF', fontWeight: 700, marginBottom: 4 }}>
          ◈ FUJAIRAH LANDING STN
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span ref={h.dstCardStat} style={{ fontSize: 9, color: '#10B981', fontWeight: 700, letterSpacing: 0.6 }}>
            RECEIVING
          </span>
        </div>
        <div style={{ marginTop: 4, fontSize: 9, color: '#8A8A8A', fontFamily: "'IBM Plex Mono', monospace" }}>
          25.13°N, 56.33°E
        </div>
      </div>

      {/* ── ROV PANEL ── */}
      <div
        ref={h.rovPanel}
        className="absolute z-20"
        style={{
          bottom: 56,
          right: 16,
          width: 215,
          background: 'rgba(8, 8, 8, 0.90)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: 10,
          padding: 13,
          backdropFilter: 'blur(16px)',
          opacity: 0,
          transition: 'opacity .5s ease',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: 2,
            color: '#10B981',
            fontWeight: 700,
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            paddingBottom: 6,
            marginBottom: 9,
          }}
        >
          {`// ROV DEPLOYMENT`}
        </div>
        {[
          { label: 'STATUS', ref: h.rovStatus, init: 'DESCENDING', col: '#C87954' },
          { label: 'DEPTH',  ref: h.rovDepth,  init: '0 m',        col: '#FFFFFF' },
          { label: 'TASK',   ref: h.rovTask,   init: 'LOCATING FAULT', col: '#8A8A8A' },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: i ? 8 : 0 }}>
            <span style={{ fontSize: 10, color: '#8A8A8A', fontWeight: 600, letterSpacing: 0.8 }}>{row.label}</span>
            <span ref={row.ref} style={{ fontSize: 10, color: row.col, fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
              {row.init}
            </span>
          </div>
        ))}
      </div>

      {/* ── PHASE INDICATOR (BOTTOM CENTER) ── */}
      <div
        className="absolute z-20"
        style={{
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(8, 8, 8, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 24,
          padding: '8px 26px',
          backdropFilter: 'blur(16px)',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
        }}
      >
        <span
          ref={h.phase}
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1,
            color: '#F5F5F5',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          ◈ PHASE 1: NORMAL OPERATION — DATA FLOWING AT 4.8 TBPS
        </span>
      </div>

      {/* ── CONTROLS ── */}
      <div className="absolute z-20 flex gap-2" style={{ bottom: 14, right: 16 }}>
        {[
          { label: '↺ RESTART', action: () => window.location.reload() },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 8,
              padding: '6px 14px',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: 1,
              cursor: 'pointer',
              transition: 'all .2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
        @keyframes alertPulse { from{opacity:1;box-shadow:0 0 20px rgba(200,121,84,.5)} to{opacity:.85;box-shadow:0 0 35px rgba(200,121,84,.8)} }
        @keyframes scanDown { from{top:48px} to{top:100%} }
      `}</style>
    </div>
  );
}
