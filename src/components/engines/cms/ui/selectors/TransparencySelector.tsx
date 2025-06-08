import React, { useState, useCallback, useEffect } from 'react';

interface TransparencySelectorProps {
  value: number;
  onChange: (transparency: number) => void;
  label?: string;
  className?: string;
  min?: number;
  max?: number;
}

export default function TransparencySelector({ 
  value, 
  onChange, 
  label = "Transparency", 
  className = '',
  min = 0,
  max = 100
}: TransparencySelectorProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Update input value when prop value changes (but not when input is focused)
  useEffect(() => {
    if (!isInputFocused) {
      setInputValue(value.toString());
    }
  }, [value, isInputFocused]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue);
    if (!isInputFocused) {
      setInputValue(newValue.toString());
    }
  }, [onChange, isInputFocused]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Only update if it's a valid number within range
    const numValue = parseInt(newValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  }, [onChange, min, max]);

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false);
    
    // Validate and correct the input value
    const numValue = parseInt(inputValue);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      // Reset to current valid value
      setInputValue(value.toString());
    } else {
      // Ensure the value is applied
      onChange(numValue);
      setInputValue(numValue.toString());
    }
  }, [inputValue, value, onChange, min, max]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }, []);

  // Generate preset transparency values
  const presetValues = [0, 10, 25, 50, 75, 90, 100];

  const handlePresetClick = useCallback((presetValue: number) => {
    onChange(presetValue);
    setInputValue(presetValue.toString());
  }, [onChange]);

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="text-sm font-medium block">{label}</label>
      )}
      
      {/* Current Value Display */}
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">Current Value</div>
          <div className="text-lg font-bold text-blue-600">{value}%</div>
        </div>
        <div 
          className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600"
          style={{ opacity: (100 - value) / 100 }}
        />
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600">Drag to adjust</div>
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${value}%, #E5E7EB ${value}%, #E5E7EB 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{min}%</span>
            <span>{max}%</span>
          </div>
        </div>
      </div>

      {/* Preset Values */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600">Quick Select</div>
        <div className="flex flex-wrap gap-2">
          {presetValues.map((presetValue) => (
            <button
              key={presetValue}
              onClick={() => handlePresetClick(presetValue)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                value === presetValue
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {presetValue}%
            </button>
          ))}
        </div>
      </div>

      {/* Manual Input */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600">Enter exact value</div>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`${min}-${max}`}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
              %
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Enter a value between {min} and {max}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
} 