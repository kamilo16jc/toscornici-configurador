# -*- coding: utf-8 -*-
# Perche' la lettura fallisce con 'ascii codec can't encode'.
#
# Non stampa MAI la chiave. Stampa solo la sua forma: quanto e' lunga, se
# comincia come deve, e in quali posizioni ci sono caratteri che non sono
# ASCII — con il loro nome, non col carattere attorno.
import io
import json
import os
import sys

K = os.environ.get('ANTHROPIC_API_KEY')
if not K:
    sys.exit('ANTHROPIC_API_KEY non e\' nell\'ambiente.')

print('lunghezza:', len(K))
print('comincia con sk-ant-:', K.startswith('sk-ant-'))
print('finisce in AA:', K.endswith('AA'))

fuori = [(i, ch) for i, ch in enumerate(K) if ord(ch) > 127]
if fuori:
    print()
    print('CARATTERI NON ASCII TROVATI:', len(fuori))
    import unicodedata
    visti = {}
    for i, ch in fuori:
        visti.setdefault(ch, []).append(i)
    for ch, posizioni in visti.items():
        nome = unicodedata.name(ch, '?')
        print('  U+%04X  %-38s x%d  posizioni %s'
              % (ord(ch), nome, len(posizioni), posizioni[:12]))
    print()
    print('E\' questo. Quei caratteri sono entrati copiando: sembrano trattini')
    print('normali ma non lo sono, e l\'intestazione HTTP li rifiuta.')
else:
    print()
    print('La chiave e\' tutta ASCII: il problema non e\' lei.')

# se non e' la chiave, e' qualcosa che mando io nella richiesta
print()
print('--- controllo del resto della richiesta ---')
REPO = r'C:/Toscocornici'
try:
    testo = io.open(os.path.join(REPO, 'tools/mappa-leggi.py'), encoding='utf-8').read()
    schema = io.open(os.path.join(REPO, 'tools/mappa-schema.json'), encoding='utf-8').read()
    for nome, s in [('mappa-leggi.py', testo), ('mappa-schema.json', schema)]:
        n = sum(1 for ch in s if ord(ch) > 127)
        print('  %-20s caratteri non ASCII: %d' % (nome, n))
except Exception as e:
    print('  non leggibile:', e)

print()
print('codepage della console / encoding di Python:')
print('  stdout:', sys.stdout.encoding)
print('  filesystem:', sys.getfilesystemencoding())
