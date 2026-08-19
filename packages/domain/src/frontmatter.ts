import { DeckParseError } from "./deck.ts";

/**
 * Mini-parser de frontmatter YAML-plano: soporta exactamente lo que un mazo
 * necesita — `clave: valor` y `tags: [a, b, c]`. Sin dependencias: el formato
 * de mazos es el contrato, y mantenerlo chico lo mantiene auditable.
 */
export function parseFrontmatter(raw: string): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const match = /^([\w-]+)\s*:\s*(.*)$/.exec(trimmed);
    if (match === null) {
      throw new DeckParseError(`Clave de frontmatter inválida: "${trimmed}"`);
    }
    const [, key, value] = match;
    const inlineArray = /^\[(.*)\]$/.exec(value.trim());
    out[key] = inlineArray
      ? inlineArray[1]!
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== "")
      : value.trim();
  }
  return out;
}
