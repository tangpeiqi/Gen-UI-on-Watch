import { fitTimeLayout } from "./time-layout.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadDesignPack } from "./fallback-generator.mjs";
import { createLayoutValidator } from "./layout-validator.mjs";
import { buildPromptPayload, buildSystemPrompt } from "./openai-provider.mjs";

const pack = loadDesignPack();
const validator = createLayoutValidator(pack);
const payload = buildPromptPayload({ context: {}, preferences: {}, designPack: pack, currentTime: "10:09", retryCount: 0 });
assert.ok(buildSystemPrompt(pack).includes(pack.runtimeWorkflow), "The system prompt must enforce the documented runtime workflow");
assert.strictEqual(payload.generationGuide, fs.readFileSync("design-pack/generation-guide.md", "utf8"));
assert.strictEqual(payload.runtimeWorkflow, pack.runtimeWorkflow);
assert.strictEqual(payload.widgetContentTypes, pack.widgetContentTypes);
assert.deepEqual(payload.pseudoContextJson, JSON.parse(fs.readFileSync("demo-data/pseudo-context.json", "utf8")), "Prompt must contain the complete pseudo context JSON");
assert.ok(!Object.hasOwn(payload, "pseudoContextMarkdownSummary"), "Prompt must not include the Markdown review copy");
assert.ok(!Object.hasOwn(payload, "pseudoContextMarkdown"), "Prompt must not include raw pseudo context Markdown");

assert.strictEqual(payload.layoutSchema, pack.schema);
assert.strictEqual(payload.generatedRectangularWidgetSchema, pack.generatedRectangularWidgetSchema);
assert.strictEqual(payload.widgetDesignResources, pack.widgetDesignResources);
assert.strictEqual(payload.widgetDesignResources.circular.visualSpecs, pack.circularVisualSpecs);
for (const [shape, path] of [["circular", "circular-widget-guidelines/README.md"], ["rectangular", "rectangular-widget-guidelines/rectangular-widget-composition-guidelines.md"]]) {
  assert.strictEqual(payload.widgetDesignResources[shape].guidelines, fs.readFileSync(`design-pack/${path}`, "utf8"));
  assert.ok(payload.widgetDesignResources[shape].catalog);
  assert.ok(payload.widgetDesignResources[shape].visualSpecs);
}
assert.deepEqual(payload.orderedPipelineSteps.slice(2, 5), ["select-widgets-using-policy", "design-complete-widgets-using-widget-resources", "compose-watch-face-using-generation-guide"]);
const stageNames = ["**Select widgets.**", "**Design widgets.**", "**Compose the watch face.**", "**Validate the result.**"];
const stagePositions = stageNames.map(stage => payload.runtimeWorkflow.indexOf(stage));
assert.ok(stagePositions.every((position, index) => position >= 0 && (!index || position > stagePositions[index - 1])), "Documented runtime stages must preserve selection, widget design, face layout, validation order");
assert.strictEqual(payload.widgetSelectionPolicy, pack.widgetSelectionPolicy);
for (const layout of [...pack.sampleLayouts.layouts, payload.validLayoutExample]) {
  const result = validator.validateLayout(layout);
  assert.ok(result.ok, `Example fails before repair: ${JSON.stringify(result.errors)}`);
}
// A lone passive timer accepts M with split time, but still rejects S.
const mediumTimer = structuredClone(pack.sampleLayouts.layouts[0]);
mediumTimer.metadata.selectedContentTypes = ["timer"];
const timer = mediumTimer.widgets[0];
mediumTimer.widgets = [timer];
timer.contentType = "timer";
timer.data = { icon: "timer", progress: 0.5, metricKind: "countdown" };
timer.variant.size = "M";
timer.frame = { x: 109, y: 6, width: 90, height: 90 };
mediumTimer.layers.top = [timer.id];
mediumTimer.time.mode = "split_hour_minute";
mediumTimer.time.frame = { x: 0, y: 54, width: 110, height: 152 };
mediumTimer.time.style.fontSize = 82;
mediumTimer.time.containers = ["hour", "minute"].map((role, index) => ({
  id: `time-${role}`, role, value: index ? "42" : "5",
  frame: { x: 0, y: 54 + index * 76, width: 110, height: 76 },
  style: { ...mediumTimer.time.style }, anchor: "left"
}));
mediumTimer.date.frame = { x: 0, y: 32, width: 70, height: 22 };
mediumTimer.date.stackedWithTimeContainerId = "time-hour";
fitTimeLayout(mediumTimer);
const mediumTimerResult = validator.validateLayout(mediumTimer);
assert.ok(mediumTimerResult.ok, `Lone M timer rejected: ${JSON.stringify(mediumTimerResult.errors)}`);
const smallTimer = structuredClone(mediumTimer);
smallTimer.widgets[0].variant.size = "S";
smallTimer.widgets[0].frame = { x: 127, y: 6, width: 72, height: 72 };
assert.ok(validator.validateLayout(smallTimer).errors.some(error => error.code === "focused_single_circular_uses_large"));
// A spec edit must reach both prompt tokens and validation, not just documentation.
const changed = structuredClone(pack);
changed.circularVisualSpecs.components.close_gauge.exactVisualTokens.sizes.S.diameter = 73;
const changedPayload = buildPromptPayload({ context: {}, preferences: {}, designPack: changed, currentTime: "10:09" });
assert.equal(changedPayload.circularTokens.S.frame.width, 73);
const smallFixture = pack.sampleLayouts.layouts.find(layout => layout.widgets.some(widget => widget.shape === "circular" && widget.variant.size === "S"));
assert.ok(smallFixture, "A small circular fixture is required");
assert.ok(createLayoutValidator(changed).validateLayout(smallFixture).errors.some(error => error.code === "circular_fixed_size"));
const catalog = JSON.parse(fs.readFileSync("design-pack/circular-widget-guidelines/circular-widget-catalog.json", "utf8"));
for (const component of catalog.components) {
  for (const [size, frame] of Object.entries(component.legalSizes)) {
    assert.deepEqual(frame, payload.circularTokens[size].frame, `${component.id}/${size} catalog size drift`);
  }
}
assert.ok(pack.widgetSelectionPolicy.strictTemplateRules.timer.allowedCircular.allowedSizes.includes("L"), "Solo timer must allow the runtime's L size");
console.log("Design pack: prompt source, policy, raw examples, shared tokens, and catalog sizes verified.");

// Check count policy independently of geometry: adding cloned widgets can cause
// collisions, but must not disguise acceptance/rejection by the count rules.
const countCodes = new Set(["too_many_widgets", "rectangular_present_widget_cap", "rectangular_count_cap"]);
const rectangle = pack.sampleLayouts.layouts.flatMap(layout => layout.widgets).find(widget => widget.shape === "rectangular" && widget.contentType !== "checklist");
const circle = pack.sampleLayouts.layouts.flatMap(layout => layout.widgets).find(widget => widget.shape === "circular");
for (let rectangles = 0; rectangles <= 3; rectangles++) {
  for (let circles = 0; circles <= 4; circles++) {
    if (!rectangles && !circles) continue;
    const layout = structuredClone(pack.sampleLayouts.layouts[0]);
    layout.widgets = [
      ...Array.from({ length: rectangles }, () => structuredClone(rectangle)),
      ...Array.from({ length: circles }, () => structuredClone(circle))
    ].map((widget, index) => ({ ...widget, id: `count-test-${index}` }));
    const allowed = rectangles <= 2 && rectangles + circles <= 3 && (rectangles !== 2 || circles === 0);
    const countErrors = validator.validateLayout(layout).errors.filter(error => countCodes.has(error.code));
    assert.equal(countErrors.length === 0, allowed, `${rectangles} rectangles + ${circles} circles: incorrect count policy`);
  }
}
console.log("Widget counts: all combinations of 0–3 rectangles and 0–4 circles verified.");
