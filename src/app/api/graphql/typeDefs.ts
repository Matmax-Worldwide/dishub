import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Scalar types
  scalar DateTime
  scalar JSON

  # Enum types for Page
  enum PageType {
    CONTENT
    LANDING
    BLOG
    PRODUCT
    CATEGORY
    TAG
    HOME
    CONTACT
    ABOUT
    CUSTOM
  }

  enum ScrollType {
    NORMAL
    SMOOTH
  }

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
  }

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

  # ContactFormSubmission type
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

  # User input types for CRUD operations
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

  # Document related types
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

  enum DocumentStatus {
    DRAFT
    PENDING_REVIEW
    APPROVED
    REJECTED
  }

  type DocumentStatusCount {
    status: String!
    count: Int!
  }

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

  # Time entry related types
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

  type DailyTimeEntry {
    day: String!
    hours: Float!
  }

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

  # Project related types
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

  enum ProjectStatus {
    ACTIVE
    COMPLETED
    ON_HOLD
  }

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

  # Client related types
  type Client {
    id: ID!
    name: String!
    email: String
    phone: String
    address: String
    createdAt: String!
    updatedAt: String!
  }

  # Appointment related types
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

  # Task related types
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

  enum TaskStatus {
    NOT_STARTED
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  type TaskStatusCount {
    status: String!
    count: Int!
  }

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

  # Performance types
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

  # Notification types
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

  enum NotificationType {
    DOCUMENT
    TASK
    APPOINTMENT
    SYSTEM
  }

  input CreateNotificationInput {
    userId: ID!
    type: String!
    title: String!
    message: String!
    relatedItemId: String
    relatedItemType: String
  }

  input UpdateNotificationInput {
    isRead: Boolean
  }

  # Settings types
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

  # Help types
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

  # External Link types
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

  enum AccessControlType {
    PUBLIC
    ROLES
    USERS
    MIXED
  }

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

  # Dashboard stats type
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

  # Auth type
  type AuthPayload {
    token: String!
    user: User!
  }

  # Role and Permission input types
  input RoleCreateInput {
    name: String!
    description: String
  }

  input PermissionInput {
    name: String!
    description: String
    roleId: ID
  }

  # Permisos específicos de usuario
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

  # CMS Section types
  type SectionData {
    components: [Component!]!
    lastUpdated: String
  }
  
  type Component {
    id: ID!
    type: String!
    data: JSON!
  }
  
  type SaveSectionResult {
    success: Boolean!
    message: String
    lastUpdated: String
  }
  
  # Definición del tipo CMSSection para respuestas
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

  # Definición del componente de sección
  type SectionComponent {
    id: ID!
    sectionId: String!
    componentId: String!
    order: Int!
    data: JSON
    component: CMSComponent
  }

  # Definición del tipo de componente
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
  
  # Full Page type
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

  # PageSEO type 
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

  # Input for creating pages
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
  
  # Page result type
  type PageResult {
    success: Boolean!
    message: String!
    page: Page
  }

  # Menu types
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

  # Basic page type for use in menu items
  type PageBasic {
    id: ID!
    title: String!
    slug: String!
  }

  input MenuItemInput {
    menuId: String!
    parentId: String
    title: String!
    url: String
    pageId: String
    target: String
    icon: String
  }

  input MenuItemOrderInput {
    newOrder: Int!
  }

  input MenuItemOrderUpdate {
    id: ID!
    order: Int!
    parentId: String
  }

  # Resultado de operaciones con componentes
  type CMSComponentResult {
    success: Boolean!
    message: String
    component: CMSComponent
  }
  
  input ComponentInput {
    id: ID!
    type: String!
    data: JSON!
  }
  
  input SaveSectionInput {
    sectionId: ID!
    components: [ComponentInput!]!
  }

  # Input para crear un componente CMS
  input CreateCMSComponentInput {
    name: String!
    slug: String!
    description: String
    category: String
    schema: JSON
    icon: String
  }

  # Input para actualizar un componente CMS
  input UpdateCMSComponentInput {
    name: String
    description: String
    category: String
    schema: JSON
    icon: String
    isActive: Boolean
  }

  # Input para actualizar una sección CMS
  input UpdateCMSSectionInput {
    name: String
    description: String
    backgroundImage: String
    backgroundType: String
    gridDesign: String
  }

  # Input for creating a CMS section
  input CreateCMSSectionInput {
    sectionId: String!
    name: String!
    description: String
    backgroundImage: String
    backgroundType: String
    gridDesign: String
  }

  # Result type for CMS section operations
  type CMSSectionResult {
    success: Boolean!
    message: String!
    section: CMSSection
  }


  # Input for updating pages
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

  type PageMutationResponse {
    success: Boolean!
    message: String!
    page: Page
  }

  # Form Builder types
  enum FormFieldType {
    TEXT
    TEXTAREA
    EMAIL
    PASSWORD
    NUMBER
    PHONE
    DATE
    TIME
    DATETIME
    SELECT
    MULTISELECT
    RADIO
    CHECKBOX
    TOGGLE
    SLIDER
    RATING
    FILE
    HIDDEN
    HEADING
    PARAGRAPH
    DIVIDER
    SPACER
    HTML
    CAPTCHA
    SIGNATURE
    AUTOCOMPLETE
    ADDRESS
  }

  enum SubmissionStatus {
    RECEIVED
    PROCESSING
    COMPLETED
    REJECTED
    SPAM
  }

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
    defaultValue: String
    helpText: String
    isRequired: Boolean!
    order: Int!
    options: JSON
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

  # Form Builder input types
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
    defaultValue: String
    helpText: String
    isRequired: Boolean
    order: Int
    options: JSON
    validationRules: JSON
    styling: JSON
    width: Int
  }

  input FormSubmissionInput {
    formId: String!
    data: JSON!
    metadata: JSON
  }

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
    defaultValue: String
    helpText: String
    isRequired: Boolean
    order: Int
    options: JSON
    validationRules: JSON
    styling: JSON
    width: Int
  }

  type FormResult {
    success: Boolean!
    message: String
    form: Form
  }

  type FormStepResult {
    success: Boolean!
    message: String
    step: FormStep
  }

  type FormFieldResult {
    success: Boolean!
    message: String
    field: FormField
  }

  type FormSubmissionResult {
    success: Boolean!
    message: String
    submission: FormSubmission
  }

  type FormFieldOrderResult {
    success: Boolean!
    message: String
  }

  input FieldOrderUpdate {
    id: ID!
    order: Int!
  }

  # Root Query
  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users: [User!]
    
    # Role and permission queries
    roles: [Role]
    role(id: ID!): Role
    rolesWithCounts: [RoleWithCounts]
    permissions: [Permission]
    rolePermissions(roleId: ID!): [Permission]
    
    # Contact form queries
    contactFormSubmissions: [ContactFormSubmission!]
    
    # Dashboard queries
    dashboardStats: DashboardStats
    documentsByStatus: [DocumentStatusCount!]
    timeEntriesByDay: [DailyTimeEntry!]
    tasksByStatus: [TaskStatusCount!]
    
    # Document queries
    documents: [Document!]
    document(id: ID!): Document
    documentStatusCounts: [DocumentStatusCount!]
    
    # Time entry queries
    timeEntries: [TimeEntry!]
    timeEntry(id: ID!): TimeEntry
    
    # Appointment queries
    appointments: [Appointment!]
    appointment(id: ID!): Appointment
    upcomingAppointments(count: Int): [Appointment!]
    
    # Task queries
    tasks: [Task!]
    task(id: ID!): Task
    
    # Project queries
    projects: [Project!]
    project(id: ID!): Project
    
    # Client queries
    clients: [Client!]
    client(id: ID!): Client

    # Performance queries
    performances: [Performance!]
    performance(id: ID!): Performance
    currentPerformance: Performance
    
    # Notification queries
    notifications: [Notification!]
    notification(id: ID!): Notification
    unreadNotificationsCount: Int
    allNotifications: [Notification!]
    
    # Settings queries
    userSettings: UserSettings
    
    # Help queries
    helpArticles: [HelpArticle!]
    helpArticle(id: ID!): HelpArticle
    helpArticlesByCategory(category: String!): [HelpArticle!]
    searchHelpArticles(query: String!): [HelpArticle!]

    # External Link queries
    externalLinks: [ExternalLink]
    externalLink(id: ID!): ExternalLink
    activeExternalLinks: [ExternalLink]
    activeExternalLinksAs(roleId: String!): [ExternalLink]
    userLinkAccessStatus: [LinkAccessStatus]

    # Permisos específicos de usuario
    userSpecificPermissions(userId: ID!): [UserPermission!]!

    # CMS Queries
    getSectionComponents(sectionId: ID!): SectionData
    getAllCMSSections: [CMSSection!]!
    
    # Nuevas queries para componentes CMS
    getAllCMSComponents: [CMSComponent!]!
    getCMSComponent(id: ID!): CMSComponent
    getCMSComponentsByType(type: String!): [CMSComponent!]!
    
    # Nuevas queries para páginas CMS
    getAllCMSPages: [Page!]!
    getPageBySlug(slug: String!): Page
    getDefaultPage(locale: String!): Page
    getPagesUsingSectionId(sectionId: ID!): [Page!]!

    # Menu queries
    menus: [Menu!]!
    menu(id: ID!): Menu
    menuByName(name: String!): Menu
    menuByLocation(location: String!): Menu
    pages: [PageBasic!]! # New query to get pages for menu items

    # Form Builder queries
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

    # Blog queries
    blogs: [Blog!]!
    blog(id: ID!): Blog
    blogBySlug(slug: String!): Blog
    post(id: ID!): Post
    posts(filter: PostFilter): [Post!]!
    postBySlug(slug: String!): Post

    # Media queries
    media: [Media!]!
    mediaItem(id: ID!): Media
    mediaByType(fileType: String!): [Media!]!
    mediaInFolder(folder: String): [Media!]!
  }

  # Root Mutation
  type Mutation {
    # Auth mutations
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!, firstName: String!, lastName: String!, phoneNumber: String): AuthPayload!
    
    # Contact form mutation
    createContactFormSubmission(input: ContactFormSubmissionInput!): ContactFormSubmission!
    
    # User mutations
    createUser(input: CreateUserInput!): User
    updateUser(id: ID!, input: UpdateUserInput!): User
    deleteUser(id: ID!): Boolean
    updateUserProfile(input: UpdateUserProfileInput!): User
    
    # Document mutations
    createDocument(input: CreateDocumentInput!): Document!
    updateDocument(id: ID!, input: UpdateDocumentInput!): Document!
    deleteDocument(id: ID!): Boolean!
    
    # Time entry mutations
    createTimeEntry(input: CreateTimeEntryInput!): TimeEntry!
    updateTimeEntry(id: ID!, input: UpdateTimeEntryInput!): TimeEntry!
    deleteTimeEntry(id: ID!): Boolean!
    
    # Appointment mutations
    createAppointment(input: CreateAppointmentInput!): Appointment!
    updateAppointment(id: ID!, input: UpdateAppointmentInput!): Appointment!
    deleteAppointment(id: ID!): Boolean!
    
    # Task mutations
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    deleteTask(id: ID!): Boolean!
    
    # Project mutations
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!

    # Performance mutations
    createPerformance(input: CreatePerformanceInput!): Performance!
    updatePerformance(id: ID!, input: UpdatePerformanceInput!): Performance!
    deletePerformance(id: ID!): Boolean!
    
    # Notification mutations
    createNotification(input: CreateNotificationInput!): Notification!
    updateNotification(id: ID!, input: UpdateNotificationInput!): Notification!
    markAllNotificationsAsRead: Boolean
    deleteNotification(id: ID!): Boolean
    deleteMultipleNotifications(ids: [ID!]!): Int
    
    # Settings mutations
    updateUserSettings(input: UpdateUserSettingsInput!): UserSettings!
    
    # Help mutations
    createHelpArticle(input: CreateHelpArticleInput!): HelpArticle!
    updateHelpArticle(id: ID!, input: UpdateHelpArticleInput!): HelpArticle!
    deleteHelpArticle(id: ID!): Boolean!

    # External Link mutations
    createExternalLink(input: ExternalLinkInput!): ExternalLink
    updateExternalLink(id: ID!, input: ExternalLinkInput!): ExternalLink
    deleteExternalLink(id: ID!): Boolean
    updateLinkAccess(id: ID!, accessControl: AccessControlInput!): ExternalLink
    
    # Role and permission mutations
    createRole(input: RoleCreateInput!): Role
    updateRole(id: ID!, input: RoleCreateInput!): Role
    deleteRole(id: ID!): Boolean
    createPermission(input: PermissionInput!): Permission
    assignPermissionToRole(roleId: ID!, permissionId: ID!): Permission
    removePermissionFromRole(roleId: ID!, permissionId: ID!): Boolean

    # Gestionar permisos específicos de usuario
    setUserPermission(input: UserPermissionInput!): UserPermission!

    # CMS Mutations
    saveSectionComponents(input: SaveSectionInput!): SaveSectionResult
    deleteCMSSection(sectionId: ID!): SaveSectionResult
    updateCMSSection(sectionId: ID!, input: UpdateCMSSectionInput!): SaveSectionResult
    
    # Nuevas mutations para componentes CMS
    createCMSComponent(input: CreateCMSComponentInput!): CMSComponentResult
    updateCMSComponent(id: ID!, input: UpdateCMSComponentInput!): CMSComponentResult
    deleteCMSComponent(id: ID!): SaveSectionResult
    
    # Page mutations
    createPage(input: CreatePageInput!): PageResult
    updatePage(id: ID!, input: UpdatePageInput!): PageResult
    deletePage(id: ID!): PageResult
    
    # Section mutations
    createCMSSection(input: CreateCMSSectionInput!): CMSSectionResult
    associateSectionToPage(pageId: ID!, sectionId: ID!, order: Int!): PageResult
    dissociateSectionFromPage(pageId: ID!, sectionId: ID!): PageResult

    # Menu mutations
    createMenu(input: MenuInput!): Menu
    updateMenu(id: ID!, input: MenuInput!): Menu
    deleteMenu(id: ID!): Boolean
    
    # MenuItem mutations
    createMenuItem(input: MenuItemInput!): MenuItem
    updateMenuItem(id: ID!, input: MenuItemInput!): MenuItem
    deleteMenuItem(id: ID!): Boolean
    updateMenuItemOrder(id: ID!, input: MenuItemOrderInput!): MenuItem
    updateMenuItemsOrder(items: [MenuItemOrderUpdate!]!): Boolean

    # HeaderStyle mutations
    updateHeaderStyle(menuId: ID!, input: HeaderStyleInput!): HeaderStyleResult!

    # FooterStyle mutations
    updateFooterStyle(menuId: ID!, input: FooterStyleInput!): FooterStyleResult!

    # Form Builder mutations
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

    # Blog mutations
    createBlog(input: BlogInput!): BlogResult!
    updateBlog(id: ID!, input: BlogInput!): BlogResult!
    deleteBlog(id: ID!): BlogResult!
    
    createPost(input: CreatePostInput!): PostResult!
    updatePost(id: ID!, input: UpdatePostInput!): PostResult!
    deletePost(id: ID!): PostResult!

    # Media mutations
    createMedia(input: CreateMediaInput!): MediaResult!
    updateMedia(id: ID!, input: UpdateMediaInput!): MediaResult!
    deleteMedia(id: ID!): MediaResult!
    associateMediaToPost(postId: ID!, mediaId: ID!): PostResult!
    dissociateMediaFromPost(postId: ID!, mediaId: ID!): PostResult!
  }

  # HeaderStyle type for storing header configuration
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

  # FooterStyle type for storing footer configuration
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

  # Enum types for footer customization
  enum FooterColumnLayout {
    stacked
    grid
    flex
  }

  enum SocialAlignment {
    left
    center
    right
  }

  enum FooterAlignment {
    left
    center
    right
  }

  enum FooterPadding {
    small
    medium
    large
  }

  enum FooterWidth {
    full
    container
    narrow
  }

  # Input for footer style
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

  # Enum types for header customization
  enum HeaderSize {
    sm
    md
    lg
  }

  enum MenuAlignment {
    left
    center
    right
  }

  enum MenuButtonStyle {
    default
    filled
    outline
  }

  enum MobileMenuStyle {
    fullscreen
    dropdown
    sidebar
  }

  enum MobileMenuPosition {
    left
    right
  }

  # Input for header style
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

  # Input for header advanced options
  input HeaderAdvancedOptionsInput {
    glassmorphism: Boolean
    blur: Int
    shadow: String
    animation: String
    customClass: String
    borderRadius: String
  }

  # HeaderStyleResult type for updating header style
  type HeaderStyleResult {
    success: Boolean!
    message: String!
    headerStyle: HeaderStyle
  }

  # FooterStyleResult type for updating footer style
  type FooterStyleResult {
    success: Boolean!
    message: String!
    footerStyle: FooterStyle
  }

  # Blog types
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

  enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  # Blog input types
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

  # Blog result types
  type BlogResult {
    success: Boolean!
    message: String!
    blog: Blog
  }

  type PostResult {
    success: Boolean!
    message: String!
    post: Post
  }

  # Media result types
  type MediaResult {
    success: Boolean!
    message: String!
    media: Media
  }
`; 
