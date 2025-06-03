import { rule, shield, and, or, allow, deny } from 'graphql-shield';

// Define authentication rules
const isAuthenticated = rule()(async (parent, args, context) => {
  if (!context.user) {
    return new Error('You must be logged in to access this resource');
  }
  
  return true;
});

const isAdmin = rule()(async (parent, args, context) => {
  if (!context.user || context.user.role !== 'ADMIN') {
    return new Error('User is not an Admin!');
  }
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

// Placeholder for more complex ownership rules if needed later
// const isAppointmentOwner = rule()(async (parent, { id }, ctx, info) => { ... });

export const permissionsShield = shield({
  Query: {
    // User related
    me: isAuthenticated,
    viewerProfile: isAuthenticated,
    userById: and(isAuthenticated, or(isAdmin, isSelf)),
    users: and(isAuthenticated, hasPermission('list:users')),
    user: and(isAuthenticated, or(isAdmin, isSelf)),

    // Dashboard queries
    dashboardStats: isAuthenticated,
    documentsByStatus: isAuthenticated,
    timeEntriesByDay: isAuthenticated,
    tasksByStatus: isAuthenticated,

    // Document queries
    documents: isAuthenticated,
    document: isAuthenticated,
    documentStatusCounts: isAuthenticated,

    // Time entry queries
    timeEntries: isAuthenticated,
    timeEntry: isAuthenticated,

    // Appointment queries
    appointments: isAuthenticated,
    appointment: isAuthenticated,
    upcomingAppointments: isAuthenticated,

    // Task queries
    tasks: isAuthenticated,
    task: isAuthenticated,

    // Project queries
    projects: isAuthenticated,
    project: isAuthenticated,

    // Client queries
    clients: isAuthenticated,
    client: isAuthenticated,

    // Performance queries
    performances: isAuthenticated,
    performance: isAuthenticated,
    currentPerformance: isAuthenticated,

    // Notification queries
    notifications: isAuthenticated,
    notification: isAuthenticated,
    unreadNotificationsCount: isAuthenticated,
    allNotifications: isAuthenticated,

    // Role and permission queries
    roles: isAuthenticated,
    role: isAuthenticated,
    rolesWithCounts: and(isAuthenticated, hasPermission('list:roles')),
    permissions: isAuthenticated,
    rolePermissions: isAuthenticated,
    allPermissions: isAuthenticated,
    allUsersWithPermissions: and(isAuthenticated, hasPermission('list:users')),

    // Contact form queries
    contactFormSubmissions: and(isAuthenticated, hasPermission('view:contact_submissions')),

    // Help queries
    helpArticles: allow,
    helpArticle: allow,
    helpArticlesByCategory: allow,
    searchHelpArticles: allow,

    // External Link queries
    externalLinks: isAuthenticated,
    externalLink: isAuthenticated,
    activeExternalLinks: isAuthenticated,
    activeExternalLinksAs: isAuthenticated,
    userLinkAccessStatus: isAuthenticated,

    // User permissions
    userSpecificPermissions: and(isAuthenticated, or(isAdmin, isSelf)),

    // CMS Query Rules
    getAllCMSSections: and(isAuthenticated, hasPermission('read:cms_section_definitions')),
    getPageBySlug: allow,
    page: allow,
    getSectionComponents: allow,
    getAllCMSComponents: and(isAuthenticated, hasPermission('browse:cms_components')),
    getCMSComponent: and(isAuthenticated, hasPermission('read:cms_component_definition')),
    getCMSComponentsByType: and(isAuthenticated, hasPermission('browse:cms_components')),
    getAllCMSPages: and(isAuthenticated, hasPermission('list:all_pages')),
    getPagesUsingSectionId: and(isAuthenticated, hasPermission('find:pages_by_section')),
    getDefaultPage: allow,

    // Menu queries
    menus: allow,
    menu: allow,
    menuByName: allow,
    menuByLocation: allow,
    pages: allow,

    // Form Builder queries
    forms: allow,
    form: allow,
    formBySlug: allow,
    formSteps: allow,
    formStep: allow,
    formFields: allow,
    formField: allow,
    formSubmissions: and(isAuthenticated, hasPermission('view:form_submissions')),
    formSubmission: and(isAuthenticated, hasPermission('view:form_submissions')),
    formSubmissionStats: and(isAuthenticated, hasPermission('view:form_submissions')),

    // Settings Query Rules
    userSettings: isAuthenticated,
    getSiteSettings: allow,

    // Blog/Post Query Rules
    blogs: allow,
    blog: allow,
    blogBySlug: allow,
    post: allow,
    posts: allow,
    postBySlug: allow,

    // Media queries
    media: isAuthenticated,
    mediaItem: isAuthenticated,
    mediaByType: isAuthenticated,
    mediaInFolder: isAuthenticated,

    // E-commerce Query Rules
    shops: and(isAuthenticated, hasPermission('list:shops')),
    shop: and(isAuthenticated, hasPermission('view:shop_details')),
    products: allow, product: allow, productBySku: allow,
    currencies: allow, currency: allow, currencyByCode: allow,
    productCategories: allow,
    taxes: and(isAuthenticated, hasPermission('view:taxes')),
    orders: and(isAuthenticated, hasPermission('list:orders')),
    order: and(isAuthenticated, or(hasPermission('view:any_order'), hasPermission('view:own_orders'))),
    paymentProviders: and(isAuthenticated, hasPermission('manage:payment_settings')),
    payments: and(isAuthenticated, hasPermission('view:payments')),
    customers: and(isAuthenticated, hasPermission('manage:customers')),
    discounts: and(isAuthenticated, hasPermission('manage:discounts')),
    validateDiscount: isAuthenticated,
    reviews: allow,

    // Calendar / Appointment Query Rules
    location: allow,
    locations: allow,
    serviceCategory: allow,
    serviceCategories: allow,
    service: allow,
    services: allow,
    staffProfile: and(isAuthenticated, hasPermission('view:staff_profile')),
    staffProfiles: and(isAuthenticated, hasPermission('list:staff_profiles')),
    bookings: and(isAuthenticated, hasPermission('list:all_bookings')),
    globalBookingRule: and(isAuthenticated, hasPermission('view:booking_rules')),
    availableSlots: allow,
    staffForService: allow,

    // Employee / HR related (New)
    employees: and(isAuthenticated, hasPermission('list:employees')),
    employee: and(isAuthenticated, or(hasPermission('view:any_employee_profile'), hasPermission('view:own_employee_profile'))),
    employeesByDepartment: and(isAuthenticated, hasPermission('list:employees_by_department')),
    departments: isAuthenticated,
    positions: isAuthenticated,

    '*': isAuthenticated,
  },
  Mutation: {
    // User related
    createUser: and(isAuthenticated, hasPermission('create:user')),
    updateUser: and(isAuthenticated, hasPermission('update:user')),
    deleteUser: and(isAuthenticated, hasPermission('delete:user')),

    // CMS Mutation Rules
    saveSectionComponents: and(isAuthenticated, hasPermission('edit:cms_content')),
    deleteCMSSection: and(isAuthenticated, hasPermission('delete:cms_section')),
    createCMSComponent: and(isAuthenticated, hasPermission('create:cms_component_definition')),
    updateCMSComponent: and(isAuthenticated, hasPermission('update:cms_component_definition')),
    deleteCMSComponent: and(isAuthenticated, hasPermission('delete:cms_component_definition')),
    updateCMSSection: and(isAuthenticated, hasPermission('update:cms_section_metadata')),
    createPage: and(isAuthenticated, hasPermission('create:page')),
    updatePage: and(isAuthenticated, hasPermission('edit:page')),
    deletePage: and(isAuthenticated, hasPermission('delete:page')),
    associateSectionToPage: and(isAuthenticated, hasPermission('edit:page_structure')),
    dissociateSectionFromPage: and(isAuthenticated, hasPermission('edit:page_structure')),

    // Settings Mutation Rules
    updateUserSettings: isAuthenticated,
    updateSiteSettings: and(isAuthenticated, hasPermission('update:site_settings')),

    // Blog and Post Mutation Rules
    createBlog: and(isAuthenticated, hasPermission('create:blog')),
    updateBlog: and(isAuthenticated, hasPermission('update:blog')),
    deleteBlog: and(isAuthenticated, hasPermission('delete:blog')),
    createPost: and(isAuthenticated, hasPermission('create:post')),
    updatePost: and(isAuthenticated, hasPermission('update:any_post')),
    deletePost: and(isAuthenticated, hasPermission('delete:post')),

    // E-commerce Mutation Rules
    createShop: and(isAuthenticated, hasPermission('create:shop')),
    updateShop: and(isAuthenticated, hasPermission('update:shop')),
    deleteShop: and(isAuthenticated, hasPermission('delete:shop')),
    createCurrency: and(isAuthenticated, hasPermission('manage:currencies')),
    updateCurrency: and(isAuthenticated, hasPermission('manage:currencies')),
    deleteCurrency: and(isAuthenticated, hasPermission('manage:currencies')),
    createProductCategory: and(isAuthenticated, hasPermission('create:product_category')),
    updateProductCategory: and(isAuthenticated, hasPermission('update:product_category')),
    deleteProductCategory: and(isAuthenticated, hasPermission('delete:product_category')),
    createTax: and(isAuthenticated, hasPermission('manage:taxes')),
    updateTax: and(isAuthenticated, hasPermission('manage:taxes')),
    deleteTax: and(isAuthenticated, hasPermission('manage:taxes')),
    createPaymentProvider: and(isAuthenticated, hasPermission('manage:payment_settings')),
    updatePaymentProvider: and(isAuthenticated, hasPermission('manage:payment_settings')),
    deletePaymentProvider: and(isAuthenticated, hasPermission('manage:payment_settings')),
    createPayment: and(isAuthenticated, hasPermission('create:payment')),
    updatePayment: and(isAuthenticated, hasPermission('manage:payments')),
    createOrder: and(isAuthenticated, hasPermission('create:order')),
    updateOrder: and(isAuthenticated, or(hasPermission('update:any_order'), hasPermission('update:own_order'))),
    deleteOrder: and(isAuthenticated, hasPermission('delete:order')),
    createDiscount: and(isAuthenticated, hasPermission('manage:discounts')),
    updateDiscount: and(isAuthenticated, hasPermission('manage:discounts')),
    deleteDiscount: and(isAuthenticated, hasPermission('manage:discounts')),
    createShippingZone: and(isAuthenticated, hasPermission('manage:shipping_zones')),
    updateShippingZone: and(isAuthenticated, hasPermission('manage:shipping_zones')),
    deleteShippingZone: and(isAuthenticated, hasPermission('manage:shipping_zones')),
    createProduct: and(isAuthenticated, hasPermission('create:product')),
    updateProduct: and(isAuthenticated, hasPermission('update:any_product')),
    deleteProduct: and(isAuthenticated, hasPermission('delete:any_product')),
    createReview: isAuthenticated,
    updateReview: and(isAuthenticated, or(hasPermission('update:any_review'), /* isReviewOwner */)),
    deleteReview: and(isAuthenticated, or(hasPermission('delete:any_review'), /* isReviewOwner */)),

    // Calendar / Appointment Mutation Rules
    createLocation: and(isAuthenticated, hasPermission('manage:locations')),
    updateLocation: and(isAuthenticated, hasPermission('manage:locations')),
    deleteLocation: and(isAuthenticated, hasPermission('manage:locations')),
    createServiceCategory: and(isAuthenticated, hasPermission('manage:service_categories')),
    updateServiceCategory: and(isAuthenticated, hasPermission('manage:service_categories')),
    deleteServiceCategory: and(isAuthenticated, hasPermission('manage:service_categories')),
    createService: and(isAuthenticated, hasPermission('manage:services')),
    updateService: and(isAuthenticated, hasPermission('manage:services')),
    deleteService: and(isAuthenticated, hasPermission('manage:services')),
    createStaffProfile: and(isAuthenticated, hasPermission('manage:staff_profiles')),
    updateStaffProfile: and(isAuthenticated, hasPermission('manage:staff_profiles')),
    deleteStaffProfile: and(isAuthenticated, hasPermission('manage:staff_profiles')),
    updateStaffSchedule: and(isAuthenticated, or(hasPermission('update:any_staff_schedule'), hasPermission('update:own_staff_schedule'))),
    upsertGlobalBookingRules: and(isAuthenticated, hasPermission('manage:booking_rules')),
    createBooking: and(isAuthenticated, or(hasPermission('create:booking_for_others'), hasPermission('create:own_booking'))),
    updateAppointment: and(isAuthenticated, or(hasPermission('update:any_booking'), hasPermission('update:own_booking'))),
    deleteAppointment: and(isAuthenticated, or(hasPermission('delete:any_booking'), hasPermission('delete:own_booking'))),
    assignStaffToService: and(isAuthenticated, hasPermission('assign:staff_to_service')),
    removeStaffFromService: and(isAuthenticated, hasPermission('assign:staff_to_service')),
    assignStaffToLocation: and(isAuthenticated, hasPermission('assign:staff_to_location')),
    removeStaffFromLocation: and(isAuthenticated, hasPermission('assign:staff_to_location')),

    // Employee / HR related (New)
    createEmployee: and(isAuthenticated, hasPermission('create:employee')),
    updateEmployee: and(isAuthenticated, hasPermission('update:employee')),
    assignEmployeeToDepartment: and(isAuthenticated, hasPermission('assign:employee_to_department')),

    '*': isAuthenticated,
  },
  User: {
    id: isAuthenticated,
    email: or(isSelf, isAdmin),
    firstName: isAuthenticated,
    lastName: isAuthenticated,
    phoneNumber: or(isSelf, isAdmin),
    profileImageUrl: isAuthenticated,
    role: isAuthenticated,
    isActive: isAuthenticated,
    createdAt: isAuthenticated,
    updatedAt: isAuthenticated,
    notifications: isSelf,
    settings: isSelf,
    staffProfile: isAuthenticated,
    bookings: or(isSelf, isAdmin),
  },
  Role: {
    '*': isAuthenticated,
  },
  Permission: {
    '*': isAuthenticated,
  },
  DailyTimeEntry: {
    '*': isAuthenticated,
  },
  DocumentStatusCount: {
    '*': isAuthenticated,
  },
  TaskStatusCount: {
    '*': isAuthenticated,
  },
  Document: {
    '*': isAuthenticated,
  },
  TimeEntry: {
    '*': isAuthenticated,
  },
  Appointment: {
    '*': isAuthenticated,
  },
  Task: {
    '*': isAuthenticated,
  },
  Project: {
    '*': isAuthenticated,
  },
  Client: {
    '*': isAuthenticated,
  },
  Performance: {
    '*': isAuthenticated,
  },
  Notification: {
    '*': isAuthenticated,
  },
  UserSettings: {
    '*': isSelf,
  },
  SiteSettings: {
    '*': allow,
  },
  CMSSection: {
    components: isAuthenticated,
  },
  Page: {
    sections: isAuthenticated,
  },
  Employee: {
    '*': isAuthenticated,
  },
  Department: {
    '*': isAuthenticated,
  },
  Position: {
    '*': isAuthenticated,
  }
  // TODO: Add Type specific rules for Calendar/Appointment models if needed
  // TODO: Add Type specific rules for Employee/HR models if needed (e.g., Employee.salary: isAdmin)
}, {
  allowExternalErrors: true,
  debug: process.env.NODE_ENV === 'development',
  fallbackRule: deny,
  fallbackError: 'Access denied. You do not have permission to access this resource.',
});