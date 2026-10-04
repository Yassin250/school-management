-- AlterTable
ALTER TABLE "fee_structures" ADD COLUMN     "termId" TEXT;

-- CreateIndex
CREATE INDEX "fee_structures_academicYearId_termId_idx" ON "fee_structures"("academicYearId", "termId");

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_termId_fkey" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
