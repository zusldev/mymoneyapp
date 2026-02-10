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
        const income = await prisma.income.update({
            where: { id },
            data: {
                name: body.name,
                amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
                frequency: body.frequency,
                nextDate: body.nextDate ? new Date(body.nextDate) : undefined,
                source: body.source,
                active: body.active,
            },
        });
        return NextResponse.json(income);
    } catch (error) {
        console.error("Error updating income:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.income.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting income:", error);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
