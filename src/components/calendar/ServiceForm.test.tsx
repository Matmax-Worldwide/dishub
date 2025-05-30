import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceForm from './ServiceForm'; // Adjust path as necessary

const mockCategories = [
  { id: 'cat1', name: 'Category A' },
  { id: 'cat2', name: 'Category B' },
];
const mockLocations = [
  { id: 'loc1', name: 'Location X' },
  { id: 'loc2', name: 'Location Y' },
  { id: 'loc3', name: 'Location Z' },
];

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSave: mockOnSave,
  initialData: null,
  isSaving: false,
  categories: mockCategories,
  locations: mockLocations,
};

describe('ServiceForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when adding a new service', () => {
    render(<ServiceForm {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /add new service/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/duration \(minutes\)/i)).toHaveValue(null); // Number input
    expect(screen.getByLabelText(/price/i)).toHaveValue(null); // Number input
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/active/i)).toBeChecked(); // Assuming default is active
    // Check for location switches/checkboxes
    mockLocations.forEach(loc => {
      expect(screen.getByLabelText(loc.name)).toBeInTheDocument();
      expect(screen.getByLabelText(loc.name)).not.toBeChecked(); // Default not checked
    });
  });

  it('renders correctly with initialData for editing', () => {
    const initialData = {
      id: 'svc1',
      name: 'Existing Service',
      description: 'Old Description',
      durationMinutes: 45,
      price: 120.50,
      serviceCategoryId: 'cat1',
      isActive: false,
      locationIds: ['loc1', 'loc3'],
      bufferTimeBeforeMinutes: 5,
      bufferTimeAfterMinutes: 10,
    };
    render(<ServiceForm {...defaultProps} initialData={initialData} />);
    expect(screen.getByRole('heading', { name: /edit service/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue(initialData.name);
    expect(screen.getByLabelText(/description/i)).toHaveValue(initialData.description);
    expect(screen.getByLabelText(/duration \(minutes\)/i)).toHaveValue(initialData.durationMinutes);
    expect(screen.getByLabelText(/price/i)).toHaveValue(initialData.price);
    expect(screen.getByLabelText(/active/i)).not.toBeChecked();
    expect(screen.getByLabelText(/buffer time before \(minutes\)/i)).toHaveValue(initialData.bufferTimeBeforeMinutes);
    expect(screen.getByLabelText(/buffer time after \(minutes\)/i)).toHaveValue(initialData.bufferTimeAfterMinutes);
    
    // Check selected locations
    expect(screen.getByLabelText(mockLocations.find(l=>l.id === 'loc1')!.name)).toBeChecked();
    expect(screen.getByLabelText(mockLocations.find(l=>l.id === 'loc2')!.name)).not.toBeChecked();
    expect(screen.getByLabelText(mockLocations.find(l=>l.id === 'loc3')!.name)).toBeChecked();
    // Category select value check is more complex, often verified via onSave or by checking trigger text
  });

  it('updates form fields on user input', async () => {
    render(<ServiceForm {...defaultProps} />);
    await userEvent.type(screen.getByLabelText(/name/i), 'New Massage Type');
    await userEvent.type(screen.getByLabelText(/description/i), 'A relaxing massage.');
    await userEvent.type(screen.getByLabelText(/duration \(minutes\)/i), '75');
    await userEvent.type(screen.getByLabelText(/price/i), '99.99');
    await userEvent.click(screen.getByLabelText(/active/i)); // Toggle off
    await userEvent.click(screen.getByLabelText(mockLocations[0].name)); // Select Location X
    await userEvent.click(screen.getByLabelText(mockLocations[2].name)); // Select Location Z

    expect(screen.getByLabelText(/name/i)).toHaveValue('New Massage Type');
    expect(screen.getByLabelText(/description/i)).toHaveValue('A relaxing massage.');
    expect(screen.getByLabelText(/duration \(minutes\)/i)).toHaveValue(75);
    expect(screen.getByLabelText(/price/i)).toHaveValue(99.99);
    expect(screen.getByLabelText(/active/i)).not.toBeChecked();
    expect(screen.getByLabelText(mockLocations[0].name)).toBeChecked();
    expect(screen.getByLabelText(mockLocations[1].name)).not.toBeChecked();
    expect(screen.getByLabelText(mockLocations[2].name)).toBeChecked();
  });

  it('calls onSave with the form data when submitted', async () => {
    render(<ServiceForm {...defaultProps} />);
    
    const formData = {
      name: 'Super Service',
      description: 'The best service.',
      durationMinutes: 90,
      price: 200,
      serviceCategoryId: 'cat2',
      isActive: true,
      locationIds: ['loc2'],
      bufferTimeBeforeMinutes: 15,
      bufferTimeAfterMinutes: 0,
      maxDailyBookingsPerService: 10,
      preparationTimeMinutes: 5,
      cleanupTimeMinutes: 5,
    };

    await userEvent.type(screen.getByLabelText(/name/i), formData.name);
    await userEvent.type(screen.getByLabelText(/description/i), formData.description);
    await userEvent.type(screen.getByLabelText(/duration \(minutes\)/i), formData.durationMinutes.toString());
    await userEvent.type(screen.getByLabelText(/price/i), formData.price.toString());
    
    // Select category
    await userEvent.click(screen.getByLabelText(/category/i));
    await userEvent.click(await screen.findByText('Category B')); // Assuming 'Category B' corresponds to 'cat2'

    // Select locations
    await userEvent.click(screen.getByLabelText('Location Y')); // Corresponds to loc2

    // Optional fields
    await userEvent.type(screen.getByLabelText(/buffer time before \(minutes\)/i), formData.bufferTimeBeforeMinutes.toString());
    // Buffer time after is 0, so no need to type if default is empty or 0
    await userEvent.type(screen.getByLabelText(/max daily bookings per service \(optional\)/i), formData.maxDailyBookingsPerService.toString());
    await userEvent.type(screen.getByLabelText(/preparation time \(minutes, optional\)/i), formData.preparationTimeMinutes.toString());
    await userEvent.type(screen.getByLabelText(/cleanup time \(minutes, optional\)/i), formData.cleanupTimeMinutes.toString());

    // Active is true by default, so no change needed if formData.isActive is true

    const saveButton = screen.getByRole('button', { name: /save service/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(formData);
    });
  });

  it('calls onClose when the cancel button is clicked', async () => {
    render(<ServiceForm {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('disables the save button when isSaving is true', () => {
    render(<ServiceForm {...defaultProps} isSaving={true} />);
    const saveButton = screen.getByRole('button', { name: /saving/i });
    expect(saveButton).toBeDisabled();
  });

  it('shows validation error if duration is not positive', async () => {
    render(<ServiceForm {...defaultProps} />);
    const durationInput = screen.getByLabelText(/duration \(minutes\)/i);
    const nameInput = screen.getByLabelText(/name/i); // Name is required
    const priceInput = screen.getByLabelText(/price/i); // Price is required
    
    await userEvent.type(nameInput, 'Test Service');
    await userEvent.type(priceInput, '10');
    // Select category (assuming it's required)
    await userEvent.click(screen.getByLabelText(/category/i));
    await userEvent.click(await screen.findByText(mockCategories[0].name));


    await userEvent.type(durationInput, '0');
    await userEvent.click(screen.getByRole('button', { name: /save service/i }));
    
    // Depending on how validation messages are shown (e.g., inline text, toast)
    // This assumes an inline error message appears near the field or a general error area.
    // The actual ServiceForm component uses react-hook-form, errors would be associated with fields.
    // A more precise test would be to check for error role or specific error text if known.
    await waitFor(() => {
      // This is a conceptual check. Actual message depends on Zod schema in the component.
      // For example, if Zod says "Duration must be greater than 0"
      // expect(screen.getByText(/duration must be greater than 0/i)).toBeInTheDocument();
      // For now, we'll check that onSave was NOT called, implying validation failed.
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    await userEvent.clear(durationInput);
    await userEvent.type(durationInput, '-10');
    await userEvent.click(screen.getByRole('button', { name: /save service/i }));
    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  it('handles empty categories prop correctly', () => {
    render(<ServiceForm {...defaultProps} categories={[]} />);
    // Category select should be disabled or show a specific message
    // The Radix Select component might be disabled if no options are passed,
    // or the trigger might show "No categories".
    // We can check if the trigger is there but perhaps implies no options.
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    // Attempting to click to open it shouldn't show options from mockCategories
    fireEvent.mouseDown(screen.getByLabelText(/category/i)); // Or userEvent.click
    mockCategories.forEach(cat => {
      expect(screen.queryByText(cat.name)).toBeNull();
    });
    // It might display a "No categories available" text within its popover if designed that way.
  });

  it('handles empty locations prop correctly', () => {
    render(<ServiceForm {...defaultProps} locations={[]} />);
    // Location checklist area should indicate no locations
    expect(screen.getByText(/no locations available/i)).toBeInTheDocument(); // Assuming this text exists
    mockLocations.forEach(loc => {
      expect(screen.queryByLabelText(loc.name)).toBeNull();
    });
  });

});
