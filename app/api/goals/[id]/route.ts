import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const goal = await prisma.financialGoal.update({
            where: { id },
            data: {
                name: body.name,
                targetAmount: body.targetAmount !== undefined ? parseFloat(body.targetAmount) : undefined,
                currentAmount: body.currentAmount !== undefined ? parseFloat(body.currentAmount) : undefined,
                deadline: body.deadline ? new Date(body.deadline) : undefined,
                priority: body.priority,
                color: body.color,
                icon: body.icon,
            },
        });
        return NextResponse.json(goal);
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
