export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  showWordCount?: boolean;
  toolbar?: 'full' | 'basic' | 'minimal';
  height?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface ToolbarConfig {
  formatting: boolean;
  headings: boolean;
  fontSize: boolean;
  colors: boolean;
  alignment: boolean;
  lists: boolean;
  links: boolean;
  advanced: boolean;
}

export interface FontSize {
  label: string;
  value: string;
  pixels: number;
}

export interface HeadingType {
  tag: string;
  label: string;
  className: string;
}

export interface ColorPalette {
  label: string;
  colors: string[];
}

export interface EditorCommand {
  command: string;
  value?: string;
  showUI?: boolean;
}

export interface LinkData {
  url: string;
  text: string;
  target: '_blank' | '_self';
}

export interface EditorState {
  canUndo: boolean;
  canRedo: boolean;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  fontSize: string;
  fontColor: string;
  backgroundColor: string;
  alignment: string;
  currentTag: string;
}

export type ToolbarGroup = 
  | 'formatting' 
  | 'headings' 
  | 'fontSize' 
  | 'colors' 
  | 'alignment' 
  | 'lists' 
  | 'links' 
  | 'advanced'; 