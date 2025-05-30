import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryManager from './CategoryManager';
import { graphqlClient } from '@/lib/graphql-client';
import { toast } from 'sonner';

// Mock graphqlClient
jest.mock('@/lib/graphql-client', () => ({
  graphqlClient: {
    serviceCategories: jest.fn(),
    deleteServiceCategory: jest.fn(),
    // createServiceCategory and updateServiceCategory are implicitly tested via form submission
  },
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useParams: jest.fn(() => ({ locale: 'en' })),
  usePathname: jest.fn(() => '/cms/calendar/categories'),
}));

// Mock child components: CategoryForm and AlertDialog
jest.mock('./CategoryForm', () => {
  return {
    __esModule: true,
    default: jest.fn(({ isOpen, onClose, onSave, initialData, categories }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="category-form-mock">
          <button onClick={onClose}>Close Form</button>
          <button onClick={() => onSave({ name: 'Mock Save Category', ...initialData })}>
            Save Form
          </button>
          <span>{initialData ? `Editing: ${initialData.name}` : 'Adding New Category'}</span>
          {categories && <span data-testid="categories-prop-check">Categories prop length: {categories.length}</span>}
        </div>
      );
    }),
  };
});

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: jest.fn(({ children, open }) => (open ? <div data-testid="alert-dialog-mock">{children}</div> : null)),
  AlertDialogTrigger: jest.fn(({ children }) => children),
  AlertDialogContent: jest.fn(({ children }) => <div>{children}</div>),
  AlertDialogHeader: jest.fn(({ children }) => <div>{children}</div>),
  AlertDialogTitle: jest.fn(({ children }) => <h5>{children}</h5>),
  AlertDialogDescription: jest.fn(({ children }) => <p>{children}</p>),
  AlertDialogFooter: jest.fn(({ children }) => <div>{children}</div>),
  AlertDialogCancel: jest.fn(({ children, onClick }) => <button onClick={onClick} data-testid="alert-dialog-cancel-button">{children}</button>),
  AlertDialogAction: jest.fn(({ children, onClick }) => <button onClick={onClick} data-testid="alert-dialog-action-button">{children}</button>),
}));

const mockCategoriesData = [
  { id: '1', name: 'Hair Styling', description: 'All hair styling services', displayOrder: 1, parentId: null, childCategories: [], services: [] },
  { id: '2', name: 'Massage Therapy', description: 'Relaxing massages', displayOrder: 2, parentId: null, childCategories: [], services: [] },
];

describe('CategoryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (graphqlClient.serviceCategories as jest.Mock).mockResolvedValue([...mockCategoriesData]);
  });

  it('fetches and displays categories on mount', async () => {
    render(<CategoryManager />);
    expect(graphqlClient.serviceCategories).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.getByText('Hair Styling')).toBeInTheDocument();
      expect(screen.getByText('Massage Therapy')).toBeInTheDocument();
    });
  });

  it('displays a loading state initially', () => {
    (graphqlClient.serviceCategories as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<CategoryManager />);
    expect(screen.getByText(/loading categories/i)).toBeInTheDocument();
  });

  it('displays an error message if fetching fails', async () => {
    (graphqlClient.serviceCategories as jest.Mock).mockRejectedValue(new Error('Failed to fetch categories'));
    render(<CategoryManager />);
    await waitFor(() => {
      expect(screen.getByText(/error fetching categories/i)).toBeInTheDocument();
    });
  });

  it('opens CategoryForm when "Add New Category" is clicked', async () => {
    render(<CategoryManager />);
    await userEvent.click(screen.getByRole('button', { name: /add new category/i }));
    await waitFor(() => {
      expect(screen.getByTestId('category-form-mock')).toBeInTheDocument();
      expect(screen.getByText('Adding New Category')).toBeInTheDocument();
      // Check if categories are passed to the form for parent selection
      expect(screen.getByTestId('categories-prop-check')).toHaveTextContent(`Categories prop length: ${mockCategoriesData.length}`);
    });
  });

  it('opens CategoryForm with initialData for "Edit"', async () => {
    render(<CategoryManager />);
    await waitFor(() => expect(screen.getByText('Hair Styling')).toBeInTheDocument());
    
    const editButtons = await screen.findAllByRole('button', { name: /edit/i });
    await userEvent.click(editButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByTestId('category-form-mock')).toBeInTheDocument();
      expect(screen.getByText(`Editing: ${mockCategoriesData[0].name}`)).toBeInTheDocument();
    });
  });

  it('handles deleting a category with confirmation', async () => {
    (graphqlClient.deleteServiceCategory as jest.Mock).mockResolvedValue({ id: mockCategoriesData[0].id });
    render(<CategoryManager />);
    await waitFor(() => expect(screen.getByText('Hair Styling')).toBeInTheDocument());

    const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    await waitFor(() => expect(screen.getByTestId('alert-dialog-mock')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('alert-dialog-action-button'));

    await waitFor(() => {
      expect(graphqlClient.deleteServiceCategory).toHaveBeenCalledWith({ id: mockCategoriesData[0].id });
      expect(toast.success).toHaveBeenCalledWith('Category "Hair Styling" deleted successfully.');
      expect(graphqlClient.serviceCategories).toHaveBeenCalledTimes(2); // Initial + re-fetch
    });
  });
});
