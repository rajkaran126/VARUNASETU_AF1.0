import * as THREE from 'three';

/**
 * MODEL 12 — MODULAR UNDERWATER INSPECTION EQUIPMENT & SONAR SUITE
 * 
 * Engineering Specifications:
 * 1. Multibeam Bathymetric Sonar Transceiver (Phased-Array acoustic head with dynamic pulse wavefronts)
 * 2. High-Tech Directional Sonar Sweep Arc (Concentric pulsing acoustic wavefronts & calibrated radial grid)
 * 3. Dual 50,000-Lumen LED Subsea Floodlights with soft volumetric light cones
 * 4. Stereoscopic 4K Optical Inspection Camera Turret with 2-axis Pan/Tilt gimbal
 * 5. 532nm Emerald Laser Profiler Sheet for subsea cable ovality & trench depth measurement
 * 6. Holographic Target Identification Reticle & Fault Localization Bounding Box
 * 7. TSS 440 Electromagnetic Pulse-Induction Tone-Tracking Outrigger Arms
 */
export class Model12InspectionEquipment {
  public group: THREE.Group;

  // Subsea Mechanical Components
  private sonarHead: THREE.Group;
  private cameraGimbal: THREE.Group;
  private floodlightLeft: THREE.SpotLight;
  private floodlightRight: THREE.SpotLight;
  private volumetricBeamLeft: THREE.Mesh;
  private volumetricBeamRight: THREE.Mesh;
  private trackerArmLeft: THREE.Group;
  private trackerArmRight: THREE.Group;

  // High-Tech Inspection Visualisation (No primitive large triangles)
  private sonarSweepGroup: THREE.Group;
  private sonarRings: THREE.LineLoop[] = [];
  private sonarRadialLines: THREE.Line[] = [];
  private sonarFanMesh!: THREE.Mesh;
  private laserSheetMesh!: THREE.Mesh;
  private targetReticleGroup!: THREE.Group;
  private faultMarkerGroup!: THREE.Group;

  // Materials
  private chassisMaterial: THREE.MeshStandardMaterial;
  private lensMaterial: THREE.MeshPhysicalMaterial;
  private sonarAcousticMaterial: THREE.MeshBasicMaterial;
  private sonarGridMaterial: THREE.LineBasicMaterial;
  private laserMaterial: THREE.MeshBasicMaterial;
  private volumetricBeamMaterial: THREE.MeshBasicMaterial;
  private reticleMaterial: THREE.LineBasicMaterial;
  private markerMaterial: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Model12_InspectionEquipment';

    // 1. Engineering Materials
    this.chassisMaterial = new THREE.MeshStandardMaterial({
      color: 0x162a3f,
      roughness: 0.3,
      metalness: 0.85,
    });
    this.lensMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x051324,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.95,
      thickness: 0.4,
    });
    this.sonarAcousticMaterial = new THREE.MeshBasicMaterial({
      color: 0x13bfd3,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.sonarGridMaterial = new THREE.LineBasicMaterial({
      color: 0x13bfd3,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.laserMaterial = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.volumetricBeamMaterial = new THREE.MeshBasicMaterial({
      color: 0xdff9fc,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.reticleMaterial = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.85,
      linewidth: 1.5,
    });
    this.markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });

    // 2. Multibeam Sonar Transceiver Pod
    this.sonarHead = this.createSonarTransceiverPod();
    this.group.add(this.sonarHead);

    // 3. Stereoscopic 4K Camera Turret
    this.cameraGimbal = this.createStereoCameraTurret();
    this.group.add(this.cameraGimbal);

    // 4. Dual 50k-Lumen LED Floodlights & Soft Volumetric Beams
    const { floodLeft, floodRight, beamLeft, beamRight } = this.createFloodlightArray();
    this.floodlightLeft = floodLeft;
    this.floodlightRight = floodRight;
    this.volumetricBeamLeft = beamLeft;
    this.volumetricBeamRight = beamRight;
    this.group.add(this.floodlightLeft);
    this.group.add(this.floodlightRight);
    this.group.add(this.volumetricBeamLeft);
    this.group.add(this.volumetricBeamRight);

    // 5. TSS 440 Tone Tracking Sensor Outriggers
    this.trackerArmLeft = this.createTrackingSensorArm(-1);
    this.trackerArmRight = this.createTrackingSensorArm(1);
    this.group.add(this.trackerArmLeft);
    this.group.add(this.trackerArmRight);

    // 6. High-Tech Multibeam Sonar Sweep Visualization
    this.sonarSweepGroup = this.createSonarSweepSystem();
    this.group.add(this.sonarSweepGroup);

    // 7. 532nm Green Laser Profiler Sheet
    const laserPlaneGeo = new THREE.PlaneGeometry(1.2, 2.6);
    laserPlaneGeo.rotateX(-Math.PI / 3);
    this.laserSheetMesh = new THREE.Mesh(laserPlaneGeo, this.laserMaterial);
    this.laserSheetMesh.position.set(0, -0.6, 1.2);
    this.group.add(this.laserSheetMesh);

    // 8. Target Identification HUD Reticle & Fault Localization Box
    this.targetReticleGroup = this.createTargetReticle();
    this.faultMarkerGroup = this.createFaultMarker();
    this.group.add(this.targetReticleGroup);
    this.group.add(this.faultMarkerGroup);
  }

  private createSonarTransceiverPod(): THREE.Group {
    const pod = new THREE.Group();
    pod.position.set(0, 0.25, 0.45);

    // Cylindrical phased array housing
    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.15, 24);
    const body = new THREE.Mesh(bodyGeo, this.chassisMaterial);
    pod.add(body);

    // Acoustic window dome
    const domeGeo = new THREE.SphereGeometry(0.19, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    domeGeo.rotateX(Math.PI);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x071e33, roughness: 0.2, metalness: 0.9 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = -0.075;
    pod.add(dome);

    // High-pressure titanium mounting bracket
    const mountGeo = new THREE.BoxGeometry(0.15, 0.08, 0.2);
    const mount = new THREE.Mesh(mountGeo, this.chassisMaterial);
    mount.position.y = 0.09;
    pod.add(mount);

    return pod;
  }

  private createStereoCameraTurret(): THREE.Group {
    const turret = new THREE.Group();
    turret.position.set(0, -0.08, 0.55);

    // Gimbal yoke bracket
    const yokeGeo = new THREE.TorusGeometry(0.24, 0.02, 12, 24, Math.PI);
    yokeGeo.rotateZ(Math.PI);
    const yoke = new THREE.Mesh(yokeGeo, this.chassisMaterial);
    turret.add(yoke);

    // Dual-lens camera chassis
    const bodyGeo = new THREE.BoxGeometry(0.42, 0.14, 0.16);
    const body = new THREE.Mesh(bodyGeo, this.chassisMaterial);
    turret.add(body);

    // Left and Right 4K Optical Portals
    const bezelGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.05, 24);
    bezelGeo.rotateX(Math.PI / 2);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x13bfd3, metalness: 0.8 });

    const lensL = new THREE.Mesh(bezelGeo, bezelMat);
    lensL.position.set(-0.13, 0, 0.08);
    const opticL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 24), this.lensMaterial);
    opticL.rotation.x = Math.PI / 2;
    opticL.position.z = 0.025;
    lensL.add(opticL);
    turret.add(lensL);

    const lensR = new THREE.Mesh(bezelGeo, bezelMat);
    lensR.position.set(0.13, 0, 0.08);
    const opticR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 24), this.lensMaterial);
    opticR.rotation.x = Math.PI / 2;
    opticR.position.z = 0.025;
    lensR.add(opticR);
    turret.add(lensR);

    return turret;
  }

  private createFloodlightArray() {
    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, -3.2, 2.8);
    this.group.add(lightTarget);

    // Spotlights with controlled spread and realistic subsea decay
    const floodLeft = new THREE.SpotLight(0xf0fdfa, 6.0, 25, Math.PI / 6, 0.45, 1.1);
    floodLeft.position.set(-0.5, 0.1, 0.5);
    floodLeft.target = lightTarget;
    floodLeft.castShadow = true;

    const floodRight = new THREE.SpotLight(0xf0fdfa, 6.0, 25, Math.PI / 6, 0.45, 1.1);
    floodRight.position.set(0.5, 0.1, 0.5);
    floodRight.target = lightTarget;
    floodRight.castShadow = true;

    // Soft volumetric light cone meshes
    const coneGeo = new THREE.ConeGeometry(0.75, 3.2, 32, 1, true);
    coneGeo.rotateX(-Math.PI / 4);

    const beamLeft = new THREE.Mesh(coneGeo, this.volumetricBeamMaterial);
    beamLeft.position.copy(floodLeft.position);
    beamLeft.position.z += 1.4;
    beamLeft.position.y -= 1.1;

    const beamRight = new THREE.Mesh(coneGeo, this.volumetricBeamMaterial);
    beamRight.position.copy(floodRight.position);
    beamRight.position.z += 1.4;
    beamRight.position.y -= 1.1;

    return { floodLeft, floodRight, beamLeft, beamRight };
  }

  private createTrackingSensorArm(dir: number): THREE.Group {
    const arm = new THREE.Group();
    arm.position.set(dir * 0.45, -0.15, 0.2);

    // Outrigger spar
    const sparGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.6, 12);
    sparGeo.rotateZ(dir * (Math.PI / 3.5));
    const spar = new THREE.Mesh(sparGeo, this.chassisMaterial);
    spar.position.set(dir * 0.25, -0.12, 0);
    arm.add(spar);

    // Sensor coil canister (high-visibility safety yellow)
    const coilGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.25, 16);
    const coilMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.35,
      metalness: 0.4,
    });
    const coil = new THREE.Mesh(coilGeo, coilMat);
    coil.position.set(dir * 0.5, -0.25, 0.15);
    coil.rotation.x = Math.PI / 4;
    arm.add(coil);

    return arm;
  }

  /**
   * High-Tech Multibeam Sonar Fan Sweep (Concentric arcs + radial range lines)
   */
  private createSonarSweepSystem(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, -0.1, 0.5);

    // 1. Concentric wavefront range rings
    const ringRadii = [0.6, 1.2, 1.8, 2.4, 3.0];
    ringRadii.forEach((r) => {
      const curvePoints: THREE.Vector3[] = [];
      const fov = Math.PI / 2.5; // 72-degree swath
      const segments = 24;
      for (let i = 0; i <= segments; i++) {
        const theta = -fov / 2 + (i / segments) * fov;
        const x = Math.sin(theta) * r;
        const z = Math.cos(theta) * r;
        const y = -r * 0.7; // Angled down towards seabed
        curvePoints.push(new THREE.Vector3(x, y, z));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const ring = new THREE.LineLoop(ringGeo, this.sonarGridMaterial);
      this.sonarRings.push(ring);
      group.add(ring);
    });

    // 2. Radial angle guide rays
    [-Math.PI / 5, -Math.PI / 10, 0, Math.PI / 10, Math.PI / 5].forEach((theta) => {
      const maxR = 3.0;
      const pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.sin(theta) * maxR, -maxR * 0.7, Math.cos(theta) * maxR),
      ];
      const rayGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const ray = new THREE.Line(rayGeo, this.sonarGridMaterial);
      this.sonarRadialLines.push(ray);
      group.add(ray);
    });

    // 3. Acoustic Swath Fan Sheet (Very subtle translucent planar fan)
    const fanGeo = new THREE.BufferGeometry();
    const fov = Math.PI / 2.5;
    const fanVerts: number[] = [0, 0, 0];
    const segs = 16;
    const maxR = 3.0;
    for (let i = 0; i <= segs; i++) {
      const theta = -fov / 2 + (i / segs) * fov;
      fanVerts.push(Math.sin(theta) * maxR, -maxR * 0.7, Math.cos(theta) * maxR);
    }
    const fanIndices: number[] = [];
    for (let i = 1; i <= segs; i++) {
      fanIndices.push(0, i, i + 1);
    }
    fanGeo.setAttribute('position', new THREE.Float32BufferAttribute(fanVerts, 3));
    fanGeo.setIndex(fanIndices);
    fanGeo.computeVertexNormals();

    this.sonarFanMesh = new THREE.Mesh(fanGeo, this.sonarAcousticMaterial);
    group.add(this.sonarFanMesh);

    return group;
  }

  /**
   * Holographic Target Identification Reticle (Corner brackets locked onto fault zone)
   */
  private createTargetReticle(): THREE.Group {
    const reticle = new THREE.Group();
    reticle.position.set(0, -2.1, 1.8);

    const s = 0.4;
    const d = 0.12;

    const cornerPoints: THREE.Vector3[] = [
      // Top-left corner
      new THREE.Vector3(-s, s - d, 0),
      new THREE.Vector3(-s, s, 0),
      new THREE.Vector3(-s + d, s, 0),

      // Top-right corner
      new THREE.Vector3(s - d, s, 0),
      new THREE.Vector3(s, s, 0),
      new THREE.Vector3(s, s - d, 0),

      // Bottom-right corner
      new THREE.Vector3(s, -s + d, 0),
      new THREE.Vector3(s, -s, 0),
      new THREE.Vector3(s - d, -s, 0),

      // Bottom-left corner
      new THREE.Vector3(-s + d, -s, 0),
      new THREE.Vector3(-s, -s, 0),
      new THREE.Vector3(-s, -s + d, 0),
    ];

    const bracketGeo = new THREE.BufferGeometry().setFromPoints(cornerPoints);
    const bracketLines = new THREE.LineSegments(bracketGeo, this.reticleMaterial);
    reticle.add(bracketLines);

    // Crosshair center dot
    const dotGeo = new THREE.RingGeometry(0.02, 0.04, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    reticle.add(dot);

    reticle.rotateX(-Math.PI / 4);
    return reticle;
  }

  /**
   * 3D Fault Localization Indicator (Pulsing Wireframe Cage)
   */
  private createFaultMarker(): THREE.Group {
    const marker = new THREE.Group();
    marker.position.set(0, -2.1, 1.8);

    const boxGeo = new THREE.BoxGeometry(0.6, 0.35, 0.6);
    const boxMesh = new THREE.Mesh(boxGeo, this.markerMaterial);
    marker.add(boxMesh);

    return marker;
  }

  /**
   * Main inspection sweep animation loop
   */
  public update(timeMs: number, isScanning: boolean = true) {
    if (isScanning) {
      // 1. Pan/Tilt Camera Gimbal Sweep
      const pan = Math.sin(timeMs * 0.0012) * 0.22;
      const tilt = Math.cos(timeMs * 0.0009) * 0.12 - 0.15;
      this.cameraGimbal.rotation.y = pan;
      this.cameraGimbal.rotation.x = tilt;

      // 2. Multibeam Sonar Wavefront Pulse
      const sonarPulse = (timeMs * 0.002) % 1.0;
      this.sonarRings.forEach((ring, idx) => {
        const ringPhase = ((sonarPulse + idx * 0.2) % 1.0);
        ring.scale.setScalar(0.7 + ringPhase * 0.5);
        (ring.material as THREE.LineBasicMaterial).opacity = 0.2 + (1.0 - ringPhase) * 0.6;
      });

      // Subtle acoustic fan breath
      const fanBreath = Math.sin(timeMs * 0.003) * 0.08 + 0.16;
      this.sonarAcousticMaterial.opacity = fanBreath;

      // 3. Green Laser Sheet Scanning Oscillation
      this.laserSheetMesh.position.z = 1.0 + Math.sin(timeMs * 0.0025) * 0.4;
      this.laserMaterial.opacity = 0.45 + 0.25 * Math.sin(timeMs * 0.006);

      // 4. Target HUD Reticle tracking & rotation
      this.targetReticleGroup.rotation.z = Math.sin(timeMs * 0.001) * 0.08;
      const reticlePulse = Math.sin(timeMs * 0.005) * 0.15 + 1.0;
      this.targetReticleGroup.scale.setScalar(reticlePulse);

      // 5. Fault Marker Wireframe Pulse
      const markerPulse = (Math.sin(timeMs * 0.004) * 0.5 + 0.5);
      this.markerMaterial.opacity = 0.3 + 0.5 * markerPulse;
    } else {
      this.sonarAcousticMaterial.opacity = 0.0;
      this.laserMaterial.opacity = 0.0;
      this.sonarGridMaterial.opacity = 0.0;
      this.targetReticleGroup.visible = false;
      this.faultMarkerGroup.visible = false;
    }
  }

  public dispose() {
    this.chassisMaterial.dispose();
    this.lensMaterial.dispose();
    this.sonarAcousticMaterial.dispose();
    this.sonarGridMaterial.dispose();
    this.laserMaterial.dispose();
    this.volumetricBeamMaterial.dispose();
    this.reticleMaterial.dispose();
    this.markerMaterial.dispose();
  }
}
