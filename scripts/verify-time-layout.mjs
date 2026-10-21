import assert from "node:assert/strict";
import { loadDesignPack, generateFallbackWatchUi } from "./fallback-generator.mjs";
import { createLayoutValidator } from "./layout-validator.mjs";
import { fitTimeLayout, measureTimeText, timeFrameInsideMask } from "./time-layout.mjs";
import { generateOpenAiWatchUi } from "./openai-provider.mjs";

const pack = loadDesignPack();
const validator = createLayoutValidator(pack);
function assertFitted(layout) {
  for (const container of layout.time.containers) {
    const bounds = measureTimeText(container.value, container.style);
    assert.ok(Math.abs(container.frame.width - bounds.width) < 0.01);
    assert.ok(Math.abs(container.frame.height - bounds.height) < 0.01);
    assert.ok(timeFrameInsideMask(container.frame), "digits must not clip the rounded mask");
  }
  const result = validator.validateLayout(layout);
  assert.ok(result.ok, JSON.stringify(result.errors));
}

// Different digit counts and widget arrangements must change the font size,
// while both container dimensions remain tight. Include height-limited faces.
for (const timeOfDay of ["1:11", "10:09", "23:59"]) {
  for (const activity of ["running", "timer countdown", "weather", "music", "reminder"]) {
    const result = generateFallbackWatchUi({ context: { timeOfDay, activity }, designPack: pack });
    assertFitted(result.layout);
    const before = structuredClone(result.layout);
    fitTimeLayout(result.layout);
    assert.deepEqual(result.layout, before, "fitting must be stable when repeated");
  }
}
const short = generateFallbackWatchUi({ context: { timeOfDay: "1:11", activity: "running" }, designPack: pack }).layout;
const long = generateFallbackWatchUi({ context: { timeOfDay: "10:09", activity: "running" }, designPack: pack }).layout;
assert.ok(short.time.style.fontSize > long.time.style.fontSize, "shorter time should use larger digits in the same space");

// Segmented time uses the same per-part sizing, not a combined-time exception.
const segmented = structuredClone(pack.sampleLayouts.layouts[0]);
segmented.widgets = [];
segmented.layers.top = [];
segmented.metadata.selectedContentTypes = [];
segmented.time.mode = "segmented_digits";
segmented.time.containers = ["5", ":42"].map((value, index) => ({
  id: `time-part-${index}`, role: "digit_group", value,
  frame: { x: 0, y: 54 + index * 76, width: 110, height: 76 },
  style: { ...segmented.time.style }, anchor: "left"
}));
segmented.date.stackedWithTimeContainerId = "time-part-0";
segmented.date.frame = { x: 16, y: 32, width: 70, height: 22 };
fitTimeLayout(segmented);
assertFitted(segmented);

const outlined = structuredClone(short);
outlined.time.containers[0].style.treatment = "outline_stroke";
outlined.time.containers[0].style.letterSpacing = 2;
fitTimeLayout(outlined);
assertFitted(outlined);

const tallFont = structuredClone(short);
fitTimeLayout(tallFont, (value, style) => ({ width: String(value).length * style.fontSize * 0.58, height: style.fontSize * 2 }));
assert.ok(tallFont.time.style.fontSize < short.time.style.fontSize, "height must limit font size even when horizontal room remains");
assert.ok(timeFrameInsideMask(tallFont.time.containers[0].frame));

const tiny = structuredClone(short);
const c = tiny.time.containers[0];
c.style.fontSize /= 2;
const bounds = measureTimeText(c.value, c.style);
c.frame = { x: (205 - bounds.width) / 2, y: 150, ...bounds };
tiny.time.frame = { ...c.frame };
assert.ok(validator.validateLayout(tiny).errors.some(error => error.code === "time_underfills_available_space"));
const loose = structuredClone(short);
loose.time.containers[0].frame.height += 8;
assert.ok(validator.validateLayout(loose).errors.some(error => error.code === "time_container_text_bounds"));

const checklist = generateFallbackWatchUi({ context: { activity: "checklist" }, designPack: pack }).layout;
const checklistBefore = structuredClone(checklist);
fitTimeLayout(checklist, () => { throw new Error("Checklist must not be measured or resized"); });
assert.deepEqual(checklist, checklistBefore);

// Test the provider's real normalization path without a network request.
const fetchBefore = globalThis.fetch;
const keyBefore = process.env.OPENAI_API_KEY;
try {
  process.env.OPENAI_API_KEY = "test-only";
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ output_text: JSON.stringify({ layoutJson: JSON.stringify(outlined) }) }) });
  const result = await generateOpenAiWatchUi({ context: { activity: "running" }, designPack: pack, currentTime: "1:11" });
  assertFitted(result.layout);
} finally {
  globalThis.fetch = fetchBefore;
  if (keyBefore === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = keyBefore;
}
console.log("Time fitting: digit counts, widget bands, mask, outline/spacing, tight bounds, repeated fitting, provider normalization, and Checklist verified.");
