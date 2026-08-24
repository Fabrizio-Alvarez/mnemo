/**
 * Derivaciones de stats sobre días con actividad (fechas ISO `yyyy-mm-dd`).
 * La BD aporta los días (groupby sobre review_logs); la lógica vive acá, pura.
 */

const DIA = 24 * 60 * 60 * 1000;

/** Racha actual: días consecutivos con actividad, terminando hoy (o ayer si hoy aún no repasaste). */
export function rachaActual(diasActivos: ReadonlySet<string>, hoy: Date): number {
  let dia = fechaISO(hoy);
  if (!diasActivos.has(dia)) {
    dia = fechaISO(new Date(hoy.getTime() - DIA)); // hoy sin actividad: la racha sigue viva hasta ayer
  }
  let racha = 0;
  while (diasActivos.has(dia)) {
    racha++;
    dia = fechaISO(new Date(fechaDesdeISO(dia).getTime() - DIA));
  }
  return racha;
}

/** La racha más larga registrada. */
export function mejorRacha(diasActivos: ReadonlySet<string>): number {
  const ordenados = [...diasActivos].sort();
  let mejor = 0;
  let actual = 0;
  let anterior: Date | null = null;
  for (const iso of ordenados) {
    const fecha = fechaDesdeISO(iso);
    if (anterior !== null && fecha.getTime() - anterior.getTime() === DIA) actual++;
    else actual = 1;
    mejor = Math.max(mejor, actual);
    anterior = fecha;
  }
  return mejor;
}

/** `yyyy-mm-dd` en fecha local (un repaso a la medianoche cuenta del día que fue). */
function fechaISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fechaDesdeISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}
