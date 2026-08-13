# -*- coding: utf-8 -*-
"""
DA UN ALZATO SOLO, PRENDENDO IN PRESTITO LE SEZIONI.

I disegni storici sono alzati e basta: la porta vista di fronte, senza
SEZ-A ne' SEZ-B. Da soli non bastano a fare un solido -- di fronte la
profondita' non si vede, ed e' esattamente il muro contro cui si era
sbattuto col 700-C.

Ma non serve averle, se si sa che sono le stesse. Queste porte hanno
tutte la stessa costruzione: montante e traverso con lo stesso bastone,
la stessa cava, la stessa bugna, lo stesso telaio. Cambia il DISEGNO --
quanti riquadri e dove cadono -- e quello l'alzato ce l'ha, al
centesimo.

Quindi qui si legge SOLO il reparto, e tutto il resto si eredita dalla
tavola completa (la BASE_HT789, che le sezioni le ha). Sta scritto nel
JSON che ne esce, campo `eredita`: chi lo legge sa cosa e' misurato e
cosa e' preso in prestito.

VALE FINCHE' LA COSTRUZIONE E' QUELLA. Su una porta vetrata no: li' c'e'
il fermavetro, che e' un'altra sezione.

E IL NOME DEL FILE NON SI GUARDA. In questa cartella i nomi sono
incrociati a coppie -- GENOVA.dxf contiene il 600-6V e 600-6V.dxf
contiene il GENOVA. Il nome buono e' il testo «MOD. ...» dentro al
disegno.

USO
    python tools/dxf-alzato.py <alzato.dxf> --come <modello>
"""

import importlib.util
import io
import json
import os
import re
import sys

_qui = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location('dxftavola',
                                            os.path.join(_qui, 'dxf-tavola.py'))
tav = importlib.util.module_from_spec(_s)
_s.loader.exec_module(tav)

RADICE = os.path.dirname(_qui)
PRESTITO = os.path.join(RADICE, 'assets', 'porte', 'siena', 'anta.json')


def etichetta(ent):
    """Come si chiama davvero: il testo MOD. dentro al disegno."""
    for e in ent:
        t = (e.get(1) or '').strip()
        if e['tipo'] == 'TEXT' and re.match(r'MOD\.?\s*\S', t, re.I):
            return re.sub(r'^MOD\.?\s*', '', t, flags=re.I).strip()
    return None


def rettangoli(pezzi, mis):
    """I rettangoli chiusi del disegno, dal piu' grande al piu' piccolo."""
    fuori = []
    for p in pezzi:
        x0, x1, y0, y1 = tav.scatola(p)
        if (x1 - x0) < 40 or (y1 - y0) < 40:
            continue
        c = tav.contorni(p)
        fuori.append({'x0': x0, 'x1': x1, 'y0': y0, 'y1': y1,
                      'area': (x1 - x0) * (y1 - y0),
                      'contorno': c[0] if c else None})
    fuori.sort(key=lambda r: -r['area'])
    return fuori


def main():
    arg = sys.argv[1:]
    come = None
    if '--come' in arg:
        i = arg.index('--come')
        come = arg[i + 1]
        arg = arg[:i] + arg[i + 2:]
    if not arg:
        sys.exit('Uso: python tools/dxf-alzato.py <alzato.dxf> --come <modello>')
    f = arg[0]

    tutte = tav.leggi(f)
    nome = etichetta(tutte) or os.path.splitext(os.path.basename(f))[0]
    dis = [e for e in tutte if e['tipo'] != 'TEXT'
           and e.get(8) in (tav.LEGNO, 'GEOMETRIA_APS', tav.AIUTO)]
    if not dis:
        dis = [e for e in tutte if e['tipo'] != 'TEXT']

    # la vista piu' grande del foglio e' l'alzato; il cartiglio e il logo
    # stanno tutti dentro pochi centimetri
    viste = [i for i in tav.isole(dis, 8.0) if len(i) > 6]
    forma = lambda p: (tav.scatola(p)[1] - tav.scatola(p)[0],
                       tav.scatola(p)[3] - tav.scatola(p)[2])
    alzato = max(viste, key=lambda p: forma(p)[0] * forma(p)[1])

    # LE FACCE, NON I PEZZI. In questo alzato tutto si tocca -- e' un
    # disegno solo, di cinquantasette linee -- quindi raggruppando per
    # contatto viene fuori un pezzo unico grande come la porta. Le
    # facce chiuse invece sono proprio i riquadri, l'anta, il telaio:
    # una per ogni cosa che il disegno racchiude.
    segs, capi = [], []
    for e in alzato:
        q = tav.punti(e)
        segs += list(zip(q, q[1:]))
        capi += [q[0], q[-1]]
    ret = []
    for c in tav.profilo.facce(tav.profilo.spezza_a_T(segs, capi)):
        xs = [q[0] for q in c]; ys = [q[1] for q in c]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        if (x1 - x0) < 40 or (y1 - y0) < 40:
            continue
        ret.append({'x0': x0, 'x1': x1, 'y0': y0, 'y1': y1,
                    'area': (x1 - x0) * (y1 - y0), 'contorno': c})
    ret.sort(key=lambda r: -r['area'])
    if not ret:
        sys.exit('%s: nessun rettangolo nell alzato' % f)

    # l'ANTA e' il rettangolo piu' grande dopo il telaio: il telaio gira
    # tutto attorno, l'anta ci sta dentro
    tel = ret[0]
    anta = next((r for r in ret[1:]
                 if r['x0'] > tel['x0'] and r['x1'] < tel['x1']), ret[0])
    # i RIQUADRI sono i rettangoli dentro l'anta, grandi almeno un decimo
    # della sua area
    dentro = [r for r in ret
              if r is not anta and r['x0'] >= anta['x0'] - .5
              and r['x1'] <= anta['x1'] + .5 and r['y0'] >= anta['y0'] - .5
              and r['y1'] <= anta['y1'] + .5
              and r['area'] > (anta['x1'] - anta['x0']) * (anta['y1'] - anta['y0']) * .02]
    # dei rettangoli concentrici (la mitra del bastone ne disegna due o
    # tre) si tiene il piu' esterno
    riq = []
    for r in dentro:
        if any(q['x0'] <= r['x0'] + .5 and q['x1'] >= r['x1'] - .5
               and q['y0'] <= r['y0'] + .5 and q['y1'] >= r['y1'] - .5
               for q in riq):
            continue
        riq.append(r)
    riq.sort(key=lambda r: -r['y0'])

    base = json.load(io.open(PRESTITO, encoding='utf8'))
    ax0, ay0 = anta['x0'], anta['y0']
    La = anta['x1'] - ax0
    Ha = anta['y1'] - ay0
    # LE MISURE SONO QUELLE DELLA PORTA IN PRESTITO. Questi alzati
    # storici sono disegnati sul loro formato -- chi 880x2140, chi altro
    # -- ma la porta si fa su misura, e quello che il disegno dice
    # davvero e' il REPARTO: dove cadono i traversi in proporzione. Si
    # riportano le proporzioni sull'anta della Siena, che le sezioni le
    # ha misurate.
    L = base['anta']['larghezza']
    H = base['anta']['altezza']
    kx, ky = L / La, H / Ha
    d = dict(base)
    d['nome'] = nome
    d['anta'] = {'larghezza': L, 'altezza': H}
    # IN LARGHEZZA NON SI SCALA NIENTE. Il montante e' ereditato, e la
    #    sua cava sta a 98 mm dal filo: e' una misura di costruzione, non
    #    di disegno. Scalando anche la larghezza i riquadri venivano a 117
    #    e fra il pannello e la cava restava un vuoto di diciannove
    #    millimetri -- si vedeva attraverso.
    #    Del disegno si prende SOLO la divisione in altezza: dove cadono i
    #    traversi. Quello si', cambia da un modello all'altro. 
    rx0 = base['riquadri'][0]['x0']
    rx1 = L - rx0
    # IL CONTORNO, NON LA SCATOLA. Prendendo la scatola, l'arco a tutto
    # sesto della 100-C diventava un rettangolo e la porta usciva uguale
    # alla Siena: si buttava via l'unica cosa che cambia.
    d['riquadri'] = []
    for r in riq:
        c = r.get('contorno')
        if not c:
            continue
        Rx0, Rx1 = r['x0'], r['x1']
        kx2 = (rx1 - rx0) / (Rx1 - Rx0)
        d['riquadri'].append({
            'x0': rx0, 'x1': rx1,
            'y0': round((r['y0'] - ay0) * ky, 2),
            'y1': round((r['y1'] - ay0) * ky, 2),
            'punti': [[round(rx0 + (q[0] - Rx0) * kx2, 2),
                       round((q[1] - ay0) * ky, 2)] for q in c],
        })
    # i traversi stanno FRA i riquadri: sopra il primo, fra l'uno e
    # l'altro, sotto l'ultimo. Le loro sezioni sono quelle in prestito.
    rientro = base['montante']['larghezza'] - base['riquadri'][0]['x0']
    bordi = [0] + [v for r in d['riquadri'] for v in (r['y1'] + rientro,
                                                      r['y0'] - rientro)] + [H]
    bordi = sorted(set(round(v, 2) for v in bordi))
    trav = []
    for i in range(0, len(bordi) - 1, 2):
        y0, y1 = bordi[i], bordi[i + 1]
        if y1 - y0 < 20:
            continue
        # si prende la sezione del traverso della Siena piu' vicino d'altezza
        sc = min(base['traversi'],
                 key=lambda t: abs((t['y1'] - t['y0']) - (y1 - y0)))
        # LA SEZIONE SI ALLUNGA, NON SI SPOSTA E BASTA. Il traverso di
        # questo modello e' alto 195 e quello in prestito 176: spostando
        # soltanto, restava scoperta la differenza -- una fessura chiara
        # sopra il pannello. Si allunga il CENTRO e si lasciano stare i
        # due capi, che li' c'e' il bastone e stirarlo lo sformerebbe.
        a0, a1 = sc['y0'], sc['y1']
        m0, m1 = a0 + rientro, a1 - rientro
        n0, n1 = y0 + rientro, y1 - rientro
        k = (n1 - n0) / (m1 - m0) if m1 > m0 else 1.0
        def sposta(v):
            if v <= m0:
                return y0 + (v - a0)
            if v >= m1:
                return y1 + (v - a1)
            return n0 + (v - m0) * k
        trav.append({'y0': y0, 'y1': y1,
                     'punti': [[round(sposta(p[0]), 3), p[1]] for p in sc['punti']]})
    d['traversi'] = trav
    d['eredita'] = {
        'da': base['nome'],
        'cosa': ['montante', 'traversi', 'pannello', 'maniglia', 'spessore'],
        'perche': 'questo disegno e un alzato solo: le sezioni non ci sono',
    }
    d['origine'] = os.path.basename(f)

    slug = (come or nome).lower().replace(' ', '-').replace('.', '')
    fuori = os.path.join(RADICE, 'assets', 'porte', slug)
    os.makedirs(fuori, exist_ok=True)
    with io.open(os.path.join(fuori, 'anta.json'), 'w', encoding='utf8') as g:
        json.dump(d, g, ensure_ascii=False)

    print('%s  ->  %s' % (os.path.basename(f), nome))
    print('  anta      %.1f x %.1f mm' % (d['anta']['larghezza'], d['anta']['altezza']))
    for r in d['riquadri']:
        print('  riquadro  %6.1f x %6.1f  @(%.1f, %.1f)'
              % (r['x1'] - r['x0'], r['y1'] - r['y0'], r['x0'], r['y0']))
    for t in d['traversi']:
        print('  traverso  y %.1f..%.1f  (alto %.1f)' % (t['y0'], t['y1'], t['y1'] - t['y0']))
    print('  -> assets/porte/%s/anta.json' % slug)


if __name__ == '__main__':
    main()
