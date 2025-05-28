import { FontSize, HeadingType, ColorPalette, ToolbarConfig } from './types';

export const FONT_SIZES: FontSize[] = [
  { label: '12px', value: '1', pixels: 12 },
  { label: '14px', value: '2', pixels: 14 },
  { label: '16px', value: '3', pixels: 16 },
  { label: '18px', value: '4', pixels: 18 },
  { label: '20px', value: '5', pixels: 20 },
  { label: '24px', value: '6', pixels: 24 },
  { label: '28px', value: '7', pixels: 28 },
  { label: '32px', value: '8', pixels: 32 },
  { label: '36px', value: '9', pixels: 36 },
  { label: '48px', value: '10', pixels: 48 },
];

export const HEADING_TYPES: HeadingType[] = [
  { tag: 'p', label: 'Párrafo', className: 'text-base' },
  { tag: 'h1', label: 'Título 1', className: 'text-4xl font-bold' },
  { tag: 'h2', label: 'Título 2', className: 'text-3xl font-bold' },
  { tag: 'h3', label: 'Título 3', className: 'text-2xl font-bold' },
  { tag: 'h4', label: 'Título 4', className: 'text-xl font-bold' },
  { tag: 'h5', label: 'Título 5', className: 'text-lg font-bold' },
  { tag: 'h6', label: 'Título 6', className: 'text-base font-bold' },
];

export const COLOR_PALETTES: ColorPalette[] = [
  {
    label: 'Colores básicos',
    colors: [
      '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
      '#FF0000', '#FF6600', '#FFCC00', '#00FF00', '#0066FF', '#6600FF'
    ]
  },
  {
    label: 'Colores extendidos',
    colors: [
      '#8B0000', '#FF4500', '#FFD700', '#32CD32', '#1E90FF', '#9932CC',
      '#DC143C', '#FF8C00', '#FFFF00', '#00FF7F', '#00BFFF', '#8A2BE2',
      '#B22222', '#FFA500', '#ADFF2F', '#00CED1', '#4169E1', '#DA70D6'
    ]
  }
];

export const BACKGROUND_COLORS: string[] = [
  'transparent',
  '#FFFF00', // Amarillo
  '#00FF00', // Verde
  '#00FFFF', // Cian
  '#FF00FF', // Magenta
  '#FFA500', // Naranja
  '#FFB6C1', // Rosa claro
  '#E6E6FA', // Lavanda
  '#F0F8FF', // Azul Alice
  '#F5F5DC', // Beige
];

export const TOOLBAR_CONFIGS: Record<string, ToolbarConfig> = {
  full: {
    formatting: true,
    headings: true,
    fontSize: true,
    colors: true,
    alignment: true,
    lists: true,
    links: true,
    advanced: true,
  },
  basic: {
    formatting: true,
    headings: true,
    fontSize: false,
    colors: false,
    alignment: true,
    lists: true,
    links: true,
    advanced: false,
  },
  minimal: {
    formatting: true,
    headings: false,
    fontSize: false,
    colors: false,
    alignment: false,
    lists: false,
    links: false,
    advanced: false,
  },
};

export const KEYBOARD_SHORTCUTS = {
  'Ctrl+B': 'bold',
  'Ctrl+I': 'italic',
  'Ctrl+U': 'underline',
  'Ctrl+Z': 'undo',
  'Ctrl+Y': 'redo',
  'Ctrl+Shift+Z': 'redo',
  'Ctrl+L': 'justifyLeft',
  'Ctrl+E': 'justifyCenter',
  'Ctrl+R': 'justifyRight',
  'Ctrl+J': 'justifyFull',
} as const;

export const DEFAULT_STYLES = `
  .rich-text-editor-content {
    min-height: 200px;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    outline: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
  }
  
  .rich-text-editor-content:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .rich-text-editor-content h1 { font-size: 2.25rem; font-weight: bold; margin: 0.5em 0; }
  .rich-text-editor-content h2 { font-size: 1.875rem; font-weight: bold; margin: 0.5em 0; }
  .rich-text-editor-content h3 { font-size: 1.5rem; font-weight: bold; margin: 0.5em 0; }
  .rich-text-editor-content h4 { font-size: 1.25rem; font-weight: bold; margin: 0.5em 0; }
  .rich-text-editor-content h5 { font-size: 1.125rem; font-weight: bold; margin: 0.5em 0; }
  .rich-text-editor-content h6 { font-size: 1rem; font-weight: bold; margin: 0.5em 0; }
  
  .rich-text-editor-content p { margin: 0.5em 0; }
  .rich-text-editor-content ul, .rich-text-editor-content ol { margin: 0.5em 0; padding-left: 2em; }
  .rich-text-editor-content li { margin: 0.25em 0; }
  
  .rich-text-editor-content a { color: #3b82f6; text-decoration: underline; }
  .rich-text-editor-content a:hover { color: #1d4ed8; }
  
  .rich-text-editor-content blockquote {
    border-left: 4px solid #e2e8f0;
    padding-left: 1em;
    margin: 1em 0;
    font-style: italic;
    color: #64748b;
  }
  
  .rich-text-editor-content code {
    background-color: #f1f5f9;
    padding: 0.125em 0.25em;
    border-radius: 0.25em;
    font-family: 'Courier New', monospace;
    font-size: 0.875em;
  }
  
  .rich-text-editor-content pre {
    background-color: #f1f5f9;
    padding: 1em;
    border-radius: 0.5em;
    overflow-x: auto;
    margin: 1em 0;
  }
  
  .rich-text-editor-content pre code {
    background: none;
    padding: 0;
  }
`; 