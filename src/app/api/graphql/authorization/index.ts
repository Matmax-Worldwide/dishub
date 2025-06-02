import { rule, shield, and, or, not, allow, deny } from 'graphql-shield';
import { GraphQLError } from 'graphql'; 

// --- Reusable Rule Fragments ---
const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent: any, args: any, ctx: any, info: any) => {
    if (!ctx.user || !ctx.user.id) {
      return new Error('Not authenticated!'); 
    }
    return true;
  }
);

const isAdmin = rule({ cache: 'contextual' })(
  async (parent: any, args: any, ctx: any, info: any) => {
    if (!ctx.user || ctx.user.role !== 'ADMIN') { 
      return new Error('User is not an Admin!');
    }
    return true;
  }
);

// isTenantMember might not be used in this specific set of rules, but good to keep if defined elsewhere
// const isTenantMember = rule({ cache: 'contextual' })( ... ); 

const isSelf = rule({ cache: 'contextual' })(
  async (parent: any, args: any, ctx: any, info: any) => {
    const targetUserId = args.id || parent?.userId || parent?.id; 
    if (!ctx.user || !targetUserId || ctx.user.id !== targetUserId) {
        return new Error('Cannot access resource belonging to another user!');
    }
    return true;
  }
);

const hasPermission = (permission: string) => {
  return rule({ cache: 'contextual' })(async (parent: any, args: any, ctx: any, info: any) => {
    if (!ctx.user || !ctx.user.permissions || !ctx.user.permissions.includes(permission)) {
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
    viewerProfile: isAuthenticated, 
    userById: and(isAuthenticated, or(isAdmin, isSelf)), 

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

    // E-commerce Query Rules
    shops: and(isAuthenticated, hasPermission('list:shops')),
    shop: and(isAuthenticated, hasPermission('view:shop_details')),
    products: allow, product: allow, productBySku: allow,
    currencies: allow, currency: allow, currencyByCode: allow,
    productCategories: allow, 
    taxes: and(isAuthenticated, hasPermission('view:taxes')),
    orders: and(isAuthenticated, hasPermission('list:orders')), 
    order: and(isAuthenticated, or(hasPermission('view:any_order'), hasPermission('view:own_orders'))), // Simplified, owner check would be better
    paymentProviders: and(isAuthenticated, hasPermission('manage:payment_settings')),
    payments: and(isAuthenticated, hasPermission('view:payments')),
    customers: and(isAuthenticated, hasPermission('manage:customers')), 
    discounts: and(isAuthenticated, hasPermission('manage:discounts')), 
    validateDiscount: isAuthenticated, 
    reviews: allow, 

    // Calendar / Appointment Query Rules
    location: allow, // Publicly viewable location details
    locations: allow, // Publicly listable locations
    serviceCategory: allow, // Publicly viewable service category details
    serviceCategories: allow, // Publicly listable service categories
    service: allow, // Publicly viewable service details
    services: allow, // Publicly listable services
    staffProfile: and(isAuthenticated, hasPermission('view:staff_profile')), // Needs auth & permission
    staffProfiles: and(isAuthenticated, hasPermission('list:staff_profiles')), // Needs auth & permission
    bookings: and(isAuthenticated, hasPermission('list:all_bookings')), // Needs auth & permission (for admin/staff)
                                                                      // User's own bookings might be a different query or rule
    globalBookingRule: and(isAuthenticated, hasPermission('view:booking_rules')), // Needs auth & permission
    availableSlots: allow, // Typically public to allow booking process
    staffForService: allow, // Typically public

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
    updateAppointment: and(isAuthenticated, or(hasPermission('update:any_booking'), hasPermission('update:own_booking'))), // Assuming updateAppointment maps to these permissions
    deleteAppointment: and(isAuthenticated, or(hasPermission('delete:any_booking'), hasPermission('delete:own_booking'))), // Assuming deleteAppointment maps to these
    assignStaffToService: and(isAuthenticated, hasPermission('assign:staff_to_service')),
    removeStaffFromService: and(isAuthenticated, hasPermission('assign:staff_to_service')), // Same perm as assign
    assignStaffToLocation: and(isAuthenticated, hasPermission('assign:staff_to_location')),
    removeStaffFromLocation: and(isAuthenticated, hasPermission('assign:staff_to_location')), // Same perm as assign

    '*': isAuthenticated, 
  },
  User: { 
    email: or(isSelf, isAdmin),
  },
  CMSSection: { 
    components: isAuthenticated, 
  },
  Page: {
    sections: isAuthenticated, 
  }
  // TODO: Add Type specific rules for Calendar/Appointment models if needed
}, { 
  allowExternalErrors: true, 
  debug: process.env.NODE_ENV === 'development',
  fallbackRule: deny, 
  fallbackError: (error: any, parent: any, args: any, context: any, info: any) => {
    const pathKey = info.path?.key || 'unknown path';
    if (error && error.message && error.message !== 'Not Authorised!') { 
      console.error(`GraphQL Shield Triggered Error at path '${pathKey}':`, error.message);
      return error; 
    }
    return new GraphQLError(`Not authorized to access '${pathKey}'. Access denied.`, {
      extensions: { code: 'FORBIDDEN' }
    });
  }
});
