import { prisma } from '@/lib/prisma';
import { auditLogger } from '@/lib/audit/auditLogger';

export interface RetentionPolicy {
  id: string;
  name: string;
  description?: string;
  dataType: string;
  retentionDays: number;
  autoDelete: boolean;
  isActive: boolean;
  conditions?: Record<string, unknown>;
  lastExecuted?: Date;
  nextExecution?: Date;
  tenantId?: string;
}

export interface RetentionJob {
  id: string;
  policyId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: Date;
  completedAt?: Date;
  recordsProcessed: number;
  recordsDeleted: number;
  recordsAnonymized: number;
  errors: string[];
  tenantId?: string;
}

export interface DataInventory {
  dataType: string;
  totalRecords: number;
  oldestRecord: Date;
  newestRecord: Date;
  retentionPolicy?: string;
  dueDeletionCount: number;
  scheduledDeletion?: Date;
}

export class RetentionManager {
  private static instance: RetentionManager;
  
  // Default retention periods per data type (in days)
  private readonly defaultRetentionPeriods = {
    'User': 2555, // 7 years for user data (legal compliance)
    'FormSubmission': 1095, // 3 years for form submissions
    'AuditLog': 2555, // 7 years for audit logs
    'ConsentRecord': 2555, // 7 years for consent records
    'Employee': 2555, // 7 years for employee data
    'Order': 2555, // 7 years for transaction data (tax compliance)
    'Payment': 2555, // 7 years for payment records
    'CustomerAddress': 1095, // 3 years for address data
    'Session': 90, // 3 months for session data
    'Document': 1825, // 5 years for documents
    'Media': 1095, // 3 years for media files
    'Notification': 365, // 1 year for notifications
    'Review': 1825, // 5 years for reviews (business records)
    'Booking': 1095, // 3 years for booking data
  };

  private constructor() {}

  public static getInstance(): RetentionManager {
    if (!RetentionManager.instance) {
      RetentionManager.instance = new RetentionManager();
    }
    return RetentionManager.instance;
  }

  /**
   * Initialize default retention policies for a tenant
   */
  async initializeTenantPolicies(tenantId: string): Promise<RetentionPolicy[]> {
    console.log(`Initializing retention policies for tenant: ${tenantId}`);
    
    const policies: RetentionPolicy[] = [];
    
    for (const [dataType, retentionDays] of Object.entries(this.defaultRetentionPeriods)) {
      const policy = await this.createRetentionPolicy({
        name: `${dataType} Retention Policy`,
        description: `Automatic retention policy for ${dataType} data`,
        dataType,
        retentionDays,
        autoDelete: true,
        isActive: true,
        tenantId,
      });
      
      policies.push(policy);
    }
    
    console.log(`Created ${policies.length} retention policies for tenant ${tenantId}`);
    return policies;
  }

  /**
   * Create a new retention policy
   */
  async createRetentionPolicy(
    data: Omit<RetentionPolicy, 'id' | 'lastExecuted' | 'nextExecution'>
  ): Promise<RetentionPolicy> {
    const nextExecution = this.calculateNextExecution();
    
    const policy = await prisma.dataRetentionPolicy.create({
      data: {
        name: data.name,
        description: data.description,
        dataType: data.dataType,
        retentionDays: data.retentionDays,
        autoDelete: data.autoDelete,
        isActive: data.isActive,
        conditions: data.conditions as never, // Type assertion for JSON
        nextExecution,
        tenantId: data.tenantId,
      },
    });

    await auditLogger.log({
      userId: undefined, // System operation
      action: 'CREATE',
      resource: 'DataRetentionPolicy',
      resourceId: policy.id,
      details: `Created retention policy: ${data.name} for ${data.dataType}`,
      category: 'SYSTEM_ADMIN',
      severity: 'MEDIUM',
      tenantId: data.tenantId,
    });

    return {
      id: policy.id,
      name: policy.name,
      description: policy.description || undefined,
      dataType: policy.dataType,
      retentionDays: policy.retentionDays,
      autoDelete: policy.autoDelete,
      isActive: policy.isActive,
      conditions: policy.conditions as Record<string, unknown> || undefined,
      lastExecuted: policy.lastExecuted || undefined,
      nextExecution: policy.nextExecution || undefined,
      tenantId: policy.tenantId || undefined,
    };
  }

  /**
   * Execute retention policies
   */
  async executeRetentionPolicies(tenantId?: string): Promise<RetentionJob[]> {
    console.log(`Executing retention policies${tenantId ? ` for tenant ${tenantId}` : ' globally'}`);
    
    const whereClause: Record<string, unknown> = {
      isActive: true,
      nextExecution: {
        lte: new Date(),
      },
    };
    
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const policies = await prisma.dataRetentionPolicy.findMany({
      where: whereClause,
    });

    const jobs: RetentionJob[] = [];
    
    for (const policy of policies) {
      const job = await this.executeRetentionPolicy(policy.id);
      jobs.push(job);
    }
    
    return jobs;
  }

  /**
   * Execute a specific retention policy
   */
  async executeRetentionPolicy(policyId: string): Promise<RetentionJob> {
    const policy = await prisma.dataRetentionPolicy.findUnique({
      where: { id: policyId },
    });

    if (!policy) {
      throw new Error(`Retention policy ${policyId} not found`);
    }

    const job: RetentionJob = {
      id: `job_${policyId}_${Date.now()}`,
      policyId,
      status: 'RUNNING',
      startedAt: new Date(),
      recordsProcessed: 0,
      recordsDeleted: 0,
      recordsAnonymized: 0,
      errors: [],
      tenantId: policy.tenantId || undefined,
    };

    console.log(`Executing retention policy: ${policy.name} for ${policy.dataType}`);

    try {
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

      // Execute retention for specific data type
      const result = await this.executeDataTypeRetention(
        policy.dataType,
        cutoffDate,
        policy.autoDelete,
        policy.tenantId,
        policy.conditions as Record<string, unknown>
      );

      job.recordsProcessed = result.processed;
      job.recordsDeleted = result.deleted;
      job.recordsAnonymized = result.anonymized;
      job.errors = result.errors;
      job.status = 'COMPLETED';
      job.completedAt = new Date();

      // Update policy execution info
      await prisma.dataRetentionPolicy.update({
        where: { id: policyId },
        data: {
          lastExecuted: new Date(),
          nextExecution: this.calculateNextExecution(),
        },
      });

      // Log retention execution
      await auditLogger.log({
        userId: undefined,
        action: 'DELETE',
        resource: policy.dataType,
        details: `Retention policy executed: ${result.deleted} deleted, ${result.anonymized} anonymized, ${result.processed} processed`,
        category: 'SYSTEM_ADMIN',
        severity: 'HIGH',
        tenantId: policy.tenantId || undefined,
      });

    } catch (error) {
      job.status = 'FAILED';
      job.errors.push(error instanceof Error ? error.message : 'Unknown error');
      job.completedAt = new Date();
      
      console.error(`Retention policy execution failed:`, error);
    }

    return job;
  }

  /**
   * Execute retention for a specific data type
   */
  private async executeDataTypeRetention(
    dataType: string,
    cutoffDate: Date,
    autoDelete: boolean,
    tenantId: string | null,
    conditions?: Record<string, unknown>
  ): Promise<{
    processed: number;
    deleted: number;
    anonymized: number;
    errors: string[];
  }> {
    const result = {
      processed: 0,
      deleted: 0,
      anonymized: 0,
      errors: [],
    };

    try {
      switch (dataType) {
        case 'User':
          const userResult = await this.retainUserData(cutoffDate, autoDelete, tenantId, conditions);
          Object.assign(result, userResult);
          break;
          
        case 'AuditLog':
          const auditResult = await this.retainAuditLogs(cutoffDate, autoDelete, tenantId);
          Object.assign(result, auditResult);
          break;
          
        case 'Session':
          const sessionResult = await this.retainSessionData(cutoffDate, autoDelete);
          Object.assign(result, sessionResult);
          break;
          
        case 'ConsentRecord':
          const consentResult = await this.retainConsentRecords(cutoffDate, autoDelete, tenantId);
          Object.assign(result, consentResult);
          break;
          
        case 'FormSubmission':
          const formResult = await this.retainFormSubmissions(cutoffDate, autoDelete, tenantId);
          Object.assign(result, formResult);
          break;
          
        case 'Notification':
          const notificationResult = await this.retainNotifications(cutoffDate, autoDelete, tenantId);
          Object.assign(result, notificationResult);
          break;
          
        default:
          result.errors.push(`Unsupported data type: ${dataType}` as never);
      }
    } catch (error) {
      result.errors.push(`Error processing ${dataType}: ${error instanceof Error ? error.message : 'Unknown error'}` as never);
    }

    return result;
  }

  /**
   * Retain user data (anonymize instead of delete for referential integrity)
   */
  private async retainUserData(
    cutoffDate: Date,
    autoDelete: boolean,
    tenantId: string | null,
    conditions?: Record<string, unknown>
  ): Promise<{ processed: number; deleted: number; anonymized: number; errors: string[] }> {
    const whereClause: Record<string, unknown> = {
      updatedAt: { lt: cutoffDate },
      isActive: false, // Only process inactive users
    };
    
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    // Apply additional conditions
    if (conditions) {
      Object.assign(whereClause, conditions);
    }

    const usersToProcess = await prisma.user.findMany({
      where: whereClause,
      include: { employee: true },
    });

    const result = {
      processed: usersToProcess.length,
      deleted: 0,
      anonymized: 0,
      errors: [],
    };

    if (!autoDelete) {
      return result;
    }

    for (const user of usersToProcess) {
      try {
        // Check if user can be deleted (legal retention requirements)
        if (user.employee) {
          // Employee data has longer retention requirements
          continue;
        }

        // Anonymize user data instead of deleting
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email: `deleted-${Date.now()}@deleted.local`,
            firstName: 'DELETED',
            lastName: 'USER',
            phoneNumber: null,
            bio: null,
            profileImageUrl: null,
          },
        });

        result.anonymized++;

        await auditLogger.logAnonymization(
          user.id,
          'User',
          user.id,
          'SYSTEM',
          tenantId || undefined
        );

      } catch (error) {
        result.errors.push(`Error processing user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}` as never);
      }
    }

    return result;
  }

  /**
   * Retain audit logs
   */
  private async retainAuditLogs(
    cutoffDate: Date,
    autoDelete: boolean,
    tenantId: string | null
  ): Promise<{ processed: number; deleted: number; anonymized: number; errors: string[] }> {
    const whereClause: Record<string, unknown> = {
      timestamp: { lt: cutoffDate },
      severity: { in: ['LOW', 'INFO'] }, // Only delete low-priority logs
    };
    
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const logsToProcess = await prisma.auditLog.findMany({
      where: whereClause,
    });

    const result = {
      processed: logsToProcess.length,
      deleted: 0,
      anonymized: 0,
      errors: [],
    };

    if (!autoDelete || logsToProcess.length === 0) {
      return result;
    }

    try {
      // Delete old audit logs
      await prisma.auditLog.deleteMany({
        where: whereClause,
      });

      result.deleted = logsToProcess.length;

    } catch (error) {
      result.errors.push(`Error deleting audit logs: ${error instanceof Error ? error.message : 'Unknown error'}` as never);
    }

    return result;
  }

  /**
   * Retain session data
   */
  private async retainSessionData(
    cutoffDate: Date,
    autoDelete: boolean
  ): Promise<{ processed: number; deleted: number; anonymized: number; errors: string[] }> {
    const sessionsToProcess = await prisma.session.findMany({
      where: {
        expires: { lt: cutoffDate },
      },
    });

    const result = {
      processed: sessionsToProcess.length,
      deleted: 0,
      anonymized: 0,
      errors: [],
    };

    if (!autoDelete || sessionsToProcess.length === 0) {
      return result;
    }

    try {
      await prisma.session.deleteMany({
        where: {
          expires: { lt: cutoffDate },
        },
      });

      result.deleted = sessionsToProcess.length;

    } catch (error) {
      result.errors.push(`Error deleting sessions: ${error instanceof Error ? error.message : 'Unknown error'}` as never);
    }

    return result;
  }

  /**
   * Retain consent records
   */
  private async retainConsentRecords(
    cutoffDate: Date,
    autoDelete: boolean,
    tenantId: string | null
  ): Promise<{ processed: number; deleted: number; anonymized: number; errors: string[] }> {
    const whereClause: Record<string, unknown> = {
      updatedAt: { lt: cutoffDate },
      granted: false, // Only process revoked consents
    };
    
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const consentsToProcess = await prisma.consentRecord.findMany({
      where: whereClause,
    });

    const result = {
      processed: consentsToProcess.length,
      deleted: 0,
      anonymized: 0,
      errors: [],
    };

    if (!autoDelete || consentsToProcess.length === 0) {
      return result;
    }

    try {
      // Anonymize old consent records instead of deleting
      for (const consent of consentsToProcess) {
        await prisma.consentRecord.update({
          where: { id: consent.id },
          data: {
            ipAddress: null,
            userAgent: null,
            metadata: undefined,
          },
        });
      }

      result.anonymized = consentsToProcess.length;

    } catch (error) {
      result.errors.push(`Error anonymizing consent records: ${error instanceof Error ? error.message : 'Unknown error'}` as never);
    }

    return result;
  }

  /**
   * Retain form submissions
   */
  private async retainFormSubmissions(
    cutoffDate: Date,
    autoDelete: boolean,
    tenantId: string | null
  ): Promise<{ processed: number; deleted: number; anonymized: number; errors: string[] }> {
    const whereClause: Record<string, unknown> = {
      createdAt: { lt: cutoffDate },
    };
    
    if (tenantId) {
      // Find forms for this tenant first
      const tenantForms = await prisma.form.findMany({
        where: { tenantId },
        select: { id: true },
      });
      
      whereClause.formId = { in: tenantForms.map(f => f.id) };
    }

    const submissionsToProcess = await prisma.formSubmission.findMany({
      where: whereClause,
    });

    const result = {
      processed: submissionsToProcess.length,
      deleted: 0,
      anonymized: 0,
      errors: [],
    };

    if (!autoDelete || submissionsToProcess.length === 0) {
      return result;
    }

    try {
      await prisma.formSubmission.deleteMany({
        where: whereClause,
      });

      result.deleted = submissionsToProcess.length;

    } catch (error) {
      result.errors.push(`Error deleting form submissions: ${error instanceof Error ? error.message : 'Unknown error'}` as never);
    }

    return result;
  }

  /**
   * Retain notifications
   */
  private async retainNotifications(
    cutoffDate: Date,
    autoDelete: boolean,
    tenantId: string | null
  ): Promise<{ processed: number; deleted: number; anonymized: number; errors: string[] }> {
    const whereClause: Record<string, unknown> = {
      createdAt: { lt: cutoffDate },
      isRead: true, // Only delete read notifications
    };
    
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const notificationsToProcess = await prisma.notification.findMany({
      where: whereClause,
    });

    const result = {
      processed: notificationsToProcess.length,
      deleted: 0,
      anonymized: 0,
      errors: [],
    };

    if (!autoDelete || notificationsToProcess.length === 0) {
      return result;
    }

    try {
      await prisma.notification.deleteMany({
        where: whereClause,
      });

      result.deleted = notificationsToProcess.length;

    } catch (error) {
      result.errors.push(`Error deleting notifications: ${error instanceof Error ? error.message : 'Unknown error'}` as never);
    }

    return result;
  }

  /**
   * Get data inventory for a tenant
   */
  async getDataInventory(tenantId?: string): Promise<DataInventory[]> {
    const inventory: DataInventory[] = [];
    
    for (const dataType of Object.keys(this.defaultRetentionPeriods)) {
      const stats = await this.getDataTypeStats(dataType, tenantId);
      
      if (stats.totalRecords > 0) {
        inventory.push(stats);
      }
    }
    
    return inventory;
  }

  /**
   * Get statistics for a specific data type
   */
  private async getDataTypeStats(dataType: string, tenantId?: string): Promise<DataInventory> {
    let totalRecords = 0;
    let oldestRecord = new Date();
    let newestRecord = new Date();
    let dueDeletionCount = 0;

    const retentionDays = this.defaultRetentionPeriods[dataType as keyof typeof this.defaultRetentionPeriods];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      // This is a simplified implementation
      // In a real implementation, you'd query the actual tables
      switch (dataType) {
        case 'User':
          const userStats = await this.getUserStats(tenantId, cutoffDate);
          totalRecords = userStats.total;
          oldestRecord = userStats.oldest;
          newestRecord = userStats.newest;
          dueDeletionCount = userStats.dueDeletion;
          break;
          
        // Add other data types as needed
      }
    } catch (error) {
      console.error(`Error getting stats for ${dataType}:`, error);
    }

    return {
      dataType,
      totalRecords,
      oldestRecord,
      newestRecord,
      retentionPolicy: `${retentionDays} days`,
      dueDeletionCount,
      scheduledDeletion: this.calculateNextExecution(),
    };
  }

  /**
   * Get user statistics
   */
  private async getUserStats(tenantId?: string, cutoffDate?: Date): Promise<{
    total: number;
    oldest: Date;
    newest: Date;
    dueDeletion: number;
  }> {
    const whereClause: Record<string, unknown> = {};
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const [totalResult, oldestResult, newestResult, dueDeletionResult] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findFirst({ 
        where: whereClause, 
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
      }),
      prisma.user.findFirst({ 
        where: whereClause, 
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      }),
      cutoffDate ? prisma.user.count({ 
        where: { 
          ...whereClause, 
          updatedAt: { lt: cutoffDate },
          isActive: false 
        }
      }) : 0,
    ]);

    return {
      total: totalResult,
      oldest: oldestResult?.createdAt || new Date(),
      newest: newestResult?.createdAt || new Date(),
      dueDeletion: dueDeletionResult,
    };
  }

  /**
   * Calculate next execution time (daily at 2 AM)
   */
  private calculateNextExecution(): Date {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(2, 0, 0, 0);
    return next;
  }

  /**
   * Get retention policies for a tenant
   */
  async getTenantRetentionPolicies(tenantId: string): Promise<RetentionPolicy[]> {
    const policies = await prisma.dataRetentionPolicy.findMany({
      where: { 
        OR: [
          { tenantId },
          { tenantId: null }, // Include global policies
        ]
      },
      orderBy: { createdAt: 'desc' },
    });

    return policies.map(policy => ({
      id: policy.id,
      name: policy.name,
      description: policy.description || undefined,
      dataType: policy.dataType,
      retentionDays: policy.retentionDays,
      autoDelete: policy.autoDelete,
      isActive: policy.isActive,
      conditions: policy.conditions as Record<string, unknown> || undefined,
      lastExecuted: policy.lastExecuted || undefined,
      nextExecution: policy.nextExecution || undefined,
      tenantId: policy.tenantId || undefined,
    }));
  }

  /**
   * Generate retention compliance report
   */
  async generateRetentionReport(tenantId?: string): Promise<{
    summary: Record<string, unknown>;
    policies: RetentionPolicy[];
    inventory: DataInventory[];
    upcomingDeletions: Array<{
      dataType: string;
      scheduledDate: Date;
      estimatedRecords: number;
    }>;
    complianceStatus: string;
  }> {
    const policies = tenantId 
      ? await this.getTenantRetentionPolicies(tenantId)
      : await this.getAllRetentionPolicies();
    
    const inventory = await this.getDataInventory(tenantId);
    
    const summary = {
      totalPolicies: policies.length,
      activePolicies: policies.filter(p => p.isActive).length,
      dataTypesManaged: new Set(policies.map(p => p.dataType)).size,
      totalRecordsManaged: inventory.reduce((sum, inv) => sum + inv.totalRecords, 0),
      recordsDueDeletion: inventory.reduce((sum, inv) => sum + inv.dueDeletionCount, 0),
    };

    const upcomingDeletions = inventory
      .filter(inv => inv.dueDeletionCount > 0)
      .map(inv => ({
        dataType: inv.dataType,
        scheduledDate: inv.scheduledDeletion || new Date(),
        estimatedRecords: inv.dueDeletionCount,
      }));

    const complianceStatus = this.calculateRetentionCompliance(policies, inventory);

    return {
      summary,
      policies,
      inventory,
      upcomingDeletions,
      complianceStatus,
    };
  }

  /**
   * Get all retention policies
   */
  private async getAllRetentionPolicies(): Promise<RetentionPolicy[]> {
    const policies = await prisma.dataRetentionPolicy.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return policies.map(policy => ({
      id: policy.id,
      name: policy.name,
      description: policy.description || undefined,
      dataType: policy.dataType,
      retentionDays: policy.retentionDays,
      autoDelete: policy.autoDelete,
      isActive: policy.isActive,
      conditions: policy.conditions as Record<string, unknown> || undefined,
      lastExecuted: policy.lastExecuted || undefined,
      nextExecution: policy.nextExecution || undefined,
      tenantId: policy.tenantId || undefined,
    }));
  }

  /**
   * Calculate retention compliance score
   */
  private calculateRetentionCompliance(policies: RetentionPolicy[], inventory: DataInventory[]): string {
    if (policies.length === 0) return 'NON_COMPLIANT';
    
    const managedDataTypes = new Set(policies.map(p => p.dataType));
    const existingDataTypes = new Set(inventory.map(inv => inv.dataType));
    
    const coverage = managedDataTypes.size / existingDataTypes.size;
    const overdueRecords = inventory.reduce((sum, inv) => sum + inv.dueDeletionCount, 0);
    
    if (coverage < 0.5 || overdueRecords > 1000) return 'NON_COMPLIANT';
    if (coverage < 0.8 || overdueRecords > 100) return 'NEEDS_IMPROVEMENT';
    return 'COMPLIANT';
  }
}

// Export singleton instance
export const retentionManager = RetentionManager.getInstance(); 