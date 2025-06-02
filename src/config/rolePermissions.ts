// src/config/rolePermissions.ts

export type RoleName = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'USER' | 'SUPER_ADMIN' | string; 

// Base User/Post Permissions
const ADMIN_BASE_PERMISSIONS = [
  'read:user', 'create:user', 'update:user', 'delete:user',
  'read:post', // General read post permission
  // 'create:post', 'update:post', 'delete:post', // Moved to specific blog/post permissions
  'manage:settings', 
  'access:adminDashboard',
  'update:site_settings', 
];
const MANAGER_BASE_PERMISSIONS = [
  'read:user', 
  // 'create:post', 'update:post', // Moved
  'read:post', 
  'access:managerDashboard',
];
const EMPLOYEE_BASE_PERMISSIONS = [
  'read:post', 
  // 'create:post', // Moved
  'update:ownPost', // Kept as it's specific and different from 'update:any_post'
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

// Blog and Post Management Permissions (New)
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


export const rolePermissions: Record<RoleName, string[]> = {
  'ADMIN': [
    ...new Set([
      ...ADMIN_BASE_PERMISSIONS,
      ...ADMIN_CMS_PERMISSIONS,
      ...ADMIN_BLOG_POST_PERMISSIONS // Added
    ])
  ],
  'SUPER_ADMIN': [ 
    ...new Set([
      ...ADMIN_BASE_PERMISSIONS,
      ...ADMIN_CMS_PERMISSIONS,
      ...ADMIN_BLOG_POST_PERMISSIONS,
      // Add any SUPER_ADMIN specific permissions here
    ])
  ],
  'MANAGER': [
    ...new Set([
      ...MANAGER_BASE_PERMISSIONS,
      ...MANAGER_CMS_PERMISSIONS,
      ...MANAGER_BLOG_POST_PERMISSIONS // Added
    ])
  ],
  'EMPLOYEE': [
    ...new Set([
      ...EMPLOYEE_BASE_PERMISSIONS,
      ...EMPLOYEE_CMS_PERMISSIONS,
      ...EMPLOYEE_BLOG_POST_PERMISSIONS // Added
    ])
  ],
  'USER': [ 
    'read:post', 
    'update:ownProfile',
    'create:comment',
  ],
};

export function getPermissionsForRole(role: RoleName): string[] {
  return rolePermissions[role as keyof typeof rolePermissions] || [];
}
