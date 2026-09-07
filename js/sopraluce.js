/* ============================================================
   IL SOPRALUCE — per adesso solo il VANO
   ------------------------------------------------------------
   Il listino lo vende in tre modi (voci 13, 14 e 15): fisso,
   apribile e apribile a wasistas. Qui c'e' solo la parte che si
   puo' costruire senza inventare niente: il vano.

   Cioe' il telaio che sale, e il traverso che separa la porta da
   quello che le sta sopra. Dentro non c'e' nulla — ne' vetro ne'
   anta — perche' nessuna delle due si sa ancora com'e' fatta:
   manca la sezione del traverso di fabbrica e manca sapere cosa
   riempie il vano. Meglio un buco onesto che un vetro inventato.

   COSA E' APPROSSIMATO, e va rifatto quando arriva la lamina:
   il traverso e' il profilo del CAPOTELAIO riusato tale e quale.
   Verso il basso e' esatto — e' la stessa testa che avrebbe una
   porta senza sopraluce — ma verso l'alto mostra il suo dorso
   piatto invece del battente che avrebbe un traverso vero.

   PERCHE' IL RESTO VIENE GRATIS. Il telaio non e' disegnato a
   un'altezza fissa: vanoDe() la calcola dal canto alto dell'anta
   e tutto insegue quel numero — i montanti si tirano da 0 a su,
   il capotelaio si sposta di `desplaza`, il muro apre il suo
   vano e il coprifilo gira intorno. Alzare il telaio e' passare
   un cantoAltoHoja piu' alto: non si tocca una riga di quelli.
   ============================================================ */

import * as THREE from 'three';
import { vanoDe, tirarEnHorizontal } from './motor/geom/telaio.js';

/** Altezze di listino. Il prezzo copre "fino a 50 cm". */
export const SOPRALUCE_MIN = 150;
export const SOPRALUCE_MAX = 500;
export const SOPRALUCE_DEFAULT = 400;

/* Quanto e' alto il traverso. E' l'altezza del profilo del capotelaio, che e'
   quello che stiamo riusando: tenerli uguali fa tornare i conti da soli. */
export function altoTraverso(datos) {
  const ys = datos.telaio_alto_imbotto.flatMap((c) => c.map((p) => p[0]));
  return Math.max(...ys) - Math.min(...ys);
}

/**
 * I dati del telaio con il sopraluce sopra.
 *
 * Non tocca l'anta: quella resta dov'e', appoggiata a terra. Sale solo il
 * telaio, e con lui il muro e il coprifilo.
 */
export function conSopraluce(datos, alturaVano) {
  if (!(alturaVano > 0)) return datos;
  return {
    ...datos,
    cantoAltoHoja: datos.cantoAltoHoja + altoTraverso(datos) + alturaVano,
  };
}

/**
 * Il traverso fra la porta e il sopraluce.
 *
 * Si mette dove sarebbe finito il capotelaio se il sopraluce non ci fosse:
 * si ricalcola il vano com'era prima di alzarlo e si usa il suo `desplaza`.
 * Cosi' la porta sotto ha esattamente la testa che avrebbe sempre avuto.
 */
export function traversoDe(datosPuerta, datosAlto, material) {
  const vanoPuerta = vanoDe(datosPuerta);   // dove finiva la porta
  const vanoAlto = vanoDe(datosAlto);       // dove finisce adesso il telaio
  const g = new THREE.Group();

  for (const c of datosAlto.telaio_alto_imbotto) {
    const malla = new THREE.Mesh(
      tirarEnHorizontal(c, vanoAlto.sx, vanoAlto.dx),
      material,
    );
    malla.position.y = vanoPuerta.desplaza;
    malla.castShadow = true;
    malla.receiveShadow = true;
    malla.name = 'TraversoSopraluce';
    g.add(malla);
  }
  return g;
}
