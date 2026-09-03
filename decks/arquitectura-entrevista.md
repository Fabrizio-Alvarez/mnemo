---
deck: Arquitectura DDD — Entrevista
tags: [ddd, hexagonal, arquitectura]
fuente: Guía de estudio Laravel+Vue (proyecto Supermercado DDD)
---

## ¿Qué es DDD?
Domain-Driven Design. Organiza el código alrededor del dominio (reglas de negocio), separándolo del framework.

### distractores
- Una arquitectura en capas donde el framework orquesta y el dominio responde a sus llamados.
- Una metodología de gestión donde el negocio define alcance y plazos del equipo técnico.
- Un enfoque database-first: el esquema de tablas define las entidades del negocio.

## ¿Cuáles son las capas en DDD?
Domain (reglas, PHP puro), Application (casos de uso), Infrastructure (DB, adaptadores), Presentation (controllers).

### distractores
- Modelo, Vista y Controlador: la separación clásica de MVC.
- Dominio, Persistencia y Testing: las tres carpetas del patrón repository.
- Http, Console y Jobs: la estructura de carpetas que impone el framework.

## ¿Qué es un aggregate root?
La entrada única a un cluster de objetos. Protege invariantes. En el proyecto Supermercado, `Venta` es el aggregate root de `LineaDeVenta`.

### distractores
- Cualquier entidad con ID propio que se persiste en su propia tabla.
- La tabla padre de una relación one-to-many en la base de datos.
- La clase base de una jerarquía de herencia entre entidades del mismo contexto.

## ¿Qué es un value object?
Objeto inmutable identificado por sus valores. `Dinero(150, "ARS")`. No tiene ID. Auto-validante.

### distractores
- Una entidad liviana con ID autogenerado para persistirla más rápido.
- Un DTO sin lógica: solo getters y setters para transportar datos.
- Un objeto mutable que se compara por identidad, no por sus valores.

## ¿Por qué Dinero usa centavos (int)?
Float tiene error de precisión (0.1 + 0.2 != 0.3). Con enteros en centavos, los cálculos siempre son exactos.

### distractores
- Porque int ocupa menos espacio y consulta más rápido en la base de datos.
- Porque con `round()` al final de cada operación el float queda exacto.
- Porque las pasarelas de pago exigen montos enteros en centavos.

## ¿Qué son ports y adapters?
Ports = interfaces del dominio. Adapters = implementaciones concretas. Permite cambiar la infraestructura sin tocar el dominio.

### distractores
- Ports son los endpoints HTTP y adapters los controllers que los atienden.
- Ports son las implementaciones concretas y adapters las interfaces abstractas.
- Un patrón para adaptar el dominio a la base: el modelo sigue la forma de las tablas.

## ¿Cuál es la regla de dependencias?
Siempre hacia adentro. Domain no depende de nadie. Infrastructure depende de Domain (implementa interfaces).

### distractores
- Hacia afuera: el dominio importa la infraestructura para saber cómo persistirse.
- Circular: cada capa puede llamar a la otra vía inyección de dependencias.
- Domain implementa las interfaces que define Infrastructure.

## ¿Por qué el dominio no usa Eloquent?
Para mantenerlo puro y portable. Si el dominio depende de Eloquent, no se puede testear sin DB ni cambiar de ORM.

### distractores
- Porque Eloquent es más lento que el Query Builder y frena los tests.
- Porque Eloquent no soporta transacciones ni relaciones complejas.
- Se puede usar en el dominio mientras los tests corran sobre SQLite en memoria.

## ¿Qué es un evento de dominio?
Algo que pasó en el dominio (ej: CompraRealizada). El aggregate lo graba; los listeners reaccionan. Desacopla.

### distractores
- Un comando que ordena ejecutar una acción: `PasarACajaCommand`.
- Un listener que observa cambios en tablas y dispara jobs desde la base.
- Un registro de auditoría que guarda quién modificó cada entidad y cuándo.

## ¿Cómo testeo el dominio sin DB?
Las clases de dominio son PHP puro. En los tests Unit, instancias los objetos directamente (`new Venta(...)`) sin necesidad de base de datos.

### distractores
- Mockeando todos los modelos Eloquent con PHPUnit para simular la base.
- Corriendo los tests contra una SQLite en memoria con RefreshDatabase.
- Levantando el container y resolviendo las clases con `app()` en cada test.

## ¿Qué es el lenguaje ubicuo (ubiquitous language)?
El vocabulario compartido entre expertos y código: los mismos términos en la conversación, las clases y los tests. En Supermercado: "carrito" y `Carrito`, nunca "order".

### porque
Si el experto dice "carrito" y el código dice `OrderController`, cada charla requiere traducción y las reglas se pierden en la mudanza. Cuando el negocio afina un término, el código lo sigue con un rename: ese refactor del lenguaje es modelar.

### distractores
- El vocabulario técnico del framework: nombrar las clases como las nombra Laravel.
- Un idioma puente en inglés para que el código sea igual en todos los proyectos.
- La documentación de API que publica cada equipo para sus consumidores.

## ¿Qué es un Bounded Context?
Un límite explícito donde un modelo y su lenguaje son consistentes. En Supermercado: `Producto` de Catálogo (precio, descripción) es distinto de `Producto` de Stock (cantidad por depósito).

### porque
Un mismo término del negocio cambia de significado según el área. Buscar "el modelo único de toda la empresa" termina en un blob donde cada cambio de un área rompe a las demás.

### distractores
- Una división de carpetas dentro de un mismo modelo, como `App\Domain\Stock`.
- El borde físico de un microservicio: cada contexto exige su propio deploy.
- El modelo único de la empresa, compartido por todas las áreas para no duplicar.

## ¿Un módulo interno equivale a un Bounded Context?
No. El módulo es una división de código dentro de un mismo modelo (`App\Domain\Stock`); el Bounded Context implica modelo y lenguaje propios, y a veces su propia base de datos y deploy.

### porque
Criterio: ¿los términos significan lo mismo y cambian por las mismas razones? Si sí, un módulo alcanza. Error clásico: creer que unas carpetas dan aislamiento de modelo, o partir en microservicios lo que era un solo contexto.

### distractores
- Sí: separar en carpetas ya da aislamiento de modelo y lenguaje propio.
- Sí, siempre que cada módulo tenga sus propias tablas y migraciones.
- No: el Bounded Context es solo un namespace; el modelo sigue siendo uno compartido.

## ¿Qué es el context mapping?
El mapa de relaciones entre bounded contexts: quién es upstream o downstream de quién, y qué patrón gobierna cada frontera (ACL, shared kernel, customer/supplier, conformist).

### porque
Entre contexts siempre hay integraciones; si no se explicitan queda acoplamiento implícito: un equipo cambia su contrato y rompe al vecino sin que nadie haya decidido esa dependencia.

### distractores
- Un diagrama de clases que muestra herencia entre entidades de cada contexto.
- La técnica de dividir un contexto grande en módulos internos más chicos.
- El mapeo objeto-relacional entre las tablas de los distintos contexts.

## ¿Qué es una capa anticorrupción (ACL)?
Un traductor en la frontera que convierte el modelo externo al tuyo: `OrderDTO` del ERP entra y sale tu `Venta`, y las rarezas del sistema viejo mueren ahí.

### porque
Sin ACL el modelo del externo se filtra al dominio (sus IDs, sus estados, sus nombres) y terminás modelando el legacy en vez de tu negocio. Tiene costo de mantenimiento: se justifica cuando el externo es malo o incontrolable.

### distractores
- Un firewall que bloquea las requests inválidas antes de que lleguen al dominio.
- Una capa que expone tu modelo interno tal cual al externo para no perder datos.
- Validación de payloads: sanitizear lo que llega del ERP antes de persistirlo.

## ¿Qué es un Shared Kernel y cuál es su riesgo?
Una porción de modelo compartida por dos contexts, típicamente value objects (`Dinero` usado por Catálogo y Ventas). El riesgo: modificarla obliga a coordinar a ambos equipos.

### porque
Compartir acelera al inicio pero acopla decisiones y calendarios de deploy. Por eso se mantiene mínimo (value objects, nunca aggregates) y con dueño explícito.

### distractores
- Compartir todo el modelo entre contexts para no duplicar código.
- Una biblioteca común de utilidades (fechas, strings, helpers) entre equipos.
- La base de datos central que todos los contexts consultan en solo lectura.

## ¿Cuándo modelás como Entity y cuándo como Value Object?
Value Object si el valor lo define todo y no cambia (`Dinero(150, "ARS")`); Entity si necesita una identidad que persiste aunque cambien sus datos (la venta #42 sigue siendo esa venta con otras líneas).

### porque
Pregunta clave: ¿dos instancias con los mismos datos son intercambiables? Error clásico: darle ID a todo "por las dudas": perdés inmutabilidad e igualdad por valor, y aparecen dos `Dinero` iguales con identidades distintas.

### distractores
- Entity siempre: todo objeto con datos merece un ID por las dudas.
- Value Object si se persiste; entity si solo se usa en memoria.
- Entity si es inmutable y comparable por valor; value object si muta en el tiempo.

## ¿Qué pasa si una regla de negocio cruza dos agregados?
No se fuerza en una transacción: un agregado es dueño de la regla y el resto se actualiza por eventos de dominio con consistencia eventual (`Venta` emite `VentaRegistrada` y Stock descuenta aparte).

### porque
Una transacción ACID sobre dos agregados recrea el problema que el agregado resuelve: locks, contención y un root que crece hasta ser todo el sistema. Regla práctica: una transacción, un agregado; lo demás, eventual.

### distractores
- Una transacción ACID global que lockea ambos agregados hasta validar la regla.
- Mover la regla al application service, que ve los dos agregados y decide.
- Fusionar los dos agregados en un root más grande que contenga la regla.

## ¿Repository o DAO?
El repository habla del dominio: una colección de agregados (`$ventas->add($venta)`, `ofCliente()`); el DAO habla de la base: métodos centrados en tablas y columnas, del lado de infraestructura.

### porque
Criterio: ¿la interfaz usa el lenguaje del negocio o del storage? Error clásico: un "repository" con `findByEstadoAndFechaJoinLineas()` y 30 métodos más: es un DAO con nombre elegante que crece con cada caso de uso.

### distractores
- Son sinónimos: solo cambia el nombre según el lenguaje o el framework.
- El DAO habla del negocio y el repository consulta tablas y columnas.
- El repository es el DAO con cache y paginación incluidos de fábrica.

## ¿Cuándo un repository es sobreingeniería?
Cuando el caso de uso es CRUD puro sin reglas que proteger ni proyecciones raras: usar el ORM directo desde el application service hace el mismo trabajo con menos archivos.

### porque
El patrón se paga con interfaz, implementación y mapeo. Si no hay lógica de dominio que blindar, la indirección solo agrega burocracia; cuando aparece la regla, refactorás hacia el repository.

### distractores
- Nunca: sin repository el dominio queda acoplado a Eloquent para siempre.
- Cuando tiene demasiados métodos: se divide en varios repositories más chicos.
- Cuando no hay tests: el repository solo sirve para mockear en los unit tests.

## ¿Domain service o Application service?
El domain service contiene una regla de negocio que no cabe en una entity (`CalculadorDeDescuentos`, PHP puro); el application service solo orquesta: transacción, repos, eventos, sin decidir nada del negocio.

### porque
Criterio: ¿la operación sabe algo del negocio o solo coordina piezas? Error clásico: `if`s de negocio en el application service — el dominio se vacía y probar una regla exige bootear la aplicación entera.

### distractores
- El domain service orquesta repos y transacciones; el application calcula descuentos.
- Son intercambiables: ambos coordinan el caso de uso desde Application.
- El domain service accede a la base; el application service solo valida la request.

## ¿Devolvés un DTO o el aggregate desde el controller?
Un DTO plano con contrato explícito. El aggregate no cruza la frontera de presentación: exponerlo permite mutarlo por fuera de sus métodos y acopla la API a su estructura interna.

### porque
Con el aggregate serializado, renamear un método o propiedad rompe consumidores externos, y las relaciones lazy explotan fuera del contexto de DB. El DTO congela la forma; el dominio queda libre de evolucionar.

### distractores
- El aggregate: así el frontend ve el modelo real y no una copia desincronizada.
- El aggregate con `$hidden` bien configurado para ocultar campos internos.
- Da igual: el ORM termina serializando ambos al mismo JSON.

## ¿Puerto primario o secundario?
Primario: por donde el mundo entra a tu app (la interfaz del caso de uso que el controller invoca). Secundario: lo que tu app consume hacia afuera (`RepositorioDeVentas`, `PasarelaDePago`), implementado por infraestructura.

### porque
El primario conduce el flujo hacia adentro; el secundario es conducido por el dominio. Error clásico: modelar el puerto secundario con la forma de la herramienta (firmas estilo Eloquent) en vez de con la necesidad del dominio.

### distractores
- Primario consume servicios externos; secundario expone la app al mundo.
- Primario es el puerto principal de la base; secundarios, los de cola y cache.
- Ambos son interfaces de infraestructura: cambia cuál se inyecta según el caso.

## ¿Qué resuelve un command bus?
Desacoplar el disparador del ejecutor: el controller hace `bus->dispatch(new RegistrarVentaCommand(...))` y un handler lo procesa sin que ninguno conozca al otro.

### porque
Permite colgar comportamiento transversal (validación, transacciones, cola) en el pipeline sin tocar los casos de uso. Costo: una indirección más; en apps chicas, llamar al service directo es más navegable.

### distractores
- Ejecutar comandos de Artisan desde el controller sin bootear la aplicación.
- Validar y autorizar cada request antes de que llegue al dominio.
- Encolar todo en background para que la API responda más rápido.

## ¿Qué es CQRS y cuándo NO conviene?
Separar la escritura (commands sobre agregados) de la lectura (queries a proyecciones). No conviene si no hay asimetría real entre leer y escribir: pagás dos modelos más sincronización por nada.

### porque
Brilla cuando las lecturas quieren otra forma que los agregados (reportes, feeds). Error clásico: adoptarlo "para escalar" un CRUD: mantener proyecciones consistentes cuesta más que el cuello de botella que querías resolver.

### distractores
- Conviene siempre: leer y escribir por caminos separados escala más, seas CRUD o no.
- Es lo mismo que event sourcing: separar commands de queries ya persiste eventos.
- Solo conviene con dos bases de datos físicas: una para escribir y otra para leer.

## ¿Qué es event sourcing y qué precio tiene?
Guardar la secuencia de eventos (`VentaRegistrada`, `DescuentoAplicado`) como fuente de verdad y reconstruir el estado replayeándolos, en lugar de persistir el estado final.

### porque
Da auditoría y viajes en el tiempo ("¿qué stock había el 3 de marzo?") casi gratis. El precio: versionar eventos, snapshots para no replayear millones, y un debugging donde "el estado actual" ya no es una tabla que mirar.

### distractores
- Guardar el estado final más un log de auditoría para reconstruir si hace falta.
- Es lo mismo que CQRS: proyectar los commands en vistas de lectura.
- Publicar eventos de integración entre microservicios vía message broker.

## ¿Qué es una saga (process manager)?
Un coordinador de una transacción distribuida: cada paso local emite un evento, la saga escucha y dispara el siguiente, con acciones de compensación si algo falla (pago rechazado → liberar stock reservado).

### porque
Sin ACID global, algo debe recordar en qué paso va la operación y qué deshacer. Error clásico: encadenar servicios con llamadas síncronas sin compensación: el primer timeout deja estados huérfanos que nadie revierte.

### distractores
- Una transacción 2PC que lockea todos los servicios hasta el commit global.
- Encadenar llamadas síncronas: cada servicio llama al siguiente con rollback en cascada.
- Un job en cola que reintenta el paso fallido hasta que todos completen.

## ¿Modular monolith o microservicios?
Modular monolith: un solo deploy con módulos por bounded context y fronteras duras (sin compartir modelo ni tablas). Microservicios, cuando los contexts escalan o despliegan a ritmos genuinamente distintos.

### porque
Criterio: ¿necesitás despliegue y escalado independientes, o solo organización? Saltar a microservicios sin fronteras ni madurez operativa produce el distributed monolith: el mismo acoplamiento, pero atravesando la red.

### distractores
- Microservicios desde el inicio: cada context merece su deploy desde el día uno.
- Modular monolith es un monolito en capas: controllers, services y models en carpetas.
- Da igual: empezar en monolito y partir a microservicios después sale gratis.

## ¿Cómo detectás un distributed monolith?
Servicios separados que se deployan y se rompen juntos: un cambio en Producto exige actualizar Stock, Ventas y frontend en orden, y nada funciona sin el resto levantado.

### porque
Es peor que el monolito: pagás latencia, red y ops distribuidas conservando el acoplamiento total. Señal temprana: levantar un servicio en local te obliga a levantar casi todos los demás.

### distractores
- Cuando la cantidad de servicios pasa de diez: a esa escala, todos quedan acoplados.
- Cuando la latencia de red entre servicios supera los 100 ms por llamada.
- Cuando los servicios viven en un monorepo: un solo repo implica un solo deploy.

## ¿Qué es vertical slice architecture?
Cortar el código por feature de punta a punta (`AgregarAlCarrito`: controller, use case y query viven juntos) en vez de por capas técnicas globales, con el dominio compartido en el centro.

### porque
Un cambio de feature toca una sola parte en vez de cinco carpetas. Error clásico: slices anémicos que solo pasan HTTP a la DB (smart UI disfrazada): la regla de negocio sigue teniendo que vivir en el dominio.

### distractores
- Organizar por capas técnicas globales: una carpeta de controllers, una de services, una de repos.
- Una slice por entidad de la base: `Productos`, `Ventas`, `Clientes` de punta a punta.
- Cada slice es un microservicio con su propio deploy y base de datos.
