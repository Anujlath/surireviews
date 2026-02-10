ALTER TABLE "businesses"
ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "businesses_verified_idx" ON "businesses"("verified");
