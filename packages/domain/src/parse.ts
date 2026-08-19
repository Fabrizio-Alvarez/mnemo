import { CardSource, DeckMeta, DeckParseError, DeckSource } from "./deck.ts";
import { parseFrontmatter } from "./frontmatter.ts";

/**
 * Parser de mazos: 1 archivo `.md` = 1 mazo.
 * Formato (contrato estable):
 *   - Frontmatter delimitado por `---` con `deck` (o `title`), `tags`, `fuente` (o `source`).
 *   - Cada encabezado `##` = 1 tarjeta: el título es la pregunta, el cuerpo la respuesta.
 *   - `#` (h1) se usa como título del mazo si no hay frontmatter.
 *   - Texto fuera de encabezados `##` (prosa del archivo) se ignora.
 */
export function parseDeck(markdown: string): DeckSource {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const { frontmatter, body } = splitFrontmatter(normalized);
  const fm = frontmatter !== null ? parseFrontmatter(frontmatter) : {};

  const fmTitle = pickString(fm, "deck", "title");
  const fmSource = pickString(fm, "fuente", "source");
  const fmTags = pickTags(fm);

  const meta: DeckMeta = {
    title: fmTitle ?? firstH1(body) ?? fallbackTitle(body),
    tags: fmTags,
    ...(fmSource !== undefined ? { source: fmSource } : {}),
  };

  return { meta, cards: extractCards(body) };
}

function splitFrontmatter(md: string): { frontmatter: string | null; body: string } {
  if (!md.startsWith("---")) return { frontmatter: null, body: md };
  const end = md.indexOf("\n---", 3);
  if (end === -1) throw new DeckParseError("Frontmatter abierto con `---` pero nunca cerrado");
  const frontmatter = md.slice(3, end);
  const body = md.slice(end + 4); // salta el `\n---` y el `\n` previo queda en el slice
  return { frontmatter, body: body.replace(/^\n/, "") };
}

function pickString(fm: Record<string, string | string[]>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = fm[key];
    if (typeof value === "string" && value !== "") return value;
  }
  return undefined;
}

function pickTags(fm: Record<string, string | string[]>): string[] {
  const tags = fm["tags"];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string" && tags !== "") return [tags];
  return [];
}

function firstH1(body: string): string | undefined {
  for (const line of body.split("\n")) {
    const match = /^#\s+(.+)$/.exec(line);
    if (match) return match[1]!.trim();
  }
  return undefined;
}

/** Sin frontmatter ni `#`: nombre de archivo sugerido por el caller; acá un placeholder honesto. */
function fallbackTitle(body: string): string {
  const firstLine = body
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l !== "");
  if (firstLine === undefined) return "Mazo sin título";
  const stripped = firstLine.replace(/^#{1,6}\s+/, "");
  return stripped.slice(0, 60);
}

function extractCards(body: string): CardSource[] {
  const sections: { question: string; answerLines: string[] }[] = [];

  for (const line of body.split("\n")) {
    const match = /^##\s+(.+)$/.exec(line);
    if (match) {
      sections.push({ question: match[1]!.trim(), answerLines: [] });
    } else if (sections.length > 0) {
      sections[sections.length - 1]!.answerLines.push(line);
    }
  }

  return sections.map(({ question, answerLines }) => ({
    question,
    answer: answerLines.join("\n").trim(),
  }));
}
