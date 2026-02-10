import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const accounts = await prisma.account.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { transactions: true } },
            },
        });
        return NextResponse.json(accounts);
    } catch (error) {
        console.error("Error fetching accounts:", error);
        return NextResponse.json({ error: "Error al obtener cuentas" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const account = await prisma.account.create({
            data: {
                name: body.name,
                type: body.type || "checking",
                balance: parseFloat(body.balance) || 0,
                currency: body.currency || "MXN",
                color: body.color || "#06b6d4",
                icon: body.icon || "wallet",
            },
        });
        return NextResponse.json(account, { status: 201 });
    } catch (error) {
        console.error("Error creating account:", error);
        return NextResponse.json({ error: "Error al crear cuenta" }, { status: 500 });
    }
}
