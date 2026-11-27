# PPA-HOTFIX-002 — Reintentos Idempotentes en Competition Setup

## 1. Contexto y Diagnóstico del Incidente en Producción

Durante las pruebas manuales en el local físico de Punto Burger Esperanza:

1. Mesa 01 ingresó mediante el QR permanente (`/t/<qrToken>`).
2. Reclamó la mesa e ingresó a `/play/setup`.
3. Completó nombre de equipo y jugadores y pulsó _"Entrar a la competencia y comenzar"_.
4. El backend guardó la configuración (`/api/v1/games/setup`), inscribió la mesa (`/api/v1/competitions/current/join`) y preparó el Ciclo 1 congelando las 10 preguntas en `game_questions`.
5. El navegador del cliente experimentó un microcorte o cambio momentáneo de red Wi-Fi antes de completar la navegación a `/play`.
6. El usuario volvió a pulsar el botón de submit.
7. El endpoint `/api/v1/games/setup` ejecutó `replaceGroupParticipants()`, que contenía una instrucción destructiva:
   ```sql
   DELETE FROM "participants" WHERE "participants"."group_id" = $1
   ```
8. La consulta falló con un error 500 de PostgreSQL:
   ```text
   Failed query: delete from "participants" where "participants"."group_id" = $1
   error: update or delete on table "participants" violates foreign key constraint "game_questions_target_participant_id_participants_id_fk" on table "game_questions"
   Detail: Key (id)=(...) is still referenced from table "game_questions".
   ```
   Debido a que `game_questions.target_participant_id` tiene `ON DELETE RESTRICT`.

Adicionalmente, si el setup hubiera continuado en un retry, los endpoints subsecuentes (`/join` y `/rounds/next`) arrojaban excepciones (`CompetitionRoundAlreadyExistsError`, etc.), impidiendo la recuperación transparente del cliente ante reintentos de red.

---

## 2. Solución Arquitectónica Implementada

### 2.1 Preservación Inmutable de Participantes en Repositorio (`participants.repository.ts`)

- Se rediseñó `replaceGroupParticipants()` para **nunca eliminar participantes que puedan estar referenciados**.
- En lugar de `DELETE + INSERT`, realiza una **reconciliación posicional in-place**:
  - Para cada posición existente (1..N): si el alias, edad o educación cambiaron, ejecuta un `UPDATE` conservando el UUID (`participants.id`). Si no cambiaron, no muta la base de datos.
  - Si el nuevo listado tiene más participantes que el existente, inserta únicamente los adicionales.
  - Si el nuevo listado tiene menos participantes, elimina de forma controlada únicamente los sobrantes no referenciados.
  - Los IDs de participantes permanecen estables a lo largo de todo el ciclo de vida de la mesa.

### 2.2 Idempotencia y Bloqueo de Setup (`groups.service.ts`)

- Se implementó la verificación de partidas preparadas (`countGameQuestionsBySessionId > 0`) o activas/completadas.
- **Comparación semántica profunda**: se contrasta el payload recibido (`groupName`, `categorySlug`, `participants`) contra la configuración persistida en PostgreSQL.
- **Idempotencia exitosa (200 OK)**: si el payload coincide exactamente con el estado persistido, retorna exitosamente el grupo y participantes existentes sin ejecutar ninguna mutación ni modificar UUIDs.
- **Bloqueo controlado (409 Conflict)**:
  - Si el juego ya está iniciado (`active` o `completed`) y el payload difiere: arroja `GameAlreadyStartedError` (`GAME_ALREADY_STARTED`, HTTP 409).
  - Si las preguntas ya fueron congeladas (`game_questions` preparadas) y el payload difiere: arroja la nueva excepción `SetupAlreadyLockedError` (`SETUP_ALREADY_LOCKED`, HTTP 409) con mensaje de usuario amigable:
    > _"La partida ya fue preparada. Continuá jugando para no perder el progreso."_
  - Ningún reintento de red o doble clic arroja un error 500 no controlado.

### 2.3 Idempotencia en Inscripción a Competencia (`competition.service.ts`)

- En `joinCompetition()`: antes de verificar el horario de corte (`joinCutoffAt`) o crear un nuevo registro en `competition_entries`, se consulta si la `tableSessionId` ya cuenta con una inscripción previa en la competencia activa.
- Si ya existe una inscripción: retorna inmediatamente la entrada existente (`200 OK`) sin arrojar error ni duplicar filas.

### 2.4 Idempotencia en Preparación y Avance de Rondas (`competition.service.ts`)

- En `prepareCompetitionRound()` y `startNextCompetitionRound()`:
  - Si la ronda solicitada ya fue creada y se encuentra en estado `created` o `active`, retorna inmediatamente:
    ```json
    {
      "ok": true,
      "existing": true,
      "roundNumber": 1,
      "gameSessionId": "...",
      "next": "/play"
    }
    ```
    en lugar de fallar con `CompetitionRoundAlreadyExistsError` o `PreviousRoundNotCompletedError`.
  - La limpieza de sesiones de juego huérfanas solo elimina sesiones que **no** pertenezcan a ninguna ronda de competencia.

### 2.5 Resiliencia en Wizard de Configuración (`play-setup-wizard.tsx`)

- Se agregó el flag de control `setupSaved`: una vez guardado exitosamente el setup, las llamadas subsiguientes no reintentan `POST /api/v1/games/setup`.
- Antes de iniciar la secuencia de submit, consulta el estado de la competencia en el servidor (`GET /api/v1/competitions/current/state`).
- Si detecta que la mesa ya posee una ronda activa (`activeGameSessionId`), navega inmediatamente a `/play`.
- Si se carga `/play/setup` con una ronda ya preparada o activa, la interfaz bloquea la edición de participantes y presenta un botón de acción directa _"Continuar Ciclo X"_ que redirige a `/play`.
- Manejo elegante de `SETUP_ALREADY_LOCKED`: si el backend responde 409, informa amigablemente al comensal y ofrece continuar la partida.

### 2.6 Renovación de Mesa y Abandono de Competencia (`table-renewal.service.ts`)

- Se actualizó el servicio de renovación operativa de mesas para que tanto `table:renew` estándar (cuando la mesa no tiene partida activa) como `table:renew --force` marquen cualquier `competition_entry` asociada en estado `registered` o `active` como `abandoned`.

---

## 3. Pruebas Automatizadas y Cobertura

Se diseñó la suite exhaustiva `src/modules/competitions/competition-setup-idempotency.test.ts` que valida:

- **Sección 17**: Simulación de pérdida de respuesta y reintento de red.
  - Setup idempotent retry no altera `participant.id` ni arroja error de foreign key.
  - Join idempotent retry reutiliza la entrada existente sin duplicar registros.
  - Next round retry retorna la ronda en curso (`existing: true`) sin errores.
- **Sección 18**: Rechazo controlado de mutaciones sobre partidas congeladas.
  - Intentar cambiar nombre de equipo, categoría o jugadores una vez congeladas las preguntas devuelve HTTP 409 `SETUP_ALREADY_LOCKED`.
- **Sección 19**: Recuperación de presencia y reconexión de red.
  - Interrupción temporal de red en el cliente reanuda fluidamente la partida en curso.

Total de tests del proyecto: **48 suites de pruebas, 259 tests pasando al 100%**.
Build de producción Next.js 16.4.5: compilación exitosa sin advertencias ni errores de TypeScript.
