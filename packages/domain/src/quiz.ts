/**
 * Modo quiz: deriva opción múltiple del MISMO contenido Q/R.
 * Los distractores son respuestas de tarjetas hermanas del mismo mazo —
 * sin metadata extra, sin duplicar contenido: el .md sigue siendo la única fuente.
 *
 * `rng` es inyectable para tests deterministas (default Math.random).
 */

export interface ItemQuiz<T> {
  tarjeta: T;
  /** Respuestas posibles, mezcladas. */
  opciones: string[];
  /** Índice de la opción correcta dentro de `opciones`. */
  correcta: number;
}

export function armarQuiz<T extends { question: string; answer: string }>(
  cards: T[],
  rng: () => number = Math.random,
): ItemQuiz<T>[] {
  return cards.map((card) => {
    const distractores = mezclar(
      deduplicar(
        cards.filter((otra) => otra.question !== card.question).map((otra) => otra.answer),
      ).filter((respuesta) => respuesta !== card.answer),
      rng,
    ).slice(0, 3);

    const opciones = mezclar([card.answer, ...distractores], rng);
    return { tarjeta: card, opciones, correcta: opciones.indexOf(card.answer) };
  });
}

function deduplicar(respuestas: string[]): string[] {
  return [...new Set(respuestas)];
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
