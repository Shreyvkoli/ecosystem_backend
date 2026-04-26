-- AlterTable
ALTER TABLE "EditorProfile" ADD COLUMN     "lastDisputeAt" TIMESTAMP(3),
ADD COLUMN     "monthlyDisputeCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "autoApproveAtSet" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "clearedAt" TIMESTAMP(3),
ADD COLUMN     "isCleared" BOOLEAN NOT NULL DEFAULT false;
