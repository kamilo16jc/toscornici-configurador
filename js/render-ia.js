/* ============================================================
   LA FOTO DE LA PUERTA PARA EL PREVENTIVO
   ------------------------------------------------------------
   Hasta ahora la hoja 2 llevaba SIEMPRE la misma foto de
   catalogo (assets/collezioni/listino.webp), daba igual que el
   cliente hubiera configurado una Vienna en castagno o una
   Liverpool lacada. Esto la sustituye por su puerta.

   COMO, Y POR QUE ASI. Se aprovecha el rato que el cliente tarda
   en escribir nombre, email y direccion: al abrirse el formulario
   se dispara la captura y se manda a rehacer. Cuando le da a
   enviar, la foto suele estar lista desde hace rato. Medido: 17 s
   de ida y vuelta contra el minuto largo que se tarda en rellenar
   un formulario de ocho campos.

   POR QUE UN PROXY Y NO LLAMAR DIRECTO. El configurador es un
   sitio estatico. Llamar a Replicate desde el navegador obligaria
   a llevar el token en el JavaScript de la pagina — publico para
   cualquiera que abra el codigo fuente. El proxy se lo queda.

   POR QUE CANNY Y NO KONTEXT. Probados los dos. Kontext edita la
   foto siguiendo la instruccion, y se INVENTA una manilla: se le
   prohibio dos veces, la segunda de la forma mas explicita que se
   puede escribir, y la puso igual, con bocallave. En un documento
   que dice "Maniglia: Arianna" eso es ensenyarle al cliente una
   puerta que no es la suya. Canny genera desde los BORDES del
   render: si en el dibujo no hay manilla, no hay borde del que
   sacarla. Sujeta la geometria en vez de pedirla por favor.

   SI ALGO FALLA NO PASA NADA. Sin proxy, sin red o con error, se
   devuelve null y el preventivo sale con la foto de siempre. Esto
   nunca debe impedir que se emita un presupuesto.
   ============================================================ */

/* De momento solo en local: el proxy vive en la maquina de quien
   prueba. En el sitio publicado esto no se enciende, asi que la
   web desplegada se comporta exactamente como antes. */
const PROXY = 'http://127.0.0.1:8300/render';
const MODELO = 'black-forest-labs/flux-canny-pro';

export const enLocal = () => /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

/* EL COLOR SE DESCRIBE, NO SE NOMBRA.
   Canny redibuja desde cero: el color lo pone la instruccion. Y
   decir el nombre de la madera es contraproducente — escribir
   "chestnut" arrastraba el tono a caoba (#9e6656) cuando el
   castagno de verdad es #bc996b. Describiendo el color sin
   nombrar la especie sale #c7ad91, que ya se parece. */
const TONOS = {
  rovere:    'pale golden-brown wood, warm light tan with a yellowish cast, fine straight grain',
  castagno:  'warm medium honey-brown wood, light golden tan with a faint amber cast, visible natural grain',
  toulipier: 'pale creamy beige wood, very light and even, almost no contrast in the grain',
  pino:      'very pale blond wood, light straw colour, soft visible knots and wide grain',
};

const LACAS = {
  bianco:  'painted in a soft warm white, smooth matt lacquer, no wood grain visible',
  avorio:  'painted in a warm ivory cream, smooth matt lacquer, no wood grain visible',
  tortora: 'painted in a muted greige taupe, smooth matt lacquer, no wood grain visible',
  salvia:  'painted in a soft sage green, smooth matt lacquer, no wood grain visible',
  notte:   'painted in a deep navy blue, smooth matt lacquer, no wood grain visible',
};

/* EL VIDRIO HAY QUE NOMBRARLO, y es la leccion que costo una prueba fallida.
   Canny pone la GEOMETRIA; el texto pone el SIGNIFICADO. En la Barletta los
   cristales dan bordes nitidos —se ven los peinazos perfectamente—, pero si la
   instruccion dice "puerta de madera maciza", el modelo lee esa rejilla como
   cuarterones hundidos y los rellena de madera. Salio una puerta sin ventanas.
   No faltaban bordes: faltaba la palabra.

   Y no hay que escribirlo puerta por puerta: el catalogo ya lo dice. Las 43
   puertas con vidrio son exactamente las 43 cuyo `descEn` lo menciona. */
const conVidrio = (desc) => /glaz|glass|window/i.test(desc || '');

function instruccion({ essenza, laccato, descripcion }) {
  const material = laccato
    ? (LACAS[laccato] || LACAS.bianco)
    : (TONOS[essenza] || TONOS.rovere);

  /* DETRAS DEL CRISTAL HAY OTRA HABITACION, no la calle. Es una puerta de
     INTERIOR: en la primera prueba se veian edificios y cielo por los vidrios,
     que para un catalogo de puertas de paso es un disparate. Hay que decir que
     se ve y, sobre todo, que NO se ve. */
  const vidrio = conVidrio(descripcion)
    ? 'The upper openings are CLEAR TRANSPARENT GLASS panes held by slim wooden '
      + 'glazing bars. Through the glass you see only a soft, out-of-focus '
      + 'INTERIOR hallway in the same warm neutral tones, dim and empty. '
      + 'Absolutely no outdoor view: no sky, no buildings, no street, no trees, '
      + 'no window frames behind. Those openings are glass, never wood, never '
      + 'mirror, never solid panels.'
    : '';

  return [
    'Editorial architectural interior photograph of a classic interior door.',
    `The door is ${material}, with a matt satin finish.`,
    vidrio,
    'Matching wooden frame and flat trim board around it.',
    /* EL AMBIENTE: bonito SIN TRASTOS. Lo que hace atractiva una foto de
       arquitectura no son los objetos, es la luz y la materia — asi que se pide
       luz rasante, textura de cal en la pared, veta ancha en el suelo y algo de
       profundidad, y se prohibe expresamente todo lo que sea atrezo. */
    'Warm low afternoon sunlight raking across the wall from the left, casting a',
    'long soft-edged shadow. Walls in warm off-white lime plaster with a subtle',
    'living texture. Wide-plank pale oak floor with visible grain and a soft sheen.',
    'Slim white skirting board. Shallow depth of field, gentle vignette, rich',
    'natural tones, high dynamic range, calm and minimal.',
    'STRICTLY EMPTY ROOM: no furniture, no framed pictures, no plants, no lamps,',
    'no rugs, no decorations, no objects of any kind, no people. Only the door,',
    'the bare wall and the floor. The door is closed. Sharp focus on the door.',
  ].filter(Boolean).join(' ');
}

/**
 * Fotografia el conjunto puerta + telaio + coprifilo.
 *
 * ENCUADRA LA PUERTA, NO LA HABITACION. El ambiente mide 8 x 3,5 x 7 m
 * y la puerta 0,95 x 2,08: encuadrando la caja de la escena —que es lo
 * que hace tools/scatta-porte.py— la puerta sale como un sello al fondo.
 * Aqui se mide solo lo que es la puerta.
 *
 * Se devuelve en la proporcion del hueco de la hoja 2 (210 x 207 mm),
 * asi entra sin que `object-fit: cover` le recorte nada.
 */
export function capturaPorta({ THREE, renderer, scene, camera, doorPivot, composer, gtaoPass, controls }) {
  const lienzo = renderer.domElement;

  let mn = null;
  let mx = null;
  const mete = (n) => {
    const g = n.geometry;
    if (!g) return;
    if (!g.boundingBox) g.computeBoundingBox();
    const b = g.boundingBox;
    if (!b) return;
    for (const x of [b.min.x, b.max.x]) {
      for (const y of [b.min.y, b.max.y]) {
        for (const z of [b.min.z, b.max.z]) {
          const p = new THREE.Vector3(x, y, z).applyMatrix4(n.matrixWorld);
          if (!mn) { mn = p.clone(); mx = p.clone(); } else { mn.min(p); mx.max(p); }
        }
      }
    }
  };

  scene.updateWorldMatrix(true, true);
  scene.traverse((n) => { if (n.name === 'Telaio' || n.name === 'Coprifilo') mete(n); });
  if (doorPivot) doorPivot.traverse(mete);
  if (!mn) return null;

  const centro = new THREE.Vector3().addVectors(mn, mx).multiplyScalar(0.5);
  const tam = new THREE.Vector3().subVectors(mx, mn);

  const pr = renderer.getPixelRatio();
  const anchoAntes = lienzo.width / pr;
  const altoAntes = lienzo.height / pr;
  const aspectoAntes = camera.aspect;
  const posAntes = camera.position.clone();
  /* TAMBIEN LA ORIENTACION, y esto no es un detalle: abajo se hace un
     lookAt() para apuntar a la puerta, y lookAt reescribe el cuaternion.
     Devolviendo solo la posicion, la camara se quedaba mirando donde la
     dejo la foto y el visor aparecia descuadrado hasta que el cliente
     arrastraba el raton. */
  const rotAntes = camera.quaternion.clone();

  const W = Math.round(1400 / pr);
  const H = Math.round(1376 / pr);
  /* LOS TRES A LA VEZ, como hace resize() del configurador. Moviendo solo
     el renderer, los destinos del composer se quedan con la medida vieja y
     WebGL escupe "Framebuffer is incomplete: Attachment has zero size"
     hasta el siguiente redimensionado. */
  renderer.setSize(W, H, false);
  if (composer) composer.setSize(W, H);
  if (gtaoPass) gtaoPass.setSize(W, H);
  camera.aspect = W / H;

  const fov = (camera.fov * Math.PI) / 180;
  const AIRE = 1.5; // pared alrededor y algo de suelo: tiene que parecer una foto
  const dist = Math.max(
    (tam.y * AIRE) / 2 / Math.tan(fov / 2),
    (tam.x * AIRE) / 2 / (Math.tan(fov / 2) * camera.aspect),
  );
  camera.position.copy(centro).add(new THREE.Vector3(0.30, 0.10, 1).normalize().multiplyScalar(dist));
  camera.lookAt(centro.x, centro.y - 0.05, centro.z);
  camera.updateProjectionMatrix();
  /* POR EL COMPOSER, no por el renderer pelado: ahi viven la oclusion
     ambiental y el mapeo de tonos. Renderizando directo, la foto salia
     mas plana que lo que el cliente esta viendo en pantalla. */
  if (composer) composer.render(); else renderer.render(scene, camera);

  /* EL LIENZO ES TRANSPARENTE (alpha: true), y una imagen con agujeros
     le da a la IA sitio donde inventar. Se compone sobre un fondo
     opaco antes de mandarla. */
  const png = lienzo.toDataURL('image/png');

  renderer.setSize(anchoAntes, altoAntes, false);
  if (composer) composer.setSize(anchoAntes, altoAntes);
  if (gtaoPass) gtaoPass.setSize(anchoAntes, altoAntes);
  camera.aspect = aspectoAntes;
  camera.position.copy(posAntes);
  camera.quaternion.copy(rotAntes);
  camera.updateProjectionMatrix();
  /* Y QUE SE REDIBUJE. El visor dibuja BAJO DEMANDA —el bucle sale por
     `fotogrammiDaFare <= 0`—, asi que sin pedir fotogramas la correccion
     no se veria hasta que el cliente arrastrara el raton. controls.update()
     vuelve a derivar la orientacion desde el target, y el resize pide el
     redibujado. */
  if (controls) controls.update();
  window.dispatchEvent(new Event('resize'));

  return new Promise((listo) => {
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = im.width;
      cv.height = im.height;
      const cx = cv.getContext('2d');
      cx.fillStyle = '#c9c1b2';
      cx.fillRect(0, 0, cv.width, cv.height);
      cx.drawImage(im, 0, 0);
      listo(cv.toDataURL('image/jpeg', 0.92));
    };
    im.onerror = () => listo(null);
    im.src = png;
  });
}

let pendiente = null;

/** Dispara la foto. Se llama al abrirse el formulario y no se espera. */
export function arrancaFoto(ctx) {
  if (!enLocal()) return;
  pendiente = (async () => {
    const t0 = Date.now();
    try {
      const captura = await capturaPorta(ctx);
      if (!captura) return null;
      const r = await fetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagen: captura, modelo: MODELO, prompt: instruccion(ctx) }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'respuesta sin imagen');
      console.info(`[render-ia] lista en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
      return j.imagen;
    } catch (e) {
      console.warn('[render-ia] sin foto, se usa la de siempre:', e.message);
      return null;
    }
  })();
}

/**
 * Recoge la foto si ha llegado.
 *
 * Con tope de espera: si el cliente ha rellenado el formulario en diez
 * segundos, no se le deja mirando una ventana quieta. Se emite el
 * preventivo con la foto de catalogo y ya esta.
 */
export function fotoLista(msMax = 12000) {
  if (!pendiente) return Promise.resolve(null);
  return Promise.race([
    pendiente,
    new Promise((r) => setTimeout(() => r(null), msMax)),
  ]);
}
