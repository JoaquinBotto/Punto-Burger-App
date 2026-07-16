# PPA-004: Mecánica de Juego y Reglas Operativas

## 1. Identificación

| Campo | Valor |
|---|---|
| **Nombre del producto** | Punto Burger |
| **Estado del documento** | Aprobado |
| **Versión** | 1.0.0 |
| **Fecha** | 2026-07-16 |
| **Responsable** | Product Manager |
| **Entregable relacionado** | PPA-004 |
| **Documentos base** | PPA-002 (Product Vision), PPA-003 (MVP Roadmap) |

---

## 2. Objetivo

Definir la especificación funcional completa de la partida de trivia de Punto Burger, estableciendo sin ambigüedad las reglas de participación, el ciclo de vida de una sesión, la mecánica de preguntas, el sistema de puntuación, el manejo de errores y los flujos de recuperación.

Este documento es la fuente de verdad funcional para la implementación del núcleo del juego. Ningún componente del motor de trivia puede desarrollarse sin respetar las reglas aquí definidas.

---

## 3. Alcance

Este documento cubre:

- Reglas de participación y conformación de grupos.
- Uso de dispositivos por grupo o mesa.
- Ciclo completo de la sesión de mesa.
- Configuración de la partida estándar (MVP).
- Dificultad progresiva y su relación con el perfil del participante.
- Reglas para mesas con edades mixtas.
- Categorías de preguntas disponibles.
- Estructura y validación de preguntas.
- Sistema de puntuación del MVP.
- Ranking y criterios de desempate.
- Pantalla de resultado final.
- Repetición de partidas.
- Premios demostrativos del MVP interno.
- Reglas operativas para el personal.
- Recuperación ante errores e interrupciones.
- Reglas de abandono.
- Controles básicos contra abuso.
- Flujos funcionales completos (A–F).
- Casos límite relevantes.
- Criterios de aceptación.
- Decisiones diferidas para futuras especificaciones.

Este documento **no** define:

- Stack tecnológico.
- Estructura de base de datos.
- Endpoints o contratos de API.
- Componentes visuales o diseño de interfaz.
- Arquitectura en tiempo real.
- Integración técnica con IA.
- Economía definitiva de recompensas.
- Autenticación técnica definitiva.
- Mecanismos técnicos de validación de presencia física.
- Multijugador con varios dispositivos simultáneos.
- Torneos escolares avanzados.

---

## 4. Conceptos Principales

| Término | Definición |
|---|---|
| **Mesa** | Espacio físico del local identificado por un QR único. |
| **Sesión de mesa** | Período activo vinculado a una mesa, iniciado al escanear el QR y que expira por tiempo o cierre. |
| **Grupo** | Conjunto de participantes que comparte un dispositivo y juega unido bajo un nombre. Un solo participante también es un grupo. |
| **Participante** | Persona que integra un grupo y que aporta nombre y rango etario. |
| **Partida** | Secuencia de 10 preguntas con puntuación y resultado, vinculada a un grupo dentro de una sesión activa. |
| **Partida oficial** | Única partida válida por sesión que genera puntos y puede habilitar premios. |
| **Partida de práctica** | Partidas adicionales dentro de la misma sesión, sin efecto en el ranking ni en premios. |
| **Pregunta** | Enunciado con cuatro opciones y una única respuesta correcta, clasificada por categoría, dificultad y rango etario. |
| **Pregunta aprobada** | Pregunta habilitada para aparecer en partidas, validada por un administrador humano. |
| **Rango etario** | Clasificación del participante que determina el nivel de dificultad y el contenido de las preguntas que le corresponden. |
| **Pregunta dirigida** | Pregunta pensada para el rango etario de un participante específico dentro del grupo. |
| **Pregunta grupal** | Pregunta cuyo nivel de dificultad es compatible con el conjunto del grupo y no está asignada a un participante individual. |
| **Canje** | Proceso de solicitud y validación de un premio por parte del personal al finalizar una partida. |

---

## 5. Reglas de Participantes

### 5.1 Cantidad

- Una sesión admite un mínimo de **1 participante** y un máximo efectivo de **8 participantes registrados** para el MVP interno y la primera versión pública.
- Solo los participantes registrados reciben un perfil, preguntas dirigidas y contribuyen al puntaje grupal.
- Cuando haya más de 8 personas físicas presentes en la mesa, las personas adicionales pueden colaborar con el grupo y participar del debate, pero no tendrán un perfil registrado ni preguntas asignadas dentro de esa partida. Esto no impide que la mesa inicie y complete la partida.
- El límite máximo de participantes registrados podrá hacerse configurable en versiones futuras.
- Un participante individual se registra como grupo de una sola persona. No existe una modalidad técnica separada para jugar en solitario.

### 5.2 Registro del grupo

Al iniciar, el grupo debe proporcionar obligatoriamente:

1. **Nombre del grupo**: identificador libre elegido por los participantes.
2. **Lista de participantes**: al menos uno. Cada participante debe indicar:
   - Nombre (puede ser un apodo o nombre de pila).
   - Rango etario o nivel educativo.

El registro debe ser breve y de baja fricción. No se requiere autenticación persistente durante el MVP interno.

### 5.3 Rangos etarios reconocidos

El sistema debe reconocer al menos los siguientes rangos para la clasificación de preguntas:

| Rango | Descripción aproximada |
|---|---|
| Niño | Hasta aprox. 10 años |
| Adolescente | Aprox. 11 a 17 años |
| Adulto | 18 años en adelante |
| Nivel escolar específico | Para grupos de escuelas (primario, secundario, curso) |

Los rangos concretos y sus límites de edad exactos se definirán en la especificación de datos de usuario.

### 5.4 Gestión administrativa

El panel administrativo puede cerrar o invalidar grupos creados incorrectamente. Esta operación debe quedar registrada como anulación administrativa.

---

## 6. Reglas de Dispositivos

### 6.1 Un dispositivo principal por grupo

Durante el MVP interno y la primera versión pública:

- Cada grupo utiliza **un único dispositivo principal compartido**.
- Todos los participantes observan la misma pantalla y debaten la respuesta en conjunto.
- Una persona (el operador del dispositivo) confirma la opción elegida por el grupo.
- **Solo el dispositivo principal puede enviar respuestas.** Ningún otro dispositivo puede confirmar respuestas en la misma sesión.

### 6.2 Comportamiento ante un segundo dispositivo

Si se escanea el QR de la mesa desde un segundo dispositivo mientras existe una sesión activa:

- El sistema **no crea una nueva sesión**.
- El segundo dispositivo **no puede enviar respuestas** de forma automática.
- El segundo dispositivo recibe un mensaje informando que la partida ya está activa en otro dispositivo.
- El grupo podrá solicitar una **transferencia de control** al segundo dispositivo.
- La transferencia requiere confirmación desde el dispositivo actual o intervención del personal.
- El mecanismo técnico de transferencia se definirá en PPA-005.

### 6.3 Lo que NO se implementa en el MVP

- Un dispositivo independiente por participante.
- Respuestas individuales simultáneas desde dispositivos distintos.
- Cualquier mecanismo de sincronización o multijugador multi-dispositivo.

### 6.4 Evolución futura

La posibilidad de que cada participante se conecte desde su propio teléfono queda registrada como funcionalidad futura y no debe condicionar el diseño del MVP.

---

## 7. Ciclo Completo de la Sesión

Una sesión sigue el siguiente ciclo funcional:

```
1. El usuario escanea el QR de la mesa.
2. El sistema valida que la mesa está activa y disponible.
3. El sistema crea una nueva sesión activa vinculada a la mesa.
   → Si ya existe una sesión activa para esa mesa (misma sesión recuperable), el sistema la recupera.
4. El grupo registra los participantes (nombre del grupo, nombres y rangos etarios).
5. El grupo selecciona la categoría de preguntas o elige "categorías mezcladas".
6. El sistema muestra las instrucciones básicas de la partida.
7. La partida oficial comienza.
8. Se presentan las 10 preguntas de forma secuencial.
9. Cada respuesta se registra cuando el operador la confirma explícitamente o cuando vence el tiempo de la pregunta.
10. El sistema calcula el resultado final.
11. Se muestra la pantalla de resultado al grupo.
12. El grupo puede solicitar el canje de un premio (si aplica).
13. El personal valida y confirma el canje.
14. La sesión permanece activa hasta su expiración o cierre manual.
15. El grupo puede iniciar partidas de práctica mientras la sesión esté vigente.
```

### 7.1 Expiración de sesión

- Duración máxima recomendada: **90 minutos** desde su creación.
- Una sesión vencida no permite iniciar ni continuar partidas.
- Para jugar nuevamente tras el vencimiento, el grupo debe escanear el QR y crear una nueva sesión.
- La implementación técnica del mecanismo de expiración se definirá en la especificación técnica correspondiente.

### 7.2 Una sesión por mesa

Solo puede existir **una sesión activa por mesa** en un momento dado, salvo intervención administrativa explícita.

---

## 8. Configuración de la Partida

### 8.1 Valores del MVP (no configurables por el usuario)

| Parámetro | Valor |
|---|---|
| Cantidad de preguntas | 10 |
| Tiempo máximo por pregunta | 20 segundos |
| Duración estimada total | Entre 4 y 7 minutos |
| Preguntas visibles a la vez | 1 |

### 8.2 Selección previa de categoría

Antes de comenzar, el grupo elige:

- Una **categoría específica** (ej: Deportes, Historia).
- O la opción de **categorías mezcladas** (el sistema combina categorías disponibles).

### 8.3 Temporizador

- El temporizador de 20 segundos se inicia cuando la pregunta y sus cuatro opciones están completamente disponibles para el usuario.
- El temporizador es visible en pantalla y muestra el tiempo restante.
- Cuando el tiempo se agota:
  - La pregunta queda registrada como **sin respuesta**.
  - No es posible seleccionar ninguna opción.
  - Se muestra brevemente la respuesta correcta (con duración a definir en diseño de UI).
  - La partida avanza automáticamente a la siguiente pregunta.

### 8.4 Confirmación de respuesta

- El grupo selecciona una opción y la confirma explícitamente mediante una acción del operador.
- Una respuesta confirmada **no puede modificarse**.
- No se puede responder más de una vez a la misma pregunta.

---

## 9. Dificultad Progresiva

### 9.1 Distribución estándar de dificultad

| Preguntas | Nivel |
|---|---|
| 1, 2 y 3 | Inicial |
| 4, 5, 6 y 7 | Media |
| 8, 9 y 10 | Avanzada |

### 9.2 Principio de dificultad relativa al perfil

La dificultad es **relativa al perfil del participante**, no universal.

- Una pregunta de nivel avanzado para un niño no comparte el mismo contenido ni complejidad que una pregunta de nivel avanzado para un adulto.
- La dificultad define el desafío dentro del perfil etario o educativo del participante.
- El sistema debe asegurarse de que cada nivel de dificultad resulte apropiadamente desafiante para su destinatario.

### 9.3 Preguntas grupales y dificultad

Las preguntas grupales utilizan un nivel de dificultad compatible con la composición general del grupo. La lógica de determinación de ese nivel se definirá en la especificación del motor de selección de preguntas.

---

## 10. Mesas con Edades Mixtas

### 10.1 Construcción de la secuencia de preguntas

Cuando el grupo tiene participantes de diferentes rangos etarios, el sistema construye una secuencia equilibrada de preguntas antes de iniciar la partida.

**Ejemplo para una familia con niño, adolescente y adulto:**

| Pregunta | Asignación |
|---|---|
| 1 | Dirigida al niño |
| 2 | Dirigida al adolescente |
| 3 | Dirigida al adulto |
| 4 | Grupal |
| 5 | Dirigida al niño |
| 6 | Dirigida al adolescente |
| 7 | Dirigida al adulto |
| 8 | Grupal |
| 9 | Dirigida al niño |
| 10 | Grupal |

La secuencia exacta puede variar según el algoritmo de alternancia, pero debe respetar las reglas definidas en la sección 10.2.

### 10.2 Reglas de alternancia

1. Cada participante debe recibir **al menos una pregunta dirigida** cuando la cantidad de preguntas lo permita.
2. Ningún participante puede recibir **todas las preguntas** de la partida.
3. Los rangos etarios deben **alternarse** a lo largo de la secuencia.
4. Las preguntas grupales deben utilizar un nivel compatible con la composición general del grupo.
5. Si todos los participantes pertenecen al mismo rango etario, **no es necesario mostrar turnos diferenciados**: todas las preguntas se adaptan a ese perfil común.
6. Si existe un solo participante, todas las preguntas se adaptan a su perfil individual.

### 10.3 Grupos con más participantes que preguntas

Cuando el número de participantes supera el número de preguntas disponibles (ej: 12 participantes y 10 preguntas):

- No todos los participantes recibirán una pregunta dirigida individualmente.
- El sistema debe priorizar la alternancia por rangos etarios por encima de la alternancia por participante individual.
- Los participantes sin pregunta propia dentro de esa partida contribuyen al debate grupal.
- Esta situación debe comunicarse claramente al grupo durante el registro si se supera el máximo recomendado (8 participantes).

### 10.4 Indicación visual durante la partida

La pantalla debe indicar de forma clara en cada pregunta:

- `"Pregunta para [Nombre del participante]"` cuando la pregunta está dirigida a alguien específico.
- `"Pregunta grupal"` cuando la pregunta es para todo el grupo.

Aunque una pregunta esté dirigida a un participante, el grupo completo puede debatir, colaborar y acordar la respuesta antes de confirmarla. El objetivo es garantizar que todos tengan oportunidades reales de aportar, no aislar a los participantes.

---

## 11. Categorías

### 11.1 Categorías generales (MVP interno y público)

Disponibles para todos los grupos:

- Cultura general
- Deportes
- Música
- Cine y series
- Historia
- Geografía
- Ciencia
- Entretenimiento

### 11.2 Categorías escolares

Disponibles para grupos vinculados a una escuela o para las fases que habiliten contenido educativo:

- Matemática
- Lengua
- Biología
- Historia
- Geografía
- Ciencias naturales
- Otras materias administrables

### 11.3 Regla de extensibilidad

Las categorías no deben codificarse como una lista cerrada e inmutable en la lógica del sistema. El panel administrativo debe permitir agregar, modificar o desactivar categorías sin intervención en el código.

---

## 12. Preguntas y Respuestas

### 12.1 Estructura de una pregunta

Cada pregunta debe contener obligatoriamente:

| Campo | Descripción |
|---|---|
| Enunciado | Texto de la pregunta. |
| Opción A | Primera opción de respuesta. |
| Opción B | Segunda opción de respuesta. |
| Opción C | Tercera opción de respuesta. |
| Opción D | Cuarta opción de respuesta. |
| Respuesta correcta | Indica cuál de las cuatro opciones es correcta. |
| Categoría | A qué categoría temática pertenece. |
| Nivel de dificultad | Inicial, media o avanzada. |
| Rango etario / nivel educativo | A qué perfil de participante está dirigida. |
| Estado | Aprobada, pendiente o rechazada. |
| Explicación breve (opcional) | Contexto adicional sobre la respuesta correcta, visible al finalizar la pregunta. |

### 12.2 Reglas de validación de preguntas

- Cada pregunta tiene **exactamente cuatro opciones** y **una única respuesta correcta**.
- Solo pueden participar en partidas preguntas con **estado aprobado**.
- Las preguntas generadas mediante IA **nunca se publican directamente** en una partida. Requieren revisión y aprobación humana previa.
- Las preguntas rechazadas o pendientes no son visibles para los participantes.

---

## 13. Puntuación

### 13.1 Fórmula de puntuación del MVP

| Situación | Puntos |
|---|---|
| Respuesta correcta — dificultad inicial | 100 puntos |
| Respuesta correcta — dificultad media | 150 puntos |
| Respuesta correcta — dificultad avanzada | 200 puntos |
| Respuesta incorrecta | 20 puntos |
| Sin respuesta (tiempo agotado o no respondida) | 0 puntos |

### 13.2 Aclaraciones de la fórmula

- Responder correctamente siempre otorga significativamente más puntos que responder incorrectamente.
- Responder incorrectamente reconoce la participación del grupo con 20 puntos.
- No responder no suma ni resta puntos.
- **No existen puntos negativos** en el MVP.
- **No existen multiplicadores** por racha, velocidad u otro criterio en el MVP.
- La fórmula es intencionalmente simple para ser comprensible por los jugadores sin necesidad de explicación.

### 13.3 Puntuación máxima posible (partida estándar)

| Cálculo | Valor |
|---|---|
| 3 correctas iniciales × 100 | 300 puntos |
| 4 correctas medias × 150 | 600 puntos |
| 3 correctas avanzadas × 200 | 600 puntos |
| **Total máximo** | **1.500 puntos** |

### 13.4 Bonificación por velocidad

- Durante el MVP interno, **no se aplica ninguna bonificación por velocidad**.
- El tiempo de respuesta puede utilizarse como **criterio de desempate** en el ranking (ver sección 14), pero no modifica el puntaje obtenido.

### 13.5 Unidad de puntuación

El puntaje es grupal. No se calculan puntos individuales por participante durante el MVP. El grupo obtiene un único puntaje total al final de la partida.

---

## 14. Ranking y Desempates

### 14.1 Alcance de este ranking

Este documento define únicamente el **ranking de juego**, cuya unidad es el grupo, la mesa y la partida oficial. Comprende:

- La comparación de puntajes entre partidas oficiales completadas.
- La posición relativa de un grupo frente a otros grupos en un período determinado.
- La contribución del grupo al ranking de su curso o escuela (cuando aplique).

Lo siguiente queda fuera del alcance de esta sección y se definirá en la especificación de fidelización y perfiles:

- Ranking persistente individual de usuarios entre visitas.
- Niveles de comunidad o estatus personal.
- Acumulación personal de puntos a lo largo del tiempo.

### 14.2 Unidad del ranking

La unidad principal del ranking es el **grupo o mesa**, no el participante individual. Los rankings escolares representan la contribución acumulada de los grupos al total de su curso o escuela; no son rankings individuales de alumnos.

### 14.3 Ranking disponible en el MVP interno

- Puntaje de la partida.
- Posición entre las partidas válidas del día.

### 14.4 Ranking disponible en la primera versión pública

- Ranking diario.
- Ranking semanal.
- Ranking mensual.
- Ranking general.
- Ranking por escuela (contribución acumulada de grupos de esa escuela).
- Ranking por curso (contribución acumulada de grupos de ese curso).

### 14.5 Criterios de desempate (en orden de prioridad)

1. **Mayor puntaje total.**
2. **Mayor cantidad de respuestas correctas.**
3. **Menor tiempo total de respuesta** (suma de los tiempos empleados en cada pregunta respondida).
4. **Partida finalizada primero** (cronológicamente).

El tiempo de respuesta no agrega puntos; solo opera como criterio de desempate cuando los criterios anteriores no son suficientes.

### 14.6 Partidas válidas para el ranking

Solo las partidas oficiales completadas ingresan al ranking. Las partidas de práctica, abandonadas o invalidadas administrativamente quedan excluidas.

---

## 15. Resultados

### 15.1 Pantalla de resultado final

Al completar las 10 preguntas, el sistema debe mostrar:

- Nombre del grupo.
- Puntaje total obtenido.
- Cantidad de respuestas correctas.
- Cantidad de respuestas incorrectas.
- Cantidad de preguntas sin responder.
- Desglose de puntaje por nivel de dificultad (inicial, media, avanzada).
- Mensaje final de participación (tono divertido, positivo y motivador).
- Posición aproximada en el ranking disponible (cuando corresponda y el ranking esté operativo).
- Beneficio o premio obtenido en estado **Pendiente de validación** (cuando aplique); permanece en ese estado hasta que el personal confirme el canje.
- Opción para **finalizar la sesión** o **continuar en modo práctica**.

### 15.2 Tono del resultado

- La pantalla de resultado no debe mostrar evaluaciones negativas del tipo "reprobado" o "fallaste".
- Toda comunicación en el resultado debe ser positiva, motivadora y orientada a la participación y la diversión.
- El tono debe ser coherente con la identidad de Punto Burger: divertido, cercano y enérgico.

---

## 16. Repeticiones

### 16.1 Partida oficial

- Cada sesión admite **una única partida oficial** que genera puntos y puede habilitar un premio.

### 16.2 Opciones al finalizar la partida oficial

Al concluir la partida oficial, la pantalla de resultado presenta dos opciones:

#### Finalizar sesión

- Cierra voluntariamente la sesión de mesa.
- Impide iniciar partidas de práctica en esa sesión.
- El resultado de la partida y el estado del premio permanecen disponibles para que el personal pueda consultarlos y procesar el canje.
- Para jugar nuevamente se deberá escanear el QR y crear una nueva sesión válida.

#### Continuar en modo práctica

- Mantiene activa la sesión de mesa.
- Permite iniciar nuevas partidas sin puntos oficiales, sin posición en el ranking y sin habilitación de premios.
- La sesión continúa sujeta al vencimiento máximo establecido (90 minutos desde su creación).
- Las partidas de práctica deben estar claramente diferenciadas visualmente de la partida oficial.

### 16.3 Reinicio por incidencia

- El panel administrativo debe permitir al personal **reiniciar una partida** cuando exista una incidencia comprobada.
- El reinicio debe quedar registrado como anulación administrativa.
- Tras un reinicio, la partida generada se considera una nueva partida oficial, siempre que el personal lo autorice explícitamente.

---

## 17. Premios Demostrativos (MVP Interno)

### 17.1 Modalidades de premio disponibles

Durante el MVP interno, los premios son demostrativos o configurados manualmente. Una partida puede finalizar con cualquiera de las siguientes situaciones:

| Resultado | Descripción |
|---|---|
| Sin premio | La partida no alcanzó ningún umbral de premio. |
| Premio por participación | El grupo completó la partida y recibe un reconocimiento básico. |
| Premio por superar un puntaje | El grupo superó un umbral de puntaje configurado. |
| Premio seleccionado manualmente | El personal elige un premio específico para la sesión de prueba. |

### 17.2 Estado del premio

- El premio queda en estado **pendiente de validación** hasta que el personal lo confirme.
- El premio no puede entregarse sin la confirmación explícita del personal.
- Un premio confirmado y canjeado queda marcado como **utilizado** y no puede volver a activarse.
- La economía definitiva de premios (umbrales de puntaje, costo real, catálogo) se define en especificaciones futuras.

---

## 18. Reglas Operativas

### 18.1 Capacidades del personal

El personal del local debe poder realizar las siguientes acciones desde el panel administrativo, con el menor número de pasos posible y sin interrumpir su trabajo habitual:

| Acción | Descripción |
|---|---|
| Ver mesas activas | Lista de mesas con sesión en curso. |
| Ver grupos activos | Lista de grupos registrados con sesión vigente. |
| Ver partidas en curso | Estado de las partidas activas en tiempo real. |
| Cerrar una sesión | Finaliza la sesión de una mesa. |
| Reiniciar una partida | Anula la partida actual y permite iniciar una nueva (ante incidencia). |
| Invalidar una partida | Descalifica una partida del ranking y de los premios. |
| Validar un premio | Confirma que el grupo tiene derecho al premio. |
| Confirmar un canje | Registra que el premio fue entregado al cliente. |
| Consultar incidencias | Lista básica de eventos anómalos registrados. |

### 18.2 Principio de operación mínima

El flujo operativo del personal debe requerir la menor cantidad de pasos posible. Las acciones críticas (validar y confirmar un canje) no deben exigir más de 2 o 3 interacciones desde el panel.

---

## 19. Recuperación de Errores

### 19.1 Comportamiento del temporizador durante la recuperación

El temporizador de cada pregunta está ligado al momento original en que esa pregunta fue presentada al grupo. Las siguientes reglas aplican en cualquier escenario de interrupción:

- Una recarga de página, pérdida de conexión o cierre del dispositivo **nunca reinicia los 20 segundos** de una pregunta.
- Cada pregunta conserva su momento original de vencimiento.
- Al recuperar la sesión, si la pregunta todavía está vigente, el sistema la muestra con el **tiempo restante real** (no con 20 segundos completos).
- Si el tiempo de la pregunta venció durante la interrupción, esa pregunta se registra automáticamente como **sin respuesta** (0 puntos) y el sistema avanza a la siguiente pregunta pendiente.
- Las respuestas ya confirmadas antes de la interrupción permanecen **inmutables** y no se pueden alterar al retomar.

### 19.2 Pérdida de conexión

- Las respuestas confirmadas antes de la pérdida de conexión **deben conservarse** y no pueden perderse.
- La sesión no debe duplicarse al reconectarse.
- El usuario debe poder retomar la partida desde el punto donde quedó, siempre que la sesión siga activa.
- Se aplican las reglas de temporizador descritas en 19.1.

### 19.3 Recarga de página

- Al recargar la página, el sistema debe recuperar automáticamente la sesión activa.
- No debe iniciarse una nueva partida.
- El sistema devuelve al usuario a la primera pregunta pendiente de responder, mostrando el tiempo restante real de esa pregunta; o a la pantalla de resultado si la partida ya finalizó.
- Se aplican las reglas de temporizador descritas en 19.1.

### 19.4 Cierre accidental del navegador o dispositivo

- Si el cierre ocurre durante una sesión vigente, el grupo puede recuperar la partida escaneando nuevamente el QR de la misma mesa.
- La sesión recuperada retoma desde el estado en que se encontraba, no desde el inicio.
- Se aplican las reglas de temporizador descritas en 19.1.

### 19.5 Pregunta inválida o problemática

- El sistema debe permitir que el grupo **reporte una pregunta** como incorrecta, ambigua o problemática.
- La partida continúa normalmente tras el reporte; no se reemplaza la pregunta durante el MVP.
- El administrador puede revisar los reportes posteriormente desde el panel.
- La pregunta reportada no se muestra automáticamente en otras partidas hasta que un administrador la revise y actualice su estado.

### 19.6 QR inválido o vencido

- Si el QR escaneado no corresponde a ninguna mesa activa o está vencido, el sistema no permite iniciar ninguna partida.
- Se muestra un mensaje claro y comprensible al usuario.
- El mensaje debe indicar que solicite ayuda al personal del local.
- No debe mostrarse información técnica ni interna al usuario.

---

## 20. Abandono

### 20.1 Definición de partida abandonada

Una partida se considera abandonada cuando ocurre cualquiera de las siguientes condiciones:

- La sesión expira por inactividad o tiempo máximo.
- El usuario finaliza voluntariamente la partida antes de completar las 10 preguntas.
- El personal cierra la sesión desde el panel administrativo.
- Transcurre un período configurable sin ninguna actividad del grupo (tiempo de inactividad a definir).

### 20.2 Consecuencias del abandono

- Las partidas abandonadas **no entregan premios**.
- Las partidas abandonadas **no ingresan al ranking oficial**.
- Las métricas operativas básicas de la partida (preguntas respondidas, tiempo transcurrido, puntos parciales) deben conservarse para análisis interno.

---

## 21. Controles Básicos contra Abuso

Las siguientes reglas deben aplicarse como parte de la lógica funcional del sistema. No se define en este documento el mecanismo técnico que las implementa.

| Regla | Descripción |
|---|---|
| Una sola partida oficial por sesión | No se pueden acumular múltiples partidas oficiales dentro de la misma sesión. |
| Una sola sesión activa por mesa | Salvo intervención administrativa explícita. |
| No repetir respuestas | Una vez enviada una respuesta para una pregunta, no puede enviarse otra. |
| No cambiar respuestas confirmadas | Una respuesta confirmada es definitiva e inmutable. |
| No duplicar puntos por recarga | Recargar la página no debe volver a sumar los puntos ya acreditados. |
| No validar el mismo premio dos veces | Un premio confirmado queda marcado como utilizado e irrepetible. |
| Registro de anulaciones administrativas | Toda anulación realizada por el personal debe quedar registrada con marca de tiempo e identificador del operador. |
| Separación de partidas oficiales y de práctica | Las partidas de práctica no generan puntos, no ingresan al ranking y no habilitan premios. |

---

## 22. Flujos Funcionales

### Flujo A — Grupo común

```
1. El grupo escanea el QR de la mesa.
2. El sistema valida que la mesa está activa.
3. El grupo elige el nombre del grupo.
4. El grupo registra los participantes (nombre y rango etario).
5. El grupo selecciona la categoría de preguntas (o "mezcladas").
6. El sistema muestra las instrucciones de la partida.
7. Comienza la partida oficial con las 10 preguntas.
8. El grupo responde cada pregunta dentro de los 20 segundos.
9. Al finalizar, se muestra la pantalla de resultado.
10. Se muestran los puntos obtenidos y la posición en el ranking.
11. Si aplica un premio, se muestra en pantalla.
12. El grupo puede solicitar el canje al personal.
13. El personal valida y confirma el canje.
14. El grupo puede iniciar una partida de práctica o cerrar la sesión.
```

### Flujo B — Participante individual

```
1. El participante escanea el QR de la mesa.
2. El sistema valida que la mesa está activa.
3. El participante elige el nombre del grupo (puede ser su nombre propio).
4. El participante se registra como único integrante con su rango etario.
5. El participante selecciona la categoría.
6. La partida se adapta completamente a su perfil individual.
   → No se muestran turnos diferenciados (no hay otros participantes).
   → Todas las preguntas se ajustan a su rango etario y dificultad progresiva.
7. Se muestra el resultado individual al finalizar.
8. El resto del flujo es idéntico al Flujo A.
```

### Flujo C — Familia con edades mixtas

```
1. La familia escanea el QR de la mesa.
2. El sistema valida que la mesa está activa.
3. La familia elige el nombre del grupo.
4. Se registran todos los participantes con sus nombres y rangos etarios.
   (ej: un niño, un adolescente y dos adultos)
5. El sistema construye la secuencia de preguntas respetando las reglas de alternancia.
6. La familia selecciona la categoría.
7. Durante la partida, cada pregunta muestra claramente a quién está dirigida.
8. Aunque la pregunta sea individual, todos debaten y el operador confirma la respuesta del grupo.
9. Al finalizar, el resultado es conjunto y refleja el puntaje unificado del grupo.
10. El tono del resultado celebra la participación de todos los integrantes.
11. El resto del flujo es idéntico al Flujo A.
```

### Flujo D — Grupo escolar

```
1. Los estudiantes escanean el QR de la mesa.
2. El sistema valida que la mesa está activa.
3. El grupo registra el nombre del grupo, los participantes y sus perfiles.
4. El grupo selecciona la escuela y el curso correspondiente.
   (Disponible en la primera versión pública; desactivado en el MVP interno.)
5. El grupo selecciona la categoría o materia.
6. La partida se desarrolla con preguntas adaptadas al nivel educativo.
7. Al finalizar, los puntos se suman al ranking del grupo.
8. En la primera versión pública, los puntos contribuyen también al ranking del curso y la escuela.
9. El resto del flujo es idéntico al Flujo A.
```

### Flujo E — Recuperación

```
1. El grupo estaba en medio de una partida y la conexión se interrumpió (o el dispositivo se cerró).
2. El grupo escanea nuevamente el QR de la misma mesa (o recarga la página en el mismo dispositivo).
3. El sistema detecta la sesión activa existente vinculada a esa mesa.
4. El sistema recupera el estado de la partida:
   → Si la partida estaba en curso, retoma desde la pregunta siguiente a la última respondida.
   → Si todas las preguntas ya habían sido respondidas, muestra directamente el resultado.
   → Las preguntas cuyo tiempo venció durante la interrupción se registran como sin respuesta.
5. No se crea una nueva partida ni una nueva sesión.
6. El grupo continúa desde el punto de recuperación.
```

### Flujo F — Canje

```
1. La partida oficial ha finalizado.
2. La pantalla de resultado indica que el grupo obtuvo un premio.
3. El grupo llama al personal del local para solicitar el canje.
4. El personal accede al panel administrativo y localiza la partida del grupo.
5. El personal verifica que el premio está disponible y vigente.
6. El personal confirma el canje en el panel.
7. El sistema marca el premio como utilizado.
8. El personal entrega el premio físicamente al grupo.
9. El canje queda registrado con marca de tiempo e identificador del personal que lo procesó.
```

---

## 23. Casos Límite

| Caso | Comportamiento esperado |
|---|---|
| El grupo no responde ninguna pregunta (tiempo agotado en todas). | Puntaje final: 0 puntos. Se muestra el resultado con 0 correctas, 0 incorrectas y 10 sin responder. El tono del mensaje sigue siendo positivo. |
| El grupo responde todas las preguntas correctamente. | Puntaje máximo: 1.500 puntos. Se muestra el resultado con 10 correctas. |
| Hay más de 8 personas físicas en la mesa. | Solo se pueden registrar hasta 8 participantes. Las personas adicionales pueden colaborar y debatir, pero no tienen perfil ni preguntas dirigidas. La mesa no es bloqueada por esto. |
| Todos los participantes tienen el mismo rango etario. | No se muestran turnos diferenciados. Todas las preguntas se adaptan al perfil común. |
| La sesión vence mientras la partida estaba en curso. | La partida se considera abandonada. No se entregan premios ni se ingresa al ranking. Las métricas parciales se conservan. |
| El grupo intenta iniciar una segunda partida oficial en la misma sesión. | El sistema impide iniciar una segunda partida oficial y ofrece la opción de jugar en modo práctica. |
| El personal cierra la sesión mientras la partida estaba activa. | La partida se registra como interrumpida por intervención administrativa. No se generan premios. |
| El grupo reporta una pregunta durante la partida. | La pregunta queda marcada para revisión. La partida continúa normalmente. El grupo no recibe reemplazo. |
| El grupo intenta responder una pregunta cuyo tiempo ya venció. | El sistema no acepta la respuesta. La pregunta queda registrada como sin respuesta. |
| El mismo QR se escanea desde un segundo dispositivo mientras la sesión está activa. | El sistema no crea una nueva sesión. El segundo dispositivo recibe un mensaje informando que la partida ya está activa en otro dispositivo y no puede enviar respuestas. Se puede solicitar una transferencia de control. |
| La conexión se pierde durante la presentación de la respuesta correcta (después de confirmar). | La respuesta ya fue registrada antes de la pérdida de conexión. No hay pérdida de datos. |
| La partida de práctica intenta generar un premio. | El sistema no asocia premios a partidas de práctica. Cualquier intento de canje en este contexto debe ser bloqueado. |

---

## 24. Criterios de Aceptación

Una implementación del motor de trivia se considera válida cuando cumple todos los siguientes criterios:

- [ ] La mecánica puede implementarse sin ambigüedades funcionales derivadas de este documento.
- [ ] Se utiliza un único dispositivo principal por grupo.
- [ ] Un participante individual puede jugar como grupo de una persona sin modalidad técnica separada.
- [ ] La partida estándar tiene exactamente 10 preguntas.
- [ ] El temporizador es de 20 segundos por pregunta y comienza al presentarse la pregunta completa.
- [ ] La curva de dificultad sigue la distribución 3-inicial, 4-media, 3-avanzada.
- [ ] Las preguntas dirigidas y grupales se aplican correctamente en mesas con edades mixtas.
- [ ] La fórmula de puntuación es: 100/150/200 puntos por correcto, 20 puntos por incorrecto, 0 por sin respuesta.
- [ ] No existen puntos negativos, multiplicadores ni bonificaciones por velocidad.
- [ ] Las respuestas correctas obtienen notablemente más puntos que las incorrectas.
- [ ] Los criterios de desempate del ranking se aplican en el orden definido.
- [ ] La pantalla de resultado muestra todos los campos requeridos con tono positivo.
- [ ] La recuperación de sesión funciona ante recarga, cierre accidental y pérdida de conexión.
- [ ] El canje requiere confirmación del personal y queda registrado como utilizado.
- [ ] Los controles básicos contra abuso impiden duplicar respuestas, puntos y premios.
- [ ] Las partidas de práctica no generan puntos ni premios.
- [ ] Las partidas abandonadas no ingresan al ranking.
- [ ] El personal puede realizar todas las acciones operativas definidas desde el panel.
- [ ] No se eligió ningún stack tecnológico en este documento.
- [ ] No se creó ningún código en este documento.

---

## 25. Decisiones Futuras No Incluidas en Este Documento

Las siguientes decisiones quedan explícitamente diferidas a especificaciones posteriores:

| Decisión | Razón del diferimiento |
|---|---|
| Stack tecnológico (frontend, backend, base de datos) | Requiere especificación de arquitectura separada. |
| Modelo de base de datos y esquemas | Depende de la selección tecnológica. |
| Endpoints y contratos de API | Depende de la arquitectura backend. |
| Diseño visual de componentes e interfaces | Requiere especificación de UX/UI separada. |
| Arquitectura en tiempo real (WebSockets, polling, SSE) | Decisión técnica diferida. |
| Integración técnica con IA para generación de preguntas | Fuera del alcance del MVP interno. |
| Economía definitiva de premios (umbrales, catálogo, costos) | Requiere validación del negocio. |
| Límites de edad exactos por rango etario | Requiere definición junto con los requisitos de privacidad de menores. |
| Mecanismo técnico de validación de presencia física | Diferido a la primera versión pública. |
| Mecanismo técnico de transferencia de control entre dispositivos | Se definirá en PPA-005. |
| Autenticación técnica de usuarios (persistente entre visitas) | Diferido a la primera versión pública. |
| Ranking persistente individual, niveles de comunidad y acumulación personal | Se definirán en la especificación de fidelización y perfiles. |
| Bonificación por velocidad en el sistema de puntos | Considerada para versiones futuras. |
| Multijugador con varios celulares simultáneos | Considerado como evolución futura de dispositivos. |
| Torneos escolares avanzados, ligas y temporadas | Diferidos a fases posteriores del roadmap. |
| Configurabilidad del límite de participantes | Diferido a versiones futuras. |
| Configurabilidad de duración y cantidad de preguntas | Diferido a versiones futuras. |
| Política de privacidad, términos y consentimiento formal | Requiere revisión legal. |
| Ranking por escuela y curso | Diferido a la primera versión pública. |
| Diseño detallado del panel administrativo | Requiere especificación UX/Admin separada. |
