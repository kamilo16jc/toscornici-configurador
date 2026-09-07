/* ============================================================
   IL DECORO DEL VETRO — fiori incisi
   ------------------------------------------------------------
   Una prova per vedere come sta un sopraluce decorato.

   Non e' geometria: un fiore inciso non sporge, e' vetro
   lavorato piu' o meno a fondo. Si fa con due mappe sul
   materiale, che e' anche come si fa in fabbrica —
   l'acidatura non toglie forma, toglie trasparenza:

     roughnessMap     dove il fiore e' inciso il vetro
                      diffonde di piu' e si vede bianco
     transmissionMap  e lascia passare meno luce, cosi' il
                      motivo si stacca dal fondo

   Il disegno si genera con canvas invece di caricare un png:
   cosi' si ridisegna alla misura giusta di ogni sopraluce e
   non si stira. Un vetro largo e basso con un fiore ovalizzato
   si vede subito.
   ============================================================ */

import * as THREE from 'three';

/* Quanto e' satinato il fondo e quanto il fiore, da 0 a 1. Il fondo non e'
   zero: il vetro resta comunque satinato, il fiore e' solo piu' inciso. */
const FONDO = 0.62;
const FIORE = 1.0;

/* E quanta luce passa. Il fiore ne lascia passare meno, ed e' quello che lo
   fa vedere: senza questo il motivo si perde nel bianco del fondo. */
const TRASM_FONDO = 1.0;
const TRASM_FIORE = 0.45;

const PX_PER_MM = 1.6;      // risoluzione del disegno

/** Un petalo: una goccia che parte dal centro. */
function petalo(g, r0, r1, largo) {
  g.beginPath();
  g.moveTo(r0, 0);
  g.bezierCurveTo(r0 + largo * 0.3, -largo * 0.55, r1 - largo * 0.3, -largo * 0.5, r1, 0);
  g.bezierCurveTo(r1 - largo * 0.3, largo * 0.5, r0 + largo * 0.3, largo * 0.55, r0, 0);
  g.closePath();
  g.fill();
}

/** Un fiore intero: n petali in giro piu' il cuore. */
function fiore(g, x, y, r, petali = 6, giro = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(giro);
  for (let i = 0; i < petali; i++) {
    g.save();
    g.rotate((i * 2 * Math.PI) / petali);
    petalo(g, r * 0.22, r, r * 0.62);
    g.restore();
  }
  g.beginPath();
  g.arc(0, 0, r * 0.2, 0, 2 * Math.PI);
  g.fill();
  g.restore();
}

/** Una foglia lanceolata, appesa a un punto e orientata. */
function foglia(g, x, y, largo, ancho, giro) {
  g.save();
  g.translate(x, y);
  g.rotate(giro);
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(largo * 0.45, -ancho, largo, 0);
  g.quadraticCurveTo(largo * 0.45, ancho, 0, 0);
  g.closePath();
  g.fill();
  g.restore();
}

/** Il tralcio: una curva che parte dal centro e se ne va di lato. */
function tralcio(g, x0, y0, x1, y1, curva, grosso) {
  g.beginPath();
  g.moveTo(x0, y0);
  g.quadraticCurveTo((x0 + x1) / 2, y0 + curva, x1, y1);
  g.lineWidth = grosso;
  g.stroke();
}

/**
 * Disegna il motivo su un canvas.
 *
 * Simmetrico rispetto all'asse verticale, che e' come si decorano i
 * sopraluci: si guardano da sotto e di fronte, e una composizione storta
 * si legge come un errore di montaggio.
 */
function dibuja(anchoMm, altoMm, blanco, fondo) {
  const c = document.createElement('canvas');
  c.width = Math.max(64, Math.round(anchoMm * PX_PER_MM));
  c.height = Math.max(64, Math.round(altoMm * PX_PER_MM));
  const g = c.getContext('2d');
  const W = c.width, H = c.height;

  g.fillStyle = fondo;
  g.fillRect(0, 0, W, H);
  g.fillStyle = blanco;
  g.strokeStyle = blanco;
  g.lineCap = 'round';

  // un filetto lungo il perimetro, che incornicia
  const m = Math.min(W, H) * 0.075;
  g.lineWidth = Math.max(1.5, H * 0.012);
  g.strokeRect(m, m, W - 2 * m, H - 2 * m);

  const cx = W / 2, cy = H / 2;
  const R = Math.min(H * 0.30, W * 0.10);   // taglia del fiore centrale

  // il fiore in mezzo, con la sua corona
  fiore(g, cx, cy, R, 8, Math.PI / 8);
  fiore(g, cx, cy, R * 0.45, 6, 0);

  // e due tralci che se ne vanno ai lati, uguali e specchiati
  for (const lado of [-1, 1]) {
    g.save();
    g.translate(cx, cy);
    g.scale(lado, 1);

    tralcio(g, R * 0.9, 0, W * 0.40, -H * 0.06, H * 0.18, Math.max(1.2, H * 0.009));
    tralcio(g, R * 0.9, 0, W * 0.34, H * 0.14, -H * 0.10, Math.max(1.0, H * 0.007));

    fiore(g, W * 0.235, H * 0.045, R * 0.5, 6, 0.4);
    fiore(g, W * 0.375, -H * 0.055, R * 0.62, 6, -0.3);
    fiore(g, W * 0.315, H * 0.145, R * 0.34, 5, 0.9);

    foglia(g, R * 1.15, -H * 0.015, W * 0.075, H * 0.05, -0.55);
    foglia(g, W * 0.16, H * 0.055, W * 0.065, H * 0.042, 0.5);
    foglia(g, W * 0.30, -H * 0.10, W * 0.06, H * 0.038, -0.9);
    foglia(g, W * 0.115, -H * 0.075, W * 0.055, H * 0.035, -1.2);

    g.restore();
  }
  return c;
}

const gris = (v) => {
  const n = Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgb(${n},${n},${n})`;
};

const textura = (canvas) => {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.NoColorSpace;   // sono dati, non colore
  t.anisotropy = 4;
  return t;
};

/**
 * Incide i fiori sul vetro.
 *
 * Il materiale si CLONA prima di toccarlo: quello del motore lo condividono
 * tutti i vetri del catalogo, e inciderlo li' vorrebbe dire trovarsi i fiori
 * anche sulla Pausania.
 *
 * La misura non gliela diamo: si ricava dalle uv della maglia, che sono gia'
 * in millimetri. Cosi' non c'e' un secondo numero che puo' smettere di
 * corrispondere al primo.
 *
 * @param {THREE.Object3D} obj   il gruppo tessuto del vetro
 */
export function incideFiori(obj) {
  obj.traverse((o) => {
    if (!o.isMesh || !o.material || (o.material.transmission ?? 0) <= 0) return;

    /* LE UV DEL MOTORE SONO IN MILLIMETRI, non da 0 a 1: le usa cosi' perche'
       la venatura del legno deve ripetersi ogni tot centimetri di tavola, non
       una volta per pezzo. Su questo vetro andavano da -16 a 872,5.
       Messa cosi', una texture normale si piastrellava ottocento volte e il
       fiore spariva. Quindi non si tocca la maglia: si misura il rettangolo
       delle uv e si dice alla texture di coprire esattamente quello. */
    const uv = o.geometry.attributes.uv;
    if (!uv) return;
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i), v = uv.getY(i);
      if (u < u0) u0 = u; if (u > u1) u1 = u;
      if (v < v0) v0 = v; if (v > v1) v1 = v;
    }
    const du = u1 - u0, dv = v1 - v0;
    if (!(du > 0 && dv > 0)) return;

    const encuadra = (t) => {
      t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
      t.repeat.set(1 / du, 1 / dv);
      t.offset.set(-u0 / du, -v0 / dv);
      return t;
    };

    const mat = o.material.clone();
    // il canvas si disegna alla misura vera del pezzo: 1 px = 1 mm, e il
    // fiore non si ovalizza su un sopraluce largo e basso.
    const rug = encuadra(textura(dibuja(du, dv, gris(FIORE), gris(FONDO))));
    const tra = encuadra(textura(dibuja(du, dv, gris(TRASM_FIORE), gris(TRASM_FONDO))));

    /* I due valori del materiale si portano a fondo scala perche' le mappe
       MOLTIPLICANO: lasciando 0,62 di rugosita' il fondo sarebbe finito a
       0,38 e il vetro avrebbe cominciato a specchiare. */
    mat.roughness = 1.0;
    mat.roughnessMap = rug;
    mat.transmissionMap = tra;
    mat.needsUpdate = true;
    o.material = mat;
  });
}
