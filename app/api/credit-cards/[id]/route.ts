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
        const card = await prisma.creditCard.findUnique({
            where: { id },
            include: { transactions: { orderBy: { date: "desc" }, take: 20 } },
        });
        if (!card) {
            return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 });
        }
        return NextResponse.json(card);
    } catch (error) {
        console.error("Error fetching credit card:", error);
        return NextResponse.json({
            id,
            name: "Tarjeta (Fallback)",
            bank: "Banco",
            lastFour: "0000",
            creditLimit: 0,
            balance: 0,
            cutDate: 1,
            payDate: 20,
            apr: 0,
            color: "#8b5cf6",
            transactions: []
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
    const { id } = await params;
    try {
        await prisma.creditCard.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting credit card:", error);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
