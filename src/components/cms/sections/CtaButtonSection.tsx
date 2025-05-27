'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronDownIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import StableInput from './StableInput';
import ColorSelector from '@/components/cms/ColorSelector';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface DropdownLink {
  id: string;
  label: string;
  url: string;
}

interface CtaButtonSectionProps {
  buttonText?: string;
  buttonUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  dropdownLinks?: DropdownLink[];
  showDropdown?: boolean;
  isEditing?: boolean;
  onUpdate?: (data: Partial<CtaButtonSectionProps>) => void;
}

export default function CtaButtonSection({
  buttonText: initialButtonText = 'Get Started',
  buttonUrl: initialButtonUrl = '#',
  backgroundColor: initialBackgroundColor = '#3B82F6',
  textColor: initialTextColor = '#FFFFFF',
  borderRadius: initialBorderRadius = 8,
  dropdownLinks: initialDropdownLinks = [],
  showDropdown: initialShowDropdown = false,
  isEditing = false,
  onUpdate
}: CtaButtonSectionProps) {
  // Local state
  const [buttonText, setButtonText] = useState(initialButtonText);
  const [buttonUrl, setButtonUrl] = useState(initialButtonUrl);
  const [backgroundColor, setBackgroundColor] = useState(initialBackgroundColor);
  const [textColor, setTextColor] = useState(initialTextColor);
  const [borderRadius, setBorderRadius] = useState(initialBorderRadius);
  const [dropdownLinks, setDropdownLinks] = useState<DropdownLink[]>(initialDropdownLinks);
  const [showDropdown, setShowDropdown] = useState(initialShowDropdown);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (initialButtonText !== buttonText) setButtonText(initialButtonText);
      if (initialButtonUrl !== buttonUrl) setButtonUrl(initialButtonUrl);
      if (initialBackgroundColor !== backgroundColor) setBackgroundColor(initialBackgroundColor);
      if (initialTextColor !== textColor) setTextColor(initialTextColor);
      if (initialBorderRadius !== borderRadius) setBorderRadius(initialBorderRadius);
      if (JSON.stringify(initialDropdownLinks) !== JSON.stringify(dropdownLinks)) {
        setDropdownLinks(initialDropdownLinks);
      }
      if (initialShowDropdown !== showDropdown) setShowDropdown(initialShowDropdown);
    }
  }, [initialButtonText, initialButtonUrl, initialBackgroundColor, initialTextColor, 
      initialBorderRadius, initialDropdownLinks, initialShowDropdown,
      buttonText, buttonUrl, backgroundColor, textColor, borderRadius, dropdownLinks, showDropdown]);

  // Update handler with debouncing
  const handleUpdateField = useCallback((field: string, value: string | number | boolean | DropdownLink[]) => {
    if (onUpdate) {
      isEditingRef.current = true;
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(() => {
        const updateData: Partial<CtaButtonSectionProps> = {
          buttonText,
          buttonUrl,
          backgroundColor,
          textColor,
          borderRadius,
          dropdownLinks,
          showDropdown
        };
        
        // @ts-expect-error: Dynamic field assignment
        updateData[field] = value;
        
        onUpdate(updateData);
        
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 300);
    }
  }, [onUpdate, buttonText, buttonUrl, backgroundColor, textColor, borderRadius, dropdownLinks, showDropdown]);

  // Individual change handlers
  const handleButtonTextChange = useCallback((newValue: string) => {
    setButtonText(newValue);
    handleUpdateField('buttonText', newValue);
  }, [handleUpdateField]);

  const handleButtonUrlChange = useCallback((newValue: string) => {
    setButtonUrl(newValue);
    handleUpdateField('buttonUrl', newValue);
  }, [handleUpdateField]);

  const handleBackgroundColorChange = useCallback((color: string) => {
    setBackgroundColor(color);
    handleUpdateField('backgroundColor', color);
  }, [handleUpdateField]);

  const handleTextColorChange = useCallback((color: string) => {
    setTextColor(color);
    handleUpdateField('textColor', color);
  }, [handleUpdateField]);

  const handleBorderRadiusChange = useCallback((value: number) => {
    setBorderRadius(value);
    handleUpdateField('borderRadius', value);
  }, [handleUpdateField]);

  const handleShowDropdownChange = useCallback((checked: boolean) => {
    setShowDropdown(checked);
    handleUpdateField('showDropdown', checked);
  }, [handleUpdateField]);

  // Dropdown link handlers
  const addDropdownLink = useCallback(() => {
    const newLink: DropdownLink = {
      id: `link-${Date.now()}`,
      label: 'New Link',
      url: '#'
    };
    const updatedLinks = [...dropdownLinks, newLink];
    setDropdownLinks(updatedLinks);
    handleUpdateField('dropdownLinks', updatedLinks);
  }, [dropdownLinks, handleUpdateField]);

  const removeDropdownLink = useCallback((linkId: string) => {
    const updatedLinks = dropdownLinks.filter(link => link.id !== linkId);
    setDropdownLinks(updatedLinks);
    handleUpdateField('dropdownLinks', updatedLinks);
  }, [dropdownLinks, handleUpdateField]);

  const updateDropdownLink = useCallback((linkId: string, field: 'label' | 'url', value: string) => {
    const updatedLinks = dropdownLinks.map(link => 
      link.id === linkId ? { ...link, [field]: value } : link
    );
    setDropdownLinks(updatedLinks);
    handleUpdateField('dropdownLinks', updatedLinks);
  }, [dropdownLinks, handleUpdateField]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Render the CTA button
  const renderCtaButton = () => (
    <div className="relative inline-block">
      <div className="flex items-center">
        <Link
          href={buttonUrl}
          className="inline-flex items-center px-6 py-3 font-semibold transition-all duration-300 hover:opacity-90 hover:scale-105 shadow-lg hover:shadow-xl"
          style={{
            backgroundColor,
            color: textColor,
            borderRadius: `${borderRadius}px`
          }}
          data-field-type="buttonText"
          data-component-type="CtaButton"
        >
          {buttonText}
        </Link>
        
        {showDropdown && dropdownLinks.length > 0 && (
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="ml-2 p-2 rounded-full transition-all duration-300 hover:bg-gray-100"
            style={{
              backgroundColor: isDropdownOpen ? 'rgba(0,0,0,0.1)' : 'transparent'
            }}
          >
            <ChevronDownIcon 
              className={`h-5 w-5 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
              style={{ color: textColor }}
            />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showDropdown && isDropdownOpen && dropdownLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            <div className="py-2">
              {dropdownLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.url}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="w-full" data-section-id="cta-button">
      {isEditing ? (
        <Tabs defaultValue="content" className="space-y-4 w-full max-w-full overflow-x-hidden">
          <TabsList className="flex flex-wrap space-x-2 w-full">
            <TabsTrigger value="content" className="flex-1 min-w-[100px]">Content</TabsTrigger>
            <TabsTrigger value="styling" className="flex-1 min-w-[100px]">Styling</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 min-w-[100px]">Preview</TabsTrigger>
          </TabsList>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="space-y-4">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Button Content</h3>
                
                <StableInput
                  value={buttonText}
                  onChange={handleButtonTextChange}
                  placeholder="Button text..."
                  label="Button Text"
                  debounceTime={300}
                  data-field-id="buttonText"
                  data-component-type="CtaButton"
                />
                
                <StableInput
                  value={buttonUrl}
                  onChange={handleButtonUrlChange}
                  placeholder="Button URL..."
                  label="Button URL"
                  debounceTime={300}
                  data-field-id="buttonUrl"
                  data-component-type="CtaButton"
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="showDropdown"
                    checked={showDropdown}
                    onChange={(e) => handleShowDropdownChange(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showDropdown" className="text-sm font-medium text-gray-700">
                    Enable dropdown menu
                  </label>
                </div>

                {showDropdown && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">Dropdown Links</h4>
                      <button
                        onClick={addDropdownLink}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Link
                      </button>
                    </div>

                    <div className="space-y-3">
                      {dropdownLinks.map((link) => (
                        <div key={link.id} className="flex items-center gap-2 p-3 bg-white rounded border">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => updateDropdownLink(link.id, 'label', e.target.value)}
                              placeholder="Link label..."
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => updateDropdownLink(link.id, 'url', e.target.value)}
                              placeholder="Link URL..."
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <button
                            onClick={() => removeDropdownLink(link.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* STYLING TAB */}
          <TabsContent value="styling" className="space-y-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Colors</h3>
                  
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <ColorSelector
                      label="Background Color"
                      value={backgroundColor}
                      onChange={handleBackgroundColorChange}
                    />
                    
                    <ColorSelector
                      label="Text Color"
                      value={textColor}
                      onChange={handleTextColorChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shape</h3>
                  
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Border Radius: {borderRadius}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={borderRadius}
                        onChange={(e) => handleBorderRadiusChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0px (Square)</span>
                        <span>50px (Rounded)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                <span className="text-sm text-gray-500">This is how your CTA button will look</span>
              </div>
              <div className="border rounded-lg p-8 bg-gray-50 flex items-center justify-center">
                {renderCtaButton()}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex items-center justify-center py-8">
          {renderCtaButton()}
        </div>
      )}
    </div>
  );
} 