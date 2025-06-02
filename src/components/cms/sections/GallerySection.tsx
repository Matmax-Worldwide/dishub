'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import StableInput from './StableInput';
import { MediaItem } from '@/components/cms/media/types';
import S3FilePreview from '@/components/shared/S3FilePreview';
import MediaSelector from '@/components/cms/MediaSelector';
import ColorSelector from '@/components/cms/ColorSelector';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
  title?: string;
}

interface GallerySectionProps {
  title?: string;
  subtitle?: string;
  images?: GalleryImage[];
  layout?: 'grid' | 'masonry' | 'carousel' | 'lightbox';
  columns?: 2 | 3 | 4 | 5;
  spacing?: 'none' | 'small' | 'medium' | 'large';
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
  showCaptions?: boolean;
  showTitles?: boolean;
  enableLightbox?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  showImageCount?: boolean;
  autoplay?: boolean;
  autoplaySpeed?: number;
  showNavigation?: boolean;
  showDots?: boolean;
  isEditing?: boolean;
  onUpdate?: (data: {
    title?: string;
    subtitle?: string;
    images?: GalleryImage[];
    layout?: 'grid' | 'masonry' | 'carousel' | 'lightbox';
    columns?: 2 | 3 | 4 | 5;
    spacing?: 'none' | 'small' | 'medium' | 'large';
    aspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
    showCaptions?: boolean;
    showTitles?: boolean;
    enableLightbox?: boolean;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: number;
    showImageCount?: boolean;
    autoplay?: boolean;
    autoplaySpeed?: number;
    showNavigation?: boolean;
    showDots?: boolean;
  }) => void;
}

export default function GallerySection({
  title = '',
  subtitle = '',
  images = [],
  layout = 'grid',
  columns = 3,
  spacing = 'medium',
  aspectRatio = 'square',
  showCaptions = true,
  showTitles = false,
  enableLightbox = true,
  backgroundColor = '#ffffff',
  textColor = '#000000',
  borderRadius = 8,
  showImageCount = false,
  autoplay = false,
  autoplaySpeed = 3000,
  showNavigation = true,
  showDots = true,
  isEditing = false,
  onUpdate
}: GallerySectionProps) {
  // Local state
  const [localTitle, setLocalTitle] = useState(title);
  const [localSubtitle, setLocalSubtitle] = useState(subtitle);
  const [localImages, setLocalImages] = useState<GalleryImage[]>(images);
  const [localLayout, setLocalLayout] = useState(layout);
  const [localColumns, setLocalColumns] = useState(columns);
  const [localSpacing, setLocalSpacing] = useState(spacing);
  const [localAspectRatio, setLocalAspectRatio] = useState(aspectRatio);
  const [localShowCaptions, setLocalShowCaptions] = useState(showCaptions);
  const [localShowTitles, setLocalShowTitles] = useState(showTitles);
  const [localEnableLightbox, setLocalEnableLightbox] = useState(enableLightbox);
  const [localBackgroundColor, setLocalBackgroundColor] = useState(backgroundColor);
  const [localTextColor, setLocalTextColor] = useState(textColor);
  const [localBorderRadius, setLocalBorderRadius] = useState(borderRadius);
  const [localShowImageCount, setLocalShowImageCount] = useState(showImageCount);
  const [localAutoplay, setLocalAutoplay] = useState(autoplay);
  const [localAutoplaySpeed, setLocalAutoplaySpeed] = useState(autoplaySpeed);
  const [localShowNavigation, setLocalShowNavigation] = useState(showNavigation);
  const [localShowDots, setLocalShowDots] = useState(showDots);

  // UI state
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  // Refs
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Update handler with debouncing
  const handleUpdateField = useCallback((field: string, value: string | number | boolean | GalleryImage[]) => {
    if (onUpdate) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const updateData = {
          title: localTitle,
          subtitle: localSubtitle,
          images: localImages,
          layout: localLayout,
          columns: localColumns,
          spacing: localSpacing,
          aspectRatio: localAspectRatio,
          showCaptions: localShowCaptions,
          showTitles: localShowTitles,
          enableLightbox: localEnableLightbox,
          backgroundColor: localBackgroundColor,
          textColor: localTextColor,
          borderRadius: localBorderRadius,
          showImageCount: localShowImageCount,
          autoplay: localAutoplay,
          autoplaySpeed: localAutoplaySpeed,
          showNavigation: localShowNavigation,
          showDots: localShowDots
        };

        (updateData as Record<string, string | number | boolean | GalleryImage[]>)[field] = value;
        onUpdate(updateData);
      }, 300);
    }
  }, [
    localTitle, localSubtitle, localImages, localLayout, localColumns, localSpacing,
    localAspectRatio, localShowCaptions, localShowTitles, localEnableLightbox,
    localBackgroundColor, localTextColor, localBorderRadius, localShowImageCount,
    localAutoplay, localAutoplaySpeed, localShowNavigation, localShowDots, onUpdate
  ]);

  // Individual change handlers
  const handleTitleChange = useCallback((newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);

  const handleSubtitleChange = useCallback((newValue: string) => {
    setLocalSubtitle(newValue);
    handleUpdateField('subtitle', newValue);
  }, [handleUpdateField]);

  // Image management
  const handleAddImages = useCallback((mediaItems: MediaItem[]) => {
    const newImages: GalleryImage[] = mediaItems.map(item => ({
      id: crypto.randomUUID(),
      url: item.fileUrl,
      alt: item.altText || item.title || 'Gallery image',
      caption: item.description || '',
      title: item.title || ''
    }));

    const updatedImages = [...localImages, ...newImages];
    setLocalImages(updatedImages);
    handleUpdateField('images', updatedImages);
    setShowMediaSelector(false);
  }, [localImages, handleUpdateField]);

  const handleRemoveImage = useCallback((imageId: string) => {
    const updatedImages = localImages.filter(img => img.id !== imageId);
    setLocalImages(updatedImages);
    handleUpdateField('images', updatedImages);
  }, [localImages, handleUpdateField]);

  const handleUpdateImage = useCallback((imageId: string, updates: Partial<GalleryImage>) => {
    const updatedImages = localImages.map(img =>
      img.id === imageId ? { ...img, ...updates } : img
    );
    setLocalImages(updatedImages);
    handleUpdateField('images', updatedImages);
  }, [localImages, handleUpdateField]);

  // Carousel functionality
  const nextSlide = useCallback(() => {
    if (localImages.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % localImages.length);
    }
  }, [localImages.length]);

  const prevSlide = useCallback(() => {
    if (localImages.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + localImages.length) % localImages.length);
    }
  }, [localImages.length]);

  // Autoplay effect
  useEffect(() => {
    if (localAutoplay && localLayout === 'carousel' && localImages.length > 1 && !isEditing) {
      autoplayRef.current = setInterval(nextSlide, localAutoplaySpeed);
      return () => {
        if (autoplayRef.current) {
          clearInterval(autoplayRef.current);
        }
      };
    }
  }, [localAutoplay, localLayout, localImages.length, localAutoplaySpeed, nextSlide, isEditing]);

  // Lightbox functionality
  const openLightbox = useCallback((index: number) => {
    if (localEnableLightbox && !isEditing) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  }, [localEnableLightbox, isEditing]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  // Spacing classes
  const getSpacingClass = () => {
    switch (localSpacing) {
      case 'none': return 'gap-0';
      case 'small': return 'gap-2';
      case 'medium': return 'gap-4';
      case 'large': return 'gap-8';
      default: return 'gap-4';
    }
  };

  // Aspect ratio classes
  const getAspectRatioClass = () => {
    switch (localAspectRatio) {
      case 'square': return 'aspect-square';
      case 'landscape': return 'aspect-video';
      case 'portrait': return 'aspect-[3/4]';
      case 'auto': return '';
      default: return 'aspect-square';
    }
  };

  // Grid columns class
  const getColumnsClass = () => {
    switch (localColumns) {
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      case 5: return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5';
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  // Render image
  const renderImage = (image: GalleryImage, index: number) => (
    <div
      key={image.id}
      className={`relative group overflow-hidden ${getAspectRatioClass()} cursor-pointer`}
      style={{ borderRadius: `${localBorderRadius}px` }}
      onClick={() => openLightbox(index)}
    >
      <S3FilePreview
        src={image.url}
        alt={image.alt}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        width={400}
        height={400}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      
      {/* Caption/Title overlay */}
      {(localShowCaptions || localShowTitles) && (image.caption || image.title) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {localShowTitles && image.title && (
            <h4 className="font-semibold text-sm mb-1">{image.title}</h4>
          )}
          {localShowCaptions && image.caption && (
            <p className="text-xs opacity-90">{image.caption}</p>
          )}
        </div>
      )}

      {/* Edit button in editing mode */}
      {isEditing && (
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingImageId(image.id);
            }}
            className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage(image.id);
            }}
            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <TrashIcon className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );

  // Render gallery based on layout
  const renderGallery = () => {
    if (localImages.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500">No images in gallery</p>
          {isEditing && (
            <button
              onClick={() => setShowMediaSelector(true)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Images
            </button>
          )}
        </div>
      );
    }

    switch (localLayout) {
      case 'grid':
        return (
          <div className={`grid ${getColumnsClass()} ${getSpacingClass()}`}>
            {localImages.map((image, index) => renderImage(image, index))}
          </div>
        );

      case 'masonry':
        return (
          <div className={`columns-1 md:columns-2 lg:columns-${localColumns} ${getSpacingClass()}`}>
            {localImages.map((image, imageIndex) => (
              <div key={image.id} className="break-inside-avoid mb-4">
                {renderImage(image, imageIndex)}
              </div>
            ))}
          </div>
        );

      case 'carousel':
        return (
          <div className="relative" ref={carouselRef}>
            <div className="overflow-hidden rounded-lg">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {localImages.map((image) => (
                  <div key={image.id} className="w-full flex-shrink-0">
                    <div className="relative aspect-video">
                      <S3FilePreview
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                        width={800}
                        height={450}
                      />
                      {(localShowCaptions || localShowTitles) && (image.caption || image.title) && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                          {localShowTitles && image.title && (
                            <h4 className="font-semibold text-lg mb-2">{image.title}</h4>
                          )}
                          {localShowCaptions && image.caption && (
                            <p className="text-sm opacity-90">{image.caption}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            {localShowNavigation && localImages.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Dots */}
            {localShowDots && localImages.length > 1 && (
              <div className="flex justify-center mt-4 space-x-2">
                {localImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentSlide ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        );

      default:
        return renderGallery();
    }
  };

  if (isEditing) {
    return (
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
              value="layout" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Layout
            </TabsTrigger>
            <TabsTrigger 
              value="style" 
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
            >
              Style
            </TabsTrigger>
          </TabsList>

          {/* Content Tab */}
          <TabsContent value="content" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Content Settings Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Content Settings</h3>
              </div>
              <div className="pl-6 space-y-4">
                <StableInput
                  value={localTitle}
                  onChange={handleTitleChange}
                  placeholder="Gallery title..."
                  className="font-medium text-xl"
                  label="Title"
                  debounceTime={300}
                />

                <StableInput
                  value={localSubtitle}
                  onChange={handleSubtitleChange}
                  placeholder="Gallery subtitle..."
                  className="text-muted-foreground"
                  label="Subtitle"
                  debounceTime={300}
                />
              </div>
            </div>

            {/* Images Management Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Images Management</h3>
              </div>
              <div className="pl-6 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Images ({localImages.length})</label>
                  <button
                    onClick={() => setShowMediaSelector(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Images</span>
                  </button>
                </div>

                {localImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                    {localImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <S3FilePreview
                          src={image.url}
                          alt={image.alt}
                          className="w-full aspect-square object-cover rounded-lg"
                          width={150}
                          height={150}
                        />
                        <button
                          onClick={() => handleRemoveImage(image.id)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Layout Configuration Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Layout Configuration</h3>
              </div>
              <div className="pl-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Layout</label>
                    <select
                      value={localLayout}
                      onChange={(e) => {
                        const newLayout = e.target.value as 'grid' | 'masonry' | 'carousel' | 'lightbox';
                        setLocalLayout(newLayout);
                        handleUpdateField('layout', newLayout);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="grid">Grid</option>
                      <option value="masonry">Masonry</option>
                      <option value="carousel">Carousel</option>
                    </select>
                  </div>

                  {localLayout !== 'carousel' && (
                    <div>
                      <label className="text-sm font-medium block mb-2">Columns</label>
                      <select
                        value={localColumns}
                        onChange={(e) => {
                          const newColumns = parseInt(e.target.value) as 2 | 3 | 4 | 5;
                          setLocalColumns(newColumns);
                          handleUpdateField('columns', newColumns);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={2}>2 Columns</option>
                        <option value={3}>3 Columns</option>
                        <option value={4}>4 Columns</option>
                        <option value={5}>5 Columns</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">Spacing</label>
                    <select
                      value={localSpacing}
                      onChange={(e) => {
                        const newSpacing = e.target.value as 'none' | 'small' | 'medium' | 'large';
                        setLocalSpacing(newSpacing);
                        handleUpdateField('spacing', newSpacing);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="none">None</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Aspect Ratio</label>
                    <select
                      value={localAspectRatio}
                      onChange={(e) => {
                        const newAspectRatio = e.target.value as 'square' | 'landscape' | 'portrait' | 'auto';
                        setLocalAspectRatio(newAspectRatio);
                        handleUpdateField('aspectRatio', newAspectRatio);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="square">Square</option>
                      <option value="landscape">Landscape</option>
                      <option value="portrait">Portrait</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Display Options Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Display Options</h3>
              </div>
              <div className="pl-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showTitles"
                    checked={localShowTitles}
                    onChange={(e) => {
                      setLocalShowTitles(e.target.checked);
                      handleUpdateField('showTitles', e.target.checked);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="showTitles" className="text-sm">Show image titles</label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showCaptions"
                    checked={localShowCaptions}
                    onChange={(e) => {
                      setLocalShowCaptions(e.target.checked);
                      handleUpdateField('showCaptions', e.target.checked);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="showCaptions" className="text-sm">Show image captions</label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableLightbox"
                    checked={localEnableLightbox}
                    onChange={(e) => {
                      setLocalEnableLightbox(e.target.checked);
                      handleUpdateField('enableLightbox', e.target.checked);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="enableLightbox" className="text-sm">Enable lightbox</label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showImageCount"
                    checked={localShowImageCount}
                    onChange={(e) => {
                      setLocalShowImageCount(e.target.checked);
                      handleUpdateField('showImageCount', e.target.checked);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="showImageCount" className="text-sm">Show image count</label>
                </div>
              </div>
            </div>

            {/* Carousel Options Section */}
            {localLayout === 'carousel' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Carousel Options</h3>
                </div>
                <div className="pl-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoplay"
                      checked={localAutoplay}
                      onChange={(e) => {
                        setLocalAutoplay(e.target.checked);
                        handleUpdateField('autoplay', e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="autoplay" className="text-sm">Autoplay</label>
                  </div>

                  {localAutoplay && (
                    <div>
                      <label className="text-sm font-medium block mb-2">Autoplay Speed (ms)</label>
                      <input
                        type="number"
                        value={localAutoplaySpeed}
                        onChange={(e) => {
                          const speed = parseInt(e.target.value);
                          setLocalAutoplaySpeed(speed);
                          handleUpdateField('autoplaySpeed', speed);
                        }}
                        min={1000}
                        max={10000}
                        step={500}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showNavigation"
                      checked={localShowNavigation}
                      onChange={(e) => {
                        setLocalShowNavigation(e.target.checked);
                        handleUpdateField('showNavigation', e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="showNavigation" className="text-sm">Show navigation arrows</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showDots"
                      checked={localShowDots}
                      onChange={(e) => {
                        setLocalShowDots(e.target.checked);
                        handleUpdateField('showDots', e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="showDots" className="text-sm">Show dots indicator</label>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Color Settings Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-pink-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Color Settings</h3>
              </div>
              <div className="pl-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ColorSelector
                    label="Background Color"
                    value={localBackgroundColor}
                    onChange={(color) => {
                      setLocalBackgroundColor(color);
                      handleUpdateField('backgroundColor', color);
                    }}
                  />

                  <ColorSelector
                    label="Text Color"
                    value={localTextColor}
                    onChange={(color) => {
                      setLocalTextColor(color);
                      handleUpdateField('textColor', color);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Border Settings Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-teal-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Border Settings</h3>
              </div>
              <div className="pl-6 space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Border Radius</label>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    value={localBorderRadius}
                    onChange={(e) => {
                      const radius = parseInt(e.target.value);
                      setLocalBorderRadius(radius);
                      handleUpdateField('borderRadius', radius);
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0px</span>
                    <span>{localBorderRadius}px</span>
                    <span>24px</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Media Selector Modal */}
        {showMediaSelector && (
          <MediaSelector
            isOpen={showMediaSelector}
            onClose={() => setShowMediaSelector(false)}
            onSelect={(mediaItem) => handleAddImages([mediaItem])}
            title="Select Images for Gallery"
          />
        )}

        {/* Image Edit Modal */}
        {editingImageId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Edit Image</h3>
              {(() => {
                const image = localImages.find(img => img.id === editingImageId);
                if (!image) return null;
                
                return (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium block mb-2">Alt Text</label>
                      <input
                        type="text"
                        value={image.alt}
                        onChange={(e) => handleUpdateImage(editingImageId, { alt: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium block mb-2">Title</label>
                      <input
                        type="text"
                        value={image.title || ''}
                        onChange={(e) => handleUpdateImage(editingImageId, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium block mb-2">Caption</label>
                      <textarea
                        value={image.caption || ''}
                        onChange={(e) => handleUpdateImage(editingImageId, { caption: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setEditingImageId(null)}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setEditingImageId(null)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  }

  // View mode
  return (
    <div 
      className="py-16"
      style={{ 
        backgroundColor: localBackgroundColor,
        color: localTextColor 
      }}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        {(localTitle || localSubtitle) && (
          <div className="text-center mb-12">
            {localTitle && (
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{localTitle}</h2>
            )}
            {localSubtitle && (
              <p className="text-lg opacity-80 max-w-2xl mx-auto">{localSubtitle}</p>
            )}
            {localShowImageCount && localImages.length > 0 && (
              <p className="text-sm opacity-60 mt-2">
                {localImages.length} {localImages.length === 1 ? 'image' : 'images'}
              </p>
            )}
          </div>
        )}

        {/* Gallery */}
        {renderGallery()}

        {/* Lightbox */}
        {lightboxOpen && localImages.length > 0 && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="relative max-w-4xl max-h-full p-4">
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              
              <S3FilePreview
                src={localImages[lightboxIndex].url}
                alt={localImages[lightboxIndex].alt}
                className="max-w-full max-h-full object-contain"
                width={1200}
                height={800}
              />
              
              {localImages.length > 1 && (
                <>
                  <button
                    onClick={() => setLightboxIndex((prev) => (prev - 1 + localImages.length) % localImages.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setLightboxIndex((prev) => (prev + 1) % localImages.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>
                </>
              )}
              
              {(localShowTitles || localShowCaptions) && (localImages[lightboxIndex].title || localImages[lightboxIndex].caption) && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-4 rounded-lg">
                  {localShowTitles && localImages[lightboxIndex].title && (
                    <h4 className="font-semibold text-lg mb-2">{localImages[lightboxIndex].title}</h4>
                  )}
                  {localShowCaptions && localImages[lightboxIndex].caption && (
                    <p className="text-sm opacity-90">{localImages[lightboxIndex].caption}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 