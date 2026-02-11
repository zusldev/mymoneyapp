import { prisma } from "@/app/lib/prisma";
import { goalDto, majorFromCents, parseAmountInput } from "@/app/lib/serverMoney";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const goals = await prisma.financialGoal.findMany({
            orderBy: { deadline: "asc" },
        });
        return NextResponse.json(goals.map(goalDto));
    } catch (error) {
        console.error("Error fetching goals:", error);
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const targetAmountCents = parseAmountInput(body.targetAmount);
        const currentAmountCents = parseAmountInput(body.currentAmount ?? 0);
        const data = {
            name: body.name,
            target_amount: majorFromCents(targetAmountCents),
            current_amount: majorFromCents(currentAmountCents),
            targetAmountCents,
            currentAmountCents,
            deadline: new Date(body.deadline),
            priority: body.priority || "medium",
            color: body.color || "#10b981",
            icon: body.icon || "target",
        };
        const goal = await prisma.financialGoal.create({
            data,
        });
        return NextResponse.json(goalDto(goal), { status: 201 });
    } catch (error) {
        console.error("Error creating goal:", error);
        return NextResponse.json({ error: "Error al crear meta" }, { status: 500 });
    }
}
