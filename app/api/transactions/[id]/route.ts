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
        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
                type: body.type,
                date: body.date ? new Date(body.date) : undefined,
                merchant: body.merchant,
                merchantNormalized: body.merchantNormalized,
                description: body.description,
                category: body.category,
                isSubscription: body.isSubscription,
                isFeeOrInterest: body.isFeeOrInterest,
                accountId: body.accountId,
                creditCardId: body.creditCardId,
            },
        });
        return NextResponse.json(transaction);
    } catch (error) {
        console.error("Error updating transaction:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const transaction = await prisma.transaction.findUnique({ where: { id } });
        if (!transaction) {
            return NextResponse.json({ error: "No encontrada" }, { status: 404 });
        }

        // Reverse balance impact
        if (transaction.accountId) {
            const delta = transaction.type === "income" ? -Math.abs(transaction.amount) : Math.abs(transaction.amount);
            await prisma.account.update({
                where: { id: transaction.accountId },
                data: { balance: { increment: delta } },
            });
        }
        if (transaction.creditCardId && transaction.type === "expense") {
            await prisma.creditCard.update({
                where: { id: transaction.creditCardId },
                data: { balance: { decrement: Math.abs(transaction.amount) } },
            });
        }

        await prisma.transaction.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
