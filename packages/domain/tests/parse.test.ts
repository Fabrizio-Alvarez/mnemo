import { describe, expect, it } from "vitest";
import { DeckParseError, parseDeck } from "../src/index.ts";

const MAZO = `---
deck: Laravel — Eloquent
tags: [laravel, orm]
fuente: NotebookLM (Guía Laravel-Vue)
---

## ¿Qué es el problema N+1 y cómo lo resuelve Eloquent?
Consultar 1 vez la lista + N veces por cada relación.
Se resuelve con eager loading: \`with('relacion')\`.

## ¿Diferencia entre hasMany y belongsToMany?
hasMany: FK en la tabla del otro modelo.
belongsToMany: tabla pivote muchos-a-muchos.
`;

describe("parseDeck", () => {
  it("extrae los metadatos del frontmatter", () => {
    const deck = parseDeck(MAZO);
    expect(deck.meta.title).toBe("Laravel — Eloquent");
    expect(deck.meta.tags).toEqual(["laravel", "orm"]);
    expect(deck.meta.source).toBe("NotebookLM (Guía Laravel-Vue)");
  });

  it("cada encabezado ## es una tarjeta: título = pregunta, cuerpo = respuesta", () => {
    const deck = parseDeck(MAZO);
    expect(deck.cards).toHaveLength(2);
    expect(deck.cards[0]).toEqual({
      question: "¿Qué es el problema N+1 y cómo lo resuelve Eloquent?",
      answer: "Consultar 1 vez la lista + N veces por cada relación.\nSe resuelve con eager loading: `with('relacion')`.",
    });
    expect(deck.cards[1]?.question).toBe("¿Diferencia entre hasMany y belongsToMany?");
  });

  it("acepta title como alias de deck y source como alias de fuente", () => {
    const deck = parseDeck("---\ntitle: Mi mazo\nsource: apuntes\n---\n\n## Q?\nA\n");
    expect(deck.meta.title).toBe("Mi mazo");
    expect(deck.meta.source).toBe("apuntes");
  });

  it("normaliza CRLF (archivos guardados en Windows)", () => {
    const deck = parseDeck(MAZO.replace(/\n/g, "\r\n"));
    expect(deck.cards[0]?.answer).not.toContain("\r");
    expect(deck.cards).toHaveLength(2);
  });

  it("ignora prosa fuera de encabezados ## y encabezados de otro nivel", () => {
    const deck = parseDeck(
      ["# Título h1", "", "intro que no va", "", "### h3 ignorado", "", "## ¿P?", "R", "", "## ¿P2?", "R2"].join("\n"),
    );
    expect(deck.cards.map((c) => c.question)).toEqual(["¿P?", "¿P2?"]);
    // h1 opera como título cuando no hay frontmatter
    expect(deck.meta.title).toBe("Título h1");
  });

  it("sin frontmatter ni h1, cae a un título honesto derivado del contenido", () => {
    const deck = parseDeck("## ¿P?\nR");
    expect(deck.meta.title).toBe("¿P?");
  });

  it("un mazo sin encabezados ## da cero tarjetas sin explotar", () => {
    const deck = parseDeck("---\ndeck: Vacío\n---\n\nsolo prosa\n");
    expect(deck.cards).toEqual([]);
  });

  it("frontmatter sin cerrar es un error explícito", () => {
    expect(() => parseDeck("---\ndeck: roto\n\n## ¿P?\nR")).toThrow(DeckParseError);
  });

  it("tags sin corchetes (string simple) también funciona", () => {
    const deck = parseDeck("---\ndeck: X\ntags: laravel\n---\n\n## ¿P?\nR");
    expect(deck.meta.tags).toEqual(["laravel"]);
  });

  it("respuesta multilínea conserva el formato verbatim", () => {
    const deck = parseDeck("## ¿P?\n\nlínea 1\n\n- item a\n- item b\n\n  código indentado\n");
    expect(deck.cards[0]?.answer).toBe("línea 1\n\n- item a\n- item b\n\n  código indentado");
  });
});
