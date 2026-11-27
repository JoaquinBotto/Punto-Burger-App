import type { SeedQuestion } from '../questions';
import { culturaGeneralExpansion002 } from './cultura-general';
import { deportesExpansion002 } from './deportes';
import { cienciaNaturalezaExpansion002 } from './ciencia-naturaleza';
import { geografiaExpansion002 } from './geografia';
import { historiaExpansion002 } from './historia';
import { entretenimientoExpansion002 } from './entretenimiento';

export const expansion002Questions: SeedQuestion[] = [
  ...culturaGeneralExpansion002,
  ...deportesExpansion002,
  ...cienciaNaturalezaExpansion002,
  ...geografiaExpansion002,
  ...historiaExpansion002,
  ...entretenimientoExpansion002,
];
