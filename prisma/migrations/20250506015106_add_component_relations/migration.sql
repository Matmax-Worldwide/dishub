/*
  Warnings:

  - You are about to drop the column `components` on the `CMSSection` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CMSSection" DROP COLUMN "components",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "SectionComponent" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SectionComponent_sectionId_componentId_order_key" ON "SectionComponent"("sectionId", "componentId", "order");

-- AddForeignKey
ALTER TABLE "SectionComponent" ADD CONSTRAINT "SectionComponent_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CMSSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionComponent" ADD CONSTRAINT "SectionComponent_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "CMSComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
