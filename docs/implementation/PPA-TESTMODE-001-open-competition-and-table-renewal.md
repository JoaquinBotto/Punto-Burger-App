# Implementación PPA-TESTMODE-001 — Competencia Abierta + Renovación de Mesas

- **ID del Ticket:** `PPA-TESTMODE-001`
- **Fecha:** 26 de Noviembre de 2026
- **Estado:** `CLOSED`
- **Ambiente:** Producción (`https://app.puntoburger.com.ar`)
- **Commits asociados:**
  - Implementación: _(este commit)_

---

## 1. Resumen Ejecutivo

PPA-TESTMODE-001 habilita la modalidad de **Competencia Abierta (Open Competition)** y la **Renovación Operativa de Mesas (Table Renewal)** para pruebas reales en el local físico de Punto Burger Esperanza:

1. **Dos Modos de Competencia**:
   - `scheduled`: Modo horario tradicional con `registrationOpensAt`, `startsAt`, `joinCutoffAt`, `endsAt` y `finalizationGraceUntil`.
   - `open`: Modo abierto/manual que permanece `status = 'active'` de forma indefinida hasta su finalización manual por el operador (`competition:finalize`), sin evaluar ventanas horarias ni fechas calendario.
2. **Identidad de Participación por Sesión**:
   - La unicidad en `competition_entries` pasa de `UNIQUE(competition_id, table_id)` a `UNIQUE(competition_id, table_session_id)` mediante la migración incremental `0005_glorious_mordo.sql`.
   - Una misma mesa física (`tables.id` / `tables.code`) puede competir múltiples veces dentro de la misma competencia abierta si nuevos grupos de clientes ocupan la mesa con sesiones distintas.
3. **QR Físico Permanente Inmutable**:
   - `tables.qr_token` **no rota ni se modifica**. El mismo código QR pegado en la mesa física sirve permanentemente para todas las ocupaciones sucesivas.
4. **Ranking por Participación (Entry) sin PII individual**:
   - Clasificación directa por `competition_entries` combinada con el grupo: `table.displayName · group.name` (ej. `Mesa 01 · Los Bacon` vs `Mesa 01 · Los Cracks`).
   - Criterios de desempate oficiales:
     1. `totalScore` DESC
     2. `correctCount` DESC
     3. `totalResponseTimeMs` ASC
     4. `completedAt` ASC (nulls last)
     5. `joinedAt` ASC
5. **Renovación Operativa Manual (`npm run table:renew`)**:
   - Permite al personal de salón dejar una mesa limpia e inmediatamente disponible para nuevos comensales.
   - Cierra la sesión activa anterior, revoca el dispositivo, limpia el cooldown y marca la mesa como `available`.
   - Protege partidas activas: si hay una partida en curso (`game_session.status = 'active'`), la CLI aborta con `Hay una partida activa en <Mesa>.`.
   - Admite `--force`: abandona partidas y entradas en curso, cerrando la sesión y liberando la mesa.
   - Conserva estrictamente todo el historial y no borra ninguna entrada, ronda, partida ni respuesta previa del ranking.
6. **Gestión Dinámica de Expiración en Open Mode**:
   - Al unirse a una competencia abierta, la sesión se extiende automáticamente a un mínimo de 120 minutos.
   - Al iniciar el Ciclo 2 o Ciclo 3, si restan menos de 30 minutos de sesión, se extiende a `now + 60` minutos.
7. **Preservación Estricta de Seguridad Wi-Fi**:
   - Mantiene `VENUE_PRESENCE_MODE=enforce` requiriendo token criptográfico HMAC válido de red Wi-Fi para jugar o responder competitivamente.

---

## 2. Modelo Relacional y Migración Incremental

Migración `0005_glorious_mordo.sql`:

```sql
DROP INDEX "competition_entries_competition_table_unique";
ALTER TABLE "competitions" ALTER COLUMN "local_date" DROP NOT NULL;
ALTER TABLE "competitions" ALTER COLUMN "starts_at" DROP NOT NULL;
ALTER TABLE "competitions" ALTER COLUMN "ends_at" DROP NOT NULL;
ALTER TABLE "competitions" ALTER COLUMN "registration_opens_at" DROP NOT NULL;
ALTER TABLE "competitions" ALTER COLUMN "join_cutoff_at" DROP NOT NULL;
ALTER TABLE "competitions" ALTER COLUMN "finalization_grace_until" DROP NOT NULL;
ALTER TABLE "competitions" ADD COLUMN "timing_mode" text DEFAULT 'scheduled' NOT NULL;
CREATE UNIQUE INDEX "competition_entries_competition_table_session_unique" ON "competition_entries" USING btree ("competition_id","table_session_id");
```

---

## 3. CLI y Herramientas Operativas

- **Crear Competencia Abierta**:
  ```bash
  npm run competition:create -- --open --name "Prueba Punto Burger"
  ```
- **Consultar Estado de Competencia**:
  ```bash
  npm run competition:status
  ```
- **Finalizar Competencia**:
  ```bash
  npm run competition:finalize
  ```
- **Renovar Mesa Operativamente**:
  ```bash
  npm run table:renew -- mesa-01
  npm run table:renew -- mesa-01 --force
  ```

---

## 4. Auditoría Server-Side

Eventos registrados:

- `table_renewed`: Notifica la liberación y renovación operativa de la mesa.
- `table_session_closed_by_operator`: Notifica el cierre formal de la sesión previa.
- `competition_entry_abandoned_by_operator`: Notifica si una entrada en progreso fue abandonada mediante `--force`.
  Metadata registrada sin incluir tokens QR: `tableCode`, `oldTableSessionId`, `oldCompetitionEntryId`, `forced`, `timestamp`.
