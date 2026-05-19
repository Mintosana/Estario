ALTER TABLE "users" ADD COLUMN "promotionCredits" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "listings" ADD COLUMN "sponsoredAt" TIMESTAMP(3);
ALTER TABLE "listings" ADD COLUMN "sponsoredUntil" TIMESTAMP(3);

CREATE INDEX "listings_sponsoredUntil_idx" ON "listings"("sponsoredUntil");

ALTER TABLE "saved_searches" ALTER COLUMN "sort" SET DEFAULT 'relevance';
