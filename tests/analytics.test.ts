import { describe, expect, it } from "vitest";
import {
  accountDistribution,
  clampPercentage,
  projectEndOfMonthCents,
  spentPct,
} from "../app/lib/analytics.ts";

describe("analytics helpers", () => {
  it("spent pct cap", () => {
    expect(spentPct(10000, 15000)).toBe(100);
    expect(spentPct(10000, 2500)).toBe(25);
    expect(spentPct(0, 2500)).toBe(0);
  });

  it("clamp distribution", () => {
    const dist = accountDistribution([
      { id: "a", balanceCents: 7000 },
      { id: "b", balanceCents: 3000 },
    ]);

    expect(dist[0].pct).toBe(70);
    expect(dist[1].pct).toBe(30);
    expect(clampPercentage(120)).toBe(100);
    expect(clampPercentage(-20)).toBe(0);
  });

  it("projections", () => {
    const result = projectEndOfMonthCents({
      currentBalanceCents: 500000,
      monthlyExpenseCents: 200000,
      daysPassed: 10,
      daysRemaining: 20,
    });

    expect(result.dailyBurnCents).toBe(20000);
    expect(result.projectedRemainingExpenseCents).toBe(400000);
    expect(result.projectedBalanceCents).toBe(100000);
    expect(result.overdraftRisk).toBe(false);
  });
});
