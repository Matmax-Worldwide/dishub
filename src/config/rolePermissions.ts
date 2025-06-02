// src/config/rolePermissions.ts

export type RoleName = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'USER' | 'SUPER_ADMIN' | string;

const ADMIN_BASE_PERMISSIONS = [
  'read:user', 'create:user', 'update:user', 'delete:user',
  'read:post', 'create:post', 'update:post', 'delete:post',
  'manage:settings',
  'access:adminDashboard',
  'update:site_settings',
];
const ADMIN_CMS_PERMISSIONS = [
  'read:cms_section_definitions', 'read:any_page', 'browse:cms_components', 'read:cms_component_definition',
  'list:all_pages', 'find:pages_by_section', 'delete:cms_section', 'create:cms_component_definition',
  'update:cms_component_definition', 'delete:cms_component_definition', 'update:cms_section_metadata',
  'edit:cms_content', 'create:page', 'edit:page', 'delete:page', 'edit:page_structure'
];

const MANAGER_BASE_PERMISSIONS = [
  'read:user',
  'create:post', 'update:post',
  'read:post',
  'access:managerDashboard',
];
const MANAGER_CMS_PERMISSIONS = [
  'read:cms_section_definitions', 'read:any_page', 'browse:cms_components', 'read:cms_component_definition',
  'list:all_pages', 'find:pages_by_section', 'delete:cms_section', 'update:cms_section_metadata',
  'edit:cms_content', 'create:page', 'edit:page', 'edit:page_structure',
  'manage:cms_components', // From previous version
];

const EMPLOYEE_BASE_PERMISSIONS = [
  'read:post',
  'create:post',
  'update:ownPost',
  'access:employeeDashboard',
];
const EMPLOYEE_CMS_PERMISSIONS = [
  'read:cms_section_definitions', 'browse:cms_components', 'read:cms_component_definition',
  'update:cms_section_metadata', 'edit:cms_content',
];

export const rolePermissions: Record<RoleName, string[]> = {
  'ADMIN': [
    ...new Set([
      ...ADMIN_BASE_PERMISSIONS,
      // Permissions from existing file (Turn 69) not already in ADMIN_BASE_PERMISSIONS
      'edit:cms_content', 'manage:cms_structure', 'manage:cms_components',
      'create:page', 'edit:page', 'delete:page', 'edit:page_structure',
      // New CMS Permissions for ADMIN from task
      ...ADMIN_CMS_PERMISSIONS
    ])
  ],
  'SUPER_ADMIN': [ // Assuming SUPER_ADMIN gets all ADMIN permissions and potentially more
    ...new Set([
      ...ADMIN_BASE_PERMISSIONS,
      'edit:cms_content', 'manage:cms_structure', 'manage:cms_components',
      'create:page', 'edit:page', 'delete:page', 'edit:page_structure',
      ...ADMIN_CMS_PERMISSIONS,
      // Add any SUPER_ADMIN specific permissions here
    ])
  ],
  'MANAGER': [
    ...new Set([
      ...MANAGER_BASE_PERMISSIONS,
      // Permissions from existing file (Turn 69) not already in MANAGER_BASE_PERMISSIONS
      'edit:cms_content', 'manage:cms_components', 'create:page', 'edit:page',
      // New CMS Permissions for MANAGER from task
      ...MANAGER_CMS_PERMISSIONS
    ])
  ],
  'EMPLOYEE': [
    ...new Set([
      ...EMPLOYEE_BASE_PERMISSIONS,
      // Permissions from existing file (Turn 69) not already in EMPLOYEE_BASE_PERMISSIONS
      'edit:cms_content',
      // New CMS Permissions for EMPLOYEE from task
      ...EMPLOYEE_CMS_PERMISSIONS
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
