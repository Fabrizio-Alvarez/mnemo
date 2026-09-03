---
deck: SQL — Fundamentos
tags: [sql, bases-de-datos, aprendizaje]
fuente: Generado con prompts/generar-mazo.md (formato con distractores autorales)
---

## ¿Cómo filtras filas en un SELECT?
Con la cláusula ==`WHERE`==: `SELECT * FROM productos WHERE precio < 100;` — el filtro corre ANTES de agrupar.

### porque
WHERE decide qué filas participan del resultado. Es la primera herramienta de la que dependen todas las demás: agregaciones, orden y límite solo ven lo que pasó el filtro. Sin WHERE, la query es sobre toda la tabla.

### distractores
- Con `HAVING precio < 100` después del GROUP BY.
- Con `FILTER (WHERE precio < 100)` dentro del SELECT.
- Con `LIMIT precio < 100` al final de la query.

## ¿Qué hace ORDER BY y qué pasa con empates?
Ordena el resultado por una o más columnas: `ORDER BY precio DESC, nombre ASC`. Con empates en la primera, decide la segunda.

### porque
Sin ORDER BY el orden es INDEFINIDO — la BD puede devolver las filas en cualquier orden, incluso distinto entre dos corridas idénticas. Confiar en el orden natural es el bug silencioso clásico de los reportes. Columnas extra tras la primera resuelven empates de forma determinista.

### distractores
- Ordena las filas por su fecha de inserción en la tabla.
- Agrupa las filas iguales y las cuenta antes de ordenar.
- Garantiza que los NULL aparezcan siempre al final.

## ¿Para qué sirve DISTINCT?
Elimina filas duplicadas del resultado: `SELECT DISTINCT categoria FROM productos;` devuelve cada categoría una vez.

### porque
Aplica sobre TODAS las columnas del SELECT: dos filas son duplicadas solo si coinciden en todas. Es un agregado disfrazado — la BD compara cada fila contra el resto (o la ordena), así que en tablas grandes tiene costo. Si necesitás "los distintos por grupo", la herramienta correcta suele ser GROUP BY.

### distractores
- Devuelve la primera fila de cada grupo de duplicados con su id.
- Marca las filas duplicadas para borrarlas después.
- Hace que la query ignore los NULL del resultado.

## ¿Cómo tratás los NULL en los filtros?
Con ==`IS NULL`== / `IS NOT NULL` — nunca con `= NULL`, que no matchea nada.

### porque
NULL significa "desconocido", y en lógica de tres valores cualquier comparación con desconocido da desconocido → la fila queda fuera, SIEMPRE. `WHERE email = NULL` devuelve cero filas aunque haya NULLs. Trampa extra: `NOT (x = 5)` excluye los NULL (no sabés que no es 5), y `x <> 5` también los excluye.

### distractores
- Con `WHERE email = NULL` para encontrar los nulos.
- Con `WHERE email == NULL` (comparación estricta).
- NULL se filtra solo: nunca aparece en ningún SELECT.

## ¿Qué diferencia hay entre LIKE y = ?
`LIKE` compara patrones: `LIKE 'A%'` (empieza con A), `%` = cualquier cantidad de caracteres, `_` = uno exacto. `=` es igualdad exacta.

### porque
LIKE trata `%` y `_` como comodines; con `=` son caracteres literales. La trampa: `LIKE 'a%'` distingue mayúsculas según la BD (en Postgres sí, MySQL depende del collation) — para insensible usás ILIKE o LOWER(). Y el comodín AL PRINCIPIO (`'%x'`) no puede usar índice: escaneo completo.

### distractores
- LIKE es más rápido que = porque usa índices de texto.
- = también acepta % como comodín, solo que es case-sensitive.
- LIKE convierte la columna a minúsculas antes de comparar.

## ¿Qué hace INNER JOIN?
Combina filas de dos tablas donde la condición matchea en ambas: `INNER JOIN pedidos ON pedidos.cliente_id = clientes.id` — solo clientes CON pedidos.

### porque
Cada fila de la izquierda se aparea con las de la derecha que cumplan el ON; sin match, la fila no aparece. Es la operación fundamental para recuperar datos normalizados (guardados en tablas separadas para no duplicar). La condición casi siempre es la FK, y sin índice en esa FK el join se vuelve lento.

### distractores
- Devuelve todos los clientes y sus pedidos, con NULL si no hay pedidos.
- Devuelve solo los clientes que NO tienen pedidos.
- Une las columnas de ambas tablas una al lado de la otra, fila por fila.

## ¿Cuándo necesitás LEFT JOIN en vez de INNER?
Cuando querés TODAS las filas de la izquierda aunque no tengan match: clientes SIN pedidos incluidos, con NULL en las columnas de la derecha.

### porque
La pregunta de negocio decide: "usuarios con pedidos" (INNER) vs "todos los usuarios y sus pedidos si tienen" (LEFT). El clásico: contar pedidos por cliente con INNER excluye a los que nunca compraron — el reporte miente por omisión. Y para encontrar los SIN match: `LEFT JOIN ... WHERE derecha.id IS NULL`.

### distractores
- Cuando la tabla de la derecha es más grande que la izquierda.
- Cuando querés solo las filas que coinciden en ambas tablas.
- Cuando las tablas no tienen una foreign key que las relacione.

## ¿Cómo GROUP BY con agregaciones?
`SELECT categoria, COUNT(*) FROM productos GROUP BY categoria` — agrupa filas iguales y calcula una agregación por grupo (COUNT, SUM, AVG, MIN, MAX).

### porque
La regla dura: toda columna del SELECT que no está en una agregación DEBE estar en el GROUP BY. La razón: si listás una columna suelta junto al grupo, la BD no sabe cuál valor de las N filas del grupo mostrar. Postgres lo exige; MySQL antiguo "elegía una" (valor arbitrario, bug fábrica).

### distractores
- GROUP BY ordena las filas por la columna y muestra solo la primera de cada grupo.
- COUNT(*) cuenta las columnas que no son NULL del grupo.
- El GROUP BY aplica después del HAVING para filtrar grupos.

## ¿WHERE vs HAVING — cuál filtra qué?
WHERE filtra ==filas ANTES de agrupar==; HAVING filtra ==GRUPOS después del GROUP BY==, y puede usar agregados.

### porque
Orden de evaluación: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. HAVING puede decir `HAVING COUNT(*) > 5` (propiedad del grupo); WHERE no puede porque los grupos todavía no existen. Filtrar en WHERE cuando se puede es más eficiente: menos filas entran al agrupado.

### distractores
- HAVING es un WHERE con soporte de comodines LIKE.
- WHERE filtra grupos y HAVING filtra filas individuales.
- HAVING corre antes que GROUP BY para preparar los grupos.

## ¿Qué devuelve una subquery escalar?
Una subquery entre paréntesis que devuelve UN solo valor (una fila, una columna) y se usa donde iría un valor: `WHERE precio > (SELECT AVG(precio) FROM productos)`.

### porque
Como devuelve un escalar, la BD la evalúa una vez (o la reutiliza) y la compara contra cada fila. Es la forma natural de comparar contra un agregado global. Si la subquery escalar devolviera más de una fila → error en runtime: la garantía de unicidad la da TU lógica (MAX, AVG) o un LIMIT 1.

### distractores
- Una tabla temporal que vive solo durante la query externa.
- La primera fila de la tabla que consultás adentro.
- Un array con todos los valores de la columna consultada.

## ¿Qué hace EXISTS y por qué preferirlo a IN a veces?
`WHERE EXISTS (SELECT 1 FROM pedidos WHERE pedidos.cliente_id = clientes.id)` — verdadero si la subquery tiene al menos una fila. Corta en el primer match.

### porque
EXISTS es semijoín: la BD deja de buscar apenas encuentra UNO (no colecciona todos los valores como IN). Con NULLs, IN tiene la trampa de lógica de tres valores (`NOT IN` con NULL en la lista → cero filas); EXISTS no sufre. Y correlated o no, el planner moderno suele generar el mismo plan — la diferencia clave es la semántica con NULL y la legibilidad de intención ("existe al menos uno").

### distractores
- Verifica que la tabla de la subquery exista en el schema.
- Devuelve la cantidad de filas que matchean la subquery.
- Es igual a IN pero más lento porque no usa índices.

## ¿UNION o UNION ALL — cuándo cada uno?
UNION concatena resultados y ==ELIMINA duplicados==; UNION ALL concatena sin deduplicar (más rápido).

### porque
El dedupe de UNION ordena o hashea el resultado completo — costo real en datasets grandes. Si sabés que no hay duplicados (o no te importan), UNION ALL. Requisito de ambos: misma CANTIDAD de columnas con tipos compatibles — los nombres de columna vienen del primer SELECT.

### distractores
- UNION ALL ordena el resultado combinado por la primera columna.
- UNION combina las columnas de ambas queries lado a lado.
- UNION ALL solo funciona si ambas tablas tienen la misma primary key.

## ¿Para qué sirve CASE WHEN?
Lógica condicional dentro del SELECT: `CASE WHEN precio > 100 THEN 'caro' WHEN precio > 50 THEN 'medio' ELSE 'barato' END` — transforma valores fila por fila.

### porque
Es el if/else de SQL: permite clasificar, pivotear y calcular valores derivados sin procesar después en el lenguaje host. La primera condición que matchea gana (evaluación en cascada) — el orden de los WHEN importa. Sin ELSE el resultado es NULL cuando nada matchea: trampa silenciosa en reportes.

### distractores
- Ejecuta una query distinta según qué condición matchea.
- Filtra las filas que no cumplen ninguna condición del CASE.
- CASE solo se puede usar dentro de UPDATE, no en SELECT.

## ¿Qué es un CTE (WITH)?
Un resultado nombrado y temporal para esa query: `WITH top AS (SELECT ...) SELECT * FROM top WHERE ...` — legibilidad y reutilización dentro de la misma sentencia.

### porque
Descompone queries gigantes en pasos con nombre — el mismo efecto que variables en código. Desde PG12 el planner puede "inlinearlo" (resolverlo como subquery) o materializarlo según convenga. Con `WITH RECURSIVE` recorre árboles y grafos: la unión de un caso base con una query que se refiere a sí misma.

### distractores
- Crea una tabla real en el schema que persiste hasta el fin de la sesión.
- Ejecuta las queries en paralelo y combina los resultados.
- Reemplaza la necesidad de JOIN en la query principal.

## ¿Cómo hacen ranking las window functions?
`ROW_NUMBER() OVER (ORDER BY puntos DESC)` numera filas SIN colapsarlas — cada fila queda, con su cálculo "de ventana" al lado.

### porque
La diferencia clave con GROUP BY: GROUP BY colapsa N filas en una (perdés el detalle); la window function calcula sobre un conjunto de filas relacionadas pero MANTIENE cada fila. TOP-N por grupo = `ROW_NUMBER() OVER (PARTITION BY grupo ORDER BY ...)` + filtro en CTE. Running totals, moving averages: `SUM() OVER (ORDER BY fecha)`.

### distractores
- Ordenan el resultado completo y eliminan los duplicados.
- Agrupan las filas por la partición y devuelven una fila por grupo.
- ROW_NUMBER asigna el mismo número a las filas empatadas.

## ¿Diferencia entre DELETE y TRUNCATE?
DELETE borra filas (con o sin WHERE) y ==registra cada borrado==; TRUNCATE ==vacía la tabla entera de golpe==, sin log por fila.

### porque
DELETE es quirúrgico: filtro, triggers, FKs, rollback transaccional completo. TRUNCATE es una operación de "reset": más rápido, resetea storage, pero sin WHERE y con restricciones con FKs que la referencian. La trampa de DROP: DELETE y TRUNCATE dejan la ESTRUCTURA; DROP elimina tabla y todo.

### distractores
- TRUNCATE elimina también la estructura de la tabla, no solo las filas.
- TRUNCATE admite un WHERE para vaciar solo una parte de las filas.
- TRUNCATE mueve las filas a una tabla de respaldo automática.

## ¿Cómo protegés una FK al borrar el padre?
Declarando el comportamiento en la FK: `ON DELETE CASCADE` (borra hijos), `ON DELETE RESTRICT` (lo impide) o `SET NULL` (huérfanos con FK nullable).

### porque
Sin esta decisión, la BD te lo impide por default (o deja NULL si la columna lo permite, según cómo esté declarada): la integridad referencial es SU trabajo, no del código. CASCADE automatiza jerarquías (borrar venta → sus líneas); el riesgo es la profundidad de la cascada que no tenías en la cabeza.

### distractores
- Con un trigger que copie el padre a una tabla de respaldo antes de borrar.
- La FK no necesita decisión: siempre borra los hijos automáticamente.
- Seteando la columna del hijo como PRIMARY KEY también.

## ¿Qué garantiza una PRIMARY KEY?
Unicidad + no NULL de esa columna (o combinación) para TODA la tabla — la identidad de la fila.

### porque
Es el contrato por el cual el resto del sistema referencia la fila sin ambigüedad. UNIQUE solo garantiza unicidad (admite NULLs, según BD); la PK además es la que por defecto usan FKs y muchos índices clusterizados. Compuesta: `PRIMARY KEY (venta_id, nro_linea)` — la combinación única, cada parte repetible.

### distractores
- Ordena físicamente la tabla según esa columna, siempre.
- Garantiza que la columna tenga un valor por defecto automático.
- Es un índice que solo sirve para búsquedas por igualdad exacta.

## ¿Qué hace un índice y cuándo NO conviene?
Estructura auxiliar ordenada que acelera búsquedas por esa columna a costa de espacio y escrituras más lentas.

### porque
Cada índice acelera SELECT pero frena INSERT/UPDATE/DELETE (mantener el orden). No conviene en: columnas raramente filtradas, de baja selectividad (booleano), o tablas chicas. Y el patrón de query debe coincidir con el orden del índice (prefijo izquierdo en compuestos): índice sin query que lo use = costo puro.

### distractores
- Un índice duplica la tabla en disco para backups automáticos.
- Acelera todas las queries de la tabla por igual, sin costo.
- Los índices solo funcionan sobre columnas numéricas.

## ¿Cómo insertás sin duplicar si ya existe?
Con upsert: en Postgres `INSERT ... ON CONFLICT (email) DO UPDATE SET ...` — inserta, y si la unique constraint choca, actualiza.

### porque
La alternativa leer-primero tiene race condition: dos procesos concurrentes ambos "no encuentran" y ambos insertan. El upsert es atómico — la BD decide en el momento del choque. Prerequisito: una unique constraint sobre la columna del conflicto (sin ella no hay "duplicado" definido).

### distractores
- Con INSERT IGNORE, que actualiza la fila existente con los nuevos valores.
- Con un trigger BEFORE INSERT que borra la fila vieja primero.
- Con REPLACE INTO, que inserta y devuelve el id antiguo sin borrar nada.
