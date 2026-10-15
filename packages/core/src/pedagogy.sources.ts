export interface PedagogySource {
  id: string;
  title: string;
  url: string;
  supports: string[];
  notes: string;
}

/**
 * Fuentes base del pipeline léxico. No convierten por sí solas una palabra en
 * 'nivel X'; cada entrada del banco debe registrar qué evidencia fue usada.
 */
export const PEDAGOGY_SOURCES: PedagogySource[] = [
  {
    id: "pineiro-manzano-2000",
    title: "A lexical database for Spanish-speaking children",
    url: "https://pubmed.ncbi.nlm.nih.gov/11189861/",
    supports: ["child-frequency", "age-of-acquisition", "semantics", "grammar"],
    notes: "Base sobre vocabulario oral de 200 niños hispanohablantes de 11.16 a 49.16 meses; 1,259 tipos léxicos.",
  },
  {
    id: "alonso-fernandez-diez-2015",
    title: "Subjective age-of-acquisition norms for 7,039 Spanish words",
    url: "https://pubmed.ncbi.nlm.nih.gov/24578152/",
    supports: ["age-of-acquisition"],
    notes: "Normas amplias de edad subjetiva de adquisición para 7,039 palabras españolas.",
  },
  {
    id: "spanish-syllable-development-2026",
    title: "Development of word and syllable structure in Chilean children",
    url: "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2026.1740877/full",
    supports: ["syllable-structure", "phonological-complexity"],
    notes: "Describe predominio de CV y progresión hacia codas, diptongos y ataques complejos CCV/CCVC.",
  },
  {
    id: "orthographic-complexity-spanish-2019",
    title: "Linguistic Factors and the Spelling Ability of Spanish Heritage Language Learners",
    url: "https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2019.00150/full",
    supports: ["orthographic-regularity", "reading-writing-difference"],
    notes: "Resume correspondencias contextuales c/g/r y ambigüedades de escritura b-v, j-g, c-qu, además de h muda.",
  },
  {
    id: "clusters-literacy-2018",
    title: "Cracking the Code: Orthographic Transparency and Morphological-Syllabic Complexity",
    url: "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2018.02534/full",
    supports: ["consonant-clusters", "literacy-complexity"],
    notes: "Apoya tratar grupos consonánticos como una fuente relevante de dificultad en alfabetización española.",
  },
];
