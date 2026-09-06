/**
 * Trae el motor de puertas3d a js/motor/.
 *
 *   node tools/sync-motor.mjs
 *
 * El motor NO se edita aqui. Su casa es C:\Users\Julic\puertas3d y esto es una
 * copia mecanica: si se corrige algo, se corrige alli y se vuelve a correr
 * esto. Un motor con dos copias editables empieza a mentir en la primera
 * correccion que se haga en un solo lado.
 *
 * Se copian SOLO los modulos que hacen falta para tejer una hoja. El visor
 * (escena.js), el marco, el ambiente y los coprifilos se quedan fuera: el
 * configurador ya tiene escena, camara y escenografias propias.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DESTINO = path.join(AQUI, '..', 'js', 'motor');
const ORIGEN = process.env.PUERTAS3D ?? 'C:/Users/Julic/puertas3d/src';

const PIEZAS = [
  'viewer/tejer.js',
  'geom/extruir.js', 'geom/relieve.js', 'geom/perfiles.js', 'geom/offset.js',
  'geom/efectivo.js', 'geom/booleanas.js', 'geom/poligonos.js', 'geom/arcos.js',
  'geom/seguir.js', 'geom/materiales.js',
  // il muro, il telaio e i coprifili: senza parete non c'e' dove montarli
  'geom/telaio.js', 'geom/coprifilo.js', 'geom/ambiente.js',
  'modelo/proyecto.js', 'modelo/papeles.js',
];

if (!fs.existsSync(ORIGEN)) {
  console.error(`No encuentro el motor en ${ORIGEN}.`);
  console.error('Si esta en otro sitio: PUERTAS3D=ruta/al/src node tools/sync-motor.mjs');
  process.exit(1);
}

fs.rmSync(DESTINO, { recursive: true, force: true });
let bytes = 0;
for (const rel of PIEZAS) {
  const de = path.join(ORIGEN, rel);
  const a = path.join(DESTINO, rel);
  fs.mkdirSync(path.dirname(a), { recursive: true });
  fs.copyFileSync(de, a);
  bytes += fs.statSync(a).size;
  console.log('  ' + rel);
}
fs.writeFileSync(path.join(DESTINO, 'LEEME.txt'),
  'Copia mecanica del motor de puertas3d. NO editar aqui.\n' +
  'Se corrige en C:\Users\Julic\puertas3d y se vuelve a correr:\n' +
  '  node tools/sync-motor.mjs\n');
console.log(`\n${PIEZAS.length} modulos, ${(bytes / 1024).toFixed(0)} KB.`);
