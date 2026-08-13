# -*- coding: utf-8 -*-
"""Ricopia js/dxf.js dentro porte3d.html.

La pagina si apre con due clic, quindi su file://, e li' un `import` da un
altro file e' bloccato (CORS, origine «null»): niente gira e il DXF
trascinato finisce stampato come testo. Percio' il lettore sta DENTRO alla
pagina. Questo script rifa' quella copia dopo ogni modifica a js/dxf.js."""
import io, re
l = io.open('js/dxf.js', encoding='utf8').read().replace('export function','function').replace('export const','const')
h = io.open('porte3d.html', encoding='utf8').read()
a = h.index('/* IL LETTORE E' QUI DENTRO')
b = h.index('const RUOLI = [')
io.open('porte3d.html','w',encoding='utf8').write(h[:a] + h[a:b].split('*/')[0] + '*/
' + l + '
' + h[b:])
print('rifatto: porte3d.html')
