// Aggiunge al catalogo le porte NUOVE di ~/Documents/JSON DOOR, senza toccare
// quelle che ci sono gia'.
//
// PERCHE' NON SI USA generate-catalog.mjs. Quello rigenera il catalogo da zero
// incrociando i tracciati con le schede .md del listino, e le schede stanno su
// una cartella Windows che qui non c'e'. Lanciarlo senza schede non lascia il
// catalogo com'e': lo SVUOTA, perche' un modello senza .md viene saltato. Lo
// dice la testata di js/catalogo.js, e oggi sono 38 i modelli che entrerebbero
// in quella trappola.
//
// Quindi questo strumento fa l'altra meta': aggiunge, non rigenera. I prezzi
// gia' caricati non li tocca nessuno. Quando le schede .md torneranno a essere
// raggiungibili, generate-catalog.mjs resta la fonte buona per i listini.
//
// Uso:
//   node tools/inyecta-porte.mjs              elenca cosa farebbe, senza scrivere
//   node tools/inyecta-porte.mjs --aplicar    scrive davvero
//   PORTE=/altra/cartella node tools/inyecta-porte.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { cajaDe } from '../js/motor/modelo/proyecto.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJ = path.resolve(__dirname, '..');
const PORTE_DIR = process.env.PORTE ?? path.join(os.homedir(), 'Documents', 'JSON DOOR');
const OUT_ASSETS = path.join(PROJ, 'assets', 'porte');
const CATALOGO = path.join(PROJ, 'js', 'catalogo.js');

const aplicar = process.argv.includes('--aplicar');
const ESSENZE = ['rovere', 'castagno', 'toulipier', 'pino'];
const COMPS = ['pannello', 'montanti', 'coprifili', 'serratura'];
const CAMPOS = new Set(['bugnato', 'bugnatoVetro', 'pannello', 'vetro', 'vetroSatinato']);

const clave = (file) => file
  .replace(/\.json$/i, '').replace(/\.puerta$/i, '')
  .toLowerCase().replace(/[^a-z0-9]/g, '');

// ---------------------------------------------------------------- catalogo

const testoCatalogo = fs.readFileSync(CATALOGO, 'utf8');
const inizio = testoCatalogo.indexOf('{', testoCatalogo.indexOf('export const MODELLI'));
const testata = testoCatalogo.slice(0, inizio);
const MODELLI = JSON.parse(testoCatalogo.slice(inizio, testoCatalogo.lastIndexOf('}') + 1));

/* I nomi delle porte GIA' in catalogo, letti dai file copiati e non dalle
   chiavi. Serve per non caricare due volte la stessa porta scritta in due modi:
   PAUSIANA.json e pausania.json sono lo stesso disegno con due ortografie, e
   con il solo confronto di chiave sarebbero entrate tutt'e due nel menu' del
   cliente. */
const nomiPresenti = new Map();
for (const f of fs.readdirSync(OUT_ASSETS).filter((f) => f.endsWith('.json'))) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(OUT_ASSETS, f), 'utf8'));
    if (d?.nombre) nomiPresenti.set(String(d.nombre).trim().toUpperCase(), f);
  } catch { /* un file illeggibile qui non deve fermare il resto */ }
}

// ------------------------------------------------------- che porta e' questa

/** Il tipo di porta, letto dai PAPELES del tracciato e non a mano.
    Stessa regola di generate-catalog.mjs, perche' le schede devono coincidere. */
function descrivi(piezas) {
  const vetro = piezas.some((p) => ['vetro', 'vetroSatinato'].includes(p.papel) || p.vidrioEnElCampo);
  const riquadri = piezas.filter((p) => ['vetro', 'vetroSatinato'].includes(p.papel)).length;
  const grigliato = riquadri >= 4;
  return {
    descIt: grigliato ? 'Porta vetrata con grigliato all’inglese'
      : vetro ? 'Porta con vano vetro' : 'Porta classica con bugne',
    descEn: grigliato ? 'Glazed door with English grille'
      : vetro ? 'Glazed panel door' : 'Classic panelled door',
  };
}

/**
 * Le ante, quando la porta e' gia' DISEGNATA in due.
 *
 * Si riconosce l'incontro fra due ante perche' li' non passa niente e muore un
 * montante per parte. E montante vuol dire che corre da cima a fondo: in un
 * pannello stretto anche un traverso e' piu' alto che largo, e chiedere solo
 * "piu' alto che largo" spezzava l'America Due in tre.
 *
 * Chi apre e chi no: se il disegno nomina la modanatura della maniglia, manda
 * quella. Se no manda la PROPORZIONE, che e' la regola di bottega — due ante
 * che aprono si dividono il vano a meta'. Misurato sulle 16 porte doppie del
 * catalogo: chi apre tutt'e due sta fra 0,996 e 0,998, chi ha un pannello fisso
 * fra 0,44 e 0,50. In mezzo non c'e' nessuno.
 */
function anteDi(piezas) {
  const con = piezas.map((p) => ({ p, c: cajaDe(p) }))
    .filter((e) => Number.isFinite(e.c[0]) && e.c[2] > e.c[0]);
  if (con.length < 4) return null;

  const x0 = Math.min(...con.map((e) => e.c[0]));
  const x1 = Math.max(...con.map((e) => e.c[2]));
  const y0 = Math.min(...con.map((e) => e.c[1]));
  const y1 = Math.max(...con.map((e) => e.c[3]));
  const ancho = x1 - x0;
  const alto = y1 - y0;
  if (!(ancho > 0) || !(alto > 0)) return null;

  const TOL = 0.5;
  const montante = (e) => !CAMPOS.has(e.p.papel)
    && e.c[3] - e.c[1] >= alto * 0.8
    && e.c[3] - e.c[1] > e.c[2] - e.c[0];

  /* Due montanti che si pestano di un pelo restano un incontro. Nella Liverpool
     Two i due montanti dell'incontro si sovrappongono di 3,6 mm invece di
     toccarsi di costa, e con la tolleranza di mezzo millimetro ciascuno contava
     come se ATTRAVERSASSE il taglio dell'altro: 1216 mm di porta uscivano come
     un'anta sola. Un calco fatto a mano non chiude a zero.
     Il perdono vale solo per i montanti a tutta altezza; campi e traversi
     tengono la tolleranza stretta, perche' sono loro a dire che li' non si
     puo' tagliare. */
  const SOLAPE = 5;
  const holgura = (e) => (montante(e) ? SOLAPE : TOL);

  const tagli = [];
  for (const x of [...new Set(con.flatMap((e) => [e.c[0], e.c[2]]))].sort((a, b) => a - b)) {
    const f = (x - x0) / ancho;
    if (f < 0.2 || f > 0.8) continue;
    if (con.some((e) => e.c[0] < x - holgura(e) && e.c[2] > x + holgura(e))) continue;
    if (!con.some((e) => Math.abs(e.c[2] - x) <= SOLAPE && montante(e))) continue;
    if (!con.some((e) => Math.abs(e.c[0] - x) <= SOLAPE && montante(e))) continue;
    if (tagli.length && x - tagli[tagli.length - 1] < 20) continue;
    tagli.push(x);
  }
  if (!tagli.length) return null;

  const limiti = [x0, ...tagli, x1];
  const bande = [];
  for (let i = 0; i + 1 < limiti.length; i++) {
    const a = limiti[i];
    const b = limiti[i + 1];
    const ultima = i + 2 === limiti.length;
    const dentro = con.filter((e) => {
      const medio = (e.c[0] + e.c[2]) / 2;
      return medio >= a && (medio < b || ultima);
    });
    if (!dentro.length) return null;
    bande.push({ larghezza: b - a, pezzi: dentro });
  }

  const conChapa = bande.map((b) => b.pezzi.some((e) => /chapa/i.test(String(e.p.nombre ?? ''))));
  const hayChapas = conChapa.some(Boolean);
  const maggiore = Math.max(...bande.map((b) => b.larghezza));
  const apre = bande.map((b, i) => (hayChapas ? conChapa[i] : b.larghezza >= maggiore * 0.85));

  return {
    ante: bande.length,
    larghezze: bande.map((b) => Math.round(b.larghezza)),
    apre,
  };
}

// -------------------------------------------------------------------- listino

/** Listino a zero: la porta entra in vetrina, il prezzo arriva con la scheda. */
function listinoVuoto() {
  const zero = () => Object.fromEntries(COMPS.map((c) => [c, 0]));
  const out = {};
  for (const e of ESSENZE) out[e] = { grezza: zero(), verniciata: zero() };
  out.laccato = { verniciata: zero() };
  return out;
}

// ----------------------------------------------------------------- lavoro

const nuove = [];
const saltate = [];

for (const file of fs.readdirSync(PORTE_DIR).filter((f) => f.toLowerCase().endsWith('.json')).sort()) {
  const key = clave(file);
  const etichetta = file.replace(/\.json$/i, '').replace(/\.puerta$/i, '');

  if (MODELLI[key]) { saltate.push(`${etichetta} — gia' in catalogo`); continue; }

  let doc;
  try { doc = JSON.parse(fs.readFileSync(path.join(PORTE_DIR, file), 'utf8')); }
  catch (e) { saltate.push(`${etichetta} — JSON illeggibile: ${e.message}`); continue; }

  const piezas = (doc.piezas ?? []).filter((p) => p.visible !== false);
  if (!piezas.length) { saltate.push(`${etichetta} — nessun pezzo tracciato`); continue; }

  /* Il confronto e' contro le ALTRE porte, non contro se stessa. Il file
     <chiave>.json di questa porta puo' essere gia' li' da una passata
     precedente — e se quella passata era andata storta, rilanciare lo strumento
     e' esattamente quello che si vuole fare. Confrontando anche con quello, la
     porta si escludeva da sola: la prima volta scriveva, la seconda diceva
     "e' un doppione di me stessa" e non rifaceva piu' niente. */
  const nome = String(doc.nombre ?? '').trim().toUpperCase();
  const gemella = nome ? nomiPresenti.get(nome) : null;
  if (gemella && gemella !== `${key}.json`) {
    saltate.push(`${etichetta} — stesso disegno di ${gemella} (nome interno "${nome}")`);
    continue;
  }

  /* Si copia SENZA l'immagine di riferimento: e' il calco su cui si e'
     tracciato, pesa il 95 % del file e sarebbe regalare al cliente il disegno
     di fabbrica. Stessa scelta di generate-catalog.mjs. */
  const { imagen, ...limpio } = doc;
  const testo = JSON.stringify(limpio);
  const hash = crypto.createHash('md5').update(testo).digest('hex').slice(0, 8);
  const { descIt, descEn } = descrivi(piezas);
  const ante = anteDi(piezas);

  nuove.push({
    key,
    file: `${key}.json`,
    testo,
    entry: {
      label: etichetta.replace(/\s+/g, ' ').trim(),
      id: null,
      linea: 'Da prezzare',
      sub: 'Senza scheda di listino',
      descIt,
      descEn,
      file: `assets/porte/${key}.json?v=${hash}`,
      pezzi: piezas.length,
      /* Quante ante ha e quali aprono, letto dal disegno. Oggi il 3D del
         configuratore monta un'anta sola e questo campo non lo guarda nessuno;
         si scrive lo stesso perche' e' il dato, e quando il motore imparera' le
         due ante sara' gia' qui invece di doverlo ricavare a mano. */
      ...(ante ? { ante: ante.ante, larghezze: ante.larghezze, apre: ante.apre } : {}),
      /* SENZA QUESTI DUE LA PORTA ROMPE IL CONFIGURATORE. currentPrices() fa
         MODELLI[modello].listino[essenza][finitura] senza rete: se `listino`
         manca, il pannello del preventivo esplode con "Cannot read properties
         of undefined" appena si sceglie il modello. La porta si vedeva lo
         stesso in 3D, e per questo l'errore passava inosservato guardando
         soltanto l'immagine.
         Vanno vuoti, non assenti: la porta entra in vetrina e il prezzo arriva
         quando arriva la scheda .md. E' la stessa forma delle 38 gia' entrate
         cosi' — vedi "carrara" in js/catalogo.js. */
      componenti: [],
      listino: listinoVuoto(),
    },
  });
}

// ------------------------------------------------------------------ resoconto

console.log(`Cartella:  ${PORTE_DIR}`);
console.log(`In catalogo ora: ${Object.keys(MODELLI).length} modelli\n`);

if (!nuove.length) console.log('Niente da aggiungere.');
else {
  console.log(`DA AGGIUNGERE (${nuove.length}):`);
  for (const n of nuove) {
    const a = n.entry.ante
      ? `  ${n.entry.ante} ante ${n.entry.larghezze.join('+')} mm — ${n.entry.apre.map((v) => (v ? 'apre' : 'FISSA')).join(', ')}`
      : '  un\'anta';
    console.log(`  + ${n.entry.label.padEnd(20)} ${String(n.entry.pezzi).padStart(2)} pezzi${a}`);
  }
}
if (saltate.length) console.log(`\nSaltate (${saltate.length}):\n  ${saltate.join('\n  ')}`);

if (!aplicar) {
  console.log('\nProva in bianco. Per scrivere davvero:  node tools/inyecta-porte.mjs --aplicar');
  process.exit(0);
}

for (const n of nuove) {
  fs.writeFileSync(path.join(OUT_ASSETS, n.file), n.testo);
  MODELLI[n.key] = n.entry;
}
fs.writeFileSync(CATALOGO, `${testata}${JSON.stringify(MODELLI, null, 2)};\n`);
console.log(`\nScritte ${nuove.length} porte. Catalogo: ${Object.keys(MODELLI).length} modelli.`);
