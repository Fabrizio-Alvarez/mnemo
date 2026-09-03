/**
 * Modo quiz: deriva opción múltiple del MISMO contenido Q/R.
 * Los distractores son respuestas de tarjetas hermanas del mismo mazo —
 * sin metadata extra, sin duplicar contenido: el .md sigue siendo la única fuente.
 *
 * Cada opción sabe a qué pregunta pertenece realmente (`origen`): al errar,
 * la UI muestra que la respuesta elegida responde a OTRA pregunta — el quiz
 * enseña el mapeo pregunta↔respuesta, no solo correcto/incorrecto. La
 * explicación autoral (`### porque` en el .md) llega vía `tarjeta.explanation`.
 *
 * `rng` es inyectable para tests deterministas (default Math.random).
 */
import { extraerClozes, ocultarPrimerCloze, tieneCloze } from "./cloze.ts";

export interface OpcionQuiz {
  /** Texto de la opción: una respuesta del mazo. */
  texto: string;
  /** Pregunta de la tarjeta de donde salió esta respuesta. `undefined` = la correcta. */
  origen?: string;
}

export interface ItemQuiz<T> {
  tarjeta: T;
  /**
   * Enunciado a mostrar: la pregunta (`## `), o — para tarjetas cloze —
   * la respuesta con el primer hueco en blank (el resto visible).
   */
  pregunta: string;
  /** Respuestas posibles, mezcladas. */
  opciones: OpcionQuiz[];
  /** Índice de la opción correcta dentro de `opciones`. */
  correcta: number;
}

export function armarQuiz<T extends { question: string; answer: string; distractores?: string[] }>(
  cards: T[],
  rng: () => number = Math.random,
): ItemQuiz<T>[] {
  return cards.map((card) => {
    // Tarjeta cloze (==hueco== en la respuesta): el enunciado es la respuesta
    // con el PRIMER hueco en blank y la correcta es el texto oculto —
    // los distractores autorales son los rellenos erróneos perfectos.
    const esCloze = tieneCloze(card.answer);
    const correctaTexto = esCloze ? extraerClozes(card.answer)[0]! : card.answer;
    const enunciado = esCloze ? ocultarPrimerCloze(card.answer) : card.question;

    // Distractores autorales (`### distractores` en el .md): plausibles pero
    // incorrectos, del MISMO tema que la pregunta — no se eliminan por descarte.
    const autorales = (card.distractores ?? [])
      .map((texto) => texto.trim())
      .filter((texto) => texto !== "" && texto !== correctaTexto)
      .map((texto) => ({ texto }));

    // Hermanas: completan hasta 3 si faltan autorales (fallback histórico).
    const hermanas = mezclar(
      deduplicarPorTexto(
        cards
          .filter((otra) => otra.question !== card.question)
          .map((otra) => ({ texto: otra.answer, origen: otra.question })),
      ).filter((opcion) => opcion.texto !== correctaTexto && !autorales.some((a) => a.texto === opcion.texto)),
      rng,
    );

    const distractores = [...autorales, ...hermanas].slice(0, 3);
    const opciones = mezclar([{ texto: correctaTexto }, ...distractores], rng);
    return {
      tarjeta: card,
      pregunta: enunciado,
      opciones,
      correcta: opciones.findIndex((o) => o.texto === correctaTexto),
    };
  });
}

function deduplicarPorTexto<T extends { texto: string }>(opciones: T[]): T[] {
  const vistos = new Set<string>();
  return opciones.filter((opcion) => {
    if (vistos.has(opcion.texto)) return false;
    vistos.add(opcion.texto);
    return true;
  });
}

/** Fisher-Yates con rng inyectable. */
export function mezclar<T>(items: T[], rng: () => number = Math.random): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
}
