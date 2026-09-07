/* ============================================================
   I TRE TIPI — la finitura del campo
   ------------------------------------------------------------
   La fabbrica vende ogni modello in tre finiture. Non sono tre
   porte: e' la stessa porta, con lo stesso disegno e le stesse
   misure, e cambia solo come e' rifinito il campo.

     TIPO 1  bugna rialzata, modanatura a doppio gradino
     TIPO 2  bugna rialzata, modanatura a mezza canna
     TIPO 3  pannello LISCIO, modanatura a spigolo vivo

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

   Le porte con vetro non passano di qui: hanno una regola loro
   ancora da definire. Si riconoscono con haVetro().
   ============================================================ */

/** Le tre finiture di listino. La chiave e' il numero che vede il cliente. */
export const TIPI = {
  1: { bastone: 'doppioGradinoCurvo', liscio: false },
  2: { bastone: 'cavetto', liscio: false },
  3: { bastone: 'vivo', liscio: true },
};

/** Il numero di tipo con cui nasce una porta se non se ne sceglie uno. */
export const TIPO_DEFAULT = 1;

/* I campi di legno: quelli che il tipo tocca. Il resto della porta
   —montanti, traversi, sagome, incisioni— non si sfiora. */
const CAMPI = new Set(['bugnato', 'pannello']);

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
export function applicaTipo(pezzi, tipo) {
  const t = TIPI[tipo] ?? TIPI[TIPO_DEFAULT];

  return pezzi.map((p) => {
    if (!CAMPI.has(p.papel)) return p;

    /* La modanatura del vano la porta il campo e gira tutto intorno: e' lei
       che si vede per prima, ed e' l'unica cosa che separa il TIPO 1 dal 2. */
    const q = { ...p, bastoneForma: t.bastone };
    if (!t.liscio) return q;

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
