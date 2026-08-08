# -*- coding: utf-8 -*-
"""
Prepara le texture del legno: colore, luce e forza della vena.

PERCHE'
Le quattro foto d'essenza sono piallacci fotografati in condizioni
diverse, e come stanno non sono materiali: sono immagini. Il pino era
arancione e col rosso bruciato, il toulipier cosi' chiaro e piatto da
sembrare una lastra luminosa. Qui si portano tutte a valori misurabili.

I DUE BERSAGLI

1. Il colore. Si confronta con l'aspetto vero del legno:
       pino chiaro   tinta 38-42 gradi, saturazione 0.25-0.35
       toulipier     tinta 40-50 gradi, saturazione 0.15-0.25
   Il pino stava a 29 gradi con saturazione 0.63 -- il doppio del vero,
   ed e' quello che lo faceva arancione. Con luce 0.93 aveva anche il
   14.5% dei pixel col rosso a fondo scala: li' la vena non e' scura,
   e' proprio cancellata, e nessun ritocco la riporta indietro. Si puo'
   solo togliere il rosso di troppo e lasciare che la vena venga dal
   verde e dal blu, che non sono bruciati.

2. Il contrasto. Non una frazione uguale per tutte -- quello era
   l'errore della prima versione -- ma un LIVELLO. 10.5 e' lo scarto a
   cui il rovere, misurato su Country, mostrava la vena senza coprire
   lo spigolo del riquadro. Chi sta sopra si smorza, chi sta sotto si
   allarga: il toulipier a 8.1 era troppo piatto, non troppo forte.

Rovere e castagno non si toccano nel colore: vanno gia' bene.

COSA FA
Salva l'originale una volta sola come albedo-originale.jpg e riscrive
albedo.jpg. E' idempotente: rilanciarlo riparte sempre dall'originale.

USO
    python tools/tara-vena.py           # applica la tabella
    python tools/tara-vena.py 13        # vena piu' marcata per tutte
    python tools/tara-vena.py --crudo   # rimette gli originali
"""

import colorsys
import os
import shutil
import sys

from PIL import Image, ImageStat

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(REPO, 'assets', 'textures')

# Lo scarto quadratico a cui portare la vena di ogni essenza.
BERSAGLIO = 10.5

# Correzione di colore, per essenza. 'tinta' e' in gradi da sommare,
# 'saturazione' e 'luce' sono moltiplicatori. Assente = non si tocca.
CORREZIONI = {
    'rovere': {},
    'castagno': {},
    # 29 -> 40 gradi, saturazione 0.63 -> ~0.30, e giu' la luce per
    # togliere il rosso da fondo scala
    'pino': {'tinta': 11, 'saturazione': 0.48, 'luce': 0.88},
    # la tinta va bene; era troppo chiaro e troppo carico
    'toulipier': {'saturazione': 0.60, 'luce': 0.90},
}

ESSENZE = ['rovere', 'castagno', 'toulipier', 'pino']


def misura(im):
    r, g, b = im.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return h * 360, s, v, ImageStat.Stat(im.convert('L')).stddev[0]


def bruciato(im):
    """Percentuale di pixel col rosso a fondo scala."""
    h = im.split()[0].histogram()
    return 100.0 * sum(h[250:]) / (im.width * im.height)


def correggi_colore(im, c):
    if not c:
        return im
    hsv = im.convert('HSV')
    H, S, V = hsv.split()
    if c.get('tinta'):
        passo = round(c['tinta'] * 255 / 360)      # HSV di PIL sta su 0-255
        H = H.point(lambda v: (v + passo) % 256)
    if c.get('saturazione'):
        S = S.point(lambda v: min(255, round(v * c['saturazione'])))
    if c.get('luce'):
        V = V.point(lambda v: min(255, round(v * c['luce'])))
    return Image.merge('HSV', (H, S, V)).convert('RGB')


def tara_contrasto(im, bersaglio):
    """Porta lo scarto al bersaglio, in su o in giu'.

    Smorzare verso il colore medio scala lo scarto in modo lineare, e
    Image.blend accetta anche pesi sopra 1: la stessa formula serve sia
    ad attenuare una vena troppo forte sia ad aprirne una troppo piatta.
    """
    scarto = ImageStat.Stat(im.convert('L')).stddev[0]
    if scarto < 0.5:
        return im, 1.0
    forza = bersaglio / scarto
    medio = im.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    piatta = Image.new('RGB', im.size, medio)
    return Image.blend(piatta, im, forza), forza


def prepara(essenza, bersaglio, crudo=False):
    cartella = os.path.join(BASE, essenza)
    vivo = os.path.join(cartella, 'albedo.jpg')
    orig = os.path.join(cartella, 'albedo-originale.jpg')
    if not os.path.exists(vivo) and not os.path.exists(orig):
        return '%-11s manca albedo.jpg' % essenza
    if not os.path.exists(orig):
        shutil.copy2(vivo, orig)

    im = Image.open(orig).convert('RGB')
    if crudo:
        shutil.copy2(orig, vivo)
        h, s, v, sc = misura(im)
        return ('%-11s rimesso l\'originale  tinta %3.0f  sat %.2f  '
                'luce %.2f  scarto %4.1f' % (essenza, h, s, v, sc))

    h0, s0, v0, sc0 = misura(im)
    br0 = bruciato(im)
    im = correggi_colore(im, CORREZIONI.get(essenza))
    im, forza = tara_contrasto(im, bersaglio)
    im.save(vivo, 'JPEG', quality=92, subsampling=0)

    fin = Image.open(vivo).convert('RGB')
    h1, s1, v1, sc1 = misura(fin)
    br1 = bruciato(fin)
    riga = ('%-11s tinta %3.0f->%3.0f  sat %.2f->%.2f  luce %.2f->%.2f  '
            'scarto %4.1f->%4.1f  (vena al %d%%)'
            % (essenza, h0, h1, s0, s1, v0, v1, sc0, sc1, round(forza * 100)))
    if br0 > 1 or br1 > 1:
        riga += '\n              rosso bruciato %.1f%% -> %.1f%%' % (br0, br1)
    return riga


def main():
    crudo = '--crudo' in sys.argv
    resto = [a for a in sys.argv[1:] if not a.startswith('--')]
    bersaglio = float(resto[0]) if resto else BERSAGLIO
    print('Rimetto gli originali.' if crudo
          else 'Coloro e porto ogni essenza a uno scarto di %.1f' % bersaglio)
    for e in ESSENZE:
        print('  ' + prepara(e, bersaglio, crudo))
    print('')
    print('  Gli originali restano in albedo-originale.jpg.')


if __name__ == '__main__':
    main()
