import { FormBase, FormStep, FormField, FormSubmission } from './forms';

export interface FormInputData {
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

export interface FormStepInputData {
  formId: string;
  title: string;
  description?: string;
  order?: number;
  isVisible?: boolean;
  validationRules?: Record<string, unknown>;
}

export interface FormFieldInputData {
  formId?: string;
  stepId?: string;
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  defaultValue?: string;
  helpText?: string;
  isRequired?: boolean;
  order?: number;
  options?: Record<string, unknown>[];
  validationRules?: Record<string, unknown>;
  styling?: Record<string, unknown>;
  width?: number;
}

export interface FormSubmissionInputData {
  formId: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface FormParent {
  id: string;
  fields?: FormField[];
  steps?: FormStep[];
  submissions?: FormSubmission[];
  pageId?: string;
  formId?: string;
  stepId?: string;
  form?: FormBase;
}
