import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MODELLI } from './catalogo.js';

/* ============================================================
   CATALOGO — modelli, essenze e listino 2026
   Colonne listino: sbiancato → Rovere, pino → Pino,
   toulipier → Toulipier.
   ============================================================ */

// Tutte le essenze usano la texture 'universal' (venatura sottile +
// rilievo) tinta con il colore medio misurato dagli scan raw originali.
const ESSENZE = {
  rovere:    { label: 'Rovere',    en: 'Oak',       tonoChiaro: false, color: 0xa86948 },
  castagno:  { label: 'Castagno',  en: 'Chestnut',  tonoChiaro: false, color: 0xa2805a },
  toulipier: { label: 'Toulipier', en: 'Tulipwood', tonoChiaro: true,  color: 0xcdaf7b },
  pino:      { label: 'Pino',      en: 'Pine',      tonoChiaro: true,  color: 0xe8a05c },
};

// laccati: texture 'universal' (albedo neutro) + tinta RAL.
// Prezzi: colonna Toulipier verniciata, la base tipica dei laccati.
const LACCATI = {
  bianco:  { label: 'Bianco',         color: 0xf2efe6 },
  avorio:  { label: 'Avorio',         color: 0xe7d9b8 },
  tortora: { label: 'Grigio Tortora', color: 0xb3a894 },
  salvia:  { label: 'Verde Salvia',   color: 0x8b9c85 },
  notte:   { label: 'Blu Notte',      color: 0x39465a },
};

const isLaccato = () => state.essenza === 'laccato';

function essenzaLabel() {
  return isLaccato()
    ? `Laccato ${LACCATI[state.colore].label}`
    : ESSENZE[state.essenza].label;
}

const FINITURA_LABEL = { grezza: 'grezza', verniciata: 'verniciata' };

const state = {
  modello: 'california',
  essenza: 'rovere',
  colore: 'bianco',
  finitura: 'verniciata',
  ambiente: 'galleria',
  maniglia: 'ottone',
  comps: {},
};

function defaultComps(modelKey) {
  return Object.fromEntries(MODELLI[modelKey].componenti.map((c) => [c.id, true]));
}
state.comps = defaultComps(state.modello);

const MANIGLIE = {
  ottone: { label: 'Ottone',     en: 'Brass',       color: 0xc9a227, metalness: 1,   roughness: 0.35 },
  nero:   { label: 'Nero opaco', en: 'Matte black', color: 0x1f1d1a, metalness: 0.6, roughness: 0.65 },
  cromo:  { label: 'Cromo',      en: 'Chrome',      color: 0xd8dadd, metalness: 1,   roughness: 0.12 },
};

const AMBIENTI_LABEL = { galleria: 'Galleria', ingresso: 'Ingresso', soggiorno: 'Soggiorno', studio: 'Studio' };

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

/* ============================================================
   SCENA 3D
   ============================================================ */

const viewerEl = document.getElementById('viewer');
const loaderEl = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewerEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// FOV contenuto (30°): meno distorsione prospettica con la porta aperta
const camera = new THREE.PerspectiveCamera(30, viewerEl.clientWidth / viewerEl.clientHeight, 0.05, 60);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minPolarAngle = Math.PI * 0.22;
controls.maxPolarAngle = Math.PI * 0.55;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.9;
let userMoved = false;
renderer.domElement.addEventListener('pointerdown', () => {
  userMoved = true;
  controls.autoRotate = false;
}, { once: true });

// luce chiave radente dall'alto-sinistra: fa emergere bugne e modanature
// con ombre proprie; il riempimento resta basso per non appiattire.
const key = new THREE.DirectionalLight(0xffffff, 2.1);
key.position.set(-3.2, 3.6, 1.6);
key.castShadow = true;
key.shadow.mapSize.set(4096, 4096);
key.shadow.bias = -0.0003;
key.shadow.normalBias = 0.008;
key.shadow.radius = 3;
key.shadow.camera.left = key.shadow.camera.bottom = -4.5;
key.shadow.camera.right = key.shadow.camera.top = 4.5;
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 0.3);
fill.position.set(3, 2, 2.5);
scene.add(fill);

/* ============================================================
   TEXTURES PBR — caricamento pigro con cache
   ============================================================ */

const texLoader = new THREE.TextureLoader();
const texCache = {};
// ripetizione di default: vena in scala con la porta reale (~2 m)
const REPEAT = 6;

function loadSet(essenza) {
  if (texCache[essenza]) return texCache[essenza];
  const base = `assets/textures/${essenza}/`;
  const rep = (ESSENZE[essenza] && ESSENZE[essenza].repeat) || REPEAT;
  const load = (file, srgb) => {
    const t = texLoader.load(base + file);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep, rep);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  texCache[essenza] = {
    map: load('albedo.jpg', true),
    normalMap: load('normal.jpg'),
    roughnessMap: load('roughness.jpg'),
    aoMap: load('ao.jpg'),
  };
  return texCache[essenza];
}

// materiale legno condiviso da pannello + marco (tutti i modelli)
const woodMat = new THREE.MeshStandardMaterial({
  roughness: 1,
  metalness: 0,
  normalScale: new THREE.Vector2(0.8, 0.8),
});

const hexLum = (hex) =>
  (0.2126 * ((hex >> 16) & 255) + 0.7152 * ((hex >> 8) & 255) + 0.0722 * (hex & 255)) / 255;

// materiale della maniglia/cerniere
const handleMat = new THREE.MeshStandardMaterial();

function setManiglia(k) {
  state.maniglia = k;
  const f = MANIGLIE[k];
  handleMat.color.set(f.color);
  handleMat.metalness = f.metalness;
  handleMat.roughness = f.roughness;
  document.querySelectorAll('[data-maniglia]').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.maniglia === k));
  refreshUI();
}

// aspetto del materiale = essenza + finitura.
// grezza: legno crudo — opaco, asciutto, rilievo accentuato.
// verniciata: satinato con colore pieno.
// laccato: tinta piena + lucentezza da laccatura.
// L'ambiente riflesso resta basso per non lavare i rilievi 3D.
function applyMaterialLook() {
  const lacc = isLaccato();
  const raw = !lacc && state.finitura === 'grezza';
  const base = new THREE.Color(lacc ? LACCATI[state.colore].color : ESSENZE[state.essenza].color);
  if (raw) base.multiplyScalar(0.88);
  woodMat.color.copy(base);
  woodMat.roughness = lacc ? 0.42 : (raw ? 1 : 0.62);
  woodMat.envMapIntensity = lacc ? 0.9 : (raw ? 0.3 : 0.55);
  const ns = lacc ? 1.15 : (raw ? 1.25 : 1.05);
  woodMat.normalScale.set(ns, ns);
  woodMat.aoMapIntensity = raw ? 1.5 : 1.35;
}

function applyEssenza() {
  const set = loadSet('universal');
  woodMat.map = set.map;
  woodMat.normalMap = set.normalMap;
  woodMat.roughnessMap = set.roughnessMap;
  woodMat.aoMap = set.aoMap;
  applyMaterialLook();
  woodMat.needsUpdate = true;

  // porta chiara → sfondo scuro per contrasto
  const chiaro = isLaccato()
    ? hexLum(LACCATI[state.colore].color) > 0.35
    : ESSENZE[state.essenza].tonoChiaro;
  viewerEl.classList.toggle('is-dark', chiaro);
}

/* ============================================================
   MODELLO — caricamento GLB, perno di apertura, dimensioni
   ============================================================ */

const nodes = {};
let model = null;
let shadowPlane = null;
let currentModelKey = null;

// apertura della porta: perno sulle cerniere
let doorPivot = null;
let doorTargetAngle = 0;
let doorOpenAngle = 0;
let leafParts = [];
const doorBtn = document.getElementById('doorBtn');

function toggleDoor() {
  const opening = doorTargetAngle === 0;
  doorTargetAngle = opening ? doorOpenAngle : 0;
  doorBtn.textContent = opening ? 'Chiudi la porta' : 'Apri la porta';
  doorBtn.title = opening ? 'Close the door' : 'Open the door';
}

const gltfLoader = new GLTFLoader();

// libera GPU: geometrie, materiali e texture del GLB precedente.
// I materiali condivisi (woodMat, handleMat) e le loro texture in cache
// NON si toccano — vengono riusati dal modello successivo.
function disposeMaterial(m) {
  if (!m || m === woodMat || m === handleMat) return;
  for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'])
    if (m[k]) m[k].dispose();
  m.dispose();
}

function disposeSubtree(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.geometry) o.geometry.dispose();
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) disposeMaterial(m);
  });
}

function clearModel() {
  if (doorPivot) { disposeSubtree(doorPivot); scene.remove(doorPivot); doorPivot = null; }
  if (model) { disposeSubtree(model); scene.remove(model); model = null; }
  for (const k of Object.keys(nodes)) delete nodes[k];
  leafParts = [];
  doorTargetAngle = 0;
  doorBtn.hidden = true;
  doorBtn.textContent = 'Apri la porta';
  // gli ambienti sono tagliati sulle misure della porta → si ricostruiscono
  for (const [k, g] of Object.entries(ambienti)) {
    scene.remove(g);
    delete ambienti[k];
  }
}

function loadModel(key) {
  currentModelKey = key;
  const def = MODELLI[key];
  clearModel();
  loaderEl.classList.remove('is-hidden');
  loaderFill.style.width = '0%';

  gltfLoader.load(
    def.file,
    (gltf) => {
      if (currentModelKey !== key) return; // il modello è cambiato nel frattempo
      model = gltf.scene;

      // i GLB sono in millimetri → normalizza a metri
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawH = rawBox.getSize(new THREE.Vector3()).y;
      if (rawH > 100) model.scale.setScalar(1 / 1000);

      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          if (o.material && o.material.name.startsWith('Mat_puerta')) {
            disposeMaterial(o.material); // texture 4K embebida nel GLB, non serve più
            o.material = woodMat;
          }
        }
      });

      for (const names of Object.values(def.nodi)) {
        for (const n of names) {
          const obj = model.getObjectByName(n);
          if (obj) nodes[n] = obj;
        }
      }

      // centra il modello e inquadra
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      scene.add(model);

      const dist = size.y * 2.0; // compensa il FOV più stretto
      camera.position.set(dist * 0.65, size.y * 0.12, dist);
      controls.target.set(0, 0, 0);
      controls.minDistance = dist * 0.5;
      controls.maxDistance = dist * 2.2;
      controls.update();

      // piano d'ombra (uno solo, riposizionato per modello)
      if (!shadowPlane) {
        shadowPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(8, 8),
          new THREE.ShadowMaterial({ opacity: 0.22 })
        );
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.receiveShadow = true;
        scene.add(shadowPlane);
      }
      shadowPlane.position.y = -size.y / 2 - 0.001;

      // maniglia con materiale configurabile
      const lockNode = nodes[def.lockNode];
      if (lockNode) lockNode.traverse((o) => {
        if (o.isMesh) { disposeMaterial(o.material); o.material = handleMat; }
      });

      // perno di apertura sul lato cerniere (opposto alla maniglia)
      scene.updateMatrixWorld(true);
      leafParts = def.leafNodes.map((n) => nodes[n]).filter(Boolean);
      const leafBox = new THREE.Box3();
      leafParts.forEach((p) => leafBox.expandByObject(p));
      const lockBox = new THREE.Box3().setFromObject(lockNode || leafParts[0]);
      const lockX = (lockBox.min.x + lockBox.max.x) / 2;
      const leafCX = (leafBox.min.x + leafBox.max.x) / 2;
      const hingeRight = lockX < leafCX;
      doorPivot = new THREE.Group();
      doorPivot.position.set(
        hingeRight ? leafBox.max.x : leafBox.min.x,
        0,
        (leafBox.min.z + leafBox.max.z) / 2
      );
      scene.add(doorPivot);
      leafParts.forEach((p) => doorPivot.attach(p));
      // 82°: ben aperta ma senza che il bordo libero "incomba" sulla camera
      doorOpenAngle = (hingeRight ? 1 : -1) * THREE.MathUtils.degToRad(82);
      doorBtn.hidden = false;

      applyEssenza();
      applyVisibility();
      doorDims = { w: size.x, h: size.y, floorY: -size.y / 2 };
      if (state.ambiente !== 'galleria') setAmbiente(state.ambiente);
      loaderEl.classList.add('is-hidden');
      refreshUI();
      window.__dbg = { scene, camera, model, size, center, nodes, renderer, doorPivot, toggleDoor, setModello };
    },
    (ev) => {
      if (ev.total) loaderFill.style.width = `${Math.round((ev.loaded / ev.total) * 100)}%`;
    },
    (err) => {
      loaderEl.querySelector('p').textContent = 'Errore nel caricamento del modello';
      console.error(err);
    }
  );
}

function applyVisibility() {
  const def = MODELLI[state.modello];
  for (const [comp, names] of Object.entries(def.nodi)) {
    for (const n of names) {
      if (nodes[n]) nodes[n].visible = state.comps[comp] !== false;
    }
  }
}

/* ============================================================
   AMBIENTI — scenografie 3D opzionali attorno alla porta.
   'galleria' = vista pulita (nessuna scena).
   ============================================================ */

const ambienti = {};   // nome -> THREE.Group (costruiti pigramente)
let doorDims = null;   // { w, h, floorY } noto dopo il caricamento del GLB

// faccia frontale del muro appena dietro il filo della porta
const WALL_FACE = 0.03;

const mat = (color, roughness = 0.9) => new THREE.MeshStandardMaterial({ color, roughness });

function box(group, w, h, d, material, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = m.receiveShadow = true;
  group.add(m);
  return m;
}

// parete con il vano della porta (leggermente più piccolo del marco)
function makeWall(group, color) {
  const W = 7.5, H = 3.2, D = 0.14;
  const { w: dw, h: dh, floorY } = doorDims;
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, 0);
  shape.lineTo(W / 2, 0);
  shape.lineTo(W / 2, H);
  shape.lineTo(-W / 2, H);
  shape.closePath();
  const hole = new THREE.Path();
  const ow = dw - 0.015, oh = dh - 0.008;
  hole.moveTo(-ow / 2, 0);
  hole.lineTo(ow / 2, 0);
  hole.lineTo(ow / 2, oh);
  hole.lineTo(-ow / 2, oh);
  hole.closePath();
  shape.holes.push(hole);
  const wall = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false }),
    mat(color, 0.95)
  );
  wall.position.set(0, floorY, WALL_FACE - D);
  wall.receiveShadow = true;
  group.add(wall);
}

function makeFloor(group, material) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(8, 7), material);
  f.rotation.x = -Math.PI / 2;
  f.position.set(0, doorDims.floorY - 0.006, 1.4);
  f.receiveShadow = true;
  group.add(f);
}

function makeZoccolino(group, color) {
  const { w: dw, floorY } = doorDims;
  const ow = dw - 0.015;
  const len = (7.5 - ow) / 2;
  const m = mat(color, 0.8);
  const z = WALL_FACE + 0.0125;
  box(group, len, 0.09, 0.025, m, -(ow / 2 + len / 2), floorY + 0.045, z);
  box(group, len, 0.09, 0.025, m, ow / 2 + len / 2, floorY + 0.045, z);
}

// pavimento in legno riusando l'albedo del pino con tinta
let floorTex = null;
function woodFloorMat(tint) {
  if (!floorTex) {
    floorTex = texLoader.load('assets/textures/pino/albedo.jpg');
    floorTex.colorSpace = THREE.SRGBColorSpace;
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(3, 2.6);
    floorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  return new THREE.MeshStandardMaterial({ map: floorTex, color: tint, roughness: 0.65 });
}

function buildIngresso() {
  const g = new THREE.Group();
  const { floorY } = doorDims;
  makeWall(g, 0xd3c3a3);
  makeFloor(g, mat(0xa9a08c, 0.95));
  makeZoccolino(g, 0x8f8168);
  for (const sx of [-1, 1]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.34, 24), mat(0x8a4f34, 0.85));
    pot.position.set(sx * 0.95, floorY + 0.17, 0.34);
    pot.castShadow = pot.receiveShadow = true;
    g.add(pot);
    const cip = new THREE.Mesh(new THREE.ConeGeometry(0.17, 1.05, 14), mat(0x36503a, 0.95));
    cip.position.set(sx * 0.95, floorY + 0.86, 0.34);
    cip.castShadow = true;
    g.add(cip);
    box(g, 0.09, 0.2, 0.09, mat(0x241c14, 0.6), sx * 0.62, floorY + 2.12, WALL_FACE + 0.045);
    const pl = new THREE.PointLight(0xffd9a8, 2.5, 4, 2);
    pl.position.set(sx * 0.62, floorY + 2.0, 0.4);
    g.add(pl);
  }
  box(g, 0.85, 0.015, 0.5, mat(0x4a3c30, 1), 0, floorY + 0.008, 0.45);
  return g;
}

function buildSoggiorno() {
  const g = new THREE.Group();
  const { floorY } = doorDims;
  makeWall(g, 0xe6ddcb);
  makeFloor(g, woodFloorMat(0xcfa87f));
  makeZoccolino(g, 0xf0e9da);
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.012, 48), mat(0xa96f4d, 1));
  rug.position.set(-0.2, floorY + 0.004, 1.35);
  rug.receiveShadow = true;
  g.add(rug);
  box(g, 1.15, 0.52, 0.34, mat(0x3a2d22, 0.6), 1.65, floorY + 0.26, 0.26);
  box(g, 0.34, 0.44, 0.025, mat(0x241c14, 0.7), 1.45, floorY + 1.55, WALL_FACE + 0.015);
  box(g, 0.28, 0.36, 0.025, mat(0x241c14, 0.7), 1.92, floorY + 1.48, WALL_FACE + 0.015);
  const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.35, 12), mat(0x241c14, 0.5));
  palo.position.set(-1.7, floorY + 0.675, 0.55);
  palo.castShadow = true;
  g.add(palo);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.24, 24, 1, true), mat(0xe8dcc0, 0.9));
  shade.material.side = THREE.DoubleSide;
  shade.position.set(-1.7, floorY + 1.43, 0.55);
  g.add(shade);
  const pl = new THREE.PointLight(0xffe2b0, 2.2, 4.5, 2);
  pl.position.set(-1.7, floorY + 1.3, 0.55);
  g.add(pl);
  return g;
}

function buildStudio() {
  const g = new THREE.Group();
  const { floorY } = doorDims;
  makeWall(g, 0x46523f);
  makeFloor(g, woodFloorMat(0x9a7350));
  makeZoccolino(g, 0x2f3a2c);
  const legno = mat(0x4a3626, 0.55);
  const desk = new THREE.Group();
  box(desk, 1.1, 0.045, 0.52, legno, 0, 0.74, 0);
  for (const [lx, lz] of [[-0.51, -0.22], [0.51, -0.22], [-0.51, 0.22], [0.51, 0.22]])
    box(desk, 0.04, 0.72, 0.04, legno, lx, 0.36, lz);
  box(desk, 0.22, 0.055, 0.16, mat(0x7a3b2e, 0.8), -0.25, 0.79, -0.05);
  box(desk, 0.2, 0.045, 0.14, mat(0x2e3d4a, 0.8), -0.24, 0.84, -0.04, 0.15);
  desk.position.set(1.6, floorY, 0.65);
  desk.rotation.y = -0.14;
  g.add(desk);
  for (const [my, n, off] of [[1.35, 6, 0], [1.72, 4, 0.1]]) {
    box(g, 0.85, 0.035, 0.2, mat(0x3a2d22, 0.6), -1.5, floorY + my, 0.17);
    for (let i = 0; i < n; i++)
      box(g, 0.035, 0.16 + (i % 3) * 0.03, 0.14,
        mat([0x6e4a3a, 0x44554e, 0xb3a284, 0x2b2b33][i % 4], 0.85),
        -1.86 + off + i * 0.09, floorY + my + 0.11, 0.16);
  }
  const pl = new THREE.PointLight(0xffe6c0, 2, 4, 2);
  pl.position.set(1.45, floorY + 1.5, 0.95);
  g.add(pl);
  return g;
}

const BUILDERS = { ingresso: buildIngresso, soggiorno: buildSoggiorno, studio: buildStudio };

function setAmbiente(nome) {
  state.ambiente = nome;
  if (doorDims && nome !== 'galleria' && !ambienti[nome]) {
    ambienti[nome] = BUILDERS[nome]();
    scene.add(ambienti[nome]);
  }
  for (const [k, grp] of Object.entries(ambienti)) grp.visible = (k === nome);
  const room = nome !== 'galleria';
  controls.autoRotate = !room && !userMoved;
  controls.minAzimuthAngle = room ? -0.9 : -Infinity;
  controls.maxAzimuthAngle = room ? 0.9 : Infinity;
  controls.maxPolarAngle = Math.PI * (room ? 0.5 : 0.55);
  document.querySelectorAll('[data-ambiente]').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.ambiente === nome));
}

/* ============================================================
   RENDER LOOP
   ============================================================ */

function resize() {
  const w = viewerEl.clientWidth, h = viewerEl.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resize);

renderer.setAnimationLoop(() => {
  controls.update();
  if (doorPivot) {
    doorPivot.rotation.y += (doorTargetAngle - doorPivot.rotation.y) * 0.07;
  }
  renderer.render(scene, camera);
});

// click sulla porta → apri/chiudi (senza interferire con l'orbita)
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || !doorPivot) return;
  const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (moved > 6) return;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (raycaster.intersectObjects(leafParts, true).length) toggleDoor();
});
doorBtn.addEventListener('click', toggleDoor);

/* ============================================================
   UI — prezzi e interazioni
   ============================================================ */

const totalEl = document.getElementById('totalValue');
const summaryLabelEl = document.getElementById('summaryLabel');
const summaryConfigEl = document.getElementById('summaryConfig');
const pillNoteEl = document.getElementById('pillNote');
const componentsEl = document.getElementById('components');
const panelTitleEl = document.getElementById('panelTitle');
const panelSubEl = document.getElementById('panelSub');
const captionModelEl = document.getElementById('captionModel');
const captionLineEl = document.getElementById('captionLine');

function currentPrices() {
  return MODELLI[state.modello].listino[state.essenza][state.finitura];
}

function computeTotale() {
  const prices = currentPrices();
  return Object.entries(state.comps)
    .filter(([, on]) => on)
    .reduce((sum, [comp]) => sum + (prices[comp] || 0), 0);
}

// menu essenze: legni raw + laccati su base universal
const swatchesEl = document.getElementById('swatches');
const laccatiEl = document.getElementById('laccati');

function renderEssenze() {
  swatchesEl.innerHTML = Object.entries(ESSENZE).map(([k, e]) => `
    <button class="swatch" data-essenza="${k}">
      <span class="swatch-chip" style="background-image:url('assets/textures/universal/albedo.jpg');background-color:#${e.color.toString(16).padStart(6, '0')};background-blend-mode:multiply"></span>
      <span class="swatch-label">${e.label}</span>
      <span class="swatch-en">${e.en}</span>
    </button>`).join('');
  laccatiEl.innerHTML = Object.entries(LACCATI).map(([k, l]) => `
    <button class="lacc" data-colore="${k}">
      <span class="lacc-chip" style="background:#${l.color.toString(16).padStart(6, '0')}"></span>
      <span class="lacc-label">${l.label}</span>
    </button>`).join('');
  swatchesEl.querySelectorAll('.swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.essenza = btn.dataset.essenza;
      applyEssenza();
      refreshUI();
    });
  });
  laccatiEl.querySelectorAll('.lacc').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.essenza = 'laccato';
      state.colore = btn.dataset.colore;
      state.finitura = 'verniciata'; // i laccati sono solo verniciati
      applyEssenza();
      refreshUI();
    });
  });
}

// lista componenti generata dal modello attivo
function renderComponents() {
  const def = MODELLI[state.modello];
  componentsEl.innerHTML = def.componenti.map((c) => `
    <li>
      <label class="comp">
        <input type="checkbox" data-comp="${c.id}" ${state.comps[c.id] ? 'checked' : ''}>
        <span class="comp-check"></span>
        <span class="comp-body">
          <span class="comp-name">${c.it} <span class="en">${c.en}</span></span>
          <span class="comp-desc">${c.desc}</span>
        </span>
        <span class="comp-price" data-price="${c.id}">—</span>
      </label>
    </li>`).join('');
  componentsEl.querySelectorAll('[data-comp]').forEach((input) => {
    input.addEventListener('change', () => {
      state.comps[input.dataset.comp] = input.checked;
      applyVisibility();
      refreshUI();
    });
  });
}

function refreshUI() {
  const prices = currentPrices();

  document.querySelectorAll('[data-price]').forEach((el) => {
    el.textContent = eur.format(prices[el.dataset.price] || 0);
  });

  totalEl.textContent = eur.format(computeTotale());
  totalEl.classList.remove('bump');
  void totalEl.offsetWidth;
  totalEl.classList.add('bump');

  const allOn = Object.values(state.comps).every(Boolean);
  summaryLabelEl.innerHTML = allOn
    ? 'Porta completa · <span class="en">Complete door</span>'
    : 'Configurazione parziale · <span class="en">Partial configuration</span>';
  summaryConfigEl.textContent =
    `${MODELLI[state.modello].label} · ${essenzaLabel()} — ${FINITURA_LABEL[state.finitura]} · ${MANIGLIE[state.maniglia].label}`;

  // i laccati sono disponibili solo verniciati
  const grezzaBtn = document.querySelector('[data-finitura="grezza"]');
  grezzaBtn.disabled = isLaccato();
  pillNoteEl.textContent = isLaccato() ? 'I laccati sono disponibili solo verniciati.' : '';

  document.querySelectorAll('#pills .pill').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.finitura === state.finitura));
  document.querySelectorAll('.swatch').forEach((b) =>
    b.classList.toggle('is-active', !isLaccato() && b.dataset.essenza === state.essenza));
  document.querySelectorAll('.lacc').forEach((b) =>
    b.classList.toggle('is-active', isLaccato() && b.dataset.colore === state.colore));
}

function setModello(key) {
  if (state.modello === key && model) return;
  state.modello = key;
  state.comps = defaultComps(key);
  const def = MODELLI[key];
  // intestazioni pannello e viewer
  captionModelEl.innerHTML = def.linea === 'Base'
    ? def.label
    : `${def.label} <span>${def.linea}</span>`;
  captionLineEl.textContent = `${def.sub} · Porte in legno massello`;
  panelTitleEl.textContent = def.linea === 'Base' ? def.label : `${def.label} ${def.linea}`;
  panelSubEl.innerHTML = `${def.descIt} — <span class="en">${def.descEn}</span>`;
  modelloSelect.value = key;
  renderComponents();
  refreshUI();
  loadModel(key);
}

// modello: menu a tendina raggruppato per linea
const modelloSelect = document.getElementById('modelloSelect');

function renderModelli() {
  const groups = { Base: [], 100: [] };
  for (const [k, m] of Object.entries(MODELLI)) (groups[m.linea] || (groups[m.linea] = [])).push([k, m]);
  const byId = (a, b) => a[1].id - b[1].id;
  const opt = ([k, m]) => `<option value="${k}">${m.label} · ID ${m.id}</option>`;
  modelloSelect.innerHTML = Object.entries(groups)
    .filter(([, arr]) => arr.length)
    .map(([linea, arr]) => `<optgroup label="Linea ${linea}">${arr.sort(byId).map(opt).join('')}</optgroup>`)
    .join('');
  modelloSelect.value = state.modello;
  modelloSelect.addEventListener('change', () => setModello(modelloSelect.value));
}

// finitura (solo le pill della sezione finitura, non quelle ambiente)
document.querySelectorAll('#pills .pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    state.finitura = btn.dataset.finitura;
    applyMaterialLook();
    refreshUI();
  });
});

// ambiente
document.querySelectorAll('[data-ambiente]').forEach((btn) => {
  btn.addEventListener('click', () => setAmbiente(btn.dataset.ambiente));
});

// maniglia
document.querySelectorAll('[data-maniglia]').forEach((btn) => {
  btn.addEventListener('click', () => setManiglia(btn.dataset.maniglia));
});

/* ============================================================
   PREVENTIVO — modulo cliente + PDF per il produttore
   ============================================================ */

const quoteModal = document.getElementById('quoteModal');
const quoteForm = document.getElementById('quoteForm');
const quoteFormView = document.getElementById('quoteFormView');
const quoteDoneView = document.getElementById('quoteDoneView');

const pdfMoney = (v) => eur.format(v).replace('€', 'EUR').trim();

// scatto dedicato per il PDF: solo la porta su bianco,
// inquadratura frontale con margine calcolato
function captureRender() {
  const hiddenGroups = [];
  for (const g of Object.values(ambienti)) {
    if (g.visible) { g.visible = false; hiddenGroups.push(g); }
  }

  const prevSize = new THREE.Vector2();
  renderer.getSize(prevSize);
  const cw = 900, ch = 1200;
  renderer.setSize(cw, ch, false);

  const h = doorDims ? doorDims.h : 2;
  const fov = 35;
  const cam = new THREE.PerspectiveCamera(fov, cw / ch, 0.05, 60);
  const dist = (h * 0.59) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  cam.position.set(0, 0, dist);
  cam.lookAt(0, 0, 0);
  renderer.render(scene, cam);

  const src = renderer.domElement;
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src, 0, 0);

  renderer.setSize(prevSize.x, prevSize.y, false);
  hiddenGroups.forEach((g) => { g.visible = true; });
  renderer.render(scene, camera);

  return { dataURL: c.toDataURL('image/jpeg', 0.85), w: c.width, h: c.height };
}

function buildPDF(cliente, rif) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595, M = 48;
  const mod = MODELLI[state.modello];
  const prices = currentPrices();
  const qty = Math.max(1, parseInt(cliente.quantita, 10) || 1);
  const unitTotal = computeTotale();
  const oggi = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  // — intestazione
  doc.setDrawColor(168, 132, 60);
  doc.setLineWidth(1);
  doc.rect(M, 44, 30, 30);
  doc.setFont('times', 'normal');
  doc.setFontSize(22);
  doc.setTextColor(168, 132, 60);
  doc.text('T', M + 15, 65, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(43, 33, 26);
  doc.text('T O S C O R N I C I', M + 42, 58);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(141, 125, 106);
  doc.text('Porte in legno massello · Configuratore 3D', M + 42, 70);

  doc.setFontSize(9);
  doc.setTextColor(43, 33, 26);
  doc.text('RICHIESTA PREVENTIVO / QUOTE REQUEST', W - M, 52, { align: 'right' });
  doc.setTextColor(168, 132, 60);
  doc.text(`Rif. ${rif}`, W - M, 64, { align: 'right' });
  doc.setTextColor(141, 125, 106);
  doc.text(oggi, W - M, 76, { align: 'right' });

  doc.setDrawColor(43, 33, 26);
  doc.setLineWidth(0.8);
  doc.line(M, 90, W - M, 90);

  const section = (title, y) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(168, 132, 60);
    doc.text(title, M, y);
    doc.setDrawColor(220, 210, 195);
    doc.setLineWidth(0.5);
    doc.line(M, y + 5, W - M, y + 5);
  };

  const row = (k, v, y, x = M, keyW = 92) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(141, 125, 106);
    doc.text(k, x, y);
    doc.setTextColor(43, 33, 26);
    doc.text(String(v || '—'), x + keyW, y);
  };

  // — cliente
  let y = 112;
  section('CLIENTE / CUSTOMER', y);
  y += 20;
  row('Nome', cliente.nome, y);
  row('Telefono', cliente.telefono, y + 14);
  row('Email', cliente.email, y + 28);
  row('Indirizzo', cliente.indirizzo, y + 42);
  row('Città', `${cliente.citta}${cliente.cap ? ' · ' + cliente.cap : ''}${cliente.provincia ? ' (' + cliente.provincia + ')' : ''}`, y + 56);

  // — immagine della configurazione (colonna destra)
  const img = captureRender();
  const imgW = 235;
  const imgH = imgW * (img.h / img.w);
  doc.addImage(img.dataURL, 'JPEG', W - M - imgW, y - 6, imgW, imgH);
  doc.setDrawColor(220, 210, 195);
  doc.rect(W - M - imgW, y - 6, imgW, imgH);

  // — configurazione
  y = Math.max(y + 82, y - 6 + imgH + 24);
  section('CONFIGURAZIONE / CONFIGURATION', y);
  y += 20;
  row('Modello', `${mod.label} — ${mod.sub}`, y);
  row('Essenza', essenzaLabel(), y + 14);
  row('Finitura', `${FINITURA_LABEL[state.finitura]} / ${state.finitura === 'grezza' ? 'raw' : 'painted'}`, y + 28);
  row('Maniglia', `${MANIGLIE[state.maniglia].label} / ${MANIGLIE[state.maniglia].en}`, y + 42);
  row('Ambiente', `${AMBIENTI_LABEL[state.ambiente]} (visualizzazione)`, y + 56);
  row('Quantità', `${qty} ${qty === 1 ? 'porta' : 'porte'}`, y + 70);

  // — componenti e prezzi
  y += 96;
  section('COMPONENTI E PREZZI / COMPONENTS AND PRICES', y);
  y += 20;
  for (const c of mod.componenti) {
    const on = state.comps[c.id];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(on ? 43 : 180, on ? 33 : 170, on ? 26 : 155);
    doc.text(`${on ? '' : '(escluso) '}${c.it} / ${c.en}`, M, y);
    doc.text(on ? pdfMoney(prices[c.id] || 0) : '—', W - M, y, { align: 'right' });
    y += 15;
  }
  doc.setDrawColor(43, 33, 26);
  doc.setLineWidth(0.8);
  doc.line(M, y, W - M, y);
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(43, 33, 26);
  doc.text('Totale unitario / Unit total', M, y);
  doc.text(pdfMoney(unitTotal), W - M, y, { align: 'right' });
  if (qty > 1) {
    y += 18;
    doc.text(`Totale (${qty} porte) / Grand total`, M, y);
    doc.text(pdfMoney(unitTotal * qty), W - M, y, { align: 'right' });
  }
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(141, 125, 106);
  doc.text('IVA esclusa · Prezzi di listino 2026 / VAT excluded · 2026 list prices', M, y);

  // — note del cliente (larghezza piena)
  if (cliente.note) {
    y += 26;
    section('NOTE DEL CLIENTE / CUSTOMER NOTES', y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(43, 33, 26);
    doc.text(doc.splitTextToSize(cliente.note, W - 2 * M), M, y);
  }

  // — piè di pagina
  doc.setFontSize(8);
  doc.setTextColor(141, 125, 106);
  doc.text(
    'Documento generato automaticamente dal Configuratore 3D Toscornici e inoltrato a ordini@toscornici.it',
    W / 2, 812, { align: 'center' }
  );
  return doc;
}

function openQuote() {
  quoteFormView.hidden = false;
  quoteDoneView.hidden = true;
  quoteModal.hidden = false;
  quoteForm.querySelector('[name="nome"]').focus();
}

function closeQuote() { quoteModal.hidden = true; }

document.getElementById('cta').addEventListener('click', openQuote);
document.getElementById('quoteCancel').addEventListener('click', closeQuote);
document.getElementById('quoteClose').addEventListener('click', closeQuote);
quoteModal.addEventListener('click', (e) => { if (e.target === quoteModal) closeQuote(); });

quoteForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const cliente = Object.fromEntries(new FormData(quoteForm).entries());
  const d = new Date();
  const rif = `TC-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const doc = buildPDF(cliente, rif);
  doc.save(`Toscornici_Preventivo_${rif}.pdf`);
  document.getElementById('doneRef').textContent = `Rif. ${rif}`;
  quoteFormView.hidden = true;
  quoteDoneView.hidden = false;
});

window.__pdf = { buildPDF }; // hook di verifica

/* ============================================================
   AVVIO
   ============================================================ */

renderModelli();
renderEssenze();
renderComponents();
setManiglia(state.maniglia);
refreshUI();
loadModel(state.modello);
