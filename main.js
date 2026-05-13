import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";

const TILE = 16;
const WORLD_W = 16;
const WORLD_H = 8;
const WORLD_D = 16;
const REACH = 8;
const PLAYER_HEIGHT = 1.7;
const EYE_HEIGHT = 1.55;
const MOVE_SPEED = 4.8;
const JUMP_SPEED = 6.2;
const GRAVITY = 18;
const LOOK_SENSITIVITY = 0.0032;

const app = {
  scene: null,
  camera: null,
  renderer: null,
  atlas: null,
  worldGroup: null,
  blockMeshes: new Map(),
  blocks: new Map(),
  selectedBlockId: "cobblestone",
  running: false,
  yaw: 0,
  pitch: -0.35,
  velocity: new THREE.Vector3(),
  playerPos: new THREE.Vector3(8, 3.5, 12),
  onGround: false,
  touchMoveState: {
    forward: false,
    back: false,
    left: false,
    right: false,
  },
  touchLookState: {
    active: false,
    x: 0,
    y: 0,
  },
  reactorActive: false,
  reactorTimers: [],
  highlight: null,
  raycaster: new THREE.Raycaster(),
};

const BLOCKS = {
  air: {
    solid: false,
    placeable: false,
  },

  grass: {
    solid: true,
    placeable: true,
    faces: {
      top: [3, 3],
      bottom: [2, 0],
      side: [3, 0],
    },
  },

  cobblestone: {
    solid: true,
    placeable: true,
    faces: {
      all: [0, 0],
    },
  },

  planks: {
    solid: true,
    placeable: true,
    faces: {
      all: [12, 1],
    },
  },

  reactor_core: {
    solid: true,
    placeable: true,
    emissive: 0x7a3cff,
    faces: {
      all: [7, 4],
    },
  },

  gold: {
    solid: true,
    placeable: true,
    faces: {
      all: [1, 4],
    },
  },

  obsidian: {
    solid: true,
    placeable: true,
    faces: {
      all: [2, 13],
    },
  },

  glowing_obsidian: {
    solid: true,
    placeable: true,
    emissive: 0xa24dff,
    faces: {
      all: [7, 13],
    },
  },

  netherrack: {
    solid: true,
    placeable: true,
    faces: {
      all: [7, 15],
    },
  },

  quartz: {
    solid: true,
    placeable: true,
    faces: {
      all: [4, 13],
    },
  },

  pumpkin: {
    solid: true,
    placeable: true,
    faces: {
      top: [9, 6],
      bottom: [9, 6],
      side: [8, 6],
      front: [8, 6],
    },
  },

  lava: {
    solid: false,
    placeable: true,
    transparent: true,
    emissive: 0xff7a00,
    faces: {
      all: [15, 15],
    },
  },
};

const HOTBAR = [
  "cobblestone",
  "gold",
  "obsidian",
  "reactor_core",
  "glowing_obsidian",
  "netherrack",
  "quartz",
  "planks",
  "pumpkin",
  "lava",
];

const FACE_ORDER = ["right", "left", "top", "bottom", "front", "back"];

const titleScreen = document.getElementById("titleScreen");
const startBtn = document.getElementById("startBtn");
const hud = document.getElementById("hud");
const canvas = document.getElementById("game");
const hotbarEl = document.getElementById("hotbar");
const messageEl = document.getElementById("message");
const activateBtn = document.getElementById("activateBtn");
const placeBtn = document.getElementById("placeBtn");
const breakBtn = document.getElementById("breakBtn");
const jumpBtn = document.getElementById("jumpBtn");
const lookPad = document.getElementById("lookPad");

startBtn.addEventListener("click", init);

async function init() {
  startBtn.disabled = true;
  showMessage("Loading textures...");
  await setupThree();
  buildHotbar();
  buildWorld();
  buildHighlight();
  bindControls();

  titleScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  app.running = true;
  showMessage("Build a Nether Reactor and press Activate.");
  animate();
}

async function setupThree() {
  app.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
  });
  app.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  app.renderer.setSize(window.innerWidth, window.innerHeight);
  app.renderer.outputColorSpace = THREE.SRGBColorSpace;

  app.scene = new THREE.Scene();
  app.scene.background = new THREE.Color(0x8cc7ff);
  app.scene.fog = new THREE.Fog(0x8cc7ff, 20, 48);

  app.camera = new THREE.PerspectiveCamera(
    72,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  const ambient = new THREE.AmbientLight(0xffffff, 1.0);
  app.scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(1, 2.2, 0.8);
  app.scene.add(sun);

  app.worldGroup = new THREE.Group();
  app.scene.add(app.worldGroup);

  const loader = new THREE.TextureLoader();
  app.atlas = await loader.loadAsync("assets/terrain.png");
  app.atlas.magFilter = THREE.NearestFilter;
  app.atlas.minFilter = THREE.NearestFilter;
  app.atlas.generateMipmaps = false;
  app.atlas.colorSpace = THREE.SRGBColorSpace;
  app.atlas.wrapS = THREE.ClampToEdgeWrapping;
  app.atlas.wrapT = THREE.ClampToEdgeWrapping;

  window.addEventListener("resize", onResize);
}

function buildHotbar() {
  hotbarEl.innerHTML = "";

  HOTBAR.forEach((blockId) => {
    const slot = document.createElement("button");
    slot.className = "slot" + (blockId === app.selectedBlockId ? " selected" : "");
    slot.dataset.block = blockId;

    const icon = document.createElement("canvas");
    icon.width = 16;
    icon.height = 16;
    drawTileToCanvas(icon, getFaceTile(blockId, "front"));

    slot.appendChild(icon);
    slot.addEventListener("click", () => {
      app.selectedBlockId = blockId;
      document.querySelectorAll(".slot").forEach((el) => el.classList.remove("selected"));
      slot.classList.add("selected");
      showMessage(`Selected: ${blockId.replaceAll("_", " ")}`);
    });

    hotbarEl.appendChild(slot);
  });

  showMessage(`Selected: ${app.selectedBlockId.replaceAll("_", " ")}`);
}

function drawTileToCanvas(canvasEl, [tx, ty]) {
  const ctx = canvasEl.getContext("2d");
  const img = app.atlas.image;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  ctx.drawImage(
    img,
    tx * TILE,
    ty * TILE,
    TILE,
    TILE,
    0,
    0,
    canvasEl.width,
    canvasEl.height
  );
}

function getFaceTile(blockId, face) {
  const def = BLOCKS[blockId];
  if (!def || !def.faces) return [0, 0];

  return def.faces[face] || def.faces.side || def.faces.all || [0, 0];
}

function buildWorld() {
  for (let x = 0; x < WORLD_W; x++) {
    for (let z = 0; z < WORLD_D; z++) {
      setBlock(x, 0, z, "grass");

      if (
        (x === 0 || z === 0 || x === WORLD_W - 1 || z === WORLD_D - 1) &&
        Math.random() < 0.2
      ) {
        setBlock(x, 1, z, "cobblestone");
      }
    }
  }

  const x = 8;
  const y = 1;
  const z = 8;

  setBlock(x, y, z, "reactor_core");
  setBlock(x - 1, y, z, "gold");
  setBlock(x + 1, y, z, "gold");
  setBlock(x, y, z - 1, "gold");
  setBlock(x, y, z + 1, "gold");
  setBlock(x, y + 1, z, "cobblestone");
}

function buildHighlight() {
  const geo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.45,
  });
  app.highlight = new THREE.Mesh(geo, mat);
  app.highlight.visible = false;
  app.scene.add(app.highlight);
}

function key(x, y, z) {
  return `${x},${y},${z}`;
}

function getBlock(x, y, z) {
  return app.blocks.get(key(x, y, z)) || "air";
}

function setBlock(x, y, z, blockId) {
  if (x < 0 || z < 0 || y < 0 || x >= WORLD_W || z >= WORLD_D || y >= WORLD_H) {
    return;
  }

  const k = key(x, y, z);
  const prev = app.blocks.get(k) || "air";
  if (prev === blockId) return;

  const existing = app.blockMeshes.get(k);
  if (existing) {
    app.worldGroup.remove(existing);
    disposeMesh(existing);
    app.blockMeshes.delete(k);
  }

  if (blockId === "air") {
    app.blocks.delete(k);
    return;
  }

  app.blocks.set(k, blockId);

  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mats = makeFaceMaterials(blockId);
  const mesh = new THREE.Mesh(geo, mats);
  mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
  mesh.userData = { x, y, z, blockId };

  app.worldGroup.add(mesh);
  app.blockMeshes.set(k, mesh);
}

function disposeMesh(mesh) {
  mesh.geometry?.dispose?.();

  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((m) => {
      m.map?.dispose?.();
      m.dispose?.();
    });
  } else {
    mesh.material?.map?.dispose?.();
    mesh.material?.dispose?.();
  }
}

function makeFaceMaterials(blockId) {
  const def = BLOCKS[blockId];

  return FACE_ORDER.map((faceName) => {
    const blockFace = faceToBlockFace(faceName);
    const tile = getFaceTile(blockId, blockFace);
    const tex = makeTileTexture(tile[0], tile[1]);

    return new THREE.MeshLambertMaterial({
      map: tex,
      transparent: !!def.transparent,
      emissive: new THREE.Color(def.emissive || 0x000000),
    });
  });
}

function faceToBlockFace(face) {
  if (face === "top") return "top";
  if (face === "bottom") return "bottom";
  if (face === "front") return "front";
  if (face === "back") return "back";
  if (face === "left") return "left";
  if (face === "right") return "right";
  return "side";
}

function makeTileTexture(tileX, tileY) {
  const tex = app.atlas.clone();
  tex.needsUpdate = true;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;

  const img = app.atlas.image;
  const texW = img.width;
  const texH = img.height;

  const inset = 0.01;
  const u0 = (tileX * TILE + inset) / texW;
  const vTop = (tileY * TILE + inset) / texH;
  const u1 = ((tileX + 1) * TILE - inset) / texW;
  const vBottom = ((tileY + 1) * TILE - inset) / texH;

  tex.repeat.set(u1 - u0, vBottom - vTop);
  tex.offset.set(u0, 1 - vBottom);

  return tex;
}

function bindControls() {
  document.querySelectorAll(".move").forEach((btn) => {
    const act = btn.dataset.act;

    const down = (e) => {
      e.preventDefault();
      app.touchMoveState[act] = true;
      btn.classList.add("active");
    };

    const up = (e) => {
      e.preventDefault();
      app.touchMoveState[act] = false;
      btn.classList.remove("active");
    };

    btn.addEventListener("pointerdown", down);
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("pointerleave", up);
  });

  jumpBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (app.onGround) {
      app.velocity.y = JUMP_SPEED;
      app.onGround = false;
    }
  });

  placeBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    placeSelectedBlock();
  });

  breakBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    breakTargetBlock();
  });

  activateBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    tryActivateReactor();
  });

  lookPad.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    app.touchLookState.active = true;
    app.touchLookState.x = e.clientX;
    app.touchLookState.y = e.clientY;
  });

  lookPad.addEventListener("pointermove", (e) => {
    if (!app.touchLookState.active) return;
    e.preventDefault();

    const dx = e.clientX - app.touchLookState.x;
    const dy = e.clientY - app.touchLookState.y;
    app.touchLookState.x = e.clientX;
    app.touchLookState.y = e.clientY;

    app.yaw -= dx * LOOK_SENSITIVITY;
    app.pitch -= dy * LOOK_SENSITIVITY;
    app.pitch = Math.max(-1.45, Math.min(1.45, app.pitch));
  });

  const stopLook = (e) => {
    e.preventDefault();
    app.touchLookState.active = false;
  };

  lookPad.addEventListener("pointerup", stopLook);
  lookPad.addEventListener("pointercancel", stopLook);
  lookPad.addEventListener("pointerleave", stopLook);

  canvas.addEventListener("pointerdown", (e) => e.preventDefault());
}

function updateCamera() {
  app.camera.position.set(
    app.playerPos.x,
    app.playerPos.y + (EYE_HEIGHT - PLAYER_HEIGHT / 2),
    app.playerPos.z
  );

  const dir = getLookDirection();
  app.camera.lookAt(app.camera.position.clone().add(dir));
}

function getLookDirection() {
  return new THREE.Vector3(
    Math.sin(app.yaw) * Math.cos(app.pitch),
    Math.sin(app.pitch),
    Math.cos(app.yaw) * Math.cos(app.pitch)
  ).normalize();
}

function getForwardVector() {
  return new THREE.Vector3(Math.sin(app.yaw), 0, Math.cos(app.yaw)).normalize();
}

function getRightVector() {
  const f = getForwardVector();
  return new THREE.Vector3(f.z, 0, -f.x).normalize();
}

function playerCollides(pos) {
  const radius = 0.28;
  const minX = Math.floor(pos.x - radius);
  const maxX = Math.floor(pos.x + radius);
  const minY = Math.floor(pos.y - PLAYER_HEIGHT / 2);
  const maxY = Math.floor(pos.y + PLAYER_HEIGHT / 2 - 0.01);
  const minZ = Math.floor(pos.z - radius);
  const maxZ = Math.floor(pos.z + radius);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        const b = getBlock(x, y, z);
        if (BLOCKS[b]?.solid) return true;
      }
    }
  }

  return false;
}

function movePlayer(dt) {
  const input = new THREE.Vector3();

  if (app.touchMoveState.forward) input.add(getForwardVector());
  if (app.touchMoveState.back) input.sub(getForwardVector());
  if (app.touchMoveState.right) input.add(getRightVector());
  if (app.touchMoveState.left) input.sub(getRightVector());

  if (input.lengthSq() > 0) {
    input.normalize().multiplyScalar(MOVE_SPEED * dt);
  }

  app.velocity.y -= GRAVITY * dt;

  const next = app.playerPos.clone();

  next.x += input.x;
  if (!playerCollides(next)) app.playerPos.x = next.x;

  next.copy(app.playerPos);
  next.z += input.z;
  if (!playerCollides(next)) app.playerPos.z = next.z;

  next.copy(app.playerPos);
  next.y += app.velocity.y * dt;
  if (!playerCollides(next)) {
    app.playerPos.y = next.y;
    app.onGround = false;
  } else {
    if (app.velocity.y <= 0) app.onGround = true;
    app.velocity.y = 0;
  }

  if (app.playerPos.y < 2.4) {
    app.playerPos.y = 2.4;
    app.onGround = true;
    app.velocity.y = 0;
  }
}

function raycastBlocks() {
  app.raycaster.set(app.camera.position, getLookDirection());
  app.raycaster.far = REACH;
  const meshes = [...app.blockMeshes.values()];
  const hits = app.raycaster.intersectObjects(meshes, false);
  return hits[0] || null;
}

function updateHighlight() {
  const hit = raycastBlocks();

  if (!hit) {
    app.highlight.visible = false;
    return;
  }

  app.highlight.visible = true;
  app.highlight.position.copy(hit.object.position);
}

function breakTargetBlock() {
  const hit = raycastBlocks();
  if (!hit) return;

  const { x, y, z, blockId } = hit.object.userData;
  if (blockId === "air") return;

  setBlock(x, y, z, "air");
}

function placeSelectedBlock() {
  const hit = raycastBlocks();
  if (!hit) return;

  const normal = hit.face.normal.clone();
  normal
    .applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld))
    .round();

  const base = hit.object.userData;
  const x = base.x + normal.x;
  const y = base.y + normal.y;
  const z = base.z + normal.z;

  if (getBlock(x, y, z) !== "air") return;

  const center = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
  const dx = Math.abs(app.playerPos.x - center.x);
  const dy = Math.abs(app.playerPos.y - center.y);
  const dz = Math.abs(app.playerPos.z - center.z);

  if (dx < 0.8 && dy < 1.5 && dz < 0.8) return;

  setBlock(x, y, z, app.selectedBlockId);
}

function tryActivateReactor() {
  const hit = raycastBlocks();

  if (!hit) {
    showMessage("Look at a reactor core first.");
    return;
  }

  const { x, y, z, blockId } = hit.object.userData;

  if (blockId !== "reactor_core") {
    showMessage("That is not a reactor core.");
    return;
  }

  if (app.reactorActive) {
    showMessage("Reactor already active.");
    return;
  }

  const ok =
    getBlock(x - 1, y, z) === "gold" &&
    getBlock(x + 1, y, z) === "gold" &&
    getBlock(x, y, z - 1) === "gold" &&
    getBlock(x, y, z + 1) === "gold" &&
    getBlock(x, y + 1, z) !== "air";

  if (!ok) {
    showMessage("Structure invalid. Surround core with gold and cap it.");
    return;
  }

  app.reactorActive = true;
  showMessage("Nether Reactor activated!");

  pulseBlock(x, y, z, 8, 120);

  const ring = [
    [x - 2, y, z],
    [x + 2, y, z],
    [x, y, z - 2],
    [x, y, z + 2],
    [x - 1, y, z - 1],
    [x + 1, y, z - 1],
    [x - 1, y, z + 1],
    [x + 1, y, z + 1],
    [x - 2, y, z - 1],
    [x + 2, y, z - 1],
    [x - 2, y, z + 1],
    [x + 2, y, z + 1],
    [x - 1, y, z - 2],
    [x + 1, y, z - 2],
    [x - 1, y, z + 2],
    [x + 1, y, z + 2],
  ];

  ring.forEach((pos, i) => {
    const timer = setTimeout(() => {
      const [bx, by, bz] = pos;

      if (getBlock(bx, by, bz) === "air") {
        setBlock(bx, by, bz, i % 2 === 0 ? "glowing_obsidian" : "netherrack");
      } else if (getBlock(bx, by + 1, bz) === "air") {
        setBlock(bx, by + 1, bz, i % 3 === 0 ? "pumpkin" : "glowing_obsidian");
      }
    }, i * 140);

    app.reactorTimers.push(timer);
  });

  const crown = [
    [x, y + 1, z],
    [x - 1, y + 1, z],
    [x + 1, y + 1, z],
    [x, y + 1, z - 1],
    [x, y + 1, z + 1],
    [x, y + 2, z],
  ];

  crown.forEach((pos, i) => {
    const timer = setTimeout(() => {
      const [bx, by, bz] = pos;
      setBlock(bx, by, bz, i === 0 ? "glowing_obsidian" : "obsidian");
    }, 900 + i * 130);

    app.reactorTimers.push(timer);
  });

  const finishTimer = setTimeout(() => {
    app.reactorActive = false;
    showMessage("Reactor pulse complete.");
  }, 4200);

  app.reactorTimers.push(finishTimer);
}

function pulseBlock(x, y, z, count, interval) {
  const mesh = app.blockMeshes.get(key(x, y, z));
  if (!mesh) return;

  let n = 0;
  const base = mesh.scale.clone();

  const id = setInterval(() => {
    n++;
    mesh.scale.setScalar(n % 2 === 0 ? 1 : 1.18);

    if (n >= count) {
      clearInterval(id);
      mesh.scale.copy(base);
    }
  }, interval);

  app.reactorTimers.push(id);
}

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.classList.add("show");

  clearTimeout(showMessage._timer);
  showMessage._timer = setTimeout(() => {
    messageEl.classList.remove("show");
  }, 2200);
}

function onResize() {
  if (!app.renderer || !app.camera) return;

  app.camera.aspect = window.innerWidth / window.innerHeight;
  app.camera.updateProjectionMatrix();
  app.renderer.setSize(window.innerWidth, window.innerHeight);
}

let lastTime = 0;

function animate(time = 0) {
  if (!app.running) return;
  requestAnimationFrame(animate);

  const dt = Math.min(0.033, (time - lastTime) / 1000 || 0.016);
  lastTime = time;

  movePlayer(dt);
  updateCamera();
  updateHighlight();
  app.renderer.render(app.scene, app.camera);
}
