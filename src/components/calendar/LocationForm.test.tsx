import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationForm from './LocationForm'; // Adjust path as necessary

// Mock sonner for toast error if form has direct validation errors displayed via toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSave: mockOnSave,
  initialData: null,
  isSaving: false,
};

describe('LocationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when adding a new location', () => {
    render(<LocationForm {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /add new location/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/address/i)).toHaveValue('');
    expect(screen.getByLabelText(/phone/i)).toHaveValue('');
    expect(screen.getByLabelText(/operating hours \(json\)/i)).toHaveValue('');
  });

  it('renders correctly with initialData for editing', () => {
    const initialData = {
      id: '1',
      name: 'Existing Location',
      address: '123 Old St',
      phone: '555-1234',
      operatingHours: JSON.stringify({ MONDAY: "9-5" }),
    };
    render(<LocationForm {...defaultProps} initialData={initialData} />);
    expect(screen.getByRole('heading', { name: /edit location/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue(initialData.name);
    expect(screen.getByLabelText(/address/i)).toHaveValue(initialData.address);
    expect(screen.getByLabelText(/phone/i)).toHaveValue(initialData.phone);
    expect(screen.getByLabelText(/operating hours \(json\)/i)).toHaveValue(initialData.operatingHours);
  });

  it('updates form fields on user input', async () => {
    render(<LocationForm {...defaultProps} />);
    const nameInput = screen.getByLabelText(/name/i);
    const addressInput = screen.getByLabelText(/address/i);
    const phoneInput = screen.getByLabelText(/phone/i);
    const hoursInput = screen.getByLabelText(/operating hours \(json\)/i);

    await userEvent.type(nameInput, 'New Clinic');
    await userEvent.type(addressInput, '456 Health Ave');
    await userEvent.type(phoneInput, '555-9876');
    await userEvent.type(hoursInput, '{ "TUESDAY": "10-7" }');

    expect(nameInput).toHaveValue('New Clinic');
    expect(addressInput).toHaveValue('456 Health Ave');
    expect(phoneInput).toHaveValue('555-9876');
    expect(hoursInput).toHaveValue('{ "TUESDAY": "10-7" }');
  });

  it('calls onSave with the form data when submitted', async () => {
    render(<LocationForm {...defaultProps} />);
    const nameInput = screen.getByLabelText(/name/i);
    const addressInput = screen.getByLabelText(/address/i);
    const phoneInput = screen.getByLabelText(/phone/i);
    const hoursInput = screen.getByLabelText(/operating hours \(json\)/i);
    
    const formData = {
      name: 'Test Location',
      address: '789 Test Rd',
      phone: '555-5555',
      operatingHours: '{ "WEDNESDAY": "8-4" }',
    };

    await userEvent.type(nameInput, formData.name);
    await userEvent.type(addressInput, formData.address);
    await userEvent.type(phoneInput, formData.phone);
    await userEvent.clear(hoursInput); // Clear potential default or previous value
    await userEvent.type(hoursInput, formData.operatingHours);
    
    const saveButton = screen.getByRole('button', { name: /save location/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        operatingHours: JSON.parse(formData.operatingHours), // Form should parse JSON string before saving
      });
    });
  });
  
  it('validates operatingHours as JSON', async () => {
    render(<LocationForm {...defaultProps} />);
    const hoursInput = screen.getByLabelText(/operating hours \(json\)/i);
    await userEvent.type(hoursInput, 'not valid json');
    
    const saveButton = screen.getByRole('button', { name: /save location/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      // Check for an error message related to invalid JSON
      // This depends on how the form displays validation errors.
      // If it uses sonner.toast.error, that would be mocked.
      // For now, we'll assume onSave is NOT called if JSON is invalid,
      // or if it is, it's called with an error or the raw string.
      // The component's actual validation logic dictates this.
      // The current LocationForm tries to parse and catches error.
      expect(mockOnSave).not.toHaveBeenCalled(); // Or expect it to be called with raw string and error handler to be called
      expect(screen.getByText(/invalid json format for operating hours/i)).toBeInTheDocument();
    });
  });


  it('calls onClose when the cancel button is clicked', async () => {
    render(<LocationForm {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('disables the save button when isSaving is true', () => {
    render(<LocationForm {...defaultProps} isSaving={true} />);
    const saveButton = screen.getByRole('button', { name: /saving/i }); // Text changes to "Saving..."
    expect(saveButton).toBeDisabled();
  });

   it('calls onSave with initialData merged with new data for edit', async () => {
    const initialData = {
      id: '1',
      name: 'Old Name',
      address: 'Old Address',
      phone: '111-1111',
      operatingHours: { MONDAY: "9-5" },
    };
    render(<LocationForm {...defaultProps} initialData={initialData} />);
    
    const nameInput = screen.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Name');

    const saveButton = screen.getByRole('button', { name: /save location/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        id: '1', // id should be preserved
        name: 'New Name', // new name
        address: initialData.address, // old address (not changed)
        phone: initialData.phone, // old phone (not changed)
        operatingHours: initialData.operatingHours, // old hours (not changed in this test)
      });
    });
  });

});
