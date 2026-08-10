/* ============================================================
   SCHEMI QUOTATI — la porta di fronte, con le frecce

   Stessa filosofia degli schemi delle aperture: millimetri veri,
   tinte dalle variabili del foglio, SVG scritto a mano dal codice.
   Cambiano due cose, e per un motivo.

   1. LA VISTA E' L'ALZATO, non l'assonometria. Una quota storta non si
      legge: in assonometria 900 mm verrebbero disegnati lunghi 830, e
      la freccia direbbe una misura diversa dal numero che le sta
      accanto. Il muro invece si quota in pianta, perche' lo spessore
      di frontale non si vede affatto.

   2. NON C'E' UN CICLO. Gli schemi delle aperture girano sempre; qui
      non c'e' niente da ripetere. Il disegno si muove quando il
      cliente cambia una misura, e si ferma appena e' arrivato: la
      transizione serve a far capire CHE COSA e' cambiato, che con due
      numeri in una casella non si vede.
   ============================================================ */

import { proj, pushSolid, pushQuad, conVista, ALZATO, PIANTA, MISURE }
  from './aperture.js';

const { T, F } = MISURE;

const T_MURO  = { front: 'var(--f-wall)',  back: 'var(--f-wall)',
                  edge: 'var(--f-jamb)',   top: 'var(--f-jamb)' };
const T_TELAIO = { front: 'var(--f-frame)', back: 'var(--f-frame)',
                   edge: 'var(--f-jamb)',   top: 'var(--f-jamb)' };
const T_ANTA  = { front: 'var(--f-front)', back: 'var(--f-back)',
                  edge: 'var(--f-edge)',   top: 'var(--f-edge)' };

/* ---------- la quota: due frecce, due richiami e un numero ---------- */

/**
 * Una quota fra due punti del mondo. Le punte e il testo si misurano
 * in unita' del disegno (sw), non in millimetri: devono restare della
 * stessa taglia mentre la porta cresce, se no una porta da 2800
 * finirebbe con le frecce grosse il doppio di una da 1700.
 */
function quota(da, a, testo, sw, opt) {
  opt = opt || {};
  const p = proj(da[0], da[1], da[2]);
  const q = proj(a[0], a[1], a[2]);
  const dx = q[0] - p[0], dy = q[1] - p[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;          // lungo la quota
  const nx = -uy, ny = ux;                     // di traverso
  const pu = sw * 4.2;                         // punta della freccia
  const num = (n) => n.toFixed(1);

  const punta = (x, y, verso) => {
    const bx = x + ux * pu * verso, by = y + uy * pu * verso;
    return `<path d="M${num(x)} ${num(y)} L${num(bx + nx * pu * 0.36)} `
         + `${num(by + ny * pu * 0.36)} L${num(bx - nx * pu * 0.36)} `
         + `${num(by - ny * pu * 0.36)}Z" fill="var(--terra)"/>`;
  };

  let out = `<path d="M${num(p[0])} ${num(p[1])} L${num(q[0])} ${num(q[1])}" `
          + `stroke="var(--terra)" stroke-width="${num(sw * 1.5)}" fill="none"/>`
          + punta(p[0], p[1], 1) + punta(q[0], q[1], -1);

  // il numero sta SOPRA la linea, staccato: dentro la porta si
  // confonderebbe con le bugne
  const mx = (p[0] + q[0]) / 2 + nx * sw * 5.5;
  const my = (p[1] + q[1]) / 2 + ny * sw * 5.5;
  const gira = opt.verticale ? ` transform="rotate(-90 ${num(mx)} ${num(my)})"` : '';
  out += `<text x="${num(mx)}" y="${num(my)}"${gira} fill="var(--terra)" `
       + `text-anchor="middle" dominant-baseline="middle" font-weight="600" `
       + `font-family="Jost, Verdana, sans-serif" font-size="${num(sw * 13)}" `
       + `letter-spacing="${num(sw * 0.6)}">${testo}</text>`;
  return out;
}

/** Il filo sottile che porta dal pezzo misurato fino alla quota. */
function richiamo(da, a, sw) {
  const p = proj(da[0], da[1], da[2]);
  const q = proj(a[0], a[1], a[2]);
  return `<path d="M${p[0].toFixed(1)} ${p[1].toFixed(1)} `
       + `L${q[0].toFixed(1)} ${q[1].toFixed(1)}" stroke="var(--terra)" `
       + `stroke-width="${(sw * 0.8).toFixed(1)}" opacity=".55" fill="none"/>`;
}

/* ---------- disegno comune: strati, ordine, cornice ---------- */

function componi(svg, strati, extra, margine, punti) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const tutti = [];
  for (const s of strati) { s.sort((a, b) => a.z - b.z); tutti.push(...s); }
  for (const f of tutti) {
    for (const m of f.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)) {
      const x = +m[1], y = +m[2];
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  // Le quote stanno fuori dai solidi: se non entrano qui, il riquadro
  // le taglia via e restano frecce che nessuno vede. Prima succedeva
  // esattamente questo -- la larghezza spariva del tutto.
  for (const P of punti || []) {
    const q = proj(P[0], P[1], P[2]);
    if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0];
    if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
  }
  // Il margine e' una FRAZIONE di quanto e' grande il disegno, non un
  // numero di millimetri: dentro ci deve stare anche il numero della
  // quota, che cresce insieme a tutto il resto. Dandolo in millimetri
  // il "108" del muro finiva mezzo fuori dal riquadro.
  const m = Math.max(x1 - x0, y1 - y0) * margine;
  const vb = [x0 - m, y0 - m, (x1 - x0) + 2 * m, (y1 - y0) + 2 * m];
  // Sul lato LUNGO, non sul corto. E' il lungo che decide quanto il
  // disegno viene rimpicciolito per entrare nel riquadro: misurando sul
  // corto, la pianta del muro -- larga e bassa -- si ritrovava le
  // frecce spesse mezzo pixel, cioe' invisibili.
  const sw = Math.max(vb[2], vb[3]) / 230;

  let out = '';
  for (const f of tutti) {
    out += `<path d="${f.d}" fill="${f.fill}"`
         + (f.noStroke ? '' : ` stroke="var(--ink)" stroke-width="${sw.toFixed(1)}"`
            + ' stroke-linejoin="round"') + '/>';
  }
  svg.setAttribute('viewBox', vb.map((n) => n.toFixed(0)).join(' '));
  svg.innerHTML = out + extra(sw);
}

/* ---------- 1. la luce: larghezza e altezza ---------- */

function disegnaLuce(svg, w, h) {
  conVista(ALZATO, () => {
    const L = [];
    // muro attorno al vano, quel tanto che serve a far capire che il
    // buco e' un buco
    const mu = Math.max(260, w * 0.34);
    for (const d of [1, -1]) {
      pushSolid(L, [d * (w / 2 + F), 0, -30], [d * mu, 0, 0], [0, h + F, 0],
                [0, 0, 60], T_MURO);
      pushSolid(L, [d * w / 2, 0, -20], [d * F, 0, 0], [0, h + F, 0],
                [0, 0, 40], T_TELAIO);
    }
    pushSolid(L, [-w / 2 - F, h, -20], [w + 2 * F, 0, 0], [0, F, 0],
              [0, 0, 40], T_TELAIO);
    // l'anta riempie la luce: e' quello che il cliente sta misurando
    pushSolid(L, [-w / 2, 0, 0], [w, 0, 0], [0, h, 0], [0, 0, T], T_ANTA);
    const mg = Math.min(105, w * 0.16);
    for (const [v0, v1] of [[170, h * 0.43], [h * 0.51, h - 170]]) {
      pushQuad(L, [[-w / 2 + mg, v0, T + 1], [w / 2 - mg, v0, T + 1],
                   [w / 2 - mg, v1, T + 1], [-w / 2 + mg, v1, T + 1]],
               'var(--f-rec)', { force: true });
    }

    // le quote stanno FUORI dal muro: sovrapposte al disegno si
    // leggono male e sembrano parte della porta
    const giu = -Math.max(300, h * 0.16);
    const lato = w / 2 + F + mu + Math.max(300, w * 0.34);

    componi(svg, [L], (sw) =>
      richiamo([-w / 2, 0, 0], [-w / 2, giu - sw * 12, 0], sw)
      + richiamo([w / 2, 0, 0], [w / 2, giu - sw * 12, 0], sw)
      + richiamo([w / 2 + F + mu, 0, 0], [lato + sw * 12, 0, 0], sw)
      + richiamo([w / 2 + F + mu, h, 0], [lato + sw * 12, h, 0], sw)
      + quota([-w / 2, giu, 0], [w / 2, giu, 0], Math.round(w), sw)
      + quota([lato, 0, 0], [lato, h, 0], Math.round(h), sw, { verticale: true }),
      0.085,
      [[-w / 2, giu, 0], [w / 2, giu, 0], [lato, 0, 0], [lato, h, 0]]);
  });
}

/* ---------- 2. il muro: spessore, in pianta ---------- */

function disegnaMuro(svg, w, muro, allargato) {
  conVista(PIANTA, () => {
    const L = [];
    const mu = Math.max(300, w * 0.42);
    // In pianta la profondita' e' l'altezza: si danno spessori veri in
    // y, se no i pezzi si accavallano in ordine casuale.
    for (const d of [1, -1]) {
      pushSolid(L, [d * (w / 2 + F), 0, -muro / 2], [d * mu, 0, 0], [0, 40, 0],
                [0, 0, muro], T_MURO);
      pushSolid(L, [d * w / 2, 0, -muro / 2], [d * F, 0, 0], [0, 60, 0],
                [0, 0, muro], T_TELAIO);
    }
    // l'anta, di taglio: e' lei a dire dove sta il filo della porta
    pushSolid(L, [-w / 2, 0, -T / 2], [w, 0, 0], [0, 80, 0], [0, 0, T], T_ANTA);

    const giu = -(w / 2 + F + mu) - Math.max(240, w * 0.3);
    componi(svg, [L], (sw) =>
      richiamo([giu - sw * 12, 1, -muro / 2], [w / 2, 1, -muro / 2], sw)
      + richiamo([giu - sw * 12, 1, muro / 2], [w / 2, 1, muro / 2], sw)
      + quota([giu, 1, -muro / 2], [giu, 1, muro / 2], Math.round(muro), sw),
      0.12,
      [[giu, 1, -muro / 2], [giu, 1, muro / 2]]);
  });
}

/* ---------- il movimento: si va verso la misura nuova ---------- */

// Abbastanza da vedere che cosa si e' mosso, abbastanza poco da non
// far aspettare chi sta scrivendo un numero nella casella.
const CORSA = 420;
const molla = (u) => 1 - (1 - u) * (1 - u) * (1 - u);

function animatore(disegna) {
  let ora = null, verso = null, da = null, t0 = 0, gira = false;

  const passo = (adesso) => {
    const u = Math.min(1, (adesso - t0) / CORSA);
    const k = molla(u);
    ora = {};
    for (const c of Object.keys(verso)) {
      ora[c] = typeof verso[c] === 'number'
        ? da[c] + (verso[c] - da[c]) * k
        : verso[c];
    }
    disegna(ora);
    if (u < 1) requestAnimationFrame(passo);
    else { gira = false; ora = { ...verso }; }
  };

  return (bersaglio) => {
    if (!ora) { ora = { ...bersaglio }; disegna(ora); verso = { ...bersaglio }; return; }
    // niente da fare se il numero non e' cambiato: ridisegnare a ogni
    // battuta di tasto farebbe tremare lo schema mentre si scrive
    const uguale = Object.keys(bersaglio)
      .every((c) => bersaglio[c] === verso[c]);
    if (uguale) return;
    da = { ...ora };
    verso = { ...bersaglio };
    t0 = performance.now();
    if (!gira) { gira = true; requestAnimationFrame(passo); }
  };
}

const fermo = matchMedia('(prefers-reduced-motion: reduce)').matches;

function collega(svg, disegna) {
  if (!svg) return () => {};
  if (fermo) return (b) => disegna(b);      // niente corsa: si salta li'
  return animatore(disegna);
}

let vaiLuce = null, vaiMuro = null;

/** Aggiorna lo schema quotato della luce. */
export function mostraLuce(svg, w, h) {
  if (!vaiLuce) vaiLuce = collega(svg, (v) => disegnaLuce(svg, v.w, v.h));
  vaiLuce({ w, h });
}

/** Aggiorna lo schema quotato del muro. */
export function mostraMuro(svg, w, muro, allargato) {
  if (!vaiMuro) vaiMuro = collega(svg, (v) => disegnaMuro(svg, v.w, v.muro, v.allargato));
  vaiMuro({ w, muro, allargato });
}
