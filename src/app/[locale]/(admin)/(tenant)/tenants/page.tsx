// src/app/[locale]/(admin_app)/admin/tenants/page.tsx
import TenantList from "./components/TenantList";
import { Suspense } from 'react';

// It's good practice to add Metadata for admin pages as well
export const metadata = {
  title: "Tenant Management | Admin",
  description: "Manage platform tenants.",
};

// This page is for platform admins. Access control should be handled by layout or middleware.
// For client components that fetch data (like TenantList using useQuery),
// ensure you have an ApolloProvider higher up in your component tree.
// This might be in the (admin_app) layout.tsx or a specific providers component.

export default function AdminTenantsPage() {
  return (
    <div className="p-4 md:p-8">
      {/*
        The TenantList component uses Apollo Client's useQuery hook, which requires
        being wrapped in an <ApolloProvider>. This is typically done in a layout
        or a specific client-side provider component higher up the tree.
        If not already set up for (admin_app), it would need to be added.
        For example, in src/app/[locale]/(admin_app)/layout.tsx or a similar place.
      */}
      <Suspense fallback={<div>Loading tenant list...</div>}>
        <TenantList />
      </Suspense>
    </div>
  );
}
