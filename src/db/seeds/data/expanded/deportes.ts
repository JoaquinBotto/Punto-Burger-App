import type { SeedQuestion } from '../questions';

export const deportesExpanded: SeedQuestion[] = [
  // =========================================================================
  // DEPORTES — INITIAL (16 preguntas: 4 general, 4 child, 4 teen, 4 adult)
  // Target correctOption: 5 A, 3 B, 3 C, 5 D
  // =========================================================================
  {
    categorySlug: 'deportes',
    prompt:
      '¿Cuántos futbolistas por equipo entran como titulares al campo en un partido de fútbol once reglamentario?',
    optionA: 'Ocho jugadores',
    optionB: 'Nueve jugadores',
    optionC: 'Diez jugadores',
    optionD: 'Once jugadores',
    correctOption: 'D',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Las reglas de la IFAB establecen que cada equipo disputa el encuentro con un máximo de 11 jugadores, incluido el arquero.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Con qué extremidades del cuerpo tienen prohibido jugar deliberadamente el balón los futbolistas de campo?',
    optionA: 'Brazos y manos',
    optionB: 'Muslos y rodillas',
    optionC: 'Cabeza y frente',
    optionD: 'Pecho y hombros',
    correctOption: 'A',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Solamente el arquero dentro de su propia área penal puede utilizar manos y brazos para disputar el balón.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Cuántos sets necesita ganar un tenista en un partido estándar al mejor de tres para obtener la victoria?',
    optionA: 'Cuatro sets',
    optionB: 'Tres sets',
    optionC: 'Un set',
    optionD: 'Dos sets',
    correctOption: 'D',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'En los torneos del circuito profesional al mejor de tres sets, el primer jugador en adjudicarse dos mangas gana el partido.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿En qué deporte olímpico de conjunto el objetivo es encestar un balón a través de un aro con red a 3,05 metros?',
    optionA: 'Handball',
    optionB: 'Básquetbol',
    optionC: 'Waterpolo',
    optionD: 'Vóley',
    correctOption: 'B',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'El básquetbol fue ideado por James Naismith en 1891 disponiendo dos cestas suspendidas en los extremos de la cancha.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué objeto esférico reglamentario patean los jugadores para disputar un partido de fútbol?',
    optionA: 'Bate de madera',
    optionB: 'Disco de caucho',
    optionC: 'Pelota de gomaespuma',
    optionD: 'Pelota de fútbol',
    correctOption: 'D',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'La pelota de fútbol es el elemento central del juego, confeccionada con paneles cosidos de cuero o materiales sintéticos.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿En qué deporte acuático los nadadores compiten en piletas braceando en estilos crol, espalda, pecho y mariposa?',
    optionA: 'Natación',
    optionB: 'Canotaje',
    optionC: 'Remo olímpico',
    optionD: 'Surf de olas',
    correctOption: 'A',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'La natación deportiva se disputa en piscinas reglamentarias donde los competidores miden su velocidad en los cuatro estilos oficiales.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué disciplina deportiva consiste en desplazarse y hacer piruetas sobre una tabla de madera con cuatro ruedas?',
    optionA: 'Patín artístico',
    optionB: 'Ciclismo de ruta',
    optionC: 'Skateboarding',
    optionD: 'Esquí alpino',
    correctOption: 'C',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'El skateboarding o monopatinaje urbano se realiza sobre una tabla cóncava de madera montada sobre ejes y ruedas de uretano.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué accesorio acolchado colocan los arqueros de fútbol sobre sus manos para amortiguar el balón?',
    optionA: 'Muñequeras de tela',
    optionB: 'Coderas de goma',
    optionC: 'Vendas de compresión',
    optionD: 'Guantes de arquero',
    correctOption: 'D',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: null,
    explanation:
      'Los guantes brindan adherencia sobre el cuero del balón y amortiguan la fuerza del impacto en las manos y dedos del arquero.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Cuántos minutos reglamentarios dura un partido de fútbol profesional dividido en dos períodos de 45 minutos?',
    optionA: '90 minutos',
    optionB: '80 minutos',
    optionC: '60 minutos',
    optionD: '100 minutos',
    correctOption: 'A',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'El tiempo reglamentario de un partido regular es de 90 minutos, distribuidos en dos mitades de 45 minutos con un entretiempo.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué deporte enfrenta a dos equipos de seis jugadores separados por una red donde la pelota no debe tocar el piso?',
    optionA: 'Bádminton doble',
    optionB: 'Tenis de mesa',
    optionC: 'Pádel por parejas',
    optionD: 'Vóleibol',
    correctOption: 'D',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'El vóleibol exige devolver el balón por encima de la red en un máximo de tres toques por equipo mediante golpes limpios.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿En qué ciudad argentina se celebraron los Juegos Olímpicos de la Juventud de Verano en el año 2018?',
    optionA: 'Córdoba',
    optionB: 'Rosario',
    optionC: 'Buenos Aires',
    optionD: 'Mendoza',
    correctOption: 'C',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'Buenos Aires 2018 albergó a miles de jóvenes atletas de todo el planeta, siendo la primera edición olímpica en suelo argentino.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué prestigiosa prueba ciclista por etapas se disputa anualmente por carreteras de Francia desde 1903?',
    optionA: 'Giro de Italia',
    optionB: 'Tour de Francia',
    optionC: 'Vuelta a España',
    optionD: 'París-Roubaix',
    correctOption: 'B',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: null,
    explanation:
      'El Tour de Francia es la más antigua e ilustre de las tres Grandes Vueltas ciclistas por etapas del calendario mundial.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué selección masculina de fútbol conquistó su tercera Copa Mundial de la FIFA en Qatar 2022?',
    optionA: 'Argentina',
    optionB: 'Francia',
    optionC: 'Brasil',
    optionD: 'Alemania',
    correctOption: 'A',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: 'higher',
    explanation:
      'Argentina derrotó a Francia en los penales tras igualar 3 a 3 en una final histórica, sumando su tercera estrella mundial.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué destacada tenista argentina conquistó el título individual de Grand Slam en el Abierto de Estados Unidos en 1990?',
    optionA: 'Paola Suárez',
    optionB: 'Norma Baylon',
    optionC: 'Gisela Dulko',
    optionD: 'Gabriela Sabatini',
    correctOption: 'D',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: 'higher',
    explanation:
      'Gabriela Sabatini venció a la alemana Steffi Graf en la final del US Open 1990 por 6-2 y 7-6 en Flushing Meadows.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Cuántos puntos suma un tiro de campo encestado desde detrás del arco exterior reglamentario en básquetbol?',
    optionA: 'Tres puntos',
    optionB: 'Dos puntos',
    optionC: 'Un punto',
    optionD: 'Cuatro puntos',
    correctOption: 'A',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: null,
    explanation:
      'Todo lanzamiento encestado desde más allá de la línea de tres puntos otorga exactamente 3 puntos en el marcador.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿En qué país de América del Sur se llevaron a cabo los Juegos Olímpicos de Río de Janeiro en el año 2016?',
    optionA: 'Chile',
    optionB: 'Colombia',
    optionC: 'Brasil',
    optionD: 'Perú',
    correctOption: 'C',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: null,
    explanation:
      'Río 2016 marcó la primera ocasión histórica en que los Juegos Olímpicos de Verano se celebraron en territorio sudamericano.',
    status: 'approved',
  },

  // =========================================================================
  // DEPORTES — MEDIUM (16 preguntas: 4 general, 4 child, 4 teen, 4 adult)
  // Target correctOption: 5 A, 3 B, 3 C, 5 D
  // =========================================================================
  {
    categorySlug: 'deportes',
    prompt:
      '¿Cuántos cuartos reglamentarios de diez minutos componen un partido oficial de básquetbol bajo normas FIBA?',
    optionA: 'Dos cuartos',
    optionB: 'Tres cuartos',
    optionC: 'Cinco cuartos',
    optionD: 'Cuatro cuartos',
    correctOption: 'D',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'El reglamento FIBA estipula cuatro cuartos de diez minutos de juego efectivo cada uno para definir el encuentro.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué cartulina de color exhibe el árbitro para amonestar a un futbolista por conducta antideportiva?',
    optionA: 'Tarjeta amarilla',
    optionB: 'Tarjeta verde',
    optionC: 'Tarjeta azul',
    optionD: 'Tarjeta blanca',
    correctOption: 'A',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'La tarjeta amarilla fue introducida en el Mundial de México 1970 para comunicar visualmente una advertencia formal.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Sobre qué superficie natural de cancha se disputa tradicionalmente el torneo de tenis de Wimbledon en Londres?',
    optionA: 'Polvo de ladrillo',
    optionB: 'Césped natural',
    optionC: 'Cemento sintético',
    optionD: 'Madera pulida',
    correctOption: 'B',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Wimbledon es el único torneo de Grand Slam que conserva la hierba natural como superficie de juego tradicional.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Cuántos puntos directos se adjudica un equipo de rugby al apoyar un try en el ingoal rival?',
    optionA: 'Tres puntos',
    optionB: 'Cuatro puntos',
    optionC: 'Cinco puntos',
    optionD: 'Siete puntos',
    correctOption: 'C',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'El try concede cinco puntos en el rugby union moderno y otorga el derecho a patear una conversión por dos puntos adicionales.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué implemento con cordaje tensado sobre un marco empuñan los jugadores de tenis para impactar la pelota?',
    optionA: 'Palo curvo',
    optionB: 'Paleta rígida',
    optionC: 'Guante de cuero',
    optionD: 'Raqueta de tenis',
    correctOption: 'D',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'La raqueta cuenta con un cordaje elástico entrelazado que transfiere energía e impulso para dirigir la pelota con precisión.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Cómo se llama al deportista que conduce automóviles de carrera a alta velocidad en circuitos de competición?',
    optionA: 'Piloto',
    optionB: 'Navegante',
    optionC: 'Mecánico',
    optionD: 'Comisario',
    correctOption: 'A',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'El piloto es el deportista profesional capacitado para dominar vehículos de competición al límite mecánico en pistas y circuitos.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Cómo se denomina la estructura rectangular delimitada por dos postes verticales y un travesaño en el fútbol?',
    optionA: 'Círculo central',
    optionB: 'Área chica',
    optionC: 'Banderín de córner',
    optionD: 'Arco o portería',
    correctOption: 'D',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'El arco reglamentario mide 7,32 metros de ancho por 2,44 metros de alto y está cubierto por una red para contener el balón.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué preciada medalla metálica recibe el deportista que se consagra ganador del primer puesto en los Juegos Olímpicos?',
    optionA: 'Medalla de plata',
    optionB: 'Medalla de oro',
    optionC: 'Medalla de bronce',
    optionD: 'Medalla de cobre',
    correctOption: 'B',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: null,
    explanation:
      'En los Juegos Olímpicos, el campeón de cada prueba recibe la medalla de oro, el segundo la de plata y el tercero la de bronce.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué velocista de Jamaica batió los récords mundiales de 100 y 200 metros llanos en el Mundial de Atletismo de Berlín 2009?',
    optionA: 'Usain Bolt',
    optionB: 'Carl Lewis',
    optionC: 'Asafa Powell',
    optionD: 'Justin Gatlin',
    correctOption: 'A',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'Usain Bolt cronometró 9,58 segundos en los 100 metros y 19,19 segundos en los 200 metros, marcas que perduran vigentes.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Cuántos jugadores titulares por equipo ingresan al campo en un partido de rugby union tradicional?',
    optionA: 'Once jugadores',
    optionB: 'Trece jugadores',
    optionC: 'Catorce jugadores',
    optionD: 'Quince jugadores',
    correctOption: 'D',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'Un equipo de rugby union cuenta con 15 titulares distribuidos en 8 delanteros (forwards) y 7 tres cuartos (backs).',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué histórico seleccionado argentino de básquetbol conquistó la Medalla de Oro en los Juegos Olímpicos de Atenas 2004?',
    optionA: 'Los Pumas',
    optionB: 'Los Gladiadores',
    optionC: 'La Generación Dorada',
    optionD: 'Las Leonas',
    correctOption: 'C',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'Liderada por Emanuel Ginóbili y dirigida por Rubén Magnano, la Generación Dorada derrotó a Estados Unidos e Italia por el oro.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué reconocido apodo identifica a la Selección Argentina femenina de hockey sobre césped en competiciones mundiales?',
    optionA: 'Las Panteras',
    optionB: 'Las Leonas',
    optionC: 'Las Águilas',
    optionD: 'Las Pumas',
    correctOption: 'B',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: null,
    explanation:
      'El apodo de Las Leonas surgió en los Juegos Olímpicos de Sídney 2000, simbolizando la garra y espíritu combativo del equipo.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué piloto automovilístico santafesino logró doce triunfos en Grandes Premios de Fórmula 1 y fue subcampeón en 1981?',
    optionA: 'José Froilán González',
    optionB: 'Gastón Mazzacane',
    optionC: 'Esteban Tuero',
    optionD: 'Carlos Alberto Reutemann',
    correctOption: 'D',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: 'higher',
    explanation:
      'Carlos Reutemann compitió para Brabham, Ferrari, Lotus y Williams, quedando a un solo punto del campeonato del mundo en 1981.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué legendario tenista suizo sumó veinte coronas individuales de Grand Slam a lo largo de su carrera?',
    optionA: 'Rafael Nadal',
    optionB: 'Roger Federer',
    optionC: 'Novak Djokovic',
    optionD: 'Pete Sampras',
    correctOption: 'B',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: 'higher',
    explanation:
      'Roger Federer dominó el tenis mundial durante dos décadas con una técnica refinada, logrando 8 títulos en la hierba de Wimbledon.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué selección nacional sudamericana se consagró campeona en la primera Copa Mundial de Fútbol disputada en 1930?',
    optionA: 'Uruguay',
    optionB: 'Argentina',
    optionC: 'Brasil',
    optionD: 'Chile',
    correctOption: 'A',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: null,
    explanation:
      'Uruguay venció a Argentina por 4 a 2 en el estadio Centenario de Montevideo en la final del primer torneo mundial de la FIFA.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Cuál es la distancia oficial estandarizada que se recorre en una prueba atlética de maratón en ruta?',
    optionA: '40 kilómetros exactos',
    optionB: '41,500 kilómetros',
    optionC: '42,195 kilómetros',
    optionD: '45 kilómetros exactos',
    correctOption: 'C',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: null,
    explanation:
      'La distancia de 42,195 km se fijó formalmente en los Juegos Olímpicos de Londres 1908 entre el castillo de Windsor y el estadio.',
    status: 'approved',
  },

  // =========================================================================
  // DEPORTES — ADVANCED (16 preguntas: 4 general, 4 child, 4 teen, 4 adult)
  // Target correctOption: 4 A, 3 B, 4 C, 5 D
  // =========================================================================
  {
    categorySlug: 'deportes',
    prompt:
      '¿Cuántos campeonatos mundiales de pilotos de Fórmula 1 conquistó el alemán Michael Schumacher?',
    optionA: 'Cinco títulos',
    optionB: 'Seis títulos',
    optionC: 'Cuatro títulos',
    optionD: 'Siete títulos',
    correctOption: 'D',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Michael Schumacher ganó dos títulos con Benetton (1994, 1995) y cinco consecutivos con la escudería Ferrari (2000-2004).',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué tenista argentino apodado "El Gran Willy" popularizó el tiro defensivo de espaldas impactando entre las piernas?',
    optionA: 'Guillermo Vilas',
    optionB: 'José Luis Clerc',
    optionC: 'David Nalbandian',
    optionD: 'Guillermo Coria',
    correctOption: 'A',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Guillermo Vilas bautizó a la jugada como "la Gran Willy" tras idearla inspirado en un anuncio publicitario de polo en los años 70.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿En qué mítico estadio porteño disputó la Selección Argentina la final donde alzó su primera Copa del Mundo en 1978?',
    optionA: 'La Bombonera',
    optionB: 'José Amalfitani',
    optionC: 'Estadio Monumental',
    optionD: 'Tomás Adolfo Ducó',
    correctOption: 'C',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'El Estadio Monumental de River Plate fue sede de la final de 1978, donde Argentina superó a Holanda por 3 a 1 en tiempo suplementario.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿En qué nación europea se organizaron los primeros Juegos Olímpicos de la era moderna promovidos por Coubertin en 1896?',
    optionA: 'Francia',
    optionB: 'Grecia',
    optionC: 'Italia',
    optionD: 'Reino Unido',
    correctOption: 'B',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Atenas 1896 recuperó la tradición del olimpismo antiguo en el renovado estadio Panathinaikó con atletas de catorce países.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué deporte invernal de descenso montañoso consiste en deslizarse velozmente sobre la nieve fijando dos tablas a las botas?',
    optionA: 'Trineo de hielo',
    optionB: 'Patinaje artístico',
    optionC: 'Curling sobre pista',
    optionD: 'Esquí alpino',
    correctOption: 'D',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'El esquí alpino requiere equilibrio y fuerza para sortear curvas y pendientes nevadas sobre tablas alargadas con bastones.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué deporte tradicional de combate individual enfrenta a dos púgiles con guantes en asaltos delimitados dentro de un ring?',
    optionA: 'Boxeo',
    optionB: 'Karate',
    optionC: 'Judo',
    optionD: 'Esgrima',
    correctOption: 'A',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'El boxeo está regulado por las reglas del Marqués de Queensberry que establecen el uso de guantes y descansos de un minuto entre rounds.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Cuánto tiempo de juego suplementario añade el reglamento de básquetbol FIBA cuando un partido finaliza empatado?',
    optionA: 'Diez minutos',
    optionB: 'Tres minutos',
    optionC: 'Cinco minutos',
    optionD: 'Siete minutos',
    correctOption: 'C',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'En caso de empate al cabo del tiempo regular, se disputan prórrogas sucesivas de cinco minutos hasta quebrar la paridad.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿De qué color y diseño es la bandera de señalamiento que ondea para consagrar el final de una carrera automovilística?',
    optionA: 'Bandera amarilla lisa',
    optionB: 'Bandera a cuadros blancos y negros',
    optionC: 'Bandera roja de peligro',
    optionD: 'Bandera verde de partida',
    correctOption: 'B',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: null,
    explanation:
      'La bandera a cuadros en la línea de llegada indica formalmente la conclusión de la competencia ante el paso del auto ganador.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué histórico club de fútbol de la ciudad de Esperanza fue fundado en 1917 y posee casaca a rayas blancas y negras?',
    optionA: 'Unión de Esperanza',
    optionB: 'San Lorenzo de Esperanza',
    optionC: 'Bartolomé Mitre',
    optionD: 'Sportivo del Norte',
    correctOption: 'D',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'El Club Atlético Sportivo del Norte es una de las instituciones decanas de Esperanza y protagonista histórico de la Liga Esperancina.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué célebre boxeador santafesino de peso mediano defendió exitosamente su corona del mundo en catorce oportunidades consecutivas?',
    optionA: 'Carlos Monzón',
    optionB: 'Nicolino Locche',
    optionC: 'Horacio Accavallo',
    optionD: 'Víctor Galíndez',
    correctOption: 'A',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'Carlos Monzón se consagró campeón mundial en Roma en 1970 ante Nino Benvenuti y reinó invicto en sus defensas hasta su retiro en 1977.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿En qué Juego Olímpico la Selección Argentina masculina de fútbol obtuvo la primera Medalla de Oro de su historia con Bielsa?',
    optionA: 'Pekín 2008',
    optionB: 'Atlanta 1996',
    optionC: 'Atenas 2004',
    optionD: 'Londres 2012',
    correctOption: 'C',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'En Atenas 2004 Argentina ganó el oro olímpico en fútbol de forma invicta y sin conceder un solo gol en todo el certamen.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué prestigioso torneo sobre polvo de ladrillo de París constituye el segundo certamen anual de Grand Slam en tenis?',
    optionA: 'Abierto de Australia',
    optionB: 'Torneo de Roma',
    optionC: 'Copa Davis',
    optionD: 'Roland Garros',
    correctOption: 'D',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: null,
    explanation:
      'El torneo de Roland Garros se disputa desde 1928 en el complejo del Bosque de Bolonia y lleva el nombre del pionero aviador francés.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué fondista argentino se coronó campeón olímpico de maratón en los Juegos de Los Ángeles 1932 con solo 20 años?',
    optionA: 'Juan Carlos Zabala',
    optionB: 'Delfo Cabrera',
    optionC: 'Reinaldo Gorno',
    optionD: 'Osvaldo Suárez',
    correctOption: 'A',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: 'higher',
    explanation:
      'Apodado "el Ñandú Criollo", Juan Carlos Zabala venció en la maratón de 1932 marcando un nuevo récord olímpico en el Memorial Coliseum.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué legendario futbolista brasileño es el único en conquistar tres Copas del Mundo de la FIFA como jugador (1958, 1962, 1970)?',
    optionA: 'Garrincha',
    optionB: 'Zico',
    optionC: 'Pelé',
    optionD: 'Ronaldo Nazário',
    correctOption: 'C',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: 'higher',
    explanation:
      'Edson Arantes do Nascimento "Pelé" debutó como campeón a los 17 años en Suecia 1958 y completó su tricampeonato en México 1970.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿En qué legendario circuito automovilístico francés se corre anualmente la prueba de resistencia de las 24 Horas de Le Mans?',
    optionA: 'Circuito de Mónaco',
    optionB: 'Circuito de la Sarthe',
    optionC: 'Circuito de Spa-Francorchamps',
    optionD: 'Nürburgring Nordschleife',
    correctOption: 'B',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: null,
    explanation:
      'El Circuito de la Sarthe combina pistas de carreras cerradas con tramos de carreteras públicas abiertas durante el resto del año.',
    status: 'approved',
  },
  {
    categorySlug: 'deportes',
    prompt:
      '¿Qué franquicia de la NBA comandada por Michael Jordan y Phil Jackson obtuvo seis anillos de campeonato en los años noventa?',
    optionA: 'Los Angeles Lakers',
    optionB: 'Boston Celtics',
    optionC: 'San Antonio Spurs',
    optionD: 'Chicago Bulls',
    correctOption: 'D',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: null,
    explanation:
      'Los Chicago Bulls lograron dos tricampeonatos consecutivos (1991-1993 y 1996-1998) con Jordan como figura dominante de la liga.',
    status: 'approved',
  },
];
