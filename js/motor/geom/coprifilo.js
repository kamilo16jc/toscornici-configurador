/**
 * El coprifilo: la moldura que remata contra la pared.
 *
 * Portado del motor de fabrica (js/porta3d.js del proyecto Toscocornici-3D),
 * con su razonamiento intacto, porque las dos partes delicadas no se adivinan.
 *
 * PRIMERA: como se orienta el perfil. Los DXF no estan dibujados todos igual
 * —en unos el pie cae a la derecha y en otros a la izquierda—, asi que hay que
 * MEDIR donde esta el dorso en vez de suponerlo.
 *
 * SEGUNDA: como se monta. No se extruyen tres piezas y se juntan de testa: un
 * perfil moldurado acostado de testa se ve enseguida que esta mal, y un
 * coprifilo va siempre a inglete. Se hace como la bugna del panel — es la misma
 * idea — recorriendo la seccion y tendiendo la superficie entre recorridos
 * metidos hacia dentro. Al meter hacia dentro un recorrido en angulo recto, las
 * esquinas se cortan a 45 solas.
 */

import * as THREE from 'three';

/**
 * Coloca el perfil en el convenio del montaje.
 *
 * Devuelve puntos [u, v] donde `u` es la distancia desde el filo hacia el vano
 * y `v` lo que sale fuera del muro.
 */
export function asentar(p, anchura) {
  // Los tramos horizontales, cota por cota.
  const tramos = new Map();
  for (let i = 0; i < p.length; i++) {
    const a = p[i];
    const b = p[(i + 1) % p.length];
    if (Math.abs(a[1] - b[1]) > 0.3) continue;
    const k = Math.round(((a[1] + b[1]) / 2) * 2) / 2;
    tramos.set(k, (tramos.get(k) || 0) + Math.abs(a[0] - b[0]));
  }

  /* EL DORSO ES LA COTA DE LA QUE ARRANCA EL PIE, y hay que buscarlo asi.
     Coger el tramo mas largo —que parece lo obvio— falla justo en el
     listellare: ese esta dibujado al reves que los demas, con la cara lisa
     abajo y las ranuras de estabilidad arriba, y el tramo mas largo es la cara
     vista. Montandolo asi las ranuras acababan a la vista sobre la pared, y un
     listellare no tiene ranuras a la vista: van detras, contra el muro, para
     que no se abarquille.
     El pie en cambio se reconoce siempre: es el unico saliente CORTO, esta en
     un solo extremo, y se dibuje como se dibuje dice donde cae el dorso. */
  let dorso = null;
  let minimo = 1e9;
  let masLargo = 0;
  let dorsoLargo = 0;

  for (const [y, largo] of tramos) {
    if (largo > masLargo) {
      masLargo = largo;
      dorsoLargo = y;
    }
    if (largo < anchura * 0.15) continue;
    for (const s of [1, -1]) {
      const alOtroLado = p.filter((q) => (q[1] - y) * s > 0.5);
      if (!alOtroLado.length) continue;
      const ancho =
        Math.max(...alOtroLado.map((q) => q[0])) - Math.min(...alOtroLado.map((q) => q[0]));
      if (ancho < anchura * 0.35 && ancho < minimo) {
        minimo = ancho;
        dorso = y;
      }
    }
  }
  if (dorso === null) dorso = dorsoLargo; // tabla lisa, sin pie

  // El cuerpo queda a un lado del dorso y el pie al otro.
  const arriba = p.filter((q) => q[1] > dorso + 0.5);
  const abajo = p.filter((q) => q[1] < dorso - 0.5);
  const cuerpoArriba = arriba.length > abajo.length;
  const pie = cuerpoArriba ? abajo : arriba;

  // Y el pie esta en un solo extremo: ese extremo mira al vano.
  const media = pie.length ? pie.reduce((s, q) => s + q[0], 0) / pie.length : anchura;
  let q = media < anchura / 2 ? p.map(([x, y]) => [anchura - x, y]).reverse() : p.slice();

  // El sentido de `v` lo manda el CUERPO, no como se haya dibujado: el cuerpo
  // queda fuera y el pie dentro, siempre.
  const s = cuerpoArriba ? 1 : -1;
  q = q.map(([x, y]) => [anchura - x, (y - dorso) * s]);
  return s < 0 ? q.reverse() : q; // el sentido del contorno no cambia
}

/**
 * La cornisa ingletada a tres lados.
 *
 * Para cada punto de la seccion se dibuja el recorrido metido hacia dentro esa
 * distancia, y entre un punto y el siguiente se tiende la superficie.
 *
 * @param {number[][]} seccion  perfil ya asentado, en [u, v]
 * @param {number} xI  filo izquierdo del vano
 * @param {number} xD  filo derecho del vano
 * @param {number} yA  filo alto del vano
 * @param {number} zMuro   cara del muro donde apoya
 * @param {number} sentido +1 hacia delante, -1 hacia atras
 */
export function cornisa(seccion, xI, xD, yA, zMuro, sentido) {
  const pos = [];
  const via = (u) => [
    [xI - u, 0],
    [xI - u, yA + u],
    [xD + u, yA + u],
    [xD + u, 0],
  ];
  const tri = (a, b, c) => pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);

  for (let i = 0; i < seccion.length; i++) {
    const [u0, v0] = seccion[i];
    const [u1, v1] = seccion[(i + 1) % seccion.length];
    const A = via(u0);
    const B = via(u1);
    const z0 = zMuro + sentido * v0;
    const z1 = zMuro + sentido * v1;
    for (let j = 0; j + 1 < A.length; j++) {
      const a = [A[j][0], A[j][1], z0];
      const b = [A[j + 1][0], A[j + 1][1], z0];
      const c = [B[j + 1][0], B[j + 1][1], z1];
      const e = [B[j][0], B[j][1], z1];
      if (sentido > 0) {
        tri(a, b, c);
        tri(a, c, e);
      } else {
        tri(a, c, b);
        tri(a, e, c);
      }
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  // Sin indexar a proposito: asi las aristas quedan vivas.
  g.computeVertexNormals();
  return g;
}

/** Catalogo: perfil -> medida -> dibujo(s). Un 90/70 son dos perfiles distintos. */
export const PERFILES_COPRIFILO = {
  listellare: { l70: 'listellare-l70' },
  pierre: { p70: 'pierre-p70' },
  tintoretto: { t9070: ['tintoretto-t90', 'tintoretto-t70'], t70: 'tintoretto-t70', t90: 'tintoretto-t90' },
  raffaello: { r9070: ['raffaello-r90', 'raffaello-r70'], r70: 'raffaello-r70', r90: 'raffaello-r90' },
  giotto: { g9070: ['giotto-g90', 'giotto-g70'], g70: 'giotto-g70', g90: 'giotto-g90' },
  leonardo: { e9070: 'leonardo-e90', e90: 'leonardo-e90' },
  michelangelo: { h9070: ['michelangelo-h90', 'michelangelo-h70'], h70: 'michelangelo-h70', h90: 'michelangelo-h90' },
  cartesio: { c10070: ['cartesio-c100', 'cartesio-c70'], c70: 'cartesio-c70', c100: 'cartesio-c100' },
  caravaggio: { v90: 'caravaggio-v90' },
  tiziano: { z90: 'tiziano-z90' },
  canaletto: { n90: 'canaletto-n90' },
};

const cache = new Map();

/** Carga y asienta un perfil por su nombre de archivo. */
export async function seccionDe(slug, base = '/catalogo/coprifili') {
  if (!cache.has(slug)) {
    cache.set(
      slug,
      fetch(`${base}/${slug}.json`)
        .then((r) => r.json())
        .then((j) => asentar(j.punti, j.larghezza)),
    );
  }
  return cache.get(slug);
}

/** Los dibujos de una medida, siempre como lista. */
export function dibujosDe(perfil, medida) {
  const m = PERFILES_COPRIFILO[perfil];
  if (!m) return [];
  return [].concat(m[medida] ?? m[Object.keys(m)[0]] ?? []);
}

/**
 * Monta el coprifilo por las dos caras del muro.
 *
 * En un paquete de listado 90/70, el 90 va en la cara de la puerta y el 70 en
 * la otra: es como se monta de verdad.
 */
export async function montarCoprifilo(perfil, medida, vano, muro, material, base) {
  const slugs = dibujosDe(perfil, medida);
  if (!slugs.length) return null;

  const secciones = await Promise.all(slugs.map((s) => seccionDe(s, base)));
  const g = new THREE.Group();

  /* El coprifilo apoya en la CARA DEL MURO, no en el filo interior del ala.
     Son dos planos distintos, separados justo lo que mide el pie: el pie entra
     en el vano y salta por encima del forro, y el dorso se queda fuera. */
  const caras = [
    { z: muro.z1, sentido: 1 },
    { z: muro.z0, sentido: -1 },
  ];

  caras.forEach((c, i) => {
    const sec = secciones[Math.min(i, secciones.length - 1)];
    const m = new THREE.Mesh(cornisa(sec, vano.sx, vano.dx, vano.su, c.z, c.sentido), material);
    m.castShadow = true;
    m.receiveShadow = true;
    m.name = 'Coprifilo';
    g.add(m);
  });

  return g;
}
