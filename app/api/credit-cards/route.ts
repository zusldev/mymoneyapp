import { prisma } from "@/app/lib/prisma";
import { cardDto, parseAmountInput } from "@/app/lib/serverMoney";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const cards = await prisma.creditCard.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { transactions: true } },
            },
        });
        return NextResponse.json(cards.map(cardDto));
    } catch (error) {
        console.error("Error fetching credit cards:", error);
        return NextResponse.json({ ok: false, error: "Error al cargar tarjetas" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const card = await prisma.creditCard.create({
            data: {
                name: body.name,
                bank: body.bank || "",
                lastFour: body.lastFour || "",
                creditLimitCents: parseAmountInput(body.creditLimit),
                balanceCents: parseAmountInput(body.balance ?? 0),
                cutDate: parseInt(body.cutDate) || 1,
                payDate: parseInt(body.payDate) || 20,
                apr: parseFloat(body.apr) || 0,
                color: body.color || "#8b5cf6",
            },
        });
        return NextResponse.json(cardDto(card), { status: 201 });
    } catch (error) {
        console.error("Error creating credit card:", error);
        return NextResponse.json({ error: "Error al crear tarjeta" }, { status: 500 });
    }
}
