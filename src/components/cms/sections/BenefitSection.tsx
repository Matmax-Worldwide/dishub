'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';
import IconSelector from '@/components/cms/IconSelector';
import * as LucideIcons from 'lucide-react';

interface BenefitSectionProps {
  title: string;
  description: string;
  iconType: string;
  accentColor: string;
  backgroundColor: string;
  showGrid: boolean;
  showDots: boolean;
  isEditing?: boolean;
  onUpdate?: (data: Partial<BenefitSectionProps>) => void;
}

// Enhanced icon mapping function to support all Lucide icons
const getIconByType = (iconType: string, color: string) => {
  const iconClassName = `h-16 w-16 text-[${color}]`;
  
  // Check if the icon exists in LucideIcons
  const IconComponent = LucideIcons[iconType as keyof typeof LucideIcons] as React.ElementType;
  
  if (IconComponent) {
    return <IconComponent className={iconClassName} />;
  }
  
  // Fallback to CheckBadgeIcon if the iconType is not valid
  return <LucideIcons.CheckCircle className={iconClassName} />;
};

const BenefitSection = React.memo(function BenefitSection({
  title,
  description,
  iconType = 'CheckCircle',
  accentColor = '#01319c',
  backgroundColor = 'from-[#ffffff] to-[#f0f9ff]',
  showGrid = true,
  showDots = true,
  isEditing = false,
  onUpdate
}: BenefitSectionProps) {
  // Local state for CMS editing
  const [localTitle, setLocalTitle] = useState(title);
  const [localDescription, setLocalDescription] = useState(description);
  const [localIconType, setLocalIconType] = useState(iconType);
  const [localAccentColor, setLocalAccentColor] = useState(accentColor);
  const [localBackgroundColor, setLocalBackgroundColor] = useState(backgroundColor);
  const [localShowGrid, setLocalShowGrid] = useState(showGrid);
  const [localShowDots, setLocalShowDots] = useState(showDots);
  const [isHovered, setIsHovered] = useState(false);

  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);

  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title);
      if (description !== localDescription) setLocalDescription(description);
      if (iconType !== localIconType) setLocalIconType(iconType);
      if (accentColor !== localAccentColor) setLocalAccentColor(accentColor);
      if (backgroundColor !== localBackgroundColor) setLocalBackgroundColor(backgroundColor);
      if (showGrid !== localShowGrid) setLocalShowGrid(showGrid);
      if (showDots !== localShowDots) setLocalShowDots(showDots);
    }
  }, [title, description, iconType, accentColor, backgroundColor, showGrid, showDots,
      localTitle, localDescription, localIconType, localAccentColor, localBackgroundColor, localShowGrid, localShowDots]);

  // Optimized update function with debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleUpdateField = useCallback((field: string, value: string | boolean) => {
    if (onUpdate) {
      // Mark that we're in editing mode to prevent useEffect override
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Set timeout to update parent
      debounceRef.current = setTimeout(() => {
        const updateData: Partial<BenefitSectionProps> = {};
        
        // @ts-expect-error: Dynamic field assignment
        updateData[field] = value;
        
        onUpdate(updateData);
        
        // Reset editing flag after a short delay to prevent immediate override
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 200);
    }
  }, [onUpdate]);

  // Individual change handlers
  const handleTitleChange = useCallback((newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);

  const handleDescriptionChange = useCallback((newValue: string) => {
    setLocalDescription(newValue);
    handleUpdateField('description', newValue);
  }, [handleUpdateField]);

  const handleIconTypeChange = useCallback((newValue: string) => {
    console.log(`Changing icon type from '${localIconType}' to '${newValue}'`);
    setLocalIconType(newValue);
    // Use a small delay to ensure the UI updates before notifying parent
    setTimeout(() => {
      handleUpdateField('iconType', newValue);
    }, 50);
  }, [handleUpdateField, localIconType]);

  const handleAccentColorChange = useCallback((newValue: string) => {
    // Ensure we have a valid color format
    let color = newValue;
    if (!color.startsWith('#') && !/^rgb/.test(color)) {
      color = `#${color}`;
    }
    
    console.log(`Changing accent color from '${localAccentColor}' to '${color}'`);
    setLocalAccentColor(color);
    
    // Use a small delay to ensure the UI updates before notifying parent
    setTimeout(() => {
      handleUpdateField('accentColor', color);
    }, 50);
  }, [handleUpdateField, localAccentColor]);

  const handleBackgroundColorChange = useCallback((newValue: string) => {
    console.log(`Changing background color from '${localBackgroundColor}' to '${newValue}'`);
    setLocalBackgroundColor(newValue);
    
    // Use a small delay to ensure the UI updates before notifying parent
    setTimeout(() => {
      handleUpdateField('backgroundColor', newValue);
    }, 50);
  }, [handleUpdateField, localBackgroundColor]);
  
  const handleShowGridChange = useCallback((newValue: boolean) => {
    console.log(`Changing showGrid from '${localShowGrid}' to '${newValue}'`);
    setLocalShowGrid(newValue);
    
    // Use a small delay to ensure the UI updates before notifying parent
    setTimeout(() => {
      handleUpdateField('showGrid', newValue);
    }, 50);
  }, [handleUpdateField, localShowGrid]);
  
  const handleShowDotsChange = useCallback((newValue: boolean) => {
    console.log(`Changing showDots from '${localShowDots}' to '${newValue}'`);
    setLocalShowDots(newValue);
    
    // Use a small delay to ensure the UI updates before notifying parent
    setTimeout(() => {
      handleUpdateField('showDots', newValue);
    }, 50);
  }, [handleUpdateField, localShowDots]);
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Icon background color calculation (20% opacity of accent color)
  const iconBg = `bg-[${localAccentColor}]/20`;

  return (
    <section 
      className={cn(
        "relative overflow-hidden flex flex-col justify-center w-full benefit-section",
        isEditing ? "min-h-[400px] h-auto py-12" : ""
      )}
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* Fondo principal */}
      <div className={`absolute inset-0 bg-gradient-to-br ${localBackgroundColor} opacity-95 z-0`}></div>
      
      {/* Grilla background si está activada */}
      {localShowGrid && !isEditing && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-0 right-0 h-[1px] top-1/4" style={{ backgroundColor: localAccentColor }}></div>
          <div className="absolute left-0 right-0 h-[1px] top-2/4" style={{ backgroundColor: localAccentColor }}></div>
          <div className="absolute left-0 right-0 h-[1px] top-3/4" style={{ backgroundColor: localAccentColor }}></div>
          <div className="absolute top-0 bottom-0 w-[1px] left-1/4" style={{ backgroundColor: localAccentColor }}></div>
          <div className="absolute top-0 bottom-0 w-[1px] left-2/4" style={{ backgroundColor: localAccentColor }}></div>
          <div className="absolute top-0 bottom-0 w-[1px] left-3/4" style={{ backgroundColor: localAccentColor }}></div>
        </div>
      )}
      
      {/* Elementos decorativos tecnológicos */}
      {localShowDots && !isEditing && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Círculos tecnológicos */}
          <motion.div 
            className="absolute top-20 left-10 w-48 h-48 rounded-full border"
            style={{ borderColor: `${localAccentColor}30` }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div 
            className="absolute bottom-20 right-10 w-64 h-64 rounded-full border"
            style={{ borderColor: `${localAccentColor}20` }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Partículas */}
          <motion.div 
            className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full"
            style={{ backgroundColor: localAccentColor }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div 
            className="absolute top-2/3 left-1/3 w-3 h-3 rounded-full"
            style={{ backgroundColor: localAccentColor }}
            animate={{
              y: [0, 30, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div 
            className="absolute top-1/2 right-1/3 w-1 h-1 rounded-full"
            style={{ backgroundColor: localAccentColor }}
            animate={{
              x: [0, -15, 0],
              y: [0, 15, 0],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      )}
      
      {isEditing ? (
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">Icon Type</label>
              <div className="flex flex-col space-y-1">
                <IconSelector 
                  selectedIcon={localIconType}
                  onSelectIcon={handleIconTypeChange}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">Select any icon from the available Lucide icons library</p>
              </div>
            </div>
            
            <StableInput
              value={localTitle}
              onChange={handleTitleChange}
              placeholder="Benefit title..."
              className="text-foreground font-bold text-xl"
              label="Title"
              debounceTime={300}
            />
            
            <StableInput
              value={localDescription}
              onChange={handleDescriptionChange}
              placeholder="Benefit description..."
              className="text-muted-foreground"
              multiline={true}
              label="Description"
              debounceTime={300}
            />
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">Accent Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={localAccentColor}
                  onChange={(e) => handleAccentColorChange(e.target.value)}
                  className="h-10 w-10 rounded"
                  id="accent-color-picker"
                />
                <input
                  type="text"
                  value={localAccentColor}
                  onChange={(e) => handleAccentColorChange(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  placeholder="#01319c"
                  aria-labelledby="accent-color-picker"
                />
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-700">Background Gradient</label>
              <input
                type="text"
                value={localBackgroundColor}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                placeholder="from-[#ffffff] to-[#f0f9ff]"
              />
              <p className="text-xs text-gray-500">Format: from-[#color1] to-[#color2]</p>
            </div>
            
            {/* Toggle options */}
            <div className="flex flex-col space-y-4 mt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showGrid"
                  checked={localShowGrid}
                  onChange={(e) => handleShowGridChange(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary rounded"
                />
                <label htmlFor="showGrid" className="text-sm font-medium text-gray-700">
                  Show background grid
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showDots"
                  checked={localShowDots}
                  onChange={(e) => handleShowDotsChange(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary rounded"
                />
                <label htmlFor="showDots" className="text-sm font-medium text-gray-700">
                  Show animated particles and dots
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col justify-center">
          <div className="flex flex-col items-center justify-center text-center px-4 py-8 md:py-12">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className={`mb-8 p-6 ${iconBg} rounded-full backdrop-blur-sm border`}
              style={{ borderColor: `${localAccentColor}50` }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <motion.div
                animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.3 }}
              >
                {getIconByType(localIconType, localAccentColor)}
              </motion.div>
            </motion.div>
            
            <motion.h3
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-6 text-center"
              style={{ color: localAccentColor }}
            >
              {localTitle}
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl md:text-2xl text-center max-w-3xl text-gray-700"
            >
              {localDescription}
            </motion.p>
            
            <motion.div
              className="mt-16"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg 
                className="w-10 h-10 mx-auto" 
                style={{ color: `${localAccentColor}70` }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );
});

export default BenefitSection; 