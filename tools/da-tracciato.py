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
import json, io, sys, os

SORG = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\Julic\Downloads\Roma.json'
SLUG = sys.argv[2] if len(sys.argv) > 2 else 'roma'
BASE = 'siena'                      # da chi si prendono sezioni e bugna

d = json.load(io.open(SORG, encoding='utf8'))
L = float(d['plantilla']['ancho']); H = float(d['plantilla']['alto'])
pz = [p for p in d['piezas'] if p.get('visible', True)]

# 1. la scatola di quel che e' ricalcato -> le misure dell'anta
xs = [p['x'] for p in pz] + [p['x'] + p['w'] for p in pz]
ys = [p['y'] for p in pz] + [p['y'] + p['h'] for p in pz]
X0, X1, Y0, Y1 = min(xs), max(xs), min(ys), max(ys)
sx, sy = L / (X1 - X0), H / (Y1 - Y0)
fx = lambda x: (x - X0) * sx
fy = lambda y: (y - Y0) * sy
print('ricalcato %.1f x %.1f  ->  anta %.0f x %.0f  (x %.4f, y %.4f)'
      % (X1 - X0, Y1 - Y0, L, H, sx, sy))

vani = [(fx(p['x']), fx(p['x'] + p['w']), fy(p['y']), fy(p['y'] + p['h']))
        for p in pz if p.get('papel') == 'bugnato']
if not vani:
    sys.exit('nessun vano: il tracciato non ha pezzi «bugnato»')

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
for a, b, c, e in vani:
    riga = min(righe, key=lambda r: abs(r[0] - c) + abs(r[1] - e))
    riquadri.append({'x0': round(accosta(a, fili), 1), 'x1': round(accosta(b, fili), 1),
                     'y0': round(riga[0], 1), 'y1': round(riga[1], 1)})
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
