import { PageData } from './cms';

// Form field types
export enum FormFieldType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
  NUMBER = 'NUMBER',
  PHONE = 'PHONE',
  DATE = 'DATE',
  TIME = 'TIME',
  DATETIME = 'DATETIME',
  SELECT = 'SELECT',
  MULTISELECT = 'MULTISELECT',
  RADIO = 'RADIO',
  CHECKBOX = 'CHECKBOX',
  TOGGLE = 'TOGGLE',
  SLIDER = 'SLIDER',
  RATING = 'RATING',
  FILE = 'FILE',
  HIDDEN = 'HIDDEN',
  HEADING = 'HEADING',
  PARAGRAPH = 'PARAGRAPH',
  DIVIDER = 'DIVIDER',
  SPACER = 'SPACER',
  HTML = 'HTML',
  CAPTCHA = 'CAPTCHA',
  SIGNATURE = 'SIGNATURE',
  AUTOCOMPLETE = 'AUTOCOMPLETE',
  ADDRESS = 'ADDRESS'
}

// Form submission status
export enum SubmissionStatus {
  RECEIVED = 'RECEIVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  SPAM = 'SPAM'
}

// Field options for select, radio, etc.
export interface FieldOption {
  label: string;
  value: string;
  disabled?: boolean;
}

// Field options como objeto con propiedades específicas
export interface FieldOptions {
  // Opciones para campos de tipo SELECT y RADIO
  items?: FieldOption[];
  
  // Opciones para RADIO
  layout?: 'horizontal' | 'vertical';
  
  // Opciones para CHECKBOX
  labelPosition?: 'left' | 'right';
  linkText?: string;
  linkUrl?: string;
  
  // Opciones para TEXTAREA
  rows?: number;
  resize?: boolean;
  maxLength?: number;
  
  // Opciones para EMAIL
  confirmEmail?: boolean;
  confirmLabel?: string;
  autocomplete?: string;
  
  // Opciones para PASSWORD
  showToggle?: boolean;
  minLength?: number;
  passwordStrength?: 'none' | 'basic' | 'medium' | 'strong';
  confirmPassword?: boolean;
  
  // Opciones para PHONE
  format?: 'international' | 'national' | 'any';
  defaultCountry?: string;
  showCountryCode?: boolean;
  
  // Otras opciones comunes
  [key: string]: unknown;
}

// Validation rules for form fields
export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  value?: string | number | boolean;
  message?: string;
  pattern?: string;
  validator?: string; // For custom validation function
}

// Base interfaces for form entities
export interface FormFieldBase {
  id: string;
  formId?: string;
  stepId?: string;
  label: string;
  name: string;
  type: FormFieldType;
  placeholder?: string;
  defaultValue?: string;
  helpText?: string;
  isRequired: boolean;
  order: number;
  options?: FieldOptions;
  validationRules?: ValidationRule[];
  styling?: Record<string, unknown>;
  width?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormStepBase {
  id: string;
  formId: string;
  title: string;
  description?: string;
  order: number;
  isVisible: boolean;
  validationRules?: ValidationRule[];
  createdAt?: string;
  updatedAt?: string;
  fields?: FormFieldBase[];
}

export interface FormBase {
  id: string;
  title: string;
  description?: string;
  slug: string;
  isMultiStep: boolean;
  isActive: boolean;
  successMessage?: string;
  redirectUrl?: string;
  submitButtonText: string;
  submitButtonStyle?: string;
  layout?: string;
  styling?: Record<string, unknown>;
  pageId?: string;
  createdById: string;
  updatedById?: string;
  createdAt?: string;
  updatedAt?: string;
  fields?: FormFieldBase[];
  steps?: FormStepBase[];
  page?: PageData;
}

export interface FormSubmissionBase {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: SubmissionStatus;
  createdAt?: string;
  updatedAt?: string;
  form?: FormBase;
}

// Input types for creating and updating forms
export interface FormInput {
  title: string;
  description?: string;
  slug: string;
  isMultiStep?: boolean;
  isActive?: boolean;
  successMessage?: string;
  redirectUrl?: string;
  submitButtonText?: string;
  submitButtonStyle?: string;
  layout?: string;
  styling?: Record<string, unknown>;
  pageId?: string;
}

export interface FormStepInput {
  formId: string;
  title: string;
  description?: string;
  order?: number;
  isVisible?: boolean;
  validationRules?: ValidationRule[];
}

export interface FormFieldInput {
  formId?: string;
  stepId?: string;
  label: string;
  name: string;
  type: FormFieldType;
  placeholder?: string;
  defaultValue?: string;
  helpText?: string;
  isRequired?: boolean;
  order?: number;
  options?: FieldOptions;
  validationRules?: ValidationRule[];
  styling?: Record<string, unknown>;
  width?: number;
}

export interface FormSubmissionInput {
  formId: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Result types for mutations
export interface FormResult {
  success: boolean;
  message?: string;
  form: FormBase | null;
}

export interface FormStepResult {
  success: boolean;
  message?: string;
  step: FormStepBase | null;
}

export interface FormFieldResult {
  success: boolean;
  message?: string;
  field: FormFieldBase | null;
}

export interface FormSubmissionResult {
  success: boolean;
  message?: string;
  submission: FormSubmissionBase | null;
}

// Submission statistics
export interface FormSubmissionStats {
  totalCount: number;
  statusCounts: Array<{
    status: SubmissionStatus;
    count: number;
  }>;
  last30DaysCount: number;
} 