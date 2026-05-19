CREATE TYPE "CompartmentalizationType" AS ENUM ('DETACHED', 'SEMI_DETACHED', 'NON_DETACHED', 'CIRCULAR', 'OPEN_SPACE');

ALTER TABLE "listings" ADD COLUMN "compartmentalization" "CompartmentalizationType";
ALTER TABLE "saved_searches" ADD COLUMN "compartmentalization" "CompartmentalizationType";

CREATE INDEX "listings_compartmentalization_idx" ON "listings"("compartmentalization");
