/**
 * Perfiles de bugna.
 *
 * Un perfil es la SECCION del borde del panel, dada como muestras
 * [cuanto entra hacia dentro, media altura en ese punto]. La primera muestra es
 * el canto que se mete en la ranura; la ultima, el campo central.
 *
 * Se guardan normalizados —entrada de 0 a 1, altura de 0 a 1— para poder
 * escalarlos al ancho y al espesor que tenga cada pieza. El dibujo manda la
 * forma; las medidas, la pieza.
 */

/**
 * El perfil de la Siena, tomado al centesimo de assets/porte/siena/anta.json,
 * que sale de la lamina BASE_HT789.dxf. Original: entra 60 mm y sube de 3 a
 * 10,5 mm de media altura.
 *
 * Se lee de canto a centro: lengueta plana hasta 26 mm, ovolo que sube hasta
 * 46, un descanso, y el resalte final contra el campo. Esa pausa a media altura
 * es lo que le da el vuelo que se ve en el render; un chaflan recto no la tiene.
 */
const SIENA = [
  [0, 3], [26.08, 3], [26.984, 3.01], [27.887, 3.05], [28.789, 3.12],
  [29.687, 3.22], [30.582, 3.349], [31.472, 3.507], [32.357, 3.694],
  [33.234, 3.911], [34.105, 4.156], [34.966, 4.43], [35.818, 4.731],
  [36.66, 5.061], [37.488, 5.387], [38.325, 5.685], [39.172, 5.955],
  [40.028, 6.198], [40.891, 6.413], [41.76, 6.6], [42.635, 6.758],
  [43.515, 6.887], [44.398, 6.988], [45.284, 7.06], [46.172, 7.103],
  [55.561, 7.447], [55.975, 7.506], [56.367, 7.649], [56.721, 7.871],
  [57.106, 8.271], [57.761, 9.842], [58.112, 10.309], [58.492, 10.478],
  [60, 10.5],
];

/** Normaliza un perfil en milimetros a la caja unidad. */
/**
 * Tramos (ancho, salto) -> puntos acumulados, anclados en cero.
 *
 * Un perfil medido sale como una lista de tramos, que es como se lee en una
 * seccion; para dibujarlo hacen falta puntos. Si el perfil baja, se sube el
 * conjunto para que el minimo quede en cero y normalizar() no lo invierta.
 */
function acumular(tramos) {
  let d = 0;
  let h = 0;
  const pts = [[0, 0]];
  for (const [w, s] of tramos) { d += w; h += s; pts.push([d, h]); }
  const suelo = Math.min(...pts.map(([, y]) => y));
  return pts.map(([x, y]) => [x, y - suelo]);
}

function normalizar(muestras) {
  const anchoTotal = muestras[muestras.length - 1][0];
  const altoTotal = muestras[muestras.length - 1][1];
  return muestras.map(([d, h]) => [d / anchoTotal, h / altoTotal]);
}

/**
 * Compone un perfil a base de tramos, de canto a centro y en milimetros.
 *
 * Un realzado de verdad no es una rampa: es una sucesion de planos, curvas y
 * FILETES —escalones casi verticales— y el filete es justo lo que hace que el
 * borde no se lea liso. En la Siena mide 2,21 mm de subida en 1,39 de avance,
 * o sea casi a plomo, y es la linea fina que se ve rodeando el campo.
 *
 * Tramos admitidos:
 *   { plano: 12 }        avanza 12 mm sin subir
 *   { filete: 2.5 }      sube 2,5 mm a plomo — el escalon
 *   { rampa: [10, 4] }   avanza 10 y sube 4, en linea recta
 *   { ovolo: [20, 5] }   avanza 20 y sube 5, convexo (cuarto de bocel)
 *   { gola: [20, 5] }    lo mismo pero concavo
 */
function componer(tramos, alturaCanto = 3, pasos = 8) {
  let d = 0;
  let h = alturaCanto;
  const salida = [[0, h]];

  for (const t of tramos) {
    if (t.plano != null) {
      d += t.plano;
      salida.push([d, h]);
    } else if (t.filete != null) {
      /* Un filete es vertical: mismo avance, dos alturas. Dos anillos a la
         misma distancia con distinta cota, y entre ellos sale la pared del
         escalon. No hace falta ningun caso especial. */
      h += t.filete;
      salida.push([d, h]);
    } else if (t.rampa) {
      d += t.rampa[0];
      h += t.rampa[1];
      salida.push([d, h]);
    } else if (t.ovolo || t.gola) {
      const [largo, alto] = t.ovolo ?? t.gola;
      const d0 = d;
      const h0 = h;
      for (let i = 1; i <= pasos; i++) {
        const u = i / pasos;
        const v = t.ovolo ? Math.sin((u * Math.PI) / 2) : 1 - Math.cos((u * Math.PI) / 2);
        salida.push([d0 + largo * u, h0 + alto * v]);
      }
      d = d0 + largo;
      h = h0 + alto;
    }
  }
  return salida;
}

/** Genera un perfil recto: sube en linea desde el canto. */
function chaflan(alturaCanto = 0.28) {
  return [[0, alturaCanto], [1, 1]];
}

/** Genera un cuarto de circunferencia: el bocel de toda la vida. */
function bocel(pasos = 12, alturaCanto = 0.28) {
  const salida = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    salida.push([t, alturaCanto + (1 - alturaCanto) * Math.sin((t * Math.PI) / 2)]);
  }
  return salida;
}

/** Media cana: entra concava en vez de convexa. */
function media(pasos = 12, alturaCanto = 0.28) {
  const salida = [];
  for (let i = 0; i <= pasos; i++) {
    const t = i / pasos;
    salida.push([t, alturaCanto + (1 - alturaCanto) * (1 - Math.cos((t * Math.PI) / 2))]);
  }
  return salida;
}

/**
 * Redondea los quiebros de un perfil sin moverlos de sitio.
 *
 * La ficha pide cantos "slightly_softened" de 0,25 a 0,4 mm. A esa escala no se
 * ve el radio: lo que se ve es que el filo deja de brillar como una linea
 * blanca de un pixel. Se hace retranqueando el vertice por sus dos lados y
 * curvando entre los dos con el propio vertice de control, que nunca se pasa
 * de largo aunque el radio sea mayor que el tramo.
 *
 * @param {Array<[number,number]>} muestras
 * @param {number[]} radios  uno por vertice interior, en el mismo orden
 * @param {number} pasos     "edge_radius_segments" de la ficha
 */
function redondear(muestras, radios, pasos = 2) {
  if (pasos < 1) return muestras;
  const salida = [muestras[0]];
  for (let i = 1; i < muestras.length - 1; i++) {
    const r = radios[i - 1] ?? 0;
    const [ax, ay] = muestras[i - 1];
    const [bx, by] = muestras[i];
    const [cx, cy] = muestras[i + 1];
    const la = Math.hypot(bx - ax, by - ay);
    const lc = Math.hypot(cx - bx, cy - by);
    // Nunca mas de la mitad del tramo, o dos vertices seguidos se comerian.
    const ra = Math.min(r, la / 2);
    const rc = Math.min(r, lc / 2);
    if (!(ra > 1e-6) || !(rc > 1e-6)) { salida.push([bx, by]); continue; }
    const p0 = [bx + ((ax - bx) / la) * ra, by + ((ay - by) / la) * ra];
    const p2 = [bx + ((cx - bx) / lc) * rc, by + ((cy - by) / lc) * rc];
    for (let k = 0; k <= pasos; k++) {
      const t = k / pasos, u = 1 - t;
      salida.push([
        u * u * p0[0] + 2 * u * t * bx + t * t * p2[0],
        u * u * p0[1] + 2 * u * t * by + t * t * p2[1],
      ]);
    }
  }
  salida.push(muestras[muestras.length - 1]);
  return salida;
}

/**
 * "Classic Double Step Bevel", de la ficha classic_double_step_bevel_001.
 *
 * Esta si cuadra sola: 1,4 sobre 3 son los 25 grados que declara, 2,4 sobre 6,5
 * son 20,3 y 0,2 sobre 2,5 son 4,6. No hay que elegir entre el angulo y la
 * medida.
 *
 * De la ficha se toma la FORMA, no el sentido. Ella pone la z a cero en el
 * campo y la hace crecer hacia el marco, o sea el campo hundido; pero el
 * realzado de estas puertas va al reves, con el campo levantado y la caida
 * hacia el armazon. Los cuatro tramos se conservan en el mismo orden contado
 * desde el campo (inner_bevel pegado a el, outer_transition contra el marco):
 * lo unico que cambia es el signo. Son 14 mm de ancho para 4 de resalte.
 *
 * Va en milimetros absolutos y NO se normaliza: son medidas de taller.
 *
 * @param {number} rientro  lo que se esconde en la ranura antes de empezar
 * @param {number} mitad    media altura del panel, o sea la cara de fuera
 */
function dobleEscalon(rientro, mitad) {
  // De fuera hacia dentro, que es como se recorre aqui. La ficha los numera al
  // reves; el radio es el del vertice donde ARRANCA cada tramo.
  const TRAMOS = [
    { ancho: 2.5, sube: 0.2, radio: 0.4 },  // outer_transition
    { ancho: 6.5, sube: 2.4, radio: 0.4 },  // main_bevel
    { ancho: 2.0, sube: 0.0, radio: 0.3 },  // middle_step
    { ancho: 3.0, sube: 1.4, radio: 0.3 },  // inner_bevel
  ];
  const resalte = TRAMOS.reduce((t, x) => t + x.sube, 0);

  let d = 0;
  // Se ancla en el campo, que es lo alto y lo que se ve, y se baja desde ahi.
  let h = mitad - resalte;
  const crudo = [[0, h]];
  const radios = [];

  // La lengueta: llana y escondida bajo el labio del armazon.
  if (rientro > 0) { d += rientro; crudo.push([d, h]); }

  for (const t of TRAMOS) {
    radios.push(t.radio);
    d += t.ancho;
    h += t.sube;
    crudo.push([d, h]);
  }
  // El ultimo vertice es donde el bisel muere en el campo: "inner_edge", 0,25.
  radios.push(0.25);
  if (rientro > 0) radios.unshift(0.4);

  return redondear(crudo, radios, 2);
}

/* La seccion que el cliente dibujo en la CARRARA, punto por punto. El campo
   queda arriba (10,5 = media de los 21 del panel) y el canto abajo, a 2,67.
   Copia exacta de la de puertas3d/src/geom/perfiles.js. */
const CARRARA = [
  [0, 2.67], [6.98, 2.67], [6.98, 4.27], [11.34, 4.27], [11.34, 5.87],
  [15.7, 5.87], [30, 5.5], [33.9, 5.6], [34.01, 10.5], [37.5, 10.5],
];
const CARRARA_CAMPO = 10.5;

function dobleEscalonCarrara(rientro, mitad) {
  // Anclado al campo: el campo es la cara de fuera y no se mueve.
  return CARRARA.map(([d, h]) => [d, mitad - (CARRARA_CAMPO - h)]);
}

/* EL ESCALONADO DEL TIPO 1, en milimetros de taller. Copia exacta de la de
   puertas3d/src/geom/perfiles.js, donde esta el porque largo: era una forma
   normalizada que se estiraba con el biselAncho de cada archivo, asi que la
   misma bugna de catalogo salia de un ancho en una puerta y de otro en la
   siguiente. El TIPO 2 y 3 ya iban en milimetros absolutos; esta tambien.
   37,5 de ancho y 7,76 de resalte es lo que daba el TIPO 1 de catalogo. */
const ESCALONADO = componer([
  { plano: 10 },          // la lengüeta que entra en la ranura
  { filete: 2 },          // primer escalón, el que dibuja la línea de fuera
  { plano: 4 },
  { ovolo: [22, 4] },     // la curva
  { plano: 6 },           // el descanso
  { filete: 2.5 },        // el filete contra el campo
  { plano: 4 },
], 3);
const ESCALONADO_ANCHO = 46;    // lo que suman los tramos de arriba
const ESCALONADO_CANTO = 3;     // la cota del canto: el alturaCanto de componer
const ESCALONADO_CAMPO = 11.5;  // la del campo
const TIPO1_ANCHO = 37.5;
const TIPO1_RESALTE = 7.76;

function escalonadoTipo1(rientro, mitad) {
  const kd = TIPO1_ANCHO / ESCALONADO_ANCHO;
  const kh = TIPO1_RESALTE / (ESCALONADO_CAMPO - ESCALONADO_CANTO);
  // Anclado al campo, igual que la CARRARA.
  return ESCALONADO.map(([d, h]) => [d * kd, mitad - (ESCALONADO_CAMPO - h) * kh]);
}

/* LA BUGNA TIPO 1 DE FABRICA. La trazo Julian a mano en el corte de la bugna
   («BUGNA TIPO 1», 3 oct 2026), sobre un panel de 21 mm con 16 de lengüeta y
   CON LA MOLDURA TIPO 1 DIBUJADA DE FONDO: lo que su dibujo fija es la bugna
   respecto a la moldura. Sustituye a la escalonada de antes: «en cambio a la
   que teniamos, esta es la correcta, a todas las puertas TIPO 1».
   Cada punto: [entra desde el canto del panel, alto desde su centro], en mm,
   tal como se trazo: con el lomo de la moldura puesto en la linea del vano. */
const BUGNA_TIPO1_TRAZADA = [
  [0, 3.623], [8.211, 3.623], [8.211, 5.035], [11.472, 5.035], [13.714, 5.586],
  [15.956, 6.115], [18.198, 6.603], [20.439, 7.031], [22.681, 7.382], [24.923, 7.643],
  [26.904, 7.817], [29.749, 8.009], [36.3, 8.397], [53.857, 8.776], [53.901, 10.715],
];

/* LO QUE MIDE EL CUERPO DE LA MOLDURA TIPO 1: la meseta (3,1) y la gola
   (11,04). Es lo que va LABRADO EN EL ARMAZON, en la banda de 12 mm donde iba
   la gola de antes; hacia el panel solo sale la uña.
   El primer dia la pareja se monto entera por dentro del vano, con el lomo en
   la linea trazada: la gola caia 14 mm dentro del panel, el campo de la bugna
   empezaba a 37,9 de la linea en vez de a 21,5, y todas las puertas cambiaban
   de proporcion («me estas deformando las puertas», 4 oct 2026). Los numeros
   decian donde iba: la gola mide 11,04 —los 12 de la banda de siempre, con
   un filo de meseta— y el campo, medido desde el pie de la gola, empieza a
   23,8 —los 21,5 de la bugna de antes—. Asi que la pareja ENTERA se corre
   ese cuerpo hacia el armazon: el pie de la gola cae en la linea trazada, y
   moldura y bugna quedan entre si exactamente como se trazaron. */
const TIPO1_CUERPO = 14.136;
/* La lengüeta, lo que va escondido en la ranura, nunca mide menos de esto. */
const TIPO1_LENGUETA_MIN = 1.2;

/**
 * Corre una bugna trazada a mano CON LA GUIA DEL PRIMER DIA (el lomo de la
 * moldura en la linea del vano) a donde va hoy la pareja: el cuerpo de la
 * moldura hacia el armazon. Es la misma cuenta que bugnaTipo1; sirve para
 * abrir los archivos guardados aquel dia sin que la bugna quede 14 mm fuera
 * de sitio respecto a la moldura (ver migrarTipo1DelPrimerDia en proyecto.js).
 */
export function correrBugnaConLaMoldura(perfil) {
  const lengueta = perfil[0][1];
  const relieve = perfil.slice(1).map(([e, h]) => [e - TIPO1_CUERPO, h]);
  if (relieve[0][0] > TIPO1_LENGUETA_MIN) return [[0, lengueta], ...relieve];
  const i = relieve.findIndex(([e]) => e > TIPO1_LENGUETA_MIN);
  if (i < 1) return perfil.map(([e, h]) => [e, h]);
  const a = relieve[i - 1];
  const b = relieve[i];
  const t = (TIPO1_LENGUETA_MIN - a[0]) / (b[0] - a[0]);
  return [[0, lengueta], [TIPO1_LENGUETA_MIN, lengueta], [TIPO1_LENGUETA_MIN, a[1] + t * (b[1] - a[1])], ...relieve.slice(i)];
}

/* A su medida. Con otra lengüeta corre todo el relieve; con otro grueso queda
   anclada al campo, como las demas de fabrica. */
function bugnaTipo1(rientro = 16, mitad = 10.5) {
  const dh = mitad - 10.5;
  const corre = (rientro ?? 16) - 16 - TIPO1_CUERPO;
  const lengueta = BUGNA_TIPO1_TRAZADA[0][1] + dh;
  const relieve = BUGNA_TIPO1_TRAZADA.slice(1).map(([e, h]) => [e + corre, h + dh]);
  if (relieve[0][0] > TIPO1_LENGUETA_MIN) return [[0, lengueta], ...relieve];
  /* El arranque del relieve cae fuera del panel: se corta donde acaba la
     lengüeta minima y de ahi se sube al relieve. Todo eso queda bajo el
     armazon y no se ve. */
  const i = relieve.findIndex(([e]) => e > TIPO1_LENGUETA_MIN);
  if (i < 1) return [[0, lengueta], [TIPO1_LENGUETA_MIN, lengueta], [TIPO1_LENGUETA_MIN, relieve[relieve.length - 1][1]]];
  const a = relieve[i - 1];
  const b = relieve[i];
  const t = (TIPO1_LENGUETA_MIN - a[0]) / (b[0] - a[0]);
  return [
    [0, lengueta], [TIPO1_LENGUETA_MIN, lengueta],
    [TIPO1_LENGUETA_MIN, a[1] + t * (b[1] - a[1])],
    ...relieve.slice(i),
  ];
}

export const PERFILES = {
  dobleEscalon: {
    nombre: 'Doble escalón clásico (ficha de fábrica)',
    construir: dobleEscalon,
    anchoTotal: 14, // sin contar la lengueta
  },
  siena: { nombre: 'Siena (de fábrica)', muestras: normalizar(SIENA) },

  /* Medidos sobre la malla del modelo 3D con tools/seccion-malla.py, no
     inventados. El modelo trae las dos piezas seguidas en un mismo corte: la
     moldura la lleva el ARMAZON y el chaflan el PANEL, que es la separacion
     que no estaba clara. Las cotas de abajo son a escala de 45 mm de canto. */
  molduraMueble: {
    nombre: 'Moldura del armazón (del modelo 3D)',
    muestras: normalizar(acumular([
      [7.44, -0.37], [2.48, -7.94], [2.73, -0.87], [4.47, -3.97], [1.99, -3.85],
      [0.99, -7.44], [2.48, -0.37], [3.72, -1.86], [0.99, -8.44], [7.94, 2.98],
    ])),
  },
  chaflanMueble: {
    nombre: 'Chaflán del panel (del modelo 3D)',
    muestras: normalizar(acumular([[5.96, 9.06], [1.99, 0.99]])),
  },

  /* Escalonados. El filete es lo que marca el borde: sin el, por mucha curva
     que tenga el perfil, el realzado se lee como una rampa. */
  escalonado: {
    /* LA BUGNA DEL TIPO 1. En milimetros de taller, con `construir`, igual
       que la del TIPO 2 y 3: la seccion esta arriba, en escalonadoTipo1. */
    nombre: 'Bugna TIPO 1',
    construir: bugnaTipo1,
    /* anchoDelPerfil le SUMA el rientro: desde la linea del vano, el campo
       empieza a 23,8 mm (37,9 trazados menos el cuerpo de la moldura). */
    anchoTotal: 23.765,
  },
  doble: {
    /* LA BUGNA DE LOS TIPOS 2 Y 3, la de verdad.
       Aqui habia una forma generica normalizada —la que se estira con el
       tamano del panel— y por eso la bugna del configurador no se parecia a
       la de las puertas trazadas: el nombre coincidia, el dibujo no.
       Estos son los puntos que el cliente ajusto a mano sobre la CARRARA TIPO
       2 CON BUGNA, tomados del panel de bisel 4, y van en MILIMETROS DE
       TALLER para que no se deformen de un panel a otro. Son los mismos que
       lleva puertas3d: los dos motores tienen que decir lo mismo. */
    nombre: 'TIPO 2 y 3 · doble escalón',
    construir: dobleEscalonCarrara,
    /* VEINTIUNO Y MEDIO: anchoDelPerfil le SUMA el rientro, y el perfil mide
       37,5 con el arranque ya dentro. Poner 37,5 aqui diria 53,5. */
    anchoTotal: 21.5,
  },
  filete: {
    nombre: 'Filete seco',
    muestras: normalizar(componer([
      { plano: 14 },
      { filete: 3 },          // un solo escalón, a plomo y sin curva
      { plano: 10 },
      { filete: 3 },
      { plano: 8 },
    ], 3)),
  },
  chaflan: { nombre: 'Chaflán recto', muestras: chaflan() },
  bocel: { nombre: 'Bocel', muestras: bocel() },
  media: { nombre: 'Media caña', muestras: media() },
  plano: { nombre: 'Sin relieve', muestras: [[0, 1], [1, 1]] },
};

/**
 * Devuelve el perfil escalado a milimetros.
 *
 * @param {string} clave
 * @param {number} ancho    cuanto entra el relieve, en mm
 * @param {number} espesor  espesor total de la pieza, en mm
 */
export function perfilEnMm(clave, ancho, espesor, rientro = 0) {
  /* Una lista de puntos en vez de un nombre: es un perfil dibujado a mano en
     el editor de seccion. Ya viene en milimetros y con el rientro incluido, asi
     que no se toca. */
  if (Array.isArray(clave)) return clave.map(([d, h]) => [d, h]);
  const p = PERFILES[clave] ?? PERFILES.siena;
  const mitad = espesor / 2;
  // Los perfiles con `construir` vienen ya en milimetros de taller: no se
  // escalan, porque sus medidas son absolutas y no proporciones.
  if (p.construir) return p.construir(rientro, mitad);
  return p.muestras.map(([d, h]) => [d * ancho, h * mitad]);
}

/** Cuanto ocupa el relieve de un perfil, contando la lengueta escondida. */
export function anchoDelPerfil(clave, ancho, rientro = 0) {
  if (Array.isArray(clave)) return clave.length ? clave[clave.length - 1][0] : 0;
  const p = PERFILES[clave] ?? PERFILES.siena;
  return p.anchoTotal != null ? rientro + p.anchoTotal : ancho;
}

/**
 * Quita muestras que no aportan.
 *
 * El DXF da una cada nueve decimas de milimetro y no hacen falta: entre dos
 * muestras casi alineadas la superficie sale igual de suave con la mitad de
 * triangulos. Se conservan siempre los quiebros, que son los que se notan.
 */
export function aligerar(muestras, tolerancia = 0.04) {
  if (muestras.length < 3) return muestras;
  const salida = [muestras[0]];
  for (let i = 1; i < muestras.length - 1; i++) {
    const a = salida[salida.length - 1];
    const b = muestras[i];
    const c = muestras[i + 1];
    // Distancia de b a la recta a-c: si es despreciable, b no cambia la forma.
    const dx = c[0] - a[0];
    const dy = c[1] - a[1];
    const largo = Math.hypot(dx, dy) || 1;
    const desvio = Math.abs((b[0] - a[0]) * dy - (b[1] - a[1]) * dx) / largo;
    if (desvio > tolerancia) salida.push(b);
  }
  salida.push(muestras[muestras.length - 1]);
  return salida;
}

/**
 * El perfil del BASTONE, en milimetros y ya sin normalizar.
 *
 * El bastone es el filo interior del armazon: la CAIDA desde la cara del
 * travesano o del larguero hasta el panel. No pertenece al panel — pertenece a
 * la madera que lo rodea, y por eso la marca la misma pieza que hace el hueco.
 *
 * La fabrica nombra tres acabados, y son ESTOS TRES remates los que los
 * distinguen. Sale de las tres versiones trazadas de la ROMA, que son la misma
 * puerta y solo se diferencian en esto:
 *
 *   doppioGradinoCurvo  doble escalon, medio curvo  -> TIPO 1
 *   cavetto             media cana                  -> TIPO 2
 *   vivo                arista viva                 -> TIPO 3
 *
 * El TIPO 3 ademas lleva el panel LISO: papel 'pannello' en vez de 'bugnato',
 * sin bisel y sin perfil de bugna. Los tipos 1 y 2 comparten panel realzado y
 * solo cambian el remate.
 *
 * Las otras molduras de aqui abajo no son de catalogo: estan para trazar.
 *
 * Va al reves que el perfil de un panel: alto por fuera y bajo por dentro. El
 * tejido no distingue —solo coloca anillos a las alturas que se le den— asi que
 * basta con darle las alturas en orden descendente.
 *
 * @param {number} ancho    cuanto ocupa la caida, en mm
 * @param {number} caraHoja cota de la cara de la hoja (media de su espesor)
 * @param {number} fondo    cota donde muere contra el panel
 * @param {string} forma    'sagomato' | 'tondo' | 'vivo'
 */
/**
 * Las molduras que rematan el encuentro del armazon con la bugna.
 *
 * Son las que decoran la union del larguero y el travesano con el panel: una
 * banda estrecha que da la vuelta al vano. Cambiarla cambia el caracter de la
 * puerta entera aunque el despiece sea el mismo, que es por lo que hay diez y
 * no una.
 *
 * Convenio de la seccion, el que espera geometriaBugna: la d va del canto de
 * FUERA (ya dentro del armazon, a ras de su cara) hacia DENTRO, hasta topar
 * con el panel; la z es absoluta, de caraHoja abajo hasta fondo. Cada forma se
 * describe con u de 0 a 1 a lo ancho y con la fraccion de caida ya recorrida,
 * asi que todas valen para cualquier ancho y cualquier profundidad.
 */
const PASOS_CURVA = 10;

const cuarto = (t) => (t * Math.PI) / 2;

/** Cada entrada devuelve pares [u, caido] con u y caido de 0 a 1. */
const FORMAS = {
  vivo: () => [[0, 0], [0, 1], [1, 1]],

  smusso: () => [[0, 0], [1, 1]],

  sagomato: () => [[0, 0], [0.16, 0], [0.16, 0.18], [1, 1]],

  // Convexa: sale llana de la cara y se desploma al final. Es el ovolo.
  tondo: () => Array.from({ length: PASOS_CURVA + 1 }, (_, i) => {
    const t = cuarto(i / PASOS_CURVA);
    return [Math.sin(t), 1 - Math.cos(t)];
  }),

  // Concava: cae de golpe y se tiende al llegar al panel. Es el reverso.
  cavetto: () => Array.from({ length: PASOS_CURVA + 1 }, (_, i) => {
    const t = cuarto(i / PASOS_CURVA);
    return [1 - Math.cos(t), Math.sin(t)];
  }),

  // Ese: concava arriba y convexa abajo. La moldura clasica de armario.
  gola: () => Array.from({ length: 2 * PASOS_CURVA + 1 }, (_, i) => {
    const u = i / (2 * PASOS_CURVA);
    const t = cuarto(u < 0.5 ? u * 2 : (u - 0.5) * 2);
    return u < 0.5
      ? [(1 - Math.cos(t)) / 2, Math.sin(t) / 2]
      : [0.5 + Math.sin(t) / 2, 0.5 + (1 - Math.cos(t)) / 2];
  }),

  // Ese al reves: convexa arriba y concava abajo.
  talon: () => Array.from({ length: 2 * PASOS_CURVA + 1 }, (_, i) => {
    const u = i / (2 * PASOS_CURVA);
    const t = cuarto(u < 0.5 ? u * 2 : (u - 0.5) * 2);
    return u < 0.5
      ? [Math.sin(t) / 2, (1 - Math.cos(t)) / 2]
      : [0.5 + (1 - Math.cos(t)) / 2, 0.5 + Math.sin(t) / 2];
  }),

  /* Junquillo: filete, media cana entera y filete. La media cana coge una
     sombra fina que le da al vano una linea muy marcada. */
  astragalo: () => {
    const pts = [[0, 0], [0.12, 0]];
    for (let i = 0; i <= PASOS_CURVA; i++) {
      const t = (i / PASOS_CURVA) * Math.PI;
      pts.push([0.12 + (1 - Math.cos(t)) / 2 * 0.62, 0.42 - Math.sin(t) * 0.34]);
    }
    pts.push([0.74, 0.42], [1, 1]);
    return pts;
  },

  doppioGradino: () => [[0, 0], [0.34, 0], [0.34, 0.45], [0.68, 0.45], [0.68, 1], [1, 1]],

  /* El doble escalon, pero con la huella de en medio combada en vez de llana.
     Los dos peldanos siguen ahi —de frente se sigue leyendo como un doble
     escalon— y lo que cambia es que entre ellos, donde antes habia una linea
     recta que devolvia un brillo plano, ahora hay una curva que arranca
     horizontal y se va tumbando. Al sesgo se le corre un degradado por encima
     en lugar de encenderse de golpe. */
  doppioGradinoCurvo: () => {
    const A_PLANO = 0.32;   // la huella de arriba, a ras de la cara
    const A_CURVA = 0.34;   // la de en medio, la que va combada
    const C_ALTO = 0.30;    // lo que baja el primer peldano
    const C_CURVA = 0.32;   // lo que baja la curva
    const pts = [[0, 0], [A_PLANO, 0], [A_PLANO, C_ALTO]];
    // Arranca horizontal y termina cayendo: si fuese al reves, la curva
    // saldria del peldano en vertical y el escalon se perderia.
    for (let i = 1; i <= PASOS_CURVA; i++) {
      const t = cuarto(i / PASOS_CURVA);
      pts.push([A_PLANO + A_CURVA * Math.sin(t), C_ALTO + C_CURVA * (1 - Math.cos(t))]);
    }
    pts.push([A_PLANO + A_CURVA, 1], [1, 1]);
    return pts;
  },

  /* Uña: una banda ancha a ras de la cara y un redondeo corto y cerrado justo
     al borde del panel. Discreta de frente y muy viva al sesgo. */
  unghietta: () => {
    const pts = [[0, 0], [0.58, 0]];
    for (let i = 1; i <= PASOS_CURVA; i++) {
      const t = cuarto(i / PASOS_CURVA);
      pts.push([0.58 + 0.42 * Math.sin(t), 1 - Math.cos(t)]);
    }
    return pts;
  },
};

/* Los tres de catalogo van primero y llevan el TIPO en el nombre: quien traza
   los ve juntos al principio del selector y el archivo guardado queda
   identificado sin tener que acordarse de que 'cavetto' era el TIPO 2. */
/* LA MOLDURA TIPO 1 DE FABRICA, a su medida real: la trazo Julian sobre la
   captura del perfil («moldura tipo 1», 3 oct 2026), 17,5 mm de alto.
   Cada punto: [a lo ancho desde el lomo, cuanto baja desde la cara de la
   hoja], en mm. De izquierda a derecha: la meseta (de 0 a 3,1), la gola
   (hasta 14,136) y la uña (de 14,136 a 26,127), que es lo unico que se
   extiende sobre el panel.
   DONDE VA: el cuerpo —meseta y gola— labrado en el armazon, en la banda que
   el armazon se aparta del vano (12 mm), con el pie de la gola en la linea
   trazada; la uña, por dentro, sobre el panel. Ver TIPO1_CUERPO.
   LA UÑA SE VE SOBRE UN PANEL LISO. Con la bugna TIPO 1 queda medio milimetro
   BAJO la bugna (cara de la uña a z 6,06; la bugna pasa por ahi a 6,5-7,0):
   asi esta en el trazado de Julian, y lo que se ve es la gola y un escalon de
   1,6 mm en la linea del vano. Para verla sobre la bugna habria que retrazar
   la bugna mas baja en esos 12 mm; no sale de correrla. */
const TIPO1_FABRICA = [
  [0, 0], [3.1, 0], [3.549, 1.552], [4.201, 3.03], [5.044, 4.408], [6.063, 5.662],
  [7.187, 6.677], [8.436, 7.534], [9.795, 8.151], [11.105, 8.868], [12.005, 9.671],
  [12.802, 10.576], [13.305, 11.458], [13.699, 12.394], [13.977, 13.371], [14.136, 14.374],
  [14.136, 16.441], [26.127, 16.441], [26.127, 17.5],
];
const TIPO1_MOLDE = {
  nombre: 'Moldura TIPO 1',
  perfilMm: TIPO1_FABRICA,
  cuerpo: TIPO1_CUERPO,   // meseta + gola: lo que va en el armazon
  meseta: 3.1,
  banda: 12,              // lo que se aparta el armazon si la pieza no dice otro ancho
  /* La que va en su lugar donde ella no puede ir: en un vano con cristal —la
     uña taparia vidrio— y donde no cabe limpia. Es la gola de antes. */
  pequena: 'golaPequena',
  // La misma forma en 0..1, para la miniatura del selector.
  forma: () => TIPO1_FABRICA.map(([e, baja]) => [e / 26.127, baja / 17.5]),
};

export const MOLDURAS = {
  /* Los tres de fabrica, sacados de los trazados (LAGUNA en sus tres tipos,
     CARRARA TIPO 2). Antes figuraban doppioGradinoCurvo, cavetto y vivo con
     estos numeros y no es ninguna de las tres. */
  /* «gola» era la TIPO 1 aproximada: ahora ES la de fabrica, asi todas las
     puertas TIPO 1 la llevan sin tocar su archivo. «tipo1» es el nombre con
     que la guarda algun archivo del editor: el mismo molde. */
  gola: TIPO1_MOLDE,
  tipo1: { ...TIPO1_MOLDE, oculta: true },
  /* La gola de catalogo, la que habia antes de tener la de fabrica. Es la
     que llevan los vidrios de una puerta TIPO 1, y se puede elegir suelta. */
  golaPequena: { nombre: 'Gola pequeña (la de los vidrios)', forma: FORMAS.gola },
  astragalo: { nombre: 'TIPO 2 · junquillo', forma: FORMAS.astragalo },
  smusso: { nombre: 'TIPO 3 · chaflán a 45°', forma: FORMAS.smusso },

  sagomato: { nombre: 'Filete y caída', forma: FORMAS.sagomato },
  cavetto: { nombre: 'Media caña', forma: FORMAS.cavetto },
  vivo: { nombre: 'Arista viva', forma: FORMAS.vivo },
  tondo: { nombre: 'Bocel', forma: FORMAS.tondo },
  doppioGradinoCurvo: { nombre: 'Doble escalón curvo', forma: FORMAS.doppioGradinoCurvo },
  talon: { nombre: 'Talón (ese invertida)', forma: FORMAS.talon },
  doppioGradino: { nombre: 'Doble escalón recto', forma: FORMAS.doppioGradino },
  unghietta: { nombre: 'Uña', forma: FORMAS.unghietta },
};

/* Un vano con cristal: de vidrio entero, realzado con vidrio en el campo, o
   panel con una zona de vidrio trazada dentro. */
export const esVanoDeVidrio = (p) =>
  p?.papel === 'vetro' || p?.papel === 'vetroSatinato' || p?.papel === 'bugnatoVetro'
  || p?.vidrioEnElCampo === true || (p?.vidrioPuntos?.length ?? 0) > 0
  || String(p?.acabado ?? '').startsWith('vidrio');

/**
 * LA MOLDURA QUE LE TOCA A UN VANO.
 *
 * La que diga la pieza, salvo una cosa: la de fabrica a su medida saca una
 * uña de 12 mm por dentro del vano. Sobre un panel de madera es lo suyo; sobre
 * un cristal es comerse el vidrio —en una puerta de cuarterones tapaba hasta
 * el 60 % de cada luz—.
 * LA REGLA ES POR PUERTA (`conVidrio`): una puerta con ventanas lleva SOLO la
 * pequeña, en todos sus vanos, tambien en sus paneles de madera: la gola de
 * catalogo, labrada en el armazon y sin tocar el vidrio, como estaba. Asi no
 * conviven dos molduras distintas en la misma puerta («las puertas con
 * ventanas solo la moldura pequeña», 4 oct 2026). La de fabrica con su uña
 * queda para las puertas de solo madera.
 * (Donde la de fabrica no cabe limpia tambien va la pequeña; eso lo decide
 * quien teje, que es quien tiene el contorno: ver geometriaBastone.)
 */
export function molduraDelVano(p, { conVidrio = false } = {}) {
  const pedida = MOLDURAS[p?.bastoneForma] ? p.bastoneForma : 'sagomato';
  const molde = MOLDURAS[pedida];
  if (molde.perfilMm && (conVidrio || esVanoDeVidrio(p))) {
    return { clave: molde.pequena, molde: MOLDURAS[molde.pequena], deFabrica: false };
  }
  return { clave: pedida, molde, deFabrica: !!molde.perfilMm };
}

/** La clave de la moldura que se teje de verdad en ese vano. */
export const formaDeMoldura = (p, o) => molduraDelVano(p, o).clave;

/* Cuanto se aparta el armazon para la moldura del vano. TODAS van labradas en
   el: las de catalogo le quitan su ancho, y la de fabrica la banda donde va
   su cuerpo —el ancho de la pieza, o sus 12 mm si la pieza no dice ninguno—.
   No depende de si al final se teje la de fabrica o su pequeña: el armazon se
   aparta lo mismo, y asi las holguras con que estan dibujadas las piezas
   quedan siempre debajo del aro. (El primer dia la de fabrica no apartaba
   nada y esas holguras salieron como ranuras: 130 vanos en 36 puertas.) */
export const apartaDelArmazon = (p) => {
  const molde = MOLDURAS[p?.bastoneForma];
  const ancho = p?.bastoneAncho ?? 0;
  return molde?.perfilMm ? (ancho > 0 ? ancho : molde.banda) : ancho;
};

/* Cuanto se corre una moldura de fabrica hacia el armazon: su cuerpo entero
   si la banda da para la gola; si no, hasta donde llegue (la meseta es lo
   primero que se pierde, que es madera lisa a ras de cara). */
const correDeFabrica = (molde, banda) => Math.min(molde.cuerpo, banda + molde.meseta);

/**
 * La seccion de una moldura de fabrica, lista para tejer.
 * @returns {number[][]} [distancia desde el borde de fuera de la banda, z]
 */
export function perfilDeFabricaEnMm(molde, banda, caraHoja) {
  const corre = correDeFabrica(molde, banda);
  /* La meseta arranca 0,1 mm BAJO la cara: el armazon se mete 0,4 mm en esta
     banda (HOLGURA de efectivo.js) y, a la misma cota, las dos caras caerian
     en el mismo plano y parpadearian a lo largo del filo. */
  const pts = [[0, caraHoja - molde.perfilMm[0][1] - 0.1]];
  for (const [e, baja] of molde.perfilMm) {
    const d = e - corre + banda;
    // La meseta que cae fuera de la banda ya es armazon: no se repite.
    if (d > 1e-6) pts.push([d, caraHoja - baja]);
  }
  return pts;
}

/** Cuanto entra una moldura de fabrica sobre el panel, desde la linea del vano. */
export const entraSobreElPanel = (molde, banda) =>
  molde.perfilMm[molde.perfilMm.length - 1][0] - correDeFabrica(molde, banda);

export function perfilBastoneEnMm(ancho, caraHoja, fondo, forma = 'sagomato') {
  const caida = caraHoja - fondo;
  const m = MOLDURAS[forma] ?? MOLDURAS.sagomato;
  return m.forma().map(([u, c]) => [u * ancho, caraHoja - c * caida]);
}
