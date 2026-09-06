/**
 * Utilidades de poligono que necesitan tanto el editor como las operaciones
 * booleanas. Viven aparte para que esos dos modulos no se importen entre si.
 */

/** Test punto-en-poligono por cruce de rayos. */
export function dentro([x, y], poligono) {
  let d = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [xi, yi] = poligono[i];
    const [xj, yj] = poligono[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}

/**
 * Area FIRMADA: positiva si el contorno gira en sentido antihorario.
 *
 * Vive aqui, y no en el lector de DXF, porque no tiene nada de DXF: es
 * geometria pura y la usan la extrusion y el desplazamiento. Estaba escrita
 * DOS VECES —una en dxf/topologia.js y otra privada dentro de offset.js—, que
 * es como empiezan las diferencias que nadie encuentra.
 */
export function areaFirmada(puntos) {
  let s = 0;
  for (let i = 0, n = puntos.length; i < n; i++) {
    const [x1, y1] = puntos[i];
    const [x2, y2] = puntos[(i + 1) % n];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

/** Area del poligono, siempre positiva. */
export function area(puntos) {
  let s = 0;
  for (let i = 0, n = puntos.length; i < n; i++) {
    const [x1, y1] = puntos[i];
    const [x2, y2] = puntos[(i + 1) % n];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s / 2);
}
