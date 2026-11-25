# PPA-010 — Acceso a Mesa, Código Temporal y Sesión

## Metadatos

- **Ticket:** PPA-010
- **Título:** Acceso a Mesa, Código Temporal y Sesión
- **Fecha:** 2026-11-25
- **Estado:** Implementado / Aprobado
- **Dominio:** Mesa, Sesión, Dispositivo Principal y Auditoría
- **Especificaciones Base:** [`specs/04-qr-table-access.md`](../../specs/04-qr-table-access.md), [`specs/06-technical-architecture.md`](../../specs/06-technical-architecture.md)

---

## 1. Resumen Ejecutivo

PPA-010 implementa el primer flujo funcional end-to-end para el cliente de Punto Burger:

1. El comensal accede a la URL pública de la mesa física escaneando su QR (ej. `https://app.puntoburger.com.ar/table/mesa-01`).
2. El servidor resuelve la mesa y su local gastronómico correspondiente sin confiar en identificadores provistos por el navegador.
3. El cliente visualiza la identidad de Punto Burger y se le solicita ingresar el código temporal rotativo de 5 caracteres exhibido en las pantallas físicas del salón.
4. El backend valida el código mediante el algoritmo determinístico HMAC-SHA256 (admitiendo ventana actual de 5 minutos y gracia de 45 segundos para la ventana anterior).
5. Se ejecuta un reclamo atómico y transaccional en PostgreSQL que crea `table_sessions`, asigna el dispositivo principal en `devices`, vincula `active_device_id`, marca la mesa `in_use` y registra eventos de auditoría inmutables.
6. Se emite una cookie criptográfica segura (`pb_table_session`, HttpOnly, SameSite=Lax, Path=/, duración 90 minutos) que contiene el token original, mientras que en la base de datos se guarda **exclusivamente el hash SHA-256** del token.
7. Al recargar la página o ingresar a `/play/setup`, la sesión se recupera de forma transparente e idempotente.
8. Si otro dispositivo intenta reclamar la misma mesa mientras está activa o en cooldown, la solicitud es rechazada con `TABLE_ALREADY_IN_USE` o `TABLE_COOLDOWN`.

Todo el flujo opera bajo un modelo **autoservicio**, sin necesidad de intervención manual por parte de los mozos o personal del bar.

---

## 2. Flujo Funcional y Rutas

```text
Cliente (Navegador Móvil)
       │
       │ GET /table/mesa-01
       ▼
[ Server Component: TablePage ]
       │
       ├── ¿Tiene cookie pb_table_session?
       │     ├── Sí, de esta misma mesa -> Muestra "Mesa ya conectada" y botón a /play/setup (Idempotente)
       │     └── Sí, de OTRA mesa -> Muestra error DEVICE_HAS_ACTIVE_SESSION
       │
       ├── Normalización perezosa (Lazy normalization):
       │     ├── ¿Sesión superó expires_at? -> Transición: active -> expired, mesa -> cooldown (2 min)
       │     └── ¿Mesa en cooldown superó cooldown_until? -> Transición: cooldown -> available
       │
       ├── Evaluación de estado:
       │     ├── available -> Renderiza TableClaimForm (input 5 caracteres + Comenzar)
       │     ├── in_use -> Muestra mensaje amigable: "Mesa actualmente ocupada"
       │     ├── cooldown -> Muestra mensaje: "Mesa en preparación temporal (XX seg restantes)"
       │     ├── disabled -> Muestra mensaje: "Mesa no disponible"
       │     └── not_found -> Muestra mensaje: "Mesa no encontrada"
       ▼
[ Cliente ingresa código y envía POST /api/v1/tables/claim ]
       │
       ├── Validación Zod ({ tableCode, accessCode })
       ├── Rate Limiting (máximo 5 fallas consecutivas por IP + mesa)
       ├── Validación HMAC-SHA256 con ventana actual (5 min) o ventana anterior (≤ 45 s gracia)
       │
       ├── Transacción atómica en PostgreSQL:
       │     ├── Verifica que mesa continúe available
       │     ├── Genera rawDeviceToken (32 bytes aleatorios)
       │     ├── Calcula tokenHash = sha256(rawDeviceToken)
       │     ├── Inserta table_sessions (status: 'active', expires_at: now + 90 min)
       │     ├── Inserta devices (status: 'active', token_hash: tokenHash)
       │     ├── Asigna table_sessions.active_device_id = devices.id
       │     ├── Actualiza tables.status = 'in_use'
       │     └── Inserta audit_events ('session_created')
       │
       ├── Respuesta JSON: { ok: true, session: { ... }, next: "/play/setup" }
       └── Set-Cookie: pb_table_session=<rawDeviceToken>; HttpOnly; Secure; SameSite=Lax; Max-Age=5400
       ▼
[ Redirección a /play/setup ]
       │
       └── Recupera sesión por cookie y muestra pantalla preparatoria para PPA-011.
```

---

## 3. Endpoints y Contratos de Datos

### `POST /api/v1/tables/claim`

#### Payload de Entrada

```json
{
  "tableCode": "mesa-01",
  "accessCode": "7HK9P"
}
```

- Valida con Zod:
  - `tableCode`: `string`, mínimo 1 caracter, normalizado con trim.
  - `accessCode`: `string`, exactamente 5 caracteres, transformado automáticamente a mayúsculas.
- El cliente **nunca** envía `venue_id`, `table_id`, `device_id` ni `session_id`. Todo se resuelve server-side.

#### Respuesta Exitosa (200 OK)

```json
{
  "ok": true,
  "session": {
    "table": "Mesa 01",
    "status": "active",
    "expiresAt": "2026-11-25T13:45:00.000Z"
  },
  "next": "/play/setup"
}
```

_Encabezado Set-Cookie:_

```http
Set-Cookie: pb_table_session=9a3b8c...; Max-Age=5400; Path=/; HttpOnly; SameSite=Lax; Secure
```

#### Respuestas de Error

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_ACCESS_CODE",
    "message": "El código temporal ingresado es incorrecto o ha expirado."
  }
}
```

Códigos de Error de Dominio:

- `TABLE_NOT_FOUND` (404)
- `TABLE_DISABLED` (403)
- `TABLE_ALREADY_IN_USE` (409)
- `TABLE_COOLDOWN` (409)
- `INVALID_ACCESS_CODE` (400)
- `DEVICE_HAS_ACTIVE_SESSION` (409)
- `TOO_MANY_ATTEMPTS` (429)
- `INVALID_INPUT` (400)
- `SESSION_CREATION_FAILED` (500)

---

## 4. Seguridad y Criptografía

1. **Credenciales Server-Only:**
   - `ACCESS_CODE_SECRET`, `SESSION_SECRET`, `SUPABASE_SECRET_KEY`, `DATABASE_URL` residen exclusivamente en el servidor.
   - Ninguna variable privada se importa en Client Components.
2. **Tokens de Dispositivo:**
   - Se generan tokens de 32 bytes (`randomBytes(32).toString('hex')`).
   - La base de datos almacena **únicamente el hash SHA-256** (`tokenHash = hashToken(rawToken)`).
   - El token en texto plano nunca se persiste.
3. **Cookie Segura:**
   - Nombre: `pb_table_session`
   - Opciones: `HttpOnly: true`, `SameSite: 'lax'`, `Path: '/'`, `MaxAge: 5400` (90 min), `Secure: true` en producción.
4. **Sanitización de Errores:**
   - Las respuestas de error nunca devuelven sentencias SQL, nombres de constraints o tablas, ni stack traces internos.

---

## 5. Concurrencia e Integridad Atómica

Para garantizar que si dos comensales intentan reclamar la misma mesa al mismo milisegundo solo uno gane:

1. La operación se ejecuta dentro de una transacción `db.transaction(async (tx) => ...)`.
2. Como última línea de defensa a nivel motor PostgreSQL, actúa el índice parcial único:
   ```sql
   CREATE UNIQUE INDEX table_sessions_active_table_idx ON table_sessions (table_id) WHERE status = 'active';
   ```
3. La segunda transacción que intente insertar otra sesión activa sobre la misma mesa es rechazada con violación de unicidad (error `23505`), el backend atrapa la excepción y responde limpiamente `TABLE_ALREADY_IN_USE` sin filtrar detalles del motor de base de datos.

---

## 6. Expiración y Cooldown (Normalización Perezosa)

- **Expiración de Sesión:** Duración máxima autoritativa de 90 minutos server-side (`expires_at = now + 90 min`). Cuando una solicitud detecta `expires_at <= now`:
  - `table_sessions.status`: `active` $\rightarrow$ `expired`
  - `tables.status`: `in_use` $\rightarrow$ `cooldown`
  - `table_sessions.cooldownUntil`: `now + 2 minutos`
  - Se registran eventos de auditoría `session_expired` y `table_cooldown_started`.
- **Cooldown de Mesa:** Durante los 2 minutos posteriores a la expiración, ninguna nueva sesión puede crearse (`TABLE_COOLDOWN`).
- **Auto Liberación:** Cumplidos los 2 minutos, la siguiente evaluación detecta `cooldownUntil <= now` y actualiza automáticamente `tables.status` de `cooldown` a `available`, sin necesidad de intervención del personal.

---

## 7. Rate Limiter

Se implementó un limitador de intentos en memoria en `src/modules/sessions/rate-limiter.ts`:

- Bloquea clientes que acumulan 5 intentos fallidos consecutivos en una ventana de 5 minutos por combinación de `clientIp:tableCode`.
- Cuando se bloquea, devuelve código HTTP 429 con error `TOO_MANY_ATTEMPTS`.
- Al realizar un claim exitoso, se limpia el contador.
- **Documentación de arquitectura:** El limitador en memoria es adecuado para la instancia única del prototipo en PM2. Si se escala a múltiples procesos o servidores, se migrará a almacenamiento compartido (Redis o tabla de PostgreSQL).

---

## 8. CLI de Desarrollo (`npm run dev:access-code`)

Para generar y verificar el código temporal vigente mientras las pantallas del local no están conectadas al sistema:

```bash
npm run dev:access-code -- esperanza-central
```

Salida estándar:

```text
Venue: Punto Burger Esperanza
Código actual: XXXXX
Expira en: XX segundos
```

---

## 9. Pruebas Automatizadas

Se crearon y aprobaron **78 tests automatizados** distribuidos en 18 suites:

- `src/modules/tables/tables.service.test.ts`: 4 pruebas (resolución de mesa disponible, mesa inexistente, expiración y transición a cooldown, y auto liberación al finalizar cooldown).
- `src/modules/sessions/sessions.service.test.ts`: 11 pruebas (claim exitoso, hash de token, 90 minutos, código incorrecto, ventana de 45s de gracia, rechazo tras 45s, idempotencia del mismo navegador, rechazo por sesión en otra mesa, mesa ocupada, mesa en cooldown, mesa disabled, rate limit al 5to intento y prueba de concurrencia simultánea).
- `src/modules/sessions/cookie.test.ts`: 4 pruebas (nombre, duración, HttpOnly, SameSite, Secure en prod).
- `src/modules/sessions/rate-limiter.test.ts`: 4 pruebas (intentos permitidos, decremento, bloqueo al 5to fallo, limpieza por éxito).
- `src/app/api/v1/tables/claim/route.test.ts`: 4 pruebas (body inválido, Zod validation, claim exitoso con cookie emitida, sanitización de errores internos).
- `src/app/table/[tableCode]/table-claim-form.test.tsx`: 4 pruebas (renderizado, conversión a mayúsculas, envío y redirección, mensaje de error en pantalla).
