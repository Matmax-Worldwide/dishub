'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import StableInput from './StableInput';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  image?: string;
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
  cta,
  secondaryCta,
  badgeText,
  showAnimatedDots = true,
  showIcon = true,
  isEditing = false,
  onUpdate
}: HeroSectionProps) {
  // Local state for CMS editing
  const [localTitle, setLocalTitle] = useState(title);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle);
  const [localImage, setLocalImage] = useState(image || '');
  const [localCta, setLocalCta] = useState(cta || { text: '', url: '' });
  const [localSecondaryCta, setLocalSecondaryCta] = useState(secondaryCta || { text: '', url: '' });
  const [localBadgeText, setLocalBadgeText] = useState(badgeText || '');
  const [localShowAnimatedDots, setLocalShowAnimatedDots] = useState(showAnimatedDots);
  const [localShowIcon, setLocalShowIcon] = useState(showIcon);
  const [isHovered, setIsHovered] = useState(false);
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);

  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title);
      if (subtitle !== localSubtitle) setLocalSubtitle(subtitle);
      if ((image || '') !== localImage) setLocalImage(image || '');
      if (badgeText !== localBadgeText) setLocalBadgeText(badgeText || '');
      if (showAnimatedDots !== localShowAnimatedDots) setLocalShowAnimatedDots(showAnimatedDots);
      if (showIcon !== localShowIcon) setLocalShowIcon(showIcon);
      
      if (cta && JSON.stringify(cta) !== JSON.stringify(localCta)) {
        setLocalCta(cta || { text: '', url: '' });
      }
      
      if (secondaryCta && JSON.stringify(secondaryCta) !== JSON.stringify(localSecondaryCta)) {
        setLocalSecondaryCta(secondaryCta || { text: '', url: '' });
      }
    }
  }, [title, subtitle, image, cta, secondaryCta, badgeText, showAnimatedDots, showIcon, 
      localTitle, localSubtitle, localImage, localCta, localSecondaryCta, localBadgeText, 
      localShowAnimatedDots, localShowIcon]);

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
  
  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <section className={cn(
      "relative w-full bg-gradient-to-b from-white to-blue-50 overflow-hidden flex items-center",
      isEditing ? "min-h-[400px] h-auto py-12" : ""
    )}>
      {/* Animated background elements */}
      {localShowAnimatedDots && !isEditing && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {isEditing ? (
          <div className="grid grid-cols-1 gap-8">
            <div className="flex flex-col space-y-4">
              <StableInput
                value={localBadgeText}
                onChange={handleBadgeTextChange}
                placeholder="Badge text..."
                label="Badge Text"
                debounceTime={300}
              />
              
              <StableInput
                value={localTitle}
                onChange={handleTitleChange}
                placeholder="Main title..."
                className="text-foreground font-bold text-xl"
                label="Title"
                debounceTime={300}
              />
              
              <StableInput
                value={localSubtitle}
                onChange={handleSubtitleChange}
                placeholder="Subtitle..."
                className="text-muted-foreground"
                multiline={true}
                label="Subtitle"
                debounceTime={300}
              />
              
              <StableInput
                value={localImage}
                onChange={handleImageChange}
                placeholder="Background image URL..."
                label="Image URL"
                debounceTime={300}
              />
              
              {/* CTA Buttons */}
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Primary CTA</h3>
                <div className="grid grid-cols-2 gap-2">
                  <StableInput
                    value={localCta.text}
                    onChange={handleCtaTextChange}
                    placeholder="Button text..."
                    debounceTime={300}
                  />
                  
                  <StableInput
                    value={localCta.url}
                    onChange={handleCtaUrlChange}
                    placeholder="Button URL..."
                    debounceTime={300}
                  />
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Secondary CTA</h3>
                <div className="grid grid-cols-2 gap-2">
                  <StableInput
                    value={localSecondaryCta.text}
                    onChange={handleSecondaryCtaTextChange}
                    placeholder="Button text..."
                    debounceTime={300}
                  />
                  
                  <StableInput
                    value={localSecondaryCta.url}
                    onChange={handleSecondaryCtaUrlChange}
                    placeholder="Button URL..."
                    debounceTime={300}
                  />
                </div>
              </div>
              
              {/* Toggle options */}
              <div className="flex flex-col space-y-4 mt-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showAnimatedDots"
                    checked={localShowAnimatedDots}
                    onChange={(e) => handleShowAnimatedDotsChange(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary rounded"
                  />
                  <label htmlFor="showAnimatedDots" className="text-sm font-medium text-gray-700">
                    Show animated background dots
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showIcon"
                    checked={localShowIcon}
                    onChange={(e) => handleShowIconChange(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary rounded"
                  />
                  <label htmlFor="showIcon" className="text-sm font-medium text-gray-700">
                    Show interpretation icon
                  </label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative z-10"
            >
              {localBadgeText && (
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="mb-2 inline-block px-4 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                >
                  {localBadgeText}
                </motion.div>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {localTitle}
              </h1>
              <p className="mt-6 text-xl text-gray-600">
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
                  >
                    {localCta.text}
                  </Link>
                )}
                
                {localSecondaryCta && localSecondaryCta.text && (
                  <Link
                    href={localSecondaryCta.url || '#'}
                    className="border-2 border-gray-300 text-gray-700 text-lg px-6 py-3 rounded-lg hover:bg-gray-50 transform transition-all duration-300 hover:-translate-y-1"
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
                className="relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <motion.div 
                  className="relative z-10 flex justify-center"
                  animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <InterpretationSVG className="w-full h-auto max-w-md" />
                </motion.div>
                
                {/* Interactive elements */}
                <motion.div
                  className="absolute -top-8 -right-8 w-16 h-16 bg-primary-200 rounded-full z-0"
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
                  className="absolute bottom-10 -left-8 w-12 h-12 bg-indigo-300 rounded-full z-0"
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
                  className="absolute -bottom-4 right-12 w-8 h-8 bg-primary-300 rounded-md rotate-12 z-0"
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
        )}
      </div>
    </section>
  );
});

export default HeroSection; 