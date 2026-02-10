import { prisma } from "@/app/lib/prisma";

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

        const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
        const totalDebt = cards.reduce((s, c) => s + c.balance, 0);

        const financialContext = `
CONTEXTO FINANCIERO DEL USUARIO:
- Balance total en cuentas: $${totalBalance.toLocaleString()} MXN
- Deuda total en tarjetas: $${totalDebt.toLocaleString()} MXN
- Patrimonio neto: $${(totalBalance - totalDebt).toLocaleString()} MXN
- Cuentas: ${accounts.map(a => `${a.name} ($${a.balance.toLocaleString()})`).join(", ") || "Ninguna"}
- Tarjetas: ${cards.map(c => `${c.name}: $${c.balance.toLocaleString()} de $${c.creditLimit.toLocaleString()} (${((c.balance / c.creditLimit) * 100).toFixed(0)}% utilización)`).join("; ") || "Ninguna"}
- Suscripciones activas: ${subscriptions.map(s => `${s.name} $${s.amount}`).join(", ") || "Ninguna"}
- Ingresos: ${incomes.map(i => `${i.name} $${i.amount} ${i.frequency}`).join(", ") || "No registrados"}
- Metas: ${goals.map(g => `${g.name}: $${g.currentAmount} de $${g.targetAmount} (${((g.currentAmount / g.targetAmount) * 100).toFixed(0)}%)`).join("; ") || "Ninguna"}
- Últimas transacciones: ${recentTx.slice(0, 10).map(t => `${t.type === "income" ? "+" : "-"}$${Math.abs(t.amount)} ${t.merchant || t.category} (${new Date(t.date).toLocaleDateString("es-MX")})`).join("; ") || "Ninguna"}`;

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
            assistantMessage = generateFallbackResponse(message, { totalBalance, totalDebt, accounts, cards, subscriptions });
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
    ctx: { totalBalance: number; totalDebt: number; accounts: { name: string; balance: number }[]; cards: { name: string; balance: number; creditLimit: number }[]; subscriptions: { name: string; amount: number }[] }
): string {
    const msg = message.toLowerCase();

    if (msg.includes("puedo gastar") || msg.includes("puedo comprar")) {
        return `📊 **Tu balance disponible es $${ctx.totalBalance.toLocaleString()} MXN**\n\nAntes de gastar, considera:\n- Deuda en tarjetas: $${ctx.totalDebt.toLocaleString()}\n- Patrimonio neto: $${(ctx.totalBalance - ctx.totalDebt).toLocaleString()}\n\n💡 Como regla general, no gastes más del 30% de tus ingresos mensuales en una sola compra.\n\n⚠️ *Para respuestas más personalizadas, configura tu API key de OpenAI en .env.local*`;
    }

    if (msg.includes("tarjeta") || msg.includes("pagar")) {
        const cardInfo = ctx.cards.map(c =>
            `- **${c.name}**: $${c.balance.toLocaleString()} / $${c.creditLimit.toLocaleString()} (${((c.balance / c.creditLimit) * 100).toFixed(0)}% utilización)`
        ).join("\n");
        return `💳 **Resumen de tarjetas:**\n\n${cardInfo || "No hay tarjetas registradas."}\n\n💡 Prioriza pagar la tarjeta con mayor tasa de interés (método avalancha).\n\n⚠️ *Configura tu API key de OpenAI para recomendaciones más detalladas.*`;
    }

    return `📊 **Resumen rápido:**\n- Balance: $${ctx.totalBalance.toLocaleString()}\n- Deuda: $${ctx.totalDebt.toLocaleString()}\n- Patrimonio neto: $${(ctx.totalBalance - ctx.totalDebt).toLocaleString()}\n- Suscripciones: ${ctx.subscriptions.length} activas ($${ctx.subscriptions.reduce((s, sub) => s + sub.amount, 0).toLocaleString()}/mes)\n\n¿En qué puedo ayudarte? Puedo analizar gastos, crear planes de pago, o evaluar si puedes hacer una compra.\n\n⚠️ *Para IA avanzada, configura OPENAI_API_KEY en .env.local*`;
}
