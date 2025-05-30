'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPinIcon, PlusIcon, BuildingIcon } from 'lucide-react';

interface EmptyLocationListProps {
  onCreateLocation?: () => void;
}

export default function EmptyLocationList({ onCreateLocation }: EmptyLocationListProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <MapPinIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">No Locations Found</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            You haven&apos;t created any locations yet. Locations are physical or virtual places where your services are offered.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <BuildingIcon className="h-4 w-4" />
              <span>Physical offices or branches</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MapPinIcon className="h-4 w-4" />
              <span>Service delivery areas</span>
            </div>
          </div>
          
          <Button 
            onClick={onCreateLocation}
            className="w-full"
            size="lg"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Your First Location
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Start by adding a location where your services will be available for booking.
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 