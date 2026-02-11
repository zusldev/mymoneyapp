import { prisma } from "@/app/lib/prisma";
import { cardDto, majorFromCents, parseAmountInput, txDto } from "@/app/lib/serverMoney";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const card = await prisma.creditCard.findUnique({
            where: { id },
            include: { transactions: { orderBy: { date: "desc" }, take: 20 } },
        });
        if (!card) {
            return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
        }
        return NextResponse.json({
            ...cardDto(card),
            transactions: card.transactions.map(txDto),
        });
    } catch (error) {
        console.error("Error fetching credit card:", error);
        return NextResponse.json({ ok: false, error: "Error al cargar tarjeta" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();
        const creditLimitCents = body.creditLimit !== undefined ? parseAmountInput(body.creditLimit) : undefined;
        const balanceCents = body.balance !== undefined ? parseAmountInput(body.balance) : undefined;
        const data = {
            name: body.name,
            bank: body.bank,
            lastFour: body.lastFour,
            credit_limit: creditLimitCents !== undefined ? majorFromCents(creditLimitCents) : undefined,
            balance: balanceCents !== undefined ? majorFromCents(balanceCents) : undefined,
            creditLimitCents,
            balanceCents,
            cutDate: body.cutDate !== undefined ? parseInt(body.cutDate) : undefined,
            payDate: body.payDate !== undefined ? parseInt(body.payDate) : undefined,
            apr: body.apr !== undefined ? parseFloat(body.apr) : undefined,
            color: body.color,
        };
        const card = await prisma.creditCard.update({
            where: { id },
            data,
        });
        return NextResponse.json(cardDto(card));
    } catch (error) {
        console.error("Error updating credit card:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.creditCard.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting credit card:", error);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
