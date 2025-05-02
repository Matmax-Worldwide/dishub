import { gql } from 'graphql-tag';

const typeDefs = gql`
  # User related types
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    phoneNumber: String
    role: String!
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
    firstName: String
    lastName: String
    email: String
    phoneNumber: String
    role: String
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
    type: NotificationType!
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
    type: NotificationType!
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
    icon: String!
    description: String
    isActive: Boolean!
    order: Int!
    createdBy: String
    createdAt: String!
    updatedAt: String!
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

  type Query {
    # User queries
    me: User
    users: [User!]!
    
    # Role and Permission queries
    role(id: ID!): Role
    roles: [Role!]
    permissions: [Permission!]
    rolePermissions(roleId: ID!): [Permission!]
    
    # Contact form queries
    contactFormSubmissions: [ContactFormSubmission!]!
    
    # Dashboard queries
    dashboardStats: DashboardStats!
    documentsByStatus: [DocumentStatusCount!]!
    timeEntriesByDay: [DailyTimeEntry!]!
    tasksByStatus: [TaskStatusCount!]!
    
    # Document queries
    documents: [Document!]!
    document(id: ID!): Document
    documentStatusCounts: [DocumentStatusCount!]
    
    # Time entry queries
    timeEntries: [TimeEntry!]!
    timeEntry(id: ID!): TimeEntry
    
    # Appointment queries
    appointments: [Appointment!]!
    appointment(id: ID!): Appointment
    upcomingAppointments(count: Int): [Appointment!]!
    
    # Task queries
    tasks: [Task!]!
    task(id: ID!): Task
    
    # Project queries
    projects: [Project!]!
    project(id: ID!): Project
    
    # Client queries
    clients: [Client!]!
    client(id: ID!): Client

    # Performance queries
    performances: [Performance!]!
    performance(id: ID!): Performance
    currentPerformance: Performance
    
    # Notification queries
    notifications: [Notification!]!
    notification(id: ID!): Notification
    unreadNotificationsCount: Int!
    allNotifications: [Notification!]!
    
    # Settings queries
    userSettings: UserSettings!
    
    # Help queries
    helpArticles: [HelpArticle!]!
    helpArticle(id: ID!): HelpArticle
    helpArticlesByCategory(category: String!): [HelpArticle!]!
    searchHelpArticles(query: String!): [HelpArticle!]!

    # External Link queries
    externalLinks: [ExternalLink!]
    externalLink(id: ID!): ExternalLink
    activeExternalLinks: [ExternalLink!]
  }

  type Mutation {
    # Auth mutations
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!, firstName: String!, lastName: String!, phoneNumber: String): AuthPayload!
    
    # Contact form mutation
    createContactFormSubmission(input: ContactFormSubmissionInput!): ContactFormSubmission!
    
    # User mutations
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    updateUserProfile(input: UpdateUserProfileInput!): User!
    
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
    markAllNotificationsAsRead: Boolean!
    deleteNotification(id: ID!): Boolean!
    deleteMultipleNotifications(ids: [ID!]!): Int!
    
    # Settings mutations
    updateUserSettings(input: UpdateUserSettingsInput!): UserSettings!
    
    # Help mutations
    createHelpArticle(input: CreateHelpArticleInput!): HelpArticle!
    updateHelpArticle(id: ID!, input: UpdateHelpArticleInput!): HelpArticle!
    deleteHelpArticle(id: ID!): Boolean!

    # External Link mutations
    createExternalLink(input: CreateExternalLinkInput!): ExternalLink
    updateExternalLink(id: ID!, input: UpdateExternalLinkInput!): ExternalLink
    deleteExternalLink(id: ID!): Boolean!
  }

  input UpdateProjectInput {
    name: String
    description: String
    status: ProjectStatus
    clientId: ID
  }
`;

export default typeDefs; 