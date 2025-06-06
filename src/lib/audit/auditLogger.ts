import { prisma } from '@/lib/prisma';
import { AuditAction, AuditSeverity, AuditCategory, Prisma, AuditLog, DataBreach } from '@prisma/client';
import { NextRequest } from 'next/server';

export interface AuditLogData {
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity?: AuditSeverity;
  category?: AuditCategory;
  tenantId?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;
  
  private constructor() {}
  
  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          oldValues: data.oldValues as Prisma.InputJsonValue | undefined,
          newValues: data.newValues as Prisma.InputJsonValue | undefined,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          sessionId: data.sessionId,
          severity: data.severity || AuditSeverity.INFO,
          category: data.category || AuditCategory.DATA_ACCESS,
          tenantId: data.tenantId,
        },
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Log user authentication events
   */
  async logAuth(userId: string, action: 'LOGIN' | 'LOGOUT', request?: NextRequest, tenantId?: string): Promise<void> {
    await this.log({
      userId,
      action: action as AuditAction,
      resource: 'Authentication',
      details: `User ${action.toLowerCase()}`,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      severity: AuditSeverity.INFO,
      category: AuditCategory.AUTHENTICATION,
      tenantId,
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'READ' | 'EXPORT',
    tenantId?: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId,
      action: action as AuditAction,
      resource,
      resourceId,
      details: `${action} operation on ${resource}`,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      severity: action === 'EXPORT' ? AuditSeverity.MEDIUM : AuditSeverity.INFO,
      category: AuditCategory.DATA_ACCESS,
      tenantId,
    });
  }

  /**
   * Log data modification events
   */
  async logDataModification(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    tenantId?: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId,
      action: action as AuditAction,
      resource,
      resourceId,
      oldValues,
      newValues,
      details: `${action} operation on ${resource}`,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      severity: action === 'DELETE' ? AuditSeverity.HIGH : AuditSeverity.MEDIUM,
      category: AuditCategory.DATA_MODIFICATION,
      tenantId,
    });
  }

  /**
   * Log consent actions
   */
  async logConsent(
    userId: string,
    action: string,
    purpose: string,
    tenantId?: string,
    details?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: action as never, // Type assertion for audit action
      resource: 'ConsentRecord',
      details: details || `Consent ${action.toLowerCase()} for purpose: ${purpose}`,
      category: 'CONSENT_MANAGEMENT' as never,
      severity: 'INFO' as never,
      tenantId,
    });
  }

  /**
   * Log data subject requests
   */
  async logDataSubjectRequest(
    userId: string,
    requestType: string,
    requestId: string,
    status: string,
    tenantId?: string,
    details?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: 'DATA_REQUEST' as never,
      resource: 'DataSubjectRequest',
      resourceId: requestId,
      details: details || `${requestType} request ${status.toLowerCase()}`,
      category: 'PRIVACY_RIGHTS' as never,
      severity: status === 'COMPLETED' ? 'INFO' as never : 'MEDIUM' as never,
      tenantId,
    });
  }

  /**
   * Log privacy policy acceptance
   */
  async logPolicyAcceptance(
    userId: string,
    policyVersion: string,
    tenantId?: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.POLICY_ACCEPTED,
      resource: 'PrivacyPolicy',
      resourceId: policyVersion,
      details: `Accepted privacy policy version ${policyVersion}`,
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
      severity: AuditSeverity.MEDIUM,
      category: AuditCategory.CONSENT_MANAGEMENT,
      tenantId,
    });
  }

  /**
   * Log data anonymization
   */
  async logAnonymization(
    userId: string,
    resource: string,
    resourceId: string,
    performedBy: string,
    tenantId?: string
  ): Promise<void> {
    await this.log({
      userId: performedBy,
      action: AuditAction.ANONYMIZE,
      resource,
      resourceId,
      details: `Anonymized ${resource} for user ${userId}`,
      severity: AuditSeverity.HIGH,
      category: AuditCategory.PRIVACY_RIGHTS,
      tenantId,
    });
  }

  /**
   * Log data processing activities
   */
  async logDataProcessing(
    userId: string | null,
    activity: string,
    dataTypes: string[],
    legalBasis: string,
    tenantId?: string,
    purpose?: string
  ): Promise<void> {
    await this.log({
      userId: userId || undefined,
      action: 'READ' as never,
      resource: 'PersonalData',
      details: `Processing activity: ${activity}, Data types: ${dataTypes.join(', ')}, Legal basis: ${legalBasis}${purpose ? `, Purpose: ${purpose}` : ''}`,
      category: 'DATA_ACCESS' as never,
      severity: 'INFO' as never,
      tenantId,
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    userId: string | null,
    event: string,
    severity: 'LOW' | 'INFO' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    details: string,
    tenantId?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      userId: userId || undefined,
      action: event.toUpperCase().replace(' ', '_') as never,
      resource: 'Security',
      details,
      category: 'SYSTEM_ADMIN' as never,
      severity: severity as never,
      ipAddress,
      tenantId,
    });
  }

  /**
   * Log encryption key operations
   */
  async logKeyOperation(
    operation: string,
    keyPurpose: string,
    tenantId: string,
    details?: string
  ): Promise<void> {
    await this.log({
      userId: undefined, // System operation
      action: operation.toUpperCase() as never,
      resource: 'EncryptionKey',
      details: details || `Key operation: ${operation} for purpose: ${keyPurpose}`,
      category: 'SYSTEM_ADMIN' as never,
      severity: 'HIGH' as never,
      tenantId,
    });
  }

  /**
   * Log breach events
   */
  async logDataBreach(
    breachId: string,
    severity: string,
    affectedRecords: number,
    dataTypes: string[],
    tenantId: string,
    reportedBy?: string,
    details?: string
  ): Promise<void> {
    await this.log({
      userId: reportedBy || undefined,
      action: 'CREATE' as never,
      resource: 'DataBreach',
      resourceId: breachId,
      details: details || `Data breach detected. Severity: ${severity}, Records affected: ${affectedRecords}, Data types: ${dataTypes.join(', ')}`,
      category: 'SYSTEM_ADMIN' as never,
      severity: severity === 'CRITICAL' ? 'CRITICAL' as never : 'HIGH' as never,
      tenantId,
    });
  }

  /**
   * Get client IP address from request
   */
  private getClientIP(request?: NextRequest): string | undefined {
    if (!request) return undefined;
    
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      undefined
    );
  }

  /**
   * Get audit logs with filtering
   */
  async getLogs(filters: {
    tenantId?: string;
    userId?: string;
    resource?: string;
    action?: AuditAction;
    category?: AuditCategory;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {};
    
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.resource) where.resource = filters.resource;
    if (filters.action) where.action = filters.action;
    if (filters.category) where.category = filters.category;
    if (filters.severity) where.severity = filters.severity;
    
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) (where.timestamp as Record<string, unknown>).gte = filters.startDate;
      if (filters.endDate) (where.timestamp as Record<string, unknown>).lte = filters.endDate;
    }

    return await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });
  }

  /**
   * Get audit statistics
   */
  async getStats(tenantId?: string, startDate?: Date, endDate?: Date) {
    const where: Record<string, unknown> = {};
    if (tenantId) where.tenantId = tenantId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) (where.timestamp as Record<string, unknown>).gte = startDate;
      if (endDate) (where.timestamp as Record<string, unknown>).lte = endDate;
    }

    const [
      totalLogs,
      actionStats,
      categoryStats,
      severityStats,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),
      
      prisma.auditLog.groupBy({
        by: ['category'],
        where,
        _count: { category: true },
      }),
      
      prisma.auditLog.groupBy({
        by: ['severity'],
        where,
        _count: { severity: true },
      }),
    ]);

    return {
      totalLogs,
      actionStats,
      categoryStats,
      severityStats,
    };
  }

  /**
   * Generate audit trail for a specific user
   */
  async generateUserAuditTrail(
    userId: string,
    tenantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<unknown[]> {
    const whereClause: Prisma.AuditLogWhereInput = {
      userId,
      tenantId,
    };

    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = startDate;
      if (endDate) whereClause.timestamp.lte = endDate;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
    });

    return auditLogs.map(log => ({
      timestamp: log.timestamp,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      details: log.details,
      category: log.category,
      severity: log.severity,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    }));
  }

  /**
   * Generate compliance audit report
   */
  async generateComplianceReport(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: Record<string, unknown>;
    consentActivity: unknown[];
    dataRequests: unknown[];
    securityEvents: unknown[];
    breaches: unknown[];
  }> {
    // Get all relevant audit logs for the period
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Categorize logs
    const consentLogs = auditLogs.filter(log => log.category === 'CONSENT_MANAGEMENT');
    const dataRequestLogs = auditLogs.filter(log => log.category === 'PRIVACY_RIGHTS');
    const securityLogs = auditLogs.filter(log => log.category === 'SYSTEM_ADMIN');

    // Get data breaches for the period
    const breaches = await prisma.dataBreach.findMany({
      where: {
        tenantId,
        detectedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Generate summary statistics
    const summary = {
      totalAuditEvents: auditLogs.length,
      consentEvents: consentLogs.length,
      dataSubjectRequests: dataRequestLogs.length,
      securityEvents: securityLogs.length,
      dataBreaches: breaches.length,
      criticalEvents: auditLogs.filter(log => log.severity === 'CRITICAL').length,
      highSeverityEvents: auditLogs.filter(log => log.severity === 'HIGH').length,
      averageResponseTime: this.calculateAverageResponseTime(),
      complianceScore: this.calculateComplianceScore(auditLogs, breaches),
    };

    return {
      summary,
      consentActivity: consentLogs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        details: log.details,
        userId: log.userId,
      })),
      dataRequests: dataRequestLogs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        details: log.details,
        userId: log.userId,
        resourceId: log.resourceId,
      })),
      securityEvents: securityLogs.map(log => ({
        timestamp: log.timestamp,
        action: log.action,
        severity: log.severity,
        details: log.details,
        ipAddress: log.ipAddress,
      })),
      breaches: breaches.map(breach => ({
        id: breach.id,
        title: breach.title,
        severity: breach.severity,
        detectedAt: breach.detectedAt,
        status: breach.status,
        affectedRecords: breach.affectedRecords,
        dataTypes: breach.dataTypes,
      })),
    };
  }

  /**
   * Helper methods
   */
  private calculateAverageResponseTime(): number {
    // Simplified calculation - would need to correlate with actual request completion times
    return 24; // Average hours - placeholder
  }

  private calculateComplianceScore(auditLogs: AuditLog[], breaches: DataBreach[]): number {
    // Simplified scoring algorithm
    let score = 100;
    
    // Deduct points for critical events
    score -= auditLogs.filter(log => log.severity === 'CRITICAL').length * 10;
    
    // Deduct points for data breaches
    score -= breaches.length * 20;
    
    // Deduct points for high severity events
    score -= auditLogs.filter(log => log.severity === 'HIGH').length * 5;
    
    return Math.max(0, Math.min(100, score));
  }
}

// Export singleton instance
export const auditLogger = AuditLogger.getInstance(); 