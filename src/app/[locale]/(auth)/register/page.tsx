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
import { ArrowLeft, ArrowRight, Check, User, Building } from 'lucide-react';
import { toast } from 'sonner';
import { AVAILABLE_FEATURES } from '@/config/features';

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
        tenantId
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

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
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
    tenantFeatures: [],
  });

  const [registerUserWithTenant, { loading }] = useMutation(REGISTER_USER_WITH_TENANT, {
    onCompleted: (data) => {
      console.log('Registration successful:', data);
      
      // Set the authentication cookie
      setCookie('auth-token', data.registerUserWithTenant.token, 7);
      
      // Clear the form data from localStorage
      localStorage.removeItem(STORAGE_KEY);
      
      toast.success('¡Registro exitoso! Bienvenido a tu nueva plataforma.');
      
      // Redirect to dashboard or tenant setup
      router.push('/admin');
    },
    onError: (error) => {
      console.error('Registration error:', error);
      toast.error(`Error en el registro: ${error.message}`);
    }
  });

  // Load saved progress from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(parsed.formData || formData);
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

  const validateStep1 = () => {
    const { email, password, confirmPassword, firstName, lastName } = formData;
    
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      toast.error('Por favor completa todos los campos obligatorios');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Por favor ingresa un email válido');
      return false;
    }
    
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    const { tenantName, tenantSlug } = formData;
    
    if (!tenantName || !tenantSlug) {
      toast.error('Por favor completa el nombre y slug de tu organización');
      return false;
    }
    
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tenantSlug)) {
      toast.error('El slug debe contener solo letras minúsculas, números y guiones');
      return false;
    }
    
    return true;
  };

  const validateStep3 = () => {
    if (formData.tenantFeatures.length === 0) {
      toast.error('Por favor selecciona al menos una funcionalidad para tu plataforma');
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
            tenantFeatures: formData.tenantFeatures,
          }
        }
      });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const toggleFeature = (featureId: string) => {
    const feature = AVAILABLE_FEATURES.find(f => f.id === featureId);
    const currentFeatures = formData.tenantFeatures;
    
    if (currentFeatures.includes(featureId)) {
      // Removing feature - check if other features depend on it
      const dependentFeatures = AVAILABLE_FEATURES.filter(f => 
        f.dependencies?.includes(featureId) && currentFeatures.includes(f.id)
      );
      
      if (dependentFeatures.length > 0) {
        const dependentNames = dependentFeatures.map(f => f.label).join(', ');
        toast.warning(`No puedes desactivar ${feature?.label} porque es requerido por: ${dependentNames}`);
        return;
      }
      
      // Remove the feature
      const newFeatures = currentFeatures.filter(id => id !== featureId);
      updateFormData('tenantFeatures', newFeatures);
    } else {
      // Adding feature - automatically add dependencies
      const newFeatures = [...currentFeatures];
      
      // Add dependencies first
      if (feature?.dependencies) {
        for (const depId of feature.dependencies) {
          if (!newFeatures.includes(depId)) {
            newFeatures.push(depId);
            const depFeature = AVAILABLE_FEATURES.find(f => f.id === depId);
            if (depFeature) {
              toast.info(`Se agregó automáticamente ${depFeature.label} como dependencia`);
            }
          }
        }
      }
      
      // Add the feature itself
      newFeatures.push(featureId);
      updateFormData('tenantFeatures', newFeatures);
    }
  };

  const isFeatureDisabled = (featureId: string) => {
    // A feature is disabled if it's a dependency of a selected feature
    const dependentFeatures = AVAILABLE_FEATURES.filter(f => 
      f.dependencies?.includes(featureId) && formData.tenantFeatures.includes(f.id)
    );
    return dependentFeatures.length > 0;
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <User className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold">Información Personal</h2>
        <p className="text-gray-600">Crea tu cuenta de usuario</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            placeholder="Tu nombre"
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Apellido *</Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            placeholder="Tu apellido"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          placeholder="tu@email.com"
          required
        />
      </div>

      <div>
        <Label htmlFor="phoneNumber">Teléfono</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => updateFormData('phoneNumber', e.target.value)}
          placeholder="+1234567890"
        />
      </div>

      <div>
        <Label htmlFor="password">Contraseña *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          placeholder="Mínimo 8 caracteres"
          required
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
          placeholder="Repite tu contraseña"
          required
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Building className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold">Información de tu Organización</h2>
        <p className="text-gray-600">Configura tu espacio de trabajo</p>
      </div>

      <div>
        <Label htmlFor="tenantName">Nombre de la Organización *</Label>
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
          placeholder="Mi Empresa S.A."
          required
        />
      </div>

      <div>
        <Label htmlFor="tenantSlug">Slug de la Organización *</Label>
        <Input
          id="tenantSlug"
          type="text"
          value={formData.tenantSlug}
          onChange={(e) => updateFormData('tenantSlug', e.target.value)}
          placeholder="mi-empresa"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Este será tu identificador único: {formData.tenantSlug}.tudominio.com
        </p>
      </div>

      <div>
        <Label htmlFor="tenantDomain">Dominio Personalizado (Opcional)</Label>
        <Input
          id="tenantDomain"
          type="text"
          value={formData.tenantDomain}
          onChange={(e) => updateFormData('tenantDomain', e.target.value)}
          placeholder="www.miempresa.com"
        />
        <p className="text-sm text-gray-500 mt-1">
          Puedes configurar tu dominio personalizado más tarde
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Check className="mx-auto h-12 w-12 text-green-600 mb-4" />
        <h2 className="text-2xl font-bold">Selecciona tus Funcionalidades</h2>
        <p className="text-gray-600">Elige las herramientas que necesitas (puedes cambiar esto después)</p>
      </div>

      {/* Group features by category */}
      {['Engine', 'Module', 'Integration'].map(category => {
        const categoryFeatures = AVAILABLE_FEATURES.filter(feature => feature.category === category);
        if (categoryFeatures.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <h3 className="font-semibold text-lg text-gray-800 border-b pb-2">
              {category === 'Engine' ? 'Motores Principales' : 
               category === 'Module' ? 'Módulos Adicionales' : 'Integraciones'}
            </h3>
            <div className="grid gap-3">
              {categoryFeatures.map((feature) => {
                const isSelected = formData.tenantFeatures.includes(feature.id);
                const isDisabled = isFeatureDisabled(feature.id);
                
                return (
                  <div
                    key={feature.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isDisabled 
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-75'
                        : isSelected
                          ? 'border-blue-500 bg-blue-50 cursor-pointer'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                    onClick={() => !isDisabled && toggleFeature(feature.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${isDisabled ? 'text-gray-500' : ''}`}>
                          {feature.label}
                          {isDisabled && <span className="text-xs ml-2 text-blue-600">(Requerido)</span>}
                        </h4>
                        {feature.description && (
                          <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                            {feature.description}
                          </p>
                        )}
                        {feature.dependencies && feature.dependencies.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Requiere: {feature.dependencies.map(dep => 
                              AVAILABLE_FEATURES.find(f => f.id === dep)?.label || dep
                            ).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">Resumen de tu configuración:</h3>
        <div className="text-sm space-y-1">
          <p><strong>Usuario:</strong> {formData.firstName} {formData.lastName}</p>
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Organización:</strong> {formData.tenantName}</p>
          <p><strong>Slug:</strong> {formData.tenantSlug}</p>
          <p><strong>Funcionalidades:</strong> {formData.tenantFeatures.length} seleccionadas</p>
          {formData.tenantFeatures.length > 0 && (
            <div className="mt-2">
              <p className="font-medium">Funcionalidades seleccionadas:</p>
              <ul className="list-disc list-inside text-xs text-gray-600 mt-1">
                {formData.tenantFeatures.map(featureId => {
                  const feature = AVAILABLE_FEATURES.find(f => f.id === featureId);
                  return feature ? <li key={featureId}>{feature.label}</li> : null;
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
      case 1: return 'Información Personal';
      case 2: return 'Configuración de Organización';
      case 3: return 'Selección de Funcionalidades';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">Crear Nueva Cuenta</CardTitle>
          <CardDescription className="text-center">
            Paso {currentStep} de 3: {getStepTitle(currentStep)}
          </CardDescription>
          <Progress value={progress} className="w-full" />
          
          {/* Step indicators */}
          <div className="flex justify-center space-x-4 mt-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center space-x-2 ${
                  step === currentStep ? 'text-blue-600' : 
                  step < currentStep ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep ? 'bg-blue-100 border-2 border-blue-600' :
                  step < currentStep ? 'bg-green-100 border-2 border-green-600' :
                  'bg-gray-100 border-2 border-gray-300'
                }`}>
                  {step < currentStep ? <Check className="w-4 h-4" /> : step}
                </div>
                <span className="text-sm font-medium hidden sm:block">
                  {step === 1 ? 'Usuario' : step === 2 ? 'Organización' : 'Funcionalidades'}
                </span>
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            {currentStep < 3 ? (
              <Button onClick={handleNext}>
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>
            )}
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 