/**
 * Trae el motor de puertas3d a js/motor/.
 *
 *   node tools/sync-motor.mjs              ver que cambiaria (no toca nada)
 *   node tools/sync-motor.mjs --aplicar    copiar de verdad
 *   node tools/sync-motor.mjs --aplicar --forzar geom/relieve.js
 *                                         pisar SOLO ese, aunque este tocado aqui
 *
 * Lo de poder nombrar ficheros sueltos no es un adorno: --forzar a secas seria
 * todo o nada, y aceptar una correccion de relieve.js obligaria a pisar tambien
 * perfiles.js, que aqui lleva su propia adaptacion. O sea que para arreglar una
 * cosa habria que romper otra, que es exactamente el peligro que este script
 * viene a quitar.
 *
 * La casa del motor es puertas3d y esto es una copia. Pero NO es una copia
 * ciega, y la version anterior de este script si lo era: borraba js/motor
 * entero y recopiaba los dieciseis modulos. El dia que se probo, eso habria
 * hecho tres destrozos a la vez:
 *
 *   - materiales.js: la version de puertas3d apunta a /texturas/roble-miel-pbr
 *     y compania, rutas que aqui NO EXISTEN. El configurador se habria quedado
 *     sin las cuatro esencias.
 *   - coprifilo.js: aqui esta MAS ADELANTADO que alli. Tiene opciones.soloCara,
 *     que es lo que evita que con capitello se monten dos molduras una encima
 *     de otra. Alli no existe: copiar habria borrado la funcion.
 *   - perfiles.js: aqui lleva su propia adaptacion de las bugnas TIPO 1/2/3.
 *
 * O sea que la divergencia va en LAS DOS DIRECCIONES. Por eso ahora:
 *
 *   1. Hay una lista de LOCALES que no se tocan nunca.
 *   2. De los demas se guarda la huella de la ultima copia. Si un fichero se ha
 *      editado aqui desde entonces, se AVISA y se salta en vez de pisarlo.
 *   3. Por defecto no escribe nada: hay que decir --aplicar.
 *   4. Se puede trabajar fichero a fichero, para no tener que aceptar en bloque.
 *
 * Lo que sigue valiendo: una correccion del motor se hace en puertas3d y se
 * trae con esto. Lo que ya no pasa: que traerla se lleve por delante lo de aqui.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PROY = path.join(AQUI, '..');
const DESTINO = path.join(PROY, 'js', 'motor');
const HUELLAS = path.join(DESTINO, '.sync.json');

const aplicar = process.argv.includes('--aplicar');
const forzar = process.argv.includes('--forzar');

/* Donde vive el motor. El portatil de Windows y el Mac lo tienen en sitios
   distintos, asi que se prueban los dos antes de rendirse. */
function buscarOrigen() {
  const candidatos = [
    process.env.PUERTAS3D,
    'C:/Users/Julic/puertas3d/src',
    path.join(PROY, '..', 'puertas3d', 'src'),
  ].filter(Boolean);
  return candidatos.find((c) => fs.existsSync(c)) ?? null;
}

/* NO SE COPIAN NUNCA. No es que esten atrasados: es que aqui son otra cosa.
   Si algun dia dejan de serlo, se quitan de esta lista y ya. */
const LOCALES = new Map([
  ['geom/materiales.js',
    'las rutas de textura y los tintes estan calibrados para la luz de ESTA escena'],
  ['geom/coprifilo.js',
    'aqui tiene opciones.soloCara (capitello), que en puertas3d no existe'],
]);

const PIEZAS = [
  'viewer/tejer.js',
  'geom/extruir.js', 'geom/relieve.js', 'geom/perfiles.js', 'geom/offset.js',
  'geom/efectivo.js', 'geom/booleanas.js', 'geom/poligonos.js', 'geom/arcos.js',
  'geom/seguir.js', 'geom/materiales.js',
  // el muro, el telaio y los coprifili: sin pared no hay donde montarlos
  'geom/telaio.js', 'geom/coprifilo.js', 'geom/ambiente.js',
  'modelo/proyecto.js', 'modelo/papeles.js',
];

const huella = (f) => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');

const ORIGEN = buscarOrigen();
if (!ORIGEN) {
  console.error('No encuentro el motor de puertas3d.');
  console.error('Dime donde esta:  PUERTAS3D=ruta/al/src node tools/sync-motor.mjs');
  process.exit(1);
}
console.log(`Origen: ${ORIGEN}`);
console.log(aplicar ? (forzar ? 'Modo: APLICAR (forzando)\n' : 'Modo: APLICAR\n') : 'Modo: solo mirar (usa --aplicar para copiar)\n');

/* Ficheros sueltos en la linea de ordenes: se trabaja solo sobre esos. */
const pedidos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const desconocidos = pedidos.filter((p) => !PIEZAS.includes(p));
if (desconocidos.length) {
  console.error(`No conozco: ${desconocidos.join(', ')}`);
  console.error(`Los que hay:\n  ${PIEZAS.join('\n  ')}`);
  process.exit(1);
}
const objetivo = pedidos.length ? PIEZAS.filter((r) => pedidos.includes(r)) : PIEZAS;
if (pedidos.length) console.log(`Solo: ${objetivo.join(', ')}\n`);

const previas = fs.existsSync(HUELLAS) ? JSON.parse(fs.readFileSync(HUELLAS, 'utf8')) : {};
const nuevas = { ...previas };
const copiados = [], saltados = [], locales = [], iguales = [], ausentes = [];

for (const rel of objetivo) {
  const de = path.join(ORIGEN, rel);
  const a = path.join(DESTINO, rel);

  if (LOCALES.has(rel)) { locales.push(`${rel}  — ${LOCALES.get(rel)}`); continue; }
  if (!fs.existsSync(de)) { ausentes.push(rel); continue; }

  const hOrigen = huella(de);
  const existe = fs.existsSync(a);
  const hDestino = existe ? huella(a) : null;

  if (existe && hDestino === hOrigen) { iguales.push(rel); nuevas[rel] = hOrigen; continue; }

  /* LA RED. Si lo que hay aqui no es lo que se copio la ultima vez, alguien lo
     ha editado en el configurador. Puede ser un arreglo que aun no ha subido a
     puertas3d, y pisarlo lo perderia sin dejar rastro. */
  const editadoAqui = existe && previas[rel] && hDestino !== previas[rel];
  if (editadoAqui && !forzar) {
    saltados.push(rel);
    continue;
  }
  if (existe && !previas[rel] && !forzar) {
    // Sin huella previa no se puede saber si esta tocado: se avisa igualmente.
    saltados.push(`${rel}  (sin huella de copia anterior)`);
    continue;
  }

  if (aplicar) {
    fs.mkdirSync(path.dirname(a), { recursive: true });
    fs.copyFileSync(de, a);
    nuevas[rel] = hOrigen;
  }
  copiados.push(rel);
}

const lista = (titulo, arr) => { if (arr.length) console.log(`${titulo}\n  ${arr.join('\n  ')}\n`); };

lista(`SE COPIAN (${copiados.length}):`, copiados);
lista(`YA IGUALES (${iguales.length}):`, iguales);
lista(`LOCALES, no se tocan (${locales.length}):`, locales);
lista(`SALTADOS por tener cambios aqui (${saltados.length}):`, saltados);
lista(`NO ESTAN EN EL ORIGEN (${ausentes.length}):`, ausentes);

if (saltados.length && !forzar) {
  console.log('Los saltados tienen cambios locales. Compara antes de decidir:');
  console.log(`  diff js/motor/<fichero> ${ORIGEN}/<fichero>`);
  console.log('Y si decides aceptar uno, NOMBRALO — no fuerces todo de golpe:');
  console.log('  node tools/sync-motor.mjs --aplicar --forzar geom/relieve.js\n');
}

if (aplicar) {
  fs.mkdirSync(DESTINO, { recursive: true });
  fs.writeFileSync(HUELLAS, JSON.stringify(nuevas, null, 2) + '\n');
  fs.writeFileSync(path.join(DESTINO, 'LEEME.txt'),
    'Copia del motor de puertas3d. Lo normal es NO editar aqui:\n' +
    'se corrige en puertas3d y se trae con\n' +
    '  node tools/sync-motor.mjs --aplicar\n\n' +
    'Excepciones que SI viven aqui y el sync no toca:\n' +
    [...LOCALES].map(([k, v]) => `  ${k} — ${v}`).join('\n') + '\n');
  console.log(`Hecho. ${copiados.length} modulos copiados.`);
} else {
  console.log('No se ha tocado nada. Para copiar de verdad: node tools/sync-motor.mjs --aplicar');
}
