import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarSection from './CalendarSection'; // Adjust path
import { graphqlClient } from '@/lib/graphql-client'; // Adjust path
import { toast } from 'sonner'; // Adjust path

// --- Mocks ---
jest.mock('@/lib/graphql-client', () => ({
  graphqlClient: {
    locations: jest.fn(),
    serviceCategories: jest.fn(),
    services: jest.fn(),
    staffForService: jest.fn(), // Assuming this is the query name
    availableSlots: jest.fn(),
    createBooking: jest.fn(),
    globalBookingRule: jest.fn(), // If the component fetches global rules
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ locale: 'en' })), // Default locale
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock react-day-picker
// Using a simple input type="date" to allow easy simulation of date selection
jest.mock('react-day-picker', () => {
  const OriginalDayPicker = jest.requireActual('react-day-picker');
  return {
    ...OriginalDayPicker, // Spread original exports
    DayPicker: jest.fn((props) => (
      <input
        data-testid="day-picker-mock"
        type="date"
        onChange={(e) => {
            if (e.target.value) { // Ensure a value is selected
                 // DayPicker's onSelect usually gives Date or undefined.
                 // Input date value is YYYY-MM-DD. new Date() parses this as UTC.
                 // To simulate local timezone selection like DayPicker might do, adjust if needed.
                props.onSelect?.(new Date(e.target.value + 'T00:00:00')); // Ensure it's treated as local date
            }
        }}
        value={props.selected ? new Date(props.selected.getTime() - props.selected.getTimezoneOffset() * 60000).toISOString().split('T')[0] : ""}
        disabled={props.disabled}
        fromDate={props.fromDate}
      />
    )),
  };
});


// --- Mock Data ---
const mockLocationsData = [
  { id: 'loc1', name: 'Main Clinic', operatingHours: { MONDAY: [{open:'09:00', close:'17:00'}] } },
  { id: 'loc2', name: 'Downtown Branch', operatingHours: { MONDAY: [{open:'10:00', close:'18:00'}] } },
];
const mockCategoriesData = [
  { id: 'cat1', name: 'General Checkup', services: [{ id: 'svc1', name: 'Regular Checkup', durationMinutes: 30, price: 50 }] },
  { id: 'cat2', name: 'Specialty', services: [{ id: 'svc2', name: 'Advanced Scan', durationMinutes: 60, price: 200 }] },
];
const mockServicesForCat1 = mockCategoriesData[0].services;
const mockStaffData = [
  { id: 'staff1', user: { firstName: 'Dr. Eve', lastName: 'Smith' } },
  { id: 'staff2', user: { firstName: 'Dr. Adam', lastName: 'West' } },
];
const mockSlotsData = (date: Date) => [ // Ensure slots are for the selected date
  { startTime: new Date(date.setHours(10,0,0,0)).toISOString(), endTime: new Date(date.setHours(10,30,0,0)).toISOString(), isAvailable: true },
  { startTime: new Date(date.setHours(11,0,0,0)).toISOString(), endTime: new Date(date.setHours(11,30,0,0)).toISOString(), isAvailable: true },
];
const mockBookingRules = { minBookingLeadTimeHours: 1, maxBookingLeadTimeDays: 30 };


// --- Helper Functions ---
const renderCalendarSection = (props = {}) => {
  const defaultProps = {
    showLocationSelector: true,
    showServiceCategories: true,
    showStaffSelector: true,
    // defaultLocationId: null,
    // defaultServiceId: null,
    // defaultStaffId: null,
    title: "Book an Appointment",
    locale: "en"
  };
  return render(<CalendarSection {...defaultProps} {...props} />);
};


describe('CalendarSection Booking Widget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks for successful calls
    (graphqlClient.locations as jest.Mock).mockResolvedValue({ locations: mockLocationsData });
    (graphqlClient.serviceCategories as jest.Mock).mockResolvedValue({ serviceCategories: mockCategoriesData });
    (graphqlClient.services as jest.Mock).mockResolvedValue({ services: mockServicesForCat1 }); // Default to services from cat1
    (graphqlClient.staffForService as jest.Mock).mockResolvedValue({ staffForService: mockStaffData });
    (graphqlClient.availableSlots as jest.Mock).mockImplementation(({date}) => Promise.resolve({ availableSlots: mockSlotsData(new Date(date)) }));
    (graphqlClient.createBooking as jest.Mock).mockResolvedValue({ createBooking: { id: 'booking123', status: 'CONFIRMED' } });
    (graphqlClient.globalBookingRule as jest.Mock).mockResolvedValue(mockBookingRules);
  });

  // --- Initial Rendering & Props ---
  it('renders the initial step (location selection) by default', async () => {
    renderCalendarSection();
    await waitFor(() => {
      expect(screen.getByText('Select Location')).toBeInTheDocument();
      expect(screen.getByText(mockLocationsData[0].name)).toBeInTheDocument();
    });
  });

  it('starts at service selection if showLocationSelector is false and defaultLocationId is provided', async () => {
    renderCalendarSection({ showLocationSelector: false, defaultLocationId: 'loc1' });
    await waitFor(() => {
      // Should fetch categories/services for defaultLocationId
      expect(graphqlClient.serviceCategories).toHaveBeenCalledWith({ locationId: 'loc1' }); // or services directly
      expect(screen.getByText('Select Service')).toBeInTheDocument(); // Or category text
    });
  });
  
  it('fetches booking rules on mount', async () => {
    renderCalendarSection();
    await waitFor(() => {
        expect(graphqlClient.globalBookingRule).toHaveBeenCalled();
    });
  });

  it('handles error when fetching locations if showLocationSelector is true', async () => {
    (graphqlClient.locations as jest.Mock).mockRejectedValueOnce(new Error('Network Error: Locations unreachable'));
    renderCalendarSection({ showLocationSelector: true }); // Explicitly set, though default
    
    await waitFor(() => {
      // Check for a user-facing error message related to loading locations
      expect(screen.getByText(/error loading locations/i)).toBeInTheDocument(); 
      // Ensure it doesn't proceed to other steps
      expect(screen.queryByText('Select Service Category')).not.toBeInTheDocument();
      expect(screen.queryByText('Select Service')).not.toBeInTheDocument();
    });
  });


  // --- Location Selection Step ---
  it('allows selecting a location and advances to service/category step', async () => {
    renderCalendarSection();
    await waitFor(() => expect(screen.getByText(mockLocationsData[0].name)).toBeInTheDocument());
    
    await userEvent.click(screen.getByText(mockLocationsData[0].name));
    
    await waitFor(() => {
      expect(screen.getByText('Select Service Category')).toBeInTheDocument(); // Or "Select Service" if categories hidden
      expect(graphqlClient.serviceCategories).toHaveBeenCalledWith({ locationId: mockLocationsData[0].id });
    });
  });

  // --- Service Category & Service Selection Step ---
  it('allows selecting a category then a service, and advances step', async () => {
    renderCalendarSection({ showLocationSelector: false, defaultLocationId: 'loc1' }); // Start at service selection
    
    // Wait for categories to load for defaultLocationId 'loc1'
    await waitFor(() => expect(graphqlClient.serviceCategories).toHaveBeenCalledWith({ locationId: 'loc1' }));
    await waitFor(() => expect(screen.getByText(mockCategoriesData[0].name)).toBeInTheDocument());

    // Select category
    await userEvent.click(screen.getByText(mockCategoriesData[0].name));
    await waitFor(() => {
        // Assuming services for the selected category are now displayed
        expect(screen.getByText(mockServicesForCat1[0].name)).toBeInTheDocument();
    });

    // Select service
    await userEvent.click(screen.getByText(mockServicesForCat1[0].name));
    await waitFor(() => {
      // Advances to staff selection or date/time if staff selection is off
      expect(screen.getByText(/select staff/i)).toBeInTheDocument(); 
      expect(graphqlClient.staffForService).toHaveBeenCalledWith({ serviceId: mockServicesForCat1[0].id, locationId: 'loc1' });
    });
  });

  it('handles error when fetching service categories', async () => {
    (graphqlClient.serviceCategories as jest.Mock).mockRejectedValueOnce(new Error('Categories unavailable'));
    renderCalendarSection({ showLocationSelector: false, defaultLocationId: 'loc1', showServiceCategories: true });

    await waitFor(() => {
      expect(graphqlClient.serviceCategories).toHaveBeenCalledWith({ locationId: 'loc1' });
      expect(screen.getByText(/error loading service categories/i)).toBeInTheDocument();
      expect(screen.queryByText('Select Staff')).not.toBeInTheDocument(); // Should not proceed
    });
  });
  
  it('handles a location with no service categories if showServiceCategories is true', async () => {
    (graphqlClient.serviceCategories as jest.Mock).mockResolvedValueOnce({ serviceCategories: [] });
    renderCalendarSection({ showLocationSelector: false, defaultLocationId: 'loc1', showServiceCategories: true });

    await waitFor(() => {
      expect(graphqlClient.serviceCategories).toHaveBeenCalledWith({ locationId: 'loc1' });
      expect(screen.getByText(/no service categories available for this location/i)).toBeInTheDocument();
      expect(screen.queryByText('Select Staff')).not.toBeInTheDocument();
    });
  });
  
  it('handles a location with no services if showServiceCategories is false', async () => {
    (graphqlClient.services as jest.Mock).mockResolvedValueOnce({ services: [] });
    renderCalendarSection({ showLocationSelector: false, defaultLocationId: 'loc1', showServiceCategories: false });

    await waitFor(() => {
      expect(graphqlClient.services).toHaveBeenCalledWith({ locationId: 'loc1', categoryId: null });
      expect(screen.getByText(/no services available for this location/i)).toBeInTheDocument();
      expect(screen.queryByText('Select Staff')).not.toBeInTheDocument();
    });
  });
  
  it('skips category selection if showServiceCategories is false', async () => {
    (graphqlClient.services as jest.Mock).mockResolvedValue({ services: [...mockServicesForCat1, ...mockCategoriesData[1].services] });
    renderCalendarSection({ showLocationSelector: false, defaultLocationId: 'loc1', showServiceCategories: false });
    
    await waitFor(() => expect(graphqlClient.services).toHaveBeenCalledWith({ locationId: 'loc1', categoryId: null }));
    await waitFor(() => expect(screen.getByText('Select Service')).toBeInTheDocument()); // Directly to services
    expect(screen.getByText(mockServicesForCat1[0].name)).toBeInTheDocument(); // Service from cat1
    expect(screen.getByText(mockCategoriesData[1].services[0].name)).toBeInTheDocument(); // Service from cat2
    
    // Select service
    await userEvent.click(screen.getByText(mockServicesForCat1[0].name));
    await waitFor(() => {
      expect(screen.getByText(/select staff/i)).toBeInTheDocument();
    });
  });
  
  // --- Staff Selection Step ---
  it('allows selecting "Any Available" staff and advances', async () => {
    // Setup: bypass location and service selection to get to staff step
    renderCalendarSection({ 
        showLocationSelector: false, defaultLocationId: 'loc1', 
        showServiceCategories: false, defaultServiceId: 'svc1' 
    });
    await waitFor(() => expect(graphqlClient.staffForService).toHaveBeenCalledWith({ serviceId: 'svc1', locationId: 'loc1'}));
    await waitFor(() => expect(screen.getByText(/any available/i)).toBeInTheDocument());

    await userEvent.click(screen.getByText(/any available/i));
    await waitFor(() => {
      expect(screen.getByText(/select date & time/i)).toBeInTheDocument();
    });
  });
  
  it('allows selecting a specific staff member and advances', async () => {
    renderCalendarSection({ 
        showLocationSelector: false, defaultLocationId: 'loc1', 
        showServiceCategories: false, defaultServiceId: 'svc1' 
    });
    await waitFor(() => expect(graphqlClient.staffForService).toHaveBeenCalled());
    const staffName = `${mockStaffData[0].user.firstName} ${mockStaffData[0].user.lastName}`;
    await waitFor(() => expect(screen.getByText(staffName)).toBeInTheDocument());

    await userEvent.click(screen.getByText(staffName));
    await waitFor(() => {
      expect(screen.getByText(/select date & time/i)).toBeInTheDocument();
    });
  });

  it('skips staff selection if showStaffSelector is false', async () => {
     renderCalendarSection({ 
        showLocationSelector: false, defaultLocationId: 'loc1', 
        showServiceCategories: false, defaultServiceId: 'svc1',
        showStaffSelector: false
    });
    // Should go directly to Date/Time selection
    await waitFor(() => {
        expect(screen.getByText(/select date & time/i)).toBeInTheDocument();
        expect(graphqlClient.staffForService).not.toHaveBeenCalled();
    });
  });

  // --- Date & Time Slot Selection Step ---
  describe('Date & Time Slot Selection', () => {
    const setupToDateTimeStep = async (props = {}) => {
      renderCalendarSection({ 
        showLocationSelector: false, defaultLocationId: 'loc1', 
        showServiceCategories: false, defaultServiceId: 'svc1',
        showStaffSelector: false, // Simplest path to date/time
        ...props 
      });
      await waitFor(() => expect(screen.getByText(/select date & time/i)).toBeInTheDocument());
    };

    it('allows selecting a date and fetches available slots', async () => {
      await setupToDateTimeStep();
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const formattedTomorrow = tomorrow.toISOString().split('T')[0];

      const datePickerMock = screen.getByTestId('day-picker-mock');
      await act(async () => {
        fireEvent.change(datePickerMock, { target: { value: formattedTomorrow } });
      });
      
      await waitFor(() => {
        expect(graphqlClient.availableSlots).toHaveBeenCalledWith({
          locationId: 'loc1',
          serviceId: 'svc1',
          staffId: null, // Null because showStaffSelector is false / "Any Available"
          date: formattedTomorrow, 
        });
        expect(screen.getByText('10:00 AM')).toBeInTheDocument(); // Assuming mockSlotsData formats like this
        expect(screen.getByText('11:00 AM')).toBeInTheDocument();
      });
    });

    it('shows loading state for time slots', async () => {
      (graphqlClient.availableSlots as jest.Mock).mockImplementation(() => new Promise(() => {})); // Pending
      await setupToDateTimeStep();
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const formattedTomorrow = tomorrow.toISOString().split('T')[0];
      
      const datePickerMock = screen.getByTestId('day-picker-mock');
      await act(async () => {
        fireEvent.change(datePickerMock, { target: { value: formattedTomorrow } });
      });

      await waitFor(() => {
        expect(screen.getByText(/loading available slots/i)).toBeInTheDocument();
      });
    });

    it('shows "no slots available" message', async () => {
      (graphqlClient.availableSlots as jest.Mock).mockResolvedValue({ availableSlots: [] }); // No slots
      await setupToDateTimeStep();
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const formattedTomorrow = tomorrow.toISOString().split('T')[0];

      const datePickerMock = screen.getByTestId('day-picker-mock');
       await act(async () => {
        fireEvent.change(datePickerMock, { target: { value: formattedTomorrow } });
      });
      
      await waitFor(() => {
        expect(screen.getByText(/no slots available on this date/i)).toBeInTheDocument();
      });
    });

    it('allows selecting a time slot and advances to customer info', async () => {
      await setupToDateTimeStep();
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1); // Select tomorrow
      const formattedTomorrow = tomorrow.toISOString().split('T')[0];
      
      const datePickerMock = screen.getByTestId('day-picker-mock');
      await act(async () => {
        fireEvent.change(datePickerMock, { target: { value: formattedTomorrow } });
      });
      
      await waitFor(() => expect(screen.getByText('10:00 AM')).toBeInTheDocument());
      
      await userEvent.click(screen.getByText('10:00 AM')); // Select the first available slot
      
      await waitFor(() => {
        expect(screen.getByText(/your information/i)).toBeInTheDocument(); // Next step
        // Check if form fields are present
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      });
    });
  });

  // --- Customer Information Form Step & Booking Submission ---
  describe('Customer Information & Booking Submission', () => {
    const setupToCustomerInfoStep = async (props = {}) => {
      renderCalendarSection({ 
        showLocationSelector: false, defaultLocationId: 'loc1', 
        showServiceCategories: false, defaultServiceId: 'svc1',
        showStaffSelector: false, // Easiest path
        ...props 
      });
      // Simulate selections to reach customer info step
      await waitFor(() => expect(screen.getByText(/select date & time/i)).toBeInTheDocument());
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const formattedTomorrow = tomorrow.toISOString().split('T')[0];
      
      const datePickerMock = screen.getByTestId('day-picker-mock');
      await act(async () => {
        fireEvent.change(datePickerMock, { target: { value: formattedTomorrow } });
      });
      await waitFor(() => expect(screen.getByText('10:00 AM')).toBeInTheDocument());
      await userEvent.click(screen.getByText('10:00 AM'));
      await waitFor(() => expect(screen.getByText(/your information/i)).toBeInTheDocument());
    };

    it('allows filling customer information', async () => {
      await setupToCustomerInfoStep();
      
      await userEvent.type(screen.getByLabelText(/full name/i), 'Test Customer');
      await userEvent.type(screen.getByLabelText(/email address/i), 'customer@example.com');
      await userEvent.type(screen.getByLabelText(/phone number/i), '1234567890');
      await userEvent.type(screen.getByLabelText(/notes \(optional\)/i), 'Test note.');

      expect(screen.getByLabelText(/full name/i)).toHaveValue('Test Customer');
      expect(screen.getByLabelText(/email address/i)).toHaveValue('customer@example.com');
      expect(screen.getByLabelText(/phone number/i)).toHaveValue('1234567890');
      expect(screen.getByLabelText(/notes \(optional\)/i)).toHaveValue('Test note.');
    });

    it('submits booking successfully and shows confirmation', async () => {
      await setupToCustomerInfoStep();
      
      const customerData = {
        name: 'Final Customer',
        email: 'final@example.com',
        phone: '0987654321',
        notes: 'Final booking notes.'
      };
      await userEvent.type(screen.getByLabelText(/full name/i), customerData.name);
      await userEvent.type(screen.getByLabelText(/email address/i), customerData.email);
      await userEvent.type(screen.getByLabelText(/phone number/i), customerData.phone);
      await userEvent.type(screen.getByLabelText(/notes \(optional\)/i), customerData.notes);

      const mockCreatedBooking = { 
        id: 'bookingXYZ', 
        status: 'CONFIRMED', 
        customerName: customerData.name,
        // ... other details matching what confirmation screen might show
        service: mockServicesForCat1[0], // Assuming service 'svc1' was auto-selected
        startTime: mockSlotsData(new Date(new Date().setDate(new Date().getDate() + 1)))[0].startTime, // from selected slot
      };
      (graphqlClient.createBooking as jest.Mock).mockResolvedValue({ createBooking: mockCreatedBooking });

      await userEvent.click(screen.getByRole('button', { name: /confirm booking/i }));

      await waitFor(() => {
        expect(graphqlClient.createBooking).toHaveBeenCalledWith(expect.objectContaining({
          input: expect.objectContaining({
            locationId: 'loc1',
            serviceId: 'svc1',
            staffProfileId: null, 
            // date and time from selected slot
            customerName: customerData.name,
            customerEmail: customerData.email,
            customerPhone: customerData.phone,
            notes: customerData.notes,
          })
        }));
        expect(toast.success).toHaveBeenCalledWith('Booking confirmed!');
        expect(screen.getByText(/booking confirmed!/i)).toBeInTheDocument();
        // Check if some booking details are shown
        expect(screen.getByText(customerData.name)).toBeInTheDocument();
        expect(screen.getByText(mockCreatedBooking.service.name)).toBeInTheDocument();
      });
    });

    it('shows error toast if booking submission fails', async () => {
      await setupToCustomerInfoStep();
      
      await userEvent.type(screen.getByLabelText(/full name/i), 'Error Customer');
      await userEvent.type(screen.getByLabelText(/email address/i), 'error@example.com');
      await userEvent.type(screen.getByLabelText(/phone number/i), '1112223333');

      (graphqlClient.createBooking as jest.Mock).mockRejectedValue(new Error('Network Error'));

      await userEvent.click(screen.getByRole('button', { name: /confirm booking/i }));

      await waitFor(() => {
        expect(graphqlClient.createBooking).toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith('Booking failed: Network Error');
        // Stays on the customer info step
        expect(screen.getByText(/your information/i)).toBeInTheDocument();
      });
    });
    
    it('requires name, email, and phone for submission', async () => {
        await setupToCustomerInfoStep();
        
        // Missing name
        await userEvent.type(screen.getByLabelText(/email address/i), 'no-name@example.com');
        await userEvent.type(screen.getByLabelText(/phone number/i), '1234567890');
        await userEvent.click(screen.getByRole('button', { name: /confirm booking/i }));
        await waitFor(() => {
            expect(screen.getByText(/full name is required/i)).toBeInTheDocument(); // Assuming this error message
            expect(graphqlClient.createBooking).not.toHaveBeenCalled();
        });
        await userEvent.clear(screen.getByLabelText(/email address/i)); // Clear for next check
        await userEvent.clear(screen.getByLabelText(/phone number/i));

        // Missing email
        await userEvent.type(screen.getByLabelText(/full name/i), 'No Email');
        await userEvent.type(screen.getByLabelText(/phone number/i), '1234567890');
        await userEvent.click(screen.getByRole('button', { name: /confirm booking/i }));
        await waitFor(() => {
            expect(screen.getByText(/email is required/i)).toBeInTheDocument();
            expect(graphqlClient.createBooking).not.toHaveBeenCalled();
        });
        await userEvent.clear(screen.getByLabelText(/full name/i));
        await userEvent.clear(screen.getByLabelText(/phone number/i));

        // Missing phone
        await userEvent.type(screen.getByLabelText(/full name/i), 'No Phone');
        await userEvent.type(screen.getByLabelText(/email address/i), 'no-phone@example.com');
        await userEvent.click(screen.getByRole('button', { name: /confirm booking/i }));
        await waitFor(() => {
            expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
            expect(graphqlClient.createBooking).not.toHaveBeenCalled();
        });
    });
  });

  // --- Confirmation Step & Reset ---
  describe('Confirmation Step & Reset', () => {
    const setupToConfirmationStep = async () => {
        // Similar to setupToCustomerInfoStep but completes submission
        renderCalendarSection({ 
            showLocationSelector: false, defaultLocationId: 'loc1', 
            showServiceCategories: false, defaultServiceId: 'svc1',
            showStaffSelector: false,
        });
        await waitFor(() => expect(screen.getByText(/select date & time/i)).toBeInTheDocument());
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const formattedTomorrow = tomorrow.toISOString().split('T')[0];
        
        const datePickerMock = screen.getByTestId('day-picker-mock');
        await act(async () => {
            fireEvent.change(datePickerMock, { target: { value: formattedTomorrow } });
        });
        await waitFor(() => expect(screen.getByText('10:00 AM')).toBeInTheDocument());
        await userEvent.click(screen.getByText('10:00 AM'));
        await waitFor(() => expect(screen.getByText(/your information/i)).toBeInTheDocument());

        await userEvent.type(screen.getByLabelText(/full name/i), 'Confirmed Customer');
        await userEvent.type(screen.getByLabelText(/email address/i), 'confirmed@example.com');
        await userEvent.type(screen.getByLabelText(/phone number/i), '5555555555');
        
        (graphqlClient.createBooking as jest.Mock).mockResolvedValue({ 
            createBooking: { 
                id: 'bookingConfirm123', 
                status: 'CONFIRMED', 
                customerName: 'Confirmed Customer',
                service: mockServicesForCat1[0],
                startTime: mockSlotsData(tomorrow)[0].startTime,
            } 
        });
        await userEvent.click(screen.getByRole('button', { name: /confirm booking/i }));
        await waitFor(() => expect(screen.getByText(/booking confirmed!/i)).toBeInTheDocument());
    };

    it('displays confirmation details correctly', async () => {
        await setupToConfirmationStep();
        expect(screen.getByText('Confirmed Customer')).toBeInTheDocument();
        expect(screen.getByText(mockServicesForCat1[0].name)).toBeInTheDocument(); // Service name
        // Add check for formatted time if displayed
    });

    it('"Make Another Booking" button resets the flow', async () => {
        await setupToConfirmationStep();
        
        const resetButton = screen.getByRole('button', { name: /make another booking/i });
        await userEvent.click(resetButton);

        // Should go back to the first step (location selection in default config)
        await waitFor(() => {
            expect(screen.getByText('Select Location')).toBeInTheDocument();
        });
    });
  });
  
  // --- Progress Indicator Tests ---
  describe('Progress Indicator', () => {
    it('updates progress indicator as user moves through steps', async () => {
      renderCalendarSection(); // Starts at location selection (step 1)

      // Helper to check active step in a simplified progress indicator
      // This assumes progress steps might have aria-current or a specific class/text for active state.
      // For this example, let's assume the step title is clearly identifiable and we check its presence or a specific attribute.
      // A more robust test would depend on the actual DOM structure of the ProgressIndicator.
      // We will check for the title of the current step section.

      // Step 1: Location Selection
      await waitFor(() => expect(screen.getByText('Select Location')).toBeInTheDocument());
      // Check progress indicator: "Location" should be active. (Conceptual)
      // e.g., expect(screen.getByTestId('progress-step-location')).toHaveClass('active');

      // Advance to Service Selection
      await userEvent.click(screen.getByText(mockLocationsData[0].name));
      await waitFor(() => expect(screen.getByText('Select Service Category')).toBeInTheDocument()); // Or "Select Service"
      // Check progress indicator: "Service" should be active.

      // Advance to Staff Selection (or Date/Time if staff is skipped)
      await userEvent.click(screen.getByText(mockCategoriesData[0].name)); // Select category
      await waitFor(() => expect(screen.getByText(mockServicesForCat1[0].name)).toBeInTheDocument());
      await userEvent.click(screen.getByText(mockServicesForCat1[0].name)); // Select service
      await waitFor(() => expect(screen.getByText(/select staff/i)).toBeInTheDocument());
      // Check progress indicator: "Staff" should be active.

      // Advance to Date/Time Selection
      await userEvent.click(screen.getByText(/any available/i)); // Select any staff
      await waitFor(() => expect(screen.getByText(/select date & time/i)).toBeInTheDocument());
      // Check progress indicator: "Date & Time" should be active.
      
      // Advance to Customer Info
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const formattedTomorrow = tomorrow.toISOString().split('T')[0];
      const datePickerMock = screen.getByTestId('day-picker-mock');
      await act(async () => {
        fireEvent.change(datePickerMock, { target: { value: formattedTomorrow } });
      });
      await waitFor(() => expect(screen.getByText('10:00 AM')).toBeInTheDocument());
      await userEvent.click(screen.getByText('10:00 AM'));
      await waitFor(() => expect(screen.getByText(/your information/i)).toBeInTheDocument());
      // Check progress indicator: "Details" or "Your Info" should be active.

      // Advance to Confirmation
      await userEvent.type(screen.getByLabelText(/full name/i), 'Progress Customer');
      await userEvent.type(screen.getByLabelText(/email address/i), 'progress@example.com');
      await userEvent.type(screen.getByLabelText(/phone number/i), '7778889999');
      (graphqlClient.createBooking as jest.Mock).mockResolvedValue({ createBooking: { id: 'bookingProgress', status: 'CONFIRMED' } });
      await userEvent.click(screen.getByRole('button', { name: /confirm booking/i }));
      await waitFor(() => expect(screen.getByText(/booking confirmed!/i)).toBeInTheDocument());
      // Check progress indicator: "Confirmation" or "Done" should be active.
      
      // This test is conceptual for checking active step. Actual implementation depends on ProgressIndicator's DOM.
      // For a real test, you'd query for elements within the progress indicator and check their state.
      // E.g., screen.getByRole('listitem', { name: /Location/i, current: 'step' }) for aria-current
    });
  });
});
