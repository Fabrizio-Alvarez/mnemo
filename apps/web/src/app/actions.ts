"use server";

import { prisma } from "@mnemo/db";
import { schedule, type Grade } from "@mnemo/domain";

/**
 * Autoevaluación de una tarjeta: aplica SM-2 (dominio puro), persiste el nuevo
 * estado y deja huella append-only en ReviewLog.
 *
 * No hay revalidatePath a propósito: el refresh de router que dispara una
 * revalidación re-renderiza /study/[slug] con la lista de vencidas ya encogida
 * (salta tarjetas y borra el resumen final de la sesión). Como todas las rutas
 * son force-dynamic, cada navegación trae datos frescos de todos modos.
 */
export async function calificar(cardId: string, deckSlug: string, grade: number): Promise<{ intervalDays: number } | null> {
  if (!Number.isInteger(grade) || grade < 0 || grade > 3) throw new Error(`Grade inválido: ${grade}`);

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (card === null) return null;

  const next = schedule(
    { ease: card.ease, intervalDays: card.intervalDays, reps: card.reps, lapses: card.lapses },
    grade as Grade,
    new Date(),
  );

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: {
        ease: next.ease,
        intervalDays: next.intervalDays,
        reps: next.reps,
        lapses: next.lapses,
        dueAt: next.dueAt,
      },
    }),
    prisma.reviewLog.create({
      data: { cardId, grade, intervalDays: next.intervalDays, ease: next.ease },
    }),
  ]);

  return { intervalDays: next.intervalDays };
}
