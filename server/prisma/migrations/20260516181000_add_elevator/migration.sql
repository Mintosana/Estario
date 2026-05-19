ALTER TABLE "listings" ADD COLUMN "hasElevator" BOOLEAN;
ALTER TABLE "saved_searches" ADD COLUMN "hasElevator" BOOLEAN;

CREATE INDEX "listings_hasElevator_idx" ON "listings"("hasElevator");
