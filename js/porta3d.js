/* ============================================================
   LA PORTA, COSTRUITA DAL DISEGNO DI FABBRICA

   Non c'e' un modellatore qui dentro: OGNI pezzo di una porta e' la sua
   sezione tirata per la sua lunghezza -- il montante in verticale, i
   traversi in orizzontale, il telaio intorno al vano. E' letteralmente
   come esce dalla toupie. Quindi c'e' UNA funzione che estrude una
   sezione lungo un asse, chiamata sei volte, piu' una che fa rientrare
   un rettangolo un po' per volta -- e quella basta per la bugna del
   pannello e per il coprifilo in mitra, che sono la stessa idea.

   TRE CATALOGHI, NON UNO
     assets/porte/<modello>/anta.json   il disegno dell'anta
     assets/telai/<nome>.json           il telaio, uno per molti modelli
     assets/coprifili/<ruolo>.json      i profili, di tutti
   Un coprifilo non appartiene a nessuna porta: sta sul muro, e l'anta
   non lo tocca nemmeno. Percio' cambiarlo rifa' un anello e non tocca
   un triangolo della porta.

   LO STESSO MOTORE LO USANO IL BANCO E IL CONFIGURATORE. Il banco lo
   guarda da vicino coi suoi comandi; il configuratore lo mette nella
   stanza, in metri, col suo legno e le sue luci. Le misure qui sono
   sempre in MILLIMETRI, come i disegni: chi lo mette in scena scala.
   ============================================================ */

import * as THREE from 'three';

/** Carica i tre pezzi di catalogo e li mette insieme. */
export async function caricaPorta(modello) {
  const anta = await (await fetch(`assets/porte/${modello}/anta.json`)).json();
  const telaio = await (await fetch(`assets/telai/${anta.telaio}.json`)).json();
  return { ...anta, ...telaio, nome: anta.nome, modello };
}

/* Come sta messo un coprifilo, e non si suppone: si misura.
   Il DORSO e' la faccia piatta che appoggia al muro -- la si trova
   cercando il livello con la corsa orizzontale piu' lunga, non il punto
   piu' basso, che e' un'altra cosa. Il PIEDE e' quel che scende sotto il
   dorso: e' la battuta che scavalca l'imbotto, e va verso il vano.
   Serve perche' i sedici DXF NON sono orientati allo stesso modo: in
   nove il piede sta a destra, in cinque a sinistra. */
function assetta(p, larghezza) {
  // le corse orizzontali, quota per quota
  const corse = new Map();
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    if (Math.abs(a[1] - b[1]) > .3) continue;
    const k = Math.round((a[1] + b[1]) / 2 * 2) / 2;
    corse.set(k, (corse.get(k) || 0) + Math.abs(a[0] - b[0]));
  }
  /* IL DORSO E' LA QUOTA DA CUI PARTE IL PIEDE, e va cercato cosi'.
     Prendere la corsa piu' lunga -- che sembra ovvio -- sbaglia proprio
     sul listellare: quello e' disegnato al ROVESCIO rispetto agli altri
     quindici, con la faccia liscia in basso e le cave di stabilita' in
     alto, e la corsa piu' lunga e' la faccia a vista. Montandolo cosi'
     le cave finivano in vista sulla parete, e un listellare le cave non
     le ha: sono dietro, contro il muro, e servono a non farlo imbarcare.
     Il piede invece si riconosce sempre: e' l'unica sporgenza CORTA, sta
     a un capo solo, e da qualunque parte sia disegnata dice dov'e' il
     dorso. */
  let dorso = null, minimo = 1e9, lunga = 0, dorsoLungo = 0;
  for (const [y, len] of corse) {
    if (len > lunga) { lunga = len; dorsoLungo = y; }
    if (len < larghezza * .15) continue;
    for (const s of [1, -1]) {
      const oltre = p.filter((q) => (q[1] - y) * s > .5);
      if (!oltre.length) continue;
      const largo = Math.max(...oltre.map((q) => q[0]))
                  - Math.min(...oltre.map((q) => q[0]));
      if (largo < larghezza * .35 && largo < minimo) { minimo = largo; dorso = y; }
    }
  }
  if (dorso === null) dorso = dorsoLungo;    // tavola liscia, senza piede

  // il corpo sta da una parte del dorso, il piede dall'altra
  const su = p.filter((q) => q[1] > dorso + .5);
  const giu = p.filter((q) => q[1] < dorso - .5);
  const corpoSu = su.length > giu.length;
  const piede = corpoSu ? giu : su;
  // e il piede sta a un capo solo: quel capo va verso il vano
  const media = piede.length
    ? piede.reduce((s, q) => s + q[0], 0) / piede.length : larghezza;
  let q = media < larghezza / 2
    ? p.map(([x, y]) => [larghezza - x, y]).reverse() : p.slice();
  /* u: distanza dal filo verso il vano.  v: fuori dal muro.
     Il verso di v si prende dal CORPO, non da come e' stato disegnato:
     il corpo sta fuori e il piede dentro, sempre. */
  const s = corpoSu ? 1 : -1;
  q = q.map(([x, y]) => [larghezza - x, (y - dorso) * s]);
  return s < 0 ? q.reverse() : q;      // il verso del contorno non cambia
}

const cacheSez = {};
export async function sezioneCoprifilo(slug) {
  if (!cacheSez[slug]) {
    cacheSez[slug] = fetch(`assets/coprifili/${slug}.json`).then((r) => r.json())
      .then((j) => assetta(j.punti, j.larghezza));
  }
  return cacheSez[slug];
}

/**
 * Costruisce la porta. Torna un gruppo da appendere alla scena e i
 * comandi per cambiarla.
 *
 *   d          il dizionario di caricaPorta()
 *   PROFILI    la tabella coprifilo -> misura -> disegno (visore-profilo.js)
 *   materiale  il legno. Se non si passa, se lo fa da se'
 */
export function creaPorta(d, PROFILI, materiale, passoUV) {
  const L = d.anta.larghezza, H = d.anta.altezza, T = d.spessore;
  const mat = materiale || legnoDiSerie();

  const gruppo = new THREE.Group();
  const gTelaio = new THREE.Group(), gAnta = new THREE.Group(),
        gPann = new THREE.Group(), gFerro = new THREE.Group();
  const gCerniere = new THREE.Group();
  gTelaio.add(gCerniere);
  const gCopri = new THREE.Group();
  gTelaio.add(gCopri);
  const perno = new THREE.Group();
  const foglia = new THREE.Group();
  perno.add(foglia);
  foglia.add(gAnta, gPann, gFerro);
  gruppo.add(gTelaio, perno);

  const PERNO_Z = T + 3;         // il nodo della cerniera, appena fuori
  let tipo = 1, mano = 1, copri = 'listellare', misuraCopri = null;
  let levaGiro = [], scrocco = null;

  const ombreggia = () => ombreggiaGruppo(gruppo);

  const metti = (gr, geo, giro) => {
    gr.add(new THREE.Mesh(grana(geo, giro), mat));
    return geo;
  };

/* ── le due estrusioni ──────────────────────────────────────────────── */

/* La sezione arriva come coppie (a, b) nel piano del taglio; l'asse su
   cui corre e' il terzo. ExtrudeGeometry pero' sa fare solo forme nel
   piano XY tirate lungo Z, quindi la forma si costruisce girata e poi
   si ruota tutta. Le rotazioni sono vere rotazioni e non specchi: uno
   specchio inverte il verso dei triangoli e la luce entrerebbe dalla
   parte sbagliata. */
/* I contorni arrivano dal DXF con gli archi spezzati ogni due gradi: su
   un raccordo da cinque millimetri fanno segmenti da 0,17 mm. Il
   montante ha 283 punti e 271 distano meno di mezzo millimetro, con
   passo mediano di un decimo.
   Estruderli cosi' produce, lungo ogni modanatura, centinaia di strisce
   di triangoli PIU' STRETTE DI UN PIXEL: il rasterizzatore ne prende una
   o l'altra a seconda di dove cade il centro del pixel, e girando la
   scena l'assegnazione cambia. Sono le righe tratteggiate che
   sfarfallavano -- non erano ombre, non era l'occlusione, non erano
   piani complanari, era che il solido e' descritto molto piu' fine di
   quanto lo schermo possa mostrare.
   Si diradano: un punto si tiene se dista almeno mezzo millimetro dal
   precedente, oppure se li' il contorno gira davvero -- cosi' gli
   spigoli restano vivi e le curve restano curve. */
function dirada(punti, passo = .5, virata = 20) {
  const g = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const fuori = [punti[0]];
  for (let i = 1; i < punti.length; i++) {
    const p = punti[i], u = fuori[fuori.length - 1];
    const lontano = Math.hypot(p[0] - u[0], p[1] - u[1]) >= passo;
    const prossimo = punti[(i + 1) % punti.length];
    let gira = Math.abs(g(u, p) - g(p, prossimo)) * 180 / Math.PI;
    if (gira > 180) gira = 360 - gira;
    if (lontano || gira >= virata) fuori.push(p);
  }
  return fuori;
}

function sagoma(punti) {
  const s = new THREE.Shape();
  dirada(punti).forEach(([a, b], i) => (i ? s.lineTo(a, b) : s.moveTo(a, b)));
  s.closePath();
  return s;
}

/** Sezione in (X, Z), tirata lungo Y da y0 a y1. Montanti e stipiti. */
function verticale(punti, y0, y1) {
  const g = new THREE.ExtrudeGeometry(
    sagoma(punti.map(([x, z]) => [x, -z])),
    { depth: y1 - y0, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);            // (x, y, t) → (x, t, -y)
  g.translate(0, y0, 0);
  return g;
}

/** Sezione in (Y, Z), tirata lungo X da x0 a x1. Traversi e traversa alta. */
function orizzontale(punti, x0, x1) {
  const g = new THREE.ExtrudeGeometry(
    sagoma(punti.map(([y, z]) => [-z, y])),
    { depth: x1 - x0, bevelEnabled: false, curveSegments: 1 });
  g.rotateY(Math.PI / 2);             // (x, y, t) → (t, y, -x)
  g.translate(x0, 0, 0);
  return g;
}

/* Specchiare un pezzo senza specchiare la geometria: si ribalta la
   SEZIONE (e si gira anche l'ordine dei punti, se no il contorno
   cambia verso e le pareti guardano dentro). */
const ribalta = (punti, attorno) =>
  punti.map(([a, b]) => [attorno - a, b]).reverse();

/* ── il pannello con la bugna ───────────────────────────────────────── */
/* Ogni campione della bugna e' un anello: il rettangolo del riquadro
   rientrato di d, alla quota z. Fra un anello e il successivo, quattro
   quadrilateri -- uno per lato. I quattro lati restano SEPARATI apposta:
   lungo il rientro la superficie deve essere liscia, ma sull'angolo no,
   li' ci va lo spigolo netto della mitra. Un solo pezzo cucito darebbe
   una bugna che agli angoli si arrotonda, che nel legno non succede. */
function pannello(r, bugna, zc, gioco) {
  const x0 = r.x0 + gioco, x1 = r.x1 - gioco;
  const y0 = r.y0 + gioco, y1 = r.y1 - gioco;
  const pos = [], idx = [], uv = [];
  let n = 0;

  // i quattro lati, come coppie di angoli in funzione del rientro
  const LATI = [
    (t) => [[x0 + t, y0 + t], [x1 - t, y0 + t]],   // sotto
    (t) => [[x1 - t, y0 + t], [x1 - t, y1 - t]],   // destra
    (t) => [[x1 - t, y1 - t], [x0 + t, y1 - t]],   // sopra
    (t) => [[x0 + t, y1 - t], [x0 + t, y0 + t]],   // sinistra
  ];
  const metti = (p, z) => { pos.push(p[0], p[1], z); uv.push(p[0] / 1000, p[1] / 1000); return n++; };

  for (const verso of [1, -1]) {
    for (const lato of LATI) {
      const base = n;
      for (const [dist, z] of bugna) {
        const [a, b] = lato(dist);
        metti(a, zc + verso * z);
        metti(b, zc + verso * z);
      }
      for (let i = 0; i + 1 < bugna.length; i++) {
        const p = base + i * 2;
        if (verso > 0) idx.push(p, p + 1, p + 3, p, p + 3, p + 2);
        else idx.push(p, p + 3, p + 1, p, p + 2, p + 3);
      }
    }
    // il piano in mezzo, dove la bugna ha finito di salire
    const t = bugna[bugna.length - 1][0], z = zc + verso * bugna[bugna.length - 1][1];
    const c = [metti([x0 + t, y0 + t], z), metti([x1 - t, y0 + t], z),
               metti([x1 - t, y1 - t], z), metti([x0 + t, y1 - t], z)];
    if (verso > 0) idx.push(c[0], c[1], c[2], c[0], c[2], c[3]);
    else idx.push(c[0], c[2], c[1], c[0], c[3], c[2]);
  }
  // il fianco che sta dentro la cava
  const zt = bugna[0][1];
  for (const lato of LATI) {
    const [a, b] = lato(0);
    const p = [metti(a, zc + zt), metti(b, zc + zt), metti(a, zc - zt), metti(b, zc - zt)];
    idx.push(p[0], p[2], p[1], p[1], p[2], p[3]);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
/* LE UV VANNO RIFATTE, non bastano quelle che escono dall'estrusione.
   ExtrudeGeometry le prende dalle coordinate della SEZIONE -- che qui
   e' larga 114 mm e lunga duemila -- e la texture veniva stirata in una
   striscia sola: i montanti e i traversi uscivano di legno finto liscio,
   e si vedeva la differenza coi pannelli, che le UV ce l'hanno a posto.

   Si proietta di piatto sul davanti, che di una porta e' la faccia che
   si guarda. E si gira di un quarto sui pezzi orizzontali: la grana di
   un traverso corre per il lungo del traverso, come il tavolame da cui
   e' stato tagliato. E' la cosa che, guardando una porta vera, dice
   subito che i pezzi sono pezzi e non un disegno stampato sopra. */
  /* Quanto misura una piastrella di legno, in mm. Chi ci mette il suo
     materiale deve dirlo: il configuratore fa ripetere le sue texture
     sei volte sulle UV, e se qui si lasciasse la misura vera il legno
     uscirebbe a scacchiera. */
  const PASSO = passoUV || 760;
function grana(geo, giro) {
  const p = geo.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / PASSO, y = p.getY(i) / PASSO;
    uv[i * 2] = giro ? y : x;
    uv[i * 2 + 1] = giro ? x : y;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

/* DA CHE PARTE GIRA, non l'abbiamo scelto noi: lo dice la tavola.
   La maniglia sta a 59 mm dal filo sinistro -- e' l'entrata della
   serratura -- quindi la serratura e' a sinistra e le cerniere sono a
   destra. E il verso: la battuta del telaio sta tutta di la' dalla
   faccia dell'anta, e contro una battuta non ci si spinge, quindi la
   porta si apre dall'altra parte, verso chi guarda.
   Il perno sta appena fuori dallo spigolo, dove sta il nodo di una
   cerniera vera: se lo si mette sull'asse dell'anta, aprendo, lo
   spigolo entra nel telaio. */
let suolo = null;                    // il pavimento, montato piu' sotto
let compositore = null;              // e la catena di resa, con l'occlusione
/* ── i tre tipi di finitura ─────────────────────────────────────────── */
/* La fabbrica ne offre tre, e cambiano DUE cose insieme -- il filo
   interno del telaio dell'anta e il pannello:
     1  bastone sagomato, pannello bugnato che esce dal filo
     2  bastone tondo,    pannello piatto, tutto dentro
     3  bastone a spigolo vivo, pannello piatto, tutto dentro
   Del tipo 1 abbiamo la tavola, e infatti e' preso da li' al centesimo.
   Del 2 e del 3 no: quei DXF non sono ancora arrivati, e questi due
   profili li abbiamo disegnati noi sul catalogo. Il posto della cava,
   la sua larghezza e la profondita' del rientro pero' restano quelli
   veri -- si cambia la forma del labbro, non le misure. */

// il rientro: quanto il bastone entra oltre il fondo della cava
const RIENTRO = d.montante.larghezza - d.riquadri[0].x0;
const SPCAVA = d.pannello.bugna[0][1] * 2;          // larghezza della cava
const ZC = d.pannello.z_centro;
const CAVA0 = ZC - SPCAVA / 2, CAVA1 = ZC + SPCAVA / 2;

/* Il labbro, dal fondo cava al filo, per i tipi 2 e 3. Si scrive sempre
   dal basso verso l'alto e poi, se serve, si gira. */
function labbro(tipo, thr, s, giu, su) {
  const A = thr + s * RIENTRO;
  const q = [];
  if (tipo === 3) {
    q.push([A, giu], [A, CAVA0], [thr, CAVA0], [thr, CAVA1], [A, CAVA1], [A, su]);
  } else {
    const arco = (b0, b1) => {
      const r = (b1 - b0) / 2, c = b0 + r, x = A - s * r;
      // mezzo tondo: il colmo tocca il filo, come il bastone tondo vero
      for (let k = 0; k <= 14; k++) {
        const t = -Math.PI / 2 + Math.PI * k / 14;
        q.push([x + s * r * Math.cos(t), c + r * Math.sin(t)]);
      }
    };
    arco(giu, CAVA0);
    q.push([thr, CAVA0], [thr, CAVA1]);
    arco(CAVA1, su);
  }
  return q;
}

/* Rifa' il filo di una sezione: si butta via il tratto oltre il fondo
   cava e ci si mette il labbro nuovo. Il tratto da buttare e' UNO SOLO
   e contiguo lungo il contorno, percio' basta ruotare l'elenco dei punti
   perche' non resti spezzato a cavallo della fine. */
function rifaiFilo(punti, tipo, A, s) {
  if (tipo === 1) return punti;
  const thr = A - s * RIENTRO;
  /* Il mezzo millimetro di tolleranza non e' pigrizia. Il fondo della
     cava sta ESATTAMENTE sul filo del taglio, e con un confronto secco
     quei punti finivano fuori: il tratto da sostituire si spezzava in
     due -- labbro di sotto e labbro di sopra -- e il labbro nuovo ci
     veniva infilato due volte, lasciando la parte alta del montante
     senza niente. */
  const dentro = (p) => s * (p[0] - thr) > -0.5;
  const base = punti.findIndex((p) => !dentro(p));
  if (base < 0) return punti;
  const giro = punti.slice(base).concat(punti.slice(0, base));
  const fuori = [];
  for (let i = 0; i < giro.length; ) {
    if (!dentro(giro[i])) { fuori.push(giro[i]); i++; continue; }
    const bIn = fuori[fuori.length - 1][1];
    while (i < giro.length && dentro(giro[i])) i++;
    const bOut = (i < giro.length ? giro[i] : giro[0])[1];
    const q = labbro(tipo, thr, s, Math.min(bIn, bOut), Math.max(bIn, bOut));
    fuori.push(...(bIn > bOut ? q.reverse() : q));
  }
  return fuori;
}

/* Quale filo di un pezzo guarda un riquadro: quello che gli sta davanti
   esattamente di un rientro. Il montante ne ha uno, il traverso di
   mezzo due, quelli di cima e di fondo uno per parte. */
const guarda = (a, bordi) => bordi.some((v) => Math.abs(a - v) < .5);

/* il pannello piatto dei tipi 2 e 3: una tavola dello spessore della
   cava, che nel vano ci sta dentro tutta */
function pannelloPiatto(r, gioco) {
  const g = new THREE.BoxGeometry(r.x1 - r.x0 - 2 * gioco,
                                  r.y1 - r.y0 - 2 * gioco, SPCAVA);
  g.translate((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2, ZC);
  return g;
}

function montaAnta() {
  for (const g of [gAnta, gPann]) {
    for (const m of g.children) m.geometry.dispose();
    g.clear();
  }
  const rx = d.riquadri.map((r) => r.x0);
  const ry0 = d.riquadri.map((r) => r.y0), ry1 = d.riquadri.map((r) => r.y1);

  // i montanti: tutta l'altezza dell'anta, come in bottega
  const mo = rifaiFilo(d.montante.punti, tipo, d.montante.larghezza, 1);
  metti(gAnta, verticale(mo, 0, H), false);
  metti(gAnta, verticale(ribalta(mo, L), 0, H), false);

  // i traversi: da fondo cava a fondo cava, cosi' il loro tenone riempie
  // la cava del montante e sull'angolo non resta uno spiraglio
  /* I traversi entrano nella cava del montante -- ci va il loro tenone,
     ed e' quello che chiude il giunto. Ma cosi' le loro facce davanti e
     dietro cadono sullo STESSO PIANO di quelle del montante, e due piani
     coincidenti si contendono il pixel: erano le righe tratteggiate
     lungo i giunti, quelle che sfarfallavano girando.
     Si assottigliano di due decimi in tutto. Non si vede -- e' un
     quinto di millimetro su quarantacinque -- e i due piani non
     coincidono piu'. Fermarli invece al filo del montante, provato,
     lascia in vista la testa modanata del traverso: peggio del difetto.
  */
  const magro = (p) => p.map(([y, z]) => [y, T / 2 + (z - T / 2) * .9956]);
  for (const t of d.traversi) {
    let p = t.punti;
    if (guarda(t.y1 - RIENTRO, ry0)) p = rifaiFilo(p, tipo, t.y1, 1);
    if (guarda(t.y0 + RIENTRO, ry1)) p = rifaiFilo(p, tipo, t.y0, -1);
    metti(gAnta, orizzontale(magro(p), d.riquadri[0].x0, d.riquadri[0].x1), true);
  }

  for (const r of d.riquadri) {
    metti(gPann, tipo === 1
      /* MEZZO MILLIMETRO DI GIOCO PER FACCIA nello spessore, ed e' la
         cosa che ha risolto le righe tratteggiate.
         La linguetta usciva spessa quanto la cava al centesimo, quindi
         la sua faccia e quella del labbro erano lo stesso piano lungo
         tutto il giro del riquadro: due superfici complanari si
         contendono il pixel e girando la scena l'assegnazione cambia --
         il tratteggio che sfarfallava. Con due decimi non bastava: a
         quella distanza, di sbieco, la fessura sta sotto il pixel.
         Con mezzo millimetro si separano, ed e' anche la misura vera --
         un pannello in una cava da 6 e' spesso 5, se no col tempo la
         spinge e spacca il riquadro. */
      /* I campioni della bugna si diradano un po': il DXF ne da' uno
         ogni nove decimi di millimetro e non servono a niente, la bugna
         sale con dolcezza. Provato anche a diradarli molto di piu' --
         quattro millimetri -- pensando che le fasce sotto il pixel
         fossero la causa del tratteggio che resta lungo il giro del
         riquadro: non cambia niente, quindi non e' quello, e non vale
         la pena di rovinare la curva. */
      ? pannello(r, dirada(d.pannello.bugna.map(([u, v]) => [u, Math.max(.1, v - .5)]),
                           1.5, 12), ZC, d.pannello.gioco)
      : pannelloPiatto(r, d.pannello.gioco), false);
  }
  ombreggia();
}
/* ── il telaio, in due pezzi: imbotto e coprifili ───────────────────── */
/* Nella tavola il telaio e' un profilo unico -- la fabbrica lo vende
   montato -- ma dentro quella U ci sono due cose diverse: l'IMBOTTO che
   fascia il muro, e i due COPRIFILI che coprono la giunzione col muro,
   uno per faccia. L'imbotto non si tocca mai; il coprifilo lo sceglie il
   cliente, e sono tredici.

   Una conferma che vale la pena avere scritta: le ali del telaio
   disegnato misurano 69,00 x 22,00, e il nostro listellare-l70 misura
   69,00 x 22,00. E' lo stesso profilo al centesimo -- il liscio
   listellare compreso nel prezzo. Quindi montando il listellare si deve
   riottenere esattamente la U della tavola, ed e' il modo di sapere che
   il montaggio e' giusto. */
const bordi = (curve, i) => curve.flatMap((c) => c.map((p) => p[i]));
/* Fin dove salgono gli stipiti: fino in cima all'IMBOTTO della traversa,
   non fino in cima al telaio intero. Sono due quote diverse da quando il
   coprifilo si e' staccato -- l'imbotto finisce a 2127, il telaio con la
   sua ala a 2196 -- e salendo fino a 2196 lo stipite spuntava di
   sessantanove millimetri sopra la traversa, proprio nell'angolo dove il
   coprifilo va in mitra. Erano i due blocchetti che si vedevano in alto.
   Il buco che prima si tappava tirando su gli stipiti adesso non c'e'
   piu': lo copre il coprifilo, che gira l'angolo tutto intero. */
const telaioAltoY = Math.max(...bordi(d.telaio_alto_imbotto, 0));
const spor = -Math.min(...bordi(d.telaio, 0));      // quanto sporge dal filo anta

/* IL BORDO DEL VANO, UNO SOLO PER TUTTI E TRE.
   Qui si incontrano tre cose: l'imbotto che finisce, il muro che
   comincia, e il coprifilo che ci va davanti a coprire il giunto -- che
   e' esattamente il suo mestiere, e da li' prende il nome.
   Se ognuno prende la sua quota da una fonte diversa bastano decimi di
   millimetro perche' fra due di loro si apra un filo, e un filo di muro
   in mezzo al legno si vede benissimo. Percio' la quota si calcola QUI,
   una volta, dall'imbotto -- che e' il pezzo vero, misurato -- e la
   usano tutti e tre. Cosi' non c'e' niente da allineare: combaciano
   perche' sono lo stesso numero. */
const filiX = bordi(d.telaio_imbotto, 0);
const VANO = {
  sx: Math.min(...filiX),
  dx: Math.max(...filiX),
  su: Math.max(...bordi(d.telaio_alto_imbotto, 0)),
};

/* Gli stipiti arrivano FIN SOPRA, non si fermano sotto la traversa.
   Fermandoli dove la traversa comincia restava un intaglio nei due
   angoli alti. Tirandoli fino in cima si sovrappongono, e la traversa
   passa sopra: e' anche il giunto vero. */
for (const c of d.telaio_imbotto) metti(gTelaio, verticale(c, 0, telaioAltoY), false);
for (const c of d.telaio_alto_imbotto) {
  metti(gTelaio, orizzontale(c, -spor, L + spor), true);
}

/* Il coprifilo come cornice INGLETATA su tre lati.
   Non si estrudono tre pezzi e poi si accostano: un profilo sagomato
   accostato di testa si vede subito che e' sbagliato, e un coprifilo si
   ingleta sempre. Si fa invece come la bugna del pannello -- e' proprio
   la stessa idea: per ogni punto della sezione si disegna il percorso
   RIENTRATO di quel tanto, e fra un punto e il successivo si tende la
   superficie. Rientrando un percorso ad angolo retto gli angoli si
   tagliano a 45 da soli, e la mitra viene senza che nessuno la chieda. */
function cornice(sez, xL, xR, yT, zMuro, verso) {
  const pos = [];
  const via = (u) => [[xL - u, 0], [xL - u, yT + u], [xR + u, yT + u], [xR + u, 0]];
  const tri = (a, b, c) => pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  for (let i = 0; i < sez.length; i++) {
    const [u0, v0] = sez[i], [u1, v1] = sez[(i + 1) % sez.length];
    const A = via(u0), B = via(u1);
    const z0 = zMuro + verso * v0, z1 = zMuro + verso * v1;
    for (let j = 0; j + 1 < A.length; j++) {
      const a = [A[j][0], A[j][1], z0], b = [A[j + 1][0], A[j + 1][1], z0];
      const c = [B[j + 1][0], B[j + 1][1], z1], e = [B[j][0], B[j][1], z1];
      if (verso > 0) { tri(a, b, c); tri(a, c, e); }
      else { tri(a, c, b); tri(a, e, c); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();          // non indicizzata: gli spigoli restano vivi
  return g;
}



async function montaCoprifili() {
  for (const m of gCopri.children) m.geometry.dispose();
  gCopri.clear();
  const mis = PROFILI[copri];
  if (!mis) return;
  /* La misura di listino conta: un Tintoretto 90/70 sono due profili
     diversi, il 90 sullo stipite e il 70 dall'altra parte. Se non e'
     stata scelta si prende quella a pacchetto, la prima. */
  const slug = [].concat(mis[misuraCopri] || mis[Object.keys(mis)[0]]);
  // il 90 va sulla faccia della porta, il 70 dall'altra: e' come si
  // monta un pacchetto 90/70 di listino
  const sez = await Promise.all(slug.map(sezioneCoprifilo));
  // il bordo del vano e' quello di tutti: vedi VANO, piu' su
  const { sx, dx, su } = VANO;
  /* Il coprifilo appoggia sulla FACCIA DEL MURO, non sul filo interno
     dell'ala. Sono due piani diversi, distanti quanto il piede: il piede
     entra nel vano e scavalca l'imbotto, il dorso resta fuori sul muro.
     Prendendo il filo dell'ala il coprifilo entrava tutto di un piede.
     Il muro e' quello del tratteggio, 118 -- che torna proprio adesso:
     con le facce a 30 e -88, e il piede del listellare lungo 12, l'ala
     disegnata viene da 18 a 40, che e' esattamente quello che misura. */
  const facce = [{ z: d.muro.z1, verso: 1 }, { z: d.muro.z0, verso: -1 }];
  facce.forEach((f, i) => {
    metti(gCopri, cornice(sez[Math.min(i, sez.length - 1)], sx, dx, su,
                          f.z, f.verso), false);
  });
}
const acciaio = new THREE.MeshStandardMaterial({
  color: 0xc3bdb4, roughness: .3, metalness: .85, envMapIntensity: 1.1,
});
const M = d.maniglia;

/* ── DESTRA O SINISTRA ──────────────────────────────────────────────── */
/* La tavola disegna una porta sola: maniglia a 59 mm dal filo sinistro,
   quindi serratura a sinistra e cerniere a destra. L'altra mano e' la
   stessa porta specchiata, e in bottega e' proprio cosi': stessi pezzi,
   montati dall'altra parte.
   Percio' non c'e' una seconda geometria -- c'e' UNA funzione che
   ribalta la x attorno alla mezzeria dell'anta, e la usano la maniglia,
   lo scrocco, le cerniere e il perno. Quello che NON si specchia e' il
   verso in cui la porta si apre: quello lo decide la battuta del
   telaio, non la mano.
     mano = +1   serratura a sinistra, cerniere a destra (com'e' disegnata)
     mano = -1   l'opposto */
const mx = (x) => (mano > 0 ? x : L - x);

function montaFerro() {
  for (const g of [gFerro, gCerniere]) {
    for (const o of g.children) o.traverse((m) => m.geometry && m.geometry.dispose());
    g.clear();
  }
  levaGiro = [];
  scrocco = null;

  if (M) {
    const SPOR = 11, GROS = 17;   // quanto sporge la rosetta, e la leva
    for (const faccia of [1, -1]) {
      const z = faccia > 0 ? T : 0;
      const ros = new THREE.Mesh(
        new THREE.CylinderGeometry(M.r, M.r, SPOR, 48), acciaio);
      ros.rotation.x = Math.PI / 2;
      ros.position.set(mx(M.cx), M.cy, z + faccia * SPOR / 2);
      gFerro.add(ros);

      const s = new THREE.Shape();
      M.leva.forEach(([x, y], i) => {
        const a = mx(x) - mx(M.cx), b = y - M.cy;
        return i ? s.lineTo(a, b) : s.moveTo(a, b);
      });
      s.closePath();
      const g = new THREE.ExtrudeGeometry(s, {
        depth: GROS, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1.6,
        bevelOffset: 0, bevelSegments: 2, curveSegments: 2,
      });
      /* La leva di dietro esce dall'altra parte, e basta: si sposta il
         solido, non si gira il gruppo. Girandolo di mezzo giro -- come
         si faceva -- si ribalta anche in orizzontale, e la leva puntava
         verso il filo della serratura invece che verso il mezzo della
         porta: sembrava infilata dentro il telaio. */
      if (faccia < 0) g.translate(0, 0, -GROS);
      const fuori = new THREE.Group();
      fuori.position.set(mx(M.cx), M.cy, z + faccia * SPOR);
      const dentro = new THREE.Group();
      dentro.add(new THREE.Mesh(g, acciaio));
      fuori.add(dentro);
      gFerro.add(fuori);
      levaGiro.push(dentro);
    }

    /* Lo scrocco. Non e' nella tavola, ma senza di lui la maniglia si
       abbassa senza che succeda niente, e quello che si vuole far vedere
       e' proprio che si abbassa PER far succedere qualcosa. */
    scrocco = new THREE.Mesh(new THREE.BoxGeometry(24, 24, 15), acciaio);
    scrocco.position.set(mx(-5), M.cy, T / 2);
    gFerro.add(scrocco);
  }

  /* Le cerniere, sull'asse su cui gira. Stanno ferme rispetto al telaio
     o all'anta -- sono tonde, non si vede la differenza. */
  for (const y of [180, H / 2, H - 180]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 95, 24), acciaio);
    c.position.set(mx(L), y, PERNO_Z);
    gCerniere.add(c);
  }

  // il perno si sposta col cardine, e l'anta ci si riappende
  perno.position.set(mx(L), 0, PERNO_Z);
  foglia.position.set(-mx(L), 0, -PERNO_Z);
  ombreggia();
}

  montaAnta();
  montaFerro();
  const pronta = montaCoprifili();

  /* ── i comandi ────────────────────────────────────────────────────── */
  const parti = { telaio: gTelaio, anta: gAnta, pannelli: gPann, ferro: gFerro };

  return {
    gruppo, parti, perno, foglia, pronta,
    // ingombro totale, telaio compreso: serve a chi inquadra
    misure: { L, H, T, largoTot: L + 2 * spor, altoTot: telaioAltoY },
    // le tre quote che descrivono la cava: dove sta, quanto e' larga, e
    // quanto rientra il bastone. Servono a chi scrive le note.
    cava: { z: ZC, larga: SPCAVA, rientro: RIENTRO },
    get mano() { return mano; },

    /** 0 chiusa, 1 spalancata. Muove anta, maniglia e scrocco insieme. */
    apertura(u) {
      perno.rotation.y = mano * dolce(u) * APERTURA;
      /* L'ordine e' quello della mano: prima si abbassa la maniglia, lo
         scrocco rientra, POI l'anta parte. La maniglia torna su appena
         l'anta si e' mossa: si preme per aprire, non per stare aperti. */
      const premi = u > 0 ? fascia(u, 0, .06) * (1 - fascia(u, .10, .22)) : 0;
      // specchiata, la leva per abbassarsi gira dall'altra parte
      for (const l of levaGiro) l.rotation.z = -mano * premi * .62;
      if (scrocco) {
        scrocco.position.x = mx(-5 + 13 * premi);
        /* A porta chiusa lo scrocco sta DENTRO L'INCONTRO, incassato
           nello stipite, e da fuori non lo vede nessuno. L'incontro non
           lo disegniamo: senza, la punta resterebbe per aria. */
        scrocco.visible = u > .03;
      }
    },


    /** Il muro attorno al vano. Il configuratore non lo chiama: la
        stanza ce l'ha gia' sua. */
    muro() {
      if (!d.muro) return null;
      const gMuro = new THREE.Group();
  /* Il muro. Senza, fra anta e telaio si vede il fondo della pagina
     attraverso la fessura, e una porta che lascia passare la luce tutto
     intorno non e' una porta. Spessore e filo del vano vengono dal
     tratteggio della SEZ-B, l'altezza del vano dalla traversa. */

    const m = d.muro, matMuro = new THREE.MeshStandardMaterial({
      color: 0xe6ded1, roughness: .95, metalness: 0,
    });
    /* L'architrave comincia ESATTAMENTE dove finisce il telaio, senza
       sovrapposizione. Prima gliene davo un centimetro per non lasciare
       una fessura, ma in quel centimetro muro e imbotto hanno la faccia
       sullo stesso piano -- tutti e due a z 30 -- e due superfici
       complanari se le contendono a chiazze: sopra la porta usciva una
       striscia chiara larga un paio di centimetri, che sembrava un buco e
       non lo era. Fessura non ne resta: quel giunto lo copre il coprifilo,
       che gli sta davanti. */
    const alto = VANO.su;
    /* Il muro e' quello del tratteggio: 118. Per un momento era sembrato
       troppo -- sporgeva dodici millimetri oltre l'ala del telaio e se la
       mangiava -- ma quei dodici sono il PIEDE del coprifilo, che entra
       nel vano: il dorso appoggia sul muro e il piede scavalca l'imbotto.
       Le facce a 30 e -88 sono giuste, ed e' l'ala a partire piu' dentro. */
    // e il muro si tira indietro di tre decimi: il dorso del coprifilo ci
    // appoggia sopra, e appoggiare vuol dire complanare
    const mz0 = d.muro.z0 + .3, mz1 = d.muro.z1 - .3;
    const mattone = (x0, x1, y0, y1) => {
      const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, mz1 - mz0);
      g.translate((x0 + x1) / 2, (y0 + y1) / 2, (mz0 + mz1) / 2);
      gMuro.add(new THREE.Mesh(g, matMuro));
    };
    /* E il vano del muro e' quello di tutti gli altri: VANO, calcolato una
       volta sola piu' su. Il tratteggio del disegno non va bene -- si
       ferma tredici millimetri prima, e' una sezione, mica un rilievo --
       e nemmeno il filo verso la luce, che preso al contrario manda il
       muro davanti all'anta. */
    mattone(VANO.sx - 900, VANO.sx, 0, alto + 700);
    mattone(VANO.dx, VANO.dx + 900, 0, alto + 700);
    mattone(VANO.sx, VANO.dx, alto, alto + 700);
      ombreggiaGruppo(gMuro);
      return gMuro;
    },

    async coprifilo(id, misura) { copri = id; misuraCopri = misura; await montaCoprifili(); },
    finitura(n) { tipo = n; montaAnta(); },
    verso(m) { mano = m; montaFerro(); },

    dispose() {
      gruppo.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
    },
  };
}

/* Il legno di serie, per chi non ne passa uno suo. */
function legnoDiSerie() {
  const tx = new THREE.TextureLoader();
  const carica = (nome, srgb) => {
    const t = tx.load(`assets/textures/rovere/${nome}`);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };
  return new THREE.MeshStandardMaterial({
    map: carica('albedo.jpg', true),
    normalMap: carica('normal.jpg'),
    roughnessMap: carica('roughness.jpg'),
    normalScale: new THREE.Vector2(.8, .8),
    roughness: .62, metalness: 0, envMapIntensity: .5,
  });
}

function ombreggiaGruppo(g) {
  g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
}

const dolce = (u) => u * u * (3 - 2 * u);
const fascia = (u, a, b) => Math.min(1, Math.max(0, (u - a) / (b - a)));
const APERTURA = Math.PI * 0.44;        // circa 79 gradi
