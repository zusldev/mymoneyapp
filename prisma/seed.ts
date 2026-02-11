import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import Decimal from "decimal.js";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const toCents = (value: number) => Math.round(value * 100);
const toMajorFromCents = (cents: number) => new Decimal(cents).div(100).toNumber();

async function seed() {
    console.log("🌱 Seeding database...\n");

    // Clean existing data
    await prisma.chatMessage.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.income.deleteMany();
    await prisma.financialGoal.deleteMany();
    await prisma.creditCard.deleteMany();
    await prisma.account.deleteMany();

    // ─── Accounts ───
    const bbva = await prisma.account.create({
        data: { name: "BBVA Nómina", type: "checking", balanceCents: toCents(28450.75), currency: "MXN", color: "#3b82f6", icon: "landmark" },
    });
    const nu = await prisma.account.create({
        data: { name: "Nu Ahorro", type: "savings", balanceCents: toCents(65000.0), currency: "MXN", color: "#8b5cf6", icon: "piggy-bank" },
    });
    const cash = await prisma.account.create({
        data: { name: "Efectivo", type: "cash", balanceCents: toCents(2300.0), currency: "MXN", color: "#06d6a0", icon: "banknote" },
    });
    console.log("✅ 3 cuentas creadas");

    // ─── Credit Cards ───
    const amexCreditLimitCents = toCents(85000);
    const amexBalanceCents = toCents(12450.3);
    const amexData = {
        name: "AMEX Gold",
        bank: "American Express",
        lastFour: "4821",
        credit_limit: toMajorFromCents(amexCreditLimitCents),
        balance: toMajorFromCents(amexBalanceCents),
        creditLimitCents: amexCreditLimitCents,
        balanceCents: amexBalanceCents,
        cutDate: 15,
        payDate: 5,
        apr: 36.5,
        color: "#f59e0b",
    };
    const amex = await prisma.creditCard.create({
        data: amexData,
    });
    const bbvaCardCreditLimitCents = toCents(120000);
    const bbvaCardBalanceCents = toCents(34200);
    const bbvaCardData = {
        name: "BBVA Platinum",
        bank: "BBVA",
        lastFour: "7392",
        credit_limit: toMajorFromCents(bbvaCardCreditLimitCents),
        balance: toMajorFromCents(bbvaCardBalanceCents),
        creditLimitCents: bbvaCardCreditLimitCents,
        balanceCents: bbvaCardBalanceCents,
        cutDate: 22,
        payDate: 12,
        apr: 28.9,
        color: "#3b82f6",
    };
    const bbvaCard = await prisma.creditCard.create({
        data: bbvaCardData,
    });
    const nuCardCreditLimitCents = toCents(45000);
    const nuCardBalanceCents = toCents(8900.5);
    const nuCardData = {
        name: "Nu Card",
        bank: "Nu",
        lastFour: "1056",
        credit_limit: toMajorFromCents(nuCardCreditLimitCents),
        balance: toMajorFromCents(nuCardBalanceCents),
        creditLimitCents: nuCardCreditLimitCents,
        balanceCents: nuCardBalanceCents,
        cutDate: 1,
        payDate: 20,
        apr: 42,
        color: "#8b5cf6",
    };
    const nuCard = await prisma.creditCard.create({
        data: nuCardData,
    });
    console.log("✅ 3 tarjetas creadas");

    // ─── Transactions (last 60 days) ───
    const now = new Date();
    const txData = [
        // Ingresos
        { amount: 32000, type: "income", merchant: "Empresa XYZ", category: "salario", accountId: bbva.id, daysAgo: 1 },
        { amount: 32000, type: "income", merchant: "Empresa XYZ", category: "salario", accountId: bbva.id, daysAgo: 16 },
        { amount: 5500, type: "income", merchant: "Freelance App", category: "salario", accountId: nu.id, daysAgo: 8 },
        // Comida
        { amount: 285, type: "expense", merchant: "La Casa de Toño", category: "comida", accountId: bbva.id, daysAgo: 0 },
        { amount: 189, type: "expense", merchant: "OXXO", category: "comida", accountId: cash.id, daysAgo: 1 },
        { amount: 520, type: "expense", merchant: "Costco", category: "supermercado", accountId: bbva.id, daysAgo: 2 },
        { amount: 1240, type: "expense", merchant: "Walmart", category: "supermercado", creditCardId: bbvaCard.id, daysAgo: 3 },
        { amount: 345, type: "expense", merchant: "Uber Eats", category: "comida", creditCardId: nuCard.id, daysAgo: 4 },
        { amount: 890, type: "expense", merchant: "Soriana", category: "supermercado", accountId: bbva.id, daysAgo: 5 },
        { amount: 210, type: "expense", merchant: "Starbucks", category: "comida", creditCardId: amex.id, daysAgo: 6 },
        { amount: 425, type: "expense", merchant: "Sushi Roll", category: "comida", creditCardId: amex.id, daysAgo: 8 },
        // Transporte
        { amount: 87, type: "expense", merchant: "Uber", category: "transporte", creditCardId: nuCard.id, daysAgo: 0 },
        { amount: 350, type: "expense", merchant: "Gasolina Shell", category: "transporte", accountId: bbva.id, daysAgo: 3 },
        { amount: 125, type: "expense", merchant: "Uber", category: "transporte", creditCardId: nuCard.id, daysAgo: 7 },
        { amount: 380, type: "expense", merchant: "Gasolina Pemex", category: "transporte", accountId: bbva.id, daysAgo: 10 },
        // Entretenimiento
        { amount: 299, type: "expense", merchant: "Cinépolis", category: "entretenimiento", creditCardId: amex.id, daysAgo: 5 },
        { amount: 1200, type: "expense", merchant: "Ticketmaster", category: "entretenimiento", creditCardId: bbvaCard.id, daysAgo: 12 },
        // Salud
        { amount: 850, type: "expense", merchant: "Farmacia Guadalajara", category: "salud", accountId: bbva.id, daysAgo: 9 },
        { amount: 1500, type: "expense", merchant: "Dr. García Consulta", category: "salud", creditCardId: bbvaCard.id, daysAgo: 15 },
        // Servicios
        { amount: 1100, type: "expense", merchant: "CFE Luz", category: "servicios", accountId: bbva.id, daysAgo: 11 },
        { amount: 450, type: "expense", merchant: "Izzi Internet", category: "servicios", accountId: bbva.id, daysAgo: 13 },
        { amount: 699, type: "expense", merchant: "Telcel", category: "servicios", accountId: bbva.id, daysAgo: 14 },
        // Compras
        { amount: 3500, type: "expense", merchant: "Amazon", category: "compras", creditCardId: bbvaCard.id, daysAgo: 7 },
        { amount: 1899, type: "expense", merchant: "Liverpool", category: "compras", creditCardId: amex.id, daysAgo: 18 },
        { amount: 599, type: "expense", merchant: "Mercado Libre", category: "compras", creditCardId: nuCard.id, daysAgo: 20 },
        // Educación
        { amount: 2800, type: "expense", merchant: "Platzi", category: "educacion", creditCardId: bbvaCard.id, daysAgo: 25 },
        // Hogar
        { amount: 12500, type: "expense", merchant: "Renta Departamento", category: "hogar", accountId: bbva.id, daysAgo: 1 },
        { amount: 2200, type: "expense", merchant: "Gas Natural", category: "hogar", accountId: bbva.id, daysAgo: 16 },
        // Viajes
        { amount: 4500, type: "expense", merchant: "Volaris", category: "viajes", creditCardId: amex.id, daysAgo: 30 },
        // Fees
        { amount: 580, type: "expense", merchant: "Comisión Bancaria BBVA", category: "otros", accountId: bbva.id, daysAgo: 22, isFee: true },
        // Older transactions
        { amount: 32000, type: "income", merchant: "Empresa XYZ", category: "salario", accountId: bbva.id, daysAgo: 31 },
        { amount: 32000, type: "income", merchant: "Empresa XYZ", category: "salario", accountId: bbva.id, daysAgo: 46 },
        { amount: 1850, type: "expense", merchant: "Walmart", category: "supermercado", creditCardId: bbvaCard.id, daysAgo: 35 },
        { amount: 12500, type: "expense", merchant: "Renta Departamento", category: "hogar", accountId: bbva.id, daysAgo: 31 },
        { amount: 560, type: "expense", merchant: "Uber Eats", category: "comida", creditCardId: nuCard.id, daysAgo: 38 },
        { amount: 290, type: "expense", merchant: "OXXO", category: "comida", accountId: cash.id, daysAgo: 40 },
    ];

    for (const tx of txData) {
        const date = new Date(now);
        date.setDate(date.getDate() - tx.daysAgo);
        await prisma.transaction.create({
            data: {
                amountCents: toCents(tx.amount), type: tx.type, date,
                merchant: tx.merchant, category: tx.category,
                accountId: tx.accountId || null,
                creditCardId: tx.creditCardId || null,
                isFeeOrInterest: (tx as { isFee?: boolean }).isFee || false,
            },
        });
    }
    console.log(`✅ ${txData.length} transacciones creadas`);

    // ─── Subscriptions ───
    const subData = [
        { name: "Netflix", amount: 299, frequency: "monthly", category: "suscripciones", color: "#e50914", daysUntil: 12 },
        { name: "Spotify", amount: 189, frequency: "monthly", category: "suscripciones", color: "#1db954", daysUntil: 8 },
        { name: "YouTube Premium", amount: 179, frequency: "monthly", category: "suscripciones", color: "#ff0000", daysUntil: 15 },
        { name: "Amazon Prime", amount: 99, frequency: "monthly", category: "compras", color: "#ff9900", daysUntil: 22 },
        { name: "ChatGPT Plus", amount: 499, frequency: "monthly", category: "educacion", color: "#10a37f", daysUntil: 5 },
        { name: "iCloud 200GB", amount: 49, frequency: "monthly", category: "servicios", color: "#999999", daysUntil: 18 },
        { name: "Gym SmartFit", amount: 699, frequency: "monthly", category: "salud", color: "#ff6b35", daysUntil: 1 },
    ];
    for (const sub of subData) {
        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + sub.daysUntil);
        await prisma.subscription.create({
            data: { name: sub.name, amountCents: toCents(sub.amount), frequency: sub.frequency, category: sub.category, color: sub.color, nextDate, active: true },
        });
    }
    console.log(`✅ ${subData.length} suscripciones creadas`);

    // ─── Incomes ───
    await prisma.income.create({
        data: { name: "Salario Empresa XYZ", amountCents: toCents(32000), frequency: "biweekly", source: "Empresa XYZ S.A. de C.V.", nextDate: new Date(now.getFullYear(), now.getMonth(), 15), active: true },
    });
    await prisma.income.create({
        data: { name: "Freelance Desarrollo", amountCents: toCents(5500), frequency: "monthly", source: "Clientes independientes", nextDate: new Date(now.getFullYear(), now.getMonth() + 1, 1), active: true },
    });
    console.log("✅ 2 ingresos creados");

    // ─── Financial Goals ───
    await prisma.financialGoal.create({
        data: { name: "Fondo de Emergencia", targetAmountCents: toCents(100000), currentAmountCents: toCents(65000), deadline: new Date(2026, 11, 31), priority: "high", color: "#06d6a0", icon: "shield" },
    });
    await prisma.financialGoal.create({
        data: { name: "Viaje a Europa", targetAmountCents: toCents(80000), currentAmountCents: toCents(22000), deadline: new Date(2026, 7, 15), priority: "medium", color: "#3b82f6", icon: "plane" },
    });
    await prisma.financialGoal.create({
        data: { name: "MacBook Pro", targetAmountCents: toCents(45000), currentAmountCents: toCents(12500), deadline: new Date(2026, 5, 1), priority: "low", color: "#8b5cf6", icon: "laptop" },
    });
    console.log("✅ 3 metas creadas");

    console.log("\n🎉 ¡Seed completado! La app ya tiene datos de ejemplo.");
}

seed()
    .then(() => prisma.$disconnect())
    .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
