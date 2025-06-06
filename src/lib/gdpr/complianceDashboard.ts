import { DPIAAssessment, DPIAReport, dpiaManager } from './dpiaManager';
import { consentManager } from './consentManager';
import { retentionManager } from './retentionManager';
import { auditLogger } from '@/lib/audit/auditLogger';
import { prisma } from '@/lib/prisma';

export interface ComplianceScore {
  overall: number;
  breakdown: {
    dataProtection: number;
    consentManagement: number;
    retentionPolicies: number;
    subjectRights: number;
    riskAssessment: number;
    auditTrail: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
  criticalIssues: string[];
}

export interface ComplianceMetrics {
  dataSubjectRequests: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    averageResponseTime: number;
  };
  consentMetrics: {
    totalConsents: number;
    activeConsents: number;
    withdrawalRate: number;
    expiredConsents: number;
    complianceRate: number;
  };
  dpiaMetrics: {
    totalAssessments: number;
    highRiskActivities: number;
    overdueDPIAs: number;
    complianceRate: number;
  };
  retentionMetrics: {
    activePolicies: number;
    overdueRecords: number;
    dataTypesManaged: number;
    lastExecutionTime: Date | null;
  };
  breachMetrics: {
    totalBreaches: number;
    openBreaches: number;
    averageResponseTime: number;
    notificationCompliance: number;
  };
}

export interface ComplianceStatus {
  status: 'COMPLIANT' | 'NEEDS_ATTENTION' | 'NON_COMPLIANT' | 'CRITICAL';
  lastAssessment: Date;
  nextReview: Date;
  certifications: string[];
  regulations: string[];
}

export interface ComplianceDashboard {
  tenantId: string;
  score: ComplianceScore;
  metrics: ComplianceMetrics;
  status: ComplianceStatus;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
    severity: string;
    actionRequired: boolean;
  }>;
  upcomingTasks: Array<{
    task: string;
    dueDate: Date;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: string;
  }>;
  alerts: Array<{
    level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    message: string;
    timestamp: Date;
    action?: string;
  }>;
}

export interface ConsentReport {
  summary: {
    totalConsentEvents?: number;
    totalConsentsGranted?: number;
    totalWithdrawals?: number;
    uniqueUsers?: number;
    purposesCovered?: number;
  };
  consentsByPurpose: Record<string, number>;
  withdrawalRate: number;
  complianceMetrics: {
    averageConsentLifetime?: number;
    expiredConsents?: number;
    renewalRate?: number;
    dataSubjectRequestsInfluence?: number;
  };
}

export interface RetentionReport {
  summary: {
    totalPolicies?: number;
    activePolicies?: number;
    dataTypesManaged?: number;
    totalRecordsManaged?: number;
    recordsDueDeletion?: number;
  };
  policies: Array<{
    id: string;
    name: string;
    lastExecuted?: Date;
  }>;
  inventory: Array<unknown>;
  upcomingDeletions: Array<unknown>;
  complianceStatus: string;
}

export class ComplianceDashboardManager {
  private static instance: ComplianceDashboardManager;

  private constructor() {}

  public static getInstance(): ComplianceDashboardManager {
    if (!ComplianceDashboardManager.instance) {
      ComplianceDashboardManager.instance = new ComplianceDashboardManager();
    }
    return ComplianceDashboardManager.instance;
  }

  /**
   * Generate comprehensive compliance dashboard for a tenant
   */
  async generateDashboard(tenantId: string): Promise<ComplianceDashboard> {
    console.log(`Generating compliance dashboard for tenant: ${tenantId}`);

    // Gather data from all GDPR systems
    const [
      score,
      metrics,
      status,
      recentActivity,
      upcomingTasks,
      alerts
    ] = await Promise.all([
      this.calculateComplianceScore(tenantId),
      this.gatherComplianceMetrics(tenantId),
      this.getComplianceStatus(tenantId),
      this.getRecentActivity(tenantId),
      this.getUpcomingTasks(tenantId),
      this.getComplianceAlerts(tenantId),
    ]);

    return {
      tenantId,
      score,
      metrics,
      status,
      recentActivity,
      upcomingTasks,
      alerts,
    };
  }

  /**
   * Calculate overall compliance score
   */
  private async calculateComplianceScore(tenantId: string): Promise<ComplianceScore> {
    const [
      dataProtectionScore,
      consentScore,
      retentionScore,
      subjectRightsScore,
      riskScore,
      auditScore
    ] = await Promise.all([
      this.assessDataProtection(tenantId),
      this.assessConsentManagement(tenantId),
      this.assessRetentionPolicies(tenantId),
      this.assessSubjectRights(tenantId),
      this.assessRiskManagement(tenantId),
      this.assessAuditTrail(tenantId),
    ]);

    const breakdown = {
      dataProtection: dataProtectionScore,
      consentManagement: consentScore,
      retentionPolicies: retentionScore,
      subjectRights: subjectRightsScore,
      riskAssessment: riskScore,
      auditTrail: auditScore,
    };

    // Calculate weighted overall score
    const weights = {
      dataProtection: 0.2,
      consentManagement: 0.2,
      retentionPolicies: 0.15,
      subjectRights: 0.15,
      riskAssessment: 0.2,
      auditTrail: 0.1,
    };

    const overall = Math.round(
      Object.entries(breakdown).reduce((sum, [key, score]) => {
        return sum + score * weights[key as keyof typeof weights];
      }, 0)
    );

    const riskLevel = this.calculateRiskLevel(overall);
    const { recommendations, criticalIssues } = this.generateRecommendations(breakdown, riskLevel);

    return {
      overall,
      breakdown,
      riskLevel,
      recommendations,
      criticalIssues,
    };
  }

  /**
   * Gather metrics from all compliance systems
   */
  private async gatherComplianceMetrics(tenantId: string): Promise<ComplianceMetrics> {
    // Data Subject Requests
    const dataSubjectRequests = await this.getDataSubjectRequestMetrics(tenantId);
    
    // Consent Management
    const consentReport = await consentManager.generateConsentReport(
      tenantId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      new Date()
    );

    const consentMetrics = {
      totalConsents: (consentReport.summary.totalConsentsGranted as number) || 0,
      activeConsents: Object.values(consentReport.consentsByPurpose).reduce((sum: number, count: number) => sum + count, 0),
      withdrawalRate: consentReport.withdrawalRate,
      expiredConsents: (consentReport.complianceMetrics.expiredConsents as number) || 0,
      complianceRate: this.calculateConsentComplianceRate(consentReport),
    };

    // DPIA Management
    const dpiaReport = await dpiaManager.generateDPIAReport(tenantId);
    const dpiaMetrics = {
      totalAssessments: dpiaReport.assessments.length,
      highRiskActivities: dpiaReport.assessments.filter(a => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL').length,
      overdueDPIAs: dpiaReport.assessments.filter(a => a.nextReview < new Date()).length,
      complianceRate: this.calculateDPIAComplianceRate(dpiaReport),
    };

    // Retention Management
    const retentionReport = await retentionManager.generateRetentionReport(tenantId);
    const retentionMetrics = {
      activePolicies: (retentionReport.summary.activePolicies as number) || 0,
      overdueRecords: (retentionReport.summary.recordsDueDeletion as number) || 0,
      dataTypesManaged: (retentionReport.summary.dataTypesManaged as number) || 0,
      lastExecutionTime: this.getLastRetentionExecution(retentionReport),
    };

    // Data Breach Management
    const breachMetrics = await this.getBreachMetrics(tenantId);

    return {
      dataSubjectRequests,
      consentMetrics,
      dpiaMetrics,
      retentionMetrics,
      breachMetrics,
    };
  }

  /**
   * Get compliance status
   */
  private async getComplianceStatus(tenantId: string): Promise<ComplianceStatus> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Determine overall status based on various factors
    const score = await this.calculateComplianceScore(tenantId);
    let status: ComplianceStatus['status'] = 'COMPLIANT';

    if (score.overall < 50 || score.riskLevel === 'CRITICAL') {
      status = 'CRITICAL';
    } else if (score.overall < 70 || score.riskLevel === 'HIGH') {
      status = 'NON_COMPLIANT';
    } else if (score.overall < 85 || score.criticalIssues.length > 0) {
      status = 'NEEDS_ATTENTION';
    }

    const lastAssessment = new Date();
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + 3); // Quarterly reviews

    return {
      status,
      lastAssessment,
      nextReview,
      certifications: ['ISO 27001', 'SOC 2 Type II'], // Example certifications
      regulations: ['GDPR', 'CCPA', 'ISO 27001'], // Applicable regulations
    };
  }

  /**
   * Get recent compliance activity
   */
  private async getRecentActivity(tenantId: string): Promise<ComplianceDashboard['recentActivity']> {
    const recentLogs = await auditLogger.getLogs({
      tenantId,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      limit: 20,
    });

    return recentLogs.map(log => ({
      type: log.action,
      description: log.details || `${log.action} on ${log.resource}`,
      timestamp: log.timestamp,
      severity: log.severity,
      actionRequired: log.severity === 'HIGH' || log.severity === 'CRITICAL',
    }));
  }

  /**
   * Get upcoming compliance tasks
   */
  private async getUpcomingTasks(tenantId: string): Promise<ComplianceDashboard['upcomingTasks']> {
    const tasks: ComplianceDashboard['upcomingTasks'] = [];

    // Check for upcoming DPIA reviews
    const dpias = await dpiaManager.getTenantDPIAs(tenantId);
    for (const dpia of dpias) {
      if (dpia.nextReview <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) { // Next 30 days
        tasks.push({
          task: `DPIA Review: ${dpia.id}`,
          dueDate: dpia.nextReview,
          priority: dpia.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM',
          category: 'Risk Assessment',
        });
      }
    }

    // Check for overdue data subject requests
    const overdueRequests = await prisma.dataSubjectRequest.findMany({
      where: {
        tenantId,
        status: 'PENDING',
        requestedAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Older than 30 days
        },
      },
    });

    for (const request of overdueRequests) {
      tasks.push({
        task: `Overdue Data Subject Request: ${request.type}`,
        dueDate: new Date(request.requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000),
        priority: 'HIGH',
        category: 'Subject Rights',
      });
    }

    // Check retention policy execution
    const retentionPolicies = await retentionManager.getTenantRetentionPolicies(tenantId);
    for (const policy of retentionPolicies) {
      if (policy.nextExecution && policy.nextExecution <= new Date()) {
        tasks.push({
          task: `Execute Retention Policy: ${policy.name}`,
          dueDate: policy.nextExecution,
          priority: 'MEDIUM',
          category: 'Data Retention',
        });
      }
    }

    return tasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Get compliance alerts
   */
  private async getComplianceAlerts(tenantId: string): Promise<ComplianceDashboard['alerts']> {
    const alerts: ComplianceDashboard['alerts'] = [];

    // Check for critical compliance issues
    const score = await this.calculateComplianceScore(tenantId);
    
    if (score.riskLevel === 'CRITICAL') {
      alerts.push({
        level: 'CRITICAL',
        message: 'Critical compliance issues detected. Immediate action required.',
        timestamp: new Date(),
        action: 'Review critical issues and implement remediation plan',
      });
    }

    if (score.criticalIssues.length > 0) {
      alerts.push({
        level: 'ERROR',
        message: `${score.criticalIssues.length} critical compliance issues found`,
        timestamp: new Date(),
        action: 'Address critical issues immediately',
      });
    }

    // Check for expired consents
    const expiredConsents = await prisma.consentRecord.count({
      where: {
        tenantId,
        expiresAt: { lt: new Date() },
        granted: true,
      },
    });

    if (expiredConsents > 0) {
      alerts.push({
        level: 'WARNING',
        message: `${expiredConsents} expired consents require renewal`,
        timestamp: new Date(),
        action: 'Contact affected users for consent renewal',
      });
    }

    // Check for data breaches requiring notification
    const unnotifiedBreaches = await prisma.dataBreach.count({
      where: {
        tenantId,
        authoritiesNotified: false,
        severity: { in: ['HIGH', 'CRITICAL'] },
        detectedAt: { gte: new Date(Date.now() - 72 * 60 * 60 * 1000) }, // Last 72 hours
      },
    });

    if (unnotifiedBreaches > 0) {
      alerts.push({
        level: 'CRITICAL',
        message: `${unnotifiedBreaches} high-severity breaches require authority notification`,
        timestamp: new Date(),
        action: 'Notify data protection authorities within 72 hours',
      });
    }

    return alerts.sort((a, b) => {
      const levelPriority = { CRITICAL: 4, ERROR: 3, WARNING: 2, INFO: 1 };
      return levelPriority[b.level] - levelPriority[a.level];
    });
  }

  /**
   * Assessment methods for different compliance areas
   */
  private async assessDataProtection(tenantId: string): Promise<number> {
    // Check encryption, access controls, data minimization
    let score = 100;

    // Check if tenant has encryption initialized
    // (In real implementation, check actual encryption status)
    score -= 0; // Assume encryption is properly implemented

    // Check for data processing activities documentation
    const activities = await prisma.dataProcessingActivity.count({
      where: { tenantId, isActive: true },
    });

    if (activities < 5) {
      score -= 20; // Deduct points for insufficient documentation
    }

    return Math.max(0, score);
  }

  private async assessConsentManagement(tenantId: string): Promise<number> {
    const consentReport = await consentManager.generateConsentReport(
      tenantId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );

    let score = 100;

    // Check withdrawal rate (high rate may indicate issues)
    if (consentReport.withdrawalRate > 30) {
      score -= 30;
    } else if (consentReport.withdrawalRate > 15) {
      score -= 15;
    }

    // Check for expired consents
    const expiredConsents = (consentReport.complianceMetrics.expiredConsents as number) || 0;
    if (expiredConsents > 100) {
      score -= 25;
    } else if (expiredConsents > 50) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  private async assessRetentionPolicies(tenantId: string): Promise<number> {
    const retentionReport = await retentionManager.generateRetentionReport(tenantId);
    
    let score = 100;

    // Check coverage
    const managedTypes = (retentionReport.summary.dataTypesManaged as number) || 0;
    if (managedTypes < 5) {
      score -= 40;
    } else if (managedTypes < 10) {
      score -= 20;
    }

    // Check overdue records
    const overdueRecords = (retentionReport.summary.recordsDueDeletion as number) || 0;
    if (overdueRecords > 1000) {
      score -= 30;
    } else if (overdueRecords > 100) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  private async assessSubjectRights(tenantId: string): Promise<number> {
    const metrics = await this.getDataSubjectRequestMetrics(tenantId);
    
    let score = 100;

    // Check response times
    if (metrics.averageResponseTime > 30) { // Days
      score -= 40;
    } else if (metrics.averageResponseTime > 15) {
      score -= 20;
    }

    // Check overdue requests
    if (metrics.overdue > 5) {
      score -= 30;
    } else if (metrics.overdue > 0) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  private async assessRiskManagement(tenantId: string): Promise<number> {
    const dpiaReport = await dpiaManager.generateDPIAReport(tenantId);
    
    let score = 100;

    // Check for high-risk activities without recent DPIA
    const highRiskCount = dpiaReport.assessments.filter(a => 
      a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL'
    ).length;

    if (highRiskCount > 5) {
      score -= 40;
    } else if (highRiskCount > 2) {
      score -= 20;
    }

    // Check overall compliance status
    if (dpiaReport.complianceStatus === 'NON_COMPLIANT') {
      score -= 50;
    } else if (dpiaReport.complianceStatus === 'NEEDS_REVIEW') {
      score -= 25;
    }

    return Math.max(0, score);
  }

  private async assessAuditTrail(tenantId: string): Promise<number> {
    const auditStats = await auditLogger.getStats(
      tenantId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );

    let score = 100;

    // Check audit coverage
    if (auditStats.totalLogs < 100) {
      score -= 30; // Too few audit events may indicate incomplete logging
    }

    // Check for critical events
    const criticalEvents = auditStats.severityStats.find(s => s.severity === 'CRITICAL')?._count.severity || 0;
    if (criticalEvents > 10) {
      score -= 25;
    }

    return Math.max(0, score);
  }

  /**
   * Helper methods
   */
  private calculateRiskLevel(overall: number): ComplianceScore['riskLevel'] {
    if (overall < 50) return 'CRITICAL';
    if (overall < 70) return 'HIGH';
    if (overall < 85) return 'MEDIUM';
    return 'LOW';
  }

  private generateRecommendations(
    breakdown: ComplianceScore['breakdown'],
    riskLevel: ComplianceScore['riskLevel']
  ): { recommendations: string[]; criticalIssues: string[] } {
    const recommendations: string[] = [];
    const criticalIssues: string[] = [];

    // Analyze each area
    Object.entries(breakdown).forEach(([area, score]) => {
      if (score < 50) {
        criticalIssues.push(`Critical issues in ${area.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      } else if (score < 70) {
        recommendations.push(`Improve ${area.replace(/([A-Z])/g, ' $1').toLowerCase()} practices`);
      }
    });

    // Add general recommendations based on risk level
    if (riskLevel === 'CRITICAL') {
      recommendations.unshift('Immediate compliance review and remediation required');
      recommendations.push('Consider engaging external compliance consultant');
    } else if (riskLevel === 'HIGH') {
      recommendations.push('Conduct comprehensive compliance audit');
      recommendations.push('Implement additional monitoring and controls');
    }

    return { recommendations, criticalIssues };
  }

  private async getDataSubjectRequestMetrics(tenantId: string): Promise<ComplianceMetrics['dataSubjectRequests']> {
    const [total, pending, completed, overdue] = await Promise.all([
      prisma.dataSubjectRequest.count({ where: { tenantId } }),
      prisma.dataSubjectRequest.count({ where: { tenantId, status: 'PENDING' } }),
      prisma.dataSubjectRequest.count({ where: { tenantId, status: 'APPROVED' } }),
      prisma.dataSubjectRequest.count({
        where: {
          tenantId,
          status: 'PENDING',
          requestedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Calculate average response time (simplified)
    const avgResponseTime = completed > 0 ? 15 : 0; // Placeholder calculation

    return {
      total,
      pending,
      completed,
      overdue,
      averageResponseTime: avgResponseTime,
    };
  }

  private calculateConsentComplianceRate(consentReport: ConsentReport): number {
    const total = consentReport.summary.totalConsentEvents || 0;
    const expired = consentReport.complianceMetrics.expiredConsents || 0;
    
    if (total === 0) return 100;
    return Math.round(((total - expired) / total) * 100);
  }

  private calculateDPIAComplianceRate(dpiaReport: DPIAReport): number {
    const total = dpiaReport.assessments.length;
    const compliant = dpiaReport.assessments.filter((a: DPIAAssessment) => a.complianceStatus === 'COMPLIANT').length;
    
    if (total === 0) return 100;
    return Math.round((compliant / total) * 100);
  }

  private getLastRetentionExecution(retentionReport: RetentionReport): Date | null {
    // Extract last execution time from retention report
    const policies = retentionReport.policies || [];
    const lastExecution = policies
      .map((p: { lastExecuted?: Date }) => p.lastExecuted)
      .filter((date: Date | undefined): date is Date => date !== undefined)
      .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0];
    
    return lastExecution || null;
  }

  private async getBreachMetrics(tenantId: string): Promise<ComplianceMetrics['breachMetrics']> {
    const [total, open] = await Promise.all([
      prisma.dataBreach.count({ where: { tenantId } }),
      prisma.dataBreach.count({ 
        where: { 
          tenantId, 
          status: { not: 'RESOLVED' } 
        } 
      }),
    ]);

    return {
      totalBreaches: total,
      openBreaches: open,
      averageResponseTime: 24, // Placeholder - would calculate from actual data
      notificationCompliance: 95, // Placeholder - percentage of breaches notified within 72h
    };
  }
}

// Export singleton instance
export const complianceDashboard = ComplianceDashboardManager.getInstance(); 