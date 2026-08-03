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
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(now).slice(0, 3).toUpperCase();
  return `${weekday} ${now.getDate()}`;
}

function timeForFace(value, now = new Date()) {
  const source = value || new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(now);
  const match = source.match(/(\d{1,2})(?::(\d{2}))?/);
  return match ? `${match[1]}:${match[2] || "00"}` : source;
}

function splitTimeForFace(value, now = new Date()) {
  const combined = timeForFace(value, now);
  const [hour, minute = "00"] = combined.split(":");
  return { combined, hour, minute };
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

function shouldUseTimerRectangle(context) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  return /(pause|cancel|start|control|action|reset|buttons|full timer)/.test(text);
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
    variant: { property: "icon", size },
    data: {
      icon: "workout_running",
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
    variant: { property: "icon", size },
    data: {
      icon: "timer",
      progress: 0.27,
      metricKind: "timer"
    },
    frame,
    layer: "top",
    decision: `fallback timer -> close_gauge ${size} because countdown is a safe deterministic fallback`
  };
}

function makeHeartRateWidget(frame, size = "S") {
  return {
    id: "fallback-heart",
    contentType: "heart_rate",
    shape: "circular",
    component: "open_gauge",
    variant: { property: "text", size },
    data: {
      value: "92",
      label: "HR",
      progress: 0.46,
      metricKind: "heart_rate"
    },
    frame,
    layer: "top",
    decision: `fallback heart_rate -> open_gauge ${size} because heart rate moves within a range`
  };
}

function makeIotControlWidget(frame, size = "S") {
  return {
    id: "fallback-iot",
    contentType: "iot_control",
    shape: "circular",
    component: "close_gauge",
    variant: { property: "icon", size },
    data: {
      icon: "thermometer",
      progress: 1,
      metricKind: "completion"
    },
    frame,
    layer: "top",
    decision: `fallback iot_control -> close_gauge ${size} icon because device state is compact and glanceable`
  };
}

function makeTimerRectangle(y = 112, height = 139) {
  return {
    id: "fallback-timer",
    contentType: "timer",
    shape: "rectangular",
    template: "timer_rectangular",
    data: {
      countdown: "3:40",
      timerLabel: "tea",
      running: true
    },
    frame: { x: 0, y, width: 205, height },
    layer: "top",
    cornerRadius: 54,
    cornerSmoothing: 100,
    verticalAlignment: y === 0 ? "top" : "bottom",
    decision: "fallback timer -> timer_rectangular because visible timer controls require the strict rectangular template"
  };
}

function makeMusicWidget(y = 111, height = 140) {
  return {
    id: "fallback-music",
    contentType: "music_control",
    shape: "rectangular",
    template: "music_control",
    data: {
      song: "Evening Focus",
      artist: "Local Mix",
      playPauseAction: "pause"
    },
    frame: { x: 0, y, width: 205, height },
    layer: "top",
    cornerRadius: 54,
    cornerSmoothing: 100,
    verticalAlignment: y === 0 ? "top" : "bottom",
    decision: "fallback music_control -> music_control because playback controls require the strict rectangular template"
  };
}

function makeReminderWidget(y = 124, height = 127) {
  return {
    id: "fallback-reminder",
    contentType: "reminder",
    shape: "rectangular",
    template: "reminder",
    data: {
      content: "Bring umbrella",
      dueDatetime: "before leaving",
      label: "next"
    },
    frame: { x: 0, y, width: 205, height },
    layer: "top",
    cornerRadius: 54,
    cornerSmoothing: 100,
    verticalAlignment: y === 0 ? "top" : "bottom",
    decision: "fallback reminder -> reminder because reminder is a strict rectangular template content type"
  };
}

function makeChecklistWidget() {
  return {
    id: "fallback-checklist",
    contentType: "checklist",
    shape: "rectangular",
    template: "checklist_full_face",
    data: {
      items: ["Keys", "Wallet", "Umbrella"],
      completedItems: ["Keys"],
      completedCount: 1,
      label: "leaving"
    },
    frame: { x: 0, y: 0, width: 205, height: 251 },
    layer: "top",
    cornerRadius: 54,
    cornerSmoothing: 100,
    verticalAlignment: "top",
    decision: "fallback checklist -> checklist_full_face because checklist is a strict full-face template and must be the only widget"
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
    cornerSmoothing: 100,
    verticalAlignment: y === 0 ? "top" : "bottom",
    decision: "fallback upcoming_event -> generated_rectangular_widget because event timing needs readable text"
  };
}

function chooseFallbackId(selectedContentTypes, context = {}) {
  if (selectedContentTypes.includes("checklist")) return "one-rectangular-widget";
  const circularTypes = selectedContentTypes.filter((type) => ["workout", "timer", "heart_rate", "iot_control", "weather"].includes(type));
  const hasTimerRectangle = selectedContentTypes.includes("timer") && shouldUseTimerRectangle(context);
  const hasRectangularType = hasTimerRectangle || selectedContentTypes.some((type) => !["workout", "timer", "heart_rate", "iot_control", "weather"].includes(type));
  if (hasRectangularType && circularTypes.some((type) => type !== "timer" || !hasTimerRectangle)) return "mixed-circular-and-rectangular-layout";
  if (hasRectangularType) return "one-rectangular-widget";
  if (circularTypes.length >= 3) return "three-compact-widgets";
  if (circularTypes.length >= 2) return "two-circular-widgets-with-compact-time";
  return "one-circular-widget-with-large-time";
}

function widgetForContentType(type, context, pseudoContext, frame) {
  if (type === "workout") return makeWorkoutWidget(context, frame, "S");
  if (type === "weather") return makeWeatherWidget(pseudoContext, frame, "S");
  if (type === "timer") return shouldUseTimerRectangle(context) ? makeTimerRectangle() : makeTimerWidget(frame, "S");
  if (type === "heart_rate") return makeHeartRateWidget(frame, "S");
  if (type === "iot_control") return makeIotControlWidget(frame, "S");
  if (type === "upcoming_event") return makeEventRectangle(context, pseudoContext);
  if (type === "music_control") return makeMusicWidget();
  if (type === "reminder") return makeReminderWidget();
  return null;
}

function positionCircularWidgets(widgets) {
  if (widgets.length === 1) {
    return widgets.map((widget) => ({
      ...widget,
      variant: { ...widget.variant, size: "L" },
      frame: { x: 28, y: 6, width: 150, height: 150 }
    }));
  }
  if (widgets.length >= 3) {
    const verticalFrames = [
      { x: 127, y: 6, width: 72, height: 72 },
      { x: 127, y: 89.5, width: 72, height: 72 },
      { x: 127, y: 173, width: 72, height: 72 }
    ];
    return widgets.map((widget, index) => ({
      ...widget,
      frame: verticalFrames[index] || widget.frame
    }));
  }
  const frames = [
    { x: 118, y: 20, width: 72, height: 72 },
    { x: 18, y: 88, width: 72, height: 72 },
    { x: 118, y: 88, width: 72, height: 72 }
  ];
  return widgets.map((widget, index) => ({
    ...widget,
    frame: frames[index] || widget.frame
  }));
}

function buildFallbackWidgets(selectedContentTypes, context, pseudoContext) {
  if (selectedContentTypes.includes("checklist")) {
    return {
      widgets: [makeChecklistWidget()],
      omittedContentTypes: selectedContentTypes.filter((type) => type !== "checklist")
    };
  }

  const seedFrame = { x: 118, y: 20, width: 72, height: 72 };
  const mappedWidgets = selectedContentTypes
    .map((type) => widgetForContentType(type, context, pseudoContext, seedFrame))
    .filter(Boolean);
  const hasRectangularWidget = mappedWidgets.some((widget) => widget.shape === "rectangular");

  if (!hasRectangularWidget) {
    const widgets = positionCircularWidgets(mappedWidgets.slice(0, 3));
    return {
      widgets,
      omittedContentTypes: mappedWidgets.slice(3).map((widget) => widget.contentType)
    };
  }

  const firstRectangular = mappedWidgets.find((widget) => widget.shape === "rectangular");
  const firstCircular = mappedWidgets.find((widget) => widget.shape === "circular");
  const widgets = firstCircular
    ? [
        {
          ...firstCircular,
          frame: { x: 127, y: 16, width: 72, height: 72 }
        },
        firstRectangular
      ]
    : [firstRectangular];
  const renderedContentTypes = new Set(widgets.map((widget) => widget.contentType));
  return {
    widgets,
    omittedContentTypes: selectedContentTypes.filter((type) => !renderedContentTypes.has(type))
  };
}

function fallbackIdFromWidgets(widgets) {
  const circularCount = widgets.filter((widget) => widget.shape === "circular").length;
  const rectangularCount = widgets.filter((widget) => widget.shape === "rectangular").length;
  if (widgets.some((widget) => widget.template === "checklist_full_face")) return "one-rectangular-widget";
  if (rectangularCount > 0 && circularCount > 0) return "mixed-circular-and-rectangular-layout";
  if (rectangularCount > 0) return "one-rectangular-widget";
  if (circularCount >= 3) return "three-compact-widgets";
  if (circularCount >= 2) return "two-circular-widgets-with-compact-time";
  return "one-circular-widget-with-large-time";
}

function resolveTimeDatePlacement(widgets) {
  if (widgets.some((widget) => widget.template === "checklist_full_face")) {
    return {
      timeFrame: { x: 0, y: 0, width: 205, height: 22 },
      dateFrame: { x: 0, y: 22, width: 70, height: 22 },
      timeFontSize: 19,
      timeAnchor: "top_left",
      timeMode: "single_line"
    };
  }
  const bottomRectangle = widgets.find((widget) => widget.shape === "rectangular" && widget.verticalAlignment === "bottom");
  const topCircular = widgets.find((widget) => widget.shape === "circular" && widget.frame.y <= 32);
  const circularCount = widgets.filter((widget) => widget.shape === "circular").length;
  if (circularCount >= 3) {
    return {
      timeFrame: { x: 0, y: 54, width: 110, height: 152 },
      dateFrame: { x: 0, y: 32, width: 70, height: 22 },
      timeFontSize: 82,
      timeAnchor: "left",
      timeMode: "split_hour_minute",
      timeContainers: [
        { id: "time-hour", role: "hour", frame: { x: 0, y: 54, width: 110, height: 76 }, anchor: "left" },
        { id: "time-minute", role: "minute", frame: { x: 0, y: 130, width: 110, height: 76 }, anchor: "left" }
      ],
      dateStackedWithTimeContainerId: "time-hour"
    };
  }
  if (bottomRectangle && topCircular) {
    return {
      timeFrame: { x: 0, y: 0, width: 110, height: 102 },
      dateFrame: { x: 0, y: 102, width: 70, height: 22 },
      timeFontSize: 56,
      timeAnchor: "left",
      timeMode: "split_hour_minute",
      timeContainers: [
        { id: "time-hour", role: "hour", frame: { x: 0, y: 0, width: 110, height: 51 }, anchor: "left" },
        { id: "time-minute", role: "minute", frame: { x: 0, y: 51, width: 110, height: 51 }, anchor: "left" }
      ],
      dateStackedWithTimeContainerId: "time-minute"
    };
  }
  if (bottomRectangle) {
    return {
      timeFrame: { x: 0, y: 0, width: 205, height: 58 },
      dateFrame: { x: 0, y: 58, width: 70, height: 22 },
      timeFontSize: 64,
      timeAnchor: "top_left",
      timeMode: "single_line"
    };
  }
  if (widgets.length === 1 && widgets[0].shape === "circular" && widgets[0].variant?.size === "L") {
    return {
      timeFrame: { x: 0, y: 178, width: 205, height: 73 },
      dateFrame: { x: 0, y: 156, width: 70, height: 22 },
      timeFontSize: 84,
      timeAnchor: "bottom_left",
      timeMode: "single_line"
    };
  }
  return {
    timeFrame: { x: 0, y: 175, width: 205, height: 76 },
    dateFrame: { x: 0, y: 153, width: 70, height: 22 },
    timeFontSize: 84,
    timeAnchor: "bottom_left",
    timeMode: "single_line"
  };
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

function buildLayout({ context, selectedContentTypes, widgets, fallbackId, fallbackReason, now }) {
  const colorSystem = resolveColorSystem(widgets, selectedContentTypes);
  const timeAndDateColor = colorSystem.mode === "mono_tone" ? colorSystem.accentColor : "#FFFFFF";
  const placement = resolveTimeDatePlacement(widgets);
  const splitTime = splitTimeForFace(context.timeOfDay, now);
  const timeStyle = {
    fontFamily: "SF Compact",
    fontSize: placement.timeFontSize,
    fontWeight: 760,
    letterSpacing: 0,
    color: timeAndDateColor,
    treatment: "fill"
  };
  const timeContainers = placement.timeMode === "split_hour_minute"
    ? placement.timeContainers.map((container) => ({
        ...container,
        value: container.role === "hour" ? splitTime.hour : splitTime.minute,
        style: { ...timeStyle }
      }))
    : [
        {
          id: "time-combined",
          role: "combined",
          value: splitTime.combined,
          frame: placement.timeFrame,
          style: { ...timeStyle },
          anchor: placement.timeAnchor
        }
      ];
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
      mode: placement.timeMode,
      value: splitTime.combined,
      layer: "bottom",
      frame: placement.timeFrame,
      style: timeStyle,
      containers: timeContainers
    },
    date: {
      value: currentDateLabel(now),
      priority: "secondary",
      layer: "bottom",
      frame: placement.dateFrame,
      style: {
        fontFamily: "SF Compact",
        fontSize: 19,
        fontWeight: 400,
        letterSpacing: 0,
        color: timeAndDateColor,
        treatment: "fill"
      },
      stackedWithTimeContainerId: placement.dateStackedWithTimeContainerId || timeContainers[0].id,
      stackGap: 0,
      edgePaddingWhenStackedFromEdge: 16
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
  const fallbackSelection = buildFallbackWidgets(selectedContentTypes, context, pseudoContext);
  const widgets = fallbackSelection.widgets;
  const fallbackId = preferences.fallbackId || fallbackIdFromWidgets(widgets) || chooseFallbackId(selectedContentTypes, context);
  const layout = buildLayout({ context, selectedContentTypes, widgets, fallbackId, fallbackReason, now });
  const validator = createLayoutValidator(designPack);
  const validation = validator.validateLayout(layout);
  const widgetDecisions = widgets.map((widget) => widget.decision);
  for (const contentType of fallbackSelection.omittedContentTypes) {
    widgetDecisions.push(`${contentType} -> omitted because fallback ${fallbackId} cannot legally render every selected content type while preserving validation`);
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
