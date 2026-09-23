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
import { vanoDe, tirarEnHorizontal, bordeAlto, tirarPorElBorde } from './motor/geom/telaio.js';

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
  /* SENZA L'ARCO. L'arco e' della testa della PORTA, e col sopraluce il
     capotelaio sale sopra il traverso: lassu' il telaio e' dritto. L'arco se lo
     tiene il traverso, che adesso e' lui a fare da testa alla porta. */
  const { arcoAlto, ...resto } = datos;
  return {
    ...resto,
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
    /* Se la porta ha la testa in arco, il traverso la segue: e' lui che le fa
       da capotelaio, e uno dritto le lascerebbe il dito d'aria sulle spalle
       esattamente come glielo lasciava il cabecero.
       Col recorrido non serve alzarlo a mano: `bordeAlto` lo mette gia' alla
       quota del vano della porta, che e' dove andava `desplaza`. */
    const malla = new THREE.Mesh(
      vanoPuerta.arco
        ? tirarPorElBorde(c, bordeAlto(vanoPuerta), vanoPuerta.propio)
        : tirarEnHorizontal(c, vanoAlto.sx, vanoAlto.dx),
      material,
    );
    if (!vanoPuerta.arco) malla.position.y = vanoPuerta.desplaza;
    malla.castShadow = true;
    malla.receiveShadow = true;
    malla.name = 'TraversoSopraluce';
    g.add(malla);
  }
  return g;
}

/**
 * Il vano libero del sopraluce, in coordinate di mondo.
 *
 * Sotto finisce dove finiva la porta, sopra dove comincia il capotelaio che
 * si e' alzato. In mezzo restano esattamente i millimetri chiesti.
 */
export function vanoSopraluce(datosPuerta, datosAlto) {
  const vP = vanoDe(datosPuerta);
  const vA = vanoDe(datosAlto);
  /* IL VETRO COMINCIA DOVE IL TRAVERSO E' PIU' BASSO, non dalla sua cima.
     Con la testa in arco il traverso sale: misurato sulla Vienna, il suo tetto
     sta a 1966 sulle spalle e a 2014 in cima. Partendo dalla cima —che e'
     `vP.su`— il cristallo lasciava TRENTADUE MILLIMETRI DI VUOTO per banda fra
     la spalla del traverso e il suo bordo di sotto. In cima non si vedeva,
     perche' li' il traverso arriva fino al vetro e lo copre: il buco era solo
     ai lati, che e' il posto dove non si va a guardare.

     Partendo dall'imposta il vetro scende dietro al traverso su tutta la corda
     e il legno se lo mangia, che e' come si monta un sopraluce sopra una porta
     a tutto sesto. Il vano VISIBILE non cambia: quello che si aggiunge sta
     dietro al legno.

     Sulle porte dritte non cambia niente: li' `arco` e' null e l'imposta e'
     la cima. */
  return {
    sx: vA.sx,
    dx: vA.dx,
    y0: vP.su - (vP.arco?.flecha ?? 0),
    y1: vA.su - altoTraverso(datosAlto),
  };
}

/**
 * Il vetro che riempie il sopraluce.
 *
 * E' il papel 'vetro' del motore, non un vetro fatto a mano: cosi' porta il
 * suo materiale con la trasmissione, che e' come si riconosce un cristallo, e
 * il configuratore lo tratta come tratta quello delle porte a vetri.
 *
 * La misura si ricava dal vano e non si scrive: cambia con la porta e con
 * l'altezza scelta. Si disegna il vano VISIBILE — il motore fa crescere la
 * lastra di `rientro` per conto suo, che e' il bordo che sta nella battuta.
 *
 * @param {boolean} satinato  true = vetro satinato, false = trasparente
 */
export function piezaVidrio(ancho, alto, satinato = false) {
  return {
    tipo: 'rect', papel: satinato ? 'vetroSatinato' : 'vetro',
    nombre: 'Vetro sopraluce', id: 'sopraluce-vetro',
    x: 0, y: 0, w: ancho, h: alto, r: 0, angulo: 0,
    espesor: 4, bisel: 0, biselAncho: 0, biselPerfil: 'recto',
    perfilBugna: null, perfilPuntos: null, rientro: 16,
    /* BASTONE A ZERO, e non e' un dettaglio.
       Il bastone e' la modanatura del vano, e il motore la tira dalla CARA
       DELL'ANTA fino al pannello: caraHoja = espesorHoja/2. Qui l'anta non
       c'e' — siamo nel telaio, sopra la porta — e quella cara e' un piano
       immaginario. Lasciandolo a 12 il vetro usciva alto 45 mm invece di 4 e
       sporgeva 15 mm davanti al telaio: non era il vetro, era una ghiera di
       legno tirata da una faccia che non esiste.
       La battuta che regge il vetro la fa il telaio, non il vetro. */
    bastoneAncho: 0, bastoneForma: 'sagomato',
    z: -1.5, acabado: satinato ? 'vidrioSatinado' : 'vidrio',
    vidrioEnElCampo: false, huecos: [], grupo: null, visible: true,
  };
}
