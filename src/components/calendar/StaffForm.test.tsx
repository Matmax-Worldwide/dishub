import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StaffForm from './StaffForm'; // Adjust path
import { DayOfWeek, ScheduleType, StaffScheduleInput } from '@/types/calendar'; // Adjust path

// Mock child component WeeklyScheduleEditor
jest.mock('./WeeklyScheduleEditor', () => {
  return {
    __esModule: true,
    default: jest.fn(({ initialSchedule, onChange }) => (
      <div data-testid="weekly-schedule-editor-mock">
        <span>Weekly Schedule Editor</span>
        <button onClick={() => onChange([ // Simulate a schedule change
          { dayOfWeek: DayOfWeek.MONDAY, startTime: '08:00', endTime: '16:00', isAvailable: true, scheduleType: ScheduleType.REGULAR_HOURS }
        ])}>
          Update Mock Schedule
        </button>
        {/* Display something based on initialSchedule if needed for assertions */}
        {initialSchedule && initialSchedule.length > 0 && 
            <span data-testid="mock-schedule-display">
                {initialSchedule[0].dayOfWeek}: {initialSchedule[0].startTime}-{initialSchedule[0].endTime}
            </span>
        }
      </div>
    )),
  };
});

const mockAllUsers = [
  { id: 'user1', firstName: 'John', lastName: 'Doe (Staff)', email: 'john.staff@example.com' }, // Already staff
  { id: 'user2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
  { id: 'user3', firstName: 'Peter', lastName: 'Jones', email: 'peter@example.com' },
];
const mockAllServices = [{ id: 'svc1', name: 'Haircut' }, { id: 'svc2', name: 'Coloring' }];
const mockAllLocations = [{ id: 'loc1', name: 'Main Salon' }, { id: 'loc2', name: 'Downtown Branch' }];

const mockOnClose = jest.fn();
const mockOnSave = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSave: mockOnSave,
  initialData: null,
  isSaving: false,
  allUsersForSelect: mockAllUsers.filter(u => u.id !== 'user1'), // Users not yet staff
  allServices: mockAllServices,
  allLocations: mockAllLocations,
};

describe('StaffForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when adding new staff', () => {
    render(<StaffForm {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /add new staff profile/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/select user/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toHaveValue('');
    expect(screen.getByText(/assign services/i)).toBeInTheDocument(); // Group label
    mockAllServices.forEach(service => {
      expect(screen.getByLabelText(service.name)).toBeInTheDocument();
      expect(screen.getByLabelText(service.name)).not.toBeChecked();
    });
    expect(screen.getByText(/assign locations/i)).toBeInTheDocument(); // Group label
    mockAllLocations.forEach(location => {
      expect(screen.getByLabelText(location.name)).toBeInTheDocument();
      expect(screen.getByLabelText(location.name)).not.toBeChecked();
    });
    expect(screen.getByTestId('weekly-schedule-editor-mock')).toBeInTheDocument();
  });

  it('renders correctly with initialData for editing', () => {
    const initialSchedule: StaffScheduleInput[] = [
      { dayOfWeek: DayOfWeek.MONDAY, startTime: '10:00', endTime: '18:00', isAvailable: true, scheduleType: ScheduleType.REGULAR_HOURS },
    ];
    const initialData = {
      id: 'staff1',
      userId: 'user1', // This user is not in allUsersForSelect, form should handle this (display name)
      user: mockAllUsers.find(u => u.id === 'user1'),
      bio: 'Experienced stylist.',
      specializations: ['hair cutting', 'advanced coloring'],
      assignedServiceIds: ['svc1'],
      assignedLocationIds: ['loc2'],
      schedules: initialSchedule, // For WeeklyScheduleEditor
    };
    render(<StaffForm {...defaultProps} initialData={initialData} allUsersForSelect={[]} />); // No users to select in edit mode for user field

    expect(screen.getByRole('heading', { name: /edit staff profile/i })).toBeInTheDocument();
    // User field should be disabled or display current staff's name
    expect(screen.getByText(`${initialData.user?.firstName} ${initialData.user?.lastName}`)).toBeInTheDocument();
    expect(screen.queryByLabelText(/select user/i)).toBeNull(); // Select user dropdown should not be there or disabled

    expect(screen.getByLabelText(/bio/i)).toHaveValue(initialData.bio);
    expect(screen.getByLabelText(/specializations \(comma-separated\)/i)).toHaveValue(initialData.specializations.join(', '));
    
    expect(screen.getByLabelText(mockAllServices.find(s => s.id === 'svc1')!.name)).toBeChecked();
    expect(screen.getByLabelText(mockAllServices.find(s => s.id === 'svc2')!.name)).not.toBeChecked();

    expect(screen.getByLabelText(mockAllLocations.find(l => l.id === 'loc1')!.name)).not.toBeChecked();
    expect(screen.getByLabelText(mockAllLocations.find(l => l.id === 'loc2')!.name)).toBeChecked();
    
    expect(screen.getByTestId('weekly-schedule-editor-mock')).toBeInTheDocument();
    expect(screen.getByTestId('mock-schedule-display')).toHaveTextContent("MONDAY: 10:00-18:00");
  });

  it('updates form fields on user input', async () => {
    render(<StaffForm {...defaultProps} />);
    
    // Select User
    await userEvent.click(screen.getByLabelText(/select user/i));
    await userEvent.click(await screen.findByText(mockAllUsers.find(u=>u.id==='user2')!.email)); // Select Jane Smith

    await userEvent.type(screen.getByLabelText(/bio/i), 'New bio here.');
    await userEvent.type(screen.getByLabelText(/specializations \(comma-separated\)/i), 'nails, facials');
    
    // Select services
    await userEvent.click(screen.getByLabelText(mockAllServices[0].name)); // Toggle Haircut
    await userEvent.click(screen.getByLabelText(mockAllServices[1].name)); // Toggle Coloring
    
    // Select locations
    await userEvent.click(screen.getByLabelText(mockAllLocations[0].name)); // Toggle Main Salon

    // Simulate schedule change via mocked editor
    await userEvent.click(screen.getByRole('button', {name: "Update Mock Schedule"}));


    // Assertions reflect state internal to StaffForm (not directly on inputs for everything)
    // Check via onSave call
  });

  it('calls onSave with correct data for new staff', async () => {
    render(<StaffForm {...defaultProps} />);
    
    // User selection
    await userEvent.click(screen.getByLabelText(/select user/i));
    await userEvent.click(await screen.findByText(defaultProps.allUsersForSelect[0].email)); // Select Jane Smith (user2)
    
    const staffProfileData = {
      userId: defaultProps.allUsersForSelect[0].id, // user2
      bio: 'A talented professional.',
      specializations: ['makeup', 'styling'],
      assignedServiceIds: ['svc2'],
      assignedLocationIds: ['loc1', 'loc2'],
    };
    const scheduleData: StaffScheduleInput[] = [
      { dayOfWeek: DayOfWeek.MONDAY, startTime: '08:00', endTime: '16:00', isAvailable: true, scheduleType: ScheduleType.REGULAR_HOURS }
    ];

    await userEvent.type(screen.getByLabelText(/bio/i), staffProfileData.bio);
    await userEvent.type(screen.getByLabelText(/specializations \(comma-separated\)/i), staffProfileData.specializations.join(','));
    
    await userEvent.click(screen.getByLabelText('Coloring')); // svc2
    await userEvent.click(screen.getByLabelText('Main Salon')); // loc1
    await userEvent.click(screen.getByLabelText('Downtown Branch')); // loc2

    // Simulate schedule update from mocked editor
    await userEvent.click(screen.getByRole('button', {name: "Update Mock Schedule"})); // This sets scheduleData

    const saveButton = screen.getByRole('button', { name: /save staff profile/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        staffProfileData,
        scheduleData, 
      });
    });
  });
  
  it('calls onSave with correct data for editing staff', async () => {
    const initialSchedule: StaffScheduleInput[] = [
      { dayOfWeek: DayOfWeek.TUESDAY, startTime: '11:00', endTime: '19:00', isAvailable: true, scheduleType: ScheduleType.REGULAR_HOURS },
    ];
    const initialData = {
      id: 'staff1',
      userId: 'user1',
      user: mockAllUsers.find(u => u.id === 'user1'),
      bio: 'Old bio',
      specializations: ['old spec'],
      assignedServiceIds: ['svc1'],
      assignedLocationIds: ['loc1'],
      schedules: initialSchedule,
    };
    render(<StaffForm {...defaultProps} initialData={initialData} allUsersForSelect={[]} />);

    const updatedBio = "Updated bio for staff1";
    await userEvent.clear(screen.getByLabelText(/bio/i));
    await userEvent.type(screen.getByLabelText(/bio/i), updatedBio);
    // Simulate schedule update
    await userEvent.click(screen.getByRole('button', {name: "Update Mock Schedule"})); 
    
    const saveButton = screen.getByRole('button', { name: /save staff profile/i });
    await userEvent.click(saveButton);

    const expectedScheduleAfterUpdate : StaffScheduleInput[] = [
         { dayOfWeek: DayOfWeek.MONDAY, startTime: '08:00', endTime: '16:00', isAvailable: true, scheduleType: ScheduleType.REGULAR_HOURS }
    ];

    await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
            staffProfileData: {
                id: initialData.id,
                userId: initialData.userId, // userId should not change on edit
                bio: updatedBio,
                specializations: initialData.specializations, // Not changed in this test
                assignedServiceIds: initialData.assignedServiceIds, // Not changed
                assignedLocationIds: initialData.assignedLocationIds, // Not changed
            },
            scheduleData: expectedScheduleAfterUpdate,
        });
    });
  });


  it('calls onClose when cancel button is clicked', async () => {
    render(<StaffForm {...defaultProps} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('disables save button when isSaving is true', () => {
    render(<StaffForm {...defaultProps} isSaving={true} />);
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});
