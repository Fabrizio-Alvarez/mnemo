import Link from "next/link";
import { notFound } from "next/navigation";
import { mazoPorSlug, tarjetasDeMazo } from "@/lib/datos";
import SesionEstudio from "@/components/SesionEstudio";

export const dynamic = "force-dynamic";

export default async function PaginaEstudio({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ all?: string }>;
}) {
  const { slug } = await params;
  const { all } = await searchParams;
  const mazo = await mazoPorSlug(slug);
  if (mazo === null) notFound();

  // ?all=1 → "repasar igual": sesión con TODO el mazo aunque no haya vencidas.
  const modoCompleto = all === "1";

  if (!modoCompleto && mazo.vencidasAhora.length === 0) {
    return (
      <div className="space-y-6 py-16 text-center">
        <p className="text-5xl" aria-hidden>
          ✓
        </p>
        <h1 className="text-2xl font-semibold">Nada vencido en «{mazo.title}»</h1>
        <p className="text-muted">Ya repasaste lo que tocaba hoy. Las próximas tarjetas van a llegar solas.</p>
        <div className="flex justify-center gap-3 text-sm">
          <Link
            href={`/study/${mazo.slug}?all=1`}
            className="rounded-lg border border-foreground/15 px-4 py-2 hover:border-accent/60"
          >
            Repasar igual ({mazo.total})
          </Link>
          <Link href={`/decks/${mazo.slug}`} className="rounded-lg border border-foreground/15 px-4 py-2 hover:border-accent/60">
            Ver el mazo
          </Link>
          <Link href="/" className="rounded-lg border border-foreground/15 px-4 py-2 hover:border-accent/60">
            Otros mazos
          </Link>
        </div>
      </div>
    );
  }

  const cards = modoCompleto ? await tarjetasDeMazo(mazo.slug) : mazo.vencidasAhora;
  if (cards.length === 0) notFound();

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href={`/decks/${mazo.slug}`} className="hover:text-foreground">
          ← {mazo.title}
        </Link>
      </nav>
      {modoCompleto && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-sm text-amber-600 dark:text-amber-400">
          Modo repaso libre: estás viendo las {cards.length} tarjetas del mazo, no solo las vencidas. Calificar igual
          actualiza tu plan SM-2.
        </p>
      )}
      <SesionEstudio deckSlug={mazo.slug} deckTitle={mazo.title} cards={cards} />
    </div>
  );
}
