import { PrismaClient } from '@prisma/client';
// Assuming 'next-axiom' or a similar logger is set up.
// If not, replace log.warn, log.error with console.warn, console.error or appropriate logger.
// For the purpose of this subtask, we'll assume a generic logger interface might be available via `console`.
// import { log } from 'next-axiom';
import { n1DetectorPlugin } from './prisma-plugins/n1-detector'; // Added import

// Define the PrismaManager class
class PrismaManager {
  private static instance: PrismaManager;
  private clients: Map<string, PrismaClient> = new Map();
  private readonly baseDatabaseUrl: string;

  private constructor() {
    this.baseDatabaseUrl = process.env.DATABASE_URL!;
    if (!this.baseDatabaseUrl) {
      // In a real app, consider a more robust way to handle missing env vars at startup.
      console.error('DATABASE_URL environment variable is not set.');
      throw new Error('DATABASE_URL environment variable is not set.');
    }
  }

  public static getInstance(): PrismaManager {
    if (!PrismaManager.instance) {
      PrismaManager.instance = new PrismaManager();
    }
    return PrismaManager.instance;
  }

  public getClient(tenantId?: string): PrismaClient {
    const key = tenantId || 'default';
    if (!this.clients.has(key)) {
      const databaseUrl = this.getDatabaseUrl(tenantId);
      console.log(`Initializing Prisma client for key: ${key} with DB URL (or schema) targeting: ${databaseUrl.includes('?schema=') ? databaseUrl.substring(databaseUrl.indexOf('?schema=')) : 'default DB'}`);

      const newClient = new PrismaClient({
        log: [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
        datasources: {
          db: {
            url: databaseUrl,
          },
        },
      });

      // Log slow queries
      newClient.$on('query', (e) => {
        if (e.duration > 100) { // Configurable threshold
          console.warn(`Slow query (client: ${key}, duration: ${e.duration}ms): ${e.query.substring(0,200)}...`, { params: e.params });
          // log.warn('Slow query', { clientKey: key, duration: e.duration, query: e.query, params: e.params });
        }
      });
      newClient.$on('error', (e) => {
        console.error(`Prisma error (client: ${key})`, { target: e.target, message: e.message, timestamp: e.timestamp });
        // log.error('Prisma error', { clientKey: key, target: e.target, message: e.message, timestamp: e.timestamp });
      });
      newClient.$on('warn', (e) => {
        console.warn(`Prisma warning (client: ${key})`, { target: e.target, message: e.message, timestamp: e.timestamp });
        // log.warn('Prisma warning', { clientKey: key, target: e.target, message: e.message, timestamp: e.timestamp });
      });

      // Placeholder for Accelerate extension
      // const clientWithAccelerate = newClient.$extends(withAccelerate());

      // Placeholder for Retry extension
      // const clientWithRetry = clientWithAccelerate.$extends(withRetry());
      // this.clients.set(key, clientWithRetry);

      // ***** INTEGRATE N+1 DETECTOR PLUGIN *****
      if (process.env.NODE_ENV === 'development') {
        console.log(`Applying N+1 detector plugin for Prisma client: ${key}`);
        newClient.$use(n1DetectorPlugin());
      }
      // *****************************************

      this.clients.set(key, newClient); // Replace with clientWithRetry if extensions are used

      newClient.$connect()
        .then(() => {
          console.log(`Database connection established successfully for Prisma client: ${key}`);
        })
        .catch((err: Error) => {
          console.error(`Failed to connect to database for Prisma client: ${key}:`, err);
        });
    }
    return this.clients.get(key)!;
  }

  public getDatabaseUrl(tenantId?: string): string {
    if (!tenantId || tenantId === 'default') {
      return this.baseDatabaseUrl;
    }
    // For Phase 1, we use schema-based separation
    // Ensure DATABASE_URL does not already contain query parameters if appending directly
    const separator = this.baseDatabaseUrl.includes('?') ? '&' : '?';
    return `${this.baseDatabaseUrl}${separator}schema=${tenantId}`;
  }

  public async disconnect(): Promise<void> {
    console.log('Disconnecting all Prisma clients...');
    const disconnectPromises = Array.from(this.clients.values()).map(client => client.$disconnect());
    await Promise.all(disconnectPromises);
    this.clients.clear();
    console.log('All Prisma clients disconnected successfully.');
  }
}

// Export the singleton instance of PrismaManager
export const prismaManager = PrismaManager.getInstance();

// Export a default Prisma client instance for convenience
export const prisma = prismaManager.getClient();

// Graceful shutdown for the application
process.on('beforeExit', async () => {
  console.log('beforeExit hook: Disconnecting PrismaManager.');
  await prismaManager.disconnect();
});

// Optional: Keep global prisma for development hot-reloading convenience for the default client.
// PrismaManager itself is a singleton and handles its client instances.
// This can help minimize immediate refactoring of existing `import { prisma } from '...'`
// if they expect the global pattern.
// Note: If 'src/lib/prisma.ts' is deleted, this global declaration here is the primary one.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV !== 'production') {
  if (!global.prisma) {
    // In development, the default prisma client exported can be assigned to global.prisma.
    // PrismaManager ensures that getClient() will return the same instance for the 'default' key.
    global.prisma = prisma;
    console.log("Development mode: Global Prisma client set for hot reloading in prisma_manager.ts") // This log might be slightly misleading now
  }
}
