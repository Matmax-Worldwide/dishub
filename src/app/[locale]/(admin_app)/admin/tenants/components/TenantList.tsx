// src/app/[locale]/(admin_app)/admin/tenants/components/TenantList.tsx
"use client";
// ... other imports (gql, useQuery, useMutation, Table components, Badge, Button, useState, TenantForm, AVAILABLE_FEATURES, useToast)
import { gql, useQuery, useMutation } from '@apollo/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import TenantForm from './TenantForm'; // Assuming this exists and is correctly implemented
import { AVAILABLE_FEATURES } from '@/config/features'; // Assuming this exists
import { toast } from 'sonner'; // Assuming this exists

const GET_ALL_TENANTS = gql`
  query GetAllTenants {
    allTenants {
      id
      name
      slug
      domain
      status
      createdAt
      planId
      features
      vercelProjectId
      defaultDeploymentUrl
      customDomainStatus # Added
    }
  }
`;

const PROVISION_TENANT_SITE = gql`
  mutation ProvisionTenantSite($tenantId: ID!) {
    provisionTenantSite(tenantId: $tenantId) {
      id
      vercelProjectId
      defaultDeploymentUrl
      # Include other fields if needed for UI update
    }
  }
`;

// Helper to get feature labels (assuming this exists from previous steps)
const getFeatureLabels = (featureIds: string[] | null | undefined): string => {
  if (!featureIds || featureIds.length === 0) return '-';
  return featureIds.map(id => {
    const feature = AVAILABLE_FEATURES.find(f => f.id === id);
    return feature ? feature.label : id; // Show ID if label not found
  }).join(', ');
};

interface Tenant { // Define a basic Tenant interface for type safety
    id: string;
    name: string;
    slug: string;
    domain?: string | null;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED'; // Changed from string to specific union type
    createdAt: string;
    planId?: string | null;
    features?: string[]; // Removed null option to match TenantForForm
    vercelProjectId?: string | null;
    defaultDeploymentUrl?: string | null;
}


export default function TenantList() {
  const { data, loading, error, refetch } = useQuery<{ allTenants: Tenant[] }>(GET_ALL_TENANTS, {
    errorPolicy: 'all',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [provisionInProgress, setProvisionInProgress] = useState<Record<string, boolean>>({});


  const [provisionSiteMutation, { loading: provisionMutationLoadingGlobal }] = useMutation(PROVISION_TENANT_SITE, {
    onCompleted: (mutationData) => {
      toast.success(`Site Provisioning Successful: Site for tenant ${mutationData.provisionTenantSite.name || editingTenant?.name } (ID: ${mutationData.provisionTenantSite.id}) has been provisioned.`);
      refetch();
      setProvisionInProgress(prev => ({ ...prev, [mutationData.provisionTenantSite.id]: false }));
    },
    onError: (error) => {
      // Find which tenant was being provisioned if possible, from state or inspect error if it gives clues
      const failedTenantId = Object.keys(provisionInProgress).find(id => provisionInProgress[id]);
      toast.error(`Provisioning Error: ${error.message}`);
      if (failedTenantId) {
        setProvisionInProgress(prev => ({ ...prev, [failedTenantId]: false }));
      }
    }
  });

  const handleOpenForm = (tenant?: Tenant) => {
    setEditingTenant(tenant || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTenant(null);
  };

  const handleTenantSaved = () => {
    refetch();
    handleCloseForm();
  };

  const handleProvisionSite = async (tenantId: string) => {
    if (confirm("Are you sure you want to provision a new Vercel site for this tenant? This may take a few moments.")) {
      setProvisionInProgress(prev => ({ ...prev, [tenantId]: true }));
      try {
        await provisionSiteMutation({ variables: { tenantId } });
        // onCompleted will handle success toast and refetch
      } catch (e) {
        // onError will handle error toast
        // No need to setProvisionInProgress to false here, onError handles it
        console.error("Provision site mutation call failed:", e);
      }
    }
  };

  if (loading) return <p className="text-center py-10">Loading tenants...</p>;
  if (error) {
     return (
      <div className="text-center py-10 text-red-600">
        <p>Error loading tenants: {error.message}</p>
        <p className="text-sm text-gray-500 mt-2">
          Please ensure you have the necessary permissions (SUPER_ADMIN) and that the GraphQL server is running correctly.
        </p>
        <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
      </div>
    );
  }

  const tenants: Tenant[] = data?.allTenants || [];

  if (tenants.length === 0 && !isFormOpen && !loading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <Button onClick={() => handleOpenForm()} size="lg">Create New Tenant</Button>
        </div>
        <p className="mb-4 text-gray-500">No tenants found. Get started by creating a new tenant.</p>
        {isFormOpen && ( // Ensure form can still be opened
          <TenantForm
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            tenantToEdit={editingTenant}
            onTenantSaved={handleTenantSaved}
          />
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tenant Management</h1>
        <Button onClick={() => handleOpenForm()} size="lg">Create New Tenant</Button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deployment URL</TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="w-[180px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => {
              const isCurrentProvisioning = provisionInProgress[tenant.id] || provisionMutationLoadingGlobal && editingTenant?.id === tenant.id; // A bit of a guess for global loading
              return (
                <TableRow key={tenant.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium px-4 py-3 whitespace-nowrap">{tenant.name}</TableCell>
                  <TableCell className="px-4 py-3">{tenant.slug}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      variant={tenant.status === 'ACTIVE' ? 'default' : (tenant.status === 'SUSPENDED' ? 'destructive' : 'secondary')}
                      className={`capitalize ${tenant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                              tenant.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                                              tenant.status === 'ARCHIVED' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-gray-100 text-gray-800'}`}
                    >
                      {tenant.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {tenant.defaultDeploymentUrl ?
                      <a href={tenant.defaultDeploymentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{tenant.defaultDeploymentUrl.replace(/^https?:\/\//, '')}</a>
                      :
                      <span className="text-gray-500">Not Deployed</span>}
                  </TableCell>
                  <TableCell className="text-sm px-4 py-3 max-w-xs truncate" title={getFeatureLabels(tenant.features)}>{getFeatureLabels(tenant.features)}</TableCell>
                  <TableCell className="text-right px-4 py-3 space-x-2 whitespace-nowrap">
                    <Button variant="outline" size="sm" onClick={() => handleOpenForm(tenant)} disabled={isCurrentProvisioning}>Edit</Button>
                    {!tenant.vercelProjectId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProvisionSite(tenant.id)}
                        disabled={isCurrentProvisioning}
                      >
                        {isCurrentProvisioning ? 'Provisioning...' : 'Provision Site'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {isFormOpen && ( // Render form outside the table but within the main div
        <TenantForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          tenantToEdit={editingTenant}
          onTenantSaved={handleTenantSaved}
        />
      )}
    </div>
  );
}
