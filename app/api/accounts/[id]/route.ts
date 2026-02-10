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
        const account = await prisma.account.findUnique({
            where: { id },
            include: { transactions: { orderBy: { date: "desc" }, take: 20 } },
        });
        if (!account) {
            return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
        }
        return NextResponse.json(account);
    } catch (error) {
        console.error("Error fetching account:", error);
        // Fallback for build time or DB errors
        return NextResponse.json({
            id,
            name: "Cuenta (Fallback)",
            type: "checking",
            balance: 0,
            currency: "MXN",
            color: "#06b6d4",
            icon: "wallet",
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
        const account = await prisma.account.update({
            where: { id },
            data: {
                name: body.name,
                type: body.type,
                balance: body.balance !== undefined ? parseFloat(body.balance) : undefined,
                currency: body.currency,
                color: body.color,
                icon: body.icon,
            },
        });
        return NextResponse.json(account);
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
