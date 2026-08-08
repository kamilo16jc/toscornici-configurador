# -*- coding: utf-8 -*-
# Scatta una foto frontale di ogni modello dal visore 3D del configuratore.
# Serve per costruire l'indice: le descrizioni del manuale non distinguono
# le porte (3 testi diversi su 44), i disegni si.
import io, json, os, re, sys
from playwright.sync_api import sync_playwright

REPO = r'C:/Users/Julic/OneDrive/Escritorio/Toscornici/configurador-3d'
OUT = r'C:/Users/Julic/AppData/Local/Temp/claude/C--Users-Julic-skyline-simulator/39fe196e-4b77-4955-98c1-e4fb115f5f3f/scratchpad/porte'
os.makedirs(OUT, exist_ok=True)

src = io.open(os.path.join(REPO, 'js/catalogo.js'), encoding='utf-8').read()
MOD = re.findall(r'^  "([a-z0-9_]+)": \{\n    "label": "(.*?)"', src, re.M)
solo = sys.argv[1:] or None
if solo:
    MOD = [m for m in MOD if m[0] in solo]
print('modelli da scattare:', len(MOD))

# inquadratura fissa: frontale, leggermente di tre quarti, uguale per tutti
POSA = """(id) => {
  const d = window.__dbg; if (!d) return 'no dbg';
  const s = d.size, c = d.center;
  // distanza calcolata dal FOV vero, non a occhio: la porta ci deve stare
  const fov = d.camera.fov * Math.PI / 180;
  const dV = (s.y / 2) / Math.tan(fov / 2);
  const dH = (s.x / 2) / (Math.tan(fov / 2) * d.camera.aspect);
  const dist = Math.max(dV, dH) * 1.18;
  d.camera.position.set(c.x + dist * 0.22, c.y, c.z + dist);
  d.camera.lookAt(c.x, c.y, c.z);
  d.camera.updateProjectionMatrix();
  d.renderer.render(d.scene, d.camera);
  return 'ok';
}"""

with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=angle', '--enable-unsafe-swiftshader'])
    # il pannello laterale prende 540 px fissi: la finestra deve essere larga
    pg = b.new_page(viewport={'width': 1560, 'height': 1020}, device_scale_factor=1)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    # la radice adesso e' la schermata d'ingresso, non il configuratore:
    # senza il percorso esplicito si aspetta un #loader che li' non esiste
    pg.goto('http://localhost:8137/configuratore.html?shot=1', wait_until='networkidle')
    pg.wait_for_selector('#loader.is-hidden', timeout=60000)
    # via l'interfaccia: nella foto deve restare solo la porta
    pg.add_style_tag(content='.viewer-brand,.viewer-caption,.viewer-hint,'
                             '.door-btn,.loader{display:none!important}')
    # ferma la rotazione automatica: un tocco basta (userMoved)
    box = pg.locator('#viewer canvas').bounding_box()
    pg.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
    pg.mouse.down(); pg.mouse.move(box['x'] + box['width']/2 + 1, box['y'] + box['height']/2)
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
            print('  timeout:', mid); continue
        pg.wait_for_timeout(700)                 # texture e materiali
        r = pg.evaluate(POSA, mid)
        pg.wait_for_timeout(160)
        path = os.path.join(OUT, mid + '.png')
        pg.screenshot(path=path, clip=box)
        fatti.append({'id': mid, 'label': label})
        print('  %-16s %s  %d KB' % (mid, r, os.path.getsize(path)//1024))

    json.dump(fatti, io.open(os.path.join(OUT, '_lista.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print('errori:', errs[:3] or 'nessuno')
    b.close()
