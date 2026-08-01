import fs from "node:fs";
import { createLayoutValidator } from "./layout-validator.mjs";

const schema = JSON.parse(fs.readFileSync("design-pack/layout-schema.json", "utf8"));
const samples = JSON.parse(fs.readFileSync("design-pack/sample-layouts.json", "utf8"));
const materialSymbolsRegistry = JSON.parse(fs.readFileSync("design-pack/material-symbols-registry.json", "utf8"));
const widgetSelectionPolicy = JSON.parse(fs.readFileSync("design-pack/widget-selection-policy.json", "utf8"));
const generatedRectangularWidgetSchema = JSON.parse(fs.readFileSync("design-pack/rectangular-widget-guidelines/generated-rectangular-widget-schema.json", "utf8"));
const layoutValidator = createLayoutValidator({
  schema,
  materialSymbolsRegistry,
  widgetSelectionPolicy,
  generatedRectangularWidgetSchema
});

const circularComponents = new Set(["close_gauge", "open_gauge"]);
const rectangularTemplates = new Set(["music_control", "reminder", "timer_rectangular", "checklist_full_face", "generated_rectangular_widget"]);
const generatedRectangularExcludedContentTypes = new Set(generatedRectangularWidgetSchema.strictTemplateExcludedContentTypes);
const generatedRectangularContentTypes = new Set(generatedRectangularWidgetSchema.generatedRectangularWidgetContentTypes);
const generatedRectangularBlockTypes = new Set(["text", "inline_small_icon_text", "big_icon_text_group", "number_text_lockup", "edge_progress_bar"]);
const generatedRectangularTextUnits = new Set(["numbers", "body_emphasis", "body", "secondary"]);
const circularSizes = new Set(["S", "M", "L"]);
const contentTypes = new Set(schema.$defs.contentType.enum);
const iconTokens = materialSymbolsRegistry.tokens;
const schemaIconTokens = new Set(schema.$defs.widgetData.properties.icon.enum);
const allowedTopLevel = new Set(Object.keys(schema.properties));
const circularEligibleContentTypes = new Set(widgetSelectionPolicy.circularEligibility.allowedContentTypes);
const compositionRules = widgetSelectionPolicy.compositionRules;
const colorSystemModes = new Set(["mono_tone", "multicolor"]);
const colorSystemSourceRules = new Set([
  "one-content-type-prefers-mono-tone",
  "two-content-types-prefers-multicolor",
  "three-content-types-flexible-color-mode",
  "user-context-explicit-color-mode"
]);
const templateContentTypes = {
  music_control: "music_control",
  reminder: "reminder",
  timer_rectangular: "timer",
  checklist_full_face: "checklist"
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertOnlyKeys(object, allowedKeys, path) {
  for (const key of Object.keys(object)) {
    assert(allowedKeys.has(key), `${path}.${key} is not allowed`);
  }
}

function validateFrame(frame, path) {
  for (const key of ["x", "y", "width", "height"]) {
    assert(typeof frame[key] === "number", `${path}.${key} must be a number`);
  }
  assert(frame.width > 0 && frame.width <= 205, `${path}.width is out of range`);
  assert(frame.height > 0 && frame.height <= 251, `${path}.height is out of range`);
}

function rectOverlapDepth(a, b) {
  const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return Math.min(xOverlap, yOverlap);
}

function validateTextObject(object, path) {
  assert(typeof object.value === "string" && object.value.length > 0, `${path}.value is required`);
  assert(object.layer === "bottom", `${path}.layer must be bottom`);
  validateFrame(object.frame, `${path}.frame`);
  assert(object.style && typeof object.style === "object", `${path}.style is required`);
}

function validateColorSystem(colorSystem) {
  assert(colorSystem && typeof colorSystem === "object", "colorSystem is required");
  assertOnlyKeys(colorSystem, new Set(["mode", "accentColor", "sourceRule"]), "colorSystem");
  assert(colorSystemModes.has(colorSystem.mode), "colorSystem.mode is invalid");
  assert(/^#[0-9a-fA-F]{6}$/.test(colorSystem.accentColor), "colorSystem.accentColor must be a 6-digit hex color");
  assert(colorSystemSourceRules.has(colorSystem.sourceRule), "colorSystem.sourceRule is invalid");
}

function validateCircularWidget(widget, index) {
  const path = `widgets[${index}]`;
  assert(circularEligibleContentTypes.has(widget.contentType), `${path}.contentType cannot use circular rendering`);
  assert(circularComponents.has(widget.component), `${path}.component is invalid`);
  assert(widget.variant && typeof widget.variant === "object", `${path}.variant is required`);
  assert(circularSizes.has(widget.variant.size), `${path}.variant.size is invalid`);
  assert(["text", "icon", "range", "offset"].includes(widget.variant.property), `${path}.variant.property is invalid`);
  assert(widget.data && typeof widget.data === "object", `${path}.data is required`);
  if (widget.component === "close_gauge") {
    assert(typeof widget.data.progress === "number", `${path}.data.progress is required for close_gauge`);
  }
  if (widget.variant.property === "text") {
    assert(widget.data.value !== undefined, `${path}.data.value is required for text variant`);
    assert(typeof widget.data.label === "string", `${path}.data.label is required for text variant`);
  }
  if (widget.variant.property === "icon") {
    assert(typeof widget.data.icon === "string", `${path}.data.icon is required for icon variant`);
    assert(iconTokens[widget.data.icon], `${path}.data.icon is not in material-symbols-registry.json`);
    assert(
      iconTokens[widget.data.icon].allowedContentTypes.includes(widget.contentType),
      `${path}.data.icon is not allowed for content type ${widget.contentType}`
    );
  }
}

function validateRectangularWidget(widget, index) {
  const path = `widgets[${index}]`;
  assert(rectangularTemplates.has(widget.template), `${path}.template is invalid`);
  if (widget.template === "generated_rectangular_widget") {
    assert(generatedRectangularContentTypes.has(widget.contentType), `${path}.contentType cannot use generated_rectangular_widget`);
  } else {
    assert(widget.contentType === templateContentTypes[widget.template], `${path}.contentType must be ${templateContentTypes[widget.template]} for ${widget.template}`);
  }
  assert(widget.frame.x === 0, `${path}.frame.x must be 0`);
  assert(widget.frame.width === 205, `${path}.frame.width must be 205`);
  assert(widget.frame.height >= 80 && widget.frame.height <= 251, `${path}.frame.height is invalid`);
  assert(widget.cornerRadius === 54, `${path}.cornerRadius must be 54`);
  assert(["top", "bottom"].includes(widget.verticalAlignment), `${path}.verticalAlignment is invalid`);
  assert(widget.data && typeof widget.data === "object", `${path}.data is required`);
  if (widget.template === "reminder") {
    assert(typeof widget.data.content === "string", `${path}.data.content is required for reminder`);
    assert(typeof widget.data.dueDatetime === "string", `${path}.data.dueDatetime is required for reminder`);
  }
  if (widget.template === "timer_rectangular") {
    assert(typeof widget.data.countdown === "string", `${path}.data.countdown is required for timer_rectangular`);
  }
  if (widget.template === "music_control") {
    assert(typeof widget.data.song === "string", `${path}.data.song is required for music_control`);
    assert(typeof widget.data.playPauseAction === "string", `${path}.data.playPauseAction is required for music_control`);
  }
  if (widget.template === "checklist_full_face") {
    assert(Array.isArray(widget.data.items), `${path}.data.items is required for checklist_full_face`);
  }
  if (widget.template === "generated_rectangular_widget") {
    validateGeneratedRectangularComposition(widget.composition, widget.contentType, `${path}.composition`);
  }
}

function validateGeneratedTextBlock(block, path) {
  assert(generatedRectangularTextUnits.has(block.unit), `${path}.unit is invalid`);
  assert(typeof block.text === "string" && block.text.length > 0 && block.text.length <= 36, `${path}.text is invalid`);
  if (block.maxLines !== undefined) {
    assert(Number.isInteger(block.maxLines) && block.maxLines >= 1 && block.maxLines <= 2, `${path}.maxLines is invalid`);
  }
}

function validateGeneratedIcon(icon, contentType, path) {
  assert(iconTokens[icon], `${path} is not in material-symbols-registry.json`);
  assert(iconTokens[icon].allowedContentTypes.includes(contentType), `${path} is not allowed for content type ${contentType}`);
}

function validateGeneratedRectangularBlock(block, contentType, path) {
  assert(block && typeof block === "object", `${path} must be an object`);
  assert(generatedRectangularBlockTypes.has(block.type), `${path}.type is invalid`);

  if (block.type === "text") {
    validateGeneratedTextBlock(block, path);
  }
  if (block.type === "inline_small_icon_text") {
    validateGeneratedIcon(block.icon, contentType, `${path}.icon`);
    assert(["body", "body_emphasis", "secondary"].includes(block.textUnit), `${path}.textUnit is invalid`);
    assert(typeof block.text === "string" && block.text.length > 0 && block.text.length <= 36, `${path}.text is invalid`);
  }
  if (block.type === "big_icon_text_group") {
    validateGeneratedIcon(block.icon, contentType, `${path}.icon`);
    assert(["left", "right"].includes(block.iconPosition), `${path}.iconPosition is invalid`);
    assert(Array.isArray(block.textGroup) && block.textGroup.length >= 1 && block.textGroup.length <= 3, `${path}.textGroup is invalid`);
    block.textGroup.forEach((textBlock, index) => {
      assert(textBlock.type === "text", `${path}.textGroup[${index}].type must be text`);
      validateGeneratedTextBlock(textBlock, `${path}.textGroup[${index}]`);
    });
  }
  if (block.type === "number_text_lockup") {
    assert(block.value !== undefined, `${path}.value is required`);
    if (block.unitLabel !== undefined) {
      assert(typeof block.unitLabel === "string" && block.unitLabel.length <= 12, `${path}.unitLabel is invalid`);
    }
    if (block.secondaryText !== undefined) {
      assert(typeof block.secondaryText === "string" && block.secondaryText.length <= 18, `${path}.secondaryText is invalid`);
    }
  }
  if (block.type === "edge_progress_bar") {
    assert(["top", "bottom"].includes(block.edge), `${path}.edge is invalid`);
    assert(typeof block.progress === "number" && block.progress >= 0 && block.progress <= 1, `${path}.progress is invalid`);
  }
}

function validateGeneratedRectangularComposition(composition, contentType, path) {
  assert(composition && typeof composition === "object", `${path} is required`);
  assert(["vertical", "horizontal"].includes(composition.layout), `${path}.layout is invalid`);
  assert([0, 4, 8, 10, 16].includes(composition.gap), `${path}.gap is invalid`);
  assert(composition.padding && typeof composition.padding === "object", `${path}.padding is required`);
  assert([0, 16].includes(composition.padding.top), `${path}.padding.top is invalid`);
  assert(composition.padding.right === 16, `${path}.padding.right must be 16`);
  assert([0, 16].includes(composition.padding.bottom), `${path}.padding.bottom is invalid`);
  assert(composition.padding.left === 16, `${path}.padding.left must be 16`);
  assert(Array.isArray(composition.blocks), `${path}.blocks must be an array`);
  assert(composition.blocks.length >= 1 && composition.blocks.length <= 4, `${path}.blocks length is invalid`);
  composition.blocks.forEach((block, index) => validateGeneratedRectangularBlock(block, contentType, `${path}.blocks[${index}]`));
}

function validateWidgetSelectionExample(example, index) {
  const path = `widgetSelectionPolicy.deterministicExamples[${index}]`;
  assert(typeof example.id === "string" && example.id.length > 0, `${path}.id is required`);
  assert(Array.isArray(example.selectedContentTypes), `${path}.selectedContentTypes must be an array`);
  assert(Array.isArray(example.selectedWidgets), `${path}.selectedWidgets must be an array`);
  assert(example.selectedWidgets.length <= 3, `${path}.selectedWidgets must contain at most 3 widgets`);

  for (const type of example.selectedContentTypes) {
    assert(contentTypes.has(type), `${path}.selectedContentTypes contains invalid type ${type}`);
  }

  const hasChecklist = example.selectedContentTypes.includes("checklist");
  if (hasChecklist) {
    assert(example.selectedWidgets.length === 1, `${path} checklist must be the only rendered widget`);
  }

  const rectangularWidgetCount = example.selectedWidgets.filter((widget) => widget.shape === "rectangular").length;
  if (rectangularWidgetCount > 0 && !hasChecklist) {
    assert(example.selectedWidgets.length <= compositionRules.rectangularPresent.maxWidgets, `${path} rectangular-present compositions must contain at most ${compositionRules.rectangularPresent.maxWidgets} widgets`);
    assert(rectangularWidgetCount <= compositionRules.rectangularPresent.maxRectangularWidgets, `${path} must contain at most ${compositionRules.rectangularPresent.maxRectangularWidgets} rectangular widgets`);
  }

  for (const [widgetIndex, widget] of example.selectedWidgets.entries()) {
    const widgetPath = `${path}.selectedWidgets[${widgetIndex}]`;
    assert(contentTypes.has(widget.contentType), `${widgetPath}.contentType is invalid`);
    assert(example.selectedContentTypes.includes(widget.contentType), `${widgetPath}.contentType must come from selectedContentTypes`);

    if (widget.shape === "circular") {
      assert(circularEligibleContentTypes.has(widget.contentType), `${widgetPath}.contentType cannot use circular rendering`);
      assert(circularComponents.has(widget.component), `${widgetPath}.component is invalid`);
      assert(widget.variant && typeof widget.variant === "object", `${widgetPath}.variant is required`);
      assert(circularSizes.has(widget.variant.size), `${widgetPath}.variant.size is invalid`);
      assert(["text", "icon", "range", "offset"].includes(widget.variant.property), `${widgetPath}.variant.property is invalid`);

      if (widget.contentType === "timer") {
        const rule = widgetSelectionPolicy.strictTemplateRules.timer.allowedCircular;
        assert(widget.component === rule.component, `${widgetPath}.component must be ${rule.component} for circular timer`);
        assert(widget.variant.property === rule.variant.property, `${widgetPath}.variant.property must be ${rule.variant.property} for circular timer`);
        assert(widget.variant.size === rule.variant.size, `${widgetPath}.variant.size must be ${rule.variant.size} for circular timer`);
      } else {
        assert(!widgetSelectionPolicy.strictTemplateRules[widget.contentType], `${widgetPath}.contentType cannot use circular rendering`);
      }
    } else if (widget.shape === "rectangular") {
      assert(rectangularTemplates.has(widget.template), `${widgetPath}.template is invalid`);
      if (widget.template === "generated_rectangular_widget") {
        assert(generatedRectangularContentTypes.has(widget.contentType), `${widgetPath}.contentType cannot use generated_rectangular_widget`);
      } else {
        assert(widget.contentType === templateContentTypes[widget.template], `${widgetPath}.contentType must be ${templateContentTypes[widget.template]} for ${widget.template}`);
      }

      const rule = widgetSelectionPolicy.strictTemplateRules[widget.contentType];
      if (widget.contentType === "timer") {
        assert(widget.template === rule.allowedRectangularTemplate, `${widgetPath}.template must be ${rule.allowedRectangularTemplate} for timer`);
      } else if (widget.template !== "generated_rectangular_widget") {
        assert(rule && widget.template === rule.requiredTemplate, `${widgetPath}.template must be the strict template for ${widget.contentType}`);
      }
    } else {
      throw new Error(`${widgetPath}.shape is invalid`);
    }
  }
}

function validateLayout(layout) {
  assertOnlyKeys(layout, allowedTopLevel, "layout");
  assert(layout.schemaVersion === "1.0.0", "schemaVersion must be 1.0.0");
  assert(layout.targetContainer === "Gen Watch Face", "targetContainer must be Gen Watch Face");
  assert(layout.canvas.width === 205, "canvas.width must be 205");
  assert(layout.canvas.height === 251, "canvas.height must be 251");
  assert(layout.canvas.borderRadius === 54, "canvas.borderRadius must be 54");
  assert(layout.canvas.coordinateSystem === "fixed", "canvas.coordinateSystem must be fixed");
  validateColorSystem(layout.colorSystem);
  assert(Array.isArray(layout.metadata.selectedContentTypes), "metadata.selectedContentTypes must be an array");
  assert(layout.metadata.selectedContentTypes.length <= 3, "metadata.selectedContentTypes must contain at most 3 items");
  for (const type of layout.metadata.selectedContentTypes) {
    assert(contentTypes.has(type), `metadata.selectedContentTypes contains invalid type ${type}`);
  }
  assert(Number.isInteger(layout.metadata.retryCount), "metadata.retryCount must be an integer");
  assert(typeof layout.metadata.fallbackUsed === "boolean", "metadata.fallbackUsed must be a boolean");
  validateTextObject(layout.time, "time");
  validateTextObject(layout.date, "date");
  assert(Array.isArray(layout.widgets), "widgets must be an array");
  assert(layout.widgets.length <= 3, "widgets must contain at most 3 items");
  const rectangularWidgetCount = layout.widgets.filter((widget) => widget.shape === "rectangular").length;
  const hasChecklistWidget = layout.widgets.some((widget) => widget.contentType === "checklist");
  if (hasChecklistWidget) {
    assert(layout.widgets.length === compositionRules.checklistOnly.maxWidgets, `checklist layouts must contain ${compositionRules.checklistOnly.maxWidgets} widget`);
  } else if (rectangularWidgetCount > 0) {
    assert(layout.widgets.length <= compositionRules.rectangularPresent.maxWidgets, `rectangular-present layouts must contain at most ${compositionRules.rectangularPresent.maxWidgets} widgets`);
    assert(rectangularWidgetCount <= compositionRules.rectangularPresent.maxRectangularWidgets, `layouts must contain at most ${compositionRules.rectangularPresent.maxRectangularWidgets} rectangular widgets`);
  }
  layout.widgets.forEach((widget, index) => {
    assert(contentTypes.has(widget.contentType), `widgets[${index}].contentType is invalid`);
    assert(widget.layer === "top", `widgets[${index}].layer must be top`);
    validateFrame(widget.frame, `widgets[${index}].frame`);
    if (widget.shape === "circular") {
      validateCircularWidget(widget, index);
    } else if (widget.shape === "rectangular") {
      validateRectangularWidget(widget, index);
    } else {
      throw new Error(`widgets[${index}].shape is invalid`);
    }
  });
  for (const [path, textObject] of [["time", layout.time], ["date", layout.date]]) {
    for (const widget of layout.widgets) {
      const overlapDepth = rectOverlapDepth(textObject.frame, widget.frame);
      assert(overlapDepth <= 10, `${path} overlaps ${widget.id} by ${Math.round(overlapDepth)}px`);
    }
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function markFallback(layout, fallbackId, fallbackReason = "no_ai_provider") {
  layout.metadata.pipelinePhase = "phase-7-deterministic-fallbacks";
  layout.metadata.promptVersion = "watch-face-phase-7-fallback";
  layout.metadata.fallbackUsed = true;
  layout.metadata.fallbackId = fallbackId;
  layout.metadata.fallbackReason = fallbackReason;
  if (!layout.metadata.generationStepProvenance.includes("choose-fallback-layout")) {
    layout.metadata.generationStepProvenance.splice(4, 0, "choose-fallback-layout");
  }
  return layout;
}

function fallbackFixtures() {
  const oneCircular = markFallback(clone(samples.layouts[0]), "one-circular-widget-with-large-time");
  oneCircular.metadata.selectedContentTypes = ["workout"];
  oneCircular.colorSystem = {
    mode: "mono_tone",
    accentColor: "#FF7A1A",
    sourceRule: "one-content-type-prefers-mono-tone"
  };
  oneCircular.time.style.color = "#FF7A1A";
  oneCircular.date.style.color = "#FF7A1A";
  oneCircular.widgets = [clone(samples.layouts[0].widgets[0])];
  oneCircular.layers.top = oneCircular.widgets.map((widget) => widget.id);

  const twoCircular = markFallback(clone(samples.layouts[0]), "two-circular-widgets-with-compact-time");

  const oneRectangle = markFallback(clone(samples.layouts[1]), "one-rectangular-widget");

  const mixed = markFallback(clone(samples.layouts[2]), "mixed-circular-and-rectangular-layout");
  mixed.metadata.selectedContentTypes = ["workout", "upcoming_event", "weather"];
  mixed.colorSystem = {
    mode: "multicolor",
    accentColor: "#FF7A1A",
    sourceRule: "two-content-types-prefers-multicolor"
  };
  mixed.time.frame = { x: 18, y: 84, width: 130, height: 40 };
  mixed.time.style.fontSize = 44;
  mixed.time.style.color = "#FFFFFF";
  mixed.date.frame = { x: 18, y: 62, width: 62, height: 18 };
  mixed.date.style.color = "#FFFFFF";
  mixed.widgets = [clone(samples.layouts[0].widgets[0]), clone(samples.layouts[2].widgets[0])];
  mixed.widgets[0].id = "fallback-workout";
  mixed.layers.top = mixed.widgets.map((widget) => widget.id);

  const threeCompact = markFallback(clone(samples.layouts[0]), "three-compact-widgets");
  threeCompact.metadata.selectedContentTypes = ["workout", "weather", "timer"];
  threeCompact.colorSystem = {
    mode: "multicolor",
    accentColor: "#FF7A1A",
    sourceRule: "three-content-types-flexible-color-mode"
  };
  threeCompact.widgets = [
    clone(samples.layouts[0].widgets[0]),
    clone(samples.layouts[0].widgets[1]),
    {
      id: "fallback-timer",
      contentType: "timer",
      shape: "circular",
      component: "close_gauge",
      variant: { property: "text", size: "S" },
      data: {
        value: "3:40",
        label: "tea",
        progress: 0.27,
        metricKind: "timer"
      },
      frame: { x: 118, y: 88, width: 72, height: 72 },
      layer: "top"
    }
  ];
  threeCompact.widgets[0].id = "fallback-workout";
  threeCompact.widgets[1].id = "fallback-weather";
  threeCompact.layers.top = threeCompact.widgets.map((widget) => widget.id);

  const failureReasons = ["api_failure", "timeout", "invalid_output", "budget_exhausted"].map((reason) => {
    const layout = markFallback(clone(oneCircular), `failure-state-${reason}`, reason);
    return layout;
  });

  return [oneCircular, twoCircular, oneRectangle, mixed, threeCompact, ...failureReasons];
}

for (const token of Object.keys(iconTokens)) {
  assert(schemaIconTokens.has(token), `schema icon enum is missing registry token ${token}`);
}

for (const token of schemaIconTokens) {
  assert(iconTokens[token], `schema icon enum contains token missing from registry: ${token}`);
}

assert(Array.isArray(widgetSelectionPolicy.selectionSequence), "widgetSelectionPolicy.selectionSequence must be an array");
assert(widgetSelectionPolicy.selectionSequence.length === 5, "widgetSelectionPolicy.selectionSequence must contain 5 steps");
assert(
  widgetSelectionPolicy.selectionSequence.map((step) => step.step).join(" > ") ===
    "rank-candidate-content-types > choose-renderable-composition > choose-widget-shapes > cap-rendered-content-types > emit-final-widgets",
  "widgetSelectionPolicy.selectionSequence has an unexpected order"
);
assert(
  widgetSelectionPolicy.circularSelectionDelegation.mustUseApprovedComponents.every((component) => circularComponents.has(component)),
  "widgetSelectionPolicy.circularSelectionDelegation contains an unknown component"
);
assert(
  widgetSelectionPolicy.circularSelectionDelegation.mustUseApprovedSizes.every((size) => circularSizes.has(size)),
  "widgetSelectionPolicy.circularSelectionDelegation contains an unknown size"
);

assert(generatedRectangularWidgetSchema.properties.template.const === "generated_rectangular_widget", "generated rectangular schema template const is invalid");
for (const type of generatedRectangularWidgetSchema.generatedRectangularWidgetContentTypes) {
  assert(contentTypes.has(type), `generated rectangular schema contains unknown content type ${type}`);
  assert(!generatedRectangularExcludedContentTypes.has(type), `generated rectangular schema allows strict template content type ${type}`);
}
for (const type of generatedRectangularExcludedContentTypes) {
  assert(contentTypes.has(type), `generated rectangular schema excludes unknown content type ${type}`);
}
for (const icon of generatedRectangularWidgetSchema.$defs.iconToken.enum) {
  assert(iconTokens[icon], `generated rectangular schema contains unknown icon token ${icon}`);
}
for (const example of generatedRectangularWidgetSchema.examples) {
  assert(example.template === "generated_rectangular_widget", "generated rectangular example must use generated_rectangular_widget template");
  assert(generatedRectangularWidgetSchema.generatedRectangularWidgetContentTypes.includes(example.contentType), `generated rectangular example uses disallowed content type ${example.contentType}`);
  assert(example.frame.x === 0, "generated rectangular example frame.x must be 0");
  assert(example.frame.width === 205, "generated rectangular example frame.width must be 205");
  assert(example.cornerRadius === 54, "generated rectangular example cornerRadius must be 54");
  assert(Array.isArray(example.composition.blocks), "generated rectangular example composition.blocks must be an array");
  validateGeneratedRectangularComposition(example.composition, example.contentType, "generatedRectangularWidgetSchema.examples[].composition");
}

for (const [index, layout] of samples.layouts.entries()) {
  validateLayout(layout);
  const result = layoutValidator.validateLayout(layout);
  assert(result.ok, `structured validator rejected valid sample ${index + 1}: ${result.errors.map((item) => item.message).join("; ")}`);
  console.log(`valid sample ${index + 1}: accepted`);
}

for (const [index, layout] of fallbackFixtures().entries()) {
  validateLayout(layout);
  const result = layoutValidator.validateLayout(layout);
  assert(result.ok, `structured validator rejected fallback ${layout.metadata.fallbackId}: ${result.errors.map((item) => item.message).join("; ")}`);
  assert(layout.metadata.fallbackUsed === true, `fallback ${layout.metadata.fallbackId} must set metadata.fallbackUsed`);
  assert(typeof layout.metadata.fallbackReason === "string", `fallback ${layout.metadata.fallbackId} must include metadata.fallbackReason`);
  console.log(`fallback ${index + 1}: accepted (${layout.metadata.fallbackId}; ${layout.metadata.fallbackReason})`);
}

for (const [index, example] of widgetSelectionPolicy.deterministicExamples.entries()) {
  validateWidgetSelectionExample(example, index);
  console.log(`widget selection example ${index + 1}: accepted (${example.id})`);
}

const invalidCases = [
  {
    name: "extra top-level field",
    mutate(layout) {
      layout.unexpected = true;
    }
  },
  {
    name: "too many widgets",
    mutate(layout) {
      layout.widgets.push(clone(layout.widgets[0]), clone(layout.widgets[0]));
    }
  },
  {
    name: "invalid circular component",
    mutate(layout) {
      layout.widgets[0].component = "custom_gauge";
    }
  },
  {
    name: "invalid circular size",
    mutate(layout) {
      layout.widgets[0].variant.size = "XL";
    }
  },
  {
    name: "circular widget with rectangular-only content type",
    mutate(layout) {
      layout.widgets[0].contentType = "upcoming_event";
    }
  },
  {
    name: "missing required data",
    mutate(layout) {
      delete layout.widgets[0].data.progress;
    }
  },
  {
    name: "unknown icon token",
    mutate(layout) {
      layout.widgets[1].data.icon = "custom_cloud";
    }
  },
  {
    name: "icon token incompatible with content type",
    mutate(layout) {
      layout.widgets[1].data.icon = "music";
    }
  },
  {
    name: "strict template borrowed by wrong content type",
    baseLayoutIndex: 1,
    mutate(layout) {
      layout.widgets[0].contentType = "upcoming_event";
    }
  },
  {
    name: "rectangular-present layout with three widgets",
    baseLayoutIndex: 1,
    mutate(layout) {
      layout.widgets.push(clone(samples.layouts[0].widgets[0]), clone(samples.layouts[0].widgets[1]));
    }
  },
  {
    name: "time hidden behind rectangular widget",
    baseLayoutIndex: 2,
    mutate(layout) {
      layout.time.frame = { x: 18, y: 169, width: 150, height: 58 };
    }
  },
  {
    name: "off-canvas visible element",
    mutate(layout) {
      layout.widgets[0].frame.x = 170;
    }
  },
  {
    name: "rectangular widget not full width",
    baseLayoutIndex: 1,
    mutate(layout) {
      layout.widgets[0].frame.width = 180;
    }
  },
  {
    name: "date visually competes with time",
    mutate(layout) {
      layout.date.frame.width = 180;
      layout.date.style.fontSize = 42;
    }
  },
  {
    name: "time text overflows declared box",
    mutate(layout) {
      layout.time.value = "11:28 PM";
      layout.time.frame.width = 80;
    }
  }
];

for (const testCase of invalidCases) {
  const layout = clone(samples.layouts[testCase.baseLayoutIndex ?? 0]);
  testCase.mutate(layout);
  let legacyError;
  try {
    validateLayout(layout);
  } catch (error) {
    legacyError = error;
  }
  const result = layoutValidator.validateLayout(layout);
  assert(legacyError || !result.ok, `${testCase.name}: unexpectedly accepted`);
  assert(!result.ok, `${testCase.name}: structured validator unexpectedly accepted`);
  assert(result.errors.length > 0, `${testCase.name}: structured validator returned no errors`);
  console.log(`invalid case "${testCase.name}": rejected (${result.errors[0].message})`);
}
