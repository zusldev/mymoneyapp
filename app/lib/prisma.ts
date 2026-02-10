import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
    if (globalForPrisma.prisma) {
        return globalForPrisma.prisma;
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL is not defined");
    }

    // Reuse pool across hot-reloads to avoid exhausting Supabase pooler
    if (!globalForPrisma.pool) {
        globalForPrisma.pool = new Pool({
            connectionString,
            max: 3, // Small pool — Supabase pooler has strict limits
            ssl: { rejectUnauthorized: false },
        });
    }

    const adapter = new PrismaPg(globalForPrisma.pool, {
        schema: "public",
    });
    const client = new PrismaClient({ adapter });

    if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = client;
    }

    return client;
}

export const prisma = createPrismaClient();
