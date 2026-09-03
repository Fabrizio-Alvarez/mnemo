---
deck: Diseño OO y Patrones — Entrevista
tags: [oop, solid, patrones, diseño]
fuente: Generado con prompts/generar-mazo.md
---

## ¿Qué problema resuelve el encapsulamiento?
Ocultar el estado interno y exponer solo comportamiento. El objeto protege sus invariantes: nadie puede dejarlo en un estado inválido desde afuera.

### porque
Sin encapsulamiento, cualquiera modifica campos sueltos y el estado inválido se vuelve posible. Con ella, toda mutación pasa por un método que puede validar. Es la diferencia entre "datos + funciones que los tocan" y un objeto que se defiende solo.

### distractores
- Esconder la complejidad y mostrar al usuario solo una interfaz simple y minimal.
- Marcar los atributos como private y exponerlos con getters/setters: el dato queda protegido.
- Asegurar acceso thread-safe al estado: que dos hilos no lo corrompan.

## ¿Qué elimina el polimorfismo?
El `switch`/`if` sobre el tipo. Llamás el mismo método y cada clase hace lo suyo — el caller no conoce ni le importa la clase concreta.

### porque
Cada `if (tipo == X)` nuevo es un lugar que olvidás actualizar al agregar un tipo. Con polimorfismo, agregar un tipo nuevo = agregar una clase: el código existente no se toca (Open/Closed en acción).

### distractores
- Toda la lógica condicional: con polimorfismo también desaparecen los if de negocio.
- La duplicación: las subclases heredan una implementación común y no repiten código.
- La herencia: con polimorfismo alcanza con interfaces y las clases dejan de extender un padre común.

## ¿Composición vs herencia?
Composición: un objeto TIENE otro y delega. Herencia: un objeto ES otro y hereda todo. Regla práctica: composición por defecto, herencia solo para jerarquías "es-un" genuinas y estables.

### porque
La herencia es el acoplamiento más fuerte de OOP: heredás todo, incluso lo que no querés, y los cambios en el padre rompen los hijos. La composición delega solo lo que necesitás y se cambia en runtime. El error clásico: heredar para REUTILIZAR código (Stack extends ArrayList) en vez de modelar un "es-un" real.

### distractores
- Herencia para reutilizar código entre clases parecidas; composición solo si no hay relación "es-un".
- Son intercambiables: la composición es la herencia resuelta en runtime y el resto es sintaxis.
- Herencia por defecto por ser más directa, y composición solo cuando necesitarías herencia múltiple.

## ¿Qué es una clase anémica?
Objetos que solo tienen propiedades públicas y getters/setters, sin comportamiento — la lógica vive afuera en services que manipulan esos datos.

### porque
Rompe el encapsulamiento: las reglas del objeto están dispersas en services que cualquiera llama en otro orden. Un modelo rico pone la regla donde vive el dato (`cliente.debe(monto)` en vez de `saldo = saldo - monto` en el service). Excepción honesta: DTOs e inputs son anémicos a propósito — no tienen reglas que proteger.

### distractores
- Clases utilitarias sin estado, con solo métodos estáticos: comportamiento sin datos.
- Cualquier modelo que use DTOs para transportar datos entre capas.
- Una clase con un único método público: tan chica que no justifica objeto.

## ¿Qué significa "programar contra una abstracción"?
Depender de interfaces/contratos, no de clases concretas. El high-level define qué necesita; el low-level lo implementa.

### porque
Depender de una concreción te casa con ella: cambiarla implica tocar todo caller. Si el constructor pide `Notificador` (interface), el test pasa un fake y la app pasa el SMTP real — mismo código, dos mundos. Es el DIP de SOLID y la base de la inyección de dependencias.

### distractores
- Depender de clases abstractas en vez de interfaces: lo que importa es la palabra `abstract`.
- Que el low-level defina la interfaz y el high-level la implemente: la abstracción va abajo.
- Usar el tipo más genérico posible (`Object`/`any`) en las firmas para no acoplarse a nada.

## ¿Qué viola el Principio de Sustitución de Liskov?
Un hijo que no puede usarse donde se espera el padre. Clásico: `Cuadrado extends Rectangulo` cuyo `setAlto` también cambia el ancho.

### porque
El contrato del padre dice "alto y ancho son independientes"; el cuadrado lo rompe. El caller que razona según el contrato se rompe en runtime. LSP no es sobre sintaxis sino sobre semántica: si el hijo sorprende al que usa el padre, la jerarquía está mal aunque compile.

### distractores
- Que el hijo redefina un método con otra implementación: si el override cambia el comportamiento, ya viola.
- Fallas de firma: métodos con otros parámetros o atributos privados que no se heredan.
- Que el hijo agregue métodos que el padre no define, desbalanceando la interfaz.

## ¿Qué es una "razón para cambiar" en SRP?
Un actor/grupo de interés que pide cambios: el mismo motivo de negocio. Una clase debe tener uno solo.

### porque
Si Contabilidad y Marketing piden cambios a la misma clase, un cambio de uno puede romper al otro. SRP no es "una clase = un método": es alinear clases con actores, para que cambios de un actor no toquen código que otro actor depende.

### distractores
- Una responsabilidad técnica o método: una clase con un único método público cumple SRP.
- Un tipo de cambio de código: bug, refactor y feature cuentan como tres razones distintas.
- Cada commit que toca la clase: si dos cambios distintos la editaron, ya viola.

## ¿Qué habilita la inyección de dependencias?
Que la clase reciba sus dependencias desde afuera (constructor) en vez de crearlas adentro (`new`).

### porque
Con `new` adentro no hay forma de cambiar la implementación ni de testear. Inyectada, el test pasa un double y la app pasa la real — la clase no sabe la diferencia. DI no es un framework: es simplemente pasar lo que necesitás por parámetro.

### distractores
- Que un framework gestione todo: sin contenedor de DI no hay inyección real.
- Un service locator: la clase pide sus dependencias a un registro central cuando las necesita.
- Hacer opcionales las dependencias: la clase arranca sin ellas y las crea on demand.

## ¿Cuándo usar Strategy?
Cuando un algoritmo/comportamiento varía por caso y crece con if/else encadenados sobre el mismo dato. Cada variante se vuelve una clase con la misma interface.

### porque
El `if/else` sobre "tipo de descuento" crece en cada variante nueva y se duplica en cada lugar que calcula. Strategy convierte cada rama en una clase: agregar variante = clase nueva, el resto intacto. Cuándo NO: 2 variantes estables — una estrategia por un solo if es sobre-ingeniería.

### distractores
- Cuando el comportamiento cambia solo según el estado interno del objeto y sus transiciones.
- Cuando querés fijar el esqueleto de un algoritmo y que las subclases rellenen los pasos.
- Ante cualquier if: toda condición es una estrategia esperando salir.

## ¿Qué desacopla el patrón Observer?
Emisor y receptores: el emisor notifica un evento sin saber quiénes ni cuántos escuchan.

### porque
La alternativa es que el emisor llame a cada interesado — cada listener nuevo exige tocar el emisor. Con Observer, listeners se registran solos. Cuidado: el flujo se vuelve difícil de seguir (¿quién reaccionó a este evento?) — usarlo para efectos secundarios, no para el flujo principal del caso de uso.

### distractores
- El orden de ejecución: los listeners corren en el orden en que se registraron.
- El flujo principal del caso de uso: cada paso se suscribe al evento del paso anterior.
- La sincronización: emisor y listeners corren en hilos separados sin bloquearse.

## ¿Decorator vs herencia para agregar comportamiento?
Decorator envuelve al objeto con la misma interface y le suma algo antes/después de delegar. La herencia suma comportamiento compilando una nueva clase fija.

### porque
Herencia apila: `CafeConLecheConAzucelDoble` — explosión de combinaciones, cada una una clase. Decorator compone en runtime: `new Azucar(new Leche(new Cafe()))` — combinaciones infinitas con 3 clases. Mismo contrato, capas apilables: la clave es que el decorator ES lo que decora.

### distractores
- El decorator modifica la interfaz del objeto para exponer las capacidades nuevas que le suma.
- La herencia combina en runtime eligiendo el padre: por eso escala mejor que envolver.
- El decorator no necesita interfaz común: envuelve cualquier objeto y le agrega métodos.

## ¿Cuándo aporta Factory Method?
Cuando crear el objeto requiere decidir (qué subclase, configuración, lookup) y esa decisión no le corresponde al caller.

### porque
Si el caller hace `new Concreta()`, conoce y repite la decisión en cada uso. La factory concentra la creación en un punto: cambiar la decisión toca un solo lugar. Cuándo NO: `new` trivial sin decisiones — una factory que solo devuelve `new X()` es indirection gratis.

### distractores
- Siempre: toda creación debería pasar por una factory para no acoplarse al `new`.
- Cuando el objeto tiene muchos parámetros opcionales y se arma paso a paso.
- Cuando lo creado habla otro contrato y hay que traducirlo al que espera el caller.

## ¿Qué pide la Ley de Deméter ("talk only to friends")?
Hablar solo con tus colaboradores directos: `a.b().c().d()` es una cadena que conoce la estructura interna de otros.

### porque
Cada eslabón de la cadena es un acoplamiento: si B deja de exponer C, rompés. La alternativa es "tell, don't ask": en vez de pedir datos y decidir afuera, le pedís al objeto que haga (`envio.costoTotal()` en vez de `envio.items().sum(...)`). Regla práctica: solo un punto.

### distractores
- Limitar la cantidad de dependencias: con pocos colaboradores directos ya cumplís.
- No devolver objetos propios: los métodos solo pueden devolver tipos primitivos.
- Hablar solo con la capa de abajo: cada módulo conoce exclusivamente a la siguiente capa.

## ¿Cuándo un patrón deja de sumar?
Cuando resuelve una variación que no existe todavía. Patrón = indirection pagada con complejidad: la mayoría solo se justifica cuando la segunda variante ya llegó.

### porque
"Patrón por las dudas" te deja 5 abstracciones para 1 implementación: cada cambio cruza capas que no varían. La señal de sobre-ingeniería: tocar una feature simple exige editar 4 archivos. Regla de tres: la primera vez, código directo; la segunda, incomodidad; la tercera, recién ahí extraés la abstracción.

### distractores
- Nunca: un patrón probado del catálogo siempre mejora el diseño.
- Cuando aparece la primera repetición: hay que abstraer antes de que algo se duplique dos veces.
- Cuando acorta el código: si queda en menos líneas que la versión directa, está sumando.

## ¿Qué significa "cerrado a modificación" en la práctica?
Agregar una variante nueva sin editar el código que ya existe: entra una clase o entrada de configuración nueva, y el `switch` del código viejo no se reabre.

### porque
El `if` sobre tipo es lo que nunca está cerrado: cada variante te obliga a editarlo, y a acordarte de todos los lugares donde aparece. Convertirlo en polimorfismo o en una tabla de estrategias vuelve la extensión aditiva. Error clásico: abstraer "por las dudas" — OCP se gana cuando la segunda o tercera variante ya llegó, no antes.

### distractores
- Que la clase quede congelada: ni corrección de bugs ni cambios internos nunca más.
- Abstraer preventivamente: cerrar el código con interfaces "por las dudas" antes de que llegue la segunda variante.
- Blindar el switch: agregar un case default que lance excepción si entra una variante no prevista.

## ¿Qué te obliga a hacer una interface "gorda"?
A implementar métodos que no necesitás: clientes que terminan dependiendo de cosas que jamás usan.

### porque
Si una interface mezcla lo que piden varios consumidores, todos quedan pegados a todo: un método agregado para uno obliga a los demás a recompilar o romperse. ISP es el SRP aplicado a contratos: dividir por rol de consumidor, no por conveniencia del implementador. Señal típica: implementaciones con métodos que tiran "unsupported".

### distractores
- Firmas pesadas: muchos métodos con muchos parámetros y genéricos anidados.
- Que la implementen muchas clases: con un solo implementador la interface está sana.
- Que herede de otras interfaces: la gordura viene de la profundidad de la jerarquía.

## ¿Qué es acoplamiento y qué es cohesión?
Acoplamiento: cuánto sabe un módulo de otros — querés poco. Cohesión: cuánto se pertenecen las cosas que viven juntas — querés mucha.

### porque
Son las dos caras de "dónde pongo esto": subir la cohesión (juntar lo que cambia junto) baja el acoplamiento con el resto. El error clásico es optimizar uno a costa del otro: fragmentar todo en módulos de un método (acoplamiento bajo, cohesión nula) o meter todo en una megaclase "reutilizable". Buena salud: lo que cambia junto, vive junto.

### distractores
- Acoplamiento: cuántos imports tenés; cohesión: cuántos métodos comparten los mismos tipos.
- Al revés: acoplamiento alto está bien (integración) y cohesión baja evita clases gigantes.
- Acoplamiento: dependencias en compile time; cohesión: dependencias en runtime.

## ¿Qué señales delatan acoplamiento excesivo?
Cambios en cascada: tocar una clase te obliga a editar tres más, y nadie te puede decir de antemano cuáles.

### porque
Otras señales: imports que cruzan capas en todos los sentidos, tests que necesitan armar medio universo para probar una sola cosa, y "no cambio X porque no sé quién más lo usa". El acoplamiento nunca molesta al escribir — molesta al cambiar; por eso se lo detecta por el dolor del cambio, no midiendo líneas.

### distractores
- Tamaño: clases y métodos largos, porque el acoplamiento se mide en líneas.
- Cada import de librerías de terceros: depender del framework ya es acoplamiento excesivo.
- Complejidad ciclomática alta: los ifs anidados delatan módulos acoplados.

## ¿Qué es un invariante de clase?
Una condición sobre su estado que se cumple desde que nace y antes y después de cada método público.

### porque
Ejemplos: `saldo >= 0`, `items` nunca null, `fin > inicio`. El invariante es lo que te deja razonar sobre el objeto sin leerlo entero: toda la maquinaria de privados, constructor válido y métodos que preservan existe para defenderlo. Si se rompe, cada método que confiaba en él explota lejos de la causa real.

### distractores
- Una precondición de los métodos: lo que el caller debe cumplir antes de invocarlos.
- Una regla que alcanza con validar en el constructor: verificada una vez, vale para siempre.
- Un chequeo defensivo que cada método repite al arrancar, por seguridad.

## ¿Qué pasa si validás el objeto al usarlo y no al construirlo?
Que conviven instancias válidas e inválidas: cada consumidor tiene que re-chequear, y al que se le olvida le explota lejos del origen.

### porque
Es fail late vs fail fast: cuanto más vida tiene un objeto inválido, más lejos del error real aparece el síntoma y peor el diagnóstico. Un constructor que rechaza lo inválido convierte el problema en un error inmediato y legible, y elimina los chequeos defensivos dispersos que cada método tendría que repetir.

### distractores
- Nada grave: mientras algún consumidor valide antes de usar, el sistema queda consistente.
- Es más flexible: validar tarde permite representar estados intermedios que el dominio necesita.
- Falla igual de temprano: el uso es lo primero que pasa, así que el error aparece pronto.

## ¿Static binding o dynamic dispatch — cuándo cada uno?
Static (overload): el método se elige por el tipo declarado, en compile time. Dynamic (override): se elige por el tipo real del receptor, en runtime.

### porque
Es la razón por la que sobrecargar no es polimorfismo: con `Animal a = new Perro()`, una llamada sobrecargada según el parámetro elige la versión `Animal` — aunque el objeto real sea un Perro. Confundirlos produce jerarquías que compilan bien y despachan "al método equivocado" en silencio.

### distractores
- Al revés: el overload se resuelve por el tipo real en runtime y el override por el declarado.
- Depende del lenguaje: compilado usa static binding, interpretado usa dynamic dispatch.
- Es lo mismo: sobrecargar también es polimorfismo, solo que resuelto en compile time.

## ¿Qué controla el patrón Template Method?
El esqueleto del algoritmo, fijo en la clase padre; las subclases solo rellenan los pasos variables (hooks).

### porque
Es inversión de control a la antigua: "no me llames, yo te llamo" — el padre fija el orden y los hijos el detalle. Brilla cuando el orden de los pasos es lo estable del negocio (exportar: validar → transformar → escribir). Límite: cada variante es una subclase, así que con muchas variantes o pasos que se combinan sueltos, le gana Strategy.

### distractores
- El algoritmo completo, que se inyecta desde afuera y el contexto ejecuta.
- La secuencia de pasos: cada subclase redefine el método eligiendo su propio orden.
- Los datos que fluyen entre pasos: el padre arma el contexto y los hooks lo consumen.

## ¿Template Method o Strategy — cómo decidís?
Template: variar pasos de un algoritmo cuyo esqueleto es fijo, vía herencia. Strategy: reemplazar el algoritmo entero, inyectándolo vía composición.

### porque
Criterio: ¿lo que cambia es un paso o el algoritmo completo? Y una segunda pregunta: ¿querés que el contexto herede de quien define el esqueleto? Errores clásicos: Template para combinatorias de pasos (explotan las subclases) o Strategy para variar un solo paso (interfaces de un método por todos lados).

### distractores
- Template para combinar pasos sueltos de mil formas; Strategy para variar un solo paso.
- Da lo mismo: ambos encapsulan variación y solo cambia la cantidad de clases.
- Strategy si querés heredar el esqueleto; Template si preferís componer.

## ¿Cuándo un Adapter es la respuesta?
Cuando tenés una clase que hace lo que necesitás pero habla otro contrato, y no podés —o no conviene— tocar ninguna de las dos.

### porque
El adapter no agrega funcionalidad: traduce llamadas de una interfaz a otra para que dos partes que no se conocen colaboren. Casos reales: librerías de terceros, código legacy, contratos ya publicados. Si te encontrás metiendo lógica de negocio adentro, dejaste de adaptar — eso ya es otro patrón.

### distractores
- Cuando falta funcionalidad y hay que sumársela a la clase envolviéndola con lógica nueva.
- Cuando el subsistema es complejo y hay que exponer una interfaz simple de entrada.
- Cuando la clase es lenta y conviene reemplazar su implementación interna.

## ¿Adapter o Facade — en qué se distinguen?
Adapter cambia la interfaz de algo que ya existe (1 a 1). Facade expone una interfaz nueva y más simple sobre un subsistema entero (N a 1).

### porque
Pregunta clave: ¿resuelvo una incompatibilidad de contratos o escondo complejidad? El adapter preserva el comportamiento completo y solo traduce; la facade recorta: elige lo que el cliente necesita y oculta el resto. Error clásico: llamar "adapter" a una facade que además filtra y decide — el nombre promete una sustituibilidad que no cumple.

### distractores
- El adapter recorta operaciones y decide qué exponer; la facade traduce todo tal cual.
- El origen: adapter para librerías de terceros, facade para código propio.
- Solo la escala: una facade es un adapter que envuelve varias clases, nada más.

## ¿Cómo permite el patrón Command implementar "deshacer"?
La acción es un objeto que sabe ejecutarse y revertirse (guarda lo necesario); undo = una pila de comandos ejecutados con su `deshacer()`.

### porque
Si la acción es solo una llamada, no hay nada que revertir; como objeto, puede capturar el estado previo o aplicar la operación inversa. El mismo mecanismo da redo, colas y grabación de sesiones. Trade-off a conocer: para deshacer, el command necesita acceso a lo que tocó al momento de ejecutar.

### distractores
- Guardando un snapshot del estado completo antes de cada acción y restaurándolo al deshacer.
- Apilando los objetos afectados con sus valores previos: la pila guarda datos, no comandos.
- Registrando las operaciones en un log transaccional y pidiendo a la base que las revierta.

## ¿Null Object vs null-checks esparcidos — qué cambia?
Null Object centraliza el caso vacío: una implementación de la interface que no hace nada (o devuelve el vacío razonable), y el caller deja de preguntar.

### porque
Con `if (x != null)` repetido, el caso "no hay" queda distribuido y cada olvido es un NPE nuevo; el null object convierte la ausencia en un colaborador más. Cuándo NO: cuando "no hay" exige una decisión de negocio distinta según el contexto — ahí un no-op silencioso es peor que el null explícito.

### distractores
- Concentrar el null-check en un único método estático que todos llaman antes de usar.
- Devolver una excepción controlada de "ausencia" en vez de un NPE, manejada por el caller.
- Borrar el concepto de ausencia del dominio: con Null Object ya nada puede faltar.

## ¿Por qué el Singleton es el patrón más criticado?
Porque es estado global con sintaxis elegante: dependencia oculta que nadie puede sustituir sin tocar a todos sus usuarios.

### porque
Problemas concretos: los tests no pueden aislarlo ni reemplazarlo (no hay punto de inyección), el orden de inicialización global se vuelve frágil, y "una sola instancia" suele ser un requisito de acceso, no del objeto. Remedio habitual: instancia única gestionada por el contenedor de DI y pasada por parámetro — mismo efecto, cero acoplamiento oculto.

### distractores
- Por performance: el check de instancia en cada llamada es costoso.
- Porque una sola instancia siempre es poco: habría que permitir N configurables.
- Porque es difícil de escribir bien: la versión thread-safe requiere double-checked locking.

## ¿Builder vs constructor telescópico — cuándo cambia la cuenta?
Con muchos parámetros opcionales o con reglas entre ellos: el telescópico multiplica constructores o fuerza `null, null, 0`; el builder arma paso a paso y valida al final.

### porque
El telescópico (overloads encadenados de 2 a N parámetros) escala mal: llamadas ilegibles tipo `new User("a", null, null, 0, true, null)` donde un argumento corrido compila igual. El builder además valida combinaciones al construir el objeto final. Costo: más código — se justifica desde ~4 opcionales o cuando hay invariantes entre parámetros.

### distractores
- Con el primer parámetro opcional: cualquier default ya paga un builder.
- Cuando el objeto es inmutable: si tiene setters, el builder no aporta nada.
- Cuando hay que validar: el builder elimina la validación y el objeto nace siempre válido.

## ¿Cuándo conviene clonar (Prototype) en vez de construir de cero?
Cuando el objeto nuevo parte de una configuración compleja ya resuelta —o crear es caro— y solo cambian unos detalles.

### porque
Clonar garantiza "todo lo que no toqué queda igual" sin re-pasar veinte parámetros ni repetir la lógica de defaults; encaja en factories de variantes. Dos alertas: la copia debe ser profunda donde el invariante lo exija (el aliasing interno es el bug clásico), y si el objeto es simple, clonar es indirection gratis.

### distractores
- Cuando el objeto es grande: clonar siempre es más rápido que construir de cero.
- Cuando querés que las copias compartan estructura: la copia superficial reusa las partes.
- Cuando necesitás los valores default: el clon arranca como recién construido y después lo tocás.

## ¿State vs Strategy — cuál es la diferencia de fondo?
En Strategy el cliente elige el algoritmo y se lo inyecta; en State el propio objeto cambia de comportamiento al transicionar su estado interno.

### porque
Estructuralmente son iguales (delegación a una interfaz); lo que cambia es quién dispara el cambio y con qué frecuencia. Strategy es una decisión puntual del caller; State es un ciclo de vida — el objeto se transforma solo (Borrador → Publicado → Cerrado). Confundirlos lleva a manejar transiciones con strategies elegidas desde afuera, que es exactamente lo que State quería encapsular.

### distractores
- La estructura: State se implementa con herencia de subclases y Strategy con interfaces.
- Al revés: en State el caller inyecta el estado en cada llamada; en Strategy el objeto cambia solo.
- El alcance: State reemplaza el objeto entero por otro; Strategy solo cambia un método.

## ¿Qué desacopla el patrón Iterator?
El "cómo recorrer" del "qué se recorre": el cliente pide siguiente/haySiguiente sin conocer la estructura interna.

### porque
Gracias a eso un árbol, una lista y un stream se recorren con el mismo código, y la colección puede cambiar de estructura sin romper a quien la consume. La complejidad del recorrido vive en el iterador en vez de diseminada en cada bucle. Bonus: habilita recorridos lazy que la estructura ni conoce.

### distractores
- El tipo de los elementos: el cliente castea lo que recibe sin conocer la clase concreta.
- El orden: garantiza siempre el mismo orden aunque cambie la estructura interna.
- La concurrencia: el iterador bloquea la colección para que nadie la mute mientras se recorre.

## ¿Qué problema de estado resuelve una defensive copy?
Que el caller mute tu interior por referencia: te pasa una lista, la guardás, y después la modifica desde afuera sin que te enteres.

### porque
Guardar la referencia recibida (o devolver la interna) deja tus invariantes en manos de quien tenga esa referencia. La copia defensiva corta el aliasing en la frontera del objeto — es el precio de una inmutabilidad real: `final` solo impide reasignar, no mutar. Regla práctica: copiar en constructor y en getters todo lo mutable que escape.

### distractores
- La performance: la copia superficial evita el costo de duplicar el grafo completo.
- Ninguno si los campos son `final`: final impide reasignar y eso ya blinda el estado.
- Los leaks de memoria: copiar en la frontera evita referencias que el GC no puede recolectar.

## ¿Qué abstrae el patrón Repository?
El acceso a datos como si fuera una colección en memoria: `guardar`, `porId`, `buscarPorCriterio` — el dominio no sabe que hay SQL debajo.

### porque
El dominio gana un vocabulario de negocio (métodos con intención) en vez de queries genéricas, y los tests pueden correr contra una implementación en memoria. Degeneración clásica: un repository con un único `ejecutar(sql)` que expone entidades anémicas CRUD — eso es un DAO con otro nombre, y la base de datos sigue filtrando hasta el dominio.

### distractores
- El SQL: centraliza las queries en una clase para reutilizarlas desde los services.
- El modelo persistido: devuelve DTOs planos para que el dominio no dependa de entidades de base.
- La conexión: gestiona transacciones y sesiones para que el dominio no las abra ni cierre.
