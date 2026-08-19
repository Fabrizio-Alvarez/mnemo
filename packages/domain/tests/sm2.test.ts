import { describe, expect, it } from "vitest";
import { GRADE_LABELS, GRADES, initialState, isDue, schedule } from "../src/index.ts";

const NOW = new Date("2026-08-19T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

describe("SM-2", () => {
  it("estado inicial: ease 2.5, sin intervalo, sin reps ni lapses", () => {
    expect(initialState()).toEqual({ ease: 2.5, intervalDays: 0, reps: 0, lapses: 0 });
  });

  it("primer aprobado (Bien): intervalo 1 día, reps 1, ease baja según q=4", () => {
    const next = schedule(initialState(), 2, NOW);
    // EF' = 2.5 + (0.1 - 1*(0.08+0.02)) = 2.5 - 0.0 = 2.5
    expect(next).toMatchObject({ ease: 2.5, intervalDays: 1, reps: 1, lapses: 0 });
    expect(next.dueAt.getTime()).toBe(NOW.getTime() + 1 * DAY);
  });

  it("segundo aprobado: intervalo fijo 6 días (regla SM-2)", () => {
    const once = schedule(initialState(), 2, NOW);
    const twice = schedule(once, 2, NOW);
    expect(twice.intervalDays).toBe(6);
    expect(twice.reps).toBe(2);
  });

  it("tercer aprobado: intervalo = round(prev · EF)", () => {
    const twice = schedule(schedule(initialState(), 2, NOW), 2, NOW);
    const thrice = schedule(twice, 2, NOW);
    expect(thrice.intervalDays).toBe(Math.round(6 * twice.ease));
  });

  it("Fácil (grade 3, q=5) sube el ease", () => {
    const next = schedule(initialState(), 3, NOW);
    // EF' = 2.5 + 0.1 = 2.6
    expect(next.ease).toBe(2.6);
  });

  it("Difícil (grade 1, q=3) baja el ease", () => {
    const next = schedule(initialState(), 1, NOW);
    // EF' = 2.5 + (0.1 - 2*(0.08+2*0.02)) = 2.5 - 0.14 = 2.36
    expect(next.ease).toBe(2.36);
  });

  it("el ease nunca baja del piso 1.3", () => {
    let state = initialState();
    for (let i = 0; i < 20; i++) state = schedule(state, 1, NOW);
    expect(state.ease).toBe(1.3);
  });

  it("Otra vez (grade 0): resetea reps, intervalo 1 día, lapse, ease intacto (SM-2 clásico)", () => {
    const learned = { ease: 2.36, intervalDays: 12, reps: 4, lapses: 0 };
    const next = schedule(learned, 0, NOW);
    expect(next).toMatchObject({ ease: 2.36, intervalDays: 1, reps: 0, lapses: 1 });
    expect(next.dueAt.getTime()).toBe(NOW.getTime() + 1 * DAY);
  });

  it("tras un fallo, el próximo aprobado arranca de nuevo en 1 día", () => {
    const failed = schedule({ ease: 2.2, intervalDays: 30, reps: 5, lapses: 2 }, 0, NOW);
    const next = schedule(failed, 2, NOW);
    expect(next.intervalDays).toBe(1);
    expect(next.reps).toBe(1);
  });
  it("los 4 grades tienen etiqueta y el ciclo completo converge", () => {
    expect(GRADES).toEqual([0, 1, 2, 3]);
    for (const grade of GRADES) expect(GRADE_LABELS[grade].length).toBeGreaterThan(0);

    let state = initialState();
    for (const grade of [2, 2, 2, 3, 2]) state = schedule(state, grade as 2 | 3, NOW);
    expect(state.intervalDays).toBeGreaterThan(6);
    expect(state.reps).toBe(5);
    expect(state.lapses).toBe(0);
  });
});

describe("isDue", () => {
  it("vencida: dueAt en el pasado o ahora", () => {
    expect(isDue(new Date(NOW.getTime() - 1), NOW)).toBe(true);
    expect(isDue(NOW, NOW)).toBe(true);
    expect(isDue(new Date(NOW.getTime() + DAY), NOW)).toBe(false);
  });
});
