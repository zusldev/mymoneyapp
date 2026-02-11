## Lessons

### 2026-02-10 — Prisma 7 broke all API routes silently
- **What happened**: After upgrading to Prisma 7.3.0, `new PrismaClient()` without an adapter threw `PrismaClientInitializationError`. The try/catch in `prisma.ts` swallowed the error and replaced the client with a proxy that returned nothing. All pages showed empty data.
- **Root cause**: Prisma 7 removed `datasourceUrl` from the schema and constructor. Runtime connections now require `@prisma/adapter-pg` with a `pg.Pool` instance, or `accelerateUrl`.
- **Rule**: When upgrading Prisma major versions, always verify the PrismaClient constructor API. Never silently catch Prisma init errors without logging them prominently. Test at least one API endpoint after any Prisma change.

### 2026-02-11 — Money schema migration left DB and API out of sync
- **What happened**: The app was migrated to `*_cents` fields in Prisma/client code, but the database had not been backfilled yet. Runtime Prisma queries failed with `P2022` (column does not exist), and several API routes returned fallback empty arrays/objects, making the UI look like “no data” instead of showing an error.
- **Root cause**: Schema/code migration was validated with lint/test/build but not with a live DB query against the actual environment. Also, API error handling used silent fallbacks that masked production data failures.
- **Rule**: After any Prisma schema field rename/addition, always run DB migration/backfill before considering the task complete, then verify with a direct Prisma query (`count/findMany`) against the real DB. Never return silent data fallbacks (`[]`/fake objects) on API DB exceptions; return explicit `500` errors with human-readable messages.

### 2026-02-11 — Date recurrence logic was non-deterministic across timezones
- **What happened**: Date tests for monthly/yearly and next occurrence failed by one day (`2027-01-30` vs `2027-01-31`, etc.).
- **Root cause**: Recurrence math used local-time `Date` operations (`getDate/setDate`) instead of UTC-safe normalization, causing timezone drift.
- **Rule**: For financial recurrence logic, always normalize to UTC day boundaries and use UTC date arithmetic in shared helpers.

### 2026-02-11 — Contract migration caused cascading TypeScript breakage in UI
- **What happened**: After moving to cents-first contracts, multiple pages broke because required UI fields (`amount`, `balance`, `merchantNormalized`, `accountId`, `createdAt`) were optional or missing in parsed API payloads.
- **Root cause**: API response schemas allowed optional fields without strong normalization layer, while UI types expected required values.
- **Rule**: During contract migrations, enforce canonical defaults at schema boundaries (Zod `transform/default`) so UI state always receives fully-shaped objects.

### 2026-02-11 — Tooling drift during test setup increased rework
- **What happened**: Tests were initially implemented with Node's test runner, then migrated to Vitest later to match project requirements.
- **Root cause**: Required test stack from task spec was not locked in before implementation.
- **Rule**: Confirm and set the required test runner/framework first (scripts + dependencies) before writing tests to avoid avoidable rewrites.

### 2026-02-11 — PowerShell escaping produced false-negative diagnostics
- **What happened**: A DB diagnostic command failed with syntax error because `prisma.$disconnect()` was interpreted incorrectly by PowerShell.
- **Root cause**: Missing escape for `$` in inline `node -e` command under `pwsh`.
- **Rule**: In PowerShell one-liners, escape `$` in JavaScript snippets (e.g., `prisma.`$disconnect()`) to avoid misleading command failures.

### 2026-02-11 — Legacy NOT NULL mirror columns broke cents-only writes
- **What happened**: Creating incomes/subscriptions/transactions failed with Prisma `P2011` because DB columns `amount` were still `NOT NULL` while app writes only `amount_cents`.
- **Root cause**: Money migration backfilled cents but left legacy major-unit columns with restrictive constraints; schema and DB were not validated together at create-time.
- **Rule**: During cents migrations, legacy mirror columns must either be made nullable or be deterministically populated in every write path before switching production writes to `*_cents` only.

### 2026-02-11 — Prisma baseline drift after deleting migrations

- **What happened**: Deleted migrations folder while database already contained data. Prisma detected drift and attempted reset.
- **Root cause**: Migration history did not match existing database state.
- **Rule**: Never delete migrations in a live project. If history is lost, create a baseline using `prisma migrate diff` and mark it applied with `prisma migrate resolve`.

### 2026-02-11 — Credit card legacy mirror field broke deploy build
- **What happened**: `next build` failed in `app/api/credit-cards/route.ts` because Prisma expected legacy `credit_limit` while the create payload only sent `creditLimitCents`.
- **Root cause**: Legacy non-cents mirror field remained required in Prisma schema, but create/update/seed paths were not consistently writing it. Local Prisma client artifacts were also out of sync with schema in this environment.
- **Rule**: If a legacy mirror column is still required, populate it deterministically from `*_cents` in every write path (API + seed) until the DB/schema migration fully removes or relaxes that requirement.

### 2026-02-11 — No CI checks allowed broken deploys to be merged
- **What happened**: PRs were merged without automated lint/test/build checks, and a deploy-breaking TypeScript error reached `master`.
- **Root cause**: The repository had no `.github/workflows` pipeline and no enforced required status checks.
- **Rule**: Keep a mandatory CI workflow with required checks (`lint`, `test`, `build`) on PRs to `develop` and `master`, and never merge while any check is pending/failing.

### 2026-02-11 — Legacy mirror fix must be applied model-wide, not endpoint-wise
- **What happened**: After fixing `credit_cards`, CI still failed in `app/api/goals/route.ts` because `financial_goals.target_amount` remained required while writes only sent `targetAmountCents`.
- **Root cause**: The legacy-mirror mitigation was applied to one model, but not across all models that still expose required legacy major-unit columns.
- **Rule**: When legacy major-unit columns are still required, audit and patch all create/update/seed paths for every affected model in the same change set.

### 2026-02-11 — Production recovered from auth error but still failed due pool saturation
- **What happened**: After correcting malformed `DATABASE_URL`, production APIs still returned 500 with `MaxClientsInSessionMode`.
- **Root cause**: Per-instance `pg.Pool` size was too high for Vercel serverless concurrency against Supabase Session Pooler limits.
- **Rule**: In serverless production, keep Prisma adapter `pg.Pool` tiny by default (`max=1`) and make it configurable via env for controlled scaling.
