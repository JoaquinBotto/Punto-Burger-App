# PPA-003: Definición del MVP y Roadmap

## 1. Identificación
- **Nombre del producto:** Punto Burger
- **Estado:** Aprobado
- **Versión:** 1.0.0
- **Fecha:** 2026-07-14
- **Responsable:** Product Manager
- **Entregable:** PPA-003

## 2. Propósito del MVP
La primera versión del producto tiene como finalidad validar empíricamente las siguientes hipótesis clave del negocio:
- Que los clientes encuentren atractivo y quieran jugar en la app mientras esperan su comida.
- Que el juego reduzca efectivamente la percepción de espera.
- Que las dinámicas permitan la participación equitativa de grupos y familias con diferentes edades.
- Que el sistema de puntos y recompensas funcione como motivador real para la continuidad y recurrencia.
- Que la gestión del ecosistema (validar mesas, entregar premios) no genere una carga operativa excesiva o confusa para el personal.
- Que los usuarios estén dispuestos a volver al local para seguir acumulando beneficios y mejorando su posicionamiento.

## 3. División de entregas
El alcance se divide en dos hitos principales para reducir riesgos y validar iterativamente.

### MVP Interno
Destinado exclusivamente al equipo, invitados y clientes seleccionados bajo un entorno controlado.
**Incluye:**
- Acceso mediante lectura de QR de una mesa válida.
- Inicio y cierre manual/automático de una sesión de mesa (una sesión puede incluir uno o varios participantes, permitiendo jugar individualmente sin crear una modalidad técnica separada).
- Registro simplificado de participantes y nombre del grupo/mesa.
- Identificación de participantes con diferentes edades dentro de la mesa.
- Selección básica de categoría de trivia.
- Motor de preguntas de opción múltiple (usando un banco previamente aprobado).
- Curva de dificultad simple: inicial, media y avanzada.
- Algoritmo básico de alternancia de preguntas para incluir a distintas edades.
- Asignación de puntos por respuesta correcta y puntos menores por participación (respuestas incorrectas).
- Resultado final al terminar la partida.
- Ranking básico de la sesión en la mesa.
- Panel administrativo mínimo para gestión interna.
- Gestión manual del banco de preguntas por parte del equipo.
- Activación y desactivación de mesas de forma administrativa.
- Registro de métricas básicas de uso.
- Canje básico o premio demostrativo (totalmente controlado y validado por el personal).

*Nota: Durante esta fase de validación interna permanecerán desactivadas las funcionalidades de escuelas, cursos, ranking escolar, generación de preguntas mediante IA, temporadas y campañas.*

### Primera Versión Pública
Dirigida a todos los clientes del local, construida sobre lo validado en el MVP interno.
**Incorpora:**
- Registro persistente de usuarios (identidad conservada entre visitas).
- Puntos acumulables a lo largo del tiempo.
- Catálogo básico de premios visible para los usuarios.
- Flujo seguro de canje (para evitar abusos o fraudes).
- Integración de Escuelas y Cursos de Esperanza y zona.
- Asociación voluntaria del usuario con una escuela y curso específicos.
- Ranking básico por curso y escuela.
- Generación de preguntas mediante Inteligencia Artificial.
- Flujo administrativo para la revisión, edición, aprobación y rechazo de preguntas generadas por IA.
- Clasificación estricta de preguntas por edad, curso, materia, categoría y dificultad.
- Controles básicos contra abuso (ej. limitación de partidas por visita).
- Flujos de consentimiento y tratamiento responsable de datos (especialmente menores).
- Analítica operativa para administradores.
- Método técnico aprobado para restringir el acceso y el juego exclusivamente al interior del local.

## 4. Fuera del MVP
Quedan explícitamente fuera del alcance de este MVP y de la primera versión pública:
- Pedidos gastronómicos desde la aplicación.
- Funcionalidad de Delivery.
- Sistema de reservas de mesas.
- Pagos online o pasarelas de pago.
- Integración técnica con la caja o el sistema POS del local.
- Aplicaciones nativas para iOS o Android (App Stores).
- Red social abierta (muros, perfiles públicos externos).
- Chat directo entre usuarios o mesas.
- Competencias o conectividad entre múltiples sucursales.
- Marketing automatizado avanzado.
- Notificaciones push complejas.
- Personalización completa de la experiencia mediante IA.
- Generación de preguntas en tiempo real durante el transcurso de una partida (sin revisión previa).
- Torneos escolares avanzados o ligas complejas.
- Franquicias o licenciamiento de la plataforma (White Label).

## 5. Flujos críticos
Los flujos esenciales que deben funcionar sin fricción son:

### Cliente
QR → Validación de mesa → Registro simplificado o identificación temporal → Creación o ingreso al grupo → Selección de modalidad → Partida de trivia → Resultado final → Suma de puntos → Canje de premio o continuidad en otra partida.
*(La autenticación persistente de usuarios se incorpora en la primera versión pública).*

### Familia o grupo mixto
Registro inicial indicando edades/perfiles → Sistema selecciona preguntas de manera alternada adaptadas a cada rango etario → Participación equitativa de todos los miembros → Puntaje unificado grupal al final.

### Escuela
Registro de usuario con selección de escuela y curso → Partida regular en el local → Obtención de puntos válidos → Suma y actualización automática del ranking del curso/escuela.

### Administrador
Acceso seguro al panel → Gestión (ver, activar, bloquear) de mesas → Gestión del banco de preguntas → Solicitud de generación de preguntas mediante IA → Revisión manual → Publicación/Rechazo → Gestión del catálogo de premios y validación de canjes.

### Personal operativo
El cliente solicita canjear un premio → Validación rápida de la recompensa en la app del cliente o escaneo rápido → Confirmación del canje en el sistema → Cierre de la operación (entrega del premio).

## 6. Priorización

### Must Have
- Acceso por QR y validación de mesa.
- Registro simplificado.
- Participación de grupos con edades mixtas y alternancia de preguntas.
- Dificultad progresiva.
- Puntuación por acierto y por participación.
- Flujo administrativo (gestión de mesas y preguntas).
- (Pública): Escuelas, cursos y ranking escolar.
- (Pública): Generación asistida por IA con panel de aprobación.
- (Pública): Restricción de acceso exclusivo al local.
- (Pública): Catálogo de premios y canje seguro.

### Should Have
- Ranking local de la mesa.
- Analítica operativa para administradores.
- Activación y desactivación rápida de mesas.

### Could Have
- Identificadores visuales o avatares por jugador.

### Won't Have por ahora
- Pedidos gastronómicos, POS, Apps Nativas, IA en tiempo real, Red Social. *(Ver sección 4).*

## 7. Criterios de éxito por hito

### Validación interna
- Inicio correcto de sesiones.
- Finalización de partidas.
- Participación fluida y probada de grupos mixtos.
- Comprensión de las reglas por parte del usuario.
- Estabilidad técnica del flujo completo.
- Tiempo operativo bajo, comprensible y aceptable para el personal.
- Baja tasa de incidencias y abandonos.
- Opinión cualitativa positiva de los participantes en encuestas informales.

### Lanzamiento público
- Mesas que comienzan a jugar recurrentemente cada noche.
- Creación de base de usuarios recurrentes.
- Partidas completadas exitosamente.
- Canjes realizados y procesados sin incidentes operativos.
- Participación e inscripciones orgánicas por escuela.
- Uso del banco de preguntas y rotación de contenido.
- Volumen de preguntas generadas y aprobadas mensualmente por el equipo vía IA.
- Incidencias operativas en niveles mínimos (atención al cliente local).
- Intentos de abuso detectados y bloqueados eficientemente.

## 8. Roadmap por etapas

### Etapa 0 — Foundation y especificaciones
Documentación, reglas, arquitectura teórica, diseño UX y decisiones técnicas clave.

### Etapa 1 — Núcleo del MVP interno
QR, sesión de mesa, participantes, despliegue de preguntas, puntuación y resultado.

### Etapa 2 — Operación interna
Panel administrativo, gestión del banco de preguntas, métricas base y canje básico.

### Etapa 3 — Validación presencial
Pruebas exhaustivas en el local con equipo, invitados y clientes seleccionados.

### Etapa 4 — Preparación del lanzamiento público
Persistencia de usuarios, recompensas completas, seguridad, privacidad, integración IA y desarrollo del ecosistema para escuelas.

### Etapa 5 — Lanzamiento público
Activación masiva para clientes y escuelas de Esperanza.

### Etapa 6 — Evolución
Temporadas, eventos temáticos, rankings avanzados, fidelización compleja y expansión del modelo.

## 9. Dependencias funcionales
- No puede existir una partida sin una mesa válida e iniciada.
- No puede publicarse una pregunta generada por IA sin aprobación humana manual en el sistema.
- No puede realizarse un canje sin saldo suficiente y un premio vigente.
- No puede actualizarse un ranking escolar sin una asociación válida del usuario al curso/escuela.
- No puede acumularse progreso de manera persistente entre visitas sin una identidad estable (registro persistente).

## 10. Decisiones necesarias antes del desarrollo
- Un dispositivo por mesa (compartido) o múltiples dispositivos simultáneos.
- Registro obligatorio de inicio o modalidad de invitado temporal.
- Duración y cantidad exacta de preguntas por partida.
- Sistema inicial y matemático de puntuación.
- Lógica de cómo alternar preguntas en grupos mixtos (algoritmo).
- Método técnico de validación de presencia física en el local (geocerca, QR dinámico, Wi-Fi).
- Reglas mínimas de la economía de premios.
- Datos estrictamente necesarios y permitidos para menores.
- Forma de vincular escuelas y cursos de manera segura.
- Alcance específico y niveles de acceso en el panel administrativo.

## 11. Definition of Done del MVP
El producto (MVP interno o Público) estará completado cuando:
- Los flujos completos definidos operen sin bloqueos.
- Los criterios de aceptación de cada épica estén cumplidos y validados.
- Se hayan ejecutado y aprobado pruebas de simulación operativa.
- La documentación técnica y funcional (SDD) esté actualizada.
- Exista una ausencia total de errores críticos o fallos de seguridad detectados.
- El personal haya validado la operación (canjes/mesas) como sencilla y realizable.
- Se hayan verificado los cumplimientos mínimos de seguridad y privacidad de datos.
- Exista la capacidad operativa de realizar un rollback o desactivación de funciones críticas en producción ante contingencias.
