// Empty lab used only to prove defineLab() runs end-to-end. No real lesson
// content — see docs/implement/phase-01-chassis.md Step 1.14.
import { defineLab } from "../runtime/lab.js";

defineLab({
  id: "_demo",
  stage: {
    bg: "deep",
    layout: "demo",
    zones: { control: "1 / 1 / 2 / 2", response: "2 / 1 / 3 / 2", internals: "3 / 1 / 4 / 2", verdict: "4 / 1 / 5 / 2" },
    hues: []
  },
  controls: [{ type: "button", id: "load", label: "Load demo data" }],
  model: { note: "1 step ≈ 60ms, jitter ±12%", seed: 1 },
  metrics: [
    { key: "steps", label: "Steps", unit: "steps" },
    { key: "ms", label: "Total time", unit: "ms", fmt: "duration" }
  ],
  async run({ log, clock }) {
    const steps = 20;
    for (let i = 1; i <= steps; i += 1) {
      await clock.sleep(60);
      log("log", { step: i });
    }
    return { metrics: { steps, ms: clock.now() } };
  }
});
