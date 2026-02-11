import { prisma } from "@/app/lib/prisma";
import { parseAmountInput, subDto } from "@/app/lib/serverMoney";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const subscriptions = await prisma.subscription.findMany({
            orderBy: { nextDate: "asc" },
            include: {
                account: { select: { id: true, name: true, icon: true, color: true } },
                creditCard: { select: { id: true, name: true, bank: true, lastFour: true, color: true } },
            },
        });
        return NextResponse.json(subscriptions.map(subDto));
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return NextResponse.json({ ok: false, error: "Error al cargar suscripciones" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const sub = await prisma.subscription.create({
            data: {
                name: body.name,
                amountCents: parseAmountInput(body.amount),
                frequency: body.frequency || "monthly",
                category: body.category || "suscripciones",
                type: body.type || "entertainment",
                nextDate: new Date(body.nextDate),
                active: body.active !== undefined ? body.active : true,
                color: body.color || "#f59e0b",
                icon: body.icon || "sync",
                accountId: body.accountId || null,
                creditCardId: body.creditCardId || null,
            },
        });
        return NextResponse.json(subDto(sub), { status: 201 });
    } catch (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json({ error: "Error al crear suscripción" }, { status: 500 });
    }
}
