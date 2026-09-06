/**
 * Contorno 2D -> geometria 3D.
 *
 * Todo el proyecto trabaja en milimetros, igual que los planos. La camara y
 * las luces estan dimensionadas para esa escala, asi que no hay ninguna
 * conversion de unidades escondida: lo que dice la cota es lo que mide la malla.
 */

import * as THREE from 'three';
import { areaFirmada } from './poligonos.js';

/** Construye un THREE.Shape a partir de un grupo { exterior, huecos }. */
export function aShape(grupo) {
  const shape = new THREE.Shape();
  trazar(shape, orientar(grupo.exterior.puntos, true));

  for (const hueco of grupo.huecos) {
    const camino = new THREE.Path();
    trazar(camino, orientar(hueco.puntos, false));
    shape.holes.push(camino);
  }
  return shape;
}

/** Fuerza el sentido de giro: antihorario para el contorno, horario para huecos. */
function orientar(puntos, antihorario) {
  const a = areaFirmada(puntos);
  return (a < 0) === antihorario ? [...puntos].reverse() : puntos;
}

function trazar(destino, puntos) {
  destino.moveTo(puntos[0][0], puntos[0][1]);
  for (let i = 1; i < puntos.length; i++) destino.lineTo(puntos[i][0], puntos[i][1]);
  destino.closePath();
}

/**
 * Extruye un grupo de contornos.
 *
 * Resuelve el relieve del canto a partir de las medidas de la pieza.
 *
 * Devuelve tambien lo que se ha tenido que recortar, para poder avisar en vez
 * de dejar al usuario con un resultado distinto del que pidio.
 */
export function resolverRelieve(
  { espesor = 44, bisel = 0, biselAncho = 0, biselPerfil = 'recto' } = {},
  ladoMenor = Infinity,
) {
  // Compatibilidad con piezas guardadas antes de separar ancho y profundidad:
  // entonces un unico valor hacia de las dos cosas.
  const pedido = biselAncho > 0 ? biselAncho : bisel;

  // El relieve se lleva profundidad por cada cara, asi que entre las dos no
  // puede comerse el espesor entero: hay que dejar alma en el medio.
  const maxProfundidad = Math.max(0, (espesor - 0.2) / 2);
  const profundidad = Math.min(Math.max(0, bisel), maxProfundidad);

  // Y el bisel entra hacia dentro por los dos lados, asi que tampoco puede
  // pasar de la mitad del lado menor o la cara se cerraria sobre si misma.
  const maxAncho = Math.max(0, ladoMenor / 2 - 0.1);
  const ancho = profundidad > 0 ? Math.min(Math.max(0, pedido), maxAncho) : 0;

  return {
    profundidad,
    ancho,
    segmentos: biselPerfil === 'redondo' ? 5 : 1,
    alma: espesor - 2 * profundidad,
    recortado: bisel > maxProfundidad + 1e-9,
    estrechado: profundidad > 0 && pedido > maxAncho + 1e-9,
    maxProfundidad,
    maxAncho,
  };
}

/**
 * @param {object} grupo    { exterior, huecos }
 * @param {object} opciones medidas de la pieza: espesor, bisel (profundidad),
 *                          biselAncho y biselPerfil
 */
export function extruir(grupo, opciones = {}) {
  const puntos = grupo.exterior.puntos;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of puntos) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const ladoMenor = Math.min(maxX - minX, maxY - minY);

  const { profundidad, ancho, segmentos, alma } = resolverRelieve(opciones, ladoMenor);
  const shape = aShape(grupo);

  const geometria = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.1, alma),
    // ExtrudeGeometry bisela SIEMPRE los dos extremos de la extrusion, que es
    // justo lo que se busca aqui: el mismo relieve por delante y por detras.
    //
    // Ojo con la geometria del bisel: `bevelSize` crece hacia AFUERA del
    // contorno, asi que tal cual la pieza sobresaldria de lo dibujado y las
    // caras se quedarian del tamano del contorno. Lo que hace falta es al
    // reves. Como el cuerpo se coloca a `bevelSize + bevelOffset` y las caras
    // a `bevelOffset`, poniendo el desplazamiento en -ancho el cuerpo queda
    // justo en el contorno dibujado y las caras rehundidas hacia dentro, que
    // es un panel realzado.
    bevelEnabled: profundidad > 0 && ancho > 0,
    bevelThickness: profundidad,
    bevelSize: ancho,
    bevelOffset: -ancho,
    bevelSegments: segmentos,
    curveSegments: 8,
  });

  // La geometria abarca de -profundidad a alma+profundidad. Se centra en el
  // plano de referencia de la pieza.
  geometria.translate(0, 0, -Math.max(0.1, alma) / 2);
  geometria.computeVertexNormals();
  return geometria;
}

/** Linea 3D para previsualizar un contorno sin extruirlo. */
export function aLinea(contorno, z = 0) {
  const pos = [];
  const n = contorno.puntos.length;
  const total = contorno.cerrado ? n : n - 1;
  for (let i = 0; i < total; i++) {
    const a = contorno.puntos[i];
    const b = contorno.puntos[(i + 1) % n];
    pos.push(a[0], a[1], z, b[0], b[1], z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}
