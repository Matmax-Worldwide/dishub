/*
  Warnings:

  - You are about to drop the column `advanceBookingDays` on the `BookingRule` table. All the data in the column will be lost.
  - You are about to drop the column `allowedDaysOfWeek` on the `BookingRule` table. All the data in the column will be lost.
  - You are about to drop the column `allowedTimeSlots` on the `BookingRule` table. All the data in the column will be lost.
  - You are about to drop the column `blackoutDates` on the `BookingRule` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `BookingRule` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `BookingRule` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `BookingRule` table. All the data in the column will be lost.
  - You are about to drop the column `maxBookingsPerDay` on the `BookingRule` table. All the data in the column will be lost.
  - You are about to drop the column `maxBookingsPerMonth` on the `BookingRule` table. All the data in the column will be lost.
  - You are about to drop the column `maxBookingsPerWeek` on the `BookingRule` table. All the data in the column will be lost.
  - You are about to drop the column `minTimeBetweenBookings` on the `BookingRule` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `BookingRule` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `BookingRule` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[locationId]` on the table `BookingRule` will be added. If there are existing duplicate values, this will fail.
  - Made the column `tenantId` on table `Appointment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Benefit` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Blog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `advanceBookingDaysMax` to the `BookingRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `advanceBookingHoursMin` to the `BookingRule` table without a default value. This is not possible if the table is not empty.
  - Made the column `tenantId` on table `BookingRule` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `CMSComponent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `CMSDocument` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `CMSSection` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `CMSTemplate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Client` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Collection` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `CustomerAddress` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Department` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Discount` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Document` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Employee` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `EmployeeDocument` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `FooterStyle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Form` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `HeaderStyle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `HolidayCalendar` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Leave` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Location` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Media` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Menu` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `NavigationMenu` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Notification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Page` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Payroll` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Performance` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `PerformanceReview` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Post` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `ProductCategory` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Review` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Service` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `ServiceCategories` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `StaffProfile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `StaffSchedule` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Task` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `TimeEntry` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `Training` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `UserSettings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tenantId` on table `documentation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Benefit" DROP CONSTRAINT "Benefit_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Blog" DROP CONSTRAINT "Blog_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "BookingRule" DROP CONSTRAINT "BookingRule_locationId_fkey";

-- DropForeignKey
ALTER TABLE "BookingRule" DROP CONSTRAINT "BookingRule_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "CMSComponent" DROP CONSTRAINT "CMSComponent_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "CMSDocument" DROP CONSTRAINT "CMSDocument_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "CMSSection" DROP CONSTRAINT "CMSSection_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "CMSTemplate" DROP CONSTRAINT "CMSTemplate_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Collection" DROP CONSTRAINT "Collection_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerAddress" DROP CONSTRAINT "CustomerAddress_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Discount" DROP CONSTRAINT "Discount_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeDocument" DROP CONSTRAINT "EmployeeDocument_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "FooterStyle" DROP CONSTRAINT "FooterStyle_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "HeaderStyle" DROP CONSTRAINT "HeaderStyle_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "HolidayCalendar" DROP CONSTRAINT "HolidayCalendar_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Leave" DROP CONSTRAINT "Leave_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Menu" DROP CONSTRAINT "Menu_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "NavigationMenu" DROP CONSTRAINT "NavigationMenu_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Payroll" DROP CONSTRAINT "Payroll_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Performance" DROP CONSTRAINT "Performance_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "PerformanceReview" DROP CONSTRAINT "PerformanceReview_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "ProductCategory" DROP CONSTRAINT "ProductCategory_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceCategories" DROP CONSTRAINT "ServiceCategories_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "StaffProfile" DROP CONSTRAINT "StaffProfile_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "StaffSchedule" DROP CONSTRAINT "StaffSchedule_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "TimeEntry" DROP CONSTRAINT "TimeEntry_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Training" DROP CONSTRAINT "Training_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "UserSettings" DROP CONSTRAINT "UserSettings_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "documentation" DROP CONSTRAINT "documentation_tenantId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Benefit" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Blog" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "BookingRule" DROP COLUMN "advanceBookingDays",
DROP COLUMN "allowedDaysOfWeek",
DROP COLUMN "allowedTimeSlots",
DROP COLUMN "blackoutDates",
DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "isActive",
DROP COLUMN "maxBookingsPerDay",
DROP COLUMN "maxBookingsPerMonth",
DROP COLUMN "maxBookingsPerWeek",
DROP COLUMN "minTimeBetweenBookings",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "advanceBookingDaysMax" INTEGER NOT NULL,
ADD COLUMN     "advanceBookingHoursMin" INTEGER NOT NULL,
ADD COLUMN     "bookingSlotIntervalMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "bufferBetweenAppointmentsMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxAppointmentsPerDayPerStaff" INTEGER,
ADD COLUMN     "sameDayCutoffTime" TEXT,
ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CMSComponent" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CMSDocument" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CMSSection" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CMSTemplate" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Client" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Collection" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CustomerAddress" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Discount" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Document" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "EmployeeDocument" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "FooterStyle" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Form" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "HeaderStyle" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "HolidayCalendar" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Leave" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Location" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Media" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Menu" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "NavigationMenu" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Page" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payroll" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Performance" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "PerformanceReview" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProductCategory" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ServiceCategories" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "StaffProfile" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "StaffSchedule" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "customDomainStatus" TEXT,
ADD COLUMN     "defaultDeploymentUrl" TEXT,
ADD COLUMN     "revalidationSecretToken" TEXT,
ADD COLUMN     "vercelProjectId" TEXT;

-- AlterTable
ALTER TABLE "TimeEntry" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Training" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserSettings" ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "documentation" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BookingRule_locationId_key" ON "BookingRule"("locationId");

-- CreateIndex
CREATE INDEX "StaffSchedule_staffProfileId_date_idx" ON "StaffSchedule"("staffProfileId", "date");

-- CreateIndex
CREATE INDEX "StaffSchedule_staffProfileId_dayOfWeek_idx" ON "StaffSchedule"("staffProfileId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Performance" ADD CONSTRAINT "Performance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Benefit" ADD CONSTRAINT "Benefit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HolidayCalendar" ADD CONSTRAINT "HolidayCalendar_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payroll" ADD CONSTRAINT "Payroll_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSSection" ADD CONSTRAINT "CMSSection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSDocument" ADD CONSTRAINT "CMSDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSTemplate" ADD CONSTRAINT "CMSTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSComponent" ADD CONSTRAINT "CMSComponent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationMenu" ADD CONSTRAINT "NavigationMenu_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeaderStyle" ADD CONSTRAINT "HeaderStyle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FooterStyle" ADD CONSTRAINT "FooterStyle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCategories" ADD CONSTRAINT "ServiceCategories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSchedule" ADD CONSTRAINT "StaffSchedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRule" ADD CONSTRAINT "BookingRule_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRule" ADD CONSTRAINT "BookingRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentation" ADD CONSTRAINT "documentation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
