/* ============================================================
   IL DECORO DEL VETRO — fiori incisi e dipinti
   ------------------------------------------------------------
   Una prova per vedere come sta un sopraluce decorato.

   Non e' geometria: un fiore inciso non sporge, e' vetro
   lavorato piu' o meno a fondo. Si fa con tre mappe sul
   materiale, che e' anche come si fa in fabbrica — l'acido non
   toglie forma, toglie trasparenza, e il colore si dipinge:

     roughnessMap     dove e' inciso il vetro diffonde di piu'
     transmissionMap  e lascia passare meno luce
     map              e il colore del fiore, che la trasmissione
                      porta con se'

   I COLORI SONO QUELLI DI CASA: i laccati del listino piu'
   l'accento del sito. Un decoro con una tavolozza sua sarebbe
   un secondo gusto dentro alla stessa porta, e non c'e' motivo
   di inventarne uno quando la fabbrica ne ha gia' uno.

   Il disegno si genera con canvas invece di caricare un png:
   cosi' si ridisegna alla misura giusta di ogni sopraluce e non
   si stira. Un vetro largo e basso con un fiore ovalizzato si
   vede subito.
   ============================================================ */

import * as THREE from 'three';

/* La tavolozza, presa dal listino (LACCATI in app.js) e dal css del sito.
   Terracotta e' l'accento, salvia e notte sono due laccati veri, e l'ottone
   e' il tono del legno: caldo e freddo si tengono in equilibrio. */
const TERRACOTTA = '#a9472f';   // --brass
const NOTTE = '#39465a';        // laccato Blu Notte
const SALVIA = '#8b9c85';       // laccato Verde Salvia
const OTTONE = '#c8a271';       // il tono caldo del legno
const VETRO = '#e8eef0';        // il colore del vetro satinato, come fondo

/* Quanto e' inciso: il fondo resta satinato, il fiore lo e' di piu'. */
const RUG_FONDO = 0.62;
const RUG_FIORE = 1.0;

/* E quanta luce passa. Il fiore ne lascia passare meno — e' quello che lo
   stacca — ma non troppo, o il colore va a fondo e diventa una macchia. */
const TRA_FONDO = 1.0;
const TRA_FIORE = 0.58;

const PX_PER_MM = 1.6;

/* ---------------------------------------------------------------- disegno */

/** Un petalo: una goccia che parte dal centro. */
function petalo(g, r0, r1, largo) {
  g.beginPath();
  g.moveTo(r0, 0);
  g.bezierCurveTo(r0 + largo * 0.3, -largo * 0.55, r1 - largo * 0.3, -largo * 0.5, r1, 0);
  g.bezierCurveTo(r1 - largo * 0.3, largo * 0.5, r0 + largo * 0.3, largo * 0.55, r0, 0);
  g.closePath();
  g.fill();
}

/** Un fiore intero: petali in giro piu' il cuore, di due colori. */
function fiore(g, x, y, r, petali, giro, colPetalo, colCuore) {
  g.save();
  g.translate(x, y);
  g.rotate(giro);
  g.fillStyle = colPetalo;
  for (let i = 0; i < petali; i++) {
    g.save();
    g.rotate((i * 2 * Math.PI) / petali);
    petalo(g, r * 0.22, r, r * 0.62);
    g.restore();
  }
  g.fillStyle = colCuore;
  g.beginPath();
  g.arc(0, 0, r * 0.22, 0, 2 * Math.PI);
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
 * Il motivo, disegnato con la tavolozza che gli si passa.
 *
 * La stessa funzione fa il colore e i due dati: cambia solo di che tinta si
 * riempie ogni cosa. Due disegni separati vorrebbero dire due disegni che
 * prima o poi non coincidono piu', e il colore uscirebbe fuori dall'incisione.
 *
 * Simmetrico rispetto all'asse verticale, che e' come si decorano i sopraluci:
 * si guardano di fronte, e una composizione storta si legge come un errore di
 * montaggio.
 *
 * NIENTE FILETTO lungo il perimetro: le sue due righe orizzontali, cosi'
 * vicine al telaio, sembravano un difetto del vetro e non una decorazione.
 */
function dibuja(anchoMm, altoMm, p) {
  const c = document.createElement('canvas');
  c.width = Math.max(64, Math.round(anchoMm * PX_PER_MM));
  c.height = Math.max(64, Math.round(altoMm * PX_PER_MM));
  const g = c.getContext('2d');
  const W = c.width, H = c.height;

  g.fillStyle = p.fondo;
  g.fillRect(0, 0, W, H);
  g.lineCap = 'round';

  const cx = W / 2, cy = H / 2;
  const R = Math.min(H * 0.30, W * 0.10);

  for (const lado of [-1, 1]) {
    g.save();
    g.translate(cx, cy);
    g.scale(lado, 1);

    g.strokeStyle = p.tralcio;
    tralcio(g, R * 0.9, 0, W * 0.40, -H * 0.06, H * 0.18, Math.max(1.2, H * 0.009));
    tralcio(g, R * 0.9, 0, W * 0.34, H * 0.14, -H * 0.10, Math.max(1.0, H * 0.007));

    g.fillStyle = p.foglia;
    foglia(g, R * 1.15, -H * 0.015, W * 0.075, H * 0.05, -0.55);
    foglia(g, W * 0.16, H * 0.055, W * 0.065, H * 0.042, 0.5);
    foglia(g, W * 0.30, -H * 0.10, W * 0.06, H * 0.038, -0.9);
    foglia(g, W * 0.115, -H * 0.075, W * 0.055, H * 0.035, -1.2);

    fiore(g, W * 0.235, H * 0.045, R * 0.5, 6, 0.4, p.petalo2, p.cuore);
    fiore(g, W * 0.375, -H * 0.055, R * 0.62, 6, -0.3, p.petalo, p.cuore);
    fiore(g, W * 0.315, H * 0.145, R * 0.34, 5, 0.9, p.petalo2, p.cuore);

    g.restore();
  }

  // il fiore in mezzo per ultimo, cosi' i tralci gli passano sotto
  fiore(g, cx, cy, R, 8, Math.PI / 8, p.petalo, p.cuore);
  fiore(g, cx, cy, R * 0.45, 6, 0, p.petalo2, p.cuore);

  return c;
}

/* --------------------------------------------------------------- tavolozze */

const gris = (v) => {
  const n = Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgb(${n},${n},${n})`;
};

/** Tutto il motivo di un solo valore: serve per le due mappe di dati. */
const plana = (fondo, motivo) => ({
  fondo: gris(fondo), petalo: gris(motivo), petalo2: gris(motivo),
  cuore: gris(motivo), foglia: gris(motivo), tralcio: gris(motivo),
});

const COLORE = {
  fondo: VETRO, petalo: TERRACOTTA, petalo2: NOTTE,
  cuore: OTTONE, foglia: SALVIA, tralcio: SALVIA,
};

const textura = (canvas, datos) => {
  const t = new THREE.CanvasTexture(canvas);
  // le due mappe di dati NON sono colore e non vanno convertite
  t.colorSpace = datos ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

/**
 * Incide e dipinge i fiori sul vetro.
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
    // il canvas si disegna alla misura vera del pezzo: 1 px = 1 mm
    mat.map = encuadra(textura(dibuja(du, dv, COLORE), false));
    mat.roughnessMap = encuadra(textura(dibuja(du, dv, plana(RUG_FONDO, RUG_FIORE)), true));
    mat.transmissionMap = encuadra(textura(dibuja(du, dv, plana(TRA_FONDO, TRA_FIORE)), true));

    /* I valori del materiale vanno a fondo scala perche' le mappe
       MOLTIPLICANO. La rugosita' lasciata a 0,62 avrebbe portato il fondo a
       0,38 e il vetro avrebbe cominciato a specchiare; e il colore lasciato
       sul suo azzurrino avrebbe spento i fiori, perche' il fondo della mappa
       porta gia' quella tinta. */
    mat.roughness = 1.0;
    mat.color.set(0xffffff);
    mat.needsUpdate = true;
    o.material = mat;
  });
}
