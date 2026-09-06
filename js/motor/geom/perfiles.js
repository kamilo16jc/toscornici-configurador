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
    nombre: 'Escalonado',
    muestras: normalizar(componer([
      { plano: 10 },          // la lengüeta que entra en la ranura
      { filete: 2 },          // primer escalón, el que dibuja la línea de fuera
      { plano: 4 },
      { ovolo: [22, 4] },     // la curva
      { plano: 6 },           // el descanso
      { filete: 2.5 },        // el filete contra el campo
      { plano: 4 },
    ], 3)),
  },
  doble: {
    nombre: 'Doble escalón',
    muestras: normalizar(componer([
      { plano: 8 },
      { filete: 1.8 },
      { plano: 5 },
      { filete: 1.8 },
      { plano: 5 },
      { rampa: [16, 3] },
      { plano: 5 },
      { filete: 2.2 },
      { plano: 4 },
    ], 3)),
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
 * La fabrica ofrece tres remates, y cada uno va con su tipo de panel:
 *
 *   sagomato  caida recta con un filete arriba   -> TIPO 1
 *   tondo     caida redondeada, un cuarto bocel  -> TIPO 2
 *   vivo      caida a plomo, arista viva         -> TIPO 3
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

export const MOLDURAS = {
  sagomato: { nombre: 'Filete y caída', forma: FORMAS.sagomato },
  vivo: { nombre: 'Arista viva', forma: FORMAS.vivo },
  smusso: { nombre: 'Chaflán a 45°', forma: FORMAS.smusso },
  tondo: { nombre: 'Bocel', forma: FORMAS.tondo },
  cavetto: { nombre: 'Media caña', forma: FORMAS.cavetto },
  gola: { nombre: 'Gola (ese)', forma: FORMAS.gola },
  talon: { nombre: 'Talón (ese invertida)', forma: FORMAS.talon },
  astragalo: { nombre: 'Junquillo', forma: FORMAS.astragalo },
  doppioGradino: { nombre: 'Doble escalón', forma: FORMAS.doppioGradino },
  doppioGradinoCurvo: { nombre: 'Doble escalón, medio curvo', forma: FORMAS.doppioGradinoCurvo },
  unghietta: { nombre: 'Uña', forma: FORMAS.unghietta },
};

export function perfilBastoneEnMm(ancho, caraHoja, fondo, forma = 'sagomato') {
  const caida = caraHoja - fondo;
  const m = MOLDURAS[forma] ?? MOLDURAS.sagomato;
  return m.forma().map(([u, c]) => [u * ancho, caraHoja - c * caida]);
}
