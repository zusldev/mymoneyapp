import "dotenv/config";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida.");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Accounts
    await client.query(`
      ALTER TABLE accounts
      ADD COLUMN IF NOT EXISTS balance_cents INTEGER
    `);
    const accountsResult = await client.query(`
      UPDATE accounts
      SET balance_cents = ROUND(balance * 100)::INTEGER
      WHERE balance_cents IS NULL
    `);
    await client.query(`
      UPDATE accounts
      SET balance_cents = 0
      WHERE balance_cents IS NULL
    `);
    await client.query(`
      ALTER TABLE accounts
      ALTER COLUMN balance_cents SET DEFAULT 0,
      ALTER COLUMN balance_cents SET NOT NULL
    `);

    // Credit cards
    await client.query(`
      ALTER TABLE credit_cards
      ADD COLUMN IF NOT EXISTS credit_limit_cents INTEGER,
      ADD COLUMN IF NOT EXISTS balance_cents INTEGER
    `);
    const cardsLimitResult = await client.query(`
      UPDATE credit_cards
      SET credit_limit_cents = ROUND(credit_limit * 100)::INTEGER
      WHERE credit_limit_cents IS NULL
    `);
    const cardsBalanceResult = await client.query(`
      UPDATE credit_cards
      SET balance_cents = ROUND(balance * 100)::INTEGER
      WHERE balance_cents IS NULL
    `);
    await client.query(`
      UPDATE credit_cards
      SET credit_limit_cents = 0
      WHERE credit_limit_cents IS NULL
    `);
    await client.query(`
      UPDATE credit_cards
      SET balance_cents = 0
      WHERE balance_cents IS NULL
    `);
    await client.query(`
      ALTER TABLE credit_cards
      ALTER COLUMN credit_limit_cents SET NOT NULL,
      ALTER COLUMN balance_cents SET DEFAULT 0,
      ALTER COLUMN balance_cents SET NOT NULL
    `);

    // Transactions
    await client.query(`
      ALTER TABLE transactions
      ADD COLUMN IF NOT EXISTS amount_cents INTEGER
    `);
    const txResult = await client.query(`
      UPDATE transactions
      SET amount_cents = ROUND(amount * 100)::INTEGER
      WHERE amount_cents IS NULL
    `);
    await client.query(`
      UPDATE transactions
      SET amount_cents = 0
      WHERE amount_cents IS NULL
    `);
    await client.query(`
      ALTER TABLE transactions
      ALTER COLUMN amount_cents SET NOT NULL
    `);

    // Subscriptions
    await client.query(`
      ALTER TABLE subscriptions
      ADD COLUMN IF NOT EXISTS amount_cents INTEGER
    `);
    const subsResult = await client.query(`
      UPDATE subscriptions
      SET amount_cents = ROUND(amount * 100)::INTEGER
      WHERE amount_cents IS NULL
    `);
    await client.query(`
      UPDATE subscriptions
      SET amount_cents = 0
      WHERE amount_cents IS NULL
    `);
    await client.query(`
      ALTER TABLE subscriptions
      ALTER COLUMN amount_cents SET NOT NULL
    `);

    // Incomes
    await client.query(`
      ALTER TABLE incomes
      ADD COLUMN IF NOT EXISTS amount_cents INTEGER
    `);
    const incomesResult = await client.query(`
      UPDATE incomes
      SET amount_cents = ROUND(amount * 100)::INTEGER
      WHERE amount_cents IS NULL
    `);
    await client.query(`
      UPDATE incomes
      SET amount_cents = 0
      WHERE amount_cents IS NULL
    `);
    await client.query(`
      ALTER TABLE incomes
      ALTER COLUMN amount_cents SET NOT NULL
    `);

    // Goals
    await client.query(`
      ALTER TABLE financial_goals
      ADD COLUMN IF NOT EXISTS target_amount_cents INTEGER,
      ADD COLUMN IF NOT EXISTS current_amount_cents INTEGER
    `);
    const goalsTargetResult = await client.query(`
      UPDATE financial_goals
      SET target_amount_cents = ROUND(target_amount * 100)::INTEGER
      WHERE target_amount_cents IS NULL
    `);
    const goalsCurrentResult = await client.query(`
      UPDATE financial_goals
      SET current_amount_cents = ROUND(current_amount * 100)::INTEGER
      WHERE current_amount_cents IS NULL
    `);
    await client.query(`
      UPDATE financial_goals
      SET target_amount_cents = 0
      WHERE target_amount_cents IS NULL
    `);
    await client.query(`
      UPDATE financial_goals
      SET current_amount_cents = 0
      WHERE current_amount_cents IS NULL
    `);
    await client.query(`
      ALTER TABLE financial_goals
      ALTER COLUMN target_amount_cents SET NOT NULL,
      ALTER COLUMN current_amount_cents SET DEFAULT 0,
      ALTER COLUMN current_amount_cents SET NOT NULL
    `);

    await client.query("COMMIT");

    console.log("Backfill money->cents completado:");
    console.log(`- accounts.balance_cents: ${accountsResult.rowCount} filas migradas`);
    console.log(`- credit_cards.credit_limit_cents: ${cardsLimitResult.rowCount} filas migradas`);
    console.log(`- credit_cards.balance_cents: ${cardsBalanceResult.rowCount} filas migradas`);
    console.log(`- transactions.amount_cents: ${txResult.rowCount} filas migradas`);
    console.log(`- subscriptions.amount_cents: ${subsResult.rowCount} filas migradas`);
    console.log(`- incomes.amount_cents: ${incomesResult.rowCount} filas migradas`);
    console.log(`- financial_goals.target_amount_cents: ${goalsTargetResult.rowCount} filas migradas`);
    console.log(`- financial_goals.current_amount_cents: ${goalsCurrentResult.rowCount} filas migradas`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Error en backfill money->cents:", error);
  process.exit(1);
});

