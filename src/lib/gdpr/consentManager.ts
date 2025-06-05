import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/auditLogger';
import { ConsentPurpose } from '@prisma/client';

export interface ConsentRequest {
  userId: string;
  tenantId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  version: string;
  ipAddress?: string;
  userAgent?: string;
  source: 'registration' | 'cookie_banner' | 'settings' | 'api';
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface ConsentStatus {
  purpose: ConsentPurpose;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  version: string;
  source: string;
  expiresAt?: Date;
  needsRenewal: boolean;
}

export interface ConsentBanner {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  purposes: ConsentPurpose[];
  mandatoryPurposes: ConsentPurpose[];
  policyVersion: string;
  isActive: boolean;
  styling: Record<string, unknown>;
  position: 'top' | 'bottom' | 'center' | 'modal';
  showRejectAll: boolean;
  showAcceptAll: boolean;
  granularChoice: boolean;
}

export interface ConsentDashboard {
  userId: string;
  consents: ConsentStatus[];
  canWithdraw: ConsentPurpose[];
  dataProcessingActivities: Array<{
    name: string;
    purpose: string;
    legalBasis: string;
    consentRequired: boolean;
    dataTypes: string[];
  }>;
  downloadableData: boolean;
  deletionPossible: boolean;
}

export class ConsentManager {
  private static instance: ConsentManager;
  
  // GDPR consent retention periods
  private readonly consentRetentionPeriods = {
    [ConsentPurpose.ESSENTIAL]: null, // No expiry for essential
    [ConsentPurpose.ANALYTICS]: 365 * 2, // 2 years
    [ConsentPurpose.MARKETING]: 365 * 2, // 2 years
    [ConsentPurpose.PERSONALIZATION]: 365, // 1 year
    [ConsentPurpose.THIRD_PARTY]: 365, // 1 year
    [ConsentPurpose.COOKIES]: 365, // 1 year
    [ConsentPurpose.PROFILING]: 365 * 2, // 2 years
  };

  private constructor() {}

  public static getInstance(): ConsentManager {
    if (!ConsentManager.instance) {
      ConsentManager.instance = new ConsentManager();
    }
    return ConsentManager.instance;
  }

  /**
   * Record user consent
   */
  async recordConsent(request: ConsentRequest): Promise<ConsentStatus> {
    console.log(`Recording consent for user ${request.userId}, purpose: ${request.purpose}, granted: ${request.granted}`);

    // Calculate expiry date if applicable
    const expiresAt = request.expiresAt || this.calculateExpiryDate(request.purpose);

    // Check if consent already exists
    const existingConsent = await prisma.consentRecord.findFirst({
      where: {
        userId: request.userId,
        tenantId: request.tenantId,
        purpose: request.purpose,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Create new consent record
    const consentRecord = await prisma.consentRecord.create({
      data: {
        userId: request.userId,
        tenantId: request.tenantId,
        purpose: request.purpose,
        granted: request.granted,
        grantedAt: request.granted ? new Date() : null,
        revokedAt: !request.granted ? new Date() : null,
        version: request.version,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        source: request.source,
        metadata: request.metadata as never, // Type assertion for JSON
        expiresAt,
      },
    });

    // Invalidate previous consent if this is a change
    if (existingConsent && existingConsent.granted !== request.granted) {
      await prisma.consentRecord.updateMany({
        where: {
          userId: request.userId,
          tenantId: request.tenantId,
          purpose: request.purpose,
          id: { not: consentRecord.id },
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    // Log consent action
    await auditLogger.logConsent(
      request.userId,
      request.granted ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
      request.purpose,
      request.tenantId,
      `Consent ${request.granted ? 'granted' : 'revoked'} via ${request.source}, version: ${request.version}`
    );

    // Process consent-dependent actions
    await this.processConsentActions(request);

    return {
      purpose: request.purpose,
      granted: request.granted,
      grantedAt: request.granted ? new Date() : undefined,
      revokedAt: !request.granted ? new Date() : undefined,
      version: request.version,
      source: request.source,
      expiresAt: expiresAt || undefined,
      needsRenewal: false,
    };
  }

  /**
   * Get user's consent status for all purposes
   */
  async getUserConsents(userId: string, tenantId: string): Promise<ConsentStatus[]> {
    const consents = await prisma.consentRecord.findMany({
      where: { userId, tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // Group by purpose and get latest consent for each
    const latestConsents = new Map<ConsentPurpose, typeof consents[0]>();
    
    for (const consent of consents) {
      if (!latestConsents.has(consent.purpose)) {
        latestConsents.set(consent.purpose, consent);
      }
    }

    // Convert to ConsentStatus array
    const consentStatuses: ConsentStatus[] = [];
    
    for (const [purpose, consent] of latestConsents) {
      const needsRenewal = consent.expiresAt ? consent.expiresAt < new Date() : false;
      
      consentStatuses.push({
        purpose,
        granted: consent.granted && !needsRenewal,
        grantedAt: consent.grantedAt || undefined,
        revokedAt: consent.revokedAt || undefined,
        version: consent.version,
        source: consent.source || 'unknown',
        expiresAt: consent.expiresAt || undefined,
        needsRenewal,
      });
    }

    return consentStatuses;
  }

  /**
   * Check if user has valid consent for a specific purpose
   */
  async hasValidConsent(
    userId: string, 
    tenantId: string, 
    purpose: ConsentPurpose
  ): Promise<boolean> {
    const consent = await prisma.consentRecord.findFirst({
      where: {
        userId,
        tenantId,
        purpose,
        granted: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!consent) return false;

    // Check if consent has expired
    if (consent.expiresAt && consent.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Bulk consent operations (for cookie banners)
   */
  async recordBulkConsent(
    userId: string,
    tenantId: string,
    consents: { purpose: ConsentPurpose; granted: boolean }[],
    version: string,
    source: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ConsentStatus[]> {
    const results: ConsentStatus[] = [];

    for (const consent of consents) {
      const status = await this.recordConsent({
        userId,
        tenantId,
        purpose: consent.purpose,
        granted: consent.granted,
        version,
        source: source as never,
        ipAddress,
        userAgent,
      });
      results.push(status);
    }

    return results;
  }

  /**
   * Withdraw consent for a specific purpose
   */
  async withdrawConsent(
    userId: string,
    tenantId: string,
    purpose: ConsentPurpose,
    source = 'settings'
  ): Promise<ConsentStatus> {
    const currentConsent = await prisma.consentRecord.findFirst({
      where: {
        userId,
        tenantId,
        purpose,
        granted: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentConsent) {
      throw new Error('No active consent found for this purpose');
    }

    return await this.recordConsent({
      userId,
      tenantId,
      purpose,
      granted: false,
      version: currentConsent.version,
      source: source as never,
    });
  }

  /**
   * Create consent banner configuration
   */
  async createConsentBanner(tenantId: string, config: Omit<ConsentBanner, 'id' | 'tenantId'>): Promise<ConsentBanner> {
    const bannerId = `banner_${tenantId}_${Date.now()}`;
    
    // In a real implementation, store in database
    const banner: ConsentBanner = {
      id: bannerId,
      tenantId,
      ...config,
    };

    console.log('Consent banner created:', banner);
    return banner;
  }

  /**
   * Get user consent dashboard
   */
  async getUserConsentDashboard(userId: string, tenantId: string): Promise<ConsentDashboard> {
    // Get user's current consents
    const consents = await this.getUserConsents(userId, tenantId);

    // Get processing activities that require consent
    const activities = await prisma.dataProcessingActivity.findMany({
      where: { tenantId, isActive: true },
    });

    const dataProcessingActivities = activities.map(activity => ({
      name: activity.name,
      purpose: activity.purpose,
      legalBasis: activity.legalBasis,
      consentRequired: activity.legalBasis === 'CONSENT',
      dataTypes: activity.dataCategories,
    }));

    // Determine which consents can be withdrawn
    const canWithdraw = consents
      .filter(consent => consent.granted && consent.purpose !== ConsentPurpose.ESSENTIAL)
      .map(consent => consent.purpose);

    // Check if user can download/delete data
    const downloadableData = true; // GDPR Article 15 & 20
    const deletionPossible = await this.canDeleteUserData(userId);

    return {
      userId,
      consents,
      canWithdraw,
      dataProcessingActivities,
      downloadableData,
      deletionPossible,
    };
  }

  /**
   * Generate consent report for compliance
   */
  async generateConsentReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: Record<string, unknown>;
    consentsByPurpose: Record<string, number>;
    withdrawalRate: number;
    complianceMetrics: Record<string, unknown>;
  }> {
    const consents = await prisma.consentRecord.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group by purpose
    const consentsByPurpose: Record<string, number> = {};
    const withdrawalsByPurpose: Record<string, number> = {};

    for (const consent of consents) {
      const purpose = consent.purpose;
      
      if (consent.granted) {
        consentsByPurpose[purpose] = (consentsByPurpose[purpose] || 0) + 1;
      } else {
        withdrawalsByPurpose[purpose] = (withdrawalsByPurpose[purpose] || 0) + 1;
      }
    }

    // Calculate withdrawal rate
    const totalConsents = Object.values(consentsByPurpose).reduce((sum, count) => sum + count, 0);
    const totalWithdrawals = Object.values(withdrawalsByPurpose).reduce((sum, count) => sum + count, 0);
    const withdrawalRate = totalConsents > 0 ? (totalWithdrawals / totalConsents) * 100 : 0;

    // Calculate compliance metrics
    const complianceMetrics = {
      averageConsentLifetime: await this.calculateAverageConsentLifetime(tenantId),
      expiredConsents: await this.getExpiredConsentsCount(tenantId),
      renewalRate: await this.calculateRenewalRate(),
      dataSubjectRequestsInfluence: await this.getDataSubjectRequestInfluence(tenantId, startDate, endDate),
    };

    return {
      summary: {
        totalConsentEvents: consents.length,
        totalConsentsGranted: totalConsents,
        totalWithdrawals: totalWithdrawals,
        uniqueUsers: new Set(consents.map(c => c.userId)).size,
        purposesCovered: Object.keys(consentsByPurpose).length,
      },
      consentsByPurpose,
      withdrawalRate,
      complianceMetrics,
    };
  }

  /**
   * Clean up expired consents (GDPR compliance job)
   */
  async cleanupExpiredConsents(tenantId?: string): Promise<{
    cleanedCount: number;
    tenantsProcessed: number;
  }> {
    const whereClause: Record<string, unknown> = {
      expiresAt: {
        lt: new Date(),
      },
    };

    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    // Find expired consents
    const expiredConsents = await prisma.consentRecord.findMany({
      where: whereClause,
    });

    // Mark as revoked instead of deleting (for audit purposes)
    await prisma.consentRecord.updateMany({
      where: whereClause,
      data: {
        granted: false,
        revokedAt: new Date(),
      },
    });

    // Log cleanup
    for (const consent of expiredConsents) {
      await auditLogger.logConsent(
        consent.userId,
        'CONSENT_EXPIRED',
        consent.purpose,
        consent.tenantId,
        `Consent expired and automatically revoked`
      );
    }

    return {
      cleanedCount: expiredConsents.length,
      tenantsProcessed: tenantId ? 1 : new Set(expiredConsents.map(c => c.tenantId)).size,
    };
  }

  /**
   * Validate consent according to GDPR requirements
   */
  validateGDPRConsent(consent: ConsentRequest): {
    isValid: boolean;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // GDPR Article 7 - Conditions for consent
    
    // 1. Freely given
    if (consent.purpose === ConsentPurpose.ESSENTIAL) {
      violations.push('Essential services cannot require consent as they are necessary for service provision');
    }

    // 2. Specific
    if (!Object.values(ConsentPurpose).includes(consent.purpose)) {
      violations.push('Consent purpose must be specific and clearly defined');
    }

    // 3. Informed
    if (!consent.version) {
      violations.push('Consent must reference a specific privacy policy version');
    }

    // 4. Unambiguous
    if (consent.granted === undefined) {
      violations.push('Consent must be unambiguously granted or denied');
    }

    // Check for consent bundling (violation of specificity)
    if (consent.metadata && typeof consent.metadata === 'object') {
      const bundledPurposes = Object.keys(consent.metadata).filter(key => 
        key.startsWith('purpose_') && key !== `purpose_${consent.purpose}`
      );
      
      if (bundledPurposes.length > 0) {
        violations.push('Consent bundling detected - each purpose must have separate consent');
      }
    }

    // Recommendations for better compliance
    if (!consent.ipAddress || !consent.userAgent) {
      recommendations.push('Include IP address and user agent for better consent evidence');
    }

    if (!consent.source) {
      recommendations.push('Specify the source/context where consent was obtained');
    }

    const isValid = violations.length === 0;

    return {
      isValid,
      violations,
      recommendations,
    };
  }

  /**
   * Private helper methods
   */
  private calculateExpiryDate(purpose: ConsentPurpose): Date | null {
    const retentionDays = this.consentRetentionPeriods[purpose];
    
    if (retentionDays === null) {
      return null; // No expiry
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + retentionDays);
    return expiryDate;
  }

  private async processConsentActions(request: ConsentRequest): Promise<void> {
    // Process actions based on consent purpose
    switch (request.purpose) {
      case ConsentPurpose.ANALYTICS:
        await this.toggleAnalyticsTracking(request.userId, request.tenantId, request.granted);
        break;
      
      case ConsentPurpose.MARKETING:
        await this.toggleMarketingCommunications(request.userId, request.tenantId, request.granted);
        break;
      
      case ConsentPurpose.PERSONALIZATION:
        await this.togglePersonalization(request.userId, request.tenantId, request.granted);
        break;
      
      case ConsentPurpose.COOKIES:
        await this.toggleNonEssentialCookies(request.userId, request.tenantId, request.granted);
        break;
    }
  }

  private async toggleAnalyticsTracking(userId: string, tenantId: string, enabled: boolean): Promise<void> {
    console.log(`${enabled ? 'Enabling' : 'Disabling'} analytics tracking for user ${userId} in tenant ${tenantId}`);
    // Implement analytics tracking toggle
  }

  private async toggleMarketingCommunications(userId: string, tenantId: string, enabled: boolean): Promise<void> {
    console.log(`${enabled ? 'Enabling' : 'Disabling'} marketing communications for user ${userId} in tenant ${tenantId}`);
    // Implement marketing communications toggle
  }

  private async togglePersonalization(userId: string, tenantId: string, enabled: boolean): Promise<void> {
    console.log(`${enabled ? 'Enabling' : 'Disabling'} personalization for user ${userId} in tenant ${tenantId}`);
    // Implement personalization toggle
  }

  private async toggleNonEssentialCookies(userId: string, tenantId: string, enabled: boolean): Promise<void> {
    console.log(`${enabled ? 'Enabling' : 'Disabling'} non-essential cookies for user ${userId} in tenant ${tenantId}`);
    // Implement cookie management
  }

  private async canDeleteUserData(userId: string): Promise<boolean> {
    // Check if user has any legal retention requirements
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });

    // Employee data has retention requirements
    if (user?.employee) {
      return false;
    }

    // Check for recent transactions
    const recentOrders = await prisma.order.findMany({
      where: { 
        customerId: userId,
        createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }, // 1 year
      },
    });

    return recentOrders.length === 0;
  }

  private async calculateAverageConsentLifetime(tenantId: string): Promise<number> {
    // Calculate average time between consent grant and revocation
    const revokedConsents = await prisma.consentRecord.findMany({
      where: {
        tenantId,
        granted: false,
        revokedAt: { not: null },
      },
    });

    if (revokedConsents.length === 0) return 0;

    const lifetimes = revokedConsents
      .filter(consent => consent.grantedAt && consent.revokedAt)
      .map(consent => {
        const granted = consent.grantedAt!;
        const revoked = consent.revokedAt!;
        return revoked.getTime() - granted.getTime();
      });

    const averageMs = lifetimes.reduce((sum, lifetime) => sum + lifetime, 0) / lifetimes.length;
    return Math.round(averageMs / (1000 * 60 * 60 * 24)); // Convert to days
  }

  private async getExpiredConsentsCount(tenantId: string): Promise<number> {
    return await prisma.consentRecord.count({
      where: {
        tenantId,
        expiresAt: { lt: new Date() },
        granted: true,
      },
    });
  }

  private async calculateRenewalRate(): Promise<number> {
    // Calculate percentage of users who renewed expired consents
    // Simplified implementation
    return 75; // Placeholder
  }

  private async getDataSubjectRequestInfluence(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Calculate how many consent changes were influenced by data subject requests
    const dataSubjectRequests = await prisma.dataSubjectRequest.findMany({
      where: {
        tenantId,
        requestedAt: { gte: startDate, lte: endDate },
        type: 'WITHDRAW_CONSENT',
      },
    });

    return dataSubjectRequests.length;
  }
}

// Export singleton instance
export const consentManager = ConsentManager.getInstance(); 