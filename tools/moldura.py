# -*- coding: utf-8 -*-
"""La moldura del giunto fra armazon e pannello, dalla definizione.

Il file `double_step_curved_middle_001.json` la descrive tutta, e dice
anche la cosa che mi era sfuggita:

    «El armazon se aparta del vano crecido por el ancho de la moldura;
     si no, se queda macizo aqui y la tapa.»

E' esattamente quel che era successo: avevo messo la gola in fuori dal
vano e il montante ci stava sopra, macizo, e non si vedeva niente. Poi
l'avevo messa in dentro e litigava col pannello. Non era ne' di qua ne'
di la': mancava di scostare l'armazon.

Il sistema di riferimento del profilo:
    x   dal bordo del pannello (0) verso l'armazon (12)
    z   sopra la faccia del pannello (0) fino alla faccia dell'anta (13,5)

E i 13,5 tornano da soli: la faccia dell'anta sta a 45, il piano del
pannello a 21 + 10,5 = 31,5. Quarantacinque meno trentuno e mezzo fa
tredici e mezzo. Non e' una coincidenza -- e' la stessa porta.

    python tools/moldura.py [definizione.json]
"""
import json, io, os, sys, glob

SORG = sys.argv[1] if len(sys.argv) > 1 else \
    os.path.join(os.path.expanduser('~'), 'Downloads',
                 'double_step_curved_middle_001.json')

d = json.load(io.open(SORG, encoding='utf8'))['bevel_definition']
pr = d['profile']
pt = [[float(q['x_mm']), float(q['z_mm'])] for q in pr['control_points']]
LARGO = float(d['overall_dimensions']['total_width_mm'])
CADUTA = float(d['overall_dimensions']['total_drop_mm'])
print('%s  --  %s' % (d['id'], d['name']))
print('  %d punti, largo %g mm, caduta %g mm, angoli %s'
      % (len(pt), LARGO, CADUTA, d['corners']['type']))
print('  labrada: %s' % d['perimeter_application']['placement'])
print('  scostare l\'armazon di %g mm' % d['frame_relief']['depth_mm'])

n = 0
for f in glob.glob('assets/porte/*/anta.json'):
    a = json.load(io.open(f, encoding='utf8'))
    pa = a.get('pannello')
    if not pa:
        continue
    pa['moldura'] = {
        'id': d['id'],
        'largo': LARGO,
        'caduta': CADUTA,
        'punti': [[round(x, 4), round(z, 4)] for x, z in pt],
    }
    pa.pop('regolo_largo', None)
    io.open(f, 'w', encoding='utf8').write(json.dumps(a, ensure_ascii=False, indent=1))
    n += 1
print('scritta in %d porte' % n)
