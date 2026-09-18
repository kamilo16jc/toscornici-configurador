/* ============================================================
   I TRE TIPI — la finitura del campo
   ------------------------------------------------------------
   La fabbrica vende ogni modello in tre finiture. Non sono tre
   porte: e' la stessa porta, con lo stesso disegno e le stesse
   misure, e cambia solo come e' rifinito il campo.

     TIPO 1  modanatura GOLA,      bugna 'escalonado'
     TIPO 2  modanatura ASTRAGALO, bugna 'doble'
     TIPO 3  modanatura SMUSSO,    bugna 'doble'

   Il campo —bugna o liscio— e' una scelta a parte sul 2 e sul 3.

   Da dove esce. Dai tre tracciati della ROMA fatti in fabbrica
   (ROMA TIPO 1/2/3). Confrontandoli campo per campo: fra il TIPO 1
   e il TIPO 2 cambia UNA sola proprieta', bastoneForma; fra il
   TIPO 2 e il TIPO 3 cambiano sei, e sono tutte quelle che
   spianano la bugna. Nient'altro: nemmeno una coordinata.

   Per questo qui non ci sono tre file per porta. C'e' il tracciato,
   che vale da TIPO 1 e 2, e da li' si deriva il resto. Venticinque
   file invece di settantacinque, e una modanatura nuova si vede su
   tutto il catalogo senza ritracciare niente.

   Il tracciato comanda sempre sul disegno: se un modello ha un
   campo gia' liscio di suo (la Firenze ne ha uno), quel campo resta
   liscio anche in TIPO 1 e 2. Il tipo cambia la FINITURA, non il
   disegno della porta.

   LE PORTE CON VETRO PASSANO DI QUI. Prima no: bastava un vetro
   e la scelta del tipo spariva. I tracciati dicono il contrario —
   la LAGUNA ha otto vani di vetro su nove ed esiste nei tre tipi,
   e in ognuno cambia la modanatura di TUTTI i vani, vetro compreso.
   Quello che non si chiede, se non c'e' nemmeno un campo di legno,
   e' la bugna: senza pannello non c'e' niente da rialzare.
   ============================================================ */

/** Le tre finiture di listino. La chiave e' il numero che vede il cliente. */
export const TIPI = {
  1: { bastone: 'gola',      liscio: false, bugna: 'escalonado', bisel: 4 },
  2: { bastone: 'astragalo', liscio: false, bugna: 'doble',      bisel: 6 },
  3: { bastone: 'smusso',    liscio: true,  bugna: 'doble',      bisel: 6 },
};

/* DA DOVE ESCONO QUESTI SEI VALORI. Dai tracciati di fabbrica, non da una
   somiglianza di nomi: il LAGUNA TIPO 1 monta gola nei suoi nove vani e il
   campo in 'escalonado'; il TIPO 2 monta astragalo —lo conferma anche la
   CARRARA TIPO 2— e il TIPO 3 smusso. Prima qui c'erano doppioGradinoCurvo,
   cavetto e vivo, e non e' nessuna delle tre. */

/* IL CAMPO NON LO DECIDE PIU' IL NUMERO.
   Qui sopra ogni tipo portava il suo campo attaccato: il 3 liscio e basta.
   Ma la fabbrica li fa in tutt'e due i modi — un TIPO 3 con la bugna esiste,
   ed e' quello a spigolo vivo— e allora la modanatura e il campo sono due
   scelte, non una.
   Il TIPO 1 resta fuori: nasce con la bugna e non si tocca.
   Questi sono solo i valori DI PARTENZA quando si cambia tipo, scelti perche'
   nessuno si trovi cambiata una porta che aveva gia' configurato: il 2 come
   era (con bugna) e il 3 come era (liscio). */
export const BUGNA_DI_PARTENZA = { 1: true, 2: true, 3: false };

/** Vero se questo tipo lascia scegliere il campo. Il TIPO 1 no. */
export const scegliBugna = (tipo) => Number(tipo) !== 1;

/** Il numero di tipo con cui nasce una porta se non se ne sceglie uno. */
export const TIPO_DEFAULT = 1;

/* I campi di LEGNO: gli unici che possono portare una bugna. */
const CAMPI = new Set(['bugnato', 'pannello']);

/* I VANI, che sono un'altra cosa. La modanatura gira intorno a ogni vano,
   sia di legno che di vetro: nel LAGUNA cambiano tutti e nove passando da un
   tipo all'altro, e otto sono di vetro satinato. Si riconoscono perche'
   hanno una modanatura da portare; montanti e traversi non ne hanno. */
const VANI = new Set(['bugnato', 'pannello', 'vetro', 'vetroSatinato', 'bugnatoVetro']);

/** Vero se la porta ha almeno un campo di legno, cioe' se la bugna ha senso. */
export function haCampoDiLegno(pezzi) {
  return pezzi.some((p) => CAMPI.has(p.papel));
}

/* I campi di vetro. Bastano a marcare tutta la porta come "con vetro". */
const VETRO = new Set(['vetro', 'vetroSatinato', 'bugnatoVetro']);

/** Vero se la porta monta del vetro, in un campo intero o dentro una bugna. */
export function haVetro(pezzi) {
  return pezzi.some((p) => VETRO.has(p.papel) || p.vidrioEnElCampo === true);
}

/**
 * Restituisce i pezzi con la finitura del tipo chiesto.
 *
 * Non modifica l'originale: torna copie. Il progetto caricato deve restare
 * com'e' sul disco, o cambiando tipo due volte di fila si perde il tracciato.
 *
 * @param {Array<object>} pezzi  i pezzi del progetto, gia' deserializzati
 * @param {number} tipo          1, 2 o 3
 */
export function applicaTipo(pezzi, tipo, conBugna = null) {
  const t = TIPI[tipo] ?? TIPI[TIPO_DEFAULT];
  /* Se non si dice niente, vale il campo storico del tipo. Il TIPO 1 la bugna
     ce l'ha sempre, qualunque cosa arrivi da fuori. */
  const liscio = Number(tipo) === 1 ? false
    : conBugna == null ? t.liscio : !conBugna;

  return pezzi.map((p) => {
    if (!VANI.has(p.papel)) return p;

    /* La modanatura gira intorno a OGNI vano, vetro compreso: e' lei che si
       vede per prima ed e' quello che davvero separa un tipo dall'altro. */
    const q = { ...p, bastoneForma: t.bastone };

    // Sul vetro finisce qui: non c'e' campo da rialzare ne' da spianare.
    if (!CAMPI.has(p.papel)) return q;

    if (!liscio) {
      /* Con la bugna: il campo torna rialzato e prende il rilievo del tipo.
         Si toglie la sezione disegnata a mano, se ce n'era una, o resterebbe
         quella e il tipo non si vedrebbe. */
      q.papel = 'bugnato';
      q.perfilBugna = t.bugna;
      q.perfilPuntos = null;
      q.bisel = t.bisel;
      if (!(q.biselAncho > 0)) q.biselAncho = 30;
      q.biselPerfil = 'recto';
      return q;
    }

    /* TIPO 3: il campo si spiana. La bugna non si nasconde, si toglie —
       cambia il ruolo del pezzo, non solo il suo aspetto: da rialzato
       ('bugnato') a tavola che galleggia nella scanalatura ('pannello'). */
    q.papel = 'pannello';
    q.perfilBugna = null;
    /* Anche la sezione disegnata a mano, se ce n'e' una: sopravvive al
       cambio di profilo e rimetterebbe il rilievo dalla finestra. */
    q.perfilPuntos = null;
    q.bisel = 0;
    q.biselAncho = 0;
    q.biselPerfil = 'recto';
    return q;
  });
}
