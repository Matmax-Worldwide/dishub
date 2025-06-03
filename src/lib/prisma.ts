// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Optional: Define a type for your extended client if you add many extensions
// type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

class PrismaManager {
  private static instance: PrismaManager;
  private clients: Map<string, PrismaClient> = new Map(); // Store clients, e.g., by tenantId

  public static getInstance(): PrismaManager {
    if (!PrismaManager.instance) {
      PrismaManager.instance = new PrismaManager();
    }
    return PrismaManager.instance;
  }

  public getClient(tenantId?: string): PrismaClient { // Return type PrismaClient or ExtendedPrismaClient
    const key = tenantId || 'default';

    if (!this.clients.has(key)) {
      console.log(`Initializing Prisma client for key: ${key}`);
      const client = new PrismaClient({
        datasources: {
          db: {
            url: this.getDatabaseUrl(tenantId),
          },
        },
        log: [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
      });

      // Example of applying extensions
      const extendedClient = client
        .$extends(withAccelerate()) // Enable Prisma Accelerate
        .$extends({ // Custom extension for slow query logging
          query: {
            $allModels: {
              async $allOperations({ model, operation, args, query }) {
                const start = performance.now();
                const result = await query(args);
                const end = performance.now();
                const duration = end - start;
                if (duration > 100) { // Configurable threshold (100ms)
                  console.warn(
                    `Slow query (${model}.${operation}): ${duration.toFixed(2)}ms`,
                    // JSON.stringify(args) // Be careful logging args in production due to PII
                  );
                }
                return result;
              },
            },
          },
        });

      // client.$on('query', (e) => { // Alternative for logging queries
      //   if (e.duration > 100) {
      //     console.warn(`Slow query (${e.duration}ms): ${e.query}`, e.params);
      //   }
      // });

      this.clients.set(key, extendedClient as PrismaClient); // Cast if necessary
    }
    return this.clients.get(key)!;
  }

  private getDatabaseUrl(tenantId?: string): string {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    if (!tenantId || tenantId === 'default') {
      return baseUrl;
    }
    // For Phase 1 (schema-based separation):
    // Append ?schema=<tenantId> for PostgreSQL. Adjust if using a different separator for other databases.
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}schema=${tenantId}`;
  }

  public async disconnectAll(): Promise<void> {
    console.log('Disconnecting all Prisma clients...');
    await Promise.all(
      Array.from(this.clients.values()).map(client => client.$disconnect())
    );
    this.clients.clear();
    console.log('All Prisma clients disconnected.');
  }
}

export const prismaManager = PrismaManager.getInstance();
// Default client for single-tenant phase or platform-level operations
export const prisma = prismaManager.getClient();

// Graceful shutdown
if (process.env.NODE_ENV !== 'test') { // Avoid issues with test environments that might not handle this well
  process.on('beforeExit', async () => {
    console.log('beforeExit hook: Disconnecting Prisma clients.');
    await prismaManager.disconnectAll();
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received: Disconnecting Prisma clients.');
    await prismaManager.disconnectAll();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received: Disconnecting Prisma clients.');
    await prismaManager.disconnectAll();
    process.exit(0);
  });
}