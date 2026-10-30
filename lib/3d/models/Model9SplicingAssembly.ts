import * as THREE from 'three';

/**
 * MODEL 9 — SUBMARINE CABLE SPLICING & JOINT ASSEMBLY (UNIVERSAL JOINT UJ)
 * 
 * Subsea Telecom Engineering Architecture:
 * 1. Dual Stripped Cable Ends (Double Galvanized Steel Armor Wire, Copper Conductor, Polyethylene Outer Jacket)
 * 2. Precision Optical Fiber Ribbon Array (Standard 6-color optical fibers: Blue, Orange, Green, Brown, Slate, White)
 * 3. Ceramic Micro-V-Groove Piezoelectric Core Alignment Blocks
 * 4. High-Voltage Tungsten Electrodes with Dynamic Atmospheric Plasma Fusion Arc
 * 5. Heat-Shrink Steel-Reinforced Splice Protection Sleeve
 * 6. Stainless Steel Universal Joint (UJ) Pressure-Resistant Outer Casing with Locking Flange Seals
 */
export class Model9SplicingAssembly {
  public group: THREE.Group;

  // Mechanical Subassemblies
  private cableLeft: THREE.Group;
  private cableRight: THREE.Group;
  private fiberLinesLeft: THREE.Line[] = [];
  private fiberLinesRight: THREE.Line[] = [];
  private alignmentStage: THREE.Group;
  private electrodeLeft: THREE.Mesh;
  private electrodeRight: THREE.Mesh;
  private arcPlasmaMesh: THREE.Mesh;
  private arcSparkLight: THREE.PointLight;
  private jointSleeve: THREE.Mesh;
  private jointHousing: THREE.Group;

  // Materials
  private armorMaterial: THREE.MeshStandardMaterial;
  private copperMaterial: THREE.MeshStandardMaterial;
  private steelMaterial: THREE.MeshStandardMaterial;
  private casingMaterial: THREE.MeshStandardMaterial;
  private ceramicMaterial: THREE.MeshStandardMaterial;
  private arcMaterial: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Model9_SplicingAssembly';

    // 1. Engineering Materials
    this.armorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.5,
      metalness: 0.6,
    });
    this.copperMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      metalness: 0.9,
    });
    this.steelMaterial = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.2,
      metalness: 0.95,
    });
    this.ceramicMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.15,
      metalness: 0.1,
    });
    this.casingMaterial = new THREE.MeshStandardMaterial({
      color: 0x153a5b,
      roughness: 0.35,
      metalness: 0.8,
      transparent: true,
      opacity: 0.94,
    });
    this.arcMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });

    // 2. Dual Cable Ends (Left & Right)
    this.cableLeft = this.createStrippedCableEnd(-1);
    this.cableRight = this.createStrippedCableEnd(1);
    this.group.add(this.cableLeft);
    this.group.add(this.cableRight);

    // 3. Exposed Optical Fiber Filaments
    this.createFiberArray();

    // 4. Ceramic Micro V-Groove Alignment Blocks
    this.alignmentStage = this.createMicroAlignmentStage();
    this.group.add(this.alignmentStage);

    // 5. Tungsten Electrodes & Plasma Arc
    const electrodeGeo = new THREE.CylinderGeometry(0.012, 0.003, 0.22, 16);
    this.electrodeLeft = new THREE.Mesh(electrodeGeo, this.steelMaterial);
    this.electrodeLeft.rotation.z = Math.PI / 4;
    this.electrodeLeft.position.set(-0.05, 0.1, 0);

    this.electrodeRight = new THREE.Mesh(electrodeGeo, this.steelMaterial);
    this.electrodeRight.rotation.z = -Math.PI / 4;
    this.electrodeRight.position.set(0.05, 0.1, 0);

    const arcGeo = new THREE.SphereGeometry(0.045, 16, 16);
    this.arcPlasmaMesh = new THREE.Mesh(arcGeo, this.arcMaterial);
    this.arcPlasmaMesh.position.set(0, 0, 0);

    this.arcSparkLight = new THREE.PointLight(0x00ffff, 0, 4.0, 1.2);
    this.arcSparkLight.position.set(0, 0, 0);

    this.group.add(this.electrodeLeft);
    this.group.add(this.electrodeRight);
    this.group.add(this.arcPlasmaMesh);
    this.group.add(this.arcSparkLight);

    // 6. Splice Protection Heat-Shrink Sleeve
    const sleeveGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.45, 24);
    sleeveGeo.rotateZ(Math.PI / 2);
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.2,
      metalness: 0.5,
      transparent: true,
      opacity: 0.85,
    });
    this.jointSleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    this.jointSleeve.position.set(-0.65, 0, 0); // Parked on left cable
    this.group.add(this.jointSleeve);

    // 7. Universal Joint (UJ) Outer Pressure Casing
    this.jointHousing = this.createPressureHousing();
    this.group.add(this.jointHousing);
  }

  private createStrippedCableEnd(dir: number): THREE.Group {
    const end = new THREE.Group();

    // Layer 1: Outer Polyethylene Sheath
    const outerGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.7, 24);
    outerGeo.rotateZ(Math.PI / 2);
    const outerMesh = new THREE.Mesh(outerGeo, this.armorMaterial);
    outerMesh.position.x = dir * 0.85;
    end.add(outerMesh);

    // Layer 2: Galvanized Steel Armor Wire Strands
    const armorGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.25, 24);
    armorGeo.rotateZ(Math.PI / 2);
    const armorMesh = new THREE.Mesh(armorGeo, this.steelMaterial);
    armorMesh.position.x = dir * 0.42;
    end.add(armorMesh);

    // Layer 3: Copper Power Conductor Tube
    const copperGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.2, 24);
    copperGeo.rotateZ(Math.PI / 2);
    const copperMesh = new THREE.Mesh(copperGeo, this.copperMaterial);
    copperMesh.position.x = dir * 0.22;
    end.add(copperMesh);

    // Layer 4: Stainless Steel Central Buffer Tube
    const tubeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16);
    tubeGeo.rotateZ(Math.PI / 2);
    const tubeMesh = new THREE.Mesh(tubeGeo, this.steelMaterial);
    tubeMesh.position.x = dir * 0.08;
    end.add(tubeMesh);

    return end;
  }

  private createFiberArray() {
    const colors = [0x00ffff, 0xf97316, 0x10b981, 0x854d0e, 0x94a3b8, 0xffffff];
    colors.forEach((col, idx) => {
      const angle = (idx / colors.length) * Math.PI * 2;
      const r = 0.025;
      const y = Math.sin(angle) * r;
      const z = Math.cos(angle) * r;

      // Left fiber segment
      const ptsL = [new THREE.Vector3(-0.08, y, z), new THREE.Vector3(-0.015, y * 0.25, z * 0.25)];
      const geoL = new THREE.BufferGeometry().setFromPoints(ptsL);
      const matL = new THREE.LineBasicMaterial({ color: col, linewidth: 2 });
      const lineL = new THREE.Line(geoL, matL);
      this.fiberLinesLeft.push(lineL);
      this.group.add(lineL);

      // Right fiber segment
      const ptsR = [new THREE.Vector3(0.08, y, z), new THREE.Vector3(0.015, y * 0.25, z * 0.25)];
      const geoR = new THREE.BufferGeometry().setFromPoints(ptsR);
      const matR = new THREE.LineBasicMaterial({ color: col, linewidth: 2 });
      const lineR = new THREE.Line(geoR, matR);
      this.fiberLinesRight.push(lineR);
      this.group.add(lineR);
    });
  }

  private createMicroAlignmentStage(): THREE.Group {
    const stage = new THREE.Group();

    // Base ceramic chassis
    const baseGeo = new THREE.BoxGeometry(0.38, 0.07, 0.22);
    const base = new THREE.Mesh(baseGeo, this.ceramicMaterial);
    base.position.y = -0.09;
    stage.add(base);

    // Left and Right Micro V-Groove alignment clamps
    const clampGeo = new THREE.BoxGeometry(0.09, 0.05, 0.12);
    const leftClamp = new THREE.Mesh(clampGeo, this.steelMaterial);
    leftClamp.position.set(-0.08, -0.03, 0);
    const rightClamp = new THREE.Mesh(clampGeo, this.steelMaterial);
    rightClamp.position.set(0.08, -0.03, 0);
    stage.add(leftClamp);
    stage.add(rightClamp);

    return stage;
  }

  private createPressureHousing(): THREE.Group {
    const housing = new THREE.Group();

    // Universal Joint Main Stainless Pressure Cylinder
    const shellGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.85, 32, 1, true);
    shellGeo.rotateZ(Math.PI / 2);
    const shell = new THREE.Mesh(shellGeo, this.casingMaterial);
    housing.add(shell);

    // High-Pressure Endcap Flanges with O-Ring Seals
    const capGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 32);
    capGeo.rotateZ(Math.PI / 2);
    const capLeft = new THREE.Mesh(capGeo, this.steelMaterial);
    capLeft.position.x = -0.92;
    const capRight = new THREE.Mesh(capGeo, this.steelMaterial);
    capRight.position.x = 0.92;
    housing.add(capLeft);
    housing.add(capRight);

    // Bronze-Beryllium Clamping Bands
    const bandGeo = new THREE.TorusGeometry(0.26, 0.025, 16, 32);
    bandGeo.rotateY(Math.PI / 2);
    const bandLeft = new THREE.Mesh(bandGeo, this.copperMaterial);
    bandLeft.position.x = -0.55;
    const bandRight = new THREE.Mesh(bandGeo, this.copperMaterial);
    bandRight.position.x = 0.55;
    housing.add(bandLeft);
    housing.add(bandRight);

    // Start with housing lifted up and transparent
    housing.position.y = 1.0;
    housing.visible = false;

    return housing;
  }

  /**
   * Splicing Sequence Animation Update
   * progress 0.0 - 1.0 across physical stages:
   * 0.0 - 0.25: Fiber Stripping & Micro V-Groove Alignment
   * 0.25 - 0.55: High-Voltage Fusion Arc Discharge (Bright spark welding)
   * 0.55 - 0.75: Splice Protection Sleeve Sliding & Thermocuring
   * 0.75 - 1.00: Universal Joint Stainless Pressure Housing Closure
   */
  public update(progress: number, timeMs: number = 0) {
    const p = Math.max(0, Math.min(1, progress));

    // 1. Fiber Core Gap Alignment Movement
    const gap = (1 - Math.min(1, p * 2.2)) * 0.12;
    this.cableLeft.position.x = -gap;
    this.cableRight.position.x = gap;

    // 2. High-Voltage Fusion Arc Discharge (between p = 0.28 and p = 0.55)
    if (p >= 0.28 && p <= 0.58) {
      const flicker = (Math.sin(timeMs * 0.06) + Math.cos(timeMs * 0.14)) * 0.5 + 0.5;
      this.arcMaterial.opacity = 0.9 * flicker;
      this.arcSparkLight.intensity = 5.0 * flicker;
      this.arcPlasmaMesh.scale.setScalar(0.8 + 0.5 * flicker);
    } else {
      this.arcMaterial.opacity = 0.0;
      this.arcSparkLight.intensity = 0.0;
    }

    // 3. Splice Protection Sleeve Sliding (moves from x = -0.65 to x = 0.0)
    if (p > 0.55) {
      const sleeveT = Math.min(1.0, (p - 0.55) / 0.2);
      this.jointSleeve.position.x = -0.65 * (1 - sleeveT);
    } else {
      this.jointSleeve.position.x = -0.65;
    }

    // 4. Universal Joint Pressure Housing Closure & Locking
    if (p >= 0.75) {
      this.jointHousing.visible = true;
      const housingT = Math.min(1.0, (p - 0.75) / 0.2);
      this.jointHousing.position.y = (1 - housingT) * 0.7;
      this.jointHousing.scale.setScalar(0.92 + 0.08 * housingT);
    } else {
      this.jointHousing.visible = false;
      this.jointHousing.position.y = 1.0;
    }
  }

  public dispose() {
    this.armorMaterial.dispose();
    this.copperMaterial.dispose();
    this.steelMaterial.dispose();
    this.ceramicMaterial.dispose();
    this.casingMaterial.dispose();
    this.arcMaterial.dispose();
  }
}
