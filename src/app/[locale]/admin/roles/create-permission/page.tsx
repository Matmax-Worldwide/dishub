"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { ConditionBuilder } from "@/components/ui/condition-builder";

// GraphQL queries and mutations
const ROLES_QUERY = `
  query GetRoles($tenantId: ID!) {
    roles(tenantId: $tenantId) {
      id
      name
      description
    }
  }
`;

const CREATE_PERMISSION_MUTATION = `
  mutation CreatePermission($input: PermissionInput!) {
    createPermission(input: $input) {
      id
      action
      subject
      conditions
    }
  }
`;

// Helper function for GraphQL requests
async function fetchGraphQL(query: string, variables = {}) {
  try {
    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    
    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    return result.data;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

// Form schema
const permissionFormSchema = z.object({
  action: z.string().min(1, "Action is required"),
  subject: z.string().min(1, "Subject is required"),
  conditions: z.string().optional(),
  roleId: z.string().optional(),
});

// Types for data
interface Role {
  id: string;
  name: string;
  description: string | null;
}

export default function CreatePermissionPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  
  const form = useForm<z.infer<typeof permissionFormSchema>>({
    resolver: zodResolver(permissionFormSchema),
    defaultValues: {
      action: "",
      subject: "",
      conditions: "{}",
      roleId: "",
    },
  });

  // Load roles data
  useEffect(() => {
    async function loadRoles() {
      setIsLoading(true);
      try {
        const rolesData = await fetchGraphQL(ROLES_QUERY, { tenantId: "system" });
        if (rolesData.roles) {
          setRoles(rolesData.roles);
        }
      } catch (error) {
        console.error('Failed to load roles:', error);
        toast.error('Failed to load roles. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadRoles();
  }, []);

  // Function to handle form submission
  async function onSubmit(values: z.infer<typeof permissionFormSchema>) {
    setIsLoading(true);
    
    try {
      // Parse conditions JSON if provided
      let conditions;
      if (values.conditions && values.conditions.trim() !== '{}') {
        try {
          conditions = JSON.parse(values.conditions);
        } catch (error) {
          toast.error(`Invalid JSON in conditions: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsLoading(false);
          return;
        }
      }
      
      const input = {
        action: values.action,
        subject: values.subject,
        conditions,
        roleId: values.roleId || undefined,
      };
      
      const result = await fetchGraphQL(CREATE_PERMISSION_MUTATION, {
        input,
      });
      
      if (result.createPermission) {
        toast.success("Permission created successfully");
        // Navigate back to roles page
        router.push('/admin/roles');
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create permission");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => router.push('/admin/roles')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.roles.addPermission") || "Create Permission"}</h1>
          <p className="text-muted-foreground">
            {t("admin.roles.addPermissionDescription") || "Create a new system permission that can be assigned to roles."}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.roles.permissionDetails") || "Permission Details"}</CardTitle>
          <CardDescription>
            {t("admin.roles.permissionDetailsDescription") || "Define the permission's action, subject, and conditions."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.roles.actionLabel") || "Action"}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. create, read, update, delete, manage" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("admin.roles.actionDescription") || "The action this permission allows (e.g. create, read, update, delete, manage)"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.roles.subjectLabel") || "Subject"}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. users, pages, settings" {...field} />
                      </FormControl>
                      <FormDescription>
                        {t("admin.roles.subjectDescription") || "The resource this permission applies to (e.g. users, pages, settings)"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="conditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.roles.conditionBuilder") || "Conditions"}</FormLabel>
                    <FormControl>
                      <ConditionBuilder
                        value={field.value || "{}"}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("admin.roles.conditionBuilderDescription") || "Build conditions for when this permission applies"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.roles.assignToRoleLabel") || "Assign to Role (Optional)"}</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">{t("admin.roles.noRoleOption") || "None (Create permission only)"}</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      {t("admin.roles.assignToRoleDescription") || "Optionally assign this permission to a role when creating"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4">
                <div 
                  className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                  onClick={() => router.push('/admin/roles')}
                >
                  {t("common.cancel")}
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">&#9696;</span>
                      {t("common.creating") || "Creating..."}
                    </>
                  ) : (
                    t("admin.roles.createPermission") || "Create Permission"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 