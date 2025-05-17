-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'EMAIL', 'PASSWORD', 'NUMBER', 'PHONE', 'DATE', 'TIME', 'DATETIME', 'SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX', 'TOGGLE', 'SLIDER', 'RATING', 'FILE', 'HIDDEN', 'HEADING', 'PARAGRAPH', 'DIVIDER', 'SPACER', 'HTML', 'CAPTCHA', 'SIGNATURE', 'AUTOCOMPLETE', 'ADDRESS');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'SPAM');

-- AlterEnum
ALTER TYPE "ComponentType" ADD VALUE 'FORM_BUILDER';

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "isMultiStep" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "successMessage" TEXT,
    "redirectUrl" TEXT,
    "submitButtonText" TEXT NOT NULL DEFAULT 'Submit',
    "submitButtonStyle" TEXT,
    "layout" TEXT,
    "styling" JSONB,
    "pageId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormStep" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "validationRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormField" (
    "id" TEXT NOT NULL,
    "formId" TEXT,
    "stepId" TEXT,
    "label" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FormFieldType" NOT NULL,
    "placeholder" TEXT,
    "defaultValue" TEXT,
    "helpText" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "validationRules" JSONB,
    "styling" JSONB,
    "width" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Form_slug_key" ON "Form"("slug");

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormStep" ADD CONSTRAINT "FormStep_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormField" ADD CONSTRAINT "FormField_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "FormStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;
