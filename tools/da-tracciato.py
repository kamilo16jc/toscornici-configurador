# -*- coding: utf-8 -*-
"""Da un tracciato dell'editor a una porta del catalogo.

Il file dell'editor da' i RETTANGOLI ricalcati sopra una foto: ognuno con
il suo papel -- traverso, montante, bugnato. Qui diventano un anta.json,
quello che legge porta3d.js.

TRE COSE CHE NON SI COPIANO E BASTA:

1. IL DISEGNO STA IN COORDINATE DELL'IMMAGINE, non dell'anta: la foto e'
   piu' larga della porta e la porta ci sta dentro spostata. Si prende la
   SCATOLA di quel che e' stato ricalcato e la si porta sulle misure
   vere dell'anta. Per Roma erano 842.7 x 2027.7 su una tela di 996.

2. I MONTANTI RICALCATI SI BUTTANO. Non e' una perdita: il corpo
   dell'anta si fa come una tavola sola coi vani ritagliati dentro, e il
   montante di mezzo e' quel che resta fra due colonne di vani. Viene da
   se', e viene giusto -- fra due vani c'e' sempre del legno.
   I due montanti di fuori li mette il motore, con la sezione VERA
   misurata sul DXF di Siena: 114 mm con la sua cava. Meglio una sezione
   misurata che una ricalcata a mano.

3. SI RADDRIZZA, e va detto. Ricalcando a mano sopra una foto i sei vani
   di Roma escono sfalsati fino a 6,7 mm fra una colonna e l'altra: in
   3D si vedrebbe il montante di mezzo storto. Una porta e' simmetrica,
   quindi le colonne si specchiano e le righe si allineano sulla media.
   E' l'unica cosa che questo programma da' per scontata.
"""
import json, io, sys, os, math

SORG = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\Julic\Downloads\Roma.json'
SLUG = sys.argv[2] if len(sys.argv) > 2 else 'roma'
BASE = 'siena'                      # da chi si prendono sezioni e bugna

d = json.load(io.open(SORG, encoding='utf8'))
L = float(d['plantilla']['ancho']); H = float(d['plantilla']['alto'])
pz = [p for p in d['piezas'] if p.get('visible', True)]

# 1. la scatola di quel che e' ricalcato -> le misure dell'anta
def _giro(p):
    if p['tipo'] != 'trazado':
        return [(p['x'], p['y']), (p['x'] + p['w'], p['y'] + p['h'])]
    return [(q['x'], q['y']) for q in p['nodos']]
xs = [q[0] for p in pz for q in _giro(p)]
ys = [q[1] for p in pz for q in _giro(p)]
X0, X1, Y0, Y1 = min(xs), max(xs), min(ys), max(ys)
sx, sy = L / (X1 - X0), H / (Y1 - Y0)
fx = lambda x: (x - X0) * sx
fy = lambda y: (y - Y0) * sy
print('ricalcato %.1f x %.1f  ->  anta %.0f x %.0f  (x %.4f, y %.4f)'
      % (X1 - X0, Y1 - Y0, L, H, sx, sy))

def arco(p0, p1, b, passo=2.0):
    """I punti di un arco fra due nodi, dato il suo BOMBO.

    Il bombo e' la tangente di un quarto dell'angolo dell'arco: 1 e' un
    mezzo cerchio, ed e' quel che ha New England. La freccia -- quanto
    l'arco si stacca dalla corda -- e' bombo per meta' corda.

    DA CHE PARTE VA. Sul contorno di New England, che gira in senso
    antiorario, va a DESTRA del cammino, cioe' in fuori: il colmo sale a
    1925,4 e trova sopra di se' i novantadue millimetri di legno della
    traversa ricalcata. Dall'altra parte l'arco morderebbe dentro il
    vano e quella traversa non coprirebbe niente.
    Sta scritto qui perche' e' calibrato su una porta sola: se un giorno
    ne arriva una con l'arco che rientra, si vedra' al primo render --
    che e' il modo giusto per accorgersene.
    """
    (x0, y0), (x1, y1) = p0, p1
    corda = math.hypot(x1 - x0, y1 - y0)
    if corda < 1e-9 or abs(b) < 1e-9:
        return []
    ang = 4 * math.atan(abs(b))                  # l'angolo che l'arco copre
    r = corda / (2 * math.sin(ang / 2))
    ux, uy = (x1 - x0) / corda, (y1 - y0) / corda
    nx, ny = uy, -ux                             # a destra del cammino
    if b < 0:
        nx, ny = -nx, -ny
    # il centro sta sulla mediana, dall'altra parte rispetto al colmo
    h = math.sqrt(max(r * r - (corda / 2) ** 2, 0.0)) * (-1 if abs(b) < 1 else 1)
    cx, cy = (x0 + x1) / 2 + nx * h, (y0 + y1) / 2 + ny * h
    a0 = math.atan2(y0 - cy, x0 - cx)
    a1 = math.atan2(y1 - cy, x1 - cx)
    verso = 1 if b > 0 else -1
    while (a1 - a0) * verso <= 0:
        a1 += 2 * math.pi * verso
    n = max(2, int(abs(a1 - a0) / math.radians(passo)))
    return [(cx + r * math.cos(a0 + (a1 - a0) * k / n),
             cy + r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]

def contorno(p):
    """Il giro di un pezzo ricalcato: rettangolo o tracciato con archi."""
    if p['tipo'] != 'trazado':
        return [(p['x'], p['y']), (p['x'] + p['w'], p['y']),
                (p['x'] + p['w'], p['y'] + p['h']), (p['x'], p['y'] + p['h'])]
    n = p['nodos']
    giro = []
    for i, q in enumerate(n):
        r = n[(i + 1) % len(n)]
        giro.append((q['x'], q['y']))
        giro.extend(arco((q['x'], q['y']), (r['x'], r['y']), q.get('b', 0) or 0))
    return giro

vani = []
for p in pz:
    if p.get('papel') != 'bugnato':
        continue
    g = [(fx(x), fy(y)) for x, y in contorno(p)]
    xs = [q[0] for q in g]; ys = [q[1] for q in g]
    vani.append((min(xs), max(xs), min(ys), max(ys),
                 g if p['tipo'] == 'trazado' else None))
if not vani:
    sys.exit('nessun vano: il tracciato non ha pezzi «bugnato»')

# Quel che si lascia fuori si dice, non si tace: montanti e traversi
# ricalcati non servono -- il corpo dell'anta li ritrova da solo -- ma se
# un giorno arrivasse un ruolo nuovo, sparirebbe senza un fiato.
scartati = {}
for q in pz:
    if q.get('papel') != 'bugnato':
        scartati[q.get('papel')] = scartati.get(q.get('papel'), 0) + 1
if scartati:
    print('lasciati fuori: ' + ', '.join('%d %s' % (n, k) for k, n in sorted(scartati.items()))
          + '   (il legno fra i vani viene da se)')

# 2. si raddrizza: le righe sulla media, i fili verticali specchiati
def gruppi(vals, tol=20):
    """I valori vicini sono lo stesso filo: se ne tiene la media."""
    vals = sorted(vals); gr = [[vals[0]]]
    for v in vals[1:]:
        if v - gr[-1][-1] <= tol: gr[-1].append(v)
        else: gr.append([v])
    return [sum(g) / len(g) for g in gr]

def accosta(v, griglia):
    return min(griglia, key=lambda g: abs(g - v))

# NON si incrociano righe e colonne. Roma ha due colonne su tutte e tre
# le righe, ma Ragusa in mezzo ha UN vano solo largo quanto la porta:
# incrociando, quel vano si spaccherebbe in due. Ogni vano resta dov'e';
# quel che si raddrizza sono i FILI su cui i vani si appoggiano.
righe = list(zip(gruppi([v[2] for v in vani]), gruppi([v[3] for v in vani])))
fili = gruppi([v[0] for v in vani] + [v[1] for v in vani])
# specchiati sulla mezzeria: una porta e' simmetrica, la mano no
fili = [(f + (L - fili[len(fili) - 1 - i])) / 2 for i, f in enumerate(fili)]

riquadri = []
for a, b, c, e, giro in vani:
    riga = min(righe, key=lambda r: abs(r[0] - c) + abs(r[1] - e))
    q = {'x0': round(accosta(a, fili), 1), 'x1': round(accosta(b, fili), 1),
         'y0': round(riga[0], 1), 'y1': round(riga[1], 1)}
    if giro:
        # Il vano curvo si porta dietro il suo giro, che il motore sa
        # gia' disegnare -- e' cosi' che si fanno i vani di Cosenza.
        # Lo si stira dalla sua scatola a quella raddrizzata, cosi' i
        # fianchi cadono sui fili giusti e la curva resta curva.
        sx = (q['x1'] - q['x0']) / (b - a) if b > a else 1
        sy = (q['y1'] - q['y0']) / (e - c) if e > c else 1
        q['punti'] = [[round(q['x0'] + (x - a) * sx, 2),
                       round(q['y0'] + (y - c) * sy, 2)] for x, y in giro]
    riquadri.append(q)
riquadri.sort(key=lambda r: (r['y0'], r['x0']))

# 3. i traversi sono il complemento: fra due file di vani c'e' sempre
#    del legno, e ai due capi il traverso arriva al filo dell'anta
tagli = [0.0] + [q for r in righe for q in r] + [H]
traversi = [{'y0': round(tagli[i], 1), 'y1': round(tagli[i + 1], 1)}
            for i in range(0, len(tagli) - 1, 2)]

base = json.load(io.open('assets/porte/%s/anta.json' % BASE, encoding='utf8'))
fuori = {
    'nome': os.path.splitext(os.path.basename(SORG))[0].upper(),
    'spessore': float(d['plantilla'].get('espesor', base['spessore'])),
    'anta': {'larghezza': L, 'altezza': H},
    'montante': base['montante'],          # sezione misurata, non ricalcata
    'traversi': traversi,
    'riquadri': riquadri,
    'pannello': base['pannello'],          # il tracciato dice perfilBugna: siena
    'maniglia': base['maniglia'],
    'telaio': base['telaio'],
    'tracciato': 'ricalcato su %s, squadrato' % os.path.basename(SORG),
}
os.makedirs('assets/porte/%s' % SLUG, exist_ok=True)
io.open('assets/porte/%s/anta.json' % SLUG, 'w', encoding='utf8').write(
    json.dumps(fuori, ensure_ascii=False, indent=1))
print('%d vani, %d traversi  ->  assets/porte/%s/anta.json' % (len(riquadri), len(traversi), SLUG))
for r in riquadri: print('   vano  x %6.1f..%6.1f   y %6.1f..%6.1f' % (r['x0'], r['x1'], r['y0'], r['y1']))
for t in traversi: print('   trav.               y %6.1f..%6.1f' % (t['y0'], t['y1']))
