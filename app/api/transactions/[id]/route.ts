import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const transaction = await prisma.transaction.findUnique({ where: { id } });
        if (!transaction) return NextResponse.json({ error: "Transacción no encontrada" }, { status: 404 });
        return NextResponse.json(transaction);
    } catch (error) {
        console.error("Error fetching transaction:", error);
        return NextResponse.json({
            id,
            amount: 0,
            type: "expense",
            date: new Date().toISOString(),
            merchant: "Fallback Merchant",
            category: "otros"
        });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();

        // Get old transaction to adjust balance if amount changed
        // const oldTransaction = await prisma.transaction.findUnique({ where: { id } });

        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
                type: body.type,
                date: body.date ? new Date(body.date) : undefined,
                merchant: body.merchant,
                category: body.category,
                isSubscription: body.isSubscription,
                isFeeOrInterest: body.isFeeOrInterest,
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
    const { id } = await params;
    try {
        await prisma.transaction.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
