# ADR 001: Selección del Stack Tecnológico y Arquitectura de Despliegue para Punto Burger

## Estado

Aprobado

## Fecha

2026-07-19

## Contexto y Problema

Punto Burger requiere una plataforma digital centrada en la experiencia de mesa en su local gastronómico en Esperanza, Santa Fe. El sistema debe permitir a los clientes acceder mediante códigos QR físicos y códigos temporales, participar en trivias interactivas de 10 preguntas con temporizadores de 20 segundos por turno, acumular puntajes, representar a escuelas y cursos, y canjear premios gastronómicos sin requerir la asistencia manual recurrente del personal del bar.

Para iniciar la fase de desarrollo, el equipo necesita una decisión técnica definitiva que:

1. Permita construir inmediatamente un **primer prototipo jugable** de extremo a extremo (Vertical Slice).
2. Tenga la solidez arquitectónica para evolucionar hacia el lanzamiento público masivo sin reescribir la aplicación.
3. Garantice que las reglas críticas (sesiones de mesa, temporizadores, validación de respuestas, scoring y rankings escolares) sean gobernadas con autoridad absoluta por el servidor.
4. Se ejecute en infraestructura soberana y predecible en costos, adoptando un servidor Linux persistente en **DonWeb Cloud Server**.
5. Emplee **Supabase** exclusivamente como servicio gestionado para la base de datos relacional PostgreSQL y la autenticación de usuarios registrados.

---

## Alternativas Evaluadas

### Alternativa A (Aprobada): Next.js 16 (TypeScript) + DonWeb Cloud Server (Nginx + PM2) + Supabase (PostgreSQL & Auth)

- **Frontend & Backend:** Next.js 16.x estable / Active LTS (App Router) en Full-Stack TypeScript.
- **UI & Validación:** Tailwind CSS (Mobile-First) + Zod.
- **Base de Datos & ORM:** PostgreSQL gestionado en Supabase con Drizzle ORM (conexiones persistentes separadas para runtime y migraciones).
- **Infraestructura:** DonWeb Cloud Server Linux (Ubuntu/Debian) ejecutando el runtime persistente Node.js supervisado por PM2, detrás de Nginx como proxy inverso y terminador TLS.
- **Autenticación:** Credencial temporal propia en cookie segura (`pb_table_session`) para invitados emitida por el backend; Supabase Auth para usuarios registrados y administración.

### Alternativa B (Descartada): Vercel Serverless + Supabase

- **Descripción:** Despliegue de Next.js en la plataforma serverless propietaria de Vercel.
- **Motivo de Descarte:** Genera dependencia de una plataforma cerrada con costos en dólares variables e impredecibles por invocaciones serverless y límites de ancho de banda. No otorga control sobre el servidor Linux, dificulta la inspección directa de procesos y somete las conexiones a base de datos a desconexiones recurrentes por cold starts.

### Alternativa C (Descartada): Laravel (PHP) + PostgreSQL + Blade / Inertia

- **Descripción:** Monolito tradicional en PHP con framework Laravel y PostgreSQL.
- **Motivo de Descarte:** Introduce un stack dual (PHP en backend + Node/TypeScript en frontend), impidiendo compartir esquemas de validación Zod y tipos de dominio entre el cliente móvil y el servidor.

### Alternativa D (Descartada): React / Vite (SPA) + Supabase BaaS directo

- **Descripción:** Single Page Application consumiendo directamente las tablas de Supabase mediante Row Level Security (RLS).
- **Motivo de Descarte:** Vierte lógica crítica al cliente o exige implementar lógica de negocio compleja en procedimientos almacenados (`PL/pgSQL`) o Deno Edge Functions. Además, crear usuarios anónimos en Supabase Auth por cada comensal de mesa saturaría la base de autenticación con millones de registros basura.

---

## Decisión Aprobada

Se aprueba de forma unánime y definitiva la arquitectura basada en:

$$\mathbf{Next.js\ 16.x\ (App\ Router\ /\ TypeScript)\ +\ Tailwind\ CSS\ +\ Zod\ +\ Drizzle\ ORM\ +\ Supabase\ PostgreSQL\ \&\ Auth\ +\ DonWeb\ Cloud\ Server\ (Nginx\ +\ PM2)}$$

### Componentes Clave:

1. **Frontend & Backend:** Next.js 16.x estable / Active LTS (App Router) con TypeScript en modo estricto.
2. **Interfaz de Usuario:** Tailwind CSS optimizado para experiencia móvil táctil (_Mobile-First_).
3. **Validación:** Zod con esquemas compartidos entre cliente y servidor.
4. **Base de Datos:** PostgreSQL 15+ gestionado en Supabase, implementado mediante un esquema incremental (13 entidades en el prototipo).
5. **Capa de Persistencia:** Drizzle ORM con separación conceptual de `DATABASE_URL` (pool persistente) y `DATABASE_MIGRATION_URL` (directo para Drizzle Kit).
6. **Autenticación Persistente:** Supabase Auth para usuarios registrados (anclados en su número de celular) y personal administrativo.
7. **Autenticación de Invitados:** Credencial temporal propia emitida por el backend en cookie `HttpOnly`, `Secure` y `SameSite` con hash de secreto criptográfico aleatorio en base de datos.
8. **Hosting y Servidor:** DonWeb Cloud Server Linux (Ubuntu o Debian LTS persistente).
9. **Proxy Inverso:** Nginx gestionando HTTPS, headers de seguridad, compresión y reenvío local a Node.js.
10. **Gestor de Procesos:** PM2 garantizando supervisión continua y reinicio automático de Next.js ante caídas o reinicios del servidor.
11. **Contenedores:** Docker queda aprobado como alternativa o evolución futura, pero no es obligatorio para el primer prototipo.
12. **Control de Versiones y CI/CD:** GitHub con GitHub Actions para testing y compilación previa al despliegue SSH al servidor DonWeb.

---

## Razones de la Elección

1. **Soberanía y Previsibilidad de Costos en DonWeb:** El Cloud Server en DonWeb brinda previsibilidad presupuestaria en moneda local, acceso SSH completo, control total sobre las políticas de Nginx y registros persistentes sin facturación opaca por peticiones.
2. **Full-Stack TypeScript Unificado:** Permite compartir tipos de dominio (`Question`, `GameSession`, `TableSession`) y esquemas de validación Zod entre la interfaz móvil y el servidor sin duplicar código ni generar desfasajes de contratos.
3. **Autoridad Absoluta del Servidor:** El navegador del cliente jamás consulta tablas críticas directamente vía Supabase Data API. Toda la lógica de sesiones, códigos temporales, temporizadores autoritativos (`expires_at`), respuestas y puntuación corre en servicios de dominio Node.js expuestos por Route Handlers versionados (`/api/v1/*`).
4. **Manejo Limpio de Invitados:** La cookie temporal firmada por el backend evita crear millones de usuarios anónimos en Supabase Auth, manteniendo la base de identidades limpia exclusivamente para clientes registrados con celular.
5. **Simplicidad Operativa con PM2 y Nginx:** Despliegue directo, predecible y de bajísimo consumo de memoria sobre el sistema operativo, permitiendo iniciar el desarrollo inmediatamente sin la sobrecarga inicial de pipelines complejos de contenedores.
6. **Evolución Progresiva:** La base relacional PostgreSQL en Supabase permite escalar desde el esquema incremental del primer prototipo hacia el modelo completo de temporadas, rankings escolares y fidelización mediante migraciones controladas de Drizzle Kit.

---

## Consecuencias y Tradeoffs

### Positivas

- **Velocidad máxima de entrega:** Construcción inmediata de los tickets de desarrollo (PPA-008 a PPA-015).
- **Control total de servidor:** Capacidad de configurar Nginx, certificados SSL, límites de tasa y supervisión en tiempo real con PM2.
- **Rendimiento predecible:** El proceso Node.js persistente elimina los problemas de _cold start_ característicos de arquitecturas serverless.
- **Seguridad robusta:** Aislamiento total de la base de datos detrás del backend de Next.js.

### Desafíos y Mitigaciones

- **Responsabilidad de Mantenimiento del Servidor DonWeb:**
  - _Mitigación:_ Se aplican buenas prácticas de endurecimiento de Linux: acceso por clave SSH exclusiva, firewall UFW estricto (solo puertos 22, 80 y 443 expuestos), ejecución bajo usuario no-root, actualizaciones de seguridad desatendidas y snapshots periódicos en DonWeb.
- **Riesgo de Inconsistencia en Conexiones a PostgreSQL desde Node.js:**
  - _Mitigación:_ Se separa la cadena de conexión de runtime (`DATABASE_URL` con pool persistente dimensionado a 5–10 conexiones) de la cadena de migraciones (`DATABASE_MIGRATION_URL` directa para Drizzle Kit), alimentadas desde variables de entorno seguras sin credenciales hardcodeadas.
- **Riesgo de Dependencia Excesiva de Middleware:**
  - _Mitigación:_ Se establece como regla obligatoria que cada servicio de dominio valide server-side la identidad, sesión, rol y estado de la entidad antes de ejecutar cualquier mutación, sin delegar la seguridad únicamente en el middleware de enrutamiento.
