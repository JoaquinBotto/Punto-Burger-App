export interface SeedCategory {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  status: 'active';
}

export const seedCategories: SeedCategory[] = [
  {
    slug: 'cultura-general',
    name: 'Cultura General',
    description:
      'Preguntas variadas sobre saberes populares, curiosidades y conocimiento cotidiano.',
    sortOrder: 1,
    status: 'active',
  },
  {
    slug: 'deportes',
    name: 'Deportes',
    description: 'Fútbol, básquet, tenis, automovilismo y disciplinas olímpicas.',
    sortOrder: 2,
    status: 'active',
  },
  {
    slug: 'ciencia-naturaleza',
    name: 'Ciencia y Naturaleza',
    description: 'Astronomía, física, biología, química y el mundo natural.',
    sortOrder: 3,
    status: 'active',
  },
  {
    slug: 'geografia',
    name: 'Geografía',
    description: 'Capitales, ríos, montañas, mapas y geografía de Argentina y del mundo.',
    sortOrder: 4,
    status: 'active',
  },
  {
    slug: 'historia',
    name: 'Historia',
    description: 'Hitos, figuras clave y acontecimientos de la historia argentina y universal.',
    sortOrder: 5,
    status: 'active',
  },
  {
    slug: 'entretenimiento',
    name: 'Cine y Música',
    description: 'Películas, series, música, cultura pop y espectáculos.',
    sortOrder: 6,
    status: 'active',
  },
];
