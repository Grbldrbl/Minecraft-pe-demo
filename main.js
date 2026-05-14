import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";

const TILE = 16;
const WORLD_W = 28;
const WORLD_H = 16;
const WORLD_D = 28;
const REACH = 8;
const PLAYER_HEIGHT = 1.7;
const EYE_HEIGHT = 1.55;
const MOVE_SPEED = 4.8;
const JUMP_SPEED = 6.2;
const GRAVITY = 18;
const LOOK_SENSITIVITY = 0.const TILES = {
  grass_top: [0, 0],
  stone: [1, 0],
  dirt: [2, 0],
  grass_side: [3, 0],
  planks: [4, 0],
  cobblestone: [0, 1],
  sand: [2, 1],
  gravel: [3, 1],
  wood_side: [4, 1],
  wood_top: [5, 1],
  iron: [6, 1],
  gold: [7, 1],
  diamond: [8, 1],
  bookshelf: [3, 2],
  mossy: [4, 2],
  obsidian: [5, 2],
  glass: [1, 3],
  leaves: [5, 3],

  wool_white: [0, 4],
  wool_red: [0, 12],
  wool_yellow: [1, 12],
  wool_green: [2, 12],
  wool_blue: [3, 12],

  pumpkin_top: [6, 7],
  pumpkin_side: [7, 7],

  reactor_core: [10, 11],
  glowing_obsidian: [11, 11],
  netherrack: [14, 14],
  lava: [15, 15],

  sign_plank: [4, 0],
};

const ITEM_TILES = {
  gold_ingot: [2, 2],
  iron_ingot: [1, 2],
  diamond: [7, 1],
  apple: [10, 0],
  mushroom_red: [11, 0],
  mushroom_brown: [12, 0],
  sugar: [2, 0],
  feather: [0, 0],
  gunpowder: [7, 0],
  glow_dust: [3, 0],
};

const BLOCKS = {
  air: { solid: false, placeable: false },

  grass: {
    solid: true,
    placeable: true,
    faces: {
      top: TILES.grass_top,
      bottom: TILES.dirt,
      side: TILES.grass_side,
    },
  },

  dirt: { solid: true, placeable: true, faces: { all: TILES.dirt } },
  stone: { solid: true, placeable: true, faces: { all: TILES.stone } },
  cobblestone: { solid: true, placeable: true, faces: { all: TILES.cobblestone } },
  sand: { solid: true, placeable: true, faces: { all: TILES.sand } },
  gravel: { solid: true, placeable: true, faces: { all: TILES.gravel } },
  planks: { solid: true, placeable: true, faces: { all: TILES.planks } },

  wood: {
    solid: true,
    placeable: true,
    faces: {
      top: TILES.wood_top,
      bottom: TILES.wood_top,
      side: TILES.wood_side,
    },
  },

  leaves: {
    solid: true,
    placeable: true,
    transparent: true,
    faces: { all: TILES.leaves },
  },

  glass: {
    solid: true,
    placeable: true,
    transparent: true,
    faces: { all: TILES.glass },
  },

  bookshelf: {
    solid: true,
    placeable: true,
    faces: {
      top: TILES.planks,
      bottom: TILES.planks,
      side: TILES.bookshelf,
    },
  },

  mossy_cobblestone: { solid: true, placeable: true, faces: { all: TILES.mossy } },
  obsidian: { solid: true, placeable: true, faces: { all: TILES.obsidian } },
  gold: { solid: true, placeable: true, faces: { all: TILES.gold } },
  iron: { solid: true, placeable: true, faces: { all: TILES.iron } },
  diamond: { solid: true, placeable: true, faces: { all: TILES.diamond } },
  wool_white: { solid: true, placeable: true, faces: { all: TILES.wool_white } },
  wool_red: { solid: true, placeable: true, faces: { all: TILES.wool_red } },
  wool_yellow: { solid: true, placeable: true, faces: { all: TILES.wool_yellow } },
  wool_green: { solid: true, placeable: true, faces: { all: TILES.wool_green } },
  wool_blue: { solid: true, placeable: true, faces: { all: TILES.wool_blue } },

  pumpkin: {
    solid: true,
    placeable: true,
    faces: {
      top: TILES.pumpkin_top,
      bottom: TILES.pumpkin_top,
      side: TILES.pumpkin_side,
      front: TILES.pumpkin_side,
    },
  },

  sign: {
    solid: false,
    placeable: true,
    isSign: true,
    faces: { all: TILES.sign_plank },
  },

  reactor_core: {
    solid: true,
    placeable: true,
    emissive: 0x5a2a88,
    faces: { all: TILES.reactor_core },
  },

  glowing_obsidian: {
    solid: true,
    placeable: true,
    emissive: 0xa24dff,
    faces: { all: TILES.glowing_obsidian },
  },

  netherrack: {
    solid: true,
    placeable: true,
    faces: { all: TILES.netherrack },
  },

  lava: {
    solid: false,
    placeable: true,
    transparent: true,
    emissive: 0xff6a00,
    faces: { all: TILES.lava },
  },
};

const HOTBAR = [
  "grass",
  "dirt",
  "stone",
  "cobblestone",
  "sand",
  "gravel",
  "planks",
  "wood",
  "leaves",
  "glass",
  "bookshelf",
  "mossy_cobblestone",
  "obsidian",
  "gold",
  "iron",
  "diamond",
  "wool_white",
  "wool_red",
  "wool_yellow",
  "wool_green",
  "wool_blue",
  "pumpkin",
  "sign",
  "reactor_core",
  "glowing_obsidian",
  "netherrack",
  "lava",
];

const FACE_ORDER = ["right", "left", "top", "bottom", "front", "back"];

const app = {
  scene: null,
  camera: null,
  renderer: null,
  atlas: null,
  itemAtlas: null,
  worldGroup: null,
  itemGroup: null,
  decoGroup: null,
  blockMeshes: new Map(),
  blocks: new Map(),
  selectedBlockId: "cobblestone",
  running: false,
  yaw: 0,
  pitch: -0.35,
  velocity: new THREE.Vector3(),
  playerPos: new THREE.Vector3(14, 4, 22),
  onGround: false,
  touchMoveState: { forward: false, back: false, left: false, right: false },
  touchLookState: { active: false, x: 0, y: 0 },
  reactorActive: false,
  reactorTimers: [],
  highlight: null,
  raycaster: new THREE.Raycaster(),
  itemEntities: [],
  signs: [],
};

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
  showMessage("Loading...");
  await setupThree();
  buildHotbar();
  buildWorld();
  buildHighlight();
  bindControls();

  titleScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  app.running = true;
  showMessage("Creative mode ready.");
  animate();
}

async function setupThree() {
  app.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  app.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  app.renderer.setSize(window.innerWidth, window.innerHeight);
  app.renderer.outputColorSpace = THREE.SRGBColorSpace;

  app.scene = new THREE.Scene();
  app.scene.background = new THREE.Color(0x87c6ff);
  app.scene.fog = new THREE.Fog(0x87c6ff, 18, 60);

  app.camera = new THREE.PerspectiveCamera(
    72,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  app.scene.add(new THREE.AmbientLight(0xffffff, 1.02));

  const sun = new THREE.DirectionalLight(0xffffff, 0.88);
  sun.position.set(1.5, 2.5, 1.0);
  app.scene.add(sun);

  app.worldGroup = new THREE.Group();
  app.scene.add(app.worldGroup);

  app.itemGroup = new THREE.Group();
  app.scene.add(app.itemGroup);

  app.decoGroup = new THREE.Group();
  app.scene.add(app.decoGroup);

  const loader = new THREE.TextureLoader();
  app.atlas = await loader.loadAsync("assets/terrain.png");
  app.atlas.magFilter = THREE.NearestFilter;
  app.atlas.minFilter = THREE.NearestFilter;
  app.atlas.generateMipmaps = false;
  app.atlas.colorSpace = THREE.SRGBColorSpace;
  app.atlas.wrapS = THREE.ClampToEdgeWrapping;
  app.atlas.wrapT = THREE.ClampToEdgeWrapping;

  app.itemAtlas = await loader.loadAsync("assets/items.png");
  app.itemAtlas.magFilter = THREE.NearestFilter;
  app.itemAtlas.minFilter = THREE.NearestFilter;
  app.itemAtlas.generateMipmaps = false;
  app.itemAtlas.colorSpace = THREE.SRGBColorSpace;
  app.itemAtlas.wrapS = THREE.ClampToEdgeWrapping;
  app.itemAtlas.wrapT = THREE.ClampToEdgeWrapping;

  window.addEventListener("resize", onResize);
}

function buildHotbar() {
  hotbarEl.innerHTML = "";

  HOTBAR.forEach((blockId) => {
    const slot = document.createElement("button");
    slot.className = "slot" + (blockId === app.selectedBlockId ? " selected" : "");
    slot.type = "button";

    const icon = document.createElement("canvas");
    icon.width = 16;
    icon.height = 16;
    drawTileToCanvas(icon, getIconTile(blockId), app.atlas.image);

    slot.appendChild(icon);
    slot.addEventListener("click", () => {
      app.selectedBlockId = blockId;
      document.querySelectorAll(".slot").forEach((el) => el.classList.remove("selected"));
      slot.classList.add("selected");
      showMessage(`Selected: ${prettyName(blockId)}`);
    });

    hotbarEl.appendChild(slot);
  });
}

function getIconTile(blockId) {
  const def = BLOCKS[blockId];
  if (!def?.faces) return [0, 0];
  return def.faces.front || def.faces.side || def.faces.top || def.faces.all || [0, 0];
}

function prettyName(id) {
  return id.replaceAll("_", " ");
}

function drawTileToCanvas(canvasEl, [tx, ty], image) {
  const ctx = canvasEl.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  ctx.drawImage(image, tx * TILE, ty * TILE, TILE, TILE, 0, 0, canvasEl.width, canvasEl.height);
}

function getFaceTile(blockId, face) {
  const def = BLOCKS[blockId];
  if (!def?.faces) return [0, 0];
  return def.faces[face] || def.faces.side || def.faces.all || [0, 0];
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

function buildWorld() {
  for (let x = 0; x < WORLD_W; x++) {
    for (let z = 0; z < WORLD_D; z++) {
      setBlock(x, 0, z, "grass");
    }
  }

  buildTree(6, 1, 6);
  buildTree(20, 1, 8);

  const x = 14;
  const y = 2;
  const z = 14;

  setBlock(x - 1, y - 1, z - 1, "gold");
  setBlock(x,     y - 1, z - 1, "cobblestone");
  setBlock(x + 1, y - 1, z - 1, "gold");

  setBlock(x - 1, y - 1, z,     "cobblestone");
  setBlock(x,     y - 1, z,     "cobblestone");
  setBlock(x + 1, y - 1, z,     "cobblestone");

  setBlock(x - 1, y - 1, z + 1, "gold");
  setBlock(x,     y - 1, z + 1, "cobblestone");
  setBlock(x + 1, y - 1, z + 1, "gold");

  setBlock(x - 1, y, z - 1, "cobblestone");
  setBlock(x + 1, y, z - 1, "cobblestone");
  setBlock(x, y, z, "reactor_core");
  setBlock(x - 1, y, z + 1, "cobblestone");
  setBlock(x + 1, y, z + 1, "cobblestone");

  setBlock(x,     y + 1, z - 1, "cobblestone");
  setBlock(x - 1, y + 1, z,     "cobblestone");
  setBlock(x,     y + 1, z,     "cobblestone");
  setBlock(x + 1, y + 1, z,     "cobblestone");
  setBlock(x,     y + 1, z + 1, "cobblestone");

  createSign(x + 3, 1, z, "Reactor");
}

function buildTree(x, y, z) {
  setBlock(x, y + 1, z, "wood");
  setBlock(x, y + 2, z, "wood");
  setBlock(x, y + 3, z, "wood");

  const leaves = [
    [x, y + 4, z],
    [x - 1, y + 3, z],
    [x + 1, y + 3, z],
    [x, y + 3, z - 1],
    [x, y + 3, z + 1],
    [x - 1, y + 4, z],
    [x + 1, y + 4, z],
    [x, y + 4, z - 1],
    [x, y + 4, z + 1],
  ];

  leaves.forEach(([bx, by, bz]) => setBlock(bx, by, bz, "leaves"));
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

function createSign(x, y, z, text = "Reactor") {
  removeSignAt(x, y, z);

  const group = new THREE.Group();
  group.position.set(x + 0.5, y, z + 0.5);

  const postGeo = new THREE.BoxGeometry(0.12, 0.9, 0.12);
  const woodTex = makeTileTexture(TILES.wood_side[0], TILES.wood_side[1], app.atlas);
  const woodMat = new THREE.MeshLambertMaterial({ map: woodTex });
  const post = new THREE.Mesh(postGeo, woodMat);
  post.position.set(0, 0.45, 0);
  group.add(post);

  const boardGeo = new THREE.BoxGeometry(0.9, 0.55, 0.08);
  const boardMat = makeSignBoardMaterial(text);
  const board = new THREE.Mesh(boardGeo, boardMat);
  board.position.set(0, 1.0, 0);
  group.add(board);

  group.userData = {
    type: "sign",
    text,
    x,
    y,
    z,
    board,
  };

  app.decoGroup.add(group);
  app.signs.push(group);
  return group;
}

function makeSignBoardMaterial(text) {
  const canvasEl = document.createElement("canvas");
  canvasEl.width = 256;
  canvasEl.height = 128;
  const ctx = canvasEl.getContext("2d");

  ctx.fillStyle = "#c49a5a";
  ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

  ctx.strokeStyle = "#7a5528";
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, canvasEl.width - 10, canvasEl.height - 10);

  ctx.fillStyle = "#2b1c0f";
  ctx.font = "bold 30px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = wrapSignText(ctx, text, 3, 180);
  const lineHeight = 28;
  const startY = canvasEl.height / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, canvasEl.width / 2, startY + i * lineHeight);
  });

  const frontTex = new THREE.CanvasTexture(canvasEl);
  frontTex.colorSpace = THREE.SRGBColorSpace;
  frontTex.magFilter = THREE.NearestFilter;
  frontTex.minFilter = THREE.NearestFilter;

  const plankTex = () =>
    makeTileTexture(TILES.sign_plank[0], TILES.sign_plank[1], app.atlas);

  return [
    new THREE.MeshLambertMaterial({ map: plankTex() }),
    new THREE.MeshLambertMaterial({ map: plankTex() }),
    new THREE.MeshLambertMaterial({ map: plankTex() }),
    new THREE.MeshLambertMaterial({ map: plankTex() }),
    new THREE.MeshLambertMaterial({ map: frontTex }),
    new THREE.MeshLambertMaterial({ map: plankTex() }),
  ];
}

function wrapSignText(ctx, text, maxLines = 3, maxWidth = 180) {
  const words = (text || "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return ["..."];

  const lines = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  while (lines.length > maxLines) lines.pop();

  const final = lines.slice(0, maxLines);
  if (final.length === maxLines) {
    while (ctx.measureText(final[final.length - 1]).width > maxWidth && final[final.length - 1].length > 1) {
      final[final.length - 1] = final[final.length - 1].slice(0, -1);
    }
  }

  return final;
}

function updateSignText(signGroup, text) {
  const board = signGroup.userData.board;

  if (Array.isArray(board.material)) {
    board.material.forEach((m) => {
      m.map?.dispose?.();
      m.dispose?.();
    });
  }

  board.material = makeSignBoardMaterial(text);
  signGroup.userData.text = text;
}

function editSign(signGroup) {
  const nextText = window.prompt("Sign text:", signGroup.userData.text || "Reactor");
  if (nextText === null) return;
  updateSignText(signGroup, nextText.trim() || "...");
  showMessage("Sign updated.");
}

function removeSignAt(x, y, z) {
  const idx = app.signs.findIndex(
    (sign) => sign.userData.x === x && sign.userData.y === y && sign.userData.z === z
  );
  if (idx === -1) return;

  const sign = app.signs[idx];
  sign.traverse((obj) => {
    if (Array.isArray(obj.material)) {
      obj.material.forEach((m) => {
        m.map?.dispose?.();
        m.dispose?.();
      });
    } else {
      obj.material?.map?.dispose?.();
      obj.material?.dispose?.();
    }
    obj.geometry?.dispose?.();
  });

  app.decoGroup.remove(sign);
  app.signs.splice(idx, 1);
}

function getSignAt(x, y, z) {
  return (
    app.signs.find(
      (sign) =>
        sign.userData.x === x &&
        sign.userData.y === y &&
        sign.userData.z === z
    ) || null
  );
}

function key(x, y, z) {
  return `${x},${y},${z}`;
}

function getBlock(x, y, z) {
  return app.blocks.get(key(x, y, z)) || "air";
}

function setBlock(x, y, z, blockId) {
  if (x < 0 || y < 0 || z < 0 || x >= WORLD_W || y >= WORLD_H || z >= WORLD_D) return;

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
  }
}

function makeFaceMaterials(blockId) {
  const def = BLOCKS[blockId];
  return FACE_ORDER.map((faceName) => {
    const blockFace = faceToBlockFace(faceName);
    const tile = getFaceTile(blockId, blockFace);
    const tex = makeTileTexture(tile[0], tile[1], app.atlas);
    return new THREE.MeshLambertMaterial({
      map: tex,
      transparent: !!def.transparent,
      emissive: new THREE.Color(def.emissive || 0x000000),
      alphaTest: def.transparent ? 0.15 : 0,
    });
  });
}

function makeTileTexture(tileX, tileY, atlasTexture) {
  const tex = atlasTexture.clone();
  tex.needsUpdate = true;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;

  const img = atlasTexture.image;
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

  if (input.lengthSq() > 0) input.normalize().multiplyScalar(MOVE_SPEED * dt);

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
  return app.raycaster.intersectObjects([...app.blockMeshes.values()], false)[0] || null;
}

function raycastSign() {
  const dir = getLookDirection();
  let best = null;
  let bestDist = REACH;

  for (const sign of app.signs) {
    const pos = new THREE.Vector3(
      sign.userData.x + 0.5,
      sign.userData.y + 1.0,
      sign.userData.z + 0.5
    );
    const to = pos.clone().sub(app.camera.position);
    const dist = to.length();
    if (dist > REACH) continue;

    const alignment = to.normalize().dot(dir);
    if (alignment > 0.98 && dist < bestDist) {
      best = sign;
      bestDist = dist;
    }
  }

  return best;
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
  if (hit) {
    const { x, y, z, blockId } = hit.object.userData;
    if (blockId === "reactor_core") {
      showMessage("Don't break the reactor core.");
      return;
    }
    setBlock(x, y, z, "air");
    return;
  }

  const sign = raycastSign();
  if (sign) {
    removeSignAt(sign.userData.x, sign.userData.y, sign.userData.z);
    showMessage("Sign removed.");
  }
}

function placeSelectedBlock() {
  if (app.selectedBlockId === "sign") {
    placeOrEditSign();
    return;
  }

  const hit = raycastBlocks();
  if (!hit) return;

  const normal = hit.face.normal.clone();
  normal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)).round();

  const base = hit.object.userData;
  const x = base.x + normal.x;
  const y = base.y + normal.y;
  const z = base.z + normal.z;

  if (getBlock(x, y, z) !== "air") return;
  if (getSignAt(x, y, z)) return;

  const center = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
  const dx = Math.abs(app.playerPos.x - center.x);
  const dy = Math.abs(app.playerPos.y - center.y);
  const dz = Math.abs(app.playerPos.z - center.z);
  if (dx < 0.8 && dy < 1.5 && dz < 0.8) return;

  setBlock(x, y, z, app.selectedBlockId);
}

function placeOrEditSign() {
  const lookedSign = raycastSign();
  if (lookedSign) {
    editSign(lookedSign);
    return;
  }

  const hit = raycastBlocks();
  if (!hit) {
    showMessage("Look at a block to place a sign.");
    return;
  }

  const normal = hit.face.normal.clone();
  normal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)).round();

  const base = hit.object.userData;
  const x = base.x + normal.x;
  const y = base.y + normal.y;
  const z = base.z + normal.z;

  if (getBlock(x, y, z) !== "air") {
    showMessage("No room for sign.");
    return;
  }
  if (getSignAt(x, y, z)) {
    showMessage("Sign already there.");
    return;
  }

  const center = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
  const dx = Math.abs(app.playerPos.x - center.x);
  const dy = Math.abs(app.playerPos.y - center.y);
  const dz = Math.abs(app.playerPos.z - center.z);
  if (dx < 0.8 && dy < 1.5 && dz < 0.8) {
    showMessage("Too close to place sign.");
    return;
  }

  const text = window.prompt("Sign text:", "Reactor");
  if (text === null) return;

  createSign(x, y, z, text.trim() || "...");
  showMessage("Sign placed.");
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

  const checks = [
    [x - 1, y - 1, z - 1, "gold"],
    [x,     y - 1, z - 1, "cobblestone"],
    [x + 1, y - 1, z - 1, "gold"],

    [x - 1, y - 1, z,     "cobblestone"],
    [x,     y - 1, z,     "cobblestone"],
    [x + 1, y - 1, z,     "cobblestone"],

    [x - 1, y - 1, z + 1, "gold"],
    [x,     y - 1, z + 1, "cobblestone"],
    [x + 1, y - 1, z + 1, "gold"],

    [x - 1, y, z - 1, "cobblestone"],
    [x + 1, y, z - 1, "cobblestone"],
    [x - 1, y, z + 1, "cobblestone"],
    [x + 1, y, z + 1, "cobblestone"],

    [x,     y + 1, z - 1, "cobblestone"],
    [x - 1, y + 1, z,     "cobblestone"],
    [x,     y + 1, z,     "cobblestone"],
    [x + 1, y + 1, z,     "cobblestone"],
    [x,     y + 1, z + 1, "cobblestone"],
  ];

  for (const [cx, cy, cz, expected] of checks) {
    if (getBlock(cx, cy, cz) !== expected) {
      showMessage("Classic reactor structure invalid.");
      return;
    }
  }

  const airChecks = [
    [x,     y, z - 1],
    [x - 1, y, z],
    [x + 1, y, z],
    [x,     y, z + 1],
    [x - 1, y + 1, z - 1],
    [x + 1, y + 1, z - 1],
    [x - 1, y + 1, z + 1],
    [x + 1, y + 1, z + 1],
  ];

  for (const [cx, cy, cz] of airChecks) {
    if (getBlock(cx, cy, cz) !== "air") {
      showMessage("Classic reactor structure invalid.");
      return;
    }
  }

  app.reactorActive = true;
  showMessage("Nether Reactor activated!");

  pulseBlock(x, y, z, 8, 120);
  clearItemEntities();

  const buildSteps = buildReactorRoomSteps(x, y, z);
  buildSteps.forEach((step, i) => {
    const timer = setTimeout(() => {
      step();
    }, i * 35);
    app.reactorTimers.push(timer);
  });

  const itemTimer = setTimeout(() => {
    spawnReactorLoot(x, y, z);
  }, 1200);
  app.reactorTimers.push(itemTimer);

  const finishTimer = setTimeout(() => {
    app.reactorActive = false;
    showMessage("Reactor room formed.");
  }, 2600);
  app.reactorTimers.push(finishTimer);
}

function buildReactorRoomSteps(cx, cy, cz) {
  const steps = [];
  const half = 4;
  const floorY = cy - 1;
  const roomTop = cy + 3;

  for (let x = cx - half; x <= cx + half; x++) {
    for (let z = cz - half; z <= cz + half; z++) {
      steps.push(() => {
        if (x === cx && z === cz) return;
        setBlock(
          x,
          floorY,
          z,
          (Math.abs(x - cx) + Math.abs(z - cz)) % 2 === 0
            ? "glowing_obsidian"
            : "netherrack"
        );
      });
    }
  }

  for (let y = floorY + 1; y <= roomTop; y++) {
    for (let x = cx - half; x <= cx + half; x++) {
      for (let z = cz - half; z <= cz + half; z++) {
        const isWall = x === cx - half || x === cx + half || z === cz - half || z === cz + half;
        if (!isWall) {
          steps.push(() => {
            if (!(x === cx && y === cy && z === cz)) setBlock(x, y, z, "air");
          });
        } else {
          steps.push(() => {
            if (y === floorY + 1 && z === cz - half && x === cx) {
              setBlock(x, y, z, "air");
              return;
            }
            if (y === floorY + 2 && z === cz - half && x === cx) {
              setBlock(x, y, z, "air");
              return;
            }
            setBlock(
              x,
              y,
              z,
              (x + y + z) % 3 === 0 ? "glowing_obsidian" : "netherrack"
            );
          });
        }
      }
    }
  }

  for (let x = cx - half; x <= cx + half; x++) {
    for (let z = cz - half; z <= cz + half; z++) {
      steps.push(() => {
        if (x === cx && z === cz) {
          setBlock(x, roomTop, z, "glowing_obsidian");
        } else {
          setBlock(
            x,
            roomTop,
            z,
            (Math.abs(x - cx) + Math.abs(z - cz)) % 2 === 0
              ? "netherrack"
              : "glowing_obsidian"
          );
        }
      });
    }
  }

  return steps;
}

function spawnReactorLoot(cx, cy, cz) {
  const loot = [
    "gold_ingot",
    "iron_ingot",
    "diamond",
    "apple",
    "mushroom_red",
    "mushroom_brown",
    "sugar",
    "feather",
    "gunpowder",
    "glow_dust",
  ];

  for (let i = 0; i < 10; i++) {
    const id = loot[i % loot.length];
    const px = cx + (Math.random() * 5 - 2.5);
    const py = cy + 0.9 + Math.random() * 1.2;
    const pz = cz + (Math.random() * 5 - 2.5);
    spawnItemEntity(id, px, py, pz);
  }
}

function spawnItemEntity(itemId, x, y, z) {
  const tile = ITEM_TILES[itemId];
  if (!tile || !app.itemAtlas) return;

  const tex = makeTileTexture(tile[0], tile[1], app.itemAtlas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.1,
  });

  const sprite = new THREE.Sprite(mat);
  sprite.position.set(x, y, z);
  sprite.scale.set(0.6, 0.6, 0.6);
  app.itemGroup.add(sprite);

  app.itemEntities.push({
    sprite,
    baseY: y,
    phase: Math.random() * Math.PI * 2,
    spin: (Math.random() * 2 - 1) * 0.02,
  });
}

function clearItemEntities() {
  app.itemEntities.forEach(({ sprite }) => {
    app.itemGroup.remove(sprite);
    sprite.material.map?.dispose?.();
    sprite.material.dispose?.();
  });
  app.itemEntities = [];
}

function updateItemEntities(timeSeconds) {
  app.itemEntities.forEach((entity, i) => {
    entity.sprite.position.y = entity.baseY + Math.sin(timeSeconds * 2 + entity.phase) * 0.12;
    entity.sprite.material.rotation += entity.spin;
    entity.sprite.scale.setScalar(0.6 + Math.sin(timeSeconds * 2.5 + i) * 0.03);
  });
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
  updateItemEntities(time / 1000);
  app.renderer.render(app.scene, app.camera);
}
