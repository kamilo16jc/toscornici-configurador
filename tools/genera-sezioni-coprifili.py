# -*- coding: utf-8 -*-
"""
Disegna la SEZIONE di ogni coprifilo, per le miniature del configuratore.

    python tools/genera-sezioni-coprifili.py

Perche' non le fotografie. Le foto di listino sono rendering in prospettiva:
belle, ma raccontano il materiale piu' che la forma, e soprattutto NON sanno
niente della geometria che si monta davvero. Il Tintoretto e il Raffaello sono
rimasti a lungo con il profilo da 90 incrociato senza che si vedesse, perche'
la fotina accanto continuava a mostrare il pezzo giusto.

Queste immagini escono dallo STESSO json che il motore estrude. Se un profilo
sbaglia, la miniatura sbaglia con lui, e si vede subito. Sono un controllo,
non solo una decorazione.

Tutte in scala fra loro: un coprifilo da 100 si vede piu' largo di uno da 69,
che e' un'informazione che il cliente sta comprando.

Le immagini vanno in assets/coprifili/sezioni/. Le fotografie restano dove
sono: non si cancella niente, e tornare indietro e' cambiare un percorso.
"""

import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
SEZIONI = os.path.join(RAIZ, "assets", "catalogo", "coprifili")
DESTINO = os.path.join(RAIZ, "assets", "coprifili", "sezioni")

# id del listino -> disegno che va sulla FACCIA DELLA PORTA.
# E' lo stesso che sceglie dibujosDe() nel motore: in un pacco 90/70 il 90 sta
# davanti, ed e' quello che il cliente vede entrando.
PROFILI = {
    "listellare": "listellare-l70",
    "massello": "listellare-l70",      # stessa forma, cambia il legno
    "pierre": "pierre-p70",
    "tintoretto": "tintoretto-t90",
    "raffaello": "raffaello-r90",
    "giotto": "giotto-g90",
    "leonardo": "leonardo-e90",
    "michelangelo": "michelangelo-h90",
    "cartesio": "cartesio-c100",
    "caravaggio": "caravaggio-v90",
    "tiziano": "tiziano-z90",
    "canaletto": "canaletto-n90",
    # 'novecento' non ha sezione tracciata: tiene la sua fotografia.
}

# Il riquadro di disegno e' in MILLIMETRI ed e' lo stesso per tutti: cosi' le
# sezioni si possono confrontare a occhio, e un coprifilo da 100 si vede piu'
# largo di uno da 69. 108 mm coprono il piu' largo (Cartesio, 100) e 46 il piu'
# alto (Michelangelo, 40) con un filo di margine.
#
# Non e' 3:2 come la tessera. La tessera lo e', e con object-fit:contain
# l'immagine ci sta dentro comunque; se il riquadro fosse 3:2 la sezione —
# che e' larga e bassa — resterebbe minuscola in mezzo a tutto quel bianco.
LARGO_MM = 108.0
ALTO_MM = 46.0

LEGNO = "#e6cda6"
BORDO = "#9c7f59"
PX = 660          # larghezza del png


def dibuja(slug, salida):
    with open(os.path.join(SEZIONI, slug + ".json"), encoding="utf-8") as f:
        d = json.load(f)
    pts = d["punti"]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    cx = (min(xs) + max(xs)) / 2
    cy = (min(ys) + max(ys)) / 2

    fig = plt.figure(figsize=(LARGO_MM / 25.4, ALTO_MM / 25.4), dpi=PX / (LARGO_MM / 25.4))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(cx - LARGO_MM / 2, cx + LARGO_MM / 2)
    ax.set_ylim(cy - ALTO_MM / 2, cy + ALTO_MM / 2)
    ax.set_aspect("equal")
    ax.axis("off")

    cerrado = pts + [pts[0]]
    ax.fill([p[0] for p in cerrado], [p[1] for p in cerrado],
            facecolor=LEGNO, edgecolor=BORDO, linewidth=1.6,
            joinstyle="round")
    fig.savefig(salida, transparent=True)
    plt.close(fig)
    return d["larghezza"], d["spessore"]


def main():
    os.makedirs(DESTINO, exist_ok=True)
    print("Sezioni in scala, riquadro di %.0f x %.0f mm\n" % (LARGO_MM, ALTO_MM))
    for cid, slug in PROFILI.items():
        salida = os.path.join(DESTINO, cid + ".png")
        largh, spess = dibuja(slug, salida)
        print("  %-14s <- %-20s %5.0f x %4.1f mm" % (cid + ".png", slug, largh, spess))
    print("\n%d immagini in assets/coprifili/sezioni/" % len(PROFILI))


if __name__ == "__main__":
    main()
