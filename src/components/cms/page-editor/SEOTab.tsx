import React from 'react';
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
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
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
  // Extract SEO data from the pageData
  const seo = pageData.seo || {};

  // Handle SEO field changes
  const handleSEOChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Check if this is a nested SEO property
    if (name.startsWith('seo.')) {
      const seoProperty = name.replace('seo.', '');
      
      // If parent component provided a handler, use it
      if (onSEOChange) {
        onSEOChange(seoProperty, value);
      } else {
        // Otherwise fallback to default input handler
        onInputChange(e);
      }
    } else {
      // Regular page property
      onInputChange(e);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SEO Information</CardTitle>
        <CardDescription>
          Configure how your page will appear in search results and on social media.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General SEO</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 pt-4">
            {/* Meta Title */}
            <div className="space-y-2">
              <Label htmlFor="metaTitle" className="flex items-center">
                <InfoIcon className="h-4 w-4 mr-2" />
                <span>Meta Title</span>
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
            
            {/* Meta Description */}
            <div className="space-y-2">
              <Label htmlFor="metaDescription" className="flex items-center">
                <AlignLeftIcon className="h-4 w-4 mr-2" />
                <span>Meta Description</span>
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

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords" className="flex items-center">
                <HashIcon className="h-4 w-4 mr-2" />
                <span>Keywords</span>
              </Label>
              <Input
                id="keywords"
                name="seo.keywords"
                value={seo.keywords || ''}
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
                onChange={handleSEOChange}
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
                  value={seo.ogTitle || ''}
                  onChange={handleSEOChange}
                  placeholder="Title for Facebook/LinkedIn sharing"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ogDescription">OG Description</Label>
                <Textarea
                  id="ogDescription"
                  name="seo.ogDescription"
                  value={seo.ogDescription || ''}
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
                  value={seo.ogImage || ''}
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
                  value={seo.twitterTitle || ''}
                  onChange={handleSEOChange}
                  placeholder="Title for Twitter sharing"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="twitterDescription">Twitter Description</Label>
                <Textarea
                  id="twitterDescription"
                  name="seo.twitterDescription"
                  value={seo.twitterDescription || ''}
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
                  value={seo.twitterImage || ''}
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
                value={seo.canonicalUrl || ''}
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
              {pageData.metaTitle || pageData.title || 'Page Title'}
            </div>
            <div className="text-green-600 text-sm line-clamp-1">
              {`/${locale}/${pageData.slug || 'page-url'}`}
            </div>
            <div className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {pageData.metaDescription || pageData.description || 'Page description...'}
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