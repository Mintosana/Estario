-- CreateTable
CREATE TABLE "points_of_interest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_of_interest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "points_of_interest_category_idx" ON "points_of_interest"("category");

-- CreateIndex
CREATE INDEX "points_of_interest_city_idx" ON "points_of_interest"("city");

-- CreateIndex
CREATE INDEX "points_of_interest_county_idx" ON "points_of_interest"("county");

-- CreateIndex
CREATE INDEX "points_of_interest_latitude_longitude_idx" ON "points_of_interest"("latitude", "longitude");
