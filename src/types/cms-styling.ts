export interface ComponentStyling {
  backgroundColor?: string;
  textColor?: string;
  backgroundTransparency?: number;
  textTransparency?: number;
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  border?: {
    width?: number;
    color?: string;
    style?: 'solid' | 'dashed' | 'dotted';
  };
  borderColor?: string;
  customCss?: string;
}

export interface ComponentStyleProps {
  styling?: ComponentStyling;
  onStylingChange?: (styling: ComponentStyling) => void;
}

export const DEFAULT_STYLING: ComponentStyling = {
  backgroundColor: '#ffffff',
  textColor: '#000000',
  backgroundTransparency: 0,
  textTransparency: 0,
  padding: 'none',
  margin: 'none',
  borderRadius: 'medium',
  shadow: 'none',
  border: {
    width: 0,
    color: '#e5e7eb',
    style: 'solid'
  },
  borderColor: '#e5e7eb',
  customCss: ''
};

export const PADDING_OPTIONS = [
  { value: 'none', label: 'None (0px)', class: 'p-0' },
  { value: 'small', label: 'Small (8px)', class: 'p-2' },
  { value: 'medium', label: 'Medium (16px)', class: 'p-4' },
  { value: 'large', label: 'Large (32px)', class: 'p-8' }
] as const;

export const MARGIN_OPTIONS = [
  { value: 'none', label: 'None (0px)', class: 'm-0' },
  { value: 'small', label: 'Small (8px)', class: 'm-2' },
  { value: 'medium', label: 'Medium (16px)', class: 'm-4' },
  { value: 'large', label: 'Large (32px)', class: 'm-8' }
] as const;

export const BORDER_RADIUS_OPTIONS = [
  { value: 'none', label: 'None', class: 'rounded-none' },
  { value: 'small', label: 'Small', class: 'rounded-sm' },
  { value: 'medium', label: 'Medium', class: 'rounded-md' },
  { value: 'large', label: 'Large', class: 'rounded-lg' },
  { value: 'full', label: 'Full', class: 'rounded-full' }
] as const;

export const SHADOW_OPTIONS = [
  { value: 'none', label: 'None', class: 'shadow-none' },
  { value: 'small', label: 'Small', class: 'shadow-sm' },
  { value: 'medium', label: 'Medium', class: 'shadow-md' },
  { value: 'large', label: 'Large', class: 'shadow-lg' }
] as const;

// Utility function to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper function to generate CSS styles from ComponentStyling
export function generateStylesFromStyling(styling: ComponentStyling): React.CSSProperties {
  const styles: React.CSSProperties = {};
  
  // Background color with transparency
  if (styling.backgroundColor) {
    const bgColor = hexToRgba(styling.backgroundColor, 1 - (styling.backgroundTransparency || 0) / 100);
    styles.backgroundColor = bgColor;
  }
  
  // Text color with transparency
  if (styling.textColor) {
    const textColor = hexToRgba(styling.textColor, 1 - (styling.textTransparency || 0) / 100);
    styles.color = textColor;
  }
  
  // Border
  if (styling.border?.width && styling.border.width > 0) {
    const borderColor = styling.borderColor || styling.border.color || '#e5e7eb';
    styles.border = `${styling.border.width}px ${styling.border.style || 'solid'} ${borderColor}`;
  }
  
  // Box shadow - convert to actual CSS shadow values
  if (styling.shadow && styling.shadow !== 'none') {
    const shadowMap: Record<string, string> = {
      'small': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'medium': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      'large': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
    };
    
    if (shadowMap[styling.shadow]) {
      styles.boxShadow = shadowMap[styling.shadow];
    }
  }
  
  return styles;
}

// Helper function to generate CSS classes from ComponentStyling
export function generateClassesFromStyling(styling: ComponentStyling): string {
  const classes: string[] = [];
  
  // Padding
  const paddingOption = PADDING_OPTIONS.find(opt => opt.value === styling.padding);
  if (paddingOption) classes.push(paddingOption.class);
  
  // Margin
  const marginOption = MARGIN_OPTIONS.find(opt => opt.value === styling.margin);
  if (marginOption) classes.push(marginOption.class);
  
  // Border radius
  const borderRadiusOption = BORDER_RADIUS_OPTIONS.find(opt => opt.value === styling.borderRadius);
  if (borderRadiusOption) classes.push(borderRadiusOption.class);
  
  // Shadow
  const shadowOption = SHADOW_OPTIONS.find(opt => opt.value === styling.shadow);
  if (shadowOption) classes.push(shadowOption.class);
  
  return classes.join(' ');
} 