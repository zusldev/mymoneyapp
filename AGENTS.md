# AGENTS

Repository-level operating rules for coding agents.

## Core principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **Verify Before Done**: Never mark a task complete without proving it works.

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

## Verification protocol

After making changes, always verify before reporting completion:

1. Run `npm run lint` — fix any errors before continuing.
2. Run `npm test` — if tests fail, fix them. If new behavior was added, consider adding tests.
3. Run `npm run build` — catch type errors and build issues.
4. Ask yourself: "Would a staff engineer approve this?"

Do not skip verification. If a gate cannot run, explain why.

## Autonomous bug fixing

When the user reports a bug:

1. Go directly to logs, errors, test failures — don't ask for hand-holding.
2. Reproduce or locate the issue first.
3. Fix the root cause, not the symptom.
4. Run verification protocol after the fix.
5. Zero context switching required from the user.

## Self-improvement loop

After ANY correction from the user:

1. Open or create `tasks/lessons.md`.
2. Add the pattern: what went wrong, why, and the rule to prevent it.
3. Review lessons at the start of each session to avoid repeat mistakes.

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
8. **Tag + Release + Visual docs**: `git checkout main` → `git pull` → `git tag vX.Y.Z` → `git push origin vX.Y.Z` → `gh release create vX.Y.Z --generate-notes`. If the release includes UI changes, run `npm run screenshots -- vX.Y.Z` (requires dev server running + `SCREENSHOT_EMAIL` / `SCREENSHOT_PASSWORD` env vars), then `gh release upload vX.Y.Z public/releases/vX.Y.Z/*.png` and edit release notes to embed images. See `.claude/skills/release-visual-docs/SKILL.md` for full details.
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
