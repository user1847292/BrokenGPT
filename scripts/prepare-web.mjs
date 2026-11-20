import { mkdir, copyFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const out = resolve(root, "www");
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const file of [
  "index.html",
  "styles.css",
  "app.js",
  "languages.js",
  "manifest.json",
  "file_00000000a7b481f4ac6329d53b247deb.png"
]) {
  await copyFile(resolve(root, file), resolve(out, file));
}
console.log("Prepared BrokenGPT web assets in www/");
