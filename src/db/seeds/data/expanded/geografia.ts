import type { QuestionSeedItem } from './types';

export const geografiaExpanded: QuestionSeedItem[] = [
  // ==========================================
  // INITIAL (16 preguntas: 4 child, 4 teen, 4 adult, 4 general)
  // Target answers: 5 A, 3 B, 3 C, 5 D
  // ==========================================

  // --- INITIAL / CHILD (4) ---
  {
    categorySlug: 'geografia',
    prompt: '¿Qué importante río argentino bordea la costa de la ciudad de Rosario?',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Río Paraná', isCorrect: true },
      { text: 'Río Uruguay', isCorrect: false },
      { text: 'Río Salado', isCorrect: false },
      { text: 'Río Colorado', isCorrect: false },
    ],
    explanation:
      'El río Paraná es uno de los más importantes de América del Sur y recorre la costa este de la ciudad de Rosario.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es el monte más alto y reconocido de Japón, famoso por su silueta nevada?',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Monte Fuji', isCorrect: true },
      { text: 'Monte Aconcagua', isCorrect: false },
      { text: 'Monte Kilimanjaro', isCorrect: false },
      { text: 'Monte Everest', isCorrect: false },
    ],
    explanation:
      'El monte Fuji es un volcán activo y el pico más alto de Japón con 3.776 metros de altitud.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Qué país limita inmediatamente al norte con los Estados Unidos?',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'México', isCorrect: false },
      { text: 'Canadá', isCorrect: true },
      { text: 'Groenlandia', isCorrect: false },
      { text: 'Rusia', isCorrect: false },
    ],
    explanation:
      'Canadá comparte con los Estados Unidos la frontera territorial terrestre no fortificada más extensa del mundo.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿En qué país sudamericano se localiza la mayor porción de la selva del Amazonas?',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: null,
    options: [
      { text: 'Colombia', isCorrect: false },
      { text: 'Perú', isCorrect: false },
      { text: 'Brasil', isCorrect: true },
      { text: 'Venezuela', isCorrect: false },
    ],
    explanation:
      'Aproximadamente el 60% de la selva amazónica se encuentra dentro del territorio de Brasil.',
  },

  // --- INITIAL / TEEN (4) ---
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es el río más caudaloso y extenso del mundo?',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Río Amazonas', isCorrect: true },
      { text: 'Río Nilo', isCorrect: false },
      { text: 'Río Misisipi', isCorrect: false },
      { text: 'Río Danubio', isCorrect: false },
    ],
    explanation:
      'El río Amazonas es el más caudaloso del planeta y posee la cuenca hidrográfica más grande del mundo.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué desierto de América del Sur es considerado el más árido del planeta fuera de los polos?',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Desierto de Sonora', isCorrect: false },
      { text: 'Desierto del Sahara', isCorrect: false },
      { text: 'Desierto de Gobi', isCorrect: false },
      { text: 'Desierto de Atacama', isCorrect: true },
    ],
    explanation:
      'Ubicado en el norte de Chile, el desierto de Atacama ostenta el récord de aridez en el planeta.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es la ciudad capital de la República Federativa del Brasil?',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Río de Janeiro', isCorrect: false },
      { text: 'San Pablo', isCorrect: false },
      { text: 'Salvador de Bahía', isCorrect: false },
      { text: 'Brasilia', isCorrect: true },
    ],
    explanation:
      'Brasilia fue planificada y construida en el centro del país e inaugurada formalmente como capital en 1960.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué país europeo se reconoce fácilmente en el mapa por su característica forma de bota?',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: null,
    options: [
      { text: 'Italia', isCorrect: true },
      { text: 'España', isCorrect: false },
      { text: 'Grecia', isCorrect: false },
      { text: 'Portugal', isCorrect: false },
    ],
    explanation:
      'La península itálica en el sur de Europa tiene una silueta cartográfica distintiva semejante a una bota.',
  },

  // --- INITIAL / ADULT (4) ---
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué estrecho natural separa el continente europeo del africano conectando el Atlántico con el Mediterráneo?',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Estrecho de Bósforo', isCorrect: false },
      { text: 'Canal de Suez', isCorrect: false },
      { text: 'Estrecho de Ormuz', isCorrect: false },
      { text: 'Estrecho de Gibraltar', isCorrect: true },
    ],
    explanation:
      'El estrecho de Gibraltar tiene una anchura mínima de unos 14 kilómetros entre España y Marruecos.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es el punto de menor altitud (depresión terrestre) de América del Sur?',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Valle de la Muerte', isCorrect: false },
      { text: 'Laguna del Carbón', isCorrect: true },
      { text: 'Depresión de Qattara', isCorrect: false },
      { text: 'Salar de Uyuni', isCorrect: false },
    ],
    explanation:
      'La Laguna del Carbón, ubicada en el Gran Bajo de San Julián en Santa Cruz (Argentina), se halla a 105 metros bajo el nivel del mar.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es la cordillera montañosa continental más larga del planeta Tierra?',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Cordillera de los Andes', isCorrect: true },
      { text: 'Montañas Rocosas', isCorrect: false },
      { text: 'Cordillera del Himalaya', isCorrect: false },
      { text: 'Alpes Suizos', isCorrect: false },
    ],
    explanation:
      'La cordillera de los Andes se extiende por más de 7.000 kilómetros a lo largo de toda la costa occidental de América del Sur.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿En qué provincia argentina se encuentra el Parque Nacional Talampaya, célebre por sus cañones de arenisca roja?',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'San Juan', isCorrect: false },
      { text: 'Catamarca', isCorrect: false },
      { text: 'La Rioja', isCorrect: true },
      { text: 'Salta', isCorrect: false },
    ],
    explanation:
      'El Parque Nacional Talampaya está situado en la provincia de La Rioja y fue declarado Patrimonio de la Humanidad por la Unesco.',
  },

  // --- INITIAL / GENERAL (4) ---
  {
    categorySlug: 'geografia',
    prompt:
      '¿Cuál de los siguientes países de América del Sur no posee salida directa a costas oceánicas?',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Uruguay', isCorrect: false },
      { text: 'Ecuador', isCorrect: false },
      { text: 'Surinam', isCorrect: false },
      { text: 'Paraguay', isCorrect: true },
    ],
    explanation:
      'Paraguay y Bolivia son los dos únicos países sin litoral marítimo directo en Sudamérica.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué provincia de la República Argentina limita internacionalmente con tres naciones distintas?',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Corrientes', isCorrect: true },
      { text: 'Misiones', isCorrect: false },
      { text: 'Formosa', isCorrect: false },
      { text: 'Chaco', isCorrect: false },
    ],
    explanation:
      'Corrientes limita con Uruguay, Brasil y Paraguay, siendo una de las provincias con mayor conectividad fronteriza.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es la ciudad capital de la provincia de Córdoba en Argentina?',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Río Cuarto', isCorrect: false },
      { text: 'Córdoba', isCorrect: true },
      { text: 'Villa María', isCorrect: false },
      { text: 'Villa Carlos Paz', isCorrect: false },
    ],
    explanation:
      'Córdoba es la ciudad cabecera de la provincia homónima y la segunda más poblada de la República Argentina.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿En qué provincia argentina se localiza la mayor parte de la costa sur del lago Nahuel Huapi y San Carlos de Bariloche?',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Chubut', isCorrect: false },
      { text: 'Neuquén', isCorrect: false },
      { text: 'Río Negro', isCorrect: true },
      { text: 'Santa Cruz', isCorrect: false },
    ],
    explanation:
      'San Carlos de Bariloche se sitúa en el suroeste de la provincia de Río Negro, a orillas del lago Nahuel Huapi.',
  },

  // ==========================================
  // MEDIUM (16 preguntas: 4 child, 4 teen, 4 adult, 4 general)
  // Target answers: 5 A, 3 B, 3 C, 5 D
  // ==========================================

  // --- MEDIUM / CHILD (4) ---
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué gran isla argentina se encuentra al sur del estrecho de Magallanes compartida con Chile?',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Isla Grande de Tierra del Fuego', isCorrect: true },
      { text: 'Isla de los Estados', isCorrect: false },
      { text: 'Isla Martín García', isCorrect: false },
      { text: 'Isla Soledad', isCorrect: false },
    ],
    explanation:
      'La Isla Grande de Tierra del Fuego está dividida políticamente entre Argentina al este y Chile al oeste.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué país de Europa occidental es célebre mundialmente por sus molinos de viento, diques y tulipanes?',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Suiza', isCorrect: false },
      { text: 'Bélgica', isCorrect: false },
      { text: 'Dinamarca', isCorrect: false },
      { text: 'Países Bajos', isCorrect: true },
    ],
    explanation:
      'Los Países Bajos destacan históricamente por la ingeniería de sus pólderes, canales y producción floral.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es la ciudad capital de la República Oriental del Uruguay?',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Punta del Este', isCorrect: false },
      { text: 'Montevideo', isCorrect: true },
      { text: 'Colonia del Sacramento', isCorrect: false },
      { text: 'Salto', isCorrect: false },
    ],
    explanation:
      'Montevideo es la capital política y ciudad más poblada de Uruguay, situada sobre la costa del Río de la Plata.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué famoso río atraviesa la ciudad de Londres antes de desembocar en el mar del Norte?',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: null,
    options: [
      { text: 'Río Sena', isCorrect: false },
      { text: 'Río Rin', isCorrect: false },
      { text: 'Río Támesis', isCorrect: true },
      { text: 'Río Tíber', isCorrect: false },
    ],
    explanation:
      'El río Támesis fluye a través de Oxford y Londres constituyendo una de las principales vías fluviales de Inglaterra.',
  },

  // --- MEDIUM / TEEN (4) ---
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es la capital federal de Australia?',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Sídney', isCorrect: false },
      { text: 'Melbourne', isCorrect: false },
      { text: 'Brisbane', isCorrect: false },
      { text: 'Canberra', isCorrect: true },
    ],
    explanation:
      'Canberra fue elegida y construida como capital neutral de Australia en 1908 como acuerdo entre Sídney y Melbourne.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué sistema montañoso ruso marca el límite geográfico tradicional entre Europa y Asia?',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Montes Urales', isCorrect: true },
      { text: 'Montes Cárpatos', isCorrect: false },
      { text: 'Cordillera del Cáucaso', isCorrect: false },
      { text: 'Montes Altai', isCorrect: false },
    ],
    explanation:
      'Los montes Urales se extienden de norte a sur por Rusia sirviendo de frontera geográfica continental.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué enorme lago salino, el más extenso de Argentina, se encuentra en el noreste cordobés?',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Lago Argentino', isCorrect: false },
      { text: 'Lago Viedma', isCorrect: false },
      { text: 'Lago Lacar', isCorrect: false },
      { text: 'Mar Chiquita (Mar de Ansenuza)', isCorrect: true },
    ],
    explanation:
      'El Mar de Ansenuza o laguna Mar Chiquita es uno de los mayores lagos endorreicos y salados de la Tierra.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es la ciudad capital de Japón?',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: null,
    options: [
      { text: 'Tokio', isCorrect: true },
      { text: 'Kioto', isCorrect: false },
      { text: 'Osaka', isCorrect: false },
      { text: 'Yokohama', isCorrect: false },
    ],
    explanation:
      'Tokio es la sede del gobierno y del emperador de Japón, y encabeza una de las mayores áreas metropolitanas del mundo.',
  },

  // --- MEDIUM / ADULT (4) ---
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué cabo en el archipiélago de Tierra del Fuego marca el límite tradicional entre los océanos Atlántico y Pacífico?',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Cabo de Buena Esperanza', isCorrect: false },
      { text: 'Cabo de Hornos', isCorrect: true },
      { text: 'Cabo San Antonio', isCorrect: false },
      { text: 'Cabo Vírgenes', isCorrect: false },
    ],
    explanation:
      'El Cabo de Hornos es el punto más austral de las islas de Tierra del Fuego y delimita el pasaje de Drake.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué país del sudeste asiático constituye el mayor estado archipelágico del mundo con más de 17.000 islas?',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Filipinas', isCorrect: false },
      { text: 'Malasia', isCorrect: false },
      { text: 'Japón', isCorrect: false },
      { text: 'Indonesia', isCorrect: true },
    ],
    explanation:
      'Indonesia abarca miles de islas entre el Sudeste Asiático y Oceanía, incluyendo Sumatra, Java y parte de Borneo.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es la ciudad capital de la República del Perú?',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Cusco', isCorrect: false },
      { text: 'Arequipa', isCorrect: false },
      { text: 'Lima', isCorrect: true },
      { text: 'Trujillo', isCorrect: false },
    ],
    explanation:
      'Lima, fundada a orillas del río Rímac en la costa del Pacífico, es la capital política y económica del Perú.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué provincia argentina es reconocida nacional e internacionalmente como el epicentro de la producción vitivinícola?',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Mendoza', isCorrect: true },
      { text: 'San Juan', isCorrect: false },
      { text: 'Salta', isCorrect: false },
      { text: 'Neuquén', isCorrect: false },
    ],
    explanation:
      'Mendoza produce más del 70% del vino argentino y es una de las grandes capitales mundiales del Malbec.',
  },

  // --- MEDIUM / GENERAL (4) ---
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué río de la cuenca del Plata aporta el mayor volumen de agua y sedimentos al confluir con el río Uruguay?',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Río Bermejo', isCorrect: false },
      { text: 'Río Pilcomayo', isCorrect: false },
      { text: 'Río Salado del Norte', isCorrect: false },
      { text: 'Río Paraná', isCorrect: true },
    ],
    explanation:
      'El Paraná es el río eje del sistema fluvial del Plata con un caudal medio superior a 17.000 metros cúbicos por segundo.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es el Estado soberano más pequeño del planeta en extensión territorial?',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Mónaco', isCorrect: false },
      { text: 'Ciudad del Vaticano', isCorrect: true },
      { text: 'San Marino', isCorrect: false },
      { text: 'Liechtenstein', isCorrect: false },
    ],
    explanation:
      'La Ciudad del Vaticano cuenta con una superficie de aproximadamente 0,44 kilómetros cuadrados dentro de Roma.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿En qué provincia argentina se localiza el famoso Cerro de los Siete Colores en Purmamarca?',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Salta', isCorrect: false },
      { text: 'Tucumán', isCorrect: false },
      { text: 'Jujuy', isCorrect: true },
      { text: 'Catamarca', isCorrect: false },
    ],
    explanation:
      'El Cerro de los Siete Colores se erige en la Quebrada de Humahuaca, en la provincia de Jujuy.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué canal de navegación inaugurado en 1914 conecta artificialmente el océano Atlántico y el Pacífico en América Central?',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Canal de Panamá', isCorrect: true },
      { text: 'Canal de Suez', isCorrect: false },
      { text: 'Canal de Corinto', isCorrect: false },
      { text: 'Canal de Kiel', isCorrect: false },
    ],
    explanation:
      'El Canal de Panamá atraviesa el istmo de Panamá reduciendo enormemente las rutas marítimas globales.',
  },

  // ==========================================
  // ADVANCED (16 preguntas: 4 child, 4 teen, 4 adult, 4 general)
  // Target answers: 4 A, 3 B, 4 C, 5 D
  // ==========================================

  // --- ADVANCED / CHILD (4) ---
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es la masa de agua interior o lago salado más extenso del planeta?',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Mar Caspio', isCorrect: true },
      { text: 'Lago Superior', isCorrect: false },
      { text: 'Lago Victoria', isCorrect: false },
      { text: 'Lago Baikal', isCorrect: false },
    ],
    explanation:
      'El mar Caspio, con más de 370.000 kilómetros cuadrados de superficie, es el cuerpo de agua interior más grande de la Tierra.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿En qué país del noreste africano se ubican las milenarias pirámides de Guiza a orillas del río Nilo?',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Marruecos', isCorrect: false },
      { text: 'Sudán', isCorrect: false },
      { text: 'Túnez', isCorrect: false },
      { text: 'Egipto', isCorrect: true },
    ],
    explanation:
      'Las pirámides de Keops, Kefrén y Micerino se emplazan en la meseta de Guiza, en las afueras de El Cairo (Egipto).',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es la ciudad capital de la provincia de Mendoza?',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'San Rafael', isCorrect: false },
      { text: 'Mendoza', isCorrect: true },
      { text: 'Godoy Cruz', isCorrect: false },
      { text: 'Luján de Cuyo', isCorrect: false },
    ],
    explanation:
      'La ciudad de Mendoza es la capital y núcleo del área metropolitana del Gran Mendoza.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué paso marítimo angosto separa las costas de Inglaterra y Francia comunicando el Canal de la Mancha con el mar del Norte?',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: null,
    options: [
      { text: 'Estrecho de Bering', isCorrect: false },
      { text: 'Estrecho de Malaca', isCorrect: false },
      { text: 'Paso de Calais (Estrecho de Dover)', isCorrect: true },
      { text: 'Estrecho de Dardanelos', isCorrect: false },
    ],
    explanation:
      'El paso de Calais o estrecho de Dover tiene apenas 33 kilómetros de anchura entre Dover y Calais.',
  },

  // --- ADVANCED / TEEN (4) ---
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es el lago navegable a mayor altitud del mundo, compartido por Bolivia y Perú?',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Lago Tanganica', isCorrect: false },
      { text: 'Lago Baikal', isCorrect: false },
      { text: 'Lago Poopó', isCorrect: false },
      { text: 'Lago Titicaca', isCorrect: true },
    ],
    explanation:
      'El lago Titicaca está situado en el altiplano andino a más de 3.800 metros sobre el nivel del mar.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es la ciudad capital oficial de la República de Turquía?',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Ankara', isCorrect: true },
      { text: 'Estambul', isCorrect: false },
      { text: 'Esmirna', isCorrect: false },
      { text: 'Antalya', isCorrect: false },
    ],
    explanation:
      'Aunque Estambul es la ciudad más grande y conocida, Ankara fue designada capital de Turquía en 1923.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué país del norte de Europa es célebre mundialmente por sus profundos y espectaculares fiordos glaciares?',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Finlandia', isCorrect: false },
      { text: 'Suecia', isCorrect: false },
      { text: 'Irlanda', isCorrect: false },
      { text: 'Noruega', isCorrect: true },
    ],
    explanation:
      'Noruega posee una costa modelada por antiguos glaciares formando fiordos mundialmente conocidos como Geirangerfjord.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es el desierto no polar más grande y caluroso del planeta Tierra?',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: null,
    options: [
      { text: 'Desierto de Kalahari', isCorrect: false },
      { text: 'Desierto de Namibia', isCorrect: false },
      { text: 'Desierto del Sahara', isCorrect: true },
      { text: 'Desierto de Arabia', isCorrect: false },
    ],
    explanation:
      'El desierto del Sahara abarca más de 9 millones de kilómetros cuadrados cubriendo la mayor parte del norte africano.',
  },

  // --- ADVANCED / ADULT (4) ---
  {
    categorySlug: 'geografia',
    prompt:
      '¿Cuál es la fosa oceánica que contiene el punto más profundo registrado de todos los océanos del planeta?',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Fosa de Puerto Rico', isCorrect: false },
      { text: 'Fosa de las Marianas', isCorrect: true },
      { text: 'Fosa de Java', isCorrect: false },
      { text: 'Fosa de las Kuriles', isCorrect: false },
    ],
    explanation:
      'El abismo Challenger en la fosa de las Marianas en el Pacífico occidental desciende a casi 11.000 metros de profundidad.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué río europeo tiene la distinción de atravesar o delimitar cuatro capitales de Estado (Viena, Bratislava, Budapest y Belgrado)?',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Río Rin', isCorrect: false },
      { text: 'Río Elba', isCorrect: false },
      { text: 'Río Volga', isCorrect: false },
      { text: 'Río Danubio', isCorrect: true },
    ],
    explanation:
      'El Danubio nace en la Selva Negra alemana y recorre diez países europeos hasta desembocar en el mar Negro.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué extensa meseta asiática de gran elevación es apodada popularmente "el techo del mundo"?',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Meseta del Tíbet', isCorrect: true },
      { text: 'Meseta de Anatolia', isCorrect: false },
      { text: 'Meseta del Decán', isCorrect: false },
      { text: 'Meseta Central Siberiana', isCorrect: false },
    ],
    explanation:
      'La meseta tibetana abarca cerca de 2,5 millones de kilómetros cuadrados con una altitud media superior a 4.500 metros.',
  },
  {
    categorySlug: 'geografia',
    prompt: '¿Cuál es la ciudad capital administrativa y política de Nueva Zelanda?',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Auckland', isCorrect: false },
      { text: 'Christchurch', isCorrect: false },
      { text: 'Wellington', isCorrect: true },
      { text: 'Queenstown', isCorrect: false },
    ],
    explanation:
      'Wellington es la capital más austral del mundo y reemplazó a Auckland como capital de Nueva Zelanda en 1865.',
  },

  // --- ADVANCED / GENERAL (4) ---
  {
    categorySlug: 'geografia',
    prompt: '¿Qué país del este de África tiene como ciudad capital a Nairobi?',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Kenia', isCorrect: true },
      { text: 'Tanzania', isCorrect: false },
      { text: 'Etiopía', isCorrect: false },
      { text: 'Uganda', isCorrect: false },
    ],
    explanation:
      'Nairobi es la capital y centro financiero de Kenia, además de una de las sedes principales de la ONU en África.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Cuál es el país de mayor superficie territorial en el istmo de América Central continental?',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Guatemala', isCorrect: false },
      { text: 'Honduras', isCorrect: false },
      { text: 'Panamá', isCorrect: false },
      { text: 'Nicaragua', isCorrect: true },
    ],
    explanation:
      'Nicaragua cuenta con aproximadamente 130.370 kilómetros cuadrados de superficie, siendo el más extenso de Centroamérica continental.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿En qué provincia argentina se halla el glaciar Perito Moreno dentro del Parque Nacional Los Glaciares?',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Tierra del Fuego', isCorrect: false },
      { text: 'Santa Cruz', isCorrect: true },
      { text: 'Chubut', isCorrect: false },
      { text: 'Neuquén', isCorrect: false },
    ],
    explanation:
      'El glaciar Perito Moreno se ubica en el departamento Lago Argentino en el sudoeste de la provincia de Santa Cruz.',
  },
  {
    categorySlug: 'geografia',
    prompt:
      '¿Qué país de América del Sur posee costas marítimas continuas tanto sobre el océano Pacífico como sobre el mar Caribe?',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Venezuela', isCorrect: false },
      { text: 'Ecuador', isCorrect: false },
      { text: 'Colombia', isCorrect: true },
      { text: 'Panamá', isCorrect: false },
    ],
    explanation:
      'Colombia es el único país de América del Sur con litorales abiertos tanto en el mar Caribe (Atlántico) como en el Pacífico.',
  },
];
