import React from 'react';
import { render, screen } from '@testing-library/react';
import ServicesPage from './page';

// Mock ServiceManager
jest.mock('@/components/cms/calendar/ServiceManager', () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="service-manager-mock">ServiceManagerMock</div>),
  };
});

// Mock PageHeader components
jest.mock('@/components/page-header', () => ({
  PageHeader: jest.fn(({ children }) => <div data-testid="page-header-mock">{children}</div>),
  PageHeaderHeading: jest.fn(({ children }) => <h1 data-testid="page-header-heading-mock">{children}</h1>),
}));

describe('ServicesPage', () => {
  it('renders the ServiceManager component and page header', () => {
    render(<ServicesPage />);
    
    expect(screen.getByTestId('page-header-mock')).toBeInTheDocument();
    expect(screen.getByTestId('page-header-heading-mock')).toHaveTextContent('Manage Services');
    
    expect(screen.getByTestId('service-manager-mock')).toBeInTheDocument();
  });
});
