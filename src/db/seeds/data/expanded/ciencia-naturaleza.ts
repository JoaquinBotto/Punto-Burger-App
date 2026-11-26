import type { SeedQuestion } from '../questions';

export const cienciaNaturalezaExpanded: SeedQuestion[] = [
  // =========================================================================
  // CIENCIA Y NATURALEZA — INITIAL (16 preguntas: 4 general, 4 child, 4 teen, 4 adult)
  // Target correctOption: 5 A, 3 B, 3 C, 5 D
  // =========================================================================
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cuál es la estrella luminosa situada en el centro de nuestro sistema planetario que brinda luz y calor a la Tierra?',
    optionA: 'Sirio',
    optionB: 'Próxima Centauri',
    optionC: 'Betelgeuse',
    optionD: 'El Sol',
    correctOption: 'D',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'El Sol es una estrella de tipo espectral G2V que concentra más del 99% de la masa total de todo el sistema solar.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué gas respirable indispensable para los animales liberan las plantas verdes a través de la fotosíntesis?',
    optionA: 'Oxígeno',
    optionB: 'Metano',
    optionC: 'Dióxido de carbono',
    optionD: 'Helio',
    correctOption: 'A',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Durante la fotosíntesis oxigénica, los vegetales absorben dióxido de carbono y agua y liberan oxígeno al medio ambiente.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿En qué estado físico de la materia se encuentra el agua cuando desciende por debajo de su punto de congelación?',
    optionA: 'Estado plasmático',
    optionB: 'Estado gaseoso',
    optionC: 'Estado coloidal',
    optionD: 'Estado sólido',
    correctOption: 'D',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Al descender de 0 °C a presión normal, las moléculas de agua forman una red cristalina que da lugar al hielo sólido.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué sentido corporal permite al ser humano percibir colores, formas y distancias captando luz visible?',
    optionA: 'Oído',
    optionB: 'Vista',
    optionC: 'Gusto',
    optionD: 'Tacto',
    correctOption: 'B',
    difficulty: 'initial',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'El ojo humano refracta la luz ambiental a través de la córnea y el cristalino hacia la retina, que transmite la señal al cerebro.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué enorme criatura marina es el animal más grande y pesado que vive en nuestro planeta?',
    optionA: 'Tiburón blanco',
    optionB: 'Orca común',
    optionC: 'Calamar gigante',
    optionD: 'Ballena azul',
    correctOption: 'D',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'La ballena azul puede alcanzar hasta 30 metros de longitud y un peso aproximado de 180 toneladas en aguas oceánicas.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué parte de la planta crece comúnmente bajo tierra para fijarla y absorber agua y minerales del suelo?',
    optionA: 'La raíz',
    optionB: 'La flor',
    optionC: 'El tallo',
    optionD: 'La hoja',
    correctOption: 'A',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'Las raíces anclan el vegetal al sustrato y poseen pelos absorbentes especializados en captar agua y nutrientes minerales.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt: '¿De qué forma nacen las crías de la inmensa mayoría de las aves en la naturaleza?',
    optionA: 'Nacimiento vivíparo',
    optionB: 'Por división celular',
    optionC: 'De huevos con cáscara',
    optionD: 'Por metamorfosis',
    correctOption: 'C',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'Las aves son animales ovíparos que depositan huevos con cáscara calcárea y los incuban hasta la eclosión de los pichones.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cómo se llama el único satélite natural rocoso que orbita alrededor de nuestro planeta Tierra?',
    optionA: 'Marte',
    optionB: 'Venus',
    optionC: 'Titán',
    optionD: 'La Luna',
    correctOption: 'D',
    difficulty: 'initial',
    ageRange: 'child',
    educationLevel: null,
    explanation:
      'La Luna completa una órbita sincrónica alrededor de la Tierra cada 27,3 días y es el objeto más brillante del cielo nocturno.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué fuerza fundamental del universo atrae los cuerpos masivos hacia el centro de la Tierra impidiendo que floten?',
    optionA: 'Gravedad',
    optionB: 'Magnetismo',
    optionC: 'Fricción estática',
    optionD: 'Tensión superficial',
    correctOption: 'A',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'La gravedad es una de las cuatro fuerzas fundamentales de la física descripta por Newton y reformulada por Einstein.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cuál es la fórmula química clásica que describe una molécula de agua formada por dos átomos de hidrógeno y uno de oxígeno?',
    optionA: 'CO2',
    optionB: 'NaCl',
    optionC: 'CH4',
    optionD: 'H2O',
    correctOption: 'D',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'El agua es un compuesto químico dipolar formado por dos átomos de hidrógeno unidos covalentemente a un átomo de oxígeno.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué conductos sanguíneos musculares transportan sangre oxigenada impulsada desde el corazón hacia los órganos?',
    optionA: 'Vénulas',
    optionB: 'Venas cavas',
    optionC: 'Arterias',
    optionD: 'Vasos linfáticos',
    correctOption: 'C',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'Las arterias poseen paredes gruesas y elásticas diseñadas para soportar la alta presión sistólica de eyección cardíaca.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué capa de gas de la estratosfera absorbe gran parte de la radiación ultravioleta perjudicial procedente del Sol?',
    optionA: 'Tropopausa',
    optionB: 'Capa de ozono',
    optionC: 'Termosfera',
    optionD: 'Ionosfera',
    correctOption: 'B',
    difficulty: 'initial',
    ageRange: 'teen',
    educationLevel: null,
    explanation:
      'El ozono estratosférico (O3) actúa como filtro natural contra la radiación ultravioleta B, protegiendo la vida en la superficie.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué macromolécula celular en doble hélice contiene el material genético de los seres vivos?',
    optionA: 'Ácido desoxirribonucleico (ADN)',
    optionB: 'Glucógeno hepático',
    optionC: 'Triglicérido',
    optionD: 'Colesterol libre',
    correctOption: 'A',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: 'higher',
    explanation:
      'El ADN porta las instrucciones hereditarias codificadas en secuencias de cuatro bases nitrogenadas (A, T, C, G).',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué planeta vecino del sistema solar recibe el nombre de planeta rojo debido al abundante óxido férrico en su superficie?',
    optionA: 'Mercurio',
    optionB: 'Venus',
    optionC: 'Júpiter',
    optionD: 'Marte',
    correctOption: 'D',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: 'higher',
    explanation:
      'Marte posee una corteza rica en minerales de hierro que al oxidarse le confieren su tonalidad rojiza característica.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cuál es el gas más abundante en la composición de la atmósfera terrestre, representando cerca del 78% del aire seco?',
    optionA: 'Nitrógeno',
    optionB: 'Oxígeno',
    optionC: 'Argón',
    optionD: 'Dióxido de carbono',
    correctOption: 'A',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: null,
    explanation:
      'El nitrógeno molecular diatómico (N2) conforma el 78,08% del volumen total de la atmósfera baja de nuestro planeta.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cómo se llama la transmisión de calor por contacto directo a través de un cuerpo sólido sin desplazamiento de materia?',
    optionA: 'Radiación infrarroja',
    optionB: 'Convección forzada',
    optionC: 'Conducción térmica',
    optionD: 'Ebullición',
    correctOption: 'C',
    difficulty: 'initial',
    ageRange: 'adult',
    educationLevel: null,
    explanation:
      'La conducción ocurre mediante colisiones moleculares y vibraciones atómicas internas que transfieren energía térmica.',
    status: 'approved',
  },

  // =========================================================================
  // CIENCIA Y NATURALEZA — MEDIUM (16 preguntas: 4 general, 4 child, 4 teen, 4 adult)
  // Target correctOption: 5 A, 3 B, 3 C, 5 D
  // =========================================================================
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué órgano glandular del abdomen produce la hormona insulina para metabolizar los azúcares?',
    optionA: 'Bazo',
    optionB: 'Vesícula biliar',
    optionC: 'Tiroides',
    optionD: 'Páncreas',
    correctOption: 'D',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Los islotes de Langerhans en el páncreas secretan insulina para facilitar que la glucosa ingrese a las células.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cómo se denomina la transición termodinámica mediante la cual un líquido pasa a estado gaseoso en su superficie?',
    optionA: 'Evaporación',
    optionB: 'Condensación',
    optionC: 'Solidificación',
    optionD: 'Sublimación inversa',
    correctOption: 'A',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'La evaporación ocurre a cualquier temperatura cuando las moléculas con suficiente energía cinética abandonan la fase líquida.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué gigante gaseoso del sistema solar destaca por su prominente sistema de anillos brillantes de hielo y roca?',
    optionA: 'Neptuno',
    optionB: 'Saturno',
    optionC: 'Urano',
    optionD: 'Júpiter',
    correctOption: 'B',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Saturno posee un complejo sistema de anillos compuestos por incontables partículas de hielo de agua y polvo en órbita ecuatorial.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué mamífero del orden Quirópteros es el único animal de su clase dotado de alas con capacidad de vuelo activo sustentado?',
    optionA: 'Ardilla voladora',
    optionB: 'Lémur volador',
    optionC: 'Murciélago',
    optionD: 'Petauro del azúcar',
    correctOption: 'C',
    difficulty: 'medium',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Los murciélagos poseen dedos extremadamente alargados cubiertos por una fina membrana de piel llamada patagio que les permite volar.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cómo se clasifica a los animales que se alimentan exclusivamente de vegetales, hojas, raíces y pastos?',
    optionA: 'Carnívoros',
    optionB: 'Omnívoros',
    optionC: 'Piscívoros',
    optionD: 'Herbívoros',
    correctOption: 'D',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'Los animales herbívoros poseen estómagos y denticiones especializadas para triturar y digerir la fibra vegetal rica en celulosa.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cómo se denomina el proceso inicial en el cual una semilla despierta y emite su primer brote verde?',
    optionA: 'Germinación',
    optionB: 'Polinización',
    optionC: 'Injerto',
    optionD: 'Foliación',
    correctOption: 'A',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'La germinación comienza con la absorción de humedad por la semilla (imbibición), reactivando el embrión para desarrollar raíces y tallo.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué órgano muscular situado en la boca contiene las papilas gustativas para saborear la comida?',
    optionA: 'Encía',
    optionB: 'Paladar blando',
    optionC: 'Úvula',
    optionD: 'La lengua',
    correctOption: 'D',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'La lengua cuenta con receptores químicos llamados papilas gustativas que reconocen dulce, salado, ácido, amargo y umami.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cómo se llama la suspensión visible de diminutas gotas de agua en el aire al nivel del suelo que dificulta la visión?',
    optionA: 'Granizo fino',
    optionB: 'Niebla',
    optionC: 'Llovizna torrencial',
    optionD: 'Ventisca helada',
    correctOption: 'B',
    difficulty: 'medium',
    ageRange: 'child',
    educationLevel: null,
    explanation:
      'La niebla es una nube baja en contacto con la superficie terrestre formada cuando el aire se enfría hasta el punto de rocío.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué células inmunitarias de la sangre combaten bacterias, virus y agentes extraños que ingresan al organismo?',
    optionA: 'Glóbulos blancos (leucocitos)',
    optionB: 'Plaquetas sanguíneas',
    optionC: 'Glóbulos rojos (eritrocitos)',
    optionD: 'Albúminas',
    correctOption: 'A',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'Los glóbulos blancos son los principales componentes celulares del sistema inmune y se originan en la médula ósea.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué escala logarítmica internacional cuantifica la magnitud de la energía liberada por un terremoto o sismo?',
    optionA: 'Escala Beaufort',
    optionB: 'Escala Mohs',
    optionC: 'Escala Fujita',
    optionD: 'Escala de Richter',
    correctOption: 'D',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'Ideada por Charles Francis Richter en 1935, mide la amplitud de las ondas registradas por sismógrafos durante un temblor.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cómo se denominan las células primitivas que carecen de membrana nuclear definida alrededor de su material genético?',
    optionA: 'Células eucariotas',
    optionB: 'Células somáticas',
    optionC: 'Células procariotas',
    optionD: 'Células vegetales',
    correctOption: 'C',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'Las bacterias y arqueas son organismos procariotas cuyo ADN circular se encuentra libre en el citoplasma en la zona nucleoide.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué metal pesado es el único elemento metálico que se mantiene en estado líquido a temperatura ambiente regular (20 °C)?',
    optionA: 'Plomo',
    optionB: 'Mercurio',
    optionC: 'Estaño',
    optionD: 'Cadmio',
    correctOption: 'B',
    difficulty: 'medium',
    ageRange: 'teen',
    educationLevel: null,
    explanation:
      'El mercurio (Hg, número atómico 80) posee un punto de fusión de -38,8 °C, por lo que permanece líquido a temperatura ambiente.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué naturalista inglés postuló la teoría de la evolución biológica por selección natural en "El origen de las especies" en 1859?',
    optionA: 'Gregor Mendel',
    optionB: 'Jean-Baptiste Lamarck',
    optionC: 'Louis Pasteur',
    optionD: 'Charles Darwin',
    correctOption: 'D',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: 'higher',
    explanation:
      'Darwin demostró que las especies evolucionan a lo largo de generaciones mediante la supervivencia y reproducción diferencial.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cómo se denomina la capa rígida y externa de la Tierra que engloba la corteza y la parte superior del manto terrestre?',
    optionA: 'Astenosfera',
    optionB: 'Litosfera',
    optionC: 'Mesosfera',
    optionD: 'Endosfera',
    correctOption: 'B',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: 'higher',
    explanation:
      'La litosfera es la capa sólida quebradiza que se halla dividida en placas tectónicas que flotan sobre la astenosfera plástica.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué principio de la mecánica clásica enuncia que si un cuerpo ejerce una fuerza sobre otro, este responde con una opuesta?',
    optionA: 'Tercera Ley de Newton',
    optionB: 'Ley de Gravitación Universal',
    optionC: 'Ley de Conservación de la Masa',
    optionD: 'Primera Ley de Kepler',
    correctOption: 'A',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: null,
    explanation:
      'La Tercera Ley de Newton o principio de acción y reacción establece que las fuerzas siempre ocurren en pares iguales y contrarios.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué ácido inorgánico fuerte producido por las células parietales gástricas participa en la digestión humana?',
    optionA: 'Ácido sulfúrico',
    optionB: 'Ácido acético',
    optionC: 'Ácido clorhídrico',
    optionD: 'Ácido nítrico',
    correctOption: 'C',
    difficulty: 'medium',
    ageRange: 'adult',
    educationLevel: null,
    explanation:
      'El ácido clorhídrico (HCl) desnaturaliza proteínas y activa el pepsinógeno en pepsina para degradar alimentos en el estómago.',
    status: 'approved',
  },

  // =========================================================================
  // CIENCIA Y NATURALEZA — ADVANCED (16 preguntas: 4 general, 4 child, 4 teen, 4 adult)
  // Target correctOption: 4 A, 3 B, 4 C, 5 D
  // =========================================================================
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué radiación electromagnética penetrante capaz de atravesar tejidos blandos fue descubierta por Wilhelm Röntgen en 1895?',
    optionA: 'Microondas',
    optionB: 'Luz visible',
    optionC: 'Ondas de radio',
    optionD: 'Rayos X',
    correctOption: 'D',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Röntgen observó fluorescencia en una pantalla cercana a un tubo de rayos catódicos, descubrimiento que le valió el primer Nobel de Física.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué división celular especializada reduce a la mitad el número de cromosomas para originar gametos reproductivos?',
    optionA: 'Meiosis',
    optionB: 'Mitosis somática',
    optionC: 'Bipartición simple',
    optionD: 'Gemación celular',
    correctOption: 'A',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'La meiosis consta de dos divisiones nucleares consecutivas y da lugar a cuatro células haploides con recombinación genética.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cuál es el elemento químico no metálico con número atómico 6 que forma la base estructural de todas las biomoléculas orgánicas?',
    optionA: 'Fósforo',
    optionB: 'Silicio',
    optionC: 'Carbono',
    optionD: 'Azufre',
    correctOption: 'C',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'La capacidad del átomo de carbono de formar cuatro enlaces covalentes estables permite construir cadenas y anillos complejos.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué astrónomo polaco renacentista formuló el modelo matemático heliocéntrico en su obra de 1543?',
    optionA: 'Johannes Kepler',
    optionB: 'Nicolás Copérnico',
    optionC: 'Galileo Galilei',
    optionD: 'Tycho Brahe',
    correctOption: 'B',
    difficulty: 'advanced',
    ageRange: 'general',
    educationLevel: null,
    explanation:
      'Copérnico planteó en "De revolutionibus orbium coelestium" que la Tierra y los planetas giran en torno a un Sol estacionario.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué insecto lepidóptero desarrolla alas coloridas tras atravesar una metamorfosis completa desde su estado de oruga?',
    optionA: 'Escarabajo pelotero',
    optionB: 'Saltamontes verde',
    optionC: 'Cigarra cantora',
    optionD: 'Mariposa',
    correctOption: 'D',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'Las mariposas atraviesan cuatro etapas vitales: huevo, larva (oruga), pupa (crisálida) y adulto con alas escamosas.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué conjunto óseo de la cabeza rodea y brinda protección directa al cerebro frente a traumatismos?',
    optionA: 'El cráneo',
    optionB: 'La clavícula',
    optionC: 'La columna lumbar',
    optionD: 'El omóplato',
    correctOption: 'A',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'El cráneo está compuesto por ocho huesos planos articulados mediante suturas inmóviles que encierran el encéfalo.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué sustancia líquida y transparente es el componente más abundante en el organismo de los seres humanos (cerca del 60%)?',
    optionA: 'Queratina pura',
    optionB: 'Glucosa disuelta',
    optionC: 'El agua',
    optionD: 'Ácido úrico',
    correctOption: 'C',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: 'primary',
    explanation:
      'El agua es el solvente universal biológico donde tienen lugar las reacciones químicas celulares y el transporte de nutrientes.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué luminoso espectáculo natural tiñe de verde y violeta el cielo nocturno en las regiones cercanas a los polos magnéticos?',
    optionA: 'Centella fugaz',
    optionB: 'Aurora polar',
    optionC: 'Espejismo ártico',
    optionD: 'Rayo globular',
    correctOption: 'B',
    difficulty: 'advanced',
    ageRange: 'child',
    educationLevel: null,
    explanation:
      'Las auroras (boreales en el norte, australes en el sur) se originan cuando partículas solares colisionan con gases de la atmósfera alta.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Cómo se denomina el enlace químico caracterizado por la compartición mutua de uno o más pares de electrones entre átomos?',
    optionA: 'Enlace iónico puro',
    optionB: 'Enlace metálico',
    optionC: 'Fuerza de Van der Waals',
    optionD: 'Enlace covalente',
    correctOption: 'D',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'El enlace covalente predomina en moléculas biológicas y une átomos no metálicos mediante pares compartidos de electrones.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué hormona sintetizada por la glándula pineal modula los ciclos de sueño y vigilia según los estímulos de luz y oscuridad?',
    optionA: 'Melatonina',
    optionB: 'Adrenalina',
    optionC: 'Insulina',
    optionD: 'Tiroxina',
    correctOption: 'A',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'La melatonina aumenta en sangre durante la oscuridad ambiental para inducir el descanso y disminuye con la luz matutina.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué pequeña constelación de cuatro estrellas brillantes sirve de guía histórica a los navegantes para localizar el Polo Sur celeste?',
    optionA: 'Orión',
    optionB: 'Osa Mayor',
    optionC: 'Cruz del Sur',
    optionD: 'Casiopea',
    correctOption: 'C',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: 'secondary',
    explanation:
      'La Cruz del Sur (Crux) es visible exclusivamente en el hemisferio austral y su eje mayor apunta hacia el polo sur celeste.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué unidad del Sistema Internacional mide la frecuencia de oscilación de una onda electromagnética o sonora en ciclos por segundo?',
    optionA: 'Joule',
    optionB: 'Pascal',
    optionC: 'Tesla',
    optionD: 'Hercio (Hertz)',
    correctOption: 'D',
    difficulty: 'advanced',
    ageRange: 'teen',
    educationLevel: null,
    explanation:
      'Nombrado en honor a Heinrich Hertz, un hercio (Hz) representa una oscilación o ciclo repetitivo completado durante un segundo.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué bacteriólogo británico descubrió el primer antibiótico natural en 1928 al estudiar colonias del hongo Penicillium notatum?',
    optionA: 'Alexander Fleming',
    optionB: 'Robert Koch',
    optionC: 'Edward Jenner',
    optionD: 'Joseph Lister',
    correctOption: 'A',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: 'higher',
    explanation:
      'Fleming observó que una sustancia producida por el hongo Penicillium inhibía el crecimiento de bacterias estafilococos.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué constante universal de la mecánica cuántica simbolizada con la letra "h" relaciona la energía de un fotón con su frecuencia?',
    optionA: 'Constante de Boltzmann',
    optionB: 'Constante de Avogadro',
    optionC: 'Constante de Planck',
    optionD: 'Constante de Rydberg',
    correctOption: 'C',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: 'higher',
    explanation:
      'Max Planck introdujo en 1900 la constante h (6,626 × 10^-34 J·s) al postular que la energía se emite en paquetes discretos llamados cuantos.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué principio de la termodinámica formula que en todo proceso natural espontáneo la entropía del universo tiende a aumentar?',
    optionA: 'Ley Cero de la Termodinámica',
    optionB: 'Segunda Ley de la Termodinámica',
    optionC: 'Principio de Pascal',
    optionD: 'Efecto Joule-Thomson',
    correctOption: 'B',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: null,
    explanation:
      'La Segunda Ley estipula la dirección irreversible de los fenómenos térmicos y la degradación progresiva de la energía útil.',
    status: 'approved',
  },
  {
    categorySlug: 'ciencia-naturaleza',
    prompt:
      '¿Qué complejo enzimático celular añade desoxirribonucleótidos complementarios durante la replicación semiconservativa del ADN?',
    optionA: 'ARN polimerasa II',
    optionB: 'ADN ligasa',
    optionC: 'Topoisomerasa I',
    optionD: 'ADN polimerasa',
    correctOption: 'D',
    difficulty: 'advanced',
    ageRange: 'adult',
    educationLevel: null,
    explanation:
      'La ADN polimerasa sintetiza nuevas cadenas de ADN en dirección 5 prima a 3 prima guiada por la cadena molde complementaria.',
    status: 'approved',
  },
];
