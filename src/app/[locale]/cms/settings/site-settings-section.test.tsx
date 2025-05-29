import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SiteSettingsSection from './site-settings-section';
import graphqlClient from '@/lib/graphql-client';
import { toast } from 'sonner';

// Mock graphqlClient
jest.mock('@/lib/graphql-client', () => ({
  getSiteSettings: jest.fn(),
  updateSiteSettings: jest.fn(),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('SiteSettingsSection', () => {
  const mockSiteSettings = {
    id: 'site1',
    siteName: 'My Test Site',
    siteDescription: 'Test description',
    logoUrl: 'http://example.com/logo.png',
    faviconUrl: 'http://example.com/favicon.ico',
    primaryColor: '#FF0000',
    secondaryColor: '#00FF00',
    accentColor: '#0000FF',
    googleAnalyticsId: 'UA-123',
    facebookPixelId: 'FB-123',
    customCss: '.custom {}',
    customJs: 'console.log("custom")',
    contactEmail: 'test@example.com',
    contactPhone: '123-456-7890',
    address: '123 Test St',
    defaultLocale: 'en',
    supportedLocales: ['en', 'es'],
    footerText: '© Test Site',
    maintenanceMode: false,
    metaTitle: 'Test Meta Title',
    metaDescription: 'Test Meta Desc',
    ogImage: 'http://example.com/og.png',
    socialLinks: '{"twitter":"http://twitter.com/test"}',
    twitterCardType: 'summary',
    twitterHandle: '@test',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (graphqlClient.getSiteSettings as jest.Mock).mockResolvedValue(mockSiteSettings);
  });

  it('should render loading state initially', () => {
    render(<SiteSettingsSection />);
    expect(screen.getByText(/Loading site settings.../i)).toBeInTheDocument();
  });

  it('should fetch and display site settings', async () => {
    render(<SiteSettingsSection />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Site Name/i)).toHaveValue(mockSiteSettings.siteName);
    });
    expect(screen.getByLabelText(/Site Description/i)).toHaveValue(mockSiteSettings.siteDescription);
    expect(screen.getByLabelText(/Logo URL/i)).toHaveValue(mockSiteSettings.logoUrl);
    expect(screen.getByLabelText(/Maintenance Mode/i)).not.toBeChecked(); // as per mock
    expect(screen.getByLabelText(/Supported Locales \(comma-separated\)/i)).toHaveValue('en, es');
    expect(screen.getByLabelText(/Social Links \(JSON format\)/i)).toHaveValue(mockSiteSettings.socialLinks);
  });

  it('should update state on input change', async () => {
    render(<SiteSettingsSection />);
    await waitFor(() => expect(graphqlClient.getSiteSettings).toHaveBeenCalled());

    const siteNameInput = screen.getByLabelText(/Site Name/i);
    fireEvent.change(siteNameInput, { target: { value: 'New Site Name' } });
    expect(siteNameInput).toHaveValue('New Site Name');
  });

  it('should call updateSiteSettings on save with changed data', async () => {
    const updatedSettingsMock = { ...mockSiteSettings, siteName: 'Updated Site Name' };
    (graphqlClient.updateSiteSettings as jest.Mock).mockResolvedValue(updatedSettingsMock);
    
    render(<SiteSettingsSection />);
    await waitFor(() => expect(graphqlClient.getSiteSettings).toHaveBeenCalled());

    const siteNameInput = screen.getByLabelText(/Site Name/i);
    fireEvent.change(siteNameInput, { target: { value: 'Updated Site Name' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Site Settings/i }));

    await waitFor(() => {
      expect(graphqlClient.updateSiteSettings).toHaveBeenCalledWith({
        input: expect.objectContaining({ siteName: 'Updated Site Name' }),
      });
    });
    expect(toast.success).toHaveBeenCalledWith('Site settings updated successfully!');
  });

  it('should show error toast if fetching settings fails', async () => {
    (graphqlClient.getSiteSettings as jest.Mock).mockRejectedValue(new Error('Fetch Error'));
    render(<SiteSettingsSection />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load site settings: Fetch Error');
    });
  });

  it('should show error toast if saving settings fails', async () => {
    (graphqlClient.updateSiteSettings as jest.Mock).mockRejectedValue(new Error('Save Error'));
    render(<SiteSettingsSection />);
    await waitFor(() => expect(graphqlClient.getSiteSettings).toHaveBeenCalled());

    const siteNameInput = screen.getByLabelText(/Site Name/i);
    fireEvent.change(siteNameInput, { target: { value: 'Attempt Save' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Site Settings/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save site settings: Save Error');
    });
  });
  
  it('should show info toast if no changes to save', async () => {
    render(<SiteSettingsSection />);
    await waitFor(() => expect(graphqlClient.getSiteSettings).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Save Site Settings/i }));
    
    await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('No changes to save.');
    });
    expect(graphqlClient.updateSiteSettings).not.toHaveBeenCalled();
  });

  it('should correctly parse comma-separated supportedLocales on save', async () => {
    (graphqlClient.updateSiteSettings as jest.Mock).mockResolvedValue(mockSiteSettings);
    render(<SiteSettingsSection />);
    await waitFor(() => expect(graphqlClient.getSiteSettings).toHaveBeenCalled());

    const localesInput = screen.getByLabelText(/Supported Locales \(comma-separated\)/i);
    fireEvent.change(localesInput, { target: { value: 'en, fr, de' } });

    fireEvent.click(screen.getByRole('button', { name: /Save Site Settings/i }));

    await waitFor(() => {
      expect(graphqlClient.updateSiteSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({ supportedLocales: ['en', 'fr', 'de'] }),
        })
      );
    });
  });

  it('should show error if socialLinks JSON is invalid on save', async () => {
    render(<SiteSettingsSection />);
    await waitFor(() => expect(graphqlClient.getSiteSettings).toHaveBeenCalled());

    const socialLinksTextarea = screen.getByLabelText(/Social Links \(JSON format\)/i);
    fireEvent.change(socialLinksTextarea, { target: { value: 'invalid-json' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Save Site Settings/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Social Links JSON is invalid.');
    });
    expect(graphqlClient.updateSiteSettings).not.toHaveBeenCalled();
  });

});
