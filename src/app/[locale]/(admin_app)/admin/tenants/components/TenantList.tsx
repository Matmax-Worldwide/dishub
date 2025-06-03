// src/app/[locale]/(admin_app)/admin/tenants/components/TenantList.tsx
"use client";
import { gql, useQuery } from '@apollo/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import TenantForm from './TenantForm';
import { AVAILABLE_FEATURES, FeatureDefinition } from '@/config/features'; // Import feature definitions

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
      features # Ensure this is fetched
    }
  }
`;

// Define a more specific type for tenant data if needed
interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  createdAt: string;
  planId?: string | null;
  features?: string[] | null;
}


// Helper to get feature labels
const getFeatureLabels = (featureIds: string[] | null | undefined): string => {
  if (!featureIds || featureIds.length === 0) return '-';
  return featureIds.map(id => {
    const feature = AVAILABLE_FEATURES.find(f => f.id === id);
    return feature ? feature.label : id; // Show ID if label not found
  }).join(', ');
};

export default function TenantList() {
  const { data, loading, error, refetch } = useQuery<{ allTenants: Tenant[] }>(GET_ALL_TENANTS, {
    errorPolicy: 'all',
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

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

  if (!data || !data.allTenants || data.allTenants.length === 0) {
    return (
      <div className="container mx-auto py-10 text-center">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <Button onClick={() => handleOpenForm()} size="lg">Create New Tenant</Button>
        </div>
        <p className="mb-4 text-gray-500">No tenants found. Get started by creating a new tenant.</p>
        {isFormOpen && (
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
              <TableHead className="w-[200px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan ID</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enabled Features</TableHead>
              <TableHead className="w-[150px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</TableHead>
              <TableHead className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.allTenants.map((tenant: Tenant) => (
              <TableRow key={tenant.id} className="hover:bg-gray-50">
                <TableCell className="font-medium px-4 py-3 whitespace-nowrap">{tenant.name}</TableCell>
                <TableCell className="px-4 py-3">{tenant.slug}</TableCell>
                <TableCell className="px-4 py-3">{tenant.domain || 'N/A'}</TableCell>
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
                <TableCell className="px-4 py-3">{tenant.planId || '-'}</TableCell>
                <TableCell className="text-sm px-4 py-3 max-w-xs truncate" title={getFeatureLabels(tenant.features)}>{getFeatureLabels(tenant.features)}</TableCell>
                <TableCell className="px-4 py-3">{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right px-4 py-3">
                  <Button variant="outline" size="sm" onClick={() => handleOpenForm(tenant)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isFormOpen && (
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
