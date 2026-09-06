/**
 * Modelo de datos del proyecto.
 *
 * Una puerta es una lista de piezas. Cada pieza es una figura cerrada en el
 * plano de la hoja (mm, origen abajo-izquierda) mas los datos que la convierten
 * en solido: espesor, bisel, altura sobre el plano y acabado.
 *
 * Las piezas se guardan como primitiva + parametros, no como nube de puntos.
 * Asi un rectangulo sigue siendo un rectangulo despues de guardarlo y se puede
 * seguir editando por sus medidas. `puntosDe()` es lo unico que necesita saber
 * el resto del programa.
 */

import { puntosDeTrazado } from '../geom/arcos.js';
import { aplicarPapel } from './papeles.js';

/** Medidas nominales del catalogo, en mm. */
export const PLANTILLA = { ancho: 827, alto: 2109, espesor: 45 };

const id = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

/**
 * Valores por defecto. Es una funcion, no un objeto constante: si fuera un
 * objeto, el `huecos: []` se compartiria por referencia entre todas las piezas
 * creadas y calar una calaria todas.
 */
const base = () => ({
  nombre: 'Pieza',
  espesor: 6,
  // Relieve del canto. `bisel` es cuanto baja (profundidad) y `biselAncho`
  // cuanto entra hacia dentro. Separarlos es lo que permite un panel realzado
  // de verdad: 60 mm de ancho con solo 8 mm de caida.
  // El relieve es simetrico: lo mismo por delante que por detras.
  bisel: 0,
  biselAncho: 0,
  biselPerfil: 'recto', // 'recto' (chaflan) o 'redondo' (bocel)
  z: 0, // desplazamiento sobre el plano de la hoja, en mm
  acabado: 'robleClaro',
  // Seccion del bisel dibujada a mano. Null = la del perfil de catalogo.
  perfilPuntos: null,
  // Giro de la figura sobre su propio centro, en grados y antihorario. Se
  // aplica al generar los puntos, no al dibujarla: asi el 3D, los recortes
  // automaticos, los enganches y la exportacion lo ven sin enterarse de nada.
  angulo: 0,
  visible: true,
  huecos: [], // listas de puntos, en mm
  // Identificador de grupo. Las piezas de un mismo grupo se seleccionan y se
  // mueven juntas, pero siguen siendo piezas independientes: cada una conserva
  // su espesor, su bisel y su acabado.
  grupo: null,
});

export const nuevoRect = (x, y, w, h, extra = {}) => ({
  ...base(), id: id(), tipo: 'rect', nombre: 'Rectangulo', x, y, w, h, r: 0, ...extra,
});

export const nuevoCirculo = (cx, cy, r, extra = {}) => ({
  ...base(), id: id(), tipo: 'circulo', nombre: 'Circulo', cx, cy, r, ...extra,
});

export const nuevoPoligono = (puntos, extra = {}) => ({
  ...base(), id: id(), tipo: 'poligono', nombre: 'Poligono', puntos, ...extra,
});

/**
 * Trazado mixto: la figura general. Cada nodo es { x, y, b }, donde `b` es el
 * bulge del tramo que sale de el — 0 recta, distinto de 0 arco. Asi una misma
 * figura encadena rectas y curvas sin cambiar de tipo.
 */
export const nuevoTrazado = (nodos, extra = {}) => ({
  ...base(), id: id(), tipo: 'trazado', nombre: 'Trazado', nodos, cerrado: true, ...extra,
});

export const nuevaElipse = (cx, cy, rx, ry, extra = {}) => ({
  ...base(), id: id(), tipo: 'elipse', nombre: 'Elipse', cx, cy, rx, ry, ...extra,
});

export const nuevoRegular = (cx, cy, r, lados = 6, extra = {}) => ({
  ...base(), id: id(), tipo: 'regular', nombre: 'Poligono regular', cx, cy, r, lados, giro: 0, ...extra,
});

/**
 * Rectangulo rematado en arco. Es un trazado normal con el tramo de arriba
 * combado: no necesita tipo propio, y por eso se puede seguir editando nodo a
 * nodo como cualquier otra figura.
 *
 * @param {number} flecha  cuanto sube el arco sobre el rectangulo. Si vale la
 *                         mitad del ancho, sale un medio punto.
 */
/**
 * Rectangulo con uno de sus lados rematado en arco.
 *
 * El remate puede ir en cualquiera de los cuatro lados, no solo arriba: una
 * cabecera de medio punto y un remate lateral son la misma figura girada, y
 * tener que girar la pieza despues para conseguirlo es dar un rodeo.
 *
 * El bulge vive en el nodo donde ARRANCA el tramo, y los nodos van en sentido
 * antihorario, asi que el positivo siempre comba hacia afuera. La flecha se
 * divide por la CUERDA del lado que se comba: el ancho arriba y abajo, el alto
 * a los costados.
 *
 * @param {'arriba'|'abajo'|'izquierda'|'derecha'} [extra.lado]
 */
export function nuevoArcoRect(x, y, w, h, flecha = w / 2, extra = {}) {
  const { lado = 'arriba', ...resto } = extra;
  const cuerda = lado === 'arriba' || lado === 'abajo' ? w : h;
  const b = cuerda > 0 ? (2 * flecha) / cuerda : 0;

  //            tramo 0: abajo   1: derecha   2: arriba   3: izquierda
  const donde = { abajo: 0, derecha: 1, arriba: 2, izquierda: 3 }[lado] ?? 2;
  const bulge = (i) => (i === donde ? b : 0);

  return nuevoTrazado(
    [
      { x, y, b: bulge(0) },
      { x: x + w, y, b: bulge(1) },
      { x: x + w, y: y + h, b: bulge(2) },
      { x, y: y + h, b: bulge(3) },
    ],
    { nombre: 'Arco', ...resto },
  );
}

/**
 * El punto sobre el que gira una figura: su centro sin girar.
 *
 * Tiene que salir de los parametros y no de los puntos ya generados, o seria
 * circular. Es estable mientras no se cambie la figura, asi que girar y
 * desgirar deja la pieza donde estaba.
 */
export function centroDe(pieza) {
  switch (pieza.tipo) {
    case 'rect':
      return [pieza.x + pieza.w / 2, pieza.y + pieza.h / 2];
    case 'circulo':
    case 'elipse':
    case 'regular':
      return [pieza.cx, pieza.cy];
    default: {
      const pts = pieza.tipo === 'trazado'
        ? (pieza.nodos ?? []).map((n) => [n.x, n.y])
        : (pieza.puntos ?? []);
      if (!pts.length) return [0, 0];
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [x, y] of pts) {
        if (x < x0) x0 = x; if (y < y0) y0 = y;
        if (x > x1) x1 = x; if (y > y1) y1 = y;
      }
      return [(x0 + x1) / 2, (y0 + y1) / 2];
    }
  }
}

/** Gira una lista de puntos alrededor de un centro. Grados, antihorario. */
export function girarPuntos(puntos, grados, centro) {
  if (!grados) return puntos;
  const a = (grados * Math.PI) / 180;
  const co = Math.cos(a), si = Math.sin(a);
  const [cx, cy] = centro;
  return puntos.map(([x, y]) => {
    const dx = x - cx, dy = y - cy;
    return [cx + dx * co - dy * si, cy + dx * si + dy * co];
  });
}

/** Puntos del contorno exterior de una pieza, en mm y sentido antihorario. */
export function puntosDe(pieza, resolucion = 64) {
  const crudos = puntosSinGirar(pieza, resolucion);
  return pieza.angulo ? girarPuntos(crudos, pieza.angulo, centroDe(pieza)) : crudos;
}

/** El contorno tal cual lo describen los parametros, todavia sin girar. */
function puntosSinGirar(pieza, resolucion = 64) {
  switch (pieza.tipo) {
    case 'rect': {
      const { x, y, w, h } = pieza;
      const r = Math.max(0, Math.min(pieza.r ?? 0, Math.abs(w) / 2, Math.abs(h) / 2));
      if (!r) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

      // Esquinas redondeadas: cuarto de circunferencia en cada vertice.
      const pasos = Math.max(2, Math.round(resolucion / 8));
      const arco = (cx, cy, desde) => {
        const p = [];
        for (let i = 0; i <= pasos; i++) {
          const a = desde + (Math.PI / 2) * (i / pasos);
          p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
        }
        return p;
      };
      return [
        ...arco(x + w - r, y + r, -Math.PI / 2),
        ...arco(x + w - r, y + h - r, 0),
        ...arco(x + r, y + h - r, Math.PI / 2),
        ...arco(x + r, y + r, Math.PI),
      ];
    }
    case 'circulo': {
      const p = [];
      for (let i = 0; i < resolucion; i++) {
        const a = (2 * Math.PI * i) / resolucion;
        p.push([pieza.cx + pieza.r * Math.cos(a), pieza.cy + pieza.r * Math.sin(a)]);
      }
      return p;
    }
    case 'elipse': {
      const p = [];
      for (let i = 0; i < resolucion; i++) {
        const a = (2 * Math.PI * i) / resolucion;
        p.push([pieza.cx + pieza.rx * Math.cos(a), pieza.cy + pieza.ry * Math.sin(a)]);
      }
      return p;
    }
    case 'regular': {
      const p = [];
      const n = Math.max(3, pieza.lados | 0);
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * i) / n + (pieza.giro ?? 0);
        p.push([pieza.cx + pieza.r * Math.cos(a), pieza.cy + pieza.r * Math.sin(a)]);
      }
      return p;
    }
    case 'trazado':
      return puntosDeTrazado(pieza.nodos ?? [], pieza.cerrado !== false, 0.15);
    default:
      return pieza.puntos ?? [];
  }
}

/** Caja envolvente [minX, minY, maxX, maxY] de una pieza. */
export function cajaDe(pieza) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of puntosDe(pieza)) {
    if (x < b[0]) b[0] = x;
    if (y < b[1]) b[1] = y;
    if (x > b[2]) b[2] = x;
    if (y > b[3]) b[3] = y;
  }
  return b;
}

/**
 * Gira piezas alrededor de un punto cualquiera.
 *
 * Girar una sola pieza sobre si misma es solo subirle el angulo. Girar VARIAS
 * como un bloque son dos cosas a la vez: cada una gira sobre si misma y ademas
 * su centro orbita alrededor del centro comun. Sin lo segundo, un grupo girado
 * saldria con cada pieza torcida pero todas en su sitio de antes.
 *
 * Los calados van en puntos absolutos, asi que se giran aparte.
 *
 * @param {object[]} piezas
 * @param {number} grados   antihorario
 * @param {number[]} centro [x, y] en mm
 */
export function girarPiezas(piezas, grados, centro) {
  if (!grados) return piezas;
  for (const pieza of piezas) {
    const antes = centroDe(pieza);
    const [dx, dy] = girarPuntos([antes], grados, centro)[0];
    pieza.angulo = (pieza.angulo ?? 0) + grados;
    // Con el angulo ya puesto, se lleva la pieza a donde su centro deba caer.
    mover(pieza, dx - antes[0], dy - antes[1]);
    if (pieza.huecos.length) {
      pieza.huecos = pieza.huecos.map((h) => girarPuntos(h, grados, antes));
    }
  }
  return piezas;
}

/** Caja envolvente de un conjunto de piezas, y su centro. */
export function centroDeVarias(piezas) {
  const b = [Infinity, Infinity, -Infinity, -Infinity];
  for (const pieza of piezas) {
    const c = cajaDe(pieza);
    if (c[0] < b[0]) b[0] = c[0];
    if (c[1] < b[1]) b[1] = c[1];
    if (c[2] > b[2]) b[2] = c[2];
    if (c[3] > b[3]) b[3] = c[3];
  }
  return { caja: b, centro: [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] };
}

/** Desplaza una pieza, sea cual sea su tipo. */
export function mover(pieza, dx, dy) {
  switch (pieza.tipo) {
    case 'rect':
      pieza.x += dx;
      pieza.y += dy;
      break;
    case 'circulo':
    case 'elipse':
    case 'regular':
      pieza.cx += dx;
      pieza.cy += dy;
      break;
    case 'trazado':
      pieza.nodos = pieza.nodos.map((n) => ({ ...n, x: n.x + dx, y: n.y + dy }));
      break;
    default:
      pieza.puntos = pieza.puntos.map(([x, y]) => [x + dx, y + dy]);
  }
  pieza.huecos = pieza.huecos.map((h) => h.map(([x, y]) => [x + dx, y + dy]));
  return pieza;
}

const PARAMETROS = ['x', 'y', 'w', 'h', 'r', 'cx', 'cy', 'rx', 'ry', 'lados', 'giro', 'angulo', 'puntos'];

/**
 * Convierte cualquier pieza en trazado editable nodo a nodo.
 *
 * Un rectangulo o un circulo se describen con cuatro numeros, que es comodo
 * mientras no haga falta tocarlos por partes. En cuanto hay que mover un nodo o
 * combar un lado, esa comodidad estorba: se pasa a trazado y ya no hay nada
 * especial que respetar.
 *
 * Los tipos con lados rectos conservan sus esquinas. Los redondos se convierten
 * en cuatro nodos con bulge 1/2 cada uno, que es la circunferencia exacta —
 * no una aproximacion por segmentos.
 */
export function aTrazado(pieza) {
  if (pieza.tipo === 'trazado') return pieza;

  /* El giro se cuela abajo con PARAMETROS, asi que aqui hay que hornearlo en
     los nodos o se pierde. Ojo con no aplicarlo dos veces: la rama de arriba
     construye los nodos de los parametros, todavia sin girar, mientras que la
     de abajo sale de puntosDe(), que ya los devuelve girados. */
  const giro = pieza.angulo ?? 0;
  const centro = centroDe(pieza);

  let nodos;
  if (pieza.tipo === 'circulo' || pieza.tipo === 'elipse') {
    const rx = pieza.tipo === 'circulo' ? pieza.r : pieza.rx;
    const ry = pieza.tipo === 'circulo' ? pieza.r : pieza.ry;
    // Cuatro cuartos de vuelta: b = tan(90°/4) = tan(22,5°) ≈ 0,41421356
    const b = Math.tan(Math.PI / 8);
    nodos = [
      { x: pieza.cx + rx, y: pieza.cy, b },
      { x: pieza.cx, y: pieza.cy + ry, b },
      { x: pieza.cx - rx, y: pieza.cy, b },
      { x: pieza.cx, y: pieza.cy - ry, b },
    ];
    if (giro) {
      const b = nodos.map((n) => n.b);
      nodos = girarPuntos(nodos.map((n) => [n.x, n.y]), giro, centro)
        .map(([x, y], i) => ({ x, y, b: b[i] }));
    }
  } else {
    nodos = puntosDe(pieza).map(([x, y]) => ({ x, y, b: 0 }));
  }

  for (const k of PARAMETROS) delete pieza[k];
  pieza.tipo = 'trazado';
  pieza.nodos = nodos;
  pieza.cerrado = true;
  return pieza;
}

/** Nombre anterior, por si queda algún sitio llamándolo así. */
export const aPoligono = aTrazado;

/**
 * Mete las piezas en un mismo grupo.
 *
 * Agrupar NO funde nada: las piezas siguen siendo figuras independientes, con
 * su propio espesor, bisel y acabado. Lo unico que comparten es que se
 * seleccionan y se mueven juntas, para que el conjunto se comporte como una
 * pieza sin dejar de ser varias.
 */
export function agrupar(piezas) {
  const clave = id();
  for (const p of piezas) p.grupo = clave;
  return clave;
}

export const desagrupar = (piezas) => piezas.forEach((p) => (p.grupo = null));

/** Piezas que comparten grupo con `pieza`. Ella sola si no tiene grupo. */
export const familia = (pieza, todas) =>
  pieza.grupo ? todas.filter((p) => p.grupo === pieza.grupo) : [pieza];

export function duplicar(pieza, dx = 20, dy = -20) {
  const copia = structuredClone(pieza);
  copia.id = id();
  copia.nombre = `${pieza.nombre} copia`;
  return mover(copia, dx, dy);
}

// ------------------------------------------------------------- proyecto

export function nuevoProyecto(nombre = 'Puerta sin titulo') {
  return {
    version: 1,
    nombre,
    plantilla: { ...PLANTILLA },
    piezas: [],
    // Imagen de fondo calibrada, para calcar puertas que no tienen plano:
    // { nombre, datos, x, y, ancho, alto, opacidad, visible }
    // `datos` es un data URL, para que el proyecto sea un unico archivo.
    imagen: null,
  };
}

/**
 * Coloca una imagen de fondo a partir de un rectangulo de calibracion.
 *
 * El usuario marca sobre la imagen algo cuya medida real conoce —normalmente el
 * contorno de la hoja— y declara cuanto mide. Eso da el factor de escala. Es la
 * unica pieza que le falta a un PNG para valer lo mismo que un DXF: las medidas
 * de estas puertas son fijas, asi que una foto de frente calibrada asi queda
 * dimensionalmente exacta en milimetros.
 *
 * @param {object} imagen    imagen del proyecto, se modifica en el sitio
 * @param {number[]} rect    [x0, y0, x1, y1] marcado, en mm del lienzo
 * @param {object} medida    { ancho, alto } reales del rectangulo, en mm
 * @param {object} opciones  { proporcion, alOrigen }
 */
export function calibrarImagen(imagen, rect, medida, { proporcion = true, alOrigen = true } = {}) {
  const x0 = Math.min(rect[0], rect[2]);
  const y0 = Math.min(rect[1], rect[3]);
  const anchoMarcado = Math.abs(rect[2] - rect[0]);
  const altoMarcado = Math.abs(rect[3] - rect[1]);
  if (anchoMarcado < 1e-6 || altoMarcado < 1e-6) return imagen;

  let sx = medida.ancho / anchoMarcado;
  let sy = medida.alto / altoMarcado;
  // Con proporcion bloqueada se usa un unico factor para no deformar la foto.
  if (proporcion) sx = sy = (sx + sy) / 2;

  // Escala la imagen alrededor de la esquina inferior izquierda del marcado.
  imagen.x = x0 + (imagen.x - x0) * sx;
  imagen.y = y0 + (imagen.y - y0) * sy;
  imagen.ancho *= sx;
  imagen.alto *= sy;

  if (alOrigen) {
    // Lleva la esquina del rectangulo marcado al origen del plano de la hoja.
    imagen.x -= x0;
    imagen.y -= y0;
  }
  return imagen;
}

/** Proyecto -> texto JSON listo para guardar. */
export const serializar = (proyecto) => JSON.stringify(proyecto, null, 1);

export function deserializar(texto) {
  const datos = JSON.parse(texto);
  if (!datos || !Array.isArray(datos.piezas)) throw new Error('El archivo no es un proyecto de puertas3d.');
  // Reasigna identificadores para poder importar el mismo archivo dos veces.
  for (const p of datos.piezas) p.id ??= id();
  refrescarPapeles(datos.piezas);
  return { ...nuevoProyecto(), ...datos };
}

/**
 * Vuelve a volcar las medidas del papel sobre cada pieza que lo declare.
 *
 * Al guardar, las medidas del papel quedan escritas en la pieza. Sin esto, una
 * puerta trazada hace un mes se abriria con el bisel de hace un mes aunque el
 * TIPO 1 ya sea otro, y la unica forma de actualizarla seria volver a asignarle
 * el papel pieza por pieza — que es justo lo que los papeles vienen a evitar.
 *
 * Se puede hacer sin miedo porque nadie mas escribe esas medidas: no hay en la
 * interfaz ningun control que toque el espesor o el bisel de una pieza suelta,
 * asi que aqui no se pisa nada que haya puesto quien dibuja.
 */
function refrescarPapeles(piezas) {
  // Solo lo que falte: abrir un proyecto no puede cambiar lo que se guardo.
  for (const p of piezas) if (p?.papel) aplicarPapel(p, p.papel, { soloFaltantes: true });

  /* Una excepcion, y de las que hay que justificar. El papel Perfilado nacio
     con bisel 6 y ancho 20 para que el desplegable de bugnas hiciera algo, pero
     esos dos numeros matan el canto TAMBIEN sin bugna, y entonces el perfilado
     llegaba al larguero con el filo redondeado mientras el larguero lo tiene a
     escuadra: no empalmaban.
     Ese valor no lo eligio nadie, lo puse yo mal, asi que reponerlo no es pisar
     una decision del usuario sino deshacer un fallo mio. Solo se toca si NO hay
     relieve elegido: con relieve, el ancho lo quiso quien dibuja. */
  for (const p of piezas) {
    if (p?.papel === 'perfilado' && !p.perfilBugna && p.biselAncho > 0) {
      p.biselAncho = 0;
      p.bisel = 0;
    }
  }
}

/** Una pieza suelta, para la biblioteca. */
export const serializarPieza = (pieza) =>
  JSON.stringify({ formato: 'puertas3d.pieza', version: 1, pieza }, null, 1);

export function deserializarPieza(texto) {
  const datos = JSON.parse(texto);
  const pieza = datos?.pieza ?? datos;
  if (!pieza?.tipo) throw new Error('El archivo no contiene una pieza.');
  const salida = { ...base(), ...pieza, id: id() };
  if (salida.papel) aplicarPapel(salida, salida.papel, { soloFaltantes: true });
  return salida;
}
