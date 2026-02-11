import { describe, expect, it } from "vitest";
import {
  advanceDate,
  nextOccurrence,
  toMonthlyCents,
  toYearlyCents,
} from "../app/lib/dates.ts";

describe("dates helpers", () => {
  it("weekly/biweekly/monthly/yearly advance", () => {
    const base = new Date("2026-01-31T00:00:00.000Z");

    expect(advanceDate(base, "weekly").toISOString().slice(0, 10)).toBe("2026-02-07");
    expect(advanceDate(base, "biweekly").toISOString().slice(0, 10)).toBe("2026-02-14");
    expect(advanceDate(base, "monthly").toISOString().slice(0, 10)).toBe("2026-02-28");
    expect(advanceDate(base, "yearly").toISOString().slice(0, 10)).toBe("2027-01-31");
  });

  it("next occurrence monthly", () => {
    const seed = new Date("2025-10-15T00:00:00.000Z");
    const now = new Date("2026-02-11T00:00:00.000Z");
    const next = nextOccurrence(seed, "monthly", now);

    expect(next.toISOString().slice(0, 10)).toBe("2026-02-15");
  });

  it("next occurrence biweekly", () => {
    const seed = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date("2026-02-11T00:00:00.000Z");
    const next = nextOccurrence(seed, "biweekly", now);

    expect(next.toISOString().slice(0, 10)).toBe("2026-02-12");
  });

  it("monthly and yearly conversion", () => {
    const amountCents = 10000;
    expect(toMonthlyCents(amountCents, "monthly")).toBe(10000);
    expect(toMonthlyCents(amountCents, "biweekly")).toBe(20000);
    expect(toYearlyCents(amountCents, "monthly")).toBe(120000);
    expect(toYearlyCents(amountCents, "weekly")).toBe(520000);
  });
});
