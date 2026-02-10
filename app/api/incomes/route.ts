import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const incomes = await prisma.income.findMany({
            orderBy: { nextDate: "asc" },
        });
        return NextResponse.json(incomes);
    } catch (error) {
        console.error("Error fetching incomes:", error);
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const income = await prisma.income.create({
            data: {
                name: body.name,
                amount: parseFloat(body.amount),
                frequency: body.frequency || "monthly",
                nextDate: new Date(body.nextDate),
                source: body.source || "",
                active: body.active !== undefined ? body.active : true,
            },
        });
        return NextResponse.json(income, { status: 201 });
    } catch (error) {
        console.error("Error creating income:", error);
        return NextResponse.json({ error: "Error al crear ingreso" }, { status: 500 });
    }
}
