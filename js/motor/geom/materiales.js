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
export const VETA_POR_DEFECTO = {
  lineas: 64,        // fibras por vuelta de textura
  color: 0.10,       // cuanto OSCURECE la fibra
  brillo: 0.38,      // cuanto la vuelve mate; en madera clara manda este
  finura: 0.45,      // exponente: bajo = linea fina, alto = onda ancha
  temblor: 0.45,     // alabeo lento, en fibras. La tabla entera se curva
  irregular: 0.70,   // alabeo medio: aprieta y separa las fibras por tramos
  vida: 0.55,        // cuanto va y viene la fibra a lo largo de la tabla
  tono: 0.22,        // bandas de tono a lo ancho
  mancha: 0.20,      // manchas anchas, a las dos direcciones
  desvio: 0.05,      // cuanto se sale la fibra de la escuadra
  catedral: 0,       // 0 = al cuarto (recta) · 1 = a la plana (arcos)
  nudos: 0,          // cuantos nudos por vuelta de textura
  nudoTam: 0.045,    // diametro relativo al lado
  nudoOscuro: 0.58,  // cuanto oscurece el nudo
  relieve: 0.28,     // fuerza del mapa de normales; 0 lo apaga
  px: 512,           // resolucion del mapa
};

/**
 * @param {object} o  ver VETA_POR_DEFECTO. Cada numero es un mando del banco.
 */
export function mapasDeVeta(o = {}) {
  const {
    lineas, color: fColor, brillo: fBrillo, finura, temblor, irregular,
    vida: fVida, tono: fTono, mancha: fMancha, desvio: fDesvio,
    catedral, nudos: cuantosNudos, nudoTam, nudoOscuro, relieve: relieveFuerza, px,
  } = { ...VETA_POR_DEFECTO, ...o };
  const N = px;

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
  /* Y un ruido de dos dimensiones, tambien periodico, porque hacia falta que la
     fibra VIVA A LO LARGO de la tabla y no solo a lo ancho.
     Con las tres bandas de arriba la textura era la misma linea repetida de
     abajo arriba: una fibra que empieza marcada, marcada sigue hasta el borde.
     En una madera de verdad cada fibra va y viene —aparece, engorda, se apaga—
     y es eso, mas que el contraste, lo que separa "rayas" de "madera". */
  const ruido2 = (nx, ny) => {
    const v = Array.from({ length: nx * ny }, azar);
    const en = (i, j) => v[((j % ny) + ny) % ny * nx + ((i % nx) + nx) % nx];
    return (u, t) => {
      const px = u * nx, py = t * ny;
      const i = Math.floor(px), j = Math.floor(py);
      const fx = px - i, fy = py - j;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = en(i, j) + (en(i + 1, j) - en(i, j)) * sx;
      const b = en(i, j + 1) + (en(i + 1, j + 1) - en(i, j + 1)) * sx;
      return a + (b - a) * sy;
    };
  };

  const ondula = banda(7);    // curva las lineas a lo largo de la tabla
  const grupo = banda(11);    // unas fibras marcan mas que otras
  const fondo = banda(4);     // el tono general de la tabla, muy lento
  /* LOS NUDOS. Se colocan en coordenadas de textura y las distancias se miden
     EN EL TORO —si la diferencia pasa de media vuelta, se cuenta por el otro
     lado— asi que un nudo que cae en el borde aparece partido entre las dos
     baldosas y encaja. Sin eso habria que prohibir los bordes, y un nudo nunca
     cae donde a uno le conviene. */
  const nudos = [];
  for (let i = 0; i < cuantosNudos; i += 1) {
    nudos.push({
      u: azar(), t: azar(),
      r: nudoTam * (0.55 + 0.9 * azar()),      // no hay dos nudos iguales
      giro: azar() * Math.PI,
    });
  }
  const enElToro = (a, b) => {
    let d = a - b;
    if (d > 0.5) d -= 1;
    if (d < -0.5) d += 1;
    return d;
  };

  const vida = ruido2(13, 5);  // la fibra aparece y se apaga a lo largo
  const nube = ruido2(3, 2);   // manchas de tono muy amplias, casi imperceptibles
  /* Y el que de verdad la hace pasar por madera: un alabeo de frecuencia MEDIA
     —una fracción del paso de la fibra— que aprieta y separa las lineas por
     tramos. Sin el, todas las fibras guardan el mismo paso y ondulan a la vez,
     y eso no se lee como madera: se lee como PANA. El ojo perdona el contraste
     y hasta el color, pero un paso perfectamente regular lo caza siempre. */
  const aprieta = ruido2(Math.max(4, lineas / 3 | 0), 4);
  // Y una onda muy lenta a lo largo de la fibra: sin ella las lineas salen
  // rectas como un codigo de barras, que no es madera, es papel pintado.
  const vaiven = banda(5);

  const color = document.createElement('canvas');
  const brillo = document.createElement('canvas');
  const relieve = document.createElement('canvas');
  color.width = color.height = brillo.width = brillo.height = N;
  relieve.width = relieve.height = N;
  const ic = color.getContext('2d').createImageData(N, N);
  const ib = brillo.getContext('2d').createImageData(N, N);
  const ir = relieve.getContext('2d').createImageData(N, N);

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
    const desvio = (vaiven(t) - 0.5) * fDesvio;
    for (let x = 0; x < N; x++) {
      const u = (x / N + desvio + 1) % 1;

      /* Paso exacto de fondo, pero alabeado a dos escalas: una lenta que curva
         la tabla entera y otra media que agrupa las fibras de tres en tres o de
         cinco en cinco, que es como salen de verdad. */
      /* Las amplitudes van en FIBRAS, y son pequenas a proposito. Con 1,6 y 2,6
         —lo primero que puse— la fibra dibujaba eses de un palmo a lo ancho de
         la hoja: un mapa topografico, no una tabla. Y no se veia de cerca,
         solo al mirar la puerta entera. La fibra de una madera cepillada es
         casi RECTA; lo que tiene es un temblor de menos de una fibra. */
      /* LOS NUDOS DESVIAN LA FIBRA ANTES DE NADA. Un nudo es una rama que
         crecio dentro del tronco, y la madera tuvo que rodearla: las lineas se
         apartan y se aprietan a su alrededor. Dibujar el nudo sin ese desvio da
         una mancha redonda pegada encima, que es como se nota que es falso. */
      let du = 0;
      let dt = 0;
      let dentro = 0;
      let anillo = 0;
      for (const nd of nudos) {
        const au = enElToro(u, nd.u);
        const at = enElToro(t, nd.t);
        const d = Math.hypot(au, at * 0.72);       // el nudo es un poco ovalado
        const alcance = nd.r * 5;
        if (d > alcance) continue;
        const empuje = (1 - d / alcance) ** 2 * nd.r * 1.6;
        du += (au / (d || 1e-6)) * empuje;
        dt += (at / (d || 1e-6)) * empuje * 0.5;
        if (d < nd.r) {
          const q = d / nd.r;
          dentro = Math.max(dentro, (1 - q) ** 0.6);
          // anillos de crecimiento apretadisimos dentro del propio nudo
          anillo = Math.max(anillo, 0.5 + 0.5 * Math.cos(2 * Math.PI * (q * 7 + nd.giro)));
        }
      }
      const un = u + du;
      const tn = t + dt;

      /* CATEDRAL. Una tabla al cuarto tiene la fibra recta; una a la plana corta
         los anillos de traves y salen los arcos anidados que todo el mundo
         reconoce. Son lo mismo visto desde otro sitio: la distancia a un centro
         muy alargado, en vez de la distancia a una recta. */
      const recta = un * lineas;
      let arcos = recta;
      let cuantaCatedral = 0;
      if (catedral > 0) {
        /* Y la catedral va EN UNA BANDA, no por toda la tabla.
           Aplicandola entera sale una superficie de arcos concentricos que
           parece arena rizada, no madera. En una tabla a la plana los arcos
           salen solo alrededor del CORAZON —donde la sierra corta los anillos
           de traves— y a los lados la fibra vuelve a ser recta, porque alli los
           corta casi de canto. La banda es lo que hace que se lea como una
           tabla y no como un patron. */
        const cu = 0.5 + (ondula(tn) - 0.5) * 0.25;     // el corazon serpentea
        const lejos = (un - cu) / 0.22;                  // ancho de la banda
        cuantaCatedral = catedral * Math.exp(-lejos * lejos);
        const d = Math.hypot((un - cu) * 1.0, (tn - 0.5) * 0.16);
        arcos = d * lineas * 2.2;
      }
      const fase = recta * (1 - cuantaCatedral) + arcos * cuantaCatedral
        + (ondula(un) - 0.5) * temblor
        + (aprieta(un, tn) - 0.5) * irregular;
      // Elevado, para que la fibra sea una linea FINA y oscura y no una onda.
      const entreFibras = Math.pow(0.5 + 0.5 * Math.cos(2 * Math.PI * fase), finura);
      const marca = 0.35 + 0.65 * grupo(u);                    // unas marcan mas
      const viva = (1 - fVida) + fVida * vida(u, t);           // y van y vienen

      let g = 1
        - marca * viva * (1 - entreFibras) * 0.75
        - (1 - fondo(un)) * fTono
        - (1 - nube(un, tn)) * fMancha;
      // Y el nudo encima, con sus anillos propios.
      if (dentro > 0) g -= dentro * nudoOscuro * (0.7 + 0.3 * anillo) * 1.4;
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
  /* EL MAPA DE NORMALES, sacado del propio campo de altura y no dibujado
     aparte. Es la unica forma de que el relieve caiga EXACTAMENTE donde esta la
     fibra: un normal hecho por su cuenta se desalinea un pixel y la madera
     brilla donde no hay vena, que es peor que no tener relieve.
     La pendiente se toma en el toro —el vecino del ultimo pixel es el
     primero— asi que el relieve tambien repite sin costura. */
  const alt = (x, y) => {
    const i = ((y + N) % N) * N + ((x + N) % N);
    return (campo[i] - lo) * escala;
  };
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      const dx = (alt(x + 1, y) - alt(x - 1, y)) * relieveFuerza * N * 0.01;
      const dy = (alt(x, y + 1) - alt(x, y - 1)) * relieveFuerza * N * 0.01;
      const largo = Math.hypot(dx, dy, 1);
      const k = (y * N + x) * 4;
      ir.data[k] = Math.round(((-dx / largo) * 0.5 + 0.5) * 255);
      ir.data[k + 1] = Math.round(((-dy / largo) * 0.5 + 0.5) * 255);
      ir.data[k + 2] = Math.round(((1 / largo) * 0.5 + 0.5) * 255);
      ir.data[k + 3] = 255;
    }
  }

  color.getContext('2d').putImageData(ic, 0, 0);
  brillo.getContext('2d').putImageData(ib, 0, 0);
  relieve.getContext('2d').putImageData(ir, 0, 0);

  const hacer = (lienzo, sRGB) => {
    const t = new THREE.CanvasTexture(lienzo);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 16;
    if (sRGB) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return {
    mapa: hacer(color, true),
    rugosidad: hacer(brillo, false),
    normal: relieveFuerza > 0 ? hacer(relieve, false) : null,
    lienzos: { color, brillo, relieve },
  };
}

/**
 * Los presets, fuera de la funcion y EXPORTADOS.
 *
 * El banco los lee de aqui en vez de repetirlos: dos copias de los mismos
 * numeros acaban siendo dos verdades distintas, y la que se queda vieja es
 * siempre la que no miras.
 */
export const PRESETS_VETA = {
      seda: {},                                         // el de por defecto
      sutil: { lineas: 56, color: 0.11, brillo: 0.30 },
      marcada: { lineas: 48, color: 0.26, brillo: 0.52, irregular: 0.9 },

      /* PINO CRUDO, de la ficha pine_raw_001. Cada numero sale de un campo
         suyo, no de mi ojo:
           grain.contrast 0.32          -> color
           grain.definition 0.72        -> finura (mas definicion, linea mas fina)
           grain.randomness 0.38        -> irregular y temblor
           cathedral_variations         -> catedral
           knots frequency low-medium   -> nudos
           knots.average_diameter 0.045 -> nudoTam
           knots.darkness 0.58          -> nudoOscuro
           normal_map.strength 0.28     -> relieve
           imperfections 0.18 / 0.25    -> mancha y tono
         Y la ficha se comprueba a si misma: declara contraste 0,32 y de sus
         propios colores —base E5BB7E contra veta BA8148— salen 0,285. Cuadra,
         asi que el resto de sus numeros tambien merecen credito.
         OJO con dos que no son de la veta y cambian el material entero:
         real_world_scale 80 cm, o sea vuelta de textura de 800 mm y no 400; y
         varnish false con clearcoat 0, o sea madera CRUDA. Barnizarla es
         convertirla en otra cosa. */
      /* LA TUYA, la del banco: veta-140f-50c.
         Se guarda la RECETA y no el PNG que exporto, y no es purismo: ese PNG
         son 512 px cubriendo 750 mm, o sea 0,68 texeles por milimetro — por
         debajo de la pantalla, asi que se pixela en cuanto te acercas.
         Teniendo los numeros se regenera a 1024 y sube a 1,37, y ademas repite
         sin costura y se retiñe con cada esencia. El PNG no hace nada de eso.
         Lo unico que se cambia de su receta es px; los demas son suyos. */
      pinoCatedral: {
        lineas: 140, color: 0.5, brillo: 0.14, finura: 0.15,
        temblor: 0.15, irregular: 0.1, vida: 0.26,
        tono: 0.01, mancha: 0.02, desvio: 0.03,
        catedral: 1, nudos: 3, nudoTam: 0.045, nudoOscuro: 0.2,
        relieve: 0.08, px: 1024,
        // Y lo que no es veta sino MATERIAL, que tambien venia en su ficha:
        tam: 750, rugosidad: 0.9, barniz: 0,
      },

      pinoCrudo: {
        lineas: 64, color: 0.32, brillo: 0.42, finura: 0.34,
        irregular: 0.60, temblor: 0.38, vida: 0.55,
        tono: 0.25, mancha: 0.18, desvio: 0.06,
        catedral: 0.45, nudos: 3, nudoTam: 0.045, nudoOscuro: 0.58,
        relieve: 0.28,
      },
};

/** Los mapas cuestan medio megapixel de generar; se hacen una vez. */
const vetaGuardada = new Map();
export function veta(nivel) {
  if (!nivel || nivel === 'lisa') return null;
  if (!vetaGuardada.has(nivel)) {
    /* Presets. Cada uno es una desviacion de VETA_POR_DEFECTO, no una lista
       completa: asi al mejorar el generador mejoran todos a la vez. Los numeros
       finos salen del banco de texturas, que es donde se ven. */
    const ajustes = PRESETS_VETA;
    const receta = ajustes[nivel] ?? ajustes.sutil;
    const v = mapasDeVeta(receta);

    /* La vuelta de textura del preset, si trae la suya.
       Las UV las pega el tejido en milimetros/TAM_VETA, que es fijo; cubrir
       otra medida es solo repetir mas o menos, y eso no cuesta nada. Sin esto,
       una veta autorada para 750 mm se veria a 400 y con el paso equivocado —
       que es el error mas facil de cometer y el mas dificil de ver, porque la
       textura parece bien y lo que esta mal es su TAMAÑO. */
    if (receta.tam && receta.tam !== TAM_VETA) {
      const r = TAM_VETA / receta.tam;
      for (const t of [v.mapa, v.rugosidad, v.normal]) t?.repeat.set(r, r);
    }
    v.receta = receta;
    vetaGuardada.set(nivel, v);
  }
  return vetaGuardada.get(nivel);
}

/**
 * Cuanto mide una vuelta de veta, en mm.
 *
 * 400 y no 900: la textura son 512 pixeles, asi que a 900 mm cada pixel mide
 * 1,76 y una fibra de 7 se queda en cuatro pixeles — se emborrona en cuanto la
 * puerta se aleja. A 400 el pixel mide 0,78 y la fibra son nueve.
 */
export const TAM_VETA = 400;

/**
 * Pega las coordenadas de textura a una pieza, con la fibra donde va.
 *
 * Proyeccion plana desde X e Y: la puerta es plana, asi que basta, y ademas
 * hace que la veta CORRA SEGUIDA de una pieza a la siguiente en vez de
 * empezar de cero en cada una, que es lo que delata una textura pegada.
 *
 * El sentido no es un capricho: en una puerta la fibra va a lo LARGO de cada
 * pieza —vertical en los largueros, horizontal en los travesaños— porque la
 * madera se mueve a lo ancho y no a lo largo.
 *
 * Vive aqui y no en el tejido porque no lo necesita solo el tejido: el
 * coprifilo es madera igual, y sin UV le salia lisa.
 */
export function pegarVeta(geo, cruzada) {
  const p = geo.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const a = p.getX(i) / TAM_VETA;
    const b = p.getY(i) / TAM_VETA;
    uv[i * 2] = cruzada ? b : a;
    uv[i * 2 + 1] = cruzada ? a : b;
  }
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
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
  const a0 = ACABADOS[clave] ?? ACABADOS.robleClaro;
  const transmite = (a0.transmision ?? 0) > 0;
  const v = esMadera(clave) ? veta(nivelDeVeta) : null;
  /* Si la veta trae acabado propio manda ella. Una madera CRUDA no es la misma
     con barniz: la ficha del pino dice varnish false y clearcoat 0, y
     barnizarla la convierte en otra cosa aunque la fibra sea identica. */
  const a = v?.receta && (v.receta.rugosidad !== undefined || v.receta.barniz !== undefined)
    ? { ...a0,
        roughness: v.receta.rugosidad ?? a0.roughness,
        clearcoat: v.receta.barniz ?? a0.clearcoat }
    : a0;

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
    normalMap: v?.normal ?? null,
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
