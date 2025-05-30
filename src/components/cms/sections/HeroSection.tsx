'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import StableInput from './StableInput';
import { cn } from '@/lib/utils';
import BackgroundSelector, { BACKGROUND_TEMPLATES } from '@/components/cms/BackgroundSelector';
import MediaSelector from '@/components/cms/MediaSelector';
import { CmsTabs } from '@/components/cms/CmsTabs';
import { FileText, Palette, LayoutTemplate, Upload, Eye } from 'lucide-react';
import { MediaItem } from '@/components/cms/media/types';
import { 
  ComponentStyling, 
  ComponentStyleProps, 
  DEFAULT_STYLING,
  generateStylesFromStyling
} from '@/types/cms-styling';

interface HeroSectionProps extends ComponentStyleProps {
  title: string;
  subtitle: string;
  image?: string;
  backgroundImage?: string;
  backgroundType?: 'image' | 'gradient';
  cta?: {
    text: string;
    url: string;
  };
  secondaryCta?: {
    text: string;
    url: string;
  };
  badgeText?: string;
  showAnimatedDots?: boolean;
  showIcon?: boolean;
  styling?: ComponentStyling;
  designTemplate?: 'modern' | 'elegant' | 'futuristic' | 'minimal' | 'corporate' | 'gradient' | 'glassmorphism' | 'neon' | 'retro';
  padding?: 'none' | 'small' | 'medium' | 'large' | 'extra-large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'extra-large';
  shadowSize?: 'none' | 'small' | 'medium' | 'large' | 'extra-large';
  isEditing?: boolean;
  onUpdate?: (data: Partial<HeroSectionProps>) => void;
}

function InterpretationSVG(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="95" stroke="#3B82F6" strokeWidth="5" fill="#F9FAFB" />

      {/* Headset */}
      <path
        d="M50 80 C50 50, 150 50, 150 80 M50 120 C50 150, 150 150, 150 120"
        stroke="#3B82F6"
        strokeWidth="4"
        fill="none"
      />
      <circle cx="45" cy="100" r="5" fill="#3B82F6" />
      <circle cx="155" cy="100" r="5" fill="#3B82F6" />
      <path
        d="M70 140 L70 160 Q100 170, 130 160 L130 140"
        stroke="#3B82F6"
        strokeWidth="4"
        fill="none"
      />

      {/* Chat bubbles */}
      <rect x="60" y="40" width="40" height="20" rx="5" ry="5" fill="#8B5CF6" />
      <rect x="100" y="50" width="40" height="20" rx="5" ry="5" fill="#3B82F6" />

      {/* Tiny text indicators */}
      <circle cx="70" cy="50" r="2" fill="#F9FAFB" />
      <circle cx="80" cy="50" r="2" fill="#F9FAFB" />
      <circle cx="90" cy="50" r="2" fill="#F9FAFB" />

      <circle cx="110" cy="60" r="2" fill="#F9FAFB" />
      <circle cx="120" cy="60" r="2" fill="#F9FAFB" />
      <circle cx="130" cy="60" r="2" fill="#F9FAFB" />
    </svg>
  );
}

const HeroSection = React.memo(function HeroSection({ 
  title, 
  subtitle, 
  image,
  backgroundImage,
  backgroundType = 'gradient',
  cta,
  secondaryCta,
  badgeText,
  showAnimatedDots = true,
  showIcon = true,
  styling = DEFAULT_STYLING,
  designTemplate,
  padding,
  borderRadius,
  shadowSize,
  isEditing = false,
  onUpdate
}: HeroSectionProps) {
  // Local state for CMS editing
  const [localTitle, setLocalTitle] = useState(title);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle);
  const [localImage, setLocalImage] = useState(image || '');
  const [localBackgroundImage, setLocalBackgroundImage] = useState(backgroundImage || '');
  const [localBackgroundType, setLocalBackgroundType] = useState(backgroundType);
  const [localStyling, setLocalStyling] = useState<ComponentStyling>(styling);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [localCta, setLocalCta] = useState(cta || { text: '', url: '' });
  const [localSecondaryCta, setLocalSecondaryCta] = useState(secondaryCta || { text: '', url: '' });
  const [localBadgeText, setLocalBadgeText] = useState(badgeText || '');
  const [localShowAnimatedDots, setLocalShowAnimatedDots] = useState(showAnimatedDots);
  const [localShowIcon, setLocalShowIcon] = useState(showIcon);
  const [isHovered, setIsHovered] = useState(false);
  const [showMediaSelectorForBackground, setShowMediaSelectorForBackground] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  
  // Add design template and layout state
  const [localDesignTemplate, setLocalDesignTemplate] = useState(designTemplate || 'modern');
  const [localPadding, setLocalPadding] = useState(padding || 'medium');
  const [localBorderRadius, setLocalBorderRadius] = useState(borderRadius || 'medium');
  const [localShadowSize, setLocalShadowSize] = useState(shadowSize || 'none');
  
  // Add state for tracking design changes
  const [isDesignChanging, setIsDesignChanging] = useState(false);
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);

  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title);
      if (subtitle !== localSubtitle) setLocalSubtitle(subtitle);
      if ((image || '') !== localImage) setLocalImage(image || '');
      if ((backgroundImage || '') !== localBackgroundImage) setLocalBackgroundImage(backgroundImage || '');
      if (backgroundType !== localBackgroundType) setLocalBackgroundType(backgroundType);
      if (badgeText !== localBadgeText) setLocalBadgeText(badgeText || '');
      if (showAnimatedDots !== localShowAnimatedDots) setLocalShowAnimatedDots(showAnimatedDots);
      if (showIcon !== localShowIcon) setLocalShowIcon(showIcon);
      if (styling && JSON.stringify(styling) !== JSON.stringify(localStyling)) {
        setLocalStyling(styling);
      }
      
      if (cta && JSON.stringify(cta) !== JSON.stringify(localCta)) {
        setLocalCta(cta || { text: '', url: '' });
      }
      
      if (secondaryCta && JSON.stringify(secondaryCta) !== JSON.stringify(localSecondaryCta)) {
        setLocalSecondaryCta(secondaryCta || { text: '', url: '' });
      }
    }
  }, [title, subtitle, image, backgroundImage, backgroundType, cta, secondaryCta, badgeText, showAnimatedDots, showIcon, styling,
      localTitle, localSubtitle, localImage, localBackgroundImage, localBackgroundType, localCta, localSecondaryCta, localBadgeText, 
      localShowAnimatedDots, localShowIcon, localStyling]);

  // Optimized update function with debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleUpdateField = useCallback((field: string, value: string | boolean | ComponentStyling) => {
    if (onUpdate) {
      // Mark that we're in editing mode to prevent useEffect override
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Set timeout to update parent
      debounceRef.current = setTimeout(() => {
        const updateData: Partial<HeroSectionProps> = {};
        
        // Handle nested fields like 'cta.text'
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          if (parent === 'cta') {
            updateData.cta = {
              ...(cta || { text: '', url: '' }),
              [child]: value
            };
          } else if (parent === 'secondaryCta') {
            updateData.secondaryCta = {
              ...(secondaryCta || { text: '', url: '' }),
              [child]: value
            };
          }
        } else {
          // @ts-expect-error: Dynamic field assignment
          updateData[field] = value;
        }
        
        onUpdate(updateData);
        
        // Reset editing flag after a short delay to prevent immediate override
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 200);
    }
  }, [onUpdate, cta, secondaryCta]);

  // Individual change handlers
  const handleTitleChange = useCallback((newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);

  const handleSubtitleChange = useCallback((newValue: string) => {
    setLocalSubtitle(newValue);
    handleUpdateField('subtitle', newValue);
  }, [handleUpdateField]);

  const handleImageChange = useCallback((newValue: string) => {
    setLocalImage(newValue);
    handleUpdateField('image', newValue);
  }, [handleUpdateField]);

  const handleBadgeTextChange = useCallback((newValue: string) => {
    setLocalBadgeText(newValue);
    handleUpdateField('badgeText', newValue);
  }, [handleUpdateField]);

  const handleCtaTextChange = useCallback((newValue: string) => {
    setLocalCta(prev => ({ ...prev, text: newValue }));
    handleUpdateField('cta.text', newValue);
  }, [handleUpdateField]);

  const handleCtaUrlChange = useCallback((newValue: string) => {
    setLocalCta(prev => ({ ...prev, url: newValue }));
    handleUpdateField('cta.url', newValue);
  }, [handleUpdateField]);
  
  const handleSecondaryCtaTextChange = useCallback((newValue: string) => {
    setLocalSecondaryCta(prev => ({ ...prev, text: newValue }));
    handleUpdateField('secondaryCta.text', newValue);
  }, [handleUpdateField]);

  const handleSecondaryCtaUrlChange = useCallback((newValue: string) => {
    setLocalSecondaryCta(prev => ({ ...prev, url: newValue }));
    handleUpdateField('secondaryCta.url', newValue);
  }, [handleUpdateField]);
  
  const handleShowAnimatedDotsChange = useCallback((newValue: boolean) => {
    setLocalShowAnimatedDots(newValue);
    handleUpdateField('showAnimatedDots', newValue);
  }, [handleUpdateField]);
  
  const handleShowIconChange = useCallback((newValue: boolean) => {
    setLocalShowIcon(newValue);
    handleUpdateField('showIcon', newValue);
  }, [handleUpdateField]);
  
  // Add design template handlers
  const handleDesignTemplateChange = useCallback((template: string) => {
    try {
      setIsDesignChanging(true);
      setLocalDesignTemplate(template as typeof localDesignTemplate);
      
      // Update with design template and all layout properties to ensure proper saving
      if (onUpdate) {
        onUpdate({
          designTemplate: template as typeof localDesignTemplate,
          padding: localPadding,
          borderRadius: localBorderRadius,
          shadowSize: localShadowSize
        });
      }
      
      // Reset the changing state after a brief delay
      setTimeout(() => setIsDesignChanging(false), 300);
    } catch (error) {
      console.error('Error changing design template:', error);
      setIsDesignChanging(false);
    }
  }, [onUpdate, localPadding, localBorderRadius, localShadowSize]);

  const handlePaddingChange = useCallback((value: string) => {
    setLocalPadding(value as typeof localPadding);
    
    // Update with all layout properties to ensure proper saving
    if (onUpdate) {
      onUpdate({
        padding: value as typeof localPadding,
        borderRadius: localBorderRadius,
        shadowSize: localShadowSize
      });
    }
  }, [handleUpdateField, localBorderRadius, localShadowSize]);

  const handleBorderRadiusChange = useCallback((value: string) => {
    setLocalBorderRadius(value as typeof localBorderRadius);
    
    // Update with all layout properties to ensure proper saving
    if (onUpdate) {
      onUpdate({
        padding: localPadding,
        borderRadius: value as typeof localBorderRadius,
        shadowSize: localShadowSize
      });
    }
  }, [handleUpdateField, localPadding, localShadowSize]);

  const handleShadowSizeChange = useCallback((value: string) => {
    setLocalShadowSize(value as typeof localShadowSize);
    
    // Update with all layout properties to ensure proper saving
    if (onUpdate) {
      onUpdate({
        padding: localPadding,
        borderRadius: localBorderRadius,
        shadowSize: value as typeof localShadowSize
      });
    }
  }, [handleUpdateField, localPadding, localBorderRadius]);

  // Utility functions for styling
  const getDesignTemplateStyles = useCallback(() => {
    const baseStyles: React.CSSProperties = {};
    
    console.log('Applying design template:', localDesignTemplate);
    
    switch (localDesignTemplate) {
      case 'modern':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
        };
      case 'elegant':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: '#ffffff',
        };
      case 'futuristic':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
          color: '#00ffff',
        };
      case 'minimal':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
          color: '#333333',
        };
      case 'corporate':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
          color: '#ffffff',
        };
      case 'gradient':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
          color: '#333333',
        };
      case 'glassmorphism':
        return {
          ...baseStyles,
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          color: '#333333',
        };
      case 'neon':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
          color: '#00ffff',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
        };
      case 'retro':
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
          color: '#2c2c54',
        };
      default:
        return {
          ...baseStyles,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#ffffff',
        };
    }
  }, [localDesignTemplate]);

  const getLayoutClasses = useCallback(() => {
    const classes = [];
    
    // Padding classes
    switch (localPadding) {
      case 'none': classes.push('p-0'); break;
      case 'small': classes.push('p-4'); break;
      case 'medium': classes.push('p-8'); break;
      case 'large': classes.push('p-12'); break;
      case 'extra-large': classes.push('p-16'); break;
    }
    
    // Border radius classes
    switch (localBorderRadius) {
      case 'none': classes.push('rounded-none'); break;
      case 'small': classes.push('rounded-sm'); break;
      case 'medium': classes.push('rounded-md'); break;
      case 'large': classes.push('rounded-lg'); break;
      case 'extra-large': classes.push('rounded-xl'); break;
    }
    
    // Shadow classes
    switch (localShadowSize) {
      case 'none': break;
      case 'small': classes.push('shadow-sm'); break;
      case 'medium': classes.push('shadow-md'); break;
      case 'large': classes.push('shadow-lg'); break;
      case 'extra-large': classes.push('shadow-xl'); break;
    }
    
    return classes.join(' ');
  }, [localPadding, localBorderRadius, localShadowSize]);

  const getLayoutStyles = useCallback(() => {
    const styles: React.CSSProperties = {};
    
    return styles;
  }, []);

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
          subtitle: localSubtitle,
          image: localImage,
          backgroundImage: background,
          backgroundType: type,
          cta: localCta,
          secondaryCta: localSecondaryCta,
          badgeText: localBadgeText,
          showAnimatedDots: localShowAnimatedDots,
          showIcon: localShowIcon
        });
        
        // Reset editing flag after update
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 300); // Shorter debounce for background changes
    }
  }, [onUpdate, localTitle, localSubtitle, localImage, localCta, localSecondaryCta, 
      localBadgeText, localShowAnimatedDots, localShowIcon]);
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      // Reset any pending state changes
      setIsDesignChanging(false);
    };
  }, []);

  // Render hero section content
  const renderHeroContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-30 hero-content flex flex-col items-start justify-center"
      >
        {localBadgeText && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-2 inline-block px-4 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
            style={{ 
              color: (() => {
                const templateStyles = getDesignTemplateStyles();
                return localStyling.textColor || templateStyles.color || undefined;
              })(),
              backgroundColor: (() => {
                const templateStyles = getDesignTemplateStyles();
                const baseColor = localStyling.backgroundColor || templateStyles.color;
                return baseColor ? `${baseColor}20` : undefined;
              })()
            }}
            data-field-type="badgeText"
            data-component-type="Hero"
          >
            {localBadgeText}
          </motion.div>
        )}
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" 
          style={{ 
            color: (() => {
              const templateStyles = getDesignTemplateStyles();
              return localStyling.textColor || templateStyles.color || '#111827';
            })()
          }}
          data-field-type="title" 
          data-component-type="Hero"
        >
          {localTitle}
        </h1>
        <p 
          className="mt-6 text-xl" 
          style={{ 
            color: (() => {
              const templateStyles = getDesignTemplateStyles();
              const baseColor = localStyling.textColor || templateStyles.color || '#4B5563';
              // Add some transparency for subtitle
              return baseColor.includes('#') ? `${baseColor}CC` : baseColor;
            })()
          }}
          data-field-type="subtitle" 
          data-component-type="Hero"
        >
          {localSubtitle}
        </p>
        
        <motion.div 
          className="mt-8 flex flex-wrap gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {localCta && localCta.text && (
            <Link
              href={localCta.url || '#'}
              className="btn-primary text-lg px-6 py-3 rounded-lg shadow-md hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1"
              style={{ 
                backgroundColor: localStyling.backgroundColor || undefined,
                color: '#ffffff'
              }}
              data-field-type="cta.text"
              data-component-type="Hero"
            >
              {localCta.text}
            </Link>
          )}
          
          {localSecondaryCta && localSecondaryCta.text && (
            <Link
              href={localSecondaryCta.url || '#'}
              className="border-2 text-lg px-6 py-3 rounded-lg hover:bg-gray-50 transform transition-all duration-300 hover:-translate-y-1"
              style={{ 
                borderColor: localStyling.textColor || '#D1D5DB',
                color: localStyling.textColor || '#374151'
              }}
              data-field-type="secondaryCta.text"
              data-component-type="Hero"
            >
              {localSecondaryCta.text}
            </Link>
          )}
        </motion.div>
      </motion.div>
      
      {localShowIcon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative icon-container flex items-center justify-center z-30 h-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          data-field-type="showIcon"
          data-component-type="Hero"
        >
          <motion.div 
            className="relative z-30 flex justify-center"
            animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <InterpretationSVG 
              className="w-full h-auto max-w-md" 
              style={{ 
                filter: localStyling.textColor ? `hue-rotate(${localStyling.textColor === '#ffffff' ? '180deg' : '0deg'})` : undefined 
              }}
            />
          </motion.div>
          
          {/* Interactive elements */}
          <motion.div
            className="absolute -top-8 -right-8 w-16 h-16 rounded-full z-0"
            style={{ backgroundColor: localStyling.backgroundColor || '#DBEAFE' }}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-10 -left-8 w-12 h-12 rounded-full z-0"
            style={{ backgroundColor: localStyling.textColor || '#C7D2FE' }}
            animate={{
              y: [0, 10, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute -bottom-4 right-12 w-8 h-8 rounded-md rotate-12 z-0"
            style={{ backgroundColor: localStyling.borderColor || '#A5B4FC' }}
            animate={{
              rotate: [12, 45, 12],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}
    </div>
  );

  // Add a new media selection handler
  const handleMediaSelect = (mediaItem: MediaItem) => {
    setLocalImage(mediaItem.fileUrl);
    handleImageChange(mediaItem.fileUrl);
    setShowMediaSelector(false);
  };

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
        subtitle: localSubtitle,
        image: localImage,
        backgroundImage: mediaItem.fileUrl,
        backgroundType: 'image',
        cta: localCta,
        secondaryCta: localSecondaryCta,
        badgeText: localBadgeText,
        showAnimatedDots: localShowAnimatedDots,
        showIcon: localShowIcon
      });
    }
  };

  // Generate styles and classes from styling
  const inlineStyles = generateStylesFromStyling(localStyling);

  return (
    <>
      {showBackgroundSelector && (
        <BackgroundSelector
          isOpen={showBackgroundSelector}
          onClose={() => setShowBackgroundSelector(false)}
          onSelect={handleBackgroundSelect}
          currentBackground={localBackgroundImage}
          onOpenMediaSelector={() => {
            setShowBackgroundSelector(false);
            setShowMediaSelectorForBackground(true);
          }}
        />
      )}
      
      {showMediaSelector && (
        <MediaSelector
          isOpen={showMediaSelector}
          onClose={() => setShowMediaSelector(false)}
          onSelect={handleMediaSelect}
          title="Select Additional Image"
          initialType="image"
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
          "relative w-full h-full overflow-hidden flex items-center",
          isEditing ? "min-h-[600px]" : "min-h-screen",
          getLayoutClasses()
        )}
        style={isEditing ? { 
          isolation: 'isolate',
          backgroundColor: '#f8fafc' // Light gray background in editor for better contrast
        } : {
          ...(localBackgroundType === 'image' && localBackgroundImage ? {
            backgroundImage: `url(${localBackgroundImage})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat'
          } : localBackgroundImage ? {
            backgroundImage: localBackgroundImage
          } : {}),
          isolation: 'isolate',
          ...inlineStyles,
          ...getDesignTemplateStyles(),
          ...getLayoutStyles()
        }}
      >
        {/* Animated background elements */}
        {localShowAnimatedDots && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
            <motion.div 
              className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary-100 opacity-60"
              animate={{
                x: [0, 30, 0],
                y: [0, 40, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute top-40 right-20 w-32 h-32 rounded-full bg-indigo-100 opacity-60"
              animate={{
                x: [0, -40, 0],
                y: [0, 30, 0],
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute bottom-20 left-1/3 w-24 h-24 rounded-full bg-blue-100 opacity-60"
              animate={{
                x: [0, 20, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        )}

        <div className="w-full h-full relative z-10 flex items-center justify-center">
          {isEditing ? (
            <div className="w-full h-full p-6">
              <CmsTabs
                tabs={[
                  {
                    id: "content",
                    label: "Content",
                    icon: <FileText className="w-4 h-4" />,
                    content: (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Text Content</h3>
                            
                            <StableInput
                              value={localBadgeText}
                              onChange={handleBadgeTextChange}
                              placeholder="Badge text..."
                              label="Badge Text"
                              debounceTime={300}
                              data-field-id="badgeText"
                              data-component-type="Hero"
                            />
                            
                            <StableInput
                              value={localTitle}
                              onChange={handleTitleChange}
                              placeholder="Main title..."
                              className="text-foreground font-bold text-xl"
                              label="Title"
                              debounceTime={300}
                              data-field-id="title"
                              data-component-type="Hero"
                            />
                            
                            <StableInput
                              value={localSubtitle}
                              onChange={handleSubtitleChange}
                              placeholder="Subtitle..."
                              className="text-muted-foreground"
                              multiline={true}
                              label="Subtitle"
                              debounceTime={300}
                              data-field-id="subtitle"
                              data-component-type="Hero"
                            />
                          </div>
                          
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Call to Actions</h3>
                            
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-700">Primary CTA</h4>
                              <div className="grid grid-cols-1 gap-3">
                                <StableInput
                                  value={localCta.text}
                                  onChange={handleCtaTextChange}
                                  placeholder="Button text..."
                                  label="Text"
                                  debounceTime={300}
                                  data-field-id="cta.text"
                                  data-component-type="Hero"
                                />
                                
                                <StableInput
                                  value={localCta.url}
                                  onChange={handleCtaUrlChange}
                                  placeholder="Button URL..."
                                  label="URL"
                                  debounceTime={300}
                                  data-field-id="cta.url"
                                  data-component-type="Hero"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-700">Secondary CTA</h4>
                              <div className="grid grid-cols-1 gap-3">
                                <StableInput
                                  value={localSecondaryCta.text}
                                  onChange={handleSecondaryCtaTextChange}
                                  placeholder="Button text..."
                                  label="Text"
                                  debounceTime={300}
                                  data-field-id="secondaryCta.text"
                                  data-component-type="Hero"
                                />
                                
                                <StableInput
                                  value={localSecondaryCta.url}
                                  onChange={handleSecondaryCtaUrlChange}
                                  placeholder="Button URL..."
                                  label="URL"
                                  debounceTime={300}
                                  data-field-id="secondaryCta.url"
                                  data-component-type="Hero"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: "styling",
                    label: "Styling",
                    icon: <Palette className="w-4 h-4" />,
                    content: (
                      <div className="space-y-6">
                        {/* Design Templates Section */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium mb-2 flex items-center">
                            <Palette className="h-4 w-4 mr-2 text-muted-foreground" />
                            Design Templates
                          </h3>
                          
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            {[
                              { 
                                value: 'modern', 
                                label: 'Modern', 
                                description: 'Blue gradients with smooth animations',
                                preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                              },
                              { 
                                value: 'elegant', 
                                label: 'Elegant', 
                                description: 'Warm pink tones with sophistication',
                                preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                              },
                              { 
                                value: 'futuristic', 
                                label: 'Futuristic', 
                                description: 'Dark theme with cyan neon accents',
                                preview: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)'
                              },
                              { 
                                value: 'minimal', 
                                label: 'Minimal', 
                                description: 'Clean and simple light theme',
                                preview: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)'
                              },
                              { 
                                value: 'corporate', 
                                label: 'Corporate', 
                                description: 'Professional blue business theme',
                                preview: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
                              },
                              { 
                                value: 'gradient', 
                                label: 'Gradient', 
                                description: 'Soft pink gradient background',
                                preview: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)'
                              },
                              { 
                                value: 'glassmorphism', 
                                label: 'Glass', 
                                description: 'Modern glassmorphism effect',
                                preview: 'rgba(255, 255, 255, 0.25)'
                              },
                              { 
                                value: 'neon', 
                                label: 'Neon', 
                                description: 'Dark background with neon effects',
                                preview: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)'
                              },
                              { 
                                value: 'retro', 
                                label: 'Retro', 
                                description: 'Vintage 80s inspired design',
                                preview: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)'
                              }
                            ].map((design) => (
                              <button
                                key={design.value}
                                onClick={() => handleDesignTemplateChange(design.value)}
                                className={`relative p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                                  localDesignTemplate === design.value 
                                    ? 'border-blue-500 shadow-lg' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div 
                                  className="w-full h-12 rounded-md mb-2"
                                  style={{ 
                                    background: design.preview,
                                    backdropFilter: design.value === 'glassmorphism' ? 'blur(10px)' : undefined,
                                    border: design.value === 'glassmorphism' ? '1px solid rgba(255, 255, 255, 0.18)' : undefined
                                  }}
                                >
                                  {design.value === 'neon' && (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                                    </div>
                                  )}
                                </div>
                                <div className="font-medium text-xs mb-1">{design.label}</div>
                                <div className="text-xs text-gray-500 leading-tight">{design.description}</div>
                                {localDesignTemplate === design.value && (
                                  <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Layout & Styling Section */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium mb-2">Layout & Styling</h3>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Padding</label>
                                <select
                                  value={localPadding}
                                  onChange={(e) => handlePaddingChange(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="none">None</option>
                                  <option value="small">Small</option>
                                  <option value="medium">Medium</option>
                                  <option value="large">Large</option>
                                  <option value="extra-large">Extra Large</option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Border Radius</label>
                                <select
                                  value={localBorderRadius}
                                  onChange={(e) => handleBorderRadiusChange(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="none">None</option>
                                  <option value="small">Small</option>
                                  <option value="medium">Medium</option>
                                  <option value="large">Large</option>
                                  <option value="extra-large">Extra Large</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Shadow</label>
                                <select
                                  value={localShadowSize}
                                  onChange={(e) => handleShadowSizeChange(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="none">None</option>
                                  <option value="small">Small</option>
                                  <option value="medium">Medium</option>
                                  <option value="large">Large</option>
                                  <option value="extra-large">Extra Large</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: "style",
                    label: "Background",
                    icon: <LayoutTemplate className="w-4 h-4" />,
                    content: (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Background</h3>
                            
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Background
                                </label>
                                <div 
                                  className="h-32 mb-3 rounded-md border border-gray-200 overflow-hidden relative"
                                  style={{
                                    ...(localBackgroundType === 'image' && localBackgroundImage ? {
                                      backgroundImage: `url(${localBackgroundImage})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                      backgroundRepeat: 'no-repeat'
                                    } : {
                                      background: localBackgroundImage || BACKGROUND_TEMPLATES[0].value
                                    })
                                  }}
                                >
                                  {(!localBackgroundImage || localBackgroundImage === '') && (
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
                              </div>
                              
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Additional Image
                                </label>
                                <div className="flex flex-col sm:flex-row items-start gap-2">
                                  {localImage && (
                                    <div 
                                      className="h-20 w-20 border rounded-md bg-cover bg-center bg-no-repeat" 
                                      style={{ backgroundImage: `url(${localImage})` }}
                                    />
                                  )}
                                  
                                  <div className="flex-1">
                                    <div className="flex flex-wrap gap-2">
                                      <button 
                                        onClick={() => setShowMediaSelector(true)}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 flex items-center gap-1"
                                      >
                                        <Upload className="h-4 w-4" />
                                        Select Image
                                      </button>
                                    </div>
                                    
                                    <StableInput
                                      value={localImage}
                                      onChange={handleImageChange}
                                      placeholder="Or enter image URL..."
                                      debounceTime={300}
                                      data-field-id="image"
                                      data-component-type="Hero"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Options</h3>
                            
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id="showAnimatedDots"
                                  checked={localShowAnimatedDots}
                                  onChange={(e) => handleShowAnimatedDotsChange(e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="showAnimatedDots" className="text-sm font-medium text-gray-700">
                                  Show animated background dots
                                </label>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id="showIcon"
                                  checked={localShowIcon}
                                  onChange={(e) => handleShowIconChange(e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="showIcon" className="text-sm font-medium text-gray-700">
                                  Show interpretation icon
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  },
                  {
                    id: "preview",
                    label: "Preview",
                    icon: <Eye className="w-4 h-4" />,
                    content: (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Hero Section Preview</h3>
                          <div className="text-sm text-gray-500">
                            Template: <span className="font-medium capitalize">{localDesignTemplate}</span>
                          </div>
                        </div>
                        
                        {/* Live Hero Preview */}
                        <div className="border rounded-lg overflow-hidden bg-gray-50">
                          <div className="p-4 bg-white border-b">
                            <h4 className="font-medium text-gray-900 mb-1">Live Preview</h4>
                            <p className="text-sm text-gray-600">This is how your hero section will appear to visitors</p>
                          </div>
                          
                          <div className="relative">
                            {isDesignChanging ? (
                              <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center min-h-[400px]">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                  <p className="text-sm text-gray-600">Updating design preview...</p>
                                </div>
                              </div>
                            ) : (
                              <div 
                                key={`preview-${localDesignTemplate}-${localPadding}-${localBorderRadius}-${localShadowSize}`}
                                className={cn(
                                  "relative w-full overflow-hidden flex items-center min-h-[400px]",
                                  getLayoutClasses()
                                )}
                                style={{
                                  ...(localBackgroundType === 'image' && localBackgroundImage ? {
                                    backgroundImage: `url(${localBackgroundImage})`,
                                    backgroundPosition: 'center',
                                    backgroundSize: 'cover',
                                    backgroundRepeat: 'no-repeat'
                                  } : localBackgroundImage ? {
                                    backgroundImage: localBackgroundImage
                                  } : {}),
                                  isolation: 'isolate',
                                  ...getDesignTemplateStyles(),
                                  ...getLayoutStyles()
                                }}
                              >
                                {/* Animated background elements */}
                                {localShowAnimatedDots && (
                                  <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
                                    <motion.div 
                                      className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary-100 opacity-60"
                                      animate={{
                                        x: [0, 30, 0],
                                        y: [0, 40, 0],
                                      }}
                                      transition={{
                                        duration: 15,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                      }}
                                    />
                                    <motion.div 
                                      className="absolute top-40 right-20 w-32 h-32 rounded-full bg-indigo-100 opacity-60"
                                      animate={{
                                        x: [0, -40, 0],
                                        y: [0, 30, 0],
                                      }}
                                      transition={{
                                        duration: 18,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                      }}
                                    />
                                  </div>
                                )}

                                <div className="w-full h-full relative z-10 flex items-center justify-center p-8">
                                  <div className="text-center max-w-4xl mx-auto">
                                    {localBadgeText && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6 }}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-4"
                                      >
                                        {localBadgeText}
                                      </motion.div>
                                    )}
                                    
                                    {localTitle && (
                                      <motion.h1
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8 }}
                                        className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
                                        style={{ 
                                          color: (() => {
                                            const templateStyles = getDesignTemplateStyles();
                                            return localStyling.textColor || templateStyles.color || '#111827';
                                          })()
                                        }}
                                      >
                                        {localTitle}
                                      </motion.h1>
                                    )}
                                    
                                    {localSubtitle && (
                                      <motion.p
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className="text-xl md:text-2xl mb-8 opacity-90"
                                        style={{ 
                                          color: (() => {
                                            const templateStyles = getDesignTemplateStyles();
                                            const baseColor = localStyling.textColor || templateStyles.color || '#4B5563';
                                            // Add some transparency for subtitle
                                            return baseColor.includes('#') ? `${baseColor}CC` : baseColor;
                                          })()
                                        }}
                                        >
                                        {localSubtitle}
                                      </motion.p>
                                    )}
                                    
                                    <motion.div
                                      initial={{ opacity: 0, y: 30 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ duration: 0.8, delay: 0.4 }}
                                      className="flex flex-col sm:flex-row gap-4 justify-center"
                                    >
                                      {localCta.text && (
                                        <button
                                          type="button"
                                          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                                          disabled
                                        >
                                          {localCta.text}
                                        </button>
                                      )}
                                      
                                      {localSecondaryCta.text && (
                                        <button
                                          type="button"
                                          className="px-8 py-3 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors"
                                          disabled
                                        >
                                          {localSecondaryCta.text}
                                        </button>
                                      )}
                                    </motion.div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Design Information */}
                        <div className="p-4 border rounded-md bg-blue-50">
                          <h5 className="text-sm font-medium text-blue-900 mb-2">Current Design: {localDesignTemplate}</h5>
                          <div className="text-xs text-blue-700">
                            {localDesignTemplate === 'modern' && 'Blue gradients with smooth animations and modern styling'}
                            {localDesignTemplate === 'elegant' && 'Warm pink tones with sophisticated design elements'}
                            {localDesignTemplate === 'futuristic' && 'Dark theme with cyan neon accents and sci-fi styling'}
                            {localDesignTemplate === 'minimal' && 'Clean and simple light theme design'}
                            {localDesignTemplate === 'corporate' && 'Professional blue corporate styling'}
                            {localDesignTemplate === 'gradient' && 'Soft pink gradient background with modern aesthetics'}
                            {localDesignTemplate === 'glassmorphism' && 'Modern glassmorphism effect with transparency and blur'}
                            {localDesignTemplate === 'neon' && 'Dark cyberpunk theme with bright neon colors'}
                            {localDesignTemplate === 'retro' && 'Vintage 80s inspired design with retro styling'}
                          </div>
                        </div>

                        {/* Layout Settings Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-3 bg-gray-50 rounded-md">
                            <h6 className="text-xs font-medium text-gray-700 mb-2">Layout Settings</h6>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Padding: <span className="font-medium">{localPadding}</span></div>
                              <div>Border Radius: <span className="font-medium">{localBorderRadius}</span></div>
                              <div>Shadow: <span className="font-medium">{localShadowSize}</span></div>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-gray-50 rounded-md">
                            <h6 className="text-xs font-medium text-gray-700 mb-2">Content</h6>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Title: <span className="font-medium">{localTitle ? 'Set' : 'Not set'}</span></div>
                              <div>Subtitle: <span className="font-medium">{localSubtitle ? 'Set' : 'Not set'}</span></div>
                              <div>Badge: <span className="font-medium">{localBadgeText ? 'Set' : 'Not set'}</span></div>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-gray-50 rounded-md">
                            <h6 className="text-xs font-medium text-gray-700 mb-2">Actions</h6>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div>Primary CTA: <span className="font-medium">{localCta.text ? 'Set' : 'Not set'}</span></div>
                              <div>Secondary CTA: <span className="font-medium">{localSecondaryCta.text ? 'Set' : 'Not set'}</span></div>
                              <div>Animated Dots: <span className="font-medium">{localShowAnimatedDots ? 'Enabled' : 'Disabled'}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }
                ]}
              />
            </div>
          ) : (
            renderHeroContent()
          )}
        </div>
      </section>
    </>
  );
});

export default HeroSection;