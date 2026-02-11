import { prisma } from "@/app/lib/prisma";
import { parseAmountInput, txDto } from "@/app/lib/serverMoney";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        // Params parsing logic...
        // Simplified for brevity in thought but providing full code
        const accountId = searchParams.get("accountId");
        const creditCardId = searchParams.get("creditCardId");
        const category = searchParams.get("category");
        const type = searchParams.get("type");
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const limit = parseInt(searchParams.get("limit") || "50");

        const where: Record<string, unknown> = {};
        if (accountId) where.accountId = accountId;
        if (creditCardId) where.creditCardId = creditCardId;
        if (category) where.category = category;
        if (type) where.type = type;
        if (from || to) {
            where.date = {};
            if (from) (where.date as Record<string, unknown>).gte = new Date(from);
            if (to) (where.date as Record<string, unknown>).lte = new Date(to);
        }

        const transactions = await prisma.transaction.findMany({
            where,
            orderBy: { date: "desc" },
            take: limit,
            include: {
                account: { select: { name: true, color: true } },
                creditCard: { select: { name: true, color: true } },
            },
        });

        return NextResponse.json(transactions.map(txDto));
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json({ ok: false, error: "Error al cargar transacciones" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const amountCents = parseAmountInput(body.amount ?? 0);

        const transaction = await prisma.transaction.create({
            data: {
                amountCents,
                type: body.type || "expense",
                date: body.date ? new Date(body.date) : new Date(),
                merchant: body.merchant || "",
                merchantNormalized: body.merchantNormalized || body.merchant || "",
                description: body.description || "",
                category: body.category || "otros",
                isSubscription: body.isSubscription || false,
                isFeeOrInterest: body.isFeeOrInterest || false,
                confidenceScore: body.confidenceScore || 100,
                accountId: body.accountId || null,
                creditCardId: body.creditCardId || null,
                subscriptionId: body.subscriptionId || null,
            },
        });

        // Update account/card balance logic...
        if (body.accountId) {
            const delta = body.type === "income" ? Math.abs(amountCents) : -Math.abs(amountCents);
            await prisma.account.update({
                where: { id: body.accountId },
                data: { balanceCents: { increment: delta } },
            }).catch(e => console.error("Error updating account balance", e));
        }
        if (body.creditCardId && body.type === "expense") {
            await prisma.creditCard.update({
                where: { id: body.creditCardId },
                data: { balanceCents: { increment: Math.abs(amountCents) } },
            }).catch(e => console.error("Error updating card balance", e));
        }

        return NextResponse.json(txDto(transaction), { status: 201 });
    } catch (error) {
        console.error("Error creating transaction:", error);
        return NextResponse.json({ error: "Error al crear transacción" }, { status: 500 });
    }
}
