'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/app/components/ui/card'; // Assuming Card is used for step display
import { GripVertical } from 'lucide-react';

interface SortableStepItemProps {
  id: string;
  children: React.ReactNode;
}

export function SortableStepItem({ id, children }: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 10 : undefined, // Keep dragged item on top
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className={`relative ${isDragging ? 'shadow-2xl ring-2 ring-blue-500' : 'shadow-sm'}`}>
        {/* Drag Handle - Placed subtly, perhaps top-left or integrated into header */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 z-10"
          title="Drag to reorder step"
        >
          <GripVertical className="h-5 w-5" />
        </div>
        {children}
      </Card>
    </div>
  );
}
