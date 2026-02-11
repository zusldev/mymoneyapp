import { CATEGORIES, CategoryKey } from "./categories";
import {
  format as formatMoney,
  parse as parseMoney,
  percentages,
  sum,
  toMajorUnits,
} from "./money";
import { projectEndOfMonthCents } from "./analytics";

export interface CashFlowResult {
  totalIncomeCents: number;
  totalExpensesCents: number;
  netBalanceCents: number;
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
  totalCents: number;
  total: number;
  percentage: number;
  count: number;
}

export interface CreditCardAnalysis {
  id: string;
  name: string;
  utilization: number;
  riskLevel: "bajo" | "medio" | "alto" | "critico";
  minimumPaymentCents: number;
  noInterestPaymentCents: number;
  availableCreditCents: number;
  minimumPayment: number;
  noInterestPayment: number;
  availableCredit: number;
  impactDescription: string;
}

export interface MonthlyProjection {
  projectedBalanceCents: number;
  dailyBurnRateCents: number;
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
  amountCents?: number;
  amount?: number;
  relatedIds?: string[];
}

export interface Recommendation {
  priority: number;
  category: "pago" | "ahorro" | "gasto" | "suscripcion" | "presupuesto";
  title: string;
  description: string;
  impact: string;
  actionable: boolean;
}

type MoneyInput = { amountCents?: number; amount?: number };

function resolveAmountCents(value: MoneyInput): number {
  if (typeof value.amountCents === "number") return value.amountCents;
  if (typeof value.amount === "number") return parseMoney(value.amount);
  return 0;
}

export function calculateCashFlow(
  transactions: Array<{ amountCents?: number; amount?: number; type: string }>,
): CashFlowResult {
  const totalIncomeCents = sum(
    transactions
      .filter((t) => t.type === "income")
      .map((t) => Math.abs(resolveAmountCents(t))),
  );
  const totalExpensesCents = sum(
    transactions
      .filter((t) => t.type === "expense")
      .map((t) => Math.abs(resolveAmountCents(t))),
  );

  const netBalanceCents = totalIncomeCents - totalExpensesCents;
  const savingsRate = percentages(netBalanceCents, totalIncomeCents, {
    clamp: false,
    decimals: 2,
  });

  return {
    totalIncomeCents,
    totalExpensesCents,
    netBalanceCents,
    totalIncome: toMajorUnits(totalIncomeCents),
    totalExpenses: toMajorUnits(totalExpensesCents),
    netBalance: toMajorUnits(netBalanceCents),
    savingsRate,
    isDeficit: netBalanceCents < 0,
  };
}

export function analyzeByCategory(
  transactions: Array<{ amountCents?: number; amount?: number; type: string; category: string }>,
): CategoryBreakdown[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalExpensesCents = sum(expenses.map((t) => Math.abs(resolveAmountCents(t))));

  const grouped: Record<string, { totalCents: number; count: number }> = {};

  for (const tx of expenses) {
    const category = tx.category || "otros";
    if (!grouped[category]) grouped[category] = { totalCents: 0, count: 0 };
    grouped[category].totalCents += Math.abs(resolveAmountCents(tx));
    grouped[category].count += 1;
  }

  return Object.entries(grouped)
    .map(([category, data]) => {
      const cat = CATEGORIES[category as CategoryKey] ?? CATEGORIES.otros;
      return {
        category: category as CategoryKey,
        label: cat.label,
        color: cat.color,
        totalCents: data.totalCents,
        total: toMajorUnits(data.totalCents),
        percentage: percentages(data.totalCents, totalExpensesCents, {
          clamp: true,
          decimals: 2,
        }),
        count: data.count,
      };
    })
    .sort((a, b) => b.totalCents - a.totalCents);
}

export function analyzeCreditCard(card: {
  id: string;
  name: string;
  creditLimitCents?: number;
  balanceCents?: number;
  creditLimit?: number;
  balance?: number;
  apr: number;
}): CreditCardAnalysis {
  const creditLimitCents = resolveAmountCents({
    amountCents: card.creditLimitCents,
    amount: card.creditLimit ?? 0,
  });
  const balanceCents = resolveAmountCents({
    amountCents: card.balanceCents,
    amount: card.balance ?? 0,
  });

  const utilization = creditLimitCents > 0 ? (balanceCents / creditLimitCents) * 100 : 0;

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

  const minimumPaymentCents = Math.max(Math.round(balanceCents * 0.03), Math.min(20000, balanceCents));
  const noInterestPaymentCents = balanceCents;
  const availableCreditCents = Math.max(0, creditLimitCents - balanceCents);

  return {
    id: card.id,
    name: card.name,
    utilization: Math.round(utilization * 100) / 100,
    riskLevel,
    minimumPaymentCents,
    noInterestPaymentCents,
    availableCreditCents,
    minimumPayment: toMajorUnits(minimumPaymentCents),
    noInterestPayment: toMajorUnits(noInterestPaymentCents),
    availableCredit: toMajorUnits(availableCreditCents),
    impactDescription,
  };
}

export function projectEndOfMonth(
  transactions: Array<{ amountCents?: number; amount?: number; type: string; date: string | Date }>,
  currentBalanceCentsOrMajor: number,
): MonthlyProjection {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = daysInMonth - currentDay;

  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const monthExpenseCents = sum(
    monthTransactions
      .filter((t) => t.type === "expense")
      .map((t) => Math.abs(resolveAmountCents(t))),
  );

  const currentBalanceCents = Number.isSafeInteger(currentBalanceCentsOrMajor)
    ? currentBalanceCentsOrMajor
    : parseMoney(currentBalanceCentsOrMajor);

  const projection = projectEndOfMonthCents({
    currentBalanceCents,
    monthlyExpenseCents: monthExpenseCents,
    daysPassed: currentDay,
    daysRemaining,
  });

  const liquidityDays =
    projection.dailyBurnCents > 0
      ? Math.min(Math.floor(currentBalanceCents / projection.dailyBurnCents), 999)
      : 999;

  return {
    projectedBalanceCents: projection.projectedBalanceCents,
    dailyBurnRateCents: projection.dailyBurnCents,
    projectedBalance: toMajorUnits(projection.projectedBalanceCents),
    liquidityDays,
    overdraftRisk: projection.overdraftRisk,
    dailyBurnRate: toMajorUnits(projection.dailyBurnCents),
    daysRemaining,
  };
}

export function detectAnomalies(
  transactions: Array<{
    id: string;
    amountCents?: number;
    amount?: number;
    merchant: string;
    date: string | Date;
    category: string;
    isFeeOrInterest: boolean;
  }>,
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < transactions.length; j++) {
      const a = transactions[i];
      const b = transactions[j];
      const aCents = resolveAmountCents(a);
      const bCents = resolveAmountCents(b);

      if (a.merchant && b.merchant && a.merchant === b.merchant && Math.abs(aCents - bCents) <= 1) {
        const daysDiff =
          Math.abs(new Date(a.date).getTime() - new Date(b.date).getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff <= 2) {
          anomalies.push({
            type: "duplicate",
            severity: "warning",
            description: `Posible cargo duplicado: ${a.merchant} por ${formatMoney(Math.abs(aCents))}`,
            amountCents: aCents,
            amount: toMajorUnits(aCents),
            relatedIds: [a.id, b.id],
          });
        }
      }
    }
  }

  const fees = transactions.filter((t) => t.isFeeOrInterest);
  for (const fee of fees) {
    const feeCents = Math.abs(resolveAmountCents(fee));
    if (feeCents > 50000) {
      anomalies.push({
        type: "unusual_fee",
        severity: "warning",
        description: `Comisión/interés inusual: ${fee.merchant || "Sin comercio"} por ${formatMoney(feeCents)}`,
        amountCents: feeCents,
        amount: toMajorUnits(feeCents),
        relatedIds: [fee.id],
      });
    }
  }

  const amounts = transactions
    .filter((t) => t.category !== "transferencias")
    .map((t) => Math.abs(resolveAmountCents(t)));

  if (amounts.length > 5) {
    const avg = Math.round(sum(amounts) / amounts.length);
    for (const tx of transactions) {
      const txCents = Math.abs(resolveAmountCents(tx));
      if (txCents > avg * 3 && tx.category !== "transferencias") {
        anomalies.push({
          type: "spike",
          severity: "info",
          description: `Gasto inusualmente alto: ${tx.merchant || tx.category} por ${formatMoney(txCents)} (promedio: ${formatMoney(avg)})`,
          amountCents: txCents,
          amount: toMajorUnits(txCents),
          relatedIds: [tx.id],
        });
      }
    }
  }

  return anomalies;
}

export function generateRecommendations(data: {
  cashFlow: CashFlowResult;
  categoryBreakdown: CategoryBreakdown[];
  creditCards: CreditCardAnalysis[];
  projection: MonthlyProjection;
  anomalies: Anomaly[];
}): Recommendation[] {
  const recs: Recommendation[] = [];
  let priority = 1;

  if (data.projection.overdraftRisk) {
    recs.push({
      priority: priority++,
      category: "presupuesto",
      title: "⚠️ Riesgo de sobregiro detectado",
      description: `Al ritmo actual de gasto (${formatMoney(data.projection.dailyBurnRateCents)}/día), podrías quedarte sin fondos antes de fin de mes.`,
      impact: "Reducir gastos variables en al menos 30% esta semana.",
      actionable: true,
    });
  }

  const riskyCards = data.creditCards
    .filter((card) => card.riskLevel === "alto" || card.riskLevel === "critico")
    .sort((a, b) => b.utilization - a.utilization);

  for (const card of riskyCards) {
    recs.push({
      priority: priority++,
      category: "pago",
      title: `Pagar tarjeta ${card.name}`,
      description: `Utilización al ${card.utilization}% (${card.riskLevel}). Pago para no generar intereses: ${formatMoney(card.noInterestPaymentCents)}. Mínimo: ${formatMoney(card.minimumPaymentCents)}.`,
      impact: card.impactDescription,
      actionable: true,
    });
  }

  if (data.cashFlow.isDeficit) {
    recs.push({
      priority: priority++,
      category: "ahorro",
      title: "Gastas más de lo que ganas",
      description: `Déficit de ${formatMoney(Math.abs(data.cashFlow.netBalanceCents))}. Tu tasa de ahorro es ${data.cashFlow.savingsRate}%.`,
      impact: "Aplica la regla 50/30/20: 50% necesidades, 30% deseos, 20% ahorro.",
      actionable: true,
    });
  }

  if (data.categoryBreakdown.length > 0) {
    const top = data.categoryBreakdown[0];
    if (top.percentage > 40) {
      recs.push({
        priority: priority++,
        category: "gasto",
        title: `${top.label} consume ${top.percentage}% de tus gastos`,
        description: `${formatMoney(top.totalCents)} en ${top.count} transacciones. Considera establecer un tope mensual.`,
        impact: "Reducir esta categoría un 15% te ahorraría significativamente.",
        actionable: true,
      });
    }
  }

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

// Compat helper for UI that still passes major units.
export function formatCurrency(amount: number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyFromCents(cents: number, currency = "MXN"): string {
  return formatMoney(cents, currency, "es-MX");
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

