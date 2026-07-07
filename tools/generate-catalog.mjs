// Generatore del catalogo: incrocia i GLB (Assets doors) con le schede
// .md (manual-configurador/modelos) e produce js/catalogo.js + copia i GLB.
// Uso:  node tools/generate-catalog.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJ = path.resolve(__dirname, '..');
const GLB_DIR = 'C:/Users/Julic/OneDrive/Escritorio/Toscornici/Assets doors';
const MD_DIR = 'C:/Users/Julic/OneDrive/Escritorio/Toscornici/manual-configurador/modelos';
const OUT_ASSETS = path.join(PROJ, 'assets');
const OUT_CATALOG = path.join(PROJ, 'js', 'catalogo.js');

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
  // componenti = unione (grezza è il superset); verniciata eredita i mancanti
  const ids = COMP_ORDER.filter((id) => perFin.grezza[id] || perFin.verniciata[id]);
  for (const id of ids) {
    if (!perFin.verniciata[id] && perFin.grezza[id]) perFin.verniciata[id] = perFin.grezza[id];
  }
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

function parseGlbNodes(file) {
  const buf = fs.readFileSync(file);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen));
  return (json.nodes || []).map((n) => n.name).filter(Boolean);
}

function classifyNodes(names, warnings, tag) {
  const leaf = [], glass = [];
  let marco = null, lock = null;
  for (const name of names) {
    const n = name.toLowerCase();
    if (name === 'Empty') continue;
    if (n.includes('cerradura')) lock = name;
    else if (n.includes('cristal') || n.includes('ventana')) glass.push(name);
    else if (n.includes('marco')) marco = name;
    else leaf.push(name);
  }
  if (!marco) warnings.push(`${tag}: nodo marco non trovato`);
  if (!lock) warnings.push(`${tag}: nodo cerradura non trovato`);
  if (!leaf.length) warnings.push(`${tag}: nodo anta non trovato`);
  return { leaf, glass, marco, lock };
}

// ------------------------------------------------------------------
const warnings = [];
const modelli = {};
const skipped = [];

const glbs = fs.readdirSync(GLB_DIR).filter((f) => f.toLowerCase().endsWith('.glb'));
const mds = fs.readdirSync(MD_DIR).filter((f) => f.endsWith('.md'));

for (const glb of glbs.sort()) {
  const full = path.join(GLB_DIR, glb);
  const size = fs.statSync(full).size;
  const rawName = glb.replace(/^PUERTA\d+_/, '').replace(/\.glb$/i, ''); // "NEW JERSEY"
  if (size < 10000) { skipped.push(`${glb} (file corrotto: ${size} B)`); continue; }
  const slug = rawName.toLowerCase().replace(/\s+/g, '-');
  const md = mds.find((f) => new RegExp(`^\\d+-${slug}\\.md$`).test(f));
  if (!md) { skipped.push(`${glb} (nessuna scheda .md per "${slug}")`); continue; }

  const info = parseMd(path.join(MD_DIR, md));
  const { componenti, listino } = buildComponents(info, warnings);
  const nodeNames = parseGlbNodes(full);
  const cls = classifyNodes(nodeNames, warnings, rawName);

  const nodi = {
    pannello: [...cls.leaf, ...cls.glass],
    montanti: cls.marco ? [cls.marco] : [],
    serratura: cls.lock ? [cls.lock] : [],
  };
  for (const c of componenti) if (!nodi[c.id]) nodi[c.id] = [];

  const hasVetro = cls.glass.length > 0;
  const hasGrigliato = componenti.some((c) => c.id === 'grigliato');
  const descIt = hasGrigliato ? 'Porta vetrata con grigliato all’inglese'
    : hasVetro ? 'Porta con vano vetro'
    : 'Porta classica con bugne';
  const descEn = hasGrigliato ? 'Glazed door with English grille'
    : hasVetro ? 'Glazed panel door'
    : 'Classic panelled door';

  const key = slug.replace(/-/g, '');
  const outFile = glb.replace(/\s+/g, '_');
  fs.copyFileSync(full, path.join(OUT_ASSETS, outFile));
  // hash del contenuto nella URL: il browser riscarica solo se il GLB cambia
  const hash = crypto.createHash('md5').update(fs.readFileSync(full)).digest('hex').slice(0, 8);

  const lineaTag = info.linea === 'BASE' ? 'Base' : info.linea;
  modelli[key] = {
    label: info.name,
    id: info.id,
    linea: lineaTag,
    sub: `Linea ${lineaTag} · ID ${info.id}`,
    descIt, descEn,
    file: `assets/${outFile}?v=${hash}`,
    nodi,
    leafNodes: [...cls.leaf, ...cls.glass, ...(cls.lock ? [cls.lock] : [])],
    lockNode: cls.lock,
    componenti,
    listino,
  };
}

const banner = `// GENERATO AUTOMATICAMENTE da tools/generate-catalog.mjs — non modificare a mano.
// Fonte: Assets doors (GLB) + manual-configurador/modelos (.md). Rigenerare con:
//   node tools/generate-catalog.mjs
`;
fs.writeFileSync(OUT_CATALOG, `${banner}export const MODELLI = ${JSON.stringify(modelli, null, 2)};\n`);

console.log(`Modelli generati: ${Object.keys(modelli).length}`);
console.log(Object.values(modelli).map((m) => `  ${m.label} (ID ${m.id}, Linea ${m.linea}, ${m.componenti.length} comp)`).join('\n'));
if (skipped.length) console.log(`\nSaltati:\n  ${skipped.join('\n  ')}`);
if (warnings.length) console.log(`\nAvvisi:\n  ${warnings.join('\n  ')}`);
else console.log('\nNessun avviso: tutte le somme quadrano con PUERTA COMPLETA.');
