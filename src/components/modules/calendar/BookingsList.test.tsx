import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingsList from './BookingsList'; // Adjust path
import { graphqlClient } from '@/lib/graphql-client'; // Adjust path
import { toast } from 'sonner'; // Adjust path
import { BookingStatusEnum } from './BookingsList'; // Assuming BookingStatusEnum is exported from BookingsList or a shared types file

// Mock graphqlClient
jest.mock('@/lib/graphql-client', () => ({
  graphqlClient: {
    bookings: jest.fn(),
    locations: jest.fn(),
    services: jest.fn(),
    staffProfiles: jest.fn(),
    // updateBookingStatus: jest.fn(), // If status update is implemented
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
  usePathname: jest.fn(() => '/cms/calendar/bookings'),
}));

// Mock UI components that might be complex or stateful if not directly part of test
jest.mock('@/components/ui/calendar', () => ({
  Calendar: jest.fn((props) => <input data-testid="calendar-mock" type="date" onChange={(e) => props.onSelect?.(new Date(e.target.value))} selected={props.selected} />),
}));
jest.mock('@/components/ui/popover', () => ({
  Popover: jest.fn(({ children }) => <div>{children}</div>),
  PopoverTrigger: jest.fn(({ children }) => <div>{children}</div>),
  PopoverContent: jest.fn(({ children }) => <div>{children}</div>),
}));


const mockBookings = [
  { id: 'b1', customerName: 'Alice Wonderland', customerEmail: 'alice@example.com', service: { id: 's1', name: 'Consultation' }, location: { id: 'l1', name: 'Main Clinic' }, staffProfile: { id: 'staff1', user: { firstName: 'Dr. Eve' } }, bookingDate: new Date().toISOString(), startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), status: 'CONFIRMED', notes: 'Checkup' },
  { id: 'b2', customerName: 'Bob The Builder', customerEmail: 'bob@example.com', service: { id: 's2', name: 'Therapy' }, location: { id: 'l2', name: 'Downtown' }, staffProfile: { id: 'staff2', user: { firstName: 'Dr. Adam' } }, bookingDate: new Date().toISOString(), startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), status: 'PENDING', notes: '' },
];
const mockLocations = [{ id: 'l1', name: 'Main Clinic' }, { id: 'l2', name: 'Downtown' }];
const mockServices = [{ id: 's1', name: 'Consultation' }, { id: 's2', name: 'Therapy' }];
const mockStaff = [{ id: 'staff1', user: { firstName: 'Dr. Eve' } }, { id: 'staff2', user: { firstName: 'Dr. Adam' } }];

const mockBookingsResponse = (items = mockBookings, totalCount = items.length, page = 1, pageSize = 10) => ({
  bookings: { items, totalCount, page, pageSize },
});

describe('BookingsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (graphqlClient.bookings as jest.Mock).mockResolvedValue(mockBookingsResponse());
    (graphqlClient.locations as jest.Mock).mockResolvedValue({ locations: mockLocations });
    (graphqlClient.services as jest.Mock).mockResolvedValue({ services: mockServices });
    (graphqlClient.staffProfiles as jest.Mock).mockResolvedValue({ staffProfiles: mockStaff });
  });

  it('fetches and displays bookings and filter data on mount', async () => {
    render(<BookingsList />);
    await waitFor(() => expect(graphqlClient.bookings).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(graphqlClient.locations).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(graphqlClient.services).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(graphqlClient.staffProfiles).toHaveBeenCalledTimes(1));

    await waitFor(() => {
      expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
      expect(screen.getByText('Bob The Builder')).toBeInTheDocument();
    });
  });

  it('displays loading state initially for bookings', () => {
    (graphqlClient.bookings as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<BookingsList />);
    // Based on the implementation, it shows skeleton rows.
    // Check for the presence of multiple skeleton cells.
    expect(screen.getAllByRole('cell').length).toBeGreaterThan(0); 
    // A more specific check would be for a particular data-testid on skeleton elements if available.
  });

  it('displays error message if fetching bookings fails', async () => {
    (graphqlClient.bookings as jest.Mock).mockRejectedValue(new Error('Fetch error'));
    render(<BookingsList />);
    await waitFor(() => {
      expect(screen.getByText(/error fetching bookings: fetch error/i)).toBeInTheDocument();
    });
  });
  
  it('displays "No bookings found" when there are no items', async () => {
    (graphqlClient.bookings as jest.Mock).mockResolvedValue(mockBookingsResponse([], 0));
    render(<BookingsList />);
    await waitFor(() => {
      expect(screen.getByText(/no bookings found/i)).toBeInTheDocument();
    });
  });

  it('applies filters and re-fetches bookings', async () => {
    render(<BookingsList />);
    await waitFor(() => expect(graphqlClient.bookings).toHaveBeenCalledTimes(1)); // Initial fetch

    // Simulate changing search query
    const searchInput = screen.getByPlaceholderText(/search by name, email, notes/i);
    await userEvent.type(searchInput, 'Alice');

    // Simulate changing status filter
    // Radix Select interaction is complex. Assuming a simple select for test or that a value can be picked.
    // For this test, we'll directly trigger applyFilters after changing tempFilters state in a real scenario.
    // Here, we find the "Apply Filters" button and click it.
    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await userEvent.click(applyButton);
    
    await waitFor(() => {
      expect(graphqlClient.bookings).toHaveBeenCalledTimes(2); // Re-fetch after applying
      expect((graphqlClient.bookings as jest.Mock).mock.calls[1][0].filter).toEqual(
        expect.objectContaining({ searchQuery: 'Alice' })
      );
    });
  });
  
  it('clears filters and re-fetches bookings', async () => {
    render(<BookingsList />);
    await waitFor(() => expect(graphqlClient.bookings).toHaveBeenCalledTimes(1));

    const searchInput = screen.getByPlaceholderText(/search by name, email, notes/i);
    await userEvent.type(searchInput, 'Alice'); // Set a filter

    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    await userEvent.click(clearButton);

    await waitFor(() => {
      expect(graphqlClient.bookings).toHaveBeenCalledTimes(2); // Re-fetch
      expect((graphqlClient.bookings as jest.Mock).mock.calls[1][0].filter).toEqual({});
      expect(searchInput).toHaveValue(''); // Check if input is cleared
    });
  });

  it('handles pagination: goes to next page', async () => {
    (graphqlClient.bookings as jest.Mock).mockResolvedValue(mockBookingsResponse(mockBookings, 20, 1, 10)); // Total 20 items, 2 pages
    render(<BookingsList />);
    await waitFor(() => expect(screen.getByText('Alice Wonderland')).toBeInTheDocument());

    const nextPageButton = screen.getByRole('button', { name: /go to next page/i });
    expect(nextPageButton).not.toBeDisabled();
    await userEvent.click(nextPageButton);

    await waitFor(() => {
      expect(graphqlClient.bookings).toHaveBeenCalledTimes(2);
      expect((graphqlClient.bookings as jest.Mock).mock.calls[1][0].pagination).toEqual(
        expect.objectContaining({ page: 2, pageSize: 10 })
      );
    });
  });
  
  it('handles pagination: disables previous on first page, next on last page', async () => {
    (graphqlClient.bookings as jest.Mock).mockResolvedValue(mockBookingsResponse(mockBookings, 7, 1, 10)); // 7 items, 1 page
    render(<BookingsList />);
    await waitFor(() => expect(screen.getByText('Alice Wonderland')).toBeInTheDocument());

    expect(screen.getByRole('button', { name: /go to previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /go to next page/i })).toBeDisabled();
  });

  it('applies multiple filters and shows "no bookings found" if API returns empty for that combo', async () => {
    render(<BookingsList />);
    await waitFor(() => expect(graphqlClient.bookings).toHaveBeenCalledTimes(1)); // Initial fetch

    // Simulate setting multiple filters
    // Date From (using the mocked calendar input)
    const datePickerFrom = screen.getAllByTestId('calendar-mock')[0]; // Assuming first is "Date from"
    fireEvent.change(datePickerFrom, { target: { value: '2024-07-01' } });
    
    // Status (assuming Select component structure allows finding by role and then an option)
    // This is a simplified way to interact with Radix Select. Actual interaction might need more specific queries.
    // For this test, we'll focus on the re-fetch with combined filter state.
    // We will assume `handleFilterChange` is called correctly by the Select component.
    // To directly test the effect of the filter, we can manipulate `tempFilters` and click "Apply".
    // This is what the component's `handleFilterChange` does internally before `applyFilters` is called.
    // Let's find the "Apply Filters" button after setting up the component's internal tempFilters.
    // This is a bit of an integration test of the filter state management.
    
    // To properly test Radix select, you typically need to:
    // 1. Click the SelectTrigger.
    // 2. Wait for SelectContent/SelectItem to appear.
    // 3. Click the SelectItem.
    // Since the Select is complex to interact with directly without seeing its DOM structure,
    // we will assume `handleFilterChange` has been called for status, e.g., by setting it in the component if possible,
    // or by testing the effect of `applyFilters` after such changes.

    // For this test, let's simulate that tempFilters state has been updated by user actions.
    // Then we click "Apply Filters".
    // A more robust test would involve userEvent.click on each actual filter control.
    // We'll set a search query as one of the filters that's easy to interact with.
    const searchInput = screen.getByPlaceholderText(/search by name, email, notes/i);
    await userEvent.type(searchInput, 'Unique NonExistent Query');

    // Mock the response for this combined filter
    (graphqlClient.bookings as jest.Mock).mockResolvedValue(mockBookingsResponse([], 0));

    const applyButton = screen.getByRole('button', { name: /apply filters/i });
    await userEvent.click(applyButton);
    
    await waitFor(() => {
      expect(graphqlClient.bookings).toHaveBeenCalledTimes(2);
      expect((graphqlClient.bookings as jest.Mock).mock.calls[1][0].filter).toEqual(
        expect.objectContaining({
          // dateFrom: '2024-07-01', // The mock calendar sets this via onSelect
          searchQuery: 'Unique NonExistent Query',
          // status: 'CONFIRMED' // If we could easily select status
        })
      );
      // The component should ideally differentiate between an initial empty state and a "no results for filter" state.
      // If it uses the same "No bookings found" message, this check is fine.
      // If it has a more specific message, that should be checked.
      expect(screen.getByText(/no bookings found/i)).toBeInTheDocument(); 
    });
  });

  it('handles error when fetching filter dropdown data (e.g., locations)', async () => {
    (graphqlClient.locations as jest.Mock).mockRejectedValueOnce(new Error('Failed to load locations'));
    render(<BookingsList />);
    
    await waitFor(() => {
      // Check for an error message or a degraded state for the location filter
      // For example, the select might be disabled or show an error.
      // The component might show a general toast error for filter data loading.
      // For this test, we'll assume a toast error might appear or console error.
      // If specific UI changes for a failed filter dropdown, test that.
      // The current BookingsList doesn't have explicit UI for individual filter load errors.
      // It would log to console. We can check that.
      // Or, if a general error impacts the page:
      // expect(screen.getByText(/error loading filter data/i)).toBeInTheDocument();
      // For now, we just ensure the component still renders and other parts might work.
      expect(screen.getByText('Filter Bookings')).toBeInTheDocument(); // Check that the filter card header is still there
      expect(graphqlClient.bookings).toHaveBeenCalled(); // Bookings might still be fetched
    });
    // To check console.error, you might spy on it:
    // const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // ...
    // expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error fetching filter data:'), expect.any(Error));
    // consoleErrorSpy.mockRestore();
  });

});
