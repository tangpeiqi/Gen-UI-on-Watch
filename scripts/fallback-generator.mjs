import fs from "node:fs";
import { createLayoutValidator } from "./layout-validator.mjs";

const ACCENT_BY_CONTENT_TYPE = {
  weather: "#63D6FF",
  upcoming_event: "#7DD3FC",
  workout: "#FF7A1A",
  timer: "#FFD54A",
  heart_rate: "#FF4D6D",
  iot_control: "#8CE99A",
  music_control: "#B892FF",
  reminder: "#F2F4FC",
  checklist: "#F2F4FC"
};

export function loadDesignPack(cwd = process.cwd()) {
  const readJson = (path) => JSON.parse(fs.readFileSync(`${cwd}/${path}`, "utf8"));
  return {
    schema: readJson("design-pack/layout-schema.json"),
    materialSymbolsRegistry: readJson("design-pack/material-symbols-registry.json"),
    widgetSelectionPolicy: readJson("design-pack/widget-selection-policy.json"),
    generatedRectangularWidgetSchema: readJson("design-pack/rectangular-widget-guidelines/generated-rectangular-widget-schema.json"),
    pseudoContextJson: readJson("demo-data/pseudo-context.json"),
    pseudoContextMarkdown: fs.readFileSync(`${cwd}/demo-data/pseudo-context.md`, "utf8")
  };
}

function currentDateLabel(now = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(now);
  return `${weekday} ${now.getDate()}`;
}

function timeForFace(value, now = new Date()) {
  const source = value || new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(now);
  const match = source.match(/(\d{1,2})(?::(\d{2}))?/);
  return match ? `${match[1]}:${match[2] || "00"}` : source;
}

function inferSelectedContentTypes(context) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  const selected = [];

  if (/(checklist|shopping list|task list|packing list)/.test(text)) return ["checklist"];
  if (/(music|song|playlist|audio|podcast|playback)/.test(text)) selected.push("music_control");
  if (/(timer|countdown|pause|cancel|start timer|reset timer)/.test(text)) selected.push("timer");
  if (/(remind|reminder|todo|to-do|complete task|mark complete)/.test(text)) selected.push("reminder");
  if (/(run|running|walk|workout|gym|exercise|mobility)/.test(text)) selected.push("workout");
  if (/(dinner|meeting|appointment|pickup|commute|on time|schedule|call)/.test(text)) selected.push("upcoming_event");
  if (/(rain|weather|outside|outdoors|waterfront)/.test(text)) selected.push("weather");
  if (selected.length === 0) selected.push("upcoming_event");
  if (!selected.includes("weather") && selected.length < 3) selected.push("weather");
  return selected.slice(0, 3);
}

function fallbackReasonFromRequest(context, preferences = {}) {
  if (preferences.fallbackReason) return preferences.fallbackReason;
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  if (/(api failure|api error|server error|network failure)/.test(text)) return "api_failure";
  if (/(timeout|timed out|too slow)/.test(text)) return "timeout";
  if (/(invalid output|bad json|schema fail|validation fail)/.test(text)) return "invalid_output";
  if (/(budget|cost|quota|exhausted)/.test(text)) return "budget_exhausted";
  return "no_ai_provider";
}

function fallbackReasonLabel(reason) {
  return {
    no_ai_provider: "No OPENAI_API_KEY or AI provider is required for Phase 8; deterministic fallback layout is used.",
    api_failure: "API failure state requested; deterministic fallback layout is used.",
    timeout: "Timeout state requested; deterministic fallback layout is used.",
    invalid_output: "Invalid output state requested; deterministic fallback layout is used.",
    budget_exhausted: "Budget exhausted state requested; deterministic fallback layout is used."
  }[reason] || "Deterministic fallback layout is used.";
}

function eventTitleFromContext(context, pseudoContext) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  if (/dinner/.test(text)) {
    const dinner = pseudoContext.calendarEvents?.find((event) => /dinner/i.test(event.title));
    return dinner ? `${dinner.title.replace("Dinner out with friends at ", "Dinner at ")} ${dinner.time}` : "Dinner at 7:30";
  }
  if (/meeting/.test(text)) return "Next meeting";
  if (/commute|leave|on time/.test(text)) return "Leave on time";
  return pseudoContext.calendarEvents?.find((event) => event.relativeDay === "today")?.title || "Next event";
}

function activityLabelFromContext(context) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  if (/walk/.test(text)) return "walk";
  if (/gym|strength|lift/.test(text)) return "lift";
  if (/hike|trail/.test(text)) return "hike";
  return "run";
}

function weatherProgress(pseudoContext) {
  const chance = pseudoContext.weather?.today?.rainChance ?? 68;
  return Math.max(0, Math.min(1, chance / 100));
}

function makeWorkoutWidget(context, frame, size = "S") {
  return {
    id: "fallback-workout",
    contentType: "workout",
    shape: "circular",
    component: "close_gauge",
    variant: { property: "text", size },
    data: {
      value: "42",
      label: activityLabelFromContext(context),
      progress: 0.42,
      metricKind: "workout"
    },
    frame,
    layer: "top",
    decision: `fallback workout -> close_gauge ${size} because activity progress is a reliable compact fallback metric`
  };
}

function makeWeatherWidget(pseudoContext, frame, size = "S") {
  const progress = weatherProgress(pseudoContext);
  return {
    id: "fallback-weather",
    contentType: "weather",
    shape: "circular",
    component: "open_gauge",
    variant: { property: "icon", size },
    data: {
      icon: "weather_umbrella",
      value: `${Math.round(progress * 100)}%`,
      progress,
      metricKind: "precipitation_probability"
    },
    frame,
    layer: "top",
    decision: `fallback weather -> open_gauge ${size} because precipitation chance is numeric and useful without AI`
  };
}

function makeTimerWidget(frame, size = "S") {
  return {
    id: "fallback-timer",
    contentType: "timer",
    shape: "circular",
    component: "close_gauge",
    variant: { property: "text", size },
    data: {
      value: "3:40",
      label: "tea",
      progress: 0.27,
      metricKind: "timer"
    },
    frame,
    layer: "top",
    decision: `fallback timer -> close_gauge ${size} because countdown is a safe deterministic fallback`
  };
}

function makeEventRectangle(context, pseudoContext, y = 124, height = 127) {
  return {
    id: "fallback-event",
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
          text: eventTitleFromContext(context, pseudoContext)
        },
        {
          type: "number_text_lockup",
          value: "12",
          unitLabel: "min",
          secondaryText: "to leave"
        }
      ]
    },
    frame: { x: 0, y, width: 205, height },
    layer: "top",
    cornerRadius: 54,
    verticalAlignment: y === 0 ? "top" : "bottom",
    decision: "fallback upcoming_event -> generated_rectangular_widget because event timing needs readable text"
  };
}

function chooseFallbackId(selectedContentTypes) {
  const circularTypes = selectedContentTypes.filter((type) => ["workout", "timer", "heart_rate", "iot_control", "weather"].includes(type));
  const hasRectangularType = selectedContentTypes.some((type) => !["workout", "timer", "heart_rate", "iot_control", "weather"].includes(type));
  if (selectedContentTypes.includes("checklist")) return "one-rectangular-widget";
  if (hasRectangularType && circularTypes.length > 0) return "mixed-circular-and-rectangular-layout";
  if (hasRectangularType) return "one-rectangular-widget";
  if (circularTypes.length >= 3) return "three-compact-widgets";
  if (circularTypes.length >= 2) return "two-circular-widgets-with-compact-time";
  return "one-circular-widget-with-large-time";
}

function buildFallbackWidgets(fallbackId, context, pseudoContext) {
  if (fallbackId === "one-circular-widget-with-large-time") {
    return [makeWeatherWidget(pseudoContext, { x: 118, y: 20, width: 72, height: 72 }, "S")];
  }
  if (fallbackId === "two-circular-widgets-with-compact-time") {
    return [
      makeWorkoutWidget(context, { x: 118, y: 20, width: 72, height: 72 }, "S"),
      makeWeatherWidget(pseudoContext, { x: 18, y: 88, width: 72, height: 72 }, "S")
    ];
  }
  if (fallbackId === "one-rectangular-widget") return [makeEventRectangle(context, pseudoContext)];
  if (fallbackId === "three-compact-widgets") {
    return [
      makeWorkoutWidget(context, { x: 118, y: 20, width: 72, height: 72 }, "S"),
      makeWeatherWidget(pseudoContext, { x: 18, y: 88, width: 72, height: 72 }, "S"),
      makeTimerWidget({ x: 118, y: 88, width: 72, height: 72 }, "S")
    ];
  }
  return [
    makeWorkoutWidget(context, { x: 118, y: 20, width: 72, height: 72 }, "S"),
    makeEventRectangle(context, pseudoContext)
  ];
}

function resolveColorSystem(widgets, selectedContentTypes) {
  const renderedContentTypes = [...new Set(widgets.map((widget) => widget.contentType))];
  const semanticCount = renderedContentTypes.length || new Set(selectedContentTypes).size;
  const primaryContentType = renderedContentTypes[0] || selectedContentTypes[0];
  const accentColor = ACCENT_BY_CONTENT_TYPE[primaryContentType] || "#D94C00";
  if (semanticCount === 1) return { mode: "mono_tone", accentColor, sourceRule: "one-content-type-prefers-mono-tone" };
  if (semanticCount === 2) return { mode: "multicolor", accentColor, sourceRule: "two-content-types-prefers-multicolor" };
  return { mode: "multicolor", accentColor, sourceRule: "three-content-types-flexible-color-mode" };
}

function resolveTimeDatePlacement(widgets) {
  const bottomRectangle = widgets.find((widget) => widget.shape === "rectangular" && widget.verticalAlignment === "bottom");
  const topCircular = widgets.find((widget) => widget.shape === "circular" && widget.frame.y <= 32);
  if (bottomRectangle && topCircular) {
    return {
      timeFrame: { x: 18, y: 84, width: 130, height: 40 },
      dateFrame: { x: 18, y: 62, width: 90, height: 18 },
      timeFontSize: 44,
      dateFontSize: 12
    };
  }
  if (bottomRectangle) {
    return {
      timeFrame: { x: 18, y: 28, width: 150, height: 58 },
      dateFrame: { x: 18, y: 94, width: 90, height: 18 },
      timeFontSize: 64,
      dateFontSize: 12
    };
  }
  return {
    timeFrame: { x: 18, y: 169, width: 150, height: 58 },
    dateFrame: { x: 18, y: 18, width: 90, height: 18 },
    timeFontSize: 64,
    dateFontSize: 12
  };
}

function buildLayout({ context, selectedContentTypes, widgets, fallbackId, fallbackReason, now }) {
  const colorSystem = resolveColorSystem(widgets, selectedContentTypes);
  const timeAndDateColor = colorSystem.mode === "mono_tone" ? colorSystem.accentColor : "#FFFFFF";
  const placement = resolveTimeDatePlacement(widgets);
  return {
    schemaVersion: "1.0.0",
    targetContainer: "Gen Watch Face",
    metadata: {
      pipelinePhase: "phase-8-backend-endpoint-without-ai",
      provider: "local-backend",
      model: "none",
      promptVersion: "watch-face-phase-8-backend-fallback",
      schemaVersion: "1.0.0",
      selectedContentTypes,
      retryCount: 0,
      fallbackUsed: true,
      fallbackId,
      fallbackReason,
      contextSource: "live_context_plus_pseudo_context",
      generationStepProvenance: [
        "read-live-context",
        "load-pseudo-context",
        "select-content-types",
        "choose-widgets",
        "choose-fallback-layout",
        "populate-widgets",
        "generate-layout-json",
        "validate",
        "render"
      ]
    },
    canvas: { width: 205, height: 251, borderRadius: 54, coordinateSystem: "fixed" },
    colorSystem,
    time: {
      mode: "single_line",
      value: timeForFace(context.timeOfDay, now),
      layer: "bottom",
      frame: placement.timeFrame,
      style: {
        fontFamily: "SF Pro Display",
        fontSize: placement.timeFontSize,
        fontWeight: 760,
        letterSpacing: 0,
        color: timeAndDateColor,
        treatment: "fill"
      }
    },
    date: {
      value: currentDateLabel(now),
      priority: "secondary",
      layer: "bottom",
      frame: placement.dateFrame,
      style: {
        fontFamily: "SF Pro Text",
        fontSize: placement.dateFontSize,
        fontWeight: 600,
        letterSpacing: 0,
        color: timeAndDateColor,
        treatment: "fill"
      }
    },
    widgets: widgets.map(({ decision, ...widget }) => widget),
    layers: { bottom: ["time", "date"], top: widgets.map((widget) => widget.id) }
  };
}

export function generateFallbackWatchUi({ context = {}, preferences = {}, designPack, now = new Date() }) {
  const startedAt = performance.now();
  const pseudoContext = designPack.pseudoContextJson;
  const selectedContentTypes = inferSelectedContentTypes(context);
  const fallbackReason = fallbackReasonFromRequest(context, preferences);
  const fallbackId = preferences.fallbackId || chooseFallbackId(selectedContentTypes);
  const widgets = buildFallbackWidgets(fallbackId, context, pseudoContext);
  const layout = buildLayout({ context, selectedContentTypes, widgets, fallbackId, fallbackReason, now });
  const validator = createLayoutValidator(designPack);
  const validation = validator.validateLayout(layout);
  const renderedContentTypes = new Set(widgets.map((widget) => widget.contentType));
  const widgetDecisions = widgets.map((widget) => widget.decision);
  for (const contentType of selectedContentTypes) {
    if (!renderedContentTypes.has(contentType)) {
      widgetDecisions.push(`${contentType} -> omitted because fallback ${fallbackId} cannot legally render every selected content type`);
    }
  }
  const pseudoContextSummary = [
    `Loaded pseudo context JSON snapshot for ${pseudoContext.snapshot?.location || "demo location"}.`,
    `Loaded pseudo context markdown (${designPack.pseudoContextMarkdown.length} characters) for future prompt assembly.`
  ];
  const logs = [
    { id: "read-live-context", status: "complete", detail: `time=${context.timeOfDay || "runtime"}; location=${context.location || "unknown"}; activity=${context.activity || "none"}; goal=${context.goal || "none"}` },
    { id: "load-pseudo-context", status: "complete", detail: pseudoContextSummary.join(" ") },
    { id: "select-content-types", status: "complete", detail: selectedContentTypes.join(", ") },
    { id: "choose-fallback-layout", status: "complete", detail: `${fallbackId}; ${fallbackReasonLabel(fallbackReason)}` },
    { id: "choose-widgets", status: "complete", detail: widgetDecisions.join(" | ") },
    { id: "populate-widgets", status: "complete", detail: "Fallback widget data and semantic icon tokens populated from live context plus pseudo-context data." },
    { id: "generate-layout-json", status: "complete", detail: "Generated schema-shaped Phase 8 backend fallback layout JSON." },
    { id: "validate", status: validation.ok ? "accepted" : "failed", detail: validation.summary },
    { id: "render", status: validation.ok ? "pending" : "blocked", detail: validation.ok ? "Frontend may render accepted layout." : "Frontend render must be blocked because validation failed." }
  ];
  const latencyMs = Math.round(performance.now() - startedAt);

  return {
    layout,
    logs,
    validation,
    selectedContentTypes,
    widgetDecisions,
    pseudoContextSummary,
    model: {
      provider: "local-backend",
      model: "none",
      promptVersion: layout.metadata.promptVersion,
      schemaVersion: layout.schemaVersion,
      latencyMs,
      estimatedCost: "n/a"
    }
  };
}
