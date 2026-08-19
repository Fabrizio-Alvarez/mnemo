import { prisma } from "@mnemo/db";

export interface MazoResumen {
  slug: string;
  title: string;
  source: string | null;
  tags: string[];
  total: number;
  due: number;
}

function contarPorMazo(rows: { deckSlug: string; _count: { _all: number } }[]): Map<string, number> {
  return new Map(rows.map((r) => [r.deckSlug, r._count._all]));
}

export async function mazosConEstado(): Promise<MazoResumen[]> {
  const [decks, totales, vencidas] = await Promise.all([
    prisma.deck.findMany({ orderBy: { title: "asc" } }),
    prisma.card.groupBy({ by: ["deckSlug"], _count: { _all: true } }),
    prisma.card.groupBy({ by: ["deckSlug"], _count: { _all: true }, where: { dueAt: { lte: new Date() } } }),
  ]);

  const totalPorMazo = contarPorMazo(totales);
  const duePorMazo = contarPorMazo(vencidas);

  return decks.map((deck) => ({
    slug: deck.slug,
    title: deck.title,
    source: deck.source,
    tags: deck.tags,
    total: totalPorMazo.get(deck.slug) ?? 0,
    due: duePorMazo.get(deck.slug) ?? 0,
  }));
}

export interface DetalleMazo extends MazoResumen {
  vencidasAhora: { id: string; question: string; answer: string }[];
  repasadas: number;
}

export async function mazoPorSlug(slug: string): Promise<DetalleMazo | null> {
  const deck = await prisma.deck.findUnique({ where: { slug } });
  if (deck === null) return null;

  const now = new Date();
  const [total, due, repasadas, vencidasAhora] = await Promise.all([
    prisma.card.count({ where: { deckSlug: slug } }),
    prisma.card.count({ where: { deckSlug: slug, dueAt: { lte: now } } }),
    prisma.card.count({ where: { deckSlug: slug, reps: { gt: 0 } } }),
    prisma.card.findMany({
      where: { deckSlug: slug, dueAt: { lte: now } },
      orderBy: { dueAt: "asc" },
      select: { id: true, question: true, answer: true },
    }),
  ]);

  return {
    slug: deck.slug,
    title: deck.title,
    source: deck.source,
    tags: deck.tags,
    total,
    due,
    repasadas,
    vencidasAhora,
  };
}
