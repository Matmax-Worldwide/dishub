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
import { Plus, Trash2, Edit, Eye, EyeOff, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import graphqlClient from '@/lib/graphql-client';
import { toast } from 'sonner';

// Drag and Drop imports
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FormStepManagerProps {
  form: FormBase;
  onFormUpdate?: () => void; // Callback to notify parent of form changes
}

interface StepWithFields extends FormStepBase {
  fields: FormFieldBase[];
}

// Draggable Field Component
interface DraggableFieldProps {
  field: FormFieldBase;
  onUnassign?: () => void;
  showUnassignButton?: boolean;
}

function DraggableField({ field, onUnassign, showUnassignButton = false }: DraggableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-center space-x-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="cursor-default">
          <div className="font-medium text-sm">{field.label}</div>
          <div className="text-xs text-gray-500">
            {field.name} • {field.type}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </div>
        </div>
      </div>
      {showUnassignButton && onUnassign && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnassign}
          className="text-red-600 hover:text-red-800"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Droppable Step Container Component
interface DroppableStepProps {
  step: StepWithFields;
  children: React.ReactNode;
}

function DroppableStep({ step, children }: DroppableStepProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `step-${step.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] p-4 border-2 border-dashed rounded-lg transition-colors ${
        isOver 
          ? 'border-blue-500 bg-blue-100' 
          : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
      }`}
    >
      {children}
    </div>
  );
}

// Droppable Unassigned Fields Container
interface DroppableUnassignedProps {
  children: React.ReactNode;
}

function DroppableUnassigned({ children }: DroppableUnassignedProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'unassigned-fields',
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-4 border border-yellow-200 rounded-lg transition-colors ${
        isOver 
          ? 'bg-yellow-200 border-yellow-400' 
          : 'bg-yellow-50'
      }`}
    >
      {children}
    </div>
  );
}

export default function FormStepManager({ form, onFormUpdate }: FormStepManagerProps) {
  const [steps, setSteps] = useState<StepWithFields[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [newStepData, setNewStepData] = useState({
    title: '',
    description: '',
    isVisible: true
  });

  // Drag and Drop state
  const [activeField, setActiveField] = useState<FormFieldBase | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
      
      const stepInput = {
        formId: form.id,
        title: newStepData.title,
        description: newStepData.description,
        order: steps.length,
        isVisible: newStepData.isVisible
      };

      const result = await graphqlClient.createFormStep(stepInput);
      
      if (result.success && result.step) {
        await loadFormSteps();
        setNewStepData({ title: '', description: '', isVisible: true });
        toast.success('Step created successfully');
        
        // Notify parent of form changes
        if (onFormUpdate) {
          onFormUpdate();
        }
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
    try {
      setLoading(true);
      
      const result = await graphqlClient.deleteFormStep(stepId);
      
      if (result.success) {
        await loadFormSteps();
        toast.success('Step deleted successfully');
        
        // Notify parent of form changes
        if (onFormUpdate) {
          onFormUpdate();
        }
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
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    
    // Swap steps
    [newSteps[stepIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[stepIndex]];
    
    try {
      setLoading(true);
      
      // Update orders
      const updates = newSteps.map((step, index) => ({
        id: step.id,
        order: index
      }));
      
      const result = await graphqlClient.updateStepOrders(updates);
      
      if (result.success) {
        setSteps(newSteps);
        toast.success('Step order updated');
        
        // Notify parent of form changes
        if (onFormUpdate) {
          onFormUpdate();
        }
      } else {
        toast.error('Failed to update step order');
      }
    } catch (error) {
      console.error('Error updating step order:', error);
      toast.error('Failed to update step order');
    } finally {
      setLoading(false);
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
        
        // Notify parent of form changes
        if (onFormUpdate) {
          onFormUpdate();
        }
      } else {
        toast.error('Failed to update step visibility');
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
        formId: form.id,
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
        await loadFormSteps();
        toast.success('Field assigned to step successfully');
        
        // Notify parent of form changes
        if (onFormUpdate) {
          onFormUpdate();
        }
      } else {
        toast.error(result.message || 'Failed to assign field to step');
      }
    } catch (error) {
      console.error('Error assigning field to step:', error);
      toast.error('Failed to assign field to step');
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
        formId: form.id,
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
        await loadFormSteps();
        toast.success('Field unassigned from step successfully');
        
        // Notify parent of form changes
        if (onFormUpdate) {
          onFormUpdate();
        }
      } else {
        toast.error(result.message || 'Failed to unassign field from step');
      }
    } catch (error) {
      console.error('Error unassigning field from step:', error);
      toast.error('Failed to unassign field from step');
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const fieldId = active.id as string;
    
    // Find the field being dragged
    const field = form.fields?.find(f => f.id === fieldId) || 
                  steps.flatMap(step => step.fields).find(f => f.id === fieldId);
    
    if (field) {
      setActiveField(field);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    
    if (!over) return;
    
    // Visual feedback is handled by the droppable components
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveField(null);
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // If dropping over a step container
    if (overId.startsWith('step-')) {
      const stepId = overId.replace('step-', '');
      await handleAssignFieldToStep(activeId, stepId);
    }
    // If dropping over unassigned area
    else if (overId === 'unassigned-fields') {
      await handleUnassignFieldFromStep(activeId);
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
              Create and manage steps for your multi-step form. Drag fields between steps or use dropdowns to assign them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Unassigned Fields Section */}
            {unassignedFields.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-yellow-800 mb-3">Unassigned Fields</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  These fields are not assigned to any step. Drag them to a step below or use the dropdown to assign them.
                </p>
                <DroppableUnassigned>
                  <SortableContext items={unassignedFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {unassignedFields.map((field) => (
                        <DraggableField
                          key={field.id}
                          field={field}
                          showUnassignButton={false}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableUnassigned>
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
                        
                        <DroppableStep step={step}>
                          {step.fields.length === 0 ? (
                            <p className="text-sm text-gray-500 py-8 text-center">
                              Drop fields here or use the dropdown above to assign fields to this step.
                            </p>
                          ) : (
                            <SortableContext items={step.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                              <div className="space-y-2">
                                {step.fields.map((field) => (
                                  <DraggableField
                                    key={field.id}
                                    field={field}
                                    onUnassign={() => handleUnassignFieldFromStep(field.id)}
                                    showUnassignButton={true}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                          )}
                        </DroppableStep>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeField ? (
          <div className="p-3 bg-white border rounded-lg shadow-lg opacity-90">
            <div className="font-medium text-sm">{activeField.label}</div>
            <div className="text-xs text-gray-500">
              {activeField.name} • {activeField.type}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
} 