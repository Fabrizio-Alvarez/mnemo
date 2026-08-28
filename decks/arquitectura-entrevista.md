---
deck: Arquitectura DDD — Entrevista
tags: [ddd, hexagonal, arquitectura]
fuente: Guía de estudio Laravel+Vue (proyecto Supermercado DDD)
---

## ¿Qué es DDD?
Domain-Driven Design. Organiza el código alrededor del dominio (reglas de negocio), separándolo del framework.

## ¿Cuáles son las capas en DDD?
Domain (reglas, PHP puro), Application (casos de uso), Infrastructure (DB, adaptadores), Presentation (controllers).

## ¿Qué es un aggregate root?
La entrada única a un cluster de objetos. Protege invariantes. En el proyecto Supermercado, `Venta` es el aggregate root de `LineaDeVenta`.

## ¿Qué es un value object?
Objeto inmutable identificado por sus valores. `Dinero(150, "ARS")`. No tiene ID. Auto-validante.

## ¿Por qué Dinero usa centavos (int)?
Float tiene error de precisión (0.1 + 0.2 != 0.3). Con enteros en centavos, los cálculos siempre son exactos.

## ¿Qué son ports y adapters?
Ports = interfaces del dominio. Adapters = implementaciones concretas. Permite cambiar la infraestructura sin tocar el dominio.

## ¿Cuál es la regla de dependencias?
Siempre hacia adentro. Domain no depende de nadie. Infrastructure depende de Domain (implementa interfaces).

## ¿Por qué el dominio no usa Eloquent?
Para mantenerlo puro y portable. Si el dominio depende de Eloquent, no se puede testear sin DB ni cambiar de ORM.

## ¿Qué es un evento de dominio?
Algo que pasó en el dominio (ej: CompraRealizada). El aggregate lo graba; los listeners reaccionan. Desacopla.

## ¿Cómo testeo el dominio sin DB?
Las clases de dominio son PHP puro. En los tests Unit, instancias los objetos directamente (`new Venta(...)`) sin necesidad de base de datos.

## ¿Qué es el lenguaje ubicuo (ubiquitous language)?
El vocabulario compartido entre expertos y código: los mismos términos en la conversación, las clases y los tests. En Supermercado: "carrito" y `Carrito`, nunca "order".

### porque
Si el experto dice "carrito" y el código dice `OrderController`, cada charla requiere traducción y las reglas se pierden en la mudanza. Cuando el negocio afina un término, el código lo sigue con un rename: ese refactor del lenguaje es modelar.

## ¿Qué es un Bounded Context?
Un límite explícito donde un modelo y su lenguaje son consistentes. En Supermercado: `Producto` de Catálogo (precio, descripción) es distinto de `Producto` de Stock (cantidad por depósito).

### porque
Un mismo término del negocio cambia de significado según el área. Buscar "el modelo único de toda la empresa" termina en un blob donde cada cambio de un área rompe a las demás.

## ¿Un módulo interno equivale a un Bounded Context?
No. El módulo es una división de código dentro de un mismo modelo (`App\Domain\Stock`); el Bounded Context implica modelo y lenguaje propios, y a veces su propia base de datos y deploy.

### porque
Criterio: ¿los términos significan lo mismo y cambian por las mismas razones? Si sí, un módulo alcanza. Error clásico: creer que unas carpetas dan aislamiento de modelo, o partir en microservicios lo que era un solo contexto.

## ¿Qué es el context mapping?
El mapa de relaciones entre bounded contexts: quién es upstream o downstream de quién, y qué patrón gobierna cada frontera (ACL, shared kernel, customer/supplier, conformist).

### porque
Entre contexts siempre hay integraciones; si no se explicitan queda acoplamiento implícito: un equipo cambia su contrato y rompe al vecino sin que nadie haya decidido esa dependencia.

## ¿Qué es una capa anticorrupción (ACL)?
Un traductor en la frontera que convierte el modelo externo al tuyo: `OrderDTO` del ERP entra y sale tu `Venta`, y las rarezas del sistema viejo mueren ahí.

### porque
Sin ACL el modelo del externo se filtra al dominio (sus IDs, sus estados, sus nombres) y terminás modelando el legacy en vez de tu negocio. Tiene costo de mantenimiento: se justifica cuando el externo es malo o incontrolable.

## ¿Qué es un Shared Kernel y cuál es su riesgo?
Una porción de modelo compartida por dos contexts, típicamente value objects (`Dinero` usado por Catálogo y Ventas). El riesgo: modificarla obliga a coordinar a ambos equipos.

### porque
Compartir acelera al inicio pero acopla decisiones y calendarios de deploy. Por eso se mantiene mínimo (value objects, nunca aggregates) y con dueño explícito.

## ¿Cuándo modelás como Entity y cuándo como Value Object?
Value Object si el valor lo define todo y no cambia (`Dinero(150, "ARS")`); Entity si necesita una identidad que persiste aunque cambien sus datos (la venta #42 sigue siendo esa venta con otras líneas).

### porque
Pregunta clave: ¿dos instancias con los mismos datos son intercambiables? Error clásico: darle ID a todo "por las dudas": perdés inmutabilidad e igualdad por valor, y aparecen dos `Dinero` iguales con identidades distintas.

## ¿Qué pasa si una regla de negocio cruza dos agregados?
No se fuerza en una transacción: un agregado es dueño de la regla y el resto se actualiza por eventos de dominio con consistencia eventual (`Venta` emite `VentaRegistrada` y Stock descuenta aparte).

### porque
Una transacción ACID sobre dos agregados recrea el problema que el agregado resuelve: locks, contención y un root que crece hasta ser todo el sistema. Regla práctica: una transacción, un agregado; lo demás, eventual.

## ¿Repository o DAO?
El repository habla del dominio: una colección de agregados (`$ventas->add($venta)`, `ofCliente()`); el DAO habla de la base: métodos centrados en tablas y columnas, del lado de infraestructura.

### porque
Criterio: ¿la interfaz usa el lenguaje del negocio o del storage? Error clásico: un "repository" con `findByEstadoAndFechaJoinLineas()` y 30 métodos más: es un DAO con nombre elegante que crece con cada caso de uso.

## ¿Cuándo un repository es sobreingeniería?
Cuando el caso de uso es CRUD puro sin reglas que proteger ni proyecciones raras: usar el ORM directo desde el application service hace el mismo trabajo con menos archivos.

### porque
El patrón se paga con interfaz, implementación y mapeo. Si no hay lógica de dominio que blindar, la indirección solo agrega burocracia; cuando aparece la regla, refactorás hacia el repository.

## ¿Domain service o Application service?
El domain service contiene una regla de negocio que no cabe en una entity (`CalculadorDeDescuentos`, PHP puro); el application service solo orquesta: transacción, repos, eventos, sin decidir nada del negocio.

### porque
Criterio: ¿la operación sabe algo del negocio o solo coordina piezas? Error clásico: `if`s de negocio en el application service — el dominio se vacía y probar una regla exige bootear la aplicación entera.

## ¿Devolvés un DTO o el aggregate desde el controller?
Un DTO plano con contrato explícito. El aggregate no cruza la frontera de presentación: exponerlo permite mutarlo por fuera de sus métodos y acopla la API a su estructura interna.

### porque
Con el aggregate serializado, renamear un método o propiedad rompe consumidores externos, y las relaciones lazy explotan fuera del contexto de DB. El DTO congela la forma; el dominio queda libre de evolucionar.

## ¿Puerto primario o secundario?
Primario: por donde el mundo entra a tu app (la interfaz del caso de uso que el controller invoca). Secundario: lo que tu app consume hacia afuera (`RepositorioDeVentas`, `PasarelaDePago`), implementado por infraestructura.

### porque
El primario conduce el flujo hacia adentro; el secundario es conducido por el dominio. Error clásico: modelar el puerto secundario con la forma de la herramienta (firmas estilo Eloquent) en vez de con la necesidad del dominio.

## ¿Qué resuelve un command bus?
Desacoplar el disparador del ejecutor: el controller hace `bus->dispatch(new RegistrarVentaCommand(...))` y un handler lo procesa sin que ninguno conozca al otro.

### porque
Permite colgar comportamiento transversal (validación, transacciones, cola) en el pipeline sin tocar los casos de uso. Costo: una indirección más; en apps chicas, llamar al service directo es más navegable.

## ¿Qué es CQRS y cuándo NO conviene?
Separar la escritura (commands sobre agregados) de la lectura (queries a proyecciones). No conviene si no hay asimetría real entre leer y escribir: pagás dos modelos más sincronización por nada.

### porque
Brilla cuando las lecturas quieren otra forma que los agregados (reportes, feeds). Error clásico: adoptarlo "para escalar" un CRUD: mantener proyecciones consistentes cuesta más que el cuello de botella que querías resolver.

## ¿Qué es event sourcing y qué precio tiene?
Guardar la secuencia de eventos (`VentaRegistrada`, `DescuentoAplicado`) como fuente de verdad y reconstruir el estado replayeándolos, en lugar de persistir el estado final.

### porque
Da auditoría y viajes en el tiempo ("¿qué stock había el 3 de marzo?") casi gratis. El precio: versionar eventos, snapshots para no replayear millones, y un debugging donde "el estado actual" ya no es una tabla que mirar.

## ¿Qué es una saga (process manager)?
Un coordinador de una transacción distribuida: cada paso local emite un evento, la saga escucha y dispara el siguiente, con acciones de compensación si algo falla (pago rechazado → liberar stock reservado).

### porque
Sin ACID global, algo debe recordar en qué paso va la operación y qué deshacer. Error clásico: encadenar servicios con llamadas síncronas sin compensación: el primer timeout deja estados huérfanos que nadie revierte.

## ¿Modular monolith o microservicios?
Modular monolith: un solo deploy con módulos por bounded context y fronteras duras (sin compartir modelo ni tablas). Microservicios, cuando los contexts escalan o despliegan a ritmos genuinamente distintos.

### porque
Criterio: ¿necesitás despliegue y escalado independientes, o solo organización? Saltar a microservicios sin fronteras ni madurez operativa produce el distributed monolith: el mismo acoplamiento, pero atravesando la red.

## ¿Cómo detectás un distributed monolith?
Servicios separados que se deployan y se rompen juntos: un cambio en Producto exige actualizar Stock, Ventas y frontend en orden, y nada funciona sin el resto levantado.

### porque
Es peor que el monolito: pagás latencia, red y ops distribuidas conservando el acoplamiento total. Señal temprana: levantar un servicio en local te obliga a levantar casi todos los demás.

## ¿Qué es vertical slice architecture?
Cortar el código por feature de punta a punta (`AgregarAlCarrito`: controller, use case y query viven juntos) en vez de por capas técnicas globales, con el dominio compartido en el centro.

### porque
Un cambio de feature toca una sola parte en vez de cinco carpetas. Error clásico: slices anémicos que solo pasan HTTP a la DB (smart UI disfrazada): la regla de negocio sigue teniendo que vivir en el dominio.
