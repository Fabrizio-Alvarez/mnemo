import { describe, expect, it } from "vitest";
import { armarQuiz } from "../src/index.ts";

const MAZO = [
  { question: "¿A?", answer: "Respuesta A" },
  { question: "¿B?", answer: "Respuesta B" },
  { question: "¿C?", answer: "Respuesta C" },
  { question: "¿D?", answer: "Respuesta D" },
  { question: "¿E?", answer: "Respuesta E" },
];

describe("armarQuiz", () => {
  it("cada pregunta tiene 4 opciones únicas incluyendo la correcta", () => {
    const quiz = armarQuiz(MAZO);
    expect(quiz).toHaveLength(5);
    for (const item of quiz) {
      expect(item.opciones).toHaveLength(4);
      expect(new Set(item.opciones).size).toBe(4);
      expect(item.opciones[item.correcta]).toBe(item.tarjeta.answer);
    }
  });

  it("los distractores son respuestas de tarjetas hermanas (nunca la propia dos veces)", () => {
    const quiz = armarQuiz(MAZO);
    const respuestas = new Set(MAZO.map((c) => c.answer));
    for (const item of quiz) {
      for (const opcion of item.opciones) expect(respuestas.has(opcion)).toBe(true);
    }
  });

  it("mazos chicos: menos opciones en vez de romper", () => {
    const quiz = armarQuiz([
      { question: "¿A?", answer: "R1" },
      { question: "¿B?", answer: "R2" },
    ]);
    expect(quiz[0]?.opciones).toHaveLength(2);
    expect(quiz[0]?.opciones[quiz[0]!.correcta]).toBe("R1");
  });

  it("respuestas duplicadas en el mazo no duplican opciones", () => {
    const quiz = armarQuiz([
      { question: "¿A?", answer: "Igual" },
      { question: "¿B?", answer: "Igual" },
      { question: "¿C?", answer: "Distinta" },
      { question: "¿D?", answer: "Otra" },
    ]);
    for (const item of quiz) expect(new Set(item.opciones).size).toBe(item.opciones.length);
    // la primera tarjeta solo puede ofrecer 3 opciones: su respuesta duplicada no sirve de distractor
    expect(quiz[0]?.opciones).toHaveLength(3);
  });

  it("determinista con rng fijo (mismo orden ambas corridas)", () => {
    const secuencia = () => {
      let x = 1;
      return () => (x = (x * 48271) % 2147483647) / 2147483647;
    };
    const a = armarQuiz(MAZO, secuencia());
    const b = armarQuiz(MAZO, secuencia());
    expect(a.map((i) => i.opciones)).toEqual(b.map((i) => i.opciones));
    expect(a.map((i) => i.correcta)).toEqual(b.map((i) => i.correcta));
  });

  it("rng que siempre devuelve 0.9999 deja el orden dado (identidad del shuffle)", () => {
    const quiz = armarQuiz(MAZO, () => 0.9999);
    expect(quiz[0]?.opciones[0]).toBe("Respuesta A");
  });
});
