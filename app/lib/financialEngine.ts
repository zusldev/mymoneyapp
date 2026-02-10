// Financial Engine — Pure TypeScript calculations (deterministic, exact)
import { CATEGORIES, CategoryKey } from "./categories";

export interface CashFlowResult {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    savingsRate: number;
    isDeficit: boolean;
}

export interface CategoryBreakdown {
    category: CategoryKey;
    label: string;
    color: string;
    total: number;
    percentage: number;
    count: number;
}

export interface CreditCardAnalysis {
    id: string;
    name: string;
    utilization: number;
    riskLevel: "bajo" | "medio" | "alto" | "critico";
    minimumPayment: number;
    noInterestPayment: number;
    availableCredit: number;
    impactDescription: string;
}

export interface MonthlyProjection {
    projectedBalance: number;
    liquidityDays: number;
    overdraftRisk: boolean;
    dailyBurnRate: number;
    daysRemaining: number;
}

export interface Anomaly {
    type: "duplicate" | "spike" | "unusual_fee" | "forgotten_subscription" | "high_frequency";
    severity: "info" | "warning" | "danger";
    description: string;
    amount?: number;
    relatedIds?: string[];
}

export interface Recommendation {
    priority: number; // 1 = highest
    category: "pago" | "ahorro" | "gasto" | "suscripcion" | "presupuesto";
    title: string;
    description: string;
    impact: string;
    actionable: boolean;
}

// ─── Cash Flow Analysis ───
export function calculateCashFlow(
    transactions: { amount: number; type: string }[],
): CashFlowResult {
    const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalExpenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

    return {
        totalIncome,
        totalExpenses,
        netBalance,
        savingsRate: Math.round(savingsRate * 100) / 100,
        isDeficit: netBalance < 0,
    };
}

// ─── Category Breakdown ───
export function analyzeByCategory(
    transactions: { amount: number; type: string; category: string }[],
): CategoryBreakdown[] {
    const expenses = transactions.filter((t) => t.type === "expense");
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const grouped: Record<string, { total: number; count: number }> = {};

    for (const t of expenses) {
        const cat = t.category || "otros";
        if (!grouped[cat]) grouped[cat] = { total: 0, count: 0 };
        grouped[cat].total += Math.abs(t.amount);
        grouped[cat].count += 1;
    }

    return Object.entries(grouped)
        .map(([category, data]) => {
            const catInfo = CATEGORIES[category as CategoryKey] || CATEGORIES.otros;
            return {
                category: category as CategoryKey,
                label: catInfo.label,
                color: catInfo.color,
                total: Math.round(data.total * 100) / 100,
                percentage: totalExpenses > 0
                    ? Math.round((data.total / totalExpenses) * 10000) / 100
                    : 0,
                count: data.count,
            };
        })
        .sort((a, b) => b.total - a.total);
}

// ─── Credit Card Analysis ───
export function analyzeCreditCard(card: {
    id: string;
    name: string;
    creditLimit: number;
    balance: number;
    apr: number;
}): CreditCardAnalysis {
    const utilization = card.creditLimit > 0
        ? (card.balance / card.creditLimit) * 100
        : 0;

    let riskLevel: CreditCardAnalysis["riskLevel"];
    let impactDescription: string;

    if (utilization <= 30) {
        riskLevel = "bajo";
        impactDescription = "Utilización saludable. Buen impacto en score crediticio.";
    } else if (utilization <= 50) {
        riskLevel = "medio";
        impactDescription = "Utilización moderada. Considera reducir para mejorar score.";
    } else if (utilization <= 75) {
        riskLevel = "alto";
        impactDescription = "Utilización alta. Tu score crediticio puede verse afectado negativamente.";
    } else {
        riskLevel = "critico";
        impactDescription = "¡Utilización crítica! Alto riesgo de sobreendeudamiento.";
    }

    // Minimum payment estimate (~2-5% of balance or $200 MXN minimum)
    const minimumPayment = Math.max(card.balance * 0.03, Math.min(200, card.balance));

    // Payment to avoid interest = full balance
    const noInterestPayment = card.balance;

    const availableCredit = Math.max(0, card.creditLimit - card.balance);

    return {
        id: card.id,
        name: card.name,
        utilization: Math.round(utilization * 100) / 100,
        riskLevel,
        minimumPayment: Math.round(minimumPayment * 100) / 100,
        noInterestPayment: Math.round(noInterestPayment * 100) / 100,
        availableCredit: Math.round(availableCredit * 100) / 100,
        impactDescription,
    };
}

// ─── Monthly Projection ───
export function projectEndOfMonth(
    transactions: { amount: number; type: string; date: string | Date }[],
    currentBalance: number,
): MonthlyProjection {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = daysInMonth - currentDay;
    const daysPassed = currentDay;

    const monthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const monthExpenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const dailyBurnRate = daysPassed > 0 ? monthExpenses / daysPassed : 0;
    const projectedRemainingExpenses = dailyBurnRate * daysRemaining;
    const projectedBalance = currentBalance - projectedRemainingExpenses;
    const liquidityDays = dailyBurnRate > 0
        ? Math.floor(currentBalance / dailyBurnRate)
        : 999;

    return {
        projectedBalance: Math.round(projectedBalance * 100) / 100,
        liquidityDays: Math.min(liquidityDays, 999),
        overdraftRisk: projectedBalance < 0,
        dailyBurnRate: Math.round(dailyBurnRate * 100) / 100,
        daysRemaining,
    };
}

// ─── Anomaly Detection ───
export function detectAnomalies(
    transactions: { id: string; amount: number; merchant: string; date: string | Date; category: string; isFeeOrInterest: boolean }[],
): Anomaly[] {
    const anomalies: Anomaly[] = [];

    // 1. Duplicate detection (same merchant, same amount, within 2 days)
    for (let i = 0; i < transactions.length; i++) {
        for (let j = i + 1; j < transactions.length; j++) {
            const a = transactions[i];
            const b = transactions[j];
            if (
                a.merchant && b.merchant &&
                a.merchant === b.merchant &&
                Math.abs(a.amount - b.amount) < 0.01
            ) {
                const daysDiff = Math.abs(
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                ) / (1000 * 60 * 60 * 24);
                if (daysDiff <= 2) {
                    anomalies.push({
                        type: "duplicate",
                        severity: "warning",
                        description: `Posible cargo duplicado: ${a.merchant} por $${Math.abs(a.amount).toLocaleString()}`,
                        amount: a.amount,
                        relatedIds: [a.id, b.id],
                    });
                }
            }
        }
    }

    // 2. Unusual fees
    const fees = transactions.filter((t) => t.isFeeOrInterest);
    for (const fee of fees) {
        if (Math.abs(fee.amount) > 500) {
            anomalies.push({
                type: "unusual_fee",
                severity: "warning",
                description: `Comisión/interés inusual: ${fee.merchant || "Sin comercio"} por $${Math.abs(fee.amount).toLocaleString()}`,
                amount: fee.amount,
                relatedIds: [fee.id],
            });
        }
    }

    // 3. Spending spikes (single transaction > 3x average)
    const amounts = transactions
        .filter((t) => t.category !== "transferencias")
        .map((t) => Math.abs(t.amount));
    if (amounts.length > 5) {
        const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
        for (const t of transactions) {
            if (Math.abs(t.amount) > avg * 3 && t.category !== "transferencias") {
                anomalies.push({
                    type: "spike",
                    severity: "info",
                    description: `Gasto inusualmente alto: ${t.merchant || t.category} por $${Math.abs(t.amount).toLocaleString()} (promedio: $${Math.round(avg).toLocaleString()})`,
                    amount: t.amount,
                    relatedIds: [t.id],
                });
            }
        }
    }

    return anomalies;
}

// ─── Recommendations Generator ───
export function generateRecommendations(data: {
    cashFlow: CashFlowResult;
    categoryBreakdown: CategoryBreakdown[];
    creditCards: CreditCardAnalysis[];
    projection: MonthlyProjection;
    anomalies: Anomaly[];
}): Recommendation[] {
    const recs: Recommendation[] = [];
    let priority = 1;

    // Critical: overdraft risk
    if (data.projection.overdraftRisk) {
        recs.push({
            priority: priority++,
            category: "presupuesto",
            title: "⚠️ Riesgo de sobregiro detectado",
            description: `Al ritmo actual de gasto ($${data.projection.dailyBurnRate.toLocaleString()}/día), podrías quedarte sin fondos antes de fin de mes.`,
            impact: "Reducir gastos variables en al menos 30% esta semana.",
            actionable: true,
        });
    }

    // High utilization credit cards (pay highest APR first — avalanche method)
    const riskyCards = data.creditCards
        .filter((c) => c.riskLevel === "alto" || c.riskLevel === "critico")
        .sort((a, b) => b.utilization - a.utilization);

    for (const card of riskyCards) {
        recs.push({
            priority: priority++,
            category: "pago",
            title: `Pagar tarjeta ${card.name}`,
            description: `Utilización al ${card.utilization}% (${card.riskLevel}). Pago para no generar intereses: $${card.noInterestPayment.toLocaleString()}. Mínimo: $${card.minimumPayment.toLocaleString()}.`,
            impact: card.impactDescription,
            actionable: true,
        });
    }

    // Deficit
    if (data.cashFlow.isDeficit) {
        recs.push({
            priority: priority++,
            category: "ahorro",
            title: "Gastas más de lo que ganas",
            description: `Déficit de $${Math.abs(data.cashFlow.netBalance).toLocaleString()}. Tu tasa de ahorro es ${data.cashFlow.savingsRate}%.`,
            impact: "Aplica la regla 50/30/20: 50% necesidades, 30% deseos, 20% ahorro.",
            actionable: true,
        });
    }

    // Top spending category
    if (data.categoryBreakdown.length > 0) {
        const top = data.categoryBreakdown[0];
        if (top.percentage > 40) {
            recs.push({
                priority: priority++,
                category: "gasto",
                title: `${top.label} consume ${top.percentage}% de tus gastos`,
                description: `$${top.total.toLocaleString()} en ${top.count} transacciones. Considera establecer un tope mensual.`,
                impact: "Reducir esta categoría un 15% te ahorraría significativamente.",
                actionable: true,
            });
        }
    }

    // Low savings rate
    if (data.cashFlow.savingsRate > 0 && data.cashFlow.savingsRate < 20) {
        recs.push({
            priority: priority++,
            category: "ahorro",
            title: "Tu tasa de ahorro es baja",
            description: `Estás ahorrando solo el ${data.cashFlow.savingsRate}% de tus ingresos. La meta recomendada es 20%.`,
            impact: "Automatiza un ahorro del 10% el día de pago para empezar.",
            actionable: true,
        });
    }

    return recs.sort((a, b) => a.priority - b.priority);
}

// ─── Format helpers ───
export function formatCurrency(amount: number, currency = "MXN"): string {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

export function formatPercentage(value: number): string {
    return `${value >= 0 ? "" : ""}${value.toFixed(1)}%`;
}
