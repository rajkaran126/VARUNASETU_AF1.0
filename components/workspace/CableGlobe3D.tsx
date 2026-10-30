'use client';

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

  // Interaction tracking (Full Unconstrained 3D Trackball Rotation)
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
    scene.background = new THREE.Color(0x13171d);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      35000
    );
    camera.position.set(0, 0, 7500);

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

    // 2. Comprehensive Multi-Directional Lighting (ensures every angle is brilliantly illuminated)
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 1.8);
    scene.add(ambientLight);

    // Front-top key light
    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.8);
    keyLight.position.set(4000, 3500, 5000);
    scene.add(keyLight);

    // Opposite fill light
    const fillLight = new THREE.DirectionalLight(0xfef3c7, 2.0);
    fillLight.position.set(-4000, -2500, -4000);
    scene.add(fillLight);

    // Lateral rim light
    const rimLight = new THREE.DirectionalLight(0xe8d9bf, 1.5);
    rimLight.position.set(-3000, 3000, 3000);
    scene.add(rimLight);

    // 3. Realistic 3D Space Environment around Earth
    const starCount = 1800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const radius = 11000 + Math.random() * 14000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      // Deep space starlight: soft warm white and ivory
      const lum = 0.5 + Math.random() * 0.5;
      starColors[i * 3] = lum;
      starColors[i * 3 + 1] = lum * 0.95;
      starColors[i * 3 + 2] = lum * 0.88;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 16,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 4. Central Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    let faultMarker: THREE.Group | null = null;

    // 5. Load the Subsea Cable Network 3D Model (Model 1) from public/models/model1/globe_ribbons.gltf
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/model1/globe_ribbons.gltf',
      (gltf) => {
        const cableModel = gltf.scene;

        // ALIGN MODEL 1: GEOGRAPHICALLY UPRIGHT CONTINENTAL ALIGNMENT
        // In Model 1's geometry, Z-up is the polar axis (Z = +2950 is North Pole, Z = -2950 is South Pole).
        // Standard Three.js coordinates use Y-up.
        // We set rotation.order = 'YXZ':
        // 1. rotation.x = -Math.PI / 2 brings North Pole to +Y (UP) and South Pole to -Y (DOWN).
        // 2. rotation.y brings the active fault (Djibouti / Red Sea / Indian Ocean) to face forward (+Z) toward the camera.
        cableModel.rotation.order = 'YXZ';
        cableModel.rotation.x = -Math.PI / 2;
        const targetLon = activeFault ? (activeFault.lon * Math.PI / 180) : (43.49 * Math.PI / 180);
        cableModel.rotation.y = -(targetLon + Math.PI / 2);

        // Attach Active Fault Beacon directly to cableModel in Model 1's authentic coordinates
        if (activeFault) {
          const markerGroup = new THREE.Group();
          const latRad = activeFault.lat * (Math.PI / 180);
          const lonRad = activeFault.lon * (Math.PI / 180);
          const r = 2965; // Sits flush right on the ocean surface / cable ribbons
          const fx = r * Math.cos(latRad) * Math.cos(lonRad);
          const fy = r * Math.cos(latRad) * Math.sin(lonRad);
          const fz = r * Math.sin(latRad);
          markerGroup.position.set(fx, fy, fz);

          // Orient beacon normal outward from the Earth center
          const normal = new THREE.Vector3(fx, fy, fz).normalize();
          markerGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

          // Core fault dot
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(32, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xc87954 })
          );
          markerGroup.add(dot);

          // Radar pulse ring
          const ring = new THREE.Mesh(
            new THREE.RingGeometry(38, 90, 32),
            new THREE.MeshBasicMaterial({
              color: 0xe99a65,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.85,
            })
          );
          ring.position.z = 2;
          markerGroup.add(ring);

          cableModel.add(markerGroup);
          faultMarker = markerGroup;
        }

        // UNMASK MODEL 1:
        // Do NOT wrap in artificial occlusion spheres or dark blue emissive masks.
        // Mesh 0 is the textured Earth globe with high-res 5400x2700 map.
        // Mesh 1 is the 3D submarine cable ribbons with COLOR_0 vertex colors.
        cableModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            const hasVertexColors = mesh.geometry.attributes.color !== undefined;

            if (hasVertexColors) {
              // Mesh 1: 3D Cable Ribbons
              // Unmask the authentic vertex colors and make ribbons double-sided so they are visible from all angles
              mesh.material = new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.25,
                metalness: 0.45,
                side: THREE.DoubleSide,
                depthWrite: true,
                transparent: false,
              });
            } else {
              // Mesh 0: Base Textured Earth Globe
              // Unmask the authentic Earth surface map without any tint or dark cover
              if (mesh.material) {
                const mat = mesh.material as THREE.MeshStandardMaterial;
                mat.roughness = 0.82;
                mat.metalness = 0.08;
                mat.emissive.set(0x000000);
                mat.side = THREE.FrontSide;
              }
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
        // Fallback procedural cables
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
          const tubeMat = new THREE.MeshStandardMaterial({ color: 0xc87954, roughness: 0.3 });
          const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
          globeGroup.add(tubeMesh);
        });
        setModelLoaded(true);
        setModelLoading(false);
      }
    );

    // 5. Full Unconstrained 3D Trackball / Free-Rotation Controls (Rotates in ANY direction)
    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      prevMousePos.current = { x: e.clientX, y: e.clientY };
      rotVelocity.current = { x: 0, y: 0 };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current || !globeGroupRef.current) return;
      const dx = e.clientX - prevMousePos.current.x;
      const dy = e.clientY - prevMousePos.current.y;
      prevMousePos.current = { x: e.clientX, y: e.clientY };

      const factor = 0.0045;
      rotVelocity.current = {
        x: dy * factor,
        y: dx * factor,
      };

      // Full 3D unconstrained trackball rotation using quaternions:
      // Horizontal drag rotates around view-space Y axis
      // Vertical drag rotates around view-space X axis
      const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * factor);
      const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * factor);

      globeGroupRef.current.quaternion.premultiply(qY);
      globeGroupRef.current.quaternion.premultiply(qX);
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(3800, Math.min(14000, camera.position.z + e.deltaY * 3.5));
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

    // 6. Smooth Animation & Momentum Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const timeMs = clock.getElapsedTime() * 1000;

      if (globeGroupRef.current) {
        if (!isDragging.current) {
          if (autoRotate) {
            // Gentle continuous planetary rotation
            const qAuto = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.0016);
            globeGroupRef.current.quaternion.premultiply(qAuto);
          } else {
            // Smooth inertia damping after user drag in any direction
            if (Math.abs(rotVelocity.current.x) > 0.00005 || Math.abs(rotVelocity.current.y) > 0.00005) {
              const qY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotVelocity.current.y);
              const qX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotVelocity.current.x);
              globeGroupRef.current.quaternion.premultiply(qY);
              globeGroupRef.current.quaternion.premultiply(qX);
              rotVelocity.current.x *= 0.94;
              rotVelocity.current.y *= 0.94;
            }
          }
        }
      }

      // Subtle celestial space drift
      if (starField) {
        starField.rotation.y += 0.00008;
      }

      // Animate active fault marker pulse
      if (faultMarker) {
        const pulse = Math.sin(timeMs * 0.005) * 0.2 + 1.0;
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
    <div ref={containerRef} className="relative w-full h-[540px] rounded-2xl bg-[#13171d] border border-[#D4C4A8] overflow-hidden shadow-xl select-none font-sans">
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Top Left 3D Asset Header Overlay (PARJANYAḤ Light Theme) */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5 bg-[#F7F3EA]/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#D4C4A8] shadow-md">
        <span className="w-2 h-2 rounded-full bg-[#C87954] animate-pulse" />
        <span className="font-sans text-xs font-bold text-[#454640] tracking-wide">
          Subsea Cable Network · Model 1 (Unmasked)
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-[#E8D9BF] text-[#454640] border border-[#D4C4A8]">
          Global Topology
        </span>
      </div>

      {/* Top Right Auto-Rotate and Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#F7F3EA]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D4C4A8] shadow-md">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all ${
            autoRotate
              ? 'bg-[#83B9A9] text-[#454640] shadow-xs'
              : 'bg-[#E8D9BF] text-[#454640] hover:bg-[#D4C4A8]'
          }`}
        >
          {autoRotate ? 'Auto-Rotate On' : 'Paused'}
        </button>
        <span className="text-[#A69B89] text-xs">|</span>
        <span className="text-[11px] font-sans text-[#A69B89]">
          Drag to orbit 360° in any direction · Scroll to zoom
        </span>
      </div>

      {/* Bottom Left Active Selected Cable Summary */}
      {selectedCable && (
        <div className="absolute bottom-4 left-4 z-20 bg-[#F7F3EA]/95 backdrop-blur-md px-4 py-3 rounded-xl border border-[#D4C4A8] shadow-md max-w-sm">
          <div className="text-[10px] font-sans uppercase tracking-wider text-[#C87954] font-bold mb-0.5">
            Selected Corridor
          </div>
          <div className="text-sm font-bold text-[#454640] tracking-tight">
            {selectedCable.name}
          </div>
          <div className="font-sans text-xs text-[#A69B89] flex items-center gap-3 mt-1">
            <span>RFS: <strong className="text-[#454640]">{selectedCable.rfsYear}</strong></span>
            <span>Length: <strong className="text-[#454640]">{selectedCable.lengthKm.toLocaleString()} km</strong></span>
            <span>Capacity: <strong className="text-[#454640]">{selectedCable.designCapacityTbps} Tbps</strong></span>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {modelLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#F7F3EA]/90 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full border-2 border-[#C87954] border-t-transparent animate-spin mb-3" />
          <span className="font-sans text-xs text-[#454640] font-bold tracking-wide">
            Loading Subsea Cable Model 1...
          </span>
        </div>
      )}
    </div>
  );
}
export default CableGlobe3D;
