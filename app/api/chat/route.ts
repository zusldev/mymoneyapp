import { prisma } from "@/app/lib/prisma";
import { percentages, toMajorUnits } from "@/app/lib/money";

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `Eres un ANALISTA FINANCIERO PERSONAL IA de nivel experto (tipo CFO personal).
Tu nombre es "MyMoney AI". Respondes en español.

REGLAS:
1. Todos los cálculos deben ser exactos y basados en los datos reales del usuario.
2. Si falta un dato, indícalo explícitamente.
3. No inventes cifras.
4. Prioriza estabilidad financiera y reducción de riesgo.
5. Explica SIEMPRE el razonamiento detrás de cada recomendación.
6. Sé conciso pero completo. Usa emojis para hacer la conversación amigable.
7. Responde preguntas como: "¿Puedo gastar X?", "¿Qué pasa si no pago esta tarjeta?", "Hazme un plan de pago".

Cuando el usuario haga preguntas financieras, analiza su contexto financiero proporcionado y da recomendaciones accionables.`;

export async function POST(request: NextRequest) {
    try {
        const { message } = await request.json();

        // Save user message
        await prisma.chatMessage.create({ data: { role: "user", content: message } });

        // Gather financial context
        const [accounts, cards, recentTx, subscriptions, incomes, goals] = await Promise.all([
            prisma.account.findMany(),
            prisma.creditCard.findMany(),
            prisma.transaction.findMany({ orderBy: { date: "desc" }, take: 30 }),
            prisma.subscription.findMany({ where: { active: true } }),
            prisma.income.findMany({ where: { active: true } }),
            prisma.financialGoal.findMany(),
        ]);

        const totalBalanceCents = accounts.reduce((s, a) => s + a.balanceCents, 0);
        const totalDebtCents = cards.reduce((s, c) => s + c.balanceCents, 0);
        const totalBalance = toMajorUnits(totalBalanceCents);
        const totalDebt = toMajorUnits(totalDebtCents);
        const cardLines = cards.map((c) => {
            const utilization = percentages(c.balanceCents, c.creditLimitCents, {
                clamp: true,
                decimals: 0,
            });
            return `${c.name}: $${toMajorUnits(c.balanceCents).toLocaleString()} de $${toMajorUnits(c.creditLimitCents).toLocaleString()} (${utilization}% utilización)`;
        });
        const goalLines = goals.map((g) => {
            const progress = percentages(g.currentAmountCents, g.targetAmountCents, {
                clamp: true,
                decimals: 0,
            });
            return `${g.name}: $${toMajorUnits(g.currentAmountCents)} de $${toMajorUnits(g.targetAmountCents)} (${progress}%)`;
        });
        const recentTxLines = recentTx.slice(0, 10).map((t) =>
            `${t.type === "income" ? "+" : "-"}$${toMajorUnits(Math.abs(t.amountCents))} ${t.merchant || t.category} (${new Date(t.date).toLocaleDateString("es-MX")})`,
        );

        const financialContext = `
CONTEXTO FINANCIERO DEL USUARIO:
- Balance total en cuentas: $${totalBalance.toLocaleString()} MXN
- Deuda total en tarjetas: $${totalDebt.toLocaleString()} MXN
- Patrimonio neto: $${(totalBalance - totalDebt).toLocaleString()} MXN
- Cuentas: ${accounts.map(a => `${a.name} ($${toMajorUnits(a.balanceCents).toLocaleString()})`).join(", ") || "Ninguna"}
- Tarjetas: ${cardLines.join("; ") || "Ninguna"}
- Suscripciones activas: ${subscriptions.map(s => `${s.name} $${toMajorUnits(s.amountCents)}`).join(", ") || "Ninguna"}
- Ingresos: ${incomes.map(i => `${i.name} $${toMajorUnits(i.amountCents)} ${i.frequency}`).join(", ") || "No registrados"}
- Metas: ${goalLines.join("; ") || "Ninguna"}
- Últimas transacciones: ${recentTxLines.join("; ") || "Ninguna"}`;

        // Get chat history
        const history = await prisma.chatMessage.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        const apiKey = process.env.OPENAI_API_KEY;
        let assistantMessage: string;

        if (apiKey) {
            const openai = new OpenAI({ apiKey });
            const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
                { role: "system", content: SYSTEM_PROMPT + "\n\n" + financialContext },
                ...history.reverse().map(m => ({
                    role: m.role as "user" | "assistant",
                    content: m.content,
                })),
            ];

            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages,
                max_tokens: 1500,
                temperature: 0.7,
            });

            assistantMessage = completion.choices[0]?.message?.content || "No pude generar una respuesta.";
        } else {
            // Fallback without AI
            assistantMessage = generateFallbackResponse(message, {
                totalBalanceCents,
                totalDebtCents,
                accounts: accounts.map((a) => ({ name: a.name, balanceCents: a.balanceCents })),
                cards: cards.map((c) => ({
                    name: c.name,
                    balanceCents: c.balanceCents,
                    creditLimitCents: c.creditLimitCents,
                })),
                subscriptions: subscriptions.map((s) => ({ name: s.name, amountCents: s.amountCents })),
            });
        }

        // Save assistant message
        await prisma.chatMessage.create({ data: { role: "assistant", content: assistantMessage } });

        return NextResponse.json({ message: assistantMessage });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json({ error: "Error en el chat" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const messages = await prisma.chatMessage.findMany({
            orderBy: { createdAt: "asc" },
            take: 50,
        });
        return NextResponse.json(messages);
    } catch (error) {
        console.error("Error fetching chat:", error);
        return NextResponse.json({ error: "Error" }, { status: 500 });
    }
}

function generateFallbackResponse(
    message: string,
    ctx: {
        totalBalanceCents: number;
        totalDebtCents: number;
        accounts: { name: string; balanceCents: number }[];
        cards: { name: string; balanceCents: number; creditLimitCents: number }[];
        subscriptions: { name: string; amountCents: number }[];
    }
): string {
    const msg = message.toLowerCase();
    const totalBalance = toMajorUnits(ctx.totalBalanceCents);
    const totalDebt = toMajorUnits(ctx.totalDebtCents);
    const netWorth = toMajorUnits(ctx.totalBalanceCents - ctx.totalDebtCents);

    if (msg.includes("puedo gastar") || msg.includes("puedo comprar")) {
        return `📊 **Tu balance disponible es $${totalBalance.toLocaleString()} MXN**\n\nAntes de gastar, considera:\n- Deuda en tarjetas: $${totalDebt.toLocaleString()}\n- Patrimonio neto: $${netWorth.toLocaleString()}\n\n💡 Como regla general, no gastes más del 30% de tus ingresos mensuales en una sola compra.\n\n⚠️ *Para respuestas más personalizadas, configura tu API key de OpenAI en .env.local*`;
    }

    if (msg.includes("tarjeta") || msg.includes("pagar")) {
        const cardInfo = ctx.cards
            .map((c) => {
                const utilization = percentages(c.balanceCents, c.creditLimitCents, {
                    clamp: true,
                    decimals: 0,
                });
                return `- **${c.name}**: $${toMajorUnits(c.balanceCents).toLocaleString()} / $${toMajorUnits(c.creditLimitCents).toLocaleString()} (${utilization}% utilización)`;
            })
            .join("\n");
        return `💳 **Resumen de tarjetas:**\n\n${cardInfo || "No hay tarjetas registradas."}\n\n💡 Prioriza pagar la tarjeta con mayor tasa de interés (método avalancha).\n\n⚠️ *Configura tu API key de OpenAI para recomendaciones más detalladas.*`;
    }

    const subsTotalCents = ctx.subscriptions.reduce((s, sub) => s + sub.amountCents, 0);
    return `📊 **Resumen rápido:**\n- Balance: $${totalBalance.toLocaleString()}\n- Deuda: $${totalDebt.toLocaleString()}\n- Patrimonio neto: $${netWorth.toLocaleString()}\n- Suscripciones: ${ctx.subscriptions.length} activas ($${toMajorUnits(subsTotalCents).toLocaleString()}/mes)\n\n¿En qué puedo ayudarte? Puedo analizar gastos, crear planes de pago, o evaluar si puedes hacer una compra.\n\n⚠️ *Para IA avanzada, configura OPENAI_API_KEY en .env.local*`;
}
