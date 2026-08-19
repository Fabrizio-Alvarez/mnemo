import Link from "next/link";
import { mazosConEstado } from "@/lib/datos";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const mazos = await mazosConEstado();
  const vencidasHoy = mazos.reduce((suma, mazo) => suma + mazo.due, 0);
  const totalTarjetas = mazos.reduce((suma, mazo) => suma + mazo.total, 0);

  return (
    <div className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Tu estudio de hoy</h1>
        <p className="text-muted">
          {vencidasHoy === 0
            ? `Nada vencido por ahora — ${totalTarjetas} tarjetas en ${mazos.length} mazos, todas al día.`
            : `${vencidasHoy} de ${totalTarjetas} tarjetas están vencidas. Cada una vuelve cuando estás por olvidarla.`}
        </p>
      </section>

      {mazos.length === 0 ? (
        <section className="rounded-xl border border-dashed border-foreground/20 p-8 text-center text-muted">
          <p className="font-medium text-foreground">Todavía no hay mazos</p>
          <p className="mt-1 text-sm">
            Poné archivos <code>.md</code> en <code>decks/</code> (un <code>## encabezado</code> por tarjeta) y
            corré <code>pnpm seed</code>.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {mazos.map((mazo) => (
            <Link
              key={mazo.slug}
              href={`/decks/${mazo.slug}`}
              className="group rounded-xl border border-foreground/10 bg-card p-5 transition hover:border-accent/60"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold leading-snug group-hover:text-accent">{mazo.title}</h2>
                <span
                  className={
                    mazo.due > 0
                      ? "shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white"
                      : "shrink-0 rounded-full border border-foreground/15 px-2.5 py-0.5 text-xs text-muted"
                  }
                >
                  {mazo.due > 0 ? `${mazo.due} vencidas` : "al día"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{mazo.total} tarjetas</p>
              {mazo.tags.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {mazo.tags.map((tag) => (
                    <span key={tag} className="rounded bg-foreground/5 px-1.5 py-0.5 text-xs text-muted">
                      {tag}
                    </span>
                  ))}
                </p>
              )}
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
