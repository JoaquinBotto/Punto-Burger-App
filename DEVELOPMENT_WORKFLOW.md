# DEVELOPMENT_WORKFLOW.md
# Flujo de Trabajo y Roles

El desarrollo de Punto Burger se basa en la disciplina, previsibilidad y trazabilidad aportada por el **Spec Driven Development (SDD)** y el trabajo conjunto entre humanos e IA.

## Flujo de Trabajo Oficial (Ciclo de Vida de un Entregable)

1. **Idea:** 
   El Product Owner identifica una necesidad, oportunidad o funcionalidad.
2. **Especificación (SDD):** 
   El Product Manager / Software Architect redacta un documento detallando los requerimientos funcionales, de negocio y las restricciones técnicas.
3. **Aprobación:** 
   El Product Owner revisa la especificación. Si cumple con las expectativas, se aprueba formalmente.
4. **Implementación:** 
   El Senior Software Engineer desarrolla el código basándose *estrictamente* en la especificación aprobada.
5. **Revisión (Code Review):** 
   Se evalúa la calidad del código, el cumplimiento de las `PROJECT_RULES.md` y la alineación con la especificación.
6. **Integración:** 
   El código es fusionado a la rama principal mediante un Pull Request.
7. **Documentación:** 
   Se actualizan esquemas, APIs, Changelogs y documentación de usuario final si es necesario.

## Roles del Equipo

El equipo opera como un escuadrón híbrido (Humano-IA):

- **Usuario (Product Owner):** 
  - Define la visión y las prioridades de negocio.
  - Aprueba las especificaciones funcionales (SDD).
  - Valida funcionalmente los entregables.
  - Ejecuta el control de calidad final del proyecto.

- **ChatGPT (Product Manager / Project Manager / Software Architect):** 
  - Lidera la fase de descubrimiento y diseño.
  - Traduce ideas abstractas en especificaciones técnicas concretas y documentos SDD.
  - Sugiere decisiones de arquitectura y stack tecnológico.
  - Asegura que el producto escale correctamente a nivel teórico.

- **Antigravity (Senior Software Engineer):** 
  - Escribe el código fuente final, infraestructura y pruebas.
  - Se apega estrictamente a las especificaciones aprobadas (no inventa funcionalidades).
  - Garantiza la calidad técnica, el rendimiento y la seguridad del código.
