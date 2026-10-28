/**
 * SOMBRA DE RELIEVE, horneada en el espacio de la hoja.
 *
 * Una bugna de fabrica sube 3,7 mm en 42 y su moldura mide 26: a la escala a
 * la que se mira una puerta entera —medio pixel por milimetro— la luz de la
 * escena apenas las distingue de una tabla lisa, y la oclusion de pantalla
 * (GTAO) llega con ruido: de lejos motea y de cerca no alcanza.
 *
 * Aqui no se toca ni una medida ni una normal. Se hace lo que hace la luz de
 * una habitacion con una puerta de verdad: los rincones reciben menos cielo.
 *
 *   1. La hoja se dibuja de frente con una camara ortografica y de cada punto
 *      se guarda su ALTURA (la z). Sale un mapa de alturas de la puerta.
 *   2. De ese mapa se saca, punto a punto, cuanta boveda le tapan sus vecinos
 *      (oclusion por horizontes, como la de pantalla, pero en milimetros y
 *      desde arriba): el pie de una gola ve medio cielo, el campo lo ve todo.
 *   3. La madera multiplica su color por ese mapa.
 *
 * Como se calcula en el espacio de la puerta, no depende de la camara ni del
 * tamaño de la ventana: no parpadea al girar, no motea de lejos y de cerca es
 * nitida. Se hornea UNA vez por puerta (decimas de segundo) y en cada cuadro
 * cuesta dos lecturas de textura.
 *
 * Quien pone el peso es cada pieza, con el atributo `aRelieve` que escribe
 * tejerHoja: una moldura puede llevar algo mas de sombra que una bugna sin
 * que una arrastre a la otra. Las mallas que no traen el atributo —el telaio,
 * los capitelli, cualquier GLB— leen cero y no cambian.
 */

import * as THREE from 'three';

/* La altura se guarda en 16 bits repartidos en dos canales de 8: asi vale en
   cualquier GPU, sin pedir texturas de coma flotante. De -64 a +64 mm sobra
   para una hoja de 45 y da 0,002 mm de paso. */
const Z_MIN = -64;
const Z_RANGO = 128;

const VERT_ALTURA = /* glsl */ `
  varying float vZ;
  void main() {
    vec4 p = modelMatrix * vec4(position, 1.0);
    vZ = p.z;
    gl_Position = projectionMatrix * viewMatrix * p;
  }`;

const FRAG_ALTURA = /* glsl */ `
  varying float vZ;
  void main() {
    float v = clamp((vZ - (${Z_MIN.toFixed(1)})) / ${Z_RANGO.toFixed(1)}, 0.0, 1.0) * 255.0;
    gl_FragColor = vec4(floor(v) / 255.0, fract(v), 0.0, 1.0);
  }`;

const VERT_PLANO = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }`;

/* Oclusion por horizontes sobre el mapa de alturas.
   En cada direccion se camina hasta `uRadioMm` y se guarda el angulo mas alto
   que tapa el cielo, medido contra la pendiente de la propia superficie. Lo
   que tapa cerca pesa mas que lo que tapa lejos. Los pasos se aprietan junto
   al punto, que es donde un escalon de dos milimetros hace su sombra.

   DOS COSAS QUE NO SE SOMBREAN, y las dos las cazo la revision:
   - EL VACIO. Fuera de la hoja y en las juntas entre piezas no hay madera: el
     mapa vale 1 ahi. Sombreado como si fuera un suelo, oscurecia el canto de
     la hoja a un tercio de su color (se ve al abrirla) y convertia cada junta
     de 0,8 mm del dibujo en una banda gris de 4 a 6 mm.
   - EL PRECIPICIO. La pendiente se toma del lado que menos cae (y es cero si
     los dos lados van en sentidos contrarios): con la diferencia central, la
     fila de arriba de cada arista viva creia estar en una rampa a plomo y
     salia con una raya oscura.
   Una rampa lisa si se oscurece un poco a si misma (el primer paso cae en su
   propio pixel): los pesos de sombra estan ajustados a ojo contando con eso. */
const FRAG_OCLUSION = /* glsl */ `
  uniform sampler2D tAltura;
  uniform vec2 uTexel;
  uniform float uPxPorMm;
  uniform float uRadioMm;
  varying vec2 vUv;

  float altura(vec2 uv) {
    vec4 c = texture2D(tAltura, uv);
    return (c.r * 255.0 + c.g) / 255.0 * ${Z_RANGO.toFixed(1)} + (${Z_MIN.toFixed(1)});
  }

  void main() {
    float h0 = altura(vUv);
    if (h0 < ${(Z_MIN + 0.01).toFixed(2)}) { gl_FragColor = vec4(1.0); return; }
    float mmPorPx = 1.0 / uPxPorMm;
    float ax = altura(vUv + vec2(uTexel.x, 0.0)) - h0;
    float bx = h0 - altura(vUv - vec2(uTexel.x, 0.0));
    float ay = altura(vUv + vec2(0.0, uTexel.y)) - h0;
    float by = h0 - altura(vUv - vec2(0.0, uTexel.y));
    vec2 pendiente = vec2(
      ax * bx > 0.0 ? (abs(ax) < abs(bx) ? ax : bx) : 0.0,
      ay * by > 0.0 ? (abs(ay) < abs(by) ? ay : by) : 0.0
    ) / mmPorPx;

    float tapado = 0.0;
    for (int i = 0; i < DIRECCIONES; i++) {
      float a = (float(i) + 0.5) / float(DIRECCIONES) * 6.28318530718;
      vec2 dir = vec2(cos(a), sin(a));
      float tanSuelo = clamp(dot(pendiente, dir), -4.0, 4.0);
      float senoMax = tanSuelo / sqrt(1.0 + tanSuelo * tanSuelo);
      float suma = 0.0;
      for (int s = 1; s <= PASOS; s++) {
        float dist = uRadioMm * pow(float(s) / float(PASOS), 1.6);
        float dh = altura(vUv + dir * dist * uPxPorMm * uTexel) - h0;
        float seno = dh / sqrt(dh * dh + dist * dist);
        float peso = 1.0 - (dist / uRadioMm) * (dist / uRadioMm);
        if (seno > senoMax) {
          suma += peso * (seno - senoMax);
          senoMax = seno;
        }
      }
      tapado += suma;
    }
    gl_FragColor = vec4(vec3(clamp(1.0 - tapado / float(DIRECCIONES), 0.0, 1.0)), 1.0);
  }`;

const _caja = new THREE.Box3();

/**
 * Hornea la sombra de relieve de una hoja (o de varias a la vez).
 *
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Object3D|THREE.Object3D[]} raices  lo que devuelve tejerHoja:
 *   mallas en milimetros, en las coordenadas del dibujo, con su z en
 *   `position`. Se leen la geometria y esa posicion; da igual donde este
 *   colgado el grupo en la escena o como este girado.
 * @param {object} [o]
 * @param {number} [o.pxPorMm]     finura del mapa. 1,5 basta para un escalon de 2 mm
 * @param {number} [o.radioMm]     hasta donde llega la sombra de un resalte
 * @param {number} [o.direcciones] y [o.pasos]  calidad del calculo
 * @returns {{frente: THREE.Texture, dorso: THREE.Texture, caja: THREE.Vector4, liberar: Function}|null}
 *   `caja` = [x minima, y minima, ancho, alto] del mapa en mm del dibujo.
 */
export function hornearSombraDeRelieve(renderer, raices, { pxPorMm = 1.5, radioMm = 30, direcciones = 16, pasos = 24, margenMm = 16 } = {}) {
  const copia = new THREE.Group();
  const escena = new THREE.Scene();
  escena.add(copia);
  const matAltura = new THREE.ShaderMaterial({ side: THREE.DoubleSide, vertexShader: VERT_ALTURA, fragmentShader: FRAG_ALTURA });
  const caja = new THREE.Box3();

  for (const raiz of Array.isArray(raices) ? raices : [raices]) {
    raiz?.traverse((o) => {
      if (!o.isMesh || !o.geometry?.attributes?.position) return;
      const m = new THREE.Mesh(o.geometry, matAltura);
      m.position.copy(o.position);
      m.frustumCulled = false;
      copia.add(m);
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      caja.union(_caja.copy(o.geometry.boundingBox).translate(o.position));
    });
  }
  if (caja.isEmpty()) {
    matAltura.dispose();
    return null;
  }

  const x0 = caja.min.x - margenMm;
  const y0 = caja.min.y - margenMm;
  const ancho = caja.max.x - caja.min.x + 2 * margenMm;
  const alto = caja.max.y - caja.min.y + 2 * margenMm;
  /* Sin pasarse del lado maximo de textura: una puerta de dos hojas con
     sopraluce se queda en algo menos de finura antes que no hornearse. */
  const tope = Math.min(renderer.capabilities.maxTextureSize || 4096, 4096);
  const k = Math.min(pxPorMm, tope / ancho, tope / alto);
  const W = Math.max(8, Math.round(ancho * k));
  const H = Math.max(8, Math.round(alto * k));

  const camara = new THREE.OrthographicCamera(x0, x0 + ancho, y0 + alto, y0, 1, 400);
  camara.position.set(0, 0, 200);
  camara.updateMatrixWorld();

  const rtAltura = new THREE.WebGLRenderTarget(W, H, {
    minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true, generateMipmaps: false,
  });
  const matOclusion = new THREE.ShaderMaterial({
    defines: { DIRECCIONES: Math.max(4, Math.round(direcciones)), PASOS: Math.max(4, Math.round(pasos)) },
    uniforms: {
      tAltura: { value: rtAltura.texture },
      uTexel: { value: new THREE.Vector2(1 / W, 1 / H) },
      uPxPorMm: { value: k },
      uRadioMm: { value: radioMm },
    },
    vertexShader: VERT_PLANO,
    fragmentShader: FRAG_OCLUSION,
    depthTest: false,
    depthWrite: false,
  });
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), matOclusion);
  plano.frustumCulled = false;
  const escenaPlano = new THREE.Scene();
  escenaPlano.add(plano);
  const camaraPlano = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const nuevoMapa = () => {
    const rt = new THREE.WebGLRenderTarget(W, H, {
      format: THREE.RedFormat, depthBuffer: false,
      minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: true,
    });
    rt.texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy?.() ?? 1);
    return rt;
  };

  /* El renderer se devuelve como estaba: esto se llama en mitad de la carga
     de una puerta y no puede dejarle cambiado ni el destino ni el borrado. */
  const antes = {
    destino: renderer.getRenderTarget(),
    color: renderer.getClearColor(new THREE.Color()),
    alfa: renderer.getClearAlpha(),
    autoClear: renderer.autoClear,
    sombras: renderer.shadowMap.autoUpdate,
    xr: renderer.xr.enabled,
  };
  let rtFrente = null;
  let rtDorso = null;
  try {
    renderer.autoClear = true;
    renderer.shadowMap.autoUpdate = false;
    renderer.xr.enabled = false;
    const hornear = (dorso) => {
      // El dorso es la misma hoja vista por detras: se le da la vuelta en z.
      copia.scale.z = dorso ? -1 : 1;
      // El vacio queda en la altura mas baja: fuera de la hoja no hay nada que tape.
      renderer.setClearColor(0x000000, 1);
      renderer.setRenderTarget(rtAltura);
      renderer.clear();
      renderer.render(escena, camara);
      const rt = nuevoMapa();
      /* El mapa final se borra a BLANCO: si el pase no llegara a pintar, la
         madera se queda sin sombra, no negra. */
      renderer.setClearColor(0xffffff, 1);
      renderer.setRenderTarget(rt);
      renderer.render(escenaPlano, camaraPlano);
      return rt;
    };
    rtFrente = hornear(false);
    rtDorso = hornear(true);
  } finally {
    renderer.setRenderTarget(antes.destino);
    renderer.setClearColor(antes.color, antes.alfa);
    renderer.autoClear = antes.autoClear;
    renderer.shadowMap.autoUpdate = antes.sombras;
    renderer.xr.enabled = antes.xr;
    rtAltura.dispose();
    matAltura.dispose();
    matOclusion.dispose();
    plano.geometry.dispose();
  }

  return {
    frente: rtFrente.texture,
    dorso: rtDorso.texture,
    caja: new THREE.Vector4(x0, y0, ancho, alto),
    pxPorMm: k,
    liberar() {
      rtFrente.dispose();
      rtDorso.dispose();
    },
  };
}

/* Mientras no hay nada horneado se lee un blanco: sombra 1, o sea ninguna. */
let _blanca = null;
function blanca() {
  if (!_blanca) {
    _blanca = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    _blanca.needsUpdate = true;
  }
  return _blanca;
}

const enganchados = new WeakMap();

/**
 * Prepara un material de madera para leer la sombra de relieve.
 *
 * Se hace una vez por material. Devuelve el mando: `poner(sombra)` con lo que
 * devuelve hornearSombraDeRelieve (o null para quitarla) y `fuerza`, que
 * multiplica el peso de todas las piezas a la vez (1 = el de cada una).
 */
export function engancharSombraDeRelieve(material) {
  if (enganchados.has(material)) return enganchados.get(material);

  const u = {
    uSombraFrente: { value: blanca() },
    uSombraDorso: { value: blanca() },
    uSombraCaja: { value: new THREE.Vector4(0, 0, 1, 1) },
    uSombraFuerza: { value: 1 },
  };

  /* La clave del programa se toma ANTES de cambiar el gancho: la de three es
     el texto del gancho, y tomada despues seria siempre el nuestro, igual
     para dos materiales que traian ganchos distintos. */
  const clave0 = material.customProgramCacheKey();
  const previo = material.onBeforeCompile;
  material.onBeforeCompile = function (shader, renderer) {
    previo?.call(this, shader, renderer);
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
attribute float aRelieve;
uniform vec4 uSombraCaja;
varying vec2 vSombraUv;
varying float vSombraPeso;
varying float vSombraNz;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vSombraUv = (position.xy - uSombraCaja.xy) / uSombraCaja.zw;
vSombraPeso = aRelieve;
vSombraNz = normal.z;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D uSombraFrente;
uniform sampler2D uSombraDorso;
uniform float uSombraFuerza;
varying vec2 vSombraUv;
varying float vSombraPeso;
varying float vSombraNz;`)
      /* Las dos lecturas se hacen siempre y se elige despues: leer dentro de
         una rama deja sin derivadas a la textura y ensucia el borde. */
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  float sombraFrente = texture2D( uSombraFrente, vSombraUv ).r;
  float sombraDorso = texture2D( uSombraDorso, vSombraUv ).r;
  float sombraRelieve = mix( sombraDorso, sombraFrente, step( 0.0, vSombraNz ) );
  diffuseColor.rgb *= pow( max( sombraRelieve, 0.02 ), max( vSombraPeso * uSombraFuerza, 0.0 ) );
}`);
  };
  material.customProgramCacheKey = function () {
    return `${clave0}|sombra-de-relieve-1`;
  };
  material.needsUpdate = true;

  const mando = {
    uniforms: u,
    poner(sombra) {
      u.uSombraFrente.value = sombra?.frente ?? blanca();
      u.uSombraDorso.value = sombra?.dorso ?? blanca();
      if (sombra?.caja) u.uSombraCaja.value.copy(sombra.caja);
    },
    get fuerza() { return u.uSombraFuerza.value; },
    set fuerza(v) { u.uSombraFuerza.value = v; },
  };
  enganchados.set(material, mando);
  return mando;
}

/**
 * Escribe en una geometria el peso con que recibe la sombra de relieve.
 * Lo llama tejerHoja; aparte, para quien teja por su cuenta.
 */
export function pesarRelieve(geo, peso = 1) {
  const n = geo?.attributes?.position?.count;
  if (!n) return;
  geo.setAttribute('aRelieve', new THREE.Float32BufferAttribute(new Float32Array(n).fill(peso), 1));
}
