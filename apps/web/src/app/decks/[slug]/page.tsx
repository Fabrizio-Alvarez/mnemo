import Link from "next/link";
import { notFound } from "next/navigation";
import { mazoPorSlug } from "@/lib/datos";

export const dynamic = "force-dynamic";

export default async function PaginaMazo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mazo = await mazoPorSlug(slug);
  if (mazo === null) notFound();

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          ← Mazos
        </Link>
      </nav>

      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{mazo.title}</h1>
        {mazo.source && <p className="text-sm text-muted">Fuente: {mazo.source}</p>}
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <span>
            <strong className="text-foreground">{mazo.total}</strong> tarjetas
          </span>
          <span>
            <strong className="text-foreground">{mazo.due}</strong> vencidas ahora
          </span>
          <span>
            <strong className="text-foreground">{mazo.repasadas}</strong> ya repasadas
          </span>
        </div>
        {mazo.tags.length > 0 && (
          <p className="flex flex-wrap gap-1.5">
            {mazo.tags.map((tag) => (
              <span key={tag} className="rounded bg-foreground/5 px-1.5 py-0.5 text-xs text-muted">
                {tag}
              </span>
            ))}
          </p>
        )}
      </header>

      <div>
        {mazo.due > 0 ? (
          <Link
            href={`/study/${mazo.slug}`}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-medium text-white transition hover:opacity-90"
          >
            Estudiar {mazo.due} tarjeta{mazo.due === 1 ? "" : "s"} →
          </Link>
        ) : (
          <p className="rounded-lg border border-foreground/10 bg-card px-5 py-3 text-sm text-muted">
            Nada vencido en este mazo. Volvé cuando las tarjetas venzan.
          </p>
        )}
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Tarjetas</h2>
        <div className="divide-y divide-foreground/10 rounded-xl border border-foreground/10 bg-card">
          {mazo.vencidasAhora.map((card) => (
            <details key={card.id} className="group px-5 py-3">
              <summary className="cursor-pointer list-none font-medium marker:hidden group-open:text-accent">
                {card.question}
              </summary>
              <p className="mt-2 whitespace-pre-line text-sm text-muted">{card.answer}</p>
            </details>
          ))}
          {mazo.total - mazo.vencidasAhora.length > 0 && (
            <p className="px-5 py-3 text-sm text-muted">
              + {mazo.total - mazo.vencidasAhora.length} tarjetas programadas para más adelante.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
