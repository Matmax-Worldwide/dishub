-- CreateEnum
CREATE TYPE "ConsentPurpose" AS ENUM ('ESSENTIAL', 'ANALYTICS', 'MARKETING', 'PERSONALIZATION', 'THIRD_PARTY', 'COOKIES', 'PROFILING');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'ANONYMIZE', 'CONSENT_GRANTED', 'CONSENT_REVOKED', 'DATA_REQUEST', 'POLICY_ACCEPTED');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('LOW', 'INFO', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AuditCategory" AS ENUM ('DATA_ACCESS', 'DATA_MODIFICATION', 'AUTHENTICATION', 'AUTHORIZATION', 'CONSENT_MANAGEMENT', 'DATA_EXPORT', 'SYSTEM_ADMIN', 'PRIVACY_RIGHTS');

-- CreateEnum
CREATE TYPE "DataSubjectRequestType" AS ENUM ('ACCESS', 'RECTIFICATION', 'ERASURE', 'RESTRICTION', 'PORTABILITY', 'OBJECTION', 'WITHDRAW_CONSENT');

-- CreateEnum
CREATE TYPE "LegalBasis" AS ENUM ('CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS');

-- CreateEnum
CREATE TYPE "BreachSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BreachStatus" AS ENUM ('DETECTED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'REPORTED');

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "version" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "source" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "category" "AuditCategory" NOT NULL DEFAULT 'DATA_ACCESS',
    "tenantId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DataSubjectRequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "exportUrl" TEXT,
    "exportExpiresAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "processingNotes" TEXT,
    "verificationToken" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataRetentionPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dataType" TEXT NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "autoDelete" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "conditions" JSONB,
    "lastExecuted" TIMESTAMP(3),
    "nextExecution" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "DataRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataProcessingActivity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "legalBasis" "LegalBasis" NOT NULL,
    "dataCategories" TEXT[],
    "dataSubjects" TEXT[],
    "recipients" TEXT[],
    "thirdCountries" TEXT[],
    "retentionPeriod" TEXT NOT NULL,
    "securityMeasures" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "DataProcessingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyPolicy" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT,

    CONSTRAINT "PrivacyPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataBreach" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "BreachSeverity" NOT NULL,
    "status" "BreachStatus" NOT NULL DEFAULT 'DETECTED',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurredAt" TIMESTAMP(3),
    "containedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "affectedRecords" INTEGER,
    "dataTypes" TEXT[],
    "affectedUsers" TEXT[],
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "authoritiesNotified" BOOLEAN NOT NULL DEFAULT false,
    "usersNotified" BOOLEAN NOT NULL DEFAULT false,
    "rootCause" TEXT,
    "mitigationSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preventionMeasures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reportedBy" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "DataBreach_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_idx" ON "ConsentRecord"("userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_tenantId_idx" ON "ConsentRecord"("tenantId");

-- CreateIndex
CREATE INDEX "ConsentRecord_purpose_idx" ON "ConsentRecord"("purpose");

-- CreateIndex
CREATE INDEX "ConsentRecord_granted_idx" ON "ConsentRecord"("granted");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentRecord_userId_purpose_version_tenantId_key" ON "ConsentRecord"("userId", "purpose", "version", "tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_category_idx" ON "AuditLog"("category");

-- CreateIndex
CREATE INDEX "AuditLog_severity_idx" ON "AuditLog"("severity");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_userId_idx" ON "DataSubjectRequest"("userId");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_tenantId_idx" ON "DataSubjectRequest"("tenantId");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_type_idx" ON "DataSubjectRequest"("type");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_requestedAt_idx" ON "DataSubjectRequest"("requestedAt");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_tenantId_idx" ON "DataRetentionPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_dataType_idx" ON "DataRetentionPolicy"("dataType");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_isActive_idx" ON "DataRetentionPolicy"("isActive");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_nextExecution_idx" ON "DataRetentionPolicy"("nextExecution");

-- CreateIndex
CREATE UNIQUE INDEX "DataRetentionPolicy_tenantId_name_key" ON "DataRetentionPolicy"("tenantId", "name");

-- CreateIndex
CREATE INDEX "DataProcessingActivity_tenantId_idx" ON "DataProcessingActivity"("tenantId");

-- CreateIndex
CREATE INDEX "DataProcessingActivity_isActive_idx" ON "DataProcessingActivity"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DataProcessingActivity_tenantId_name_key" ON "DataProcessingActivity"("tenantId", "name");

-- CreateIndex
CREATE INDEX "PrivacyPolicy_tenantId_idx" ON "PrivacyPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "PrivacyPolicy_isActive_idx" ON "PrivacyPolicy"("isActive");

-- CreateIndex
CREATE INDEX "PrivacyPolicy_version_idx" ON "PrivacyPolicy"("version");

-- CreateIndex
CREATE UNIQUE INDEX "PrivacyPolicy_tenantId_version_key" ON "PrivacyPolicy"("tenantId", "version");

-- CreateIndex
CREATE INDEX "DataBreach_tenantId_idx" ON "DataBreach"("tenantId");

-- CreateIndex
CREATE INDEX "DataBreach_severity_idx" ON "DataBreach"("severity");

-- CreateIndex
CREATE INDEX "DataBreach_status_idx" ON "DataBreach"("status");

-- CreateIndex
CREATE INDEX "DataBreach_detectedAt_idx" ON "DataBreach"("detectedAt");

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataRetentionPolicy" ADD CONSTRAINT "DataRetentionPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataProcessingActivity" ADD CONSTRAINT "DataProcessingActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacyPolicy" ADD CONSTRAINT "PrivacyPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataBreach" ADD CONSTRAINT "DataBreach_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
