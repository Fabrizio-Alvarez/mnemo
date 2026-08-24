import { describe, expect, it } from "vitest";
import { mejorRacha, rachaActual } from "../src/index.ts";

const HOY = new Date(2026, 7, 21); // 2026-08-21 (mes 7 = agosto, base 0)
const iso = (offset: number) => {
  const d = new Date(2026, 7, 21 + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

describe("rachaActual", () => {
  it("cuenta días consecutivos terminando hoy", () => {
    expect(rachaActual(new Set([iso(0), iso(-1), iso(-2)]), HOY)).toBe(3);
  });

  it("hoy sin actividad: la racha sigue viva hasta ayer", () => {
    expect(rachaActual(new Set([iso(-1), iso(-2)]), HOY)).toBe(2);
  });

  it("se corta con un hueco", () => {
    // ayer sí, anteayer no, hace 3 sí → racha 1
    expect(rachaActual(new Set([iso(-1), iso(-3)]), HOY)).toBe(1);
  });

  it("sin actividad = racha 0", () => {
    expect(rachaActual(new Set([iso(-5)]), HOY)).toBe(0);
  });
});

describe("mejorRacha", () => {
  it("encuentra la más larga aunque no sea la actual", () => {
    const dias = new Set([iso(-10), iso(-9), iso(-8), iso(-7), iso(-2), iso(-1)]);
    expect(mejorRacha(dias)).toBe(4);
  });

  it("días sueltos = mejor racha 1", () => {
    expect(mejorRacha(new Set([iso(-3), iso(-1)]))).toBe(1);
  });

  it("vacío = 0", () => {
    expect(mejorRacha(new Set())).toBe(0);
  });
});
