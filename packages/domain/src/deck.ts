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
