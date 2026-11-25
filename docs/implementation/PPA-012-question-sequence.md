# PPA-012 — Motor de Selección y Congelado de las 10 Preguntas

## Metadatos

- **Ticket:** PPA-012
- **Título:** Motor de Selección y Congelado de las 10 Preguntas
- **Fecha:** 2026-11-25
- **Estado:** Implementado / Validado en Producción
- **Dominio:** Trivia, Asignación de Preguntas, Inmutabilidad, Snapshots, Sesiones de Juego
- **Especificaciones Base:** [`specs/03-game-mechanics.md`](../../specs/03-game-mechanics.md), [`specs/06-technical-architecture.md`](../../specs/06-technical-architecture.md), [`docs/implementation/PPA-011-group-setup.md`](./PPA-011-group-setup.md)

---

## 1. Resumen Ejecutivo

PPA-012 implementa el motor determinista, transaccional e inmutable que transforma una partida configurada por PPA-011 (`status = 'created'`, `started_at = null`, categoría seleccionada, grupo con 1 a 8 participantes) en una secuencia congelada de exactamente **10 preguntas** en la tabla `game_questions`:

1. **Estructura Fija de Dificultad (3/4/3):**
   - Posiciones 1, 2 y 3: Dificultad `initial` (fáciles).
   - Posiciones 4, 5, 6 y 7: Dificultad `medium` (intermedias).
   - Posiciones 8, 9 y 10: Dificultad `advanced` (desafiantes).
2. **Plan de Asignación Equitativo (1 a 8 participantes):**
   - **1 Jugador Solo:** 10 preguntas dirigidas a dicho jugador único (`target_participant_id` establecido).
   - **Grupo Homogéneo:** Preguntas colectivas grupales (`target_participant_id = null`), o dirigidas en rondas balanceadas.
   - **Grupo Mixto:** Alternancia rigurosa de rangos de edad (`child`, `teen`, `adult`) intercalada con preguntas grupales de equipo (entre 2 y 5 colectivas), reservando la posición 10 obligatoriamente como grupal.
3. **Selección por Scoring de Compatibilidad con Fallback General:**
   - Algoritmo de scoring 5..1 (o 0 si incompatible): match exacto de edad y nivel educativo (5), match exacto de edad (4), compatible adyacente (3/2), fallback general/null (1).
   - Compatible al 100% con el pool inicial de 72 preguntas aprobadas en producción (`age_range = 'general'`, `education_level = null`).
   - Sin repetición de preguntas (`UNIQUE(game_session_id, question_id)`).
   - Soporte para RNG inyectable para reproducibilidad en pruebas automatizadas.
4. **Snapshots Completos e Inmutables:**
   - La tabla `game_questions` almacena copias congeladas de: `prompt_snapshot`, `option_a_snapshot`, `option_b_snapshot`, `option_c_snapshot`, `option_d_snapshot`, `correct_option_snapshot`, `explanation_snapshot`, `age_range_snapshot` y `education_level_snapshot`.
   - Modificaciones posteriores en el catálogo de preguntas no alteran partidas en curso o pasadas.
5. **Transaccionalidad, Bloqueo Pesimista e Idempotencia:**
   - Bloqueo pesimista `SELECT ... FOR UPDATE` sobre la fila de `game_sessions`.
   - Detección inmediata de preparación previa: si ya existen 10 preguntas válidas congeladas, se reutilizan de forma idempotente sin duplicar filas ni lanzar excepciones de clave única.
   - Manejo concurrente con protección ante doble-click.
6. **Seguridad y Cero Fugas:**
   - La API `POST /api/v1/games/prepare` y la pantalla de transición `/play` no exponen textos de preguntas, opciones ni respuestas correctas al cliente.
   - `presented_at` y `expires_at` se inicializan en `null`.
   - El estado de la partida se mantiene estrictamente en `created` y `started_at` permanece `null`. **PPA-012 no inicia temporizadores ni acepta respuestas** (reserva estricta para PPA-013).

---

## 2. Flujo Arquitectónico

```text
Cliente (Navegador Móvil con cookie pb_table_session)
       │
       │ POST /api/v1/games/prepare
       ▼
[ Route Handler: /api/v1/games/prepare ]
       │
       ├── Valida cookie criptográfica pb_table_session
       ├── Resuelve dispositivo activo y sesión de mesa (status = 'active')
       ├── Invoca gamePreparationService.prepareGameQuestions(sessionId, deviceId)
       │
[ Trivia Domain Module: gamePreparationService ]
       │
       ├── Transacción PostgreSQL:
       │     ├── SELECT ... FROM game_sessions WHERE table_session_id = ... FOR UPDATE
       │     ├── Verifica status === 'created' y startedAt === null
       │     ├── Idempotencia: ¿Ya existen 10 preguntas preparadas?
       │     │     └── Sí -> Retorna resultado idempotente sin modificar BD
       │     ├── Verifica categoría activa y participantes (1..8)
       │     ├── Consulta preguntas aprobadas de la categoría seleccionada
       │     │
       │     ├── buildAssignmentPlan(participants):
       │     │     └── Genera slots 1..10 (dificultades 3/4/3, targets equitativos y grupales)
       │     │
       │     ├── selectQuestionsForSlots(candidates, plan):
       │     │     └── Aplica scoring de compatibilidad y unicidad estricta (10 distintas)
       │     │
       │     ├── Inserta atómicamente 10 filas en game_questions con snapshots completos
       │     └── Inserta audit_event 'game_questions_prepared'
       │
       ▼
[ Respuesta 200 OK: { ok: true, game: { status: 'created', prepared: true, questionCount: 10, category: ... }, next: '/play' } ]
       │
       │ Redirección del navegador
       ▼
[ Server Component: /play ]
       │
       ├── Valida sesión y existencia de las 10 preguntas congeladas
       ├── Renderiza pantalla de transición ("¡Todo listo!", SMOKE PPA-012, 3 jugadores, Deportes)
       └── Botón "Comenzar" deshabilitado (marcado para activación interactiva en PPA-013)
```

---

## 3. Modelo de Datos y Migración

### Migración Incremental `0002_sad_gamora.sql`

Se generó y aplicó automáticamente en producción la migración `src/db/migrations/0002_sad_gamora.sql`:

```sql
ALTER TABLE "game_questions" ADD COLUMN "target_participant_id" uuid;
ALTER TABLE "game_questions" ADD COLUMN "prompt_snapshot" text NOT NULL;
ALTER TABLE "game_questions" ADD COLUMN "option_a_snapshot" text NOT NULL;
ALTER TABLE "game_questions" ADD COLUMN "option_b_snapshot" text NOT NULL;
ALTER TABLE "game_questions" ADD COLUMN "option_c_snapshot" text NOT NULL;
ALTER TABLE "game_questions" ADD COLUMN "option_d_snapshot" text NOT NULL;
ALTER TABLE "game_questions" ADD COLUMN "correct_option_snapshot" text NOT NULL;
ALTER TABLE "game_questions" ADD COLUMN "explanation_snapshot" text;
ALTER TABLE "game_questions" ADD COLUMN "age_range_snapshot" text NOT NULL;
ALTER TABLE "game_questions" ADD COLUMN "education_level_snapshot" text;
ALTER TABLE "game_questions" ADD CONSTRAINT "game_questions_target_participant_id_participants_id_fk" FOREIGN KEY ("target_participant_id") REFERENCES "public"."participants"("id") ON DELETE restrict ON UPDATE no action;
CREATE UNIQUE INDEX "game_questions_session_question_unique" ON "game_questions" USING btree ("game_session_id","question_id");
ALTER TABLE "game_questions" ADD CONSTRAINT "game_questions_position_range" CHECK (("position" >= 1 AND "position" <= 10));
```

### Tabla `game_questions` Verificada en Producción

| Columna                    | Tipo          | Nulable | Descripción                                                         |
| :------------------------- | :------------ | :------ | :------------------------------------------------------------------ |
| `id`                       | `uuid`        | NO      | Clave primaria generada por defecto (`gen_random_uuid()`)           |
| `game_session_id`          | `uuid`        | NO      | Clave foránea a `game_sessions(id)` con `ON DELETE CASCADE`         |
| `question_id`              | `uuid`        | NO      | Clave foránea a `questions(id)` con `ON DELETE RESTRICT`            |
| `position`                 | `integer`     | NO      | Posición ordinal (1..10) protegida por CHECK constraint             |
| `difficulty`               | `text`        | NO      | Dificultad de la ranura (`initial`, `medium`, `advanced`)           |
| `target_participant_id`    | `uuid`        | SÍ      | Clave foránea a `participants(id)` (NULL en preguntas grupales)     |
| `prompt_snapshot`          | `text`        | NO      | Copia congelada del enunciado de la pregunta                        |
| `option_a_snapshot`        | `text`        | NO      | Copia congelada de la opción A                                      |
| `option_b_snapshot`        | `text`        | NO      | Copia congelada de la opción B                                      |
| `option_c_snapshot`        | `text`        | NO      | Copia congelada de la opción C                                      |
| `option_d_snapshot`        | `text`        | NO      | Copia congelada de la opción D                                      |
| `correct_option_snapshot`  | `text`        | NO      | Copia congelada de la respuesta correcta (`A`, `B`, `C`, `D`)       |
| `explanation_snapshot`     | `text`        | SÍ      | Copia congelada de la justificación didáctica                       |
| `age_range_snapshot`       | `text`        | NO      | Copia congelada del target etario de la pregunta                    |
| `education_level_snapshot` | `text`        | SÍ      | Copia congelada del nivel educativo de la pregunta                  |
| `presented_at`             | `timestamptz` | SÍ      | Momento en que la pregunta se muestra al comensal (NULL en PPA-012) |
| `expires_at`               | `timestamptz` | SÍ      | Momento de expiración del temporizador (NULL en PPA-012)            |
| `created_at`               | `timestamptz` | NO      | Timestamp de congelado de la ranura                                 |

### Restricciones e Índices

1. `game_questions_pkey`: Clave primaria sobre `id`.
2. `game_questions_session_position_idx`: Índice único sobre `(game_session_id, position)`.
3. `game_questions_session_question_unique`: Índice único sobre `(game_session_id, question_id)` (impide preguntas duplicadas).
4. `game_questions_position_range`: Check constraint `position BETWEEN 1 AND 10`.
5. `game_questions_target_participant_id_participants_id_fk`: FK a `participants(id)` con `ON DELETE RESTRICT`.

---

## 4. Algoritmos del Módulo de Trivia

### 4.1 Plan de Asignación (`assignment-plan.ts`)

- **Distribución de Dificultad Inmutable:** Ranuras 1..3 (`initial`), 4..7 (`medium`), 8..10 (`advanced`).
- **Participante Único ($N = 1$):** Las 10 ranuras son dirigidas al único jugador (`targetParticipantId = participant.id`, `isGroup = false`).
- **Grupo Homogéneo:** Todas las ranuras se configuran como colectivas/grupales (`targetParticipantId = null`, `isGroup = true`), o se reparten equitativamente según el tamaño del equipo.
- **Grupo Mixto:**
  - Se calcula el número equitativo de preguntas dirigidas por participante:
    - Para $N = 2$: 3 dirigidas c/u (6 dirigidas) + 4 grupales (`totalGroup = 4`).
    - Para $N = 3$: 2 dirigidas c/u (6 dirigidas) + 4 grupales (`totalGroup = 4`).
    - Para $N = 4$: 2 dirigidas c/u (8 dirigidas) + 2 grupales (`totalGroup = 2`).
    - Para $N = 5..8$: 1 dirigida c/u ($N$ dirigidas) + $(10 - N)$ grupales (entre 2 y 5 grupales).
  - Las posiciones grupales se ubican estratégicamente (incluyendo siempre la posición 10 como cierre colectivo).
  - Las preguntas dirigidas se intercalan alternando entre los distintos rangos etarios (`child`, `teen`, `adult`).

### 4.2 Selección de Preguntas (`question-selection.ts`)

- **Validación Previa del Catálogo:** Verifica que la categoría posea al menos 3 preguntas `initial`, 4 preguntas `medium` y 3 preguntas `advanced` en estado `approved`.
- **Scoring de Compatibilidad:**
  - Ranura grupal: Cualquier pregunta aprobada de la dificultad requerida es elegible (score base 1).
  - Ranura dirigida:
    - Match exacto de `ageRange` y `educationLevel`: Score 5.
    - Match exacto de `ageRange`: Score 4.
    - Adyacente compatible (ej. `child` con contenido `teen` general): Score 3 o 2.
    - Contenido de dominio general (`age_range = 'general'`): Score 1 (fallback universal garantizado).
    - Incompatible (ej. pregunta de física universitaria para un niño de nivel inicial): Score 0.
- **Selección sin Duplicados:** Se mantiene un `Set<string>` con los `question_id` ya asignados en la partida para garantizar la unicidad estricta requerida por la base de datos.
- **RNG Inyectable:** La función acepta un generador pseudoaleatorio inyectable `rng: () => number` (por defecto `Math.random`), asegurando pruebas unitarias 100% reproducibles.

---

## 5. Endpoints y Pantalla `/play`

### 5.1 Endpoint `POST /api/v1/games/prepare`

- **Autenticación:** Requiere cookie `pb_table_session`.
- **Idempotencia:** Si la partida ya cuenta con 10 preguntas preparadas, retorna éxito HTTP 200 de inmediato.
- **Respuesta:**
  ```json
  {
    "ok": true,
    "game": {
      "status": "created",
      "prepared": true,
      "questionCount": 10,
      "category": {
        "slug": "deportes",
        "name": "Deportes"
      }
    },
    "next": "/play"
  }
  ```
- **Privacidad:** No filtra enunciados, opciones ni respuestas correctas.

### 5.2 Pantalla de Transición `/play`

- **Ruta:** `/play`
- **Renderizado:** Server Component que valida la sesión y comprueba que existan exactamente 10 preguntas congeladas para la partida.
- **Contenido Mostrado:**
  - Nombre del equipo ("SMOKE PPA-012").
  - Identificador de la mesa ("Mesa 01").
  - Categoría seleccionada ("Deportes").
  - Cantidad de jugadores registrados (3).
  - Estructura didáctica (3 iniciales, 4 intermedias, 3 avanzadas).
  - Reglas del juego (20 segundos por pregunta).
  - Botón "Comenzar" deshabilitado con leyenda informativa: _"La presentación interactiva y el temporizador se activarán en el siguiente paso (PPA-013)"_.
- **Cero Fugas:** El HTML generado no contiene ningún texto de las preguntas preparadas.

---

## 6. Cobertura de Pruebas Automatizadas

El proyecto cuenta con 139 pruebas unitarias e integradas pasando al 100% en Vitest a lo largo de 26 archivos de prueba:

- `src/modules/trivia/assignment-plan.test.ts`: 6 pruebas (1 jugador, homogéneo, mixto, 8 jugadores, límites y determinismo).
- `src/modules/trivia/question-selection.test.ts`: 10 pruebas (scoring de compatibilidad, fallback general, unicidad de IDs, RNG inyectable, validación de umbrales 3/4/3).
- `src/modules/trivia/game-preparation.service.test.ts`: 9 pruebas (transaccionalidad, bloqueo pesimista, idempotencia, guardado de snapshots, auditoría, manejo de errores).
- `src/app/api/v1/games/prepare/route.test.ts`: 4 pruebas (autorización, respuestas exitosas, sanitización de errores, cero fugas).
- `src/app/play/page.test.tsx`: 3 pruebas (renderizado de pantalla de transición, botón deshabilitado, protección de sesión).
- `src/app/play/setup/play-setup-wizard.test.tsx`: 5 pruebas (integración de botón "Empezar partida", llamada al endpoint y redirección a `/play`).
- `src/db/schema.test.ts`: 7 pruebas (verificación del esquema Drizzle de `game_questions`, índices y constraints).

---

## 7. Registro del Smoke Test en Producción

El 25 de noviembre de 2026 se llevó a cabo el **Smoke Test Real** de 26 puntos directamente sobre el entorno oficial de producción:

- **Dominio:** `https://app.puntoburger.com.ar`
- **Commit Desplegado:** `f462728b7aa9ea18d5c54d882841a24912fd5be1`
- **Base de Datos:** Supabase PostgreSQL vía Direct Connection `:5432` en Cloud Server DonWeb Ubuntu 24.04 (Node.js 24 + PM2).

### Evidencias de los 26 Puntos Verificados

1. **Obtención del Código Temporal Real:**
   - Comando: `npm run dev:access-code -- esperanza-central`
   - Venue: _Punto Burger Esperanza_
   - Código vigente: `X8R9M` (expiración: 60s)
2. **Claim de Mesa 01:**
   - `POST https://app.puntoburger.com.ar/api/v1/tables/claim`
   - Resultado: `HTTP/2 200 OK`
   - Respuesta: `{"ok":true,"session":{"table":"Mesa 01","status":"active","expiresAt":"..."},"next":"/play/setup"}`
   - Cookie `pb_table_session` recibida y guardada.
3. **Configuración de Grupo y Participantes (PPA-011):**
   - `POST https://app.puntoburger.com.ar/api/v1/games/setup`
   - Grupo: `"SMOKE PPA-012"`
   - Participantes: Cata (child, primary, pos 1), Santi (teen, secondary, pos 2), Joaco (adult, higher, pos 3).
   - Categoría: `"deportes"`
   - Resultado: `HTTP/2 200 OK`, `gameSession.status = 'created'`, `started_at = null`.
4. **Verificación de Base de Datos Previa a la Preparación:**
   - `game_questions`: Conteo = `0`.
   - `game_session`: `status = 'created'`, `started_at = null`, `category_id = c9b438a7-920c-4511-9e59-6113caaabf75`.
5. **Primera Llamada a `/api/v1/games/prepare`:**
   - `POST https://app.puntoburger.com.ar/api/v1/games/prepare` con cookie de sesión.
   - Resultado: `HTTP/2 200 OK`.
   - Payload: `{"ok":true,"game":{"status":"created","prepared":true,"questionCount":10,"category":{"slug":"deportes","name":"Deportes"}},"next":"/play"}`.
   - Cero fugas de preguntas, opciones o respuestas.
6. **Verificación de las 10 Preguntas Congeladas en PostgreSQL:**
   - Conteo total: Exactamente 10 filas vinculadas a `game_session_id: 0be71d6d-b121-4e8f-a56b-ebf6d041410e`.
   - Posiciones: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 estrictamente secuenciales.
   - Dificultades:
     - Pos 1..3: `initial` (3 preguntas).
     - Pos 4..7: `medium` (4 preguntas).
     - Pos 8..10: `advanced` (3 preguntas).
   - Unicidad: 10 `question_id` distintos (cero repetidas).
   - Asignación Equitativa de Preguntas Dirigidas:
     - Cata: Posición 1 (`initial`), Posición 6 (`medium`) -> 2 preguntas.
     - Santi: Posición 2 (`initial`), Posición 8 (`advanced`) -> 2 preguntas.
     - Joaco: Posición 4 (`medium`), Posición 9 (`advanced`) -> 2 preguntas.
   - Preguntas Colectivas/Grupales:
     - Posiciones 3, 5, 7 y 10 (`target_participant_id = null`) -> 4 preguntas grupales (incluyendo la final en pos 10).
   - Integridad de Snapshots: `prompt_snapshot`, `option_a_snapshot`, `option_b_snapshot`, `option_c_snapshot`, `option_d_snapshot`, `correct_option_snapshot`, `age_range_snapshot` poblados en las 10 filas.
   - Temporizadores: `presented_at = null` y `expires_at = null` en las 10 filas.
   - Estado de Sesión de Juego: `status` se mantuvo en `'created'`, `started_at` se mantuvo en `null`.
7. **Verificación de Auditoría:**
   - Registro en `audit_events`: `id: cd23f69f-5ae3-4da5-9da4-60b39d6eba7e`.
   - `event_type`: `'game_questions_prepared'`, `entity_type`: `'game_session'`, `actor_type`: `'device'`.
   - `metadata`: `{"questionCount": 10, "initialCount": 3, "mediumCount": 4, "advancedCount": 3, "directedCount": 6, "groupCount": 4}`.
8. **Prueba de Idempotencia:**
   - Segunda llamada a `POST /api/v1/games/prepare` con la misma cookie.
   - Resultado: `HTTP/2 200 OK`, `questionCount: 10`.
   - En PostgreSQL: Conteo se mantiene en exactamente 10 filas (mismos IDs de fila, cero duplicación).
9. **Prueba de Concurrencia (Doble Click):**
   - Ejecución paralela de 2 solicitudes `POST /api/v1/games/prepare`.
   - Ambas respondieron `HTTP/2 200 OK`.
   - En PostgreSQL: Conteo inalterado en exactamente 10 filas.
10. **Comprobación de Pantalla de Transición `/play`:**
    - `GET https://app.puntoburger.com.ar/play` con cookie de sesión.
    - Resultado: `HTTP/2 200 OK`.
    - HTML renderizó: "¡Todo listo!", "SMOKE PPA-012", "Mesa 01", "Deportes", "3 jugadores registrados", botón "Comenzar" deshabilitado con leyenda de PPA-013.
    - Cero filtración de preguntas o respuestas en el HTML (`grep` de preguntas arrojó 0 coincidencias).
11. **Limpieza Controlada y Cooldown:**
    - Dispositivo marcado como `revoked` con `revoked_at = NOW()`.
    - Sesión de mesa cerrada con `status = 'closed'`, `cooldown_until = NOW() + 120s`.
    - Mesa 01 en `status = 'cooldown'`.
12. **Validación de Bloqueo por Cooldown:**
    - Intento de claim durante cooldown: `POST /api/v1/tables/claim`.
    - Resultado: `HTTP/2 409 Conflict`, error `TABLE_COOLDOWN`.
13. **Expiración de Cooldown y Normalización Lazy:**
    - Cooldown actualizado a fecha pasada (`cooldown_until = NOW() - 5s`).
    - Solicitud `GET https://app.puntoburger.com.ar/table/mesa-01` ejecutada.
    - Normalización lazy activada: Mesa 01 retornó a `status = 'available'`.
    - Comprobación final en PostgreSQL: Mesa 01 `available`, 0 sesiones activas, 0 dispositivos activos.

---

## 8. Cierre Formal y Próximos Pasos

Con la aprobación de este smoke test en el servidor DonWeb de producción y la base de datos Supabase, **PPA-012 queda formalmente CERRADO**:

```text
PPA-012 PRODUCTION SMOKE TEST = PASSED
PPA-012 = CLOSED
```

### Límites Estrictos de Alcance

Siguiendo rigurosamente la metodología SDD, **PPA-012 NO inició PPA-013**:

- No se inició el temporizador de 20 segundos por pregunta.
- No se presentó la primera pregunta interactiva.
- No se aceptan envíos de respuestas ni cálculo de puntajes.
- La partida permanece en estado `created` lista para el inicio interactivo de PPA-013.
