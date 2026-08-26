import { prisma } from "@mnemo/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await prisma.deck.count();
    return Response.json({ ok: true, decks: count });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined },
      { status: 500 },
    );
  }
}
