import { prisma } from "@/app/lib/prisma";
import { goalDto, majorFromCents, parseAmountInput } from "@/app/lib/serverMoney";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const targetAmountCents = body.targetAmount !== undefined ? parseAmountInput(body.targetAmount) : undefined;
        const currentAmountCents = body.currentAmount !== undefined ? parseAmountInput(body.currentAmount) : undefined;
        const data = {
            name: body.name,
            target_amount: targetAmountCents !== undefined ? majorFromCents(targetAmountCents) : undefined,
            current_amount: currentAmountCents !== undefined ? majorFromCents(currentAmountCents) : undefined,
            targetAmountCents,
            currentAmountCents,
            deadline: body.deadline ? new Date(body.deadline) : undefined,
            priority: body.priority,
            color: body.color,
            icon: body.icon,
        };
        const goal = await prisma.financialGoal.update({
            where: { id },
            data,
        });
        return NextResponse.json(goalDto(goal));
    } catch (error) {
        console.error("Error updating goal:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.financialGoal.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting goal:", error);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
