import React from 'react';
import { render, screen } from '@testing-library/react';
import BookingRulesPage from './page'; // Adjust path as necessary

// Mock BookingRulesManager
jest.mock('@/components/cms/calendar/BookingRulesManager', () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="booking-rules-manager-mock">BookingRulesManagerMock</div>),
  };
});

// Mock PageHeader components
jest.mock('@/components/page-header', () => ({
  PageHeader: jest.fn(({ children }) => <div data-testid="page-header-mock">{children}</div>),
  PageHeaderHeading: jest.fn(({ children }) => <h1 data-testid="page-header-heading-mock">{children}</h1>),
}));

describe('BookingRulesPage', () => {
  it('renders the BookingRulesManager component and page header', () => {
    render(<BookingRulesPage />);
    
    expect(screen.getByTestId('page-header-mock')).toBeInTheDocument();
    expect(screen.getByTestId('page-header-heading-mock')).toHaveTextContent('Manage Booking Rules'); // Or "Global Booking Rules"
    
    expect(screen.getByTestId('booking-rules-manager-mock')).toBeInTheDocument();
  });
});
