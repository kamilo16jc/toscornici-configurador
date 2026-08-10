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

/* Quali coprifili hanno il DXF di fabbrica, e quale disegno per quale
   misura. Gli altri restano con la loro foto finche' il disegno non
   arriva.

   NON E' UNO PER MODELLO: un Tintoretto 90/70 sono due profili diversi,
   il 90 sullo stipite e il 70 dall'altra parte. Percio' la chiave e' la
   MISURA, la stessa di COPRI_MISURE in app.js, e dove la misura di
   listino ne accoppia due il valore e' una coppia -- il visore li mostra
   tutti e due affiancati, che e' quello che poi arriva in cantiere.

   I file si chiamano col RUOLO, non come li ha esportati la fabbrica:
   tre disegni arrivati avevano il nome di un modello e la sezione di un
   altro. Il perche' sta in tools/coprifili-dxf.py. */
export const PROFILI = {
  listellare:   { l70: 'listellare-l70' },
  pierre:       { p70: 'pierre-p70' },
  tintoretto:   { t9070: ['tintoretto-t90', 'tintoretto-t70'],
                  t70: 'tintoretto-t70', t90: 'tintoretto-t90' },
  raffaello:    { r9070: ['raffaello-r90', 'raffaello-r70'],
                  r70: 'raffaello-r70', r90: 'raffaello-r90' },
  giotto:       { g9070: ['giotto-g90', 'giotto-g70'],
                  g70: 'giotto-g70', g90: 'giotto-g90' },
  leonardo:     { e9070: 'leonardo-e90', e90: 'leonardo-e90' },
  michelangelo: { h9070: ['michelangelo-h90', 'michelangelo-h70'],
                  h70: 'michelangelo-h70', h90: 'michelangelo-h90' },
  cartesio:     { c10070: ['cartesio-c100', 'cartesio-c70'],
                  c70: 'cartesio-c70', c100: 'cartesio-c100' },
  caravaggio:   { v90: 'caravaggio-v90' },
  tiziano:      { z90: 'tiziano-z90' },
  canaletto:    { n90: 'canaletto-n90' },
};

/** I disegni di una misura, sempre come lista (spesso di uno solo). */
function disegniDi(idCoprifilo, idMisura) {
  const m = PROFILI[idCoprifilo];
  if (!m) return [];
  const v = (idMisura && m[idMisura]) || m[Object.keys(m)[0]];
  return v ? [].concat(v) : [];
}

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
  for (const g of vivo.geo) g.dispose();
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
export async function apriVisore(dove, idCoprifilo, idMisura) {
  const file = disegniDi(idCoprifilo, idMisura);
  if (!file.length) { chiudiVisore(); return false; }
  // Se e' gia' quello che si sta guardando, si lascia stare. Cambiare
  // legno ridisegna il modale, ma il render e' sempre in rovere: rifare
  // il contesto WebGL a ogni clic sarebbe lavoro buttato, e il pezzo
  // ripartirebbe girato da capo mentre lo si sta guardando. Cambiare
  // MISURA invece cambia il pezzo, e li' si rifa'.
  const firma = file.join('+');
  if (vivo && vivo.firma === firma && dove.contains(vivo.tela)) return true;
  chiudiVisore();

  let dd;
  try {
    dd = await Promise.all(file.map(contorno));
  } catch {
    return false;                       // il JSON non c'e': meglio la foto
  }
  dd = dd.filter((d) => d && d.punti && d.punti.length >= 3);
  if (!dd.length) return false;

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

  // Le barre si affiancano lasciando fra loro un dito d'aria, e il
  // gruppo si centra: cosi' un 90/70 si legge per quello che e', due
  // pezzi diversi da montare insieme, e non due render da confrontare a
  // memoria.
  const ARIA = 26;
  const largoTot = dd.reduce((s, d) => s + d.larghezza, 0) + ARIA * (dd.length - 1);
  const geo = [];
  let x = -largoTot / 2;
  for (const d of dd) {
    const forma = new THREE.Shape();
    d.punti.forEach(([px, py], i) => (i ? forma.lineTo(px, py) : forma.moveTo(px, py)));
    forma.closePath();
    const g = new THREE.ExtrudeGeometry(forma, {
      depth: LUNGHEZZA, bevelEnabled: false, curveSegments: 1,
    });
    // in origine: il DXF ha lo zero dove capitava sul foglio del disegno
    g.translate(x, -d.spessore / 2, -LUNGHEZZA / 2);
    g.computeVertexNormals();
    geo.push(g);
    scena.add(new THREE.Mesh(g, mat));
    x += d.larghezza + ARIA;
  }

  const chiave = new THREE.DirectionalLight(0xffffff, 2.0);
  chiave.position.set(-180, 240, 260);
  scena.add(chiave);
  const riempi = new THREE.DirectionalLight(0xffffff, 0.3);
  riempi.position.set(220, 120, 180);
  scena.add(riempi);

  // La distanza si calcola sul pezzo invece di essere piantata: due
  // barre affiancate sono piu' larghe di una, e con la camera ferma il
  // 90/70 rischia i fianchi fuori campo.
  //
  // Si scala l'inquadratura che gia' funzionava, non si ricalcola da
  // zero: far entrare la SFERA che contiene il pezzo -- il conto giusto
  // in generale -- qui manda la camera al doppio della distanza, perche'
  // una barra e' piatta e della sfera ne riempie una fetta sottile. Il
  // pezzo veniva grande un terzo del riquadro.
  const RIF = Math.hypot(69, LUNGHEZZA);       // il primo profilo, su cui era tarata
  const k = Math.hypot(largoTot, LUNGHEZZA) / RIF;
  const cam = new THREE.PerspectiveCamera(26, largo / alto, 1, 5000);
  cam.position.set(300 * k, 200 * k, 430 * k);
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

  vivo = { firma, tela, rend, controlli, geo, mat, texture, giro: 0 };

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
export async function sezioneSvg(idCoprifilo, idMisura) {
  const file = disegniDi(idCoprifilo, idMisura);
  if (!file.length) return null;
  // In copertina UNO solo, il primo -- che nelle coppie e' il piu' alto,
  // quello che si vede entrando in una stanza. Il compagno si guarda nel
  // visore: in un quadratino di scheda due sezioni affiancate diventano
  // due francobolli e non si legge piu' ne' l'una ne' l'altra.
  let d;
  try { d = await contorno(file[0]); } catch { return null; }
  const via = d.punti.map(([x, y], i) =>
    `${i ? 'L' : 'M'}${x.toFixed(2)} ${(d.spessore - y).toFixed(2)}`).join('');
  return `<svg class="man-sezione" viewBox="-2 -2 ${d.larghezza + 4} `
       + `${d.spessore + 4}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`
       + `<path d="${via}Z" fill="var(--ivory-deep)" stroke="var(--ink)" `
       + `stroke-width="0.7" stroke-linejoin="round"/></svg>`;
}

/** Le misure vere dei profili di una misura, per scriverle sotto al visore. */
export async function misureProfilo(idCoprifilo, idMisura) {
  const file = disegniDi(idCoprifilo, idMisura);
  if (!file.length) return null;
  try {
    const dd = await Promise.all(file.map(contorno));
    return dd.map((d) => ({ larghezza: d.larghezza, spessore: d.spessore }));
  } catch {
    return null;
  }
}
