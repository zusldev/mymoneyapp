import { prisma } from "@/app/lib/prisma";
import { accountDto, parseAmountInput, txDto } from "@/app/lib/serverMoney";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const account = await prisma.account.findUnique({
            where: { id },
            include: { transactions: { orderBy: { date: "desc" }, take: 20 } },
        });
        if (!account) {
            return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
        }
        return NextResponse.json({
            ...accountDto(account),
            transactions: account.transactions.map(txDto),
        });
    } catch (error) {
        console.error("Error fetching account:", error);
        return NextResponse.json({ ok: false, error: "Error al cargar cuenta" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const account = await prisma.account.update({
            where: { id },
            data: {
                name: body.name,
                type: body.type,
                balanceCents: body.balance !== undefined ? parseAmountInput(body.balance) : undefined,
                currency: body.currency,
                color: body.color,
                icon: body.icon,
            },
        });
        return NextResponse.json(accountDto(account));
    } catch (error) {
        console.error("Error updating account:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.account.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting account:", error);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
