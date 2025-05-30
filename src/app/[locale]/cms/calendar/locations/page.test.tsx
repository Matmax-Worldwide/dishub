import React from 'react';
import { render, screen } from '@testing-library/react';
import LocationsPage from './page'; // Adjust path as necessary if it's a default export

// Mock LocationManager as it's the main component rendered by the page
jest.mock('@/components/cms/calendar/LocationManager', () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="location-manager-mock">LocationManagerMock</div>),
  };
});

// Mock PageHeader components if they are complex or cause issues in basic test
jest.mock('@/components/page-header', () => ({
  PageHeader: jest.fn(({ children }) => <div data-testid="page-header-mock">{children}</div>),
  PageHeaderHeading: jest.fn(({ children }) => <h1 data-testid="page-header-heading-mock">{children}</h1>),
}));


describe('LocationsPage', () => {
  it('renders the LocationManager component and page header', () => {
    render(<LocationsPage />);

    // Check for PageHeader (or its mock)
    expect(screen.getByTestId('page-header-mock')).toBeInTheDocument();
    expect(screen.getByTestId('page-header-heading-mock')).toHaveTextContent('Manage Locations');
    
    // Check for LocationManager (or its mock)
    expect(screen.getByTestId('location-manager-mock')).toBeInTheDocument();
  });
});
