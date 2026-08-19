/**
 * Seed idempotente: decks/*.md → Postgres.
 * - Upsert de mazos y tarjetas por id estable (hash(deckSlug + pregunta)).
 * - Las tarjetas que desaparecieron del .md se borran (su estado SRS se va con ellas).
 * - Editar la respuesta mantiene el historial; editar la pregunta = tarjeta nueva.
 * La app lee los .md, nunca los reescribe.
 */
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { cardId, parseDeck, slugify } from "@mnemo/domain";
import { prisma } from "@mnemo/db";

const DECKS_DIR = join(import.meta.dirname, "..", "decks");

async function main(): Promise<void> {
  const files = (await readdir(DECKS_DIR)).filter((f) => f.endsWith(".md")).sort();
  if (files.length === 0) throw new Error(`No hay mazos .md en ${DECKS_DIR}`);

  const slugs: string[] = [];

  for (const file of files) {
    const slug = slugify(basename(file, ".md"));
    if (slugs.includes(slug)) throw new Error(`Slug duplicado "${slug}" (de ${file})`);
    slugs.push(slug);

    const deck = parseDeck(await readFile(join(DECKS_DIR, file), "utf8"));

    const ids = deck.cards.map((c) => cardId(slug, c.question));
    const duplicated = ids.find((id, i) => ids.indexOf(id) !== i);
    if (duplicated !== undefined) {
      throw new Error(`Pregunta duplicada en ${file} (cardId ${duplicated}): el hash colisiona`);
    }

    const existing = await prisma.card.findMany({ where: { deckSlug: slug }, select: { id: true } });
    const existingIds = new Set(existing.map((c) => c.id));

    await prisma.deck.upsert({
      where: { slug },
      create: { slug, title: deck.meta.title, source: deck.meta.source, tags: deck.meta.tags },
      update: { title: deck.meta.title, source: deck.meta.source, tags: deck.meta.tags },
    });

    await Promise.all(
      deck.cards.map((card, i) =>
        prisma.card.upsert({
          where: { id: ids[i]! },
          // El estado SRS NO se toca en el update: el .md manda solo en el contenido.
          create: { id: ids[i]!, deckSlug: slug, question: card.question, answer: card.answer },
          update: { question: card.question, answer: card.answer },
        }),
      ),
    );

    const vanished = await prisma.card.deleteMany({ where: { deckSlug: slug, id: { notIn: ids } } });
    const fresh = ids.filter((id) => !existingIds.has(id)).length;

    console.log(
      `${file} → "${deck.meta.title}" [${slug}]: ${deck.cards.length} tarjetas (${fresh} nuevas, ${vanished.count} eliminadas)`,
    );
  }

  const orphanDecks = await prisma.deck.deleteMany({ where: { slug: { notIn: slugs } } });
  if (orphanDecks.count > 0) console.log(`Mazos sin archivo .md eliminados: ${orphanDecks.count}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    await prisma.$disconnect();
    console.error(error);
    process.exit(1);
  });
