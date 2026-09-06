/**
 * Operaciones booleanas sobre los contornos de las piezas.
 *
 * Cuando una puerta se construye por partes, dos piezas contiguas casi nunca
 * comparten vertices exactos: quedan decimas de milimetro de holgura que en 3D
 * se ven como una ranura entre una parte y la siguiente. Por eso unir no es
 * solo hacer la union booleana, sino soldar antes los vertices que estan lo
 * bastante cerca como para ser el mismo punto.
 *
 * El recorte lo hace polybooljs (algoritmo de Martinez-Rueda). Es preferible a
 * escribir un recortador propio: los casos degenerados de un booleano de
 * poligonos —aristas colineales, vertices que caen sobre una arista, contornos
 * que solo se tocan en un punto— son exactamente lo que produce este dominio.
 */

import PolyBool from 'polybooljs';
import { puntosDe, nuevoPoligono } from '../modelo/proyecto.js';
import { dentro, area } from './poligonos.js';

/**
 * Suelda vertices cercanos entre si: los que caen a menos de `tol` pasan a ser
 * literalmente el mismo punto. Es lo que cierra las holguras entre partes.
 */
export function soldar(anillos, tol) {
  if (tol <= 0) return anillos;

  const celda = tol;
  const rejilla = new Map();
  const representante = (p) => {
    const cx = Math.floor(p[0] / celda);
    const cy = Math.floor(p[1] / celda);
    // Mira tambien las celdas vecinas: dos puntos a 0,01 mm pueden caer a
    // ambos lados de una frontera de celda.
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const q of rejilla.get(`${cx + dx},${cy + dy}`) ?? []) {
          if (Math.hypot(q[0] - p[0], q[1] - p[1]) <= tol) return q;
        }
      }
    }
    const nuevo = [p[0], p[1]];
    const k = `${cx},${cy}`;
    (rejilla.get(k) ?? rejilla.set(k, []).get(k)).push(nuevo);
    return nuevo;
  };

  return anillos.map((anillo) => {
    const salida = [];
    for (const p of anillo) {
      const q = representante(p);
      const ult = salida[salida.length - 1];
      // Descarta puntos repetidos: una arista de longitud cero rompe el
      // recortador.
      if (!ult || ult[0] !== q[0] || ult[1] !== q[1]) salida.push([q[0], q[1]]);
    }
    while (salida.length > 1) {
      const a = salida[0];
      const b = salida[salida.length - 1];
      if (a[0] === b[0] && a[1] === b[1]) salida.pop();
      else break;
    }
    return salida;
  });
}

/**
 * Punto mas cercano del segmento a-b respecto de p, y su parametro t en [0,1].
 */
function proyectar(p, a, b) {
  const vx = b[0] - a[0];
  const vy = b[1] - a[1];
  const largo2 = vx * vx + vy * vy;
  if (largo2 < 1e-12) return { punto: [a[0], a[1]], t: 0, d: Math.hypot(p[0] - a[0], p[1] - a[1]) };

  let t = ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / largo2;
  t = Math.max(0, Math.min(1, t));
  const punto = [a[0] + t * vx, a[1] + t * vy];
  return { punto, t, d: Math.hypot(p[0] - punto[0], p[1] - punto[1]) };
}

/**
 * Pega contornos entre si sin fusionarlos.
 *
 * Soldar vertice contra vertice no basta: el caso tipico es un circulo apoyado
 * en el lado de un rectangulo, donde el punto de tangencia del circulo no cae
 * sobre ningun vertice del rectangulo, sino en mitad de su arista. Por eso, si
 * un vertice queda a menos de la tolerancia de una arista ajena, se proyecta
 * sobre ella y ademas se inserta ese punto en la arista: las dos figuras pasan
 * a compartir el punto exacto y el contacto queda sin ranura.
 *
 * @param {Array<Array<number[]>>} anillos  anillos con su propietario
 * @param {number[]} propietario            indice de pieza de cada anillo
 * @param {number} tol
 */
export function pegar(anillos, propietario, tol) {
  if (tol <= 0) return anillos;

  const salida = anillos.map((a) => a.map((p) => [p[0], p[1]]));
  const inserciones = salida.map(() => []);

  for (let i = 0; i < salida.length; i++) {
    for (let k = 0; k < salida[i].length; k++) {
      const v = salida[i][k];
      let mejor = null;

      for (let j = 0; j < salida.length; j++) {
        if (propietario[j] === propietario[i]) continue; // no contra si misma
        const anillo = salida[j];
        for (let s = 0; s < anillo.length; s++) {
          const a = anillo[s];
          const b = anillo[(s + 1) % anillo.length];
          const r = proyectar(v, a, b);
          if (r.d <= tol && (!mejor || r.d < mejor.d)) mejor = { ...r, anillo: j, segmento: s };
        }
      }
      if (!mejor) continue;

      salida[i][k] = [mejor.punto[0], mejor.punto[1]];
      // Si cae practicamente sobre un extremo, ese vertice ya existe.
      const extremo = mejor.t < 1e-6 || mejor.t > 1 - 1e-6;
      if (!extremo) inserciones[mejor.anillo].push({ segmento: mejor.segmento, t: mejor.t, punto: mejor.punto });
    }
  }

  // Se insertan de atras hacia delante para no invalidar los indices.
  for (let j = 0; j < salida.length; j++) {
    const lista = inserciones[j].sort((a, b) => b.segmento - a.segmento || b.t - a.t);
    for (const ins of lista) salida[j].splice(ins.segmento + 1, 0, [ins.punto[0], ins.punto[1]]);
  }

  return salida;
}

/** Todos los anillos de una pieza: contorno exterior y calados. */
const anillosDe = (pieza) => [puntosDe(pieza, 128), ...pieza.huecos].filter((a) => a.length >= 3);

/**
 * Suelda los anillos de VARIAS piezas a la vez y los devuelve reagrupados por
 * pieza.
 *
 * Es la parte que de verdad cierra las ranuras: soldando pieza por pieza, los
 * vertices de una nunca llegan a ver los de la vecina y la holgura entre ambas
 * sobrevive a la union.
 */
function soldarConjunto(piezas, tol) {
  const grupos = piezas.map(anillosDe);
  const planos = grupos.flat();
  const soldados = soldar(planos, tol);

  const salida = [];
  let i = 0;
  for (const grupo of grupos) {
    salida.push(soldados.slice(i, i + grupo.length).filter((a) => a.length >= 3));
    i += grupo.length;
  }
  return salida;
}

const aRegiones = (anillos) => ({ regions: anillos.map((a) => a.map(([x, y]) => [x, y])), inverted: false });

/**
 * Reparte una lista plana de anillos en grupos { exterior, huecos } segun
 * quien contiene a quien. polybool devuelve todos los anillos al mismo nivel.
 */
export function repartir(anillos) {
  const validos = anillos.filter((a) => a.length >= 3 && area(a) > 1e-6);
  const orden = [...validos].sort((a, b) => area(b) - area(a));

  const padre = new Map();
  for (let i = 0; i < orden.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dentro(orden[i][0], orden[j])) padre.set(orden[i], orden[j]);
    }
  }
  const profundidad = (a) => {
    let d = 0;
    for (let p = padre.get(a); p; p = padre.get(p)) d++;
    return d;
  };

  const grupos = [];
  for (const a of orden) {
    if (profundidad(a) % 2 !== 0) continue; // nivel impar: es calado
    grupos.push({ exterior: a, huecos: orden.filter((h) => padre.get(h) === a) });
  }
  return grupos;
}

/**
 * Une varias piezas en una sola figura sin ranuras.
 *
 * @param {object[]} piezas
 * @param {number} tolerancia  holgura maxima en mm que se considera "el mismo
 *                             punto" y se cierra antes de unir
 * @returns {object[]} piezas resultantes (mas de una si quedan islas sueltas)
 */
export function unir(piezas, tolerancia = 0.5) {
  if (piezas.length < 2) return null;

  let acumulado = null;
  for (const anillos of soldarConjunto(piezas, tolerancia)) {
    const regiones = aRegiones(anillos);
    acumulado = acumulado ? PolyBool.union(acumulado, regiones) : regiones;
  }

  // Segunda soldadura: la union puede dejar vertices nuevos casi coincidentes
  // en los puntos donde se tocaban dos piezas.
  const anillos = soldar(acumulado.regions, tolerancia);
  const modelo = piezas[0];

  return repartir(anillos).map((g, i) =>
    nuevoPoligono(g.exterior, {
      nombre: i === 0 ? 'Union' : `Union ${i + 1}`,
      huecos: g.huecos,
      espesor: modelo.espesor,
      bisel: modelo.bisel,
      z: modelo.z,
      acabado: modelo.acabado,
    }),
  );
}

/**
 * Resta las piezas siguientes de la primera.
 * Util para vaciar un rebaje o abrir un hueco de vidrio.
 */
export function restar(piezas, tolerancia = 0.5) {
  if (piezas.length < 2) return null;

  const conjunto = soldarConjunto(piezas, tolerancia);
  let acumulado = aRegiones(conjunto[0]);
  for (const anillos of conjunto.slice(1)) {
    acumulado = PolyBool.difference(acumulado, aRegiones(anillos));
  }

  const anillos = soldar(acumulado.regions, tolerancia);
  const modelo = piezas[0];

  return repartir(anillos).map((g, i) =>
    nuevoPoligono(g.exterior, {
      nombre: i === 0 ? modelo.nombre : `${modelo.nombre} ${i + 1}`,
      huecos: g.huecos,
      espesor: modelo.espesor,
      bisel: modelo.bisel,
      z: modelo.z,
      acabado: modelo.acabado,
    }),
  );
}

/**
 * Recorta una pieza con el contorno de sus vanos vecinos, EN SU SITIO.
 *
 * Es la alternativa a fundirlo todo en una tabla. La tabla resuelve el problema
 * —el canto sale curvo porque es el vano— pero se lleva por delante las piezas:
 * travesanos y montantes centrales dejan de existir por separado, y con ellos la
 * posibilidad de darle a cada uno su bisel o su acabado.
 *
 * Aqui el travesano sigue siendo un travesano. Lo unico que cambia es su canto,
 * que pasa a ser el negativo exacto del panel que tiene al lado: donde el panel
 * abomba, el travesano se hunde. Y no se dibuja dos veces la misma curva —que es
 * lo que se descuadra en cuanto se toca una—: se deriva de la otra.
 *
 * La pieza conserva su identificador, su nombre y sus medidas. Solo cambia el
 * contorno.
 *
 * @param {number[][]} contorno   puntos de la pieza a recortar
 * @param {number[][][]} vanos    contornos que hay que quitarle, ya agrandados
 * @returns {{exterior:number[][], huecos:number[][][]}|null}
 */
export function recortarPorVanos(contorno, vanos, { partir = false } = {}) {
  if (contorno.length < 3 || !vanos.length) return null;

  let acumulado = aRegiones([contorno]);
  for (const vano of vanos) {
    if (vano.length < 3) continue;
    acumulado = PolyBool.difference(acumulado, aRegiones([vano]));
  }

  const grupos = repartir(acumulado.regions);
  if (!grupos.length) return null;

  grupos.sort((a, b) => area(b.exterior) - area(a.exterior));

  /* Por defecto, si el recorte parte la pieza se conserva el mayor. Pasa cuando
     un vano cruza un travesano de lado a lado, y entonces lo que queda a cada
     lado son piezas distintas de verdad: partirlas sin avisar seria peor que
     quedarse con una y decirlo.

     Con `partir` se devuelven todas, y ahi la cuenta es la contraria: es lo que
     pide un perfilado que cruza un entrepano, donde las dos mitades SON el
     diseño y obligar a trazarlas por separado seria el rodeo. */
  return { ...grupos[0], trozos: grupos.length, restos: partir ? grupos.slice(1) : [] };
}

/**
 * Recorta un contorno pero DEVOLVIENDO lo que caiga sobre un refugio.
 *
 * El caso que lo pide: un perfilado tiene que apartarse de la moldura del
 * panel, pero no ahi donde se apoya en el larguero. Si el puente que los une
 * es mas estrecho que la moldura —4 mm contra 12— el recorte se lo lleva
 * entero y la pieza queda suelta en el aire.
 *
 * Restar y volver a sumar el refugio es exactamente la regla: la moldura del
 * vano no puede comerse la junta entre dos maderas.
 *
 * @param {number[][]} contorno
 * @param {number[][][]} recortes  lo que hay que quitar
 * @param {number[][][]} refugios  donde el recorte no manda
 */
export function recortarSalvo(contorno, recortes, refugios = []) {
  if (contorno.length < 3) return null;

  let queda = aRegiones([contorno]);
  for (const r of recortes) {
    if (r.length >= 3) queda = PolyBool.difference(queda, aRegiones([r]));
  }

  for (const ref of refugios) {
    if (ref.length < 3) continue;
    // Lo que la pieza y el refugio tienen en comun vuelve, se hubiera quitado
    // o no: es madera contra madera y ahi no hay moldura que valga.
    const comun = PolyBool.intersect(aRegiones([contorno]), aRegiones([ref]));
    if (comun.regions.length) queda = PolyBool.union(queda, comun);
  }

  const grupos = repartir(queda.regions);
  if (!grupos.length) return null;
  grupos.sort((a, b) => area(b.exterior) - area(a.exterior));
  return { ...grupos[0], trozos: grupos.length };
}
