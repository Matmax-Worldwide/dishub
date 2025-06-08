'use client';

import React from 'react';
import { Check, MapPin, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SelectableItem {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

interface MultiSelectGridProps {
  items: SelectableItem[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  title: string;
  type: 'services' | 'locations';
  disabled?: boolean;
  maxSelection?: number;
}

export default function MultiSelectGrid({
  items,
  selectedIds,
  onSelectionChange,
  title,
  type,
  disabled = false,
  maxSelection
}: MultiSelectGridProps) {
  const handleItemToggle = (itemId: string) => {
    if (disabled) return;

    const isSelected = selectedIds.includes(itemId);
    let newSelection: string[];

    if (isSelected) {
      // Remove from selection
      newSelection = selectedIds.filter(id => id !== itemId);
    } else {
      // Add to selection (check max limit)
      if (maxSelection && selectedIds.length >= maxSelection) {
        return; // Don't add if at max limit
      }
      newSelection = [...selectedIds, itemId];
    }

    onSelectionChange(newSelection);
  };

  const getIcon = () => {
    return type === 'services' ? (
      <Briefcase className="h-4 w-4" />
    ) : (
      <MapPin className="h-4 w-4" />
    );
  };

  const getEmptyMessage = () => {
    return type === 'services' 
      ? 'No services available' 
      : 'No locations available';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <h3 className="text-lg font-medium">{title}</h3>
          {selectedIds.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedIds.length} selected
            </Badge>
          )}
        </div>
        {maxSelection && (
          <div className="text-sm text-muted-foreground">
            Max: {maxSelection}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              {getIcon()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {getEmptyMessage()}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isAtMaxLimit = maxSelection && selectedIds.length >= maxSelection && !isSelected;

            return (
              <Card
                key={item.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  {
                    "border-primary bg-primary/5 shadow-sm": isSelected,
                    "hover:border-primary/50": !isSelected && !disabled && !isAtMaxLimit,
                    "opacity-50 cursor-not-allowed": disabled || isAtMaxLimit,
                    "border-muted": !isSelected && !disabled,
                  }
                )}
                onClick={() => handleItemToggle(item.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm truncate">
                          {item.name}
                        </h4>
                        {item.isActive === false && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Selection Indicator */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center ml-2 flex-shrink-0",
                        {
                          "bg-primary border-primary text-primary-foreground": isSelected,
                          "border-muted-foreground/30": !isSelected,
                        }
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Selection Summary */}
      {selectedIds.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedIds.length} {type} selected
          {maxSelection && ` (${maxSelection - selectedIds.length} remaining)`}
        </div>
      )}
    </div>
  );
} 