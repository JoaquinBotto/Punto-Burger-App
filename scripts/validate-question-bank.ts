import { seedQuestions, type SeedQuestion } from '../src/db/seeds/data/questions';

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: Record<string, Record<string, Record<string, number>>>;
  totalQuestions: number;
  optionDistribution: Record<string, number>;
}

const TEMPORAL_WORDS = [
  'actualmente',
  'hoy en día',
  'hoy',
  'este año',
  'último campeón',
  'vigente',
  'en este momento',
  'al día de hoy',
  'campeón actual',
  'actual presidente',
  'actual intendente',
  'actual gobernador',
];

const VALID_CATEGORIES = [
  'cultura-general',
  'deportes',
  'ciencia-naturaleza',
  'geografia',
  'historia',
  'entretenimiento',
];

const VALID_DIFFICULTIES = ['initial', 'medium', 'advanced'] as const;
const VALID_AGE_RANGES = ['general', 'child', 'teen', 'adult'] as const;
const VALID_EDUCATION_LEVELS = ['primary', 'secondary', 'higher', null] as const;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:()"\-_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getWordTokens(text: string): Set<string> {
  const norm = normalizeText(text);
  const words = norm.split(' ').filter((w) => w.length > 2);
  return new Set(words);
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function validateQuestionBank(
  questions: SeedQuestion[] = seedQuestions,
  expectedTotal = 762
): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalizedPrompts = new Map<string, SeedQuestion>();
  const tokenizedPrompts: Array<{ prompt: string; tokens: Set<string>; question: SeedQuestion }> =
    [];

  const summary: Record<string, Record<string, Record<string, number>>> = {};
  const optionDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

  for (const cat of VALID_CATEGORIES) {
    summary[cat] = {
      initial: { general: 0, child: 0, teen: 0, adult: 0 },
      medium: { general: 0, child: 0, teen: 0, adult: 0 },
      advanced: { general: 0, child: 0, teen: 0, adult: 0 },
    };
  }

  // 1. Validar cada pregunta individualmente
  questions.forEach((q, index) => {
    const qNum = index + 1;
    const prefix = `[Pregunta #${qNum} - ${q.categorySlug}]`;

    // Categoría
    if (!VALID_CATEGORIES.includes(q.categorySlug)) {
      errors.push(`${prefix} Categoría inválida: "${q.categorySlug}".`);
    }

    // Dificultad
    if (!VALID_DIFFICULTIES.includes(q.difficulty as (typeof VALID_DIFFICULTIES)[number])) {
      errors.push(`${prefix} Dificultad inválida: "${q.difficulty}".`);
    }

    // Age Range
    if (!VALID_AGE_RANGES.includes(q.ageRange as (typeof VALID_AGE_RANGES)[number])) {
      errors.push(`${prefix} Rango de edad inválido: "${q.ageRange}".`);
    }

    // Education Level
    if (
      !VALID_EDUCATION_LEVELS.includes(q.educationLevel as (typeof VALID_EDUCATION_LEVELS)[number])
    ) {
      errors.push(`${prefix} Nivel educativo inválido: "${q.educationLevel}".`);
    }

    // Education Level según Age Range
    if (q.ageRange === 'general' && q.educationLevel !== null) {
      errors.push(`${prefix} Pregunta con ageRange 'general' debe tener educationLevel = null.`);
    } else if (
      q.ageRange === 'child' &&
      q.educationLevel !== null &&
      q.educationLevel !== 'primary'
    ) {
      errors.push(
        `${prefix} Pregunta child solo puede tener educationLevel 'primary' o null (tiene: ${q.educationLevel}).`
      );
    } else if (
      q.ageRange === 'teen' &&
      q.educationLevel !== null &&
      q.educationLevel !== 'secondary'
    ) {
      errors.push(
        `${prefix} Pregunta teen solo puede tener educationLevel 'secondary' o null (tiene: ${q.educationLevel}).`
      );
    } else if (
      q.ageRange === 'adult' &&
      q.educationLevel !== null &&
      q.educationLevel !== 'higher'
    ) {
      errors.push(
        `${prefix} Pregunta adult solo puede tener educationLevel 'higher' o null (tiene: ${q.educationLevel}).`
      );
    }

    // Status
    if (q.status !== 'approved') {
      errors.push(`${prefix} Estado debe ser 'approved', se encontró: "${q.status}".`);
    }

    // Prompt
    if (!q.prompt || q.prompt.trim() === '') {
      errors.push(`${prefix} El enunciado (prompt) no puede estar vacío.`);
    } else {
      if (q.prompt.length > 200) {
        errors.push(`${prefix} Enunciado demasiado largo (${q.prompt.length} caracteres > 200).`);
      } else if (q.prompt.length > 180) {
        warnings.push(`${prefix} Enunciado algo extenso (${q.prompt.length} caracteres > 180).`);
      }

      // No HTML ni Markdown no estándar
      if (/<[a-z][\s\S]*>/i.test(q.prompt)) {
        errors.push(`${prefix} El enunciado contiene etiquetas HTML.`);
      }
      if (/`|\[.*\]\(.*\)/.test(q.prompt)) {
        errors.push(`${prefix} El enunciado contiene sintaxis Markdown inesperada.`);
      }

      // Detección de temporalidad
      const normPrompt = normalizeText(q.prompt);
      for (const tw of TEMPORAL_WORDS) {
        if (normPrompt.includes(tw)) {
          errors.push(
            `${prefix} Contiene término temporal potencialmente inestable: "${tw}" en "${q.prompt}".`
          );
        }
      }

      // Duplicados exactos / normalizados
      if (normalizedPrompts.has(normPrompt)) {
        const prev = normalizedPrompts.get(normPrompt)!;
        errors.push(
          `${prefix} Enunciado duplicado de pregunta previa (${prev.categorySlug}): "${q.prompt}".`
        );
      } else {
        normalizedPrompts.set(normPrompt, q);
      }

      // Tokenizar para análisis de similitud semántica
      const tokens = getWordTokens(q.prompt);
      tokenizedPrompts.push({ prompt: q.prompt, tokens, question: q });
    }

    // Opciones
    const options = [q.optionA, q.optionB, q.optionC, q.optionD];
    const optionLetters = ['A', 'B', 'C', 'D'];

    options.forEach((opt, optIdx) => {
      const letter = optionLetters[optIdx];
      if (!opt || opt.trim() === '') {
        errors.push(`${prefix} La opción ${letter} está vacía.`);
      } else {
        if (opt.length > 65) {
          warnings.push(`${prefix} Opción ${letter} extensa (${opt.length} caracteres).`);
        }
        if (/<[a-z][\s\S]*>/i.test(opt)) {
          errors.push(`${prefix} La opción ${letter} contiene etiquetas HTML.`);
        }
      }
    });

    // Opciones únicas (no repetidas)
    const normalizedOptions = options.map((opt) => normalizeText(opt));
    const uniqueOptions = new Set(normalizedOptions);
    if (uniqueOptions.size < 4) {
      errors.push(`${prefix} Contiene opciones duplicadas o idénticas.`);
    }

    // Correct Option
    const opt = q.correctOption;
    if (!['A', 'B', 'C', 'D'].includes(opt)) {
      errors.push(`${prefix} correctOption inválida: "${opt}".`);
    } else {
      optionDistribution[opt] = (optionDistribution[opt] ?? 0) + 1;
    }

    // Explanation
    if (!q.explanation || q.explanation.trim() === '') {
      errors.push(`${prefix} La explicación (explanation) no puede estar vacía.`);
    } else {
      if (q.explanation.length > 320) {
        warnings.push(`${prefix} Explicación algo extensa (${q.explanation.length} caracteres).`);
      }
      if (/<[a-z][\s\S]*>/i.test(q.explanation)) {
        errors.push(`${prefix} La explicación contiene etiquetas HTML.`);
      }
    }

    // Contabilizar en sumario
    const catSum = summary[q.categorySlug];
    const diffSum = catSum ? catSum[q.difficulty] : undefined;
    if (diffSum && diffSum[q.ageRange] !== undefined) {
      diffSum[q.ageRange] = (diffSum[q.ageRange] ?? 0) + 1;
    }
  });

  // 2. Detección heurística de similitud semántica (Jaccard > 0.75 en prompts)
  for (let i = 0; i < tokenizedPrompts.length; i++) {
    for (let j = i + 1; j < tokenizedPrompts.length; j++) {
      const p1 = tokenizedPrompts[i];
      const p2 = tokenizedPrompts[j];
      if (!p1 || !p2) continue;
      const sim = jaccardSimilarity(p1.tokens, p2.tokens);
      if (sim >= 0.8) {
        errors.push(
          `Posible duplicado semántico (similitud ${(sim * 100).toFixed(0)}%): "${p1.prompt}" vs "${p2.prompt}".`
        );
      } else if (sim >= 0.65) {
        warnings.push(
          `Prompts con alta coincidencia de términos (${(sim * 100).toFixed(0)}%): "${p1.prompt}" vs "${p2.prompt}".`
        );
      }
    }
  }

  // 3. Validar totales esperados
  if (questions.length !== expectedTotal) {
    errors.push(`Total de preguntas es ${questions.length}, pero se esperaban ${expectedTotal}.`);
  }

  // 4. Validar conteos por categoría y dificultad
  const EXPECTED_DIFFICULTY_762: Record<
    string,
    { initial: number; medium: number; advanced: number }
  > = {
    'cultura-general': { initial: 43, medium: 42, advanced: 42 },
    deportes: { initial: 42, medium: 43, advanced: 42 },
    'ciencia-naturaleza': { initial: 42, medium: 42, advanced: 43 },
    geografia: { initial: 43, medium: 42, advanced: 42 },
    historia: { initial: 42, medium: 43, advanced: 42 },
    entretenimiento: { initial: 42, medium: 42, advanced: 43 },
  };

  for (const cat of VALID_CATEGORIES) {
    let catTotal = 0;
    for (const diff of VALID_DIFFICULTIES) {
      const counts = summary[cat]?.[diff] ?? { general: 0, child: 0, teen: 0, adult: 0 };
      const genCount = counts.general ?? 0;
      const childCount = counts.child ?? 0;
      const teenCount = counts.teen ?? 0;
      const adultCount = counts.adult ?? 0;
      const diffTotal = genCount + childCount + teenCount + adultCount;
      catTotal += diffTotal;

      if (expectedTotal === 360) {
        if (diffTotal !== 20) {
          errors.push(
            `[${cat} - ${diff}] Se esperaban exactamente 20 preguntas (encontradas: ${diffTotal}).`
          );
        }
        if (genCount !== 8) {
          errors.push(
            `[${cat} - ${diff}] Se esperaban 8 preguntas general (encontradas: ${genCount}).`
          );
        }
        if (childCount !== 4) {
          errors.push(
            `[${cat} - ${diff}] Se esperaban 4 preguntas child (encontradas: ${childCount}).`
          );
        }
        if (teenCount !== 4) {
          errors.push(
            `[${cat} - ${diff}] Se esperaban 4 preguntas teen (encontradas: ${teenCount}).`
          );
        }
        if (adultCount !== 4) {
          errors.push(
            `[${cat} - ${diff}] Se esperaban 4 preguntas adult (encontradas: ${adultCount}).`
          );
        }
      } else if (expectedTotal === 762) {
        const expectedDiff = EXPECTED_DIFFICULTY_762[cat]?.[diff];
        if (expectedDiff !== undefined && diffTotal !== expectedDiff) {
          errors.push(
            `[${cat} - ${diff}] Se esperaban exactamente ${expectedDiff} preguntas (encontradas: ${diffTotal}).`
          );
        }
      }
    }

    if (expectedTotal === 360 && catTotal !== 60) {
      errors.push(`[${cat}] Se esperaban 60 preguntas en la categoría (encontradas: ${catTotal}).`);
    } else if (expectedTotal === 762 && catTotal !== 127) {
      errors.push(
        `[${cat}] Se esperaban 127 preguntas en la categoría (encontradas: ${catTotal}).`
      );
    }
  }

  // 5. Validar distribución de correctOption
  if (expectedTotal === 360 && questions.length === 360) {
    for (const opt of ['A', 'B', 'C', 'D']) {
      const count = optionDistribution[opt] ?? 0;
      const pct = (count / questions.length) * 100;
      if (pct < 20 || pct > 30) {
        warnings.push(
          `Distribución de opción ${opt} (${count}/${questions.length} = ${pct.toFixed(1)}%) se desvía del target de 25%.`
        );
      }
    }
  } else if (expectedTotal === 762 && questions.length === 762) {
    if (optionDistribution.A !== 191) {
      errors.push(`Distribución de opción A esperada: 191, encontrada: ${optionDistribution.A}`);
    }
    if (optionDistribution.B !== 191) {
      errors.push(`Distribución de opción B esperada: 191, encontrada: ${optionDistribution.B}`);
    }
    if (optionDistribution.C !== 190) {
      errors.push(`Distribución de opción C esperada: 190, encontrada: ${optionDistribution.C}`);
    }
    if (optionDistribution.D !== 190) {
      errors.push(`Distribución de opción D esperada: 190, encontrada: ${optionDistribution.D}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary,
    totalQuestions: questions.length,
    optionDistribution,
  };
}

export function printValidationReport(report: ValidationReport) {
  console.log('===========================================================');
  console.log('=== REPORTE DE VALIDACIÓN DEL BANCO DE PREGUNTAS        ===');
  console.log('===========================================================\n');

  console.log('--- Resumen por Categoría, Dificultad y Edad ---');
  for (const [cat, diffs] of Object.entries(report.summary)) {
    console.log(`\n• Categoría: ${cat}`);
    let catTotal = 0;
    for (const [diff, ages] of Object.entries(diffs)) {
      const diffTotal = Object.values(ages).reduce((a, b) => a + b, 0);
      catTotal += diffTotal;
      console.log(
        `    ${diff.padEnd(8)} (total ${String(diffTotal).padStart(2)}): general ${ages.general}, child ${ages.child}, teen ${ages.teen}, adult ${ages.adult}`
      );
    }
    console.log(`    Total categoría: ${catTotal}`);
  }

  console.log('\n--- Total General de Preguntas ---');
  console.log(`TOTAL: ${report.totalQuestions}`);

  console.log('\n--- Distribución de Opciones Correctas ---');
  for (const [opt, count] of Object.entries(report.optionDistribution)) {
    const pct =
      report.totalQuestions > 0 ? ((count / report.totalQuestions) * 100).toFixed(1) : '0';
    console.log(`  Opción ${opt}: ${String(count).padStart(3)} (${pct}%)`);
  }

  if (report.warnings.length > 0) {
    console.log(`\n⚠️  ADVERTENCIAS (${report.warnings.length}):`);
    report.warnings.slice(0, 15).forEach((w) => console.log(`  - ${w}`));
    if (report.warnings.length > 15) {
      console.log(`  ... y ${report.warnings.length - 15} advertencias adicionales.`);
    }
  }

  if (report.errors.length > 0) {
    console.log(`\n❌ ERRORES DE VALIDACIÓN (${report.errors.length}):`);
    report.errors.forEach((e) => console.log(`  • ${e}`));
    console.log('\n>>> VALIDACIÓN FALLIDA <<<');
  } else {
    console.log('\n✅ VALIDACIÓN EXITOSA: Todas las reglas se cumplen a la perfección.');
  }
}

if (process.argv[1]?.includes('validate-question-bank.ts')) {
  // Si estamos validando el estado actual o el target 762:
  const expectedTotal = process.argv.includes('--current') ? seedQuestions.length : 762;
  const report = validateQuestionBank(seedQuestions, expectedTotal);
  printValidationReport(report);

  if (!report.isValid) {
    process.exit(1);
  }
}
