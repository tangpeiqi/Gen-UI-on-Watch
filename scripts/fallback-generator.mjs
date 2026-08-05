import fs from "node:fs";
import { createLayoutValidator } from "./layout-validator.mjs";

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

function resizeRectangularWidgetToContent(widget) {
  if (widget.shape !== "rectangular" || widget.template === "checklist_full_face") return widget;
  const next = { ...widget, frame: { ...(widget.frame || { x: 0, y: 0, width: 205, height: 108 }) } };
  if (next.template === "generated_rectangular_widget") {
    next.frame.height = Math.min(251, Math.max(next.frame.height || 0, 108, estimateGeneratedRectangularContentHeight(next)));
  }
  next.frame.x = 0;
  next.frame.width = 205;
  if (next.verticalAlignment === "top") {
    next.frame.y = 0;
  } else {
    next.verticalAlignment = "bottom";
    next.frame.y = Math.max(0, 251 - next.frame.height);
  }
  return next;
}

function inferSelectedContentTypes(context) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  const selected = [];

  if (/(checklist|shopping list|task list|packing list)/.test(text)) return ["checklist"];
  if (/(message|messages|text|texts|chat|dm|latest message|last message|unread|sender|reply)/.test(text)) selected.push("last_message");
  if (/(music|song|playlist|audio|podcast|playback)/.test(text)) selected.push("music_control");
  if (/(timer|countdown|pause|cancel|start timer|reset timer|set .*min|set .*minute|set .*hour|set .*sec)/.test(text)) selected.push("timer");
  if (/(remind|reminder|todo|to-do|complete task|mark complete)/.test(text)) selected.push("reminder");
  if (/(run|running|walk|workout|gym|exercise|mobility)/.test(text)) selected.push("workout");
  if (/(iot|device|thermostat|light|lights|lamp|lock|fan|ac|heater|temperature|turn on|turn off|set .*degree|set .*temp|control .*room|smart home)/.test(text)) selected.push("iot_control");
  if (/(dinner|meeting|appointment|pickup|commute|on time|schedule|call)/.test(text)) selected.push("upcoming_event");
  if (/(rain|weather|outside|outdoors|waterfront)/.test(text)) selected.push("weather");
  if (selected.length === 0) selected.push("upcoming_event");
  if (!selected.includes("weather") && !selected.includes("last_message") && selected.length < 3) selected.push("weather");
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

function latestMessageFromContext(pseudoContext) {
  const messages = pseudoContext.messageContext?.messages || [];
  const latest = [...messages].reverse().find((message) => message.direction !== "sent") || messages.at(-1);
  return {
    sender: latest?.sender && latest.sender !== "persona" ? latest.sender : "Latest",
    time: latest?.time || "",
    content: latest?.content || "No recent message"
  };
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
  return /(set|create|start|pause|cancel|control|action|reset|buttons|full timer|for my|for the|minutes?|mins?|hours?|seconds?|cooking|cook|salmon|tea|label|named)/.test(text);
}

function shouldUseWorkoutRectangle(context) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  return /(summary|summarize|recap|stats|detail|details|exercise summary|workout summary|calories|duration|distance|pace|finished|finish|completed|complete)/.test(text);
}

function shouldUseIotControlRectangle(context) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  return /(control|action|turn on|turn off|toggle|set|adjust|change|increase|decrease|dim|lock|unlock|open|close|thermostat|temperature|temp|degree|degrees|room|kitchen|device|lights?|lamp|fan|heater|ac)/.test(text);
}

function timerCountdownFromContext(context) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  const match = text.match(/(\d{1,3})\s*(min|mins|minute|minutes|hr|hrs|hour|hours|sec|secs|second|seconds)/);
  if (!match) return "20:00";
  const amount = Number(match[1]);
  const unit = match[2];
  if (/sec/.test(unit)) return `0:${String(amount).padStart(2, "0")}`;
  if (/h/.test(unit)) return `${amount}:00:00`;
  return `${amount}:00`;
}

function timerLabelFromContext(context) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  const forMatch = text.match(/for (?:my |the )?([a-z][a-z\s]{1,24})/);
  if (forMatch) return forMatch[1].replace(/\b(timer|countdown)\b/g, "").trim() || "timer";
  if (/salmon/.test(text)) return "salmon";
  if (/tea/.test(text)) return "tea";
  return "timer";
}

function weatherProgress(pseudoContext) {
  const weather = Array.isArray(pseudoContext.weather) ? pseudoContext.weather[0] : pseudoContext.weather?.today;
  const chance = weather?.rainChancePercent ?? weather?.rainChance ?? 68;
  return Math.max(0, Math.min(1, chance / 100));
}

function weatherEntryFromContext(context, pseudoContext) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  const entries = Array.isArray(pseudoContext.weather) ? pseudoContext.weather : Object.values(pseudoContext.weather || {});
  const targetDay = /tomorrow/.test(text) ? "tomorrow" : "today";
  return entries.find((entry) => entry.relativeDay === targetDay) || entries[0] || {
    condition: "Partly cloudy",
    highTemperatureF: 67,
    lowTemperatureF: 52,
    rainChancePercent: 24
  };
}

function weatherIconForCondition(condition = "") {
  const text = String(condition).toLowerCase();
  if (/rain|shower|storm/.test(text)) return "weather_rain";
  if (/snow/.test(text)) return "weather_snowy";
  if (/sun|clear/.test(text)) return "weather_sunny";
  if (/partly/.test(text)) return "weather_partly_cloudy";
  return "weather_cloudy";
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

function makeWorkoutSummaryRectangle(context, y = 124, height = 127) {
  const activity = activityLabelFromContext(context);
  const title = activity === "run" ? "Run summary" : `${activity[0].toUpperCase()}${activity.slice(1)} summary`;
  const icon = activity === "lift" ? "workout_strength" : "workout_running";
  return {
    id: "fallback-workout-summary",
    contentType: "workout",
    shape: "rectangular",
    template: "generated_rectangular_widget",
    data: {
      icon,
      value: "322",
      label: "CAL",
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
          text: title
        },
        {
          type: "number_text_lockup",
          value: "322",
          unitLabel: "CAL",
          secondaryText: "goal done"
        },
        {
          type: "text",
          unit: "body",
          text: "58 min · steady pace"
        }
      ]
    },
    frame: { x: 0, y, width: 205, height },
    layer: "top",
    cornerRadius: 54,
    cornerSmoothing: 60,
    surfaceMode: "accent_surface",
    verticalAlignment: y === 0 ? "top" : "bottom",
    decision: "fallback workout -> generated_rectangular_widget because workout summary asks for readable details"
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

function makeWeatherOnlyWidgets(context, pseudoContext) {
  const weather = weatherEntryFromContext(context, pseudoContext);
  const high = weather.highTemperatureF ?? weather.temperatureRangeF?.[1] ?? 67;
  const low = weather.lowTemperatureF ?? weather.temperatureRangeF?.[0] ?? 52;
  const rainChance = weather.rainChancePercent ?? weather.rainChance ?? 24;
  const conditionIcon = weatherIconForCondition(weather.condition);
  return [
    {
      id: "fallback-weather-condition",
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
      layer: "top",
      decision: "fallback weather -> close_gauge S icon for weather condition"
    },
    {
      id: "fallback-weather-range",
      contentType: "weather",
      shape: "circular",
      component: "open_gauge",
      variant: { property: "range", size: "S" },
      data: {
        value: `${Math.round(high)}°`,
        lowLabel: `${Math.round(low)}°`,
        highLabel: `${Math.round(high)}°`,
        progress: 0.7,
        metricKind: "temperature"
      },
      frame: { x: 127, y: 89.5, width: 72, height: 72 },
      layer: "top",
      decision: "fallback weather -> open_gauge S range for temperature range"
    },
    {
      id: "fallback-weather-precipitation",
      contentType: "weather",
      shape: "circular",
      component: "open_gauge",
      variant: { property: "icon", size: "S" },
      data: {
        icon: "weather_umbrella",
        value: `${Math.round(rainChance)}%`,
        progress: Math.max(0, Math.min(1, rainChance / 100)),
        metricKind: "precipitation_probability"
      },
      frame: { x: 127, y: 173, width: 72, height: 72 },
      layer: "top",
      decision: "fallback weather -> open_gauge S icon for precipitation chance"
    }
  ];
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

function makeTimerRectangle(context = {}, y = 112, height = 139) {
  return {
    id: "fallback-timer",
    contentType: "timer",
    shape: "rectangular",
    template: "timer_rectangular",
    data: {
      countdown: timerCountdownFromContext(context),
      timerLabel: timerLabelFromContext(context),
      running: true
    },
    frame: { x: 0, y, width: 205, height },
    layer: "top",
    cornerRadius: 54,
    cornerSmoothing: 60,
    verticalAlignment: y === 0 ? "top" : "bottom",
    decision: "fallback timer -> timer_rectangular because visible timer controls require the strict rectangular template"
  };
}

function makeIotControlRectangle(context = {}, y = 124, height = 127) {
  const text = `${context.activity || ""} ${context.goal || ""}`.toLowerCase();
  const device = /light|lamp/.test(text) ? "Kitchen lights" : /fan/.test(text) ? "Kitchen fan" : "Thermostat";
  const value = /light|lamp/.test(text) ? "ON" : /fan/.test(text) ? "2" : "70";
  const unitLabel = /light|lamp/.test(text) ? "" : /fan/.test(text) ? "SPD" : "F";
  return {
    id: "fallback-iot-control",
    contentType: "iot_control",
    shape: "rectangular",
    template: "generated_rectangular_widget",
    data: {
      icon: "thermometer",
      value,
      label: unitLabel || "ON",
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
          text: device
        },
        {
          type: "number_text_lockup",
          value,
          ...(unitLabel ? { unitLabel } : {}),
          secondaryText: "set"
        },
        {
          type: "text",
          unit: "body",
          text: "Control ready"
        }
      ]
    },
    frame: { x: 0, y, width: 205, height },
    layer: "top",
    cornerRadius: 54,
    cornerSmoothing: 60,
    surfaceMode: "accent_surface",
    verticalAlignment: y === 0 ? "top" : "bottom",
    decision: "fallback iot_control -> generated_rectangular_widget because device control needs readable state and action detail"
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
    cornerSmoothing: 60,
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
      label: "Reminder"
    },
    frame: { x: 0, y, width: 205, height },
    layer: "top",
    cornerRadius: 54,
    cornerSmoothing: 60,
    surfaceMode: "accent_surface",
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
    cornerSmoothing: 60,
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
    cornerSmoothing: 60,
    verticalAlignment: y === 0 ? "top" : "bottom",
    decision: "fallback upcoming_event -> generated_rectangular_widget because event timing needs readable text"
  };
}

function makeLastMessageRectangle(pseudoContext, y = 0, height = 108) {
  const latest = latestMessageFromContext(pseudoContext);
  const senderLine = [latest.sender, latest.time].filter(Boolean).join(" · ");
  const content = latest.content
    .replace(/^I can bring a couple /i, "")
    .replace(/\.$/, "")
    .slice(0, 36);
  return {
    id: "fallback-last-message",
    contentType: "last_message",
    shape: "rectangular",
    template: "generated_rectangular_widget",
    data: {
      icon: "message",
      value: latest.sender,
      label: latest.time,
      metricKind: "latest_message"
    },
    composition: {
      layout: "vertical",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      gap: 8,
      verticalAlignment: "center",
      blocks: [
        {
          type: "inline_small_icon_text",
          icon: "message",
          textUnit: "secondary",
          text: senderLine || "Latest message"
        },
        {
          type: "text",
          unit: "body_emphasis",
          text: content || "No recent message"
        }
      ]
    },
    frame: { x: 0, y, width: 205, height },
    layer: "top",
    cornerRadius: 54,
    cornerSmoothing: 60,
    surfaceMode: "accent_surface",
    verticalAlignment: y === 0 ? "top" : "bottom",
    decision: "fallback last_message -> generated_rectangular_widget because message previews need readable rectangular text; only sender metadata uses an optional icon"
  };
}

function chooseFallbackId(selectedContentTypes, context = {}) {
  if (selectedContentTypes.includes("checklist")) return "one-rectangular-widget";
  if (selectedContentTypes.length === 1 && selectedContentTypes[0] === "weather") return "three-compact-widgets";
  const circularTypes = selectedContentTypes.filter((type) => ["workout", "timer", "heart_rate", "iot_control", "weather"].includes(type));
  const hasTimerRectangle = selectedContentTypes.includes("timer") && shouldUseTimerRectangle(context);
  const hasIotRectangle = selectedContentTypes.includes("iot_control") && shouldUseIotControlRectangle(context);
  const hasRectangularType = hasTimerRectangle || hasIotRectangle || selectedContentTypes.some((type) => !["workout", "timer", "heart_rate", "iot_control", "weather"].includes(type));
  if (hasRectangularType && circularTypes.some((type) => (type !== "timer" || !hasTimerRectangle) && (type !== "iot_control" || !hasIotRectangle))) return "mixed-circular-and-rectangular-layout";
  if (hasRectangularType) return "one-rectangular-widget";
  if (circularTypes.length >= 3) return "three-compact-widgets";
  if (circularTypes.length >= 2) return "two-circular-widgets-with-compact-time";
  return "one-circular-widget-with-large-time";
}

function widgetForContentType(type, context, pseudoContext, frame) {
  if (type === "workout") return shouldUseWorkoutRectangle(context)
    ? makeWorkoutSummaryRectangle(context)
    : makeWorkoutWidget(context, frame, "S");
  if (type === "weather") return makeWeatherWidget(pseudoContext, frame, "S");
  if (type === "timer") return shouldUseTimerRectangle(context) ? makeTimerRectangle(context) : makeTimerWidget(frame, "S");
  if (type === "heart_rate") return makeHeartRateWidget(frame, "S");
  if (type === "iot_control") return shouldUseIotControlRectangle(context) ? makeIotControlRectangle(context) : makeIotControlWidget(frame, "S");
  if (type === "upcoming_event") return makeEventRectangle(context, pseudoContext);
  if (type === "last_message") return makeLastMessageRectangle(pseudoContext);
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

  if (selectedContentTypes.includes("workout") && shouldUseWorkoutRectangle(context)) {
    return {
      widgets: [makeWorkoutSummaryRectangle(context)],
      omittedContentTypes: selectedContentTypes.filter((type) => type !== "workout")
    };
  }

  if (selectedContentTypes.includes("timer") && shouldUseTimerRectangle(context)) {
    return {
      widgets: [makeTimerRectangle(context)],
      omittedContentTypes: selectedContentTypes.filter((type) => type !== "timer")
    };
  }

  if (selectedContentTypes.includes("iot_control") && shouldUseIotControlRectangle(context)) {
    return {
      widgets: [makeIotControlRectangle(context)],
      omittedContentTypes: selectedContentTypes.filter((type) => type !== "iot_control")
    };
  }

  if (selectedContentTypes.length === 1 && selectedContentTypes[0] === "weather") {
    return {
      widgets: makeWeatherOnlyWidgets(context, pseudoContext),
      omittedContentTypes: []
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
      timeFrame: { x: 139, y: 16, width: 50, height: 22 },
      dateFrame: { x: 16, y: 16, width: 70, height: 22 },
      timeFontSize: 19,
      timeAnchor: "top",
      timeMode: "single_line",
      timeFontWeight: 400,
      timeTextAlign: "right"
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
    const availableHeight = Math.max(64, bottomRectangle.frame.y);
    const dateY = Math.max(42, availableHeight - 22);
    const splitHeight = Math.floor(dateY / 2);
    return {
      timeFrame: { x: 0, y: 0, width: 110, height: splitHeight * 2 },
      dateFrame: { x: 0, y: splitHeight * 2, width: 70, height: 22 },
      timeFontSize: 56,
      timeAnchor: "left",
      timeMode: "split_hour_minute",
      timeContainers: [
        { id: "time-hour", role: "hour", frame: { x: 0, y: 0, width: 110, height: splitHeight }, anchor: "top_left" },
        { id: "time-minute", role: "minute", frame: { x: 0, y: splitHeight, width: 110, height: splitHeight }, anchor: "left" }
      ],
      dateStackedWithTimeContainerId: "time-minute"
    };
  }
  if (bottomRectangle) {
    const availableHeight = Math.max(64, bottomRectangle.frame.y);
    const timeHeight = Math.max(42, availableHeight - 22);
    const timeFontSize = Math.max(48, Math.min(88, Math.floor(timeHeight * 1.18)));
    return {
      timeFrame: { x: 0, y: 0, width: 205, height: timeHeight },
      dateFrame: { x: 0, y: timeHeight, width: 70, height: 22 },
      timeFontSize,
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

function resolveColorSystem(widgets, selectedContentTypes, context = {}) {
  const renderedContentTypes = [...new Set(widgets.map((widget) => widget.contentType))];
  const semanticCount = renderedContentTypes.length || new Set(selectedContentTypes).size;
  const primaryContentType = renderedContentTypes[0] || selectedContentTypes[0];
  const accentColor = ACCENT_BY_CONTENT_TYPE[primaryContentType] || "#D94C00";
  const surfaceAccentColor = ACCENT_SURFACE_BY_CONTENT_TYPE[primaryContentType] || "#592A00";
  const explicitMode = explicitColorModeFromContext(context);
  if (explicitMode) return { mode: explicitMode, accentColor, surfaceAccentColor, sourceRule: "user-context-explicit-color-mode" };
  if (semanticCount === 1) return { mode: "mono_tone", accentColor, surfaceAccentColor, sourceRule: "one-content-type-prefers-mono-tone" };
  return {
    mode: balancedColorModeForContext(context, renderedContentTypes),
    accentColor,
    surfaceAccentColor,
    sourceRule: "multi-content-balanced-color-mode"
  };
}

function resolveRectangularSurfaceMode(widget, widgets) {
  if (["black_surface", "accent_surface"].includes(widget.surfaceMode)) return widget.surfaceMode;
  if (widget.shape !== "rectangular") return undefined;
  const rectangularWidgets = widgets.filter((item) => item.shape === "rectangular");
  return rectangularWidgets[0]?.id === widget.id ? "accent_surface" : "black_surface";
}

function withResolvedRectangularSurfaceModes(widgets) {
  return widgets.map((widget) => {
    if (widget.shape !== "rectangular") return widget;
    return {
      ...widget,
      surfaceMode: resolveRectangularSurfaceMode(widget, widgets)
    };
  });
}

function buildLayout({ context, selectedContentTypes, widgets, fallbackId, fallbackReason, now }) {
  const sizedWidgets = widgets.map(resizeRectangularWidgetToContent);
  const resolvedWidgets = withResolvedRectangularSurfaceModes(sizedWidgets);
  const colorSystem = resolveColorSystem(resolvedWidgets, selectedContentTypes, context);
  const timeAndDateColor = colorSystem.mode === "mono_tone" ? colorSystem.accentColor : "#FFFFFF";
  const placement = resolveTimeDatePlacement(resolvedWidgets);
  const splitTime = splitTimeForFace(context.timeOfDay, now);
  const timeFontSize = placement.timeFrame.width === 205
    ? Math.min(placement.timeFontSize, Math.floor((placement.timeFrame.width - 2) / (splitTime.combined.length * 0.58)))
    : placement.timeFontSize;
  const timeStyle = {
    fontFamily: "SF Compact",
    fontSize: timeFontSize,
    fontWeight: placement.timeFontWeight || 760,
    letterSpacing: 0,
    color: timeAndDateColor,
    treatment: "fill",
    ...(placement.timeFrame.width === 205 ? { textAlign: "center" } : {}),
    ...(placement.timeTextAlign ? { textAlign: placement.timeTextAlign } : {})
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
    widgets: resolvedWidgets.map(({ decision, ...widget }) => widget),
    layers: { bottom: ["time", "date"], top: resolvedWidgets.map((widget) => widget.id) }
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
