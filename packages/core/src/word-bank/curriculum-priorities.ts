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
  ],
};
