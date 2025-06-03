import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormStepManager from './FormStepManager';
import { FormBase, FormFieldType } from '@/types/forms';
import graphqlClient from '@/lib/graphql-client';
import { toast } from 'sonner';
import * as DndKitCore from '@dnd-kit/core';

// Mock graphqlClient
jest.mock('@/lib/graphql-client', () => ({
  getFormSteps: jest.fn(),
  getFormFields: jest.fn(),
  createFormStep: jest.fn(),
  deleteFormStep: jest.fn(),
  updateFormStep: jest.fn(),
  updateStepOrders: jest.fn(),
  updateFormField: jest.fn(), // For assigning/unassigning fields
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock EditStepModal
jest.mock('./EditStepModal', () => ({
  __esModule: true,
  default: jest.fn(({ isOpen, onClose, onSave, step }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="edit-step-modal">
        <h2>Edit Step: {step?.title}</h2>
        <button onClick={() => onSave({ ...step, title: 'Updated In Modal' })}>Save Modal</button>
        <button onClick={onClose}>Close Modal</button>
      </div>
    );
  }),
}));

// Mock @dnd-kit
jest.mock('@dnd-kit/core', () => ({
  ...jest.requireActual('@dnd-kit/core'), // Import and retain default exports
  DndContext: jest.fn(({ children }) => <div>{children}</div>), // Simplified mock
  DragOverlay: jest.fn(({ children }) => <div>{children}</div>),
  useSensor: jest.fn(),
  useSensors: jest.fn(),
  closestCorners: jest.fn(), // Mock if it's directly used and not just part of DndContext default
  PointerSensor: jest.fn(),
  KeyboardSensor: jest.fn(),
  arrayMove: jest.fn((array, from, to) => { // Basic mock for arrayMove
    const newArray = [...array];
    const [movedItem] = newArray.splice(from, 1);
    newArray.splice(to, 0, movedItem);
    return newArray;
  }),
}));
jest.mock('@dnd-kit/sortable', () => ({
  ...jest.requireActual('@dnd-kit/sortable'),
  SortableContext: jest.fn(({ children }) => <div>{children}</div>),
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  verticalListSortingStrategy: jest.fn(),
  sortableKeyboardCoordinates: jest.fn(),
}));
jest.mock('./SortableStepItem', () => ({ // Mock the custom SortableStepItem
    __esModule: true,
    SortableStepItem: jest.fn(({ children }) => <div>{children}</div>)
}));


const mockForm: FormBase = {
  id: 'form1',
  title: 'Multi Step Form',
  slug: 'multi-step-form',
  isMultiStep: true,
  isActive: true,
  createdById: 'user1',
  fields: [
    { id: 'field1', formId: 'form1', name: 'q1', label: 'Question 1', type: FormFieldType.TEXT, order: 0, stepId: 'step1', isRequired: false },
    { id: 'field2', formId: 'form1', name: 'q2', label: 'Question 2', type: FormFieldType.TEXT, order: 1, stepId: 'step1', isRequired: false },
    { id: 'field3', formId: 'form1', name: 'q3', label: 'Question 3', type: FormFieldType.TEXT, order: 0, stepId: 'step2', isRequired: false },
    { id: 'field4', formId: 'form1', name: 'q4', label: 'Unassigned Q', type: FormFieldType.TEXT, order: 2, isRequired: false },
  ],
  steps: [
    { id: 'step1', formId: 'form1', title: 'Step 1', description: 'First step', order: 0, isVisible: true, fields: [] },
    { id: 'step2', formId: 'form1', title: 'Step 2', description: 'Second step', order: 1, isVisible: true, fields: [] },
  ],
  submitButtonText: 'Submit',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('FormStepManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (graphqlClient.getFormSteps as jest.Mock).mockResolvedValue([
        { id: 'step1', formId: 'form1', title: 'Step 1', description: 'First step', order: 0, isVisible: true },
        { id: 'step2', formId: 'form1', title: 'Step 2', description: 'Second step', order: 1, isVisible: true },
    ]);
    (graphqlClient.getFormFields as jest.Mock).mockImplementation((formId, stepId) => {
        if (stepId === 'step1') return Promise.resolve([mockForm.fields![0], mockForm.fields![1]]);
        if (stepId === 'step2') return Promise.resolve([mockForm.fields![2]]);
        return Promise.resolve([]);
    });
    (DndKitCore.useSensor as jest.Mock).mockImplementation(sensor => new sensor()); // Mock sensor initialization
    (DndKitCore.useSensors as jest.Mock).mockImplementation((...sensors) => sensors);
  });

  it('renders steps and their fields', async () => {
    render(<FormStepManager form={mockForm} onFormUpdate={jest.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
    });
    // Check if fields associated with steps are implicitly rendered via DraggableField (mocked or actual)
    // This depends on how DraggableField is mocked or if we look for text within it.
    // For now, ensuring steps load is a good start.
  });

  it('opens EditStepModal when edit step details button is clicked', async () => {
    render(<FormStepManager form={mockForm} onFormUpdate={jest.fn()} />);
    await waitFor(() => expect(graphqlClient.getFormSteps).toHaveBeenCalled());

    const editButtons = screen.getAllByTitle(/Edit Step Details/i);
    fireEvent.click(editButtons[0]); // Click edit for the first step

    await waitFor(() => {
      expect(screen.getByTestId('edit-step-modal')).toBeInTheDocument();
      expect(screen.getByText(/Edit Step: Step 1/i)).toBeInTheDocument();
    });
  });

  it('calls updateFormStep when EditStepModal is saved', async () => {
    (graphqlClient.updateFormStep as jest.Mock).mockResolvedValue({ success: true, step: { ...mockForm.steps![0], title: 'Updated In Modal' } });
    
    render(<FormStepManager form={mockForm} onFormUpdate={jest.fn()} />);
    await waitFor(() => expect(graphqlClient.getFormSteps).toHaveBeenCalled());

    const editButtons = screen.getAllByTitle(/Edit Step Details/i);
    fireEvent.click(editButtons[0]); // Open modal for first step

    await waitFor(() => expect(screen.getByTestId('edit-step-modal')).toBeInTheDocument());
    
    const saveModalButton = screen.getByText('Save Modal');
    fireEvent.click(saveModalButton);

    await waitFor(() => {
      expect(graphqlClient.updateFormStep).toHaveBeenCalledWith('step1', expect.objectContaining({ title: 'Updated In Modal' }));
    });
    expect(toast.success).toHaveBeenCalledWith('Step details updated successfully.');
  });

});

// Helper to get component instance or props (conceptual for testing handlers)
// This is generally not how you test with RTL, but shows intent for handler logic.
// const getComponentInstanceProps = (element) => {
//   const { rerender, container } = render(element);
//   // This is highly dependent on how the component is structured and not standard.
//   // It's better to trigger interactions that call the handlers.
// };
