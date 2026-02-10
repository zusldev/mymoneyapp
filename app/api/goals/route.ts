import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const goals = await prisma.financialGoal.findMany({
            orderBy: { deadline: "asc" },
        });
        return NextResponse.json(goals);
    } catch (error) {
        console.error("Error fetching goals:", error);
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const goal = await prisma.financialGoal.create({
            data: {
                name: body.name,
                targetAmount: parseFloat(body.targetAmount),
                currentAmount: parseFloat(body.currentAmount) || 0,
                deadline: new Date(body.deadline),
                priority: body.priority || "medium",
                color: body.color || "#10b981",
                icon: body.icon || "target",
            },
        });
        return NextResponse.json(goal, { status: 201 });
    } catch (error) {
        console.error("Error creating goal:", error);
        return NextResponse.json({ error: "Error al crear meta" }, { status: 500 });
    }
}
