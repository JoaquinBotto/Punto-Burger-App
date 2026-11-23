# PPA-008 — Bootstrap del Proyecto Punto Burger

## Metadatos del Documento

- **Ticket:** PPA-008
- **Título:** Bootstrap del Proyecto Punto Burger
- **Fecha:** 2026-11-06
- **Estado:** Completado
- **Autor:** Equipo de Desarrollo Punto Burger
- **Rama:** `main`

---

## 1. Resumen Ejecutivo

El ticket **PPA-008** constituye el primer hito de implementación de código en el repositorio de Punto Burger, siguiendo estrictamente la arquitectura técnica aprobada en **PPA-007** ([06-Technical Architecture](../../specs/06-technical-architecture.md)) y la decisión arquitectónica registrada en [ADR 001](../../docs/adr/001-technology-stack.md).

Se inicializó la aplicación web full-stack basada en **Next.js 16** (App Router) con TypeScript estricto, Tailwind CSS, Zod, ESLint 9, Prettier y Vitest. Se estructuró el proyecto bajo el patrón de **Monolito Modular** y se verificaron satisfactoriamente la compilación, el análisis estático, el chequeo de tipos y los tests unitarios.

---

## 2. Corrección Documental Previa (PPA-007)

Antes de iniciar el bootstrap de código, se corrigió la inconsistencia numérica detectada en la documentación de PPA-007:

- En `specs/06-technical-architecture.md`, `docs/adr/001-technology-stack.md` y `CHANGELOG.md` se referenciaban inicialmente "12 entidades", a pesar de que el listado explícito enumeraba **13 entidades**:
  1. `venues`
  2. `tables`
  3. `access_codes`
  4. `table_sessions`
  5. `devices`
  6. `groups`
  7. `participants`
  8. `categories`
  9. `questions`
  10. `game_sessions`
  11. `game_questions`
  12. `answers`
  13. `audit_events`
- Se actualizaron todos los documentos a **13 entidades iniciales**, manteniendo intactas todas las decisiones funcionales y de modelo.

---

## 3. Stack y Versiones Instaladas

Todas las dependencias instaladas cumplen estrictamente con las directivas aprobadas (Next.js 16.x estable / Active LTS, sin dependencias obsoletas ni wrappers innecesarios):

| Componente               | Paquete / Herramienta                     | Versión Instalada          | Propósito                                                                                                 |
| :----------------------- | :---------------------------------------- | :------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Runtime**              | Node.js                                   | v24 LTS (`v24.10.0` local) | Entorno de ejecución oficial unificado (fijado en `.nvmrc`, `package.json` engines y DonWeb Cloud Server) |
| **Framework Full-Stack** | `next`                                    | 16.4.5                     | Framework con App Router, Turbopack y Route Handlers                                                      |
| **Librería UI**          | `react`, `react-dom`                      | 19.3.0                     | Núcleo de componentes React                                                                               |
| **Lenguaje**             | `typescript`                              | 5.7.3                      | Tipado estático estricto                                                                                  |
| **Estilos CSS**          | `tailwindcss`, `@tailwindcss/postcss`     | 4.0.0                      | Motor utilitario con enfoque Mobile First                                                                 |
| **Validación de Datos**  | `zod`                                     | 3.24.2                     | Validación en tiempo de ejecución (env vars, DTOs)                                                        |
| **Linter**               | `eslint`, `eslint-config-next`            | 9.20.0 / 16.4.5            | Reglas oficiales Next.js con soporte Flat Config                                                          |
| **Formateador**          | `prettier`, `prettier-plugin-tailwindcss` | 3.5.0 / 0.6.11             | Formato consistente de código y clases CSS                                                                |
| **Testing Unitario**     | `vitest`, `@vitejs/plugin-react`          | 3.0.5 / 4.3.4              | Runner ultrarrápido compatible con ESM                                                                    |
| **DOM Testing**          | `@testing-library/react`, `jsdom`         | 16.2.0 / 26.0.0            | Renderizado y aserciones de componentes en testing                                                        |

---

## 4. Configuración Técnica

### 4.1 TypeScript (`tsconfig.json`)

Configurado en modo rigurosamente estricto:

- `strict: true`
- `noUncheckedIndexedAccess: true` (previene accesos inseguros a arrays/objetos)
- `noImplicitOverride: true`
- `target: "ES2022"`, `moduleResolution: "bundler"`
- Alias de rutas limpio: `@/*` apuntando a `./src/*`

### 4.2 Variables de Entorno (`.env.example` y `src/lib/env/index.ts`)

Se documentaron y validaron mediante un esquema estricto de **Zod**:

- `NODE_ENV`: `"development" | "production" | "test"`
- `PORT`: Opcional con valor por defecto `3000`
- `APP_URL`: URL base obligatoria validada como `url()`
- Variables preparadas para PPA-009 (marcadas opcionales en PPA-008 para permitir bootstrap sin BD):
  - `DATABASE_URL`: Connection string de runtime (PostgreSQL / Supabase Transaction Pooler)
  - `DATABASE_MIGRATION_URL`: Connection string directa para Drizzle Kit
  - `SUPABASE_URL` y `SUPABASE_ANON_KEY`: Credenciales cliente/servidor de Supabase
  - `SUPABASE_SERVICE_ROLE_KEY`: Credencial privilegiada para tareas administrativas server-only
  - `SESSION_COOKIE_SECRET`: Secreto criptográfico de al menos 32 caracteres para firmado de cookies

### 4.3 ESLint 9 (`eslint.config.mjs`)

Configuración moderna Flat Config que integra las reglas estándar de `eslint-config-next` adaptadas a Next.js 16 sin conflictos de plugins heredados.

### 4.4 Pruebas Unitarias (`vitest.config.ts`)

Configurado con entorno `jsdom`, plugin React oficial y resolución de alias `@/*` idéntica a `tsconfig.json`.

---

## 5. Estructura de Monolito Modular Creada

Siguiendo la arquitectura de dominio definida en PPA-007, se organizó el árbol de carpetas con aislamiento conceptual:

```text
src/
├── app/
│   ├── api/health/route.ts       # Route Handler GET /api/health
│   ├── api/health/route.test.ts  # Test unitario del health check
│   ├── layout.tsx                # Metadata oficial "Punto Burger" y viewport móvil
│   ├── page.tsx                  # Landing inicial informativa (Mobile First)
│   └── page.test.tsx             # Test unitario de landing page
├── components/
│   └── ui/                       # Primitivas UI reutilizables
│       └── README.md
├── lib/
│   ├── env/                      # Validador de entorno Zod y tests
│   │   ├── index.ts
│   │   └── index.test.ts
│   ├── security/                 # Módulo de seguridad criptográfica y cookies
│   │   └── README.md
│   ├── utils/                    # Utilidades generales y formateadores
│   │   ├── index.ts
│   │   └── index.test.ts
│   └── validation/               # Esquemas Zod transversales
│       └── README.md
├── modules/                      # Dominios de negocio aislados
│   ├── venues/README.md          # Locales físicos y configuración multi-local
│   ├── tables/README.md          # Mesas, códigos QR y estados de mesa
│   ├── sessions/README.md        # Sesiones de mesa, tokens y dispositivos
│   ├── groups/README.md          # Grupos de juego y participantes
│   ├── trivia/README.md          # Categorías, preguntas, partidas y puntuación
│   ├── identity/README.md        # Invitados, participantes y usuarios persistentes
│   ├── schools/README.md         # Escuelas, divisiones, cursos y temporadas
│   └── rewards/README.md         # Beneficios y canje de premios
├── styles/
│   └── globals.css               # Estilos globales y Tailwind CSS v4
└── test/
    └── setup.ts                  # Setup de Jest DOM para Vitest
```

Cada módulo contiene un `README.md` que detalla su responsabilidad, entidades involucradas y dependencias permitidas, asegurando que los siguientes tickets (PPA-009 en adelante) mantengan límites limpios sin acoplamiento espagueti.

---

## 6. Endpoints y Páginas Implementadas

### 6.1 Health Check (`GET /api/health`)

Endpoint diagnóstico ligero, público y sin autenticación, diseñado para monitoreo por Nginx, PM2 o sondas externas:

- **Respuesta HTTP:** `200 OK`
- **Payload:**

```json
{
  "status": "ok",
  "service": "punto-burger-app",
  "timestamp": "2026-11-06T14:59:54.656Z"
}
```

### 6.2 RootLayout y Accesibilidad de Viewport (`src/app/layout.tsx`)

- Metadatos con título oficial **Punto Burger**.
- Configuración de `viewport` estándar mobile-first sin bloqueo de zoom (`width: "device-width"`, `initialScale: 1`). Se eliminaron explícitamente `maximumScale` y `userScalable` para garantizar plena accesibilidad a personas con visión reducida.

### 6.3 Landing Page (`/`)

Diseño móvil primero (Mobile First), limpio, sin imágenes externas pesadas ni fuentes remotas bloqueantes:

- Comunica claramente la marca oficial **Punto Burger**.
- Especifica la ubicación: **Esperanza, Santa Fe**.
- Informa que la plataforma se encuentra en fase de desarrollo activo.
- Explica la experiencia de autoservicio para mesas mediante código QR en el local.
- Incluye indicador dinámico del estado del sistema en línea.

---

## 7. Pipeline de Integración Continua (`.github/workflows/ci.yml`)

Se configuró el workflow oficial de GitHub Actions que se ejecuta automáticamente en cada `push` a `main` y en `pull_request`:

1. Checkout del código (`actions/checkout@v4`).
2. Configuración de Node.js 24 LTS (`actions/setup-node@v4` con caché de `npm`).
3. Instalación de dependencias reproducible (`npm ci`).
4. Verificación de Linter (`npm run lint`).
5. Verificación de Tipos TypeScript (`npm run typecheck`).
6. Ejecución de Pruebas Unitarias (`npm run test:run`).
7. Compilación de Producción (`npm run build`).

---

## 8. Verificación y Resultados de Ejecución

Todos los scripts fueron ejecutados y validados localmente bajo Node.js 24 LTS con código de salida `0`:

| Comando             |               Resultado                | Detalle                                                                  |
| :------------------ | :------------------------------------: | :----------------------------------------------------------------------- |
| `npm run lint`      | ✅ **Exitoso (0 errores, 0 warnings)** | Análisis estático completo con ESLint 9                                  |
| `npm run typecheck` |       ✅ **Exitoso (0 errores)**       | `tsc --noEmit` completado sin discrepancias                              |
| `npm run test:run`  | ✅ **Exitoso (15/15 tests aprobados)** | 5 suites ejecutadas en Vitest (env, utils, health, page, layout)         |
| `npm run build`     |       ✅ **Exitoso (Turbopack)**       | Compilación optimizada en Next.js 16 (`/`, `/_not-found`, `/api/health`) |
| `curl /api/health`  |       ✅ **Exitoso (HTTP 200)**        | Payload JSON correcto con timestamp ISO                                  |

---

## 9. Próximos Pasos (PPA-009)

Con el bootstrap de base validado y operativo:

1. **PPA-009**: Integración de PostgreSQL en Supabase gestionado y configuración de Drizzle ORM + Drizzle Kit para las 13 entidades iniciales del esquema relacional.
2. Ningún código de base de datos fue adelantado en este ticket, garantizando el principio de entregas incrementales y delimitadas.

---

## 10. Hotfix Final PPA-008 — Unificación de Runtime Node 24 LTS y Accesibilidad

Tras la aprobación inicial de PPA-008, se aplicaron dos ajustes técnicos indispensables:

1. **Unificación a Node.js 24 LTS:**
   - Se actualizó `.nvmrc` a `24`.
   - Se agregó `"engines": { "node": ">=24 <25" }` en `package.json`.
   - Se actualizó el pipeline CI en `.github/workflows/ci.yml` a `node-version: 24`.
   - Se unificó el entorno de desarrollo, CI y el futuro DonWeb Cloud Server bajo la misma versión mayor LTS de Node.
2. **Accesibilidad del Viewport:**
   - Se removieron `maximumScale: 1` y `userScalable: false` de `src/app/layout.tsx`.
   - Se preservó únicamente `width: "device-width"` y `initialScale: 1`, permitiendo el zoom libre en navegadores móviles conforme a las pautas WCAG de accesibilidad web.
   - Se agregó la suite de pruebas unitarias `src/app/layout.test.ts` para prevenir regresiones.
