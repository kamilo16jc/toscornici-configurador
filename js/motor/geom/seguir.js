/**
 * Hacer que el borde de una pieza de armazon siga al de un vano.
 *
 * El problema que resuelve: un travesano curvo y el panel que tiene enfrente
 * pueden parecerse mucho y aun asi no ser paralelos. Si su separacion varia —5
 * mm en un lado y 11 en el centro— la moldura, que mide lo mismo en todas
 * partes, muerde una cantidad distinta en cada punto: donde hay poco hueco se
 * come el travesano y donde hay mucho se queda flotando. Se ve como si el panel
 * estuviera montado encima del travesano.
 *
 * La solucion no es acercar el borde a ojo, es hacerlo CONCENTRICO. Dos arcos
 * guardan una separacion constante si —y solo si— comparten centro. Asi que se
 * toma la circunferencia del borde del vano y se lleva el borde del armazon a
 * ella, conservando sus extremos en x para no encoger la pieza.
 */

import { puntosDe, aTrazado } from '../modelo/proyecto.js';
import { arcoDe, medioDe, bulgeHacia } from './arcos.js';

/** Los tramos de un trazado, como pares de nodos con su bulge. */
function tramosDe(nodos, cerrado) {
  const total = cerrado ? nodos.length : nodos.length - 1;
  const salida = [];
  for (let i = 0; i < total; i++) {
    const a = nodos[i];
    const c = nodos[(i + 1) % nodos.length];
    salida.push({ i, a: [a.x, a.y], c: [c.x, c.y], b: a.b || 0 });
  }
  return salida;
}

const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

/** El tramo cuyo punto medio cae mas cerca de un conjunto de puntos. */
function tramoMasCerca(tramos, referencia) {
  let mejor = null;
  let corta = Infinity;
  for (const t of tramos) {
    const m = medioDe(t.a, t.c, t.b);
    let d = Infinity;
    for (const p of referencia) d = Math.min(d, dist(m, p));
    if (d < corta) { corta = d; mejor = t; }
  }
  return mejor;
}

/** Lleva un punto a la circunferencia conservando su x. */
function alCirculo(p, centro, radio) {
  const dx = p[0] - centro[0];
  const dentro = radio * radio - dx * dx;
  // Si la x cae fuera del circulo no hay solucion conservandola; se coge el
  // punto radial mas cercano, que es lo menos malo y no rompe la figura.
  if (dentro <= 0) {
    const d = dist(p, centro) || 1;
    return [centro[0] + ((p[0] - centro[0]) / d) * radio, centro[1] + ((p[1] - centro[1]) / d) * radio];
  }
  const dy = Math.sqrt(dentro);
  const arriba = centro[1] + dy;
  const abajo = centro[1] - dy;
  return [p[0], Math.abs(arriba - p[1]) <= Math.abs(abajo - p[1]) ? arriba : abajo];
}

/**
 * Lleva el borde de `marco` a la curva del borde de `vano` que tiene enfrente.
 *
 * @param {object} marco  pieza de armazon; se convierte a trazado
 * @param {object} vano   el panel al que seguir (no se toca)
 * @param {number} separacion  hueco a dejar, en mm. 0 = bordes pegados, que es
 *   lo que hace que la moldura muerda siempre lo mismo.
 * @returns {{ok:boolean, motivo?:string, antes?:number[], ahora?:number[]}}
 */
export function seguirBorde(marco, vano, separacion = 0) {
  aTrazado(marco);
  if (!marco.nodos || marco.nodos.length < 3) return { ok: false, motivo: 'El armazón no tiene bordes.' };

  // El vano se clona antes de convertirlo: seguir a un panel no debe cambiarlo.
  const copia = JSON.parse(JSON.stringify(vano));
  aTrazado(copia);
  if (!copia.nodos?.length) return { ok: false, motivo: 'No se pudo leer el borde del panel.' };

  const puntosMarco = puntosDe(marco, 200);
  const puntosVano = puntosDe(vano, 200);

  const tramosMarco = tramosDe(marco.nodos, marco.cerrado !== false);
  const tramosVano = tramosDe(copia.nodos, copia.cerrado !== false);

  const tM = tramoMasCerca(tramosMarco, puntosVano);
  const tV = tramoMasCerca(tramosVano, puntosMarco);
  if (!tM || !tV) return { ok: false, motivo: 'No se encontraron bordes enfrentados.' };

  const nodoA = marco.nodos[tM.i];
  const nodoC = marco.nodos[(tM.i + 1) % marco.nodos.length];
  const antes = [[nodoA.x, nodoA.y], [nodoC.x, nodoC.y], nodoA.b || 0];

  const arco = arcoDe(tV.a, tV.c, tV.b);

  if (!arco) {
    /* Borde recto: la pieza tiene que quedar recta y paralela, o sea a la
       misma altura. Se conserva la x de cada extremo. */
    const y = tV.a[1] + (separacion ? Math.sign(medioDe(tM.a, tM.c, tM.b)[1] - tV.a[1]) * separacion : 0);
    nodoA.y = y;
    nodoC.y = y;
    nodoA.b = 0;
    return { ok: true, recto: true, antes, ahora: [[nodoA.x, nodoA.y], [nodoC.x, nodoC.y], 0] };
  }

  const { centro, radio } = arco;
  // De que lado esta el armazon: fuera o dentro de la circunferencia del vano.
  const medioMarco = medioDe(tM.a, tM.c, tM.b);
  const fuera = dist(medioMarco, centro) > radio;
  const radioDestino = radio + (fuera ? separacion : -separacion);

  const A = alCirculo([nodoA.x, nodoA.y], centro, radioDestino);
  const C = alCirculo([nodoC.x, nodoC.y], centro, radioDestino);

  /* El bulge sale de un tercer punto sobre la propia circunferencia: el del
     angulo medio, cogiendo el camino corto. Asi el signo y la magnitud salen
     solos y no hay que desempatar entre los dos arcos posibles. */
  const angA = Math.atan2(A[1] - centro[1], A[0] - centro[0]);
  const angC = Math.atan2(C[1] - centro[1], C[0] - centro[0]);
  let paso = angC - angA;
  while (paso <= -Math.PI) paso += 2 * Math.PI;
  while (paso > Math.PI) paso -= 2 * Math.PI;
  const angM = angA + paso / 2;
  const M = [centro[0] + radioDestino * Math.cos(angM), centro[1] + radioDestino * Math.sin(angM)];

  nodoA.x = A[0]; nodoA.y = A[1];
  nodoC.x = C[0]; nodoC.y = C[1];
  nodoA.b = bulgeHacia(A, C, M);

  return { ok: true, antes, ahora: [A, C, nodoA.b], centro, radio: radioDestino };
}

/**
 * Cuanto varia la separacion entre el borde de un armazon y el de un vano.
 *
 * Lo que importa no es que haya hueco, es que sea SIEMPRE EL MISMO. La moldura
 * mide lo mismo en todas partes: si el hueco cambia, muerde una cantidad
 * distinta en cada punto y la union se ve torcida. Por eso se devuelve la
 * variacion y no la distancia.
 */
export function holguraContra(marco, vano, muestras = 40) {
  const pm = puntosDe(marco, 400);
  const pv = puntosDe(vano, 400);
  if (pm.length < 3 || pv.length < 3) return null;

  const caja = (p) => p.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)],
    [Infinity, Infinity, -Infinity, -Infinity]);
  const a = caja(pm);
  const b = caja(pv);
  const x0 = Math.max(a[0], b[0]);
  const x1 = Math.min(a[2], b[2]);
  if (!(x1 > x0)) return null; // no se miran de frente

  const corte = (pts, x) => {
    const ys = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1p, y1] = pts[i];
      const [x2p, y2] = pts[(i + 1) % pts.length];
      if ((x1p <= x && x2p > x) || (x2p <= x && x1p > x)) ys.push(y1 + ((x - x1p) / (x2p - x1p)) * (y2 - y1));
    }
    return ys.sort((u, v) => u - v);
  };

  const huecos = [];
  for (let i = 0; i <= muestras; i++) {
    const x = x0 + ((x1 - x0) * i) / muestras;
    const cm = corte(pm, x);
    const cv = corte(pv, x);
    if (!cm.length || !cv.length) continue;
    /* Que borde mira a cual se decide por quien esta ENCIMA, no comparando
       las cotas: cuando las dos piezas se tocan justo, la desigualdad estricta
       falla y se acaba restando el borde de arriba de una con el de abajo de
       la otra, que da cientos de milimetros y no significa nada. */
    const centroM = (cm[0] + cm[cm.length - 1]) / 2;
    const centroV = (cv[0] + cv[cv.length - 1]) / 2;
    huecos.push(centroV > centroM ? cv[0] - cm[cm.length - 1] : cm[0] - cv[cv.length - 1]);
  }
  if (huecos.length < 3) return null;
  const min = Math.min(...huecos);
  const max = Math.max(...huecos);
  return { min, max, varia: max - min, muestras: huecos.length };
}
