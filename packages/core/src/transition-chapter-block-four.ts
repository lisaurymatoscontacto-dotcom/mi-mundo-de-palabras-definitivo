import type { WordCard } from "./index";

function card(
  id: string,
  word: string,
  category: string,
  visual: string,
  syllables: string[],
  readingDifficulty = 2,
  writingDifficulty = Math.min(6, readingDifficulty + 1),
): WordCard {
  return {
    id,
    word,
    category,
    visual,
    visualKind: "emoji",
    visualLicense: "unicode-emoji",
    syllables,
    readingDifficulty,
    writingDifficulty,
    minAge: 4,
    regions: ["latam"],
    demoOnly: true,
  };
}

/**
 * Controlled transition cards for block 4: the sixteen new concepts assigned to
 * Animales 2, Casa 2, Comida 2 and Naturaleza 2. The remaining four slots in
 * each chapter are intentional reviews from chapter one and therefore reuse
 * already-approved cards instead of manufacturing duplicate content.
 */
export const TRANSITION_BLOCK_FOUR_CARDS: WordCard[] = [
  // Animales 2
  card("animales.aguila", "ÁGUILA", "Animales", "🦅", ["Á", "GUI", "LA"]),
  card("animales.jirafa", "JIRAFA", "Animales", "🦒", ["JI", "RA", "FA"]),
  card("animales.cebra", "CEBRA", "Animales", "🦓", ["CE", "BRA"]),
  card("animales.gorila", "GORILA", "Animales", "🦍", ["GO", "RI", "LA"]),
  card("animales.koala", "KOALA", "Animales", "🐨", ["KO", "A", "LA"]),
  card("animales.ballena", "BALLENA", "Animales", "🐋", ["BA", "LLE", "NA"]),
  card("animales.delfin", "DELFÍN", "Animales", "🐬", ["DEL", "FÍN"]),
  card("animales.tortuga", "TORTUGA", "Animales", "🐢", ["TOR", "TU", "GA"]),
  card("animales.cocodrilo", "COCODRILO", "Animales", "🐊", ["CO", "CO", "DRI", "LO"], 3, 3),
  card("animales.mariposa", "MARIPOSA", "Animales", "🦋", ["MA", "RI", "PO", "SA"]),
  card("animales.elefante", "ELEFANTE", "Animales", "🐘", ["E", "LE", "FAN", "TE"]),
  card("animales.murcielago", "MURCIÉLAGO", "Animales", "🦇", ["MUR", "CIÉ", "LA", "GO"], 3, 4),
  card("animales.hipopotamo", "HIPOPÓTAMO", "Animales", "🦛", ["HI", "PO", "PÓ", "TA", "MO"], 3, 4),
  card("animales.rinoceronte", "RINOCERONTE", "Animales", "🦏", ["RI", "NO", "CE", "RON", "TE"], 3, 4),
  card("animales.pinguino", "PINGÜINO", "Animales", "🐧", ["PIN", "GÜI", "NO"]),
  card("animales.buho", "BÚHO", "Animales", "🦉", ["BÚ", "HO"]),

  // Casa 2
  card("casa.ventana", "VENTANA", "Casa", "🪟", ["VEN", "TA", "NA"]),
  card("casa.escoba", "ESCOBA", "Casa", "🧹", ["ES", "CO", "BA"]),
  card("casa.cubeta", "CUBETA", "Casa", "🪣", ["CU", "BE", "TA"]),
  card("casa.escalera", "ESCALERA", "Casa", "🪜", ["ES", "CA", "LE", "RA"]),
  card("casa.inodoro", "INODORO", "Casa", "🚽", ["I", "NO", "DO", "RO"]),
  card("casa.banyera", "BAÑERA", "Casa", "🛁", ["BA", "ÑE", "RA"]),
  card("casa.jabon", "JABÓN", "Casa", "🧼", ["JA", "BÓN"]),
  card("casa.tetera", "TETERA", "Casa", "🫖", ["TE", "TE", "RA"]),
  card("casa.enchufe", "ENCHUFE", "Casa", "🔌", ["EN", "CHU", "FE"]),
  card("casa.antena", "ANTENA", "Casa", "📡", ["AN", "TE", "NA"]),
  card("casa.impresora", "IMPRESORA", "Casa", "🖨️", ["IM", "PRE", "SO", "RA"]),
  card("casa.teclado", "TECLADO", "Casa", "⌨️", ["TE", "CLA", "DO"]),
  card("casa.monitor", "MONITOR", "Casa", "🖥️", ["MO", "NI", "TOR"]),
  card("casa.martillo", "MARTILLO", "Casa", "🔨", ["MAR", "TI", "LLO"]),
  card("casa.linterna", "LINTERNA", "Casa", "🔦", ["LIN", "TER", "NA"]),
  card("casa.extintor", "EXTINTOR", "Casa", "🧯", ["EX", "TIN", "TOR"]),

  // Comida 2
  card("comida.naranja", "NARANJA", "Comida", "🍊", ["NA", "RAN", "JA"]),
  card("comida.galleta", "GALLETA", "Comida", "🍪", ["GA", "LLE", "TA"]),
  card("comida.helado", "HELADO", "Comida", "🍨", ["HE", "LA", "DO"]),
  card("comida.zanahoria", "ZANAHORIA", "Comida", "🥕", ["ZA", "NA", "HO", "RIA"], 3, 3),
  card("comida.aguacate", "AGUACATE", "Comida", "🥑", ["A", "GUA", "CA", "TE"]),
  card("comida.sandia", "SANDÍA", "Comida", "🍉", ["SAN", "DÍ", "A"]),
  card("comida.chocolate", "CHOCOLATE", "Comida", "🍫", ["CHO", "CO", "LA", "TE"]),
  card("comida.frijol", "FRIJOL", "Comida", "🫘", ["FRI", "JOL"]),
  card("comida.platano", "PLÁTANO", "Comida", "🍌", ["PLÁ", "TA", "NO"]),
  card("comida.cereza", "CEREZA", "Comida", "🍒", ["CE", "RE", "ZA"]),
  card("comida.kiwi", "KIWI", "Comida", "🥝", ["KI", "WI"]),
  card("comida.lechuga", "LECHUGA", "Comida", "🥬", ["LE", "CHU", "GA"]),
  card("comida.pepino", "PEPINO", "Comida", "🥒", ["PE", "PI", "NO"]),
  card("comida.berenjena", "BERENJENA", "Comida", "🍆", ["BE", "REN", "JE", "NA"]),
  card("comida.brocoli", "BRÓCOLI", "Comida", "🥦", ["BRÓ", "CO", "LI"]),
  card("comida.pizza", "PIZZA", "Comida", "🍕", ["PIZ", "ZA"]),

  // Naturaleza 2
  card("naturaleza.pino", "PINO", "Naturaleza", "🌲", ["PI", "NO"]),
  card("naturaleza.viento", "VIENTO", "Naturaleza", "💨", ["VIEN", "TO"]),
  card("naturaleza.relampago", "RELÁMPAGO", "Naturaleza", "⚡", ["RE", "LÁM", "PA", "GO"], 3, 3),
  card("naturaleza.agua", "AGUA", "Naturaleza", "💧", ["A", "GUA"]),
  card("naturaleza.hielo", "HIELO", "Naturaleza", "🧊", ["HIE", "LO"]),
  card("naturaleza.niebla", "NIEBLA", "Naturaleza", "🌫️", ["NIE", "BLA"]),
  card("naturaleza.tornado", "TORNADO", "Naturaleza", "🌪️", ["TOR", "NA", "DO"]),
  card("naturaleza.amanecer", "AMANECER", "Naturaleza", "🌅", ["A", "MA", "NE", "CER"]),
  card("naturaleza.palmera", "PALMERA", "Naturaleza", "🌴", ["PAL", "ME", "RA"]),
  card("naturaleza.bambu", "BAMBÚ", "Naturaleza", "🎋", ["BAM", "BÚ"]),
  card("naturaleza.rosa", "ROSA", "Naturaleza", "🌹", ["RO", "SA"]),
  card("naturaleza.tulipan", "TULIPÁN", "Naturaleza", "🌷", ["TU", "LI", "PÁN"]),
  card("naturaleza.girasol", "GIRASOL", "Naturaleza", "🌻", ["GI", "RA", "SOL"]),
  card("naturaleza.loto", "LOTO", "Naturaleza", "🪷", ["LO", "TO"]),
  card("naturaleza.cactus", "CACTUS", "Naturaleza", "🌵", ["CAC", "TUS"]),
  card("naturaleza.hongo", "HONGO", "Naturaleza", "🍄", ["HON", "GO"]),
];
