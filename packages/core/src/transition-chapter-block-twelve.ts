import type { VisualLicense, WordCard } from "./index";

function card(id: string, word: string, category: string, visual: string, syllables: string[], readingDifficulty = 2, writingDifficulty = Math.min(6, readingDifficulty + 1)): WordCard {
  return { id, word, category, visual, visualKind: "emoji", visualLicense: "unicode-emoji", syllables, readingDifficulty, writingDifficulty, minAge: 4, regions: ["latam"], demoOnly: true };
}

function photoCard(id: string, word: string, category: string, sourceUrl: string, visualLicense: Extract<VisualLicense, "public-domain" | "cc0-1.0">, syllables: string[], readingDifficulty = 3, writingDifficulty = 4): WordCard {
  return { id, word, category, visual: sourceUrl, visualKind: "photo", visualLicense, visualSourceUrl: sourceUrl, syllables, readingDifficulty, writingDifficulty, minAge: 4, regions: ["latam"], demoOnly: true };
}

/** Final chapter-four block. Photos are referenced only after independent legal + visual approval. */
export const TRANSITION_BLOCK_TWELVE_CARDS: WordCard[] = [
  // Juguetes 4
  card("juguetes.corona", "CORONA", "Juguetes", "👑", ["CO","RO","NA"], 2, 3),
  card("juguetes.coche", "COCHE", "Juguetes", "🚗", ["CO","CHE"], 2, 3),
  card("juguetes.barco", "BARCO", "Juguetes", "🚢", ["BAR","CO"], 2, 3),
  card("juguetes.camion", "CAMIÓN", "Juguetes", "🚚", ["CA","MIÓN"], 2, 3),
  card("juguetes.grua", "GRÚA", "Juguetes", "🏗️", ["GRÚ","A"], 2, 3),
  card("juguetes.caja", "CAJA", "Juguetes", "📦", ["CA","JA"], 2, 3),
  card("juguetes.doctor", "DOCTOR", "Juguetes", "🧑‍⚕️", ["DOC","TOR"], 2, 3),
  card("juguetes.herramienta", "HERRAMIENTA", "Juguetes", "🛠️", ["HE","RRA","MIEN","TA"], 3, 4),
  card("juguetes.martillo", "MARTILLO", "Juguetes", "🔨", ["MAR","TI","LLO"], 2, 3),
  card("juguetes.casa", "CASA", "Juguetes", "🏠", ["CA","SA"], 2, 3),
  card("juguetes.tienda", "TIENDA", "Juguetes", "🏪", ["TIEN","DA"], 2, 3),
  card("juguetes.paracaidas", "PARACAÍDAS", "Juguetes", "🪂", ["PA","RA","CA","Í","DAS"], 3, 4),
  card("juguetes.crayon", "CRAYÓN", "Juguetes", "🖍️", ["CRA","YÓN"], 3, 3),
  card("juguetes.astronauta", "ASTRONAUTA", "Juguetes", "🧑‍🚀", ["AS","TRO","NAU","TA"], 3, 4),
  card("juguetes.rey", "REY", "Juguetes", "🤴", ["REY"], 2, 3),
  card("juguetes.reina", "REINA", "Juguetes", "👸", ["REI","NA"], 2, 3),

  // Océano 4 — explicitly approved local CC0/Public Domain photographs.
  photoCard("oceano.orca", "ORCA", "Océano", "https://commons.wikimedia.org/wiki/File%3AKillerwhales_jumping.jpg", "public-domain", ["OR","CA"], 3, 4),
  photoCard("oceano.narval", "NARVAL", "Océano", "https://commons.wikimedia.org/wiki/File%3AMonodon_monoceros_pod.jpg", "public-domain", ["NAR","VAL"], 3, 4),
  photoCard("oceano.beluga", "BELUGA", "Océano", "https://commons.wikimedia.org/wiki/File%3ADl-13_beluga.jpg", "public-domain", ["BE","LU","GA"], 3, 4),
  photoCard("oceano.manati", "MANATÍ", "Océano", "https://commons.wikimedia.org/wiki/File%3AClose_up_image_of_manatee_underwater.jpg", "public-domain", ["MA","NA","TÍ"], 3, 4),
  photoCard("oceano.cachalote", "CACHALOTE", "Océano", "https://commons.wikimedia.org/wiki/File%3ASperm_whale_Tim_Cole_NMFS_crop_(cropped).jpg", "public-domain", ["CA","CHA","LO","TE"], 3, 4),
  photoCard("oceano.morsa", "MORSA", "Océano", "https://commons.wikimedia.org/wiki/File%3AWalrus_-_Kamogawa_Seaworld_-_1.jpg", "public-domain", ["MOR","SA"], 3, 4),
  photoCard("oceano.manta", "MANTA", "Océano", "https://commons.wikimedia.org/wiki/File%3AManta_birostris-NOAA.jpg", "public-domain", ["MAN","TA"], 3, 4),
  photoCard("oceano.pezpayaso", "PEZPAYASO", "Océano", "https://commons.wikimedia.org/wiki/File%3ACommon_clownfish.jpg", "public-domain", ["PEZ","PA","YA","SO"], 3, 4),
  photoCard("oceano.barracuda", "BARRACUDA", "Océano", "https://commons.wikimedia.org/wiki/File%3ASphyraena_barracuda_by_NOAA.jpg", "public-domain", ["BA","RRA","CU","DA"], 3, 4),
  photoCard("oceano.morena", "MORENA", "Océano", "https://commons.wikimedia.org/wiki/File%3AGymnothorax_eurostus.jpg", "public-domain", ["MO","RE","NA"], 3, 4),
  photoCard("oceano.estrella", "ESTRELLA", "Océano", "https://commons.wikimedia.org/wiki/File%3AAsterias_rubens_307854603.jpg", "cc0-1.0", ["ES","TRE","LLA"], 3, 4),
  photoCard("oceano.erizodemar", "ERIZODEMAR", "Océano", "https://commons.wikimedia.org/wiki/File%3AUnidentified_sea_urchin_(16952838097).jpg", "cc0-1.0", ["E","RI","ZO","DE","MAR"], 3, 4),
  photoCard("oceano.pelicano", "PELICANO", "Océano", "https://commons.wikimedia.org/wiki/File%3AAmerican_White_Pelican_(5577371941).jpg", "public-domain", ["PE","LI","CA","NO"], 3, 4),
  photoCard("oceano.albatros", "ALBATROS", "Océano", "https://commons.wikimedia.org/wiki/File%3AShort_tailed_albatross.jpg", "public-domain", ["AL","BA","TROS"], 3, 4),
  photoCard("oceano.gaviota", "GAVIOTA", "Océano", "https://commons.wikimedia.org/wiki/File%3ALarus_hyperboreus-USFWS.jpg", "public-domain", ["GA","VIO","TA"], 3, 4),
  photoCard("oceano.frailecillo", "FRAILECILLO", "Océano", "https://commons.wikimedia.org/wiki/File%3AFratercula_corniculataUSFWSSL0002774.jpg", "public-domain", ["FRAI","LE","CI","LLO"], 3, 4),

  // Espacio 4 — fifteen reviewed NASA/Commons photographs + one direct lunar-phase emoji.
  photoCard("espacio.mercurio", "MERCURIO", "Espacio", "https://commons.wikimedia.org/wiki/File%3AMercury_in_true_color.jpg", "public-domain", ["MER","CU","RIO"], 3, 4),
  photoCard("espacio.venus", "VENUS", "Espacio", "https://commons.wikimedia.org/wiki/File%3AVenus_globe.jpg", "public-domain", ["VE","NUS"], 3, 4),
  photoCard("espacio.marte", "MARTE", "Espacio", "https://commons.wikimedia.org/wiki/File%3AMars_Valles_Marineris.jpeg", "public-domain", ["MAR","TE"], 3, 4),
  photoCard("espacio.jupiter", "JÚPITER", "Espacio", "https://commons.wikimedia.org/wiki/File%3APortrait_of_Jupiter_from_Cassini.jpg", "public-domain", ["JÚ","PI","TER"], 3, 4),
  photoCard("espacio.saturno", "SATURNO", "Espacio", "https://commons.wikimedia.org/wiki/File%3ASaturn_during_Equinox.jpg", "public-domain", ["SA","TUR","NO"], 3, 4),
  photoCard("espacio.urano", "URANO", "Espacio", "https://commons.wikimedia.org/wiki/File%3AUranus_Final_Image.jpg", "public-domain", ["U","RA","NO"], 3, 4),
  photoCard("espacio.neptuno", "NEPTUNO", "Espacio", "https://commons.wikimedia.org/wiki/File%3ANeptune_Full.jpg", "public-domain", ["NEP","TU","NO"], 3, 4),
  photoCard("espacio.pluton", "PLUTÓN", "Espacio", "https://commons.wikimedia.org/wiki/File%3APluto_in_True_Color_-_High-Res.jpg", "public-domain", ["PLU","TÓN"], 3, 4),
  photoCard("espacio.ceres", "CERES", "Espacio", "https://commons.wikimedia.org/wiki/File%3ADawn_-_Ceres.png", "public-domain", ["CE","RES"], 3, 4),
  photoCard("espacio.andromeda", "ANDRÓMEDA", "Espacio", "https://commons.wikimedia.org/wiki/File%3AAndromeda_galaxy.jpg", "public-domain", ["AN","DRÓ","ME","DA"], 3, 4),
  photoCard("espacio.nebulosa", "NEBULOSA", "Espacio", "https://commons.wikimedia.org/wiki/File%3AOrion_Nebula_-_Hubble_2006_mosaic.jpg", "public-domain", ["NE","BU","LO","SA"], 3, 4),
  photoCard("espacio.rover", "ROVER", "Espacio", "https://commons.wikimedia.org/wiki/File%3AMars_'Curiosity'_Rover%2C_Spacecraft_Assembly_Facility%2C_Pasadena%2C_California_(2011).jpg", "public-domain", ["RO","VER"], 3, 4),
  photoCard("espacio.estacion", "ESTACIÓN", "Espacio", "https://commons.wikimedia.org/wiki/File%3AInternational_Space_Station_after_undocking_of_STS-132.jpg", "public-domain", ["ES","TA","CIÓN"], 3, 4),
  photoCard("espacio.transbordador", "TRANSBORDADOR", "Espacio", "https://commons.wikimedia.org/wiki/File%3ASTS_114_day_before_launch.jpg", "public-domain", ["TRANS","BOR","DA","DOR"], 4, 4),
  photoCard("espacio.aurora", "AURORA", "Espacio", "https://commons.wikimedia.org/wiki/File%3AAurora_Borealis.jpg", "public-domain", ["AU","RO","RA"], 3, 4),
  card("espacio.llena", "LLENA", "Espacio", "🌕", ["LLE", "NA"], 2, 3),

  // Granja 4
  card("granja.perro", "PERRO", "Granja", "🐕", ["PE","RRO"], 2, 3),
  card("granja.gato", "GATO", "Granja", "🐈", ["GA","TO"], 2, 3),
  card("granja.raton", "RATÓN", "Granja", "🐁", ["RA","TÓN"], 2, 3),
  card("granja.lechuza", "LECHUZA", "Granja", "🦉", ["LE","CHU","ZA"], 2, 3),
  card("granja.rana", "RANA", "Granja", "🐸", ["RA","NA"], 2, 3),
  card("granja.frijol", "FRIJOL", "Granja", "🫘", ["FRI","JOL"], 2, 3),
  card("granja.batata", "BATATA", "Granja", "🍠", ["BA","TA","TA"], 2, 3),
  card("granja.mango", "MANGO", "Granja", "🥭", ["MAN","GO"], 2, 3),
  card("granja.banana", "BANANA", "Granja", "🍌", ["BA","NA","NA"], 2, 3),
  card("granja.pinya", "PIÑA", "Granja", "🍍", ["PI","ÑA"], 2, 3),
  card("granja.coco", "COCO", "Granja", "🥥", ["CO","CO"], 2, 3),
  card("granja.aguacate", "AGUACATE", "Granja", "🥑", ["A","GUA","CA","TE"], 3, 3),
  card("granja.pera", "PERA", "Granja", "🍐", ["PE","RA"], 2, 3),
  card("granja.martillo", "MARTILLO", "Granja", "🔨", ["MAR","TI","LLO"], 2, 3),
  card("granja.serrucho", "SERRUCHO", "Granja", "🪚", ["SE","RRU","CHO"], 3, 3),
  card("granja.balde", "BALDE", "Granja", "🪣", ["BAL","DE"], 2, 3),
];
