# PPA-CONTENT-001 — Expansión Urgente del Banco Público de Preguntas

## 1. Resumen Ejecutivo

- **Ticket:** `PPA-CONTENT-001`
- **Estado:** `CLOSED`
- **Fecha:** 25 de Noviembre de 2026
- **Entorno:** Producción DonWeb Cloud Server (`https://app.puntoburger.com.ar`)
- **Pipeline:** GitHub Actions CI/CD (`ccf3c74` compilado y desplegado exitosamente)
- **Banco de Preguntas:** **360 preguntas aprobadas** en PostgreSQL (6 categorías × 60 preguntas cada una)
- **Distribución de Opciones:** **Exactamente 90 de cada opción (25.0% A, 25.0% B, 25.0% C, 25.0% D)**
- **Verificación en Producción:** `scripts/verify-question-bank-production.ts` ejecutado contra base de datos en vivo (600 partidas simuladas: 100% unicidad, 0 duplicados, 100% cumplimiento de secuencia 3/4/3)
- **Idempotencia:** 100% comprobada en producción (Ejecución 1: 288 insertadas, 72 existentes; Ejecución 2: 0 insertadas, 360 existentes)

El ticket **PPA-CONTENT-001** es una entrega estrictamente de contenido que amplía el banco de trivia de Punto Burger de 72 a **360 preguntas aprobadas**, resolviendo la repetición temprana de preguntas para usuarios reales y dotando al motor de selección de un catálogo balanceado adaptado a perfiles de niños (`child`), adolescentes (`teen`), adultos (`adult`) y grupos generales (`general`).

Se mantuvieron **100% intactas** las 72 preguntas originales, sus identificadores y su contenido, protegiendo todas las partidas históricas y sesiones previas.

---

## 2. Estructura y Métricas del Banco Expandido

### 2.1. Desglose por Categoría y Dificultad (360 Preguntas)

Cada una de las 6 categorías cuenta con exactamente **60 preguntas aprobadas**:

| Categoría                | Initial | Medium  | Advanced | Total Categoría |
| :----------------------- | :-----: | :-----: | :------: | :-------------: |
| **Cultura General**      |   20    |   20    |    20    |     **60**      |
| **Deportes**             |   20    |   20    |    20    |     **60**      |
| **Ciencia y Naturaleza** |   20    |   20    |    20    |     **60**      |
| **Geografía**            |   20    |   20    |    20    |     **60**      |
| **Historia**             |   20    |   20    |    20    |     **60**      |
| **Entretenimiento**      |   20    |   20    |    20    |     **60**      |
| **TOTALES**              | **120** | **120** | **120**  |     **360**     |

### 2.2. Adaptación por Rango Etario y Nivel Educativo

Cada combinación de _(categoría, dificultad)_ (18 buckets en total) cuenta con exactamente **20 preguntas** distribuidas de la siguiente forma:

- **General (`ageRange: 'general'`, `educationLevel: null`):** 8 preguntas (144 en total en la base)
- **Niños (`ageRange: 'child'`):** 4 preguntas (3 con `educationLevel: 'primary'`, 1 con `educationLevel: null`)
- **Adolescentes (`ageRange: 'teen'`):** 4 preguntas (3 con `educationLevel: 'secondary'`, 1 con `educationLevel: null`)
- **Adultos (`ageRange: 'adult'`):** 4 preguntas (2 con `educationLevel: 'higher'`, 2 con `educationLevel: null`)

Totales en PostgreSQL auditados directamente en producción:

- `general:null`: **144**
- `child:primary`: **54**
- `child:null`: **18**
- `teen:secondary`: **54**
- `teen:null`: **18**
- `adult:higher`: **36**
- `adult:null`: **36**
- **Suma total:** **360 preguntas**

### 2.3. Distribución Matemática de Opciones Correctas

Para eliminar cualquier sesgo estadístico en el juego:

- **Opción A:** 90 preguntas (25.0%)
- **Opción B:** 90 preguntas (25.0%)
- **Opción C:** 90 preguntas (25.0%)
- **Opción D:** 90 preguntas (25.0%)

---

## 3. Criterios de Redacción y Calidad Editorial

1. **Adecuación Familiar y Cultural:** Contenido optimizado para restaurantes familiares y gastronomía en Argentina, con especial énfasis en cultura argentina, regional e internacional consolidada.
2. **Respeto y Rigor:** Preguntas sin sesgos partidarios contemporáneos ni controversias religiosas/políticas.
3. **Inmutabilidad Temporal:** Se eliminaron fórmulas efímeras como _"actualmente"_, _"en este momento"_ o campeones vigentes no temporalizados.
4. **Claridad Sintáctica:** Enunciados concisos con 4 opciones mutuamente excluyentes y una explicación didáctica en cada ítem.

---

## 4. Scripts y Herramientas Implementadas

1. `scripts/validate-question-bank.ts`:
   - Validador exhaustivo de estructura, longitudes de texto, coherencia de tipos y detección de similitud semántica (Jaccard > 0.75).
   - Ejecución: `npm run questions:validate`

2. `scripts/verify-question-bank-production.ts`:
   - Script de solo lectura para auditoría en vivo en producción.
   - Conexión a PostgreSQL en DonWeb Cloud Server.
   - Ejecución de 600 simulaciones de partidas virtuales (100 por cada una de las 6 categorías) cruzando perfiles de Niños, Adolescentes, Adultos y Familias Mixtas.
   - Ejecución: `npm run questions:verify:production`

3. `scripts/reset-table.ts`:
   - Actualizado para revocar de forma segura dispositivos y cerrar sesiones activas limpiando `active_device_id` y `cooldown_until`, dejando la mesa en estado `available` sin rotar su token QR permanente.

---

## 5. Auditoría y Resultados en Producción

### 5.1. Ejecución del Seed en Producción (DonWeb Cloud Server)

- **Ejecución 1 (Inserción):**

  ```text
  --- Iniciando Seed Idempotente de Punto Burger ---
  1. Sembrando Venue oficial...
  ✓ Venue: Punto Burger Esperanza (2d6254cc-6c46-4151-af6e-050ba9b8b6b2)
  2. Sembrando Mesa 01...
  ✓ Mesa: Mesa 01 (mesa-01)
  3. Sembrando Categorías de Trivia...
  ✓ 6 Categorías activas verificadas.
  4. Sembrando Banco de Preguntas Aprobadas...
  ✓ Preguntas: 288 insertadas, 72 ya existentes (Total: 360).
  --- Seed completado exitosamente ---
  ```

- **Ejecución 2 (Verificación de Idempotencia):**
  ```text
  --- Iniciando Seed Idempotente de Punto Burger ---
  1. Sembrando Venue oficial...
  ✓ Venue: Punto Burger Esperanza (2d6254cc-6c46-4151-af6e-050ba9b8b6b2)
  2. Sembrando Mesa 01...
  ✓ Mesa: Mesa 01 (mesa-01)
  3. Sembrando Categorías de Trivia...
  ✓ 6 Categorías activas verificadas.
  4. Sembrando Banco de Preguntas Aprobadas...
  ✓ Preguntas: 0 insertadas, 360 ya existentes (Total: 360).
  --- Seed completado exitosamente ---
  ```

### 5.2. Simulación en Vivo (600 Partidas en DonWeb)

```text
🔗 Conectando a PostgreSQL para cargar preguntas en vivo...
✅ 360 preguntas aprobadas cargadas desde la base de datos.
Total de preguntas cargadas para la prueba: 360

--- 1. Verificación de Disponibilidad por Categoría ---
• [cultura-general   ] Total: 60 | Initial: 20 | Medium: 20 | Advanced: 20
• [deportes          ] Total: 60 | Initial: 20 | Medium: 20 | Advanced: 20
• [ciencia-naturaleza] Total: 60 | Initial: 20 | Medium: 20 | Advanced: 20
• [geografia         ] Total: 60 | Initial: 20 | Medium: 20 | Advanced: 20
• [historia          ] Total: 60 | Initial: 20 | Medium: 20 | Advanced: 20
• [entretenimiento   ] Total: 60 | Initial: 20 | Medium: 20 | Advanced: 20

✅ Pools de las 6 categorías verificados exitosamente.

--- 2. Simulación de 100 Partidas por Categoría (600 partidas en total) ---
• [cultura-general   ] 100 partidas simuladas | Unicidad: 100% (0 dupes) | Secuencia 3/4/3: 100% | Preguntas distintas utilizadas: 60/60 (100%)
• [deportes          ] 100 partidas simuladas | Unicidad: 100% (0 dupes) | Secuencia 3/4/3: 100% | Preguntas distintas utilizadas: 60/60 (100%)
• [ciencia-naturaleza] 100 partidas simuladas | Unicidad: 100% (0 dupes) | Secuencia 3/4/3: 100% | Preguntas distintas utilizadas: 59/60 (98%)
• [geografia         ] 100 partidas simuladas | Unicidad: 100% (0 dupes) | Secuencia 3/4/3: 100% | Preguntas distintas utilizadas: 59/60 (98%)
• [historia          ] 100 partidas simuladas | Unicidad: 100% (0 dupes) | Secuencia 3/4/3: 100% | Preguntas distintas utilizadas: 60/60 (100%)
• [entretenimiento   ] 100 partidas simuladas | Unicidad: 100% (0 dupes) | Secuencia 3/4/3: 100% | Preguntas distintas utilizadas: 60/60 (100%)

================================================================
✅ RESULTADO: 600 partidas simuladas correctamente.
   - 0 preguntas duplicadas en ninguna partida.
   - 100% de cumplimiento de la distribución 3 initial / 4 medium / 3 advanced.
   - Excelente variedad y adaptación por edad en todas las categorías.
```

### 5.3. Estado Final de Mesa 01 en Producción

- **Estado de Mesa 01:** `available`
- **Sesiones Activas en Mesa 01:** `0`
- **Dispositivos Activos en Mesa 01:** `0`
- **Última Sesión de Mesa 01:** `status: closed`, `activeDeviceId: null`, `cooldownUntil: null`
- **Token QR Permanente:** `jce8VwyatdHM5cVD5EGZmsJi_PcN3voj` (intacto y validado vía HTTP 200)
- **Salud del Sistema:** `https://app.puntoburger.com.ar/api/health` responde HTTP 200 con `{ status: "ok" }`

---

## 6. Conclusión y Cierre

El ticket `PPA-CONTENT-001` queda formalmente **CERRADO**. El banco de preguntas se encuentra completamente ampliado, auditado e integrado en producción, multiplicando por 5 la capacidad previa y ofreciendo una experiencia rica, diversa y sin repeticiones para los clientes de Punto Burger.
