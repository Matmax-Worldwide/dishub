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
import { Plus, Trash2, Edit, Eye, EyeOff, ArrowUp, ArrowDown, GripVertical, Settings2 } from 'lucide-react';
import graphqlClient from '@/lib/graphql-client';
import { toast } from 'sonner';
import EditStepModal from './EditStepModal'; // Import the modal

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
  arrayMove, 
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableStepItem } from './SortableStepItem';

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
  // const [editingStep, setEditingStep] = useState<string | null>(null); // Replaced by currentlyEditingStepDetail for modal
  const [currentlyEditingStepDetail, setCurrentlyEditingStepDetail] = useState<FormStepBase | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newStepData, setNewStepData] = useState({
    title: '',
    description: '',
    isVisible: true
  });

  // Drag and Drop state
  const [activeField, setActiveField] = useState<FormFieldBase | null>(null);
  const [activeStep, setActiveStep] = useState<StepWithFields | null>(null); // For dragging steps

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require mouse to move 8px before D&D starts
      },
    }),
    useSensor(KeyboardSensor, { // Add Keyboard sensor for accessibility
      coordinateGetter: sortableKeyboardCoordinates,
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
    const activeId = active.id as string;

    if (activeId.startsWith('step-dnd-')) { 
        const stepId = activeId.replace('step-dnd-', '');
        const step = steps.find(s => s.id === stepId);
        if (step) {
            setActiveStep(step);
            active.data.current = { type: 'step', stepData: step }; 
        }
        setActiveField(null);
    } else { 
        const field = form.fields?.find(f => f.id === activeId) || 
                      steps.flatMap(s => s.fields).find(f => f.id === activeId);
        if (field) {
            setActiveField(field);
            active.data.current = { type: 'field', fieldData: field };
        }
        setActiveStep(null);
    }
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    // For visual feedback during drag if needed
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!active || !over) {
      setActiveField(null);
      setActiveStep(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Scenario 1: Reordering Steps
    if (active.data.current?.type === 'step' && overId.startsWith('step-dnd-') && activeId !== overId) {
        const oldIndex = steps.findIndex(s => `step-dnd-${s.id}` === activeId);
        const newIndex = steps.findIndex(s => `step-dnd-${s.id}` === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrderedSteps = arrayMove(steps, oldIndex, newIndex);
            setSteps(newOrderedSteps); 

            const orderUpdates = newOrderedSteps.map((step, index) => ({
                id: step.id,
                order: index,
            }));
            try {
                setLoading(true);
                const result = await graphqlClient.updateStepOrders(orderUpdates);
                if (result.success) {
                    toast.success('Step order saved successfully.');
                    if (onFormUpdate) onFormUpdate();
                    await loadFormSteps(); 
                } else {
                    toast.error(result.message || 'Failed to save step order.');
                    await loadFormSteps(); 
                }
            } catch (error) {
                toast.error('An error occurred while saving step order.');
                await loadFormSteps(); 
                console.error("Error saving step order:", error);
            } finally {
                setLoading(false);
            }
        }
    } 
    // Scenario 2: Moving a Field
    else if (active.data.current?.type === 'field') {
        const fieldId = activeId;
        const fieldBeingDragged = active.data.current.fieldData as FormFieldBase;

        if (overId.startsWith('step-')) { 
            const targetStepId = overId.replace('step-', '');
            if (fieldBeingDragged?.stepId !== targetStepId) { 
                 await handleAssignFieldToStep(fieldId, targetStepId);
            }
        } else if (overId === 'unassigned-fields') { 
            if (fieldBeingDragged?.stepId) { 
                await handleUnassignFieldFromStep(fieldId);
            }
        }
    }
    
    setActiveField(null);
    setActiveStep(null);
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
            {loading && steps.length === 0 ? (
              <div className="text-center py-8">
                <p>Loading steps...</p>
              </div>
            ) : !loading && steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No steps created yet. Add your first step above.</p>
              </div>
            ) : (
              <SortableContext items={steps.map(s => `step-dnd-${s.id}`)} strategy={verticalListSortingStrategy}>
                <div className="space-y-0"> 
                  {steps.map((step, index) => (
                    <SortableStepItem key={`step-dnd-${step.id}`} id={`step-dnd-${step.id}`}>
                      <div> 
                        <CardHeader className="pb-3 relative pt-8">
                          <div className="flex items-center justify-between ml-8"> 
                            <div className="flex items-center space-x-3">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">Step {index + 1}</Badge>
                                  <h4 className="font-medium">{step.title}</h4>
                                  {!step.isVisible && <Badge variant="secondary">Hidden</Badge>}
                                </div>
                                {step.description && <p className="text-sm text-gray-600 mt-1">{step.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => handleToggleStepVisibility(step.id, !step.isVisible)} title={step.isVisible ? "Hide Step" : "Show Step"}>
                                {step.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => { setCurrentlyEditingStepDetail(step); setIsEditModalOpen(true); }} title="Edit Step Details">
                                <Settings2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteStep(step.id)} className="text-red-600 hover:text-red-700" title="Delete Step">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-sm font-medium">Assigned Fields ({step.fields.length})</h5>
                              {unassignedFields.length > 0 && (
                                <Select onValueChange={(fieldId) => handleAssignFieldToStep(fieldId, step.id)}>
                                  <SelectTrigger className="w-auto md:w-56 text-xs h-8"><SelectValue placeholder="Quick assign field..." /></SelectTrigger>
                                  <SelectContent>
                                    {unassignedFields.map((field) => (
                                      <SelectItem key={field.id} value={field.id}>{field.label} ({field.type})</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                            <DroppableStep step={step}>
                              {step.fields.length === 0 ? (
                                <p className="text-sm text-gray-500 py-8 text-center">Drag & drop fields here or use "Quick assign".</p>
                              ) : (
                                <SortableContext items={step.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                  <div className="space-y-2">
                                    {step.fields.map((field) => (
                                      <DraggableField key={field.id} field={field} onUnassign={() => handleUnassignFieldFromStep(field.id)} showUnassignButton={true} />
                                    ))}
                                  </div>
                                </SortableContext>
                              )}
                            </DroppableStep>
                          </div>
                        </CardContent>
                      </div>
                    </SortableStepItem>
                  ))}
                </div>
              </SortableContext>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal for Editing Step Details */}
      {currentlyEditingStepDetail && (
        <EditStepModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setCurrentlyEditingStepDetail(null);
          }}
          step={currentlyEditingStepDetail}
          onSave={async (updatedData) => {
            if (!currentlyEditingStepDetail?.id) return;
            try {
              setLoading(true);
              const result = await graphqlClient.updateFormStep(currentlyEditingStepDetail.id, updatedData);
              if (result.success) {
                toast.success('Step details updated successfully.');
                await loadFormSteps(); // Refresh steps
                if (onFormUpdate) onFormUpdate();
              } else {
                toast.error(result.message || 'Failed to update step details.');
              }
            } catch (error) {
              toast.error('An error occurred while updating step details.');
              console.error("Error updating step details:", error);
            } finally {
              setLoading(false);
              setIsEditModalOpen(false);
              setCurrentlyEditingStepDetail(null);
            }
          }}
        />
      )}

      {/* Drag Overlay */}
      <DragOverlay>
        {activeStep ? (
            <Card className="p-3 bg-white border rounded-lg shadow-2xl opacity-90 cursor-grabbing">
                <CardHeader className="p-2 flex flex-row items-center space-x-2">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                    <CardTitle className="text-sm">Step: {activeStep.title}</CardTitle>
                </CardHeader>
            </Card>
        ) : activeField ? (
          <div className="p-3 bg-white border rounded-lg shadow-lg opacity-90 cursor-grabbing">
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
      {currentlyEditingStepDetail && (
        <EditStepModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setCurrentlyEditingStepDetail(null);
          }}
          step={currentlyEditingStepDetail}
          onSave={async (updatedData) => {
            if (!currentlyEditingStepDetail?.id) return;
            try {
              setLoading(true);
              const result = await graphqlClient.updateFormStep(currentlyEditingStepDetail.id, updatedData);
              if (result.success) {
                toast.success('Step details updated successfully.');
                await loadFormSteps(); // Refresh steps
                if (onFormUpdate) onFormUpdate();
              } else {
                toast.error(result.message || 'Failed to update step details.');
              }
            } catch (error) {
              toast.error('An error occurred while updating step details.');
              console.error("Error updating step details:", error);
            } finally {
              setLoading(false);
              setIsEditModalOpen(false);
              setCurrentlyEditingStepDetail(null);
            }
          }}
        />
      )}
    </DndContext>
  );
}