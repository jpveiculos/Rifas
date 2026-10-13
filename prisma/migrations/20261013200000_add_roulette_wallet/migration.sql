CREATE TYPE "RouletteWalletType" AS ENUM ('PLAY_CREDITS', 'WITHDRAWABLE_BALANCE');

CREATE TYPE "RouletteWalletTransactionType" AS ENUM (
  'DEPOSIT',
  'CONVERSION_IN',
  'CONVERSION_OUT',
  'STAKE',
  'PRIZE',
  'WITHDRAWAL',
  'REFUND',
  'ADMIN_ADJUSTMENT'
);

CREATE TABLE "RouletteWalletAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "RouletteWalletType" NOT NULL,
  "balanceCents" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RouletteWalletAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RouletteWalletTransaction" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "type" "RouletteWalletTransactionType" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "balanceAfterCents" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RouletteWalletTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RouletteWalletAccount_userId_type_key"
  ON "RouletteWalletAccount"("userId", "type");
CREATE INDEX "RouletteWalletAccount_userId_idx"
  ON "RouletteWalletAccount"("userId");
CREATE UNIQUE INDEX "RouletteWalletTransaction_idempotencyKey_key"
  ON "RouletteWalletTransaction"("idempotencyKey");
CREATE INDEX "RouletteWalletTransaction_accountId_createdAt_idx"
  ON "RouletteWalletTransaction"("accountId", "createdAt");
CREATE INDEX "RouletteWalletTransaction_sourceType_sourceId_idx"
  ON "RouletteWalletTransaction"("sourceType", "sourceId");

ALTER TABLE "RouletteWalletAccount"
  ADD CONSTRAINT "RouletteWalletAccount_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RouletteWalletTransaction"
  ADD CONSTRAINT "RouletteWalletTransaction_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "RouletteWalletAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
