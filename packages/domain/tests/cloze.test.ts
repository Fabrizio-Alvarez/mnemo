import { describe, expect, it } from "vitest";
import { extraerClozes, ocultarPrimerCloze, segmentarCloze, tieneCloze } from "../src/index.ts";
import { armarQuiz } from "../src/index.ts";

describe("cloze — detección y extracción", () => {
  it("tieneCloze detecta ==texto== y distingue == de nada", () => {
    expect(tieneCloze("El ==cache-aside== pattern")).toBe(true);
    expect(tieneCloze("==varias== palabras ==ocultas==")).toBe(true);
    expect(tieneCloze("sin huecos")).toBe(false);
    expect(tieneCloze("a == b comparación suelta")).toBe(false); // requiere cerrar ==
    expect(tieneCloze("==== vacío no es hueco")).toBe(false); // sin contenido entre ==
  });

  it("extraerClozes devuelve los textos ocultos en orden", () => {
    expect(extraerClozes("primero ==uno== luego ==dos==")).toEqual(["uno", "dos"]);
  });

  it("segmentarCloze intercala texto y huecos preservando todo", () => {
    expect(segmentarCloze("antes ==medio== después ==otro== fin")).toEqual([
      { texto: "antes " },
      { hueco: "medio" },
      { texto: " después " },
      { hueco: "otro" },
      { texto: " fin" },
    ]);
    expect(segmentarCloze("sin huecos")).toEqual([{ texto: "sin huecos" }]);
    expect(segmentarCloze("==arranca== oculto")).toEqual([{ hueco: "arranca" }, { texto: " oculto" }]);
  });

  it("ocultarPrimerCloze: primer hueco en blank, el resto visible sin marcas", () => {
    expect(ocultarPrimerCloze("El ==primero== y el ==segundo== quedan")).toBe(
      "El [ ____ ] y el segundo quedan",
    );
    expect(ocultarPrimerCloze("sin huecos")).toBe("sin huecos");
  });
});

describe("armarQuiz — tarjetas cloze", () => {
  const MAZO = [
    {
      question: "¿Qué patrón describe el cache-aside?",
      answer: "La app ==consulta el cache== y solo ante fallo lee la BD y repuebla.",
      distractores: ["La BD escribe el cache al mutar.", "El cache es la fuente de verdad.", "La app consulta siempre la BD."],
    },
    { question: "¿Otra?", answer: "Respuesta hermana." },
    { question: "¿Otra más?", answer: "Otra hermana." },
    { question: "¿Y otra?", answer: "Y otra." },
  ];

  it("el enunciado es la respuesta con el primer hueco en blank", () => {
    const quiz = armarQuiz(MAZO, () => 0.9999);
    const item = quiz[0]!;
    expect(item.pregunta).toBe("La app [ ____ ] y solo ante fallo lee la BD y repuebla.");
    // la correcta es el TEXTO DEL HUECO, no la respuesta completa
    expect(item.opciones[item.correcta]?.texto).toBe("consulta el cache");
  });

  it("los distractores autorales son los rellenos erróneos del fill-in", () => {
    const quiz = armarQuiz(MAZO, () => 0.9999);
    const textos = quiz[0]!.opciones.map((o) => o.texto);
    expect(textos).toContain("La BD escribe el cache al mutar.");
    expect(textos).toContain("El cache es la fuente de verdad.");
    expect(textos).toContain("La app consulta siempre la BD.");
    // sin hermanas de otro tema: las autorales completan los 3
    expect(textos).not.toContain("Respuesta hermana.");
  });

  it("tarjeta normal: pregunta = encabezado, correcta = respuesta", () => {
    const quiz = armarQuiz(MAZO, () => 0.9999);
    expect(quiz[1]!.pregunta).toBe("¿Otra?");
    expect(quiz[1]!.opciones[quiz[1]!.correcta]?.texto).toBe("Respuesta hermana.");
  });
});
