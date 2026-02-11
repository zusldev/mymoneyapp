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
