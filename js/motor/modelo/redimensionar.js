/* ============================================================
   LLEVAR UNA PUERTA A OTRO ANCHO
   ------------------------------------------------------------
   Una puerta trazada mide lo que medía la puerta que se calcó.
   La Siena da 839,5 mm. Si el cliente pide 1300, o si hay que
   partirla en dos hojas, hace falta rehacerla a otra medida.

   Y REHACERLA NO ES ESCALARLA. Escalando, un larguero de 95 mm
   se va a 147 en una puerta de 1300 y a 48 en media hoja: deja
   de ser un larguero. En una puerta de verdad los largueros y
   los travesaños miden lo que miden —la madera viene en esas
   secciones— y lo que crece o mengua son los entrepaños.

   Así que el ancho se reparte por BANDAS:

     banda fija      la que ocupa una pieza vertical. Se
                     traslada entera, no cambia de ancho.
     banda elástica  lo que queda entre medias. Ahí van los
                     entrepaños, y ahí se absorbe la diferencia,
                     repartida a prorrata.

   Los montantes interiores salen bien solos: son piezas
   verticales, luego bandas fijas, luego conservan su sección y
   se separan entre sí. Que es lo que hace un carpintero.

   QUÉ ES UNA PIEZA VERTICAL. No basta el papel: hay trazados
   donde un travesaño está marcado como 'montante' —en la Siena
   el cabecero lo está— así que se mira la forma. Alta y estrecha
   es vertical; los campos (bugnas, paneles, vidrios) nunca lo
   son aunque sean más altos que anchos, porque un entrepaño
   vertical es justo lo que tiene que estirarse.
   ============================================================ */

import { cajaDe } from './proyecto.js';

/** Los campos: lo que rellena un hueco. Nunca son banda fija. */
const CAMPOS = new Set(['bugnato', 'bugnatoVetro', 'pannello', 'vetro', 'vetroSatinato']);

/** Los bordes en x de una pieza, sea cual sea su forma. */
export function bordesX(p) {
  if (p.tipo === 'elipse') return [p.cx - p.rx, p.cx + p.rx];
  if (p.tipo === 'trazado') {
    const xs = (p.nodos ?? []).map((n) => n.x);
    return xs.length ? [Math.min(...xs), Math.max(...xs)] : null;
  }
  if (typeof p.x === 'number' && typeof p.w === 'number') return [p.x, p.x + p.w];
  return null;
}

/** Alta y estrecha, y no es un campo. */
function esVertical(p) {
  if (CAMPOS.has(p.papel)) return false;
  const b = bordesX(p);
  if (!b) return false;
  const ancho = b[1] - b[0];
  const alto = p.tipo === 'elipse' ? 2 * p.ry
    : p.tipo === 'trazado'
      ? (() => { const ys = (p.nodos ?? []).map((n) => n.y); return ys.length ? Math.max(...ys) - Math.min(...ys) : 0; })()
      : (p.h ?? 0);
  return alto > ancho;
}

/** Une los intervalos que se tocan o se solapan. */
function fusiona(intervalos) {
  const orden = intervalos.slice().sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const iv of orden) {
    const ult = out[out.length - 1];
    if (ult && iv[0] <= ult[1] + 0.01) ult[1] = Math.max(ult[1], iv[1]);
    else out.push([iv[0], iv[1]]);
  }
  return out;
}

/**
 * La función que lleva una x vieja a su x nueva.
 *
 * Se recorre el ancho de izquierda a derecha alternando bandas: las fijas se
 * copian tal cual y las elásticas se multiplican por k. Es continua, así que
 * una pieza que empiece dentro de una banda y acabe en otra sigue encajando
 * con sus vecinas.
 */
function mapaDe(bandas, x0, k) {
  return (x) => {
    let viejo = x0;
    let nuevo = x0;
    for (const [a, b] of bandas) {
      if (x <= a) return nuevo + (x - viejo) * k;      // en la elástica previa
      nuevo += (a - viejo) * k;                        // cruzada la elástica
      viejo = a;
      if (x <= b) return nuevo + (x - viejo);          // dentro de la fija
      nuevo += b - a;                                  // cruzada la fija
      viejo = b;
    }
    return nuevo + (x - viejo) * k;                    // en la elástica final
  };
}

/**
 * Rehace las piezas para que la hoja mida `anchoDestino`.
 *
 * Devuelve copias; el proyecto original no se toca. Si no se puede —no hay
 * banda elástica donde absorber, o la puerta se pide tan estrecha que los
 * largueros no caben— devuelve null en vez de entregar algo deforme.
 *
 * @param {Array<object>} piezas   las piezas visibles de la hoja
 * @param {number} anchoDestino    en milímetros
 */
export function aAncho(piezas, anchoDestino) {
  const conBordes = piezas.map((p) => ({ p, b: bordesX(p) })).filter((e) => e.b);
  if (!conBordes.length || !(anchoDestino > 0)) return null;

  const x0 = Math.min(...conBordes.map((e) => e.b[0]));
  const x1 = Math.max(...conBordes.map((e) => e.b[1]));
  const actual = x1 - x0;
  if (!(actual > 0)) return null;
  if (Math.abs(anchoDestino - actual) < 0.01) return piezas.map((p) => ({ ...p }));

  const fijas = fusiona(conBordes.filter((e) => esVertical(e.p)).map((e) => e.b));

  // lo elástico es lo que queda entre las fijas
  let elastico = actual;
  for (const [a, b] of fijas) elastico -= Math.min(b, x1) - Math.max(a, x0);
  if (!(elastico > 1)) return null;                    // toda madera: no hay donde dar

  const k = (elastico + (anchoDestino - actual)) / elastico;
  if (!(k > 0.05)) return null;                        // se pide más estrecha que su propia madera

  const mapa = mapaDe(fijas, x0, k);

  return piezas.map((p) => {
    const q = { ...p };
    if (p.tipo === 'elipse') {
      const a = mapa(p.cx - p.rx), b = mapa(p.cx + p.rx);
      q.cx = (a + b) / 2; q.rx = (b - a) / 2;
    } else if (p.tipo === 'trazado') {
      q.nodos = (p.nodos ?? []).map((n) => ({ ...n, x: mapa(n.x) }));
    } else if (typeof p.x === 'number' && typeof p.w === 'number') {
      const a = mapa(p.x), b = mapa(p.x + p.w);
      q.x = a; q.w = b - a;
    }
    // los calados viajan con su pieza
    if (Array.isArray(p.huecos) && p.huecos.length) {
      q.huecos = p.huecos.map((h) => (Array.isArray(h) ? h.map((pt) =>
        (Array.isArray(pt) ? [mapa(pt[0]), pt[1]] : { ...pt, x: mapa(pt.x) })) : h));
    }
    return q;
  });
}

/**
 * Parte la puerta en hojas, cada una rehecha a su ancho.
 *
 * NO se corta: cada hoja es la puerta entera reconstruida más estrecha, con
 * sus dos largueros y sus entrepaños completos. Cortándola, la hoja se
 * quedaría sin larguero por el lado del corte y con medio entrepaño — que es
 * lo que se ve en cuanto se mira una puerta de dos hojas de verdad.
 *
 * Las hojas se devuelven con su x ya corrida, de izquierda a derecha, para que
 * quien las monte solo tenga que colgarlas.
 *
 * @param {Array<object>} piezas  las piezas de la hoja trazada
 * @param {number} anchoTotal     el ancho del hueco a cubrir
 * @param {Array<number>} reparto fracciones que suman 1. [0.5,0.5] simétrica,
 *                                [0.34,0.66] asimétrica. Una sola hoja: [1]
 * @param {number} luz            holgura entre hojas, en mm
 */
export function enHojas(piezas, anchoTotal, reparto = [0.5, 0.5], luz = 3) {
  const n = reparto.length;
  if (n < 1) return null;
  const suma = reparto.reduce((s, r) => s + r, 0);
  if (!(suma > 0)) return null;

  const util = anchoTotal - luz * (n - 1);
  if (!(util > 0)) return null;

  const hojas = [];
  let x = 0;
  for (const frac of reparto) {
    const ancho = (util * frac) / suma;
    const rehecha = aAncho(piezas, ancho);
    if (!rehecha) return null;                        // si una no cabe, no hay puerta

    // se lleva a su sitio: la primera a 0, las siguientes detrás de la anterior
    const b = rehecha.map(bordesX).filter(Boolean);
    const izq = Math.min(...b.map((e) => e[0]));
    const dx = x - izq;
    hojas.push({ ancho, x, piezas: rehecha.map((p) => corre(p, dx)) });
    x += ancho + luz;
  }
  return hojas;
}

/**
 * Las líneas por donde una puerta YA VIENE DIBUJADA en hojas.
 *
 * Hay puertas que no se calcan como una hoja para repetirla: se calcan enteras,
 * con sus dos hojas y sus cuatro largueros, tal como están en la foto. La
 * Alessandria Lux mide 1668 mm y trae las dos. A ésas no hay que rehacerlas
 * —ya están hechas—, hay que REPARTIRLAS.
 *
 * Y se reconocen por algo que no falla: en el encuentro de dos hojas NO HAY
 * NADA QUE CRUCE, y a cada lado del corte muere un larguero. Una puerta de una
 * hoja tiene siempre algo atravesando su centro —el entrepaño, el travesaño—;
 * una de dos tiene ahí dos largueros que se tocan de canto y nada más.
 *
 * Las dos condiciones hacen falta. Sólo con "nada cruza" también daría corte
 * una puerta de UNA hoja con montante central: a los lados del montante
 * tampoco cruza nadie. Pidiendo además que muera un larguero por cada lado, el
 * montante central se descarta solo, porque lo que muere contra él es un
 * entrepaño y un entrepaño no es un larguero.
 *
 * Probado contra las 62 puertas de la carpeta: sólo la Alessandria da corte, y
 * lo da al 50,0 % exacto.
 *
 * Las cajas se piden a cajaDe y NO a bordesX. bordesX mira las coordenadas de
 * los nodos y se deja las combas fuera, y esta puerta lleva dos medias lunas
 * cuyos cuatro nodos están en la misma x: con bordesX medirían cero de ancho y
 * habrían caído en la hoja equivocada.
 *
 * @returns {number[]|null} las x de los encuentros, o null si es de una hoja
 */
export function hojasDibujadas(piezas, tolerancia = 0.5) {
  const con = piezas
    .map((p) => ({ p, c: cajaDe(p) }))
    .filter((e) => Number.isFinite(e.c[0]) && e.c[2] > e.c[0]);
  if (con.length < 4) return null;

  const x0 = Math.min(...con.map((e) => e.c[0]));
  const x1 = Math.max(...con.map((e) => e.c[2]));
  const ancho = x1 - x0;
  if (!(ancho > 0)) return null;

  /* UN LARGUERO DE ENCUENTRO CORRE DE ARRIBA ABAJO. Eso es lo que es, y por eso
     se pide asi y no por la forma.

     Antes bastaba con «mas alto que ancho», y en la America Due eso partia la
     puerta en tres: el traverso del panel estrecho mide 190 x 210 mm, o sea un
     pelo mas alto que ancho, y colaba como larguero. Los largueros de verdad de
     esa misma puerta miden 95 x 2012 — relacion 21, no 1,1. Con un panel
     estrecho, cualquier travesaño suyo se vuelve «vertical» por accidente.

     Pidiendo que cruce la puerta entera no hay forma de confundirlos. */
  const y0 = Math.min(...con.map((e) => e.c[1]));
  const y1 = Math.max(...con.map((e) => e.c[3]));
  const altoPuerta = y1 - y0;
  const esLarguero = (e) => !CAMPOS.has(e.p.papel)
    && e.c[3] - e.c[1] >= altoPuerta * 0.8
    && e.c[3] - e.c[1] > e.c[2] - e.c[0];

  /* DOS LARGUEROS QUE SE PISAN UN PELO SIGUEN SIENDO UN ENCUENTRO.
     En casi todas estas puertas los dos largueros del encuentro se tocan de
     canto al milimetro. En la Liverpool Two no: se solapan 3,6 mm, y con la
     tolerancia de media decima cada uno contaba como que CRUZABA el corte del
     otro. Resultado: 1216 mm de ancho y 44 piezas saliendo como una sola hoja.

     Un calco hecho a mano sobre una foto no cierra a cero. Asi que al larguero
     de altura completa se le perdona un solape pequeño; al campo y al travesaño
     no, porque son ellos los que de verdad dicen que ahi no se puede partir. */
  const SOLAPE = 5;
  const holgura = (e) => (esLarguero(e) ? SOLAPE : tolerancia);

  const cortes = [];
  const candidatas = [...new Set(con.flatMap((e) => [e.c[0], e.c[2]]))].sort((a, b) => a - b);
  for (const x of candidatas) {
    const f = (x - x0) / ancho;
    if (f < 0.2 || f > 0.8) continue;
    if (con.some((e) => e.c[0] < x - holgura(e) && e.c[2] > x + holgura(e))) continue;
    if (!con.some((e) => Math.abs(e.c[2] - x) <= SOLAPE && esLarguero(e))) continue;
    if (!con.some((e) => Math.abs(e.c[0] - x) <= SOLAPE && esLarguero(e))) continue;
    // Dos cortes a un palmo uno de otro son el mismo encuentro contado dos veces.
    if (cortes.length && x - cortes[cortes.length - 1] < 20) continue;
    cortes.push(x);
  }
  return cortes.length ? cortes : null;
}

/**
 * Reparte una puerta ya dibujada en hojas, sin rehacerla.
 *
 * Cada pieza va a la hoja donde cae su centro, y no se toca ni una coordenada:
 * la puerta ya está dibujada como es. El trabajo aquí es sólo decir dónde acaba
 * una hoja y empieza la otra, para que cada una pueda colgar de su bisagra.
 *
 * Si se pide otro ancho total, entonces sí: cada hoja se rehace a su parte, a
 * prorrata de lo que medía y con el mismo reparto por bandas de `aAncho`, que
 * es lo que conserva los largueros.
 *
 * @param {number|null} anchoTotal  null = tal como se trazó, sin tocar nada
 * @param {number} luz  hueco entre hojas. Cero por defecto: en una puerta ya
 *   dibujada el hueco real ya está en el dibujo, y meter otro la ensancharía.
 */
export function repartirDibujadas(piezas, cortes, anchoTotal = null, luz = 0) {
  const con = piezas
    .map((p) => ({ p, c: cajaDe(p) }))
    .filter((e) => Number.isFinite(e.c[0]));
  if (!con.length || !cortes?.length) return null;

  const x0 = Math.min(...con.map((e) => e.c[0]));
  const x1 = Math.max(...con.map((e) => e.c[2]));
  const limites = [x0, ...cortes, x1];

  const bandas = [];
  for (let i = 0; i + 1 < limites.length; i++) {
    const a = limites[i];
    const b = limites[i + 1];
    const ultima = i + 2 === limites.length;
    const dentro = con
      .filter((e) => {
        const medio = (e.c[0] + e.c[2]) / 2;
        return medio >= a && (medio < b || ultima);
      })
      .map((e) => e.p);
    if (!dentro.length) return null;            // una hoja vacía no es una hoja
    bandas.push({ x: a, ancho: b - a, piezas: dentro });
  }

  if (anchoTotal == null) return bandas;

  const suma = bandas.reduce((s, b) => s + b.ancho, 0);
  const util = anchoTotal - luz * (bandas.length - 1);
  if (!(util > 0) || !(suma > 0)) return null;

  const salida = [];
  let x = x0;
  for (const banda of bandas) {
    const ancho = (util * banda.ancho) / suma;
    const rehecha = Math.abs(ancho - banda.ancho) < 0.01
      ? banda.piezas.map((p) => ({ ...p }))
      : aAncho(banda.piezas, ancho);
    if (!rehecha) return null;                  // si una no cabe, no hay puerta
    const cajas = rehecha.map((p) => cajaDe(p)).filter((c) => Number.isFinite(c[0]));
    const izq = Math.min(...cajas.map((c) => c[0]));
    salida.push({ ancho, x, piezas: rehecha.map((p) => corre(p, x - izq)) });
    x += ancho + luz;
  }
  return salida;
}

/** Corre una pieza dx milímetros. */
function corre(p, dx) {
  if (!dx) return p;
  const q = { ...p };
  if (p.tipo === 'elipse') q.cx = p.cx + dx;
  else if (p.tipo === 'trazado') q.nodos = (p.nodos ?? []).map((n) => ({ ...n, x: n.x + dx }));
  else if (typeof p.x === 'number') q.x = p.x + dx;
  return q;
}
