-- Estado previo por autoevaluación: habilita "deshacer" restaurando el
-- estado de la tarjeta antes de ese repaso.
--
-- Las 36 filas existentes no tienen el estado previo real (se perdía); se
-- les asigna el estado inicial de una tarjeta nueva (ease 2.5, 0/0/0) y
-- prevDueAt = reviewedAt. Nunca se desharán: deshacerUltima solo opera sobre
-- la fila MÁS reciente de una tarjeta, y toda calificación nueva escribe el
-- previo real.

ALTER TABLE "review_logs"
  ADD COLUMN "prevIntervalDays" INTEGER,
  ADD COLUMN "prevEase" DOUBLE PRECISION,
  ADD COLUMN "prevReps" INTEGER,
  ADD COLUMN "prevLapses" INTEGER,
  ADD COLUMN "prevDueAt" TIMESTAMP(3);

UPDATE "review_logs" SET
  "prevIntervalDays" = 0,
  "prevEase" = 2.5,
  "prevReps" = 0,
  "prevLapses" = 0,
  "prevDueAt" = "reviewedAt";

ALTER TABLE "review_logs"
  ALTER COLUMN "prevIntervalDays" SET NOT NULL,
  ALTER COLUMN "prevEase" SET NOT NULL,
  ALTER COLUMN "prevReps" SET NOT NULL,
  ALTER COLUMN "prevLapses" SET NOT NULL,
  ALTER COLUMN "prevDueAt" SET NOT NULL;
