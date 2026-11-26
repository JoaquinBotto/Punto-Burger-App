import type { QuestionSeedItem } from './types';

export const historiaExpanded: QuestionSeedItem[] = [
  // ==========================================
  // INITIAL (16 preguntas: 4 child, 4 teen, 4 adult, 4 general)
  // Target answers: 5 A, 3 B, 3 C, 5 D
  // ==========================================

  // --- INITIAL / CHILD (4) ---
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué prócer argentino lideró el Cruce de los Andes con su ejército libertador en 1817?',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'José de San Martín', isCorrect: true },
      { text: 'Manuel Belgrano', isCorrect: false },
      { text: 'Mariano Moreno', isCorrect: false },
      { text: 'Juan José Paso', isCorrect: false },
    ],
    explanation:
      'El general José de San Martín organizó el Ejército de los Andes en Mendoza para liberar Chile y Perú.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿En qué ciudad histórica argentina se declaró solemnemente la Independencia nacional el 9 de Julio de 1816?',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Buenos Aires', isCorrect: false },
      { text: 'Rosario', isCorrect: false },
      { text: 'Salta', isCorrect: false },
      { text: 'San Miguel de Tucumán', isCorrect: true },
    ],
    explanation:
      'El Congreso reunido en la Casa de Tucumán proclamó la independencia de las Provincias Unidas en Sud América.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Cómo se llamaban comúnmente las tres embarcaciones de la expedición marítima de Cristóbal Colón en 1492?',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'La Victoria, La Trinidad y La Concepción', isCorrect: false },
      { text: 'La Niña, La Pinta y la Santa María', isCorrect: true },
      { text: 'La Argentina, La Criolla y La Esperanza', isCorrect: false },
      { text: 'La Hércules, La Invencible y La Sirena', isCorrect: false },
    ],
    explanation:
      'La expedición colombina de 1492 navegó con dos carabelas (La Niña y La Pinta) y una nao insignia (la Santa María).',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué prócer argentino enarboló y creó por primera vez la Bandera Nacional a orillas del río Paraná en 1812?',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: null,
    options: [
      { text: 'Cornelio Saavedra', isCorrect: false },
      { text: 'Martín Miguel de Güemes', isCorrect: false },
      { text: 'Manuel Belgrano', isCorrect: true },
      { text: 'Justo José de Urquiza', isCorrect: false },
    ],
    explanation:
      'Manuel Belgrano diseñó y juró la enseña patria en las baterías de Rosario el 27 de febrero de 1812.',
  },

  // --- INITIAL / TEEN (4) ---
  {
    categorySlug: 'historia',
    prompt:
      '¿En qué año alunizó por primera vez el ser humano con la misión Apolo 11 comandada por Neil Armstrong?',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: '1969', isCorrect: true },
      { text: '1965', isCorrect: false },
      { text: '1972', isCorrect: false },
      { text: '1959', isCorrect: false },
    ],
    explanation:
      'El 20 de julio de 1969 el módulo lunar Eagle descendió en el Mar de la Tranquilidad en la Luna.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué célebre civilización de la antigüedad erigió el Coliseo y dominó militarmente la cuenca del Mediterráneo?',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Imperio Persa', isCorrect: false },
      { text: 'Antigua Grecia', isCorrect: false },
      { text: 'Egipto Faraónico', isCorrect: false },
      { text: 'Imperio Romano', isCorrect: true },
    ],
    explanation:
      'Roma expandió su dominio desde la península itálica abarcando gran parte de Europa, el norte de África y Oriente.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué célebre documento redactado en Filadelfia en 1776 formalizó la separación de las trece colonias de Gran Bretaña?',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Carta Magna', isCorrect: false },
      { text: 'Tratado de Utrecht', isCorrect: false },
      { text: 'Constitución de Filadelfia', isCorrect: false },
      { text: 'Declaración de Independencia de EE.UU.', isCorrect: true },
    ],
    explanation:
      'Adoptada el 4 de julio de 1776, la Declaración fue redactada principalmente por Thomas Jefferson.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué líder militar y político francés gobernó Francia y conquistó gran parte de Europa a comienzos del siglo XIX?',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: null,
    options: [
      { text: 'Napoleón Bonaparte', isCorrect: true },
      { text: 'Luis XIV', isCorrect: false },
      { text: 'Charles de Gaulle', isCorrect: false },
      { text: 'Cardenal Richelieu', isCorrect: false },
    ],
    explanation:
      'Napoleón se autocoronó emperador de los franceses en 1804 y protagonizó las trascendentales guerras napoleónicas.',
  },

  // --- INITIAL / ADULT (4) ---
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué histórico tratado de 1494 trazó una línea imaginaria en el Atlántico repartiendo las tierras descubiertas entre España y Portugal?',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Paz de Westfalia', isCorrect: false },
      { text: 'Tratado de Madrid', isCorrect: false },
      { text: 'Tratado de Utrecht', isCorrect: false },
      { text: 'Tratado de Tordesillas', isCorrect: true },
    ],
    explanation:
      'Firmado en Tordesillas (Castilla), fijó el meridiano divisor a 370 leguas al oeste de las islas de Cabo Verde.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué joven faraón egipcio se convirtió en icono mundial tras el hallazgo de su tumba casi intacta por Howard Carter en 1922?',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Ramsés II', isCorrect: false },
      { text: 'Tutankamón', isCorrect: true },
      { text: 'Akenatón', isCorrect: false },
      { text: 'Keops', isCorrect: false },
    ],
    explanation:
      'La tumba KV62 en el Valle de los Reyes albergaba un ajuar funerario de incalculable valor histórico y artístico.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿En qué año se produjo la histórica Revolución de Mayo que instituyó la Primera Junta de gobierno en Buenos Aires?',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: '1810', isCorrect: true },
      { text: '1816', isCorrect: false },
      { text: '1806', isCorrect: false },
      { text: '1820', isCorrect: false },
    ],
    explanation:
      'La Semana de Mayo de 1810 culminó el 25 de mayo con la destitución del virrey Cisneros y el inicio de la autonomía criolla.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Quién perfeccionó la imprenta con tipos móviles metálicos en Europa hacia mediados del siglo XV?',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Leonardo da Vinci', isCorrect: false },
      { text: 'Galileo Galilei', isCorrect: false },
      { text: 'Johannes Gutenberg', isCorrect: true },
      { text: 'Nicolás Maquiavelo', isCorrect: false },
    ],
    explanation:
      'Gutenberg imprimió en Maguncia (Alemania) su famosa Biblia de 42 líneas, iniciando la revolución de la imprenta moderna.',
  },

  // --- INITIAL / GENERAL (4) ---
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué educador, escritor y presidente argentino del siglo XIX es recordado popularmente como el "Padre del Aula"?',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Bartolomé Mitre', isCorrect: false },
      { text: 'Nicolás Avellaneda', isCorrect: false },
      { text: 'Bernardino Rivadavia', isCorrect: false },
      { text: 'Domingo Faustino Sarmiento', isCorrect: true },
    ],
    explanation:
      'Sarmiento impulsó decisivamente la educación pública, la formación docente y la fundación de bibliotecas populares.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué gran civilización precolombina dominaba el valle central de México al momento de la llegada de las tropas españolas en 1519?',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Imperio Azteca (Mexica)', isCorrect: true },
      { text: 'Civilización Maya', isCorrect: false },
      { text: 'Imperio Incaico', isCorrect: false },
      { text: 'Cultura Chibcha', isCorrect: false },
    ],
    explanation:
      'Tenochtitlan era la monumental capital del Imperio Mexica o Azteca en el corazón del lago de Texcoco.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿En qué ciudad milenaria se originó la civilización que extendió el uso del latín y del derecho civil por Occidente?',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Atenas', isCorrect: false },
      { text: 'Roma', isCorrect: true },
      { text: 'Cartago', isCorrect: false },
      { text: 'Alejandría', isCorrect: false },
    ],
    explanation:
      'Roma, fundada a orillas del río Tíber, fue la cuna de las instituciones republicanas e imperiales que modelaron el mundo occidental.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué célebre monumento porteño se levantó en 1936 en la avenida 9 de Julio para conmemorar los 400 años de la primera fundación de la ciudad?',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'La Pirámide de Mayo', isCorrect: false },
      { text: 'El Monumento de los Españoles', isCorrect: false },
      { text: 'El Obelisco de Buenos Aires', isCorrect: true },
      { text: 'La Torre Monumental', isCorrect: false },
    ],
    explanation:
      'Diseñado por el arquitecto Alberto Prebisch, el Obelisco fue erigido en tiempo récord en la Plaza de la República.',
  },

  // ==========================================
  // MEDIUM (16 preguntas: 4 child, 4 teen, 4 adult, 4 general)
  // Target answers: 4 A, 4 B, 3 C, 5 D
  // ==========================================

  // --- MEDIUM / CHILD (4) ---
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué pueblo originario nómade habitaba las estepas patagónicas meridionales antes de la colonización europea?',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Tehuelches (Aónikenk)', isCorrect: true },
      { text: 'Diaguitas', isCorrect: false },
      { text: 'Guaraníes', isCorrect: false },
      { text: 'Comechingones', isCorrect: false },
    ],
    explanation:
      'Los tehuelches eran expertos cazadores pedestres y luego ecuestres de guanacos y choiques en la Patagonia.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué célebre activista afroamericano pronunció el histórico discurso "I Have a Dream" en Washington D. C. en 1963?',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Malcolm X', isCorrect: false },
      { text: 'Rosa Parks', isCorrect: false },
      { text: 'Nelson Mandela', isCorrect: false },
      { text: 'Martin Luther King Jr.', isCorrect: true },
    ],
    explanation:
      'Martin Luther King Jr. lideró pacíficamente la lucha por los derechos civiles y la igualdad de las personas afroamericanas.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿En qué fecha se conmemora en Argentina el Día de la Bandera en conmemoración del paso a la inmortalidad de Manuel Belgrano?',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: '25 de Mayo', isCorrect: false },
      { text: '20 de Junio', isCorrect: true },
      { text: '9 de Julio', isCorrect: false },
      { text: '17 de Agosto', isCorrect: false },
    ],
    explanation:
      'El feriado del 20 de junio honra la memoria del creador de la enseña nacional, fallecido ese día en 1820.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué colosal torre de señalización marítima construida en la isla de Faro en Egipto fue una de las Siete Maravillas del Mundo Antiguo?',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: null,
    options: [
      { text: 'Coloso de Rodas', isCorrect: false },
      { text: 'Mausoleo de Halicarnaso', isCorrect: false },
      { text: 'Faro de Alejandría', isCorrect: true },
      { text: 'Estatua de Zeus en Olimpia', isCorrect: false },
    ],
    explanation:
      'El Faro de Alejandría, de más de 100 metros de altura, guió a navegantes durante más de un milenio.',
  },

  // --- MEDIUM / TEEN (4) ---
  {
    categorySlug: 'historia',
    prompt:
      '¿En qué año concluyó formalmente la Segunda Guerra Mundial con la capitulación de las fuerzas del Eje en Europa y el Pacífico?',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: '1945', isCorrect: true },
      { text: '1944', isCorrect: false },
      { text: '1948', isCorrect: false },
      { text: '1943', isCorrect: false },
    ],
    explanation:
      'El conflicto bélico mundial más mortífero finalizó en 1945 con la rendición alemana en mayo y la japonesa en septiembre.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué acontecimiento popular en París en julio de 1789 simboliza el estallido triunfal de la Revolución Francesa?',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'La toma de la Bastilla', isCorrect: true },
      { text: 'La coronación de Napoleón', isCorrect: false },
      { text: 'El Juramento del Juego de Pelota', isCorrect: false },
      { text: 'La ejecución de Luis XVI', isCorrect: false },
    ],
    explanation:
      'La toma de la fortaleza medieval de la Bastilla el 14 de julio de 1789 marcó el desafío definitivo al absolutismo borbónico.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué líder sudafricano y Premio Nobel de la Paz asumió la presidencia de su país en 1994 tras el fin del régimen del Apartheid?',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Desmond Tutu', isCorrect: false },
      { text: 'Kofi Annan', isCorrect: false },
      { text: 'Patrice Lumumba', isCorrect: false },
      { text: 'Nelson Mandela', isCorrect: true },
    ],
    explanation:
      'Nelson Mandela encabezó una histórica transición democrática pacífica tras permanecer 27 años injustamente encarcelado.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Quién fue la última gobernante de la dinastía ptolemaica del Antiguo Egipto célebre por sus alianzas con figuras de Roma?',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: null,
    options: [
      { text: 'Nefertiti', isCorrect: false },
      { text: 'Cleopatra VII', isCorrect: true },
      { text: 'Hatshepsut', isCorrect: false },
      { text: 'Nefertari', isCorrect: false },
    ],
    explanation:
      'Cleopatra VII mantuvo la independencia egipcia mediante alianzas políticas con Julio César y Marco Antonio.',
  },

  // --- MEDIUM / ADULT (4) ---
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué célebre dictador y comandante militar de la República Romana fue ultimado por senadores en los Idus de Marzo del 44 a. C.?',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Cneo Pompeyo', isCorrect: false },
      { text: 'Julio César', isCorrect: true },
      { text: 'Marco Craso', isCorrect: false },
      { text: 'César Augusto', isCorrect: false },
    ],
    explanation:
      'Julio César fue apuñalado en el Senado de Roma por una conspiración republicana encabezada por Bruto y Casio.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿En qué año declaró don José de San Martín la independencia de la República del Perú en la Plaza de Armas de Lima?',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: '1810', isCorrect: false },
      { text: '1816', isCorrect: false },
      { text: '1824', isCorrect: false },
      { text: '1821', isCorrect: true },
    ],
    explanation:
      'San Martín proclamó formalmente la independencia del Perú el 28 de julio de 1821 asumiendo como Protector.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué eminente polímata inglés formuló en 1687 los principios matemáticos de la filosofía natural y la gravitación universal?',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Francis Bacon', isCorrect: false },
      { text: 'Robert Hooke', isCorrect: false },
      { text: 'Isaac Newton', isCorrect: true },
      { text: 'Edmund Halley', isCorrect: false },
    ],
    explanation:
      'Isaac Newton revolucionó la física clásica y la astronomía al unificar las leyes terrestres y celestes del movimiento.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué caudillo federal y brigadier general gobernó Santa Fe durante dos décadas consolidando el Pacto Federal y la autonomía provincial?',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Estanislao López', isCorrect: true },
      { text: 'Juan Bautista Bustos', isCorrect: false },
      { text: 'Facundo Quiroga', isCorrect: false },
      { text: 'Pascual Echagüe', isCorrect: false },
    ],
    explanation:
      'Conocido como el "Patriarca de la Federación", Estanislao López lideró la provincia de Santa Fe desde 1818 hasta su muerte en 1838.',
  },

  // --- MEDIUM / GENERAL (4) ---
  {
    categorySlug: 'historia',
    prompt:
      '¿En qué año tuvo lugar el conflicto del Atlántico Sur entre la República Argentina y Gran Bretaña por las Islas Malvinas?',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: '1976', isCorrect: false },
      { text: '1978', isCorrect: false },
      { text: '1985', isCorrect: false },
      { text: '1982', isCorrect: true },
    ],
    explanation:
      'El conflicto bélico de Malvinas se desarrolló entre el 2 de abril y el 14 de junio de 1982.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Cómo se denominó a la ancestral red comercial terrestre de miles de kilómetros que conectaba a China con el Mediterráneo europeo?',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Ruta del Oro', isCorrect: false },
      { text: 'Ruta de la Seda', isCorrect: true },
      { text: 'Ruta de las Especias', isCorrect: false },
      { text: 'Ruta del Incienso', isCorrect: false },
    ],
    explanation:
      'La Ruta de la Seda facilitó durante siglos el intercambio comercial, cultural y tecnológico entre Oriente y Occidente.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué famosa orden militar y religiosa cristiana fundada en el siglo XII tenía como misión original custodiar los Santos Lugares en Jerusalén?',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Orden Teutónica', isCorrect: false },
      { text: 'Orden de Malta', isCorrect: false },
      { text: 'Caballeros Templarios', isCorrect: true },
      { text: 'Orden de Calatrava', isCorrect: false },
    ],
    explanation:
      'Los Caballeros del Temple o Templarios alcanzaron gran poder militar y financiero durante las Cruzadas medievales.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Quién estuvo al mando de las fuerzas patriotas en las victorias militares decisivas de Tucumán (1812) y Salta (1813)?',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Manuel Belgrano', isCorrect: true },
      { text: 'José de San Martín', isCorrect: false },
      { text: 'Juan José Castelli', isCorrect: false },
      { text: 'José Rondeau', isCorrect: false },
    ],
    explanation:
      'Belgrano desobedeció la orden de retirada porteña, lideró el Éxodo Jujeño y derrotó a los realistas en el norte.',
  },

  // ==========================================
  // ADVANCED (16 preguntas: 4 child, 4 teen, 4 adult, 4 general)
  // Target answers: 5 A, 3 B, 3 C, 5 D
  // ==========================================

  // --- ADVANCED / CHILD (4) ---
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué rey del reino macedonio forjó uno de los mayores imperios del mundo antiguo extendiéndose desde Grecia hasta la India?',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Alejandro Magno', isCorrect: true },
      { text: 'Filipo II', isCorrect: false },
      { text: 'Pericles', isCorrect: false },
      { text: 'Leónidas de Esparta', isCorrect: false },
    ],
    explanation:
      'Alejandro Magno derrotó al Imperio Aqueménida persa difundiendo la cultura helénica por Asia y Egipto.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué pueblo costero y navegante de la antigüedad inventó el sistema alfabético fonético que dio origen al alfabeto griego y latino?',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Hititas', isCorrect: false },
      { text: 'Sumerios', isCorrect: false },
      { text: 'Babilonios', isCorrect: false },
      { text: 'Fenicios', isCorrect: true },
    ],
    explanation:
      'Los fenicios desarrollaron un alfabeto consonántico práctico para sus extensas actividades mercantiles marítimas.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Quién fue designado como primer virrey del Virreinato del Río de la Plata tras su creación en 1776?',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Juan José de Vértiz', isCorrect: false },
      { text: 'Pedro de Cevallos', isCorrect: true },
      { text: 'Rafael de Sobremonte', isCorrect: false },
      { text: 'Santiago de Liniers', isCorrect: false },
    ],
    explanation:
      'El militar Pedro de Cevallos fue el primer virrey enviado por el rey Carlos III de España para organizar el nuevo virreinato.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué colosal obra defensiva de piedra y tierra fue construida a lo largo de siglos para proteger las fronteras del norte de China?',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: null,
    options: [
      { text: 'Muralla de Adriano', isCorrect: false },
      { text: 'Línea Maginot', isCorrect: false },
      { text: 'Gran Muralla China', isCorrect: true },
      { text: 'Murallas de Constantinopla', isCorrect: false },
    ],
    explanation:
      'La Gran Muralla China se extiende por miles de kilómetros y fue iniciada durante la dinastía Qin para contener incursiones nómadas.',
  },

  // --- ADVANCED / TEEN (4) ---
  {
    categorySlug: 'historia',
    prompt:
      '¿En qué año conquistaron los turcos otomanos la ciudad de Constantinopla marcando el fin del Imperio Bizantino?',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: '1492', isCorrect: false },
      { text: '1348', isCorrect: false },
      { text: '1517', isCorrect: false },
      { text: '1453', isCorrect: true },
    ],
    explanation:
      'Bajo el mando del sultán Mehmed II, la caída de Constantinopla en 1453 señala el tránsito tradicional hacia la Edad Moderna.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué astrónomo polaco formuló de manera sistemática en el siglo XVI la teoría astronómica heliocéntrica?',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Nicolás Copérnico', isCorrect: true },
      { text: 'Tycho Brahe', isCorrect: false },
      { text: 'Johannes Kepler', isCorrect: false },
      { text: 'Giordano Bruno', isCorrect: false },
    ],
    explanation:
      'Copérnico postuló que la Tierra y los demás planetas giran en torno al Sol en su trascendental obra de 1543.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué filósofo ateniense, maestro de Platón, fue juzgado y condenado a morir bebiendo cicuta en el 399 a. C.?',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Aristóteles', isCorrect: false },
      { text: 'Epicuro', isCorrect: false },
      { text: 'Zenón de Citio', isCorrect: false },
      { text: 'Sócrates', isCorrect: true },
    ],
    explanation:
      'Sócrates no dejó escritos propios pero revolucionó el pensamiento occidental con su método mayéutico de diálogo crítico.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Bajo el reinado de qué monarca español del siglo XVI el imperio español incorporó Portugal y alcanzó su máxima extensión territorial?',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: null,
    options: [
      { text: 'Carlos I', isCorrect: false },
      { text: 'Felipe III', isCorrect: false },
      { text: 'Felipe II', isCorrect: true },
      { text: 'Fernando el Católico', isCorrect: false },
    ],
    explanation:
      'Felipe II gobernó un imperio global que abarcaba posesiones en Europa, América, África y las islas Filipinas en Asia.',
  },

  // --- ADVANCED / ADULT (4) ---
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué histórico edicto promulgado en el 313 d. C. por Constantino el Grande garantizó la tolerancia y libertad religiosa en el Imperio Romano?',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Edicto de Tesalónica', isCorrect: false },
      { text: 'Edicto de Milán', isCorrect: true },
      { text: 'Edicto de Nantes', isCorrect: false },
      { text: 'Edicto de Worms', isCorrect: false },
    ],
    explanation:
      'El Edicto de Milán puso fin formal a las sangrientas persecuciones imperiales contra los cristianos.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué combate naval de 1805 frente a las costas de Cádiz aseguró la hegemonía marítima británica bajo el mando del almirante Nelson?',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Batalla de Lepanto', isCorrect: false },
      { text: 'Batalla de Jutlandia', isCorrect: false },
      { text: 'Batalla de Midway', isCorrect: false },
      { text: 'Batalla de Trafalgar', isCorrect: true },
    ],
    explanation:
      'En Trafalgar la armada británica desbarató a la flota combinada franco-española desbaratando los planes napoleónicos de invasión.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Quién unificó a las tribus nómadas de las estepas asiáticas a inicios del siglo XIII fundando el formidable Imperio Mongol?',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Gengis Kan (Temüjin)', isCorrect: true },
      { text: 'Kublai Kan', isCorrect: false },
      { text: 'Tamerlán', isCorrect: false },
      { text: 'Atila el Huno', isCorrect: false },
    ],
    explanation:
      'Gengis Kan organizó una caballería invencible que construyó el imperio contiguo más extenso de la historia humana.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué distinguido militar y político integró con Pompeyo y Craso el Primer Triunvirato que dominó la República Romana hacia el 60 a. C.?',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Julio César', isCorrect: true },
      { text: 'Cicerón', isCorrect: false },
      { text: 'Marco Antonio', isCorrect: false },
      { text: 'Octavio Augusto', isCorrect: false },
    ],
    explanation:
      'El Primer Triunvirato fue una alianza política secreta entre César, Pompeyo Magno y Craso para repartirse el poder en Roma.',
  },

  // --- ADVANCED / GENERAL (4) ---
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué tratado de paz rubricado en 1919 en París impuso duras condiciones a Alemania tras la Primera Guerra Mundial?',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Tratado de Ginebra', isCorrect: false },
      { text: 'Tratado de Viena', isCorrect: false },
      { text: 'Tratado de Brest-Litovsk', isCorrect: false },
      { text: 'Tratado de Versalles', isCorrect: true },
    ],
    explanation:
      'El Tratado de Versalles exigió desmilitarización, cesiones territoriales y fuertes reparaciones de guerra a Alemania.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿En qué año el adelantado Juan de Garay llevó a cabo la segunda y definitiva fundación de la Ciudad de la Trinidad y puerto de Buenos Aires?',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: '1580', isCorrect: true },
      { text: '1536', isCorrect: false },
      { text: '1573', isCorrect: false },
      { text: '1610', isCorrect: false },
    ],
    explanation:
      'Partiendo desde Santa Fe, Juan de Garay refundó formalmente Buenos Aires el 11 de junio de 1580.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué hazaña aeronáutica mundial completó Charles Lindbergh en mayo de 1927 al mando del avión Spirit of St. Louis?',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Primera vuelta aérea al mundo', isCorrect: false },
      { text: 'Primer vuelo transatlántico en solitario sin escalas', isCorrect: true },
      { text: 'Primer vuelo supersónico tripulado', isCorrect: false },
      { text: 'Primer sobrevuelo del Polo Sur geográfico', isCorrect: false },
    ],
    explanation:
      'Lindbergh voló en solitario sin escalas desde Nueva York hasta París en 33 horas y media conmoviendo a la opinión pública.',
  },
  {
    categorySlug: 'historia',
    prompt:
      '¿Qué civilización originaria de Mesoamérica destacó por sus avanzados cómputos astronómicos, el concepto del cero y el calendario solar?',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Cultura Tolteca', isCorrect: false },
      { text: 'Cultura Zapoteca', isCorrect: false },
      { text: 'Civilización Maya', isCorrect: true },
      { text: 'Cultura Olmeca', isCorrect: false },
    ],
    explanation:
      'Los mayas desarrollaron una escritura jeroglífica refinada y uno de los sistemas calendáricos más precisos de la antigüedad.',
  },
];
