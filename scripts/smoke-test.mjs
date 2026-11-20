import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
const pageErrors = [];
const consoleErrors = [];
page.on("pageerror", error => pageErrors.push(error.message));
page.on("console", message => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

try {
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.locator("#chat").waitFor({ state: "visible" });
  assert.equal(await page.locator("#chat").evaluate(node => node.classList.contains("active")), true);

  const views = await page.locator("[data-view]").evaluateAll(nodes =>
    [...new Set(nodes.map(node => node.dataset.view).filter(Boolean))]
  );
  assert.ok(views.length >= 8, "Expected the main navigation views to exist");
  for (const view of views) {
    await page.locator('[data-view="' + view + '"]').first().evaluate(node => node.click());
    assert.equal(
      await page.locator("#" + view).evaluate(node => node.classList.contains("active")),
      true,
      "Navigation failed for view: " + view
    );
  }

  await page.locator('[data-view="cyber"]').first().evaluate(node => node.click());
  assert.ok(await page.locator("#standalone-download-center a[href^='https://']").count() >= 5,
    "Standalone download links are missing");

  await page.locator('[data-view="notes"]').first().evaluate(node => node.click());
  await page.locator("#note-title").fill("Smoke test note");
  await page.locator("#note-body").fill("Local save test");
  await page.locator("#save-note").click();
  assert.ok((await page.locator("#notes-list").innerText()).includes("Smoke test note"),
    "Notes save action did not render the saved note");

  await page.locator('[data-view="toolbox"]').first().evaluate(node => node.click());
  await page.locator("#word-input").fill("one two three");
  assert.ok((await page.locator("#word-count").innerText()).includes("3 words"),
    "Word counter did not update");

  if (pageErrors.length || consoleErrors.length) {
    throw new Error("Browser errors detected. pageerror=" + JSON.stringify(pageErrors) +
      " console=" + JSON.stringify(consoleErrors));
  }

  console.log("BrokenGPT smoke tests passed: navigation, standalone downloads, local notes, word counter, and browser console.");
} finally {
  await browser.close();
}
