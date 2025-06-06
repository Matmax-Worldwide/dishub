import { gqlRequest } from '@/lib/graphql-client';

// SuperAdmin Dashboard Queries
export const SuperAdmin_DASHBOARD_QUERY = `
  query SuperAdminDashboard {
    superAdminDashboard {
      stats {
        totalTenants
        activeTenants
        totalUsers
        activeUsers
        totalModules
        pendingRequests
        systemErrors
      }
      recentActivity {
        tenants {
          id
          name
          slug
          status
          createdAt
        }
        users {
          id
          firstName
          lastName
          email
          createdAt
          role {
            id
            name
          }
        }
      }
    }
  }
`;

export const ALL_TENANTS_QUERY = `
  query AllTenants($filter: TenantFilterInput, $pagination: PaginationInput) {
    allTenants(filter: $filter, pagination: $pagination) {
      items {
        id
        name
        slug
        domain
        status
        planId
        features
        settings
        userCount
        pageCount
        postCount
        createdAt
        updatedAt
      }
      totalCount
      page
      pageSize
      totalPages
    }
  }
`;

export const TENANT_HEALTH_METRICS_QUERY = `
  query TenantHealthMetrics($tenantId: ID) {
    tenantHealthMetrics(tenantId: $tenantId) {
      tenantId
      tenantName
      status
      healthScore
      metrics {
        totalUsers
        activeUsers
        totalPages
        publishedPages
        totalPosts
        publishedPosts
        features
      }
      lastActivity
    }
  }
`;

export const TENANT_BY_ID_QUERY = `
  query TenantById($id: ID!) {
    tenantById(id: $id) {
      id
      name
      slug
      domain
      status
      planId
      description
      features
      settings
      userCount
      pageCount
      postCount
      createdAt
      updatedAt
    }
  }
`;

export const GLOBAL_ANALYTICS_QUERY = `
  query GlobalAnalytics($timeRange: String) {
    globalAnalytics(timeRange: $timeRange) {
      tenantGrowth {
        date
        count
      }
      userGrowth {
        date
        count
      }
      featureUsage {
        feature
        count
      }
      topTenants {
        id
        name
        slug
        userCount
        pageCount
        postCount
        lastActivity
      }
    }
  }
`;

export const SYSTEM_STATUS_QUERY = `
  query SystemStatus {
    systemStatus {
      database {
        status
        responseTime
      }
      metrics {
        tenants {
          total
          active
          inactive
        }
        users {
          total
          active
          inactive
        }
        system {
          roles
          permissions
        }
      }
      timestamp
    }
  }
`;

export const GLOBAL_MODULES_QUERY = `
  query GlobalModules {
    globalModules {
      modules {
        name
        usageCount
        usagePercentage
        isActive
      }
      totalModules
      totalTenants
    }
  }
`;

export const MODULE_VERSIONS_QUERY = `
  query ModuleVersions($filter: ModuleVersionFilterInput, $pagination: PaginationInput) {
    moduleVersions(filter: $filter, pagination: $pagination) {
      versions {
        id
        moduleName
        version
        releaseDate
        status
        changelog
        downloadCount
        tenantCount
        compatibility
        size
        author
        isLatest
        dependencies
        features
      }
      totalCount
      modules
    }
  }
`;

export const REQUEST_HISTORY_QUERY = `
  query RequestHistory($filter: RequestHistoryFilterInput, $pagination: PaginationInput) {
    requestHistory(filter: $filter, pagination: $pagination) {
      requests {
        id
        type
        title
        description
        tenantId
        tenantName
        requestedBy
        requestedByEmail
        status
        priority
        createdAt
        updatedAt
        completedAt
        estimatedHours
        actualHours
        assignedTo
        notes
        attachments
      }
      totalCount
      stats {
        totalRequests
        approved
        rejected
        completed
        cancelled
        avgCompletionTime
      }
    }
  }
`;

// SuperAdmin Mutations
export const CREATE_TENANT_MUTATION = `
  mutation CreateTenantSuperAdmin($input: CreateTenantInput!) {
    createTenantSuperAdmin(input: $input) {
      success
      message
      tenant {
        id
        name
        slug
        domain
        status
        planId
        features
        settings
        userCount
        pageCount
        postCount
        createdAt
        updatedAt
      }
      adminUser {
        id
        email
        firstName
        lastName
        phoneNumber
        role {
          id
          name
          description
        }
        tenantId
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_TENANT_MUTATION = `
  mutation UpdateTenantSuperAdmin($id: ID!, $input: UpdateTenantInputSuperAdmin!) {
    updateTenantSuperAdmin(id: $id, input: $input) {
      success
      message
      tenant {
        id
        name
        slug
        domain
        status
        planId
        features
        settings
        userCount
        pageCount
        postCount
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_TENANT_MUTATION = `
  mutation DeleteTenant($id: ID!) {
    deleteTenant(id: $id) {
      success
      message
    }
  }
`;

export const IMPERSONATE_TENANT_MUTATION = `
  mutation ImpersonateTenant($tenantId: ID!) {
    impersonateTenant(tenantId: $tenantId) {
      success
      message
      impersonationData {
        tenantId
        tenantName
        tenantSlug
        userId
        userEmail
        userRole
      }
    }
  }
`;

export const PERFORM_SYSTEM_MAINTENANCE_MUTATION = `
  mutation PerformSystemMaintenance($action: String!) {
    performSystemMaintenance(action: $action) {
      success
      message
      timestamp
    }
  }
`;

export const ASSIGN_TENANT_ADMIN_MUTATION = `
  mutation AssignTenantAdmin($tenantId: ID!, $userId: ID!) {
    assignTenantAdmin(tenantId: $tenantId, userId: $userId) {
      success
      message
      user {
        id
        email
        firstName
        lastName
        phoneNumber
        role {
          id
          name
          description
        }
        tenantId
        createdAt
        updatedAt
      }
    }
  }
`;

// Type definitions for TypeScript
export interface SuperAdminDashboard {
  stats: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers: number;
    totalModules: number;
    pendingRequests: number;
    systemErrors: number;
  };
  recentActivity: {
    tenants: Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
      createdAt: string;
    }>;
    users: Array<{
      id: string;
      firstName?: string;
      lastName?: string;
      email: string;
      createdAt: string;
      role?: {
        id: string;
        name: string;
      };
    }>;
  };
}

export interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: string;
  planId?: string;
  description?: string;
  features: string[];
  settings?: {
    maxUsers?: number;
    maxStorage?: number;
    customDomain?: boolean;
    sslEnabled?: boolean;
    backupEnabled?: boolean;
    maintenanceMode?: boolean;
    [key: string]: unknown;
  };
  users: User[];
  userCount: number;
  pageCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: {
    id: string;
    name: string;
    description?: string;
  };
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantList {
  items: TenantDetails[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TenantHealthMetric {
  tenantId: string;
  tenantName: string;
  status: string;
  healthScore: number;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalPages: number;
    publishedPages: number;
    totalPosts: number;
    publishedPosts: number;
    features: string[];
  };
  lastActivity: string;
}

export interface GlobalAnalytics {
  tenantGrowth: Array<{ date: string; count: number }>;
  userGrowth: Array<{ date: string; count: number }>;
  featureUsage: Array<{ feature: string; count: number }>;
  topTenants: Array<{
    id: string;
    name: string;
    slug: string;
    userCount: number;
    pageCount: number;
    postCount: number;
    lastActivity: string;
  }>;
}

export interface SystemStatus {
  database: {
    status: string;
    responseTime?: number;
  };
  metrics: {
    tenants: { total: number; active: number; inactive: number };
    users: { total: number; active: number; inactive: number };
    system: { roles: number; permissions: number };
  };
  timestamp: string;
}

export interface GlobalModules {
  modules: Array<{
    name: string;
    usageCount: number;
    usagePercentage: number;
    isActive: boolean;
  }>;
  totalModules: number;
  totalTenants: number;
}

export interface ModuleVersion {
  id: string;
  moduleName: string;
  version: string;
  releaseDate: string;
  status: 'STABLE' | 'BETA' | 'ALPHA' | 'DEPRECATED';
  changelog: string;
  downloadCount: number;
  tenantCount: number;
  compatibility: string[];
  size: string;
  author: string;
  isLatest: boolean;
  dependencies: string[];
  features: string[];
}

export interface ModuleVersionList {
  versions: ModuleVersion[];
  totalCount: number;
  modules: string[];
}

export interface RequestHistory {
  id: string;
  type: 'MODULE' | 'CUSTOMIZATION' | 'FEATURE' | 'ACTIVATION' | 'SUPPORT';
  title: string;
  description: string;
  tenantId: string;
  tenantName: string;
  requestedBy: string;
  requestedByEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  assignedTo?: string;
  notes?: string;
  attachments: string[];
}

export interface RequestHistoryList {
  requests: RequestHistory[];
  totalCount: number;
  stats: {
    totalRequests: number;
    approved: number;
    rejected: number;
    completed: number;
    cancelled: number;
    avgCompletionTime: number;
  };
}

// Client functions
export class SuperAdminClient {
  // Dashboard
  static async getDashboard(): Promise<SuperAdminDashboard> {
    const response = await gqlRequest<{ superAdminDashboard: SuperAdminDashboard }>(
      SuperAdmin_DASHBOARD_QUERY
    );
    return response.superAdminDashboard;
  }

  // Tenant Management
  static async getAllTenants(
    filter?: { search?: string; status?: string; planId?: string },
    pagination?: { page?: number; pageSize?: number }
  ): Promise<TenantList> {
    const response = await gqlRequest<{ allTenants: TenantList }>(
      ALL_TENANTS_QUERY,
      { filter, pagination }
    );
    return response.allTenants;
  }

  static async getTenantHealthMetrics(tenantId?: string): Promise<TenantHealthMetric[]> {
    const response = await gqlRequest<{ tenantHealthMetrics: TenantHealthMetric[] }>(
      TENANT_HEALTH_METRICS_QUERY,
      { tenantId }
    );
    return response.tenantHealthMetrics;
  }

  // Analytics
  static async getGlobalAnalytics(timeRange?: string): Promise<GlobalAnalytics> {
    const response = await gqlRequest<{ globalAnalytics: GlobalAnalytics }>(
      GLOBAL_ANALYTICS_QUERY,
      { timeRange }
    );
    return response.globalAnalytics;
  }

  static async getSystemStatus(): Promise<SystemStatus> {
    const response = await gqlRequest<{ systemStatus: SystemStatus }>(
      SYSTEM_STATUS_QUERY
    );
    return response.systemStatus;
  }

  static async getGlobalModules(): Promise<GlobalModules> {
    const response = await gqlRequest<{ globalModules: GlobalModules }>(
      GLOBAL_MODULES_QUERY
    );
    return response.globalModules;
  }

  static async getModuleVersions(
    filter?: { search?: string; moduleName?: string; status?: string },
    pagination?: { page?: number; pageSize?: number }
  ): Promise<ModuleVersionList> {
    const response = await gqlRequest<{ moduleVersions: ModuleVersionList }>(
      MODULE_VERSIONS_QUERY,
      { filter, pagination }
    );
    return response.moduleVersions;
  }

  static async getRequestHistory(
    filter?: { search?: string; type?: string; status?: string; priority?: string; dateRange?: string },
    pagination?: { page?: number; pageSize?: number }
  ): Promise<RequestHistoryList> {
    const response = await gqlRequest<{ requestHistory: RequestHistoryList }>(
      REQUEST_HISTORY_QUERY,
      { filter, pagination }
    );
    return response.requestHistory;
  }

  // Mutations
  static async createTenant(input: {
    name: string;
    slug: string;
    domain?: string;
    planId?: string;
    features?: string[];
    settings?: Record<string, unknown>;
    adminEmail?: string;
    adminFirstName?: string;
    adminLastName?: string;
    adminPassword?: string;
  }): Promise<{ success: boolean; message: string; tenant?: TenantDetails; adminUser?: User }> {
    const response = await gqlRequest<{
      createTenantSuperAdmin: { success: boolean; message: string; tenant?: TenantDetails; adminUser?: User };
    }>(CREATE_TENANT_MUTATION, { input });
    return response.createTenantSuperAdmin;
  }

  static async updateTenant(
    id: string,
    input: {
      name?: string;
      slug?: string;
      domain?: string;
      status?: string;
      planId?: string;
      description?: string;
      features?: string[];
      settings?: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; message: string; tenant?: TenantDetails }> {
    const response = await gqlRequest<{
      updateTenantSuperAdmin: { success: boolean; message: string; tenant?: TenantDetails };
    }>(UPDATE_TENANT_MUTATION, { id, input });
    return response.updateTenantSuperAdmin;
  }

  static async deleteTenant(id: string): Promise<{ success: boolean; message: string }> {
    const response = await gqlRequest<{
      deleteTenant: { success: boolean; message: string };
    }>(DELETE_TENANT_MUTATION, { id });
    return response.deleteTenant;
  }

  static async impersonateTenant(tenantId: string): Promise<{
    success: boolean;
    message: string;
    impersonationData?: {
      tenantId: string;
      tenantName: string;
      tenantSlug: string;
      userId: string;
      userEmail: string;
      userRole?: string;
    };
  }> {
    const response = await gqlRequest<{
      impersonateTenant: {
        success: boolean;
        message: string;
        impersonationData?: {
          tenantId: string;
          tenantName: string;
          tenantSlug: string;
          userId: string;
          userEmail: string;
          userRole?: string;
        };
      };
    }>(IMPERSONATE_TENANT_MUTATION, { tenantId });
    return response.impersonateTenant;
  }

  static async performSystemMaintenance(action: string): Promise<{
    success: boolean;
    message: string;
    timestamp: string;
  }> {
    const response = await gqlRequest<{
      performSystemMaintenance: {
        success: boolean;
        message: string;
        timestamp: string;
      };
    }>(PERFORM_SYSTEM_MAINTENANCE_MUTATION, { action });
    return response.performSystemMaintenance;
  }

  static async getTenantById(id: string): Promise<TenantDetails | null> {
    try {
      const response = await gqlRequest<{ tenantById: TenantDetails | null }>(
        TENANT_BY_ID_QUERY,
        { id }
      );
      return response.tenantById;
    } catch (error) {
      console.error('Error fetching tenant by ID:', error);
      return null;
    }
  }

  static async updateTenantSettings(id: string, settings: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    // Simulate API call with tenant ID and settings
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Updating settings for tenant ${id}:`, settings);
    return { success: true, message: 'Tenant settings updated successfully' };
  }

  static async createTenantBackup(id: string): Promise<{ success: boolean; message: string }> {
    // Simulate API call with tenant ID
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`Creating backup for tenant ${id}`);
    return { success: true, message: 'Backup created successfully' };
  }

  static async assignTenantAdmin(tenantId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phoneNumber?: string;
      role: {
        id: string;
        name: string;
        description?: string;
      };
      tenantId: string;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    const response = await gqlRequest<{
      assignTenantAdmin: {
        success: boolean;
        message: string;
        user?: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          phoneNumber?: string;
          role: {
            id: string;
            name: string;
            description?: string;
          };
          tenantId: string;
          createdAt: string;
          updatedAt: string;
        };
      };
    }>(ASSIGN_TENANT_ADMIN_MUTATION, { tenantId, userId });
    return response.assignTenantAdmin;
  }
} 