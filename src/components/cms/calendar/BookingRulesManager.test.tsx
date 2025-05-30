import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingRulesManager from './BookingRulesManager'; // Adjust path
import { graphqlClient } from '@/lib/graphql-client'; // Adjust path
import { toast } from 'sonner'; // Adjust path

// Mock graphqlClient
jest.mock('@/lib/graphql-client', () => ({
  graphqlClient: {
    globalBookingRule: jest.fn(),
    upsertGlobalBookingRule: jest.fn(),
  },
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock next/navigation (if used, though less likely in a manager like this)
jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ locale: 'en' })),
}));

const mockGlobalBookingRuleData = {
  id: 'globalRule1',
  minBookingLeadTimeHours: 24,
  maxBookingLeadTimeDays: 60,
  cancellationPolicyHours: 48,
  slotDurationMinutes: 30,
  simultaneousBookingsPerSlot: 1,
  requireApproval: false,
};

describe('BookingRulesManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (graphqlClient.globalBookingRule as jest.Mock).mockResolvedValue(mockGlobalBookingRuleData);
    (graphqlClient.upsertGlobalBookingRule as jest.Mock).mockImplementation(async ({ input }) => {
      // Simulate upsert behavior: return input merged with some existing data
      return { ...mockGlobalBookingRuleData, ...input, id: mockGlobalBookingRuleData.id || 'newGlobalRuleId' };
    });
  });

  it('fetches and displays global booking rules on mount', async () => {
    render(<BookingRulesManager />);
    expect(graphqlClient.globalBookingRule).toHaveBeenCalledTimes(1);
    
    await waitFor(() => {
      // Check for a few key fields to ensure data is displayed
      expect(screen.getByLabelText(/Minimum Booking Lead Time \(Hours\)/i)).toHaveValue(mockGlobalBookingRuleData.minBookingLeadTimeHours);
      expect(screen.getByLabelText(/Maximum Booking Lead Time \(Days\)/i)).toHaveValue(mockGlobalBookingRuleData.maxBookingLeadTimeDays);
      expect(screen.getByLabelText(/Cancellation Policy \(Hours Before\)/i)).toHaveValue(mockGlobalBookingRuleData.cancellationPolicyHours);
      // Add more checks as needed for other fields
    });
  });

  it('displays a loading state initially', () => {
    (graphqlClient.globalBookingRule as jest.Mock).mockImplementation(() => new Promise(() => {})); // Keep it pending
    render(<BookingRulesManager />);
    // Check for a generic loading indicator, or a disabled form, or specific text
    expect(screen.getByText(/loading global booking rules/i)).toBeInTheDocument(); 
  });

  it('displays an error message if fetching rules fails', async () => {
    (graphqlClient.globalBookingRule as jest.Mock).mockRejectedValue(new Error('Failed to fetch rules'));
    render(<BookingRulesManager />);
    await waitFor(() => {
      expect(screen.getByText(/error loading global booking rules/i)).toBeInTheDocument();
    });
  });

  it('updates form fields on user input', async () => {
    render(<BookingRulesManager />);
    await waitFor(() => expect(graphqlClient.globalBookingRule).toHaveBeenCalled()); // Wait for initial load

    const leadTimeInput = screen.getByLabelText(/Minimum Booking Lead Time \(Hours\)/i);
    await userEvent.clear(leadTimeInput);
    await userEvent.type(leadTimeInput, '48');
    expect(leadTimeInput).toHaveValue(48);

    const slotDurationInput = screen.getByLabelText(/Slot Duration \(Minutes\)/i);
    await userEvent.clear(slotDurationInput);
    await userEvent.type(slotDurationInput, '45');
    expect(slotDurationInput).toHaveValue(45);
    
    const requireApprovalSwitch = screen.getByLabelText(/Require Booking Approval/i);
    // Initial value is false from mock. Click to toggle.
    await userEvent.click(requireApprovalSwitch);
    expect(requireApprovalSwitch).toBeChecked(); 
  });

  it('calls upsertGlobalBookingRule mutation on save with changed data', async () => {
    render(<BookingRulesManager />);
    await waitFor(() => expect(graphqlClient.globalBookingRule).toHaveBeenCalled());

    // Change a value
    const newLeadTime = 48;
    const leadTimeInput = screen.getByLabelText(/Minimum Booking Lead Time \(Hours\)/i);
    await userEvent.clear(leadTimeInput);
    await userEvent.type(leadTimeInput, newLeadTime.toString());

    // Change another value (boolean switch)
    const requireApprovalSwitch = screen.getByLabelText(/Require Booking Approval/i); // Currently false
    await userEvent.click(requireApprovalSwitch); // Toggle to true

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(graphqlClient.upsertGlobalBookingRule).toHaveBeenCalledWith({
        input: {
          // Only changed fields should ideally be sent, or all fields if form sends all.
          // Assuming the form sends all fields it manages.
          minBookingLeadTimeHours: newLeadTime,
          maxBookingLeadTimeDays: mockGlobalBookingRuleData.maxBookingLeadTimeDays, // Unchanged
          cancellationPolicyHours: mockGlobalBookingRuleData.cancellationPolicyHours, // Unchanged
          slotDurationMinutes: mockGlobalBookingRuleData.slotDurationMinutes, // Unchanged
          simultaneousBookingsPerSlot: mockGlobalBookingRuleData.simultaneousBookingsPerSlot, // Unchanged
          requireApproval: true, // Changed from false to true
        },
      });
      expect(toast.success).toHaveBeenCalledWith('Global booking rules updated successfully!');
    });
  });
  
  it('handles API error on save', async () => {
    (graphqlClient.upsertGlobalBookingRule as jest.Mock).mockRejectedValueOnce(new Error('Upsert failed'));
    render(<BookingRulesManager />);
    await waitFor(() => expect(graphqlClient.globalBookingRule).toHaveBeenCalled());

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(graphqlClient.upsertGlobalBookingRule).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Failed to update rules: Upsert failed');
    });
  });

  it('disables save button when isSaving is true', async () => {
    // Simulate isSaving state if component manages it internally based on promise state
    (graphqlClient.upsertGlobalBookingRule as jest.Mock).mockImplementation(() => {
        // Simulate the component setting isSaving to true
        // This is hard to test directly without control over the component's internal state.
        // A better way would be to pass isSaving as a prop if it were a sub-component.
        // For now, assume the button text changes or it gets disabled.
        return new Promise(resolve => setTimeout(() => resolve({ ...mockGlobalBookingRuleData }), 100)); 
    });

    render(<BookingRulesManager />);
    await waitFor(() => expect(graphqlClient.globalBookingRule).toHaveBeenCalled());
    
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await userEvent.click(saveButton);

    // Check for "Saving..." text or disabled state
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });
    // Wait for the save to complete to avoid issues with unmounting during promise
    await waitFor(() => expect(toast.success).toHaveBeenCalled(), {timeout: 200});
  });

});
