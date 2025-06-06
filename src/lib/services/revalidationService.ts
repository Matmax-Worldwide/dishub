// src/lib/services/revalidationService.ts
import { prismaManager } from '@/lib/prisma'; // For accessing Tenant data (using non-scoped client)
// import fetch from 'node-fetch'; // Or any other HTTP client like axios. globalThis.fetch is used.

interface RevalidationPayload { // Renamed from RevalidationItem for clarity as it's a payload
  paths?: string[];
  tags?: string[];
}

export interface RevalidationTriggerResponse { // Renamed for clarity as this is the response of this service function
  success: boolean;
  message: string;
  details?: TenantApiRevalidateResponse;
}

// Define a more specific type for the expected response from the tenant's /api/revalidate endpoint
interface TenantApiRevalidateResponse {
  revalidatedItemsProcessed: number;
  anySuccessfulRevalidation: boolean;
  allRevalidationsSucceeded: boolean;
  details: Array<{ type: string; item: string; success: boolean; error?: string; message?: string }>;
  timestamp: string;
  message?: string; // Optional top-level message from the revalidation API
}


export async function triggerTenantSiteRevalidation(
  tenantId: string,
  itemsToRevalidate: RevalidationPayload
): Promise<RevalidationTriggerResponse> {
  if ((!itemsToRevalidate.paths || itemsToRevalidate.paths.length === 0) &&
      (!itemsToRevalidate.tags || itemsToRevalidate.tags.length === 0)) {
    return { success: false, message: "No paths or tags provided for revalidation." };
  }

  const platformPrisma = prismaManager.getClient(); // Use non-scoped client

  const tenant = await platformPrisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      domain: true,
      defaultDeploymentUrl: true,
      revalidationSecretToken: true,
      vercelProjectId: true,
      customDomainStatus: true,
    }
  });

  if (!tenant) {
    console.error(`Revalidation Trigger: Tenant not found for ID: ${tenantId}`);
    return { success: false, message: "Tenant not found." };
  }

  if (!tenant.vercelProjectId) {
    console.warn(`Revalidation Trigger: Site not provisioned for tenant ID: ${tenantId}. Skipping revalidation.`);
    return { success: false, message: "Site not provisioned for this tenant. Cannot revalidate." };
  }

  if (!tenant.revalidationSecretToken) {
    console.error(`Revalidation Trigger: Revalidation secret token is missing for tenant ID: ${tenantId}.`);
    return { success: false, message: "Revalidation secret token not configured for this tenant. Cannot revalidate." };
  }

  let targetDomain = tenant.domain && tenant.customDomainStatus === 'VERIFIED'
                     ? tenant.domain
                     : tenant.defaultDeploymentUrl;

  if (!targetDomain) {
    console.error(`Revalidation Trigger: No valid (verified custom or default deployment) URL found for tenant ID: ${tenantId}.`);
    return { success: false, message: "No deployment URL or verified custom domain for this tenant. Cannot revalidate." };
  }

  if (!targetDomain.startsWith('http://') && !targetDomain.startsWith('https://')) {
    targetDomain = `https://${targetDomain}`;
  }

  const revalidationApiUrl = `${targetDomain}/api/revalidate`;

  console.log(`Revalidation Trigger: Sending revalidation request to ${revalidationApiUrl} for tenant ${tenantId}`, itemsToRevalidate);

  try {
    const response = await globalThis.fetch(revalidationApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Revalidation-Secret': tenant.revalidationSecretToken,
      },
      body: JSON.stringify(itemsToRevalidate),
    });

    const responseBodyText = await response.text();
    let responseData: TenantApiRevalidateResponse;

    try {
        responseData = JSON.parse(responseBodyText);
    } catch {
        console.error(`Revalidation Trigger: Failed to parse JSON response from ${revalidationApiUrl}. Status: ${response.status}, Body: ${responseBodyText}`);
        return {
            success: false,
            message: `Failed to parse JSON response from tenant revalidation API. Status: ${response.status}`,
        };
    }

    if (!response.ok) {
      console.error(`Revalidation Trigger: HTTP error from ${revalidationApiUrl}. Status: ${response.status}, Response:`, responseData);
      return {
        success: false,
        message: `HTTP error from tenant revalidation API: ${response.status}. ${responseData.message || ''}`,
        details: responseData
      };
    }

    const typedResponseData = responseData as TenantApiRevalidateResponse;

    if (typedResponseData.allRevalidationsSucceeded) {
      return {
        success: true,
        message: `Successfully triggered revalidation for tenant ${tenantId}. All ${typedResponseData.revalidatedItemsProcessed} items processed successfully.`,
        details: typedResponseData
      };
    } else if (typedResponseData.anySuccessfulRevalidation) {
         return {
            success: true,
            message: `Triggered revalidation for tenant ${tenantId}. Some items may have failed. Processed: ${typedResponseData.revalidatedItemsProcessed}. Check details.`,
            details: typedResponseData
         };
    } else {
        return {
            success: false,
            message: `Revalidation attempted for tenant ${tenantId}, but no items were successfully revalidated or an issue occurred. ${typedResponseData.message || ''}`,
            details: typedResponseData
        };
    }

  } catch (error: Error | unknown) {
    console.error(`Revalidation Trigger: Network or unexpected error calling revalidation API for tenant ${tenantId} at ${revalidationApiUrl}:`, error);
    return {
      success: false,
      message: `Network or unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Example usage (to be called from CMS hooks or background jobs):
// async function handleContentUpdate(tenantId: string, updatedPageSlug: string) {
//   const result = await triggerTenantSiteRevalidation(tenantId, { paths: [`/page/${updatedPageSlug}`] });
//   if (result.success) {
//     console.log(result.message);
//   } else {
//     console.error("Revalidation trigger failed:", result.message, result.details);
//   }
// }

// async function handleGlobalMenuUpdate(tenantId: string) {
//    // Revalidate a common tag that affects layout or all pages using the menu
//    const result = await triggerTenantSiteRevalidation(tenantId, { tags: ['layout-menu', `tenant:${tenantId}:global`] });
//    // ...
// }
