import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";

const TILE = 16;
const WORLD_W = 18;
const WORLD_H = 10;
const WORLD_D = 18;
const REACH = 8;
const PLAYER_HEIGHT = 1.7;
const EYE_OFFSET = 0.7;
const MOVE_SPEED = 4.8;
const JUMP_SPEED = 6.2;
const GRAVITY = 18;
const LOOK_SENSITIVITY = 0.004;

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
  yaw: Math.PI,
  pitch: -0.2,
  velocity: new THREE.Vector3(),
  playerPos: new THREE.Vector3(9, 3.2, 14),
  onGround: false,
  touchMoveState: { forward: false, back: false, left: false, right: false },
  touchLookState: { active: false, pointerId: null, x: 0, y: 0 },
  reactorActive: false,
  reactorTimers: [],
  highlight: null,
  raycaster: new THREE.Raycaster(),
  inventoryOpen: false,
};

const BLOCKS = {
  air: { solid: false, placeable: false, inventory: false },
  grass: { faces: { all: [0, 0] }, solid: true, placeable: true, inventory: true, label: "Grass" },
  cobblestone: { faces: { all: [1, 0] }, solid: true, placeable: true, inventory: true, label: "Cobblestone" },
  planks: { faces: { all: [4, 0] }, solid: true, placeable: true, inventory: true, label: "Planks" },
  reactor_core: { faces: { all: [7, 1] }, solid: true, placeable: true, inventory: true, emissive: 0x552266, label: "Reactor Core" },
  gold: { faces: { all: [6, 13] }, solid: true, placeable: true, inventory: true, label: "Gold Block" },
  obsidian: { faces: { all: [15, 14] }, solid: true, placeable: true, inventory: true, label: "Obsidian" },
  glowing_obsidian: {
    faces: { all: [10, 14] },
    solid: true,
    placeable: false,
    inventory: false,
    emissive: 0xaa66ff,
    label: "Glowing Obsidian",
  },
  netherrack: { faces: { all: [1, 15] }, solid: true, placeable: true, inventory: true, label: "Netherrack" },
  quartz: { faces: { all: [0, 14] }, solid: true, placeable: true, inventory: true, label: "Quartz" },
  pumpkin: { faces: { all: [6, 7] }, solid: true, placeable: true, inventory: true, label: "Pumpkin" },
  lava: {
    faces: { all: [15, 15] },
    solid: false,
    placeable: true,
    inventory: true,
    transparent: true,
    emissive: 0xff6600,
    label: "Lava",
  },
};

const HOTBAR_SIZE = 8;
const INVENTORY_BLOCKS = Object.keys(BLOCKS).filter((id) => BLOCKS[id].inventory);

const titleScreen = document.getElementById("titleScreen");
const startBtn = document.getElementById("startBtn");
const hud = document.getElementById("hud");
const hotbarEl = document.getElementById("hotbar");
const messageEl = document.getElementById("message");
const activateBtn = document.getElementById("activateBtn");
const placeBtn = document.getElementById("placeBtn");
const breakBtn = document.getElementById("breakBtn");
const jumpBtn = document.getElementById("jumpBtn");
const lookPad = document.getElementById("lookPad");
const inventoryBtn = document.getElementById("inventoryBtn");
const inventoryOverlay = document.getElementById("inventoryOverlay");
const inventoryGrid = document.getElementById("inventoryGrid");
const closeInventoryBtn = document.getElementById("closeInventoryBtn");
const canvas = document.getElementById("game");

const hotbarState = [
  "cobblestone",
  "gold",
  "obsidian",
  "reactor_core",
  "netherrack",
  "quartz",
  "planks",
  "pumpkin",
];

startBtn.addEventListener("click", init);

async function init() {
  startBtn.disabled = true;
  showMessage("Loading...");
  await setupThree();
  buildInventory();
  buildHotbar();
  buildWorld();
  buildHighlight();
  bindControls();

  titleScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  app.running = true;
  showMessage("Fixed build loaded.");
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

  const ambient = new THREE.AmbientLight(0xffffff, 1.08);
  app.scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 0.85);
  sun.position.set(1, 2, 0.5);
  app.scene.add(sun);

  app.worldGroup = new THREE.Group();
  app.scene.add(app.worldGroup);

  const loader = new THREE.TextureLoader();
  app.atlas = await loader.loadAsync("assets/terrain.png");
  app.atlas.magFilter = THREE.NearestFilter;
  app.atlas.minFilter = THREE.NearestFilter;
  app.atlas.colorSpace = THREE.SRGBColorSpace;

  window.addEventListener("resize", onResize);
}

function buildInventory() {
  inventoryGrid.innerHTML = "";

  INVENTORY_BLOCKS.forEach((blockId) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "inventoryItem";
    item.dataset.block = blockId;

    const icon = document.createElement("canvas");
    icon.width = 16;
    icon.height = 16;
    drawTileToCanvas(icon, getBlockFaceTile(blockId, "front"));

    const label = document.createElement("div");
    label.textContent = BLOCKS[blockId].label;

    item.append(icon, label);

    item.addEventListener("click", () => {
      app.selectedBlockId = blockId;
      hotbarState[0] = blockId;
      buildHotbar();
      syncSelections();
      setInventoryOpen(false);
      showMessage(`Selected: ${BLOCKS[blockId].label}`);
    });

    inventoryGrid.appendChild(item);
  });

  syncSelections();
}

function buildHotbar() {
  hotbarEl.innerHTML = "";

  hotbarState.forEach((blockId, index) => {
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "slot";
    slot.dataset.index = String(index);

    const icon = document.createElement("canvas");
    icon.width = 16;
    icon.height = 16;
    drawTileToCanvas(icon, getBlockFaceTile(blockId, "front"));
    slot.appendChild(icon);

    slot.addEventListener("click", () => {
      app.selectedBlockId = blockId;
      syncSelections();
      showMessage(`Selected: ${BLOCKS[blockId].label}`);
    });

    hotbarEl.appendChild(slot);
  });

  syncSelections();
}

function syncSelections() {
  document.querySelectorAll(".slot").forEach((el) => {
    const i = Number(el.dataset.index);
    el.classList.toggle("selected", hotbarState[i] === app.selectedBlockId);
  });

  document.querySelectorAll(".inventoryItem").forEach((el) => {
    el.classList.toggle("selected", el.dataset.block === app.selectedBlockId);
  });
}

function drawTileToCanvas(canvasEl, [tx, ty]) {
  const ctx = canvasEl.getContext("2d");
  const img = app.atlas.image;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  ctx.drawImage(img, tx * TILE, ty * TILE, TILE, TILE, 0, 0, canvasEl.width, canvasEl.height);
}

function buildWorld() {
  for (let x = 0; x < WORLD_W; x++) {
    for (let z = 0; z < WORLD_D; z++) {
      setBlock(x, 0, z, "grass");
    }
  }

  const rx = 8;
  const ry = 1;
  const rz = 8;
  setBlock(rx, ry, rz, "reactor_core");
  setBlock(rx - 1, ry, rz, "gold");
  setBlock(rx + 1, ry, rz, "gold");
  setBlock(rx, ry, rz - 1, "gold");
  setBlock(rx, ry, rz + 1, "gold");
  setBlock(rx, ry + 1, rz, "cobblestone");
}

function buildHighlight() {
  const geo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
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

function getBlockFaceTile(blockId, face) {
  const def = BLOCKS[blockId];
  if (!def || !def.faces) return [0, 0];
  return def.faces[face] || def.faces.all || [0, 0];
}

function faceOrderName(index) {
  return ["right", "left", "top", "bottom", "front", "back"][index];
}

function tileUv(tileX, tileY) {
  const texW = app.atlas.image.width;
  const texH = app.atlas.image.height;
  const u0 = (tileX * TILE) / texW;
  const v1 = 1 - (tileY * TILE) / texH;
  const u1 = ((tileX + 1) * TILE) / texW;
  const v0 = 1 - ((tileY + 1) * TILE) / texH;
  return { u0, v0, u1, v1 };
}

function buildFaceTexture(tile) {
  const tex = app.atlas.clone();
  tex.needsUpdate = true;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;

  const { u0, v0, u1, v1 } = tileUv(tile[0], tile[1]);
  tex.repeat.set(u1 - u0, v1 - v0);
  tex.offset.set(u0, v0);
  return tex;
}

function makeBlockMaterial(blockId) {
  const def = BLOCKS[blockId];
  const mats = [];

  for (let i = 0; i < 6; i++) {
    const face = faceOrderName(i);
    const tile = getBlockFaceTile(blockId, face);
    mats.push(
      new THREE.MeshLambertMaterial({
        map: buildFaceTexture(tile),
        transparent: !!def.transparent,
        emissive: new THREE.Color(def.emissive || 0x000000),
      })
    );
  }

  return mats;
}

function setBlock(x, y, z, blockId) {
  if (x < 0 || z < 0 || y < 0 || x >= WORLD_W || z >= WORLD_D || y >= WORLD_H) return;

  const k = key(x, y, z);
  const prev = app.blocks.get(k) || "air";
  if (prev === blockId) return;

  const existing = app.blockMeshes.get(k);
  if (existing) {
    app.worldGroup.remove(existing);
    existing.geometry.dispose();
    existing.material.forEach?.((m) => {
      m.map?.dispose?.();
      m.dispose?.();
    });
    app.blockMeshes.delete(k);
  }

  if (blockId === "air") {
    app.blocks.delete(k);
    return;
  }

  app.blocks.set(k, blockId);

  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mats = makeBlockMaterial(blockId);
  const mesh = new THREE.Mesh(geo, mats);
  mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
  mesh.userData = { x, y, z, blockId };
  app.worldGroup.add(mesh);
  app.blockMeshes.set(k, mesh);
}

function bindControls() {
  document.querySelectorAll(".move").forEach((btn) => {
    const act = btn.dataset.act;

    const onDown = (e) => {
      e.preventDefault();
      app.touchMoveState[act] = true;
      btn.classList.add("active");
    };

    const onUp = (e) => {
      e.preventDefault();
      app.touchMoveState[act] = false;
      btn.classList.remove("active");
    };

    btn.addEventListener("pointerdown", onDown);
    btn.addEventListener("pointerup", onUp);
    btn.addEventListener("pointercancel", onUp);
    btn.addEventListener("pointerleave", onUp);
  });

  jumpBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (app.inventoryOpen) return;
    if (app.onGround) {
      app.velocity.y = JUMP_SPEED;
      app.onGround = false;
    }
  });

  placeBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (!app.inventoryOpen) placeSelectedBlock();
  });

  breakBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (!app.inventoryOpen) breakTargetBlock();
  });

  activateBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (!app.inventoryOpen) tryActivateReactor();
  });

  inventoryBtn.addEventListener("click", (e) => {
    e.preventDefault();
    setInventoryOpen(true);
  });

  closeInventoryBtn.addEventListener("click", (e) => {
    e.preventDefault();
    setInventoryOpen(false);
  });

  inventoryOverlay.addEventListener("click", (e) => {
    if (e.target === inventoryOverlay) {
      setInventoryOpen(false);
    }
  });

  lookPad.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (app.inventoryOpen) return;
    app.touchLookState.active = true;
    app.touchLookState.pointerId = e.pointerId;
    app.touchLookState.x = e.clientX;
    app.touchLookState.y = e.clientY;
  });

  window.addEventListener("pointermove", (e) => {
    if (!app.touchLookState.active) return;
    if (e.pointerId !== app.touchLookState.pointerId) return;

    const dx = e.clientX - app.touchLookState.x;
    const dy = e.clientY - app.touchLookState.y;

    app.touchLookState.x = e.clientX;
    app.touchLookState.y = e.clientY;

    app.yaw -= dx * LOOK_SENSITIVITY;
    app.pitch -= dy * LOOK_SENSITIVITY;
    app.pitch = Math.max(-1.45, Math.min(1.45, app.pitch));
  }, { passive: true });

  window.addEventListener("pointerup", (e) => {
    if (e.pointerId === app.touchLookState.pointerId) {
      app.touchLookState.active = false;
      app.touchLookState.pointerId = null;
    }
  });

  window.addEventListener("pointercancel", (e) => {
    if (e.pointerId === app.touchLookState.pointerId) {
      app.touchLookState.active = false;
      app.touchLookState.pointerId = null;
    }
  });
}

function setInventoryOpen(open) {
  app.inventoryOpen = open;
  inventoryOverlay.classList.toggle("hidden", !open);
}

function updateCamera() {
  app.camera.position.set(
    app.playerPos.x,
    app.playerPos.y + EYE_OFFSET,
    app.playerPos.z
  );

  const dir = new THREE.Vector3(
    Math.sin(app.yaw) * Math.cos(app.pitch),
    Math.sin(app.pitch),
    Math.cos(app.yaw) * Math.cos(app.pitch)
  );

  app.camera.lookAt(app.camera.position.clone().add(dir));
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
  if (app.inventoryOpen) return;

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
    app.velocity.y = 0;
    app.onGround = true;
  }
}

function getLookDirection() {
  return new THREE.Vector3(
    Math.sin(app.yaw) * Math.cos(app.pitch),
    Math.sin(app.pitch),
    Math.cos(app.yaw) * Math.cos(app.pitch)
  ).normalize();
}

function raycastBlocks() {
  app.raycaster.set(app.camera.position, getLookDirection());
  app.raycaster.far = REACH;
  return app.raycaster.intersectObjects([...app.blockMeshes.values()], false)[0] || null;
}

function updateHighlight() {
  if (app.inventoryOpen) {
    app.highlight.visible = false;
    return;
  }

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
  const { x, y, z } = hit.object.userData;
  setBlock(x, y, z, "air");
}

function normalToAxisVector(hit) {
  const n = hit.face.normal.clone();
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
  n.applyMatrix3(normalMatrix);

  const ax = Math.abs(n.x);
  const ay = Math.abs(n.y);
  const az = Math.abs(n.z);

  if (ax > ay && ax > az) return new THREE.Vector3(Math.sign(n.x), 0, 0);
  if (ay > ax && ay > az) return new THREE.Vector3(0, Math.sign(n.y), 0);
  return new THREE.Vector3(0, 0, Math.sign(n.z));
}

function placeSelectedBlock() {
  const hit = raycastBlocks();
  if (!hit) return;

  const normal = normalToAxisVector(hit);
  const base = hit.object.userData;
  const x = base.x + normal.x;
  const y = base.y + normal.y;
  const z = base.z + normal.z;

  if (getBlock(x, y, z) !== "air") return;
  if (!BLOCKS[app.selectedBlockId]?.placeable) return;

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
    showMessage("Structure invalid.");
    return;
  }

  app.reactorActive = true;
  showMessage("Nether Reactor activated!");

  pulseBlock(x, y, z, 8, 120);

  const ring = [
    [x - 2, y, z], [x + 2, y, z], [x, y, z - 2], [x, y, z + 2],
    [x - 1, y, z - 1], [x + 1, y, z - 1], [x - 1, y, z + 1], [x + 1, y, z + 1],
  ];

  ring.forEach((pos, i) => {
    const timer = setTimeout(() => {
      const [bx, by, bz] = pos;
      if (getBlock(bx, by, bz) === "air") {
        setBlock(bx, by, bz, i % 2 === 0 ? "glowing_obsidian" : "netherrack");
      }
    }, i * 150);
    app.reactorTimers.push(timer);
  });

  const finishTimer = setTimeout(() => {
    app.reactorActive = false;
    showMessage("Reactor pulse complete.");
  }, 2500);
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
  }, 1800);
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
