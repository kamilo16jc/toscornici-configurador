import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mostraApertura } from './aperture.js';
import { stampaPreventivo, documentoPreventivo } from './preventivo.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
/* Il motore delle porte. Copia meccanica di puertas3d: non si edita qui, si
   corregge la' e si rifa' `node tools/sync-motor.mjs`. Vedi js/motor/LEEME.txt */
import { tejerHoja } from './motor/viewer/tejer.js';
import { deserializar, cajaDe } from './motor/modelo/proyecto.js';
import { montar, vanoDe } from './motor/geom/telaio.js';
import { montarCoprifilo } from './motor/geom/coprifilo.js';
import { construirAmbiente } from './motor/geom/ambiente.js';
import { veta, pegarVeta } from './motor/geom/materiales.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { MODELLI } from './catalogo.js';
import { TIPO_DEFAULT, applicaTipo, haVetro, haCampoDiLegno, BUGNA_DI_PARTENZA, scegliBugna } from './tipi.js';
import { conSopraluce, traversoDe, vanoSopraluce, piezaVidrio,
         SOPRALUCE_DEFAULT, SOPRALUCE_MIN, SOPRALUCE_MAX } from './sopraluce.js';
import { incideFiori } from './vetro-decoro.js';

/* Satinato. Un sopraluce sta sopra la testa: fa passare la luce senza dare
   a vedere cosa c'e' dietro, ed e' come si montano. Trasparente e' false. */
const SOPRALUCE_SATINATO = true;

/* I fiori incisi sul vetro. E' una prova per vedere come sta decorato: si
   spegne mettendolo a false e il vetro torna liscio. */
const SOPRALUCE_DECORO = true;

/* ============================================================
   CATALOGO — modelli, essenze e listino 2026
   Colonne listino: sbiancato → Rovere, pino → Pino,
   toulipier → Toulipier.
   ============================================================ */

// Ogni essenza ha il SUO PBR fotografico da 600 mm: rovere, castagno,
// toulipier e pino, gli stessi dello scaparate. Il colore qui sotto non tinge
// piu' il legno —lo fa la texture col suo tinte calibrato— ma resta perche' e'
// il colore di listino e serve ai laccati e alle etichette.
const ESSENZE = {
  /* ae9365 e' il tono con cui il rovere e' stato disegnato al banco. Era
     a86948, molto piu' rosso: con la venatura addosso sembrava legno tinto.
     Colore e venatura sono la stessa decisione — la venatura moltiplica il
     colore — quindi migrarne una sola fa vedere un legno che non esiste. */
  rovere:    { label: 'Rovere',    en: 'Oak',       tonoChiaro: false, color: 0xae9365 },
  /* b16339 e' il tono con cui il castagno e' stato disegnato al banco. Era
     a2805a. La sua venatura e' quella del rovere con la stessa mano —stesse
     200 fibre, stesso seme— e cambia proprio il tinte: il castagno tira al
     marrone rossiccio, il rovere resta bruno giallastro. Migrare il colore
     senza la venatura, o viceversa, fa vedere un legno che non esiste. */
  castagno:  { label: 'Castagno',  en: 'Chestnut',  tonoChiaro: false, color: 0xb16339 },
  /* 9f8456 e' il tono con cui il toulipier e' stato disegnato al banco, e va
     col suo. Il colore e la venatura sono la stessa decisione: la venatura
     moltiplica il colore, quindi separarli vuol dire vedere un legno che non
     esiste in nessuna delle due parti. */
  toulipier: { label: 'Toulipier', en: 'Tulipwood', tonoChiaro: true,  color: 0x9f8456 },
  /* Il pino era e8a05c, un arancione molto carico: con la venatura addosso
     sembrava legno tinto, non pino. c8a271 e' il tono con cui lo scaparate lo
     rende —e quello che gli e' piaciuto— ed e' anche piu' vicino al pino vero,
     che e' giallo pallido e non arancione. */
  pino:      { label: 'Pino',      en: 'Pine',      tonoChiaro: true,  color: 0xc8a271 },
};

/* Quale venatura porta ogni essenza. Una tabella e non una catena di if: la
   prossima si aggiunge con una riga, e si vede a colpo d'occhio quali ne hanno
   e quali no. Le ricette vivono nel motore, geom/materiales.js -> PRESETS_VETA,
   disegnate al banco.
   Adesso le hanno tutte e quattro. */
const VENATURE = {
  rovere: 'roverePBR',
  castagno: 'castagnoPBR',
  pino: 'pinoPBR',
  toulipier: 'toulipierPBR',
};

// laccati: vernice coprente + tinta RAL. Non prendono venatura.
// Prezzi: colonna Toulipier verniciata, la base tipica dei laccati.
// Il Bianco Tosco è l'unico laccato compreso nel prezzo; ogni altro
// colore RAL paga l'aumento del listino (voce n. 50): € 180.
const RAL_EXTRA = 180;
const LACCATI = {
  bianco:  { label: 'Bianco Tosco',   color: 0xf2efe6, extra: 0 },
  avorio:  { label: 'Avorio',         color: 0xe7d9b8, extra: RAL_EXTRA },
  tortora: { label: 'Grigio Tortora', color: 0xb3a894, extra: RAL_EXTRA },
  salvia:  { label: 'Verde Salvia',   color: 0x8b9c85, extra: RAL_EXTRA },
  notte:   { label: 'Blu Notte',      color: 0x39465a, extra: RAL_EXTRA },
};

// Il colore laccato è un ACABADO sopra l'essenza scelta, non un'essenza:
// qualsiasi legno può essere laccato (es. Rovere + Blu Notte). Il prezzo è
// la colonna verniciata dell'essenza + l'aumento RAL (Bianco Tosco compreso).
const isLaccato = () => state.colore !== 'nessuno';
const laccatoExtra = () => (isLaccato() ? LACCATI[state.colore].extra : 0);

function essenzaLabel() {
  const legno = ESSENZE[state.essenza].label;
  return isLaccato() ? `${legno} · Laccato ${LACCATI[state.colore].label}` : legno;
}

const FINITURA_LABEL = { grezza: 'grezza', verniciata: 'verniciata' };

/* Come si scrive il tipo sul preventivo. Con la modanatura accanto, perche'
   chi lo legge in fabbrica deve sapere che ferro montare. */
/* Il numero nomina la MODANATURA e basta. Prima diceva anche il campo
   —"bugna" nel 2, "pannello liscio" nel 3— e adesso il campo lo sceglie il
   cliente: sul preventivo sarebbe uscito "Tipo 3 — pannello liscio · con
   bugna", che si contraddice da solo. Il campo si scrive accanto, dove si
   decide. */
const TIPO_LABEL = {
  1: 'Tipo 1 — doppio gradino',
  2: 'Tipo 2 — mezza canna',
  3: 'Tipo 3 — spigolo vivo',
};

const state = {
  modello: 'siena',
  essenza: 'rovere',
  colore: 'nessuno',   // 'nessuno' = legno a vista; altrimenti chiave di LACCATI
  tipo: TIPO_DEFAULT,  // 1, 2 o 3 — la finitura del campo. Vedi js/tipi.js
  /* Il campo: rialzato o liscio. Lo sceglie il cliente sul 2 e sul 3; sul
     TIPO 1 non si chiede nemmeno, perche' la bugna ce l'ha sempre. */
  bugna: BUGNA_DI_PARTENZA[TIPO_DEFAULT],
  /* GREZZA di partenza. La fabbrica vende la porta grezza e la verniciatura
     e' un di piu': mostrare per primo il prezzo verniciato faceva sembrare
     piu' cara ogni porta del catalogo. Chi la vuole finita lo dice. */
  finitura: 'grezza',
  ambiente: 'galleria',
  maniglia: 'ottone',
  // — misure e extra (listino 2025, pagg. 48–65) —
  w: 900, h: 2100, ante: 1,
  muro: 108, allargato: 'integrale',
  telaio: 'std',
  copriWood: 'toulipier', copri: 'listellare', copriMisura: null, manFinitura: null,
  apertura: 'battente', forma: 'diritta', sopraluce: 'no', mano: 'dx',
  sopraluceH: SOPRALUCE_DEFAULT,   // altezza del vano sopra la porta, in mm
  capitello: 'no', capLati: 1, capCompl: { fin: false, dia: false, zoc: false },
  serratura: 'std', cerniere: 'anuba', manigliaMod: 'no',
  cilindro: 'no', nottolino: false, oroSerr: false, oroCern: false,
  telaioForma: false, acc: { riscontro: false, paraspiffero: false, imballo: false },
};

/* ============================================================
   LISTINO EXTRA — tabelle generali (riferimento misura base
   luce 900×2100×108). Valgono per tutti i modelli; verificate
   sul 400-C Liverpool.
   ============================================================ */

// Fuori misura (voci 16/17): scaglioni, NON proporzionale.
// Oltre 1200×2600 il listino non dà prezzo → su preventivo.
function sizeBand(w, h) {
  const out = { ok: true, factor: 1, note: [] };
  if (w > 1200 || h > 2600) { out.ok = false; return out; }
  if (w > 900)  { out.factor *= 1.20; out.note.push('fuori misura larghezza +20%'); }
  if (h > 2100) { out.factor *= 1.40; out.note.push('fuori misura altezza +40%'); }
  return out;
}

// Coprifili: l'EXTRA A PORTA copre la misura standard = 11,50 ml;
// oltre, proporzionale ai metri lineari. Mai sconto sotto lo standard.
const STD_PERIM = 2 * 2100 + 900; // 5100 mm per lato
const mlFactor = (w, h) => (!w || !h ? 1 : Math.max(1, (2 * h + w) / STD_PERIM));

const TELAI = [
  { id: 'std',           label: 'Standard (compreso)',                    extra: 0 },
  { id: 'alpha',         label: 'ALPHA — piatti 70/90',                   extra: 30 },
  { id: 'alpha_comp',    label: 'ALPHA COMPLANARE',                       extra: 50 },
  { id: 'alpha_comp_sp', label: 'ALPHA COMPLANARE SPINGERE',              extra: 200 },
  { id: 'design',        label: 'DESIGN',                                 extra: 80 },
  { id: 'design_comp',   label: 'DESIGN COMPLANARE',                      extra: 90 },
  { id: 'passaggio90',   label: 'Passaggio listellare, coprifili 90',     extra: 250 },
  { id: 'r10',           label: 'R10 (coprifili esclusi)',                extra: 40 },
  { id: 'r10b',          label: 'R10 BAROCCO (coprifili esclusi)',        extra: 60 },
  { id: 'moderno',       label: 'MODERNO (coprifili esclusi)',            extra: 90 },
  { id: 'madonna',       label: 'A MADONNA sagomato 44×79',               extra: 70 },
  { id: 'madonna_mod',   label: 'A MADONNA MODERNO 44×79',                extra: 80 },
];
const FERMAPORTA = 20; // obbligatorio con complanare a spingere (voce 74)

// Allargato per muri oltre 108 mm (pag. 49)
function allargatoExtra(muro, sistema) {
  if (muro <= 108) return { extra: 0, label: 'muro ≤ 108 mm (standard)' };
  if (sistema === 'imbottino') {
    if (muro <= 158) return { extra: 110, label: 'con imbottino 108→158' };
    if (muro <= 220) return { extra: 180, label: 'con imbottino 158→220' };
    if (muro <= 300) return { extra: 310, label: 'con imbottino 220→300' };
    const cm = Math.ceil((muro - 300) / 10);
    return { extra: 310 + cm * 20, label: `con imbottino >300 (+${cm} cm × €20)` };
  }
  if (muro <= 118) return { extra: 34,  label: 'integrale 108→118' };
  if (muro <= 158) return { extra: 150, label: 'integrale 118→158' };
  if (muro <= 220) return { extra: 250, label: 'integrale 158→220' };
  if (muro <= 300) return { extra: 380, label: 'integrale 220→300' };
  const cm = Math.ceil((muro - 300) / 10);
  return { extra: 380 + cm * 25, label: `integrale >300 (+${cm} cm × €25)` };
}

// Coprifili con aletta (pagg. 52–53) — EXTRA A PORTA (cad), già la
// differenza rispetto al liscio listellare compreso (1 lato 90 + 1 lato 70).
// Il coprifilo esiste SOLO in frassino / toulipier / pino.
/* Le miniature sono la SEZIONE, disegnata dallo stesso json che il motore
   estrude — tools/genera-sezioni-coprifili.py — e non piu' la fotografia di
   listino. Una foto racconta il materiale ma non sa niente della geometria
   che si monta: il Tintoretto e il Raffaello sono rimasti col profilo da 90
   incrociato e la fotina accanto continuava a mostrare il pezzo giusto.
   Cosi' invece, se un profilo sbaglia, la miniatura sbaglia con lui.
   Sono tutte in scala fra loro. Il Novecento non ha sezione tracciata e
   tiene la sua fotografia. */
const COPRI = [
  { id: 'listellare',   label: 'Liscio listellare — compreso',      prezzi: { frassino: 0,     toulipier: 0,   pino: 0 }, img: 'assets/coprifili/sezioni/listellare.png' },
  { id: 'massello',     label: 'Liscio massello',                    prezzi: { frassino: 43.5,  toulipier: 16,  pino: 3.5 }, img: 'assets/coprifili/sezioni/massello.png' },
  { id: 'pierre',       label: 'Pierre S1 (70/70)',                  prezzi: { frassino: 45,    toulipier: 30,  pino: 30 }, img: 'assets/coprifili/sezioni/pierre.png' },
  { id: 'tintoretto',   label: 'Tintoretto (90/70)',                 prezzi: { frassino: 75,    toulipier: 60,  pino: 60 }, img: 'assets/coprifili/sezioni/tintoretto.png' },
  { id: 'raffaello',    label: 'Raffaello-S (90/70)',                prezzi: { frassino: 75,    toulipier: 60,  pino: 60 }, img: 'assets/coprifili/sezioni/raffaello.png' },
  { id: 'giotto',       label: 'Giotto S2 (90/70)',                  prezzi: { frassino: 65,    toulipier: 50,  pino: 50 }, img: 'assets/coprifili/sezioni/giotto.png' },
  { id: 'leonardo',     label: 'Leonardo CS1-S2 (90/70)',            prezzi: { frassino: 65,    toulipier: 50,  pino: 50 }, img: 'assets/coprifili/sezioni/leonardo.png' },
  { id: 'michelangelo', label: 'Michelangelo CS300 (90/70)',         prezzi: { frassino: 85,    toulipier: 70,  pino: 70 }, img: 'assets/coprifili/sezioni/michelangelo.png' },
  { id: 'cartesio',     label: 'Cartesio CS207 (100/70)',            prezzi: { frassino: 85,    toulipier: 70,  pino: 70 }, img: 'assets/coprifili/sezioni/cartesio.png' },
  { id: 'caravaggio',   label: 'Caravaggio CS206 (27×90)',           prezzi: { frassino: 125,   toulipier: 100, pino: 100 }, img: 'assets/coprifili/sezioni/caravaggio.png' },
  { id: 'tiziano',      label: 'Tiziano CS204 (30×90)',              prezzi: { frassino: 125,   toulipier: 100, pino: 100 }, img: 'assets/coprifili/sezioni/tiziano.png' },
  { id: 'canaletto',    label: 'Canaletto CS3 (34×90)',              prezzi: { frassino: 125,   toulipier: 100, pino: 100 }, img: 'assets/coprifili/sezioni/canaletto.png' },
  /* NOVECENTO CAP1, fuori catalogo per ora. Non si cancella: manca solo
     l'informazione per venderlo come si deve, e quando arrivera' bastera'
     rimettere questa riga dov'era. Il resto e' rimasto al suo posto —le
     misure in COPRI_MISURE, la casella del preventivo in COPRI_BLOCCO e la
     sua fotografia— perche' nessuna di quelle cose si vede se il modello non
     e' in questa lista, e cancellarle vorrebbe dire ritrovarle una per una.
  { id: 'novecento',    label: 'Novecento CAP1 (42×110)',            prezzi: { frassino: 290,   toulipier: 250, pino: 250 }, img: 'assets/coprifili/novecento.png' },
  */
];
const COPRI_WOOD_LABEL = { frassino: 'Frassino', toulipier: 'Toulipier', pino: 'Pino' };

// Misure di ogni profilo (listino pagg. 52–53). Ogni modello sagomato esiste
// in altezza 69/70 e — quasi sempre — anche in 90; l'EXTRA PORTA di listino
// copre UNA sola combinazione (quella marcata pack:true).
//   pack:true  → prezzo cad di listino, quello già in COPRI.prezzi
//   ml         → prezzo al metro lineare, per le combinazioni non a listino
// Il coprifilo compreso nella porta è il liscio listellare 22×70 = € 80 cad:
// è il credito da scalare quando si calcola una combinazione a ml.
const COPRI_INCLUSO_CAD = 80;
const ml1 = (n) => n.toFixed(1).replace('.', ',');   // metri all'italiana
const ML = (f, t, p) => ({ frassino: f, toulipier: t, pino: p });
const COPRI_MISURE = {
  listellare: [
    { id: 'l70', label: '22×70', pack: true,  cad: ML(80, 80, 80) },
    { id: 'l90', label: '22×90', pack: false, cad: ML(116, 100, 100) },
  ],
  massello: [
    { id: 'm70', label: '22×70', pack: true,  cad: ML(106.5, 86, 81) },
    { id: 'm90', label: '22×90', pack: false, cad: ML(133, 110, 102.5) },
  ],
  pierre:     [{ id: 'p70', label: '70 / 70', code: 'S1_24,5×69', pack: true, ml: ML(12.2, 10.5, 10.5) }],
  tintoretto: [
    { id: 't9070', label: '90 / 70', code: 'B_27×69 + B_32×90', pack: true },
    { id: 't70',   label: '70 / 70', code: 'B_27×69',  ml: ML(12.2, 10.5, 10.5) },
    { id: 't90',   label: '90 / 90', code: 'B_32×90',  ml: ML(17.4, 14.8, 14.8) },
  ],
  raffaello: [
    { id: 'r9070', label: '90 / 70', code: 'BS_27×69 + CS400_32×90', pack: true },
    { id: 'r70',   label: '70 / 70', code: 'BS_27×69',      ml: ML(12.2, 10.5, 10.5) },
    { id: 'r90',   label: '90 / 90', code: 'CS400_32×90',   ml: ML(17.4, 14.8, 14.8) },
  ],
  giotto: [
    { id: 'g9070', label: '90 / 70', code: 'S2_30×69 + S2-90_32,5×90', pack: true },
    { id: 'g70',   label: '70 / 70', code: 'S2_30×69',      ml: ML(12.2, 10.5, 10.5) },
    { id: 'g90',   label: '90 / 90', code: 'S2-90_32,5×90', ml: ML(15.7, 13.9, 13.9) },
  ],
  leonardo: [
    { id: 'e9070', label: '90 / 70', code: 'CS1_32,5×90', pack: true },
    { id: 'e90',   label: '90 / 90', code: 'CS1_32,5×90', ml: ML(15.7, 13.9, 13.9) },
  ],
  michelangelo: [
    { id: 'h9070', label: '90 / 70', code: 'CS300-28_30×70 + CS205_40×90', pack: true },
    { id: 'h70',   label: '70 / 70', code: 'CS300-28_30×70', ml: ML(13.9, 11.3, 11.3) },
    { id: 'h90',   label: '90 / 90', code: 'CS205_40×90',    ml: ML(17.4, 14.8, 14.8) },
  ],
  // il "-90" del Cartesio è in realtà alto 100 mm: la combinazione di listino
  // è 100/70, e nel blocco ordini resta barrato il 70 (il 100 non ha casella).
  cartesio: [
    { id: 'c10070', label: '100 / 70', code: 'CS207_32×70 + CS2_34×100', pack: true },
    { id: 'c70',    label: '70 / 70',  code: 'CS207_32×70', ml: ML(13.9, 11.3, 11.3) },
    { id: 'c100',   label: '100 / 100', code: 'CS2_34×100', ml: ML(17.4, 14.8, 14.8) },
  ],
  // questi esistono in una sola altezza: nessuna scelta, solo il dato a ml
  caravaggio: [{ id: 'v90',  label: '27×90',  code: 'CS206_27×90', pack: true, ml: ML(19.2, 16.5, 16.5) }],
  tiziano:    [{ id: 'z90',  label: '30×90',  code: 'CS204_30×90', pack: true, ml: ML(19.2, 16.5, 16.5) }],
  canaletto:  [{ id: 'n90',  label: '34×90',  code: 'CS3_34×90',   pack: true, ml: ML(19.2, 16.5, 16.5) }],
  novecento:  [{ id: 'w110', label: '42×110', code: 'CAP1_42×110', pack: true, ml: ML(33, 29, 29),
                 minimo: 500 }],
};

// misure disponibili di un modello (chi non è a listino ha solo il pacchetto)
const misureDi = (id) => COPRI_MISURE[id] || [{ id: 'std', label: 'standard', pack: true }];

// misura scelta, o la prima del modello se non se n'è scelta nessuna
function misuraAttiva(cop) {
  const ms = misureDi(cop.id);
  return ms.find((m) => m.id === state.copriMisura) || ms[0];
}

// extra a porta di una misura, per legno e metri lineari effettivi
function extraMisura(cop, mis, wood, metri) {
  if (mis.cad) return Math.max(0, mis.cad[wood] - COPRI_INCLUSO_CAD);
  if (mis.pack) return cop.prezzi[wood];
  return Math.max(0, mis.ml[wood] * metri - COPRI_INCLUSO_CAD);
}

// Aperture speciali (pagg. 61–62)
/* Le aperture, con il NUMERO DI VOCE del listino 2025 davanti (pagg. 63-64).
   Il numero non e' decorazione: in fabbrica si ordina per voce, e chi legge il
   preventivo lo cerca sul listino cartaceo. I prezzi qui sotto sono stati
   verificati uno per uno contro quelle pagine.
   La 31 dice "con guide a filo senza mantovana", e l'inglese del listino la
   traduce "with invisible guides": le guide NON si vedono. La 32 e' quella
   "con battuta e kit mantovana". Sono due cose diverse e si vedono diverse. */
const APERTURE = [
  { id: 'battente',   label: 'Battente (standard)',                                 extra: 0 },
  { id: 'scomparsa',  label: '30 · Scorrevole a scomparsa nel muro',                extra: 85 },
  { id: 'est_muro',   label: '31 · Scorrevole esterno muro, guide a filo',          extra: 250 },
  { id: 'est_muro_m', label: '32 · Scorrevole esterno muro con battuta e mantovana', extra: 250 },
  { id: 'int_telaio', label: '33 · Scorrevole interno telaio',                      extra: 165 },
  { id: 'magic',      label: '34 · Kit MAGIC (luce muro ≤ 800)',                    extra: 550 },
  { id: 'justor',     label: '19 · A ventola JUSTOR',                               extra: 200 },
  { id: 'ergon',      label: '20 · Rototraslante ERGON',                            extra: 550 },
  { id: 'koblenz',    label: '21 · A libro KOBLENZ',                                extra: 600 },
];

// Porte ad arco e curve (pag. 62) — solo fino a 90×210
const FORME = [
  { id: 'diritta', label: 'Diritta (standard)',                    extra: 0 },
  { id: 'arco_ts', label: 'Ad arco tutto sesto',                   extra: 1000 },
  { id: 'arco_sr', label: 'Ad arco sesto ribassato',               extra: 1500 },
  { id: 'curva',   label: 'Curva in pianta (solo liscia)',         extra: 2500 },
  { id: 'diagonale', label: 'Diagonale (taglio obliquo)',          extra: 100 },
];

const SOPRALUCI = [
  { id: 'no',       label: 'Senza sopraluce',                      extra: 0 },
  { id: 'fisso',    label: 'Sopraluce fisso (fino a 50 cm)',       extra: 250 },
  { id: 'apribile', label: 'Sopraluce apribile (fino a 50 cm)',    extra: 500 },
  { id: 'wasistas', label: 'Sopraluce a wasistas (fino a 50 cm)',  extra: 650 },
];

// Serrature e cerniere (pag. 63)
const SERRATURE = [
  { id: 'std',       label: 'Meccanica standard (compresa)',            extra: 0 },
  { id: 'magnetica', label: 'Magnetica patent',                         extra: 20 },
  { id: 'yale',      label: 'Nucleo yale AGB (cilindro escluso)',       extra: 30 },
  { id: 'opera',     label: 'Yale AGB "OPERA" (cilindro escluso)',      extra: 200 },
  { id: 'cisa',      label: 'Sicurezza 3 punti CISA',                   extra: 330 },
];
// Voce 60: predisposizione per il nottolino, si somma alla serratura scelta.
const NOTTOLINO = 10;

// Cilindri (voci 65–67). Le serrature yale e OPERA sono "cilindro escluso":
// senza uno di questi il preventivo è incompleto, non solo più economico.
const CILINDRI = [
  { id: 'no',       label: 'Nessun cilindro',                       extra: 0 },
  { id: 'std',      label: 'Cilindro standard AGB 70 mm',           extra: 35 },
  { id: 'europeo',  label: 'Cilindro europeo AGB 70 mm',            extra: 80 },
  { id: 'opera',    label: 'Cilindro europeo AGB "OPERA" 70 mm',    extra: 100 },
];
const VUOLE_CILINDRO = new Set(['yale', 'opera']);

// Cerniere: l'Anuba compresa è quella base; la registrabile da 14 mm con
// cappucci è la voce 69, a pagamento.
const CERNIERE_EXTRA = { anuba: 0, anuba14: 40, scomparsa: 50 };

// Sovrapprezzi oro, in fondo a pag. 63: valgono solo su quei due pezzi.
const ORO_SERRATURA = 10;   // solo su serratura magnetica
const ORO_CERNIERA = 20;    // solo su cerniera a scomparsa

// Accessori a pezzo (voci 70, 71, 26)
const ACCESSORI = [
  { id: 'riscontro',   label: 'Riscontro elettrico AGB 12V cc/ca',  extra: 150 },
  { id: 'paraspiffero', label: 'Paraspiffero (porta un’anta)',  extra: 70 },
  { id: 'imballo',     label: 'Imballo con porta montata su telaio', extra: 15 },
];

// Coprifili previsti da ogni telaio (listino pagg. 48–50). Non sono uguali
// sui due lati, e il COMPLANARE SPINGERE li scambia.
const TELAIO_COPRI = {
  std:           'Liscio listellare 90/70 compreso',
  alpha:         'Coprifili piatti — 70 interno, 90 esterno',
  alpha_comp:    'Coprifili piatti — 70 interno, 90 esterno',
  alpha_comp_sp: 'Coprifili piatti — 70 esterno, 90 interno',
  design:        'Coprifili piatti — 90 esterno, 70 interno',
  design_comp:   'Coprifili piatti — 90 esterno, 70 interno',
  passaggio90:   'Coprifili lisci 90 mm sui due lati',
  r10:           'Coprifili esclusi',
  r10b:          'Coprifili esclusi',
  moderno:       'Coprifili esclusi',
  madonna:       'Da coprifilare o sagomato, 44×79',
  madonna_mod:   'Profilo squadrato, 44×79',
};

// Telai ad arco e curvi (voci 41, 43, 45): il telaio di passaggio non è
// compreso nel prezzo della porta ad arco, si ordina a parte.
const TELAIO_FORMA = { arco_ts: 750, arco_sr: 1000, curva: 1500 };

// Capitelli e zoccoli (pagg. 56–58) — prezzi Toulipier, Laccato Bianco
// Tosco compreso, "solo un lato" (×2 per due lati). SOLO fino a 900×2100.
const CAPITELLI = [
  { id: 'no',    label: 'Nessun capitello',                   extra: 0 },
  { id: 'c900',  label: 'Capitello 900',                      extra: 80 },
  { id: 'c800',  label: 'Capitello 800',                      extra: 100 },
  { id: 'c200',  label: 'Capitello 200',                      extra: 150 },
  { id: 'c300',  label: 'Capitello 300',                      extra: 150 },
  { id: 'c400',  label: 'Capitello 400',                      extra: 150 },
  { id: 'c500',  label: 'Capitello 500',                      extra: 200 },
  { id: 'c700',  label: 'Capitello 700',                      extra: 220 },
  { id: 'c900c', label: 'Capitello 900 completo (colonne)',   extra: 180 },
  { id: 'c400c', label: 'Capitello 400 completo (colonne)',   extra: 300 },
  { id: 'c700c', label: 'Capitello 700 completo (colonne)',   extra: 300 },
  { id: 'c500c', label: 'Capitello 500 completo (colonne)',   extra: 350 },
];
const CAP_COMPL = {
  fin: { label: 'Finali 78×32 (2 pz)',   extra: 20 },
  dia: { label: 'Diamanti 85×85 (2 pz)', extra: 50 },
  zoc: { label: 'Zoccoli 78×325 (2 pz)', extra: 80 },
};

// Maniglie — inventario reale della fabbrica (cartella Chapas).
// Prezzi confermati dal cliente per tutti i 12 modelli.
// fin = finiture ammesse dalla scheda tecnica del modello: ogni maniglia ne
// ha una lista sua, non sono intercambiabili.
// extra:null = prezzo da definire → esclusa dal totale, indicata nel PDF.
const MANIGLIE_MOD = [
  { id: 'no',      label: 'Da definire (esclusa)', extra: 0,   img: null, fin: [] },
  { id: 'ariana',  label: 'ARIANNA', extra: 35,  img: 'assets/maniglie/ariana.webp',
    fin: ['MCS', 'MCR', 'MNO', 'MATX'] },
  { id: 'simona',  label: 'SIMONA',  extra: 65,  img: 'assets/maniglie/simona.webp',
     fin: ['MCS', 'MCR', 'MNO', 'MBGO'] },
  { id: 'spigola', label: 'SPIGOLA', extra: 65,  img: 'assets/maniglie/spigola.webp',
    fin: ['OLV', 'MCS', 'MCR', 'MNO', 'MBIA', 'MSV', 'MBGO', 'MATX'] },
  { id: 'cuba',    label: 'CUBA',    extra: 65,  img: 'assets/maniglie/cuba.webp',
       fin: ['MCS', 'MCR', 'MNO'] },
  { id: 'elissa',  label: 'ELISA',   extra: 70,  img: 'assets/maniglie/elissa.webp',
      fin: ['OLV', 'CS', 'CR'] },
  { id: 'marea',   label: 'MAREA',   extra: 80,  img: 'assets/maniglie/marea.webp',
      fin: ['PVD', 'OLV', 'SV', 'CS', 'CR', 'ANT', 'OLD', 'BG'] },
  // la scheda del Toga arriva tagliata: si legge solo la prima finitura
  { id: 'toga',    label: 'TOGA',    extra: 90,  img: 'assets/maniglie/toga.webp',
       fin: ['MCS'], finParziale: true },
  { id: 'torino',  label: 'TORINO',  extra: 95,  img: 'assets/maniglie/torino.webp',
     fin: ['CR', 'CS', 'OLV', 'ANT', 'OLD', 'ARG', 'RAM', 'BU'] },
  { id: 'milano',  label: 'MILANO',  extra: 95,  img: 'assets/maniglie/milano.webp',
     fin: ['MCS', 'MCR', 'MNO', 'MATX', 'MBIA'] },
  { id: 'alma',    label: 'ALMA',    extra: 115, img: 'assets/maniglie/alma.webp',
       fin: ['MCS', 'MCR', 'MNO'] },
  { id: 'honey',   label: 'HONEY',   extra: 199, img: 'assets/maniglie/honey.webp',
      fin: ['CS', 'CR', 'CR/CS', 'ATX', 'NO'] },
  { id: 'square',  label: 'SQUARE',  extra: 215, img: 'assets/maniglie/square.webp',
     fin: ['CS', 'CR', 'CR/CS'] },
];

// Finiture delle maniglie: campioni ritagliati dalle tavole colori originali.
// mat = materiale usato nel 3D e nella casella ferramenta del blocco ordini.
const FINITURE = {
  // ottone
  PVD:       { label: 'Ottone PVD',                 mat: 'ottone' },
  PVDINOX:   { label: 'Ottone PVD INOX',            mat: 'cromo'  },
  'PVD/SAT': { label: 'Ottone bicolore PVD / SAT',  mat: 'ottone' },
  OLV:       { label: 'Ottone lucido verniciato',   mat: 'ottone' },
  SV:        { label: 'Ottone satinato verniciato', mat: 'ottone' },
  CS:        { label: 'Ottone cromato satinato',    mat: 'cromo'  },
  CR:        { label: 'Ottone cromato lucido',      mat: 'cromo'  },
  'CR/CS':   { label: 'Ottone bicolore CR / CS',    mat: 'cromo'  },
  'OLV/OLS': { label: 'Ottone bicolore OLV / OLS',  mat: 'ottone' },
  NKS:       { label: 'Ottone nichelato satinato',  mat: 'cromo'  },
  BG:        { label: 'Ottone bronzato graffiato',  mat: 'nero'   },
  BU:        { label: 'Ottone bronzato uniforme',   mat: 'nero'   },
  BS:        { label: 'Ottone bronzato sfumato',    mat: 'nero'   },
  BV:        { label: 'Ottone bronzato verniciato', mat: 'nero'   },
  ANT:       { label: 'Ottone bronzo antico',       mat: 'nero'   },
  OLD:       { label: 'Ottone oro antico',          mat: 'ottone' },
  ARG:       { label: 'Ottone argento antico',      mat: 'cromo'  },
  RAM:       { label: 'Ottone ramato antico',       mat: 'ottone' },
  // verniciati
  BIA:       { label: 'Verniciato bianco 9010 opaco', mat: 'cromo' },
  NO:        { label: 'Verniciato nero opaco 9005',   mat: 'nero'  },
  NL:        { label: 'Verniciato nero lucido 9005',  mat: 'nero'  },
  ATX:       { label: 'Antracite',                    mat: 'nero'  },
  // maritech
  MORO:      { label: 'Maritech oro',               mat: 'ottone' },
  MCS:       { label: 'Maritech cromato satinato',  mat: 'cromo'  },
  MCR:       { label: 'Maritech cromato lucido',    mat: 'cromo'  },
  'MCR/CS':  { label: 'Maritech bicolore CR / CS',  mat: 'cromo'  },
  MBG:       { label: 'Maritech bronzato graffiato',       mat: 'nero' },
  MBGO:      { label: 'Maritech bronzato graffiato opaco', mat: 'nero' },
  // Il Maritech è il materiale, non la tinta: queste quattro finiture non
  // hanno campione proprio nelle tavole, si mostrano con quello della tinta.
  MNO:       { label: 'Maritech nero opaco',            mat: 'nero',  camp: 'NO'  },
  MATX:      { label: 'Maritech verniciato antracite',  mat: 'nero',  camp: 'ATX' },
  MBIA:      { label: 'Maritech verniciato bianco',     mat: 'cromo', camp: 'BIA' },
  MSV:       { label: 'Maritech satinato verniciato',   mat: 'ottone', camp: 'SV' },
};
const finSlug = (c) => (FINITURE[c].camp || c).replace('/', '').toLowerCase();

// Misure delle schede tecniche, prese dai disegni di fabbrica (cat. Mariva).
// In mm. m = maniglia su rosetta · dk = dry keep · pl = maniglia su placca
// lunga · mt = martellina / cremonese su placca.
//   L = lunghezza · S = sporgenza · h = altezza · sp = spessore · q = quadro
const SCHEDE = {
  ariana:  { m: { L: 142, S: 58, ros: '45×45', sp: 10.5 },
             dk: { L: 30, sp: 12, h: 152, q: 65, S: 60 },
             mt: { L: 38, S: 59, h: 195, q: 150, sp: 11 } },
  simona:  { m: { L: 135, ros: 'd. 45', sp: 10.5 },
             dk: { L: 30, sp: 12, h: 145, q: 65, S: 62 },
             pl: { L: 135, h: 245, larg: 39, sp: 9 },
             mt: { L: 57, S: 61, h: 185, q: 177, sp: 11 } },
  spigola: { m: { L: 145, S: 56, ros: '45×45', sp: 10.5 },
             dk: { L: 30, sp: 12, h: 155, q: 65, S: 58 },
             mt: { L: 38, S: 57, h: 185, q: 150, sp: 11 } },
  cuba:    { m: { L: 137, S: 58, ros: '45×45', sp: 10.5 },
             dk: { L: 30, sp: 12, h: 147, q: 65, S: 60 },
             mt: { L: 38, S: 63, h: 187, q: 150, sp: 11 } },
  elissa:  { m: { L: 135, S: 68, ros: 'd. 45', sp: 9 },
             dk: { L: 30, sp: 11, h: 145, q: 65, S: 70 },
             pl: { L: 133, S: 68, h: 245, larg: 39, sp: 9 },
             mt: { L: 37, S: 59, h: 178, sp: 12 } },
  marea:   { m: { L: 130, S: 62, ros: 'd. 48', sp: 11 },
             dk: { L: 30, sp: 11, h: 140, q: 65, S: 62 },
             pl: { L: 126, S: 60, h: 245, larg: 40, sp: 9 },
             mt: { L: 36, S: 84, h: 195, q: 177, sp: 13 } },
  toga:    { m: { L: 145, S: 58, ros: '45×45', sp: 10.5 },
             dk: { L: 30, sp: 12, h: 155, q: 65, S: 60 },
             mt: { L: 38, S: 59, h: 195, q: 150, sp: 11 } },
  torino:  { m: { L: 135, S: 75, ros: 'd. 45', sp: 9 },
             dk: { L: 30, sp: 11, h: 145, q: 65, S: 77 },
             pl: { L: 133, S: 75, h: 245, larg: 40, sp: 9 },
             mt: { L: 36, S: 79, h: 190, q: 177, sp: 13 } },
  milano:  { m: { L: 148, S: 61, ros: '45×45', sp: 10.5 },
             dk: { L: 30, sp: 12, h: 158, q: 65, S: 63 },
             mt: { L: 38, S: 62, h: 200, q: 150, sp: 11 } },
  alma:    { m: { L: 150, S: 62, ros: '50×50', sp: 10.5 },
             dk: { L: 30, sp: 12, h: 165, q: 65, S: 62 },
             mt: { L: 38, S: 61, h: 195, q: 150, sp: 11 } },
  honey:   { m: { L: 141, S: 68, ros: '45×45', sp: 10.5 },
             dk: { L: 30, sp: 12, h: 151, q: 65, S: 70 },
             mt: { L: 38, S: 69, h: 193, q: 150, sp: 11 } },
  square:  { m: { L: 141, S: 62, ros: '45×45', sp: 10.5 },
             dk: { L: 30, sp: 12, h: 151, q: 65, S: 63 },
             mt: { L: 38, S: 62, h: 193, q: 150, sp: 11 } },
};

const MANIGLIE = {
  ottone: { label: 'Ottone',     en: 'Brass',       color: 0xc9a227, metalness: 1,   roughness: 0.35 },
  nero:   { label: 'Nero opaco', en: 'Matte black', color: 0x1f1d1a, metalness: 0.6, roughness: 0.65 },
  cromo:  { label: 'Cromo',      en: 'Chrome',      color: 0xd8dadd, metalness: 1,   roughness: 0.12 },
};

const AMBIENTI_LABEL = { galleria: 'Galleria', ingresso: 'Ingresso', soggiorno: 'Soggiorno', studio: 'Studio' };

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

/* ============================================================
   SCENA 3D
   ============================================================ */

const viewerEl = document.getElementById('viewer');
const loaderEl = document.getElementById('loader');
const loaderFill = document.getElementById('loaderFill');

/* ============================================================
   QUALITA' — quanto lavoro si chiede alla GPU per fotogramma
   ------------------------------------------------------------
   Lo stesso codice gira liscio su un monitor a 1080p e a scatti su
   uno schermo Retina, e non e' la macchina: e' il numero di pixel.
   A devicePixelRatio 2 la stessa finestra ha QUATTRO volte i
   frammenti da riempire, e quel fattore moltiplica tutto il resto —
   l'occlusione, il multisampling, l'ombra si pagano per pixel.

   Di qui si sceglie quanto spendere. La porta a schermo resta la
   stessa: cambia la finezza con cui si disegna, non la geometria.
   ============================================================ */

const PROFILI = {
  alta:  { pixelRatio: 2,   ombra: 4096, aoCampioni: 16, msaa: 4, ao: true  },
  media: { pixelRatio: 1.5, ombra: 2048, aoCampioni: 8,  msaa: 4, ao: true  },
  bassa: { pixelRatio: 1,   ombra: 1024, aoCampioni: 0,  msaa: 0, ao: false },
};

/* Ordine: ?qualita= nell'indirizzo (per provare al volo), poi la scelta
   salvata, poi 'media' — che su Retina e' quasi indistinguibile da 'alta'
   e costa meno della meta'. */
function qualitaScelta() {
  const q = new URLSearchParams(location.search).get('qualita');
  if (PROFILI[q]) return q;
  try {
    const salvata = localStorage.getItem('tc-qualita');
    if (PROFILI[salvata]) return salvata;
  } catch { /* localStorage negato in navigazione privata: pazienza */ }
  return 'media';
}

let QUALITA = qualitaScelta();
const profilo = () => PROFILI[QUALITA];

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, profilo().pixelRatio));
renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight);
/* LO MISMO QUE EL ESCAPARATE, y no es un capricho de estilo.
   Estaba en Neutral y el escaparate en ACESFilmic, y esas dos curvas revelan
   el mismo color de forma distinta: Neutral conserva la saturacion, ACES
   desatura y enfria las luces. Con la MISMA madera —c8a271, mismo acabado
   crudo, misma textura— el centro de la hoja salia (230,186,130) aqui y
   (211,187,148) alli: mas rojo y menos azul, o sea el naranja que se veia.
   No era el color de la madera ni la lampara del ambiente: era el revelado. */
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewerEl.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// FOV contenuto (30°): meno distorsione prospettica con la porta aperta
const camera = new THREE.PerspectiveCamera(30, viewerEl.clientWidth / viewerEl.clientHeight, 0.05, 60);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minPolarAngle = Math.PI * 0.22;
controls.maxPolarAngle = Math.PI * 0.55;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.9;
let userMoved = false;
renderer.domElement.addEventListener('pointerdown', () => {
  userMoved = true;
  controls.autoRotate = false;
}, { once: true });

// luce chiave radente dall'alto-sinistra: fa emergere bugne e modanature
// con ombre proprie; il riempimento resta basso per non appiattire.
const key = new THREE.DirectionalLight(0xffffff, 2.1);
key.position.set(-3.2, 3.6, 1.6);
key.castShadow = true;
key.shadow.mapSize.set(profilo().ombra, profilo().ombra);
key.shadow.bias = -0.0003;
key.shadow.normalBias = 0.008;
key.shadow.radius = 3;
key.shadow.camera.left = key.shadow.camera.bottom = -4.5;
key.shadow.camera.right = key.shadow.camera.top = 4.5;
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 0.3);
fill.position.set(3, 2, 2.5);
scene.add(fill);

/* E LE STESSE DUE DALL'ALTRA PARTE.
   Le luci stavano tutte davanti —z positivo, dov'e' la stanza di chi guarda—
   e il dietro della porta restava al buio: con una battente si vedeva appena,
   ma una rototraslante aperta mette meta' anta di la' dal muro, e quella
   meta' non si leggeva piu'. Anche il dorso ha le sue bugne e le sue
   modanature, e sono le stesse che il cliente paga.
   Sono la coppia di prima SPECCHIATA sulla z: stessa intensita', stessa
   altezza, stesso taglio radente da sinistra. La chiave di dietro fa ombra
   come quella davanti, se no il rilievo di la' resterebbe piatto — ed e' il
   rilievo il motivo per cui la si accende. */
const keyDietro = new THREE.DirectionalLight(0xffffff, 2.1);
keyDietro.position.set(-3.2, 3.6, -1.6);
keyDietro.castShadow = true;
keyDietro.shadow.mapSize.set(profilo().ombra, profilo().ombra);
keyDietro.shadow.bias = -0.0003;
keyDietro.shadow.normalBias = 0.008;
keyDietro.shadow.radius = 3;
keyDietro.shadow.camera.left = keyDietro.shadow.camera.bottom = -4.5;
keyDietro.shadow.camera.right = keyDietro.shadow.camera.top = 4.5;
scene.add(keyDietro);

const fillDietro = new THREE.DirectionalLight(0xffffff, 0.3);
fillDietro.position.set(3, 2, -2.5);
scene.add(fillDietro);

/* ============================================================
   OCCLUSIONE AMBIENTALE
   ------------------------------------------------------------
   Le ombre proiettate non bastano a raccontare un incasso piccolo.
   Il pannello del TIPO 3 e' incassato di 13,8 mm veri — la modanatura
   cade da 22,5 a 8,7 — ma su una porta di 827 mm quei millimetri sono
   tre pixel, la luce chiave li prende quasi di fronte e nessuna ombra
   li segna: la porta si leggeva piatta pur non essendolo.

   L'occlusione ambientale scurisce il rincaglio dell'incasso, che e'
   proprio l'indizio con cui l'occhio legge la profondita'. Vale per
   tutti i tipi — anche una bugna rialzata guadagna il suo stacco — e
   soprattutto NON tocca la geometria: la porta a schermo resta quella
   che esce dalla fabbrica.

   Il raggio e' in metri, come la scena, ed e' scelto sull'incasso da
   risolvere: 5 cm coprono i 13,8 mm con margine senza sporcare i campi
   larghi. Piu' grande e i pannelli si sporcano d'ombra da soli.
   ============================================================ */

/* L'interruttore. L'occlusione costa GPU: se su qualche macchina il visore
   va a scatti, si mette a false e si torna al render diretto — la porta
   resta identica, perde solo l'ombra dentro l'incasso. */
const OCCLUSIONE = true;

let composer = null;
let gtaoPass = null;

function montaOcclusione() {
  /* In qualita' bassa si esce di qui e si torna al render diretto: niente
     composer, niente target, niente pass. E' il taglio piu' grosso che si
     puo' fare, ed e' proprio quello che serve sulle macchine lente. */
  if (!OCCLUSIONE || !profilo().ao) return;
  try {
    const w = viewerEl.clientWidth, h = viewerEl.clientHeight;

    /* MSAA nel bersaglio del composer. L'antialias del renderer lavora solo
       quando si disegna sullo schermo: passando per un render target si
       perde, e i bordi della porta tornerebbero a scaletta. */
    const bersaglio = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType,
      samples: profilo().msaa,
    });

    const c = new EffectComposer(renderer, bersaglio);
    c.addPass(new RenderPass(scene, camera));

    const ao = new GTAOPass(scene, camera, w, h);
    ao.output = GTAOPass.OUTPUT.Default;      // AO composta sopra la scena
    ao.blendIntensity = 0.85;
    /* Meno campioni sullo schermo piccolo. Il telefono ha meno GPU e la porta
       ci sta dentro alta due dita: l'occlusione si legge lo stesso, e quello
       che si guadagna e' che il visore continua a girare fluido. */
    const fine = Math.min(w, h) >= 520;
    const campioni = fine ? profilo().aoCampioni : Math.max(4, profilo().aoCampioni >> 1);
    ao.updateGtaoMaterial({
      radius: 0.05,           // metri: l'incasso da risolvere e' 0,0138
      distanceExponent: 1,
      thickness: 0.5,
      scale: 1.1,
      samples: campioni,
      distanceFallOff: 1,
      screenSpaceRadius: false,
    });
    c.addPass(ao);

    /* Il tone mapping lo applica l'OutputPass: il renderer lo applica solo
       disegnando sullo schermo, e qui si disegna su un target. Senza questo
       passaggio la curva ACES sparisce e i colori escono slavati. */
    c.addPass(new OutputPass());

    composer = c;
    gtaoPass = ao;
  } catch (e) {
    /* Se l'occlusione non si puo' montare —WebGL vecchio, addon cambiato—
       il configuratore continua a rendere senza. Una porta senza AO si
       vende; una pagina bianca no. */
    console.warn('Occlusione ambientale non disponibile, si rende senza.', e);
    composer = null;
    gtaoPass = null;
  }
}

montaOcclusione();

/* ============================================================
   TEXTURES PBR — caricamento pigro con cache
   ============================================================ */

const texLoader = new THREE.TextureLoader();

/* Aqui vivia loadSet(), que cargaba a mano las cuatro jpg de cada esencia.
   No lo llamaba nadie desde que la veta la pone el motor, y sus carpetas ya no
   estan: las cuatro esencias usan ahora los PBR a medida de 600 mm. */

// materiale legno condiviso da pannello + marco (tutti i modelli)
/* Fisico e non standard: il legno del motore ha il CLEARCOAT, che e' lo strato
   di vernice sopra la fibra. Con MeshStandard quel parametro si ignora in
   silenzio e il legno resta opaco, che e' mezzo problema del "sembra plastica". */
const woodMat = new THREE.MeshPhysicalMaterial({
  roughness: 0.38,
  metalness: 0,
  clearcoat: 0.08,
  clearcoatRoughness: 0.35,
});

const hexLum = (hex) =>
  (0.2126 * ((hex >> 16) & 255) + 0.7152 * ((hex >> 8) & 255) + 0.0722 * (hex & 255)) / 255;

// materiale della maniglia/cerniere
const handleMat = new THREE.MeshStandardMaterial();

/* LA FERRAMENTA dello scorrevole: binario, carrelli, staffe, fermi e guida.
   Spenta, non lucida. Con metalness 0,85 e roughness 0,38 sembrava cromata e
   rubava l'occhio alla porta, che e' la merce; un binario vero e' alluminio
   anodizzato o verniciato, satinato. Ruvidezza alta, metallo a meta' e poco
   ambiente riflesso: si legge metallo, ma non specchia.
   Uno solo per tutta la scena, cosi' si cambia da qui e non in sei posti. */
const ferramentaMat = new THREE.MeshStandardMaterial({
  color: 0x7e8186, metalness: 0.55, roughness: 0.72, envMapIntensity: 0.45,
});

function setManiglia(k) {
  state.maniglia = k;
  const f = MANIGLIE[k];
  handleMat.color.set(f.color);
  handleMat.metalness = f.metalness;
  handleMat.roughness = f.roughness;
  document.querySelectorAll('[data-maniglia]').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.maniglia === k));
  refreshUI();
}

// aspetto del materiale = essenza + finitura.
// grezza: legno crudo — opaco, asciutto, rilievo accentuato.
// verniciata: satinato con colore pieno.
// laccato: tinta piena + lucentezza da laccatura.
// L'ambiente riflesso resta basso per non lavare i rilievi 3D.
/* La veta que esta puesta ahora mismo, o null si es un laccato. La guarda
   applyEssenza y la lee applyMaterialLook: con un PBR fotografiado el color y
   la ruvidezza los manda LA TEXTURA, no el catalogo. */
let vetaActiva = null;

function applyMaterialLook() {
  const lacc = isLaccato();
  const raw = !lacc && state.finitura === 'grezza';
  const receta = lacc ? null : vetaActiva?.receta;

  /* CON PBR FOTOGRAFIADO el color ya viene dentro del mapa, y encima lleva su
     tinte calibrado. Multiplicarlo ademas por el color de listino —ae9365 y
     compania— lo tenia dos veces y daba una madera que no existe; y poner
     0,85 de ruvidezza aplastaba su mapa, que es justo lo que distingue los
     poros del roble de la fibra lisa del toulipier.
     Asi que si hay textura manda ella. El color de listino sigue vivo donde
     tiene sentido: en las muestras del menu y en los laccati. */
  if (receta) {
    woodMat.color.set(receta.tinte ?? 0xffffff);
    // 1 = manda su mapa. Barnizada se cierra un poco y coge vernice.
    woodMat.roughness = raw ? (receta.rugosidad ?? 1) : (receta.rugosidad ?? 1) * 0.75;
    woodMat.clearcoat = raw ? (receta.barniz ?? 0) : 0.08;
    woodMat.envMapIntensity = raw ? 0.35 : 0.7;
    return;
  }

  const base = new THREE.Color(lacc ? LACCATI[state.colore].color : ESSENZE[state.essenza].color);
  if (raw) base.multiplyScalar(0.88);
  woodMat.color.copy(base);
  /* I numeri sono quelli del motore: 0,38 di ruvidezza e 0,08 di vernice per
     il legno verniciato, che e' come si vede una porta finita. La grezza e'
     legno nudo — niente vernice e molto piu' ruvida. */
  woodMat.roughness = lacc ? 0.42 : (raw ? 0.85 : 0.38);
  woodMat.clearcoat = lacc ? 0.5 : (raw ? 0 : 0.08);
  woodMat.envMapIntensity = lacc ? 0.9 : (raw ? 0.35 : 0.7);
}

/* Il fondale prende il tono del visore: chiaro di solito, scuro quando il
   legno e' chiaro e il CSS passa allo sfondo verde. Se stonasse, il vetro
   mostrerebbe un colore che non c'e' da nessuna parte. */
let telon = null;
function pintaTelon() {
  if (!telon) return;
  telon.material.color.set(viewerEl.classList.contains('is-dark') ? 0x33413a : 0xe9e4d8);
}

function applyEssenza() {
  /* La venatura la DISEGNA il motore, non e' piu' una foto.
     Prima erano quattro mappe di un set 'universal' tinto col colore
     dell'essenza; poi la venatura disegnata dal motore. Adesso ogni essenza ha
     il SUO PBR fotografico da 600 mm, lo stesso dello scaparate: rovere con le
     specchiature, castagno coi pori in solco, toulipier liscio, pino.

     Il colore dell'essenza RESTA. Sono quattro colonne di listino diverse e
     devono continuare a distinguersi: cambia il materiale, non il catalogo.

     Un laccato non ha venatura: e' vernice coprente sopra il legno. */
  /* OGNI ESSENZA CON LA SUA VENATURA, e adesso le hanno tutte e quattro.
     Sono disegnate al banco, una per una, e il banco esporta la RICETTA e non
     il PNG: cosi' si rigenera alla risoluzione che serve, ripete senza cucitura
     e si ritinge col colore dell'essenza. Un PNG non fa niente di tutto questo.
       rovere     veta-200f-50c   700 mm a 2048 px   2,93 texel/mm
       castagno   lo stesso tratto, altro tinte      2,93 texel/mm
       toulipier  veta-111f-20c   300 mm a 2048 px   6,83 texel/mm
       pino       veta-140f-50c   750 mm a 1024 px   1,37 texel/mm
     Sotto un texel per millimetro si vedono i pixel appena ci si avvicina;
     nessuna ci sta sotto.
     Un laccato non la prende mai: e' vernice coprente. */
  const v = isLaccato() ? null : veta(VENATURE[state.essenza] ?? null);
  vetaActiva = v;
  woodMat.map = v?.mapa ?? null;
  woodMat.roughnessMap = v?.rugosidad ?? null;
  woodMat.normalMap = v?.normal ?? null;
  woodMat.aoMap = null;
  applyMaterialLook();
  woodMat.needsUpdate = true;

  // porta chiara → sfondo scuro per contrasto
  const chiaro = isLaccato()
    ? hexLum(LACCATI[state.colore].color) > 0.35
    : ESSENZE[state.essenza].tonoChiaro;
  viewerEl.classList.toggle('is-dark', chiaro);
  pintaTelon();
}

/* ============================================================
   MODELLO — caricamento GLB, perno di apertura, dimensioni
   ============================================================ */

let model = null;
let shadowPlane = null;
let currentModelKey = null;
let catalogoTelaio = null;   // si carica una volta sola

// apertura della porta: perno sulle cerniere
let doorPivot = null;
let doorTargetAngle = 0;
let doorOpenAngle = 0;
let leafParts = [];
const doorBtn = document.getElementById('doorBtn');

/**
 * COME SI MUOVE OGNI APERTURA.
 *
 * Il listino ha nove aperture e il 3D ne conosceva UNA: montava sempre una
 * battente, qualunque cosa avesse scelto il cliente. Questa tabella e' lo
 * scambio: dal tipo di listino al modo di muoversi.
 *
 * Le aperture che non hanno ancora il loro movimento restano 'battente'
 * APPOSTA e non per dimenticanza: si fanno una alla volta, e finche' non
 * tocca a loro devono continuare a vedersi come si vedevano ieri. Niente
 * regressioni mentre si avanza.
 *
 * Lo schema animato in 2D (js/aperture.js) le sa gia' tutte e nove: quando
 * arrivera' il turno di ognuna, il movimento si porta da li' invece di
 * inventarlo un'altra volta.
 */
const MOVIMENTO = {
  battente: 'battente',
  justor: 'ventola',
  scomparsa: 'scorrevole',
  est_muro: 'esterno',
  /* Con mantovana e' LO STESSO scorrevole: stesso binario, stessi carrelli,
     stessa corsa. Cambia solo che davanti ci va un cassonetto che nasconde la
     ferramenta — infatti il listino le prezza uguali, 250 tutt'e due. */
  est_muro_m: 'esterno',
  /* Il kit MAGIC e' della stessa famiglia —anta davanti al muro, appesa a un
     binario— ma con le sue proporzioni: corsa piu' corta e binario piu' corto.
     Vedi CORSA_MAGIC piu' sotto. */
  magic: 'esterno',
  ergon: 'rototraslante',
  // Ancora da fare: a libro.
  int_telaio: 'battente', koblenz: 'battente',
};
const movimento = () => MOVIMENTO[state.apertura] ?? 'battente';
/* Chi CORRE invece di girare. La differenza fra le due non e' il movimento —
   e' identico— ma dove sta l'anta: la scomparsa dentro il muro, l'esterno muro
   davanti. La legge della corsa e' la stessa, quindi una sola domanda. */
const scorre = () => movimento() === 'scorrevole' || movimento() === 'esterno';

/* ROTOTRASLANTE: gira E si sposta, nello stesso momento.
   E' tutto qui il sistema ERGON di Celegon: l'anta ruota mentre il suo asse
   rientra, e per questo ingombra la meta' di una battente — la porta non
   descrive piu' l'arco intero, se lo mangia rientrando.
   Non serve meccanica nuova: il ciclo interpola gia' il giro e la traslazione
   per conto loro. Basta muovere i due bersagli insieme. */
const rototrasla = () => movimento() === 'rototraslante';

/* A VENTOLA: di la', torna, di qua, torna.
   La porta a vento non ha un verso: le cerniere Justor sono a doppia azione e
   la spingi da tutt'e due i lati. E torna DA SOLA, che e' l'altra meta' del
   prodotto — la molla — e senza il ritorno sembrerebbe una battente qualunque.
   Il verso si alterna a ogni apertura, come fa lo schema in 2D. */
let versoVentola = 1;
let ritornoVentola = null;
/* Il ritorno della molla aspetta che la porta sia arrivata: con l'apertura
   piu' lenta, 1600 ms la richiamavano indietro a meta' strada. */
const RITORNO_MS = 2400;

/* QUANTO SI MUOVE A OGNI FOTOGRAMMA, in frazione di quello che le manca.
   Era 0,07: la porta arrivava in poco piu' di un secondo e si leggeva come uno
   scatto. A 0,045 ci mette circa la meta' in piu' e si vede aprire.
   Vale per il giro E per la corsa, cosi' le aperture hanno tutte la stessa
   mano: se un giorno sembra lenta o svelta, si cambia questo e basta. */
const MORBIDEZZA = 0.045;

/* SCORREVOLE: l'anta non gira, CORRE.
   doorHomeX e' dove sta chiusa e doorCorsaX quanto se ne va — con il segno
   gia' dentro, verso il lato del perno: la maniglia sta sul canto opposto e
   la porta se ne va dalla sua parte.
   Non si tocca la rotazione: resta a zero e il ciclo muove la posizione. */
let doorHomeX = 0;
let doorCorsaX = 0;
let doorTargetX = 0;

/* ROTOTRASLANTE: oltre a girare e correre di lato, ARRETRA.
   E' il terzo asse del movimento, e serve a una sola apertura — l'ERGON —
   ma senza di lui quel sistema non e' quel sistema: e' una battente. */
let doorHomeZ = 0;
let doorCorsaZ = 0;
let doorTargetZ = 0;

function segnaBottone(aperta) {
  doorBtn.classList.toggle('is-open', aperta);
  doorBtn.title = aperta ? 'Chiudi la porta / Close the door' : 'Apri la porta / Open the door';
  doorBtn.setAttribute('aria-label', aperta ? 'Chiudi la porta' : 'Apri la porta');
}

function chiudiVentola() {
  ritornoVentola = null;
  doorTargetAngle = 0;
  segnaBottone(false);
  chiediFotogramma(2);
}

function toggleDoor() {
  /* "Aperta" non e' sempre un angolo: per una scorrevole e' una distanza. */
  const opening = scorre()
    ? doorTargetX === doorHomeX
    : doorTargetAngle === 0;
  if (ritornoVentola) { clearTimeout(ritornoVentola); ritornoVentola = null; }
  if (rototrasla()) {
    doorTargetAngle = opening ? doorOpenAngle : 0;
    doorTargetX = opening ? doorHomeX + doorCorsaX : doorHomeX;
    doorTargetZ = opening ? doorHomeZ + doorCorsaZ : doorHomeZ;
  } else if (scorre()) {
    doorTargetX = opening ? doorHomeX + doorCorsaX : doorHomeX;
  } else if (opening && movimento() === 'ventola') {
    doorTargetAngle = doorOpenAngle * versoVentola;
    versoVentola = -versoVentola;                 // la prossima volta, di la'
    ritornoVentola = setTimeout(chiudiVentola, RITORNO_MS);
  } else {
    doorTargetAngle = opening ? doorOpenAngle : 0;
  }
  segnaBottone(opening);
}

const gltfLoader = new GLTFLoader();

// libera GPU: geometrie, materiali e texture del GLB precedente.
// I materiali condivisi (woodMat, handleMat) e le loro texture in cache
// NON si toccano — vengono riusati dal modello successivo.
function disposeMaterial(m) {
  if (!m || m === woodMat || m === handleMat || m === ferramentaMat) return;
  for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'])
    if (m[k]) m[k].dispose();
  m.dispose();
}

function disposeSubtree(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (o.geometry) o.geometry.dispose();
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) disposeMaterial(m);
  });
}

function clearModel() {
  if (doorPivot) { disposeSubtree(doorPivot); scene.remove(doorPivot); doorPivot = null; }
  if (model) { disposeSubtree(model); scene.remove(model); model = null; }
  leafParts = [];
  doorTargetAngle = 0;
  if (ritornoVentola) { clearTimeout(ritornoVentola); ritornoVentola = null; }
  versoVentola = 1;
  doorHomeX = 0; doorCorsaX = 0; doorTargetX = 0;
  doorHomeZ = 0; doorCorsaZ = 0; doorTargetZ = 0;
  doorBtn.hidden = true;
  doorBtn.classList.remove('is-open');
  doorBtn.title = 'Apri la porta / Open the door';
  // gli ambienti sono tagliati sulle misure della porta → si ricostruiscono
  for (const [k, g] of Object.entries(ambienti)) {
    scene.remove(g);
    delete ambienti[k];
  }
}

// Ogni caricamento prende un numero. La guardia confrontava la chiave del
// modello: due caricamenti della stessa porta la passavano tutti e due e
// finivano tutti e due in scena, uno sopra l'altro. Col numero ne arriva
// in scena soltanto l'ultimo partito.
let numeroCarico = 0;

/**
 * Carica la porta e la mette in scena.
 *
 * Non arriva piu' da un GLB esportato: la TESSE il motore a partire dal
 * tracciato. Il .json non e' un modello 3D, e' il disegno — montanti,
 * traversi, riquadri, bugne — e la geometria si calcola qui ogni volta.
 *
 * Il salto e' grosso: i 44 GLB pesavano 276 MB, i 25 tracciati pesano 164 KB.
 * Ed e' geometria vera, non una maglia cotta: cambiare una modanatura si vede
 * su tutte le porte senza riesportare niente.
 *
 * Il motore lavora in MILLIMETRI e il configuratore in metri, da qui la scala.
 */
/* Se il modello caricato monta del vetro. Lo decide il tracciato, non il
   catalogo: chi disegna la porta mette un campo di vetro e la porta smette da
   sola di avere i tre tipi. */
let modelloConVetro = false;
/* Se la porta ha almeno un campo di legno. Senza, la bugna non si chiede. */
let modelloConPannello = false;

/**
 * Veste di essenza quello che esce dal motore.
 *
 * I materiali del motore si buttano e si mettono quelli del configuratore:
 * l'essenza e la finitura sono il cuore commerciale di questa pagina e devono
 * comandare loro. Il VETRO invece resta com'e': il motore lo fa con la
 * trasmissione, che e' come si riconosce un cristallo, e il configuratore non
 * ne ha uno suo.
 *
 * E il vetro sta FUORI dalle ombre, ne' proiettate ne' ricevute. La mappa
 * d'ombra non sa cos'e' la trasmissione: per lei un vetro e' un corpo opaco.
 * Cosi' proiettava un'ombra nera e piena come fosse un'asse, e ricevendola si
 * riempiva di macchie scure — quelle ombre marroni che si vedevano galleggiare
 * dentro il cristallo. Non erano un riflesso: era l'ombra della porta stessa
 * che gli cadeva addosso. Un vetro vero nemmeno fa ombra: lascia passare la
 * luce.
 */
function vestiConEssenza(obj) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    if (m && (m.transmission ?? 0) > 0) {
      o.castShadow = o.receiveShadow = false;
      return;                                    // e il materiale resta suo
    }
    o.castShadow = o.receiveShadow = true;
    if (m) disposeMaterial(m);
    o.material = woodMat;
  });
}

function loadModel(key) {
  const mio = ++numeroCarico;
  currentModelKey = key;
  const def = MODELLI[key];
  clearModel();
  loaderEl.classList.remove('is-hidden');
  loaderFill.style.width = '30%';

  fetch(def.file)
    .then((r) => { if (!r.ok) throw new Error(`${r.status} su ${def.file}`); return r.text(); })
    .then(async (testo) => {
      if (mio !== numeroCarico) return;   // sorpassato da un caricamento piu' recente
      loaderFill.style.width = '70%';

      const progetto = deserializar(testo);
      const tracciato = progetto.piezas.filter((p) => p.visible !== false);

      /* Il TIPO. Il tracciato sul disco vale da TIPO 1 e 2 — cambia solo la
         modanatura — e il TIPO 3 si deriva spianando i campi. Cosi' i tre
         tipi non sono tre file per porta: sono uno, letto in tre modi.
         Le porte con vetro passano intatte: hanno una regola loro. */
      /* IL TIPO SI APPLICA SEMPRE, anche col vetro: prima bastava un vetro
         perche' la porta uscisse col tracciato tale e quale, e una LAGUNA non
         avrebbe potuto essere di TIPO 2 nemmeno esistendo in fabbrica. */
      modelloConVetro = haVetro(tracciato);
      modelloConPannello = haCampoDiLegno(tracciato);
      const pezzi = applicaTipo(tracciato, state.tipo, state.bugna);
      refreshUI();

      const spessore = Math.max(...pezzi.map((p) => p.espesor ?? 45));

      /* uv: true e veta: null.
         Le venature del motore qui non servono — il configuratore ha le sue
         essenze con le foto vere — ma le coordinate di texture SI, o woodMat
         resta liscio. */
      const anta = tejerHoja(pezzi, { veta: null, uv: true, espesorHoja: spessore });
      if (mio !== numeroCarico) { disposeSubtree(anta); return; }

      /* I materiali del motore si buttano e si mettono quelli del
         configuratore: l'essenza e la finitura sono il cuore commerciale di
         questa pagina e devono comandare loro. Il vetro invece resta com'e':
         il motore lo fa con la trasmissione, che e' come si riconosce un
         cristallo, e il configuratore non ne ha uno suo. */
      vestiConEssenza(anta);

      /* TUTTO IN UN SOLO INSIEME, e in millimetri.
         L'anta, il telaio, il muro e il coprifilo devono stare nello stesso
         spazio: sono pezzi che si incastrano al millimetro, e scalarli uno per
         uno vorrebbe dire che il piu' piccolo errore di scala si vede proprio
         nelle giunzioni. Si scala una volta sola, l'insieme intero. */
      const conjunto = new THREE.Group();
      doorPivot = new THREE.Group();
      conjunto.add(doorPivot);
      doorPivot.add(anta);

      /* Il muro e il telaio.
         La parete non e' scenografia: e' quello che da' la misura di cosa si
         sta guardando —una porta sospesa nel vuoto non si legge— ed e'
         soprattutto DOVE si appoggia il coprifilo. Senza parete il coprifilo
         non ha contro cosa montarsi, ed e' un articolo di listino con tredici
         profili e il suo prezzo. */
      if (!catalogoTelaio) catalogoTelaio = await (await fetch('assets/catalogo/telaio-standard.json')).json();
      if (mio !== numeroCarico) { disposeSubtree(anta); return; }

      const cajaAnta = new THREE.Box3().setFromObject(anta);
      const datiTelaio = {
        ...catalogoTelaio,
        anchoHoja: cajaAnta.max.x - cajaAnta.min.x,
        espesorHoja: spessore,
        cantoAltoHoja: cajaAnta.max.y,
      };
      /* IL SOPRALUCE, per ora solo il vano. Il telaio sale, l'anta no: resta
         appoggiata a terra e la sua testa diventa il traverso. Muro e
         coprifilo inseguono da soli, che leggono lo stesso vanoDe(). */
      const conSopra = state.sopraluce !== 'no';
      const datiMarco = conSopra ? conSopraluce(datiTelaio, state.sopraluceH) : datiTelaio;

      /* La stessa essenza dell'anta: una porta e il suo cerco di due legni
         diversi non esistono. Per questo montar() accetta un materiale. */
      const marco = montar(datiMarco, { conTapajuntas: false, conSuelo: false, material: woodMat });
      if (conSopra) marco.add(traversoDe(datiTelaio, datiMarco, woodMat));
      conjunto.add(marco);

      /* IL VETRO del sopraluce. Va nell'insieme e NON in doorPivot: aprendo la
         porta il sopraluce resta dov'e', perche' e' fisso e sta nel telaio.
         Passa da vestiConEssenza come l'anta, che sa lasciargli il suo
         materiale e tenerlo fuori dalle ombre. */
      if (conSopra) {
        const hueco = vanoSopraluce(datiTelaio, datiMarco);
        const vetro = tejerHoja(
          [piezaVidrio(hueco.dx - hueco.sx, hueco.y1 - hueco.y0, SOPRALUCE_SATINATO)],
          { veta: null, uv: true, espesorHoja: spessore },
        );
        if (mio !== numeroCarico) { disposeSubtree(conjunto); return; }
        vestiConEssenza(vetro);
        /* I fiori DOPO vestiConEssenza: quella lascia al vetro il materiale
           del motore, e l'incisione lo clona e ci lavora sopra. */
        if (SOPRALUCE_DECORO) {
          incideFiori(vetro);
        }
        vetro.position.set(hueco.sx, hueco.y0, 0);
        vetro.name = 'VetroSopraluce';
        conjunto.add(vetro);
      }

      // L'anta si incastra nel vano del telaio. Il vano largo e' lo stesso —
      // il sopraluce alza, non allarga — quindi sx e dx valgono per entrambi.
      const vano = vanoDe(datiMarco);
      anta.position.set(
        vano.sx + (vano.dx - vano.sx - (cajaAnta.max.x - cajaAnta.min.x)) / 2 - cajaAnta.min.x,
        -cajaAnta.min.y,
        0,
      );

      await montaCoprifilo(mio, conjunto, marco, datiMarco);
      /* E il capitello, che va DOPO: se c'e' lui, il coprifilo e' andato solo
         sullo spallone e il fronte lo chiude questo. */
      await montaCapitello(mio, marco, datiMarco);
      if (mio !== numeroCarico) { disposeSubtree(conjunto); return; }

      // La parete con il suo vano, tagliata sulle misure di QUESTA porta
      /* IL BATTISCOPA MUORE CONTRO QUELLO CHE C'E' DAVANTI, e davanti soltanto.
         Prima si misurava la scatola di TUTTI i coprifili, quello dietro
         compreso: con lo scorrevole esterno muro —dove davanti il coprifilo non
         c'e'— il battiscopa restava lo stesso largo 994 e lasciava due buchi di
         intonaco ai lati della porta, che e' proprio cio' che si vedeva.
         Si guarda solo la faccia davanti: il capitello se c'e', se no il
         coprifilo di quella faccia, e se non c'e' niente si passa null, cosi'
         il motore lo porta fin sotto la mazzetta. */
      const davanti = new THREE.Box3();
      conjunto.traverse((o) => {
        if (!o.isMesh) return;
        let dentroCapitello = false;
        for (let q = o; q; q = q.parent) if (q.name === 'Capitello') { dentroCapitello = true; break; }
        if (!dentroCapitello && o.name !== 'Coprifilo') return;
        const c = new THREE.Box3().setFromObject(o);
        if ((c.min.z + c.max.z) / 2 <= 0) return;        // quello dietro non conta
        davanti.expandByObject(o);
      });
      const libre = davanti.isEmpty() ? null : davanti.max.x - davanti.min.x;
      const muro = construirAmbiente(
        state.ambiente === 'galleria' ? 'salon' : state.ambiente,
        {
          ancho: vano.dx - vano.sx,
          alto: vano.su,
          libre,
          fondo: datiTelaio.muro ? datiTelaio.muro.z1 - datiTelaio.muro.z0 : undefined,
        },
        (vano.sx + vano.dx) / 2,
      );
      /* Dentro dell'insieme e non sciolto: montar() sposta tutto indietro di
         mezzo spessore per passare dalla convenzione di fabbrica a quella
         dell'editore, e l'ambiente deve fare lo stesso viaggio o la sua parete
         resta mezzo spessore avanti e si mangia il coprifilo. */
      if (muro) marco.add(muro);

      /* IL FONDALE, dietro il vano.
         Il canvas e' trasparente di proposito: la sfumatura del visore la fa il
         CSS, dietro di lui. Ma la passata di TRASMISSIONE del vetro non sa
         niente del CSS — campiona un buffer che si pulisce col colore del
         renderer, che e' nero. Percio' il vetro non mostrava il fondo chiaro
         che si vede intorno: si riempiva di scuro, ed erano quelle "ombre
         marroni" dentro al cristallo.
         Non erano ombre, e infatti toglierle non e' bastato: era il vetro che
         guardava il vuoto.
         La soluzione non e' dare uno sfondo alla scena —si perderebbe la
         sfumatura del CSS— ma metterci dietro qualcosa DA GUARDARE, che e'
         quello che in un negozio si chiama fondale. Serve anche al vano: senza,
         attraverso la porta aperta si vedeva la pagina. */
      /* IL FONDALE STA DIETRO ALLA PORTA APERTA, non a quaranta millimetri.
         Stava appena dietro il muro, e da quando la porta apre in dentro
         l'anta gli finiva DAVANTI: il fondale la copriva e nel vano si vedeva
         solo bianco. Non era il muro a nascondere la porta —era il fondale.

         Quanto arretrare non e' un numero a piacere: e' quanto sporge l'anta
         girando, cioe' la sua larghezza per il seno dell'angolo. Si prende la
         larghezza intera come margine buono per qualunque angolo, e il piano
         cresce in proporzione perche' piu' e' lontano piu' deve essere largo
         per coprire lo stesso vano. */
      const larghezzaVano = vano.dx - vano.sx;
      const fondoMuro = (datiTelaio.muro ? datiTelaio.muro.z0 : -110);
      const arretra = larghezzaVano + 200;
      telon = new THREE.Mesh(
        new THREE.PlaneGeometry(larghezzaVano * 5, vano.su * 3.2),
        new THREE.MeshBasicMaterial({ toneMapped: false }),
      );
      telon.name = 'Fondale';
      telon.position.set((vano.sx + vano.dx) / 2, vano.su * 0.55, fondoMuro - arretra);
      pintaTelon();
      /* IL FONDALE, SPENTO.
         Il cliente lo vede come una parete bianca piantata dietro la porta, e
         ha ragione: e' un piano di materiale BASIC —nessuna luce lo tocca, non
         ha tonemapping— percio' resta chiaro e piatto mentre tutto il resto ha
         volume, e da dietro riempie il fondo.
         MISURATO, luce non ne toglie: la faccia di dietro dell'anta rende
         115,9 con lui e 115,9 senza, differenza zero. Non fa ombra (castShadow
         non e' mai stato acceso) e non puo' farne.
         Resta pero' quello per cui era nato, e va detto: senza di lui la
         passata di TRASMISSIONE del vetro campiona il buffer nero e i
         sopraluce tornano a riempirsi di scuro, e dal vano aperto si vede la
         pagina dietro il canvas. Se ricompaiono quelle due cose, e' questo.
         E infatti, spegnendolo, la prova l'ha trovato subito: col sopraluce
         montato, DENTRO IL VETRO si vedevano le iconine delle maniglie della
         pagina. Non e' un'ipotesi del commento, e' quello che rende lo
         schermo.
         Percio' non si sceglie fra le due cose: il fondale serve SOLO quando
         c'e' del vetro da attraversare. Senza sopraluce non si monta —e
         dietro la porta non c'e' piu' nessuna parete bianca— e col sopraluce
         torna, perche' li' senza di lui il cristallo mostra la pagina.
         Guardando dal vano aperto, invece, senza fondale non si vede niente
         di strano: resta la sfumatura chiara del CSS. */
      const FONDALE_VISIBILE = conSopra;
      if (FONDALE_VISIBILE) marco.add(telon);

      model = conjunto;
      conjunto.scale.setScalar(1 / 1000);        // il motore va in millimetri
      conjunto.updateMatrixWorld(true);

      /* Si inquadra sulla PORTA, non sull'insieme.
         Adesso l'insieme comprende il pavimento, che e' un piano di nove metri:
         misurando tutto, la porta veniva incorniciata dentro una stanza di 8 x
         3,5 x 7 e si vedeva lontanissima. Si misurano solo l'anta, il telaio e
         il coprifilo, che e' cio' che il cliente sta comprando. */
      const box = new THREE.Box3();
      conjunto.traverse((o) => {
        if (o.isMesh && ['Telaio', 'Coprifilo'].includes(o.name)) box.expandByObject(o);
      });
      box.expandByObject(anta);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      conjunto.position.sub(center);
      scene.add(conjunto);

      const dist = size.y * 2.0;
      camera.position.set(dist * 0.65, size.y * 0.12, dist);
      controls.target.set(0, 0, 0);
      controls.minDistance = dist * 0.5;
      controls.maxDistance = dist * 2.2;
      controls.update();

      /* Niente piano d'ombra: il motore porta il suo pavimento vero, e due
         superfici che raccolgono l'ombra nello stesso punto litigano. */

      /* Il perno sta sul lato delle cerniere, cioe' l'OPPOSTO della maniglia.
         Lo decide state.mano, che e' gia' un dato del preventivo — c'e' il
         selettore Mano DX / Mano SX — e non una cosa da indovinare guardando
         la maglia.
         Il perno adesso e' DENTRO l'insieme e in millimetri: gira solo l'anta,
         il telaio e il muro restano fermi, che e' come funziona una porta. */
      const manoDx = state.mano !== 'sx';

      /* LA CAJA DE LA HOJA, EN MILIMETROS.
         setFromObject la da in MONDO, cioe' in metri: l'insieme e' gia' stato
         scalato di 1/1000. Ma il perno sta DENTRO l'insieme, dove si misura in
         millimetri —lo dice il -spessore/2 qui sotto, che e' sempre stato in
         millimetri. Mescolare i due spazi voleva dire leggere un canto di
         -0,42 m come -0,42 mm: praticamente zero, e l'asse finiva in mezzo
         all'anta invece che sul suo canto. Di li' l'anta che pareva spezzarsi,
         che entrava nel telaio, e le due mani che giravano quasi uguali.
         Si riporta la caja nello spazio dell'insieme e i conti tornano. */
      /* Le matrici vanno aggiornate PRIMA di leggerle: qui sopra si e' appena
         spostato l'insieme (position.sub(center)) e con il disegno a richiesta
         puo' non essere passato nessun fotogramma a rifarle. Le due letture
         devono venire dallo stesso istante, o l'una corregge uno spazio che
         l'altra non ha ancora. */
      conjunto.updateMatrixWorld(true);
      const cajaHoja = new THREE.Box3()
        .setFromObject(anta)
        .applyMatrix4(new THREE.Matrix4().copy(conjunto.matrixWorld).invert());
      /* IL MONTANTE DI CHIUSURA, misurato sulla maglia.
         La maniglia va sul montante, e il montante non e' un numero fisso:
         sulla Siena e' largo 95 mm, un altro modello lo fara' diverso. Si
         riconosce da solo — e' un pezzo che va da cielo a terra e finisce
         sul canto dell'anta dalla parte opposta alle cerniere. */
      const altoAnta = cajaHoja.max.y - cajaHoja.min.y;
      const cantoLibero = manoDx ? cajaHoja.max.x : cajaHoja.min.x;
      let montanteChiusura = null;
      anta.traverse((o) => {
        if (!o.isMesh) return;
        const c = new THREE.Box3().setFromObject(o).applyMatrix4(
          new THREE.Matrix4().copy(conjunto.matrixWorld).invert());
        if ((c.max.y - c.min.y) < altoAnta * 0.85) return;          // non arriva da cielo a terra
        if (Math.abs((manoDx ? c.max.x : c.min.x) - cantoLibero) > 2) return;   // non e' sul canto giusto
        montanteChiusura = c;
      });

      doorPivot.position.set(manoDx ? cajaHoja.min.x : cajaHoja.max.x, 0, -spessore / 2);
      anta.position.sub(doorPivot.position);
      leafParts = [anta];

      /* L'ANTA VA IN FONDO AL TELAIO, non sul suo filo davanti.
         ------------------------------------------------------------
         Misurato: il telaio sta fra -61 e +57 millimetri, l'anta fra +27 e
         +72. Cioe' tutti gli ottantotto millimetri di telaio stanno DIETRO
         l'anta e davanti non ce n'e' nessuno. Quella e' la geometria di una
         porta che apre verso chi guarda — ed e' il motivo per cui il codice
         di prima apriva in fuori: rispettava il telaio.

         Aprendo in dentro, invece, il canto delle cerniere se ne va contro
         il montante e lo attraversa: e' il "invade il telaio" che si vedeva.
         Non era il perno ne' l'angolo, era DOVE sta l'anta nel telaio.

         Una porta che apre in dentro si monta in fondo al vano: da fuori si
         vede la mazzetta e poi l'anta rientrata, e lo spazio per gitare le
         resta tutto davanti a se'. Il ritiro non si scrive a mano, si misura
         sul telaio di questo modello: i telai del listino non hanno tutti la
         stessa battuta. */
      const invConjunto = new THREE.Matrix4().copy(conjunto.matrixWorld).invert();
      const cajaTelaio = new THREE.Box3();
      marco.traverse((o) => {
        if (o.isMesh && /telaio/i.test(o.name || '')) cajaTelaio.expandByObject(o);
      });
      if (!cajaTelaio.isEmpty()) {
        cajaTelaio.applyMatrix4(invConjunto);
        /* Si sposta il PERNO, non l'anta: cosi' l'asse di rotazione arretra
           insieme a lei e resta sul suo canto. Spostando l'anta soltanto,
           girerebbe attorno a un asse rimasto avanti. */
        if (movimento() === 'ventola' || movimento() === 'scorrevole') {
          /* A VENTOLA L'ANTA VA IN MEZZO AL TELAIO, non in fondo.
             In fondo ci va perche' apre in dentro e il telaio le fa da
             battuta. Ma una porta a vento apre dai due lati: una battuta la
             fermerebbe da una parte, e infatti quelle porte il telaio ce
             l'hanno senza. Centrandola, i due giri sono uguali e nessuno dei
             due entra nel legno. */
          const centroTelaio = (cajaTelaio.min.z + cajaTelaio.max.z) / 2;
          const centroAnta = (cajaHoja.min.z + cajaHoja.max.z) / 2;
          doorPivot.position.z += centroTelaio - centroAnta;
          /* Alla scorrevole serve per un'altra ragione: centrata sta DENTRO lo
             spessore del muro —misurato, il muro va da -61 a 56 e l'anta finisce
             fra -30 e 15— e allora scorrendo sparisce dietro la parete da sola,
             senza doverle costruire la tasca. E' quello che fa un controtelaio
             vero: la porta se ne va nel muro e non si vede piu'. */
        } else if (movimento() === 'esterno') {
          /* ESTERNO MURO: l'anta non entra nel vano, ci passa DAVANTI.
             E' appesa a un binario sulla parete e scorre sopra l'intonaco, con
             il suo bel gioco fra legno e muro. Per questo non sparisce quando
             si apre: resta li' da vedere, appoggiata al muro accanto. Dodici
             millimetri sono il gioco che lascia il carrello. */
          /* TRENTACINQUE e non dodici. Con dodici l'anta passava DENTRO il
             battiscopa: misurato, il battiscopa sporge fino a z 82 e l'anta
             stava fra 69 e 113 — tredici millimetri di compenetrazione, e
             scorrendo lo attraversava. Il battiscopa sporge 25 dal muro, per
             cui l'anta deve stargli davanti: 35 la lasciano a dieci millimetri
             buoni dal suo filo. */
          const GIOCO_MURO = 35;
          const mediaAnta = (cajaHoja.max.z - cajaHoja.min.z) / 2;
          const centroAnta = (cajaHoja.min.z + cajaHoja.max.z) / 2;
          doorPivot.position.z += cajaTelaio.max.z + GIOCO_MURO + mediaAnta - centroAnta;
        } else {
          const ritiro = cajaHoja.min.z - cajaTelaio.min.z;
          if (ritiro > 0) doorPivot.position.z -= ritiro;
        }
      }

      /* La porta apre VERSO L'INTERNO: l'anta se ne va dietro il muro, non
         addosso a chi guarda.

         Il verso NON si suppone dalla mano, si legge dalla geometria. Prima
         qui c'era (manoDx ? -1 : 1), che dava per scontato che DX e SX
         appendessero l'anta da parti opposte del perno. Misurato, non e'
         vero: in tutt'e due le mani l'anta pende verso +X rispetto al perno
         —833 mm da un lato, 6 dalla parte opposta— e quel segno alternato
         faceva aprire bene una mano e al contrario l'altra.

         Guardando da che parte pende si azzecca sempre, e resta giusto anche
         il giorno in cui il perno cambiera' lato per davvero. */
      doorPivot.updateMatrixWorld(true);
      const antaRelativa = new THREE.Box3()
        .setFromObject(anta)
        .applyMatrix4(doorPivot.matrixWorld.clone().invert());
      const pendeVersoPiuX = (antaRelativa.min.x + antaRelativa.max.x) >= 0;
      /* TRENTACINQUE GRADI.
         I ventiquattro di prima erano una difesa: con l'anta montata sul filo
         davanti e il fondale a due dita dal muro, aprire di piu' voleva dire
         perderla dietro al muro. Adesso che l'anta sta in fondo al telaio e
         il fondale e' arretrato dietro al suo giro, quel vincolo non c'e'
         piu' e la porta puo' aprirsi come si apre una porta.

         Il tetto vero adesso lo mette il fondale, che arretra di una
         larghezza di vano: fin verso i settanta gradi l'anta gli resta
         davanti. Trentacinque e' dove si legge meglio la merce — la faccia
         quasi intera, e la mazzetta che racconta la profondita'. */
      doorOpenAngle = (pendeVersoPiuX ? 1 : -1) * THREE.MathUtils.degToRad(35);

      /* QUANTO CORRE una scorrevole: la sua stessa larghezza meno il ricoprimento
         che resta sul montante, se no il vano si aprirebbe piu' di quanto e'
         largo. Venti millimetri sono quelli che tengono la porta agganciata al
         telaio anche tutta aperta.
         Il VERSO e' quello del perno: la maniglia sta sul canto opposto, quindi
         la porta se ne va dalla parte delle cerniere. */
      const larghezzaAnta = cajaHoja.max.x - cajaHoja.min.x;
      /* QUANTO CORRE: la sua larghezza meno i venti millimetri di ricoprimento
         che la tengono agganciata al telaio. Vale per tutte, MAGIC compreso.
         Il MAGIC aveva una corsa piu' corta, 0,66, presa dallo schema 2D. Era
         un comodo del disegno, non una misura: il sistema vero (Magic2 di
         Terno) e' una scorrevole esterno muro come le altre, ante da 680 a
         1800 mm, e l'anta libera il vano per intero. Con lo 0,66 restava un
         terzo di porta chiusa. */
      doorCorsaX = (manoDx ? -1 : 1) * Math.max(0, larghezzaAnta - 20);
      doorHomeX = doorPivot.position.x;
      doorTargetX = doorHomeX;

      /* IL ROTOTRASLANTE, cioe' l'ERGON LIVING di CELEGON (non Koblenz: quello
         e' la voce 21, e il suo rototraslante si chiama SwingLife).
         Il primo tentativo l'aveva letto male. Prendeva dallo schema 2D
         "l'asse rientra di 0,42 della larghezza" e faceva rientrare il perno
         VERSO IL CENTRO del vano. Misurato, veniva fuori il contrario del
         prodotto: l'anta aperta si piantava in mezzo al passaggio —x da -96 a
         -22 su un vano di 856— e l'area spazzata non calava di un millimetro,
         881 mm contro gli 869 di una battente. Un sistema salvaspazio che
         toglieva mezzo passaggio.
         Il manuale tecnico Celegon (Ergon Living S40) dice un'altra cosa: il
         movimento "fa INDIETREGGIARE l'anta in apertura". L'anta non scappa di
         lato — resta accostata al suo stipite — e ARRETRA, finendo
         perpendicolare al muro e A CAVALLO di esso: una meta' di qua, una
         meta' di la'. E' cosi' che dimezza l'ingombro, dividendolo fra le due
         stanze invece di scaricarlo tutto in quella di chi guarda.
         QUANTO sporge lo dice il piano quotato: QF, la quota fissa d'ingombro,
         e' COSTANTE per braccetto — non cresce con l'anta — e il resto della
         larghezza sta dall'altra parte. Nel piano ufficiale QF 392 + QV 377 fa
         769, che e' esattamente la larghezza dell'anta. */
      if (movimento() === 'rototraslante') {
        doorOpenAngle = (pendeVersoPiuX ? 1 : -1) * THREE.MathUtils.degToRad(90);
        /* QF per braccetto, tabella Celegon: la misura del foro muro sceglie
           il braccetto (SMALL 610-800, BASE 800-1100, LARGE 1100-1450) e con
           lui la sporgenza. */
        const foro = vano.dx - vano.sx;
        const QF = foro <= 800 ? 295 : foro <= 1100 ? 392 : 620;
        /* DA CHE PARTE STA LA STANZA. Il primo arretramento andava dalla parte
           sbagliata e l'anta spariva dietro il muro: aperta, non si vedeva
           piu'. La stanza e' il lato +z —lo dicono due cose misurate, il
           battiscopa che sta fra z 57 e 82 e la telecamera che guarda da z
           +4181— e quindi il filo verso chi guarda e' il DIETRO del telaio,
           cajaTelaio.max.z, non il davanti.
           Aperta, l'anta sporge QF oltre quel filo. Il perno pero' non e' il
           capo dell'anta: girata di novanta gradi, il legno gli sta ancora
           davanti di mezzo spessore, e senza togliere quel mezzo spessore la
           sporgenza veniva QF piu' 22. */
        const filoStanza = cajaTelaio.max.z;
        doorCorsaZ = (filoStanza + QF - spessore / 2) - doorPivot.position.z;
        /* E QUINDICI MILLIMETRI DI LATO, che non sono un capriccio.
           Arretrando, l'anta attraversa il pannello della parete, e quel
           pannello ha il buco 15 mm piu' stretto del vano (7,5 per lato, li
           fa ambiente.js apposta perche' il coprifilo pesti la parete). Con
           l'anta appoggiata allo stipite il suo canto cadeva a x -420 e il
           bordo del buco a -420,5: mezzo millimetro. Passandoci dentro si
           sarebbero contesi i pixel, lo stesso sfarfallio della mantovana.
           Quindici la fanno passare pulita, e restano comunque dentro il
           vano: non sporge dallo stipite, che e' quello che il sistema
           promette. */
        doorCorsaX = (manoDx ? 1 : -1) * 15;
      }
      doorHomeZ = doorPivot.position.z;
      doorTargetZ = doorHomeZ;
      doorBtn.hidden = false;

      /* IL BINARIO, che nell'esterno muro SI VEDE: e' mezzo prodotto.
         Va sopra il vano e lungo quanto serve perche' l'anta ci resti appesa
         anche tutta aperta — la sua larghezza piu' la corsa, piu' un margine
         per i fermi — e spostato verso il lato dove la porta se ne va, che e'
         dove il binario deve esserci davvero.

         STA QUI e non piu' su, accanto all'anta, per una ragione che il primo
         tentativo ha insegnato: la corsa si calcola due righe fa. Montandolo
         prima, doorCorsaX valeva ancora zero e il binario usciva lungo 960
         invece di 1779, per giunta centrato sul vano.
         E la z si misura sull'ANTA VERA, ma solo dopo aver aggiornato le
         matrici a mano. Le due strade sbagliate le ho fatte tutt'e due:
         misurarla senza aggiornare dava la posizione di prima dello
         spostamento, e ricavarla col conto —faccia del telaio piu' gioco piu'
         mezza anta— la lasciava 22 mm indietro, cioe' un'altra mezza anta,
         perche' il perno parte gia' arretrato di mezzo spessore e lo
         spostamento si somma a quello. Aggiornare e misurare non ha di questi
         dubbi: dice dove l'anta STA. */
      if (movimento() === 'esterno' && !cajaTelaio.isEmpty()) {
        /* LA FERRAMENTA, non una tavola appesa in aria.
           Un esterno muro si vende per questo: il binario in vista, i carrelli
           che ci corrono dentro e le staffe che scendono a mordere il canto
           alto dell'anta. Prima c'era solo il binario e la porta non toccava
           niente: fra il suo canto e il binario restavano 49 mm di vuoto, e si
           vedeva benissimo che non era appesa a nulla.
           Il pezzo fisso —binario e fermi— sta nell'insieme; i carrelli e le
           staffe pendono dal PERNO, cosi' corrono con l'anta invece di
           restare indietro. */
        conjunto.updateMatrixWorld(true);
        const invC = new THREE.Matrix4().copy(conjunto.matrixWorld).invert();
        const cajaAntaReal = new THREE.Box3().setFromObject(anta).applyMatrix4(invC);
        const zAnta = (cajaAntaReal.min.z + cajaAntaReal.max.z) / 2;
        const cimaAnta = cajaAntaReal.max.y;

        /* CHI FA VEDERE LA FERRAMENTA, e chi no. Lo decide il listino:
             31 guide a filo SENZA mantovana -> "invisible guides": non si vede
                niente, l'anta sembra scorrere da sola sul muro;
             32 con battuta e kit mantovana -> il binario c'e' e lo copre il
                cassonetto, piu' la battuta contro cui l'anta chiude;
             34 MAGIC -> "tutto il sistema scorrevole e' nascosto", parole del
                costruttore.
           Quindi il binario, i carrelli, le staffe e i fermi si montano solo
           con la mantovana: sono gli unici che poi qualcosa nasconde. La guida
           a pavimento invece va sempre, che quella si vede in tutte. */
        /* UNA PORTA APPESA DEVE APPENDERSI A QUALCOSA.
           Avevo tolto tutta la ferramenta alla 31 e alla 34 leggendo "guide a
           filo / invisible guides" come "non c'e' niente": sbagliato, e si
           vedeva — l'anta restava per aria, attaccata al nulla. Quei sistemi
           hanno un carrello superiore fissato alla parete e una guida a
           pavimento con perno; quello che sparisce e' il PROFILO, non il
           sostegno.
           Percio' il binario c'e' sempre. Con la mantovana e' quello grosso,
           tanto lo copre il cassonetto; senza, e' un profilo sottile, che e'
           come si vendono le guide a filo. */
        const conMantovana = state.apertura === 'est_muro_m';
        const ALTO_BINARIO = conMantovana ? 40 : 18;
        const FONDO_BINARIO = conMantovana ? 26 : 16;
        const yBinario = vano.su + 40 + ALTO_BINARIO / 2;     // centro del binario
        const bajoBinario = yBinario - ALTO_BINARIO / 2;
        /* Il binario copre la corsa piu' un margine per i fermi. Non ha piu'
           il caso MAGIC: quel sistema il binario non lo mostra, e dove non si
           mostra non si monta. */
        const largoBinario = larghezzaAnta + Math.abs(doorCorsaX) + 120;
        const xBinario = (vano.sx + vano.dx) / 2 + doorCorsaX / 2;

        const pieza = (largo, alto, fondo, x, y, z, nombre, padre) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(largo, alto, fondo), ferramentaMat);
          m.name = nombre;
          m.castShadow = true;
          m.receiveShadow = true;
          m.position.set(x, y, z);
          padre.add(m);
          return m;
        };

        // il binario: sempre, che l'anta ci si appende davvero
        pieza(largoBinario, ALTO_BINARIO, FONDO_BINARIO, xBinario, yBinario, zAnta,
              'BinarioEsternoMuro', conjunto);
        // i fermi a vista solo dove il cassonetto li nasconde
        if (conMantovana) {
        /* I FERMI SPORGONO di tre millimetri dal binario invece di finire a
           filo. A filo, la loro faccia esterna cadeva nello STESSO piano del
           capo del binario e le due si contendevano la profondita': lo stesso
           z-fighting della mantovana, in miniatura, sui due capi. Sporgendo,
           il piano non lo condivide piu' nessuno — ed e' anche come sono i
           fermi veri, che fanno da tappo e si vedono. */
        for (const lado of [-1, 1]) {
          pieza(16, ALTO_BINARIO + 10, FONDO_BINARIO + 8,
                xBinario + lado * (largoBinario / 2 - 5), yBinario, zAnta,
                'FermoBinario', conjunto);
        }
        }   // fine dei fermi

        /* Carrelli e staffe: appesi al perno. Le loro coordinate sono relative
           a lui, quindi si toglie la sua posizione a quelle dell'insieme. */
        const aPerno = (x, y, z) => [x - doorPivot.position.x, y - doorPivot.position.y, z - doorPivot.position.z];
        const bordes = [cajaAntaReal.min.x + 110, cajaAntaReal.max.x - 110];
        for (let i = 0; i < bordes.length; i++) {
          const [cx, cy, cz] = aPerno(bordes[i], yBinario, zAnta);
          pieza(conMantovana ? 96 : 64, ALTO_BINARIO - 6, FONDO_BINARIO + 8, cx, cy, cz, `Carrello${i + 1}`, doorPivot);
          /* La staffa colma il vuoto: dal carrello fino DENTRO l'anta, che
             cosi' si legge avvitata e non appoggiata. */
          const altoStaffa = (yBinario - ALTO_BINARIO / 2) - cimaAnta + 26;
          const [sx2, sy2, sz2] = aPerno(bordes[i], bajoBinario - altoStaffa / 2 + 26, zAnta);
          pieza(conMantovana ? 26 : 18, altoStaffa, 12, sx2, sy2, sz2, `Staffa${i + 1}`, doorPivot);
        }

        /* E la guida a pavimento: un esterno muro appeso balla, e in opera se
           ne mette sempre una che tiene il canto basso contro il muro.
           AFFONDATA di due millimetri. Appoggiata esatta, la sua faccia di
           sotto finiva nello STESSO piano del pavimento —tutt'e due a quota
           zero— e due superfici alla stessa profondita' sfarfallano: e' lo
           stesso z-fighting della mantovana, in piccolo. Due millimetri sotto
           non si vedono e il piano non lo condivide piu' con nessuno. */
        const [gx, gy, gz] = [ (vano.sx + vano.dx) / 2 + (doorCorsaX > 0 ? -1 : 1) * (larghezzaAnta / 2 + 40), 10, zAnta ];
        pieza(70, 24, FONDO_BINARIO + 16, gx, gy, gz, 'GuidaPavimento', conjunto);

        /* LA MANTOVANA, che e' tutta la differenza fra le due scorrevoli del
           listino. Il movimento non cambia di un millimetro: cambia che questo
           cassonetto passa davanti al binario e ai carrelli e li nasconde, e
           dalla stanza si vede una fascia di legno e la porta appesa al nulla.
           Va nell'ESSENZA della porta, come il capitello, ed e' fissa: non
           corre con l'anta. Due pezzi, perche' un cassonetto non e' una tavola:
           il frontale e il cielo che lo chiude contro il muro. */
        if (state.apertura === 'est_muro_m') {
          const GRUESO = 20;
          const yTapa = yBinario + ALTO_BINARIO / 2 + 24;     // sopra il binario
          const yFondo = cimaAnta - 24;                       // sotto il canto alto dell'anta
          const zFrente = cajaAntaReal.max.z + 10 + GRUESO / 2;
          const zTrasFrontal = zFrente - GRUESO / 2;          // faccia interna del frontale
          const largoM = largoBinario + 40;

          /* I DUE PEZZI SI TOCCANO, NON SI COMPENETRANO.
             La prima versione sfarfallava, e non era il legno ne' la luce: il
             frontale e il cielo condividevano un pezzo di volume e avevano due
             facce nello STESSO piano —quella di sopra e quella davanti— piu'
             il cielo che partiva esattamente sulla faccia del muro. Due
             superfici alla stessa profondita' la scheda non sa ordinarle e le
             alterna a ogni fotogramma: e' lo z-fighting, e si vede come un
             tremolio continuo.
             Adesso il frontale prende tutta l'altezza e il cielo riempie solo
             DIETRO di lui, staccato un millimetro dal muro: si toccano lungo un
             piano, ma non si sovrappongono da nessuna parte. */
          const frontal = new THREE.Mesh(new THREE.BoxGeometry(largoM, yTapa - yFondo, GRUESO), woodMat);
          pegarVeta(frontal.geometry, true);
          frontal.name = 'Mantovana';
          frontal.castShadow = true;
          frontal.receiveShadow = true;
          frontal.position.set(xBinario, (yTapa + yFondo) / 2, zFrente);
          conjunto.add(frontal);

          const zDietro = cajaTelaio.max.z + 1;               // un millimetro staccato dal muro
          const fondoTapa = zTrasFrontal - zDietro;
          if (fondoTapa > 2) {
            const cielo = new THREE.Mesh(new THREE.BoxGeometry(largoM, GRUESO, fondoTapa), woodMat);
            pegarVeta(cielo.geometry, true);
            cielo.name = 'MantovanaCielo';
            cielo.castShadow = true;
            cielo.receiveShadow = true;
            cielo.position.set(xBinario, yTapa - GRUESO / 2, zDietro + fondoTapa / 2);
            conjunto.add(cielo);
          }

          /* LA BATTUTA, che la voce 32 nomina e la 31 no: un listello verticale
             sul montante dove l'anta arriva chiudendo. Senza, una scorrevole
             esterno muro sbatte contro il nulla e resta il filo di luce.
             Va dalla parte OPPOSTA alla corsa, che e' dove l'anta chiude. */
          const ladoCierre = doorCorsaX < 0 ? 1 : -1;
          const xBattuta = (ladoCierre > 0 ? vano.dx : vano.sx) + ladoCierre * 12;
          /* Un filo PIU' SOTTILE e un filo piu' indietro della mantovana: se le
             due hanno lo stesso spessore e lo stesso piano, le loro facce
             davanti e dietro cadono alla stessa profondita' dove si
             incrociano, e li' sfarfallano. E' il terzo caso della stessa
             famiglia: due superfici complanari non si possono ordinare. */
          /* INTEGRATA NELLA MAZZETTA, non un palo piantato davanti. La battuta
             e' il montante contro cui l'anta chiude —quello che regge anche la
             serratura— quindi parte dalla faccia del muro e arriva a coprire lo
             spessore dell'anta, invece di starle davanti. */
          /* Ne' fino al muro ne' fino al cassonetto: la battuta copre lo
             SPESSORE DELL'ANTA e basta, che e' il suo mestiere. Arrivando fino
             in fondo condivideva il piano di dietro col battiscopa (56) e
             quello davanti con la mantovana (166): due superfici complanari
             per parte, cioe' due sfarfallii. Due millimetri avanti al muro e
             sei oltre l'anta la tengono fuori da tutti e due i piani. */
          const zBattuta0 = cajaTelaio.max.z + 2;
          const fondoBattuta = (cajaAntaReal.max.z + 6) - zBattuta0;
          const battuta = new THREE.Mesh(
            new THREE.BoxGeometry(24, vano.su + 20, fondoBattuta), woodMat);
          pegarVeta(battuta.geometry, false);      // in piedi: fibra per il lungo
          battuta.name = 'BattutaScorrevole';
          battuta.castShadow = true;
          battuta.receiveShadow = true;
          battuta.position.set(xBattuta, (vano.su + 20) / 2, zBattuta0 + fondoBattuta / 2);
          conjunto.add(battuta);
        }
      }

      /* IL FERRO DELL'ERGON, ridotto a quello che si vede davvero.
         Il primo tentativo montava il meccanismo intero —binario, carrello,
         due aste e uno snodo— e misurato funzionava: le aste non si
         allungavano di un millimetro lungo tutta la corsa. Ma non era quello
         che serviva. Una porta di questo tipo, guardata, e' pulita: due perni,
         uno sopra e uno sotto, con le loro piastrine a vista sull'anta. Il
         meccanismo vero sta DENTRO il legno e dentro l'architrave, ed e'
         proprio per questo che si vende — non si vede.
         Restano fuori, come prima: niente guida a pavimento e niente cerniere
         sul montante, che una rototraslante non le ha. */
      if (movimento() === 'rototraslante' && !cajaTelaio.isEmpty()) {
        conjunto.updateMatrixWorld(true);
        const invE = new THREE.Matrix4().copy(conjunto.matrixWorld).invert();
        const cajaAnta = new THREE.Box3().setFromObject(anta).applyMatrix4(invE);
        const cima = cajaAnta.max.y - doorPivot.position.y;
        const fondo = cajaAnta.min.y - doorPivot.position.y;
        const dentroAnta = manoDx ? 1 : -1;
        const tondo = (raggio, alto, x, y, z, coricato, nome) => {
          const m = new THREE.Mesh(
            new THREE.CylinderGeometry(raggio, raggio, alto, 24), ferramentaMat);
          m.name = nome; m.castShadow = true; m.receiveShadow = true;
          if (coricato) m.rotation.x = Math.PI / 2;   // disteso sulla faccia
          m.position.set(x, y, z);
          doorPivot.add(m);
          return m;
        };
        /* I PERNI, sull'asse del giro. BASSI: fra il canto alto dell'anta e
           l'architrave ci ballano nove millimetri, e un perno piu' alto
           entrerebbe nel legno di sopra.
           SOTTO NON C'E' QUEL GIOCO: l'anta finisce a quota -1048 e il
           pavimento sta li' pure. Messo sotto il canto, il perno spariva
           OTTO MILLIMETRI DENTRO IL PAVIMENTO. Va incassato nel canto, che
           e' anche dove sta quello vero — sotto la porta non pende niente. */
        tondo(14, 8, 0, cima + 4, spessore / 2, false, 'PernoAlto');
        tondo(14, 8, 0, fondo + 4, spessore / 2, false, 'PernoBasso');
        /* Le piastrine a vista. UN MILLIMETRO fuori dal legno: a filo esatto
           la loro faccia e quella dell'anta sarebbero lo stesso piano, ed e'
           lo sfarfallio di sempre. */
        tondo(15, 4, dentroAnta * 55, cima - 150, spessore - 1, true, 'PiastrinaAlta');
        tondo(15, 4, dentroAnta * 55, fondo + 150, spessore - 1, true, 'PiastrinaBassa');
      }

      /* Il punto e' riferito al VANO, come nello scaparate, e poi si porta
         nello spazio del perno — che e' quello dell'insieme meno l'offset del
         perno stesso. */
      const punto = puntoDellaManiglia(pezzi, manoDx, cajaHoja, montanteChiusura);
      if (!punto.sobreMontante) console.warn(`${key}: la maniglia non cade sul montante`);
      sitioManiglia = {
        x: punto.x - doorPivot.position.x,
        y: punto.y - doorPivot.position.y,
        z: spessore / 2 + anta.position.z,
      };
      await montaManiglia(mio, sitioManiglia, manoDx);

      applyEssenza();
      doorDims = { w: size.x, h: size.y, floorY: -size.y / 2 };
      if (state.ambiente !== 'galleria') setAmbiente(state.ambiente);
      loaderEl.classList.add('is-hidden');
      refreshUI();
      window.__dbg = { scene, camera, model, size, center, renderer, doorPivot, toggleDoor, setModello,
        get apertura() { return { obiettivo: doorTargetAngle, aperta: doorOpenAngle }; },
        /* La corsa della scorrevole. Il bersaglio si posa SUBITO, il movimento
           no: serve per misurare la legge senza dipendere dai fotogrammi. */
        get corsa() {
          return { bersaglio: Math.round(doorTargetX), casa: Math.round(doorHomeX),
                   corsa: Math.round(doorCorsaX), adesso: Math.round(doorPivot ? doorPivot.position.x : 0),
                   bersaglioZ: Math.round(doorTargetZ), casaZ: Math.round(doorHomeZ),
                   corsaZ: Math.round(doorCorsaZ), adessoZ: Math.round(doorPivot ? doorPivot.position.z : 0) };
        },
        get movimento() { return movimento(); } };
    })
    .catch((err) => {
      if (mio !== numeroCarico) return;
      loaderEl.querySelector('p').textContent = 'Errore nel caricamento del modello';
      console.error(err);
    });
}

/**
 * Il coprifilo, in 3D e non solo a listino.
 *
 * Finora era una voce di prezzo con la sua fotina: tredici profili che il
 * cliente pagava senza poterli vedere montati. Adesso la sezione vera si tira
 * lungo il perimetro del vano, contro la parete.
 *
 * Due non hanno sezione tracciata: 'massello' e' lo stesso liscio del
 * listellare â€”cambia il legno, non la formaâ€” e prende quello; 'novecento' non
 * ce l'ha proprio e resta senza 3D, a listino come prima.
 */
const COPRI_3D = {
  listellare: 'listellare', massello: 'listellare', pierre: 'pierre',
  tintoretto: 'tintoretto', raffaello: 'raffaello', giotto: 'giotto',
  leonardo: 'leonardo', michelangelo: 'michelangelo', cartesio: 'cartesio',
  caravaggio: 'caravaggio', tiziano: 'tiziano', canaletto: 'canaletto',
};

async function montaCoprifilo(mio, conjunto, marco, datiTelaio) {
  const perfil = COPRI_3D[state.copri];
  if (!perfil) return;
  try {
    /* CON CAPITELLO, el coprifilo va SOLO AL ESPALDAR.
       El capitello remata el frente el solo —cornisa, parales y jambas— y
       debajo de el no cabe otra moldura: montar las dos daria dos remates
       superpuestos, que en una pared no existe. Por detras si hace falta,
       porque esa cara se queda sin nada. Lo pide el cliente al elegirlo. */
    /* Anche l'ESTERNO MURO vuole il coprifilo solo dietro: da questa parte
       l'anta scorre sulla parete e gli passerebbe sopra. In fabbrica infatti
       quella faccia si lascia liscia. */
    const conCapitello = state.capitello !== 'no' || movimento() === 'esterno';
    const g = await montarCoprifilo(perfil, undefined, vanoDe(datiTelaio),
      datiTelaio.muro, woodMat, 'assets/catalogo/coprifili',
      conCapitello ? { soloCara: 'espaldar' } : {});
    if (mio !== numeroCarico) return;
    if (g) marco.add(g);
  } catch (err) {
    console.warn(`coprifilo ${perfil} non montato`, err);
  }
}

/**
 * Il capitello, in 3D.
 *
 * Il 'Capitello 900 completo (colonne)' non e' una modanatura tirata lungo il
 * perimetro come il coprifilo: e' un PEZZO, con cornice, fregio, due colonne e
 * i loro plinti scanalati. Per questo arriva come GLB e non come sezione.
 *
 * Il modello nasce dallo script parametrico di Blender (capitello_con_parales)
 * e si e' rigenerato su misura: la sua LUCE e' 847 x 2021 e fuori misura
 * 1161 x 2198 x 119 mm.
 *
 * QUEL 2021 E' MISURATO, non copiato. La prima versione portava 2127, che e' il
 * vano delle porte dello scaparate; ma il vano della Siena qui misura 2027 dal
 * pavimento —lo dicono il muro e il coprifilo, che finiscono tutti e due li'— e
 * l'architrave restava cento millimetri piu' in alto del telaio: fra i due si
 * vedeva una striscia di parete. Adesso la luce nasce a 2021, sei millimetri
 * sotto il vano, cosi' il capitello MONTA sul telaio invece di sfiorarlo, che e'
 * quello che fa anche il coprifilo. Di lato fa lo stesso: luce 847 contro un
 * vano di 856, cioe' 4,5 mm per banda.
 *
 * UNITA': il GLB e' in metri e l'insieme del motore in millimetri, quindi va
 * moltiplicato per mille. Gli assi coincidono: X larghezza, Y altezza da terra,
 * Z profondita' verso chi guarda.
 *
 * Gli altri capitelli del listino restano solo prezzo, come stavano.
 */
const CAP_3D = { c900c: 'assets/capitelli/c900c.glb' };
const LUZ_CAPITELLO = { ancho: 847, alto: 2021 };
/* Quanto il capitello monta sul telaio, come il coprifilo. */
const SOLAPE_CAPITELLO = 6;
const cacheCapitello = new Map();

/**
 * Le geometrie del capitello, gia' in MILLIMETRI e con le coordinate di
 * texture attaccate. Si preparano una volta sola per file.
 *
 * Il GLB porta solo posizione e normale: senza UV il legno uscirebbe liscio,
 * una tinta piatta, perche' la texture si leggerebbe tutta nello stesso punto.
 * Gliele mette pegarVeta, LO STESSO del motore, e per una ragione: cosi' la
 * vena del capitello ha lo stesso passo di quella dell'anta. Due scale di vena
 * accanto si vedono subito, anche se il legno e' lo stesso.
 */
async function geometriasDelCapitello(url) {
  if (!cacheCapitello.has(url)) {
    cacheCapitello.set(url, gltfLoader.loadAsync(url).then((gltf) => {
      gltf.scene.updateMatrixWorld(true);
      const piezas = [];
      gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        const geo = o.geometry.clone();
        geo.applyMatrix4(o.matrixWorld);
        geo.scale(1000, 1000, 1000);          // il GLB va in metri, il motore in mm
        geo.computeBoundingBox();
        const t = geo.boundingBox.getSize(new THREE.Vector3());
        /* Come in tejer.js: la fibra corre per il LUNGO del pezzo. Le colonne
           la prendono in piedi; la cornice, il fregio e i plinti di traverso. */
        pegarVeta(geo, t.x > t.y);
        piezas.push(geo);
      });
      return piezas;
    }));
  }
  return cacheCapitello.get(url);
}

async function montaCapitello(mio, marco, datiTelaio) {
  const url = CAP_3D[state.capitello];
  if (!url) return;
  try {
    const piezas = await geometriasDelCapitello(url);
    if (mio !== numeroCarico) return;
    const vano = vanoDe(datiTelaio);
    const ancho = vano.dx - vano.sx;
    /* IL VANO SI MISURA, non si suppone: ogni modello ha il suo. L'architrave
       deve cadere sul telaio, quindi l'altezza si corregge di quel tanto che
       manca. Col vano di serie il fattore e' 1 e non si tocca niente; se una
       porta obbligasse a storcerlo piu' dell'otto per cento, si dice, perche'
       allora e' il capitello sbagliato e non un aggiustamento. */
    const k = (vano.su - SOLAPE_CAPITELLO) / LUZ_CAPITELLO.alto;
    if (Math.abs(k - 1) > 0.08) {
      console.warn(`capitello: il vano alto ${Math.round(vano.su)} obbliga a correggere l'altezza del ${Math.round((k - 1) * 100)} per cento`);
    }
    if (ancho > LUZ_CAPITELLO.ancho + 1) {
      console.warn(`capitello: il vano e' largo ${Math.round(ancho)} mm e la luce ne misura ${LUZ_CAPITELLO.ancho}`);
    }
    /* IL LEGNO E' QUELLO DELL'ANTA, non piu' l'avorio del modello.
       Si usa woodMat, lo stesso oggetto materiale della porta: cosi' il
       capitello segue l'essenza da solo —e anche il laccato— senza rimontare
       niente, perche' applyEssenza cambia quel materiale sul posto. */
    const g = new THREE.Group();
    for (const geo of piezas) {
      const m = new THREE.Mesh(geo, woodMat);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    }
    // Le geometrie sono gia' in millimetri: qui resta solo la correzione d'altezza.
    g.scale.set(1, k, 1);
    g.position.set((vano.sx + vano.dx) / 2, 0, datiTelaio.muro.z1);
    g.name = 'Capitello';
    marco.add(g);
  } catch (err) {
    console.warn(`capitello ${state.capitello} non montato`, err);
  }
}

/**
 * Dove va la maniglia.
 *
 * La regola e' quella dello scaparate, che e' quella di fabbrica: il canto
 * della rosetta a RETRANQUEO dal bordo del VANO, e l'altezza a 1040 mm dal
 * pavimento. Non si inventa niente qui: si copia da li', perche' li' era
 * giusta.
 *
 * Avevo provato a centrarla sulla mezzeria del montante, che sembra piu'
 * furbo — la porta te lo dice, invece di un numero fisso. Ma non e' la stessa
 * cosa e si vedeva: misurato sulla Siena, la mia cadeva a 115 mm dal bordo
 * dell'anta dove lo scaparate la mette a 89. Ventisei millimetri troppo
 * dentro, che su una maniglia si notano subito.
 *
 * Il montante resta come CONTROLLO: se la rosetta non cadesse sopra di lui
 * qualcosa non torna, e vale la pena saperlo invece di disegnarla in aria.
 */
/* Altezza della maniglia, dal pavimento.
   1040 e' la quota di fabbrica e nello scaparate va bene, ma li' l'anta viene
   STIRATA fino a riempire il vano e arriva a 2121 mm; qui il vano si adatta
   all'anta tracciata, che ne misura 2018. Gli stessi 1040 assoluti cadono al
   51,5 % dell'anta invece che al 48,9 %, cioe' sopra la meta', e si vede alta.
   990 riporta la maniglia dove sta nello scaparate — 49 % — restando una quota
   verosimile per una porta di questa altezza.
   Se la si vuole piu' su o piu' giu', e' questo numero e basta. */
const ALTO_MANIGLIA = 950;
/* IL RITIRO SI MISURA DAL CANTO DELL'ANTA, non dal bordo del vano.
   Prima era 25 mm presi dal VANO, e il vano non e' l'anta: e' piu' largo di
   una holgura per banda, e per giunta il montante del telaio ricopre l'anta
   di una ventina di millimetri con la battuta. Misurato sulla Siena, la
   rosetta finiva a 16 mm dal canto dell'anta e arrivava a x=403 dove il
   montante comincia a 400: la maniglia TOCCAVA il telaio.
   Ottantanove e' la quota dello scaparate — quella che il commento qui sopra
   da' gia' per buona — e presa dal canto dell'anta lascia la rosetta ben
   dentro il suo montante, lontana dalla battuta. */
const RITIRO_MANIGLIA = 89;      // dal canto dell'anta al canto della rosetta
/* E un filo piu' dentro. Il centro del montante e' il posto giusto —li' c'e'
   legno da mordere— ma guardata in faccia la maniglia restava un paio di
   millimetri troppo vicina al canto. Due millimetri: sembra niente e si vede,
   perche' l'occhio misura la maniglia contro il bordo dell'anta e non contro
   il montante.
   Va VERSO LE CERNIERE, non verso sinistra: su una porta destra la sposta a
   sinistra e su una sinistra a destra, che e' come deve essere quando la
   quota si prende dal canto che chiude. */
const AJUSTE_MANIGLIA = 2;
/* Quanto misurano tutte le maniglie della serie, dalle schede Mariva. I GLB del
   catalogo non rispettano l'unita' di glTF, quindi si normalizza su questo.

   Erano 135, la quota di scheda. A schermo pero' sembravano grosse, e il
   motivo si vede misurando: normalizzando il lato piu' lungo a 135, la
   maniglia sporge 70 mm dall'anta, dove una maniglia da interno sta sui
   55-60. Il GLB e' piu' tozzo del pezzo vero, e quel di piu' si vede tutto
   nello sporgere, che e' proprio cio' che l'occhio legge come ingombro.

   A 120 lo sporgere torna a 62 e la maniglia si legge giusta sul montante —
   1,26 volte la sua larghezza invece di 1,42. Si perde qualcosa sulla quota
   di scheda: e' una scelta di resa, non un errore di misura, e sta tutta in
   questo numero se un domani si vuole tornare al vero. */
const LARGO_MANIGLIA = 120;

function puntoDellaManiglia(pezzi, manoDx, cajaHoja, montante) {
  /* IN MEZZO AL MONTANTE, e non a tot millimetri dal canto.
     ------------------------------------------------------------
     Misurato sulla Siena: l'anta va da -419,7 a +419,7 e il montante di
     chiusura da 324,7 a 419,7 — novantacinque millimetri. Il suo centro
     cade a 47,5 dal canto.

     I 25 mm presi dal vano mettevano la rosetta a 16 dal canto: mezza sotto
     la battuta del telaio, e infatti lo toccava. Gli 89 che ho provato dopo
     la mandavano a 89, cioe' OLTRE il montante, in mezzo al pannello — dove
     una maniglia non si avvita, perche' li' sotto non c'e' legno da mordere.

     Il montante e' il posto giusto e si misura sulla maglia, cosi' vale per
     qualunque modello invece che per quello su cui e' stato tarato il
     numero. Il ritiro dal canto resta solo come rete se il montante non si
     trovasse. */
  const centro = montante
    ? (montante.min.x + montante.max.x) / 2
    : (manoDx ? cajaHoja.max.x - RITIRO_MANIGLIA : cajaHoja.min.x + RITIRO_MANIGLIA);
  // La bocchetta della serratura pende dallo stesso punto, quindi segue da sola.
  const x = centro + (manoDx ? -AJUSTE_MANIGLIA : AJUSTE_MANIGLIA);

  const cajas = pezzi.map((p) => ({ p, c: cajaDe(p) }));
  const hoja = cajas.reduce(
    (b, { c }) => [Math.min(b[0], c[0]), Math.min(b[1], c[1]), Math.max(b[2], c[2]), Math.max(b[3], c[3])],
    [Infinity, Infinity, -Infinity, -Infinity],
  );
  const y = hoja[1] + ALTO_MANIGLIA;
  const sobreMontante = cajas.some(({ p, c }) => p.papel === 'montante' && y >= c[1] && y <= c[3]);

  return { x, y: ALTO_MANIGLIA, sobreMontante };
}

/**
 * Il centro della rosetta: e' cio' che APPOGGIA sulla porta.
 *
 * Due tentativi buttati prima di arrivarci, e vale la pena scriverli.
 * Il primo cercava il punto piu' ALTO della maglia, pensando che il massimo
 * cadesse in mezzo al disco: dal capo distava 14,1 mm sulla Square, 19,7
 * sulla Simona, 42,2 sulla Ariana, 2,8 sulla Spigola — quattro modelli,
 * quattro posti. Il secondo prendeva il capo e ci toglieva quei 14 della
 * Square per tutte: le maniglie cadevano si' tutte uguali, ma la rosetta
 * finiva sette millimetri fuori dall'asse, e sotto la bocchetta si vedeva
 * storta.
 *
 * Quello che non cambia da un modello all'altro e' cosa TOCCA la porta: la
 * rosetta appoggia, la leva sta per aria. Prendendo i vertici a filo del
 * piano d'appoggio esce una impronta di 41,5-43,1 mm su tutt'e quattro, col
 * centro a 20,7-21,6 dal capo. Meno di un millimetro di differenza fra
 * modelli, ed e' una misura che significa qualcosa invece di un numero
 * pescato su una maniglia sola.
 */
function centroDellaRosetta(geo) {
  geo.computeBoundingBox();
  const b = geo.boundingBox;
  const pos = geo.attributes.position;
  const soglia = b.min.z + 2;           // due millimetri di tolleranza sul contatto
  let giu = Infinity;
  let su = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getZ(i) > soglia) continue;
    const x = pos.getX(i);
    if (x < giu) giu = x;
    if (x > su) su = x;
  }
  if (!Number.isFinite(giu)) return (b.min.x + b.max.x) / 2;   // rete, non dovrebbe servire
  return (giu + su) / 2;
}

/* ============================================================
   LA BOCCHETTA — la serratura sotto la maniglia
   ------------------------------------------------------------
   Non e' un GLB: e' disegnata qui. Le maniglie del catalogo sono dodici e
   tutte diverse, ma la serratura e' UNA SOLA per tutte — cosi' l'ha chiesta
   la fabbrica, e cosi' non serve un modello nuovo ogni volta che entra una
   maniglia in listino.

   Prende handleMat, lo stesso materiale della maniglia: cambiando finitura
   —ottone, nero, cromo— la seguono tutt'e due insieme, che e' come si vende
   una porta. Un ottone con la bocchetta cromata non lo vuole nessuno.

   L'INTERASSE e' la quota che conta: 85 mm fra il centro del quadro della
   maniglia e il centro del foro della chiave. E' quella della serratura
   patent, la piu' comune su una porta interna.
   ============================================================ */
const INTERASSE = 85;            // dal centro della maniglia al foro della chiave
const RAGGIO_BOCCHETTA = 16;     // piccola: la rosetta della maniglia ne misura 21,5
const SPESSORE_BOCCHETTA = 3;

/* Il buco della chiave in UN SOLO contorno, non due sovrapposti.
   Un tondo e una fessura messi come due fori separati si toccano, e dove si
   toccano l'estrusione fa capriole. Si tracciano insieme: si sale per il
   fianco della fessura fino a dove incontra il tondo, si gira sopra la testa
   del tondo, e si riscende dall'altro fianco. */
function contornoDellaChiave() {
  const rTondo = 3.4;            // il foro dove entra la canna
  const yTondo = 3.5;
  const mezzaFessuraSu = 1.8;    // la fessura sotto, che si allarga scendendo
  const mezzaFessuraGiu = 2.9;
  const yFessura = -7;

  // dove il fianco della fessura incontra il tondo
  const dy = Math.sqrt(rTondo * rTondo - mezzaFessuraSu * mezzaFessuraSu);
  const yIncontro = yTondo - dy;
  const aSinistra = Math.atan2(-dy, -mezzaFessuraSu);
  const aDestra = Math.atan2(-dy, mezzaFessuraSu);

  const p = new THREE.Path();
  p.moveTo(-mezzaFessuraGiu, yFessura);
  p.lineTo(-mezzaFessuraSu, yIncontro);
  p.absarc(0, yTondo, rTondo, aSinistra, aDestra, true);   // sopra la testa
  p.lineTo(mezzaFessuraGiu, yFessura);
  p.closePath();
  return p;
}

let geoBocchetta = null;
function geometriaBocchetta() {
  if (geoBocchetta) return geoBocchetta;
  const piastra = new THREE.Shape();
  piastra.absarc(0, 0, RAGGIO_BOCCHETTA, 0, Math.PI * 2, false);
  piastra.holes.push(contornoDellaChiave());
  /* Lo smusso e' generoso di proposito. Un disco PIATTO e tutto metallo fa
     da specchio all'ambiente, che qui e' chiaro, e sparisce sul legno: la
     prima prova sembrava di pino come la porta. Con un bordo smussato largo
     il rim prende la luce di taglio e si legge subito che e' ferramenta.
     Le normali le fa gia' l'estrusione: ricalcolarle non serve. */
  geoBocchetta = new THREE.ExtrudeGeometry(piastra, {
    depth: SPESSORE_BOCCHETTA,
    bevelEnabled: true,
    bevelThickness: 0.9,
    bevelSize: 1.3,
    bevelSegments: 3,
    curveSegments: 48,
  });
  return geoBocchetta;
}

/* Dietro al buco ci vuole il buio. Senza, dal foro si vede il legno
   dell'anta e non sembra un buco: sembra un disegno. */
const buioMat = new THREE.MeshStandardMaterial({ color: 0x120f0c, roughness: 0.95, metalness: 0 });
let geoBuio = null;

let serraturaMesh = null;

function montaSerratura(sitio) {
  if (serraturaMesh) { disposeSubtree(serraturaMesh); serraturaMesh.parent?.remove(serraturaMesh); serraturaMesh = null; }
  if (!doorPivot || !sitio) return;

  if (!geoBuio) geoBuio = new THREE.CircleGeometry(RAGGIO_BOCCHETTA - 1, 40);

  const gruppo = new THREE.Group();
  gruppo.name = 'Serratura';

  const piastra = new THREE.Mesh(geometriaBocchetta(), handleMat);
  piastra.name = 'Bocchetta';
  piastra.castShadow = piastra.receiveShadow = true;
  gruppo.add(piastra);

  const buio = new THREE.Mesh(geoBuio, buioMat);
  buio.position.z = 0.4;         // dentro allo spessore, si vede solo dal foro
  gruppo.add(buio);

  /* Sotto la maniglia e sulla stessa verticale: la bocchetta e il quadro
     stanno sull'asse del montante, sempre. */
  gruppo.position.set(sitio.x, sitio.y - INTERASSE, sitio.z);
  doorPivot.add(gruppo);
  serraturaMesh = gruppo;
}

/* La maniglia e' un modello a parte, e adesso si VEDE quella scelta: prima il
   GLB ne portava una fissa e il menu cambiava solo il prezzo. */
const cacheManiglia = new Map();
let manigliaMesh = null;
let sitioManiglia = null;   // dove va, in millimetri e in coordinate d'anta

async function montaManiglia(mio, sitio, manoDx) {
  if (manigliaMesh) { disposeSubtree(manigliaMesh); manigliaMesh.parent?.remove(manigliaMesh); manigliaMesh = null; }
  const mod = state.manigliaMod;
  /* La serratura segue la maniglia: senza maniglia non si mette nemmeno lei,
     che una bocchetta sola su una porta liscia non l'ha mai vista nessuno. */
  if (!mod || mod === 'no' || !doorPivot || !sitio) { montaSerratura(null); return; }

  const url = `assets/maniglie/${mod}.glb`;
  try {
    if (!cacheManiglia.has(mod)) {
      const gltf = await gltfLoader.loadAsync(url);
      gltf.scene.updateMatrixWorld(true);
      let geo = null;
      gltf.scene.traverse((o) => { if (!geo && o.isMesh) { geo = o.geometry.clone(); geo.applyMatrix4(o.matrixWorld); } });
      if (!geo) return;
      /* IN MILLIMETRI, come tutto quello che sta dentro l'insieme.
         Era normalizzata a 0,135 —metri— da quando l'anta stava sciolta in
         scena. Adesso pende dal perno, che vive in millimetri dentro un gruppo
         scalato per mille: la maniglia usciva di 0,1 mm, cioe' invisibile.
         Il valore e' 135 perche' e' quanto misurano tutte le maniglie della
         serie secondo le schede Mariva; i GLB del catalogo non rispettano
         l'unita' di glTF, quindi si normalizza sul lato piu' lungo. */
      geo.computeBoundingBox();
      const c = geo.boundingBox.getSize(new THREE.Vector3());
      geo.scale(...new Array(3).fill(LARGO_MANIGLIA / Math.max(c.x, c.y, c.z)));
      geo.computeVertexNormals();
      geo.center();
      cacheManiglia.set(mod, geo);
    }
    if (mio !== numeroCarico) return;
    const geo = cacheManiglia.get(mod);
    geo.computeBoundingBox();
    const g = geo.boundingBox;

    /* Il modello porta la rosetta a un capo e la leva verso l'altro. Per la
       mano destra va specchiato, o la leva punta al bordo invece che dentro
       l'anta. */
    const espejo = manoDx;
    const clave = `${mod}${espejo ? '-esp' : ''}`;
    if (!cacheManiglia.has(clave)) {
      let g2 = geo;
      if (espejo) {
        g2 = geo.clone();
        g2.scale(-1, 1, 1);
        const idx = g2.getIndex();
        if (idx) { const a = idx.array; for (let i = 0; i < a.length; i += 3) { const t = a[i]; a[i] = a[i + 2]; a[i + 2] = t; } idx.needsUpdate = true; }
        g2.computeVertexNormals();
        g2.computeBoundingBox();
      }
      cacheManiglia.set(clave, g2);
    }
    const usada = cacheManiglia.get(clave);
    usada.computeBoundingBox();
    const b = usada.boundingBox;

    manigliaMesh = new THREE.Mesh(usada, handleMat);
    manigliaMesh.name = 'Maniglia';
    manigliaMesh.castShadow = manigliaMesh.receiveShadow = true;
    /* Il centro della rosetta sull'asse del montante, che e' sitio.x — lo
       stesso punto dove va la bocchetta. Cosi' le due stanno per forza sulla
       stessa verticale: non si allineano a mano, si allineano perche' hanno
       lo stesso riferimento. Lo specchio della mano destra non conta, il
       centro dell'impronta si misura sulla maglia gia' specchiata. */
    manigliaMesh.position.set(
      sitio.x - centroDellaRosetta(usada), sitio.y, sitio.z - b.min.z);
    doorPivot.add(manigliaMesh);
    montaSerratura(sitio);
  } catch (err) {
    console.warn(`maniglia ${mod} non caricata`, err);
  }
}

/** Rifa' solo la maniglia, senza ricostruire la porta. */
function rimontaManiglia() {
  if (!sitioManiglia || !doorPivot) return;
  montaManiglia(numeroCarico, sitioManiglia, state.mano !== 'sx');
}

/* ============================================================
   AMBIENTI — scenografie 3D opzionali attorno alla porta.
   'galleria' = vista pulita (nessuna scena).
   ============================================================ */

const ambienti = {};   // nome -> THREE.Group (costruiti pigramente)
let doorDims = null;   // { w, h, floorY } noto dopo il caricamento del GLB

// faccia frontale del muro appena dietro il filo della porta
const WALL_FACE = 0.03;

const mat = (color, roughness = 0.9) => new THREE.MeshStandardMaterial({ color, roughness });

function box(group, w, h, d, material, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = m.receiveShadow = true;
  group.add(m);
  return m;
}

// parete con il vano della porta (leggermente più piccolo del marco)
function makeWall(group, color) {
  const W = 7.5, H = 3.2, D = 0.14;
  const { w: dw, h: dh, floorY } = doorDims;
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2, 0);
  shape.lineTo(W / 2, 0);
  shape.lineTo(W / 2, H);
  shape.lineTo(-W / 2, H);
  shape.closePath();
  const hole = new THREE.Path();
  const ow = dw - 0.015, oh = dh - 0.008;
  hole.moveTo(-ow / 2, 0);
  hole.lineTo(ow / 2, 0);
  hole.lineTo(ow / 2, oh);
  hole.lineTo(-ow / 2, oh);
  hole.closePath();
  shape.holes.push(hole);
  const wall = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false }),
    mat(color, 0.95)
  );
  wall.position.set(0, floorY, WALL_FACE - D);
  wall.receiveShadow = true;
  group.add(wall);
}

function makeFloor(group, material) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(8, 7), material);
  f.rotation.x = -Math.PI / 2;
  f.position.set(0, doorDims.floorY - 0.006, 1.4);
  f.receiveShadow = true;
  group.add(f);
}

function makeZoccolino(group, color) {
  const { w: dw, floorY } = doorDims;
  const ow = dw - 0.015;
  const len = (7.5 - ow) / 2;
  const m = mat(color, 0.8);
  const z = WALL_FACE + 0.0125;
  box(group, len, 0.09, 0.025, m, -(ow / 2 + len / 2), floorY + 0.045, z);
  box(group, len, 0.09, 0.025, m, ow / 2 + len / 2, floorY + 0.045, z);
}

// pavimento in legno riusando l'albedo del pino con tinta
let floorTex = null;
function woodFloorMat(tint) {
  if (!floorTex) {
    floorTex = texLoader.load('assets/textures/pino-pbr/basecolor.jpg');
    floorTex.colorSpace = THREE.SRGBColorSpace;
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(3, 2.6);
    floorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  return new THREE.MeshStandardMaterial({ map: floorTex, color: tint, roughness: 0.65 });
}

function buildIngresso() {
  const g = new THREE.Group();
  const { floorY } = doorDims;
  makeWall(g, 0xd3c3a3);
  makeFloor(g, mat(0xa9a08c, 0.95));
  makeZoccolino(g, 0x8f8168);
  for (const sx of [-1, 1]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.34, 24), mat(0x8a4f34, 0.85));
    pot.position.set(sx * 0.95, floorY + 0.17, 0.34);
    pot.castShadow = pot.receiveShadow = true;
    g.add(pot);
    const cip = new THREE.Mesh(new THREE.ConeGeometry(0.17, 1.05, 14), mat(0x36503a, 0.95));
    cip.position.set(sx * 0.95, floorY + 0.86, 0.34);
    cip.castShadow = true;
    g.add(cip);
    box(g, 0.09, 0.2, 0.09, mat(0x241c14, 0.6), sx * 0.62, floorY + 2.12, WALL_FACE + 0.045);
    const pl = new THREE.PointLight(0xffd9a8, 2.5, 4, 2);
    pl.position.set(sx * 0.62, floorY + 2.0, 0.4);
    g.add(pl);
  }
  box(g, 0.85, 0.015, 0.5, mat(0x4a3c30, 1), 0, floorY + 0.008, 0.45);
  return g;
}

function buildSoggiorno() {
  const g = new THREE.Group();
  const { floorY } = doorDims;
  makeWall(g, 0xe6ddcb);
  makeFloor(g, woodFloorMat(0xcfa87f));
  makeZoccolino(g, 0xf0e9da);
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.012, 48), mat(0xa96f4d, 1));
  rug.position.set(-0.2, floorY + 0.004, 1.35);
  rug.receiveShadow = true;
  g.add(rug);
  box(g, 1.15, 0.52, 0.34, mat(0x3a2d22, 0.6), 1.65, floorY + 0.26, 0.26);
  box(g, 0.34, 0.44, 0.025, mat(0x241c14, 0.7), 1.45, floorY + 1.55, WALL_FACE + 0.015);
  box(g, 0.28, 0.36, 0.025, mat(0x241c14, 0.7), 1.92, floorY + 1.48, WALL_FACE + 0.015);
  const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.35, 12), mat(0x241c14, 0.5));
  palo.position.set(-1.7, floorY + 0.675, 0.55);
  palo.castShadow = true;
  g.add(palo);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.24, 24, 1, true), mat(0xe8dcc0, 0.9));
  shade.material.side = THREE.DoubleSide;
  shade.position.set(-1.7, floorY + 1.43, 0.55);
  g.add(shade);
  const pl = new THREE.PointLight(0xffe2b0, 2.2, 4.5, 2);
  pl.position.set(-1.7, floorY + 1.3, 0.55);
  g.add(pl);
  return g;
}

function buildStudio() {
  const g = new THREE.Group();
  const { floorY } = doorDims;
  makeWall(g, 0x46523f);
  makeFloor(g, woodFloorMat(0x9a7350));
  makeZoccolino(g, 0x2f3a2c);
  const legno = mat(0x4a3626, 0.55);
  const desk = new THREE.Group();
  box(desk, 1.1, 0.045, 0.52, legno, 0, 0.74, 0);
  for (const [lx, lz] of [[-0.51, -0.22], [0.51, -0.22], [-0.51, 0.22], [0.51, 0.22]])
    box(desk, 0.04, 0.72, 0.04, legno, lx, 0.36, lz);
  box(desk, 0.22, 0.055, 0.16, mat(0x7a3b2e, 0.8), -0.25, 0.79, -0.05);
  box(desk, 0.2, 0.045, 0.14, mat(0x2e3d4a, 0.8), -0.24, 0.84, -0.04, 0.15);
  desk.position.set(1.6, floorY, 0.65);
  desk.rotation.y = -0.14;
  g.add(desk);
  for (const [my, n, off] of [[1.35, 6, 0], [1.72, 4, 0.1]]) {
    box(g, 0.85, 0.035, 0.2, mat(0x3a2d22, 0.6), -1.5, floorY + my, 0.17);
    for (let i = 0; i < n; i++)
      box(g, 0.035, 0.16 + (i % 3) * 0.03, 0.14,
        mat([0x6e4a3a, 0x44554e, 0xb3a284, 0x2b2b33][i % 4], 0.85),
        -1.86 + off + i * 0.09, floorY + my + 0.11, 0.16);
  }
  const pl = new THREE.PointLight(0xffe6c0, 2, 4, 2);
  pl.position.set(1.45, floorY + 1.5, 0.95);
  g.add(pl);
  return g;
}

const BUILDERS = { ingresso: buildIngresso, soggiorno: buildSoggiorno, studio: buildStudio };

function setAmbiente(nome) {
  state.ambiente = nome;
  if (doorDims && nome !== 'galleria' && !ambienti[nome]) {
    ambienti[nome] = BUILDERS[nome]();
    scene.add(ambienti[nome]);
  }
  for (const [k, grp] of Object.entries(ambienti)) grp.visible = (k === nome);
  const room = nome !== 'galleria';
  controls.autoRotate = !room && !userMoved;
  controls.minAzimuthAngle = room ? -0.9 : -Infinity;
  controls.maxAzimuthAngle = room ? 0.9 : Infinity;
  controls.maxPolarAngle = Math.PI * (room ? 0.5 : 0.55);
  document.querySelectorAll('[data-ambiente]').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.ambiente === nome));
}

/* ============================================================
   RENDER LOOP
   ============================================================ */

function resize() {
  const w = viewerEl.clientWidth, h = viewerEl.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  if (composer) composer.setSize(w, h);
  if (gtaoPass) gtaoPass.setSize(w, h);
  chiediFotogramma(30);
}
window.addEventListener('resize', resize);

/* ============================================================
   SI DISEGNA A RICHIESTA
   ------------------------------------------------------------
   Con la porta ferma il visore ridisegnava lo stesso fotogramma
   sessanta volte al secondo: occlusione, ombra e multisampling
   pagati interi per non cambiare un pixel. Sul portatile e' la
   ventola che parte e, quando la GPU si scalda, il giro della
   porta che comincia a scattare.

   Il contatore dice quanti fotogrammi restano da disegnare. Chi
   cambia qualcosa ne chiede un po'; finiti, il visore si ferma.

   Il rischio di questo schema e' l'opposto della lentezza: una
   modifica che nessuno annuncia e uno schermo che resta indietro.
   Per questo le richieste sono larghe e da piu' parti — l'orbita,
   qualunque tocco sulla pagina, e il caricamento di texture e GLB
   che arriva quando vuole lui. Meglio qualche fotogramma di troppo
   che una porta che non si aggiorna.
   ============================================================ */

let fotogrammiDaFare = 60;
const chiediFotogramma = (n = 3) => { fotogrammiDaFare = Math.max(fotogrammiDaFare, n); };

// L'orbita: copre trascinamento, inerzia dello smorzamento e giro automatico.
controls.addEventListener('change', () => chiediFotogramma(3));

/* Qualunque interazione con la pagina. In cattura, cosi' arriva anche se chi
   ascolta piu' sotto ferma la propagazione. Un secondo e mezzo di fotogrammi
   copre pure il lavoro asincrono che parte da quel clic. */
for (const ev of ['pointerdown', 'pointerup', 'click', 'change', 'input', 'keydown', 'wheel']) {
  document.addEventListener(ev, () => chiediFotogramma(90), true);
}

/* Texture e modelli finiscono di caricare per conto loro, senza che nessuno
   abbia toccato niente: senza questo, la porta nuova arriverebbe a schermo
   solo al primo movimento del mouse. */
THREE.DefaultLoadingManager.onStart = () => chiediFotogramma(120);
THREE.DefaultLoadingManager.onProgress = () => chiediFotogramma(120);
THREE.DefaultLoadingManager.onLoad = () => chiediFotogramma(120);

renderer.setAnimationLoop(() => {
  controls.update();

  if (doorPivot) {
    const resta = doorTargetAngle - doorPivot.rotation.y;
    if (Math.abs(resta) > 1e-4) {
      doorPivot.rotation.y += resta * MORBIDEZZA;
      chiediFotogramma(2);
    } else {
      doorPivot.rotation.y = doorTargetAngle;   // si posa esatto, non a un capello
    }
    /* E la corsa, per le scorrevoli. Stessa morbidezza del giro, cosi' le due
       aperture si muovono con la stessa mano.
       La SOGLIA pero' non puo' essere la stessa: il giro va in radianti e 1e-4
       e' mezzo centesimo di grado, ma la corsa va in MILLIMETRI e 1e-4 sarebbe
       un decimillesimo di millimetro. Con quella soglia l'anta passava
       centinaia di fotogrammi a strisciare sull'ultimo decimo, chiedendo di
       ridisegnare per un movimento che nessuno vede. Mezzo millimetro e' sotto
       il pixel a qualunque zoom: li' si posa e si ferma. */
    const restaX = doorTargetX - doorPivot.position.x;
    if (Math.abs(restaX) > 0.5) {
      doorPivot.position.x += restaX * MORBIDEZZA;
      chiediFotogramma(2);
    } else {
      doorPivot.position.x = doorTargetX;
    }
    /* E L'ARRETRAMENTO del rototraslante: stessa legge della corsa e stessa
       soglia di mezzo millimetro. Girando e arretrando INSIEME, l'anta
       descrive l'arco ribassato del sistema vero invece del cerchio pieno di
       una battente — ed e' li' che sta la meta' di ingombro risparmiata. */
    const restaZ = doorTargetZ - doorPivot.position.z;
    if (Math.abs(restaZ) > 0.5) {
      doorPivot.position.z += restaZ * MORBIDEZZA;
      chiediFotogramma(2);
    } else {
      doorPivot.position.z = doorTargetZ;
    }
    /* LA LEGGE DEL MECCANISMO, che non e' una retta.
       Le due corse qui sopra sono lineari: a meta' giro, meta' corsa. Il
       manuale Celegon dice un'altra cosa, e si vede nel piano quotato del
       braccetto BASE (S40): a 45 gradi il canto e' gia' uscito di 277 mm sui
       392 finali, non di 196. La ragione e' che l'anta non e' appesa a un
       perno: la tengono un braccetto che gira in arco e un carrello che corre
       dritto nel binario, e da quei due vincoli esce un seno, non una retta.
         canto(psi) = QF · sen(psi)
       Confronto con le quote del manuale: 15 gradi 101,5 · 30 gradi 196,0 ·
       45 gradi 277,2 · 60 gradi 339,5 · 75 gradi 378,6 · 90 gradi 392.
       Il giro resta quello morbido di prima; la posizione la si LEGGE
       dall'angolo, cosi' le due non possono sfasarsi mai. Agli estremi le due
       leggi coincidono —sen(0)=0 e sen(90)=1— quindi i bersagli restano buoni
       e l'anta si posa dove si posava. */
    if (rototrasla()) {
      const s = Math.sin(Math.abs(doorPivot.rotation.y));
      doorPivot.position.x = doorHomeX + doorCorsaX * s;
      doorPivot.position.z = doorHomeZ + doorCorsaZ * s;
    }
  }

  if (fotogrammiDaFare <= 0) return;
  fotogrammiDaFare--;

  if (composer) composer.render();
  else renderer.render(scene, camera);
});

/* Cambio di qualita' a caldo, senza ricaricare: chi sta configurando una
   porta non deve perderla per aver scelto un'altra finezza. */
function applicaQualita(nome) {
  if (!PROFILI[nome]) return;
  QUALITA = nome;
  try { localStorage.setItem('tc-qualita', nome); } catch { /* pazienza */ }

  const p = profilo();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, p.pixelRatio));

  // L'ombra si rifa' da sola al primo giro: basta buttare la mappa vecchia.
  key.shadow.mapSize.set(p.ombra, p.ombra);
  if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; }
  /* Anche quella di dietro, che e' una chiave come l'altra: dimenticarla qui
     la lascerebbe con la mappa della qualita' precedente. */
  keyDietro.shadow.mapSize.set(p.ombra, p.ombra);
  if (keyDietro.shadow.map) { keyDietro.shadow.map.dispose(); keyDietro.shadow.map = null; }

  /* Il composer si rimonta da zero. Il multisampling sta nel render target e
     il target non si cambia a caldo: si getta e se ne fa un altro. */
  gtaoPass?.dispose?.();
  composer?.dispose?.();
  composer = null;
  gtaoPass = null;
  montaOcclusione();

  resize();
  chiediFotogramma(60);

  document.querySelectorAll('[data-qualita]').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.qualita === nome));
}

document.getElementById('qualita')?.addEventListener('click', (e) => {
  const b = e.target.closest('[data-qualita]');
  if (b) applicaQualita(b.dataset.qualita);
});

// All'avvio il profilo e' gia' montato: qui si segna solo il bottone giusto.
document.querySelectorAll('[data-qualita]').forEach((b) =>
  b.classList.toggle('is-active', b.dataset.qualita === QUALITA));

// click sulla porta → apri/chiudi (senza interferire con l'orbita)
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt || !doorPivot) return;
  const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  downAt = null;
  if (moved > 6) return;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (raycaster.intersectObjects(leafParts, true).length) toggleDoor();
});
doorBtn.addEventListener('click', toggleDoor);

/* ============================================================
   UI — prezzi e interazioni
   ============================================================ */

const totalEl = document.getElementById('totalValue');
const summaryLabelEl = document.getElementById('summaryLabel');
const summaryConfigEl = document.getElementById('summaryConfig');
const pillNoteEl = document.getElementById('pillNote');
const panelTitleEl = document.getElementById('panelTitle');
const panelSubEl = document.getElementById('panelSub');
const captionModelEl = document.getElementById('captionModel');
const captionLineEl = document.getElementById('captionLine');

function currentPrices() {
  return MODELLI[state.modello].listino[state.essenza][state.finitura];
}

/* Motore del preventivo: porta completa a listino → scaglioni fuori
   misura → 2 ante → extra. Ritorna le righe pronte per UI e PDF. */
// Spegne gli extra che la scelta corrente non ammette più. Deve girare PRIMA
// del calcolo: se lo si fa dopo, il totale resta indietro di un clic.
function coerenza() {
  if (!VUOLE_CILINDRO.has(state.serratura)) state.cilindro = 'no';
  if (state.serratura !== 'magnetica') state.oroSerr = false;
  if (state.cerniere !== 'scomparsa') state.oroCern = false;
  if (!TELAIO_FORMA[state.forma]) state.telaioForma = false;
}

function computePreventivo() {
  coerenza();
  const prices = currentPrices();
  const baseTariffa = Object.values(prices).reduce((s, v) => s + (v || 0), 0);
  const band = sizeBand(state.w, state.h);
  const righe = [];
  let suPreventivo = !band.ok;
  let motivo = suPreventivo ? 'misura oltre 1200×2600 — fuori listino' : '';

  let base = Math.round(baseTariffa * band.factor * 100) / 100;
  if (state.ante === 2) base = Math.round(base * 2 * 100) / 100;
  let baseNote = band.note.slice();
  if (state.ante === 2) baseNote.push('2 ante +100%');
  righe.push({ k: 'Porta completa a listino', sub: baseNote.join(' · '), v: base });

  if (laccatoExtra()) righe.push({ k: `Colore RAL — ${LACCATI[state.colore].label}`, sub: 'listino n. 50', v: laccatoExtra() });

  const tel = TELAI.find((t) => t.id === state.telaio);
  const fermaporta = state.telaio === 'alpha_comp_sp' ? FERMAPORTA : 0;
  if (tel.extra) righe.push({ k: `Telaio ${tel.label}`, sub: fermaporta ? 'fermaporta a pavimento obbligatorio compreso' : '', v: tel.extra + fermaporta });

  const all = allargatoExtra(state.muro, state.allargato);
  if (all.extra) righe.push({ k: 'Allargato telaio', sub: all.label, v: all.extra });

  const cop = COPRI.find((c) => c.id === state.copri);
  const fml = mlFactor(state.w, state.h);
  const mis = misuraAttiva(cop);
  const metri = 11.5 * fml;
  // il pacchetto di listino si scala sui ml; le altre misure sono già a ml
  const copBase = extraMisura(cop, mis, state.copriWood, metri);
  const copExtra = Math.round((mis.pack && !mis.cad ? copBase * fml : copBase) * 100) / 100;
  // il nome porta già la misura di listino fra parentesi: la si toglie quando
  // se ne mostra una scelta a parte, per non leggere "(90/70) 90 / 90"
  const copNome = misureDi(cop.id).length > 1
    ? cop.label.replace(/\s*\(.*?\)/, '') : cop.label;
  if (copExtra) righe.push({
    k: `Coprifili ${copNome} ${mis.label} · ${COPRI_WOOD_LABEL[state.copriWood]}`,
    sub: mis.pack
      ? (fml > 1 ? `${ml1(metri)} ml (extra a porta ${eur.format(cop.prezzi[state.copriWood])} fino a 11,5 ml)` : '')
      : `${ml1(metri)} ml a listino, meno il listellare 22×70 compreso (${eur.format(COPRI_INCLUSO_CAD)})`,
    v: copExtra,
  });

  const ape = APERTURE.find((a) => a.id === state.apertura);
  /* IL KIT MAGIC NON SI PUO' VENDERE SOPRA GLI 800 di luce muro: lo dice la
     voce 34 del listino. Prima il configuratore avvisava e lo addebitava lo
     stesso, cioe' metteva in preventivo un pezzo che la fabbrica non puo'
     fornire. Si segna a zero e si scrive perche'. */
  const magicFuoriMisura = state.apertura === 'magic' && state.w > 800;
  if (ape.extra) {
    righe.push({
      k: `Apertura ${ape.label}`,
      sub: magicFuoriMisura ? `non applicabile: luce ${state.w} mm, il kit arriva a 800` : '',
      v: magicFuoriMisura ? 0 : ape.extra,
    });
  }

  const forma = FORME.find((f) => f.id === state.forma);
  const telForma = TELAIO_FORMA[forma.id];
  if (forma.extra) righe.push({
    k: `Porta ${forma.label}`,
    sub: telForma ? 'solo l’anta: il telaio di passaggio è la voce sotto' : '',
    v: forma.extra });
  if (telForma && state.telaioForma)
    righe.push({ k: `Telaio di passaggio ${forma.label}`, sub: 'voci 41/43/45', v: telForma });
  // il taglio obliquo non è una curva: non ha il limite di 90×210
  if (!['diritta', 'diagonale'].includes(forma.id) && (state.w > 900 || state.h > 2100)) {
    suPreventivo = true; motivo = 'archi e curve solo fino a 90×210 — fuori listino';
  }

  const sop = SOPRALUCI.find((s) => s.id === state.sopraluce);
  if (sop.extra) righe.push({ k: sop.label, sub: '', v: sop.extra });

  const cap = CAPITELLI.find((c) => c.id === state.capitello);
  const complAttivi = Object.entries(state.capCompl).filter(([, on]) => on);
  const capBase = cap.extra + complAttivi.reduce((s, [id]) => s + CAP_COMPL[id].extra, 0);
  if (capBase > 0) {
    const capTot = capBase * state.capLati;
    const complTxt = complAttivi.map(([id]) => CAP_COMPL[id].label.split(' ')[0]).join(' + ');
    righe.push({
      k: `${cap.extra ? cap.label : 'Complementi capitello'}${complTxt && cap.extra ? ' + ' + complTxt : complTxt && !cap.extra ? ' ' + complTxt : ''} · ${state.capLati} lato${state.capLati > 1 ? 'i' : ''}`,
      sub: 'Toulipier · Bianco Tosco compreso (pagg. 56–58)',
      v: capTot,
    });
    if (state.w > 900 || state.h > 2100) {
      suPreventivo = true; motivo = 'capitelli solo fino a luce 900×2100 — fuori listino';
    }
  }

  const ser = SERRATURE.find((s) => s.id === state.serratura);
  if (ser.extra) righe.push({ k: `Serratura ${ser.label}`, sub: '', v: ser.extra });
  if (state.serratura === 'magnetica' && state.oroSerr)
    righe.push({ k: 'Serratura magnetica oro', sub: '', v: ORO_SERRATURA });
  if (state.nottolino)
    righe.push({ k: 'Predisposizione nottolino di sicurezza', sub: 'voce 60', v: NOTTOLINO });

  // il cilindro non è un optional se la serratura è a nucleo yale
  const cil = CILINDRI.find((c) => c.id === state.cilindro);
  if (cil.extra) righe.push({ k: cil.label, sub: '', v: cil.extra });
  if (VUOLE_CILINDRO.has(state.serratura) && state.cilindro === 'no')
    righe.push({ k: 'Cilindro', sub: 'la serratura scelta è "cilindro escluso": va aggiunto', v: 0 });

  if (CERNIERE_EXTRA[state.cerniere]) righe.push({
    k: state.cerniere === 'scomparsa' ? 'Cerniere a scomparsa regolazione 3D'
                                      : 'Anuba registrabile 14 mm con cappucci',
    sub: 'n. 2 cerniere', v: CERNIERE_EXTRA[state.cerniere] });
  if (state.cerniere === 'scomparsa' && state.oroCern)
    righe.push({ k: 'Cerniera a scomparsa oro', sub: '', v: ORO_CERNIERA });

  for (const a of ACCESSORI)
    if (state.acc[a.id]) righe.push({ k: a.label, sub: '', v: a.extra });

  const man = MANIGLIE_MOD.find((m) => m.id === state.manigliaMod);
  if (man.extra) {
    righe.push({
      k: `Maniglia ${man.label}`,
      sub: state.manFinitura
        ? `finitura ${state.manFinitura} — ${FINITURE[state.manFinitura].label}`
        : `finitura ${MANIGLIE[state.maniglia].label}`,
      v: man.extra });
  } else if (man.extra === null) {
    // modello nuovo senza prezzo: si ordina, ma non entra nel totale
    righe.push({ k: `Maniglia ${man.label}`, sub: 'prezzo da definire — escluso dal totale', v: 0 });
  }

  const totale = Math.round(righe.reduce((s, r) => s + r.v, 0) * 100) / 100;
  return { righe, totale, suPreventivo, motivo, baseTariffa };
}

const computeTotale = () => computePreventivo().totale;

// griglia maniglie: foto reale della fabbrica per ogni modello
function renderManiglieGrid() {
  const grid = document.getElementById('manigliaGrid');
  grid.innerHTML = MANIGLIE_MOD.map((m) => `
    <button class="man-card${m.id === state.manigliaMod ? ' is-active' : ''}" data-manmod="${m.id}">
      ${m.img
        ? `<span class="man-photo"><img src="${m.img}" alt="Maniglia ${m.label}" loading="lazy"></span>`
        : '<span class="man-photo man-photo--none">—</span>'}
      ${SCHEDE[m.id] ? `<span class="man-zoom" data-zoomman="${m.id}" role="button" tabindex="0"
            title="Scheda tecnica e finiture"
            aria-label="Scheda tecnica ${m.label}">${SVG_LENTE}</span>` : ''}
      <span class="man-label">${m.label}</span>
      <span class="man-extra">${
        m.id === 'no' ? 'esclusa'
        : m.extra === null ? 'prezzo da definire'
        : `+ ${eur.format(m.extra)}`}${
        m.id === state.manigliaMod && state.manFinitura ? ` · ${state.manFinitura}` : ''}</span>
    </button>`).join('');
  grid.querySelectorAll('.man-zoom').forEach((z) => {
    const apri = (ev) => { ev.stopPropagation(); apriVisoreManiglia(z.dataset.zoomman); };
    z.addEventListener('click', apri);
    z.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') apri(ev); });
  });
  grid.querySelectorAll('.man-card').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      if (ev.target.closest('.man-zoom')) return;      // la lente apre la scheda
      state.manigliaMod = btn.dataset.manmod;
      state.manFinitura = null;                        // finitura da riscegliere
      grid.querySelectorAll('.man-card').forEach((b) =>
        b.classList.toggle('is-active', b === btn));
      /* E si rimonta in 3D. Prima cambiava solo il prezzo: il GLB portava una
         maniglia fissa e sceglierne un'altra non si vedeva. Adesso il modello
         e' un file a parte, quindi si vede quella scelta. */
      rimontaManiglia();
      refreshUI();
    });
  });
}

// ── Visore maniglia: scheda tecnica e finiture ammesse dal modello ────────
function apriVisoreManiglia(id) {
  state.manigliaMod = id;
  document.getElementById('manModal').hidden = false;
  document.body.style.overflow = 'hidden';
  renderVisoreManiglia();
}

function chiudiVisoreManiglia() {
  document.getElementById('manModal').hidden = true;
  document.body.style.overflow = '';
  renderManiglieGrid();
  refreshUI();
}

function renderVisoreManiglia() {
  const man = MANIGLIE_MOD.find((m) => m.id === state.manigliaMod);
  const sc = SCHEDE[man.id];
  document.getElementById('manVisoreTitolo').textContent = man.label;
  // foto grande della maniglia, come i coprifili
  document.getElementById('manVisoreFig').innerHTML =
    `<img src="${man.img.replace('.webp', '_big.webp')}" alt="Maniglia ${man.label}">`;

  // — misure: un blocco per ogni configurazione del disegno di fabbrica
  const mm = (v) => String(v).replace('.', ',');
  const blocco = (t, righe) => `<div class="mis-blocco"><p class="mis-tit">${t}</p>${
    righe.map(([k, v]) => `<p class="mis-riga"><span>${k}</span><b>${v}</b></p>`).join('')}</div>`;
  const M = sc;
  document.getElementById('manVisoreMisure').innerHTML = [
    blocco('Maniglia su rosetta', [
      ['lunghezza', `${mm(M.m.L)} mm`],
      ...(M.m.S ? [['sporgenza', `${mm(M.m.S)} mm`]] : []),
      ['rosetta', `${M.m.ros} mm`],
      ['spessore', `${mm(M.m.sp)} mm`]]),
    blocco('Dry keep', [
      ['larghezza', `${mm(M.dk.L)} mm`],
      ['spessore', `${mm(M.dk.sp)} mm`],
      ['altezza', `${mm(M.dk.h)} mm`],
      ['quadro', `${mm(M.dk.q)} mm`],
      ['sporgenza', `${mm(M.dk.S)} mm`]]),
    M.pl ? blocco('Maniglia su placca', [
      ['lunghezza', `${mm(M.pl.L)} mm`],
      ...(M.pl.S ? [['sporgenza', `${mm(M.pl.S)} mm`]] : []),
      ['placca', `${mm(M.pl.h)} × ${mm(M.pl.larg)} mm`],
      ['spessore', `${mm(M.pl.sp)} mm`]]) : '',
    blocco('Martellina / cremonese', [
      ['larghezza', `${mm(M.mt.L)} mm`],
      ['sporgenza', `${mm(M.mt.S)} mm`],
      ['altezza', `${mm(M.mt.h)} mm`],
      ...(M.mt.q ? [['quadro', `${mm(M.mt.q)} mm`]] : []),
      ['spessore', `${mm(M.mt.sp)} mm`]]),
  ].join('');


  document.getElementById('manVisoreFiniture').innerHTML = man.fin.map((c) => {
    const f = FINITURE[c];
    return `<button class="fin-card${c === state.manFinitura ? ' is-active' : ''}" data-vfin="${c}">
      <span class="fin-camp"><img src="assets/finiture/${finSlug(c)}.png" alt="" loading="lazy"></span>
      <span class="fin-cod">${c}</span>
      <span class="fin-lab">${f.label}</span>
    </button>`;
  }).join('');

  document.getElementById('manVisoreNota').textContent = man.finParziale
    ? 'La scheda tecnica di questa maniglia arriva tagliata in fondo: si legge '
      + 'solo la prima finitura. Chiedere l’elenco completo alla fabbrica.'
    : `${man.fin.length} finiture ammesse da scheda tecnica. I campioni sono `
      + 'ritagliati dalle tavole colori originali.';

  document.querySelectorAll('[data-vfin]').forEach((b) =>
    b.addEventListener('click', () => {
      state.manFinitura = b.dataset.vfin;
      setManiglia(FINITURE[b.dataset.vfin].mat);   // aggiorna anche il 3D
      renderVisoreManiglia();
    }));
}

// menu essenze: ogni pastiglia mostra la sua madera vera, ritagliata dal PBR
const swatchesEl = document.getElementById('swatches');
const laccatiEl = document.getElementById('laccati');

function renderEssenze() {
  swatchesEl.innerHTML = Object.entries(ESSENZE).map(([k, e]) => `
    <button class="swatch" data-essenza="${k}">
      <span class="swatch-chip" style="background-image:url('assets/essenze/${k}.webp');background-size:cover"></span>
      <span class="swatch-label">${e.label}</span>
      <span class="swatch-en">${e.en}</span>
    </button>`).join('');
  laccatiEl.innerHTML = `
    <button class="lacc" data-colore="nessuno">
      <span class="lacc-chip lacc-chip--none"></span>
      <span class="lacc-label">Legno a vista</span>
      <span class="lacc-extra">naturale</span>
    </button>` + Object.entries(LACCATI).map(([k, l]) => `
    <button class="lacc" data-colore="${k}">
      <span class="lacc-chip" style="background:#${l.color.toString(16).padStart(6, '0')}"></span>
      <span class="lacc-label">${l.label}</span>
      <span class="lacc-extra">${l.extra ? `+ ${eur.format(l.extra)}` : 'incluso'}</span>
    </button>`).join('');
  swatchesEl.querySelectorAll('.swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.essenza = btn.dataset.essenza; // il colore laccato resta com'è
      applyEssenza();
      refreshUI();
    });
  });
  laccatiEl.querySelectorAll('.lacc').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.colore = btn.dataset.colore;
      if (isLaccato()) state.finitura = 'verniciata'; // la laccatura è una verniciatura
      applyEssenza();
      refreshUI();
    });
  });
}

// controlli degli extra: select popolati dalle tabelle del listino
function fillSelect(id, list, current) {
  const sel = document.getElementById(id);
  sel.innerHTML = list.map((o) =>
    `<option value="${o.id}">${o.label}${o.extra ? ` — + ${eur.format(o.extra)}` : ''}</option>`).join('');
  sel.value = current;
  return sel;
}

function renderExtras() {
  fillSelect('telaioSelect', TELAI, state.telaio)
    .addEventListener('change', (e) => { state.telaio = e.target.value; refreshUI(); });
  refreshCopriSelect();
  fillSelect('aperturaSelect', APERTURE, state.apertura)
    .addEventListener('change', (e) => {
      state.apertura = e.target.value;
      refreshUI();
      /* E si rimonta: da adesso l'apertura non e' solo una voce di prezzo,
         cambia come si muove l'anta e dove siede nel telaio. */
      loadModel(currentModelKey);
    });
  fillSelect('formaSelect', FORME, state.forma)
    .addEventListener('change', (e) => { state.forma = e.target.value; refreshUI(); });
  /* Il sopraluce cambia il TELAIO, non solo il prezzo: si rimonta.
     L'altezza si rilegge sul change e non sul input — ogni battuta
     ritesserebbe la porta intera, e per tre cifre non vale la pena. */
  fillSelect('sopraluceSelect', SOPRALUCI, state.sopraluce)
    .addEventListener('change', (e) => {
      state.sopraluce = e.target.value;
      refreshUI();
      loadModel(currentModelKey);
    });
  document.getElementById('sopH').addEventListener('change', (e) => {
    const v = Math.round(+e.target.value || SOPRALUCE_DEFAULT);
    state.sopraluceH = Math.min(SOPRALUCE_MAX, Math.max(SOPRALUCE_MIN, v));
    e.target.value = state.sopraluceH;
    refreshUI();
    if (state.sopraluce !== 'no') loadModel(currentModelKey);
  });
  fillSelect('capitelloSelect', CAPITELLI, state.capitello)
    .addEventListener('change', (e) => {
      state.capitello = e.target.value;
      refreshUI();
      /* Si rimonta: il capitello si vede, e per giunta cambia il coprifilo
         —con capitello va solo dietro— cosi' la scena non resta vecchia. */
      loadModel(currentModelKey);
    });
  fillSelect('serraturaSelect', SERRATURE, state.serratura)
    .addEventListener('change', (e) => { state.serratura = e.target.value; refreshUI(); });
  renderManiglieGrid();

  document.getElementById('mW').addEventListener('input', (e) => { state.w = +e.target.value || 0; refreshCopriSelect(); refreshUI(); });
  document.getElementById('mH').addEventListener('input', (e) => { state.h = +e.target.value || 0; refreshCopriSelect(); refreshUI(); });
  document.getElementById('mMuro').addEventListener('input', (e) => { state.muro = +e.target.value || 0; refreshUI(); });

  document.querySelectorAll('#antePills .pill').forEach((b) =>
    b.addEventListener('click', () => { state.ante = +b.dataset.ante; refreshUI(); }));
  document.querySelectorAll('#allargatoPills .pill').forEach((b) =>
    b.addEventListener('click', () => { state.allargato = b.dataset.allargato; refreshUI(); }));
  // il legno del coprifilo si sceglie dentro il visore (lente sulla scheda)
  document.querySelectorAll('#cernierePills .pill[data-cerniere]').forEach((b) =>
    b.addEventListener('click', () => { state.cerniere = b.dataset.cerniere; refreshUI(); }));

  // — extra di ferramenta (voci 60, 65–67, 69–71, 26, 41/43/45)
  fillSelect('cilindroSelect', CILINDRI, state.cilindro);
  document.getElementById('cilindroSelect').addEventListener('change', (e) => {
    state.cilindro = e.target.value; refreshUI();
  });
  document.getElementById('accPills').innerHTML = ACCESSORI.map((a) =>
    `<button class="pill" data-acc="${a.id}">${a.label} <span class="en">+€${a.extra}</span></button>`).join('');
  document.querySelectorAll('#accPills .pill').forEach((b) =>
    b.addEventListener('click', () => {
      state.acc[b.dataset.acc] = !state.acc[b.dataset.acc]; refreshUI();
    }));
  document.querySelector('[data-nottolino]').addEventListener('click', () => {
    state.nottolino = !state.nottolino; refreshUI();
  });
  document.querySelector('[data-oroserr]').addEventListener('click', () => {
    state.oroSerr = !state.oroSerr; refreshUI();
  });
  document.querySelector('[data-orocern]').addEventListener('click', () => {
    state.oroCern = !state.oroCern; refreshUI();
  });
  document.querySelector('[data-telforma]').addEventListener('click', () => {
    state.telaioForma = !state.telaioForma; refreshUI();
  });

  document.querySelectorAll('#manoPills .pill').forEach((b) =>
    b.addEventListener('click', () => {
      state.mano = b.dataset.mano;
      /* E si rifa' la porta. La mano decide da che lato stanno le cerniere e
         quindi dove va la maniglia e verso dove spazza l'anta: cambiarla senza
         ricostruire lasciava la maniglia dov'era, cioe' dal lato sbagliato. */
      loadModel(currentModelKey);
      refreshUI();
    }));
  document.querySelectorAll('#capLatiPills .pill').forEach((b) =>
    b.addEventListener('click', () => { state.capLati = +b.dataset.lati; refreshUI(); }));
  document.querySelectorAll('#capComplPills .pill').forEach((b) =>
    b.addEventListener('click', () => {
      state.capCompl[b.dataset.compl] = !state.capCompl[b.dataset.compl];
      refreshUI();
    }));
}

// il menu coprifili mostra il prezzo già scalato sui ml della misura attuale
function refreshCopriSelect() {
  // griglia con anteprima: stessa immagine per tutte le misure di uno stesso
  // modello (il profilo non cambia, cambia solo la larghezza).
  const fml = mlFactor(state.w, state.h);
  const grid = document.getElementById('copriGrid');
  const metri = 11.5 * fml;
  // senza le pastiglie esterne il legno attivo non si vedrebbe: va in nota,
  // perché è quello a cui si riferiscono i prezzi delle schede.
  const nota = document.getElementById('copriNote');
  if (!nota.dataset.base) nota.dataset.base = nota.textContent;
  nota.textContent = `Prezzi in ${COPRI_WOOD_LABEL[state.copriWood]}. ${nota.dataset.base}`;
  grid.innerHTML = COPRI.map((c) => {
    const attiva = c.id === state.copri;
    const mis = attiva ? misuraAttiva(c) : misureDi(c.id)[0];
    const b = extraMisura(c, mis, state.copriWood, metri);
    const p = Math.round((mis.pack && !mis.cad ? b * fml : b) * 100) / 100;
    const n = misureDi(c.id).length;
    return `
    <button class="man-card${attiva ? ' is-active' : ''}" data-copri="${c.id}">
      ${c.img
        ? `<span class="man-photo"><img src="${c.img}" alt="Coprifilo ${c.label}" loading="lazy"></span>`
        : '<span class="man-photo man-photo--none">—</span>'}
      <span class="man-zoom" data-zoom="${c.id}" role="button" tabindex="0"
            title="Ingrandisci e scegli la misura"
            aria-label="Ingrandisci ${c.label}">${SVG_LENTE}</span>
      <span class="man-label">${c.label.replace(/ \(.*/, '').replace(' — compreso', '')}</span>
      <span class="man-extra">${p ? `+ ${eur.format(p)}` : 'compreso'}${
        n > 1 ? ` · ${mis.label}` : ''}</span>
    </button>`;
  }).join('');
  grid.querySelectorAll('.man-card').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      if (ev.target.closest('.man-zoom')) return;      // la lente apre il visore
      state.copri = btn.dataset.copri;
      state.copriMisura = null;                        // torna alla misura di listino
      /* E si rimonta in 3D. Il coprifilo era una voce di listino con la sua
         fotina: tredici profili che il cliente pagava senza vederli montati.
         Adesso si vede quello scelto, addosso alla parete. */
      loadModel(currentModelKey);
      refreshCopriSelect();
      refreshUI();
    });
  });
  grid.querySelectorAll('.man-zoom').forEach((z) => {
    const apri = (ev) => { ev.stopPropagation(); apriVisoreCopri(z.dataset.zoom); };
    z.addEventListener('click', apri);
    z.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') apri(ev); });
  });
}

const SVG_LENTE = `<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
  <circle cx="7" cy="7" r="4.6" fill="none" stroke="currentColor" stroke-width="1.3"/>
  <path d="M10.4 10.4 14 14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
</svg>`;

// ── Visore coprifilo: immagine grande, legno e misura ─────────────────────
function apriVisoreCopri(id) {
  state.copri = id;
  const modal = document.getElementById('copriModal');
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  renderVisoreCopri();
}

function chiudiVisoreCopri() {
  document.getElementById('copriModal').hidden = true;
  document.body.style.overflow = '';
  refreshCopriSelect();
  refreshUI();
}

function renderVisoreCopri() {
  const cop = COPRI.find((c) => c.id === state.copri);
  const fml = mlFactor(state.w, state.h);
  const metri = 11.5 * fml;
  const misure = misureDi(cop.id);
  const attiva = misuraAttiva(cop);

  document.getElementById('copriVisoreTitolo').textContent = cop.label.replace(' — compreso', '');
  const fig = document.getElementById('copriVisoreFig');
  fig.innerHTML = cop.img
    ? `<img src="${cop.img}" alt="Coprifilo ${cop.label}">`
    : '<span class="visore-nofoto">Render non ancora disponibile</span>';

  document.getElementById('copriVisoreLegni').innerHTML = Object.entries(COPRI_WOOD_LABEL)
    .map(([k, v]) => `<button class="pill${k === state.copriWood ? ' is-active' : ''}"
      data-vlegno="${k}">${v}</button>`).join('');

  document.getElementById('copriVisoreMisure').innerHTML = misure.map((m) => {
    const b = extraMisura(cop, m, state.copriWood, metri);
    const p = Math.round((m.pack && !m.cad ? b * fml : b) * 100) / 100;
    return `<button class="misura-row${m.id === attiva.id ? ' is-active' : ''}" data-vmisura="${m.id}">
      <span class="misura-mis">${m.label}</span>
      <span class="misura-cod">${m.code || (m.cad ? 'prezzo cad a listino' : '')}${
        m.ml ? ` · ${eur.format(m.ml[state.copriWood])}/ml` : ''}</span>
      <span class="misura-p">${p ? `+ ${eur.format(p)}` : 'compreso'}</span>
      <span class="misura-src">${m.pack ? 'listino' : m.cad ? 'listino' : 'calcolo a ml'}</span>
    </button>`;
  }).join('');

  const minimo = attiva.minimo
    ? ` Acquistato a metro ha un minimo fatturabile di ${eur.format(attiva.minimo)}.` : '';
  document.getElementById('copriVisoreNota').textContent = (attiva.pack || attiva.cad
    ? `Prezzo a listino per ${ml1(metri)} ml (misura porta attuale).`
    : `Combinazione non tariffata a pacchetto: calcolata al prezzo di listino al metro `
      + `(${eur.format(attiva.ml[state.copriWood])}/ml × ${ml1(metri)} ml) meno il `
      + `liscio listellare 22×70 già compreso. Da confermare con la fabbrica.`) + minimo;

  document.querySelectorAll('[data-vlegno]').forEach((b) =>
    b.addEventListener('click', () => { state.copriWood = b.dataset.vlegno; renderVisoreCopri(); }));
  document.querySelectorAll('[data-vmisura]').forEach((b) =>
    b.addEventListener('click', () => { state.copriMisura = b.dataset.vmisura; renderVisoreCopri(); }));
}

// Schemi animati: il movimento è ciò che distingue queste opzioni, e in un
// menu a tendina non si vede. I file stanno in assets/aperture.
function refreshAnim() {
  mostraApertura(document.getElementById('anteAnim'),
                 state.ante === 2 ? 'due_ante' : 'battente');
  mostraApertura(document.getElementById('aperturaAnim'), state.apertura);
  // anche il fisso ha il suo schema: fermo e senza traccia, cosi si vede che
  // quei 250 € comprano un vano chiuso e non un'anta che si apre
  const conSopraluce = state.sopraluce !== 'no';
  document.getElementById('sopraluceAnimBox').hidden = !conSopraluce;
  if (conSopraluce) mostraApertura(document.getElementById('sopraluceAnim'),
                                   `sopraluce_${state.sopraluce}`);

}

function refreshUI() {
  refreshAnim();
  const prev = computePreventivo();

  // — riepilogo con righe
  const bkEl = document.getElementById('breakdown');
  bkEl.innerHTML = prev.suPreventivo
    ? `<div class="bk-row bk-warn">${prev.motivo} — da quotare con la fabbrica.</div>`
    : prev.righe.map((r) => `
      <div class="bk-row">
        <span class="bk-k">${r.k}${r.sub ? `<small>${r.sub}</small>` : ''}</span>
        <span class="bk-v">${eur.format(r.v)}</span>
      </div>`).join('');

  totalEl.textContent = prev.suPreventivo ? 'SU PREVENTIVO' : eur.format(prev.totale);
  totalEl.classList.toggle('is-prev', prev.suPreventivo);
  totalEl.classList.remove('bump');
  void totalEl.offsetWidth;
  totalEl.classList.add('bump');
  document.getElementById('cta').disabled = prev.suPreventivo;

  summaryLabelEl.innerHTML = 'Porta completa · <span class="en">Complete door</span>';
  summaryConfigEl.textContent =
    `${MODELLI[state.modello].label} · ${essenzaLabel()} — ${FINITURA_LABEL[state.finitura]} · ${state.w}×${state.h} mm`;

  // — note contestuali
  const band = sizeBand(state.w, state.h);
  const misureNote = document.getElementById('misureNote');
  if (!band.ok) misureNote.textContent = '⚠ Oltre 1200×2600 mm: fuori listino, su preventivo.';
  else if (band.note.length) misureNote.textContent = `Scaglioni listino: ${band.note.join(' e ')} sul prezzo base.`;
  else if (state.w < 700) misureNote.textContent = '⚠ Luce minima 700 mm: sotto, occorre cambiare modello.';
  else misureNote.textContent = 'Misura standard di listino (900×2100).';

  const allPills = document.getElementById('allargatoPills');
  allPills.hidden = state.muro <= 108;
  // l'allargato ha la sua sezione di listino, una per tipo
  const allFig = document.getElementById('allargatoFig');
  allFig.hidden = allPills.hidden;
  if (!allFig.hidden)
    document.getElementById('allargatoSchema').src =
      `assets/telai/allargato_${state.allargato}.svg`;
  document.getElementById('muroNote').textContent = state.muro <= 108
    ? 'Il telaio standard copre muri fino a 108 mm.'
    : `Allargato ${allargatoExtra(state.muro, state.allargato).label}: + ${eur.format(allargatoExtra(state.muro, state.allargato).extra)}.`;

  // le sezioni sono ritagliate dal listino (pagg. 48–50): sono i disegni di
  // fabbrica. Lo standard non ce l'ha, e l'unico ridisegnato da noi.
  const sch = document.getElementById('telaioSchema');
  sch.src = `assets/telai/${state.telaio}.svg`;
  document.getElementById('telaioSchemaNota').textContent =
    (TELAIO_COPRI[state.telaio] || '') + (state.telaio === 'std'
      ? ' · schema nostro, il listino non lo disegna'
      : ' · ridisegnata dalla sezione di listino');

  document.getElementById('telaioNote').textContent =
    state.telaio === 'alpha_comp_sp' ? `Con il complanare a spingere il fermaporta a pavimento è obbligatorio: + ${eur.format(FERMAPORTA)} (voce 74).` : '';

  const apNote = [];
  if (state.apertura === 'magic' && state.w > 800) apNote.push('⚠ Il kit MAGIC è disponibile solo per luce muro fino a 800 mm.');
  /* La voce 20 elenca le altezze in cui il sistema ERGON esiste: HN 1900,
     1950, 2000, 2050, 2100, 2150, 2200. Fuori di li' non e' una porta piu'
     cara, e' una porta che non si puo' ordinare. */
  if (state.apertura === 'ergon' && (state.h < 1900 || state.h > 2200))
    apNote.push(`⚠ La voce 20 copre le altezze 1900–2200 mm: ${state.h} mm è fuori listino.`);
  if (state.forma !== 'diritta' && (state.w > 900 || state.h > 2100)) apNote.push('⚠ Archi e curve solo fino a 90×210.');
  document.getElementById('aperturaNote').textContent = apNote.join(' ');

  document.querySelectorAll('#antePills .pill').forEach((b) =>
    b.classList.toggle('is-active', +b.dataset.ante === state.ante));
  document.querySelectorAll('#allargatoPills .pill').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.allargato === state.allargato));
  document.querySelectorAll('#cernierePills .pill[data-cerniere]').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.cerniere === state.cerniere));

  // il cilindro compare solo se la serratura è "cilindro escluso"
  const vuoleCil = VUOLE_CILINDRO.has(state.serratura);
  document.getElementById('cilindroBox').hidden = !vuoleCil;
  document.getElementById('cilindroSelect').value = state.cilindro;

  // i sovrapprezzi oro valgono solo sui due pezzi che li prevedono
  const oroS = document.querySelector('[data-oroserr]');
  oroS.hidden = state.serratura !== 'magnetica';
  oroS.classList.toggle('is-active', state.oroSerr);
  const oroC = document.querySelector('[data-orocern]');
  oroC.hidden = state.cerniere !== 'scomparsa';
  oroC.classList.toggle('is-active', state.oroCern);

  document.querySelector('[data-nottolino]').classList.toggle('is-active', state.nottolino);
  document.querySelectorAll('#accPills .pill').forEach((b) =>
    b.classList.toggle('is-active', !!state.acc[b.dataset.acc]));

  // il telaio di passaggio esiste solo per archi e curve
  const tf = TELAIO_FORMA[state.forma];
  document.getElementById('telaioFormaPills').hidden = !tf;
  const btf = document.querySelector('[data-telforma]');
  btf.classList.toggle('is-active', state.telaioForma);
  if (tf) btf.innerHTML =
    `Aggiungi telaio di passaggio <span class="en">+€${tf}</span>`;

  document.querySelectorAll('#manoPills .pill').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.mano === state.mano));
  document.querySelectorAll('#capLatiPills .pill').forEach((b) =>
    b.classList.toggle('is-active', +b.dataset.lati === state.capLati));
  document.querySelectorAll('#capComplPills .pill').forEach((b) =>
    b.classList.toggle('is-active', !!state.capCompl[b.dataset.compl]));
  const capNote = document.getElementById('capitelloNote');
  const capAttivo = state.capitello !== 'no' || Object.values(state.capCompl).some(Boolean);
  capNote.textContent = capAttivo && (state.w > 900 || state.h > 2100)
    ? '⚠ I capitelli sono disponibili solo fino a luce 900×2100 — oltre, su preventivo.'
    : 'Prezzi Toulipier, Laccato Bianco Tosco compreso, per lato. Solo fino a luce 900×2100.';
  capNote.classList.toggle('warn', capAttivo && (state.w > 900 || state.h > 2100));

  // la laccatura è una verniciatura: "grezza" resta cliccabile e,
  // se scelta, toglie il colore e torna al legno a vista
  document.querySelector('[data-finitura="grezza"]').disabled = false;

  /* I colori laccati stanno dentro la verniciatura e si vedono solo li'.
     Sulla porta grezza non c'e' niente da colorare. */
  const laccBox = document.getElementById('laccatiBox');
  if (laccBox) laccBox.hidden = state.finitura !== 'verniciata';

  pillNoteEl.textContent = state.finitura === 'grezza'
    /* Nascondendo i colori spariva anche l'indizio che esistono: senza questa
       riga il cliente non ha modo di sapere che la porta si puo' laccare. */
    ? (window.T ? window.T('fin_nota_grezza') : '')
    : !isLaccato() ? ''
      : (laccatoExtra()
          ? `La laccatura è una verniciatura. Colore RAL: + ${eur.format(RAL_EXTRA)} (listino n. 50). `
          : 'La laccatura è una verniciatura. Bianco Tosco: compreso nel prezzo. ')
        + 'Scegliendo "Grezza" si torna al legno a vista.';

  // l'altezza del sopraluce si chiede solo se il sopraluce c'e'
  const sopBox = document.getElementById('sopraluceHBox');
  if (sopBox) sopBox.hidden = state.sopraluce === 'no';

  /* il TIPO. La sezione sparisce sulle porte con vetro invece di restare
     disattivata: una scelta che non si puo' fare non deve nemmeno vedersi. */
  const secTipo = document.getElementById('secTipo');
  if (secTipo) {
    secTipo.hidden = false;
    document.querySelectorAll('#tipoPills .pill').forEach((b) =>
      b.classList.toggle('is-active', Number(b.dataset.tipo) === state.tipo));
    const tipoNote = document.getElementById('tipoNote');
    if (tipoNote && window.T) {
      /* La nota del 2 e del 3 finisce con "il campo si sceglie qui sotto", e
         su una porta tutta di vetro quella frase indica il vuoto: li' sotto
         non c'e' niente da scegliere, perche' non c'e' un pannello. Si taglia
         la coda e resta il nome della modanatura, che e' l'unica cosa che
         quella porta riceve dal tipo. */
      const completa = window.T(`tipo_n${state.tipo}`);
      tipoNote.textContent = (scegliBugna(state.tipo) && !modelloConPannello)
        ? completa.split('.')[0] + '.'
        : completa;
    }

    /* La scelta del campo: si vede solo dove c'e' da scegliere. Sul TIPO 1
       sparisce invece di restare disattivata, come la sezione intera fa con
       le porte a vetro. */
    const bugnaBox = document.getElementById('bugnaBox');
    if (bugnaBox) {
      /* Niente scelta del campo se non c'e' un pannello: una porta tutta di
         vetro non ha dove mettere la bugna, e chiederlo confonderebbe. */
      bugnaBox.hidden = !scegliBugna(state.tipo) || !modelloConPannello;
      document.querySelectorAll('#bugnaPills .pill').forEach((b) =>
        b.classList.toggle('is-active', (b.dataset.bugna === 'si') === state.bugna));
    }

    /* I numeri delle sezioni si riscrivono ogni volta. Sono nel documento
       perche' li' si leggono, ma se una sezione sparisce restano quelli di
       prima e il pannello va da 02 a 04: sembra che manchi un pezzo. */
    let n = 0;
    secTipo.parentElement.querySelectorAll(':scope > .section').forEach((sez) => {
      const num = sez.querySelector('.section-title .num');
      if (!num || sez.hidden) return;
      num.textContent = String(++n).padStart(2, '0');
    });
  }

  document.querySelectorAll('#pills .pill').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.finitura === state.finitura));
  document.querySelectorAll('.swatch').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.essenza === state.essenza));
  document.querySelectorAll('.lacc').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.colore === state.colore));
}

function setModello(key) {
  if (state.modello === key && model) return;
  state.modello = key;
  const def = MODELLI[key];
  // intestazioni pannello e viewer
  captionModelEl.innerHTML = def.linea === 'Base'
    ? def.label
    : `${def.label} <span>${def.linea}</span>`;
  if (captionLineEl) captionLineEl.textContent = def.sub;
  panelTitleEl.textContent = def.linea === 'Base' ? def.label : `${def.label} ${def.linea}`;
  // il catalogo porta gia' le due descrizioni: si prende quella scelta
  panelSubEl.textContent = (window.lingua && window.lingua() === 'en') ? def.descEn : def.descIt;
  modelloSelect.value = key;
  refreshUI();
  loadModel(key);
}

// modello: menu a tendina raggruppato per linea
const modelloSelect = document.getElementById('modelloSelect');

/* MODELLI FUORI VETRINA, per ora.
   Il render va ritoccato e finche' non lo e' il cliente non deve poterli
   scegliere. NON si tolgono dal catalogo: la loro scheda resta intera in
   js/catalogo.js —listino compreso, che li' dentro il prezzo e' un campo
   della scheda e non un file a parte— cosi' i preventivi gia' fatti
   continuano a calcolare e il giorno che il disegno e' pronto basta togliere
   il nome da questa lista.
   I .json dei tracciati stanno in ~/Documents/JSON DOOR.

   QUINDICI SONO TORNATE: siena, roma, enna, firenze, faenza, mantova, pisa,
   latina, piacenza, catania, pausania, newengland, timesquare, potenza e
   matera hanno il tracciato ritoccato e sono di nuovo in vetrina. Resta solo
   la barletta, che non e' un ritocco: va ridisegnata da capo. */
const MODELLI_NASCOSTI = new Set([
  'barletta',
]);

/** I modelli che il cliente puo' davvero scegliere. */
const modelliVisibili = () =>
  Object.entries(MODELLI).filter(([k]) => !MODELLI_NASCOSTI.has(k));

function renderModelli() {
  const groups = { Base: [], 100: [] };
  for (const [k, m] of modelliVisibili()) (groups[m.linea] || (groups[m.linea] = [])).push([k, m]);
  /* Chi non ha scheda di listino non ha ID, e non se ne inventa uno: va in
     fondo al suo gruppo e nell'etichetta non compare nessun numero. Con
     `a.id - b.id` secco sarebbe uscito NaN e l'ordine del selettore dipendeva
     dal caso. */
  const byId = (a, b) => (a[1].id ?? 1e9) - (b[1].id ?? 1e9);
  const opt = ([k, m]) => `<option value="${k}">${m.label}${m.id ? ` · ID ${m.id}` : ''}</option>`;
  modelloSelect.innerHTML = Object.entries(groups)
    .filter(([, arr]) => arr.length)
    .map(([linea, arr]) => `<optgroup label="Linea ${linea}">${arr.sort(byId).map(opt).join('')}</optgroup>`)
    .join('');
  modelloSelect.value = state.modello;
  modelloSelect.addEventListener('change', () => setModello(modelloSelect.value));
}

// finitura (solo le pill della sezione finitura, non quelle ambiente).
// Scegliere "grezza" con un colore laccato attivo NON è bloccato: il
// colore si toglie da solo e si torna al legno a vista.
document.querySelectorAll('#pills .pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.finitura = btn.dataset.finitura;
    if (state.finitura === 'grezza' && isLaccato()) {
      state.colore = 'nessuno';
      applyEssenza();            // ripristina venatura e tinta del legno
    } else {
      applyMaterialLook();
    }
    refreshUI();
  });
});

/* tipo: cambia la finitura del campo, cioe' la geometria. Non basta
   ridipingere: la porta si ritesse. E' l'unica scelta del pannello che lo
   richiede, insieme al modello. */
document.querySelectorAll('#tipoPills .pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tipo = Number(btn.dataset.tipo);
    if (tipo === state.tipo) return;
    state.tipo = tipo;
    /* Cambiando tipo il campo torna al suo valore di partenza: il 2 con la
       bugna, il 3 liscio, che e' come li conosce chi gia' usava il pannello.
       Da li' il cliente lo cambia se vuole. */
    state.bugna = BUGNA_DI_PARTENZA[tipo];
    refreshUI();
    loadModel(state.modello);
  });
});

/* il CAMPO: bugna si o no. Come il tipo, cambia la geometria e la porta si
   ritesse; non basta ridipingerla. */
document.querySelectorAll('#bugnaPills .pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    const con = btn.dataset.bugna === 'si';
    if (con === state.bugna || !scegliBugna(state.tipo) || !modelloConPannello) return;
    state.bugna = con;
    refreshUI();
    loadModel(state.modello);
  });
});

// ambiente
document.querySelectorAll('[data-ambiente]').forEach((btn) => {
  btn.addEventListener('click', () => setAmbiente(btn.dataset.ambiente));
});

// maniglia
document.querySelectorAll('[data-maniglia]').forEach((btn) => {
  btn.addEventListener('click', () => setManiglia(btn.dataset.maniglia));
});

/* ============================================================
   PREVENTIVO — modulo cliente + PDF per il produttore
   ============================================================ */

const quoteModal = document.getElementById('quoteModal');
const quoteForm = document.getElementById('quoteForm');
const quoteFormView = document.getElementById('quoteFormView');
const quoteDoneView = document.getElementById('quoteDoneView');

/* ------------------------------------------------------------
   I dati che il documento del cliente si aspetta. Qui si legge lo
   stato, di la' si impagina: chi cambia il listino non deve entrare
   nel foglio di stampa, e chi cambia il foglio non tocca i prezzi.
   ------------------------------------------------------------ */
function datiPreventivo(cliente, rif) {
  const mod = MODELLI[state.modello];
  const prev = computePreventivo();
  const qty = Math.max(1, parseInt(cliente.quantita, 10) || 1);
  const tel = TELAI.find((t) => t.id === state.telaio);
  const cop = COPRI.find((c) => c.id === state.copri);
  const mis = misuraAttiva(cop);
  const ape = APERTURE.find((a) => a.id === state.apertura);
  const forma = FORME.find((f) => f.id === state.forma);
  const sop = SOPRALUCI.find((x) => x.id === state.sopraluce);
  const ser = SERRATURE.find((x) => x.id === state.serratura);
  const man = MANIGLIE_MOD.find((m) => m.id === state.manigliaMod);
  const all = allargatoExtra(state.muro, state.allargato);

  const CERN = { anuba: 'Anuba standard', anuba14: 'Anuba registrabile 14 mm',
                 scomparsa: 'A scomparsa, regolazione 3D' };

  // la maniglia: modello + finitura, o la finitura del 3D se non c'e' modello
  const maniglia = man.extra === 0 && man.id === 'no'
    ? 'Da definire'
    : `${man.label}${state.manFinitura ? ' · ' + state.manFinitura : ''}`;

  const citta = `${cliente.citta || ''}${cliente.cap ? ' · ' + cliente.cap : ''}` +
                `${cliente.provincia ? ' (' + cliente.provincia + ')' : ''}`;

  const config = [
    ['Essenza', essenzaLabel()],
    // il tipo va scritto: e' la porta che si costruisce, non un dettaglio
    ['Tipo', TIPO_LABEL[state.tipo]
      + (scegliBugna(state.tipo) && modelloConPannello
        ? (state.bugna ? ' · con bugna' : ' · campo liscio') : '')],
    ['Finitura', FINITURA_LABEL[state.finitura]],
    ['Misure luce', `${state.w} × ${state.h} mm`,
      `${state.ante === 1 ? '1 anta' : '2 ante'} · mano ${state.mano.toUpperCase()}`],
    ['Muro', `${state.muro} mm`, all.label || `allargato ${state.allargato}`],
    ['Telaio', tel.label],
    ['Coprifili', `${cop.label.replace(/\s*\(.*?\)/, '')} ${mis.label}`,
      COPRI_WOOD_LABEL[state.copriWood]],
    ['Apertura', ape.label, forma.id === 'diritta' ? '' : forma.label],
    ['Maniglia', maniglia],
    ['Serratura', ser.label],
    ['Cerniere', CERN[state.cerniere] || state.cerniere],
  ];
  if (sop.id !== 'no') config.push(['Sopraluce', sop.label]);

  return {
    rif,
    data: new Date().toLocaleDateString('it-IT',
      { day: 'numeric', month: 'long', year: 'numeric' }),
    logo: logoData,
    modello: mod.linea === 'Base' ? mod.label : `${mod.label} ${mod.linea}`,
    sottotitolo: `${mod.descIt} · ${essenzaLabel()}, ${FINITURA_LABEL[state.finitura]}`,
    essenza: essenzaLabel(),
    luce: `${state.w} × ${state.h} mm`,
    maniglia,
    cliente: [
      ['Nome', cliente.nome],
      ['Telefono', cliente.telefono],
      ['Email', cliente.email],
      ['Città', citta],
      ['Indirizzo', cliente.indirizzo],
      ['Quantità', `${qty} ${qty === 1 ? 'porta' : 'porte uguali'}`],
    ],
    config,
    righe: prev.righe,
    totale: prev.totale,
    qty,
    note: cliente.note || '',
    fuoriListino: prev.suPreventivo ? prev.motivo : '',
    // Finche' l'assistente non genera il render della configurazione,
    // il foglio 2 porta sempre questa scena. Lo scatto del 3D era
    // peggio: una porta che galleggia su bianco a tutta pagina.
    immagine: 'assets/collezioni/listino.webp',
    scena: true,
    fogli: prev.righe.length > 12 ? 3 : 2,
  };
}

/* ============================================================
   BLOCCO ORDINE TL_2018 — il modulo ufficiale Toscocornici,
   compilato sopra l'immagine del modulo originale.
   Coordinate calibrate sulle caselle reali del PDF (pt, A4).
   ============================================================ */

const BLOCCO_C = {"diserie":[218.7,130.2],"opzionali":[395.5,130.2],"cop_liscio":[100.3,145.8],"cop_s1":[159.5,145.8],"cop_s2":[218.7,145.8],"cop_b":[277.6,145.8],"cop_cs400":[328.9,145.8],"cop_cs1":[395.5,145.8],"cop_cs300":[455.5,145.8],"cop_cs207":[514.3,145.8],"cop_cs206":[573.9,145.8],"larg70_a":[23.2,160.0],"larg90_a":[23.2,175.9],"cop_cs204":[100.3,191.3],"cop_cs3":[159.5,191.3],"cop_cap1":[277.0,191.3],"larg70_b":[23.2,205.4],"larg90_b":[23.2,220.2],"tel_std":[100.2,253.9],"tel_alpha":[159.6,253.9],"tel_alphaco":[218.6,253.9],"tel_design":[277.0,253.9],"tel_spingere":[328.8,253.9],"tel_barocco":[395.5,253.9],"tel_madsag":[514.2,253.9],"tel_madmod":[573.8,253.9],"allarg_imb":[29.2,283.7],"allarg_int":[29.2,310.8],"legno":[94.7,332.2],"nessuna":[203.2,345.6],"cern_anube":[159.6,401.6],"cern_scomp":[159.6,415.0],"serr_mecc":[277.0,401.6],"serr_magn":[277.0,415.0],"ferr_ott":[395.5,401.6],"ferr_cromo":[395.5,415.0],"luce_netta":[571.2,408.4],
  mano_rows:[483.4,535.1,586.8,638.4,690.1,741.8,793.6],
  mano_cols:[276.4,297.8,319.3,340.8,362.2,384.7,408.6,432.2,455.9,479.5]};

// coprifilo → casella del blocco + larghezze da barrare + gruppo (a/b)
const COPRI_BLOCCO = {
  listellare:   { box: 'cop_liscio', larg: [70, 90], gr: 'a', serie: true },
  massello:     { box: 'cop_liscio', larg: [70, 90], gr: 'a', nota: 'Coprifili liscio MASSELLO' },
  pierre:       { box: 'cop_s1',    larg: [70],     gr: 'a' },
  giotto:       { box: 'cop_s2',    larg: [70, 90], gr: 'a' },
  tintoretto:   { box: 'cop_b',     larg: [70, 90], gr: 'a' },
  raffaello:    { box: 'cop_cs400', larg: [70, 90], gr: 'a' },
  leonardo:     { box: 'cop_cs1',   larg: [90],     gr: 'a' },
  michelangelo: { box: 'cop_cs300', larg: [70, 90], gr: 'a' },
  cartesio:     { box: 'cop_cs207', larg: [70],     gr: 'a', nota: 'Cartesio CS207: lato esterno 100 mm' },
  caravaggio:   { box: 'cop_cs206', larg: [90],     gr: 'a' },
  tiziano:      { box: 'cop_cs204', larg: [90],     gr: 'b' },
  canaletto:    { box: 'cop_cs3',   larg: [90],     gr: 'b' },
  novecento:    { box: 'cop_cap1',  larg: [],       gr: 'b', nota: 'Novecento CAP1 42×110' },
};

// telaio → casella (null = senza casella nel modulo → in NOTE)
const TELAI_BLOCCO = {
  std: 'tel_std', alpha: 'tel_alpha', alpha_comp: 'tel_alphaco',
  alpha_comp_sp: 'tel_spingere', design: 'tel_design', design_comp: 'tel_design',
  r10b: 'tel_barocco', madonna: 'tel_madsag', madonna_mod: 'tel_madmod',
  r10: null, moderno: null, passaggio90: null,
};

// apertura → colonna mano (0=BATT 1=SCOR 4=LIB.S; DX = 0–4, SX = +5)
const MANO_COL = {
  battente: 0, justor: 0, ergon: 0,
  scomparsa: 1, est_muro: 1, est_muro_m: 1, int_telaio: 1, magic: 1,
  koblenz: 4,
};

let bloccoBg = null; // dataURL del modulo, precaricato
function loadBloccoBg() {
  return fetch('assets/blocco_tl2018.jpg')
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
    .then((b) => new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => { bloccoBg = fr.result; res(bloccoBg); };
      fr.readAsDataURL(b);
    }));
}
loadBloccoBg().catch((e) => console.warn('Blocco TL_2018 non precaricato:', e));

// logo per la testata del preventivo: la testata e' verde,
// e la targa nera del logo normale ci sparirebbe dentro
let logoData = null;
fetch('assets/logo_toscocornici_chiaro.png')
  .then((r) => r.blob())
  .then((b) => { const fr = new FileReader(); fr.onload = () => { logoData = fr.result; }; fr.readAsDataURL(b); })
  .catch(() => {});
// se il precarico è fallito (rete, deploy in corso), riprova al momento dell'invio
async function ensureBloccoBg() {
  if (bloccoBg) return true;
  try { await loadBloccoBg(); return true; } catch (e) { return false; }
}

function buildBlocco(cliente, rif) {
  if (!bloccoBg) return null;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.addImage(bloccoBg, 'JPEG', 0, 0, 595, 842);

  doc.setTextColor(20, 20, 90); // blu compilazione
  const X = (k) => { const c = BLOCCO_C[k]; if (!c) return; doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('X', c[0] - 3.2, c[1] + 3.6); };
  const T = (x, y, t, s = 8, bold = true) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(s); doc.text(String(t), x, y); };

  const mod = MODELLI[state.modello];
  const note = [];

  // — intestazione
  T(60, 118, new Date().toLocaleDateString('it-IT'), 9);
  T(345, 83, cliente.rivenditore || 'Italian Doorway Elegance', 9);
  T(345, 97, `${cliente.nome} — ${cliente.citta}`, 8);
  T(345, 118, cliente.pagamento || 'da concordare', 8);

  // — coprifili
  const cb = COPRI_BLOCCO[state.copri];
  X(cb.serie ? 'diserie' : 'opzionali');
  X(cb.box);
  // le larghezze barrate seguono la misura scelta nel visore, non il default:
  // "70 / 70" barra solo 70, "90 / 90" solo 90, il pacchetto entrambe.
  const cmis = misuraAttiva(COPRI.find((c) => c.id === state.copri));
  const largScelte = /^(\d+)\s*\/\s*(\d+)$/.test(cmis.label)
    ? [...new Set(cmis.label.split('/').map((s) => +s.trim()))].filter((l) => cb.larg.includes(l))
    : cb.larg;
  for (const l of (largScelte.length ? largScelte : cb.larg)) X(`larg${l}_${cb.gr}`);
  if (cb.nota) note.push(cb.nota);
  note.push(`Coprifili in ${COPRI_WOOD_LABEL[state.copriWood]}`);
  if (!cmis.pack && !cmis.cad) note.push(`Coprifilo ${cmis.label} — prezzo calcolato a ml, da confermare`);

  // — telaio
  const tb = TELAI_BLOCCO[state.telaio];
  if (tb) X(tb); else note.push(`Telaio: ${TELAI.find((t) => t.id === state.telaio).label}`);
  if (state.telaio === 'design') note.push('Telaio DESIGN (non complanare)');
  if (state.telaio === 'design_comp') note.push('Telaio DESIGN COMPLANARE');
  X('legno');
  if (state.muro > 108) {
    X(state.allargato === 'imbottino' ? 'allarg_imb' : 'allarg_int');
    note.push(`Allargato ${state.allargato} — muro ${state.muro} mm`);
  }

  // — anta, cerniera, serratura, ferramenta, misure
  X('nessuna');
  X(state.cerniere === 'scomparsa' ? 'cern_scomp' : 'cern_anube');
  X(state.serratura === 'magnetica' ? 'serr_magn' : 'serr_mecc');
  if (['yale', 'opera', 'cisa'].includes(state.serratura))
    note.push(`Serratura ${SERRATURE.find((s) => s.id === state.serratura).label}`);
  if (state.maniglia === 'ottone') X('ferr_ott');
  else if (state.maniglia === 'cromo') X('ferr_cromo');
  else note.push('Ferramenta NERO opaco');
  X('luce_netta');

  // — riga 1 dell'ordine
  T(58, 453.5, `${mod.label} ${mod.linea !== 'Base' ? mod.linea : ''} · ID ${mod.id}`, 7.5);
  T(58, 469.8, `${ESSENZE[state.essenza].label} massello`, 7);
  const finTxt = isLaccato()
    ? `Verniciata · Laccato ${LACCATI[state.colore].label}`
    : `${FINITURA_LABEL[state.finitura]}`;
  T(58, 486, finTxt, 7);
  T(196, 453.5, state.w, 8);
  T(221, 453.5, state.h, 8);
  T(245, 453.5, state.muro, 8);
  const qty = Math.max(1, parseInt(cliente.quantita, 10) || 1);
  T(498, 453.5, qty, 9);

  // — mano: colonna dal tipo di apertura, blocco DX o SX
  const col = MANO_COL[state.apertura] + (state.mano === 'sx' ? 5 : 0);
  const mc = BLOCCO_C.mano_cols[col], mr = BLOCCO_C.mano_rows[0];
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('X', mc - 3.2, mr + 3.6);

  // — note: tutto ciò che non ha casella
  const ape = APERTURE.find((a) => a.id === state.apertura);
  if (state.apertura !== 'battente') note.push(`Apertura: ${ape.label}`);
  if (state.forma !== 'diritta') note.push(`Porta ${FORME.find((f) => f.id === state.forma).label}`);
  if (state.sopraluce !== 'no') note.push(SOPRALUCI.find((s) => s.id === state.sopraluce).label);
  if (state.ante === 2) note.push('2 ante (+100%)');
  const capB = CAPITELLI.find((c) => c.id === state.capitello);
  const capCompl = Object.entries(state.capCompl).filter(([, on]) => on).map(([id]) => CAP_COMPL[id].label);
  if (capB.extra || capCompl.length)
    note.push(`${capB.extra ? capB.label : 'Compl. capitello'}${capCompl.length ? ' + ' + capCompl.join(', ') : ''} × ${state.capLati} lato/i`);
  if (state.manigliaMod !== 'no')
    note.push(`Maniglia ${MANIGLIE_MOD.find((m) => m.id === state.manigliaMod).label}`
      + (state.manFinitura ? ` fin. ${state.manFinitura}` : ''));
  note.push(`Rif. preventivo ${rif}`);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.4);
  note.slice(0, 12).forEach((l, i) => doc.text(doc.splitTextToSize(l, 58)[0], 516, 449 + i * 8.2));

  return doc;
}

function openQuote() {
  quoteFormView.hidden = false;
  quoteDoneView.hidden = true;
  quoteModal.hidden = false;
  quoteForm.querySelector('[name="nome"]').focus();
}

function closeQuote() { quoteModal.hidden = true; }

document.getElementById('cta').addEventListener('click', openQuote);
document.getElementById('quoteCancel').addEventListener('click', closeQuote);
document.getElementById('quoteClose').addEventListener('click', closeQuote);
quoteModal.addEventListener('click', (e) => { if (e.target === quoteModal) closeQuote(); });

const manModal = document.getElementById('manModal');
document.getElementById('manVisoreX').addEventListener('click', chiudiVisoreManiglia);
document.getElementById('manVisoreOk').addEventListener('click', chiudiVisoreManiglia);
manModal.addEventListener('click', (e) => { if (e.target === manModal) chiudiVisoreManiglia(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !manModal.hidden) chiudiVisoreManiglia();
});

const copriModal = document.getElementById('copriModal');
document.getElementById('copriVisoreX').addEventListener('click', chiudiVisoreCopri);
document.getElementById('copriVisoreOk').addEventListener('click', chiudiVisoreCopri);
copriModal.addEventListener('click', (e) => { if (e.target === copriModal) chiudiVisoreCopri(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !copriModal.hidden) chiudiVisoreCopri();
});

quoteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cliente = Object.fromEntries(new FormData(quoteForm).entries());
  const d = new Date();
  const rif = `TC-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const dati = datiPreventivo(cliente, rif);

  // il modulo di fabbrica resta un PDF scaricato: e' jsPDF sopra la
  // scansione del TL_2018, con le caselle calibrate al punto
  const okBg = await ensureBloccoBg();
  const blocco = okBg ? buildBlocco(cliente, rif) : null;
  if (blocco) blocco.save(`Toscornici_Blocco_Ordine_${rif}.pdf`);

  document.getElementById('doneRef').textContent = `Rif. ${rif}`;
  document.getElementById('doneFiles').innerHTML = blocco
    ? `· <b>Preventivo ${rif}</b> — si apre la finestra di stampa: scegli <b>Salva come PDF</b>.<br>· <b>Toscornici_Blocco_Ordine_${rif}.pdf</b> — modulo TL_2018 per la fabbrica, già scaricato.`
    : `· <b>Preventivo ${rif}</b> — si apre la finestra di stampa: scegli <b>Salva come PDF</b>.<br><span class="en">⚠ Blocco ordine non generato (modulo non raggiungibile) — riprova.</span>`;
  quoteFormView.hidden = true;
  quoteDoneView.hidden = false;

  // dopo lo scarico: la stampa e' modale e blocca la pagina finche' resta aperta
  ultimiDati = dati;
  setTimeout(() => stampaPreventivo(dati), 700);
});

// il bottone della schermata finale riapre lo stesso documento
let ultimiDati = null;
document.getElementById('doneStampa')?.addEventListener('click', () => {
  if (ultimiDati) stampaPreventivo(ultimiDati);
});

window.__pdf = { buildBlocco, datiPreventivo, stampaPreventivo, documentoPreventivo }; // hook di verifica

// Cambiando lingua si riscrivono le etichette, non si ricarica la porta:
// la geometria non parla italiano. Chiamare setModello qui faceva ripartire
// il caricamento del GLB, e in avvio ne faceva partire due insieme.
document.addEventListener('linguacambiata', () => {
  try {
    const def = MODELLI[state.modello];
    panelSubEl.textContent = (window.lingua && window.lingua() === 'en') ? def.descEn : def.descIt;
    refreshUI();
  } catch (e) { /* il pannello non c'e' ancora */ }
});

/* ============================================================
   AVVIO
   ============================================================ */

/* Il modello di partenza deve ESISTERE. Era 'liverpool', che senza tracciato
   e' uscito dal catalogo, e la pagina moriva alla prima riga che ne leggeva il
   listino. Meglio non fidarsi nemmeno del valore scritto qui sopra: se non c'e'
   si prende la prima porta del catalogo, qualunque sia. */
/* ...e deve essere anche VISIBILE. 'siena' e' il valore scritto in cima, ed
   e' fra quelli ritirati: senza questo controllo la pagina partiva su una
   porta che non compare nel menu, e il selettore restava vuoto. */
if (!MODELLI[state.modello] || MODELLI_NASCOSTI.has(state.modello)) {
  const primo = modelliVisibili()[0];
  if (primo) state.modello = primo[0];
}

renderModelli();
renderEssenze();
renderExtras();
setManiglia(state.maniglia);
refreshUI();
loadModel(state.modello);


/* ============================================================
   ASA DE DEPURACION
   Un solo objeto en window para poder MEDIR desde la consola —el color que
   sale en pantalla, la repeticion de una textura, la rugosidad real— en vez
   de mirar la puerta y opinar. No lo usa la aplicacion: si se borra, no se
   rompe nada. El escaparate tiene el suyo igual.
   ============================================================ */
window.__tosco = {
  /* Por GETTER y no por valor. `model` y `scene` se reasignan cuando entra el
     GLB, asi que copiarlos aqui guardaba el null del arranque: el asa decia
     que no habia puerta cuando la habia. */
  get scene() { return scene; },
  get renderer() { return renderer; },
  get camera() { return camera; },
  get woodMat() { return woodMat; },
  get handleMat() { return handleMat; },
  get state() { return state; },
  get model() { return model; },
  veta,
  VENATURE,
  ESSENZE,
};
