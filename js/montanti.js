/* ============================================================
   I MONTANTI E LA TRAVERSA ALTA, ALLARGATI QUANTO COPRE IL TELAIO
   ------------------------------------------------------------
   Il cliente (27 ott 2026): "i montanti e i traversi si vedono
   troppo piccoli dentro il telaio". Ed e' vero, misurato: la
   battuta del telaio di fabbrica (BASE_HT789) copre l'anta di
   24 mm per lato e di 27 in testa. Di un montante tracciato da
   95 mm se ne vedevano 71, e appena 59 fino alla modanatura.
   La traversa alta peggio: della Matera S, 49 su 86.

   Quindi ogni montante dalla parte della jamba cresce di quello
   che il telaio gli mangia, e la traversa alta lo stesso: da
   davanti si torna a vedere tutto il legno tracciato. Il traverso
   basso no —li' non c'e' telaio che lo copra— e nemmeno i
   montanti d'incontro delle porte a due ante, che si vedono gia'
   interi.

   COME. Non scalando: e' lo stesso ragionamento di
   redimensionar.aAncho. L'anta resta della sua misura, al decimo;
   il montante cresce verso DENTRO e la differenza la assorbono i
   vani, a prorrata. I pezzi dritti interni (montanti di mezzo,
   traversi intermedi) non cambiano sezione: si spostano. E quello
   che sta sul contorno dell'anta non si muove — compreso l'arco
   della Praga e della Vienna: la sua corda e' una banda fissa e i
   suoi nodi sul filo restano dove sono, sotto si ingrossa solo la
   traversa.

   Il tracciato sul disco non si tocca: si applica al caricamento,
   come il TIPO. Tornare indietro e' mettere a zero i due numeri.
   ============================================================ */

import { cajaDe, puntosDe, centroDe, girarPuntos, arcoDelCantoAlto } from './motor/modelo/proyecto.js';
import { medioDe, bulgePorTres } from './motor/geom/arcos.js';

/** Quanto copre la battuta del telaio standard, misurato sul 3D. */
export const ALLARGA_LATO = 24;
export const ALLARGA_TESTA = 27;

/* I vani: si restringono, non si allargano mai. */
const CAMPI = new Set(['bugnato', 'bugnatoVetro', 'pannello', 'vetro', 'vetroSatinato']);

/* Di quanto si guarda fuori da un nodo per sapere se sta sul filo dell'anta.
   Quattro millimetri e non mezzo: i calchi non chiudono a zero, e nella London
   i montanti salgono 3,3 mm piu' della traversa — con mezzo millimetro la
   sonda cadeva dentro il montante e la testa della traversa scendeva. */
const SONDA = 4;

/* Un arco in testa piu' basso di cosi' e' un montante calcato un dito piu'
   alto dell'altro, non una volta: nelle porte a due ante, presa l'anta da
   sola, arcoDelCantoAlto ne trovava uno su tutto l'interno. */
const FRECCIA_MINIMA = 10;

/**
 * La rotazione del pezzo si porta dentro le coordinate.
 *
 * Le bande si contano in x e in y del disegno, e un pezzo girato di 180° (le
 * traverse curve della Matera) ha i nodi dall'altra parte rispetto a dove
 * finisce davvero: spostandoli senza girarli si sposterebbe la meta' sbagliata.
 */
function raddrizza(p) {
  if (!p.angulo || Math.abs(p.angulo) < 1e-6) return { ...p, angulo: 0 };
  const c = centroDe(p);
  if (p.tipo === 'trazado') {
    const pts = girarPuntos((p.nodos ?? []).map((n) => [n.x, n.y]), p.angulo, c);
    return { ...p, angulo: 0, nodos: p.nodos.map((n, i) => ({ ...n, x: pts[i][0], y: pts[i][1] })) };
  }
  if (p.tipo === 'rect' && !(p.r > 0)) {
    const pts = girarPuntos([[p.x, p.y], [p.x + p.w, p.y], [p.x + p.w, p.y + p.h], [p.x, p.y + p.h]], p.angulo, c);
    const { x, y, w, h, r, ...resto } = p;
    return { ...resto, tipo: 'trazado', cerrado: true, angulo: 0, nodos: pts.map(([px, py]) => ({ x: px, y: py, b: 0 })) };
  }
  return null;                      // un'ellisse girata: non ce n'e', e non si tocca
}

/** Un pezzo dritto e a squadra: il rettangolo, o un tracciato senza curve e senza sghembi. */
function dritto(p) {
  if (p.tipo === 'rect') return true;
  if (p.tipo !== 'trazado') return false;
  const n = p.nodos ?? [];
  if (n.length < 4 || n.some((q) => Math.abs(q.b ?? 0) > 1e-3)) return false;
  return n.every((q, i) => {
    const s = n[(i + 1) % n.length];
    return Math.abs(s.x - q.x) < 1.5 || Math.abs(s.y - q.y) < 1.5;
  });
}

function fusiona(intervalli) {
  const out = [];
  for (const iv of intervalli.slice().sort((a, b) => a[0] - b[0])) {
    const u = out[out.length - 1];
    if (u && iv[0] <= u[1] + 0.01) u[1] = Math.max(u[1], iv[1]);
    else out.push([iv[0], iv[1]]);
  }
  return out;
}

/**
 * La funzione che porta l'interno vecchio [a, b] nel nuovo [a2, b2]: le bande
 * fisse si traslano intere, le elastiche si stringono tutte dello stesso k.
 */
function mappaInterna(a, b, a2, b2, fisse) {
  const dentro = fusiona(fisse.map(([p, q]) => [Math.max(p, a), Math.min(q, b)]).filter(([p, q]) => q - p > 0.01));
  const rigido = dentro.reduce((s, [p, q]) => s + q - p, 0);
  const elastico = b - a - rigido;
  const k = (b2 - a2 - rigido) / elastico;
  const f = (x) => {
    let vecchio = a;
    let nuovo = a2;
    for (const [p, q] of dentro) {
      if (x <= p) return nuovo + (x - vecchio) * k;
      nuovo += (p - vecchio) * k;
      vecchio = p;
      if (x <= q) return nuovo + (x - vecchio);
      nuovo += q - p;
      vecchio = q;
    }
    return nuovo + (x - vecchio) * k;
  };
  return { f, k, elastico };
}

function dentroDi(pt, c) {
  let si = false;
  for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
    const [xi, yi] = c[i];
    const [xj, yj] = c[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) si = !si;
  }
  return si;
}

/**
 * Allarga i montanti e la traversa alta di UN'anta.
 *
 * @param {object[]} pezzi  i pezzi visibili dell'anta, gia' col TIPO applicato
 * @param {{sx?:number, dx?:number, su?:number}} quanto  mm in piu' al montante
 *   sinistro, al destro e alla traversa alta. Zero = quel lato non si tocca.
 * @returns {{pezzi: object[], nota: string[]}} copie; l'originale resta com'e'
 */
export function allargaMontanti(pezzi, { sx = 0, dx = 0, su = 0 } = {}) {
  const nota = [];
  if (!(sx > 0 || dx > 0 || su > 0)) return { pezzi, nota };
  const dritti = pezzi.map(raddrizza);
  if (dritti.some((p) => !p)) return { pezzi, nota: ['un pezzo girato che non so raddrizzare: anta lasciata com\'e\''] };

  const contorni = dritti.map((p) => puntosDe(p, 96));
  const cajas = dritti.map((p) => cajaDe(p));
  const x0 = Math.min(...cajas.map((c) => c[0]));
  const x1 = Math.max(...cajas.map((c) => c[2]));
  const y0 = Math.min(...cajas.map((c) => c[1]));
  const y1 = Math.max(...cajas.map((c) => c[3]));
  const W = x1 - x0;
  const H = y1 - y0;
  const legno = dritti.map((p) => !CAMPI.has(p.papel));
  const fuori = (x, y) => !contorni.some((c) => dentroDi([x, y], c));

  /* I MONTANTI DI BORDO: legno alto quasi quanto l'anta, appoggiato al canto.
     Dove finiscono verso dentro comincia l'interno. */
  const alti = cajas.map((c, i) => legno[i] && c[3] - c[1] >= 0.6 * H && c[3] - c[1] > c[2] - c[0]);
  const sinistri = cajas.filter((c, i) => alti[i] && c[0] <= x0 + 2);
  const destri = cajas.filter((c, i) => alti[i] && c[2] >= x1 - 2);
  const a = sinistri.length ? Math.max(...sinistri.map((c) => c[2])) : null;
  const b = destri.length ? Math.min(...destri.map((c) => c[0])) : null;
  if (sx > 0 && a == null) { nota.push('senza montante sinistro: lato lasciato'); sx = 0; }
  if (dx > 0 && b == null) { nota.push('senza montante destro: lato lasciato'); dx = 0; }

  /* LA TRAVERSA ALTA: il legno piu' largo che tocca la testa senza essere un
     montante. Nella Praga e' quella curva, e la sua quota bassa e' quella delle
     spalle. */
  const candidate = cajas.map((c, i) => ({ c, i })).filter(({ i }) => legno[i] && !alti[i]);
  const cima = Math.max(...candidate.map(({ c }) => c[3]));
  const testa = cima >= y1 - 15
    ? candidate.filter(({ c }) => c[3] >= cima - 8).sort((p, q) => (q.c[2] - q.c[0]) - (p.c[2] - p.c[0]))[0]
    : null;
  const cTesta = testa ? testa.c[1] : null;
  if (su > 0 && cTesta == null) { nota.push('senza traversa alta: testa lasciata'); su = 0; }

  /* LE BANDE FISSE. In x i pezzi dritti verticali di mezzo, e la corda
     dell'arco in testa se c'e' —con 8 mm di margine, perche' arcoDelCantoAlto
     mette la spalla dove il canto e' gia' salito di un millimetro e i nodi
     dove l'arco nasce stanno 3 mm piu' in la'—: cosi' l'arco non si stringe e
     il telaio, che lo segue, resta quello di prima. In y i traversi dritti, il
     basso compreso. */
  const arcoTrovato = arcoDelCantoAlto(dritti);
  const arco = arcoTrovato && arcoTrovato.flecha > FRECCIA_MINIMA ? arcoTrovato : null;
  /* Chi e' verticale e chi orizzontale non lo dice solo la forma: nell'anta
     stretta della Old England il traverso basso misura 190 x 210, un pelo piu'
     alto che largo, e preso per montante bloccava tutto l'interno. Un traverso
     e il traverso basso (quello che tocca terra) vanno sempre orizzontali. */
  const fisseX = [];
  const fisseY = [];
  cajas.forEach((c, i) => {
    if (!legno[i] || !dritto(dritti[i]) || (testa && i === testa.i)) return;
    if (alti[i]) {
      if (c[0] > x0 + 2 && c[2] < x1 - 2) fisseX.push([c[0], c[2]]);      // montante di mezzo
      return;
    }
    const verticale = c[3] - c[1] > c[2] - c[0] && dritti[i].papel !== 'traverso' && c[1] > y0 + 2;
    if (verticale) fisseX.push([c[0], c[2]]);
    else fisseY.push([c[1], c[3]]);
  });

  const aa = a ?? x0;
  const bb = b ?? x1;
  /* Con l'arco, ogni fianco paga il suo montante: a prorrata su tutto
     l'interno, le due spalle della Praga —una 58 mm, l'altra 67— cedevano
     diverso e la volta scivolava di 2 mm verso destra. */
  const mx = arco
    ? (() => {
      const l = Math.max(aa, arco.xIzq - 8);
      const r = Math.min(bb, arco.xDer + 8);
      const sin = mappaInterna(aa, l, aa + sx, l, fisseX);
      const des = mappaInterna(r, bb, r, bb - dx, fisseX);
      return { f: (x) => (x < l ? sin.f(x) : x > r ? des.f(x) : x), k: Math.min(sin.k, des.k) };
    })()
    : mappaInterna(aa, bb, aa + sx, bb - dx, fisseX);
  const my = mappaInterna(y0, cTesta ?? y1, y0, (cTesta ?? y1) - su, fisseY);
  if ((sx > 0 || dx > 0) && !(mx.k > 0.5)) { nota.push(`l'interno non basta per allargare (k ${mx.k.toFixed(2)})`); return { pezzi, nota }; }
  if (su > 0 && !(my.k > 0.5)) { nota.push(`l'interno non basta per la testa (k ${my.k.toFixed(2)})`); return { pezzi, nota }; }

  /* UN NODO. Nella banda del montante si sposta di netto verso dentro, salvo
     che stia sul filo dell'anta (fuori non c'e' legno): quello resta. Dentro,
     la mappa a bande. Stesso conto in y per la testa.
     Il filo di fianco si sonda con DUE punti, uno sopra e uno sotto: un nodo
     d'angolo ha la sonda proprio sul canto del vicino, e la traversa della
     Matera S, che arriva mezzo decimo piu' su del montante, sembrava stare sul
     filo e non si spostava. Il filo di testa invece basta che lo veda UNA delle
     tre sonde: l'angolo alto di una traversa che entra mezzo millimetro nel
     montante ha il montante sopra di se', ma accanto ha il vuoto. */
  /* E non un punto solo, un RAGGIO: tre punti a 4, 8 e 12 mm. Fra due pezzi
     calcati a mano resta a volte una fessura di qualche decimo —nella Old
     England Lux l'arco del pannello e quello della traversa non coincidono per
     0,4 mm— e una sonda sola ci cadeva dentro e prendeva l'arco per il filo
     dell'anta: la meta' della traversa non scendeva. */
  const libero = (x, y, ux, uy) => [1, 2, 3].every((t) => fuori(x + ux * SONDA * t, y + uy * SONDA * t));
  const filoSx = (x, y) => libero(x, y - SONDA, -1, 0) && libero(x, y + SONDA, -1, 0);
  const filoDx = (x, y) => libero(x, y - SONDA, 1, 0) && libero(x, y + SONDA, 1, 0);
  /* Le sonde mai sulla verticale del nodo: li' passa spesso il canto comune di
     due pezzi, e un punto esattamente su quel canto non e' dentro a nessuno
     dei due — nella Pluglia il pannello sembrava toccare il filo e non
     scendeva. */
  const filoSu = (x, y) => libero(x - SONDA, y, 0, 1) || libero(x + SONDA, y, 0, 1);
  /* Un vano non sta mai sul filo dell'anta: i suoi nodi si spostano sempre. */
  const X = (x, y, vano) => {
    if (a != null && x <= a) return !vano && filoSx(x, y) ? x : x + sx;
    if (b != null && x >= b) return !vano && filoDx(x, y) ? x : x - dx;
    return mx.f(x);
  };
  const Y = (x, y, vano) => {
    if (cTesta != null && y >= cTesta) return !vano && filoSu(x, y) ? y : y - su;
    return my.f(y);
  };

  const nuovi = dritti.map((p, i) => {
    const q = { ...p };
    const porta = (x, y) => [X(x, y, !legno[i]), Y(x, y, !legno[i])];
    if (p.tipo === 'rect') {
      const v = [[p.x, p.y], [p.x + p.w, p.y], [p.x + p.w, p.y + p.h], [p.x, p.y + p.h]].map(([x, y]) => porta(x, y));
      const xs = v.map((t) => t[0]);
      const ys = v.map((t) => t[1]);
      q.x = Math.min(...xs); q.w = Math.max(...xs) - q.x;
      q.y = Math.min(...ys); q.h = Math.max(...ys) - q.y;
    } else if (p.tipo === 'elipse') {
      const sx0 = porta(p.cx - p.rx, p.cy)[0], sx1 = porta(p.cx + p.rx, p.cy)[0];
      const sy0 = porta(p.cx, p.cy - p.ry)[1], sy1 = porta(p.cx, p.cy + p.ry)[1];
      q.cx = (sx0 + sx1) / 2; q.rx = (sx1 - sx0) / 2;
      q.cy = (sy0 + sy1) / 2; q.ry = (sy1 - sy0) / 2;
    } else if (p.tipo === 'trazado') {
      /* L'ARCO SI PORTA PER TRE PUNTI: i due capi e quello di mezzo. Tenendo il
         bulge com'era, un arco che si stringe in x si abbassa anche in y —il
         bulge e' un angolo, non un'altezza— e la volta dei pannelli della
         Canterbury perdeva 23 mm di freccia: la traversa alta ne guadagnava 50
         al centro e 27 ai lati. Col punto di mezzo portato anche lui, la volta
         resta alta com'era; ed e' lo stesso punto per i due pezzi che si
         toccano lungo quell'arco, quindi continuano a combaciare. */
      const n = p.nodos ?? [];
      const chiuso = p.cerrado !== false;
      const nuoviNodi = n.map((m) => { const [x, y] = porta(m.x, m.y); return { ...m, x, y }; });
      n.forEach((m, i) => {
        const j = (i + 1) % n.length;
        if (!m.b || Math.abs(m.b) < 1e-9 || (!chiuso && j === 0)) return;
        const medio = medioDe([m.x, m.y], [n[j].x, n[j].y], m.b);
        const b = bulgePorTres([nuoviNodi[i].x, nuoviNodi[i].y], porta(medio[0], medio[1]), [nuoviNodi[j].x, nuoviNodi[j].y]);
        if (Number.isFinite(b)) nuoviNodi[i].b = b;
      });
      q.nodos = nuoviNodi;
    }
    /* La zona di vetro della Pluglia e i calati viaggiano col pezzo. */
    if (p.vidrioPuntos?.length) q.vidrioPuntos = p.vidrioPuntos.map((h) => h.map(([x, y]) => porta(x, y)));
    if (p.huecos?.length) q.huecos = p.huecos.map((h) => h.map(([x, y]) => porta(x, y)));
    return q;
  });
  return { pezzi: nuovi, nota, k: { x: mx.k, y: my.k } };
}
