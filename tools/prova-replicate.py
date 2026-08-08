# -*- coding: utf-8 -*-
"""
PROVA: Replicate puo' migliorare materiali e luce SENZA cambiare la porta?

Non basta guardare le immagini e dire "questa e' piu' bella". Un render
che abbellisce ma sposta un riquadro o cambia la griglia del vetro fa un
danno che l'estetica non ripaga: la scheda che mostriamo al cliente non
sarebbe piu' il prodotto.

Quindi la prova misura DUE cose:

  1. com'e' venuta      -> le immagini, da guardare
  2. se e' ancora quella porta -> si rilegge il risultato con la STESSA
     scheda che usa l'accoppiatore e si confronta campo per campo con
     l'originale. Se cambia un campo, il render ha mentito sul prodotto.

USO
    set REPLICATE_API_TOKEN=r8_...
    set ANTHROPIC_API_KEY=sk-ant-...
    python tools/prova-replicate.py

Costo: 3 immagini Kontext (~0,04 $ l'una) + 6 letture. Pochi centesimi.
"""

import base64
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUORI = os.path.join(REPO, 'tools', '_prova_replicate')
os.makedirs(FUORI, exist_ok=True)

PORTE = ['venezia', 'liverpool', 'emilia']

# Il prompt e' scritto per NON dare licenza creativa: si chiede solo il
# materiale e la luce, e si vieta esplicitamente di toccare il disegno.
# Se anche cosi' il disegno cambia, la strada non regge.
PROMPT = (
    'Photorealistic product photo of this exact interior door. '
    'Improve only the material and the lighting: realistic oak wood grain '
    'with visible pores and natural colour variation, soft studio lighting '
    'with gentle shadows, clear glass. '
    'Keep the door geometry absolutely identical: same number of panels, '
    'same panel layout and proportions, same glazing bar grid, same frame '
    'profile, same handle position. Do not add, remove or move any panel, '
    'bar or moulding. Same camera angle, same framing. Plain light '
    'background.'
)

TOKEN = os.environ.get('REPLICATE_API_TOKEN')
CHIAVE = os.environ.get('ANTHROPIC_API_KEY')
if not TOKEN:
    sys.exit('Manca REPLICATE_API_TOKEN nell\'ambiente.')
if not CHIAVE:
    sys.exit('Manca ANTHROPIC_API_KEY nell\'ambiente.')


# ---------------------------------------------------------------- Replicate

def chiama_replicate(percorso_img):
    """Manda l'immagine a Kontext e torna i byte del risultato."""
    dati = base64.b64encode(open(percorso_img, 'rb').read()).decode()
    corpo = {
        'input': {
            'prompt': PROMPT,
            'input_image': 'data:image/jpeg;base64,' + dati,
            'aspect_ratio': 'match_input_image',
            'output_format': 'png',
            'safety_tolerance': 2,
        },
    }
    req = urllib.request.Request(
        'https://api.replicate.com/v1/models/black-forest-labs/'
        'flux-kontext-pro/predictions',
        data=json.dumps(corpo).encode(),
        headers={'Authorization': 'Bearer ' + TOKEN,
                 'Content-Type': 'application/json',
                 'Prefer': 'wait'})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=180))
    except urllib.error.HTTPError as e:
        sys.exit('Replicate ha risposto %s: %s' % (e.code, e.read()[:400]))

    # con Prefer: wait di solito e' gia' pronta; se no si aspetta
    for _ in range(60):
        if r.get('status') in ('succeeded', 'failed', 'canceled'):
            break
        time.sleep(3)
        r = json.load(urllib.request.urlopen(urllib.request.Request(
            r['urls']['get'], headers={'Authorization': 'Bearer ' + TOKEN})))

    if r.get('status') != 'succeeded':
        return None, r.get('error') or r.get('status')

    uscita = r['output']
    if isinstance(uscita, list):
        uscita = uscita[0]
    return urllib.request.urlopen(uscita, timeout=120).read(), None


# ---------------------------------------------------------------- la scheda

VIETATI = {'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
           'multipleOf', 'minLength', 'maxLength', 'minItems', 'maxItems',
           'uniqueItems', 'pattern'}


def ripulisci(n):
    if isinstance(n, list):
        return [ripulisci(x) for x in n]
    if isinstance(n, dict):
        return {k: ripulisci(v) for k, v in n.items()
                if k not in VIETATI and not k.startswith('_')}
    return n


SCHEMA = ripulisci(json.load(io.open(
    os.path.join(REPO, 'tools', 'mappa-schema.json'), encoding='utf8')))

ISTRUZIONI = (
    "Guardi l'immagine di una porta interna e ne compili la scheda. "
    "Descrivi SOLO quello che vedi davvero: non dedurre, non completare "
    "con quello che di solito hanno le porte.\n"
    "Guarda con attenzione: testa (dritta o ad arco), "
    "riquadri_disposizione, riquadri_numero, e quanto vetro c'e'."
)


def leggi_scheda(byte_img, tipo):
    corpo = {
        'model': 'claude-opus-5',
        'max_tokens': 3000,
        'output_config': {'format': {'type': 'json_schema', 'schema': SCHEMA}},
        'messages': [{
            'role': 'user',
            'content': [
                {'type': 'image',
                 'source': {'type': 'base64', 'media_type': tipo,
                            'data': base64.b64encode(byte_img).decode()}},
                {'type': 'text', 'text': ISTRUZIONI},
            ],
        }],
    }
    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=json.dumps(corpo).encode(),
        headers={'x-api-key': CHIAVE,
                 'anthropic-version': '2023-06-01',
                 'Content-Type': 'application/json'})
    r = json.load(urllib.request.urlopen(req, timeout=180))
    if r.get('stop_reason') == 'refusal':
        return None
    for b in r['content']:
        if b['type'] == 'text':
            return json.loads(b['text'])
    return None


# I campi che decidono l'accoppiamento: se cambiano questi, la porta
# mostrata non e' piu' quella del catalogo.
CHE_CONTANO = ['vetro', 'testa', 'riquadri_numero', 'riquadri_disposizione',
               'riquadri_forma', 'superficie', 'traversa', 'modanatura',
               'vetro_griglia', 'vetro_griglia_colonne', 'vetro_griglia_righe',
               'vetro_lastre']


def main():
    print('Porte da provare:', ', '.join(PORTE))
    print('')
    totale_cambi = 0
    totale_campi = 0

    for mid in PORTE:
        orig = os.path.join(REPO, 'assets', 'modelli', mid + '.webp')
        if not os.path.exists(orig):
            print(mid, '-> manca', orig)
            continue

        # Kontext vuole jpeg/png: si converte il webp
        from PIL import Image
        im = Image.open(orig).convert('RGB')
        jpg = os.path.join(FUORI, mid + '_prima.jpg')
        im.save(jpg, 'JPEG', quality=95)

        print('=== %s ===' % mid)
        print('  chiamo Replicate...')
        byte_out, errore = chiama_replicate(jpg)
        if errore:
            print('  FALLITA:', errore)
            continue
        dopo = os.path.join(FUORI, mid + '_dopo.png')
        open(dopo, 'wb').write(byte_out)
        print('  risultato scritto:', dopo)

        print('  rileggo le due schede...')
        a = leggi_scheda(open(jpg, 'rb').read(), 'image/jpeg')
        b = leggi_scheda(byte_out, 'image/png')
        if not a or not b:
            print('  lettura non riuscita')
            continue

        cambiati = []
        for c in CHE_CONTANO:
            totale_campi += 1
            if a.get(c) != b.get(c):
                cambiati.append('%s: %s -> %s' % (c, a.get(c), b.get(c)))
        totale_cambi += len(cambiati)

        if cambiati:
            print('  LA PORTA E\' CAMBIATA in %d campi su %d:'
                  % (len(cambiati), len(CHE_CONTANO)))
            for c in cambiati:
                print('     ', c)
        else:
            print('  disegno intatto: nessuno dei %d campi e\' cambiato'
                  % len(CHE_CONTANO))
        print('')

    print('=== IN TOTALE ===')
    if totale_campi:
        print('  campi cambiati: %d su %d (%.0f%%)'
              % (totale_cambi, totale_campi, 100.0 * totale_cambi / totale_campi))
    print('  immagini in:', FUORI)
    print('')
    print('  Guarda le immagini _prima/_dopo per l\'estetica,')
    print('  e i campi cambiati per sapere se e\' ancora il tuo prodotto.')


if __name__ == '__main__':
    main()
