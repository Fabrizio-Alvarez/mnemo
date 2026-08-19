-- CreateTable
CREATE TABLE "decks" (
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "deckSlug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_logs" (
    "id" SERIAL NOT NULL,
    "cardId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intervalDays" INTEGER NOT NULL,
    "ease" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cards_deckSlug_dueAt_idx" ON "cards"("deckSlug", "dueAt");

-- CreateIndex
CREATE INDEX "review_logs_cardId_reviewedAt_idx" ON "review_logs"("cardId", "reviewedAt");

-- CreateIndex
CREATE INDEX "review_logs_reviewedAt_idx" ON "review_logs"("reviewedAt");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_deckSlug_fkey" FOREIGN KEY ("deckSlug") REFERENCES "decks"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
