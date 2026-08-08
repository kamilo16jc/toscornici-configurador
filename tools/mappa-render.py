# -*- coding: utf-8 -*-
# Passo 1 del mappa profonda: uno scatto FRONTALE di ogni modello.
#
# Diverso da scatta-porte.py, che inquadra di tre quarti perche' serviva a
# un catalogo. Qui l'immagine deve far leggere il DISEGNO — quanti riquadri,
# come sono disposti, che proporzioni hanno — e di tre quarti le proporzioni
# mentono. Frontale secca, senza scorcio.
import io
import json
import os
import re
import sys

from playwright.sync_api import sync_playwright

REPO = r'C:/Toscocornici'
OUT = r'C:/Users/Julic/AppData/Local/Temp/claude/C--Users-Julic-skyline-simulator/39fe196e-4b77-4955-98c1-e4fb115f5f3f/scratchpad/mappa'
PORTA = int(os.environ.get('PORTA_HTTP', '8140'))
os.makedirs(OUT, exist_ok=True)

src = io.open(os.path.join(REPO, 'js/catalogo.js'), encoding='utf-8').read()
MOD = re.findall(r'^  "([a-z0-9_]+)": \{\n    "label": "(.*?)"', src, re.M)
solo = sys.argv[1:] or None
if solo:
    MOD = [m for m in MOD if m[0] in solo]
print('modelli da mappare:', len(MOD))

# Frontale pura: la camera sull'asse, nessuno scostamento laterale. Il
# margine 1.06 tiene la porta piena nel riquadro senza tagliarla.
POSA = """() => {
  const d = window.__dbg; if (!d) return 'no dbg';
  const s = d.size, c = d.center;
  const fov = d.camera.fov * Math.PI / 180;
  const dV = (s.y / 2) / Math.tan(fov / 2);
  const dH = (s.x / 2) / (Math.tan(fov / 2) * d.camera.aspect);
  const dist = Math.max(dV, dH) * 1.06;
  d.camera.position.set(c.x, c.y, c.z + dist);   // niente offset: frontale
  d.camera.lookAt(c.x, c.y, c.z);
  d.camera.updateProjectionMatrix();
  d.renderer.render(d.scene, d.camera);
  return 'ok';
}"""

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--enable-unsafe-swiftshader'])
    # il pannello di destra prende 540 px fissi: la finestra va larga, e
    # alta perche' la porta e' verticale
    pg = b.new_page(viewport={'width': 1500, 'height': 1080}, device_scale_factor=1.5)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('http://localhost:%d/configuratore.html?shot=1' % PORTA, wait_until='networkidle')
    pg.wait_for_function("!!document.querySelector('#loader.is-hidden')", timeout=60000)

    # via l'interfaccia: nello scatto deve restare solo la porta
    pg.add_style_tag(content='.viewer-brand,.viewer-caption,.viewer-hint,'
                             '.door-btn,.loader{display:none!important}')
    # un tocco ferma la rotazione automatica (userMoved)
    box = pg.locator('#viewer canvas').bounding_box()
    cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    pg.mouse.move(cx, cy)
    pg.mouse.down()
    pg.mouse.move(cx + 1, cy)
    pg.mouse.up()
    pg.wait_for_timeout(300)

    fatti = []
    for mid, label in MOD:
        pg.evaluate("(id) => window.__dbg.setModello(id)", mid)
        try:
            pg.wait_for_function(
                "(id) => document.getElementById('loader').classList.contains('is-hidden')"
                " && window.__dbg && window.__dbg.model", arg=mid, timeout=45000)
        except Exception:
            print('  timeout:', mid)
            continue
        pg.wait_for_timeout(700)          # texture e materiali
        r = pg.evaluate(POSA)
        pg.wait_for_timeout(160)
        path = os.path.join(OUT, mid + '.png')
        pg.screenshot(path=path, clip=box)
        fatti.append({'id': mid, 'label': label})
        print('  %-16s %s  %d KB' % (mid, r, os.path.getsize(path) // 1024))

    json.dump(fatti, io.open(os.path.join(OUT, '_lista.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print('errori:', errs[:3] or 'nessuno')
    b.close()

print('scatti in', OUT)
