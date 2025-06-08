import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ColorSelectorProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
  '#800000', '#808080', '#008000', '#800080', '#008080', '#808000', '#C0C0C0', '#FFA500',
  '#FFC0CB', '#A52A2A', '#DDA0DD', '#98FB98', '#F0E68C', '#DEB887', '#5F9EA0', '#FF6347',
  '#40E0D0', '#EE82EE', '#90EE90', '#FFB6C1', '#FFA07A', '#20B2AA', '#87CEEB', '#778899',
  '#B0C4DE', '#FFFFE0', '#00FF7F', '#32CD32', '#FAF0E6', '#FF69B4', '#CD5C5C', '#4B0082',
  '#FFFAF0', '#F0FFFF', '#F5F5DC', '#FFE4E1', '#DCDCDC', '#FDF5E6', '#FF7F50', '#6495ED'
];

export default function ColorSelector({ value, onChange, label, className = '' }: ColorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleDropdown = useCallback(() => {
    setIsOpen(!isOpen);
    setShowCustomInput(false);
  }, [isOpen]);

  const handlePresetColorClick = useCallback((color: string) => {
    onChange(color);
    setCustomColor(color);
    setIsOpen(false);
    setShowCustomInput(false);
  }, [onChange]);

  const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      onChange(newColor);
    }
  }, [onChange]);

  const handleCustomColorSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (/^#[0-9A-F]{6}$/i.test(customColor)) {
      onChange(customColor);
      setIsOpen(false);
      setShowCustomInput(false);
    }
  }, [customColor, onChange]);

  const handleShowCustomInput = useCallback(() => {
    setShowCustomInput(true);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-sm font-medium block mb-2">{label}</label>
      )}
      
      {/* Color Selector Button */}
      <button
        type="button"
        onClick={handleToggleDropdown}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
            style={{ backgroundColor: value }}
          />
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-gray-700">Selected Color</span>
            <span className="text-xs text-gray-500 font-mono">{value.toUpperCase()}</span>
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Preset Colors Grid */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Choose a Color</div>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handlePresetColorClick(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 hover:shadow-md ${
                      value.toLowerCase() === color.toLowerCase() 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Custom Color Section */}
            <div className="border-t pt-3">
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={handleShowCustomInput}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-3 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Enter Custom Color
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">Custom Color</div>
                  <form onSubmit={handleCustomColorSubmit} className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={customColor}
                        onChange={handleCustomColorChange}
                        placeholder="#FF0000"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        pattern="^#[0-9A-Fa-f]{6}$"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!/^#[0-9A-F]{6}$/i.test(customColor)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Enter a hex color code (e.g., #FF0000 for red)
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 