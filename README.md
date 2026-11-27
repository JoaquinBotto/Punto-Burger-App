# Punto Burger

## ¿Qué es Punto Burger?

Punto Burger es la plataforma digital oficial del bar gastronómico Punto Burger, ubicado en Esperanza, Santa Fe, Argentina. La aplicación está diseñada para ser utilizada exclusivamente dentro del local mediante códigos QR dispuestos en cada mesa.

## Objetivo del Proyecto

El objetivo principal es construir un ecosistema digital de entretenimiento, fidelización y comunidad. Buscamos transformar el tiempo de espera en una experiencia interactiva y divertida mediante desafíos, trivias y recompensas, incrementando la permanencia de los clientes y generando una comunidad propia alrededor de la marca Punto Burger.

## Alcance General

El sistema combinará gastronomía y tecnología. Incluye desde el escaneo inicial del QR en la mesa para iniciar una sesión, hasta la participación en juegos en tiempo real, acumulación de puntos y acceso a beneficios. La arquitectura se diseñará para escalar hacia ligas de escuelas, competencias de cursos, temporadas y generación de contenido mediante IA.

## Estructura del Repositorio

El proyecto está organizado como un **Monolito Modular Full-Stack TypeScript** sobre Next.js 16 (App Router):

```text
├── .github/workflows/          # Integración Continua y Despliegue (CI y Deploy SSH)
│   ├── ci.yml                  # Validación en pull requests y push
│   └── deploy-production.yml   # Despliegue automatizado a DonWeb Cloud Server
├── deploy/                     # Infraestructura y scripts de despliegue
│   ├── nginx/                  # Configuración de Virtual Host para Nginx
│   └── scripts/                # Scripts de aprovisionamiento, deploy y rollback
├── docs/
│   ├── adr/                    # Architecture Decision Records (ADR 001)
│   ├── deployment/             # Guías de infraestructura de producción (DonWeb)
│   └── implementation/         # Informes de implementación (PPA-008 a PPA-HOTFIX-002)
├── specs/                      # Especificaciones funcionales y técnicas (SDD)
├── src/
│   ├── app/                    # Next.js App Router (layout, landing, APIs, /t/[qrToken], /play, /ranking)
│   │   ├── api/health/         # Endpoint de monitoreo y health check
│   │   ├── layout.tsx          # Layout raíz con viewport mobile-first
│   │   └── page.tsx            # Landing inicial de Punto Burger
│   ├── components/             # Componentes compartidos de interfaz
│   │   └── ui/                 # Primitivas UI reutilizables
│   ├── db/                     # Capa de persistencia relacional (PostgreSQL / Drizzle)
│   │   ├── client.ts           # Cliente tipado Drizzle y connection pooling
│   │   ├── migrate.ts          # Script de ejecución de migraciones
│   │   ├── migrations/         # Migraciones SQL versionadas
│   │   ├── repositories/       # Repositorios de datos por entidad
│   │   ├── schema/             # 13 entidades del Vertical Slice
│   │   └── seeds/              # Semillas idempotentes y banco de 360 preguntas
│   ├── lib/                    # Utilidades y configuración transversal
│   │   ├── env/                # Validación estricta de variables de entorno (Zod)
│   │   ├── security/           # Criptografía, hashing y códigos temporales HMAC
│   │   ├── supabase/           # Cliente SDK administrativo de Supabase
│   │   ├── utils/              # Funciones auxiliares y formateadores
│   │   └── validation/         # Esquemas y reglas de validación Zod
│   ├── modules/                # Módulos de dominio aislados (Monolito Modular)
│   │   ├── venues/             # Locales gastronómicos y configuración
│   │   ├── tables/             # Mesas físicas, códigos QR y estados de mesa
│   │   ├── sessions/           # Sesiones de mesa, temporales y cookies
│   │   ├── groups/             # Grupos de juego y participantes de mesa
│   │   ├── trivia/             # Preguntas, partidas, respuestas y puntuación
│   │   ├── identity/           # Usuarios persistentes, perfiles e invitados
│   │   ├── schools/            # Escuelas, cursos, divisiones y ligas
│   │   └── rewards/            # Premios, canjes y beneficios
│   ├── styles/                 # Estilos globales y Tailwind CSS
│   └── test/                   # Configuración y utilidades de testing (Vitest)
├── .env.example                # Variables de entorno documentadas
├── .nvmrc                      # Versión de Node.js fijada (24 LTS)
├── drizzle.config.ts           # Configuración de Drizzle Kit
├── ecosystem.config.cjs        # Configuración de supervisión de procesos con PM2
├── eslint.config.mjs           # Configuración flat de ESLint 9
├── next.config.ts              # Configuración de Next.js 16
├── package.json                # Dependencias y scripts de ejecución
├── tsconfig.json               # Configuración TypeScript estricta
└── vitest.config.ts            # Configuración de pruebas unitarias
```

### Documentación del Proyecto

- `README.md`: Resumen, desarrollo local y punto de entrada al proyecto.
- `AI_CONTEXT.md`: Contexto fundacional para desarrolladores e IAs.
- `PROJECT_RULES.md`: Reglas obligatorias de desarrollo.
- `DEVELOPMENT_WORKFLOW.md`: Metodología y flujo de trabajo oficial.
- `CONTRIBUTING.md`: Guías y convenciones para aportar código.
- `CHANGELOG.md`: Registro histórico de versiones y cambios.

### Especificaciones (SDD)

- [01-Product Vision](specs/01-product-vision.md): Visión, objetivos y reglas de negocio del ecosistema de Punto Burger.
- [02-MVP Roadmap](specs/02-mvp-roadmap.md): Definición de las etapas de validación, alcance del MVP interno y de la primera versión pública.
- [03-Game Mechanics](specs/03-game-mechanics.md): Especificación funcional completa de la mecánica de juego, reglas operativas, flujos, puntuación, ranking y recuperación de errores.
- [04-QR Table Access](specs/04-qr-table-access.md): Especificación funcional de acceso por QR, sesiones de mesa, activación temporal, dispositivo principal, transferencia de control y validación de presencia física.
- [05-Users, Schools & Consent](specs/05-users-schools-consent.md): Especificación funcional de identidades (participante, invitado, usuario persistente), perfiles dependientes, escuelas, cursos, consentimientos modulares, privacidad y roles.
- [06-Technical Architecture](specs/06-technical-architecture.md): Arquitectura técnica, selección de stack (Next.js 16 + DonWeb Cloud Server + Nginx + PM2 + Supabase PostgreSQL & Auth + Drizzle), modelo de datos incremental, seguridad, despliegue y plan del prototipo jugable.

### Decisiones de Arquitectura (ADR)

- [ADR 001: Technology Stack](docs/adr/001-technology-stack.md): Selección del stack Full-Stack TypeScript unificado en DonWeb Cloud Server (Nginx + PM2) con Supabase PostgreSQL & Auth frente a alternativas como Vercel, Laravel y React/Vite.

### Guías de Despliegue e Infraestructura

- [Guía de Despliegue en DonWeb Cloud Server](docs/deployment/donweb-production.md): Arquitectura de producción, aprovisionamiento con `bootstrap-server.sh`, releases versionados, SSL Let's Encrypt, configuración de Nginx, PM2 y pipeline CI/CD con GitHub Actions.

### Informes de Implementación

- [PPA-008: Bootstrap del Proyecto](docs/implementation/PPA-008-bootstrap.md): Inicialización de la aplicación base Next.js 16, TypeScript strict, Tailwind CSS, Zod, Vitest, ESLint y estructura modular.
- [PPA-009: Supabase, Drizzle, Modelo Inicial y Seeds](docs/implementation/PPA-009-database.md): Modelado de las 13 entidades fundacionales, esquema determinístico HMAC para códigos temporales de local, 72 preguntas de trivia aprobadas (12 por categoría), migraciones versionadas con Drizzle Kit y repositorios base.
- [PPA-010: Acceso a Mesa, Código Temporal y Sesión](docs/implementation/PPA-010-table-access.md): Acceso autoservicio por QR/URL, validación de código temporal HMAC de local, creación atómica de sesión y dispositivo principal, cookie segura `pb_table_session`, concurrencia, expiración perezosa y cooldown.
- [PPA-011: Configuración de Grupo, Participantes y Categoría](docs/implementation/PPA-011-group-setup.md): Wizard mobile-first de 3 pasos en `/play/setup`, validación de nombre de equipo, registro de 1 a 8 participantes temporales con rangos etarios y niveles educativos, selección de categorías activas con cálculo de readiness (3/4/3), persistencia atómica en `groups`, `participants` y `game_sessions` (`status: created`), e idempotencia.
- [PPA-012: Motor de Selección y Congelado de Preguntas](docs/implementation/PPA-012-question-sequence.md): Selección inmutable de 10 preguntas balanceadas pedagógicamente (3 initial, 4 medium, 3 advanced), algoritmo de compatibilidad por perfiles etarios, asignación individual/mixta, snapshots inmutables en `game_questions` y endpoint de preparación `/api/v1/games/prepare`.
- [PPA-UI-001: Identidad Visual Oficial Punto Burger](docs/implementation/PPA-UI-001-brand-identity.md): Aplicación global del sistema de diseño oficial de la marca: paleta cromática (`--pb-red`, `--pb-cream`, `--pb-charcoal`, `--pb-yellow`), tipografía, componentes UI reutilizables y rediseño Mobile-First de `/table/[tableCode]`, `/play/setup` y `/play`.
- [PPA-013: Gameplay E2E y Primera Demo Jugable](docs/implementation/PPA-013-gameplay.md): Experiencia jugable completa E2E con temporizador autoritativo server-side (20s), motor de puntuación pura (+100/+150/+200 por acierto, +20 por error, 0 por tiempo agotado), feedback didáctico inmediato, pantalla de resultados `/play/results`, cierre de sesión con cooldown de mesa (120s) y auto-liberación.
- [PPA-RANK-001: Ranking Diario Competitivo entre Mesas](docs/implementation/PPA-RANK-001-daily-table-ranking.md): Ranking diario oficial automático entre mesas en timezone `America/Argentina/Cordoba`, mejor partida por mesa, campo `ranking_eligible` con exclusión de históricos y smoke tests, desempates ordenados (score, aciertos, tiempo de respuesta, fecha), endpoint público TV-Ready `/api/v1/rankings/daily`, endpoint contextual `/api/v1/rankings/daily/me`, pantalla `/ranking` con podio Top 3 e integración en `/play/results`.
- [PPA-ACCESS-002: Acceso Directo por QR Permanente](docs/implementation/PPA-ACCESS-002-permanent-qr-access.md): Acceso directo por QR permanente e inmutable con tokens criptográficos de ≥128 bits, aprovisionamiento de 30 mesas físicas y exportación de manifiesto para imprenta.
- [PPA-CONTENT-001: Expansión Urgente del Banco a 360 Preguntas](docs/implementation/PPA-CONTENT-001-question-bank-expansion.md): Expansión del catálogo a exactamente 360 preguntas aprobadas distribuidas equitativamente (60 por categoría: 20 initial, 20 medium, 20 advanced).
- [PPA-LAUNCH-001: Hotfix de Equidad Competitiva](docs/implementation/PPA-LAUNCH-001-competitive-fairness.md): Eliminación de la influencia de `ageRange` y `educationLevel` en la selección de preguntas y turnos, garantizando paridad competitiva total.
- [PPA-CONTEST-001: Competencia Diaria de 3 Ciclos + Presencia Wi-Fi](docs/implementation/PPA-CONTEST-001-three-round-competition.md): Torneo programable entre mesas físicas con 3 ciclos de 10 preguntas cada uno (30 slots con dificultad progresiva 1300/1500/1700, máximo 4500 pts), blueprint compartido, 0 repeticiones de preguntas en 30 slots, descanso entre ciclos sin expirar la mesa, ranking competitivo en vivo con desempate multifactorial, y validación modular de presencia física por Wi-Fi.

## Desarrollo local

### Requisitos previos

- **Node.js**: v24 LTS (ver `.nvmrc` y `engines` en `package.json`)
- **npm**: v11 o superior (incluido con Node 24)

### Pasos de inicialización

1. Clonar el repositorio y posicionarse en la raíz del proyecto:

```bash
cd Punto-Papas-App
```

2. Configurar las variables de entorno locales copiando la plantilla de ejemplo:

```bash
cp .env.example .env.local
```

Completar las credenciales requeridas en `.env.local` (`DATABASE_URL` y `DATABASE_MIGRATION_URL` en puerto 5432 Direct Connection, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, etc.).

3. Instalar las dependencias del proyecto:

```bash
npm install
```

4. Iniciar el servidor de desarrollo local:

```bash
npm run dev
```

La aplicación estará accesible en [http://localhost:3000](http://localhost:3000).

### Comprobación del servicio (Health Check)

Con el servidor en ejecución, verificar el endpoint de diagnóstico:

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "punto-burger-app",
  "timestamp": "2026-11-23T..."
}
```

### Gestión de Base de Datos y Persistencia

- **Generar migraciones SQL**: `npm run db:generate` (analiza cambios en `src/db/schema/` y crea SQL versionado en `src/db/migrations/`).
- **Ejecutar migraciones**: `npm run db:migrate` (aplica migraciones pendientes a la base de datos configurada en `DATABASE_MIGRATION_URL`).
- **Ejecutar seed de datos**: `npm run db:seed` (siembra de forma idempotente local, Mesa 01, 6 categorías y 72 preguntas aprobadas).
- **Aprovisionar 30 mesas físicas**: `npm run tables:provision` (aprovisiona de forma idempotente las 30 mesas oficiales `mesa-01` a `mesa-30` con tokens QR criptográficos permanentes).
- **Renovación operativa de mesa**: `npm run table:renew -- mesa-XX [--force]` (libera operativamente una mesa para nuevos clientes, cerrando la sesión anterior y preservando el historial).
- **Crear competencia de 3 ciclos**: `npm run competition:create -- [--open] [--name "..."]` (crea una competencia oficial programada o abierta).
- **Consultar estado de competencia**: `npm run competition:status` (consulta métricas de inscripciones, ciclos y podio actual).
- **Finalizar competencia**: `npm run competition:finalize` (finaliza manualmente una competencia oficial o abierta).
- **Exportar manifiesto QR para imprenta**: `npm run qr:export` (exporta manifiesto en formato CSV y JSON con URLs completas a `/var/www/punto-burger-app/shared/qr-print/` con permisos `chmod 600`).
- **Rotar token QR de mesa individual**: `npm run qr:rotate -- mesa-XX` (rota de emergencia el token QR de una mesa física preservando su historial de juego).
- **Consultar código temporal de salón (CLI)**: `npm run dev:access-code -- esperanza-central` (herramienta de desarrollo para depuración de códigos temporales de TV).
- **Inspección visual (Dev Only)**: `npm run db:studio` (interfaz visual Drizzle Studio para depuración en desarrollo).

### Scripts de calidad y compilación

- **Linter**: `npm run lint` (ESLint 9 con reglas oficiales Next.js)
- **Verificación de tipos**: `npm run typecheck` (`tsc --noEmit` estricto)
- **Pruebas unitarias**: `npm run test:run` (Vitest en modo ejecución única)
- **Compilación de producción**: `npm run build` (Next.js / Turbopack)
- **Servidor de producción**: `npm run start`

## Despliegue Continuo a Producción (DonWeb)

El proyecto cuenta con integración y despliegue continuo configurado mediante **GitHub Actions**:

- **Dominio Oficial**: [https://app.puntoburger.com.ar](https://app.puntoburger.com.ar)
- **Flujo Automático**: Cada `git push` a la rama `main` ejecuta la suite de validación obligatoria (lint, typecheck, tests unitarios, build, sync de esquemas) y, si todo resulta exitoso, despliega automáticamente por SSH al Cloud Server en DonWeb, actualiza el release versionado, ejecuta migraciones y recarga PM2 sin caída de servicio.
- Para más detalles sobre configuración de servidor, variables y rollback, consultar [docs/deployment/donweb-production.md](docs/deployment/donweb-production.md).

## Metodología de Desarrollo

Este proyecto se rige estrictamente por **Spec Driven Development (SDD)**. Ninguna funcionalidad se desarrolla sin una especificación previamente redactada, debatida y aprobada.

## Flujo de Trabajo

1. Idea
2. Especificación
3. Aprobación
4. Implementación
5. Revisión
6. Integración
7. Documentación

Para más detalle, consultar `DEVELOPMENT_WORKFLOW.md`.

## Cómo Comenzar a Colaborar

1. Leer detenidamente `AI_CONTEXT.md` para entender el negocio y las restricciones.
2. Leer `PROJECT_RULES.md` y `CONTRIBUTING.md` para conocer los estándares exigidos.
3. Revisar el backlog de tareas y tomar la especificación aprobada correspondiente al siguiente entregable.
