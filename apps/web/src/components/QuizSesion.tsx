"use client";

import { useState } from "react";
import Link from "next/link";
import { mezclar } from "@mnemo/domain";

interface Opcion {
  /** Texto de la opción: una respuesta del mazo. */
  texto: string;
  /** Pregunta hermana de donde salió la respuesta (undefined = la correcta). */
  origen?: string;
}

interface PreguntaQuiz {
  question: string;
  opciones: Opcion[];
  correcta: number;
  /** Explicación autoral (`### porque` en el .md) — el por qué conceptual. */
  explicacion: string | null;
}

export default function QuizSesion({
  deckSlug,
  deckTitle,
  preguntas,
}: {
  deckSlug: string;
  deckTitle: string;
  preguntas: PreguntaQuiz[];
}) {
  // Orden de preguntas mezclado al montar (mezclar del dominio, puro).
  const [orden] = useState(() => mezclar(preguntas));
  const [indice, setIndice] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);

  const terminada = indice >= orden.length;
  const pregunta = orden[indice];

  const responder = (opcion: number) => {
    if (elegida !== null || pregunta === undefined) return;
    setElegida(opcion);
    if (opcion === pregunta.correcta) setAciertos((a) => a + 1);
  };

  const siguiente = () => {
    setElegida(null);
    setIndice((i) => i + 1);
  };

  if (terminada) {
    const puntaje = Math.round((aciertos / orden.length) * 100);
    return (
      <div className="space-y-6 py-12 text-center">
        <p className="text-5xl" aria-hidden>
          {puntaje >= 80 ? "🏆" : puntaje >= 50 ? "💪" : "📚"}
        </p>
        <h1 className="text-2xl font-semibold">
          {aciertos} de {orden.length} correctas ({puntaje}%)
        </h1>
        <p className="text-muted">Modo práctica — tu plan de repaso queda intacto.</p>
        <div className="flex flex-col justify-center gap-3 text-sm sm:flex-row">
          <Link href={`/decks/${deckSlug}`} className="rounded-lg border border-foreground/15 px-4 py-2 hover:border-accent/60">
            Volver al mazo
          </Link>
          <Link href="/" className="rounded-lg border border-foreground/15 px-4 py-2 hover:border-accent/60">
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const acierto = elegida === pregunta.correcta;

  return (
    <div className="flex min-h-[calc(100dvh-15rem)] flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Pregunta {indice + 1} de {orden.length}
        </span>
        <span>{aciertos} correctas</span>
      </div>
      <div className="h-1 shrink-0 overflow-hidden rounded bg-foreground/10">
        <div className="h-full bg-accent transition-all" style={{ width: `${(indice / orden.length) * 100}%` }} />
      </div>

      <article className="rounded-2xl border border-foreground/10 bg-card p-6 sm:p-8">
        <h2 className="text-xl font-medium leading-relaxed">{pregunta.question}</h2>
      </article>

      <div className="grid flex-1 content-start gap-2">
        {pregunta.opciones.map((opcion, i) => {
          const esCorrecta = i === pregunta.correcta;
          const esElegida = i === elegida;
          const revelada = elegida !== null;
          return (
            <button
              key={i}
              onClick={() => responder(i)}
              disabled={revelada}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                !revelada
                  ? "border-foreground/15 hover:border-accent/60 hover:text-accent"
                  : esCorrecta
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : esElegida
                      ? "border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-400"
                      : "border-foreground/10 opacity-50"
              }`}
            >
              {opcion.texto}
              {revelada && esCorrecta && <span className="ml-2 text-xs font-semibold">✓ correcta</span>}
              {revelada && esElegida && !esCorrecta && (
                <span className="mt-1 block text-xs opacity-80">
                  ✗ responde a otra tarjeta: «{opcion.origen ?? "?"}»
                </span>
              )}
            </button>
          );
        })}
      </div>

      {elegida !== null && (
        <div className="space-y-3 pb-[env(safe-area-inset-bottom)]">
          {pregunta.explicacion && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm leading-relaxed">
              <span className="font-semibold text-accent">💡 Por qué:</span>{" "}
              <span className="whitespace-pre-line">{pregunta.explicacion}</span>
            </div>
          )}
          {!acierto && !pregunta.explicacion && (
            <p className="text-sm text-muted">
              La correcta es la opción marcada en verde — las demás responden a otras preguntas del mazo.
            </p>
          )}
          <div className="flex justify-end">
            <button
              onClick={siguiente}
              className="w-full rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white hover:opacity-90 sm:w-auto"
            >
              {indice + 1 === orden.length ? "Ver resultado" : "Siguiente"} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
