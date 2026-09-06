/**
 * Arcos por "bulge", el mismo truco que usa el DXF en sus polilineas.
 *
 * Cada nodo de un trazado lleva un numero `b` que describe el tramo que va
 * hasta el nodo siguiente:
 *
 *     b = 0   recta
 *     b > 0   arco que se comba hacia la DERECHA del avance
 *     b < 0   arco que se comba hacia la izquierda
 *     |b| = 1 media circunferencia
 *
 * El criterio del signo no es caprichoso: los contornos se recorren en sentido
 * antihorario, y con la derecha del avance el bulge positivo sale HACIA AFUERA
 * de la figura. Asi "mas bulge" es siempre "mas panza", que es lo que espera
 * quien arrastra el tirador.
 *
 * Formalmente b = tan(θ/4), con θ el angulo abarcado por el arco. La gracia de
 * guardarlo asi, y no como centro y radio, es que un tramo recto y uno curvo se
 * describen igual: cambia un numero, no la estructura. Por eso una figura puede
 * mezclar rectas y curvas sin costuras, y por eso se puede enderezar o combar
 * un lado sin rehacer nada.
 */

/**
 * Resuelve el arco de un tramo.
 * @returns {null|{centro:number[], radio:number, desde:number, barrido:number}}
 *          null si el tramo es recto.
 */
export function arcoDe(p1, p2, b) {
  if (!b || Math.abs(b) < 1e-9) return null;

  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const cuerda = Math.hypot(dx, dy);
  if (cuerda < 1e-9) return null;

  const { nx, ny } = normal(dx, dy, cuerda);

  const flecha = (b * cuerda) / 2; // sagita, con signo
  const radio = (cuerda * cuerda) / (8 * Math.abs(flecha)) + Math.abs(flecha) / 2;

  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;

  // El centro cae al otro lado del punto medio respecto de la flecha.
  const t = flecha - Math.sign(flecha) * radio;
  const centro = [mx + nx * t, my + ny * t];

  const desde = Math.atan2(p1[1] - centro[1], p1[0] - centro[0]);

  /* El barrido se saca del punto medio del arco, no comparando p1 con p2.
     Comparándolos hay dos arcos posibles —el corto y el largo— y hay que
     desempatar a mano con el signo del bulge, que es justo donde se colaba el
     error: salía el arco complementario. El punto medio está a la mitad exacta
     del barrido, así que da el signo y la magnitud de una vez. */
  const medioX = mx + nx * flecha;
  const medioY = my + ny * flecha;
  const angMedio = Math.atan2(medioY - centro[1], medioX - centro[0]);
  const barrido = 2 * normalizar(angMedio - desde);

  return { centro, radio, desde, barrido };
}

/** Normal derecha de la cuerda. */
function normal(dx, dy, cuerda) {
  return { nx: dy / cuerda, ny: -dx / cuerda };
}

/** Lleva un ángulo a (-PI, PI]. */
function normalizar(a) {
  while (a <= -Math.PI) a += 2 * Math.PI;
  while (a > Math.PI) a -= 2 * Math.PI;
  return a;
}

/** Punto medio del arco (o de la recta). Es el tirador para combar un tramo. */
export function medioDe(p1, p2, b) {
  const a = arcoDe(p1, p2, b);
  if (!a) return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  const ang = a.desde + a.barrido / 2;
  return [a.centro[0] + a.radio * Math.cos(ang), a.centro[1] + a.radio * Math.sin(ang)];
}

/**
 * Bulge que hace pasar el tramo p1-p2 por el punto `q`.
 * Es lo que convierte "arrastrar el tirador" en una curva.
 */
export function bulgeHacia(p1, p2, q) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const cuerda = Math.hypot(dx, dy);
  if (cuerda < 1e-9) return 0;

  const { nx, ny } = normal(dx, dy, cuerda);
  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;

  const flecha = (q[0] - mx) * nx + (q[1] - my) * ny;
  const b = (2 * flecha) / cuerda;
  // Mas alla de la media circunferencia el arco se vuelve inmanejable con el
  // raton: se corta ahi.
  return Math.max(-3, Math.min(3, Math.abs(b) < 0.004 ? 0 : b));
}

/**
 * Convierte una lista de nodos { x, y, b } en puntos.
 *
 * @param {Array} nodos
 * @param {boolean} cerrado
 * @param {number} sagita error maximo admitido en mm al aproximar el arco
 */
export function puntosDeTrazado(nodos, cerrado = true, sagita = 0.15) {
  const n = nodos.length;
  if (n < 2) return nodos.map((v) => [v.x, v.y]);

  const salida = [];
  const ultimo = cerrado ? n : n - 1;

  for (let i = 0; i < ultimo; i++) {
    const a = nodos[i];
    const c = nodos[(i + 1) % n];
    const p1 = [a.x, a.y];
    const p2 = [c.x, c.y];
    salida.push(p1);

    const arco = arcoDe(p1, p2, a.b);
    if (!arco) continue;

    // Tantos tramos como haga falta para que la cuerda no se separe del arco
    // mas de `sagita`.
    const paso = 2 * Math.acos(Math.max(-1, 1 - sagita / arco.radio));
    const trozos = Math.max(2, Math.ceil(Math.abs(arco.barrido) / Math.max(paso, 0.02)));
    for (let k = 1; k < trozos; k++) {
      const ang = arco.desde + (arco.barrido * k) / trozos;
      salida.push([arco.centro[0] + arco.radio * Math.cos(ang), arco.centro[1] + arco.radio * Math.sin(ang)]);
    }
  }
  if (!cerrado) salida.push([nodos[n - 1].x, nodos[n - 1].y]);
  return salida;
}

/** Bulge de un arco que pasa por tres puntos. Devuelve 0 si estan alineados. */
export function bulgePorTres(p1, medio, p2) {
  return bulgeHacia(p1, p2, medio);
}

/**
 * Parte un tramo en dos por un punto suyo, sin cambiar la forma.
 *
 * Es lo que permite meter puntos en una curva sin estropearla. Un tramo con
 * bulge es un arco de circunferencia, y los dos trozos viven en la MISMA
 * circunferencia: basta repartir el barrido entre ellos y volver a convertirlo
 * a bulge con b = tan(barrido / 4).
 *
 * Sin esto, meter un punto en una curva la aplana, porque el bulge del tramo
 * original describe un arco que ya no va de extremo a extremo.
 *
 * @param {number[]} p1  extremo de partida
 * @param {number[]} p2  extremo de llegada
 * @param {number} b     bulge del tramo entero
 * @param {number[]} q   punto por donde partir (se supone sobre el arco)
 * @returns {[number, number]} los bulges de los dos trozos
 */
export function partirArco(p1, p2, b, q) {
  if (!b || Math.abs(b) < 1e-9) return [0, 0]; // recta: dos rectas
  const arco = arcoDe(p1, p2, b);
  if (!arco) return [0, 0];

  const { centro, desde, barrido } = arco;
  const angQ = Math.atan2(q[1] - centro[1], q[0] - centro[0]);

  /* Cuanto barrido hay de p1 a q. No vale normalizar a (-PI, PI]: un arco
     puede pasar de media vuelta, y ahi el rango corto se equivoca de lado. Se
     lleva al mismo sentido que el barrido y dentro de su magnitud. */
  let s1 = angQ - desde;
  const vuelta = 2 * Math.PI;
  if (barrido > 0) {
    while (s1 < 0) s1 += vuelta;
    while (s1 > barrido + 1e-9) s1 -= vuelta;
  } else {
    while (s1 > 0) s1 -= vuelta;
    while (s1 < barrido - 1e-9) s1 += vuelta;
  }
  const s2 = barrido - s1;
  return [Math.tan(s1 / 4), Math.tan(s2 / 4)];
}

/**
 * Lleva un punto suelto al arco mas cercano de un tramo.
 *
 * Al meter un punto en una curva con doble clic, el raton no cae exactamente
 * encima: si se insertara donde se ha pinchado, la curva se movería un pelo
 * cada vez. Proyectandolo sobre la circunferencia, meter puntos no cambia
 * nada de nada.
 */
export function proyectarEnArco(p1, p2, b, q) {
  const arco = arcoDe(p1, p2, b);
  if (!arco) return q; // tramo recto: el punto vale tal cual
  const { centro, radio } = arco;
  const dx = q[0] - centro[0];
  const dy = q[1] - centro[1];
  const d = Math.hypot(dx, dy);
  if (d < 1e-9) return q;
  return [centro[0] + (dx / d) * radio, centro[1] + (dy / d) * radio];
}
