/* ============================================================
   PROVA TEMPORANEA — Replicate puo' migliorare la resa senza
   cambiare la porta?
   ------------------------------------------------------------
   Gira QUI e non in locale per un motivo preciso: le due chiavi stanno
   in Secret Manager e non devono uscirne. La piattaforma le inietta alla
   funzione; nessuno le legge, nessuno le incolla da nessuna parte.

   Cosa fa, per ogni modello chiesto:
     1. prende l'immagine di catalogo
     2. la manda a FLUX Kontext chiedendo SOLO materiale e luce
     3. rilegge il risultato con la STESSA scheda dell'accoppiatore
     4. confronta campo per campo con l'originale

   Il punto 4 e' la prova vera. Un render piu' bello che sposta un
   riquadro non e' un miglioramento: e' una porta che non vendiamo.

   DA CANCELLARE dopo la prova:
     firebase functions:delete provaReplicate --region europe-west1
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const Anthropic = require('@anthropic-ai/sdk');

const CHIAVE_ANTHROPIC = defineSecret('ANTHROPIC_API_KEY');
const TOKEN_REPLICATE = defineSecret('REPLICATE_API_TOKEN');

// Non e' un segreto, e' un chiavistello: la funzione spende soldi veri e
// resta in piedi poche ore. Serve solo a che non la trovi un passante.
const CHIAVISTELLO = 'toscocornici-prova-2026-08';

// Scritto per non lasciare licenza creativa: solo materiale e luce, e il
// divieto esplicito di toccare il disegno. Se cambia lo stesso, la
// strada non regge.
const PROMPT = 'Photorealistic product photo of this exact interior door. '
  + 'Improve only the material and the lighting: realistic wood grain with '
  + 'visible pores and natural colour variation, soft studio lighting with '
  + 'gentle shadows, clear glass. '
  + 'Keep the door geometry absolutely identical: same number of panels, '
  + 'same panel layout and proportions, same glazing bar grid, same frame '
  + 'profile, same handle position. Do not add, remove or move any panel, '
  + 'bar or moulding. Same camera angle, same framing. Plain light background.';

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
  fs.readFileSync(path.join(__dirname, 'dati/mappa-schema.json'), 'utf8'),
));

const ISTRUZIONI = 'Guardi l\'immagine di una porta interna e ne compili la '
  + 'scheda. Descrivi SOLO quello che vedi davvero: non dedurre, non '
  + 'completare con quello che di solito hanno le porte.\n'
  + 'Guarda con attenzione: testa (dritta o ad arco), riquadri_disposizione, '
  + 'riquadri_numero, e quanto vetro c\'e\'.';

// I campi che decidono l'accoppiamento. Se cambiano questi, l'immagine
// non rappresenta piu' il modello di catalogo.
const CHE_CONTANO = ['vetro', 'testa', 'riquadri_numero', 'riquadri_disposizione',
  'riquadri_forma', 'superficie', 'traversa', 'modanatura', 'vetro_griglia',
  'vetro_griglia_colonne', 'vetro_griglia_righe', 'vetro_lastre'];

async function kontext(token, base64jpg) {
  const r = await fetch(
    'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt: PROMPT,
          input_image: `data:image/jpeg;base64,${base64jpg}`,
          aspect_ratio: 'match_input_image',
          output_format: 'png',
          safety_tolerance: 2,
        },
      }),
    },
  );
  if (!r.ok) throw new Error(`Replicate ${r.status}: ${(await r.text()).slice(0, 300)}`);

  let p = await r.json();
  for (let i = 0; i < 60 && !['succeeded', 'failed', 'canceled'].includes(p.status); i += 1) {
    await new Promise((ok) => { setTimeout(ok, 3000); });
    p = await (await fetch(p.urls.get, { headers: { Authorization: `Bearer ${token}` } })).json();
  }
  if (p.status !== 'succeeded') throw new Error(`Replicate: ${p.error || p.status}`);

  const url = Array.isArray(p.output) ? p.output[0] : p.output;
  const img = await fetch(url);
  return Buffer.from(await img.arrayBuffer());
}

async function scheda(client, buf, tipo) {
  const r = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 3000,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: tipo, data: buf.toString('base64') } },
        { type: 'text', text: ISTRUZIONI },
      ],
    }],
  });
  if (r.stop_reason === 'refusal') return null;
  return JSON.parse(r.content.find((b) => b.type === 'text').text);
}

exports.provaReplicate = onRequest(
  {
    region: 'europe-west1',
    secrets: [CHIAVE_ANTHROPIC, TOKEN_REPLICATE],
    memory: '1GiB',
    timeoutSeconds: 540,
    maxInstances: 2,
  },
  async (req, res) => {
    if (req.query.chiave !== CHIAVISTELLO) return res.status(403).json({ errore: 'no' });

    const porte = String(req.query.porte || 'venezia,liverpool,emilia').split(',');
    const client = new Anthropic({ apiKey: CHIAVE_ANTHROPIC.value() });
    const token = TOKEN_REPLICATE.value();
    const esiti = [];

    for (const id of porte) {
      const f = path.join(__dirname, 'dati/modelli', `${id}.jpg`);
      if (!fs.existsSync(f)) { esiti.push({ id, errore: 'immagine mancante' }); continue; }
      const prima = fs.readFileSync(f);
      try {
        const dopo = await kontext(token, prima.toString('base64'));
        const a = await scheda(client, prima, 'image/jpeg');
        const b = await scheda(client, dopo, 'image/png');
        const cambiati = (a && b)
          ? CHE_CONTANO.filter((c) => a[c] !== b[c])
            .map((c) => ({ campo: c, prima: a[c], dopo: b[c] }))
          : null;
        esiti.push({
          id,
          cambiati,
          quanti: cambiati ? cambiati.length : null,
          su: CHE_CONTANO.length,
          immagine: dopo.toString('base64'),
        });
        logger.info('prova replicate', { id, cambiati: cambiati && cambiati.length });
      } catch (e) {
        esiti.push({ id, errore: e.message });
      }
    }

    return res.json({ esiti });
  },
);
