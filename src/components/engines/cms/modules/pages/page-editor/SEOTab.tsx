import React, { useEffect, useState } from 'react';
import { InfoIcon, AlignLeftIcon, GlobeIcon, ChevronRightIcon, Link2Icon, HashIcon, TwitterIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageData } from '@/types/cms';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Extend PageData with the seo property
interface PageDataWithSEO extends PageData {
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown>;
  };
}

interface SEOTabProps {
  pageData: PageDataWithSEO;
  locale: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSEOChange?: (path: string, value: string) => void;
  onBackClick: () => void;
  onContinue: () => void;
}

export const SEOTab: React.FC<SEOTabProps> = ({
  pageData,
  locale,
  onInputChange,
  onSEOChange,
  onBackClick,
  onContinue,
}) => {
  // Add extra safety - ensure seo is an object even if it's null or undefined
  const seo = pageData?.seo || {};
  
  // State to track field changes for better feedback
  const [fieldChanged, setFieldChanged] = useState<{
    field: string;
    time: number;
  } | null>(null);

  // Add debug state
  const [showDebug, setShowDebug] = useState(true);
  
  // Toggle debug mode
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  // Log SEO data for debugging
  useEffect(() => {
    console.log('=== DEBUG SEOTab ===');
    console.log('PageData in SEOTab:', pageData);
    console.log('metaTitle:', pageData.metaTitle);
    console.log('metaDescription:', pageData.metaDescription);
    console.log('seo object:', pageData.seo);
    console.log('typeof seo:', typeof pageData.seo);
    console.log('Has seo property:', pageData.hasOwnProperty('seo'));
    console.log('seo.title:', pageData.seo?.title);
    console.log('seo.description:', pageData.seo?.description);
    console.log('=== END DEBUG SEOTab ===');
  }, [pageData]);

  // Handle SEO field changes
  const handleSEOChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Set the field that changed to show the sync message
    setFieldChanged({
      field: name,
      time: Date.now()
    });
    
    // Clear the change notification after 2 seconds
    setTimeout(() => {
      setFieldChanged(null);
    }, 2000);
    
    // Check if this is a nested SEO property
    if (name.startsWith('seo.')) {
      // If parent component provided a handler, use it
      if (onSEOChange) {
        onSEOChange(name, value);
      } else {
        // Otherwise fallback to default input handler
        onInputChange(e);
      }
    } else {
      // Regular page property
      onInputChange(e);
    }
  };

  // Determine if fields are synced for visual feedback - with safety checks
  const isMetaTitleSynced = pageData.metaTitle === seo?.title && pageData.metaTitle !== '';
  const isMetaDescriptionSynced = pageData.metaDescription === seo?.description && pageData.metaDescription !== '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>SEO Information</CardTitle>
          <CardDescription>
            Configure how your page will appear in search results and on social media.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleDebug}
          className="text-xs"
        >
          {showDebug ? "Hide Debug" : "Show Debug"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Debug information */}
        {showDebug && (
          <div className="mb-4 p-3 bg-slate-100 rounded-md border border-slate-300 overflow-auto max-h-60">
            <h4 className="text-sm font-semibold mb-2">Debug Information:</h4>
            <pre className="text-xs">
              {JSON.stringify({
                pageData_metaTitle: pageData.metaTitle,
                pageData_metaDescription: pageData.metaDescription,
                seo_exists: Boolean(pageData.seo),
                seo_title: pageData.seo?.title,
                seo_description: pageData.seo?.description,
                isMetaTitleSynced,
                isMetaDescriptionSynced,
                typeof_seo: typeof pageData.seo,
                pageData_id: pageData.id,
                pageData_hasOwnSeo: pageData.hasOwnProperty('seo'),
              }, null, 2)}
            </pre>
          </div>
        )}

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General SEO</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 pt-4">
            {/* Synchronization notice */}
            <div className="bg-muted/30 border border-muted/50 rounded-md p-3 mb-4">
              <p className="text-sm text-muted-foreground">
                Both sets of SEO fields are synchronized with each other. Changes to meta fields will update SEO fields and vice versa.
              </p>
            </div>
          
            {/* Meta Title */}
            <div className="space-y-2">
              <Label htmlFor="metaTitle" className="flex items-center">
                <InfoIcon className="h-4 w-4 mr-2" />
                <span>Meta Title</span>
                {isMetaTitleSynced && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    Synced with SEO Title
                  </span>
                )}
                {fieldChanged?.field === 'metaTitle' && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full animate-pulse">
                    Updating SEO Title...
                  </span>
                )}
              </Label>
              <Input
                id="metaTitle"
                name="metaTitle"
                value={pageData.metaTitle || ''}
                onChange={handleSEOChange}
                placeholder="Title for search engines"
              />
              <p className="text-sm text-muted-foreground">
                {!pageData.metaTitle && "If left empty, the page title will be used"}
              </p>
            </div>
            
            {/* SEO Title (from PageSEO) */}
            <div className="space-y-2">
              <Label htmlFor="seoTitle" className="flex items-center">
                <InfoIcon className="h-4 w-4 mr-2" />
                <span>SEO Title</span>
                {isMetaTitleSynced && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    Synced with Meta Title
                  </span>
                )}
                {fieldChanged?.field === 'seo.title' && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full animate-pulse">
                    Updating Meta Title...
                  </span>
                )}
              </Label>
              <Input
                id="seoTitle"
                name="seo.title"
                value={seo?.title || ''}
                onChange={handleSEOChange}
                placeholder="SEO Title (stored in PageSEO)"
              />
              <p className="text-sm text-muted-foreground">
                This will be synchronized with Meta Title
              </p>
            </div>
            
            {/* Meta Description */}
            <div className="space-y-2">
              <Label htmlFor="metaDescription" className="flex items-center">
                <AlignLeftIcon className="h-4 w-4 mr-2" />
                <span>Meta Description</span>
                {isMetaDescriptionSynced && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    Synced with SEO Description
                  </span>
                )}
                {fieldChanged?.field === 'metaDescription' && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full animate-pulse">
                    Updating SEO Description...
                  </span>
                )}
              </Label>
              <Textarea
                id="metaDescription"
                name="metaDescription"
                value={pageData.metaDescription || ''}
                onChange={handleSEOChange}
                placeholder="Description for search engines"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                {!pageData.metaDescription && "If left empty, the page description will be used"}
              </p>
            </div>
            
            {/* SEO Description (from PageSEO) */}
            <div className="space-y-2">
              <Label htmlFor="seoDescription" className="flex items-center">
                <AlignLeftIcon className="h-4 w-4 mr-2" />
                <span>SEO Description</span>
                {isMetaDescriptionSynced && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    Synced with Meta Description
                  </span>
                )}
                {fieldChanged?.field === 'seo.description' && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full animate-pulse">
                    Updating Meta Description...
                  </span>
                )}
              </Label>
              <Textarea
                id="seoDescription"
                name="seo.description"
                value={seo?.description || ''}
                onChange={handleSEOChange}
                placeholder="SEO Description (stored in PageSEO)"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                This will be synchronized with Meta Description
              </p>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords" className="flex items-center">
                <HashIcon className="h-4 w-4 mr-2" />
                <span>Keywords</span>
              </Label>
              <Input
                id="keywords"
                name="seo.keywords"
                value={seo?.keywords || ''}
                onChange={handleSEOChange}
                placeholder="keyword1, keyword2, keyword3"
              />
              <p className="text-sm text-muted-foreground">
                Comma-separated keywords
              </p>
            </div>

            {/* Featured Image / OG Image fallback */}
            <div className="space-y-2">
              <Label htmlFor="featuredImage" className="flex items-center">
                <GlobeIcon className="h-4 w-4 mr-2" />
                <span>Featured Image URL</span>
              </Label>
              <Input
                id="featuredImage"
                name="featuredImage"
                value={pageData.featuredImage || ''}
                onChange={onInputChange}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-sm text-muted-foreground">
                Used as default image for social sharing
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="social" className="space-y-4 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Open Graph (Facebook/LinkedIn)</h3>
              <div className="space-y-2">
                <Label htmlFor="ogTitle">OG Title</Label>
                <Input
                  id="ogTitle"
                  name="seo.ogTitle"
                  value={seo?.ogTitle || ''}
                  onChange={handleSEOChange}
                  placeholder="Title for Facebook/LinkedIn sharing"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ogDescription">OG Description</Label>
                <Textarea
                  id="ogDescription"
                  name="seo.ogDescription"
                  value={seo?.ogDescription || ''}
                  onChange={handleSEOChange}
                  placeholder="Description for Facebook/LinkedIn sharing"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ogImage">OG Image URL</Label>
                <Input
                  id="ogImage"
                  name="seo.ogImage"
                  value={seo?.ogImage || ''}
                  onChange={handleSEOChange}
                  placeholder="https://example.com/og-image.jpg"
                />
                <p className="text-sm text-muted-foreground">
                  If left empty, featured image will be used
                </p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <TwitterIcon className="h-4 w-4 mr-2" />
                Twitter Card
              </h3>
              <div className="space-y-2">
                <Label htmlFor="twitterTitle">Twitter Title</Label>
                <Input
                  id="twitterTitle"
                  name="seo.twitterTitle"
                  value={seo?.twitterTitle || ''}
                  onChange={handleSEOChange}
                  placeholder="Title for Twitter sharing"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitterDescription">Twitter Description</Label>
                <Textarea
                  id="twitterDescription"
                  name="seo.twitterDescription"
                  value={seo?.twitterDescription || ''}
                  onChange={handleSEOChange}
                  placeholder="Description for Twitter sharing"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitterImage">Twitter Image URL</Label>
                <Input
                  id="twitterImage"
                  name="seo.twitterImage"
                  value={seo?.twitterImage || ''}
                  onChange={handleSEOChange}
                  placeholder="https://example.com/twitter-image.jpg"
                />
                <p className="text-sm text-muted-foreground">
                  If left empty, OG image or featured image will be used
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4 pt-4">
            {/* Canonical URL */}
            <div className="space-y-2">
              <Label htmlFor="canonicalUrl" className="flex items-center">
                <Link2Icon className="h-4 w-4 mr-2" />
                <span>Canonical URL</span>
              </Label>
              <Input
                id="canonicalUrl"
                name="seo.canonicalUrl"
                value={seo?.canonicalUrl || ''}
                onChange={handleSEOChange}
                placeholder="https://example.com/canonical-page"
              />
              <p className="text-sm text-muted-foreground">
                Set a canonical URL if this content exists elsewhere
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Search result preview */}
        <div className="mt-8 border border-border rounded-lg p-4 bg-muted/20">
          <h3 className="text-sm font-medium text-foreground mb-2">Search Result Preview</h3>
          <div className="p-4 border border-border rounded bg-background">
            <div className="text-blue-600 text-lg font-medium line-clamp-1">
              {pageData.metaTitle || seo?.title || pageData.title || 'Page Title'}
            </div>
            <div className="text-green-600 text-sm line-clamp-1">
              {`/${locale}/${pageData.slug || 'page-url'}`}
            </div>
            <div className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {pageData.metaDescription || seo?.description || pageData.description || 'Page description...'}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBackClick}>
          Back to Details
        </Button>
        <Button onClick={onContinue} className="flex items-center">
          <span>Continue to Sections</span>
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SEOTab; 