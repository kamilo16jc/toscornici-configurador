# -*- coding: utf-8 -*-
"""
ESTRAE TELAI E COPRIFILI DAL LISTINO 2025 (PDF).

Perche' dal PDF e non dai nostri file: i nostri sono ricalchi, e un
ricalco ha gli errori di chi ricalca. Le figure del listino sono
l'originale.

Le immagini INCORPORATE nel PDF pero' non servono: sono minuscole --
155x130 px il telaio ALPHA, 191x44 l'allargato integrale -- ed e'
esattamente il motivo per cui a suo tempo erano state ricalcate. Sopra
di esse il PDF ha poi disegni vettoriali (quote, richiami) e il testo,
che nell'immagine incorporata non ci sono affatto.

Quindi si RENDE la pagina ad alta risoluzione e si ritaglia. Cosi' viene
via tutto insieme: disegno, quote, nome, misure e prezzo, come sta sul
listino.

Ogni ritaglio e' una BANDA orizzontale: la colonna della descrizione a
sinistra piu' la figura a destra. Il nome e le misure stanno nella
descrizione, e separarli dalla figura vorrebbe dire rimetterli a mano.

USO
    python tools/estrai-dal-listino.py
"""

import os
import re
import sys

import fitz

PDF = 'C:/Users/Julic/Downloads/listino_2025 MASSELLO.pdf'
FUORI = ('C:/Users/Julic/OneDrive/Escritorio/Toscornici/'
         'Per il fabbricante 2026-08-10')
DPI = 300

# le pagine del PDF (indice da 0) e cosa contengono
PAGINE = {
    'telai': [49, 50, 51],
    'coprifili': [53, 54],
}

# I telai si riconoscono dalla misura in pixel dell'immagine incorporata:
# e' la stessa che hanno i nostri SVG, perche' da li' vengono.
# Lo 'std' non c'e': il listino non lo disegna.
TELAI_DA_PIXEL = {
    (155, 130): 'alpha',
    (148, 147): 'alpha_comp',
    (158, 157): 'design',
    (126, 119): 'alpha_comp_sp',
    (189, 174): 'design_comp',
    (197, 196): 'passaggio90',
    (224, 153): 'allargato_imbottino',
    (191, 44):  'allargato_integrale',
    (135, 83):  'r10',
    (139, 85):  'r10b',
    (182, 138): 'moderno',
    (175, 95):  'madonna',
    (187, 79):  'madonna_mod',
}

# I coprifili si riconoscono dal nome nella didascalia. L'ordine conta:
# 'listellare' va cercato prima di 'liscio', se no il massello se lo
# prende lui.
COPRI_DA_TESTO = [
    ('listellare',   'listellare'),
    ('massello',     'massello'),
    ('pierre',       'pierre'),
    ('s1_24,5',      'pierre'),
    ('tintoretto',   'tintoretto'),
    ('raffaello',    'raffaello'),
    ('giotto',       'giotto'),
    ('leonardo',     'leonardo'),
    ('cs1_32,5',     'leonardo'),
    ('michelangelo', 'michelangelo'),
    ('cartesio',     'cartesio'),
    ('caravaggio',   'caravaggio'),
    ('tiziano',      'tiziano'),
    ('canaletto',    'canaletto'),
    ('novecento',    'novecento'),
]


def pulisci(t):
    return re.sub(r'\s+', ' ', t).strip()


def nome_coprifilo(testo):
    """Il nome del file per un coprifilo, preso dalla SUA riga.

    PROVATO E SCARTATO: indovinare il modello cercando la parola chiave
    ('tintoretto', 'giotto'...) nel testo vicino alla figura. La pagina
    dei coprifili e' una tabella fitta e ogni tentativo ne rimetteva a
    posto uno e ne spostava un altro: il liscio listellare finiva col
    nome del massello, il Michelangelo con quello del Leonardo.

    Un nome sbagliato su un disegno che va in fabbrica e' peggio di un
    nome scomodo. Quindi il file si chiama come la riga del listino da
    cui viene, ripulita: cosi' non e' bello ma non mente, e la riga si
    puo' verificare sulla pagina intera.
    """
    t = pulisci(testo)
    # via i prezzi e le unita', che nel nome non servono
    t = re.sub(r'€[^·]*', '', t)
    t = re.sub(r'cad|ml', '', t, flags=re.I)
    t = t.split('·')[0]
    t = re.sub(r'^coprifilo\s+', '', t, flags=re.I)
    slug = re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-')[:44]
    return slug or None


def riga_della_figura(rett, blocchi):
    """Il testo della RIGA in cui sta la figura, non della banda.

    La pagina dei coprifili e' una tabella fitta: la banda ritagliata
    prende anche le righe di sopra e di sotto, e chiamando i file col
    testo della banda uscivano nomi sbagliati -- il liscio listellare si
    prendeva la didascalia del massello. Il nome deve venire dalla riga
    che sta all'altezza della figura, e da quella sola.
    """
    righe = []
    for b in blocchi:
        by0, by1, testo = b[1], b[3], b[4].strip()
        if not testo:
            continue
        if by1 > rett.y0 - 4 and by0 < rett.y1 + 4:
            righe.append((by0, b[0], pulisci(testo)))
    # tutti i pezzi della riga, non solo quello col nome: il Pierre si
    # chiama "Coprifilo sagomato" e il suo codice S1_24,5X69 sta in un
    # blocco a parte -- con un blocco solo restava senza nome
    righe.sort()
    return ' · '.join(r[2] for r in righe)


def banda(pagina, rett, blocchi, stretta=False):
    """La banda orizzontale che tiene insieme figura e descrizione.

    Il listino non tiene lo stesso ordine su tutte le pagine: sui telai
    la descrizione sta a SINISTRA e la figura a destra, sui coprifili e'
    il contrario. Quindi non si guarda da che parte sta il testo, solo
    che sia alla stessa altezza.

    'stretta' serve ai coprifili, dove la pagina e' una tabella fitta e
    ogni RIGA e' un profilo: allargando la banda al testo vicino ci
    finivano dentro le righe di sopra e di sotto, e il ritaglio del
    Michelangelo si portava appresso il prezzo del Leonardo. Li' il
    taglio segue l'altezza della figura e basta.
    """
    if stretta:
        return (fitz.Rect(22, rett.y0 - 5, pagina.rect.x1 - 14, rett.y1 + 5),
                riga_della_figura(rett, blocchi))
    y0, y1 = rett.y0, rett.y1
    vicini = []
    for b in blocchi:
        by0, by1, testo = b[1], b[3], b[4]
        if not testo.strip():
            continue
        if by1 > y0 - 14 and by0 < y1 + 14:
            vicini.append((by0, by1, b[0], pulisci(testo)))
    if vicini:
        y0 = min(y0, min(v[0] for v in vicini))
        y1 = max(y1, max(v[1] for v in vicini))
    vicini.sort(key=lambda v: (v[0], v[2]))
    r = fitz.Rect(22, y0 - 10, pagina.rect.x1 - 14, y1 + 10)
    return r, ' · '.join(v[3] for v in vicini)


def main():
    if not os.path.exists(PDF):
        sys.exit('Non trovo il listino: ' + PDF)
    doc = fitz.open(PDF)
    zoom = DPI / 72.0
    mat = fitz.Matrix(zoom, zoom)

    for sotto in ('telai', 'coprifili', 'pagine'):
        os.makedirs(os.path.join(FUORI, sotto), exist_ok=True)

    manifesto = []
    for kind, pagine in PAGINE.items():
        for pno in pagine:
            p = doc[pno]
            # la pagina intera, che e' la prova di dove viene ogni ritaglio
            p.get_pixmap(matrix=mat).save(
                os.path.join(FUORI, 'pagine', 'listino_p%02d.png' % (pno + 1)))

            blocchi = p.get_text('blocks')
            visti = {}
            for im in p.get_images(full=True):
                info = doc.extract_image(im[0])
                misura = (info['width'], info['height'])
                for rett in p.get_image_rects(im[0]):
                    r, testo = banda(p, rett, blocchi, stretta=(kind == 'coprifili'))
                    if kind == 'telai':
                        ident = TELAI_DA_PIXEL.get(misura)
                    else:
                        ident = nome_coprifilo(testo)
                    if not ident:
                        continue
                    # lo stesso profilo compare in piu' misure: si numera
                    visti[ident] = visti.get(ident, 0) + 1
                    nome = ident if visti[ident] == 1 else '%s_%d' % (ident, visti[ident])
                    file = os.path.join(FUORI, kind, nome + '.png')
                    p.get_pixmap(matrix=mat, clip=r).save(file)
                    manifesto.append((kind, nome, pno + 1, misura, testo[:120]))
                    print('  %-10s %-24s pag.%2d  %s' % (kind, nome + '.png', pno + 1,
                                                         testo[:58]))

    with open(os.path.join(FUORI, 'INDICE.txt'), 'w', encoding='utf8') as f:
        f.write('ESTRATTO DAL LISTINO 2025 (listino_2025 MASSELLO.pdf)\n')
        f.write('Ritagli a %d DPI. Le pagine intere stanno in pagine/.\n\n' % DPI)
        for kind, nome, pag, mis, testo in manifesto:
            f.write('%-10s %-26s listino p.%-3d  (fig. %dx%d px)\n            %s\n'
                    % (kind, nome + '.png', pag, mis[0], mis[1], testo))
        f.write('\nNOTA: il telaio STANDARD non compare — il listino non lo disegna.\n')

    print('')
    print('%d ritagli + %d pagine intere in:' % (len(manifesto),
          sum(len(v) for v in PAGINE.values())))
    print('  ' + FUORI)


if __name__ == '__main__':
    main()
