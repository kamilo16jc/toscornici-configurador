/**
 * El panel con bugna, tejido a partir del contorno.
 *
 * Cada muestra del perfil es un ANILLO: el contorno metido hacia dentro esa
 * distancia, colocado a esa altura. Entre un anillo y el siguiente se tiende la
 * superficie. Al final, la tapa plana del campo central.
 *
 * Los tramos entre esquinas se cosen POR SEPARADO a proposito. A lo largo del
 * rebaje la superficie tiene que correr lisa, pero en la esquina no: ahi va la
 * arista viva del inglete. Cosido todo seguido, la bugna se redondea en las
 * esquinas, y en la madera eso no pasa.
 *
 * Y esto es lo que hace que no haga falta dibujar la bugna: los ingletes no se
 * trazan, salen de meter el contorno hacia dentro. Funciona igual con un panel
 * de cabeza redonda o de lados curvos, donde "cuatro trapecios" no significaria
 * nada.
 */

import * as THREE from 'three';
import { haciaDentro, esquinas, maximoHaciaDentro } from './offset.js';

/**
 * @param {number[][]} contorno  puntos del panel, en mm
 * @param {number[][]} perfil    muestras [entra, media altura] en mm
 * @param {object} opciones
 * @param {boolean} opciones.simetrico  mismo relieve por las dos caras
 * @returns {THREE.BufferGeometry|null} null si el relieve no cabe en la figura
 */
export function geometriaBugna(contorno, perfil, { simetrico = true, sinCampo = false, huecos = [] } = {}) {
  if (contorno.length < 3 || perfil.length < 2) return null;

  /* Los agujeros del contorno llevan su propio relieve. Un perfilado metido
     dentro de un panel le abre un hueco, y ese hueco tiene canto igual que el
     perimetro: el bisel tiene que rodearlo tambien. Sus anillos CRECEN desde el
     borde del agujero hacia la madera, al reves que los de fuera, que se meten
     hacia dentro. */
  const anillosDeHueco = [];
  for (const hueco of huecos) {
    if (!hueco || hueco.length < 3) continue;
    const serie = [];
    for (const [entra] of perfil) {
      const anillo = entra > 0 ? haciaDentro(hueco, -entra) : hueco;
      if (!anillo || anillo.length !== hueco.length) break;
      serie.push(anillo);
    }
    if (serie.length >= 2) anillosDeHueco.push(serie);
  }

  // Un anillo por muestra. Si alguno ya no cabe, se corta ahi: mas vale una
  // bugna mas estrecha que una malla anudada.
  const anillos = [];
  const alturas = [];
  for (const [entra, alto] of perfil) {
    const anillo = haciaDentro(contorno, entra);
    if (!anillo || anillo.length !== contorno.length) break;
    anillos.push(anillo);
    alturas.push(alto);
  }
  if (anillos.length < 2) return null;

  const n = contorno.length;
  const quiebros = esquinas(contorno);

  /* Tramos: de una esquina a la siguiente. Sin esquinas —un ovalo, por
     ejemplo— es un unico tramo que da la vuelta entera. */
  const tramos = [];
  if (!quiebros.length) {
    tramos.push(Array.from({ length: n + 1 }, (_, i) => i % n));
  } else {
    for (let k = 0; k < quiebros.length; k++) {
      const desde = quiebros[k];
      const hasta = quiebros[(k + 1) % quiebros.length];
      const seq = [];
      for (let i = desde; ; i = (i + 1) % n) {
        seq.push(i);
        if (i === hasta) break;
      }
      tramos.push(seq);
    }
  }

  const pos = [];
  const uv = [];
  const idx = [];
  let cuenta = 0;

  const poner = (p, z) => {
    pos.push(p[0], p[1], z);
    uv.push(p[0] / 1000, p[1] / 1000);
    return cuenta++;
  };

  const caras = simetrico ? [1, -1] : [1];

  for (const cara of caras) {
    for (const seq of tramos) {
      const base = cuenta;
      const m = seq.length;

      for (let j = 0; j < anillos.length; j++) {
        for (const i of seq) poner(anillos[j][i], cara * alturas[j]);
      }

      for (let j = 0; j + 1 < anillos.length; j++) {
        for (let k = 0; k + 1 < m; k++) {
          const q = base + j * m + k;
          if (cara > 0) idx.push(q, q + 1, q + m + 1, q, q + m + 1, q + m);
          else idx.push(q, q + m + 1, q + 1, q, q + m, q + m + 1);
        }
      }
    }

    /* El campo central, donde el relieve ha terminado de subir.
       Con `sinCampo` se deja abierto: es el caso del realzado con vidrio, donde
       el bisel es de madera y la meseta la ocupa el cristal. La madera se queda
       con el aro y el hueco lo tapa otra pieza. */
    if (sinCampo) continue;
    const ultimo = anillos[anillos.length - 1];
    const z = cara * alturas[alturas.length - 1];

    /* Y el relieve de cada agujero, tejido igual que el de fuera. */
    const bordesDeHueco = [];
    for (const serie of anillosDeHueco) {
      const cuantos = Math.min(serie.length, alturas.length);
      const m = serie[0].length;
      const base = cuenta;
      for (let j = 0; j < cuantos; j++) {
        for (const p of serie[j]) poner(p, cara * alturas[j]);
      }
      for (let j = 0; j + 1 < cuantos; j++) {
        for (let k = 0; k < m; k++) {
          const q = base + j * m + k;
          const q2 = base + j * m + ((k + 1) % m);
          const r = q + m;
          const r2 = q2 + m;
          idx.push(q, r, q2, q2, r, r2);
        }
      }
      bordesDeHueco.push(serie[cuantos - 1]);
    }

    /* El campo, triangulado DE VERDAD. SIEMPRE, tenga agujeros o no.
       Antes se cerraba con un abanico de triangulos desde el primer punto, y
       un abanico solo vale para un contorno CONVEXO. El contorno de un panel
       casi nunca lo es: en cuanto un perfilado le muerde un lado, el campo se
       vuelve concavo y los triangulos del abanico CRUZAN LA MUESCA y la
       rellenan. Queda una lamina de panel flotando encima del perfilado, las
       dos superficies se pelean por los pixeles y sale el rayado en abanico.
       Es de donde venia el dibujo desde el principio.
       Medido sobre el archivo del usuario, en la altura del arco: el contorno
       del panel llega a x=319 —la muesca esta bien calculada— pero la malla
       tenia material en x=220, 250 y 290, con 4 impactos por rayo en vez de 2.
       Dos capas donde solo puede haber una. */
    const aIndice = new Map();
    const comoV2 = (anillo) => anillo.map((p) => {
      const i = poner(p, z);
      const v = new THREE.Vector2(p[0], p[1]);
      aIndice.set(v, i);
      return v;
    });
    const fuera = comoV2(ultimo);
    const dentro = bordesDeHueco.map((b) => comoV2([...b].reverse()));
    let caras = [];
    try {
      caras = THREE.ShapeUtils.triangulateShape(fuera, dentro);
    } catch {
      caras = [];
    }
    if (caras.length) {
      const todos = [fuera, ...dentro].flat();
      for (const [a, b, c] of caras) {
        const ia = aIndice.get(todos[a]);
        const ib = aIndice.get(todos[b]);
        const ic = aIndice.get(todos[c]);
        if (ia === undefined || ib === undefined || ic === undefined) continue;
        if (cara > 0) idx.push(ia, ib, ic);
        else idx.push(ia, ic, ib);
      }
    } else if (!dentro.length) {
      /* Solo si la triangulacion no da nada y no hay agujeros: el abanico como
         ultimo recurso, que en un contorno convexo es correcto y es mejor que
         dejar el campo abierto. Con agujeros no se puede, y se deja abierto. */
      for (let i = 1; i + 1 < fuera.length; i++) {
        const ia = aIndice.get(fuera[0]);
        const ib = aIndice.get(fuera[i]);
        const ic = aIndice.get(fuera[i + 1]);
        if (cara > 0) idx.push(ia, ib, ic);
        else idx.push(ia, ic, ib);
      }
    }
  }

  /* Sin campo hay que cerrar el aro por dentro, o quedaria una lamina abierta
     que por el canto se ve del reves. Esta banda es ademas el galce real donde
     apoya el cristal. */
  if (sinCampo && simetrico) {
    const borde = anillos[anillos.length - 1];
    const z = alturas[alturas.length - 1];
    const base = cuenta;
    for (const p of borde) poner(p, z);
    for (const p of borde) poner(p, -z);
    for (let i = 0; i < borde.length; i++) {
      const a = base + i;
      const b = base + ((i + 1) % borde.length);
      const c = base + borde.length + i;
      const d = base + borde.length + ((i + 1) % borde.length);
      idx.push(a, d, c, a, b, d);
    }
  }

  // El canto: la banda que queda dentro de la ranura.
  if (simetrico) {
    const borde = anillos[0];
    const z = alturas[0];
    const base = cuenta;
    for (const p of borde) poner(p, z);
    for (const p of borde) poner(p, -z);
    for (let i = 0; i < borde.length; i++) {
      const a = base + i;
      const b = base + ((i + 1) % borde.length);
      const c = base + borde.length + i;
      const d = base + borde.length + ((i + 1) % borde.length);
      idx.push(a, c, d, a, d, b);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/**
 * El contorno del campo central: el anillo mas interior del relieve.
 *
 * Es donde acaba el bisel y empieza la meseta, o sea justo donde encaja el
 * cristal en un realzado con vidrio.
 */
export function campoDe(contorno, perfil) {
  if (contorno.length < 3 || perfil.length < 2) return null;
  const dentro = perfil[perfil.length - 1][0];
  const anillo = haciaDentro(contorno, dentro);
  return anillo && anillo.length === contorno.length ? anillo : null;
}

/**
 * Anillos de previsualizacion para el plano 2D.
 *
 * Se enseñan pocos y en los sitios que se notan —el canto, los quiebros del
 * perfil y el campo— para que el dibujo se lea como una bugna sin convertirse
 * en una maraña de lineas.
 */
export function anillosDeVista(contorno, perfil, cuantos = 3) {
  if (contorno.length < 3 || perfil.length < 2) return [];

  const distancias = [];
  const ultima = perfil[perfil.length - 1][0];
  for (let i = 1; i <= cuantos; i++) distancias.push((ultima * i) / cuantos);

  const salida = [];
  for (const d of distancias) {
    const anillo = haciaDentro(contorno, d);
    if (anillo && anillo.length === contorno.length) salida.push(anillo);
  }
  return salida;
}

/**
 * Anillos del relieve en los quiebros DE VERDAD del perfil.
 *
 * anillosDeVista reparte el ancho en partes iguales, que para un adorno vale
 * pero para mirar no: enseña una banda uniforme donde en realidad hay una
 * lengueta llana escondida y luego unos escalones muy juntos. El plano acababa
 * prometiendo un bisel que el solido no tenia, y no habia forma de fiarse de lo
 * que se estaba trazando.
 *
 * Se queda solo con los puntos donde el perfil cambia de pendiente —los
 * quiebros— porque los intermedios de una curva no aportan nada dibujados con
 * una linea de un pixel.
 *
 * @param {number[][]} contorno
 * @param {Array<[number,number]>} muestras  el perfil en mm, tal cual lo usa el 3D
 * @param {number} rientro  lo que queda escondido bajo la moldura
 * @returns {Array<{d:number, puntos:number[][], escondido:boolean}>}
 */
export function anillosDePerfil(contorno, muestras, rientro = 0) {
  if (contorno.length < 3 || muestras.length < 2) return [];

  // Quiebros: donde la pendiente cambia de forma apreciable.
  const quiebros = [];
  for (let i = 1; i < muestras.length - 1; i++) {
    const [d0, h0] = muestras[i - 1];
    const [d1, h1] = muestras[i];
    const [d2, h2] = muestras[i + 1];
    const m1 = d1 - d0 > 1e-9 ? (h1 - h0) / (d1 - d0) : Infinity;
    const m2 = d2 - d1 > 1e-9 ? (h2 - h1) / (d2 - d1) : Infinity;
    if (Math.abs(m2 - m1) > 0.08) quiebros.push(muestras[i][0]);
  }
  quiebros.push(muestras[muestras.length - 1][0]);
  /* Y el final de la lengueta, siempre. Es la linea mas util del dibujo —marca
     hasta donde tapa la moldura, o sea donde empieza lo que se ve— y los
     cantos redondeados del perfil suavizan ese quiebro lo bastante como para
     que la deteccion por pendiente se lo salte. */
  if (rientro > 0) quiebros.push(rientro);
  quiebros.sort((a, b) => a - b);

  // Sin duplicados ni pegados: dos anillos a menos de 1 mm salen como uno.
  const distancias = [];
  for (const d of quiebros) {
    if (d <= 0.05) continue;
    if (distancias.length && d - distancias[distancias.length - 1] < 1) continue;
    distancias.push(d);
  }

  const salida = [];
  for (const d of distancias) {
    const anillo = haciaDentro(contorno, d);
    if (anillo && anillo.length === contorno.length) {
      salida.push({ d, puntos: anillo, escondido: d < rientro - 0.05 });
    }
  }
  return salida;
}

/**
 * Encoge el perfil si la figura no da de si.
 *
 * El relieve se teje metiendo el contorno hacia dentro. Una figura de esquinas
 * cerradas —un panel de cabeza curva, sin ir mas lejos— se queda sin sitio
 * mucho antes de lo que su tamaño sugiere: uno de 600 x 900 puede admitir solo
 * 30 mm porque el arco sale del vertice casi en vertical y ahi la pieza es una
 * cuña.
 *
 * Cuando eso pasaba, los anillos salian nulos a mitad de camino y con ellos el
 * CAMPO, que es la meseta central. Y sin campo no hay donde poner el vidrio de
 * un realzado acristalado: no se dibujaba nada y sin decir por que. Encoger el
 * bisel deja una puerta que se puede seguir trabajando, y el aviso cuenta lo
 * que ha pasado.
 *
 * Se encoge solo a lo ANCHO. La altura se respeta porque marca el grueso de la
 * pieza: bajarla adelgazaria el panel, que es peor que estrecharle el bisel.
 *
 * @returns {{muestras:Array<[number,number]>, cabe:boolean, pedido:number, maximo:number}}
 */
export function perfilQueQuepa(contorno, muestras, { soloMemoria = false } = {}) {
  const pedido = muestras.length ? muestras[muestras.length - 1][0] : 0;
  if (!(pedido > 0) || contorno.length < 3) return { muestras, cabe: true, pedido, maximo: pedido };

  const maximo = maximoHaciaDentro(contorno, 400, { soloMemoria });
  if (!(maximo > 0) || maximo >= pedido) return { muestras, cabe: true, pedido, maximo: pedido };

  // Un pelo por debajo del limite: justo en el, el anillo sale degenerado.
  const factor = (maximo * 0.97) / pedido;
  return {
    muestras: muestras.map(([d, h]) => [d * factor, h]),
    cabe: false,
    pedido,
    maximo: maximo * 0.97,
  };
}
