---
deck: Laravel — Entrevista
tags: [laravel, php, backend]
fuente: Guía de estudio Laravel+Vue (proyecto Supermercado DDD)
---

## ¿Qué es el Service Container?
El contenedor de dependencias de Laravel. Sabe cómo construir objetos y resolver sus dependencias. Se configuran los bindings en los Service Providers.

### distractores
- El gestor de paquetes de PHP (como Composer): descarga e instala dependencias en `vendor/`.
- Un contenedor de despliegue (tipo Docker) donde corre la aplicación Laravel.
- El registro de variables globales compartidas entre todos los requests de la app.

## ¿bind vs singleton?
`bind` crea una nueva instancia cada vez. `singleton` reutiliza la misma. Usar singleton para servicios sin estado (Clock, PaymentGateway).

### porque
Ambos registran CÓMO construir una dependencia; la diferencia es el ciclo de vida. `bind` = nueva instancia por resolución (correcto si el objeto guarda estado por request). `singleton` = una para toda la app (correcto para servicios sin estado: reutilizar es gratis y seguro). Error clásico: singleton sobre algo con estado → todos los users comparten ese estado.

### distractores
- `bind` reutiliza la misma instancia en toda la app y `singleton` crea una nueva por resolución.
- Conviene `singleton` para objetos con estado por request, así no se reconstruyen en cada uso.
- `singleton` resuelve la dependencia al registrarla en el provider; `bind` espera al primer uso.

## ¿Qué es el middleware?
Capas que interceptan el request antes del controller. Sirve para auth, CORS, CSRF, logging. Desacopla concerns transversales.

### distractores
- Capas que se ejecutan DESPUÉS del controller, formateando la respuesta a la salida.
- El lugar donde se validan los campos del request antes de que lleguen al modelo.
- Clases asociadas a un modelo que deciden si el user actual puede tocarlo.

## ¿Middleware vs Policy?
Middleware protege RUTAS (requiere auth). Policy protege RECURSOS (puede este user editar ESTE modelo).

### porque
Middleware corre ANTES del controller y solo ve el request: puede preguntar "¿estás logueado?" pero no conoce el modelo. Policy corre DENTRO del controller con el modelo cargado: puede comparar `$post->user_id` con el user actual. Regla: "¿quién entra?" → middleware; "¿puede ESTE user tocar ESTE recurso?" → policy.

### distractores
- La policy corre antes del controller y solo ve el request; el middleware compara el modelo con el user.
- Middleware para permisos granulares por modelo, policy para verificar si el user está logueado.
- No hay diferencia real: ambas son formas de registrar validación dentro del service provider.

## ¿Cómo funciona Auth::attempt?
Busca usuario por email, verifica password con bcrypt, guarda el ID en sesión. Retorna true/false.

### distractores
- Hashea el password y lo busca por esa columna: bcrypt genera siempre el mismo hash para el mismo texto.
- Si el usuario no existe, lo crea con esos datos y recién ahí inicia la sesión.
- Si las credenciales no coinciden lanza una excepción de autenticación en vez de retornar false.

## ¿Qué es $fillable?
Lista blanca de campos asignables masivamente. Previene mass-assignment (que alguien envíe `is_admin=1`).

### distractores
- Lista negra: los campos listados se bloquean y todo lo demás se puede asignar masivamente.
- Los campos que Eloquent completa solo (`created_at`, `updated_at`) al crear el registro.
- Los campos marcados como obligatorios (not null) en la migración de la tabla.

## ¿Qué hace el cast hashed?
Hashea el password con bcrypt al asignarlo. Garantiza que nunca se guarde en texto plano.

### distractores
- Compara el valor asignado contra el hash guardado y retorna true si coincide.
- Encripta el valor de forma reversible con la APP_KEY para poder recuperarlo después.
- Aplica el hash solo al leer el atributo, como un accessor de solo lectura.

## ¿Facades vs DI?
Facades: concisos pero ocultan dependencias. DI: explícito, mejor para testing. Ambos válidos en Laravel.

### porque
Un Facade es un proxy estático al servicio del container: `Cache::get()` resuelve la misma instancia que inyectarías. La diferencia es VISIBILIDAD: con DI la dependencia firma el constructor (ves y mockeas lo que llega); con Facade la dependencia está escondida en la línea de uso. Por eso DI facilita tests — el mock entra por el constructor.

### distractores
- Los Facades resuelven una instancia nueva del servicio en cada llamada estática.
- DI solo se puede usar en controllers; los Facades funcionan en cualquier clase.
- Los Facades no pasan por el service container: llaman directo a la clase que tienen detrás.

## ¿Events vs llamar directamente al listener?
Desacoplamiento. El emisor no sabe quién escucha. Permite agregar listeners sin tocar el emisor.

### distractores
- Ventaja de performance: los listeners corren en paralelo, en colas, por defecto.
- El event garantiza que los listeners corran en la misma transacción de BD que el emisor.
- Los events se auto-descubren: no hace falta registrar los listeners en ningún provider.

## ¿Qué son los Service Providers?
El lugar donde se configuran bindings del container, listeners de eventos y cualquier setup. `register()` para bindings, `boot()` para lo que necesita todo cargado.

### distractores
- `boot()` registra los bindings y `register()` corre cuando todo ya está cargado.
- Clases que agrupan los side-effects del ciclo de vida de un modelo Eloquent.
- Un provider por módulo que contiene la lógica de negocio del dominio.

## ¿Qué es Eloquent?
El ORM de Laravel. Mapea tablas a objetos PHP. Provee query builder, relationships, scopes, casts.

### distractores
- El query builder puro: construye SQL fluido sin modelos ni relaciones.
- El motor de plantillas que compila las vistas Blade a PHP puro.
- El sistema de migraciones que versiona el schema de la base de datos.

## ¿firstOrCreate vs create?
`firstOrCreate` busca por atributos y solo crea si no existe (idempotente). `create` siempre crea uno nuevo.

### distractores
- `firstOrCreate` actualiza el registro si ya existe uno con esos atributos.
- `firstOrCreate` retorna el modelo sin persistirlo; lo guardás después con `save()`.
- `create` ejecuta las reglas del Form Request antes de insertar el registro.

## ¿Cómo defines una ruta con parámetro?
`Route::get('/producto/{id}', [Controller, 'metodo'])`. Después lo recibes como argumento del método.

### distractores
- El valor llega siempre vía `$request->route('id')`; no se puede recibir como argumento del método.
- El parámetro viaja como query string (`/producto?id=`) y Laravel lo inyecta solo.
- El placeholder se escribe con `$`: `Route::get('/producto/$id')`, como la interpolación de strings.

## ¿Qué hace back()->withErrors()?
Redirige a la página anterior (back) con errores en la sesión. Se usan para mostrar mensajes de validación.

### distractores
- Vuelve a renderizar la vista anterior con los errores, sin redirigir (sin nueva request).
- Responde 422 con los errores en JSON, como espera un cliente de API.
- Guarda los errores en una cookie del navegador para que sobrevivan al refresh.

## ¿RefreshDatabase vs DatabaseTransactions?
`RefreshDatabase` migra + rollback por test (limpio, lento). `DatabaseTransactions` solo rollback (rápido).

### distractores
- Al revés: `DatabaseTransactions` re-migra la base en cada test y `RefreshDatabase` solo hace rollback.
- `RefreshDatabase` deja los datos del test en la base si no escribís `tearDown()` a mano.
- `DatabaseTransactions` solo funciona con SQLite en memoria, no con Postgres/MySQL.

## ¿Qué ganás al agrupar rutas con middleware en un grupo?
Aplicás middleware compartido (auth, throttle) a un bloque entero de rutas, con prefijos de URL y nombre comunes. Una sola declaración protege todo el grupo.

### porque
La alternativa es repetir la pila de middleware ruta por ruta: al añadir un endpoint nuevo es fácil olvidarlo y publicar una ruta desprotegida. El grupo convierte el middleware en propiedad del BLOQUE, no de cada endpoint. Error clásico: la ruta nueva agregada fuera del grupo sin auth.

### distractores
- Las rutas del grupo comparten un único controller y no declaran acción propia.
- Aíslan el grupo del middleware global definido en el bootstrap de la app.
- Las rutas del grupo responden más rápido porque se registran y compilan en bloque.

## ¿Form Request vs validar inline en el controller?
El Form Request mueve validación y autorización a una clase propia, testeable y reutilizable; el controller queda solo con orquestar. Inline vale para reglas triviales de uno o dos campos.

### porque
Criterio: si las reglas crecen, se reutilizan entre endpoints o necesitan autorización, la clase dedicada gana. Error clásico: controllers de 100 líneas donde la mitad es validación duplicada — imposible de leer y de testear aislado.

### distractores
- El Form Request valida después de que el controller ejecute la acción, como último filtro.
- Las reglas inline son más reutilizables: se copian entre endpoints sin crear clases.
- El Form Request desinfecta el input (trim, strip_tags) antes de validarlo.

## ¿Qué problema resuelve el eager loading?
El problema N+1: 1 query trae los padres y luego N queries, una por fila, al iterar la relación. Con `with()` todo se resuelve en 2 queries.

### porque
Con lazy loading, acceder a `$post->comments` dentro de un loop dispara una query POR fila: imperceptible con 20 registros de seed, letal con 20.000. El eager carga las relaciones con un único `WHERE IN`. Error clásico: medir performance en dev con pocos datos y descubrir el N+1 en producción.

### distractores
- Cachea las relaciones ya consultadas para reutilizarlas dentro de la misma request.
- Resuelve N+1 con JOINs: una sola query que duplica la fila del padre por cada hijo.
- Carga las relaciones en segundo plano después de responder, con un job en cola.

## ¿Cuándo corresponde una relación polimórfica?
Cuando muchos modelos distintos pueden poseer el mismo tipo de hijo: comentarios en posts Y videos, fotos en users Y productos. Una sola tabla con `commentable_type`/`commentable_id`.

### porque
La alternativa es una tabla + FK por cada padre (post_comments, video_comments): duplicación total de estructura. El polimorfismo paga cuando los hijos se comportan IGUAL respecto del padre. Error clásico: usarlo por comodidad cuando cada tipo tiene reglas distintas, y terminar con `switch` por tipo esparcido por todo el código.

### distractores
- Cuando cada tipo de padre necesita reglas distintas sobre el hijo: el `type` lo despacha solo.
- Para herencia de tablas: que la tabla hija herede las columnas de la padre.
- Cuando un hijo puede pertenecer a varios padres AL MISMO TIEMPO (many-to-many).

## ¿Global scope vs Local scope?
El global se aplica a TODAS las queries del modelo automáticamente (se registra en `boot`). El local se aplica solo cuando lo invocás explícitamente: `User::active()`.

### porque
Global es para invariantes que nadie debe olvidar (soft deletes, filtrar por tenant en multi-tenant). Local es para filtros opcionales y combinables. Error clásico: global scope para algo opcional → queries que "misteriosamente" no devuelven filas; local scope para un invariant → alguien lo omite y filtra datos ajenos.

### distractores
- El global se invoca explícito (`User::active()`) y el local corre solo en todas las queries.
- El local se registra en `boot()` del modelo para que nadie lo olvide.
- Un scope definido no se puede combinar con condiciones where adicionales.

## ¿Accessor vs Cast?
El cast transforma el valor ALMACENADO de forma declarativa en `$casts` (string JSON → array) y funciona en ambos sentidos. El accessor transforma solo al leer, con lógica arbitraria en PHP.

### porque
Criterio: transformación estándar y reversible → cast; presentación pura (`nombre_completo`, precio formateado) → accessor, porque no querés persistirla. Error clásico: un accessor que altera el dato de forma que, al guardar el modelo de vuelta, corrompe el valor original en la base.

### distractores
- El accessor se declara en el array `$casts` y el cast como método `get...Attribute()`.
- El cast transforma solo al leer; para escribir siempre hace falta un mutator aparte.
- El accessor persiste su transformación: al guardar se almacena el valor transformado.

## ¿Cuándo usar una LazyCollection?
Cuando procesás decenas de miles de filas en batch: recorre los resultados con un solo cursor de BD y mantiene la memoria constante. La Collection normal materializa todo en RAM.

### porque
`User::all()->each(...)` instancia un modelo por fila: con 500k filas el proceso revienta por memory limit. La lazy collection es un generador: solo existe en memoria la fila actual. Error clásico: comandos de mantenimiento que funcionan en dev y matan el worker en producción.

### distractores
- Para paginar vistas con miles de filas: la lazy collection pagina sola.
- Siempre que puedas: `filter`/`map` es más rápido sobre lazy que sobre una Collection normal.
- Para compartir colecciones grandes entre requests sin volver a consultar la base.

## ¿Queue asíncrona vs QUEUE_CONNECTION=sync?
Async: el job se encola, el request responde de inmediato y un worker lo procesa después. Sync: el job ejecuta EN LÍNEA dentro del request — determinístico, ideal para tests y dev.

### porque
Criterio: todo lo que el user no necesita esperar (emails, PDFs, llamadas a APIs) va async; en tests, sync ejecuta el job dentro del propio test sin levantar workers. Error clásico: desarrollar todo con sync y, al deployar con cola real, descubrir que el job serializa un estado que ya cambió al ejecutarse.

### distractores
- Con sync el job se guarda igual en la tabla `jobs` y un worker lo toma al instante.
- El driver async corre el job dentro de la transacción del request para que sea atómico.
- Sync es el driver recomendado en producción porque evita levantar workers.

## ¿Qué pasa cuando un job de cola falla?
Se reintenta según `$tries` con `$backoff` entre intentos; agotados los intentos queda registrado en la tabla `failed_jobs`, desde donde podés inspeccionarlo y reintentarlo.

### porque
`failed_jobs` es la red de seguridad operativa: sin ella un job que explota desaparece en silencio y la acción se pierde para siempre. Error clásico: no definir tries/backoff (reintentas infinito un servicio caído) o no monitorear esa tabla en producción.

### distractores
- El job se descarta y queda solo en el log del worker: la base no registra nada.
- El worker lo reintenta para siempre hasta que funcione, sin límite configurable.
- Al fallar un job, el worker se detiene por completo hasta que lo reinicies a mano.

## ¿Notification vs Mailable?
Notification es multi-canal (mail, database, Slack, broadcast) con una plantilla por canal. Mailable es solo email, con control total del mensaje.

### porque
Criterio: si el aviso puede llegar por más de un canal o debe quedar en la bandeja in-app, Notification (el canal `database` ya lo persiste). Si es un email complejo tipo factura, Mailable. Error clásico: implementar a mano el guardado en base de lo que el canal database resuelve gratis.

### distractores
- Mailable soporta los mismos canales (database, Slack) y además adjuntos avanzados.
- Notification es solo para emails transaccionales; persistir en base es cosa de Mailable.
- Notification guarda las plantillas en la tabla `notifications` para editarlas desde el admin.

## ¿Por qué un scheduler en vez de un cron por tarea?
Definís todas las tareas en código (`routes/console.php`) y el SO solo dispara UNA entrada: `schedule:run` cada minuto. La configuración queda versionada en el repo.

### porque
Un cron por tarea dispersa la config en cada servidor: no se reproduce, no pasa code review y se pierde al migrar. El scheduler centraliza el CUÁNDO en código, con `withoutOverlapping` y `onOneServer` incluidos. Error clásico: dos servidores con el mismo cron ejecutando la tarea duplicada.

### distractores
- Porque el scheduler reintenta las tareas fallidas automáticamente y cron no.
- Porque elimina toda entrada de cron: el servidor no necesita ni la línea de `schedule:run`.
- Porque una tarea definida en código corre más rápido que el mismo script disparado por cron.

## ¿Qué patrón implementa Cache::remember?
Cache-aside: si la clave existe la devuelve; si no, ejecuta el closure, guarda el resultado con TTL y lo devuelve. El closure solo corre en el miss.

### porque
El hot path lee del store sin tocar la fuente de datos — ese es todo el ahorro. Error clásico: TTL eterno o invalidación olvidada → datos viejos para siempre; y cachear consultas que cambian en cada request (no ahorra nada, suma un round-trip).

### distractores
- Write-through: cada escritura actualiza la caché antes de confirmar en la base.
- Read-through con precarga: la caché se llena completa al primer request de la app.
- Refresh-ahead: el closure corre en background justo antes de que expire la clave.

## ¿Cómo protegés un endpoint de abuso?
Rate limiting con throttle: definís límites por minuto (por IP o user) en un RateLimiter y aplicás el middleware `throttle:` a la ruta o grupo.

### porque
Es defensa de primera línea a nivel HTTP, antes de gastar queries ni lógica de negocio: absorbe bots y fuerza bruta. Error clásico: limitar por IP detrás de un proxy compartido (todos los users comparten el cupo) o confiar en el rate limit como ÚNICA capa de seguridad.

### distractores
- Con un Form Request estricto: la validación de campos ya frena el tráfico automatizado.
- Definiendo un Gate por endpoint que cuente cuántas requests hizo el usuario.
- Cacheando la respuesta: el cache absorbe el exceso de requests sin tocar la ruta.

## ¿API Resource vs devolver el modelo Eloquent directo?
El Resource declara EXPLÍCITAMENTE qué campos exponer y cómo anidar relaciones: un contrato de API estable. El modelo directo acopla tu respuesta al schema de la tabla.

### porque
Al devolver el modelo, cada columna nueva (`remember_token`, internals) se filtra a producción sola; el `$hidden` se hereda al código interno que sí necesita ese campo. El Resource es la capa de presentación: oculta, agrega computados y sobrevive a cambios de tabla. Error clásico: usar `$hidden` como contrato de API.

### distractores
- Con `$hidden` en el modelo alcanza: oculta igual y sin mantener una clase por endpoint.
- El Resource aplica las reglas de validación antes de exponer los datos.
- El modelo directo es más estable: el Resource cambia cada vez que tocás la migración.

## ¿Gates vs Policies?
Gate: closure suelto para una habilidad puntual, no ligada a un modelo. Policy: clase agrupada POR modelo con un método por acción (view, create, update, delete).

### porque
Criterio: habilidad aislada tipo "¿puede ver el dashboard?" → gate; CRUD sobre un recurso con lógica por acción → policy, que además Laravel auto-descubre por convención de nombre. Error clásico: gates multiplicándose hasta formar un archivo gigante de closures, o policies de un solo método que eran un gate disfrazado.

### distractores
- El gate agrupa un método por acción sobre un modelo y la policy es un closure suelto.
- Los gates solo funcionan en plantillas Blade y las policies solo en controllers.
- Los gates requieren un modelo Eloquent; las policies funcionan sin ninguna entidad.

## ¿Cuándo usar un Observer?
Para agrupar en una clase las reacciones al ciclo de vida de UN modelo (created, updated, deleted): invalidar caché, loggear, disparar side-effects.

### porque
La alternativa es llamar los side-effects a mano desde cada controller — tarde o temprano uno se olvida — o engancharse a eventos dispersos en el provider. El observer centraliza todo lo que rodea al modelo. Error clásico: observers con lógica de negocio pesada que nadie recuerda que existe y se ejecuta "sola".

### distractores
- Para escuchar el ciclo de vida de TODOS los modelos de la app desde una sola clase.
- Como capa de validación del modelo: verifica los datos antes de que se guarden.
- Cuando los side-effects deben correr sí o sí en una cola asíncrona.

## ¿Soft delete vs delete real?
Soft delete: escribe `deleted_at` y el registro desaparece de las queries por defecto (recuperable). Delete real: `forceDelete()` elimina la fila de la tabla.

### porque
Criterio: soft delete para datos recuperables o con requisito legal/auditoría (users, órdenes). El costo es permanente: TODAS las queries llevan `WHERE deleted_at IS NULL`, índices más grandes, y los únicos chocan con filas "borradas". Error clásico: activarlo sin unique index parcial → no podés recrear el registro con el mismo email.

### distractores
- `delete()` elimina la fila física; lo lógico es llamar `softDelete()` explícitamente.
- El soft delete mueve la fila a una tabla `deleted_records` de auditoría.
- Por defecto las queries incluyen los borrados; los filtrás con `withTrashed()`.

## ¿Qué garantiza DB::transaction?
Atomicidad: si el bloque lanza una excepción, se hace rollback de TODOS los writes y la base queda como antes. Sin transacción, quedan escrituras a medias.

### porque
Garantiza atomicidad, NO rendimiento ni aislamiento total por defecto. Error clásico: hacer trabajo lento DENTRO de la transacción (llamar APIs, enviar emails): mantenés locks abiertos y el resto de la app espera. La transacción debe ser corta y envolver solo writes.

### distractores
- Aislamiento total: ninguna otra request puede leer datos a medias mientras corre.
- Performance: agrupa todos los writes en un único round-trip a la base.
- Si el bloque falla, Laravel reintenta la transacción automáticamente varias veces.

## ¿Offset vs Cursor pagination?
Offset (`paginate`) salta N filas: permite ir a cualquier página pero se degrada en páginas profundas. Cursor (`cursorPaginate`) pide "lo posterior a este ID": rápido y estable, sin números de página.

### porque
`OFFSET 100000` obliga a la base a leer y descartar 100k filas en cada request, y si insertan filas mientras paginás el user ve duplicados. El cursor busca por índice (`WHERE id > ?`). El costo: no hay "página 7" ni total count — por eso domina en feeds infinitos de APIs. Error clásico: `paginate()` detrás de un scroll infinito.

### distractores
- El cursor es el que se degrada en páginas profundas; offset viaja por índice y queda estable.
- `cursorPaginate` también calcula el total de registros; solo cambian los links.
- Offset es el natural para scroll infinito: el número de página permite reanudar donde quedó.

## ¿Por qué factories en vez de crear modelos a mano en tests?
La factory crea registros válidos con defaults realistas (Faker) y cada test solo sobreescribe los campos que le importan. A mano, cada test duplica el conocimiento de qué necesita la tabla.

### porque
Cuando el modelo exige un campo nuevo, con factory tocás UN `definition()`; a mano, rompés 200 tests. Además componen escenarios con `has()` y states. Error clásico: `User::create([...20 campos...])` copiado y pegado entre tests — cualquier cambio al schema esparce el fix por toda la suite.

### distractores
- Porque envuelven cada test en una transacción que se revierte automáticamente.
- Porque insertan directo con SQL sin pasar por Eloquent: más rápidas y sin eventos.
- Porque son solo para el seeder de la base: en los tests los modelos van a mano.
