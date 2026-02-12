# Pull Request

## Summary
- Problem:
- Solution:

## Technical Scope
- Files/modules impacted:
- API/DB schema impact:
- Money handling impact (`*_cents` source of truth):

## Risks
- Risk 1:
- Risk 2:

## Rollback Plan
1. Revert this PR.
2. Revert related env/config changes (if any).
3. Re-run validation after rollback.

## Verification
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- Evidence (logs/screenshots/notes):

## Deployment / Operations
- [ ] No env var changes
- [ ] Env var changes documented
- [ ] No Prisma migration
- [ ] Prisma migration included and validated with `prisma migrate status`

## Checklist
- [ ] No secrets or credentials in diff
- [ ] Critical logic has tests (new or updated)
- [ ] Documentation updated if behavior changed
- [ ] Required checks `lint`, `test`, `build` are green
- [ ] PR is not merged with pending or failed checks

## Issue / Ticket
- Closes #
