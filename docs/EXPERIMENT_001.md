# Experiment 001 — Cognition Relay / Supply Ecology

**Class:** early playable discovery specimen, not calibrated science.
**Question:** can a second process consulting legally acquired episodes change outcomes compared with a simple local decision process? Is it better than a still-cheaper cooldown baseline?

## Carrier
Two spatially displayed, independent courier worlds with matching initial stocks, site positions and independent source-replenishment laws. One courier per branch, fixed movement speed, delivers packages to depot. Actor perceives the result of visiting a supply site. Actor has no omniscient view of unseen replenishment. Recorder/tester can see full World truth.

The toy world is deliberately abstract; no physics, no NPC "life" or source actor identity is claimed.

## Comparisons
- **Habit**: nearest known source; after encountering an empty source, immediately switch once. No durable policy use of episodic evidence.
- **Cooldown**: simple local inhibition after recent empty observations.
- **Recall**: separate pure advisory component ranks known places using the actor's historical own visits, with time decay and distance. Advisor cannot read current world stocks.
All carry an episodic witness record to make matched science possible; only some policies consult it to decide. This is not genuine learning and the scoring function is authored, not model output.

## Controls and falsifiers
1. Same seed + same policy + same Owner interventions => exact matching trajectories.
2. Hidden World stock intervention => unchanged actor-private input until lawful local contact.
3. Advisor consumes only private view; never World store or hidden replenishment schedule.
4. Divergence is observable and evidence-linked; a different trajectory need not be an improvement.
5. Compare against cooldown and vary seeds/interventions. If no robust lift or Owner interest, kill or replace this carrier.
6. No fake Jev. Real API transport needs explicit credentials, legal and budget boundary, latency and stale-answer replay tests.

## Confounds
Fixed two-source geometry, score/horizon tuning, initial stock asymmetry, distance bias, controller choices, uncalibrated resource economics. Agent outcomes change their own stock histories, so worlds differ *after* behavioral divergence. Do not claim identical ongoing World state or live replay. No reproducible scientific finding established merely by machine tests.

## Owner test
Run, let both worlds evolve, deplete/replenish sources while running, swap policy combinations, reset same seed, inspect first divergence and evidence/decision logs. Judge whether the extra cognitive process creates an interesting causal phenomenon rather than merely a higher number.

## First falsification / execution evidence — 2026-10-09

The original east-rich world awarded authored recall an advantage over cooldown on every paired seed/scenario, an obvious target for falsification. New **World-only** ecological profiles reverse source richness or remove scarcity entirely while the actor-private sensor contract, courier and scoring law stay the same. The scientific motivation and exact results are preserved in [R0/F1](R0_FINDING_2026-10-09.md).

The experiment's bounded sensitivity probe is now a **single pure module** (`src/sensitivity.mjs`) used by both the CI CLI and the Owner's in-browser contrast bench. The Owner can run it without changing the two currently evolving worlds. Contrast runs are local deterministic computations, **not** new independent actors or a live model.

Boundary: 128 seeds × 5 intervention schedules × 4 ecological profiles are narrow parameter variations, not broad independent world samples. The physical encounter and timing of advice remain local and synchronous in R0. The more interesting next question is whether advice delayed by an independently running process is still useful, particularly when its knowledge expires.
