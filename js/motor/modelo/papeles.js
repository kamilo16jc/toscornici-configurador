/**
 * Los papeles que puede cumplir una pieza dentro de una puerta.
 *
 * Las medidas NO son una invencion: salen de la puerta Siena del configurador
 * (assets/porte/siena/anta.json), que a su vez sale de la lamina BASE_HT789.dxf.
 * Y son las mismas para todo el catalogo, porque lo unico que cambia de un
 * modelo a otro es donde caen los traversi y que riquadri quedan entre ellos.
 *
 * Por eso asignar un papel no es "rellenar unos campos por comodidad": es la
 * forma correcta de trabajar aqui. Quien dibuja decide QUE es cada parte; el
 * cuanto mide ya esta resuelto.
 *
 * Referencia de profundidades, con la hoja centrada en z = 0 (de -22,5 a 22,5):
 *   el pannello va centrado a 21 mm del dorso, o sea a -1,5 del plano medio.
 *
 * El RIENTRO merece explicacion. Un panel no mide lo que se ve: es mas grande
 * que el hueco, y su canto se esconde dentro de la ranura, tapado por el labio
 * del bastone. En la Siena son 16 mm por lado (montante de 114 contra riquadro
 * que arranca en 98). Por eso se dibuja el hueco VISIBLE y la pieza se crece
 * sola: si se dibujara el panel a su medida real, al calcar sobre una foto
 * habria que adivinar 16 mm que no se ven.
 */

export const PAPELES = [
  {
    id: 'montante',
    emoji: '🪵',
    it: 'Montante',
    es: 'Larguero',
    ayuda: 'Las dos piezas verticales de la hoja. Van de arriba abajo.',
    props: { espesor: 45, bisel: 0, biselAncho: 0, z: 0, acabado: 'robleClaro' },
  },
  {
    id: 'traverso',
    emoji: '➖',
    it: 'Traverso',
    es: 'Travesaño',
    ayuda: 'Las horizontales entre los dos largueros. Aquí está medio diseño.',
    props: { espesor: 45, bisel: 0, biselAncho: 0, z: 0, acabado: 'robleClaro' },
  },
  {
    id: 'tavola',
    emoji: '🟫',
    it: 'Tavola',
    es: 'Alma',
    ayuda: 'Una sola tabla de montante a montante, con los vanos recortados. Los travesaños son lo que sobra.',
    props: { espesor: 45, bisel: 0, biselAncho: 0, z: 0, acabado: 'robleClaro' },
  },
  {
    id: 'pannello',
    emoji: '▭',
    it: 'Pannello',
    es: 'Panel liso',
    ayuda: 'La tabla que rellena el entrepaño, sin relieve. Flota en la ranura.',
    props: { espesor: 21, bisel: 0, biselAncho: 0, rientro: 16, bastoneAncho: 12, bastoneForma: 'sagomato', z: -1.5, acabado: 'robleClaro' },
  },
  {
    id: 'bugnato',
    emoji: '1️⃣',
    it: 'Finitura 1 — bisello doppio gradino',
    es: 'TIPO 1',
    ayuda: 'Panel realzado con el bisel de doble escalón de 14 mm dando la vuelta. El campo sube 4 mm sobre el canto.',
    props: {
      // 16 de lengueta escondida + 14 de bisel = 30.
      espesor: 21, biselAncho: 30, bisel: 4, biselPerfil: 'recto', rientro: 16,
      /* El relieve no se traza: se genera metiendo el contorno hacia dentro
         siguiendo este perfil. De la ficha classic_double_step_bevel_001 sale
         la FORMA del bisel — 2,5x0,2 / 6,5x2,4 / 2 llanos / 3x1,4 — pero no el
         sentido: ella hunde el campo y aqui va levantado. Los ingletes de las
         esquinas salen solos, el "45_degree_miter", y da la vuelta entera al
         panel ("continuous": true en los cuatro lados). */
      perfilBugna: 'dobleEscalon', biselSimetrico: true,
      z: -1.5, acabado: 'robleClaro',
      /* La moldura que remata el encuentro del armazon con la bugna. Se
         genera sola alrededor del vano: quien dibuja traza el hueco y no tiene
         que acordarse de rodearlo. La forma se elige en el panel. */
      bastoneAncho: 12, bastoneForma: 'sagomato',
    },
  },
  {
    id: 'perfilado',
    emoji: '🌙',
    it: 'Sagoma',
    es: 'Perfilado',
    ayuda: 'Madera de cualquier forma —curva, en diagonal, de medio punto— que PARTE el panel por donde pasa. Al revés que un travesaño, que es el que cede. Admite los mismos relieves que una bugna.',
    props: {
      espesor: 45, z: 0, acabado: 'robleClaro',
      /* Nace LISO y a canto vivo, igual que un travesano o un larguero, para
         que empalme con ellos sin escalon. Antes traia bisel 6 y ancho 20 para
         que el desplegable de bugnas funcionase, pero esos dos numeros biselan
         el canto TAMBIEN sin bugna —por la via normal de extruir— y entonces
         el perfilado llegaba al larguero con el canto matado mientras el
         larguero lo tiene a escuadra. El ancho se pone solo al elegir un
         relieve; ver main.js. */
      bisel: 0, biselAncho: 0, biselPerfil: 'recto', rientro: 0,
      perfilBugna: null, biselSimetrico: true,
      // La moldura del vano es cosa del panel; el perfilado no lleva la suya.
      bastoneAncho: 0,
    },
  },
  {
    id: 'bastone',
    emoji: '➿',
    it: 'Bastone',
    es: 'Bastón',
    ayuda: 'El labio interior que tapa el canto del panel. Monta 16 mm sobre él.',
    props: { espesor: 45, bisel: 4, biselAncho: 16, biselPerfil: 'redondo', z: 0, acabado: 'robleClaro' },
  },
  {
    id: 'vetro',
    emoji: '🪟',
    it: 'Vetro',
    es: 'Vidrio',
    ayuda: 'Cristal dentro del entrepaño. Va en la misma ranura que el panel.',
    props: { espesor: 4, bisel: 0, biselAncho: 0, rientro: 16, bastoneAncho: 12, bastoneForma: 'sagomato', z: -1.5, acabado: 'vidrio' },
  },
  {
    id: 'bugnatoVetro',
    emoji: '🔳',
    it: 'Bugnato con vetro',
    es: 'Realzado con vidrio',
    ayuda: 'Panel realzado de madera con el campo central de vidrio. El bisel es madera; el cristal solo ocupa la meseta.',
    props: {
      // Es un panel de madera, no un cristal: mismo espesor y mismo perfil que
      // el realzado normal. Lo unico que cambia es que la meseta queda hueca y
      // la tapa un cristal.
      /* 36 y no 60. El bisel se mide desde el contorno YA crecido por la
         lengueta, asi que la madera que se ve a cada lado es biselAncho menos
         rientro: con 60 eran 44 mm por banda y el cristal se quedaba en el
         74 % del hueco, que en un panel estrecho lo ahoga. Con 36 son 20 mm,
         que es rebaje de sobra para asentar una luna, y el cristal sube al
         88 %. Es un numero, no una forma: el perfil sigue siendo el mismo. */
      espesor: 21, biselAncho: 36, bisel: 10.5, biselPerfil: 'redondo',
      perfilBugna: 'siena', biselSimetrico: true, rientro: 16,
      z: -1.5, acabado: 'robleClaro', bastoneAncho: 12, bastoneForma: 'sagomato',
      // El cristal del campo: se genera solo, con su propio grosor y acabado.
      vidrioEnElCampo: true, espesorVidrio: 4, acabadoVidrio: 'vidrioSatinado',
    },
  },
  {
    id: 'vetroSatinato',
    emoji: '🌫️',
    it: 'Vetro satinato',
    es: 'Vidrio satinado',
    ayuda: 'Cristal translúcido, el que se usa cuando no se quiere ver a través.',
    props: { espesor: 4, bisel: 0, biselAncho: 0, rientro: 16, bastoneAncho: 12, bastoneForma: 'sagomato', z: -1.5, acabado: 'vidrioSatinado' },
  },
  {
    id: 'incisione',
    emoji: '〽️',
    it: 'Incisione',
    es: 'Grabado',
    ayuda: 'Surco fresado sobre la cara, sin atravesar. Decorativo.',
    props: { espesor: 3, bisel: 1, biselAncho: 3, biselPerfil: 'redondo', z: 22.5, acabado: 'robleClaro' },
  },
  {
    id: 'listello',
    emoji: '📏',
    it: 'Listello',
    es: 'Junquillo',
    ayuda: 'Moldura fina de remate, aplicada sobre la cara.',
    props: { espesor: 10, bisel: 3, biselAncho: 8, biselPerfil: 'redondo', z: 20, acabado: 'robleClaro' },
  },
  {
    id: 'maniglia',
    emoji: '🔘',
    it: 'Maniglia',
    es: 'Manilla',
    ayuda: 'Manilla y roseta. Siempre a 1040 mm del suelo.',
    props: { espesor: 18, bisel: 2, biselAncho: 4, biselPerfil: 'redondo', z: 26, acabado: 'laton' },
  },
];

export const papelPorId = (id) => PAPELES.find((p) => p.id === id) ?? null;

/** Vuelca sobre la pieza las medidas del papel, y deja constancia de cuál es. */
export function aplicarPapel(pieza, id, { soloFaltantes = false } = {}) {
  const papel = papelPorId(id);
  if (!papel) return pieza;

  /* soloFaltantes: rellena lo que le FALTE a la pieza y no toca lo demas.
     Es para cuando se ABRE un proyecto. Reaplicando el papel entero se perdia
     todo lo que hubiera elegido a mano —el perfil de la bugna, el ancho del
     bisel, la moldura del vano— y el archivo se abria distinto de como se
     habia guardado: se elegia un realzado y salia el de serie.
     Asi el papel solo sirve para completar puertas viejas, que es lo que se
     buscaba, sin pisar decisiones. */
  if (soloFaltantes) {
    for (const [k, v] of Object.entries(papel.props)) {
      if (pieza[k] === undefined) pieza[k] = v;
    }
    if (pieza.biselPerfil === undefined) pieza.biselPerfil = papel.props.biselPerfil ?? 'recto';
    if (pieza.perfilBugna === undefined) pieza.perfilBugna = papel.props.perfilBugna ?? null;
    if (pieza.perfilPuntos === undefined) pieza.perfilPuntos = null;
    pieza.papel = id;
    return pieza;
  }
  /* Una seccion dibujada a mano solo sobrevive si el papel es el mismo. Al
     ABRIR un proyecto se reaplica el papel que ya tenia, y ahi el dibujo debe
     quedarse: lo puso quien dibuja a proposito. Al CAMBIAR de papel se tira,
     porque el dibujo era del papel anterior. */
  const propio = pieza.papel === id ? pieza.perfilPuntos : null;
  pieza.papel = id;
  // Los que no declaran estas dos son canto recto y sin bugna. Hay que
  // reponerlas a mano: si no, una pieza que fue panel realzado se quedaria con
  // el relieve puesto al pasarla a larguero.
  pieza.biselPerfil = papel.props.biselPerfil ?? 'recto';
  pieza.perfilBugna = papel.props.perfilBugna ?? null;
  pieza.rientro = papel.props.rientro ?? 0;
  pieza.vidrioEnElCampo = papel.props.vidrioEnElCampo ?? false;
  pieza.bastoneAncho = papel.props.bastoneAncho ?? 0;
  pieza.bastoneForma = papel.props.bastoneForma ?? 'sagomato';
  Object.assign(pieza, papel.props);
  pieza.perfilPuntos = propio ?? null;
  return pieza;
}
