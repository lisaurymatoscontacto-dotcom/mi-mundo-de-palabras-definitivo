export type CurriculumPriorityMap = Record<string, readonly (readonly string[])[]>;

/**
 * Editorial ordering for the beginning of each thematic world.
 * Index 0 is chapter 1 (20 new concepts); subsequent early chapters use
 * sixteen new concepts and reserve four positions for adaptive review.
 * Candidate words not listed here retain their original bank order afterward.
 */
export const CURRICULUM_PRIORITY_WORDS: CurriculumPriorityMap = {
  Animales: [
    [
      "GATO", "PATO", "VACA", "LOBO", "RANA", "MONO", "PERRO", "PEZ", "OSO", "LEÓN",
      "TIGRE", "CONEJO", "CABALLO", "CERDO", "OVEJA", "CABRA", "RATÓN", "ZORRO", "ABEJA", "ARAÑA",
    ],
    [
      "ÁGUILA", "JIRAFA", "CEBRA", "GORILA", "KOALA", "BALLENA", "DELFÍN", "TORTUGA",
      "COCODRILO", "MARIPOSA", "ELEFANTE", "MURCIÉLAGO", "HIPOPÓTAMO", "RINOCERONTE", "PINGÜINO", "BÚHO",
    ],
    [
      "ARDILLA", "CASTOR", "NUTRIA", "MAPACHE", "ERIZO", "LEOPARDO", "BISONTE", "BÚFALO",
      "CAMELLO", "DROMEDARIO", "LLAMA", "CANGURO", "PEREZOSO", "HAMSTER", "CISNE", "PAVO",
    ],
    [
      "GALLO", "GALLINA", "POLLO", "GANSO", "FLAMENCO", "LORO", "PALOMA", "SERPIENTE",
      "TIBURÓN", "PULPO", "CALAMAR", "MEDUSA", "CANGREJO", "LANGOSTA", "CAMARÓN", "CARACOL",
    ],
  ],
  Casa: [
    [
      "CASA", "MESA", "CAMA", "VASO", "PLATO", "PUERTA", "SILLA", "TAZA", "SOFÁ", "ESPEJO",
      "CUCHARA", "TENEDOR", "CUCHILLO", "TELEVISOR", "RELOJ", "LLAVE", "DUCHA", "CESTA", "CAJA", "BOMBILLA",
    ],
    [
      "VENTANA", "ESCOBA", "CUBETA", "ESCALERA", "INODORO", "BAÑERA", "JABÓN", "TETERA",
      "ENCHUFE", "ANTENA", "IMPRESORA", "TECLADO", "MONITOR", "MARTILLO", "LINTERNA", "EXTINTOR",
    ],
    [
      "ESPONJA", "CUENCO", "BATERÍA", "ALTAVOZ", "LADRILLO", "DESTORNILLADOR", "TIJERA", "BOLSA",
      "MALETA", "PAPELERA", "VELA", "ABANICO", "JARRÓN", "MACETA", "CALENDARIO", "ALARMA",
    ],
    [
      "FRASCO", "PEINE", "AFEITADORA", "GRIFO", "BALANZA", "GUANTE", "TIMBRE", "COMPUTADORA",
      "RATÓN", "TORNILLO", "SERRUCHO", "GANCHO", "CLIP", "AGUJA", "HILO", "PORTARRETRATO",
    ],
  ],
  Comida: [
    [
      "PAN", "SOPA", "PERA", "UVA", "TOMATE", "QUESO", "ARROZ", "MIEL", "HUEVO", "LECHE",
      "PAPA", "MAÍZ", "MANGO", "MELÓN", "LIMÓN", "FRESA", "PIÑA", "COCO", "BANANA", "MANZANA",
    ],
    [
      "NARANJA", "GALLETA", "HELADO", "ZANAHORIA", "AGUACATE", "SANDÍA", "CHOCOLATE", "FRIJOL",
      "PLÁTANO", "CEREZA", "KIWI", "LECHUGA", "PEPINO", "BERENJENA", "BRÓCOLI", "PIZZA",
    ],
    [
      "SAL", "ENSALADA", "PASTA", "DURAZNO", "ARÁNDANO", "CALABAZA", "PIMIENTO", "CEBOLLA",
      "AJO", "GUISANTE", "TOCINO", "HAMBURGUESA", "MANTEQUILLA", "SUSHI", "TACO", "SÁNDWICH",
    ],
    [
      "POLLO", "CARNE", "CAMARÓN", "CANGREJO", "LANGOSTA", "PULPO", "CALAMAR", "PAELLA",
      "BURRITO", "CAFÉ", "TÉ", "AGUA", "JUGO", "DONA", "FLAN", "MANÍ",
    ],
    [
      "YUCA", "CEREAL", "YOGUR", "LENTEJA", "MANDARINA", "TORONJA", "LIMA", "GUAYABA",
      "PAPAYA", "MARACUYÁ", "GRANADA", "CIRUELA", "NECTARINA", "ALBARICOQUE", "FRAMBUESA", "MORA",
    ],
  ],
  Naturaleza: [
    [
      "LUNA", "NUBE", "SOL", "MAR", "FLOR", "RÍO", "HOJA", "ROCA", "PLAYA", "LLUVIA",
      "NIEVE", "FUEGO", "ÁRBOL", "ISLA", "ESTRELLA", "VOLCÁN", "DESIERTO", "MONTAÑA", "ARCOÍRIS", "TORMENTA",
    ],
    [
      "PINO", "VIENTO", "RELÁMPAGO", "AGUA", "HIELO", "NIEBLA", "TORNADO", "AMANECER",
      "PALMERA", "BAMBÚ", "ROSA", "TULIPÁN", "GIRASOL", "LOTO", "CACTUS", "HONGO",
    ],
    [
      "FRÍO", "HURACÁN", "ATARDECER", "TEMPERATURA", "TRÉBOL", "COMETA", "NORTE", "SUR",
      "ESTE", "OESTE", "PRIMAVERA", "OTOÑO", "INVIERNO", "PAISAJE", "FAUNA", "HORIZONTE",
    ],
    [
      "ARCE", "BROTE", "TRONCO", "HIERBA", "TERMAS", "METEORO", "OLEAJE", "PLANETA",
      "SATÉLITE", "GALAXIA", "BRISA", "CALOR", "ARRECIFE", "CORDILLERA", "LUZ", "CONTINENTE",
    ],
  ],
  Cuerpo: [
    [
      "PIE", "MANO", "OJO", "BOCA", "NARIZ", "CARA", "DEDO", "BRAZO", "DIENTE", "LENGUA",
      "PIERNA", "OREJA", "CORAZÓN", "CEREBRO", "HUESO", "SANGRE", "PULMÓN", "SONRISA", "RISA", "SUEÑO",
    ],
    [
      "PULGAR", "PUÑO", "PALMADA", "ABRAZO", "BESO", "CAMINAR", "CORRER", "NADAR",
      "DORMIR", "BEBÉ", "NIÑO", "NIÑA", "HOMBRE", "MUJER", "TERMÓMETRO", "JERINGA",
    ],
    [
      "CURITA", "MEDICINA", "LLANTO", "BOSTEZO", "ESTORNUDO", "FIEBRE", "MAREO", "NÁUSEA",
      "FUERZA", "HABLAR", "CANTAR", "BEBER", "MIRAR", "ADN", "ANCIANO", "ANCIANA",
    ],
    [
      "LABIO", "CRÁNEO", "LATIDO", "SUSPIRO", "CANSANCIO", "DESCANSO", "HERIDA", "DOLOR",
      "MASCARILLA", "MÉDICO", "MÉDICA", "PEINE", "JABÓN", "ESPONJA", "ADULTO", "LÁGRIMA",
    ],
  ],
  Ropa: [
    [
      "BOTA", "GORRA", "CAMISETA", "PANTALÓN", "ZAPATO", "ABRIGO", "GUANTE", "BUFANDA", "VESTIDO", "SANDALIA",
      "CORBATA", "CALCETÍN", "SOMBRERO", "GAFAS", "GAFAS DE SOL", "BOLSO", "MONEDERO", "MOCHILA", "ANILLO", "BIKINI",
    ],
    [
      "BLUSA", "CHAQUETA", "SHORT", "ZAPATILLA", "KIMONO", "CORONA", "CASCO", "RELOJ",
      "LANA", "HILO", "AGUJA", "TIJERA", "LAZO", "TACÓN", "BAÑADOR", "DISFRAZ",
    ],
    [
      "ROJO", "AZUL", "VERDE", "AMARILLO", "NEGRO", "BLANCO", "GRIS", "MARRÓN",
      "ROSA", "MORADO", "NARANJA", "CARTERA", "COLLAR", "MÁSCARA", "TRAJE", "CHALECO",
    ],
    [
      "CHANCLA", "BOTÍN", "MALETÍN", "ALFILER", "MONÓCULO", "CADENA", "BATA", "TURBANTE",
      "LAVADO", "PLAYA", "FIESTA", "DEPORTE", "ESCUELA", "LLUVIA", "NIEVE", "OTOÑO",
    ],
  ],
  Transporte: [
    [
      "AUTO", "MOTO", "BUS", "TREN", "BARCO", "BOTE", "TAXI", "METRO", "AVIÓN", "CAMIÓN",
      "CANOA", "BICICLETA", "PATINETA", "TRACTOR", "COHETE", "HELICÓPTERO", "AMBULANCIA", "TRANVÍA", "VELERO", "FERRY",
    ],
    [
      "CAMIONETA", "TELEFÉRICO", "PARACAÍDAS", "TROLEBÚS", "SCOOTER", "LOCOMOTORA", "AVIONETA", "CRUCERO",
      "YATE", "ASCENSOR", "RUEDA", "GASOLINERA", "CARRETERA", "SEMÁFORO", "EQUIPAJE", "PATINETE",
    ],
    [
      "FURGONETA", "GRÚA", "MONORRIEL", "KART", "VAGÓN", "ESTACIÓN", "PUENTE", "MOTOR",
      "NEUMÁTICO", "ASIENTO", "GASOLINA", "APARCAMIENTO", "BILLETE", "PAQUETE", "TRÁILER", "TRINEO",
    ],
    [
      "ESPEJO", "PUERTA", "VENTANILLA", "ELECTRICIDAD", "CHALECO", "AUTOPISTA", "SEÑAL", "PARADA",
      "TARJETA", "CICLISTA", "PEATÓN", "DERECHA", "IZQUIERDA", "RADAR", "EXTINTOR", "HERRAMIENTA",
    ],
  ],
  Escuela: [
    [
      "LIBRO", "LÁPIZ", "REGLA", "MAPA", "PAPEL", "CUADERNO", "MOCHILA", "TIJERA", "CRAYÓN", "COMPUTADORA",
      "CALCULADORA", "PINCEL", "BOLÍGRAFO", "CARPETA", "CLIP", "ESCUELA", "MAESTRA", "MAESTRO", "TECLADO", "IMPRESORA",
    ],
    [
      "BIBLIOTECA", "ACUARELA", "ÁBACO", "LABORATORIO", "ALUMNO", "TAREA", "PREGUNTA", "SUMA",
      "RESTA", "MULTIPLICACIÓN", "DIVISIÓN", "BIOLOGÍA", "MICROSCOPIO", "PROYECTOR", "AURICULAR", "TROFEO",
    ],
    [
      "LETRA", "NÚMERO", "PLUMA", "SILLA", "ESTUDIANTE", "EXAMEN", "TRIÁNGULO", "CUADRADO",
      "CÍRCULO", "ROMBO", "MÚSICA", "ARTE", "DEPORTE", "ROBÓTICA", "PLANETA", "BANDERA",
    ],
    [
      "RECREO", "BAÑO", "ÁNGULO", "GEOGRAFÍA", "FÍSICA", "QUÍMICA", "CIUDAD", "EXPERIMENTO",
      "TELESCOPIO", "CÁMARA", "INTERNET", "ESCRIBIR", "PENSAR", "SILENCIO", "PARTICIPACIÓN", "CREDENCIAL",
    ],
  ],
  Juguetes: [
    [
      "DADO", "YO-YO", "PELOTA", "COMETA", "ROBOT", "TAMBOR", "PELUCHE", "VIDEOJUEGO", "BURBUJA", "ROMPECABEZAS",
      "GLOBO", "FRISBI", "MARACA", "PIANO", "GUITARRA", "MICRÓFONO", "DINOSAURIO", "UNICORNIO", "COHETE", "AVIÓN",
    ],
    [
      "AJEDREZ", "BOLOS", "DIANA", "BUMERÁN", "PATINETE", "FLAUTA", "PATINES", "BICICLETA",
      "PINTURA", "PINCEL", "LUPA", "BRÚJULA", "DRAGÓN", "HADA", "PRINCESA", "BIBERÓN",
    ],
    [
      "ARO", "BLOQUE", "CASTILLO", "ESPADA", "ESCUDO", "VARITA", "PIRATA", "CABALLITO",
      "TREN", "HELICÓPTERO", "TRACTOR", "AMBULANCIA", "CARPA", "TOBOGÁN", "IMÁN", "TELESCOPIO",
    ],
    [
      "CORONA", "COCHE", "BARCO", "CAMIÓN", "GRÚA", "CAJA", "DOCTOR", "HERRAMIENTA",
      "MARTILLO", "CASA", "TIENDA", "PARACAÍDAS", "CRAYÓN", "ASTRONAUTA", "REY", "REINA",
    ],
  ],
  "Océano": [
    [
      "OLA", "CORAL", "FOCA", "PULPO", "TIBURÓN", "MEDUSA", "CANGREJO", "CONCHA", "LANGOSTA", "CALAMAR",
      "ANCLA", "OSTRA", "BALLENA", "DELFÍN", "TORTUGA", "PINGÜINO", "CAMARÓN", "BARCO", "BOTE", "VELERO",
    ],
    [
      "PLAYA", "ISLA", "KAYAK", "YATE", "CRUCERO", "BRÚJULA", "BUZO", "NADADOR",
      "SURFISTA", "PESCADOR", "SALVAVIDAS", "TESORO", "MAPA", "RECICLAJE", "SIRENA", "HURACÁN",
    ],
    [
      "CARACOL", "ROCA", "SAL", "AGUA", "FERRY", "CANOA", "LANCHA", "RADAR",
      "BRISA", "RESIDUO", "ANZUELO", "CAÑA", "VOLCÁN", "MUSEO", "LARVA", "TORMENTA",
    ],
    [
      "ORCA", "NARVAL", "BELUGA", "MANATÍ", "CACHALOTE", "MORSA", "MANTA", "PEZPAYASO",
      "BARRACUDA", "MORENA", "ESTRELLA", "ERIZODEMAR", "PELICANO", "ALBATROS", "GAVIOTA", "FRAILECILLO",
    ],
  ],
  Espacio: [
    [
      "PLANETA", "SATÉLITE", "ASTRONAUTA", "GALAXIA", "METEORITO", "TELESCOPIO", "SOL", "LUNA", "TIERRA", "COHETE",
      "RADIO", "COMPUTADORA", "LABORATORIO", "ANTENA", "GUANTE", "BOTA", "CÁMARA", "ALIEN", "OVNI", "ESTRELLA",
    ],
    [
      "RADIACIÓN", "LUZ", "ENERGÍA", "ROTACIÓN", "HIELO", "ROCA", "METAL", "MOTOR",
      "BATERÍA", "DESPEGUE", "ATERRIZAJE", "NAVEGACIÓN", "SEÑAL", "CONTROL", "TIEMPO", "DISTANCIA",
    ],
    [
      "COMETA", "CIENTÍFICO", "PESO", "PILOTO", "COMBUSTIBLE", "RADAR", "LANZAMIENTO", "EXPEDICIÓN",
      "ASTRONOMÍA", "AÑO", "BIGBANG", "MAGNETISMO", "VOLCÁN", "VALLE", "DUNA", "EXPERIMENTO",
    ],
    [
      "MERCURIO", "VENUS", "MARTE", "JÚPITER", "SATURNO", "URANO", "NEPTUNO", "PLUTÓN",
      "CERES", "ANDRÓMEDA", "NEBULOSA", "ROVER", "ESTACIÓN", "TRANSBORDADOR", "AURORA", "LLENA",
    ],
  ],
  Granja: [
    [
      "GALLO", "GALLINA", "SEMILLA", "PALA", "CAMPESINO", "LECHUGA", "VACA", "TORO", "CERDO", "OVEJA",
      "CABRA", "CABALLO", "BURRO", "CONEJO", "PATO", "GANSO", "PAVO", "HUEVO", "MAÍZ", "TRACTOR",
    ],
    [
      "TRIGO", "PAPA", "TOMATE", "ZANAHORIA", "CALABAZA", "MANZANA", "NARANJA", "LIMÓN",
      "FRESA", "UVA", "SANDÍA", "MELÓN", "PIMIENTO", "BERENJENA", "PEPINO", "CEBOLLA",
    ],
    [
      "CARNERO", "POLLITO", "PLUMA", "ALA", "LANA", "LECHE", "MIEL", "ABEJA",
      "LOMBRIZ", "MARIPOSA", "MARIQUITA", "GIRASOL", "MANÍ", "AJO", "BRÓCOLI", "HACHA",
    ],
    [
      "PERRO", "GATO", "RATÓN", "LECHUZA", "RANA", "FRIJOL", "BATATA", "MANGO",
      "BANANA", "PIÑA", "COCO", "AGUACATE", "PERA", "MARTILLO", "SERRUCHO", "BALDE",
    ],
  ],
};
