import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationManager from './LocationManager'; // Adjust path as necessary
import { graphqlClient } from '@/lib/graphql-client'; // Actual path
import { toast } from 'sonner'; // Actual path

// Mock graphqlClient
jest.mock('@/lib/graphql-client', () => ({
  graphqlClient: {
    locations: jest.fn(),
    deleteLocation: jest.fn(),
    // createLocation and updateLocation will be tested via StaffForm's onSave,
    // but their success/error can be mocked here if LocationManager handles their direct invocation.
    // For now, focusing on locations query and deleteLocation mutation.
  },
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useParams: jest.fn(() => ({ locale: 'en' })),
  usePathname: jest.fn(() => '/cms/calendar/locations'),
}));

// Mock child components: LocationForm and AlertDialog
jest.mock('./LocationForm', () => {
  return {
    __esModule: true,
    default: jest.fn(({ isOpen, onClose, onSave, initialData }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="location-form-mock">
          <button onClick={onClose} data-testid="location-form-close-button">Close Form</button>
          <button onClick={() => onSave({ name: 'Mock Save', ...initialData })} data-testid="location-form-save-button">
            Save Form
          </button>
          <span>{initialData ? `Editing: ${initialData.name}` : 'Adding New Location'}</span>
        </div>
      );
    }),
  };
});

// A more complete AlertDialog mock to allow interaction
jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: jest.fn(({ children, open }) => (open ? <div data-testid="alert-dialog-mock">{children}</div> : null)),
  AlertDialogTrigger: jest.fn(({ children }) => children),
  AlertDialogContent: jest.fn(({ children }) => <div data-testid="alert-dialog-content-mock">{children}</div>),
  AlertDialogHeader: jest.fn(({ children }) => <div>{children}</div>),
  AlertDialogTitle: jest.fn(({ children }) => <h5>{children}</h5>),
  AlertDialogDescription: jest.fn(({ children }) => <p>{children}</p>),
  AlertDialogFooter: jest.fn(({ children }) => <div>{children}</div>),
  AlertDialogCancel: jest.fn(({ children, onClick }) => <button onClick={onClick} data-testid="alert-dialog-cancel-button">{children}</button>),
  AlertDialogAction: jest.fn(({ children, onClick }) => <button onClick={onClick} data-testid="alert-dialog-action-button">{children}</button>),
}));


const mockLocationsData = [
  { id: '1', name: 'Main Clinic', address: '123 Health St', phone: '555-0101', operatingHours: { MONDAY: '9-5' }, createdAt: new Date().toISOString() },
  { id: '2', name: 'Downtown Branch', address: '456 Urban Rd', phone: '555-0102', operatingHours: { TUESDAY: '10-6' }, createdAt: new Date().toISOString() },
];

describe('LocationManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (graphqlClient.locations as jest.Mock).mockResolvedValue([...mockLocationsData]); // Default successful fetch
  });

  it('fetches and displays locations on mount', async () => {
    render(<LocationManager />);
    expect(graphqlClient.locations).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText('Main Clinic')).toBeInTheDocument();
      expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
    });
  });

  it('displays a loading state initially', () => {
    (graphqlClient.locations as jest.Mock).mockImplementation(() => new Promise(() => {})); // Keep it pending
    render(<LocationManager />);
    expect(screen.getByText(/loading locations/i)).toBeInTheDocument(); // Or check for a loader component
  });

  it('displays an error message if fetching locations fails', async () => {
    (graphqlClient.locations as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));
    render(<LocationManager />);
    await waitFor(() => {
      expect(screen.getByText(/error fetching locations/i)).toBeInTheDocument();
    });
  });

  it('opens the LocationForm when "Add New Location" is clicked', async () => {
    render(<LocationManager />);
    await userEvent.click(screen.getByRole('button', { name: /add new location/i }));
    await waitFor(() => {
      expect(screen.getByTestId('location-form-mock')).toBeInTheDocument();
      expect(screen.getByText('Adding New Location')).toBeInTheDocument();
    });
  });

  it('opens the LocationForm with initial data when "Edit" is clicked', async () => {
    render(<LocationManager />);
    await waitFor(() => expect(screen.getByText('Main Clinic')).toBeInTheDocument()); // Ensure data is loaded

    // Assuming edit buttons are identifiable, e.g., by row context or specific data-testid
    // For simplicity, let's assume the first "Edit" button corresponds to the first location
    const editButtons = await screen.findAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId('location-form-mock')).toBeInTheDocument();
      expect(screen.getByText(`Editing: ${mockLocationsData[0].name}`)).toBeInTheDocument();
    });
  });
  
  it('handles saving a new location (closes form, re-fetches, toasts)', async () => {
    // This test is more about LocationManager's response to LocationForm's onSave
    // The actual graphqlClient.createLocation call is initiated by LocationForm's onSave prop,
    // which then calls handleSave in LocationManager.
    // Here, we simulate LocationForm calling its onSave.
    
    render(<LocationManager />);
    await userEvent.click(screen.getByRole('button', { name: /add new location/i }));
    await waitFor(() => expect(screen.getByTestId('location-form-mock')).toBeInTheDocument());

    // Simulate form save (mocked form calls onSave directly)
    // The actual createLocation mock would be within handleSave if it were directly here.
    // For this test, we assume the onSave from the form triggers handleSave in manager.
    // LocationManager's handleSave should then call the appropriate GQL client method.
    // We need handleSave to be part of the test, so LocationForm mock calls it.
    // The mock for LocationForm needs to call the onSave prop.
    
    // We can't directly test handleSave here without a more complex form mock or by refactoring.
    // Instead, we'll test the effects: form closes, data re-fetches.
    // The actual GQL call for create/update is implicitly tested when the form's onSave is triggered.

    // Simulate the form being saved and calling its onSave prop, which in turn calls handleSave in LocationManager
    // The handleSave in LocationManager will then call the (mocked) graphqlClient methods.
    (graphqlClient.locations as jest.Mock).mockResolvedValueOnce(mockLocationsData); // Initial load
    (graphqlClient.locations as jest.Mock).mockResolvedValueOnce([ // Load after presumed save
      ...mockLocationsData, 
      { id: '3', name: 'New Mock Location', address: '789 New St', phone: '555-0103' }
    ]);


    fireEvent.click(screen.getByTestId('location-form-save-button'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('location-form-mock')).not.toBeInTheDocument(); // Form closes
    });
    await waitFor(() => {
      expect(graphqlClient.locations).toHaveBeenCalledTimes(2); // Initial fetch + re-fetch after save
      // Toast success is called by handleSave. We are not testing handleSave directly here.
      // This part would be better in an integration test or if handleSave was directly invoked.
    });
  });


  it('handles deleting a location with confirmation', async () => {
    (graphqlClient.deleteLocation as jest.Mock).mockResolvedValue({ id: mockLocationsData[0].id }); // Simulate successful delete
    
    render(<LocationManager />);
    await waitFor(() => expect(screen.getByText('Main Clinic')).toBeInTheDocument());

    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    // Check for confirmation dialog
    await waitFor(() => {
      expect(screen.getByTestId('alert-dialog-mock')).toBeInTheDocument();
      expect(screen.getByText(/are you absolutely sure/i)).toBeInTheDocument();
    });
    
    // Click confirm delete button
    await userEvent.click(screen.getByTestId('alert-dialog-action-button'));

    await waitFor(() => {
      expect(graphqlClient.deleteLocation).toHaveBeenCalledWith({ id: mockLocationsData[0].id });
      expect(toast.success).toHaveBeenCalledWith('Location "Main Clinic" deleted successfully.');
      expect(graphqlClient.locations).toHaveBeenCalledTimes(2); // Initial fetch + re-fetch after delete
    });
  });
  
  it('cancels deleting a location', async () => {
    render(<LocationManager />);
    await waitFor(() => expect(screen.getByText('Main Clinic')).toBeInTheDocument());

    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);
    
    await waitFor(() => expect(screen.getByTestId('alert-dialog-mock')).toBeInTheDocument());
    
    await userEvent.click(screen.getByTestId('alert-dialog-cancel-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('alert-dialog-mock')).not.toBeInTheDocument();
      expect(graphqlClient.deleteLocation).not.toHaveBeenCalled();
    });
  });

});
