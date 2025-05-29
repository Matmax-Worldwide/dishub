import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NumberField, NumberFieldPreview } from './NumberField';
import { FormFieldBase, FormFieldType } from '@/types/forms';

const mockOnChange = jest.fn();

const initialField: FormFieldBase = {
  id: 'test-number',
  formId: 'form1',
  type: FormFieldType.NUMBER,
  name: 'age_input',
  label: 'Your Age',
  order: 1,
  placeholder: 'Enter your age',
  helpText: 'Must be 18 or older',
  isRequired: true,
  defaultValue: "25",
  width: 50,
};

describe('NumberField', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Preview', () => {
    it('renders a disabled number input with placeholder', () => {
      render(<NumberFieldPreview field={initialField} />);
      const inputElement = screen.getByPlaceholderText('Enter your age');
      expect(inputElement).toBeInTheDocument();
      expect(inputElement).toBeDisabled();
      expect(inputElement).toHaveAttribute('type', 'number');
      // Note: defaultValue for input type="number" is tricky to test via getByDisplayValue
      // It's better to check the attribute directly or the component's behavior if it formats display.
      // For a simple disabled input, checking placeholder is often sufficient.
    });
  });

  describe('Editor', () => {
    it('renders editor inputs with initial values', () => {
      render(<NumberField field={initialField} onChange={mockOnChange} showPreview={false} />);
      expect(screen.getByLabelText(/Field Label/i)).toHaveValue(initialField.label);
      expect(screen.getByLabelText(/Identifier Name/i)).toHaveValue(initialField.name);
      expect(screen.getByLabelText(/Placeholder/i)).toHaveValue(initialField.placeholder);
      expect(screen.getByLabelText(/Help Text/i)).toHaveValue(initialField.helpText);
      expect(screen.getByLabelText(/Field is Required/i)).toBeChecked();
      expect(screen.getByLabelText(/Default Value/i)).toHaveValue(25); // input type=number parses string to number
      expect(screen.getByLabelText(/Width \(%\)/i)).toHaveValue(initialField.width);
    });

    it('calls onChange when label is changed', () => {
      render(<NumberField field={initialField} onChange={mockOnChange} showPreview={false} />);
      fireEvent.change(screen.getByLabelText(/Field Label/i), { target: { value: 'Participant Age' } });
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Participant Age' })
      );
    });

    it('calls onChange when defaultValue (number) is changed', () => {
      render(<NumberField field={initialField} onChange={mockOnChange} showPreview={false} />);
      fireEvent.change(screen.getByLabelText(/Default Value/i), { target: { value: '30' } });
      // The component should parse "30" to number 30
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ defaultValue: 30 }) 
      );
    });
    
    it('calls onChange with empty string for defaultValue if input is cleared', () => {
      render(<NumberField field={initialField} onChange={mockOnChange} showPreview={false} />);
      fireEvent.change(screen.getByLabelText(/Default Value/i), { target: { value: '' } });
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ defaultValue: '' })
      );
    });

    it('calls onChange when isRequired is toggled', () => {
      render(<NumberField field={initialField} onChange={mockOnChange} showPreview={false} />);
      // Checkbox is not directly getByLabelText, find by its associated label or role
      const isRequiredCheckbox = screen.getByLabelText(/Field is Required/i);
      fireEvent.click(isRequiredCheckbox); // From true to false
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ isRequired: false })
      );
      fireEvent.click(isRequiredCheckbox); // From false to true
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ isRequired: true })
      );
    });
  });
});
