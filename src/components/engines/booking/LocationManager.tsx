'use client';

import React, { useState, useEffect, useCallback } from 'react';
import graphqlClient from '@/lib/graphql-client';
import { Location } from '@/types/calendar'; // Assuming this type is defined
import LocationForm from './LocationForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function LocationManager() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Partial<Location> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);


  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await graphqlClient.locations(); // Assuming this returns { locations: Location[] } or Location[]
      setLocations(response || []); // Adjust based on actual response structure
    } catch (err: unknown) {
      console.error('Failed to fetch locations:', err);
      setError(`Failed to load locations: ${err instanceof Error ? err.message : 'Unknown error'}`);
      toast.error(`Failed to load locations: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleAddNew = () => {
    setEditingLocation(null);
    setIsFormOpen(true);
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (location: Location) => {
    setLocationToDelete(location);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;
    console.log('LocationManager: handleDelete called for location:', locationToDelete);
    setIsSaving(true);
    try {
      console.log('LocationManager: Calling deleteLocation with id:', locationToDelete.id);
      const result = await graphqlClient.deleteLocation({ id: locationToDelete.id });
      console.log('LocationManager: Delete result:', result);
      if (result.success) {
        toast.success(`Location "${locationToDelete.name}" deleted successfully.`);
        fetchLocations(); // Refresh list
      } else {
        toast.error(result.message || 'Failed to delete location');
      }
    } catch (err: unknown) {
      console.error('LocationManager: Failed to delete location:', err);
      toast.error(`Failed to delete location: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(false);
      setLocationToDelete(null);
    }
  };

  const handleSaveLocation = async (data: Partial<Location>) => {
    console.log('LocationManager: handleSaveLocation called with data:', data);
    console.log('LocationManager: editingLocation:', editingLocation);
    setIsSaving(true);
    setError(null);
    try {
      if (editingLocation?.id) { // Editing existing location
        console.log('LocationManager: Updating existing location with id:', editingLocation.id);
        // Remove id from input data since it should be passed as separate parameter
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...inputData } = data;
        console.log('LocationManager: Update input data:', inputData);
        const result = await graphqlClient.updateLocation({ id: editingLocation.id, input: inputData });
        console.log('LocationManager: Update result:', result);
        toast.success(`Location "${result.name}" updated successfully.`);
      } else { // Creating new location
        console.log('LocationManager: Creating new location');
        if (!data.name) {
          throw new Error('Location name is required');
        }
        const result = await graphqlClient.createLocation({ input: data as { name: string; address?: string | null; phone?: string | null; operatingHours?: Record<string, unknown> | null } });
        console.log('LocationManager: Create result:', result);
        toast.success(`Location "${result.name}" created successfully.`);
      }
      fetchLocations(); // Refresh the list
      setIsFormOpen(false);
      setEditingLocation(null);
    } catch (err: unknown) {
      console.error('LocationManager: Failed to save location:', err);
      const errorMsg = `Failed to save location: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && locations.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading locations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>{/* Placeholder for potential filters or search */}</div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Location
        </Button>
      </div>

      {error && !isLoading && (
         <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
           <span className="font-medium">Error:</span> {error}
         </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Address</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && locations.length > 0 && ( // Show skeleton or partial loading if needed
                <TableRow>
                    <TableCell colSpan={4} className="text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground inline-block mr-2" />
                        Refreshing data...
                    </TableCell>
                </TableRow>
            )}
            {!isLoading && locations.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No locations found.
                </TableCell>
              </TableRow>
            )}
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {location.address || 'N/A'}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {location.phone || 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(location)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteConfirmation(location)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <LocationForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLocation(null);
        }}
        onSave={handleSaveLocation}
        initialData={editingLocation}
        isSaving={isSaving}
      />

      {locationToDelete && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the location
                &quot;{locationToDelete.name}&quot;.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setLocationToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isSaving} className="bg-destructive hover:bg-destructive/90">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
