import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Scalar types
  scalar DateTime
  scalar JSON

  # Enum types for Page
  enum PageType {
    CONTENT LANDING BLOG PRODUCT CATEGORY TAG HOME CONTACT ABOUT CUSTOM
  }
  enum ScrollType { NORMAL SMOOTH }

  # --------------- BOOKING MODULE ENUMS --- V1 ---
  enum DayOfWeek { MONDAY TUESDAY WEDNESDAY THURSDAY FRIDAY SATURDAY SUNDAY }
  enum ScheduleType { REGULAR_HOURS OVERRIDE_HOURS BREAK TIME_OFF SPECIAL_EVENT BLACKOUT_DATE }
  enum BookingStatus { PENDING CONFIRMED CANCELLED COMPLETED NO_SHOW RESCHEDULED }
  # --------------- END BOOKING MODULE ENUMS --- V1 ---

  # Forward declaration for StaffProfile for User type
  type StaffProfile

  # User related types
  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    phoneNumber: String
    profileImageUrl: String
    role: Role
    isActive: Boolean
    createdAt: String 
    updatedAt: String 
    notifications: [Notification!]
    settings: UserSettings
    # For Booking Module
    staffProfile: StaffProfile 
    bookings: [Booking!] 
  }

  # --------------- BOOKING MODULE TYPES (Placeholders and Full Defs) --- V1 ---
  # Placeholder for StaffLocationAssignment (if it's only a join table without extra fields, it might not need a GQL type)
  # type StaffLocationAssignment { id: ID! }
  
  type Booking {
    id: ID!
    userId: ID # ID of the registered user who booked
    user: User # Resolved from userId
    customerName: String # Name of the customer (guest or registered)
    customerEmail: String # Email of the customer
    customerPhone: String # Phone of the customer
    serviceId: ID!
    service: Service! # Resolved from serviceId
    locationId: ID!
    location: Location! # Resolved from locationId
    staffProfileId: ID # Optional: ID of the staff member
    staffProfile: StaffProfile # Resolved from staffProfileId
    bookingDate: DateTime! # Date of the appointment
    startTime: DateTime! # Start date and time of the appointment
    endTime: DateTime! # End date and time of the appointment
    status: BookingStatus!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type BookingRule { # Placeholder for now - Will be defined later if needed for booking list/details
    id: ID!
    # advanceBookingDaysMax: Int
  }

  type StaffSchedule {
    id: ID!
    location: Location # Optional, if schedule is location-specific
    date: DateTime # For specific date overrides/time-off
    dayOfWeek: DayOfWeek # For recurring weekly schedules
    startTime: String! # Format "HH:MM"
    endTime: String! # Format "HH:MM"
    scheduleType: ScheduleType! 
    isAvailable: Boolean!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type StaffProfile {
    id: ID!
    userId: ID!
    user: User! 
    bio: String
    specializations: [String!]! 
    createdAt: DateTime!
    updatedAt: DateTime!
    schedules: [StaffSchedule!] 
    assignedServices: [Service!]! 
    locationAssignments: [Location!]! # Resolves to [Location!] via StaffLocationAssignment table
    # bookings: [Booking!] 
  }
  # --------------- END BOOKING MODULE TYPES --- V1 ---


  # Role and Permission related types
  type Role {
    id: ID!
    name: String!
    description: String
    permissions: [Permission!]
    createdAt: String
    updatedAt: String
  }

  type Permission {
    id: ID!
    name: String!
    description: String
    roles: [Role!]
    createdAt: String
    updatedAt: String
  }

  type RoleWithCounts {
    id: ID!
    name: String!
    description: String
    userCount: Int
    permissionCount: Int
    createdAt: String
    updatedAt: String
  }

  type ContactFormSubmission {
    id: ID!
    firstName: String!
    lastName: String!
    email: String!
    createdAt: String!
  }
  input ContactFormSubmissionInput {
    firstName: String!
    lastName: String!
    email: String!
  }

  input CreateUserInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    phoneNumber: String
    role: String!
  }
  input UpdateUserInput {
    email: String
    firstName: String
    lastName: String
    password: String
    phoneNumber: String
    role: String
    roleId: ID
    isActive: Boolean
  }
  input ProfileUpdateInput {
    firstName: String
    lastName: String
    email: String
    phoneNumber: String
    currentPassword: String
    newPassword: String
  }
  input UpdateUserProfileInput {
    firstName: String
    lastName: String
    phoneNumber: String
    bio: String
    position: String
    department: String
  }

  type Document {
    id: ID!
    title: String!
    description: String
    status: DocumentStatus!
    fileUrl: String
    createdAt: String!
    updatedAt: String!
    userId: ID!
    user: User
  }
  enum DocumentStatus { DRAFT PENDING_REVIEW APPROVED REJECTED }
  type DocumentStatusCount { status: String! count: Int! }
  input CreateDocumentInput {
    title: String!
    description: String
    fileUrl: String
    status: DocumentStatus
  }
  input UpdateDocumentInput {
    title: String
    description: String
    fileUrl: String
    status: DocumentStatus
  }

  type TimeEntry {
    id: ID!
    date: String!
    hours: Float!
    description: String!
    projectId: ID
    project: Project
    userId: ID!
    user: User
    createdAt: String!
    updatedAt: String!
  }
  type DailyTimeEntry { day: String! hours: Float! }
  input CreateTimeEntryInput {
    date: String!
    hours: Float!
    description: String!
    projectId: ID
  }
  input UpdateTimeEntryInput {
    date: String
    hours: Float
    description: String
    projectId: ID
  }

  type Project {
    id: ID!
    name: String!
    description: String
    status: ProjectStatus!
    clientId: ID
    client: Client
    createdAt: String!
    updatedAt: String!
  }
  enum ProjectStatus { ACTIVE COMPLETED ON_HOLD }
  input CreateProjectInput {
    name: String!
    description: String
    status: ProjectStatus
    clientId: ID
  }
  input UpdateProjectInput {
    name: String
    description: String
    status: ProjectStatus
    clientId: ID
  }

  type Client {
    id: ID!
    name: String!
    email: String
    phone: String
    address: String
    createdAt: String!
    updatedAt: String!
  }

  type Appointment {
    id: ID!
    title: String!
    description: String
    startTime: String!
    endTime: String!
    location: String 
    isVirtual: Boolean
    meetingUrl: String
    userId: ID!
    user: User
    clientId: ID
    client: Client
    createdAt: String!
    updatedAt: String!
  }
  input CreateAppointmentInput {
    title: String!
    description: String
    startTime: String!
    endTime: String!
    location: String
    isVirtual: Boolean
    meetingUrl: String
    clientId: ID
  }
  input UpdateAppointmentInput {
    title: String
    description: String
    startTime: String
    endTime: String
    location: String
    isVirtual: Boolean
    meetingUrl: String
    clientId: ID
  }

  type Task {
    id: ID!
    title: String!
    description: String
    dueDate: String
    status: TaskStatus!
    userId: ID!
    user: User
    projectId: ID
    project: Project
    createdAt: String!
    updatedAt: String!
  }
  enum TaskStatus { NOT_STARTED IN_PROGRESS COMPLETED CANCELLED }
  type TaskStatusCount { status: String! count: Int! }
  input CreateTaskInput {
    title: String!
    description: String
    dueDate: String
    status: TaskStatus
    projectId: ID
  }
  input UpdateTaskInput {
    title: String
    description: String
    dueDate: String
    status: TaskStatus
    projectId: ID
  }

  type Performance {
    id: ID!
    userId: ID!
    user: User
    period: String!
    completedTasks: Int!
    totalHours: Float!
    efficiency: Float
    notes: String
    createdAt: String!
    updatedAt: String!
  }
  input CreatePerformanceInput {
    period: String!
    completedTasks: Int!
    totalHours: Float!
    efficiency: Float
    notes: String
  }
  input UpdatePerformanceInput {
    period: String
    completedTasks: Int
    totalHours: Float
    efficiency: Float
    notes: String
  }

  type Notification {
    id: ID!
    userId: ID!
    user: User
    type: String!
    title: String!
    message: String!
    isRead: Boolean!
    relatedItemId: String
    relatedItemType: String
    createdAt: String!
    updatedAt: String!
  }
  enum NotificationType { DOCUMENT TASK APPOINTMENT SYSTEM }
  input CreateNotificationInput {
    userId: ID!
    type: String!
    title: String!
    message: String!
    relatedItemId: String
    relatedItemType: String
  }
  input UpdateNotificationInput { isRead: Boolean }

  type UserSettings {
    id: ID!
    userId: ID! 
    user: User 
    emailNotifications: Boolean!
    theme: String!
    language: String!
    timeFormat: String!
    dateFormat: String!
    createdAt: String! 
    updatedAt: String! 
  }
  input UpdateUserSettingsInput {
    emailNotifications: Boolean
    theme: String
    language: String
    timeFormat: String
    dateFormat: String
  }

  type SiteSettings {
    id: ID!
    siteName: String!
    siteDescription: String
    logoUrl: String
    faviconUrl: String
    primaryColor: String
    secondaryColor: String
    googleAnalyticsId: String
    facebookPixelId: String
    customCss: String
    customJs: String
    contactEmail: String
    contactPhone: String
    address: String
    accentColor: String
    defaultLocale: String!
    footerText: String
    maintenanceMode: Boolean!
    metaDescription: String
    metaTitle: String
    ogImage: String
    socialLinks: String 
    supportedLocales: [String!]!
    twitterCardType: String
    twitterHandle: String
    createdAt: String! 
    updatedAt: String! 
  }
  input UpdateSiteSettingsInput {
    siteName: String
    siteDescription: String
    logoUrl: String
    faviconUrl: String
    primaryColor: String
    secondaryColor: String
    googleAnalyticsId: String
    facebookPixelId: String
    customCss: String
    customJs: String
    contactEmail: String
    contactPhone: String
    address: String
    accentColor: String
    defaultLocale: String
    footerText: String
    maintenanceMode: Boolean
    metaDescription: String
    metaTitle: String
    ogImage: String
    socialLinks: String 
    supportedLocales: [String!]
    twitterCardType: String
    twitterHandle: String
  }

  type HelpArticle {
    id: ID!
    title: String!
    content: String!
    category: String!
    tags: [String!]
    createdAt: String!
    updatedAt: String!
  }
  input CreateHelpArticleInput {
    title: String!
    content: String!
    category: String!
    tags: [String!]
  }
  input UpdateHelpArticleInput {
    title: String
    content: String
    category: String
    tags: [String!]
  }

  type ExternalLink {
    id: ID!
    name: String!
    url: String!
    icon: String
    description: String
    isActive: Boolean!
    order: Int
    createdAt: String
    updatedAt: String
    createdBy: ID
    accessType: AccessControlType!
    allowedRoles: [String]
    allowedUsers: [ID]
    deniedUsers: [ID]
  }
  enum AccessControlType { PUBLIC ROLES USERS MIXED }
  type AccessControl {
    type: AccessControlType!
    allowedRoles: [String]
    allowedUsers: [ID]
    deniedUsers: [ID]
  }
  type LinkAccessStatus {
    linkId: ID!
    linkName: String!
    hasAccess: Boolean!
    accessType: AccessControlType
    isInAllowedRoles: Boolean
    isInAllowedUsers: Boolean
    isInDeniedUsers: Boolean
  }
  input AccessControlInput {
    type: AccessControlType!
    allowedRoles: [String]
    allowedUsers: [ID]
    deniedUsers: [ID]
  }
  input ExternalLinkInput {
    name: String!
    url: String!
    icon: String
    description: String
    isActive: Boolean
    order: Int
    accessControl: AccessControlInput
  }
  input CreateExternalLinkInput {
    name: String!
    url: String!
    icon: String!
    description: String
    isActive: Boolean
    order: Int
  }
  input UpdateExternalLinkInput {
    name: String
    url: String
    icon: String
    description: String
    isActive: Boolean
    order: Int
  }

  type DashboardStats {
    totalDocuments: Int!
    documentsThisMonth: Int!
    totalAppointments: Int!
    appointmentsThisWeek: Int!
    completedTasks: Int!
    pendingTasks: Int!
    totalHoursLogged: Float!
    hoursLoggedThisWeek: Float!
  }

  type AuthPayload { token: String! user: User! }

  input RoleCreateInput { name: String! description: String }
  input PermissionInput { name: String! description: String roleId: ID }

  type UserPermission {
    id: ID!
    userId: String!
    permissionName: String!
    granted: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  input UserPermissionInput {
    userId: ID!
    permissionName: String!
    granted: Boolean
  }

  type SectionData { components: [Component!]! lastUpdated: String }
  type Component { id: ID! type: String! data: JSON! }
  type SaveSectionResult { success: Boolean! message: String lastUpdated: String }
  
  type CMSSection {
    id: ID!
    sectionId: String!
    name: String
    description: String
    backgroundImage: String
    backgroundType: String
    lastUpdated: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
    createdBy: String
    components: [SectionComponent!]
    order: Int
  }
  type SectionComponent {
    id: ID!
    sectionId: String!
    componentId: String!
    order: Int!
    data: JSON
    component: CMSComponent
  }
  type CMSComponent {
    id: ID!
    name: String!
    slug: String!
    description: String
    category: String
    icon: String
    schema: JSON
    isActive: Boolean
    createdAt: DateTime
    updatedAt: DateTime
  }
  
  type Page {
    id: ID!
    title: String!
    slug: String!
    description: String
    template: String
    isPublished: Boolean!
    publishDate: DateTime
    featuredImage: String
    metaTitle: String
    metaDescription: String
    parentId: String
    order: Int
    pageType: PageType!
    locale: String
    scrollType: ScrollType
    isDefault: Boolean
    createdAt: DateTime!
    updatedAt: DateTime!
    sections: [CMSSection!]
    seo: PageSEO
    parent: Page
    children: [Page!]
  }
  type PageSEO {
    id: ID!
    pageId: ID!
    title: String
    description: String
    keywords: String
    ogTitle: String
    ogDescription: String
    ogImage: String
    twitterTitle: String
    twitterDescription: String
    twitterImage: String
    canonicalUrl: String
    structuredData: JSON
    createdAt: DateTime
    updatedAt: DateTime
  }
  input CreatePageInput {
    title: String!
    slug: String!
    description: String
    template: String
    isPublished: Boolean
    publishDate: DateTime
    featuredImage: String
    metaTitle: String
    metaDescription: String
    parentId: String
    order: Int
    pageType: PageType
    locale: String
    scrollType: ScrollType
    isDefault: Boolean
    seo: PageSEOInput
    sections: [ID!]
  }
  type PageResult { success: Boolean! message: String! page: Page }

  type Menu {
    id: ID!
    name: String!
    location: String
    createdAt: DateTime!
    updatedAt: DateTime!
    items: [MenuItem!]
    headerStyle: HeaderStyle
    footerStyle: FooterStyle
  }
  input MenuInput {
    name: String!
    location: String
    headerStyle: HeaderStyleInput
    footerStyle: FooterStyleInput
  }
  type MenuItem {
    id: ID!
    menuId: String!
    parentId: String
    title: String!
    url: String
    pageId: String
    target: String
    icon: String
    order: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    children: [MenuItem!]
    parent: MenuItem
    menu: Menu
    page: PageBasic
  }
  type PageBasic { id: ID! title: String! slug: String! }
  input MenuItemInput {
    menuId: String!
    parentId: String
    title: String!
    url: String
    pageId: String
    target: String
    icon: String
  }
  input MenuItemOrderInput { newOrder: Int! }
  input MenuItemOrderUpdate { id: ID! order: Int! parentId: String }

  type CMSComponentResult { success: Boolean! message: String component: CMSComponent }
  input ComponentInput { id: ID! type: String! data: JSON! }
  input SaveSectionInput { sectionId: ID! components: [ComponentInput!]! }
  input CreateCMSComponentInput {
    name: String!
    slug: String!
    description: String
    category: String
    schema: JSON
    icon: String
  }
  input UpdateCMSComponentInput {
    name: String
    description: String
    category: String
    schema: JSON
    icon: String
    isActive: Boolean
  }
  input UpdateCMSSectionInput {
    name: String
    description: String
    backgroundImage: String
    backgroundType: String
    gridDesign: String
  }
  input CreateCMSSectionInput {
    sectionId: String!
    name: String!
    description: String
    backgroundImage: String
    backgroundType: String
    gridDesign: String
  }
  type CMSSectionResult { success: Boolean! message: String! section: CMSSection }
  input UpdatePageInput {
    title: String
    slug: String
    description: String
    template: String
    isPublished: Boolean
    publishDate: DateTime
    featuredImage: String
    metaTitle: String
    metaDescription: String
    parentId: String
    order: Int
    pageType: String
    locale: String
    scrollType: String
    isDefault: Boolean
    seo: PageSEOInput
    sections: [ID!]
  }
  input PageSEOInput {
    title: String
    description: String
    keywords: String
    ogTitle: String
    ogDescription: String
    ogImage: String
    twitterTitle: String
    twitterDescription: String
    twitterImage: String
    canonicalUrl: String
    structuredData: JSON
  }
  type PageMutationResponse { success: Boolean! message: String! page: Page }

  enum FormFieldType {
    TEXT TEXTAREA EMAIL PASSWORD NUMBER PHONE DATE TIME DATETIME SELECT MULTISELECT RADIO CHECKBOX TOGGLE SLIDER RATING FILE HIDDEN HEADING PARAGRAPH DIVIDER SPACER HTML CAPTCHA SIGNATURE AUTOCOMPLETE ADDRESS
  }
  enum SubmissionStatus { RECEIVED PROCESSING COMPLETED REJECTED SPAM }

  type Form {
    id: ID!
    title: String!
    description: String
    slug: String!
    isMultiStep: Boolean!
    isActive: Boolean!
    successMessage: String
    redirectUrl: String
    submitButtonText: String!
    submitButtonStyle: String
    layout: String
    styling: JSON
    pageId: String
    createdById: String!
    updatedById: String
    createdAt: DateTime!
    updatedAt: DateTime!
    fields: [FormField!]
    steps: [FormStep!]
    submissions: [FormSubmission!]
    page: Page
  }
  type FormStep {
    id: ID!
    formId: String!
    title: String!
    description: String
    order: Int!
    isVisible: Boolean!
    validationRules: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
    form: Form!
    fields: [FormField!]
  }
  type FormField {
    id: ID!
    formId: String
    stepId: String
    label: String!
    name: String!
    type: FormFieldType!
    placeholder: String
    defaultValue: String # For Checkbox group, this will be a JSON string array
    helpText: String
    isRequired: Boolean!
    order: Int!
    options: JSON # For select, multiselect, radio, checkbox group items, slider min/max, etc.
    validationRules: JSON
    styling: JSON
    width: Int
    createdAt: DateTime!
    updatedAt: DateTime!
    form: Form
    step: FormStep
  }
  type FormSubmission {
    id: ID!
    formId: String!
    data: JSON!
    metadata: JSON
    status: SubmissionStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    form: Form!
  }

  input FormInput {
    title: String!
    description: String
    slug: String!
    isMultiStep: Boolean
    isActive: Boolean
    successMessage: String
    redirectUrl: String
    submitButtonText: String
    submitButtonStyle: String
    layout: String
    styling: JSON
    pageId: String
  }
  input FormStepInput {
    formId: String!
    title: String!
    description: String
    order: Int
    isVisible: Boolean
    validationRules: JSON
  }
  input FormFieldInput {
    formId: String
    stepId: String
    label: String!
    name: String!
    type: FormFieldType!
    placeholder: String
    defaultValue: String # For Checkbox group, send JSON string array
    helpText: String
    isRequired: Boolean
    order: Int
    options: JSON
    validationRules: JSON
    styling: JSON
    width: Int
  }
  input FormSubmissionInput { formId: String! data: JSON! metadata: JSON }
  input UpdateFormInput {
    title: String
    description: String
    slug: String
    isMultiStep: Boolean
    isActive: Boolean
    successMessage: String
    redirectUrl: String
    submitButtonText: String
    submitButtonStyle: String
    layout: String
    styling: JSON
    pageId: String
  }
  input UpdateFormStepInput {
    title: String
    description: String
    order: Int
    isVisible: Boolean
    validationRules: JSON
  }
  input UpdateFormFieldInput {
    formId: String
    stepId: String
    label: String
    name: String
    type: FormFieldType
    placeholder: String
    defaultValue: String # For Checkbox group, send JSON string array
    helpText: String
    isRequired: Boolean
    order: Int
    options: JSON
    validationRules: JSON
    styling: JSON
    width: Int
  }

  type FormResult { success: Boolean! message: String form: Form }
  type FormStepResult { success: Boolean! message: String step: FormStep }
  type FormFieldResult { success: Boolean! message: String field: FormField }
  type FormSubmissionResult { success: Boolean! message: String submission: FormSubmission }
  type FormFieldOrderResult { success: Boolean! message: String }
  input FieldOrderUpdate { id: ID! order: Int! }

  # Root Query
  type Query {
    me: User
    user(id: ID!): User
    users: [User!]
    
    roles: [Role]
    role(id: ID!): Role
    rolesWithCounts: [RoleWithCounts]
    permissions: [Permission]
    rolePermissions(roleId: ID!): [Permission]
    
    contactFormSubmissions: [ContactFormSubmission!]
    
    dashboardStats: DashboardStats
    documentsByStatus: [DocumentStatusCount!]
    timeEntriesByDay: [DailyTimeEntry!]
    tasksByStatus: [TaskStatusCount!]
    
    documents: [Document!]
    document(id: ID!): Document
    documentStatusCounts: [DocumentStatusCount!]
    
    timeEntries: [TimeEntry!]
    timeEntry(id: ID!): TimeEntry
    
    appointments: [Appointment!]
    appointment(id: ID!): Appointment
    upcomingAppointments(count: Int): [Appointment!]
    
    tasks: [Task!]
    task(id: ID!): Task
    
    projects: [Project!]
    project(id: ID!): Project
    
    clients: [Client!]
    client(id: ID!): Client

    performances: [Performance!]
    performance(id: ID!): Performance
    currentPerformance: Performance
    
    notifications: [Notification!]
    notification(id: ID!): Notification
    unreadNotificationsCount: Int
    allNotifications: [Notification!]
    
    userSettings: UserSettings
    getSiteSettings: SiteSettings
    
    helpArticles: [HelpArticle!]
    helpArticle(id: ID!): HelpArticle
    helpArticlesByCategory(category: String!): [HelpArticle!]
    searchHelpArticles(query: String!): [HelpArticle!]

    externalLinks: [ExternalLink]
    externalLink(id: ID!): ExternalLink
    activeExternalLinks: [ExternalLink]
    activeExternalLinksAs(roleId: String!): [ExternalLink]
    userLinkAccessStatus: [LinkAccessStatus]

    userSpecificPermissions(userId: ID!): [UserPermission!]!

    getSectionComponents(sectionId: ID!): SectionData
    getAllCMSSections: [CMSSection!]!
    
    getAllCMSComponents: [CMSComponent!]!
    getCMSComponent(id: ID!): CMSComponent
    getCMSComponentsByType(type: String!): [CMSComponent!]!
    
    getAllCMSPages: [Page!]!
    getPageBySlug(slug: String!): Page
    getDefaultPage(locale: String!): Page
    getPagesUsingSectionId(sectionId: ID!): [Page!]!

    menus: [Menu!]!
    menu(id: ID!): Menu
    menuByName(name: String!): Menu
    menuByLocation(location: String!): Menu
    pages: [PageBasic!]! 

    forms: [Form!]!
    form(id: ID!): Form
    formBySlug(slug: String!): Form
    formSteps(formId: ID!): [FormStep!]!
    formStep(id: ID!): FormStep
    formFields(formId: ID!, stepId: ID): [FormField!]!
    formField(id: ID!): FormField
    formSubmissions(formId: ID!, limit: Int, offset: Int): [FormSubmission!]!
    formSubmission(id: ID!): FormSubmission
    formSubmissionStats(formId: ID!): JSON

    blogs: [Blog!]!
    blog(id: ID!): Blog
    blogBySlug(slug: String!): Blog
    post(id: ID!): Post
    posts(filter: PostFilter): [Post!]!
    postBySlug(slug: String!): Post

    media: [Media!]!
    mediaItem(id: ID!): Media
    mediaByType(fileType: String!): [Media!]!
    mediaInFolder(folder: String): [Media!]!

    # Booking Module Queries - V1
    location(id: ID!): Location
    locations: [Location!]!
    serviceCategory(id: ID!): ServiceCategory
    serviceCategories: [ServiceCategory!]!
    service(id: ID!): Service
    services: [Service!]!
    staffProfile(id: ID!): StaffProfile # New
    staffProfiles: [StaffProfile!]!   # New

    bookings(filter: BookingFilterInput, pagination: PaginationInput): PaginatedBookings!
  }

  input PaginationInput {
    page: Int = 1
    pageSize: Int = 10
  }

  type PaginatedBookings {
    items: [Booking!]!
    totalCount: Int!
    page: Int!
    pageSize: Int!
  }

  input BookingFilterInput {
    dateFrom: DateTime
    dateTo: DateTime
    status: BookingStatus
    locationId: ID
    serviceId: ID
    staffProfileId: ID
    userId: ID # Filter by registered customer
    customerEmail: String # Filter by customer email (guest or registered)
    searchQuery: String # General search for customer name, email, notes etc.
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!, firstName: String!, lastName: String!, phoneNumber: String): AuthPayload!
    
    createContactFormSubmission(input: ContactFormSubmissionInput!): ContactFormSubmission!
    
    createUser(input: CreateUserInput!): User
    updateUser(id: ID!, input: UpdateUserInput!): User
    deleteUser(id: ID!): Boolean
    updateUserProfile(input: UpdateUserProfileInput!): User
    
    createDocument(input: CreateDocumentInput!): Document!
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document!
    deleteDocument(id: ID!): Boolean!
    
    createTimeEntry(input: CreateTimeEntryInput!): TimeEntry!
    updateTimeEntry(id: ID!, input: UpdateTimeEntryInput!): TimeEntry!
    deleteTimeEntry(id: ID!): Boolean!
    
    createAppointment(input: CreateAppointmentInput!): Appointment!
    updateAppointment(id: ID!, input: UpdateAppointmentInput!): Appointment!
    deleteAppointment(id: ID!): Boolean!
    
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Boolean!
    
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!

    createPerformance(input: CreatePerformanceInput!): Performance!
    updatePerformance(id: ID!, input: UpdatePerformanceInput!): Performance!
    deletePerformance(id: ID!): Boolean!
    
    createNotification(input: CreateNotificationInput!): Notification!
    updateNotification(id: ID!, input: UpdateNotificationInput!): Notification!
    markAllNotificationsAsRead: Boolean
    deleteNotification(id: ID!): Boolean
    deleteMultipleNotifications(ids: [ID!]!): Int
    
    updateUserSettings(input: UpdateUserSettingsInput!): UserSettings!
    updateSiteSettings(input: UpdateSiteSettingsInput!): SiteSettings
    
    createHelpArticle(input: CreateHelpArticleInput!): HelpArticle!
    updateHelpArticle(id: ID!, input: UpdateHelpArticleInput!): HelpArticle!
    deleteHelpArticle(id: ID!): Boolean!

    createExternalLink(input: ExternalLinkInput!): ExternalLink
    updateExternalLink(id: ID!, input: ExternalLinkInput!): ExternalLink
    deleteExternalLink(id: ID!): Boolean
    updateLinkAccess(id: ID!, accessControl: AccessControlInput!): ExternalLink
    
    createRole(input: RoleCreateInput!): Role
    updateRole(id: ID!, input: RoleCreateInput!): Role
    deleteRole(id: ID!): Boolean
    createPermission(input: PermissionInput!): Permission
    assignPermissionToRole(roleId: ID!, permissionId: ID!): Permission
    removePermissionFromRole(roleId: ID!, permissionId: ID!): Boolean

    setUserPermission(input: UserPermissionInput!): UserPermission!

    saveSectionComponents(input: SaveSectionInput!): SaveSectionResult
    deleteCMSSection(sectionId: ID!): SaveSectionResult
    updateCMSSection(sectionId: ID!, input: UpdateCMSSectionInput!): SaveSectionResult
    
    createCMSComponent(input: CreateCMSComponentInput!): CMSComponentResult
    updateCMSComponent(id: ID!, input: UpdateCMSComponentInput!): CMSComponentResult
    deleteCMSComponent(id: ID!): SaveSectionResult
    
    createPage(input: CreatePageInput!): PageResult
    updatePage(id: ID!, input: UpdatePageInput!): PageResult
    deletePage(id: ID!): PageResult
    
    createCMSSection(input: CreateCMSSectionInput!): CMSSectionResult
    associateSectionToPage(pageId: ID!, sectionId: ID!, order: Int!): PageResult
    dissociateSectionFromPage(pageId: ID!, sectionId: ID!): PageResult

    createMenu(input: MenuInput!): Menu
    updateMenu(id: ID!, input: MenuInput!): Menu
    deleteMenu(id: ID!): Boolean
    
    createMenuItem(input: MenuItemInput!): MenuItem
    updateMenuItem(id: ID!, input: MenuItemInput!): MenuItem
    deleteMenuItem(id: ID!): Boolean
    updateMenuItemOrder(id: ID!, input: MenuItemOrderInput!): MenuItem
    updateMenuItemsOrder(items: [MenuItemOrderUpdate!]!): Boolean

    updateHeaderStyle(menuId: ID!, input: HeaderStyleInput!): HeaderStyleResult!

    updateFooterStyle(menuId: ID!, input: FooterStyleInput!): FooterStyleResult!

    createForm(input: FormInput!): FormResult!
    updateForm(id: ID!, input: UpdateFormInput!): FormResult!
    deleteForm(id: ID!): FormResult!
    
    createFormStep(input: FormStepInput!): FormStepResult!
    updateFormStep(id: ID!, input: UpdateFormStepInput!): FormStepResult!
    deleteFormStep(id: ID!): FormStepResult!
    
    createFormField(input: FormFieldInput!): FormFieldResult!
    updateFormField(id: ID!, input: UpdateFormFieldInput!): FormFieldResult!
    deleteFormField(id: ID!): FormFieldResult!
    updateFieldOrders(updates: [FieldOrderUpdate!]!): FormFieldOrderResult!
    
    submitForm(input: FormSubmissionInput!): FormSubmissionResult!
    updateFormSubmissionStatus(id: ID!, status: SubmissionStatus!): FormSubmissionResult!
    deleteFormSubmission(id: ID!): FormSubmissionResult!

    createBlog(input: BlogInput!): BlogResult!
    updateBlog(id: ID!, input: BlogInput!): BlogResult!
    deleteBlog(id: ID!): BlogResult!
    
    createPost(input: CreatePostInput!): PostResult!
    updatePost(id: ID!, input: UpdatePostInput!): PostResult!
    deletePost(id: ID!): PostResult!

    createMedia(input: CreateMediaInput!): MediaResult!
    updateMedia(id: ID!, input: UpdateMediaInput!): MediaResult!
    deleteMedia(id: ID!): MediaResult!
    associateMediaToPost(postId: ID!, mediaId: ID!): PostResult!
    dissociateMediaFromPost(postId: ID!, mediaId: ID!): PostResult!

    # Booking Module Mutations - V1
    createLocation(input: CreateLocationInput!): Location!
    updateLocation(id: ID!, input: UpdateLocationInput!): Location!
    deleteLocation(id: ID!): Location 

    createServiceCategory(input: CreateServiceCategoryInput!): ServiceCategory!
    updateServiceCategory(id: ID!, input: UpdateServiceCategoryInput!): ServiceCategory!
    deleteServiceCategory(id: ID!): ServiceCategory 

    createService(input: CreateServiceInput!): Service!
    updateService(id: ID!, input: UpdateServiceInput!): Service!
    deleteService(id: ID!): Service 

    # Staff Mutations
    createStaffProfile(input: CreateStaffProfileInput!): StaffProfile!
    updateStaffProfile(id: ID!, input: UpdateStaffProfileInput!): StaffProfile!
    deleteStaffProfile(id: ID!): StaffProfile 
    updateStaffSchedule(staffProfileId: ID!, schedule: [StaffScheduleInput!]!): [StaffSchedule!]!
  }

  type HeaderStyle {
    id: ID!
    menuId: String!
    transparency: Int
    headerSize: HeaderSize
    menuAlignment: MenuAlignment
    menuButtonStyle: MenuButtonStyle
    mobileMenuStyle: MobileMenuStyle
    mobileMenuPosition: MobileMenuPosition
    transparentHeader: Boolean
    borderBottom: Boolean
    fixedHeader: Boolean
    advancedOptions: JSON
    createdAt: DateTime
    updatedAt: DateTime
  }

  type FooterStyle {
    id: ID!
    menuId: String!
    transparency: Int
    columnLayout: String
    socialAlignment: String
    borderTop: Boolean
    alignment: String
    padding: String
    width: String
    advancedOptions: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum FooterColumnLayout { stacked grid flex }
  enum SocialAlignment { left center right }
  enum FooterAlignment { left center right }
  enum FooterPadding { small medium large }
  enum FooterWidth { full container narrow }

  input FooterStyleInput {
    transparency: Int
    columnLayout: String
    socialAlignment: String
    borderTop: Boolean
    alignment: String
    padding: String
    width: String
    advancedOptions: JSON
  }

  enum HeaderSize { sm md lg }
  enum MenuAlignment { left center right }
  enum MenuButtonStyle { default filled outline }
  enum MobileMenuStyle { fullscreen dropdown sidebar }
  enum MobileMenuPosition { left right }

  input HeaderStyleInput {
    transparency: Int
    headerSize: HeaderSize
    menuAlignment: MenuAlignment
    menuButtonStyle: MenuButtonStyle
    mobileMenuStyle: MobileMenuStyle
    mobileMenuPosition: MobileMenuPosition
    transparentHeader: Boolean
    borderBottom: Boolean
    fixedHeader: Boolean
    advancedOptions: JSON
  }
  input HeaderAdvancedOptionsInput {
    glassmorphism: Boolean
    blur: Int
    shadow: String
    animation: String
    customClass: String
    borderRadius: String
  }
  type HeaderStyleResult { success: Boolean! message: String! headerStyle: HeaderStyle }
  type FooterStyleResult { success: Boolean! message: String! footerStyle: FooterStyle }

  type Blog {
    id: ID!
    title: String!
    description: String
    slug: String!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    posts: [Post!]
  }
  type Post {
    id: ID!
    title: String!
    slug: String!
    content: String!
    excerpt: String
    featuredImage: String
    featuredImageId: String
    featuredImageMedia: Media
    status: PostStatus!
    publishedAt: DateTime
    blogId: String!
    authorId: String!
    metaTitle: String
    metaDescription: String
    tags: [String!]!
    categories: [String!]!
    readTime: Int
    createdAt: DateTime!
    updatedAt: DateTime!
    blog: Blog
    author: User
    media: [Media!]!
  }
  type Media {
    id: ID!
    title: String
    description: String
    fileUrl: String!
    fileName: String!
    fileSize: Int
    fileType: String
    altText: String
    cmsSectionId: String
    uploadedById: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    cmsSection: CMSSection
    posts: [Post!]!
    featuredInPosts: [Post!]!
  }
  enum PostStatus { DRAFT PUBLISHED ARCHIVED }
  input BlogInput {
    title: String!
    description: String
    slug: String!
    isActive: Boolean
  }
  input CreatePostInput {
    title: String!
    slug: String!
    content: String!
    excerpt: String
    featuredImage: String
    featuredImageId: String
    status: PostStatus
    publishedAt: DateTime
    blogId: String!
    authorId: String!
    metaTitle: String
    metaDescription: String
    tags: [String!]
    categories: [String!]
    readTime: Int
    mediaIds: [String!]
  }
  input UpdatePostInput {
    title: String
    slug: String
    content: String
    excerpt: String
    featuredImage: String
    featuredImageId: String
    status: PostStatus
    publishedAt: DateTime
    metaTitle: String
    metaDescription: String
    tags: [String!]
    categories: [String!]
    readTime: Int
    mediaIds: [String!]
  }
  input MediaInput {
    title: String
    description: String
    fileUrl: String!
    fileName: String!
    fileSize: Int
    fileType: String
    altText: String
  }
  input CreateMediaInput {
    title: String
    description: String
    fileUrl: String!
    fileName: String!
    fileSize: Int
    fileType: String
    altText: String
    cmsSectionId: String
  }
  input UpdateMediaInput {
    title: String
    description: String
    altText: String
  }
  input PostFilter {
    blogId: String
    status: PostStatus
    authorId: String
    tags: [String!]
    categories: [String!]
    search: String
    limit: Int
    offset: Int
  }
  type BlogResult { success: Boolean! message: String! blog: Blog }
  type PostResult { success: Boolean! message: String! post: Post }
  type MediaResult { success: Boolean! message: String! media: Media }

  # --------------- LOCATION (Booking Module) --- V1 ---
  type Location {
    id: ID!
    name: String!
    address: String
    phone: String
    operatingHours: JSON 
    createdAt: DateTime!
    updatedAt: DateTime!
    services: [Service!] 
    staffAssignments: [StaffLocationAssignment!] # Placeholder for now
    bookings: [Booking!] 
    schedules: [StaffSchedule!]
    bookingRules: [BookingRule!]
  }
  input CreateLocationInput {
    name: String!
    address: String
    phone: String
    operatingHours: JSON
  }
  input UpdateLocationInput {
    name: String
    address: String
    phone: String
    operatingHours: JSON
  }
  # --------------- END LOCATION --- V1 ---

  # --------------- SERVICE CATEGORY (Booking Module) --- V1 ---
  type ServiceCategory {
    id: ID!
    name: String! 
    description: String
    displayOrder: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    services: [Service!] 
    parentCategory: ServiceCategory
    childCategories: [ServiceCategory!]
  }
  input CreateServiceCategoryInput {
    name: String!
    description: String
    displayOrder: Int
    parentId: ID 
  }
  input UpdateServiceCategoryInput {
    name: String
    description: String
    displayOrder: Int
    parentId: ID
  }
  # --------------- END SERVICE CATEGORY --- V1 ---

  # --------------- SERVICE (Booking Module) --- V1 ---
  type Service {
    id: ID!
    name: String!
    description: String
    durationMinutes: Int!
    price: Float!
    bufferTimeBeforeMinutes: Int 
    bufferTimeAfterMinutes: Int 
    preparationTimeMinutes: Int 
    cleanupTimeMinutes: Int 
    maxDailyBookingsPerService: Int
    isActive: Boolean! 
    createdAt: DateTime!
    updatedAt: DateTime!
    serviceCategoryId: ID! 
    serviceCategory: ServiceCategory!
    locations: [Location!]! 
    assignedStaff: [StaffProfile!]! # Staff who can perform this service
  }
  input CreateServiceInput {
    name: String!
    description: String
    durationMinutes: Int!
    price: Float!
    bufferTimeBeforeMinutes: Int
    bufferTimeAfterMinutes: Int
    preparationTimeMinutes: Int
    cleanupTimeMinutes: Int
    maxDailyBookingsPerService: Int
    isActive: Boolean
    serviceCategoryId: ID!
    locationIds: [ID!] 
  }
  input UpdateServiceInput {
    name: String
    description: String
    durationMinutes: Int
    price: Float
    bufferTimeBeforeMinutes: Int
    bufferTimeAfterMinutes: Int
    preparationTimeMinutes: Int
    cleanupTimeMinutes: Int
    maxDailyBookingsPerService: Int
    isActive: Boolean
    serviceCategoryId: ID
    locationIds: [ID!] 
  }
  # --------------- END SERVICE --- V1 ---

  # --------------- STAFF (Booking Module) --- V1 ---
  type StaffProfile {
    id: ID!
    userId: ID!
    user: User! 
    bio: String
    specializations: [String!]! 
    createdAt: DateTime!
    updatedAt: DateTime!
    schedules: [StaffSchedule!] 
    assignedServices: [Service!]! 
    locationAssignments: [Location!]! 
    # bookings: [Booking!] 
  }

  type StaffSchedule {
    id: ID!
    location: Location 
    date: DateTime 
    dayOfWeek: DayOfWeek 
    startTime: String! 
    endTime: String! 
    scheduleType: ScheduleType! 
    isAvailable: Boolean!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateStaffProfileInput {
    userId: ID!
    bio: String
    specializations: [String!]
    assignedServiceIds: [ID!] 
    assignedLocationIds: [ID!] 
  }

  input UpdateStaffProfileInput {
    bio: String
    specializations: [String!]
    assignedServiceIds: [ID!]
    assignedLocationIds: [ID!]
  }

  input StaffScheduleInput {
    dayOfWeek: DayOfWeek!
    startTime: String!
    endTime: String!
    isAvailable: Boolean!
    scheduleType: ScheduleType! 
    locationId: ID 
    date: DateTime 
    notes: String 
  }
  # --------------- END STAFF --- V1 ---
`;
