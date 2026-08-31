-- Distractores autorales por tarjeta (`### distractores` en el .md):
-- respuestas plausibles pero incorrectas del mismo tema, para el modo quiz.
ALTER TABLE "cards" ADD COLUMN "distractors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
