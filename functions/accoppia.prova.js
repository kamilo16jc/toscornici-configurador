/* ============================================================
   La prova dell'accoppiatore, senza spendere una chiamata.
   ------------------------------------------------------------
   Abbiamo DUE letture indipendenti delle stesse 44 porte: la v1 e la
   v2. Si usano le schede della v1 come se fossero foto di clienti e
   si cercano nella mappa v2.

   Non e' una simulazione: il rumore fra le due letture e' quello vero,
   misurato. Se la porta giusta torna nella rosa nonostante quel
   rumore, l'accoppiatore regge; se no, si vede subito quale campo lo
   manda fuori strada.

   node functions/accoppia.prova.js
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const { classifica, rosa, PESI } = require('./accoppia');

const REPO = path.join(__dirname, '..');
const carica = (f) => JSON.parse(fs.readFileSync(path.join(REPO, f), 'utf8')).modelli;

const MAPPA = carica('assets/catalogo-mappa.json');
const FINTE_FOTO = carica('assets/catalogo-mappa-v1.json');

function prova(etichetta, letture, mappa) {
  let primo = 0;
  let inTre = 0;
  let inCinque = 0;
  let fuori = 0;
  const persi = [];
  const posizioni = [];

  for (const letta of letture) {
    const ordinati = classifica(letta, mappa);
    const posto = ordinati.findIndex((m) => m.id === letta.id);
    posizioni.push(posto + 1);
    if (posto === 0) primo += 1;
    if (posto >= 0 && posto < 3) inTre += 1;
    else if (posto >= 0 && posto < 5) inCinque += 1;
    else {
      fuori += 1;
      persi.push({
        nome: letta.nome,
        posto: posto + 1,
        punto: ordinati[posto] ? ordinati[posto].punto.toFixed(3) : '?',
        vinceInvece: ordinati[0].nome,
        puntoVincitore: ordinati[0].punto.toFixed(3),
        sbagliati: ordinati[posto] ? ordinati[posto].discordano.join(', ') : '',
      });
    }
  }

  const n = letture.length;
  const pct = (x) => `${x}/${n} (${Math.round((100 * x) / n)}%)`;
  console.log(`=== ${etichetta} ===`);
  console.log(`  la porta giusta e' PRIMA:        ${pct(primo)}`);
  console.log(`  fra le prime TRE:                ${pct(inTre)}`);
  console.log(`  fra le prime CINQUE:             ${pct(inTre + inCinque)}`);
  console.log(`  fuori dalle prime cinque:        ${pct(fuori)}`);
  const media = posizioni.reduce((a, b) => a + b, 0) / n;
  console.log(`  posizione media:                 ${media.toFixed(2)}`);
  if (persi.length) {
    console.log('');
    console.log('  quelle che sfuggono:');
    for (const p of persi) {
      console.log(`    ${p.nome} -> posto ${p.posto} (${p.punto}); vince ${p.vinceInvece} (${p.puntoVincitore})`);
      console.log(`        campi discordanti: ${p.sbagliati || '(nessuno)'}`);
    }
  }
  console.log('');
  return { primo, inTre: inTre, n };
}

// ---------- 1. il caso vero: lettura v1 contro mappa v2 ----------
prova('LETTURA INDIPENDENTE (rumore reale)', FINTE_FOTO, MAPPA);

// ---------- 2. controllo: la scheda contro se stessa ----------
// Deve dare 100%: se non lo da', c'e' un errore nell'accoppiatore,
// non nei dati.
prova('CONTROLLO (scheda contro se stessa)', MAPPA, MAPPA);

// ---------- 3. quanto serve ogni campo ----------
// Si toglie un campo alla volta e si guarda quanto peggiora. Un campo
// che tolto non cambia niente e' peso morto; uno che tolto fa crollare
// tutto e' il perno.
console.log('=== QUANTO PESA DAVVERO OGNI CAMPO ===');
console.log('  (si toglie il campo e si guarda quante restano fra le prime tre)');
const base = FINTE_FOTO.reduce((acc, letta) => {
  const o = classifica(letta, MAPPA);
  return acc + (o.findIndex((m) => m.id === letta.id) < 3 ? 1 : 0);
}, 0);
console.log(`  con tutti i campi: ${base}/44`);
console.log('');

const originali = { ...PESI };
const effetti = [];
for (const campo of Object.keys(originali)) {
  PESI[campo] = 0;
  const senza = FINTE_FOTO.reduce((acc, letta) => {
    const o = classifica(letta, MAPPA);
    return acc + (o.findIndex((m) => m.id === letta.id) < 3 ? 1 : 0);
  }, 0);
  PESI[campo] = originali[campo];
  effetti.push({ campo, senza, delta: senza - base });
}
effetti.sort((a, b) => a.delta - b.delta);
for (const e of effetti) {
  const segno = e.delta === 0 ? '  =' : (e.delta > 0 ? ` +${e.delta}` : ` ${e.delta}`);
  console.log(`  senza ${e.campo.padEnd(24)} ${String(e.senza).padStart(2)}/44  ${segno}`);
}
