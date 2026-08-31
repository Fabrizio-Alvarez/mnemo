---
deck: Algoritmos y Estructuras de Datos
tags: [algoritmos, estructuras-de-datos, entrevistas]
fuente: Generado con prompts/generar-mazo.md
---

## ¿Cómo encontrás en O(n) un par que sume el objetivo en un array desordenado?
Con un hash set de vistos: por cada elemento x consultás si existe `objetivo − x`; si no, agregás x. Devuelve el par en una pasada.

### porque
La clave es consultar el complemento ANTES de agregar el actual: si agregás primero, un elemento que es la mitad del objetivo se matchea consigo mismo. Two pointers resuelve lo mismo pero exige array ORDENADO (O(n log n) si hay que ordenar); el hash set no.

### distractores
- (4, 4) al procesar el 4 en [4, 3, 5] con objetivo 8: agrega el elemento y después consulta su propio complemento.
- Ningún par: al ver el 3 el complemento es 5, que todavía no apareció, y nunca se reconsulta.
- Two pointers desde los extremos sin ordenar el array primero.

## ¿Qué índices examina binary search buscando 16 en [2, 5, 8, 12, 16, 23]?
El 2 y después el 4 (lo encuentra). Con lo=0, hi=5 y mid = (lo+hi) redondeado hacia abajo: mid=2 vale 8 < 16 → lo=3; mid=4 vale 16 → fin.

### porque
Cada comparación descarta la mitad restante: como 8 < 16, todo [lo..2] queda fuera y lo salta a mid+1 (no a mid: el mid ya fue comparado). El intervalo se parte a la mitad → ~log₂(n) pasos.

### distractores
- 3, 5 y 4: inicializa hi con la longitud (6) en vez de len−1 y le agrega un paso.
- 2 y luego 0: con arr[mid] < objetivo mueve hi en vez de lo, y reporta "no está".
- 2, 3 y 4: mueve con lo = mid en vez de lo = mid + 1 y reexamina de más.

## ¿Qué estructura usás para validar paréntesis anidados?
Un stack (LIFO): apilás cada apertura y al cerrar verificás que coincida con el tope; al final el stack debe quedar vacío.

### porque
El último abierto es el primero que debe cerrarse — exactamente LIFO. Contar aperturas y cierres por tipo no alcanza: "([)]" balancea los conteos pero viola el orden de cierre.

### distractores
- Un hash map que cuenta aperturas y cierres de cada tipo por separado.
- Una queue (FIFO): el primero abierto es el primero que se cierra.
- Two pointers desde los extremos: comparar s[i] con s[n−1−i].

## ¿Cuánto da evaluar la expresión postfija «2 3 8 − ×» con un stack?
−10: se apilan 2, 3 y 8; el − popea 8 y 3 → 3−8 = −5; el × popea −5 y 2 → 2 × (−5) = −10.

### porque
El PRIMER popeado es el SEGUNDO operando: da igual para + y ×, pero invierte el resultado de − y ÷. El postfijo elimina paréntesis justamente porque el orden de apilado ya codifica la agrupación.

### distractores
- 10: popea al revés (8−3=5) y calcula 2×5.
- −8: la lee de izquierda a derecha como infija: (2−3)×8.
- −2: la reordena como 2×3−8 y resuelve con precedencia infija.

## ¿Cómo obtenés el máximo de cada ventana de tamaño k en O(n)?
Con un deque monótono decreciente de índices: el frente es siempre el máximo de la ventana actual; sacás del frente lo que salió de rango y del fondo todo lo menor que el nuevo elemento.

### porque
El deque guarda CANDIDATOS en orden: cualquier elemento menor que el nuevo nunca volverá a ser máximo mientras el nuevo siga en la ventana, así que se descarta para siempre — esa decisión irreversible es la que hace posible O(n). Un heap no puede expulsar en O(1) el elemento que sale de la ventana.

### distractores
- Un max-heap con los elementos de la ventana: el tope siempre es el máximo actual.
- Ordenar una copia de cada ventana y leer el último elemento.
- Prefijos: precalcular el máximo acumulado hasta cada índice y "restar" el de i−k.

## ¿Por qué un hash map busca en O(1) promedio?
Porque el hash de la clave te da directamente el índice del bucket: no comparás contra la colección, solo contra los pocos elementos de ese bucket (longitud promedio ~1).

### porque
La búsqueda por comparación se reemplaza por aritmética + un bucket chico, SI el hash distribuye uniforme y la tabla se redimensiona al superar el load factor. El peor caso O(n) existe (todas colisionan) y el resize se amortiza: duplicar cuesta O(n) pero se paga con las n inserciones baratas previas.

### distractores
- Porque guarda las claves ordenadas y hace búsqueda binaria dentro del bucket.
- Porque la tabla es un bloque contiguo y el acceso por índice no tiene colisiones.
- Porque cada bucket guarda a lo sumo 3 elementos, garantizado por la función de hash.

## ¿Reverse de 1→2→3: cómo quedan prev y curr tras procesar el nodo 2?
prev = 2→1 (con 1→null) y curr = 3; el nodo 3 todavía apunta al 2 y se corrige en la vuelta siguiente.

### porque
Cada iteración hace tres pasos en orden: guardar next, invertir curr.next hacia prev, y avanzar prev=curr / curr=next. El tramo sin procesar queda temporalmente inconsistente (3→2) — es normal: la lista solo vuelve a ser coherente cuando curr llega a null.

### distractores
- prev = 1→null y curr = 3: saltó el nodo 2 sin enlazarlo.
- prev = 2→1→3 completa y curr = null: enlaza el 3 en el mismo paso en que procesa el 2.
- prev = 2→1 y curr = null: avanza curr de más y termina una iteración antes.

## ¿Con qué implementás una LRU cache con get y put en O(1)?
Hash map (clave → nodo) + doubly linked list en orden de uso: get/put mueven el nodo al frente en O(1); la evicción saca el último de la lista y lo borra del hash.

### porque
El hash resuelve el acceso por clave y la lista el ORDEN de uso. Tiene que ser doblemente enlazada porque mover un nodo exige conocer su anterior sin buscarlo (singly = O(n)). El hash map solo no tiene orden; en un heap "tocar" un elemento (cambiarle la prioridad) no es O(1).

### distractores
- Hash map con timestamp: al evictar, recorrer todo y sacar el de timestamp más viejo.
- Min-heap por última vez usado: el tope es el candidato a evictar.
- Un array circular que sobrescribe la posición más vieja.

## Min-heap [5, 10, 15, 20]: ¿cómo queda tras insertar 7?
[5, 7, 15, 20, 10]: el 7 entra al final (índice 4), sube intercambiando con su padre 10 (índice 1) y se frena con el padre 5.

### porque
El heap vive en un array donde el padre de i está en ⌊(i−1)/2⌋: el nuevo entra al final para conservar la forma de árbol completo y solo sube MIENTRAS viole con su padre (7 < 10 sube; 7 > 5 frena). Insertarlo "donde le corresponde por valor" rompería la completitud.

### distractores
- [5, 10, 15, 20, 7]: queda al final porque 7 ya es menor que su vecino 20.
- [7, 5, 15, 20, 10]: sube hasta la raíz porque el elemento nuevo más chico va arriba.
- [5, 10, 7, 20, 15]: se ubica comparando con 15 en el nivel de abajo.

## ¿Qué estructura mantiene el k-ésimo mayor de un stream infinito?
Un min-heap de tamaño k: cada nuevo elemento entra solo si supera la raíz (sacándola primero); la raíz es SIEMPRE el k-ésimo mayor visto hasta ahora.

### porque
Guardás exactamente los k mayores, con el MENOR de ellos en la raíz — esa raíz es el umbral de entrada. Stream infinito descarta cualquier estructura proporcional a n; el costo queda en O(n log k) con memoria O(k).

### distractores
- Un array ordenado con TODOS los vistos: la posición n−k te da el k-ésimo.
- Un hash set de los elementos vistos: al consultar, buscar el k-ésimo mayor.
- Un max-heap de todos los vistos: el k-ésimo está a k−1 extracciones del tope.

## ¿Por qué buscar en un BST puede degradar a O(n)?
Porque el invariante de BST ordena por subárboles (izq < nodo < der) pero NO garantiza altura: con inserciones en orden, el árbol degenera en una cadena y cada comparación descarta un solo elemento.

### porque
El O(log n) promedio requiere que cada paso elimine ~la mitad — eso lo da el balance, no el orden. AVL/rojo-negro agregan el invariante que falta: rotan cuando un lado supera al otro en altura (factor ±2), y con eso buscan, insertan y borran en O(log n) garantizado.

### distractores
- Es siempre O(log n): cada comparación parte el árbol restante en dos mitades.
- El peor caso es O(n log n): cada nivel cuesta una búsqueda logarítmica.
- El O(n) solo ocurre cuando la clave buscada no existe en el árbol.

## ¿BFS o DFS para el camino más corto en un grafo no ponderado?
BFS desde el origen: explora por niveles, así que la primera vez que llega al destino ya recorrió la mínima cantidad de aristas.

### porque
BFS procesa todos los nodos a distancia d antes que cualquiera a d+1: el orden de descubrimiento ES la distancia. DFS se hunde por una rama y encuentra UN camino, no el más corto. Con pesos no negativos la generalización es Dijkstra (BFS + cola de prioridad).

### distractores
- DFS con backtracking: probás caminos y devolvés el primero que llega.
- DFS iterativo con stack: al llegar al destino, el stack contiene el camino más corto.
- DFS: en un grafo no ponderado cualquier camino que encuentra ya es el más corto.

## ¿Por qué Dijkstra falla con aristas de peso negativo?
Porque al extraer un nodo de la cola lo marca como definitivo: una arista negativa posterior podría mejorar un camino ya cerrado, y Dijkstra nunca reabre nodos procesados.

### porque
Dijkstra es greedy: extraer el mínimo pendiente solo implica "ningún camino futuro lo mejora" si agregar aristas nunca baja el costo (pesos ≥ 0). Con negativos la distancia de un nodo procesado puede decrecer; Bellman-Ford relaja TODAS las aristas n−1 veces precisamente para dejar que esas mejoras se propaguen (y detecta ciclos negativos).

### distractores
- Porque la cola de prioridad no soporta valores negativos y compara mal.
- Porque una arista negativa siempre crea un ciclo infinito sin solución.
- Funciona igual si procesás las aristas negativas primero (ordenándolas antes de correr).

## ¿Por qué quicksort es O(n²) en el peor caso si "siempre parte en dos"?
No siempre parte en dos: con el pivote en un extremo de un array ya ordenado, cada partición separa 1 elemento de n−1 → n niveles de recursión que cuestan O(n) cada uno.

### porque
El costo es niveles × trabajo por nivel: partición balanceada → log n niveles → O(n log n). Mergesort garantiza la mitad EXACTA porque parte por posición, no por valor — nunca degrada, a costa de memoria O(n). Aleatorizar el pivote vuelve el peor caso improbable, no imposible; y counting sort (O(n+k), sin comparar) escapa al techo Ω(n log n) cuando el rango de valores es chico.

### distractores
- Porque usa recursión y cada llamada duplica el trabajo del array.
- Porque la partición compara cada elemento contra todos los demás.
- En realidad el peor caso es O(n log n), solo que con constantes grandes.

## ¿Cuándo alcanza greedy y cuándo necesitás DP?
Greedy cuando la elección local óptima conduce al óptimo global; DP cuando los subproblemas se solapan y una elección temprana puede arruinar el resultado final.

### porque
El test práctico es buscar el contraejemplo: monedas [1, 3, 4] para 6 — greedy da 4+1+1 (3 monedas), el óptimo es 3+3. La memoización es la forma top-down de DP: cachear subproblemas repetidos colapsa el árbol de llamadas (fib: O(2ⁿ) → O(n)); greedy no tiene vuelta atrás, DP sí explora (o deduce) las alternativas.

### distractores
- Greedy es correcto si ordenás la entrada de mayor a menor antes de elegir.
- DP solo se justifica cuando los subproblemas NO se solapan.
- Con memoización, cualquier greedy pasa a ser correcto y O(n).


## Kata: búsqueda binaria — implementala
Devolvé el índice de `target` en un array ORDENADO, o `-1` si no está. Sin usar `.indexOf` ni `.includes`: ventana low/high que se achica por mitad.

```ts
function buscar(arr, target) {
  let low = 0;
  let high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}
```

### porque
Cada iteración compara el centro y descarta la MITAD que no puede contener el target: n → n/2 → n/4... en log₂n pasos. Los bugs clásicos: `low < high` (pierde el caso de 1 elemento) y no mover +1/-1 (bucle infinito cuando low===high).

### kata
firma: buscar(arr, target)
- [ [1,3,5,7,9], 7 ] => 3
- [ [1,3,5,7,9], 4 ] => -1
- [ [], 5 ] => -1
- [ [42], 42 ] => 0
- [ [2,4,6,8,10,12], 12 ] => 5

## Kata: paréntesis balanceados
Devolvé `true` si cada paréntesis/llave/corchete que se abre se cierra en el orden correcto. Usá un stack.

```ts
function balanceados(s) {
  const pares = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const c of s) {
    if ("([{".includes(c)) stack.push(c);
    else if (c in pares) {
      if (stack.pop() !== pares[c]) return false;
    }
  }
  return stack.length === 0;
}
```

### porque
El último abierto debe ser el primero en cerrarse (LIFO = stack). Al ver un cierre, el TOPE del stack debe ser su apertura — si no, ya está mal. Al final el stack debe estar vacío (no quedaron abiertos sin cerrar).

### kata
firma: balanceados(s)
- [ "()" ] => true
- [ "(]" ] => false
- [ "([{}])" ] => true
- [ "" ] => true
- [ "(()" ] => false
- [ ")(" ] => false

## Kata: dos suma
Devolvé `[i, j]` con `i < j` tal que `arr[i] + arr[j] === objetivo`. Si hay varios pares, el de menor `i` (y su primer `j`). Probá con hash map en una pasada.

```ts
function dosSuma(arr, objetivo) {
  const vistos = new Map();
  for (let j = 0; j < arr.length; j++) {
    const falta = objetivo - arr[j];
    if (vistos.has(falta)) return [vistos.get(falta), j];
    if (!vistos.has(arr[j])) vistos.set(arr[j], j);
  }
  return [];
}
```

### porque
Fuerza bruta: probar todos los pares = O(n²). El hash map invierte la pregunta: en vez de "¿con quién suma?", guardás qué viste ("valor → índice") y al llegar a cada elemento preguntás en O(1) si su complemento ya apareció: una pasada, O(n).

### kata
firma: dosSuma(arr, objetivo)
- [ [2,7,11,15], 9 ] => [0,1]
- [ [3,2,4], 6 ] => [1,2]
- [ [3,3], 6 ] => [0,1]
- [ [1,2,3], 99 ] => []

## Kata: subarray de suma máxima (Kadane)
Devolvé la suma del subarray CONTIGUO de mayor suma. El array tiene al menos un elemento.

```ts
function subarrayMaximo(arr) {
  let mejor = arr[0];
  let actual = arr[0];
  for (let i = 1; i < arr.length; i++) {
    actual = Math.max(arr[i], actual + arr[i]);
    mejor = Math.max(mejor, actual);
  }
  return mejor;
}
```

### porque
En cada posición decidís: ¿extiendo el subarray anterior o arranco de acá? Si `actual` venía negativo, arrancar de `arr[i]` solo es mejor que sumarlo. Esa decisión local (greedy sobre la suma) produce el óptimo global — y evita recomputar todos los O(n²) subarrays.

### kata
firma: subarrayMaximo(arr)
- [ [-2,1,-3,4,-1,2,1,-5,4] ] => 6
- [ [1] ] => 1
- [ [5,-9,6] ] => 6
- [ [-3,-1,-2] ] => -1
- [ [2,3,-1,4] ] => 8

## Kata: elemento mayoritario
Devolvé el elemento que aparece MÁS de n/2 veces (existe garantido). Sin ordenar: intentá el algoritmo de Boyer-Moore (candidato + contador).

```ts
function mayoritario(arr) {
  let candidato = arr[0];
  let votos = 1;
  for (let i = 1; i < arr.length; i++) {
    votos += arr[i] === candidato ? 1 : -1;
    if (votos === 0) {
      candidato = arr[i];
      votos = 1;
    }
  }
  return candidato;
}
```

### porque
Boyer-Moore aparea cada elemento distinto contra el candidato y se cancelan: si hay mayoría, sobrevive como candidato (aparece más veces que TODOS los demás juntos). O(n) tiempo, O(1) espacio — donde ordenar y contar sería O(n log n) u O(n) extra.

### kata
firma: mayoritario(arr)
- [ [3,3,4,2,3,3] ] => 3
- [ [1,1,2] ] => 1
- [ [1] ] => 1
- [ [2,2,1,1,2] ] => 2

## Kata: escaleras (fibonacci con DP)
Una escalera de `n` escalones se sube de a 1 o de a 2 por vez. Devolvé de cuántas formas distintas se llega al escalón `n`.

```ts
function escaleras(n) {
  if (n <= 2) return n;
  let a = 1;
  let b = 2;
  for (let i = 3; i <= n; i++) [a, b] = [b, a + b];
  return b;
}
```

### porque
Para llegar al escalón n venís del n-1 (un paso) o del n-2 (doble): formas(n) = formas(n-1) + formas(n-2). Es Fibonacci desplazado. La recursión naive recalcula los mismos subproblemas (exponencial); con dos variables guardás solo lo necesario: O(n) tiempo, O(1) espacio.

### kata
firma: escaleras(n)
- [ 1 ] => 1
- [ 2 ] => 2
- [ 3 ] => 3
- [ 5 ] => 8
- [ 10 ] => 89

## Kata: intersección de arrays
Devolvé los elementos comunes a ambos arrays, SIN duplicados y ORDENADOS de menor a mayor.

```ts
function interseccion(a, b) {
  const setB = new Set(b);
  return [...new Set(a)].filter((x) => setB.has(x)).sort((x, y) => x - y);
}
```

### porque
El Set responde "¿está?" en O(1) promedio (hash): la intersección completa cuesta O(n+m). Sin Set, cada elemento de a exige recorrer b (O(n·m)). El dedupe con un solo Set de entrada evita repetir un común en el resultado.

### kata
firma: interseccion(a, b)
- [ [1,2,2,1], [2,2] ] => [2]
- [ [4,9,5], [9,4,9,8,4] ] => [4,9]
- [ [1], [2] ] => []
- [ [7,7,7], [7] ] => [7]

## Kata: rotar array k posiciones
Devolvé el array rotado `k` posiciones a la derecha (los últimos pasan al frente). `k` puede ser mayor que la longitud.

```ts
function rotar(arr, k) {
  const n = arr.length;
  if (n === 0) return arr;
  const r = k % n;
  return [...arr.slice(n - r), ...arr.slice(0, n - r)];
}
```

### porque
Rotar n posiciones vuelve al original: solo importa `k % n`. Con slice, los últimos `r` elementos van al frente y el resto detrás — sin rotar uno por uno (O(n) directo vs O(k·n) paso a paso).

### kata
firma: rotar(arr, k)
- [ [1,2,3,4,5], 2 ] => [4,5,1,2,3]
- [ [7,8,9], 1 ] => [9,7,8]
- [ [1], 3 ] => [1]
- [ [1,2], 4 ] => [1,2]
- [ [], 5 ] => []
