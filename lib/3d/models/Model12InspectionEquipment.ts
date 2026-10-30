import * as THREE from 'three';

/**
 * MODEL 12 — MODULAR UNDERWATER INSPECTION EQUIPMENT
 * 
 * Includes:
 * 1. Multibeam Bathymetric Sonar Pod (Phased-Array Acoustic Transceiver with animated sweep cone)
 * 2. Stereoscopic 4K Optical Inspection Cameras with 2-axis Pan/Tilt Gimbal
 * 3. Dual 50,000-Lumen High-Intensity LED Floodlights with volumetric beam cones
 * 4. Electromagnetic TSS 440 Tone-Tracking Search Coils for subsea cable burial tracking
 * 5. Green Laser Profiler Sheet measuring cable ovality and microbending damage
 */
export class Model12InspectionEquipment {
  public group: THREE.Group;

  // Components
  private sonarHead: THREE.Group;
  private sonarCone: THREE.Mesh;
  private cameraGimbal: THREE.Group;
  private floodlightLeft: THREE.SpotLight;
  private floodlightRight: THREE.SpotLight;
  private lightBeamLeft: THREE.Mesh;
  private lightBeamRight: THREE.Mesh;
  private laserSheet: THREE.Mesh;
  private trackerArmLeft: THREE.Group;
  private trackerArmRight: THREE.Group;

  // Materials
  private chassisMaterial: THREE.MeshStandardMaterial;
  private lensMaterial: THREE.MeshPhysicalMaterial;
  private sonarBeamMaterial: THREE.MeshBasicMaterial;
  private laserMaterial: THREE.MeshBasicMaterial;
  private beamConeMaterial: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Model12_InspectionEquipment';

    // Materials
    this.chassisMaterial = new THREE.MeshStandardMaterial({
      color: 0x1c2d42,
      roughness: 0.35,
      metalness: 0.8,
    });
    this.lensMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x112233,
      roughness: 0.05,
      transmission: 0.9,
      thickness: 0.5,
    });
    this.sonarBeamMaterial = new THREE.MeshBasicMaterial({
      color: 0x13bfd3,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.laserMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.beamConeMaterial = new THREE.MeshBasicMaterial({
      color: 0xe0f7fa,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // 1. Multibeam Sonar Pod
    this.sonarHead = this.createSonarPod();
    this.group.add(this.sonarHead);

    // Sonar Beam Fan Sweep
    const sonarGeo = new THREE.ConeGeometry(1.4, 2.5, 32, 1, true);
    sonarGeo.rotateX(Math.PI);
    this.sonarCone = new THREE.Mesh(sonarGeo, this.sonarBeamMaterial);
    this.sonarCone.position.set(0, -1.25, 0.4);
    this.group.add(this.sonarCone);

    // 2. Stereoscopic 4K Optical Camera Gimbal
    this.cameraGimbal = this.createCameraGimbal();
    this.group.add(this.cameraGimbal);

    // 3. Dual LED Floodlights & Volumetric Beams
    const { floodLeft, floodRight, beamLeft, beamRight } = this.createFloodlights();
    this.floodlightLeft = floodLeft;
    this.floodlightRight = floodRight;
    this.lightBeamLeft = beamLeft;
    this.lightBeamRight = beamRight;
    this.group.add(this.floodlightLeft);
    this.group.add(this.floodlightRight);
    this.group.add(this.lightBeamLeft);
    this.group.add(this.lightBeamRight);

    // 4. Electromagnetic TSS 440 Cable Tracker Coil Arms
    this.trackerArmLeft = this.createTrackerArm(-1);
    this.trackerArmRight = this.createTrackerArm(1);
    this.group.add(this.trackerArmLeft);
    this.group.add(this.trackerArmRight);

    // 5. Green Laser Profiler Sheet
    const laserGeo = new THREE.PlaneGeometry(0.8, 1.8);
    laserGeo.rotateX(-Math.PI / 3);
    this.laserSheet = new THREE.Mesh(laserGeo, this.laserMaterial);
    this.laserSheet.position.set(0, -0.6, 0.8);
    this.group.add(this.laserSheet);
  }

  private createSonarPod(): THREE.Group {
    const pod = new THREE.Group();
    pod.position.set(0, 0.2, 0.3);

    // Transducer dome housing
    const domeGeo = new THREE.SphereGeometry(0.22, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    domeGeo.rotateX(Math.PI);
    const dome = new THREE.Mesh(domeGeo, this.chassisMaterial);
    pod.add(dome);

    // Carbon-fiber mounting bracket
    const bracketGeo = new THREE.BoxGeometry(0.12, 0.08, 0.25);
    const bracket = new THREE.Mesh(bracketGeo, new THREE.MeshStandardMaterial({ color: 0x0b1d33, roughness: 0.6 }));
    bracket.position.y = 0.08;
    pod.add(bracket);

    return pod;
  }

  private createCameraGimbal(): THREE.Group {
    const gimbal = new THREE.Group();
    gimbal.position.set(0, -0.05, 0.5);

    // Dual stereo camera body
    const bodyGeo = new THREE.BoxGeometry(0.38, 0.12, 0.18);
    const body = new THREE.Mesh(bodyGeo, this.chassisMaterial);
    gimbal.add(body);

    // Left and Right optical lenses
    const lensGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.06, 24);
    lensGeo.rotateX(Math.PI / 2);

    const lensL = new THREE.Mesh(lensGeo, this.lensMaterial);
    lensL.position.set(-0.11, 0, 0.09);
    gimbal.add(lensL);

    const lensR = new THREE.Mesh(lensGeo, this.lensMaterial);
    lensR.position.set(0.11, 0, 0.09);
    gimbal.add(lensR);

    return gimbal;
  }

  private createFloodlights() {
    const lightTarget = new THREE.Object3D();
    lightTarget.position.set(0, -3.0, 3.5);
    this.group.add(lightTarget);

    const floodLeft = new THREE.SpotLight(0xdff9fc, 4.0, 15, Math.PI / 6, 0.45, 1.2);
    floodLeft.position.set(-0.35, 0.15, 0.4);
    floodLeft.target = lightTarget;

    const floodRight = new THREE.SpotLight(0xdff9fc, 4.0, 15, Math.PI / 6, 0.45, 1.2);
    floodRight.position.set(0.35, 0.15, 0.4);
    floodRight.target = lightTarget;

    // Volumetric beam cones
    const coneGeo = new THREE.ConeGeometry(0.75, 3.0, 24, 1, true);
    coneGeo.rotateX(-Math.PI / 4);

    const beamLeft = new THREE.Mesh(coneGeo, this.beamConeMaterial);
    beamLeft.position.copy(floodLeft.position);
    beamLeft.position.z += 1.4;
    beamLeft.position.y -= 1.0;

    const beamRight = new THREE.Mesh(coneGeo, this.beamConeMaterial);
    beamRight.position.copy(floodRight.position);
    beamRight.position.z += 1.4;
    beamRight.position.y -= 1.0;

    return { floodLeft, floodRight, beamLeft, beamRight };
  }

  private createTrackerArm(dir: number): THREE.Group {
    const arm = new THREE.Group();
    arm.position.set(dir * 0.35, -0.15, 0.1);

    // Extension strut
    const strutGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 12);
    strutGeo.rotateZ(dir * (Math.PI / 3));
    const strut = new THREE.Mesh(strutGeo, this.chassisMaterial);
    strut.position.set(dir * 0.2, -0.1, 0);
    arm.add(strut);

    // Search coil pod (yellow/amber subsea sensor)
    const coilGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 16);
    const coil = new THREE.Mesh(coilGeo, new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.5,
    }));
    coil.position.set(dir * 0.4, -0.22, 0.15);
    coil.rotation.x = Math.PI / 4;
    arm.add(coil);

    return arm;
  }

  /**
   * Animation update loop for inspection sweeps
   */
  public update(timeMs: number, isScanning: boolean = true) {
    if (isScanning) {
      // Pan/tilt camera sweep
      const pan = Math.sin(timeMs * 0.0015) * 0.25;
      const tilt = Math.cos(timeMs * 0.001) * 0.15 - 0.2;
      this.cameraGimbal.rotation.y = pan;
      this.cameraGimbal.rotation.x = tilt;

      // Sonar pulse scale oscillation
      const sonarPulse = (Math.sin(timeMs * 0.004) * 0.5 + 0.5);
      this.sonarCone.scale.set(1.0 + 0.15 * sonarPulse, 1.0 + 0.1 * sonarPulse, 1.0 + 0.15 * sonarPulse);
      this.sonarBeamMaterial.opacity = 0.15 + 0.2 * sonarPulse;

      // Laser profiler sweep
      this.laserSheet.position.z = 0.7 + Math.sin(timeMs * 0.003) * 0.3;
      this.laserMaterial.opacity = 0.45 + 0.3 * Math.sin(timeMs * 0.008);
    } else {
      this.sonarBeamMaterial.opacity = 0.0;
      this.laserMaterial.opacity = 0.0;
    }
  }

  public dispose() {
    this.chassisMaterial.dispose();
    this.lensMaterial.dispose();
    this.sonarBeamMaterial.dispose();
    this.laserMaterial.dispose();
    this.beamConeMaterial.dispose();
  }
}
