// Shared types (money uses centavos as source of truth)

/* ═══ Base Entities ═══ */

export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  balanceCents: number;
  // Compat during migration:
  balance?: number;
}

export interface AccountFull extends Account {
  type: string;
  currency: string;
  _count?: { transactions: number };
  subscriptions?: MiniSub[];
  incomes?: MiniIncome[];
  transactions?: MiniTx[];
}

export interface MiniTx {
  id: string;
  merchant: string;
  amountCents?: number;
  amount?: number;
  type: string;
  date: string;
  category: string;
}

export interface MiniSub {
  id: string;
  name: string;
  amountCents?: number;
  amount?: number;
  frequency: string;
  icon: string;
}

export interface MiniIncome {
  id: string;
  name: string;
  amountCents?: number;
  amount?: number;
  frequency: string;
  icon: string;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  lastFour: string;
  color: string;
}

export interface CardData extends CreditCard {
  creditLimitCents: number;
  balanceCents: number;
  // Compat:
  creditLimit?: number;
  balance?: number;
  cutDate: number;
  payDate: number;
  apr: number;
  _count?: { transactions: number };
}

/* ═══ Transactions ═══ */

export interface Transaction {
  id: string;
  amountCents: number;
  amount?: number;
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

export interface CalendarTransaction {
  id: string;
  amountCents: number;
  amount?: number;
  type: "income" | "expense";
  date: string;
  description: string;
  category: string;
  merchant?: string;
}

/* ═══ Subscriptions ═══ */

export interface Subscription {
  id: string;
  name: string;
  amountCents: number;
  amount?: number;
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

export interface CalendarSubscription {
  id: string;
  name: string;
  amountCents: number;
  amount?: number;
  nextDate: string;
  frequency: string;
  active: boolean;
  color: string;
}

/* ═══ Income ═══ */

export interface Income {
  id: string;
  name: string;
  amountCents: number;
  amount?: number;
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
  targetAmountCents: number;
  currentAmountCents: number;
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

/* ═══ UI-level Anomaly ═══ */

export interface TransactionAnomaly {
  txId: string;
  type: string;
  label: string;
  severity: "info" | "warning" | "danger";
}

/* ═══ Dashboard ═══ */

export interface AnalysisData {
  overview: {
    totalBalanceCents?: number;
    totalDebtCents?: number;
    netWorthCents?: number;
    totalBalance: number;
    totalDebt: number;
    netWorth: number;
    accountCount: number;
    cardCount: number;
  };
  cashFlow: {
    totalIncomeCents?: number;
    totalExpensesCents?: number;
    netBalanceCents?: number;
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
    totalCents?: number;
    total: number;
    percentage: number;
    count: number;
  }[];
  creditCards: {
    id: string;
    name: string;
    utilization: number;
    riskLevel: string;
    minimumPaymentCents?: number;
    noInterestPaymentCents?: number;
    availableCreditCents?: number;
    minimumPayment: number;
    noInterestPayment: number;
    availableCredit: number;
    impactDescription: string;
  }[];
  projection: {
    projectedBalanceCents?: number;
    dailyBurnRateCents?: number;
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
    amountCents?: number;
    amount?: number;
  }[];
  recommendations: {
    priority: number;
    category: string;
    title: string;
    description: string;
    impact: string;
    actionable: boolean;
  }[];
  subscriptions: { count: number; monthlyTotalCents?: number; monthlyTotal: number };
  income: { expectedMonthlyCents?: number; expectedMonthly: number };
  goals: {
    id: string;
    name: string;
    targetAmountCents?: number;
    currentAmountCents?: number;
    targetAmount: number;
    currentAmount: number;
    progress: number;
    color: string;
    deadline: string;
  }[];
  recentTransactions: {
    id: string;
    amountCents?: number;
    amount: number;
    type: string;
    merchant: string;
    category: string;
    date: string;
  }[];
}

