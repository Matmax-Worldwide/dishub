// Legal Engine Types for DISHUB - Company Incorporation
export interface CompanyIncorporation {
  id: string;
  incorporationNumber: string;
  companyName: string;
  description?: string;
  jurisdiction: Jurisdiction;
  companyType: CompanyType;
  status: IncorporationStatus;
  priority: Priority;
  clientId: string;
  client?: Client;
  assignedLawyers: string[];
  lawyers?: LawyerProfile[];
  // Detalles específicos de incorporación
  proposedDirectors: Director[];
  proposedShareholders: Shareholder[];
  shareCapital: ShareCapital;
  businessActivity: string;
  registeredAddress?: Address;
  // Fechas importantes
  dateInitiated: Date;
  expectedCompletionDate?: Date;
  dateCompleted?: Date;
  // Costos y facturación
  estimatedCost: number;
  totalBilled: number;
  totalPaid: number;
  governmentFees: number;
  professionalFees: number;
  // Integración con Booking Engine
  relatedBookings: string[]; // IDs de bookings relacionados
  defaultMeetingDuration: number; // Duración por defecto para citas
  preferredLawyer?: string; // Abogado preferido para bookings
  // Documentación y seguimiento
  documents: IncorporationDocument[];
  timeline: IncorporationEvent[];
  notes: IncorporationNote[];
  checklist: IncorporationChecklist[];
  compliance: ComplianceRequirement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  type: ClientType; // 'individual' | 'existing_company'
  // Datos personales (individual)
  firstName?: string;
  lastName?: string;
  identificationNumber?: string;
  nationality?: string;
  // Datos empresariales (existing_company)
  companyName?: string;
  existingCompanyType?: string;
  taxId?: string;
  registrationNumber?: string;
  countryOfIncorporation?: string;
  // Datos comunes
  email: string;
  phone?: string;
  address?: Address;
  contactPerson?: string; // Para empresas
  // Información legal
  preferredLanguage: string;
  riskLevel: RiskLevel;
  creditLimit?: number;
  billingAddress?: Address;
  // Relaciones
  incorporations: string[]; // IDs de incorporaciones
  documents: string[]; // IDs de documentos
  appointments: string[]; // IDs de citas (booking engine)
  invoices: string[]; // IDs de facturas
  // Metadata
  notes: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LawyerProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  barAssociation: string;
  jurisdictionExpertise: Jurisdiction[]; // Jurisdicciones donde puede hacer incorporaciones
  specializations: string[];
  yearsOfExperience: number;
  education: Education[];
  certifications: Certification[];
  languages: string[];
  hourlyRate: number;
  isActive: boolean;
  // Integración con Booking Engine
  bookingStaffId?: string; // ID en el sistema de booking
  defaultAppointmentDuration: number;
  availableForConsultations: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LegalDocument {
  id: string;
  title: string;
  description?: string;
  type: DocumentType;
  category: DocumentCategory;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  // Relaciones
  caseId?: string;
  clientId?: string;
  templateId?: string;
  // Metadata
  confidentialityLevel: ConfidentialityLevel;
  version: number;
  isTemplate: boolean;
  tags: string[];
  // Legal específico
  signatureRequired: boolean;
  isSigned: boolean;
  signedAt?: Date;
  signedBy?: string;
  witnessRequired: boolean;
  notarized: boolean;
  // Fechas importantes
  effectiveDate?: Date;
  expirationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseEvent {
  id: string;
  caseId: string;
  type: EventType;
  title: string;
  description: string;
  date: Date;
  // Relaciones con booking engine
  bookingId?: string; // Si el evento está relacionado con una cita
  location?: string;
  attendees: string[]; // IDs de usuarios
  // Metadata
  isPublic: boolean; // Visible para el cliente
  documents: string[]; // IDs de documentos relacionados
  createdBy: string;
  createdAt: Date;
}

export interface CaseNote {
  id: string;
  caseId: string;
  content: string;
  isConfidential: boolean;
  authorId: string;
  author?: LawyerProfile;
  tags: string[];
  relatedEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  caseId: string;
  lawyerId: string;
  lawyer?: LawyerProfile;
  description: string;
  hours: number;
  rate: number;
  amount: number;
  date: Date;
  isBillable: boolean;
  isBilled: boolean;
  invoiceId?: string;
  activity: TimeActivity;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseExpense {
  id: string;
  caseId: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: Date;
  receipt?: string; // URL del recibo
  isBillable: boolean;
  isBilled: boolean;
  invoiceId?: string;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncorporationInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client?: Client;
  incorporationId?: string;
  incorporation?: CompanyIncorporation;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  // Detalles financieros
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  // Items específicos de incorporación
  governmentFees: number;
  professionalFees: number;
  disbursements: number;
  // Metadata
  notes?: string;
  paymentTerms: string;
  jurisdiction: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Integración con Booking Engine para incorporaciones
export interface IncorporationBookingIntegration {
  // Crear cita desde incorporación
  createAppointmentFromIncorporation(incorporationId: string, type: AppointmentType): Promise<BookingResult>;
  // Obtener citas de una incorporación
  getIncorporationAppointments(incorporationId: string): Promise<BookingResult[]>;
  // Crear reunión con cliente
  createClientMeeting(incorporationId: string, meetingInfo: ClientMeetingInfo): Promise<BookingResult>;
  // Sincronizar eventos de incorporación
  syncIncorporationEvents(): Promise<void>;
  // Configurar recordatorios de incorporación
  setupIncorporationReminders(incorporationId: string): Promise<void>;
}

export interface BookingResult {
  id: string;
  success: boolean;
  message: string;
  bookingId?: string;
}

export interface ClientMeetingInfo {
  clientName: string;
  purpose: string;
  estimatedDuration: number;
  preferredLawyer?: string;
  documents?: string[];
}

export interface CourtInfo {
  courtName: string;
  address: string;
  roomNumber?: string;
  judge?: string;
  caseNumber?: string;
  hearingType: HearingType;
}

// Nuevos interfaces para constitución de empresas
export interface Director {
  id: string;
  firstName: string;
  lastName: string;
  nationality: string;
  identificationNumber: string;
  address: Address;
  dateOfBirth: Date;
  occupation: string;
  isResident: boolean;
}

export interface Shareholder {
  id: string;
  type: 'individual' | 'corporate';
  // Individual shareholder
  firstName?: string;
  lastName?: string;
  nationality?: string;
  identificationNumber?: string;
  // Corporate shareholder
  corporateName?: string;
  incorporationJurisdiction?: string;
  registrationNumber?: string;
  // Common fields
  address: Address;
  sharePercentage: number;
  shareClass: string;
  investmentAmount: number;
}

export interface ShareCapital {
  authorizedCapital: number;
  issuedCapital: number;
  paidUpCapital: number;
  currency: string;
  numberOfShares: number;
  parValuePerShare: number;
  shareClasses: ShareClass[];
}

export interface ShareClass {
  className: string;
  numberOfShares: number;
  parValue: number;
  rights: string[];
}

export interface IncorporationDocument {
  id: string;
  title: string;
  description?: string;
  type: IncorporationDocumentType;
  category: DocumentCategory;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  // Relaciones
  incorporationId?: string;
  clientId?: string;
  jurisdiction: string;
  // Metadata
  isRequired: boolean;
  isGovernmentIssued: boolean;
  expirationDate?: Date;
  version: number;
  isTemplate: boolean;
  // Fechas importantes
  submissionDate?: Date;
  approvalDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncorporationEvent {
  id: string;
  incorporationId: string;
  type: IncorporationEventType;
  title: string;
  description: string;
  date: Date;
  // Relaciones con booking engine
  bookingId?: string;
  location?: string;
  attendees: string[];
  // Metadata
  isPublic: boolean; // Visible para el cliente
  documents: string[];
  createdBy: string;
  createdAt: Date;
}

export interface IncorporationNote {
  id: string;
  incorporationId: string;
  content: string;
  isConfidential: boolean;
  authorId: string;
  author?: LawyerProfile;
  tags: string[];
  relatedEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncorporationChecklist {
  id: string;
  incorporationId: string;
  jurisdiction: string;
  step: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
  estimatedDays: number;
  dependsOn: string[]; // IDs de otros checklist items
  documents: string[]; // IDs de documentos requeridos
  notes?: string;
  order: number;
}

export interface ComplianceRequirement {
  id: string;
  incorporationId: string;
  jurisdiction: string;
  requirement: string;
  description: string;
  dueDate: Date;
  isCompleted: boolean;
  completedAt?: Date;
  penalty?: string;
  recurringFrequency?: 'annual' | 'quarterly' | 'monthly' | 'one_time';
  nextDueDate?: Date;
}

// Enums y tipos auxiliares para constitución de empresas
export type Jurisdiction = 
  | 'usa_delaware'
  | 'usa_nevada'
  | 'usa_wyoming'
  | 'usa_florida'
  | 'uk_england'
  | 'singapore'
  | 'hong_kong'
  | 'bvi'
  | 'cayman_islands'
  | 'panama'
  | 'estonia'
  | 'ireland'
  | 'netherlands'
  | 'cyprus'
  | 'malta'
  | 'seychelles'
  | 'dubai_uae'
  | 'canada_ontario'
  | 'australia_nsw'
  | 'new_zealand';

export type CompanyType = 
  | 'llc' // Limited Liability Company
  | 'corporation' // C-Corporation
  | 's_corporation' // S-Corporation
  | 'limited_company' // UK Limited Company
  | 'private_limited' // Private Limited Company
  | 'public_limited' // Public Limited Company
  | 'partnership'
  | 'limited_partnership'
  | 'sole_proprietorship'
  | 'foundation'
  | 'trust'
  | 'branch_office'
  | 'representative_office';

export type IncorporationStatus = 
  | 'initiated'
  | 'documentation_gathering'
  | 'name_reservation'
  | 'filing_preparation'
  | 'government_filing'
  | 'pending_approval'
  | 'approved'
  | 'certificate_issued'
  | 'completed'
  | 'rejected'
  | 'on_hold'
  | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ClientType = 'individual' | 'existing_company';

export type IncorporationDocumentType = 
  | 'articles_of_incorporation'
  | 'memorandum_of_association'
  | 'certificate_of_incorporation'
  | 'bylaws'
  | 'shareholder_agreement'
  | 'director_consent'
  | 'registered_office_agreement'
  | 'power_of_attorney'
  | 'passport_copy'
  | 'proof_of_address'
  | 'bank_reference'
  | 'professional_reference'
  | 'business_plan'
  | 'compliance_certificate'
  | 'apostille'
  | 'translation'
  | 'government_filing'
  | 'other';

export type IncorporationEventType = 
  | 'incorporation_initiated'
  | 'client_consultation'
  | 'documentation_review'
  | 'name_search_completed'
  | 'name_reserved'
  | 'documents_filed'
  | 'government_response'
  | 'certificate_received'
  | 'incorporation_completed'
  | 'compliance_reminder'
  | 'annual_filing_due'
  | 'meeting_scheduled'
  | 'payment_received'
  | 'other';

export type RiskLevel = 'low' | 'medium' | 'high';

export type DocumentType = 
  | 'contract'
  | 'pleading'
  | 'motion'
  | 'brief'
  | 'evidence'
  | 'correspondence'
  | 'court_order'
  | 'settlement'
  | 'power_of_attorney'
  | 'corporate_document'
  | 'financial_statement'
  | 'invoice'
  | 'receipt'
  | 'other';

export type DocumentCategory = 
  | 'case_documents'
  | 'client_documents'
  | 'templates'
  | 'contracts'
  | 'evidence'
  | 'financial'
  | 'administrative';

export type ConfidentialityLevel = 'public' | 'confidential' | 'attorney_client' | 'work_product';

export type EventType = 
  | 'case_opened'
  | 'court_hearing'
  | 'client_meeting'
  | 'document_filed'
  | 'deadline'
  | 'settlement_negotiation'
  | 'mediation'
  | 'arbitration'
  | 'consultation'
  | 'case_closed'
  | 'payment_received'
  | 'other';

export type TimeActivity = 
  | 'research'
  | 'document_review'
  | 'drafting'
  | 'client_communication'
  | 'court_appearance'
  | 'negotiation'
  | 'meeting'
  | 'travel'
  | 'administrative'
  | 'other';

export type ExpenseCategory = 
  | 'court_fees'
  | 'filing_fees'
  | 'travel'
  | 'accommodation'
  | 'copying'
  | 'postage'
  | 'research'
  | 'expert_witness'
  | 'translation'
  | 'other';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export type AppointmentType = 
  | 'consultation'
  | 'court_hearing'
  | 'client_meeting'
  | 'document_signing'
  | 'mediation'
  | 'negotiation'
  | 'deposition'
  | 'other';

export type HearingType = 
  | 'preliminary_hearing'
  | 'trial'
  | 'motion_hearing'
  | 'settlement_conference'
  | 'status_conference'
  | 'sentencing'
  | 'appeal'
  | 'other';

// Interfaces auxiliares
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: number;
  honors?: string;
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expirationDate?: Date;
}

// Filtros y opciones de búsqueda para incorporaciones
export interface IncorporationFilter {
  status?: IncorporationStatus[];
  companyType?: CompanyType[];
  jurisdiction?: Jurisdiction[];
  priority?: Priority[];
  clientId?: string;
  lawyerId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface ClientFilter {
  type?: ClientType[];
  riskLevel?: RiskLevel[];
  isActive?: boolean;
  search?: string;
}

export interface DocumentFilter {
  type?: DocumentType[];
  category?: DocumentCategory[];
  confidentialityLevel?: ConfidentialityLevel[];
  caseId?: string;
  clientId?: string;
  search?: string;
}

// Opciones de configuración del Incorporation Engine
export interface IncorporationEngineConfig {
  // Configuración de jurisdicciones
  jurisdictions: JurisdictionConfig[];
  companyTypes: CompanyTypeConfig[];
  documentTemplates: IncorporationDocumentTemplate[];
  billingSettings: BillingSettings;
  // Integración con Booking Engine
  bookingIntegration: BookingIntegrationConfig;
}

export interface JurisdictionConfig {
  id: Jurisdiction;
  name: string;
  country: string;
  description: string;
  averageProcessingDays: number;
  minimumCapitalRequirement: number;
  currency: string;
  taxRate: number;
  companyTypesAllowed: CompanyType[];
  requiresLocalDirector: boolean;
  requiresLocalShareholder: boolean;
  allowsCorporateShareholders: boolean;
  annualFilingRequired: boolean;
}

export interface CompanyTypeConfig {
  id: CompanyType;
  name: string;
  description: string;
  minimumDirectors: number;
  minimumShareholders: number;
  minimumCapital: number;
  limitedLiability: boolean;
  suitableFor: string[];
}

export interface IncorporationDocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: DocumentCategory;
  type: IncorporationDocumentType;
  jurisdiction: Jurisdiction;
  companyType: CompanyType;
  templateUrl: string;
  variables: TemplateVariable[];
  isRequired: boolean;
  requiredForCompanyTypes: CompanyType[];
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  description: string;
}

export interface BillingSettings {
  defaultCurrency: string;
  defaultHourlyRate: number;
  taxRate: number;
  paymentTerms: number; // días
  latePaymentFee: number;
}

export interface BookingIntegrationConfig {
  enabled: boolean;
  defaultServices: LegalService[];
  defaultCategories: LegalServiceCategory[];
  defaultStaffRoles: LegalStaffRole[];
  defaultLocations: LegalLocation[];
}

export interface LegalService {
  name: string;
  description: string;
  duration: number; // minutos
  category: string;
  defaultRate?: number;
}

export interface LegalServiceCategory {
  name: string;
  description: string;
  color?: string;
}

export interface LegalStaffRole {
  name: string;
  description: string;
  canHandleConsultations: boolean;
  canHandleHearings: boolean;
}

export interface LegalLocation {
  name: string;
  type: 'office' | 'court' | 'client_site' | 'virtual';
  address?: string;
  capacity?: number;
} 