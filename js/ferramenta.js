/* ============================================================
   SCHEMI DELLA FERRAMENTA — dettaglio a grandezza vera
   Questi pezzi non sono movimenti di porta: sono meccanismi da
   pochi centimetri. Invece della porta intera si guarda una fetta
   di montante e di anta, col montante TAGLIATO — cosi si vede che
   la cerniera a scomparsa sta dentro il legno, e perche' costa.
   Stesso motore degli schemi di apertura, altra scala.
   ============================================================ */

import { proj, pushSolid, registra } from './aperture.js';

const T = 44, FJ = 34, FD = 96;           // anta, montante, muro
const MURO = 26;                          // quanto muro resta a vista
const DUR = 5.5;

/* Ogni pezzo ha la sua fetta: la cerniera vuole 18 cm d'altezza, il
   paraspiffero vuole il pavimento. Inquadrarle tutte uguali rimpiccioliva
   il meccanismo fino a farlo sparire. */
/* min: l'anta non si chiude mai del tutto. A filo, il meccanismo resta
   sepolto fra montante e anta - com'e' nella realta', ma il dettaglio
   serve proprio a farlo vedere. */
const FETTA = {
  anuba:        { h: 152, l: 56, ang: 64, min: 22 },
  scomparsa3d:  { h: 152, l: 62, ang: 64, min: 14 },
  cilindro:     { h: 150, l: 72, ang: 52, min: 20 },
  nottolino:    { h: 148, l: 72, ang: 58, min: 22 },
  riscontro:    { h: 150, l: 60, ang: 44, min: 14 },
  paraspiffero: { h: 104, l: 96, ang: 38, min: 10, suolo: true },
};

/* nel dettaglio manca il contesto della porta intera: i tre legni hanno
   tinte staccate, altrimenti si leggono come contorni vuoti */
const T_JAMB = { front: 'var(--d-jamb)', back: 'var(--d-jamb)',
                 edge: 'var(--d-edge)',  top: 'var(--d-edge)' };
const T_WALL = { front: 'var(--d-wall)', back: 'var(--d-wall)',
                 edge: 'var(--d-edge)',  top: 'var(--d-edge)' };
const T_LEAF = { front: 'var(--d-leaf)', back: 'var(--d-wall)',
                 edge: 'var(--d-edge)',  top: 'var(--d-edge)' };
const T_MORT = { front: 'var(--d-mort)', back: 'var(--d-mort)',
                 edge: 'var(--d-mort)',  top: 'var(--d-mort)' };
const T_ACC  = { front: 'var(--s-lit)',   back: 'var(--s-dark)',
                 edge: 'var(--s-mid)',    top: 'var(--s-mid)' };
const OTT = { lit: 'var(--m-lit)', mid: 'var(--m-mid)', dark: 'var(--m-dark)' };
const ACC = { lit: 'var(--s-lit)', mid: 'var(--s-mid)', dark: 'var(--s-dark)' };

/* poligono a n lati, per le teste tonde dei perni */
function poly(list, pts, fill, opts) {
  opts = opts || {};
  const q = pts.map((P) => proj(P[0], P[1], P[2]));
  let a = 0;
  for (let i = 0; i < q.length; i++) {
    const b = q[(i + 1) % q.length];
    a += q[i][0] * b[1] - b[0] * q[i][1];
  }
  const zm = q.reduce((s2, pt) => s2 + pt[2], 0) / q.length;
  // oltre: profondita' del centro del solido — si tiene solo la faccia
  // che gli sta davanti. Altrimenti si ricade sul verso di percorrenza.
  if (opts.oltre !== undefined) { if (zm <= opts.oltre) return; }
  else if (a <= 0 && !opts.force) return;
  list.push({
    d: 'M' + q.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + 'Z',
    z: zm + (opts.zBias || 0),
    fill, noStroke: opts.noStroke,
  });
}

/* cilindro come prisma: perni, barilotti, corpo della serratura */
function cyl(list, c, ax, r, len, tone, n) {
  n = n || 14;
  const up = Math.abs(ax[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const e1 = [ax[1]*up[2] - ax[2]*up[1], ax[2]*up[0] - ax[0]*up[2], ax[0]*up[1] - ax[1]*up[0]];
  const m1 = Math.hypot(e1[0], e1[1], e1[2]) || 1;
  const u1 = e1.map((v) => v / m1);
  const e2 = [ax[1]*u1[2] - ax[2]*u1[1], ax[2]*u1[0] - ax[0]*u1[2], ax[0]*u1[1] - ax[1]*u1[0]];
  const ring = (t) => Array.from({ length: n }, (_, i) => {
    const a = i / n * 2 * Math.PI;
    return [c[0] + ax[0]*t*len + r*(Math.cos(a)*u1[0] + Math.sin(a)*e2[0]),
            c[1] + ax[1]*t*len + r*(Math.cos(a)*u1[1] + Math.sin(a)*e2[1]),
            c[2] + ax[2]*t*len + r*(Math.cos(a)*u1[2] + Math.sin(a)*e2[2])];
  });
  const A = ring(0), B = ring(1);
  // stesso criterio delle scatole: si tiene la faccia che sta davanti al
  // centro del solido. Il verso di percorrenza qui dipende dall'asse.
  const tutti = A.concat(B);
  const cz = tutti.reduce((s2, a) => s2 + proj(a[0], a[1], a[2])[2], 0) / tutti.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    poly(list, [A[i], A[j], B[j], B[i]], i < n / 2 ? tone.lit : tone.dark, { oltre: cz });
  }
  poly(list, A, tone.mid, { oltre: cz });
  poly(list, B, tone.mid, { oltre: cz });
}

const ease = (u) => u * u * (3 - 2 * u);
function ciclo(u) {                        // aperto -> chiuso -> aperto
  if (u < 0.08) return 1;
  if (u < 0.38) return 1 - ease((u - 0.08) / 0.30);
  if (u < 0.62) return 0;
  if (u < 0.92) return ease((u - 0.62) / 0.30);
  return 1;
}

function scena(tipo, u) {
  const L = [];
  const K = FETTA[tipo] || FETTA.anuba;
  const HD = K.h, LW = K.l;
  const p = ciclo(u);                      // 1 aperto, 0 chiuso
  const mi = K.min || 0;
  const r = (mi + (K.ang - mi) * p) * Math.PI / 180;
  const D = [Math.cos(r), 0, Math.sin(r)];
  const N = [-Math.sin(r), 0, Math.cos(r)];
  const hx = -T / 2;
  const at = (a, y, w) => [hx + a*D[0] + w*N[0], y, a*D[2] + w*N[2]];

  if (K.suolo) {
    poly(L, [[hx - FJ - MURO, -1, -FD/2], [hx + LW + 40, -1, -FD/2],
             [hx + LW + 40, -1, FD/2 + 90], [hx - FJ - MURO, -1, FD/2 + 90]],
         'var(--floor)', { force: true, noStroke: true, zBias: -1e5 });
  }

  // montante tagliato e muro dietro
  pushSolid(L, [hx - FJ, 0, -FD/2], [FJ, 0, 0], [0, HD, 0], [0, 0, FD], T_JAMB);
  pushSolid(L, [hx - FJ - MURO, 0, -FD/2], [MURO, 0, 0], [0, HD, 0], [0, 0, FD], T_WALL);

  // la fetta d'anta
  pushSolid(L, at(0, 0, -T), [LW*D[0], 0, LW*D[2]], [0, HD, 0],
            [T*N[0], 0, T*N[2]], T_LEAF);

  switch (tipo) {

    case 'anuba': {
      for (const y of [26, 96]) cyl(L, [hx, y, 0], [0, 1, 0], 11, 34, OTT, 16);
      cyl(L, [hx, 18, 0], [0, 1, 0], 4.4, 120, OTT, 12);
      for (const y of [26, 96]) {                        // viti sulle ali
        cyl(L, at(9, y + 21, 1), [N[0], 0, N[2]], 4, 2.4, OTT, 10);
      }
      break;
    }

    case 'scomparsa3d': {
      // le due mortase: la prova che il meccanismo sta DENTRO il legno
      pushSolid(L, [hx - 34, 38, -19], [32, 0, 0], [0, 80, 0], [0, 0, 38], T_MORT);
      pushSolid(L, at(2, 38, -T + 3), [40*D[0], 0, 40*D[2]], [0, 80, 0],
                [38*N[0], 0, 38*N[2]], T_MORT);
      const anc = [hx - 22, 78, 0];
      const att = at(24, 78, 0);
      const kn = [hx - 16*(1 - p) + 24*p, 78, 26*p + 6];
      for (const [a, b] of [[anc, kn], [kn, att]]) {
        const d = [b[0] - a[0], 0, b[2] - a[2]];
        const len = Math.hypot(d[0], d[2]) || 1;
        cyl(L, [a[0], a[1] - 8, a[2]], [d[0]/len, 0, d[2]/len], 7.5, len, ACC, 12);
      }
      cyl(L, [kn[0], kn[1] - 14, kn[2]], [0, 1, 0], 9, 28, ACC, 14);
      for (const v of [[1,0,0], [0,1,0], [0,0,1]]) {      // le tre registrazioni
        const o = [hx - 20, 124, 0];
        const e = [o[0] + v[0]*30, o[1] + v[1]*26, o[2] + v[2]*30];
        L.push({ frecce: [proj(o[0], o[1], o[2]), proj(e[0], e[1], e[2])] });
      }
      break;
    }

    case 'cilindro': {
      pushSolid(L, at(0, 44, -T + 2), [18*D[0], 0, 18*D[2]], [0, 70, 0],
                [40*N[0], 0, 40*N[2]], T_ACC);
      // il corpo passa da parte a parte ma resta A FILO delle due facce
      cyl(L, at(9, 79, -T), [N[0], 0, N[2]], 16, T, ACC, 18);
      cyl(L, at(9, 79, 0), [N[0], 0, N[2]], 6.5, 13, OTT, 12);   // la chiave
      const fuori = 30 * (1 - p);
      pushSolid(L, at(-fuori, 58, -T/2 - 10), [(18 + fuori)*D[0], 0, (18 + fuori)*D[2]],
                [0, 46, 0], [20*N[0], 0, 20*N[2]], T_ACC);
      pushSolid(L, [hx - 30, 50, -16], [28, 0, 0], [0, 58, 0], [0, 0, 32], T_MORT);
      break;
    }

    case 'nottolino': {
      // predisposizione WC: il pomolo gira e caccia un chiavistello quadro
      pushSolid(L, at(0, 44, -T + 2), [18*D[0], 0, 18*D[2]], [0, 70, 0],
                [40*N[0], 0, 40*N[2]], T_ACC);
      cyl(L, at(9, 79, 0), [N[0], 0, N[2]], 15, 3, OTT, 16);       // rosetta
      // l'aletta da girare: in piano da aperta, in verticale da chiusa
      const g = (1 - p) * Math.PI / 2;
      const lu = [Math.cos(g), Math.sin(g), 0];
      cyl(L, at(9, 79, 3), [N[0], 0, N[2]], 5.5, 12, OTT, 12);
      pushSolid(L, [at(9, 79, 8)[0] - lu[0]*3, 79 - lu[1]*3, at(9, 79, 8)[2]],
                [lu[0]*26, lu[1]*26, 0], [-lu[1]*7, lu[0]*7, 0], [0, 0, 7],
                { front: 'var(--m-lit)', back: 'var(--m-dark)',
                  edge: 'var(--m-mid)',  top: 'var(--m-mid)' });
      const fuori = 22 * (1 - p);
      pushSolid(L, at(-fuori, 66, -T/2 - 8), [(18 + fuori)*D[0], 0, (18 + fuori)*D[2]],
                [0, 28, 0], [16*N[0], 0, 16*N[2]], T_ACC);
      pushSolid(L, [hx - 26, 60, -13], [24, 0, 0], [0, 40, 0], [0, 0, 26], T_MORT);
      break;
    }

    case 'riscontro': {
      // sta nel MONTANTE, non nell'anta: la bocchetta si sgancia e libera
      // la porta senza girare la maniglia
      pushSolid(L, [hx - 32, 46, -22], [30, 0, 0], [0, 70, 0], [0, 0, 44], T_MORT);
      pushSolid(L, [hx - 29, 50, -18], [24, 0, 0], [0, 62, 0], [0, 0, 36], T_ACC);
      // il labbro incernierato: da chiusa trattiene, poi ruota e libera
      const ap = (1 - p) * 0;                       // resta chiuso finche' non scatta
      const sc = u > 0.42 && u < 0.62 ? (u - 0.42) / 0.20 : (u >= 0.62 ? 1 : 0);
      const gg = 52 * (u < 0.62 ? sc : Math.max(0, 1 - (u - 0.62) / 0.2)) * Math.PI / 180;
      pushSolid(L, [hx - 6, 56, -14],
                [10*Math.cos(gg), 0, 10*Math.sin(gg)], [0, 50, 0],
                [-28*Math.sin(gg), 0, 28*Math.cos(gg)],
                { front: 'var(--m-lit)', back: 'var(--m-dark)',
                  edge: 'var(--m-mid)',  top: 'var(--m-mid)' });
      // lo scrocco dell'anta, che ci si appoggia
      pushSolid(L, at(-10, 66, -T/2 - 8), [26*D[0], 0, 26*D[2]], [0, 32, 0],
                [16*N[0], 0, 16*N[2]], T_ACC);
      // i due fili di alimentazione: e' un pezzo elettrico
      const w0 = [hx - 31, 52, 10];
      L.push({ filo: [proj(w0[0], w0[1], w0[2]),
                      proj(w0[0] - 18, w0[1] - 18, w0[2] + 6),
                      proj(w0[0] - 34, w0[1] - 10, w0[2] + 2)] });
      break;
    }

    case 'paraspiffero': {
      const giu = 24 * (1 - p);
      pushSolid(L, at(0, 14, -T + 4), [LW*D[0], 0, LW*D[2]], [0, 26, 0],
                [36*N[0], 0, 36*N[2]], T_ACC);
      pushSolid(L, at(0, 14 - giu, -T + 9), [LW*D[0], 0, LW*D[2]], [0, giu + 3, 0],
                [26*N[0], 0, 26*N[2]],
                { front: 'var(--s-dark)', back: 'var(--s-dark)',
                  edge: 'var(--s-dark)',  top: 'var(--s-dark)' });
      cyl(L, at(0, 27, -T/2), [-D[0], 0, -D[2]], 6, 12 + 10*p, ACC, 12);
      break;
    }
  }
  return L;
}

/* inquadratura sui fotogrammi estremi, calcolata una volta sola */
const cache = {};
function inquadra(tipo) {
  if (cache[tipo]) return cache[tipo];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const u of [0.02, 0.25, 0.5, 0.75]) {
    for (const f of scena(tipo, u)) {
      if (!f.d) continue;
      for (const m of f.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)) {
        const x = +m[1], y = +m[2];
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  const m = 26;
  cache[tipo] = [x0 - m, y0 - m, (x1 - x0) + 2*m, (y1 - y0) + 2*m];
  return cache[tipo];
}

function disegna(svg, tipo, u) {
  const vb = inquadra(tipo);
  svg.setAttribute('viewBox', vb.map((n) => n.toFixed(0)).join(' '));
  const sw = Math.max(vb[2], vb[3]) / 240;
  const L = scena(tipo, u);
  let out = '';
  for (const f of L.filter((x) => x.d).sort((a, b) => a.z - b.z)) {
    out += '<path d="' + f.d + '" fill="' + f.fill + '"' +
           (f.noStroke ? '' : ' stroke="var(--ink)" stroke-width="' + sw.toFixed(2) +
            '" stroke-linejoin="round"') + '/>';
  }
  for (const f of L) {
    if (f.frecce) {
      const [a, b] = f.frecce;
      const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1;
      const ux = dx / n, uy = dy / n, h = sw * 4;
      out += '<path d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' L' +
             b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '" stroke="var(--brass)" ' +
             'stroke-width="' + (sw*1.1).toFixed(2) + '" stroke-dasharray="' +
             (sw*2.4).toFixed(1) + ' ' + (sw*2).toFixed(1) + '" fill="none"/>' +
             '<path d="M' + b[0].toFixed(1) + ' ' + b[1].toFixed(1) +
             ' L' + (b[0]-ux*h-uy*h*.45).toFixed(1) + ' ' + (b[1]-uy*h+ux*h*.45).toFixed(1) +
             ' L' + (b[0]-ux*h+uy*h*.45).toFixed(1) + ' ' + (b[1]-uy*h-ux*h*.45).toFixed(1) +
             'Z" fill="var(--brass)"/>';
    }
    if (f.filo) {
      out += '<path d="M' + f.filo.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1))
                             .join(' L') + '" fill="none" stroke="var(--s-dark)" ' +
             'stroke-width="' + (sw*1.6).toFixed(2) + '" stroke-linecap="round"/>';
    }
  }
  svg.innerHTML = out;
}

/** Mostra un pezzo di ferramenta in un <svg> della pagina. */
export function mostraFerramenta(svg, tipo) {
  if (!svg || !FETTA[tipo]) return;
  registra(svg, (u) => disegna(svg, tipo, u));
}
