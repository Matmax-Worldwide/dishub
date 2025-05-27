'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import StableInput from './StableInput';
import { MediaItem } from '@/components/cms/media/types';
import S3FilePreview from '@/components/shared/S3FilePreview';
import MediaSelector from '@/components/cms/MediaSelector';
import ColorSelector from '@/components/cms/ColorSelector';
import TransparencySelector from '@/components/cms/TransparencySelector';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface VideoSectionProps {
  videoUrl?: string;
  posterUrl?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  playsinline?: boolean;
  overlayEnabled?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  textColor?: string;
  textAlignment?: 'left' | 'center' | 'right';
  contentPosition?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  showPlayButton?: boolean;
  playButtonStyle?: 'default' | 'filled' | 'outline';
  playButtonSize?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
  maxHeight?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  isEditing?: boolean;
  onUpdate?: (data: {
    videoUrl?: string;
    posterUrl?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    playsinline?: boolean;
    overlayEnabled?: boolean;
    overlayColor?: string;
    overlayOpacity?: number;
    textColor?: string;
    textAlignment?: 'left' | 'center' | 'right';
    contentPosition?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    showPlayButton?: boolean;
    playButtonStyle?: 'default' | 'filled' | 'outline';
    playButtonSize?: 'sm' | 'md' | 'lg';
    fullHeight?: boolean;
    maxHeight?: string;
    objectFit?: 'cover' | 'contain' | 'fill';
  }) => void;
}

export default function VideoSection({
  videoUrl: initialVideoUrl = '',
  posterUrl: initialPosterUrl = '',
  title: initialTitle = '',
  subtitle: initialSubtitle = '',
  description: initialDescription = '',
  autoplay: initialAutoplay = false,
  loop: initialLoop = false,
  muted: initialMuted = true,
  controls: initialControls = true,
  playsinline: initialPlaysinline = true,
  overlayEnabled: initialOverlayEnabled = false,
  overlayColor: initialOverlayColor = '#000000',
  overlayOpacity: initialOverlayOpacity = 50,
  textColor: initialTextColor = '#ffffff',
  textAlignment: initialTextAlignment = 'center',
  contentPosition: initialContentPosition = 'center',
  showPlayButton: initialShowPlayButton = true,
  playButtonStyle: initialPlayButtonStyle = 'filled',
  playButtonSize: initialPlayButtonSize = 'lg',
  fullHeight: initialFullHeight = true,
  maxHeight: initialMaxHeight = '100vh',
  objectFit: initialObjectFit = 'cover',
  isEditing = false,
  onUpdate
}: VideoSectionProps) {
  // Local state
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);
  const [posterUrl, setPosterUrl] = useState(initialPosterUrl);
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [description, setDescription] = useState(initialDescription);
  const [autoplay, setAutoplay] = useState(initialAutoplay);
  const [loop, setLoop] = useState(initialLoop);
  const [muted, setMuted] = useState(initialMuted);
  const [controls, setControls] = useState(initialControls);
  const [playsinline, setPlaysinline] = useState(initialPlaysinline);
  const [overlayEnabled, setOverlayEnabled] = useState(initialOverlayEnabled);
  const [overlayColor, setOverlayColor] = useState(initialOverlayColor);
  const [overlayOpacity, setOverlayOpacity] = useState(initialOverlayOpacity);
  const [textColor, setTextColor] = useState(initialTextColor);
  const [textAlignment, setTextAlignment] = useState(initialTextAlignment);
  const [contentPosition, setContentPosition] = useState(initialContentPosition);
  const [showPlayButton, setShowPlayButton] = useState(initialShowPlayButton);
  const [playButtonStyle, setPlayButtonStyle] = useState(initialPlayButtonStyle);
  const [playButtonSize, setPlayButtonSize] = useState(initialPlayButtonSize);
  const [fullHeight, setFullHeight] = useState(initialFullHeight);
  const [maxHeight, setMaxHeight] = useState(initialMaxHeight);
  const [objectFit, setObjectFit] = useState(initialObjectFit);

  // UI state
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [showPosterSelector, setShowPosterSelector] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isEditingRef = useRef(false);

  // Update handler with debouncing
  const handleUpdateField = useCallback((field: string, value: string | number | boolean) => {
    if (onUpdate) {
      isEditingRef.current = true;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const updateData = {
        videoUrl,
        posterUrl,
        title,
        subtitle,
        description,
        autoplay,
        loop,
        muted,
        controls,
        playsinline,
        overlayEnabled,
        overlayColor,
        overlayOpacity,
        textColor,
        textAlignment,
        contentPosition,
        showPlayButton,
        playButtonStyle,
        playButtonSize,
        fullHeight,
        maxHeight,
        objectFit
      };

      (updateData as Record<string, string | number | boolean>)[field] = value;

      debounceRef.current = setTimeout(() => {
        onUpdate(updateData);
        setTimeout(() => {
          isEditingRef.current = false;
        }, 300);
      }, 500);
    }
  }, [
    videoUrl, posterUrl, title, subtitle, description, autoplay, loop, muted, controls,
    playsinline, overlayEnabled, overlayColor, overlayOpacity, textColor, textAlignment,
    contentPosition, showPlayButton, playButtonStyle, playButtonSize, fullHeight, maxHeight, objectFit, onUpdate
  ]);

  // Individual change handlers
  const handleVideoUrlChange = useCallback((newValue: string) => {
    setVideoUrl(newValue);
    handleUpdateField('videoUrl', newValue);
    setShowVideoSelector(false);
  }, [handleUpdateField]);

  const handlePosterUrlChange = useCallback((newValue: string) => {
    setPosterUrl(newValue);
    handleUpdateField('posterUrl', newValue);
    setShowPosterSelector(false);
  }, [handleUpdateField]);

  const handleTitleChange = useCallback((newValue: string) => {
    setTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);

  const handleSubtitleChange = useCallback((newValue: string) => {
    setSubtitle(newValue);
    handleUpdateField('subtitle', newValue);
  }, [handleUpdateField]);

  const handleDescriptionChange = useCallback((newValue: string) => {
    setDescription(newValue);
    handleUpdateField('description', newValue);
  }, [handleUpdateField]);

  // Video control handlers
  const handleAutoplayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setAutoplay(newValue);
    handleUpdateField('autoplay', newValue);
  }, [handleUpdateField]);

  const handleLoopChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLoop(newValue);
    handleUpdateField('loop', newValue);
  }, [handleUpdateField]);

  const handleMutedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setMuted(newValue);
    handleUpdateField('muted', newValue);
  }, [handleUpdateField]);

  const handleControlsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setControls(newValue);
    handleUpdateField('controls', newValue);
  }, [handleUpdateField]);

  const handlePlaysinlineChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setPlaysinline(newValue);
    handleUpdateField('playsinline', newValue);
  }, [handleUpdateField]);

  // Overlay handlers
  const handleOverlayEnabledChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setOverlayEnabled(newValue);
    handleUpdateField('overlayEnabled', newValue);
  }, [handleUpdateField]);

  const handleOverlayColorChange = useCallback((color: string) => {
    setOverlayColor(color);
    handleUpdateField('overlayColor', color);
  }, [handleUpdateField]);

  const handleOverlayOpacityChange = useCallback((opacity: number) => {
    setOverlayOpacity(opacity);
    handleUpdateField('overlayOpacity', opacity);
  }, [handleUpdateField]);

  const handleTextColorChange = useCallback((color: string) => {
    setTextColor(color);
    handleUpdateField('textColor', color);
  }, [handleUpdateField]);

  // Layout handlers
  const handleTextAlignmentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'left' | 'center' | 'right';
    setTextAlignment(newValue);
    handleUpdateField('textAlignment', newValue);
  }, [handleUpdateField]);

  const handleContentPositionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as typeof contentPosition;
    setContentPosition(newValue);
    handleUpdateField('contentPosition', newValue);
  }, [handleUpdateField]);

  const handleShowPlayButtonChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setShowPlayButton(newValue);
    handleUpdateField('showPlayButton', newValue);
  }, [handleUpdateField]);

  const handlePlayButtonStyleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'default' | 'filled' | 'outline';
    setPlayButtonStyle(newValue);
    handleUpdateField('playButtonStyle', newValue);
  }, [handleUpdateField]);

  const handlePlayButtonSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'sm' | 'md' | 'lg';
    setPlayButtonSize(newValue);
    handleUpdateField('playButtonSize', newValue);
  }, [handleUpdateField]);

  const handleFullHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setFullHeight(newValue);
    handleUpdateField('fullHeight', newValue);
  }, [handleUpdateField]);

  const handleMaxHeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMaxHeight(newValue);
    handleUpdateField('maxHeight', newValue);
  }, [handleUpdateField]);

  const handleObjectFitChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value as 'cover' | 'contain' | 'fill';
    setObjectFit(newValue);
    handleUpdateField('objectFit', newValue);
  }, [handleUpdateField]);

  // Media selection handlers
  const handleVideoSelection = (mediaItem: MediaItem) => {
    handleVideoUrlChange(mediaItem.fileUrl);
  };

  const handlePosterSelection = (mediaItem: MediaItem) => {
    handlePosterUrlChange(mediaItem.fileUrl);
  };

  // Video play/pause handler
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  // Video event handlers
  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);

  // Utility function to convert hex to rgba
  const hexToRgba = useCallback((hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
  }, []);

  // Get content position classes
  const getContentPositionClasses = () => {
    const positions = {
      'top-left': 'items-start justify-start',
      'top-center': 'items-start justify-center',
      'top-right': 'items-start justify-end',
      'center-left': 'items-center justify-start',
      'center': 'items-center justify-center',
      'center-right': 'items-center justify-end',
      'bottom-left': 'items-end justify-start',
      'bottom-center': 'items-end justify-center',
      'bottom-right': 'items-end justify-end'
    };
    return positions[contentPosition] || positions.center;
  };

  // Get play button size classes
  const getPlayButtonSizeClasses = () => {
    const sizes = {
      'sm': 'w-12 h-12',
      'md': 'w-16 h-16',
      'lg': 'w-20 h-20'
    };
    return sizes[playButtonSize] || sizes.lg;
  };

  // Get play button style classes
  const getPlayButtonStyleClasses = () => {
    const styles = {
      'default': 'bg-white/20 hover:bg-white/30 text-white',
      'filled': 'bg-white text-black hover:bg-gray-100',
      'outline': 'border-2 border-white text-white hover:bg-white/20'
    };
    return styles[playButtonStyle] || styles.filled;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Components for editing mode
  const VideoSelector = () => (
    <div className="space-y-2">
      <label className="text-sm font-medium">Video File</label>
      <div className="flex flex-col gap-2">
        <div className="border rounded-md h-32 w-full flex items-center justify-center overflow-hidden bg-gray-50">
          {videoUrl ? (
            <video
              src={videoUrl}
              poster={posterUrl}
              className="max-h-full max-w-full object-contain"
              muted
            />
          ) : (
            <div className="text-gray-400 text-sm text-center">
              No video<br/>selected
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowVideoSelector(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Select Video
          </button>
          {videoUrl && (
            <button 
              onClick={() => handleVideoUrlChange('')}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              Remove
            </button>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Select a video file from your media library
        </div>
      </div>
    </div>
  );

  const PosterSelector = () => (
    <div className="space-y-2">
      <label className="text-sm font-medium">Poster Image (Optional)</label>
      <div className="flex flex-col gap-2">
        <div className="border rounded-md h-24 w-full flex items-center justify-center overflow-hidden bg-gray-50">
          {posterUrl ? (
            <S3FilePreview
              src={posterUrl}
              alt="Video poster"
              className="max-h-full max-w-full object-contain"
              width={200}
              height={100}
            />
          ) : (
            <div className="text-gray-400 text-sm text-center">
              No poster<br/>selected
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowPosterSelector(true)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
          >
            Select Poster
          </button>
          {posterUrl && (
            <button 
              onClick={() => handlePosterUrlChange('')}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
            >
              Remove
            </button>
          )}
        </div>
        <div className="text-xs text-gray-500">
          Image shown before video plays
        </div>
      </div>
    </div>
  );

  const VideoControls = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
        Video Settings
      </h4>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoplay"
            checked={autoplay}
            onChange={handleAutoplayChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="autoplay" className="text-sm font-medium">
            Autoplay (starts automatically)
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="loop"
            checked={loop}
            onChange={handleLoopChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="loop" className="text-sm font-medium">
            Loop (repeat continuously)
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="muted"
            checked={muted}
            onChange={handleMutedChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="muted" className="text-sm font-medium">
            Muted (no sound by default)
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="controls"
            checked={controls}
            onChange={handleControlsChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="controls" className="text-sm font-medium">
            Show video controls
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="playsinline"
            checked={playsinline}
            onChange={handlePlaysinlineChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="playsinline" className="text-sm font-medium">
            Play inline (mobile)
          </label>
        </div>
      </div>
    </div>
  );

  const OverlaySettings = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
        Overlay Settings
      </h4>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="overlayEnabled"
          checked={overlayEnabled}
          onChange={handleOverlayEnabledChange}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="overlayEnabled" className="text-sm font-medium">
          Enable overlay
        </label>
      </div>
      
      {overlayEnabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <ColorSelector
              label="Overlay Color"
              value={overlayColor}
              onChange={handleOverlayColorChange}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-2">
              Overlay Opacity
            </label>
            <TransparencySelector
              value={overlayOpacity}
              onChange={handleOverlayOpacityChange}
            />
          </div>
        </div>
      )}
    </div>
  );

  const LayoutSettings = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
        Layout & Appearance
      </h4>
      
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="fullHeight"
            checked={fullHeight}
            onChange={handleFullHeightChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="fullHeight" className="text-sm font-medium">
            Full height (100vh)
          </label>
        </div>
        
        {!fullHeight && (
          <div>
            <label htmlFor="maxHeight" className="text-sm font-medium block mb-2">
              Max Height
            </label>
            <input
              type="text"
              id="maxHeight"
              value={maxHeight}
              onChange={handleMaxHeightChange}
              placeholder="e.g., 500px, 50vh"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        
        <div>
          <label htmlFor="objectFit" className="text-sm font-medium block mb-2">
            Video Fit
          </label>
          <select
            id="objectFit"
            value={objectFit}
            onChange={handleObjectFitChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="cover">Cover (fill container)</option>
            <option value="contain">Contain (fit within container)</option>
            <option value="fill">Fill (stretch to fit)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const ContentSettings = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
        Content Settings
      </h4>
      
      <div>
        <ColorSelector
          label="Text Color"
          value={textColor}
          onChange={handleTextColorChange}
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="textAlignment" className="text-sm font-medium block mb-2">
            Text Alignment
          </label>
          <select
            id="textAlignment"
            value={textAlignment}
            onChange={handleTextAlignmentChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="contentPosition" className="text-sm font-medium block mb-2">
            Content Position
          </label>
          <select
            id="contentPosition"
            value={contentPosition}
            onChange={handleContentPositionChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="top-left">Top Left</option>
            <option value="top-center">Top Center</option>
            <option value="top-right">Top Right</option>
            <option value="center-left">Center Left</option>
            <option value="center">Center</option>
            <option value="center-right">Center Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-center">Bottom Center</option>
            <option value="bottom-right">Bottom Right</option>
          </select>
        </div>
      </div>
    </div>
  );

  const PlayButtonSettings = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-200 pb-2">
        Play Button
      </h4>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showPlayButton"
          checked={showPlayButton}
          onChange={handleShowPlayButtonChange}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="showPlayButton" className="text-sm font-medium">
          Show custom play button
        </label>
      </div>
      
      {showPlayButton && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="playButtonStyle" className="text-sm font-medium block mb-2">
              Button Style
            </label>
            <select
              id="playButtonStyle"
              value={playButtonStyle}
              onChange={handlePlayButtonStyleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Default</option>
              <option value="filled">Filled</option>
              <option value="outline">Outline</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="playButtonSize" className="text-sm font-medium block mb-2">
              Button Size
            </label>
            <select
              id="playButtonSize"
              value={playButtonSize}
              onChange={handlePlayButtonSizeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const VideoPreview = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium mb-2">Video Preview</h4>
      <div className="border rounded-md overflow-hidden bg-black relative" style={{ height: '300px' }}>
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              poster={posterUrl}
              className="w-full h-full object-cover"
              muted={muted}
              loop={loop}
              playsInline={playsinline}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              controls={controls}
            />
            
            {overlayEnabled && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ 
                  backgroundColor: hexToRgba(overlayColor, overlayOpacity)
                }}
              />
            )}
            
            <div className={`absolute inset-0 flex ${getContentPositionClasses()} p-6 pointer-events-none`}>
              <div className={`text-${textAlignment} max-w-2xl`} style={{ color: textColor }}>
                {title && (
                  <h1 className="text-4xl font-bold mb-4">{title}</h1>
                )}
                {subtitle && (
                  <h2 className="text-xl mb-4">{subtitle}</h2>
                )}
                {description && (
                  <p className="text-lg opacity-90">{description}</p>
                )}
              </div>
            </div>
            
            {showPlayButton && !controls && (
              <button
                onClick={togglePlayPause}
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${getPlayButtonSizeClasses()} ${getPlayButtonStyleClasses()} rounded-full flex items-center justify-center transition-all duration-200 pointer-events-auto`}
              >
                {isPlaying ? (
                  <PauseIcon className="w-1/2 h-1/2" />
                ) : (
                  <PlayIcon className="w-1/2 h-1/2 ml-1" />
                )}
              </button>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <PlayIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No video selected</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isEditing ? (
        <Tabs defaultValue="content" className="space-y-4 w-full max-w-full overflow-x-hidden">
          <TabsList className="flex flex-wrap space-x-2 w-full">
            <TabsTrigger value="content" className="flex-1 min-w-[100px]">Content</TabsTrigger>
            <TabsTrigger value="video" className="flex-1 min-w-[100px]">Video</TabsTrigger>
            <TabsTrigger value="styling" className="flex-1 min-w-[100px]">Styling</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1 min-w-[100px]">Preview</TabsTrigger>
          </TabsList>

          {/* CONTENT TAB */}
          <TabsContent value="content" className="space-y-4">
            <StableInput
              value={title}
              onChange={handleTitleChange}
              placeholder="Enter video title..."
              className="font-bold text-2xl"
              label="Title"
              debounceTime={300}
            />
            
            <StableInput
              value={subtitle}
              onChange={handleSubtitleChange}
              placeholder="Enter subtitle..."
              className="text-lg"
              label="Subtitle"
              debounceTime={300}
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Enter video description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>
            
            <ContentSettings />
          </TabsContent>

          {/* VIDEO TAB */}
          <TabsContent value="video" className="space-y-4">
            <VideoSelector />
            <PosterSelector />
            <VideoControls />
            <PlayButtonSettings />
          </TabsContent>

          {/* STYLING TAB */}
          <TabsContent value="styling" className="space-y-4">
            <LayoutSettings />
            <OverlaySettings />
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="space-y-4">
            <VideoPreview />
          </TabsContent>
          
          {/* Media selector modals */}
          {showVideoSelector && (
            <MediaSelector
              isOpen={showVideoSelector}
              onClose={() => setShowVideoSelector(false)}
              onSelect={handleVideoSelection}
              title="Select Video"
              initialType="video"
            />
          )}
          
          {showPosterSelector && (
            <MediaSelector
              isOpen={showPosterSelector}
              onClose={() => setShowPosterSelector(false)}
              onSelect={handlePosterSelection}
              title="Select Poster Image"
              initialType="image"
            />
          )}
        </Tabs>
      ) : (
        <div 
          className={`relative w-full ${fullHeight ? 'h-screen' : ''} overflow-hidden`}
          style={{ 
            height: fullHeight ? '100vh' : maxHeight,
            minHeight: fullHeight ? '100vh' : '400px'
          }}
        >
          {videoUrl ? (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                poster={posterUrl}
                className="w-full h-full"
                style={{ objectFit }}
                autoPlay={autoplay}
                muted={muted}
                loop={loop}
                controls={controls}
                playsInline={playsinline}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
              />
              
              {overlayEnabled && (
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{ 
                    backgroundColor: hexToRgba(overlayColor, overlayOpacity)
                  }}
                />
              )}
              
              <div className={`absolute inset-0 flex ${getContentPositionClasses()} p-6 sm:p-12 pointer-events-none`}>
                <div className={`text-${textAlignment} max-w-4xl`} style={{ color: textColor }}>
                  {title && (
                    <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <h2 className="text-xl sm:text-2xl mb-6 opacity-90">
                      {subtitle}
                    </h2>
                  )}
                  {description && (
                    <p className="text-lg sm:text-xl opacity-80 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
              </div>
              
              {showPlayButton && !controls && (
                <button
                  onClick={togglePlayPause}
                  className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${getPlayButtonSizeClasses()} ${getPlayButtonStyleClasses()} rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 pointer-events-auto`}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-1/2 h-1/2" />
                  ) : (
                    <PlayIcon className="w-1/2 h-1/2 ml-1" />
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
              <div className="text-center">
                <PlayIcon className="w-24 h-24 mx-auto mb-6 opacity-50" />
                <h2 className="text-2xl font-bold mb-4">No Video Selected</h2>
                <p className="text-lg opacity-75">Please select a video in edit mode</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
} 