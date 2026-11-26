# PPA-LAUNCH-001 — Hotfix de Equidad para Competencia entre Mesas

## 1. Resumen Ejecutivo

- **Ticket:** `PPA-LAUNCH-001`
- **Estado:** `CLOSED`
- **Fecha de Aprobación:** 2026-11-26
- **Ambiente:** Producción (`https://app.puntoburger.com.ar`)
- **Tipo de Intervención:** Hotfix Funcional y Competitivo (Gameplay & Equidad)
- **Riesgo Operativo:** Alto (El sistema opera en producción con usuarios reales en el local)

---

## 2. Diagnóstico y Problema Resuelto

### 2.1 El Conflicto de Equidad

Antes de este hotfix, el motor de selección de preguntas (`src/modules/trivia/question-selection.ts`) y el planificador de turnos (`src/modules/trivia/assignment-plan.ts`) utilizaban `ageRange` y `educationLevel` declarados por los usuarios al registrar los participantes de la mesa para modular la partida:

1. `scoreCompatibility(...)` asignaba mayor ponderación a preguntas con etiquetas etarias afines y descartaba preguntas de otros rangos etarios.
2. `buildAssignmentPlan(...)` bifurcaba la distribución de turnos entre grupos "homogéneos" y grupos "mixtos" según las edades declaradas.

En el marco de la competencia diaria oficial entre mesas físicas (**PPA-RANK-001**), esta lógica representaba una vulnerabilidad competitiva crítica:

- Una mesa compuesta por adultos podía declarar perfiles infantiles para recibir preguntas etiquetadas como `child`, obteniendo una ventaja desleal sobre las demás mesas.
- La experiencia no era equitativa: mesas en una misma categoría competían con universos de preguntas dispares y subconjuntos restringidos del banco.

### 2.2 Principio de Diseño

> **Regla de Equidad Competitiva:**
> La edad y el nivel educativo declarados por el usuario **no intervienen ni influyen bajo ningún concepto** en la selección de preguntas ni en el reparto de turnos. Todas las mesas compiten exactamente con el mismo universo de preguntas bajo las mismas reglas de dificultad inmutable (3 initial / 4 medium / 3 advanced).

---

## 3. Arquitectura e Implementación Técnica

### 3.1 Desactivación en Selección de Preguntas (`src/modules/trivia/question-selection.ts`)

- **Eliminación Total:** Se removió la función interna `scoreCompatibility(...)`, el cálculo de puntuaciones `maxScore` y el filtrado por percentil `topTier`.
- **Pool Unificado por Dificultad:** La selección de preguntas extrae candidatas exclusivamente evaluando:
  - `status === 'approved'`
  - `categoryId === category.id`
  - `difficulty === slot.difficulty` (`initial`, `medium`, `advanced`)
  - `!usedQuestionIds.has(q.id)` (protección estricta contra preguntas repetidas en la partida).
- **Aleatoriedad Uniforme:** Dentro del conjunto de candidatas válidas por dificultad, cada pregunta tiene exactamente la misma probabilidad de ser elegida: `pool[Math.floor(rng() * pool.length)]`.
- **RNG Inyectable:** Se preservó el soporte para generadores pseudoaleatorios determinísticos (`rng`) en pruebas automatizadas y criptográficos en producción (`crypto.randomInt`).

### 3.2 Desactivación en Asignación de Turnos (`src/modules/trivia/assignment-plan.ts`)

- **Eliminación de Ramas por Edad:** Se eliminaron las funciones de detección de homogeneidad/heterogeneidad etaria y la alternancia según rangos de edad.
- **Round-Robin Determinístico:** La asignación de turnos para partidas de 2 o más jugadores se basa exclusivamente en la posición registrada del jugador (`sorted[directedIndex % n]`), garantizando que la estructura de la partida sea idéntica independientemente de la edad declarada.
- **Patrón de Slots Estandarizado:**
  - 1 jugador: 10 preguntas dirigidas.
  - 2 jugadores: 6 preguntas individuales dirigidas (3 cada uno), 4 preguntas grupales (posiciones 3, 5, 7, 10).
  - 3 jugadores: 6 preguntas individuales dirigidas (2 cada uno), 4 preguntas grupales (posiciones 3, 5, 7, 10).
  - 4 jugadores: 8 preguntas individuales dirigidas (2 cada uno), 2 preguntas grupales (posiciones 6, 10).
  - 5 a 8 jugadores: 1 pregunta individual dirigida por participante, preguntas restantes grupales.
- **Inmutabilidad de la Dificultad:** La dificultad de cada turno está determinada unívocamente por la posición del slot (1-3: initial, 4-7: medium, 8-10: advanced), jamás por el participante asignado.

### 3.3 Corrección en Interfaz de Usuario (`src/app/play/setup/play-setup-wizard.tsx`)

- Se corrigió el texto explicativo en el paso de registro de jugadores:
  - _Antes:_ "Registrá a los participantes para calibrar las preguntas de la partida" (inducía erróneamente a creer que la edad modificaba la dificultad).
  - _Ahora:_ "Registrá a los jugadores para repartir los turnos de la partida" (refleja fidedignamente la función del paso).

### 3.4 Sin Migraciones de Base de Datos

- Las columnas existentes en el esquema de PostgreSQL (`questions.age_range`, `questions.education_level`, `participants.age_range`, `participants.education_level`) se mantuvieron intactas para preservar la compatibilidad hacia atrás y el histórico de auditoría.
- No se requirió ninguna migración SQL en Drizzle.

---

## 4. Auditoría y Simulación Estadística en Producción

### 4.1 Simulación Masiva (`scripts/verify-question-bank-production.ts`)

Se ejecutó una auditoría estadística contra la base de datos real de producción simulando **1,200 partidas** (200 partidas por categoría para las 6 categorías oficiales) bajo 4 perfiles etarios extremos:

- Perfil 1: **Niños** (`child` / `primary`)
- Perfil 2: **Adolescentes** (`teen` / `secondary`)
- Perfil 3: **Adultos** (`adult` / `higher`)
- Perfil 4: **Mixto** (familia con niños y adultos)

### 4.2 Resultados Obtenidos

```text
================================================================
=== PPA-LAUNCH-001: VERIFICACIÓN DE EQUIDAD COMPETITIVA      ===
=== SIMULACIÓN ESTADÍSTICA (1200 PARTIDAS / 6 CATEGORÍAS)   ===
================================================================

🔗 Conectando a PostgreSQL para cargar preguntas en vivo...
✅ 360 preguntas aprobadas cargadas desde la base de datos.

--- 1. Verificación de Pools por Categoría (60 preguntas c/u) ---
• [cultura-general   ] Total: 60 | Initial: 20 | Medium: 20 | Advanced: 20
• [deportes          ] Total: 60 | Initial: 20 | Medium: 20 | Advanced: 20
• [ciencia-naturaleza] Total: 60 | Initial: 20 | Medium: 20 | Advanced: 20
• [geografia         ] Total: 60 | Initial: 20 | Medium: 20 | Advanced: 20
• [historia          ] Total: 60 | Initial: 20 | Medium: 20 | Advanced: 20
• [entretenimiento   ] Total: 60 | Initial: 20 | Medium: 20 | Advanced: 20

--- 2. Simulación de 200 Partidas por Categoría (1200 partidas en total) ---
• [cultura-general   ] 200 partidas | Unicidad: 100% (0 dupes) | Secuencia 3/4/3: 100% | Preguntas utilizadas: 60/60 (100%)
• [deportes          ] 200 partidas | Unicidad: 100% (0 dupes) | Secuencia 3/4/3: 100% | Preguntas utilizadas: 60/60 (100%)
• [ciencia-naturaleza] 200 partidas | Unicidad: 100% (0 dupes) | Secuencia 3/4/3: 100% | Preguntas utilizadas: 60/60 (100%)
• [geografia         ] 200 partidas | Unicidad: 100% (0 dupes) | Secuencia 3/4/3: 100% | Preguntas utilizadas: 60/60 (100%)
• [historia          ] 200 partidas | Unicidad: 100% (0 dupes) | Secuencia 3/4/3: 100% | Preguntas utilizadas: 60/60 (100%)
• [entretenimiento   ] 200 partidas | Unicidad: 100% (0 dupes) | Secuencia 3/4/3: 100% | Preguntas utilizadas: 60/60 (100%)

--- 3. Auditoría de Equidad entre Perfiles (Equidad Competitiva) ---
• Perfil [child]: 3000 preguntas formuladas en 300 partidas | 359/360 preguntas distintas del banco utilizadas (100%)
• Perfil [teen ]: 3000 preguntas formuladas en 300 partidas | 360/360 preguntas distintas del banco utilizadas (100%)
• Perfil [adult]: 3000 preguntas formuladas en 300 partidas | 360/360 preguntas distintas del banco utilizadas (100%)
• Perfil [mixed]: 3000 preguntas formuladas en 300 partidas | 360/360 preguntas distintas del banco utilizadas (100%)

• Preguntas 'adult' presentadas a niños: 72/72 (100%)
• Preguntas 'child' presentadas a adultos: 72/72 (100%)

================================================================
✅ RESULTADO: 1200 partidas simuladas con éxito.
   - 0 preguntas duplicadas en ninguna partida.
   - 100% de cumplimiento estricto de la distribución 3 initial / 4 medium / 3 advanced.
   - EQUIDAD TOTAL: El perfil etario NO altera el universo de candidatos.
   - Todas las mesas compiten exactamente con el mismo pool.
```

---

## 5. Smoke Test Real en Producción

### 5.1 Protocolo de Prueba (`scripts/smoke-launch-fairness.mjs`)

Se ejecutó una prueba funcional real contra `https://app.puntoburger.com.ar` utilizando el QR permanente de **Mesa 01** sin afectar a clientes reales:

1. **Verificación de Disponibilidad:** Mesa 01 se encontraba libre sin sesiones activas.
2. **Partida A (Perfil Infantil):** Se configuró una partida con participante declarado niño (`ageRange: child`, `educationLevel: primary`) en `cultura-general`. Se congelaron las preguntas mediante `POST /api/v1/games/prepare` y se inspeccionó la tabla `game_questions` en PostgreSQL.
   - Resultado: Distribución de tags en banco `{ child: 1, teen: 2, adult: 2, general: 5 }`.
   - Evidencia: Preguntas con tag `adult` (ej. microorganismos unicelulares, mayéutica/origen del té) fueron seleccionadas para el participante infantil.
3. **Partida B (Perfil Adulto):** Se configuró una partida con participante declarado adulto (`ageRange: adult`, `educationLevel: higher`) en `cultura-general`.
   - Resultado: Distribución de tags en banco `{ teen: 1, general: 4, adult: 3, child: 2 }`.
   - Evidencia: Preguntas con tag `child` (ej. reloj de arena, caleidoscopio) fueron seleccionadas para el participante adulto.
4. **Cumplimiento 3/4/3:** En ambas partidas se comprobó exactamente:
   - Posiciones 1, 2, 3: `initial`
   - Posiciones 4, 5, 6, 7: `medium`
   - Posiciones 8, 9, 10: `advanced`
5. **Limpieza e Integridad:** Mesa 01 fue restaurada a estado `available` (`active_device_id: null`, 0 sesiones activas).
6. **Monitoreo de Logs:** PM2 supervisó 0 reinicios, 0 errores y 0 instancias de `QUESTION_POOL_INSUFFICIENT`.

---

## 6. Cobertura de Pruebas Automatizadas

Se crearon pruebas unitarias especializadas en:

- `src/modules/trivia/question-selection.test.ts`:
  - **Prueba Anti-Exploit:** Dos partidas generadas con idéntico seed RNG (una con participante niño y otra con participante adulto) producen una secuencia 100% idéntica de IDs de preguntas.
  - **Prueba de Nivel Educativo:** Variaciones de `educationLevel` no alteran la selección de preguntas.
- `src/modules/trivia/assignment-plan.test.ts`:
  - **Prueba de Asignación por Participantes:** Verificación de simetría de slots dirigidos y grupales entre grupos homogéneos y mixtos de igual tamaño.
- **Resultado de Suite:** 40 suites de prueba y 205 pruebas unitarias/de integración pasando al 100%.

---

## 7. Declaración Formal de Cierre

- `QUESTION SELECTION BY AGE = DISABLED`
- `QUESTION SELECTION BY EDUCATION = DISABLED`
- `ASSIGNMENT BY AGE = DISABLED`
- `QUESTION POOL = category + difficulty + approved only`
- `DIFFICULTY = 3 initial / 4 medium / 3 advanced`
- `QUESTION BANK = 360 approved`
- `PPA-LAUNCH-001 COMPETITIVE FAIRNESS = PASSED`
- `PPA-LAUNCH-001 = CLOSED`
