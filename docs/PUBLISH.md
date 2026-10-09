# Publish and provenance contract

**Two independent statuses:** deployed working **research preview** and Owner-qualified scientific/product result. Deployment does **not** imply the latter.

## Automatic publication (after current-main Check)

A successful `Check` workflow on a first-party push to `main` now triggers `Publish Owner preview` through GitHub Actions `workflow_run`. Before deployment, the workflow confirms the exact checked commit is **still the current main HEAD**, repeats `npm run check`, builds a static site, and emits `build.json` with immutable source SHA and workflow run ID. A stale Check run is skipped, not published.

This removes the Owner's need to repeat manual publication after every safe code iteration. Failed or unverified code is not intentionally promoted.

The resulting preview is a **moving research surface**, not an accepted baseline. The app header shows `SOURCE <short SHA>` when `build.json` exists; click the `Check` or `Publish` Actions run for complete source/provenance.

**Manual fallback:** `Actions → Publish Owner preview → Run workflow` remains possible, but the same freshness check refuses a non-current commit.

## Current URL

https://jozzpoly.github.io/Cognitive-Ecology-Lab/

First manually executed Pages release: [#37967250486](https://github.com/Jozzpoly/Cognitive-Ecology-Lab/actions/runs/37967250486), commit `328b71c`. This is historical evidence; verify the latest successful automatic Publish run before claiming the public URL displays new source.

## Boundaries

- All simulation, contrast calculations, helper advice and UI run locally in the browser. There are **zero paid model API calls**.
- Cloud browser fetch, GitHub Action success, real Chromium test, and direct Owner experiential assessment are distinct evidence classes.
- No source/asset from donor repositories is copied automatically.
- Do not edit Pages deployment state to conceal a failed research result. Keep failed experiments reachable through exact commits.
