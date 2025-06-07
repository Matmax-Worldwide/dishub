'use client';

import React, { useState } from 'react';
import { InfoIcon, AlignLeftIcon, FileIcon, LayoutTemplateIcon, RocketIcon, BarChartIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useI18n } from '@/hooks/useI18n';

interface PageFormContentProps {
  pageData: {
    title: string;
    slug: string;
    description: string;
    template: string;
    isPublished: boolean;
    pageType: string;
    locale: string;
    metaTitle: string;
    metaDescription: string;
    isDefault: boolean;
  };
  onChange: (name: string, value: string | boolean) => void;
  onComplete?: (completed: boolean) => void;
}

export function PageFormContent({ pageData, onChange, onComplete }: PageFormContentProps) {
  const { t, locale } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  
  // Notify parent component when we reach the last step
  React.useEffect(() => {
    if (onComplete) {
      onComplete(currentStep === totalSteps);
    }
  }, [currentStep, totalSteps, onComplete]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };
  
  const handleSelectChange = (name: string, value: string) => {
    onChange(name, value);
  };
  
  const handleCheckboxChange = (name: string, checked: boolean) => {
    onChange(name, checked);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (step: number) => {
    if (step === 1) {
      return Boolean(pageData.title && pageData.slug);
    }
    return true;
  };

  // Steps configuration
  const steps = [
    {
      id: 1,
      title: t('cms.generalInformation'),
      description: t('cms.generalInfoStepDescription') || 'Enter basic information about your page',
      icon: <FileIcon className="h-5 w-5" />
    },
    {
      id: 2,
      title: t('cms.seoSettings'),
      description: t('cms.seoStepDescription') || 'Optional: Improve SEO settings',
      icon: <BarChartIcon className="h-5 w-5" />,
      optional: true
    },
    {
      id: 3,
      title: t('cms.templateAndType'),
      description: t('cms.templateStepDescription') || 'Select template and page type',
      icon: <LayoutTemplateIcon className="h-5 w-5" />
    }
  ];

  // Steps progress indicator
  const StepIndicator = () => (
    <div className="mb-10">
      <div className="flex items-center justify-center my-4 relative">
        {/* Progress Line Background */}
        <div className="absolute h-1 bg-muted top-1/2 transform -translate-y-1/2" style={{ width: '80%', zIndex: 0 }}></div>
        
        {/* Progress Line Overlay */}
        <div 
          className="absolute h-1 bg-green-500 top-1/2 transform -translate-y-1/2 transition-all duration-500 ease-in-out" 
          style={{ 
            width: `${(Math.max(1, currentStep - 1) / (totalSteps - 1)) * 80}%`, 
            zIndex: 1 
          }}
        ></div>
        
        <div className="flex items-center justify-between w-full px-4 z-10">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div className="relative">
                {step.optional && (
                  <span className="absolute -top-6 text-xs font-medium px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full whitespace-nowrap">
                    {t('common.optional') || 'Optional'}
                  </span>
                )}
                <div 
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow cursor-pointer
                    ${step.id === currentStep
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110'
                      : step.id < currentStep
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}
                  onClick={() => {
                    if (step.id < currentStep || (step.id === 2 && isStepValid(1)) || (step.id === 3 && isStepValid(2))) {
                      setCurrentStep(step.id);
                    }
                  }}
                >
                  {step.id < currentStep ? (
                    <CheckIcon className="h-7 w-7" />
                  ) : (
                    <span className="text-base font-semibold">{step.id}</span>
                  )}
                </div>
              </div>
              <div className={`text-sm mt-3 font-medium text-center max-w-[140px] transition-colors duration-300 ${
                step.id === currentStep ? 'text-primary' : step.id < currentStep ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                {step.title}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center mt-8 bg-primary/5 p-5 rounded-lg">
        <h3 className="text-lg font-medium text-primary">
          {steps.find(s => s.id === currentStep)?.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {steps.find(s => s.id === currentStep)?.description}
        </p>
      </div>
    </div>
  );

  // Navigation buttons
  const StepNavigation = () => {
    // Check if SEO fields have content
    const hasSeoContent = currentStep === 2 && (
      Boolean(pageData.metaTitle?.trim()) || Boolean(pageData.metaDescription?.trim())
    );

    return (
      <div className="flex justify-between mt-8 pt-4 border-t">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={prevStep}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t('common.back') || 'Back'}
          </Button>
        ) : (
          <div></div>
        )}
        
        <div className="flex gap-2">
          {currentStep === 2 && (
            <>
              {hasSeoContent ? (
                <Button
                  type="button"
                  variant="default"
                  className="flex items-center gap-2"
                  onClick={nextStep}
                >
                  {t('common.next') || 'Next'}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  className="flex items-center gap-2"
                  onClick={() => {
                    // Skip SEO fields but continue to next step
                    nextStep();
                  }}
                >
                  {t('common.skip') || 'Skip'}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          
          {currentStep === 1 && (
            <Button
              type="button"
              variant="default"
              className="flex items-center gap-2"
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
            >
              {t('common.next') || 'Next'}
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          )}
          
          {currentStep === 3 && (
            // Reached last step, notify parent but don't show a button here
            <Button
              type="button"
              variant="ghost"
              className="flex items-center gap-2 opacity-0 pointer-events-none"
              tabIndex={-1}
              onClick={() => {
                if (onComplete) {
                  onComplete(true);
                }
              }}
            >
              <span className="sr-only">Complete</span>
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4 p-3 bg-gradient-to-r from-primary/10 to-transparent rounded-lg">
        <div className="flex items-center gap-2">
          <RocketIcon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">{t('cms.publication') || 'Publication'}</h3>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="isDefault"
              checked={pageData.isDefault}
              onCheckedChange={(checked) => handleCheckboxChange('isDefault', checked)}
            />
            <Label htmlFor="isDefault">{t('cms.setAsDefault') || 'Set as default page'}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublished"
              checked={pageData.isPublished}
              onCheckedChange={(checked) => handleCheckboxChange('isPublished', checked)}
            />
            <Label htmlFor="isPublished">{t('cms.publishImmediately')}</Label>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <StepIndicator />

      {/* Step 1: General Information */}
      {currentStep === 1 && (
        <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <div className="p-5 border-b flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <FileIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-medium">{t('cms.generalInformation') || 'General Information'}</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">{t('cms.pageTitle')} *</Label>
                <Input
                  id="title"
                  name="title"
                  value={pageData.title}
                  onChange={handleInputChange}
                  placeholder={t('cms.titlePlaceholder')}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium">{t('cms.pageSlug')} *</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={pageData.slug}
                  onChange={handleInputChange}
                  placeholder={t('cms.slugPlaceholder')}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-sm text-muted-foreground">
                  {t('cms.slugInfo').replace('{locale}', locale).replace('{slug}', pageData.slug || 'url-slug')}
                </p>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium">{t('cms.pageDescription')}</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={pageData.description || ''}
                  onChange={handleInputChange}
                  placeholder={t('cms.descriptionPlaceholder')}
                  rows={3}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: SEO Settings (optional) */}
      {currentStep === 2 && (
        <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <div className="p-5 border-b flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <BarChartIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-medium">{t('cms.seoSettings')}</h3>
            <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
              {t('common.optional') || 'Optional'}
            </span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="metaTitle" className="flex items-center text-sm font-medium">
                  <InfoIcon className="h-4 w-4 mr-2 text-primary" />
                  <span>{t('cms.metaTitle')}</span>
                </Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={pageData.metaTitle || ''}
                  onChange={handleInputChange}
                  placeholder={t('cms.metaTitlePlaceholder')}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription" className="flex items-center text-sm font-medium">
                  <AlignLeftIcon className="h-4 w-4 mr-2 text-primary" />
                  <span>{t('cms.metaDescription')}</span>
                </Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={pageData.metaDescription || ''}
                  onChange={handleInputChange}
                  placeholder={t('cms.metaDescriptionPlaceholder')}
                  rows={2}
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Template and Type */}
      {currentStep === 3 && (
        <div className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
          <div className="p-5 border-b flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-full">
              <LayoutTemplateIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-medium">{t('cms.templateAndType') || 'Template & Type'}</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pageType" className="text-sm font-medium">{t('cms.pageType')}</Label>
                <Select 
                  name="pageType" 
                  value={pageData.pageType} 
                  onValueChange={(value) => handleSelectChange('pageType', value)}
                >
                  <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder={t('cms.selectPageType')} />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="LANDING">Landing Page</SelectItem>
                    <SelectItem value="CONTENT">Página de contenido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="template" className="text-sm font-medium">{t('cms.pageTemplate')}</Label>
                <Select 
                  name="template" 
                  value={pageData.template || 'default'} 
                  onValueChange={(value) => handleSelectChange('template', value)}
                >
                  <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder={t('cms.selectTemplate')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Por defecto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <StepNavigation />
    </div>
  );
} 