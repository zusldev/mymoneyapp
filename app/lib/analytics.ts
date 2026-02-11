import { percentages } from "./money.ts";
import type { AmountCents } from "./money.ts";

export function spentPct(totalIncomeCents: AmountCents, totalExpensesCents: AmountCents): number {
  return percentages(totalExpensesCents, totalIncomeCents, { clamp: true, decimals: 0 });
}

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function accountDistribution(accounts: Array<{ id: string; balanceCents: AmountCents }>) {
  const total = accounts.reduce((acc, item) => acc + item.balanceCents, 0);

  if (total <= 0) {
    return accounts.map((item) => ({ id: item.id, pct: 0 }));
  }

  return accounts.map((item) => ({
    id: item.id,
    pct: clampPercentage((item.balanceCents / total) * 100),
  }));
}

export function projectEndOfMonthCents(params: {
  currentBalanceCents: AmountCents;
  monthlyExpenseCents: AmountCents;
  daysPassed: number;
  daysRemaining: number;
}) {
  const safeDaysPassed = Math.max(1, params.daysPassed);
  const dailyBurnCents = Math.round(params.monthlyExpenseCents / safeDaysPassed);
  const projectedRemainingExpenseCents = dailyBurnCents * Math.max(0, params.daysRemaining);
  const projectedBalanceCents = params.currentBalanceCents - projectedRemainingExpenseCents;

  return {
    dailyBurnCents,
    projectedRemainingExpenseCents,
    projectedBalanceCents,
    overdraftRisk: projectedBalanceCents < 0,
  };
}
