/**
 * ============================================================================
 * DIAL ROOM EASE - 3D SKY-BLUE BEDROOM SCENE (THREE.JS)
 * ============================================================================
 * Features:
 * - Sky-blue aesthetic bedroom environment
 * - Detailed modern bed with headboard, pillows, and cozy duvet
 * - Beautiful crystal chandelier with warm glowing lights and gentle sway
 * - Multi-tier bookshelf with colorful books and indoor potted decor
 * - Smooth scroll-linked 3D camera transitions and parallax movement
 */

(function () {
  let scene, camera, renderer;
  let chandelierGroup, bedGroup, bookshelfGroup;
  let roomContainer;
  let crystals = [];
  let scrollProgress = 0;
  let targetCameraPos = { x: 0, y: 3.5, z: 9 };
  let targetCameraLook = { x: 0, y: 1.8, z: 0 };
  let currentCameraPos = { x: 0, y: 3.5, z: 9 };
  let currentCameraLook = { x: 0, y: 1.8, z: 0 };

  function init() {
    roomContainer = document.getElementById("bedroom-canvas-container");
    if (!roomContainer) return;

    // Check for Three.js
    if (typeof THREE === "undefined") {
      console.error("Three.js not loaded");
      return;
    }

    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8bcbf0); // Sky blue
    scene.fog = new THREE.FogExp2(0x8bcbf0, 0.028);

    // 2. Camera (responsive FOV for phone vs desktop)
    const isMobile = window.innerWidth < 768;
    camera = new THREE.PerspectiveCamera(
      isMobile ? 55 : 45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, isMobile ? 4.0 : 3.5, isMobile ? 10.5 : 9);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = !isMobile; // Enable soft shadows on desktop, optimize on mobile
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    roomContainer.appendChild(renderer.domElement);

    // 4. Lighting
    setupLighting();

    // 5. Room Architecture (Walls, Ceiling, Floor, Window)
    createRoomEnvironment();

    // 6. Detailed 3D Objects
    createBed();
    createChandelier();
    createBookshelf();
    createRoomAccessories();

    // 7. Event Listeners
    window.addEventListener("resize", onWindowResize);
    window.addEventListener("scroll", onScroll);

    // 8. Start Animation Loop
    animate();
  }

  function setupLighting() {
    // Ambient light - sky blue tint
    const ambientLight = new THREE.AmbientLight(0xdcf0ff, 0.95);
    scene.add(ambientLight);

    // Directional sunlight coming from window (left side)
    const sunLight = new THREE.DirectionalLight(0xfff7e6, 1.3);
    sunLight.position.set(-10, 8, 4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Soft sky-blue fill light
    const fillLight = new THREE.DirectionalLight(0x70c0f0, 0.7);
    fillLight.position.set(8, 6, 6);
    scene.add(fillLight);
  }

  function createRoomEnvironment() {
    // Room Dimensions
    const roomWidth = 16;
    const roomHeight = 9;
    const roomDepth = 14;

    // Materials
    // Sky Blue Wall Material with soft subtle sheen
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x8ac4eb,
      roughness: 0.65,
      metalness: 0.05
    });

    const accentWallMaterial = new THREE.MeshStandardMaterial({
      color: 0x6bb3e3,
      roughness: 0.6
    });

    // Floor - Warm luxury Scandinavian oak / light floor
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6e0d4,
      roughness: 0.35,
      metalness: 0.05
    });

    // Ceiling - Crisp clean off-white with sky tint
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4faff,
      roughness: 0.8
    });

    // Floor Mesh
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Plush Bedroom Rug under bed
    const rugMaterial = new THREE.MeshStandardMaterial({
      color: 0xcde8fa,
      roughness: 0.95
    });
    const rug = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.04, 6.8), rugMaterial);
    rug.position.set(0, 0.02, 0.2);
    rug.receiveShadow = true;
    scene.add(rug);

    // Ceiling Mesh
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    scene.add(ceiling);

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), accentWallMaterial);
    backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Right Wall (Where bookshelf sits)
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Left Wall with Window Cutout Frame
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    scene.add(leftWall);

    // Large Scenic Bedroom Window (Left)
    createWindow(-roomWidth / 2 + 0.05, 4.5, 0);

    // Baseboards / Decorative Moldings
    const moldingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const backBaseboard = new THREE.Mesh(new THREE.BoxGeometry(roomWidth, 0.25, 0.08), moldingMat);
    backBaseboard.position.set(0, 0.125, -roomDepth / 2 + 0.04);
    scene.add(backBaseboard);
  }

  function createWindow(x, y, z) {
    const windowGroup = new THREE.Group();
    windowGroup.position.set(x, y, z);
    windowGroup.rotation.y = Math.PI / 2;

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xd6f1ff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
      transmission: 0.85,
      thickness: 0.2
    });

    // Outer frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4.2, 0.15), frameMat);
    windowGroup.add(frame);

    // Glass pane
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.9), glassMat);
    glass.position.z = 0.02;
    windowGroup.add(glass);

    // Horizon sky vista outside window
    const skyTexturePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 7),
      new THREE.MeshBasicMaterial({ color: 0x9de0fd })
    );
    skyTexturePlane.position.z = -0.5;
    windowGroup.add(skyTexturePlane);

    // Soft white curtains
    const curtainMat = new THREE.MeshStandardMaterial({
      color: 0xf2f8fd,
      roughness: 0.85,
      side: THREE.DoubleSide
    });
    const leftCurtain = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.8, 0.1), curtainMat);
    leftCurtain.position.set(-2.4, -0.2, 0.15);
    windowGroup.add(leftCurtain);

    const rightCurtain = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.8, 0.1), curtainMat);
    rightCurtain.position.set(2.4, -0.2, 0.15);
    windowGroup.add(rightCurtain);

    scene.add(windowGroup);
  }

  // --------------------------------------------------------------------------
  // THE "REALLY GOOD BED"
  // --------------------------------------------------------------------------
  function createBed() {
    bedGroup = new THREE.Group();
    bedGroup.position.set(0, 0, -2.2);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.4 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.25 });
    
    // Sky blue upholstered headboard
    const headboardMat = new THREE.MeshStandardMaterial({
      color: 0x5faad6,
      roughness: 0.6,
      metalness: 0.1
    });

    // Plush White Mattress
    const mattressMat = new THREE.MeshStandardMaterial({
      color: 0xfdfdfd,
      roughness: 0.7
    });

    // Soft Sky Blue & White Duvet
    const duvetMat = new THREE.MeshStandardMaterial({
      color: 0x8ec8eb,
      roughness: 0.75
    });

    const throwBlanketMat = new THREE.MeshStandardMaterial({
      color: 0x3d7eab,
      roughness: 0.8
    });

    // 1. Bed Frame
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.4, 5.2), woodMat);
    bedFrame.position.set(0, 0.45, 0);
    bedFrame.castShadow = true;
    bedFrame.receiveShadow = true;
    bedGroup.add(bedFrame);

    // Bed Legs with gold tips
    const legGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.45, 16);
    const legPositions = [
      [-1.9, 0.225, -2.4],
      [1.9, 0.225, -2.4],
      [-1.9, 0.225, 2.4],
      [1.9, 0.225, 2.4]
    ];
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, brassMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      bedGroup.add(leg);
    });

    // 2. High Headboard with Tufted Cushion Panels
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.2, 0.35), headboardMat);
    headboard.position.set(0, 2.0, -2.55);
    headboard.castShadow = true;
    bedGroup.add(headboard);

    // Headboard golden decorative trim
    const trim = new THREE.Mesh(new THREE.BoxGeometry(4.48, 0.08, 0.38), brassMat);
    trim.position.set(0, 3.6, -2.55);
    bedGroup.add(trim);

    // 3. Mattress
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.65, 4.9), mattressMat);
    mattress.position.set(0, 0.95, 0.05);
    mattress.castShadow = true;
    mattress.receiveShadow = true;
    bedGroup.add(mattress);

    // 4. Duvet / Quilt (covers majority of bed)
    const duvet = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.3, 3.6), duvetMat);
    duvet.position.set(0, 1.35, 0.65);
    duvet.castShadow = true;
    bedGroup.add(duvet);

    // Folded top sheet edge
    const sheetFold = new THREE.Mesh(new THREE.BoxGeometry(4.08, 0.12, 0.5), mattressMat);
    sheetFold.position.set(0, 1.38, -1.2);
    bedGroup.add(sheetFold);

    // Throw Blanket across foot of bed
    const throwBlanket = new THREE.Mesh(new THREE.BoxGeometry(4.16, 0.08, 1.4), throwBlanketMat);
    throwBlanket.position.set(0, 1.52, 1.6);
    bedGroup.add(throwBlanket);

    // 5. Plush Sleeping Pillows
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const pillowGeo = new THREE.BoxGeometry(1.4, 0.28, 0.9);

    // Back Main Pillows
    const pillowL = new THREE.Mesh(pillowGeo, pillowMat);
    pillowL.position.set(-1.1, 1.45, -1.75);
    pillowL.rotation.x = 0.25;
    pillowL.castShadow = true;
    bedGroup.add(pillowL);

    const pillowR = new THREE.Mesh(pillowGeo, pillowMat);
    pillowR.position.set(1.1, 1.45, -1.75);
    pillowR.rotation.x = 0.25;
    pillowR.castShadow = true;
    bedGroup.add(pillowR);

    // Front Accent Pillows (Sky Blue & Navy)
    const accentPillowMat1 = new THREE.MeshStandardMaterial({ color: 0x4aa1d4, roughness: 0.7 });
    const accentPillowMat2 = new THREE.MeshStandardMaterial({ color: 0x224870, roughness: 0.7 });

    const accentL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.6), accentPillowMat1);
    accentL.position.set(-0.9, 1.55, -1.4);
    accentL.rotation.x = 0.35;
    bedGroup.add(accentL);

    const accentR = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.6), accentPillowMat2);
    accentR.position.set(0.9, 1.55, -1.4);
    accentR.rotation.x = 0.35;
    bedGroup.add(accentR);

    // 6. Modern Bedside Tables
    createNightstand(-2.85, 0.6, -2.4);
    createNightstand(2.85, 0.6, -2.4);

    scene.add(bedGroup);
  }

  function createNightstand(x, y, z) {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(x, y, z);

    const tableMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.2 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.0), tableMat);
    body.position.y = 0;
    body.castShadow = true;
    tableGroup.add(body);

    // Handle
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25), brassMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 0.1, 0.52);
    tableGroup.add(handle);

    // Designer Lamp
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.08), brassMat);
    lampBase.position.set(0, 0.49, 0);
    tableGroup.add(lampBase);

    const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55), brassMat);
    lampPole.position.set(0, 0.75, 0);
    tableGroup.add(lampPole);

    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xebf6ff,
      roughness: 0.4,
      emissive: 0x90ccf0,
      emissiveIntensity: 0.35
    });
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 0.42, 24), shadeMat);
    shade.position.set(0, 1.1, 0);
    tableGroup.add(shade);

    // Soft warm nightstand glow
    const nightLight = new THREE.PointLight(0xfff3da, 0.65, 3.5);
    nightLight.position.set(0, 1.15, 0);
    tableGroup.add(nightLight);

    bedGroup.add(tableGroup);
  }

  // --------------------------------------------------------------------------
  // THE "BEAUTIFUL CHANDELIER"
  // --------------------------------------------------------------------------
  function createChandelier() {
    chandelierGroup = new THREE.Group();
    // Centered above the bedroom
    chandelierGroup.position.set(0, 7.8, -0.5);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xdeb841,
      metalness: 0.88,
      roughness: 0.18
    });

    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xf2faff,
      metalness: 0.05,
      roughness: 0.04,
      transmission: 0.92,
      thickness: 0.4,
      reflectivity: 0.95,
      transparent: true,
      opacity: 0.92
    });

    // 1. Ceiling Canopy
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.25, 24), goldMat);
    canopy.position.y = 0.9;
    chandelierGroup.add(canopy);

    // 2. Hanging Chain / Central Rod
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.2, 16), goldMat);
    rod.position.y = 0.3;
    chandelierGroup.add(rod);

    // 3. Central Ornate Sphere
    const centerBall = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 24), goldMat);
    centerBall.position.y = -0.35;
    chandelierGroup.add(centerBall);

    // 4. Concentric Crystal Rings & Curved Arms
    const tiers = [
      { radius: 1.3, count: 8, yOffset: -0.5, armLength: 1.2 },
      { radius: 0.8, count: 6, yOffset: -0.8, armLength: 0.75 }
    ];

    tiers.forEach((tier) => {
      // Golden Ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(tier.radius, 0.04, 16, 48),
        goldMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = tier.yOffset;
      chandelierGroup.add(ring);

      // Radiating Curved Arms & Lights
      for (let i = 0; i < tier.count; i++) {
        const angle = (i / tier.count) * Math.PI * 2;
        const armX = Math.cos(angle) * tier.radius;
        const armZ = Math.sin(angle) * tier.radius;

        // Candle / Light Cup
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.15, 16), goldMat);
        cup.position.set(armX, tier.yOffset + 0.1, armZ);
        chandelierGroup.add(cup);

        // Glowing Candle Bulb
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff9e6 });
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), bulbMat);
        bulb.position.set(armX, tier.yOffset + 0.24, armZ);
        chandelierGroup.add(bulb);

        // Hanging Crystal Droplets
        const crystalGeo = new THREE.ConeGeometry(0.065, 0.32, 6);
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.rotation.x = Math.PI; // Pointing down
        crystal.position.set(armX, tier.yOffset - 0.18, armZ);
        chandelierGroup.add(crystal);
        crystals.push(crystal);

        // Intermediate accent crystals along perimeter
        const midAngle = angle + (Math.PI / tier.count);
        const midX = Math.cos(midAngle) * tier.radius;
        const midZ = Math.sin(midAngle) * tier.radius;
        const smallCrystal = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 6), crystalMat);
        smallCrystal.rotation.x = Math.PI;
        smallCrystal.position.set(midX, tier.yOffset - 0.12, midZ);
        chandelierGroup.add(smallCrystal);
        crystals.push(smallCrystal);
      }
    });

    // Bottom Center Finial Crystal
    const centerCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 1), crystalMat);
    centerCrystal.position.set(0, -1.2, 0);
    chandelierGroup.add(centerCrystal);
    crystals.push(centerCrystal);

    // Warm Radiant Chandelier Point Light
    const chandelierLight = new THREE.PointLight(0xffe8b3, 2.0, 14, 1.2);
    chandelierLight.position.set(0, -0.4, 0);
    chandelierLight.castShadow = true;
    chandelierLight.shadow.bias = -0.002;
    chandelierGroup.add(chandelierLight);

    // Secondary Soft Sky-tint Light to illuminate the ceiling above chandelier
    const ceilingWashLight = new THREE.PointLight(0xbadfff, 0.8, 8);
    ceilingWashLight.position.set(0, 0.6, 0);
    chandelierGroup.add(ceilingWashLight);

    scene.add(chandelierGroup);
  }

  // --------------------------------------------------------------------------
  // THE "BOOKSHELF"
  // --------------------------------------------------------------------------
  function createBookshelf() {
    bookshelfGroup = new THREE.Group();
    // Positioned against the right wall
    bookshelfGroup.position.set(7.1, 0, 0.5);
    bookshelfGroup.rotation.y = -Math.PI / 2;

    const shelfWidth = 4.2;
    const shelfHeight = 6.2;
    const shelfDepth = 0.8;
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x243b53, // Elegant dark slate navy to contrast with sky blue
      roughness: 0.5
    });
    const shelfBoardMat = new THREE.MeshStandardMaterial({
      color: 0x334e68,
      roughness: 0.4
    });

    // 1. Back panel
    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(shelfWidth, shelfHeight, 0.05), woodMat);
    backPanel.position.set(0, shelfHeight / 2, -shelfDepth / 2 + 0.025);
    backPanel.castShadow = true;
    bookshelfGroup.add(backPanel);

    // 2. Vertical Side Panels
    const sideGeo = new THREE.BoxGeometry(0.08, shelfHeight, shelfDepth);
    const leftSide = new THREE.Mesh(sideGeo, woodMat);
    leftSide.position.set(-shelfWidth / 2 + 0.04, shelfHeight / 2, 0);
    bookshelfGroup.add(leftSide);

    const rightSide = new THREE.Mesh(sideGeo, woodMat);
    rightSide.position.set(shelfWidth / 2 - 0.04, shelfHeight / 2, 0);
    bookshelfGroup.add(rightSide);

    // 3. Horizontal Shelves (5 tiers)
    const shelfLevels = [0.1, 1.3, 2.5, 3.7, 4.9, 6.1];
    const shelfGeo = new THREE.BoxGeometry(shelfWidth - 0.16, 0.08, shelfDepth);

    shelfLevels.forEach(y => {
      const shelf = new THREE.Mesh(shelfGeo, shelfBoardMat);
      shelf.position.set(0, y, 0);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      bookshelfGroup.add(shelf);
    });

    // 4. Fill Shelves with 3D Books and Decor
    const bookColors = [
      0x0284c7, // Sky Blue
      0x38bdf8, // Light Cyan
      0x1e3a8a, // Navy
      0xd97706, // Amber
      0x059669, // Emerald
      0xdc2626, // Crimson
      0xf1f5f9, // Off white
      0x64748b  // Slate
    ];

    // Populate shelf tiers
    // Shelf 2 (y=1.3): Row of standing books
    let currentX = -1.7;
    for (let i = 0; i < 18; i++) {
      const bWidth = 0.08 + Math.sin(i * 3) * 0.03;
      const bHeight = 0.75 + Math.cos(i * 2) * 0.18;
      const bDepth = 0.55;
      const color = bookColors[i % bookColors.length];

      const bookMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6 });
      const book = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), bookMat);
      book.position.set(currentX + bWidth / 2, 1.38 + bHeight / 2, 0.05);
      book.castShadow = true;
      bookshelfGroup.add(book);

      currentX += bWidth + 0.02;
    }

    // Shelf 3 (y=2.5): Tilted books and indoor potted plant
    currentX = -1.6;
    for (let i = 0; i < 9; i++) {
      const bWidth = 0.09;
      const bHeight = 0.85;
      const bDepth = 0.55;
      const color = bookColors[(i + 3) % bookColors.length];

      const bookMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6 });
      const book = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), bookMat);
      book.position.set(currentX, 2.58 + bHeight / 2, 0.05);
      // Lean the last book
      if (i === 8) {
        book.rotation.z = -0.25;
        book.position.x += 0.06;
      }
      bookshelfGroup.add(book);
      currentX += bWidth + 0.03;
    }

    // Potted Succulent Plant on Shelf 3
    const plantGroup = createPottedPlant();
    plantGroup.position.set(1.1, 2.58, 0);
    bookshelfGroup.add(plantGroup);

    // Shelf 4 (y=3.7): Stack of horizontal books + decorative vase
    for (let i = 0; i < 5; i++) {
      const bMat = new THREE.MeshStandardMaterial({ color: bookColors[(i + 5) % bookColors.length] });
      const horizBook = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.55), bMat);
      horizBook.position.set(-1.1, 3.78 + (i * 0.09) + 0.04, 0);
      bookshelfGroup.add(horizBook);
    }

    // Modern Ceramic Vase
    const vaseMat = new THREE.MeshStandardMaterial({
      color: 0x99d5f7,
      roughness: 0.15,
      metalness: 0.1
    });
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.65, 24), vaseMat);
    vase.position.set(0.7, 4.12, 0);
    bookshelfGroup.add(vase);

    scene.add(bookshelfGroup);
  }

  function createPottedPlant() {
    const group = new THREE.Group();

    // Pot
    const potMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.35, 20), potMat);
    pot.position.y = 0.175;
    group.add(pot);

    // Soil
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 20), soilMat);
    soil.position.y = 0.34;
    group.add(soil);

    // Leaves
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d8a4e, roughness: 0.5 });
    for (let i = 0; i < 7; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), leafMat);
      leaf.scale.set(0.6, 1.4, 0.3);
      const angle = (i / 7) * Math.PI * 2;
      leaf.position.set(Math.cos(angle) * 0.12, 0.48 + Math.random() * 0.1, Math.sin(angle) * 0.12);
      leaf.rotation.z = Math.cos(angle) * 0.4;
      leaf.rotation.x = Math.sin(angle) * 0.4;
      group.add(leaf);
    }

    return group;
  }

  function createRoomAccessories() {
    // Subtle ambient dust/sparkles floating gently in the sky blue air
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 14;
      particlePositions[i + 1] = Math.random() * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 12;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
  }

  // --------------------------------------------------------------------------
  // SCROLL-LINKED CAMERA TRANSITIONS
  // --------------------------------------------------------------------------
  function onScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;

    // Smooth waypoints based on page scroll
    // 0.0 = Top (Auth / Overview): High panoramic angle showcasing bed & chandelier
    // 0.5 = Section 1 (Map Section): Elevated angle, looking towards bed & map overlay
    // 1.0 = Section 2 (Listings / Add Room): Angled closer view of cozy room & bookshelf
    if (scrollProgress < 0.5) {
      const t = scrollProgress / 0.5;
      targetCameraPos.x = THREE.MathUtils.lerp(0, -1.8, t);
      targetCameraPos.y = THREE.MathUtils.lerp(3.6, 4.2, t);
      targetCameraPos.z = THREE.MathUtils.lerp(9.2, 7.8, t);

      targetCameraLook.x = THREE.MathUtils.lerp(0, 0.4, t);
      targetCameraLook.y = THREE.MathUtils.lerp(1.8, 1.6, t);
      targetCameraLook.z = THREE.MathUtils.lerp(0, -1.0, t);
    } else {
      const t = (scrollProgress - 0.5) / 0.5;
      targetCameraPos.x = THREE.MathUtils.lerp(-1.8, 2.4, t);
      targetCameraPos.y = THREE.MathUtils.lerp(4.2, 3.2, t);
      targetCameraPos.z = THREE.MathUtils.lerp(7.8, 6.5, t);

      targetCameraLook.x = THREE.MathUtils.lerp(0.4, 3.2, t);
      targetCameraLook.y = THREE.MathUtils.lerp(1.6, 2.2, t);
      targetCameraLook.z = THREE.MathUtils.lerp(-1.0, 0.5, t);
    }
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
    const isMobile = window.innerWidth < 768;
    camera.fov = isMobile ? 55 : 45;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  }

  // --------------------------------------------------------------------------
  // ANIMATION LOOP
  // --------------------------------------------------------------------------
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Gentle Chandelier sway & crystal twinkle
    if (chandelierGroup) {
      chandelierGroup.rotation.y = Math.sin(elapsedTime * 0.4) * 0.035;
      chandelierGroup.rotation.z = Math.cos(elapsedTime * 0.3) * 0.015;
    }

    // Twinkle crystal materials
    crystals.forEach((c, idx) => {
      c.rotation.y = Math.sin(elapsedTime * 1.5 + idx) * 0.1;
    });

    // Smooth camera damping interpolation
    currentCameraPos.x += (targetCameraPos.x - currentCameraPos.x) * 0.05;
    currentCameraPos.y += (targetCameraPos.y - currentCameraPos.y) * 0.05;
    currentCameraPos.z += (targetCameraPos.z - currentCameraPos.z) * 0.05;

    currentCameraLook.x += (targetCameraLook.x - currentCameraLook.x) * 0.05;
    currentCameraLook.y += (targetCameraLook.y - currentCameraLook.y) * 0.05;
    currentCameraLook.z += (targetCameraLook.z - currentCameraLook.z) * 0.05;

    camera.position.set(currentCameraPos.x, currentCameraPos.y, currentCameraPos.z);
    camera.lookAt(currentCameraLook.x, currentCameraLook.y, currentCameraLook.z);

    renderer.render(scene, camera);
  }

  // Auto initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

