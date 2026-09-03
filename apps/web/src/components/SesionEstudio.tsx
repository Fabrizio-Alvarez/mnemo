"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { calificar, deshacerUltima } from "@/app/actions";
import { GRADE_LABELS, type Grade } from "@mnemo/domain";

interface Tarjeta {
  id: string;
  question: string;
  answer: string;
  kata: { firma: string; nombre: string; tests: { args: unknown[]; espera: unknown }[] } | null;
}

/** Ítem de la cola de estudio; una tarjeta re-encolada vuelve al final (máx 1 vez). */
interface ItemCola extends Tarjeta {
  reencolada: boolean;
}

/** Una calificación aplicada: lo mínimo para poder deshacerla. */
interface Accion {
  cardId: string;
  grade: Grade;
  /** Posición que tenía la tarjeta en la cola al calificarla. */
  indice: number;
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
  // La COLA sí muta: "Otra vez" re-encola la tarjeta al final (máx 1 reencolado
  // por tarjeta — el flag lo corta) para repetirla dentro de la sesión.
  const [cola, setCola] = useState<ItemCola[]>(() => cards.map((c) => ({ ...c, reencolada: false })));
  const [historial, setHistorial] = useState<Accion[]>([]);
  const [indice, setIndice] = useState(0);
  const [revelada, setRevelada] = useState(false);
  const [ultimoIntervalo, setUltimoIntervalo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const terminada = indice >= cola.length;
  const card = cola[indice];
  const puedeDeshacer = historial.length > 0 && !terminada && !enviando;

  // Resumen final: por tarjeta original cuenta su ÚLTIMA calificación de la
  // sesión (una re-encolada calificada 0 y luego 2 cuenta como 2, estilo Anki).
  const conteoFinal = useMemo(() => {
    const ultima = new Map<string, Grade>();
    for (const accion of historial) ultima.set(accion.cardId, accion.grade);
    const conteo: Record<Grade, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (const tarjeta of sesion) {
      const grade = ultima.get(tarjeta.id);
      if (grade !== undefined) conteo[grade]++;
    }
    return conteo;
  }, [historial, sesion]);

  const responder = useCallback(
    async (grade: Grade) => {
      if (card === undefined || enviando) return;
      setEnviando(true);
      try {
        const resultado = await calificar(card.id, deckSlug, grade);
        setHistorial((h) => [...h, { cardId: card.id, grade, indice }]);
        if (grade === 0 && !card.reencolada) {
          setCola((q) => [...q, { ...card, reencolada: true }]);
        }
        setUltimoIntervalo(
          resultado === null ? null : `Vuelve ${resultado.intervalDays === 1 ? "mañana" : `en ${resultado.intervalDays} días`}`,
        );
        setRevelada(false);
        setIndice((i) => i + 1);
      } finally {
        setEnviando(false);
      }
    },
    [card, deckSlug, enviando, indice],
  );

  const deshacer = useCallback(async () => {
    const ultima = historial.at(-1);
    if (ultima === undefined || enviando) return;
    setEnviando(true);
    try {
      const ok = await deshacerUltima(ultima.cardId);
      if (!ok) return;
      setHistorial((h) => h.slice(0, -1));
      if (ultima.grade === 0) {
        // la copia re-encolada de esa calificación sale de la cola
        setCola((q) => {
          const copiaIdx = q.findIndex((t) => t.id === ultima.cardId && t.reencolada);
          if (copiaIdx === -1) return q;
          return q.filter((_, i) => i !== copiaIdx);
        });
      }
      setUltimoIntervalo(null);
      setRevelada(true);
      setIndice(ultima.indice);
    } finally {
      setEnviando(false);
    }
  }, [enviando, historial]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (terminada) return;
      // Mientras se escribe (editor kata, inputs) el teclado es del usuario:
      // los atajos solo aplican fuera de elementos editables.
      const t = event.target as HTMLElement | null;
      if (t !== null && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.tagName === "SELECT" || t.isContentEditable)) {
        return;
      }
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        if (!revelada) setRevelada(true);
        return;
      }
      if (revelada && ["Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code)) {
        void responder((Number(event.code.slice(-1)) - 1) as Grade);
        return;
      }
      if (event.code === "KeyZ") void deshacer();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revelada, responder, deshacer, terminada]);

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
              <dd className="text-xl font-semibold">{conteoFinal[grade]}</dd>
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
    // Móvil: la sesión llena el viewport — la tarjeta crece (flex-1) y los
    // botones quedan abajo en la zona del pulgar, con padding de safe-area
    // para el gesture bar de iOS (requiere viewport-fit=cover en el layout).
    <div className="flex min-h-[calc(100dvh-11.5rem)] flex-col gap-5">
      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <span>
          Tarjeta {indice + 1} de {cola.length}
          {cola.length > sesion.length && (
            <span className="text-foreground/60"> (+{cola.length - sesion.length} re-encolada{cola.length - sesion.length === 1 ? "" : "s"})</span>
          )}
        </span>
        <div className="flex items-center gap-3">
          {ultimoIntervalo && <span>{ultimoIntervalo}</span>}
          <button
            onClick={() => void deshacer()}
            disabled={!puedeDeshacer}
            title="Deshacer la última calificación (Z)"
            className="rounded-lg border border-foreground/15 px-3 py-2 hover:border-accent/60 hover:text-accent disabled:opacity-40 disabled:hover:border-foreground/15 disabled:hover:text-inherit"
          >
            ⟲ Deshacer <kbd className="hidden text-xs opacity-60 [@media(hover:hover)]:inline">z</kbd>
          </button>
        </div>
      </div>
      <div className="h-1 shrink-0 overflow-hidden rounded bg-foreground/10">
        <div className="h-full bg-accent transition-all" style={{ width: `${(indice / cola.length) * 100}%` }} />
      </div>

      <article className="flex min-h-64 flex-1 flex-col rounded-2xl border border-foreground/10 bg-card p-6 sm:p-8">
        <h2 className="text-xl font-medium leading-relaxed">{card.question}</h2>
        {card.kata !== null ? (
          <KataEjercicio key={card.id} kata={card.kata} solucion={card.answer} revelada={revelada} onVerSolucion={() => setRevelada(true)} />
        ) : revelada ? (
          <p className="mt-6 whitespace-pre-line border-t border-foreground/10 pt-6 leading-relaxed text-muted">
            {card.answer}
            {card.reencolada && <span className="mt-3 block text-xs text-foreground/50">↩ re-encolada — segunda pasada</span>}
          </p>
        ) : (
          <div className="flex flex-1 items-end">
            <button
              onClick={() => setRevelada(true)}
              className="w-full rounded-lg border border-foreground/15 py-4 text-sm font-medium hover:border-accent/60 hover:text-accent"
            >
              Mostrar respuesta <kbd className="hidden text-xs text-muted [@media(hover:hover)]:inline">espacio</kbd>
            </button>
          </div>
        )}
      </article>

      {(card.kata !== null || revelada) && (
        <div className="grid shrink-0 grid-cols-2 gap-2 pb-[env(safe-area-inset-bottom)] sm:grid-cols-4">
          {([0, 1, 2, 3] as Grade[]).map((grade) => (
            <button
              key={grade}
              disabled={enviando}
              onClick={() => void responder(grade)}
              className={`rounded-lg border bg-card px-3 py-3.5 text-sm font-medium transition disabled:opacity-50 ${ESTILO_BOTON[grade]}`}
            >
              {GRADE_LABELS[grade]}{" "}
              <kbd className="hidden text-xs opacity-60 [@media(hover:hover)]:inline">{grade + 1}</kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface KataData {
  firma: string;
  nombre: string;
  tests: { args: unknown[]; espera: unknown }[];
}

interface ResultadoTest {
  args: unknown[];
  espera: unknown;
  obtuvo: unknown;
  error: string | null;
  ok: boolean;
}

/**
 * Ejercicio de código: editor + tests que corren en el navegador contra el
 * código del usuario (eval client-side, sin servidor). La calificación sigue
 * siendo autoevaluación honesta: los 4 botones de SM-2 están debajo —
 * "lo resolví sin ayuda" = Fácil/Bien, "con pista" = Difícil, "no pude" = Otra vez.
 */
function KataEjercicio({
  kata,
  solucion,
  revelada,
  onVerSolucion,
}: {
  kata: KataData;
  solucion: string;
  revelada: boolean;
  onVerSolucion: () => void;
}) {
  const params = /\((.*)\)/.exec(kata.firma)?.[1] ?? "";
  const [codigo, setCodigo] = useState(`function ${kata.nombre}(${params}) {\n  // tu solución\n}`);
  const [resultados, setResultados] = useState<ResultadoTest[] | null>(null);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  const correr = () => {
    setErrorGlobal(null);
    try {
      const fn = new Function(
        `"use strict";\n${codigo}\nreturn typeof ${kata.nombre} !== "undefined" ? ${kata.nombre} : undefined;`,
      )();
      if (typeof fn !== "function") {
        setErrorGlobal(`No encontré la función ${kata.nombre}(...). Definila con function ${kata.nombre}(${params}) { ... }`);
        setResultados(null);
        return;
      }
      setResultados(
        kata.tests.map((t) => {
          let obtuvo: unknown;
          let error: string | null = null;
          try {
            obtuvo = fn(...t.args);
          } catch (e) {
            error = e instanceof Error ? e.message : String(e);
          }
          return { args: t.args, espera: t.espera, obtuvo, error, ok: error === null && JSON.stringify(obtuvo) === JSON.stringify(t.espera) };
        }),
      );
    } catch (e) {
      setErrorGlobal(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
      setResultados(null);
    }
  };

  const pasaron = resultados?.filter((r) => r.ok).length ?? 0;

  return (
    <div className="mt-4 flex flex-1 flex-col gap-3">
      <p className="text-xs text-muted">
        Función esperada: <code className="rounded bg-foreground/5 px-1.5 py-0.5">{kata.firma}</code> — escribila y corre los tests en tu navegador.
      </p>
      <textarea
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        spellCheck={false}
        rows={8}
        className="w-full flex-1 resize-y rounded-lg border border-foreground/15 bg-background px-4 py-3 font-mono text-sm leading-relaxed focus:border-accent focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={correr}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          ▶ Correr {kata.tests.length} tests
        </button>
        {resultados !== null && (
          <span className={pasaron === resultados.length ? "text-sm font-medium text-emerald-600 dark:text-emerald-400" : "text-sm font-medium text-red-600 dark:text-red-400"}>
            {pasaron}/{resultados.length} pasan
          </span>
        )}
        {!revelada && (
          <button type="button" onClick={onVerSolucion} className="py-2 text-xs text-muted underline hover:text-foreground">
            Ver solución de referencia
          </button>
        )}
      </div>

      {errorGlobal !== null && (
        <pre className="whitespace-pre-wrap rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-xs text-red-700 dark:text-red-400">{errorGlobal}</pre>
      )}
      {resultados !== null && (
        <ul className="space-y-1.5 text-xs">
          {resultados.map((r, i) => (
            <li key={i} className={r.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
              {r.ok ? "✓" : "✗"} {kata.nombre}({r.args.map((a) => JSON.stringify(a)).join(", ")}) →{" "}
              {r.error !== null ? <span>explotó: {r.error}</span> : <span className="font-mono">{JSON.stringify(r.obtuvo)}</span>}
              {!r.ok && <> (esperaba <span className="font-mono">{JSON.stringify(r.espera)}</span>)</>}
            </li>
          ))}
        </ul>
      )}
      {revelada && (
        <details className="rounded-lg border border-foreground/10">
          <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium">Solución de referencia</summary>
          <pre className="whitespace-pre-wrap border-t border-foreground/10 px-4 py-3 text-xs leading-relaxed text-muted">{solucion}</pre>
        </details>
      )}
    </div>
  );
}
