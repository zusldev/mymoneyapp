import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        // 1. Delete all transactions
        await prisma.transaction.deleteMany({});

        // 2. Reset Account balances
        await prisma.account.updateMany({
            data: { balanceCents: 0 }
        });

        // 3. Reset Credit Card balances
        await prisma.creditCard.updateMany({
            data: { balanceCents: 0 }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reset error:", error);
        return NextResponse.json({ error: "Error resetting data" }, { status: 500 });
    }
}
