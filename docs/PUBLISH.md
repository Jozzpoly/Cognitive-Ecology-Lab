# Publishing a web preview

The app works as an entirely static site. It makes **zero paid API requests**. The Owner-facing preview is **not** auto-published from unqualified scientific outcomes.

For the first GitHub Pages activation, the repository owner needs to select `Settings → Pages → Build and deployment → Source: GitHub Actions` once. This setting may be unavailable through the current GitHub connector.

Then use `Actions → Publish Owner preview → Run workflow`. Its published commit can be identified from the run; do not treat a moving Pages URL alone as an exact-source receipt.

Intended URL after successful first deployment:
`https://jozzpoly.github.io/Cognitive-Ecology-Lab/`

**Status:** publish path configured, not yet executed or verified. Do not advertise the intended URL as live until it resolves to the actual tested specimen.

The ordinary `Check` workflow runs headless tests and a Chromium browser smoke on every commit. It is independent of Pages and does not require Site deployment.
