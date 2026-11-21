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
  assert.equal(pageErrors.length, 0, "JavaScript runtime errors on initial load: " + JSON.stringify(pageErrors));

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

  await page.locator("#prompt").fill("send icon test");
  assert.equal(await page.locator("#send-message").getAttribute("aria-label"), "Send message", "Composer switches from voice to send icon while typing");
  assert.ok(await page.locator("#send-message").evaluate(node => node.classList.contains("send-mode-button")), "Send button styling state was not updated");
  await page.locator("#prompt").fill("");

  await page.locator("#prompt").fill("local history smoke conversation");
  await page.locator("#send-message").click();
  assert.ok((await page.locator("#messages").innerText()).includes("local history smoke conversation"), "Composer did not display the submitted user message");
  await page.locator('[data-view="history"]').first().evaluate(node => node.click());
  assert.ok((await page.locator("#history-list").innerText()).includes("local history smoke conversation"), "Local chat history did not save the submitted conversation");
  await page.locator("#history-list button").first().click();
  assert.ok((await page.locator("#messages").innerText()).includes("local history smoke conversation"), "History Open conversation did not restore the saved transcript");

  await page.locator('[data-view="tasks"]').first().evaluate(node => node.click());
  await page.locator("#task-title").fill("Smoke test task tracker");
  await page.locator("#task-add").click();
  assert.ok((await page.locator("#task-list").innerText()).includes("Smoke test task tracker"), "Task was not added; input="+await page.locator("#task-title").inputValue()+" status="+await page.locator("#task-create-status").innerText()+" list="+await page.locator("#task-list").innerText());
  assert.ok((await page.locator("#task-create-status").innerText()).includes("has not been executed"), "Task tracker overstated execution status");
  await page.locator("[data-task-complete]").first().click();
  assert.ok((await page.locator("#task-list").innerText()).includes("completed"), "Task completion failed");
  await page.reload({ waitUntil: "networkidle" });
  await page.locator('[data-view="tasks"]').first().evaluate(node => node.click());
  assert.ok((await page.locator("#task-list").innerText()).includes("Smoke test task tracker"), "Task did not persist");
  await page.locator("[data-task-remove]").first().click();

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

  await page.locator('[data-view="settings"]').first().evaluate(node => node.click());
  await page.locator('[data-category="Memory"]').click();
  await page.locator("#memory-note").fill("Smoke test memory preference");
  await page.locator("#memory-save").click();
  assert.ok((await page.locator("#memory-list").innerText()).includes("Smoke test memory preference"), "Memory note save and reload failed");
  assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem("brokengpt-memory-v1")||"[]").includes("Smoke test memory preference")), "Memory was not stored locally");
  await page.locator("#welcome-position").evaluate(node => {
    node.value = "-6";
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#welcome-size").evaluate(node => {
    node.value = "36";
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#save-appearance").click();
  const welcomePrefs = await page.evaluate(() => JSON.parse(localStorage.getItem("brokengpt-prefs")));
  assert.equal(welcomePrefs.welcomeY, -6, "Welcome position was not saved");
  assert.equal(welcomePrefs.welcomeSize, 36, "Welcome size was not saved");
  assert.ok((await page.locator("#chat .hero").evaluate(node => node.style.getPropertyValue("--welcome-y"))).includes("-6vh"),
    "Welcome heading did not apply vertical position");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("#welcome-position").inputValue(), "-6",
    "Welcome position did not persist after reload");
  assert.equal(await page.locator("#welcome-size").inputValue(), "36",
    "Welcome size did not persist after reload");

  const voicePage = await browser.newPage({ viewport: { width: 412, height: 915 } });
  await voicePage.addInitScript(() => {
    window.__speechStartCalls = 0;
    window.BrokenGPTNativeSpeechRecognition = {
      available: async () => ({ available: true }),
      checkPermissions: async () => ({ speechRecognition: "granted" }),
      requestPermissions: async () => ({ speechRecognition: "granted" }),
      start: async () => {
        window.__speechStartCalls++;
        return { matches: ["Native voice test"] };
      },
      stop: async () => {}
    };
  });
  await voicePage.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await voicePage.locator("#voice-input").click();
  await voicePage.waitForFunction(() => document.querySelector("#prompt").value === "Native voice test");
  await voicePage.locator("#prompt").fill("");
  await voicePage.locator("#send-message").click();
  await voicePage.waitForFunction(() => document.querySelector("#messages").innerText.includes("Native voice test"));
  assert.ok((await voicePage.evaluate(() => window.__speechStartCalls)) >= 2,
    "Native speech recognition was not used for one-shot and conversation voice input");
  await voicePage.locator("#send-message").click();
  await voicePage.close();

  if (pageErrors.length || consoleErrors.length) {
    throw new Error("Browser errors detected. pageerror=" + JSON.stringify(pageErrors) +
      " console=" + JSON.stringify(consoleErrors));
  }

  console.log("BrokenGPT smoke tests passed: navigation, standalone downloads, local notes, word counter, offline calculator, password generation, Base64, SHA-256, welcome heading position/size persistence, and browser console.");
} finally {
  await browser.close();
}
