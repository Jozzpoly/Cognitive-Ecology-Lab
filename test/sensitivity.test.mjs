import test from "node:test";
import assert from "node:assert/strict";
import { runSensitivity } from "../src/sensitivity.mjs";

test("browser and CLI use one deterministic, side-effect-free sensitivity evaluator", () => {
  const first = runSensitivity({ seedCount: 8, maxTick: 1200 });
  assert.deepEqual(first, runSensitivity({ seedCount: 8, maxTick: 1200 }));
  assert.equal(first.scenarios.length, 20);
  for (const scenario of first.scenarios) {
    assert.equal(scenario.results.length, 3);
    for (const pair of scenario.results) {
      const d = pair.deliveriesDifference;
      assert.equal(d.positive + d.negative + d.tied, 8);
      assert.equal(pair.runs, 8);
    }
  }
  const abundant = first.scenarios.find(s => s.ecology === "abundant" && s.scenario === "natural");
  const memory = abundant.results.find(r => r.pair === "habit → recall");
  assert.equal(memory.deliveriesDifference.positive, 0);
  assert.equal(memory.deliveriesDifference.negative, 0);
  assert.equal(memory.deliveriesDifference.tied, 8);
  assert.ok(memory.meanConsultationsExtra > 0);
});

test("invalid sensitivity sweep sizes fail closed", () => {
  assert.throws(() => runSensitivity({ seedCount: 0 }));
  assert.throws(() => runSensitivity({ seedCount: 257 }));
  assert.throws(() => runSensitivity({ maxTick: 500 }));
});
