# PPA-007: Arquitectura Técnica y Selección de Stack

## 1. Identificación

| Campo | Valor |
|---|---|
| **Nombre del producto** | Punto Burger |
| **Estado del documento** | Aprobado |
| **Versión** | 1.0.0 |
| **Fecha** | 2026-07-19 |
| **Responsable** | Software Architect / Senior Software Engineer |
| **Entregable relacionado** | PPA-007 |
| **Documentos base** | PPA-002 (Product Vision), PPA-003 (MVP Roadmap), PPA-004 (Mecánica de Juego), PPA-005 (Acceso por QR y Sesiones de Mesa), PPA-006 (Usuarios, Perfiles, Escuelas y Consentimiento) |

---

## 2. Resumen Ejecutivo y Principio Arquitectónico Rector

### 2.1 Resumen Ejecutivo

Este documento define la arquitectura técnica de software, la selección del stack definitivo y los estándares de ingeniería para construir la plataforma digital oficial de **Punto Burger**. Establece una base técnica sólida, pragmática y de rápida ejecución que permite implementar de forma inmediata el **primer prototipo jugable** (Vertical Slice) y desplegar la versión de producción en infraestructura **DonWeb Cloud Server Linux**, apoyándose en **Supabase** como servicio gestionado para PostgreSQL y autenticación persistente.

### 2.2 Principio Arquitectónico Rector: Simplicidad, Control de Servidor y Cero Fricción

1. **Construcción Inmediata:** El diseño técnico prioriza decisiones que permiten comenzar a programar el primer prototipo funcional sin fricción ni sobreingeniería inmediatamente después de esta especificación.
2. **Monolito Modular Tipado en Servidor Linux Persistente:** Se adopta una arquitectura monolítica modular en **Next.js 16.x (Active LTS / estable)** con TypeScript estricto, ejecutándose como un proceso Node.js persistente supervisado por **PM2** detrás de un proxy inverso **Nginx** en un **Cloud Server Linux de DonWeb**.
3. **Descarte Explícito de Vercel:** La aplicación no dependerá de funciones serverless efímeras ni de plataformas propietarias cerradas. El despliegue de producción se gestionará en infraestructura propia de Cloud Server en DonWeb.
4. **Autoridad Absoluta del Servidor:** Ninguna regla de negocio crítica (creación de sesión, validación de código temporal, temporizadores de preguntas, cálculo de puntos, adjudicación de premios ni cómputo de rankings) reside ni confía exclusivamente en el cliente web.
5. **Aislamiento Estricto de la Base de Datos:** El navegador del cliente **jamás accede directamente a las tablas de la base de datos** mediante APIs públicas directas de Supabase. Todo flujo de lectura sensible y mutación atraviesa obligatoriamente la capa de aplicación de Next.js.
6. **Esquema Relacional Incremental:** Aunque la arquitectura contempla el modelo global del ecosistema (25+ entidades), la base de datos se implementará de manera estrictamente incremental, materializando en el prototipo únicamente las entidades indispensables para la partida de trivia.
7. **Cero Sobrearquitectura:** Se descartan de forma categórica microservicios, Kubernetes, clustering prematuro y colas distribuidas. La comunicación cliente-servidor se basa en **HTTP REST versionado (`/api/v1/*`)** sincrónico y resiliente.

---

## 3. Evaluación y Comparativa de Alternativas de Stack

Se evaluaron tres arquitecturas candidatas para responder a los requerimientos funcionales aprobados en PPA-002 a PPA-006:

### 3.1 Alternativas Evaluadas

- **Alternativa A: Next.js (App Router / TypeScript) + DonWeb Cloud Server (Nginx + PM2) + Supabase (PostgreSQL & Auth)**
  - *Frontend & Backend:* Next.js 16.x estable en Full-Stack TypeScript (App Router, Route Handlers y Server Components).
  - *Infraestructura de Aplicación:* DonWeb Cloud Server Linux (Ubuntu/Debian), Nginx como proxy inverso y TLS, PM2 para gestión y supervisión del proceso Node.js persistente.
  - *Base de Datos y Auth:* PostgreSQL gestionado en Supabase con Drizzle ORM; Supabase Auth para usuarios registrados y administración.
  - *Sesión de Mesa / Invitados:* Credencial temporal propia emitida por el backend Next.js en cookie segura (sin crear usuarios anónimos en Supabase).

- **Alternativa B: Laravel (PHP) + PostgreSQL / Supabase + Blade / Inertia**
  - *Frontend:* Blade o Inertia.js con Vue/React.
  - *Backend:* Monolito Laravel con Eloquent ORM y Laravel Sanctum.
  - *Base de Datos:* PostgreSQL administrado en Supabase.
  - *Infraestructura:* DonWeb Cloud Server con PHP-FPM y Nginx.

- **Alternativa C: React / Vite (SPA pura) + Supabase BaaS directo**
  - *Frontend:* Single Page Application estática en React/Vite.
  - *Backend:* Supabase como BaaS directo (Row Level Security y Supabase Edge Functions en Deno).
  - *Base de Datos:* PostgreSQL en Supabase.
  - *Infraestructura:* Hosting estático en Nginx + Supabase Cloud.

### 3.2 Matriz Comparativa de Criterios

| Criterio de Decisión | Alternativa A: Next.js + DonWeb + Supabase | Alternativa B: Laravel + PostgreSQL | Alternativa C: React/Vite + Supabase |
|---|:---:|:---:|:---:|
| **Velocidad de Prototipado** | **Muy Alta** (código y tipos TS unificados) | Alta (requiere configuración dual) | Alta inicial, pero compleja en lógica |
| **Control de Infraestructura** | **Total** (Servidor Linux en DonWeb) | Total (Servidor Linux en DonWeb) | Nulo en backend (depende de BaaS) |
| **Reglas Críticas en Servidor** | **Excelente** (Servicios de dominio TS) | Excelente (Controladores de dominio) | Deficiente (exige PL/pgSQL o Deno) |
| **Persistencia y Proceso** | **Robusta** (Node.js persistente con PM2) | Robusta (PHP-FPM persistente) | No aplica (Frontend estático) |
| **Base de Datos y Tipado** | **Excelente** (PostgreSQL + Drizzle/TS) | Excelente (PostgreSQL + Eloquent) | Buena (PostgreSQL + tipos generados) |
| **Autenticación de Invitados** | **Limpia** (Cookie firmada propia) | Limpia (Sesión PHP nativa) | Compleja (satura Supabase de anónimos) |
| **Experiencia Móvil Web** | **Excelente** (Tailwind Mobile-First) | Buena | Excelente |
| **Despliegue y Mantenimiento** | **Simple y Predecible** (Nginx + PM2) | Media (mantenimiento PHP-FPM) | Simple (estático) |
| **Facilidad para el Prototipo** | **Inmediata** (Next.js App Router) | Media (setup inicial Laravel) | Media (backend disperso) |

### 3.3 Diagnóstico y Descarte

- **Por qué se descarta la Alternativa C (React/Vite + Supabase BaaS directo):** Exige trasladar lógica de negocio autoritativa a la base de datos mediante procedimientos almacenados (`PL/pgSQL`) o bifurcarla en Edge Functions (Deno). Además, utilizar Supabase Auth para comensales invitados generaría millones de registros anónimos desechables, saturando la base de autenticación.
- **Por qué se descarta la Alternativa B (Laravel + PostgreSQL):** Introduce una brecha de lenguaje (PHP en backend vs TypeScript en frontend), impidiendo compartir esquemas de validación Zod y tipos de dominio entre cliente móvil y servidor.
- **Por qué se descarta Vercel para el despliegue:** Vercel impone restricciones comerciales y costos impredecibles basados en invocaciones serverless. Para Punto Burger, un **Cloud Server Linux en DonWeb** otorga previsibilidad presupuestaria en moneda local, soberanía operativa, control total de Nginx, registros persistentes y compatibilidad natural con procesos Node.js supervisados por PM2.

---

## 4. Selección Definitiva del Stack Tecnológico

Se aprueba formal y definitivamente la **Alternativa A orientada a DonWeb Cloud Server**:

$$\mathbf{Next.js\ 16.x\ (App\ Router\ /\ TypeScript)\ +\ Tailwind\ CSS\ +\ Drizzle\ ORM\ +\ Supabase\ PostgreSQL\ +\ DonWeb\ Cloud\ Server\ (Nginx\ +\ PM2)}$$

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ARQUITECTURA GENERAL DEL STACK                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CLIENTES MÓVILES / NAVEGADORES WEB (Safari iOS / Chrome Android)          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ • Next.js App Shell Responsivo (Tailwind CSS Mobile-First)          │   │
│   │ • Interfaz de Mesa / Trivia / Resultados / Panel Admin              │   │
│   │ • Temporizador Visual Cliente (sincronizado con server timestamp)   │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │ HTTPS (Puerto 443)                   │
│                                      ▼                                      │
│   DONWEB CLOUD SERVER LINUX (Ubuntu / Debian LTS)                           │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ NGINX (Reverse Proxy, SSL/TLS, Headers de Seguridad, Static Cache)   │   │
│   │        │ HTTP (localhost:3000)                                      │   │
│   │        ▼                                                            │   │
│   │ NODE.JS PERSISTENTE (Supervisado por PM2)                           │   │
│   │ Next.js 16.x App Router Runtime:                                    │   │
│   │   ├── Route Handlers (/api/v1/*) con esquemas de validación Zod     │   │
│   │   ├── Capa de Servicios y Módulos de Dominio (tables, trivia, etc.) │   │
│   │   ├── Temporizador Autoritativo Server-Side (expires_at)            │   │
│   │   ├── Motor de Puntuación Oficial y Reglas Antifraude               │   │
│   │   ├── Generador/Validador de Código Temporal del Local              │   │
│   │   ├── Emisión y validación de Cookie de Sesión de Mesa (Invitados)  │   │
│   │   └── Drizzle ORM (Capa de persistencia fuertemente tipada)         │   │
│   └──────────────────────────────┬───────────────────────────┬──────────┘   │
│                                  │ Protocolo PostgreSQL      │ HTTPS / SDK  │
│                                  │ (Pooler / Directo)        │              │
│                                  ▼                           ▼              │
│   INFRAESTRUCTURA GESTIONADA SUPABASE                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ • Base de Datos: PostgreSQL 15+ (Tablas de negocio del local)       │   │
│   │ • Autenticación Persistente: Supabase Auth (Usuarios y Staff/Admin) │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Arquitectura de Producción en DonWeb Cloud Server

La aplicación se diseñará y desplegará pensando en un **servidor Linux persistente**, no en funciones serverless efímeras.

### 5.1 Entorno del Servidor
- **Sistema Operativo:** Linux Ubuntu LTS o Debian estable.
- **Runtime:** Node.js 24 LTS (fijado en `.nvmrc` y `engines` de `package.json`, compatible con Next.js 16.x).
- **Acceso:** SSH seguro mediante autenticación exclusiva por clave pública (deshabilitado login por contraseña).
- **Usuario de Aplicación:** Usuario de sistema dedicado sin privilegios de root (`puntoburger` o similar) para ejecutar el proceso Node.js.
- **Dimensionamiento de Recursos:** Se seleccionará antes del despliegue en función de pruebas de carga iniciales; no se fija cantidad de RAM ni vCPU en esta especificación.

### 5.2 Nginx como Reverse Proxy Público
Nginx será el único punto de entrada expuesto a Internet en los puertos estándar 80 (redirigido a HTTPS) y 443:
- **Terminación SSL/TLS:** Certificado emitido y renovado automáticamente (ej: Let's Encrypt / Certbot).
- **Proxy Pass:** Reenvío local hacia `http://127.0.0.1:3000` con headers estándar:
  - `X-Forwarded-For`, `X-Forwarded-Proto`, `Host`.
- **Headers de Seguridad:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Límites de Conexión:** Directivas `limit_req` para amortiguar picos y mitigar ataques de fuerza bruta.
- **Política de Caché Estricta:**
  - Permitido: Archivos estáticos inmutables (`/_next/static/*`, imágenes, fuentes).
  - **Prohibido terminantemente cachear:** Respuestas del juego (`/api/v1/game/*`), estados de sesión (`/api/v1/tables/*`), códigos temporales (`/screen/live-code`), endpoints privados o resultados de mesa.

### 5.3 PM2 como Supervisor del Proceso
- **Ejecución Persistente:** Mantiene vivo el proceso compilado de Next.js (`next start`) en background.
- **Arranque Automático:** Configuración de `pm2 startup` para recuperarse automáticamente ante reinicios físicos del servidor DonWeb.
- **Supervisión y Logs:** Monitoreo con `pm2 status` y rotación de logs estándar con `pm2-logrotate`.
- **Topología Inicial:** Instancia única (`instances: 1`). Se evitará clustering multi-instancia prematuro hasta que existan mediciones reales de tráfico en el bar.
- **Reinicio Controlado:** Comando `pm2 reload ecosystem.config.js --update-env` para despliegues con cero tiempo de inactividad perceptible.

### 5.4 Posición sobre Docker
- Docker queda **formalmente aprobado como alternativa o evolución futura** (para staging, reproducibilidad o aislamiento).
- **No es obligatorio para el primer prototipo.** La combinación directa de Nginx + PM2 sobre el Cloud Server Linux es la vía más ágil y de menor sobrecarga de memoria para la primera etapa.

---

## 6. Autenticación y Autorización

Se resuelve la distinción operativa entre usuarios de paso y usuarios registrados:

### 6.1 Invitados / Participantes Temporales (Sesión Propia de Mesa)
- **NO se crean usuarios en Supabase Auth para comensales invitados.**
- Al escanear el QR, ingresar el código temporal y aceptar ser el dispositivo principal, el servidor Next.js genera un secreto criptográfico aleatorio de alta entropía (`crypto.randomBytes(32)`).
- El servidor guarda el hash seguro de dicho secreto en `table_sessions.primary_device_token_hash`.
- El navegador recibe una **Cookie de Sesión de Mesa**:
  - Nombre: `pb_table_session`
  - Atributos: `HttpOnly`, `Secure` (en producción), `SameSite=Lax`, vigencia limitada a la sesión (90 minutos).
- **Sin Fingerprinting Invasivo:** No se emplean bibliotecas de fingerprinting del hardware o navegador. La posesión del secreto en la cookie demuestra legítimamente el control de la mesa.
- **Transferencia de Control:** Al transferirse la mesa a un nuevo dispositivo, el backend invalida el token anterior en base de datos y emite una nueva cookie al nuevo dispositivo principal.

### 6.2 Usuarios Persistentes (Cuentas Registradas)
- Se gestionan a través de **Supabase Auth**.
- Identificador funcional principal: **Número de celular**.
- En el prototipo, la verificación del número se realiza mediante un mock local/código de prueba; el proveedor real de SMS o WhatsApp se conectará posteriormente.

### 6.3 Personal, Administradores y Propietario (RBAC)
- Autenticación administrativa por email y contraseña en Supabase Auth.
- Roles soportados: `client`, `staff`, `admin`, `owner`.

### 6.4 Modelo de Autorización de Negocio (Server-Side Obligatorio)
- **Principio:** Supabase Auth proporciona identidad, pero **no autoridad de negocio por sí sola**.
- El middleware de Next.js actúa como filtro de navegación y experiencia de usuario (UX), pero **no es el único control de seguridad**.
- Cada endpoint sensible en la capa de servicios valida estrictamente en el servidor:
  1. Identidad del solicitante.
  2. Posesión de la sesión activa de mesa (para acciones de comensal).
  3. Rol autorizado en base de datos (para acciones de personal o administrador).
  4. Estado actual de la entidad (ej: mesa disponible, partida en curso, pregunta no vencida).

---

## 7. Conexión de Base de Datos: Drizzle ORM + Supabase PostgreSQL

La aplicación se ejecuta como un proceso Node.js persistente en el Cloud Server de DonWeb, lo que redefine la estrategia de conexión frente a un modelo serverless efímero.

```
Next.js en DonWeb (Proceso Node.js Persistente)
      │
      ├── DATABASE_URL ──────────► Supabase PostgreSQL (Conexión / Pool Persistente)
      │
      └── DATABASE_MIGRATION_URL ─► Supabase PostgreSQL (Conexión Directa para Drizzle Kit)
```

### 7.1 Separación de Conexiones
1. **Conexión de Runtime de Aplicación (`DATABASE_URL`):**
   - Utilizada por Drizzle ORM durante el funcionamiento normal.
   - Configurada con un pool de conexiones dimensionado para un servidor persistente (ej: `postgres.js` o `pg` con pool moderado de 5 a 10 conexiones simultáneas).
   - Se alimenta de variables de entorno suministradas por la configuración de Supabase.
2. **Conexión para Migraciones (`DATABASE_MIGRATION_URL`):**
   - Utilizada de forma aislada por **Drizzle Kit** para ejecutar scripts de migración DDL (`drizzle-kit push` o `drizzle-kit migrate`).
   - Requiere conexión directa a la base de datos sin restricciones de pooling transaccional.

### 7.2 Prohibición de Hardcodeo y Seguridad de Conexión
- Queda terminantemente prohibido hardcodear hosts, puertos, contraseñas o identificadores de proyecto en el código fuente.
- Conexión obligatoria cifrada mediante **SSL (`ssl: 'require'`)**.
- Los nombres y valores definitivos de las variables se establecerán en el archivo `.env` del servidor fuera del repositorio Git.

---

## 8. Arquitectura de APIs: Route Handlers y Servicios de Dominio

Para evitar bifurcaciones o duplicación de lógica, el núcleo del juego se expone exclusivamente mediante **Route Handlers versionados (`/api/v1/*`)**:

```
[ Petición HTTP ] ──► [ Route Handler (/api/v1/...) ]
                             │
                             ├── 1. Validación de entrada (Zod Schemas)
                             │
                             ▼
                      [ Servicio de Dominio / Use Case ] ◄── (Lógica testeable sin HTTP)
                             │
                             ├── 2. Reglas de negocio y estados
                             │
                             ▼
                      [ Repositorio / Drizzle ORM ]
                             │
                             ▼
                      [ Supabase PostgreSQL ]
```

### 8.1 Endpoints Principales del Prototipo
- `POST /api/v1/tables/claim`: Validación de código temporal y toma de control de la mesa.
- `POST /api/v1/groups`: Registro del nombre del grupo y participantes temporales.
- `POST /api/v1/game/start`: Selección de categoría y congelamiento de las 10 preguntas.
- `POST /api/v1/game/answer`: Confirmación de respuesta con verificación de expiración.
- `GET  /api/v1/game/current`: Recuperación del estado y tiempo real tras recarga.
- `GET  /api/v1/game/result`: Pantalla de resultado final de la partida.

### 8.2 Desacoplamiento de Servicios
- Los Route Handlers son delgados: únicamente parsean la petición, ejecutan validación Zod y delegan en funciones de servicio (`tableService`, `triviaService`).
- **Server Actions:** Podrán utilizarse en etapas posteriores exclusivamente para formularios administrativos o mutaciones simples de UI, pero **jamás duplicarán reglas de negocio del juego**.

---

## 9. Acceso a Mesa, Código Temporal y Pantallas del Bar

### 9.1 Acceso por QR y Estados de Mesa
Se respetan íntegramente los cuatro estados de mesa y transiciones de [PPA-005](file:///Users/jjoaco/Documents/Punto-Papas-App/specs/04-qr-table-access.md):
- `Deshabilitada` $\leftrightarrow$ `Disponible` $\rightarrow$ `En uso` $\rightarrow$ `Liberación temporal (cooldown)` $\rightarrow$ `Disponible`.
- Período de liberación automática de mesa: **2 minutos**. Al vencer, la mesa retorna automáticamente a `Disponible` sin acción manual del personal.
- Duración máxima de la sesión de mesa: **90 minutos** desde su creación.

### 9.2 Código Temporal del Local
- Generado y validado en el backend del Cloud Server de forma continua.
- **Valores de Referencia Iniciales:**
  - Rotación: cada **5 minutos**.
  - Tolerancia al código anterior: **45 segundos** posteriores a su vencimiento nominal.
- Ambos valores serán configurables mediante variables de entorno del servidor.

### 9.3 Pantallas Físicas de Punto Burger
- Se proveerá un endpoint ligero y una vista web pública dedicada:
  `/screen/live-code?venue=esperanza-central`
- La vista consulta el código vigente y se auto-actualiza periódicamente sin interacción humana del personal del bar.
- La integración profunda con el software existente de cartelería digital del local se realizará en un ticket posterior.

---

## 10. Temporizador Autoritativo Server-Side y Sincronización

- **Autoridad:** El tiempo válido es determinado estrictamente por las marcas temporales en base de datos:
  - `presented_at`: Momento en que la pregunta fue liberada al cliente.
  - `expires_at`: `presented_at + INTERVAL '20 seconds'`.
- **Comportamiento en Cliente:** La interfaz muestra un temporizador visual de exactamente 20 segundos.
- **Comportamiento ante Recargas:** El endpoint `GET /api/v1/game/current` devuelve `expires_at - now()`. La recarga **nunca reinicia el tiempo**.
- **Tolerancia Técnica de Red:** Se elimina la tolerancia fija obligatoria de 1.5 segundos. La tolerancia técnica de transporte será mínima, configurable en el servidor y sujeta a calibración empírica en el bar. **En ningún caso se otorgará una ventana jugable adicional visible al usuario.**
- Si una respuesta llega después de `expires_at + tolerancia_tecnica`, el servidor la registra como sin respuesta con 0 puntos y avanza a la siguiente pregunta.

---

## 11. Arquitectura Multi-Local y Entidad Venue

Para permitir la expansión futura a nuevas sucursales sin acoplamientos:

1. **Entidad Venue Formal:**
   ```
   venue:
     - id: UUID (Clave primaria relacional)
     - name: "Punto Burger Esperanza"
     - slug: "esperanza-central"
     - is_active: true
   ```
2. **Clave Foránea Estricta:** Todas las tablas dependientes (`tables`, `access_codes`, `game_sessions`, `audit_events`) referenciarán `venue_id` como foreign key UUID.
3. **Cero Acoplamiento al Slug:** Ninguna regla de negocio del código evaluará cadenas de texto fijas como `'esperanza-central'`.
4. **Seed Inicial:** El script de inicialización creará el local fundacional Punto Burger Esperanza asignándole su correspondiente identificador único.

---

## 12. Base de Datos: Esquema Relacional Incremental

Para cumplir con la directiva de no construir anticipadamente entidades innecesarias, la implementación en **PPA-009** se limitará estrictamente al núcleo del Vertical Slice:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 ESQUEMA INCREMENTAL PARA EL VERTICAL SLICE                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [venues] 1 ──── * [tables] 1 ──── * [table_sessions] 1 ── 1 [game_sessions]│
│     │                                       │                     │         │
│     │ 1                                     │ 1                   │ 1       │
│     *                                       *                     *         │
│  [access_codes]                          [devices]         [game_questions] │
│                                             │                     │         │
│                                             │ 1                   │ 1       │
│                                             ▼                     *         │
│                                          [groups] 1 ──── * [participants]   │
│                                                                   │         │
│  [categories] 1 ──── * [questions]                                *         │
│                                                               [answers]     │
│  [audit_events] (mínimo operativo)                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.1 Entidades Incluidas en PPA-009 (Prototipo Inicial)
1. `venues`: Local físico.
2. `tables`: Mesas del salón.
3. `access_codes`: Códigos temporales rotativos.
4. `table_sessions`: Sesiones activas y cooldown.
5. `devices`: Identificador hash de dispositivos vinculados.
6. `groups`: Nombre del grupo de juego.
7. `participants`: Participantes temporales (alias y rango etario).
8. `categories`: Temáticas de preguntas.
9. `questions`: Banco de preguntas aprobadas.
10. `game_sessions`: Partida de trivia de 10 preguntas.
11. `game_questions`: Secuencia congelada de la partida.
12. `answers`: Respuestas enviadas y puntuación asignada.
13. `audit_events`: Registro mínimo de incidencias y transferencias.

### 12.2 Entidades Diferidas para Migraciones Posteriores
- `users` y `dependent_profiles` (identidad persistente).
- `schools`, `courses` y `school_memberships` (competencia escolar).
- `seasons` y `competitive_contributions` (ligas y temporadas).
- `rewards` y `redemptions` (catálogo y billetera de premios).
- `consent_records` (trazabilidad legal avanzada).

---

## 13. Despliegue en DonWeb Cloud Server y CI/CD

```
[ Desarrollador ] ──► git push ──► [ Repositorio GitHub (main) ]
                                            │
                                            ▼
                                [ GitHub Actions Workflow ]
                                  ├── Linting (ESLint)
                                  ├── Typecheck (TypeScript strict)
                                  └── Pruebas Unitarias (Vitest)
                                            │ (si todo pasa)
                                            ▼
                                [ Despliegue SSH a DonWeb ]
                                  ├── Conexión SSH con clave segura
                                  ├── git pull origin main
                                  ├── npm ci --production=false
                                  ├── npx drizzle-kit migrate (si hay cambios)
                                  ├── npm run build
                                  ├── pm2 reload ecosystem.config.js
                                  └── curl -f http://127.0.0.1:3000/api/health
```

### 13.1 Proceso de Despliegue
1. El código se versiona y consolida en la rama `main` de GitHub.
2. GitHub Actions ejecuta la suite de validación continua.
3. El despliegue automatizado hacia el Cloud Server DonWeb se ejecutará vía SSH utilizando credenciales almacenadas exclusivamente en **GitHub Secrets** (sin almacenar claves SSH en el repositorio).
4. El servidor compila la aplicación Next.js y solicita a PM2 una recarga controlada sin corte de servicio.
5. Se ejecuta una verificación automática contra `/api/health`.

---

## 14. Seguridad del Servidor DonWeb y Protección de Datos

Para operar de forma segura en producción en un Cloud Server:
1. **Acceso al Servidor:** Conexión SSH restringida a clave criptográfica; login de usuario `root` deshabilitado para acceso remoto directo.
2. **Firewall del Sistema (UFW):** Exposición restringida a los puertos 22 (SSH con puerto opcionalmente remapeado), 80 (HTTP) y 443 (HTTPS).
3. **Ejecución Segura:** La aplicación Next.js corre bajo un usuario de sistema dedicado sin privilegios administrativos.
4. **Protección de Datos Sensibles:** En concordancia con PPA-006, la base de datos no contendrá números de DNI, domicilios ni fechas exactas de nacimiento. En las interfaces de mozos y personal, los números de teléfono se exhibirán parcialmente enmascarados (`+54 9 3496 ***-1234`).
5. **Aislamiento de Secretos:** Variables de base de datos y llaves de cifrado residen en el archivo `.env.production` local del servidor DonWeb, con permisos de lectura `chmod 600`.

---

## 15. Estrategia de Backups y Recuperación

Se definen dos responsabilidades técnicas separadas e independientes:

### 15.1 Código y Configuración
- El código fuente, esquemas Drizzle y migraciones residen versionados en **GitHub**.

### 15.2 Datos del Negocio
- **Base de Datos (Supabase):** Las políticas de copias de seguridad de la base de datos dependerán de las características y garantías del plan de Supabase contratado para producción. No se asumirá que un tier de pruebas ofrece copias de seguridad automáticas de grado empresarial. Se exigirá un procedimiento formal de exportación o backup programado antes del lanzamiento comercial.
- **Servidor DonWeb:** Se utilizarán las herramientas de snapshot o copias de seguridad de disco del Cloud Server DonWeb para permitir una recuperación rápida del sistema operativo y configuración en caso de fallo físico de la máquina virtual.
- **Aclaración Crítica:** Los snapshots del servidor **no reemplazan** las copias de seguridad transaccionales de PostgreSQL.

---

## 16. Estimación Realista de Costos de Infraestructura

Se elimina cualquier afirmación de costo cero para la operación en producción comercial:

1. **Desarrollo Local:** Costo $0 (ejecución en máquinas del equipo de desarrollo con emuladores o proyectos libres de prueba).
2. **Prototipo Online y Validación:** Tendrá el costo correspondiente al Cloud Server DonWeb seleccionado más los consumos que pudieran generarse en planes de prueba de servicios auxiliares.
3. **Producción Comercial:** Deberá presupuestar:
   - DonWeb Cloud Server Linux (abono mensual según RAM/vCPU elegidas).
   - Servicio de base de datos Supabase (evaluando el plan que asegure límites de conexiones, almacenamiento y retención de backups requeridos).
   - Registro y mantenimiento de dominio web comercial.
   - Costos futuros de telefonía (SMS o WhatsApp Business API) al habilitar verificación persistente masiva.

---

## 17. Observabilidad Mínima para el MVP

Sin recurrir a plataformas complejas de telemetría distribuida:
- **Logs de Aplicación:** Salida estándar JSON capturada por PM2 (`pm2 logs`).
- **Logs de Acceso y Errores Web:** Registros de Nginx en `/var/log/nginx/access.log` y `error.log`.
- **Health Check:** Endpoint `/api/health` que valida la respuesta de PostgreSQL y retorna HTTP 200.
- **Auditoría de Eventos:** Tabla `audit_events` para trazabilidad de incidencias de mesa y transferencias de control.

---

## 18. Alcance Definitivo del Primer Prototipo (Vertical Slice Jugable)

El primer prototipo a construir cumplirá estrictamente con los siguientes 19 elementos funcionales:

1. Local configurado: **Punto Burger Esperanza**.
2. Mesa física de prueba: **Mesa 01**.
3. URL simulada de acceso QR: `/table/mesa-01`.
4. Código temporal del local generado y validado server-side.
5. Creación de sesión autónoma sin intervención del personal.
6. Emisión de cookie de control para el **dispositivo principal**.
7. Registro del **nombre del grupo**.
8. Registro de **1 a 4 participantes temporales** con alias y rango etario.
9. Selección de **categoría** de trivia o modo mezcladas.
10. Banco semilla inicial de **30 a 50 preguntas** cargadas en PostgreSQL.
11. Partida de **10 preguntas** congeladas al inicio.
12. Curva de dificultad progresiva: **3 iniciales, 4 medias, 3 avanzadas**.
13. **Temporizador visual de 20 segundos** sincronizado con `expires_at` en servidor.
14. Validación server-side estricta de tiempo de respuesta.
15. Motor de puntuación oficial (**100/150/200**, **20**, **0 pts**).
16. Pantalla de **resultado final** con desglose completo y tono positivo.
17. Persistencia de la partida en base de datos.
18. **Recuperación automática de la partida** ante recarga de página conservando el tiempo real.
19. Liberación automática de la mesa tras el cierre de sesión.

*Elementos excluidos del prototipo inicial:* Escuelas y cursos, temporadas, rankings escolares masivos, envío real de SMS/WhatsApp, catálogo de premios diferidos y panel administrativo avanzado.

---

## 19. Plan y Secuencia de Implementación Propuesta

| Ticket | Entregable Técnico |
|---|---|
| **PPA-008** | **Bootstrap del Proyecto:** Inicialización de Next.js 16.x (App Router), TypeScript estricto, Tailwind CSS (Mobile-First), ESLint, Prettier y estructura modular de carpetas. |
| **PPA-009** | **Modelo Inicial y Seeds:** Configuración de Drizzle ORM, conexión a PostgreSQL en Supabase, migraciones del esquema incremental (13 entidades) y script de seed (Punto Burger Esperanza, Mesa 01, preguntas). |
| **PPA-010** | **Acceso de Mesa, Código Temporal y Sesión:** Ruta `/table/[tableId]`, generación/validación del código temporal, endpoint `POST /api/v1/tables/claim` y emisión de cookie de dispositivo principal. |
| **PPA-011** | **Grupo y Participantes:** Formulario de registro de grupo (1 a 4 participantes temporales) y selección de categoría temática. |
| **PPA-012** | **Motor de Trivia:** Secuenciador de 10 preguntas (distribución 3/4/3), endpoint `POST /api/v1/game/start` con congelamiento de secuencia y cálculo de timestamps de expiración. |
| **PPA-013** | **Juego, Puntuación y Resultados:** Componente interactivo de trivia con temporizador visual, endpoint `POST /api/v1/game/answer`, scoring server-side y pantalla de resultado final. |
| **PPA-014** | **Recuperación y Resiliencia:** Endpoint `GET /api/v1/game/current` para retomar partidas tras recarga o corte de red preservando el tiempo restante real. |
| **PPA-015** | **Validación E2E del Prototipo:** Pruebas unitarias de las reglas de scoring y prueba automatizada del flujo completo jugable de extremo a extremo. |

---

## 20. Decisiones Técnicas Confirmadas

- ✅ **Framework:** **Next.js 16.x estable / Active LTS (App Router)** en TypeScript estricto.
- ✅ **Diseño:** **Tailwind CSS** con enfoque responsivo *Mobile-First*.
- ✅ **Validación:** **Zod** compartiendo esquemas entre cliente y servidor.
- ✅ **Base de Datos:** **PostgreSQL 15+** relacional gestionado en **Supabase** mediante esquema incremental.
- ✅ **Capa de Datos:** **Drizzle ORM** con Drizzle Kit para migraciones declarativas.
- ✅ **Infraestructura de Aplicación:** **DonWeb Cloud Server Linux** (Ubuntu/Debian LTS) persistente.
- ✅ **Servidor Web y Proxy:** **Nginx** (SSL/TLS, reverse proxy, headers de seguridad, compresión).
- ✅ **Gestor de Procesos:** **PM2** para ejecución continua y reinicio automático de Next.js.
- ✅ **Autenticación:** Credencial temporal propia en cookie segura para invitados; **Supabase Auth** para usuarios registrados y administración.
- ✅ **Autoridad del Servidor:** APIs en Route Handlers (`/api/v1/*`) delegando en servicios de dominio; temporizadores (`expires_at`) y cómputo de puntos resueltos 100% en backend.
- ✅ **CI/CD:** **GitHub Actions** para pruebas automáticas y despliegue por SSH a DonWeb.

---

## 21. Criterios de Aceptación Técnicos

PPA-007 queda formalmente aprobado al verificar que:

- [x] Se descartó Vercel y se adoptó DonWeb Cloud Server Linux como infraestructura de producción.
- [x] Se seleccionó Next.js 16.x estable (Active LTS) con App Router y TypeScript estricto.
- [x] Se estableció Nginx como proxy inverso y PM2 como supervisor del proceso persistente Node.js.
- [x] Se resolvió la autenticación de invitados mediante cookie de sesión propia emitida por el servidor (sin crear usuarios en Supabase Auth).
- [x] Se aisló el acceso a la base de datos: el navegador nunca consulta tablas críticas directamente vía Supabase Data API.
- [x] Se separaron conceptualmente las conexiones de runtime persistente y de migraciones en Drizzle.
- [x] Se definieron Route Handlers versionados (`/api/v1/*`) respaldados por servicios de dominio desacoplados.
- [x] Se eliminó la tolerancia fija de 1.5s en temporizadores, manteniendo `expires_at` como límite autoritativo del servidor.
- [x] Se incorporó la entidad `venue` y el uso de `venue_id` como clave foránea sin acoplamiento a slugs.
- [x] Se definió un esquema de base de datos incremental que limita PPA-009 a las entidades indispensables del Vertical Slice.
- [x] Se transparentaron los costos reales de hosting en DonWeb y servicios auxiliares.
- [x] Se definió la estrategia de backups distinguiendo el servidor DonWeb y la base de datos Supabase.
- [x] Se definió el alcance exacto de los 19 puntos del Vertical Slice y la secuencia PPA-008 a PPA-015.
- [x] Se actualizó el ADR en `docs/adr/001-technology-stack.md`.
- [x] No se creó código funcional, no se instalaron paquetes y no se inicializó Next.js.
