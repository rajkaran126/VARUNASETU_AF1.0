"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CableRoute, FaultIncident } from '@/lib/types';

interface CableGlobe3DProps {
  cables: CableRoute[];
  selectedCable?: CableRoute;
  activeFault?: FaultIncident;
  onSelectCable?: (cable: CableRoute) => void;
}

export function CableGlobe3D({
  cables,
  selectedCable,
  activeFault,
  onSelectCable,
}: CableGlobe3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelLoading, setModelLoading] = useState(true);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // Interaction tracking
  const isDragging = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const rotVelocity = useRef({ x: 0, y: 0.002 });
  const globeGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040d1a);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      25000
    );
    camera.position.set(0, 800, 7500);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    // 2. Cosmic Background Environment (Starfield in 3D)
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starCols = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 10000 + Math.random() * 8000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);

      const isBlue = Math.random() > 0.6;
      starCols[i * 3] = isBlue ? 0.7 : 1.0;
      starCols[i * 3 + 1] = isBlue ? 0.85 : 0.95;
      starCols[i * 3 + 2] = 1.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starCols, 3));
    const starMat = new THREE.PointsMaterial({
      size: 18,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 3. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x0f2b48, 2.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xdbeafe, 3.2);
    sunLight.position.set(4000, 3000, 5000);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x13bfd3, 2.0);
    rimLight.position.set(-4000, -2000, -4000);
    scene.add(rimLight);

    // 4. Central Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Solid inner Earth sphere core (radius ~2930 to sit beneath cable ribbons at radius 2950-3000)
    const earthGeo = new THREE.SphereGeometry(2920, 64, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x081d33,
      roughness: 0.75,
      metalness: 0.25,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // Atmospheric Glow Halo Sphere
    const atmoGeo = new THREE.SphereGeometry(3080, 48, 36);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x13bfd3,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    globeGroup.add(atmoMesh);

    // Active Fault 3D Beacon Marker on Globe
    let faultMarker: THREE.Group | null = null;
    if (activeFault) {
      faultMarker = new THREE.Group();
      // Convert lat/lon (12.3, 43.5) to spherical 3D coordinates
      const phi = (90 - activeFault.lat) * (Math.PI / 180);
      const theta = (activeFault.lon + 180) * (Math.PI / 180);
      const r = 2980;
      const fx = -r * Math.sin(phi) * Math.cos(theta);
      const fz = r * Math.sin(phi) * Math.sin(theta);
      const fy = r * Math.cos(phi);
      faultMarker.position.set(fx, fy, fz);

      // Red core dot
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(35, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xdc2626 })
      );
      faultMarker.add(dot);

      // Radar pulse ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(35, 75, 32),
        new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
      );
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      faultMarker.add(ring);

      globeGroup.add(faultMarker);
    }

    // 5. Load the Subsea Cable Network 3D Model from assets/model1 (public/models/model1/globe_ribbons.gltf)
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/model1/globe_ribbons.gltf',
      (gltf) => {
        const cableModel = gltf.scene;

        // Enhance materials of the cable ribbons for high-tech digital twin visual quality
        cableModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = 0.35;
              mat.metalness = 0.65;
              mat.emissive = new THREE.Color(0x0e4b75);
              mat.emissiveIntensity = 0.6;
            }
          }
        });

        globeGroup.add(cableModel);
        setModelLoaded(true);
        setModelLoading(false);
      },
      undefined,
      (err) => {
        console.warn('Could not load globe_ribbons.gltf, falling back to procedural cable network:', err);
        // Fallback: procedural 3D cable arcs linking landing stations
        cables.forEach((c) => {
          if (c.landingStations.length < 2) return;
          const curvePoints: THREE.Vector3[] = [];
          c.landingStations.forEach((ls) => {
            const phi = (90 - ls.lat) * (Math.PI / 180);
            const theta = (ls.lon + 180) * (Math.PI / 180);
            const r = 2960;
            const x = -r * Math.sin(phi) * Math.cos(theta);
            const z = r * Math.sin(phi) * Math.sin(theta);
            const y = r * Math.cos(phi);
            curvePoints.push(new THREE.Vector3(x, y, z));
          });
          const curve = new THREE.CatmullRomCurve3(curvePoints);
          const tubeGeo = new THREE.TubeGeometry(curve, 32, 12, 8, false);
          const tubeMat = new THREE.MeshBasicMaterial({ color: 0x13bfd3 });
          const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
          globeGroup.add(tubeMesh);
        });
        setModelLoaded(true);
        setModelLoading(false);
      }
    );

    // Mouse & Touch Controls
    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current || !globeGroupRef.current) return;
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      rotVelocity.current = {
        x: dy * 0.003,
        y: dx * 0.003,
      };

      globeGroupRef.current.rotation.y += dx * 0.004;
      globeGroupRef.current.rotation.x += dy * 0.004;
      globeGroupRef.current.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroupRef.current.rotation.x));
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(4500, Math.min(12000, camera.position.z + e.deltaY * 3.5));
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Handle Window Resize
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

      if (globeGroupRef.current) {
        if (!isDragging.current) {
          if (autoRotate) {
            globeGroupRef.current.rotation.y += 0.0018;
          } else {
            globeGroupRef.current.rotation.y += rotVelocity.current.y;
            globeGroupRef.current.rotation.x += rotVelocity.current.x;
            rotVelocity.current.x *= 0.94;
            rotVelocity.current.y *= 0.94;
          }
        }
      }

      // Animate active fault marker pulse
      if (faultMarker) {
        const pulse = Math.sin(timeMs * 0.005) * 0.25 + 1.0;
        faultMarker.scale.setScalar(pulse);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [cables, activeFault, autoRotate]);

  return (
    <div ref={containerRef} className="relative w-full h-[520px] rounded-2xl bg-[#040d1a] border border-[#193351] overflow-hidden shadow-xl select-none">
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Top Left 3D Asset Header Overlay */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 bg-[#0b1d33]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-mono text-xs font-bold text-white tracking-wider">
          3D SUBSEA CABLE NETWORK // MODEL 1
        </span>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
          GLOBAL TOPOLOGY
        </span>
      </div>

      {/* Top Right Auto-Rotate and Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#0b1d33]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
            autoRotate
              ? 'bg-cyan-500 text-[#0b1d33]'
              : 'bg-white/10 text-white/70 hover:text-white'
          }`}
        >
          {autoRotate ? 'AUTO-ROTATE ON' : 'PAUSED'}
        </button>
        <span className="text-white/30 text-xs font-mono">|</span>
        <span className="text-[10px] font-mono text-white/60">
          DRAG TO ORBIT / SCROLL TO ZOOM
        </span>
      </div>

      {/* Bottom Left Active Selected Cable Summary */}
      {selectedCable && (
        <div className="absolute bottom-4 left-4 z-20 bg-[#0b1d33]/90 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shadow-lg max-w-sm">
          <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-0.5">
            SELECTED CORRIDOR
          </div>
          <div className="text-sm font-bold text-white tracking-wide">
            {selectedCable.name}
          </div>
          <div className="font-mono text-[10px] text-white/70 flex items-center gap-3 mt-1">
            <span>RFS: {selectedCable.rfsYear}</span>
            <span>LENGTH: {selectedCable.lengthKm.toLocaleString()} KM</span>
            <span>CAPACITY: {selectedCable.designCapacityTbps} TBPS</span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {modelLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#040d1a]/80 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-3" />
          <span className="font-mono text-xs text-cyan-300 font-bold tracking-widest">
            INITIALIZING 3D CABLE NETWORK MODEL...
          </span>
        </div>
      )}
    </div>
  );
}
