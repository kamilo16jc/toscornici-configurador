/* ============================================================
   LEGGERE UN DXF NEL BROWSER

   Tutto quello che sa leggere i disegni della fabbrica finora stava in
   Python, e una pagina che si apre con due clic non lo puo' chiamare.
   Qui c'e' lo stesso mestiere, portato in JavaScript: le stesse regole,
   trovate una per una sbattendoci contro, e ognuna col perche'.

   NON E' UN LETTORE DXF GENERALE. Legge LINE, ARC e TEXT, che e' tutto
   quello che l'ufficio tecnico di Toscocornici usa: trecentosessantadue
   disegni e nient'altro dentro.
   ============================================================ */

const PASSO_ARCO = 2.0;   // gradi per segmento: sotto il decimo di mm
const SNAP = 0.01;        // due punti piu' vicini di cosi' sono lo stesso
const CUCI = 1.0;         // e fin qui si cuce, ma solo fra due capi liberi

/**
 * Le entita' del file, come oggetti {tipo, 8: strato, 10: x, ...}.
 *
 * I codici di gruppo delle LINE NON sono in coppia come uno se li
 * aspetta: prima 10 e 11 (le due x), poi 20 e 21 (le due y). Ci si
 * perde mezz'ora la prima volta.
 */
export function leggi(testo) {
  const righe = testo.split(/\r?\n/).map((r) => r.trim());
  const ent = [];
  let cur = null;
  for (let i = 0; i < righe.length - 1; i += 2) {
    const cod = righe[i], val = righe[i + 1];
    if (cod === '0') {
      if (cur) ent.push(cur);
      cur = ['LINE', 'ARC', 'TEXT'].includes(val) ? { tipo: val } : null;
    } else if (cur && /^\d+$/.test(cod) && !(cod in cur)) {
      cur[cod] = val;
    }
  }
  if (cur) ent.push(cur);
  return ent;
}

/** L'entita' come catena di punti. Gli archi si spezzano. */
export function punti(e) {
  const n = (k) => parseFloat(e[k]);
  if (e.tipo === 'LINE') return [[n(10), n(20)], [n(11), n(21)]];
  if (e.tipo !== 'ARC') return [[n(10), n(20)]];
  const cx = n(10), cy = n(20), r = n(40);
  let a0 = n(50), a1 = n(51);
  if (a1 <= a0) a1 += 360;
  const passi = Math.max(2, Math.ceil((a1 - a0) / PASSO_ARCO));
  const fuori = [];
  for (let k = 0; k <= passi; k++) {
    const a = (a0 + (a1 - a0) * k / passi) * Math.PI / 180;
    fuori.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return fuori;
}

export function scatola(ps) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of ps) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { x0, x1, y0, y1 };
}

export const area = (p) => {
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length];
    s += p[i][0] * q[1] - q[0] * p[i][1];
  }
  return s / 2;
};

/**
 * Spezza i segmenti dove ci finisce sopra il capo di un altro.
 *
 * Il Canaletto lo ha fatto vedere: il suo incastro e' disegnato con una
 * linea che ARRIVA A META' del fianco, non a un vertice. Per il disegno
 * e' un raccordo normale; per un grafo no -- se quel punto non e' un
 * nodo condiviso, la linea resta appesa e potando gli appesi se ne va
 * mezzo profilo.
 */
export function spezzaAT(segs, chiavi) {
  const fuori = [];
  for (const [a, b] of segs) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L2 = dx * dx + dy * dy;
    if (L2 < 1e-12) continue;
    const dentro = [];
    for (const p of chiavi) {
      const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2;
      if (!(t > 1e-6 && t < 1 - 1e-6)) continue;
      const qx = a[0] + dx * t, qy = a[1] + dy * t;
      if (Math.hypot(p[0] - qx, p[1] - qy) < SNAP) dentro.push([t, p]);
    }
    if (!dentro.length) { fuori.push([a, b]); continue; }
    dentro.sort((u, v) => u[0] - v[0]);
    let prec = a;
    for (const [, p] of dentro) { fuori.push([prec, p]); prec = p; }
    fuori.push([prec, b]);
  }
  return fuori;
}

/** Il grafo dei segmenti, cucito dove il disegno non chiude. */
function grafo(segs, cuci = CUCI) {
  const nodo = new Map(), pos = new Map(), archi = new Map();
  const idDi = (p) => {
    const k = `${Math.round(p[0] / SNAP)},${Math.round(p[1] / SNAP)}`;
    if (!nodo.has(k)) nodo.set(k, nodo.size);
    const i = nodo.get(k);
    pos.set(i, p);
    return i;
  };
  for (const [a, b] of segs) {
    const ia = idDi(a), ib = idDi(b);
    if (ia === ib) continue;
    if (!archi.has(ia)) archi.set(ia, new Set());
    if (!archi.has(ib)) archi.set(ib, new Set());
    archi.get(ia).add(ib); archi.get(ib).add(ia);
  }
  /* I disegni non chiudono al centesimo: fra un'entita' e la successiva
     restano capi liberi a mezzo millimetro. Si cuciono, ma SOLO fra due
     capi liberi -- dove il disegno gia' chiude non si tocca niente, e un
     dettaglio staccato resta staccato perche' i suoi capi non hanno un
     compagno vicino. */
  for (let giro = 0; giro < 200; giro++) {
    const soli = [...archi.keys()].filter((n) => archi.get(n).size === 1);
    let coppia = null, dist = cuci;
    for (let i = 0; i < soli.length; i++) {
      for (let j = i + 1; j < soli.length; j++) {
        const a = soli[i], b = soli[j];
        if (archi.get(a).has(b)) continue;
        const d = Math.hypot(pos.get(a)[0] - pos.get(b)[0],
                             pos.get(a)[1] - pos.get(b)[1]);
        if (d < dist) { dist = d; coppia = [a, b]; }
      }
    }
    if (!coppia) break;
    archi.get(coppia[0]).add(coppia[1]);
    archi.get(coppia[1]).add(coppia[0]);
  }
  return { pos, archi };
}

/**
 * Tutte le facce chiuse del disegno.
 *
 * Da ogni lato ORIENTATO si prosegue con la virata minima a sinistra, e
 * ogni lato orientato appartiene a esattamente una faccia.
 *
 * ATTENZIONE ALLA MARCIA INDIETRO: tornare sui propri passi e' virata
 * zero, e cercando il minimo vincerebbe sempre -- il cammino
 * rimbalzerebbe sullo stesso lato e ogni faccia uscirebbe di due punti e
 * area zero. Va messa in fondo al giro, non in cima: si prende solo se
 * non c'e' nient'altro, che e' quello che serve sui rami morti.
 */
export function facce(segs, cuci = CUCI) {
  const { pos, archi } = grafo(segs, cuci);
  if (!archi.size) return [];
  const ang = (a, b) => Math.atan2(pos.get(b)[1] - pos.get(a)[1],
                                   pos.get(b)[0] - pos.get(a)[0]);
  const daFare = new Set();
  for (const [a, vs] of archi) for (const b of vs) daFare.add(`${a}|${b}`);
  const fuori = [];
  while (daFare.size) {
    const via = daFare.values().next().value;
    let [a, b] = via.split('|').map(Number);
    const giro = [], lati = [];
    for (let k = 0; k < 40000; k++) {
      lati.push(`${a}|${b}`);
      giro.push(pos.get(a));
      const entrata = ang(b, a);
      let scelta = null, meglio = Infinity;
      for (const c of archi.get(b)) {
        let d = (entrata - ang(b, c)) % (2 * Math.PI);
        if (d < 0) d += 2 * Math.PI;
        if (d < 1e-9) d = 2 * Math.PI;      // la marcia indietro, in fondo
        if (d < meglio) { meglio = d; scelta = c; }
      }
      if (scelta === null) break;
      [a, b] = [b, scelta];
      if (`${a}|${b}` === via) break;
    }
    for (const l of lati) daFare.delete(l);
    if (giro.length >= 3 && Math.abs(area(giro)) > 1) fuori.push(giro);
  }
  if (!fuori.length) return [];
  // la piu' grande e' il giro di fuori: gira al contrario, e si toglie
  const grande = fuori.reduce((m, g) => Math.abs(area(g)) > Math.abs(area(m)) ? g : m);
  const verso = area(grande) > 0 ? -1 : 1;
  return fuori.filter((g) => g !== grande && area(g) * verso > 0)
    .map((g) => (area(g) > 0 ? g : [...g].reverse()))
    .sort((x, y) => Math.abs(area(y)) - Math.abs(area(x)));
}

/** Il testo «MOD. ...»: come il disegno si chiama davvero.
 *  Il NOME DEL FILE non si guarda -- in archivio sono incrociati a
 *  coppie, GENOVA.dxf contiene il 600-6V e viceversa. */
export function etichetta(ent) {
  for (const e of ent) {
    const t = (e['1'] || '').trim();
    if (e.tipo === 'TEXT' && /^MOD\.?\s*\S/i.test(t)) {
      return t.replace(/^MOD\.?\s*/i, '').trim();
    }
  }
  return null;
}

/** Le quote scritte nei testi: LUCE NETTA=792, EST. TELAIO=2140... */
export function quote(ent) {
  const q = {};
  for (const e of ent) {
    if (e.tipo !== 'TEXT') continue;
    const t = (e['1'] || '').replace(/\s/g, '').toUpperCase();
    const m = t.match(/^([A-Z.]+)=(\d+(?:[.,]\d+)?)$/);
    if (m) (q[m[1].replace(/\.$/, '')] ||= []).push(parseFloat(m[2].replace(',', '.')));
  }
  return q;
}

/** Le isole del foglio: le viste stanno lontane fra loro.
 *  Si guardano le SCATOLE, non i capi: un alzato non e' una linea sola
 *  -- sono riquadri staccati, la maniglia, le mitre -- e unendo per capi
 *  verrebbe fuori in dieci pezzi invece che in una vista. */
export function isole(ent, aria = 6) {
  const box = ent.map((e) => scatola(punti(e)));
  const g = ent.map((_, i) => i);
  const trova = (i) => { while (g[i] !== i) { g[i] = g[g[i]]; i = g[i]; } return i; };
  for (let i = 0; i < ent.length; i++) {
    for (let j = i + 1; j < ent.length; j++) {
      const a = box[i], b = box[j];
      if (a.x0 - aria <= b.x1 && b.x0 - aria <= a.x1
          && a.y0 - aria <= b.y1 && b.y0 - aria <= a.y1) g[trova(i)] = trova(j);
    }
  }
  const fuori = new Map();
  ent.forEach((e, i) => {
    const k = trova(i);
    if (!fuori.has(k)) fuori.set(k, []);
    fuori.get(k).push(e);
  });
  return [...fuori.values()];
}

/** Tutti i segmenti di un gruppo di entita', pronti per facce(). */
export function segmenti(ent) {
  const segs = [], capi = [];
  for (const e of ent) {
    const p = punti(e);
    for (let i = 0; i + 1 < p.length; i++) segs.push([p[i], p[i + 1]]);
    capi.push(p[0], p[p.length - 1]);
  }
  return spezzaAT(segs, capi);
}
