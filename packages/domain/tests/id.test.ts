import { describe, expect, it } from "vitest";
import { cardId, sha256, slugify } from "../src/index.ts";

describe("sha256 (implementación pura)", () => {
  it("vectores NIST FIPS 180-4", () => {
    expect(sha256("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")).toBe(
      "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
    );
  });

  it("soporta unicode (preguntas con acentos y ñ)", () => {
    const unicode = sha256("¿qué? ñ");
    expect(unicode).toMatch(/^[0-9a-f]{64}$/);
    expect(unicode).not.toBe(sha256("que? n"));
    expect(sha256("mañana")).not.toBe(sha256("manana"));
  });
});

describe("cardId", () => {
  it("determinista: mismo deck+pregunta → mismo id", () => {
    expect(cardId("laravel-eloquent", "¿Qué es el problema N+1?")).toBe(
      cardId("laravel-eloquent", "¿Qué es el problema N+1?"),
    );
  });

  it("16 hex chars", () => {
    expect(cardId("a", "b")).toMatch(/^[0-9a-f]{16}$/);
  });

  it("distinta pregunta o distinto mazo → distinto id (editar pregunta = nueva tarjeta)", () => {
    const base = cardId("deck", "Pregunta A");
    expect(cardId("deck", "Pregunta B")).not.toBe(base);
    expect(cardId("otro-deck", "Pregunta A")).not.toBe(base);
  });
});

describe("slugify", () => {
  it("nombre de archivo → slug", () => {
    expect(slugify("Laravel — Eloquent.md")).toBe("laravel-eloquent-md");
    expect(slugify("Guía de Estudio")).toBe("guia-de-estudio");
  });

  it("cola y colapsa separadores", () => {
    expect(slugify("  ¿React o Vue?  ")).toBe("react-o-vue");
    expect(slugify("a---b")).toBe("a-b");
    expect(slugify("")).toBe("");
  });
});
