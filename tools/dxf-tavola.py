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
    python tools/dxf-tavola.py <tavola.dxf> [--modello nome]
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

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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
    # Si cuce fino a un centimetro, non fino al millimetro come sui
    # coprifili. In una sezione d'assieme il disegnatore INTERROMPE il
    # contorno del legno dove ci va altro: sulla battuta di questo
    # telaio il profilo resta aperto 10,12 mm, ed e' il posto della
    # guarnizione, che sta su un altro strato. Con la soglia stretta il
    # cammino non chiudeva e la battuta spariva: il telaio usciva largo
    # 71 invece di 104, e nel 3D fra anta e coprifilo si vedeva il muro
    # per tutta l'altezza. Qui la soglia larga e' sicura -- i capi
    # liberi sono due, e c'e' un solo modo di unirli.
    return [c for c in profilo.contorno_esterno(profilo.spezza_a_T(segs, capi), 12.0)
            if abs(profilo.area(c)) > 20]


def ali_di(ent):
    """Le ALI del telaio, cioe' i coprifili che ci sono gia' sopra.

    Il profilo del telaio e' una U sola, e dentro quella U ci sono tre
    cose diverse: l'imbotto che fascia il muro e i due coprifili che
    coprono la giunzione col muro, uno per faccia. Nel disegno sono un
    pezzo unico perche' la fabbrica li vende montati, ma per poter
    cambiare il coprifilo vanno separati.

    Si trovano da soli: sono le FACCE chiuse del profilo, e su questa
    tavola misurano 69,00 x 22,00 -- che e' il liscio listellare 22x70,
    quello compreso nel prezzo, al centesimo. Non e' una coincidenza da
    dare per buona: e' la conferma che stiamo guardando la cosa giusta.
    """
    segs, capi = [], []
    for e in ent:
        p = punti(e)
        segs += list(zip(p, p[1:]))
        capi += [p[0], p[-1]]
    fuori = []
    for c in profilo.facce(profilo.spezza_a_T(segs, capi)):
        x0 = min(q[0] for q in c); x1 = max(q[0] for q in c)
        y0 = min(q[1] for q in c); y1 = max(q[1] for q in c)
        if (x1 - x0) * (y1 - y0) > 800:
            fuori.append((x0, x1, y0, y1))
    return fuori


def stacca(c, ali, asse, verso_luce):
    """Stacca l'imbotto dalle sue ali, e dice dove si appoggiano.

    `asse` e' quello che attraversa il muro (0 nella sezione orizzontale,
    1 in quella verticale); `verso_luce` dice da che parte sta il vano,
    +1 o -1. L'ala si stacca al suo filo verso la luce, e il coprifilo
    nuovo si appoggera' li': con il dorso sulla faccia del muro -- che e'
    il lato dell'ala che guarda dentro il vano -- e il piede che
    scavalca l'imbotto.
    """
    a0, a1 = min(q[asse] for q in c), max(q[asse] for q in c)
    b = 1 - asse
    mie = [w for w in ali if a0 - 1 <= w[asse * 2] and w[asse * 2 + 1] <= a1 + 1]
    if not mie:
        return c, []
    # la mezzeria si prende sul TELAIO, non sulle ali: con una sola ala
    # la sua mezzeria e' se stessa, i due capi distano uguale e la faccia
    # del muro veniva scelta a caso -- usciva sul lato sbagliato
    mezz = (min(q[b] for q in c) + max(q[b] for q in c)) / 2
    seggi, tagli = [], []
    for w in mie:
        luce = w[asse * 2 + 1] if verso_luce > 0 else w[asse * 2]
        z0, z1 = w[b * 2], w[b * 2 + 1]
        muro = z0 if abs(z0 - mezz) < abs(z1 - mezz) else z1
        fuor = z1 if muro == z0 else z0
        seggi.append({'a': luce, 'z': muro, 'verso': 1 if fuor > muro else -1})
        tagli.append(luce)
    # Mezzo millimetro DENTRO, non esattamente sul filo dell'ala. Una
    # delle due ali finisce proprio li': tagliando sul filo la retta le
    # e' tangente, i due punti d'incrocio cadono uno sull'altro e il
    # contorno esce con un ponte di lunghezza zero. Un contorno cosi' non
    # e' piu' semplice, e il triangolatore di Three lo scarta senza dire
    # niente -- l'imbotto spariva dalla scena e al suo posto si vedeva il
    # muro, per tutta la larghezza sopra la porta.
    taglio = (max(tagli) if verso_luce > 0 else min(tagli)) + .5 * verso_luce
    return netto(taglia(c, asse, taglio, verso_luce)), seggi


def netto(c):
    """Via i punti doppi: il taglio ne lascia, e non servono a nessuno."""
    fuori = []
    for q in c:
        if not fuori or math.hypot(q[0] - fuori[-1][0], q[1] - fuori[-1][1]) > .01:
            fuori.append(q)
    while len(fuori) > 2 and math.hypot(fuori[0][0] - fuori[-1][0],
                                        fuori[0][1] - fuori[-1][1]) < .01:
        fuori.pop()
    return fuori


def taglia(c, asse, quota, tieni):
    """Taglia un contorno con una retta e tiene la meta' che si vuole.

    E' il ritaglio di Sutherland-Hodgman, tre righe: si scorre il
    contorno e per ogni lato si guarda se i due capi stanno dalla parte
    buona; dove il lato attraversa la retta si mette il punto
    d'incrocio. Serve per staccare l'imbotto dalle ali senza ridisegnare
    niente: il taglio passa dove le ali si innestano.
    """
    dentro = lambda p: (p[asse] - quota) * tieni >= 0
    fuori = []
    for i in range(len(c)):
        a, b = c[i], c[(i + 1) % len(c)]
        da, db = dentro(a), dentro(b)
        if da:
            fuori.append(a)
        if da != db:
            t = (quota - a[asse]) / (b[asse] - a[asse])
            fuori.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
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
    arg = sys.argv[1:]
    # il nome del disegno non e' il nome del modello a catalogo: la
    # BASE_HT789 e' la Siena. Si dice con --modello, se no si usa il
    # nome del file.
    modello = None
    if '--modello' in arg:
        i = arg.index('--modello')
        modello = arg[i + 1]
        arg = arg[:i] + arg[i + 2:]
    if not arg:
        sys.exit('Uso: python tools/dxf-tavola.py <tavola.dxf> [--modello nome]')
    f = arg[0]
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
        return contorni(ent), ali_di(ent)

    telB, aliB = telaio_di(pB, lambda m: m[1])
    telA, aliA = telaio_di(pA, lambda m: m[0])

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

    # La maniglia c'e' nell'alzato: la rosetta e la leva, disegnate come
    # si vedono di fronte. La forma e la posizione sono sue, la
    # profondita' no -- di una maniglia la tavola non da' la sezione.
    picc = [p for p in pAl
            if 50 < (misura(p)[0] * misura(p)[1]) < 60000 and misura(p)[0] > 20]
    leva = max(picc, key=lambda p: misura(p)[0]) if picc else None
    rose = [p for p in picc if p is not leva
            and abs(misura(p)[0] - misura(p)[1]) < misura(p)[1] * 0.2]
    rosetta = max(rose, key=lambda p: misura(p)[0]) if rose else None

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
    # ogni stipite guarda la luce da una parte diversa; la traversa la
    # guarda da sotto
    mezzo = (ax0 + ax1) / 2
    stipiti = [stacca(c, aliB, 0, 1 if sum(q[0] for q in c) / len(c) < mezzo else -1)
               for c in telB]
    traverse = [stacca(c, aliA, 1, -1) for c in telA]

    aliW = [[{'a': round(q['a'] - ax0, 2), 'z': round(q['z'] - ym0, 2),
              'verso': q['verso']} for q in se] for _, se in stipiti]
    aliAW = [[{'a': round(q['a'] - ay0, 2), 'z': round(q['z'] - zA, 2),
               'verso': q['verso']} for q in se] for _, se in traverse]
    # La traversa, nel disegno, ha una sola delle due ali chiusa come
    # faccia: l'altra il disegnatore l'ha lasciata aperta. Ma il telaio
    # e' un profilo solo -- lo stipite e la traversa hanno la stessa
    # sezione, 104,5 x 138 tutti e due -- quindi le quote in profondita'
    # sono quelle dello stipite. Si completa da li' invece di rinunciare
    # a un coprifilo su tre lati.
    zeta = sorted({(q['z'], q['verso']) for se in aliW for q in se})
    for se in aliAW:
        if se and len(se) < len(zeta):
            a = se[0]['a']
            se[:] = [{'a': a, 'z': z, 'verso': v} for z, v in zeta]

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
        # Lo stipite e la traversa alta, gia' al loro posto rispetto
        # all'anta: ci si sovrappongono, la porta chiude nella battuta.
        # Vengono in tre pezzi invece che in uno: l'IMBOTTO che fascia il
        # muro, e le due ALI, che sono i coprifili gia' montati. Nel
        # disegno sono un profilo unico -- la fabbrica li vende cosi' --
        # ma per poter cambiare coprifilo vanno staccati, e il posto dove
        # staccarli lo dice l'ala stessa: si taglia dove finisce.
        'telaio': [xz(c) for c in telB],
        'telaio_alto': [yz(c) for c in telA],
        'telaio_imbotto': [xz(i) for i, _ in stipiti],
        'telaio_alto_imbotto': [yz(i) for i, _ in traverse],
        'ali': aliW,
        'ali_alto': aliAW,
        'muro': {'z0': round(min(scatola(m)[2] for m in mur) - ym0, 2),
                 'z1': round(max(scatola(m)[3] for m in mur) - ym0, 2),
                 'x0': round(scatola(mur[0])[1] - ax0, 2),
                 'x1': round(scatola(mur[-1])[0] - ax0, 2)} if mur else None,
        # la rosetta e' tonda e la tavola la disegna con tre archi che non
        # chiudono: si prende dal suo ingombro, che di un cerchio dice
        # tutto
        'maniglia': ({'leva': [[round(q[0] - ax0, 2), round(q[1] - ay0, 2)]
                               for q in contorni(leva)[0]],
                      'cx': round((scatola(rosetta)[0] + scatola(rosetta)[1]) / 2 - ax0, 2),
                      'cy': round((scatola(rosetta)[2] + scatola(rosetta)[3]) / 2 - ay0, 2),
                      'r': round(misura(rosetta)[1] / 2, 2)}
                     if leva and rosetta and contorni(leva) else None),
        'quote': {k: v for k, v in testi(tutte).items()},
    }
    # ── tre cataloghi, non un file solo ──────────────────────────────
    # Il disegno dell'anta e' di questo modello; il TELAIO e i COPRIFILI
    # sono di tutti. La fabbrica non vende quarantaquattro telai, ne
    # vende due o tre, e un coprifilo non appartiene a nessuna porta --
    # sta sul muro, e l'anta non lo tocca nemmeno.
    # Percio' la tavola si divide: quello che e' della porta va nella sua
    # cartella, quello che e' del telaio nel catalogo dei telai. Il
    # modello dice solo QUALE telaio monta, e per adesso montano tutti
    # quello standard.
    DEL_TELAIO = ('telaio', 'telaio_alto', 'telaio_imbotto',
                  'telaio_alto_imbotto', 'ali', 'ali_alto', 'muro')
    slug = modello or d['nome'].lower().replace('_', '-')
    tel = {'nome': slug, 'origine': d['nome'], 'spessore_anta': d['spessore']}
    tel.update({k: d[k] for k in DEL_TELAIO})
    porta = {k: v for k, v in d.items() if k not in DEL_TELAIO}
    porta['telaio'] = 'standard'

    dove = os.path.join(RADICE, 'assets', 'porte', slug)
    os.makedirs(dove, exist_ok=True)
    os.makedirs(os.path.join(RADICE, 'assets', 'telai'), exist_ok=True)
    with io.open(os.path.join(dove, 'anta.json'), 'w', encoding='utf8') as g:
        json.dump(porta, g, ensure_ascii=False)
    # il telaio estratto si scrive col nome del modello, NON sopra quello
    # standard: serve a confrontarlo. Se e' uguale, un telaio in meno.
    with io.open(os.path.join(RADICE, 'assets', 'telai', slug + '.json'),
                 'w', encoding='utf8') as g:
        json.dump(tel, g, ensure_ascii=False)

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
    if d['maniglia']:
        m = d['maniglia']
        print('maniglia   rosetta r %.1f @(%.1f, %.1f), leva %d punti'
              % (m['r'], m['cx'], m['cy'], len(m['leva'])))
    if d['muro']:
        m = d['muro']
        print('muro       spesso %.1f, vano da %.1f a %.1f'
              % (m['z1'] - m['z0'], m['x0'], m['x1']))
    print('quote      %s' % d['quote'])
    print('-> assets/porte/%s/anta.json   (monta il telaio "%s")'
          % (slug, porta['telaio']))
    print('   assets/telai/%s.json   da confrontare con lo standard' % slug)


if __name__ == '__main__':
    main()
