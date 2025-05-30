import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StaffManager from './StaffManager'; // Adjust path
import { graphqlClient } from '@/lib/graphql-client'; // Adjust path
import { toast } from 'sonner'; // Adjust path
import { DayOfWeek, ScheduleType } from '@/types/calendar'; // For mock data

// Mock graphqlClient
jest.mock('@/lib/graphql-client', () => ({
  graphqlClient: {
    staffProfiles: jest.fn(),
    users: jest.fn(),
    services: jest.fn(),
    locations: jest.fn(),
    deleteStaffProfile: jest.fn(),
    // createStaffProfile, updateStaffProfile, updateStaffSchedule are tested via form
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
  usePathname: jest.fn(() => '/cms/calendar/staff'),
}));

// Mock child components
jest.mock('./StaffForm', () => {
  return {
    __esModule: true,
    default: jest.fn(({ isOpen, onClose, onSave, initialData, allUsersForSelect, allServices, allLocations }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="staff-form-mock">
          <button onClick={onClose}>Close Form</button>
          <button onClick={() => onSave({ staffProfileData: { bio: 'Mock Bio', ...initialData }, scheduleData: [] })}>
            Save Form
          </button>
          <span>{initialData ? `Editing: ${initialData.user?.firstName}` : 'Adding New Staff'}</span>
          {allUsersForSelect && <span>Users: {allUsersForSelect.length}</span>}
          {allServices && <span>Services: {allServices.length}</span>}
          {allLocations && <span>Locations: {allLocations.length}</span>}
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

const mockUsers = [
  { id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  { id: 'user2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
];
const mockServicesData = [{ id: 'svc1', name: 'Haircut' }];
const mockLocationsData = [{ id: 'loc1', name: 'Main Salon' }];
const mockStaffProfilesData = [
  { 
    id: 'staff1', 
    userId: 'user1', 
    user: mockUsers[0], 
    bio: 'Experienced stylist', 
    specializations: ['cutting', 'coloring'],
    schedules: [
        { id: 'sch1', dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '17:00', isAvailable: true, scheduleType: ScheduleType.REGULAR_HOURS }
    ],
    assignedServices: [{id: 'svc1', name: 'Haircut'}],
    locationAssignments: [{id: 'loc1', name: 'Main Salon'}]
  },
];

describe('StaffManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (graphqlClient.staffProfiles as jest.Mock).mockResolvedValue([...mockStaffProfilesData]);
    (graphqlClient.users as jest.Mock).mockResolvedValue([...mockUsers]);
    (graphqlClient.services as jest.Mock).mockResolvedValue([...mockServicesData]);
    (graphqlClient.locations as jest.Mock).mockResolvedValue([...mockLocationsData]);
  });

  it('fetches and displays staff profiles and related data on mount', async () => {
    render(<StaffManager />);
    expect(graphqlClient.staffProfiles).toHaveBeenCalledTimes(1);
    expect(graphqlClient.users).toHaveBeenCalledTimes(1);
    expect(graphqlClient.services).toHaveBeenCalledTimes(1);
    expect(graphqlClient.locations).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // From staff profile user
    });
  });

  it('displays a loading state initially', () => {
    (graphqlClient.staffProfiles as jest.Mock).mockImplementation(() => new Promise(() => {})); // Keep it pending
    render(<StaffManager />);
    expect(screen.getByText(/loading staff data/i)).toBeInTheDocument();
  });

  it('displays an error message if fetching staff profiles fails', async () => {
    (graphqlClient.staffProfiles as jest.Mock).mockRejectedValue(new Error('Failed to fetch staff'));
    render(<StaffManager />);
    await waitFor(() => {
      expect(screen.getByText(/failed to load data/i)).toBeInTheDocument();
    });
  });

  it('opens StaffForm when "Add New Staff" is clicked', async () => {
    // Ensure there's an available user not already staff
    (graphqlClient.users as jest.Mock).mockResolvedValue([...mockUsers, { id: 'user3', firstName: 'New', lastName: 'User' }]);
    render(<StaffManager />);
    await waitFor(() => expect(graphqlClient.staffProfiles).toHaveBeenCalled());

    await userEvent.click(screen.getByRole('button', { name: /add new staff/i }));
    
    await waitFor(() => {
      expect(screen.getByTestId('staff-form-mock')).toBeInTheDocument();
      expect(screen.getByText('Adding New Staff')).toBeInTheDocument();
      // Check if props are passed to the form
      expect(screen.getByText(/Users: \d+/)).toBeInTheDocument(); // Number of available users
      expect(screen.getByText(`Services: ${mockServicesData.length}`)).toBeInTheDocument();
      expect(screen.getByText(`Locations: ${mockLocationsData.length}`)).toBeInTheDocument();
    });
  });

  it('opens StaffForm with initialData for "Edit"', async () => {
    render(<StaffManager />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());
    
    const editButtons = await screen.findAllByRole('button', { name: /edit profile & schedule/i });
    await userEvent.click(editButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId('staff-form-mock')).toBeInTheDocument();
      expect(screen.getByText(`Editing: ${mockStaffProfilesData[0].user.firstName}`)).toBeInTheDocument();
    });
  });

  it('handles deleting a staff profile with confirmation', async () => {
    (graphqlClient.deleteStaffProfile as jest.Mock).mockResolvedValue({ id: mockStaffProfilesData[0].id });
    render(<StaffManager />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const deleteButtons = await screen.findAllByRole('button', { name: /delete staff/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => expect(screen.getByTestId('alert-dialog-mock')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('alert-dialog-action-button'));

    await waitFor(() => {
      expect(graphqlClient.deleteStaffProfile).toHaveBeenCalledWith({ id: mockStaffProfilesData[0].id });
      expect(toast.success).toHaveBeenCalledWith(`Staff member "John Doe" deleted.`);
      expect(graphqlClient.staffProfiles).toHaveBeenCalledTimes(2); // Initial + re-fetch
    });
  });
});
