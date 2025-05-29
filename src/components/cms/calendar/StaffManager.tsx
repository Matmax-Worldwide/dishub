'use client';

import React, { useState, useEffect, useCallback } from 'react';
import graphqlClient from '@/lib/graphql-client';
import { StaffProfile, User, Service, Location, StaffScheduleInput, DayOfWeek as PrismaDayOfWeek, ScheduleType as PrismaScheduleType } from '@/types/calendar';
import StaffForm from './StaffForm';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

// Local DayOfWeek enum for UI iteration if not easily importable for client-side
enum DayOfWeek {
    MONDAY = "MONDAY", TUESDAY = "TUESDAY", WEDNESDAY = "WEDNESDAY",
    THURSDAY = "THURSDAY", FRIDAY = "FRIDAY", SATURDAY = "SATURDAY", SUNDAY = "SUNDAY",
}
enum ScheduleType { REGULAR_HOURS = "REGULAR_HOURS" }


export default function StaffManager() {
  const [staffMembers, setStaffMembers] = useState<StaffProfile[]>([]);
  const [allUsers, setAllUsers] = useState<Partial<User>[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState<Partial<StaffProfile> & { schedules?: StaffScheduleInput[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffProfile | null>(null);

  const fetchData = useCallback(async (showToasts = false) => {
    setIsLoadingData(true);
    setError(null);
    try {
      const [staffData, usersData, servicesData, locationsData] = await Promise.all([
        graphqlClient.staffProfiles(), // Ensure this fetches user {firstName, lastName, email} and schedules
        graphqlClient.users(),      // Ensure this fetches basic user list for select
        graphqlClient.services(),   // For assignment
        graphqlClient.locations(),  // For assignment
      ]);
      setStaffMembers(staffData || []);
      setAllUsers(usersData || []);
      setAllServices(servicesData || []);
      setAllLocations(locationsData || []);
      if (showToasts) toast.success("Staff data refreshed");
    } catch (err: any) {
      console.error('Failed to fetch staff management data:', err);
      const errorMsg = `Failed to load data: ${err.message || 'Unknown error'}`;
      setError(errorMsg);
      if (showToasts) toast.error(errorMsg);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const usersAvailableForStaffAssignment = allUsers.filter(
    user => !staffMembers.some(staff => staff.userId === user.id)
  );

  const handleAddNew = () => {
    setEditingStaffMember(null);
    setIsFormOpen(true);
  };

  const handleEdit = (staffMember: StaffProfile) => {
    // Prepare initialData for StaffForm, especially schedules
    const regularSchedules = (staffMember.schedules || [])
        .filter(s => s.scheduleType === PrismaScheduleType.REGULAR_HOURS)
        .map(s => ({ // Map to StaffScheduleInput
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isAvailable: s.isAvailable,
            scheduleType: PrismaScheduleType.REGULAR_HOURS, // Ensure this is correctly typed/mapped
        }));

    setEditingStaffMember({ ...staffMember, schedules: regularSchedules });
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (staffMember: StaffProfile) => {
    setStaffToDelete(staffMember);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    setIsSaving(true);
    try {
      await graphqlClient.deleteStaffProfile({ id: staffToDelete.id });
      toast.success(`Staff member "${staffToDelete.user?.firstName} ${staffToDelete.user?.lastName}" deleted.`);
      fetchData(false); 
    } catch (err: any) {
      toast.error(`Failed to delete staff: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
    }
  };

  const handleSaveStaff = async (data: { staffProfileData: Partial<StaffProfile>; scheduleData: StaffScheduleInput[] }) => {
    setIsSaving(true);
    setError(null);
    const { staffProfileData, scheduleData } = data;

    try {
      let savedProfile: StaffProfile;
      if (editingStaffMember?.id) { // Editing
        savedProfile = await graphqlClient.updateStaffProfile({ id: editingStaffMember.id, input: staffProfileData });
        toast.success(`Staff member "${savedProfile.user?.firstName}" updated.`);
      } else { // Creating
        savedProfile = await graphqlClient.createStaffProfile({ input: staffProfileData });
        toast.success(`Staff member "${savedProfile.user?.firstName}" created.`);
      }

      if (savedProfile && savedProfile.id && scheduleData) {
        // Ensure scheduleData items have scheduleType set to REGULAR_HOURS
        const typedScheduleData = scheduleData.map(s => ({...s, scheduleType: PrismaScheduleType.REGULAR_HOURS}));
        await graphqlClient.updateStaffSchedule({ staffProfileId: savedProfile.id, schedule: typedScheduleData });
        toast.success(`Schedule updated for ${savedProfile.user?.firstName}.`);
      }
      
      fetchData(false); 
      setIsFormOpen(false);
      setEditingStaffMember(null);
    } catch (err: any) {
      const errorMsg = `Failed to save staff: ${err.message || 'Unknown error'}`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoadingData && staffMembers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">Loading staff data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>{/* Placeholder for filters */}</div>
        <Button onClick={handleAddNew} disabled={isLoadingData}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Staff
        </Button>
      </div>

      {error && !isLoadingData && (
         <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
           <span className="font-medium">Error:</span> {error}
         </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Services</TableHead>
              <TableHead className="hidden md:table-cell">Locations</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isLoadingData && staffMembers.length > 0) && (
                <TableRow><TableCell colSpan={5} className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground inline-block mr-2" /> Refreshing data...
                </TableCell></TableRow>
            )}
            {!isLoadingData && staffMembers.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No staff members found.</TableCell></TableRow>
            )}
            {staffMembers.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell className="font-medium">{staff.user?.firstName} {staff.user?.lastName}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{staff.user?.email}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {staff.assignedServices && staff.assignedServices.length > 0 
                    ? <Badge variant="outline">{staff.assignedServices.length} services</Badge>
                    : <Badge variant="secondary">None</Badge>}
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {staff.locationAssignments && staff.locationAssignments.length > 0 
                    ? <Badge variant="outline">{staff.locationAssignments.length} locations</Badge>
                    : <Badge variant="secondary">None</Badge>}
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
                      <DropdownMenuItem onClick={() => handleEdit(staff)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile & Schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteConfirmation(staff)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Staff
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <StaffForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingStaffMember(null); }}
        onSave={handleSaveStaff}
        initialData={editingStaffMember}
        allUsersForSelect={usersAvailableForStaffAssignment}
        allServices={allServices}
        allLocations={allLocations}
        isSaving={isSaving}
      />

      {staffToDelete && (
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete staff member 
                "{staffToDelete.user?.firstName} {staffToDelete.user?.lastName}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStaffToDelete(null)}>Cancel</AlertDialogCancel>
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

// Extend types for props if they are not fully defined globally
// This helps Manager and Form to agree on the shape of data
declare module '@/types/calendar' {
    export interface StaffProfile {
        // Ensure these are arrays of objects with at least an ID for mapping in form
        assignedServices?: { id: string; name?: string; }[]; 
        locationAssignments?: { id: string; name?: string; }[]; 
        schedules?: StaffScheduleInput[]; // For passing to form
    }
     export interface User { // For allUsersForSelect prop
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        email: string;
    }
}
