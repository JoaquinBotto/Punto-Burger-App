# CONTRIBUTING.md
# Guía de Contribución

¡Gracias por contribuir a Punto Burger! Para mantener la calidad y el orden en este proyecto a largo plazo, hemos definido los siguientes estándares.

## 1. Convención para Nombres de Ramas
Las ramas deben seguir una nomenclatura descriptiva basada en el tipo de trabajo y el identificador del ticket (ej. Jira ID):
- `feature/PPA-123-nombre-corto` para nuevas funcionalidades.
- `fix/PPA-124-descripcion-error` para correcciones de bugs.
- `docs/PPA-125-update-readme` para cambios exclusivos de documentación (ej. SDDs).
- `chore/PPA-126-update-deps` para tareas de mantenimiento.

## 2. Convención para Commits
Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: [PPA-123] agrega soporte para escaneo de QR`
- `fix: [PPA-124] corrige cálculo de ranking en empates`
- `docs: [PPA-125] actualiza el SDD de autenticación`
- `refactor: [PPA-126] extrae lógica de validación de puntos`

## 3. Convención para Pull Requests
- El título del PR debe seguir la misma convención de commits (ej. `feat: [PPA-123] Agrega soporte para escaneo de QR`).
- Todo PR debe estar enlazado a su ticket correspondiente.
- El PR debe resolver un único problema o funcionalidad pequeña.
- Deben superarse todos los checks automáticos (Linters, Tests, CI) antes de solicitar revisión.

## 4. Organización de Carpetas
*(La estructura final dependerá de las decisiones arquitectónicas, pero en principio aplicaremos una organización por módulos/dominios de negocio, no por tipo de archivo).*
Por el momento, los documentos fundacionales residen en la raíz del proyecto y las especificaciones deberán agruparse en una carpeta dedicada (ej. `docs/sdd/`).

## 5. Buenas Prácticas
- **Inglés para el Código:** Aunque la documentación base de negocio está en español, todo el código (nombres de variables, funciones, clases, commits) debe escribirse preferentemente en inglés para adherir al estándar de la industria, salvo que una regla técnica defina lo contrario.
- **KISS & YAGNI:** Mantén las soluciones simples. No construyas abstracciones para casos de uso que aún no existen en las especificaciones.

## 6. Estándares Mínimos de Calidad
- Tipado estricto (si se usa un lenguaje fuertemente tipado).
- Cobertura de tests unitarios para la lógica core del dominio.
- Cero advertencias (warnings) de linters permitidas en producción.
