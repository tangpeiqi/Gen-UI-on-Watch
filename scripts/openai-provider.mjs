const DEFAULT_OPENAI_MODEL = "gpt-5.6-terra";
const PROMPT_VERSION = "watch-face-phase-9-openai-v1";

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

function buildPromptPayload({ context, preferences, designPack, currentTime, validationFeedback = [], retryCount = 0 }) {
  const contentTypes = designPack.schema.$defs.contentType.enum;
  const iconTokens = Object.fromEntries(
    Object.entries(designPack.materialSymbolsRegistry.tokens).map(([token, spec]) => [
      token,
      { materialSymbol: spec.materialSymbol, allowedContentTypes: spec.allowedContentTypes }
    ])
  );

  return {
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
    pseudoContextMarkdownSummary: designPack.pseudoContextMarkdown.slice(0, 3500),
    schemaVersion: designPack.schema.properties.schemaVersion.const,
    availableContentTypes: contentTypes,
    materialSymbolsRegistry: iconTokens,
    requiredLayoutContract: {
      topLevelKeysOnly: ["schemaVersion", "targetContainer", "metadata", "canvas", "colorSystem", "time", "date", "widgets", "layers"],
      forbiddenTopLevelKeys: ["composition", "deferredContentTypes", "reasoning", "notes"],
      timeObjectKeysOnly: ["mode", "value", "layer", "frame", "style", "containers"],
      timeContainerKeysOnly: ["id", "role", "value", "frame", "style", "anchor"],
      dateObjectKeysOnly: ["value", "priority", "layer", "frame", "style", "stackedWithTimeContainerId", "stackGap", "edgePaddingWhenStackedFromEdge"],
      textStyleKeysOnly: ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "color", "treatment"],
      circularWidgetKeysOnly: ["id", "contentType", "shape", "component", "variant", "data", "frame", "layer"],
      rectangularWidgetKeysOnly: ["id", "contentType", "shape", "template", "data", "composition", "frame", "layer", "cornerRadius", "cornerSmoothing", "verticalAlignment"]
    },
    validLayoutExample: {
      schemaVersion: "1.0.0",
      targetContainer: "Gen Watch Face",
      metadata: {
        pipelinePhase: "phase-9-openai-structured-output",
        provider: "openai",
        model: "gpt-5.6-terra",
        promptVersion: PROMPT_VERSION,
        schemaVersion: "1.0.0",
        selectedContentTypes: ["weather"],
        retryCount: 0,
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
      },
      canvas: { width: 205, height: 251, borderRadius: 54, coordinateSystem: "fixed" },
      colorSystem: { mode: "mono_tone", accentColor: "#63D6FF", sourceRule: "one-content-type-prefers-mono-tone" },
      time: {
        mode: "single_line",
        value: "10:09",
        layer: "bottom",
        frame: { x: 0, y: 193, width: 205, height: 58 },
        style: {
          fontFamily: "SF Compact",
          fontSize: 64,
          fontWeight: 760,
          letterSpacing: 0,
          color: "#63D6FF",
          treatment: "fill"
        },
        containers: [
          {
            id: "time-combined",
            role: "combined",
            value: "10:09",
            frame: { x: 0, y: 193, width: 205, height: 58 },
            style: {
              fontFamily: "SF Compact",
              fontSize: 64,
              fontWeight: 760,
              letterSpacing: 0,
              color: "#63D6FF",
              treatment: "fill"
            },
            anchor: "bottom_left"
          }
        ]
      },
      date: {
        value: "SAT 1",
        priority: "secondary",
        layer: "bottom",
        frame: { x: 0, y: 171, width: 62, height: 22 },
        style: {
          fontFamily: "SF Compact",
          fontSize: 19,
          fontWeight: 400,
          letterSpacing: 0,
          color: "#63D6FF",
          treatment: "fill"
        },
        stackedWithTimeContainerId: "time-combined",
        stackGap: 0,
        edgePaddingWhenStackedFromEdge: 16
      },
      widgets: [
        {
          id: "weather-rain",
          contentType: "weather",
          shape: "circular",
          component: "open_gauge",
          variant: { property: "icon", size: "S" },
          data: {
            icon: "weather_umbrella",
            value: "68%",
            progress: 0.68,
            metricKind: "precipitation_probability"
          },
          frame: { x: 118, y: 20, width: 72, height: 72 },
          layer: "top"
        }
      ],
      layers: { bottom: ["time", "date"], top: ["weather-rain"] }
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
      cornerSmoothing: 100,
      verticalAlignment: "bottom"
    },
    widgetSelectionPolicy: designPack.widgetSelectionPolicy,
    generatedRectangularWidgetSchema: {
      generatedRectangularWidgetContentTypes: designPack.generatedRectangularWidgetSchema.generatedRectangularWidgetContentTypes,
      strictTemplateExcludedContentTypes: designPack.generatedRectangularWidgetSchema.strictTemplateExcludedContentTypes,
      allowedBlocks: ["text", "inline_small_icon_text", "big_icon_text_group", "number_text_lockup", "edge_progress_bar"]
    },
    orderedPipelineSteps: [
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
}

function buildSystemPrompt() {
  return [
    "You generate Apple Watch face UI layout JSON for the Gen UI on Watch simulator.",
    "Return only a JSON object matching the supplied structured output schema. Put the complete watch-face layout JSON object in layoutJson as a serialized JSON string.",
    "The JSON string inside layoutJson must parse to the exact watch-face layout contract shown in validLayoutExample. Copy that nesting style.",
    "The renderer owns HTML, CSS, SVG, and Material Symbols rendering. Do not output code.",
    "Use the live context plus pseudo context to select at most three semantic content types.",
    "Choose a legal composition before choosing widgets: all-circular layouts may contain up to three widgets; any layout with a rectangular widget may contain at most two widgets; checklist must be the only widget. Widgets themselves must never overlap; only time may overlap a widget by at most 10px.",
    "Only workout, timer, heart_rate, iot_control, and weather may be circular. Other content types are rectangular-only.",
    "For this Phase 9 generation path, strongly prefer all-circular compositions when useful content can be represented by workout, timer, heart_rate, iot_control, and weather. Do not render workout as a generated_rectangular_widget unless the user explicitly needs detailed workout text.",
    "If dinner/event timing competes with workout/weather/timer, it is acceptable to defer upcoming_event and render the legal all-circular composition instead.",
    "Music control, reminder, checklist, and rectangular timer must use their strict templates. Other rectangular content should use generated_rectangular_widget.",
    "Circular widgets must use exact fixed Figma sizes: S is 72x72, M is 90x90, and L is 150x150. The frame width and height must match variant.size exactly.",
    "Choose open_gauge for metrics that move back and forth within a range, including temperature, heart rate/BPM, precipitation probability, UV, air quality, recovery, and pace. Choose close_gauge for one-direction progress, including countdown timer, workout/activity progress, battery, completion, hydration, and focus progress.",
    "close_gauge with property=text has exactly one text value centered in the gauge. Do not include data.label on a close_gauge text widget. If a secondary label is needed, use open_gauge instead.",
    "If a close_gauge is the only widget for its content type, use property=icon instead of property=text so the widget communicates what kind of data it represents. Include data.icon and data.progress.",
    "For open_gauge property=text, include both data.value and a short bottom data.label. For open_gauge property=icon, include data.icon. For open_gauge range, include lowLabel and highLabel. For open_gauge offset, include referenceValue. Never leave the bottom text/icon content empty.",
    "Open gauge bottom text uses fixed Figma font sizes: S=15pt, M=18pt, L=32pt. Keep bottom labels very short so they fit without clipping; use an icon variant when the text label would be too long.",
    "When rendering three circular widgets, stack the three circles vertically in one column so they use the full watch-face height. Do not arrange three circular widgets horizontally or in an overlapping row.",
    "When using generated_rectangular_widget, copy the grammar in validGeneratedRectangularWidgetExample: frame.x must be 0, frame.width must be 205, frame.height must be 108-251, cornerRadius must be 54, cornerSmoothing must be 100, verticalAlignment must be top or bottom, composition.layout must be vertical or horizontal, composition.gap must be 0, 4, 8, 10, or 16, composition.padding is required, and block fields must exactly match their block type.",
    "Use semantic icon tokens from material-symbols-registry.json, not raw Material Symbols names.",
    "Never output top-level composition, deferredContentTypes, reasoning, or notes. Put widget composition only inside a rectangular widget with template generated_rectangular_widget.",
    "Never use time.text, date.text, time.fontSize, or date.fontSize. Use time.value/date.value and time.style/date.style exactly. Time must also include time.containers.",
    "Always include colorSystem and layers.",
    "For time, use frame width at least 130 for 44px text, or width at least 150 for 64px text. Do not put 64px time inside a narrow frame.",
    "Time must use SF Compact. single_line uses exactly one combined time container that is centered or anchored to an edge. split_hour_minute uses exactly two independently edge-anchored containers. segmented_digits uses at least two independently edge-anchored containers.",
    "Use split_hour_minute and stack the hour and minute containers vertically when there is only one S or M circular widget on the watch face, when two S circular widgets occupy opposite corners, or when three S circular widgets stack vertically on one side.",
    "When split_hour_minute is required by the circular widget layout, increase the hour and minute font sizes so they fill the remaining empty space on the watch face without violating mask fit or the 10px widget/time overlap rule.",
    "When the user context suggests a focused one-widget watch face and the content type supports circular rendering, show one L circular widget.",
    "For any edge-anchored time container, use 16px edge padding when that container width is below 105px and 0px padding when the width is 105px or wider. Keep time anchored to center or top/left/right/bottom edges; never place it arbitrarily in the middle.",
    "Avoid cutting time into the rounded watch mask. Combined time may use a corner anchor only when its container is full width at 205px. Split hour/minute containers may use corner anchors only when each corner-anchored container is wider than 110px.",
    "When combined time is not full width near a corner, put the date at the corner with its 16px edge padding and stack the time vertically next to the date, away from the rounded corner.",
    "After widgets are placed, if the combined time sits on a row with clear horizontal space, increase the time font size so the digits visually fill the available row. If the time container is full width, the estimated digit width should be at least 85% of the 205px watch-face width unless that would violate the 10px widget overlap rule.",
    "Date must use compact uppercase weekday plus numeric day, for example SUN 2. Date must use SF Compact Regular 19pt, stack vertically with one time container, use stackGap 0, and include stackedWithTimeContainerId and edgePaddingWhenStackedFromEdge 16.",
    "Time should fill the remaining empty space when possible without breaking mask fit, legibility, edge padding, or widget overlap rules. Keep all frames inside the 205 x 251 canvas. Date must not overlap widgets; time may overlap widgets by at most 10px.",
    "If multicolor mode is selected and any rectangular widget is present, the most important rectangular widget must use the content type accent color as its background with white text and icons. If there are two rectangular widgets, only the more important rectangular widget may use this accent background.",
    "If previousValidationFailures is present, repair those exact failures and avoid repeating the same frame, schema, widget, or overlap mistake.",
    "Set metadata.provider to openai, metadata.pipelinePhase to phase-9-openai-structured-output, metadata.promptVersion to watch-face-phase-9-openai-v1, metadata.fallbackUsed to false, metadata.retryCount to the supplied retryAttempt number, and metadata.contextSource to live_context_plus_pseudo_context."
  ].join("\n");
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

function hasWidgetOnSameRow(widgets, frame) {
  return (widgets || []).some((widget) => {
    if (!widget.frame) return false;
    return Math.max(0, Math.min(frame.y + frame.height, widget.frame.y + widget.frame.height) - Math.max(frame.y, widget.frame.y)) > 0;
  });
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

function normalizeModelLayout(layout, { model, selectedContentTypes, currentTime, retryCount = 0 }) {
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
    "user-context-explicit-color-mode"
  ]);
  if (!normalized.colorSystem || typeof normalized.colorSystem !== "object") {
    normalized.colorSystem = {};
  }
  const semanticCount = new Set([
    ...normalized.metadata.selectedContentTypes,
    ...(Array.isArray(normalized.widgets) ? normalized.widgets.map((widget) => widget.contentType) : [])
  ].filter(Boolean)).size;
  if (!["mono_tone", "multicolor"].includes(normalized.colorSystem.mode)) {
    normalized.colorSystem.mode = semanticCount <= 1 ? "mono_tone" : "multicolor";
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized.colorSystem.accentColor || "")) {
    normalized.colorSystem.accentColor = semanticCount <= 1 ? "#63D6FF" : "#FF7A1A";
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
    }
    normalized.time.frame = unionFrame(normalized.time.containers.map((container) => container.frame));
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
  }
  if (Array.isArray(normalized.widgets)) {
    const circularWidgets = normalized.widgets.filter((widget) => widget.shape === "circular");
    const contentTypeCounts = new Map();
    for (const widget of normalized.widgets) {
      contentTypeCounts.set(widget.contentType, (contentTypeCounts.get(widget.contentType) || 0) + 1);
    }
    if (normalized.widgets.length === 1 && circularWidgets.length === 1) {
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
        widget.cornerSmoothing = 100;
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
      if (widget.shape === "circular" && widget.component === "close_gauge" && widget.variant?.property === "text") {
        delete widget.data.label;
      }
    }
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
  if (normalized.time?.mode === "single_line" && normalized.time.containers?.length === 1) {
    const container = normalized.time.containers[0];
    const clearTimeRow = container.frame && !hasWidgetOnSameRow(normalized.widgets || [], container.frame);
    const currentVisualWidth = estimateTextWidth(container.value, container.style?.fontSize || 0);
    if (clearTimeRow && container.frame.width === 205 && currentVisualWidth < 205 * 0.85) {
      const bottom = container.frame.y + container.frame.height;
      const targetFontSize = Math.min(92, Math.floor((205 * 0.95) / (String(container.value).length * 0.58)));
      const nextFontSize = Math.max(container.style.fontSize || 0, targetFontSize);
      const nextHeight = Math.ceil(nextFontSize * 0.9);
      const dateTargetedThisContainer = normalized.date?.stackedWithTimeContainerId === container.id;
      const dateWasAbove = dateTargetedThisContainer && normalized.date.frame.y + normalized.date.frame.height <= container.frame.y + 1;
      const dateWasBelow = dateTargetedThisContainer && normalized.date.frame.y >= bottom - 1;
      container.style.fontSize = nextFontSize;
      container.frame.height = nextHeight;
      if (String(container.anchor || "").includes("bottom")) {
        container.frame.y = Math.max(0, bottom - nextHeight);
      }
      if (normalized.time.style) {
        normalized.time.style.fontSize = nextFontSize;
      }
      if (dateWasAbove) {
        normalized.date.frame.y = Math.max(0, container.frame.y - normalized.date.frame.height);
      } else if (dateWasBelow) {
        normalized.date.frame.y = Math.min(251 - normalized.date.frame.height, container.frame.y + container.frame.height);
      }
      normalized.time.frame = unionFrame(normalized.time.containers.map((timeContainer) => timeContainer.frame));
    }
  }
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
            content: [{ type: "input_text", text: buildSystemPrompt() }]
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
    const layout = normalizeModelLayout(parsedLayout, { model, selectedContentTypes, currentTime, retryCount });
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
