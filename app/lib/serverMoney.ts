import { parse, toMajorUnits } from "./money";

export function parseAmountInput(value: unknown): number {
  if (typeof value === "number" || typeof value === "string") {
    return parse(value);
  }
  throw new Error("Monto inválido");
}

export function majorFromCents(cents: number): number {
  return toMajorUnits(cents);
}

function readCents(centsValue: unknown, majorValue?: unknown): number {
  if (typeof centsValue === "number" && Number.isFinite(centsValue)) {
    return Math.trunc(centsValue);
  }
  if (typeof majorValue === "number" || typeof majorValue === "string") {
    try {
      return parse(majorValue);
    } catch {
      return 0;
    }
  }
  return 0;
}

export function accountDto<T extends { balanceCents?: number; balance?: number }>(account: T) {
  const cents = readCents(account.balanceCents, account.balance);
  return {
    ...account,
    balanceCents: cents,
  };
}

export function cardDto<T extends { creditLimitCents?: number; balanceCents?: number; creditLimit?: number; balance?: number }>(card: T) {
  const creditLimitCents = readCents(card.creditLimitCents, card.creditLimit);
  const balanceCents = readCents(card.balanceCents, card.balance);
  return {
    ...card,
    creditLimitCents,
    balanceCents,
  };
}

export function txDto<T extends { amountCents?: number; amount?: number }>(tx: T) {
  const amountCents = readCents(tx.amountCents, tx.amount);
  return {
    ...tx,
    amountCents,
  };
}

export function subDto<T extends { amountCents?: number; amount?: number }>(sub: T) {
  const amountCents = readCents(sub.amountCents, sub.amount);
  return {
    ...sub,
    amountCents,
  };
}

export function incomeDto<T extends { amountCents?: number; amount?: number }>(income: T) {
  const amountCents = readCents(income.amountCents, income.amount);
  return {
    ...income,
    amountCents,
  };
}

export function goalDto<T extends { targetAmountCents?: number; currentAmountCents?: number; targetAmount?: number; currentAmount?: number }>(goal: T) {
  const targetAmountCents = readCents(goal.targetAmountCents, goal.targetAmount);
  const currentAmountCents = readCents(goal.currentAmountCents, goal.currentAmount);
  return {
    ...goal,
    targetAmountCents,
    currentAmountCents,
  };
}
