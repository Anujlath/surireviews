-- Make password optional for OAuth users
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- Add location fields for location-based search
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "country" TEXT;

CREATE INDEX IF NOT EXISTS "businesses_city_idx" ON "businesses"("city");
CREATE INDEX IF NOT EXISTS "businesses_state_idx" ON "businesses"("state");
CREATE INDEX IF NOT EXISTS "businesses_country_idx" ON "businesses"("country");
