// src/app/[locale]/(admin_app)/admin/tenants/components/TenantForm.tsx
"use client";
import { gql, useMutation } from '@apollo/client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useEffect } from 'react';
import { toast } from 'sonner';
import { AVAILABLE_FEATURES } from '@/config/features'; // Import from config

// Zod schema for validation
const tenantFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  slug: z.string().min(2, { message: "Slug must be at least 2 characters." }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Slug must be lowercase alphanumeric with hyphens." }),
  domain: z.string().optional().nullable().refine(val => !val || val === '' || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val), { message: "Invalid domain format." }),
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED']),
  planId: z.string().optional().nullable(),
  features: z.array(z.string()).optional(),
});

type TenantFormData = z.infer<typeof tenantFormSchema>;

const CREATE_TENANT = gql`
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      id
      name
      slug
    }
  }
`;

const UPDATE_TENANT = gql`
  mutation UpdateTenant($input: UpdateTenantInput!) {
    updateTenant(input: $input) {
      id
      name
      slug
    }
  }
`;

interface TenantFormProps {
  isOpen: boolean;
  onClose: () => void;
  tenantToEdit?: Partial<TenantFormData & { id: string }> | null;
  onTenantSaved: () => void;
}

export default function TenantForm({ isOpen, onClose, tenantToEdit, onTenantSaved }: TenantFormProps) {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      domain: '',
      status: 'ACTIVE',
      planId: '',
      features: [],
    }
  });

  useEffect(() => {
    if (isOpen) { // Only reset form when dialog opens or tenantToEdit changes while open
      if (tenantToEdit) {
        reset({
          name: tenantToEdit.name || '',
          slug: tenantToEdit.slug || '',
          domain: tenantToEdit.domain || '',
          status: tenantToEdit.status || 'ACTIVE',
          planId: tenantToEdit.planId || '',
          features: tenantToEdit.features || [],
        });
      } else {
        reset({
          name: '',
          slug: '',
          domain: '',
          status: 'ACTIVE',
          planId: '',
          features: [],
        });
      }
    }
  }, [tenantToEdit, reset, isOpen]);

  const [createTenantMutation, { loading: createLoading }] = useMutation(CREATE_TENANT);
  const [updateTenantMutation, { loading: updateLoading }] = useMutation(UPDATE_TENANT);

  const onSubmit = async (data: TenantFormData) => {
    // Ensure optional fields that are empty strings are sent as null if schema expects null
    const payload = {
        ...data,
        domain: data.domain || null,
        planId: data.planId || null,
    };

    try {
      if (tenantToEdit && tenantToEdit.id) {
        await updateTenantMutation({ variables: { input: { id: tenantToEdit.id, ...payload } } });
        toast.success(`Tenant "${payload.name}" has been updated successfully.`);
      } else {
        await createTenantMutation({ variables: { input: payload } });
        toast.success(`Tenant "${payload.name}" has been created successfully.`);
      }
      onTenantSaved();
      onClose();
    } catch (error: unknown) {
      console.error("Failed to save tenant:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error("Error saving tenant", { description: errorMessage });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{tenantToEdit ? 'Edit Tenant' : 'Create New Tenant'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} placeholder="e.g. My Awesome Hotel" />} />
            {errors.name && <p className="text-sm font-medium text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Controller name="slug" control={control} render={({ field }) => <Input id="slug" {...field} placeholder="e.g. my-awesome-hotel" />} />
            {errors.slug && <p className="text-sm font-medium text-destructive">{errors.slug.message}</p>}
          </div>
          <div>
            <Label htmlFor="domain">Domain (Optional)</Label>
            <Controller name="domain" control={control} render={({ field }) => <Input id="domain" placeholder="e.g. www.mytenant.com" {...field} value={field.value || ''} />} />
            {errors.domain && <p className="text-sm font-medium text-destructive">{errors.domain.message}</p>}
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-sm font-medium text-destructive">{errors.status.message}</p>}
          </div>
          <div>
            <Label htmlFor="planId">Plan ID (Optional)</Label>
            <Controller name="planId" control={control} render={({ field }) => <Input id="planId" {...field} value={field.value || ''} placeholder="e.g. plan_basic_monthly" />} />
            {errors.planId && <p className="text-sm font-medium text-destructive">{errors.planId.message}</p>}
          </div>

          <div>
            <Label className="mb-2 block">Features</Label>
            <Controller
                name="features"
                control={control}
                render={({ field }) => (
                    <div className="space-y-2 rounded-md border p-4">
                        {AVAILABLE_FEATURES.map((feature) => (
                            <div key={feature.id} className="flex items-center space-x-3">
                                <Checkbox
                                    id={`feature-${feature.id}`}
                                    checked={field.value?.includes(feature.id)}
                                    onCheckedChange={(checked) => {
                                        const currentFeatures = field.value || [];
                                        if (checked) {
                                            field.onChange([...currentFeatures, feature.id]);
                                        } else {
                                            field.onChange(currentFeatures.filter((id) => id !== feature.id));
                                        }
                                    }}
                                />
                                <Label htmlFor={`feature-${feature.id}`} className="font-normal">{feature.label}</Label>
                            </div>
                        ))}
                    </div>
                )}
            />
            {errors.features && <p className="text-sm font-medium text-destructive">{errors.features.message}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || createLoading || updateLoading}>
              {isSubmitting || createLoading || updateLoading ? 'Saving...' : (tenantToEdit ? 'Save Changes' : 'Create Tenant')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
