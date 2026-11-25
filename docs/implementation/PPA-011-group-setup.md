# PPA-011 — Configuración de Grupo, Participantes y Categoría

## Metadatos

- **Ticket:** PPA-011
- **Título:** Configuración de Grupo, Participantes y Categoría
- **Fecha:** 2026-11-25
- **Estado:** Implementado / Validado
- **Dominio:** Grupo, Participantes Temporales, Categorías, Sesión de Juego y Auditoría
- **Especificaciones Base:** [`specs/04-qr-table-access.md`](../../specs/04-qr-table-access.md), [`specs/05-users-schools-consent.md`](../../specs/05-users-schools-consent.md), [`specs/06-technical-architecture.md`](../../specs/06-technical-architecture.md)

---

## 1. Resumen Ejecutivo

PPA-011 transforma la pantalla provisional `/play/setup` en la experiencia funcional real de configuración de equipo previa a la partida de trivia de Punto Burger:

1. **Autorización Estricta:** Protegido por la cookie de sesión criptográfica `pb_table_session`. El servidor resuelve `device -> table_session -> table -> venue`. El cliente nunca envía identificadores internos como fuente de verdad.
2. **Wizard Mobile-First de 3 Pasos:**
   - **Paso 1 (Tu equipo):** Título _"¿Cómo se llama tu equipo?"_, validación de 2 a 30 caracteres, normalización de espacios, chips opcionales con ideas rápidas (_"Los Cracks"_, _"Mesa Picante"_, _"Los Bacon"_, _"Team Punto"_).
   - **Paso 2 (¿Quiénes juegan?):** Registro de 1 a 8 participantes temporales con `alias` (1 a 24 caracteres), `ageRange` canónico (`child`, `teen`, `adult`), `educationLevel` opcional (`primary`, `secondary`, `higher`, `none`) y `position` estable (1..N).
   - **Paso 3 (Elegí una categoría):** Selección entre las 6 categorías del bar consultadas en tiempo real desde PostgreSQL, con verificación server-side de suficiencia de preguntas (_readiness 3/4/3_: initial >= 3, medium >= 4, advanced >= 3).
3. **Persistencia Atómica y Estado `created`:** Creación o actualización transaccional en PostgreSQL de `groups`, `participants` y `game_sessions` (`status = 'created'`, `started_at = null`). **PPA-011 no genera ni congela preguntas en `game_questions` ni inicia temporizadores.**
4. **Idempotencia y Edición Pre-partida:** Si el comensal reenvía el formulario o recarga el navegador, la configuración se recupera de forma transparente desde la base de datos. Mientras `game_session.status === 'created'`, se permite editar el equipo; una vez que la partida pasa a `active`, la edición queda estrictamente bloqueada arrojando `GAME_ALREADY_STARTED`.
5. **Auditoría y Privacidad:** Registro inmutable de eventos mínimos (`group_created`, `group_updated`, `participants_configured`, `game_setup_created`, `game_setup_updated`) sin almacenar datos personales sensibles (sin DNI, teléfono, email, escuelas ni cuentas Supabase Auth para participantes temporales).

---

## 2. Flujo Funcional y Pantalla `/play/setup`

```text
Cliente (Navegador Móvil con cookie pb_table_session)
       │
       │ GET /play/setup
       ▼
[ Server Component: PlaySetupPage ]
       │
       ├── Valida cookie y estado de sesión (activa y no vencida)
       ├── Consulta categorías activas y calcula readiness server-side
       ├── Si ya existe group y game_session (status = 'created'):
       │     └── Carga existingSetup desde PostgreSQL
       ▼
[ Client Component: PlaySetupWizard ]
       │
       ├── ¿existingSetup?.isSaved?
       │     ├── Sí -> Renderiza Vista Resumen ("¡Equipo listo!", participantes, categoría y botón Modificar)
       │     └── No -> Inicia en Paso 1 (1 de 3)
       │
       ├── Paso 1: Tu equipo (Nombre 2..30 chars) -> Siguiente
       ├── Paso 2: Participantes (1..8 jugadores, alias, edad, educación) -> Siguiente
       ├── Paso 3: Categoría (Grilla de 6 categorías, deshabilita si no está lista)
       ▼
[ POST /api/v1/games/setup ]
       │
       ├── Validación Zod ({ groupName, participants, categorySlug })
       ├── Comprobación de categoría activa y readiness (initial>=3, medium>=4, advanced>=3)
       ├── Comprobación de que no exista game_session en estado 'active'
       │
       ├── Transacción PostgreSQL:
       │     ├── Crea o actualiza group (UNIQUE table_session_id)
       │     ├── Reemplaza participants con posiciones secuenciales 1..N (UNIQUE group_id, position)
       │     ├── Crea o actualiza game_session (status: 'created', UNIQUE table_session_id WHERE created/active)
       │     └── Inserta audit_events
       ▼
[ Respuesta 200 OK -> Muestra Vista Resumen "¡Equipo listo!" ]
```

---

## 3. Endpoints y Contratos

### `POST /api/v1/games/setup`

#### Payload de Entrada

```json
{
  "groupName": "Los Bacon",
  "participants": [
    {
      "alias": "Joaco",
      "ageRange": "adult",
      "educationLevel": "higher"
    },
    {
      "alias": "Santi",
      "ageRange": "teen",
      "educationLevel": "secondary"
    }
  ],
  "categorySlug": "deportes"
}
```

#### Respuesta Exitosa (200 OK)

```json
{
  "ok": true,
  "group": {
    "id": "c7a8...",
    "name": "Los Bacon"
  },
  "participants": [
    {
      "id": "e1f2...",
      "alias": "Joaco",
      "ageRange": "adult",
      "educationLevel": "higher",
      "position": 1
    },
    {
      "id": "f3a4...",
      "alias": "Santi",
      "ageRange": "teen",
      "educationLevel": "secondary",
      "position": 2
    }
  ],
  "gameSession": {
    "id": "d9b0...",
    "status": "created",
    "categoryId": "a4c5...",
    "categoryName": "Deportes",
    "categorySlug": "deportes"
  },
  "next": "/play/setup"
}
```

#### Errores de Dominio Mapeados

- `SESSION_NOT_FOUND` (401/404)
- `SESSION_EXPIRED` (401)
- `DEVICE_NOT_ACTIVE` (403)
- `GROUP_NAME_INVALID` (400)
- `PARTICIPANT_COUNT_INVALID` (400)
- `PARTICIPANT_INVALID` (400)
- `CATEGORY_NOT_FOUND` (404)
- `CATEGORY_NOT_AVAILABLE` (400)
- `CATEGORY_NOT_READY` (400)
- `GAME_ALREADY_STARTED` (409)
- `SETUP_CREATION_FAILED` (500)

---

## 4. Invariantes de Base de Datos y Migración Incremental

Se generó la migración SQL `src/db/migrations/0001_youthful_wong.sql` incorporando las siguientes restricciones:

1. **`groups_table_session_id_unique`:**
   ```sql
   CREATE UNIQUE INDEX "groups_table_session_id_unique" ON "groups" USING btree ("table_session_id");
   ```
   Garantiza que solo pueda existir como máximo un grupo principal por sesión de mesa.
2. **`participants_group_position_unique`:**
   ```sql
   CREATE UNIQUE INDEX "participants_group_position_unique" ON "participants" USING btree ("group_id","position");
   ```
   Garantiza que las posiciones 1..8 asignadas a los participantes dentro de un mismo grupo sean estrictamente únicas.
3. **`game_sessions_active_table_session_idx`:**
   ```sql
   CREATE UNIQUE INDEX "game_sessions_active_table_session_idx" ON "game_sessions" USING btree ("table_session_id") WHERE status IN ('created', 'active');
   ```
   Garantiza que una sesión de mesa solo pueda tener una partida en estado preparatorio (`created`) o activa (`active`) a la vez, permitiendo futuras partidas de práctica una vez completada (`completed`).

---

## 5. Pruebas Automatizadas

La suite cuenta con **21 archivos de prueba y 105 tests** en Vitest, todos aprobados al 100%:

- 14 tests en `src/modules/groups/groups.service.test.ts`.
- 7 tests en `src/app/api/v1/games/setup/route.test.ts`.
- 4 tests en `src/app/play/setup/play-setup-wizard.test.tsx`.

---

## 6. Validación Final: Smoke Test Real en Producción

El 25 de noviembre de 2026 se llevó a cabo el **Smoke Test Real** completo directamente contra el entorno productivo en DonWeb Cloud Server (`https://app.puntoburger.com.ar`) bajo el commit `83fc55a9455aed5b3ee1f36d0c50c65d73368c3f`.

### Registro de Evidencias y Trazabilidad

- **Dominio:** `https://app.puntoburger.com.ar`
- **Venue:** Punto Burger Esperanza (`slug: esperanza-central`, `id: 2d6254cc-6c46-4151-af6e-050ba9b8b6b2`)
- **Mesa probada:** Mesa 01 (`code: mesa-01`, `id: c0c02b58-bced-461d-ab53-4c70bca77848`)
- **Código de acceso temporal utilizado:** `H3ACE` (obtenido server-side en el host de producción mediante `npm run dev:access-code -- esperanza-central`)
- **Timestamp de inicio de claim:** `2026-11-25T16:30:29.492Z`
- **ID de Sesión de Mesa (`table_session_id`):** `2ebeac64-f49f-4e11-b656-802b7e34a940`
- **ID de Dispositivo (`device_id` / `active_device_id`):** `30fb0e45-7d55-4fbd-901c-212991e1c784`
- **Cookie emitida:** `pb_table_session` (`HttpOnly`, `SameSite=Lax`, `Secure`, `Path=/`, `MaxAge=5400`)

---

### Verificaciones Paso a Paso

#### 1. Claim de Mesa y Emisión de Cookie

Comando ejecutado:
```bash
curl -s -i -c /tmp/ppa11_cookie.txt -X POST https://app.puntoburger.com.ar/api/v1/tables/claim \
  -H "Content-Type: application/json" \
  -d '{"tableCode":"mesa-01","accessCode":"H3ACE"}'
```

Resultado:
- `HTTP/2 200 OK`
- `{"ok":true,"session":{"table":"Mesa 01","status":"active","expiresAt":"2026-11-25T18:00:29.492Z"},"next":"/play/setup"}`
- Encabezado `Set-Cookie: pb_table_session=...; Path=/; HttpOnly; SameSite=Lax; Secure` recibido y guardado.

#### 2. Carga Inicial de Wizard de Configuración

Comando ejecutado:
```bash
curl -s -i -b /tmp/ppa11_cookie.txt https://app.puntoburger.com.ar/play/setup
```

Resultado:
- `HTTP/2 200 OK`
- Renderizó la pantalla del Paso 1 ("Paso 1 de 3: Nombre del equipo") para "Mesa 01".
- Categorías activas cargadas desde PostgreSQL: 6 categorías activas con `isReady: true` (72 preguntas aprobadas en total, 12 por tema con estructura 4/4/4 satisfaciendo el umbral 3/4/3).

#### 3. Configuración Inicial del Equipo (POST /api/v1/games/setup)

Comando ejecutado:
```bash
curl -s -i -b /tmp/ppa11_cookie.txt -X POST https://app.puntoburger.com.ar/api/v1/games/setup \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "SMOKE PPA-011",
    "categorySlug": "deportes",
    "participants": [
      { "alias": "Joaco", "ageRange": "adult", "educationLevel": "higher" },
      { "alias": "Santi", "ageRange": "teen", "educationLevel": "secondary" }
    ]
  }'
```

Respuesta del servidor (`HTTP/2 200 OK`):
```json
{
  "ok": true,
  "group": {
    "id": "7ba5bf89-a27f-46df-ad0f-a5bbcff1771f",
    "name": "SMOKE PPA-011"
  },
  "participants": [
    { "id": "6128f122-565c-4fb8-8ea2-5b9dfbb1cf71", "alias": "Joaco", "ageRange": "adult", "educationLevel": "higher", "position": 1 },
    { "id": "a2239eb6-cc8e-44c7-a5f1-97b582c81bb4", "alias": "Santi", "ageRange": "teen", "educationLevel": "secondary", "position": 2 }
  ],
  "gameSession": {
    "id": "9ab739f6-bd31-4fcf-a6c1-6e14aa5bb47c",
    "status": "created",
    "categoryId": "c9b438a7-920c-4511-9e59-6113caaabf75",
    "categoryName": "Deportes",
    "categorySlug": "deportes"
  },
  "next": "/play/setup"
}
```

#### 4. Verificación Directa en Base de Datos PostgreSQL

Consulta ejecutada en el host de producción:
- `groups`: Registrado `id: 7ba5bf89-a27f-46df-ad0f-a5bbcff1771f`, `name: "SMOKE PPA-011"`, vinculado a `table_session_id: 2ebeac64-f49f-4e11-b656-802b7e34a940`.
- `participants`: Exactamente 2 filas ordenadas por posición:
  - Posición 1: `id: 6128f122-565c-4fb8-8ea2-5b9dfbb1cf71`, `alias: "Joaco"`, `age_range: "adult"`, `education_level: "higher"`.
  - Posición 2: `id: a2239eb6-cc8e-44c7-a5f1-97b582c81bb4`, `alias: "Santi"`, `age_range: "teen"`, `education_level: "secondary"`.
- `game_sessions`: Exactamente 1 fila creada:
  - `id: 9ab739f6-bd31-4fcf-a6c1-6e14aa5bb47c`
  - `status: "created"` (CONFIRMADO: no está activa)
  - `started_at: null` (CONFIRMADO: el temporizador no se ha iniciado)
  - `category_id: "c9b438a7-920c-4511-9e59-6113caaabf75"` (Deportes)
- `game_questions`: Conteo `0` (CONFIRMADO: no se generó ninguna pregunta de partida).
- `audit_events`: 3 eventos transaccionales inmutables registrados en `created_at: 2026-11-25T16:31:02.155Z`:
  - `group_created`
  - `participants_configured`
  - `game_setup_created`

#### 5. Recuperación y Vista de Resumen tras Recarga

Comando ejecutado:
```bash
curl -s -i -b /tmp/ppa11_cookie.txt https://app.puntoburger.com.ar/play/setup
```

Resultado:
- `HTTP/2 200 OK`
- Renderizó la pantalla de resumen:
  - Encabezado: "¡Equipo listo!"
  - Subtítulo: "SMOKE PPA-011"
  - Mensaje: "Ya está todo preparado para jugar."
  - Jugadores (2): "Joaco, Santi"
  - Categoría: "Deportes"
  - Botón secundario habilitado: "Modificar equipo o categoría"
  - Botón principal deshabilitado (placeholder PPA-012): `<button type="button" disabled ...>Empezar partida</button>` con leyenda "La trivia de 10 preguntas se activará en el próximo paso (PPA-012)."

#### 6. Prueba de Edición e Idempotencia

Se ejecutó una solicitud de modificación sobre la partida en estado `created`:
```bash
curl -s -i -b /tmp/ppa11_cookie.txt -X POST https://app.puntoburger.com.ar/api/v1/games/setup \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "SMOKE PPA-011 EDITADO",
    "categorySlug": "historia",
    "participants": [
      { "alias": "Joaco", "ageRange": "adult", "educationLevel": "higher" },
      { "alias": "Santi", "ageRange": "teen", "educationLevel": "secondary" },
      { "alias": "Flor", "ageRange": "adult", "educationLevel": "none" }
    ]
  }'
```

Resultado verificado:
- `HTTP/2 200 OK`
- `group.id: 7ba5bf89-a27f-46df-ad0f-a5bbcff1771f` (mismo ID de grupo preservado, sin duplicados).
- `group.name: "SMOKE PPA-011 EDITADO"`.
- 3 participantes con posiciones 1, 2 y 3 ("Joaco", "Santi", "Flor").
- `gameSession.id: 9ab739f6-bd31-4fcf-a6c1-6e14aa5bb47c` (mismo ID de game session preservado, sin duplicados).
- `categorySlug: "historia"`.
- Base de datos: `SELECT COUNT(*) FROM groups WHERE table_session_id = ...` = `1`.
- Base de datos: `SELECT COUNT(*) FROM game_sessions WHERE table_session_id = ...` = `1`.

#### 7. Limpieza de Sesión y Restauración de Mesa

Se realizó la liberación controlada de la sesión de prueba:
1. `devices`: Estado actualizado a `revoked` con `revoked_at = NOW()`.
2. `table_sessions`: Estado actualizado a `closed` con `closed_at = NOW()`, `cooldown_until = NOW() + 120s`, y `active_device_id = NULL`.
3. `tables`: Estado actualizado a `cooldown`.
4. Eventos de auditoría registrados: `session_closed` y `table_cooldown_started`.
5. Verificación de cooldown: Intento de claim durante cooldown devolvió `HTTP 409 TABLE_COOLDOWN`.
6. Simulación de vencimiento de cooldown y consulta a `GET /table/mesa-01`: la normalización perezosa (lazy normalization) actualizó automáticamente `tables.status` a `available`.
7. Verificación final de base de datos en producción:
   - `mesa-01.status`: `available`
   - Sesiones activas en el sistema: `0`
   - Dispositivos activos en el sistema: `0`
   - La pantalla `GET /table/mesa-01` renderiza el formulario de acceso para nuevos comensales.

---

**Resultado Oficial de Validación:**
`PPA-011 PRODUCTION SMOKE TEST = PASSED`
