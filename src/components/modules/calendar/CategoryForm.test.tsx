import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryForm from './CategoryForm'; // Adjust path as necessary

const mockCategoriesForSelect = [
  { id: 'cat1', name: 'Parent Category 1', parentId: null },
  { id: 'cat2', name: 'Parent Category 2', parentId: null },
  { id: 'cat3', name: 'Sub Category of Cat1', parentId: 'cat1' },
];

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSave: mockOnSave,
  initialData: null,
  isSaving: false,
  categories: mockCategoriesForSelect, // For parent category selector
};

describe('CategoryForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when adding a new category', () => {
    render(<CategoryForm {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /add new category/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/display order/i)).toHaveValue(0); // Assuming default is 0
    expect(screen.getByLabelText(/parent category/i)).toBeInTheDocument();
  });

  it('renders correctly with initialData for editing', () => {
    const initialData = {
      id: 'edit-cat',
      name: 'Existing Category',
      description: 'Old Description',
      displayOrder: 5,
      parentId: 'cat1',
    };
    render(<CategoryForm {...defaultProps} initialData={initialData} />);
    expect(screen.getByRole('heading', { name: /edit category/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue(initialData.name);
    expect(screen.getByLabelText(/description/i)).toHaveValue(initialData.description);
    expect(screen.getByLabelText(/display order/i)).toHaveValue(initialData.displayOrder);
    // MUI Select value is tricky to test directly, check if the trigger displays something or if onSave sends it
  });

  it('updates form fields on user input', async () => {
    render(<CategoryForm {...defaultProps} />);
    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const displayOrderInput = screen.getByLabelText(/display order/i);

    await userEvent.type(nameInput, 'New Category Name');
    await userEvent.type(descriptionInput, 'Fresh Description');
    await userEvent.clear(displayOrderInput); // Clear default 0
    await userEvent.type(displayOrderInput, '10');
    
    // Parent Category Select
    const parentCategorySelect = screen.getByLabelText(/parent category/i);
    await userEvent.click(parentCategorySelect); // Open the select
    // Wait for options to be available (assuming they are rendered in a popover/listbox)
    const optionToSelect = await screen.findByText('Parent Category 1'); 
    await userEvent.click(optionToSelect);


    expect(nameInput).toHaveValue('New Category Name');
    expect(descriptionInput).toHaveValue('Fresh Description');
    expect(displayOrderInput).toHaveValue(10);
    // Value of Select is harder to check directly, will verify in onSave
  });

  it('calls onSave with the form data when submitted', async () => {
    render(<CategoryForm {...defaultProps} />);
    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const displayOrderInput = screen.getByLabelText(/display order/i);
    const parentCategorySelect = screen.getByLabelText(/parent category/i);

    const formData = {
      name: 'Test Category',
      description: 'Test Desc',
      displayOrder: 3,
      parentId: 'cat2', // Will select "Parent Category 2"
    };

    await userEvent.type(nameInput, formData.name);
    await userEvent.type(descriptionInput, formData.description);
    await userEvent.clear(displayOrderInput);
    await userEvent.type(displayOrderInput, formData.displayOrder.toString());
    
    await userEvent.click(parentCategorySelect);
    const optionToSelect = await screen.findByText('Parent Category 2');
    await userEvent.click(optionToSelect);
    
    const saveButton = screen.getByRole('button', { name: /save category/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: formData.name,
        description: formData.description,
        displayOrder: formData.displayOrder,
        parentId: formData.parentId,
      });
    });
  });
  
  it('does not allow selecting itself or its children as parent (if editing)', () => {
    const initialDataForEdit = {
      id: 'cat1', // Editing "Parent Category 1"
      name: 'Parent Category 1',
      parentId: null,
    };
    render(<CategoryForm {...defaultProps} initialData={initialDataForEdit} />);
    
    const parentCategorySelect = screen.getByLabelText(/parent category/i);
    fireEvent.mouseDown(parentCategorySelect); // Open select

    // "Parent Category 1" (itself) should not be an option, or should be disabled
    // "Sub Category of Cat1" (its child) should not be an option, or should be disabled
    // This requires inspecting the options list. Assuming options have role 'option'.
    // This test is conceptual as direct option checking with Radix Select can be complex.
    // A simpler check might be to see if onSave would be called with an invalid parentId.
    // For now, this is a placeholder for a more detailed test of this logic.
    expect(screen.queryByRole('option', { name: 'Parent Category 1' })).toBeNull(); // Or check for disabled attribute
    expect(screen.queryByRole('option', { name: 'Sub Category of Cat1' })).toBeNull(); // Or check for disabled
  });


  it('calls onClose when the cancel button is clicked', async () => {
    render(<CategoryForm {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('disables the save button when isSaving is true', () => {
    render(<CategoryForm {...defaultProps} isSaving={true} />);
    const saveButton = screen.getByRole('button', { name: /saving/i });
    expect(saveButton).toBeDisabled();
  });
});
