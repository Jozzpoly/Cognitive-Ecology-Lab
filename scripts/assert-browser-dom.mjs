import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const path = process.argv[2];
assert.ok(path, "expected HTML dump path");
const html = await readFile(path, "utf8");
assert.match(html, /<html\b[^>]*data-runtime-ready="true"/i,
  "runtime did not initialize in real browser");
const tick = html.match(/<html\b[^>]*data-sim-tick="(\d+)"/i);
assert.ok(tick && Number(tick[1]) > 0,
  "browser did not advance the world after initialization");
for (const id of ["world-a", "world-b", "deliveries-a", "deliveries-b", "difference"]) {
  assert.ok(html.includes('id="' + id + '"'), "missing browser DOM element " + id);
}
console.log("Browser smoke PASS — initialized; tick=" + tick[1] + "; dual canvas + comparison present");
