# -*- coding: utf-8 -*-
"""La bugna di Tipo 1, presa dal tracciato e da nient'altro.

Il profilo NON si legge piu' dal DXF e non si aggiunge niente a mano:
i numeri stanno tutti nel pezzo «bugnato» del file che manda la
fabbrica, e sono questi.

    espesor      21    lo spessore del pannello
    bisel         4    quanto sale lo scivolo
    biselAncho   30    quanto e' largo
    biselPerfil recto  dritto
    rientro      16    il piano prima dello scivolo
    bastoneAncho 12    il regolo intorno al vano

Da li' esce tutto senza inventare un numero:
  il piano del pannello sta a meta' spessore, 10,5;
  lo scivolo sale di 4, quindi il bordo che entra in cava sta a 6,5;
  prima dello scivolo ci sono i 16 di rientro, piatti;
  lo scivolo e' largo 30 e dritto.

La volta prima avevo tenuto il labbro a 3 -- che era la misura del DXF --
e per arrivare a 10,5 mi ero dovuto inventare due gradini da 1,75. Erano
inventati, e infatti non erano quelli. Il labbro lo dice il bisel: 10,5
meno 4.

    python tools/bugna.py [file.puerta.json]
"""
import json, io, os, sys, glob

SORG = sys.argv[1] if len(sys.argv) > 1 else \
    r'C:\Users\Julic\Downloads\Puerta sin titulo.puerta.json'

t = json.load(io.open(SORG, encoding='utf8'))
b = next(p for p in t['piezas'] if p.get('papel') == 'bugnato')
SP = float(b['espesor'])
BISEL = float(b['bisel'])
LARGO = float(b['biselAncho'])
RIENTRO = float(b.get('rientro') or 0)
BASTONE = float(b.get('bastoneAncho') or 0)
print('dal tracciato: espesor %g, bisel %g, biselAncho %g, rientro %g, bastone %g'
      % (SP, BISEL, LARGO, RIENTRO, BASTONE))
print('               biselPerfil %s, perfilBugna %s, bastoneForma %s'
      % (b.get('biselPerfil'), b.get('perfilBugna'), b.get('bastoneForma')))

def profilo():
    mezzo = SP / 2                       # il piano del pannello
    labbro = mezzo - BISEL               # il bordo che entra in cava
    return [[0.0, labbro],
            [RIENTRO, labbro],           # il rientro, piatto
            [RIENTRO + LARGO, mezzo],    # lo scivolo, dritto
            [RIENTRO + LARGO + 6.0, mezzo]]

p = profilo()
n = 0
for f in glob.glob('assets/porte/*/anta.json'):
    d = json.load(io.open(f, encoding='utf8'))
    pa = d.get('pannello')
    if not pa:
        continue
    if pa.get('bugna'):
        pa.setdefault('bugna_dxf', pa['bugna'])
    pa['bugna_nuova'] = [[round(a, 2), round(c, 2)] for a, c in p]
    pa['spessore'] = SP
    if BASTONE:
        pa['regolo_largo'] = BASTONE
    io.open(f, 'w', encoding='utf8').write(json.dumps(d, ensure_ascii=False, indent=1))
    n += 1
print('%d porte.  profilo: %s' % (n, p))
