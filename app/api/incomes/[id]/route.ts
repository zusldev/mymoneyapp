import { prisma } from "@/app/lib/prisma";
import { incomeDto, parseAmountInput } from "@/app/lib/serverMoney";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const income = await prisma.income.findUnique({ where: { id } });
        if (!income) return NextResponse.json({ error: "Ingreso no encontrado" }, { status: 404 });
        return NextResponse.json(incomeDto(income));
    } catch (error) {
        console.error("Error fetching income:", error);
        return NextResponse.json({ ok: false, error: "Error al cargar ingreso" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const income = await prisma.income.update({
            where: { id },
            data: {
                name: body.name,
                amountCents: body.amount !== undefined ? parseAmountInput(body.amount) : undefined,
                frequency: body.frequency,
                type: body.type,
                nextDate: body.nextDate ? new Date(body.nextDate) : undefined,
                source: body.source,
                active: body.active,
                color: body.color,
                icon: body.icon,
                accountId: body.accountId,
                creditCardId: body.creditCardId,
            },
        });
        return NextResponse.json(incomeDto(income));
    } catch (error) {
        console.error("Error updating income:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.income.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting income:", error);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
