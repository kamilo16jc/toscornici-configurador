"""Servidor local que NO deja cachear.

    py tools/servir.py [puerto]

`python -m http.server` no manda cabeceras de caché, así que el navegador
decide por su cuenta y se queda con los módulos de `js/motor/` aunque cambien.
Eso no es una molestia menor: los módulos ES se importan unos a otros por ruta
relativa, sin `?v=`, así que si uno se queda viejo y otro nuevo la aplicación
ni arranca — sale un "does not provide an export named ..." y la página en
blanco.

En Vercel no pasa: cada despliegue sirve con su propio etag.
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class SinCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()


puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8137
print(f'http://localhost:{puerto}  (sin caché)')
ThreadingHTTPServer(('', puerto), partial(SinCache, directory='.')).serve_forever()
