# PPA-009 — Supabase, Drizzle, Modelo Inicial y Seeds

## Metadatos del Documento

- **Ticket:** PPA-009 (Incluye Hotfix y Activación Final)
- **Título:** Supabase, Drizzle, Modelo Inicial y Seeds
- **Fecha:** 2026-11-09
- **Estado:** Completado
- **Autor:** Equipo de Desarrollo Punto Burger
- **Rama:** `main`

---

## 1. Resumen Ejecutivo

El ticket **PPA-009** materializa la capa de persistencia y modelado de datos de la plataforma **Punto Burger**, cumpliendo estrictamente con la arquitectura técnica aprobada en [`specs/06-technical-architecture.md`](../../specs/06-technical-architecture.md) y [`docs/adr/001-technology-stack.md`](../../docs/adr/001-technology-stack.md).

Se integró **Drizzle ORM** junto con el driver nativo de alto rendimiento **Postgres.js** (`postgres`) para procesos Node.js persistentes en DonWeb Cloud Server, se configuró **Drizzle Kit** para la gestión de migraciones versionadas y se implementaron las **13 entidades fundacionales** del esquema relacional del Vertical Slice. Asimismo, se diseñó el esquema determinístico HMAC para códigos temporales de local, se expandió el banco de preguntas a **72 preguntas aprobadas** (12 por categoría, permitiendo partidas 3/4/3 por tema individual) y se configuró una suite de **47 pruebas automatizadas**.

---

## 2. Dependencias Instaladas

Se instalaron únicamente las dependencias autorizadas para persistencia y soporte de scripts:

| Paquete                 |  Tipo   |  Versión   | Justificación                                                                |
| :---------------------- | :-----: | :--------: | :--------------------------------------------------------------------------- |
| `drizzle-orm`           | Runtime | `^0.45.4`  | ORM TypeScript de cero overhead, tipado estricto y sin magia oculta          |
| `postgres`              | Runtime |  `^4.1.0`  | Driver cliente PostgreSQL nativo más rápido para Node.js, compatible con PM2 |
| `@supabase/supabase-js` | Runtime | `^2.119.0` | Cliente SDK oficial para autenticación administrativa y servicios Supabase   |
| `drizzle-kit`           |   Dev   | `^0.31.11` | CLI para generación de migraciones SQL versionadas e inspección (Studio)     |
| `tsx`                   |   Dev   | `^4.23.15` | Ejecutor de TypeScript en runtime para scripts de migración y seed           |
| `dotenv`                |   Dev   | `^18.0.10` | Carga de variables de entorno en scripts CLI de base de datos                |

_Nota:_ No se instaló Prisma ni ningún otro ORM redundante. No se utiliza Supabase Data API para las transacciones críticas del juego.

---

## 3. Modelo Implementado: Las 13 Entidades Fundacionales

Todas las entidades utilizan identificadores primarios UUID generados vía `gen_random_uuid()` / `defaultRandom()`, marcas de tiempo `timestamptz` (`timestamp with time zone`) y nomenclatura snake_case en PostgreSQL:

1. **`venues`**: Locales físicos de Punto Burger (`name`, `slug` único, `status`, `timezone`, `created_at`, `updated_at`).
2. **`tables`**: Mesas físicas del salón (`venue_id`, `code`, `display_name`, `status`, `qr_token` único, marcas de tiempo).
3. **`access_codes`**: Registro histórico y auditoría de códigos (`venue_id`, `code_hash`, `valid_from`, `valid_until`, `grace_until`, `created_at`).
4. **`table_sessions`**: Sesiones de mesa activas y cooldown (`venue_id`, `table_id`, `status`, `started_at`, `expires_at`, `closed_at`, `cooldown_until`, `active_device_id` FK, marcas de tiempo).
5. **`devices`**: Dispositivos vinculados a la sesión (`table_session_id`, `token_hash`, `status`, `claimed_at`, `revoked_at`, `last_seen_at`, `created_at`). Almacena exclusivamente el hash criptográfico del token de control.
6. **`groups`**: Grupo o equipo de juego en mesa (`table_session_id`, `name`, marcas de tiempo).
7. **`participants`**: Jugadores temporales (`group_id`, `alias`, `age_range`, `education_level`, `position`, `created_at`). No contiene DNI, domicilio ni teléfono.
8. **`categories`**: Temáticas de trivia (`slug` único, `name`, `description`, `status`, `sort_order`, marcas de tiempo).
9. **`questions`**: Banco de preguntas aprobadas (`category_id`, `prompt`, `option_a` a `option_d`, `correct_option` ['A'..'D'], `difficulty` ['initial'..'advanced'], `age_range`, `explanation`, `status` ['draft', 'approved', 'rejected', 'archived'], marcas de tiempo).
10. **`game_sessions`**: Partidas oficiales de trivia (`table_session_id`, `group_id`, `category_id` nullable para modo mixto, `status`, contadores de aciertos/errores/omitidas, `total_score`, marcas de tiempo).
11. **`game_questions`**: Secuencia inmutable congelada de 10 preguntas por partida (`game_session_id`, `question_id`, `position`, `difficulty`, `presented_at`, `expires_at`, `created_at`).
12. **`answers`**: Respuestas de la partida (`game_session_id`, `game_question_id`, `selected_option`, `result` ['correct', 'incorrect', 'unanswered'], `points_awarded`, `answered_at`, `created_at`).
13. **`audit_events`**: Registro inmutable de auditoría (`venue_id`, `event_type`, `entity_type`, `entity_id`, `actor_type`, `actor_id`, `metadata` JSONB, `created_at`).

---

## 4. Relaciones, FKs e Integridad de `active_device_id`

Para evitar cascadas destructivas que puedan eliminar historial de partidas, se aplicaron reglas explícitas:

- **`onDelete: 'restrict'`** (Preservación histórica estricta):
  - `tables.venue_id` -> `venues.id`
  - `access_codes.venue_id` -> `venues.id`
  - `table_sessions.venue_id` -> `venues.id`
  - `table_sessions.table_id` -> `tables.id`
  - `questions.category_id` -> `categories.id`
  - `game_sessions.table_session_id` -> `table_sessions.id`
  - `game_sessions.group_id` -> `groups.id`
  - `game_sessions.category_id` -> `categories.id`
  - `game_questions.question_id` -> `questions.id`
  - `answers.game_question_id` -> `game_questions.id`
- **`onDelete: 'cascade'`** (Ciclo de vida acoplado estrictamente a la sesión/partida):
  - `devices.table_session_id` -> `table_sessions.id`
  - `groups.table_session_id` -> `table_sessions.id`
  - `participants.group_id` -> `groups.id`
  - `game_questions.game_session_id` -> `game_sessions.id`
  - `answers.game_session_id` -> `game_sessions.id`
- **`onDelete: 'set null'`**:
  - `audit_events.venue_id` -> `venues.id`
  - `table_sessions.active_device_id` -> `devices.id`

### Tratamiento e Invariancia de `table_sessions.active_device_id`:

1. **Foreign Key Física:** `active_device_id` referencia directamente a `devices.id` con `ON DELETE SET NULL`, resolviendo el ciclo referencial mediante tipado estricto `AnyPgColumn` sin errores de compilación TypeScript.
2. **Nullable:** Permanece en `null` al crearse la sesión o durante estados de cooldown donde aún no se ha asignado un dispositivo de control.
3. **Invarianza de Negocio (a cumplir transaccionalmente en PPA-010):**
   - Cuando `active_device_id` no es null, el dispositivo referenciado debe cumplir obligatoriamente: `device.table_session_id === session.id` y `device.status === 'active'`.
   - Si un dispositivo es revocado (`status = 'revoked'`), jamás puede ostentar `active_device_id`.

---

## 5. Diseño Definitivo del Código Temporal de Local (HMAC)

Para resolver la disponibilidad del código en pantallas físicas y su validación server-side sin dependencia de estado en memoria ni escrituras periódicas continuas en PostgreSQL:

1. **Algoritmo:** HMAC-SHA256 computado sobre `venue_id + ":" + window_index` con `ACCESS_CODE_SECRET`.
2. **Formato:** Código legible de 5 caracteres alfanuméricos en mayúsculas extraído de un alfabeto de 32 símbolos sin ambigüedades visuales (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`, omitiendo 0, O, 1, I, L).
3. **Parámetros Temporales:**
   - **Rotación:** 5 minutos (300 segundos).
   - **Tolerancia / Gracia:** 45 segundos para el código de la ventana inmediatamente anterior.
4. **Validación:** Compara en tiempo constante (`timingSafeEqual`) contra la ventana actual y, si no coincide y han transcurrido menos de 45 segundos desde el cambio de ventana, contra la ventana anterior.
5. **Aislamiento Criptográfico:** Se definió la variable `ACCESS_CODE_SECRET` en `.env.example`, desacoplada de `SESSION_SECRET`.
6. **Función de la tabla `access_codes`:** Preservada exclusivamente como registro de auditoría y soporte para códigos emitidos manualmente o revocaciones extraordinarias, evitando escrituras repetitivas cada 5 minutos en Supabase.

---

## 6. Banco de Preguntas Aprobadas y Seeds Idempotentes

Se implementó el banco de preguntas en [`src/db/seeds/data/questions.ts`](../src/db/seeds/data/questions.ts) con **72 preguntas aprobadas**, garantizando que cualquier categoría activa disponga de preguntas suficientes para estructurar una partida completa de 10 preguntas con la distribución funcional 3 initial / 4 medium / 3 advanced:

| Categoría                | Slug                 | Initial | Medium | Advanced | Total Categoría  |
| :----------------------- | :------------------- | :-----: | :----: | :------: | :--------------: |
| **Cultura General**      | `cultura-general`    |    4    |   4    |    4     |      **12**      |
| **Deportes**             | `deportes`           |    4    |   4    |    4     |      **12**      |
| **Ciencia y Naturaleza** | `ciencia-naturaleza` |    4    |   4    |    4     |      **12**      |
| **Geografía**            | `geografia`          |    4    |   4    |    4     |      **12**      |
| **Historia**             | `historia`           |    4    |   4    |    4     |      **12**      |
| **Cine y Música**        | `entretenimiento`    |    4    |   4    |    4     |      **12**      |
| **TOTALES**              | **6 Categorías**     | **24**  | **24** |  **24**  | **72 preguntas** |

### Idempotencia Garantizada:

- El script [`src/db/seeds/index.ts`](../src/db/seeds/index.ts) verifica unicidad por `slug` en locales y categorías, por `(venueId, code)` en mesas, y por `prompt` en preguntas (`SELECT` previo + `onConflictDoNothing`), permitiendo múltiples ejecuciones sin duplicar registros.

---

## 7. Resultados de Validación y Ejecución

| Comando               |               Resultado                | Detalle                                                      |
| :-------------------- | :------------------------------------: | :----------------------------------------------------------- |
| `npm run lint`        | ✅ **Exitoso (0 errores, 0 warnings)** | ESLint 9 Flat Config sobre todo el proyecto                  |
| `npm run typecheck`   |       ✅ **Exitoso (0 errores)**       | Verificación estricta de TypeScript                          |
| `npm run test:run`    | ✅ **Exitoso (47/47 tests aprobados)** | 12 suites unitarias en Vitest                                |
| `npm run build`       |       ✅ **Exitoso (Turbopack)**       | Compilación optimizada en Next.js 16                         |
| `npm run db:generate` |             ✅ **Exitoso**             | Drizzle Kit generó el esquema SQL sin discrepancias          |
| `npm run db:migrate`  | ⚠️ **Informativo (Sin credenciales)**  | Produce error explícito requiriendo `DATABASE_MIGRATION_URL` |
| `npm run db:seed`     | ⚠️ **Informativo (Sin credenciales)**  | Produce error explícito requiriendo `DATABASE_URL`           |

---

## 8. Pasos para la Activación en Supabase Real

Para sincronizar las tablas y sembrar los datos cuando las credenciales de Supabase estén disponibles:

1. Crear el archivo `.env.local` a partir de `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
2. Completar las cadenas de conexión obtenidas del panel de Supabase (Dashboard -> Connect -> Direct connection):
   ```ini
   # Conexión directa (puerto 5432) aprovechando IPv6 funcional en el Cloud Server
   # (Fallback: Si en el futuro se requiriera IPv4 exclusiva, usar Session Pooler en puerto 5432)
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
   DATABASE_MIGRATION_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
   SUPABASE_URL="https://[PROJECT_ID].supabase.co"
   SUPABASE_PUBLISHABLE_KEY="[PUBLISHABLE_KEY]"
   SUPABASE_SECRET_KEY="[SECRET_KEY]"
   ACCESS_CODE_SECRET="un-secreto-aleatorio-seguro-de-mas-de-32-caracteres"
   SESSION_SECRET="un-secreto-aleatorio-seguro-de-mas-de-32-caracteres"
   ```
3. Ejecutar la migración SQL versionada:
   ```bash
   npm run db:migrate
   ```
4. Ejecutar el seed inicial:
   ```bash
   npm run db:seed
   ```
5. Comprobar la idempotencia ejecutando nuevamente el seed:
   ```bash
   npm run db:seed
   ```
   (El script reportará `72 ya existentes, 0 insertadas`, confirmando cero duplicados).
