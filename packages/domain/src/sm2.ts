/**
 * SM-2 (SuperMemo 2, la base de Anki) adaptado a 4 botones.
 *
 * Grades: 0 = Otra vez · 1 = Difícil · 2 = Bien · 3 = Fácil
 * Mapeados a la calidad q clásica: 0→2, 1→3, 2→4, 3→5 (umbral de aprobación: q ≥ 3).
 *
 * - EF' = EF + (0.1 − (5−q)·(0.08 + (5−q)·0.02)), piso 1.3
 * - Aprobada (grades 1–3): reps++ · intervalo: 1ª → 1 día, 2ª → 6 días, luego round(prev · EF')
 * - Fallada (grade 0): reps = 0 · intervalo = 1 día · lapses++ (EF sin tocar, SM-2 clásico)
 */

export type Grade = 0 | 1 | 2 | 3;

export const GRADES: readonly Grade[] = [0, 1, 2, 3] as const;

export const GRADE_LABELS: Record<Grade, string> = {
  0: "Otra vez",
  1: "Difícil",
  2: "Bien",
  3: "Fácil",
};

/** Estado SRS persistido por tarjeta (columnas de `Card` en la BD). */
export interface SrsState {
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
}

export interface ScheduledCard extends SrsState {
  dueAt: Date;
}

export const INITIAL_EASE = 2.5;
export const MIN_EASE = 1.3;

export function initialState(): SrsState {
  return { ease: INITIAL_EASE, intervalDays: 0, reps: 0, lapses: 0 };
}

export function schedule(state: SrsState, grade: Grade, now: Date): ScheduledCard {
  const q = grade + 2; // 0→2, 1→3, 2→4, 3→5
  const passed = q >= 3;

  const ease = passed
    ? Math.max(MIN_EASE, Math.round((state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))) * 100) / 100)
    : state.ease;

  let reps: number;
  let intervalDays: number;

  if (passed) {
    reps = state.reps + 1;
    intervalDays = reps === 1 ? 1 : reps === 2 ? 6 : Math.max(1, Math.round(state.intervalDays * ease));
  } else {
    reps = 0;
    intervalDays = 1;
  }

  const lapses = state.lapses + (passed ? 0 : 1);
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const dueAt = new Date(now.getTime() + intervalDays * MS_PER_DAY);

  return { ease, intervalDays, reps, lapses, dueAt };
}

/** ¿La tarjeta está vencida (hay que repasarla)? Nueva (interval 0) cuenta como vencida. */
export function isDue(dueAt: Date, now: Date): boolean {
  return dueAt.getTime() <= now.getTime();
}
