import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HeadingField, HeadingFieldPreview } from './HeadingField';
import { FormFieldBase, FormFieldType } from '@/types/forms';

const mockOnChange = jest.fn();

const initialField: FormFieldBase = {
  id: 'test-heading',
  formId: 'form1',
  type: FormFieldType.HEADING,
  name: 'my_heading',
  label: 'Main Title',
  order: 0,
  options: { level: 'h1' },
  width: 100,
};

describe('HeadingField', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Preview', () => {
    it('renders the heading text with correct level', () => {
      render(<HeadingFieldPreview field={initialField} />);
      const headingElement = screen.getByText('Main Title');
      expect(headingElement).toBeInTheDocument();
      expect(headingElement.tagName).toBe('H1');
    });

    it('renders with default level h2 if not specified', () => {
      render(<HeadingFieldPreview field={{ ...initialField, options: {} }} />);
      const headingElement = screen.getByText('Main Title');
      expect(headingElement.tagName).toBe('H2');
    });

     it('renders placeholder if label is empty', () => {
      render(<HeadingFieldPreview field={{ ...initialField, label: '' }} />);
      expect(screen.getByText('Heading Text')).toBeInTheDocument();
    });
  });

  describe('Editor', () => {
    it('renders editor inputs with initial values', () => {
      render(<HeadingField field={initialField} onChange={mockOnChange} showPreview={false} />);
      expect(screen.getByLabelText(/Heading Text/i)).toHaveValue('Main Title');
      expect(screen.getByLabelText(/Identifier Name/i)).toHaveValue('my_heading');
      expect(screen.getByDisplayValue('H1 (Largest)')).toBeInTheDocument(); // Checks SelectValue
      expect(screen.getByLabelText(/Width \(%\)/i)).toHaveValue(100);
    });

    it('calls onChange when heading text (label) is changed', () => {
      render(<HeadingField field={initialField} onChange={mockOnChange} showPreview={false} />);
      const labelInput = screen.getByLabelText(/Heading Text/i);
      fireEvent.change(labelInput, { target: { value: 'New Heading Title' } });
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'New Heading Title' })
      );
    });

    it('calls onChange when identifier name is changed', () => {
      render(<HeadingField field={initialField} onChange={mockOnChange} showPreview={false} />);
      const nameInput = screen.getByLabelText(/Identifier Name/i);
      fireEvent.change(nameInput, { target: { value: 'new_id_name' } });
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'new_id_name' })
      );
    });
    
    it('calls onChange when heading level is changed', () => {
      render(<HeadingField field={initialField} onChange={mockOnChange} showPreview={false} />);
      const levelSelectTrigger = screen.getByRole('combobox'); // ShadCN Select trigger
      fireEvent.mouseDown(levelSelectTrigger);
      // Assuming 'H3' option is rendered and available
      const h3Option = screen.getByText('H3'); 
      fireEvent.click(h3Option);
      
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ options: expect.objectContaining({ level: 'h3' }) })
      );
    });

    it('calls onChange when width is changed', () => {
      render(<HeadingField field={initialField} onChange={mockOnChange} showPreview={false} />);
      const widthInput = screen.getByLabelText(/Width \(%\)/i);
      fireEvent.change(widthInput, { target: { value: '75' } });
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ width: 75 })
      );
    });
  });
});
