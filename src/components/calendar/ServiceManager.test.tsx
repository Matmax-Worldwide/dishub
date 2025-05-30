import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceManager from './ServiceManager';
import { graphqlClient } from '@/lib/graphql-client';
import { toast } from 'sonner';

// Mock graphqlClient
jest.mock('@/lib/graphql-client', () => ({
  graphqlClient: {
    services: jest.fn(),
    deleteService: jest.fn(),
    serviceCategories: jest.fn(), // For form dropdown
    locations: jest.fn(),       // For form dropdown
  },
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useParams: jest.fn(() => ({ locale: 'en' })),
  usePathname: jest.fn(() => '/cms/calendar/services'),
}));

// Mock child components: ServiceForm and AlertDialog
jest.mock('./ServiceForm', () => {
  return {
    __esModule: true,
    default: jest.fn(({ isOpen, onClose, onSave, initialData, categories, locations }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="service-form-mock">
          <button onClick={onClose}>Close Form</button>
          <button onClick={() => onSave({ name: 'Mock Save Service', ...initialData })}>
            Save Form
          </button>
          <span>{initialData ? `Editing: ${initialData.name}` : 'Adding New Service'}</span>
          {categories && <span data-testid="categories-prop-check">Categories: {categories.length}</span>}
          {locations && <span data-testid="locations-prop-check">Locations: {locations.length}</span>}
        </div>
      );
    }),
  };
});

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: jest.fn(({ children, open }) => (open ? <div data-testid="alert-dialog-mock">{children}</div> : null)),
  AlertDialogTrigger: jest.fn(({ children }) => children),
  AlertDialogContent: jest.fn(({ children }) => <div>{children}</div>),
  AlertDialogHeader: jest.fn(({ children }) => <div>{children}</div>),
  AlertDialogTitle: jest.fn(({ children }) => <h5>{children}</h5>),
  AlertDialogDescription: jest.fn(({ children }) => <p>{children}</p>),
  AlertDialogFooter: jest.fn(({ children }) => <div>{children}</div>),
  AlertDialogCancel: jest.fn(({ children, onClick }) => <button onClick={onClick} data-testid="alert-dialog-cancel-button">{children}</button>),
  AlertDialogAction: jest.fn(({ children, onClick }) => <button onClick={onClick} data-testid="alert-dialog-action-button">{children}</button>),
}));

const mockServicesData = [
  { id: '1', name: 'Consultation', durationMinutes: 30, price: 100, serviceCategoryId: 'cat1', serviceCategory: { name: 'Medical' }, locations: [{id: 'loc1', name: 'Main Clinic'}] },
  { id: '2', name: 'Therapy Session', durationMinutes: 60, price: 150, serviceCategoryId: 'cat2', serviceCategory: { name: 'Wellness' }, locations: [] },
];
const mockCategoriesData = [{ id: 'cat1', name: 'Medical' }, { id: 'cat2', name: 'Wellness' }];
const mockLocationsData = [{ id: 'loc1', name: 'Main Clinic' }, { id: 'loc2', name: 'Downtown Branch' }];

describe('ServiceManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (graphqlClient.services as jest.Mock).mockResolvedValue([...mockServicesData]);
    (graphqlClient.serviceCategories as jest.Mock).mockResolvedValue([...mockCategoriesData]);
    (graphqlClient.locations as jest.Mock).mockResolvedValue([...mockLocationsData]);
  });

  it('fetches and displays services, categories, and locations on mount', async () => {
    render(<ServiceManager />);
    expect(graphqlClient.services).toHaveBeenCalledTimes(1);
    expect(graphqlClient.serviceCategories).toHaveBeenCalledTimes(1);
    expect(graphqlClient.locations).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('Consultation')).toBeInTheDocument();
      expect(screen.getByText('Therapy Session')).toBeInTheDocument();
    });
  });

  it('displays a loading state initially', () => {
    (graphqlClient.services as jest.Mock).mockImplementation(() => new Promise(() => {})); // Keep services pending
    render(<ServiceManager />);
    expect(screen.getByText(/loading services/i)).toBeInTheDocument();
  });

  it('displays an error message if fetching services fails', async () => {
    (graphqlClient.services as jest.Mock).mockRejectedValue(new Error('Failed to fetch services'));
    render(<ServiceManager />);
    await waitFor(() => {
      expect(screen.getByText(/error fetching services data/i)).toBeInTheDocument(); // Adjusted to match actual error display
    });
  });

  it('opens ServiceForm when "Add New Service" is clicked', async () => {
    render(<ServiceManager />);
    // Wait for initial data to load to prevent state update issues
    await waitFor(() => expect(graphqlClient.services).toHaveBeenCalled());
    await waitFor(() => expect(graphqlClient.serviceCategories).toHaveBeenCalled());
    await waitFor(() => expect(graphqlClient.locations).toHaveBeenCalled());

    await userEvent.click(screen.getByRole('button', { name: /add new service/i }));
    
    await waitFor(() => {
      expect(screen.getByTestId('service-form-mock')).toBeInTheDocument();
      expect(screen.getByText('Adding New Service')).toBeInTheDocument();
      expect(screen.getByTestId('categories-prop-check')).toHaveTextContent(`Categories: ${mockCategoriesData.length}`);
      expect(screen.getByTestId('locations-prop-check')).toHaveTextContent(`Locations: ${mockLocationsData.length}`);
    });
  });

  it('opens ServiceForm with initialData for "Edit"', async () => {
    render(<ServiceManager />);
    await waitFor(() => expect(screen.getByText('Consultation')).toBeInTheDocument());
    
    const editButtons = await screen.findAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId('service-form-mock')).toBeInTheDocument();
      expect(screen.getByText(`Editing: ${mockServicesData[0].name}`)).toBeInTheDocument();
    });
  });

  it('handles deleting a service with confirmation', async () => {
    (graphqlClient.deleteService as jest.Mock).mockResolvedValue({ id: mockServicesData[0].id });
    render(<ServiceManager />);
    await waitFor(() => expect(screen.getByText('Consultation')).toBeInTheDocument());

    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => expect(screen.getByTestId('alert-dialog-mock')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('alert-dialog-action-button'));

    await waitFor(() => {
      expect(graphqlClient.deleteService).toHaveBeenCalledWith({ id: mockServicesData[0].id });
      expect(toast.success).toHaveBeenCalledWith('Service "Consultation" deleted successfully.');
      // Services, categories, and locations are fetched again.
      expect(graphqlClient.services).toHaveBeenCalledTimes(2);
      expect(graphqlClient.serviceCategories).toHaveBeenCalledTimes(2);
      expect(graphqlClient.locations).toHaveBeenCalledTimes(2);
    });
  });
});
