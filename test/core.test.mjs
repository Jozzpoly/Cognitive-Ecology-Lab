import test from "node:test";
import assert from "node:assert/strict";
import { createWorld, createExperiment, privateView, recallAdvice, advance, intervene, summary, POLICIES, ECOLOGIES } from "../src/core.mjs";

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

test("ecology changes hidden stocks without affecting initial actor-private input", () => {
  const views = ECOLOGIES.map(ecology => privateView(createWorld(10, "recall", ecology)));
  for (const view of views.slice(1)) assert.deepEqual(view, views[0]);
  assert.throws(() => createWorld(10, "habit", "unsupported"));
});

test("abundant world makes memory consultations causally redundant", () => {
  for (const seed of [0, 1, 17, 91]) {
    const e = createExperiment({ seed, left: "habit", right: "recall", ecology: "abundant" });
    advance(e, 1200);
    assert.equal(e.firstDivergenceTick, null);
    assert.equal(e.left.actor.deliveries, e.right.actor.deliveries);
    assert.equal(e.left.actor.emptyTrips, 0);
    assert.equal(e.right.actor.emptyTrips, 0);
    assert.ok(e.right.actor.consultations > 0);
  }
});

test("actor-private view cannot be mutated to rewrite world or episode history", () => {
  const e = createExperiment({ seed: 9, left: "habit", right: "recall" });
  advance(e, 90);
  const source = e.left;
  assert.ok(source.actor.episodes.length > 0, "required a witnessed visit");
  const snapshot = privateView(source);
  const prior = JSON.stringify(source.actor.episodes);
  snapshot.self.x = -9999;
  snapshot.choices[0].x = -9999;
  snapshot.memories[0].outcome = "fabricated";
  assert.equal(JSON.stringify(source.actor.episodes), prior);
  assert.notEqual(source.actor.x, -9999);
  assert.notEqual(privateView(source).choices[0].x, -9999);
});

test("hidden intervention does not affect current or nearby later private cognition", () => {
  const altered = createExperiment({ seed: 21, left: "habit", right: "habit" });
  const control = createExperiment({ seed: 21, left: "habit", right: "habit" });
  intervene(altered, "east", "drain");
  advance(altered, 5);
  advance(control, 5);
  assert.deepEqual(privateView(altered.left), privateView(control.left),
    "actor must not know remote resources were changed");
  assert.deepEqual(privateView(altered.right), privateView(control.right));
  assert.notDeepEqual(altered.left.stations.east, control.left.stations.east,
    "research worlds should genuinely differ");
});
