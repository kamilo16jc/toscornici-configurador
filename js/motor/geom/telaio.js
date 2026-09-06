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

const bordes = (curvas, i) => curvas.flatMap((c) => c.map((p) => p[i]));

/**
 * El borde del vano, calculado UNA vez y usado por todos.
 *
 * Aqui se encuentran tres cosas: el forro que acaba, el muro que empieza y el
 * tapajuntas que tapa la junta. Si cada uno sacara su cota de un sitio distinto
 * bastarian decimas de milimetro para que se abriera un filo entre dos, y un
 * filo de muro en medio de la madera se ve perfectamente.
 */
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
  return {
    sx: Math.min(...x),
    dx: Math.max(...x),
    su,
    propio,
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

  for (const c of datos.telaio_imbotto) {
    g.add(new THREE.Mesh(tirarEnVertical(c, 0, vano.su), material));
  }
  /* El cabecero se estira `sobresale` a cada lado. Esos 87 mm por banda no
     quedan al aire: los tapa el tapajuntas al doblar la esquina, que es
     precisamente su oficio y de donde le viene el nombre. Sin tapajuntas
     montado conviene cortarlo a ras del vano, y para eso esta `conTapajuntas`. */
  const desborde = conTapajuntas ? vano.sobresale : 0;
  for (const c of datos.telaio_alto_imbotto) {
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
  ladrillo(vano.sx - 2, vano.dx + 2, vano.su, vano.su + ARRIBA, 0.5);

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
