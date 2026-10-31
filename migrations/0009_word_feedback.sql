CREATE TABLE "wordFeedback" (
  "wordKey" TEXT NOT NULL,
  "word" TEXT NOT NULL,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('report', 'recommendation')),
  "submittedAt" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY ("wordKey", "kind")
);
