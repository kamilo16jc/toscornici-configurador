# -*- coding: utf-8 -*-
"""La bugna di Tipo 1 come la vuole la fabbrica, non come l'ho letta io.

Dal DXF avevo tirato fuori un profilo largo sessanta che sale di dieci e
mezzo, tutto in curva. La specifica dice un'altra cosa, e la specifica
comanda:

    bisel        4     quanto sale lo scivolo
    biselAncho  30     quanto e' largo
    biselPerfil recto  dritto, non curvo
    perfilBugna dobleEscalon
    rientro     16     quanto entra nella cava
    bastoneAncho 12    il regolo, che era sedici

DOVE STANNO I DUE GRADINI. Lo scivolo dritto sale di quattro; dal
labbro in cava (tre di mezzo spessore) al piano del pannello (dieci e
mezzo) ce ne sono sette e mezzo. I tre e mezzo che restano sono i due
gradini, uno prima dello scivolo e uno dopo -- ed e' quel che vuol dire
«doppio gradino». Divisi a meta': 1,75 per uno. E' l'unica cosa qui che
non viene da un numero dato; se la fabbrica li vuole diversi, sono due
righe.

Il profilo vecchio NON si butta: resta come `bugna_dxf`. E' la misura
del disegno, e un giorno puo' servire a confrontare.

    python tools/bugna.py
"""
import json, io, os, glob

BISEL = 4.0
LARGO_BISEL = 30.0
RIENTRO = 16.0
LABBRO = 3.0            # mezzo spessore della linguetta in cava
BASTONE = 12.0

def profilo(mezzo):
    """(distanza dal bordo del vano, mezzo spessore) -- come la bugna."""
    resta = mezzo - LABBRO - BISEL
    grad = max(0.0, resta / 2)
    x = 0.0
    p = [[0.0, LABBRO], [RIENTRO, LABBRO]]          # la linguetta, piatta
    x = RIENTRO
    p.append([x, LABBRO + grad])                    # primo gradino, di squadro
    x += LARGO_BISEL
    p.append([x, LABBRO + grad + BISEL])            # lo scivolo, dritto
    p.append([x, mezzo])                            # secondo gradino
    p.append([x + 6.0, mezzo])                      # e il piano del pannello
    return [[round(a, 2), round(b, 2)] for a, b in p]

n = 0
for f in glob.glob('assets/porte/*/anta.json'):
    d = json.load(io.open(f, encoding='utf8'))
    pa = d.get('pannello')
    if not pa or not pa.get('bugna'):
        continue
    mezzo = max(q[1] for q in pa['bugna'])          # il pannello e' spesso quanto era
    pa.setdefault('bugna_dxf', pa['bugna'])
    pa['bugna_nuova'] = profilo(mezzo)
    pa['regolo_largo'] = BASTONE
    io.open(f, 'w', encoding='utf8').write(json.dumps(d, ensure_ascii=False, indent=1))
    n += 1
print('%d porte: bugna_nuova (bisel %g su %g, doppio gradino) e regolo a %g mm'
      % (n, BISEL, LARGO_BISEL, BASTONE))
print('profilo:', profilo(10.5))
