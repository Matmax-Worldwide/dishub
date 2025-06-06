
import { complianceDashboard } from '@/lib/gdpr/complianceDashboard';
import { consentManager } from '@/lib/gdpr/consentManager';
import { dpiaManager } from '@/lib/gdpr/dpiaManager';
import { retentionManager } from '@/lib/gdpr/retentionManager';
import { auditLogger } from '@/lib/audit/auditLogger';
import { prismaManager } from '@/lib/prisma';

// Types for better type safety
interface Context {
  req: {
    headers: {
      authorization?: string;
    };
  };
  prisma: unknown;
  user?: {
    id: string;
    role: string;
    tenantId?: string;
  };
  tenantId?: string;
}

interface GDPRDashboardInput {
  tenantId?: string;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
}

interface ComplianceActionInput {
  tenantId: string;
  action: string;
  parameters?: Record<string, unknown>;
}

// Helper function to get tenant ID from context
function getTenantId(context: Context, inputTenantId?: string): string {
  return inputTenantId || context.tenantId || context.user?.tenantId || 'default';
}

// Helper function to verify user permissions
async function verifyUserAccess(context: Context, tenantId: string): Promise<boolean> {
  if (!context.user) return false;
  
  // TenantAdmin can access their own tenant data
  if (context.user.role === 'TenantAdmin' && context.user.tenantId === tenantId) {
    return true;
  }
  
  // SuperAdmin can access any tenant
  if (context.user.role === 'SuperAdmin') {
    return true;
  }
  
  return false;
}

// GDPR Query Resolvers
export const gdprResolvers = {
  Query: {
    gdprDashboard: async (_: unknown, { input }: { input?: GDPRDashboardInput }, context: Context) => {
      try {
        const tenantId = getTenantId(context, input?.tenantId);
        
        if (!await verifyUserAccess(context, tenantId)) {
          throw new Error('Unauthorized to access tenant data');
        }

        // Generate dashboard data using compliance dashboard
        const dashboardData = await complianceDashboard.generateDashboard(tenantId);

        // Get additional stats
        const prisma = prismaManager.getClient(tenantId);
        
        // Calculate tenant stats
        const [
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          totalDataRequests,
          pendingDataRequests,
          totalConsentRecords,
          activeConsents,
          expiredConsents,
          totalAuditLogs
        ] = await Promise.all([
          prisma.user.count({ where: { userTenants: { some: { tenantId } } } }),
          prisma.user.count({ where: { userTenants: { some: { tenantId, isActive: true } } } }),
          prisma.user.count({
            where: {
              userTenants: { some: { tenantId } },
              createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }
          }),
          prisma.dataSubjectRequest.count({ where: { tenantId } }),
          prisma.dataSubjectRequest.count({ 
            where: { tenantId, status: { in: ['PENDING'] } }
          }),
          prisma.consentRecord.count({ where: { tenantId } }),
          prisma.consentRecord.count({ 
            where: { tenantId, granted: true, expiresAt: { gt: new Date() } }
          }),
          prisma.consentRecord.count({ 
            where: { tenantId, granted: true, expiresAt: { lte: new Date() } }
          }),
          prisma.auditLog.count({ where: { tenantId } })
        ]);

        const tenantStats = {
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          totalDataRequests,
          pendingDataRequests,
          totalConsentRecords,
          activeConsents,
          expiredConsents,
          totalAuditLogs,
          criticalAlerts: dashboardData.alerts?.filter(a => a.level === 'CRITICAL').length || 0,
          complianceScore: dashboardData.score?.overall || 0
        };

        return {
          score: dashboardData.score,
          alerts: dashboardData.alerts || [],
          upcomingTasks: dashboardData.upcomingTasks || [],
          recentActivity: dashboardData.recentActivity || [],
          tenantStats,
          lastUpdated: new Date().toISOString()
        };

      } catch (error) {
        console.error('GDPR Dashboard Query Error:', error);
        throw new Error(`Failed to generate GDPR dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    tenantStats: async (_: unknown, { tenantId }: { tenantId?: string }, context: Context) => {
      try {
        const finalTenantId = getTenantId(context, tenantId);
        
        if (!await verifyUserAccess(context, finalTenantId)) {
          throw new Error('Unauthorized to access tenant stats');
        }

        // Check if DATABASE_URL is available before trying to use Prisma
        if (!process.env.DATABASE_URL) {
          console.warn('DATABASE_URL not available, returning mock tenant stats');
          return {
            totalUsers: 0,
            activeUsers: 0,
            newUsersThisMonth: 0,
            totalDataRequests: 0,
            pendingDataRequests: 0,
            totalConsentRecords: 0,
            activeConsents: 0,
            expiredConsents: 0,
            totalAuditLogs: 0,
            criticalAlerts: 0,
            complianceScore: 0
          };
        }

        const prisma = prismaManager.getClient(finalTenantId);
        
        const [
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          totalDataRequests,
          pendingDataRequests,
          totalConsentRecords,
          activeConsents,
          expiredConsents,
          totalAuditLogs
        ] = await Promise.all([
          prisma.user.count({ where: { userTenants: { some: { tenantId: finalTenantId } } } }),
          prisma.user.count({ where: { userTenants: { some: { tenantId: finalTenantId, isActive: true } } } }),
          prisma.user.count({
            where: {
              userTenants: { some: { tenantId: finalTenantId } },
              createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }
          }),
          prisma.dataSubjectRequest.count({ where: { tenantId: finalTenantId } }),
          prisma.dataSubjectRequest.count({ 
            where: { tenantId: finalTenantId, status: { in: ['PENDING'] } }
          }),
          prisma.consentRecord.count({ where: { tenantId: finalTenantId } }),
          prisma.consentRecord.count({ 
            where: { tenantId: finalTenantId, granted: true, expiresAt: { gt: new Date() } }
          }),
          prisma.consentRecord.count({ 
            where: { tenantId: finalTenantId, granted: true, expiresAt: { lte: new Date() } }
          }),
          prisma.auditLog.count({ where: { tenantId: finalTenantId } })
        ]);

        // Get compliance score
        const dashboardData = await complianceDashboard.generateDashboard(finalTenantId);

        return {
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          totalDataRequests,
          pendingDataRequests,
          totalConsentRecords,
          activeConsents,
          expiredConsents,
          totalAuditLogs,
          criticalAlerts: dashboardData.alerts?.filter(a => a.level === 'CRITICAL').length || 0,
          complianceScore: dashboardData.score?.overall || 0
        };

      } catch (error) {
        console.error('Tenant Stats Query Error:', error);
        throw new Error(`Failed to get tenant stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    userActivity: async (_: unknown, { tenantId, days = 7 }: { tenantId?: string; days?: number }, context: Context) => {
      try {
        const finalTenantId = getTenantId(context, tenantId);
        
        if (!await verifyUserAccess(context, finalTenantId)) {
          throw new Error('Unauthorized to access user activity');
        }

        // Generate mock data for now - in production, you'd query actual activity logs
        const userActivity = [];
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (days - 1 - i));
          
          userActivity.push({
            date: date.toISOString().split('T')[0],
            activeUsers: Math.floor(Math.random() * 50) + 100,
            newRegistrations: Math.floor(Math.random() * 10) + 1,
            dataRequests: Math.floor(Math.random() * 5)
          });
        }

        return userActivity;

      } catch (error) {
        console.error('User Activity Query Error:', error);
        throw new Error(`Failed to get user activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    gdprMetrics: async (_: unknown, { tenantId }: { tenantId?: string }, context: Context) => {
      try {
        const finalTenantId = getTenantId(context, tenantId);
        
        if (!await verifyUserAccess(context, finalTenantId)) {
          throw new Error('Unauthorized to access GDPR metrics');
        }

        // Generate consent metrics with proper date range
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        const endDate = new Date();
        
        const consentReport = await consentManager.generateConsentReport(
          finalTenantId, 
          startDate, 
          endDate
        );
        

        const consentsByPurpose = Object.entries(consentReport.consentsByPurpose).map(([purpose, count]) => ({
          purpose,
          granted: count as number,
          revoked: 0, // Would calculate from actual data
          pending: 0
        }));

        const dataRequestsByType = [
          { type: 'ACCESS', count: 8, avgResponseTime: 2.5, pendingCount: 1 },
          { type: 'RECTIFICATION', count: 3, avgResponseTime: 1.8, pendingCount: 0 },
          { type: 'ERASURE', count: 2, avgResponseTime: 3.2, pendingCount: 1 },
          { type: 'PORTABILITY', count: 2, avgResponseTime: 4.1, pendingCount: 0 }
        ];

        const retentionMetrics = [
          { dataType: 'USER_DATA', recordsManaged: 1200, recordsDue: 45, nextReview: new Date() },
          { dataType: 'TRANSACTION_DATA', recordsManaged: 800, recordsDue: 12, nextReview: new Date() },
          { dataType: 'LOG_DATA', recordsManaged: 5000, recordsDue: 200, nextReview: new Date() }
        ];

        const complianceOverTime = [
          { date: '2024-01-01', score: 85.0, riskLevel: 'MEDIUM' as const },
          { date: '2024-01-15', score: 87.5, riskLevel: 'MEDIUM' as const },
          { date: '2024-02-01', score: 90.0, riskLevel: 'LOW' as const },
          { date: '2024-02-15', score: 87.0, riskLevel: 'MEDIUM' as const }
        ];

        return {
          consentsByPurpose,
          dataRequestsByType,
          retentionMetrics,
          complianceOverTime
        };

      } catch (error) {
        console.error('GDPR Metrics Query Error:', error);
        throw new Error(`Failed to get GDPR metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    complianceHistory: async (_: unknown, { tenantId, months = 6 }: { tenantId?: string; months?: number }, context: Context) => {
      try {
        const finalTenantId = getTenantId(context, tenantId);
        
        if (!await verifyUserAccess(context, finalTenantId)) {
          throw new Error('Unauthorized to access compliance history');
        }

        // Generate mock compliance history data
        // In production, this would query historical compliance scores
        const history = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        for (let i = 0; i < months; i++) {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i);
          
          const score = 75 + Math.random() * 20; // Random score between 75-95
          let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
          
          if (score >= 90) riskLevel = 'LOW';
          else if (score >= 70) riskLevel = 'MEDIUM';
          else if (score >= 50) riskLevel = 'HIGH';
          else riskLevel = 'CRITICAL';
          
          history.push({
            date: date.toISOString().split('T')[0],
            score: Math.round(score * 10) / 10,
            riskLevel
          });
        }

        return history;

      } catch (error) {
        console.error('Compliance History Query Error:', error);
        throw new Error(`Failed to get compliance history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  Mutation: {
    refreshCompliance: async (_: unknown, { tenantId }: { tenantId: string }, context: Context) => {
      try {
        if (!await verifyUserAccess(context, tenantId)) {
          throw new Error('Unauthorized to refresh compliance data');
        }

        // Refresh compliance dashboard
        const dashboardData = await complianceDashboard.generateDashboard(tenantId);

        // Log the refresh action
        if (context.user) {
          await auditLogger.log({
            tenantId,
            userId: context.user.id,
            action: 'UPDATE',
            resource: 'ComplianceDashboard',
            category: 'DATA_MODIFICATION',
            severity: 'INFO',
            details: 'Manual compliance dashboard refresh',
            ipAddress: '127.0.0.1', // Would extract from request
            userAgent: 'Dashboard'
          });
        }

        // Return the same structure as gdprDashboard query
        const prisma = prismaManager.getClient(tenantId);
        
        const [
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          totalDataRequests,
          pendingDataRequests,
          totalConsentRecords,
          activeConsents,
          expiredConsents,
          totalAuditLogs
        ] = await Promise.all([
          prisma.user.count({ where: { userTenants: { some: { tenantId } } } }),
          prisma.user.count({ where: { userTenants: { some: { tenantId, isActive: true } } } }),
          prisma.user.count({
            where: {
              userTenants: { some: { tenantId } },
              createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
            }
          }),
          prisma.dataSubjectRequest.count({ where: { tenantId } }),
          prisma.dataSubjectRequest.count({ 
            where: { tenantId, status: { in: ['PENDING'] } }
          }),
          prisma.consentRecord.count({ where: { tenantId } }),
          prisma.consentRecord.count({ 
            where: { tenantId, granted: true, expiresAt: { gt: new Date() } }
          }),
          prisma.consentRecord.count({ 
            where: { tenantId, granted: true, expiresAt: { lte: new Date() } }
          }),
          prisma.auditLog.count({ where: { tenantId } })
        ]);

        const tenantStats = {
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          totalDataRequests,
          pendingDataRequests,
          totalConsentRecords,
          activeConsents,
          expiredConsents,
          totalAuditLogs,
          criticalAlerts: dashboardData.alerts?.filter(a => a.level === 'CRITICAL').length || 0,
          complianceScore: dashboardData.score?.overall || 0
        };

        return {
          score: dashboardData.score,
          alerts: dashboardData.alerts || [],
          upcomingTasks: dashboardData.upcomingTasks || [],
          recentActivity: dashboardData.recentActivity || [],
          tenantStats,
          lastUpdated: new Date().toISOString()
        };

      } catch (error) {
        console.error('Refresh Compliance Mutation Error:', error);
        throw new Error(`Failed to refresh compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    executeComplianceAction: async (_: unknown, { input }: { input: ComplianceActionInput }, context: Context) => {
      try {
        const { tenantId, action, parameters } = input;
        
        if (!await verifyUserAccess(context, tenantId)) {
          throw new Error('Unauthorized to execute compliance actions');
        }

        let result;

        switch (action) {
          case 'run_dpia':
            const processingActivityId = parameters?.processingActivityId as string;
            if (!processingActivityId) {
              throw new Error('Processing activity ID required for DPIA');
            }
            if (!context.user) {
              throw new Error('User context required for DPIA');
            }
            result = await dpiaManager.performDPIA(tenantId, processingActivityId, context.user.id);
            break;

          case 'execute_retention':
            result = await retentionManager.executeRetentionPolicies(tenantId);
            break;

          case 'cleanup_consents':
            result = await consentManager.cleanupExpiredConsents(tenantId);
            break;

          case 'generate_report':
            result = await complianceDashboard.generateDashboard(tenantId);
            break;

          default:
            throw new Error(`Unknown compliance action: ${action}`);
        }

        // Log the action
        if (context.user) {
          await auditLogger.log({
            tenantId,
            userId: context.user.id,
            action: 'UPDATE',
            resource: 'ComplianceAction',
            category: 'SYSTEM_ADMIN',
            severity: 'INFO',
            details: `Executed compliance action: ${action}`,
            ipAddress: '127.0.0.1',
            userAgent: 'Dashboard'
          });
        }

        return {
          success: true,
          action,
          result,
          timestamp: new Date().toISOString()
        };

      } catch (error) {
        console.error('Execute Compliance Action Error:', error);
        throw new Error(`Failed to execute compliance action: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    generateComplianceReport: async (_: unknown, { tenantId, format = 'json' }: { tenantId: string; format?: string }, context: Context) => {
      try {
        if (!await verifyUserAccess(context, tenantId)) {
          throw new Error('Unauthorized to generate compliance reports');
        }

        const dashboardData = await complianceDashboard.generateDashboard(tenantId);
        
        // Generate consent report with proper date range
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        const endDate = new Date();
        
        const consentReport = await consentManager.generateConsentReport(
          tenantId, 
          startDate, 
          endDate
        );



        // Generate retention metrics - using mock data for now
        const retentionReport = { complianceScore: 85, summary: { recordsProcessed: 1000 } };


        const report = {
          tenantId,
          generatedAt: new Date().toISOString(),
          format,
          compliance: dashboardData,
          consent: consentReport,
          retention: retentionReport,
          summary: {
            overallScore: dashboardData.score?.overall || 0,
            riskLevel: dashboardData.score?.riskLevel || 'MEDIUM',
            criticalIssues: dashboardData.score?.criticalIssues?.length || 0,
            recommendations: dashboardData.score?.recommendations?.length || 0
          }
        };

        // Log report generation
        if (context.user) {
          await auditLogger.log({
            tenantId,
            userId: context.user.id,
            action: 'EXPORT',
            resource: 'ComplianceReport',
            category: 'DATA_EXPORT',
            severity: 'INFO',
            details: `Generated compliance report in format: ${format}`,
            ipAddress: '127.0.0.1',
            userAgent: 'Dashboard'
          });
        }

        return report;

      } catch (error) {
        console.error('Generate Compliance Report Error:', error);
        throw new Error(`Failed to generate compliance report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}; 