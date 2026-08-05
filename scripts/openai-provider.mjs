const DEFAULT_OPENAI_MODEL = "gpt-5.6-terra";
const PROMPT_VERSION = "watch-face-phase-9-openai-v1";

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
      textStyleKeysOnly: ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "color", "treatment", "textAlign"],
      circularWidgetKeysOnly: ["id", "contentType", "shape", "component", "variant", "data", "frame", "layer"],
      rectangularWidgetKeysOnly: ["id", "contentType", "shape", "template", "data", "composition", "frame", "layer", "cornerRadius", "cornerSmoothing", "surfaceMode", "verticalAlignment"]
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
      colorSystem: { mode: "mono_tone", accentColor: "#3CD3FE", surfaceAccentColor: "#004559", sourceRule: "one-content-type-prefers-mono-tone" },
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
          treatment: "fill",
          textAlign: "center"
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
              treatment: "fill",
              textAlign: "center"
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
      cornerSmoothing: 60,
      surfaceMode: "accent_surface",
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
    "If the user mentions message, messages, text, chat, DM, sender, unread, latest message, last message, or asks what their latest message says, select last_message as the primary content type.",
    "Choose a legal composition before choosing widgets: all-circular layouts may contain up to three widgets; any layout with a rectangular widget may contain at most two widgets; checklist must be the only widget. Widgets themselves must never overlap; only time may overlap a widget by at most 10px.",
    "Only workout, timer, heart_rate, iot_control, and weather may be circular. Other content types are rectangular-only.",
    "For this Phase 9 generation path, prefer circular compositions only for compact progress or status. If the user asks for a workout or exercise summary, recap, stats, details, calories, duration, distance, pace, completion, or comparison, render workout as a generated_rectangular_widget so the summary text and numbers are readable. If the user asks to set, create, start, pause, cancel, reset, label, or control a timer, or includes a duration such as 20 min, render timer as the strict timer_rectangular template. If the user asks to control, toggle, turn on/off, set, adjust, dim, lock/unlock, or change a smart device, room, thermostat, light, fan, heater, AC, or temperature, render iot_control as generated_rectangular_widget. If weather is the only selected content type, do not render one L circular weather widget; prioritize either one generated_rectangular_widget weather summary or three S circular weather widgets split into weather condition, temperature range, and precipitation chance.",
    "If dinner/event timing competes with workout/weather/timer, it is acceptable to defer upcoming_event and render the legal all-circular composition instead.",
    "Music control, reminder, checklist, and rectangular timer must use their strict templates. Other rectangular content should use generated_rectangular_widget.",
    "Checklist is a locked Figma component, not a prompt-invented watch face. When checklist is selected, output exactly one widget using template checklist_full_face with frame {x:0,y:0,width:205,height:251}, verticalAlignment top, surfaceMode accent_surface, cornerRadius 54, and cornerSmoothing 60. The only model-authored content is data.title, data.items, and optional checked/completed item state.",
    "For checklist_full_face, the component owns the date/time/title/list layout. Set top-level date to the component date slot {x:16,y:16,width:70,height:22}. Set top-level time to one compact component time slot {x:139,y:16,width:50,height:22}, SF Compact Regular 19pt, right-aligned. Do not add a separate large watch-face time/date stack around checklist.",
    "Circular widgets must use exact fixed Figma sizes: S is 72x72, M is 90x90, and L is 150x150. The frame width and height must match variant.size exactly.",
    "Choose open_gauge for metrics that move back and forth within a range, including temperature, heart rate/BPM, precipitation probability, UV, air quality, recovery, and pace. Choose close_gauge for one-direction progress, including countdown timer, workout/activity progress, battery, completion, hydration, and focus progress.",
    "close_gauge with property=text has one centered text value and may include a short optional data.label only when the footnote is needed for unit metadata. Close gauge footnote box widths are S=40px, M=50px, L=80px; omit the label when it would clip.",
    "If a close_gauge is the only widget for its content type, use property=icon instead of property=text so the widget communicates what kind of data it represents. Include data.icon and data.progress.",
    "For open_gauge property=text, include both data.value and a short bottom data.label. For open_gauge property=icon, include both data.value and data.icon; the value renders centered and the icon renders in the bottom slot, never in the center. For open_gauge range, include lowLabel and highLabel. For open_gauge offset, include referenceValue. Never leave the bottom text/icon content empty.",
    "Open gauge center values and close_gauge text center values use fixed box widths: S=55px, M=65px, L=115px. Keep displayed values short enough to fit without clipping.",
    "Open gauge bottom text uses fixed Figma font sizes S=15pt, M=18pt, L=32pt and fixed box widths S=48px, M=60px, L=96px. Keep bottom labels very short so they fit without clipping; use an icon variant when the text label would be too long.",
    "When rendering three circular widgets, stack the three circles vertically in one column so they use the full watch-face height. Do not arrange three circular widgets horizontally or in an overlapping row.",
    "When using generated_rectangular_widget, copy the grammar in validGeneratedRectangularWidgetExample: frame.x must be 0, frame.width must be 205, frame.height must be 108-251, cornerRadius must be 54, cornerSmoothing must be 60, surfaceMode must be accent_surface or black_surface, verticalAlignment must be top or bottom, composition.layout must be vertical or horizontal, composition.gap must be 0, 4, 8, 10, or 16, composition.padding is required, and block fields must exactly match their block type.",
    "Generated rectangular inline_small_icon_text.textUnit must be only body, body_emphasis, or secondary; never output primary. Text blocks use unit, not textUnit.",
    "For last_message rectangular widgets, the sender/timestamp line may use inline_small_icon_text with the message icon, but the message content line must be a plain text block without an icon.",
    "Generated rectangular widget text must never truncate, ellipsize, or line-clamp. Do not output maxLines. If text cannot fit on one line, compose it so it wraps onto the next line below; choose shorter copy, fewer blocks, vertical layout, or a taller frame so all wrapped text remains visible.",
    "When a rectangular widget is present, size and place the rectangular widget before sizing time/date. The rectangle must be tall enough for its full content after wrapping; it should fill the remaining watch-face band from its top edge to the nearest watch-face edge. Then fit time and date into the remaining space.",
    "Use semantic icon tokens from material-symbols-registry.json, not raw Material Symbols names.",
    "Never output top-level composition, deferredContentTypes, reasoning, or notes. Put widget composition only inside a rectangular widget with template generated_rectangular_widget.",
    "Never use time.text, date.text, time.fontSize, or date.fontSize. Use time.value/date.value and time.style/date.style exactly. Time must also include time.containers.",
    "Always include colorSystem and layers.",
    "For time, use frame width at least 130 for 44px text, or width at least 150 for 64px text. Do not put 64px time inside a narrow frame.",
    "Time must use SF Compact. single_line uses exactly one combined time container that is centered or anchored to an edge. split_hour_minute uses exactly two independently edge-anchored containers. segmented_digits uses at least two independently edge-anchored containers.",
    "Use split_hour_minute and stack the hour and minute containers vertically when there is only one S or M circular widget on the watch face, when two S circular widgets occupy opposite corners, or when three S circular widgets stack vertically on one side.",
    "When split_hour_minute is required by the circular widget layout, increase the hour and minute font sizes so they fill the remaining empty space on the watch face without violating mask fit or the 10px widget/time overlap rule.",
    "When the user context suggests a focused one-widget watch face and the content type supports circular rendering, show one L circular widget unless the request asks for summary/details/recap/stats text that needs a rectangular generated widget.",
    "When time is placed on a watch-face corner, the padding between time and the watch-face edge must be 0px. Combined time may use a corner only when its container is 205px wide; set style.textAlign to center and increase font size so the text fills that container. Split hour/minute containers may use corners only when each corner-anchored container is wider than 105px, and each font size should increase to fill its container.",
    "When time is placed on a corner, stack the date vertically after the time, away from that corner: below top-corner time, or above bottom-corner time. When date is placed on a corner, keep 16px padding between date and the watch-face edge and stack time vertically inward from the date: below top-corner date, or above bottom-corner date. Date-corner time may be small, split, or big full-width 205px; it does not need to satisfy corner-time width rules unless the time container itself is corner-anchored.",
    "After widgets are placed, if the combined time sits on a row with clear horizontal space, increase the time font size so the digits visually fill the available row. If any time container is full width at 205px, set style.textAlign to center and make the estimated digit width at least 85% of the 205px watch-face width unless that would violate the 10px widget overlap rule.",
    "Date must use compact uppercase weekday plus numeric day, for example SUN 2. Date must use SF Compact Regular 19pt, stack vertically with one time container, use stackGap 0, and include stackedWithTimeContainerId and edgePaddingWhenStackedFromEdge 16.",
    "Time should fill the remaining empty space after rectangular widgets have claimed the height required by their content. Keep all frames inside the 205 x 251 canvas. Date must not overlap widgets; time may overlap widgets by at most 10px.",
    "For color mode, one visible widget content type should use mono_tone. When two or three visible widget content types are rendered, choose mono_tone and multicolor at roughly equal rates across requests; use multicolor when explicit semantic distinction matters, and use mono_tone when visual unity matters. Respect explicit requests for colorful, multicolor, monochrome, or single-color modes.",
    "Every rectangular widget must include surfaceMode. The most important rectangular widget should use surfaceMode accent_surface, which renders the dark content type accent as the widget background with white text and icons. If there are two rectangular widgets, only the more important rectangular widget may use accent_surface; the other must use black_surface.",
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
