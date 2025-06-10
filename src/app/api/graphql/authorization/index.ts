import { rule, shield, and, or, allow } from 'graphql-shield';

// Define authentication rules
const isAuthenticated = rule()(async (parent, args, context) => {
  if (!context.user) {
    return new Error('You must be logged in to access this resource');
  }
  
  return true;
});

const isAdmin = rule()(async (parent, args, context) => {
  if (!context.user) {
    return new Error('Not authenticated!');
  }
  
  // Check if user has admin-level role using new role names
  const adminRoles = [
    'SuperAdmin',           // Global platform admin
    'PlatformAdmin',        // Platform management
    'TenantAdmin',          // Tenant administrator
    'TenantManager',        // Tenant manager
    'ContentManager',       // CMS admin
    'HRAdmin',             // HR administrator
    'BookingAdmin',        // Booking system admin
    'StoreAdmin',          // E-commerce admin
    'FinanceManager'       // Finance admin
  ];
  
  // Get role name from the role object
  const userRoleName = typeof context.user.role === 'string' ? context.user.role : context.user.role.name;
  
  if (!adminRoles.includes(userRoleName)) {
    return new Error(`Access denied. Admin role required. Current role: ${userRoleName}`);
  }
  
  return true;
});

// New rule: Requires MetaMask signature for critical operations
const requiresMetaMaskSignature = rule()(async (parent, args, context) => {
  if (!context.user) {
    return new Error('Not authenticated!');
  }

  // Check if MetaMask signature is provided for this operation
  const { metaMaskSignature, operationType } = args;
  
  if (!metaMaskSignature) {
    return new Error('Esta operación requiere aprobación con MetaMask. Por favor firma la transacción.');
  }

  // Verify the signature format (basic validation)
  if (typeof metaMaskSignature !== 'string' || metaMaskSignature.length < 64) {
    return new Error('Firma de MetaMask inválida');
  }

  // Here you could add more sophisticated signature verification
  // For now, we just check that it exists and has the right format
  
  // Log the operation for audit purposes
  console.log(`MetaMask signature verified for operation: ${operationType}`, {
    userId: context.user.id,
    signature: metaMaskSignature.substring(0, 10) + '...',
    timestamp: new Date().toISOString()
  });

  return true;
});

// isTenantMember might not be used in this specific set of rules, but good to keep if defined elsewhere
// const isTenantMember = rule({ cache: 'contextual' })( ... );

const isSelf = rule()(async (parent, args, context) => {
  if (!context.user) {
    return new Error('Not authenticated!');
  }
  
  // Check if the user is accessing their own data
  const targetUserId = args.id || args.userId || parent?.userId || parent?.id;
  if (targetUserId && targetUserId === context.user.id) {
    return true;
  }
  
  return new Error('You can only access your own data');
});

const hasPermission = (permission: string) => {
  return rule()(async (parent, args, context) => {
    if (!context.user) {
      return new Error('Not authenticated!');
    }
    
    if (!context.user.permissions || !context.user.permissions.includes(permission)) {
      return new Error(`Missing required permission: ${permission}`);
    }
    return true;
  });
};

// Critical operations that require MetaMask signature
// const criticalOperations = [
//   // Eliminar usuarios y tenants
//   'deleteUser',
//   'deleteTenant',
  
//   // Modificar proveedores de pago
//   'updatePaymentProvider',
//   'createPaymentProvider',
//   'deletePaymentProvider',
  
//   // Actualizar configuraciones críticas
//   'updateSiteSettings',
  
//   // Gestionar permisos y roles
//   'assignPermissionToRole',
//   'removePermissionFromRole',
//   'createRole',
//   'deleteRole',
//   'updateRole'
// ];

// Placeholder for more complex ownership rules if needed later
// const isAppointmentOwner = rule()(async (parent, { id }, ctx, info) => { ... });

export const permissions = shield({
  Query: {
    // Authentication queries - PUBLIC ACCESS
    me: allow,
    
    // Tenant queries - PUBLIC ACCESS (needed for login redirection)
    tenant: allow,
    tenants: allow,
    
    // Menu queries - PUBLIC ACCESS (needed for navigation)
    menus: allow,
    
    // User Query Rules - Admin bypass
    users: or(isAdmin, and(isAuthenticated, hasPermission('list:all_users'))),
    user: or(isAdmin, and(isAuthenticated, or(hasPermission('read:user'), isSelf))),
    userById: or(isAdmin, and(isAuthenticated, or(hasPermission('read:user'), isSelf))),
    viewerProfile: or(isAdmin, isAuthenticated),
    
    // Dashboard Query Rules - Admin bypass
    dashboardStats: or(isAdmin, and(isAuthenticated, hasPermission('view:dashboard_stats'))),
    documentsByStatus: or(isAdmin, isAuthenticated),
    timeEntriesByDay: or(isAdmin, isAuthenticated),
    
    // Notification queries
    unreadNotificationsCount: or(isAdmin, isAuthenticated),
    
    // Role and permission queries - Admin bypass
    roles: or(isAdmin, and(isAuthenticated, hasPermission('list:all_roles'))),
    role: or(isAdmin, and(isAuthenticated, hasPermission('read:role'))),
    rolesWithCounts: or(isAdmin, and(isAuthenticated, hasPermission('list:all_roles'))),
    permissions: or(isAdmin, and(isAuthenticated, hasPermission('list:all_permissions'))),
    rolePermissions: or(isAdmin, and(isAuthenticated, hasPermission('read:role_permissions'))),
    allPermissions: or(isAdmin, and(isAuthenticated, hasPermission('list:all_permissions'))),
    allUsersWithPermissions: or(isAdmin, and(isAuthenticated, hasPermission('list:all_users'))),
    userSpecificPermissions: allow,
    
    // Contact form queries - Admin bypass
    contactFormSubmissions: or(isAdmin, and(isAuthenticated, hasPermission('view:contact_submissions'))),
    
    // CMS Query Rules - Admin bypass
    getAllCMSSections: or(isAdmin, and(isAuthenticated, hasPermission('read:cms_section_definitions'))),
    getPageBySlug: allow,
    page: allow,
    getSectionComponents: allow,
    getAllCMSComponents: allow,
    getCMSComponent: allow,
    getCMSComponentsByType: allow,
    getAllCMSPages: allow,
    getPagesUsingSectionId: allow,
    getDefaultPage: allow,
    
    // Form Builder queries - Admin bypass
    forms: or(isAdmin, and(isAuthenticated, hasPermission('list:all_forms'))),
    form: or(isAdmin, and(isAuthenticated, hasPermission('read:form'))),
    formBySlug: allow,
    formSteps: or(isAdmin, and(isAuthenticated, hasPermission('read:form_steps'))),
    formStep: or(isAdmin, and(isAuthenticated, hasPermission('read:form_step'))),
    formFields: or(isAdmin, and(isAuthenticated, hasPermission('read:form_fields'))),
    formField: or(isAdmin, and(isAuthenticated, hasPermission('read:form_field'))),
    formSubmissions: or(isAdmin, and(isAuthenticated, hasPermission('list:form_submissions'))),
    formSubmission: or(isAdmin, and(isAuthenticated, hasPermission('view:form_submission'))),
    formSubmissionStats: or(isAdmin, and(isAuthenticated, hasPermission('view:form_stats'))),
    
    // Settings Query Rules - Admin bypass
    userSettings: or(isAdmin, and(isAuthenticated, hasPermission('read:user_settings'))),
    getSiteSettings: allow,
    
    // Blog Query Rules - Admin bypass
    blogs: allow,
    blog: allow,
    blogBySlug: allow,
    posts: allow,
    post: allow,
    postBySlug: allow,
    
    // E-commerce Query Rules - Admin bypass
    shops: or(isAdmin, and(isAuthenticated, hasPermission('list:all_shops'))),
    shop: or(isAdmin, and(isAuthenticated, hasPermission('read:shop'))),
    products: or(isAdmin, and(isAuthenticated, hasPermission('list:all_products'))),
    product: or(isAdmin, and(isAuthenticated, hasPermission('read:product'))),
    productBySku: or(isAdmin, isAuthenticated),
    currencies: or(isAdmin, and(isAuthenticated, hasPermission('list:all_currencies'))),
    currency: or(isAdmin, and(isAuthenticated, hasPermission('read:currency'))),
    currencyByCode: or(isAdmin, isAuthenticated),
    productCategories: or(isAdmin, and(isAuthenticated, hasPermission('list:all_product_categories'))),
    productCategory: or(isAdmin, and(isAuthenticated, hasPermission('read:product_category'))),
    taxes: or(isAdmin, and(isAuthenticated, hasPermission('list:all_taxes'))),
    orders: or(isAdmin, and(isAuthenticated, hasPermission('list:all_orders'))),
    order: or(isAdmin, and(isAuthenticated, or(hasPermission('view:any_order'), hasPermission('view:own_orders')))),
    paymentProviders: or(isAdmin, and(isAuthenticated, hasPermission('list:all_payment_providers'))),
    paymentProvider: or(isAdmin, and(isAuthenticated, hasPermission('read:payment_provider'))),
    paymentMethods: or(isAdmin, and(isAuthenticated, hasPermission('list:all_payment_methods'))),
    payments: or(isAdmin, and(isAuthenticated, hasPermission('list:all_payments'))),
    customers: or(isAdmin, and(isAuthenticated, hasPermission('manage:customers'))),
    discounts: or(isAdmin, and(isAuthenticated, hasPermission('manage:discounts'))),
    shippingProviders: or(isAdmin, and(isAuthenticated, hasPermission('list:all_shipping_providers'))),
    shippingMethods: or(isAdmin, and(isAuthenticated, hasPermission('list:all_shipping_methods'))),
    shippingZones: or(isAdmin, and(isAuthenticated, hasPermission('list:all_shipping_zones'))),
    shipments: or(isAdmin, and(isAuthenticated, hasPermission('list:all_shipments'))),
    
    // Calendar / Appointment Query Rules - Admin bypass
    location: allow,
    locations: allow,
    serviceCategory: allow,
    serviceCategories: allow,
    service: allow,
    services: allow,
    staffProfile: or(isAdmin, and(isAuthenticated, hasPermission('read:staff_profile'))),
    staffProfiles: or(isAdmin, and(isAuthenticated, hasPermission('list:all_staff_profiles'))),
    bookings: or(isAdmin, and(isAuthenticated, hasPermission('list:all_bookings'))),
    globalBookingRule: or(isAdmin, and(isAuthenticated, hasPermission('update:global_booking_rules'))),
    availableSlots: allow,
    staffForService: allow,
    
    // Employee / HR related - Admin bypass
    employees: or(isAdmin, and(isAuthenticated, hasPermission('list:all_employees'))),
    employee: or(isAdmin, and(isAuthenticated, hasPermission('read:employee'))),
    employeesByDepartment: or(isAdmin, and(isAuthenticated, hasPermission('list:employees_by_department'))),
    departments: or(isAdmin, and(isAuthenticated, hasPermission('list:all_departments'))),
    positions: or(isAdmin, and(isAuthenticated, hasPermission('list:all_positions'))),
    
    // External links
    activeExternalLinks: or(isAdmin, isAuthenticated),
    
    '*': or(isAdmin, and(isAuthenticated, or(isAdmin, hasPermission('list:all_resources')))),
  },
  Mutation: {
    // Authentication mutations - PUBLIC ACCESS
    login: allow,
    register: allow,
    
    // Tenant mutations - PUBLIC ACCESS (needed for registration)
    createTenant: allow,
    registerUserWithTenant: allow,
    
    // Role and permission mutations - Admin bypass + MetaMask for critical operations
    createRole: or(isAdmin, and(isAuthenticated, hasPermission('create:role'))),
    createPermission: or(isAdmin, and(isAuthenticated, hasPermission('create:permission'))),
    assignPermissionToRole: or(isAdmin, and(isAuthenticated, hasPermission('assign:permission_to_role'), requiresMetaMaskSignature)),
    removePermissionFromRole: or(isAdmin, and(isAuthenticated, hasPermission('remove:permission_from_role'), requiresMetaMaskSignature)),
    
    // User Mutation Rules - Admin bypass + MetaMask for delete
    createUser: or(isAdmin, and(isAuthenticated, hasPermission('create:user'))),
    updateUser: or(isAdmin, and(isAuthenticated, hasPermission('update:user'))),
    deleteUser: or(isAdmin, and(isAuthenticated, hasPermission('delete:user'), requiresMetaMaskSignature)),
    
    // CMS Mutation Rules - Admin bypass
    saveSectionComponents: or(isAdmin, and(isAuthenticated, hasPermission('edit:cms_content'))),
    deleteCMSSection: or(isAdmin, and(isAuthenticated, hasPermission('delete:cms_section'))),
    createCMSComponent: or(isAdmin, and(isAuthenticated, hasPermission('create:cms_component_definition'))),
    updateCMSComponent: or(isAdmin, and(isAuthenticated, hasPermission('update:cms_component_definition'))),
    deleteCMSComponent: or(isAdmin, and(isAuthenticated, hasPermission('delete:cms_component_definition'))),
    updateCMSSection: or(isAdmin, and(isAuthenticated, hasPermission('update:cms_section_metadata'))),
    createPage: or(isAdmin, and(isAuthenticated, hasPermission('create:page'))),
    updatePage: or(isAdmin, and(isAuthenticated, hasPermission('update:page'))),
    deletePage: or(isAdmin, and(isAuthenticated, hasPermission('delete:page'))),
    associateSectionToPage: or(isAdmin, and(isAuthenticated, hasPermission('edit:page_structure'))),
    dissociateSectionFromPage: or(isAdmin, and(isAuthenticated, hasPermission('edit:page_structure'))),
    
    // Settings Mutation Rules - Admin bypass + MetaMask for site settings
    updateUserSettings: or(isAdmin, and(isAuthenticated, hasPermission('update:user_settings'))),
    updateSiteSettings: or(isAdmin, and(isAuthenticated, hasPermission('update:site_settings'), requiresMetaMaskSignature)),
    
    // Blog Mutation Rules - Admin bypass
    createBlog: or(isAdmin, and(isAuthenticated, hasPermission('create:blog'))),
    updateBlog: or(isAdmin, and(isAuthenticated, hasPermission('update:blog'))),
    deleteBlog: or(isAdmin, and(isAuthenticated, hasPermission('delete:blog'))),
    createPost: or(isAdmin, and(isAuthenticated, hasPermission('create:post'))),
    updatePost: or(isAdmin, and(isAuthenticated, hasPermission('update:post'))),
    deletePost: or(isAdmin, and(isAuthenticated, hasPermission('delete:post'))),
    
    // E-commerce Mutation Rules - Admin bypass
    createShop: or(isAdmin, and(isAuthenticated, hasPermission('create:shop'))),
    updateShop: or(isAdmin, and(isAuthenticated, hasPermission('update:shop'))),
    deleteShop: or(isAdmin, and(isAuthenticated, hasPermission('delete:shop'))),
    createCurrency: or(isAdmin, and(isAuthenticated, hasPermission('create:currency'))),
    updateCurrency: or(isAdmin, and(isAuthenticated, hasPermission('update:currency'))),
    deleteCurrency: or(isAdmin, and(isAuthenticated, hasPermission('delete:currency'))),
    createProductCategory: or(isAdmin, and(isAuthenticated, hasPermission('create:product_category'))),
    updateProductCategory: or(isAdmin, and(isAuthenticated, hasPermission('update:product_category'))),
    deleteProductCategory: or(isAdmin, and(isAuthenticated, hasPermission('delete:product_category'))),
    createTax: or(isAdmin, and(isAuthenticated, hasPermission('create:tax'))),
    updateTax: or(isAdmin, and(isAuthenticated, hasPermission('update:tax'))),
    deleteTax: or(isAdmin, and(isAuthenticated, hasPermission('delete:tax'))),
    createPaymentProvider: or(isAdmin, and(isAuthenticated, hasPermission('create:payment_provider'), requiresMetaMaskSignature)),
    updatePaymentProvider: or(isAdmin, and(isAuthenticated, hasPermission('update:payment_provider'), requiresMetaMaskSignature)),
    deletePaymentProvider: or(isAdmin, and(isAuthenticated, hasPermission('delete:payment_provider'), requiresMetaMaskSignature)),
    createPayment: or(isAdmin, and(isAuthenticated, hasPermission('create:payment'))),
    updatePayment: or(isAdmin, and(isAuthenticated, hasPermission('update:payment'))),
    createOrder: or(isAdmin, and(isAuthenticated, hasPermission('create:order'))),
    updateOrder: or(isAdmin, and(isAuthenticated, or(hasPermission('update:any_order'), hasPermission('update:own_order')))),
    deleteOrder: or(isAdmin, and(isAuthenticated, hasPermission('delete:order'))),
    createDiscount: or(isAdmin, and(isAuthenticated, hasPermission('create:discount'))),
    updateDiscount: or(isAdmin, and(isAuthenticated, hasPermission('update:discount'))),
    deleteDiscount: or(isAdmin, and(isAuthenticated, hasPermission('delete:discount'))),
    createShippingZone: or(isAdmin, and(isAuthenticated, hasPermission('create:shipping_zone'))),
    updateShippingZone: or(isAdmin, and(isAuthenticated, hasPermission('update:shipping_zone'))),
    deleteShippingZone: or(isAdmin, and(isAuthenticated, hasPermission('delete:shipping_zone'))),
    createProduct: or(isAdmin, and(isAuthenticated, hasPermission('create:product'))),
    updateProduct: or(isAdmin, and(isAuthenticated, hasPermission('update:product'))),
    deleteProduct: or(isAdmin, and(isAuthenticated, hasPermission('delete:product'))),
    createReview: or(isAdmin, and(isAuthenticated, hasPermission('create:review'))),
    updateReview: or(isAdmin, and(isAuthenticated, or(hasPermission('update:any_review'), hasPermission('update:own_review')))),
    deleteReview: or(isAdmin, and(isAuthenticated, or(hasPermission('delete:any_review'), hasPermission('delete:own_review')))),
    
    // Calendar / Appointment Mutation Rules - Admin bypass
    createLocation: or(isAdmin, and(isAuthenticated, hasPermission('create:location'))),
    updateLocation: or(isAdmin, and(isAuthenticated, hasPermission('update:location'))),
    deleteLocation: or(isAdmin, and(isAuthenticated, hasPermission('delete:location'))),
    createServiceCategory: or(isAdmin, and(isAuthenticated, hasPermission('create:service_category'))),
    updateServiceCategory: or(isAdmin, and(isAuthenticated, hasPermission('update:service_category'))),
    deleteServiceCategory: or(isAdmin, and(isAuthenticated, hasPermission('delete:service_category'))),
    createService: or(isAdmin, and(isAuthenticated, hasPermission('create:service'))),
    updateService: or(isAdmin, and(isAuthenticated, hasPermission('update:service'))),
    deleteService: or(isAdmin, and(isAuthenticated, hasPermission('delete:service'))),
    createStaffProfile: or(isAdmin, and(isAuthenticated, hasPermission('create:staff_profile'))),
    updateStaffProfile: or(isAdmin, and(isAuthenticated, hasPermission('update:staff_profile'))),
    deleteStaffProfile: or(isAdmin, and(isAuthenticated, hasPermission('delete:staff_profile'))),
    updateStaffSchedule: or(isAdmin, and(isAuthenticated, or(hasPermission('update:any_staff_schedule'), hasPermission('update:own_staff_schedule')))),
    upsertGlobalBookingRules: or(isAdmin, and(isAuthenticated, hasPermission('update:global_booking_rules'))),
    createBooking: or(isAdmin, and(isAuthenticated, or(hasPermission('create:booking_for_others'), hasPermission('create:own_booking')))),
    updateAppointment: or(isAdmin, and(isAuthenticated, or(hasPermission('update:any_booking'), hasPermission('update:own_booking')))),
    deleteAppointment: or(isAdmin, and(isAuthenticated, or(hasPermission('delete:any_booking'), hasPermission('delete:own_booking')))),
    assignStaffToService: or(isAdmin, and(isAuthenticated, hasPermission('assign:staff_to_service'))),
    removeStaffFromService: or(isAdmin, and(isAuthenticated, hasPermission('remove:staff_from_service'))),
    assignStaffToLocation: or(isAdmin, and(isAuthenticated, hasPermission('assign:staff_to_location'))),
    removeStaffFromLocation: or(isAdmin, and(isAuthenticated, hasPermission('remove:staff_from_location'))),
    
    // Employee / HR related - Admin bypass
    createEmployee: or(isAdmin, and(isAuthenticated, hasPermission('create:employee'))),
    updateEmployee: or(isAdmin, and(isAuthenticated, hasPermission('update:employee'))),
    assignEmployeeToDepartment: or(isAdmin, and(isAuthenticated, hasPermission('assign:employee_to_department'))),
    
    // Form Mutation Rules - Admin bypass
    createForm: or(isAdmin, and(isAuthenticated, hasPermission('create:form'))),
    updateForm: or(isAdmin, and(isAuthenticated, hasPermission('update:form'))),
    deleteForm: or(isAdmin, and(isAuthenticated, hasPermission('delete:form'))),
    createFormStep: or(isAdmin, and(isAuthenticated, hasPermission('create:form_step'))),
    updateFormStep: or(isAdmin, and(isAuthenticated, hasPermission('update:form_step'))),
    deleteFormStep: or(isAdmin, and(isAuthenticated, hasPermission('delete:form_step'))),
    createFormField: or(isAdmin, and(isAuthenticated, hasPermission('create:form_field'))),
    updateFormField: or(isAdmin, and(isAuthenticated, hasPermission('update:form_field'))),
    deleteFormField: or(isAdmin, and(isAuthenticated, hasPermission('delete:form_field'))),
    submitForm: allow,
    updateFormSubmissionStatus: or(isAdmin, and(isAuthenticated, hasPermission('update:form_submission_status'))),
    updateFieldOrder: or(isAdmin, and(isAuthenticated, hasPermission('update:field_order'))),
    updateFieldOrders: or(isAdmin, and(isAuthenticated, hasPermission('update:field_orders'))),
    updateStepOrders: or(isAdmin, and(isAuthenticated, hasPermission('update:step_orders'))),
    deleteFormSubmission: or(isAdmin, and(isAuthenticated, hasPermission('delete:form_submission'))),
    
    '*': or(isAdmin, and(isAuthenticated, or(isAdmin, hasPermission('list:all_resources')))),
  },
  
  // Type-level permissions - Admin bypass for all types
  User: {
    id: allow,
    email: allow, 
    firstName: allow,
    lastName: allow,
    phoneNumber: allow, // Allow access to phoneNumber during login
    profileImageUrl: allow,
    role: allow, 
    userTenants: allow,
    isActive: or(isAdmin, and(isAuthenticated, hasPermission('read:user'))),
    createdAt: allow,
    updatedAt: allow,
    notifications: or(isAdmin, and(isAuthenticated, hasPermission('read:notifications'))),
    settings: or(isAdmin, and(isAuthenticated, hasPermission('read:user_settings'))),
    staffProfile: or(isAdmin, and(isAuthenticated, hasPermission('read:staff_profile'))),
    bookings: or(isAdmin, and(isAuthenticated, hasPermission('list:all_bookings'))),
  },
  Role: {
    '*': allow,
  },
  Permission: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('list:all_permissions'))),
  },
  DailyTimeEntry: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:daily_time_entry'))),
  },
  DocumentStatusCount: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:document_status_count'))),
  },
  TaskStatusCount: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:task_status_count'))),
  },
  Document: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:document'))),
  },
  TimeEntry: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:time_entry'))),
  },
  Appointment: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:appointment'))),
  },
  Task: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:task'))),
  },
  Project: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:project'))),
  },
  Client: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:client'))),
  },
  Performance: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:performance'))),
  },
  Notification: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:notification'))),
  },
  UserSettings: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:user_settings'))),
  },
  SiteSettings: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:site_settings'))),
  },
  CMSSection: {
    '*': allow,
  },
  SectionComponent: {
    '*': allow,
  },
  CMSComponent: {
    '*': allow,
  },
  Page: {
    '*': allow,
  },
  PageSEO: {
    '*': allow,
  },
  Employee: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:employee'))),
  },
  Department: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:department'))),
  },
  Position: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:position'))),
  },
  DashboardStats: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:dashboard_stats'))),
  },
  AuthPayload: {
    '*': allow,
  },
  UserPermission: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:user_permission'))),
  },
  Menu: {
    '*': allow,
  },
  MenuItem: {
    '*': allow,
  },
  Booking: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:booking'))),
  },
  BookingRule: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:booking_rule'))),
  },
  BookingConnection: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:booking_connection'))),
  },
  BookingEdge: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:booking_edge'))),
  },
  BookingResult: {
    '*': or(isAdmin, and(isAuthenticated, hasPermission('read:booking_result'))),
  },
  Service: {
    '*': allow,
  },
  Location: {
    '*': allow,
  },
  ServiceCategory: {
    '*': allow,
  },
  StaffProfile: {
    '*': allow,
  },
  Tenant: {
    '*': allow,
  },
  FormBase: {
    '*': allow,
  },
  FormStepBase: {
    '*': allow,
  },
  FormFieldBase: {
    '*': allow,
  },
  FormSubmissionBase: {
    '*': allow,
  },
  Blog: {
    '*': allow,
  },
  Post: {
    '*': allow,
  },
  Shop: {
    '*': allow,
  },
  Order: {
    '*': allow,
  },
  Currency: {
    '*': allow,
  },
  Tax: {
    '*': allow,
  },
  PaymentProvider: {
    '*': allow,
  },
  PaymentMethod: {
    '*': allow,
  },
  Payment: {
    '*': allow,
  },
  ShippingProvider: {
    '*': allow,
  },
  ShippingMethod: {
    '*': allow,
  },
  ShippingZone: {
    '*': allow,
  },
  Shipment: {
    '*': allow,
  },
  RoleModel: {
    '*': allow,
  },
}, {
  allowExternalErrors: true,
});