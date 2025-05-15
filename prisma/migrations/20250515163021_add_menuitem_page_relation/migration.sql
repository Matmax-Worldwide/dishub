-- CreateTable
CREATE TABLE "HeaderStyle" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "transparency" INTEGER NOT NULL DEFAULT 0,
    "headerSize" TEXT NOT NULL DEFAULT 'md',
    "menuAlignment" TEXT NOT NULL DEFAULT 'right',
    "menuButtonStyle" TEXT NOT NULL DEFAULT 'default',
    "mobileMenuStyle" TEXT NOT NULL DEFAULT 'dropdown',
    "mobileMenuPosition" TEXT NOT NULL DEFAULT 'right',
    "transparentHeader" BOOLEAN NOT NULL DEFAULT false,
    "borderBottom" BOOLEAN NOT NULL DEFAULT false,
    "advancedOptions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeaderStyle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeaderStyle_menuId_key" ON "HeaderStyle"("menuId");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeaderStyle" ADD CONSTRAINT "HeaderStyle_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
