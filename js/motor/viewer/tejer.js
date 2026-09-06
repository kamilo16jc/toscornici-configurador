/**
 * Tejer la hoja: de las piezas trazadas a las mallas.
 *
 * Esto vive aparte de Escena a proposito. Escena es un VISOR —trae su
 * renderizador, su camara, sus luces y su composicion— y hay sitios donde eso
 * sobra porque ya hay uno montado. El configurador es justo ese caso: tiene su
 * escena, su camara y su sistema de esencias, y lo unico que necesita de aqui
 * es la puerta.
 *
 * Se saco de Escena en vez de copiarse alli. Copiar habria sido mas rapido de
 * escribir y habria empezado a mentir en la primera correccion que se hiciera
 * en un solo lado — que es exactamente lo que le pasa a un motor duplicado.
 *
 * Todo en MILIMETROS, como el resto del proyecto. Quien lo use en metros que
 * escale el grupo.
 */

import * as THREE from 'three';
import { extruir } from '../geom/extruir.js';
import { material, esMadera, pegarVeta } from '../geom/materiales.js';
import { geometriaBugna, campoDe, perfilQueQuepa } from '../geom/relieve.js';
import { perfilEnMm, perfilBastoneEnMm } from '../geom/perfiles.js';
import { haciaDentro } from '../geom/offset.js';
import { contornoEfectivo } from '../geom/efectivo.js';
import { recortarPorVanos } from '../geom/booleanas.js';



/**
 * Crece el contorno por el solape que la pieza mete en la ranura.
 *
 * Lo que se dibuja de un panel es el hueco VISIBLE, porque es lo unico que se ve
 * en una foto o en un alzado. La pieza real es mayor: su canto se esconde bajo
 * el labio del bastone. Sin esto quedan ranuras de un par de milimetros entre
 * panel y larguero por las que se ve el fondo — y no son un fallo del trazado,
 * es que faltaba el solape.
 */
function conRientro(puntos, rientro, topes = []) {
  if (!(rientro > 0)) return puntos;
  const crecido = haciaDentro(puntos, -rientro) ?? puntos;
  if (!topes.length || crecido === puntos) return crecido;

  /* Pero sin cruzar la linea de la junta.
     Creciendo a secas, un panel mordido por un perfilado se le metia 16 mm
     dentro, y el perfilado otros 16 al panel: 32 mm en los que las dos
     molduras se pisan. Medido sobre el archivo del usuario, la junta del arco
     con el panel:
       los dos con rientro 16   14.832 mm2 de madera repetida
       solo uno                  ~7.100
       ninguno                        0
     Exacto y lineal: el solape ES el rientro. Asi que el panel crece por todas
     partes menos por donde toca al perfilado, que es donde no hay marco bajo el
     que esconder el canto: ahi las dos molduras se encuentran en la linea
     trazada, que es como se ven naturales. */
  const r = recortarPorVanos(crecido, topes);
  return r?.exterior?.length >= 3 ? r.exterior : crecido;
}

/**
 * El bastone: la moldura de la cara del armazon que rodea el vano.
 *
 * Sin el, la madera muere contra el panel con un canto cuadrado, y eso en una
 * puerta no existe: siempre hay una moldura que remata el entrepano. Es la
 * banda que se ve rodeando cada panel, con su filete y su gola.
 *
 * Se genera a partir del MISMO contorno del panel, crecido hacia afuera: el
 * aro nace donde acaba la cara de la hoja y baja hasta el panel. Por eso sigue
 * cualquier forma —tambien las de cabeza redonda— sin dibujar nada aparte.
 */
function geometriaBastone(pieza, puntosDelVano, espesorHoja = 45) {
  const ancho = pieza.bastoneAncho ?? 0;
  if (!(ancho > 0)) return null;

  const fuera = haciaDentro(puntosDelVano, -ancho);
  if (!fuera) return null;

  const caraHoja = espesorHoja / 2;
  // Muere justo por encima del panel, para apoyarse en el y taparle el canto.
  const fondo = (pieza.z ?? 0) + pieza.espesor / 2;
  if (!(caraHoja > fondo + 0.5)) return null;

  return geometriaBugna(fuera, perfilBastoneEnMm(ancho, caraHoja, fondo, pieza.bastoneForma), {
    simetrico: true,
    sinCampo: true,
  });
}

/**
 * Elige como se construye cada pieza.
 *
 * Con un perfil de bugna se teje el relieve a partir del contorno, que es como
 * sale en fabrica. Sin el, basta la extrusion normal: mas barata y suficiente
 * para un larguero o un panel liso.
 */
function geometriaDe(pieza, contorno) {
  const conBugna = pieza.perfilBugna && pieza.perfilBugna !== 'plano' && pieza.biselAncho > 0;
  const puntos = conRientro(contorno.puntos, contorno.sinRientro ? 0 : pieza.rientro, contorno.topes ?? []);

  /* Los huecos del CONTORNO, no solo los calados de la pieza. Un perfilado
     metido dentro de un panel le abre un agujero que no esta en pieza.huecos
     —lo abre el recorte automatico— y el relieve tiene que rodearlo igual que
     rodea el perimetro. */
  const agujeros = [...(pieza.huecos ?? []), ...(contorno.huecos ?? [])].filter((h) => h?.length >= 3);

  if (conBugna) {
    /* El perfil va ENTERO, sin simplificar.
       Simplificar por desvio local se cargaba el quiebro donde acaba la
       lengueta plana y arranca el ovolo: mirado solo contra sus dos vecinos ese
       punto parece recto —se desvia 0,0097 mm— pero es el que separa los 26 mm
       de plano de la curva. Sin el, la moldura deja de tener plano y curva y se
       convierte en una sola pendiente blanda, que es justo lo que no se parecia
       a las fotos.
       Y no compensaba: son 34 muestras, y la malla entera de un panel no llega
       a 300 triangulos. */
    const pedido = perfilEnMm(pieza.perfilPuntos ?? pieza.perfilBugna, pieza.biselAncho, pieza.espesor, pieza.rientro ?? 0);
    // Si la figura no da de si, se estrecha el bisel en vez de no dibujar nada.
    const perfil = perfilQueQuepa(puntos, pedido).muestras;
    const simetrico = pieza.biselSimetrico !== false;

    /* Realzado con vidrio: el bisel es MADERA y el cristal ocupa solo la
       meseta. Salen dos mallas de una misma pieza — el aro moldurado y el
       cristal que lo tapa— porque son dos materiales, no dos piezas: quien
       dibuja traza un panel y no tiene que acordarse de poner el cristal. */
    if (pieza.vidrioEnElCampo) {
      const aro = geometriaBugna(puntos, perfil, { simetrico, sinCampo: true, huecos: agujeros });
      const campo = campoDe(puntos, perfil);
      if (aro && campo) {
        const cristal = extruir({ exterior: { puntos: campo }, huecos: [] }, {
          espesor: pieza.espesorVidrio ?? 4,
          bisel: 0,
          biselAncho: 0,
        });
        return [
          { geo: aro, acabado: pieza.acabado, espesor: pieza.espesor },
          { geo: cristal, acabado: pieza.acabadoVidrio ?? 'vidrio', espesor: pieza.espesorVidrio ?? 4 },
        ];
      }
    }

    const geo = geometriaBugna(puntos, perfil, { simetrico, huecos: agujeros });
    // Si el relieve no cabe en la figura, geometriaBugna devuelve null y se
    // cae a la extrusion en vez de dejar la pieza sin dibujar.
    if (geo) return geo;
  }

  return extruir(
    { exterior: { ...contorno, puntos }, huecos: (contorno.huecos ?? pieza.huecos).map((h) => ({ puntos: h })) },
    {
      espesor: pieza.espesor,
      bisel: pieza.bisel,
      biselAncho: pieza.biselAncho,
      biselPerfil: pieza.biselPerfil,
    },
  );
}

/**
 * Teje las piezas y devuelve el grupo con la hoja, en milimetros.
 *
 * @param {object[]} piezas
 * @param {object} o
 * @param {string|null} o.veta        nivel de veta, o null
 * @param {boolean} [o.uv]            coordenadas de textura aunque no haya veta
 * @param {number} o.espesorHoja      para la cota del bastone
 * @param {THREE.Group} [o.grupo]     donde meterlas; si no, uno nuevo
 * @param {Map} [o.cache]             materiales reutilizados entre llamadas
 */
export function tejerHoja(piezas, { veta = null, uv = false, espesorHoja = 45, grupo = null, cache = null } = {}) {
  const g = grupo ?? new THREE.Group();
  const mats = cache ?? new Map();
  const ctx = { _veta: veta, uv, espesorHoja, grupo: g };

  for (const pieza of piezas) {
    if (!pieza.visible) continue;
    /* Contorno EFECTIVO, no el dibujado: si un panel le pisa, el armazon se
       aparta solo. Ver geom/efectivo.js. */
    const efectivo = contornoEfectivo(pieza, piezas, 128);

    /* Una pieza puede haber quedado partida en varios trozos. Pasa cuando un
       perfilado cruza un entrepano: lo que queda arriba y abajo de la curva son
       dos paneles, no uno, y los dos llevan su relieve y su moldura. Se teje
       cada uno por su cuenta y todos con las medidas de la pieza. */
    for (const trozo of [efectivo, ...(efectivo.restos ?? []).map((x) => ({ puntos: x.exterior, huecos: x.huecos ?? [] }))]) {
      tejerPieza(ctx, pieza, trozo, piezas, mats);
    }
  }
  return g;
}

/** Teje una pieza —o uno de sus trozos— y la mete en la escena. */
function tejerPieza(ctx, pieza, efectivo, piezas, cache) {
  const contorno = { puntos: efectivo.puntos };
  if (contorno.puntos.length < 3) return;

  contorno.huecos = efectivo.huecos;
  contorno.topes = efectivo.topes ?? [];
  contorno.sinRientro = !!efectivo.sinRientro;
  const salida = geometriaDe(pieza, contorno);
  if (!salida) return;

  /* Una pieza puede dar mas de una malla: el realzado con vidrio devuelve
     el aro de madera y el cristal, que son dos materiales distintos. */
  const partes = Array.isArray(salida)
    ? salida
    : [{ geo: salida, acabado: pieza.acabado, espesor: pieza.espesor }];

  /* Y ademas el bastone, que va en la cara del armazon y no en el plano de
     la pieza: por eso lleva su propia cota. */
  const aro = geometriaBastone(pieza, efectivo.puntos, ctx.espesorHoja ?? 45);
  /* El aro es del ARMAZON, no del panel: por eso toma el acabado del
     travesano que lo rodea y no el del panel, que puede ser vidrio. */
  if (aro) {
    const marco = piezas.find((x) => ['traverso', 'tavola', 'montante', 'perfilado'].includes(x.papel));
    partes.push({ geo: aro, acabado: marco?.acabado ?? 'robleClaro', espesor: 45, zAbsoluto: 0 });
  }

  for (const parte of partes) {
    // El vidrio se cachea por acabado Y espesor: la refraccion depende del
    // grosor, asi que una luna de 4 no comparte material con una de 8.
    const claveMat = `${parte.acabado}@${parte.espesor}@${ctx._veta ?? ''}`;
    if (!cache.has(claveMat)) cache.set(claveMat, material(parte.acabado, parte.espesor, ctx._veta));

    /* Las coordenadas de textura se ponen si hay veta O si quien llama las
       pide. El configurador es el segundo caso: no usa la veta del motor —
       tiene sus propias esencias con fotos reales— pero sus materiales SI
       necesitan UV, y sin ellas la madera sale lisa. */
    if ((ctx._veta || ctx.uv) && esMadera(parte.acabado)) {
      const xs = efectivo.puntos.map((q) => q[0]);
      const ys = efectivo.puntos.map((q) => q[1]);
      const cruzada = Math.max(...xs) - Math.min(...xs) > Math.max(...ys) - Math.min(...ys);
      pegarVeta(parte.geo, cruzada);
    }

    const malla = new THREE.Mesh(parte.geo, cache.get(claveMat));
    malla.position.z = parte.zAbsoluto ?? pieza.z ?? 0;
    malla.castShadow = true;
    malla.receiveShadow = true;
    malla.name = pieza.nombre;
    ctx.grupo.add(malla);
  }
}
