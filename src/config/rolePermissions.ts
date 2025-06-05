// src/config/rolePermissions.ts

export type RoleName = 
  // Global Platform Roles
  | 'SuperAdmin' | 'PlatformAdmin' | 'SupportAgent'
  // Tenant Level Roles  
  | 'TenantAdmin' | 'TenantManager' | 'TenantUser'
  // CMS Module Roles
  | 'ContentManager' | 'ContentEditor'
  // HRMS Module Roles
  | 'HRAdmin' | 'HRManager' | 'Employee'
  // Booking Module Roles
  | 'BookingAdmin' | 'Agent' | 'Customer'
  // E-Commerce Module Roles
  | 'StoreAdmin' | 'StoreManager'
  // Future/Complementary Roles
  | 'FinanceManager' | 'SalesRep' | 'Instructor' | 'ProjectLead'
  | string;

// Base User/Post Permissions
const ADMIN_BASE_PERMISSIONS = [
  'read:user', 'create:user', 'update:user', 'delete:user',
  'read:post',
  'manage:settings',
  'access:adminDashboard',
  'update:site_settings',
];

const MANAGER_BASE_PERMISSIONS = [
  'read:user',
  'read:post',
  'access:managerDashboard',
];

const USER_BASE_PERMISSIONS = [
  'read:post',
  'update:ownPost',
  'update:ownProfile',
];

// CMS Permissions
const ADMIN_CMS_PERMISSIONS = [
  'read:cms_section_definitions', 'read:any_page', 'browse:cms_components', 'read:cms_component_definition',
  'list:all_pages', 'find:pages_by_section', 'delete:cms_section', 'create:cms_component_definition',
  'update:cms_component_definition', 'delete:cms_component_definition', 'update:cms_section_metadata',
  'edit:cms_content', 'create:page', 'edit:page', 'delete:page', 'edit:page_structure'
];

const MANAGER_CMS_PERMISSIONS = [
  'read:cms_section_definitions', 'read:any_page', 'browse:cms_components', 'read:cms_component_definition',
  'list:all_pages', 'find:pages_by_section', 'delete:cms_section', 'update:cms_section_metadata',
  'edit:cms_content', 'create:page', 'edit:page', 'edit:page_structure',
  'manage:cms_components',
];

const EDITOR_CMS_PERMISSIONS = [
  'read:cms_section_definitions', 'browse:cms_components', 'read:cms_component_definition',
  'update:cms_section_metadata', 'edit:cms_content', 'read:any_page',
];

// Blog and Post Management Permissions
const ADMIN_BLOG_POST_PERMISSIONS = [
  'create:blog', 'update:blog', 'delete:blog',
  'create:post', 'update:any_post', 'delete:post', 'publish:post'
];

const MANAGER_BLOG_POST_PERMISSIONS = [
  'create:blog', 'update:blog',
  'create:post', 'update:any_post', 'delete:post', 'publish:post'
];

const EDITOR_BLOG_POST_PERMISSIONS = [
  'create:post', 'update:own_post', 'read:any_post'
];

// E-commerce Permissions
const ADMIN_ECOMMERCE_PERMISSIONS = [
  'list:shops', 'view:shop_details', 'create:shop', 'update:shop', 'delete:shop',
  'list:products', 'view:any_product', 'create:product', 'update:any_product', 'delete:any_product',
  'manage:product_categories', 'create:product_category', 'update:product_category', 'delete:product_category',
  'view:taxes', 'manage:taxes',
  'list:orders', 'view:any_order', 'update:any_order', 'delete:order',
  'manage:payment_settings', 'view:payments', 'manage:payments',
  'manage:customers', 'view:customer_details',
  'manage:discounts', 'create:discount', 'update:discount', 'delete:discount',
  'manage:currencies',
  'view:shipping_zones', 'manage:shipping_zones',
];

const MANAGER_ECOMMERCE_PERMISSIONS = [
  'list:shops', 'view:shop_details',
  'list:products', 'view:any_product', 'create:product', 'update:any_product',
  'manage:product_categories',
  'list:orders', 'view:any_order', 'update:any_order',
  'view:payments',
  'manage:customers',
  'manage:discounts',
];

const CUSTOMER_ECOMMERCE_PERMISSIONS = [
  'view:own_orders', 'create:order', 'view:cart', 'update:cart',
  'view:public_products', 'view:product_details',
];

// HR Management Permissions
const HR_ADMIN_PERMISSIONS = [
  'list:employees', 'view:any_employee_profile', 'create:employee', 'update:employee', 'delete:employee',
  'manage:departments', 'create:department', 'update:department', 'delete:department',
  'manage:positions', 'create:position', 'update:position', 'delete:position',
  'view:all_attendance', 'manage:attendance', 'generate:hr_reports',
  'manage:leaves', 'approve:leave', 'reject:leave',
  'manage:benefits', 'assign:benefits',
  'manage:payroll', 'process:payroll',
  'manage:performance_reviews', 'create:performance_review',
  'manage:trainings', 'assign:training',
];

const HR_MANAGER_PERMISSIONS = [
  'list:employees', 'view:any_employee_profile', 'update:employee',
  'view:departments', 'view:positions',
  'view:all_attendance', 'manage:attendance',
  'approve:leave', 'reject:leave', 'view:leaves',
  'view:benefits',
  'view:payroll',
  'create:performance_review', 'view:performance_reviews',
  'assign:training', 'view:trainings',
];

const EMPLOYEE_PERMISSIONS = [
  'view:own_employee_profile', 'update:own_profile',
  'view:own_attendance', 'clock:in_out',
  'request:leave', 'view:own_leaves',
  'view:own_benefits',
  'view:own_payroll',
  'view:own_performance_reviews',
  'view:assigned_trainings',
];

// Booking/Calendar Permissions
const BOOKING_ADMIN_PERMISSIONS = [
  'manage:locations', 'create:location', 'update:location', 'delete:location',
  'manage:service_categories', 'create:service_category', 'update:service_category', 'delete:service_category',
  'manage:services', 'create:service', 'update:service', 'delete:service',
  'manage:staff_profiles', 'create:staff_profile', 'update:staff_profile', 'delete:staff_profile',
  'manage:booking_rules', 'update:booking_rules',
  'view:all_bookings', 'create:booking_for_others', 'update:any_booking', 'cancel:any_booking',
  'assign:staff_to_service', 'assign:staff_to_location',
  'update:any_staff_schedule',
];

const AGENT_PERMISSIONS = [
  'view:own_staff_profile', 'update:own_staff_schedule',
  'view:assigned_bookings', 'update:assigned_bookings',
  'create:booking_for_others',
];

const CUSTOMER_BOOKING_PERMISSIONS = [
  'create:own_booking', 'view:own_bookings', 'update:own_booking', 'cancel:own_booking',
  'view:available_services', 'view:available_slots',
];

// Finance Permissions
const FINANCE_MANAGER_PERMISSIONS = [
  'view:financial_reports', 'generate:financial_reports',
  'manage:billing', 'create:invoice', 'update:invoice',
  'view:payments', 'manage:payments',
  'manage:taxes', 'view:tax_reports',
  'manage:currencies', 'view:revenue_analytics',
];

// Sales Permissions
const SALES_REP_PERMISSIONS = [
  'view:customers', 'create:customer', 'update:customer',
  'view:leads', 'create:lead', 'update:lead',
  'view:opportunities', 'create:opportunity', 'update:opportunity',
  'view:sales_reports', 'track:sales_performance',
];

// Instructor Permissions
const INSTRUCTOR_PERMISSIONS = [
  'view:courses', 'create:course', 'update:own_course',
  'view:students', 'manage:course_enrollment',
  'create:lesson', 'update:lesson', 'delete:own_lesson',
  'grade:assignments', 'view:student_progress',
];

// Project Management Permissions
const PROJECT_LEAD_PERMISSIONS = [
  'view:projects', 'create:project', 'update:project',
  'view:tasks', 'create:task', 'update:task', 'assign:task',
  'view:team_members', 'assign:team_members',
  'view:project_reports', 'track:project_progress',
];

// Platform Management Permissions
const PLATFORM_ADMIN_PERMISSIONS = [
  'manage:tenants', 'view:tenant_analytics',
  'manage:modules', 'activate:modules', 'deactivate:modules',
  'manage:plans', 'create:plan', 'update:plan',
  'view:platform_analytics', 'generate:usage_reports',
];

const SUPPORT_AGENT_PERMISSIONS = [
  'view:support_dashboard', 'view:tickets', 'update:ticket',
  'view:user_issues', 'assist:users',
  'view:system_status',
];

export const rolePermissions: Record<RoleName, string[]> = {
  // Global Platform Roles
  'SuperAdmin': [
    ...new Set([
      ...ADMIN_BASE_PERMISSIONS,
      ...ADMIN_CMS_PERMISSIONS,
      ...ADMIN_BLOG_POST_PERMISSIONS,
      ...ADMIN_ECOMMERCE_PERMISSIONS,
      ...HR_ADMIN_PERMISSIONS,
      ...BOOKING_ADMIN_PERMISSIONS,
      ...FINANCE_MANAGER_PERMISSIONS,
      ...PLATFORM_ADMIN_PERMISSIONS,
      'manage:all_tenants',
      'access:all_databases',
      'manage:platform_configuration',
    ])
  ],
  
  'PlatformAdmin': [
    ...new Set([
      ...PLATFORM_ADMIN_PERMISSIONS,
      'view:tenant_details',
      'manage:pricing',
      'view:usage_analytics',
    ])
  ],
  
  'SupportAgent': [
    ...new Set([
      ...SUPPORT_AGENT_PERMISSIONS,
      'read:user',
      'view:basic_tenant_info',
    ])
  ],

  // Tenant Level Roles
  'TenantAdmin': [
    ...new Set([
      ...ADMIN_BASE_PERMISSIONS,
      ...ADMIN_CMS_PERMISSIONS,
      ...ADMIN_BLOG_POST_PERMISSIONS,
      ...ADMIN_ECOMMERCE_PERMISSIONS,
      ...HR_ADMIN_PERMISSIONS,
      ...BOOKING_ADMIN_PERMISSIONS,
      ...FINANCE_MANAGER_PERMISSIONS,
      'manage:tenant_settings',
      'manage:tenant_users',
      'activate:tenant_modules',
    ])
  ],
  
  'TenantManager': [
    ...new Set([
      ...MANAGER_BASE_PERMISSIONS,
      ...MANAGER_CMS_PERMISSIONS,
      ...MANAGER_BLOG_POST_PERMISSIONS,
      ...MANAGER_ECOMMERCE_PERMISSIONS,
      ...HR_MANAGER_PERMISSIONS,
      'view:reports',
      'approve:actions',
    ])
  ],
  
  'TenantUser': [
    ...new Set([
      ...USER_BASE_PERMISSIONS,
      'access:tenant_dashboard',
    ])
  ],

  // CMS Module Roles
  'ContentManager': [
    ...new Set([
      ...ADMIN_CMS_PERMISSIONS,
      ...ADMIN_BLOG_POST_PERMISSIONS,
      'manage:media',
    ])
  ],
  
  'ContentEditor': [
    ...new Set([
      ...EDITOR_CMS_PERMISSIONS,
      ...EDITOR_BLOG_POST_PERMISSIONS,
    ])
  ],

  // HRMS Module Roles
  'HRAdmin': [
    ...new Set([
      ...HR_ADMIN_PERMISSIONS,
    ])
  ],
  
  'HRManager': [
    ...new Set([
      ...HR_MANAGER_PERMISSIONS,
    ])
  ],
  
  'Employee': [
    ...new Set([
      ...EMPLOYEE_PERMISSIONS,
    ])
  ],

  // Booking Module Roles
  'BookingAdmin': [
    ...new Set([
      ...BOOKING_ADMIN_PERMISSIONS,
    ])
  ],
  
  'Agent': [
    ...new Set([
      ...AGENT_PERMISSIONS,
    ])
  ],
  
  'Customer': [
    ...new Set([
      ...CUSTOMER_BOOKING_PERMISSIONS,
      ...CUSTOMER_ECOMMERCE_PERMISSIONS,
    ])
  ],

  // E-Commerce Module Roles
  'StoreAdmin': [
    ...new Set([
      ...ADMIN_ECOMMERCE_PERMISSIONS,
    ])
  ],
  
  'StoreManager': [
    ...new Set([
      ...MANAGER_ECOMMERCE_PERMISSIONS,
    ])
  ],

  // Future/Complementary Roles
  'FinanceManager': [
    ...new Set([
      ...FINANCE_MANAGER_PERMISSIONS,
    ])
  ],
  
  'SalesRep': [
    ...new Set([
      ...SALES_REP_PERMISSIONS,
    ])
  ],
  
  'Instructor': [
    ...new Set([
      ...INSTRUCTOR_PERMISSIONS,
    ])
  ],
  
  'ProjectLead': [
    ...new Set([
      ...PROJECT_LEAD_PERMISSIONS,
    ])
  ],
};

export function getPermissionsForRole(role: RoleName): string[] {
  return rolePermissions[role as keyof typeof rolePermissions] || [];
}
