/** Días hasta el vencimiento, en texto corto para UI ("hoy", "mañana", "en 12 días"). */
export function enDias(dueAt: Date, ahora: Date = new Date()): string {
  const MS = 24 * 60 * 60 * 1000;
  const dias = Math.ceil((dueAt.getTime() - ahora.getTime()) / MS);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "mañana";
  return `en ${dias} días`;
}
