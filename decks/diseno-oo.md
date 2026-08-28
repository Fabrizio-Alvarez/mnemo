---
deck: Diseño OO y Patrones — Entrevista
tags: [oop, solid, patrones, diseño]
fuente: Generado con prompts/generar-mazo.md
---

## ¿Qué problema resuelve el encapsulamiento?
Ocultar el estado interno y exponer solo comportamiento. El objeto protege sus invariantes: nadie puede dejarlo en un estado inválido desde afuera.

### porque
Sin encapsulamiento, cualquiera modifica campos sueltos y el estado inválido se vuelve posible. Con ella, toda mutación pasa por un método que puede validar. Es la diferencia entre "datos + funciones que los tocan" y un objeto que se defiende solo.

## ¿Qué elimina el polimorfismo?
El `switch`/`if` sobre el tipo. Llamás el mismo método y cada clase hace lo suyo — el caller no conoce ni le importa la clase concreta.

### porque
Cada `if (tipo == X)` nuevo es un lugar que olvidás actualizar al agregar un tipo. Con polimorfismo, agregar un tipo nuevo = agregar una clase: el código existente no se toca (Open/Closed en acción).

## ¿Composición vs herencia?
Composición: un objeto TIENE otro y delega. Herencia: un objeto ES otro y hereda todo. Regla práctica: composición por defecto, herencia solo para jerarquías "es-un" genuinas y estables.

### porque
La herencia es el acoplamiento más fuerte de OOP: heredás todo, incluso lo que no querés, y los cambios en el padre rompen los hijos. La composición delega solo lo que necesitás y se cambia en runtime. El error clásico: heredar para REUTILIZAR código (Stack extends ArrayList) en vez de modelar un "es-un" real.

## ¿Qué es una clase anémica?
Objetos que solo tienen propiedades públicas y getters/setters, sin comportamiento — la lógica vive afuera en services que manipulan esos datos.

### porque
Rompe el encapsulamiento: las reglas del objeto están dispersas en services que cualquiera llama en otro orden. Un modelo rico pone la regla donde vive el dato (`cliente.debe(monto)` en vez de `saldo = saldo - monto` en el service). Excepción honesta: DTOs e inputs son anémicos a propósito — no tienen reglas que proteger.

## ¿Qué significa "programar contra una abstracción"?
Depender de interfaces/contratos, no de clases concretas. El high-level define qué necesita; el low-level lo implementa.

### porque
Depender de una concreción te casa con ella: cambiarla implica tocar todo caller. Si el constructor pide `Notificador` (interface), el test pasa un fake y la app pasa el SMTP real — mismo código, dos mundos. Es el DIP de SOLID y la base de la inyección de dependencias.

## ¿Qué viola el Principio de Sustitución de Liskov?
Un hijo que no puede usarse donde se espera el padre. Clásico: `Cuadrado extends Rectangulo` cuyo `setAlto` también cambia el ancho.

### porque
El contrato del padre dice "alto y ancho son independientes"; el cuadrado lo rompe. El caller que razona según el contrato se rompe en runtime. LSP no es sobre sintaxis sino sobre semántica: si el hijo sorprende al que usa el padre, la jerarquía está mal aunque compile.

## ¿Qué es una "razón para cambiar" en SRP?
Un actor/grupo de interés que pide cambios: el mismo motivo de negocio. Una clase debe tener uno solo.

### porque
Si Contabilidad y Marketing piden cambios a la misma clase, un cambio de uno puede romper al otro. SRP no es "una clase = un método": es alinear clases con actores, para que cambios de un actor no toquen código que otro actor depende.

## ¿Qué habilita la inyección de dependencias?
Que la clase reciba sus dependencias desde afuera (constructor) en vez de crearlas adentro (`new`).

### porque
Con `new` adentro no hay forma de cambiar la implementación ni de testear. Inyectada, el test pasa un double y la app pasa la real — la clase no sabe la diferencia. DI no es un framework: es simplemente pasar lo que necesitás por parámetro.

## ¿Cuándo usar Strategy?
Cuando un algoritmo/comportamiento varía por caso y crece con if/else encadenados sobre el mismo dato. Cada variante se vuelve una clase con la misma interface.

### porque
El `if/else` sobre "tipo de descuento" crece en cada variante nueva y se duplica en cada lugar que calcula. Strategy convierte cada rama en una clase: agregar variante = clase nueva, el resto intacto. Cuándo NO: 2 variantes estables — una estrategia por un solo if es sobre-ingeniería.

## ¿Qué desacopla el patrón Observer?
Emisor y receptores: el emisor notifica un evento sin saber quiénes ni cuántos escuchan.

### porque
La alternativa es que el emisor llame a cada interesado — cada listener nuevo exige tocar el emisor. Con Observer, listeners se registran solos. Cuidado: el flujo se vuelve difícil de seguir (¿quién reaccionó a este evento?) — usarlo para efectos secundarios, no para el flujo principal del caso de uso.

## ¿Decorator vs herencia para agregar comportamiento?
Decorator envuelve al objeto con la misma interface y le suma algo antes/después de delegar. La herencia suma comportamiento compilando una nueva clase fija.

### porque
Herencia apila: `CafeConLecheConAzucelDoble` — explosión de combinaciones, cada una una clase. Decorator compone en runtime: `new Azucar(new Leche(new Cafe()))` — combinaciones infinitas con 3 clases. Mismo contrato, capas apilables: la clave es que el decorator ES lo que decora.

## ¿Cuándo aporta Factory Method?
Cuando crear el objeto requiere decidir (qué subclase, configuración, lookup) y esa decisión no le corresponde al caller.

### porque
Si el caller hace `new Concreta()`, conoce y repite la decisión en cada uso. La factory concentra la creación en un punto: cambiar la decisión toca un solo lugar. Cuándo NO: `new` trivial sin decisiones — una factory que solo devuelve `new X()` es indirection gratis.

## ¿Qué pide la Ley de Deméter ("talk only to friends")?
Hablar solo con tus colaboradores directos: `a.b().c().d()` es una cadena que conoce la estructura interna de otros.

### porque
Cada eslabón de la cadena es un acoplamiento: si B deja de exponer C, rompés. La alternativa es "tell, don't ask": en vez de pedir datos y decidir afuera, le pedís al objeto que haga (`envio.costoTotal()` en vez de `envio.items().sum(...)`). Regla práctica: solo un punto.

## ¿Cuándo un patrón deja de sumar?
Cuando resuelve una variación que no existe todavía. Patrón = indirection pagada con complejidad: la mayoría solo se justifica cuando la segunda variante ya llegó.

### porque
"Patrón por las dudas" te deja 5 abstracciones para 1 implementación: cada cambio cruza capas que no varían. La señal de sobre-ingeniería: tocar una feature simple exige editar 4 archivos. Regla de tres: la primera vez, código directo; la segunda, incomodidad; la tercera, recién ahí extraés la abstracción.
