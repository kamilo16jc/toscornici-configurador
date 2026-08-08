# -*- coding: utf-8 -*-
# Il codice va: con una chiave finta la richiesta parte e torna un 401 pulito.
# Quindi l'errore 'ascii codec' nasce nell'ambiente della macchina, non nella
# richiesta. Il sospetto: una variabile d'ambiente con accenti che httpx si
# porta dentro a un'intestazione (le impostazioni proxy le legge da li').
#
# Questo script cerca il colpevole e poi fa UNA chiamata stampando la traccia
# completa. Non stampa mai il valore della chiave.
import os
import sys
import traceback
import unicodedata

# ---------- 1. variabili d'ambiente con caratteri non ASCII ----------
print('=== variabili d\'ambiente non ASCII ===')
SEGRETE = ('KEY', 'TOKEN', 'SECRET', 'PASSWORD', 'PWD')
trovate = 0
for nome, valore in sorted(os.environ.items()):
    fuori = [ch for ch in (nome + valore) if ord(ch) > 127]
    if not fuori:
        continue
    trovate += 1
    segreta = any(s in nome.upper() for s in SEGRETE)
    caratteri = ', '.join(sorted({'U+%04X %s' % (ord(c), unicodedata.name(c, '?'))
                                  for c in fuori}))
    print('  %-28s %s' % (nome, caratteri))
    if not segreta:
        print('      valore: %s' % valore[:120])
    else:
        print('      (valore nascosto: sembra un segreto)')
if not trovate:
    print('  nessuna. Non e\' questo.')

# ---------- 2. quelle che httpx legge per il proxy ----------
print()
print('=== impostazioni proxy viste da httpx ===')
for n in ('HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY',
          'http_proxy', 'https_proxy', 'all_proxy', 'no_proxy'):
    v = os.environ.get(n)
    if v:
        print('  %-14s %s' % (n, v[:120]))
print('  (vuoto = nessun proxy configurato)')

# ---------- 3. una chiamata sola, con la traccia intera ----------
print()
print('=== una chiamata di prova ===')
if not os.environ.get('ANTHROPIC_API_KEY'):
    sys.exit('ANTHROPIC_API_KEY non e\' nell\'ambiente.')

try:
    import anthropic
except ImportError:
    sys.exit('manca il pacchetto: pip install anthropic')

try:
    c = anthropic.Anthropic()
    r = c.messages.create(
        model='claude-opus-5',
        max_tokens=32,
        messages=[{'role': 'user', 'content': 'Di soltanto: ok'}],
    )
    print('FUNZIONA. Risposta:', r.content[0].text.strip()[:60])
    print('La chiave e\' buona e la rete anche: il problema era altrove.')
except Exception:
    print('FALLITA. Traccia completa (l\'ultima riga dice il perche\'):')
    print()
    traceback.print_exc()
