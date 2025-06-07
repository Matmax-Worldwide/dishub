'use client';

import React, { useState, useEffect, useCallback } from 'react';
import graphqlClient from '@/lib/graphql-client';
import { Service, ServiceCategory, Location } from '@/types/calendar';
import ServiceForm from './ServiceForm';
import DeleteServiceDialog from './DeleteServiceDialog';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [allCategories, setAllCategories] = useState<ServiceCategory[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoadingServices(true);
    setIsLoadingCategories(true);
    setIsLoadingLocations(true);
    setError(null);
    try {
      // Fetch all data in parallel
      console.log('ServiceManager: Starting to fetch data...');
      const [servicesData, categoriesData, locationsData] = await Promise.all([
        graphqlClient.services(), 
        graphqlClient.serviceCategories(),
        graphqlClient.locations()
      ]);
      console.log('ServiceManager: Fetched categories:', categoriesData);
      console.log('ServiceManager: Categories length:', categoriesData?.length || 0);
      setServices(servicesData || []);
      setAllCategories(categoriesData || []);
      setAllLocations(locationsData || []);
    } catch (err: unknown) {
      console.error('Failed to fetch data:', err);
      const errorMsg = `Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoadingServices(false);
      setIsLoadingCategories(false);
      setIsLoadingLocations(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNew = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (service: Service) => {
    setServiceToDelete(service);
    setShowDeleteConfirm(true);
  };

  const handleDeleteClose = () => {
    setShowDeleteConfirm(false);
    setServiceToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      await graphqlClient.deleteService({ id: serviceToDelete.id });
      toast.success(`Service "${serviceToDelete.name}" deleted successfully.`);
      fetchData(); // Refresh all data as services might affect other things indirectly
      handleDeleteClose();
    } catch (err: unknown) {
      console.error('Failed to delete service:', err);
      toast.error(`Failed to delete service: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveService = async (data: Partial<Service>) => {
    setIsSaving(true);
    setError(null);
    try {
      // Prepare input data, removing form-specific fields
      const inputData = {
        name: data.name!,
        description: data.description,
        durationMinutes: data.durationMinutes!,
        bufferTimeBeforeMinutes: data.bufferTimeBeforeMinutes || undefined,
        bufferTimeAfterMinutes: data.bufferTimeAfterMinutes || undefined,
        preparationTimeMinutes: data.preparationTimeMinutes || undefined,
        cleanupTimeMinutes: data.cleanupTimeMinutes || undefined,
        maxDailyBookingsPerService: data.maxDailyBookingsPerService || undefined,
        serviceCategoryId: data.serviceCategoryId!,
        isActive: data.isActive ?? true,
        locationIds: data.locationIds || [],
      };

      let result;
      if (editingService?.id) {
        result = await graphqlClient.updateService({ id: editingService.id, input: inputData });
        toast.success(`Service "${result.name}" updated successfully.`);
      } else {
        // Para createService, necesitamos agregar el campo prices requerido
        const createInputData = {
          ...inputData,
        };
        result = await graphqlClient.createService({ input: createInputData });
        toast.success(`Service "${result.name}" created successfully.`);
      }
      fetchData(); 
      setIsFormOpen(false);
      setEditingService(null);
    } catch (err: unknown) {
      console.error('Failed to save service:', err);
      const errorMsg = `Failed to save service: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const isLoadingInitialData = isLoadingServices || isLoadingCategories || isLoadingLocations;

  if (isLoadingInitialData && services.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading service data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>{/* Placeholder for filters */}</div>
        <Button onClick={handleAddNew} disabled={isLoadingCategories || isLoadingLocations}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
        </Button>
      </div>

      {error && !isLoadingInitialData && (
         <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
           <span className="font-medium">Error:</span> {error}
         </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="text-center hidden md:table-cell">Duration (min)</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Price</TableHead>
              <TableHead className="hidden xl:table-cell">Locations</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isLoadingServices && services.length > 0) && (
                <TableRow><TableCell colSpan={7} className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground inline-block mr-2" /> Refreshing services...
                </TableCell></TableRow>
            )}
            {!isLoadingServices && services.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No services found.</TableCell></TableRow>
            )}
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {service.serviceCategory?.name || 'N/A'}
                </TableCell>
                <TableCell className="text-center hidden md:table-cell text-sm text-muted-foreground">{service.durationMinutes}</TableCell>
                <TableCell className="text-right hidden lg:table-cell text-sm text-muted-foreground">
                  N/A
                </TableCell>
                <TableCell className="hidden xl:table-cell text-sm text-muted-foreground truncate max-w-xs">
                  {service.locations && service.locations.length > 0 
                    ? service.locations.map(loc => loc.name).join(', ') 
                    : 'No locations assigned'}
                </TableCell>
                <TableCell className="text-center">
                  {service.isActive ? 
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" /> : 
                    <XCircle className="h-5 w-5 text-red-500 mx-auto" />}
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
                      <DropdownMenuItem onClick={() => handleEdit(service)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteConfirmation(service)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
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

      <ServiceForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingService(null); }}
        onSave={handleSaveService}
        initialData={editingService}
        allCategories={allCategories}
        allLocations={allLocations}
        isSaving={isSaving}
      />

      {serviceToDelete && (
        <DeleteServiceDialog
          service={serviceToDelete}
          isOpen={showDeleteConfirm}
          onClose={handleDeleteClose}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
