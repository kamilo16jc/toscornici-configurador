/* ============================================================
   Il ponte fra la pagina e la funzione.
   ------------------------------------------------------------
   Sta a parte perche' l'interfaccia non deve sapere niente di reti,
   codici HTTP e base64: chiede "chi somiglia a questa foto" e riceve
   { testo, rosa }, la stessa forma che aveva il copione finto.

   La foto si rimpicciolisce QUI, nel browser. I campi che contano sono
   grossi -- quanto vetro, quanti riquadri, dritta o ad arco -- e per
   leggerli non serve la risoluzione piena: si spedisce meno, si aspetta
   meno, si paga meno. Una foto da 8 MB diventa 200 KB senza perdere
   niente di quello che serve.
   ============================================================ */
(function () {
  'use strict';

  var ENDPOINT = 'https://europe-west1-toscocornici-configuratore.cloudfunctions.net/assistente';
  var LATO_MAX = 1100;     // abbastanza per i campi grossi

  /** Rimpicciolisce e converte in JPEG base64. */
  function preparaFoto(file) {
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var s = Math.min(1, LATO_MAX / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        var dataUrl = c.toDataURL('image/jpeg', 0.85);
        ok({ dati: dataUrl.split(',')[1], tipo: 'image/jpeg' });
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        no(new Error('immagine illeggibile'));
      };
      img.src = url;
    });
  }

  var TESTI = {
    it: {
      rete: 'Non riesco a raggiungere il servizio. Riprova fra un momento.',
      troppe: 'Troppe richieste di fila. Aspetta un minuto e riprova.',
      grande: 'La foto e\' troppo grande anche dopo averla ridotta. Provane un\'altra.',
      illeggibile: 'Non riesco a leggere questa immagine. Provane un\'altra.',
      incerta: 'La foto si legge a fatica, quindi prendi la proposta con le pinze: '
             + 'se puoi, mandamene una con la porta intera e piu\' luce.',
      trovato: 'Ho guardato la foto. Queste sono le piu\' vicine in catalogo — '
             + 'aprile in grande e scegli tu.',
    },
    en: {
      rete: 'I can’t reach the service. Try again in a moment.',
      troppe: 'Too many requests in a row. Wait a minute and try again.',
      grande: 'The photo is still too large after resizing. Try another one.',
      illeggibile: 'I can’t read this image. Try another one.',
      incerta: 'The photo is hard to read, so take this with a pinch of salt: '
             + 'if you can, send one showing the whole door in better light.',
      trovato: 'I’ve looked at the photo. These are the closest in the catalogue — '
             + 'open them larger and choose.',
    },
  };

  /**
   * Chiede al servizio chi somiglia alla foto.
   * Ritorna sempre { testo, rosa } — rosa null se non c'e' niente da
   * mostrare. Gli errori diventano un messaggio, non un'eccezione: chi
   * chiama e' un'interfaccia, non deve gestire codici HTTP.
   */
  function cercaDaFoto(file, opzioni) {
    var o = opzioni || {};
    var L = TESTI[o.lingua === 'en' ? 'en' : 'it'];

    return preparaFoto(file).then(function (foto) {
      return fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foto: foto,
          lingua: o.lingua || 'it',
          numeroMessaggi: o.numeroMessaggi || 0,
        }),
      });
    }).then(function (r) {
      if (r.status === 429) return { testo: '<p>' + L.troppe + '</p>', rosa: null };
      if (r.status === 413) return { testo: '<p>' + L.grande + '</p>', rosa: null };
      if (r.status === 422) return { testo: '<p>' + L.illeggibile + '</p>', rosa: null };
      if (!r.ok) return { testo: '<p>' + L.rete + '</p>', rosa: null };
      return r.json().then(function (d) {
        if (!d.trovato) return { testo: '<p>' + d.testo + '</p>', rosa: null, lettura: d.lettura };
        var testo = '<p>' + L.trovato + '</p>';
        if (d.incerta) testo += '<p>' + L.incerta + '</p>';
        return {
          testo: testo,
          rosa: d.modelli.map(function (m) {
            return {
              id: m.id,
              nome: m.nome,
              linea: m.linea,
              img: m.immagine,
              dice: m.descrizione,
              link: m.link,
              vicinanza: m.vicinanza,
            };
          }),
          lettura: d.lettura,
        };
      });
    }).catch(function () {
      return { testo: '<p>' + L.rete + '</p>', rosa: null };
    });
  }

  window.assistenteServizio = { cercaDaFoto: cercaDaFoto };
}());
