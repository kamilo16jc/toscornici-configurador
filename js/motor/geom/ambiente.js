/**
 * El ambiente: pared, suelo y rodapie.
 *
 * Portado de app.js del proyecto Toscocornici-3D. Alli la escena esta en metros
 * —la puerta entra escalada 1/1000— y aqui en milimetros, como los planos, asi
 * que todas las medidas van multiplicadas por mil. Se dejan escritas en mm y no
 * como `0.09 * 1000` para que se lean como lo que son: un rodapie de 90.
 *
 * Ojo a que son DOS muros distintos y los dos hacen falta:
 *
 *   - el del vano (geom/telaio.js) es el grueso real de obra, 118 mm, y es
 *     sobre el que apoya el coprifilo;
 *   - este es el pano de la habitacion, un fondo grande con un hueco recortado
 *     por donde asoma el conjunto.
 *
 * Sin el segundo la puerta se ve montada pero flotando en el aire, que es justo
 * lo que pasaba antes: el bajo se cortaba en seco, sin suelo ni rodapie.
 */

import * as THREE from 'three';

/** Cara vista del muro, en mm. Coincide con muro.z1 del catalogo de telai. */
export const CARA_MURO = 30;

const material = (color, aspereza = 0.9) =>
  new THREE.MeshStandardMaterial({ color, roughness: aspereza });

function caja(grupo, ancho, alto, fondo, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, fondo), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  grupo.add(m);
  return m;
}

/**
 * Pano de pared con el hueco de la puerta recortado.
 *
 * El hueco se hace un pelo mas pequeno que el conjunto (15 mm de ancho y 8 de
 * alto) para que el coprifilo pise la pared en vez de quedar al borde justo.
 */
/* Lo que la pared, el rodapie y el suelo se solapan por debajo del cero.
   El cero es la linea del suelo: si los tres acaban justo ahi, cualquier
   diferencia de decimas abre una rendija que a ras se ve de lado a lado.
   Solapando, no hay diferencia que valga. */
const BAJO = 60;

function pared(grupo, color, hueco, centroX) {
  const ANCHO = 7500;
  const ALTO = 3200;
  /* El grueso viene del catalogo de telai, no fijo. Estaba en 140 cuando el
     muro real son 118, y esos 22 mm de mas sobresalian por DETRAS: el
     tapajuntas de esa cara, que apoya en el dorso del muro, quedaba enterrado
     dentro de la pared y no se veia ninguno por ese lado.

     Y se le quita medio milimetro POR CADA CARA. El agujero se hace 15 mm mas
     estrecho que el vano para que la pared solape con el marco y no quede
     rendija; sin este adelgazado las dos caras quedarian al mismo nivel y ese
     solape titilaba. Corriendo la pared entera se arreglaba una cara y se
     estropeaba la otra: por detras la pared pasaba a sobresalir y tapaba el
     marco, dejando una banda de yeso a la vista. Adelgazandola gana el marco
     por los dos lados. */
  const HOLGURA = 0.5;
  const FONDO = (hueco.fondo ?? 140) - 2 * HOLGURA;

  // Arranca POR DEBAJO del suelo; el vano sigue empezando en el cero.
  const forma = new THREE.Shape();
  forma.moveTo(-ANCHO / 2, -BAJO);
  forma.lineTo(ANCHO / 2, -BAJO);
  forma.lineTo(ANCHO / 2, ALTO);
  forma.lineTo(-ANCHO / 2, ALTO);
  forma.closePath();

  const w = hueco.ancho - 15;
  const h = hueco.alto - 8;
  const vacio = new THREE.Path();
  vacio.moveTo(-w / 2, 0);
  vacio.lineTo(w / 2, 0);
  vacio.lineTo(w / 2, h);
  vacio.lineTo(-w / 2, h);
  vacio.closePath();
  forma.holes.push(vacio);

  const m = new THREE.Mesh(
    new THREE.ExtrudeGeometry(forma, { depth: FONDO, bevelEnabled: false }),
    material(color, 0.95),
  );
  // La cara vista, retranqueada su holgura; el grueso ya viene descontado.
  m.position.set(centroX, 0, CARA_MURO - HOLGURA - FONDO);
  m.receiveShadow = true;
  m.name = 'Pared';
  grupo.add(m);
}

function suelo(grupo, mat, centroX) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(8000, 7000), mat);
  f.rotation.x = -Math.PI / 2;
  /* Seis DECIMAS por debajo del cero, no seis milimetros: el suelo y el bajo
     del marco estan al mismo nivel y dos planos que coinciden se disputan los
     pixeles, pero con 6 mm lo que se abria era una rendija que se veia de lado
     a lado a ras de suelo. Estaba escrito 6 donde el propio comentario decia
     decimas. */
  f.position.set(centroX, -0.6, 1400);
  f.receiveShadow = true;
  f.name = 'Suelo';
  grupo.add(f);
}

/** Rodapie a los dos lados del hueco. 90 de alto por 25 de fondo. */
function rodapie(grupo, color, hueco, centroX) {
  /* El rodapie muere contra el TAPAJUNTAS, no contra el vano. Apartandolo solo
     lo que mide el vano, sus 25 mm de vuelo le pasaban por delante a la
     moldura —que sobresale menos— y la cortaban a media altura: parecia que el
     tapajuntas no bajaba hasta el suelo. */
  /* Con el ancho del vano se restan 15 para que el rodapie se meta un poco
     bajo la jamba. Con el del tapajuntas hay que hacer lo contrario: SUMAR una
     holgura, o el rodapie —que vuela mas que la moldura— le pasaria por
     delante justo en el canto. */
  const w = hueco.libre != null ? hueco.libre + 8 : hueco.ancho - 15;
  const largo = (7500 - w) / 2;
  const mat = material(color, 0.8);
  const z = CARA_MURO + 12.5;
  for (const lado of [-1, 1]) {
    // Tambien por debajo del cero, por lo mismo que la pared.
    caja(grupo, largo, 90 + BAJO, 25, mat, centroX + lado * (w / 2 + largo / 2), 45 - BAJO / 2, z).name = 'Rodapie';
  }
}

/**
 * Los tres ambientes del configurador, con sus tonos.
 *
 * No se portan los muebles —las macetas del recibidor, el sofa, la mesa del
 * estudio—: son decorado, y aqui lo que importa es que la puerta se vea puesta
 * en un sitio. Las luces de apoyo si, porque esas cambian como se lee el
 * relieve de la bugna.
 */
export const AMBIENTES = {
  galeria: { nombre: 'Galería', pared: null },
  recibidor: {
    nombre: 'Recibidor',
    pared: 0xd3c3a3,
    suelo: () => material(0xa9a08c, 0.95),
    rodapie: 0x8f8168,
    luces: [
      { x: -620, y: 2000, z: 400, color: 0xffd9a8, fuerza: 2.5, alcance: 4000 },
      { x: 620, y: 2000, z: 400, color: 0xffd9a8, fuerza: 2.5, alcance: 4000 },
    ],
  },
  salon: {
    nombre: 'Salón',
    pared: 0xe6ddcb,
    suelo: () => material(0xcfa87f, 0.65),
    rodapie: 0xf0e9da,
    luces: [{ x: -1700, y: 1300, z: 550, color: 0xffe2b0, fuerza: 2.2, alcance: 4500 }],
  },
  estudio: {
    nombre: 'Estudio',
    pared: 0x46523f,
    suelo: () => material(0x9a7350, 0.65),
    rodapie: 0x2f3a2c,
    luces: [{ x: 1450, y: 1500, z: 950, color: 0xffe6c0, fuerza: 2, alcance: 4000 }],
  },
};

/**
 * @param {string} clave    ambiente del catalogo de arriba
 * @param {object} hueco    { ancho, alto } del conjunto ya montado, en mm
 * @param {number} centroX  donde cae el eje de la puerta en la escena
 */
export function construirAmbiente(clave, hueco, centroX = 0) {
  const a = AMBIENTES[clave];
  if (!a || !a.pared) return null;

  const g = new THREE.Group();
  pared(g, a.pared, hueco, centroX);
  suelo(g, a.suelo(), centroX);
  rodapie(g, a.rodapie, hueco, centroX);

  for (const l of a.luces ?? []) {
    const luz = new THREE.PointLight(l.color, l.fuerza, l.alcance, 2);
    luz.position.set(centroX + l.x, l.y, l.z);
    g.add(luz);
  }
  return g;
}
