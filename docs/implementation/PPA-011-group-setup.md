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
