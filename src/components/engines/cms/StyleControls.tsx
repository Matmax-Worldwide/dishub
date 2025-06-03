import React, { useCallback } from 'react';
import ColorSelector from './ui/selectors/ColorSelector';
import TransparencySelector from './ui/selectors/TransparencySelector';
import { 
  ComponentStyling, 
  DEFAULT_STYLING,
  PADDING_OPTIONS,
  MARGIN_OPTIONS,
  BORDER_RADIUS_OPTIONS,
  SHADOW_OPTIONS
} from '@/types/cms-styling';

interface StyleControlsProps {
  styling: ComponentStyling;
  onStylingChange: (styling: ComponentStyling) => void;
  showAdvanced?: boolean;
  className?: string;
}

export default function StyleControls({ 
  styling, 
  onStylingChange, 
  showAdvanced = true,
  className = '' 
}: StyleControlsProps) {
  
  const handleStyleChange = useCallback((field: keyof ComponentStyling, value: string | number | boolean) => {
    onStylingChange({
      ...styling,
      [field]: value
    });
  }, [styling, onStylingChange]);

  const handleBorderChange = useCallback((borderField: string, value: string | number) => {
    onStylingChange({
      ...styling,
      border: {
        ...styling.border,
        [borderField]: value
      }
    });
  }, [styling, onStylingChange]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Colors Section */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Colors & Transparency
        </h4>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Background Color */}
          <div className="space-y-2">
            <ColorSelector
              value={styling.backgroundColor || DEFAULT_STYLING.backgroundColor!}
              onChange={(color) => handleStyleChange('backgroundColor', color)}
              label="Background Color"
            />
            <TransparencySelector
              value={styling.backgroundTransparency || DEFAULT_STYLING.backgroundTransparency!}
              onChange={(transparency) => handleStyleChange('backgroundTransparency', transparency)}
              label="Background Transparency"
            />
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <ColorSelector
              value={styling.textColor || DEFAULT_STYLING.textColor!}
              onChange={(color) => handleStyleChange('textColor', color)}
              label="Text Color"
            />
            <TransparencySelector
              value={styling.textTransparency || DEFAULT_STYLING.textTransparency!}
              onChange={(transparency) => handleStyleChange('textTransparency', transparency)}
              label="Text Transparency"
            />
          </div>
        </div>
      </div>

      {/* Layout Section */}
      {showAdvanced && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Layout & Spacing
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Padding */}
            <div>
              <label className="text-sm font-medium block mb-2">Padding</label>
              <select
                value={styling.padding || DEFAULT_STYLING.padding}
                onChange={(e) => handleStyleChange('padding', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PADDING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Margin */}
            <div>
              <label className="text-sm font-medium block mb-2">Margin</label>
              <select
                value={styling.margin || DEFAULT_STYLING.margin}
                onChange={(e) => handleStyleChange('margin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MARGIN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Appearance Section */}
      {showAdvanced && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Appearance
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Border Radius */}
            <div>
              <label className="text-sm font-medium block mb-2">Border Radius</label>
              <select
                value={styling.borderRadius || DEFAULT_STYLING.borderRadius}
                onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BORDER_RADIUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Shadow */}
            <div>
              <label className="text-sm font-medium block mb-2">Shadow</label>
              <select
                value={styling.shadow || DEFAULT_STYLING.shadow}
                onChange={(e) => handleStyleChange('shadow', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SHADOW_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Border Section */}
      {showAdvanced && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Border
          </h4>
          
          <div className="space-y-3">
            {/* Border Width */}
            <div>
              <label className="text-sm font-medium block mb-2">Border Width (px)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={styling.border?.width || 0}
                onChange={(e) => handleBorderChange('width', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Border Color */}
            {(styling.border?.width || 0) > 0 && (
              <ColorSelector
                value={styling.border?.color || DEFAULT_STYLING.border!.color!}
                onChange={(color) => handleBorderChange('color', color)}
                label="Border Color"
              />
            )}

            {/* Border Style */}
            {(styling.border?.width || 0) > 0 && (
              <div>
                <label className="text-sm font-medium block mb-2">Border Style</label>
                <select
                  value={styling.border?.style || DEFAULT_STYLING.border!.style}
                  onChange={(e) => handleBorderChange('style', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom CSS Section */}
      {showAdvanced && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Custom CSS
          </h4>
          
          <div>
            <label className="text-sm font-medium block mb-2">Additional CSS</label>
            <textarea
              value={styling.customCss || ''}
              onChange={(e) => handleStyleChange('customCss', e.target.value)}
              placeholder="Enter custom CSS properties..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              Example: font-weight: bold; letter-spacing: 1px;
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 