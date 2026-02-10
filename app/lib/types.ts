// ─── Shared Types ───
// Single source of truth for all entity interfaces used across pages.

/* ═══ Base Entities ═══ */

/** Minimal account reference (used in selectors, linked entities) */
export interface Account {
    id: string;
    name: string;
    icon: string;
    color: string;
}

/** Full account with balance and nested data (used in cuentas page) */
export interface AccountFull extends Account {
    type: string;
    balance: number;
    currency: string;
    _count?: { transactions: number };
    subscriptions?: MiniSub[];
    incomes?: MiniIncome[];
    transactions?: MiniTx[];
}

/** Minimal transaction summary (nested in AccountFull) */
export interface MiniTx {
    id: string;
    merchant: string;
    amount: number;
    type: string;
    date: string;
    category: string;
}

/** Minimal subscription summary (nested in AccountFull) */
export interface MiniSub {
    id: string;
    name: string;
    amount: number;
    frequency: string;
    icon: string;
}

/** Minimal income summary (nested in AccountFull) */
export interface MiniIncome {
    id: string;
    name: string;
    amount: number;
    frequency: string;
    icon: string;
}

/** Credit card reference (used in selectors, forms) */
export interface CreditCard {
    id: string;
    name: string;
    bank: string;
    lastFour: string;
    color: string;
}

/** Full credit card with financial fields (used in tarjetas page) */
export interface CardData extends CreditCard {
    creditLimit: number;
    balance: number;
    cutDate: number;
    payDate: number;
    apr: number;
    _count?: { transactions: number };
}

/* ═══ Transactions ═══ */

/** Full transaction (used in transacciones page) */
export interface Transaction {
    id: string;
    amount: number;
    type: string;
    date: string;
    merchant: string;
    merchantNormalized: string;
    description: string;
    category: string;
    isSubscription: boolean;
    isFeeOrInterest: boolean;
    account?: { name: string; color: string } | null;
    creditCard?: { name: string; color: string; lastFour?: string } | null;
}

/** Lightweight transaction (used in calendario) */
export interface CalendarTransaction {
    id: string;
    amount: number;
    type: "income" | "expense";
    date: string;
    description: string;
    category: string;
    merchant?: string;
}

/* ═══ Subscriptions ═══ */

/** Full subscription (used in suscripciones page) */
export interface Subscription {
    id: string;
    name: string;
    amount: number;
    frequency: string;
    category: string;
    type: string;
    nextDate: string;
    active: boolean;
    color: string;
    icon: string;
    accountId: string | null;
    creditCardId: string | null;
    account?: Account | null;
    creditCard?: CreditCard | null;
    createdAt: string;
}

/** Lightweight subscription (used in calendario) */
export interface CalendarSubscription {
    id: string;
    name: string;
    amount: number;
    nextDate: string;
    frequency: string;
    active: boolean;
    color: string;
}

/* ═══ Income ═══ */

export interface Income {
    id: string;
    name: string;
    amount: number;
    frequency: string;
    type: string;
    nextDate: string;
    source: string;
    active: boolean;
    color: string;
    icon: string;
    accountId: string | null;
    creditCardId: string | null;
    account?: Account | null;
    creditCard?: CreditCard | null;
}

/* ═══ Goals ═══ */

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    priority: string;
    color: string;
}

/* ═══ Chat ═══ */

export interface ChatMessage {
    id: string;
    role: string;
    content: string;
    createdAt: string;
}

/* ═══ UI-level Anomaly (used in transacciones page) ═══ */

export interface TransactionAnomaly {
    txId: string;
    type: string;
    label: string;
    severity: "info" | "warn" | "danger";
}

/* ═══ Dashboard ═══ */

export interface AnalysisData {
    overview: {
        totalBalance: number;
        totalDebt: number;
        netWorth: number;
        accountCount: number;
        cardCount: number;
    };
    cashFlow: {
        totalIncome: number;
        totalExpenses: number;
        netBalance: number;
        savingsRate: number;
        isDeficit: boolean;
    };
    categoryBreakdown: {
        category: string;
        label: string;
        color: string;
        total: number;
        percentage: number;
        count: number;
    }[];
    creditCards: {
        id: string;
        name: string;
        utilization: number;
        riskLevel: string;
        minimumPayment: number;
        noInterestPayment: number;
        availableCredit: number;
        impactDescription: string;
    }[];
    projection: {
        projectedBalance: number;
        liquidityDays: number;
        overdraftRisk: boolean;
        dailyBurnRate: number;
        daysRemaining: number;
    };
    anomalies: {
        type: string;
        severity: string;
        description: string;
        amount?: number;
    }[];
    recommendations: {
        priority: number;
        category: string;
        title: string;
        description: string;
        impact: string;
    }[];
    subscriptions: { count: number; monthlyTotal: number };
    income: { expectedMonthly: number };
    goals: {
        id: string;
        name: string;
        targetAmount: number;
        currentAmount: number;
        progress: number;
        color: string;
        deadline: string;
    }[];
    recentTransactions: {
        id: string;
        amount: number;
        type: string;
        merchant: string;
        category: string;
        date: string;
    }[];
}
