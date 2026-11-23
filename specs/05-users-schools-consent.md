# PPA-006: Usuarios, Perfiles, Escuelas, Consentimiento y Competencia Escolar

## 1. Identificación

| Campo | Valor |
|---|---|
| **Nombre del producto** | Punto Burger |
| **Estado del documento** | Aprobado |
| **Versión** | 1.0.0 |
| **Fecha** | 2026-07-18 |
| **Responsable** | Product Manager |
| **Entregable relacionado** | PPA-006 |
| **Documentos base** | PPA-002 (Product Vision), PPA-003 (MVP Roadmap), PPA-004 (Mecánica de Juego), PPA-005 (Acceso por QR y Sesiones de Mesa) |

---

## 2. Objetivo y Principio Rector

### 2.1 Objetivo General

Definir la especificación funcional completa para la gestión de identidades, perfiles, participación de menores, historial de juego, estadísticas personales, entidades escolares, cursos, competencia comunitaria, temporadas, consentimientos, privacidad, recuperación, estados de cuenta y roles internos dentro del ecosistema digital de Punto Burger.

Este documento establece las reglas funcionales que garantizan:
- La coexistencia armónica entre participantes ocasionales y usuarios registrados.
- La preservación estricta de la fluidez del juego autoservicio sin barreras de entrada.
- La protección de la privacidad y minimización de datos personales, con salvaguardas categóricas para menores de edad.
- La representatividad comunitaria legítima de escuelas y cursos sin abrir vectores de abuso ni manipulación de rankings.
- La separación formal entre el puntaje de una partida grupal, la progresión personal y la contribución competitiva escolar.
- La equidad deportiva en competencias escolares evitando que el volumen demográfico o la cantidad de visitas distorsionen los resultados.

### 2.2 Objetivo Adicional de Comunidad y Recurrencia

La primera versión pública de Punto Burger tiene como propósito construir una comunidad recurrente y activa alrededor de la experiencia del local gastronómico en Esperanza, Santa Fe.

Un usuario persistente podrá:
- Volver al local y ser reconocido automáticamente mediante su identidad digital.
- Consultar su historial completo de partidas jugadas en visitas previas.
- Consultar los resultados detallados y desgloses de partidas anteriores.
- Acumular progresión personal, niveles o insignias a medida que juega.
- Conservar beneficios, premios y canjes vigentes en su billetera digital.
- Participar en rankings individuales permitidos bajo consentimiento expreso.
- Representar voluntariamente a una escuela y a un curso de la ciudad o región.
- Contribuir activamente a las competencias intercolegiales e inter-cursos.
- Consultar la posición competitiva en vivo de su curso y de su escuela.
- Consultar el archivo histórico de temporadas anteriores disputadas.

**Premisa central de continuidad:** El Modo Invitado continúa existiendo en todo momento y sigue siendo 100% suficiente para jugar cualquier partida completa en el local.

### 2.3 Principio Rector: Experiencia Autoservicio sin Fricción

El flujo normal de juego en Punto Burger es y continuará siendo **estrictamente autoservicio**:

$$\text{QR de mesa} \longrightarrow \text{Código temporal del local} \longrightarrow \text{Sesión activa} \longrightarrow \text{Registro breve} \longrightarrow \text{Partida} \longrightarrow \text{Resultado}$$

- Ningún cliente debe verse obligado a crear una cuenta persistente para comenzar una partida normal.
- El personal del local no interviene en el registro de jugadores, creación de perfiles ni acceso a las partidas.
- El personal del bar interviene exclusivamente ante incidencias operativas, sospechas fundadas de abuso, recuperación excepcional asistida, administración de mesas y validación física presencial de canjes de premios cuando corresponda.

---

## 3. Alcance

### 3.1 Este documento cubre:

- Definición y separación conceptual de Participante temporal, Invitado y Usuario persistente.
- Separación formal de tres tipos de puntuación: Puntaje de partida, Progresión personal y Contribución competitiva.
- El modelo simplificado de identidad durante el MVP interno.
- La coexistencia de Modo invitado y Usuario registrado en la primera versión pública.
- El proceso y límites de conversión de invitado a usuario tras finalizar una partida.
- Atributos funcionales obligatorios y opcionales del usuario persistente.
- El número de celular como identificador funcional principal de la cuenta.
- El uso de rangos etarios y niveles educativos bajo el principio de minimización de datos.
- Reglas de participación y resguardo de menores de edad.
- Modelo de perfil dependiente administrado por adultos responsables.
- Historial completo y consultas de partidas del usuario persistente.
- Estadísticas personales agregadas en el perfil de usuario.
- Reglas de asociación de una partida grupal con usuarios persistentes.
- Entidades administradas de Escuelas y Cursos.
- Proceso de solicitud e incorporación de escuelas no listadas.
- Ciclo de vida y estados de la asociación escolar de un usuario o dependiente.
- Reglas de cambio de escuela/curso y prevención de fraude en rankings.
- Reglas de contribución de partidas oficiales a rankings escolares.
- Sistema de competencia escolar y regla funcional de equidad (mejor partida por usuario).
- Fórmula de cálculo del ranking por curso y umbral mínimo de participantes (Clasificación provisional).
- Fórmula de cálculo del ranking por escuela como promedio de cursos elegibles.
- Competencia interna entre cursos de una misma escuela (ej: 1.º A vs 1.º B).
- Rankings disponibles (Individual, Curso, Escuela, Grupo) y sus períodos (diario, semanal, mensual, temporada, histórico).
- Ciclo de vida y gestión de Temporadas competitivas (estados, inicio, congelamiento y cierre).
- Perfiles públicos protegidos para Cursos y Escuelas (sin exposición de menores).
- Integridad competitiva, trazabilidad y controles antifraude.
- Difusión de líderes en pantallas físicas del bar y experiencia motivacional positiva.
- Visibilidad, anonimización y privacidad en rankings públicos.
- Estructura modular de consentimientos (términos, privacidad, marketing, ranking).
- Reglas del consentimiento independiente de marketing y desvinculación de redes.
- Capacidades de consulta del perfil persistente y límites contra dinámicas de red social.
- Ciclo de vida y estados operativos de una cuenta de usuario.
- Políticas funcionales de suspensión, bloqueo y auditoría.
- Detección y manejo de cuentas y registros duplicados.
- Recuperación funcional de acceso con y sin celular previo.
- Modificación de información, retiro de consentimientos y solicitud de eliminación de cuenta.
- Relación entre canjes inmediatos de sesión y billetera persistente.
- Roles funcionales internos bajo el principio de mínimo privilegio.
- Funciones administrativas sobre temporadas y competencias.
- Registro y preservación del historial competitivo intercolegial.
- Flujos funcionales detallados de la A a la I.
- Matriz de casos límite con comportamiento esperado.
- Métricas operativas conceptuales de identidad y competencia.
- Decisiones aprobadas y decisiones diferidas.
- Criterios de aceptación funcionales actualizados.

### 3.2 Este documento NO define:

- Stack tecnológico (lenguajes, frameworks, librerías, bases de datos o nubes).
- Modelos físicos de base de datos, tablas, colecciones o esquemas relacionales.
- Endpoints, rutas HTTP, métodos REST, contratos GraphQL o APIs.
- Diseño visual final, wireframes pixel-perfect o diseño de interfaces gráficas.
- Selección técnica de proveedores de autenticación (Firebase Auth, Supabase, Auth0, Cognito, etc.).
- Implementación técnica de verificación de contacto (código SMS, OTP, WhatsApp Cloud API, webhook de telefonía, llamada interactiva, magic link, etc.).
- Conclusiones jurídicas o dictámenes legales definitivos sobre protección de datos o menores (quedan sujetos a auditoría legal profesional previa a producción).
- Mecanismo técnico de encriptación o cifrado en reposo y en tránsito.
- Algoritmos matemáticos definitivos para el cálculo de fidelización o progresión personal.

---

## 4. Conceptos Principales

| Término | Definición |
|---|---|
| **Participante temporal** | Persona física que interviene en una partida específica dentro de una sesión de mesa. Su identidad vive solo durante esa sesión. |
| **Invitado** | Modalidad de acceso o grupo que juega en Punto Burger sin haber iniciado sesión en una cuenta persistente. |
| **Usuario persistente** | Cuenta registrada en el sistema con identidad verificable y conservada entre múltiples visitas al local. |
| **Perfil dependiente** | Subperfil sin datos de contacto propios (celular/email), administrado y tutelado exclusivamente por una cuenta adulta persistente. |
| **Puntaje de partida** | Resultado numérico obtenido por el grupo en una partida de trivia (según PPA-004). |
| **Progresión personal** | Métrica acumulada de actividad, nivel o fidelización vinculada a una cuenta persistente a lo largo de sus visitas. |
| **Contribución competitiva** | Valor matemático derivado de una partida oficial válida que aporta al ranking de un curso y escuela. |
| **Temporada** | Ciclo temporal formal de competencia escolar (ej: Apertura 2027) con fechas de inicio, fin y reglas específicas. |
| **Clasificación provisional** | Estado de un curso en el ranking que aún no ha alcanzado el cupo mínimo requerido de participantes únicos. |
| **Asociación escolar** | Vínculo funcional declarado y verificado entre un usuario/perfil dependiente y un curso escolar específico. |

---

## 5. Separación Fundamental de Identidades

Para evitar confusiones en el diseño del producto, la arquitectura funcional y la experiencia de usuario, se establecen tres entidades conceptualmente independientes:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ENTIDADES DE IDENTIDAD                           │
├──────────────────────────┬───────────────────────────┬──────────────────────┤
│  PARTICIPANTE TEMPORAL   │         INVITADO          │  USUARIO PERSISTENTE │
├──────────────────────────┼───────────────────────────┼──────────────────────┤
│ • Vive dentro de la      │ • Modalidad grupal/mesa   │ • Identidad digital  │
│   sesión activa          │   sin login persistente   │   estable en el tiempo│
│ • Datos mínimos:         │ • Juega, responde y suma  │ • Celular verificado │
│   alias y rango etario   │   al puntaje de partida   │ • Conserva beneficios│
│ • No requiere cuenta     │ • Sin beneficios entre    │ • Escuela y curso    │
│ • Se descarta al cerrar  │   visitas posteriores     │ • Perfiles asociados │
└──────────────────────────┴───────────────────────────┴──────────────────────┘
```

### 5.1 Participante Temporal

- Es la persona física que forma parte del grupo que juega en la mesa.
- Existe exclusivamente dentro de la sesión de mesa activa.
- **Datos requeridos mínimos:** Alias o nombre de pila y rango etario (o nivel educativo).
- No requiere registro de contacto, contraseña ni cuenta de ningún tipo.
- Puede jugar todas las partidas que desee mientras la sesión esté activa sin necesidad de crear jamás una cuenta.
- Al expirar o cerrarse la sesión, su vinculación operativa con la mesa finaliza.

### 5.2 Invitado

- Se refiere al grupo, mesa o usuario que utiliza la plataforma de Punto Burger sin haber vinculado una cuenta persistente.
- **Capacidades permitidas:**
  - Iniciar una sesión autoservicio (QR + código temporal).
  - Registrar participantes temporales.
  - Seleccionar categorías y jugar la partida oficial.
  - Responder preguntas y visualizar el resultado grupal.
  - Solicitar el canje de premios inmediatos de la sesión según las reglas operativas de PPA-004.
  - Participar en partidas de práctica dentro de la misma sesión.
- **Restricciones estrictas:**
  - No puede acumular puntos personales para futuras visitas.
  - No dispone de billetera personal de puntos ni historial acumulativo.
  - No conserva beneficios ni recompensas para visitas posteriores una vez cerrada la sesión.
  - No accede al ranking individual persistente.
  - No puede recuperar su identidad en visitas futuras.

### 5.3 Usuario Persistente

- Es la persona que toma la decisión voluntaria de registrar una cuenta para mantener una relación continua con el ecosistema de Punto Burger.
- **Capacidades permitidas:**
  - Iniciar sesión e identificarse dentro de una mesa activa en el local.
  - Consultar su historial de partidas y estadísticas de rendimiento personal.
  - Conservar puntos personales acumulados (cuando dicha funcionalidad esté disponible).
  - Consultar su billetera, historial de movimientos y recompensas pendientes.
  - Conservar beneficios y premios para canjes futuros dentro de su plazo de vigencia.
  - Administrar perfiles dependientes (hijos, familiares menores a cargo).
  - Asociarse voluntariamente a una escuela y curso para aportar al ranking escolar.
  - Figurar en rankings individuales públicos (si otorga consentimiento explícito).
  - Administrar sus preferencias lúdicas, consentimientos y datos personales.

---

## 6. Separación de Tres Tipos de Puntuación

Para garantizar una arquitectura de datos limpia y evitar distorsiones en la experiencia lúdica, se formaliza la separación estricta de tres dimensiones de puntaje:

```
                                [ SISTEMA DE PUNTUACIONES ]
                                             │
         ┌───────────────────────────────────┼───────────────────────────────────┐
         ▼                                   ▼                                   ▼
┌─────────────────────────┐         ┌─────────────────────────┐         ┌─────────────────────────┐
│   PUNTAJE DE PARTIDA    │         │   PROGRESIÓN PERSONAL   │         │ CONTRIBUCIÓN COMPETITIVA│
├─────────────────────────┤         ├─────────────────────────┤         ├─────────────────────────┤
│ • Resultado del grupo   │         │ • Actividad acumulada   │         │ • Valor para rankings   │
│ • Definido en PPA-004   │    ≠    │ • Niveles e insignias   │    ≠    │   de escuela y curso    │
│ • Pertenece a la mesa   │         │ • Fidelización/premios  │         │ • Solo partidas oficiales│
│ • No se fracciona entre │         │ • Fórmula diferida      │         │ • Aplica regla de       │
│   los participantes     │         │   (No es 1 a 1 con PPA) │         │   mejor partida personal│
└─────────────────────────┘         └─────────────────────────┘         └─────────────────────────┘
```

### 6.1 Puntaje de Partida

- Es el resultado numérico grupal obtenido por la mesa al finalizar las 10 preguntas de trivia, reglamentado en PPA-004 (ej: 1.240 puntos).
- Pertenece a esa partida concreta y a esa sesión de mesa.
- No se divide automáticamente entre los participantes que integraron el grupo.

### 6.2 Progresión Personal

- Representa el avance individual y la fidelidad del usuario persistente a lo largo de sucesivas visitas a Punto Burger.
- Se utilizará para niveles de experiencia, desbloqueo de avatares, insignias lúdicas, beneficios comerciales y estadísticas históricas.
- La fórmula matemática exacta se definirá en una especificación posterior de gamificación y fidelización.
- **Regla inmutable:** Bajo ninguna circunstancia se asume que $1\text{ punto de partida} = 1\text{ punto de progresión personal}$.

### 6.3 Contribución Competitiva

- Es el valor cuantitativo que aporta una partida a los rankings de curso y escuela.
- Proviene de forma exclusiva de partidas oficiales válidas y completadas.
- Está gobernado por reglas estrictas de elegibilidad y equidad deportiva (ver sección 21) para impedir que la cantidad desmedida de visitas o la disparidad en el tamaño de los cursos vicie la competencia comunitaria.

---

## 7. El Modelo en el MVP Interno

Durante la fase de validación presencial (MVP interno):

1. **Cero fricción de acceso:** No se solicitará inicio de sesión, login ni creación de cuentas persistentes para jugar en el local.
2. **Uso exclusivo de participantes temporales:** Al escanear el QR e ingresar el código temporal, el grupo registrará únicamente nombre del grupo y lista de participantes temporales (alias + rango etario).
3. **Puntuación no acumulativa:** Los puntos obtenidos pertenecen a la partida y al grupo de la mesa. No existe billetera digital personal ni saldo entre visitas.
4. **Premios de sesión:** Se validan únicamente premios inmediatos y demostrativos operados presencialmente por el personal conforme a PPA-004.
5. **Funciones escolares desactivadas:** Las entidades de escuelas, cursos y rankings escolares permanecerán apagadas de forma general, utilizándose solo en pruebas internas cerradas bajo control del equipo.

---

## 8. El Modelo en la Primera Versión Pública

En el lanzamiento público coexistirán ambas modalidades de forma transparente:

```
                            [ Cliente escanea QR ]
                                      │
                                      ▼
                        [ Ingresa código temporal ]
                                      │
                                      ▼
                          [ Sesión de mesa Activa ]
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
         [ MODO INVITADO ]                       [ USUARIO REGISTRADO ]
                 │                                         │
        (Ruta predeterminada)                     (Opción voluntaria)
                 │                                         │
        • Ingreso de alias                        • Identificación rápida
        • Rango etario                            • Carga de perfil/dependientes
        • Inicio directo                          • Escuela y curso vinculados
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      ▼
                        [ Juego de Trivia Grupal ]
```

### 8.1 Modo Invitado (Ruta de entrada prioritaria)

- Constituye el punto de partida predeterminado para garantizar que ninguna mesa demore el comienzo de su juego.
- No se interpondrá ninguna pantalla emergente obligatoria, modal bloqueante ni formulario solicitando teléfono, email o contraseña antes de iniciar la partida.
- El flujo permanece ágil: QR $\rightarrow$ Código temporal $\rightarrow$ Sesión $\rightarrow$ Participantes temporales $\rightarrow$ Categoría $\rightarrow$ Partida.

### 8.2 Usuario Registrado (Identificación voluntaria y no bloqueante)

- En cualquier momento antes de iniciar la partida oficial, la persona que opera el dispositivo principal o los integrantes de la mesa podrán elegir voluntariamente identificarse.
- La identificación permite asociar el perfil del usuario a la sesión para:
  - Cargar participantes habituales o perfiles dependientes sin necesidad de tipear nuevamente sus nombres y rangos.
  - Habilitar la contribución de la partida a su escuela y curso verificados.
  - Registrar la partida en su historial personal y sumar progresión cuando esté activa.
- **Regla de oro:** El proceso de identificación nunca debe bloquear ni abortar la sesión de la mesa si el usuario se arrepiente, tarda o falla en autenticarse. Si la identificación no se concreta, la sesión continúa fluidamente en Modo Invitado.

---

## 9. Conversión de Invitado a Usuario Persistente

Para transformar jugadores ocasionales en miembros de la comunidad sin estorbar el inicio del juego, la plataforma ofrecerá el registro en los momentos lógicos de alta satisfacción:

```
[ Fin de Partida ] ──► [ Pantalla de Resultado ] ──► [ ¿Querés guardar tus logros? ]
                                                              │
                                      ┌───────────────────────┴───────────────────────┐
                                      ▼                                               ▼
                             [ Crear Cuenta Ahora ]                         [ Finalizar como Invitado ]
                                      │                                               │
                           • Ingresa Celular                              • El resultado queda en la sesión
                           • Acepta Términos/Privacidad                   • No se asocian puntos a cuentas
                           • Cuenta Creada                                • Mesa avanza a cierre
```

### 9.1 Reglas de Conversión Post-Partida

1. **Momento oportuno:** Se ofrecerá la creación de cuenta preferentemente en la pantalla de resultado final o tras obtener un premio o reconocimiento que motive la continuidad.
2. **Sin falsas promesas:** Nunca se afirmará al invitado que sus puntos grupales son automáticamente acumulables en efectivo o saldo si no existe previamente una cuenta activa y verificada.
3. **Reserva sobre migración de puntos:** La posibilidad de trasladar puntaje obtenido como invitado a una cuenta recién creada queda catalogada como **decisión futura**. No se prometerá ni aplicará migración directa de respuestas pasadas hasta que se apruebe la política antifraude correspondiente.
4. **Respeto a la decisión del invitado:** Si el cliente opta por rechazar la invitación a registrarse, el sistema no insistirá repetitivamente. La sesión finalizará con total normalidad.

---

## 10. Datos del Usuario Persistente y Minimización

Bajo el estándar de **minimización de datos**, Punto Burger solicita únicamente lo necesario para identificar funcionalmente la cuenta, resguardar a menores y posibilitar la dinámica comunitaria.

### 10.1 Atributos Obligatorios Funcionales

| Atributo | Justificación Funcional |
|---|---|
| **Nombre o Alias visible** | Identificador público para interacción en mesa, pantallas de resultado y rankings amigables. |
| **Número de Celular** | Identificador funcional unívoco de la cuenta y canal de verificación. |
| **Rango Etario** | Permite segmentar la dificultad lúdica y aplicar salvaguardas de minoridad. |
| **Aceptación de Términos** | Conformidad contractual obligatoria para el uso de la plataforma. |
| **Aceptación de Privacidad** | Consentimiento explícito obligatorio sobre tratamiento de datos mínimos. |

### 10.2 Atributos Opcionales

| Atributo | Propósito |
|---|---|
| **Apellido** | Para mayor personalización del perfil (nunca visible para menores). |
| **Avatar / Identificador visual** | Representación gráfica predefinida o seleccionable para personalizar el perfil. |
| **Usuario de Instagram** | Enlace voluntario a su perfil de red social para menciones comunitarias o eventos. |
| **Escuela** | Institución educativa con la que simpatiza o a la que asiste. |
| **Curso** | División específica dentro de la escuela para rankings inter-cursos. |
| **Preferencias de Categorías** | Selección de temáticas favoritas para optimizar las preguntas propuestas. |
| **Consentimiento de Ranking Público** | Autorización para figurar nominalmente en tablas públicas del local. |
| **Consentimiento de Marketing** | Autorización independiente para recibir novedades, promociones o beneficios. |

### 10.3 Datos Excluidos de Forma Estricta (No solicitados en el MVP)

- Documento Nacional de Identidad (DNI) o pasaporte.
- Domicilio real, dirección particular o código postal.
- Fecha exacta y completa de nacimiento (se sustituye por rangos etarios).
- Información financiera, números de tarjeta de crédito o cuentas bancarias.
- Datos sensibles sobre salud, religión, filiación política o datos biométricos.

---

## 11. El Número de Celular como Identificador Funcional

El número de teléfono móvil actúa como ancla de identidad operativa del ecosistema de Punto Burger:

```
[ Número de Celular ] ──(Verificación)──► [ Cuenta Única Activa ] ──► [ Beneficios y Puntos ]
```

### 11.1 Reglas del Celular

1. **Unicidad:** Un número de celular verificado solo puede pertenecer a **una única cuenta persistente activa** en un momento dado.
2. **Validación previa a beneficios sensibles:** La cuenta puede registrarse inicialmente en estado pendiente, pero no podrá canjear premios acumulativos ni transferir beneficios sin que el celular haya sido validado satisfactoriamente.
3. **Privacidad absoluta:** El número de celular jamás será exhibido en pantallas públicas, rankings, resultados de mesa ni tickets de clientes.
4. **Enmascaramiento ante el personal:** En el panel administrativo del personal operativo, el celular debe visualizarse siempre parcialmente enmascarado (ej: `+54 9 3496 ***-1234`) para proteger la privacidad del cliente.
5. **Cambio de número controlado:** Si el usuario desea cambiar su número de celular asociado, el sistema exigirá validar la posesión del nuevo número antes de aplicar la modificación en su cuenta.
6. **Alias no unívocos:** Dos usuarios pueden tener el mismo alias o nombre de pila (ej: "Juan"). La unicidad la resuelve el celular en conjunto con el identificador interno opaco.

---

## 12. Rangos Etarios y Niveles Educativos

Para evitar almacenar fechas de nacimiento completas de menores y adultos, la plataforma categoriza a los participantes mediante rangos funcionales orientados a la experiencia lúdica.

### 12.1 Clasificación Funcional Inicial

| Rango | Enfoque Lúdico y de Contenido | Requisito de Cuenta Persistente |
|---|---|---|
| **Niño** | Preguntas infantiles, lenguaje simple, temáticas visuales y escolares iniciales. | Exclusivamente mediante **Perfil Dependiente** administrado por adulto. |
| **Adolescente** | Preguntas de cultura pop, materias escolares intermedias, desafíos juveniles. | Sujeto a validación específica; por defecto perfil dependiente o cuenta guiada. |
| **Adulto** | Preguntas generales de dificultad estándar y avanzada en todas las categorías. | Habilitado para crear y gestionar su cuenta independiente y dependientes. |

### 12.2 Contexto Educativo

Cuando la partida o el usuario se vinculan a un contexto escolar, los rangos etarios se complementan con la clasificación académica:
- Nivel Primario (grados 1.º a 7.º).
- Nivel Secundario (años 1.º a 5.º / 6.º).
- Turno y división específica.

*Nota:* Los límites cronológicos exactos en años (ej: corte a los 13 o 18 años) se formalizarán en la especificación técnico-legal correspondiente.

---

## 13. Participación y Protección de Menores

Punto Burger asume un compromiso ético y operativo fundamental en el cuidado de los niños y adolescentes que visitan el local con sus familias o escuelas.

### 13.1 El Menor como Participante Temporal

- Cualquier menor puede jugar en una mesa sin necesidad de registrar cuenta ni aportar datos personales sensibles.
- Solo se le solicita un apodo o nombre de pila y su rango etario para calibrar las preguntas que recibirá su turno.
- No se le solicitará celular, email, redes sociales, domicilio ni fotos.

### 13.2 Cuentas Persistentes de Menores

- No se asume que un menor de edad pueda crear libre e independientemente una cuenta persistente con datos de contacto directos sin tutela.
- La vía funcional predeterminada y aprobada para que un menor acumule logros familiares es el **Perfil Dependiente**, creado y supervisado por una cuenta adulta responsable.
- Queda totalmente prohibido someter perfiles de menores a campañas de marketing directo automatizado.

---

## 14. Perfiles Dependientes Administrados por Adultos

Permite a los padres, tutores o adultos a cargo integrar a los miembros de la familia bajo su propia cuenta sin obligar a los menores a tener dispositivos propios, números de teléfono ni registros independientes.

```
                  ┌──────────────────────────────┐
                  │    CUENTA ADULTA TITULAR     │
                  │   (Celular verificado)       │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌──────────────────────────────┐                ┌──────────────────────────────┐
│      PERFIL DEPENDIENTE 1    │                │      PERFIL DEPENDIENTE 2    │
│ • Alias: "Sofi"              │                │ • Alias: "Mateo"             │
│ • Rango: Niño                │                │ • Rango: Adolescente         │
│ • Escuela: Normal Superior   │                │ • Escuela: Técnica N° 455    │
│ • Curso: 4° Grado B          │                │ • Curso: 2° Año A            │
│ • Sin celular propio         │                │ • Sin celular propio         │
└──────────────────────────────┘                └──────────────────────────────┘
```

### 14.1 Características del Perfil Dependiente

- **Datos contenidos:** Nombre o alias, rango etario, nivel educativo, escuela opcional, curso opcional y preferencias de preguntas.
- **Sin contacto propio:** No posee número de celular, contraseña, email ni acceso independiente.
- **Sin marketing:** No recibe comunicaciones comerciales ni consentimientos de marketing independientes.
- **Facultades del titular adulto:** El adulto puede dar de alta, modificar datos, desvincular, asociar a una escuela/curso o solicitar la eliminación del perfil dependiente en cualquier momento.
- **Uso en la partida:** Al sentarse en una mesa, el adulto identificado puede seleccionar qué perfiles dependientes participan en la partida para que el sistema precargue sus turnos de preguntas automáticamente.

---

## 15. Historial del Usuario Persistente

Todo usuario con cuenta activa podrá acceder a una bitácora exhaustiva y personal de sus experiencias de juego en el local.

### 15.1 Información Mostrada por Partida

Por cada partida vinculada, el historial exhibirá:
- **Fecha y hora** en que se disputó la partida.
- **Nombre del grupo o mesa** con el que jugó (ej: "Los Rayos de Esperanza").
- **Puntaje total obtenido** por la mesa.
- **Desglose de respuestas:** Cantidad de aciertos, respuestas incorrectas y preguntas sin responder.
- **Categoría temáticas:** Categoría seleccionada o indicación de "mezcladas".
- **Dificultad:** Niveles transitados en la partida (inicial, media, avanzada).
- **Posición alcanzada:** Puesto obtenido en el ranking diario de la fecha (si aplica).
- **Escuela y curso representados:** Institución a la que se aportó en esa partida específica.
- **Premio obtenido:** Reconocimiento o beneficio alcanzado (si aplica).
- **Estado del premio:** Pendiente de validación, Canjeado, Vencido o No elegible.
- **Contribución competitiva generada:** Valor numérico aportado al ranking del curso en esa partida.
- **Tipo de partida:** Oficial o Práctica.

### 15.2 Diferenciación Estricta de Partidas de Práctica

Las partidas de práctica disputadas dentro de la sesión aparecerán visualmente diferenciadas en el historial con una etiqueta distintiva (ej: `Modo Práctica`), dejando constancia expresa de que **no generan puntos competitivos escolares ni habilitan premios gastronómicos**.

---

## 16. Estadísticas Personales del Perfil

El panel del usuario persistente consolidará métricas agregadas que fomentan la superación lúdica sin invadir la privacidad:

- **Partidas oficiales jugadas:** Total histórico y desglose por temporada.
- **Mejor puntaje personal:** Puntaje más alto alcanzado en una partida oficial.
- **Puntaje promedio:** Rendimiento medio por partida.
- **Total de preguntas acertadas:** Volumen acumulado de respuestas correctas.
- **Porcentaje de efectividad:** Ratio de aciertos sobre el total de preguntas respondidas.
- **Categorías más jugadas:** Ranking personal de temáticas favoritas.
- **Categoría con mejor rendimiento:** Temática en la que el usuario obtiene mayor porcentaje de aciertos.
- **Premios obtenidos y canjes realizados:** Historial de recompensas gastronómicas efectivizadas.
- **Posición personal en ranking:** Lugar ocupado en la tabla individual (si aceptó visibilidad).
- **Temporadas disputadas:** Lista de ciclos competitivos en los que ha tenido participación activa.

---

## 17. Asociación de una Partida con Usuarios Persistentes

En Punto Burger, la mesa sigue jugando como un grupo indivisible. Sin embargo, para nutrir los historiales personales y calcular las contribuciones competitivas, los usuarios registrados presentes en la mesa pueden asociar su cuenta a la partida.

### 17.1 Reglas de Asociación

1. **No obligatoriedad:** Asociar cuentas persistentes a la partida es completamente voluntario. Una mesa puede jugar de punta a punta como invitados.
2. **Mesas mixtas permitidas:** Una misma partida puede incluir simultáneamente a participantes invitados y a usuarios registrados.
3. **Unicidad de asociación:** Cada usuario registrado puede asociarse **una sola vez** a una misma partida concreta.
4. **Inmutabilidad del puntaje:** Asociar uno o más usuarios a la mesa **no altera el puntaje grupal** de la partida. La partida conserva intacto su valor como resultado del equipo.
5. **Impacto en el historial:** La asociación permite incorporar la ficha de la partida al historial y a las estadísticas individuales de cada usuario vinculado.
6. **Sin cuentas automáticas:** El sistema jamás creará cuentas persistentes automáticas para los participantes temporales que hayan compartido la mesa con un usuario registrado.

---

## 18. Entidad Escuela y Gestión de Instituciones No Encontradas

Las escuelas constituyen los núcleos comunitarios del posicionamiento de Punto Burger en Esperanza y su región de influencia. Para evitar proliferación caótica, vandalismo o duplicación de datos, las escuelas son **entidades oficiales administradas**.

### 18.1 Estructura Funcional de la Escuela

| Atributo | Tipo | Descripción |
|---|---|---|
| **Identificador Interno** | Código opaco | Identificador del sistema (ej: `SCH-ESP-001`). |
| **Nombre Oficial** | Texto | Nombre institucional completo (ej: "Colegio San José"). |
| **Nombre Visible / Alias** | Texto | Nombre popular o abreviado reconocido por la comunidad. |
| **Localidad** | Texto | Ciudad donde radica (ej: "Esperanza, Santa Fe"). |
| **Niveles Educativos** | Lista | Inicial, Primario, Secundario, Terciario. |
| **Estado Operativo** | Estado | **Activa** (disponible para competir) o **Inactiva** (archivada/pausada). |
| **Cursos Asociados** | Colección | Lista de divisiones académicas habilitadas en la institución. |

### 18.2 Solicitud de Escuelas No Encontradas

```
[ Usuario busca escuela ] ──► [ No aparece en la lista ] ──► [ Solicitar incorporación ]
                                                                      │
                                                                      ▼
                                                      [ Solicitud: Pendiente de Revisión ]
                                                                      │
                                                ┌─────────────────────┴─────────────────────┐
                                                ▼                                           ▼
                                       [ Admin APRUEBA ]                           [ Admin RECHAZA ]
                                                │                                           │
                                       • Escuela se activa                         • Notificación de motivo
                                       • Usuario vinculado                         • Se sugiere escuela válida
```

1. **Solicitud guiada:** Si la escuela no figura en el listado desplegable, el usuario presiona *"Solicitar agregar mi escuela"* e ingresa nombre, localidad y nivel educativo aproximado.
2. **Estado Pendiente:** La solicitud se registra con estado **Pendiente de revisión**. No se publica de forma automática en el listado general para evitar vandalismo.
3. **Resolución administrativa:** El administrador puede aprobar la incorporación, asociarla a una escuela existente ya cargada con otra denominación o rechazarla fundadamente.

---

## 19. Cursos y Divisiones

Cada escuela administrada agrupa cursos específicos. La selección jerárquica evita errores de tipeo y fragmentación de los rankings.

### 19.1 Parámetros de un Curso

- **Nivel:** Primario, Secundario, etc.
- **Año:** 1.º, 2.º, 3.º, 4.º, 5.º, 6.º, 7.º.
- **División:** A, B, C, Única (opcional según el colegio).
- **Turno:** Mañana, Tarde, Noche, Completo (opcional).
- **Ciclo Lectivo / Temporada:** Año calendario de la cohorte activa (ej: 2027).

### 19.2 Regla de Selección Estructurada

Cuando los cursos de una escuela están cargados en el sistema, los usuarios deben seleccionar su división desde opciones predefinidas. No se admitirá texto libre como método principal de asignación de curso para garantizar la consistencia de los rankings escolares.

---

## 20. Asociación Escolar y Representación en Competencias

La vinculación de un usuario persistente o de un perfil dependiente con una escuela es una manifestación voluntaria de identidad y pertenencia.

### 20.1 Ciclo de Vida de la Asociación Escolar

| Estado | Significado Funcional |
|---|---|
| **Sin asociación** | La cuenta no está vinculada a ninguna escuela. Juega sin aportar a ranking escolar. |
| **Pendiente** | El usuario declaró una institución/curso; pendiente de validación o sujeta a cupo. |
| **Verificada** | Vinculación confirmada. Toda partida oficial válida suma al puntaje de la escuela/curso. |
| **Rechazada** | Declaración desestimada por inconsistencia, falsedad o resolución administrativa. |
| **Vencida** | Finalizó el ciclo lectivo anual o la temporada de competencia; requiere renovación. |

### 20.2 Condiciones para Generar Contribución Escolar

Una partida genera contribución competitiva para un curso y escuela únicamente cuando:
- Es una **partida oficial** completada en su totalidad (10 preguntas).
- La partida no fue invalidada administrativamente por infracción.
- Al menos un participante asociado posee una asociación escolar con estado **Verificada**.
- La partida cumple con las reglas de elegibilidad del período competitivo vigente.

---

## 21. Sistema de Competencia Escolar y Regla de Equidad

### 21.1 Problemática del Sesgo por Volumen

Si el ranking escolar se basara en la acumulación lineal ilimitada de todos los puntos de todas las partidas jugadas, se generaría una distorsión manifiesta:
- Ganarían siempre los colegios más numerosos o los cursos con alumnos que visitan el bar múltiples veces por semana, independientemente de su destreza en la trivia.
- Los cursos pequeños o con menor frecuencia de salida quedarían automáticamente marginados de la competencia.

### 21.2 Regla Funcional Inicial: Mejor Partida Personal por Período

Para garantizar una **competencia justa y equilibrada**:

$$\text{Durante cada período competitivo (temporada), cada usuario aporta ÚNICAMENTE su MEJOR puntaje oficial válido.}$$

- Si un alumno juega 10 partidas en el mes obteniendo distintos puntajes, el sistema tomará **únicamente su puntaje más alto** como su contribución individual al curso.
- Esto estimula a volver a jugar para *superar la propia marca*, sin penalizar al compañero que solo pudo asistir una vez en el mes.

### 21.3 Cálculo del Ranking por Curso y Umbral Mínimo

El puntaje competitivo de un curso en un período se calcula siguiendo cuatro pasos:

1. **Identificación:** Se identifican todos los usuarios persistentes verificados pertenecientes a ese curso que hayan jugado al menos una partida oficial en el período.
2. **Selección de máximos:** Se toma la mejor partida oficial válida de cada uno de esos usuarios durante la temporada.
3. **Cálculo del promedio:** Se calcula la media aritmética de esas mejores puntuaciones individuales.
4. **Umbral mínimo de participantes:** Para ingresar oficialmente a la tabla de clasificación, el curso debe alcanzar una cantidad mínima de participantes únicos registrados.
   - **Mínimo sugerido de referencia:** **5 usuarios únicos**.
   - **Clasificación provisional:** Si el curso tiene entre 1 y 4 participantes únicos, su puntaje se calcula pero figura con el estado `Clasificación provisional` hasta completar el cupo mínimo.

*Nota:* El cupo mínimo y la ponderación son parámetros configurables administrativamente y podrán calibrarse sin modificar los historiales originales de partidas.

### 21.4 Ejemplo Numérico Detallado (Curso 1.º A)

Supongamos el curso **1.º Año División A** durante la Temporada Apertura 2027:

| Alumno Verificado | Partidas Jugadas en la Temporada | Puntajes Obtenidos | Mejor Partida Computable |
|---|---|---|---|
| **Ana** | 4 partidas | 980, 1.150, 1.300, 1.220 | **1.300** |
| **Juan** | 1 partida | 1.050 | **1.050** |
| **Pedro** | 3 partidas | 1.200, 1.400, 1.350 | **1.400** |
| **Sofía** | 2 partidas | 1.100, 1.200 | **1.200** |
| **Lucas** | 5 partidas | 850, 950, 1.000, 1.150, 1.100 | **1.150** |

**Cálculo del Puntaje Competitivo del Curso:**

$$\text{Puntaje del Curso} = \frac{1.300 + 1.050 + 1.400 + 1.200 + 1.150}{5} = \frac{6.100}{5} = \mathbf{1.220\text{ puntos competitivos}}$$

- El curso cuenta con 5 participantes únicos $\rightarrow$ Cumple el umbral $\rightarrow$ **Estado Oficial Confirmado**.
- Ninguna partida grupal original vio alterado su puntaje de mesa.

### 21.5 Cálculo del Ranking por Escuela

Para evitar que una escuela gane simplemente por poseer mayor cantidad de divisiones o turnos, la escuela compite a partir del rendimiento de sus cursos:

1. Cada curso de la escuela genera su puntaje competitivo oficial según las reglas de la sección 21.3.
2. La escuela obtiene su puntaje competitivo a partir del **promedio de sus cursos elegibles** (aquellos que han alcanzado el estado oficial de clasificación).
3. Este modelo nivela la competencia entre colegios técnicos de gran matrícula y colegios más reducidos de la comunidad.

### 21.6 Competencia Interna dentro de una Misma Escuela

Una de las dinámicas comunitarias más enriquecedoras de Punto Burger es el enfrentamiento amistoso entre cursos del mismo colegio:
- **1.º A vs 1.º B**
- **2.º A vs 2.º B**
- **Ciclo Básico vs Ciclo Orientado**

La plataforma dispondrá de dos vistas jerárquicas:
- **Ranking Interno de Escuela:** Tabla comparativa que mide exclusivamente a las divisiones de una misma institución entre sí.
- **Ranking General Intercolegial:** Tabla madre que enfrenta a todos los cursos y escuelas de la región.

---

## 22. Rankings Disponibles y Periodicidad

La plataforma soportará cuatro dimensiones competitivas y múltiples horizontes temporales:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MATRIZ DE RANKINGS                               │
├─────────────────┬───────────────────────────────────────────────────────────┤
│ DIMENSIÓN       │ DESCRIPCIÓN Y UNIDAD                                      │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ 1. INDIVIDUAL   │ Solo usuarios registrados que otorgaron consentimiento.   │
│ 2. CURSO        │ Competencia entre divisiones (inter-escuelas e interna).  │
│ 3. ESCUELA      │ Competencia general entre establecimientos educativos.    │
│ 4. GRUPO / MESA │ Mejores partidas grupales del día o la semana en el bar.  │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

### Horizontes Temporales de Consulta

- **Diario:** Para celebrar a los mejores grupos y jugadores de la noche.
- **Semanal:** Ideal para promociones y desafíos de fin de semana.
- **Mensual:** Medición intermedia de regularidad en el local.
- **Temporada:** La competencia formal intercolegial con premiación acumulada.
- **Histórico:** Salón de la fama con los récords absolutos desde la apertura de Punto Burger.

*Nota:* No es mandatorio desplegar todas las combinaciones en el primer prototipo; el diseño conceptual queda establecido.

---

## 23. Sistema de Temporadas Competitivas

La competencia escolar se organiza por ciclos delimitados en el tiempo denominados **Temporadas** (ej: *Temporada Verano 2027*, *Apertura 2027*, *Copa Punto Burger Intercolegial*).

```
[ Próxima ] ──► [ Activa ] ──► [ Finalizada ] (Resultados congelados e históricos)
                      │
                      ▼
                [ Cancelada ] (Excepcional)
```

### 23.1 Atributos de una Temporada

- **Nombre identificatorio:** Denominación visible pública (ej: "Liga Escolar Apertura 2027").
- **Fecha y hora de inicio:** Momento en que las partidas oficiales comienzan a sumar para el ciclo.
- **Fecha y hora de finalización:** Límite cronológico de cómputo competitivo.
- **Estado operativo:** `Próxima`, `Activa`, `Finalizada`, `Cancelada`.
- **Reglas y umbrales aplicables:** Cupo mínimo de participantes por curso y fórmulas vigentes.
- **Rankings asociados:** Tablas de curso, escuela e individual correspondientes al certamen.

### 23.2 Cierre de Temporada y Congelamiento de Resultados

Al cumplirse la fecha de cierre de una temporada:
1. **Congelamiento instantáneo:** El cómputo de posiciones queda estricta e irrevocablemente congelado. No ingresa ninguna nueva contribución a ese ciclo.
2. **Proclamación de ganadores:** Se consolidan las posiciones finales del podio de escuelas y cursos.
3. **Reinicio competitivo limpio:** La nueva temporada subsiguiente comienza con puntajes en cero para todos los cursos.
4. **Preservación histórica inmutable:** **Jamás se borrarán los resultados de una temporada finalizada**. Todo el historial permanece consultable para siempre en el archivo del sistema.

---

## 24. Perfiles Públicos Protegidos: Curso y Escuela

Para estimular la identidad escolar sin comprometer la seguridad física ni digital de los estudiantes:

### 24.1 Perfil Público de Curso

Vista orientada a la comunidad que muestra:
- Escuela de pertenencia y nombre del curso (ej: "Colegio San José — 4.º Año B").
- Temporada en disputa.
- Posición actual en el ranking interno y general.
- Puntaje competitivo acumulado.
- Cantidad de participantes únicos elegibles que integran el promedio.
- Gráfico o indicador de evolución de puestos en las últimas semanas.
- Mejores puntajes grupales agregados alcanzados por la división.
- **Salvaguarda absoluta:** **No se exhibirán listados nominales de los alumnos integrantes del curso**.

### 24.2 Perfil Público de Escuela

Vista institucional que exhibe:
- Nombre oficial y localidad del colegio.
- Lista de cursos participantes en la temporada activa.
- Posición general en la tabla de colegios.
- Puntaje competitivo escolar ponderado.
- Historial de temporadas disputadas y campeonatos obtenidos.
- **Límite conceptual:** No incluye muros de comentarios, foros ni herramientas de red social.

---

## 25. Integridad Competitiva, Reglas Antifraude y Cambios de Curso

Para garantizar que la competencia sea genuina y representativa:

### 25.1 Reglas de Integridad

1. **Una sola contribución por partida:** Una partida oficial solo puede computar una única vez.
2. **Partidas de práctica excluidas:** Los modos de práctica no impactan en ninguna tabla escolar.
3. **No simultaneidad escolar:** Un mismo usuario no puede aportar puntajes simultáneamente a dos cursos o colegios distintos durante una misma temporada activa.
4. **Exclusión de cuentas sancionadas:** Cuentas con estado *Suspendida* o *Bloqueada* quedan excluidas del cálculo del promedio del curso.
5. **Auditoría inmutable:** Toda anulación de partida o descalificación por trampa queda registrada con marca temporal y operador interviniente, sin borrar el registro de auditoría.

### 25.2 Restricción de Cambio de Curso en Temporada Activa

- Por defecto, un usuario verificado **no puede cambiarse libremente de curso ni de escuela** mientras transcurre una temporada competitiva.
- Las rectificaciones solo procederán por:
  - Error involuntario manifiesto en el registro inicial (dentro del período de gracia).
  - Corrección administrativa documentada por el equipo de Punto Burger.
- Cualquier modificación manual efectuada por el administrador debe dejar constancia del motivo para evitar sospechas de favoritismo o alteración maliciosa de promedios.

### 25.3 Invitados en Partidas Escolares

- Un jugador que participa en Modo Invitado puede integrar una mesa escolar sin inconvenientes.
- La partida es válida para el grupo y para la mesa.
- Sin embargo, la contribución individual del invitado no se computará en el promedio del curso hasta tanto decida registrar una cuenta verificada con asociación escolar válida.

---

## 26. Difusión en Pantallas del Local y Experiencia Motivacional

### 26.1 Difusión en Pantallas Físicas de Punto Burger

Las pantallas del bar exhibirán dinámicamente:
- Curso líder de la semana en Esperanza.
- Escuela en primer puesto de la temporada.
- Top 5 de divisiones más competitivas.
- Anuncios de "Nuevo puntero en la Liga Escolar".
- Desafíos lúdicos entre cursos rivales.

### 26.2 Enfoque Motivacional y Positivo (Cero Humillación)

- Toda comunicación en pantallas y en la aplicación mantendrá un tono positivo, amigable y celebratorio.
- **Prohibición expresa de humillación:** Jamás se mostrarán cursos en "último lugar", ni listas de "peores puntajes", ni advertencias descalificatorias.
- Si un curso tiene una puntuación modesta, el sistema destacará sus aciertos, su entusiasmo o su participación familiar, fomentando siempre las ganas de volver y superarse.

---

## 27. Rankings y Privacidad de Datos

La competencia pública debe armonizarse de forma estricta con la legislación y las buenas prácticas de resguardo de datos:

### 27.1 Elementos Visibles en Rankings Públicos

- Alias del jugador o Nombre de fantasía del grupo.
- Nombre abreviado de la Escuela.
- Curso y división (ej: "5.º Naturales").
- Puntaje total obtenido y cantidad de aciertos.
- Puesto o posición relativa en el ranking correspondiente.

### 27.2 Datos Estrictamente Confidenciales (Jamás públicos)

- Números de teléfono móvil (ni completos ni enmascarados).
- Apellidos completos de menores de edad.
- Cuentas de Instagram o redes sociales de los participantes.
- Correos electrónicos de contacto.
- Identidad del adulto responsable a cargo.
- Identificadores internos opacos del sistema.

### 27.3 Derecho de Exclusión del Ranking Individual

Todo usuario registrado tiene derecho funcional a desactivar su visibilidad en el ranking público individual desde su configuración de privacidad. Mantendrá su cuenta activa y sus beneficios, figurando en tablas como *"Jugador Anónimo"* u omitiéndose su fila.

---

## 28. Gestión Modular de Consentimientos

Punto Burger no aplica casillas de verificación compuestas. Los consentimientos son independientes, transparentes y configurables:

```
                                  [ CONSENTIMIENTOS ]
                                           │
                 ┌─────────────────────────┴─────────────────────────┐
                 ▼                                                   ▼
       [ OBLIGATORIOS DE CUENTA ]                           [ OPCIONALES MODULARES ]
                 │                                                   │
        • Términos y Condiciones                            • Marketing y Promociones
        • Política de Privacidad                            • Visibilidad en Rankings
                 │                                          • Asociación Escolar Pública
                 ▼                                          • Mención en Redes Sociales
         (Indispensables para                                        │
           operar la cuenta)                                         ▼
                                                             (Activables y revocables
                                                              en cualquier momento)
```

### 28.1 Consentimientos Obligatorios para Cuenta Persistente

1. **Aceptación de Términos del Servicio:** Reglas de convivencia y prohibición de fraude.
2. **Aceptación de la Política de Privacidad:** Autorización para procesar datos mínimos indispensables.

### 28.2 Consentimientos Opcionales y Desacoplados

1. **Comunicaciones de Marketing:** Ofertas gastronómicas del bar.
2. **Ranking Público Personal:** Publicación de alias en pantallas.
3. **Mención en Redes Sociales:** Mención voluntaria de Instagram ante logros o premios especiales.
4. **Personalización Lúdica:** Recomendaciones basadas en categorías jugadas.

### 28.3 Auditoría de Consentimientos

Cada alta o revocación registrará: ID de cuenta, tipo de consentimiento, estado (Otorgado/Revocado), versión legal aceptada, fecha/hora y origen.

---

## 29. Consentimiento de Marketing y Comunicaciones Promocionales

1. **Voluntariedad:** Jamás se condiciona jugar, registrarse, sumar puntos o canjear premios a la aceptación de marketing publicitario.
2. **Revocabilidad libre:** El usuario puede apagar la casilla de marketing desde su perfil en cualquier momento sin penalizaciones ni pérdida de puntos.
3. **Instagram no equivale a Marketing:** Declarar un handle de Instagram no autoriza envíos publicitarios directos.
4. **Protección a menores:** Prohibido incorporar perfiles de menores a difusiones publicitarias directas.

---

## 30. El Perfil Persistente y Límites Sociales (No Red Social)

El perfil en Punto Burger es un centro personal de fidelización y juego:
- **Contiene:** Mis Datos, Mi Escuela/Curso, Perfiles Dependientes, Billetera de Puntos y Premios, Mis Estadísticas e Historial.
- **Excluye terminantemente:** Muros públicos, comentarios abiertos, chats privados entre mesas, seguidores o subida de fotografías libres.

---

## 31. Estados de Cuenta

| Estado | Descripción | Operaciones Permitidas | Operaciones Restringidas |
|---|---|---|---|
| **Pendiente de Validación** | Cuenta creada; celular aún no verificado. | Jugar, ver resultado, navegar perfil personal. | Canjear premios diferidos, transferir saldo, administrar escuela. |
| **Activa** | Cuenta plenamente operativa y verificada. | Todas las funciones vigentes de juego, puntos, escuela y premios. | Ninguna. |
| **Suspendida** | Restricción temporal por observación o anomalía. | Iniciar sesión en modo consulta de estado. | Jugar partidas oficiales, canjear premios, sumar a rankings. |
| **Bloqueada** | Restricción por fraude confirmado o abuso grave. | Ninguna. Acceso bloqueado en la plataforma. | Todas las operaciones bloqueadas de forma indefinida. |
| **Eliminación Solicitada** | El usuario pidió cerrar su cuenta; en período de gracia. | Cancelar la solicitud de eliminación y reactivar. | Nuevos canjes o participación en rankings escolares. |
| **Eliminada** | Cuenta dada de baja definitiva. Datos disociados. | Ninguna. Cuenta extinta. | Identidad inoperativa y no recuperable directamente. |

---

## 32. Suspensión, Bloqueo y Auditoría Administrativa

- **Causales:** Abuso de premios, automatización de respuestas (bots), cuentas fraudulentas o alteración de representatividad escolar.
- **Garantías de auditoría:** Toda acción asienta ID de cuenta, causal, justificación, operador interviniente y fecha/hora. El historial no se borra.

---

## 33. Tratamiento de Cuentas Duplicadas

1. **Regla de oro:** Un número de celular verificado respalda **una sola cuenta activa**.
2. **Reintentos con mismo celular:** Redirigen a iniciar sesión o recuperar acceso; no crean cuenta paralela.
3. **Alias idénticos:** Se admiten (homónimos); el celular garantiza la distinción unívoca.

---

## 34. Recuperación de Acceso a la Cuenta

- **Ordinaria (con celular):** Ingreso del número, recepción de validación, confirmación de identidad y restauración completa de historial, puntos y escuela.
- **Excepcional (sin celular previo):** Requiere trámite asistido presencial o soporte administrativo oficial para evitar usurpaciones de identidad.

---

## 35. Modificación y Eliminación de Información

- El usuario puede editar libremente alias, datos opcionales y consentimientos.
- Ante solicitud de eliminación: los datos personales directos se suprimen o disocian irreversiblemente; las partidas históricas y estadísticas de escuela se conservan anonimizadas de forma agregada.

---

## 36. Relación entre Canjes de Premios y Cuentas

- **Premio Inmediato (de sesión):** Canjeable por grupos invitados o registrados en la misma visita física (flujo F de PPA-004).
- **Premio Diferido (futuro/acumulativo):** Requiere cuenta persistente Activa para acreditarse en la billetera personal y canjearse en fechas posteriores.

---

## 37. Roles Internos y Principio de Mínimo Privilegio

- **Cliente:** Administra su perfil, dependientes y consentimientos.
- **Personal:** Atiende mesas, incidencias operativas y valida canjes presenciales (celular enmascarado).
- **Administrador:** Gestiona temporadas, escuelas, cursos, preguntas y suspensiones por fraude.
- **Propietario:** Acceso a métricas ejecutivas globales, configuraciones de negocio y habilitación de administradores.

---

## 38. Administración de Temporadas y Competencia

El administrador dispondrá conceptualmente de facultades para:
- Crear nuevas temporadas escolares estipulando fechas y umbrales.
- Declarar el inicio oficial de un certamen.
- Finalizar temporadas y congelar los resultados de los podios.
- Consultar las tablas de cómputo y los desgloses de promedios de cada curso.
- Rectificar asociaciones escolares erróneas y atender disputas de identidad.
- Invalidar partidas fraudulentas asentando el motivo en auditoría.
- Gestionar y fusionar el catálogo de escuelas y cursos de la localidad.

---

## 39. Historial Competitivo Histórico

El sistema preservará indefinidamente el cuadro de honor de cada certamen:

**Ejemplo Documental: Temporada Apertura 2027**

| Puesto | Escuela | Puntaje Competitivo Escolar | Estado Final |
|---|---|---|---|
| **1.º** | Colegio San José | **1.284 puntos** | Campeón Oficial |
| **2.º** | Escuela Técnica N.º 455 | **1.260 puntos** | Subcampeón |
| **3.º** | Escuela Normal Superior N.º 30 | **1.218 puntos** | 3.º Puesto |

- La siguiente temporada comienza desde cero en su tabla regular, pero este archivo histórico permanece consultable por los clientes en cualquier momento.

---

## 40. Flujos Funcionales Detallados

- **Flujo A — Invitado:** QR $\rightarrow$ Código temporal $\rightarrow$ Sesión $\rightarrow$ Alias y rangos $\rightarrow$ Partida $\rightarrow$ Resultado. Cero barreras.
- **Flujo B — Conversión Post-Partida:** Resultado grupal $\rightarrow$ Invitación a registrar logros $\rightarrow$ Celular y alias $\rightarrow$ Aceptación modular $\rightarrow$ Cuenta Activa.
- **Flujo C — Identificación de Usuario Existente:** Sesión abierta $\rightarrow$ Identificación opcional por celular $\rightarrow$ Precarga de dependientes $\rightarrow$ Si cancela, vuelve a Modo Invitado sin cerrar sesión.
- **Flujo D — Adulto Administrando Dependiente:** Cuenta adulta $\rightarrow$ Alta de hijo/tutelado (alias y rango) $\rightarrow$ Inclusión en mesa $\rightarrow$ Calibración de preguntas infantiles.
- **Flujo E — Solicitud de Escuela:** Escuela no hallada $\rightarrow$ Solicitud guiada $\rightarrow$ Estado Pendiente $\rightarrow$ Aprobación admin $\rightarrow$ Activación oficial.
- **Flujo F — Retiro de Marketing:** Perfil $\rightarrow$ Desmarca marketing $\rightarrow$ Guardar $\rightarrow$ Cesa publicidad sin perder puntos ni antigüedad.
- **Flujo G — Recuperación de Acceso:** Celular ingresado $\rightarrow$ Validación del canal $\rightarrow$ Identidad restablecida y sesiones viejas cerradas.
- **Flujo H — Solicitud de Eliminación:** Perfil $\rightarrow$ Confirmación informada $\rightarrow$ Baja de cuenta $\rightarrow$ Anonimización y conservación agregada.
- **Flujo I — Suspensión Administrativa:** Detección de trampa $\rightarrow$ Admin aplica sanción con motivo $\rightarrow$ Cuenta suspendida e invalidación de partida en curso.

---

## 41. Casos Límite y Comportamientos Esperados

| # | Caso Límite | Comportamiento Esperado del Sistema |
|---|---|---|
| **1** | Invitado termina una partida y quiere guardar puntos. | El sistema ofrece crear cuenta en el resultado. Se informa amablemente que la cuenta registrará sus logros de futuras visitas (la migración de puntos pasados queda como decisión futura). |
| **2** | Invitado no quiere registrarse tras jugar. | Se respeta su decisión de inmediato sin reiterar modales. La mesa se libera con normalidad. |
| **3** | Usuario intenta registrarse con celular ya existente. | Se le informa que el número ya posee cuenta y se le ofrece iniciar sesión o recuperar acceso. No se duplica la cuenta. |
| **4** | Usuario no tiene acceso al celular anterior para recuperar cuenta. | Se deriva a recuperación excepcional asistida con el personal administrativo; no hay recuperación desatendida por seguridad. |
| **5** | Menor intenta crear cuenta persistente independiente. | La plataforma no permite el alta autónoma a menores; se ofrece la alternativa del Perfil Dependiente tutelado por un adulto. |
| **6** | Adulto crea dos dependientes iguales en su cuenta. | El sistema emite advertencia de posible duplicidad involuntaria. Si se confirma, se asigna diferenciador interno. |
| **7** | Escuela no aparece en el listado desplegable. | Se ofrece el enlace "Solicitar agregar mi escuela". La solicitud queda registrada como Pendiente de revisión sin bloquear la partida. |
| **8** | Escuela ingresada figura duplicada con ligeras variantes. | El administrador ejecuta la herramienta de fusión en el panel administrativo, unificando ambas bajo el nombre oficial y consolidando puntos. |
| **9** | Usuario se asocia por error a un curso equivocado. | Se permite la rectificación dentro de un período de gracia inmediato tras la selección. Pasado ese tiempo, requiere solicitud administrativa. |
| **10** | Usuario solicita cambio de escuela en medio de una temporada activa. | Queda restringido para evitar manipulación del ranking escolar. Requiere justificación que evalúa el administrador. |
| **11** | Asociación escolar rechazada luego de partidas jugadas. | Las partidas ya jugadas son válidas para el local, pero los puntos escolares aportados se anulan o reasignan según resolución del caso. |
| **12** | Un invitado ocasional juega integrado en un grupo escolar. | Es válido. El grupo compite bajo el nombre del curso; los integrantes no registrados participan como participantes temporales sin impedimento. |
| **13** | Usuario no quiere figurar en el ranking público. | Puede desactivar la visibilidad desde su perfil; en las pantallas públicas su puntaje aparecerá como "Jugador Anónimo". |
| **14** | Usuario retira el consentimiento de marketing. | La casilla se desmarca, cesan los envíos comerciales y la cuenta permanece activa sin sufrir penalizaciones en puntos o nivel. |
| **15** | Usuario elimina su cuenta de Instagram del perfil. | El campo se borra; el usuario conserva intactos todos sus derechos de juego y fidelización. |
| **16** | Cuenta suspendida intenta canjear un premio en el bar. | El sistema rechaza el canje informando inhabilitación preventiva e invita a dirigirse al personal. |
| **17** | Cuenta bloqueada intenta identificarse en una mesa. | La identificación es rechazada. La mesa puede continuar jugando sin problema pasando a Modo Invitado. |
| **18** | Usuario solicita eliminación con premios pendientes. | Se advierte expresamente que la confirmación de la baja implica la pérdida definitiva e inmediata de los beneficios pendientes. |
| **19** | Personal intenta consultar información personal innecesaria. | La interfaz del personal no expone datos sensibles (teléfonos completos, redes, perfiles familiares) cumpliendo con el mínimo privilegio. |
| **20** | Cuenta eliminada intenta recuperarse. | No se permite reactivación de una cuenta extinta; el usuario deberá registrarse desde cero como cuenta nueva. |
| **21** | Dos participantes temporales usan el mismo nombre en la mesa. | El sistema lo admite, distinguiéndolos visualmente (ej: "Juan 1" y "Juan 2") para la asignación de turnos. |
| **22** | Persona juega como invitado teniendo cuenta activa. | Es totalmente válido. No se exige identificarse si el usuario prefiere jugar de incógnito o rápidamente. |
| **23** | Proceso de identificación falla pero la sesión de mesa está abierta. | La sesión de mesa jamás se interrumpe ni se cierra. Se cancela solo la identificación del usuario y el juego prosigue en Modo Invitado. |

---

## 42. Métricas Conceptuales de Identidad y Competencia

- Porcentaje de partidas en Modo Invitado vs Modo Registrado.
- Tasa de conversión de invitados a usuarios post-partida.
- Total de cuentas persistentes activas y volumen con celular verificado.
- Distribución de perfiles dependientes registrados por familias.
- Cantidad de cursos y escuelas oficialmente clasificados por temporada.
- Cursos en estado de Clasificación provisional vs Oficial.
- Tasa de solicitudes y altas de nuevas escuelas en la región.
- Índice de retención de consentimientos de marketing.
- Incidencias de suspensiones, duplicados o invalidaciones por temporada.

---

## 43. Decisiones Aprobadas

- ✅ **Marca oficial:** Se ratifica como nombre oficial único **`Punto Burger`** en todo el ecosistema.
- ✅ **Experiencia autoservicio:** Acceso y dinámica lúdica sin intervención manual obligatoria del personal.
- ✅ **Invitados plenos:** El modo invitado permite jugar siempre sin cuenta ni autenticación.
- ✅ **Separación conceptual de identidades:** Participante temporal, Invitado y Usuario persistente son conceptos independientes.
- ✅ **Tres dimensiones de puntaje:** Se separan formalmente el Puntaje de partida, la Progresión personal y la Contribución competitiva.
- ✅ **Historial de usuario:** Los usuarios persistentes cuentan con bitácora completa de partidas y estadísticas personales entre visitas.
- ✅ **Asociación no intrusiva:** Las partidas grupales pueden asociarse a usuarios registrados sin alterar el puntaje del equipo.
- ✅ **Competencia inter-cursos e inter-escuelas:** Estructura oficial de torneos comunitarios.
- ✅ **Equidad competitiva:** La demografía o volumen de alumnos no define al ganador; se computa la **mejor partida por usuario** en el período.
- ✅ **Promedio de curso con cupo mínimo:** El ranking de curso utiliza un promedio de mejores marcas y requiere al menos 5 usuarios únicos para salir de la clasificación provisional.
- ✅ **Promedio de cursos para escuelas:** El ranking de escuela se calcula como el promedio de sus cursos elegibles.
- ✅ **Sistema de Temporadas:** La competencia opera en ciclos delimitados; los resultados históricos se congelan y jamás se borran.
- ✅ **Minimización de datos y menores:** Exclusión de DNI, domicilio y fecha exacta; menores participan como perfiles dependientes tutelados.
- ✅ **Número de celular como ancla funcional:** Un celular verificado equivale a una cuenta activa; enmascaramiento estricto ante el personal.
- ✅ **Consentimientos modulares:** Términos y privacidad obligatorios; marketing y rankings opcionales y revocables sin perjuicio de beneficios.
- ✅ **Perfil sin red social:** Prohibidos los muros, chats, seguidores y fotografías libres.
- ✅ **Mínimo privilegio funcional:** El personal solo accede a lo operativo; administradores operan temporadas y supervisión.

---

## 44. Decisiones Futuras (Diferidas)

| Decisión Pendiente | Razón del Diferimiento |
|---|---|
| **Método técnico de validación del celular** (SMS, WhatsApp, llamadas) | Depende de la selección de proveedores de telecomunicaciones y costos. |
| **Tecnología de autenticación y gestión de sesiones** | Depende de la especificación de arquitectura backend. |
| **Fórmula matemática definitiva de progresión personal y niveles** | Pertenece a la futura especificación de Fidelización y Gamificación. |
| **Límites cronológicos exactos en años de los rangos etarios** | Requiere coordinación con la auditoría legal de menores. |
| **Términos y condiciones jurídicos definitivos** | Requiere redacción por profesionales legales matriculados. |
| **Política de migración de puntos de invitado a cuenta nueva** | Requiere modelado antifraude y reglas de recompensas. |
| **Premios específicos para cursos y escuelas ganadoras** | Requiere acuerdos comerciales y definición presupuestaria de Punto Burger. |
| **Reglas de torneos eliminatorios o duelos directos** | Evaluables para fases evolutivas de temporadas especiales. |
| **Duración exacta y calendario de temporadas del año** | Se fijará operativamente antes del lanzamiento público. |
| **Diseño visual definitivo (UI/UX) de los perfiles y pantallas del bar** | Pertenece a la fase de diseño de interfaces. |

---

## 45. Criterios de Aceptación Actualizados

PPA-006 se considerará formalmente aprobado cuando se verifique que:

- [x] Jugar una partida normal no exige crear una cuenta de usuario bajo ninguna circunstancia.
- [x] Jugar una partida no requiere la intervención del personal del local.
- [x] Quedan definidos y diferenciados con precisión el participante temporal, el invitado y el usuario persistente.
- [x] Se diferencian conceptualmente el puntaje de partida, la progresión personal y la contribución competitiva.
- [x] El usuario persistente dispone de historial y estadísticas entre visitas.
- [x] Una partida puede asociarse a usuarios persistentes sin alterar su puntaje grupal original.
- [x] Se documenta la propuesta de conversión a usuario después de la partida sin fricción previa.
- [x] Se aplican datos mínimos funcionales y se excluyen DNI, domicilio y fecha de nacimiento exacta.
- [x] El número de celular actúa como identificador funcional principal garantizando una cuenta activa por línea.
- [x] Los menores de edad cuentan con salvaguarda funcional mediante el modelo de perfil dependiente tutelado por un adulto.
- [x] Las escuelas y cursos son entidades administradas que no pueden crearse libremente por texto descontrolado.
- [x] Existen rankings por curso y por escuela con regla de equidad que mitiga la ventaja por cantidad de alumnos.
- [x] El ranking por curso promedia las mejores partidas personales y exige un cupo mínimo de participantes para la clasificación oficial.
- [x] El ranking por escuela promedia los resultados de sus cursos elegibles.
- [x] Se contempla la competencia interna entre cursos de un mismo colegio.
- [x] Se define el ciclo de vida de las temporadas y la preservación inmutable de los resultados históricos.
- [x] Se protegen los datos de menores en perfiles públicos de cursos y escuelas sin publicar listados nominales.
- [x] El consentimiento de marketing es voluntario, modular y revocable sin afectar el estado de la cuenta ni sus puntos.
- [x] Se definen con claridad los seis estados de cuenta posibles y sus transiciones.
- [x] Se documentan los 9 flujos funcionales completos (A–I) y los 23 casos límite con comportamiento esperado.
- [x] No se creó código fuente ni modelos de base de datos.
- [x] No se seleccionaron tecnologías ni proveedores de autenticación.
- [x] No se formularon conclusiones legales o jurídicas definitivas.
