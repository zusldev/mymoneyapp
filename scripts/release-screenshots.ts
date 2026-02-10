/**
 * release-screenshots.ts
 *
 * Captures 1920×1080 dark-mode screenshots of every dashboard page
 * and saves them to public/releases/vX.Y.Z/
 *
 * Usage:
 *   npx tsx scripts/release-screenshots.ts v0.3.0
 */

import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";

const VIEWPORT = { width: 1920, height: 1080 };

const PAGES = [
  { name: "dashboard_general_default", path: "/" },
  { name: "cuentas_list_default", path: "/cuentas" },
  { name: "transacciones_list_default", path: "/transacciones" },
  { name: "ingresos_list_default", path: "/ingresos" },
  { name: "tarjetas_list_default", path: "/tarjetas" },
  { name: "suscripciones_list_default", path: "/suscripciones" },
  { name: "metas_list_default", path: "/metas" },
  { name: "calendario_month_default", path: "/calendario" },
  { name: "asistente_chat_default", path: "/asistente" },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const version = process.argv[2];
  if (!version) {
    console.error("Usage: npx tsx scripts/release-screenshots.ts <version>");
    console.error("Example: npx tsx scripts/release-screenshots.ts v0.3.0");
    process.exit(1);
  }

  const outDir = path.resolve("public", "releases", version);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n📸 Capturing screenshots for ${version}`);
  console.log(`   Base URL : ${BASE_URL}`);
  console.log(`   Output   : ${outDir}`);
  console.log(`   Pages    : ${PAGES.length}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: "dark",
    locale: "es-ES",
  });

  const page = await context.newPage();

  for (const entry of PAGES) {
    const url = `${BASE_URL}${entry.path}`;
    console.log(`  → ${entry.name} (${url})`);

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

      // Hide any toast notifications
      await page.evaluate(() => {
        document
          .querySelectorAll("[data-sonner-toaster], .Toastify")
          .forEach((el) => ((el as HTMLElement).style.display = "none"));
      });

      // Extra settle time for animations / charts
      await page.waitForTimeout(2000);

      const filePath = path.join(outDir, `${entry.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`    ✓ saved`);
    } catch (err) {
      console.error(`    ✗ FAILED: ${(err as Error).message}`);
    }
  }

  await browser.close();
  console.log(`\n✅ Done — ${PAGES.length} screenshots saved to ${outDir}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
