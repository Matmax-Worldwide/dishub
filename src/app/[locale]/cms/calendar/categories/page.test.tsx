import React from 'react';
import { render, screen } from '@testing-library/react';
import CategoriesPage from './page';

// Mock CategoryManager
jest.mock('@/components/cms/calendar/CategoryManager', () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="category-manager-mock">CategoryManagerMock</div>),
  };
});

// Mock PageHeader components
jest.mock('@/components/page-header', () => ({
  PageHeader: jest.fn(({ children }) => <div data-testid="page-header-mock">{children}</div>),
  PageHeaderHeading: jest.fn(({ children }) => <h1 data-testid="page-header-heading-mock">{children}</h1>),
}));

describe('CategoriesPage', () => {
  it('renders the CategoryManager component and page header', () => {
    render(<CategoriesPage />);
    
    expect(screen.getByTestId('page-header-mock')).toBeInTheDocument();
    expect(screen.getByTestId('page-header-heading-mock')).toHaveTextContent('Manage Service Categories');
    
    expect(screen.getByTestId('category-manager-mock')).toBeInTheDocument();
  });
});
