-- DropIndex
DROP INDEX "LedgerEntry_accountFrom_idx";

-- DropIndex
DROP INDEX "LedgerEntry_accountTo_idx";

-- DropIndex
DROP INDEX "LedgerEntry_orderId_idx";

-- DropIndex
DROP INDEX "LedgerEntry_transactionType_idx";

-- AlterTable
ALTER TABLE "EditorProfile" ADD COLUMN     "strikeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPenaltyPaid" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "EditorActivity" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "penaltyTxId" TEXT,
    "creatorId" TEXT NOT NULL,
    "editorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "proofUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolutionNote" TEXT,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EditorActivity_orderId_idx" ON "EditorActivity"("orderId");

-- CreateIndex
CREATE INDEX "EditorActivity_userId_idx" ON "EditorActivity"("userId");

-- CreateIndex
CREATE INDEX "EditorActivity_createdAt_idx" ON "EditorActivity"("createdAt");

-- CreateIndex
CREATE INDEX "Dispute_orderId_idx" ON "Dispute"("orderId");

-- CreateIndex
CREATE INDEX "Dispute_editorId_idx" ON "Dispute"("editorId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- AddForeignKey
ALTER TABLE "EditorActivity" ADD CONSTRAINT "EditorActivity_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "EditorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorActivity" ADD CONSTRAINT "EditorActivity_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
