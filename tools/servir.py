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
import base64
import pathlib
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

CAPTURAS = pathlib.Path('capturas')


class SinCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def do_POST(self):
        """POST /__captura?nombre=x  con el data URL en el cuerpo -> capturas/x.png

        Para poder MIRAR lo que se está pintando en vez de deducirlo de las
        cifras. Sin esto, comprobar un render es sacar el base64 del navegador
        a mano, y por eso se acaba dando por bueno lo que no se ha visto.
        Es una herramienta de desarrollo: no la sirve producción.
        """
        if not self.path.startswith('/__captura'):
            return self.send_error(404)
        cuerpo = self.rfile.read(int(self.headers.get('content-length', 0))).decode()
        datos = cuerpo.split(',', 1)[-1]
        nombre = 'captura'
        if '?' in self.path:
            for par in self.path.split('?', 1)[1].split('&'):
                if par.startswith('nombre='):
                    nombre = ''.join(c for c in par[7:] if c.isalnum() or c in '-_')
        CAPTURAS.mkdir(exist_ok=True)
        destino = CAPTURAS / f'{nombre}.png'
        destino.write_bytes(base64.b64decode(datos))
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(str(destino).encode())


puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8137
print(f'http://localhost:{puerto}  (sin caché)')
ThreadingHTTPServer(('', puerto), partial(SinCache, directory='.')).serve_forever()
