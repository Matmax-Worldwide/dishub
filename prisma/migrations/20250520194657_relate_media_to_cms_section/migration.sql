/*
  Warnings:

  - You are about to drop the column `pageSectionId` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the `PageSection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_pageSectionId_fkey";

-- DropForeignKey
ALTER TABLE "PageSection" DROP CONSTRAINT "PageSection_componentId_fkey";

-- DropForeignKey
ALTER TABLE "PageSection" DROP CONSTRAINT "PageSection_pageId_fkey";

-- DropForeignKey
ALTER TABLE "PageSection" DROP CONSTRAINT "PageSection_sectionId_fkey";

-- AlterTable
ALTER TABLE "CMSSection" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "pageSectionId",
ADD COLUMN     "cmsSectionId" TEXT;

-- DropTable
DROP TABLE "PageSection";

-- CreateTable
CREATE TABLE "_PageToSection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PageToSection_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PageToSection_B_index" ON "_PageToSection"("B");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_cmsSectionId_fkey" FOREIGN KEY ("cmsSectionId") REFERENCES "CMSSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PageToSection" ADD CONSTRAINT "_PageToSection_A_fkey" FOREIGN KEY ("A") REFERENCES "CMSSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PageToSection" ADD CONSTRAINT "_PageToSection_B_fkey" FOREIGN KEY ("B") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
