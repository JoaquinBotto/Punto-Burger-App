# PROJECT_RULES.md
# Reglas Oficiales del Proyecto

El incumplimiento de estas reglas es motivo de rechazo inmediato de cualquier Pull Request o entregable.

1. **Nunca modificar archivos fuera del alcance del ticket:**
   El alcance de un entregable debe ser mínimo y enfocado. Si descubres refactorizaciones necesarias en otras áreas, crea un ticket nuevo para abordarlas por separado.

2. **Nunca asumir decisiones técnicas no documentadas:**
   Si una decisión arquitectónica, selección de librería o patrón de diseño no está explícitamente documentado en la especificación SDD, debes consultar con el Software Architect antes de avanzar.

3. **Mantener una arquitectura limpia:**
   La lógica de negocio (dominio) nunca debe estar acoplada a detalles de infraestructura (bases de datos, frameworks web, UI). 

4. **Evitar duplicación de lógica (DRY):**
   Fomenta la reutilización mediante funciones puras, servicios o utilidades compartidas, siempre que el acoplamiento resultante esté justificado.

5. **Actualizar la documentación cuando corresponda:**
   Si un cambio en el código modifica el comportamiento del sistema, la documentación correspondiente (SDD, README, etc.) debe actualizarse en el mismo Pull Request.

6. **Cada Pull Request deberá resolver un único entregable:**
   PRs masivos o que aborden múltiples preocupaciones (features + refactors + bugfixes) no están permitidos. Los cambios deben ser granulares y atómicos.

7. **Todo desarrollo deberá respetar las especificaciones SDD previamente aprobadas:**
   No se escribirán líneas de código funcional sin un documento SDD que lo respalde. Las discrepancias durante el desarrollo deben resolverse actualizando primero el SDD y luego el código.
