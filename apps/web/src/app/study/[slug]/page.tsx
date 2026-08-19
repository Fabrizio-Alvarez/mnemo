import Link from "next/link";
import { notFound } from "next/navigation";
import { mazoPorSlug } from "@/lib/datos";
import SesionEstudio from "@/components/SesionEstudio";

export const dynamic = "force-dynamic";

export default async function PaginaEstudio({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mazo = await mazoPorSlug(slug);
  if (mazo === null) notFound();

  if (mazo.vencidasAhora.length === 0) {
    return (
      <div className="space-y-6 py-16 text-center">
        <p className="text-5xl" aria-hidden>
          ✓
        </p>
        <h1 className="text-2xl font-semibold">Nada vencido en «{mazo.title}»</h1>
        <p className="text-muted">Ya repasaste lo que tocaba hoy. Las próximas tarjetas van a llegar solas.</p>
        <div className="flex justify-center gap-3 text-sm">
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

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href={`/decks/${mazo.slug}`} className="hover:text-foreground">
          ← {mazo.title}
        </Link>
      </nav>
      <SesionEstudio deckSlug={mazo.slug} deckTitle={mazo.title} cards={mazo.vencidasAhora} />
    </div>
  );
}
