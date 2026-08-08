/* ============================================================
   Lo sforzo: cosa succede quando la foto e' brutta.
   ------------------------------------------------------------
   La prova precedente usa letture di render puliti. Una foto vera e'
   peggio: storta, scura, presa da lontano, mezza porta. Qui si simula
   quel peggioramento sporcando apposta le schede, e si guarda a che
   punto l'accoppiatore smette di reggere.

   Serve a sapere DOVE si rompe prima di scoprirlo con un cliente
   davanti.

   node functions/accoppia.stress.js
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const { classifica, rosa } = require('./accoppia');

const REPO = path.join(__dirname, '..');
const carica = (f) => JSON.parse(fs.readFileSync(path.join(REPO, f), 'utf8')).modelli;
const MAPPA = carica('assets/catalogo-mappa.json');
const LETTURE = carica('assets/catalogo-mappa-v1.json');

// un generatore ripetibile: la prova deve dare lo stesso risultato
// ogni volta, se no non si puo' confrontare una modifica con l'altra
let seme = 12345;
const caso = () => {
  seme = (seme * 1103515245 + 12345) & 0x7fffffff;
  return seme / 0x7fffffff;
};

const ALTERNATIVE = {
  vetro: ['nessuno', 'parziale_alto', 'totale'],
  testa: ['dritta', 'arco_tondo', 'arco_ribassato'],
  riquadri_disposizione: ['nessuno', 'uno_solo', 'due_sovrapposti', 'due_affiancati',
    'uno_sopra_due', 'due_sopra_uno', 'griglia', 'altro'],
  riquadri_forma: ['rettangolare', 'quadrato', 'arco_in_cima', 'sagomato', 'rombo'],
  modanatura: ['piatta', 'smussata', 'rilievo', 'gola', 'non_leggibile'],
  traversa: ['assente', 'a_filo', 'in_rilievo'],
  superficie: ['liscia', 'pannelli', 'incisa'],
};

function sporca(scheda, quanto, opz) {
  const s = { ...scheda };
  const o = opz || {};
  for (const campo of Object.keys(ALTERNATIVE)) {
    if (o.risparmia && o.risparmia.includes(campo)) continue;
    if (caso() < quanto) {
      const alt = ALTERNATIVE[campo].filter((v) => v !== s[campo]);
      s[campo] = alt[Math.floor(caso() * alt.length)];
    }
  }
  // i numeri scivolano, non saltano
  for (const campo of ['riquadri_numero', 'vetro_lastre']) {
    if (caso() < quanto) {
      const n = Number(s[campo]) || 0;
      s[campo] = Math.max(0, n + (caso() < 0.5 ? -1 : 1));
    }
  }
  if (o.fiducia) s.fiducia = o.fiducia;
  return s;
}

function misura(etichetta, trasforma) {
  let primo = 0;
  let tre = 0;
  let cinque = 0;
  let vuote = 0;
  for (const l of LETTURE) {
    const sporcata = trasforma(l);
    const ord = classifica(sporcata, MAPPA);
    const i = ord.findIndex((m) => m.id === l.id);
    if (i === 0) primo += 1;
    if (i >= 0 && i < 3) tre += 1;
    if (i >= 0 && i < 5) cinque += 1;
    if (!rosa(sporcata, MAPPA).trovato) vuote += 1;
  }
  const n = LETTURE.length;
  const p = (x) => `${String(x).padStart(2)}/${n} (${String(Math.round((100 * x) / n)).padStart(3)}%)`;
  console.log(`  ${etichetta.padEnd(38)} prima ${p(primo)}   fra le tre ${p(tre)}   fra le cinque ${p(cinque)}   "niente" ${p(vuote)}`);
  return tre;
}

console.log('=== QUANTO REGGE SE LA FOTO E\' BRUTTA ===');
console.log('  (si sporca ogni campo con la probabilita\' indicata)');
console.log('');
misura('foto perfetta (nessun errore)', (l) => l);
for (const q of [0.1, 0.2, 0.3, 0.4]) {
  misura(`${Math.round(q * 100)}% dei campi letti male`, (l) => sporca(l, q));
}
console.log('');

console.log('=== E SE SBAGLIA PROPRIO IL CAMPO CHIAVE ===');
console.log('  (gli altri restano giusti)');
console.log('');
for (const campo of ['testa', 'riquadri_disposizione', 'vetro', 'riquadri_numero']) {
  misura(`sbaglia solo ${campo}`, (l) => {
    const s = { ...l };
    if (campo === 'riquadri_numero') s[campo] = Math.max(0, (Number(l[campo]) || 0) + 1);
    else {
      const alt = ALTERNATIVE[campo].filter((v) => v !== l[campo]);
      s[campo] = alt[Math.floor(caso() * alt.length)];
    }
    return s;
  });
}
console.log('');

console.log('=== LA MEZZA PORTA ===');
console.log('  (una foto che taglia la parte bassa: niente riquadri leggibili)');
console.log('');
misura('mancano i campi dei riquadri', (l) => {
  const s = { ...l };
  delete s.riquadri_numero;
  delete s.riquadri_disposizione;
  delete s.riquadri_forma;
  delete s.traversa;
  return s;
});
misura('manca tutto quello del vetro', (l) => {
  const s = { ...l };
  delete s.vetro_lastre;
  delete s.vetro_griglia;
  delete s.vetro_griglia_colonne;
  delete s.vetro_griglia_righe;
  return s;
});
console.log('');

console.log('=== LA SOGLIA: QUANDO DIRE "NON HO NIENTE" ===');
console.log('  Una porta che NON e\' in catalogo non deve trovare tre risposte.');
console.log('');
// si inventa una porta che non esiste: valori che nessun modello ha
const ESTRANEA = {
  vetro: 'totale', testa: 'arco_ribassato', riquadri_numero: 7,
  riquadri_disposizione: 'griglia', riquadri_forma: 'rombo',
  modanatura: 'gola', traversa: 'in_rilievo', superficie: 'incisa',
  vetro_lastre: 15, vetro_griglia: 'ventaglio_ad_arco',
  vetro_griglia_colonne: 5, vetro_griglia_righe: 5, fiducia: 'alta',
};
const e = rosa(ESTRANEA, MAPPA);
const ord = classifica(ESTRANEA, MAPPA);
console.log(`  porta inventata -> ${e.trovato ? 'PROPONE ' + e.modelli.length + ' modelli' : 'dice che non ha niente'}`);
console.log(`  il migliore comunque arriva a ${(ord[0].punto * 100).toFixed(0)}% (soglia 55%)`);
console.log('');
console.log('  distribuzione dei punteggi migliori sulle porte VERE:');
const migliori = LETTURE.map((l) => classifica(l, MAPPA)[0].punto).sort((a, b) => a - b);
console.log(`    il piu' basso ${(migliori[0] * 100).toFixed(0)}%, mediana ${(migliori[22] * 100).toFixed(0)}%, il piu' alto ${(migliori[43] * 100).toFixed(0)}%`);
