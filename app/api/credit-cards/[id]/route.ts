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
        const card = await prisma.creditCard.update({
            where: { id },
            data: {
                name: body.name,
                bank: body.bank,
                lastFour: body.lastFour,
                creditLimit: body.creditLimit !== undefined ? parseFloat(body.creditLimit) : undefined,
                balance: body.balance !== undefined ? parseFloat(body.balance) : undefined,
                cutDate: body.cutDate !== undefined ? parseInt(body.cutDate) : undefined,
                payDate: body.payDate !== undefined ? parseInt(body.payDate) : undefined,
                apr: body.apr !== undefined ? parseFloat(body.apr) : undefined,
                color: body.color,
            },
        });
        return NextResponse.json(card);
    } catch (error) {
        console.error("Error updating credit card:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.creditCard.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting credit card:", error);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
