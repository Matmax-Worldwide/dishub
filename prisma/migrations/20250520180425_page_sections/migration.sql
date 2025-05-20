/*
  Warnings:

  - Added the required column `sectionId` to the `PageSection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PageSection" ADD COLUMN     "componentId" TEXT,
ADD COLUMN     "sectionId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PageSection" ADD CONSTRAINT "PageSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CMSSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageSection" ADD CONSTRAINT "PageSection_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "CMSComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
