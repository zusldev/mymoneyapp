import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import {
    calculateCashFlow,
    analyzeByCategory,
    analyzeCreditCard,
    projectEndOfMonth,
    detectAnomalies,
    generateRecommendations,
} from "@/app/lib/financialEngine";
import { toMonthlyCents } from "@/app/lib/dates";
import { goalDto, txDto } from "@/app/lib/serverMoney";
import { toMajorUnits } from "@/app/lib/money";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Fetch all data in parallel
        const [accounts, creditCards, monthTransactions, subscriptions, incomes, goals] =
            await Promise.all([
                prisma.account.findMany(),
                prisma.creditCard.findMany(),
                prisma.transaction.findMany({
                    where: { date: { gte: startOfMonth, lte: endOfMonth } },
                    orderBy: { date: "desc" },
                }),
                prisma.subscription.findMany({ where: { active: true } }),
                prisma.income.findMany({ where: { active: true } }),
                prisma.financialGoal.findMany(),
            ]);

        // Total balance across all accounts
        const totalBalanceCents = accounts.reduce((sum, a) => sum + a.balanceCents, 0);
        const totalDebtCents = creditCards.reduce((sum, c) => sum + c.balanceCents, 0);
        const netWorthCents = totalBalanceCents - totalDebtCents;

        // Cash flow
        const cashFlow = calculateCashFlow(monthTransactions);

        // Category breakdown
        const categoryBreakdown = analyzeByCategory(monthTransactions);

        // Credit card analysis
        const cardAnalysis = creditCards.map((card) => analyzeCreditCard(card));

        // Projection
        const projection = projectEndOfMonth(
            monthTransactions.map((t) => ({
                amountCents: t.amountCents,
                type: t.type,
                date: t.date.toISOString(),
            })),
            totalBalanceCents,
        );

        // Anomalies
        const anomalies = detectAnomalies(
            monthTransactions.map((t) => ({
                id: t.id,
                amountCents: t.amountCents,
                merchant: t.merchant,
                date: t.date.toISOString(),
                category: t.category,
                isFeeOrInterest: t.isFeeOrInterest,
            })),
        );

        // Recommendations
        const recommendations = generateRecommendations({
            cashFlow,
            categoryBreakdown,
            creditCards: cardAnalysis,
            projection,
            anomalies,
        });

        // Monthly subscriptions cost
        const monthlySubsCost = subscriptions.reduce((sum, s) => {
            return sum + toMonthlyCents(s.amountCents, s.frequency as "weekly" | "biweekly" | "monthly" | "yearly");
        }, 0);

        // Expected monthly income
        const expectedMonthlyIncome = incomes.reduce((sum, i) => {
            return sum + toMonthlyCents(i.amountCents, i.frequency as "weekly" | "biweekly" | "monthly" | "yearly");
        }, 0);

        return NextResponse.json({
            overview: {
                totalBalanceCents,
                totalDebtCents,
                netWorthCents,
                totalBalance: toMajorUnits(totalBalanceCents),
                totalDebt: toMajorUnits(totalDebtCents),
                netWorth: toMajorUnits(netWorthCents),
                accountCount: accounts.length,
                cardCount: creditCards.length,
            },
            cashFlow,
            categoryBreakdown,
            creditCards: cardAnalysis,
            projection,
            anomalies,
            recommendations,
            subscriptions: {
                count: subscriptions.length,
                monthlyTotalCents: monthlySubsCost,
                monthlyTotal: toMajorUnits(monthlySubsCost),
            },
            income: {
                expectedMonthlyCents: expectedMonthlyIncome,
                expectedMonthly: toMajorUnits(expectedMonthlyIncome),
            },
            goals: goals.map((g) => ({
                ...goalDto(g),
                progress: g.targetAmountCents > 0 ? (g.currentAmountCents / g.targetAmountCents) * 100 : 0,
            })),
            recentTransactions: monthTransactions.slice(0, 10).map(txDto),
        });
    } catch (error) {
        console.error("Error generating analysis:", error);
        // Minimal fallback
        return NextResponse.json({
            overview: { totalBalanceCents: 0, totalDebtCents: 0, netWorthCents: 0, totalBalance: 0, totalDebt: 0, netWorth: 0, accountCount: 0, cardCount: 0 },
            cashFlow: { totalIncomeCents: 0, totalExpensesCents: 0, netBalanceCents: 0, totalIncome: 0, totalExpenses: 0, netBalance: 0, savingsRate: 0, isDeficit: false },
            categoryBreakdown: [],
            creditCards: [],
            projection: { projectedBalanceCents: 0, dailyBurnRateCents: 0, projectedBalance: 0, liquidityDays: 0, overdraftRisk: false, dailyBurnRate: 0, daysRemaining: 0 },
            anomalies: [],
            recommendations: [],
            subscriptions: { count: 0, monthlyTotalCents: 0, monthlyTotal: 0 },
            income: { expectedMonthlyCents: 0, expectedMonthly: 0 },
            goals: [],
            recentTransactions: []
        });
    }
}
