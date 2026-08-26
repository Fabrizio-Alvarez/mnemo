import { describe, expect, it } from "vitest";
import { generarDeckMD, importarNotebookLM } from "../src/index.ts";
import { parseDeck } from "../src/index.ts";

// Ejemplo realista: FAQ de NotebookLM pegado tal cual.
const FAQ_NOTEBOOKLM = `Estudio guía — Laravel Entrevista
Generado con NotebookLM

**Q: ¿Qué es el Service Container?**
El contenedor de dependencias de Laravel. Sabe cómo construir objetos y resolver sus dependencias. Se configuran los bindings en los Service Providers.

**Q: ¿bind vs singleton?**
\`bind\` crea una nueva instancia cada vez. \`singleton\` reutiliza la misma.

**Q: ¿Qué es el middleware?**
Capas que interceptan el request antes del controller. Sirve para auth, CORS, CSRF, logging.
`;

describe("importarNotebookLM", () => {
  it("parsea el formato principal de NotebookLM (**Q: pregunta**)", () => {
    const cards = importarNotebookLM(FAQ_NOTEBOOKLM);
    expect(cards).toHaveLength(3);
    expect(cards[0]!.question).toBe("¿Qué es el Service Container?");
    expect(cards[0]!.answer).toContain("contenedor de dependencias");
    expect(cards[1]!.question).toBe("¿bind vs singleton?");
    expect(cards[1]!.answer).toBe("`bind` crea una nueva instancia cada vez. `singleton` reutiliza la misma.");
  });

  it("ignora el texto antes de la primera pregunta (intro, título)", () => {
    const cards = importarNotebookLM("Título\n\nIntro random\n\n**Q: ¿P?**\nR");
    expect(cards).toHaveLength(1);
    expect(cards[0]!.question).toBe("¿P?");
  });

  it("acepta Q: sin bold", () => {
    const cards = importarNotebookLM("Q: ¿Pregunta 1?\nRespuesta 1\n\nQ: ¿Pregunta 2?\nRespuesta 2");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toEqual({ question: "¿Pregunta 1?", answer: "Respuesta 1" });
    expect(cards[1]).toEqual({ question: "¿Pregunta 2?", answer: "Respuesta 2" });
  });

  it("acepta ### Q: pregunta (h3 con prefijo)", () => {
    const cards = importarNotebookLM("### Q: ¿P?\nR");
    expect(cards).toHaveLength(1);
    expect(cards[0]!.question).toBe("¿P?");
  });

  it("acepta ### ¿pregunta? (h3 sin prefijo, termina con ?)", () => {
    const cards = importarNotebookLM("### ¿Qué es X?\nRespuesta");
    expect(cards).toHaveLength(1);
    expect(cards[0]!.question).toBe("¿Qué es X?");
  });

  it("acepta **¿pregunta?** (bold sin prefijo Q:, termina con ?)", () => {
    const cards = importarNotebookLM("**¿Qué es Eloquent?**\nEl ORM de Laravel.");
    expect(cards).toHaveLength(1);
    expect(cards[0]!.question).toBe("¿Qué es Eloquent?");
  });

  it("descarta preguntas con respuesta vacía", () => {
    const cards = importarNotebookLM("**Q: ¿P con respuesta?**\nTexto\n\n**Q: ¿P vacía?**\n\n**Q: ¿P3?**\nR3");
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.question)).toEqual(["¿P con respuesta?", "¿P3?"]);
  });

  it("normaliza CRLF (archivos/clipboard de Windows)", () => {
    const cards = importarNotebookLM(FAQ_NOTEBOOKLM.replace(/\n/g, "\r\n"));
    expect(cards).toHaveLength(3);
    expect(cards[0]!.answer).not.toContain("\r");
  });

  it("strips optional A: prefix del primer renglón de respuesta", () => {
    const cards = importarNotebookLM("Q: ¿P?\nA: Respuesta con prefijo");
    expect(cards[0]!.answer).toBe("Respuesta con prefijo");
  });

  it("conserva respuesta multilínea verbatim (listas, código)", () => {
    const input = `**Q: ¿P?**
línea 1

- item a
- item b

  código indentado`;
    const cards = importarNotebookLM(input);
    expect(cards[0]!.answer).toBe("línea 1\n\n- item a\n- item b\n\n  código indentado");
  });

  it("texto sin preguntas devuelve array vacío sin explotar", () => {
    expect(importarNotebookLM("solo prosa\nsin preguntas")).toEqual([]);
    expect(importarNotebookLM("")).toEqual([]);
  });
});

describe("generarDeckMD", () => {
  it("genera el formato canónico con frontmatter + ## por tarjeta", () => {
    const md = generarDeckMD(
      { title: "Laravel — Entrevista", tags: ["laravel", "php"], source: "NotebookLM" },
      [
        { question: "¿Qué es X?", answer: "Respuesta" },
        { question: "¿Qué es Y?", answer: "Respuesta Y" },
      ],
    );
    expect(md).toContain("deck: Laravel — Entrevista");
    expect(md).toContain("tags: [laravel, php]");
    expect(md).toContain("fuente: NotebookLM");
    expect(md).toContain("## ¿Qué es X?\nRespuesta");
    expect(md).toContain("## ¿Qué es Y?\nRespuesta Y");
  });

  it("omite tags y fuente si no hay", () => {
    const md = generarDeckMD({ title: "Simple", tags: [] }, [{ question: "¿P?", answer: "R" }]);
    expect(md).not.toContain("tags:");
    expect(md).not.toContain("fuente:");
    expect(md).toContain("deck: Simple");
  });

  it("es la inversa de parseDeck: importar → generar → parsear = mismo contenido", () => {
    const cards = importarNotebookLM(FAQ_NOTEBOOKLM);
    const md = generarDeckMD(
      { title: "Laravel — Entrevista", tags: ["laravel"], source: "NotebookLM" },
      cards,
    );
    const reparsed = parseDeck(md);
    expect(reparsed.cards).toEqual(cards);
    expect(reparsed.meta.title).toBe("Laravel — Entrevista");
    expect(reparsed.meta.tags).toEqual(["laravel"]);
    expect(reparsed.meta.source).toBe("NotebookLM");
  });
});
