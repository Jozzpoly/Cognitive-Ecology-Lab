import { createExperiment, advance, intervene, summary, ECOLOGIES } from "../src/core.mjs";

// Bounded, reproducible sensitivity probe. These 128 seeds cover only a very
// narrow hand-authored ecology (two sites and shifted initial restock phases).
// The output does NOT establish general cognition quality.
const scenarios = [
  { name: "natural", events: [] },
  { name: "depleted-west", events: [{ tick: 160, site: "west", action: "drain" },
    { tick: 560, site: "west", action: "drain" }] },
  { name: "depleted-east", events: [{ tick: 160, site: "east", action: "drain" },
    { tick: 560, site: "east", action: "drain" }] },
  { name: "inversions", events: [{ tick: 190, site: "west", action: "fill" },
    { tick: 190, site: "east", action: "drain" },
    { tick: 590, site: "east", action: "fill" },
    { tick: 590, site: "west", action: "drain" }] },
  { name: "synchronized-resets", events: [{ tick: 250, site: "west", action: "drain" },
    { tick: 250, site: "east", action: "drain" },
    { tick: 500, site: "west", action: "fill" },
    { tick: 500, site: "east", action: "fill" }] },
];
const comparisons = [["habit", "recall"], ["cooldown", "recall"], ["habit", "cooldown"]];
const maxTick = 1200;
const seedCount = 128;

function play(seed, left, right, scenario, ecology) {
  const exp = createExperiment({ seed, left, right, ecology });
  let time = 0;
  for (const event of scenario.events) {
    advance(exp, event.tick - time);
    intervene(exp, event.site, event.action);
    time = event.tick;
  }
  advance(exp, maxTick - time);
  return exp;
}
function stats(rows) {
  const sum = name => rows.reduce((a, b) => a + b[name], 0);
  const mean = name => +(sum(name) / rows.length).toFixed(3);
  const sign = name => ({
    positive: rows.filter(x => x[name] > 0).length,
    negative: rows.filter(x => x[name] < 0).length,
    tied: rows.filter(x => x[name] === 0).length,
  });
  return {
    runs: rows.length,
    deliveriesDifference: { ...sign("deliveriesDelta"), mean: mean("deliveriesDelta") },
    emptyTripsDifference: { ...sign("emptyTripsDelta"), mean: mean("emptyTripsDelta") },
    travelDifference: { ...sign("travelDelta"), mean: mean("travelDelta") },
    meanConsultationsExtra: mean("consultationsDelta"),
    divergenceObserved: rows.filter(x => x.diverged).length,
  };
}
const report = {
  protocol: "Cognition Relay/R0 sensitivity sweep; not an independent ecology or model benchmark",
  seedRange: [0, seedCount - 1],
  ecologies: [...ECOLOGIES],
  tickHorizon: maxTick,
  scenarios: [],
};
for (const ecology of ECOLOGIES) for (const scenario of scenarios) {
  const results = [];
  for (const [left, right] of comparisons) {
    const rows = [];
    for (let seed = 0; seed < seedCount; seed++) {
      const exp = play(seed, left, right, scenario, ecology);
      const a = summary(exp.left), b = summary(exp.right);
      rows.push({
        seed,
        deliveriesDelta: b.deliveries - a.deliveries,
        emptyTripsDelta: b.emptyTrips - a.emptyTrips,
        travelDelta: Math.round((b.distance - a.distance) * 1000) / 1000,
        consultationsDelta: b.consultations - a.consultations,
        diverged: exp.firstDivergenceTick !== null,
      });
    }
    results.push({ pair: left + " → " + right, ...stats(rows),
      negativeExamples: rows.filter(x => x.deliveriesDelta < 0).slice(0, 3).map(x => ({ seed: x.seed, delta: x.deliveriesDelta })),
      positiveExamples: rows.filter(x => x.deliveriesDelta > 0).slice(0, 3).map(x => ({ seed: x.seed, delta: x.deliveriesDelta })),
    });
  }
  report.scenarios.push({ ecology, scenario: scenario.name, interventions: scenario.events, results });
}
console.log(JSON.stringify(report, null, 2));
