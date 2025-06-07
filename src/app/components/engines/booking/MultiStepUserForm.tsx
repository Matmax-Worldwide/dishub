'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Progress } from '@/app/components/ui/progress';
import { 
  UserPlusIcon, 
  XIcon,
  Loader2Icon,
  ArrowLeft,
  ArrowRight,
  CheckIcon,
  UserIcon,
  LockIcon,
  PhoneIcon,
  ShieldIcon
} from 'lucide-react';

// Form data interface
export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: string;
}

// Role interface
export interface Role {
  id: string;
  name: string;
  description?: string;
}

// MultiStepUserForm props interface
export interface MultiStepUserFormProps {
  formData: UserFormData;
  currentStep: number;
  totalSteps: number;
  createLoading: boolean;
  roles: Role[];
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRoleChange: (value: string) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  validateStep: (step: number, currentFormData: UserFormData) => boolean;
  title?: string;
  description?: string;
  submitButtonText?: string;
}

// MultiStepUserForm component
const MultiStepUserForm = memo(({
  formData,
  currentStep,
  totalSteps,
  createLoading,
  roles,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPhoneChange,
  onPasswordChange,
  onRoleChange,
  onNextStep,
  onPrevStep,
  onCancel,
  onSubmit,
  validateStep,
  title = "Create New User",
  description = "Complete the form to create a new user account",
  submitButtonText = "Create User"
}: MultiStepUserFormProps) => {
  const progress = (currentStep / totalSteps) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="step1-firstName">First Name *</Label>
                <Input
                  id="step1-firstName"
                  value={formData.firstName}
                  onChange={(e) => onFirstNameChange(e.target.value)}
                  disabled={createLoading}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="step1-lastName">Last Name *</Label>
                <Input
                  id="step1-lastName"
                  value={formData.lastName}
                  onChange={(e) => onLastNameChange(e.target.value)}
                  disabled={createLoading}
                  placeholder="Enter last name"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <PhoneIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Contact Information</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="step2-email">Email Address *</Label>
                <Input
                  id="step2-email"
                  value={formData.email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  disabled={createLoading}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="step2-phoneNumber">Phone Number</Label>
                <Input
                  id="step2-phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  disabled={createLoading}
                  placeholder="Enter phone number (optional)"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <LockIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Security</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="step3-password">Password *</Label>
              <Input
                id="step3-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={onPasswordChange}
                required
                disabled={createLoading}
                minLength={6}
                placeholder="Enter password (min 6 characters)"
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <ShieldIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Role & Permissions</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="step4-role">User Role *</Label>
              <Select value={formData.role} onValueChange={onRoleChange} disabled={createLoading}>
                <SelectTrigger id="step4-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      <div className="flex items-center gap-2">
                        <ShieldIcon className="h-4 w-4" />
                        <span>{role.name}</span>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">
                            - {role.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Summary */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Review User Details</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                <p><strong>Email:</strong> {formData.email}</p>
                {formData.phoneNumber && <p><strong>Phone:</strong> {formData.phoneNumber}</p>}
                <p><strong>Role:</strong> {formData.role}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>
              Step {currentStep} of {totalSteps}: {description}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={currentStep === totalSteps ? onSubmit : (e) => e.preventDefault()} key={`step-${currentStep}`}>
          {renderStepContent()}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 mt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onPrevStep}
              disabled={currentStep === 1 || createLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createLoading}
              >
                Cancel
              </Button>
              
              {currentStep === totalSteps ? (
                <Button
                  type="submit"
                  disabled={!validateStep(currentStep, formData) || createLoading}
                >
                  {createLoading ? (
                    <>
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      {submitButtonText}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onNextStep}
                  disabled={!validateStep(currentStep, formData) || createLoading}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});

MultiStepUserForm.displayName = 'MultiStepUserForm';

export default MultiStepUserForm; 