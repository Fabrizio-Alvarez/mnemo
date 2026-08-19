import { sha256 } from "./sha256.ts";

/**
 * Id estable de tarjeta: hash(deckSlug + "\n" + pregunta).
 * Regla del diseño: editar una pregunta = otra tarjeta (estado nuevo);
 * el resto de ediciones (respuesta, orden) mantienen el id y su historial SRS.
 * 16 chars hex = 64 bits — sin colisiones prácticas para una biblioteca personal.
 */
export function cardId(deckSlug: string, question: string): string {
  return sha256(`${deckSlug}\n${question}`).slice(0, 16);
}

/** Slug de mazo desde el nombre de archivo (o título): "Laravel — Eloquent.md" → "laravel-eloquent". */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacríticos
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
