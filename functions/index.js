/* ============================================================
   L'ASSISTENTE — la funzione
   ------------------------------------------------------------
   Riceve la foto (o la descrizione) del cliente, la fa leggere al
   modello dentro la scheda della mappa, e poi ACCOPPIA COL CODICE.

   Il modello non scrive mai il nome di una porta. Compila la scheda e
   basta; i nomi, le foto e i link escono dal catalogo nostro. E' la
   garanzia che non possa inventarsi un modello che non esiste — la
   cosa che brucerebbe la fiducia piu' in fretta di qualunque altra.

   La chiave non e' qui: sta in Secret Manager e la funzione la riceve
   al momento di girare.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const Anthropic = require('@anthropic-ai/sdk');

const { rosa } = require('./accoppia');

const CHIAVE_ANTHROPIC = defineSecret('ANTHROPIC_API_KEY');

// ---------- i limiti, dal primo giorno ----------
// Un endpoint pubblico che spende soldi senza freni e' una fattura
// aperta. Meglio stretti adesso che larghi dopo un brutto mese.
const LIMITI = {
  fotoMaxByte: 6 * 1024 * 1024,     // il browser ne dichiara 8: qui si verifica
  messaggiMax: 20,                  // per sessione
  alMinutoPerIP: 6,
  testoMaxCaratteri: 1500,
};

const ORIGINI = [
  'https://configurador-3d.vercel.app',
  'http://localhost:8140',
  'http://localhost:8137',
];

// ---------- la mappa, caricata una volta sola ----------
const MAPPA = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'dati/catalogo-mappa.json'), 'utf8'),
).modelli;

const CATALOGO = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'dati/catalogo-vetrina.json'), 'utf8'),
);

const SCHEMA = (() => {
  const grezzo = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'dati/mappa-schema.json'), 'utf8'),
  );
  // la salita strutturata non accetta i vincoli numerici e di lunghezza
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
  return pulisci(grezzo);
})();

// ---------- freno per indirizzo, in memoria ----------
// Non e' a prova di bomba (ogni istanza ha il suo contatore) ma ferma
// il caso che conta: qualcuno che martella da un browser.
const visite = new Map();

function troppoSpesso(ip) {
  const ora = Date.now();
  const finestra = 60 * 1000;
  const lista = (visite.get(ip) || []).filter((t) => ora - t < finestra);
  lista.push(ora);
  visite.set(ip, lista);
  if (visite.size > 5000) visite.clear();      // non crescere all'infinito
  return lista.length > LIMITI.alMinutoPerIP;
}

// ---------- come si chiede al modello di leggere ----------
const ISTRUZIONI_FOTO = `Guardi la foto di una porta interna scattata da un cliente e ne compili la scheda.

La foto puo' essere storta, scura, parziale o presa da lontano: descrivi
SOLO quello che riesci a vedere davvero. Non dedurre, non completare con
quello che di solito hanno le porte, non indovinare il modello.

Se l'immagine non permette di leggere un campo, usa il valore che lo
dichiara ('non_leggibile') invece di scegliere il piu' probabile. E se
la foto e' storta, sfocata o mostra solo un pezzo di porta, dichiara
fiducia 'bassa': serve a chi confronta per non fidarsi troppo.

Guarda con attenzione questi, che sono quelli che contano:
- testa: la parte alta del disegno e' dritta o ad arco?
- riquadri_disposizione: due riquadri uno SOPRA l'altro non e' la stessa
  cosa di due AFFIANCATI.
- riquadri_numero: quanti pannelli incorniciati. Il vetro non conta.
- vetro: quanto vetro c'e', e dove.

Il campo 'soggetto' viene prima di tutti: se nell'immagine non c'e' una
porta — un animale, una persona, un mobile, un logo, un campione di
legno — scrivi 'non_e_una_porta' e non sforzarti di riempire il resto
con valori plausibili. Non e' un fallimento: e' la risposta giusta.`;

async function leggiFoto(client, base64, tipo) {
  const r = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 3000,
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: tipo, data: base64 } },
        { type: 'text', text: ISTRUZIONI_FOTO },
      ],
    }],
  });
  // con la salita strutturata la risposta puo' comunque essere rifiutata
  if (r.stop_reason === 'refusal') {
    const e = new Error('rifiutata');
    e.rifiuto = r.stop_details && r.stop_details.category;
    throw e;
  }
  const testo = r.content.find((b) => b.type === 'text');
  return { scheda: JSON.parse(testo.text), uso: r.usage };
}

// ---------- da id a scheda da mostrare ----------
// I nomi e le immagini escono da QUI, mai dal modello.
function vetrina(scelti) {
  return scelti.map((s) => {
    const c = CATALOGO[s.id] || {};
    return {
      id: s.id,
      nome: c.nome || s.nome,
      linea: c.linea || '',
      descrizione: c.descrizione || '',
      immagine: c.immagine || null,
      link: `configuratore.html?modello=${encodeURIComponent(s.id)}`,
      // quanto e' vicina, arrotondata: serve al fronte per ordinare o
      // per dire "molto simile" / "somiglia"
      vicinanza: Math.round(s.punto * 100),
    };
  });
}

function intestazioni(res, origine) {
  if (ORIGINI.includes(origine)) res.set('Access-Control-Allow-Origin', origine);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '3600');
}

exports.assistente = onRequest(
  {
    region: 'europe-west1',
    secrets: [CHIAVE_ANTHROPIC],
    memory: '512MiB',
    timeoutSeconds: 60,
    maxInstances: 10,        // tetto duro: non puo' scalare a sorpresa
  },
  async (req, res) => {
    intestazioni(res, req.headers.origin);
    if (req.method === 'OPTIONS') return res.status(204).send('');
    if (req.method !== 'POST') return res.status(405).json({ errore: 'solo POST' });

    const ip = req.headers['x-forwarded-for'] || req.ip || 'ignoto';
    if (troppoSpesso(String(ip).split(',')[0].trim())) {
      return res.status(429).json({ errore: 'troppe richieste', riprova_fra: 60 });
    }

    const corpo = req.body || {};
    const lingua = corpo.lingua === 'en' ? 'en' : 'it';

    if ((corpo.numeroMessaggi || 0) > LIMITI.messaggiMax) {
      return res.status(429).json({ errore: 'conversazione troppo lunga' });
    }

    if (!corpo.foto) {
      // il ramo a parole arriva dopo: prima si prova quello con la foto
      return res.status(400).json({ errore: 'per ora serve una foto' });
    }

    const base64 = String(corpo.foto.dati || '');
    const tipo = String(corpo.foto.tipo || 'image/jpeg');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(tipo)) {
      return res.status(400).json({ errore: 'formato non supportato' });
    }
    // base64 gonfia di un terzo: si controlla la dimensione vera
    if ((base64.length * 3) / 4 > LIMITI.fotoMaxByte) {
      return res.status(413).json({ errore: 'foto troppo grande' });
    }

    try {
      const client = new Anthropic({ apiKey: CHIAVE_ANTHROPIC.value() });
      const { scheda, uso } = await leggiFoto(client, base64, tipo);

      // Il portone: se non c'e' una porta non si accoppia nemmeno.
      // Senza questo controllo l'accoppiatore riceveva una scheda di
      // valori inventati e la trattava come una lettura buona: un gatto
      // faceva 72% e usciva con tre porte proposte. Il punteggio non
      // poteva accorgersene — dice quanto concordano i campi letti, non
      // se valeva la pena leggerli.
      if (scheda.soggetto === 'non_e_una_porta') {
        logger.info('non e\' una porta', { note: scheda.note || null });
        return res.json({
          trovato: false,
          motivo: 'non_e_una_porta',
          lettura: scheda,
          testo: lingua === 'en'
            ? 'I can’t see a door in this photo. Send me one showing the door you like and I’ll look for it in the catalogue.'
            : 'In questa foto non vedo una porta. Mandamene una con la porta che ti piace e la cerco in catalogo.',
        });
      }

      const esito = rosa(scheda, MAPPA);

      logger.info('lettura', {
        fiducia: scheda.fiducia,
        trovato: esito.trovato,
        primo: esito.trovato ? esito.modelli[0].id : null,
        token_in: uso.input_tokens,
        token_out: uso.output_tokens,
      });

      if (!esito.trovato) {
        return res.json({
          trovato: false,
          lettura: scheda,
          testo: lingua === 'en'
            ? 'I can’t find anything in the catalogue that resembles this door. It may be from another range — or the photo may not show enough of it.'
            : 'Non trovo niente in catalogo che somigli a questa porta. Puo\' essere di un\'altra collezione, o la foto non ne mostra abbastanza.',
        });
      }

      return res.json({
        trovato: true,
        lettura: scheda,
        modelli: vetrina(esito.modelli),
        // mezza porta e' come una foto sfocata: si propone lo stesso, ma
        // dicendo che si e' visto poco. La misura dava il caso peggiore
        // proprio qui.
        incerta: scheda.fiducia === 'bassa' || scheda.soggetto === 'porta_parziale',
      });
    } catch (e) {
      if (e.rifiuto) {
        logger.warn('rifiutata dai classificatori', { categoria: e.rifiuto });
        return res.status(422).json({ errore: 'non posso leggere questa immagine' });
      }
      logger.error('lettura fallita', { messaggio: e.message });
      return res.status(502).json({ errore: 'la lettura non e\' riuscita' });
    }
  },
);

// La prova di Replicate ha girato ed e' stata cancellata: era un
// endpoint che spendeva soldi con un chiavistello debole. Il codice
// resta in prova-replicate.js, con dentro le istruzioni per rimetterla
// in piedi -- ma NON si esporta, se no il prossimo deploy la ricrea.
