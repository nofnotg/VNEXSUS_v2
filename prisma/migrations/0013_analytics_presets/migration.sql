CREATE TABLE "AnalyticsPreset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filterJson" JSONB NOT NULL,
    "interval" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsPreset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalyticsPreset_userId_name_key" ON "AnalyticsPreset"("userId", "name");
CREATE INDEX "AnalyticsPreset_userId_createdAt_idx" ON "AnalyticsPreset"("userId", "createdAt");

ALTER TABLE "AnalyticsPreset"
ADD CONSTRAINT "AnalyticsPreset_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
