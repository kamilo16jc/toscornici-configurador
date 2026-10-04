/**
 * PROXY LOCAL entre el configurador y Replicate.
 *
 * POR QUE HACE FALTA. El configurador es un sitio ESTATICO: no tiene servidor.
 * Si el navegador llamara a Replicate directamente, el token tendria que estar
 * en el JavaScript de la pagina — o sea, publico. Cualquiera que abriera el
 * codigo fuente podria gastar la cuenta. Ademas Replicate no permite llamadas
 * desde el navegador.
 *
 * Esto es la pieza que falta, y es MINIMA: recibe la captura, le pone el token
 * por detras, espera a Replicate y devuelve la imagen. El token vive solo en el
 * entorno de este proceso; no se escribe en ningun fichero ni llega al
 * navegador.
 *
 * ES SOLO PARA LA PRUEBA EN LOCAL. El dia que esto vaya a produccion, este
 * mismo fichero es lo que hay que convertir en una funcion de Vercel.
 *
 *   export REPLICATE_API_TOKEN=r8_...
 *   node proxy-ia.mjs [puerto]
 */
import http from 'node:http';

const PUERTO = Number(process.argv[2] || 8300);
const TOKEN = process.env.REPLICATE_API_TOKEN;

if (!TOKEN) {
  console.error('Falta REPLICATE_API_TOKEN en el entorno.');
  process.exit(1);
}

const MODELO_POR_DEFECTO = 'black-forest-labs/flux-kontext-pro';

const INSTRUCCION = [
  'Convert this 3D render into a photorealistic interior photograph.',
  'Change ONLY the lighting, the materials and the surface realism.',
  'Soft natural daylight, realistic soft shadows, real wood grain, matte plaster wall.',
  'Keep the same camera, the same framing, the same door design, the same panels,',
  'the same mouldings and the same proportions. Do not add hardware that is not there.',
].join(' ');

const cab = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function generar({ imagen, modelo, prompt }) {
  const m = modelo || MODELO_POR_DEFECTO;
  const porBordes = /canny|depth|controlnet/i.test(m);
  const input = porBordes
    ? { prompt: prompt || INSTRUCCION, control_image: imagen, guidance: 30, steps: 50, output_format: 'png', safety_tolerance: 2 }
    : { prompt: prompt || INSTRUCCION, input_image: imagen, output_format: 'png', safety_tolerance: 2 };

  const r = await fetch(`https://api.replicate.com/v1/models/${m}/predictions`, {
    method: 'POST', headers: cab, body: JSON.stringify({ input }),
  });
  if (!r.ok) throw new Error(`Replicate ${r.status}: ${(await r.text()).slice(0, 300)}`);

  let pred = await r.json();
  while (['starting', 'processing'].includes(pred.status)) {
    await new Promise((k) => setTimeout(k, 1200));
    pred = await fetch(pred.urls.get, { headers: cab }).then((x) => x.json());
  }
  if (pred.status !== 'succeeded') throw new Error(pred.error || pred.status);

  return {
    url: Array.isArray(pred.output) ? pred.output[0] : pred.output,
    segundos: pred.metrics?.predict_time ?? null,
  };
}

const servidor = http.createServer(async (req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }

  if (req.method !== 'POST' || !req.url.startsWith('/render')) {
    res.writeHead(404, cors); return res.end('usa POST /render');
  }

  let cuerpo = '';
  req.on('data', (c) => { cuerpo += c; });
  req.on('end', async () => {
    const t0 = Date.now();
    try {
      const p = JSON.parse(cuerpo);
      if (!p.imagen) throw new Error('falta "imagen" (dataURL)');
      console.log(`peticion  ${Math.round(p.imagen.length / 1024)} KB  ${p.modelo || MODELO_POR_DEFECTO}`);

      const { url, segundos } = await generar(p);
      // se devuelve la imagen YA en dataURL: asi el configurador la mete
      // directa en el preventivo sin depender de que el enlace siga vivo
      const bytes = Buffer.from(await fetch(url).then((x) => x.arrayBuffer()));
      const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;

      console.log(`  listo en ${((Date.now() - t0) / 1000).toFixed(1)} s  (${Math.round(bytes.length / 1024)} KB)`);
      res.writeHead(200, { ...cors, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, imagen: dataUrl, segundos }));
    } catch (e) {
      console.log(`  FALLO: ${e.message}`);
      res.writeHead(500, { ...cors, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
    }
  });
});

servidor.listen(PUERTO, '127.0.0.1', () => {
  console.log(`proxy IA en http://127.0.0.1:${PUERTO}/render`);
  console.log(`modelo por defecto: ${MODELO_POR_DEFECTO}`);
});
