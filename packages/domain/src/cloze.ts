/**
 * Cloze: huecos `==texto==` dentro de la RESPUESTA de una tarjeta
 * (estilo Anki). La respuesta queda verbatim en el .md y la BD —
 * ocultar/revelar es render puro, no estado.
 *
 * Dos consumidores:
 * - Sesión de estudio: la respuesta con huecos ES la pregunta —
 *   mostrás el contexto, recordás el fragmento, revelás (resaltado).
 * - Quiz: el hueco se vuelve opción múltiple — la correcta es el
 *   texto del hueco y los distractores autorales son los rellenos
 *   erróneos perfectos (ver armarQuiz).
 */

/** ¿La respuesta tiene al menos un hueco ==...==? */
export function tieneCloze(answer: string): boolean {
  return /==[^=\n]+==/.test(answer);
}

/** Los textos ocultos, en orden de aparición. */
export function extraerClozes(answer: string): string[] {
  return [...answer.matchAll(/==([^=\n]+)==/g)].map((m) => m[1]!);
}

export type SegmentoCloze = { texto: string } | { hueco: string };

/**
 * Parte la respuesta en segmentos: texto plano e intercalado, y huecos.
 * El UI renderiza `hueco` como blank (oculto) o resaltado (revelado).
 */
export function segmentarCloze(answer: string): SegmentoCloze[] {
  const segmentos: SegmentoCloze[] = [];
  let resto = answer;
  for (const match of answer.matchAll(/==([^=\n]+)==/g)) {
    const inicio = resto.indexOf(match[0]);
    if (inicio > 0) segmentos.push({ texto: resto.slice(0, inicio) });
    segmentos.push({ hueco: match[1]! });
    resto = resto.slice(inicio + match[0].length);
  }
  if (resto !== "") segmentos.push({ texto: resto });
  return segmentos;
}

/**
 * Versión plana con el PRIMER hueco oculto y el resto visibles (stripped):
 * para el quiz, donde el enunciado es la respuesta con un solo blank
 * y el resto del contexto cuenta completo.
 */
export function ocultarPrimerCloze(answer: string): string {
  return answer.replace(/==([^=\n]+)==/, "[ ____ ]").replace(/==([^=\n]+)==/g, "$1");
}
