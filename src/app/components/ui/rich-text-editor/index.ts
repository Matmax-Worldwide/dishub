// Componente principal
export { default as RichTextEditor } from './RichTextEditor';
export { RichTextEditor as default } from './RichTextEditor';

// Componentes auxiliares
export { Toolbar } from './Toolbar';

// Tipos
export type {
  RichTextEditorProps,
  ToolbarConfig,
  FontSize,
  HeadingType,
  ColorPalette,
  EditorCommand,
  LinkData,
  EditorState,
  ToolbarGroup
} from './types';

// Utilidades
export { EditorUtils } from './utils';

// Constantes
export {
  FONT_SIZES,
  HEADING_TYPES,
  COLOR_PALETTES,
  BACKGROUND_COLORS,
  TOOLBAR_CONFIGS,
  KEYBOARD_SHORTCUTS,
  DEFAULT_STYLES
} from './constants'; 