/* ============================================================
   TELAI — che cosa cambia davvero fra uno e l'altro

   Le sezioni del listino dicono com'e' fatto il profilo, ma non cosa
   fa. Guardandole di fila un cliente vede dodici disegni simili e non
   capisce perche' uno costa 30 euro e un altro 250.

   Quello che li separa e' dove finisce l'anta rispetto al filo del
   muro, e cosa la ferma:

     con battuta     l'anta rientra e va a sbattere sullo scalino del
                     telaio. E' lo standard: lo scalino c'e', si vede,
                     e nasconde la luce fra anta e telaio.
     complanare      niente scalino sul lato a filo: l'anta chiusa sta
                     sullo stesso piano del muro. Piu' pulito, ma la
                     luce perimetrale resta a vista.
     a spingere      complanare dalla parte da cui si spinge. Qui lo
                     scalino non c'e' PROPRIO dove servirebbe a
                     fermarla, ed e' per questo che il listino obbliga
                     il fermaporta a pavimento (voce 74). Quei 20 euro
                     non sono un accessorio: sono la conseguenza.
     passaggio       nessuna anta. E' un vano rifinito, non una porta.

   Il disegno qui sotto e' una PIANTA schematica: serve a far vedere il
   comportamento, e sta accanto alla sezione di fabbrica, non al posto
   suo.
   ============================================================ */

import { proj, pushSolid, pushQuad, conVista, registra, PIANTA, MISURE }
  from './aperture.js';

const { T, F, FD } = MISURE;

const T_MURO = { front: 'var(--f-wall)', back: 'var(--f-wall)',
                 edge: 'var(--f-jamb)', top: 'var(--f-jamb)' };
const T_TELAIO = { front: 'var(--f-frame)', back: 'var(--f-frame)',
                   edge: 'var(--f-jamb)', top: 'var(--f-jamb)' };
const T_ANTA = { front: 'var(--f-front)', back: 'var(--f-back)',
                 edge: 'var(--f-edge)', top: 'var(--f-edge)' };
const T_COPRI = { front: 'var(--f-wood)', back: 'var(--f-jamb)',
                  edge: 'var(--f-jamb)', top: 'var(--f-wood)' };

/* Il carattere di ogni telaio, preso dal listino e dalle sue note.
   'battuta'    lo scalino contro cui l'anta si ferma
   'complanare' su quale faccia l'anta sta a filo: null, 'tirare' o
                'spingere' (da quale lato si spinge)
   'anta'       false = passaggio, non c'e' porta
   'coprifilo'  'sagomato' | 'piatto' | 'nessuno' (escluso dal prezzo) */
export const CARATTERE = {
  std:            { battuta: true,  complanare: null, coprifilo: 'sagomato' },
  alpha:          { battuta: true,  complanare: null, coprifilo: 'piatto' },
  alpha_comp:     { battuta: false, complanare: 'tirare',   coprifilo: 'piatto' },
  alpha_comp_sp:  { battuta: false, complanare: 'spingere', coprifilo: 'piatto',
                    fermaporta: true },
  design:         { battuta: true,  complanare: null, coprifilo: 'piatto' },
  design_comp:    { battuta: false, complanare: 'tirare',   coprifilo: 'piatto' },
  passaggio90:    { battuta: false, complanare: null, anta: false, coprifilo: 'piatto' },
  r10:            { battuta: true,  complanare: null, coprifilo: 'nessuno' },
  r10b:           { battuta: true,  complanare: null, coprifilo: 'nessuno' },
  moderno:        { battuta: true,  complanare: null, coprifilo: 'nessuno' },
  madonna:        { battuta: true,  complanare: null, coprifilo: 'sagomato' },
  madonna_mod:    { battuta: true,  complanare: null, coprifilo: 'sagomato' },
};

const MURO_SP = FD;        // spessore del muro nello schema
const SPALLA = 130;        // quanto muro si mostra di lato
const BATTUTA = 14;        // lo scalino
const COP = 12;            // spessore del coprifilo
const SPORTO = 58;         // quanto il coprifilo sborda sul muro
const ANG = 74;            // quanto si apre l'anta nello schema

/* l'anta va e torna, con una sosta aperta per guardare dove sta */
const molla = (x) => x * x * (3 - 2 * x);
function corsa(u) {
  if (u < 0.10) return 0;
  if (u < 0.38) return molla((u - 0.10) / 0.28);
  if (u < 0.60) return 1;
  if (u < 0.88) return molla(1 - (u - 0.60) / 0.28);
  return 0;
}

function disegna(svg, tipo, u) {
  const c = CARATTERE[tipo] || CARATTERE.std;
  conVista(PIANTA, () => {
    const L = [];
    const p = corsa(u);
    // da che parte gira: a spingere l'anta va via da chi guarda
    const vz = c.complanare === 'spingere' ? -1 : 1;

    // il muro, tagliato: due spalle e il vano in mezzo
    for (const d of [1, -1]) {
      pushSolid(L, [d * 150, 0, -MURO_SP / 2], [d * SPALLA, 0, 0], [0, 26, 0],
                [0, 0, MURO_SP], T_MURO);
    }

    // il telaio, che fodera la spalla
    for (const d of [1, -1]) {
      pushSolid(L, [d * 150, 50, -MURO_SP / 2], [d * -F, 0, 0], [0, 40, 0],
                [0, 0, MURO_SP], T_TELAIO);
      // la battuta: lo scalino contro cui l'anta si ferma. Il complanare
      // non ce l'ha, ed e' esattamente quello che si deve vedere.
      if (c.battuta) {
        pushSolid(L, [d * 150, 96, -MURO_SP / 2 + 34], [d * -F * 0.42, 0, 0],
                  [0, 26, 0], [0, 0, BATTUTA], T_TELAIO);
      }
      if (c.coprifilo !== 'nessuno') {
        for (const lato of [1, -1]) {
          pushSolid(L, [d * (150 + SPORTO), 120, lato * MURO_SP / 2],
                    [d * -(SPORTO + F * 0.5), 0, 0], [0, 20, 0],
                    [0, 0, lato * COP], T_COPRI);
        }
      }
    }

    // l'anta. Il passaggio non ce l'ha: e' un vano rifinito, e vederlo
    // vuoto e' l'unica cosa che lo spiega.
    let filo = null;
    if (c.anta !== false) {
      // Dove sta l'anta chiusa: con la battuta rientra dentro il vano,
      // complanare sta sul filo del muro -- da un lato o dall'altro
      // secondo il verso.
      const z0 = c.complanare
        ? (c.complanare === 'spingere' ? -MURO_SP / 2 : MURO_SP / 2 - T)
        : -MURO_SP / 2 + 34;
      const r = (ANG * p * vz) * Math.PI / 180;
      const D = [-Math.cos(r), 0, Math.sin(r)];
      const N = [Math.sin(r), 0, Math.cos(r)];
      const o = [150 - F, 60, z0];
      pushSolid(L, o, [286 * D[0], 0, 286 * D[2]], [0, 46, 0],
                [T * N[0], 0, T * N[2]], T_ANTA);
      filo = z0;
    }

    // il fermaporta a pavimento: c'e' solo dove il listino lo impone
    if (c.fermaporta) {
      pushSolid(L, [-40, 10, -MURO_SP / 2 - 150], [80, 0, 0], [0, 16, 0],
                [0, 0, 34], { front: 'var(--brass)', back: 'var(--brass)',
                              edge: 'var(--brass)', top: 'var(--brass)' });
    }

    componi(svg, L, (sw) => {
      let out = '';
      // il filo del muro: la riga che dice se l'anta e' a filo o rientra
      for (const lato of [1, -1]) {
        const a = proj(-340, 2, lato * MURO_SP / 2);
        const b = proj(340, 2, lato * MURO_SP / 2);
        out += `<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} `
             + `L${b[0].toFixed(1)} ${b[1].toFixed(1)}" stroke="var(--taupe)" `
             + `stroke-width="${(sw * 0.6).toFixed(1)}" stroke-dasharray="`
             + `${(sw * 3).toFixed(1)} ${(sw * 3).toFixed(1)}" opacity=".55" fill="none"/>`;
      }
      // Le scritte si spartiscono lo spazio in verticale, non solo in
      // orizzontale: in pianta lo schema e' largo e basso, e messe alla
      // stessa altezza finivano una sull'altra.
      out += scritta([-215, 2, MURO_SP / 2 + 62], 'filo muro', sw, true);
      if (c.anta === false) {
        out += scritta([150, 2, MURO_SP / 2 + 62], 'nessuna anta', sw);
      } else if (c.complanare) {
        out += scritta([175, 2, filo + (c.complanare === 'spingere' ? -78 : 78)],
                       'anta a filo', sw);
      } else {
        out += scritta([175, 2, filo - 78], 'anta rientrata', sw);
      }
      if (c.battuta) out += scritta([-190, 2, -MURO_SP / 2 - 62], 'battuta', sw);
      if (c.fermaporta) out += scritta([0, 2, -MURO_SP / 2 - 215], 'fermaporta', sw);
      return out;
    });
  });
}

function scritta(p, t, sw, tenue) {
  const q = proj(p[0], p[1], p[2]);
  return `<text x="${q[0].toFixed(1)}" y="${q[1].toFixed(1)}" `
       + `fill="var(--${tenue ? 'taupe' : 'brass'})" text-anchor="middle" `
       + `dominant-baseline="middle" font-weight="600" `
       + `font-family="Jost, Verdana, sans-serif" font-size="${(sw * 11).toFixed(1)}" `
       + `letter-spacing="${(sw * 0.8).toFixed(1)}">${t.toUpperCase()}</text>`;
}

function componi(svg, strato, extra) {
  strato.sort((a, b) => a.z - b.z);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const f of strato) {
    for (const m of f.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)) {
      const x = +m[1], y = +m[2];
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  const m = Math.max(x1 - x0, y1 - y0) * 0.12;
  const vb = [x0 - m, y0 - m, (x1 - x0) + 2 * m, (y1 - y0) + 2 * m];
  const sw = Math.max(vb[2], vb[3]) / 260;
  let out = '';
  for (const f of strato) {
    out += `<path d="${f.d}" fill="${f.fill}"`
         + (f.noStroke ? '' : ` stroke="var(--ink)" stroke-width="${sw.toFixed(1)}"`
            + ' stroke-linejoin="round"') + '/>';
  }
  svg.setAttribute('viewBox', vb.map((n) => n.toFixed(0)).join(' '));
  svg.innerHTML = out + extra(sw);
}

/** Mostra il comportamento di un telaio in un <svg>. */
export function mostraTelaio(svg, tipo) {
  registra(svg, (u) => disegna(svg, tipo, u), 7);
}
