/**
 * Desplazamiento de un contorno hacia dentro.
 *
 * Es la operacion que genera una bugna, y explica por que no hay que dibujarla:
 * el borde en relieve de un panel no son cuatro trapecios que alguien une, sino
 * el MISMO contorno repetido hacia dentro a distintas alturas. Los ingletes de
 * las esquinas no se trazan — salen solos, porque al meter hacia dentro una
 * esquina de 90 grados los dos lados se cortan a 45.
 *
 * Y por eso funciona igual con un panel de cabeza redonda o de lados curvos,
 * donde "cuatro trapecios" ya no significa nada.
 */

import PolyBool from 'polybooljs';
import { areaFirmada } from './poligonos.js';

/**
 * Deshace los cruces de un anillo que se ha doblado sobre si mismo.
 *
 * Meter un contorno por la bisectriz es rapido pero no sabe de colisiones:
 * pasada cierta distancia los lados se cruzan y sale un nudo, con lazos que se
 * recorren al reves. El que los resuelve es el motor de booleanas —al
 * recomponer el anillo, los lazos invertidos se anulan solos—, y aqui se usa
 * directamente en vez de a traves de geom/booleanas.js para no montar un ciclo
 * de importaciones: booleanas depende del modelo, y el modelo de esto.
 *
 * @param {number[][]} anillo  puede cortarse a si mismo
 * @param {number} minimo      area por debajo de la cual el trozo es basura
 * @returns {number[][][]} los trozos limpios, de mayor a menor
 */
/** Distancia de un punto al BORDE de un poligono (a los lados, no a los vertices). */
function alBorde(pt, poly) {
  let min = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[(i + 1) % poly.length];
    const dx = bx - ax;
    const dy = by - ay;
    const largo = dx * dx + dy * dy;
    let t = largo ? ((pt[0] - ax) * dx + (pt[1] - ay) * dy) / largo : 0;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(pt[0] - (ax + t * dx), pt[1] - (ay + t * dy));
    if (d < min) min = d;
  }
  return min;
}

/**
 * La erosion de verdad: los puntos del interior que estan a `d` o mas del borde.
 *
 * Es la definicion, no una aproximacion. El desplazamiento por bisectriz que hay
 * mas abajo es rapido y sirve para lo corriente, pero no sabe de colisiones:
 * cuando una parte de la figura es mas estrecha que 2d, se anuda. Y deshacer el
 * nudo tampoco devuelve la erosion —quedan puntos mas cerca del borde de lo que
 * se pidio—, asi que para esos casos hace falta calcularla.
 *
 * Se hace restando al contorno la BANDA que recorre su borde: un rectangulo de
 * anchura 2d por cada lado y un disco de radio d en cada vertice. Lo que
 * sobrevive es, exactamente, lo que dista d o mas.
 *
 * Es mas caro —una union por elemento del borde— asi que solo se recurre a ello
 * cuando el camino rapido se anuda.
 */
/** Angulo entre dos vectores, de 0 a PI. */
function anguloEntre(ux, uy, vx, vy) {
  const n = Math.hypot(ux, uy) * Math.hypot(vx, vy);
  if (n < 1e-12) return Math.PI;
  return Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / n)));
}

function erosionar(puntos, d, ladosDelDisco = 8) {
  if (d <= 0 || puntos.length < 3) return null;

  const trozos = [];
  for (let i = 0; i < puntos.length; i++) {
    const [ax, ay] = puntos[i];
    const [bx, by] = puntos[(i + 1) % puntos.length];
    const dx = bx - ax;
    const dy = by - ay;
    const largo = Math.hypot(dx, dy);
    if (largo > 1e-9) {
      // Rectangulo de anchura 2d centrado en el lado.
      const nx = (-dy / largo) * d;
      const ny = (dx / largo) * d;
      trozos.push([[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny]]);
    }
    /* Disco en el vertice, pero SOLO donde hace falta. Entre dos lados casi
       alineados los rectangulos ya se solapan y el disco no aporta nada; en un
       contorno con curvas eso es la inmensa mayoria de los vertices, y cada
       disco que se ahorra es una union menos. De 2N elementos se baja a N mas
       unas pocas esquinas. */
    const [px, py] = puntos[(i - 1 + puntos.length) % puntos.length];
    const giro = Math.abs(anguloEntre(px - ax, py - ay, bx - ax, by - ay) - Math.PI);
    if (giro > 0.12) {
      const disco = [];
      for (let k = 0; k < ladosDelDisco; k++) {
        const t = (2 * Math.PI * k) / ladosDelDisco;
        disco.push([ax + d * Math.cos(t), ay + d * Math.sin(t)]);
      }
      trozos.push(disco);
    }
  }

  /* Unir EN ARBOL, no en cadena. En cadena el acumulado se vuelve a recorrer
     entero en cada paso y el coste crece con el cuadrado del numero de lados;
     por parejas, y luego parejas de parejas, cada trozo se recorre unas log N
     veces. En un contorno de 143 puntos eso es la diferencia entre dos segundos
     y una decima.

     De una sola llamada con todos los trozos dentro nada: PolyBool los tomaria
     por un solo poligono con regla de paridad y los solapes se anularian entre
     si en vez de sumarse. */
  /* Sin lados de longitud cero ni trozos degenerados: PolyBool los rechaza con
     una excepcion, y una excepcion aqui se lleva por delante el tejido de la
     pieza entera. Le paso un contorno de 128 puntos —un circulo— y la pieza
     dejaba de dibujarse sin decir nada. */
  const sinRepetidos = (r) => {
    const out = [];
    for (const q of r) {
      const u = out[out.length - 1];
      if (!u || Math.hypot(q[0] - u[0], q[1] - u[1]) > 1e-7) out.push(q);
    }
    while (out.length > 1 && Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) <= 1e-7) {
      out.pop();
    }
    return out;
  };

  let capa = trozos
    .map(sinRepetidos)
    .filter((t) => t.length >= 3 && Math.abs(areaFirmada(t)) > 1e-6)
    .map((t) => ({ regions: [t], inverted: false }));
  if (!capa.length) return null;

  /* Y con red. Aunque se limpie la entrada, PolyBool puede tropezar con su
     epsilon en un contorno muy denso; si eso pasa, se renuncia a la erosion y
     el que llama se queda con el camino rapido. Nunca al reves: que un calculo
     fino falle no puede dejar una pieza sin dibujar. */
  try {
    while (capa.length > 1) {
      const siguiente = [];
      for (let i = 0; i < capa.length; i += 2) {
        siguiente.push(i + 1 < capa.length ? PolyBool.union(capa[i], capa[i + 1]) : capa[i]);
      }
      capa = siguiente;
    }
  } catch {
    return null;
  }
  const banda = capa[0];

  let queda;
  try {
    queda = PolyBool.difference({ regions: [sinRepetidos(puntos)], inverted: false }, banda);
  } catch {
    return null;
  }

  const firmada = (r) => {
    let a = 0;
    for (let i = 0; i < r.length; i++) {
      const [x1, y1] = r[i];
      const [x2, y2] = r[(i + 1) % r.length];
      a += x1 * y2 - x2 * y1;
    }
    return a / 2;
  };
  const buenos = queda.regions
    .filter((r) => r.length >= 3 && Math.abs(firmada(r)) > 1e-6)
    .sort((a, b) => Math.abs(firmada(b)) - Math.abs(firmada(a)))
    .map((r) => (firmada(r) < 0 ? [...r].reverse() : r));
  return buenos.length ? buenos[0] : null;
}

function deshacerNudos(anillo, minimo = 1) {
  if (!anillo || anillo.length < 3) return [];

  const firmada = (r) => {
    let a = 0;
    for (let i = 0; i < r.length; i++) {
      const [x1, y1] = r[i];
      const [x2, y2] = r[(i + 1) % r.length];
      a += x1 * y2 - x2 * y1;
    }
    return a / 2;
  };

  const limpio = PolyBool.union({ regions: [anillo], inverted: false }, { regions: [], inverted: false });

  return limpio.regions
    .filter((r) => r.length >= 3 && Math.abs(firmada(r)) > minimo)
    .sort((a, b) => Math.abs(firmada(b)) - Math.abs(firmada(a)))
    .map((r) => (firmada(r) < 0 ? [...r].reverse() : r));
}

const LIMITE_INGLETE = 6; // veces la distancia; mas alla se despunta la esquina


/** Asegura el sentido antihorario, que es donde el interior queda a la izquierda. */
const antihorario = (puntos) => (areaFirmada(puntos) < 0 ? [...puntos].reverse() : puntos);

/** Quita puntos repetidos, que dejarian aristas de longitud cero. */
function limpiar(puntos, tol = 1e-6) {
  const salida = [];
  for (const p of puntos) {
    const u = salida[salida.length - 1];
    if (!u || Math.hypot(u[0] - p[0], u[1] - p[1]) > tol) salida.push(p);
  }
  while (salida.length > 1) {
    const a = salida[0];
    const b = salida[salida.length - 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) <= tol) salida.pop();
    else break;
  }
  return salida;
}

/**
 * Desplaza el contorno `d` milimetros: positivo hacia DENTRO, negativo hacia
 * fuera.
 *
 * Hacia fuera hace falta para los paneles. Un panel no mide lo que se ve: es
 * mas grande que el hueco, y su canto se esconde dentro de la ranura, tapado
 * por el labio del bastone. Se dibuja lo que se ve y se crece por el solape.
 *
 * @returns {number[][]|null} null si a esa distancia la figura ya se ha comido
 *          a si misma — que es la senal de que el bisel no cabe.
 */
/**
 * Si algun lado se ha dado la vuelta, señal de que el contorno se ha cruzado.
 *
 * Un lado que se conserva mantiene el sentido; uno que se ha pasado de largo
 * apunta al reves. Coge los casos parciales, que son los que el area sola deja
 * escapar: el contorno todavia gira bien pero ya hay un nudo dentro.
 */
function hayLadoDelReves(p, salida, d) {
  if (d <= 0) return false; // crecer hacia fuera no cruza nada
  for (let i = 0; i < p.length; i++) {
    const j = (i + 1) % p.length;
    const ox = p[j][0] - p[i][0];
    const oy = p[j][1] - p[i][1];
    const nx = salida[j][0] - salida[i][0];
    const ny = salida[j][1] - salida[i][1];
    if (ox * nx + oy * ny < -1e-9) return true;
  }
  return false;
}

export function haciaDentro(puntos, d) {
  const p = limpiar(antihorario(puntos));
  const n = p.length;
  if (n < 3) return null;
  if (Math.abs(d) < 1e-9) return p;

  const areaOriginal = areaFirmada(p);
  const salida = [];

  for (let i = 0; i < n; i++) {
    const ant = p[(i - 1 + n) % n];
    const act = p[i];
    const sig = p[(i + 1) % n];

    // Normales interiores de los dos lados que concurren en el vertice. En un
    // contorno antihorario el interior queda a la izquierda del avance.
    const n1 = normalInterior(ant, act);
    const n2 = normalInterior(act, sig);
    if (!n1 || !n2) continue;

    // La bisectriz da la direccion; el coseno del medio angulo, cuanto hay que
    // avanzar por ella para que los dos lados queden a distancia d.
    let bx = n1[0] + n2[0];
    let by = n1[1] + n2[1];
    const largo = Math.hypot(bx, by);

    if (largo < 1e-9) {
      // Lados opuestos: el vertice se pliega sobre si mismo.
      salida.push([act[0] + n1[0] * d, act[1] + n1[1] * d]);
      continue;
    }
    bx /= largo;
    by /= largo;

    const coseno = bx * n1[0] + by * n1[1];
    // El tope del inglete se aplica en magnitud: con distancias negativas
    // (hacia fuera) un Math.min a secas escogeria la rama contraria.
    const bruto = d / Math.max(coseno, 1e-6);
    const tope = Math.abs(d) * LIMITE_INGLETE;
    const avance = Math.sign(bruto) * Math.min(Math.abs(bruto), tope);
    salida.push([act[0] + bx * avance, act[1] + by * avance]);
  }

  if (salida.length !== n) return null;

  /* Comprobacion de cordura. El desplazamiento por bisectriz no sabe de
     colisiones: pasado cierto punto los lados se cruzan entre si y sale un nudo.
     Dos senales lo delatan, y hacen falta las dos.

     La primera es el area CON SIGNO. Con el area en valor absoluto no basta: un
     rectangulo estrecho metido mas de su media anchura devuelve otro rectangulo
     del derecho al reves, con area menor que la original — pasa el filtro y sale
     una pieza imposible. Con signo se ve enseguida, porque el giro se invierte.

     La segunda es el sentido de cada lado. Un lado que se ha pasado de largo
     apunta al reves que su original, y eso ocurre lado a lado antes de que el
     contorno entero se de la vuelta: coge los casos parciales, que son los que
     el area sola deja escapar. */
  /* Antes, a partir de aqui, cualquier señal de cruce tiraba el desplazamiento
     ENTERO. Y el cruce es local: basta una astilla de decimas en un rincon para
     que un panel de 650 mm se quedara sin bisel. Medido en un caso real, el
     limite caia de 339,5 mm a 17,6 por una astilla de 1,58.

     Ahora, si hay nudo, se DESHACE y se conserva el trozo bueno. Solo se
     devuelve null cuando no queda nada aprovechable. */
  const areaNueva = areaFirmada(salida);
  const seCruza =
    Math.sign(areaNueva) !== Math.sign(areaOriginal) ||
    (d > 0 && Math.abs(areaNueva) >= Math.abs(areaOriginal)) ||
    hayLadoDelReves(p, salida, d);

  if (seCruza) {
    if (d <= 0) return null; // hacia fuera no se cruza nada; si pasa, es otro fallo

    /* El camino rapido se ha anudado: se calcula la erosion de verdad. */
    const exacta = erosionar(p, d);
    if (exacta) {
      const limpio = limpiar(exacta);
      if (limpio.length >= 3 && Math.abs(areaFirmada(limpio)) < Math.abs(areaOriginal)) return limpio;
    }

    const trozos = deshacerNudos(salida, Math.abs(areaOriginal) * 0.002);
    for (const t of trozos) {
      /* Y hay que comprobar que de verdad ESTA DENTRO. Deshacer el nudo
         siempre devuelve algo con el giro correcto, asi que por si solo nunca
         diria que no: metiendo 60 mm en un cuadrado de 100 sale el mismo
         cuadrado del reves, se le da la vuelta y pasa por bueno. Lo que define
         un desplazamiento hacia dentro no es el giro ni el area, es que el
         resultado quede contenido en el original. */
      const limpio = limpiar(t);
      if (limpio.length < 3) continue;
      if (Math.abs(areaFirmada(limpio)) >= Math.abs(areaOriginal)) continue;
      /* La prueba de verdad: cada punto del resultado tiene que quedar a d del
         borde original. Comprobar solo que esta DENTRO no vale —metiendo 60 mm
         en un cuadrado de 100 sale el mismo cuadrado del reves, de lado 20, y
         ese esta dentro—; lo que no cumple es la distancia. Un 10 % de holgura
         por el tope del inglete, que acorta los picos a proposito. */
      if (limpio.every((q) => alBorde(q, p) >= Math.abs(d) * 0.9)) return limpio;
    }
    return null;
  }

  if (Math.sign(areaNueva) !== Math.sign(areaOriginal)) return null;
  if (d > 0) {
    // Hacia dentro el area tiene que bajar, y no hasta desaparecer.
    if (Math.abs(areaNueva) >= Math.abs(areaOriginal)) return null;
    if (Math.abs(areaNueva) < Math.abs(areaOriginal) * 0.002) return null;
  } else if (Math.abs(areaNueva) <= Math.abs(areaOriginal)) {
    return null; // hacia fuera tiene que subir
  }

  const limpio = limpiar(salida);
  return limpio.length >= 3 ? limpio : null;
}

function normalInterior(a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const largo = Math.hypot(dx, dy);
  if (largo < 1e-9) return null;
  return [-dy / largo, dx / largo];
}

/**
 * Cuanto se puede meter hacia dentro antes de que la figura desaparezca.
 * Sirve para avisar en vez de dejar una malla rota.
 */
/* Memoria del maximo. Hace falta porque el lienzo 2D pregunta por cada pieza
   con bugna en CADA repintado, y cuando el contorno se anuda la respuesta sale
   de la erosion exacta, que es cara: eran 22 ms por repintado y el plano se
   arrastraba al mover una pieza. La firma es barata —cuantos puntos, su caja y
   unas muestras— y con eso basta: si el contorno no ha cambiado, no hay nada
   que recalcular, y quien esta arrastrando solo invalida SU pieza. */
const memoriaMaximo = new Map();
const LIMITE_MEMORIA = 400;

function firmaDelContorno(p) {
  let s = p.length + ':';
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of p) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  s += `${x0.toFixed(2)},${y0.toFixed(2)},${x1.toFixed(2)},${y1.toFixed(2)}`;
  // Unas muestras repartidas: dos contornos con la misma caja pero distinta
  // forma tienen que dar firmas distintas.
  const paso = Math.max(1, Math.floor(p.length / 8));
  for (let i = 0; i < p.length; i += paso) s += `|${p[i][0].toFixed(1)},${p[i][1].toFixed(1)}`;
  return s;
}

/**
 * @param {object} [opciones]
 * @param {boolean} [opciones.soloMemoria]  no calcular si no esta en memoria
 *
 * `soloMemoria` es para la vista de PLANO. Ahi esto se pregunta por cada pieza
 * con bugna en cada repintado, y mientras se arrastra una pieza su contorno
 * cambia en cada fotograma: la memoria no puede ayudar y el calculo exacto
 * cuesta lo que cuesta. Con esta bandera el plano se queda con una estimacion
 * barata mientras la mano se mueve, y coge el valor bueno en cuanto el 3D lo
 * calcula al soltar —que lo deja en la misma memoria—. El solido nunca la usa:
 * ahi manda la exactitud.
 */
export function maximoHaciaDentro(puntos, tope = 400, { soloMemoria = false } = {}) {
  const clave = `${tope}#${firmaDelContorno(puntos)}`;
  const guardado = memoriaMaximo.get(clave);
  if (guardado !== undefined) return guardado;

  if (soloMemoria) {
    /* La estimacion barata: la mitad del lado menor de la caja. Se queda corta
       en figuras con entrantes, pero no se inventa nada por arriba y no cuesta
       nada. Y no se guarda en memoria, para no envenenarla con aproximaciones. */
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const [x, y] of puntos) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
    return Math.min(tope, Math.min(x1 - x0, y1 - y0) / 2);
  }

  let bajo = 0;
  let alto = tope;
  let valor;
  if (haciaDentro(puntos, tope)) {
    valor = tope;
  } else {
    for (let i = 0; i < 22; i++) {
      const medio = (bajo + alto) / 2;
      if (haciaDentro(puntos, medio)) bajo = medio;
      else alto = medio;
    }
    valor = bajo;
  }

  // Sin dejar que la memoria crezca sin fin: al llenarse se tira la mas vieja.
  if (memoriaMaximo.size >= LIMITE_MEMORIA) memoriaMaximo.delete(memoriaMaximo.keys().next().value);
  memoriaMaximo.set(clave, valor);
  return valor;
}

/**
 * Indices de los vertices donde el contorno quiebra de verdad.
 *
 * Importa para el relieve: a lo largo del rebaje la superficie tiene que correr
 * lisa, pero en la esquina no — ahi va la arista viva del inglete. Si se cose
 * todo seguido, la bugna se redondea en las esquinas, y en la madera eso no
 * pasa.
 */
export function esquinas(puntos, umbral = 0.35) {
  const n = puntos.length;
  const salida = [];
  for (let i = 0; i < n; i++) {
    const a = puntos[(i - 1 + n) % n];
    const b = puntos[i];
    const c = puntos[(i + 1) % n];
    const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const t2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let giro = Math.abs(t2 - t1) % (2 * Math.PI);
    if (giro > Math.PI) giro = 2 * Math.PI - giro;
    if (giro > umbral) salida.push(i);
  }
  return salida;
}
