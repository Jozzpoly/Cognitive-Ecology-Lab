import test from "node:test";
import assert from "node:assert/strict";
import { createWorld, createExperiment, privateView, recallAdvice, advance, intervene, summary, POLICIES } from "../src/core.mjs";

test("same seed, same two policies and interventions -> exact replay", () => {
  const run = () => {
    const e = createExperiment({ seed: 77, left: "cooldown", right: "recall" });
    advance(e, 140);
    intervene(e, "west", "drain");
    advance(e, 300);
    intervene(e, "east", "fill");
    advance(e, 70);
    return e;
  };
  assert.deepEqual(run(), run());
});

test("identical policies remain identical without branch-specific interventions", () => {
  for (const policy of POLICIES) {
    const e = createExperiment({ seed: 9, left: policy, right: policy });
    advance(e, 420);
    assert.equal(e.firstDivergenceTick, null);
    assert.deepEqual(e.left, e.right);
  }
});

test("private state does not expose unseen stocks, restock schedule or researcher intervention", () => {
  const e = createExperiment({ seed: 4 });
  const before = privateView(e.left);
  intervene(e, "east", "drain");
  assert.deepEqual(privateView(e.left), before);
  assert.equal(JSON.stringify(privateView(e.left)).includes("stock"), false);
  assert.equal(JSON.stringify(privateView(e.left)).includes("nextRestock"), false);
});

test("separate recall advice uses only received episodes, not world truth", () => {
  const world = createWorld(42, "recall");
  const view = privateView(world);
  const first = recallAdvice(view);
  world.stations.west.stock = 3;
  world.stations.east.stock = 0;
  assert.deepEqual(recallAdvice(view), first);
  assert.deepEqual(recallAdvice(privateView(world)), first);
});

test("advisor activation is an explicit difference, not a renamed baseline", () => {
  const e = createExperiment({ seed: 1, left: "habit", right: "recall" });
  advance(e, 230);
  assert.equal(e.left.actor.consultations, 0);
  assert.ok(e.right.actor.consultations > 0);
  assert.ok(e.firstDivergenceTick !== null, "should discover an actual divergence");
  assert.ok(e.right.actor.decisions.some(d => d.support), "recall must consult lived evidence");
});

test("toy world stays finite and remains continuously active", () => {
  const e = createExperiment({ seed: 918, left: "habit", right: "recall" });
  advance(e, 10000);
  for (const w of [e.left, e.right]) {
    assert.ok(Number.isFinite(w.actor.x) && Number.isFinite(w.actor.y));
    assert.ok(w.actor.deliveries > 0);
    assert.ok(w.events.some(x => x.kind === "world"));
    assert.ok(w.actor.episodes.length <= 32);
    assert.ok(w.actor.decisions.length <= 80);
    assert.ok(summary(w).distance > 0);
  }
});

test("invalid intervention and policy fail closed", () => {
  assert.throws(() => createWorld(1, "unknown"));
  const e = createExperiment();
  assert.throws(() => intervene(e, "unknown", "drain"));
  assert.throws(() => intervene(e, "west", "other"));
});
