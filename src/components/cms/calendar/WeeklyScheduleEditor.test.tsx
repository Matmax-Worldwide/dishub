import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeeklyScheduleEditor from './WeeklyScheduleEditor';
import { DayOfWeek, ScheduleType, StaffScheduleInput } from '@/types/calendar'; // Adjust path

const mockOnChange = jest.fn();

const initialSchedule: StaffScheduleInput[] = [
  { dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '17:00', isAvailable: true, scheduleType: ScheduleType.REGULAR_HOURS },
  { dayOfWeek: DayOfWeek.TUESDAY, startTime: '10:00', endTime: '16:00', isAvailable: false, scheduleType: ScheduleType.REGULAR_HOURS },
  // Wednesday is missing, should default to unavailable or some default hours
];

const defaultProps = {
  initialSchedule: [], // Start with empty, then test with populated
  onChange: mockOnChange,
};

describe('WeeklyScheduleEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders 7 days, defaulting to closed if no initial schedule provided for a day', () => {
    render(<WeeklyScheduleEditor {...defaultProps} />);
    Object.values(DayOfWeek).forEach(day => {
      expect(screen.getByText(day.charAt(0) + day.slice(1).toLowerCase())).toBeInTheDocument();
    });
    // Check for a switch for each day
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(7);
    // Default to unavailable (unchecked)
    switches.forEach(s => expect(s).not.toBeChecked());
  });

  it('renders with initial schedule data, correctly setting times and availability', () => {
    render(<WeeklyScheduleEditor {...defaultProps} initialSchedule={initialSchedule} />);
    
    // Monday - Available
    const mondaySwitch = screen.getByRole('switch', { name: /monday/i });
    expect(mondaySwitch).toBeChecked();
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument(); // For Monday startTime
    expect(screen.getByDisplayValue('17:00')).toBeInTheDocument(); // For Monday endTime

    // Tuesday - Unavailable
    const tuesdaySwitch = screen.getByRole('switch', { name: /tuesday/i });
    expect(tuesdaySwitch).not.toBeChecked();
    // Time inputs for Tuesday might be hidden or disabled, or show the times but switch is off.
    // Based on component's likely behavior, they'd still exist.
    expect(screen.getByDisplayValue('10:00')).toBeInTheDocument(); // For Tuesday startTime
    expect(screen.getByDisplayValue('16:00')).toBeInTheDocument(); // For Tuesday endTime

    // Wednesday - Should default to closed as it's not in initialSchedule
    const wednesdaySwitch = screen.getByRole('switch', { name: /wednesday/i });
    expect(wednesdaySwitch).not.toBeChecked();
  });

  it('calls onChange when availability switch is toggled', async () => {
    render(<WeeklyScheduleEditor {...defaultProps} initialSchedule={initialSchedule} />);
    const mondaySwitch = screen.getByRole('switch', { name: /monday/i }); // Initially true (available)
    
    await userEvent.click(mondaySwitch); // Toggle to unavailable

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updatedSchedule = mockOnChange.mock.calls[0][0] as StaffScheduleInput[];
    const mondaySchedule = updatedSchedule.find(s => s.dayOfWeek === DayOfWeek.MONDAY);
    expect(mondaySchedule?.isAvailable).toBe(false);
    expect(mondaySchedule?.startTime).toBe('09:00'); // Times should remain
  });

  it('calls onChange when startTime is changed for an available day', async () => {
    render(<WeeklyScheduleEditor {...defaultProps} initialSchedule={initialSchedule} />);
    // Monday is initially 09:00 - 17:00, available
    const mondayStartTimeInput = screen.getAllByRole('textbox').find(input => (input as HTMLInputElement).value === '09:00');
    expect(mondayStartTimeInput).toBeInTheDocument();

    if (mondayStartTimeInput) {
      fireEvent.change(mondayStartTimeInput, { target: { value: '08:30' } });
      // For inputs with type="time", blur might be needed or userEvent.type
      // fireEvent.blur(mondayStartTimeInput); // Or userEvent.tab()
    }
    
    // The component uses a debounce for time changes. We need to wait.
    await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
    }, { timeout: 600 }); // Wait for debounce (default 500ms) + buffer

    const updatedSchedule = mockOnChange.mock.calls[0][0] as StaffScheduleInput[];
    const mondaySchedule = updatedSchedule.find(s => s.dayOfWeek === DayOfWeek.MONDAY);
    expect(mondaySchedule?.startTime).toBe('08:30');
    expect(mondaySchedule?.isAvailable).toBe(true);
  });

  it('calls onChange when endTime is changed for an available day', async () => {
    render(<WeeklyScheduleEditor {...defaultProps} initialSchedule={initialSchedule} />);
    const mondayEndTimeInput = screen.getAllByRole('textbox').find(input => (input as HTMLInputElement).value === '17:00');
    expect(mondayEndTimeInput).toBeInTheDocument();

    if (mondayEndTimeInput) {
      fireEvent.change(mondayEndTimeInput, { target: { value: '17:45' } });
    }

    await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
    }, { timeout: 600 });

    const updatedSchedule = mockOnChange.mock.calls[0][0] as StaffScheduleInput[];
    const mondaySchedule = updatedSchedule.find(s => s.dayOfWeek === DayOfWeek.MONDAY);
    expect(mondaySchedule?.endTime).toBe('17:45');
  });
  
  it('maintains default times when toggling a day from closed to open', async () => {
    render(<WeeklyScheduleEditor {...defaultProps} initialSchedule={[]} />); // Start with all closed
    const wednesdaySwitch = screen.getByRole('switch', { name: /wednesday/i });
    expect(wednesdaySwitch).not.toBeChecked();

    await userEvent.click(wednesdaySwitch); // Open Wednesday

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    const updatedSchedule = mockOnChange.mock.calls[0][0] as StaffScheduleInput[];
    const wednesdaySchedule = updatedSchedule.find(s => s.dayOfWeek === DayOfWeek.WEDNESDAY);
    expect(wednesdaySchedule?.isAvailable).toBe(true);
    expect(wednesdaySchedule?.startTime).toBe('09:00'); // Default open time
    expect(wednesdaySchedule?.endTime).toBe('17:00');   // Default close time
  });

});
