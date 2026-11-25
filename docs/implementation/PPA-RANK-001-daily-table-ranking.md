# PPA-RANK-001: Ranking Diario Competitivo entre Mesas

## 1. Identificación

| Campo                           | Valor                                               |
| ------------------------------- | --------------------------------------------------- |
| **Ticket**                      | PPA-RANK-001                                        |
| **Título**                      | Ranking Diario Competitivo entre Mesas              |
| **Estado**                      | **CLOSED**                                          |
| **Fecha de Validación**         | 2026-11-25                                          |
| **Ambiente Oficial**            | Producción (`https://app.puntoburger.com.ar`)       |
| **Servidor Host**               | DonWeb Cloud Server Ubuntu 24.04 (Node.js 24 + PM2) |
| **Base de Datos**               | Supabase PostgreSQL vía Direct Connection `:5432`   |
| **Commit Funcional Desplegado** | `6c052266903d0b9ffe1222cacfeb411505f15ff0`          |
| **Resultado Smoke Test**        | **PASSED (100%)**                                   |
| **Resultado Human Demo**        | **PASSED (100%)**                                   |

---

## 2. Resumen Ejecutivo

PPA-RANK-001 incorpora el primer sistema de competencia inter-mesa oficial de Punto Burger. El mecanismo introduce un ranking diario completamente automatizado que clasifica a las mesas físicas del local gastronómico de Esperanza en base a su **mejor partida oficial elegible del día**, sin duplicar entradas por mesa y sin otorgar ventajas a mesas con mayor rotación de comensales.

### Principios Fundamentales Implementados

1. **Una sola entrada por mesa por día:** cada mesa física aparece a lo sumo una vez en el ranking diario con su mejor registro oficial.
2. **Zona horaria oficial `America/Argentina/Cordoba`:** cálculo exacto del día local civil (00:00:00 a 23:59:59.999 UTC-3 permanente sin horario de verano), reiniciando el ranking a medianoche sin borrar el historial técnico.
3. **Control estricto de elegibilidad (`ranking_eligible`):** adición del campo booleano `ranking_eligible` en `game_sessions`. Migración incremental que convirtió todas las partidas históricas previas a `false` y fijó el default para nuevas partidas en `true`.
4. **Protección absoluta de privacidad y Cero PII:** el ranking público compite exclusivamente entre **Mesas** (ej. "Mesa 01", "Mesa 07"). Nunca expone nombres de equipo libres escritos por usuarios, alias de participantes, menores de edad ni IDs internos.
5. **Criterios de desempate en cascada:**
   - 1º Mayor `total_score`
   - 2º Mayor `correct_count`
   - 3º Menor tiempo total de respuesta acumulado de preguntas contestadas (`total_response_time_ms`)
   - 4º Partida completada más temprano (`finished_at` ASC)
     _(La velocidad no agrega puntos; solo desempata)._
6. **Contrato de API TV-Ready:** endpoints diseñados para ser consumidos tanto por clientes móviles como por la futura cartelería digital en pantallas físicas.
7. **Interfaz Mobile-First `/ranking`:** diseño visual oficial Punto Burger (PPA-UI-001) con podio destacado para el Top 3 (Oro, Plata, Bronce), lista Top 10, tarjeta contextual "Tu mesa", refresco periódico cada 15 segundos y detección de medianoche.
8. **Integración con `/play/results`:** visualización de récord diario de la mesa, distinción de nuevo récord ("🔥 ¡Nuevo récord de Mesa 01!") y acceso directo al ranking.

---

## 3. Arquitectura y Modelo de Datos

### 3.1 Migración Incremental Drizzle (`0003_typical_moon_knight.sql`)

```sql
ALTER TABLE "game_sessions" ADD COLUMN "ranking_eligible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ALTER COLUMN "ranking_eligible" SET DEFAULT true;--> statement-breakpoint
CREATE INDEX "game_sessions_ranking_idx" ON "game_sessions" USING btree ("status","ranking_eligible","finished_at");
```

- **Paso 1:** Al agregar la columna con `DEFAULT false NOT NULL`, PostgreSQL pobló inmediatamente todas las filas históricas existentes (pruebas técnicas, smoke tests e iniciales) con `false`.
- **Paso 2:** Se modificó el `DEFAULT` de la columna a `true`, asegurando que todas las partidas normales creadas en adelante sean elegibles por defecto.
- **Paso 3:** Se creó el índice `game_sessions_ranking_idx` sobre `("status", "ranking_eligible", "finished_at")` optimizando las consultas del ranking diario.

Verificación en producción:

```json
Column info: [ { column_name: 'ranking_eligible', column_default: 'true', is_nullable: 'NO' } ]
Counts by ranking_eligible: [ { ranking_eligible: false, total: 7 } ]
```

### 3.2 Consulta SQL de Ranking Diario

```sql
WITH eligible_games AS (
  SELECT
    gs.id AS game_session_id,
    ts.table_id,
    t.code AS table_code,
    t.display_name AS table_display_name,
    gs.total_score,
    gs.correct_count,
    gs.finished_at,
    COALESCE(rt.total_response_time_ms, 0) AS total_response_time_ms,
    ROW_NUMBER() OVER (
      PARTITION BY ts.table_id
      ORDER BY
        gs.total_score DESC,
        gs.correct_count DESC,
        COALESCE(rt.total_response_time_ms, 0) ASC,
        gs.finished_at ASC
    ) AS table_rank
  FROM game_sessions gs
  JOIN table_sessions ts ON ts.id = gs.table_session_id
  JOIN tables t ON t.id = ts.table_id
  LEFT JOIN (
    SELECT
      a.game_session_id,
      COALESCE(SUM(
        CASE
          WHEN a.result IN ('correct', 'incorrect')
               AND a.answered_at IS NOT NULL
               AND gq.presented_at IS NOT NULL
               AND a.answered_at >= gq.presented_at
          THEN GREATEST(0, EXTRACT(EPOCH FROM (a.answered_at - gq.presented_at)) * 1000)
          ELSE 0
        END
      ), 0)::bigint AS total_response_time_ms
    FROM answers a
    JOIN game_questions gq ON gq.id = a.game_question_id
    GROUP BY a.game_session_id
  ) rt ON rt.game_session_id = gs.id
  WHERE gs.status = 'completed'
    AND gs.ranking_eligible = true
    AND gs.finished_at >= $1
    AND gs.finished_at <= $2
)
SELECT
  ROW_NUMBER() OVER (
    ORDER BY
      total_score DESC,
      correct_count DESC,
      total_response_time_ms ASC,
      finished_at ASC
  )::int AS position,
  table_id,
  table_code,
  table_display_name,
  game_session_id,
  total_score,
  correct_count,
  total_response_time_ms,
  finished_at
FROM eligible_games
WHERE table_rank = 1
ORDER BY position ASC
LIMIT $3;
```

---

## 4. Endpoints y Superficie de API

### 4.1 Endpoint Público: `GET /api/v1/rankings/daily`

- **Autenticación:** Pública (sin cookie).
- **Parámetros opcionales:** `limit` (default 10, máx 50), `date` (YYYY-MM-DD para consultas de auditoría).
- **Respuesta estándar:**

```json
{
  "ok": true,
  "date": "2026-11-25",
  "timezone": "America/Argentina/Cordoba",
  "generatedAt": "2026-11-25T23:20:00.729Z",
  "ranking": [
    {
      "position": 1,
      "table": {
        "code": "mesa-01",
        "name": "Mesa 01"
      },
      "score": 590,
      "correctCount": 3
    }
  ]
}
```

### 4.2 Endpoint Contextual de Mesa: `GET /api/v1/rankings/daily/me`

- **Autenticación:** Requiere cookie `pb_table_session`.
- **Comportamiento:** Devuelve el estado de la mesa del usuario dentro del ranking, incluyendo mesas fuera del Top 10 y cálculo de brecha de puntos con el puesto inmediatamente superior (`gapToPrevious`).

```json
{
  "ok": true,
  "authenticated": true,
  "ranked": true,
  "position": 1,
  "table": {
    "code": "mesa-01",
    "name": "Mesa 01"
  },
  "bestScore": 590,
  "correctCount": 3,
  "gapToPrevious": null,
  "previousPosition": null
}
```

---

## 5. Validación en Producción (Smoke Test)

Se ejecutó el smoke test automatizado `scripts/smoke-ranking.mjs` contra `https://app.puntoburger.com.ar` con el código vigente `SCU43`:

1. **Ranking inicial:** Se confirmó vacío `ranking: []` al estar excluidas todas las partidas históricas.
2. **Exclusión de partidas no elegibles:** Se creó una partida, se marcó `ranking_eligible = false` vía SSH, se jugaron las 10 preguntas y se verificó que **NO apareció** en `/api/v1/rankings/daily`.
3. **Partida oficial elegible:** Se creó una partida con `ranking_eligible = true` (default), se completó y se verificó su aparición inmediata como **Puesto #1**.
4. **Verificación de resultados `/play/results`:** Renderizó el bloque `Ranking de Hoy` con el mensaje `🔥 ¡Nuevo récord de Mesa 01!`.
5. **Verificación `/api/v1/rankings/daily/me`:** Confirmó `ranked: true`, `position: 1`.
6. **Verificación `/api/v1/rankings/daily`:** Confirmó la mesa clasificada sin filtración de nombres de grupo ni participantes.
7. **Verificación `/ranking`:** Renderizó la pantalla pública con Mesa 01 en el podio.
8. **Cierre de sesión y cooldown:** Se cerró la sesión y se restableció el estado de Mesa 01 a `available`.

### Verificación en Base de Datos de Producción

```text
=== ESTADO ACTUAL MESA 01 ===
Mesa: {
  id: 'c0c02b58-bced-461d-ab53-4c70bca77848',
  code: 'mesa-01',
  status: 'available'
}
Última Sesión: {
  id: '073bba7e-e9fd-4832-923a-4e0a678df24e',
  status: 'closed',
  expiresAt: 2026-11-26T00:48:16.194Z,
  activeDeviceId: 'dffa8334-0e9b-4e85-8a4a-ff185c58b8e1'
}
Partida: {
  id: '537c3166-35a2-493a-b222-4f0e6b8d389a',
  status: 'completed',
  totalScore: 590,
  correctCount: 3,
  incorrectCount: 7,
  unansweredCount: 0,
  finishedAt: 2026-11-25T23:19:50.485Z
}
```

---

## 6. Cobertura de Pruebas Automatizadas

- **Total de pruebas:** **192 tests pasando al 100%** en 38 suites.
- **Nuevas suites incorporadas:**
  - `src/modules/rankings/ranking.service.test.ts` (11 tests unitarios de zona horaria, desempates, cálculo de brecha y ranking)
  - `src/app/api/v1/rankings/daily/route.test.ts` (2 tests de endpoint público y límites)
  - `src/app/api/v1/rankings/daily/me/route.test.ts` (2 tests de endpoint contextual protegido)
  - `src/app/ranking/ranking-client.test.tsx` (4 tests de interfaz de usuario: podio, lista, mesa propia y polling)
- **Suite completa validada:** Prettier, ESLint (0 errores, 0 warnings), TypeScript (`tsc --noEmit`), Vitest, Drizzle Kit y Next.js Build.
