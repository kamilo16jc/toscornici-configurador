/* ============================================================
   LINGUA — italiano e inglese
   ------------------------------------------------------------
   Prima c'erano gli <span class="en"> accanto a ogni etichetta:
   non era una scelta di lingua, era un sottotitolo fisso, e
   raddoppiava il testo su ogni riga. Qui la lingua si sceglie e
   la pagina si riscrive.

   L'inglese e' britannico, ed e' una decisione motivata: chi vende
   porte italiane nel Regno Unito scrive 'architrave' e 'frame depth
   extension'. I termini sono verificati uno per uno in
   docs/glossario-it-en.md, con le fonti.

   Come si usa nel documento:
     <h2 data-t="chiave">Testo italiano</h2>
     <input data-t-ph="chiave">              (segnaposto)
     <a data-t-tit="chiave">                 (titolo e aria-label)
   Nel copione:  T('chiave')
   ============================================================ */
(function () {
  'use strict';

  var DIZIONARIO = {

    /* ---------- la barra, dappertutto ---------- */
    striscia_1: {
      it: 'Porte in legno massello · su misura, dalla fabbrica',
      en: 'Solid timber doors · made to measure, from the factory',
    },
    striscia_2: {
      it: 'Listino · prezzi di fabbrica, IVA e trasporto esclusi',
      en: 'Price list · ex-works prices, VAT and delivery excluded',
    },
    striscia_ass: {
      it: 'L’assistente restringe il catalogo: la scelta resta tua',
      en: 'The assistant narrows the catalogue: the choice stays yours',
    },
    menu_collezioni: { it: 'Collezioni', en: 'Collections' },
    menu_listino: { it: 'Listino', en: 'Price list' },
    menu_panto: { it: 'Pantografato', en: 'Routed' },
    menu_assistente: { it: 'Assistente', en: 'Assistant' },
    apri_conf: { it: 'Apri il configuratore', en: 'Open the configurator' },
    salta: { it: 'Vai alle collezioni', en: 'Skip to the collections' },
    salta_ass: { it: 'Vai alla conversazione', en: 'Skip to the conversation' },

    /* ---------- la copertina ---------- */
    cop_occhiello: { it: 'Configuratore porte', en: 'Door configurator' },
    cop_titolo: {
      it: 'La tua porta su misura—<br>e il prezzo mentre la scegli.',
      en: 'Your door, made to measure—<br>with the price as you choose.',
    },
    cop_testo: {
      it: 'Quarantaquattro modelli a listino, con essenze, laccati, coprifili, '
        + 'maniglie e capitelli. Il preventivo si aggiorna a ogni scelta e il '
        + 'modulo d’ordine esce pronto per la fabbrica.',
      en: 'Forty-four models in the price list, with wood species, lacquer '
        + 'colours, architraves, handles and door surrounds. The quote updates '
        + 'with every choice, and the order form comes out ready for the factory.',
    },
    lastra_1: { it: 'Nebraska · rovere', en: 'Nebraska · oak' },
    lastra_2: { it: 'Ragusa · rovere', en: 'Ragusa · oak' },
    lastra_3: { it: 'Pantografato · laccato bianco', en: 'Routed · white lacquer' },

    /* ---------- le collezioni ---------- */
    col_occhiello: { it: 'Le collezioni', en: 'The collections' },
    col_titolo: {
      it: 'Due cataloghi,<br>due configuratori',
      en: 'Two catalogues,<br>two configurators',
    },
    col_testo: {
      it: 'Il massello a listino e il pantografato hanno prezzi e lavorazioni '
        + 'diversi: ognuno ha il suo configuratore, con le voci che gli '
        + 'appartengono. <button class="richiamo" type="button" data-legno="rovere">Le '
        + 'quattro essenze</button> valgono per entrambi.',
      en: 'Solid timber from the price list and the routed range have different '
        + 'prices and different machining: each has its own configurator, with '
        + 'the items that belong to it. <button class="richiamo" type="button" '
        + 'data-legno="rovere">The four wood species</button> apply to both.',
    },
    pan_listino_occhiello: { it: 'Massello · 44 modelli', en: 'Solid timber · 44 models' },
    pan_listino_titolo: { it: 'Listino', en: 'Price list' },
    pan_listino_testo: {
      it: 'Essenze, laccati, coprifili, maniglie e capitelli. Prezzo che si '
        + 'aggiorna mentre scegli.',
      en: 'Wood species, lacquer colours, architraves, handles and door '
        + 'surrounds. The price updates as you choose.',
    },
    pan_panto_occhiello: { it: 'Laccato · disegno inciso', en: 'Lacquered · routed pattern' },
    pan_panto_titolo: { it: 'Pantografato', en: 'Routed' },
    pan_panto_testo: {
      it: 'I modelli sono in lavorazione. Avranno un configuratore loro, con le '
        + 'voci di questa collezione.',
      en: 'The models are being prepared. They will have a configurator of their '
        + 'own, with the items of this collection.',
    },
    stato_arrivo: { it: 'In arrivo', en: 'Coming soon' },

    /* ---------- l'assistente, in copertina ---------- */
    ass_occhiello: { it: 'Assistente', en: 'Assistant' },
    ass_titolo: { it: 'Non sai da quale cominciare?', en: 'Not sure where to start?' },
    ass_testo: {
      it: 'Racconta com’è la porta che hai in mente, o carica la foto di una che '
        + 'ti piace: ti propongo i modelli del catalogo che le somigliano e ti '
        + 'porto al configuratore giusto, già impostato.',
      en: 'Describe the door you have in mind, or upload a photo of one you like: '
        + 'I’ll show you the catalogue models that resemble it and take you to '
        + 'the right configurator, already set up.',
    },
    ass_bottone: { it: 'Parla con l’assistente', en: 'Talk to the assistant' },

    /* ---------- le essenze ---------- */
    ess_rovere: { it: 'Rovere', en: 'Oak' },
    ess_castagno: { it: 'Castagno', en: 'Chestnut' },
    ess_toulipier: { it: 'Toulipier', en: 'Tulipwood' },
    ess_pino: { it: 'Pino', en: 'Pine' },

    /* ---------- il piede ---------- */
    piede_1: {
      it: 'Toscocornici · Le porte secondo noi',
      en: 'Toscocornici · Doors, the way we make them',
    },
    piede_2: {
      it: 'Listino — prezzi di fabbrica, IVA e trasporto esclusi.',
      en: 'Price list — ex-works prices, VAT and delivery excluded.',
    },

    /* ============================================================
       IL CONFIGURATORE
       I titoli delle sezioni usano i termini del glossario, non la
       traduzione a orecchio che c'era prima: 'Capitello' non e'
       pediment (quello e' il timpano triangolare) ma door surround,
       e 'Ferramenta' in inglese britannico e' ironmongery.
       ============================================================ */
    conf_occhiello: { it: 'Configuratore', en: 'Configurator' },
    torna_menu: { it: 'Menu', en: 'Menu' },
    torna_tit: { it: 'Torna alla schermata d’ingresso', en: 'Back to the home screen' },

    sez_modello: { it: 'Modello', en: 'Model' },
    sez_essenza: { it: 'Essenza', en: 'Wood species' },
    sez_finitura: { it: 'Finitura', en: 'Finish' },
    sez_misure: { it: 'Misure luce', en: 'Opening size' },
    sez_muro: { it: 'Muro e allargato', en: 'Wall & frame extension' },
    sez_telaio: { it: 'Telaio', en: 'Frame' },
    sez_coprifili: { it: 'Coprifili', en: 'Architraves' },
    sez_apertura: { it: 'Apertura e forma', en: 'Opening & shape' },
    sez_capitello: { it: 'Capitello', en: 'Door surround' },
    sez_ferramenta: { it: 'Ferramenta', en: 'Ironmongery' },
    sez_finmaniglia: { it: 'Finitura maniglia', en: 'Handle finish' },
    sez_ambiente: { it: 'Ambiente', en: 'Setting' },

    lacc_titolo: {
      it: 'Colore laccato — su qualsiasi essenza',
      en: 'Lacquer colour — on any wood species',
    },
    fin_grezza: { it: 'Grezza', en: 'Unfinished' },
    fin_verniciata: { it: 'Verniciata', en: 'Finished' },
    mis_largh: { it: 'Larghezza', en: 'Width' },
    mis_alt: { it: 'Altezza', en: 'Height' },
    ante_1: { it: '1 anta', en: 'Single leaf' },
    ante_2: { it: '2 ante', en: 'Double leaf' },
    muro_spess: { it: 'Spessore muro', en: 'Wall thickness' },
    all_integrale: { it: 'Integrale', en: 'One-piece' },
    all_imbottino: { it: 'Con imbottino', en: 'With liner' },
    mano_dx: { it: 'Mano DX', en: 'Right hand' },
    mano_sx: { it: 'Mano SX', en: 'Left hand' },
    mano_dx_sub: { it: 'spinge a destra', en: 'opens to the right' },
    mano_sx_sub: { it: 'spinge a sinistra', en: 'opens to the left' },
    tel_passaggio: { it: 'Aggiungi telaio di passaggio', en: 'Add pass-through frame' },
    lato_1: { it: '1 lato', en: '1 side' },
    lato_2: { it: '2 lati', en: '2 sides' },

    cta_preventivo: { it: 'Richiedi preventivo', en: 'Request a quote' },
    cta_pdf: { it: 'Genera PDF e invia', en: 'Generate PDF and send' },
    done_riapri: { it: 'Riapri il preventivo', en: 'Reopen the quote' },
    chiudi: { it: 'Chiudi', en: 'Close' },

    /* ---------- il configuratore, seconda passata ---------- */
    acc_titolo: { it: 'Accessori', en: 'Accessories' },
    man_titolo: {
      it: 'Modello maniglia \u2014 inventario fabbrica',
      en: 'Handle model \u2014 factory range',
    },
    met_ottone: { it: 'Ottone', en: 'Brass' },
    met_nero: { it: 'Nero opaco', en: 'Matte black' },
    met_cromo: { it: 'Cromo', en: 'Chrome' },
    amb_galleria: { it: 'Galleria', en: 'Showroom' },
    amb_ingresso: { it: 'Ingresso', en: 'Entrance' },
    amb_soggiorno: { it: 'Soggiorno', en: 'Living room' },
    amb_studio: { it: 'Studio', en: 'Study' },
    riep_porta: { it: 'Porta completa', en: 'Complete door' },
    riep_totale: { it: 'Totale', en: 'Total' },
    riep_iva: {
      it: 'IVA esclusa \u00b7 prezzi di listino 2026',
      en: 'VAT excluded \u00b7 2026 list prices',
    },
    vis_maniglia: { it: 'Maniglia', en: 'Handle' },
    vis_coprifilo: { it: 'Coprifilo', en: 'Architrave' },
    prev_occhiello: { it: 'Richiesta preventivo', en: 'Quote request' },
    prev_titolo: { it: 'I tuoi dati', en: 'Your details' },
    prev_note: { it: 'Note per il produttore', en: 'Notes for the maker' },
    prev_note_ph: {
      it: 'Consegna, misure particolari, senso di apertura\u2026',
      en: 'Delivery, special sizes, opening direction\u2026',
    },
    prev_invia: { it: 'Genera PDF e invia', en: 'Generate PDF and send' },
    prev_inviato: { it: 'Preventivo inviato', en: 'Quote sent' },
    demo_nota: {
      it: '(Demo: invio simulato — i PDF sono reali e completi.)',
      en: '(Demo: sending is simulated — the PDFs are real and complete.)',
    },
    done_allega: {
      it: 'Allega il <b>blocco ordine</b> alla mail per <b>ordini@toscocornici.it</b> dopo averlo controllato.',
      en: 'Attach the <b>order form</b> to the email to <b>ordini@toscocornici.it</b> once you have checked it.',
    },

    /* ---------- l'assistente, la sua pagina ---------- */
    ass_h1: { it: 'Che porta hai in mente?', en: 'What door do you have in mind?' },
    ass_intro: {
      it: 'Il catalogo ha 44 modelli. Dimmi com’è la tua e te ne lascio tre da '
        + 'guardare, invece di quarantaquattro.',
      en: 'The catalogue has 44 models. Tell me what yours is like and I’ll leave '
        + 'you three to look at, instead of forty-four.',
    },
    ass_foto_t: { it: 'Ho una foto', en: 'I have a photo' },
    ass_foto_d: {
      it: 'Una porta che ti piace, vista da qualche parte. Guardo com’è fatta e '
        + 'cerco le somiglianze nel catalogo.',
      en: 'A door you like, seen somewhere. I’ll look at how it’s built and find '
        + 'the closest matches in the catalogue.',
    },
    ass_racc_t: { it: 'Te la racconto', en: 'I’ll describe it' },
    ass_racc_d: {
      it: 'Con vetro o cieca, liscia o con le bugne, dritta o ad arco. Poche '
        + 'domande e ci arriviamo.',
      en: 'Glazed or solid, flat or with raised panels, square-headed or arched. '
        + 'A few questions and we’re there.',
    },
    ass_avviso: {
      it: '<span aria-hidden="true">·</span> Di 44 modelli, venti si riconoscono a '
        + 'colpo d’occhio; gli altri si somigliano fra loro. Per questo '
        + 'l’assistente propone <b>una rosa di modelli</b> e non un nome solo.',
      en: '<span aria-hidden="true">·</span> Of 44 models, twenty are recognisable '
        + 'at a glance; the rest resemble one another. That is why the assistant '
        + 'offers <b>a shortlist</b> and not a single name.',
    },
    ass_campo: {
      it: 'Scrivi com’è la porta, o allega una foto…',
      en: 'Describe the door, or attach a photo…',
    },
    ass_nota: {
      it: 'Le foto restano nel tuo browser finché non le mandi. JPG, PNG o WebP, fino a 8 MB.',
      en: 'Photos stay in your browser until you send them. JPG, PNG or WebP, up to 8 MB.',
    },
    ass_graffetta: { it: 'Allega una foto', en: 'Attach a photo' },
    ass_lascia: { it: 'Lascia qui la foto', en: 'Drop the photo here' },
  };

  /* ------------------------------------------------------------
     Quale lingua. L'indirizzo vince su tutto — cosi' si puo'
     mandare un collegamento gia' in inglese — poi quella scelta
     l'altra volta, poi quella del browser.
     ------------------------------------------------------------ */
  var LINGUE = ['it', 'en'];

  function scelta() {
    var q = new URLSearchParams(window.location.search).get('lang');
    if (LINGUE.indexOf(q) !== -1) return q;
    try {
      var m = window.localStorage.getItem('lingua');
      if (LINGUE.indexOf(m) !== -1) return m;
    } catch (e) { /* navigazione privata */ }
    return (navigator.language || 'it').slice(0, 2) === 'en' ? 'en' : 'it';
  }

  var lingua = scelta();

  function T(chiave) {
    var v = DIZIONARIO[chiave];
    if (!v) return '';
    return v[lingua] !== undefined ? v[lingua] : v.it;
  }

  function applica() {
    document.documentElement.lang = lingua;

    document.querySelectorAll('[data-t]').forEach(function (el) {
      var t = T(el.dataset.t);
      if (t) el.innerHTML = t;
    });
    document.querySelectorAll('[data-t-ph]').forEach(function (el) {
      var t = T(el.dataset.tPh);
      if (t) el.placeholder = t;
    });
    document.querySelectorAll('[data-t-tit]').forEach(function (el) {
      var t = T(el.dataset.tTit);
      if (t) { el.title = t; el.setAttribute('aria-label', t); }
    });

    document.querySelectorAll('.lingua-scelta').forEach(function (b) {
      var suo = b.dataset.lingua === lingua;
      b.classList.toggle('is-attiva', suo);
      b.setAttribute('aria-pressed', suo ? 'true' : 'false');
    });

    document.dispatchEvent(new CustomEvent('linguacambiata', { detail: lingua }));
  }

  function cambia(nuova) {
    if (LINGUE.indexOf(nuova) === -1 || nuova === lingua) return;
    lingua = nuova;
    try { window.localStorage.setItem('lingua', nuova); } catch (e) { /* niente */ }
    // l'indirizzo segue la scelta: cosi' il collegamento che si copia
    // porta con se' la lingua giusta
    var u = new URL(window.location.href);
    u.searchParams.set('lang', nuova);
    window.history.replaceState({}, '', u);
    applica();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('.lingua-scelta');
    if (b) cambia(b.dataset.lingua);
  });

  window.T = T;
  window.lingua = function () { return lingua; };
  window.cambiaLingua = cambia;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applica);
  } else {
    applica();
  }
}());
