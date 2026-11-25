# PPA-UI-001 — Identidad Visual Oficial Punto Burger

## Metadatos

- **Ticket:** PPA-UI-001
- **Título:** Identidad Visual Oficial Punto Burger
- **Fecha:** 2026-11-25
- **Estado:** Implementado / Validado en Producción
- **Dominio:** Frontend, Identidad de Marca, UI/UX, Accesibilidad, Mobile-First
- **Especificaciones Base:** [`specs/06-technical-architecture.md`](../../specs/06-technical-architecture.md), [`docs/implementation/PPA-010-table-access.md`](./PPA-010-table-access.md), [`docs/implementation/PPA-011-group-setup.md`](./PPA-011-group-setup.md), [`docs/implementation/PPA-012-question-sequence.md`](./PPA-012-question-sequence.md)

---

## 1. Resumen Ejecutivo

PPA-UI-001 implementa integralmente la identidad visual oficial de **Punto Burger** en todas las rutas y componentes públicos de la aplicación sin alterar ninguna lógica funcional, contrato de API ni modelo de base de datos de PPA-010, PPA-011 o PPA-012.

1. **Logo Oficial Incorporado:**
   - Asset original integrado en `public/brand/punto-burger-logo.png` (1024x341, proporción 3:1, transparencia intacta, sin recortar ni deformar).
   - Renderizado optimizado mediante el componente `next/image` con tamaños responsivos.
2. **Paleta Cromática Oficial Centralizada:**
   - **Rojo Principal (`--pb-red`):** `#C11815` (color de impacto para acciones principales, botones CTA, progreso activo y bordes de selección).
   - **Crema de Fondo (`--pb-cream`):** `#FAF7F2` (fondo principal de la aplicación, eliminando fondos oscuros predominantes).
   - **Carbón de Texto (`--pb-charcoal`):** `#1E1C1A` (texto de alto contraste, encabezados contundentes y detalles oscuros).
   - **Amarillo / Dorado de Marca (`--pb-yellow`):** `#D19709` (extraído directamente del logo oficial, utilizado como acento secundario para badges, chips, indicadores y detalles gastronómicos).
3. **Dirección Visual Gastronómica y Juvenil:**
   - Diseño cálido, enérgico, simple y accesible para comensales sentados a la mesa interactuando desde teléfonos móviles.
   - Alejado de interfaces SaaS, dashboards bancarios o formularios corporativos.
4. **Componentes Compartidos Reutilizables:**
   - `BrandHeader`: Cabecera unificada con el logo oficial y badge de mesa (`Mesa 01`).
   - `BrandCard`: Tarjeta redondeada en blanco/crema claro con bordes suaves y sombra sutil.
   - `PrimaryButton` y `SecondaryButton`: Botones táctiles de altura táctil generosa (>= 48–52px) pensados para una mano.
   - `ProgressIndicator`: Indicador visual discreto de pasos (`Paso 1 de 3`, `Paso 2 de 3`, `Paso 3 de 3`).
   - `DifficultyBlocks`: Bloques intuitivos de conteo y dificultad para las preguntas (Iniciales, Medias, Avanzadas).
5. **Rutas Rediseñadas:**
   - `/`: Landing page de bienvenida y fase de desarrollo alineada con Punto Burger.
   - `/table/[tableCode]`: Pantalla de claim de mesa con input destacado de 5 caracteres centrado y monoespaciado, estados visuales (available, cooldown, in_use, disabled, not_found) unificados.
   - `/play/setup`: Wizard de configuración de 3 pasos (Equipo, Participantes, Categoría) y vista de resumen _"¡Equipo listo!"_.
   - `/play`: Pantalla de transición y espera previa al inicio interactivo con botón _"Comenzar"_ deshabilitado (marcado para PPA-013).

---

## 2. Tokens de Marca y Configuración CSS

Configurados en `src/styles/globals.css` mediante la directiva `@theme` de Tailwind CSS v4 y variables CSS nativas en `:root`:

```css
@theme {
  --color-pb-red: #c11815;
  --color-pb-red-hover: #a51411;
  --color-pb-red-dark: #8f100e;
  --color-pb-red-light: #fde8e8;
  --color-pb-red-subtle: #fff5f5;

  --color-pb-cream: #faf7f2;
  --color-pb-cream-card: #ffffff;
  --color-pb-cream-muted: #f3ece1;
  --color-pb-cream-border: #e8e0d2;

  --color-pb-charcoal: #1e1c1a;
  --color-pb-charcoal-muted: #5c5753;
  --color-pb-charcoal-light: #8c847e;

  --color-pb-yellow: #d19709;
  --color-pb-yellow-hover: #b88307;
  --color-pb-yellow-light: #fef8e7;
  --color-pb-yellow-border: #ead087;

  --font-brand:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

:root {
  --pb-red: #c11815;
  --pb-red-hover: #a51411;
  --pb-cream: #faf7f2;
  --pb-charcoal: #1e1c1a;
  --pb-yellow: #d19709;

  --background: var(--pb-cream);
  --foreground: var(--pb-charcoal);
}
```

---

## 3. Componentes UI de Marca

Ubicados en `src/components/ui/`:

1. **[`brand-header.tsx`](file:///Users/jjoaco/Documents/Punto-Papas-App/src/components/ui/brand-header.tsx):** Integra el logo oficial con dimensiones `168x56` (proporción 3:1), badge de mesa y alt accesible.
2. **[`brand-card.tsx`](file:///Users/jjoaco/Documents/Punto-Papas-App/src/components/ui/brand-card.tsx):** Contenedor centralizado con radio `rounded-3xl`, fondo blanco, borde suave `border-pb-cream-border` y sombra sutil `shadow-xl shadow-stone-200/60`.
3. **[`brand-button.tsx`](file:///Users/jjoaco/Documents/Punto-Papas-App/src/components/ui/brand-button.tsx):**
   - `PrimaryButton`: Color `#C11815` con estados hover/active, focus ring accesible, altura mínima de 52px y soporte para spinner de carga.
   - `SecondaryButton`: Fondo blanco, borde sutil, texto carbón y altura de 48px.
4. **[`progress-indicator.tsx`](file:///Users/jjoaco/Documents/Punto-Papas-App/src/components/ui/progress-indicator.tsx):** Línea de progreso de 3 etapas con transiciones suaves y estados activo/completado.
5. **[`difficulty-badge.tsx`](file:///Users/jjoaco/Documents/Punto-Papas-App/src/components/ui/difficulty-badge.tsx):** Bloques triples intuitivos para las dificultades (Verde para iniciales, Dorado `#D19709` para medias, Rojo `#C11815` para avanzadas).

---

## 4. Pantallas Rediseñadas

### 4.1 `/table/[tableCode]`

- Cabecera con logo oficial y badge de mesa.
- Encabezado contundente (_"Mesa 01"_).
- Input de código temporal de 5 caracteres con tamaño grande (3xl), centrado, tipografía monoespaciada y tracking espaciado para fácil lectura e ingreso con una mano.
- Botón principal _"Comenzar"_ en rojo Punto Burger.
- Estados de error (`not_found`, `disabled`, `cooldown`, `in_use`, `other_table`) rediseñados con banners armonizados con la paleta crema y carbón.

### 4.2 `/play/setup`

- Wizard mobile-first conservando la funcionalidad transaccional de PPA-011.
- Paso 1 (_Tu equipo_): Input estilizado, conteo de caracteres (2..30) y chips de sugerencias rápidas (_Los Cracks_, _Mesa Picante_, _Los Bacon_, _Team Punto_).
- Paso 2 (_¿Quiénes juegan?_): Tarjetas de participantes con campos bien delimitados, selectores de rango etario y nivel educativo, botón de agregar jugador y eliminación con confirmación visual.
- Paso 3 (_Elegí una categoría_): Grilla de tarjetas de categorías con indicador de selección distintivo (borde rojo `#C11815`, fondo suave y checkmark).
- Resumen (_¡Equipo listo!_): Icono verde de confirmación, detalle de equipo y categoría, botón secundario para modificar y botón principal rojo para preparar la partida.

### 4.3 `/play`

- Pantalla de transición que anticipa visualmente el inicio del juego.
- Icono destacado con acento dorado.
- Ficha de resumen con estructura de 10 preguntas desglosada en bloques de dificultad (3 iniciales, 4 intermedias, 3 avanzadas).
- Banner informativo de regla de 20 segundos.
- Botón _"Comenzar"_ deshabilitado con leyenda clara que indica su activación en PPA-013.
- Cero fugas de contenido de preguntas congeladas.

---

## 5. Accesibilidad y Responsive

- **Mobile First:** Optimizado prioritariamente para visualización vertical en smartphones (375px, 390px, 430px) y adaptado para tablets (768px) y desktops (1440px).
- **Contraste de Color:** El rojo `#C11815` sobre blanco o crema ofrece un ratio de contraste superior a 5.5:1 (cumpliendo WCAG AA). El carbón `#1E1C1A` sobre crema `#FAF7F2` supera 14:1 (cumpliendo WCAG AAA).
- **Teclado y Focus:** Todos los botones e inputs cuentan con `focus:ring` visible y navegación por teclado nativa.
- **Movimiento Reducido:** Directiva `@media (prefers-reduced-motion: reduce)` incluida en `globals.css` desactivando animaciones para usuarios con sensibilidad vestibular.

---

## 6. Registro del Smoke Test en Producción

El 25 de noviembre de 2026 se llevó a cabo el Smoke Test Visual completo contra el servidor oficial de producción:

- **URL:** `https://app.puntoburger.com.ar`
- **Release Desplegado:** `2aa6068cdf4bd307b5e7ffa3a6a1c26629bdd972`

### Pasos Ejecutados

1. **Asset del Logo Oficial:** `curl -I https://app.puntoburger.com.ar/brand/punto-burger-logo.png` respondió `HTTP/2 200 OK` (210,886 bytes).
2. **Home Page (`/`):** Renderizó fondo `#FAF7F2`, texto carbón `#1E1C1A`, logo oficial y badge de desarrollo.
3. **Página de Mesa (`/table/mesa-01`):** Renderizó header oficial, badge _"Mesa 01"_, input monoespaciado de código y botón rojo _"Comenzar"_.
4. **Claim de Mesa:** Reclamada exitosamente con código temporal vigente `P7GYY`, cookie `pb_table_session` emitida.
5. **Configuración de Equipo (`/play/setup`):** Wizard paso 1 visualizado con indicador de progreso. Se configuró equipo _"SMOKE PPA-UI-001"_ con 2 participantes (Cata, Joaco) y categoría _"deportes"_.
6. **Vista de Resumen:** Renderizó _"¡Equipo listo!"_, tarjeta de equipo con jugadores y categoría seleccionada, botón para modificar y botón _"Empezar partida"_.
7. **Preparación de Partida:** Solicitud `POST /api/v1/games/prepare` ejecutada exitosamente (`HTTP/2 200 OK`).
8. **Pantalla de Transición (`/play`):** Renderizó _"¡Todo listo!"_, estructura 3/4/3, regla de 20 segundos y botón _"Comenzar"_ deshabilitado sin filtrar preguntas.
9. **Limpieza y Cooldown:** Dispositivo revocado, sesión cerrada, mesa colocada en cooldown temporal y normalizada automáticamente a `available`.
10. **Comprobación Final:** Mesa 01 en `status: 'available'`, 0 sesiones activas y 0 dispositivos activos.

---

## 7. Cierre Formal

```text
PPA-UI-001 = CLOSED
PPA-013 = NO INICIADO
```
