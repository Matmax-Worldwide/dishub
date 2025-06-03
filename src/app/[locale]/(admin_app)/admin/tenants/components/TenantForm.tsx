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
import { useEffect, useState } from 'react';

import { toast } from 'sonner';

import { AVAILABLE_FEATURES } from '@/config/features';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const tenantFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  slug: z.string().min(2, { message: "Slug must be at least 2 characters." }).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "Slug must be lowercase alphanumeric with hyphens." }),
  // domain: z.string().optional().nullable().refine(val => !val || val === '' || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val), { message: "Invalid domain format." }), // Domain handled separately
  status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED']),
  planId: z.string().optional().nullable(),
  features: z.array(z.string()).optional(),
});

type TenantFormData = z.infer<typeof tenantFormSchema>;


// DNS Record type for Vercel domain verification
interface DNSRecord {
  type: string;
  name: string;
  value: string;
}

// Extended Tenant type for the form, including fields not in Zod schema for tenant details
interface TenantForForm extends TenantFormData {
    id: string;
    domain?: string | null;
    customDomainStatus?: string | null;
    vercelProjectId?: string | null;
}

interface TenantFormProps {
  isOpen: boolean;
  onClose: () => void;
  tenantToEdit?: TenantForForm | null;
  onTenantSaved: () => void; // Callback to refetch list or update UI
}

const CREATE_TENANT = gql`
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) { id name slug status domain planId features } # Fetch more fields if needed
  }
`;
const UPDATE_TENANT = gql`
  mutation UpdateTenant($input: UpdateTenantInput!) {
    updateTenant(input: $input) { id name slug status domain planId features } # Fetch more fields if needed
  }
`;

const ADD_OR_UPDATE_DOMAIN = gql`
  mutation AddOrUpdateTenantCustomDomain($tenantId: ID!, $domain: String!) {
    addOrUpdateTenantCustomDomain(tenantId: $tenantId, domain: $domain) {
      name # Domain name
      verified
      verification { type name value }
      # Potentially other fields from VercelDomainConfig like apexName, projectId etc.
    }
  }
`;
const CHECK_DOMAIN_STATUS = gql`
  mutation CheckTenantCustomDomainStatus($tenantId: ID!) {
    checkTenantCustomDomainStatus(tenantId: $tenantId) {
      name # Domain name
      verified
      verification { type name value }
      # Potentially other fields from VercelDomainConfig
    }
  }
`;
const REMOVE_DOMAIN = gql`
  mutation RemoveTenantCustomDomain($tenantId: ID!) {
    removeTenantCustomDomain(tenantId: $tenantId) {
      id
      domain # Should be null after removal
      customDomainStatus # Should reflect removal
    }
  }
`;


export default function TenantForm({ isOpen, onClose, tenantToEdit, onTenantSaved }: TenantFormProps) { 

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: { name: '', slug: '', status: 'ACTIVE', planId: '', features: [] }
  });

  const [currentDomainInput, setCurrentDomainInput] = useState('');

  const [dnsRecords, setDnsRecords] = useState<DNSRecord[] | null>(null); // Type for VercelDNSRecord if defined


  useEffect(() => {
    if (isOpen) {
        if (tenantToEdit) {
            reset({
                name: tenantToEdit.name || '',
                slug: tenantToEdit.slug || '',
                // domain: tenantToEdit.domain || '', // Domain is handled by currentDomainInput
                status: tenantToEdit.status || 'ACTIVE',
                planId: tenantToEdit.planId || '',
                features: tenantToEdit.features || [],
            });
            setCurrentDomainInput(tenantToEdit.domain || '');
        } else {
            reset({ name: '', slug: '', status: 'ACTIVE', planId: '', features: [] });
            setCurrentDomainInput('');
        }
        setDnsRecords(null); // Clear DNS records when form opens/tenant changes
    }
  }, [tenantToEdit, isOpen, reset]);

  const [createTenantMutation, { loading: createLoading }] = useMutation(CREATE_TENANT);
  const [updateTenantMutation, { loading: updateLoading }] = useMutation(UPDATE_TENANT);

  const [addOrUpdateDomainMutation, { loading: domainOpLoading }] = useMutation(ADD_OR_UPDATE_DOMAIN, {
    onCompleted: (data) => {
      const domainConfig = data.addOrUpdateTenantCustomDomain;

      toast.success(`Domain Update Initiated: Vercel is processing the domain ${domainConfig.name}. Refresh status shortly.`);

      if (domainConfig.verification && domainConfig.verification.length > 0 && !domainConfig.verified) {
        setDnsRecords(domainConfig.verification);
      } else { setDnsRecords(null); }
      onTenantSaved(); // Refetch tenant list to show updated domain/status
    },

    onError: (error) => { toast.error(`Domain Error: ${error.message}`); setDnsRecords(null); }

  });

  const [checkDomainStatusMutation, { loading: statusCheckLoading }] = useMutation(CHECK_DOMAIN_STATUS, {
    onCompleted: (data) => {
      const config = data.checkTenantCustomDomainStatus;

      toast.success(`Domain Status Refreshed: Domain ${config.name} is ${config.verified ? 'VERIFIED' : 'PENDING or ERROR'}. DNS records updated if verification is pending.`);

       if (config.verification && config.verification.length > 0 && !config.verified) {
        setDnsRecords(config.verification);
      } else { setDnsRecords(null); }
      onTenantSaved(); // Refetch tenant list
    },

    onError: (error) => toast.error(`Status Check Error: ${error.message}`)

  });

  const [removeDomainMutation, { loading: removeDomainLoading }] = useMutation(REMOVE_DOMAIN, {
    onCompleted: () => {

      toast.success("Domain Removed: Custom domain has been successfully removed.");

      setCurrentDomainInput('');
      setDnsRecords(null);
      onTenantSaved(); // Refetch tenant list
    },

    onError: (error) => toast.error(`Remove Domain Error: ${error.message}`)

  });

  const onSubmitTenantDetails = async (data: TenantFormData) => {
    // This function now only submits core tenant details, not the domain.
    const payload = {
        ...data,
        planId: data.planId || null, // Ensure empty string becomes null
    };
    try {
      if (tenantToEdit && tenantToEdit.id) {
        await updateTenantMutation({ variables: { input: { id: tenantToEdit.id, ...payload } } });

        toast.success(`Tenant Details Updated: Tenant "${payload.name}" details have been saved.`);
      } else {
        // This part is for creating a new tenant. Domain is not set here.
        await createTenantMutation({ variables: { input: payload } });
        toast.success(`Tenant Created: Tenant "${payload.name}" has been created.`);

      }
      onTenantSaved();
      if (!tenantToEdit) { // If it was a new tenant creation, close the form.
        onClose();
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save tenant details.";
      toast.error(`Error Saving Tenant: ${errorMessage}`);

    }
  };

  const handleSaveDomain = () => {
    if (!tenantToEdit?.id || !currentDomainInput.trim()) {

        toast.error("Input Error: Tenant ID is missing or domain field is empty."); return;
    }
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(currentDomainInput.trim())) {
        toast.error("Invalid Domain: Please enter a valid domain format (e.g., example.com)."); return;

    }
    setDnsRecords(null); // Clear previous DNS records
    addOrUpdateDomainMutation({ variables: { tenantId: tenantToEdit.id, domain: currentDomainInput.trim() } });
  };

  const handleCheckStatus = () => {
    if (!tenantToEdit?.id || !tenantToEdit.domain) {

        toast.info("No domain is currently configured for this tenant to check its status."); return;

    }
    setDnsRecords(null); // Clear previous DNS records
    checkDomainStatusMutation({ variables: { tenantId: tenantToEdit.id } });
  };

  const handleRemoveDomain = () => {
    if (!tenantToEdit?.id || !tenantToEdit.domain) {

        toast.info("No domain is currently configured for this tenant to remove."); return;

    }
    if (confirm(`Are you sure you want to remove the domain "${tenantToEdit.domain}" for this tenant? This action will attempt to remove it from Vercel and clear it from the tenant record.`)) {
      removeDomainMutation({ variables: { tenantId: tenantToEdit.id } });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader><DialogTitle>{tenantToEdit ? `Edit Tenant: ${tenantToEdit.name}` : 'Create New Tenant'}</DialogTitle></DialogHeader>

        <form onSubmit={handleSubmit(onSubmitTenantDetails)} className="space-y-4 border-b pb-6 mb-6 border-gray-200">
          {/* Core Tenant Details Fields */}
          <div>
            <Label htmlFor="name">Name</Label>
            <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} placeholder="e.g. My Awesome Hotel" />} />
            {errors.name && <p className="text-sm font-medium text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Controller name="slug" control={control} render={({ field }) => <Input id="slug" {...field} placeholder="e.g. my-awesome-hotel" disabled={!!tenantToEdit} />} />
            {errors.slug && <p className="text-sm font-medium text-destructive">{errors.slug.message}</p>}
            {!!tenantToEdit && <p className="text-xs text-muted-foreground">Slug cannot be changed after creation.</p>}
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Controller name="status" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue={tenantToEdit?.status || "ACTIVE"}>
                    <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem><SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem><SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                </Select>
            )} />
            {errors.status && <p className="text-sm font-medium text-destructive">{errors.status.message}</p>}
          </div>
          <div>
            <Label htmlFor="planId">Plan ID (Optional)</Label>
            <Controller name="planId" control={control} render={({ field }) => <Input id="planId" {...field} value={field.value || ''} placeholder="e.g. plan_basic_monthly"/>} />
            {errors.planId && <p className="text-sm font-medium text-destructive">{errors.planId.message}</p>}
          </div>
          <div>
            <Label className="mb-2 block">Features</Label>
            <Controller name="features" control={control} render={({ field }) => (
                <div className="space-y-2 rounded-md border p-4 max-h-40 overflow-y-auto">
                    {AVAILABLE_FEATURES.map((feature) => (
                        <div key={feature.id} className="flex items-center space-x-3">
                            <Checkbox id={`feature-${feature.id}`} checked={field.value?.includes(feature.id)}
                                onCheckedChange={(checked) => {
                                    const cv = field.value || [];
                                    field.onChange(checked ? [...cv, feature.id] : cv.filter(id => id !== feature.id));
                                }}/>
                            <Label htmlFor={`feature-${feature.id}`} className="font-normal">{feature.label}</Label>
                        </div>
                    ))}
                </div>
            )} />
             {errors.features && <p className="text-sm font-medium text-destructive">{errors.features.message}</p>}
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting || createLoading || updateLoading}>
              {isSubmitting || createLoading || updateLoading ? 'Saving Details...' : 'Save Tenant Details'}
            </Button>
          </div>
        </form>

        {/* Custom Domain Management Section - Only if editing an existing tenant with a Vercel Project ID */}
        {tenantToEdit && tenantToEdit.id && tenantToEdit.vercelProjectId && (
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium border-t pt-4">Custom Domain Management</h3>
            <div className="text-sm text-muted-foreground">
              <p>Vercel Project ID: {tenantToEdit.vercelProjectId}</p>
              <p>Current Domain: <strong>{tenantToEdit.domain || 'Not set'}</strong></p>
              <p>Status: <span className={`font-semibold ${tenantToEdit.customDomainStatus === 'VERIFIED' ? 'text-green-600' : 'text-orange-600'}`}>{tenantToEdit.customDomainStatus || 'N/A'}</span></p>
            </div>

            <div className="flex items-end space-x-2">
              <div className="flex-grow">
                <Label htmlFor="customDomainInput" className="text-sm font-medium">Set/Update Domain</Label>
                <Input id="customDomainInput" value={currentDomainInput} onChange={(e) => setCurrentDomainInput(e.target.value)} placeholder="e.g., www.mytenant.com" />
              </div>
              <Button type="button" onClick={handleSaveDomain} disabled={domainOpLoading || !currentDomainInput.trim() || currentDomainInput.trim() === tenantToEdit.domain}>
                {domainOpLoading ? 'Processing...' : (tenantToEdit.domain ? 'Update Domain' : 'Set Domain')}
              </Button>
            </div>

            {tenantToEdit.domain && (
              <div className="flex space-x-2 mt-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCheckStatus} disabled={statusCheckLoading || domainOpLoading}>
                  {statusCheckLoading ? 'Checking...' : 'Refresh Status'}
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={handleRemoveDomain} disabled={removeDomainLoading || domainOpLoading}>
                  {removeDomainLoading ? 'Removing...' : 'Remove Domain'}
                </Button>
              </div>
            )}

            {dnsRecords && dnsRecords.length > 0 && (
              <Alert className="mt-4 bg-blue-50 border-blue-300 text-blue-800">
                <AlertTitle className="font-semibold text-blue-900">DNS Configuration Required for {currentDomainInput.trim() || tenantToEdit.domain}</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">To use the domain, add the following DNS record(s) with your domain provider:</p>
                  {dnsRecords.map((rec, i) => (
                    <div key={i} className="mt-2 p-2 border border-blue-200 rounded bg-blue-100 text-xs">
                      <strong>Type:</strong> {rec.type} <br/>
                      <strong>Name:</strong> {rec.name || '@'} ({rec.type==='CNAME' && (rec.name==='@' || rec.name === '') ?'use bare domain (e.g. example.com)':rec.name})<br/>
                      <strong>Value:</strong> {rec.value}
                    </div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="mt-8">
            <DialogClose asChild><Button type="button" variant="ghost">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
