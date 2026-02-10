import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Safe initialization to prevent build crashes if env is missing
let prismaInstance: PrismaClient;

try {
    console.log("Prisma Client Init - NODE_ENV:", process.env.NODE_ENV);
    console.log("Prisma Client Init - DATABASE_URL:", process.env.DATABASE_URL ? "Defined" : "Undefined");
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
} catch (error) {
    console.error("Failed to initialize Prisma Client:", error);
    // Return a proxy or empty object casting as PrismaClient to allow module load
    // Methods will throw at runtime, which is caught by route handlers
    prismaInstance = new Proxy({} as PrismaClient, {
        get(_target, prop) {
            return () => { throw new Error(`Prisma Client failed to initialize: ${String(prop)}`); };
        }
    });
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
