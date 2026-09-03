---
deck: PostgreSQL y Prisma — Entrevista
tags: [postgres, prisma, sql, backend]
fuente: Generado con prompts/generar-mazo.md
---

## ¿Qué hace un índice B-tree y cuándo NO ayuda?
Estructura ordenada que convierte búsquedas O(n) en O(log n) sobre la columna indexada. No ayuda en `LIKE '%x'` (prefijo comodín), ni en columnas de baja selectividad (booleanos).

### porque
El B-tree busca por orden: un prefijo `%x` no define rango ordenable → escaneo igual. Y si el 90% de las filas comparten el valor, el planner prefiere seq scan (leer todo directo es más barato que saltar por el índice). Índice = decisión del planner con estadísticas, no magia: siempre `EXPLAIN` antes de asumir.

### distractores
- Ayuda igual en `LIKE '%x'`: el índice ordena la columna completa, no le importa dónde está el comodín.
- Reordena físicamente la tabla según la columna indexada al crearlo.
- Si la columna está indexada, el planner siempre elige index scan por sobre seq scan.

## ¿Cómo se resuelve el N+1 en Prisma?
Una sola query con `include`/`select` anidado: `prisma.user.findMany({ include: { posts: true } })` trae usuarios y sus posts en dos queries (o una con join), no 1+N.

### porque
Cada acceso lazy a una relación dispara su query: 100 usuarios → 101 round-trips. El `include` agrupa: Prisma resuelve las relaciones en batch. La trampa inversa: `include` sin `select` trae TODAS las columnas de todas las relaciones — en listados, `select` explícito reduce payload y evita tocar datos que no necesitás.

### distractores
- Filtrar los posts en memoria después del `findMany` de usuarios: una sola query, problema resuelto.
- Cachear cada relación en Redis para no repetir las N queries.
- Bajar a `$queryRaw` con un JOIN a mano: es la única salida del N+1 en Prisma.

## ¿select vs include en Prisma?
`include` AGREGA relaciones al fetch completo; `select` ELIGE exactamente qué columnas y relaciones traer (y permite escoger campos de las relaciones).

### porque
`include` es cómodo pero todo-o-nada: trae la fila entera de cada relación. `select` devuelve exactamente lo que la vista usa — menos payload por la red, y un contrato explícito: si la vista solo usa `id` y `title`, que la query pida solo eso. Regla: `include` para desarrollo/admin, `select` para endpoints y listados.

### distractores
- `include` trae solo lo necesario de las relaciones; `select` es solo azúcar de sintaxis.
- `select` no funciona sobre relaciones: para eso hay que usar `include` sí o sí.
- Se pueden usar juntos en el mismo nivel: `include` agrega relaciones a lo elegido con `select`.

## ¿Qué garantiza una transacción (ACID aplicado)?
Atomicidad (todo o nada), consistencia (constraints respetados), aislamiento (transacciones concurrentes no se pisan) y durabilidad (commit = sobrevive al crash).

### porque
El caso canónico: transferencia bancaria — debitar sin acreditar deja dinero volando. La transacción agrupa operaciones con rollback automático al primer fallo. En Prisma: `$transaction([op1, op2])` batch o `$transaction(async tx => ...)` interactiva para leer-decidir-escribir con aislamiento.

### distractores
- Ejecutar las operaciones juntas las hace más rápidas: menos round-trips al motor.
- Durabilidad significa que cada INSERT escribe a disco inmediatamente, no en el COMMIT.
- La consistencia repara los datos inválidos encontrados durante el rollback.

## ¿Transacción batch vs interactiva en Prisma?
Batch: array de operaciones, todas juntas. Interactiva: función async que recibe `tx` y decide en el medio (leer, calcular, escribir).

### porque
La batch es simple pero no puede leer para decidir (el resultado no está hasta commitear). La interactiva permite `tx.card.findUnique` → calcular SM-2 → `tx.card.update` + `tx.reviewLog.create` con aislamiento. Limitación real que vivimos: los adapters HTTP serverless (Neon HTTP) a veces no las soportan — en ese caso, operaciones secuenciales con orden auto-reparable.

### distractores
- La batch también puede leer resultados intermedios: la resolución es la misma en ambas.
- La interactiva mantiene la transacción abierta hasta que el cliente responde.
- En la batch, si una operación falla, las anteriores quedan aplicadas porque se commitean por separado.

## ¿INNER JOIN vs LEFT JOIN?
INNER: solo filas con match en ambas tablas. LEFT: todas las de la izquierda + match o NULL si no hay.

### porque
La diferencia cambia el RESULTADO, no solo la performance: contar pedidos por usuario con INNER excluye a los usuarios sin pedidos (¡reporte mentiroso!). LEFT los conserva con 0/NULL. Regla: la pregunta de negocio decide — "¿usuarios CON pedidos?" INNER; "¿todos los usuarios y sus pedcidos si tienen?" LEFT.

### distractores
- LEFT JOIN trae todas las filas de ambas tablas, tengan match o no.
- La diferencia entre INNER y LEFT es solo de performance: el resultado es el mismo.
- INNER es la opción correcta por defecto porque nunca genera NULLs espurios.

## ¿WHERE vs HAVING?
WHERE filtra filas ANTES de agrupar; HAVING filtra grupos DESPUÉS del GROUP BY.

### porque
Es una cuestión de orden de evaluación: WHERE corre por fila (no puede usar agregados), HAVING corre por grupo (puede: `HAVING COUNT(*) > 5`). Clásico: "clientes con más de 3 pedidos" → GROUP BY cliente + HAVING count > 3. Filtrar temprano en WHERE cuando se puede: menos filas entran al agrupado.

### distractores
- HAVING filtra las filas antes del GROUP BY para que agrupen menos datos.
- WHERE acepta agregados si van entre paréntesis: `WHERE (COUNT(*)) > 5`.
- HAVING es la sintaxis antigua de WHERE: son intercambiables.

## ¿Índice compuesto — por qué importa el orden de columnas?
El B-tree ordena por la primer columna, luego la segunda, etc. El índice sirve a queries que filtran por el prefijo (izquierda) del orden.

### porque
Índice `(deckSlug, dueAt)` resuelve `WHERE deckSlug = X AND dueAt <= Y` y `WHERE deckSlug = X`, pero NO `WHERE dueAt <= Y` solo — sin la primer columna no hay punto de entrada al orden. Regla: columnas de igualdad primero, la de rango última. Un índice por cada patrón de query real, verificado con EXPLAIN.

### distractores
- El orden no importa: el índice sirve a cualquier combinación de sus columnas.
- La columna de rango va primera para acotar el conjunto desde el inicio.
- La columna más selectiva va primera aunque la query no la filtre por igualdad.

## ¿Por qué existe el connection pool y qué rompe sin él?
Un stock fijo de conexiones reutilizadas entre requests. Sin pool: una conexión TCP nueva por request (cara) y Postgres se satura (max_connections).

### porque
Cada conexión Postgres es un proceso con memoria — el default (~100) se agota con decenas de requests concurrentes. El pool abre N y las presta en serie. En serverless es crítico: cada invocación es un proceso nuevo; sin pool (o con uno por invocación) agotás las conexiones — de ahí PgBouncer/pooler de Neon y el patrón singleton del cliente Prisma.

### distractores
- El pool multiplexa una única conexión física para todas las queries concurrentes.
- Con pool ninguna query espera nunca: abre conexiones nuevas bajo demanda, sin límite.
- Agrandar el pool siempre mejora el throughput: más conexiones, más paralelismo.

## ¿Por qué migrar con archivos versionados y no con SQL a mano?
La migración es el historial auditable y reproducible del schema: mismo comando aplica lo pendiente en cualquier entorno (dev, CI, prod).

### porque
SQL a mano diverge: "ya lo corrí en mi BD" no existe para el nuevo dev ni para prod. `migrate deploy` aplica solo lo pendiente, en orden, una vez — el estado vive en la propia BD. Regla del proyecto: schema.prisma es la fuente, la migración es el diff congelado, y jamás se edita una migración ya aplicada.

### distractores
- Las migraciones se regeneran del schema en cada deploy: no hace falta historial.
- `db push` en prod es equivalente para cambios chicos y más rápido.
- El estado aplicado se deduce comparando contra el schema: registrar qué se corrió es redundante.

## ¿Qué hace ON DELETE CASCADE en una FK?
Borrar el padre borra en cascada sus hijos referenciados, en la BD, sin código de por medio.

### porque
Sin cascade, borrar el padre viola la FK (o dejás huérfanos si la FK es nullable). Con cascade la integridad la garantiza la BD, no tu servicio — imposible dejar huérfanos por un bug. La contracara: borrados masivos sorpresa si la relación es más profunda de lo que recordás. En Prisma se declara en el relation (`onDelete: Cascade`).

### distractores
- Al borrar el padre, setea NULL en la FK de los hijos: los desvincula sin borrarlos.
- Bloquea el borrado del padre si tiene hijos: eso es lo que hace cascade.
- Solo cascadea desde el ORM; un DELETE directo por SQL deja los hijos huérfanos.

## ¿upsert en Prisma — cuándo y con qué cuidado?
`upsert` = update si existe, create si no, atómico. Ideal para seeds e idempotencia.

### porque
La alternativa leer-then-escribir tiene una race: dos requests concurrentes pueden ambos "no encontrar" y crear duplicados. El upsert lo resuelve la BD (INSERT ... ON CONFLICT). Cuidado del proyecto: en un seed, el `update` solo toca contenido — jamás el estado derivado (SRS), o pisás el progreso del usuario.

### distractores
- upsert elimina la race aunque la tabla no tenga unique constraint: la BD serializa igual.
- En un seed, el update del upsert debería resetear también el estado derivado para dejar todo consistente.
- upsert reemplaza la fila entera: los campos ausentes vuelven a sus valores default.

## ¿Para qué sirve EXPLAIN (y EXPLAIN ANALYZE)?
Muestra el plan de ejecución: qué usa el planner (seq scan, index scan, join strategy). `ANALYZE` además lo ejecuta y reporta tiempos reales.

### porque
Es el único modo de saber si tu índice se usa: agregarlo y asumir es fe. Seq scan en tabla chica es correcto; index scan esperado pero seq scan real = índice inútil o estadísticas viejas. El workflow: escribir la query → EXPLAIN ANALYZE → leer costos/filas reales vs estimadas → ajustar índice o query.

### distractores
- EXPLAIN ejecuta la query en un modo sandbox para medirla sin tocar la caché.
- ANALYZE devuelve los mismos números que EXPLAIN, solo que con decimales.
- Sirve para validar la sintaxis de la query antes de ejecutarla en producción.

## ¿Cuándo desnormalizar (y cuándo es el clásico error)?
Denormalizar = guardar datos derivados (contador, snapshot) para evitar joins/agregaciones en caliente. Se justifica con lectura intensiva y tolerancia a inconsistencia transitoria.

### porque
Normalizado siempre es consistente pero cada lectura paga joins. Desnormalizar mueve el costo a la escritura: `post.commentsCount` es O(1) de leer pero cada comentario debe actualizarlo. El error clásico: desnormalizar ANTES de medir — la mayoría de las "optimizaciones" mueren ante un índice bien puesto. Medí, desnormalizá lo que duele, y documentá la sincronización.

### distractores
- Desnormalizar preventivamente todo contador: lo normalizado no escala jamás.
- Desnormalizar es replicar la tabla en otra BD para descargar las lecturas.
- El contador desnormalizado siempre refleja el valor exacto en el mismo instante del write.

## ¿Por qué un SELECT no bloquea un INSERT concurrente en Postgres?
Por MVCC: cada transacción lee un snapshot de las filas visibles, y el INSERT/UPDATE crea nuevas versiones en vez de pisar las existentes. Readers y writers nunca se pelean por la misma fila.

### porque
Cada versión de fila guarda xmin/xmax y tu snapshot decide cuál ves. El único lock real es escritura-escritura sobre la MISMA fila (el segundo UPDATE espera al primero). La contracara del MVCC: las versiones viejas mueren pero quedan físicamente hasta que algo las reclame — de ahí VACUUM. Error clásico: creer que un UPDATE grande bloquea los SELECT de esa tabla.

### distractores
- El SELECT toma un lock compartido por fila y lo libera al terminar de leer.
- Los INSERT no generan locks: solo bloquean UPDATE y DELETE.
- El SELECT espera a que el INSERT commitee para leer la versión nueva de la fila.

## ¿Qué anomalía permite cada nivel de aislamiento?
Read committed (default): non-repeatable read — dos lecturas de la misma fila dentro de una transacción pueden diferir. Repeatable read: lectura estable por snapshot, pero permite write skew. Serializable: ninguna — aborta con serialization failure.

### porque
Criterio: si la transacción lee para decidir una escritura (stock, turnos, saldos), repeatable read NO alcanza — el write skew pasa por debajo del snapshot. O serializable con retry (40001), o lock explícito (SELECT ... FOR UPDATE). Error clásico: activar serializable sin lógica de reintento — el abort llega y la operación se pierde silenciosamente.

### distractores
- Read committed no permite anomalías: es el default justamente por ser el más seguro.
- Repeatable read evita el write skew porque el snapshot es estable.
- Serializable elimina las anomalías sin costo: solo aborta ante un deadlock.

## ¿VACUUM vs ANALYZE — para qué sirve cada uno?
VACUUM reclama el espacio de las filas muertas que dejó el MVCC; ANALYZE actualiza las estadísticas de distribución que usa el planner para elegir planes. Uno limpia storage, el otro alimenta al planificador.

### porque
Son complementarios, no sinónimos. Autovacuum cubre la rutina, pero un bulk load masivo lo desborda: sin ANALYZE posterior el planner estima cualquier cosa y el índice nuevo "no se usa". Error clásico: crear un índice tras cargar millones de filas y culpar al índice en vez de a las estadísticas viejas.

### distractores
- VACUUM actualiza las estadísticas del planner; ANALYZE borra las filas muertas.
- VACUUM FULL es la versión rutinaria: se corre en producción sin bloquear.
- ANALYZE compacta los índices de la tabla para reclaimar espacio.

## ¿Por qué el dinero nunca va en float?
float guarda binario: 0.1 no es representable y el error de redondeo se acumula en cada suma. numeric es decimal exacto de precisión arbitraria — el único tipo para montos.

### porque
El clásico: reporte donde los ítems suman X y el total da X ± centavos. Alternativa válida: int en centavos. En Prisma, Decimal mapea a numeric y devuelve Decimal (no number) — castearlo a number JS reintroduce el problema. Error típico: "redondeo al final" — el error ya quedó adentro de las sumas intermedias.

### distractores
- Con float alcanza: redondear a 2 decimales en cada operación elimina el error.
- double precision resuelve el problema: con 15 dígitos el error desaparece.
- El error solo aparece en las divisiones; sumas y restas de float son exactas.

## ¿timestamp vs timestamptz — por qué siempre timestamptz?
timestamptz NO guarda la zona: guarda el instante absoluto normalizado a UTC y lo muestra en la zona de quien lee. timestamp sin zona guarda un valor ambiguo, sin referencia.

### porque
Error doble clásico: creer que timestamptz "guarda la zona del cliente" (la descarta), o guardar horas locales sin zona con el servidor en otra. El DST lo hace real: la misma hora local existe dos veces al atrasar el reloj. Regla: instantes absolutos (createdAt, dueAt) → timestamptz; valores civiles (fecha de nacimiento) → date. Dato Prisma: DateTime mapea a timestamp sin zona salvo que anotes `@db.Timestamptz`.

### distractores
- timestamptz guarda el instante y la zona horaria del cliente (por eso el nombre).
- timestamp sin zona es más seguro: evita las conversiones automáticas del servidor.
- La fecha de nacimiento va en timestamptz para poder ordenar por edad.

## ¿Enum nativo, tabla de referencia o string para un status?
Enum de Postgres: validación en la BD y orden declarado, pero cada valor nuevo es un ALTER TYPE. Tabla de referencia: FK + metadatos por estado (color, orden, descripción). String: cero validación.

### porque
Criterio: estados estables del dominio → enum; workflow que evoluciona o necesita datos extra → tabla con FK; string solo si la validación vive fuera de la BD. Error clásico: enum para un workflow y terminar migrando por cada estado que agrega el negocio. Y quitar valores de un enum no se puede: es la migración más dolorosa que existe.

### distractores
- Agregar un valor al enum es un INSERT en el catálogo, como en cualquier tabla.
- Quitar un valor del enum es un simple UPDATE del catálogo de tipos.
- Un string validado en el ORM equivale al enum de Postgres: misma garantía, más flexible.

## ¿JSONB vs columnas normales — cuándo cada uno?
Columnas: schema estable, tipos, constraints, FK y estadísticas del planner. JSONB: payload variable por fila (respuesta de API externa, atributos por tenant), consultable con `@>` e indexable con GIN.

### porque
El índice GIN indexa el contenido del documento: la contención `@>` responde sin escanear. Error clásico: "JSONB por flexibilidad" en datos que en realidad son fijos — perdés FK, tipos y el planner estima mal (los operadores jsonb tienen selectividad pobre). Regla: si el campo aparece en WHERE/JOIN o referencia otra tabla, columna; si es verdaderamente variable, JSONB + GIN.

### distractores
- Con índice GIN, filtrar por cualquier campo del JSONB rinde igual que una columna indexada.
- JSONB guarda el texto tal cual: su ventaja es validar que el documento sea JSON válido.
- Un índice B-tree sobre la columna JSONB completa acelera el operador `@>`.

## ¿FK nullable vs NOT NULL — qué cambia?
NOT NULL: la relación es obligatoria, toda fila referencia un padre. Nullable: relación opcional — NULL significa "sin padre", no cero.

### porque
Es semántica de dominio, no detalle técnico: un order sin user es imposible → NOT NULL; post.deletedBy puede no existir → nullable. Error clásico: nullable "por las dudas" → LEFT JOINs que sorprenden y filas cuya ausencia nadie sabe interpretar (¿no se cargó o no corresponde?). En Prisma es la relación opcional (?) vs requerida del schema.

### distractores
- NULL en la FK equivale a cero: significa que el padre es "ninguno" con id 0.
- Nullable por defecto es más seguro: evita errores de inserción y se completa después.
- NOT NULL en la FK impide borrar el padre: es el equivalente de ON DELETE RESTRICT.

## ¿Unique constraint vs unique index — son lo mismo?
El constraint es la regla lógica de integridad declarada en la tabla; el unique index es el mecanismo físico que la implementa. Crear el constraint crea su índice; el índice suelto NO es un constraint.

### porque
Diferencia concreta: una FK solo puede referenciar un PK o unique CONSTRAINT, no un índice único anónimo. El índice suelto brilla en reglas condicionales: "un solo admin activo por equipo" se expresa como partial unique index (`WHERE activo`), que el constraint simple no sabe decir. Error clásico: ver un unique index en la BD y asumir que el schema declara la regla.

### distractores
- Son lo mismo: una FK puede referenciar cualquiera de los dos.
- El unique index suelto declara la regla igual: queda registrado en el schema de la tabla.
- "Un solo admin activo por equipo" se declara con un CHECK constraint en la tabla.

## ¿Soft delete vs DELETE físico — qué elige qué?
Soft delete: marcar `deletedAt` y filtrarlo en cada query — recuperable y auditable, a costa de contaminar todas las consultas. Físico: simple y rápido, sin retorno.

### porque
Criterio: recuperación, auditoría u obligación legal → soft; datos transitorios → físico. Costos ocultos del soft: TODO query debe filtrar (el que se olvida = bug de privacidad) y el "derecho al olvido" (GDPR) exige borrado físico igual. Error clásico: soft delete sin índice parcial — la tabla se llena de muertos y los índices cubren filas invisibles.

### distractores
- Con soft delete el GDPR queda cubierto: como no se muestra el dato, no hace falta borrarlo físicamente.
- El ORM filtra `deletedAt` automáticamente en toda query: no hay que acordarse.
- Soft delete es siempre más rápido: no borra las filas realmente, solo marca bytes.

## ¿Vista vs vista materializada — cuándo cada una?
La vista guarda la query y la corre en cada acceso (siempre fresca, paga en cada lectura). La materializada guarda el resultado físico y solo cambia cuando ejecutás REFRESH.

### porque
Criterio: agregación cara que tolera staleness (dashboard, reportes) → materializada con refresh programado; frescura obligatoria → vista normal. Detalle que muerde: REFRESH bloquea lectores salvo CONCURRENTLY, que a su vez exige un unique index. Error clásico: materializada sin definir quién y cuándo refresca — datos viejos que nadie notó.

### distractores
- La vista normal cachea el resultado del primer acceso y lo invalida con triggers.
- La materializada se refresca sola en cada commit de las tablas base.
- REFRESH CONCURRENTLY funciona sin índice unique: solo es un poco más lento.

## ¿LIKE, ILIKE, full-text o trigram — qué busca qué?
`LIKE 'pref%'` aprovecha un B-tree; `'%sub%'` no usa nada estándar. Full-text (tsvector + GIN) busca lenguaje natural con ranking y stemming; pg_trgm + GIN resuelve substrings y fuzzy en tablas grandes.

### porque
Criterio por caso de uso: autocompletado → B-tree o trigram; búsqueda libre en textos → tsvector con ranking por relevancia; "contiene en cualquier lado" → trigram. Error clásico: `ILIKE '%q%'` sobre millones de filas — seq scan total por keystroke, y creer que un índice común lo salva (no: necesita trigram).

### distractores
- Un índice B-tree en la columna acelera también el `'%sub%'`: ordena igual y salta al substring.
- `LIKE 'q%'` no usa índice: cualquier comodín rompe el orden, aunque esté al final.
- tsvector con GIN es la mejor herramienta para buscar substrings parciales dentro de una palabra.

## ¿count(*), count(col) o estimado?
`count(*)` cuenta todas las filas; `count(col)` solo las que tienen col NOT NULL — semántica distinta, performance igual. Para UIs sobre tablas grandes: estimado (reltuples) o contador desnormalizado.

### porque
count(*) no tiene atajo en Postgres: el MVCC impide saber cuántas filas son visibles para TU snapshot sin recorrerlas (index-only scan en el mejor caso). Error clásico: count(id) "por performance" — no es más rápido Y cambia el resultado con NULLs. Y "1.234 resultados" estimado es mejor UX que un count exacto que tarda segundos.

### distractores
- count(1) es más rápido que count(*): el asterisco expande todas las columnas.
- count(col) es más rápido porque lee una sola columna en vez de todas.
- count(*) lee un contador interno de la tabla: el MVCC lo mantiene actualizado en cada commit.

## ¿CTE vs subquery — y qué agrega WITH RECURSIVE?
Para filtros simples son equivalentes: el CTE nombra el paso intermedio y lo reusa. WITH RECURSIVE itera sobre su propio resultado: recorre árboles y grafos que una join plana no expresa.

### porque
El CTE gana cuando el mismo subquery se usa dos veces o la query tiene etapas que merecen nombre. Lo recursivo resuelve lo iterativo: árbol de categorías, rutas en grafo, series de fechas. Dato: desde PG12 los CTE no recursivos se inlinean (antes eran optimización-fence). Error clásico: recursión sin condición de término → query que nunca termina.

### distractores
- Todo CTE se materializa una vez y actúa de optimización-fence: el planner nunca lo inlinea.
- La recursión corta sola tras N iteraciones: no hace falta condición de término.
- El CTE recursivo siempre se puede reemplazar por un JOIN plano: es solo sintaxis más clara.

## ¿Qué resuelven las window functions si ya existe GROUP BY?
GROUP BY colapsa N filas en una por grupo; la ventana calcula sobre el conjunto SIN colapsar: ROW_NUMBER por grupo, rankings, running totals, LAG contra la fila anterior.

### porque
"Top 3 posts por autor" es imposible con GROUP BY puro: el agregado pierde la fila. La ventana la conserva: `ROW_NUMBER() OVER (PARTITION BY autor ORDER BY vistas)` y filtrar ≤ 3 en un wrapper. Detalle de evaluación: la ventana corre DESPUÉS de WHERE — filtrar por su resultado exige subquery o CTE.

### distractores
- La ventana corre antes de WHERE: por eso puede filtrarse por su resultado directo.
- ROW_NUMBER() OVER deja una fila por grupo, igual que GROUP BY.
- Los running totals se hacen con GROUP BY + ORDER BY en el agregado.

## ¿OFFSET vs keyset (cursor) — por qué OFFSET no escala?
OFFSET n lee y DESCARTA n filas antes de servir la página: la página 500 paga el precio completo en cada request. Keyset: `WHERE (createdAt, id) < (último_visto)` + ORDER BY + LIMIT, directo por el índice.

### porque
Además del costo, OFFSET es inestable: inserts entre páginas desplazan filas (duplicados y huecos). Keyset exige un orden único y estable (id, o createdAt+id como tupla) con índice que matchee exacto. En Prisma: skip/take es OFFSET puro; cursor + orderBy único tira hacia keyset. Error clásico: page×take creciente creyendo que el LIMIT abarata la query.

### distractores
- OFFSET con LIMIT chico es barato: solo lee las filas de la página pedida.
- Keyset también salta a una página arbitraria (la 50) con el mismo costo que la primera.
- El problema de OFFSET es solo de costo: los resultados son estables entre páginas.

## ¿Qué rompe pgBouncer en modo transaction?
Que cada sentencia puede caer en una conexión distinta: todo estado de SESIÓN se pierde entre sentencias — prepared statements, SET, advisory locks, LISTEN/NOTIFY. Prisma lo declara con `pgbouncer=true` en la URL.

### porque
Transaction pooling es lo que permite multiplexar miles de invocaciones serverless sobre pocas conexiones reales (Neon lo aplica por defecto). El síntoma canónico: "prepared statement does not exist" intermitente. Error clásico: serverless + pooler sin ese flag — funciona en pruebas y explota aleatoriamente bajo carga.

### distractores
- Transaction mode rompe BEGIN/COMMIT: no se pueden usar transacciones de más de una sentencia.
- El modo session es el ideal para serverless: una conexión persistente por invocación.
- Los advisory locks de sesión se conservan porque viven en la transacción, no en la conexión.

## ¿Relación declarada en el schema vs JOIN manual — qué gana?
La relación genera la API tipada: include, create anidado y filtros sobre la relación (`where: { posts: { some: ... } }`) que Prisma traduce al JOIN/EXISTS. El JOIN manual es SQL crudo sin tipos inferidos.

### porque
El schema es documentación viva: anidar filtros compila, se autocompleta y sigue tipado cuando el modelo cambia; el crudo se revisa a mano en cada refactor. Cuándo el manual: cuando la query necesita algo que la API no expresa — no por el mito de que "el SQL a mano siempre es más rápido".

### distractores
- El JOIN manual siempre es más rápido que lo que genera la API de Prisma.
- Los filtros anidados sobre relaciones se resuelven en memoria: Prisma trae las filas y filtra en JS.
- Declarar la relación en el schema es solo documentación: no cambia las queries generadas.

## ¿Cuándo bajar a $queryRaw en Prisma?
Cuando la query no es expresable en la API: WITH RECURSIVE, window functions, FILTER en agregados, hints del planner, operadores jsonb exóticos. Para todo lo demás, la API tipada.

### porque
El costo del raw: pierde el tipado del resultado (campos crudos a castear a mano), no valida contra el schema y es superficie de inyección — siempre el tagged template `Prisma.sql`, jamás strings concatenados. Error clásico: raw por vicio donde `findMany` + where anidado ya existía; el criterio es "¿la API PUEDE expresarlo?", no "¿me sale más rápido escribirlo?".

### distractores
- El tagged template Prisma.sql también tipa el resultado: castear a mano sobra.
- $queryRaw valida la query contra el schema antes de mandarla al motor.
- Concatenar strings está bien si escapás las comillas a mano.

## ¿Qué es el drift entre schema.prisma y la base real?
Que el modelo y la BD divergen: alguien editó el schema sin generar migración, tocó la BD a mano, o corrió `db push` en un entorno compartido.

### porque
El síntoma: `migrate dev` detecta el drift y en dev propone reset (pérdida de datos); en prod ya es incidente. Profilaxis: migraciones generadas con `migrate dev`, aplicadas con `migrate deploy` en todos lados, y `migrate status`/`validate` en CI. Error clásico: "ya lo arreglé con un ALTER directo en prod" — la próxima migración nace inconsistente.

### distractores
- El drift se arregla corriendo `db push` en prod para alinear la BD con el schema.
- `migrate deploy` regenera las migraciones desde el schema actual y reemplaza las viejas.
- El drift es cosmético: como el schema es la fuente de verdad, el estado real de la BD no importa.
