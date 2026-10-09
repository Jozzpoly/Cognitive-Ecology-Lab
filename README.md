# Cognitive Ecology Lab

**Research on causal interactions, cooperation, conflict and specialization among cognitive processes.** An independent sister to ReflexBrain, SPC, Companion and Medium — not their replacement or a shared organism architecture.

## Current experiment — R1 Incident Cell

**[Open the interactive working preview](https://jozzpoly.github.io/Cognitive-Ecology-Lab/)** · [R1 protocol](docs/EXPERIMENT_002.md) · [Live state](docs/STATE.md)

One rover, one changing grid-world, urgent incidents, interactive fires and barriers. Four differently clocked authored components compete/cooperate over one actuator: Pilot (cheap local), Dispatcher (prioritization), Cartographer (delayed partial-world planning), Guardian (local safety veto). The broker admits or rejects their output. Disable modules during live action, jam advice, or replay the same timed interventions against a competent local-only baseline.

**Important:** All mechanisms are hand-authored deterministic algorithms, not parallel OS workers, Jev, Clef, ReflexBrain, Luna or learned cognition. Clock delay is simulated inside one JS loop. CI PASS is not an Owner qualitative PASS. Negative synergy is an important result, not a defect to disguise.

## Preserved R0 — Cognition Relay / Supply Ecology

[Open the preserved R0 courier experiment](https://jozzpoly.github.io/Cognitive-Ecology-Lab/r0.html) · [R0 scoped counterexample](docs/R0_FINDING_2026-10-09.md) · [Method](docs/EXPERIMENT_001.md).

Owner judged R0 too simple to meaningfully assess (2026-10-09). R0 remains a reproducible comparison donor, not the canonical organism or direction of R1.

## Run and qualification

```sh
npm run dev    # Node 22+, local static server at http://127.0.0.1:4173
npm run check  # Node tests and source syntax; CI adds headless Chromium
node scripts/r1-probe.mjs  # limited R1 outcome comparison
```

`main` holds a runnable laboratory, **not** Owner-scientifically qualified results. [CI](https://github.com/Jozzpoly/Cognitive-Ecology-Lab/actions/workflows/check.yml) runs on each commit; [auto-preview](docs/PUBLISH.md) publishes a successful current-`main` commit with an exact `build.json` source receipt. Publishing does not imply acceptance.

Project rules: [AGENTS.md](AGENTS.md). Donor candidates: [docs/DONORS.md](docs/DONORS.md). Current compact research authority: [docs/STATE.md](docs/STATE.md).

No license has been selected. No source or assets were copied from sibling projects. No paid model API usage.
