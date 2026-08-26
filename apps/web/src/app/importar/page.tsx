"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { generarDeckMD, importarNotebookLM, slugify } from "@mnemo/domain";

const EJEMPLO = `**Q: ¿Qué es el Service Container?**
El contenedor de dependencias de Laravel. Sabe cómo construir objetos y resolver sus dependencias.

**Q: ¿bind vs singleton?**
\`bind\` crea una nueva instancia cada vez. \`singleton\` reutiliza la misma.

**Q: ¿Qué es el middleware?**
Capas que interceptan el request antes del controller. Sirve para auth, CORS, CSRF, logging.`;

export default function ImportadorPage() {
  const [texto, setTexto] = useState("");
  const [titulo, setTitulo] = useState("");
  const [tags, setTags] = useState("");
  const [fuente, setFuente] = useState("NotebookLM");
  const [copiado, setCopiado] = useState(false);

  const cards = useMemo(() => importarNotebookLM(texto), [texto]);

  const meta = useMemo(
    () => ({
      title: titulo || "Mazo sin título",
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      ...(fuente ? { source: fuente } : {}),
    }),
    [titulo, tags, fuente],
  );

  const md = useMemo(() => generarDeckMD(meta, cards), [meta, cards]);
  const filename = useMemo(() => `${slugify(titulo || "mazo-nuevo")}.md`, [titulo]);

  const descargar = () => {
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copiar = async () => {
    await navigator.clipboard.writeText(md);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          ← Mazos
        </Link>
      </nav>

      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Importar desde NotebookLM</h1>
        <p className="text-muted">
          Pegá el FAQ de NotebookLM, ajustá los metadatos y descargá un mazo <code>.md</code> listo para{" "}
          <code>pnpm seed</code>.
        </p>
      </section>

      <section className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-muted">1. Pegá el texto de NotebookLM</span>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={EJEMPLO}
            rows={12}
            className="mt-1 w-full resize-y rounded-lg border border-foreground/15 bg-card px-4 py-3 font-mono text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => setTexto(EJEMPLO)}
          className="text-xs text-muted underline hover:text-foreground"
        >
          Cargar ejemplo
        </button>
      </section>

      <section className="space-y-4">
        <span className="text-sm font-medium text-muted">2. Metadatos del mazo</span>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs text-muted">Título</span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Laravel — Entrevista"
              className="mt-1 w-full rounded-lg border border-foreground/15 bg-card px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted">Tags (separados por coma)</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="laravel, php, backend"
              className="mt-1 w-full rounded-lg border border-foreground/15 bg-card px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-xs text-muted">Fuente</span>
          <input
            value={fuente}
            onChange={(e) => setFuente(e.target.value)}
            placeholder="NotebookLM (Guía Laravel-Vue)"
            className="mt-1 w-full rounded-lg border border-foreground/15 bg-card px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">
            3. Previsualización
            {cards.length > 0 && (
              <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                {cards.length} {cards.length === 1 ? "tarjeta" : "tarjetas"}
              </span>
            )}
          </span>
          {cards.length > 0 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copiar}
                className="rounded-lg border border-foreground/15 px-3 py-1.5 text-sm hover:border-accent"
              >
                {copiado ? "Copiado ✓" : "Copiar"}
              </button>
              <button
                type="button"
                onClick={descargar}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                Descargar {filename}
              </button>
            </div>
          )}
        </div>

        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-foreground/20 p-8 text-center text-sm text-muted">
            {texto === ""
              ? "Pegá texto arriba para ver las tarjetas detectadas."
              : "No se detectaron preguntas. Verificá que el formato sea **Q: pregunta**."}
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map((c, i) => (
              <details key={i} className="rounded-lg border border-foreground/10 bg-card">
                <summary className="cursor-pointer px-4 py-2 text-sm font-medium">
                  {i + 1}. {c.question}
                </summary>
                <div className="border-t border-foreground/10 px-4 py-2 text-sm text-muted whitespace-pre-wrap">
                  {c.answer}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      {cards.length > 0 && (
        <section className="space-y-2">
          <span className="text-sm font-medium text-muted">4. Archivo .md generado</span>
          <pre className="max-h-80 overflow-auto rounded-lg border border-foreground/10 bg-card p-4 text-xs leading-relaxed">
            {md}
          </pre>
          <p className="text-xs text-muted">
            Guardá el archivo en <code>decks/{filename}</code> y corré <code>pnpm seed</code>.
          </p>
        </section>
      )}
    </div>
  );
}
