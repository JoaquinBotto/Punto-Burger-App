# PPA-013: Gameplay E2E y Primera Demo Jugable para Usuarios de Prueba

## 1. Identificación

| Campo                    | Valor                                                       |
| ------------------------ | ----------------------------------------------------------- |
| **Ticket**               | PPA-013                                                     |
| **Título**               | Gameplay E2E / Primera Demo Jugable para Usuarios de Prueba |
| **Estado**               | **CLOSED**                                                  |
| **Fecha de Validación**  | 2026-11-25                                                  |
| **Ambiente Oficial**     | Producción (`https://app.puntoburger.com.ar`)               |
| **Servidor Host**        | DonWeb Cloud Server Ubuntu 24.04 (Node.js 24 + PM2)         |
| **Base de Datos**        | Supabase PostgreSQL vía Direct Connection `:5432`           |
| **Commit Desplegado**    | `52cb9cbdda190a320ec4fa9275ccd0f523a7d47c`                  |
| **Resultado Smoke Test** | **PASSED (100%)**                                           |
| **Resultado Human Demo** | **PASSED (100%)**                                           |

---

## 2. Resumen Ejecutivo

PPA-013 completa la primera experiencia interactiva jugable de extremo a extremo (E2E) para usuarios de prueba en el local de Punto Burger Esperanza.

A partir de este hito, comensales reales sentados en la **Mesa 01** pueden:

1. Escanear el código QR físico de su mesa (`/table/mesa-01`).
2. Ingresar el código temporal dinámico visible en las pantallas del local.
3. Configurar su equipo, participantes (con perfiles y rangos etarios) y categoría temática.
4. Congelar las 10 preguntas adaptadas (distribución pedagógica 3/4/3).
5. Tocar **"Comenzar"** para activar la partida con temporizador autoritativo de servidor (20 segundos por pregunta).
6. Responder secuencialmente las 10 preguntas (opciones A/B/C/D con confirmación explícita).
7. Recibir feedback inmediato con respuesta correcta y contexto explicativo.
8. Acumular puntuación oficial sin bonificaciones por velocidad.
9. Acceder a la pantalla de resultados finales (`/play/results`) con desglose por dificultad.
10. Finalizar la experiencia voluntariamente, liberando la mesa con ventana de cooldown y normalización perezosa automática.

---

## 3. Arquitectura y Mecánicas de Juego

### 3.1 Sistema de Puntuación Oficial del MVP (Sin Bonus de Velocidad)

Conforme a las especificaciones funcionales aprobadas en `specs/03-game-mechanics.md` y `specs/06-technical-architecture.md`:

| Dificultad                     | Respuesta Correcta | Respuesta Incorrecta | Sin Responder (Tiempo Agotado) |
| ------------------------------ | ------------------ | -------------------- | ------------------------------ |
| **Inicial** (Preguntas 1..3)   | **+100 puntos**    | **+20 puntos**       | **0 puntos**                   |
| **Media** (Preguntas 4..7)     | **+150 puntos**    | **+20 puntos**       | **0 puntos**                   |
| **Avanzada** (Preguntas 8..10) | **+200 puntos**    | **+20 puntos**       | **0 puntos**                   |

- **Puntaje Máximo Teórico:** $3 \times 100 + 4 \times 150 + 3 \times 200 = 300 + 600 + 600 = \mathbf{1.500\text{ puntos}}$.
- **Sin Bonificación por Velocidad:** El tiempo restante **no altera los puntos**. Responder en 2 segundos otorga exactamente la misma puntuación que responder en 18 segundos.
- **Sin Puntos Negativos:** No se penalizan errores con puntajes negativos; las respuestas incorrectas reconocen la participación otorgando 20 puntos de cortesía.

### 3.2 Autoridad Absoluta del Temporizador Server-Side

- **Duración por Pregunta:** 20 segundos autoritativos (`expires_at = presented_at + INTERVAL '20 seconds'`).
- **Validación Temporal:** Una respuesta es válida si y solo si `server_now <= expires_at`.
- **Normalización Perezosa de Expiración (Lazy Timeout):** Si una solicitud consulta el estado o intenta responder una vez superado `expires_at`, el servidor registra automáticamente una fila en `answers` con `result = 'unanswered'`, `points_awarded = 0`, incrementa `unanswered_count` y registra auditoría.
- **Resistencia ante Recargas:** El cliente recibe marcas de tiempo ISO autoritativas (`serverNow`, `expiresAt`) para sincronizar el temporizador visual (`GameTimer`), por lo que recargar el navegador no reinicia el tiempo restante.

### 3.3 Garantía Estricta de Cero Fugas (Zero-Leakage Security)

Mientras una pregunta permanezca abierta (no resuelta):

- Los Route Handlers **nunca transmiten** `correct_option_snapshot`, `explanation_snapshot` ni preguntas futuras en los payloads JSON.
- El HTML generado por Server Components en `/play` **no contiene** textos ni identificadores de respuestas correctas.
- Solo una vez confirmada la respuesta o agotado el tiempo de servidor, se libera el feedback con la opción correcta y su explicación.

---

## 4. Endpoints de la API (`/api/v1/*`)

| Método | Endpoint                 | Descripción                                                                                                                    | Transaccionalidad / Idempotencia                                                                   |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `POST` | `/api/v1/games/start`    | Inicia la partida congelada. Establece `status = 'active'`, `started_at = NOW()` y activa temporizador para la pregunta 1.     | `SELECT ... FOR UPDATE`. Idempotente ante llamadas sucesivas si la partida ya está activa.         |
| `GET`  | `/api/v1/games/state`    | Consulta el estado actual. Entrega pregunta abierta sanitizada o feedback resuelto. Realiza normalización perezosa si expiró.  | Operación segura sin filtraciones.                                                                 |
| `POST` | `/api/v1/games/answer`   | Registra respuesta (`selectedOption: 'A'\|'B'\|'C'\|'D'`). Aplica cálculo de puntos server-side y actualiza contadores.        | `SELECT ... FOR UPDATE`. Idempotente (re-envíos de la misma pregunta devuelven el mismo feedback). |
| `POST` | `/api/v1/games/advance`  | Avanza a la siguiente pregunta activando su temporizador de 20s, o finaliza la partida (`status = 'completed'`).               | Valida que la pregunta actual esté resuelta. Si posición = 10, redirige a `/play/results`.         |
| `POST` | `/api/v1/sessions/close` | Cierra voluntariamente la sesión de mesa. Revoca el dispositivo activo, coloca la mesa en `cooldown` (120s) y borra la cookie. | Transaccional atómica. Emite cabecera `Set-Cookie: pb_table_session=; Expires=Thu, 01 Jan 1970`.   |

---

## 5. Componentes e Interfaz de Usuario Oficial

1. **`GameTimer` (`src/components/ui/game-timer.tsx`):**
   - Cuenta regresiva fluida de 20 segundos basada en el desfase sincronizado con el reloj del servidor.
   - Barra de progreso interactiva: amarillo institucional en conteo regular, rojo vibrante pulsante en los últimos 5 segundos.
   - Callback automático `onTimeout` para invocar al servidor al agotarse el tiempo.

2. **`PlayGame` (`src/app/play/play-game.tsx`):**
   - Pantalla interactiva que maneja el ciclo de vida completo del juego:
     - Vista preparatoria con botón **"Comenzar"** habilitado.
     - Indicador de destinatario: `"Pregunta para [Alias]"` (con badge) o `"Pregunta grupal (¡debatan en equipo!)"`.
     - 4 botones de opciones (A/B/C/D) con área táctil accesible y estados visuales (seleccionado, correcto en verde, incorrecto en rojo).
     - Tarjeta de feedback inmediato con explicación didáctica y botón para avanzar.

3. **`ResultsClient` (`src/app/play/results/results-client.tsx`):**
   - Pantalla oficial de resultado final:
     - Nombre del equipo y categoría jugada.
     - Puntaje destacado (`XXX / 1500 pts`) con cálculo porcentual de rendimiento.
     - Métricas rápidas: Correctas (verde), Incorrectas (rojo), Sin responder (amarillo).
     - Desglose didáctico por nivel de dificultad (Inicial, Intermedia, Avanzada).
     - Botón **"Finalizar experiencia"** que libera la mesa y retorna al comensal al inicio.

4. **Depuración de Textos de Desarrollo:**
   - Se eliminaron leyendas temporales (`"PPA-013"`, `"fase de desarrollo"`, `"en construcción"`) de `/`, `/play` y componentes públicos, garantizando un aspecto de producto final pulido.

---

## 6. Cobertura de Pruebas Automatizadas

El proyecto cuenta con **173 pruebas unitarias e integradas pasando al 100%** en Vitest a lo largo de **34 archivos de prueba**:

- `src/modules/trivia/scoring.test.ts`: 6 pruebas (fórmulas por dificultad, 20 pts por error, 0 pts sin responder, 1500 pts máximo, reconciliación).
- `src/modules/trivia/gameplay.service.test.ts`: 13 pruebas (inicio de partida, autoridad de temporizador, lazy timeout, idempotencia, avance, cálculo de puntajes sin bonus de velocidad, finalización de partida y cierre de sesión).
- `src/app/api/v1/games/start/route.test.ts`: 2 pruebas (autorización por cookie, inicio exitoso de pregunta 1).
- `src/app/api/v1/games/state/route.test.ts`: 2 pruebas (consulta segura, cero filtración de respuestas).
- `src/app/api/v1/games/answer/route.test.ts`: 3 pruebas (validación Zod A/B/C/D, cálculo de puntos, registro).
- `src/app/api/v1/games/advance/route.test.ts`: 3 pruebas (bloqueo ante pregunta no resuelta, avance secuencial, redirección al completar pos 10).
- `src/app/api/v1/sessions/close/route.test.ts`: 2 pruebas (cierre atómico, eliminación de cookie `pb_table_session`).
- `src/app/play/page.test.tsx`: 4 pruebas (redirecciones de seguridad, botón Comenzar habilitado, redirección de partida completada).
- `src/app/play/results/page.test.tsx`: 2 pruebas (protección de sesión, renderizado íntegro de resultados y desglose).

---

## 7. Registro del Smoke Test E2E en Producción

El 25 de noviembre de 2026 se ejecutó exitosamente el **Smoke Test Real de Producción** contra el servidor DonWeb:

- **Dominio:** `https://app.puntoburger.com.ar`
- **Commit Desplegado:** `52cb9cbdda190a320ec4fa9275ccd0f523a7d47c`
- **Base de Datos:** Supabase PostgreSQL vía Direct Connection `:5432`

### Evidencias del Flujo Ejecutado (11 Fases)

1. **Obtención del Código Temporal Real:**
   - Local: _Punto Burger Esperanza_
   - Código temporal utilizado: `4SZ9H` (expiración: 257 segundos).

2. **Reclamo de Mesa 01 (`POST /api/v1/tables/claim`):**
   - Estado: `HTTP/2 200 OK`.
   - Mesa: _Mesa 01_, estado `active`, cookie segura `pb_table_session` emitida.

3. **Configuración de Grupo (`POST /api/v1/games/setup`):**
   - Grupo: `"SMOKE PPA-013"`.
   - Participantes: Joaco (adulto, educación superior, pos 1), Santi (adolescente, educación secundaria, pos 2).
   - Categoría: `"deportes"` (_Deportes_).
   - Estado resultante: `game_session.status = 'created'`, `total_score = 0`.

4. **Preparación y Congelado (`POST /api/v1/games/prepare`):**
   - Estado: `HTTP/2 200 OK`. Exactamente 10 preguntas congeladas con snapshots inmutables.

5. **Verificación de Pantalla `/play`:**
   - Estado: `HTTP/2 200 OK`. Cero fugas de preguntas ni respuestas en el HTML generado.

6. **Inicio de Partida (`POST /api/v1/games/start`):**
   - Estado: `HTTP/2 200 OK`.
   - `game.status`: `'active'`, `currentPosition`: `1`.
   - Temporizador de Pregunta 1 activado con exactamente 20 segundos de vigencia server-side (`presentedAt: 22:06:08Z`, `expiresAt: 22:06:28Z`).
   - Cero fugas: payload sin `correctOption` ni `explanation`.

7. **Prueba de Idempotencia en Inicio:**
   - Segunda llamada a `POST /api/v1/games/start` respondió `HTTP/2 200 OK` con el mismo estado sin reiniciar el reloj.

8. **Gameplay E2E de las 10 Preguntas:**
   - **Pregunta 1 (Inicial, dirigida a Joaco):** Opción A enviada $\to$ Incorrecta (+20 pts). Acumulado: 20 pts.
   - **Pregunta 2 (Inicial, dirigida a Santi):** Opción B enviada $\to$ Incorrecta (+20 pts). Acumulado: 40 pts.
     - _Prueba de Idempotencia:_ Re-envío de la opción B respondió `HTTP/2 200 OK` con idéntico puntaje.
   - **Pregunta 3 (Inicial, grupal):** Opción C enviada $\to$ Incorrecta (+20 pts). Acumulado: 60 pts.
   - **Pregunta 4 (Media, dirigida a Joaco):** Opción D enviada $\to$ Incorrecta (+20 pts). Acumulado: 80 pts.
   - **Pregunta 5 (Media, grupal):** Opción B enviada $\to$ Incorrecta (+20 pts). Acumulado: 100 pts.
   - **Pregunta 6 (Media, dirigida a Santi):** Opción A enviada $\to$ Incorrecta (+20 pts). Acumulado: 120 pts.
   - **Pregunta 7 (Media, grupal):** Opción C enviada $\to$ **Correcta (+150 pts)**. Acumulado: 270 pts.
   - **Pregunta 8 (Avanzada, dirigida a Joaco):** Opción D enviada $\to$ Incorrecta (+20 pts). Acumulado: 290 pts.
   - **Pregunta 9 (Avanzada, dirigida a Santi):** Opción A enviada $\to$ Incorrecta (+20 pts). Acumulado: 310 pts.
   - **Pregunta 10 (Avanzada, grupal):** Opción B enviada $\to$ Incorrecta (+20 pts). Acumulado final: **330 pts**.
   - Avance en Pregunta 10: `{"ok": true, "advanced": true, "completed": true, "next": "/play/results"}`.
   - Estado de la partida actualizado a `completed` y `finished_at` registrado en PostgreSQL.

9. **Verificación de Pantalla `/play/results`:**
   - `GET /play/results` respondió `HTTP/2 200 OK`.
   - Renderizó correctamente: título "¡Partida terminada!", nombre del equipo "SMOKE PPA-013", puntaje "330 / 1500 pts" y botón "Finalizar experiencia".

10. **Cierre de Experiencia (`POST /api/v1/sessions/close`):**
    - Estado: `HTTP/2 200 OK`, `next: "/"`.
    - Cabecera de respuesta: `Set-Cookie: pb_table_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`.
    - Dispositivo marcado como `revoked` con `revoked_at` registrado.
    - Sesión marcada como `closed` con `closed_at` y `cooldown_until` a 120 segundos.

11. **Validación de Cooldown y Normalización Perezosa a `available`:**
    - Inmediatamente posterior al cierre: La mesa figuró en estado `cooldown`.
    - Transcurridos los 120 segundos de cooldown, una consulta a `/table/mesa-01` ejecutó la normalización perezosa automática.
    - Verificación directa en base de datos PostgreSQL:
      - `Mesa 01`: `status = 'available'`.
      - Sesiones activas: `0`.
      - Dispositivos activos: `0`.
      - Las 10 respuestas y el registro de la partida permanecen almacenados con integridad total.

---

## 8. Conclusión

PPA-013 queda formalmente **CERRADO** habiendo superado todas las pruebas unitarias, de integración y el smoke test funcional real en el servidor oficial de producción.

```
PPA-013 PRODUCTION SMOKE TEST = PASSED
PPA-013 HUMAN DEMO TEST = PASSED
PPA-013 = CLOSED
```

> [!IMPORTANT]
> **PPA-014 todavía NO debe comenzar.** El sistema se encuentra en un estado productivo estable, seguro y listo para que usuarios reales de prueba jueguen la trivia en el local de Esperanza.
