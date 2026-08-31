import { describe, expect, it } from "vitest";
import { armarQuiz, parseDeck } from "../src/index.ts";

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
      const textos = item.opciones.map((o) => o.texto);
      expect(textos).toHaveLength(4);
      expect(new Set(textos).size).toBe(4);
      expect(item.opciones[item.correcta]?.texto).toBe(item.tarjeta.answer);
    }
  });

  it("los distractores son respuestas de tarjetas hermanas (nunca la propia dos veces)", () => {
    const quiz = armarQuiz(MAZO);
    const respuestas = new Set(MAZO.map((c) => c.answer));
    for (const item of quiz) {
      for (const opcion of item.opciones) expect(respuestas.has(opcion.texto)).toBe(true);
    }
  });

  it("cada distractor lleva el origen: la pregunta de la tarjeta hermana de donde salió", () => {
    const quiz = armarQuiz(MAZO);
    const preguntas = new Map(MAZO.map((c) => [c.answer, c.question]));
    for (const item of quiz) {
      for (const [i, opcion] of item.opciones.entries()) {
        if (i === item.correcta) {
          expect(opcion.origen).toBeUndefined();
        } else {
          expect(opcion.origen).toBe(preguntas.get(opcion.texto));
          expect(opcion.origen).not.toBe(item.tarjeta.question);
        }
      }
    }
  });

  it("mazos chicos: menos opciones en vez de romper", () => {
    const quiz = armarQuiz([
      { question: "¿A?", answer: "R1" },
      { question: "¿B?", answer: "R2" },
    ]);
    expect(quiz[0]?.opciones).toHaveLength(2);
    expect(quiz[0]?.opciones[quiz[0]!.correcta]?.texto).toBe("R1");
  });

  it("respuestas duplicadas en el mazo no duplican opciones (queda la primera con su origen)", () => {
    const quiz = armarQuiz([
      { question: "¿A?", answer: "Igual" },
      { question: "¿B?", answer: "Igual" },
      { question: "¿C?", answer: "Distinta" },
      { question: "¿D?", answer: "Otra" },
    ]);
    for (const item of quiz) {
      const textos = item.opciones.map((o) => o.texto);
      expect(new Set(textos).size).toBe(textos.length);
    }
    // la primera tarjeta solo puede ofrecer 3 opciones: su respuesta duplicada no sirve de distractor
    expect(quiz[0]?.opciones).toHaveLength(3);
    // para ¿C? el "Igual" duplicado SÍ es distractor: dedupe conservó la primera aparición (¿A?)
    const itemC = quiz[2]!;
    expect(itemC.opciones.find((o) => o.texto === "Igual")?.origen).toBe("¿A?");
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
    expect(quiz[0]?.opciones[0]?.texto).toBe("Respuesta A");
  });
});

describe("explicación didáctica (### porque)", () => {
  it("el sub-encabezado ### porque separa la respuesta de la explicación", () => {
    const deck = parseDeck(
      ["## ¿P?", "Respuesta corta.", "", "### porque", "El concepto detrás: X ≠ Y porque Z.", ""].join("\n"),
    );
    expect(deck.cards[0]?.answer).toBe("Respuesta corta.");
    expect(deck.cards[0]?.explanation).toBe("El concepto detrás: X ≠ Y porque Z.");
  });

  it("acepta variantes: por qué, ¿por qué?, PORQUE", () => {
    for (const titulo of ["por qué", "¿por qué?", "PORQUE", "Porque:"]) {
      const deck = parseDeck(`## ¿P?\nR\n\n### ${titulo}\nExplicación.`);
      expect(deck.cards[0]?.explanation, `titulo: ${titulo}`).toBe("Explicación.");
      expect(deck.cards[0]?.answer, `titulo: ${titulo}`).toBe("R");
    }
  });

  it("sin ### porque no hay explicación (campo ausente, no vacío)", () => {
    const deck = parseDeck("## ¿P?\nR");
    expect(deck.cards[0]?.explanation).toBeUndefined();
  });

  it("otro sub-encabezado ### no es explicación — queda en la respuesta verbatim", () => {
    const deck = parseDeck("## ¿P?\nR\n\n### notas\notra cosa");
    expect(deck.cards[0]?.explanation).toBeUndefined();
    expect(deck.cards[0]?.answer).toContain("### notas");
  });

  it("explicación multilínea se conserva completa", () => {
    const deck = parseDeck("## ¿P?\nR\n\n### porque\nlínea 1\nlínea 2\n\n- item");
    expect(deck.cards[0]?.explanation).toBe("línea 1\nlínea 2\n\n- item");
  });
});

describe("distractores autorales (### distractores)", () => {
  it("la lista bajo ### distractores parsea a string[] y no contamina respuesta ni porque", () => {
    const deck = parseDeck(
      "## ¿P?\nRespuesta.\n\n### porque\nConcepto.\n\n### distractores\n- Casi correcto A.\n- Casi correcto B.\n- Casi correcto C.",
    );
    expect(deck.cards[0]?.distractores).toEqual(["Casi correcto A.", "Casi correcto B.", "Casi correcto C."]);
    expect(deck.cards[0]?.answer).toBe("Respuesta.");
    expect(deck.cards[0]?.explanation).toBe("Concepto.");
  });

  it("sin ### distractores el campo está ausente", () => {
    const deck = parseDeck("## ¿P?\nR");
    expect(deck.cards[0]?.distractores).toBeUndefined();
  });

  it("renglones sin viñeta dentro de la sección se ignoran (solo `- item`)", () => {
    const deck = parseDeck("## ¿P?\nR\n\n### distractores\n- Válido.\nprosa sin viñeta");
    expect(deck.cards[0]?.distractores).toEqual(["Válido."]);
  });

  it("armarQuiz prioriza los autorales y completa con hermanas hasta 3", () => {
    const mazo = [
      { question: "¿A?", answer: "Correcta A", distractores: ["Plausible A1", "Plausible A2"] },
      { question: "¿B?", answer: "Correcta B" },
      { question: "¿C?", answer: "Correcta C" },
      { question: "¿D?", answer: "Correcta D" },
      { question: "¿E?", answer: "Correcta E" },
    ];
    const quiz = armarQuiz(mazo, () => 0.9999);
    const item = quiz[0]!;
    const textos = item.opciones.map((o) => o.texto);
    expect(textos).toContain("Plausible A1");
    expect(textos).toContain("Plausible A2");
    // el tercer distractor es una respuesta hermana (completa hasta 3)
    const hermanas = new Set(["Correcta B", "Correcta C", "Correcta D", "Correcta E"]);
    const tercer = textos.find((t) => t !== "Correcta A" && t !== "Plausible A1" && t !== "Plausible A2");
    expect(hermanas.has(tercer!)).toBe(true);
    // los autorales NO llevan origen (no responden a otra pregunta)
    for (const o of item.opciones) {
      if (o.texto.startsWith("Plausible")) expect(o.origen).toBeUndefined();
    }
    // los hermanos SÍ lo llevan
    const opHermana = item.opciones.find((o) => hermanas.has(o.texto));
    expect(opHermana?.origen).toBeDefined();
  });

  it("3 autorales completos: no entra ninguna hermana", () => {
    const mazo = [
      { question: "¿A?", answer: "Correcta A", distractores: ["D1", "D2", "D3"] },
      { question: "¿B?", answer: "Correcta B" },
    ];
    const quiz = armarQuiz(mazo, () => 0.9999);
    const textos = quiz[0]!.opciones.map((o) => o.texto);
    expect(textos.sort()).toEqual(["Correcta A", "D1", "D2", "D3"]);
  });

  it("distractor autoral igual a la respuesta se descarta (seguridad anti-autor-errado)", () => {
    const mazo = [
      { question: "¿A?", answer: "Correcta", distractores: ["Correcta", "Válido", "Otro", "Y un tercero"] },
      { question: "¿B?", answer: "Hermana B" },
    ];
    const quiz = armarQuiz(mazo, () => 0.9999);
    const textos = quiz[0]!.opciones.map((o) => o.texto);
    expect(textos.filter((t) => t === "Correcta")).toHaveLength(1); // solo la correcta
  });
});
