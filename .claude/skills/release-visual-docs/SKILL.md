# release-visual-docs

Automated visual documentation for GitHub releases.
Uses Playwright to capture screenshots of all app pages and attach them to releases.

---

## How it works

1. A Playwright script (`scripts/release-screenshots.ts`) launches a headless Chromium browser
2. Navigates to every app page (9 routes) — no login required
3. Captures 1920×1080 dark-mode screenshots
4. Saves them to `public/releases/vX.Y.Z/`
5. The agent uploads them to the GitHub release with `gh release upload`

---

## When to activate

During the publication flow (AGENTS.md step 8) if the release includes **any** of:

- UI, UX, or layout changes
- New pages, sections, or components
- Color, spacing, typography, or theme updates
- Visual bug fixes
- Design system or styling changes

**Skip** if the release is backend-only or a pure refactor with zero visual impact.

---

## Prerequisites

The app must be running locally before capturing:

```bash
npm run dev
```

Optional:

```powershell
$env:SCREENSHOT_BASE_URL = "http://localhost:3000"  # default
```

No authentication is required — the app has no login gate.

---

## Usage

### Quick run

```bash
npm run screenshots -- v0.3.0
```

### Full automated flow (what the agent does at step 8)

```bash
# 1. Ensure dev server is running
npm run dev

# 2. Capture screenshots
npm run screenshots -- vX.Y.Z

# 3. Upload to GitHub release
gh release upload vX.Y.Z public/releases/vX.Y.Z/*.png

# 4. Edit release notes to embed images
gh release edit vX.Y.Z --notes-file RELEASE_NOTES.md
```

---

## Pages captured

| # | Route | Filename |
|---|-------|----------|
| 1 | `/` | `dashboard_general_default.png` |
| 2 | `/cuentas` | `cuentas_list_default.png` |
| 3 | `/transacciones` | `transacciones_list_default.png` |
| 4 | `/ingresos` | `ingresos_list_default.png` |
| 5 | `/tarjetas` | `tarjetas_list_default.png` |
| 6 | `/suscripciones` | `suscripciones_list_default.png` |
| 7 | `/metas` | `metas_list_default.png` |
| 8 | `/calendario` | `calendario_month_default.png` |
| 9 | `/asistente` | `asistente_chat_default.png` |

---

## Naming convention

```
<page>_<section>_<state>.png
```

---

## Screenshot quality rules

| Rule | Enforced by |
|------|-------------|
| 1920×1080 viewport | Script config `VIEWPORT` |
| Dark mode | Playwright `colorScheme: "dark"` |
| Spanish locale | Playwright `locale: "es-ES"` |
| No toasts | Script hides `[data-sonner-toaster]` and `.Toastify` |
| Network idle | Waits for `networkidle` + 2s extra for animations/charts |

---

## Integration with AGENTS.md

This skill is referenced in **step 8** of the publication flow:

```
8. Tag + Release + Visual docs:
   → Tag and push
   → Ensure dev server is running on port 3000
   → npm run screenshots -- vX.Y.Z
   → gh release create vX.Y.Z --generate-notes
   → gh release upload vX.Y.Z public/releases/vX.Y.Z/*.png
   → Build RELEASE_NOTES.md with embedded image links
   → gh release edit vX.Y.Z --notes-file RELEASE_NOTES.md
   → Delete RELEASE_NOTES.md (temp file)
```

---

## Extending

To add new pages, edit the `PAGES` array in `scripts/release-screenshots.ts`:

```typescript
const PAGES = [
  { name: "dashboard_general_default", path: "/" },
  // Add new pages here:
  { name: "new-page_section_default", path: "/new-page" },
];
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Pages timeout | Ensure `npm run dev` is running on port 3000 |
| Chromium not found | Run `npx playwright install chromium` |
| Screenshots are blank | Check that the page route exists and renders client-side |
| Port conflict | Set `$env:SCREENSHOT_BASE_URL` to the correct port |

---

## Design philosophy

Screenshots are **documentation, not decoration**.

- Reduce ambiguity during code and design reviews
- Make releases scannable in under 60 seconds
- Create a visual history of product evolution
- Improve communication between development and stakeholders
