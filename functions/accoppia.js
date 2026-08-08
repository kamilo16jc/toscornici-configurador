/* ============================================================
   ACCOPPIA — dalla scheda letta alla rosa di modelli
   ------------------------------------------------------------
   Confronta la scheda che la IA ha compilato guardando la foto del
   cliente con le 44 schede della mappa, e ordina.

   E' codice, non conversazione, e questo e' il punto: si puo' pesare
   ogni campo per quanto e' affidabile. Un modello che confrontasse da
   solo non distinguerebbe un dato solido da un'impressione.

   I pesi non sono a occhio: vengono da una misura. Le stesse 44
   immagini lette due volte danno lo stesso valore sempre su quattro
   campi, e cambiano nel 73% dei casi sui quattro del vetro.
   ============================================================ */

'use strict';

// Peso = quanto ci si puo' fidare del campo, misurato su 88 letture.
// Chi non e' cambiato mai decide chi entra nella rosa; chi balla al
// massimo sposta l'ordine.
const PESI = {
  // mai cambiati in 88 letture
  vetro: 10,
  riquadri_disposizione: 10,
  riquadri_numero: 8,
  superficie: 6,

  // cambiati fra il 5% e il 34% delle volte
  modanatura: 3,
  traversa: 3,
  // testa e' cambiata solo nel 5% delle letture ed e' il campo che da
  // solo separa di piu': un arco o una testa dritta tagliano il
  // catalogo in due. Il peso 4 che aveva era sotto la sua affidabilita'.
  testa: 8,
  riquadri_forma: 3,

  // aggiunti dopo, non ancora misurati: prudenza
  riquadri_proporzione: 3,
  vetro_bordo_alto: 3,

  // cambiati nel 73% dei casi: quasi rumore. Restano perche' quando
  // sono giusti aiutano a ordinare, ma non devono mai decidere.
  vetro_griglia: 2,
  vetro_lastre: 1,
  vetro_griglia_colonne: 1,
  vetro_griglia_righe: 1,
};

// I campi numerici meritano credito parziale: sbagliare di uno non e'
// come sbagliare di cinque.
const NUMERICI = new Set([
  'riquadri_numero', 'vetro_lastre', 'vetro_griglia_colonne', 'vetro_griglia_righe',
]);

// Quanto smorzare tutto quando l'immagine si legge male. Su una foto
// storta e scura conviene proporre con meno sicurezza che sbagliare
// con sicurezza.
const FIDUCIA = { alta: 1, media: 0.85, bassa: 0.6 };

// PROVATO E SCARTATO: una tabella di "vicinanze" che dava credito
// parziale agli errori simili (arco tondo contro arco ribassato, due
// riquadri sovrapposti contro uno sopra due). L'idea era attutire il
// colpo quando la lettura sbaglia di poco.
//
// Misurato: non paga. Il credito parziale lo prendono anche le porte
// SBAGLIATE che sono quasi-uguali, e il contrasto si annacqua. La porta
// giusta finiva prima in 20 casi su 44 invece di 24, per guadagnare una
// sola posizione fra le prime tre -- dentro il rumore. Chi ci riprova,
// misuri con functions/accoppia.prova.js prima di tenerla.

/** Quanto si somigliano due valori dello stesso campo: da 0 a 1. */
function somiglianza(campo, a, b) {
  if (a === undefined || a === null || b === undefined || b === null) return 0;
  if (NUMERICI.has(campo)) {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return 0;
    if (na === nb) return 1;
    const scarto = Math.abs(na - nb);
    // uno di scarto vale ancora parecchio, due poco, tre niente
    return Math.max(0, 1 - scarto / 3);
  }
  return String(a) === String(b) ? 1 : 0;
}

/**
 * Ordina i modelli della mappa per somiglianza con la scheda letta.
 * Ritorna tutti, ordinati: chi chiama decide quanti mostrarne.
 */
function classifica(letta, mappa) {
  const smorza = FIDUCIA[letta && letta.fiducia] !== undefined
    ? FIDUCIA[letta.fiducia] : 1;

  const punteggi = mappa.map((modello) => {
    let ottenuto = 0;
    let possibile = 0;
    const concordano = [];
    const discordano = [];

    for (const campo of Object.keys(PESI)) {
      const valoreLetto = letta[campo];
      // Un campo che la lettura non ha compilato non deve penalizzare:
      // non e' una discordanza, e' un'assenza di informazione.
      if (valoreLetto === undefined || valoreLetto === null || valoreLetto === '') continue;
      const peso = PESI[campo];
      const s = somiglianza(campo, valoreLetto, modello[campo]);
      ottenuto += peso * s;
      possibile += peso;
      (s >= 0.999 ? concordano : discordano).push(campo);
    }

    const punto = possibile > 0 ? (ottenuto / possibile) * smorza : 0;
    return {
      id: modello.id,
      nome: modello.nome,
      punto,
      concordano,
      discordano,
    };
  });

  punteggi.sort((a, b) => b.punto - a.punto);
  return punteggi;
}

/**
 * La rosa da mostrare. Non e' sempre di tre:
 *  - se niente arriva alla soglia, meglio dire che non si e' trovato
 *    nulla che proporre tre porte a caso;
 *  - se piu' modelli pareggiano col terzo, si mostrano anche quelli:
 *    tagliare un pareggio a meta' e' arbitrario.
 */
function rosa(letta, mappa, opzioni) {
  const o = opzioni || {};
  const quante = o.quante || 3;
  const soglia = o.soglia !== undefined ? o.soglia : 0.55;
  const massimo = o.massimo || 5;

  const tutti = classifica(letta, mappa);
  const sopra = tutti.filter((m) => m.punto >= soglia);
  if (sopra.length === 0) {
    return { trovato: false, motivo: 'niente_di_simile', migliore: tutti[0] || null };
  }

  const scelti = sopra.slice(0, quante);
  // i pari merito col terzo entrano comunque, fino a un tetto
  const ultimo = scelti[scelti.length - 1].punto;
  for (let i = scelti.length; i < sopra.length && scelti.length < massimo; i += 1) {
    if (Math.abs(sopra[i].punto - ultimo) > 0.001) break;
    scelti.push(sopra[i]);
  }

  return { trovato: true, modelli: scelti, totaleSopraSoglia: sopra.length };
}

module.exports = { PESI, classifica, rosa, somiglianza };
