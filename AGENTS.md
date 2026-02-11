# AGENTS

Repository-level operating rules for coding agents.

## Core principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **Verify Before Done**: Never mark a task complete without proving it works.

## Prisma Migration Safety

- Never delete `prisma/migrations` in a project with existing data.
- Never run `prisma migrate reset` unless explicitly approved and data loss is acceptable.
- Never use `prisma db push` in production.
- If migrations history is lost but DB contains data:
  1. Generate a baseline using `prisma migrate diff --from-empty --to-schema`.
  2. Mark it applied with `prisma migrate resolve --applied`.
- Always verify `prisma migrate status` before and after changes.
- Production uses `prisma migrate deploy`, never `migrate dev`.


## Financial safety rules (non-negotiable)

- All monetary values must use `*_cents` as the single source of truth.
- Floating-point arithmetic is forbidden for money.
- Decimal.js must be used for:
  - divisions
  - percentages
  - ratio calculations
- UI must format money only at render time.
- Never mix `amount` and `amountCents`.
- All new financial fields must follow the cents convention.
- Any deviation must be justified explicitly.


## Efficiency rules (save tokens and requests)

1. **Read big, write once**: Read 100+ lines at a time. Never read the same file twice in one turn.
2. **Batch edits**: Use multi-replace for independent edits. One tool call > five sequential ones.
3. **Chain terminal commands**: `npm run lint ; npm test ; npm run build` in one call, not three.
4. **Research before acting**: Gather ALL necessary context first (parallel reads/searches), then implement. Avoid trial-and-error loops.
5. **Subagents for exploration**: Offload research, file discovery, and analysis to subagents — they don't consume the main context.
6. **Concise responses**: Don't re-explain what the user already saw. Confirm completion in 1-2 sentences. Save prose for complex decisions.
7. **Smart searching**: Use regex alternation (`word1|word2|word3`) in grep instead of multiple searches.
8. **One-shot verification**: Run all quality gates in a single chained command, interpret the combined output.
9. **Compute cost awareness**: Don't run heavy commands (build, test) if only docs, comments, or non-code files changed. Prefer static reasoning when possible.
10. **Justified rule breaking**: Rules may be violated if a clear justification is stated and it reduces total cost or risk.

## Regression prevention protocol

Before modifying any file:

1. Identify related components, shared types, and dependent logic.
2. Check for:
   - money calculations
   - shared types from lib/types
   - API schemas
   - section identity system
3. Confirm the change does not:
   - break cents consistency
   - reintroduce float math
   - duplicate shared constants
   - reintroduce layout repetition
4. Prefer minimal diff over wide refactor.

Never assume isolated change safety.


## Verification protocol

After making changes, always verify before reporting completion:

1. Run `npm run lint` — fix any errors before continuing.
2. Run `npm test` — if tests fail, fix them. If new behavior was added, consider adding tests.
3. Run `npm run build` — catch type errors and build issues.
4. Ask yourself: "Would a staff engineer approve this?"
5. Final mental checklist:
   - Is money handling still consistent?
   - Are shared types respected?
   - Does mobile Safari remain smooth?
   - Did I accidentally duplicate logic?
   - Would a staff engineer approve this?


Do not skip verification. If a gate cannot run, explain why.

## Autonomous bug fixing

When the user reports a bug:

1. Go directly to logs, errors, test failures — don't ask for hand-holding.
2. Reproduce or locate the issue first.
3. Fix the root cause, not the symptom.
4. Run verification protocol after the fix.
5. Zero context switching required from the user.

## Self-improvement loop (systemic)

After ANY correction from the user OR detection of a bug:

1. Identify the true root cause (not the surface symptom).
2. Classify the error:
   - Logic
   - Financial
   - UI/UX
   - Architecture
   - Performance
   - Process
3. Add entry in `tasks/lessons.md`.
4. If the error was systemic:
   - Update AGENTS with a preventive rule.
5. Review `tasks/lessons.md` at the start of each session.

The same class of mistake must never repeat twice.



Format:

```markdown
## Lessons

### YYYY-MM-DD — Short description
- **What happened**: ...
- **Root cause**: ...
- **Rule**: ...
```

## Mandatory authorization gate

Before starting publication phase, ask the user for explicit approval.

Publication phase includes:

- `git add`
- `git commit`
- `git push`
- `gh pr create`
- `gh pr merge`
- `gh release create`

Do not execute any of these commands without explicit user authorization in the current request context.

## Branching policy

- `feature/*` from `develop` -> PR to `develop`
- `hotfix/*` from `main` -> PR to `main` and sync back to `develop`
- `release/*` from `develop` -> PR to `main`

## Full publication flow (after authorization)

Once the user authorizes, execute the complete flow without stopping:

1. **Quality gates**: `npm run lint`, `npm test`, `npm run build`. Fix any failures before continuing.
2. **Feature branch**: `git stash` → `git checkout develop` → `git pull` → `git checkout -b feature/<name>` → `git stash pop`.
3. **Commits**: Stage and commit by intention (docs, components, refactor, feat). Use Conventional Commits.
4. **Push + PR to develop**: `git push -u origin feature/<name>` → `gh pr create --base develop`.
5. **Merge to develop**: `gh pr merge <number> --squash --delete-branch` (or `--merge` if trazability needed). Wait for checks; fix if they fail.
6. **Release PR to main**: `git checkout develop` → `git pull` → `git checkout -b release/vX.Y.Z` → `git push -u origin release/vX.Y.Z` → `gh pr create --base main`.
7. **Merge to main**: `gh pr merge <number> --merge --delete-branch`. Wait for checks; fix if they fail.
8. **Tag + Release + Visual docs**: `git checkout main` → `git pull` → `git tag vX.Y.Z` → `git push origin vX.Y.Z` → `gh release create vX.Y.Z --generate-notes`. If the release includes UI changes, ensure dev server is running (`npm run dev`), then run `npm run screenshots -- vX.Y.Z`, upload with `gh release upload vX.Y.Z public/releases/vX.Y.Z/*.png`, build a `RELEASE_NOTES.md` with embedded image links, run `gh release edit vX.Y.Z --notes-file RELEASE_NOTES.md`, and delete the temp file. See `.claude/skills/release-visual-docs/SKILL.md` for full details.
9. **Sync develop**: `git checkout develop` → `git pull` → `git merge main` → `git push origin develop`.
10. **Ready state**: Leave on `develop` branch with clean working tree, ready for next work.

If any step fails, fix the issue and retry before moving to the next step.

## Quality gates before PR

- `npm run lint`
- `npm test`
- `npm run build`

If a gate cannot run, report why in PR description.

## Commit message style

Use Conventional Commits:

- `feat: ...`
- `fix: ...`
- `hotfix: ...`
- `refactor: ...`
- `test: ...`
- `docs: ...`
- `chore: ...`
- `ci: ...`
- `perf: ...`


## Performance guardrail

- Avoid stacking multiple heavy backdrop-filter layers.
- Blur must be reduced on mobile when performance degrades.
- Prefer transform/opacity animations over layout-affecting properties.
- Avoid re-renders caused by unstable object/array props.
- Memoize only when it reduces measurable re-renders.
- Do not introduce performance optimizations without evidence.

Performance > visual excess.

## Section identity system (design consistency)

Each section must differentiate in at least 3 of:
- dominant color
- layout structure
- animation style
- visual density
- emotional tone

Avoid repeating dashboard-style grids across sections.
Liquid Glass may be dominant but must not erase section identity.

If two sections feel visually similar, refactor before proceeding.
