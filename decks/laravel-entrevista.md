---
deck: Laravel — Entrevista
tags: [laravel, php, backend]
fuente: Guía de estudio Laravel+Vue (proyecto Supermercado DDD)
---

## ¿Qué es el Service Container?
El contenedor de dependencias de Laravel. Sabe cómo construir objetos y resolver sus dependencias. Se configuran los bindings en los Service Providers.

## ¿bind vs singleton?
`bind` crea una nueva instancia cada vez. `singleton` reutiliza la misma. Usar singleton para servicios sin estado (Clock, PaymentGateway).

### porque
Ambos registran CÓMO construir una dependencia; la diferencia es el ciclo de vida. `bind` = nueva instancia por resolución (correcto si el objeto guarda estado por request). `singleton` = una para toda la app (correcto para servicios sin estado: reutilizar es gratis y seguro). Error clásico: singleton sobre algo con estado → todos los users comparten ese estado.

## ¿Qué es el middleware?
Capas que interceptan el request antes del controller. Sirve para auth, CORS, CSRF, logging. Desacopla concerns transversales.

## ¿Middleware vs Policy?
Middleware protege RUTAS (requiere auth). Policy protege RECURSOS (puede este user editar ESTE modelo).

### porque
Middleware corre ANTES del controller y solo ve el request: puede preguntar "¿estás logueado?" pero no conoce el modelo. Policy corre DENTRO del controller con el modelo cargado: puede comparar `$post->user_id` con el user actual. Regla: "¿quién entra?" → middleware; "¿puede ESTE user tocar ESTE recurso?" → policy.

## ¿Cómo funciona Auth::attempt?
Busca usuario por email, verifica password con bcrypt, guarda el ID en sesión. Retorna true/false.

## ¿Qué es $fillable?
Lista blanca de campos asignables masivamente. Previene mass-assignment (que alguien envíe `is_admin=1`).

## ¿Qué hace el cast hashed?
Hashea el password con bcrypt al asignarlo. Garantiza que nunca se guarde en texto plano.

## ¿Facades vs DI?
Facades: concisos pero ocultan dependencias. DI: explícito, mejor para testing. Ambos válidos en Laravel.

### porque
Un Facade es un proxy estático al servicio del container: `Cache::get()` resuelve la misma instancia que inyectarías. La diferencia es VISIBILIDAD: con DI la dependencia firma el constructor (ves y mockeas lo que llega); con Facade la dependencia está escondida en la línea de uso. Por eso DI facilita tests — el mock entra por el constructor.

## ¿Events vs llamar directamente al listener?
Desacoplamiento. El emisor no sabe quién escucha. Permite agregar listeners sin tocar el emisor.

## ¿Qué son los Service Providers?
El lugar donde se configuran bindings del container, listeners de eventos y cualquier setup. `register()` para bindings, `boot()` para lo que necesita todo cargado.

## ¿Qué es Eloquent?
El ORM de Laravel. Mapea tablas a objetos PHP. Provee query builder, relationships, scopes, casts.

## ¿firstOrCreate vs create?
`firstOrCreate` busca por atributos y solo crea si no existe (idempotente). `create` siempre crea uno nuevo.

## ¿Cómo defines una ruta con parámetro?
`Route::get('/producto/{id}', [Controller, 'metodo'])`. Después lo recibes como argumento del método.

## ¿Qué hace back()->withErrors()?
Redirige a la página anterior (back) con errores en la sesión. Se usan para mostrar mensajes de validación.

## ¿RefreshDatabase vs DatabaseTransactions?
`RefreshDatabase` migra + rollback por test (limpio, lento). `DatabaseTransactions` solo rollback (rápido).

## ¿Qué ganás al agrupar rutas con middleware en un grupo?
Aplicás middleware compartido (auth, throttle) a un bloque entero de rutas, con prefijos de URL y nombre comunes. Una sola declaración protege todo el grupo.

### porque
La alternativa es repetir la pila de middleware ruta por ruta: al añadir un endpoint nuevo es fácil olvidarlo y publicar una ruta desprotegida. El grupo convierte el middleware en propiedad del BLOQUE, no de cada endpoint. Error clásico: la ruta nueva agregada fuera del grupo sin auth.

## ¿Form Request vs validar inline en el controller?
El Form Request mueve validación y autorización a una clase propia, testeable y reutilizable; el controller queda solo con orquestar. Inline vale para reglas triviales de uno o dos campos.

### porque
Criterio: si las reglas crecen, se reutilizan entre endpoints o necesitan autorización, la clase dedicada gana. Error clásico: controllers de 100 líneas donde la mitad es validación duplicada — imposible de leer y de testear aislado.

## ¿Qué problema resuelve el eager loading?
El problema N+1: 1 query trae los padres y luego N queries, una por fila, al iterar la relación. Con `with()` todo se resuelve en 2 queries.

### porque
Con lazy loading, acceder a `$post->comments` dentro de un loop dispara una query POR fila: imperceptible con 20 registros de seed, letal con 20.000. El eager carga las relaciones con un único `WHERE IN`. Error clásico: medir performance en dev con pocos datos y descubrir el N+1 en producción.

## ¿Cuándo corresponde una relación polimórfica?
Cuando muchos modelos distintos pueden poseer el mismo tipo de hijo: comentarios en posts Y videos, fotos en users Y productos. Una sola tabla con `commentable_type`/`commentable_id`.

### porque
La alternativa es una tabla + FK por cada padre (post_comments, video_comments): duplicación total de estructura. El polimorfismo paga cuando los hijos se comportan IGUAL respecto del padre. Error clásico: usarlo por comodidad cuando cada tipo tiene reglas distintas, y terminar con `switch` por tipo esparcido por todo el código.

## ¿Global scope vs Local scope?
El global se aplica a TODAS las queries del modelo automáticamente (se registra en `boot`). El local se aplica solo cuando lo invocás explícitamente: `User::active()`.

### porque
Global es para invariantes que nadie debe olvidar (soft deletes, filtrar por tenant en multi-tenant). Local es para filtros opcionales y combinables. Error clásico: global scope para algo opcional → queries que "misteriosamente" no devuelven filas; local scope para un invariant → alguien lo omite y filtra datos ajenos.

## ¿Accessor vs Cast?
El cast transforma el valor ALMACENADO de forma declarativa en `$casts` (string JSON → array) y funciona en ambos sentidos. El accessor transforma solo al leer, con lógica arbitraria en PHP.

### porque
Criterio: transformación estándar y reversible → cast; presentación pura (`nombre_completo`, precio formateado) → accessor, porque no querés persistirla. Error clásico: un accessor que altera el dato de forma que, al guardar el modelo de vuelta, corrompe el valor original en la base.

## ¿Cuándo usar una LazyCollection?
Cuando procesás decenas de miles de filas en batch: recorre los resultados con un solo cursor de BD y mantiene la memoria constante. La Collection normal materializa todo en RAM.

### porque
`User::all()->each(...)` instancia un modelo por fila: con 500k filas el proceso revienta por memory limit. La lazy collection es un generador: solo existe en memoria la fila actual. Error clásico: comandos de mantenimiento que funcionan en dev y matan el worker en producción.

## ¿Queue asíncrona vs QUEUE_CONNECTION=sync?
Async: el job se encola, el request responde de inmediato y un worker lo procesa después. Sync: el job ejecuta EN LÍNEA dentro del request — determinístico, ideal para tests y dev.

### porque
Criterio: todo lo que el user no necesita esperar (emails, PDFs, llamadas a APIs) va async; en tests, sync ejecuta el job dentro del propio test sin levantar workers. Error clásico: desarrollar todo con sync y, al deployar con cola real, descubrir que el job serializa un estado que ya cambió al ejecutarse.

## ¿Qué pasa cuando un job de cola falla?
Se reintenta según `$tries` con `$backoff` entre intentos; agotados los intentos queda registrado en la tabla `failed_jobs`, desde donde podés inspeccionarlo y reintentarlo.

### porque
`failed_jobs` es la red de seguridad operativa: sin ella un job que explota desaparece en silencio y la acción se pierde para siempre. Error clásico: no definir tries/backoff (reintentas infinito un servicio caído) o no monitorear esa tabla en producción.

## ¿Notification vs Mailable?
Notification es multi-canal (mail, database, Slack, broadcast) con una plantilla por canal. Mailable es solo email, con control total del mensaje.

### porque
Criterio: si el aviso puede llegar por más de un canal o debe quedar en la bandeja in-app, Notification (el canal `database` ya lo persiste). Si es un email complejo tipo factura, Mailable. Error clásico: implementar a mano el guardado en base de lo que el canal database resuelve gratis.

## ¿Por qué un scheduler en vez de un cron por tarea?
Definís todas las tareas en código (`routes/console.php`) y el SO solo dispara UNA entrada: `schedule:run` cada minuto. La configuración queda versionada en el repo.

### porque
Un cron por tarea dispersa la config en cada servidor: no se reproduce, no pasa code review y se pierde al migrar. El scheduler centraliza el CUÁNDO en código, con `withoutOverlapping` y `onOneServer` incluidos. Error clásico: dos servidores con el mismo cron ejecutando la tarea duplicada.

## ¿Qué patrón implementa Cache::remember?
Cache-aside: si la clave existe la devuelve; si no, ejecuta el closure, guarda el resultado con TTL y lo devuelve. El closure solo corre en el miss.

### porque
El hot path lee del store sin tocar la fuente de datos — ese es todo el ahorro. Error clásico: TTL eterno o invalidación olvidada → datos viejos para siempre; y cachear consultas que cambian en cada request (no ahorra nada, suma un round-trip).

## ¿Cómo protegés un endpoint de abuso?
Rate limiting con throttle: definís límites por minuto (por IP o user) en un RateLimiter y aplicás el middleware `throttle:` a la ruta o grupo.

### porque
Es defensa de primera línea a nivel HTTP, antes de gastar queries ni lógica de negocio: absorbe bots y fuerza bruta. Error clásico: limitar por IP detrás de un proxy compartido (todos los users comparten el cupo) o confiar en el rate limit como ÚNICA capa de seguridad.

## ¿API Resource vs devolver el modelo Eloquent directo?
El Resource declara EXPLÍCITAMENTE qué campos exponer y cómo anidar relaciones: un contrato de API estable. El modelo directo acopla tu respuesta al schema de la tabla.

### porque
Al devolver el modelo, cada columna nueva (`remember_token`, internals) se filtra a producción sola; el `$hidden` se hereda al código interno que sí necesita ese campo. El Resource es la capa de presentación: oculta, agrega computados y sobrevive a cambios de tabla. Error clásico: usar `$hidden` como contrato de API.

## ¿Gates vs Policies?
Gate: closure suelto para una habilidad puntual, no ligada a un modelo. Policy: clase agrupada POR modelo con un método por acción (view, create, update, delete).

### porque
Criterio: habilidad aislada tipo "¿puede ver el dashboard?" → gate; CRUD sobre un recurso con lógica por acción → policy, que además Laravel auto-descubre por convención de nombre. Error clásico: gates multiplicándose hasta formar un archivo gigante de closures, o policies de un solo método que eran un gate disfrazado.

## ¿Cuándo usar un Observer?
Para agrupar en una clase las reacciones al ciclo de vida de UN modelo (created, updated, deleted): invalidar caché, loggear, disparar side-effects.

### porque
La alternativa es llamar los side-effects a mano desde cada controller — tarde o temprano uno se olvida — o engancharse a eventos dispersos en el provider. El observer centraliza todo lo que rodea al modelo. Error clásico: observers con lógica de negocio pesada que nadie recuerda que existe y se ejecuta "sola".

## ¿Soft delete vs delete real?
Soft delete: escribe `deleted_at` y el registro desaparece de las queries por defecto (recuperable). Delete real: `forceDelete()` elimina la fila de la tabla.

### porque
Criterio: soft delete para datos recuperables o con requisito legal/auditoría (users, órdenes). El costo es permanente: TODAS las queries llevan `WHERE deleted_at IS NULL`, índices más grandes, y los únicos chocan con filas "borradas". Error clásico: activarlo sin unique index parcial → no podés recrear el registro con el mismo email.

## ¿Qué garantiza DB::transaction?
Atomicidad: si el bloque lanza una excepción, se hace rollback de TODOS los writes y la base queda como antes. Sin transacción, quedan escrituras a medias.

### porque
Garantiza atomicidad, NO rendimiento ni aislamiento total por defecto. Error clásico: hacer trabajo lento DENTRO de la transacción (llamar APIs, enviar emails): mantenés locks abiertos y el resto de la app espera. La transacción debe ser corta y envolver solo writes.

## ¿Offset vs Cursor pagination?
Offset (`paginate`) salta N filas: permite ir a cualquier página pero se degrada en páginas profundas. Cursor (`cursorPaginate`) pide "lo posterior a este ID": rápido y estable, sin números de página.

### porque
`OFFSET 100000` obliga a la base a leer y descartar 100k filas en cada request, y si insertan filas mientras paginás el user ve duplicados. El cursor busca por índice (`WHERE id > ?`). El costo: no hay "página 7" ni total count — por eso domina en feeds infinitos de APIs. Error clásico: `paginate()` detrás de un scroll infinito.

## ¿Por qué factories en vez de crear modelos a mano en tests?
La factory crea registros válidos con defaults realistas (Faker) y cada test solo sobreescribe los campos que le importan. A mano, cada test duplica el conocimiento de qué necesita la tabla.

### porque
Cuando el modelo exige un campo nuevo, con factory tocás UN `definition()`; a mano, rompés 200 tests. Además componen escenarios con `has()` y states. Error clásico: `User::create([...20 campos...])` copiado y pegado entre tests — cualquier cambio al schema esparce el fix por toda la suite.
