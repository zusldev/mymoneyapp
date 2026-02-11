import { prisma } from "@/app/lib/prisma";
import { parseAmountInput, subDto } from "@/app/lib/serverMoney";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const sub = await prisma.subscription.findUnique({ where: { id } });
        if (!sub) return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
        return NextResponse.json(subDto(sub));
    } catch (error) {
        console.error("Error fetching subscription:", error);
        return NextResponse.json({ ok: false, error: "Error al cargar suscripción" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const sub = await prisma.subscription.update({
            where: { id },
            data: {
                name: body.name,
                amountCents: body.amount !== undefined ? parseAmountInput(body.amount) : undefined,
                frequency: body.frequency,
                category: body.category,
                type: body.type,
                nextDate: body.nextDate ? new Date(body.nextDate) : undefined,
                active: body.active,
                color: body.color,
                icon: body.icon,
                accountId: body.accountId,
                creditCardId: body.creditCardId,
            },
        });
        return NextResponse.json(subDto(sub));
    } catch (error) {
        console.error("Error updating subscription:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.subscription.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting subscription:", error);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
