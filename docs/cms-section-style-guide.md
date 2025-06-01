# CMS Section Components Style Guide v2.0

## Overview
This document defines the modern, standardized structure, styling, and layout patterns for all CMS section components to ensure consistency, maintainability, and optimal user experience with contemporary design principles.

## Core Principles

### 1. Modern Visual Hierarchy
- Glass morphism effects with subtle backdrop blur
- Enhanced depth with sophisticated shadow systems
- Improved color contrast and accessibility
- Contemporary spacing and typography

### 2. Optimal Space Utilization
- Adaptive height with intelligent scrolling
- Enhanced responsive design for all devices
- Smart content organization with progressive disclosure
- Efficient use of visual real estate

### 3. Professional Contemporary Appearance
- Modern glassmorphism and depth effects
- Smooth micro-interactions and transitions
- Enhanced accessibility and keyboard navigation
- Clean, minimal design with purposeful visual elements

## Modern Component Structure

### Enhanced Container Wrapper
```tsx
<div className="w-full bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5">
  {/* Enhanced tab content with modern styling */}
</div>
```

### Modern Tab System
```tsx
<Tabs defaultValue="details" className="w-full">
  <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-50 to-gray-100/80 p-2 rounded-xl border border-gray-200/50 shadow-inner">
    <TabsTrigger 
      value="details" 
      className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
    >
      Details
    </TabsTrigger>
    <TabsTrigger 
      value="styles" 
      className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
    >
      Styles
    </TabsTrigger>
    <TabsTrigger 
      value="preview" 
      className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10 data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5 rounded-lg py-3 px-6 text-sm font-semibold transition-all duration-200 hover:bg-white/60 active:scale-[0.98]"
    >
      Preview
    </TabsTrigger>
  </TabsList>

  {/* Enhanced Tab Content */}
  <TabsContent value="details" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
    {/* Details content with enhanced spacing */}
  </TabsContent>

  <TabsContent value="styles" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
    {/* Styles content with enhanced spacing */}
  </TabsContent>

  <TabsContent value="preview" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
    {/* Preview content with enhanced spacing */}
  </TabsContent>
</Tabs>
```

## Enhanced Specifications

### 1. Modern Container Classes
- **Main Wrapper**: `w-full bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5`
  - Semi-transparent white background with backdrop blur
  - Subtle border with transparency
  - Extra-large rounded corners for modern look
  - Enhanced shadow system with color-specific shadows
  - Ring border for additional depth

### 2. Enhanced Tab List Classes
- **TabsList**: `grid w-full grid-cols-3 bg-gradient-to-r from-gray-50 to-gray-100/80 p-2 rounded-xl border border-gray-200/50 shadow-inner`
  - Gradient background for visual interest
  - Increased padding for better proportions
  - Extra-large rounded corners
  - Inner shadow for depth perception
  - Subtle border with transparency

### 3. Modern Tab Trigger Classes
- **TabsTrigger**: Enhanced active states with rings, shadows, and micro-interactions
  - `data-[state=active]:bg-white` - Clean white active background
  - `data-[state=active]:shadow-md data-[state=active]:shadow-gray-900/10` - Enhanced shadow system
  - `data-[state=active]:ring-1 data-[state=active]:ring-gray-900/5` - Subtle ring for definition
  - `rounded-lg py-3 px-6` - Generous padding and rounded corners
  - `text-sm font-semibold` - Improved typography
  - `transition-all duration-200` - Smooth transitions
  - `hover:bg-white/60` - Subtle hover state
  - `active:scale-[0.98]` - Micro-interaction on click

### 4. Enhanced Tab Content Classes
- **TabsContent**: `p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100`
  - Increased padding for better breathing room (32px)
  - Enhanced spacing between elements (32px)
  - Slightly increased maximum height (650px)
  - Custom scrollbar styling for better aesthetics

## Content Organization Enhancement

### Details Tab - Enhanced Structure
```tsx
const DetailsTab = () => (
  <div className="space-y-8">
    {/* Enhanced section grouping */}
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">Basic Configuration</h3>
      </div>
      <div className="pl-6 space-y-4">
        {/* Form fields with enhanced spacing */}
      </div>
    </div>
    
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">Advanced Options</h3>
      </div>
      <div className="pl-6 space-y-4">
        {/* Advanced configuration options */}
      </div>
    </div>
  </div>
);
```

### Styles Tab - Enhanced Structure
```tsx
const StylesTab = () => (
  <div className="space-y-8">
    {/* Color & Visual Section */}
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">Colors & Appearance</h3>
      </div>
      <div className="pl-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Color controls in responsive grid */}
      </div>
    </div>
    
    {/* Layout & Spacing Section */}
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">Layout & Spacing</h3>
      </div>
      <div className="pl-6 space-y-4">
        {/* Layout controls */}
      </div>
    </div>
  </div>
);
```

### Preview Tab - Enhanced Structure
```tsx
const PreviewTab = () => (
  <div className="space-y-8">
    {/* Interactive Preview */}
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Device size toggles */}
          <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Monitor className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Tablet className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
        {/* Preview content */}
      </div>
    </div>
  </div>
);
```

## Implementation Plan

### Phase 1: Core Components (High Priority)
1. **HeroSection.tsx** - Most visible, user-facing component
2. **FormSection.tsx** - Critical functionality component
3. **VideoSection.tsx** - Media-rich component
4. **BlogSection.tsx** - Content-heavy component

### Phase 2: Feature Components (Medium Priority)
5. **GallerySection.tsx** - Visual showcase component
6. **BenefitSection.tsx** - Marketing/feature component
7. **FooterSection.tsx** - Layout component
8. **FeatureSection.tsx** - Landing page component

### Phase 3: Utility Components (Lower Priority)
9. **CtaButtonSection.tsx** - Simple action component
10. **TextSection.tsx** - Basic content component
11. **ImageSection.tsx** - Media component
12. **ArticleSection.tsx** - Content component
13. **TestimonialSection.tsx** - Social proof component
14. **CardSection.tsx** - Layout component

## Enhanced Migration Checklist

- [ ] Wrap editing interface in modernized container
- [ ] Implement enhanced three-tab structure
- [ ] Apply modern class names and styling patterns
- [ ] Set adaptive height with custom scrollbars
- [ ] Organize content with enhanced section headers
- [ ] Add micro-interactions and transitions
- [ ] Implement responsive grid layouts where appropriate
- [ ] Test accessibility with keyboard navigation
- [ ] Verify color contrast ratios
- [ ] Test on multiple device sizes

## Modern Benefits

### Enhanced Developer Experience
- Consistent modern codebase structure
- Improved debugging with better visual hierarchy
- Faster development with standardized patterns
- Better code maintainability

### Superior User Experience
- Modern, polished interface
- Improved accessibility and navigation
- Better visual feedback and micro-interactions
- Consistent interaction patterns across all components

### Advanced Design System
- Contemporary visual language
- Scalable modern design patterns
- Enhanced quality assurance
- Professional, cutting-edge appearance

---

*This modernized style guide incorporates contemporary design principles and should be implemented across all CMS section components for a cohesive, professional user experience.* 