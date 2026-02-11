import { z } from "zod";
import { toMajorUnits } from "./money";

const amountOptional = z.number().finite();
const cents = z.number().int();

const miniTxSchema = z.object({
  id: z.string(),
  merchant: z.string().optional().default(""),
  amountCents: cents.optional().default(0),
  amount: amountOptional.optional(),
  type: z.string().optional().default("expense"),
  date: z.string(),
  category: z.string().optional().default("otros"),
}).transform((value) => ({
  ...value,
  amount: value.amount ?? toMajorUnits(value.amountCents),
}));

const miniRecurringSchema = z.object({
  id: z.string(),
  name: z.string(),
  amountCents: cents.optional().default(0),
  amount: amountOptional.optional(),
  frequency: z.string().optional().default("monthly"),
  icon: z.string().optional().default("sync"),
}).transform((value) => ({
  ...value,
  amount: value.amount ?? toMajorUnits(value.amountCents),
}));

export const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional().default("account_balance"),
  color: z.string().optional().default("#06b6d4"),
  type: z.string().optional(),
  currency: z.string().optional(),
  balanceCents: cents.optional().default(0),
  balance: amountOptional.optional(),
  _count: z.object({ transactions: z.number() }).optional(),
  transactions: z.array(miniTxSchema).optional(),
  subscriptions: z.array(miniRecurringSchema).optional(),
  incomes: z.array(miniRecurringSchema).optional(),
}).transform((value) => ({
  ...value,
  type: value.type ?? "checking",
  currency: value.currency ?? "MXN",
  balance: value.balance ?? toMajorUnits(value.balanceCents),
}));

export const transactionSchema = z.object({
  id: z.string(),
  type: z.string(),
  date: z.string(),
  category: z.string(),
  merchant: z.string().optional().default(""),
  merchantNormalized: z.string().optional(),
  description: z.string().optional().default(""),
  amountCents: cents.optional().default(0),
  amount: amountOptional.optional(),
  isSubscription: z.boolean().optional().default(false),
  isFeeOrInterest: z.boolean().optional().default(false),
  account: z.object({ name: z.string(), color: z.string() }).nullable().optional(),
  creditCard: z
    .object({ name: z.string(), color: z.string(), lastFour: z.string().optional() })
    .nullable()
    .optional(),
}).transform((value) => ({
  ...value,
  amount: value.amount ?? toMajorUnits(value.amountCents),
  merchantNormalized: value.merchantNormalized ?? value.merchant.trim().toLowerCase(),
}));

export const subscriptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  frequency: z.string(),
  category: z.string().optional().default("suscripciones"),
  type: z.string().optional().default("entertainment"),
  nextDate: z.string(),
  active: z.boolean().optional().default(true),
  color: z.string().optional().default("#8b5cf6"),
  icon: z.string().optional().default("sync"),
  amountCents: cents.optional().default(0),
  amount: amountOptional.optional(),
  accountId: z.string().nullable().optional().default(null),
  creditCardId: z.string().nullable().optional().default(null),
  createdAt: z.string().optional().default("1970-01-01T00:00:00.000Z"),
}).transform((value) => ({
  ...value,
  amount: value.amount ?? toMajorUnits(value.amountCents),
}));

export const incomeSchema = z.object({
  id: z.string(),
  name: z.string(),
  frequency: z.string(),
  type: z.string().optional().default("fixed"),
  nextDate: z.string(),
  source: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
  color: z.string().optional().default("#10b981"),
  icon: z.string().optional().default("payments"),
  amountCents: cents.optional().default(0),
  amount: amountOptional.optional(),
  accountId: z.string().nullable().optional().default(null),
  creditCardId: z.string().nullable().optional().default(null),
}).transform((value) => ({
  ...value,
  amount: value.amount ?? toMajorUnits(value.amountCents),
}));

export const accountArraySchema = z.array(accountSchema);
export const transactionArraySchema = z.array(transactionSchema);
export const subscriptionArraySchema = z.array(subscriptionSchema);
export const incomeArraySchema = z.array(incomeSchema);

export const creditCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  bank: z.string().optional().default(""),
  lastFour: z.string().optional().default(""),
  color: z.string().optional().default("#8b5cf6"),
  creditLimitCents: cents.optional().default(0),
  balanceCents: cents.optional().default(0),
  creditLimit: amountOptional.optional().default(0),
  balance: amountOptional.optional().default(0),
  cutDate: z.number().optional().default(1),
  payDate: z.number().optional().default(20),
  apr: z.number().optional().default(0),
  _count: z.object({ transactions: z.number() }).optional(),
}).transform((value) => ({
  ...value,
  creditLimit: value.creditLimit ?? toMajorUnits(value.creditLimitCents),
  balance: value.balance ?? toMajorUnits(value.balanceCents),
}));

export const creditCardArraySchema = z.array(creditCardSchema);

export const goalSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetAmountCents: cents.optional().default(0),
  currentAmountCents: cents.optional().default(0),
  targetAmount: amountOptional.optional().default(0),
  currentAmount: amountOptional.optional().default(0),
  deadline: z.string(),
  priority: z.string().optional().default("medium"),
  color: z.string().optional().default("#10b981"),
}).transform((value) => ({
  ...value,
  targetAmount: value.targetAmount ?? toMajorUnits(value.targetAmountCents),
  currentAmount: value.currentAmount ?? toMajorUnits(value.currentAmountCents),
}));

export const goalArraySchema = z.array(goalSchema);

export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export const chatMessageArraySchema = z.array(chatMessageSchema);
