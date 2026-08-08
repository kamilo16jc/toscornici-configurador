/* ============================================================
   ASSISTENTE — solo il guscio
   ------------------------------------------------------------
   Qui c'e' il comportamento dell'interfaccia e basta: i messaggi
   compaiono, la foto si allega e si toglie, si trascina sulla
   pagina, le schede dei modelli si aprono sul configuratore.

   Dietro NON c'e' nessuna intelligenza. Le risposte le decide
   rispondiFinta(), che e' un copione fisso, e la pagina lo dice
   invece di far credere il contrario: promettere un giudizio che
   non c'e' e' il modo piu' rapido di bruciare la fiducia.

   Quando arrivera' la logica vera, il punto d'innesto e' uno solo:
   rispondiFinta() diventa una chiamata al servizio e restituisce
   { testo, rosa }. Tutto il resto di questo file resta com'e'.
   ============================================================ */
(function () {
  'use strict';

  var MAX_BYTE = 8 * 1024 * 1024;
  var TIPI = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

  var conversazione = document.getElementById('conversazione');
  var scrivania = document.getElementById('scrivania');
  var campo = document.getElementById('campo');
  var invia = document.getElementById('invia');
  var fileInput = document.getElementById('fileInput');
  var allegato = document.getElementById('allegato');
  var allegatoImg = document.getElementById('allegatoImg');
  var allegatoNome = document.getElementById('allegatoNome');
  var allegatoPeso = document.getElementById('allegatoPeso');
  var pioggia = document.getElementById('pioggia');

  var foto = null;      // { file, url }
  var strada = null;    // 'foto' | 'racconto'

  /* ---------- i modelli d'esempio ----------
     Sono il gruppo che si somiglia davvero: stesso profilo — niente
     vetro, niente arco, due bugne — e infatti l'indice non li sa
     distinguere. Come esempio dicono la verita' meglio di tre porte
     scelte a caso. */
  var ESEMPIO = [
    { id: 'country', nome: 'Country', linea: 'Base', img: 'assets/modelli/country.webp',
      dice: 'Due riquadri, divisione orizzontale' },
    { id: 'emilia', nome: 'Emilia', linea: 'Base', img: 'assets/modelli/emilia.webp',
      dice: 'Due riquadri verticali affiancati' },
    { id: 'pienza', nome: 'Pienza', linea: 'Base', img: 'assets/modelli/pienza.webp',
      dice: 'Due riquadri, traversa in rilievo' },
  ];

  /* ---------- i messaggi ---------- */

  function scendi() {
    window.requestAnimationFrame(function () {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
  }

  var primo = true;

  function messaggio(chi, dentro) {
    var m = document.createElement('div');
    m.className = 'messaggio messaggio--' + chi;
    var sigla = document.createElement('div');
    sigla.className = 'messaggio-chi';
    sigla.setAttribute('aria-hidden', 'true');
    sigla.textContent = chi === 'assistente' ? 'T' : 'Tu';
    var corpo = document.createElement('div');
    corpo.className = 'messaggio-corpo';
    if (typeof dentro === 'string') corpo.innerHTML = dentro;
    else corpo.appendChild(dentro);
    m.appendChild(sigla);
    m.appendChild(corpo);
    conversazione.appendChild(m);
    // il saluto non scorre: appena aperta la pagina non c'e' niente da
    // inseguire, e scorrere spinge il titolo sotto la barra
    if (primo) primo = false;
    else scendi();
    return m;
  }

  function pensa() {
    var p = document.createElement('div');
    p.className = 'puntini';
    p.innerHTML = '<span></span><span></span><span></span>';
    return messaggio('assistente', p);
  }

  /* la rosa: le schede dei modelli dentro a un messaggio */
  function rosa(modelli) {
    var box = document.createElement('div');
    box.className = 'rosa';
    var t = document.createElement('p');
    t.className = 'rosa-titolo';
    t.textContent = 'Somigliano a quella che cerchi';
    box.appendChild(t);

    var griglia = document.createElement('div');
    griglia.className = 'rosa-schede';
    modelli.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'scheda-porta';
      b.dataset.modello = m.id;
      b.innerHTML =
        '<figure><img src="' + m.img + '" alt="Porta ' + m.nome + '" loading="lazy"></figure>' +
        '<div class="porta-scheda-dati">' +
          '<b>' + m.nome + '</b>' +
          '<small>Linea ' + m.linea + ' · ' + m.dice + '</small>' +
          '<span class="scheda-apri">Aprila nel configuratore →</span>' +
        '</div>';
      // il collegamento profondo non c'e' ancora: per ora si apre il
      // configuratore e basta, senza il modello gia' scelto
      b.addEventListener('click', function () {
        window.location.href = 'configuratore.html';
      });
      griglia.appendChild(b);
    });
    box.appendChild(griglia);
    return box;
  }

  /* ---------- il copione finto ----------
     Il punto d'innesto della logica vera: qui dentro, domani, ci va
     la chiamata al servizio. La firma non cambia. */
  function rispondiFinta(testo, conFoto) {
    if (conFoto) {
      return {
        testo: '<p>Ho guardato la foto. Vedo <b>due riquadri ciechi</b>, niente vetro e ' +
               'la parte alta dritta.</p><p>Nel catalogo cinque porte hanno due riquadri: ' +
               'l’indice li conta, ma non registra come sono disposti. Queste tre sono le ' +
               'piu’ vicine — guardale in grande e scegli tu.</p>',
        rosa: ESEMPIO,
      };
    }
    if (strada === 'racconto' && conversazione.querySelectorAll('.messaggio--cliente').length < 2) {
      return {
        testo: '<p>Bene. Due cose e ci siamo:</p><p>La vuoi <b>con vetro</b> o <b>cieca</b>? ' +
               'E la parte alta — <b>dritta</b> o <b>ad arco</b>?</p>',
        rosa: null,
      };
    }
    return {
      testo: '<p>Da quello che mi dici siamo su una porta cieca, dritta, coi pannelli.</p>' +
             '<p>Eccone tre da guardare.</p>',
      rosa: ESEMPIO,
    };
  }

  function rispondi(testo, conFoto) {
    var attesa = pensa();
    window.setTimeout(function () {
      var r = rispondiFinta(testo, conFoto);
      attesa.remove();
      var m = messaggio('assistente', r.testo);
      if (r.rosa) m.querySelector('.messaggio-corpo').appendChild(rosa(r.rosa));
      scendi();
    }, 900);
  }

  /* ---------- l'allegato ---------- */

  function pesa(n) {
    return n < 1024 * 1024
      ? Math.round(n / 1024) + ' KB'
      : (n / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
  }

  function prendiFoto(file) {
    if (!file) return;
    if (TIPI.indexOf(file.type) === -1) {
      messaggio('assistente', '<p>Quel formato non lo apro. Mandamela in <b>JPG</b>, ' +
                              '<b>PNG</b> o <b>WebP</b>.</p>');
      return;
    }
    if (file.size > MAX_BYTE) {
      messaggio('assistente', '<p>La foto pesa ' + pesa(file.size) + ': il limite è 8 MB. ' +
                              'Una piu’ leggera va benissimo, non serve altissima qualità.</p>');
      return;
    }
    if (foto) URL.revokeObjectURL(foto.url);
    foto = { file: file, url: URL.createObjectURL(file) };
    allegatoImg.src = foto.url;
    allegatoImg.alt = 'Anteprima di ' + file.name;
    allegatoNome.textContent = file.name;
    allegatoPeso.textContent = pesa(file.size);
    allegato.hidden = false;
    aggiornaInvia();
    campo.focus();
  }

  function togliFoto() {
    if (foto) URL.revokeObjectURL(foto.url);
    foto = null;
    fileInput.value = '';
    allegato.hidden = true;
    aggiornaInvia();
  }

  document.getElementById('allegatoVia').addEventListener('click', togliFoto);
  fileInput.addEventListener('change', function () { prendiFoto(fileInput.files[0]); });

  /* ---------- trascinare la foto sulla pagina ---------- */
  var dentro = 0;
  window.addEventListener('dragenter', function (e) {
    if (!e.dataTransfer || e.dataTransfer.types.indexOf('Files') === -1) return;
    dentro += 1;
    pioggia.hidden = false;
  });
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('dragleave', function () {
    dentro -= 1;
    if (dentro <= 0) { dentro = 0; pioggia.hidden = true; }
  });
  window.addEventListener('drop', function (e) {
    e.preventDefault();
    dentro = 0;
    pioggia.hidden = true;
    if (e.dataTransfer && e.dataTransfer.files.length) prendiFoto(e.dataTransfer.files[0]);
  });

  /* incollare uno screenshot: e' il modo piu' naturale di mandare una foto */
  window.addEventListener('paste', function (e) {
    if (!e.clipboardData) return;
    var items = e.clipboardData.items;
    for (var i = 0; i < items.length; i += 1) {
      if (items[i].type.indexOf('image/') === 0) {
        prendiFoto(items[i].getAsFile());
        e.preventDefault();
        return;
      }
    }
  });

  /* ---------- il campo ---------- */

  function aggiornaInvia() {
    invia.disabled = !campo.value.trim() && !foto;
  }

  function cresci() {
    campo.style.height = 'auto';
    campo.style.height = Math.min(campo.scrollHeight, 168) + 'px';
  }

  campo.addEventListener('input', function () { cresci(); aggiornaInvia(); });
  campo.addEventListener('keydown', function (e) {
    // invio manda, maiuscolo+invio va a capo
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      scrivania.requestSubmit();
    }
  });

  scrivania.addEventListener('submit', function (e) {
    e.preventDefault();
    var testo = campo.value.trim();
    if (!testo && !foto) return;

    var corpo = document.createElement('div');
    if (foto) {
      var im = document.createElement('img');
      im.src = foto.url;
      im.alt = 'Foto allegata';
      corpo.appendChild(im);
    }
    if (testo) {
      var p = document.createElement('p');
      p.textContent = testo;
      corpo.appendChild(p);
    }
    messaggio('cliente', corpo);

    var avevaFoto = !!foto;
    // l'anteprima resta viva nel messaggio: si stacca, non si revoca
    foto = null;
    fileInput.value = '';
    allegato.hidden = true;
    campo.value = '';
    cresci();
    aggiornaInvia();

    rispondi(testo, avevaFoto);
  });

  /* ---------- le due strade ---------- */
  document.querySelectorAll('.strada').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.strada').forEach(function (x) {
        x.classList.toggle('is-scelta', x === b);
      });
      strada = b.dataset.strada;
      if (strada === 'foto') {
        messaggio('assistente',
          '<p>Mandami la foto: va bene anche storta o di sera, purché si veda ' +
          'la porta intera.</p><p>Trascinala qui sopra, incollala, o usa la graffetta.</p>');
        fileInput.click();
      } else {
        messaggio('assistente',
          '<p>Cominciamo dalla cosa che divide di piu’ il catalogo:</p>' +
          '<p>la porta che hai in mente ha <b>del vetro</b>, oppure è <b>tutta di legno</b>?</p>');
        campo.focus();
      }
    });
  });

  /* ---------- il benvenuto ---------- */
  messaggio('assistente',
    '<p>Ciao. Dimmi com’è la porta che cerchi e ti mostro i modelli del ' +
    'catalogo che le somigliano.</p>' +
    '<p><b>Attenzione:</b> per ora rispondo con un esempio fisso — il ' +
    'riconoscimento vero non è ancora collegato. Questa è la pagina, ' +
    'non ancora l’assistente.</p>');

  aggiornaInvia();
}());
