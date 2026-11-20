import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const out = "artifacts/screenshots";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
await page.screenshot({ path: out + "/01-command-center.png", fullPage: true });
const views = [
  ["chat", "02-chat.png"],
  ["battle", "03-ai-battle.png"],
  ["study", "04-study-mode.png"],
  ["browser", "05-browser.png"],
  ["studio", "06-creative-studio.png"],
  ["cyber", "07-cyber-lab.png"],
  ["connectors", "08-app-connector.png"],
  ["characters", "09-character-studio.png"],
  ["settings", "10-settings.png"]
];
for (const [view, filename] of views) {
  const button = page.locator('[data-view="' + view + '"]').first();
  if (await button.count()) {
    await button.click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: out + "/" + filename, fullPage: true });
  }
}
await browser.close();
console.log("Captured BrokenGPT mobile screenshots.");
