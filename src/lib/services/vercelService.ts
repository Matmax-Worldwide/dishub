// src/lib/services/vercelService.ts
import { Tenant } from '@prisma/client'; // Assuming Prisma Tenant type
import crypto from 'crypto';
// import fetch from 'node-fetch'; // Or any other HTTP client

// Keep the existing vercelApiRequest helper function...
async function vercelApiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH', // Added PATCH
  body?: Record<string, unknown>,
  teamId?: string
) {
  const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
  if (!VERCEL_API_TOKEN) {
    throw new Error('VERCEL_API_TOKEN environment variable is required');
  }

  const url = `https://api.vercel.com${endpoint}${teamId ? `?teamId=${teamId}` : ''}`;
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  // Log the request for debugging (but be careful with sensitive data)
  console.log(`Vercel API ${method} ${url}`);
  
  // For debugging, log a sanitized version of the body (remove sensitive env vars)
  if (body) {
    let loggableBody = body;
    if (body.environmentVariables && Array.isArray(body.environmentVariables)) {
    loggableBody = {
        ...body,
        environmentVariables: body.environmentVariables.map((env: { key: string; type: string; target: string }) => ({
            key: env.key, // Only log key, type, target for env vars
            type: env.type,
            target: env.target,
            value: '[REDACTED]' // Don't log the actual value
        }))
    };
    }
    console.log('Request body (sanitized):', JSON.stringify(loggableBody, null, 2));
  }


  const response = await globalThis.fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Vercel API Error: ${response.status} - ${errorText}`);
    try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Vercel API request failed: ${response.status} - ${errorJson.error?.message || errorText}`);
    } catch {
        throw new Error(`Vercel API request failed: ${response.status} - ${errorText}`);
    }
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch (error: Error | unknown) { // Added type for 'e'
    console.error(`Error parsing JSON response from Vercel for ${method} ${url}. Status: ${response.status}`, error);
    throw new Error(`Failed to parse JSON response from Vercel: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


// Keep existing VercelProjectCreationResult and createVercelProjectForTenant functions...
export interface VercelProjectCreationResult {
  vercelProjectId: string;
  defaultDeploymentUrl: string;
  generatedRevalToken: string;
  vercelProjectName: string;
}

export async function createVercelProjectForTenant(
  tenant: Pick<Tenant, 'id' | 'slug' | 'name'>,
  gitRepoConfig: { owner: string; repo: string; type?: string; productionBranch?: string; deployHooks?: unknown[] }
): Promise<VercelProjectCreationResult> {
  const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

  if (!process.env.CMS_GRAPHQL_URL || !process.env.NEXT_PUBLIC_CMS_GRAPHQL_URL) {
    throw new Error('CMS_GRAPHQL_URL or NEXT_PUBLIC_CMS_GRAPHQL_URL is not set in environment variables.');
  }

  const generatedRevalToken = crypto.randomBytes(32).toString('hex');
  const vercelProjectName = `tenant-${tenant.slug.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 50)}-${crypto.randomBytes(2).toString('hex')}`;

  const environmentVariables = [
    { key: 'TENANT_ID', value: tenant.id, type: 'encrypted', target: ['production', 'preview', 'development'] },
    { key: 'NEXT_PUBLIC_TENANT_ID', value: tenant.id, type: 'plain', target: ['production', 'preview', 'development'] },
    { key: 'CMS_GRAPHQL_URL', value: process.env.CMS_GRAPHQL_URL, type: 'encrypted', target: ['production', 'preview', 'development'] },
    { key: 'NEXT_PUBLIC_CMS_GRAPHQL_URL', value: process.env.NEXT_PUBLIC_CMS_GRAPHQL_URL, type: 'plain', target: ['production', 'preview', 'development'] },
    { key: 'REVALIDATION_SECRET_TOKEN', value: generatedRevalToken, type: 'encrypted', target: ['production', 'preview', 'development'] },
    ...(process.env.APP_DOMAIN ? [{ key: 'NEXT_PUBLIC_APP_DOMAIN', value: process.env.APP_DOMAIN, type: 'plain', target: ['production', 'preview', 'development'] }] : []),
    ...(process.env.PREVIEW_SECRET_TOKEN ? [{ key: 'PREVIEW_SECRET_TOKEN', value: process.env.PREVIEW_SECRET_TOKEN, type: 'encrypted', target: ['production', 'preview', 'development'] }] : []),
    ...(process.env.HOMEPAGE_SLUG ? [{ key: 'HOMEPAGE_SLUG', value: process.env.HOMEPAGE_SLUG, type: 'plain', target: ['production', 'preview', 'development'] }] : []),
  ];

  const projectData = {
    name: vercelProjectName,
    framework: 'nextjs',
    rootDirectory: 'packages/tenant-site-template',
    gitRepository: {
      type: gitRepoConfig.type || 'github',
      repo: `${gitRepoConfig.owner}/${gitRepoConfig.repo}`,
    },
    environmentVariables: environmentVariables,
    ...(gitRepoConfig.productionBranch && { productionBranch: gitRepoConfig.productionBranch }),
    ...(gitRepoConfig.deployHooks ? { deployHooks: gitRepoConfig.deployHooks } : {})
  };

  // Use a modified loggableBody for console.log as done in vercelApiRequest
  const loggableProjectData = { ...projectData, environmentVariables: projectData.environmentVariables.map(ev => ({ ...ev, value: '[REDACTED_FOR_LOG]' }))};
  console.log(`Attempting to create Vercel project with data:`, JSON.stringify(loggableProjectData, null, 2));


  try {
    const createdProject = await vercelApiRequest(`/v10/projects`, 'POST', projectData, VERCEL_TEAM_ID);

    if (!createdProject || !createdProject.id ) { // Simplified check, relies on Vercel returning at least an id
      console.error('Unexpected Vercel API response structure after project creation (missing id):', createdProject);
      throw new Error('Failed to create Vercel project or determine default URL due to unexpected API response (missing id).');
    }

    let defaultUrl = '';
    // Vercel API v10 for project creation often returns alias array with objects like { domain: 'project-name-git-branch-org.vercel.app', ... }
    if (createdProject.alias && Array.isArray(createdProject.alias) && createdProject.alias.length > 0) {
        const productionAlias = createdProject.alias.find((a: { domain: string }) => a.domain.endsWith('.vercel.app') && !a.domain.includes('-git-')); // Try to find a clean .vercel.app URL
        if (productionAlias && productionAlias.domain) {
            defaultUrl = `https://${productionAlias.domain}`;
        } else if (createdProject.alias[0].domain) { // Fallback to the first alias domain
            defaultUrl = `https://${createdProject.alias[0].domain}`;
        }
    }

    if (!defaultUrl && createdProject.targets?.production?.alias?.[0]) { // Older or different response structure for targets
        defaultUrl = `https://${createdProject.targets.production.alias[0]}`;
    }

    if (!defaultUrl && createdProject.name) { // Fallback if specific alias paths are not found
        defaultUrl = `https://${createdProject.name}.vercel.app`;
        console.warn(`Could not find specific default alias in Vercel response for project ${createdProject.id}, constructed as: ${defaultUrl}. Check Vercel API response structure.`);
    }

    if (!defaultUrl) { // If still no URL
        console.error('Could not determine default deployment URL from Vercel response:', createdProject);
        throw new Error('Failed to determine default deployment URL from Vercel project creation response.');
    }


    console.log('Vercel project created successfully:', createdProject.id, defaultUrl);
    return {
      vercelProjectId: createdProject.id,
      defaultDeploymentUrl: defaultUrl,
      generatedRevalToken: generatedRevalToken,
      vercelProjectName: vercelProjectName,
    };

  } catch (error) {
    console.error('Error in createVercelProjectForTenant:', error);
    throw error;
  }
}


// --- New Domain Management Functions ---

export interface VercelDomainVerificationRecord {
  type: string;
  name: string;
  value: string;
  reason?: string; // Vercel sometimes provides a reason for certain TXT records
}

export interface VercelDomainConfig {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: number | null;
  gitBranch?: string | null;
  verified: boolean;
  verification?: VercelDomainVerificationRecord[];
  createdAt?: number; // Timestamps are often numbers (milliseconds)
  updatedAt?: number;
  id?: string; // Domain configuration itself has an ID
}

/**
 * Adds a custom domain to a Vercel project.
 * @returns The domain configuration from Vercel, including verification records if needed.
 */
export async function addCustomDomainToVercelProject(
  vercelProjectId: string,
  domain: string
): Promise<VercelDomainConfig> {
  const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
  console.log(`Adding domain ${domain} to Vercel project ${vercelProjectId}`);
  // The body for adding a domain is just { name: "domain.com" }
  // The projectId is in the URL path.
  return vercelApiRequest(`/v10/projects/${vercelProjectId}/domains`, 'POST', { name: domain }, VERCEL_TEAM_ID);
}

/**
 * Checks the status and configuration of a custom domain in a Vercel project.
 * @returns The domain configuration from Vercel.
 */
export async function checkCustomDomainStatus(
  vercelProjectId: string,
  domain: string
): Promise<VercelDomainConfig> {
  const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
  console.log(`Checking status for domain ${domain} in Vercel project ${vercelProjectId}`);
  // Vercel API v9/projects/{idOrName}/domains/{domain}
  return vercelApiRequest(`/v9/projects/${vercelProjectId}/domains/${domain}`, 'GET', undefined, VERCEL_TEAM_ID);
}

/**
 * Removes a custom domain from a Vercel project.
 * @returns Typically null or an empty success response from Vercel for DELETE.
 */
export async function removeCustomDomainFromVercelProject(
  vercelProjectId: string,
  domain: string
): Promise<null | unknown> { // Vercel API for domain deletion usually returns 204 No Content
  const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
  console.log(`Removing domain ${domain} from Vercel project ${vercelProjectId}`);
  // Vercel API v9/projects/{idOrName}/domains/{domain}
  return vercelApiRequest(`/v9/projects/${vercelProjectId}/domains/${domain}`, 'DELETE', undefined, VERCEL_TEAM_ID);
}

// Example GitRepoConfig (should come from env variables or config)
// const DEFAULT_GIT_REPO_CONFIG = {
//   owner: process.env.GIT_REPO_OWNER || 'your-git-owner',
//   repo: process.env.GIT_REPO_NAME || 'your-repo-name',
//   type: 'github', // or 'gitlab', 'bitbucket'
//   productionBranch: 'main', // Or your production branch name
// };

// Placeholder for future functions:
// export async function getVercelProjectDomain(projectIdOrName: string, domainName: string, teamId?: string) { /* ... */ }
// export async function getVercelProjectByName(name: string, teamId?: string) { /* ... */ }
// export async function deleteVercelProject(idOrName: string, teamId?: string) { /* ... */ }
// export async function triggerVercelDeployment(projectId: string, branch: string = 'main', teamId?: string) { /* ... */ }
// export async function updateVercelProjectEnvVars(projectId: string, envVars: Array<{key: string, value: string, type: string, target: string[]}>, teamId?: string) { /* ... */ }
// export async function getVercelProjectEnvVars(projectId: string, teamId?: string) { /* ... */ }
// export async function updateVercelProject(projectId: string, updates: any, teamId?: string) { /* ... */ }
// export async function listVercelProjects(teamId?: string, queryParams?: Record<string, string>) { /* ... */ }
// export async function getVercelProjectDeployments(projectIdOrName: string, teamId?: string, queryParams?: Record<string,string>) { /* ... */ }
// export async function getVercelDeploymentAliases(deploymentId: string, teamId?: string ) { /* ... */ }
