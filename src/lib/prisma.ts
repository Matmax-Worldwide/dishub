import { PrismaClient } from '@prisma/client';

// Create the global type
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Do not instantiate a new PrismaClient in development when hot-reloading happens
// See https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
let prismaClient: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // Production: Always create a new PrismaClient instance
  prismaClient = new PrismaClient({
    log: ['error'],
  });
} else {
  // Development: Use global to preserve connection between hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  } 
  prismaClient = global.prisma;
}

// Test the connection
prismaClient.$connect()
  .then(() => {
    console.log('Database connection established successfully');
  })
  .catch((err: Error) => {
    console.error('Failed to connect to database:', err);
  });

export const prisma = prismaClient; 