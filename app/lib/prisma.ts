import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Safe initialization to prevent build crashes if env is missing
let prismaInstance: PrismaClient;

try {
    if (globalForPrisma.prisma) {
        prismaInstance = globalForPrisma.prisma;
    } else {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) throw new Error("DATABASE_URL is not defined");
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        prismaInstance = new PrismaClient({ adapter });
    }
} catch (error) {
    console.error("Failed to initialize Prisma Client:", error);
    prismaInstance = new Proxy({} as PrismaClient, {
        get(_target, prop) {
            return () => { throw new Error(`Prisma Client failed to initialize: ${String(prop)}`); };
        }
    });
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
