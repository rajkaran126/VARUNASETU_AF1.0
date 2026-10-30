import * as THREE from 'three';

/**
 * MODEL 9 — SUBMARINE CABLE SPLICING AND JOINT ASSEMBLY
 * 
 * Modular procedural Three.js model representing:
 * - Armored subsea cable layers (outer polyethylene, double steel wire armor, copper conductor, loose tube)
 * - Microscopic optical fiber ribbons (colored core filaments)
 * - Ceramic micro-v-groove alignment blocks with precision micron servos
 * - Fusion electric arc electrodes with glowing plasma discharge
 * - Universal Joint (UJ) stainless steel pressure cylinder and seal endcaps
 */
export class Model9SplicingAssembly {
  public group: THREE.Group;

  // Sub-assemblies
  private cableLeft: THREE.Group;
  private cableRight: THREE.Group;
  private fibersLeft: THREE.Line[];
  private fibersRight: THREE.Line[];
  private alignmentStage: THREE.Group;
  private electrodeLeft: THREE.Mesh;
  private electrodeRight: THREE.Mesh;
  private arcSpark: THREE.PointLight;
  private arcMesh: THREE.Mesh;
  private jointSleeve: THREE.Mesh;
  private jointHousing: THREE.Group;

  // Materials
  private armorMaterial: THREE.MeshStandardMaterial;
  private copperMaterial: THREE.MeshStandardMaterial;
  private steelMaterial: THREE.MeshStandardMaterial;
  private casingMaterial: THREE.MeshStandardMaterial;
  private arcMaterial: THREE.MeshBasicMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Model9_SplicingAssembly';

    // Materials setup
    this.armorMaterial = new THREE.MeshStandardMaterial({
      color: 0x242d38,
      roughness: 0.45,
      metalness: 0.65,
    });
    this.copperMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97736,
      roughness: 0.3,
      metalness: 0.85,
    });
    this.steelMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8e2ec,
      roughness: 0.25,
      metalness: 0.9,
    });
    this.casingMaterial = new THREE.MeshStandardMaterial({
      color: 0x153a5b,
      roughness: 0.35,
      metalness: 0.75,
      transparent: true,
      opacity: 0.92,
    });
    this.arcMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.0,
    });

    // 1. Cables on Left and Right
    this.cableLeft = this.createCableEnd(-1);
    this.cableRight = this.createCableEnd(1);
    this.group.add(this.cableLeft);
    this.group.add(this.cableRight);

    // 2. Optical Fiber filaments
    this.fibersLeft = this.createFiberBundle(-1);
    this.fibersRight = this.createFiberBundle(1);
    this.fibersLeft.forEach((f) => this.group.add(f));
    this.fibersRight.forEach((f) => this.group.add(f));

    // 3. Precision V-Groove Alignment Stage
    this.alignmentStage = this.createAlignmentStage();
    this.group.add(this.alignmentStage);

    // 4. Fusion Arc Electrodes & Spark
    const electrodeGeo = new THREE.CylinderGeometry(0.015, 0.005, 0.25, 12);
    this.electrodeLeft = new THREE.Mesh(electrodeGeo, this.steelMaterial);
    this.electrodeLeft.rotation.z = Math.PI / 4;
    this.electrodeLeft.position.set(-0.06, 0.12, 0);

    this.electrodeRight = new THREE.Mesh(electrodeGeo, this.steelMaterial);
    this.electrodeRight.rotation.z = -Math.PI / 4;
    this.electrodeRight.position.set(0.06, 0.12, 0);

    const arcGeo = new THREE.SphereGeometry(0.04, 16, 16);
    this.arcMesh = new THREE.Mesh(arcGeo, this.arcMaterial);
    this.arcMesh.position.set(0, 0, 0);

    this.arcSpark = new THREE.PointLight(0x00ffff, 0, 2.5);
    this.arcSpark.position.set(0, 0, 0);

    this.group.add(this.electrodeLeft);
    this.group.add(this.electrodeRight);
    this.group.add(this.arcMesh);
    this.group.add(this.arcSpark);

    // 5. Splice Protection Sleeve
    const sleeveGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.45, 24);
    sleeveGeo.rotateZ(Math.PI / 2);
    this.jointSleeve = new THREE.Mesh(sleeveGeo, new THREE.MeshStandardMaterial({
      color: 0x91a1af,
      roughness: 0.2,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85,
    }));
    this.jointSleeve.position.set(-0.6, 0, 0); // Parked on left cable initially
    this.group.add(this.jointSleeve);

    // 6. Universal Joint (UJ) Outer Pressure Housing Cylinder
    this.jointHousing = this.createJointHousing();
    this.group.add(this.jointHousing);
  }

  private createCableEnd(dir: number): THREE.Group {
    const cable = new THREE.Group();

    // Outer Polyethylene Jacket
    const jacketGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.8, 24);
    jacketGeo.rotateZ(Math.PI / 2);
    const jacket = new THREE.Mesh(jacketGeo, this.armorMaterial);
    jacket.position.x = dir * 0.9;
    cable.add(jacket);

    // Galvanized Steel Armor Wire Layer (Helix representation)
    const armorGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 24);
    armorGeo.rotateZ(Math.PI / 2);
    const armor = new THREE.Mesh(armorGeo, this.steelMaterial);
    armor.position.x = dir * 0.45;
    cable.add(armor);

    // Copper Conductor Tube
    const copperGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.25, 24);
    copperGeo.rotateZ(Math.PI / 2);
    const copper = new THREE.Mesh(copperGeo, this.copperMaterial);
    copper.position.x = dir * 0.25;
    cable.add(copper);

    // Loose Tube Polycarbonate Core
    const coreGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.2, 16);
    coreGeo.rotateZ(Math.PI / 2);
    const core = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({ color: 0xf5faff, roughness: 0.1 }));
    core.position.x = dir * 0.12;
    cable.add(core);

    return cable;
  }

  private createFiberBundle(dir: number): THREE.Line[] {
    const colors = [0x00ffff, 0xff0055, 0x00ff88, 0xffaa00, 0x8844ff, 0xffffff];
    const fibers: THREE.Line[] = [];

    colors.forEach((col, idx) => {
      const angle = (idx / colors.length) * Math.PI * 2;
      const r = 0.025;
      const y = Math.sin(angle) * r;
      const z = Math.cos(angle) * r;

      const points = [
        new THREE.Vector3(dir * 0.12, y, z),
        new THREE.Vector3(dir * 0.015, y * 0.3, z * 0.3),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: col, linewidth: 2 });
      const line = new THREE.Line(geo, mat);
      fibers.push(line);
    });

    return fibers;
  }

  private createAlignmentStage(): THREE.Group {
    const stage = new THREE.Group();

    // Base ceramic mounting plate
    const baseGeo = new THREE.BoxGeometry(0.35, 0.08, 0.22);
    const base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: 0x3a4f66, roughness: 0.5 }));
    base.position.y = -0.1;
    stage.add(base);

    // Left and Right V-Groove clamping blocks
    const blockGeo = new THREE.BoxGeometry(0.08, 0.06, 0.1);
    const leftBlock = new THREE.Mesh(blockGeo, this.steelMaterial);
    leftBlock.position.set(-0.08, -0.03, 0);
    const rightBlock = new THREE.Mesh(blockGeo, this.steelMaterial);
    rightBlock.position.set(0.08, -0.03, 0);
    stage.add(leftBlock);
    stage.add(rightBlock);

    return stage;
  }

  private createJointHousing(): THREE.Group {
    const housing = new THREE.Group();

    // Universal Joint Main Shell (Stainless Steel Cylinder with flanges)
    const shellGeo = new THREE.CylinderGeometry(0.32, 0.32, 1.8, 32, 1, true);
    shellGeo.rotateZ(Math.PI / 2);
    const shell = new THREE.Mesh(shellGeo, this.casingMaterial);
    housing.add(shell);

    // Endcap Flanges with O-Ring Seals
    const capGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.08, 32);
    capGeo.rotateZ(Math.PI / 2);
    const capLeft = new THREE.Mesh(capGeo, this.steelMaterial);
    capLeft.position.x = -0.9;
    const capRight = new THREE.Mesh(capGeo, this.steelMaterial);
    capRight.position.x = 0.9;
    housing.add(capLeft);
    housing.add(capRight);

    // Beryllium Copper Clamping Collars
    const collarGeo = new THREE.TorusGeometry(0.24, 0.03, 16, 32);
    collarGeo.rotateY(Math.PI / 2);
    const collarLeft = new THREE.Mesh(collarGeo, this.copperMaterial);
    collarLeft.position.x = -0.55;
    const collarRight = new THREE.Mesh(collarGeo, this.copperMaterial);
    collarRight.position.x = 0.55;
    housing.add(collarLeft);
    housing.add(collarRight);

    // Start with housing opened / split along axis so interior splicing is visible
    housing.position.y = 1.2;
    housing.visible = false;

    return housing;
  }

  /**
   * Update animation state based on progress (0.0 to 1.0)
   * 0.0 - 0.2: Cable End Exposure & Stripping
   * 0.2 - 0.4: Fiber Cleaving & Micro V-Groove Alignment
   * 0.4 - 0.6: Fusion Arc Discharge & Spark Welding
   * 0.6 - 0.8: Heat-Shrink Sleeve Slide & Curing
   * 0.8 - 1.0: Universal Joint Pressure Housing Sealing
   */
  public update(progress: number, timeMs: number = 0) {
    const p = Math.max(0, Math.min(1, progress));

    // Stage 1: Cable Alignment Movement (gap closes from 0.08 to 0.0)
    const gap = (1 - Math.min(1, p * 2.5)) * 0.12;
    this.cableLeft.position.x = -gap;
    this.cableRight.position.x = gap;

    // Stage 2: Splicing Fusion Arc Discharge (between p = 0.35 and p = 0.55)
    if (p >= 0.35 && p <= 0.58) {
      const flicker = (Math.sin(timeMs * 0.05) + Math.cos(timeMs * 0.12)) * 0.5 + 0.5;
      this.arcMaterial.opacity = 0.85 * flicker;
      this.arcSpark.intensity = 3.5 * flicker;
      this.arcMesh.scale.setScalar(0.8 + 0.4 * flicker);
    } else {
      this.arcMaterial.opacity = 0.0;
      this.arcSpark.intensity = 0.0;
    }

    // Stage 3: Protective Sleeve Sliding (moves from x = -0.6 to x = 0.0 between p = 0.55 and 0.75)
    if (p > 0.55) {
      const sleeveT = Math.min(1.0, (p - 0.55) / 0.2);
      this.jointSleeve.position.x = -0.6 * (1 - sleeveT);
    } else {
      this.jointSleeve.position.x = -0.6;
    }

    // Stage 4: Joint Housing Enclosure & Sealing (p > 0.75)
    if (p >= 0.75) {
      this.jointHousing.visible = true;
      const housingT = Math.min(1.0, (p - 0.75) / 0.2);
      this.jointHousing.position.y = (1 - housingT) * 0.8;
      this.jointHousing.scale.setScalar(0.9 + 0.1 * housingT);
    } else {
      this.jointHousing.visible = false;
      this.jointHousing.position.y = 1.2;
    }
  }

  public dispose() {
    this.armorMaterial.dispose();
    this.copperMaterial.dispose();
    this.steelMaterial.dispose();
    this.casingMaterial.dispose();
    this.arcMaterial.dispose();
  }
}
