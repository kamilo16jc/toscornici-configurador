/**
 * El telaio y el vano de muro, montados desde el dibujo de fabrica.
 *
 * Aqui no se modela nada: cada pieza es su SECCION tirada a lo largo. Las
 * jambas son la seccion vertical estirada de suelo a dintel; el cabecero, la
 * seccion horizontal estirada de lado a lado. Es literalmente como sale de la
 * tupi, y es tambien como esta hecho el motor del configurador — por eso las
 * dos cosas encajan al milimetro.
 *
 * CONVENIO DE EJES. Los catalogos de fabrica sitúan la hoja de z = 0 a z = 45,
 * es decir apoyada en el cero. El editor la centra en z = 0, de -22,5 a 22,5.
 * Son el mismo objeto contado desde sitios distintos, asi que al montar hay que
 * restar medio espesor. Se hace una sola vez, al final, sobre el grupo entero.
 */

import * as THREE from 'three';
import { material as materialDe } from './materiales.js';

/** Perfil cerrado a partir de puntos [a, b]. */
function contorno(puntos) {
  const s = new THREE.Shape();
  puntos.forEach(([a, b], i) => (i ? s.lineTo(a, b) : s.moveTo(a, b)));
  s.closePath();
  return s;
}

/** Seccion en (X, Z) tirada a lo largo de Y. Jambas y largueros. */
export function tirarEnVertical(puntos, y0, y1) {
  const g = new THREE.ExtrudeGeometry(contorno(puntos.map(([x, z]) => [x, -z])), {
    depth: y1 - y0,
    bevelEnabled: false,
    curveSegments: 1,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  return g;
}

/** Seccion en (Y, Z) tirada a lo largo de X. Cabecero y travesanos. */
export function tirarEnHorizontal(puntos, x0, x1) {
  const g = new THREE.ExtrudeGeometry(contorno(puntos.map(([y, z]) => [-z, y])), {
    depth: x1 - x0,
    bevelEnabled: false,
    curveSegments: 1,
  });
  g.rotateY(Math.PI / 2);
  g.translate(x0, 0, 0);
  return g;
}

/**
 * Seccion tirada a lo largo de un RECORRIDO, no de una recta.
 *
 * Es `tirarEnHorizontal` cuando el recorrido es horizontal, y lo unico que
 * cambia al combarse es hacia donde mira el ALTO de la seccion: en un cabecero
 * recto mira siempre arriba, y en uno arqueado mira hacia afuera del arco, o
 * sea en radial. Por eso no vale tirarlo recto y curvarlo despues: el perfil se
 * abriria por el lomo y se cerraria por la garganta. Asi sale de la tupi y asi
 * se monta una vuelta de verdad.
 *
 * @param {number[][]} puntos  seccion en (y, z); `y` es una COTA, no un alto
 * @param {number[][]} camino  recorrido [x, y] por donde pasa el filo de arriba
 * @param {number} refY  la cota de la seccion que se apoya en el recorrido
 */
export function tirarPorElBorde(puntos, camino, refY) {
  /* El sentido de giro de la seccion no se supone, se MIDE. Los perfiles de
     fabrica no vienen todos dibujados igual, y con el giro al reves las caras
     miran hacia dentro: la pieza se vuelve invisible sin dar ningun error. */
  const area = puntos.reduce((s, [y, z], j) => {
    const [y2, z2] = puntos[(j + 1) % puntos.length];
    return s + (y * z2 - y2 * z);
  }, 0);
  const seccion = area >= 0 ? puntos : [...puntos].reverse();
  const n = seccion.length;

  /* La normal de cada estacion: perpendicular al avance y mirando hacia
     afuera. En un tramo horizontal sale (0, 1) y todo se reduce al caso recto,
     que es lo que hace que una puerta sin arco salga exactamente igual que
     antes. */
  const normales = camino.map((_, i) => {
    const a = camino[Math.max(0, i - 1)];
    const b = camino[Math.min(camino.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    return [-dy / d, dx / d];
  });

  const en = (i, j) => {
    const [y, z] = seccion[j];
    return [
      camino[i][0] + normales[i][0] * (y - refY),
      camino[i][1] + normales[i][1] * (y - refY),
      z,
    ];
  };

  const pos = [];
  const tri = (a, b, c) => pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);

  for (let i = 0; i + 1 < camino.length; i++) {
    for (let j = 0; j < n; j++) {
      const k = (j + 1) % n;
      const A = en(i, j);
      const B = en(i, k);
      const C = en(i + 1, k);
      const D = en(i + 1, j);
      tri(A, B, C);
      tri(A, C, D);
    }
  }

  /* Las dos testas. Sin ellas el cabecero se ve hueco por los extremos en
     cuanto la camara se sale del eje: una pieza barrida es un tubo. */
  const ultimo = camino.length - 1;
  for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(
    seccion.map(([y, z]) => new THREE.Vector2(y, z)),
    [],
  )) {
    tri(en(0, a), en(0, c), en(0, b));
    tri(en(ultimo, a), en(ultimo, b), en(ultimo, c));
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  // Sin indexar, igual que la cornisa: asi las aristas del perfil quedan vivas.
  g.computeVertexNormals();
  return g;
}

/**
 * El filo alto del vano, como RECORRIDO y no como cota.
 *
 * Una hoja con el canto alto en arco NO CABE EN UN NUMERO. Mientras el vano se
 * describia con `su` a secas, ese numero solo podia ser la cima, y el cabecero
 * recto se plantaba alli dejando un dedo de aire sobre los hombros — en la
 * Vienna, 49 mm: el marco tocaba la puerta en un solo punto.
 *
 * Por eso el cabecero, el dintel y el tapajuntas leen todos ESTO. En una puerta
 * recta son dos puntos y sale lo mismo de siempre; en una arqueada, los que
 * hagan falta. Que los tres beban del mismo sitio es lo que evita que se abra
 * un filo de muro entre el marco y la pared.
 *
 * @param {object} vano      el de vanoDe()
 * @param {number} desborde  cuanto se pasa de largo a cada lado
 */
export function bordeAlto(vano, desborde = 0, pasos = 72) {
  const a = vano.arco;
  if (!a) {
    return [[vano.sx - desborde, vano.su], [vano.dx + desborde, vano.su]];
  }

  const cuerda = a.dx - a.sx;
  // R = (c²/4 + f²) / 2f, la cuenta del arco por cuerda y flecha.
  const radio = (cuerda * cuerda) / 4 / (2 * a.flecha) + a.flecha / 2;
  const cx = (a.sx + a.dx) / 2;
  const cy = vano.su - radio; // la cima del arco se queda en `su`
  const medio = Math.asin(Math.min(1, cuerda / 2 / radio));
  const hombro = vano.su - a.flecha;

  const camino = [];
  if (a.sx > vano.sx - desborde) camino.push([vano.sx - desborde, hombro]);
  for (let i = 0; i <= pasos; i++) {
    const t = -medio + (2 * medio * i) / pasos;
    camino.push([cx + radio * Math.sin(t), cy + radio * Math.cos(t)]);
  }
  if (a.dx < vano.dx + desborde) camino.push([vano.dx + desborde, hombro]);
  return camino;
}

const bordes = (curvas, i) => curvas.flatMap((c) => c.map((p) => p[i]));

/**
 * El arco del vano, comprobado contra el hueco que hay.
 *
 * Llega ya en coordenadas del vano y a su escala, porque quien conoce la forma
 * del canto alto es quien ha puesto la hoja dentro. Aqui solo se mira que quepa.
 */
function arcoDelVano(a, sx, dx) {
  if (!a || !(a.flecha > 0.5)) return null;
  const i = Math.max(sx, Math.min(a.sx, a.dx));
  const d = Math.min(dx, Math.max(a.sx, a.dx));
  return d - i > 1 ? { sx: i, dx: d, flecha: a.flecha } : null;
}

/**
 * El borde del vano, calculado UNA vez y usado por todos.
 *
 * Aqui se encuentran tres cosas: el forro que acaba, el muro que empieza y el
 * tapajuntas que tapa la junta. Si cada uno sacara su cota de un sitio distinto
 * bastarian decimas de milimetro para que se abriera un filo entre dos, y un
 * filo de muro en medio de la madera se ve perfectamente.
 */
/* La holgura de cada lado entre la hoja y la jamba.
   8,5 es la del propio catalogo: su vano mide 857 —de -15 a 842— y esta
   dibujado para una hoja de 840. No es un numero elegido, es el que ya tenia
   montado, y por eso las puertas que hoy encajan siguen encajando igual. */
const HOLGURA_LADO = 8.5;

export function vanoDe(datos) {
  const x = bordes(datos.telaio_imbotto, 0);
  const propio = Math.max(...bordes(datos.telaio_alto_imbotto, 0));
  /* La altura del vano sale del catalogo, que es de una hoja concreta. Si nos
     dicen por donde acaba ESTA hoja, manda ella: el catalogo trae una puerta de
     serie y una hoja mas baja deja un hueco encima, que es lo primero que se ve.

     Es la COTA de su canto alto, no su altura. Una hoja no siempre arranca en
     el suelo —lo normal es que se dibuje con su holgura debajo— y restando esa
     holgura el cabecero se quedaria bajo y la hoja asomaria por arriba. */
  const su = datos.cantoAltoHoja > 0 ? datos.cantoAltoHoja + (datos.holguraAlta ?? 4) : propio;
  /* Y EL ANCHO IGUAL QUE EL ALTO: si nos dicen cuanto mide ESTA hoja, manda
     ella. El catalogo trae una puerta de serie, y una hoja mas estrecha dejaba
     el hueco a los dos lados —no una holgura, un vacio— porque las jambas se
     quedaban donde las puso el dibujo de fabrica.
     Medido: el vano del catalogo son 857 mm; la Siena mide 839,5 y deja 8,75
     por banda, que es una holgura; la Matera S mide 785,8 y dejaba 35,6, que
     son cuatro veces la holgura y se ven perfectamente.
     El vano se centra donde lo puso el catalogo, asi que lo unico que cambia
     es cuanto se acercan las dos jambas. */
  const centro = (Math.min(...x) + Math.max(...x)) / 2;
  const medio = datos.anchoHoja > 0
    ? datos.anchoHoja / 2 + (datos.holguraLateral ?? HOLGURA_LADO)
    : (Math.max(...x) - Math.min(...x)) / 2;
  return {
    sx: centro - medio,
    dx: centro + medio,
    su,
    propio,
    /* El canto alto en arco, o null si esta hoja es de cabeza recta. Cuando lo
       hay, `su` sigue siendo la COTA MAS ALTA del vano —la cima— y el arco dice
       por donde baja hasta los hombros. */
    arco: arcoDelVano(datos.arcoAlto, centro - medio, centro + medio),
    /* Cuanto se mete cada jamba hacia dentro. Como `desplaza` para el cabecero:
       los perfiles traen su sitio metido en las coordenadas y no se mueven
       solos. Positivo = las jambas se acercan. */
    aprieta: (Math.max(...x) - Math.min(...x)) / 2 - medio,
    // Lo que hay que subir o bajar el cabecero: sus perfiles traen la altura
    // del catalogo metida en las coordenadas, no se estiran solos.
    desplaza: su - propio,
    sobresale: -Math.min(...bordes(datos.telaio, 0)),
  };
}

/**
 * Marco y forro alrededor del vano.
 *
 * Las jambas suben hasta ARRIBA del todo, no se paran bajo el cabecero. Si se
 * paran donde el cabecero empieza queda una muesca en los dos angulos altos;
 * solapandolas, el cabecero pasa por encima — que ademas es la union real.
 */
export function construirMarco(datos, material, conTapajuntas = false) {
  const g = new THREE.Group();
  const vano = vanoDe(datos);

  /* Cada jamba se mete `aprieta` hacia el centro. La de la izquierda hacia la
     derecha y la de la derecha hacia la izquierda, y se sabe cual es cada una
     por de que lado del centro esta dibujada. */
  const centro = (Math.min(...bordes(datos.telaio_imbotto, 0))
                + Math.max(...bordes(datos.telaio_imbotto, 0))) / 2;
  /* Hasta donde suben. Con el vano arqueado, el filo alto sobre las jambas ya
     no esta en la cima sino en el arranque del arco: dejandolas en `su` se
     quedaban asomando los 49 mm de la flecha por encima del cabecero. */
  const arranque = vano.arco ? vano.su - vano.arco.flecha : vano.su;
  for (const c of datos.telaio_imbotto) {
    const malla = new THREE.Mesh(tirarEnVertical(c, 0, arranque), material);
    const suyo = c.reduce((s2, p) => s2 + p[0], 0) / c.length;
    malla.position.x = suyo < centro ? vano.aprieta : -vano.aprieta;
    g.add(malla);
  }
  /* El cabecero se estira `sobresale` a cada lado. Esos 87 mm por banda no
     quedan al aire: los tapa el tapajuntas al doblar la esquina, que es
     precisamente su oficio y de donde le viene el nombre. Sin tapajuntas
     montado conviene cortarlo a ras del vano, y para eso esta `conTapajuntas`. */
  const desborde = conTapajuntas ? vano.sobresale : 0;
  for (const c of datos.telaio_alto_imbotto) {
    /* Con arco, el cabecero se tira por el recorrido; sin el, por la recta de
       siempre. No se unifican los dos casos a proposito: el recto lleva años
       montado y encaja al milimetro, y no hay ninguna razon para rehacerlo. */
    if (vano.arco) {
      g.add(new THREE.Mesh(tirarPorElBorde(c, bordeAlto(vano, desborde), vano.propio), material));
      continue;
    }
    const malla = new THREE.Mesh(
      tirarEnHorizontal(c, vano.sx - desborde, vano.dx + desborde),
      material,
    );
    malla.position.y = vano.desplaza;
    g.add(malla);
  }
  for (const m of g.children) {
    m.castShadow = true;
    m.receiveShadow = true;
    m.name = 'Telaio';
  }
  return g;
}

/**
 * El muro y el suelo.
 *
 * Sin muro, entre hoja y marco se ve el fondo por la rendija, y una puerta que
 * deja pasar la luz por todo el contorno no es una puerta. Sin suelo, la puerta
 * flota y falta la sombra que dice a ojo cuanto sobresale la jamba.
 *
 * El dintel empieza EXACTAMENTE donde acaba el marco, sin solaparse: en el
 * solape las dos caras quedan al mismo nivel y se disputan los pixeles a
 * manchas. La junta la tapa el tapajuntas, que va por delante.
 */
export function construirMuro(datos, materialMuro, materialSuelo, conSuelo = true) {
  const g = new THREE.Group();
  const vano = vanoDe(datos);

  // El muro se retira tres decimas: el dorso del tapajuntas apoya encima, y
  // apoyar quiere decir quedar al mismo nivel.
  const z0 = datos.muro.z0 + 0.3;
  const z1 = datos.muro.z1 - 0.3;

  /* `atras` retira el bloque medio milimetro. El dintel y los panos laterales
     se tocan justo de canto, y dos caras que coinciden al milimetro dejan un
     hilo de fondo por la junta — que sobre un muro claro se ve como una raya.
     Solaparlos seria peor: en el solape las caras quedan al mismo nivel y se
     disputan los pixeles a manchas. Retirando uno medio milimetro no hay ni
     hilo ni disputa, y medio milimetro no lo ve nadie. */
  const ladrillo = (x0, x1, y0, y1, atras = 0) => {
    const geo = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0 - 2 * atras);
    geo.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    const m = new THREE.Mesh(geo, materialMuro);
    m.castShadow = true;
    m.receiveShadow = true;
    m.name = 'Muro';
    g.add(m);
  };

  /* El pano tiene que salirse del encuadre por los cuatro lados. Con 900 mm
     a cada lado se le veian los cantos en cuanto la camara se abria un poco, y
     un muro con borde deja de leerse como muro. */
  const LADO = 2600;
  const ARRIBA = 1400;
  ladrillo(vano.sx - LADO, vano.sx, 0, vano.su + ARRIBA);
  ladrillo(vano.dx, vano.dx + LADO, 0, vano.su + ARRIBA);

  if (!vano.arco) {
    ladrillo(vano.sx - 2, vano.dx + 2, vano.su, vano.su + ARRIBA, 0.5);
  } else {
    /* El dintel con el vientre arqueado. Dejandolo recto a la altura de la
       cima, el muro cruza por delante del arco y se come el cabecero justo
       donde mas se mira: la vuelta desaparece detras de la pared. */
    const camino = bordeAlto(vano);
    const s = new THREE.Shape();
    s.moveTo(vano.sx - 2, vano.su + ARRIBA);
    s.lineTo(vano.sx - 2, camino[0][1]);
    for (const [x, y] of camino) s.lineTo(x, y);
    s.lineTo(vano.dx + 2, camino[camino.length - 1][1]);
    s.lineTo(vano.dx + 2, vano.su + ARRIBA);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: z1 - z0 - 1,
      bevelEnabled: false,
      curveSegments: 1,
    });
    geo.translate(0, 0, z0 + 0.5);
    const m = new THREE.Mesh(geo, materialMuro);
    m.castShadow = true;
    m.receiveShadow = true;
    m.name = 'Muro';
    g.add(m);
  }

  // Con un ambiente montado el suelo lo pone el: dos planos al mismo nivel se
  // disputan los pixeles y salen a manchas.
  if (!conSuelo) return g;

  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), materialSuelo);
  suelo.rotation.x = -Math.PI / 2;
  suelo.position.set(datos.anchoHoja / 2, 0, 0);
  suelo.receiveShadow = true;
  suelo.name = 'Suelo';
  g.add(suelo);

  return g;
}

/**
 * Monta marco, muro y suelo, ya colocados para una hoja centrada en z = 0.
 *
 * @param {object} datos   catalogo del telaio, mas anchoHoja y espesorHoja
 */
export function montar(datos, { conTapajuntas = false, conSuelo = true, veta: nivel = null, material = null } = {}) {
  /* El marco es madera como la hoja: si la hoja lleva veta y el no, la juntura
     canta enseguida —una tabla lisa pegada a una veteada no existe.
     Y por eso mismo se acepta un material de fuera: quien ya tenga el suyo
     para la hoja —el configurador tiene sus esencias con fotos reales— debe
     poder darselo tambien al marco, o la puerta y su cerco saldrian de dos
     maderas distintas. */
  /* La madera del marco se pide DONDE SE PIDE LA DE LA HOJA, no se arma aqui.
     Se armaba a mano con el color, la rugosidad y el barniz cableados, y solo
     se le enganchaban los dos mapas de la veta. El resultado: con una receta
     que trae tinte propio, la hoja salia del color de la madera y el marco y
     el coprifilo se quedaban en el 0xc8a271 de siempre — y ademas sin relieve
     y con otra rugosidad. Medido con el castaño: hoja ae9365 rugosidad 0,71 con
     relieve, marco c8a271 rugosidad 0,60 sin el.
     Pasando por material() hereda todo lo que herede la hoja, hoy y cuando se
     le añada algo mañana. Un marco no es de otra madera que su puerta. */
  const madera = material ?? materialDe('robleClaro', undefined, nivel);
  /* El yeso, bajado contra el PIXEL y no contra el numero del material.
     Primero lo baje un 13 % sobre e6ded1 y no se noto NADA, porque lo que se
     ve no es el color del material: es el color pasado por la luz. Medido en
     la escena, la pared salia a luminancia 229 de 255 —un 90 %, o sea blanco—
     teniendo el material en 194: la iluminacion la sube casi un 20 %.
     Asi que se mide el pixel renderizado, se pone el objetivo ahi —unos 200,
     un hueso calido que ya no es blanco— y se despeja el material hacia atras.
     Y hay que despejarlo MIDIENDO DOS VECES, porque la cuenta no es
     proporcional: el revelado ACES comprime las luces, asi que bajar el
     material mueve poco el extremo claro. Medido con dos puntos:
       material 194 -> pixel 229
       material 169 -> pixel 219
     o sea 0,4 de pixel por cada unidad de material, no 1. Por eso el primer
     intento —un 13 %— no se noto nada: movia el numero pero no la pared.
     Es la unica forma de ajustar un color de escena: a ojo sobre el numero del
     material se falla siempre, porque ese numero no es lo que nadie ve.
     Y baja tambien porque estaba comiendole el sitio a la puerta: con la pared
     mas clara que la hoja, el ojo va a la pared. */
  const yeso = new THREE.MeshStandardMaterial({ color: 0x7d7972, roughness: 0.95, metalness: 0 });
  const suelo = new THREE.MeshStandardMaterial({ color: 0xcfc6b8, roughness: 0.9, metalness: 0 });

  const g = new THREE.Group();
  g.add(construirMarco(datos, madera, conTapajuntas));
  g.add(construirMuro(datos, yeso, suelo, conSuelo));
  g.userData.madera = madera;
  // Del convenio de fabrica (hoja de 0 a 45) al del editor (centrada en cero).
  g.position.z = -(datos.espesorHoja ?? 45) / 2;
  return g;
}
