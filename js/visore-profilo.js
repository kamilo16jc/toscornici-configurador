/* ============================================================
   MINIVISORE DEI PROFILI — il coprifilo che si gira in mano

   Una foto di repertorio dice il colore, non la forma. Un profilo
   sagomato si capisce girandolo: e' per questo che qui c'e' un 3D
   invece di un'immagine, e per questo si puo' trascinare.

   La sezione NON e' disegnata da noi: viene dal DXF della fabbrica,
   convertito da tools/dxf-profilo.py. Se un profilo il suo DXF non ce
   l'ha ancora, questo modulo lo dice e chi chiama torna alla foto --
   meglio una foto onesta di un 3D inventato.

   VIVE E MUORE COL MODALE
   Un canvas WebGL non e' gratis: il browser ne tiene pochi aperti per
   pagina, e il configuratore ne ha gia' uno grosso per la porta.
   Quindi si crea quando il modale si apre e si smonta quando si
   chiude -- contesto, geometrie e texture. Senza, dopo qualche giro di
   apri-e-chiudi il visore grande smetteva di funzionare.
   ============================================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* Quali coprifili hanno gia' il DXF di fabbrica. Gli altri restano con
   la loro foto finche' il disegno non arriva. */
export const PROFILI = {
  pierre: 'scorn-coprifilo-sagomato_24,5x69',
};

/* Il legno del render e' SEMPRE il rovere, qualunque essenza si scelga.

   Non e' una dimenticanza: qui si guarda la FORMA del profilo, e vederla
   cambiare tinta a ogni clic sposta l'attenzione sul colore, che il
   cliente decide altrove. Una sola essenza, sempre la stessa, tiene il
   confronto onesto fra un profilo e l'altro.
   (Il rovere e' anche l'unica con una texture tarata bene: il frassino
   una sua non ce l'ha affatto.) */
const LEGNO = { cartella: 'rovere' };

const LUNGHEZZA = 420;         // mm di barra da mostrare

const cacheContorno = {};

async function contorno(file) {
  if (!cacheContorno[file]) {
    cacheContorno[file] = fetch(`assets/profili/${file}.json`).then((r) => r.json());
  }
  return cacheContorno[file];
}

let vivo = null;               // il visore aperto, se c'e'

/** Smonta tutto: contesto, geometrie, texture. */
export function chiudiVisore() {
  if (!vivo) return;
  cancelAnimationFrame(vivo.giro);
  vivo.controlli.dispose();
  vivo.geo.dispose();
  for (const t of vivo.texture) t.dispose();
  vivo.mat.dispose();
  vivo.rend.dispose();
  vivo.tela.remove();
  vivo = null;
}

/**
 * Apre il minivisore dentro `dove`. Ritorna true se ce l'ha fatta,
 * false se quel profilo il DXF non ce l'ha: in quel caso chi chiama
 * mostra la foto.
 */
export async function apriVisore(dove, idCoprifilo) {
  const file = PROFILI[idCoprifilo];
  if (!file) { chiudiVisore(); return false; }
  // Se e' gia' quello che si sta guardando, si lascia stare. Cambiare
  // legno o misura ridisegna il modale, ma il render e' sempre in
  // rovere: rifare il contesto WebGL a ogni clic sarebbe lavoro buttato,
  // e il pezzo ripartirebbe girato da capo mentre lo si sta guardando.
  if (vivo && vivo.profilo === idCoprifilo && dove.contains(vivo.tela)) return true;
  chiudiVisore();

  let d;
  try {
    d = await contorno(file);
  } catch {
    return false;                       // il JSON non c'e': meglio la foto
  }
  if (!d || !d.punti || d.punti.length < 3) return false;

  const tela = document.createElement('canvas');
  tela.className = 'visore-3d';
  dove.innerHTML = '';
  dove.appendChild(tela);

  const largo = dove.clientWidth || 420;
  const alto = 260;

  const rend = new THREE.WebGLRenderer({ canvas: tela, antialias: true, alpha: true });
  rend.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  rend.setSize(largo, alto, false);
  rend.toneMapping = THREE.NeutralToneMapping;
  rend.toneMappingExposure = 0.86;

  const scena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(rend);
  scena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const forma = new THREE.Shape();
  d.punti.forEach(([x, y], i) => (i ? forma.lineTo(x, y) : forma.moveTo(x, y)));
  forma.closePath();
  const geo = new THREE.ExtrudeGeometry(forma, {
    depth: LUNGHEZZA, bevelEnabled: false, curveSegments: 1,
  });
  // in origine: il DXF ha lo zero dove capitava sul foglio del disegno
  geo.translate(-d.larghezza / 2, -d.spessore / 2, -LUNGHEZZA / 2);
  geo.computeVertexNormals();

  const tx = new THREE.TextureLoader();
  const texture = [];
  const carica = (nome, srgb) => {
    const t = tx.load(`assets/textures/${LEGNO.cartella}/${nome}`);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    // le texture sono tarate sui metri della porta, qui si lavora in mm
    t.repeat.set(0.02, 0.02);
    texture.push(t);
    return t;
  };
  const mat = new THREE.MeshStandardMaterial({
    map: carica('albedo.jpg', true),
    normalMap: carica('normal.jpg'),
    roughnessMap: carica('roughness.jpg'),
    roughness: 0.6, metalness: 0, envMapIntensity: 0.5,
  });

  scena.add(new THREE.Mesh(geo, mat));
  const chiave = new THREE.DirectionalLight(0xffffff, 2.0);
  chiave.position.set(-180, 240, 260);
  scena.add(chiave);
  const riempi = new THREE.DirectionalLight(0xffffff, 0.3);
  riempi.position.set(220, 120, 180);
  scena.add(riempi);

  const cam = new THREE.PerspectiveCamera(26, largo / alto, 1, 5000);
  cam.position.set(300, 200, 430);
  cam.lookAt(0, 0, 0);

  const controlli = new OrbitControls(cam, tela);
  controlli.enableDamping = true;
  controlli.dampingFactor = 0.08;
  controlli.enablePan = false;
  controlli.enableZoom = false;      // lo zoom qui confonde e basta
  controlli.minPolarAngle = Math.PI * 0.14;
  controlli.maxPolarAngle = Math.PI * 0.72;
  controlli.autoRotate = true;
  controlli.autoRotateSpeed = 1.2;
  // appena lo si tocca smette di girare da solo: se continuasse,
  // lotterebbe con la mano di chi lo sta guardando
  tela.addEventListener('pointerdown', () => { controlli.autoRotate = false; },
                        { once: true });

  vivo = { profilo: idCoprifilo, tela, rend, controlli, geo, mat, texture, giro: 0 };

  (function anima() {
    if (!vivo) return;
    controlli.update();
    rend.render(scena, cam);
    vivo.giro = requestAnimationFrame(anima);
  }());

  return true;
}

/**
 * La sezione piatta come SVG, per la copertina della scheda.
 * E' lo stesso contorno che il 3D estrude: la scheda mostra il disegno
 * di fabbrica, e il clic apre il solido. Prima li' c'era una foto di
 * repertorio, che del profilo non diceva la forma.
 */
export async function sezioneSvg(idCoprifilo) {
  const file = PROFILI[idCoprifilo];
  if (!file) return null;
  let d;
  try { d = await contorno(file); } catch { return null; }
  const via = d.punti.map(([x, y], i) =>
    `${i ? 'L' : 'M'}${x.toFixed(2)} ${(d.spessore - y).toFixed(2)}`).join('');
  return `<svg class="man-sezione" viewBox="-2 -2 ${d.larghezza + 4} `
       + `${d.spessore + 4}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`
       + `<path d="${via}Z" fill="var(--ivory-deep)" stroke="var(--ink)" `
       + `stroke-width="0.7" stroke-linejoin="round"/></svg>`;
}

/** Le misure vere del profilo, per scriverle accanto al visore. */
export async function misureProfilo(idCoprifilo) {
  const file = PROFILI[idCoprifilo];
  if (!file) return null;
  try {
    const d = await contorno(file);
    return { larghezza: d.larghezza, spessore: d.spessore, punti: d.punti.length };
  } catch {
    return null;
  }
}
