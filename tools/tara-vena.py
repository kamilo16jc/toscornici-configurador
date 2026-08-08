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
40% la vena si vede e il riquadro si legge. Da li' viene VENA.

COSA FA
Salva l'originale una volta sola come albedo-originale.jpg e riscrive
albedo.jpg smorzato. E' idempotente e reversibile: rilanciarlo riparte
sempre dall'originale, e per tornare indietro basta VENA = 1.0.

USO
    python tools/tara-vena.py           # applica VENA
    python tools/tara-vena.py 1.0       # torna com'era
"""

import os
import shutil
import sys

from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(REPO, 'assets', 'textures')

# Quanto della vena resta. 1 = originale, 0 = tinta piatta.
VENA = 0.40

# I laccati usano 'universal', che e' gia' quasi piatto: non si tocca.
ESSENZE = ['rovere', 'castagno', 'toulipier', 'pino']


def tara(essenza, forza):
    cartella = os.path.join(BASE, essenza)
    vivo = os.path.join(cartella, 'albedo.jpg')
    orig = os.path.join(cartella, 'albedo-originale.jpg')
    if not os.path.exists(vivo) and not os.path.exists(orig):
        return '%-11s manca albedo.jpg' % essenza
    # la prima volta si mette da parte l'originale
    if not os.path.exists(orig):
        shutil.copy2(vivo, orig)

    im = Image.open(orig).convert('RGB')
    # il colore medio, che e' il punto verso cui si smorza
    medio = im.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    piatta = Image.new('RGB', im.size, medio)
    fuori = Image.blend(piatta, im, forza)
    fuori.save(vivo, 'JPEG', quality=92, subsampling=0)
    return ('%-11s medio %-14s vena al %d%%  (%d KB)'
            % (essenza, str(medio), round(forza * 100),
               os.path.getsize(vivo) // 1024))


def main():
    forza = float(sys.argv[1]) if len(sys.argv) > 1 else VENA
    if not 0 <= forza <= 1:
        sys.exit('La forza va fra 0 e 1.')
    print('Taro la vena al %d%%' % round(forza * 100))
    for e in ESSENZE:
        print('  ' + tara(e, forza))
    print('')
    print('  Gli originali restano in albedo-originale.jpg.')


if __name__ == '__main__':
    main()
