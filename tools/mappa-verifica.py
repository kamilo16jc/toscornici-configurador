# -*- coding: utf-8 -*-
# Controlla che lo schema che si spedisce sia accettabile PRIMA di spendere
# 44 chiamate per scoprire che non lo e'. Non chiama l'API: applica le regole
# documentate della salita strutturata.
#
#   python tools/mappa-verifica.py
import io
import json
import os
import sys

REPO = r'C:/Toscocornici'
sys.path.insert(0, os.path.join(REPO, 'tools'))

# si riusa il ripulisci dello script vero, non una copia che puo' divergere
import importlib.util
spec = importlib.util.spec_from_file_location(
    'mleggi', os.path.join(REPO, 'tools/mappa-leggi.py'))
mod = importlib.util.module_from_spec(spec)
os.environ.setdefault('ANTHROPIC_API_KEY', 'finta-solo-per-importare')
spec.loader.exec_module(mod)

S = mod.SCHEMA
VIETATI = set(mod.NON_AMMESSI)


def cerca(n, dove='schema'):
    fuori = []
    if isinstance(n, dict):
        for k, v in n.items():
            if k in VIETATI:
                fuori.append('%s.%s (vincolo non ammesso)' % (dove, k))
            if k.startswith('_'):
                fuori.append('%s.%s (chiave interna)' % (dove, k))
            fuori += cerca(v, dove + '.' + k)
    elif isinstance(n, list):
        for i, v in enumerate(n):
            fuori += cerca(v, '%s[%d]' % (dove, i))
    return fuori


problemi = []

resti = cerca(S)
print('vincoli non ammessi rimasti:', resti or 'NESSUNO')
if resti:
    problemi.append('ci sono ancora vincoli che l\'API rifiuta')

print('additionalProperties:', S.get('additionalProperties'))
if S.get('additionalProperties') is not False:
    problemi.append('additionalProperties deve essere false')

print('campi obbligatori:', len(S.get('required', [])))
print('proprieta totali:', len(S.get('properties', {})))

manca = [c for c in S.get('required', []) if c not in S.get('properties', {})]
if manca:
    problemi.append('required elenca campi che non esistono: %s' % manca)

tipi = sorted({v.get('type') for v in S['properties'].values()})
print('tipi usati:', tipi)
if set(tipi) - {'string', 'integer', 'number', 'boolean', 'array', 'object'}:
    problemi.append('tipo non previsto')

senza_enum = [k for k, v in S['properties'].items()
              if v.get('type') == 'string' and 'enum' not in v]
print('stringhe senza enum:', senza_enum or 'nessuna')

print()
print('come partono adesso i due campi che fallivano:')
print('  riquadri_numero:', json.dumps(S['properties']['riquadri_numero'], ensure_ascii=False)[:110])
print('  note:           ', json.dumps(S['properties']['note'], ensure_ascii=False)[:110])

print()
if problemi:
    print('NON VA:')
    for p in problemi:
        print('  -', p)
    sys.exit(1)
print('Lo schema rispetta le regole. Si puo\' lanciare mappa-leggi.py.')
