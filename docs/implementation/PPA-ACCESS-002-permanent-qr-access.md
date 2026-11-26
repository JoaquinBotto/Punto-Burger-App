# PPA-ACCESS-002 — Acceso Directo por QR Permanente y Aprovisionamiento de Mesas

## 1. Resumen Ejecutivo

- **Ticket:** `PPA-ACCESS-002`
- **Estado:** `CLOSED`
- **Fecha:** 25 de Noviembre de 2026
- **Entorno:** Producción DonWeb Cloud Server (`https://app.puntoburger.com.ar`)
- **Pipeline:** GitHub Actions CI/CD (`cf7e996` y `0420246` desplegados exitosamente)
- **Smoke Test:** `PPA-ACCESS-002 PRODUCTION SMOKE TEST = PASSED` (10/10 pasos verificados contra producción real)

El ticket **PPA-ACCESS-002** elimina por completo la dependencia del código temporal de 5 caracteres mostrado en pantallas de TV para la experiencia pública de los comensales en Punto Burger. A partir de esta entrega, el cliente escanea el código QR físico y permanente ubicado en su mesa (`https://app.puntoburger.com.ar/t/[qrToken]`), visualiza una pantalla oficial de bienvenida con el nombre de su mesa y confirmación explícita _"Jugar ahora"_, y al confirmar se genera automáticamente la sesión de mesa (`table_sessions`), asignando la cookie segura `pb_table_session` y vinculando el dispositivo principal.

El QR físico de cada mesa **no rota por día**, manteniéndose permanente a lo largo del tiempo, mientras que las sesiones de juego son efímeras y el ranking diario (PPA-RANK-001) continúa computándose de forma aislada e independiente.

---

## 2. Decisiones de Arquitectura e Implementación

### 2.1. Tokens Criptográficos Permanentes para Mesas (`tables.qr_token`)

- Cada mesa física cuenta con un token criptográfico generado con `randomBytes(24).toString('base64url')` (≥128 bits de entropía).
- Se rotó el token inicial predecible de Mesa 01 (`pb_mesa_01_esperanza_central`) a un token seguro de alta entropía sin modificar su ID ni perder el historial de partidas previas.
- El esquema PostgreSQL mantiene el índice único `tables_qr_token_unique`.

### 2.2. Nueva Pantalla Server Component `/t/[qrToken]`

- **Seguridad contra prefetch y bots:** La solicitud HTTP `GET /t/[qrToken]` es puramente idempotente y de lectura; **nunca crea sesiones ni ocupa la mesa** en PostgreSQL.
- Muestra el nombre oficial de la mesa (ej. _"Mesa 01"_), la pregunta _"¿Listos para jugar?"_, la invitación _"Armá tu equipo y competí contra las otras mesas del local"_, el botón interactivo de acción _"Jugar ahora"_ y el enlace directo al ranking diario (`/ranking`).
- Gestiona de forma visual los estados:
  - **Disponible:** Botón _"Jugar ahora"_ activo.
  - **Cooldown (Preparación temporal):** Temporizador regresivo en cliente (`TableQrClaimClient`) con auto-habilitación al expirar los 120 segundos.
  - **Ocupada:** Advertencia de partida en curso por otro dispositivo.
  - **Sesión propia activa (Idempotencia):** Botón _"Continuar partida"_ que redirige fluidamente según el avance (`/play/setup`, `/play` o `/play/results`).
  - **Sesión activa en otra mesa:** Alerta bloqueante con acceso a la mesa previamente vinculada.
  - **No encontrada / Deshabilitada:** Mensajes institucionales amigables.

### 2.3. Endpoint de Reclamo `POST /api/v1/tables/claim-qr`

- Recibe `{ qrToken: string }` y valida entrada con Zod.
- Resuelve la mesa y local aplicando normalización perezosa (`resolveTableStateByQrToken`).
- Reutiliza el motor transaccional server-side en PostgreSQL con bloqueo y verificación atómica de disponibilidad (`status = 'available'`).
- Registra el evento de auditoría `session_created` con `claimMethod: 'qr'`, resguardando de forma estricta el `qrToken` (nunca se persiste en logs ni auditoría).
- Emite la cookie segura `pb_table_session` (`httpOnly`, `sameSite: 'lax'`, `secure: true`, duración 90 min).

### 2.4. Corrección Estricta del Bug `active_device_id`

- Se corrigió el repositorio `table-sessions.repository.ts` para que ante cualquier transición a `status = 'closed'` o `status = 'expired'`, el campo `active_device_id` se actualice obligatoriamente a `null`.
- Aplica tanto en el cierre voluntario del comensal (`closeTableSession`) como en la expiración perezosa por tiempo límite (`resolveTableState`).

### 2.5. Actualización Informativa de `/table/[tableCode]`

- Se retiró el formulario de 5 caracteres y todas las menciones a códigos de TV de la interfaz pública.
- La ruta anterior ahora funciona como guía informativa institucional, indicando a los clientes que escaneen el código QR físico adherido a su mesa.

---

## 3. Herramientas CLI y Aprovisionamiento de 30 Mesas

### 3.1. Aprovisionamiento Automático (`npm run tables:provision`)

- Script: `scripts/provision-tables.ts`
- Aprovisiona de forma idempotente las 30 mesas físicas oficiales (`mesa-01` a `mesa-30`) para el local `esperanza-central`.
- Asigna nombres normalizados (_"Mesa 01"_, _"Mesa 02"_, ..., _"Mesa 30"_) y tokens criptográficos permanentes.
- Verificado en producción DonWeb: **30 mesas verificadas y seguras**.

### 3.2. Exportación de Manifiesto para Imprenta (`npm run qr:export`)

- Script: `scripts/export-table-qr-manifest.ts`
- Genera el manifiesto para diseño e imprenta con las columnas `table_code,display_name,url`.
- Directorio de destino seguro en producción: `/var/www/punto-burger-app/shared/qr-print/`
  - Archivos generados: `table-qr-manifest.csv` y `table-qr-manifest.json`
  - Permisos estrictos: `chmod 600` (`deploy:deploy`).
  - Total de registros: **30 mesas físicas** con sus respectivas URLs completas `https://app.puntoburger.com.ar/t/[qrToken]`.
  - Excluido estrictamente del control de versiones Git (`.gitignore`).

### 3.3. Rotación de Emergencia por Mesa (`npm run qr:rotate -- mesa-XX`)

- Script: `scripts/rotate-table-qr.ts`
- Permite rotar el token QR de una mesa física específica ante daño o compromiso físico, actualizando `tables.qr_token` y emitiendo auditoría `table_qr_rotated` sin alterar el ID de la mesa ni su historial de partidas.

---

## 4. Pruebas Automatizadas

- **Suite de Pruebas:** Vitest v3.0.5
- **Archivos de prueba:** 40 suites pasando al 100%
- **Total de pruebas unitarias:** 205 pruebas pasando (0 fallos)
- **Chequeos de calidad:** Prettier y ESLint limpios, TypeScript typecheck en modo estricto sin errores, y compilación Next.js exitosa con Turbopack.

---

## 5. Validación Real en Producción (Smoke Test)

- **Script de prueba:** `scripts/smoke-qr-access.mjs`
- **Objetivo:** Ejecutar la totalidad de los 10 pasos funcionales en el entorno real de producción DonWeb (`https://app.puntoburger.com.ar`).

### Resultados de la Ejecución:

1. **Obtención de Token QR:** Token permanente de Mesa 01 recuperado del manifiesto (`32 caracteres base64url`).
2. **GET /t/[qrToken]:** HTTP 200, renderizado de bienvenida con _"Mesa 01"_ y botón _"Jugar ahora"_. Se verificó en base de datos que la mesa permaneció en `available` y con 0 sesiones creadas.
3. **POST /api/v1/tables/claim-qr:** HTTP 200, emisión de cookie `pb_table_session`, mesa pasó a `in_use` y sesión activa creada.
4. **Idempotencia:** Re-escaneo con la misma cookie retornó HTTP 200 y reanudó la sesión.
5. **Detección de Colisión:** Segundo dispositivo sin cookie intentó reclamar la mesa y recibió HTTP 409 (`TABLE_ALREADY_IN_USE`).
6. **Partida Completa:** Creación de grupo, selección de categoría, preparación de 10 preguntas, inicio de juego y respuesta de las 10 preguntas con puntaje acumulado y finalización en `completed`.
7. **Cierre y Limpieza:** `POST /api/v1/sessions/close` cerró la sesión y se verificó en DB que `active_device_id` quedó en `null` y la mesa ingresó en `cooldown`.
8. **Bloqueo por Cooldown:** Intento de reclamo durante el enfriamiento retornó HTTP 409 (`TABLE_COOLDOWN`).
9. **Re-reclamo con el MISMO QR permanente:** Tras resetear la mesa a `available`, se reclamó exitosamente con el mismo token QR físico original, creando una sesión nueva.
10. **Limpieza Final:** Mesa 01 finalizó en `available`, con 0 sesiones activas, 0 dispositivos activos y todas las sesiones cerradas con `active_device_id = null`.

```text
=====================================================
=== SMOKE TEST: PPA-ACCESS-002 EN PRODUCCIÓN       ===
=== URL: https://app.puntoburger.com.ar            ===
=====================================================

[1/10] Obteniendo token QR permanente de Mesa 01...
[✓] Token QR obtenido: jce8Vwya... (longitud: 32)
Asegurando estado inicial de Mesa 01 (available)...
[✓] Mesa 01 reseteada a available.

[2/10] Probando GET /t/[qrToken] (no debe crear sesión)...
[✓] GET /t/[qrToken] respondió 200 y no alteró el estado de la mesa.

[3/10] Probando POST /api/v1/tables/claim-qr...
[✓] Reclamo exitoso: HTTP 200, cookie emitida, mesa in_use en DB.

[4/10] Probando idempotencia con misma cookie...
[✓] Idempotencia confirmada: HTTP 200, sesión reanudada.

[5/10] Probando rechazo de mesa ocupada (segundo dispositivo)...
[✓] Conflicto verificado: HTTP 409 TABLE_ALREADY_IN_USE.

[6/10] Ejecutando partida de trivia completa con la sesión...
[✓] Partida finalizada con éxito (puntaje total: 200 pts).

[7/10] Cerrando sesión y verificando active_device_id = null...
[✓] Sesión cerrada y active_device_id limpiado a NULL correctamente.

[8/10] Verificando bloqueo por cooldown...
[✓] Cooldown verificado: HTTP 409 TABLE_COOLDOWN.

[9/10] Probando re-reclamo con el MISMO QR tras resetear mesa...
[✓] Re-reclamo con el mismo QR permanente exitoso (nueva sesión iniciada).

[10/10] Limpieza final y verificación de estado en DB...
=== ESTADO FINAL DE PRODUCCIÓN ===
Mesa 01: available
Sesiones activas: 0
Dispositivos activos: 0
active_device_id en sesiones cerradas: null
QR físico permanente verificado y listo.

>>> PPA-ACCESS-002 PRODUCTION SMOKE TEST = PASSED <<<
```

---

## 6. Estado del Proyecto

- `PPA-008`: CLOSED
- `PPA-009`: CLOSED
- `INFRA-001`: CLOSED
- `PPA-010`: CLOSED
- `PPA-011`: CLOSED
- `PPA-012`: CLOSED
- `PPA-UI-001`: CLOSED
- `PPA-013`: CLOSED
- `PPA-RANK-001`: CLOSED
- **`PPA-ACCESS-002`: CLOSED**
