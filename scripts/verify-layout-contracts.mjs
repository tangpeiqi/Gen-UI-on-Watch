import fs from "node:fs";
import { createLayoutValidator } from "./layout-validator.mjs";
import { generateFallbackWatchUi } from "./fallback-generator.mjs";

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
const fallbackDesignPack = {
  schema,
  materialSymbolsRegistry,
  widgetSelectionPolicy,
  generatedRectangularWidgetSchema,
  pseudoContextJson: JSON.parse(fs.readFileSync("demo-data/pseudo-context.json", "utf8")),
  pseudoContextMarkdown: fs.readFileSync("demo-data/pseudo-context.md", "utf8")
};

const circularComponents = new Set(["close_gauge", "open_gauge"]);
const rectangularTemplates = new Set(["music_control", "reminder", "timer_rectangular", "checklist_full_face", "generated_rectangular_widget"]);
const generatedRectangularExcludedContentTypes = new Set(generatedRectangularWidgetSchema.strictTemplateExcludedContentTypes);
const generatedRectangularContentTypes = new Set(generatedRectangularWidgetSchema.generatedRectangularWidgetContentTypes);
const generatedRectangularBlockTypes = new Set(["text", "inline_small_icon_text", "big_icon_text_group", "number_text_lockup", "edge_progress_bar"]);
const generatedRectangularTextUnits = new Set(["numbers", "body_emphasis", "body", "secondary"]);
const circularSizes = new Set(["S", "M", "L"]);
const circularSizeFrames = {
  S: { width: 72, height: 72 },
  M: { width: 90, height: 90 },
  L: { width: 150, height: 150 }
};
const openGaugeMetricKinds = new Set(["temperature", "current_temperature", "weather_temperature", "bpm", "heart_rate", "precipitation_probability", "rain_chance", "uv_index", "air_quality", "recovery", "pace"]);
const closeGaugeMetricKinds = new Set(["timer", "countdown", "countdown_timer", "workout", "activity", "activity_progress", "goal_progress", "exercise_goal_progress", "battery", "completion", "hydration", "focus"]);
const cornerSafeSplitTimeMinWidth = 105;
const fullWidthTimeFillRatio = 0.85;
const splitTimeFillRatio = 0.55;
const openGaugeBottomText = {
  S: { fontSize: 15, width: 48 },
  M: { fontSize: 18, width: 60 },
  L: { fontSize: 32, width: 96 }
};
const openGaugeCenterValueText = {
  S: { fontSize: 22, width: 55 },
  M: { fontSize: 32, width: 65 },
  L: { fontSize: 48, width: 115 }
};
const closeGaugeCenterValueText = {
  S: { fontSize: 22, width: 55 },
  M: { fontSize: 32, width: 65 },
  L: { fontSize: 42, width: 115 }
};
const closeGaugeFootnoteText = {
  S: { fontSize: 10, width: 40 },
  M: { fontSize: 15, width: 50 },
  L: { fontSize: 18, width: 80 }
};
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
  "multi-content-balanced-color-mode",
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

function validateTextStyle(style, path) {
  assert(style && typeof style === "object", `${path} is required`);
  assertOnlyKeys(style, new Set(["fontFamily", "fontSize", "fontWeight", "letterSpacing", "color", "treatment", "textAlign"]), path);
  assert(typeof style.fontFamily === "string" && style.fontFamily.length > 0, `${path}.fontFamily is required`);
  assert(typeof style.fontSize === "number" && style.fontSize > 0, `${path}.fontSize must be positive`);
  assert(Number.isInteger(style.fontWeight) && style.fontWeight >= 100 && style.fontWeight <= 1000, `${path}.fontWeight is invalid`);
  assert(typeof style.letterSpacing === "number", `${path}.letterSpacing must be a number`);
  assert(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(style.color), `${path}.color must be a hex color`);
  assert(["fill", "outline_stroke"].includes(style.treatment), `${path}.treatment is invalid`);
  assert(style.textAlign === undefined || ["left", "center", "right"].includes(style.textAlign), `${path}.textAlign is invalid`);
}

function rectOverlapDepth(a, b) {
  const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return Math.min(xOverlap, yOverlap);
}

function approxEqual(a, b, tolerance = 0.5) {
  return Math.abs(a - b) <= tolerance;
}

function anchorEdges(anchor) {
  if (anchor === "center") return [];
  return String(anchor || "").split("_").filter(Boolean);
}

function isCornerAnchor(anchor) {
  const edges = anchorEdges(anchor);
  return edges.length >= 2 && edges.some((edge) => ["top", "bottom"].includes(edge)) && edges.some((edge) => ["left", "right"].includes(edge));
}

function estimateTextWidth(text, fontSize) {
  return String(text).length * fontSize * 0.58;
}

function estimateWrappedTextHeight(text, fontSize, lineHeight, width) {
  const safeWidth = Math.max(1, width);
  const lines = Math.max(1, Math.ceil(estimateTextWidth(text, fontSize) / safeWidth));
  return lines * lineHeight;
}

function estimateGeneratedRectangularBlockHeight(block, innerWidth) {
  if (!block || typeof block !== "object") return 0;
  if (block.type === "text") {
    const isNumber = block.unit === "numbers";
    return estimateWrappedTextHeight(block.text || "", isNumber ? 40 : 19, isNumber ? 42.5 : 21.5, innerWidth);
  }
  if (block.type === "inline_small_icon_text") {
    return Math.max(24, estimateWrappedTextHeight(block.text || "", 19, 21.5, innerWidth - 28));
  }
  if (block.type === "big_icon_text_group") {
    const textHeight = (block.textGroup || []).reduce((total, textBlock) => total + estimateGeneratedRectangularBlockHeight(textBlock, innerWidth - 56), 0);
    return Math.max(48, textHeight);
  }
  if (block.type === "number_text_lockup") {
    const secondaryHeight = block.secondaryText ? 4 + estimateWrappedTextHeight(block.secondaryText, 19, 21.5, innerWidth) : 0;
    return 42.5 + secondaryHeight;
  }
  if (block.type === "edge_progress_bar") return 12;
  return 0;
}

function estimateGeneratedRectangularContentHeight(widget) {
  const composition = widget?.composition;
  const blocks = Array.isArray(composition?.blocks) ? composition.blocks : [];
  const padding = composition?.padding || {};
  const innerWidth = 205 - (Number(padding.left) || 0) - (Number(padding.right) || 0);
  const blocksHeight = blocks.reduce((total, block) => total + estimateGeneratedRectangularBlockHeight(block, innerWidth), 0);
  const gap = Number(composition?.gap) || 0;
  return Math.ceil((Number(padding.top) || 0) + (Number(padding.bottom) || 0) + blocksHeight + Math.max(0, blocks.length - 1) * gap);
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function hasWidgetOnSameRow(widgets, frame) {
  return widgets.some((widget) => {
    if (!widget.frame) return false;
    return Math.max(0, Math.min(frame.y + frame.height, widget.frame.y + widget.frame.height) - Math.max(frame.y, widget.frame.y)) > 0;
  });
}

function horizontalOverlap(a, b) {
  return Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
}

function circularCorner(widget) {
  const { frame } = widget;
  if (!frame) return null;
  const left = frame.x <= 22;
  const right = frame.x + frame.width >= 183;
  const top = frame.y <= 22;
  const bottom = frame.y + frame.height >= 229;
  if (top && left) return "top_left";
  if (top && right) return "top_right";
  if (bottom && left) return "bottom_left";
  if (bottom && right) return "bottom_right";
  return null;
}

function oppositeCorners(a, b) {
  return (a === "top_left" && b === "bottom_right") ||
    (a === "bottom_right" && b === "top_left") ||
    (a === "top_right" && b === "bottom_left") ||
    (a === "bottom_left" && b === "top_right");
}

function splitTimeRequired(layout) {
  const circularWidgets = (layout.widgets || []).filter((widget) => widget.shape === "circular");
  const smallOrMedium = circularWidgets.filter((widget) => ["S", "M"].includes(widget.variant?.size));
  const smallCircular = circularWidgets.filter((widget) => widget.variant?.size === "S");
  if (smallOrMedium.length === 1) return true;
  if (circularWidgets.length === 2 && smallCircular.length === 2) {
    return oppositeCorners(circularCorner(circularWidgets[0]), circularCorner(circularWidgets[1]));
  }
  if (circularWidgets.length === 3 && smallCircular.length === 3) {
    const sorted = [...smallCircular].sort((a, b) => a.frame.y - b.frame.y);
    const centerX = sorted[0].frame.x + sorted[0].frame.width / 2;
    return sorted.every((widget) => approxEqual(widget.frame.x + widget.frame.width / 2, centerX, 12));
  }
  return false;
}

function validateTimeObject(object) {
  assertOnlyKeys(object, new Set(["mode", "value", "layer", "frame", "style", "containers"]), "time");
  assert(["single_line", "split_hour_minute", "segmented_digits"].includes(object.mode), "time.mode is invalid");
  assert(typeof object.value === "string" && object.value.length > 0, "time.value is required");
  assert(object.layer === "bottom", "time.layer must be bottom");
  validateFrame(object.frame, "time.frame");
  validateTextStyle(object.style, "time.style");
  assert(object.style.fontFamily === "SF Compact", "time.style.fontFamily must be SF Compact");
  assert(Array.isArray(object.containers) && object.containers.length >= 1 && object.containers.length <= 6, "time.containers length is invalid");
  if (object.mode === "single_line") {
    assert(object.containers.length === 1, "single_line must use exactly one time container");
    assert(object.containers[0].role === "combined", "single_line time container role must be combined");
  }
  if (object.mode === "split_hour_minute") assert(object.containers.length === 2, "split_hour_minute must use exactly two time containers");
  if (object.mode === "segmented_digits") assert(object.containers.length >= 2, "segmented_digits must use at least two time containers");
  for (const [index, container] of object.containers.entries()) {
    const path = `time.containers[${index}]`;
    assertOnlyKeys(container, new Set(["id", "role", "value", "frame", "style", "anchor"]), path);
    assert(/^[a-z][a-z0-9-]*$/.test(container.id), `${path}.id is invalid`);
    assert(["combined", "hour", "minute", "digit_group", "digit", "separator"].includes(container.role), `${path}.role is invalid`);
    assert(typeof container.value === "string" && container.value.length > 0, `${path}.value is required`);
    assert(["center", "top", "left", "right", "bottom", "top_left", "top_right", "bottom_left", "bottom_right"].includes(container.anchor), `${path}.anchor is invalid`);
    assert(object.mode === "single_line" || container.anchor !== "center", `${path}.anchor cannot be center for split or segmented time`);
    if (object.mode === "single_line") {
      assert(!isCornerAnchor(container.anchor) || container.frame.width === 205, "combined time may align to a corner only when full width");
    } else {
      assert(!isCornerAnchor(container.anchor) || container.frame.width > cornerSafeSplitTimeMinWidth, `${path}.frame.width is too narrow for corner anchoring`);
    }
    assert(container.frame.width !== 205 || container.frame.x === 0, `${path}.frame.x must be 0 when width is 205`);
    assert(container.frame.width !== 205 || container.style.textAlign === undefined || container.style.textAlign === "center", `${path}.style.textAlign must be center when width is 205`);
    validateFrame(container.frame, `${path}.frame`);
    validateTextStyle(container.style, `${path}.style`);
    assert(container.style.fontFamily === "SF Compact", `${path}.style.fontFamily must be SF Compact`);
  }
}

function validateDateObject(object, time) {
  assertOnlyKeys(object, new Set(["value", "priority", "layer", "frame", "style", "stackedWithTimeContainerId", "stackGap", "edgePaddingWhenStackedFromEdge"]), "date");
  assert(/^[A-Z]{3} [0-9]{1,2}$/.test(object.value), "date.value must use compact uppercase format");
  assert(object.priority === "secondary", "date.priority must be secondary");
  assert(object.layer === "bottom", "date.layer must be bottom");
  validateFrame(object.frame, "date.frame");
  validateTextStyle(object.style, "date.style");
  assert(object.style.fontFamily === "SF Compact", "date.style.fontFamily must be SF Compact");
  assert(object.style.fontSize === 19, "date.style.fontSize must be 19");
  assert(object.style.fontWeight === 400, "date.style.fontWeight must be 400");
  assert(time.containers.some((container) => container.id === object.stackedWithTimeContainerId), "date.stackedWithTimeContainerId must reference a time container");
  assert(object.stackGap === 0, "date.stackGap must be 0");
  assert(object.edgePaddingWhenStackedFromEdge === 16, "date.edgePaddingWhenStackedFromEdge must be 16");
}

function validateColorSystem(colorSystem) {
  assert(colorSystem && typeof colorSystem === "object", "colorSystem is required");
  assertOnlyKeys(colorSystem, new Set(["mode", "accentColor", "surfaceAccentColor", "sourceRule"]), "colorSystem");
  assert(colorSystemModes.has(colorSystem.mode), "colorSystem.mode is invalid");
  assert(/^#[0-9a-fA-F]{6}$/.test(colorSystem.accentColor), "colorSystem.accentColor must be a 6-digit hex color");
  assert(/^#[0-9a-fA-F]{6}$/.test(colorSystem.surfaceAccentColor), "colorSystem.surfaceAccentColor must be a 6-digit hex color");
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
  const expectedFrame = circularSizeFrames[widget.variant.size];
  assert(widget.frame.width === expectedFrame.width && widget.frame.height === expectedFrame.height, `${path}.frame must be ${expectedFrame.width}x${expectedFrame.height} for size ${widget.variant.size}`);
  if (widget.component === "close_gauge") {
    assert(typeof widget.data.progress === "number", `${path}.data.progress is required for close_gauge`);
  }
  if (widget.variant.property === "text" || (widget.component === "open_gauge" && widget.variant.property === "icon")) {
    const variantName = widget.component === "open_gauge" && widget.variant.property === "icon" ? "open_gauge icon" : "text";
    assert(widget.data.value !== undefined && !(widget.component === "open_gauge" && widget.variant.property === "icon" && isBlank(widget.data.value)), `${path}.data.value is required for ${variantName} variant`);
  }
  if (widget.component === "close_gauge" && widget.variant.property === "text" && widget.data.value !== undefined) {
    const centerValueToken = closeGaugeCenterValueText[widget.variant.size];
    assert(!centerValueToken || estimateTextWidth(widget.data.value, centerValueToken.fontSize) <= centerValueToken.width + 2, `${path}.data.value must fit ${widget.variant.size} close_gauge center value text`);
  }
  if (widget.component === "close_gauge" && widget.variant.property === "text" && widget.data.label !== undefined) {
    const footnoteToken = closeGaugeFootnoteText[widget.variant.size];
    assert(!footnoteToken || estimateTextWidth(widget.data.label, footnoteToken.fontSize) <= footnoteToken.width + 2, `${path}.data.label must fit ${widget.variant.size} close_gauge footnote text`);
  }
  assert(!(widget.component === "close_gauge" && openGaugeMetricKinds.has(widget.data.metricKind)), `${path}.component must be open_gauge for ${widget.data.metricKind}`);
  assert(!(widget.component === "open_gauge" && closeGaugeMetricKinds.has(widget.data.metricKind)), `${path}.component must be close_gauge for ${widget.data.metricKind}`);
  if (widget.component === "open_gauge") {
    if (widget.data.value !== undefined) {
      const centerValueToken = openGaugeCenterValueText[widget.variant.size];
      assert(!centerValueToken || estimateTextWidth(widget.data.value, centerValueToken.fontSize) <= centerValueToken.width + 2, `${path}.data.value must fit ${widget.variant.size} open_gauge center value text`);
    }
    const bottomTextToken = openGaugeBottomText[widget.variant.size];
    const assertBottomText = (value, fieldPath) => {
      assert(!isBlank(value), `${fieldPath} is required for visible open_gauge bottom content`);
      assert(!bottomTextToken || estimateTextWidth(value, bottomTextToken.fontSize) <= bottomTextToken.width + 2, `${fieldPath} must fit ${widget.variant.size} open_gauge bottom text at ${bottomTextToken.fontSize}pt`);
    };
    if (widget.variant.property === "text") assertBottomText(widget.data.label, `${path}.data.label`);
    if (widget.variant.property === "range") {
      assertBottomText(widget.data.lowLabel, `${path}.data.lowLabel`);
      assertBottomText(widget.data.highLabel, `${path}.data.highLabel`);
    }
    if (widget.variant.property === "offset") assertBottomText(widget.data.referenceValue, `${path}.data.referenceValue`);
    if (widget.variant.property === "icon") assert(!isBlank(widget.data.icon), `${path}.data.icon is required for visible open_gauge icon content`);
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
  assert(widget.frame.height >= 108 && widget.frame.height <= 251, `${path}.frame.height is invalid`);
  assert(widget.cornerRadius === 54, `${path}.cornerRadius must be 54`);
  assert(widget.cornerSmoothing === 60, `${path}.cornerSmoothing must be 60`);
  assert(["black_surface", "accent_surface"].includes(widget.surfaceMode), `${path}.surfaceMode must be black_surface or accent_surface`);
  assert(["top", "bottom"].includes(widget.verticalAlignment), `${path}.verticalAlignment is invalid`);
  assert(widget.data && typeof widget.data === "object", `${path}.data is required`);
  if (widget.template === "reminder") {
    assert(typeof widget.data.content === "string", `${path}.data.content is required for reminder`);
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
    assert(widget.frame.x === 0 && widget.frame.y === 0 && widget.frame.width === 205 && widget.frame.height === 251, `${path}.frame must match the 205x251 ChecklistFace Figma component`);
    assert(widget.verticalAlignment === "top", `${path}.verticalAlignment must be top for checklist_full_face`);
    assert(widget.surfaceMode === "accent_surface", `${path}.surfaceMode must be accent_surface for checklist_full_face`);
  }
  if (widget.template === "generated_rectangular_widget") {
    validateGeneratedRectangularComposition(widget.composition, widget.contentType, `${path}.composition`);
    const requiredHeight = Math.max(108, estimateGeneratedRectangularContentHeight(widget));
    assert(widget.frame.height >= requiredHeight, `${path}.frame.height must be at least ${requiredHeight}px to fit generated rectangular content`);
  }
}

function validateGeneratedTextBlock(block, path) {
  assert(generatedRectangularTextUnits.has(block.unit), `${path}.unit is invalid`);
  assert(typeof block.text === "string" && block.text.length > 0 && block.text.length <= 36, `${path}.text is invalid`);
  if (block.maxLines !== undefined) {
    throw new Error(`${path}.maxLines is not allowed; rectangular text must wrap instead of truncating or clamping`);
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
  if (contentType === "last_message") {
    composition.blocks.forEach((block, index) => {
      assert(block.type !== "inline_small_icon_text" || index === 0, `${path}.blocks[${index}] message content must not use an icon`);
    });
  }
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
  validateTimeObject(layout.time);
  validateDateObject(layout.date, layout.time);
  if (layout.time.mode === "single_line" && layout.time.containers.length === 1) {
    const container = layout.time.containers[0];
    const visuallyFilledWidth = estimateTextWidth(container.value, container.style.fontSize);
    assert(container.frame.width !== 205 || container.frame.height < 70 || visuallyFilledWidth >= 205 * fullWidthTimeFillRatio, "full-width time must visually fill at least 85% of watch width when it has enough vertical room");
  }
  assert(Array.isArray(layout.widgets), "widgets must be an array");
  assert(layout.widgets.length <= 3, "widgets must contain at most 3 items");
  const rectangularWidgetCount = layout.widgets.filter((widget) => widget.shape === "rectangular").length;
  const hasChecklistWidget = layout.widgets.some((widget) => widget.contentType === "checklist");
  const hasChecklistFullFace = layout.widgets.some((widget) => widget.template === "checklist_full_face");
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
  if (hasChecklistFullFace) {
    const timeContainer = layout.time.containers[0];
    assert(layout.time.mode === "single_line" && layout.time.containers.length === 1, "checklist_full_face must use one compact time slot");
    assert(layout.time.frame.x === 139 && layout.time.frame.y === 16 && layout.time.frame.width === 50 && layout.time.frame.height === 22, "checklist_full_face time.frame must match the Figma slot");
    assert(timeContainer.frame.x === 139 && timeContainer.frame.y === 16 && timeContainer.frame.width === 50 && timeContainer.frame.height === 22, "checklist_full_face time container must match the Figma slot");
    assert(timeContainer.style.fontSize === 19 && timeContainer.style.fontWeight === 400 && timeContainer.style.textAlign === "right", "checklist_full_face time style must be SF Compact Regular 19pt right-aligned");
    assert(layout.date.frame.x === 16 && layout.date.frame.y === 16 && layout.date.frame.width === 70 && layout.date.frame.height === 22, "checklist_full_face date.frame must match the Figma slot");
  }
  const rectangularWidgets = layout.widgets.filter((widget) => widget.shape === "rectangular");
  const accentSurfaceWidgets = rectangularWidgets.filter((widget) => widget.surfaceMode === "accent_surface");
  assert(accentSurfaceWidgets.length <= 1, "only the most important rectangular widget may use accent_surface");
  if (rectangularWidgets.length > 0) {
    assert(rectangularWidgets[0].surfaceMode === "accent_surface", "primary rectangular widget must use accent_surface");
  }
  const contentTypeCounts = new Map();
  for (const widget of layout.widgets) {
    contentTypeCounts.set(widget.contentType, (contentTypeCounts.get(widget.contentType) || 0) + 1);
  }
  layout.widgets.forEach((widget, index) => {
    assert(!(widget.shape === "circular" && widget.component === "close_gauge" && widget.variant.property === "text" && contentTypeCounts.get(widget.contentType) === 1), `widgets[${index}].variant.property must be icon when close_gauge is the only widget for ${widget.contentType}`);
  });
  if (layout.widgets.length === 1 && layout.widgets[0].shape === "circular") {
    assert(layout.widgets[0].variant.size === "L", "single focused circular widget must use L size");
  }
  if (splitTimeRequired(layout)) {
    assert(layout.time.mode === "split_hour_minute" && layout.time.containers.length === 2, "circular layout requires split hour/minute time");
    const hour = layout.time.containers.find((container) => container.role === "hour") || layout.time.containers[0];
    const minute = layout.time.containers.find((container) => container.role === "minute") || layout.time.containers[1];
    const stackGap = Math.max(0, Math.max(hour.frame.y, minute.frame.y) - Math.min(hour.frame.y + hour.frame.height, minute.frame.y + minute.frame.height));
    assert(horizontalOverlap(hour.frame, minute.frame) > 0 && stackGap <= 4, "split hour/minute containers must stack vertically");
    const availableColumnWidth = Math.max(hour.frame.width, minute.frame.width);
    const filledColumnWidth = Math.max(estimateTextWidth(hour.value, hour.style.fontSize), estimateTextWidth(minute.value, minute.style.fontSize));
    assert(filledColumnWidth >= availableColumnWidth * splitTimeFillRatio, "split hour/minute time must fill available empty space");
  }
  for (let index = 0; index < layout.widgets.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < layout.widgets.length; nextIndex += 1) {
      const a = layout.widgets[index];
      const b = layout.widgets[nextIndex];
      const xOverlap = Math.max(0, Math.min(a.frame.x + a.frame.width, b.frame.x + b.frame.width) - Math.max(a.frame.x, b.frame.x));
      const yOverlap = Math.max(0, Math.min(a.frame.y + a.frame.height, b.frame.y + b.frame.height) - Math.max(a.frame.y, b.frame.y));
      assert(xOverlap === 0 || yOverlap === 0, `${a.id} and ${b.id} must not overlap`);
    }
  }
  const circularWidgets = layout.widgets.filter((widget) => widget.shape === "circular");
  if (layout.widgets.length === 3 && circularWidgets.length === 3) {
    const sorted = [...circularWidgets].sort((a, b) => a.frame.y - b.frame.y);
    const centerX = sorted[0].frame.x + sorted[0].frame.width / 2;
    for (const widget of sorted) {
      assert(approxEqual(widget.frame.x + widget.frame.width / 2, centerX, 12), "three circular widgets must stack vertically in one column");
    }
  }
  const textObjects = [
    ...layout.time.containers.map((container, index) => [`time.containers[${index}]`, container]),
    ["date", layout.date]
  ];
  for (const [path, textObject] of textObjects) {
    for (const widget of layout.widgets) {
      if (widget.template === "checklist_full_face") continue;
      const xOverlap = Math.max(0, Math.min(textObject.frame.x + textObject.frame.width, widget.frame.x + widget.frame.width) - Math.max(textObject.frame.x, widget.frame.x));
      const yOverlap = Math.max(0, Math.min(textObject.frame.y + textObject.frame.height, widget.frame.y + widget.frame.height) - Math.max(textObject.frame.y, widget.frame.y));
      assert(path !== "date" || xOverlap === 0 || yOverlap === 0, `date must not overlap ${widget.id}`);
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
    accentColor: "#FF375F",
    surfaceAccentColor: "#590012",
    sourceRule: "one-content-type-prefers-mono-tone"
  };
  oneCircular.time.style.color = "#FF375F";
  oneCircular.time.frame = { x: 0, y: 178, width: 205, height: 73 };
  oneCircular.time.style.fontSize = 84;
  oneCircular.time.containers[0].frame = { x: 0, y: 178, width: 205, height: 73 };
  oneCircular.time.containers[0].style.fontSize = 84;
  oneCircular.time.containers[0].style.color = "#FF375F";
  oneCircular.date.style.color = "#FF375F";
  oneCircular.date.frame = { x: 0, y: 156, width: 70, height: 22 };
  oneCircular.widgets = [clone(samples.layouts[0].widgets[0])];
  oneCircular.widgets[0].variant.size = "L";
  oneCircular.widgets[0].frame = { x: 28, y: 6, width: 150, height: 150 };
  oneCircular.layers.top = oneCircular.widgets.map((widget) => widget.id);

  const twoCircular = markFallback(clone(samples.layouts[0]), "two-circular-widgets-with-compact-time");

  const oneRectangle = markFallback(clone(samples.layouts[1]), "one-rectangular-widget");

  const mixed = markFallback(clone(samples.layouts[2]), "mixed-circular-and-rectangular-layout");
  mixed.metadata.selectedContentTypes = ["workout", "upcoming_event", "weather"];
  mixed.colorSystem = {
    mode: "multicolor",
    accentColor: "#FF375F",
    surfaceAccentColor: "#590012",
    sourceRule: "two-content-types-prefers-multicolor"
  };
  mixed.time.style.color = "#FFFFFF";
  mixed.time.containers[0].style.color = "#FFFFFF";
  mixed.date.style.color = "#FFFFFF";
  mixed.time.mode = "split_hour_minute";
  mixed.time.frame = { x: 0, y: 0, width: 110, height: 78 };
  mixed.time.style.fontSize = 56;
  mixed.time.containers = [
    {
      id: "time-hour",
      role: "hour",
      value: "6",
      frame: { x: 0, y: 0, width: 110, height: 39 },
      style: { ...mixed.time.style, fontSize: 56 },
      anchor: "left"
    },
    {
      id: "time-minute",
      role: "minute",
      value: "42",
      frame: { x: 0, y: 39, width: 110, height: 39 },
      style: { ...mixed.time.style, fontSize: 56 },
      anchor: "left"
    }
  ];
  mixed.date.frame = { x: 0, y: 78, width: 70, height: 22 };
  mixed.date.stackedWithTimeContainerId = "time-minute";
  mixed.widgets = [clone(samples.layouts[0].widgets[0]), clone(samples.layouts[2].widgets[0])];
  mixed.widgets[0].id = "fallback-workout";
  mixed.widgets[0].frame = { x: 127, y: 16, width: 72, height: 72 };
  mixed.layers.top = mixed.widgets.map((widget) => widget.id);

  const threeCompact = markFallback(clone(samples.layouts[0]), "three-compact-widgets");
  threeCompact.metadata.selectedContentTypes = ["workout", "weather", "timer"];
  threeCompact.colorSystem = {
    mode: "multicolor",
    accentColor: "#FF375F",
    surfaceAccentColor: "#590012",
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
      variant: { property: "icon", size: "S" },
      data: {
        icon: "timer",
        progress: 0.27,
        metricKind: "timer"
      },
      frame: { x: 127, y: 173, width: 72, height: 72 },
      layer: "top"
    }
  ];
  threeCompact.widgets[0].id = "fallback-workout";
  threeCompact.widgets[0].frame = { x: 127, y: 6, width: 72, height: 72 };
  threeCompact.widgets[1].id = "fallback-weather";
  threeCompact.widgets[1].frame = { x: 127, y: 89.5, width: 72, height: 72 };
  threeCompact.time.mode = "split_hour_minute";
  threeCompact.time.frame = { x: 0, y: 54, width: 110, height: 152 };
  threeCompact.time.style.fontSize = 82;
  threeCompact.time.containers = [
    {
      id: "time-hour",
      role: "hour",
      value: "5",
      frame: { x: 0, y: 54, width: 110, height: 76 },
      style: { ...threeCompact.time.style, fontSize: 82 },
      anchor: "left"
    },
    {
      id: "time-minute",
      role: "minute",
      value: "42",
      frame: { x: 0, y: 130, width: 110, height: 76 },
      style: { ...threeCompact.time.style, fontSize: 82 },
      anchor: "left"
    }
  ];
  threeCompact.date.frame = { x: 0, y: 32, width: 70, height: 22 };
  threeCompact.date.stackedWithTimeContainerId = "time-hour";
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
  assert(example.frame.height >= 108, "generated rectangular example frame.height must be at least 108");
  assert(example.cornerRadius === 54, "generated rectangular example cornerRadius must be 54");
  assert(example.cornerSmoothing === 60, "generated rectangular example cornerSmoothing must be 60");
  assert(["black_surface", "accent_surface"].includes(example.surfaceMode), "generated rectangular example surfaceMode must be black_surface or accent_surface");
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

const messageFallback = generateFallbackWatchUi({
  context: {
    timeOfDay: "12:10AM",
    location: "office",
    activity: "lunch break",
    goal: "what is my latest message?"
  },
  designPack: {
    schema,
    materialSymbolsRegistry,
    widgetSelectionPolicy,
    generatedRectangularWidgetSchema,
    pseudoContextJson: JSON.parse(fs.readFileSync("demo-data/pseudo-context.json", "utf8")),
    pseudoContextMarkdown: fs.readFileSync("demo-data/pseudo-context.md", "utf8")
  },
  now: new Date("2026-08-04T11:18:18-07:00")
});
assert(messageFallback.selectedContentTypes.includes("last_message"), "latest message goal must select last_message");
assert(messageFallback.layout.widgets[0]?.contentType === "last_message", "latest message fallback must render last_message");
assert(messageFallback.layout.widgets[0].composition.blocks[1].type === "text", "latest message body must render as plain text");
assert(messageFallback.validation.ok, `latest message fallback rejected: ${messageFallback.validation.errors.map((item) => item.message).join("; ")}`);
console.log("latest message fallback: accepted");

const checklistFallback = generateFallbackWatchUi({
  context: {
    timeOfDay: "6:20PM",
    location: "home",
    activity: "dinner prep",
    goal: "show my checklist"
  },
  designPack: {
    schema,
    materialSymbolsRegistry,
    widgetSelectionPolicy,
    generatedRectangularWidgetSchema,
    pseudoContextJson: JSON.parse(fs.readFileSync("demo-data/pseudo-context.json", "utf8")),
    pseudoContextMarkdown: fs.readFileSync("demo-data/pseudo-context.md", "utf8")
  },
  now: new Date("2026-08-04T18:20:00-07:00")
});
assert(checklistFallback.selectedContentTypes.includes("checklist"), "checklist goal must select checklist");
assert(checklistFallback.layout.widgets.length === 1, "checklist fallback must render exactly one widget");
assert(checklistFallback.layout.widgets[0].template === "checklist_full_face", "checklist fallback must use checklist_full_face");
assert(checklistFallback.layout.widgets[0].frame.height === 251, "checklist fallback must use full component height");
assert(checklistFallback.layout.time.frame.x === 139 && checklistFallback.layout.time.frame.y === 16, "checklist fallback time must use the Figma component slot");
assert(checklistFallback.layout.date.frame.x === 16 && checklistFallback.layout.date.frame.y === 16, "checklist fallback date must use the Figma component slot");
assert(checklistFallback.validation.ok, `checklist fallback rejected: ${checklistFallback.validation.errors.map((item) => item.message).join("; ")}`);
console.log("checklist fallback: accepted");

const workoutSummaryFallback = generateFallbackWatchUi({
  context: {
    timeOfDay: "6:58PM",
    location: "outdoor",
    activity: "finish running",
    goal: "check my exercise summary"
  },
  designPack: {
    schema,
    materialSymbolsRegistry,
    widgetSelectionPolicy,
    generatedRectangularWidgetSchema,
    pseudoContextJson: JSON.parse(fs.readFileSync("demo-data/pseudo-context.json", "utf8")),
    pseudoContextMarkdown: fs.readFileSync("demo-data/pseudo-context.md", "utf8")
  },
  now: new Date("2026-08-04T18:58:00-07:00")
});
assert(workoutSummaryFallback.selectedContentTypes.includes("workout"), "exercise summary goal must select workout");
assert(workoutSummaryFallback.layout.widgets[0]?.contentType === "workout", "exercise summary fallback must render workout");
assert(workoutSummaryFallback.layout.widgets[0].shape === "rectangular", "exercise summary fallback must use a rectangular workout widget");
assert(workoutSummaryFallback.layout.widgets[0].template === "generated_rectangular_widget", "exercise summary fallback must use generated_rectangular_widget");
assert(workoutSummaryFallback.validation.ok, `exercise summary fallback rejected: ${workoutSummaryFallback.validation.errors.map((item) => item.message).join("; ")}`);
console.log("workout summary fallback: accepted");

const timerSetupFallback = generateFallbackWatchUi({
  context: {
    timeOfDay: "7:30PM",
    location: "kitchen",
    activity: "cooking dinner",
    goal: "set an 20 min timer for my salmon"
  },
  designPack: {
    schema,
    materialSymbolsRegistry,
    widgetSelectionPolicy,
    generatedRectangularWidgetSchema,
    pseudoContextJson: JSON.parse(fs.readFileSync("demo-data/pseudo-context.json", "utf8")),
    pseudoContextMarkdown: fs.readFileSync("demo-data/pseudo-context.md", "utf8")
  },
  now: new Date("2026-08-04T19:30:00-07:00")
});
assert(timerSetupFallback.selectedContentTypes.includes("timer"), "timer setup goal must select timer");
assert(timerSetupFallback.layout.widgets[0]?.contentType === "timer", "timer setup fallback must render timer");
assert(timerSetupFallback.layout.widgets[0].shape === "rectangular", "timer setup fallback must use a rectangular timer widget");
assert(timerSetupFallback.layout.widgets[0].template === "timer_rectangular", "timer setup fallback must use timer_rectangular");
assert(timerSetupFallback.layout.widgets[0].data.countdown === "20:00", "timer setup fallback must preserve the requested duration");
assert(timerSetupFallback.validation.ok, `timer setup fallback rejected: ${timerSetupFallback.validation.errors.map((item) => item.message).join("; ")}`);
console.log("timer setup fallback: accepted");

const iotControlFallback = generateFallbackWatchUi({
  context: {
    timeOfDay: "7:30PM",
    location: "kitchen",
    activity: "cooking dinner",
    goal: "set the kitchen thermostat to 70 degrees"
  },
  designPack: {
    schema,
    materialSymbolsRegistry,
    widgetSelectionPolicy,
    generatedRectangularWidgetSchema,
    pseudoContextJson: JSON.parse(fs.readFileSync("demo-data/pseudo-context.json", "utf8")),
    pseudoContextMarkdown: fs.readFileSync("demo-data/pseudo-context.md", "utf8")
  },
  now: new Date("2026-08-04T19:30:00-07:00")
});
assert(iotControlFallback.selectedContentTypes.includes("iot_control"), "iot control goal must select iot_control");
assert(iotControlFallback.layout.widgets[0]?.contentType === "iot_control", "iot control fallback must render iot_control");
assert(iotControlFallback.layout.widgets[0].shape === "rectangular", "iot control fallback must use a rectangular iot widget");
assert(iotControlFallback.layout.widgets[0].template === "generated_rectangular_widget", "iot control fallback must use generated_rectangular_widget");
assert(iotControlFallback.validation.ok, `iot control fallback rejected: ${iotControlFallback.validation.errors.map((item) => item.message).join("; ")}`);
console.log("iot control fallback: accepted");

const weatherOnlyFallback = generateFallbackWatchUi({
  context: {
    timeOfDay: "11PM",
    location: "bedroom",
    activity: "read to sleep",
    goal: "what's tomorrow's weather?"
  },
  designPack: {
    schema,
    materialSymbolsRegistry,
    widgetSelectionPolicy,
    generatedRectangularWidgetSchema,
    pseudoContextJson: JSON.parse(fs.readFileSync("demo-data/pseudo-context.json", "utf8")),
    pseudoContextMarkdown: fs.readFileSync("demo-data/pseudo-context.md", "utf8")
  },
  now: new Date("2026-08-04T23:00:00-07:00")
});
assert(weatherOnlyFallback.selectedContentTypes.length === 1 && weatherOnlyFallback.selectedContentTypes[0] === "weather", "weather-only goal must select only weather");
assert(weatherOnlyFallback.layout.widgets.every((widget) => widget.contentType === "weather"), "weather-only fallback must render weather widgets");
assert(
  weatherOnlyFallback.layout.widgets.length === 3 && weatherOnlyFallback.layout.widgets.every((widget) => widget.shape === "circular" && widget.variant.size === "S") ||
    weatherOnlyFallback.layout.widgets.length === 1 && weatherOnlyFallback.layout.widgets[0].shape === "rectangular",
  "weather-only fallback must use either one rectangular weather summary or three S circular weather widgets"
);
assert(weatherOnlyFallback.layout.widgets.length !== 1 || weatherOnlyFallback.layout.widgets[0].variant?.size !== "L", "weather-only fallback must not use one L circular widget");
assert(weatherOnlyFallback.validation.ok, `weather-only fallback rejected: ${weatherOnlyFallback.validation.errors.map((item) => item.message).join("; ")}`);
console.log("weather-only fallback: accepted");

const multiContentColorModes = new Set(
  [
    "meeting and weather",
    "run and timer status",
    "commute and rain",
    "weather for commute"
  ].map((goal) => {
    const result = generateFallbackWatchUi({
      context: {
        timeOfDay: "8:12",
        location: "San Francisco",
        activity: "",
        goal
      },
      designPack: fallbackDesignPack,
      now: new Date("2026-08-04T08:12:00-07:00")
    });
    const renderedTypes = new Set(result.layout.widgets.map((widget) => widget.contentType));
    assert(renderedTypes.size > 1, `${goal} must render multiple content types for color balancing coverage`);
    assert(result.layout.colorSystem.sourceRule === "multi-content-balanced-color-mode", `${goal} must use balanced multi-content color source rule`);
    assert(result.validation.ok, `${goal} color-balance fallback rejected: ${result.validation.errors.map((item) => item.message).join("; ")}`);
    return result.layout.colorSystem.mode;
  })
);
assert(multiContentColorModes.has("mono_tone"), "multi-content fallback balancing must include mono_tone cases");
assert(multiContentColorModes.has("multicolor"), "multi-content fallback balancing must include multicolor cases");
console.log("multi-content color balancing fallback: accepted");

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
    name: "widgets overlap each other",
    mutate(layout) {
      layout.widgets[1].frame = { x: 67, y: 20, width: 72, height: 72 };
    }
  },
  {
    name: "three circular widgets arranged horizontally",
    mutate(layout) {
      layout.metadata.selectedContentTypes = ["workout", "timer", "weather"];
      layout.widgets = [
        clone(layout.widgets[0]),
        {
          id: "timer-horizontal",
          contentType: "timer",
          shape: "circular",
          component: "close_gauge",
          variant: { property: "icon", size: "S" },
          data: { icon: "timer", progress: 0.73, metricKind: "countdown_timer" },
          frame: { x: 67, y: 20, width: 72, height: 72 },
          layer: "top"
        },
        clone(layout.widgets[1])
      ];
      layout.widgets[0].frame = { x: 16, y: 20, width: 72, height: 72 };
      layout.widgets[2].frame = { x: 118, y: 20, width: 72, height: 72 };
    }
  },
  {
    name: "combined time corner anchor without full width",
    mutate(layout) {
      layout.time.frame.width = 150;
      layout.time.containers[0].frame.width = 150;
    }
  },
  {
    name: "full-width time underfills container",
    mutate(layout) {
      layout.time.value = "2:41";
      layout.time.style.fontSize = 64;
      layout.time.frame = { x: 0, y: 178, width: 205, height: 73 };
      layout.time.containers[0].value = "2:41";
      layout.time.containers[0].style.fontSize = 64;
      layout.time.containers[0].frame = { x: 0, y: 178, width: 205, height: 73 };
      layout.date.frame = { x: 0, y: 156, width: 70, height: 22 };
    }
  },
  {
    name: "full-width time is not center aligned",
    mutate(layout) {
      layout.time.style.textAlign = "right";
      layout.time.containers[0].style.textAlign = "right";
    }
  },
  {
    name: "last message content uses icon",
    mutate(layout) {
      layout.metadata.selectedContentTypes = ["last_message"];
      layout.widgets = [clone(samples.layouts[2].widgets[0])];
      layout.widgets[0].id = "latest-message";
      layout.widgets[0].contentType = "last_message";
      layout.widgets[0].data = { icon: "message", value: "Alex", label: "2:05 PM", metricKind: "latest_message" };
      layout.widgets[0].composition = {
        layout: "vertical",
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
        gap: 8,
        verticalAlignment: "center",
        blocks: [
          { type: "inline_small_icon_text", icon: "message", textUnit: "secondary", text: "Alex · 2:05 PM" },
          { type: "inline_small_icon_text", icon: "message", textUnit: "body_emphasis", text: "Board games and extra cups" }
        ]
      };
      layout.widgets[0].frame = { x: 0, y: 0, width: 205, height: 108 };
      layout.widgets[0].surfaceMode = "accent_surface";
      layout.layers.top = ["latest-message"];
    }
  },
  {
    name: "checklist invented partial watch face",
    mutate(layout) {
      layout.metadata.selectedContentTypes = ["checklist"];
      layout.time.value = "6:20";
      layout.time.frame = { x: 0, y: 0, width: 205, height: 73 };
      layout.time.style.fontSize = 84;
      layout.time.containers[0].value = "6:20";
      layout.time.containers[0].frame = { x: 0, y: 0, width: 205, height: 73 };
      layout.time.containers[0].style.fontSize = 84;
      layout.time.containers[0].anchor = "top_left";
      layout.date.frame = { x: 16, y: 73, width: 70, height: 22 };
      layout.widgets = [
        {
          id: "invented-checklist",
          contentType: "checklist",
          shape: "rectangular",
          template: "checklist_full_face",
          data: {
            title: "Checklist",
            items: [{ text: "Board games", checked: false }]
          },
          frame: { x: 0, y: 94, width: 205, height: 157 },
          layer: "top",
          cornerRadius: 54,
          cornerSmoothing: 60,
          surfaceMode: "accent_surface",
          verticalAlignment: "bottom"
        }
      ];
      layout.layers.top = ["invented-checklist"];
    }
  },
  {
    name: "top-corner date followed by time in wrong direction",
    mutate(layout) {
      layout.time.value = "5:42";
      layout.time.style.fontSize = 84;
      layout.time.frame = { x: 0, y: 0, width: 205, height: 16 };
      layout.time.containers[0].value = "5:42";
      layout.time.containers[0].style.fontSize = 84;
      layout.time.containers[0].frame = { x: 0, y: 0, width: 205, height: 16 };
      layout.time.containers[0].anchor = "top_left";
      layout.date.frame = { x: 16, y: 16, width: 70, height: 22 };
    }
  },
  {
    name: "bottom-corner date followed by time in wrong direction",
    mutate(layout) {
      layout.time.value = "5:42";
      layout.time.style.fontSize = 84;
      layout.time.frame = { x: 0, y: 235, width: 205, height: 16 };
      layout.time.containers[0].value = "5:42";
      layout.time.containers[0].style.fontSize = 84;
      layout.time.containers[0].frame = { x: 0, y: 235, width: 205, height: 16 };
      layout.time.containers[0].anchor = "bottom_left";
      layout.date.frame = { x: 16, y: 213, width: 70, height: 22 };
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
    name: "circular widget smaller than fixed size token",
    mutate(layout) {
      layout.widgets[0].frame = { x: 118, y: 20, width: 56, height: 56 };
    }
  },
  {
    name: "closed gauge footnote text too long",
    mutate(layout) {
      layout.widgets[0].variant.property = "text";
      layout.widgets[0].data.value = "42";
      layout.widgets[0].data.label = "minutes remaining";
    }
  },
  {
    name: "closed gauge center value text too long",
    mutate(layout) {
      layout.widgets[0].variant.property = "text";
      layout.widgets[0].data.value = "123456789";
    }
  },
  {
    name: "solo close gauge uses text variant",
    mutate(layout) {
      layout.widgets = [layout.widgets[0]];
      layout.layers.top = [layout.widgets[0].id];
      layout.widgets[0].variant.property = "text";
      layout.widgets[0].variant.size = "L";
      layout.widgets[0].frame = { x: 28, y: 6, width: 150, height: 150 };
      layout.widgets[0].data.value = "42";
      delete layout.widgets[0].data.icon;
    }
  },
  {
    name: "open gauge text missing bottom label",
    mutate(layout) {
      layout.widgets[1].variant.property = "text";
      delete layout.widgets[1].data.label;
    }
  },
  {
    name: "open gauge icon missing center value",
    mutate(layout) {
      layout.widgets[1].variant.property = "icon";
      layout.widgets[1].data.icon = "weather_rain";
      delete layout.widgets[1].data.value;
    }
  },
  {
    name: "open gauge center value text too long",
    mutate(layout) {
      layout.widgets[1].variant.property = "text";
      layout.widgets[1].data.value = "123456789";
      layout.widgets[1].data.label = "bpm";
    }
  },
  {
    name: "open gauge bottom text too long",
    mutate(layout) {
      layout.widgets[1].variant.property = "text";
      layout.widgets[1].data.label = "precipitation probability";
    }
  },
  {
    name: "range metric rendered as closed gauge",
    mutate(layout) {
      layout.widgets[0].contentType = "heart_rate";
      layout.widgets[0].data.metricKind = "heart_rate";
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
    name: "generated rectangular text attempts line clamp",
    baseLayoutIndex: 2,
    mutate(layout) {
      layout.widgets[0].composition.blocks.unshift({
        type: "text",
        unit: "secondary",
        text: "Long status wraps",
        maxLines: 1
      });
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
