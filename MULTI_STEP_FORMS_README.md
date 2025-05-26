# Multi-Step Forms Implementation

This document describes the multi-step form functionality that has been implemented in the CMS system.

## Overview

The multi-step form feature allows CMS users to create forms with multiple steps, where each step can contain different form fields. Users can navigate between steps, and the form validates each step before allowing progression to the next one.

## Components

### 1. MultiStepFormRenderer (`src/components/cms/forms/MultiStepFormRenderer.tsx`)

The main component that renders multi-step forms for end users.

**Features:**
- Step-by-step navigation with Previous/Next buttons
- Progress indicator showing completion percentage
- Step indicators with visual feedback (completed, current, upcoming)
- Form validation for each step before progression
- Smooth animations between steps using Framer Motion
- Support for all form field types (text, email, phone, textarea, select, radio, checkbox, date, number)
- Form data persistence across steps
- Final form submission only after all steps are completed

**Props:**
- `form: FormBase` - The form configuration object
- `buttonClassName?: string` - Custom CSS classes for buttons
- `buttonStyles?: React.CSSProperties` - Inline styles for buttons
- `inputClassName?: string` - Custom CSS classes for input fields
- `labelClassName?: string` - Custom CSS classes for labels
- `onSubmit?: (formData: Record<string, unknown>) => Promise<void>` - Form submission handler
- `submitStatus?: 'idle' | 'submitting' | 'success' | 'error'` - Current submission status

### 2. FormStepManager (`src/components/cms/forms/FormStepManager.tsx`)

The CMS interface for managing form steps and their fields.

**Features:**
- Create new form steps with title and description
- Reorder steps using up/down arrows
- Toggle step visibility
- Add different field types to each step
- Delete steps and fields
- Visual step management with drag-and-drop-like interface

**Supported Field Types:**
- Text
- Email
- Phone
- Textarea
- Select (dropdown)
- Radio buttons
- Checkboxes
- Date
- Number

### 3. FormSection (`src/components/cms/sections/FormSection.tsx`)

Updated to conditionally render either single-step or multi-step forms based on the `form.isMultiStep` property.

**Integration:**
```tsx
{selectedForm.isMultiStep ? (
  <MultiStepFormRenderer
    form={selectedForm}
    buttonClassName={getButtonClassNames()}
    buttonStyles={getButtonStyles()}
    inputClassName={getInputClassNames()}
    labelClassName={getLabelClassNames()}
    onSubmit={handleFormSubmit}
    submitStatus={submitStatus}
  />
) : (
  <FormRenderer
    form={selectedForm}
    // ... other props
  />
)}
```

## Backend Support

### GraphQL Resolvers (`src/app/api/graphql/resolvers/forms.ts`)

The backend includes comprehensive resolvers for form step management:

**Queries:**
- `formSteps(formId: String!)` - Get all steps for a form
- `formStep(id: String!)` - Get a single step by ID
- `formFields(formId: String!, stepId: String)` - Get fields for a form or step

**Mutations:**
- `createFormStep(input: FormStepInput!)` - Create a new form step
- `updateFormStep(id: String!, input: FormStepInput!)` - Update an existing step
- `deleteFormStep(id: String!)` - Delete a form step
- `updateStepOrders(updates: [StepOrderUpdate!]!)` - Reorder multiple steps

### GraphQL Client (`src/lib/graphql-client.ts`)

The GraphQL client includes all necessary functions for step management:

- `getFormSteps(formId: string)` - Fetch steps for a form
- `createFormStep(input: FormStepInput)` - Create a new step
- `updateFormStep(id: string, input: Partial<FormStepInput>)` - Update a step
- `deleteFormStep(id: string)` - Delete a step
- `updateStepOrders(updates: Array<{ id: string; order: number }>)` - Reorder steps

## Usage

### For CMS Users

1. **Enable Multi-Step Mode:**
   - When creating or editing a form, set `isMultiStep: true`

2. **Manage Steps:**
   - Use the FormStepManager component to add, edit, and reorder steps
   - Each step can have a title, description, and visibility setting

3. **Add Fields to Steps:**
   - Select field types from the dropdown in each step
   - Configure field properties (label, required, validation, etc.)

4. **Preview:**
   - Use the FormSection preview to see how the multi-step form will appear to users

### For End Users

1. **Navigation:**
   - Use "Previous" and "Next" buttons to navigate between steps
   - Progress bar shows completion percentage
   - Step indicators show current position and completed steps

2. **Validation:**
   - Each step is validated before allowing progression
   - Required fields must be completed
   - Email and phone fields have format validation

3. **Submission:**
   - Form is only submitted after completing all steps
   - Data from all steps is combined into a single submission

## Data Structure

### FormStepBase Interface
```typescript
interface FormStepBase {
  id: string;
  formId: string;
  title: string;
  description?: string;
  order: number;
  isVisible: boolean;
  validationRules?: Record<string, unknown>;
  fields?: FormFieldBase[];
}
```

### FormStepInput Interface
```typescript
interface FormStepInput {
  formId: string;
  title: string;
  description?: string;
  order: number;
  isVisible?: boolean;
  validationRules?: Record<string, unknown>;
}
```

## Styling and Customization

The multi-step form components support extensive customization:

- **CSS Classes:** Pass custom classes for buttons, inputs, and labels
- **Inline Styles:** Override styles using the `buttonStyles` prop
- **Animations:** Built-in Framer Motion animations for smooth transitions
- **Progress Indicators:** Visual feedback with progress bars and step indicators
- **Responsive Design:** Mobile-friendly layout with proper spacing

## Error Handling

- **Validation Errors:** Real-time validation with error messages
- **Network Errors:** Graceful handling of API failures with user feedback
- **Loading States:** Visual indicators during data loading and submission
- **Rollback:** Automatic rollback on failed operations (e.g., step reordering)

## Performance Considerations

- **Lazy Loading:** Steps are loaded as needed
- **Memoization:** React.memo and useCallback used to prevent unnecessary re-renders
- **Debounced Updates:** Form data updates are debounced to reduce API calls
- **Optimistic Updates:** UI updates immediately with rollback on failure

## Future Enhancements

Potential improvements that could be added:

1. **Conditional Logic:** Show/hide steps based on previous answers
2. **Step Templates:** Pre-defined step configurations
3. **Advanced Validation:** Cross-step validation rules
4. **Save Progress:** Allow users to save and resume later
5. **Analytics:** Track step completion rates and drop-off points
6. **A/B Testing:** Test different step configurations

## Troubleshooting

### Common Issues

1. **Steps Not Showing:**
   - Ensure `form.isMultiStep` is set to `true`
   - Check that steps have `isVisible: true`
   - Verify steps have been created and saved

2. **Navigation Issues:**
   - Check step validation rules
   - Ensure required fields are properly configured
   - Verify step order is correct

3. **Submission Problems:**
   - Check form submission handler is properly configured
   - Verify all steps pass validation
   - Check network connectivity and API endpoints

### Debug Mode

To enable debug logging, add this to your component:

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Current step:', currentStep);
  console.log('Form data:', formData);
  console.log('Validation errors:', errors);
}
```

## Testing

The implementation includes proper TypeScript types and error handling. For testing:

1. **Unit Tests:** Test individual components with Jest/React Testing Library
2. **Integration Tests:** Test form submission flow end-to-end
3. **E2E Tests:** Use Cypress or Playwright for full user journey testing

## Conclusion

The multi-step form implementation provides a complete solution for creating and managing complex forms with multiple steps. It includes both the user-facing components and the CMS management interface, with full backend support and proper error handling. 