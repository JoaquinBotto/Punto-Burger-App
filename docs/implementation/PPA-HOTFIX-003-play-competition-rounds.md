# PPA-HOTFIX-003 — /play Compatible con Competition Rounds Mixtos

## 1. Contexto y Diagnóstico del Incidente en Producción

Durante las pruebas reales con comensales en el local físico de Punto Burger Esperanza:

1. Una mesa escaneó el QR permanente e ingresó a la competencia en modo `OPEN`.
2. Completó exitosamente el wizard de equipo y participantes (`/play/setup`).
3. Se inscribió en el torneo (`POST /api/v1/competitions/current/join`) y preparó el Ciclo 1 (`POST /api/v1/competitions/current/rounds/next`).
4. Al navegar a `/play`, la pantalla quedaba en un ciclo infinito de carga o volvía a redirigir a `/play/setup`.

### Causa Raíz Confirmada en Código

En la arquitectura de torneos (`competition.service.ts`), las partidas competitivas se generan deliberadamente con `categoryId: null` porque cada ciclo utiliza un blueprint de categorías temáticas mixtas (1 a 2 por categoría).

Sin embargo, en `src/modules/trivia/game-preparation.service.ts`:

```ts
const gameSession = await getGameSessionByTableSessionId(db, session.id);
if (!gameSession || !gameSession.categoryId) {
  throw new GameNotConfiguredError('No se encontró la partida configurada.');
}
```

Esto provocaba que:

- `gameSession.categoryId == null`
- `getPlayPageData()` lanzara `GameNotConfiguredError`
- `/play` atrapara el error y ejecutara `redirect('/play/setup')`
- `/play/setup` detectara que el round ya existía (`activeGameSessionId`) y redirigiera nuevamente a `/play`
- Bucle de carga infinito visible para el cliente antes de poder comenzar la partida.

---

## 2. Solución Arquitectónica Implementada

### 2.1 Detección Limpia de Competition Rounds en Dominio

Se implementó `getCompetitionRoundByGameSessionId` en [competition.repository.ts](file:///Users/jjoaco/Documents/Punto-Papas-App/src/modules/competitions/competition.repository.ts):

- Cuando `gameSession.categoryId == null`, se verifica si `gameSession.id` está vinculada a una fila en `competition_rounds`.
- Si existe:
  - Es una ronda competitiva válida (`mode = 'competition'`).
  - Se obtienen `roundNumber` (1 | 2 | 3) y los metadatos de la competencia (`competition.id`, `competition.name`).
  - Se asigna un view-model seguro de categoría sin alterar la base de datos:
    `category = { slug: 'mixed', name: 'Categorías mixtas' }`.
- Si `gameSession.categoryId == null` y **no** existe `competition_round`: se arroja `GameNotConfiguredError` (partida casual mal configurada).

### 2.2 Derivación Dinámica de la Curva de Dificultad (Sin Hardcodear 3/4/3)

En `getPlayPageData()` de [game-preparation.service.ts](file:///Users/jjoaco/Documents/Punto-Papas-App/src/modules/trivia/game-preparation.service.ts):

- Se analiza la colección de preguntas congeladas de la partida (`game_questions`):
  - Conteo de `initial`, `medium` y `advanced`.
- Esto refleja con precisión matemática la curva real de cada ciclo:
  - **Ciclo 1**: 5 iniciales, 4 intermedias, 1 avanzada (5/4/1).
  - **Ciclo 2**: 3 iniciales, 4 intermedias, 3 avanzadas (3/4/3).
  - **Ciclo 3**: 1 inicial, 4 intermedias, 5 avanzadas (1/4/5).
  - **Casual**: 3 iniciales, 4 intermedias, 3 avanzadas (3/4/3).

### 2.3 Interfaz de Usuario Pre-Juego y Botones Contextuales

En [play-game.tsx](file:///Users/jjoaco/Documents/Punto-Papas-App/src/app/play/play-game.tsx):

- Título principal: muestra el nombre de la competencia oficial o `'¡Todo listo!'` en casual.
- Subtítulo: indica `"Ciclo X de 3"` en torneo.
- Ficha de resumen:
  - Fila `"Modalidad: Categorías mixtas"`.
  - Fila `"Ronda: Ciclo X de 3"`.
  - Bloques de dificultad con conteos reales (`structure.initial`, `structure.medium`, `structure.advanced`).
- Botón de acción: muestra `"Comenzar Ciclo 1"`, `"Comenzar Ciclo 2"`, `"Comenzar Ciclo 3"`, o `"Comenzar"` en partidas casuales.

### 2.4 Resiliencia en Runtime y Pantalla de Resultados

- [gameplay.service.ts](file:///Users/jjoaco/Documents/Punto-Papas-App/src/modules/trivia/gameplay.service.ts):
  - `startGame()`: opera exclusivamente sobre `session`, `device`, y 10 `game_questions` preparadas; cero dependencia de `categoryId`.
  - `getGameState()`: cuando `categoryId` es null, expone `{ slug: 'mixed', name: 'Categorías mixtas' }`.
  - `getGameResults()`: genera el breakdown completo y entrega categoría mixta sin fallar.
- [results-client.tsx](file:///Users/jjoaco/Documents/Punto-Papas-App/src/app/play/results/results-client.tsx): null-safety reforzado en visualización de resultados.

---

## 3. Pruebas y Cobertura Automatizada

1. **Test Crítico de Regresión (Sección 12)**:
   - `getPlayPageData()` con `categoryId = null`, `roundNumber = 1` y 10 preguntas (5/4/1): retorna `mode = 'competition'`, `roundNumber = 1`, `structure = 5/4/1`, `category.name = "Categorías mixtas"`, sin errores.
2. **Test de Regresión Casual (Sección 13)**:
   - `getPlayPageData()` con `categoryId != null`: retorna `mode = 'casual'`, categoría real y estructura 3/4/3.
   - `getPlayPageData()` con `categoryId = null` sin competition round: arroja `GameNotConfiguredError`.
3. **Test de UI `/play` (Sección 14)**:
   - Renderizado de `PlayPage` con round competitivo: no redirige a `/play/setup`, renderiza `PlayGame` con botón _"Comenzar Ciclo 1"_ y bloques 5/4/1.
4. **Flujo Completo de Juego E2E en Torneo (Sección 15 y 16)**:
   - [competition-play-flow.test.ts](file:///Users/jjoaco/Documents/Punto-Papas-App/src/modules/competitions/competition-play-flow.test.ts):
     - `getPlayPageData` -> `startGame` (Q1 inicial activa) -> `getGameState` -> 10 preguntas respondidas y avanzadas -> `getGameResults` completado con desglose 5/4/1.

Total: **49 suites de prueba, 268 tests pasando al 100%**.
Build de producción: Next.js 16.4.5 compilado exitosamente.
