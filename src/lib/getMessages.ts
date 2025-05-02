/**
 * Utility to load internationalization messages based on locale
 */
export async function getMessages(locale: string) {
  try {
    // For now, return empty messages object
    // In a real app, you would load messages from a file or API
    return {
      common: {
        welcome: 'Welcome',
        login: 'Login',
        logout: 'Logout',
        register: 'Register',
        dashboard: 'Dashboard',
        profile: 'Profile',
        settings: 'Settings',
        admin: 'Admin',
        roles: 'Roles',
        permissions: 'Permissions',
        users: 'Users',
        notifications: 'Notifications',
        manage: 'Manage',
        create: 'Create',
        edit: 'Edit',
        delete: 'Delete',
      },
    };
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    return {};
  }
} 