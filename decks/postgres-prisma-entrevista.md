---
deck: PostgreSQL y Prisma — Entrevista
tags: [postgres, prisma, sql, backend]
fuente: Generado con prompts/generar-mazo.md
---

## ¿Qué hace un índice B-tree y cuándo NO ayuda?
Estructura ordenada que convierte búsquedas O(n) en O(log n) sobre la columna indexada. No ayuda en `LIKE '%x'` (prefijo comodín), ni en columnas de baja selectividad (booleanos).

### porque
El B-tree busca por orden: un prefijo `%x` no define rango ordenable → escaneo igual. Y si el 90% de las filas comparten el valor, el planner prefiere seq scan (leer todo directo es más barato que saltar por el índice). Índice = decisión del planner con estadísticas, no magia: siempre `EXPLAIN` antes de asumir.

## ¿Cómo se resuelve el N+1 en Prisma?
Una sola query con `include`/`select` anidado: `prisma.user.findMany({ include: { posts: true } })` trae usuarios y sus posts en dos queries (o una con join), no 1+N.

### porque
Cada acceso lazy a una relación dispara su query: 100 usuarios → 101 round-trips. El `include` agrupa: Prisma resuelve las relaciones en batch. La trampa inversa: `include` sin `select` trae TODAS las columnas de todas las relaciones — en listados, `select` explícito reduce payload y evita tocar datos que no necesitás.

## ¿select vs include en Prisma?
`include` AGREGA relaciones al fetch completo; `select` ELIGE exactamente qué columnas y relaciones traer (y permite escoger campos de las relaciones).

### porque
`include` es cómodo pero todo-o-nada: trae la fila entera de cada relación. `select` devuelve exactamente lo que la vista usa — menos payload por la red, y un contrato explícito: si la vista solo usa `id` y `title`, que la query pida solo eso. Regla: `include` para desarrollo/admin, `select` para endpoints y listados.

## ¿Qué garantiza una transacción (ACID aplicado)?
Atomicidad (todo o nada), consistencia (constraints respetados), aislamiento (transacciones concurrentes no se pisan) y durabilidad (commit = sobrevive al crash).

### porque
El caso canónico: transferencia bancaria — debitar sin acreditar deja dinero volando. La transacción agrupa operaciones con rollback automático al primer fallo. En Prisma: `$transaction([op1, op2])` batch o `$transaction(async tx => ...)` interactiva para leer-decidir-escribir con aislamiento.

## ¿Transacción batch vs interactiva en Prisma?
Batch: array de operaciones, todas juntas. Interactiva: función async que recibe `tx` y decide en el medio (leer, calcular, escribir).

### porque
La batch es simple pero no puede leer para decidir (el resultado no está hasta commitear). La interactiva permite `tx.card.findUnique` → calcular SM-2 → `tx.card.update` + `tx.reviewLog.create` con aislamiento. Limitación real que vivimos: los adapters HTTP serverless (Neon HTTP) a veces no las soportan — en ese caso, operaciones secuenciales con orden auto-reparable.

## ¿INNER JOIN vs LEFT JOIN?
INNER: solo filas con match en ambas tablas. LEFT: todas las de la izquierda + match o NULL si no hay.

### porque
La diferencia cambia el RESULTADO, no solo la performance: contar pedidos por usuario con INNER excluye a los usuarios sin pedidos (¡reporte mentiroso!). LEFT los conserva con 0/NULL. Regla: la pregunta de negocio decide — "¿usuarios CON pedidos?" INNER; "¿todos los usuarios y sus pedcidos si tienen?" LEFT.

## ¿WHERE vs HAVING?
WHERE filtra filas ANTES de agrupar; HAVING filtra grupos DESPUÉS del GROUP BY.

### porque
Es una cuestión de orden de evaluación: WHERE corre por fila (no puede usar agregados), HAVING corre por grupo (puede: `HAVING COUNT(*) > 5`). Clásico: "clientes con más de 3 pedidos" → GROUP BY cliente + HAVING count > 3. Filtrar temprano en WHERE cuando se puede: menos filas entran al agrupado.

## ¿Índice compuesto — por qué importa el orden de columnas?
El B-tree ordena por la primer columna, luego la segunda, etc. El índice sirve a queries que filtran por el prefijo (izquierda) del orden.

### porque
Índice `(deckSlug, dueAt)` resuelve `WHERE deckSlug = X AND dueAt <= Y` y `WHERE deckSlug = X`, pero NO `WHERE dueAt <= Y` solo — sin la primer columna no hay punto de entrada al orden. Regla: columnas de igualdad primero, la de rango última. Un índice por cada patrón de query real, verificado con EXPLAIN.

## ¿Por qué existe el connection pool y qué rompe sin él?
Un stock fijo de conexiones reutilizadas entre requests. Sin pool: una conexión TCP nueva por request (cara) y Postgres se satura (max_connections).

### porque
Cada conexión Postgres es un proceso con memoria — el default (~100) se agota con decenas de requests concurrentes. El pool abre N y las presta en serie. En serverless es crítico: cada invocación es un proceso nuevo; sin pool (o con uno por invocación) agotás las conexiones — de ahí PgBouncer/pooler de Neon y el patrón singleton del cliente Prisma.

## ¿Por qué migrar con archivos versionados y no con SQL a mano?
La migración es el historial auditable y reproducible del schema: mismo comando aplica lo pendiente en cualquier entorno (dev, CI, prod).

### porque
SQL a mano diverge: "ya lo corrí en mi BD" no existe para el nuevo dev ni para prod. `migrate deploy` aplica solo lo pendiente, en orden, una vez — el estado vive en la propia BD. Regla del proyecto: schema.prisma es la fuente, la migración es el diff congelado, y jamás se edita una migración ya aplicada.

## ¿Qué hace ON DELETE CASCADE en una FK?
Borrar el padre borra en cascada sus hijos referenciados, en la BD, sin código de por medio.

### porque
Sin cascade, borrar el padre viola la FK (o dejás huérfanos si la FK es nullable). Con cascade la integridad la garantiza la BD, no tu servicio — imposible dejar huérfanos por un bug. La contracara: borrados masivos sorpresa si la relación es más profunda de lo que recordás. En Prisma se declara en el relation (`onDelete: Cascade`).

## ¿upsert en Prisma — cuándo y con qué cuidado?
`upsert` = update si existe, create si no, atómico. Ideal para seeds e idempotencia.

### porque
La alternativa leer-then-escribir tiene una race: dos requests concurrentes pueden ambos "no encontrar" y crear duplicados. El upsert lo resuelve la BD (INSERT ... ON CONFLICT). Cuidado del proyecto: en un seed, el `update` solo toca contenido — jamás el estado derivado (SRS), o pisás el progreso del usuario.

## ¿Para qué sirve EXPLAIN (y EXPLAIN ANALYZE)?
Muestra el plan de ejecución: qué usa el planner (seq scan, index scan, join strategy). `ANALYZE` además lo ejecuta y reporta tiempos reales.

### porque
Es el único modo de saber si tu índice se usa: agregarlo y asumir es fe. Seq scan en tabla chica es correcto; index scan esperado pero seq scan real = índice inútil o estadísticas viejas. El workflow: escribir la query → EXPLAIN ANALYZE → leer costos/filas reales vs estimadas → ajustar índice o query.

## ¿Cuándo desnormalizar (y cuándo es el clásico error)?
Denormalizar = guardar datos derivados (contador, snapshot) para evitar joins/agregaciones en caliente. Se justifica con lectura intensiva y tolerancia a inconsistencia transitoria.

### porque
Normalizado siempre es consistente pero cada lectura paga joins. Desnormalizar mueve el costo a la escritura: `post.commentsCount` es O(1) de leer pero cada comentario debe actualizarlo. El error clásico: desnormalizar ANTES de medir — la mayoría de las "optimizaciones" mueren ante un índice bien puesto. Medí, desnormalizá lo que duele, y documentá la sincronización.
