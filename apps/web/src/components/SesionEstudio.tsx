"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { calificar } from "@/app/actions";
import { GRADE_LABELS, type Grade } from "@mnemo/domain";

interface Tarjeta {
  id: string;
  question: string;
  answer: string;
}

const ESTILO_BOTON: Record<Grade, string> = {
  0: "border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400",
  1: "border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400",
  2: "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400",
  3: "border-sky-500/40 text-sky-600 hover:bg-sky-500/10 dark:text-sky-400",
};

export default function SesionEstudio({
  deckSlug,
  deckTitle,
  cards,
}: {
  deckSlug: string;
  deckTitle: string;
  cards: Tarjeta[];
}) {
  // La sesión es un snapshot de las vencidas al entrar: los refresh de router
  // que disparan las server actions no mutan la lista (encogería el total y
  // saltaría tarjetas). useState congela el prop del primer render.
  const [sesion] = useState(cards);
  const [indice, setIndice] = useState(0);
  const [revelada, setRevelada] = useState(false);
  const [conteo, setConteo] = useState<Record<Grade, number>>({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [ultimoIntervalo, setUltimoIntervalo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const terminada = indice >= sesion.length;
  const card = sesion[indice];

  const responder = useCallback(
    async (grade: Grade) => {
      if (card === undefined || enviando) return;
      setEnviando(true);
      try {
        const resultado = await calificar(card.id, deckSlug, grade);
        setConteo((prev) => ({ ...prev, [grade]: prev[grade] + 1 }));
        setUltimoIntervalo(
          resultado === null ? null : `Vuelve ${resultado.intervalDays === 1 ? "mañana" : `en ${resultado.intervalDays} días`}`,
        );
        setRevelada(false);
        setIndice((i) => i + 1);
      } finally {
        setEnviando(false);
      }
    },
    [card, deckSlug, enviando],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (terminada) return;
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        if (!revelada) setRevelada(true);
        return;
      }
      if (revelada && ["Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code)) {
        void responder((Number(event.code.slice(-1)) - 1) as Grade);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revelada, responder, terminada]);

  if (terminada) {
    return (
      <div className="space-y-6 py-12 text-center">
        <p className="text-5xl" aria-hidden>
          🎉
        </p>
        <h1 className="text-2xl font-semibold">Sesión completa</h1>
        <p className="text-muted">
          {sesion.length} tarjeta{sesion.length === 1 ? "" : "s"} de «{deckTitle}» repasada
          {sesion.length === 1 ? "" : "s"}.
        </p>
        <dl className="mx-auto flex w-fit gap-6 text-sm">
          {([0, 1, 2, 3] as Grade[]).map((grade) => (
            <div key={grade} className="text-center">
              <dt className="text-muted">{GRADE_LABELS[grade]}</dt>
              <dd className="text-xl font-semibold">{conteo[grade]}</dd>
            </div>
          ))}
        </dl>
        <div className="flex justify-center gap-3 text-sm">
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Tarjeta {indice + 1} de {sesion.length}
        </span>
        {ultimoIntervalo && <span className="text-muted">{ultimoIntervalo}</span>}
      </div>
      <div className="h-1 overflow-hidden rounded bg-foreground/10">
        <div className="h-full bg-accent transition-all" style={{ width: `${(indice / sesion.length) * 100}%` }} />
      </div>

      <article className="rounded-2xl border border-foreground/10 bg-card p-8 min-h-64 flex flex-col">
        <h2 className="text-xl font-medium leading-relaxed">{card.question}</h2>
        {revelada ? (
          <p className="mt-6 whitespace-pre-line border-t border-foreground/10 pt-6 leading-relaxed text-muted">
            {card.answer}
          </p>
        ) : (
          <div className="flex flex-1 items-end">
            <button
              onClick={() => setRevelada(true)}
              className="w-full rounded-lg border border-foreground/15 py-3 text-sm font-medium hover:border-accent/60 hover:text-accent"
            >
              Mostrar respuesta <kbd className="text-xs text-muted">espacio</kbd>
            </button>
          </div>
        )}
      </article>

      {revelada && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([0, 1, 2, 3] as Grade[]).map((grade) => (
            <button
              key={grade}
              disabled={enviando}
              onClick={() => void responder(grade)}
              className={`rounded-lg border bg-card px-3 py-2.5 text-sm font-medium transition disabled:opacity-50 ${ESTILO_BOTON[grade]}`}
            >
              {GRADE_LABELS[grade]} <kbd className="text-xs opacity-60">{grade + 1}</kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
