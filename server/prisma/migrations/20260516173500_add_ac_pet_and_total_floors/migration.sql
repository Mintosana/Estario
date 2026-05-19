ALTER TABLE "listings" ADD COLUMN "totalFloors" INTEGER;
ALTER TABLE "listings" ADD COLUMN "hasAirConditioning" BOOLEAN;
ALTER TABLE "listings" ADD COLUMN "petFriendly" BOOLEAN;

ALTER TABLE "saved_searches" ADD COLUMN "hasAirConditioning" BOOLEAN;
ALTER TABLE "saved_searches" ADD COLUMN "petFriendly" BOOLEAN;

CREATE INDEX "listings_hasAirConditioning_idx" ON "listings"("hasAirConditioning");
CREATE INDEX "listings_petFriendly_idx" ON "listings"("petFriendly");
