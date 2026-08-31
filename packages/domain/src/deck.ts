/**
 * Tipos de contenido de un mazo, tal como salen del parser.
 * El estado SRS (ease, intervalos, vencimiento) NO vive acá:
 * el contenido es fuente de verdad, el estado es derivado y muta en la BD.
 */

/** Metadatos del frontmatter de un `.md`. */
export interface DeckMeta {
  /** Título legible, ej. "Laravel — Eloquent". */
  title: string;
  /** Etiquetas libres para filtrar en el futuro. */
  tags: string[];
  /** De dónde salió el material (ej. "NotebookLM (Guía Laravel-Vue)"). */
  source?: string;
}

/** Una tarjeta Q/R extraída de un encabezado `##`. */
export interface CardSource {
  /** Pregunta: el texto del encabezado. */
  question: string;
  /** Respuesta: el cuerpo bajo el encabezado, verbatim (trimmed). */
  answer: string;
  /**
   * Explicación didáctica opcional: el cuerpo tras un sub-encabezado
   * `### porque` dentro de la tarjeta. El quiz la muestra al responder —
   * el "por qué" conceptual, no solo la respuesta correcta.
   */
  explanation?: string;
  /**
   * Distractores autorales opcionales (`### distractores`, lista `- item`):
   * respuestas plausibles pero INCORRECTAS del mismo tema que la pregunta.
   * El quiz las prioriza — las respuestas de tarjetas hermanas suelen ser
   * de otro tema y se eliminan por descarte (adivinar es fácil).
   */
  distractores?: string[];
}

/** Un mazo parseado desde Markdown. */
export interface DeckSource {
  meta: DeckMeta;
  cards: CardSource[];
}

/** Error de parseo con ubicación legible. */
export class DeckParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeckParseError";
  }
}
