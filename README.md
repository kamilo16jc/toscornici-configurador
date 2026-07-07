# Toscornici — Configuratore 3D

Configurador 3D web multi-modelo — **California 100** y **Nebraska 400** — con precios del listino y visualización en tiempo real (Three.js).

## Cómo ejecutarlo

Necesita un servidor local (los módulos ES y el GLB no cargan con `file://`):

```
cd configurador-3d
python -m http.server 8137
```

Luego abrir <http://localhost:8137>. Requiere internet (Three.js y las fuentes cargan desde CDN).

## Qué hace

- **Modello:** 27 puertas en un menú desplegable agrupado por línea (13 de Linea 100, 14 de Linea Base). Cada modelo tiene su GLB, sus nodos 3D, su lista de componentes (4 o 6 según el modelo) y sus precios propios; los ambientes y el pivote de apertura se reconstruyen con las medidas de la puerta activa.
- **Catálogo generado automáticamente:** `js/catalogo.js` NO se edita a mano — lo produce `node tools/generate-catalog.mjs`, que cruza los GLB de `Assets doors\` (escanea los nombres de nodos reales de cada archivo) con las fichas .md de `manual-configurador\modelos\` (parsea las tablas de precios grezza/verniciata y valida que las filas sumen el total "PUERTA COMPLETA"). Para agregar una puerta nueva: soltar el GLB + su .md y volver a correr el generador.

- **Essenza:** 3 acabados con texturas PBR (albedo + normal + roughness + AO) — Pino Sbiancato, Pino Spazzolato, Toulipier. El cambio de textura es instantáneo sobre el modelo. El *Pino Sbiancato* es un albedo derivado del pino (desaturado + aclarado hacia blanco por código), compartiendo sus mapas de relieve; usa la columna de precios del Rovere.
- **Finitura:** Grezza / Verniciata, con los precios del listino 2026.
- **Componentes:** cada checkbox actualiza el precio y además muestra/oculta la geometría real del GLB:
  - Pannello porta → nodos `Puerta1` + `Puerta1_cristales`
  - Montanti per telaio → nodo `Puerta1_marco`
  - Anube e serratura → nodo `Puerta1_cerradura`
  - Coprifili → solo precio (no está modelado en el GLB)
- **Totale** en vivo con desglose; giro automático hasta que el usuario arrastra.
- **Ambiente:** además de la vista Galleria (limpia, por defecto), tres escenografías 3D construidas por código — Ingresso (entrada con cipreses y farolas), Soggiorno (sala con piso de madera, alfombra y lámpara) y Studio (pared verde, escritorio y estanterías). La puerta queda montada en un vano real de la pared; la cámara se limita para no salir de la habitación.
- **Apertura de la puerta:** botón "Apri la porta" o clic directo sobre la hoja — gira sobre sus bisagras (pivote calculado en el lado opuesto a la manija) con animación suave.
- **Maniglia:** tres acabados de herraje (Ottone, Nero opaco, Cromo) aplicados al nodo de la cerradura.
- **Preventivo en PDF:** el CTA abre un formulario (nombre, email, teléfono, dirección completa, cantidad, notas) y genera con jsPDF un documento A4 con marca, referencia única (TC-AAAAMMDD-XXXX), datos del cliente, configuración completa (modelo, essenza, finitura, maniglia, ambiente, cantidad), captura del render 3D, desglose de componentes con precios y totales. **El envío al fabricante es simulado** — conectar un backend de correo (p. ej. Resend) es la fase 2.

## Precios (California 100, EUR)

Todos reales, tomados del PNG del listino: columnas Rovere, Pino y Toulipier. (La textura del Toulipier viene del zip "Super Bianco Brillante", que estaba mal etiquetado — contiene madera clara, no blanco.)

## Notas técnicas

- El GLB original está en **milímetros**; `app.js` lo escala a metros al cargar.
- Las texturas originales (zips de 15–58 MB) se redimensionaron a 2048/1024 px JPEG en `assets/textures/`.
- Sin build: HTML + CSS + JS plano, Three.js 0.170 vía import map (jsDelivr).
