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
        const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
        const totalDebt = creditCards.reduce((sum, c) => sum + c.balance, 0);
        const netWorth = totalBalance - totalDebt;

        // Cash flow
        const cashFlow = calculateCashFlow(monthTransactions);

        // Category breakdown
        const categoryBreakdown = analyzeByCategory(monthTransactions);

        // Credit card analysis
        const cardAnalysis = creditCards.map((card) => analyzeCreditCard(card));

        // Projection
        const projection = projectEndOfMonth(
            monthTransactions.map((t) => ({
                amount: t.amount,
                type: t.type,
                date: t.date.toISOString(),
            })),
            totalBalance,
        );

        // Anomalies
        const anomalies = detectAnomalies(
            monthTransactions.map((t) => ({
                id: t.id,
                amount: t.amount,
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
            if (s.frequency === "monthly") return sum + s.amount;
            if (s.frequency === "yearly") return sum + s.amount / 12;
            if (s.frequency === "weekly") return sum + s.amount * 4.33;
            return sum + s.amount;
        }, 0);

        // Expected monthly income
        const expectedMonthlyIncome = incomes.reduce((sum, i) => {
            if (i.frequency === "monthly") return sum + i.amount;
            if (i.frequency === "biweekly") return sum + i.amount * 2;
            if (i.frequency === "weekly") return sum + i.amount * 4.33;
            return sum + i.amount;
        }, 0);

        return NextResponse.json({
            overview: {
                totalBalance,
                totalDebt,
                netWorth,
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
                monthlyTotal: Math.round(monthlySubsCost * 100) / 100,
            },
            income: {
                expectedMonthly: Math.round(expectedMonthlyIncome * 100) / 100,
            },
            goals: goals.map((g) => ({
                ...g,
                progress: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
            })),
            recentTransactions: monthTransactions.slice(0, 10),
        });
    } catch (error) {
        console.error("Error generating analysis:", error);
        // Minimal fallback
        return NextResponse.json({
            overview: { totalBalance: 0, totalDebt: 0, netWorth: 0, accountCount: 0, cardCount: 0 },
            cashFlow: { totalIncome: 0, totalExpenses: 0, netBalance: 0, savingsRate: 0, isDeficit: false },
            categoryBreakdown: [],
            creditCards: [],
            projection: { projectedBalance: 0, liquidityDays: 0, overdraftRisk: false, dailyBurnRate: 0, daysRemaining: 0 },
            anomalies: [],
            recommendations: [],
            subscriptions: { count: 0, monthlyTotal: 0 },
            income: { expectedMonthly: 0 },
            goals: [],
            recentTransactions: []
        });
    }
}
