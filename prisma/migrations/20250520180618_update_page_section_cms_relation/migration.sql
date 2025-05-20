-- DropForeignKey
ALTER TABLE "PageSection" DROP CONSTRAINT "PageSection_sectionId_fkey";

-- AlterTable
ALTER TABLE "PageSection" ALTER COLUMN "sectionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PageSection" ADD CONSTRAINT "PageSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CMSSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
