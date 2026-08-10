/* ============================================================
   ALLARGATO — i disegni del listino, smontati e con i nomi

   Non si ridisegna niente: si leggono i tracciati veri da
   assets/telai/allargato_*.svg e si animano quelli. Sono i disegni
   della fabbrica, non un'interpretazione.

   Quello che si AGGIUNGE, e va detto perche' e' roba nostra:
     - il muro, che nei fogli del listino non c'e'. Senza, i pezzi
       galleggiano e non si capisce dove vanno a finire. E' tratteggiato
       apposta, cosi' non lo si scambia per un pezzo di legno.
     - i nomi dei pezzi, con la loro linea di richiamo.

   COSA DICONO I DUE DISEGNI, contato tracciato per tracciato:
     integrale   UN tracciato. Battuta e guarnizione a un capo, poi il
                 profilo corre liscio fino in fondo al muro. Un pezzo
                 unico: non si smonta perche' non c'e' giunta.
     imbottino   QUATTRO. Il telaio con la battuta, una tavola staccata
                 che prosegue lo stipite, e i due coprifili -- uno per
                 faccia del muro. Fra la tavola e il telaio resta una
                 giunta, ed e' l'unica cosa che sulla porta finita
                 distingue i due sistemi.
   ============================================================ */

const FILE = {
  integrale: 'assets/telai/allargato_integrale.svg',
  imbottino: 'assets/telai/allargato_imbottino.svg',
};

/* Dove va ogni pezzo quando si smonta. Non e' una scelta grafica: dice
   da dove arriva in cantiere. I coprifili si appoggiano alle due facce
   del muro, quindi escono uno per lato; la tavola esce verso il vano,
   che e' da dove la si infila. */
const VIA = {
  integrale: [{ dx: 0, dy: 0 }],
  imbottino: [
    { dx: -62, dy: -40 },   // la tavola, verso il vano
    { dx: 0, dy: 0 },       // il telaio resta fermo: e' il riferimento
    { dx: -46, dy: 26 },    // coprifilo, faccia interna
    { dx: 50, dy: 30 },     // coprifilo, faccia esterna
  ],
};

/* Il muro. Non sta nei fogli del listino: e' un'aggiunta nostra per
   dare un posto ai pezzi. Le coordinate sono lette dai tracciati --
   fra i due coprifili e sotto il filo dello stipite. */
const MURO = {
  integrale: { x: 2, y: 30, w: 187, h: 74 },
  imbottino: { x: 16, y: 30, w: 193, h: 108 },
};

/* I nomi. 'a' e' il punto del disegno che indicano, 'da' dove sta la
   scritta; 'pezzo' e' quale tracciato seguono quando ci si smonta
   (undefined = fermi, come il muro). */
const NOMI = {
  integrale: [
    { t: 'muro', a: [95, 70], da: [95, 96], fermo: true },
    { t: 'telaio — un pezzo solo', a: [95, 20], da: [95, -14], pezzo: 0 },
    { t: 'guarnizione', a: [179, 8], da: [214, -14], fermo: true },
  ],
  imbottino: [
    { t: 'muro', a: [112, 104], da: [112, 130], fermo: true },
    { t: 'tavola aggiunta', a: [56, 17], da: [40, -16], pezzo: 0 },
    { t: 'telaio', a: [150, 40], da: [168, -16], pezzo: 1 },
    { t: 'coprifilo', a: [22, 100], da: [-16, 126], pezzo: 2 },
    { t: 'coprifilo', a: [200, 110], da: [238, 136], pezzo: 3 },
  ],
};

const dati = {};      // il letto dei file, una volta sola
let scalaInt = 1;     // quanto ingrandire l'integrale per pareggiare

async function leggi(url) {
  const testo = await (await fetch(url)).text();
  const doc = new DOMParser().parseFromString(testo, 'image/svg+xml');
  const g = doc.querySelector('rect.g');
  return {
    pezzi: [...doc.querySelectorAll('path.p')].map((n) => n.outerHTML),
    minuti: [...doc.querySelectorAll('line, path.d')].map((n) => n.outerHTML),
    guarn: g && {
      w: +g.getAttribute('width'), h: +g.getAttribute('height'),
      html: g.outerHTML,
    },
    vb: doc.documentElement.getAttribute('viewBox').split(/\s+/).map(Number),
  };
}

/** Quanto e' diversa la taratura fra i due fogli, per dirlo in chiaro. */
export let taratura = null;

async function carica() {
  if (dati.integrale) return;
  for (const [tipo, url] of Object.entries(FILE)) dati[tipo] = await leggi(url);
  // I due fogli sono a scale diverse (191x44 e 224x153). Il metro comune
  // e' la GUARNIZIONE: lo stesso pezzo di gomma in tutti e due. Ma i due
  // rettangoli non hanno le stesse proporzioni, quindi il rapporto viene
  // diverso in larghezza e in altezza: si usa la media e lo si dichiara.
  const a = dati.integrale.guarn, b = dati.imbottino.guarn;
  const kw = b.w / a.w, kh = b.h / a.h;
  scalaInt = (kw + kh) / 2;
  taratura = { a, b, kw, kh, usata: scalaInt };
}

function nomi(tipo, k, sw) {
  const via = VIA[tipo];
  return (NOMI[tipo] || []).map((n) => {
    const v = n.fermo ? { dx: 0, dy: 0 } : (via[n.pezzo] || { dx: 0, dy: 0 });
    const ax = n.a[0] + v.dx * k, ay = n.a[1] + v.dy * k;
    const dx = n.da[0] + v.dx * k, dy = n.da[1] + v.dy * k;
    // la linea si ferma poco prima della scritta, se no le passa dentro
    const l = Math.hypot(dx - ax, dy - ay) || 1;
    const fx = dx - ((dx - ax) / l) * sw * 5, fy = dy - ((dy - ay) / l) * sw * 5;
    return `<path d="M${ax.toFixed(1)} ${ay.toFixed(1)} L${fx.toFixed(1)} `
         + `${fy.toFixed(1)}" stroke="var(--taupe)" stroke-width="${(sw * 0.5).toFixed(2)}" `
         + `opacity=".65" fill="none"/>`
         + `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="${(sw * 0.9).toFixed(2)}" `
         + `fill="var(--taupe)"/>`
         + `<text x="${dx.toFixed(1)}" y="${dy.toFixed(1)}" fill="var(--espresso-soft)" `
         + `text-anchor="middle" dominant-baseline="middle" font-weight="600" `
         + `font-family="Jost, Verdana, sans-serif" font-size="${(sw * 4.6).toFixed(1)}" `
         + `letter-spacing="${(sw * 0.25).toFixed(2)}">${n.t.toUpperCase()}</text>`;
  }).join('');
}

function disegna(svg, tipo, k) {
  const d = dati[tipo];
  if (!d) return;
  const s = tipo === 'integrale' ? scalaInt : 1;
  const via = VIA[tipo];

  // il muro per primo: sta dietro a tutto
  const m = MURO[tipo];
  let out = `<rect x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}" `
          + `fill="var(--f-muro-tratto)" stroke="var(--taupe)" stroke-width="1" `
          + `stroke-dasharray="4 3" opacity=".8"/>`;

  d.pezzi.forEach((html, i) => {
    const v = via[i] || { dx: 0, dy: 0 };
    // in terracotta il pezzo che l'imbottino AGGIUNGE: e' quello che si paga
    const agg = tipo === 'imbottino' && i === 0 ? ' class="agg"' : '';
    out += `<g${agg} transform="translate(${(v.dx * k).toFixed(1)} `
         + `${(v.dy * k).toFixed(1)})">${html}</g>`;
  });
  out += d.minuti.join('');
  if (d.guarn) out += d.guarn.html;

  if (tipo === 'imbottino') {
    const o = (0.18 + 0.82 * k).toFixed(2);
    out += `<circle cx="95" cy="17" r="10" fill="none" stroke="var(--brass)" `
         + `stroke-width="2.4" opacity="${o}"/>`
         + `<text x="95" y="-3" text-anchor="middle" fill="var(--brass)" `
         + `font-size="9" font-family="Jost, sans-serif" font-weight="600" `
         + `opacity="${o}">GIUNTA</text>`;
  }

  const vb = d.vb;
  const sw = Math.max(vb[2], vb[3]) / 100;
  out += nomi(tipo, k, sw);

  svg.innerHTML = `<g transform="scale(${s.toFixed(4)})">${out}</g>`;
  // il riquadro tiene conto di quanto i pezzi si allontanano e di dove
  // finiscono le scritte: se no spariscono fuori proprio smontandosi
  const fx = 78 * s, fy = 60 * s;
  svg.setAttribute('viewBox',
    `${vb[0] * s - fx} ${vb[1] * s - fy} `
    + `${vb[2] * s + 2.1 * fx} ${vb[3] * s + 2.1 * fy}`);
}

/* ---- il ciclo: si smonta, si guarda, si rimonta ---- */
const attivi = new Map();      // svg -> tipo
const fermo = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DUR = 8;                 // secondi per un giro completo
let t0 = null, avviato = false;

// fermo un momento montato, si apre, resta aperto abbastanza da
// leggere i nomi, si richiude
function corsa(u) {
  const e = (x) => x * x * (3 - 2 * x);
  if (u < 0.12) return 0;
  if (u < 0.36) return e((u - 0.12) / 0.24);
  if (u < 0.64) return 1;
  if (u < 0.88) return e(1 - (u - 0.64) / 0.24);
  return 0;
}

function giro(ora) {
  if (t0 === null) t0 = ora;
  const k = corsa(((ora - t0) / 1000 / DUR) % 1);
  for (const [svg, tipo] of attivi) {
    if (svg.isConnected) disegna(svg, tipo, k);
    else attivi.delete(svg);
  }
  requestAnimationFrame(giro);
}

/**
 * Mostra un allargato in un <svg>, che si smonta e si rimonta da solo.
 * Chiamarla di nuovo con un altro tipo cambia disegno senza aggiungere
 * un secondo ciclo.
 */
export async function mostraAllargato(svg, tipo) {
  if (!svg) return;
  await carica();
  attivi.set(svg, tipo);
  if (fermo) { disegna(svg, tipo, 1); return; }   // fermo: gia' smontato
  if (!avviato) { avviato = true; requestAnimationFrame(giro); }
}

/** Toglie un <svg> dal ciclo (quando la sezione si nasconde). */
export function fermaAllargato(svg) {
  attivi.delete(svg);
}
