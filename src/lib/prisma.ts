import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { n1DetectorPlugin } from './prisma-plugins/n1-detector';

// Define the PrismaManager class
class PrismaManager {
  private static instance: PrismaManager;
  private clients: Map<string, PrismaClient> = new Map();
  private readonly baseDatabaseUrl: string;

  private constructor() {
    this.baseDatabaseUrl = process.env.DATABASE_URL!;
    if (!this.baseDatabaseUrl) {
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

      let extendedClient: any = newClient; // Start with the base client, use 'any' for progressive extension typing

      // Apply Accelerate - Conditionally based on environment variable
      if (process.env.PRISMA_ACCELERATE_URL || process.env.ACCELERATE_ENABLED === 'true') {
        console.log(`PrismaManager: Applying withAccelerate() for client key '${key}'.`);
        extendedClient = extendedClient.$extends(withAccelerate());
      } else {
        console.log(`PrismaManager: Skipping withAccelerate() for client key '${key}' (ACCELERATE_ENABLED not 'true' or PRISMA_ACCELERATE_URL not set).`);
      }

      // Attach event listeners to the final extendedClient
      extendedClient.$on('query', (e: any) => { // Use 'any' for event type if extensions change it
        if (e.duration > 100) {
          console.warn(`Slow query (client: ${key}, duration: ${e.duration}ms): ${e.query.substring(0,200)}...`, { params: e.params });
        }
      });
      extendedClient.$on('error', (e: any) => {
        console.error(`Prisma error (client: ${key})`, { target: e.target, message: e.message, timestamp: e.timestamp });
      });
      extendedClient.$on('warn', (e: any) => {
        console.warn(`Prisma warning (client: ${key})`, { target: e.target, message: e.message, timestamp: e.timestamp });
      });

      // Apply N+1 Detector to the final extendedClient
      if (process.env.NODE_ENV === 'development') {
        console.log(`Applying N+1 detector plugin for Prisma client: ${key}`);
        extendedClient.$use(n1DetectorPlugin());
      }

      this.clients.set(key, extendedClient as PrismaClient); // Cast back to PrismaClient for storage

      console.log(`Prisma client for key '${key}' configured. Attempting connection...`);
      (extendedClient as PrismaClient).$connect()
        .then(() => {
          console.log(`Database connection established successfully for Prisma client: ${key}`);
        })
        .catch((err: Error) => {
          console.error(`Failed to connect to database for Prisma client: ${key}:`, err.message);
        });
    }
    return this.clients.get(key)!;
  }

  public getDatabaseUrl(tenantId?: string): string {
    if (!tenantId || tenantId === 'default') {
      return this.baseDatabaseUrl;
    }
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

export const prismaManager = PrismaManager.getInstance();
export const prisma = prismaManager.getClient();

process.on('beforeExit', async () => {
  console.log('beforeExit hook: Disconnecting PrismaManager.');
  await prismaManager.disconnect();
});

declare global {
  var prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV !== 'production') {
  if (!global.prisma) {
    global.prisma = prisma;
    console.log("Development mode: Global Prisma client set for hot reloading.")
  }
}
