# -*- coding: utf-8 -*-
"""
Ritaglia tutte le porte dal visore 3D: fondo trasparente, alta
definizione, una PNG per modello.

Non tocca niente dei modelli 3D. Apre il configuratore, spegne
l'interfaccia e il piano dell'ombra, e scatta il canvas -- che e' gia'
trasparente perche' il renderer nasce con alpha:true. La "parete" che si
vede a schermo non e' 3D: e' il fondo CSS della pagina, e basta
azzerarlo.

Il ritaglio e' esatto per costruzione: nessuno deve indovinare dove
finisce la porta, lo sa il canale alfa.

USO
    # serve il sito servito in locale, per esempio:
    python -m http.server 8140
    python tools/ritaglia-porte.py                 # tutte
    python tools/ritaglia-porte.py venezia emilia  # solo alcune

Esce in:  C:\\Toscocornici\\recortes-3d\\<id>.png
"""

import io
import os
import re
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUORI = os.path.join(REPO, 'recortes-3d')
PORTA = 'http://localhost:8140'

# Quanto grande scattare. 3x su 1400 px di viewport da una porta intorno
# ai 2300 px di altezza: abbastanza per qualunque uso a stampa o per
# darla in pasto a un generatore di immagini.
SCALA = 3
MARGINE = 0.03          # aria attorno alla porta, in frazione del lato

# Spegne il piano dell'ombra (due triangoli) e rende trasparente il
# fondo del renderer. Telaio e anta restano: il prodotto e' quello.
SPOGLIA = """() => {
  const d = window.__dbg;
  let spenti = 0;
  d.scene.children.forEach(o => {
    if (o.isMesh && o.geometry.attributes.position.count <= 6) {
      o.visible = false; spenti++;
    }
  });
  d.scene.background = null;
  d.renderer.setClearAlpha(0);
  return spenti;
}"""

# Inquadratura frontale pura, calcolata dal campo visivo vero: la porta
# ci deve stare tutta, con lo stesso criterio per tutti i modelli.
POSA = """() => {
  const d = window.__dbg, s = d.size, c = d.center;
  const fov = d.camera.fov * Math.PI / 180;
  const dV = (s.y / 2) / Math.tan(fov / 2);
  const dH = (s.x / 2) / (Math.tan(fov / 2) * d.camera.aspect);
  const dist = Math.max(dV, dH) * 1.06;
  d.camera.position.set(c.x, c.y, c.z + dist);
  d.camera.lookAt(c.x, c.y, c.z);
  d.camera.updateProjectionMatrix();
  d.renderer.render(d.scene, d.camera);
}"""

STILE = """
  .viewer-brand,.viewer-caption,.viewer-hint,.door-btn,.loader,
  .panel,.topbar,header,footer{display:none!important}
  html,body,#viewer,.viewer,main{background:transparent!important}
  #viewer{width:100vw!important;height:100vh!important}
"""


def elenco_modelli():
    src = io.open(os.path.join(REPO, 'js', 'catalogo.js'), encoding='utf-8').read()
    return re.findall(r'^\s{2}"?([a-z0-9_]+)"?:\s*\{', src, re.M)


def rifinisci(percorso):
    """Toglie il velo di alfa quasi-zero e ritaglia sul contenuto."""
    im = Image.open(percorso).convert('RGBA')
    a = im.getchannel('A')
    # sotto 10 su 255 e' invisibile ma sporca il riquadro: si azzera
    a = a.point(lambda v: 0 if v < 10 else v)
    im.putalpha(a)
    bb = a.point(lambda v: 255 if v > 40 else 0).getbbox()
    if not bb:
        return None
    mx = int((bb[2] - bb[0]) * MARGINE)
    my = int((bb[3] - bb[1]) * MARGINE)
    bb = (max(0, bb[0] - mx), max(0, bb[1] - my),
          min(im.width, bb[2] + mx), min(im.height, bb[3] + my))
    im = im.crop(bb)
    im.save(percorso, 'PNG', optimize=True)
    return im.size


def main():
    os.makedirs(FUORI, exist_ok=True)
    voluti = [x.lower() for x in sys.argv[1:]]
    modelli = elenco_modelli()
    if voluti:
        modelli = [m for m in modelli if m in voluti]
    if not modelli:
        sys.exit('Nessun modello da ritagliare (catalogo.js letto male?)')

    print('Porte da ritagliare: %d' % len(modelli))
    print('Esco in: %s' % FUORI)
    print('')

    fatti, falliti = [], []
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-gl=angle', '--enable-unsafe-swiftshader'])
        pg = b.new_page(viewport={'width': 900, 'height': 1400},
                        device_scale_factor=SCALA)
        pg.goto('%s/configuratore.html?modello=%s' % (PORTA, modelli[0]),
                wait_until='networkidle')
        pg.wait_for_selector('#loader.is-hidden', timeout=120000)
        pg.add_style_tag(content=STILE)
        pg.wait_for_timeout(1200)

        for i, mid in enumerate(modelli, 1):
            try:
                pg.evaluate('(id) => window.__dbg.setModello(id)', mid)
                pg.wait_for_function(
                    "() => document.getElementById('loader').classList.contains('is-hidden')",
                    timeout=120000)
                pg.wait_for_timeout(1100)
                pg.evaluate(SPOGLIA)
                pg.evaluate(POSA)
                pg.wait_for_timeout(250)
                f = os.path.join(FUORI, mid + '.png')
                pg.locator('#viewer canvas').screenshot(path=f, omit_background=True)
                dim = rifinisci(f)
                if not dim:
                    raise RuntimeError('immagine vuota')
                kb = os.path.getsize(f) // 1024
                print('  %2d/%d  %-14s %4d x %4d  %5d KB'
                      % (i, len(modelli), mid, dim[0], dim[1], kb))
                fatti.append(mid)
            except Exception as e:                      # noqa: BLE001
                print('  %2d/%d  %-14s FALLITA: %s'
                      % (i, len(modelli), mid, str(e)[:80]))
                falliti.append(mid)
        b.close()

    print('')
    print('Fatte %d, fallite %d' % (len(fatti), len(falliti)))
    if falliti:
        print('  da rifare: python tools/ritaglia-porte.py %s' % ' '.join(falliti))
    peso = sum(os.path.getsize(os.path.join(FUORI, f))
               for f in os.listdir(FUORI) if f.endswith('.png'))
    print('Peso totale: %.1f MB' % (peso / 1024 / 1024))


if __name__ == '__main__':
    main()
