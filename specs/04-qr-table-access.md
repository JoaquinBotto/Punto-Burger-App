# PPA-005: Acceso por QR, Sesiones de Mesa y Validación de Presencia

## 1. Identificación

| Campo | Valor |
|---|---|
| **Nombre del producto** | Punto Burger |
| **Estado del documento** | Aprobado |
| **Versión** | 1.0.0 |
| **Fecha** | 2026-07-17 |
| **Responsable** | Product Manager |
| **Entregable relacionado** | PPA-005 |
| **Documentos base** | PPA-002 (Product Vision), PPA-003 (MVP Roadmap), PPA-004 (Mecánica de Juego) |

---

## 2. Objetivo

Definir la especificación funcional completa para el acceso autoservicio a la experiencia de Punto Burger mediante códigos QR físicos por mesa, incluyendo:

- La identidad y los estados operativos de las mesas físicas.
- El mecanismo de código temporal como validación de presencia sin intervención del personal.
- El ciclo de vida autónomo de una sesión: creación, uso, recuperación y cierre.
- La regla del dispositivo principal y la transferencia de control entre dispositivos.
- La estrategia de validación de presencia física, su alcance y su riesgo residual.
- Los controles contra abuso, los casos límite y las métricas operativas.
- Las funciones del panel administrativo como herramienta de supervisión y excepciones.

**Principio rector:** El funcionamiento normal de la aplicación no requiere intervención del personal. El personal interviene únicamente en excepciones, incidencias, fraude o canjes físicos.

Este documento es la fuente de verdad funcional para todo lo relacionado con el acceso por QR y la gestión de sesiones de mesa. Ninguna funcionalidad de acceso puede desarrollarse sin respetar las reglas aquí definidas.

---

## 3. Alcance

Este documento cubre:

- Identidad funcional de las mesas físicas.
- Estados operativos de una mesa y sus transiciones.
- Estados de una sesión y sus transiciones.
- Código temporal como mecanismo de validación de presencia.
- Creación autónoma, recuperación y cierre automático de sesiones.
- Duración y expiración de la sesión.
- Período de liberación temporal entre sesiones.
- Regla de dispositivo principal único.
- Comportamiento ante un segundo dispositivo.
- Transferencia de control entre dispositivos y reglas de solicitudes pendientes.
- Recuperación en el mismo dispositivo.
- Estrategia de validación de presencia física y riesgo residual.
- Disponibilidad general y horarios de la experiencia.
- Gestión del QR desde el panel administrativo.
- Recomendaciones funcionales para el diseño físico del QR.
- Cierre autónomo de sesión y liberación automática de mesa.
- Funciones del personal: supervisión, excepciones e incidencias.
- Controles contra abuso.
- Casos límite con comportamiento esperado.
- Flujos funcionales completos (A–G).
- Métricas operativas conceptuales.
- Decisiones aprobadas.
- Decisiones diferidas para especificaciones futuras.
- Criterios de aceptación.

Este documento **no** define:

- Stack tecnológico.
- Estructura de base de datos.
- Endpoints o contratos de API.
- Diseño visual definitivo del panel o de las pantallas de acceso.
- Implementación técnica de la identidad del dispositivo.
- Tecnología específica para la generación o visualización del código temporal.
- Tecnología específica para la generación del QR.
- Integración con el sistema de caja o pedidos.
- Política formal de privacidad o auditoría.

---

## 4. Conceptos Principales

| Término | Definición |
|---|---|
| **Mesa** | Espacio físico del local identificado por un QR único y un identificador interno. |
| **QR de mesa** | Código QR físico impreso y dispuesto en la mesa. Identifica la mesa, pero por sí solo no habilita una sesión. |
| **Código temporal** | Código de corta vigencia generado y renovado automáticamente por el sistema, visible en las pantallas del local. El cliente lo ingresa al escanear el QR para validar su presencia física aproximada. |
| **Período de vigencia del código** | Duración durante la cual un código temporal es válido. Configurable. Valor inicial: pocos minutos. |
| **Sesión de mesa** | Período activo vinculado a una mesa y a un grupo. Comienza cuando el dispositivo principal completa el acceso y expira por tiempo o cierre. |
| **Dispositivo principal** | El único dispositivo autorizado a registrar participantes, iniciar la partida, confirmar respuestas, solicitar el canje y finalizar la sesión dentro de una sesión activa. |
| **Transferencia de control** | Proceso por el cual el rol de dispositivo principal pasa de un dispositivo a otro, con aprobación del operador actual o del personal. |
| **Período de liberación temporal** | Intervalo breve y configurable que sigue al cierre de una sesión. Durante este período la mesa no acepta nuevas sesiones. Al vencer, la mesa vuelve automáticamente a Disponible. |

---

## 5. Identidad de las Mesas

### 5.1 Atributos de una mesa

Cada mesa física tendrá los siguientes atributos funcionales:

| Atributo | Descripción |
|---|---|
| Identificador interno único | Valor opaco, no secuencial, sin información sensible. Usado internamente por el sistema. |
| Nombre visible | Etiqueta legible para el personal (ej: Mesa 01, Patio 03, Barra 01). |
| QR asociado | Código QR que apunta al identificador interno de la mesa. |
| Estado operativo | Estado actual de la mesa (ver sección 6). |
| Historial de sesiones | Registro de sesiones anteriores vinculadas a la mesa. |
| Registro de incidencias | Eventos anómalos asociados a la mesa (códigos inválidos, transferencias, invalidaciones, bloqueos por reintentos). |

### 5.2 Ejemplos de nombres visibles

- Mesa 01, Mesa 02, ..., Mesa N
- Patio 01, Patio 02
- Barra 01
- Terraza 01

### 5.3 Restricciones del identificador interno

- No debe contener información sensible (nombre, dirección, datos del local).
- No debe ser predecible ni secuencial de manera obvia.
- El QR codifica este identificador de forma que el sistema pueda validarlo, pero el identificador por sí solo no autoriza el acceso.

---

## 6. Estados de una Mesa

Una mesa puede encontrarse en uno de los siguientes **cuatro estados operativos**. Los estados de la mesa y los estados de la sesión son conceptos separados (ver sección 6A).

### 6.1 Deshabilitada

**Descripción:** La mesa está fuera de operación de forma indefinida.

**Condiciones de entrada:**
- El personal la deshabilita manualmente desde el panel.
- El QR fue comprometido o extraviado y requiere regeneración.
- La mesa está en mantenimiento físico.

**Comportamiento:**
- No permite crear sesiones.
- El escaneo del QR muestra un mensaje indicando que la mesa no está disponible.
- No se acepta ningún código temporal en este estado.

**Transición de salida:**
- El personal la rehabilita manualmente → pasa a **Disponible**.

---

### 6.2 Disponible

**Descripción:** La mesa está operativa y lista para recibir un nuevo grupo de forma autónoma.

**Condiciones de entrada:**
- La mesa fue habilitada por primera vez.
- El período de liberación temporal venció automáticamente tras el cierre de la sesión anterior.
- El personal rehabilitó la mesa desde Deshabilitada.

**Comportamiento:**
- Cualquier cliente puede escanear el QR e ingresar el código temporal válido para crear una sesión.
- No requiere ninguna acción previa del personal.

**Transición de salida:**
- Un dispositivo completa el acceso (QR + código temporal válido + sin sesión activa) → pasa a **En uso**.
- El personal la deshabilita → pasa a **Deshabilitada**.

---

### 6.3 En uso

**Descripción:** Existe una sesión activa con un dispositivo principal vinculado.

**Condiciones de entrada:**
- Un dispositivo completó exitosamente el flujo de acceso autónomo desde el estado Disponible.

**Comportamiento:**
- No se puede crear una segunda sesión.
- El escaneo de un segundo dispositivo no genera una nueva sesión (ver sección 11).
- El personal puede ver la sesión activa, el tiempo restante y el estado desde el panel.
- Las partidas, el registro de participantes y el canje operan normalmente según PPA-004.

**Transición de salida:**
- La sesión finaliza por cualquier motivo (vencimiento, cierre voluntario, cierre administrativo, invalidación) → la sesión pasa al estado correspondiente (ver 6A); la mesa pasa a **Liberación temporal**.
- El personal deshabilita la mesa → pasa a **Deshabilitada** (la sesión activa se cierra administrativamente).

---

### 6.4 Liberación temporal

**Descripción:** La sesión anterior finalizó. La mesa está en un período de enfriamiento automático antes de estar disponible para un nuevo grupo. Este período evita que una sesión recién cerrada sea recuperada o reutilizada accidentalmente.

**Condiciones de entrada:**
- Una sesión pasó a estado Vencida, Cerrada o Invalidada desde el estado En uso.

**Comportamiento:**
- No se pueden crear nuevas sesiones durante este período.
- El escaneo del QR informa que la mesa no está disponible en este momento.
- Los resultados, el estado del premio y las métricas de la sesión anterior se conservan y son accesibles para el personal.
- Al vencer el período de liberación, la mesa pasa automáticamente a **Disponible** sin intervención del personal.

**Período de liberación:**
- Duración inicial: **2 minutos** como referencia funcional.
- La duración es configurable y podrá ajustarse operativamente según el comportamiento real del local.
- Reglas de comportamiento durante este estado:
  - No se puede crear una nueva sesión en la mesa.
  - La sesión anterior no puede reactivarse.
  - El resultado histórico y el estado del premio permanecen disponibles para el personal.
  - Los datos del grupo anterior no serán heredados por la próxima sesión.
  - Al finalizar el período, la mesa vuelve automáticamente a Disponible sin intervención del personal.

**Transición de salida:**
- Vence el período de liberación automáticamente → pasa a **Disponible**.
- El personal deshabilita la mesa → pasa a **Deshabilitada**.
- El personal puede reducir o cancelar el período de liberación desde el panel si es necesario (acción ocasional, no parte del flujo normal).

---

### 6.5 Diagrama de transiciones de la mesa

```
          [Deshabilitada]
               ↑   ↓ (rehabilitar)
           (deshabilitar)
               ↓   ↑
          [Disponible] ←─────────────────────────────────────────────┐
               │                                                      │
    (QR + código válido + sin sesión activa)               (período de liberación vence)
               │                                                      │
               ↓                                                      │
           [En uso]                                                   │
               │                                                      │
    (sesión finaliza por cualquier motivo)                            │
               │                                                      │
               ↓                                                      │
      [Liberación temporal] ────────────────────────────────────────►┘
          (automático)
```

---

## 6A. Estados de una Sesión

Los estados de la sesión son independientes de los estados de la mesa. Una sesión puede encontrarse en uno de los siguientes cuatro estados:

| Estado de sesión | Descripción | Quién lo origina |
|---|---|---|
| **Activa** | La sesión está en curso. El dispositivo principal puede operar normalmente. | Sistema al crearla. |
| **Vencida** | Se agotaron los 90 minutos de duración máxima. | Sistema automáticamente. |
| **Cerrada** | La sesión fue finalizada voluntariamente por el grupo o administrativamente por el personal. | Grupo o personal. |
| **Invalidada** | El personal descalificó la sesión por abuso, error o incidencia. | Personal. |

### Transiciones de sesión

| Evento | Estado anterior | Estado nuevo de la sesión | Estado nuevo de la mesa |
|---|---|---|---|
| Se alcanzan los 90 minutos | Activa | Vencida | Liberación temporal |
| El grupo selecciona "Finalizar sesión" | Activa | Cerrada | Liberación temporal |
| El personal cierra la sesión desde el panel | Activa | Cerrada | Liberación temporal |
| El personal invalida la sesión | Activa | Invalidada | Liberación temporal |
| Vence el período de liberación (automático) | — | (sin cambio en sesión) | Disponible |

**Regla:** Una sesión que no está en estado Activa no puede retomarse. El vencimiento del período de liberación no reactiva la sesión anterior; solo libera la mesa para una nueva sesión.

---

## 7. Código Temporal

### 7.1 Propósito

El código temporal es el mecanismo principal que vincula el acceso al QR con la presencia física aproximada en el local, sin requerir intervención del personal para cada grupo.

El código es general para todo el local (no es específico de una mesa) y está visible únicamente en las pantallas físicas de Punto Burger dentro del establecimiento. Un cliente que no está en el local no puede conocer el código vigente en el momento exacto de su intento de acceso, salvo que alguien se lo comparta (riesgo residual documentado en sección 14).

### 7.2 Generación y rotación

- El sistema genera el código de forma automática y continua, sin intervención del personal.
- El código se renueva automáticamente cada pocos minutos (frecuencia configurable).
- Un código vencido no puede utilizarse para crear una sesión.
- En ningún momento existe un período sin código válido: la rotación garantiza continuidad.

### 7.3 Visualización autónoma

- El código se muestra automáticamente en las pantallas físicas de Punto Burger durante el horario en que la experiencia esté activa.
- La visualización no depende de ninguna acción manual recurrente del personal.
- El sistema no expone el código a través de canales digitales externos (sitio web público, redes sociales, notificaciones, etc.).
- El código puede mostrarse de cualquiera de las siguientes formas, sin que esto sea una elección definitiva en esta etapa:
  - Permanentemente en una zona reservada de la pantalla.
  - Como superposición sobre contenido promocional.
  - Periódicamente dentro de una rotación de contenidos.
  - En una pantalla dedicada exclusivamente al código.
- En cualquier modalidad, el código debe mantenerse suficientemente visible y legible para los clientes desde la mesa.
- La tecnología concreta de emisión, sincronización y diseño gráfico del código se definirá en especificaciones futuras.

### 7.4 Ciclo de un código

1. El sistema genera el código.
2. El código se muestra automáticamente en las pantallas del local.
3. Durante su vigencia, cualquier cliente presente puede usarlo para crear una sesión.
4. Al acercarse al vencimiento, el período de tolerancia permite completar accesos en curso (ver 7.7).
5. Al vencer el período de tolerancia, el código deja de ser aceptado.
6. El sistema genera automáticamente el siguiente código sin intervención del personal.

### 7.5 Lo que el código NO hace

- El código no crea sesiones por sí solo. Siempre requiere también el QR de mesa.
- El código no identifica al cliente ni al dispositivo.
- El código no es específico de una mesa: el mismo código sirve para cualquier mesa Disponible del local.
- El código no reemplaza la regla de una sesión activa por mesa.
- El código no interrumpe ni afecta sesiones ya creadas: su rol es exclusivamente de acceso.

### 7.6 Alcance del código dentro de una sesión

El código temporal se valida **únicamente en el momento de crear una nueva sesión**. Una vez que la sesión fue creada correctamente:

- El cambio del código no interrumpe la sesión activa.
- El código no se solicita nuevamente durante el registro de participantes, la partida ni la pantalla de resultado.
- El cambio del código no afecta respuestas, puntos, premios ni temporizadores.
- La sesión continúa hasta su cierre voluntario o vencimiento de los 90 minutos.

El código podrá volver a solicitarse únicamente si un nuevo dispositivo intenta obtener el control de la sesión mediante el flujo de transferencia, según las reglas de la sección 12.

### 7.7 Tolerancia durante la rotación del código

Cuando el sistema genera un nuevo código y reemplaza al anterior:

- El código anterior permanece válido durante un **período de tolerancia breve** posterior a su vencimiento nominal.
- El objetivo es evitar rechazos cuando el código cambia exactamente mientras el cliente lo está ingresando.
- La duración del período de tolerancia es configurable.
- Como referencia funcional inicial: **entre 30 y 60 segundos**.
- El mecanismo técnico de implementación de esta superposición se definirá en especificaciones futuras.

---

## 8. Creación Autónoma de una Sesión

### 8.1 Condiciones previas necesarias

Para que se cree una sesión, deben cumplirse simultáneamente todas las siguientes condiciones:

1. La mesa está en estado **Disponible**.
2. El cliente escanea el **QR correcto** asociado a esa mesa.
3. El cliente ingresa un **código temporal vigente**.
4. **No existe otra sesión activa** para esa mesa.
5. El dispositivo acepta explícitamente convertirse en el **dispositivo principal**.

Si alguna de estas condiciones no se cumple, la sesión no se crea y se muestra el mensaje correspondiente (ver sección 21 — Casos límite).

**No se requiere ninguna acción del personal para que este flujo ocurra.**

### 8.2 Proceso de creación

1. El dispositivo escanea el QR y accede al sistema.
2. El sistema identifica la mesa y valida su estado.
3. El sistema solicita al cliente el código temporal.
4. El sistema valida que el código esté vigente.
5. El sistema verifica que no exista sesión activa para la mesa.
6. El sistema vincula el dispositivo como dispositivo principal.
7. Se crea la sesión con los siguientes datos registrados:
   - Identificador de sesión.
   - Identificador de mesa.
   - Momento de inicio.
   - Momento de vencimiento (inicio + 90 minutos).
   - Identificador del dispositivo principal (opaco, no sensible).
   - Estado inicial: Activa.
8. La mesa pasa a estado **En uso**.
9. El grupo puede continuar con el registro de participantes según PPA-004.

### 8.3 Idempotencia de la creación

La sesión no debe duplicarse bajo ninguna de las siguientes circunstancias:

- El cliente recarga la página durante el proceso de acceso.
- El cliente escanea nuevamente el mismo QR.
- El cliente presiona el botón de acceso más de una vez.
- Se repite la solicitud por conectividad inestable.
- La respuesta visual no llega al dispositivo pero la sesión ya fue creada internamente.

Si la sesión ya existe y el dispositivo es el principal, el sistema la recupera. No crea una nueva.

### 8.4 Datos registrados por la sesión

| Campo | Descripción |
|---|---|
| Identificador de sesión | Valor único interno. |
| Mesa asociada | Referencia al identificador de la mesa. |
| Momento de inicio | Marca de tiempo del momento en que se creó la sesión. |
| Momento de vencimiento | Inicio + duración máxima (90 min). |
| Último momento de actividad | Marca de tiempo de la última acción registrada en la sesión. |
| Estado | Activa, Vencida, Cerrada, Invalidada. |
| Dispositivo principal | Identificador opaco del dispositivo principal actual. |
| Motivo de cierre | Razón del cierre cuando aplique (voluntario, vencimiento, administrativo, invalidación). |
| Historial de transferencias | Registro de cambios de dispositivo principal. |

---

## 9. Duración, Expiración y Liberación

### 9.1 Duración máxima de la sesión

- **90 minutos** desde el momento de creación.
- Configurable en versiones futuras.

### 9.2 Regla de no reinicio

Los siguientes eventos **no reinician** el contador de 90 minutos:

- Una recarga de página.
- Una pérdida y reconexión de conexión.
- Una transferencia de control entre dispositivos.
- Un cierre accidental del navegador.
- Un nuevo escaneo del QR desde el mismo dispositivo principal.

La duración siempre se computa desde el momento en que se creó la sesión.

### 9.3 Comportamiento al vencer

Cuando se alcanzan los 90 minutos:

- La sesión pasa a estado **Vencida**.
- La mesa pasa a estado **Liberación temporal**.
- No se pueden iniciar nuevas partidas.
- No se puede retomar la sesión.
- Los resultados, el estado del premio y las métricas se conservan.
- Si había una partida en curso, se considera **abandonada** según las reglas de PPA-004.
- El personal puede ver el evento en el panel.

### 9.4 Cierre voluntario o administrativo antes del vencimiento

- El grupo puede finalizar la sesión voluntariamente: la sesión pasa a **Cerrada**; la mesa pasa a **Liberación temporal**.
- El personal puede cerrar la sesión desde el panel: la sesión pasa a **Cerrada**; la mesa pasa a **Liberación temporal**. El motivo queda registrado como "administrativo".

### 9.5 Período de liberación temporal

Tras cualquier finalización de sesión, la mesa entra en el **período de liberación temporal**:

- Su duración es breve y configurable (valor de referencia: entre 1 y 5 minutos).
- Durante este período no se pueden crear nuevas sesiones en la mesa.
- Al vencer, la mesa pasa automáticamente a **Disponible** sin intervención del personal.
- Este período protege contra recuperaciones accidentales de sesiones recién cerradas.

### 9.6 Extensión administrativa de la sesión

El personal podrá extender la duración de una sesión activa desde el panel en casos excepcionales. La cantidad de tiempo añadida por extensión se definirá como configuración futura.

---

## 10. El Dispositivo Principal

### 10.1 Definición funcional

El dispositivo principal es el único dispositivo autorizado a ejecutar acciones dentro de la sesión activa. Este concepto es funcional: no implica ninguna implementación tecnológica específica; el mecanismo técnico de identificación se definirá en especificaciones posteriores.

### 10.2 Capacidades exclusivas del dispositivo principal

Solo el dispositivo principal puede:

- Registrar participantes.
- Elegir la categoría de la partida.
- Iniciar la partida oficial.
- Confirmar respuestas durante la partida.
- Solicitar el modo práctica.
- Solicitar el canje de un premio.
- Finalizar la sesión.

### 10.3 Lo que ningún otro dispositivo puede hacer

Cualquier otro dispositivo que acceda a la misma sesión:

- No puede enviar respuestas.
- No puede modificar el estado de la sesión.
- No puede iniciar ni finalizar partidas.
- No puede solicitar el canje.

---

## 11. Segundo Dispositivo

### 11.1 Escenario

Cuando un segundo dispositivo escanea el QR de una mesa que ya tiene una sesión activa:

1. El sistema detecta que existe una sesión activa.
2. No se crea una nueva sesión.
3. No se inicia otra partida.
4. El segundo dispositivo no obtiene automáticamente el control.
5. El segundo dispositivo recibe un mensaje informativo (ver 11.2).
6. Se ofrece la opción de solicitar una transferencia de control.
7. Se ofrece la opción de contactar al personal.

### 11.2 Mensaje mostrado al segundo dispositivo

El mensaje debe ser claro, positivo y no revelar información privada de los participantes actuales.

Ejemplo:

> "Esta mesa ya tiene una sesión activa en otro dispositivo. Si sos parte del grupo, pedile al operador que te transfiera el control, o acercate al personal."

### 11.3 Registro del intento

El sistema debe registrar el intento del segundo dispositivo como evento informativo, incluyendo la mesa y la marca de tiempo.

---

## 12. Transferencia de Control

La sesión puede transferirse a un nuevo dispositivo principal mediante dos mecanismos.

### 12.1 Transferencia aprobada desde el dispositivo actual

Aplicable cuando el dispositivo principal está operativo y puede responder.

**Proceso:**

1. El segundo dispositivo solicita el control desde su pantalla de acceso.
2. El dispositivo principal recibe una notificación de solicitud de transferencia.
3. El operador actual acepta o rechaza la solicitud.
4. Si **acepta**: el nuevo dispositivo pasa a ser el dispositivo principal. El anterior pierde todas las capacidades exclusivas de forma inmediata.
5. Si **rechaza**: el segundo dispositivo recibe un mensaje de rechazo y permanece sin control.

**Regla:** Solo puede existir un dispositivo principal después de la transferencia.

### 12.2 Transferencia autorizada por el personal

Aplicable cuando el dispositivo original no puede confirmar la transferencia por cualquiera de las siguientes razones:

- Se quedó sin batería.
- Se rompió o dañó.
- Se perdió.
- El navegador fue cerrado de forma permanente.
- No responde dentro de un tiempo razonable.

**Proceso:**

1. El grupo o el nuevo dispositivo solicita ayuda al personal.
2. El personal accede al panel administrativo.
3. El personal localiza la sesión de la mesa correspondiente.
4. El personal ejecuta la acción "Transferir control" especificando el motivo.
5. El nuevo dispositivo pasa a ser el dispositivo principal.
6. El dispositivo anterior queda desvinculado.

### 12.3 Registro obligatorio de toda transferencia

Toda transferencia, sea cual sea el método, debe registrar:

| Campo | Descripción |
|---|---|
| Fecha y hora | Marca de tiempo exacta. |
| Mesa | Identificador de la mesa. |
| Sesión | Identificador de la sesión. |
| Motivo | Descripción del motivo declarado. |
| Método de autorización | "Dispositivo actual" o "Personal". |
| Operador del personal | Identificador del personal cuando el método fue "Personal". |
| Dispositivo anterior | Identificador opaco del dispositivo que perdió el control. |
| Dispositivo nuevo | Identificador opaco del dispositivo que ganó el control. |

### 12.4 Límites de la transferencia

- No puede existir más de un dispositivo principal simultáneamente después de una transferencia.
- El personal no puede transferir el control a un dispositivo desconocido; el nuevo dispositivo debe haber escaneado el QR previamente.
- La implementación técnica del mecanismo de identificación del nuevo dispositivo se definirá en especificaciones futuras.

### 12.5 Reglas sobre solicitudes de transferencia pendientes

- Solo puede existir **una solicitud de transferencia pendiente** por sesión en un momento dado.
- Si se realiza una nueva solicitud mientras existe una anterior pendiente, la nueva **reemplaza e invalida** la anterior.
- Toda solicitud de transferencia tiene un **período de vigencia breve y configurable**. Si el dispositivo principal no responde dentro de ese período, la solicitud vence automáticamente.
- El **vencimiento de una solicitud no cambia el dispositivo principal**. El control permanece en el dispositivo original hasta que se produzca una aprobación o una intervención del personal.
- El segundo dispositivo **nunca obtiene control sin aprobación explícita** del operador actual o intervención administrativa del personal.
- El mecanismo técnico de notificación de la solicitud al dispositivo principal se definirá en especificaciones futuras.

---

## 13. Recuperación en el Mismo Dispositivo

### 13.1 Escenarios de recuperación

El dispositivo principal puede perder temporalmente el acceso a la sesión por:

- Recarga de página.
- Cierre accidental del navegador o aplicación.
- Pérdida de conexión a internet.
- Nuevo escaneo del QR de la misma mesa.

### 13.2 Comportamiento al recuperar

En todos estos escenarios, mientras la sesión siga vigente (estado Activa), el sistema debe:

1. Detectar que el dispositivo es el principal de la sesión activa.
2. Recuperar el estado actual de la sesión.
3. Redirigir al grupo al punto exacto donde estaba: registro, pantalla de instrucciones, pregunta en curso o resultado.
4. No crear una nueva sesión.
5. No reiniciar la duración de la sesión (los 90 minutos no se reinician).
6. No reiniciar la partida ni las preguntas ya respondidas.
7. No reiniciar el temporizador de la pregunta activa (se muestra el tiempo restante real).
8. No duplicar respuestas, puntos ni premios.

### 13.3 Reglas del temporizador en la recuperación

Aplican íntegramente las reglas definidas en PPA-004, sección 19.1:

- El temporizador de cada pregunta está ligado al momento original de presentación.
- Una recuperación nunca reinicia los 20 segundos.
- Si la pregunta todavía está vigente, se muestra con el tiempo restante real.
- Si el tiempo de la pregunta venció durante la interrupción, se registra como sin respuesta y el sistema avanza a la siguiente pregunta pendiente.

---

## 14. Estrategia de Validación de Presencia Física

### 14.1 Mecanismo principal

La validación de presencia física se basa en la combinación de los siguientes elementos. Este mecanismo **reduce considerablemente** el uso desde fuera del local, pero no constituye una prueba geográfica absoluta (ver 14.2).

| Elemento | Rol |
|---|---|
| QR único por mesa | Identifica la mesa física. Específico de cada mesa. |
| Código temporal del local | Señal operativa de presencia aproximada. Solo visible en las pantallas del local. |
| Vigencia corta del código | Limita el tiempo en que el código permite crear una sesión. |
| Una sesión activa por mesa | Impide múltiples grupos simultáneos en la misma mesa. |
| Un dispositivo principal por sesión | Impide acceso paralelo no autorizado. |
| Expiración de 90 minutos | Libera la mesa automáticamente. |
| Período de liberación temporal | Evita recuperación accidental de sesiones recién cerradas. |

### 14.2 Por qué el mecanismo dificulta el acceso desde fuera del local

La combinación de QR más código temporal es efectiva porque:

1. El QR identifica la mesa pero no autoriza por sí solo. El código temporal es siempre necesario.
2. El código temporal solo es visible en las pantallas físicas del local. Un cliente fuera del establecimiento no lo conoce en tiempo real.
3. El código se renueva automáticamente cada pocos minutos. Un código compartido vence pronto.
4. Una vez creada la sesión, la mesa pasa a **En uso** y ya no acepta nuevas sesiones aunque el código sea válido.
5. Una sesión vencida no puede recuperarse. Un código o enlace antiguos no tienen valor.

**Riesgo residual:** Un cliente dentro del local podría compartir el código temporal con alguien fuera durante su período de vigencia. En ese escenario, si también comparte o fue fotografiado el QR de la mesa, y la mesa está Disponible en ese momento exacto, la persona fuera del local podría crear una sesión. Este riesgo es de probabilidad baja y se mitiga mediante:

- La vigencia corta del código.
- El QR específico de cada mesa (no es suficiente un QR genérico).
- La regla de una sola sesión activa por mesa (si el grupo del local ya creó su sesión, no hay más acceso).
- Los límites de intentos ante códigos incorrectos (ver sección 20).
- La supervisión operativa del personal a través del panel.
- La posibilidad futura de incorporar ubicación aproximada como control complementario sin hacerla obligatoria.

Este mecanismo no constituye una prueba geográfica absoluta, pero es suficiente para el MVP interno y la primera versión pública del local.

### 14.3 Controles complementarios

Estos mecanismos no reemplazan el mecanismo principal, pero refuerzan la estrategia:

| Control | Descripción |
|---|---|
| Horarios de funcionamiento | La experiencia no crea sesiones fuera del horario del local. |
| Estado global de la experiencia | El administrador puede pausar toda la experiencia. |
| Bloqueo manual de mesa | El personal puede deshabilitar una mesa específica en cualquier momento. |
| Límites de intentos de código | Bloqueo temporal ante intentos reiterados con códigos incorrectos (ver sección 20). |
| Registro de intentos inválidos | Quedan registrados para análisis posterior. |
| Revisión de actividad por parte del personal | El panel muestra sesiones activas e intentos recientes. |

### 14.4 Posición sobre la geolocalización

- La geolocalización **no será obligatoria** en el MVP interno ni en la primera versión pública.
- **No será el único mecanismo** de presencia en ninguna etapa.
- Podrá evaluarse como verificación complementaria opcional si se detecta abuso sistemático.
- Debe considerarse que: los permisos de ubicación son voluntarios, la precisión varía por dispositivo, muchos usuarios los deniegan, y su exigencia genera fricción innecesaria.

### 14.5 Posición sobre la verificación de red Wi-Fi

- No se asume que una web app puede verificar de forma fiable el nombre de la red Wi-Fi del dispositivo del usuario.
- La red local no será una dependencia funcional obligatoria en ninguna etapa del MVP.
- Podrá evaluarse técnicamente como medida complementaria en versiones futuras, sujeta a viabilidad técnica real.

---

## 15. Disponibilidad General de la Experiencia

### 15.1 Estados globales

La experiencia de Punto Burger puede tener un estado global que afecta a todas las mesas:

| Estado global | Descripción |
|---|---|
| **Activa** | Las mesas en estado Disponible pueden recibir nuevas sesiones normalmente. |
| **Pausada** | No se crean nuevas sesiones. Las sesiones activas continúan hasta su finalización natural o vencimiento. |
| **Fuera de horario** | La experiencia no está disponible en este momento. No se crean sesiones nuevas. |
| **En mantenimiento** | El sistema está en mantenimiento. No se crean sesiones nuevas. |

### 15.2 Comportamiento predeterminado cuando la experiencia no está activa

**Predeterminado para Pausada, Fuera de horario y En mantenimiento:**

- No se crean nuevas sesiones.
- Las sesiones activas en el momento de la pausa **continúan normalmente** hasta su finalización voluntaria o vencimiento natural.
- Al escanear el QR, el usuario ve un mensaje claro y comprensible. No se muestran errores técnicos ni información interna del sistema.

Ejemplo de mensaje:

> "Punto Burger no está disponible en este momento. ¡Volvé a intentarlo más tarde!"

### 15.3 Cierre masivo de sesiones activas

El administrador puede ejecutar una acción adicional y separada: **"Cerrar sesiones activas"**.

- Esta acción es **sensible** y debe solicitar confirmación explícita antes de ejecutarse.
- Al confirmarse, todas las sesiones activas en ese momento pasan al estado **Cerrada**.
- Las mesas correspondientes pasan a estado **Liberación temporal** y luego a **Disponible** al vencer ese período.
- El sistema registra el motivo del cierre masivo y la lista de sesiones afectadas.
- Esta acción no es automática: el administrador debe ejecutarla de forma deliberada e independiente de la pausa general.

---

## 16. Gestión del QR desde el Panel

### 16.1 Capacidades del administrador sobre los QR y las mesas

| Acción | Descripción |
|---|---|
| Crear una mesa | Registra una nueva mesa en el sistema con nombre visible. |
| Asignar nombre visible | Etiqueta legible para el personal (ej: Mesa 05). |
| Generar el QR | Crea el código QR asociado al identificador interno de la mesa. |
| Descargar el QR | Permite obtener el archivo del QR para impresión. |
| Deshabilitar la mesa | Cambia el estado a Deshabilitada; el QR deja de funcionar. |
| Rehabilitar la mesa | Vuelve a Disponible. |
| Regenerar el QR | Genera un nuevo QR para la mesa, invalidando el anterior. |
| Consultar la última sesión | Accede a los datos de la sesión más reciente de esa mesa. |
| Consultar intentos inválidos | Lista los intentos de acceso fallidos recientes de esa mesa. |

### 16.2 Reglas de regeneración del QR

- Regenerar el QR **invalida el anterior** para futuras sesiones: cualquier escaneo del QR anterior mostrará un error.
- Una regeneración **no cierra automáticamente** una sesión activa en ese momento. La sesión activa continúa hasta su cierre natural o administrativo.
- Si el administrador quiere invalidar también la sesión activa, debe hacerlo mediante una acción administrativa explícita separada.

### 16.3 Casos de regeneración recomendados

- El QR físico fue fotografiado masivamente y compartido fuera del local.
- El QR físico fue dañado o destruido.
- Se detectó un intento de abuso sistemático.
- Se cambió la ubicación o el nombre de la mesa y se requiere una nueva impresión.

---

## 17. Diseño Físico del QR

Este documento establece únicamente las **recomendaciones funcionales** para el diseño físico del QR. El diseño gráfico definitivo se definirá en la especificación de diseño.

### 17.1 Recomendaciones

- Un único QR claramente visible por mesa.
- Nombre o número de mesa impreso junto al QR (ej: "Mesa 03").
- Instrucción breve que invite a la acción.
- Alto contraste entre el QR y el fondo.
- Tamaño suficiente para ser leído por cámaras móviles estándar a distancia razonable.
- Material resistente a la humedad, el calor y el desgaste propio de un bar.
- No incluir información técnica, identificadores internos ni URLs administrativas.
- No publicar enlaces que conduzcan al panel de administración.

### 17.2 Texto sugerido

> "Escaneá el código y jugá mientras esperás."

El texto final será validado con el equipo de diseño y comunicación.

---

## 18. Cierre de Sesión y Liberación de Mesa

### 18.1 Tipos de cierre

Una sesión puede cerrarse por alguno de los siguientes motivos:

| Tipo de cierre | Iniciado por | Descripción |
|---|---|---|
| **Voluntario** | El grupo | El operador del dispositivo principal selecciona "Finalizar sesión". |
| **Por vencimiento** | El sistema | Se cumplieron los 90 minutos de duración máxima. |
| **Administrativo** | El personal | El personal cierra la sesión desde el panel. |
| **Invalidación** | El personal | El personal detecta abuso, error o incidencia y la invalida. |

### 18.2 Efectos del cierre

Al cerrarse una sesión por cualquier motivo:

- No se pueden iniciar nuevas partidas dentro de esa sesión.
- El resultado de la partida oficial se conserva.
- El estado del premio se conserva (incluyendo si está pendiente de validación).
- Las métricas e incidencias registradas se conservan.
- La sesión pasa al estado correspondiente según el tipo de cierre (ver sección 6A).
- La mesa pasa automáticamente a estado **Liberación temporal**.

### 18.3 Transición automática al siguiente grupo

Tras el período de liberación temporal, la mesa pasa automáticamente a **Disponible**:

- No se requiere ninguna acción del personal.
- Los datos del grupo anterior (participantes, nombre, puntaje, estado del premio) no son accesibles desde la nueva sesión.
- El siguiente grupo puede iniciar el flujo de acceso autónomo desde cero.

---

## 19. Funciones del Personal

El panel administrativo es una herramienta de **supervisión, excepciones e incidencias**. No forma parte del flujo de operación normal.

### 19.1 Panel de mesa

El panel permite al personal las siguientes acciones:

| Acción | Descripción | Tipo |
|---|---|---|
| Ver estado de la mesa | Estado actual, sesión activa (si aplica), tiempo restante. | Consulta |
| Ver sesión activa | Información no sensible de la sesión en curso. | Consulta |
| Ver dispositivo principal | Indicador no sensible de que hay un dispositivo vinculado. | Consulta |
| Transferir control | Reasigna el rol de dispositivo principal ante una incidencia. | Sensible |
| Extender sesión | Agrega tiempo adicional a la sesión activa (excepción). | Sensible |
| Cerrar sesión | Finaliza la sesión actual administrativamente. | Sensible |
| Invalidar sesión | Descalifica la sesión por abuso o incidencia. | Sensible |
| Acortar liberación | Reduce o cancela el período de liberación temporal en casos excepcionales. | Ocasional |
| Deshabilitar mesa | Bloquea la mesa. | Sensible |
| Rehabilitar mesa | Devuelve la mesa a Disponible desde Deshabilitada. | Frecuente |
| Regenerar QR | Genera un nuevo QR e invalida el anterior. | Sensible |
| Consultar incidencias | Lista de eventos anómalos de la mesa. | Consulta |
| Validar canje de premio | Confirma el canje de un premio al finalizar la partida. | Frecuente |

### 19.2 Lo que el personal NO necesita hacer en el flujo normal

Las siguientes acciones **no son necesarias** en la operación normal:

- Activar una mesa antes de que un grupo se siente.
- Abrir una ventana de acceso manualmente.
- Preparar digitalmente la mesa entre grupos.
- Autorizar el inicio de una sesión.
- Intervenir durante una partida correctamente ejecutada.

El personal solo actúa cuando el grupo o el sistema lo requieren por una excepción.

### 19.3 Principio de operación mínima

- Las acciones de consulta deben ser de acceso inmediato y simple.
- Las acciones sensibles (transferir, invalidar, regenerar QR) deben solicitar **confirmación explícita** antes de ejecutarse.
- El panel no debe interrumpir el trabajo habitual del personal del bar.

---

## 20. Controles contra Abuso

Las siguientes reglas deben aplicarse como parte de la lógica funcional del sistema. Los mecanismos técnicos de implementación se definirán en especificaciones posteriores.

| Regla | Descripción |
|---|---|
| QR más código válido requeridos | Sin ambos elementos vigentes, no se crea sesión. |
| Código temporal con vigencia corta | Un código compartido expira en pocos minutos. |
| Código renovado automáticamente | No hay período sin código; pero los códigos viejos no se reutilizan. |
| Una sola sesión activa por mesa | No puede coexistir más de una sesión activa en la misma mesa. |
| Un solo dispositivo principal por sesión | Ningún otro dispositivo puede enviar respuestas o modificar el estado. |
| El segundo dispositivo no obtiene control automáticamente | Requiere solicitud y aprobación. |
| Repetir el escaneo no duplica sesiones | La creación de sesión es idempotente. |
| Límites de intentos de código | El sistema bloquea temporalmente el dispositivo o la mesa tras varios intentos fallidos con códigos incorrectos. |
| Bloqueo temporal ante intentos reiterados | Después de N intentos fallidos consecutivos, el acceso desde ese dispositivo queda bloqueado por un período configurable. |
| Regenerar el QR invalida el anterior | Un QR antiguo no puede usarse para crear nuevas sesiones. |
| Una sesión no activa no puede recuperarse | Una sesión Vencida, Cerrada o Invalidada no puede retomarse. |
| Liberación temporal impide recuperación accidental | Una sesión recién cerrada no puede ser reasignada al instante. |
| Una sesión cerrada no puede reabrirse | La mesa pasa por liberación temporal antes de quedar Disponible. |
| Solo una solicitud de transferencia pendiente por sesión | Una nueva solicitud reemplaza la anterior. |
| Una solicitud de transferencia vencida no cambia el principal | El control permanece en el dispositivo original. |
| Toda transferencia administrativa queda registrada | Con fecha, hora, mesa, sesión, motivo, método y operador. |
| Toda invalidación queda registrada | Con fecha, hora, mesa, sesión, motivo y operador. |
| El cierre masivo de sesiones requiere confirmación explícita | No ocurre automáticamente al pausar la experiencia. |

---

## 21. Casos Límite

| # | Caso | Comportamiento esperado |
|---|---|---|
| 1 | El cliente escanea el QR pero no ingresa ningún código. | El sistema solicita el código temporal. No se crea sesión hasta que el código sea ingresado y validado. |
| 2 | El cliente ingresa un código vencido. | El sistema informa que el código no es válido o expiró. Se invita al cliente a consultar la pantalla del local para ver el código vigente. No se crea sesión. |
| 3 | El cliente ingresa un código incorrecto repetidamente. | Tras N intentos fallidos, el acceso desde ese dispositivo queda bloqueado temporalmente. Se muestra un mensaje amigable. Se registra el evento. |
| 4 | El QR corresponde a una mesa deshabilitada. | El sistema informa que la mesa no está disponible. No se acepta ningún código. No se crea sesión. Se registra el intento. |
| 5 | Ya existe una sesión activa y un segundo dispositivo escanea. | No se crea una nueva sesión. El segundo dispositivo ve el mensaje de sesión activa en otro dispositivo y puede solicitar transferencia o contactar al personal. |
| 6 | El dispositivo principal se queda sin batería. | El grupo solicita al personal una transferencia de control. El personal la autoriza desde el panel. El nuevo dispositivo pasa a ser el principal. |
| 7 | Se solicita transferencia y el dispositivo original no responde. | Si el dispositivo original no puede confirmar en un tiempo razonable, el grupo solicita al personal. El personal puede autorizar la transferencia administrativamente. |
| 8 | El personal autoriza una transferencia. | El personal ejecuta la acción desde el panel. El nuevo dispositivo pasa a ser principal. La transferencia queda registrada con el motivo y el operador. |
| 9 | El usuario fotografió el QR e intenta acceder desde su casa. | El QR identifica la mesa. El sistema solicita el código temporal. Como el usuario no está en el local, no conoce el código vigente. No puede completar el acceso. No se crea sesión. |
| 10 | El usuario conoce el QR y el código (se los compartieron simultáneamente). | Si la mesa está Disponible y el código sigue vigente, podría crear una sesión (riesgo residual). Si el grupo del local ya creó su sesión, la mesa está En uso y el acceso queda bloqueado. |
| 11 | El QR fue regenerado. | El QR anterior muestra un error al escanearse. Solo el nuevo QR permite continuar el flujo normal. La sesión activa en ese momento no se ve afectada. |
| 12 | La sesión vence durante una partida en curso. | La partida se considera abandonada según PPA-004. No se entregan premios ni se ingresa al ranking. Los resultados parciales y métricas se conservan. La sesión pasa a Vencida y la mesa pasa a Liberación temporal. |
| 13 | La sesión vence y la mesa está en liberación temporal. | La mesa no acepta nuevas sesiones durante ese período. Al vencer, pasa a Disponible automáticamente. El siguiente grupo puede iniciar su acceso. |
| 14 | El local pausa la experiencia de forma general. | No se crean nuevas sesiones. Las sesiones activas continúan normalmente hasta su finalización o vencimiento. El escaneo del QR muestra el mensaje de experiencia no disponible. El administrador puede ejecutar "Cerrar sesiones activas" como acción separada y con confirmación explícita. |
| 15 | El personal cierra una sesión por error. | La sesión pasa a Cerrada y la mesa a Liberación temporal. Al vencer el período de liberación, la mesa queda Disponible automáticamente. Los resultados y el estado del premio se conservan y son consultables. |
| 16 | Se escanea el QR equivocado (mesa distinta). | El sistema valida la mesa a partir del identificador codificado en el QR. Un QR de otra mesa muestra el estado de esa mesa, no de la mesa física donde está el cliente. Si esa mesa está en uso, el sistema muestra el mensaje correspondiente. |
| 17 | Se intenta reutilizar la sesión durante la liberación temporal. | La mesa está en Liberación temporal. No se pueden crear nuevas sesiones. El sistema informa que la mesa no está disponible en este momento. |
| 18 | El dispositivo pierde conexión durante la creación de la sesión. | Si la sesión fue creada exitosamente antes de la desconexión, al reconectarse el dispositivo la recupera (ver sección 13). Si la sesión no llegó a crearse, el dispositivo debe iniciar el proceso de acceso nuevamente, ingresando el código vigente en ese momento. |
| 19 | La creación se confirmó internamente pero la respuesta visual no llegó al dispositivo. | El sistema recupera la sesión ya existente al reintentarse el acceso. No se crea una segunda sesión. La idempotencia de la creación garantiza que el resultado sea el mismo. |
| 20 | Dos clientes escanean el QR casi simultáneamente con el mismo código. | Solo el primero que complete el proceso de creación obtiene la sesión. El segundo recibe el mensaje de sesión ya activa (caso 5). La creación es idempotente. |

---

## 22. Flujos Funcionales

### Flujo A — Acceso autónomo y creación de sesión

```
1. El grupo se sienta en la mesa. No se requiere ninguna acción del personal.
2. Un integrante escanea el QR de la mesa con su dispositivo.
3. El sistema identifica la mesa y verifica que está en estado Disponible.
4. El sistema solicita el código temporal.
5. El cliente consulta la pantalla del local y lo ingresa.
6. El sistema valida que el código esté vigente.
7. El sistema verifica que no exista sesión activa en esa mesa.
8. El sistema solicita al dispositivo que acepte convertirse en el dispositivo principal.
9. El dispositivo acepta. Se crea la sesión.
10. La mesa pasa a estado En uso.
11. El grupo continúa con el registro de participantes (PPA-004, Flujo A).
```

### Flujo B — Acceso bloqueado por código inválido

```
1. El cliente escanea el QR de la mesa.
2. El sistema identifica la mesa como Disponible.
3. El sistema solicita el código temporal.
4. El cliente ingresa un código vencido o incorrecto.
5. El sistema informa que el código no es válido.
6. El cliente consulta la pantalla del local para obtener el código vigente.
7. El cliente lo reingresa y completa el acceso exitosamente.

Si el cliente falla repetidamente:
8. El sistema bloquea temporalmente el acceso desde ese dispositivo.
9. Se muestra un mensaje amigable y se registra el evento.
```

### Flujo C — Recuperación en el mismo dispositivo

```
1. El dispositivo principal recargó la página, cerró el navegador o perdió conexión.
2. El dispositivo vuelve a acceder (recarga o nuevo escaneo del QR).
3. El sistema detecta que el dispositivo es el principal de la sesión activa.
4. El sistema recupera el estado exacto de la sesión.
5. El dispositivo es redirigido al punto donde estaba: registro, instrucciones, pregunta en curso o resultado.
   → Si hay una pregunta activa, muestra el tiempo restante real (no reinicia el temporizador).
   → Si la pregunta venció durante la interrupción, la registra como sin respuesta y avanza.
6. No se crea una nueva sesión. La duración de la sesión no se reinicia.
```

### Flujo D — Segundo dispositivo (sin transferencia)

```
1. Un segundo dispositivo escanea el QR de la mesa.
2. El sistema detecta que existe una sesión activa vinculada a otro dispositivo principal.
3. El sistema no crea una nueva sesión.
4. El segundo dispositivo recibe el mensaje: "Esta mesa ya tiene una sesión activa en otro dispositivo."
5. Se ofrece la opción de solicitar transferencia de control o contactar al personal.
6. Si el grupo no necesita transferencia, el segundo dispositivo permanece sin control.
```

### Flujo E — Transferencia de control

```
Transferencia aprobada desde el dispositivo actual:
1. El segundo dispositivo solicita el control desde su pantalla de acceso.
2. El dispositivo principal recibe la solicitud de transferencia.
3. El operador actual acepta la transferencia.
4. El nuevo dispositivo pasa a ser el dispositivo principal.
5. El dispositivo anterior pierde todas las capacidades de control de forma inmediata.
6. La transferencia queda registrada.

Transferencia autorizada por el personal (dispositivo original no disponible):
1. El grupo solicita ayuda al personal.
2. El personal localiza la sesión desde el panel.
3. El personal ejecuta "Transferir control" e ingresa el motivo.
4. El nuevo dispositivo pasa a ser el dispositivo principal.
5. La transferencia queda registrada con el identificador del personal.
```

### Flujo F — Cierre de sesión y liberación de mesa

```
1. La sesión finaliza (voluntariamente, por vencimiento o administrativamente).
2. La sesión pasa al estado correspondiente (Cerrada, Vencida o Invalidada).
3. La mesa pasa automáticamente a estado Liberación temporal.
4. No se pueden iniciar nuevas partidas en esa sesión.
5. Los resultados, el estado del premio y las métricas se conservan.
6. Al vencer el período de liberación, la mesa pasa automáticamente a Disponible.
7. No se requiere ninguna acción del personal para este paso.
8. El siguiente grupo puede iniciar el flujo A desde el comienzo.
```

### Flujo G — QR inválido o comprometido

```
1. El cliente escanea un QR que no corresponde a ninguna mesa activa, fue regenerado o la mesa está deshabilitada.
2. El sistema valida el QR y detecta que no es válido.
3. Se muestra un mensaje claro: "Este código QR no es válido o ya no está activo. Pedile ayuda al personal."
4. No se crea ninguna sesión.
5. El intento queda registrado como incidencia para revisión posterior.
```

---

## 23. Métricas Operativas

El sistema debe registrar conceptualmente las siguientes métricas. Las herramientas específicas de analítica se definirán en especificaciones futuras.

| Métrica | Descripción |
|---|---|
| Sesiones creadas | Total de sesiones creadas exitosamente. |
| Sesiones recuperadas | Sesiones retomadas por el dispositivo principal tras una interrupción. |
| Códigos inválidos ingresados | Intentos fallidos con código incorrecto o vencido. |
| Bloqueos por reintentos | Cantidad de bloqueos temporales aplicados por intentos repetidos. |
| QR inválidos escaneados | Escaneos rechazados por QR deshabilitado, regenerado o desconocido. |
| Transferencias solicitadas | Total de solicitudes de transferencia de control. |
| Transferencias aceptadas | Transferencias aprobadas por el dispositivo actual. |
| Transferencias administrativas | Transferencias autorizadas por el personal. |
| Sesiones vencidas | Sesiones cerradas por agotamiento del tiempo de 90 minutos. |
| Sesiones cerradas administrativamente | Sesiones cerradas por el personal antes del vencimiento. |
| Sesiones invalidadas | Sesiones descalificadas por incidencia o abuso. |
| Duración promedio de sesión | Tiempo promedio entre creación y cierre de sesión. |
| Tiempo promedio en liberación temporal | Indicador operativo del ciclo de rotación de mesas. |

---

## 24. Decisiones Aprobadas

Las siguientes decisiones están confirmadas y son parte de la base aprobada de PPA-005:

| Decisión | Estado |
|---|---|
| Experiencia autoservicio: no requiere activación manual del personal | ✅ Aprobado |
| QR único por mesa + código temporal como mecanismo de acceso | ✅ Aprobado |
| Código temporal general para el local, visible en pantallas físicas | ✅ Aprobado |
| Código temporal renovado automáticamente, sin intervención del personal | ✅ Aprobado |
| Una única sesión activa por mesa | ✅ Aprobado |
| Un único dispositivo principal por sesión | ✅ Aprobado |
| Transferencia de control controlada y registrada | ✅ Aprobado |
| Sesión máxima inicial de 90 minutos | ✅ Aprobado (consistente con PPA-004) |
| Período de liberación temporal automático entre sesiones | ✅ Aprobado |
| Liberación automática de la mesa sin intervención del personal | ✅ Aprobado |
| Geolocalización no obligatoria en el MVP | ✅ Aprobado |
| Verificación de red Wi-Fi no obligatoria en el MVP | ✅ Aprobado |
| QR estático permitido porque requiere también el código temporal | ✅ Aprobado |
| Panel administrativo exclusivo para supervisión, excepciones e incidencias | ✅ Aprobado |

---

## 25. Decisiones Futuras

Las siguientes decisiones quedan explícitamente diferidas a especificaciones posteriores:

| Decisión | Razón del diferimiento |
|---|---|
| Implementación técnica de la identidad del dispositivo | Requiere decisión de arquitectura. |
| Tecnología de generación y codificación del QR | Depende del stack tecnológico. |
| Tecnología de generación y visualización del código temporal | Depende del stack y de la infraestructura del local. |
| Infraestructura backend y método de persistencia | Requiere especificación de arquitectura. |
| Duración exacta del período de liberación temporal | Requiere validación operativa durante el MVP. |
| Duraciones configurables (vigencia del código, sesión, extensión) | Requiere panel de configuración administrativa. |
| Límite exacto de reintentos antes del bloqueo | Requiere análisis de seguridad y experiencia de usuario. |
| Diseño visual del panel administrativo | Requiere especificación de UX/Admin separada. |
| Diseño gráfico definitivo del QR físico | Requiere especificación de diseño. |
| Uso complementario de geolocalización | Evaluar si se detecta abuso durante la versión pública. |
| Integración futura con el sistema de pedidos o POS | Fuera del alcance del MVP. |
| QR dinámico (regeneración automática periódica) | Considerar en versiones futuras si se detecta abuso sistemático. |
| Automatización de activación mediante el pedido gastronómico | Funcionalidad futura; requiere integración con pedidos. |
| Política de auditoría y retención de incidencias | Requiere revisión legal y operativa. |
| Mecanismo técnico de identificación del nuevo dispositivo en transferencia | Detallado en especificación técnica futura. |

---

## 26. Criterios de Aceptación

PPA-005 se considera funcionalmente completo cuando cumple todos los siguientes criterios:

- [ ] El flujo de acceso normal no requiere ninguna acción del personal.
- [ ] El QR identifica una mesa pero no habilita por sí solo una sesión.
- [ ] El código temporal es el segundo factor de validación de presencia.
- [ ] El código temporal se genera y renueva automáticamente.
- [ ] El código es visible únicamente en las pantallas físicas del local.
- [ ] Solo existe una sesión activa por mesa en un momento dado.
- [ ] Solo existe un dispositivo principal por sesión.
- [ ] La transferencia de control está documentada con dos mecanismos: aprobación del dispositivo actual y autorización del personal.
- [ ] Toda transferencia queda registrada con todos los campos requeridos.
- [ ] La recuperación en el mismo dispositivo no duplica sesiones, respuestas, puntos ni premios.
- [ ] La duración de la sesión no se reinicia por recargas, reconexiones ni transferencias.
- [ ] El mecanismo dificulta el acceso desde fuera del local, con riesgo residual documentado.
- [ ] La mesa pasa automáticamente por un período de liberación temporal tras el cierre de una sesión.
- [ ] La mesa vuelve a Disponible automáticamente al vencer el período de liberación, sin intervención del personal.
- [ ] Están documentados los cuatro estados de mesa y sus transiciones.
- [ ] Están documentados los cuatro estados de sesión y sus transiciones, de forma separada a los estados de mesa.
- [ ] El comportamiento predeterminado al pausar la experiencia preserva las sesiones activas.
- [ ] El cierre masivo de sesiones requiere una acción explícita y separada con confirmación.
- [ ] Están documentadas las reglas sobre solicitudes de transferencia pendientes.
- [ ] Están documentados los controles contra abuso, incluyendo límites de reintentos.
- [ ] Están documentados los 20 casos límite con comportamiento esperado.
- [ ] El panel es exclusivamente de supervisión, excepciones e incidencias.
- [ ] No se eligieron tecnologías.
- [ ] No se creó código.
