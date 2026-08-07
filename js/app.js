import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mostraApertura } from './aperture.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MODELLI } from './catalogo.js';

/* ============================================================
   CATALOGO — modelli, essenze e listino 2026
   Colonne listino: sbiancato → Rovere, pino → Pino,
   toulipier → Toulipier.
   ============================================================ */

// Tutte le essenze usano la texture 'universal' (venatura sottile +
// rilievo) tinta con il colore medio misurato dagli scan raw originali.
const ESSENZE = {
  rovere:    { label: 'Rovere',    en: 'Oak',       tonoChiaro: false, color: 0xa86948 },
  castagno:  { label: 'Castagno',  en: 'Chestnut',  tonoChiaro: false, color: 0xa2805a },
  toulipier: { label: 'Toulipier', en: 'Tulipwood', tonoChiaro: true,  color: 0xcdaf7b },
  pino:      { label: 'Pino',      en: 'Pine',      tonoChiaro: true,  color: 0xe8a05c },
};

// laccati: texture 'universal' (albedo neutro) + tinta RAL.
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

const state = {
  modello: 'liverpool',
  essenza: 'rovere',
  colore: 'nessuno',   // 'nessuno' = legno a vista; altrimenti chiave di LACCATI
  finitura: 'verniciata',
  ambiente: 'galleria',
  maniglia: 'ottone',
  // — misure e extra (listino 2025, pagg. 48–65) —
  w: 900, h: 2100, ante: 1,
  muro: 108, allargato: 'integrale',
  telaio: 'std',
  copriWood: 'toulipier', copri: 'listellare', copriMisura: null, manFinitura: null,
  apertura: 'battente', forma: 'diritta', sopraluce: 'no', mano: 'dx',
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
const COPRI = [
  { id: 'listellare',   label: 'Liscio listellare — compreso',      prezzi: { frassino: 0,     toulipier: 0,   pino: 0 }, img: 'assets/coprifili/liscio.png' },
  { id: 'massello',     label: 'Liscio massello',                    prezzi: { frassino: 43.5,  toulipier: 16,  pino: 3.5 }, img: 'assets/coprifili/liscio.png' },
  { id: 'pierre',       label: 'Pierre S1 (70/70)',                  prezzi: { frassino: 45,    toulipier: 30,  pino: 30 }, img: 'assets/coprifili/pierre.png' },
  { id: 'tintoretto',   label: 'Tintoretto (90/70)',                 prezzi: { frassino: 75,    toulipier: 60,  pino: 60 }, img: 'assets/coprifili/tintoretto.png' },
  { id: 'raffaello',    label: 'Raffaello-S (90/70)',                prezzi: { frassino: 75,    toulipier: 60,  pino: 60 }, img: 'assets/coprifili/raffaello.png' },
  { id: 'giotto',       label: 'Giotto S2 (90/70)',                  prezzi: { frassino: 65,    toulipier: 50,  pino: 50 }, img: 'assets/coprifili/giotto.png' },
  { id: 'leonardo',     label: 'Leonardo CS1-S2 (90/70)',            prezzi: { frassino: 65,    toulipier: 50,  pino: 50 }, img: 'assets/coprifili/leonardo.png' },
  { id: 'michelangelo', label: 'Michelangelo CS300 (90/70)',         prezzi: { frassino: 85,    toulipier: 70,  pino: 70 }, img: 'assets/coprifili/michelangelo.png' },
  { id: 'cartesio',     label: 'Cartesio CS207 (100/70)',            prezzi: { frassino: 85,    toulipier: 70,  pino: 70 }, img: 'assets/coprifili/cartesio.png' },
  { id: 'caravaggio',   label: 'Caravaggio CS206 (27×90)',           prezzi: { frassino: 125,   toulipier: 100, pino: 100 }, img: 'assets/coprifili/caravaggio.png' },
  { id: 'tiziano',      label: 'Tiziano CS204 (30×90)',              prezzi: { frassino: 125,   toulipier: 100, pino: 100 }, img: 'assets/coprifili/tiziano.png' },
  { id: 'canaletto',    label: 'Canaletto CS3 (34×90)',              prezzi: { frassino: 125,   toulipier: 100, pino: 100 }, img: 'assets/coprifili/canaletto.png' },
  { id: 'novecento',    label: 'Novecento CAP1 (42×110)',            prezzi: { frassino: 290,   toulipier: 250, pino: 250 }, img: 'assets/coprifili/novecento.png' },
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
const APERTURE = [
  { id: 'battente',   label: 'Battente (standard)',                          extra: 0 },
  { id: 'scomparsa',  label: 'Scorrevole a scomparsa nel muro',              extra: 85 },
  { id: 'est_muro',   label: 'Scorrevole esterno muro, guide a filo',        extra: 250 },
  { id: 'est_muro_m', label: 'Scorrevole esterno muro con mantovana',        extra: 250 },
  { id: 'int_telaio', label: 'Scorrevole interno telaio',                    extra: 165 },
  { id: 'magic',      label: 'Kit MAGIC (luce muro ≤ 800)',                  extra: 550 },
  { id: 'justor',     label: 'A ventola JUSTOR',                             extra: 200 },
  { id: 'ergon',      label: 'Rototraslante ERGON',                          extra: 550 },
  { id: 'koblenz',    label: 'A libro KOBLENZ',                              extra: 600 },
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

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewerEl.clientWidth, viewerEl.clientHeight);
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
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
key.shadow.mapSize.set(4096, 4096);
key.shadow.bias = -0.0003;
key.shadow.normalBias = 0.008;
key.shadow.radius = 3;
key.shadow.camera.left = key.shadow.camera.bottom = -4.5;
key.shadow.camera.right = key.shadow.camera.top = 4.5;
scene.add(key);

const fill = new THREE.DirectionalLight(0xffffff, 0.3);
fill.position.set(3, 2, 2.5);
scene.add(fill);

/* ============================================================
   TEXTURES PBR — caricamento pigro con cache
   ============================================================ */

const texLoader = new THREE.TextureLoader();
const texCache = {};
// ripetizione di default: vena in scala con la porta reale (~2 m)
const REPEAT = 6;

function loadSet(essenza) {
  if (texCache[essenza]) return texCache[essenza];
  const base = `assets/textures/${essenza}/`;
  const rep = (ESSENZE[essenza] && ESSENZE[essenza].repeat) || REPEAT;
  const load = (file, srgb) => {
    const t = texLoader.load(base + file);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rep, rep);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  texCache[essenza] = {
    map: load('albedo.jpg', true),
    normalMap: load('normal.jpg'),
    roughnessMap: load('roughness.jpg'),
    aoMap: load('ao.jpg'),
  };
  return texCache[essenza];
}

// materiale legno condiviso da pannello + marco (tutti i modelli)
const woodMat = new THREE.MeshStandardMaterial({
  roughness: 1,
  metalness: 0,
  normalScale: new THREE.Vector2(0.8, 0.8),
});

const hexLum = (hex) =>
  (0.2126 * ((hex >> 16) & 255) + 0.7152 * ((hex >> 8) & 255) + 0.0722 * (hex & 255)) / 255;

// materiale della maniglia/cerniere
const handleMat = new THREE.MeshStandardMaterial();

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
function applyMaterialLook() {
  const lacc = isLaccato();
  const raw = !lacc && state.finitura === 'grezza';
  const base = new THREE.Color(lacc ? LACCATI[state.colore].color : ESSENZE[state.essenza].color);
  if (raw) base.multiplyScalar(0.88);
  woodMat.color.copy(base);
  woodMat.roughness = lacc ? 0.42 : (raw ? 1 : 0.62);
  woodMat.envMapIntensity = lacc ? 0.9 : (raw ? 0.3 : 0.55);
  const ns = lacc ? 1.15 : (raw ? 1.25 : 1.05);
  woodMat.normalScale.set(ns, ns);
  woodMat.aoMapIntensity = raw ? 1.5 : 1.35;
}

function applyEssenza() {
  const set = loadSet('universal');
  woodMat.map = set.map;
  woodMat.normalMap = set.normalMap;
  woodMat.roughnessMap = set.roughnessMap;
  woodMat.aoMap = set.aoMap;
  applyMaterialLook();
  woodMat.needsUpdate = true;

  // porta chiara → sfondo scuro per contrasto
  const chiaro = isLaccato()
    ? hexLum(LACCATI[state.colore].color) > 0.35
    : ESSENZE[state.essenza].tonoChiaro;
  viewerEl.classList.toggle('is-dark', chiaro);
}

/* ============================================================
   MODELLO — caricamento GLB, perno di apertura, dimensioni
   ============================================================ */

const nodes = {};
let model = null;
let shadowPlane = null;
let currentModelKey = null;

// apertura della porta: perno sulle cerniere
let doorPivot = null;
let doorTargetAngle = 0;
let doorOpenAngle = 0;
let leafParts = [];
const doorBtn = document.getElementById('doorBtn');

function toggleDoor() {
  const opening = doorTargetAngle === 0;
  doorTargetAngle = opening ? doorOpenAngle : 0;
  // il pulsante è un'icona SVG: si cambia solo lo stato (l'icona ruota via CSS)
  doorBtn.classList.toggle('is-open', opening);
  doorBtn.title = opening ? 'Chiudi la porta / Close the door' : 'Apri la porta / Open the door';
  doorBtn.setAttribute('aria-label', opening ? 'Chiudi la porta' : 'Apri la porta');
}

const gltfLoader = new GLTFLoader();

// libera GPU: geometrie, materiali e texture del GLB precedente.
// I materiali condivisi (woodMat, handleMat) e le loro texture in cache
// NON si toccano — vengono riusati dal modello successivo.
function disposeMaterial(m) {
  if (!m || m === woodMat || m === handleMat) return;
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
  for (const k of Object.keys(nodes)) delete nodes[k];
  leafParts = [];
  doorTargetAngle = 0;
  doorBtn.hidden = true;
  doorBtn.classList.remove('is-open');
  doorBtn.title = 'Apri la porta / Open the door';
  // gli ambienti sono tagliati sulle misure della porta → si ricostruiscono
  for (const [k, g] of Object.entries(ambienti)) {
    scene.remove(g);
    delete ambienti[k];
  }
}

function loadModel(key) {
  currentModelKey = key;
  const def = MODELLI[key];
  clearModel();
  loaderEl.classList.remove('is-hidden');
  loaderFill.style.width = '0%';

  gltfLoader.load(
    def.file,
    (gltf) => {
      if (currentModelKey !== key) return; // il modello è cambiato nel frattempo
      model = gltf.scene;

      // i GLB sono in millimetri → normalizza a metri
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawH = rawBox.getSize(new THREE.Vector3()).y;
      if (rawH > 100) model.scale.setScalar(1 / 1000);

      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          if (o.material && o.material.name.startsWith('Mat_puerta')) {
            disposeMaterial(o.material); // texture 4K embebida nel GLB, non serve più
            o.material = woodMat;
          }
        }
      });

      for (const names of Object.values(def.nodi)) {
        for (const n of names) {
          const obj = model.getObjectByName(n);
          if (obj) nodes[n] = obj;
        }
      }

      // centra il modello e inquadra
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      scene.add(model);

      const dist = size.y * 2.0; // compensa il FOV più stretto
      camera.position.set(dist * 0.65, size.y * 0.12, dist);
      controls.target.set(0, 0, 0);
      controls.minDistance = dist * 0.5;
      controls.maxDistance = dist * 2.2;
      controls.update();

      // piano d'ombra (uno solo, riposizionato per modello)
      if (!shadowPlane) {
        shadowPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(8, 8),
          new THREE.ShadowMaterial({ opacity: 0.22 })
        );
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.receiveShadow = true;
        scene.add(shadowPlane);
      }
      shadowPlane.position.y = -size.y / 2 - 0.001;

      // maniglia con materiale configurabile
      const lockNode = nodes[def.lockNode];
      if (lockNode) lockNode.traverse((o) => {
        if (o.isMesh) { disposeMaterial(o.material); o.material = handleMat; }
      });

      // perno di apertura sul lato cerniere (opposto alla maniglia)
      scene.updateMatrixWorld(true);
      leafParts = def.leafNodes.map((n) => nodes[n]).filter(Boolean);
      const leafBox = new THREE.Box3();
      leafParts.forEach((p) => leafBox.expandByObject(p));
      const lockBox = new THREE.Box3().setFromObject(lockNode || leafParts[0]);
      const lockX = (lockBox.min.x + lockBox.max.x) / 2;
      const leafCX = (leafBox.min.x + leafBox.max.x) / 2;
      const hingeRight = lockX < leafCX;
      doorPivot = new THREE.Group();
      doorPivot.position.set(
        hingeRight ? leafBox.max.x : leafBox.min.x,
        0,
        (leafBox.min.z + leafBox.max.z) / 2
      );
      scene.add(doorPivot);
      leafParts.forEach((p) => doorPivot.attach(p));
      // 82°: ben aperta ma senza che il bordo libero "incomba" sulla camera
      doorOpenAngle = (hingeRight ? 1 : -1) * THREE.MathUtils.degToRad(82);
      doorBtn.hidden = false;

      applyEssenza();
      applyVisibility();
      doorDims = { w: size.x, h: size.y, floorY: -size.y / 2 };
      if (state.ambiente !== 'galleria') setAmbiente(state.ambiente);
      loaderEl.classList.add('is-hidden');
      refreshUI();
      window.__dbg = { scene, camera, model, size, center, nodes, renderer, doorPivot, toggleDoor, setModello };
    },
    (ev) => {
      if (ev.total) loaderFill.style.width = `${Math.round((ev.loaded / ev.total) * 100)}%`;
    },
    (err) => {
      loaderEl.querySelector('p').textContent = 'Errore nel caricamento del modello';
      console.error(err);
    }
  );
}

function applyVisibility() {
  // La porta si preventiva sempre completa: tutti i nodi visibili.
  const def = MODELLI[state.modello];
  for (const names of Object.values(def.nodi)) {
    for (const n of names) if (nodes[n]) nodes[n].visible = true;
  }
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
    floorTex = texLoader.load('assets/textures/pino/albedo.jpg');
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
}
window.addEventListener('resize', resize);

renderer.setAnimationLoop(() => {
  controls.update();
  if (doorPivot) {
    doorPivot.rotation.y += (doorTargetAngle - doorPivot.rotation.y) * 0.07;
  }
  renderer.render(scene, camera);
});

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
  if (ape.extra) righe.push({ k: `Apertura ${ape.label}`, sub: '', v: ape.extra });

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

// menu essenze: legni raw + laccati su base universal
const swatchesEl = document.getElementById('swatches');
const laccatiEl = document.getElementById('laccati');

function renderEssenze() {
  swatchesEl.innerHTML = Object.entries(ESSENZE).map(([k, e]) => `
    <button class="swatch" data-essenza="${k}">
      <span class="swatch-chip" style="background-image:url('assets/textures/universal/albedo.jpg');background-color:#${e.color.toString(16).padStart(6, '0')};background-blend-mode:multiply"></span>
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
    .addEventListener('change', (e) => { state.apertura = e.target.value; refreshUI(); });
  fillSelect('formaSelect', FORME, state.forma)
    .addEventListener('change', (e) => { state.forma = e.target.value; refreshUI(); });
  fillSelect('sopraluceSelect', SOPRALUCI, state.sopraluce)
    .addEventListener('change', (e) => { state.sopraluce = e.target.value; refreshUI(); });
  fillSelect('capitelloSelect', CAPITELLI, state.capitello)
    .addEventListener('change', (e) => { state.capitello = e.target.value; refreshUI(); });
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
    b.addEventListener('click', () => { state.mano = b.dataset.mano; refreshUI(); }));
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

  document.getElementById('cerniereAnim').src =
    `assets/aperture/${state.cerniere === 'scomparsa' ? 'cerniera_3d' : 'cerniera_anuba'}.svg`;

  // accessori: si mostra lo schema dell'ultimo acceso, uno alla volta
  const conSchema = ['riscontro', 'paraspiffero'];
  const acceso = conSchema.find((a) => state.acc[a]) || (state.nottolino ? 'nottolino' : null);
  document.getElementById('accAnimBox').hidden = !acceso;
  if (acceso) document.getElementById('accAnim').src = `assets/aperture/${acceso}.svg`;
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
  pillNoteEl.textContent = !isLaccato() ? ''
    : (laccatoExtra()
        ? `La laccatura è una verniciatura. Colore RAL: + ${eur.format(RAL_EXTRA)} (listino n. 50). `
        : 'La laccatura è una verniciatura. Bianco Tosco: compreso nel prezzo. ')
      + 'Scegliendo "Grezza" si torna al legno a vista.';

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
  panelSubEl.innerHTML = `${def.descIt} — <span class="en">${def.descEn}</span>`;
  modelloSelect.value = key;
  refreshUI();
  loadModel(key);
}

// modello: menu a tendina raggruppato per linea
const modelloSelect = document.getElementById('modelloSelect');

function renderModelli() {
  const groups = { Base: [], 100: [] };
  for (const [k, m] of Object.entries(MODELLI)) (groups[m.linea] || (groups[m.linea] = [])).push([k, m]);
  const byId = (a, b) => a[1].id - b[1].id;
  const opt = ([k, m]) => `<option value="${k}">${m.label} · ID ${m.id}</option>`;
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

const pdfMoney = (v) => eur.format(v).replace('€', 'EUR').trim();

// scatto dedicato per il PDF: solo la porta su bianco,
// inquadratura frontale con margine calcolato
function captureRender() {
  const hiddenGroups = [];
  for (const g of Object.values(ambienti)) {
    if (g.visible) { g.visible = false; hiddenGroups.push(g); }
  }

  const prevSize = new THREE.Vector2();
  renderer.getSize(prevSize);
  const cw = 900, ch = 1200;
  renderer.setSize(cw, ch, false);

  const h = doorDims ? doorDims.h : 2;
  const fov = 35;
  const cam = new THREE.PerspectiveCamera(fov, cw / ch, 0.05, 60);
  const dist = (h * 0.59) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  cam.position.set(0, 0, dist);
  cam.lookAt(0, 0, 0);
  renderer.render(scene, cam);

  const src = renderer.domElement;
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(src, 0, 0);

  renderer.setSize(prevSize.x, prevSize.y, false);
  hiddenGroups.forEach((g) => { g.visible = true; });
  renderer.render(scene, camera);

  return { dataURL: c.toDataURL('image/jpeg', 0.85), w: c.width, h: c.height };
}

function buildPDF(cliente, rif) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = 595, M = 48;
  const mod = MODELLI[state.modello];
  const prev = computePreventivo();
  const qty = Math.max(1, parseInt(cliente.quantita, 10) || 1);
  const unitTotal = prev.totale;
  const oggi = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  // — intestazione: logo ufficiale (fallback testuale se non caricato)
  if (logoData) {
    const lw = 150, lh = lw * (240 / 1048); // ~34pt, proporzioni del PNG
    doc.addImage(logoData, 'PNG', M, 44, lw, lh);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(141, 125, 106);
    doc.text('Porte in legno massello · Configuratore 3D', M, 44 + lh + 11);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(43, 33, 26);
    doc.text('T O S C O C O R N I C I', M, 58);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(141, 125, 106);
    doc.text('Porte in legno massello · Configuratore 3D', M, 70);
  }

  doc.setFontSize(9);
  doc.setTextColor(43, 33, 26);
  doc.text('RICHIESTA PREVENTIVO / QUOTE REQUEST', W - M, 52, { align: 'right' });
  doc.setTextColor(168, 132, 60);
  doc.text(`Rif. ${rif}`, W - M, 64, { align: 'right' });
  doc.setTextColor(141, 125, 106);
  doc.text(oggi, W - M, 76, { align: 'right' });

  doc.setDrawColor(43, 33, 26);
  doc.setLineWidth(0.8);
  doc.line(M, 90, W - M, 90);

  const section = (title, y) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(168, 132, 60);
    doc.text(title, M, y);
    doc.setDrawColor(220, 210, 195);
    doc.setLineWidth(0.5);
    doc.line(M, y + 5, W - M, y + 5);
  };

  const row = (k, v, y, x = M, keyW = 92) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(141, 125, 106);
    doc.text(k, x, y);
    doc.setTextColor(43, 33, 26);
    doc.text(String(v || '—'), x + keyW, y);
  };

  // — cliente
  let y = 112;
  section('CLIENTE / CUSTOMER', y);
  y += 20;
  row('Nome', cliente.nome, y);
  row('Telefono', cliente.telefono, y + 14);
  row('Email', cliente.email, y + 28);
  row('Indirizzo', cliente.indirizzo, y + 42);
  row('Città', `${cliente.citta}${cliente.cap ? ' · ' + cliente.cap : ''}${cliente.provincia ? ' (' + cliente.provincia + ')' : ''}`, y + 56);

  // — immagine della configurazione (colonna destra)
  const img = captureRender();
  const imgW = 235;
  const imgH = imgW * (img.h / img.w);
  doc.addImage(img.dataURL, 'JPEG', W - M - imgW, y - 6, imgW, imgH);
  doc.setDrawColor(220, 210, 195);
  doc.rect(W - M - imgW, y - 6, imgW, imgH);

  // — configurazione
  y = Math.max(y + 82, y - 6 + imgH + 24);
  section('CONFIGURAZIONE / CONFIGURATION', y);
  y += 20;
  row('Modello', `${mod.label} — ${mod.sub}`, y);
  row('Essenza', essenzaLabel(), y + 14);
  row('Finitura', `${FINITURA_LABEL[state.finitura]} / ${state.finitura === 'grezza' ? 'raw' : 'painted'}`, y + 28);
  row('Misure luce', `${state.w} × ${state.h} mm — ${state.ante === 1 ? '1 anta' : '2 ante'} · mano ${state.mano.toUpperCase()}`, y + 42);
  row('Muro', `${state.muro} mm`, y + 56);
  row('Quantità', `${qty} ${qty === 1 ? 'porta' : 'porte'} · maniglia fin. ${MANIGLIE[state.maniglia].label}`, y + 70);

  // — righe del preventivo
  y += 96;
  section('PREVENTIVO / QUOTE', y);
  y += 20;
  for (const r of prev.righe) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(43, 33, 26);
    doc.text(`${r.k}${r.sub ? ` — ${r.sub}` : ''}`, M, y, { maxWidth: W - 2 * M - 90 });
    doc.text(pdfMoney(r.v), W - M, y, { align: 'right' });
    y += 15;
  }
  doc.setDrawColor(43, 33, 26);
  doc.setLineWidth(0.8);
  doc.line(M, y, W - M, y);
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(43, 33, 26);
  doc.text('Totale unitario / Unit total', M, y);
  doc.text(pdfMoney(unitTotal), W - M, y, { align: 'right' });
  if (qty > 1) {
    y += 18;
    doc.text(`Totale (${qty} porte) / Grand total`, M, y);
    doc.text(pdfMoney(unitTotal * qty), W - M, y, { align: 'right' });
  }
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(141, 125, 106);
  doc.text('IVA esclusa · Prezzi di listino 2026 / VAT excluded · 2026 list prices', M, y);

  // — note del cliente (larghezza piena)
  if (cliente.note) {
    y += 26;
    section('NOTE DEL CLIENTE / CUSTOMER NOTES', y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(43, 33, 26);
    doc.text(doc.splitTextToSize(cliente.note, W - 2 * M), M, y);
  }

  // — piè di pagina
  doc.setFontSize(8);
  doc.setTextColor(141, 125, 106);
  doc.text(
    'Documento generato automaticamente dal Configuratore 3D Toscocornici e inoltrato a ordini@toscocornici.it',
    W / 2, 812, { align: 'center' }
  );
  return doc;
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

// logo ufficiale per l'intestazione del PDF preventivo
let logoData = null;
fetch('assets/logo_toscocornici.png')
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

  const doc = buildPDF(cliente, rif);
  doc.save(`Toscornici_Preventivo_${rif}.pdf`);

  // blocco ordine: assicura lo sfondo (riprova se il precarico era fallito)
  // e scarica con un piccolo ritardo — Chrome blocca i download multipli
  // simultanei, distanziarli evita il blocco nella maggior parte dei casi.
  const okBg = await ensureBloccoBg();
  const blocco = okBg ? buildBlocco(cliente, rif) : null;
  if (blocco) setTimeout(() => blocco.save(`Toscornici_Blocco_Ordine_${rif}.pdf`), 800);

  document.getElementById('doneRef').textContent = `Rif. ${rif}`;
  document.getElementById('doneFiles').innerHTML = blocco
    ? `Scaricati 2 PDF:<br>· <b>Toscornici_Preventivo_${rif}.pdf</b> — per il cliente<br>· <b>Toscornici_Blocco_Ordine_${rif}.pdf</b> — modulo TL_2018 per la fabbrica<br><span class="en">Se vedi un solo file, consenti i download multipli nel browser.</span>`
    : `Scaricato: <b>Toscornici_Preventivo_${rif}.pdf</b><br><span class="en">⚠ Blocco ordine non generato (modulo non raggiungibile) — riprova.</span>`;
  quoteFormView.hidden = true;
  quoteDoneView.hidden = false;
});

window.__pdf = { buildPDF, buildBlocco }; // hook di verifica

/* ============================================================
   AVVIO
   ============================================================ */

renderModelli();
renderEssenze();
renderExtras();
setManiglia(state.maniglia);
refreshUI();
loadModel(state.modello);
