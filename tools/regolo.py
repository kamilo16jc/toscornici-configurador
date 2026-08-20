# -*- coding: utf-8 -*-
"""Il REGOLO: la modanatura che gira intorno al vano.

Nel disegno di fabbrica c'e' e noi non la costruivamo. Il corpo dell'anta
usciva col vano tagliato di squadro -- uno spigolo vivo -- mentre la
sezione del traverso, accanto al bordo del vano, porta una gola di
sedici millimetri che scende di otto in curva. E' quella che sulla porta
vera si vede come un filetto intorno al pannello, e intorno al vetro fa
il fermavetro.

Qui la si tira fuori dalla sezione e la si scrive nell'anta.json, cosi'
il motore la trova gia' misurata. NON si disegna a mano: e' il disegno
della fabbrica, al centesimo.

    python tools/regolo.py            tutte le porte
    python tools/regolo.py siena      una sola
"""
import json, io, os, sys, glob

def regolo(sez, largo=20.0):
    """Il tratto di sezione entro `largo` mm dal bordo del vano.

    LE DUE FACCE SI SEPARANO CAMMINANDO IL CONTORNO, non tagliando a
    meta' dello spessore. Tagliando a meta' si sbaglia e si vede subito:
    il piano dove appoggia il pannello sta a diciotto millimetri su
    quarantacinque -- sotto la meta' -- e finiva insieme alla gola, che
    sta dall'altra parte. Ne usciva un profilo profondo diciotto invece
    che otto: tutto il rebaje invece della sola modanatura.

    Il bordo del vano e' il capo con la x piu' piccola, e li' il
    contorno ci passa DUE VOLTE, una per faccia. Da quei due punti si
    cammina il giro nei due versi finche' non ci si allontana troppo:
    vengono fuori le due facce, pulite. Si tiene quella che si MUOVE --
    l'altra e' il piano dove appoggia il pannello, e la sua bugna lo
    copre tutto.
    """
    n = len(sez)
    x0 = min(q[0] for q in sez)
    capi = [i for i in range(n) if sez[i][0] - x0 < 0.02]
    if len(capi) < 2:
        return None
    # i due capi veri: il primo e l'ultimo del gruppo attaccato al bordo
    catene = []
    for i0, verso in ((capi[0], -1), (capi[-1], +1)):
        # UNA MODANATURA NON FA SALTI. Camminando dritti si finiva per
        # prendere anche il muro alto ventiquattro millimetri dove il
        # vano si incassa: usciva un profilo profondo trentuno invece
        # che otto. Al primo scalino ci si ferma -- di la' non e' piu'
        # modanatura, e' la battuta.
        c = []
        i = i0
        for _ in range(n):
            q = sez[i]
            if q[0] - x0 > largo:
                break
            if len(c) > 2 and q[0] - x0 > 1.0 and abs(q[1] - c[-1][1]) > 3.0:
                break
            c.append(q)
            i = (i + verso) % n
        catene.append(c)
    scelta = max(catene, key=lambda c: (max(q[1] for q in c) - min(q[1] for q in c)) if len(c) > 3 else -1)
    if len(scelta) < 4:
        return None
    # in coordinate proprie: quanto dentro dal bordo, quanto scende dal bordo
    z0 = scelta[0][1]
    p = [[round(q[0] - x0, 2), round(abs(q[1] - z0), 2)] for q in scelta]
    netto = [p[0]]
    for q in p[1:]:
        if abs(q[0] - netto[-1][0]) > 0.05 or abs(q[1] - netto[-1][1]) > 0.05:
            netto.append(q)
    # La modanatura finisce dove il profilo si impenna: da li' in poi e'
    # lo smusso che va alla faccia, e non gira intorno al vano.
    # Si comincia a guardare dopo il primo millimetro: proprio sul bordo
    # il disegno mette una manciata di punti tutti alla stessa x, ed e'
    # il raccordo, non la fine della modanatura.
    fine = len(netto)
    for i in range(1, len(netto)):
        if netto[i][0] > 1.0 and netto[i][0] - netto[i - 1][0] < 0.02:
            fine = i
            break
    return netto[:fine]

def fai(slug):
    f = os.path.join('assets', 'porte', slug, 'anta.json')
    d = json.load(io.open(f, encoding='utf8'))
    sez = None
    for t in d.get('traversi', []):
        if t.get('punti') and (sez is None or len(t['punti']) > len(sez)):
            sez = t['punti']
    if not sez:
        # Le porte ricalcate a mano non hanno sezione: nel tracciato ci
        # sono i vani, non il taglio del legno. Prendono quella di
        # Siena, che e' misurata sul DXF, e il file lo dice -- meglio
        # una misura vera presa in prestito che una inventata qui.
        base = json.load(io.open(os.path.join('assets', 'porte', 'siena', 'anta.json'),
                                 encoding='utf8'))
        r = base['pannello'].get('regolo')
        if not r:
            return '%-11s siena non ha ancora il regolo' % slug
        d.setdefault('pannello', {})['regolo'] = r
        d['pannello']['regolo_da'] = 'siena'
        io.open(f, 'w', encoding='utf8').write(json.dumps(d, ensure_ascii=False, indent=1))
        return '%-11s regolo preso da siena (%d punti)' % (slug, len(r))
    r = regolo(sez)
    if not r or len(r) < 4:
        return '%-11s sezione senza gola' % slug
    d.setdefault('pannello', {})['regolo'] = r
    io.open(f, 'w', encoding='utf8').write(json.dumps(d, ensure_ascii=False, indent=1))
    return ('%-11s regolo: %d punti, largo %.2f mm, profondo %.2f mm'
            % (slug, len(r), max(q[0] for q in r), max(q[1] for q in r)))

sl = sys.argv[1:] or [os.path.basename(os.path.dirname(f))
                      for f in glob.glob('assets/porte/*/anta.json')]
for s in sl:
    print(fai(s))
