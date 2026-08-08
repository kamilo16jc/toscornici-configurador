# -*- coding: utf-8 -*-
"""
Prepara le texture del legno perche' la resa 3D somigli al campione.

IL BERSAGLIO
I campioni d'essenza del sito -- quelli che il cliente guarda per
scegliere -- sono la STESSA foto delle texture: misurati, coincidono.
Quindi il bersaglio non e' "il legno vero" preso da una tabella, e' il
campione. Quello che il cliente sceglie e quello che vede girare nel
visore devono essere la stessa cosa.

PROVATO E SCARTATO: correggere il colore delle texture. Il pino sembrava
troppo arancione e l'avevo portato da 29 a 40 gradi di tinta, verso il
giallo dei pini veri. Sbagliato: il campione del catalogo E' a 29 gradi
con saturazione 0.63. Il pino arancione e' il pino che si vende, e
"correggerlo" faceva mentire il 3D sul prodotto.

QUELLO CHE SI COMPENSA E' IL MOTORE
Misurando la superficie resa contro il campione, a esposizione 1.0 la
resa usciva piu' chiara di 0.14 su tutte e quattro. Sui legni scuri non
si vede; sui due chiari li schiacciava contro il bianco, e li' la vena
sparisce -- il pino perdeva meta' del contrasto e il toulipier sembrava
una lastra luminosa. L'esposizione e' scesa a 0.80 in app.js, e qui
restano le due correzioni che l'esposizione da sola non copre.

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

# Lo scarto quadratico a cui portare la vena. Non una frazione uguale
# per tutte -- le quattro foto partono da 8 a 26 di scarto -- ma un
# livello: 10.5 e' quello a cui il rovere, misurato su Country, mostra
# la vena senza coprire lo spigolo dei riquadri.
BERSAGLIO = 10.5

# Quanto alzare il contrasto della texture perche' quello RESO finisca
# sul bersaglio. Misurato a esposizione 0.80, con le texture gia' a
# 10.5, sullo schermo arrivavano: rovere 8.3, castagno 8.8,
# toulipier 11.4, pino 6.0. Il rovere e' il riferimento -- e' quello che
# va bene a vederlo -- e gli altri si portano li'.
COMPENSA = {
    'rovere': 1.0,
    'castagno': 1.0,
    # sceso da 0.80 a 0.71 quando gli si e' abbassata la luce: staccarlo
    # dal soffitto gli fa guadagnare contrasto da solo (10.3 -> 11.6), e
    # senza questo si sarebbe mosso anche l'aspetto della vena, che non
    # era quello che si voleva cambiare
    'toulipier': 0.71,
    'pino': 1.20,
}

# Il pino ha un guaio che il contrasto da solo non risolve: parte a luce
# 0.93 col 14.5% dei pixel col rosso a fondo scala, e sullo schermo
# arriva a 0.96 contro lo 0.92 del campione. Li' la vena non ha piu'
# spazio verso l'alto, ed e' per questo che non si vedeva. Alzargli il
# contrasto la bruciava ancora di piu' (18.6%): la strada e' abbassare
# la luce, che lo stacca dal soffitto E lo avvicina al campione invece
# di allontanarlo. Nessun colore inventato: si compensa il motore.
# Il toulipier ha lo stesso guaio in piccolo: rendeva a 0.88 contro lo
# 0.79 del campione, lo scarto piu' largo delle quattro, e a vederlo
# restava una lastra chiara. Provati quattro valori e misurati: 0.90 lo
# fa cadere esatto sul campione (0.79, scarto 0.00), sotto diventa piu'
# scuro del legno vero.
LUCE = {'pino': 0.88, 'toulipier': 0.90}

ESSENZE = ['rovere', 'castagno', 'toulipier', 'pino']


def misura(im):
    r, g, b = im.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return h * 360, s, v, ImageStat.Stat(im.convert('L')).stddev[0]


def bruciato(im):
    """Percentuale di pixel col rosso a fondo scala."""
    h = im.split()[0].histogram()
    return 100.0 * sum(h[250:]) / (im.width * im.height)


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

    if essenza in LUCE:
        H, Sa, V = im.convert('HSV').split()
        V = V.point(lambda v: min(255, round(v * LUCE[essenza])))
        im = Image.merge('HSV', (H, Sa, V)).convert('RGB')

    im, forza = tara_contrasto(im, bersaglio * COMPENSA.get(essenza, 1.0))
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
          else 'Porto la vena di ogni essenza a uno scarto di %.1f' % bersaglio)
    for e in ESSENZE:
        print('  ' + prepara(e, bersaglio, crudo))
    print('')
    print('  Gli originali restano in albedo-originale.jpg.')


if __name__ == '__main__':
    main()
