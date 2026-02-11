import Decimal from "decimal.js";
import { sum } from "./money.ts";
import type { AmountCents } from "./money.ts";

export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly" | "yearly";

const MONTHS_PER_YEAR = new Decimal(12);
const WEEKS_PER_YEAR = new Decimal(52);

function roundCents(value: Decimal): AmountCents {
  return value.toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDaysUtc(base: Date, days: number): Date {
  const next = startOfUtcDay(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonthsClampedUtc(base: Date, monthsToAdd: number): Date {
  const year = base.getUTCFullYear();
  const month = base.getUTCMonth();
  const day = base.getUTCDate();

  const targetFirstDay = new Date(Date.UTC(year, month + monthsToAdd, 1));
  const lastDayOfTargetMonth = new Date(
    Date.UTC(
      targetFirstDay.getUTCFullYear(),
      targetFirstDay.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  return new Date(
    Date.UTC(
      targetFirstDay.getUTCFullYear(),
      targetFirstDay.getUTCMonth(),
      Math.min(day, lastDayOfTargetMonth),
    ),
  );
}

export function advanceDate(date: Date, frequency: RecurrenceFrequency): Date {
  const next = startOfUtcDay(date);

  switch (frequency) {
    case "weekly":
      return addDaysUtc(next, 7);
    case "biweekly":
      return addDaysUtc(next, 14);
    case "yearly":
      return addMonthsClampedUtc(next, 12);
    case "monthly":
    default:
      return addMonthsClampedUtc(next, 1);
  }
}

export function nextOccurrence(
  seedDate: Date,
  frequency: RecurrenceFrequency,
  now = new Date(),
): Date {
  const cursor = startOfUtcDay(seedDate);
  const baseline = startOfUtcDay(now);

  while (cursor < baseline) {
    const advanced = advanceDate(cursor, frequency);
    cursor.setTime(advanced.getTime());
  }

  return cursor;
}

export function toMonthlyCents(
  amountCents: AmountCents,
  frequency: RecurrenceFrequency,
): AmountCents {
  switch (frequency) {
    case "yearly":
      return roundCents(new Decimal(amountCents).div(MONTHS_PER_YEAR));
    case "weekly":
      return roundCents(
        new Decimal(amountCents).mul(WEEKS_PER_YEAR).div(MONTHS_PER_YEAR),
      );
    case "biweekly":
      return amountCents * 2;
    case "monthly":
    default:
      return amountCents;
  }
}

export function toYearlyCents(
  amountCents: AmountCents,
  frequency: RecurrenceFrequency,
): AmountCents {
  switch (frequency) {
    case "yearly":
      return amountCents;
    case "weekly":
      return amountCents * 52;
    case "biweekly":
      return amountCents * 26;
    case "monthly":
    default:
      return amountCents * 12;
  }
}

export function monthlyTotal(items: Array<{ amountCents: AmountCents; frequency: RecurrenceFrequency }>): AmountCents {
  return sum(items.map((item) => toMonthlyCents(item.amountCents, item.frequency)));
}
