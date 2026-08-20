# -*- coding: utf-8 -*-
"""Il server per lavorare: come quello di Python, ma senza memoria.

Due volte lo stesso equivoco. La prima erano due buchi nell'anta di Roma
-- gia' aggiustati -- che si vedevano ancora; la seconda i nove vetri di
Barletta che uscivano di legno. Nessuna delle due era un errore del
codice: era il browser che si teneva il vecchio js/porta3d.js e lo
serviva al posto di quello nuovo. Un file vecchio che non sa cosa sia il
vetro disegna legno, e ha ragione lui.

`python -m http.server` manda Last-Modified e lascia decidere al
browser, che sceglie di risparmiare un giro. Qui si dice invece a chiare
lettere: NON TENERE NIENTE. In sviluppo e' quel che serve -- si ricarica
e si vede quel che c'e' sul disco, non quel che c'era mezz'ora fa.

    python tools/servi.py [porta]
"""
import sys, os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class SenzaMemoria(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        SimpleHTTPRequestHandler.end_headers(self)
    def log_message(self, fmt, *a):
        if '" 200' not in (fmt % a):        # gli errori si', il traffico no
            SimpleHTTPRequestHandler.log_message(self, fmt, *a)

porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8140
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
print('http://localhost:%d/  --  senza cache, Ctrl+C per fermare' % porta)
ThreadingHTTPServer(('127.0.0.1', porta), SenzaMemoria).serve_forever()
