CREATE TYPE "VerificationRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "business_verification_requests" (
  "id" TEXT NOT NULL,
  "business_id" TEXT NOT NULL,
  "requested_by_id" TEXT NOT NULL,
  "status" "VerificationRequestStatus" NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "business_verification_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "business_verification_requests_business_id_idx" ON "business_verification_requests"("business_id");
CREATE INDEX "business_verification_requests_requested_by_id_idx" ON "business_verification_requests"("requested_by_id");
CREATE INDEX "business_verification_requests_status_idx" ON "business_verification_requests"("status");

ALTER TABLE "business_verification_requests"
ADD CONSTRAINT "business_verification_requests_business_id_fkey"
FOREIGN KEY ("business_id") REFERENCES "businesses"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "business_verification_requests"
ADD CONSTRAINT "business_verification_requests_requested_by_id_fkey"
FOREIGN KEY ("requested_by_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
