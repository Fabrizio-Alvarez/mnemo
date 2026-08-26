import { getPrisma } from "@mnemo/db";
import { mejorRacha, rachaActual } from "@mnemo/domain";

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
  const prisma = await getPrisma();
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
  const prisma = await getPrisma();
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

/** Todas las tarjetas del mazo (para "repasar igual" y modo quiz). */
export async function tarjetasDeMazo(slug: string): Promise<{ id: string; question: string; answer: string }[]> {
  const prisma = await getPrisma();
  return prisma.card.findMany({
    where: { deckSlug: slug },
    orderBy: { dueAt: "asc" },
    select: { id: true, question: true, answer: true },
  });
}

export interface StatsGenerales {
  racha: number;
  mejor: number;
  repasosTotales: number;
  repasosHoy: number;
  /** Últimos 30 días (incluye hoy), de más viejo a más nuevo: repasos por día. */
  porDia: number[];
  /** Repasos acumulados por mazo (deck order alfabético). */
  porMazo: { title: string; slug: string; repasos: number }[];
}

const DIA = 24 * 60 * 60 * 1000;

function diaLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

export async function statsGenerales(): Promise<StatsGenerales> {
  const prisma = await getPrisma();
  const ahora = new Date();
  const [logs, decks] = await Promise.all([
    // Escala personal: traer solo reviewedAt de TODO el historial y agregar en
    // JS (Prisma no trunca fechas en groupBy). Miles de filas siguen siendo nada.
    prisma.reviewLog.findMany({ select: { reviewedAt: true } }),
    prisma.deck.findMany({ orderBy: { title: "asc" }, select: { slug: true, title: true, cards: { select: { _count: { select: { reviews: true } } } } } }),
  ]);

  const diasActivos = new Set(logs.map((log) => diaLocal(new Date(log.reviewedAt))));
  const hoy = diaLocal(ahora);

  // Una pasada O(n): Map día→repasos, y los últimos 30 días se leen de ahí.
  const conteoDias = new Map<string, number>();
  for (const log of logs) {
    const iso = diaLocal(new Date(log.reviewedAt));
    conteoDias.set(iso, (conteoDias.get(iso) ?? 0) + 1);
  }
  const porDia: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const iso = diaLocal(new Date(ahora.getTime() - i * DIA));
    porDia.push(conteoDias.get(iso) ?? 0);
  }

  return {
    racha: rachaActual(diasActivos, ahora),
    mejor: mejorRacha(diasActivos),
    repasosTotales: logs.length,
    repasosHoy: conteoDias.get(hoy) ?? 0,
    porDia,
    porMazo: decks.map((deck) => ({
      slug: deck.slug,
      title: deck.title,
      repasos: deck.cards.reduce((acc, card) => acc + card._count.reviews, 0),
    })),
  };
}
