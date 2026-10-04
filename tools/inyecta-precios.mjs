// Inyecta los precios del listino en js/catalogo.js:
//  1. a los modelos que estan A CERO les pone los precios de su ficha;
//  2. a TODOS les deja la verniciata exactamente como el listino (sin heredar
//     de la grezza la serratura ni el fermavetro, decision del 3 oct 2026).
//     La grezza de los que ya tenian precio no se toca.
//
// Por que no basta con tools/generate-catalog.mjs: el generador rehace el
// catalogo entero desde los trazados y SALTA los modelos sin ficha .md, asi que
// regenerar los haria desaparecer. Y lleva rutas del ordenador con Windows.
// Esto hace solo lo que hace falta: a cada modelo con el listino a cero le pone
// los precios de su ficha, con la MISMA logica del generador (las funciones de
// abajo estan copiadas de alli tal cual). Los modelos que ya tienen precio no se
// tocan: algunos llevan ajustes propios.
//
// Las fichas se comprobaron contra listino_2025 MASSELLO.pdf componente a
// componente antes de inyectar (773 coincidencias, 0 diferencias en precios).
//
// Uso:  node tools/inyecta-precios.mjs          (escribe js/catalogo.js)
//       node tools/inyecta-precios.mjs --prueba (solo dice lo que haria)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJ = path.resolve(__dirname, '..');
const CATALOGO = path.join(PROJ, 'js', 'catalogo.js');
const CANDIDATAS = [
  process.env.MD_DIR,
  '/Users/julian/Documents/Toscocornici /manual-configurador/modelos',
  'C:/Users/Julic/OneDrive/Escritorio/Toscornici/manual-configurador/modelos',
].filter(Boolean);
const MD_DIR = CANDIDATAS.find((d) => fs.existsSync(d));
if (!MD_DIR) throw new Error('No encuentro la carpeta de fichas .md (manual-configurador/modelos). Pasa MD_DIR=...');
const PRUEBA = process.argv.includes('--prueba');

// ---------------------------------------------------------------- del generador
const ESSENZE_COLS = ['rovere', 'castagno', 'toulipier', 'pino'];

const COMP_META = {
  pannello:  { it: 'Pannello porta', en: 'Door panel', desc: '' },
  montanti:  { it: 'Montanti per telaio', en: 'Jambs for frame', desc: 'Spessore mm 44' },
  coprifili: { it: 'Coprifili', en: 'Architraves', desc: 'Set completo per lato' },
  grigliato: { it: 'Grigliato all’inglese', en: 'English grille', desc: 'Suddivisione del vetro' },
  fermavetro:{ it: 'Montaggio cornici fermavetro', en: 'Mounting beadings', desc: 'Posa in opera' },
  serratura: { it: 'Anube e serratura', en: 'Hinge and lock', desc: 'Finitura configurabile' },
};
const COMP_ORDER = ['pannello', 'montanti', 'coprifili', 'grigliato', 'fermavetro', 'serratura'];

const PANEL_DESC = [
  [/montantes\s*\+\s*bugnas\s*\+\s*hueco vidrio sup/i, 'Montanti + bugne + vano vetro superiore'],
  [/montantes\s*\+\s*hueco vidrio entero/i, 'Montanti + vano vetro intero'],
  [/montantes\s*\+\s*bugnas/i, 'Montanti + bugne'],
];

function classifyLabel(label) {
  const l = label.toLowerCase();
  if (l.startsWith('coprifiles')) return 'coprifili';
  if (l.startsWith('montantes de marco')) return 'montanti';
  if (l.startsWith('bisagras')) return 'serratura';
  if (l.startsWith('montaje de junquillos')) return 'fermavetro';
  if (l.startsWith('rejilla')) return 'grigliato';
  if (l.includes('solo montantes')) return 'pannello_montanti';
  if (l.includes('solo bugnas')) return 'pannello_bugne';
  if (l.startsWith('panel')) return 'pannello';
  return null;
}

function parsePrice(cell) {
  const m = cell.match(/€\s*([\d.]+),(\d+)/);
  if (!m) return null;
  return Number(m[1].replace(/\./g, '')) + Number(m[2]) / 100;
}

function parseMd(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const out = { name: null, id: null, linea: null, tables: { grezza: { rows: [], total: null }, verniciata: { rows: [], total: null } } };
  const t = lines[0].match(/^#\s*(.+?)\s*—\s*ID\s*(\d+)/);
  if (t) { out.name = t[1].trim(); out.id = Number(t[2]); }
  const li = text.match(/\*\*Linea:\*\*\s*LINEA\s+(\S+)/i);
  if (li) out.linea = li[1].toUpperCase(); // '100' | 'BASE'
  let fin = null;
  for (const line of lines) {
    if (/\*\*Acabado GREZZA/i.test(line)) { fin = 'grezza'; continue; }
    if (/\*\*Acabado VERNICIATA/i.test(line)) { fin = 'verniciata'; continue; }
    if (!fin || !line.startsWith('|')) continue;
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 6 || cells[1].startsWith('---') || /^Componente/i.test(cells[1])) continue;
    const prices = {};
    ESSENZE_COLS.forEach((e, i) => { prices[e] = parsePrice(cells[2 + i]); });
    if (Object.values(prices).some((v) => v === null)) continue;
    if (/PUERTA COMPLETA/i.test(cells[1])) { out.tables[fin].total = prices; continue; }
    out.tables[fin].rows.push({ label: cells[1].replace(/\*\*/g, ''), prices });
  }
  return out;
}

function buildComponents(md, warnings) {
  // per finitura: comp id -> prices (le righe "solo montantes/bugnas" si sommano in pannello)
  const perFin = {};
  let panelDesc = 'Pannello completo';
  for (const fin of ['grezza', 'verniciata']) {
    const acc = {};
    for (const row of md.tables[fin].rows) {
      const cls = classifyLabel(row.label);
      if (!cls) { warnings.push(`${md.name}: riga sconosciuta "${row.label}"`); continue; }
      const id = cls.startsWith('pannello') ? 'pannello' : cls;
      if (cls === 'pannello') {
        const pd = PANEL_DESC.find(([re]) => re.test(row.label));
        if (pd) panelDesc = pd[1];
      }
      if (cls === 'pannello_montanti' || cls === 'pannello_bugne') {
        panelDesc = 'Montanti sp. 45 mm + bugne sp. 22 mm';
      }
      if (!acc[id]) acc[id] = { rovere: 0, castagno: 0, toulipier: 0, pino: 0 };
      for (const e of ESSENZE_COLS) acc[id][e] += row.prices[e];
    }
    perFin[fin] = acc;
  }
  // componenti = unione (grezza è il superset).
  /* LA VERNICIATA NON EREDITA NIENTE DALLA GREZZA. Prima le righe che la
     tabella verniciata non elenca (anube e serratura, montaggio fermavetro e
     a volte il grigliato) si copiavano dalla grezza, e la porta verniciata
     usciva sopra il listino: +20 € quasi ovunque, +51 € con il fermavetro,
     fino a +838 € nella Laguna Lux. Il listino è chiaro: la "Porta completa"
     verniciata è il prezzo, e le sue righe sommano esattamente quello. Quel
     che manca vale zero. Deciso con Julián il 3 ott 2026. */
  const ids = COMP_ORDER.filter((id) => perFin.grezza[id] || perFin.verniciata[id]);
  // verifica somme contro PUERTA COMPLETA
  for (const fin of ['grezza', 'verniciata']) {
    const total = md.tables[fin].total;
    if (!total) { warnings.push(`${md.name}: manca il totale ${fin}`); continue; }
    // somma solo le righe presenti nella tabella originale
    const present = Object.keys(perFin[fin]).filter((id) =>
      fin === 'grezza' || COMP_ORDER.includes(id));
    for (const e of ESSENZE_COLS) {
      const sum = md.tables[fin].rows.reduce((s, r) => s + r.prices[e], 0);
      if (Math.abs(sum - total[e]) > 0.01) {
        warnings.push(`${md.name} ${fin} ${e}: somma ${sum} ≠ totale ${total[e]}`);
      }
    }
  }
  const componenti = ids.map((id) => ({
    id,
    it: COMP_META[id].it,
    en: COMP_META[id].en,
    desc: id === 'pannello' ? panelDesc : COMP_META[id].desc,
  }));
  // listino: essenza -> finitura -> comp -> prezzo
  const listino = {};
  for (const e of ESSENZE_COLS) {
    listino[e] = {};
    for (const fin of ['grezza', 'verniciata']) {
      listino[e][fin] = {};
      for (const id of ids) listino[e][fin][id] = perFin[fin][id] ? perFin[fin][id][e] : 0;
    }
  }
  listino.laccato = { verniciata: listino.toulipier.verniciata };
  return { componenti, listino };
}

// ----------------------------------------------------------------------------

/* Nombre de la ficha -> clave del catalogo: "1600-la-spezia.md" -> "laspezia",
   "SIN-ID-cosenza.md" -> "cosenza". Nombre ENTERO, como el generador: con un
   sufijo "king-tamigi" tambien acabaria en "tamigi" y la Tamigi sencilla se
   llevaria el precio de la doble. */
const claveDeFicha = (f) => f.replace(/\.md$/, '').replace(/^\d+-/, '').replace(/^SIN-ID-/i, '').toLowerCase().replace(/-/g, '');

const aCero = (l) => !l || !Object.values(l).some((e) => Object.values(e ?? {}).some((f) => Object.values(f ?? {}).some((v) => v > 0)));

const texto = fs.readFileSync(CATALOGO, 'utf8');
const i = texto.indexOf('export const MODELLI = ');
const cabecera = texto.slice(0, i);
const { MODELLI } = await import(CATALOGO + '?v=' + Date.now());

const fichas = new Map(fs.readdirSync(MD_DIR).filter((f) => f.endsWith('.md')).map((f) => [claveDeFicha(f), f]));
/* Fichas guardadas con el nombre mal escrito: la de Pausania se llama
   "1400-pausiana.md" (el listino y el catalogo dicen Pausania). */
const ALIAS = { pausania: 'pausiana' };
for (const [clave, ficha] of Object.entries(ALIAS)) if (!fichas.has(clave) && fichas.has(ficha)) fichas.set(clave, fichas.get(ficha));
const warnings = [];
const hechos = [];
const sinFicha = [];
const verniciataCambiada = [];
const grezzaDistinta = [];
let intactos = 0;
const suma = (o) => Object.values(o).reduce((a, b) => a + b, 0);
for (const [clave, m] of Object.entries(MODELLI)) {
  const f = fichas.get(clave);
  if (!f) { if (aCero(m.listino)) sinFicha.push(clave); continue; }
  const info = parseMd(path.join(MD_DIR, f));
  const { componenti, listino } = buildComponents({ ...info, name: info.name ?? m.label }, warnings);
  if (aCero(m.listino)) {
    const lineaTag = info.linea === 'BASE' ? 'Base' : info.linea;
    m.id = info.id ?? null;
    m.linea = lineaTag;
    m.sub = `Linea ${lineaTag} · ${info.id ? `ID ${info.id}` : 'senza ID'}`;
    m.componenti = componenti;
    m.listino = listino;
    hechos.push(`${clave.padEnd(16)} <- ${f.padEnd(28)} ${lineaTag.padEnd(6)} rovere grezza ${suma(listino.rovere.grezza)} / verniciata ${suma(listino.rovere.verniciata)}`);
    continue;
  }
  /* Los que ya tenian precio: su grezza se respeta tal cual; solo se comprueba
     que sigue siendo la de la ficha. Y la verniciata pasa a ser la del listino. */
  intactos++;
  for (const e of ESSENZE_COLS) {
    if (JSON.stringify(m.listino[e]?.grezza) !== JSON.stringify(listino[e].grezza)) grezzaDistinta.push(`${clave}:${e}`);
    const antes = suma(m.listino[e].verniciata);
    const nueva = {};
    for (const id of Object.keys(m.listino[e].verniciata)) nueva[id] = listino[e].verniciata[id] ?? 0;
    m.listino[e].verniciata = nueva;
    if (Math.abs(antes - suma(nueva)) > 0.001) verniciataCambiada.push(`${clave}:${e} ${antes}->${suma(nueva)}`);
  }
  if (m.listino.laccato) m.listino.laccato = { verniciata: m.listino.toulipier.verniciata };
}

console.log(`Ficha: ${MD_DIR}`);
console.log(`Modelos que ya tenian precio: ${intactos} (grezza intacta; verniciata al listino en ${new Set(verniciataCambiada.map((x) => x.split(':')[0])).size})`);
if (grezzaDistinta.length) console.log(`OJO, grezza distinta de su ficha (no se toca): ${grezzaDistinta.join(', ')}`);
console.log(`Modelos rellenados: ${hechos.length}`);
for (const h of hechos) console.log('  ' + h);
if (sinFicha.length) console.log(`A cero y SIN ficha (siguen a cero): ${sinFicha.join(', ')}`);
if (warnings.length) { console.log('Avisos de las fichas:'); for (const w of warnings) console.log('  ' + w); }

if (!PRUEBA) {
  /* La cabecera dice "generato da generate-catalog.mjs": se le añade una linea
     para que quien regenere sepa que estos precios entraron por aqui. */
  const nota = cabecera.includes('inyecta-precios.mjs') ? '' :
    '// Precios de los modelos que estaban a cero: tools/inyecta-precios.mjs (listino 2025).\n';
  fs.writeFileSync(CATALOGO, cabecera + nota + 'export const MODELLI = ' + JSON.stringify(MODELLI, null, 2) + ';\n');
  console.log('js/catalogo.js escrito.');
}
