CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "county" TEXT,
    "propertyType" "PropertyType",
    "transactionType" "TransactionType",
    "minPrice" DECIMAL(12,2),
    "maxPrice" DECIMAL(12,2),
    "rooms" INTEGER,
    "sort" TEXT NOT NULL DEFAULT 'newest',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "saved_searches_userId_idx" ON "saved_searches"("userId");

ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
