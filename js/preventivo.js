/* ============================================================
   PREVENTIVO — il documento del cliente
   ------------------------------------------------------------
   Il preventivo non si disegna piu' trazzo per trazzo con jsPDF:
   si scrive in HTML e si stampa. jsPDF porta solo le Helvetica, ed
   e' per quello che il vecchio documento aveva caratteri diversi da
   quelli del sito. Qui il foglio e' lo stesso della proposta
   (css/preventivo.css) e i caratteri sono Barlow davvero.

   Il blocco ordine TL_2018 resta a jsPDF: quello e' un modulo di
   fabbrica con le caselle calibrate al punto, e li' il disegno a
   coordinate e' la scelta giusta.
   ============================================================ */

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

// il testo arriva da un modulo compilato a mano: va sempre scappato
const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const soldi = (v) => eur.format(v);

/* ---------- i pezzi del foglio ---------- */

const coppia = (et, val, sotto) => `
        <div class="coppia">
          <dt>${esc(et)}</dt>
          <dd>${esc(val || '—')}${sotto ? `<small>${esc(sotto)}</small>` : ''}</dd>
        </div>`;

const voce = (r) => `
          <tr>
            <td class="desc">${esc(r.k)}${r.sub ? `<small>${esc(r.sub)}</small>` : ''}</td>
            <td class="cifra">${r.v === 0 && /definire|va aggiunto/.test(r.sub || '')
              ? '<span class="compreso">da definire</span>' : soldi(r.v)}</td>
          </tr>`;

/* ---------- il documento intero ---------- */

export function documentoPreventivo(d) {
  const piu = d.qty > 1;

  // Il foglio 1 ne regge una dozzina; oltre, il resto scende su un
  // foglio suo invece di finire mangiato dal margine.
  const PRIME = 12;
  const primeVoci = d.righe.slice(0, PRIME);
  const restoVoci = d.righe.slice(PRIME);

  const totaleBlocco = `
      <div class="totale">
        <div>
          <p class="totale-voce">${piu ? 'Totale a porta' : 'Totale'}</p>
          <p class="totale-nota">IVA esclusa · prezzi di listino 2026</p>
        </div>
        <div>
          <p class="totale-cifra">${soldi(d.totale)}</p>
          ${piu ? `<p class="totale-unita">${d.qty} porte — ${soldi(d.totale * d.qty)}</p>` : ''}
        </div>
      </div>`;

  const piede = (n) => `
  <footer class="piede">
    <span>Toscocornici · ordini@toscocornici.it</span>
    <span>Documento generato dal configuratore</span>
    <span>Foglio ${n} di ${d.fogli}</span>
  </footer>`;

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Preventivo ${esc(d.rif)} — ${esc(d.modello)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/preventivo.css?v=2">
</head>
<body>

<div class="barra-stampa">
  <span><b>Preventivo ${esc(d.rif)}</b> — pronto da salvare.</span>
  <span>Nella finestra di stampa scegli <b>Salva come PDF</b>.</span>
  <button type="button" onclick="window.print()">Salva in PDF</button>
</div>

<!-- ---------- foglio 1: il preventivo ---------- -->
<section class="foglio">

  <header class="testata">
    ${d.logo ? `<img src="${d.logo}" alt="Toscocornici">`
             : '<p class="doc-tipo">Toscocornici</p>'}
    <div class="testata-dati">
      <p class="doc-tipo">Preventivo</p>
      <p class="doc-rif">RIF. ${esc(d.rif)}</p>
      <p class="doc-data">${esc(d.data)}</p>
    </div>
  </header>
  <div class="filo-oro"></div>

  <div class="corpo">

    <div class="intro">
      <p class="occhiello">La tua porta</p>
      <h1 class="titolo">${esc(d.modello)}</h1>
      <p class="sottotitolo">${esc(d.sottotitolo)}</p>
    </div>

    <section class="sezione">
      <h3 class="sezione-titolo"><span class="num">01</span> Cliente <span class="en">Customer</span></h3>
      <dl class="coppie">${d.cliente.map((c) => coppia(c[0], c[1], c[2])).join('')}
      </dl>
    </section>

    <section class="sezione">
      <h3 class="sezione-titolo"><span class="num">02</span> La configurazione <span class="en">Configuration</span></h3>
      <dl class="coppie">${d.config.map((c) => coppia(c[0], c[1], c[2])).join('')}
      </dl>
    </section>

    <section class="sezione">
      <h3 class="sezione-titolo"><span class="num">03</span> Il preventivo <span class="en">Quote</span></h3>
      <table class="voci"><tbody>${primeVoci.map(voce).join('')}
      </tbody></table>
      ${restoVoci.length ? '' : totaleBlocco}
    </section>

    ${restoVoci.length ? '' : `
    <div class="chiusura">
      ${d.note ? `<div class="note"><b>Nota del cliente.</b> ${esc(d.note)}</div>`
               : '<div class="note"><b>Rilievo.</b> Le misure indicate sono quelle dichiarate dal cliente: prima della produzione vanno confermate in cantiere.</div>'}
      <div class="condizioni">
        <h4>Condizioni</h4>
        <p><b>Validità</b> — 30 giorni dalla data del documento.</p>
        <p><b>Misure</b> — vale il rilievo in cantiere.</p>
        <p><b>Consegna</b> — 6–8 settimane dalla conferma.</p>
      </div>
    </div>`}

    ${d.fuoriListino ? `
    <div class="avviso-listino">
      <b>Fuori listino.</b> ${esc(d.fuoriListino)} Il totale qui sopra non comprende
      questa lavorazione: il prezzo lo conferma la fabbrica.
    </div>` : ''}

  </div>
  ${piede(1)}
</section>

${restoVoci.length ? `
<!-- ---------- foglio di seguito: le voci restanti ---------- -->
<section class="foglio">
  <p class="seguito">Preventivo ${esc(d.rif)} · seguito</p>
  <div class="corpo">
    <section class="sezione">
      <h3 class="sezione-titolo"><span class="num">03</span> Il preventivo <span class="en">segue</span></h3>
      <table class="voci"><tbody>${restoVoci.map(voce).join('')}
      </tbody></table>
      ${totaleBlocco}
    </section>

    <div class="chiusura">
      ${d.note ? `<div class="note"><b>Nota del cliente.</b> ${esc(d.note)}</div>`
               : '<div class="note"><b>Rilievo.</b> Le misure indicate sono quelle dichiarate dal cliente: prima della produzione vanno confermate in cantiere.</div>'}
      <div class="condizioni">
        <h4>Condizioni</h4>
        <p><b>Validità</b> — 30 giorni dalla data del documento.</p>
        <p><b>Misure</b> — vale il rilievo in cantiere.</p>
        <p><b>Consegna</b> — 6–8 settimane dalla conferma.</p>
      </div>
    </div>
  </div>
  ${piede(2)}
</section>` : ''}

<!-- ---------- ultimo foglio: la porta ---------- -->
<section class="foglio foglio--porta">

  <header class="porta-testa">
    <div>
      <p class="occhiello">Come sarà</p>
      <h2>${esc(d.modello)}</h2>
    </div>
    <p class="rif">RIF. ${esc(d.rif)}</p>
  </header>

  <figure class="telaio-foto${d.scena ? '' : ' telaio-foto--oggetto'}">
    ${d.immagine ? `<img src="${d.immagine}" alt="La porta configurata">`
                 : '<figcaption class="segnaposto">Render della configurazione</figcaption>'}
  </figure>

  <dl class="porta-dati">
    <div><dt>Modello</dt><dd>${esc(d.modello)}</dd></div>
    <div><dt>Essenza</dt><dd>${esc(d.essenza)}</dd></div>
    <div><dt>Luce</dt><dd>${esc(d.luce)}</dd></div>
    <div><dt>Maniglia</dt><dd>${esc(d.maniglia)}</dd></div>
  </dl>

  <p class="avviso-render" style="margin-top: 7mm;">
    L’immagine è una rappresentazione della configurazione scelta, non una fotografia
    del prodotto finito: venature, tonalità del legno e luce dell’ambiente possono
    differire. Fanno fede le misure e le voci del foglio 1.
  </p>

  <footer class="porta-piede">
    <span>Toscocornici · ordini@toscocornici.it</span>
    <span>Foglio ${d.fogli} di ${d.fogli}</span>
  </footer>

</section>

</body>
</html>`;
}

/* ------------------------------------------------------------
   Apre il documento e chiama la stampa.

   Va in un iframe nascosto, non in una finestra nuova: cosi' non
   c'e' blocco dei popup di mezzo. Prima di stampare si aspettano
   i caratteri e le immagini — senza, Chrome stampa il foglio con
   le sostitutive e il disegno salta.
   ------------------------------------------------------------ */
export async function stampaPreventivo(dati) {
  const vecchio = document.getElementById('telaioStampa');
  if (vecchio) vecchio.remove();

  const frame = document.createElement('iframe');
  frame.id = 'telaioStampa';
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  doc.open();
  doc.write(documentoPreventivo(dati));
  doc.close();

  await new Promise((ok) => {
    if (doc.readyState === 'complete') return ok();
    frame.addEventListener('load', ok, { once: true });
  });

  const fin = frame.contentWindow;
  try {
    if (fin.document.fonts) await fin.document.fonts.ready;
    await Promise.all([...fin.document.images].map((i) => (i.complete
      ? Promise.resolve()
      : new Promise((ok) => { i.onload = i.onerror = ok; }))));
  } catch (e) { /* se i caratteri non arrivano si stampa comunque */ }

  fin.focus();
  fin.print();
  return frame;
}
