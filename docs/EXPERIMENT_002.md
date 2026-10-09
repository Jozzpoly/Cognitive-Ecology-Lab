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
