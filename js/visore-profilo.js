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

/* Il legno del listino e la texture che gli somiglia.
   Il frassino una texture sua non ce l'ha: si usa quella del toulipier,
   che e' l'altro legno chiaro, e si schiarisce un po'. E' un ripiego
   dichiarato, non una svista. */
const LEGNO = {
  frassino:  { cartella: 'toulipier', tinta: 0xf0e6d2 },
  toulipier: { cartella: 'toulipier', tinta: 0xffffff },
  pino:      { cartella: 'pino',      tinta: 0xffffff },
};

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
export async function apriVisore(dove, idCoprifilo, legno) {
  chiudiVisore();
  const file = PROFILI[idCoprifilo];
  if (!file) return false;

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

  const L = LEGNO[legno] || LEGNO.toulipier;
  const tx = new THREE.TextureLoader();
  const texture = [];
  const carica = (nome, srgb) => {
    const t = tx.load(`assets/textures/${L.cartella}/${nome}`);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    // le texture sono tarate sui metri della porta, qui si lavora in mm
    t.repeat.set(0.02, 0.02);
    texture.push(t);
    return t;
  };
  const mat = new THREE.MeshStandardMaterial({
    color: L.tinta,
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

  vivo = { tela, rend, controlli, geo, mat, texture, giro: 0 };

  (function anima() {
    if (!vivo) return;
    controlli.update();
    rend.render(scena, cam);
    vivo.giro = requestAnimationFrame(anima);
  }());

  return true;
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
