export type RecommendedVisualKind = "emoji" | "photo";

export interface AssetProductionTask {
  id: string;
  conceptId: string;
  category: string;
  word: string;
  audioId: string;
  recommendedVisualKind: RecommendedVisualKind;
  emojiCandidate?: string;
  photoId?: string;
  photoLicensePolicy: "public-domain-or-cc0";
  photoSourcePolicy: "verified-source-required";
}

const CURATED_EMOJI_BY_WORD: Record<string, string> = {
  GATO: "🐱", PATO: "🦆", VACA: "🐄", LOBO: "🐺", RANA: "🐸", MONO: "🐵", PERRO: "🐶", PEZ: "🐟",
  OSO: "🐻", "LEÓN": "🦁", TIGRE: "🐯", CONEJO: "🐰", CABALLO: "🐴", CERDO: "🐷", OVEJA: "🐑", CABRA: "🐐",
  "RATÓN": "🐭", ZORRO: "🦊", ABEJA: "🐝", "ARAÑA": "🕷️", "ÁGUILA": "🦅", JIRAFA: "🦒", CEBRA: "🦓",
  GORILA: "🦍", KOALA: "🐨", BALLENA: "🐋", "DELFÍN": "🐬", TORTUGA: "🐢", COCODRILO: "🐊", MARIPOSA: "🦋", ELEFANTE: "🐘",
  CASA: "🏠", CAMA: "🛏️", PUERTA: "🚪", SOFÁ: "🛋️", ESPEJO: "🪞", CUCHARA: "🥄", TENEDOR: "🍴", CUCHILLO: "🔪",
  LÁMPARA: "💡", TELEVISOR: "📺", RELOJ: "🕒", LLAVE: "🔑", DUCHA: "🚿",
  PAN: "🍞", SOPA: "🍲", PERA: "🍐", UVA: "🍇", TOMATE: "🍅", QUESO: "🧀", MIEL: "🍯", HUEVO: "🥚",
  LECHE: "🥛", POLLO: "🍗", PAPA: "🥔", MAÍZ: "🌽", MANGO: "🥭", MELÓN: "🍈", "LIMÓN": "🍋", FRESA: "🍓",
  "PIÑA": "🍍", COCO: "🥥", BANANA: "🍌", MANZANA: "🍎", NARANJA: "🍊", GALLETA: "🍪", HELADO: "🍦",
  ZANAHORIA: "🥕", AGUACATE: "🥑", "SANDÍA": "🍉", CHOCOLATE: "🍫", YOGUR: "🥣",
  LUNA: "🌙", NUBE: "☁️", SOL: "☀️", MAR: "🌊", FLOR: "🌼", HOJA: "🍃", ROCA: "🪨", PLAYA: "🏖️",
  LLUVIA: "🌧️", NIEVE: "❄️", FUEGO: "🔥", "ÁRBOL": "🌳", BOSQUE: "🌲", ISLA: "🏝️", CIELO: "🌤️", ESTRELLA: "⭐",
  "VOLCÁN": "🌋", DESIERTO: "🏜️", CASCADA: "🏞️", "MONTAÑA": "🏔️", "ARCOÍRIS": "🌈", TORMENTA: "⛈️", RELÁMPAGO: "⚡",
  PIE: "🦶", MANO: "✋", OJO: "👁️", BOCA: "👄", NARIZ: "👃", CARA: "🙂", PELO: "💇", DEDO: "☝️",
  BRAZO: "💪", DIENTE: "🦷", LENGUA: "👅", PIERNA: "🦵", CABEZA: "🗣️", OREJA: "👂", CORAZÓN: "❤️", ESTÓMAGO: "🫃",
  BOTA: "🥾", GORRO: "🧢", FALDA: "👗", CAMISA: "👕", PANTALÓN: "👖", ZAPATO: "👞", ABRIGO: "🧥", GUANTE: "🧤",
  BUFANDA: "🧣", VESTIDO: "👗", SANDALIA: "🩴", CINTURÓN: "🥋", CORBATA: "👔", BOTÓN: "🔘", SOMBRERO: "👒", CALCETÍN: "🧦",
  AUTO: "🚗", MOTO: "🏍️", BUS: "🚌", TREN: "🚆", BARCO: "🚢", BOTE: "🚤", TAXI: "🚕", METRO: "🚇",
  AVIÓN: "✈️", CAMIÓN: "🚚", CARRO: "🚗", CANOA: "🛶", BICICLETA: "🚲", PATINETA: "🛹", TRACTOR: "🚜", COHETE: "🚀",
  SUBMARINO: "🛥️", HELICÓPTERO: "🚁", AMBULANCIA: "🚑", TRANVÍA: "🚋", VELERO: "⛵", GLOBO: "🎈", PARACAÍDAS: "🪂", FERRY: "⛴️",
  LIBRO: "📖", LÁPIZ: "✏️", GOMA: "🧽", REGLA: "📏", MAPA: "🗺️", PAPEL: "📄", CUADERNO: "📓", MOCHILA: "🎒",
  TIJERA: "✂️", COLORES: "🖍️", COMPUTADORA: "💻", CALCULADORA: "🧮", PINCEL: "🖌️", DIPLOMA: "🎓",
  DADO: "🎲", ARO: "⭕", BOLA: "⚪", CUBO: "🧊", "YO-YO": "🪀", PELOTA: "⚽", COMETA: "🪁", ROBOT: "🤖",
  TAMBOR: "🥁", BALÓN: "⚽", PELUCHE: "🧸", COLUMPIO: "🛝", TRICICLO: "🚲", CASTILLO: "🏰", VIDEOJUEGO: "🎮", BURBUJA: "🫧",
  OLA: "🌊", CORAL: "🪸", FOCA: "🦭", PULPO: "🐙", TIBURÓN: "🦈", MEDUSA: "🪼", CANGREJO: "🦀", CONCHA: "🐚",
  CARACOL: "🐌", LANGOSTA: "🦞", CALAMAR: "🦑", ANCLA: "⚓", FARO: "🗼", ORCA: "🐋", OSTRA: "🦪",
  PLANETA: "🪐", NAVE: "🚀", MARTE: "🔴", SATÉLITE: "🛰️", ASTRONAUTA: "🧑‍🚀", GALAXIA: "🌌", METEORITO: "☄️", TELESCOPIO: "🔭",
  GALLO: "🐓", GALLINA: "🐔", SEMILLA: "🌱", PALA: "🪏", ESPANTAPÁJAROS: "🧑‍🌾", CAMPESINO: "🧑‍🌾", LECHUGA: "🥬",
};

/**
 * Conservative allow-list used by automation. The broader curated map above is
 * only an editorial suggestion list; being present there does not make an emoji
 * pedagogically safe. Ambiguous approximations deliberately fall through to
 * photo/missing so the importer never chooses a misleading symbol just because
 * one exists.
 */
const AUTOMATIC_EMOJI_WORDS = new Set([
  "GATO", "PATO", "VACA", "LOBO", "RANA", "MONO", "PERRO", "PEZ", "OSO", "LEÓN", "TIGRE", "CONEJO", "CABALLO", "CERDO", "OVEJA", "CABRA", "RATÓN", "ZORRO", "ABEJA", "ARAÑA", "ÁGUILA", "JIRAFA", "CEBRA", "GORILA", "KOALA", "BALLENA", "DELFÍN", "TORTUGA", "COCODRILO", "MARIPOSA", "ELEFANTE",
  "CASA", "CAMA", "PUERTA", "SOFÁ", "ESPEJO", "CUCHARA", "TENEDOR", "CUCHILLO", "TELEVISOR", "RELOJ", "LLAVE", "DUCHA",
  "PAN", "SOPA", "PERA", "UVA", "TOMATE", "QUESO", "MIEL", "HUEVO", "LECHE", "PAPA", "MAÍZ", "MANGO", "MELÓN", "LIMÓN", "FRESA", "PIÑA", "COCO", "BANANA", "MANZANA", "NARANJA", "GALLETA", "HELADO", "ZANAHORIA", "AGUACATE", "SANDÍA", "CHOCOLATE",
  "LUNA", "NUBE", "SOL", "FLOR", "HOJA", "ROCA", "PLAYA", "LLUVIA", "NIEVE", "FUEGO", "ÁRBOL", "ISLA", "ESTRELLA", "VOLCÁN", "DESIERTO", "MONTAÑA", "ARCOÍRIS", "TORMENTA", "RELÁMPAGO",
  "PIE", "MANO", "OJO", "BOCA", "NARIZ", "CARA", "DEDO", "BRAZO", "DIENTE", "LENGUA", "PIERNA", "OREJA", "CORAZÓN",
  "BOTA", "CAMISA", "PANTALÓN", "ZAPATO", "ABRIGO", "GUANTE", "BUFANDA", "VESTIDO", "SANDALIA", "CORBATA", "SOMBRERO", "CALCETÍN",
  "AUTO", "MOTO", "BUS", "TREN", "BARCO", "BOTE", "TAXI", "METRO", "AVIÓN", "CAMIÓN", "CARRO", "CANOA", "BICICLETA", "PATINETA", "TRACTOR", "COHETE", "HELICÓPTERO", "AMBULANCIA", "TRANVÍA", "VELERO", "PARACAÍDAS", "FERRY",
  "LIBRO", "LÁPIZ", "REGLA", "MAPA", "PAPEL", "CUADERNO", "MOCHILA", "TIJERA", "COLORES", "COMPUTADORA", "CALCULADORA", "PINCEL", "DIPLOMA",
  "DADO", "YO-YO", "PELOTA", "COMETA", "ROBOT", "TAMBOR", "BALÓN", "PELUCHE", "CASTILLO", "VIDEOJUEGO", "BURBUJA",
  "OLA", "CORAL", "FOCA", "PULPO", "TIBURÓN", "MEDUSA", "CANGREJO", "CONCHA", "CARACOL", "LANGOSTA", "CALAMAR", "ANCLA", "ORCA", "OSTRA",
  "PLANETA", "NAVE", "SATÉLITE", "ASTRONAUTA", "GALAXIA", "METEORITO", "TELESCOPIO",
  "GALLO", "GALLINA", "SEMILLA", "PALA", "CAMPESINO", "LECHUGA",
]);

export function contentSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Broad editorial suggestion. Never use this function as an automatic approval gate. */
export function recommendedEmojiForWord(word: string) {
  return CURATED_EMOJI_BY_WORD[word.toLocaleUpperCase("es")];
}

/** Conservative automatic choice: undefined means use photo/missing instead. */
export function automaticEmojiForWord(word: string) {
  const normalized = word.toLocaleUpperCase("es");
  if (!AUTOMATIC_EMOJI_WORDS.has(normalized)) return undefined;
  return CURATED_EMOJI_BY_WORD[normalized];
}

export function createAssetProductionManifest(categories: Record<string, string[]>): AssetProductionTask[] {
  return Object.entries(categories).flatMap(([category, words]) => {
    const categorySlug = contentSlug(category);
    return words.map((word) => {
      const wordSlug = contentSlug(word);
      const conceptId = `${categorySlug}.${wordSlug}`;
      const emojiCandidate = automaticEmojiForWord(word);
      return {
        id: conceptId,
        conceptId,
        category,
        word,
        audioId: `audio/es-419/${wordSlug}.mp3`,
        recommendedVisualKind: emojiCandidate ? "emoji" : "photo",
        emojiCandidate,
        photoId: emojiCandidate ? undefined : `photos/${categorySlug}/${wordSlug}.webp`,
        photoLicensePolicy: "public-domain-or-cc0",
        photoSourcePolicy: "verified-source-required",
      };
    });
  });
}
