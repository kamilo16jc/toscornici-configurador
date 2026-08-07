/* ============================================================
   SCHEMI ANIMATI DELLE APERTURE — assonometria
   Ogni anta e' un solido vero: otto vertici, sei facce, le facce
   che guardano via si scartano e le altre si ordinano per
   profondita' a ogni fotogramma. E' quello che le fa leggere come
   legno e non come carta piegata.
   Disegnate in SVG inline, non caricate come <img>: la geometria
   cambia a ogni fotogramma, quindi non si puo' congelare in
   keyframes senza perderci.
   ============================================================ */

/* misure reali, in millimetri */
const W = 900, H = 2100, T = 44;   // anta
const F = 70, FD = 108;            // telaio: sezione e spessore muro
const WALL = 430;                  // muro ai lati
const HS = 520;                    // sopraluce

/* messa a punto approvata col cliente */
const ANG = 82, VIEW = 28, TILT = 0.32, DUR = 5.5;

const cosV = Math.cos(VIEW * Math.PI / 180);
const sinV = Math.sin(VIEW * Math.PI / 180);

export const proj = (x, y, z) => {
  const dp = x * sinV + z * cosV;
  return [x * cosV - z * sinV, -y + dp * TILT, dp];
};

const TONE = { front: 'var(--f-front)', back: 'var(--f-back)',
               edge: 'var(--f-edge)', top: 'var(--f-edge)' };
const T_WALL  = { front: 'var(--f-wall)',  back: 'var(--f-wall)',
                  edge: 'var(--f-jamb)',   top: 'var(--f-jamb)' };
const T_FRAME = { front: 'var(--f-frame)', back: 'var(--f-frame)',
                  edge: 'var(--f-jamb)',   top: 'var(--f-jamb)' };
const T_WOOD  = { front: 'var(--f-wood)',  back: 'var(--f-wood)',
                  edge: 'var(--f-jamb)',   top: 'var(--f-jamb)' };
const T_GLASS = { front: 'var(--f-glass)', back: 'var(--f-glass)',
                  edge: 'var(--f-edge)',   top: 'var(--f-edge)' };

export function pushSolid(list, o, u, v, w, tone) {
  const P = (a, b, c) => [o[0] + u[0]*a + v[0]*b + w[0]*c,
                          o[1] + u[1]*a + v[1]*b + w[1]*c,
                          o[2] + u[2]*a + v[2]*b + w[2]*c];
  const p = [P(0,0,0), P(1,0,0), P(1,1,0), P(0,1,0),
             P(0,0,1), P(1,0,1), P(1,1,1), P(0,1,1)];
  const facce = [[[0,1,2,3],'back'], [[4,5,6,7],'front'], [[1,5,6,2],'edge'],
                 [[0,4,7,3],'edge'], [[3,2,6,7],'top'], [[0,1,5,4],'top']];
  // Si tiene la faccia se sta DAVANTI al centro del solido. Il verso di
  // percorrenza non serve: dipende da come sono orientati i tre vettori
  // della scatola, e con la terna opposta scartava le due facce grandi.
  const cz = p.reduce((s2, a) => s2 + proj(a[0], a[1], a[2])[2], 0) / 8;
  for (const [idx, kind] of facce) {
    const q = idx.map((n) => { const a = p[n]; return proj(a[0], a[1], a[2]); });
    const fz = (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4;
    if (fz <= cz) continue;                        // faccia che guarda via
    list.push({
      d: 'M' + q.map((a) => a[0].toFixed(1) + ' ' + a[1].toFixed(1)).join(' L') + 'Z',
      z: (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4,
      fill: (tone || TONE)[kind] || (tone || TONE).edge,
    });
  }
}

export function pushQuad(list, pts, fill, opts) {
  opts = opts || {};
  const q = pts.map((P) => proj(P[0], P[1], P[2]));
  const area = (q[1][0]-q[0][0])*(q[2][1]-q[0][1]) - (q[2][0]-q[0][0])*(q[1][1]-q[0][1]);
  // force: per i pezzi dell'anta specchiata, che hanno il verso invertito
  // e verrebbero scartati anche quando si vedono benissimo
  if (area <= 0 && !opts.force) return;
  const zm = (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4;
  list.push({
    d: 'M' + q.map((a) => a[0].toFixed(1) + ' ' + a[1].toFixed(1)).join(' L') + 'Z',
    z: opts.z !== undefined ? opts.z : zm + (opts.zBias || 0),
    fill, noStroke: opts.noStroke,
  });
}

/* un'anta: solido, bugne sulle due facce, ferramenta secondo il tipo */
function anta(list, hw, o, s, ang, larg, alt, opts) {
  opts = opts || {};
  const r = ang * Math.PI / 180;
  const D = [-s * Math.cos(r), 0, Math.sin(r)];
  const N = [ s * Math.sin(r), 0, Math.cos(r)];
  const at = (u, v, w) => [o[0] + u*D[0] + w*N[0], o[1] + v, o[2] + u*D[2] + w*N[2]];

  pushSolid(list, o, [larg*D[0], 0, larg*D[2]], [0, alt, 0], [T*N[0], 0, T*N[2]], opts.tone);

  // Quale faccia dell'anta guarda l'osservatore? Stesso criterio con cui
  // pushSolid sceglie le facce: quella piu' vicina del centro dell'anta.
  // Col verso di percorrenza l'anta specchiata dava il risultato opposto,
  // e nella porta a due ante una si vedeva bugnata e l'altra liscia.
  const cFronte = at(larg / 2, alt / 2, T);
  const cAnta = at(larg / 2, alt / 2, T / 2);
  const facciaAvanti = proj(cFronte[0], cFronte[1], cFronte[2])[2]
                     > proj(cAnta[0], cAnta[1], cAnta[2])[2];
  // appena fuori dalla faccia in vista: dentro lo spessore l'ordine
  // per profondita' la nasconderebbe dietro la faccia stessa
  const fw = facciaAvanti ? T + 0.4 : -0.4;
  const m = Math.min(105, larg * 0.16);
  const zone = alt > 1400 ? [[170, alt*0.43], [alt*0.51, alt-170]] : [[130, alt-130]];
  for (const [v0, v1] of zone) {
    pushQuad(list, [at(m, v0, fw), at(larg-m, v0, fw), at(larg-m, v1, fw), at(m, v1, fw)],
             'var(--f-rec)', { force: true });
  }
  if (hw && !opts.noHW) {
    const hv = Math.min(1040, alt * 0.5);
    if (opts.scorrevole) {
      // incasso sul bordo: una scorrevole non ha leva ne cerniere
      hw.incassi.push([at(larg - 60, hv - 90, T + 2), at(larg - 60, hv + 90, T + 2)]);
    } else {
      hw.handles.push({ rose: at(larg - 105, hv, T),
                        knee: at(larg - 105, hv, T + 30),
                        tip:  at(larg - 235, hv, T + 30) });
      for (const v of [alt * 0.22, alt * 0.78]) {
        hw.hinges.push([at(0, v - 55, T * 0.5), at(0, v + 55, T * 0.5)]);
      }
    }
  }
}

/* muro, telaio ed eventuale tasca */
function guscio(L, cfg, sopra) {
  const ht = H + (sopra ? F + HS : 0);
  const mu = cfg.muro || WALL;
  for (const dir of [1, -1]) {
    if (cfg.tasca === dir) {
      // due lastre con l'intercapedine. Quella verso l'osservatore va in
      // coda, cosi copre l'anta che ci entra dentro.
      const gap = T * 1.9, tS = (FD - gap) / 2;
      const tone = cfg.tascaLegno ? T_WOOD : T_WALL;
      pushSolid(L.back,  [dir*(W/2+F), 0, -gap/2], [dir*mu, 0, 0], [0, ht+F, 0], [0, 0, -tS], tone);
      pushSolid(L.front, [dir*(W/2+F), 0,  gap/2], [dir*mu, 0, 0], [0, ht+F, 0], [0, 0,  tS], tone);
    } else {
      pushSolid(L.back, [dir*(W/2+F), 0, -FD/2], [dir*mu, 0, 0], [0, ht+F, 0], [0, 0, FD], T_WALL);
    }
    pushSolid(L.telaio, [dir*W/2, 0, -FD/2], [dir*F, 0, 0], [0, ht+F, 0], [0, 0, FD], T_FRAME);
  }
  pushSolid(L.telaio, [-W/2-F, ht, -FD/2], [2*(W/2+F), 0, 0], [0, F, 0], [0, 0, FD], T_FRAME);
  if (sopra) {
    pushSolid(L.telaio, [-W/2-F, H, -FD/2], [2*(W/2+F), 0, 0], [0, F, 0], [0, 0, FD], T_FRAME);
  }
}

/* quanto e' aperta a ogni istante del ciclo */
const ease = (u) => u * u * (3 - 2 * u);
function apertura(u) {
  if (u < 0.06) return 0;
  if (u < 0.36) return ease((u - 0.06) / 0.30);
  if (u < 0.60) return 1;
  if (u < 0.92) return ease(1 - (u - 0.60) / 0.32);
  return 0;
}
function ventola(u) {                    // di la, torna, di qua, torna
  if (u < 0.05) return 0;
  if (u < 0.20) return ease((u - 0.05) / 0.15);
  if (u < 0.32) return 1;
  if (u < 0.47) return ease(1 - (u - 0.32) / 0.15);
  if (u < 0.55) return 0;
  if (u < 0.70) return -0.8 * ease((u - 0.55) / 0.15);
  if (u < 0.80) return -0.8;
  if (u < 0.95) return -0.8 * ease(1 - (u - 0.80) / 0.15);
  return 0;
}

function scena(tipo, u) {
  const L = { back: [], telaio: [], anta: [], front: [] };
  const hw = { handles: [], hinges: [], incassi: [] };
  const p = apertura(u);
  let arco = null;

  const ombra = (o, s, ang, larg) => {
    const r = ang * Math.PI / 180;
    const D = [-s*Math.cos(r), 0, Math.sin(r)], N = [s*Math.sin(r), 0, Math.cos(r)];
    pushQuad(L.anta, [[o[0], 1, o[2]],
                      [o[0]+larg*D[0], 1, o[2]+larg*D[2]],
                      [o[0]+larg*D[0]+210*N[0], 1, o[2]+larg*D[2]+210*N[2]],
                      [o[0]+210*N[0], 1, o[2]+210*N[2]]],
             'var(--floor)', { z: -1e5, noStroke: true, force: true });
  };

  switch (tipo) {
    case 'battente': {
      guscio(L, {});
      const ang = ANG * p;
      ombra([W/2, 0, 0], 1, ang, W);
      anta(L.anta, hw, [W/2, 0, 0], 1, ang, W, H);
      arco = { hx: W/2, s: 1, ang, larg: W };
      break;
    }
    case 'due_ante': {
      guscio(L, {});
      // Le due ante non aprono uguale: a 78 gradi il piano dell'anta
      // sinistra si allinea con la direzione di vista e si vede di taglio,
      // una scheggia accanto all'altra bugnata. Lo stesso accorgimento
      // delle tavole del listino, dove le due ante non sono mai simmetriche.
      const L2 = W / 2;
      for (const [s, gradi] of [[1, Math.min(ANG, 78)], [-1, 42]]) {
        ombra([s * W/2, 0, 0], s, gradi * p, L2);
        anta(L.anta, hw, [s * W/2, 0, 0], s, gradi * p, L2, H);
      }
      break;
    }
    case 'koblenz': {
      // bifold: le due meta' fanno una V isoscele e il bordo libero torna
      // sul filo del muro. Per questo il secondo pannello sta a -a.
      guscio(L, {});
      const L2 = W/2, a = Math.min(ANG, 68) * p;
      const r = a * Math.PI / 180;
      const giunto = [W/2 - L2*Math.cos(r), 0, L2*Math.sin(r)];
      ombra([W/2, 0, 0], 1, a, L2);
      anta(L.anta, hw, [W/2, 0, 0], 1, a, L2, H, { noHW: a > 1 });
      anta(L.anta, null, giunto, 1, -a, L2, H);
      break;
    }
    case 'justor': {
      guscio(L, {});
      const ang = ANG * ventola(u);
      ombra([W/2, 0, 0], 1, ang, W);
      anta(L.anta, hw, [W/2, 0, 0], 1, ang, W, H);
      arco = { hx: W/2, s: 1, ang, larg: W, doppio: true };
      break;
    }
    case 'ergon': {
      guscio(L, {});                          // gira e insieme rientra
      const hx = W/2 - W * 0.42 * p, ang = Math.min(ANG, 92) * p;
      ombra([hx, 0, 0], 1, ang, W);
      anta(L.anta, hw, [hx, 0, 0], 1, ang, W, H);
      break;
    }
    case 'scomparsa':
    case 'int_telaio': {
      guscio(L, { tasca: 1, tascaLegno: tipo === 'int_telaio', muro: W + 160 });
      anta(L.anta, hw, [W/2 + W * 0.94 * p, 0, 0], 1, 0, W, H, { scorrevole: true });
      break;
    }
    case 'est_muro':
    case 'est_muro_m':
    case 'magic': {
      const corsa = tipo === 'magic' ? 0.66 : 0.94;
      guscio(L, { muro: W * corsa + 190 });
      const zoff = FD/2 + T * 0.9;
      const lTr = tipo === 'magic' ? W * 1.5 : W * 2.1;
      if (tipo === 'est_muro_m') {             // il cassonetto copre il binario
        pushSolid(L.front, [-W/2, H + F, zoff - T*0.6], [lTr, 0, 0], [0, 260, 0],
                  [0, 0, T*1.5], T_FRAME);
      } else {
        pushSolid(L.telaio, [-W/2, H + F + 40, zoff], [lTr, 0, 0], [0, 46, 0],
                  [0, 0, T*0.5], T_WOOD);
      }
      anta(L.anta, hw, [W/2 + W*corsa*p, 0, zoff], 1, 0, W, H, { scorrevole: true });
      break;
    }
    case 'sopraluce_fisso':
    case 'sopraluce_apribile':
    case 'sopraluce_wasistas': {
      guscio(L, {}, true);
      anta(L.anta, hw, [W/2, 0, 0], 1, 0, W, H);
      const alto = tipo === 'sopraluce_apribile';
      const phi = (tipo === 'sopraluce_fisso' ? 0 : 40 * p) * Math.PI / 180;
      const yP = alto ? H + F + HS : H + F;
      const V = alto ? [0, -Math.cos(phi), Math.sin(phi)] : [0, Math.cos(phi), Math.sin(phi)];
      const N = alto ? [0,  Math.sin(phi), Math.cos(phi)] : [0, -Math.sin(phi), Math.cos(phi)];
      pushSolid(L.anta, [-W/2, yP, -T/2], [W, 0, 0],
                [HS*V[0], HS*V[1], HS*V[2]], [T*N[0], T*N[1], T*N[2]],
                tipo === 'sopraluce_fisso' ? T_GLASS : TONE);
      break;
    }
    default:
      guscio(L, {});
      anta(L.anta, hw, [W/2, 0, 0], 1, 0, W, H);
  }
  return { L, hw, arco };
}

/* l'inquadratura abbraccia tutti i fotogrammi, non solo quello a riposo */
const vbCache = {};
function inquadra(tipo) {
  if (vbCache[tipo]) return vbCache[tipo];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const u of [0.02, 0.20, 0.30, 0.48, 0.65, 0.75, 0.86]) {
    const sc = scena(tipo, u);
    for (const strato of [sc.L.back, sc.L.telaio, sc.L.anta, sc.L.front]) {
      for (const f of strato) {
        for (const m of f.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)) {
          const x = +m[1], y = +m[2];
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
  }
  const m = 130;
  vbCache[tipo] = [x0 - m, y0 - m, (x1 - x0) + 2*m, (y1 - y0) + 2*m];
  return vbCache[tipo];
}

function disegna(svg, tipo, u) {
  const vb = inquadra(tipo);
  svg.setAttribute('viewBox', vb.map((n) => n.toFixed(0)).join(' '));
  const sc = scena(tipo, u);
  const sw = Math.max(vb[2], vb[3]) / 330;
  let out = '';

  for (const strato of [sc.L.back, sc.L.telaio, sc.L.anta, sc.L.front]) {
    strato.sort((a, b) => a.z - b.z);
    for (const f of strato) {
      out += '<path d="' + f.d + '" fill="' + f.fill + '"' +
             (f.noStroke ? '' : ' stroke="var(--ink)" stroke-width="' + sw.toFixed(1) +
              '" stroke-linejoin="round"') + '/>';
    }
  }
  if (sc.arco) {
    const { hx, s, ang, larg } = sc.arco;
    const tratti = sc.arco.doppio ? [[0, ANG], [0, -ANG * 0.8]] : [[0, ang]];
    for (const [a0, a1] of tratti) {
      const pts = [];
      for (let i = 0; i <= 22; i++) {
        const t = (a0 + (a1 - a0) * i / 22) * Math.PI / 180;
        const q = proj(hx - s * larg * Math.cos(t), 2, larg * Math.sin(t));
        pts.push(q[0].toFixed(1) + ' ' + q[1].toFixed(1));
      }
      out += '<path d="M' + pts.join(' L') + '" fill="none" stroke="var(--taupe)" ' +
             'stroke-width="' + (sw*.8).toFixed(1) + '" stroke-dasharray="' +
             (sw*3).toFixed(1) + ' ' + (sw*4).toFixed(1) + '" opacity=".5"/>';
    }
  }
  const seg = (p0, p1, w, op) => {
    const a = proj(p0[0], p0[1], p0[2]), b = proj(p1[0], p1[1], p1[2]);
    return '<path d="M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' L' +
           b[0].toFixed(1) + ' ' + b[1].toFixed(1) + '" stroke="var(--brass)" ' +
           'stroke-width="' + w.toFixed(1) + '" stroke-linecap="round" fill="none"' +
           (op ? ' opacity="' + op + '"' : '') + '/>';
  };
  for (const [p0, p1] of sc.hw.hinges) out += seg(p0, p1, sw * 3.4);
  for (const [p0, p1] of sc.hw.incassi) out += seg(p0, p1, sw * 2.6, '.85');
  for (const h of sc.hw.handles) {
    const r = proj(h.rose[0], h.rose[1], h.rose[2]);
    const k = proj(h.knee[0], h.knee[1], h.knee[2]);
    const t = proj(h.tip[0], h.tip[1], h.tip[2]);
    out += '<path d="M' + r[0].toFixed(1) + ' ' + r[1].toFixed(1) + ' L' +
           k[0].toFixed(1) + ' ' + k[1].toFixed(1) + ' L' +
           t[0].toFixed(1) + ' ' + t[1].toFixed(1) + '" stroke="var(--brass)" ' +
           'stroke-width="' + (sw*3.2).toFixed(1) + '" stroke-linecap="round" ' +
           'stroke-linejoin="round" fill="none"/>' +
           '<circle cx="' + r[0].toFixed(1) + '" cy="' + r[1].toFixed(1) +
           '" r="' + (sw*3).toFixed(1) + '" fill="var(--brass)"/>';
  }
  svg.innerHTML = out;
}

/* ---- un solo ciclo per tutti gli schemi visibili ------------------- */
const attivi = [];          // { svg, draw }
const fermo = matchMedia('(prefers-reduced-motion: reduce)').matches;
let t = 0, last = performance.now(), avviato = false;

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  t = (t + dt / DUR) % 1;
  for (const a of attivi) if (a.svg.isConnected) a.draw(t);
  requestAnimationFrame(loop);
}

/** Iscrive un <svg> al ciclo comune. draw(u) ridisegna il fotogramma. */
export function registra(svg, draw) {
  if (!svg) return;
  let a = attivi.find((x) => x.svg === svg);
  if (!a) { a = { svg, draw }; attivi.push(a); }
  a.draw = draw;
  draw(fermo ? 0.5 : t);                    // fermo: si mostra a meta' corsa
  if (!fermo && !avviato) { avviato = true; requestAnimationFrame(loop); }
}

/** Mostra un'apertura in un <svg> della pagina. */
export function mostraApertura(svg, tipo) {
  registra(svg, (u) => disegna(svg, tipo, u));
}
