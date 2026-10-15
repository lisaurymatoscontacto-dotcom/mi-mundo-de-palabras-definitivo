export interface LearningWorld {
  id: string;
  category: string;
  name: string;
  icon: string;
  order: number;
  description: string;
}

/** Stable thematic navigation. Pedagogical difficulty is still determined by words/levels, not by world. */
export const LEARNING_WORLDS: readonly LearningWorld[] = [
  { id: "animals", category: "Animales", name: "Mundo Animal", icon: "🐾", order: 1, description: "Animales conocidos y nuevas especies." },
  { id: "home", category: "Casa", name: "Mi Casa", icon: "🏠", order: 2, description: "Objetos y espacios del hogar." },
  { id: "food", category: "Comida", name: "Sabores", icon: "🍎", order: 3, description: "Alimentos cotidianos y saludables." },
  { id: "nature", category: "Naturaleza", name: "Naturaleza", icon: "🌿", order: 4, description: "Paisajes, clima y elementos naturales." },
  { id: "body", category: "Cuerpo", name: "Mi Cuerpo", icon: "💪", order: 5, description: "Partes del cuerpo y vocabulario cercano." },
  { id: "clothes", category: "Ropa", name: "Ropa", icon: "👕", order: 6, description: "Prendas y accesorios de uso diario." },
  { id: "transport", category: "Transporte", name: "En Movimiento", icon: "🚗", order: 7, description: "Vehículos y formas de viajar." },
  { id: "school", category: "Escuela", name: "Escuela", icon: "🎒", order: 8, description: "Palabras del aula y del aprendizaje." },
  { id: "toys", category: "Juguetes", name: "Juguetes", icon: "🧸", order: 9, description: "Objetos para jugar, crear e imaginar." },
  { id: "ocean", category: "Océano", name: "Océano", icon: "🌊", order: 10, description: "Vida marina y elementos del mar." },
  { id: "space", category: "Espacio", name: "Espacio", icon: "🚀", order: 11, description: "Planetas, astronomía y exploración espacial." },
  { id: "farm", category: "Granja", name: "Granja", icon: "🚜", order: 12, description: "Vida rural, cultivos y herramientas." },
];

export function worldForCategory(category: string) {
  return LEARNING_WORLDS.find((world) => world.category === category);
}
