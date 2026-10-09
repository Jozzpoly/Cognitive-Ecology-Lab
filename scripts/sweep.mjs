import { runSensitivity } from "../src/sensitivity.mjs";

const report = runSensitivity({ seedCount: 128, maxTick: 1200 });
console.log(JSON.stringify(report, null, 2));
