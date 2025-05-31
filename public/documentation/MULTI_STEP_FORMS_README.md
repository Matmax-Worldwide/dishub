# Multi-Step Forms Implementation

This document describes the comprehensive multi-step form functionality implemented in the CMS system, providing capabilities similar to Google Forms and Typeform.

## Overview

The multi-step form feature allows CMS users to create forms with multiple steps, where each step can contain different form fields. The workflow involves:

1. **Creating form fields** in the dedicated Fields tab
2. **Creating form steps** and assigning existing fields to them
3. **Users navigate** between steps with validation at each step

## Workflow

### 1. Create Form Fields
- Navigate to the **Fields** tab in the form editor
- Create all the fields you need for your form (text, email, phone, etc.)
- Configure field properties (label, validation, required status, etc.)

### 2. Enable Multi-Step Mode
- In the **General Settings** tab, enable "Multi-step Form"
- This unlocks the Form Steps functionality

### 3. Create and Manage Steps
- Navigate to the **Form Steps** tab
- Create steps with titles and descriptions
- Assign existing form fields to different steps
- Reorder steps and fields as needed

### 4. Form Rendering
- The form automatically renders as a multi-step form for end users
- Users can navigate between steps with Previous/Next buttons
- Each step is validated before allowing progression

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
- `form: FormBase` - The form configuration object with steps and assigned fields
- `buttonClassName?: string` - Custom CSS classes for buttons
- `buttonStyles?: React.CSSProperties` - Inline styles for buttons
- `inputClassName?: string` - Custom CSS classes for input fields
- `labelClassName?: string` - Custom CSS classes for labels
- `onSubmit?: (formData: Record<string, unknown>) => Promise<void>` - Form submission handler
- `submitStatus?: 'idle' | 'submitting' | 'success' | 'error'` - Current submission status

### 2. FormStepManager (`src/components/cms/forms/FormStepManager.tsx`)

The CMS interface for managing form steps and field assignments.

**Features:**
- Create new form steps with title and description
- Reorder steps using up/down arrows
- Toggle step visibility
- **Assign existing form fields to steps** (key feature)
- Unassign fields from steps
- Visual management interface with clear field assignment status

**Key Functionality:**
- **Unassigned Fields Section**: Shows fields that haven't been assigned to any step
- **Field Assignment**: Use dropdowns to assign fields to specific steps
- **Field Unassignment**: Remove fields from steps (they become unassigned, not deleted)
- **Visual Feedback**: Clear indication of which fields belong to which steps

### 3. Form Edit Page (`src/app/[locale]/cms/forms/[id]/edit/page.tsx`)

Updated with three distinct tabs:

1. **General Settings**: Form configuration (title, description, multi-step toggle, etc.)
2. **Fields**: Create and manage form fields
3. **Form Steps**: Create steps and assign fields to them (only visible for multi-step forms)

## Field Management Workflow

### Traditional Single-Step Forms
- All fields are created in the Fields tab
- Fields are rendered in the order specified
- No step assignment needed

### Multi-Step Forms
- Fields are created in the Fields tab (same as single-step)
- Steps are created in the Form Steps tab
- **Fields are assigned to steps** using the assignment interface
- Each step renders only its assigned fields
- Unassigned fields are highlighted and can be easily assigned

## Key Changes from Previous Version

### ✅ **New Approach: Field Assignment**
- Form fields are created once in the Fields tab
- Fields are then **assigned** to different steps
- Fields can be **reassigned** or **unassigned** without deletion
- Clear separation between field creation and step organization

### ❌ **Old Approach: Direct Field Creation**
- ~~Fields were created directly within each step~~
- ~~Each step had its own field creation interface~~
- ~~Deleting a step would delete its fields~~

## Benefits of the New Approach

1. **Reusability**: Fields can be easily moved between steps
2. **Consistency**: All fields are managed in one place
3. **Flexibility**: Steps can be reorganized without recreating fields
4. **Data Integrity**: Deleting a step doesn't delete valuable field configurations
5. **Better UX**: Clear separation of concerns between field creation and step organization

## Usage Guide

### For CMS Users

1. **Create Your Form**:
   - Set up basic form information in General Settings
   - Enable "Multi-step Form" if needed

2. **Create Form Fields**:
   - Go to the Fields tab
   - Add all the fields you need for your entire form
   - Configure each field's properties (label, type, validation, etc.)

3. **Organize Into Steps** (Multi-step only):
   - Go to the Form Steps tab
   - Create steps with descriptive titles
   - Assign fields to appropriate steps using the dropdown menus
   - Reorder steps as needed

4. **Test and Publish**:
   - Preview your form to ensure proper flow
   - Activate the form when ready

### For End Users

1. **Multi-Step Experience**:
   - See progress indicator and step numbers
   - Navigate with Previous/Next buttons
   - Each step validates before allowing progression
   - Form data is preserved across steps

2. **Single-Step Experience**:
   - Traditional form layout with all fields visible
   - Standard form submission

## Technical Implementation

### Data Structure

**Form Fields**:
```typescript
interface FormFieldBase {
  id: string;
  formId: string;
  stepId?: string; // NEW: Optional step assignment
  label: string;
  name: string;
  type: FormFieldType;
  // ... other properties
}
```

**Form Steps**:
```typescript
interface FormStepBase {
  id: string;
  formId: string;
  title: string;
  description?: string;
  order: number;
  isVisible: boolean;
  fields?: FormFieldBase[]; // Populated with assigned fields
}
```

### Field Assignment Logic

```typescript
// Assign field to step
await graphqlClient.updateFormField(fieldId, {
  // ... existing field properties
  stepId: targetStepId
});

// Unassign field from step
await graphqlClient.updateFormField(fieldId, {
  // ... existing field properties
  stepId: undefined
});
```

### Backend Support

The GraphQL resolvers support:
- Creating fields without step assignment
- Updating field step assignments
- Querying fields by step
- Querying unassigned fields

## Error Handling and Validation

- **Field Assignment**: Validates that target step exists
- **Step Deletion**: Fields are unassigned, not deleted
- **Form Validation**: Each step validates its assigned fields
- **User Feedback**: Clear messages for all operations

## Future Enhancements

1. **Drag & Drop**: Visual drag-and-drop field assignment
2. **Field Templates**: Pre-configured field sets for common use cases
3. **Conditional Steps**: Show/hide steps based on previous answers
4. **Step Branching**: Different paths through the form based on responses
5. **Field Dependencies**: Fields that depend on values from other steps

## Migration Notes

Existing forms will continue to work as before. The new field assignment system is backward compatible:
- Single-step forms work exactly as before
- Multi-step forms with existing field assignments are preserved
- New multi-step forms use the improved assignment workflow

## Troubleshooting

### Common Issues

1. **"No fields in step"**: 
   - Check if fields are created in the Fields tab
   - Verify field assignment in the Form Steps tab

2. **Fields not showing in step**:
   - Ensure field is assigned to the correct step
   - Check step visibility settings

3. **Cannot assign field to step**:
   - Verify the form is in multi-step mode
   - Check that the step exists and is not deleted

### Debug Information

The Form Steps tab provides clear visual feedback:
- **Unassigned Fields**: Yellow highlighted section
- **Step Field Count**: Shows number of assigned fields per step
- **Assignment Status**: Clear indication of field assignments

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

## Testing

The implementation includes proper TypeScript types and error handling. For testing:

1. **Unit Tests:** Test individual components with Jest/React Testing Library
2. **Integration Tests:** Test form submission flow end-to-end
3. **E2E Tests:** Use Cypress or Playwright for full user journey testing

## Conclusion

The multi-step form implementation provides a complete solution for creating and managing complex forms with multiple steps. It includes both the user-facing components and the CMS management interface, with full backend support and proper error handling.

## Form Editor Interface

The form editor now features **5 main tabs**:

### 1. General Settings Tab
- Basic form configuration (title, description, slug)
- Multi-step mode toggle
- Form status and behavior settings
- Success messages and redirects
- Submit button customization

### 2. Fields Tab
- Create and manage all form fields
- Field types: text, email, select, radio, checkbox, etc.
- Field validation and styling options
- Field ordering and organization
- **Note**: All fields must be created here first before assigning to steps

### 3. Form Steps Tab (Multi-Step Management)
- Create and manage form steps
- **Drag and drop field assignment** between steps
- Step ordering and visibility controls
- Field assignment via dropdown selectors
- Unassigned fields management

### 4. Preview Tab
- Live form preview with real-time updates
- Responsive viewport testing (desktop, tablet, mobile)
- Interactive form simulation
- Direct link to open form in new tab
- Configuration status indicators

### 5. Results Tab
- Comprehensive analytics dashboard
- Submission statistics and trends
- Submissions table with search/filtering
- Export functionality (CSV download)
- Bulk actions for submission management

## Drag and Drop Functionality

### Features
- **Visual Field Assignment**: Drag fields from "Unassigned Fields" to any step
- **Field Reassignment**: Move fields between different steps
- **Unassign Fields**: Drag fields back to "Unassigned Fields" area
- **Visual Feedback**: Drop zones highlight when hovering with draggable items
- **Touch Support**: Works on mobile devices and tablets
- **Accessibility**: Keyboard navigation and screen reader support

### How It Works
1. **Create Fields**: First create all needed fields in the "Fields" tab
2. **Enable Multi-Step**: Turn on multi-step mode in "General Settings"
3. **Create Steps**: Add steps in the "Form Steps" tab
4. **Assign Fields**: 
   - **Drag Method**: Grab the grip handle (⋮⋮) and drag fields to steps
   - **Dropdown Method**: Use the dropdown selector as a fallback
5. **Reorder**: Move fields between steps or back to unassigned area

### Technical Implementation
- **@dnd-kit Library**: Modern, accessible drag and drop
- **Droppable Zones**: Each step and unassigned area accepts drops
- **Visual States**: Hover effects and drag overlays
- **Error Handling**: Graceful fallbacks and user feedback
- **Real-time Updates**: Immediate UI updates with backend sync

### Fixed Issues (Latest Update)
✅ **Proper Droppable Zones**: Fixed DroppableStep and DroppableUnassigned components
✅ **Field Assignment Logic**: Corrected GraphQL mutations with complete field data
✅ **Visual Feedback**: Added proper hover states and drop indicators
✅ **Linter Errors**: Resolved TypeScript and unused variable issues
✅ **Touch Support**: Improved activation constraints for mobile devices

## Workflow Comparison

### Google Forms Style
1. Create form → Add questions → Organize into sections → Preview → Collect responses
2. **Our Implementation**: Create form → Add fields → Organize into steps → Preview → Manage results

### Typeform Style
1. Build → Design → Share → Analyze
2. **Our Implementation**: Fields → Steps → Preview → Results

## Field Assignment System

### Workflow
```
1. Fields Tab: Create all form fields
   ↓
2. General Settings: Enable multi-step mode
   ↓
3. Form Steps Tab: Create steps and assign fields
   ↓
4. Preview Tab: Test the form experience
   ↓
5. Results Tab: Monitor submissions and analytics
```

### Field States
- **Unassigned**: Fields created but not assigned to any step
- **Assigned**: Fields assigned to a specific step
- **Orphaned**: Fields from deleted steps (automatically become unassigned)

## Technical Architecture

### Components
- **FormStepManager**: Main component for step and field management
- **DraggableField**: Individual field component with drag capabilities
- **DroppableStep**: Step container that accepts field drops
- **DroppableUnassigned**: Unassigned fields container
- **FormPreview**: Live form preview with responsive testing
- **FormResults**: Analytics and submission management

### GraphQL Integration
- **Form CRUD**: Complete form lifecycle management
- **Step Management**: Create, update, delete, reorder steps
- **Field Assignment**: Update field-to-step relationships
- **Submission Handling**: Store and manage form responses
- **Analytics**: Real-time statistics and reporting

### State Management
- **Real-time Updates**: Automatic refresh after changes
- **Optimistic Updates**: Immediate UI feedback
- **Error Recovery**: Graceful handling of failed operations
- **Loading States**: Clear feedback during operations

## User Experience Benefits

### For Form Builders
- **Intuitive Interface**: Familiar tab-based organization
- **Visual Management**: Drag and drop field assignment
- **Live Preview**: See changes immediately
- **Comprehensive Analytics**: Understand form performance

### For Form Users
- **Progressive Disclosure**: Information revealed step by step
- **Better Completion Rates**: Reduced cognitive load
- **Mobile Optimized**: Responsive design for all devices
- **Smooth Transitions**: Animated step navigation

## Troubleshooting

### Common Issues

#### Drag and Drop Not Working
1. **Check Dependencies**: Ensure @dnd-kit packages are installed
2. **Browser Compatibility**: Use modern browsers with pointer events support
3. **Touch Devices**: Ensure activation distance is properly configured
4. **Console Errors**: Check for JavaScript errors in browser console

#### Fields Not Assigning
1. **Field Creation**: Ensure fields are created in Fields tab first
2. **Multi-Step Mode**: Verify multi-step mode is enabled
3. **Step Creation**: Create at least one step before assigning fields
4. **Network Issues**: Check GraphQL mutations are completing successfully

#### Preview Not Updating
1. **Form Save**: Ensure form changes are saved
2. **Cache Issues**: Refresh the preview tab
3. **Field Assignment**: Verify fields are properly assigned to steps
4. **Step Visibility**: Check that steps are marked as visible

### Debug Information
- **Form ID**: Check form.id is valid
- **Field Count**: Verify form.fields array has items
- **Step Count**: Ensure steps array is populated
- **Network Tab**: Monitor GraphQL requests/responses
- **Console Logs**: Check for error messages

## Future Enhancements

### Planned Features
- **Conditional Logic**: Show/hide fields based on previous answers
- **Field Templates**: Pre-built field combinations
- **Advanced Analytics**: Conversion funnels and drop-off analysis
- **Integration APIs**: Connect with external services
- **Custom Themes**: Advanced styling and branding options

### Performance Optimizations
- **Lazy Loading**: Load steps on demand
- **Caching**: Improve response times
- **Batch Operations**: Bulk field assignments
- **Real-time Collaboration**: Multiple editors

## API Reference

### Key Functions
```typescript
// Field assignment
handleAssignFieldToStep(fieldId: string, stepId: string)
handleUnassignFieldFromStep(fieldId: string)

// Step management
handleCreateStep()
handleDeleteStep(stepId: string)
handleMoveStep(stepIndex: number, direction: 'up' | 'down')

// Drag and drop
handleDragStart(event: DragStartEvent)
handleDragEnd(event: DragEndEvent)
```

### GraphQL Mutations
```graphql
# Update field assignment
mutation UpdateFormField($id: ID!, $input: UpdateFormFieldInput!) {
  updateFormField(id: $id, input: $input) {
    success
    message
    field { id stepId formId }
  }
}

# Create form step
mutation CreateFormStep($input: FormStepInput!) {
  createFormStep(input: $input) {
    success
    message
    step { id title order }
  }
}
```

This implementation provides a professional, user-friendly form building experience that rivals commercial solutions while maintaining full control and customization capabilities. 