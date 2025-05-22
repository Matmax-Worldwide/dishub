'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';
import IconSelector from '@/components/cms/IconSelector';
import BackgroundSelector, { BACKGROUND_TEMPLATES } from '@/components/cms/BackgroundSelector';
import MediaSelector from '@/components/cms/MediaSelector';
import { MediaItem } from '@/components/cms/media/types';
import * as LucideIcons from 'lucide-react';

interface BenefitSectionProps {
  title: string;
  description: string;
  iconType: string;
  accentColor: string;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundType?: 'image' | 'gradient';
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

// Tab component for the editing interface
const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
      active
        ? "bg-white text-blue-600 border-t border-l border-r border-gray-200"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
    )}
  >
    {children}
  </button>
);

const BenefitSection = React.memo(function BenefitSection({
  title,
  description,
  iconType = 'CheckCircle',
  accentColor = '#01319c',
  backgroundColor = 'from-[#ffffff] to-[#f0f9ff]',
  backgroundImage = '',
  backgroundType = 'gradient',
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
  const [localBackgroundImage, setLocalBackgroundImage] = useState(backgroundImage);
  const [localBackgroundType, setLocalBackgroundType] = useState(backgroundType);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [localShowGrid, setLocalShowGrid] = useState(showGrid);
  const [localShowDots, setLocalShowDots] = useState(showDots);
  const [isHovered, setIsHovered] = useState(false);
  const [showMediaSelectorForBackground, setShowMediaSelectorForBackground] = useState(false);
  
  // Tab state for editing mode
  const [activeTab, setActiveTab] = useState<'content' | 'styles' | 'preview'>('content');

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
      if (backgroundImage !== localBackgroundImage) setLocalBackgroundImage(backgroundImage);
      if (backgroundType !== localBackgroundType) setLocalBackgroundType(backgroundType);
      if (showGrid !== localShowGrid) setLocalShowGrid(showGrid);
      if (showDots !== localShowDots) setLocalShowDots(showDots);
    }
  }, [title, description, iconType, accentColor, backgroundColor, backgroundImage, backgroundType, showGrid, showDots,
      localTitle, localDescription, localIconType, localAccentColor, localBackgroundColor, localBackgroundImage, localBackgroundType, localShowGrid, localShowDots]);

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
  
  // Handle background selection with immediate local update and debounced parent update
  const handleBackgroundSelect = useCallback((background: string, type: 'image' | 'gradient') => {
    console.log('Background selected:', { background, type });
    
    // Immediately update local state for responsive UI
    setLocalBackgroundImage(background);
    setLocalBackgroundType(type);
    setShowBackgroundSelector(false); // Close the selector immediately
    
    // Update parent component data with both fields
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Set up a debounced update with both background properties
      debounceRef.current = setTimeout(() => {
        console.log('Updating parent with background data:', { backgroundImage: background, backgroundType: type });
        
        onUpdate({
          title: localTitle,
          description: localDescription,
          iconType: localIconType,
          accentColor: localAccentColor,
          backgroundColor: localBackgroundColor,
          backgroundImage: background,
          backgroundType: type,
          showGrid: localShowGrid,
          showDots: localShowDots
        });
        
        // Reset editing flag after update
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 300); // Shorter debounce for background changes
    }
  }, [onUpdate, localTitle, localDescription, localIconType, localAccentColor, 
      localBackgroundColor, localShowGrid, localShowDots]);

  // Handler for background media selection
  const handleBackgroundMediaSelect = (mediaItem: MediaItem) => {
    setLocalBackgroundImage(mediaItem.fileUrl);
    setLocalBackgroundType('image');
    setShowMediaSelectorForBackground(false);
    setShowBackgroundSelector(false);
    
    // Update parent with the new background
    if (onUpdate) {
      onUpdate({
        title: localTitle,
        description: localDescription,
        iconType: localIconType,
        accentColor: localAccentColor,
        backgroundColor: localBackgroundColor,
        backgroundImage: mediaItem.fileUrl,
        backgroundType: 'image',
        showGrid: localShowGrid,
        showDots: localShowDots
      });
    }
  };
  
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

  // Content Tab Component
  const ContentTab = () => (
    <div className="space-y-6">
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
        data-field-id="title"
        data-component-type="Benefit"
      />
      
      <StableInput
        value={localDescription}
        onChange={handleDescriptionChange}
        placeholder="Benefit description..."
        className="text-muted-foreground"
        multiline={true}
        label="Description"
        debounceTime={300}
        data-field-id="description"
        data-component-type="Benefit"
      />
    </div>
  );

  // Styles Tab Component
  const StylesTab = () => (
    <div className="space-y-6">
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
        <label className="text-sm font-medium text-gray-700">Background</label>
        <div 
          className="h-32 mb-3 rounded-md border border-gray-200 overflow-hidden relative"
          style={{
            ...(localBackgroundType === 'image' && localBackgroundImage ? {
              backgroundImage: `url(${localBackgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            } : {
              background: localBackgroundImage || localBackgroundColor || BACKGROUND_TEMPLATES[0].value
            })
          }}
        >
          {(!localBackgroundImage && !localBackgroundColor) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
              No background selected
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={() => setShowBackgroundSelector(true)}
          className="bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
        >
          Select Background
        </button>
        
        <div className="mt-3">
          <label className="text-sm font-medium text-gray-700">Tailwind Gradient (Optional)</label>
          <input
            type="text"
            value={localBackgroundColor}
            onChange={(e) => handleBackgroundColorChange(e.target.value)}
            className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            placeholder="from-[#ffffff] to-[#f0f9ff]"
          />
          <p className="text-xs text-gray-500">Format: from-[#color1] to-[#color2]</p>
        </div>
      </div>
      
      {/* Toggle options */}
      <div className="flex flex-col space-y-4">
        <h4 className="text-sm font-medium text-gray-700">Visual Effects</h4>
        
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
  );

  // Preview Component (shows the actual rendered section)
  const PreviewTab = () => (
    <div 
      className="relative rounded-lg overflow-hidden" 
      style={{ 
        minHeight: '400px',
        ...(localBackgroundType === 'image' && localBackgroundImage ? {
          backgroundImage: `url(${localBackgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        } : {})
      }}
    >
      <div className="max-w-4xl mx-auto px-4 py-8 relative flex flex-col justify-center h-full">
        {/* Main background - only show if not using image background */}
        {!(localBackgroundType === 'image' && localBackgroundImage) && (
          <div className={`absolute inset-0 bg-gradient-to-br ${localBackgroundColor} opacity-95 rounded-lg`}></div>
        )}
        
        {/* Grid background if enabled */}
        {localShowGrid && (
          <div className="absolute inset-0 opacity-20 rounded-lg">
            <div className="absolute left-0 right-0 h-[1px] top-1/4" style={{ backgroundColor: localAccentColor }}></div>
            <div className="absolute left-0 right-0 h-[1px] top-2/4" style={{ backgroundColor: localAccentColor }}></div>
            <div className="absolute left-0 right-0 h-[1px] top-3/4" style={{ backgroundColor: localAccentColor }}></div>
            <div className="absolute top-0 bottom-0 w-[1px] left-1/4" style={{ backgroundColor: localAccentColor }}></div>
            <div className="absolute top-0 bottom-0 w-[1px] left-2/4" style={{ backgroundColor: localAccentColor }}></div>
            <div className="absolute top-0 bottom-0 w-[1px] left-3/4" style={{ backgroundColor: localAccentColor }}></div>
          </div>
        )}
        
        {/* Decorative tech elements */}
        {localShowDots && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            {/* Tech circles */}
            <motion.div 
              className="absolute top-10 left-5 w-24 h-24 rounded-full border"
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
              className="absolute bottom-10 right-5 w-32 h-32 rounded-full border"
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
            
            {/* Particles */}
            <motion.div 
              className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full"
              style={{ backgroundColor: localAccentColor }}
              animate={{
                y: [0, -10, 0],
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
                y: [0, 15, 0],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        )}
        
        <div className="flex flex-col items-center justify-center text-center relative z-10">
          <div
            className={`mb-6 p-4 ${iconBg} rounded-full backdrop-blur-sm border`}
            style={{ borderColor: `${localAccentColor}50` }}
          >
            <motion.div
              animate={{ scale: isHovered ? 1.1 : 1, rotate: isHovered ? 5 : 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="h-12 w-12" style={{ color: localAccentColor }}>
                {getIconByType(localIconType, localAccentColor)}
              </div>
            </motion.div>
          </div>
          
          <h3
            className="text-2xl md:text-3xl font-bold mb-4 text-center"
            style={{ color: localAccentColor }}
          >
            {localTitle}
          </h3>
          
          <p
            className="text-lg text-center max-w-2xl text-gray-700"
          >
            {localDescription}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {showBackgroundSelector && (
        <BackgroundSelector
          isOpen={showBackgroundSelector}
          onClose={() => setShowBackgroundSelector(false)}
          onSelect={handleBackgroundSelect}
          currentBackground={localBackgroundImage || localBackgroundColor}
          onOpenMediaSelector={() => {
            setShowBackgroundSelector(false);
            setShowMediaSelectorForBackground(true);
          }}
        />
      )}

      {showMediaSelectorForBackground && (
        <MediaSelector
          isOpen={showMediaSelectorForBackground}
          onClose={() => setShowMediaSelectorForBackground(false)}
          onSelect={handleBackgroundMediaSelect}
          title="Select Background Image"
          initialType="image"
        />
      )}
      
      <section 
        className={cn(
          "relative overflow-hidden flex flex-col justify-center w-full benefit-section min-h-screen",
          isEditing ? "min-h-[400px] h-auto py-12" : ""
        )}
        style={{
          ...(localBackgroundType === 'image' && localBackgroundImage ? {
            backgroundImage: `url(${localBackgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : {}),
          isolation: 'isolate' // Create new stacking context
        }}
      >
      {/* Main background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${localBackgroundColor} opacity-95`} style={{ zIndex: 0 }}></div>
      
      {/* Grid background if enabled */}
      {localShowGrid && !isEditing && (
        <div className="absolute inset-0 opacity-20" style={{ zIndex: 1 }}>
          <div className="absolute left-0 right-0 h-[1px] top-1/4" style={{ backgroundColor: localAccentColor }}></div>
          <div className="absolute left-0 right-0 h-[1px] top-2/4" style={{ backgroundColor: localAccentColor }}></div>
          <div className="absolute left-0 right-0 h-[1px] top-3/4" style={{ backgroundColor: localAccentColor }}></div>
          <div className="absolute top-0 bottom-0 w-[1px] left-1/4" style={{ backgroundColor: localAccentColor }}></div>
          <div className="absolute top-0 bottom-0 w-[1px] left-2/4" style={{ backgroundColor: localAccentColor }}></div>
          <div className="absolute top-0 bottom-0 w-[1px] left-3/4" style={{ backgroundColor: localAccentColor }}></div>
        </div>
      )}
      
      {/* Decorative tech elements */}
      {localShowDots && !isEditing && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
          {/* Tech circles */}
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
          
          {/* Particles */}
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
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 border-b border-gray-200">
            <TabButton
              active={activeTab === 'content'}
              onClick={() => setActiveTab('content')}
            >
              <LucideIcons.FileText className="w-4 h-4 inline mr-2" />
              Content
            </TabButton>
            <TabButton
              active={activeTab === 'styles'}
              onClick={() => setActiveTab('styles')}
            >
              <LucideIcons.Palette className="w-4 h-4 inline mr-2" />
              Styles
            </TabButton>
            <TabButton
              active={activeTab === 'preview'}
              onClick={() => setActiveTab('preview')}
            >
              <LucideIcons.Eye className="w-4 h-4 inline mr-2" />
              Preview
            </TabButton>
          </div>
          
          {/* Tab Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[500px]">
            {activeTab === 'content' && <ContentTab />}
            {activeTab === 'styles' && <StylesTab />}
            {activeTab === 'preview' && <PreviewTab />}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex flex-col justify-center h-full" style={{ zIndex: 5 }}>
          <div className="flex flex-col items-center justify-center text-center px-4 py-8 md:py-12">
            <div
              className={`mb-8 p-6 ${iconBg} rounded-full backdrop-blur-sm border icon-container`}
              style={{ borderColor: `${localAccentColor}50`, position: 'relative', zIndex: 10 }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              data-field-type="iconType"
              data-component-type="Benefit"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: isHovered ? 1.1 : 1, rotate: isHovered ? 5 : 0 }}
                transition={{ duration: 0.7 }}
              >
                {getIconByType(localIconType, localAccentColor)}
              </motion.div>
            </div>
            
            <motion.h3
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold mb-6 text-center benefit-title"
              style={{ color: localAccentColor, position: 'relative', zIndex: 5 }}
              data-field-type="title"
              data-component-type="Benefit"
            >
              {localTitle}
            </motion.h3>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl md:text-2xl text-center max-w-3xl text-gray-700 benefit-description"
              style={{ position: 'relative', zIndex: 5 }}
              data-field-type="description"
              data-component-type="Benefit"
            >
              {localDescription}
            </motion.p>
            
            <motion.div
              className="mt-16"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ position: 'relative', zIndex: 5 }}
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
    </>
  );
});

export default BenefitSection;