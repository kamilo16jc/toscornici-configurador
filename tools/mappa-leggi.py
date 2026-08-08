# -*- coding: utf-8 -*-
# Passo 2 della mappa profonda: leggere ogni render e riempire la scheda.
#
# Perche' una scheda a campi chiusi e non una descrizione a parole: le
# descrizioni non si confrontano, i campi si. La stessa scheda la riempira'
# poi la foto del cliente, e il confronto lo fara' il codice -- che e'
# verificabile, ripetibile e si puo' pesare campo per campo.
#
# LA CHIAVE NON STA QUI. Si legge da ANTHROPIC_API_KEY nell'ambiente:
#
#   Windows (PowerShell)   $env:ANTHROPIC_API_KEY = "sk-ant-..."
#   Windows (cmd)          set ANTHROPIC_API_KEY=sk-ant-...
#
# e poi:  python tools/mappa-leggi.py
#
# Ripartenza: quello che e' gia' letto non si rilegge. Se il processo cade
# a meta', si rilancia e riprende da dove era.
import base64
import io
import json
import os
import re
import sys
import time

try:
    import anthropic
except ImportError:
    sys.exit('manca il pacchetto: pip install anthropic')

REPO = r'C:/Toscocornici'
SCATTI = (r'C:/Users/Julic/AppData/Local/Temp/claude/'
          r'C--Users-Julic-skyline-simulator/'
          r'39fe196e-4b77-4955-98c1-e4fb115f5f3f/scratchpad/mappa')
USCITA = os.path.join(REPO, 'assets/catalogo-mappa.json')

if not os.environ.get('ANTHROPIC_API_KEY'):
    sys.exit('ANTHROPIC_API_KEY non e\' nell\'ambiente. Vedi le istruzioni in cima al file.')

# Vincoli che la salita strutturata NON accetta. Restano nel file dello
# schema, dove documentano l'intenzione e serviranno al confronto, ma vanno
# tolti da quello che si spedisce: l'API risponde 400.
NON_AMMESSI = ('minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
               'multipleOf', 'minLength', 'maxLength', 'minItems', 'maxItems',
               'uniqueItems', 'pattern')


def ripulisci(nodo):
    if isinstance(nodo, dict):
        return {k: ripulisci(v) for k, v in nodo.items()
                if k not in NON_AMMESSI and not k.startswith('_')}
    if isinstance(nodo, list):
        return [ripulisci(v) for v in nodo]
    return nodo


SCHEMA = ripulisci(json.load(
    io.open(os.path.join(REPO, 'tools/mappa-schema.json'), encoding='utf-8')))

ISTRUZIONI = """Guardi il render frontale di una porta interna in legno e ne compili la scheda.

Descrivi SOLO quello che vedi. Non dedurre lo stile, non indovinare il modello,
non completare con quello che di solito hanno le porte: se un campo non e'
leggibile nell'immagine, usa il valore che lo dichiara ('non_leggibile') invece
di scegliere il piu' probabile.

Due campi decidono piu' di tutti gli altri, guardali con attenzione:

- riquadri_disposizione: due riquadri uno SOPRA l'altro (divisione orizzontale)
  e due riquadri AFFIANCATI (divisione verticale) sono cose diverse. E' l'errore
  piu' facile e il piu' costoso.
- traversa: il regolo che divide i riquadri e' allineato alla superficie
  ('a_filo') o sporge in fuori facendo ombra ('in_rilievo')? Guarda l'ombra
  sotto al regolo: se ce n'e' una netta, sporge.
- riquadri_proporzione: con due riquadri sovrapposti, quale dei due e' piu'
  alto? Misura a occhio: sono porte che si distinguono SOLO per questo.
- vetro_bordo_alto: il bordo in cima al VETRO e' dritto o curvo? La porta e'
  sempre dritta, il vetro no: qui si chiede del vetro.
- vetro_griglia: una griglia a quadretti tutti uguali non e' la stessa cosa
  di un vetro grande al centro con altri piccoli intorno. Guarda le misure
  dei singoli vetri prima di scegliere.

Conta i riquadri sull'anta. Il telaio attorno alla porta non e' un riquadro, e
il vetro non e' un riquadro."""


def leggi(client, percorso):
    with open(percorso, 'rb') as f:
        dati = base64.standard_b64encode(f.read()).decode()
    r = client.messages.create(
        model='claude-opus-5',
        max_tokens=4000,
        output_config={'format': {'type': 'json_schema', 'schema': SCHEMA}},
        messages=[{
            'role': 'user',
            'content': [
                {'type': 'image',
                 'source': {'type': 'base64', 'media_type': 'image/png', 'data': dati}},
                {'type': 'text', 'text': ISTRUZIONI},
            ],
        }],
    )
    # con output_config la risposta puo' essere rifiutata: si controlla prima
    if r.stop_reason == 'refusal':
        raise RuntimeError('rifiutata: %s' % getattr(r.stop_details, 'category', '?'))
    testo = next(b.text for b in r.content if b.type == 'text')
    return json.loads(testo), r.usage


def main():
    src = io.open(os.path.join(REPO, 'js/catalogo.js'), encoding='utf-8').read()
    MOD = re.findall(r'^  "([a-z0-9_]+)": \{\n    "label": "(.*?)"', src, re.M)
    nomi = dict(MOD)

    fatto = {}
    if os.path.exists(USCITA):
        vecchio = json.load(io.open(USCITA, encoding='utf-8'))
        fatto = {m['id']: m for m in vecchio.get('modelli', [])}
        print('ripresa: gia\' letti', len(fatto))

    client = anthropic.Anthropic()
    tin = tout = 0
    for mid, label in MOD:
        if mid in fatto:
            continue
        scatto = os.path.join(SCATTI, mid + '.png')
        if not os.path.exists(scatto):
            print('  %-16s manca lo scatto' % mid)
            continue
        for tentativo in range(3):
            try:
                scheda, uso = leggi(client, scatto)
                break
            except Exception as e:
                if tentativo == 2:
                    print('  %-16s FALLITO: %s' % (mid, e))
                    scheda = None
                    break
                time.sleep(3 * (tentativo + 1))
        if scheda is None:
            continue
        tin += uso.input_tokens
        tout += uso.output_tokens
        scheda['id'] = mid
        scheda['nome'] = label
        fatto[mid] = scheda
        print('  %-16s %s / %s / %s riquadri' % (
            mid, scheda.get('vetro'), scheda.get('riquadri_disposizione'),
            scheda.get('riquadri_numero')))
        # si salva a ogni passo: se cade, non si perde niente
        json.dump({'_nota': 'Mappa profonda generata da tools/mappa-leggi.py. '
                            'Schema in tools/mappa-schema.json.',
                   'modelli': [fatto[k] for k, _ in MOD if k in fatto]},
                  io.open(USCITA, 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1)

    print()
    print('letti %d modelli su %d' % (len(fatto), len(MOD)))
    print('token: %d in, %d out' % (tin, tout))
    print('scritto in', USCITA)


if __name__ == '__main__':
    main()
