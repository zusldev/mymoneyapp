# GitHub Standard

This document defines the official GitHub workflow standard for this project.

## Objectives

- Consistency across contributors  
- Change traceability  
- Production safety  
- High technical readability  

---

## 1) Branching Model (GitFlow)

### Main branches

- `main`: stable production branch  
- `develop`: continuous integration of daily work  

### Working branches

- `feature/<scope>-<short-description>`  
- `hotfix/<scope>-<short-description>`  
- `release/vX.Y.Z`  

### Rules

- Features branch off from `develop` and merge back into `develop`.  
- Hotfixes branch off from `main` and merge back into `main`.  
- Every hotfix merged into `main` must be synchronized back into `develop`.  
- Releases branch off from `develop`, are stabilized, and then merged into `main` (and back into `develop` if applicable).  

---

## 2) Authorization Gate (Mandatory)

Before starting any publishing phase, explicit authorization from the responsible owner is required.

Publishing phase includes:

- `git add`  
- `git commit`  
- `git push`  
- `gh pr create`  
- `gh pr merge`  
- `gh release create`  

Without this authorization, only analysis, local implementation, and local validation are allowed.

---

## 3) Commit Convention

Format: Conventional Commits.

### Allowed types

- `feat`  
- `fix`  
- `hotfix`  
- `refactor`  
- `test`  
- `docs`  
- `chore`  
- `ci`  
- `perf`  

### Examples

- `feat: add strategy filter`  
- `fix: correct profit factor calculation in stats summary`  
- `hotfix: prevent analytics crash due to null toFixed`  

### Rules

- One intention per commit.  
- Clear message, imperative mood, ≤ 72 characters in subject.  
- Do not mix large refactors with urgent fixes in the same commit.  

---

## 4) Pull Request Standard

Every PR must include:

- Summary of the problem and solution  
- Technical scope (files/modules impacted)  
- Risk assessment and rollback plan  
- Test evidence  
- Reference to issue/ticket (if applicable)  

### Minimum checklist

- Lint, tests, and local build passing  
- No secrets or credentials  
- New tests for critical logic or calculation changes  
- Documentation updated when behavior changes  

---

## 5) Merge Policy

### Rules

- Do not merge if checks are failing.  
- Do not merge PRs without sufficient technical description.  
- Avoid direct merges into `main` except managed hotfixes.  

### Recommended strategy

- Feature/hotfix PR: `Squash and merge` or `Merge commit` depending on traceability needs  
- Release PR: `Merge commit` to preserve release context  

---

## 6) Branch Protection (Configure in GitHub)

### For `main`

- Require pull request before merging  
- Require status checks to pass:
  - CI `lint-build`  
  - Required deploy checks (if production environment applies)  
- Restrict direct pushes  
- Require linear history (optional depending on merge strategy)  

### For `develop`

- Require pull request before merging  
- Require CI checks  
- Block force-push for regular contributors  

---

## 7) Quality and Local Validation

Mandatory commands before opening a PR:

- `npm run lint`  
- `npm test`  
- `npm run build`  

If any command cannot be executed, the PR must explain the technical reason.

---

## 8) Release Policy (SemVer)

### Versioning

- `MAJOR`: breaking changes  
- `MINOR`: backward-compatible features  
- `PATCH`: bugfix/hotfix  

### Recommended cadence

- Regular release: weekly or biweekly (`MINOR` / `PATCH`)  
- Critical calculation/risk hotfix: <24h (`PATCH`)  

### Release checklist

- Release/hotfix PR merged into `main`  
- Tag `vX.Y.Z` created  
- Clear release notes:
  - What changed  
  - User impact  
  - Risks and mitigations  
  - Executed validations  

---

## 9) Security and Compliance

- Never commit tokens, secrets, or sensitive data  
- Review diffs for `.env`, logs, screenshots, and exports  
- Use Principle of Least Privilege for GitHub Actions permissions  

---

## 10) Responsibilities

### Change Author

- Implement and validate changes  
- Document impact and risks  
- Respond to review feedback  

### Reviewer

- Verify technical accuracy and risk  
- Confirm test quality  
- Ensure compliance with this standard  
