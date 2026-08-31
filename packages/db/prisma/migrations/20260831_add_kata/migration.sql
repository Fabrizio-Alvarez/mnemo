-- Ejercicios de código (kata) por tarjeta (`### kata` en el .md):
-- firma legible + tests JSON que el navegador ejecuta contra el código del usuario.
ALTER TABLE "cards" ADD COLUMN "kataFirma" TEXT;
ALTER TABLE "cards" ADD COLUMN "kataTests" JSONB;
