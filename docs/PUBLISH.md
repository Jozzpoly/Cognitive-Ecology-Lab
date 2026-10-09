# Publishing a web preview

The app works as an entirely static site. It makes **zero paid API requests**. The Owner-facing preview is **not** auto-published from unqualified scientific outcomes.

For the first GitHub Pages activation, the repository owner needs to select `Settings → Pages → Build and deployment → Source: GitHub Actions` once. This setting may be unavailable through the current GitHub connector.

Then use `Actions → Publish Owner preview → Run workflow`. Its published commit can be identified from the run; do not treat a moving Pages URL alone as an exact-source receipt.

Intended URL after successful first deployment:
`https://jozzpoly.github.io/Cognitive-Ecology-Lab/`

**Status:** FIRST DEPLOY CONFIRMED. [Owner preview run #37967250486](https://github.com/Jozzpoly/Cognitive-Ecology-Lab/actions/runs/37967250486) succeeded for pinned source `328b71cc86053f0722bd2fa28afd18420b0138c1`. A separate public fetch verified the expected HTML/title. Headless Chromium was verified against local source, not independently against the remote Pages runtime. **Recent ecology controls, audit UI and scientific results exist only on newer main until another manual Publish run.**

The ordinary `Check` workflow runs 11+ headless tests, a multi-seed sensitivity sweep and two Chromium browser smokes (app boot and click-like on-demand audit) on every commit. It is independent of Pages and does not require Site deployment.
