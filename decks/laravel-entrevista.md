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
