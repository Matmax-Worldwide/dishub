// src/config/rolePermissions.ts

export type RoleName = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'USER' | 'SUPER_ADMIN' | 'STAFF' | string; // Added 'STAFF'

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
const EMPLOYEE_BASE_PERMISSIONS = [
  'read:post', 
  'update:ownPost', 
  'access:employeeDashboard',
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
const EMPLOYEE_CMS_PERMISSIONS = [
  'read:cms_section_definitions', 'browse:cms_components', 'read:cms_component_definition',
  'update:cms_section_metadata', 'edit:cms_content',
];

// Blog and Post Management Permissions
const ADMIN_BLOG_POST_PERMISSIONS = [
  'create:blog', 'update:blog', 'delete:blog', 
  'create:post', 'update:any_post', 'delete:post'
];
const MANAGER_BLOG_POST_PERMISSIONS = [
  'create:blog', 'update:blog', 
  'create:post', 'update:any_post', 'delete:post'
];
const EMPLOYEE_BLOG_POST_PERMISSIONS = [
  'create:post', 'update:any_post'
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
  'list:products', 'view:any_product', 'create:product', 'update:any_product', 'delete:any_product', 
  'manage:product_categories', 
  'list:orders', 'view:any_order', 'update:any_order', 
  'view:payments', 
  'manage:customers', 
  'manage:discounts', 
];
const USER_ECOMMERCE_PERMISSIONS = [ 
  'view:own_orders', 'create:order', 'view:cart', 'update:cart',
  'view:public_products', 'view:product_details',
];

// Calendar / Appointment Permissions (New)
const ADMIN_CALENDAR_PERMISSIONS = [
  'view:staff_profile',         // View any staff member's profile/schedule
  'list:staff_profiles',        // List all staff
  'list:all_bookings',          // List all bookings across all staff/services
  'view:booking_rules',         // View current booking rules
  'manage:locations',           // Create, update, delete service locations
  'manage:service_categories',  // Create, update, delete service categories
  'manage:services',            // Create, update, delete services
  'manage:staff_profiles',      // Create, update, delete staff profiles
  'update:any_staff_schedule',  // Update schedule for any staff member
  'manage:booking_rules',       // Set or change booking rules (lead times, cancellation policies)
  'create:booking_for_others',  // Admin can book for any client with any staff
  'assign:staff_to_service',    // Link staff to services they provide
  'assign:staff_to_location',   // Link staff to locations they operate from
];
const STAFF_CALENDAR_PERMISSIONS = [ // Permissions for a 'STAFF' role or an 'EMPLOYEE' who is also staff
  'view:staff_profile',         // Typically own or team's profiles
  'list:all_bookings',          // View bookings, perhaps filtered to own or team
  'update:own_staff_schedule',  // Staff can manage their own availability/schedule
  'create:booking_for_others',  // Staff can create bookings for clients (e.g., walk-ins)
];

export const rolePermissions: Record<RoleName, string[]> = {
  'ADMIN': [
    ...new Set([
      ...ADMIN_BASE_PERMISSIONS,
      ...ADMIN_CMS_PERMISSIONS,
      ...ADMIN_BLOG_POST_PERMISSIONS,
      ...ADMIN_ECOMMERCE_PERMISSIONS,
      ...ADMIN_CALENDAR_PERMISSIONS // Added
    ])
  ],
  'SUPER_ADMIN': [ 
    ...new Set([
      ...ADMIN_BASE_PERMISSIONS,
      ...ADMIN_CMS_PERMISSIONS,
      ...ADMIN_BLOG_POST_PERMISSIONS,
      ...ADMIN_ECOMMERCE_PERMISSIONS,
      ...ADMIN_CALENDAR_PERMISSIONS, // Added
      // Add any SUPER_ADMIN specific permissions here
    ])
  ],
  'MANAGER': [
    ...new Set([
      ...MANAGER_BASE_PERMISSIONS,
      ...MANAGER_CMS_PERMISSIONS,
      ...MANAGER_BLOG_POST_PERMISSIONS,
      ...MANAGER_ECOMMERCE_PERMISSIONS,
      // Managers might get some calendar admin rights, e.g., for their team
      'view:staff_profile', 'list:staff_profiles', 'list:all_bookings', 
      'create:booking_for_others', 
    ])
  ],
  'EMPLOYEE': [ // General employee, might not have specific staff calendar functions unless also 'STAFF'
    ...new Set([
      ...EMPLOYEE_BASE_PERMISSIONS,
      ...EMPLOYEE_CMS_PERMISSIONS,
      ...EMPLOYEE_BLOG_POST_PERMISSIONS,
      // If an Employee can also be bookable staff, they might get STAFF_CALENDAR_PERMISSIONS too.
      // Or, create a distinct 'STAFF' role. For now, adding to EMPLOYEE if they are staff.
      // This depends on how you map users to roles.
    ])
  ],
  'STAFF': [ // Specific role for bookable staff members
    ...new Set([
      ...EMPLOYEE_BASE_PERMISSIONS, // Staff are often employees
      // ... potentially some EMPLOYEE_CMS_PERMISSIONS if they write content
      ...STAFF_CALENDAR_PERMISSIONS,
    ])
  ],
  'USER': [ 
    'read:post', 
    'update:ownProfile',
    'create:comment',
    ...USER_ECOMMERCE_PERMISSIONS,
    // Customers might get some calendar permissions like:
    'create:own_booking', 
    'view:own_bookings',
    'cancel:own_booking',
  ],
};

export function getPermissionsForRole(role: RoleName): string[] {
  return rolePermissions[role as keyof typeof rolePermissions] || [];
}
