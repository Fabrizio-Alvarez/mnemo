import { CardSource, DeckMeta, DeckParseError, DeckSource, Kata, KataTest } from "./deck.ts";
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
  const sections: {
    question: string;
    answerLines: string[];
    explanationLines: string[];
    distractorLines: string[];
    firma: string | null;
    kataTestLines: string[];
    modo: "respuesta" | "porque" | "distractores" | "kata";
  }[] = [];

  for (const line of body.split("\n")) {
    const match = /^##\s+(.+)$/.exec(line);
    if (match) {
      sections.push({
        question: match[1]!.trim(),
        answerLines: [],
        explanationLines: [],
        distractorLines: [],
        firma: null,
        kataTestLines: [],
        modo: "respuesta",
      });
      continue;
    }
    const section = sections[sections.length - 1];
    if (section === undefined) continue; // prosa antes de la primera tarjeta

    // Sub-encabezados de sección dentro de la tarjeta:
    //   `### porque` → explicación | `### distractores` → opciones erróneas
    //   `### kata` → ejercicio de código (firma + tests)
    const sub = /^###\s+(.+)$/.exec(line);
    if (sub !== null) {
      const titulo = sub[1]!;
      if (esEncabezadoPorque(titulo)) {
        section.modo = "porque";
        continue;
      }
      if (esEncabezadoDistractores(titulo)) {
        section.modo = "distractores";
        continue;
      }
      if (titulo.trim().toLowerCase() === "kata") {
        section.modo = "kata";
        continue;
      }
    }

    if (section.modo === "porque") {
      section.explanationLines.push(line);
    } else if (section.modo === "distractores") {
      // Lista `- item`: cada renglón con viñeta es un distractor.
      if (/^\s*-\s+/.test(line)) section.distractorLines.push(line.replace(/^\s*-\s+/, "").trim());
    } else if (section.modo === "kata") {
      const firma = /^firma:\s*(.+)$/.exec(line.trim());
      if (firma !== null) {
        section.firma = firma[1]!.trim();
      } else if (/^\s*-\s+/.test(line)) {
        section.kataTestLines.push(line.replace(/^\s*-\s+/, "").trim());
      }
    } else {
      section.answerLines.push(line);
    }
  }

  return sections.map(({ question, answerLines, explanationLines, distractorLines, firma, kataTestLines }) => {
    const explanation = explanationLines.join("\n").trim();
    const distractores = distractorLines.filter((d) => d !== "");
    const kata = parsearKata(firma, kataTestLines);
    return {
      question,
      answer: answerLines.join("\n").trim(),
      ...(explanation !== "" ? { explanation } : {}),
      ...(distractores.length > 0 ? { distractores } : {}),
      ...(kata !== null ? { kata } : {}),
    };
  });
}

/**
 * `### kata` del .md → Kata. Formato de la sección:
 *   firma: buscar(arr, target)
 *   - [ [1,3,5,7,9], 7 ] => 3
 * Cada test: array JSON de argumentos, `=>`, valor esperado JSON.
 * Sin firma o sin tests válidos, la sección se ignora (tarjeta normal).
 */
function parsearKata(firma: string | null, testLines: string[]): Kata | null {
  if (firma === null) return null;
  const nombre = /^([A-Za-z_$][\w$]*)\s*\(/.exec(firma)?.[1];
  if (nombre === undefined) return null;

  const tests: KataTest[] = [];
  for (const linea of testLines) {
    const sep = linea.indexOf("=>");
    if (sep === -1) continue;
    try {
      tests.push({ args: JSON.parse(linea.slice(0, sep).trim()), espera: JSON.parse(linea.slice(sep + 2).trim()) });
    } catch {
      // test malformado (JSON inválido) — se ignora silenciosamente
    }
  }
  if (tests.length === 0) return null;
  return { firma, nombre, tests };
}

/** `porque` / `por qué` / `¿por qué?` — mismo marcador, tolerante a tildes y signos. */
function esEncabezadoPorque(titulo: string): boolean {
  return titulo.normalize("NFD").replace(/[\u0300-\u036f¿?.,:;!¡\s-]/g, "").toLowerCase() === "porque";
}

/** `distractores` / `distractor` — singular o plural. */
function esEncabezadoDistractores(titulo: string): boolean {
  const n = titulo.normalize("NFD").replace(/[\u0300-\u036f¿?.,:;!¡\s-]/g, "").toLowerCase();
  return n === "distractores" || n === "distractor";
}
