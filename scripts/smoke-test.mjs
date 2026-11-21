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

  await page.locator('[data-go="notes"]').first().evaluate(node => node.click());
  await page.locator("#note-title").fill("Smoke test note");
  await page.locator("#note-body").fill("Local save test");
  await page.locator("#save-note").click();
  assert.ok((await page.locator("#notes-list").innerText()).includes("Smoke test note"),
    "Notes save action did not render the saved note");

  await page.locator('[data-view="toolbox"]').first().evaluate(node => node.click());
  await page.locator("#word-input").fill("one two three");
  assert.ok((await page.locator("#word-count").innerText()).includes("3 words"),
    "Word counter did not update");

  await page.locator("#offline-calc-input").fill("(12 + 8) * 3");
  await page.locator("#offline-calc-run").click();
  assert.ok((await page.locator("#offline-calc-result").innerText()).includes("60"),
    "Offline calculator failed");

  await page.locator("#offline-password-length").fill("16");
  await page.locator("#offline-password-generate").click();
  const password = await page.locator("#offline-password-result").inputValue();
  assert.equal(password.length, 16, "Password generator returned wrong length");

  await page.locator("#offline-base64-input").fill("Hello");
  await page.locator("#offline-base64-encode").click();
  assert.ok((await page.locator("#offline-base64-status").innerText()).includes("SGVsbG8="),
    "Base64 encoder failed");
  await page.locator("#offline-base64-input").fill("SGVsbG8=");
  await page.locator("#offline-base64-decode").click();
  assert.ok((await page.locator("#offline-base64-status").innerText()).includes("Hello"),
    "Base64 decoder failed");

  await page.locator("#offline-hash-input").fill("abc");
  await page.locator("#offline-hash-run").click();
  assert.equal(
    (await page.locator("#offline-hash-result").inputValue()).trim(),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    "SHA-256 did not match the known test vector"
  );

  if (pageErrors.length || consoleErrors.length) {
    throw new Error("Browser errors detected. pageerror=" + JSON.stringify(pageErrors) +
      " console=" + JSON.stringify(consoleErrors));
  }

  console.log("BrokenGPT smoke tests passed: navigation, standalone downloads, local notes, word counter, offline calculator, password generation, Base64, SHA-256, and browser console.");
} finally {
  await browser.close();
}
