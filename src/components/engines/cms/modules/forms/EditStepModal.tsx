'use client';

import React, { useState, useEffect } from 'react';
import { FormStepBase } from '@/types/forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea'; // Added for description
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'; // Assuming Dialog components from shadcn/ui

interface EditStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  step: FormStepBase | null;
  onSave: (updatedStepData: Partial<FormStepBase>) => void;
}

export default function EditStepModal({ isOpen, onClose, step, onSave }: EditStepModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (step) {
      setTitle(step.title);
      setDescription(step.description || '');
      setIsVisible(step.isVisible !== undefined ? step.isVisible : true);
    }
  }, [step]);

  if (!isOpen || !step) return null;

  const handleSave = () => {
    onSave({
      id: step.id, // Important to pass back the ID
      title,
      description,
      isVisible,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Step Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="step-title" className="text-right">
              Title
            </Label>
            <Input
              id="step-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="step-description" className="text-right">
              Description
            </Label>
            <Textarea
              id="step-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2 justify-end col-span-4">
            <Switch
              id="step-isVisible"
              checked={isVisible}
              onCheckedChange={setIsVisible}
            />
            <Label htmlFor="step-isVisible">Visible to users</Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
