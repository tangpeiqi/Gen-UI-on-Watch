import { fitTimeLayout } from "./time-layout.mjs";
import { circularGenerationTokens } from "./design-contracts.mjs";

const DEFAULT_OPENAI_MODEL = "gpt-5.6-terra";
const PROMPT_VERSION = "watch-face-phase-9-openai-v4";

const ACCENT_BY_CONTENT_TYPE = {
  weather: "#3CD3FE",
  upcoming_event: "#00D2E0",
  workout: "#FF375F",
  activity_summary: "#FF375F",
  timer: "#FF9230",
  heart_rate: "#FF4245",
  iot_control: "#00DAC3",
  map_navigation: "#6D7CFF",
  last_message: "#0091FF",
  sleep_summary: "#DB34F2",
  music_control: "#30D158",
  reminder: "#FFD600",
  checklist: "#B78A66"
};

const ACCENT_SURFACE_BY_CONTENT_TYPE = {
  weather: "#004559",
  upcoming_event: "#005459",
  workout: "#590012",
  activity_summary: "#590012",
  timer: "#592A00",
  heart_rate: "#590001",
  iot_control: "#005950",
  map_navigation: "#000959",
  last_message: "#003359",
  sleep_summary: "#4E0059",
  music_control: "#004D13",
  reminder: "#594B00",
  checklist: "#592800"
};

function explicitColorModeFromContext(context = {}) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  if (/(multicolor|multi-color|colorful|different colors|varied colors|separate colors|more colors)/.test(text)) return "multicolor";
  if (/(mono[-\s]?tone|monotone|monochrome|single color|one color|same color)/.test(text)) return "mono_tone";
  return null;
}

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function balancedColorModeForContext(context = {}, renderedContentTypes = []) {
  const seed = [
    [...renderedContentTypes].sort().join("|"),
    context.activity || "",
    context.goal || "",
    context.location || "",
    context.timeOfDay || ""
  ].join("::").toLowerCase();
  return stableHash(seed) % 2 === 0 ? "mono_tone" : "multicolor";
}

function renderedContentTypesForLayout(layout) {
  return [...new Set((Array.isArray(layout.widgets) ? layout.widgets : []).map((widget) => widget.contentType).filter(Boolean))];
}

function rebalanceLayoutColorSystem(layout, context = {}) {
  if (!layout.colorSystem || typeof layout.colorSystem !== "object") layout.colorSystem = {};
  const renderedContentTypes = renderedContentTypesForLayout(layout);
  const selectedContentTypes = Array.isArray(layout.metadata?.selectedContentTypes) ? layout.metadata.selectedContentTypes : [];
  const semanticCount = renderedContentTypes.length || new Set(selectedContentTypes).size;
  const primaryContentType = renderedContentTypes[0] || selectedContentTypes[0];
  const explicitMode = explicitColorModeFromContext(context);

  layout.colorSystem.mode = explicitMode || (semanticCount <= 1
    ? "mono_tone"
    : balancedColorModeForContext(context, renderedContentTypes));
  layout.colorSystem.sourceRule = explicitMode
    ? "user-context-explicit-color-mode"
    : semanticCount <= 1
      ? "one-content-type-prefers-mono-tone"
      : "multi-content-balanced-color-mode";

  if (!/^#[0-9a-fA-F]{6}$/.test(layout.colorSystem.accentColor || "")) {
    layout.colorSystem.accentColor = ACCENT_BY_CONTENT_TYPE[primaryContentType] || "#D94C00";
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(layout.colorSystem.surfaceAccentColor || "")) {
    layout.colorSystem.surfaceAccentColor = ACCENT_SURFACE_BY_CONTENT_TYPE[primaryContentType] || "#592A00";
  }

  const timeAndDateColor = layout.colorSystem.mode === "mono_tone" ? layout.colorSystem.accentColor : "#FFFFFF";
  if (layout.time?.style) layout.time.style.color = timeAndDateColor;
  if (Array.isArray(layout.time?.containers)) {
    for (const container of layout.time.containers) {
      if (container?.style) container.style.color = timeAndDateColor;
    }
  }
  if (layout.date?.style) layout.date.style.color = timeAndDateColor;
}

function compactJson(value) {
  return JSON.stringify(value, null, 2);
}

function buildResponseSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["layoutJson"],
    properties: {
      layoutJson: {
        type: "string"
      }
    }
  };
}

export function buildPromptPayload({ context, preferences, designPack, currentTime, validationFeedback = [], retryCount = 0 }) {
  const contentTypes = designPack.schema.$defs.contentType.enum;
  const iconTokens = Object.fromEntries(
    Object.entries(designPack.materialSymbolsRegistry.tokens).map(([token, spec]) => [
      token,
      { materialSymbol: spec.materialSymbol, allowedContentTypes: spec.allowedContentTypes }
    ])
  );

  return {
    runtimeWorkflow: designPack.runtimeWorkflow,
    widgetSelectionPolicy: designPack.widgetSelectionPolicy,
    widgetContentTypes: designPack.widgetContentTypes,
    widgetDesignResources: designPack.widgetDesignResources,
    generationGuide: designPack.generationGuide,
    layoutSchema: designPack.schema,
    liveContext: context,
    requestPreferences: preferences,
    currentTime,
    retryAttempt: retryCount,
    previousValidationFailures: validationFeedback,
    canvas: {
      width: 205,
      height: 251,
      borderRadius: 54,
      targetContainer: "Gen Watch Face"
    },
    pseudoContextJson: designPack.pseudoContextJson,
    schemaVersion: designPack.schema.properties.schemaVersion.const,
    availableContentTypes: contentTypes,
    materialSymbolsRegistry: iconTokens,
    requiredLayoutContract: {
      topLevelKeysOnly: ["schemaVersion", "targetContainer", "metadata", "canvas", "colorSystem", "time", "date", "widgets", "layers"],
      forbiddenTopLevelKeys: ["composition", "deferredContentTypes", "reasoning", "notes"],
      timeObjectKeysOnly: ["mode", "value", "layer", "frame", "style", "containers"],
      timeContainerKeysOnly: ["id", "role", "value", "frame", "style", "anchor"],
      dateObjectKeysOnly: ["value", "priority", "layer", "frame", "style", "stackedWithTimeContainerId", "stackGap", "edgePaddingWhenStackedFromEdge"],
      textStyleKeysOnly: ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "color", "treatment", "textAlign"],
      circularWidgetKeysOnly: ["id", "contentType", "shape", "component", "variant", "data", "frame", "layer"],
      rectangularWidgetKeysOnly: ["id", "contentType", "shape", "template", "data", "composition", "frame", "layer", "cornerRadius", "cornerSmoothing", "surfaceMode", "verticalAlignment"]
    },
    validLayoutExample: {
      ...designPack.sampleLayouts.layouts[0],
      metadata: {
        ...designPack.sampleLayouts.layouts[0].metadata,
        provider: "openai",
        model: openAiModel(),
        pipelinePhase: "phase-9-openai-structured-output",
        promptVersion: PROMPT_VERSION,
        fallbackUsed: false,
        retryCount
      }
    },
    validGeneratedRectangularWidgetExample: {
      id: "event-eta",
      contentType: "upcoming_event",
      shape: "rectangular",
      template: "generated_rectangular_widget",
      data: {
        icon: "calendar",
        value: "12",
        label: "min",
        metricKind: "upcoming_event"
      },
      composition: {
        layout: "vertical",
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
        gap: 8,
        verticalAlignment: "center",
        blocks: [
          {
            type: "inline_small_icon_text",
            icon: "calendar",
            textUnit: "secondary",
            text: "Dinner at 7:30"
          },
          {
            type: "number_text_lockup",
            value: "12",
            unitLabel: "min",
            secondaryText: "to leave"
          }
        ]
      },
      frame: { x: 0, y: 124, width: 205, height: 127 },
      layer: "top",
      cornerRadius: 54,
      cornerSmoothing: 60,
      surfaceMode: "accent_surface",
      verticalAlignment: "bottom"
    },
    circularTokens: circularGenerationTokens(designPack.circularVisualSpecs),
    generatedRectangularWidgetSchema: designPack.generatedRectangularWidgetSchema,
    orderedPipelineSteps: [
      "read-live-context",
      "load-pseudo-context",
      "select-widgets-using-policy",
      "design-complete-widgets-using-widget-resources",
      "compose-watch-face-using-generation-guide",
      "validate",
      "render"
    ]
  };
}

export function buildSystemPrompt(designPack) {
  return [
    "You generate Apple Watch face UI layout JSON for the Gen UI on Watch simulator.",
    "Return only a JSON object matching the supplied structured output schema. Put the complete watch-face layout JSON object in layoutJson as a serialized JSON string.",
    "The JSON string inside layoutJson must parse to the exact watch-face layout contract shown in validLayoutExample. Copy that nesting style.",
    "The renderer owns HTML, CSS, SVG, and Material Symbols rendering. Do not output code.",
    `Set metadata.provider to openai, metadata.pipelinePhase to phase-9-openai-structured-output, metadata.promptVersion to ${PROMPT_VERSION}, metadata.fallbackUsed to false, metadata.retryCount to the supplied retryAttempt number, and metadata.contextSource to live_context_plus_pseudo_context.`,
    "For activity_summary, select the latest snapshot on the requested day at or before the runtime time; use cumulative times directly, never sum snapshots. For heart_rate, select the latest reading on that day at or before runtime time; derive age and daily high/low only from readings already available. For iot_control, select the latest available snapshot for the requested device, even if the user is away from the device. Never use future measurements; show unavailable data explicitly when no reading qualifies. For reminders, use the requested day and relevant task wording, choose the nearest upcoming due reminder, or the most recently due relevant reminder if none remain upcoming. Treat before-bedtime as a day-end window. Do not infer, track, filter, or update reminder completion state; completion actions are UI affordances only.",
    "For weather current_temperature, use the latest weather_temperature_reading in pseudoContextJson.timeline on the requested day at or before the requested time. Combine it with that day’s condition, high/low, precipitation, and wind. Do not use a future reading, a thermostat temperature, or invent a reading before the first sample. Tomorrow is forecast-only and has no current temperature observation.",
    designPack.runtimeWorkflow
  ].join("\n\n");
}

function extractOutputText(responseJson) {
  if (typeof responseJson.output_text === "string") return responseJson.output_text;
  for (const item of responseJson.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") return content.text;
      if (typeof content.output_text === "string") return content.output_text;
    }
  }
  throw new Error("OpenAI response did not include output text.");
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

function unionFrame(frames) {
  const left = Math.min(...frames.map((frame) => frame.x));
  const top = Math.min(...frames.map((frame) => frame.y));
  const right = Math.max(...frames.map((frame) => frame.x + frame.width));
  const bottom = Math.max(...frames.map((frame) => frame.y + frame.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function compactDateLabel(input) {
  const date = input ? new Date(input) : new Date();
  if (Number.isNaN(date.getTime())) return "SUN 2";
  const weekday = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()];
  return `${weekday} ${date.getDate()}`;
}

function normalizeDateLabel(value, currentTime) {
  if (/^[A-Z]{3} [0-9]{1,2}$/.test(value || "")) return value;
  const match = String(value || "").match(/([A-Za-z]{3,9})\D+([0-9]{1,2})/);
  if (!match) return compactDateLabel(currentTime);
  return `${match[1].slice(0, 3).toUpperCase()} ${Number(match[2])}`;
}

function truncateDisplayText(value, maxLength = 36) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "").trim() || text.slice(0, maxLength).trim();
}

function normalizeGeneratedRectangularComposition(widget) {
  const blocks = widget.composition?.blocks;
  if (!Array.isArray(blocks)) return;
  widget.composition.padding = {
    top: widget.composition.padding?.top === 0 ? 0 : 16,
    right: 16,
    bottom: widget.composition.padding?.bottom === 0 ? 0 : 16,
    left: 16
  };
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (!block || typeof block !== "object") continue;
    if (block.type === "inline_small_icon_text") {
      if (block.textUnit === "primary") block.textUnit = "body_emphasis";
      block.text = truncateDisplayText(block.text);
    }
    if (block.type === "text") {
      if (block.unit === "primary") block.unit = "body_emphasis";
      block.text = truncateDisplayText(block.text);
    }
  }
  if (widget.contentType === "last_message") {
    for (let index = 1; index < blocks.length; index += 1) {
      const block = blocks[index];
      if (block?.type === "inline_small_icon_text") {
        blocks[index] = {
          type: "text",
          unit: block.textUnit === "secondary" ? "body" : block.textUnit || "body_emphasis",
          text: truncateDisplayText(block.text)
        };
      }
    }
  }
}

function resizeRectangularWidgetToContent(widget) {
  if (widget.template === "generated_rectangular_widget") {
    const requiredHeight = Math.max(108, estimateGeneratedRectangularContentHeight(widget));
    widget.frame = widget.frame || { x: 0, y: 251 - requiredHeight, width: 205, height: requiredHeight };
    widget.frame.height = Math.min(251, Math.max(widget.frame.height || 0, requiredHeight));
  }
  if (!widget.frame) return;
  widget.frame.x = 0;
  widget.frame.width = 205;
  if (widget.verticalAlignment === "top") {
    widget.frame.y = 0;
  } else {
    widget.verticalAlignment = "bottom";
    widget.frame.y = Math.max(0, 251 - widget.frame.height);
  }
}

function fitTimeAndDateAboveBottomRectangle(layout) {
  if (!Array.isArray(layout.widgets)) return;
  const bottomRectangle = layout.widgets.find((widget) => widget.shape === "rectangular" && widget.template !== "checklist_full_face" && widget.verticalAlignment === "bottom");
  if (!bottomRectangle?.frame || !layout.time || !layout.date) return;
  const availableHeight = Math.max(0, bottomRectangle.frame.y);
  if (availableHeight < 64) return;
  const dateHeight = 22;
  const timeHeight = Math.max(42, availableHeight - dateHeight);
  const timeValue = layout.time.value || layout.time.containers?.[0]?.value || "";
  const timeColor = layout.time.style?.color || layout.colorSystem?.accentColor || "#FFFFFF";
  const timeFontSize = Math.max(48, Math.min(83, Math.floor(timeHeight * 1.18)));
  const timeStyle = {
    ...(layout.time.style || {}),
    fontFamily: "SF Compact",
    fontSize: timeFontSize,
    fontWeight: layout.time.style?.fontWeight || 760,
    letterSpacing: 0,
    color: timeColor,
    treatment: layout.time.style?.treatment || "fill",
    textAlign: "center"
  };
  layout.time.mode = "single_line";
  layout.time.value = timeValue;
  layout.time.layer = "bottom";
  layout.time.frame = { x: 0, y: 0, width: 205, height: timeHeight };
  layout.time.style = { ...timeStyle };
  layout.time.containers = [
    {
      id: "time-combined",
      role: "combined",
      value: timeValue,
      frame: { x: 0, y: 0, width: 205, height: timeHeight },
      style: { ...timeStyle },
      anchor: "top_left"
    }
  ];
  layout.date.frame = { x: 16, y: timeHeight, width: Math.max(64, layout.date.frame?.width || 64), height: dateHeight };
  layout.date.stackedWithTimeContainerId = "time-combined";
  layout.date.stackGap = 0;
  layout.date.edgePaddingWhenStackedFromEdge = 16;
}

function normalizeChecklistFullFace(layout, currentTime) {
  const checklistIndex = Array.isArray(layout.widgets)
    ? layout.widgets.findIndex((widget) => widget.contentType === "checklist" || widget.template === "checklist_full_face")
    : -1;
  if (checklistIndex < 0) return;
  const sourceWidget = layout.widgets[checklistIndex] || {};
  const data = sourceWidget.data && typeof sourceWidget.data === "object" ? sourceWidget.data : {};
  const items = Array.isArray(data.items) ? data.items : [];
  layout.metadata.selectedContentTypes = ["checklist"];
  layout.widgets = [
    {
      ...sourceWidget,
      id: sourceWidget.id || "widget-checklist",
      contentType: "checklist",
      shape: "rectangular",
      template: "checklist_full_face",
      frame: { x: 0, y: 0, width: 205, height: 251 },
      cornerRadius: 54,
      cornerSmoothing: 60,
      surfaceMode: "accent_surface",
      verticalAlignment: "top",
      layer: "top",
      data: {
        ...data,
        title: data.title || data.label || "Checklist",
        items
      }
    }
  ];
  const timeValue = layout.time?.value || layout.time?.containers?.[0]?.value || "10:09";
  const timeStyle = {
    fontFamily: "SF Compact",
    fontSize: 19,
    fontWeight: 400,
    letterSpacing: 0,
    color: "#FFFFFF",
    treatment: "fill",
    textAlign: "right"
  };
  layout.time = {
    mode: "single_line",
    value: timeValue,
    layer: "bottom",
    frame: { x: 139, y: 16, width: 50, height: 22 },
    style: { ...timeStyle },
    containers: [
      {
        id: "time-combined",
        role: "combined",
        value: timeValue,
        frame: { x: 139, y: 16, width: 50, height: 22 },
        style: { ...timeStyle },
        anchor: "top"
      }
    ]
  };
  layout.date = {
    ...(layout.date || {}),
    value: normalizeDateLabel(layout.date?.value, currentTime),
    priority: "secondary",
    layer: "bottom",
    frame: { x: 16, y: 16, width: 70, height: 22 },
    style: {
      fontFamily: "SF Compact",
      fontSize: 19,
      fontWeight: 400,
      letterSpacing: 0,
      color: "#FFFFFF",
      treatment: "fill"
    },
    stackedWithTimeContainerId: "time-combined",
    stackGap: 0,
    edgePaddingWhenStackedFromEdge: 16
  };
  layout.layers = { bottom: ["time", "date"], top: [layout.widgets[0].id] };
}

function splitTimeValue(value) {
  const match = String(value || "").match(/(\d{1,2})(?::(\d{2}))?/);
  if (!match) return { hour: "10", minute: "09" };
  return { hour: match[1], minute: match[2] || "00" };
}

function circularCorner(widget) {
  const { frame } = widget || {};
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

function splitTimeRequiredForWidgets(widgets = []) {
  const circularWidgets = widgets.filter((widget) => widget.shape === "circular");
  const smallOrMedium = circularWidgets.filter((widget) => ["S", "M"].includes(widget.variant?.size));
  const smallCircular = circularWidgets.filter((widget) => widget.variant?.size === "S");
  if (smallOrMedium.length === 1) return true;
  if (circularWidgets.length === 2 && smallCircular.length === 2) {
    return oppositeCorners(circularCorner(circularWidgets[0]), circularCorner(circularWidgets[1]));
  }
  if (circularWidgets.length === 3 && smallCircular.length === 3) {
    const sorted = [...smallCircular].sort((a, b) => a.frame.y - b.frame.y);
    const centerX = sorted[0].frame.x + sorted[0].frame.width / 2;
    return sorted.every((widget) => Math.abs(widget.frame.x + widget.frame.width / 2 - centerX) <= 12);
  }
  return false;
}

const CIRCULAR_SIZE_FRAMES = {
  S: { width: 72, height: 72 },
  M: { width: 90, height: 90 },
  L: { width: 150, height: 150 }
};

const OPEN_GAUGE_METRIC_KINDS = new Set(["temperature", "current_temperature", "weather_temperature", "bpm", "heart_rate", "precipitation_probability", "rain_chance", "uv_index", "air_quality", "recovery", "pace"]);
const CLOSE_GAUGE_METRIC_KINDS = new Set(["timer", "countdown", "countdown_timer", "workout", "activity", "activity_progress", "goal_progress", "exercise_goal_progress", "battery", "completion", "hydration", "focus"]);
const DEFAULT_ICON_BY_CONTENT_TYPE = {
  weather: "weather_umbrella",
  workout: "workout_running",
  timer: "timer",
  heart_rate: "heart_rate",
  iot_control: "thermometer",
  upcoming_event: "calendar",
  music_control: "music",
  reminder: "time",
  checklist: "checklist"
};
const SHORT_LABEL_BY_CONTENT_TYPE = {
  weather: "WX",
  workout: "WO",
  timer: "TM",
  heart_rate: "HR",
  iot_control: "IO",
  upcoming_event: "EV",
  music_control: "MU",
  reminder: "RM",
  checklist: "CK"
};

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function shouldUseWorkoutRectangle(context = {}) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  return /(summary|summarize|recap|stats|detail|details|exercise summary|workout summary|calories|duration|distance|pace|finished|finish|completed|complete)/.test(text);
}

function shouldUseTimerRectangle(context = {}) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  return /(set|create|start|pause|cancel|control|action|reset|buttons|full timer|for my|for the|minutes?|mins?|hours?|seconds?|cooking|cook|salmon|tea|label|named)/.test(text);
}

function shouldUseIotControlRectangle(context = {}) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  return /(control|action|turn on|turn off|toggle|set|adjust|change|increase|decrease|dim|lock|unlock|open|close|thermostat|temperature|temp|degree|degrees|room|kitchen|device|lights?|lamp|fan|heater|ac)/.test(text);
}

function weatherIconForCondition(condition = "") {
  const text = String(condition).toLowerCase();
  if (/rain|shower|storm/.test(text)) return "weather_rain";
  if (/snow/.test(text)) return "weather_snowy";
  if (/sun|clear/.test(text)) return "weather_sunny";
  if (/partly/.test(text)) return "weather_partly_cloudy";
  return "weather_cloudy";
}

function timerCountdownFromContext(context = {}, fallback = "20:00") {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  const match = text.match(/(\d{1,3})\s*(min|mins|minute|minutes|hr|hrs|hour|hours|sec|secs|second|seconds)/);
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = match[2];
  if (/sec/.test(unit)) return `0:${String(amount).padStart(2, "0")}`;
  if (/h/.test(unit)) return `${amount}:00:00`;
  return `${amount}:00`;
}

function timerLabelFromContext(context = {}) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  const forMatch = text.match(/for (?:my |the )?([a-z][a-z\s]{1,24})/);
  if (forMatch) return forMatch[1].replace(/\b(timer|countdown)\b/g, "").trim() || "timer";
  if (/salmon/.test(text)) return "salmon";
  if (/tea/.test(text)) return "tea";
  return "timer";
}

function applyTopTimeBottomRectangleSlots(layout, timeValueFallback = "7:30") {
  const timeValue = layout.time?.value || layout.time?.containers?.[0]?.value || timeValueFallback;
  const color = layout.colorSystem?.accentColor || "#FF9230";
  const timeStyle = {
    fontFamily: "SF Compact",
    fontSize: 88,
    fontWeight: 760,
    letterSpacing: 0,
    color,
    treatment: "fill",
    textAlign: "center"
  };
  layout.time = {
    mode: "single_line",
    value: timeValue,
    layer: "bottom",
    frame: { x: 0, y: 0, width: 205, height: 73 },
    style: { ...timeStyle },
    containers: [
      {
        id: "time-combined",
        role: "combined",
        value: timeValue,
        frame: { x: 0, y: 0, width: 205, height: 73 },
        style: { ...timeStyle },
        anchor: "top_left"
      }
    ]
  };
  layout.date = {
    ...(layout.date || {}),
    priority: "secondary",
    layer: "bottom",
    frame: { x: 0, y: 73, width: 70, height: 22 },
    style: {
      fontFamily: "SF Compact",
      fontSize: 19,
      fontWeight: 400,
      letterSpacing: 0,
      color,
      treatment: "fill"
    },
    stackedWithTimeContainerId: "time-combined",
    stackGap: 0,
    edgePaddingWhenStackedFromEdge: 16
  };
}

function normalizeWorkoutSummaryRectangle(layout) {
  const workoutIndex = Array.isArray(layout.widgets)
    ? layout.widgets.findIndex((widget) => widget.contentType === "workout")
    : -1;
  if (workoutIndex < 0) return;
  const sourceWidget = layout.widgets[workoutIndex] || {};
  if (sourceWidget.shape === "rectangular" && sourceWidget.template === "generated_rectangular_widget") return;
  const sourceData = sourceWidget.data && typeof sourceWidget.data === "object" ? sourceWidget.data : {};
  const icon = sourceData.icon === "workout_strength" ? "workout_strength" : "workout_running";
  const value = truncateDisplayText(sourceData.value || sourceData.calories || "322", 8);
  const unitLabel = truncateDisplayText(sourceData.label || "CAL", 8).toUpperCase();
  const secondaryText = sourceData.goalValue || sourceData.progress >= 0.95 ? "goal done" : "summary";
  layout.widgets = [
    {
      ...sourceWidget,
      id: sourceWidget.id || "workout-summary",
      contentType: "workout",
      shape: "rectangular",
      template: "generated_rectangular_widget",
      data: {
        ...sourceData,
        icon,
        value,
        label: unitLabel,
        metricKind: "workout_summary"
      },
      composition: {
        layout: "vertical",
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
        gap: 8,
        verticalAlignment: "center",
        blocks: [
          {
            type: "inline_small_icon_text",
            icon,
            textUnit: "secondary",
            text: "Exercise summary"
          },
          {
            type: "number_text_lockup",
            value,
            unitLabel,
            secondaryText
          },
          {
            type: "text",
            unit: "body",
            text: "Duration · pace · calories"
          }
        ]
      },
      frame: { x: 0, y: 124, width: 205, height: 127 },
      layer: "top",
      cornerRadius: 54,
      cornerSmoothing: 60,
      surfaceMode: "accent_surface",
      verticalAlignment: "bottom"
    }
  ];
  layout.metadata.selectedContentTypes = ["workout"];
  const timeValue = layout.time?.value || layout.time?.containers?.[0]?.value || "6:58";
  const timeStyle = {
    fontFamily: "SF Compact",
    fontSize: 88,
    fontWeight: 760,
    letterSpacing: 0,
    color: layout.colorSystem?.accentColor || "#FF375F",
    treatment: "fill",
    textAlign: "center"
  };
  layout.time = {
    mode: "single_line",
    value: timeValue,
    layer: "bottom",
    frame: { x: 0, y: 0, width: 205, height: 73 },
    style: { ...timeStyle },
    containers: [
      {
        id: "time-combined",
        role: "combined",
        value: timeValue,
        frame: { x: 0, y: 0, width: 205, height: 73 },
        style: { ...timeStyle },
        anchor: "top_left"
      }
    ]
  };
  layout.date = {
    ...(layout.date || {}),
    priority: "secondary",
    layer: "bottom",
    frame: { x: 0, y: 73, width: 70, height: 22 },
    style: {
      fontFamily: "SF Compact",
      fontSize: 19,
      fontWeight: 400,
      letterSpacing: 0,
      color: layout.colorSystem?.accentColor || "#FF375F",
      treatment: "fill"
    },
    stackedWithTimeContainerId: "time-combined",
    stackGap: 0,
    edgePaddingWhenStackedFromEdge: 16
  };
  layout.layers = { bottom: ["time", "date"], top: [layout.widgets[0].id] };
}

function normalizeTimerRectangle(layout, context = {}) {
  const timerIndex = Array.isArray(layout.widgets)
    ? layout.widgets.findIndex((widget) => widget.contentType === "timer")
    : -1;
  if (timerIndex < 0) return;
  const sourceWidget = layout.widgets[timerIndex] || {};
  if (sourceWidget.shape === "rectangular" && sourceWidget.template === "timer_rectangular") return;
  const sourceData = sourceWidget.data && typeof sourceWidget.data === "object" ? sourceWidget.data : {};
  layout.widgets = [
    {
      ...sourceWidget,
      id: sourceWidget.id || "timer-control",
      contentType: "timer",
      shape: "rectangular",
      template: "timer_rectangular",
      data: {
        countdown: sourceData.countdown || sourceData.value || timerCountdownFromContext(context),
        timerLabel: sourceData.timerLabel || sourceData.label || timerLabelFromContext(context),
        running: sourceData.running !== false
      },
      frame: { x: 0, y: 112, width: 205, height: 139 },
      layer: "top",
      cornerRadius: 54,
      cornerSmoothing: 60,
      surfaceMode: "accent_surface",
      verticalAlignment: "bottom"
    }
  ];
  layout.metadata.selectedContentTypes = ["timer"];
  applyTopTimeBottomRectangleSlots(layout, "7:30");
  layout.layers = { bottom: ["time", "date"], top: [layout.widgets[0].id] };
}

function normalizeIotControlRectangle(layout) {
  const iotIndex = Array.isArray(layout.widgets)
    ? layout.widgets.findIndex((widget) => widget.contentType === "iot_control")
    : -1;
  if (iotIndex < 0) return;
  const sourceWidget = layout.widgets[iotIndex] || {};
  if (sourceWidget.shape === "rectangular" && sourceWidget.template === "generated_rectangular_widget") return;
  const sourceData = sourceWidget.data && typeof sourceWidget.data === "object" ? sourceWidget.data : {};
  const value = truncateDisplayText(sourceData.value || sourceData.setValue || sourceData.set_value || "70", 8);
  const unitLabel = truncateDisplayText(sourceData.label || sourceData.unit || "F", 8);
  layout.widgets = [
    {
      ...sourceWidget,
      id: sourceWidget.id || "iot-control",
      contentType: "iot_control",
      shape: "rectangular",
      template: "generated_rectangular_widget",
      data: {
        ...sourceData,
        icon: "thermometer",
        value,
        label: unitLabel,
        metricKind: "iot_control"
      },
      composition: {
        layout: "vertical",
        padding: { top: 16, right: 16, bottom: 16, left: 16 },
        gap: 8,
        verticalAlignment: "center",
        blocks: [
          {
            type: "inline_small_icon_text",
            icon: "thermometer",
            textUnit: "secondary",
            text: truncateDisplayText(sourceData.deviceName || sourceData.device_name || "Thermostat")
          },
          {
            type: "number_text_lockup",
            value,
            unitLabel,
            secondaryText: "set"
          },
          {
            type: "text",
            unit: "body",
            text: "Control ready"
          }
        ]
      },
      frame: { x: 0, y: 124, width: 205, height: 127 },
      layer: "top",
      cornerRadius: 54,
      cornerSmoothing: 60,
      surfaceMode: "accent_surface",
      verticalAlignment: "bottom"
    }
  ];
  layout.metadata.selectedContentTypes = ["iot_control"];
  applyTopTimeBottomRectangleSlots(layout, "7:30");
  layout.layers = { bottom: ["time", "date"], top: [layout.widgets[0].id] };
}

function normalizeWeatherOnlyWidgets(layout) {
  const selectedTypes = layout.metadata?.selectedContentTypes || [];
  const widgets = Array.isArray(layout.widgets) ? layout.widgets : [];
  const isWeatherOnly = selectedTypes.length === 1 && selectedTypes[0] === "weather" && widgets.every((widget) => widget.contentType === "weather");
  if (!isWeatherOnly) return;
  if (widgets.length === 3 && widgets.every((widget) => widget.shape === "circular" && widget.variant?.size === "S")) return;
  if (widgets.length === 1 && widgets[0].shape === "rectangular" && widgets[0].template === "generated_rectangular_widget") return;
  const sourceData = widgets[0]?.data && typeof widgets[0].data === "object" ? widgets[0].data : {};
  const high = sourceData.highLabel || sourceData.highTemperature || sourceData.high_temperature || sourceData.value || "67°";
  const low = sourceData.lowLabel || sourceData.lowTemperature || sourceData.low_temperature || "52°";
  const rain = sourceData.rainChance || sourceData.rain_chance || sourceData.precipitation || "24%";
  const conditionIcon = weatherIconForCondition(sourceData.condition || sourceData.summary || sourceData.icon);
  const numericRain = Number.parseFloat(rain);
  layout.widgets = [
    {
      id: "weather-condition",
      contentType: "weather",
      shape: "circular",
      component: "close_gauge",
      variant: { property: "icon", size: "S" },
      data: {
        icon: conditionIcon,
        progress: 1,
        metricKind: "weather_condition"
      },
      frame: { x: 127, y: 6, width: 72, height: 72 },
      layer: "top"
    },
    {
      id: "weather-temperature-range",
      contentType: "weather",
      shape: "circular",
      component: "open_gauge",
      variant: { property: "range", size: "S" },
      data: {
        value: String(high),
        lowLabel: String(low),
        highLabel: String(high),
        progress: 0.7,
        metricKind: "temperature"
      },
      frame: { x: 127, y: 89.5, width: 72, height: 72 },
      layer: "top"
    },
    {
      id: "weather-precipitation",
      contentType: "weather",
      shape: "circular",
      component: "open_gauge",
      variant: { property: "icon", size: "S" },
      data: {
        icon: "weather_umbrella",
        value: String(rain).includes("%") ? String(rain) : `${rain}%`,
        progress: Number.isFinite(numericRain) ? Math.max(0, Math.min(1, numericRain / 100)) : 0.24,
        metricKind: "precipitation_probability"
      },
      frame: { x: 127, y: 173, width: 72, height: 72 },
      layer: "top"
    }
  ];
  layout.layers = { bottom: ["time", "date"], top: layout.widgets.map((widget) => widget.id) };
}

function normalizeModelLayout(layout, { model, selectedContentTypes, currentTime, retryCount = 0, context = {} }) {
  const normalized = structuredClone(layout);
  normalized.schemaVersion = "1.0.0";
  normalized.targetContainer = "Gen Watch Face";
  normalized.metadata = {
    ...(normalized.metadata || {}),
    pipelinePhase: "phase-9-openai-structured-output",
    provider: "openai",
    model,
    promptVersion: PROMPT_VERSION,
    schemaVersion: "1.0.0",
    selectedContentTypes: Array.isArray(normalized.metadata?.selectedContentTypes) && normalized.metadata.selectedContentTypes.length > 0
      ? normalized.metadata.selectedContentTypes.slice(0, 3)
      : selectedContentTypes,
    retryCount,
    fallbackUsed: false,
    contextSource: "live_context_plus_pseudo_context",
    generationStepProvenance: [
      "read-live-context",
      "load-pseudo-context",
      "select-content-types",
      "choose-widgets",
      "populate-widgets",
      "generate-layout-json",
      "validate",
      "render"
    ]
  };
  delete normalized.metadata.fallbackId;
  delete normalized.metadata.fallbackReason;
  const validColorSourceRules = new Set([
    "one-content-type-prefers-mono-tone",
    "two-content-types-prefers-multicolor",
    "three-content-types-flexible-color-mode",
    "multi-content-balanced-color-mode",
    "user-context-explicit-color-mode"
  ]);
  if (!normalized.colorSystem || typeof normalized.colorSystem !== "object") {
    normalized.colorSystem = {};
  }
  const semanticCount = new Set([
    ...normalized.metadata.selectedContentTypes,
    ...(Array.isArray(normalized.widgets) ? normalized.widgets.map((widget) => widget.contentType) : [])
  ].filter(Boolean)).size;
  const primaryContentType = normalized.widgets?.[0]?.contentType || normalized.metadata.selectedContentTypes?.[0];
  if (!["mono_tone", "multicolor"].includes(normalized.colorSystem.mode)) {
    normalized.colorSystem.mode = semanticCount <= 1 ? "mono_tone" : "multicolor";
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized.colorSystem.accentColor || "")) {
    normalized.colorSystem.accentColor = ACCENT_BY_CONTENT_TYPE[primaryContentType] || "#D94C00";
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized.colorSystem.surfaceAccentColor || "")) {
    normalized.colorSystem.surfaceAccentColor = ACCENT_SURFACE_BY_CONTENT_TYPE[primaryContentType] || "#592A00";
  }
  if (!validColorSourceRules.has(normalized.colorSystem.sourceRule)) {
    normalized.colorSystem.sourceRule = semanticCount <= 1
      ? "one-content-type-prefers-mono-tone"
      : semanticCount === 2
        ? "two-content-types-prefers-multicolor"
        : "three-content-types-flexible-color-mode";
  }
  if (normalized.time?.style) {
    normalized.time.style.fontFamily = "SF Compact";
  }
  if (normalized.time && !Array.isArray(normalized.time.containers)) {
    normalized.time.mode = "single_line";
    normalized.time.containers = [
      {
        id: "time-combined",
        role: "combined",
        value: normalized.time.value || "",
        frame: normalized.time.frame || { x: 0, y: 193, width: 150, height: 58 },
        style: normalized.time.style || {
          fontFamily: "SF Compact",
          fontSize: 64,
          fontWeight: 760,
          letterSpacing: 0,
          color: "#FFFFFF",
          treatment: "fill"
        },
        anchor: "bottom_left"
      }
    ];
  }
  if (Array.isArray(normalized.time?.containers)) {
    for (const [index, container] of normalized.time.containers.entries()) {
      container.id = container.id || (normalized.time.containers.length === 1 ? "time-combined" : `time-${index + 1}`);
      container.role = container.role || (normalized.time.containers.length === 1 ? "combined" : index === 0 ? "hour" : "minute");
      container.value = container.value || normalized.time.value || "";
      container.frame = container.frame || normalized.time.frame || { x: 0, y: 193, width: 150, height: 58 };
      container.style = { ...(normalized.time.style || {}), ...(container.style || {}), fontFamily: "SF Compact" };
      container.anchor = container.anchor || (normalized.time.containers.length === 1 ? "bottom_left" : index === 0 ? "top_left" : "bottom_right");
      const anchorEdges = String(container.anchor || "").split("_");
      const isCornerAnchor = anchorEdges.some((edge) => ["top", "bottom"].includes(edge)) && anchorEdges.some((edge) => ["left", "right"].includes(edge));
      if (normalized.time.mode === "single_line" && isCornerAnchor && container.frame.width !== 205) {
        container.frame.x = 0;
        container.frame.width = 205;
      }
      if (container.frame.width === 205) {
        container.frame.x = 0;
        container.style.textAlign = "center";
      }
    }
    normalized.time.frame = unionFrame(normalized.time.containers.map((container) => container.frame));
    if (normalized.time.frame.width === 205 && normalized.time.style) {
      normalized.time.style.textAlign = "center";
    }
  }
  if (normalized.date?.style) {
    normalized.date.value = normalizeDateLabel(normalized.date.value, currentTime);
    normalized.date.style.fontFamily = "SF Compact";
    normalized.date.style.fontSize = 19;
    normalized.date.style.fontWeight = 400;
    normalized.date.style.letterSpacing = 0;
    normalized.date.stackedWithTimeContainerId = normalized.date.stackedWithTimeContainerId || normalized.time?.containers?.[0]?.id || "time-combined";
    normalized.date.stackGap = 0;
    normalized.date.edgePaddingWhenStackedFromEdge = 16;
  }
  normalizeChecklistFullFace(normalized, currentTime);
  if (shouldUseWorkoutRectangle(context)) {
    normalizeWorkoutSummaryRectangle(normalized);
  }
  if (shouldUseTimerRectangle(context)) {
    normalizeTimerRectangle(normalized, context);
  }
  if (shouldUseIotControlRectangle(context)) {
    normalizeIotControlRectangle(normalized);
  }
  normalizeWeatherOnlyWidgets(normalized);
  rebalanceLayoutColorSystem(normalized, context);
  const hasChecklistFullFace = normalized.widgets?.some((widget) => widget.template === "checklist_full_face");
  if (!hasChecklistFullFace) {
    const textObjects = [
      ...(Array.isArray(normalized.time?.containers) ? normalized.time.containers : [normalized.time]),
      normalized.date
    ];
    for (const textObject of textObjects) {
      if (!textObject?.frame || !textObject?.style) continue;
      const estimatedWidth = estimateTextWidth(textObject.value, textObject.style.fontSize);
      const maxWidth = 205 - textObject.frame.x;
      if (estimatedWidth > textObject.frame.width + 2) {
        textObject.frame.width = Math.min(maxWidth, Math.ceil(estimatedWidth + 2));
      }
      if (estimatedWidth > textObject.frame.width + 2) {
        textObject.style.fontSize = Math.max(10, Math.floor((textObject.frame.width - 2) / (String(textObject.value).length * 0.58)));
      }
      if (textObject.frame.width === 205) {
        textObject.frame.x = 0;
        textObject.style.textAlign = "center";
      }
    }
  }
  if (Array.isArray(normalized.widgets)) {
    const circularWidgets = normalized.widgets.filter((widget) => widget.shape === "circular");
    const contentTypeCounts = new Map();
    for (const widget of normalized.widgets) {
      contentTypeCounts.set(widget.contentType, (contentTypeCounts.get(widget.contentType) || 0) + 1);
    }
    if (normalized.widgets.length === 1 && circularWidgets.length === 1
      && !(circularWidgets[0].contentType === "timer" && circularWidgets[0].variant?.size === "M")) {
      circularWidgets[0].variant = { ...(circularWidgets[0].variant || {}), size: "L" };
      circularWidgets[0].frame = { x: 28, y: 6, width: 150, height: 150 };
    }
    if (normalized.widgets.length === 3 && circularWidgets.length === 3) {
      const verticalFrames = [
        { x: 127, y: 6, width: 72, height: 72 },
        { x: 127, y: 89.5, width: 72, height: 72 },
        { x: 127, y: 173, width: 72, height: 72 }
      ];
      circularWidgets.forEach((widget, index) => {
        widget.frame = { ...verticalFrames[index] };
      });
    }
    for (const widget of normalized.widgets) {
      if (widget.shape === "rectangular") {
        widget.cornerRadius = 54;
        widget.cornerSmoothing = 60;
        if (widget.template === "generated_rectangular_widget") {
          normalizeGeneratedRectangularComposition(widget);
        }
        resizeRectangularWidgetToContent(widget);
        if (!["black_surface", "accent_surface"].includes(widget.surfaceMode)) {
          const rectangularWidgets = normalized.widgets.filter((item) => item.shape === "rectangular");
          widget.surfaceMode = rectangularWidgets[0]?.id === widget.id ? "accent_surface" : "black_surface";
        }
      }
      if (widget.shape === "circular" && widget.variant?.property === "text") {
        widget.data = widget.data || {};
        if (widget.data.value === undefined) widget.data.value = "";
      }
      if (widget.shape === "circular" && widget.component === "close_gauge" && widget.variant?.property === "text" && contentTypeCounts.get(widget.contentType) === 1) {
        widget.variant.property = "icon";
        widget.data = widget.data || {};
        widget.data.icon = widget.data.icon || DEFAULT_ICON_BY_CONTENT_TYPE[widget.contentType] || "activity_mobility";
        delete widget.data.value;
        delete widget.data.label;
      }
      if (widget.shape === "circular" && widget.component === "open_gauge") {
        widget.data = widget.data || {};
        if (widget.variant?.property === "text" && isBlank(widget.data.label)) {
          widget.data.label = SHORT_LABEL_BY_CONTENT_TYPE[widget.contentType] || String(widget.contentType || "ID").slice(0, 2).toUpperCase();
        }
        if (widget.variant?.property === "icon" && isBlank(widget.data.icon)) {
          widget.data.icon = DEFAULT_ICON_BY_CONTENT_TYPE[widget.contentType] || "activity_mobility";
        }
        if (widget.variant?.property === "range") {
          if (isBlank(widget.data.lowLabel)) widget.data.lowLabel = widget.data.min;
          if (isBlank(widget.data.highLabel)) widget.data.highLabel = widget.data.max;
        }
        if (widget.variant?.property === "offset" && isBlank(widget.data.referenceValue)) {
          widget.data.referenceValue = widget.data.min ?? widget.data.max ?? widget.data.value;
        }
      }
      if (widget.shape === "circular" && widget.variant?.size && CIRCULAR_SIZE_FRAMES[widget.variant.size]) {
        widget.frame = widget.frame || { x: 0, y: 0, width: CIRCULAR_SIZE_FRAMES[widget.variant.size].width, height: CIRCULAR_SIZE_FRAMES[widget.variant.size].height };
        widget.frame.width = CIRCULAR_SIZE_FRAMES[widget.variant.size].width;
        widget.frame.height = CIRCULAR_SIZE_FRAMES[widget.variant.size].height;
      }
      if (widget.shape === "circular" && OPEN_GAUGE_METRIC_KINDS.has(widget.data?.metricKind)) {
        widget.component = "open_gauge";
      }
      if (widget.shape === "circular" && CLOSE_GAUGE_METRIC_KINDS.has(widget.data?.metricKind)) {
        widget.component = "close_gauge";
        }
      }
      fitTimeAndDateAboveBottomRectangle(normalized);
      if (splitTimeRequiredForWidgets(normalized.widgets)) {
      const split = splitTimeValue(normalized.time?.value || normalized.time?.containers?.[0]?.value);
      const circularCenterX = circularWidgets[0]?.frame ? circularWidgets[0].frame.x + circularWidgets[0].frame.width / 2 : 160;
      const hasRectangularWidget = normalized.widgets.some((widget) => widget.shape === "rectangular");
      const x = circularCenterX > 102.5 ? 0 : 95;
      const anchor = x === 0 ? "left" : "right";
      const hourFrame = hasRectangularWidget
        ? { x, y: 0, width: 110, height: 51 }
        : { x, y: 54, width: 110, height: 76 };
      const minuteFrame = hasRectangularWidget
        ? { x, y: 51, width: 110, height: 51 }
        : { x, y: 130, width: 110, height: 76 };
      const style = {
        ...(normalized.time?.style || normalized.time?.containers?.[0]?.style || {}),
        fontFamily: "SF Compact",
        fontSize: hasRectangularWidget ? 56 : 82
      };
      normalized.time.mode = "split_hour_minute";
      normalized.time.containers = [
        {
          id: "time-hour",
          role: "hour",
          value: split.hour,
          frame: hourFrame,
          style: { ...style },
          anchor
        },
        {
          id: "time-minute",
          role: "minute",
          value: split.minute,
          frame: minuteFrame,
          style: { ...style },
          anchor
        }
      ];
      normalized.time.frame = unionFrame(normalized.time.containers.map((container) => container.frame));
      normalized.time.style = { ...style };
      if (normalized.date?.frame) {
        normalized.date.frame.x = x;
        normalized.date.frame.y = hasRectangularWidget ? 102 : 32;
        normalized.date.stackedWithTimeContainerId = hasRectangularWidget ? "time-minute" : "time-hour";
      }
    }
  }
  fitTimeLayout(normalized);
  return normalized;
}

function selectedTypesFromLayout(layout) {
  if (Array.isArray(layout?.metadata?.selectedContentTypes) && layout.metadata.selectedContentTypes.length > 0) {
    return layout.metadata.selectedContentTypes.slice(0, 3);
  }
  if (Array.isArray(layout?.widgets)) {
    return [...new Set(layout.widgets.map((widget) => widget.contentType).filter(Boolean))].slice(0, 3);
  }
  return [];
}

function widgetDecisionsFromLayout(layout) {
  if (!Array.isArray(layout.widgets)) return [];
  return layout.widgets.map((widget) => {
    if (widget.shape === "circular") {
      return `${widget.contentType} -> ${widget.component} ${widget.variant?.property || "unknown"} ${widget.variant?.size || "unknown"} from OpenAI structured layout`;
    }
    return `${widget.contentType} -> ${widget.template} from OpenAI structured layout`;
  });
}

export function openAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function openAiModel() {
  return process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
}

export async function generateOpenAiWatchUi({ context = {}, preferences = {}, designPack, currentTime, validationFeedback = [], retryCount = 0 }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const startedAt = performance.now();
  const model = openAiModel();
  const responseSchema = buildResponseSchema(designPack);
  const promptPayload = buildPromptPayload({ context, preferences, designPack, currentTime, validationFeedback, retryCount });
  const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 30000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: buildSystemPrompt(designPack) }]
          },
          {
            role: "user",
            content: [{ type: "input_text", text: compactJson(promptPayload) }]
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "watch_face_layout",
            strict: true,
            schema: responseSchema
          }
        }
      })
    });

    const responseJson = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = responseJson.error?.message || `OpenAI request failed with HTTP ${response.status}`;
      throw new Error(detail);
    }

    const outputText = extractOutputText(responseJson);
    const parsedOutput = JSON.parse(outputText);
    const parsedLayout = typeof parsedOutput.layoutJson === "string"
      ? JSON.parse(parsedOutput.layoutJson)
      : parsedOutput.layout || parsedOutput;
    const selectedContentTypes = selectedTypesFromLayout(parsedLayout);
    const layout = normalizeModelLayout(parsedLayout, { model, selectedContentTypes, currentTime, retryCount, context });
    const latencyMs = Math.round(performance.now() - startedAt);

    return {
      layout,
      selectedContentTypes: selectedTypesFromLayout(layout),
      widgetDecisions: widgetDecisionsFromLayout(layout),
      model: {
        provider: "openai",
        model,
        promptVersion: PROMPT_VERSION,
        schemaVersion: layout.schemaVersion,
        latencyMs,
        estimatedCost: "not-calculated"
      },
      responseId: responseJson.id || null
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`OpenAI request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
