import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const subscriptions = await prisma.subscription.findMany({
            orderBy: { nextDate: "asc" },
        });
        return NextResponse.json(subscriptions);
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const sub = await prisma.subscription.create({
            data: {
                name: body.name,
                amount: parseFloat(body.amount),
                frequency: body.frequency || "monthly",
                category: body.category || "suscripciones",
                nextDate: new Date(body.nextDate),
                active: body.active !== undefined ? body.active : true,
                color: body.color || "#f59e0b",
            },
        });
        return NextResponse.json(sub, { status: 201 });
    } catch (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json({ error: "Error al crear suscripción" }, { status: 500 });
    }
}
