-- CreateEnum
CREATE TYPE "AccessControlType" AS ENUM ('PUBLIC', 'ROLES', 'USERS', 'MIXED');

-- AlterTable
ALTER TABLE "ExternalLink" ADD COLUMN     "accessType" "AccessControlType" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "allowedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "allowedUsers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "deniedUsers" TEXT[] DEFAULT ARRAY[]::TEXT[];
