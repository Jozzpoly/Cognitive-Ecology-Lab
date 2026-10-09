# R1 — Incident Cell / interaction-pressure specimen

**State:** authored multi-process experiment, technically testable. NOT learned cognition, NOT Jev/Clef/LLM, NOT Owner-qualified. R0 retained at \`/r0.html\` once deployed; no R0 donor code copied.

## What is genuinely different from R0?

One physical grid-world with one shared rover. Four separate **logical cognitive processes** with different clocks and knowledge. This is not four operating-system workers; latency is deterministic, modeled in tick-time for repeatability:

- **Pilot (every 3 ticks):** cheap reactive navigation with recent-visit inhibition and observed nearby barriers. A competent baseline; does not learn a model.
- **Dispatcher (every 11 ticks):** prioritizes globally broadcast incident deadlines, knows no unseen hazards.
- **Cartographer (starts every 23 ticks):** path search on **captured observed map**, returns 7–11 ticks later. Response may be obsolete, refused or affected by deliberately jammed transmission.
- **Guardian (every proposed movement):** may veto a hazardous/blocked **observed nearby** tile and substitute a locally safe alternative.
- **Broker:** picks the final actuation, records disagreements and rejected outdated paths. All physical consequences belong to one World.

Owner can ignite/cool terrain, place/remove obstacles, create urgent incidents, jam delayed cognition, disconnect modules at runtime, switch to Pilot-only, or replay same-time interventions against Pilot-only. This produces tangible joint consequences: resolved/expired incidents, damage, route latency and costs.

## Critical fairness correction

An early Pilot-only baseline got stuck at fixed walls. That was an invalid easy victory for the coalition. Pilot now uses nearby sensed obstacles and recent-visit suppression. This baseline can complete incidents without help. **Do not remove this baseline competency to make the cooperative numbers attractive.**

## Reproducible bounded local results

Run \`node scripts/r1-probe.mjs\`, 40 seeds × two intervention regimes × 800 ticks. Initial local executions on 2026-10-09 found:

| Regime | Coalition wins | Pilot-only wins | Ties | Mean resolved delta | Hazard hits, coalition / Pilot |
|---|---:|---:|---:|---:|---:|
| Ordinary | 2 | 35 | 3 | **−2.125** | 0 / 75 |
| Heat-front | 2 | 35 | 3 | **−2.125** | 0 / 275 |

These are *correlated narrow variations of this one authored layout*, not 80 independent general cognitive tasks. The negative result matters: asynchronous planned advice and global prioritization can disrupt strong cheap local action, whereas Guardian's local risk intervention can prevent damage. \`R1\` has not demonstrated net cooperative superiority.

### Honesty limits and key next question

- Module clocks are simulated in one JS event loop; **not** true concurrently executing cognition.
- Broker does not solve negotiated consensus; it follows an authored admission policy.
- Published diagnostic map is researcher World truth. No hidden wall/hazard state is passed as lawful planner or dispatcher input. Dynamic hazards beyond perception cannot be foreseen.
- Counterfactual replays timed Owner interventions, but actor outcomes then change each World's future situation. It is a matched-stimulus comparison, not an identical-state continuation.
- Logged suggestions are explicit, authored algorithm results. No provider output is faked.
- The world is still deliberately small and may remain **not Owner-judgeable** despite qualitative growth.
- The immediate scientific question is **where coordination overhead outweighs specialization**, not how to make R1 look good.

## Verified merged-source receipt

GitHub Actions [Check #37973567083](https://github.com/Jozzpoly/Cognitive-Ecology-Lab/actions/runs/37973567083) on merged exact source `a5cc41b339eeea1800588643df44a1ed82ad286d` executed 21/21 tests, the reproducible 40-seed R1 probe and live Chromium replay smoke. R1 probe JSON matched the narrow figures above. Public automatic Pages preview [#37973612396](https://github.com/Jozzpoly/Cognitive-Ecology-Lab/actions/runs/37973612396) served a matching `build.json`, verified externally. Deployment is **not** Owner approval.

## R1 field-work campaign — guided understanding and reversible specimen

**Owner feedback (2026-10-09):** the original R1 begins to function, but remains difficult to understand and is not yet the desired lab experience. Deliberately spend one more **bounded** campaign improving its inspectability and interactive pressure, then preserve the specimen and advance instead of enshrining it as platform architecture.

### Three actual (non-mocked) scenarios

- **01: Guardian versus fire**: ignite the known hotspot near the operator's initial path; pause, step to veto, then run same-stimulus Pilot-only counterfactual near tick 420. The established code-level negative/positive pairing is fewer hazard hits for the protected track, but throughput may be costly.
- **02: Coordination interference**: follow a pre-seeded crisis sequence at ticks 180 and 340, then compare near tick 800. Preserves the independently established failure of an over-coordinated policy versus a competent cheap Pilot.
- **03: Communication blackout**: jam Kartographer output and observe late/lost replies while Pilot keeps moving. Verify continuity, not system-wide paralysis.

A guide simply runs deterministic `createCell/advanceCell/interveneCell`; no prerecorded result textures, fabricated LLM responses or hidden scripted teleportation. Distinct seeds may produce different outcomes. The default `seed=19` is the bounded validated teaching case.

### How Owner can investigate

1. Choose a scenario and **stop on the next relevant decision**, or jump to its documented outcome. Restart the same seed before drawing conclusions.
2. Toggle **World truth ↔ actor-private knowledge**. The world debugger sees all heat and walls, but unknown cells and unobserved distant hazards must remain absent in the private view. The selection inspector explicitly contrasts fact with known/stale evidence.
3. Open **Ostatnia decyzja** to see Pilot proposal, Dispatcher preference, Planner route, Guardian veto and actual arbitration. Last decision receipts are authored mechanical facts, not chain-of-thought from a model.
4. Press **Uruchom kontrprzebieg**. The comparison freezes the snapshot at that tick, draws Pilot-only's recent path as a distinct ghost, and compares material results. Resuming/changing world invalidates that old comparison.
5. Under **Eksport / import własnego eksperymentu**, download a bounded action-history JSON. It retains seed, timed interventions, module/mode changes, horizon, expected counters, and (on Pages) deployed source SHA. Import validates each command, reconstructs source-derived World state, and checks resulting counters. It does *not* serialize hidden private brain states or persist data to an external server.

### Invariants and limitations

- The public world and private actor view are deliberately different; merely seeing the debugger does not permit mechanisms to use omniscient knowledge.
- The ghost shows the *same external stimulus*, not a parallel state forced to keep identical incident outcomes. The two worlds can diverge causally.
- Guided cases and JSON sessions are limited reproducible witnesses, not generalized behavioral ability. Source SHA matters when importing future recordings after code changes.
- Replay limits 200 actions and 10000 ticks. Deliberate restriction protects responsiveness and makes imported untrusted scenarios bounded. Owner actions are editable only through game-world operations.
- A headless DOM test is **technical confidence**, not proof Owner can interpret, enjoy or break the experience.
- The more processes there are, the more risk of expensive/conflicting coordination. Do not optimize for a pretty ratio of victories.

**Retirement condition:** when Owner has learned what this apparatus can teach, keep its evidence and executable test snapshot; do not keep expanding Incidents purely to postpone the next conceptual leap.
