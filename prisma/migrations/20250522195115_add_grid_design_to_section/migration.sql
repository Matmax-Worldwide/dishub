-- AlterTable
ALTER TABLE "CMSSection" ADD COLUMN     "backgroundImage" TEXT,
ADD COLUMN     "backgroundType" TEXT DEFAULT 'gradient',
ADD COLUMN     "gridDesign" TEXT DEFAULT 'basic';
