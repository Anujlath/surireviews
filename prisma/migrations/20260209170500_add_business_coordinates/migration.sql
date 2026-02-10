-- Add optional coordinates for map and radius-based search
ALTER TABLE "businesses"
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS "businesses_latitude_longitude_idx"
ON "businesses"("latitude", "longitude");
