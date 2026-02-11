import { prisma } from "@/app/lib/prisma";
import { accountDto, incomeDto, parseAmountInput, subDto, txDto } from "@/app/lib/serverMoney";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const accounts = await prisma.account.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { transactions: true } },
                subscriptions: { where: { active: true }, select: { id: true, name: true, amountCents: true, frequency: true, icon: true } },
                incomes: { select: { id: true, name: true, amountCents: true, frequency: true, icon: true } },
                transactions: { orderBy: { date: "desc" }, take: 3, select: { id: true, merchant: true, amountCents: true, type: true, date: true, category: true } },
            },
        });
        return NextResponse.json(
            accounts.map((account) => ({
                ...accountDto(account),
                subscriptions: account.subscriptions.map(subDto),
                incomes: account.incomes.map(incomeDto),
                transactions: account.transactions.map(txDto),
            })),
        );
    } catch (error) {
        console.error("Error fetching accounts:", error);
        return NextResponse.json({ ok: false, error: "Error al cargar cuentas" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const account = await prisma.account.create({
            data: {
                name: body.name,
                type: body.type || "checking",
                balanceCents: parseAmountInput(body.balance ?? 0),
                currency: body.currency || "MXN",
                color: body.color || "#06b6d4",
                icon: body.icon || "wallet",
            },
        });
        return NextResponse.json(accountDto(account), { status: 201 });
    } catch (error) {
        console.error("Error creating account:", error);
        return NextResponse.json({ error: "Error al crear cuenta" }, { status: 500 });
    }
}
