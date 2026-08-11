# -*- coding: utf-8 -*-
"""
I DXF DEI COPRIFILI, MESSI AL LORO POSTO.

La fabbrica ha mandato 17 disegni. Il nome del file NON e' affidabile:
tre erano etichettati con un modello e ne disegnavano un altro. Si vede
subito misurando, perche' il listino chiama ogni profilo con la sua
sezione (S1_24,5x69, CS205_40x90, ...) e la sezione e' proprio quello
che il DXF dice al centesimo.

I TRE CASI, per non riscoprirli fra sei mesi
  michelangelo_cs300_90_70.dxf   e' identico, punto per punto, al primo
      file arrivato (24,69 x 69,00) -- cioe' al PIERRE S1_24,5x69. Un
      doppione con l'etichetta sbagliata: non si usa.
  raffaello_s_90_70.dxf          misura 40 x 90. Il 90 del Raffaello e'
      il CS400_32x90 (e quel file c'e', SCORN-CS400_32x90, e misura 32).
      40x90 nel listino e' uno solo: il CS205 del MICHELANGELO.
  pierre_s1_70_70.dxf            misura 47 x 86 e nel listino non c'e'
      niente di quella sezione. Resta fuori finche' la fabbrica non dice
      cos'e'.

Quindi qui la mappa e' scritta a mano, per RUOLO, e i JSON escono col
nome del ruolo: chi legge assets/coprifili vede a cosa serve un file, non
come lo aveva chiamato chi lo ha esportato.

Le chiavi sono <coprifilo>-<id misura> di COPRI_MISURE in js/app.js.

USO
    python tools/coprifili-dxf.py <cartella dei dxf>
"""

import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import importlib.util

_s = importlib.util.spec_from_file_location(
    'dxfprofilo', os.path.join(os.path.dirname(os.path.abspath(__file__)),
                               'dxf-profilo.py'))
dxfprofilo = importlib.util.module_from_spec(_s)
_s.loader.exec_module(dxfprofilo)

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVIO = os.path.join(RADICE, 'dxf', 'coprifili')

# ruolo -> (file di fabbrica, sezione nominale di listino)
MAPPA = [
    ('listellare-l70',   'liscio.dxf',                    '22x70'),
    ('pierre-p70',       'SCORN-COPRIFILO-SAGOMATO_24,5X69.dxf', 'S1_24,5x69'),
    ('tintoretto-t70',   'tintoretto_b_27x69.dxf',        'B_27x69'),
    ('tintoretto-t90',   'tintoretto_90_70.dxf',          'B_32x90'),
    ('raffaello-r70',    'raffaello.dxf',                 'BS_27x69'),
    ('raffaello-r90',    'SCORN-CS400_32x90.dxf',         'CS400_32x90'),
    ('giotto-g70',       'giotto_s2_30x69.dxf',           'S2_30x69'),
    ('giotto-g90',       'giotto_s2_90_70.dxf',           'S2-90_32,5x90'),
    ('leonardo-e90',     'leonardo.dxf',                  'CS1_32,5x90'),
    ('michelangelo-h70', 'michelangelo.dxf',              'CS300-28_30x70'),
    ('michelangelo-h90', 'raffaello_s_90_70.dxf',         'CS205_40x90'),
    ('cartesio-c70',     'cartesio_cs207_32x70.dxf',      'CS207_32x70'),
    ('cartesio-c100',    'cartesio_cs207_100_70.dxf',     'CS2_34x100'),
    ('caravaggio-v90',   'caravaggio.dxf',                'CS206_27x90'),
    ('tiziano-z90',      'tiziano.dxf',                   'CS204_30x90'),
    ('canaletto-n90',    'canaletto.dxf',                 'CS3_34x90'),
]

# disegnati ma non usati, e perche'
FUORI = {
    'michelangelo_cs300_90_70.dxf': 'doppione del Pierre S1_24,5x69',
    'pierre_s1_70_70.dxf': 'sezione 47x86: nel listino non esiste',
}

# quello che manca ancora
MANCANTI = [
    ('listellare-l90',  '22x90'),
    ('massello-m70',    '22x70 massello'),
    ('massello-m90',    '22x90 massello'),
    ('novecento-w110',  'CAP1_42x110'),
]


def nominale(codice):
    """Le due misure scritte nel codice di listino, in mm."""
    n = codice.split('_')[-1].replace(',', '.').lower()
    a, b = n.split('x')
    return float(a), float(b)


def main():
    if len(sys.argv) < 2:
        sys.exit('Uso: python tools/coprifili-dxf.py <cartella dei dxf>')
    da = sys.argv[1]
    os.makedirs(ARCHIVIO, exist_ok=True)

    for ruolo, file, codice in MAPPA:
        orig = os.path.join(da, file)
        if not os.path.exists(orig):
            orig = os.path.join(ARCHIVIO, file)
        if not os.path.exists(orig):
            print('  %-18s MANCA %s' % (ruolo, file))
            continue
        # il DXF di fabbrica si tiene in repo: e' la fonte, e da lui si
        # rifa' il JSON se il convertitore cambia
        shutil.copyfile(orig, os.path.join(ARCHIVIO, file))
        d = dxfprofilo.prepara(orig, ruolo)
        sp, lg = nominale(codice)
        # nel codice la sezione e' spessore x larghezza; gli archi fanno
        # pancia, percio' il misurato puo' superare il nominale di qualche
        # decimo -- se lo supera di piu' c'e' da guardarci
        scarto = max(abs(d['spessore'] - sp), abs(d['larghezza'] - lg))
        with open(os.path.join(RADICE, 'assets', 'coprifili', ruolo + '.json'),
                  'w', encoding='utf8') as g:
            import json
            json.dump(d, g, ensure_ascii=False)
        print('  %-18s %-16s %6.2f x %6.2f mm  (listino %5.1f x %5.1f, '
              'scarto %.2f)%s'
              % (ruolo, codice, d['larghezza'], d['spessore'], lg, sp, scarto,
                 '  <-- DA CONTROLLARE' if scarto > 2.5 else ''))

    print('\n  fuori uso:')
    for f, perche in FUORI.items():
        print('    %-32s %s' % (f, perche))
    print('  ancora da chiedere alla fabbrica:')
    for r, c in MANCANTI:
        print('    %-18s %s' % (r, c))


if __name__ == '__main__':
    main()
