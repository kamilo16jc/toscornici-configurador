# -*- coding: utf-8 -*-
"""
Tara la forza della vena nelle texture del legno.

PERCHE'
Le quattro texture d'essenza sono fotografie di piallacci a fiamma
larga: bellissime da vicino, ma su una porta il disegno e' cosi' grosso
e contrastato da coprire lo spigolo dei riquadri. E il riquadro non e'
un dettaglio estetico: e' il campo su cui si regge tutto
l'accoppiamento dell'assistente.

Misurato sul modello Country, smorzando l'albedo verso il suo colore
medio: al 100% lo spigolo sparisce, al 25% il legno torna piatto, al
40% la vena si vede e il riquadro si legge -- ed e' li' che il rovere
arriva a uno scarto di 10.5. Quello, non il 40%, e' il numero buono.

La prima versione smorzava tutte del 40% uguale, ed era sbagliata: le
quattro foto partono da contrasti diversissimi (rovere 26, toulipier 8),
cosi' il rovere veniva bene e le altre tre finivano piatte, con la stessa
aria di plastica che si voleva togliere. Adesso il bersaglio e' il
livello di contrasto, e la forza si calcola per ogni essenza.

COSA FA
Salva l'originale una volta sola come albedo-originale.jpg e riscrive
albedo.jpg smorzato. E' idempotente e reversibile: rilanciarlo riparte
sempre dall'originale, e un bersaglio altissimo le riporta com'erano.

USO
    python tools/tara-vena.py           # porta tutte a BERSAGLIO
    python tools/tara-vena.py 14        # vena piu' marcata
    python tools/tara-vena.py 999       # torna agli originali
"""

import os
import shutil
import sys

from PIL import Image, ImageStat

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(REPO, 'assets', 'textures')

# Il bersaglio NON e' una frazione uguale per tutte: e' un LIVELLO di
# contrasto. Le quattro foto partono da contrasti diversissimi -- il
# rovere ha lo scarto 26, il toulipier 8 -- e smorzarle tutte del 40%
# lasciava il rovere giusto e appiattiva le altre tre, che tornavano
# ad avere l'aria di plastica che si voleva togliere.
#
# 10.5 e' lo scarto a cui e' finito il rovere quando, misurando su
# Country, la vena si vedeva e lo spigolo del riquadro tornava a
# leggersi. Quello e' il livello buono, e ci si porta ogni essenza.
#
# Chi parte gia' sotto (il toulipier e' un legno chiaro e poco venato)
# si lascia com'e': la forza non sale mai sopra 1.
BERSAGLIO = 10.5

# I laccati usano 'universal', che e' gia' quasi piatto: non si tocca.
ESSENZE = ['rovere', 'castagno', 'toulipier', 'pino']


def tara(essenza, bersaglio):
    cartella = os.path.join(BASE, essenza)
    vivo = os.path.join(cartella, 'albedo.jpg')
    orig = os.path.join(cartella, 'albedo-originale.jpg')
    if not os.path.exists(vivo) and not os.path.exists(orig):
        return '%-11s manca albedo.jpg' % essenza
    # la prima volta si mette da parte l'originale
    if not os.path.exists(orig):
        shutil.copy2(vivo, orig)

    im = Image.open(orig).convert('RGB')
    partenza = ImageStat.Stat(im.convert('L')).stddev[0]
    # smorzare verso il colore medio scala lo scarto in modo lineare:
    # per arrivare al bersaglio basta il rapporto fra i due
    forza = 1.0 if partenza <= bersaglio else bersaglio / partenza

    medio = im.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    piatta = Image.new('RGB', im.size, medio)
    fuori = Image.blend(piatta, im, forza)
    fuori.save(vivo, 'JPEG', quality=92, subsampling=0)
    arrivo = ImageStat.Stat(Image.open(vivo).convert('L')).stddev[0]
    return ('%-11s scarto %5.1f -> %5.1f   vena al %3d%%%s'
            % (essenza, partenza, arrivo, round(forza * 100),
               '   (gia\' sotto il bersaglio: lasciata com\'e\')'
               if forza == 1.0 else ''))


def main():
    bersaglio = float(sys.argv[1]) if len(sys.argv) > 1 else BERSAGLIO
    print('Porto ogni essenza a uno scarto di %.1f' % bersaglio)
    for e in ESSENZE:
        print('  ' + tara(e, bersaglio))
    print('')
    print('  Gli originali restano in albedo-originale.jpg.')


if __name__ == '__main__':
    main()
