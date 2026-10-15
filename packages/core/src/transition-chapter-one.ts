import type { WordCard } from "./index";

function card(
  id: string,
  word: string,
  category: string,
  visual: string,
  syllables: string[],
  readingDifficulty = 1,
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
 * Controlled transition cards that complete the first four curriculum chapters.
 * Their runtime visuals are replaced by the authoritative local asset catalog;
 * these Unicode values are semantic/editorial fallbacks only.
 */
export const TRANSITION_CHAPTER_ONE_CARDS: WordCard[] = [
  // Casa 1 — 14 additions + 6 previously reviewed cards = 20.
  card("silla", "SILLA", "Casa", "🪑", ["SI", "LLA"]),
  card("taza", "TAZA", "Casa", "☕", ["TA", "ZA"]),
  card("sofa", "SOFÁ", "Casa", "🛋️", ["SO", "FÁ"]),
  card("espejo", "ESPEJO", "Casa", "🪞", ["ES", "PE", "JO"]),
  card("cuchara", "CUCHARA", "Casa", "🥄", ["CU", "CHA", "RA"]),
  card("tenedor", "TENEDOR", "Casa", "🍴", ["TE", "NE", "DOR"]),
  card("cuchillo", "CUCHILLO", "Casa", "🔪", ["CU", "CHI", "LLO"], 2, 2),
  card("televisor", "TELEVISOR", "Casa", "📺", ["TE", "LE", "VI", "SOR"], 2, 3),
  card("reloj", "RELOJ", "Casa", "🕒", ["RE", "LOJ"], 2, 2),
  card("llave", "LLAVE", "Casa", "🔑", ["LLA", "VE"]),
  card("ducha", "DUCHA", "Casa", "🚿", ["DU", "CHA"]),
  card("cesta", "CESTA", "Casa", "🧺", ["CES", "TA"]),
  card("caja", "CAJA", "Casa", "📦", ["CA", "JA"]),
  card("bombilla", "BOMBILLA", "Casa", "💡", ["BOM", "BI", "LLA"], 2, 3),

  // Comida 1 — all direct, child-readable food concepts.
  card("arroz", "ARROZ", "Comida", "🍚", ["A", "RROZ"]),
  card("miel", "MIEL", "Comida", "🍯", ["MIEL"]),
  card("huevo", "HUEVO", "Comida", "🥚", ["HUE", "VO"]),
  card("leche", "LECHE", "Comida", "🥛", ["LE", "CHE"]),
  card("papa", "PAPA", "Comida", "🥔", ["PA", "PA"]),
  card("maiz", "MAÍZ", "Comida", "🌽", ["MA", "ÍZ"], 2, 2),
  card("mango", "MANGO", "Comida", "🥭", ["MAN", "GO"]),
  card("melon", "MELÓN", "Comida", "🍈", ["ME", "LÓN"]),
  card("limon", "LIMÓN", "Comida", "🍋", ["LI", "MÓN"]),
  card("fresa", "FRESA", "Comida", "🍓", ["FRE", "SA"]),
  card("pina", "PIÑA", "Comida", "🍍", ["PI", "ÑA"]),
  card("coco", "COCO", "Comida", "🥥", ["CO", "CO"]),
  card("banana", "BANANA", "Comida", "🍌", ["BA", "NA", "NA"]),
  card("manzana", "MANZANA", "Comida", "🍎", ["MAN", "ZA", "NA"], 2, 2),

  // Naturaleza 1 — direct natural symbols; ambiguous geography waits for later chapters/photos.
  card("hoja", "HOJA", "Naturaleza", "🍃", ["HO", "JA"]),
  card("roca", "ROCA", "Naturaleza", "🪨", ["RO", "CA"]),
  card("playa", "PLAYA", "Naturaleza", "🏖️", ["PLA", "YA"], 2, 2),
  card("lluvia", "LLUVIA", "Naturaleza", "🌧️", ["LLU", "VIA"], 2, 2),
  card("nieve", "NIEVE", "Naturaleza", "❄️", ["NIE", "VE"]),
  card("fuego", "FUEGO", "Naturaleza", "🔥", ["FUE", "GO"]),
  card("arbol", "ÁRBOL", "Naturaleza", "🌳", ["ÁR", "BOL"], 2, 2),
  card("isla", "ISLA", "Naturaleza", "🏝️", ["IS", "LA"], 2, 2),
  card("estrella", "ESTRELLA", "Naturaleza", "⭐", ["ES", "TRE", "LLA"], 2, 3),
  card("volcan", "VOLCÁN", "Naturaleza", "🌋", ["VOL", "CÁN"], 2, 3),
  card("desierto", "DESIERTO", "Naturaleza", "🏜️", ["DE", "SIER", "TO"], 2, 3),
  card("montana", "MONTAÑA", "Naturaleza", "🏔️", ["MON", "TA", "ÑA"], 2, 3),
  card("arcoiris", "ARCOÍRIS", "Naturaleza", "🌈", ["AR", "CO", "Í", "RIS"], 2, 3),
  card("tormenta", "TORMENTA", "Naturaleza", "⛈️", ["TOR", "MEN", "TA"], 2, 3),
];
