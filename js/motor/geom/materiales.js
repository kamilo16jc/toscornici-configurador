/**
 * Materiales de acabado. Placeholder honesto: son PBR procedurales, sin
 * texturas. El salto de "renderizado" a "vendible" esta casi todo en mapas de
 * madera reales + HDRI, que entran en la fase de acabado.
 */

import * as THREE from 'three';

export const ACABADOS = {
  robleClaro: { nombre: 'Roble claro', color: 0xc8a271, roughness: 0.38, metalness: 0.0, clearcoat: 0.08 },
  nogal: { nombre: 'Nogal', color: 0x6b4425, roughness: 0.55, metalness: 0.0, clearcoat: 0.18 },
  lacadoBlanco: { nombre: 'Lacado blanco', color: 0xf2efe9, roughness: 0.35, metalness: 0.0, clearcoat: 0.5 },
  lacadoGris: { nombre: 'Lacado gris', color: 0x8d9299, roughness: 0.4, metalness: 0.0, clearcoat: 0.4 },
  laton: { nombre: 'Laton', color: 0xc8a34a, roughness: 0.25, metalness: 1.0, clearcoat: 0.0 },

  // El vidrio necesita transmision, no transparencia por alfa: con alfa se ve
  // el fondo a traves pero no refracta ni recoge el reflejo del canto, y un
  // cristal de puerta se reconoce justamente por eso.
  vidrio: {
    nombre: 'Vidrio',
    color: 0xdfeef2, roughness: 0.03, metalness: 0.0, clearcoat: 0.0,
    transmision: 1.0, ior: 1.52, grosor: 4, opacidad: 1,
  },
  vidrioSatinado: {
    nombre: 'Vidrio satinado',
    color: 0xe8eef0, roughness: 0.62, metalness: 0.0, clearcoat: 0.0,
    transmision: 0.92, ior: 1.52, grosor: 4, opacidad: 1,
  },
};

/**
 * La veta, dibujada y no fotografiada.
 *
 * Se genera con ruido en vez de traer un mapa de madera real. No es por
 * ahorrar: es que "sutil" tiene que ser un NUMERO que se pueda subir y bajar,
 * y con una foto no lo es. Ademas no pesa nada y se repite sin costura.
 *
 * Es roble a la inglesa —al cuarto—, que es el que sale con la fibra RECTA. El
 * dibujo de catedral, esos arcos anchos que todo el mundo asocia a la madera,
 * es justo lo contrario de sutil, asi que no esta.
 *
 * Salen DOS mapas del mismo ruido, y uno es el negativo del otro. En madera
 * barnizada la fibra oscura es la porosa, o sea la MATE: si el mismo mapa
 * hiciera de color y de brillo, las lineas oscuras saldrian ademas las mas
 * brillantes, que es al reves de como se ve una puerta.
 *
 * @param {object} o
 * @param {number} o.lineas   fibras por vuelta de textura (una vuelta son 400 mm)
 * @param {number} o.fuerza   0 no se ve, 1 seria un tablon de feria
 */
function mapasDeVeta({ lineas = 50, color: fColor = 0.13, brillo: fBrillo = 0.34 } = {}) {
  const N = 512;

  // Ruido de valor PERIODICO: al repetirse la textura no se ve la juntura.
  let semilla = 20260825;
  const azar = () => ((semilla = (semilla * 1664525 + 1013904223) >>> 0) / 4294967296);
  const banda = (n) => {
    const v = Array.from({ length: n }, azar);
    return (t) => {
      const p = t * n, i = Math.floor(p), f = p - i;
      const a = v[((i % n) + n) % n], b = v[((i + 1) % n + n) % n];
      return a + (b - a) * f * f * (3 - 2 * f);   // suavizado, sin picos
    };
  };
  /* El ruido NO dibuja la fibra. Lo intente y no sale, y merece la pena
     dejarlo escrito porque es un error de concepto, no un despiste: el ruido
     de valor no es una banda, es un filtro paso BAJO. Su espectro es rojo,
     toda la energia se le va a las frecuencias largas. Medido, banda(50) no da
     cincuenta lineas: pica en k=10. Por eso pedia fibra fina y salian manchas
     —el 1 % de la energia por debajo de 12 mm y el 73 % por encima de 40.

     La fibra de una madera es CUASI-PERIODICA: lineas a un paso bastante
     regular, no manchas al azar. Asi que el paso lo pone una onda de periodo
     exacto y el ruido solo la deforma —la ondula, y hace que unas fibras
     marquen mas que otras. Eso si es madera, y ademas el paso es un numero que
     se puede fijar. */
  const ondula = banda(7);    // curva las lineas a lo largo de la tabla
  const grupo = banda(11);    // unas fibras marcan mas que otras
  const fondo = banda(4);     // el tono general de la tabla, muy lento
  // Y una onda muy lenta a lo largo de la fibra: sin ella las lineas salen
  // rectas como un codigo de barras, que no es madera, es papel pintado.
  const vaiven = banda(5);

  const color = document.createElement('canvas');
  const brillo = document.createElement('canvas');
  color.width = color.height = brillo.width = brillo.height = N;
  const ic = color.getContext('2d').createImageData(N, N);
  const ib = brillo.getContext('2d').createImageData(N, N);

  /* DOS PASADAS, y esto no es remilgo. Antes se estiraba el contraste con una
     ganancia fija y se recortaba lo que se saliera de [0,1]. El recorte se
     comia justo lo que hace que aquello parezca madera: la fibra fina va
     montada encima de la onda lenta, y donde la onda lenta llegaba al tope, la
     fibra se aplastaba contra el. Medido con el espectro de una fila, solo el
     1 % de la energia quedaba en longitudes menores de 12 mm y el 73 % por
     encima de 40: manchas lentas, no fibra.
     Normalizando por el minimo y el maximo REALES no se recorta nada y las
     tres escalas sobreviven. */
  const campo = new Float32Array(N * N);
  let lo = Infinity, hi = -Infinity;
  for (let y = 0; y < N; y++) {
    const t = y / N;
    // La tabla no tiene la fibra a escuadra: se desvia despacio a lo largo.
    const desvio = (vaiven(t) - 0.5) * 0.05;
    for (let x = 0; x < N; x++) {
      const u = (x / N + desvio + 1) % 1;

      // Paso exacto, ondulado por el ruido. Entero para que siga sin costura.
      const fase = u * lineas + (ondula(u) - 0.5) * 1.6;
      // Elevado, para que la fibra sea una linea FINA y oscura y no una onda.
      const entreFibras = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * fase), 0.45);
      const marca = 0.35 + 0.65 * grupo(u);       // unas marcan mas que otras

      const g = 1 - marca * (1 - entreFibras) * 0.75 - (1 - fondo(u)) * 0.3;
      campo[y * N + x] = g;
      if (g < lo) lo = g;
      if (g > hi) hi = g;
    }
  }
  const escala = hi > lo ? 1 / (hi - lo) : 1;

  for (let i = 0; i < campo.length; i++) {
    const g = (campo[i] - lo) * escala;
    // Color: la fibra solo OSCURECE, nunca aclara. Un mapa que suba de 1
    // blanquea la madera y la deja lavada.
    const c = Math.round(255 * (1 - (1 - g) * fColor));
    // Brillo: al reves. La fibra oscura es la mate.
    const b = Math.round(255 * (1 - fBrillo * 0.5 + (1 - g) * fBrillo));
    const k = i * 4;
    ic.data[k] = ic.data[k + 1] = ic.data[k + 2] = c; ic.data[k + 3] = 255;
    ib.data[k] = ib.data[k + 1] = ib.data[k + 2] = b; ib.data[k + 3] = 255;
  }
  color.getContext('2d').putImageData(ic, 0, 0);
  brillo.getContext('2d').putImageData(ib, 0, 0);

  const hacer = (lienzo, sRGB) => {
    const t = new THREE.CanvasTexture(lienzo);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (sRGB) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { mapa: hacer(color, true), rugosidad: hacer(brillo, false) };
}

/** Los mapas cuestan medio megapixel de generar; se hacen una vez. */
const vetaGuardada = new Map();
export function veta(nivel) {
  if (!nivel || nivel === 'lisa') return null;
  if (!vetaGuardada.has(nivel)) {
    const ajustes = {
      sutil: { lineas: 56, color: 0.11, brillo: 0.30 },
      marcada: { lineas: 48, color: 0.26, brillo: 0.52 },
    };
    vetaGuardada.set(nivel, mapasDeVeta(ajustes[nivel] ?? ajustes.sutil));
  }
  return vetaGuardada.get(nivel);
}

/** Un acabado admite veta si es madera: ni el vidrio ni el laton la llevan. */
export const esMadera = (clave) => {
  const a = ACABADOS[clave];
  return !!a && !(a.transmision > 0) && !(a.metalness > 0);
};

/**
 * @param {string} clave    acabado del catalogo
 * @param {number} [espesor] espesor real de la pieza, en mm. Solo lo usa el
 *   vidrio: la refraccion depende de cuanto cristal atraviesa la luz, y un
 *   biselado de 8 mm no dobla igual que una luna de 4.
 */
export function material(clave = 'robleClaro', espesor, nivelDeVeta = null) {
  const a = ACABADOS[clave] ?? ACABADOS.robleClaro;
  const transmite = (a.transmision ?? 0) > 0;
  const v = esMadera(clave) ? veta(nivelDeVeta) : null;

  return new THREE.MeshPhysicalMaterial({
    color: a.color,
    roughness: a.roughness,
    metalness: a.metalness,
    clearcoat: a.clearcoat ?? 0,
    clearcoatRoughness: 0.35,
    transmission: a.transmision ?? 0,
    ior: a.ior ?? 1.5,
    thickness: transmite ? (espesor ?? a.grosor ?? 0) : (a.grosor ?? 0),

    /* Un vidrio con transmision NO se marca transparente, aunque suene al
       reves. La transmision se resuelve en una pasada aparte, sobre lo que ya
       hay pintado; marcandolo transparente ademas entra en la cola de
       transparencias, y entonces se ordena contra si mismo cuadro a cuadro:
       de ahi los destellos, que aparecian solo con las puertas de vidrio.
       Se deja transparent solo si de verdad lleva opacidad. */
    transparent: !transmite && (a.opacidad ?? 1) < 1,
    opacity: a.opacidad ?? 1,

    /* A UNA SOLA CARA, y la madera tambien.
       Cada pieza es un solido cerrado, asi que su dorso no se ve nunca: pintarlo
       no anade nada. Lo que si anade es un fallo. Donde dos piezas se tocan
       —un perfilado contra el panel que ha cortado— la pared del corte y la
       pared del vecino son LA MISMA superficie, y a doble cara se pintan las
       dos a la misma profundidad exacta. La tarjeta no puede ordenarlas y sale
       el rayado que se movia al girar la puerta.
       Medido sobre un panel TIPO 1 con un perfilado TIPO 1 dentro, lanzando
       8.100 rayos contra la escena:
         DoubleSide  4.695 rayos tocaban mas de una pieza, 469 en conflicto
         FrontSide     758                                 205
       Y no se pierde nada: contando impactos por delante y por detras, 1.876
       en los dos casos. Ninguna pieza se queda sin cara.
       (En el cristal ya era asi: sus dos caras muestreaban el buffer de
       transmision y se tapaban la una a la otra segun el angulo.) */
    side: THREE.FrontSide,

    /* La veta va sobre el acabado, no en vez de el: el color y el brillo
       siguen siendo los del catalogo y los mapas solo los modulan. */
    map: v?.mapa ?? null,
    roughnessMap: v?.rugosidad ?? null,
  });
}

export const esVidrio = (clave) => (ACABADOS[clave]?.transmision ?? 0) > 0;

/** Color de linea por capa, para la vista de plano. */
export const COLOR_CAPA = {
  APS_GEOMETRY: 0x7fd4ff,
  QUOTATURA: 0xf2b45c,
  COSTRUZIONI: 0x4a5563,
  TEXT: 0x6b7684,
  SEZIONI: 0xb388ff,
  COPRIFILO: 0x7ee787,
  SCONTORNATURA: 0xff7b72,
};

export const colorDeCapa = (capa) => COLOR_CAPA[capa] ?? 0x9aa4b2;
