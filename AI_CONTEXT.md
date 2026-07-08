# AI_CONTEXT.md
# Contexto del Proyecto para IAs y Desarrolladores (AI Context)

Este documento es la fuente de verdad y contexto principal para cualquier desarrollador humano o asistente de Inteligencia Artificial que participe en el proyecto Punto Burger.

## Visión del Producto
Convertir a Punto Burger en más que un bar gastronómico: un ecosistema digital de comunidad, entretenimiento y fidelización en Esperanza, Santa Fe. La app debe ser el diferencial tecnológico que invite a los clientes a quedarse más tiempo y a volver recurrentemente.

## Objetivos Comerciales
1. **Retención y Permanencia:** Aumentar el tiempo que los clientes pasan en el local a través del entretenimiento (trivias, juegos en la mesa).
2. **Fidelización:** Crear un sistema de puntos, niveles y recompensas canjeables en el bar.
3. **Comunidad:** Establecer a Punto Burger como el punto de encuentro competitivo y social para colegios, grupos de amigos y eventos de la ciudad.

## Objetivos Técnicos
1. **Escalabilidad desde el Día 1:** La arquitectura debe soportar eventos concurrentes masivos en tiempo real dentro del local y debe ser capaz de crecer hacia arquitecturas multi-tenant (para separar colegios, cursos).
2. **Calidad y Mantenibilidad:** Código altamente legible, modularizado y sin deudas técnicas prematuras.
3. **Trazabilidad:** Cada cambio debe tener una razón de ser y estar reflejado en la documentación (SDD).

## Alcance del MVP
El Producto Mínimo Viable (MVP) debe contemplar:
- Registro y autenticación de usuarios.
- Registro y lectura de mesas mediante QR.
- Juego de trivia en tiempo real por mesa.
- Sistema básico de puntuación y ranking local de la mesa.
- Billetera de puntos y catálogo de premios.
- Panel administrador básico para control de mesas.

## Funcionalidades Futuras Previstas
- Rankings globales, por escuelas y competencias entre cursos.
- Sistema de Temporadas y eventos especiales temporales.
- Generación automática de contenido (preguntas/desafíos) mediante IA.
- Campañas de marketing dirigidas y notificaciones push.
- Gestión avanzada de beneficios y fidelización.

## Principios Arquitectónicos
- **Domain-Driven Design (DDD) / Arquitectura Limpia:** La lógica de negocio debe estar estrictamente separada de la infraestructura, base de datos y UI.
- **Spec Driven Development (SDD):** El diseño precede al código.
- **Agnosticismo Tecnológico Temprano:** Las decisiones de stack se toman sólo cuando es estrictamente necesario y se documentan explícitamente.

## Convenciones Generales
- Idioma de la documentación base: Español.
- (Las convenciones de código se definirán tras la selección del stack tecnológico).

## Restricciones
- No asumir tecnologías de Frontend, Backend o Base de Datos hasta que exista un documento de decisión arquitectónica aprobado.
- La app se utilizará **exclusivamente dentro del local**, lo que implica dependencia de la lectura del QR físico para iniciar sesiones clave.

## Reglas para Asistentes de IA
1. **Nunca programar sin especificación:** Si se te pide desarrollar una funcionalidad y no existe una especificación SDD clara y aprobada en el contexto, debes detenerte y pedir la especificación.
2. **Consultar este archivo:** Utiliza este documento como filtro para cualquier sugerencia técnica o de producto. Si una propuesta viola la visión o las restricciones aquí descritas, descártala.
3. **No alucinar contexto:** Básate estrictamente en los documentos proporcionados.
4. **Respuestas concisas:** Evita explicaciones redundantes; enfócate en el código o la documentación solicitada siguiendo el rol asignado.
