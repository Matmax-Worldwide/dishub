-- CreateTable
CREATE TABLE "FooterStyle" (
    "id" TEXT NOT NULL,
    "transparency" INTEGER DEFAULT 0,
    "columnLayout" TEXT DEFAULT 'grid',
    "socialAlignment" TEXT DEFAULT 'left',
    "borderTop" BOOLEAN DEFAULT false,
    "alignment" TEXT DEFAULT 'left',
    "padding" TEXT DEFAULT 'medium',
    "width" TEXT DEFAULT 'container',
    "advancedOptions" JSONB,
    "menuId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterStyle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FooterStyle_menuId_key" ON "FooterStyle"("menuId");

-- AddForeignKey
ALTER TABLE "FooterStyle" ADD CONSTRAINT "FooterStyle_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
