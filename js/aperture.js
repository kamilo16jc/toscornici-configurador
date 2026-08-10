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

/* Il punto di vista non e' uguale per tutti.
   Quello di sempre (28 gradi, inclinazione 0.32) guarda la porta quasi
   in faccia, ed e' giusto per un'anta che gira: si vede la bugnatura e
   si capisce da che parte va.
   Per le porte a libro no. Li' quello che conta succede in PIANTA -- le
   ante che si piegano, il carrello che corre nel binario -- e una vista
   frontale quella dimensione la schiaccia a niente. Provato: i tre
   meccanismi venivano fuori indistinguibili, che e' esattamente il
   contrario di quello che devono fare. La fabbrica li disegna in pianta
   per lo stesso motivo. */
const VISTE = {
  libro_battente:    { view: 32, tilt: 0.72 },
  libro_simmetrica:  { view: 32, tilt: 0.72 },
  libro_asimmetrica: { view: 32, tilt: 0.72 },
};
/* La pianta e' un'altra cosa, non un'assonometria molto inclinata.
   Guardando dall'alto la profondita' non e' piu' il fondo della stanza
   ma l'ALTEZZA: quello che sta piu' in alto va disegnato per ultimo. Se
   si continuasse a ordinare per z, il pavimento finirebbe sopra le ante.
   E' la vista in cui la fabbrica disegna le porte a libro, perche' e'
   l'unica dove le cerniere e la piega si leggono senza interpretare. */
export const PIANTA = { view: 0, tilt: 1, pianta: true };
// L'alzato: di fronte, senza scorcio. E' la vista delle quote -- una
// misura storta non si legge, e sommarci una prospettiva vorrebbe dire
// disegnare 900 mm lunghi 830.
export const ALZATO = { view: 0, tilt: 0 };
const VISTA_BASE = { view: VIEW, tilt: TILT };
let vista = VISTA_BASE;
let cosV = Math.cos(VIEW * Math.PI / 180);
let sinV = Math.sin(VIEW * Math.PI / 180);

function guarda(tipo, richiesta) {
  vista = richiesta || VISTE[tipo] || VISTA_BASE;
  cosV = Math.cos(vista.view * Math.PI / 180);
  sinV = Math.sin(vista.view * Math.PI / 180);
}

export const proj = (x, y, z) => {
  const dp = x * sinV + z * cosV;
  if (vista.pianta) return [x * cosV - z * sinV, dp, y];
  return [x * cosV - z * sinV, -y + dp * vista.tilt, dp];
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
const T_METAL = { front: 'var(--f-bin)',   back: 'var(--f-bin-scuro)',
                  edge: 'var(--f-bin-scuro)', top: 'var(--f-bin)' };

/* ferramenta delle porte a libro */
const BIN_H = 38, BIN_Z = 30;      // binario a soffitto: sezione
const CAR_L = 104;                 // carrello

export function pushSolid(list, o, u, v, w, tone) {
  const P = (a, b, c) => [o[0] + u[0]*a + v[0]*b + w[0]*c,
                          o[1] + u[1]*a + v[1]*b + w[1]*c,
                          o[2] + u[2]*a + v[2]*b + w[2]*c];
  const p = [P(0,0,0), P(1,0,0), P(1,1,0), P(0,1,0),
             P(0,0,1), P(1,0,1), P(1,1,1), P(0,1,1)];
  const facce = [[[0,1,2,3],'back'], [[4,5,6,7],'front'], [[1,5,6,2],'edge'],
                 [[0,4,7,3],'edge'], [[3,2,6,7],'top'], [[0,1,5,4],'top']];
  // PROVATO E SCARTATO: buttare via le facce che guardano dall'altra
  // parte, confrontando la profondita' della faccia con quella del
  // centro del solido. Sembra un risparmio e invece e' la causa dello
  // sfarfallio: quando una faccia arriva quasi di taglio i due valori
  // si sfiorano, la faccia entra ed esce a ogni fotogramma e lascia un
  // buco che lampeggia. Misurato sui tre schemi a libro: il numero di
  // facce ballava 23-21-23-21 lungo tutta la corsa.
  //
  // Adesso si disegnano tutte e sei e decide l'ordine per profondita'.
  // Una faccia di troppo non si vede -- ci passa sopra quella davanti,
  // che e' opaca -- mentre una faccia che manca si vede eccome.
  for (const [idx, kind] of facce) {
    const q = idx.map((n) => { const a = p[n]; return proj(a[0], a[1], a[2]); });
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
    // deco: sta nella scena ma non nell'inquadratura. Le fasce del
    // pavimento sono un'indicazione, non un pezzo della porta, e se
    // entrano nel calcolo si mangiano tutto lo spazio.
    deco: opts.deco,
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
      // La maniglia sta sul bordo libero, le cerniere su quello fisso.
      // In una porta a libro l'anta a muro ha il bordo libero attaccato
      // all'altra anta: li' non ci va nessuna maniglia, ci vanno le
      // cerniere DELL'ALTRA. Per questo si puo' chiedere l'una senza
      // l'altra invece di prendere o lasciare tutto il corredo.
      if (!opts.senzaManiglia) {
        hw.handles.push({ rose: at(larg - 105, hv, T),
                          knee: at(larg - 105, hv, T + 30),
                          tip:  at(larg - 235, hv, T + 30) });
      }
      if (!opts.senzaCerniere) {
        for (const v of [alt * 0.22, alt * 0.78]) {
          hw.hinges.push([at(0, v - 55, T * 0.5), at(0, v + 55, T * 0.5)]);
        }
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

/* ============================================================
   PORTE A LIBRO — quello che cambia non e' il movimento, e' cosa
   tiene le ante. Da chiuse si somigliano tutte e tre; il senso di
   questi schemi e' far vedere il meccanismo, non solo la corsa.

     battente      solo cerniere. Niente binario: il bordo libero
                   gira per aria, e allora si disegna il giro che fa.
     simmetrica    due ante uguali. Il bordo libero sta in un
                   carrello che corre nel binario a soffitto, e da
                   li' non esce: la sua traccia e' una retta.
     asimmetrica   ante di larghezza diversa. Perche' il bordo
                   libero resti nel binario l'anta corta DEVE
                   piegare di piu' dell'altra -- e' geometria, non
                   scelta -- ed e' quello che chiede il braccio di
                   guida. Le due ante che chiudono ad angoli diversi
                   sono la firma di questo meccanismo.
   ============================================================ */

/* il binario a soffitto, dentro il vano */
function binario(L) {
  pushSolid(L.telaio, [-W/2, H - BIN_H - 8, T/2 - BIN_Z/2], [W, 0, 0],
            [0, BIN_H, 0], [0, 0, BIN_Z], T_METAL);
}

/* il carrello, dove il bordo libero e' agganciato al binario */
function carrello(L, x) {
  pushSolid(L.front, [x - CAR_L/2, H - BIN_H - 22, T/2 - BIN_Z],
            [CAR_L, 0, 0], [0, BIN_H + 14, 0], [0, 0, 2*BIN_Z], T_METAL);
}

/* Da che parte si sta. Il pavimento dei due lati cambia tinta, e la
   fascia di la' si vede attraverso il vano quando la porta e' aperta:
   e' il momento in cui serve saperlo. */
function lati(L, testi, opt) {
  // Le fasce restano strette apposta. Larghe inghiottivano l'inquadratura
  // e le ante venivano fuori grandi come francobolli.
  const bx = W / 2 + F + WALL;
  const q = 460;
  const dentro = FD / 2, fuori = -FD / 2;
  pushQuad(L.back, [[-bx, 1, dentro], [bx, 1, dentro],
                    [bx, 1, dentro + q], [-bx, 1, dentro + q]],
           'var(--f-dentro)', { z: -9e4, noStroke: true, force: true, deco: true });
  pushQuad(L.back, [[-bx, 1, fuori - q], [bx, 1, fuori - q],
                    [bx, 1, fuori], [-bx, 1, fuori]],
           'var(--f-fuori)', { z: -9.5e4, noStroke: true, force: true, deco: true });
  const P = opt.parole || { dentro: 'INTERNO', fuori: 'ESTERNO' };
  // Il lato da cui si guarda e' l'ESTERNO: si sta fuori e si spinge la
  // porta verso dentro. Le due scritte erano scambiate, e su un disegno
  // tecnico una scritta girata al contrario confonde piu' che tacere.
  // (Le variabili qui sotto dicono dove sta la fascia, non che stanza
  // sia: 'dentro' e' quella vicina a chi guarda.)
  //
  // In fondo alle fasce, non a meta': l'anta aperta viene avanti proprio
  // di qua, e alla scritta si sedeva addosso.
  testi.push({ p: [-bx + 250, 1, dentro + q * 0.82], t: P.fuori });
  testi.push({ p: [ bx - 250, 1, fuori - q * 0.82], t: P.dentro });
}

/* Il giunto fra le due ante: l'anta a muro ha girato di r1, quindi il
   giunto si e' spostato in dentro e in avanti. */
const giunto = (s, vz, L1, r1) =>
  [s * (W / 2 - L1 * Math.cos(r1)), 0, vz * L1 * Math.sin(r1)];

/* L'angolo che la seconda anta DEVE fare perche' il bordo libero torni
   sul piano della porta, cioe' dentro il binario. Con ante uguali viene
   uguale e opposto; con ante diverse no, ed e' tutta la differenza fra
   la simmetrica e l'asimmetrica. */
function angoloRitorno(L1, L2, r1) {
  const sn = (L1 / L2) * Math.sin(r1);
  return Math.asin(Math.min(1, sn));
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

function scena(tipo, u, opt) {
  opt = opt || {};
  // ogni tipo ha il punto di vista da cui si legge, e chi chiama puo'
  // chiederne un altro: e' cosi' che lo stesso schema si mostra in
  // assonometria e in pianta senza duplicare niente
  guarda(tipo, opt.vista);
  // La mano non e' una decorazione: se il cliente sceglie SX e lo
  // schema mostra DX, lo schema mente. s = -1 ribalta il lato delle
  // cerniere, ed e' lo stesso trucco che la porta a due ante usa da
  // sempre per la sua seconda anta.
  const s = opt.mano === 'sx' ? -1 : 1;
  // Verso: a spingere l'anta va via da chi guarda, a tirare gli viene
  // incontro. E' il segno della componente in profondita'.
  const vz = opt.verso === 'tirare' ? -1 : 1;
  const L = { back: [], telaio: [], anta: [], front: [] };
  const hw = { handles: [], hinges: [], incassi: [], bracci: [] };
  const testi = [];
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
    case 'libro_battente':
    case 'libro_simmetrica':
    case 'libro_asimmetrica': {
      guscio(L, {});
      lati(L, testi, opt);

      const asim = tipo === 'libro_asimmetrica';
      // l'anta a muro e' la larga: e' quella che regge il peso
      const L1 = asim ? W * 0.58 : W / 2;
      const L2 = W - L1;
      // Con ante diverse il bordo libero arriva in fondo al binario
      // prima: oltre questo angolo l'anta corta dovrebbe girare piu'
      // di 90 gradi, e il meccanismo si pianta. Non e' un numero a
      // occhio, e' asin(L2/L1).
      const gMax = asim
        ? Math.asin(L2 / L1) * 180 / Math.PI - 2
        : Math.min(ANG, 64);

      const piega = (q) => {
        const r1 = gMax * q * Math.PI / 180;
        const r2 = asim ? angoloRitorno(L1, L2, r1) : r1;
        const gi = giunto(s, vz, L1, r1);
        return {
          r1, r2, gi,
          libero: [gi[0] - s * L2 * Math.cos(r2), 0,
                   gi[2] - vz * L2 * Math.sin(r2)],
        };
      };

      const k = piega(p);
      const g1 = k.r1 * 180 / Math.PI, g2 = k.r2 * 180 / Math.PI;

      ombra([s * W/2, 0, 0], s, vz * g1, L1);
      // La ferramenta racconta il meccanismo, e va messa dove sta:
      //   anta a muro   cerniere sullo stipite, e basta
      //   anta libera   cerniere sul giunto (e' li' che le due ante
      //                 sono attaccate fra loro) e maniglia sul bordo
      //                 che si prende in mano
      // Prima l'anta a muro perdeva tutto appena si apriva e la seconda
      // non aveva niente: le cerniere del giunto, che sono la firma di
      // una porta a libro, non si vedevano mai.
      anta(L.anta, hw, [s * W/2, 0, 0], s, vz * g1, L1, H,
           { senzaManiglia: true });
      anta(L.anta, hw, k.gi, s, -vz * g2, L2, H);

      // PROVATO E SCARTATO: disegnare a terra il giro del bordo libero
      // della battente, per dire "qui non c'e' binario". Non dice
      // niente: con due ante uguali il bordo libero NON esce dal piano
      // della porta, quindi il suo giro e' una retta -- la stessa che
      // fa la simmetrica dentro il binario -- e per giunta finisce
      // sotto l'anta. La differenza fra le due sta solo nella
      // ferramenta, ed e' li' che va detta.
      if (tipo !== 'libro_battente') {
        binario(L);
        carrello(L, k.libero[0]);
        if (asim) {
          // Il braccio di guida: sta fra il carrello e il giunto, ed e'
          // il pezzo che costringe l'anta corta a piegare di piu'.
          const alto = H - BIN_H - 30;
          hw.bracci.push([[k.libero[0], alto, T / 2],
                          [k.gi[0], alto, k.gi[2] + vz * T / 2]]);
        }
      }
      break;
    }
    default:
      guscio(L, {});
      anta(L.anta, hw, [W/2, 0, 0], 1, 0, W, H);
  }
  return { L, hw, arco, testi };
}

/* l'inquadratura abbraccia tutti i fotogrammi, non solo quello a riposo */
const vbCache = {};
function inquadra(tipo, opt) {
  opt = opt || {};
  // la chiave porta anche mano e verso: la stessa porta a destra o a
  // sinistra occupa lo spazio dall'altra parte
  const v = opt.vista;
  const key = `${tipo}|${opt.mano || 'dx'}|${opt.verso || 'spingere'}`
            + `|${v ? (v.pianta ? 'p' : '') + v.view + ':' + v.tilt : ''}`;
  if (vbCache[key]) return vbCache[key];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const u of [0.02, 0.20, 0.30, 0.48, 0.65, 0.75, 0.86]) {
    const sc = scena(tipo, u, opt);
    for (const strato of [sc.L.back, sc.L.telaio, sc.L.anta, sc.L.front]) {
      for (const f of strato) {
        if (f.deco) continue;
        for (const m of f.d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)) {
          const x = +m[1], y = +m[2];
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    // Le scritte contano: sono contenuto, non contorno. Senza, ESTERNO
    // finiva fuori dal riquadro e non si vedeva -- sta oltre il muro, e
    // il muro e' l'ultima cosa che il calcolo conosceva.
    for (const tx of sc.testi || []) {
      const q = proj(tx.p[0], tx.p[1], tx.p[2]);
      if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0];
      if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
    }
  }
  const m = 130;
  vbCache[key] = [x0 - m, y0 - m, (x1 - x0) + 2*m, (y1 - y0) + 2*m];
  return vbCache[key];
}

function disegna(svg, tipo, u, opt) {
  const vb = inquadra(tipo, opt);
  svg.setAttribute('viewBox', vb.map((n) => n.toFixed(0)).join(' '));
  const sc = scena(tipo, u, opt);
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
  // Il giro del bordo libero, per la battente: e' l'unica cosa che
  // dice a colpo d'occhio che li' non c'e' nessun binario.
  for (const [p0, p1] of sc.hw.hinges) out += seg(p0, p1, sw * 3.4);
  for (const [p0, p1] of sc.hw.incassi) out += seg(p0, p1, sw * 2.6, '.85');
  for (const [p0, p1] of sc.hw.bracci) out += seg(p0, p1, sw * 2.8);
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
  // Il corpo del testo si misura sul lato CORTO. Con quello lungo la
  // pianta, che e' larga e bassa, si ritrovava le scritte grosse il
  // doppio dell'assonometria.
  const tw = Math.min(vb[2], vb[3]) / 330;
  if (vista.pianta) {
    // Dall'alto niente copre il pavimento: le scritte vanno tutte sopra.
    out += scritte(sc.testi, () => true, tw);
  } else {
    out = scritte(sc.testi, (P) => P[2] < 0, tw) + out
        + scritte(sc.testi, (P) => P[2] >= 0, tw);
  }
  svg.innerHTML = out;
}

/* Le scritte non stanno tutte davanti: ESTERNO e' dall'altra parte del
   muro, e disegnata in coda finiva sopra l'anta come un adesivo. Quelle
   di la' vanno sotto a tutto, cosi le copre quello che le sta davanti. */
function scritte(testi, quali, sw) {
  let out = '';
  for (const tx of testi) {
    if (!quali(tx.p)) continue;
    const q = proj(tx.p[0], tx.p[1], tx.p[2]);
    out += '<text x="' + q[0].toFixed(1) + '" y="' + q[1].toFixed(1) + '" ' +
           'fill="var(--taupe)" text-anchor="middle" ' +
           'font-family="Jost, Verdana, sans-serif" font-weight="600" ' +
           'font-size="' + (sw * 13).toFixed(1) + '" ' +
           'letter-spacing="' + (sw * 1.6).toFixed(1) + '">' + tx.t + '</text>';
  }
  return out;
}

/* ---- un solo ciclo per tutti gli schemi visibili ------------------- */
const attivi = [];          // { svg, draw, dur }
const fermo = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Le porte a libro hanno piu' da guardare -- due ante che piegano, il
// carrello che corre, le cerniere del giunto che lavorano -- e a 5.5
// secondi non si fa in tempo a seguirle. Le altre restano com'erano:
// quella cadenza e' stata approvata col cliente.
const DURATE = { libro_battente: 9.5, libro_simmetrica: 9.5,
                 libro_asimmetrica: 9.5 };

// Un solo cronometro, e ognuno ci legge il proprio giro. Cosi' due
// schemi con la stessa durata restano in passo -- e' quello che tiene
// insieme l'assonometria e la pianta della stessa porta -- e uno piu'
// lento non trascina gli altri.
let trascorso = 0, last = performance.now(), avviato = false;

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  trascorso += dt;
  for (const a of attivi) {
    if (a.svg.isConnected) a.draw((trascorso / a.dur) % 1);
  }
  requestAnimationFrame(loop);
}

/** Iscrive un <svg> al ciclo comune. draw(u) ridisegna il fotogramma. */
export function registra(svg, draw, dur) {
  if (!svg) return;
  let a = attivi.find((x) => x.svg === svg);
  if (!a) { a = { svg, draw, dur: dur || DUR }; attivi.push(a); }
  a.draw = draw;
  a.dur = dur || DUR;
  draw(fermo ? 0.5 : (trascorso / a.dur) % 1);   // fermo: a meta' corsa
  if (!fermo && !avviato) { avviato = true; requestAnimationFrame(loop); }
}

/**
 * Mostra un'apertura in un <svg> della pagina.
 * opt: { mano: 'dx'|'sx', verso: 'spingere'|'tirare', parole: {dentro, fuori} }
 * Senza opt si comporta come prima: chi la chiamava non deve cambiare.
 */
export function mostraApertura(svg, tipo, opt) {
  registra(svg, (u) => disegna(svg, tipo, u, opt), DURATE[tipo]);
}

/** Un fotogramma fermo, per il banco di prova: u da 0 (chiusa) a 1. */
export function fotogramma(svg, tipo, u, opt) {
  disegna(svg, tipo, u, opt);
}

/**
 * Presta il punto di vista a chi disegna da fuori.
 * proj() legge una variabile del modulo, quindi chiamarla dall'esterno
 * senza dire da dove si guarda darebbe l'ultima vista rimasta in giro.
 * Qui si imposta, si disegna e si rimette com'era.
 */
export function conVista(v, fn) {
  const prima = vista;
  guarda(null, v);
  try { return fn(); } finally { guarda(null, prima); }
}

/** Le misure vere, per chi disegna quote sulla stessa scala. */
export const MISURE = { W, H, T, F, FD, WALL };
