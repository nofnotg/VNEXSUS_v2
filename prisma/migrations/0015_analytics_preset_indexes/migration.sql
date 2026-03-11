CREATE INDEX "AnalyticsPreset_userId_isShared_updatedAt_idx"
ON "AnalyticsPreset"("userId", "isShared", "updatedAt");

CREATE INDEX "AnalyticsPreset_isShared_updatedAt_idx"
ON "AnalyticsPreset"("isShared", "updatedAt");

CREATE INDEX "AnalyticsPreset_sharedWith_gin_idx"
ON "AnalyticsPreset" USING GIN ("sharedWith");
