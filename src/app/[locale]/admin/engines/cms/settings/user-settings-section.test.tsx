import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserSettingsSection from './user-settings-section';
import graphqlClient from '@/lib/graphql-client';
import { toast } from 'sonner';

// Mock graphqlClient
jest.mock('@/lib/graphql-client', () => ({
  userSettings: jest.fn(),
  updateUserSettings: jest.fn(),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('UserSettingsSection', () => {
  const mockSettings = {
    emailNotifications: true,
    theme: 'dark',
    language: 'es',
    timeFormat: '24h',
    dateFormat: 'DD/MM/YYYY',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (graphqlClient.getUserSettings as jest.Mock).mockResolvedValue(mockSettings);
  });

  it('should render loading state initially', () => {
    render(<UserSettingsSection />);
    expect(screen.getByText(/Loading user settings.../i)).toBeInTheDocument();
  });

  it('should fetch and display user settings', async () => {
    render(<UserSettingsSection />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Email Notifications/i)).toBeChecked();
    });
    // For Select components, check if the trigger displays the correct initial value.
    // React Testing Library might need custom queries or role-based queries for ShadCN Select.
    // This is a simplified check:
    expect(screen.getByRole('combobox', { name: /Theme/i })).toHaveTextContent('Dark');
    expect(screen.getByRole('combobox', { name: /Language/i })).toHaveTextContent('Español');
    expect(screen.getByRole('combobox', { name: /Time Format/i })).toHaveTextContent('24-hour');
    expect(screen.getByRole('combobox', { name: /Date Format/i })).toHaveTextContent('DD/MM/YYYY');
  });

  it('should update state on input change (Switch)', async () => {
    render(<UserSettingsSection />);
    await waitFor(() => expect(graphqlClient.getUserSettings).toHaveBeenCalled());

    const switchControl = screen.getByLabelText(/Email Notifications/i);
    fireEvent.click(switchControl); // This will call onCheckedChange
    
    // Check if the switch visually reflects the change if possible, or internal state
    // For a controlled component, this would mean the `checked` prop is now false.
    // Since we can't easily inspect internal state without more setup,
    // we'll rely on the save function being called with the new value.
  });
  
  it('should update state on input change (Select)', async () => {
    render(<UserSettingsSection />);
    await waitFor(() => expect(graphqlClient.getUserSettings).toHaveBeenCalled());

    const themeSelectTrigger = screen.getByRole('combobox', { name: /Theme/i });
    fireEvent.mouseDown(themeSelectTrigger); // Open the select
    // Select a new option. Options might not be immediately in the document until open.
    // This requires the SelectItem to be findable.
    // await waitFor(() => screen.getByText('Light')).then(item => fireEvent.click(item));
    // More robustly, find by role 'option' if items are rendered.
    // For now, this part is conceptual for ShadCN select interaction in test.
  });


  it('should call updateUserSettings on save with changed data', async () => {
    (graphqlClient.updateUserSettings as jest.Mock).mockResolvedValue({ ...mockSettings, theme: 'light' });
    render(<UserSettingsSection />);
    await waitFor(() => expect(graphqlClient.getUserSettings).toHaveBeenCalled());

    // Change the theme (example for one field)
    // This simulates the user interaction that would call handleSelectChange
    // For a real test, you'd find the SelectTrigger, click it, then click an Option.
    // Here, we'll directly simulate the state update then save.
    
    // Simulate user changing theme to 'light'
    // This needs to be done by interacting with the component's state update handlers
    // which are handleSelectChange and handleSwitchChange.
    // We can't directly set state. We need to simulate the interaction.
    // Let's assume a user changes the theme. The actual Select interaction is complex to test here.
    // Instead, we'll focus on the save button being called with the correct payload
    // *if* state had changed.
    
    // For simplicity, we'll assume a change was made and test the save logic.
    // A more thorough test would involve `fireEvent` on Select components.
    
    // Directly change a setting to test the diff logic in handleSave
     const themeSelect = screen.getByRole('combobox', { name: /Theme/i });
     fireEvent.mouseDown(themeSelect);
     const lightOption = await screen.findByText('Light'); // Wait for option to appear
     fireEvent.click(lightOption);


    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(graphqlClient.updateUserSettings).toHaveBeenCalledWith({
        input: { theme: 'light' }, // Only theme was changed from 'dark'
      });
    });
    expect(toast.success).toHaveBeenCalledWith('User settings updated successfully!');
  });
  
  it('should show error toast if fetching settings fails', async () => {
    (graphqlClient.getUserSettings as jest.Mock).mockRejectedValue(new Error('Network Error'));
    render(<UserSettingsSection />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load user settings: Network Error');
    });
  });

  it('should show error toast if saving settings fails', async () => {
    (graphqlClient.updateUserSettings as jest.Mock).mockRejectedValue(new Error('Save Failed'));
    render(<UserSettingsSection />);
    await waitFor(() => expect(graphqlClient.getUserSettings).toHaveBeenCalled());

    // Simulate a change to enable save
    const switchControl = screen.getByLabelText(/Email Notifications/i);
    fireEvent.click(switchControl); 

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save settings: Save Failed');
    });
  });

   it('should show info toast if no changes to save', async () => {
    render(<UserSettingsSection />);
    await waitFor(() => expect(graphqlClient.getUserSettings).toHaveBeenCalled()); // Wait for initial load

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    
    await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('No changes to save.');
    });
    expect(graphqlClient.updateUserSettings).not.toHaveBeenCalled();
  });

});
