// import 'server-only';
import { PrismaClient } from '@prisma/client';


const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

// Force rebuild: 1
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
