CREATE TYPE "CentralHeatingType" AS ENUM ('INDIVIDUAL', 'BUILDING', 'RESIDENTIAL_COMPLEX');

ALTER TYPE "HeatingType" RENAME VALUE 'OWN_CENTRAL' TO 'CENTRAL';

ALTER TABLE "listings"
ADD COLUMN "centralHeatingType" "CentralHeatingType";

UPDATE "listings"
SET
  "heatingType" = 'CENTRAL',
  "centralHeatingType" = 'INDIVIDUAL'
WHERE "hasOwnCentralHeating" = true OR "heatingType" = 'CENTRAL';

ALTER TABLE "listings"
DROP COLUMN "hasOwnCentralHeating";

ALTER TABLE "saved_searches"
ADD COLUMN "heatingType" "HeatingType",
ADD COLUMN "centralHeatingType" "CentralHeatingType";

UPDATE "saved_searches"
SET
  "heatingType" = 'CENTRAL',
  "centralHeatingType" = 'INDIVIDUAL'
WHERE "hasOwnCentralHeating" = true;

ALTER TABLE "saved_searches"
DROP COLUMN "hasOwnCentralHeating";
