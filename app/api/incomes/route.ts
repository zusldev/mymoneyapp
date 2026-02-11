import { prisma } from "@/app/lib/prisma";
import { incomeDto, parseAmountInput } from "@/app/lib/serverMoney";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const incomes = await prisma.income.findMany({
            orderBy: { nextDate: "asc" },
            include: {
                account: { select: { id: true, name: true, icon: true, color: true } },
                creditCard: { select: { id: true, name: true, bank: true, lastFour: true, color: true } },
            },
        });
        return NextResponse.json(incomes.map(incomeDto));
    } catch (error) {
        console.error("Error fetching incomes:", error);
        return NextResponse.json({ ok: false, error: "Error al cargar ingresos" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const income = await prisma.income.create({
            data: {
                name: body.name,
                amountCents: parseAmountInput(body.amount),
                frequency: body.frequency || "monthly",
                type: body.type || "fixed",
                nextDate: new Date(body.nextDate),
                source: body.source || "",
                active: body.active !== undefined ? body.active : true,
                color: body.color || "#2badee",
                icon: body.icon || "payments",
                accountId: body.accountId || null,
                creditCardId: body.creditCardId || null,
            },
        });
        return NextResponse.json(incomeDto(income), { status: 201 });
    } catch (error) {
        console.error("Error creating income:", error);
        return NextResponse.json({ error: "Error al crear ingreso" }, { status: 500 });
    }
}
