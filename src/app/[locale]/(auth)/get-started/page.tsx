"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, gql } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, User, Building, Eye, EyeOff, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { 
  ALL_FEATURES_CONFIG,
  getEngineById, 
  addFeatureWithDependencies, 
  removeFeatureWithDependents,
  getRequiredFeatures
} from '@/config/engines';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { useI18n } from '@/hooks/useI18n';

const REGISTER_USER_WITH_TENANT = gql`
  mutation RegisterUserWithTenant($input: RegisterUserWithTenantInput!) {
    registerUserWithTenant(input: $input) {
      token
      user {
        id
        email
        firstName
        lastName
        phoneNumber
        role {
          id
          name
          description
        }
        userTenants {
          tenantId
          role
        }
        createdAt
        updatedAt
      }
      tenant {
        id
        name
        slug
        domain
        status
        features
        createdAt
        updatedAt
      }
    }
  }
`;

interface UserData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface TenantData {
  tenantName: string;
  tenantSlug: string;
  tenantDomain: string;
  tenantFeatures: string[];
}

interface FormData extends UserData, TenantData {}

const STORAGE_KEY = 'register_form_progress';

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;secure;samesite=strict`;
}

export default function GetStartedPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    tenantName: '',
    tenantSlug: '',
    tenantDomain: '',
    tenantFeatures: getRequiredFeatures(),
  });

  const [registerUserWithTenant, { loading }] = useMutation(REGISTER_USER_WITH_TENANT, {
    onCompleted: (data) => {
      console.log('Registration successful:', data);
      
      // Set the authentication cookie
      setCookie('auth-token', data.registerUserWithTenant.token, 7);
      
      // Clear the form data from localStorage
      localStorage.removeItem(STORAGE_KEY);
      
      toast.success(t('onboarding.registrationSuccess'));
      
      // Redirect to tenant dashboard
      const tenantSlug = data.registerUserWithTenant.tenant.slug;
      router.push(`/${tenantSlug}/dashboard`);
    },
    onError: (error) => {
      console.error('Registration error:', error);
      toast.error(`${t('onboarding.registrationError')}: ${error.message}`);
    }
  });

  // Load saved progress from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const savedFormData = parsed.formData || formData;
        
        // Ensure all required features are always included
        const requiredFeatureIds = getRequiredFeatures();
        requiredFeatureIds.forEach(featureId => {
          if (!savedFormData.tenantFeatures.includes(featureId)) {
            savedFormData.tenantFeatures.push(featureId);
          }
        });
        
        setFormData(savedFormData);
        setCurrentStep(parsed.currentStep || 1);
      } catch (error) {
        console.error('Error loading saved form data:', error);
      }
    }
  }, []);

  // Save progress to localStorage whenever formData or currentStep changes
  useEffect(() => {
    const dataToSave = {
      formData,
      currentStep,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [formData, currentStep]);

  const updateFormData = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Step 1: Functionalities validation
  const validateStep1 = () => {
    if (formData.tenantFeatures.length === 0) {
      toast.error(t('onboarding.validation.noFeaturesSelected'));
      return false;
    }
    return true;
  };

  // Step 2: Organization validation
  const validateStep2 = () => {
    const { tenantName, tenantSlug } = formData;
    
    if (!tenantName || !tenantSlug) {
      toast.error(t('onboarding.validation.organizationRequired'));
      return false;
    }
    
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tenantSlug)) {
      toast.error(t('onboarding.validation.invalidSlug'));
      return false;
    }
    
    return true;
  };

  // Step 3: User and Password validation
  const validateStep3 = () => {
    const { email, firstName, lastName, password, confirmPassword } = formData;
    
    if (!email || !firstName || !lastName) {
      toast.error(t('onboarding.validation.userFieldsRequired'));
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('onboarding.validation.invalidEmail'));
      return false;
    }
    
    if (!password || !confirmPassword) {
      toast.error(t('onboarding.validation.passwordRequired'));
      return false;
    }
    
    if (password.length < 8) {
      toast.error(t('onboarding.validation.passwordTooShort'));
      return false;
    }
    
    if (password !== confirmPassword) {
      toast.error(t('onboarding.validation.passwordMismatch'));
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }

    try {
      // Ensure all required features are included
      const requiredFeatureIds = getRequiredFeatures();
      const allFeatures = [...new Set([...formData.tenantFeatures, ...requiredFeatureIds])];

      await registerUserWithTenant({
        variables: {
          input: {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phoneNumber: formData.phoneNumber || null,
            tenantName: formData.tenantName,
            tenantSlug: formData.tenantSlug,
            tenantDomain: formData.tenantDomain || null,
            tenantFeatures: allFeatures,
          }
        }
      });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const toggleFeature = (featureId: string) => {
    // Required features cannot be deselected
    const feature = getEngineById(featureId);
    if (featureId === 'CMS_ENGINE') {
      toast.info(t('onboarding.requiredFeatureCannotBeRemoved'));
      return;
    }
    const currentFeatures = formData.tenantFeatures;
    
    if (currentFeatures.includes(featureId)) {
      // Removing feature - check if other features depend on it
      const { newFeatures, removedDependents } = removeFeatureWithDependents(currentFeatures, featureId);
      
      if (removedDependents.length > 0) {
        toast.warning(t('onboarding.cannotRemoveFeature', { 
          feature: feature?.name || '', 
          dependents: removedDependents.join(', ') 
        }));
        return;
      }
      
      updateFormData('tenantFeatures', newFeatures);
    } else {
      // Adding feature - automatically add dependencies
      const newFeatures = addFeatureWithDependencies(currentFeatures, featureId);
      
      // Show toast for added dependencies
      if (feature?.dependencies) {
        feature.dependencies.forEach((depId: string) => {
          if (!currentFeatures.includes(depId)) {
            const depFeature = getEngineById(depId);
            if (depFeature) {
              toast.info(t('onboarding.dependencyAdded', { dependency: depFeature.name || '' }));
            }
          }
        });
      }
      
      updateFormData('tenantFeatures', newFeatures);
    }
  };

  const isFeatureDisabled = (featureId: string) => {
    // Required features are always disabled (cannot be toggled)
    if (featureId === 'CMS_ENGINE') {
      return true;
    }
    
    // A feature is disabled if it's a dependency of a selected feature
    const dependentFeatures = ALL_FEATURES_CONFIG.filter(f => 
      f.dependencies?.includes(featureId) && formData.tenantFeatures.includes(f.id)
    );
    return dependentFeatures.length > 0;
  };

  // Step 1: Functionalities Selection
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Settings className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-purple-400 mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-white">{t('onboarding.steps.functionalities.title')}</h2>
        <p className="text-sm sm:text-base text-gray-200">{t('onboarding.steps.functionalities.description')}</p>
      </div>

      {/* All features in a compact grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ALL_FEATURES_CONFIG
          .filter(feature => 
            // Hide Blog and Forms modules since they come by default
            !['BLOG_MODULE', 'FORMS_MODULE'].includes(feature.id)
          )
          .map((feature) => {
          const isSelected = formData.tenantFeatures.includes(feature.id);
          const isDisabled = isFeatureDisabled(feature.id);
          
          return (
            <div
              key={feature.id}
              className={`p-3 border rounded-lg transition-colors ${
                isDisabled 
                  ? 'border-white/20 bg-white/5 cursor-not-allowed opacity-75'
                  : isSelected
                    ? 'border-purple-400 bg-purple-500/20 cursor-pointer'
                    : 'border-white/20 bg-white/5 hover:border-white/30 cursor-pointer'
              }`}
              onClick={() => !isDisabled && toggleFeature(feature.id)}
            >
              <div className="flex items-start space-x-2">
                <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected
                    ? 'border-purple-400 bg-purple-400'
                    : 'border-white/30'
                }`}>
                  {isSelected && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    {feature.icon && (
                      <span className="text-sm flex-shrink-0">{feature.icon}</span>
                    )}
                    <h4 className={`font-medium text-sm ${isDisabled ? 'text-gray-400' : 'text-white'} truncate`}>
                      {feature.name}
                    </h4>
                    {isDisabled && (
                      <span className="text-xs text-purple-300 flex-shrink-0">
                        {feature.id === 'CMS_ENGINE' ? t('onboarding.included') : t('onboarding.required')}
                      </span>
                    )}
                  </div>
                  {feature.description && (
                    <p className={`text-xs ${isDisabled ? 'text-gray-500' : 'text-gray-300'} line-clamp-2`}>
                      {feature.description}
                    </p>
                  )}
                  {feature.dependencies && feature.dependencies.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {t('onboarding.requires')}: {feature.dependencies.map(dep => 
                        getEngineById(dep)?.name || dep
                      ).join(', ')}
                    </p>
                  )}
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300">
                      {t('onboarding.categories.engine')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Step 2: Organization Information
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Building className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-green-400 mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-white">{t('onboarding.steps.organization.title')}</h2>
        <p className="text-sm sm:text-base text-gray-200">{t('onboarding.steps.organization.description')}</p>
      </div>

      <div>
        <Label htmlFor="tenantName" className="text-white">{t('onboarding.fields.organizationName')} *</Label>
        <Input
          id="tenantName"
          type="text"
          value={formData.tenantName}
          onChange={(e) => {
            const value = e.target.value;
            updateFormData('tenantName', value);
            // Auto-generate slug
            if (value && !formData.tenantSlug) {
              updateFormData('tenantSlug', generateSlugFromName(value));
            }
          }}
          placeholder={t('onboarding.placeholders.organizationName')}
          className="backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:bg-white/10 transition-all duration-300 rounded-xl"
          required
        />
      </div>

      <div>
        <Label htmlFor="tenantSlug" className="text-white">{t('onboarding.fields.organizationSlug')} *</Label>
        <Input
          id="tenantSlug"
          type="text"
          value={formData.tenantSlug}
          onChange={(e) => updateFormData('tenantSlug', e.target.value)}
          placeholder={t('onboarding.placeholders.organizationSlug')}
          className="backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:bg-white/10 transition-all duration-300 rounded-xl"
          required
        />
        <p className="text-sm text-gray-300 mt-1">
          {t('onboarding.slugPreview')}: {formData.tenantSlug}.dishub.city
        </p>
      </div>

      <div>
        <Label htmlFor="tenantDomain" className="text-white">{t('onboarding.fields.customDomain')}</Label>
        <Input
          id="tenantDomain"
          type="text"
          value={formData.tenantDomain}
          onChange={(e) => updateFormData('tenantDomain', e.target.value)}
          placeholder={t('onboarding.placeholders.customDomain')}
          className="backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:bg-white/10 transition-all duration-300 rounded-xl"
        />
        <p className="text-sm text-gray-300 mt-1">
          {t('onboarding.customDomainNote')}
        </p>
      </div>
    </div>
  );

  // Step 3: User Information and Password
  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <User className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-cyan-400 mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-white">{t('onboarding.steps.userInfo.title')}</h2>
        <p className="text-sm sm:text-base text-gray-200">{t('onboarding.steps.userInfo.description')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName" className="text-white">{t('onboarding.fields.firstName')} *</Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            placeholder={t('onboarding.placeholders.firstName')}
            className="backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:bg-white/10 transition-all duration-300 rounded-xl"
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-white">{t('onboarding.fields.lastName')} *</Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            placeholder={t('onboarding.placeholders.lastName')}
            className="backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:bg-white/10 transition-all duration-300 rounded-xl"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="text-white">{t('onboarding.fields.email')} *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          placeholder={t('onboarding.placeholders.email')}
          className="backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:bg-white/10 transition-all duration-300 rounded-xl"
          required
        />
      </div>

      <div>
        <Label htmlFor="phoneNumber" className="text-white">{t('onboarding.fields.phone')}</Label>
        <PhoneInput
          id="phoneNumber"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={(value) => updateFormData('phoneNumber', value)}
          placeholder={t('onboarding.placeholders.phone')}
          defaultCountry="ES"
          className="w-full"
        />
      </div>

      <div>
        <Label htmlFor="password" className="text-white">{t('onboarding.fields.password')} *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            placeholder={t('onboarding.placeholders.password')}
            className="backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:bg-white/10 transition-all duration-300 rounded-xl pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-white/50 hover:text-white transition-colors"
            aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="text-white">{t('onboarding.fields.confirmPassword')} *</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => updateFormData('confirmPassword', e.target.value)}
            placeholder={t('onboarding.placeholders.confirmPassword')}
            className="backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:bg-white/10 transition-all duration-300 rounded-xl pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-white/50 hover:text-white transition-colors"
            aria-label={showConfirmPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="mt-6 p-4 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg">
        <h3 className="font-medium mb-2 text-white">{t('onboarding.summary.title')}:</h3>
        <div className="text-sm space-y-1 text-gray-200">
          <p><strong>{t('onboarding.summary.user')}:</strong> {formData.firstName} {formData.lastName}</p>
          <p><strong>{t('onboarding.summary.email')}:</strong> {formData.email}</p>
          <p><strong>{t('onboarding.summary.organization')}:</strong> {formData.tenantName}</p>
          <p><strong>{t('onboarding.summary.slug')}:</strong> {formData.tenantSlug}</p>
          <p><strong>{t('onboarding.summary.features')}:</strong> {formData.tenantFeatures.length} {t('onboarding.summary.selected')}</p>
          {formData.tenantFeatures.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-white">{t('onboarding.summary.selectedFeatures')}:</p>
              <ul className="list-disc list-inside text-xs text-gray-300 mt-1">
                {formData.tenantFeatures.map(featureId => {
                  const feature = getEngineById(featureId);
                  return feature ? (
                    <li key={featureId}>
                      {feature.name}
                      {featureId === 'CMS_ENGINE' && <span className="text-purple-300 ml-1">({t('onboarding.includedByDefault')})</span>}
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const progress = (currentStep / 3) * 100;

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return t('onboarding.stepTitles.functionalities');
      case 2: return t('onboarding.stepTitles.organization');
      case 3: return t('onboarding.stepTitles.userInfo');
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden flex items-center justify-center">
      {/* Animated Background - Same as DishubLanding */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/20" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600 rounded-full filter blur-3xl opacity-20 animate-pulse" />
      </div>

      <Card className="w-full max-w-2xl mx-4 sm:mx-6 lg:mx-auto backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-500 shadow-2xl relative z-10">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-center text-white text-xl sm:text-2xl">{t('onboarding.title')}</CardTitle>
          <CardDescription className="text-center text-gray-200 text-sm sm:text-base">
{t('onboarding.stepProgress', { current: currentStep.toString(), total: '3' })}: {getStepTitle(currentStep)}
          </CardDescription>
          <Progress value={progress} className="w-full" />
          
          {/* Step indicators */}
          <div className="flex justify-center space-x-2 sm:space-x-4 mt-4 overflow-x-auto">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ${
                  step === currentStep ? 'text-purple-300' : 
                  step < currentStep ? 'text-green-300' : 'text-gray-400'
                }`}
              >
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                  step === currentStep ? 'bg-purple-100/20 border-2 border-purple-300' :
                  step < currentStep ? 'bg-green-100/20 border-2 border-green-300' :
                  'bg-gray-100/20 border-2 border-gray-400'
                }`}>
                  {step < currentStep ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : step}
                </div>
                <span className="text-xs sm:text-sm font-medium hidden md:block">
                  {step === 1 ? t('onboarding.stepLabels.functionalities') : 
                   step === 2 ? t('onboarding.stepLabels.organization') : 
                   t('onboarding.stepLabels.userInfo')}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="backdrop-blur-xl bg-white/5 border border-white/10 text-white hover:bg-white/20 disabled:opacity-50 rounded-full transition-all duration-300 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('common.back')}
            </Button>

            {currentStep < 3 ? (
              <Button 
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 rounded-full w-full sm:w-auto"
              >
                {t('common.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 rounded-full disabled:opacity-50 w-full sm:w-auto"
              >
                {loading ? t('onboarding.creatingAccount') : t('onboarding.createAccount')}
              </Button>
            )}
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-200">
              {t('onboarding.alreadyHaveAccount')}{' '}
              <Link href={`/${locale}/login`} className="text-purple-300 hover:text-cyan-300 hover:underline transition-colors duration-300">
                {t('onboarding.signInHere')}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 