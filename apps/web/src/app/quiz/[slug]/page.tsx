import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@mnemo/db";
import { armarQuiz } from "@mnemo/domain";
import { tarjetasDeMazo } from "@/lib/datos";
import QuizSesion from "@/components/QuizSesion";

export const dynamic = "force-dynamic";

export default async function PaginaQuiz({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prisma = await getPrisma();
  const [deck, cards] = await Promise.all([
    prisma.deck.findUnique({ where: { slug }, select: { title: true } }),
    tarjetasDeMazo(slug),
  ]);
  // Las tarjetas kata (ejercicios de código) no son opción múltiple: se excluyen.
  const conceptuales = cards.filter((c) => c.kata === null);
  if (deck === null || conceptuales.length === 0) notFound();

  // Opción múltiple derivada del mismo contenido: distractores = respuestas
  // hermanas. Math.random (default) → cada visita arma un quiz distinto.
  const items = armarQuiz(conceptuales);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href={`/decks/${slug}`} className="inline-flex items-center py-2 hover:text-foreground">
          ← {deck?.title ?? slug}
        </Link>
      </nav>
      <p className="rounded-lg border border-foreground/10 bg-card px-4 py-2 text-sm text-muted">
        Modo práctica — no afecta tu plan de repaso (SM-2 queda intacto).
      </p>
      <QuizSesion deckSlug={slug} deckTitle={deck?.title ?? slug} preguntas={items.map((item) => ({
        question: item.tarjeta.question,
        opciones: item.opciones,
        correcta: item.correcta,
        explicacion: item.tarjeta.explanation ?? null,
      }))} />
    </div>
  );
}
