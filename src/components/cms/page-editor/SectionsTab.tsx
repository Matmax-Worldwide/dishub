import React, { useState, useEffect } from 'react';
import { SaveIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ManageableSection from '@/components/cms/ManageableSection';
import { Section, ManageableSectionHandle } from '@/types/cms';
import EmptySectionPlaceholder from './EmptySectionPlaceholder';
import { DEFAULT_STYLING } from '@/types/cms-styling';
import { useI18n } from '@/hooks/useI18n';

interface SectionsTabProps {
  pageSections: Section[];
  isSaving: boolean;
  isCreatingSection: boolean;
  isSavingSection: boolean;
  newSectionName: string;
  onNameChange: (name: string) => void;
  onCreateSection: () => Promise<boolean>;
  onCancelCreate: () => void;
  onStartCreating: () => void;
  onSectionNameChange: (name: string) => void;
  onBackClick: () => void;
  onSavePage: () => Promise<boolean>;
  sectionRef: React.RefObject<ManageableSectionHandle>;
  fetchSections: () => void;
}

// Available component types with translation keys
const AVAILABLE_COMPONENTS = [
  { 
    type: 'hero', 
    displayType: 'Hero', 
    nameKey: 'sections.components.hero.name',
    descriptionKey: 'sections.components.hero.description'
  },
  { 
    type: 'benefit', 
    displayType: 'Benefit', 
    nameKey: 'sections.components.benefit.name',
    descriptionKey: 'sections.components.benefit.description'
  },
  { 
    type: 'header', 
    displayType: 'Header', 
    nameKey: 'sections.components.header.name',
    descriptionKey: 'sections.components.header.description'
  },
  { 
    type: 'text', 
    displayType: 'Text', 
    nameKey: 'sections.components.text.name',
    descriptionKey: 'sections.components.text.description'
  },
  { 
    type: 'image', 
    displayType: 'Image', 
    nameKey: 'sections.components.image.name',
    descriptionKey: 'sections.components.image.description'
  },
  { 
    type: 'card', 
    displayType: 'Card', 
    nameKey: 'sections.components.card.name',
    descriptionKey: 'sections.components.card.description'
  },
  { 
    type: 'feature', 
    displayType: 'Feature', 
    nameKey: 'sections.components.feature.name',
    descriptionKey: 'sections.components.feature.description'
  },
  { 
    type: 'testimonial', 
    displayType: 'Testimonial', 
    nameKey: 'sections.components.testimonial.name',
    descriptionKey: 'sections.components.testimonial.description'
  },
  { 
    type: 'form', 
    displayType: 'Form', 
    nameKey: 'sections.components.form.name',
    descriptionKey: 'sections.components.form.description'
  },
  { 
    type: 'article', 
    displayType: 'Article', 
    nameKey: 'sections.components.article.name',
    descriptionKey: 'sections.components.article.description'
  },
  { 
    type: 'blog', 
    displayType: 'Blog', 
    nameKey: 'sections.components.blog.name',
    descriptionKey: 'sections.components.blog.description'
  },
  { 
    type: 'cta', 
    displayType: 'CtaButton', 
    nameKey: 'sections.components.cta.name',
    descriptionKey: 'sections.components.cta.description'
  },
  { 
    type: 'video', 
    displayType: 'Video', 
    nameKey: 'sections.components.video.name',
    descriptionKey: 'sections.components.video.description'
  },
  {
    type: 'gallery',
    displayType: 'Gallery',
    nameKey: 'sections.components.gallery.name',
    descriptionKey: 'sections.components.gallery.description'
  },
  {
    type: 'calendar',
    displayType: 'Calendar',
    nameKey: 'sections.components.calendar.name',
    descriptionKey: 'sections.components.calendar.description'
  }
];

export const SectionsTab: React.FC<SectionsTabProps> = ({
  pageSections,
  isSaving,
  isCreatingSection,
  isSavingSection,
  newSectionName,
  onNameChange,
  onCreateSection,
  onCancelCreate,
  onStartCreating,
  onSectionNameChange,
  onBackClick,
  onSavePage,
  sectionRef,
  fetchSections
}) => {
  const { t } = useI18n();
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  
  // Monitor pageSections prop changes
  useEffect(() => {
    console.log('[SectionsTab] pageSections prop updated:', pageSections.length, 'sections');
    if (pageSections.length > 0) {
      console.log('[SectionsTab] Showing ManageableSection for:', pageSections[0].sectionId);
    } else {
      console.log('[SectionsTab] No sections, showing EmptySectionPlaceholder');
    }
  }, [pageSections]);
  
  // Listen for event to open dialog from SectionManager
  useEffect(() => {
    const handleRequestAddComponent = () => {
      console.log('[SectionsTab] 📣 Receiving request to add component');
      setIsAddComponentOpen(true);
    };
    
    document.addEventListener('section:request-add-component', handleRequestAddComponent);
    
    return () => {
      document.removeEventListener('section:request-add-component', handleRequestAddComponent);
    };
  }, []);
  
  // Handler to create section and update
  const handleCreateSectionAndFetch = async () => {
    console.log('[SectionsTab] Starting section creation...');
    
    // Call the original function to create section
    const success = await onCreateSection();
    
    if (success) {
      console.log('[SectionsTab] ✅ Section created successfully');
      
      // We don't need to dispatch additional events here because
      // the PageEditor already updates the state directly in handleCreateSection
      // We just need to ensure the component re-renders
      
      // Optional: reload data from server in background
      if (fetchSections) {
        console.log('[SectionsTab] Fetching updated sections from server...');
        setTimeout(() => {
          fetchSections();
        }, 1000); // Give time for UI to update first
      }
    } else {
      console.log('[SectionsTab] ❌ Error creating section');
        }
    
    return success;
  };
  
  // Function to add a component
  const handleAddComponent = (componentType: string, displayType: string) => {
    // Only proceed if we have a section reference
    if (!sectionRef.current) {
      console.error('[SectionsTab] ❌ No active section or ref not available');
      return;
    }
    
    console.log(`[SectionsTab] 🛠️ Attempting to create component: ${componentType}/${displayType}`);
    
    // Generate a truly unique ID using crypto if available
    const generateUniqueId = () => {
      try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
      } catch (error) {
        console.error('[SectionsTab] ❌ Error generating UUID:', error);
      }
      return `component-${componentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };
    
    // Generate the unique ID
    const componentId = generateUniqueId();
    console.log(`[SectionsTab] 🔑 Generated component ID: ${componentId}`);
    
    // Get initial data for the component type
    const getInitialData = (type: string) => {
      const baseData = {
        styling: DEFAULT_STYLING, // Add default styling to all components
      };

      switch (type) {
        case 'header':
          return {
            ...baseData,
            componentTitle: t('sections.components.header.defaultTitle'),
            title: t('sections.components.header.defaultMainTitle'), 
            subtitle: t('sections.components.header.defaultSubtitle')
          };
        case 'text':
          return {
            ...baseData,
            componentTitle: t('sections.components.text.defaultTitle'),
            title: t('sections.components.text.defaultContentTitle'),
            content: t('sections.components.text.defaultContent')
          };
        case 'image':
          return {
            ...baseData,
            componentTitle: t('sections.components.image.defaultTitle'),
            alt: t('sections.components.image.defaultAlt'),
            caption: t('sections.components.image.defaultCaption'),
            src: '' // URL of the image
          };
        case 'card':
          return {
            ...baseData,
            componentTitle: t('sections.components.card.defaultTitle'),
            title: t('sections.components.card.defaultCardTitle'),
            description: t('sections.components.card.defaultDescription'),
            buttonText: t('sections.components.card.defaultButtonText'),
            link: '#'
          };
        case 'feature':
          return {
            ...baseData,
            componentTitle: t('sections.components.feature.defaultTitle'),
            title: t('sections.components.feature.defaultFeatureTitle'),
            description: t('sections.components.feature.defaultDescription'),
            icon: 'star'
          };
        case 'testimonial':
          return {
            ...baseData,
            componentTitle: t('sections.components.testimonial.defaultTitle'),
            quote: t('sections.components.testimonial.defaultQuote'),
            author: t('sections.components.testimonial.defaultAuthor'),
            role: t('sections.components.testimonial.defaultRole')
          };
        case 'hero':
          return {
            ...baseData,
            componentTitle: t('sections.components.hero.defaultTitle'),
            title: t('sections.components.hero.defaultHeroTitle'), 
            subtitle: t('sections.components.hero.defaultHeroSubtitle'),
            image: '',
            cta: { text: t('sections.components.hero.defaultCtaText'), url: '#' }
          };
        case 'benefit':
          return {
            ...baseData,
            componentTitle: t('sections.components.benefit.defaultTitle'),
            title: t('sections.components.benefit.defaultBenefitTitle'),
            description: t('sections.components.benefit.defaultDescription'),
            iconType: 'check',
            accentColor: '#01319c',
            backgroundColor: 'from-[#ffffff] to-[#f0f9ff]',
            showGrid: true,
            showDots: true
          };
        case 'gallery':
          return {
            ...baseData,
            componentTitle: t('sections.components.gallery.defaultTitle'),
            title: t('sections.components.gallery.defaultGalleryTitle'),
            images: [],
          };
        default:
          return {
            ...baseData,
            componentTitle: t('sections.components.default.title'),
            title: t('sections.components.default.componentTitle')
          };
      }
    };
    
    // Get the initial data for the component
    const initialData = getInitialData(componentType);
    
    // Create the new component object
    const newComponent = {
      id: componentId,
      type: displayType, // Use the correct type for SectionManager
      data: initialData,
      // Do not include title directly, only in data
      // The title for UI will be displayed from data.componentTitle
    };
    
    // Dispatch the event for SectionManager to catch
    console.log('[SectionsTab] 🚀 Adding new component:', newComponent);
    document.dispatchEvent(new CustomEvent('component:add', { detail: newComponent }));
    
    // Close the dialog
    setIsAddComponentOpen(false);
    
    // Save the component without forcing a full reload
    setTimeout(async () => {
      try {
        console.log('[SectionsTab] 💾 Saving component without reloading...');
        await sectionRef.current?.saveChanges(true);
        console.log('[SectionsTab] ✅ Component saved successfully');
        // We don't call onRefreshView() to avoid full reload
      } catch (error) {
        console.error('[SectionsTab] ❌ Error saving component:', error);
      }
    }, 500);
  };

  return (
    <Card className="border-none shadow-none pb-4">
      <CardContent className="px-0">
        {pageSections.length > 0 ? (
          <div className="rounded-lg">
            <ManageableSection
              ref={sectionRef}
              sectionId={pageSections[0]?.sectionId || ''}
              sectionName={pageSections[0]?.name}
              onSectionNameChange={onSectionNameChange}
              isEditing={true}
            />
          </div>
        ) : (
          <EmptySectionPlaceholder
            isCreatingSection={isCreatingSection}
            isSavingSection={isSavingSection}
            newSectionName={newSectionName}
            onNameChange={onNameChange}
            onCreateSection={handleCreateSectionAndFetch}
            onCancelCreate={onCancelCreate}
            onStartCreating={onStartCreating}
          />
        )}
      </CardContent>
      <CardFooter className="px-0 flex justify-between">
        <Button variant="outline" onClick={onBackClick}>
          {t('sections.actions.backToDetails')}
        </Button>
        <Button 
          variant="default" 
          onClick={onSavePage}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full mr-1"></span>
              <span>{t('sections.actions.saving')}</span>
            </>
          ) : (
            <>
              <SaveIcon className="h-4 w-4 mr-1" />
              <span>{t('sections.actions.saveChanges')}</span>
            </>
          )}
        </Button>
      </CardFooter>
      
      {/* Dialog to add components */}
      <Dialog open={isAddComponentOpen} onOpenChange={setIsAddComponentOpen}>
        <DialogContent className="sm:max-w-md z-[9999]">
          <DialogHeader>
            <DialogTitle>{t('sections.addComponent.title')}</DialogTitle>
            <DialogDescription>
              {t('sections.addComponent.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {AVAILABLE_COMPONENTS.map((component) => (
              <Button
                key={component.type}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center justify-center text-center"
                onClick={() => handleAddComponent(component.type, component.displayType)}
              >
                <span className="font-medium mb-1">{t(component.nameKey)}</span>
                <span className="text-xs text-gray-500">{t(component.descriptionKey)}</span>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddComponentOpen(false)}>
              {t('sections.addComponent.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SectionsTab; 