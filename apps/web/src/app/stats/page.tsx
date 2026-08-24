import { statsGenerales } from "@/lib/datos";

export const dynamic = "force-dynamic";

export const metadata = { title: "Stats — Mnemo" };

export default async function PaginaStats() {
  const stats = await statsGenerales();
  const maximo = Math.max(...stats.porDia, 1);

  const tarjetas: { etiqueta: string; valor: string | number; detalle?: string }[] = [
    { etiqueta: "Racha actual", valor: stats.racha, detalle: stats.racha > 0 ? "días seguidos" : "repasá hoy para arrancar" },
    { etiqueta: "Mejor racha", valor: stats.mejor, detalle: "días" },
    { etiqueta: "Repasos totales", valor: stats.repasosTotales, detalle: "histórico completo" },
    { etiqueta: "Hoy", valor: stats.repasosHoy, detalle: "repasos" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
        <p className="mt-1 text-sm text-muted">Todo derivado de <code>review_logs</code> — el log append-only de cada autoevaluación.</p>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tarjetas.map((t) => (
          <div key={t.etiqueta} className="rounded-xl border border-foreground/10 bg-card px-4 py-4">
            <dt className="text-xs uppercase tracking-wide text-muted">{t.etiqueta}</dt>
            <dd className="mt-1 text-2xl font-semibold">{t.valor}</dd>
            <dd className="text-xs text-muted">{t.detalle}</dd>
          </div>
        ))}
      </dl>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Últimos 30 días</h2>
          <span className="text-xs text-muted">máx {maximo} por día</span>
        </div>
        {/* Barras CSS: sin librerías, altura relativa al máximo del período. */}
        <div className="flex h-28 items-end gap-1 rounded-xl border border-foreground/10 bg-card px-3 py-3">
          {stats.porDia.map((repasos, i) => (
            <div
              key={i}
              title={`${repasos} repasos`}
              className={`flex-1 rounded-sm ${repasos > 0 ? "bg-accent" : "bg-foreground/10"}`}
              style={{ height: repasos > 0 ? `${Math.max((repasos / maximo) * 100, 8)}%` : "4px" }}
            />
          ))}
        </div>
        <p className="text-xs text-muted">← hace 30 días · hoy →</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Actividad por mazo</h2>
        <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10 bg-card">
          {stats.porMazo.map((mazo) => (
            <li key={mazo.slug} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>{mazo.title}</span>
              <span className="text-muted">
                {mazo.repasos} repaso{mazo.repasos === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
