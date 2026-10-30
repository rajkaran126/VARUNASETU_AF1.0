'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type * as THREE from 'three';

/* =========================================================
   VARUNASETU — Submarine Cable Break & Recovery Simulation
   Phase timeline:
     0 → Normal operation (data flowing)
     1 → Cable rupture + sparks (t=8s)
     2 → AI fault detection scan (t=14s)
     3 → Alternative route established (t=22s)
     4 → Repair vessel sailing to site (t=30s)
     5 → ROV deployed from ship (t=38s)
     6 → ROV on-site, splice repair (t=48s)
     7 → Full restoration (t=62s)
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
    loading:      useRef<HTMLDivElement>(null),
    loadBar:      useRef<HTMLDivElement>(null),
    loadText:     useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    if (!mountRef.current) return;
    let animId = 0;
    let disposed = false;

    // Start loading animation immediately (independent of boot)
    const loadingSteps = [
      { text: 'LOADING OCEAN TERRAIN...', pct: 20 },
      { text: 'INITIALIZING CABLE NETWORK...', pct: 45 },
      { text: 'CALIBRATING AI SYSTEMS...', pct: 70 },
      { text: 'DEPLOYING DIGITAL TWIN...', pct: 92 },
      { text: 'SIMULATION READY ✓', pct: 100 },
    ];
    let loadIdx = 0;
    function runLoadStep() {
      if (loadIdx < loadingSteps.length) {
        if (h.loadText.current) h.loadText.current.textContent = loadingSteps[loadIdx].text;
        if (h.loadBar.current)  h.loadBar.current.style.width = `${loadingSteps[loadIdx].pct}%`;
        loadIdx++;
        setTimeout(runLoadStep, 550);
      } else {
        setTimeout(() => {
          if (h.loading.current) {
            h.loading.current.style.opacity = '0';
            setTimeout(() => { if (h.loading.current) h.loading.current.style.display = 'none'; }, 900);
          }
        }, 400);
      }
    }
    setTimeout(runLoadStep, 200);

    async function boot() {
      const THREE = await import('three');
      const { OrbitControls } = await import(
        'three/examples/jsm/controls/OrbitControls.js'
      );

      /* ─── RENDERER ─── */
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(mountRef.current!.clientWidth, mountRef.current!.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.75;
      mountRef.current!.appendChild(renderer.domElement);

      /* ─── SCENE ─── */
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x010A15);
      scene.fog = new THREE.FogExp2(0x010A15, 0.022);

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

      /* ─── LIGHTS ─── */
      scene.add(new THREE.AmbientLight(0x0A1828, 2.2));
      scene.add(new THREE.HemisphereLight(0x0D2448, 0x060E1A, 1.6));

      const sun = new THREE.DirectionalLight(0x1A4070, 1.4);
      sun.position.set(6, 30, 10);
      sun.castShadow = true;
      scene.add(sun);

      const srcLight = new THREE.PointLight(0x00E5FF, 3.5, 14);
      srcLight.position.set(-23, 2, 0);
      scene.add(srcLight);

      const dstLight = new THREE.PointLight(0x00E5FF, 3.5, 14);
      dstLight.position.set(23, 2, 0);
      scene.add(dstLight);

      const faultLight = new THREE.PointLight(0xFF1744, 0, 10);
      faultLight.position.set(3, -8, 0);
      scene.add(faultLight);

      /* ─── SEABED ─── */
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
      const seabed = new THREE.Mesh(sbGeo, new THREE.MeshLambertMaterial({ color: 0x1B2B1E }));
      seabed.receiveShadow = true;
      scene.add(seabed);

      // Rocks
      const rockMat = new THREE.MeshLambertMaterial({ color: 0x263228 });
      [[-16,-10,3,1.3],[-8,-11,-2.5,0.9],[-3,-11,4.5,1.6],[5,-10,-3.5,1.0],[10,-10,2.5,1.2],[17,-10,-2.5,0.8],[-21,-9,-4.5,2.1],[0,-11,-5.5,1.4],[14,-9,5.5,1.9],[7,-10.5,5,1.1]].forEach(([x,y,z,s]) => {
        const r = new THREE.Mesh(new THREE.DodecahedronGeometry(s as number, 1), rockMat);
        r.position.set(x as number, y as number, z as number);
        r.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        scene.add(r);
      });

      // Floating bioluminescent particles
      const bioGeo = new THREE.BufferGeometry();
      const bioN = 200;
      const bioPos = new Float32Array(bioN * 3);
      for (let i = 0; i < bioN; i++) {
        bioPos[i*3]   = (Math.random()-0.5)*70;
        bioPos[i*3+1] = -2 - Math.random()*14;
        bioPos[i*3+2] = (Math.random()-0.5)*35;
      }
      bioGeo.setAttribute('position', new THREE.BufferAttribute(bioPos, 3));
      const bioMesh = new THREE.Points(bioGeo, new THREE.PointsMaterial({
        size: 0.12, color: 0x40E0D0, transparent: true, opacity: 0.35,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      scene.add(bioMesh);

      /* ─── OCEAN SURFACE ─── */
      const oceanGeo = new THREE.PlaneGeometry(90, 45, 90, 45);
      oceanGeo.rotateX(-Math.PI / 2);
      const oceanOrigY = new Float32Array(oceanGeo.attributes.position.count);
      for (let i = 0; i < oceanOrigY.length; i++) oceanOrigY[i] = 0;
      const oceanMat = new THREE.MeshPhongMaterial({
        color: 0x0C3358, emissive: 0x041525,
        transparent: true, opacity: 0.7, shininess: 130,
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

      /* ─── LANDING STATIONS ─── */
      function buildStation(x: number) {
        const g = new THREE.Group();
        const bldMat = new THREE.MeshPhongMaterial({ color: 0x1A3A5C, emissive: 0x0A1E30 });
        const winMat = new THREE.MeshPhongMaterial({ color: 0x00E5FF, emissive: 0x00E5FF, emissiveIntensity: 0.9 });
        const metMat = new THREE.MeshPhongMaterial({ color: 0x546E7A });
        const yelMat = new THREE.MeshPhongMaterial({ color: 0xFFC107, emissive: 0x7A5800, emissiveIntensity: 0.4 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(3.5, 4, 3), bldMat);
        body.position.y = 2; g.add(body);

        const roof = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.3, 6), metMat);
        roof.position.y = 4.3; g.add(roof);

        // Antenna
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4, 6), metMat);
        ant.position.y = 6.5; g.add(ant);

        // Dish
        const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.08, 0.25, 12), metMat);
        dish.position.set(0.8, 5.5, 0); dish.rotation.z = -Math.PI/5; g.add(dish);

        // Windows
        for (let i = 0; i < 3; i++) {
          const w = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.05), winMat);
          w.position.set(-0.6, 1.2 + i * 0.9, 1.53); g.add(w);
        }

        // Crane arm (for ship's ROV deployment reference visual on destination side)
        const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.5, 8), yelMat);
        cb.position.set(1.5, 3.75, 0); g.add(cb);
        const ca = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 0.14), yelMat);
        ca.position.set(2.2, 5.6, 0); g.add(ca);

        // Cable conduit to seabed
        const cd = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 9, 8), metMat);
        cd.position.y = -3; g.add(cd);

        g.position.set(x, 0, 0);
        scene.add(g);
        return g;
      }
      buildStation(-23);
      buildStation(23);

      // Landmass
      function addLand(x: number) {
        const lMat = new THREE.MeshLambertMaterial({ color: 0x2E6B30 });
        const sMat = new THREE.MeshLambertMaterial({ color: 0xC4A24A });
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
        const mat = new THREE.MeshPhongMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, shininess: 90 });
        return new THREE.Mesh(geo, mat);
      }

      const cableFull = makeTube(fullCurve, 0x00BCD4);
      scene.add(cableFull);

      const cable1 = makeTube(curve1, 0xFF1744); cable1.visible = false; scene.add(cable1);
      const cable2 = makeTube(curve2, 0xFF1744); cable2.visible = false; scene.add(cable2);
      const cableAlt = makeTube(altCurve, 0x00E676); cableAlt.visible = false; scene.add(cableAlt);

      /* ─── DATA PARTICLES ─── */
      const PN = 70;
      const pGeo = new THREE.BufferGeometry();
      const pBuf = new Float32Array(PN * 3);
      const pTs  = Array.from({length: PN}, (_, i) => i / PN);
      pGeo.setAttribute('position', new THREE.BufferAttribute(pBuf, 3));
      const pMesh = new THREE.Points(pGeo, new THREE.PointsMaterial({
        size: 0.38, color: 0x00E5FF, transparent: true, opacity: 0.92,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      scene.add(pMesh);

      // Alt-route particles
      const apBuf = new Float32Array(PN * 3);
      const apGeo = new THREE.BufferGeometry();
      const apTs  = Array.from({length: PN}, (_, i) => i / PN);
      apGeo.setAttribute('position', new THREE.BufferAttribute(apBuf, 3));
      const apMat = new THREE.PointsMaterial({
        size: 0.38, color: 0x00E676, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const apMesh = new THREE.Points(apGeo, apMat);
      scene.add(apMesh);

      /* ─── SPARKS AT BREAK ─── */
      const SN = 180;
      const sparkBuf = new Float32Array(SN * 3);
      const sparkGeo = new THREE.BufferGeometry();
      sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkBuf, 3));
      const sparkMat = new THREE.PointsMaterial({
        size: 0.22, color: 0xFF6D00, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const sparkMesh = new THREE.Points(sparkGeo, sparkMat);
      scene.add(sparkMesh);
      const sparkVel = Array.from({length: SN}, () => ({
        vx: (Math.random()-0.5)*0.6, vy: (Math.random()-0.5)*0.6, vz: (Math.random()-0.5)*0.6,
        life: Math.random(),
      }));

      // Electrical arc (zig-zag line at break)
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
        color: 0xFFEA00, transparent: true, opacity: 0,
      }));
      scene.add(arcLine);

      // Warning ring
      const ringMat = new THREE.MeshPhongMaterial({ color: 0xFF1744, emissive: 0xFF1744, emissiveIntensity: 1.2, transparent: true, opacity: 0 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.09, 8, 40), ringMat);
      ring.position.copy(breakPos);
      scene.add(ring);

      /* ─── REPAIR SHIP ─── */
      const ship = new THREE.Group();
      const shipHull   = new THREE.Mesh(new THREE.BoxGeometry(7, 1.6, 3), new THREE.MeshPhongMaterial({ color: 0x37474F }));
      shipHull.position.y = 0.8; ship.add(shipHull);
      const shipBridge = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.4), new THREE.MeshPhongMaterial({ color: 0x546E7A }));
      shipBridge.position.set(-1.8, 2.3, 0); ship.add(shipBridge);
      const shipCrane  = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.8, 8), new THREE.MeshPhongMaterial({ color: 0xFFC107, emissive: 0x7A5800 }));
      shipCrane.position.set(1.8, 2.7, 0); ship.add(shipCrane);
      const shipArm    = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.15, 0.15), new THREE.MeshPhongMaterial({ color: 0xFFC107 }));
      shipArm.position.set(2.0, 4.7, 0); ship.add(shipArm);
      // Mast light
      const mLight = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshPhongMaterial({ color: 0xFFFFFF, emissive: 0xFFFF00, emissiveIntensity: 2 }));
      mLight.position.set(3.4, 2, 0); ship.add(mLight);
      ship.position.set(-55, 0.4, 0); // starts off-screen
      scene.add(ship);

      /* ─── ROV ─── */
      const rov = new THREE.Group();
      const rovBody = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.65, 0.9), new THREE.MeshPhongMaterial({ color: 0xFF6D00, emissive: 0x3E1B00 }));
      rov.add(rovBody);
      // Thrusters
      const thrMat = new THREE.MeshPhongMaterial({ color: 0x263238 });
      [[0.75,0.3,0.35],[-0.75,0.3,0.35],[0.75,0.3,-0.35],[-0.75,0.3,-0.35]].forEach(([tx,ty,tz]) => {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.22,8), thrMat);
        t.position.set(tx as number, ty as number, tz as number); t.rotation.z = Math.PI/2; rov.add(t);
      });
      // Front lights
      const rovLightMat = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, emissive: 0x00E5FF, emissiveIntensity: 2.5 });
      [-0.22, 0.22].forEach(lx => {
        const rl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), rovLightMat);
        rl.position.set(lx, 0, 0.46); rov.add(rl);
      });
      // ROV spot
      const rovSpot = new THREE.SpotLight(0x00BFFF, 0, 15, Math.PI/6, 0.5);
      rovSpot.position.set(0, 0, 0.5);
      rov.add(rovSpot);

      rov.position.set(breakPos.x, 0.4, 0);
      rov.visible = false;
      scene.add(rov);

      // Tether
      const tetherBuf = new Float32Array(6);
      const tetherGeo = new THREE.BufferGeometry();
      tetherGeo.setAttribute('position', new THREE.BufferAttribute(tetherBuf, 3));
      const tetherLine = new THREE.Line(tetherGeo, new THREE.LineBasicMaterial({ color: 0x78909C, transparent: true, opacity: 0 }));
      scene.add(tetherLine);

      /* ─── BUBBLES ─── */
      const BN = 40;
      const bubBuf = new Float32Array(BN * 3);
      const bubGeo = new THREE.BufferGeometry();
      bubGeo.setAttribute('position', new THREE.BufferAttribute(bubBuf, 3));
      const bubMat = new THREE.PointsMaterial({ size: 0.14, color: 0xB3E5FC, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
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
        el.style.boxShadow = `0 0 7px ${col}`;
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
          d.style.cssText = `font-size:9px;letter-spacing:.5px;line-height:1.9;opacity:0;transition:opacity .4s;`;
          d.style.color = cls === 'ok' ? '#00E676' : cls === 'crit' ? '#FF5252' : cls === 'warn' ? '#FFC107' : '#4DD0E1';
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
        dot(h.cblDot.current, '#FF1744'); if (h.cblLabel.current) h.cblLabel.current.textContent = 'CABLE: SEVERED';
        dot(h.dstDot.current, '#FF1744'); if (h.dstLabel.current) h.dstLabel.current.textContent = 'DESTINATION: LOST';
        if (h.throughput.current) { h.throughput.current.textContent = '0.0 Tbps'; h.throughput.current.style.color = '#FF5252'; }
        setBar(h.thruBar.current, 0, '#FF1744');
        if (h.latency.current) { h.latency.current.textContent = '∞ ms'; h.latency.current.style.color = '#FF5252'; }
        if (h.pktLoss.current) { h.pktLoss.current.textContent = '100%'; h.pktLoss.current.style.color = '#FF5252'; }
        if (h.health.current) { h.health.current.textContent = 'SEVERED'; h.health.current.style.color = '#FF5252'; }
        setBar(h.healthBar.current, 4, '#FF1744');
        if (h.fibers.current) { h.fibers.current.textContent = '0 / 8'; h.fibers.current.style.color = '#FF5252'; }
        if (h.dstCardStat.current) { h.dstCardStat.current.textContent = 'SIGNAL LOST'; h.dstCardStat.current.style.color = '#FF5252'; }
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
        addAILine('AI FAULT DETECTION COMPLETE ✓', 'ok', 9900);
      }

      function triggerAltRoute() {
        phase = 3;
        setPhaseText('◈ PHASE 4: ALTERNATIVE ROUTE ESTABLISHED — REROUTING TRAFFIC');
        if (h.scanLine.current) h.scanLine.current.style.display = 'none';
        cableAlt.visible = true;
        apMat.opacity = 0.9;

        if (h.throughput.current) { h.throughput.current.textContent = '2.1 Tbps'; h.throughput.current.style.color = '#FFC107'; }
        setBar(h.thruBar.current, 44, '#FFC107');
        if (h.latency.current) { h.latency.current.textContent = '31.5 ms'; h.latency.current.style.color = '#FFC107'; }
        if (h.pktLoss.current) { h.pktLoss.current.textContent = '0.8%'; h.pktLoss.current.style.color = '#FFC107'; }
        if (h.health.current) { h.health.current.textContent = 'ALT ROUTE'; h.health.current.style.color = '#FFC107'; }
        setBar(h.healthBar.current, 44, '#FFC107');
        dot(h.dstDot.current, '#FFC107'); if (h.dstLabel.current) h.dstLabel.current.textContent = 'DESTINATION: REROUTED';
        if (h.dstCardStat.current) { h.dstCardStat.current.textContent = 'ALT ROUTE ACTIVE'; h.dstCardStat.current.style.color = '#FFC107'; }

        addAILine('--- REROUTING INITIATED ---', 'warn', 600);
        addAILine('Traffic shifted to SEA-ME-WE 5.', 'info', 1500);
        addAILine('Throughput: 2.1 Tbps (44% nominal).', 'warn', 2400);
        addAILine('Connectivity RESTORED via alt route. ✓', 'ok', 3300);
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
        setPhaseText('◈ PHASE 6: ROV "NEMO-7" DEPLOYMENT IN PROGRESS');
        rov.visible = true;
        rov.position.set(ship.position.x + 1.8, 4.5, 0);
        (tetherLine.material as THREE.LineBasicMaterial).opacity = 0.85;
        bubMat.opacity = 0.65;
        if (h.rovPanel.current) h.rovPanel.current.style.opacity = '1';
        addAILine('--- ROV DEPLOYMENT ---', 'ok', 0);
        addAILine('ROV NEMO-7 launched from crane.', 'info', 600);
        addAILine('Descending at 0.5 m/s to 4,200m...', 'info', 1200);
      }

      function triggerROVRepair() {
        phase = 6;
        setPhaseText('◈ PHASE 7: ROV ON-SITE — MECHANICAL SPLICE REPAIR UNDERWAY');
        if (h.rovStatus.current) { h.rovStatus.current.textContent = 'ON-SITE'; h.rovStatus.current.style.color = '#00E676'; }
        if (h.rovTask.current) h.rovTask.current.textContent = 'SPLICE REPAIR';
        rovSpot.intensity = 3;
        addAILine('ROV reached seabed (4,200m).', 'ok', 0);
        addAILine('Fault section located visually.', 'ok', 800);
        addAILine('Mechanical splice repair initiated...', 'info', 1600);
        addAILine('Fiber alignment: IN PROGRESS...', 'info', 3500);
        addAILine('Pressure sleeve installed.', 'ok', 6000);
        addAILine('Signal test: PASS on 8/8 fibers. ✓', 'ok', 8000);
        addAILine('Full capacity restoration imminent.', 'ok', 9500);
      }

      function triggerRestored() {
        phase = 7;
        setPhaseText('◈ PHASE 8: CABLE FULLY RESTORED — 4.8 TBPS OPERATIONAL');
        cable1.visible = false; cable2.visible = false;
        cableAlt.visible = false; apMat.opacity = 0;
        cableFull.visible = true;
        (cableFull.material as THREE.MeshPhongMaterial).color.set(0x00E676);
        (cableFull.material as THREE.MeshPhongMaterial).emissive.set(0x00E676);
        (cableFull.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.55;
        sparkMat.opacity = 0; ringMat.opacity = 0; faultLight.intensity = 0;
        (arcLine.material as THREE.LineBasicMaterial).opacity = 0;
        if (h.faultTag.current) h.faultTag.current.style.opacity = '0';

        if (h.throughput.current) { h.throughput.current.textContent = '4.8 Tbps'; h.throughput.current.style.color = '#00E676'; }
        setBar(h.thruBar.current, 96, '#00E676');
        if (h.latency.current) { h.latency.current.textContent = '12.3 ms'; h.latency.current.style.color = '#00E676'; }
        if (h.pktLoss.current) { h.pktLoss.current.textContent = '0.02%'; h.pktLoss.current.style.color = '#00E676'; }
        if (h.health.current) { h.health.current.textContent = 'RESTORED'; h.health.current.style.color = '#00E676'; }
        setBar(h.healthBar.current, 100, '#00E676');
        if (h.fibers.current) { h.fibers.current.textContent = '8 / 8'; h.fibers.current.style.color = '#00E676'; }
        dot(h.cblDot.current, '#00E676'); if (h.cblLabel.current) h.cblLabel.current.textContent = 'CABLE: NOMINAL';
        dot(h.dstDot.current, '#00E676'); if (h.dstLabel.current) h.dstLabel.current.textContent = 'DESTINATION: ONLINE';
        if (h.dstCardStat.current) { h.dstCardStat.current.textContent = 'RECEIVING'; h.dstCardStat.current.style.color = '#00E676'; }
        rovSpot.intensity = 0;
        addAILine('--- REPAIR COMPLETE ✓ ---', 'ok', 200);
        addAILine('Cable restored to full capacity.', 'ok', 1000);
        addAILine('All 8 fibers operational. ✓', 'ok', 1800);
        addAILine('ROV NEMO-7 ascending to surface.', 'info', 2600);
      }

      /* ─── MAIN ANIMATION LOOP ─── */
      let rovDepthVal = 0;

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

        /* — Ship sailing — */
        if (phase >= 4) {
          if (ship.position.x < breakPos.x - 0.1) {
            ship.position.x += dt*3.5;
          } else {
            ship.position.x = breakPos.x;
          }
          ship.position.y = 0.4 + Math.sin(t*0.85)*0.12;
          ship.rotation.z = Math.sin(t*0.7)*0.02;
        }

        /* — ROV descent — */
        if (phase >= 5 && rov.visible) {
          const target = breakPos.y + 0.5;
          if (rov.position.y > target) {
            rov.position.y -= dt*1.4;
            rovDepthVal = Math.abs(rov.position.y)*420;
            if (h.rovDepth.current) h.rovDepth.current.textContent = `${Math.floor(rovDepthVal)} m`;
          } else {
            rov.position.y = target;
            rov.position.x = breakPos.x + Math.sin(t*0.35)*0.22;
            if (h.rovDepth.current) h.rovDepth.current.textContent = '4,200 m';
          }

          // Update tether
          const craneX = ship.position.x + 1.8, craneY = 4.7;
          tetherBuf[0] = craneX; tetherBuf[1] = craneY; tetherBuf[2] = 0;
          tetherBuf[3] = rov.position.x; tetherBuf[4] = rov.position.y; tetherBuf[5] = rov.position.z;
          tetherGeo.attributes.position.needsUpdate = true;

          // Bubbles
          for (let i = 0; i < BN; i++) {
            const b = bubData[i];
            if (b.y > 1) { b.x = rov.position.x+(Math.random()-0.5)*0.5; b.y = rov.position.y+0.4; b.z = (Math.random()-0.5)*0.5; }
            b.y += b.sp; b.x += Math.sin(t*2+b.ox)*0.005;
            bubBuf[i*3]=b.x; bubBuf[i*3+1]=b.y; bubBuf[i*3+2]=b.z;
          }
          bubGeo.attributes.position.needsUpdate = true;
        }

        /* — Station lights — */
        srcLight.intensity = 3 + Math.sin(t*2.8)*0.5;
        dstLight.intensity = (phase>=1 && phase<3) ? 0.5 + Math.sin(t*4)*0.3 : 3 + Math.sin(t*2.8+1)*0.5;

        controls.update();
        renderer.render(scene, camera);
      }

      // ─ Clock (must be created before loop) ─
      const clock = new THREE.Clock();
      clock.start();
      loop();

      /* ─── RESIZE ─── */
      const onResize = () => {
        if (!mountRef.current) return;
        const w = mountRef.current.clientWidth, hh = mountRef.current.clientHeight;
        camera.aspect = w / hh;
        camera.updateProjectionMatrix();
        renderer.setSize(w, hh);
      };
      window.addEventListener('resize', onResize);

      /* ─── LOADING SPLASH is handled outside boot() ─── */

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
      // Still dismiss loading screen on error
      if (h.loading.current) {
        h.loading.current.style.opacity = '0';
        setTimeout(() => { if (h.loading.current) h.loading.current.style.display = 'none'; }, 900);
      }
      return undefined;
    });
    return () => { cleanup.then(fn => fn?.()); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── JSX ─── */
  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none" style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", background: '#010A15' }}>

      {/* Three.js canvas mount */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* ── LOADING SCREEN ── */}
      <div ref={h.loading} className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ background:'#000C1A', transition:'opacity .9s' }}>
        <div style={{ fontSize:26, fontWeight:'bold', letterSpacing:7, color:'#00E5FF', textShadow:'0 0 30px rgba(0,229,255,.5)' }}>VARUNASETU</div>
        <div style={{ fontSize:9, letterSpacing:3, color:'#4DD0E1', marginTop:8 }}>SUBMARINE CABLE RESILIENCE SIMULATION</div>
        <div style={{ width:220, height:2, background:'rgba(0,200,255,.12)', borderRadius:1, marginTop:24, overflow:'hidden' }}>
          <div ref={h.loadBar} style={{ height:'100%', background:'#00E5FF', borderRadius:1, width:'0%', transition:'width 1.2s ease' }} />
        </div>
        <div ref={h.loadText} style={{ fontSize:10, letterSpacing:2, color:'#4DD0E1', marginTop:14, animation:'pulse 2s infinite' }}>INITIALIZING...</div>
      </div>

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-5 z-20"
        style={{ background:'rgba(1,10,21,.88)', borderBottom:'1px solid rgba(0,200,255,.2)', backdropFilter:'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <span style={{ width:8, height:8, borderRadius:'50%', background:'#00E5FF', display:'inline-block', boxShadow:'0 0 8px #00E5FF', animation:'pulse 2s infinite' }} />
          <span style={{ fontSize:13, fontWeight:'bold', letterSpacing:4, color:'#E0F7FA' }}>VARUNASETU</span>
          <span style={{ fontSize:9, color:'#4DD0E1', letterSpacing:2 }}>/ SUBMARINE CABLE RESILIENCE DIGITAL TWIN</span>
        </div>
        <div className="flex items-center gap-5">
          {[
            { dot: h.srcDot, label: h.srcLabel, initDot:'#00E676', initLabel:'SOURCE: ONLINE' },
            { dot: h.cblDot, label: h.cblLabel, initDot:'#00E676', initLabel:'CABLE: NOMINAL' },
            { dot: h.dstDot, label: h.dstLabel, initDot:'#00E676', initLabel:'DESTINATION: ONLINE' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5" style={{ fontSize:9, letterSpacing:1 }}>
              <span ref={s.dot} style={{ width:7, height:7, borderRadius:'50%', display:'inline-block', background:s.initDot, boxShadow:`0 0 6px ${s.initDot}` }} />
              <span ref={s.label} style={{ color:'#B0BEC5' }}>{s.initLabel}</span>
            </div>
          ))}
          <span ref={h.simTime} style={{ fontSize:9, color:'#80DEEA', letterSpacing:1 }}>SIMULATION TIME: 00:00:00</span>
        </div>
        <Link href="/workspace" style={{ fontSize:9, color:'#4DD0E1', letterSpacing:1, border:'1px solid rgba(0,200,255,.3)', padding:'4px 10px', borderRadius:4, textDecoration:'none', transition:'all .2s' }}
          onMouseEnter={e=>(e.currentTarget.style.background='rgba(0,200,255,.12)')}
          onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
          ← EXIT SIM
        </Link>
      </div>

      {/* ── SCAN LINE (AI phase) ── */}
      <div ref={h.scanLine} style={{ display:'none', position:'absolute', left:0, right:0, height:2, top:0, zIndex:15,
        background:'linear-gradient(90deg, transparent, rgba(0,229,255,.6), transparent)',
        animation:'scanDown 3.5s linear infinite' }} />

      {/* ── LEFT PANEL: NETWORK TELEMETRY ── */}
      <div className="absolute z-20" style={{ top:58, left:14, width:215, background:'rgba(1,10,21,.88)', border:'1px solid rgba(0,200,255,.22)', borderRadius:8, padding:14, backdropFilter:'blur(12px)' }}>
        <div style={{ fontSize:9, letterSpacing:3, color:'#4DD0E1', borderBottom:'1px solid rgba(0,200,255,.18)', paddingBottom:7, marginBottom:10 }}>{`// NETWORK TELEMETRY`}</div>
        {[
          { label:'THROUGHPUT', valRef:h.throughput, barRef:h.thruBar, initVal:'4.8 Tbps', initPct:96, initCol:'#00E676' },
          { label:'LATENCY',    valRef:h.latency,    barRef:h.latBar,  initVal:'12.3 ms',  initPct:88, initCol:'#00E676' },
        ].map((row, i) => (
          <div key={i} style={{ marginTop: i ? 10 : 0 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:9, color:'#78909C', letterSpacing:1 }}>{row.label}</span>
              <span ref={row.valRef} style={{ fontSize:11, color:'#00E676', fontWeight:'bold' }}>{row.initVal}</span>
            </div>
            <div style={{ height:4, background:'rgba(255,255,255,.08)', borderRadius:2, marginTop:3, overflow:'hidden' }}>
              <div ref={row.barRef} style={{ height:'100%', borderRadius:2, background:row.initCol, width:`${row.initPct}%`, transition:'width .6s ease, background .6s ease' }} />
            </div>
          </div>
        ))}
        {[
          { label:'PACKET LOSS', valRef:h.pktLoss, initVal:'0.02%' },
          { label:'CABLE DEPTH', initVal:'4,200 m' },
        ].map((row, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', marginTop:10 }}>
            <span style={{ fontSize:9, color:'#78909C', letterSpacing:1 }}>{row.label}</span>
            <span ref={'valRef' in row ? row.valRef : undefined} style={{ fontSize:11, color:'#00E5FF', fontWeight:'bold' }}>{'initVal' in row ? row.initVal : ''}</span>
          </div>
        ))}
        <div style={{ marginTop:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:9, color:'#78909C', letterSpacing:1 }}>CABLE HEALTH</span>
            <span ref={h.health} style={{ fontSize:11, color:'#00E676', fontWeight:'bold' }}>NOMINAL</span>
          </div>
          <div style={{ height:4, background:'rgba(255,255,255,.08)', borderRadius:2, marginTop:3, overflow:'hidden' }}>
            <div ref={h.healthBar} style={{ height:'100%', borderRadius:2, background:'#00E676', width:'100%', transition:'width .6s ease, background .6s ease' }} />
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:10 }}>
          <span style={{ fontSize:9, color:'#78909C', letterSpacing:1 }}>ACTIVE FIBERS</span>
          <span ref={h.fibers} style={{ fontSize:11, color:'#00E5FF', fontWeight:'bold' }}>8 / 8</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:10 }}>
          <span style={{ fontSize:9, color:'#78909C', letterSpacing:1 }}>SEA TEMP</span>
          <span style={{ fontSize:11, color:'#00E5FF', fontWeight:'bold' }}>2.4°C</span>
        </div>
      </div>

      {/* ── RIGHT PANEL: AI LOG ── */}
      <div ref={h.aiPanel} className="absolute z-20" style={{ top:58, right:14, width:270, background:'rgba(1,10,21,.88)', border:'1px solid rgba(0,200,255,.22)', borderRadius:8, padding:14, backdropFilter:'blur(12px)', opacity:0, transition:'opacity .5s' }}>
        <div style={{ fontSize:9, letterSpacing:3, color:'#4DD0E1', borderBottom:'1px solid rgba(0,200,255,.18)', paddingBottom:7, marginBottom:10 }}>{`// AI FAULT ANALYSIS`}</div>
        <div ref={h.aiLog} style={{ maxHeight:240, overflowY:'auto' }} />
      </div>

      {/* ── CENTER ALERT ── */}
      <div ref={h.alertBox} className="absolute z-20" style={{ top:'42%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center', opacity:0, transition:'opacity .35s', pointerEvents:'none' }}>
        <div style={{ fontSize:17, fontWeight:'bold', letterSpacing:2.5, color:'#FF1744', textShadow:'0 0 25px rgba(255,23,68,.8)', animation:'alertPulse .55s ease-in-out infinite alternate' }}>
          ⚠ CRITICAL ALERT: SUBMARINE CABLE FAILURE DETECTED
        </div>
        <div style={{ fontSize:10, color:'#FF8A80', letterSpacing:1.5, marginTop:7 }}>
          FAULT LOCATION: 12.31°N, 43.49°E &nbsp;|&nbsp; DEPTH: 4,200m
        </div>
      </div>

      {/* ── FAULT TAG (world-space approximation) ── */}
      <div ref={h.faultTag} className="absolute z-20" style={{ top:'47%', left:'52%', opacity:0, transition:'opacity .5s', pointerEvents:'none' }}>
        <div style={{ background:'rgba(255,23,68,.14)', border:'1px solid rgba(255,23,68,.6)', borderRadius:5, padding:'5px 9px', fontSize:9, color:'#FF8A80', letterSpacing:1, whiteSpace:'nowrap' }}>
          ⊗ FAULT DETECTED<br/>12.31°N, 43.49°E<br/>DEPTH: 4,200m
        </div>
      </div>

      {/* ── STATION CARDS ── */}
      <div ref={h.srcCard} className="absolute z-20" style={{ bottom:56, left:240, background:'rgba(1,10,21,.88)', border:'1px solid rgba(0,200,255,.22)', borderRadius:6, padding:'8px 12px', backdropFilter:'blur(10px)', minWidth:148 }}>
        <div style={{ fontSize:9, letterSpacing:2, color:'#E0F7FA', fontWeight:'bold', marginBottom:4 }}>◈ MUMBAI LANDING STN</div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span ref={h.srcCardStat} style={{ fontSize:8, color:'#00E676', letterSpacing:1 }}>TRANSMITTING</span>
        </div>
        <div style={{ marginTop:4, fontSize:8, color:'#4DD0E1' }}>19.07°N, 72.88°E</div>
      </div>

      <div ref={h.dstCard} className="absolute z-20" style={{ bottom:56, right:240, background:'rgba(1,10,21,.88)', border:'1px solid rgba(0,200,255,.22)', borderRadius:6, padding:'8px 12px', backdropFilter:'blur(10px)', minWidth:155 }}>
        <div style={{ fontSize:9, letterSpacing:2, color:'#E0F7FA', fontWeight:'bold', marginBottom:4 }}>◈ FUJAIRAH LANDING STN</div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span ref={h.dstCardStat} style={{ fontSize:8, color:'#00E676', letterSpacing:1 }}>RECEIVING</span>
        </div>
        <div style={{ marginTop:4, fontSize:8, color:'#4DD0E1' }}>25.13°N, 56.33°E</div>
      </div>

      {/* ── ROV PANEL ── */}
      <div ref={h.rovPanel} className="absolute z-20" style={{ bottom:56, right:14, width:200, background:'rgba(1,10,21,.88)', border:'1px solid rgba(0,230,118,.28)', borderRadius:8, padding:12, backdropFilter:'blur(12px)', opacity:0, transition:'opacity .5s' }}>
        <div style={{ fontSize:9, letterSpacing:3, color:'#00E676', borderBottom:'1px solid rgba(0,230,118,.2)', paddingBottom:6, marginBottom:8 }}>{`// ROV DEPLOYMENT`}</div>
        {[
          { label:'STATUS', ref:h.rovStatus, init:'DESCENDING', col:'#4DD0E1' },
          { label:'DEPTH',  ref:h.rovDepth,  init:'0 m',        col:'#00E5FF' },
          { label:'TASK',   ref:h.rovTask,   init:'LOCATING FAULT', col:'#4DD0E1' },
        ].map((row,i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', marginTop: i ? 7 : 0 }}>
            <span style={{ fontSize:9, color:'#78909C', letterSpacing:1 }}>{row.label}</span>
            <span ref={row.ref} style={{ fontSize:9, color:row.col, fontWeight:'bold' }}>{row.init}</span>
          </div>
        ))}
      </div>

      {/* ── PHASE INDICATOR ── */}
      <div className="absolute z-20" style={{ bottom:14, left:'50%', transform:'translateX(-50%)', background:'rgba(1,10,21,.88)', border:'1px solid rgba(0,200,255,.28)', borderRadius:24, padding:'7px 22px', backdropFilter:'blur(12px)', whiteSpace:'nowrap' }}>
        <span ref={h.phase} style={{ fontSize:9, letterSpacing:1.5, color:'#80DEEA' }}>◈ PHASE 1: NORMAL OPERATION — DATA FLOWING AT 4.8 TBPS</span>
      </div>

      {/* ── CONTROLS ── */}
      <div className="absolute z-20 flex gap-2" style={{ bottom:14, right:14 }}>
        {[
          { label:'↺ RESTART', action: () => window.location.reload() },
          { label:'⏭ SKIP PHASE', action: () => {
            // Increment totalTime past next trigger via URL param trick or direct manipulation
            // For simplicity, reload is the best UX
          }},
        ].map((btn,i) => (
          <button key={i} onClick={btn.action} style={{ background:'rgba(1,10,21,.88)', border:'1px solid rgba(0,200,255,.35)', borderRadius:5, padding:'5px 13px', color:'#4DD0E1', fontFamily:'inherit', fontSize:9, letterSpacing:1, cursor:'pointer' }}
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(0,200,255,.14)')}
            onMouseLeave={e=>(e.currentTarget.style.background='rgba(1,10,21,.88)')}>
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
        @keyframes alertPulse { from{opacity:1;text-shadow:0 0 20px rgba(255,23,68,.8)} to{opacity:.8;text-shadow:0 0 45px rgba(255,23,68,1),0 0 70px rgba(255,23,68,.4)} }
        @keyframes scanDown { from{top:48px} to{top:100%} }
      `}</style>
    </div>
  );
}
