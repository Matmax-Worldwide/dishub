import React from 'react';
import { render, screen } from '@testing-library/react';
import StaffPage from './page';

// Mock StaffManager
jest.mock('@/components/cms/calendar/StaffManager', () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="staff-manager-mock">StaffManagerMock</div>),
  };
});

// Mock PageHeader components
jest.mock('@/components/page-header', () => ({
  PageHeader: jest.fn(({ children }) => <div data-testid="page-header-mock">{children}</div>),
  PageHeaderHeading: jest.fn(({ children }) => <h1 data-testid="page-header-heading-mock">{children}</h1>),
}));

describe('StaffPage', () => {
  it('renders the StaffManager component and page header', () => {
    render(<StaffPage />);
    
    expect(screen.getByTestId('page-header-mock')).toBeInTheDocument();
    expect(screen.getByTestId('page-header-heading-mock')).toHaveTextContent('Manage Staff');
    
    expect(screen.getByTestId('staff-manager-mock')).toBeInTheDocument();
  });
});
