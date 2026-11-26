import type { QuestionSeedItem } from './types';

export const entretenimientoExpanded: QuestionSeedItem[] = [
  // ==========================================
  // INITIAL (16 preguntas: 4 child, 4 teen, 4 adult, 4 general)
  // Target answers: 4 A, 3 B, 4 C, 5 D
  // ==========================================

  // --- INITIAL / CHILD (4) ---
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Cómo se llama el leal muñeco vaquero que protagoniza junto a Buzz Lightyear la saga animada "Toy Story"?',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Woody', isCorrect: true },
      { text: 'Rex', isCorrect: false },
      { text: 'Slinky', isCorrect: false },
      { text: 'Señor Cara de Papa', isCorrect: false },
    ],
    explanation:
      'Woody es un simpático comisario de juguete que lidera al grupo de juguetes de Andy en las películas de Disney-Pixar.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué tipo elemental de criatura es Pikachu en el universo de animación y videojuegos de Pokémon?',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Fuego', isCorrect: false },
      { text: 'Eléctrico', isCorrect: true },
      { text: 'Planta', isCorrect: false },
      { text: 'Agua', isCorrect: false },
    ],
    explanation:
      'Pikachu es un Pokémon roedor de tipo eléctrico conocido por almacenar energía en sus mejillas rojas.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Quién es el joven cachorro de león protagonista del clásico animado de Disney "El Rey León"?',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Mufasa', isCorrect: false },
      { text: 'Simba', isCorrect: true },
      { text: 'Scar', isCorrect: false },
      { text: 'Timón', isCorrect: false },
    ],
    explanation:
      'Simba debe superar el exilio y aprender el significado de la responsabilidad para recuperar su lugar legítimo en la Roca del Rey.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿En qué exitosa película de animación de Disney aparece Olaf, el muñeco de nieve que sueña con el verano?',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: null,
    options: [
      { text: 'Moana', isCorrect: false },
      { text: 'Enredados', isCorrect: false },
      { text: 'Frozen', isCorrect: true },
      { text: 'Zootopía', isCorrect: false },
    ],
    explanation:
      'Olaf es creado mágicamente por los poderes de la reina Elsa en el reino helado de Arendelle en Frozen.',
  },

  // --- INITIAL / TEEN (4) ---
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué banda británica de rock liderada por Freddie Mercury compuso el himno inmortal "Bohemian Rhapsody"?',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Queen', isCorrect: true },
      { text: 'Pink Floyd', isCorrect: false },
      { text: 'The Who', isCorrect: false },
      { text: 'The Rolling Stones', isCorrect: false },
    ],
    explanation:
      'Lanzada en 1975 dentro del álbum A Night at the Opera, Bohemian Rhapsody es una obra maestra del rock operístico.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Cómo se llama el legendario castillo que alberga el colegio de magia al que asiste Harry Potter?',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Beauxbatons', isCorrect: false },
      { text: 'Durmstrang', isCorrect: false },
      { text: 'Azkaban', isCorrect: false },
      { text: 'Hogwarts', isCorrect: true },
    ],
    explanation:
      'Hogwarts es el internado mágico británico dividido en cuatro casas: Gryffindor, Hufflepuff, Ravenclaw y Slytherin.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué célebre superhéroe arácnido de los cómics de Marvel tiene como alter ego al estudiante neoyorquino Peter Parker?',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Iron Man', isCorrect: false },
      { text: 'Capitán América', isCorrect: false },
      { text: 'Daredevil', isCorrect: false },
      { text: 'Spider-Man (El Hombre Araña)', isCorrect: true },
    ],
    explanation:
      'Creado por Stan Lee y Steve Ditko en 1962, Spider-Man aprende que un gran poder conlleva una gran responsabilidad.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué trascendental trío de rock argentino encabezado por Gustavo Cerati marcó una era dorada en toda América Latina?',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: null,
    options: [
      { text: 'Los Fabulosos Cadillacs', isCorrect: false },
      { text: 'Babasónicos', isCorrect: false },
      { text: 'Soda Stereo', isCorrect: true },
      { text: 'Divididos', isCorrect: false },
    ],
    explanation:
      'Soda Stereo (Cerati, Zeta Bosio y Charly Alberti) revolucionó la música popular en castellano entre los años 80 y 90.',
  },

  // --- INITIAL / ADULT (4) ---
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué inmortal cantor y compositor popular es considerado la máxima figura emblemática de la historia del tango argentino?',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Aníbal Troilo', isCorrect: false },
      { text: 'Enrique Santos Discépolo', isCorrect: false },
      { text: 'Julio Sosa', isCorrect: false },
      { text: 'Carlos Gardel', isCorrect: true },
    ],
    explanation:
      'Apodado "El Zorzal Criollo", Carlos Gardel internacionalizó el tango canción con grabaciones y películas inmortales.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué director estadounidense dirigió películas icónicas de la cultura popular como "Tiburón", "E.T." y "Jurassic Park"?',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'George Lucas', isCorrect: false },
      { text: 'Steven Spielberg', isCorrect: true },
      { text: 'James Cameron', isCorrect: false },
      { text: 'Ridley Scott', isCorrect: false },
    ],
    explanation:
      'Steven Spielberg es uno de los cineastas más taquilleros e influyentes de Hollywood, creador del blockbuster contemporáneo.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué banda de culto del rock nacional argentino lideraron Carlos "Indio" Solari y el guitarrista Skay Beilinson?',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Patricio Rey y sus Redonditos de Ricota', isCorrect: true },
      { text: 'Sumo', isCorrect: false },
      { text: 'La Renga', isCorrect: false },
      { text: 'Los Piojos', isCorrect: false },
    ],
    explanation:
      'Los Redondos forjaron un fenómeno cultural y multitudinario sin precedentes en la escena del rock argentino e independiente.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué distinguido agente secreto británico de ficción creado por Ian Fleming es universalmente conocido con el código 007?',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Jason Bourne', isCorrect: false },
      { text: 'Ethan Hunt', isCorrect: false },
      { text: 'James Bond', isCorrect: true },
      { text: 'George Smiley', isCorrect: false },
    ],
    explanation:
      'James Bond protagonizó novelas y más de dos docenas de películas de acción producidas por Eon Productions.',
  },

  // --- INITIAL / GENERAL (4) ---
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Cómo se llama la entrañable e ingeniosa niña de historieta creada por el dibujante mendocino Quino en 1964?',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Susanita', isCorrect: false },
      { text: 'Libertad', isCorrect: false },
      { text: 'Inodoro Pereyra', isCorrect: false },
      { text: 'Mafalda', isCorrect: true },
    ],
    explanation:
      'Mafalda es una tira cómica argentina traducida a más de treinta idiomas que reflexiona sobre la paz, la infancia y la sociedad.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué serie de dibujos animados estadounidense creada por Matt Groening transcurre en la ficticia ciudad de Springfield?',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Los Simpson', isCorrect: true },
      { text: 'Padre de Familia', isCorrect: false },
      { text: 'Futurama', isCorrect: false },
      { text: 'South Park', isCorrect: false },
    ],
    explanation:
      'Los Simpson es la comedia animada en horario central de mayor duración en la historia de la televisión mundial.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué célebre festival de música y arte celebrado en Nueva York en agosto de 1969 congregó a la vanguardia del movimiento pacifista?',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Glastonbury', isCorrect: false },
      { text: 'Festival de Woodstock', isCorrect: true },
      { text: 'Monterey Pop', isCorrect: false },
      { text: 'Isle of Wight', isCorrect: false },
    ],
    explanation:
      'Woodstock reunió a casi 500.000 jóvenes bajo la consigna de tres días de paz y música rock en Bethel, Nueva York.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué saga de películas de aventuras sobre dinosaurios clonados en una isla fue inaugurada por Steven Spielberg en 1993?',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'King Kong', isCorrect: false },
      { text: 'Godzilla', isCorrect: false },
      { text: 'Jurassic Park (Parque Jurásico)', isCorrect: true },
      { text: 'El mundo perdido', isCorrect: false },
    ],
    explanation:
      'Basada en la novela de Michael Crichton, Jurassic Park asombró al mundo con sus pioneros efectos digitales CGI.',
  },

  // ==========================================
  // MEDIUM (16 preguntas: 4 child, 4 teen, 4 adult, 4 general)
  // Target answers: 4 A, 3 B, 4 C, 5 D
  // ==========================================

  // --- MEDIUM / CHILD (4) ---
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué princesa de Disney sueña con caminar en la superficie y tiene amigos marinos como el pez Flounder y el cangrejo Sebastián?',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Ariel (La Sirenita)', isCorrect: true },
      { text: 'Jazmín', isCorrect: false },
      { text: 'Bella', isCorrect: false },
      { text: 'Cenicienta', isCorrect: false },
    ],
    explanation:
      'Ariel es la curiosa sirena protagonista del largometraje animado de Disney estrenado en 1989.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Cómo se llama el fiel caballo de carreras del vaquero Woody en la película de animación "Toy Story 2"?',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Perdigón', isCorrect: false },
      { text: 'Rocinante', isCorrect: false },
      { text: 'Spirit', isCorrect: false },
      { text: 'Tiro al Blanco (Bullseye)', isCorrect: true },
    ],
    explanation:
      'Tiro al Blanco es el leal corcel de juguete de madera que acompaña a Jessie y Woody en sus aventuras.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué simpático ogro verde de los estudios DreamWorks vive en un pantano y se casa con la princesa Fiona?',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Sulley', isCorrect: false },
      { text: 'Shrek', isCorrect: true },
      { text: 'Mike Wazowski', isCorrect: false },
      { text: 'Gru', isCorrect: false },
    ],
    explanation:
      'Shrek ganó el primer Premio Óscar a la Mejor Película de Animación otorgado por la Academia en 2002.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué superhéroe de Marvel Comics construye armaduras tecnológicas altamente avanzadas propulsadas por un reactor arc?',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: null,
    options: [
      { text: 'Thor', isCorrect: false },
      { text: 'Hulk', isCorrect: false },
      { text: 'Iron Man (Tony Stark)', isCorrect: true },
      { text: 'Ojo de Halcón', isCorrect: false },
    ],
    explanation:
      'El multimillonario e inventor Tony Stark utiliza su genio científico para transformarse en el Vengador Iron Man.',
  },

  // --- MEDIUM / TEEN (4) ---
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué estrella de cine estadounidense protagoniza desde 1996 la franquicia de acción "Misión Imposible" como Ethan Hunt?',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Keanu Reeves', isCorrect: false },
      { text: 'Brad Pitt', isCorrect: false },
      { text: 'Matt Damon', isCorrect: false },
      { text: 'Tom Cruise', isCorrect: true },
    ],
    explanation:
      'Tom Cruise es célebre por filmar personalmente espectaculares escenas de riesgo a gran altura y velocidad.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué cineasta neozelandés dirigió la multipremiada trilogía cinematográfica de "El Señor de los Anillos"?',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Peter Jackson', isCorrect: true },
      { text: 'Guillermo del Toro', isCorrect: false },
      { text: 'Christopher Nolan', isCorrect: false },
      { text: 'Tim Burton', isCorrect: false },
    ],
    explanation:
      'Peter Jackson rodó simultáneamente las tres entregas en Nueva Zelanda, obteniendo 17 premios Óscar en total.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué intrépido arqueólogo del cine creado por George Lucas y encarnado por Harrison Ford busca reliquias con sombrero y látigo?',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Alan Grant', isCorrect: false },
      { text: 'Lara Croft', isCorrect: false },
      { text: 'Nathan Drake', isCorrect: false },
      { text: 'Indiana Jones', isCorrect: true },
    ],
    explanation:
      'El doctor Henry "Indiana" Jones Jr. debutó en Los cazadores del arca perdida (1981) convirtiéndose en un ícono cinematográfico.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué popular cantante y compositora argentina de Nogoyá triunfa en la música urbana con álbumes como ".mp3"?',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: null,
    options: [
      { text: 'Tini Stoessel', isCorrect: false },
      { text: 'Lali Espósito', isCorrect: false },
      { text: 'Emilia Mernes', isCorrect: true },
      { text: 'Nicki Nicole', isCorrect: false },
    ],
    explanation:
      'Emilia Mernes consolidó un rotundo suceso con su estética nostálgica de los años 2000 y estadios agotados.',
  },

  // --- MEDIUM / ADULT (4) ---
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué genial compositor austríaco del siglo XVIII compuso obras universales como "La flauta mágica", "Don Giovanni" y su célebre "Réquiem"?',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Franz Schubert', isCorrect: false },
      { text: 'Wolfgang Amadeus Mozart', isCorrect: true },
      { text: 'Joseph Haydn', isCorrect: false },
      { text: 'Johann Sebastian Bach', isCorrect: false },
    ],
    explanation:
      'Mozart fue un niño prodigio y prolífico maestro que dominó todas las formas sinfónicas y operísticas de su época.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué inolvidable cantor de tango de voz arrastrada y expresiva fue apodado popularmente "El Polaco"?',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Edmundo Rivero', isCorrect: false },
      { text: 'Ángel Vargas', isCorrect: false },
      { text: 'Alberto Castillo', isCorrect: false },
      { text: 'Roberto Goyeneche', isCorrect: true },
    ],
    explanation:
      'Roberto Goyeneche descolló en la orquesta de Aníbal Troilo e inmortalizó versiones definitivas de tangos porteños.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué director británico de cine es apodado "el Maestro del Suspenso", autor de obras maestras como "Psicosis" y "La ventana indiscreta"?',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Alfred Hitchcock', isCorrect: true },
      { text: 'Stanley Kubrick', isCorrect: false },
      { text: 'Orson Welles', isCorrect: false },
      { text: 'Billy Wilder', isCorrect: false },
    ],
    explanation:
      'Alfred Hitchcock sentó las bases del thriller psicológico cinematográfico y del uso expresivo del montaje.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué disco de Fito Páez publicado en 1992 se erigió como el álbum discográfico más vendido de la historia del rock argentino?',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Giros', isCorrect: false },
      { text: 'Ciudad de pobres corazones', isCorrect: false },
      { text: 'El amor después del amor', isCorrect: true },
      { text: 'Circo Beat', isCorrect: false },
    ],
    explanation:
      'El amor después del amor vendió más de un millón cien mil copias reuniendo himnos como "Brillante sobre el mic" y "A rodar mi vida".',
  },

  // --- MEDIUM / GENERAL (4) ---
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué trilogía de películas de ciencia ficción de los años 80 utiliza el automóvil DeLorean para realizar viajes temporales?',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Mad Max', isCorrect: false },
      { text: 'Terminator', isCorrect: false },
      { text: 'Los Cazafantasmas', isCorrect: false },
      { text: 'Volver al Futuro (Back to the Future)', isCorrect: true },
    ],
    explanation:
      'Dirigida por Robert Zemeckis, cuenta las aventuras del joven Marty McFly y del científico Doc Brown.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué cuarteto pop sueco cosechó un descomunal éxito mundial tras triunfar en Eurovisión con "Waterloo" en 1974?',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'ABBA', isCorrect: true },
      { text: 'Roxette', isCorrect: false },
      { text: 'A-ha', isCorrect: false },
      { text: 'Boney M.', isCorrect: false },
    ],
    explanation:
      'Integrado por Agnetha, Björn, Benny y Anni-Frid, ABBA creó clásicos como "Mamma Mia" y "Dancing Queen".',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué actriz y cantante británica encarnó a la icónica niñera mágica Mary Poppins en el clásico filme de Disney de 1964?',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Audrey Hepburn', isCorrect: false },
      { text: 'Julie Andrews', isCorrect: true },
      { text: 'Elizabeth Taylor', isCorrect: false },
      { text: 'Maggie Smith', isCorrect: false },
    ],
    explanation:
      'Julie Andrews ganó el Premio Óscar a la Mejor Actriz por su interpretación estelar de Mary Poppins.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué grupo de superhéroes mutantes liderados por el Profesor Charles Xavier lucha por la convivencia pacífica entre humanos y mutantes?',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Los 4 Fantásticos', isCorrect: false },
      { text: 'Los Guardianes de la Galaxia', isCorrect: false },
      { text: 'X-Men', isCorrect: true },
      { text: 'La Liga de la Justicia', isCorrect: false },
    ],
    explanation:
      'Creados por Marvel Comics en 1963, los X-Men exploran temas de diversidad, tolerancia y superación de prejuicios.',
  },

  // ==========================================
  // ADVANCED (16 preguntas: 4 child, 4 teen, 4 adult, 4 general)
  // Target answers: 5 A, 3 B, 3 C, 5 D
  // ==========================================

  // --- ADVANCED / CHILD (4) ---
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué intrépido y joven reportero belga protagoniza historietas universales acompañado por su perro fox terrier blanco Milú?',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Tintín', isCorrect: true },
      { text: 'Astérix', isCorrect: false },
      { text: 'Spirou', isCorrect: false },
      { text: 'Lucky Luke', isCorrect: false },
    ],
    explanation:
      'Creado por el artista belga Hergé en 1929, Las aventuras de Tintín es uno de los grandes hitos de la historieta europea.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué instrumento acústico de teclado de cuerdas percutidas con macillos fue inventado en Italia por Bartolomeo Cristofori hacia 1700?',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Clavecín', isCorrect: false },
      { text: 'Órgano de tubos', isCorrect: false },
      { text: 'Acordeón', isCorrect: false },
      { text: 'Piano (pianoforte)', isCorrect: true },
    ],
    explanation:
      'El pianoforte revolucionó la música al permitir variar el volumen sonoro según la fuerza de pulsación en las teclas.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Cómo se llama el gato doméstico que intenta infructuosamente atrapar al travieso ratón Jerry en los clásicos cortos animados?',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    options: [
      { text: 'Silvestre', isCorrect: false },
      { text: 'Tom', isCorrect: true },
      { text: 'Garfield', isCorrect: false },
      { text: 'Félix', isCorrect: false },
    ],
    explanation:
      'Creados por William Hanna y Joseph Barbera en 1940, la dupla Tom y Jerry cosechó siete premios Óscar al mejor cortometraje.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué compositor barroco veneciano apodado "il Prete Rosso" compuso la célebre serie de cuatro conciertos para violín "Las cuatro estaciones"?',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: null,
    options: [
      { text: 'Claudio Monteverdi', isCorrect: false },
      { text: 'Arcangelo Corelli', isCorrect: false },
      { text: 'Antonio Vivaldi', isCorrect: true },
      { text: 'Tomaso Albinoni', isCorrect: false },
    ],
    explanation:
      'Antonio Vivaldi publicó Las cuatro estaciones en 1725, una de las cumbres de la música programática barroca.',
  },

  // --- ADVANCED / TEEN (4) ---
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué legendario guitarrista zurdo estadounidense deslumbró al mundo en los años 60 con temas como "Purple Haze"?',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Eric Clapton', isCorrect: false },
      { text: 'Jimmy Page', isCorrect: false },
      { text: 'B.B. King', isCorrect: false },
      { text: 'Jimi Hendrix', isCorrect: true },
    ],
    explanation:
      'Jimi Hendrix expandió la sonoridad de la guitarra eléctrica utilizando pedales wah-wah y retroalimentación controlada.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué director cinematográfico canadiense dirigió las taquilleras y revolucionarias películas "Titanic" (1997) y "Avatar" (2009)?',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'James Cameron', isCorrect: true },
      { text: 'Francis Ford Coppola', isCorrect: false },
      { text: 'Denis Villeneuve', isCorrect: false },
      { text: 'David Fincher', isCorrect: false },
    ],
    explanation:
      'James Cameron es un pionero en tecnología submarina y efectos visuales, situando sus filmes en la cima histórica de recaudación.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué célebre detective de ficción inglés creado por Sir Arthur Conan Doyle reside en el 221B de Baker Street en Londres?',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    options: [
      { text: 'Hércules Poirot', isCorrect: false },
      { text: 'Philip Marlowe', isCorrect: false },
      { text: 'Sam Spade', isCorrect: false },
      { text: 'Sherlock Holmes', isCorrect: true },
    ],
    explanation:
      'Sherlock Holmes resuelve intrincados crímenes mediante la observación minuciosa y el razonamiento deductivo.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué comedia dramática argentina protagonizada por Ricardo Darín, Héctor Alterio y Norma Aleandro fue nominada al Óscar en 2002?',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: null,
    options: [
      { text: 'El hijo de la novia', isCorrect: true },
      { text: 'Relatos salvajes', isCorrect: false },
      { text: 'Kamchatka', isCorrect: false },
      { text: 'Un cuento chino', isCorrect: false },
    ],
    explanation:
      'Dirigida por Juan José Campanella, relata con humor y emoción la crisis vital de un hombre que ayuda a renovar los votos matrimoniales de sus padres.',
  },

  // --- ADVANCED / ADULT (4) ---
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué legendario compositor italiano creó inolvidables bandas sonoras para películas como "Cinema Paradiso" y "La misión"?',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Nino Rota', isCorrect: false },
      { text: 'Ennio Morricone', isCorrect: true },
      { text: 'Hans Zimmer', isCorrect: false },
      { text: 'John Williams', isCorrect: false },
    ],
    explanation:
      'Ennio Morricone compuso música para más de 500 películas y recibió dos premios Óscar a lo largo de su trayectoria.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué célebre dramaturgo y poeta inglés del período isabelino escribió inmortales tragedias como "Hamlet", "Otelo" y "Macbeth"?',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: 'higher',
    options: [
      { text: 'Christopher Marlowe', isCorrect: false },
      { text: 'Ben Jonson', isCorrect: false },
      { text: 'John Milton', isCorrect: false },
      { text: 'William Shakespeare', isCorrect: true },
    ],
    explanation:
      'Conocido como el "Bardo de Avon", Shakespeare es considerado el escritor más importante de la lengua inglesa y del teatro universal.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué poeta y prócer del rock argentino apodado "El Flaco" fundó míticos grupos como Almendra, Pescado Rabioso e Invisible?',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'Luis Alberto Spinetta', isCorrect: true },
      { text: 'Litto Nebbia', isCorrect: false },
      { text: 'Miguel Abuelo', isCorrect: false },
      { text: 'Pappo Napolitano', isCorrect: false },
    ],
    explanation:
      'Luis Alberto Spinetta enriqueció la música y la poesía argentina con una obra monumental de sensibilidad e innovación armónica.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué filme dramático argentino dirigido por Luis Puenzo fue el primero de Argentina y Sudamérica en ganar el Óscar a Mejor Película Extranjera en 1986?',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: null,
    options: [
      { text: 'La tregua', isCorrect: false },
      { text: 'Camila', isCorrect: false },
      { text: 'La historia oficial', isCorrect: true },
      { text: 'Hombre mirando al sudeste', isCorrect: false },
    ],
    explanation:
      'Protagonizada por Norma Aleandro y Héctor Alterio, La historia oficial aborda la trágica búsqueda de identidad tras la dictadura militar.',
  },

  // --- ADVANCED / GENERAL (4) ---
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué multipremiada cantante británica saltó a la fama mundial con himnos vocales como "Someone Like You" y "Rolling in the Deep"?',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Amy Winehouse', isCorrect: false },
      { text: 'Dua Lipa', isCorrect: false },
      { text: 'Florence Welch', isCorrect: false },
      { text: 'Adele', isCorrect: true },
    ],
    explanation:
      'Adele es una de las artistas con mayores ventas del siglo XXI, ganadora de 16 premios Grammy y un premio Óscar.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué virtuoso guitarrista de origen mexicano integró el Salón de la Fama del Rock fusionando ritmos latinos con rock en "Oye cómo va"?',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Carlos Santana', isCorrect: true },
      { text: 'Ritchie Valens', isCorrect: false },
      { text: 'Paco de Lucía', isCorrect: false },
      { text: 'Al Di Meola', isCorrect: false },
    ],
    explanation:
      'Carlos Santana cautivó en Woodstock en 1969 y revitalizó su carrera global con el álbum Supernatural en 1999.',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué tenor italiano de renombre mundial formó junto a Plácido Domingo y José Carreras el histórico concierto de "Los Tres Tenores"?',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Andrea Bocelli', isCorrect: false },
      { text: 'Luciano Pavarotti', isCorrect: true },
      { text: 'Enrico Caruso', isCorrect: false },
      { text: 'Franco Corelli', isCorrect: false },
    ],
    explanation:
      'Pavarotti popularizó masivamente la ópera en todo el planeta con su interpretación del aria "Nessun dorma".',
  },
  {
    categorySlug: 'entretenimiento',
    prompt:
      '¿Qué célebre filme animado de Hayao Miyazaki producido por Studio Ghibli ganó el Premio Óscar a Mejor Película de Animación en 2003?',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    options: [
      { text: 'Mi vecino Totoro', isCorrect: false },
      { text: 'La princesa Mononoke', isCorrect: false },
      { text: 'El viaje de Chihiro', isCorrect: true },
      { text: 'El castillo ambulante', isCorrect: false },
    ],
    explanation:
      'El viaje de Chihiro es considerada una de las obras cumbres del cine de animación mundial y la fantasía contemporánea.',
  },
];
