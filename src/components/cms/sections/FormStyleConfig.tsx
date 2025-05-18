'use client';

import React, { useState, useCallback } from 'react';
import { Sliders, AlignLeft, AlignRight, AlignCenter } from 'lucide-react';

interface FormStyleConfigProps {
  initialStyles?: FormStyles;
  onChange: (styles: FormStyles) => void;
}

export interface FormStyles {
  padding?: string;
  alignment?: 'left' | 'center' | 'right';
  containerStyles?: {
    backgroundColor?: string;
    borderRadius?: string;
    borderColor?: string;
    borderWidth?: string;
    shadow?: 'none' | 'sm' | 'md' | 'lg';
  };
  buttonStyles?: {
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    padding?: string;
  };
}

export const FormStyleConfig: React.FC<FormStyleConfigProps> = ({
  initialStyles = defaultStyles,
  onChange
}) => {
  const [styles, setStyles] = useState<FormStyles>(initialStyles);
  const [expanded, setExpanded] = useState(false);

  const handleStyleChange = useCallback((key: string, value: string | number | boolean, category?: string) => {
    let updatedStyles: FormStyles;
    
    if (category) {
      updatedStyles = {
        ...styles,
        [category]: {
          ...(styles[category as keyof FormStyles] as Record<string, string | number | boolean> || {}),
          [key]: value
        }
      };
    } else {
      updatedStyles = {
        ...styles,
        [key]: value
      };
    }
    
    setStyles(updatedStyles);
    onChange(updatedStyles);
  }, [styles, onChange]);

  return (
    <div className="border rounded-md p-3 bg-card">
      <div 
        className="flex items-center justify-between cursor-pointer" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <Sliders className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm font-medium">Form Styling</span>
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          {expanded ? '−' : '+'}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Layout</div>
            
            {/* Padding */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-sm text-muted-foreground">Padding:</label>
              <select 
                value={styles.padding || 'medium'}
                onChange={(e) => handleStyleChange('padding', e.target.value)}
                className="text-sm p-1 border rounded"
              >
                <option value="none">None</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            
            {/* Alignment */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-sm text-muted-foreground">Alignment:</label>
              <div className="flex border rounded p-1 bg-muted/10">
                <button
                  type="button"
                  onClick={() => handleStyleChange('alignment', 'left')}
                  className={`flex-1 flex justify-center p-1 ${styles.alignment === 'left' ? 'bg-primary text-white rounded' : ''}`}
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleStyleChange('alignment', 'center')}
                  className={`flex-1 flex justify-center p-1 ${styles.alignment === 'center' ? 'bg-primary text-white rounded' : ''}`}
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleStyleChange('alignment', 'right')}
                  className={`flex-1 flex justify-center p-1 ${styles.alignment === 'right' ? 'bg-primary text-white rounded' : ''}`}
                >
                  <AlignRight size={14} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Container</div>
            
            {/* Background Color */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-sm text-muted-foreground">Background:</label>
              <div className="flex items-center">
                <div className="w-4 h-4 mr-2 rounded overflow-hidden border">
                  <div style={{ backgroundColor: styles.containerStyles?.backgroundColor || 'transparent', width: '100%', height: '100%' }}></div>
                </div>
                <input 
                  type="color" 
                  value={styles.containerStyles?.backgroundColor || '#ffffff'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value, 'containerStyles')}
                  className="w-16 h-6"
                />
                <button 
                  onClick={() => handleStyleChange('backgroundColor', 'transparent', 'containerStyles')}
                  className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {/* Border Radius */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-sm text-muted-foreground">Border Radius:</label>
              <select 
                value={styles.containerStyles?.borderRadius || 'md'}
                onChange={(e) => handleStyleChange('borderRadius', e.target.value, 'containerStyles')}
                className="text-sm p-1 border rounded"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="full">Pill</option>
              </select>
            </div>
            
            {/* Shadow */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-sm text-muted-foreground">Shadow:</label>
              <select 
                value={styles.containerStyles?.shadow || 'none'}
                onChange={(e) => handleStyleChange('shadow', e.target.value, 'containerStyles')}
                className="text-sm p-1 border rounded"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Submit Button</div>
            
            {/* Button Background */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-sm text-muted-foreground">Button Color:</label>
              <input 
                type="color" 
                value={styles.buttonStyles?.backgroundColor || '#3B82F6'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value, 'buttonStyles')}
                className="w-16 h-6"
              />
            </div>
            
            {/* Button Text Color */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-sm text-muted-foreground">Text Color:</label>
              <input 
                type="color" 
                value={styles.buttonStyles?.textColor || '#FFFFFF'}
                onChange={(e) => handleStyleChange('textColor', e.target.value, 'buttonStyles')}
                className="w-16 h-6"
              />
            </div>
            
            {/* Button Border Radius */}
            <div className="grid grid-cols-2 gap-2 items-center">
              <label className="text-sm text-muted-foreground">Button Radius:</label>
              <select 
                value={styles.buttonStyles?.borderRadius || 'md'}
                onChange={(e) => handleStyleChange('borderRadius', e.target.value, 'buttonStyles')}
                className="text-sm p-1 border rounded"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="full">Pill</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Default styles to use if none provided
const defaultStyles: FormStyles = {
  padding: 'medium',
  alignment: 'left',
  containerStyles: {
    backgroundColor: 'transparent',
    borderRadius: 'md',
    shadow: 'none'
  },
  buttonStyles: {
    backgroundColor: '#3B82F6',
    textColor: '#FFFFFF',
    borderRadius: 'md'
  }
}; 