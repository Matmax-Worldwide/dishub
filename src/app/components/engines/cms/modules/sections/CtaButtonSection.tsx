'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronDownIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import StableInput from './StableInput';
import ColorSelector from '@/app/components/engines/cms/ui/selectors/ColorSelector';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";

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
        <div className="w-full bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3  to-gray-100/80 p-2 rounded-xl border border-gray-200/50 shadow-inner">
              <TabsTrigger 
                value="content" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
              >
                Content
              </TabsTrigger>
              <TabsTrigger 
                value="styling" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
              >
                Styling
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
              >
                Preview
              </TabsTrigger>
            </TabsList>

            {/* CONTENT TAB */}
            <TabsContent value="content" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Button Content Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Button Content</h3>
                </div>
                <div className="pl-6 space-y-4">
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
              </div>

              {/* Dropdown Configuration Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Dropdown Configuration</h3>
                </div>
                <div className="pl-6 space-y-4">
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
            <TabsContent value="styling" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Color Settings Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Color Settings</h3>
                </div>
                <div className="pl-6 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              </div>
              
              {/* Shape Settings Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Shape Settings</h3>
                </div>
                <div className="pl-6 space-y-4">
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
            </TabsContent>

            {/* PREVIEW TAB */}
            <TabsContent value="preview" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Live Preview Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                </div>
                <div className="pl-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">CTA Button Preview</h4>
                    <div className="text-sm text-gray-500">This is how your button will look</div>
                  </div>
                  <div className="border rounded-lg p-8 bg-gray-50 flex items-center justify-center">
                    {renderCtaButton()}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          {renderCtaButton()}
        </div>
      )}
    </div>
  );
} 