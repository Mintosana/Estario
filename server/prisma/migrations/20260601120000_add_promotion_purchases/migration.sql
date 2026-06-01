CREATE TABLE "promotion_purchases" (
    "id" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bundleKey" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "promotion_purchases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "promotion_purchases_stripeSessionId_key" ON "promotion_purchases"("stripeSessionId");
CREATE INDEX "promotion_purchases_userId_idx" ON "promotion_purchases"("userId");
CREATE INDEX "promotion_purchases_status_idx" ON "promotion_purchases"("status");

ALTER TABLE "promotion_purchases" ADD CONSTRAINT "promotion_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
