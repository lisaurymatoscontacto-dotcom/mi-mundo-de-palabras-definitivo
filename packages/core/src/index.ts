import type { VisualKind, VisualLicense } from "./media";
import { TRANSITION_CHAPTER_ONE_CARDS } from "./transition-chapter-one";
import { TRANSITION_BLOCK_TWO_CARDS } from "./transition-chapter-block-two";
import { TRANSITION_BLOCK_THREE_CARDS } from "./transition-chapter-block-three";
import { TRANSITION_BLOCK_FOUR_CARDS } from "./transition-chapter-block-four";
import { TRANSITION_BLOCK_FIVE_CARDS } from "./transition-chapter-block-five";
export type { VisualKind, VisualLicense } from "./media";

export type LearningMode = "reading" | "writing" | "mixed";
export type MasteryState = "new" | "practicing" | "learned" | "mastered";
export type Region = "latam" | "mx" | "caribbean" | "andine" | "southern-cone";

export interface WordCard {
  id: string;
  word: string;
  category: string;
  /** Unicode emoji, a vetted public-domain/CC0 photo URL, or a legacy owned image. */
  visual: string;
  visualKind?: VisualKind;
  visualLicense?: VisualLicense;
  /** Provenance is retained for every photo even when attribution is not legally required. */
  visualSourceUrl?: string;
  visualAttribution?: string;
  /** Approved pronunciation asset. Browser speech remains a fallback. */
  audioUrl?: string;
  syllables: string[];
  readingDifficulty: number;
  writingDifficulty: number;
  minAge: number;
  regions: Region[];
  golden?: boolean;
  demoOnly?: boolean;
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  region: Region;
}

export interface WordProgress {
  wordId: string;
  correctReads: number;
  incorrectReads: number;
  lastSeenAt?: string;
  mastery: MasteryState;
}

export interface SessionOptions {
  age: number;
  mode: LearningMode;
  region: Region;
  category?: string;
  progress?: Record<string, WordProgress>;
  size?: number;
  level?: number;
}

export interface LearningStage {
  id: number;
  name: string;
  skill: string;
  difficultyCeiling: number;
}

export interface LevelDefinition {
  level: number;
  stage: number;
  stageLevel: number;
  name: string;
  skill: string;
  difficultyCeiling: number;
}

export const LEARNING_STAGES: LearningStage[] = [
  { id: 1, name: "Primeras palabras", skill: "Palabras familiares con sílabas simples", difficultyCeiling: 1 },
  { id: 2, name: "Palabras conocidas", skill: "Más longitud manteniendo estructuras sencillas", difficultyCeiling: 2 },
  { id: 3, name: "Nuevos sonidos", skill: "Cierres consonánticos y combinaciones frecuentes", difficultyCeiling: 2 },
  { id: 4, name: "Mezclas", skill: "Estructuras silábicas variadas", difficultyCeiling: 3 },
  { id: 5, name: "Vocales juntas", skill: "Diptongos y secuencias vocálicas", difficultyCeiling: 3 },
  { id: 6, name: "Grupos consonánticos", skill: "PL, BR, TR, CR, FL y combinaciones similares", difficultyCeiling: 4 },
  { id: 7, name: "Reglas especiales", skill: "QU, GU, RR, H y reglas contextuales", difficultyCeiling: 5 },
  { id: 8, name: "Gran lector", skill: "Palabras largas y consolidación", difficultyCeiling: 6 },
];

export const LEVELS: LevelDefinition[] = LEARNING_STAGES.flatMap((stage) =>
  Array.from({ length: 6 }, (_, index) => ({
    level: (stage.id - 1) * 6 + index + 1,
    stage: stage.id,
    stageLevel: index + 1,
    name: `${stage.name} ${index + 1}`,
    skill: stage.skill,
    difficultyCeiling: stage.difficultyCeiling,
  })),
);

export function getLevel(level: number): LevelDefinition {
  const safe = Math.max(1, Math.min(LEVELS.length, Math.floor(level || 1)));
  return LEVELS[safe - 1];
}

const DEMO_PHOTO_MEDIA: Record<string, Pick<WordCard, "visual" | "visualKind" | "visualLicense" | "visualSourceUrl" | "visualAttribution">> = {
  mesa: {
    visual: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Iroco_wood_table.jpg?width=900",
    visualKind: "photo",
    visualLicense: "cc0-1.0",
    visualSourceUrl: "https://commons.wikimedia.org/wiki/File:Iroco_wood_table.jpg",
    visualAttribution: "İmmortalance · Wikimedia Commons",
  },
  rio: {
    visual: "https://commons.wikimedia.org/wiki/Special:Redirect/file/River_scene.jpg?width=900",
    visualKind: "photo",
    visualLicense: "public-domain",
    visualSourceUrl: "https://commons.wikimedia.org/wiki/File:River_scene.jpg",
    visualAttribution: "U.S. Fish and Wildlife Service · Wikimedia Commons",
  },
  puerta: {
    visual: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Door1.jpg?width=900",
    visualKind: "photo",
    visualLicense: "public-domain",
    visualSourceUrl: "https://commons.wikimedia.org/wiki/File:Door1.jpg",
    visualAttribution: "Bachrach44 · Wikimedia Commons",
  },
};

const pilot = (
  id: string,
  word: string,
  category: string,
  visual: string,
  syllables: string[],
  readingDifficulty: number,
  writingDifficulty = readingDifficulty,
  minAge = 4,
  golden = false,
): WordCard => {
  const photo = DEMO_PHOTO_MEDIA[id];
  return {
    id,
    word,
    category,
    visual: photo?.visual ?? visual,
    visualKind: photo?.visualKind ?? "emoji",
    visualLicense: photo?.visualLicense ?? "unicode-emoji",
    visualSourceUrl: photo?.visualSourceUrl,
    visualAttribution: photo?.visualAttribution,
    syllables,
    readingDifficulty,
    writingDifficulty,
    minAge,
    regions: ["latam"],
    golden,
    demoOnly: true,
  };
};

/**
 * Banco de transición mientras el lexicón grande recibe revisión editorial.
 * Los doce capítulos introductorios se materializan por bloques controlados; los
 * capítulos posteriores solo aparecen cuando sus visuales y metadatos pasan revisión.
 */
export const DEMO_WORDS: WordCard[] = [
  pilot("gato", "GATO", "Animales", "🐱", ["GA", "TO"], 1),
  pilot("pato", "PATO", "Animales", "🦆", ["PA", "TO"], 1),
  pilot("vaca", "VACA", "Animales", "🐄", ["VA", "CA"], 1, 2),
  pilot("lobo", "LOBO", "Animales", "🐺", ["LO", "BO"], 1, 2),
  pilot("rana", "RANA", "Animales", "🐸", ["RA", "NA"], 1),
  pilot("mono", "MONO", "Animales", "🐵", ["MO", "NO"], 1, 1, 4, true),
  pilot("perro", "PERRO", "Animales", "🐶", ["PE", "RRO"], 1, 2),
  pilot("pez", "PEZ", "Animales", "🐟", ["PEZ"], 1),
  pilot("oso", "OSO", "Animales", "🐻", ["O", "SO"], 1),
  pilot("leon", "LEÓN", "Animales", "🦁", ["LE", "ÓN"], 1, 2),
  pilot("tigre", "TIGRE", "Animales", "🐯", ["TI", "GRE"], 1, 2),
  pilot("conejo", "CONEJO", "Animales", "🐰", ["CO", "NE", "JO"], 1, 1),
  pilot("caballo", "CABALLO", "Animales", "🐴", ["CA", "BA", "LLO"], 1, 2),
  pilot("cerdo", "CERDO", "Animales", "🐷", ["CER", "DO"], 1, 2),
  pilot("oveja", "OVEJA", "Animales", "🐑", ["O", "VE", "JA"], 1, 1),
  pilot("cabra", "CABRA", "Animales", "🐐", ["CA", "BRA"], 1, 2),
  pilot("raton", "RATÓN", "Animales", "🐭", ["RA", "TÓN"], 1, 2),
  pilot("zorro", "ZORRO", "Animales", "🦊", ["ZO", "RRO"], 1, 2),
  pilot("abeja", "ABEJA", "Animales", "🐝", ["A", "BE", "JA"], 1),
  pilot("arana", "ARAÑA", "Animales", "🕷️", ["A", "RA", "ÑA"], 1, 2),
  pilot("luna", "LUNA", "Naturaleza", "🌙", ["LU", "NA"], 1, 1, 4, true),
  pilot("nube", "NUBE", "Naturaleza", "☁️", ["NU", "BE"], 1, 2),
  pilot("sol", "SOL", "Naturaleza", "☀️", ["SOL"], 2),
  pilot("mar", "MAR", "Naturaleza", "🌊", ["MAR"], 2),
  pilot("flor", "FLOR", "Naturaleza", "🌼", ["FLOR"], 3),
  pilot("rio", "RÍO", "Naturaleza", "🏞️", ["RÍ", "O"], 2, 3),
  pilot("casa", "CASA", "Casa", "🏠", ["CA", "SA"], 1),
  pilot("mesa", "MESA", "Casa", "🪑", ["ME", "SA"], 1),
  pilot("cama", "CAMA", "Casa", "🛏️", ["CA", "MA"], 1),
  pilot("vaso", "VASO", "Casa", "🥛", ["VA", "SO"], 1, 2),
  pilot("plato", "PLATO", "Casa", "🍽️", ["PLA", "TO"], 3),
  pilot("puerta", "PUERTA", "Casa", "🚪", ["PUER", "TA"], 3),
  pilot("pan", "PAN", "Comida", "🍞", ["PAN"], 2),
  pilot("sopa", "SOPA", "Comida", "🍲", ["SO", "PA"], 1),
  pilot("pera", "PERA", "Comida", "🍐", ["PE", "RA"], 1),
  pilot("uva", "UVA", "Comida", "🍇", ["U", "VA"], 2),
  pilot("tomate", "TOMATE", "Comida", "🍅", ["TO", "MA", "TE"], 2),
  pilot("queso", "QUESO", "Comida", "🧀", ["QUE", "SO"], 3, 4, 5, true),
  ...TRANSITION_CHAPTER_ONE_CARDS,
  ...TRANSITION_BLOCK_TWO_CARDS,
  ...TRANSITION_BLOCK_THREE_CARDS,
  ...TRANSITION_BLOCK_FOUR_CARDS,
  ...TRANSITION_BLOCK_FIVE_CARDS,
];

export const DEMO_CATEGORIES = [...new Set(DEMO_WORDS.map((word) => word.category))];

/** Final curriculum sessions use twenty distinct concepts whenever available. */
export function suggestedSessionSize(_age: number): number {
  return 20;
}

export function recommendedDifficulty(age: number): number {
  if (age <= 5) return 2;
  if (age <= 7) return 3;
  if (age <= 9) return 5;
  return 6;
}

function difficultyFor(card: WordCard, mode: LearningMode) {
  if (mode === "writing") return card.writingDifficulty;
  if (mode === "reading") return card.readingDifficulty;
  return Math.max(card.readingDifficulty, card.writingDifficulty);
}

export function buildSession(words: WordCard[], options: SessionOptions): WordCard[] {
  const size = options.size ?? suggestedSessionSize(options.age);
  const progress = options.progress ?? {};
  const levelCeiling = options.level ? getLevel(options.level).difficultyCeiling : Infinity;
  const ceiling = Math.min(recommendedDifficulty(options.age), levelCeiling);

  const eligible = words.filter((card) => {
    const regional = card.regions.includes("latam") || card.regions.includes(options.region);
    const category = !options.category || card.category === options.category;
    return regional && category && card.minAge <= options.age && difficultyFor(card, options.mode) <= ceiling;
  });

  const score = (card: WordCard) => {
    const state = progress[card.id];
    if (!state) return 40;
    if (state.mastery === "practicing") return 100 + state.incorrectReads * 10;
    if (state.mastery === "learned") return 70;
    if (state.mastery === "mastered") return 15;
    return 50;
  };

  const ranked = [...eligible]
    .sort((a, b) => score(b) - score(a) || difficultyFor(a, options.mode) - difficultyFor(b, options.mode) || a.word.localeCompare(b.word, "es"));

  // Never manufacture repetitions just to hit the requested size. If a chapter
  // has fewer approved concepts, it remains shorter until more content is ready.
  return ranked.slice(0, size);
}

export function nextMastery(progress: WordProgress, wasCorrect: boolean): WordProgress {
  const correctReads = progress.correctReads + (wasCorrect ? 1 : 0);
  const incorrectReads = progress.incorrectReads + (wasCorrect ? 0 : 1);
  let mastery: MasteryState = "practicing";
  if (correctReads >= 3) mastery = "mastered";
  else if (correctReads >= 2) mastery = "learned";
  return { ...progress, correctReads, incorrectReads, mastery, lastSeenAt: new Date().toISOString() };
}
