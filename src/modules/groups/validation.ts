import { z } from 'zod';
import {
  CANONICAL_AGE_RANGE_VALUES,
  CANONICAL_EDUCATION_LEVEL_VALUES,
  MAX_ALIAS_LENGTH,
  MAX_GROUP_NAME_LENGTH,
  MAX_PARTICIPANTS,
  MIN_ALIAS_LENGTH,
  MIN_GROUP_NAME_LENGTH,
  MIN_PARTICIPANTS,
} from './constants';

/**
 * Normaliza espacios consecutivos y recorta extremos.
 */
export function normalizeWhitespace(val: string): string {
  return val.trim().replace(/\s+/g, ' ');
}

export const participantInputSchema = z.object({
  alias: z
    .string()
    .transform(normalizeWhitespace)
    .refine(
      (val) => val.length >= MIN_ALIAS_LENGTH && val.length <= MAX_ALIAS_LENGTH,
      `El alias debe tener entre ${MIN_ALIAS_LENGTH} y ${MAX_ALIAS_LENGTH} caracteres.`
    ),
  ageRange: z.enum(CANONICAL_AGE_RANGE_VALUES, {
    message: 'Rango etario no válido.',
  }),
  educationLevel: z
    .enum(CANONICAL_EDUCATION_LEVEL_VALUES, {
      message: 'Nivel educativo no válido.',
    })
    .nullable()
    .optional(),
});

export const groupSetupInputSchema = z.object({
  groupName: z
    .string()
    .transform(normalizeWhitespace)
    .refine(
      (val) => val.length >= MIN_GROUP_NAME_LENGTH && val.length <= MAX_GROUP_NAME_LENGTH,
      `El nombre del equipo debe tener entre ${MIN_GROUP_NAME_LENGTH} y ${MAX_GROUP_NAME_LENGTH} caracteres.`
    ),
  participants: z
    .array(participantInputSchema)
    .min(MIN_PARTICIPANTS, `Debe registrar al menos ${MIN_PARTICIPANTS} participante.`)
    .max(MAX_PARTICIPANTS, `El grupo no puede exceder ${MAX_PARTICIPANTS} participantes.`),
  categorySlug: z.string().trim().min(1, 'Debe seleccionar una categoría para la partida.'),
});

export type GroupSetupInput = z.infer<typeof groupSetupInputSchema>;
export type ParticipantInput = z.infer<typeof participantInputSchema>;
