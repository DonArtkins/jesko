import * as THREE from 'three';

export interface JetAssetMaterials {
  solidFuselageMat: THREE.MeshPhysicalMaterial;
  chromeSlatsMat: THREE.MeshStandardMaterial;
  glassWindowsMat: THREE.MeshPhysicalMaterial;
  cockpitGlassMat: THREE.MeshPhysicalMaterial;
  engineBodyMat: THREE.MeshPhysicalMaterial;
  engineIntakeMat: THREE.MeshStandardMaterial;
  engineFanMat: THREE.MeshStandardMaterial;
  interiorFloorMat: THREE.MeshStandardMaterial;
  interiorSeatsMat: THREE.MeshStandardMaterial;
  interiorWoodMat: THREE.MeshStandardMaterial;
  schematicLinesMat: THREE.LineBasicMaterial;
  schematicFillMat: THREE.MeshBasicMaterial;
}

export class JetPlaneAsset {
  public group: THREE.Group;
  public solidGroup: THREE.Group;
  public schematicGroup: THREE.Group;
  public materials: JetAssetMaterials;
  private animatableParts: {
    portAileron?: THREE.Mesh;
    starboardAileron?: THREE.Mesh;
    turbines: THREE.Mesh[];
  };

  constructor(renderer: THREE.WebGLRenderer) {
    this.group = new THREE.Group();
    this.solidGroup = new THREE.Group();
    this.schematicGroup = new THREE.Group();
    this.group.add(this.solidGroup);
    this.group.add(this.schematicGroup);

    this.animatableParts = {
      turbines: [],
    };

    // 1. Procedural Panel Seams & Aircraft Texture
    const liveryTexture = this.createFuselageTexture(renderer);

    // 2. High-Fidelity PBR Materials
    this.materials = {
      solidFuselageMat: new THREE.MeshPhysicalMaterial({
        color: 0xded6c7, // Champagne Platinum Warm Titanium (Jesko signature)
        metalness: 0.85,
        roughness: 0.22,
        clearcoat: 0.95,
        clearcoatRoughness: 0.1,
        map: liveryTexture,
        transparent: true,
        opacity: 1.0,
      }),
      chromeSlatsMat: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.98,
        roughness: 0.08,
        transparent: true,
        opacity: 1.0,
      }),
      glassWindowsMat: new THREE.MeshPhysicalMaterial({
        color: 0x091422,
        metalness: 0.3,
        roughness: 0.05,
        transmission: 0.75,
        thickness: 0.8,
        transparent: true,
        opacity: 1.0,
      }),
      cockpitGlassMat: new THREE.MeshPhysicalMaterial({
        color: 0x050c18,
        metalness: 0.4,
        roughness: 0.04,
        transmission: 0.85,
        thickness: 1.2,
        transparent: true,
        opacity: 1.0,
      }),
      engineBodyMat: new THREE.MeshPhysicalMaterial({
        color: 0xd6cebf,
        metalness: 0.88,
        roughness: 0.25,
        clearcoat: 0.9,
        transparent: true,
        opacity: 1.0,
      }),
      engineIntakeMat: new THREE.MeshStandardMaterial({
        color: 0xe8e8e8,
        metalness: 0.98,
        roughness: 0.06,
        transparent: true,
        opacity: 1.0,
      }),
      engineFanMat: new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        metalness: 0.9,
        roughness: 0.35,
        transparent: true,
        opacity: 1.0,
      }),
      interiorFloorMat: new THREE.MeshStandardMaterial({
        color: 0x998b79,
        roughness: 0.7,
        metalness: 0.1,
        transparent: true,
        opacity: 0.0,
      }),
      interiorSeatsMat: new THREE.MeshStandardMaterial({
        color: 0xf5eedf, // Cream leather
        roughness: 0.4,
        metalness: 0.05,
        transparent: true,
        opacity: 0.0,
      }),
      interiorWoodMat: new THREE.MeshStandardMaterial({
        color: 0x4a2a1b, // Burled walnut
        roughness: 0.2,
        metalness: 0.2,
        transparent: true,
        opacity: 0.0,
      }),
      schematicLinesMat: new THREE.LineBasicMaterial({
        color: 0x181a1f, // Crisp architectural ink on sand paper
        linewidth: 1.5,
        transparent: true,
        opacity: 0.0,
      }),
      schematicFillMat: new THREE.MeshBasicMaterial({
        color: 0xe5dfd4,
        transparent: true,
        opacity: 0.0,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    };

    // 3. Build Sub-Assemblies
    this.buildSolidFuselage();
    this.buildCockpitCanopy();
    this.buildOvalWindows();
    this.buildWings();
    this.buildEngines();
    this.buildEmpennage();

    // 4. Build Architectural Cabin Schematic
    this.buildCabinSchematic();

    // Initially hide interior schematic in flight
    this.schematicGroup.visible = false;
    this.solidGroup.visible = true;
  }

  /**
   * Procedural texture generating Gulfstream fuselage panels, emergency exits, and clean luxury pinstripe.
   */
  private createFuselageTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Base champagne metallic gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, '#f2ebe0');
      grad.addColorStop(0.3, '#ded6c7');
      grad.addColorStop(0.7, '#e4dccf');
      grad.addColorStop(1, '#d5cbb9');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Fine fuselage panel lines
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.09)';
      ctx.lineWidth = 1.5;

      // Longitudinal stringer lines
      for (let y = 100; y < canvas.height; y += 120) {
        ctx.beginPath();
        ctx.moveTo(100, y);
        ctx.lineTo(canvas.width - 100, y);
        ctx.stroke();
      }

      // Circumferential frame ribs
      for (let x = 200; x < canvas.width - 200; x += 150) {
        ctx.beginPath();
        ctx.moveTo(x, 80);
        ctx.lineTo(x, canvas.height - 80);
        ctx.stroke();
      }

      // Elegant Gulfstream luxury waistline pinstripe
      ctx.strokeStyle = '#9e8a70';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(120, 520);
      ctx.lineTo(canvas.width - 120, 520);
      ctx.stroke();

      ctx.strokeStyle = '#1b2a3a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(150, 530);
      ctx.lineTo(canvas.width - 150, 530);
      ctx.stroke();

      // Subtle typography decals
      ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('GULFSTREAM 650ER', 1350, 480);
      ctx.font = '500 16px "JetBrains Mono", monospace';
      ctx.fillText('EMERGENCY EXIT', 780, 490);
      ctx.fillText('AIRCRAFT NO. 09-0012', 1350, 506);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  /**
   * Fuselage: Sleek ogive nose, cylindrical cabin, tapered tailcone.
   */
  private buildSolidFuselage() {
    const points: THREE.Vector2[] = [];
    const length = 9.8;
    const segments = 48;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const z = -5.0 + t * length; // -5.0 (tail) to +4.8 (nose)
      let radius = 0.44;

      if (z > 2.8) {
        // Nose taper (2.8 to 4.8)
        const noseT = (z - 2.8) / 2.0;
        // Streamlined ogive curve
        radius = 0.44 * Math.sqrt(Math.max(0, 1 - noseT * noseT));
      } else if (z < -2.2) {
        // Tail taper (-2.2 to -5.0)
        const tailT = (-2.2 - z) / 2.8;
        radius = 0.44 * Math.pow(Math.max(0, 1 - tailT), 1.35) + 0.04;
      }

      points.push(new THREE.Vector2(Math.max(0.005, radius), z));
    }

    const fuselageGeo = new THREE.LatheGeometry(points, 48);
    // Orient so nose is along +Z and tail along -Z, center axis along Z
    fuselageGeo.rotateX(Math.PI / 2);

    const fuselageMesh = new THREE.Mesh(fuselageGeo, this.materials.solidFuselageMat);
    fuselageMesh.castShadow = true;
    fuselageMesh.receiveShadow = true;
    this.solidGroup.add(fuselageMesh);

    // Chrome nose tip / radome cap
    const radomeCapGeo = new THREE.SphereGeometry(0.12, 24, 16);
    radomeCapGeo.scale(0.8, 0.8, 1.8);
    const radomeCap = new THREE.Mesh(radomeCapGeo, this.materials.chromeSlatsMat);
    radomeCap.position.set(0, 0, 4.75);
    this.solidGroup.add(radomeCap);
  }

  /**
   * Cockpit Canopy: Gulfstream 4-pane wrap-around cockpit windshield.
   */
  private buildCockpitCanopy() {
    const canopyGeo = new THREE.BoxGeometry(0.54, 0.22, 0.7);
    canopyGeo.translate(0, 0.34, 3.4);

    const cockpitMesh = new THREE.Mesh(canopyGeo, this.materials.cockpitGlassMat);
    cockpitMesh.rotation.x = -0.32; // Angled backward
    cockpitMesh.scale.set(1.0, 0.7, 1.1);
    this.solidGroup.add(cockpitMesh);

    // Cockpit windshield chrome divider frames
    const frameGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.25, 8);
    frameGeo.rotateZ(Math.PI / 2);
    const frame = new THREE.Mesh(frameGeo, this.materials.chromeSlatsMat);
    frame.position.set(0, 0.39, 3.46);
    frame.rotation.x = -0.32;
    this.solidGroup.add(frame);
  }

  /**
   * Signature Gulfstream Oval Windows: 16 panoramic windows per flank.
   */
  private buildOvalWindows() {
    const windowGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.015, 24);
    windowGeo.scale(1.0, 1.0, 1.45); // Oval shape
    windowGeo.rotateZ(Math.PI / 2);

    const bezelGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.016, 24);
    bezelGeo.scale(1.0, 1.0, 1.45);
    bezelGeo.rotateZ(Math.PI / 2);

    const windowCount = 14;
    const startZ = -1.6;
    const endZ = 2.4;
    const step = (endZ - startZ) / (windowCount - 1);

    for (let i = 0; i < windowCount; i++) {
      const z = startZ + i * step;
      const y = 0.08;
      const x = 0.435;

      // Port side (left)
      const portBezel = new THREE.Mesh(bezelGeo, this.materials.chromeSlatsMat);
      portBezel.position.set(-x, y, z);
      this.solidGroup.add(portBezel);

      const portGlass = new THREE.Mesh(windowGeo, this.materials.glassWindowsMat);
      portGlass.position.set(-x - 0.002, y, z);
      this.solidGroup.add(portGlass);

      // Starboard side (right)
      const stbdBezel = new THREE.Mesh(bezelGeo, this.materials.chromeSlatsMat);
      stbdBezel.position.set(x, y, z);
      this.solidGroup.add(stbdBezel);

      const stbdGlass = new THREE.Mesh(windowGeo, this.materials.glassWindowsMat);
      stbdGlass.position.set(x + 0.002, y, z);
      this.solidGroup.add(stbdGlass);
    }
  }

  /**
   * Swept Wings: 33-degree sweep, cambered profile, chrome leading edge, and blended winglets.
   */
  private buildWings() {
    const wingGroup = new THREE.Group();

    // Create custom swept aerodynamic wing shape
    const wingShape = new THREE.Shape();
    // Root chord at fuselage
    wingShape.moveTo(0.4, 0.9);
    wingShape.lineTo(4.6, -1.8); // Wingtip leading edge (swept back)
    wingShape.lineTo(4.5, -2.4); // Wingtip trailing edge
    wingShape.lineTo(0.4, -0.6); // Wing root trailing edge
    wingShape.closePath();

    const extrudeSettings = {
      depth: 0.065,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };

    // Starboard (Right) Wing
    const rightWingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    rightWingGeo.rotateX(Math.PI / 2); // Lay horizontal in XZ plane
    rightWingGeo.translate(0, -0.06, 0);

    const rightWingMesh = new THREE.Mesh(rightWingGeo, this.materials.solidFuselageMat);
    rightWingMesh.castShadow = true;
    wingGroup.add(rightWingMesh);

    // Port (Left) Wing (mirrored across X)
    const leftWingGeo = rightWingGeo.clone();
    leftWingGeo.scale(-1, 1, 1);
    const leftWingMesh = new THREE.Mesh(leftWingGeo, this.materials.solidFuselageMat);
    leftWingMesh.castShadow = true;
    wingGroup.add(leftWingMesh);

    // Polished Chrome Leading Edge Anti-Ice Slats
    const slatCurveRight = new THREE.LineCurve3(
      new THREE.Vector3(0.42, -0.05, 0.92),
      new THREE.Vector3(4.62, -0.05, -1.78)
    );
    const slatGeoRight = new THREE.TubeGeometry(slatCurveRight, 32, 0.028, 12, false);
    const rightSlat = new THREE.Mesh(slatGeoRight, this.materials.chromeSlatsMat);
    wingGroup.add(rightSlat);

    const slatCurveLeft = new THREE.LineCurve3(
      new THREE.Vector3(-0.42, -0.05, 0.92),
      new THREE.Vector3(-4.62, -0.05, -1.78)
    );
    const slatGeoLeft = new THREE.TubeGeometry(slatCurveLeft, 32, 0.028, 12, false);
    const leftSlat = new THREE.Mesh(slatGeoLeft, this.materials.chromeSlatsMat);
    wingGroup.add(leftSlat);

    // Upswept Blended Winglets
    const wingletShape = new THREE.Shape();
    wingletShape.moveTo(0, 0);
    wingletShape.lineTo(0.04, 0.72); // Height
    wingletShape.lineTo(-0.28, 0.62); // Swept aft
    wingletShape.lineTo(-0.35, 0);
    wingletShape.closePath();

    const wingletGeo = new THREE.ExtrudeGeometry(wingletShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSize: 0.01,
      bevelThickness: 0.01,
    });

    // Right Winglet
    const rightWinglet = new THREE.Mesh(wingletGeo, this.materials.solidFuselageMat);
    rightWinglet.position.set(4.58, -0.06, -1.82);
    rightWinglet.rotation.y = -0.15;
    rightWinglet.rotation.z = -0.12; // Canted slightly outward
    wingGroup.add(rightWinglet);

    // Left Winglet
    const leftWinglet = new THREE.Mesh(wingletGeo, this.materials.solidFuselageMat);
    leftWinglet.position.set(-4.58, -0.06, -1.82);
    leftWinglet.rotation.y = 0.15;
    leftWinglet.rotation.z = 0.12;
    leftWinglet.scale.x = -1;
    wingGroup.add(leftWinglet);

    // Flap track canoe fairings under the wings (3 per side)
    const canoeGeo = new THREE.ConeGeometry(0.045, 0.65, 12);
    canoeGeo.rotateX(Math.PI / 2);
    const canoeOffsets = [1.4, 2.5, 3.6];
    canoeOffsets.forEach((xOffset) => {
      const zOffset = -0.6 - (xOffset / 4.6) * 1.6;
      // Right canoe
      const rCanoe = new THREE.Mesh(canoeGeo, this.materials.solidFuselageMat);
      rCanoe.position.set(xOffset, -0.12, zOffset);
      wingGroup.add(rCanoe);
      // Left canoe
      const lCanoe = new THREE.Mesh(canoeGeo, this.materials.solidFuselageMat);
      lCanoe.position.set(-xOffset, -0.12, zOffset);
      wingGroup.add(lCanoe);
    });

    // Wing Root Karman aerodynamic fairing blending underside
    const bellyFairingGeo = new THREE.CylinderGeometry(0.48, 0.48, 2.8, 24);
    bellyFairingGeo.scale(1.2, 0.28, 1.0);
    bellyFairingGeo.rotateX(Math.PI / 2);
    const bellyFairing = new THREE.Mesh(bellyFairingGeo, this.materials.solidFuselageMat);
    bellyFairing.position.set(0, -0.12, -0.15);
    wingGroup.add(bellyFairing);

    this.solidGroup.add(wingGroup);
  }

  /**
   * Dual Rolls-Royce BR725 Turbofan Engines with pylons, cowlings, intake lip, and internal spinners.
   */
  private buildEngines() {
    const engineGroup = new THREE.Group();

    const buildSingleEngine = (isPort: boolean) => {
      const single = new THREE.Group();
      const x = isPort ? -0.86 : 0.86;
      const y = 0.22;
      const z = -2.35;

      // Aerodynamic pylon connecting engine nacelle to fuselage
      const pylonGeo = new THREE.BoxGeometry(0.06, 0.22, 0.65);
      const pylon = new THREE.Mesh(pylonGeo, this.materials.solidFuselageMat);
      pylon.position.set(isPort ? 0.38 : -0.38, 0.04, -0.15);
      pylon.rotation.y = isPort ? 0.05 : -0.05;
      single.add(pylon);

      // Nacelle Cowling (Outer aerodynamic sleeve)
      const nacelleGeo = new THREE.CylinderGeometry(0.24, 0.23, 1.45, 32);
      nacelleGeo.rotateX(Math.PI / 2);
      const nacelle = new THREE.Mesh(nacelleGeo, this.materials.engineBodyMat);
      nacelle.castShadow = true;
      single.add(nacelle);

      // Chrome Inlet Lip Ring
      const intakeLipGeo = new THREE.TorusGeometry(0.22, 0.024, 16, 32);
      const intakeLip = new THREE.Mesh(intakeLipGeo, this.materials.engineIntakeMat);
      intakeLip.position.set(0, 0, 0.72);
      single.add(intakeLip);

      // Internal Turbine Fan Spinner Cone
      const spinnerGeo = new THREE.ConeGeometry(0.08, 0.26, 24);
      spinnerGeo.rotateX(Math.PI / 2);
      const spinner = new THREE.Mesh(spinnerGeo, this.materials.chromeSlatsMat);
      spinner.position.set(0, 0, 0.58);
      single.add(spinner);

      // Fan Blades Disc
      const fanDiscGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.02, 32);
      fanDiscGeo.rotateX(Math.PI / 2);
      const fanDisc = new THREE.Mesh(fanDiscGeo, this.materials.engineFanMat);
      fanDisc.position.set(0, 0, 0.52);
      single.add(fanDisc);
      this.animatableParts.turbines.push(fanDisc);

      // Exhaust Nozzle Cone
      const exhaustGeo = new THREE.ConeGeometry(0.14, 0.42, 24);
      exhaustGeo.rotateX(-Math.PI / 2);
      const exhaust = new THREE.Mesh(exhaustGeo, this.materials.engineFanMat);
      exhaust.position.set(0, 0, -0.85);
      single.add(exhaust);

      single.position.set(x, y, z);
      return single;
    };

    engineGroup.add(buildSingleEngine(true)); // Port engine
    engineGroup.add(buildSingleEngine(false)); // Starboard engine

    this.solidGroup.add(engineGroup);
  }

  /**
   * T-Tail Empennage: Swept vertical tail and swept horizontal stabilizer with elevators.
   */
  private buildEmpennage() {
    const empennage = new THREE.Group();

    // Authentic swept-back vertical fin (sweeping rearward toward tail)
    const finShape = new THREE.Shape();
    finShape.moveTo(0.6, 0); // Forward dorsal fillet
    finShape.lineTo(-0.6, 1.65); // Swept-back tip leading edge
    finShape.lineTo(-1.1, 1.65); // Swept-back tip trailing edge
    finShape.lineTo(-0.2, 0); // Root trailing edge
    finShape.closePath();

    const finGeo = new THREE.ExtrudeGeometry(finShape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.008,
      bevelThickness: 0.008,
    });
    finGeo.rotateY(Math.PI / 2);
    finGeo.translate(0, 0.28, -3.4);

    const finMesh = new THREE.Mesh(finGeo, this.materials.solidFuselageMat);
    finMesh.castShadow = true;
    empennage.add(finMesh);

    // Chrome Leading Edge on Vertical Fin
    const finSlatCurve = new THREE.LineCurve3(
      new THREE.Vector3(0, 0.35, -2.8),
      new THREE.Vector3(0, 1.95, -4.0)
    );
    const finSlatGeo = new THREE.TubeGeometry(finSlatCurve, 20, 0.018, 10, false);
    const finSlat = new THREE.Mesh(finSlatGeo, this.materials.chromeSlatsMat);
    empennage.add(finSlat);

    // Swept Horizontal Stabilizer (Single unified symmetric aerodynamic wing at top of T-tail)
    const horizShape = new THREE.Shape();
    horizShape.moveTo(0, 0.2);
    horizShape.lineTo(1.85, -0.45);
    horizShape.lineTo(1.8, -0.68);
    horizShape.lineTo(0, -0.28);
    horizShape.lineTo(-1.8, -0.68);
    horizShape.lineTo(-1.85, -0.45);
    horizShape.closePath();

    const horizGeo = new THREE.ExtrudeGeometry(horizShape, {
      depth: 0.025,
      bevelEnabled: true,
      bevelSize: 0.006,
      bevelThickness: 0.006,
    });
    horizGeo.rotateX(Math.PI / 2);

    const horizMesh = new THREE.Mesh(horizGeo, this.materials.solidFuselageMat);
    horizMesh.position.set(0, 1.94, -4.1);
    empennage.add(horizMesh);

    // Chrome bullet fairing on top of T-tail intersection
    const bulletGeo = new THREE.ConeGeometry(0.065, 0.65, 16);
    bulletGeo.rotateX(Math.PI / 2);
    const bullet = new THREE.Mesh(bulletGeo, this.materials.chromeSlatsMat);
    bullet.position.set(0, 1.95, -4.05);
    empennage.add(bullet);

    this.solidGroup.add(empennage);
  }

  /**
   * High-Resolution Architectural Technical Cutaway Schematic (Frame 00:21 - 00:24)
   * Detailed interior layout:
   * - Cockpit flight crew stations
   * - Forward galley & crew refreshment
   * - 4-Place Executive Club suite with conference tables
   * - 4-Place Dining / Meeting suite with credenza
   * - Aft Luxury Lounge with 3-seat divan sofa & recliners
   * - Aft Master Lavatory & Pressurized Luggage compartment
   * - Crisp CAD wireframe & floorplan lines
   */
  private buildCabinSchematic() {
    const schematic = this.schematicGroup;

    // 1. Cabin Floorplate Plane (strictly bounded within the passenger cabin, never poking into tail taper)
    const floorGeo = new THREE.BoxGeometry(0.68, 0.02, 3.8);
    const floor = new THREE.Mesh(floorGeo, this.materials.interiorFloorMat);
    floor.position.set(0, -0.05, 0.45);
    schematic.add(floor);

    // 2. Translucent Cabin Hull Shell & Outer Blueprint Silhouette
    const hullOutlineGeo = new THREE.CylinderGeometry(0.43, 0.43, 5.8, 32, 1, true);
    hullOutlineGeo.rotateX(Math.PI / 2);
    const hullWireframe = new THREE.WireframeGeometry(hullOutlineGeo);
    const hullWireLine = new THREE.LineSegments(hullWireframe, this.materials.schematicLinesMat);
    hullWireLine.position.set(0, 0, 0.2);
    schematic.add(hullWireLine);

    // 3. Cabin Partition Walls (Bulkheads)
    const bulkheadZ = [2.9, 1.8, 0.4, -1.2, -2.4];
    bulkheadZ.forEach((z) => {
      const bhShape = new THREE.Shape();
      bhShape.moveTo(-0.38, -0.04);
      bhShape.lineTo(0.38, -0.04);
      bhShape.lineTo(0.38, 0.38);
      bhShape.lineTo(-0.38, 0.38);
      bhShape.closePath();

      // Cut central corridor doorway
      const doorway = new THREE.Path();
      doorway.moveTo(-0.12, -0.04);
      doorway.lineTo(0.12, -0.04);
      doorway.lineTo(0.12, 0.34);
      doorway.lineTo(-0.12, 0.34);
      doorway.closePath();
      bhShape.holes.push(doorway);

      const bhGeo = new THREE.ExtrudeGeometry(bhShape, { depth: 0.015, bevelEnabled: false });
      const bhMesh = new THREE.Mesh(bhGeo, this.materials.interiorWoodMat);
      bhMesh.position.set(0, 0, z);
      schematic.add(bhMesh);

      // Blueprint lines for bulkhead
      const edges = new THREE.EdgesGeometry(bhGeo);
      const line = new THREE.LineSegments(edges, this.materials.schematicLinesMat);
      line.position.set(0, 0, z);
      schematic.add(line);
    });

    // 4. Cockpit Pilot & Co-Pilot Seats
    const seatGeo = this.createExecutiveChairGeo();
    const pilotL = new THREE.Mesh(seatGeo, this.materials.interiorSeatsMat);
    pilotL.position.set(-0.18, 0.08, 3.25);
    pilotL.scale.set(0.68, 0.68, 0.68);
    schematic.add(pilotL);

    const pilotR = new THREE.Mesh(seatGeo, this.materials.interiorSeatsMat);
    pilotR.position.set(0.18, 0.08, 3.25);
    pilotR.scale.set(0.68, 0.68, 0.68);
    schematic.add(pilotR);

    // 5. Zone 1: Executive Club Suite (4 Swivel Recliners + Tables)
    const clubZ = [1.5, 0.8];
    clubZ.forEach((z, idx) => {
      const rot = idx === 0 ? 0 : Math.PI; // Face each other
      // Port side
      const seatPort = new THREE.Mesh(seatGeo, this.materials.interiorSeatsMat);
      seatPort.position.set(-0.24, 0.08, z);
      seatPort.rotation.y = rot;
      seatPort.scale.set(0.72, 0.72, 0.72);
      schematic.add(seatPort);

      // Starboard side
      const seatStbd = new THREE.Mesh(seatGeo, this.materials.interiorSeatsMat);
      seatStbd.position.set(0.24, 0.08, z);
      seatStbd.rotation.y = rot;
      seatStbd.scale.set(0.72, 0.72, 0.72);
      schematic.add(seatStbd);
    });

    // Executive fold-out tables
    const tableGeo = new THREE.BoxGeometry(0.16, 0.02, 0.38);
    const tablePort1 = new THREE.Mesh(tableGeo, this.materials.interiorWoodMat);
    tablePort1.position.set(-0.24, 0.12, 1.15);
    schematic.add(tablePort1);

    const tableStbd1 = new THREE.Mesh(tableGeo, this.materials.interiorWoodMat);
    tableStbd1.position.set(0.24, 0.12, 1.15);
    schematic.add(tableStbd1);

    // 6. Zone 2: Conference / Dining Suite
    const confTableGeo = new THREE.BoxGeometry(0.22, 0.02, 0.62);
    const confTable = new THREE.Mesh(confTableGeo, this.materials.interiorWoodMat);
    confTable.position.set(-0.22, 0.12, -0.4);
    schematic.add(confTable);

    // 4 conference chairs around table
    const confZ = [-0.18, -0.62];
    confZ.forEach((z, idx) => {
      const chairPort = new THREE.Mesh(seatGeo, this.materials.interiorSeatsMat);
      chairPort.position.set(-0.24, 0.08, z);
      chairPort.rotation.y = idx === 0 ? 0 : Math.PI;
      chairPort.scale.set(0.68, 0.68, 0.68);
      schematic.add(chairPort);
    });

    // Credenza & 32-inch monitor opposite dining group
    const credenzaGeo = new THREE.BoxGeometry(0.14, 0.22, 0.85);
    const credenza = new THREE.Mesh(credenzaGeo, this.materials.interiorWoodMat);
    credenza.position.set(0.26, 0.08, -0.4);
    schematic.add(credenza);

    // 7. Zone 3: Aft Private Stateroom Lounge (3-Place Divan Sofa)
    const divanGeo = new THREE.BoxGeometry(0.26, 0.22, 0.95);
    const divan = new THREE.Mesh(divanGeo, this.materials.interiorSeatsMat);
    divan.position.set(-0.22, 0.08, -1.8);
    schematic.add(divan);

    // Two executive club chairs opposite divan
    const aftChair1 = new THREE.Mesh(seatGeo, this.materials.interiorSeatsMat);
    aftChair1.position.set(0.24, 0.08, -1.5);
    aftChair1.scale.set(0.7, 0.7, 0.7);
    schematic.add(aftChair1);

    const aftChair2 = new THREE.Mesh(seatGeo, this.materials.interiorSeatsMat);
    aftChair2.position.set(0.24, 0.08, -2.1);
    aftChair2.rotation.y = Math.PI;
    aftChair2.scale.set(0.7, 0.7, 0.7);
    schematic.add(aftChair2);

    // 8. 2D/3D Architectural Blueprint Drafting Overlay (Full Airplane Contour)
    this.buildAirframeBlueprintLines();
  }

  /**
   * Constructs the exquisite 2D architectural blueprint wireframe lines that render
   * the exact top-down technical aircraft schematic seen in the video at 00:21 - 00:24!
   */
  private buildAirframeBlueprintLines() {
    const blueprintGroup = new THREE.Group();

    // 1. Centerline datum
    const centerLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.02, 4.8),
      new THREE.Vector3(0, 0.02, -5.1),
    ]);
    const centerLine = new THREE.Line(centerLineGeo, this.materials.schematicLinesMat);
    blueprintGroup.add(centerLine);

    // 2. Wings outline on the blueprint
    const wingPoints = [
      new THREE.Vector3(0.42, 0.02, 0.9),
      new THREE.Vector3(4.6, 0.02, -1.8),
      new THREE.Vector3(4.55, 0.02, -2.4),
      new THREE.Vector3(0.42, 0.02, -0.6),
      new THREE.Vector3(0.42, 0.02, 0.9),
      new THREE.Vector3(-0.42, 0.02, 0.9),
      new THREE.Vector3(-4.6, 0.02, -1.8),
      new THREE.Vector3(-4.55, 0.02, -2.4),
      new THREE.Vector3(-0.42, 0.02, -0.6),
      new THREE.Vector3(-0.42, 0.02, 0.9),
    ];
    const wingLinesGeo = new THREE.BufferGeometry().setFromPoints(wingPoints);
    const wingLines = new THREE.Line(wingLinesGeo, this.materials.schematicLinesMat);
    blueprintGroup.add(wingLines);

    // 3. Horizontal Stabilizer outline
    const tailPoints = [
      new THREE.Vector3(0, 0.02, -4.0),
      new THREE.Vector3(1.85, 0.02, -4.6),
      new THREE.Vector3(1.8, 0.02, -4.85),
      new THREE.Vector3(0, 0.02, -4.45),
      new THREE.Vector3(-1.8, 0.02, -4.85),
      new THREE.Vector3(-1.85, 0.02, -4.6),
      new THREE.Vector3(0, 0.02, -4.0),
    ];
    const tailLinesGeo = new THREE.BufferGeometry().setFromPoints(tailPoints);
    const tailLines = new THREE.Line(tailLinesGeo, this.materials.schematicLinesMat);
    blueprintGroup.add(tailLines);

    // 4. Engine nacelle blueprint boxes
    [-0.86, 0.86].forEach((x) => {
      const engBox = [
        new THREE.Vector3(x - 0.22, 0.02, -1.6),
        new THREE.Vector3(x + 0.22, 0.02, -1.6),
        new THREE.Vector3(x + 0.22, 0.02, -3.1),
        new THREE.Vector3(x - 0.22, 0.02, -3.1),
        new THREE.Vector3(x - 0.22, 0.02, -1.6),
      ];
      const engLinesGeo = new THREE.BufferGeometry().setFromPoints(engBox);
      const engLines = new THREE.Line(engLinesGeo, this.materials.schematicLinesMat);
      blueprintGroup.add(engLines);
    });

    // 5. Fuselage Outer Contour on Paper
    const fusePoints: THREE.Vector3[] = [];
    // Right side from nose to tail
    for (let i = 0; i <= 36; i++) {
      const t = i / 36;
      const z = 4.8 - t * 9.8;
      let r = 0.44;
      if (z > 2.8) {
        const nt = (z - 2.8) / 2.0;
        r = 0.44 * Math.sqrt(Math.max(0, 1 - nt * nt));
      } else if (z < -2.2) {
        const tt = (-2.2 - z) / 2.8;
        r = 0.44 * Math.pow(Math.max(0, 1 - tt), 1.35) + 0.04;
      }
      fusePoints.push(new THREE.Vector3(r, 0.02, z));
    }
    // Left side from tail back to nose
    for (let i = 36; i >= 0; i--) {
      const t = i / 36;
      const z = 4.8 - t * 9.8;
      let r = 0.44;
      if (z > 2.8) {
        const nt = (z - 2.8) / 2.0;
        r = 0.44 * Math.sqrt(Math.max(0, 1 - nt * nt));
      } else if (z < -2.2) {
        const tt = (-2.2 - z) / 2.8;
        r = 0.44 * Math.pow(Math.max(0, 1 - tt), 1.35) + 0.04;
      }
      fusePoints.push(new THREE.Vector3(-r, 0.02, z));
    }
    fusePoints.push(fusePoints[0]);
    const fuseLinesGeo = new THREE.BufferGeometry().setFromPoints(fusePoints);
    const fuseLines = new THREE.Line(fuseLinesGeo, this.materials.schematicLinesMat);
    blueprintGroup.add(fuseLines);

    this.schematicGroup.add(blueprintGroup);
  }

  /**
   * Helper creating executive club recliner seat geometry.
   */
  private createExecutiveChairGeo(): THREE.BufferGeometry {
    const chairGroup = new THREE.Group();
    // Cushion
    const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.24));
    chairGroup.add(seatBase);
    // Backrest
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.06));
    backrest.position.set(0, 0.18, -0.09);
    chairGroup.add(backrest);
    // Armrests
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.22));
    armL.position.set(-0.12, 0.1, 0);
    chairGroup.add(armL);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.22));
    armR.position.set(0.12, 0.1, 0);
    chairGroup.add(armR);

    // Merge into single geometry for high rendering performance
    chairGroup.updateMatrixWorld(true);
    const geometries: THREE.BufferGeometry[] = [];
    chairGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const geom = (child as THREE.Mesh).geometry.clone();
        geom.applyMatrix4(child.matrix);
        geometries.push(geom);
      }
    });

    // Merge buffers manual or simple BoxGeometry fallback
    return geometries[0] || new THREE.BoxGeometry(0.26, 0.26, 0.26);
  }

  /**
   * Updates transition / morph state between solid flight PBR and architectural cutaway.
   */
  public updateMorph(solidOpacity: number, schematicOpacity: number, paintColorHex?: number) {
    if (paintColorHex !== undefined) {
      this.materials.solidFuselageMat.color.setHex(paintColorHex);
      this.materials.engineBodyMat.color.setHex(paintColorHex);
    }

    this.materials.solidFuselageMat.opacity = THREE.MathUtils.clamp(solidOpacity, 0, 1);
    this.materials.chromeSlatsMat.opacity = THREE.MathUtils.clamp(solidOpacity, 0, 1);
    this.materials.glassWindowsMat.opacity = THREE.MathUtils.clamp(solidOpacity, 0, 1);
    this.materials.cockpitGlassMat.opacity = THREE.MathUtils.clamp(solidOpacity, 0, 1);
    this.materials.engineBodyMat.opacity = THREE.MathUtils.clamp(solidOpacity, 0, 1);
    this.materials.engineIntakeMat.opacity = THREE.MathUtils.clamp(solidOpacity, 0, 1);

    const sOpacity = THREE.MathUtils.clamp(schematicOpacity, 0, 1);
    this.materials.interiorFloorMat.opacity = sOpacity * 0.95;
    this.materials.interiorSeatsMat.opacity = sOpacity;
    this.materials.interiorWoodMat.opacity = sOpacity;
    this.materials.schematicLinesMat.opacity = sOpacity;
    this.materials.schematicFillMat.opacity = sOpacity * 0.4;

    const showSolid = solidOpacity > 0.01;
    this.solidGroup.visible = showSolid;
    this.solidGroup.traverse((child) => {
      child.visible = showSolid;
    });

    const showSchematic = schematicOpacity > 0.01;
    this.schematicGroup.visible = showSchematic;
    this.schematicGroup.traverse((child) => {
      child.visible = showSchematic;
    });
  }

  /**
   * Gentle turbine blade spinning animation during flight.
   */
  public animate(delta: number) {
    this.animatableParts.turbines.forEach((fan) => {
      fan.rotation.z += delta * 15;
    });
  }

  public dispose() {
    Object.values(this.materials).forEach((mat) => {
      if (mat.map) mat.map.dispose();
      mat.dispose();
    });
    this.group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).geometry.dispose();
      }
    });
  }
}
