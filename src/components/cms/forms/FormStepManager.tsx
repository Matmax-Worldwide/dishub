'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FormBase, FormStepBase, FormFieldBase } from '@/types/forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Eye, EyeOff, ArrowUp, ArrowDown, Move } from 'lucide-react';
import graphqlClient from '@/lib/graphql-client';
import { toast } from 'sonner';

interface FormStepManagerProps {
  form: FormBase;
}

interface StepWithFields extends FormStepBase {
  fields: FormFieldBase[];
}

export default function FormStepManager({ form }: FormStepManagerProps) {
  const [steps, setSteps] = useState<StepWithFields[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [newStepData, setNewStepData] = useState({
    title: '',
    description: '',
    isVisible: true
  });

  // Get unassigned fields (fields that don't belong to any step)
  const getUnassignedFields = useCallback(() => {
    if (!form.fields) return [];
    
    const assignedFieldIds = new Set();
    steps.forEach(step => {
      step.fields.forEach(field => {
        assignedFieldIds.add(field.id);
      });
    });
    
    return form.fields.filter(field => !assignedFieldIds.has(field.id));
  }, [form.fields, steps]);

  const loadFormSteps = useCallback(async () => {
    try {
      setLoading(true);
      const formSteps = await graphqlClient.getFormSteps(form.id);
      
      // Load fields for each step
      const stepsWithFields = await Promise.all(
        formSteps.map(async (step) => {
          const fields = await graphqlClient.getFormFields(form.id, step.id);
          return { ...step, fields };
        })
      );

      setSteps(stepsWithFields);
    } catch (error) {
      console.error('Error loading form steps:', error);
      toast.error('Failed to load form steps');
    } finally {
      setLoading(false);
    }
  }, [form.id]);

  // Load form steps on mount
  useEffect(() => {
    if (form.id) {
      loadFormSteps();
    }
  }, [form.id, loadFormSteps]);

  const handleCreateStep = async () => {
    if (!newStepData.title.trim()) {
      toast.error('Step title is required');
      return;
    }

    try {
      setLoading(true);
      const result = await graphqlClient.createFormStep({
        formId: form.id,
        title: newStepData.title,
        description: newStepData.description,
        order: steps.length,
        isVisible: newStepData.isVisible
      });

      if (result.success) {
        toast.success('Step created successfully');
        setNewStepData({ title: '', description: '', isVisible: true });
        await loadFormSteps();
      } else {
        toast.error(result.message || 'Failed to create step');
      }
    } catch (error) {
      console.error('Error creating step:', error);
      toast.error('Failed to create step');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Are you sure you want to delete this step? Fields will be unassigned but not deleted.')) {
      return;
    }

    try {
      setLoading(true);
      const result = await graphqlClient.deleteFormStep(stepId);
      
      if (result.success) {
        toast.success('Step deleted successfully');
        await loadFormSteps();
      } else {
        toast.error(result.message || 'Failed to delete step');
      }
    } catch (error) {
      console.error('Error deleting step:', error);
      toast.error('Failed to delete step');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStep = async (stepIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    const newSteps = [...steps];
    [newSteps[stepIndex], newSteps[newIndex]] = [newSteps[newIndex], newSteps[stepIndex]];
    
    // Update order values
    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      order: index
    }));

    setSteps(updatedSteps);

    try {
      // Update step orders in the backend
      const result = await graphqlClient.updateStepOrders(updatedSteps.map(step => ({ id: step.id, order: step.order })));
      
      if (result.success) {
        toast.success('Step order updated');
      } else {
        toast.error(result.message || 'Failed to update step order');
        // Revert on error
        await loadFormSteps();
      }
    } catch (error) {
      console.error('Error updating step order:', error);
      toast.error('Failed to update step order');
      // Revert on error
      await loadFormSteps();
    }
  };

  const handleToggleStepVisibility = async (stepId: string, isVisible: boolean) => {
    try {
      const result = await graphqlClient.updateFormStep(stepId, { isVisible });
      
      if (result.success) {
        setSteps(prev => prev.map(step => 
          step.id === stepId ? { ...step, isVisible } : step
        ));
        
        toast.success(`Step ${isVisible ? 'shown' : 'hidden'}`);
      } else {
        toast.error(result.message || 'Failed to update step visibility');
      }
    } catch (error) {
      console.error('Error updating step visibility:', error);
      toast.error('Failed to update step visibility');
    }
  };

  const handleAssignFieldToStep = async (fieldId: string, stepId: string) => {
    try {
      // Get the current field data first
      const currentField = form.fields?.find(f => f.id === fieldId);
      if (!currentField) {
        toast.error('Field not found');
        return;
      }

      const result = await graphqlClient.updateFormField(fieldId, {
        label: currentField.label,
        name: currentField.name,
        type: currentField.type,
        stepId: stepId,
        isRequired: currentField.isRequired,
        order: currentField.order,
        placeholder: currentField.placeholder,
        helpText: currentField.helpText,
        defaultValue: currentField.defaultValue,
        options: currentField.options,
        validationRules: currentField.validationRules,
        styling: currentField.styling,
        width: currentField.width
      });
      
      if (result.success) {
        toast.success('Field assigned to step');
        await loadFormSteps();
      } else {
        toast.error(result.message || 'Failed to assign field');
      }
    } catch (error) {
      console.error('Error assigning field to step:', error);
      toast.error('Failed to assign field');
    }
  };

  const handleUnassignFieldFromStep = async (fieldId: string) => {
    try {
      // Get the current field data first
      const currentField = form.fields?.find(f => f.id === fieldId);
      if (!currentField) {
        toast.error('Field not found');
        return;
      }

      const result = await graphqlClient.updateFormField(fieldId, {
        label: currentField.label,
        name: currentField.name,
        type: currentField.type,
        stepId: undefined, // Remove step assignment
        isRequired: currentField.isRequired,
        order: currentField.order,
        placeholder: currentField.placeholder,
        helpText: currentField.helpText,
        defaultValue: currentField.defaultValue,
        options: currentField.options,
        validationRules: currentField.validationRules,
        styling: currentField.styling,
        width: currentField.width
      });
      
      if (result.success) {
        toast.success('Field unassigned from step');
        await loadFormSteps();
      } else {
        toast.error('Failed to unassign field');
      }
    } catch (error) {
      console.error('Error unassigning field from step:', error);
      toast.error('Failed to unassign field');
    }
  };

  const unassignedFields = getUnassignedFields();

  if (!form.isMultiStep) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multi-Step Configuration</CardTitle>
          <CardDescription>
            This form is not configured as multi-step. Enable multi-step mode to manage steps.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Check if there are any form fields created
  const hasFormFields = form.fields && form.fields.length > 0;

  return (
    <div className="space-y-6">
      {!hasFormFields && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">No Form Fields Created</CardTitle>
            <CardDescription className="text-blue-700">
              You need to create form fields first before you can assign them to steps. 
              Go to the <strong>Fields</strong> tab to create your form fields, then return here to organize them into steps.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Form Steps Management</CardTitle>
          <CardDescription>
            Create and manage steps for your multi-step form. Assign existing form fields to different steps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Unassigned Fields Section */}
          {unassignedFields.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-3">Unassigned Fields</h4>
              <p className="text-sm text-yellow-700 mb-3">
                These fields are not assigned to any step. Drag them to a step or use the dropdown to assign them.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {unassignedFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-2 bg-white border border-yellow-300 rounded">
                    <div>
                      <span className="text-sm font-medium">{field.label}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {field.type}
                      </Badge>
                      {field.isRequired && (
                        <Badge variant="destructive" className="ml-1 text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <Select onValueChange={(stepId) => handleAssignFieldToStep(field.id, stepId)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {steps.map((step) => (
                          <SelectItem key={step.id} value={step.id}>
                            {step.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create New Step */}
          <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium">Add New Step</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stepTitle">Step Title</Label>
                <Input
                  id="stepTitle"
                  value={newStepData.title}
                  onChange={(e) => setNewStepData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter step title"
                />
              </div>
              <div>
                <Label htmlFor="stepDescription">Description (Optional)</Label>
                <Input
                  id="stepDescription"
                  value={newStepData.description}
                  onChange={(e) => setNewStepData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter step description"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="stepVisible"
                checked={newStepData.isVisible}
                onCheckedChange={(checked) => setNewStepData(prev => ({ ...prev, isVisible: checked }))}
              />
              <Label htmlFor="stepVisible">Visible to users</Label>
            </div>
            <Button onClick={handleCreateStep} disabled={loading || !newStepData.title.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>

          {/* Steps List */}
          {loading ? (
            <div className="text-center py-8">
              <p>Loading steps...</p>
            </div>
          ) : steps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No steps created yet. Add your first step above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <Card key={step.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Step {index + 1}</Badge>
                            <h4 className="font-medium">{step.title}</h4>
                            {!step.isVisible && (
                              <Badge variant="secondary">Hidden</Badge>
                            )}
                          </div>
                          {step.description && (
                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveStep(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveStep(index, 'down')}
                          disabled={index === steps.length - 1}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStepVisibility(step.id, !step.isVisible)}
                        >
                          {step.isVisible ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingStep(editingStep === step.id ? null : step.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStep(step.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Step Fields */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium">Assigned Fields ({step.fields.length})</h5>
                        {unassignedFields.length > 0 && (
                          <Select onValueChange={(fieldId) => handleAssignFieldToStep(fieldId, step.id)}>
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Assign field to step" />
                            </SelectTrigger>
                            <SelectContent>
                              {unassignedFields.map((field) => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.label} ({field.type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      {step.fields.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center border-2 border-dashed border-gray-200 rounded">
                          No fields assigned to this step. {unassignedFields.length > 0 ? 'Use the dropdown above to assign fields.' : 'Create fields in the Fields tab first.'}
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {step.fields.map((field) => (
                            <div key={field.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <span className="text-sm font-medium">{field.label}</span>
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {field.type}
                                </Badge>
                                {field.isRequired && (
                                  <Badge variant="destructive" className="ml-1 text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnassignFieldFromStep(field.id)}
                                className="text-orange-600 hover:text-orange-700"
                                title="Unassign from step"
                              >
                                <Move className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 