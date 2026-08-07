# -*- coding: utf-8 -*-
# Indice di ricerca del catalogo. Le descrizioni del manuale non servono
# (3 testi diversi su 44 modelli): questi attributi sono letti a occhio
# dai render FRONTALI di ogni GLB, uno per uno. In vista di tre quarti
# gli scorci falsano il conteggio: sei schede su 44 erano sbagliate
# e sono state corrette rifacendo gli scatti dead-on.
#   vetro    no | parziale | totale
#   arco     no | vetro | pannello
#   lastre   numero di vetri
#   bugne    numero di pannelli ciechi
# Il campo "cerca" e' il sacco di parole su cui fa match il modello.
import io, json, os, re

REPO = r'C:/Users/Julic/OneDrive/Escritorio/Toscornici/configurador-3d'

# id: (vetro, arco, lastre, disposizione, bugne, stile, parole)
P = {
 'nebraska':   ('totale','vetro',5,'5 orizzontali',0,'classico vetrato','luminosa slanciata arco inglese'),
 'genova':     ('parziale','no',6,'2x3 quadri',1,'classico vetrato','quadretti inglese bugna bassa'),
 'carrara':    ('parziale','no',1,'lastra unica alta',1,'classico vetrato','semplice pulita bugna bassa'),
 'cortina':    ('parziale','no',3,'3 orizzontali',1,'classico vetrato','fasce orizzontali bugna bassa'),
 'imperia':    ('parziale','no',8,'2x4 quadri',1,'classico vetrato','griglia fitta inglese bugna bassa'),
 'catania':    ('parziale','no',1,'lastra unica alta',2,'classico vetrato','due bugne basse lastra grande'),
 'barletta':   ('parziale','no',9,'3x3 quadri',2,'classico vetrato','griglia inglese due bugne'),
 'taormina':   ('totale','no',5,'5 orizzontali',0,'classico vetrato','tutta vetrata fasce orizzontali'),
 'pausania':   ('totale','no',2,'lastra alta + fascia bassa',0,'classico vetrato','vetrata slanciata'),
 'savona':     ('parziale','no',1,'lastra con griglia decorativa',1,'classico vetrato','griglia decorativa bugna bassa'),
 'piacenza':   ('no','no',0,'-',4,'classico cieco','quattro bugne robusta'),
 'pienza':     ('no','no',0,'-',2,'classico cieco','due bugne sobria'),

 'siena':      ('no','no',0,'-',2,'classico cieco','due bugne grandi essenziale'),
 'venezia':    ('totale','no',15,'3x5 quadri',0,'classico vetrato','tutta vetrata griglia inglese fitta'),
 'pisa':       ('no','no',0,'-',3,'classico cieco','tre bugne'),
 'roma':       ('no','no',0,'-',6,'classico cieco','sei bugne ricca importante'),
 'ragusa':     ('no','no',0,'-',5,'classico cieco','cinque bugne'),
 'enna':       ('no','no',0,'-',6,'classico cieco','sei bugne simmetrica'),
 'faenza':     ('no','no',0,'-',3,'classico cieco','tre bugne sobria'),
 'mantova':    ('no','no',0,'-',3,'classico cieco','tre bugne sovrapposte'),
 'latina':     ('no','no',0,'-',4,'classico cieco','quattro bugne movimentata'),
 'country':    ('no','no',0,'-',2,'rustico cieco','rustica country semplice'),
 'puglia':     ('parziale','no',1,'lastra curva verticale',1,'moderno vetrato','curva sinuosa originale design'),
 'campania':   ('totale','no',1,'lastra unica intera',0,'moderno vetrato','tutta vetro minimale luminosa'),

 'philadelphia':('parziale','vetro',1,'lastra ad arco',2,'classico vetrato','arco due bugne inglese'),
 'toscana':    ('no','no',0,'-',2,'classico cieco','pannello grande zoccolo basso'),
 'sicilia':    ('totale','no',2,'2 verticali a tutta altezza',0,'moderno vetrato','due feritoie verticali slanciata senza bugne'),
 'emilia':     ('no','no',0,'-',2,'classico cieco','due bugne verticali affiancate'),
 'nevada':     ('no','pannello',0,'-',2,'classico cieco','arco cieco due bugne'),
 'alaska':     ('totale','vetro',1,'lastra ad arco intera',0,'classico vetrato','arco tutta vetrata luminosa'),
 'newengland': ('no','pannello',0,'-',2,'classico cieco','arco cieco slanciata'),
 'manchester': ('totale','vetro',1,'lastra ad arco intera',0,'classico vetrato','arco vetrata alta luminosa'),
 'tamigi':     ('totale','vetro',4,'arco + 3 orizzontali',0,'classico vetrato','arco fasce orizzontali vetrata'),
 'timesquare': ('parziale','vetro',2,'arco + 1 orizzontale',1,'classico vetrato','arco bugna bassa'),
 'cambridge':  ('parziale','vetro',7,'arco + 2x3 quadri',1,'classico vetrato','arco griglia inglese bugna'),
 'canterbury': ('no','pannello',0,'-',3,'classico cieco','arco cieco tre bugne'),

 'windsor':    ('no','pannello',0,'-',3,'classico cieco','arco cieco tre bugne importante'),
 'london':     ('no','pannello',0,'-',3,'classico cieco','arco cieco sobria'),
 'liverpool':  ('totale','vetro',10,'arco + 3x3 quadri',0,'classico vetrato','arco griglia inglese tutta vetrata'),
 'oldcity':    ('parziale','vetro',7,'arco + griglia',2,'classico vetrato','arco griglia due bugne'),
 'oxford':     ('parziale','vetro',7,'arco + 2x3 quadri',1,'classico vetrato','arco griglia inglese bugna'),
 'virginia':   ('no','pannello',0,'-',2,'classico cieco','arco cieco due bugne'),
 'newyork':    ('parziale','no',6,'2x3 quadri',1,'classico vetrato','quadri inglese bugna bassa'),
 'luisiana':   ('parziale','vetro',3,'arco + 2 orizzontali',1,'classico vetrato','arco fasce orizzontali bugna'),
}

src = io.open(os.path.join(REPO, 'js/catalogo.js'), encoding='utf-8').read()
META = dict(re.findall(r'^  "([a-z0-9_]+)": \{\n    "label": "(.*?)"', src, re.M))
LINEA = dict(re.findall(r'^  "([a-z0-9_]+)": \{.*?"linea": "(.*?)"', src, re.M | re.S))

fuori = set(META) - set(P)
assert not fuori, 'modelli senza attributi: %s' % fuori

voci = []
for mid, (vetro, arco, lastre, disp, bugne, stile, parole) in P.items():
    if mid not in META:
        continue
    voci.append({
        'id': mid,
        'nome': META[mid],
        'linea': LINEA.get(mid, ''),
        'vetro': vetro,
        'arco': arco,
        'lastre': lastre,
        'griglia': disp,
        'bugne': bugne,
        'stile': stile,
        'cerca': ' '.join([META[mid].lower(), stile, disp.lower(), parole]),
    })
voci.sort(key=lambda v: v['id'])

out = {
    '_nota': ('Indice di ricerca: attributi letti dai render frontali di ogni GLB. '
              'Le descrizioni del listino non distinguono i modelli (3 testi su 44). '
              'Rigenerare con tools/genera-indice se cambia il catalogo.'),
    '_schema': {
        'vetro': 'no | parziale | totale',
        'arco': 'no | vetro | pannello',
        'lastre': 'numero di vetri',
        'bugne': 'numero di pannelli ciechi',
    },
    'modelli': voci,
}
dst = os.path.join(REPO, 'assets/catalogo-indice.json')
io.open(dst, 'w', encoding='utf-8').write(
    json.dumps(out, ensure_ascii=False, indent=1))

txt = json.dumps(out, ensure_ascii=False)
print('modelli: %d' % len(voci))
print('file: %d KB  ~%d token' % (os.path.getsize(dst)//1024, len(txt)//3.6))
riga = lambda v: '%s|%s|%s|arco:%s|lastre:%s|bugne:%s|%s' % (
    v['id'], v['nome'], v['vetro'], v['arco'], v['lastre'], v['bugne'], v['stile'])
compatto = '\n'.join(riga(v) for v in voci)
print('forma compatta per il prompt: ~%d token' % (len(compatto)//3.6))
print()
for v in voci[:5]: print('  ', riga(v))
