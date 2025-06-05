import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/auditLogger';
import { tenantEncryption } from '@/lib/encryption/tenantEncryption';
import { DataSubjectRequestType, RequestStatus } from '@prisma/client';
import * as JSZip from 'jszip';

export interface DataExport {
  personalData: Record<string, unknown>;
  consentHistory: unknown[];
  activityLogs: unknown[];
  processedData: unknown[];
  metadata: {
    exportedAt: string;
    dataFormat: string;
    requestId: string;
    userId: string;
  };
}

export interface PortableData {
  downloadUrl: string;
  format: string;
  schema: string;
  expiresAt: Date;
  size: number;
}

export interface DeletionRequest {
  requestId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  canDelete: boolean;
  retentionReasons?: string[];
  estimatedCompletion?: Date;
}

export class DataSubjectRightsPortal {
  private static instance: DataSubjectRightsPortal;

  private constructor() {}

  public static getInstance(): DataSubjectRightsPortal {
    if (!DataSubjectRightsPortal.instance) {
      DataSubjectRightsPortal.instance = new DataSubjectRightsPortal();
    }
    return DataSubjectRightsPortal.instance;
  }

  /**
   * REQUEST DATA ACCESS (Article 15 GDPR)
   */
  async requestDataAccess(userId: string, tenantId: string, description?: string): Promise<DataExport> {
    console.log(`Processing data access request for user ${userId} in tenant ${tenantId}`);

    // Create request record
    const request = await prisma.dataSubjectRequest.create({
      data: {
        userId,
        tenantId,
        type: DataSubjectRequestType.ACCESS,
        description: description || 'User requested access to personal data',
        status: RequestStatus.PENDING,
        verificationToken: tenantEncryption.generateSecureToken(),
      },
    });

    try {
      // Collect all personal data
      const personalData = await this.collectPersonalData(userId, tenantId);
      
      // Get consent history
      const consentHistory = await this.getConsentHistory(userId, tenantId);
      
      // Get activity logs (pseudonymized)
      const activityLogs = await this.getActivityLogs(userId, tenantId);
      
      // Get processed data
      const processedData = await this.getProcessedData(userId, tenantId);

      const dataExport: DataExport = {
        personalData,
        consentHistory,
        activityLogs,
        processedData,
        metadata: {
          exportedAt: new Date().toISOString(),
          dataFormat: 'JSON',
          requestId: request.id,
          userId,
        },
      };

      // Update request status
      await prisma.dataSubjectRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.APPROVED,
          completedAt: new Date(),
        },
      });

      // Log the access request
      await auditLogger.logDataSubjectRequest(
        userId,
        'ACCESS',
        request.id,
        'COMPLETED',
        tenantId
      );

      return dataExport;
    } catch (error) {
      // Update request with error
      await prisma.dataSubjectRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.REJECTED,
          rejectionReason: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * REQUEST DATA DELETION (Article 17 GDPR - Right to be forgotten)
   */
  async requestDataDeletion(
    userId: string, 
    tenantId: string, 
    description?: string
  ): Promise<DeletionRequest> {
    console.log(`Processing data deletion request for user ${userId} in tenant ${tenantId}`);

    // Check if user data can be deleted (legal retention requirements)
    const retentionCheck = await this.checkLegalRetention(userId, tenantId);

    // Create request record
    const request = await prisma.dataSubjectRequest.create({
      data: {
        userId,
        tenantId,
        type: DataSubjectRequestType.ERASURE,
        description: description || 'User requested data deletion',
        status: RequestStatus.PENDING,
        verificationToken: tenantEncryption.generateSecureToken(),
      },
    });

    if (!retentionCheck.canDelete) {
      // Update request status
      await prisma.dataSubjectRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.REJECTED,
          rejectionReason: `Data cannot be deleted due to legal retention requirements: ${retentionCheck.reasons.join(', ')}`,
        },
      });

      return {
        requestId: request.id,
        status: 'failed',
        canDelete: false,
        retentionReasons: retentionCheck.reasons,
      };
    }

    try {
      // Process deletion
      await this.executeDataDeletion(userId, tenantId);

      // Update request status
      await prisma.dataSubjectRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.APPROVED,
          completedAt: new Date(),
        },
      });

      // Log the deletion
      await auditLogger.logDataSubjectRequest(
        userId,
        'ERASURE',
        request.id,
        'COMPLETED',
        tenantId
      );

      return {
        requestId: request.id,
        status: 'completed',
        canDelete: true,
      };
    } catch (error) {
      await prisma.dataSubjectRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.REJECTED,
          rejectionReason: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return {
        requestId: request.id,
        status: 'failed',
        canDelete: false,
      };
    }
  }

  /**
   * REQUEST DATA PORTABILITY (Article 20 GDPR)
   */
  async requestDataPortability(
    userId: string, 
    tenantId: string, 
    format = 'JSON-LD'
  ): Promise<PortableData> {
    console.log(`Processing data portability request for user ${userId} in tenant ${tenantId}`);

    // Create request record
    const request = await prisma.dataSubjectRequest.create({
      data: {
        userId,
        tenantId,
        type: DataSubjectRequestType.PORTABILITY,
        description: `User requested data portability in ${format} format`,
        status: RequestStatus.PENDING,
        verificationToken: tenantEncryption.generateSecureToken(),
      },
    });

    try {
      // Collect portable data
      const portableData = await this.generatePortableDataset(userId, tenantId);
      
      // Convert to requested format
      const formattedData = await this.convertToStandardFormat(portableData, format);
      
      // Generate secure download package
      const downloadPackage = await this.createDownloadPackage(formattedData, userId, request.id);

      // Update request status
      await prisma.dataSubjectRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.APPROVED,
          completedAt: new Date(),
          exportUrl: downloadPackage.url,
          exportExpiresAt: downloadPackage.expiresAt,
        },
      });

      // Log the portability request
      await auditLogger.logDataSubjectRequest(
        userId,
        'PORTABILITY',
        request.id,
        'COMPLETED',
        tenantId
      );

      return {
        downloadUrl: downloadPackage.url,
        format,
        schema: 'https://schema.org/Person',
        expiresAt: downloadPackage.expiresAt,
        size: downloadPackage.size,
      };
    } catch (error) {
      await prisma.dataSubjectRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.REJECTED,
          rejectionReason: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * REQUEST DATA RECTIFICATION (Article 16 GDPR)
   */
  async requestDataRectification(
    userId: string,
    tenantId: string,
    corrections: Record<string, unknown>,
    description?: string
  ): Promise<{ requestId: string; status: string }> {
    console.log(`Processing data rectification request for user ${userId} in tenant ${tenantId}`);

    const request = await prisma.dataSubjectRequest.create({
      data: {
        userId,
        tenantId,
        type: DataSubjectRequestType.RECTIFICATION,
        description: description || `User requested data corrections: ${JSON.stringify(corrections)}`,
        status: RequestStatus.PENDING,
        verificationToken: tenantEncryption.generateSecureToken(),
      },
    });

    try {
      // Get current user data
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      // Apply corrections
      const updatedData: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(corrections)) {
        if (this.isValidFieldForRectification(field)) {
          updatedData[field] = value;
        }
      }

      // Update user data
      await prisma.user.update({
        where: { id: userId },
        data: updatedData,
      });

      // Update request status
      await prisma.dataSubjectRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.APPROVED,
          completedAt: new Date(),
          processingNotes: `Applied corrections: ${JSON.stringify(updatedData)}`,
        },
      });

      // Log the rectification
      await auditLogger.logDataSubjectRequest(
        userId,
        'RECTIFICATION',
        request.id,
        'COMPLETED',
        tenantId
      );

      return {
        requestId: request.id,
        status: 'completed',
      };
    } catch (error) {
      await prisma.dataSubjectRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.REJECTED,
          rejectionReason: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * WITHDRAW CONSENT (Article 7 GDPR)
   */
  async withdrawConsent(
    userId: string,
    tenantId: string,
    consentPurpose: string,
    description?: string
  ): Promise<{ success: boolean; stoppedProcessing: string[] }> {
    console.log(`Processing consent withdrawal for user ${userId}, purpose: ${consentPurpose}`);

    // Create request record
    const request = await prisma.dataSubjectRequest.create({
      data: {
        userId,
        tenantId,
        type: DataSubjectRequestType.WITHDRAW_CONSENT,
        description: description || `User withdrew consent for ${consentPurpose}`,
        status: RequestStatus.PENDING,
      },
    });

    try {
      // Update consent record
      await prisma.consentRecord.updateMany({
        where: {
          userId,
          tenantId,
          purpose: consentPurpose as never, // Type assertion for enum
          granted: true,
        },
        data: {
          granted: false,
          revokedAt: new Date(),
        },
      });

      // Stop related processing activities
      const stoppedActivities = await this.stopConsentBasedProcessing(userId, tenantId, consentPurpose);

      // Update request status
      await prisma.dataSubjectRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.APPROVED,
          completedAt: new Date(),
          processingNotes: `Stopped processing activities: ${stoppedActivities.join(', ')}`,
        },
      });

      // Log consent withdrawal
      await auditLogger.logConsent(
        userId,
        'CONSENT_REVOKED',
        consentPurpose,
        tenantId
      );

      return {
        success: true,
        stoppedProcessing: stoppedActivities,
      };
    } catch (error) {
      await prisma.dataSubjectRequest.update({
        where: { id: request.id },
        data: {
          status: RequestStatus.REJECTED,
          rejectionReason: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async collectPersonalData(userId: string, tenantId: string): Promise<Record<string, unknown>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        accounts: true,
        settings: true,
        employee: true,
        addresses: true,
      },
    });

    if (!user || user.tenantId !== tenantId) {
      throw new Error('User not found or access denied');
    }

    // Remove sensitive fields
    const safeUserData = Object.assign({}, user);
    delete (safeUserData as { password?: string }).password;
    delete (safeUserData as { passwordResetToken?: string }).passwordResetToken;

    return {
      profile: safeUserData,
      preferences: user.settings,
      employeeData: user.employee,
      addresses: user.addresses,
    };
  }

  private async getConsentHistory(userId: string, tenantId: string): Promise<unknown[]> {
    const consents = await prisma.consentRecord.findMany({
      where: { userId, tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return consents.map(consent => ({
      purpose: consent.purpose,
      granted: consent.granted,
      grantedAt: consent.grantedAt,
      revokedAt: consent.revokedAt,
      version: consent.version,
      source: consent.source,
    }));
  }

  private async getActivityLogs(userId: string, tenantId: string): Promise<unknown[]> {
    const logs = await prisma.auditLog.findMany({
      where: { userId, tenantId },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to recent activity
    });

    // Pseudonymize sensitive data in logs
    return logs.map(log => ({
      action: log.action,
      resource: log.resource,
      timestamp: log.timestamp,
      category: log.category,
      severity: log.severity,
      details: this.pseudonymizeLogDetails(log.details),
    }));
  }

  private async getProcessedData(userId: string, tenantId: string): Promise<unknown[]> {
    // Get data processing activities that involve this user
    const activities = await prisma.dataProcessingActivity.findMany({
      where: { tenantId, isActive: true },
    });

    return activities.map(activity => ({
      name: activity.name,
      purpose: activity.purpose,
      legalBasis: activity.legalBasis,
      dataCategories: activity.dataCategories,
      retentionPeriod: activity.retentionPeriod,
    }));
  }

  private async checkLegalRetention(
    userId: string, 
    tenantId: string
  ): Promise<{ canDelete: boolean; reasons: string[] }> {
    // Check retention policies for informational purposes
    await prisma.dataRetentionPolicy.findMany({
      where: {
        OR: [
          { tenantId },
          { tenantId: null }, // Global policies
        ],
        isActive: true,
      },
    });

    const reasons: string[] = [];

    // Check if user has active legal obligations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    if (user?.employee) {
      reasons.push('Employee data must be retained for 7 years after employment ends');
    }

    // Check for active orders or transactions
    const recentOrders = await prisma.order.findMany({
      where: { 
        customerId: userId,
        createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }, // 1 year
      },
    });

    if (recentOrders.length > 0) {
      reasons.push('Customer data must be retained for 1 year after last transaction for tax purposes');
    }

    return {
      canDelete: reasons.length === 0,
      reasons,
    };
  }

  private async executeDataDeletion(userId: string, tenantId: string): Promise<void> {
    console.log(`Executing data deletion for user ${userId} in tenant ${tenantId}`);

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete user's personal data in order (respect foreign key constraints)
      await tx.consentRecord.deleteMany({ where: { userId } });
      await tx.customerAddress.deleteMany({ where: { customerId: userId } });
      await tx.userSettings.deleteMany({ where: { userId } });
      await tx.auditLog.updateMany({ 
        where: { userId }, 
        data: { userId: null } // Anonymize audit logs instead of deleting
      });
      
      // Anonymize user record instead of deleting (preserve referential integrity)
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${tenantEncryption.generateSecureToken(8)}@deleted.local`,
          firstName: 'DELETED',
          lastName: 'USER',
          phoneNumber: null,
          bio: null,
          profileImageUrl: null,
          isActive: false,
        },
      });
    });

    console.log(`Data deletion completed for user ${userId}`);
  }

  private async generatePortableDataset(userId: string, tenantId: string): Promise<Record<string, unknown>> {
    const personalData = await this.collectPersonalData(userId, tenantId);
    const consentHistory = await this.getConsentHistory(userId, tenantId);

    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      identifier: userId,
      personalData,
      consentHistory,
      exportedAt: new Date().toISOString(),
      format: 'JSON-LD',
    };
  }

  private async convertToStandardFormat(
    data: Record<string, unknown>, 
    format: string
  ): Promise<string> {
    switch (format) {
      case 'JSON-LD':
        return JSON.stringify(data, null, 2);
      case 'CSV':
        // Flatten data for CSV format
        return this.convertToCSV(data);
      case 'XML':
        return this.convertToXML(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  private async createDownloadPackage(
    data: string, 
    userId: string, 
    requestId: string
  ): Promise<{ url: string; expiresAt: Date; size: number }> {
    const zip = new JSZip.default();
    
    // Add data file
    zip.file(`user-data-${userId}.json`, data);
    
    // Add metadata
    zip.file('metadata.json', JSON.stringify({
      requestId,
      userId,
      exportedAt: new Date().toISOString(),
      dataFormat: 'JSON-LD',
      version: '1.0',
    }, null, 2));

    // Generate zip buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // In production, upload to secure storage and return signed URL
    // For now, return a simulated URL
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      url: `/api/gdpr/download/${requestId}/${tenantEncryption.generateSecureToken()}`,
      expiresAt,
      size: zipBuffer.length,
    };
  }

  private isValidFieldForRectification(field: string): boolean {
    const allowedFields = [
      'firstName',
      'lastName',
      'phoneNumber',
      'bio',
      'department',
      'position',
    ];
    
    return allowedFields.includes(field);
  }

  private async stopConsentBasedProcessing(
    userId: string, 
    tenantId: string, 
    purpose: string
  ): Promise<string[]> {
    // This would stop various processing activities based on consent purpose
    const stoppedActivities: string[] = [];

    switch (purpose) {
      case 'MARKETING':
        stoppedActivities.push('Email marketing campaigns', 'Promotional notifications');
        break;
      case 'ANALYTICS':
        stoppedActivities.push('User behavior tracking', 'Performance analytics');
        break;
      case 'PERSONALIZATION':
        stoppedActivities.push('Content personalization', 'Recommendation engine');
        break;
    }

    return stoppedActivities;
  }

  private pseudonymizeLogDetails(details: string | null): string {
    if (!details) return '';
    
    // Remove or hash sensitive information from log details
    return details
      .replace(/\b[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, '[CARD]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
  }

  private convertToCSV(data: Record<string, unknown>): string {
    // Simple CSV conversion (would need more sophisticated handling in production)
    const headers = Object.keys(data);
    const values = Object.values(data).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : String(v)
    );
    
    return [headers.join(','), values.join(',')].join('\n');
  }

  private convertToXML(data: Record<string, unknown>): string {
    // Simple XML conversion (would need more sophisticated handling in production)
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<userData>\n';
    
    for (const [key, value] of Object.entries(data)) {
      const xmlValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      xml += `  <${key}>${xmlValue}</${key}>\n`;
    }
    
    xml += '</userData>';
    return xml;
  }
}

// Export singleton instance
export const dataSubjectRights = DataSubjectRightsPortal.getInstance(); 