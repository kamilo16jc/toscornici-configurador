/* ============================================================
   La prova che conta: FOTO VERE.
   ------------------------------------------------------------
   Le altre due prove non chiamano l'API e non costano niente, ma
   lavorano su render puliti. Questa fa il caso reale: una foto fatta
   col telefono, storta, con la luce che c'e'.

   USO
     1. metti le foto in una cartella, chiamandole col nome del
        modello che ritraggono:
             emilia-01.jpg   emilia-02.jpg   country-01.jpg
        (quello che sta prima del trattino e' l'id del catalogo)
     2. metti la chiave nell'ambiente:
             set ANTHROPIC_API_KEY=sk-ant-...
     3. lancia:
             node functions/prova-foto.js C:\percorso\alle\foto

   Costa una chiamata per foto. Dieci foto sono pochi centesimi.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { classifica, rosa } = require('./accoppia');

const CARTELLA = process.argv[2];
if (!CARTELLA) {
  console.error('Manca la cartella delle foto.');
  console.error('  node functions/prova-foto.js C:\\percorso\\alle\\foto');
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY non e\' nell\'ambiente.');
  console.error('  set ANTHROPIC_API_KEY=sk-ant-...');
  process.exit(1);
}

const REPO = path.join(__dirname, '..');
const MAPPA = JSON.parse(
  fs.readFileSync(path.join(REPO, 'assets/catalogo-mappa.json'), 'utf8'),
).modelli;

const VIETATI = new Set(['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
  'multipleOf', 'minLength', 'maxLength', 'minItems', 'maxItems', 'uniqueItems', 'pattern']);
const pulisci = (n) => {
  if (Array.isArray(n)) return n.map(pulisci);
  if (n && typeof n === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(n)) {
      if (VIETATI.has(k) || k.startsWith('_')) continue;
      out[k] = pulisci(v);
    }
    return out;
  }
  return n;
};
const SCHEMA = pulisci(JSON.parse(
  fs.readFileSync(path.join(REPO, 'tools/mappa-schema.json'), 'utf8'),
));

// le stesse istruzioni della funzione vera: se qui si prova qualcosa
// di diverso, la prova non dice niente sulla funzione
const ISTRUZIONI = `Guardi la foto di una porta interna scattata da un cliente e ne compili la scheda.

La foto puo' essere storta, scura, parziale o presa da lontano: descrivi
SOLO quello che riesci a vedere davvero. Non dedurre, non completare con
quello che di solito hanno le porte, non indovinare il modello.

Se l'immagine non permette di leggere un campo, usa il valore che lo
dichiara ('non_leggibile') invece di scegliere il piu' probabile. E se
la foto e' storta, sfocata o mostra solo un pezzo di porta, dichiara
fiducia 'bassa'.

Guarda con attenzione questi, che sono quelli che contano:
- testa: la parte alta del disegno e' dritta o ad arco?
- riquadri_disposizione: due riquadri uno SOPRA l'altro non e' la stessa
  cosa di due AFFIANCATI.
- riquadri_numero: quanti pannelli incorniciati. Il vetro non conta.
- vetro: quanto vetro c'e', e dove.`;

const TIPI = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

async function main() {
  const file = fs.readdirSync(CARTELLA)
    .filter((f) => TIPI[path.extname(f).toLowerCase()])
    .sort();
  if (!file.length) {
    console.error('Nessuna foto in', CARTELLA);
    process.exit(1);
  }

  const client = new Anthropic();
  const esiti = [];
  let tin = 0;
  let tout = 0;

  console.log(`Foto da provare: ${file.length}`);
  console.log('');

  for (const f of file) {
    const atteso = path.basename(f, path.extname(f)).split(/[-_.]/)[0].toLowerCase();
    const noto = MAPPA.some((m) => m.id === atteso);
    const dati = fs.readFileSync(path.join(CARTELLA, f)).toString('base64');

    let scheda;
    let uso;
    try {
      const r = await client.messages.create({
        model: 'claude-opus-5',
        max_tokens: 3000,
        output_config: { format: { type: 'json_schema', schema: SCHEMA } },
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: TIPI[path.extname(f).toLowerCase()], data: dati } },
            { type: 'text', text: ISTRUZIONI },
          ],
        }],
      });
      if (r.stop_reason === 'refusal') throw new Error('rifiutata dai classificatori');
      scheda = JSON.parse(r.content.find((b) => b.type === 'text').text);
      uso = r.usage;
      tin += uso.input_tokens;
      tout += uso.output_tokens;
    } catch (e) {
      console.log(`  ${f.padEnd(24)} FALLITA: ${e.message}`);
      continue;
    }

    const ordinati = classifica(scheda, MAPPA);
    const esito = rosa(scheda, MAPPA);
    const posto = noto ? ordinati.findIndex((m) => m.id === atteso) + 1 : null;

    const primi = ordinati.slice(0, 3)
      .map((m) => `${m.nome} ${(m.punto * 100).toFixed(0)}%`).join(' | ');

    let giudizio;
    if (!noto) giudizio = `(id "${atteso}" non e' in catalogo: non valutata)`;
    else if (posto === 1) giudizio = 'PRIMA';
    else if (posto <= 3) giudizio = `nelle prime tre (${posto}a)`;
    else if (posto <= 5) giudizio = `nelle prime cinque (${posto}a)`;
    else giudizio = `FUORI (${posto}a)`;

    console.log(`  ${f.padEnd(24)} ${giudizio}`);
    console.log(`      proposte: ${primi}`);
    console.log(`      lettura:  vetro=${scheda.vetro} testa=${scheda.testa} `
      + `riquadri=${scheda.riquadri_numero} ${scheda.riquadri_disposizione} `
      + `fiducia=${scheda.fiducia}`);
    if (!esito.trovato) console.log('      -> avrebbe detto: "non ho niente di simile"');
    console.log('');

    if (noto) esiti.push({ f, posto, fiducia: scheda.fiducia, trovato: esito.trovato });
  }

  const n = esiti.length;
  if (!n) {
    console.log('Nessuna foto valutabile: i nomi devono cominciare con l\'id del modello.');
    return;
  }
  const conta = (p) => esiti.filter((e) => e.posto <= p).length;
  const pct = (x) => `${x}/${n} (${Math.round((100 * x) / n)}%)`;
  console.log('=== RISULTATO SU FOTO VERE ===');
  console.log(`  prima:            ${pct(conta(1))}`);
  console.log(`  fra le prime tre: ${pct(conta(3))}`);
  console.log(`  fra le prime cinque: ${pct(conta(5))}`);
  console.log(`  fuori:            ${pct(n - conta(5))}`);
  console.log('');
  const basse = esiti.filter((e) => e.fiducia === 'bassa').length;
  console.log(`  foto dichiarate poco leggibili: ${basse}`);
  console.log(`  token: ${tin} in, ${tout} out`);
  console.log('');
  console.log('  Confronto: sui render puliti faceva 95% fra le prime tre.');
}

main().catch((e) => {
  console.error('errore:', e.message);
  process.exit(1);
});
