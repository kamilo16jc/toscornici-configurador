# -*- coding: utf-8 -*-
"""
DA DXF A PROFILO 3D — i coprifili come sono davvero.

La fabbrica manda i DXF di sezione: coordinate esatte, archi con centro
e raggio. Finalmente non c'e' niente da indovinare -- fin qui i nostri
coprifili erano immagini di repertorio e i telai ricalchi di miniature.

TRE COSE VISTE LEGGENDO IL PRIMO FILE
1. Il DXF porta anche il RIQUADRO DEL FOGLIO: quattro linee che fanno un
   rettangolo 280x200 attorno al disegno. Non e' il profilo, e tenendolo
   la sezione verrebbe fuori grande come la pagina. Si riconosce perche'
   i suoi quattro vertici sono gli angoli esatti del rettangolo.
2. I codici di gruppo delle LINE non sono in coppia come uno se li
   aspetta: prima 10 e 11 (le due x), poi 20 e 21 (le due y).
3. Tolto il riquadro, il profilo misura 69,00 x 24,68 mm -- che e'
   esattamente il nome del file, 24,5X69. Il decimo di troppo e' la
   pancia degli archi: la misura nominale e' sul corpo.

USO
    python tools/dxf-profilo.py <file.dxf> [altro.dxf ...]
Scrive un JSON col contorno chiuso, pronto da estrudere.
"""

import io
import json
import math
import os
import sys

FUORI = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                     'assets', 'profili')
PASSO_ARCO = 2.0     # gradi per segmento: sotto il decimo di mm sul raggio
CHIUSO = 0.05        # due punti piu' vicini di cosi' sono lo stesso punto


def leggi(percorso):
    """Le entita' del DXF, come dizionari {codice: valore}."""
    righe = [l.rstrip('\n').strip()
             for l in io.open(percorso, encoding='utf8', errors='replace')]
    ent, cur = [], None
    i = 0
    while i < len(righe) - 1:
        cod, val = righe[i], righe[i + 1]
        if cod == '0':
            if cur:
                ent.append(cur)
            cur = {'tipo': val} if val in ('LINE', 'ARC') else None
        elif cur is not None and cod.isdigit():
            cur[int(cod)] = val
        i += 2
    if cur:
        ent.append(cur)
    return ent


def punti(e):
    """L'entita' come catena di punti."""
    n = lambda k: float(e[k])
    if e['tipo'] == 'LINE':
        return [(n(10), n(20)), (n(11), n(21))]
    cx, cy, r = n(10), n(20), n(40)
    a0, a1 = n(50), n(51)
    if a1 <= a0:
        a1 += 360.0
    passi = max(2, int(math.ceil((a1 - a0) / PASSO_ARCO)))
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * k / passi)),
             cy + r * math.sin(math.radians(a0 + (a1 - a0) * k / passi)))
            for k in range(passi + 1)]


def senza_riquadro(ent):
    """Via le quattro linee del bordo foglio.

    Si riconoscono da sole: sono LINE, stanno tutte sul rettangolo che
    circonda ogni altra cosa, e sono orizzontali o verticali.
    """
    xs = [p[0] for e in ent for p in punti(e)]
    ys = [p[1] for e in ent for p in punti(e)]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    ang = {(x0, y0), (x1, y0), (x1, y1), (x0, y1)}

    def bordo(e):
        if e['tipo'] != 'LINE':
            return False
        a, b = punti(e)
        vicino = lambda p: any(abs(p[0] - q[0]) < .01 and abs(p[1] - q[1]) < .01
                               for q in ang)
        return vicino(a) and vicino(b)

    return [e for e in ent if not bordo(e)]


def contorno(ent):
    """Incatena le entita' in un contorno chiuso.

    Il DXF non le da' in ordine: si parte da una e si cerca ogni volta
    quella che attacca all'ultimo punto, girandola se serve.
    """
    pezzi = [punti(e) for e in ent]
    catena = list(pezzi.pop(0))
    while pezzi:
        fine = catena[-1]
        vicino = lambda p: math.hypot(p[0] - fine[0], p[1] - fine[1])
        migliore, girato, dist = None, False, 1e9
        for i, pz in enumerate(pezzi):
            for g, cap in ((False, pz[0]), (True, pz[-1])):
                d = vicino(cap)
                if d < dist:
                    migliore, girato, dist = i, g, d
        if dist > CHIUSO * 20:
            break                        # il contorno si spezza qui
        pz = pezzi.pop(migliore)
        if girato:
            pz = pz[::-1]
        catena.extend(pz[1:])
    return catena


def prepara(percorso):
    ent = senza_riquadro(leggi(percorso))
    c = contorno(ent)
    xs = [p[0] for p in c]
    ys = [p[1] for p in c]
    # a zero, cosi' il profilo sta in origine invece che dove capitava
    # sul foglio del disegno
    c = [(round(x - min(xs), 4), round(y - min(ys), 4)) for x, y in c]
    chiuso = math.hypot(c[0][0] - c[-1][0], c[0][1] - c[-1][1]) < CHIUSO * 20
    return {
        'nome': os.path.splitext(os.path.basename(percorso))[0],
        'larghezza': round(max(xs) - min(xs), 3),
        'spessore': round(max(ys) - min(ys), 3),
        'punti': c,
        'chiuso': chiuso,
        'entita': len(ent),
    }


def main():
    file = sys.argv[1:]
    if not file:
        sys.exit('Uso: python tools/dxf-profilo.py <file.dxf> ...')
    os.makedirs(FUORI, exist_ok=True)
    for f in file:
        d = prepara(f)
        nome = d['nome'].lower().replace(' ', '-')
        with io.open(os.path.join(FUORI, nome + '.json'), 'w', encoding='utf8') as g:
            json.dump(d, g, ensure_ascii=False)
        print('  %-44s %7.2f x %6.2f mm   %3d punti   contorno %s'
              % (nome + '.json', d['larghezza'], d['spessore'], len(d['punti']),
                 'chiuso' if d['chiuso'] else 'APERTO — da controllare'))


if __name__ == '__main__':
    main()
