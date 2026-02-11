import "dotenv/config";
import { Pool, PoolClient } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida.");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const MAX_MAJOR_UNITS_FOR_INT = 21474836.47; // 2_147_483_647 / 100

type BackfillTask = {
  table: string;
  centsColumn: string;
  legacyColumn: string;
  defaultValue?: number;
};

type BackfillResult = {
  label: string;
  migrated: number;
  nullFilled: number;
};

function ident(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

function qname(table: string, column: string): string {
  return `${ident(table)}.${ident(column)}`;
}

async function columnExists(
  client: PoolClient,
  table: string,
  column: string,
): Promise<boolean> {
  const result = await client.query<{
    exists: boolean;
  }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = $1
          AND column_name = $2
      ) AS exists
    `,
    [table, column],
  );
  return result.rows[0]?.exists === true;
}

async function countRows(
  client: PoolClient,
  query: string,
  params: unknown[] = [],
): Promise<number> {
  const result = await client.query<{ count: string }>(query, params);
  return Number(result.rows[0]?.count ?? 0);
}

async function backfillCents(
  client: PoolClient,
  task: BackfillTask,
): Promise<BackfillResult> {
  const table = ident(task.table);
  const cents = ident(task.centsColumn);
  const legacy = ident(task.legacyColumn);
  const centsRef = qname(task.table, task.centsColumn);
  const legacyRef = qname(task.table, task.legacyColumn);
  const label = `${task.table}.${task.centsColumn}`;

  await client.query(`
    ALTER TABLE ${table}
    ADD COLUMN IF NOT EXISTS ${cents} INTEGER
  `);

  const legacyExists = await columnExists(client, task.table, task.legacyColumn);

  if (legacyExists) {
    const malformedCount = await countRows(
      client,
      `
        SELECT COUNT(*)::text AS count
        FROM ${table}
        WHERE ${centsRef} IS NULL
          AND ${legacyRef} IS NOT NULL
          AND (
            TRIM(${legacyRef}::text) IN ('NaN', 'Infinity', '-Infinity')
            OR ABS(${legacyRef}) > $1
          )
      `,
      [MAX_MAJOR_UNITS_FOR_INT],
    );

    if (malformedCount > 0) {
      throw new Error(
        `Valores inválidos en ${label}: ${malformedCount} fila(s) fuera de rango/NaN/Infinity.`,
      );
    }
  }

  const migratedResult = legacyExists
    ? await client.query(`
        UPDATE ${table}
        SET ${cents} = ROUND(${legacy} * 100)::INTEGER
        WHERE ${cents} IS NULL
          AND ${legacy} IS NOT NULL
      `)
    : { rowCount: 0 };

  if (legacyExists) {
    const mismatchCount = await countRows(
      client,
      `
        SELECT COUNT(*)::text AS count
        FROM ${table}
        WHERE ${centsRef} IS NOT NULL
          AND ${legacyRef} IS NOT NULL
          AND ${centsRef} <> ROUND(${legacyRef} * 100)::INTEGER
      `,
    );

    if (mismatchCount > 0) {
      throw new Error(
        `Inconsistencia detectada en ${label}: ${mismatchCount} fila(s) no coinciden con ${task.legacyColumn}.`,
      );
    }
  } else {
    const nullWithoutLegacy = await countRows(
      client,
      `
        SELECT COUNT(*)::text AS count
        FROM ${table}
        WHERE ${cents} IS NULL
      `,
    );

    if (nullWithoutLegacy > 0) {
      throw new Error(
        `No se puede completar ${label}: falta ${task.legacyColumn} y hay ${nullWithoutLegacy} fila(s) con centavos NULL.`,
      );
    }
  }

  const nullFilledResult = await client.query(`
    UPDATE ${table}
    SET ${cents} = 0
    WHERE ${cents} IS NULL
  `);

  if (task.defaultValue !== undefined) {
    await client.query(`
      ALTER TABLE ${table}
      ALTER COLUMN ${cents} SET DEFAULT ${task.defaultValue}
    `);
  }

  await client.query(`
    ALTER TABLE ${table}
    ALTER COLUMN ${cents} SET NOT NULL
  `);

  return {
    label,
    migrated: migratedResult.rowCount ?? 0,
    nullFilled: nullFilledResult.rowCount ?? 0,
  };
}

async function run() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const results: BackfillResult[] = [];

    results.push(
      await backfillCents(client, {
        table: "accounts",
        centsColumn: "balance_cents",
        legacyColumn: "balance",
        defaultValue: 0,
      }),
    );

    results.push(
      await backfillCents(client, {
        table: "credit_cards",
        centsColumn: "credit_limit_cents",
        legacyColumn: "credit_limit",
      }),
    );

    results.push(
      await backfillCents(client, {
        table: "credit_cards",
        centsColumn: "balance_cents",
        legacyColumn: "balance",
        defaultValue: 0,
      }),
    );

    results.push(
      await backfillCents(client, {
        table: "transactions",
        centsColumn: "amount_cents",
        legacyColumn: "amount",
      }),
    );

    results.push(
      await backfillCents(client, {
        table: "subscriptions",
        centsColumn: "amount_cents",
        legacyColumn: "amount",
      }),
    );

    results.push(
      await backfillCents(client, {
        table: "incomes",
        centsColumn: "amount_cents",
        legacyColumn: "amount",
      }),
    );

    results.push(
      await backfillCents(client, {
        table: "financial_goals",
        centsColumn: "target_amount_cents",
        legacyColumn: "target_amount",
      }),
    );

    results.push(
      await backfillCents(client, {
        table: "financial_goals",
        centsColumn: "current_amount_cents",
        legacyColumn: "current_amount",
        defaultValue: 0,
      }),
    );

    await client.query("COMMIT");

    console.log("Backfill money->cents completado:");
    for (const item of results) {
      console.log(
        `- ${item.label}: ${item.migrated} migradas, ${item.nullFilled} NULL->0`,
      );
    }
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

