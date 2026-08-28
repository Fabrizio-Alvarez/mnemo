# Prompt: generador de mazos para Mnemo

Copiá este prompt a cualquier LLM (Claude, ChatGPT, Gemini, NotebookLM+chat, etc.) junto con el tema o material fuente. El output es un `.md` listo para `decks/` + `pnpm db:remoto`.

---

## El prompt

```text
Sos un generador de mazos de estudio para un sistema de repetición espaciada (SM-2).
Generás tarjetas pregunta/respuesta en Markdown, en ESPAÑOL, con este formato EXACTO:

---
deck: <Título del mazo — formato "Tema — Contexto", ej: "Laravel — Entrevista">
tags: [<tag1>, <tag2>]
fuente: <de dónde salió el material>
---

## <¿Pregunta?>
<Respuesta corta: 1 a 3 líneas, verbatim.>

### porque
<Explicación conceptual: el POR QUÉ, no repetir la respuesta.>
```

REGLAS DE FORMATO (innegociables):
1. Un solo bloque de texto: el .md completo, sin explicaciones alrededor.
2. Cada tarjeta = un encabezado `##`. La pregunta en el encabezado, la respuesta en el cuerpo.
3. `### porque` es OPCIONAL pero OBLIGATORIO en tarjetas de comparación ("X vs Y"):
   ahí explica el criterio para decidir cuándo usar cada uno y el error clásico.
4. Frontmatter: `deck`, `tags` (array), `fuente`.

REGLAS DE CALIDAD:
1. Entre 10 y 15 tarjetas. Densidad > cantidad: cada tarjeta un solo concepto.
2. Preguntas CONCEPTUALES, no trivia: "¿por qué...?", "¿cuándo usar X vs Y?", "¿qué pasa si...?".
   Evitá "¿cuál es la versión de...?" y preguntas de memorización pura de sintaxis.
3. Respuestas CORTAS (1-3 líneas) y DISTINTAS entre sí: en el modo quiz, las respuestas
   de otras tarjetas son los distractores — respuestas parecidas entre sí arruinan el quiz.
4. `### porque` enseña el razonamiento: criterios de decisión, trade-offs, el error típico.
   No repitas la respuesta: explicá lo que la respuesta presupone.
5. Ordená de lo fundamental a lo avanzado.
6. Si el material fuente cubre mucho, elegí lo que aparece en entrevistas/uso real.

TEMÁTICA / MATERIAL FUENTE:
<pegá acá el tema ("Vue 3 composables") o el material (FAQ de NotebookLM, apuntes, doc)>
```

---

## Workflow recomendado

| Escenario | Cómo |
|-----------|------|
| Tenés PDFs/apuntes propios | NotebookLM genera el FAQ → pegás FAQ en el prompt → LLM → .md |
| Tema que el LLM domina | Tema directo en el prompt → .md |
| Urgente | Pedirselo al agente de la sesión: genera el .md directo en `decks/` |

Después: guardar en `decks/<slug>.md` → `pnpm db:remoto` (Neon) o `pnpm seed` (local).
El slug sale del nombre de archivo: `laravel-entrevista.md` → `laravel-entrevista`.

## Validación rápida del output

- [ ] Frontmatter con `deck`, `tags`, `fuente`
- [ ] Todas las preguntas empiezan con `## `
- [ ] Comparaciones "X vs Y" tienen `### porque`
- [ ] No hay dos respuestas casi idénticas (mataría los distractores del quiz)
- [ ] 10-15 tarjetas
