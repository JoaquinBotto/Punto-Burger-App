// ==============================================================================
// Punto Burger - Constantes Canónicas de Grupos y Participantes
// ==============================================================================

export const MIN_GROUP_NAME_LENGTH = 2;
export const MAX_GROUP_NAME_LENGTH = 30;

export const MIN_PARTICIPANTS = 1;
export const MAX_PARTICIPANTS = 8;

export const MIN_ALIAS_LENGTH = 1;
export const MAX_ALIAS_LENGTH = 24;

/**
 * Rangos etarios canónicos de la plataforma Punto Burger (PPA-006 / specs 05 § 12.1).
 * Principio de minimización: evita recolectar fecha exacta de nacimiento.
 */
export const CANONICAL_AGE_RANGES = [
  { value: 'child', label: 'Niño / Niña (hasta 12 años)' },
  { value: 'teen', label: 'Adolescente (13 a 17 años)' },
  { value: 'adult', label: 'Adulto (18+ años)' },
] as const;

export type CanonicalAgeRange = (typeof CANONICAL_AGE_RANGES)[number]['value'];

export const CANONICAL_AGE_RANGE_VALUES: [CanonicalAgeRange, ...CanonicalAgeRange[]] = [
  'child',
  'teen',
  'adult',
];

/**
 * Niveles educativos canónicos opcionales (PPA-006 / specs 05 § 12.2).
 */
export const CANONICAL_EDUCATION_LEVELS = [
  { value: 'primary', label: 'Nivel Primario' },
  { value: 'secondary', label: 'Nivel Secundario' },
  { value: 'higher', label: 'Educación Superior / Adulto' },
  { value: 'none', label: 'No aplica / Prefiero no indicar' },
] as const;

export type CanonicalEducationLevel = (typeof CANONICAL_EDUCATION_LEVELS)[number]['value'];

export const CANONICAL_EDUCATION_LEVEL_VALUES: [
  CanonicalEducationLevel,
  ...CanonicalEducationLevel[],
] = ['primary', 'secondary', 'higher', 'none'];

/**
 * Requisitos mínimos de preguntas aprobadas para que una categoría esté lista (readiness 3/4/3).
 */
export const CATEGORY_READINESS_REQUIREMENTS = {
  initial: 3,
  medium: 4,
  advanced: 3,
} as const;
