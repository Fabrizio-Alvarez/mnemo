import { CardSource, DeckMeta } from "./deck.ts";

/**
 * Importa texto FAQ de NotebookLM → tarjetas Q/R.
 *
 * NotebookLM genera FAQs en este formato (pegás tal cual):
 *
 *   **Q: ¿Qué es el Service Container?**
 *   El contenedor de dependencias de Laravel. Sabe cómo construir
 *   objetos y resolver sus dependencias.
 *
 *   **Q: ¿bind vs singleton?**
 *   `bind` crea una nueva instancia cada vez. `singleton` reutiliza.
 *
 * Variantes aceptadas (para cubrir otros outputs de NotebookLM y pegados manuales):
 *   - `Q: pregunta` (sin bold)
 *   - `### Q: pregunta` (encabezado h3 con prefijo Q:)
 *   - `### ¿pregunta?` (encabezado h3 sin prefijo, termina con ?)
 *   - `**¿pregunta?**` (bold sin prefijo Q:, termina con ?)
 *
 * Texto antes de la primera pregunta (intro, título) se ignora.
 * Respuestas vacías se descartan (una tarjeta sin respuesta no sirve).
 */
export function importarNotebookLM(text: string): CardSource[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  const cards: CardSource[] = [];
  let currentQ: string | null = null;
  let answerLines: string[] = [];

  for (const line of lines) {
    const q = matchPregunta(line);
    if (q !== null) {
      flush(cards, currentQ, answerLines);
      currentQ = q;
      answerLines = [];
    } else if (currentQ !== null) {
      // Strip optional "A:" prefix from the first line of the answer.
      const content = answerLines.length === 0 ? line.replace(/^A[:：]\s*/, "") : line;
      answerLines.push(content);
    }
  }
  flush(cards, currentQ, answerLines);

  return cards;
}

/**
 * Genera el texto de un archivo `.md` de mazo desde metadatos + tarjetas.
 * Es la inversa de `parseDeck`: produce el formato canónico que el seed consume.
 * El resultado se puede pegar en `decks/<slug>.md` y `pnpm seed`.
 */
export function generarDeckMD(meta: DeckMeta, cards: CardSource[]): string {
  const fm = [
    "---",
    `deck: ${meta.title}`,
    meta.tags.length > 0 ? `tags: [${meta.tags.join(", ")}]` : null,
    meta.source ? `fuente: ${meta.source}` : null,
    "---",
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const body = cards.map((c) => `## ${c.question}\n${c.answer}`).join("\n\n");

  return `${fm}\n\n${body}\n`;
}

// ─── internals ─────────────────────────────────────────────────────────

function flush(cards: CardSource[], q: string | null, answerLines: string[]): void {
  if (q === null) return;
  const answer = answerLines.join("\n").trim();
  if (answer !== "") cards.push({ question: q, answer });
}

/** Detecta si una línea es el inicio de una pregunta. Devuelve el texto limpio o null. */
function matchPregunta(line: string): string | null {
  const t = line.trim();
  if (t === "") return null;

  // **Q: pregunta**  (formato principal de NotebookLM)
  let m = /^\*\*Q[:：]\s*(.+?)\*\*$/.exec(t);
  if (m) return m[1]!.trim();

  // Q: pregunta  (sin bold)
  m = /^Q[:：]\s*(.+)$/.exec(t);
  if (m) return m[1]!.trim();

  // ### Q: pregunta
  m = /^###\s+Q[:：]\s*(.+)$/.exec(t);
  if (m) return m[1]!.trim();

  // ### ¿pregunta?  (h3 que termina con ?)
  m = /^###\s+(.+\?)$/.exec(t);
  if (m) return m[1]!.trim();

  // **¿pregunta?**  (bold que termina con ?, sin prefijo Q:)
  m = /^\*\*(.+?\?)\*\*$/.exec(t);
  if (m) return m[1]!.trim();

  return null;
}
