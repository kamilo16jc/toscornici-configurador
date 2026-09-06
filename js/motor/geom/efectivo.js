/**
 * El contorno EFECTIVO de una pieza: lo que de verdad queda de ella una vez
 * que los paneles vecinos le han comido lo suyo.
 *
 * Esto no toca lo que dibujas. Un travesano sigue siendo el rectangulo que
 * trazaste, con sus cuatro numeros, y lo puedes seguir moviendo y estirando por
 * las medidas. El recorte se calcula al vuelo cada vez que hay que pintarlo o
 * construirlo en 3D.
 *
 * Es la diferencia entre recortar y calcular el recorte. Recortando de verdad
 * hay que acordarse de volver a hacerlo cada vez que se mueve algo, y basta
 * olvidarse una vez para que quede mal. Calculandolo, no hay nada que recordar:
 * mueves el panel y el travesano se remoldea solo, porque nunca estuvo cortado.
 *
 * Quien manda es el panel. Un panel es un hueco en la hoja, y la madera que lo
 * rodea tiene que apartarse: por eso el canto de un travesano no es una forma
 * suya, es el borde del vano que tiene al lado.
 */

import { puntosDe, cajaDe } from '../modelo/proyecto.js';
import { recortarPorVanos, recortarSalvo } from './booleanas.js';
import { haciaDentro } from './offset.js';

/** Papeles que son hueco: se llevan por delante la madera que tienen encima. */
export const PAPELES_VANO = new Set(['bugnato', 'bugnatoVetro', 'pannello', 'vetro', 'vetroSatinato']);

/**
 * Papeles que son madera de armazon y ceden ante un vano.
 *
 * Los apliques —manilla, grabado, junquillo— quedan fuera a proposito: van
 * sobre la cara, no dentro del armazon, y recortarlos no tendria sentido.
 */
export const PAPELES_ARMAZON = new Set(['traverso', 'montante', 'tavola', 'bastone']);

/**
 * Madera que MANDA sobre el vano, al reves que todo lo demas.
 *
 * Un travesano cede ante el panel: el panel es el hueco y la madera se aparta.
 * Pero hay piezas que van al contrario —una moldura curva cruzando un
 * entrepano, un remate de medio punto— que no siguen ni la horizontal ni la
 * vertical y que lo que hacen es PARTIR el panel por donde pasan.
 *
 * Es la misma resta, con los papeles cambiados. Y por eso la moldura del vano
 * la sigue sin tocar nada: el aro se teje del contorno EFECTIVO del panel, que
 * ahora ya trae la muesca, asi que rodea el corte solo.
 */
export const PAPELES_PERFILADO = new Set(['perfilado']);

const solapan = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

/**
 * Lo que un vano le quita de verdad al armazon.
 *
 * No es su contorno pelado: la moldura que remata el encuentro va LABRADA en
 * el larguero y el travesano, no pegada encima. Asi que la madera tiene que
 * apartarse tambien de esos milimetros, o el larguero se queda macizo justo
 * donde va la moldura y la tapa — que es como se veia, el larguero montado
 * sobre el bisel en vez de tenerlo tallado.
 *
 * Crece hacia FUERA, hacia el armazon, nunca hacia el panel: la bugna no se
 * toca.
 */
function cajaDelVano(vano) {
  const c = cajaDe(vano);
  const a = vano.bastoneAncho ?? 0;
  return a > 0 ? [c[0] - a, c[1] - a, c[2] + a, c[3] + a] : c;
}

function huellaDelVano(vano, resolucion) {
  const pts = puntosDe(vano, resolucion);
  const ancho = vano.bastoneAncho ?? 0;
  if (!(ancho > 0)) return pts;

  /* La madera se recorta un pelo MENOS de lo que ocupa la moldura, y esto no
     es un apaño: si se recortara justo, la pared del corte y el filo del aro
     caerian en el mismo plano exacto, y dos superficies en el mismo plano no
     se pueden ordenar —el motor pinta a ratos una y a ratos otra, y sale un
     rayado a lo largo de la union. Dejando que la madera se meta 0,4 mm por
     debajo, el filo del aro queda enterrado en ella: ni rayado ni rendija.

     Va por defecto y no al reves —recortar de mas— porque un hueco de 0,4 mm
     abierto al aire se ve como una raya oscura, y este no se ve en absoluto. */
  const HOLGURA = 0.4;
  const util = Math.max(ancho - HOLGURA, ancho * 0.5);
  // Si el crecido falla —una figura muy pequena para su moldura— se usa el
  // contorno tal cual: mejor una moldura tapada que un vano que desaparece.
  return haciaDentro(pts, -util) ?? pts;
}

/** Firma barata para saber si algo se ha movido desde el ultimo calculo. */
function firma(pieza, vanos) {
  const c = cajaDe(pieza);
  let s = `${c[0]},${c[1]},${c[2]},${c[3]},${pieza.huecos.length}`;
  // Los nodos importan: una pieza puede cambiar de forma sin cambiar de caja.
  if (pieza.tipo === 'trazado') s += `,n${pieza.nodos.length}`;
  for (const v of vanos) {
    const q = cajaDe(v);
    // El ancho de la moldura entra en la firma: cambiarlo cambia el recorte.
    s += `|${q[0]},${q[1]},${q[2]},${q[3]},b${v.bastoneAncho ?? 0}`;
    if (v.tipo === 'trazado') s += `,n${v.nodos.length}`;
  }
  return s;
}

const memoria = new WeakMap();

/**
 * Contorno de la pieza tras apartarse de los paneles que la pisan.
 *
 * @param {object} pieza
 * @param {object[]} todas   las piezas del proyecto
 * @param {number} resolucion  puntos con que se discretizan las curvas
 * @returns {{puntos:number[][], huecos:number[][][], recortada:boolean}}
 */
export function contornoEfectivo(pieza, todas, resolucion = 160) {
  const propio = { puntos: puntosDe(pieza, resolucion), huecos: pieza.huecos ?? [], recortada: false };

  /* El vano cede ante un perfilado. Va antes que nada porque es la excepcion a
     la regla de la casa —manda el panel— y si se dejara para despues, el
     `return` de abajo se lo llevaria por delante. */
  if (PAPELES_VANO.has(pieza.papel)) {
    const c = cajaDe(pieza);
    const cortes = todas.filter(
      (v) => v !== pieza && v.visible !== false && PAPELES_PERFILADO.has(v.papel) && solapan(c, cajaDe(v)),
    );
    if (!cortes.length) return propio;

    const clave = firma(pieza, cortes);
    const guardado = memoria.get(pieza);
    if (guardado && guardado.clave === clave) return guardado.valor;

    // `partir`: aqui las dos mitades son el diseño, no un descuido.
    const huellas = cortes.map((v) => puntosDe(v, resolucion));
    const r = recortarPorVanos(propio.puntos, huellas, { partir: true });
    const valor = r
      ? {
          puntos: r.exterior,
          huecos: [...propio.huecos, ...r.huecos],
          recortada: true,
          trozos: r.trozos,
          restos: r.restos ?? [],
          /* Contra que se ha recortado. Hace falta luego, al aplicar el
             rientro: el panel crece hacia fuera para esconder su canto bajo el
             marco, pero contra un perfilado NO hay nada bajo lo que esconderse
             —su moldura se ve— y creciendo se le metia 16 mm dentro. */
          topes: huellas,
        }
      : propio;
    memoria.set(pieza, { clave, valor });
    return valor;
  }

  /* El perfilado manda sobre el panel, pero NO sobre su moldura: el aro del
     vano crece hacia fuera y se le metia dentro, quedaba enterrado y en la
     curva no se veia moldura ninguna —el borde salia distinto del resto del
     contorno, que es justo lo que no debe pasar.

     Asi que se aparta lo mismo que se aparta un travesano, y por eso hay que
     restarle el contorno YA RECORTADO del vano: sin recortar, la resta se
     comeria el perfilado entero por donde cruza. No hay circulo vicioso porque
     el vano solo mira el contorno CRUDO de los perfilados. */
  if (PAPELES_PERFILADO.has(pieza.papel)) {
    /* Salvo que traiga relieve propio. Entonces su canto YA es el remate de esa
       junta y el aro del panel sobra: apartarse para dejarle sitio deja el
       canto del perfilado hundido —el relieve le baja la cota— y el aro, que da
       por hecho madera hasta la cara, se cruza con el. Se ve como una raya
       rayada a lo largo de la union.
       Con relieve manda el perfilado y no se aparta; sin el, se aparta y el
       remate lo pone la moldura del panel. Una cosa o la otra, nunca las dos. */
    const conRelieve = pieza.perfilBugna && pieza.perfilBugna !== 'plano' && pieza.biselAncho > 0;
    /* Y sin rientro. El rientro existe porque de un panel se traza el hueco
       VISIBLE y la pieza crece hacia fuera para meter su canto bajo el marco.
       Un perfilado con relieve no se mete bajo nada: manda sobre el panel y su
       canto es la moldura, que se ve entera. Lo que se traza ya es lo que se
       ve, asi que crecer solo servia para invadir al vecino. */
    if (conRelieve) return { ...propio, sinRientro: true };

    const c = cajaDe(pieza);
    const vanos = todas.filter(
      (v) => v !== pieza && v.visible !== false && PAPELES_VANO.has(v.papel) && solapan(c, cajaDelVano(v)),
    );
    if (!vanos.length) return propio;

    const huellas = [];
    for (const v of vanos) {
      const ef = contornoEfectivo(v, todas, resolucion);
      const ancho = Math.max((v.bastoneAncho ?? 0) - 0.4, 0);
      if (!(ancho > 0)) continue;
      const crecida = haciaDentro(ef.puntos, -ancho);
      if (crecida) huellas.push(crecida);
      for (const g of ef.restos ?? []) {
        const otra = haciaDentro(g.exterior, -ancho);
        if (otra) huellas.push(otra);
      }
    }
    if (!huellas.length) return propio;

    /* Donde el perfilado se apoya en el armazon, la moldura no manda: ahi es
       madera contra madera. Sin esto, un puente mas estrecho que la moldura
       —4 mm contra 12— desaparecia entero y la pieza quedaba suelta en el
       aire, sin llegar al larguero. */
    const vecinos = todas.filter(
      (v) => v !== pieza && v.visible !== false && PAPELES_ARMAZON.has(v.papel) && solapan(c, cajaDe(v)),
    );

    /* Y el refugio acaba un pelo DENTRO del larguero, no fuera.
       Aqui es donde el perfilado pasa de estar contra el armazon —madera
       contra madera, sin retranqueo— a estar contra el panel, donde la moldura
       le pide 11,6 mm. Ese cambio es un escalon, y es inevitable: lo que
       decide si se ve es DONDE cae.
       Le habia puesto 6 mm de margen HACIA FUERA, con la idea de alejar el
       encuentro de la vista. Consegui lo contrario: lo saque 6 mm fuera del
       larguero, a campo abierto, y ahi ya no hay nada que lo tape. Salia como
       una uña asomando por arriba y por abajo del arco, y de paso partia la
       moldura que venia corriendo del panel al perfilado. Medido sobre la
       Alessandria, esquina de arriba del arco:
         margen +6   escalon en x=186,1   6,03 mm FUERA del montante  <- la uña
         margen  0             x=180,1    0,03
         margen -2             x=178,1   -1,97   dentro, tapado
       Y el refugio es la madera QUE QUEDA, no la dibujada. El montante esta
       trazado hasta x=180,07, pero la moldura del panel se le come 11,6 mm y
       su madera acaba de verdad en x=164,7. Tomando el contorno dibujado, el
       escalon caia en 178,1 —trece milimetros al aire, pasado el canto real—
       y se seguia viendo. Tomando el efectivo cae donde acaba la madera.
       Metido 2 mm mas para que quede debajo de ella y no a ras, que a ras las
       dos caras caen en el mismo plano y se pelean. Y 2 y no mas porque el
       refugio tiene que seguir agarrando: si al encogerlo el perfilado se
       parte en dos, se vuelve al refugio entero. */
    const METIDO = 2;
    const crudos = vecinos.map((v) => contornoEfectivo(v, todas, resolucion).puntos);
    const metidos = crudos.map((pts, i) => haciaDentro(pts, METIDO) ?? crudos[i]);

    let r = recortarSalvo(propio.puntos, huellas, metidos);
    // Red: si meter el refugio parte la pieza, manda no partirla.
    if (!r || (r.trozos ?? 1) > 1) {
      const entero = recortarSalvo(propio.puntos, huellas, crudos);
      if (entero && (entero.trozos ?? 1) <= (r?.trozos ?? Infinity)) r = entero;
    }
    if (!r) return propio;
    return { puntos: r.exterior, huecos: [...propio.huecos, ...r.huecos], recortada: true, trozos: r.trozos };
  }

  if (!PAPELES_ARMAZON.has(pieza.papel)) return propio;

  const caja = cajaDe(pieza);
  const vanos = todas.filter(
    /* Con la caja del vano YA crecida por su moldura. Un larguero se traza al
       lado del panel, no encima: sus cajas solo se tocan, y con el contorno
       pelado no habria solape que detectar y el recorte no llegaria a hacerse.
       Lo que de verdad se mete en el larguero es la moldura. */
    (v) => v !== pieza && v.visible !== false && PAPELES_VANO.has(v.papel) && solapan(caja, cajaDelVano(v)),
  );
  if (!vanos.length) return propio;

  const clave = firma(pieza, vanos);
  const guardado = memoria.get(pieza);
  if (guardado && guardado.clave === clave) return guardado.valor;

  const r = recortarPorVanos(propio.puntos, vanos.map((v) => huellaDelVano(v, resolucion)));
  // Si el recorte se come la pieza entera, mas vale dejarla como estaba y que
  // se vea el problema que hacerla desaparecer sin decir nada.
  const valor = r
    ? { puntos: r.exterior, huecos: [...propio.huecos, ...r.huecos], recortada: true, trozos: r.trozos }
    : propio;

  memoria.set(pieza, { clave, valor });
  return valor;
}

/** Olvida lo calculado para una pieza. Al borrarla o al cambiarle el papel. */
export const olvidar = (pieza) => memoria.delete(pieza);
