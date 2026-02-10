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
        const sub = await prisma.subscription.update({
            where: { id },
            data: {
                name: body.name,
                amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
                frequency: body.frequency,
                category: body.category,
                nextDate: body.nextDate ? new Date(body.nextDate) : undefined,
                active: body.active,
                color: body.color,
            },
        });
        return NextResponse.json(sub);
    } catch (error) {
        console.error("Error updating subscription:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.subscription.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting subscription:", error);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
