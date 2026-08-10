# -*- coding: utf-8 -*-
"""
DA DXF A PROFILO 3D — i coprifili come sono davvero.

La fabbrica manda i DXF di sezione: coordinate esatte, archi con centro
e raggio. Finalmente non c'e' niente da indovinare -- fin qui i nostri
coprifili erano immagini di repertorio e i telai ricalchi di miniature.

TRE COSE VISTE LEGGENDO IL PRIMO FILE
1. Il DXF porta anche il RIQUADRO DEL FOGLIO: quattro linee che fanno un
   rettangolo attorno al disegno. Non e' il profilo, e tenendolo la
   sezione verrebbe fuori grande come la pagina.
2. I codici di gruppo delle LINE non sono in coppia come uno se li
   aspetta: prima 10 e 11 (le due x), poi 20 e 21 (le due y).
3. Tolto il riquadro, il profilo misura 69,00 x 24,68 mm -- che e'
   esattamente il nome del file, 24,5X69. Il decimo di troppo e' la
   pancia degli archi: la misura nominale e' sul corpo.

E UNA QUARTA, ARRIVATO IL RESTO DEI FILE
Non tutti i disegni sono una linea chiusa e basta: qualcuno porta dentro
un dettaglio a se' (il Canaletto), qualcuno una linea rimasta li' lunga
due decimi (il Tintoretto). Incatenare per vicinanza -- come si faceva
quando il file era uno solo -- su questi va a sbattere: la catena
imbocca il dettaglio e il contorno esce annodato.

Percio' adesso non si incatena: si CAMMINA SUL BORDO. Si parte dal punto
piu' in basso -- che sul bordo ci sta per forza, sotto non c'e' niente --
e a ogni nodo si prende il lato piu' orario. Cosi' il cammino resta sul
guscio: nei dettagli interni non entra mai, e non c'e' niente da tarare.

USO
    python tools/dxf-profilo.py <file.dxf> [--nome slug]
"""

import io
import json
import math
import os
import sys

FUORI = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                     'assets', 'profili')
PASSO_ARCO = 2.0     # gradi per segmento: sotto il decimo di mm sul raggio
SNAP = 0.01          # due punti piu' vicini di cosi' sono gia' lo stesso nodo
CUCI = 1.0           # e fin qui si cuce, ma solo fra due capi liberi


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


def area(p):
    s = 0.0
    for i in range(len(p)):
        x0, y0 = p[i]
        x1, y1 = p[(i + 1) % len(p)]
        s += x0 * y1 - x1 * y0
    return s / 2


def spezza_a_T(segs, chiavi):
    """Spezza i segmenti dove ci finisce sopra il capo di un altro.

    Il Canaletto lo ha fatto vedere: il suo incastro e' disegnato con una
    linea che ARRIVA A META' del fianco, non a un vertice. Per il disegno
    e' un raccordo normale; per un grafo no -- se il punto non e' un nodo
    condiviso, quella linea resta appesa, e potando gli appesi si porta
    via mezzo profilo. (Era il motivo per cui del Canaletto usciva un
    rettangolino 9x3 al posto della sezione.)

    Percio' prima di camminare si guarda, per ogni capo di entita', se
    cade in mezzo a un segmento: li' il segmento si taglia in due, e la
    giunzione diventa un nodo come tutti gli altri.
    """
    fuori = []
    for a, b in segs:
        dx, dy = b[0] - a[0], b[1] - a[1]
        L2 = dx * dx + dy * dy
        if L2 < 1e-12:
            continue
        dentro = []
        for p in chiavi:
            t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2
            if not (1e-6 < t < 1 - 1e-6):
                continue
            q = (a[0] + dx * t, a[1] + dy * t)
            if math.hypot(p[0] - q[0], p[1] - q[1]) < SNAP:
                dentro.append((t, p))
        if not dentro:
            fuori.append((a, b))
            continue
        dentro.sort()
        prec = a
        for _, p in dentro:
            fuori.append((prec, p))
            prec = p
        fuori.append((prec, b))
    return fuori


def contorno_esterno(segs):
    """Il contorno esterno del disegno.

    QUI NON SERVE l'estrazione di TUTTE le facce del grafo piano, come in
    tools/dxf-porta.py: di un coprifilo interessa il giro di fuori, e
    basta. Provata comunque, si e' rotta sul Cartesio 100 -- ha un
    dettaglio che tocca il profilo in quattro punti, e dai nodi di grado
    tre il cammino a sinistra ripassava su un lato gia' speso e buttava
    via il giro. Prendere solo il bordo toglie il problema invece di
    tararlo.

    Si parte dal punto PIU' IN BASSO: quello sta sul bordo per forza, non
    c'e' niente sotto. Da li' si gira tenendo sempre la curva piu' stretta
    verso l'esterno, e a ogni nodo si sceglie fra i lati quello piu'
    orario: cosi' il cammino sta sempre sul guscio e nei dettagli interni
    non entra mai.
    """
    nodo = {}

    def id_di(p):
        k = (round(p[0] / SNAP), round(p[1] / SNAP))
        if k not in nodo:
            nodo[k] = (len(nodo), p)
        return nodo[k][0]

    pos, archi = {}, {}
    for a, b in segs:
        ia, ib = id_di(a), id_di(b)
        if ia == ib:
            continue
        pos[ia], pos[ib] = a, b
        archi.setdefault(ia, set()).add(ib)
        archi.setdefault(ib, set()).add(ia)

    # I disegni non chiudono al centesimo: fra un'entita' e la successiva
    # restano capi liberi a mezzo millimetro l'uno dall'altro, e un
    # contorno aperto non fa faccia. Si cuciono -- ma solo fra due capi
    # LIBERI, cioe' nodi da cui parte una linea sola: dove il disegno e'
    # gia' chiuso non si tocca niente, e un dettaglio staccato resta
    # staccato perche' i suoi capi non hanno un compagno vicino.
    liberi = lambda: [n for n in archi if len(archi[n]) == 1]
    for _ in range(200):
        soli = liberi()
        coppia, dist = None, CUCI
        for i, a in enumerate(soli):
            for b in soli[i + 1:]:
                if b in archi[a]:
                    continue
                d = math.hypot(pos[a][0] - pos[b][0], pos[a][1] - pos[b][1])
                if d < dist:
                    coppia, dist = (a, b), d
        if not coppia:
            break
        a, b = coppia
        archi[a].add(b)
        archi[b].add(a)

    # Cucito il cucibile, quello che ha ancora un capo per aria non e' il
    # contorno: e' un trattino di dettaglio, un richiamo, una linea
    # rimasta. Si pota -- e potando si scopre il trattino successivo,
    # percio' si ripete finche' non resta che roba chiusa. Senza questo il
    # cammino imbocca il ramo morto e il giro non torna piu' a casa.
    while True:
        morti = [n for n in archi if len(archi[n]) == 1]
        if not morti:
            break
        for n in morti:
            for m in archi[n]:
                archi[m].discard(n)
            archi[n].clear()
        archi = {n: v for n, v in archi.items() if v}

    ang = lambda a, b: math.atan2(pos[b][1] - pos[a][1], pos[b][0] - pos[a][0])

    def un_giro():
        """Il bordo del lobo che contiene il punto piu' in basso."""
        via = min(archi, key=lambda n: (pos[n][1], pos[n][0]))
        entrata = -math.pi / 2
        giro, strada, a, prima = [], [], via, None
        for _ in range(20000):
            giro.append(pos[a])
            strada.append(a)
            scelta, meglio = None, -1.0
            for c in archi[a]:
                if prima is not None and c == prima and len(archi[a]) > 1:
                    continue                  # indietro solo se non c'e' altro
                dd = (entrata - ang(a, c)) % (2 * math.pi)
                if dd > meglio:               # il piu' orario: resta di fuori
                    meglio, scelta = dd, c
            if scelta is None:
                break
            prima, entrata, a = a, ang(scelta, a), scelta
            if a == via:
                break
        return giro, strada

    # UN DISEGNO PUO' CONTENERE PIU' SOLIDI. La sezione di un vano di
    # porta ne ha due: l'imbotto a U che fascia il muro, e il montante di
    # battuta contro cui l'anta chiude. Sono legni diversi e vanno
    # tenuti diversi.
    #
    # Separarli PRIMA, guardando quanto distano i capi delle entita', non
    # funziona: dentro la U i capi distano fino a un millimetro, e con
    # una soglia stretta la U stessa si spezza in tre. Vanno separati
    # DOPO aver cucito -- allora i pezzi che si sfiorano ma non si
    # toccano restano grafi staccati, e la U e' un grafo solo.
    tutto = list(archi)
    g = {n: n for n in tutto}

    def trova(n):
        while g[n] != n:
            g[n] = g[g[n]]
            n = g[n]
        return n

    for n in tutto:
        for m in archi[n]:
            g[trova(n)] = trova(m)
    isolotti = {}
    for n in tutto:
        isolotti.setdefault(trova(n), []).append(n)

    interi, fuori = archi, []
    for nodi in isolotti.values():
        archi = {n: interi[n] for n in nodi}
        giro, _ = un_giro()
        if len(giro) >= 3:
            fuori.append(giro)
    fuori.sort(key=lambda g_: -abs(area(g_)))
    return fuori


def prepara(percorso, nome=None):
    ent = senza_riquadro(leggi(percorso))
    segs, capi = [], []
    for e in ent:
        p = punti(e)
        segs += list(zip(p, p[1:]))
        capi += [p[0], p[-1]]
    f = [g for g in contorno_esterno(spezza_a_T(segs, capi)) if abs(area(g)) > 1]
    if not f:
        raise SystemExit('%s: contorno non chiuso' % percorso)
    c = f[0]
    if area(c) < 0:                       # sempre antiorario, come vuole Three
        c = c[::-1]
    xs = [p[0] for p in c]
    ys = [p[1] for p in c]
    # a zero, cosi' il profilo sta in origine invece che dove capitava sul
    # foglio del disegno
    return {
        'nome': nome or os.path.splitext(os.path.basename(percorso))[0],
        'origine': os.path.basename(percorso),
        'larghezza': round(max(xs) - min(xs), 3),
        'spessore': round(max(ys) - min(ys), 3),
        'punti': [(round(x - min(xs), 4), round(y - min(ys), 4)) for x, y in c],
        'chiuso': True,
    }


def main():
    arg = sys.argv[1:]
    nome = None
    if '--nome' in arg:
        i = arg.index('--nome')
        nome = arg[i + 1]
        arg = arg[:i] + arg[i + 2:]
    if not arg:
        sys.exit('Uso: python tools/dxf-profilo.py <file.dxf> [--nome slug]')
    os.makedirs(FUORI, exist_ok=True)
    for f in arg:
        d = prepara(f, nome if len(arg) == 1 else None)
        slug = d['nome'].lower().replace(' ', '-')
        with io.open(os.path.join(FUORI, slug + '.json'), 'w', encoding='utf8') as g:
            json.dump(d, g, ensure_ascii=False)
        print('  %-30s %7.2f x %6.2f mm  %3d punti'
              % (slug + '.json', d['larghezza'], d['spessore'],
                 len(d['punti'])))


if __name__ == '__main__':
    main()
