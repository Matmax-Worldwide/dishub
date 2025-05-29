// Exportar componentes base
export { FieldLayout, BaseFieldPreview, fieldTypeNames } from './FieldBase';
export type { FieldProps, FieldPreviewProps } from './FieldBase';

// Exportar componentes de campo específicos
export { TextField, TextFieldPreview } from './TextField';
export { TextAreaField, TextAreaFieldPreview } from './TextAreaField';
export { SelectField, SelectFieldPreview } from './SelectField';
export { RadioField, RadioFieldPreview } from './RadioField';
export { CheckboxField, CheckboxFieldPreview } from './CheckboxField';
export { EmailField, EmailFieldPreview } from './EmailField';
export { PasswordField, PasswordFieldPreview } from './PasswordField';
export { PhoneField, PhoneFieldPreview } from './PhoneField';

// Newly added field components
export { HeadingField, HeadingFieldPreview } from './HeadingField';
export { ParagraphField, ParagraphFieldPreview } from './ParagraphField';
export { DividerField, DividerFieldPreview } from './DividerField';
export { SpacerField, SpacerFieldPreview } from './SpacerField';
export { HiddenField, HiddenFieldPreview } from './HiddenField';
export { HtmlField, HtmlFieldPreview } from './HtmlField';
export { NumberField, NumberFieldPreview } from './NumberField';
export { DateField, DateFieldPreview } from './DateField';
export { TimeField, TimeFieldPreview } from './TimeField';
export { DateTimeField, DateTimeFieldPreview } from './DateTimeField';

// Part 2 field components
export { MultiSelectField, MultiSelectFieldPreview } from './MultiSelectField';
export { ToggleField, ToggleFieldPreview } from './ToggleField';
export { SliderField, SliderFieldPreview } from './SliderField';
export { RatingField, RatingFieldPreview } from './RatingField';
export { FileField, FileFieldPreview } from './FileField';
export { CaptchaField, CaptchaFieldPreview } from './CaptchaField';
export { SignatureField, SignatureFieldPreview } from './SignatureField';
export { AutocompleteField, AutocompleteFieldPreview } from './AutocompleteField';
export { AddressField, AddressFieldPreview } from './AddressField';

// Exportar el editor principal
export { FieldEditor } from './FieldEditor'; 