# -*- coding: utf-8 -*-
"""
DA UN ALZATO DXF AL RILIEVO DELLA PORTA — tentativo, e si dice perche'.

IL PROBLEMA
Un coprifilo e' una estrusione: sezione piu' lunghezza, e il solido e'
esatto. Una porta no. Il DXF che arriva dalla fabbrica e' un ALZATO --
la porta vista di fronte -- e di fronte la profondita' non si vede.

QUINDI COSA SI PUO' FARE
Il disegno pero' dice una cosa: dove stanno i bordi. Ogni riquadro, ogni
modanatura e' una linea chiusa dentro un'altra, e piu' si va dentro piu'
si scende nello spessore. Da qui l'idea: estrarre le facce chiuse,
contare quanto sono annidate, e dare a ogni livello un gradino.

QUELLO CHE E' MISURATO E QUELLO CHE E' INVENTATO
  misurato   la forma di ogni faccia, in x e y, esatta al centesimo
  inventato  QUANTO scende ogni gradino
E' onesto dirlo: la porta viene giusta di faccia e verosimile di
fianco. Per averla esatta anche di fianco serve la SEZIONE -- un taglio
orizzontale sul montante e uno verticale sul traverso e sul riquadro.
Con quelle tre, ogni pezzo diventa un'estrusione e non si inventa piu'
niente.

USO
    python tools/dxf-porta.py <alzato.dxf>
"""

import io
import json
import math
import os
import sys

SNAP = 0.02          # due punti piu' vicini di cosi' sono lo stesso nodo
PASSO_ARCO = 3.0     # gradi per segmento


def leggi(percorso):
    righe = [l.rstrip('\n').strip()
             for l in io.open(percorso, encoding='utf8', errors='replace')]
    ent, cur = [], None
    i = 0
    while i < len(righe) - 1:
        cod, val = righe[i], righe[i + 1]
        if cod == '0':
            if cur:
                ent.append(cur)
            cur = {'t': val} if val in ('LINE', 'ARC') else None
        elif cur is not None and cod.isdigit():
            cur[int(cod)] = val
        i += 2
    if cur:
        ent.append(cur)
    return ent


def segmenti(ent):
    """Tutto ridotto a segmenti dritti: gli archi si spezzano."""
    fuori = []
    for e in ent:
        n = lambda k: float(e[k])
        if e['t'] == 'LINE':
            fuori.append(((n(10), n(20)), (n(11), n(21))))
        else:
            cx, cy, r = n(10), n(20), n(40)
            a0, a1 = n(50), n(51)
            if a1 <= a0:
                a1 += 360.0
            passi = max(2, int(math.ceil((a1 - a0) / PASSO_ARCO)))
            p = [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * k / passi)),
                  cy + r * math.sin(math.radians(a0 + (a1 - a0) * k / passi)))
                 for k in range(passi + 1)]
            fuori += list(zip(p, p[1:]))
    return fuori


def facce(segs):
    """Le facce chiuse del disegno, girando sempre a sinistra.

    E' l'estrazione classica delle facce di un grafo planare: da ogni
    lato orientato si prosegue scegliendo, al nodo di arrivo, il lato
    che gira di meno. Quello che torna al punto di partenza e' un
    contorno chiuso.
    """
    nodo = {}
    def id_di(p):
        k = (round(p[0] / SNAP), round(p[1] / SNAP))
        if k not in nodo:
            nodo[k] = (len(nodo), p)
        return nodo[k][0]

    punti, archi = {}, {}
    for a, b in segs:
        ia, ib = id_di(a), id_di(b)
        if ia == ib:
            continue
        punti[ia], punti[ib] = a, b
        archi.setdefault(ia, set()).add(ib)
        archi.setdefault(ib, set()).add(ia)

    ang = lambda a, b: math.atan2(punti[b][1] - punti[a][1],
                                  punti[b][0] - punti[a][0])
    da_fare = {(a, b) for a in archi for b in archi[a]}
    fuori = []
    while da_fare:
        inizio = next(iter(da_fare))
        giro, (a, b) = [], inizio
        for _ in range(4000):
            if (a, b) not in da_fare:
                giro = []
                break
            da_fare.discard((a, b))
            giro.append(punti[a])
            entrata = ang(b, a)
            # il lato che gira di meno a sinistra
            scelta, meglio = None, 9e9
            for c in archi[b]:
                if c == a and len(archi[b]) > 1:
                    continue
                d = (entrata - ang(b, c)) % (2 * math.pi)
                if d < meglio:
                    meglio, scelta = d, c
            if scelta is None:
                giro = []
                break
            a, b = b, scelta
            if (a, b) == inizio:
                break
        if len(giro) >= 3:
            fuori.append(giro)
    return fuori


def area(p):
    s = 0.0
    for i in range(len(p)):
        x0, y0 = p[i]
        x1, y1 = p[(i + 1) % len(p)]
        s += x0 * y1 - x1 * y0
    return s / 2


def dentro(p, poly):
    x, y = p
    c = False
    for i in range(len(poly)):
        x0, y0 = poly[i]
        x1, y1 = poly[(i - 1) % len(poly)]
        if ((y0 > y) != (y1 > y)) and \
           (x < (x1 - x0) * (y - y0) / ((y1 - y0) or 1e-9) + x0):
            c = not c
    return c


def main():
    if len(sys.argv) < 2:
        sys.exit('Uso: python tools/dxf-porta.py <alzato.dxf>')
    percorso = sys.argv[1]
    segs = segmenti(leggi(percorso))
    f = [g for g in facce(segs) if abs(area(g)) > 25]      # via le briciole
    f.sort(key=lambda g: -abs(area(g)))
    print('segmenti: %d   facce chiuse: %d' % (len(segs), len(f)))

    # quanto e' annidata ciascuna: il livello da' il gradino
    centro = lambda g: (sum(p[0] for p in g) / len(g), sum(p[1] for p in g) / len(g))
    livello = []
    for i, g in enumerate(f):
        c = centro(g)
        livello.append(sum(1 for j, h in enumerate(f)
                           if j != i and abs(area(h)) > abs(area(g)) and dentro(c, h)))
    for L in range(max(livello) + 1 if livello else 0):
        n = sum(1 for x in livello if x == L)
        print('   livello %d: %2d facce' % (L, n))

    xs = [p[0] for g in f for p in g]
    ys = [p[1] for g in f for p in g]
    d = {
        'nome': os.path.splitext(os.path.basename(percorso))[0],
        'larghezza': round(max(xs) - min(xs), 2),
        'altezza': round(max(ys) - min(ys), 2),
        'facce': [{'livello': L,
                   'punti': [[round(x - min(xs), 3), round(y - min(ys), 3)]
                             for x, y in g]}
                  for g, L in zip(f, livello)],
    }
    fuori = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                         'assets', 'porte', d['nome'].lower().replace(' ', '-'))
    os.makedirs(fuori, exist_ok=True)
    nome = 'alzato.json'
    with io.open(os.path.join(fuori, nome), 'w', encoding='utf8') as g:
        json.dump(d, g, ensure_ascii=False)
    print('%s   %.0f x %.0f mm' % (nome, d['larghezza'], d['altezza']))


if __name__ == '__main__':
    main()
