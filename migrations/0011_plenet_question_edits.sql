CREATE TABLE "plenetQuestionEdits" (
  "countryId" TEXT NOT NULL,
  "language" TEXT NOT NULL CHECK ("language" IN ('nl', 'en')),
  "category" INTEGER NOT NULL CHECK ("category" BETWEEN 0 AND 5),
  "question" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("countryId", "language", "category")
);
