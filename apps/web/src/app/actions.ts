"use server";

import { getPrisma } from "@mnemo/db";
import { schedule, type Grade } from "@mnemo/domain";

/**
 * Autoevaluación de una tarjeta: aplica SM-2 (dominio puro), persiste el nuevo
 * estado y deja huella append-only en ReviewLog — con el estado PREVIO, para
 * que `deshacer` pueda restaurarlo.
 *
 * No hay revalidatePath a propósito: el refresh de router que dispara una
 * revalidación re-renderiza /study/[slug] con la lista de vencidas ya encogida
 * (salta tarjetas y borra el resumen final de la sesión). Como todas las rutas
 * son force-dynamic, cada navegación trae datos frescos de todos modos.
 */
export async function calificar(cardId: string, deckSlug: string, grade: number): Promise<{ intervalDays: number } | null> {
  if (!Number.isInteger(grade) || grade < 0 || grade > 3) throw new Error(`Grade inválido: ${grade}`);

  const prisma = await getPrisma();
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
      data: {
        cardId,
        grade,
        intervalDays: next.intervalDays,
        ease: next.ease,
        prevIntervalDays: card.intervalDays,
        prevEase: card.ease,
        prevReps: card.reps,
        prevLapses: card.lapses,
        prevDueAt: card.dueAt,
      },
    }),
  ]);

  return { intervalDays: next.intervalDays };
}

/**
 * Deshace la ÚLTIMA autoevaluación de una tarjeta: restaura el estado previo
 * guardado en su review_log más reciente y borra esa fila. La sesión controla
 * que solo se deshaga la última acción de la cola (botón/ui), no cualquiera.
 */
export async function deshacerUltima(cardId: string): Promise<boolean> {
  const prisma = await getPrisma();
  const ultima = await prisma.reviewLog.findFirst({
    where: { cardId },
    orderBy: [{ reviewedAt: "desc" }, { id: "desc" }],
  });
  if (ultima === null) return false;

  await prisma.$transaction([
    prisma.card.update({
      where: { id: cardId },
      data: {
        ease: ultima.prevEase,
        intervalDays: ultima.prevIntervalDays,
        reps: ultima.prevReps,
        lapses: ultima.prevLapses,
        dueAt: ultima.prevDueAt,
      },
    }),
    prisma.reviewLog.delete({ where: { id: ultima.id } }),
  ]);
  return true;
}
