import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CheckboxField, CheckboxFieldPreview } from './CheckboxField';
import { FormFieldBase, FormFieldType } from '@/types/forms';
import { normalizeValue } from '@/lib/normalize'; // Import if used for value generation

jest.mock('@/lib/normalize', () => ({
  normalizeValue: jest.fn((value) => value.toLowerCase().replace(/\s+/g, '_')),
}));

const mockOnChange = jest.fn();

const initialOptions = [
  { label: 'Option One', value: 'option_one' },
  { label: 'Option Two', value: 'option_two' },
  { label: 'Option Three', value: 'option_three' },
];

const initialField: FormFieldBase = {
  id: 'test-checkbox-group',
  formId: 'form1',
  type: FormFieldType.CHECKBOX,
  name: 'interests',
  label: 'Select Your Interests',
  order: 0,
  options: { items: initialOptions },
  defaultValue: JSON.stringify(['option_one', 'option_three']), // Array for default
  width: 100,
  isRequired: false,
};

const initialFieldWithStringDefault: FormFieldBase = {
  ...initialField,
  id: 'test-checkbox-group-str',
  // How it would come from DB/GraphQL after stringification
  defaultValue: JSON.stringify(['option_one', 'option_three']), 
};


describe('CheckboxField (Group)', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
    (normalizeValue as jest.Mock).mockImplementation(value => value.toLowerCase().replace(/\s+/g, '_'));
  });

  describe('Preview', () => {
    it('renders checkbox options with default values checked', () => {
      render(<CheckboxFieldPreview field={initialField} />);
      expect(screen.getByLabelText('Option One')).toBeChecked();
      expect(screen.getByLabelText('Option Two')).not.toBeChecked();
      expect(screen.getByLabelText('Option Three')).toBeChecked();
      expect(screen.getByText('No options defined.')).not.toBeInTheDocument();
    });

    it('renders "No options defined" if no options', () => {
      render(<CheckboxFieldPreview field={{ ...initialField, options: { items: [] } }} />);
      expect(screen.getByText('No options defined.')).toBeInTheDocument();
    });
  });

  describe('Editor', () => {
    it('renders editor with initial values and options', () => {
      render(<CheckboxField field={initialField} onChange={mockOnChange} showPreview={false} />);
      expect(screen.getByLabelText(/Group Label/i)).toHaveValue(initialField.label);
      expect(screen.getByLabelText(/Identifier Name/i)).toHaveValue(initialField.name);
      
      // Check if options are rendered
      expect(screen.getByText('Option One')).toBeInTheDocument();
      expect(screen.getByText('option_one')).toBeInTheDocument();
      expect(screen.getByText('Option Two')).toBeInTheDocument();

      // Check if default values are correctly reflected in the editor's checkboxes
      const optionOneCheckbox = screen.getByRole('checkbox', { name: /Option One/i });
      const optionTwoCheckbox = screen.getByRole('checkbox', { name: /Option Two/i });
      const optionThreeCheckbox = screen.getByRole('checkbox', { name: /Option Three/i });

      expect(optionOneCheckbox).toBeChecked();
      expect(optionTwoCheckbox).not.toBeChecked();
      expect(optionThreeCheckbox).toBeChecked();
    });

    it('correctly parses stringified array for defaultValue on load', () => {
      render(<CheckboxField field={initialFieldWithStringDefault} onChange={mockOnChange} showPreview={false} />);
      const optionOneCheckbox = screen.getByRole('checkbox', { name: /Option One/i });
      expect(optionOneCheckbox).toBeChecked();
      const optionThreeCheckbox = screen.getByRole('checkbox', { name: /Option Three/i });
      expect(optionThreeCheckbox).toBeChecked();
    });

    it('adds a new option and calls onChange', () => {
      render(<CheckboxField field={initialField} onChange={mockOnChange} showPreview={false} />);
      const newOptionLabelInput = screen.getByLabelText(/New Option Label/i);
      fireEvent.change(newOptionLabelInput, { target: { value: 'Option Four' } });
      // Value should auto-generate
      expect(screen.getByLabelText(/Value \(auto-generated\)/i)).toHaveValue('option_four');
      
      const addButton = screen.getByRole('button', { name: /add/i }); // Assuming PlusCircle has no accessible name
      fireEvent.click(addButton);

      const expectedOptions = [...initialOptions, { label: 'Option Four', value: 'option_four' }];
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          options: { items: expectedOptions },
        })
      );
    });

    it('removes an option and calls onChange, updating defaultValue', () => {
      render(<CheckboxField field={initialField} onChange={mockOnChange} showPreview={false} />);
      // There should be 3 remove buttons (XCircle icon)
      const removeButtons = screen.getAllByRole('button', { name: /remove/i }); // Assuming XCircle has no accessible name
      fireEvent.click(removeButtons[0]); // Remove "Option One"

      const expectedOptions = initialOptions.slice(1); // Option One removed
      const expectedDefaultValue = JSON.stringify(['option_three']); // 'option_one' removed from default

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          options: { items: expectedOptions },
          defaultValue: JSON.stringify(expectedDefaultValue), // Ensure it's stringified
        })
      );
    });

    it('updates defaultValue array and calls onChange with stringified array', () => {
      render(<CheckboxField field={initialField} onChange={mockOnChange} showPreview={false} />);
      // 'Option Two' is initially unchecked, its value is 'option_two'
      const optionTwoEditorCheckbox = screen.getByRole('checkbox', { name: /Option Two/i });
      
      fireEvent.click(optionTwoEditorCheckbox); // Check it

      const expectedDefaultValue = JSON.stringify(['option_one', 'option_three', 'option_two'].sort());
      
      // The last call to onChange should have the updated defaultValue
      const lastOnChangeCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0];
      const parsedLastDefaultValue = JSON.parse(lastOnChangeCall.defaultValue);

      expect(parsedLastDefaultValue).toEqual(expectedDefaultValue);
      expect(lastOnChangeCall.options.items).toEqual(initialOptions); // Options themselves shouldn't change here
    });

    it('calls onChange with stringified empty array if all defaults are unchecked', () => {
        // Start with 'option_one' and 'option_three' checked
        render(<CheckboxField field={initialField} onChange={mockOnChange} showPreview={false} />);
        
        const optionOneEditorCheckbox = screen.getByRole('checkbox', { name: /Option One/i });
       
        fireEvent.click(optionOneEditorCheckbox); // Uncheck option_one
        // defaultValue is now ['option_three'] internally, stringified for onChange

        // Simulate prop update for next action
        const intermediateFieldState = {
            ...initialField,
            defaultValue: JSON.stringify(['option_three'])     // internal state
        };
        render(<CheckboxField field={intermediateFieldState} onChange={mockOnChange} showPreview={false} />);
        // Re-query the checkbox as the component re-rendered
        const updatedOptionThreeCheckbox = screen.getByRole('checkbox', { name: /Option Three/i });
        fireEvent.click(updatedOptionThreeCheckbox); // Uncheck option_three
        // defaultValue is now [] internally

        expect(mockOnChange).toHaveBeenLastCalledWith(
          expect.objectContaining({
            defaultValue: JSON.stringify([]),
          })
        );
    });
  });
});
