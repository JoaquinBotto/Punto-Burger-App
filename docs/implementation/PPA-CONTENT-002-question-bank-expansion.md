# PPA-CONTENT-002: Ampliación Mayor del Banco de Preguntas (402 Nuevas Preguntas / Total 762)

## 1. Resumen Ejecutivo

- **Ticket:** `PPA-CONTENT-002 — Ampliación del banco de preguntas`
- **Tipo de cambio:** Exclusivamente de contenido trivia (sin alteración de modelos de datos, flujos de sesión, timer, scoring, ranking ni arquitectura de competencia).
- **Banco Anterior:** **360 preguntas aprobadas** (60 preguntas por categoría: 20 iniciales, 20 intermedias, 20 avanzadas; 90 A, 90 B, 90 C, 90 D).
- **Preguntas Incorporadas:** **402 preguntas originales, verificadas y equilibradas** (67 preguntas nuevas por categoría).
- **Banco Consolidado Resultante:** **762 preguntas aprobadas** en PostgreSQL (127 preguntas por categoría; 254 iniciales, 254 intermedias, 254 avanzadas; 191 A, 191 B, 190 C, 190 D).
- **Idempotencia y No-Destructividad:** Inserción transaccional mediante `src/db/seeds/index.ts` que valida existencia previa por enunciado (`where(eq(schema.questions.prompt, q.prompt))`) sin afectar partidas activas, mesas en curso ni torneos abiertos.

---

## 2. Estructura y Distribución del Banco de Preguntas

### 2.1. Desglose de Incorporación (402 Nuevas Preguntas)

| Categoría                      | Inicial | Intermedia | Avanzada | Nuevas PPA-CONTENT-002 |
| ------------------------------ | ------: | ---------: | -------: | ---------------------: |
| Cultura General                |      23 |         22 |       22 |                     67 |
| Deportes                       |      22 |         23 |       22 |                     67 |
| Ciencia y Naturaleza           |      22 |         22 |       23 |                     67 |
| Geografía                      |      23 |         22 |       22 |                     67 |
| Historia                       |      22 |         23 |       22 |                     67 |
| Entretenimiento, Cine y Música |      22 |         22 |       23 |                     67 |
| **Total Nuevas**               | **134** |    **134** |  **134** |                **402** |

### 2.2. Desglose del Banco Final Consolidado (762 Preguntas Aprobadas)

| Categoría                      | Inicial | Intermedia | Avanzada | Total Categoría |
| ------------------------------ | ------: | ---------: | -------: | --------------: |
| Cultura General                |      43 |         42 |       42 |             127 |
| Deportes                       |      42 |         43 |       42 |             127 |
| Ciencia y Naturaleza           |      42 |         42 |       43 |             127 |
| Geografía                      |      43 |         42 |       42 |             127 |
| Historia                       |      42 |         43 |       42 |             127 |
| Entretenimiento, Cine y Música |      42 |         42 |       43 |             127 |
| **Totales Generales**          | **254** |    **254** |  **254** |         **762** |

### 2.3. Distribución de Opciones Correctas (Equilibrio Matemático)

| Opción    | Base (PPA-CONTENT-001) | Nuevas (PPA-CONTENT-002) | Total Final (762) | Porcentaje |
| --------- | ---------------------: | -----------------------: | ----------------: | ---------: |
| **A**     |                     90 |                      101 |               191 |     25.07% |
| **B**     |                     90 |                      101 |               191 |     25.07% |
| **C**     |                     90 |                      100 |               190 |     24.93% |
| **D**     |                     90 |                      100 |               190 |     24.93% |
| **Total** |                **360** |                  **402** |           **762** | **100.0%** |

---

## 3. Pautas Editoriales y Calidad de Contenido

1. **Equidad Competitiva (PPA-LAUNCH-001 Compliant):**
   - Todas las 402 preguntas nuevas utilizan `ageRange = 'general'` y `educationLevel = null`.
   - Ninguna pregunta otorga ventajas indebidas por edad ni interfiere con los algoritmos de selección equitativa de torneos.
2. **Originalidad y Cero Duplicados:**
   - Análisis heurístico cruzado (Jaccard Similarity) entre las 402 preguntas nuevas y las 360 preguntas del banco base preexistente para garantizar cero duplicados exactos y cero duplicados semánticos.
   - 4 opciones de respuesta mutuamente excluyentes, plausibles y verificadas por pregunta.
3. **Calidad Tipográfica y Estilística:**
   - Enunciados en español neutro rioplatense, redactados con signos de interrogación de apertura y cierre (`¿?`), ortografía y tildación impecables.
   - Longitud estricta: enunciados directos concisos (< 180 caracteres), explicaciones didácticas fundamentadas históricamente o científicamente (< 300 caracteres).
   - Ausencia total de temporalidad efímera (términos como "actualmente", "este año" o "vigente").
4. **Equilibrio Temático Federal y Universal:**
   - Fuerte arraigo en cultura, geografía e historia argentina y santafesina/esperancina (sin localismos oscuros), balanceado con conocimiento universal de calibre internacional.

---

## 4. Archivos Modificados e Incorporados

- `src/db/seeds/data/expansion-002/`:
  - `cultura-general.ts`: 67 preguntas aprobadas.
  - `deportes.ts`: 67 preguntas aprobadas.
  - `ciencia-naturaleza.ts`: 67 preguntas aprobadas.
  - `geografia.ts`: 67 preguntas aprobadas.
  - `historia.ts`: 67 preguntas aprobadas.
  - `entretenimiento.ts`: 67 preguntas aprobadas.
  - `index.ts`: Consolidación y exportación de `expansion002Questions` (402 preguntas).
- `src/db/seeds/data/questions.ts`:
  - Importación y concatenación de `expansion002Questions` en `seedQuestions` (762 preguntas totales).
- `src/db/seeds/seeds.test.ts`:
  - Suite de verificación de integridad y constraints para 762 preguntas, 127 por categoría, 254 por dificultad y 191/191/190/190 en opciones A/B/C/D.
- `scripts/validate-question-bank.ts`:
  - Actualización del validador de banco para soportar el target 762 con auditoría de similitud semántica y desglose por categorías.
- `scripts/verify-question-bank-production.ts`:
  - Adaptación para cálculo dinámico del tamaño total del banco.

---

## 5. Verificación Local

- **Validador del Banco:** `npx tsx scripts/validate-question-bank.ts` → 762 preguntas verificadas, 0 errores, validación exitosa.
- **Formato:** `npx prettier --check .` → 100% compliant.
- **Linter:** `npm run lint` → 0 advertencias, 0 errores.
- **Tipos TypeScript:** `npm run typecheck` → 0 errores.
- **Suite de Pruebas Automatizadas:** `npm run test:run` → 51 suites de prueba / 276 pruebas unitarias y de integración pasando al 100%.
- **Build de Producción:** `npm run build` → Compilación Next.js 16 exitosa sin errores de runtime o SSR.
