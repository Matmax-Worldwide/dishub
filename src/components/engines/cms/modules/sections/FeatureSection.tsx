import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import StableInput from './StableInput';
import IconSelector from '@/components/engines/cms/ui/selectors/IconSelector';
import StyleControls from '@/components/engines/cms/StyleControls';
import {  
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import * as LucideIcons from 'lucide-react';
import { 
  ComponentStyling, 
  ComponentStyleProps, 
  DEFAULT_STYLING,
  generateStylesFromStyling,
  generateClassesFromStyling
} from '@/types/cms-styling';

interface FeatureSectionProps extends ComponentStyleProps {
  title: string;
  description: string;
  icon: string;
  styling?: ComponentStyling;
  isEditing?: boolean;
  onUpdate?: (data: { 
    title: string; 
    description: string; 
    icon: string;
    styling?: ComponentStyling;
  }) => void;
}

const FeatureSection = React.memo(function FeatureSection({ 
  title, 
  description, 
  icon = 'Star',
  styling = DEFAULT_STYLING,
  isEditing = false,
  onUpdate
}: FeatureSectionProps) {
  // Local state to maintain during typing
  const [localTitle, setLocalTitle] = useState(title);
  const [localDescription, setLocalDescription] = useState(description);
  const [localIcon, setLocalIcon] = useState(icon);
  const [localStyling, setLocalStyling] = useState<ComponentStyling>(styling);
  
  // Track if we're actively editing to prevent props from overriding local state
  const isEditingRef = useRef(false);
  
  // Optimize debounce updates
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update local state when props change but only if not currently editing
  useEffect(() => {
    if (!isEditingRef.current) {
      if (title !== localTitle) setLocalTitle(title);
      if (description !== localDescription) setLocalDescription(description);
      if (icon !== localIcon) setLocalIcon(icon);
      if (styling && JSON.stringify(styling) !== JSON.stringify(localStyling)) {
        setLocalStyling(styling);
      }
    }
  }, [title, description, icon, styling, localTitle, localDescription, localIcon, localStyling]);
  
  // Get the icon component from the icon name
  const IconComponent = (LucideIcons[localIcon as keyof typeof LucideIcons] as React.ElementType) || LucideIcons.Star;
  
  // Optimize update handler with useCallback and debouncing
  const handleUpdateField = useCallback((field: string, value: string | ComponentStyling) => {
    if (onUpdate) {
      // Mark that we're in editing mode
      isEditingRef.current = true;
      
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Prepare data to update
      const updateData = {
        title: localTitle,
        description: localDescription,
        icon: localIcon,
        styling: localStyling,
        [field]: value
      };
      
      // Set timeout to update parent
      debounceRef.current = setTimeout(() => {
        onUpdate(updateData);
        
        // Reset editing flag after a short delay
        setTimeout(() => {
          isEditingRef.current = false;
        }, 500);
      }, 200);
    }
  }, [onUpdate, localTitle, localDescription, localIcon, localStyling]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Individual change handlers to maintain state locally
  const handleTitleChange = useCallback((newValue: string) => {
    setLocalTitle(newValue);
    handleUpdateField('title', newValue);
  }, [handleUpdateField]);
  
  const handleDescriptionChange = useCallback((newValue: string) => {
    setLocalDescription(newValue);
    handleUpdateField('description', newValue);
  }, [handleUpdateField]);
  
  const handleIconChange = useCallback((newValue: string) => {
    setLocalIcon(newValue);
    handleUpdateField('icon', newValue);
  }, [handleUpdateField]);

  const handleStylingChange = useCallback((newStyling: ComponentStyling) => {
    setLocalStyling(newStyling);
    handleUpdateField('styling', newStyling);
  }, [handleUpdateField]);

  // Generate styles and classes from styling
  const inlineStyles = generateStylesFromStyling(localStyling);
  const cssClasses = generateClassesFromStyling(localStyling);
  
  if (isEditing) {
    return (
      <div className="w-full bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-lg shadow-gray-900/5 ring-1 ring-gray-900/5">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-50 to-gray-100/80 p-2 rounded-xl border border-gray-200/50 shadow-inner">
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
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Feature Content</h3>
              </div>
              <div className="pl-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Icon
                  </label>
                  <IconSelector 
                    selectedIcon={localIcon}
                    onSelectIcon={handleIconChange}
                  />
                </div>
                
                <StableInput
                  value={localTitle}
                  onChange={handleTitleChange}
                  placeholder="Enter feature title..."
                  className="font-medium text-foreground"
                  label="Title"
                  debounceTime={300}
                />
                
                <StableInput
                  value={localDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Enter feature description..."
                  isTextArea={true}
                  rows={3}
                  className="text-muted-foreground text-sm"
                  label="Description"
                  debounceTime={300}
                />
              </div>
            </div>
          </TabsContent>

          {/* STYLING TAB */}
          <TabsContent value="styling" className="p-8 space-y-8 max-h-[650px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <StyleControls
              styling={localStyling}
              onStylingChange={handleStylingChange}
              showAdvanced={true}
            />
          </TabsContent>

          {/* PREVIEW TAB */}
          <TabsContent value="preview" className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
              </div>
              <div className="pl-6 space-y-4">
                <div className="bg-card p-4 rounded-md">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-muted rounded-full text-primary mb-4">
                      <IconComponent className="h-10 w-10" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">{localTitle}</h3>
                    <p className="text-muted-foreground max-w-md text-sm">{localDescription}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "max-w-4xl mx-auto",
        cssClasses
      )}
      style={inlineStyles}
    >
      <div className="flex flex-col items-center text-center">
        <div className="p-3 bg-muted rounded-full text-primary mb-4">
          <IconComponent className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-medium text-foreground mb-2">{localTitle}</h3>
        <p className="text-muted-foreground max-w-md">{localDescription}</p>
      </div>
    </div>
  );
});

export default FeatureSection; 