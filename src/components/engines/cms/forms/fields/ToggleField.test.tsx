import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToggleField, ToggleFieldPreview } from './ToggleField';
import { FormFieldBase, FormFieldType } from '@/types/forms';

const mockOnChange = jest.fn();

const initialField: FormFieldBase = {
  id: 'test-toggle',
  formId: 'form1',
  type: FormFieldType.TOGGLE,
  name: 'email_opt_in',
  label: 'Enable Email Notifications',
  order: 1,
  helpText: 'Toggle to receive updates.',
  isRequired: false,
  defaultValue: true, // Store as boolean in mock for testing initial state
  width: 100,
};

const initialFieldAsStringDefault: FormFieldBase = {
    ...initialField,
    id: 'test-toggle-str',
    defaultValue: "true", // How it might come from DB/GraphQL
};


describe('ToggleField', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Preview', () => {
    it('renders a disabled switch reflecting defaultValue (true)', () => {
      render(<ToggleFieldPreview field={initialField} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).toBeDisabled();
      expect(switchElement).toBeChecked();
      expect(screen.getByText(initialField.label)).toBeInTheDocument();
    });

    it('renders a disabled switch reflecting defaultValue (false)', () => {
      render(<ToggleFieldPreview field={{ ...initialField, defaultValue: false }} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).not.toBeChecked();
    });
    
    it('renders a disabled switch reflecting string defaultValue ("true")', () => {
      render(<ToggleFieldPreview field={initialFieldAsStringDefault} />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeChecked();
    });
  });

  describe('Editor', () => {
    it('renders editor inputs with initial values (boolean default)', () => {
      render(<ToggleField field={initialField} onChange={mockOnChange} showPreview={false} />);
      expect(screen.getByLabelText(/Field Label/i)).toHaveValue(initialField.label);
      expect(screen.getByLabelText(/Identifier Name/i)).toHaveValue(initialField.name);
      expect(screen.getByLabelText(/Help Text/i)).toHaveValue(initialField.helpText);
      // The checkbox for "Default Value" should reflect the boolean state
      expect(screen.getByLabelText(/Default Value \(Checked = On\)/i)).toBeChecked();
      expect(screen.getByLabelText(/Field is Required/i)).not.toBeChecked();
    });

    it('renders editor inputs with initial values (string "true" default)', () => {
      render(<ToggleField field={initialFieldAsStringDefault} onChange={mockOnChange} showPreview={false} />);
      expect(screen.getByLabelText(/Default Value \(Checked = On\)/i)).toBeChecked();
    });

    it('calls onChange when label is changed', () => {
      render(<ToggleField field={initialField} onChange={mockOnChange} showPreview={false} />);
      fireEvent.change(screen.getByLabelText(/Field Label/i), { target: { value: 'Subscribe to Newsletter' } });
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Subscribe to Newsletter' })
      );
    });

    it('calls onChange when default value checkbox is toggled', () => {
      render(<ToggleField field={initialField} onChange={mockOnChange} showPreview={false} />); // Starts as true
      const defaultValueCheckbox = screen.getByLabelText(/Default Value \(Checked = On\)/i);
      
      fireEvent.click(defaultValueCheckbox); // Toggle to false
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ defaultValue: false })
      );
      
      // Simulate prop update before next toggle for consistent state
      render(<ToggleField field={{...initialField, defaultValue: false }} onChange={mockOnChange} showPreview={false} />);
      const updatedDefaultValueCheckbox = screen.getByLabelText(/Default Value \(Checked = On\)/i);
      fireEvent.click(updatedDefaultValueCheckbox); // Toggle back to true
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ defaultValue: true })
      );
    });

    it('calls onChange when isRequired is toggled', () => {
      render(<ToggleField field={initialField} onChange={mockOnChange} showPreview={false} />);
      const isRequiredCheckbox = screen.getByLabelText(/Field is Required/i); // Starts as false
      fireEvent.click(isRequiredCheckbox);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ isRequired: true })
      );
    });
  });
});
