# -*- coding: utf-8 -*-
"""
DA UNA TAVOLA DI FABBRICA ALLA PORTA — questa volta senza indovinare.

COSA CAMBIA RISPETTO A PRIMA
Il primo file che era arrivato (700-C) era un ALZATO e basta: la porta
vista di fronte, dove la profondita' non si vede. Li' si era dovuto
inventare quanto scende ogni gradino, e lo si era scritto.

Questa tavola invece porta anche le due SEZIONI -- una verticale (SEZ-A)
e una orizzontale (SEZ-B) -- e con quelle non c'e' piu' niente da
inventare: la sezione dice lo spessore di ogni pezzo al centesimo, e
l'alzato dice dove quel pezzo sta. Insieme fanno il solido.

COM'E' FATTO IL FOGLIO
  strato APS_GEOMETRY   il legno: telaio, montanti, traversi
  strato COSTRUZIONI    il pannello, il muro, i tratteggi, il bordo
  strato QUOTATURA      le quote, e i testi che le leggono
  strato TEXT           il cartiglio
Le tre viste stanno lontane fra loro sul foglio, percio' si separano
guardando dove cade ogni entita' -- non serve altro.

QUELLO CHE SI RICAVA
  anta          il rettangolo dell'anta e il suo spessore
  montante      la sezione orizzontale del montante, dal filo esterno
                fino in fondo alla cava del pannello
  traversi      alto, mezzo e basso, con la loro altezza vera
  riquadri      i due vani, presi in fondo alla cava
  pannello      lo spessore in funzione della distanza dal bordo: e' la
                bugna, e con questa il pannello si puo' gonfiare davvero
                invece di essere una lastra piatta
  telaio        la sezione dello stipite col coprifilo
  quote         luce netta, esterno telaio, HT -- lette dai testi

USO
    python tools/dxf-tavola.py <tavola.dxf>
"""

import importlib.util
import io
import json
import math
import os
import re
import sys

_qui = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location('dxfprofilo',
                                            os.path.join(_qui, 'dxf-profilo.py'))
profilo = importlib.util.module_from_spec(_s)
_s.loader.exec_module(profilo)

FUORI = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                     'assets', 'profili')
PASSO_ARCO = 2.0
LEGNO = 'APS_GEOMETRY'
AIUTO = 'COSTRUZIONI'


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
            cur = ({'tipo': val} if val in ('LINE', 'ARC', 'TEXT') else None)
        elif cur is not None and cod.isdigit() and int(cod) not in cur:
            cur[int(cod)] = val
        i += 2
    if cur:
        ent.append(cur)
    return ent


def punti(e):
    n = lambda k: float(e[k])
    if e['tipo'] == 'LINE':
        return [(n(10), n(20)), (n(11), n(21))]
    if e['tipo'] != 'ARC':
        return [(n(10), n(20))]
    cx, cy, r = n(10), n(20), n(40)
    a0, a1 = n(50), n(51)
    if a1 <= a0:
        a1 += 360.0
    passi = max(2, int(math.ceil((a1 - a0) / PASSO_ARCO)))
    return [(cx + r * math.cos(math.radians(a0 + (a1 - a0) * k / passi)),
             cy + r * math.sin(math.radians(a0 + (a1 - a0) * k / passi)))
            for k in range(passi + 1)]


def scatola(ent):
    p = [q for e in ent for q in punti(e)]
    xs = [q[0] for q in p]
    ys = [q[1] for q in p]
    return min(xs), max(xs), min(ys), max(ys)


def pezzi(ent, tocca=1.2):
    """Raggruppa le entita' che si toccano davvero, capo con capo."""
    cap = [(punti(e)[0], punti(e)[-1]) for e in ent]
    g = list(range(len(ent)))

    def trova(i):
        while g[i] != i:
            g[i] = g[g[i]]
            i = g[i]
        return i

    for i in range(len(ent)):
        for j in range(i + 1, len(ent)):
            if any(math.hypot(a[0] - b[0], a[1] - b[1]) < tocca
                   for a in cap[i] for b in cap[j]):
                g[trova(i)] = trova(j)
    fuori = {}
    for i in range(len(ent)):
        fuori.setdefault(trova(i), []).append(ent[i])
    return list(fuori.values())


# ── il contorno di un pezzo ──────────────────────────────────────────────
def contorno(ent, solo_legno=False):
    """Il giro esterno di un pezzo, con lo stesso passo dei coprifili.

    solo_legno butta via il tratteggio: dentro lo stipite ci sono le
    righe che dicono «qui e' tagliato», e sono linee come le altre. Il
    cammino sul bordo di solito non ci entra, ma dove una riga di
    tratteggio arriva esattamente sullo spigolo il bordo si sdoppia e il
    giro non torna.
    """
    if solo_legno:
        ent = [e for e in ent if e.get(8) == LEGNO]
    segs, capi = [], []
    for e in ent:
        p = punti(e)
        segs += list(zip(p, p[1:]))
        capi += [p[0], p[-1]]
    giri = profilo.contorno_esterno(profilo.spezza_a_T(segs, capi))
    if not giri:
        return None
    c = giri[0]
    return c[::-1] if profilo.area(c) < 0 else c


def contorni(ent):
    """Tutti i solidi di un gruppo, non solo quello sotto al piede."""
    segs, capi = [], []
    for e in ent:
        p = punti(e)
        segs += list(zip(p, p[1:]))
        capi += [p[0], p[-1]]
    fuori = []
    for c in profilo.contorno_esterno(profilo.spezza_a_T(segs, capi)):
        if abs(profilo.area(c)) > 20:
            fuori.append(c[::-1] if profilo.area(c) < 0 else c)
    return fuori


def isole(ent, aria=6.0):
    """Le viste del foglio: gruppi di entita' che stanno vicine.

    Qui si guardano le SCATOLE, non i capi. Un alzato non e' una linea
    sola -- sono riquadri staccati fra loro, la maniglia, le mitre -- e
    unendo per capi verrebbe fuori in dieci pezzi invece che in una
    vista. Le scatole invece si sovrappongono, e la vista viene su
    intera.
    """
    box = []
    for e in ent:
        p = punti(e)
        xs = [q[0] for q in p]
        ys = [q[1] for q in p]
        box.append((min(xs), max(xs), min(ys), max(ys)))
    g = list(range(len(ent)))

    def trova(i):
        while g[i] != i:
            g[i] = g[g[i]]
            i = g[i]
        return i

    for i in range(len(ent)):
        a = box[i]
        for j in range(i + 1, len(ent)):
            b = box[j]
            if (a[0] - aria <= b[1] and b[0] - aria <= a[1]
                    and a[2] - aria <= b[3] and b[2] - aria <= a[3]):
                g[trova(i)] = trova(j)
    fuori = {}
    for i in range(len(ent)):
        fuori.setdefault(trova(i), []).append(ent[i])
    return list(fuori.values())


# ── la bugna del pannello ────────────────────────────────────────────────
def bugna(ent, xcava, spessore_max):
    """Lo spessore del pannello in funzione della distanza dal bordo.

    La sezione del pannello e' disegnata come due profili -- il davanti e
    il dietro -- che partono sottili dentro la cava e si gonfiano fino
    allo spessore pieno. Qui si tiene solo il davanti (i punti sopra la
    mezzeria) e si legge come una funzione: a ogni distanza dal bordo, la
    sua meta' di spessore.
    """
    p = [q for e in ent for q in punti(e)]
    ys = [q[1] for q in p]
    mez = (min(ys) + max(ys)) / 2
    su = sorted(((q[0] - xcava, q[1] - mez) for q in p if q[1] > mez + 1e-9))
    fuori, ultimo = [], -1e9
    for d, z in su:
        if d < -0.01:
            continue
        if d - ultimo < 0.35:              # un punto ogni terzo di mm basta
            continue
        fuori.append([round(d, 3), round(z, 3)])
        ultimo = d
        if z >= spessore_max / 2 - 0.01 and d > 5:
            break
    return fuori


def testi(ent):
    q = {}
    for e in ent:
        if e['tipo'] != 'TEXT':
            continue
        t = (e.get(1) or '').replace(' ', '').upper()
        m = re.match(r'^([A-Z\.\s]+)=([0-9]+(?:[\.,][0-9]+)?)$', t)
        if m:
            q.setdefault(m.group(1).strip('.'), []).append(
                float(m.group(2).replace(',', '.')))
    return q


def main():
    if len(sys.argv) < 2:
        sys.exit('Uso: python tools/dxf-tavola.py <tavola.dxf>')
    f = sys.argv[1]
    tutte = leggi(f)
    dis = [e for e in tutte if e.get(8) in (LEGNO, AIUTO) and e['tipo'] != 'TEXT']

    # Le viste si separano da sole: sono tre isole lontane sul foglio.
    # Si raggruppa per vicinanza larga (le bbox che quasi si toccano) e si
    # tengono le tre isole piu' grandi -- il cartiglio e le lettere del
    # logo restano fuori perche' sono minuscoli e staccati.
    viste = [i for i in isole(dis, 6.0) if len(i) > 20]

    def forma(p):
        x0, x1, y0, y1 = scatola(p)
        return (x1 - x0, y1 - y0)

    # Le viste sono le tre isole che occupano piu' foglio. Non si possono
    # scegliere contando le entita': le lettere del logo del cartiglio
    # sono tutte archi, e una riga di quelle ne ha piu' dell'alzato
    # intero. L'area invece le separa di venti volte.
    viste.sort(key=lambda p: -forma(p)[0] * forma(p)[1])
    viste = viste[:3]
    sezB = max(viste, key=lambda p: forma(p)[0] / max(forma(p)[1], 1))
    sezA = max(viste, key=lambda p: forma(p)[1] / max(forma(p)[0], 1))
    resto = [p for p in viste if p is not sezA and p is not sezB]
    alzato = max(resto, key=lambda p: forma(p)[0] * forma(p)[1])
    print('sezB %.0f x %.0f   sezA %.0f x %.0f   alzato %.0f x %.0f'
          % (forma(sezB) + forma(sezA) + forma(alzato)))

    # ── i pezzi dentro le sezioni ───────────────────────────────────────
    pB = pezzi([e for e in sezB], 1.2)
    pA = pezzi([e for e in sezA], 1.2)
    misura = lambda p: (scatola(p)[1] - scatola(p)[0], scatola(p)[3] - scatola(p)[2])

    legno = lambda p: any(e.get(8) == LEGNO for e in p)
    # il montante: pezzo di legno piu' a sinistra fra quelli larghi ~114
    mont = [p for p in pB if legno(p) and 60 < misura(p)[0] < 200
            and 30 < misura(p)[1] < 60]
    mont.sort(key=lambda p: scatola(p)[0])
    montante = mont[0]
    xm0, xm1, ym0, ym1 = scatola(montante)
    spess = ym1 - ym0
    # i due montanti danno i fianchi dell'anta: quello di sinistra col
    # suo filo esterno, quello di destra col suo
    fianco0 = min(scatola(p)[0] for p in mont)
    fianco1 = max(scatola(p)[1] for p in mont)

    # i traversi: nella sezione verticale, alti fra 60 e 300 e spessi come l'anta
    trav = [p for p in pA if legno(p) and abs(misura(p)[0] - spess) < 2
            and 60 < misura(p)[1] < 300]
    trav.sort(key=lambda p: scatola(p)[2])

    # il pannello: nella sezione orizzontale, lungo e sottile, di COSTRUZIONI
    pann = max((p for p in pB if not legno(p) and misura(p)[0] > 300
                and misura(p)[1] < spess), key=lambda p: misura(p)[0])
    xp0, xp1, yp0, yp1 = scatola(pann)

    # il telaio con coprifilo: il pezzo piu' grosso di ciascuna sezione --
    # lo stipite nell'orizzontale, la traversa nella verticale
    # Il telaio si riconosce da una cosa sola, e regge in tutte e due le
    # sezioni: e' PIU' PROFONDO DELL'ANTA. Deve esserlo, ci gira intorno
    # e prende anche il muro. Ne' l'area ne' il lato piu' lungo servono:
    # per area vince un pannello (21 x 1232), per lato una linea di
    # richiamo lunga venti centimetri e alta zero.
    #
    # E non e' UN pezzo: sono tre solidi staccati -- lo stipite e i due
    # coprifili, uno per faccia. Prendendone il contorno come fosse uno
    # ne veniva fuori solo quello che tocca il punto piu' basso, cioe' un
    # coprifilo da solo largo 71 invece del telaio largo 104.
    def telaio_di(pz, prof):
        gruppo = [p for p in pz if legno(p) and prof(misura(p)) > spess + 5]
        ent = [e for g in gruppo for e in g if e.get(8) == LEGNO]
        # i solidi li separa contorno_esterno, dopo aver cucito: qui
        # sono due, l'imbotto a U che fascia il muro e il montante di
        # battuta contro cui l'anta chiude
        return contorni(ent)

    telB = telaio_di(pB, lambda m: m[1])
    telA = telaio_di(pA, lambda m: m[0])

    # il muro: nella sezione orizzontale e' un blocco tratteggiato per
    # parte, e dice due cose che servono -- quanto e' spesso, e fin dove
    # arriva prima che cominci il vano
    mur = [p for p in pB if not legno(p) and misura(p)[0] > 100
           and misura(p)[1] > 100]
    mur.sort(key=lambda p: scatola(p)[0])

    # ── l'alzato: anta e riquadri ───────────────────────────────────────
    pAl = pezzi(alzato, 1.2)
    riq = [p for p in pAl if legno(p) and misura(p)[0] > 200 and misura(p)[1] > 200]
    riq = [p for p in riq if misura(p)[0] < forma(alzato)[0] - 100]
    riq.sort(key=lambda p: -scatola(p)[2])
    riquadri = [{'x0': round(scatola(p)[0], 2), 'x1': round(scatola(p)[1], 2),
                 'y0': round(scatola(p)[2], 2), 'y1': round(scatola(p)[3], 2)}
                for p in riq]

    # L'anta la danno le sezioni, non l'alzato: di fianco i due montanti
    # col loro filo esterno, in alto e in basso il primo e l'ultimo
    # traverso. L'alzato porterebbe dentro anche il telaio e il muro.
    ax0, ax1 = fianco0, fianco1
    ay0 = scatola(trav[0])[2]
    ay1 = scatola(trav[-1])[3]

    # ── un solo sistema di riferimento ──────────────────────────────────
    # Le tre viste stanno ognuna in un angolo del foglio, e ognuna chiama
    # le cose a modo suo: nella sezione orizzontale la profondita' e' y,
    # in quella verticale e' x. Rimettere d'accordo le viste QUI, una
    # volta, e' meglio che farlo nel 3D ogni volta che si disegna un
    # pezzo.
    #   X  larghezza,  da filo montante sinistro
    #   Y  altezza,    da sotto l'anta
    #   Z  spessore,   dalla faccia dell'anta
    # I traversi hanno la profondita' che cresce come nella sezione
    # orizzontale: si vede da come lo stipite e l'anta si sovrappongono,
    # nelle due sezioni dalla stessa parte.
    zA = min(scatola(t)[0] for t in trav)      # dove comincia l'anta in SEZ-A
    cm = contorno(montante)
    ct = [contorno(t) for t in trav]
    xz = lambda c: [[round(p[0] - ax0, 3), round(p[1] - ym0, 3)] for p in c]
    yz = lambda c: [[round(p[1] - ay0, 3), round(p[0] - zA, 3)] for p in c]

    d = {
        'nome': os.path.splitext(os.path.basename(f))[0],
        'spessore': round(spess, 2),
        'anta': {'larghezza': round(ax1 - ax0, 2), 'altezza': round(ay1 - ay0, 2)},
        'montante': {'larghezza': round(xm1 - xm0, 2), 'punti': xz(cm)},
        'traversi': [{'y0': round(scatola(t)[2] - ay0, 2),
                      'y1': round(scatola(t)[3] - ay0, 2),
                      'punti': yz(c)}
                     for t, c in zip(trav, ct)],
        'riquadri': [{'x0': round(r['x0'] - ax0, 2), 'x1': round(r['x1'] - ax0, 2),
                      'y0': round(r['y0'] - ay0, 2), 'y1': round(r['y1'] - ay0, 2)}
                     for r in riquadri],
        # z_centro: dove sta la mezzeria del pannello dentro lo spessore
        # dell'anta. Non e' esattamente meta': la cava e' un filo piu'
        # verso un lato, e spostare il pannello di quei due millimetri
        # cambia l'ombra che fa sul riquadro.
        # gioco: il pannello non arriva in fondo alla cava, le resta
        # qualche millimetro per lavorare col tempo. Serve saperlo, se no
        # il pannello si monta piu' largo di com'e' davvero.
        'pannello': {'spessore': round(yp1 - yp0, 2),
                     'z_centro': round((yp0 + yp1) / 2 - ym0, 2),
                     'gioco': round(xp0 - (riquadri[0]['x0']), 2),
                     'bugna': bugna(pann, xp0, yp1 - yp0)},
        # lo stipite e la traversa alta, gia' al loro posto rispetto
        # all'anta: ci si sovrappongono, la porta chiude nella battuta
        'telaio': [xz(c) for c in telB],
        'telaio_alto': [yz(c) for c in telA],
        'muro': {'z0': round(min(scatola(m)[2] for m in mur) - ym0, 2),
                 'z1': round(max(scatola(m)[3] for m in mur) - ym0, 2),
                 'x0': round(scatola(mur[0])[1] - ax0, 2),
                 'x1': round(scatola(mur[-1])[0] - ax0, 2)} if mur else None,
        'quote': {k: v for k, v in testi(tutte).items()},
    }
    os.makedirs(FUORI, exist_ok=True)
    slug = d['nome'].lower().replace('_', '-') + '-tavola.json'
    with io.open(os.path.join(FUORI, slug), 'w', encoding='utf8') as g:
        json.dump(d, g, ensure_ascii=False)

    print('anta       %.1f x %.1f mm, spessa %.1f'
          % (d['anta']['larghezza'], d['anta']['altezza'], d['spessore']))
    print('montante   largo %.1f, %d punti' % (d['montante']['larghezza'],
                                               len(d['montante']['punti'])))
    for t in d['traversi']:
        print('traverso   y %.1f..%.1f  (alto %.1f)  %d punti'
              % (t['y0'], t['y1'], t['y1'] - t['y0'], len(t['punti'])))
    for r in d['riquadri']:
        print('riquadro   %.1f x %.1f  @(%.1f, %.1f)'
              % (r['x1'] - r['x0'], r['y1'] - r['y0'], r['x0'], r['y0']))
    print('pannello   spesso %.1f, bugna in %d punti'
          % (d['pannello']['spessore'], len(d['pannello']['bugna'])))
    for nome, pz in (('stipite', d['telaio']), ('traversa', d['telaio_alto'])):
        for c in pz:
            a = [q[0] for q in c]
            b = [q[1] for q in c]
            print('telaio %-9s %8.1f..%8.1f  x %8.1f..%8.1f  %d punti'
                  % (nome, min(a), max(a), min(b), max(b), len(c)))
    if d['muro']:
        m = d['muro']
        print('muro       spesso %.1f, vano da %.1f a %.1f'
              % (m['z1'] - m['z0'], m['x0'], m['x1']))
    print('quote      %s' % d['quote'])
    print('-> %s' % slug)


if __name__ == '__main__':
    main()
