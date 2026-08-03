export function createLayoutValidator({
  schema,
  materialSymbolsRegistry,
  widgetSelectionPolicy,
  generatedRectangularWidgetSchema
}) {
  const circularComponents = new Set(["close_gauge", "open_gauge"]);
  const rectangularTemplates = new Set(["music_control", "reminder", "timer_rectangular", "checklist_full_face", "generated_rectangular_widget"]);
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
  const cornerSafeSplitTimeMinWidth = 110;
  const fullWidthTimeFillRatio = 0.85;
  const splitTimeFillRatio = 0.55;
  const openGaugeBottomText = {
    S: { fontSize: 15, width: 18 },
    M: { fontSize: 18, width: 21 },
    L: { fontSize: 32, width: 35 }
  };
  const contentTypes = new Set(schema.$defs.contentType.enum);
  const iconTokens = materialSymbolsRegistry.tokens;
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
  const fallbackReasons = new Set(["no_ai_provider", "api_failure", "timeout", "invalid_output", "budget_exhausted"]);
  const templateContentTypes = {
    music_control: "music_control",
    reminder: "reminder",
    timer_rectangular: "timer",
    checklist_full_face: "checklist"
  };

  function error(stage, code, path, message) {
    return { severity: "error", stage, code, path, message };
  }

  function warning(code, path, message) {
    return { severity: "warning", stage: "rule", code, path, message };
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function hasOnlyKeys(value, allowedKeys, path, errors) {
    if (!isObject(value)) {
      errors.push(error("schema", "expected_object", path, `${path} must be an object`));
      return false;
    }
    for (const key of Object.keys(value)) {
      if (!allowedKeys.has(key)) {
        errors.push(error("schema", "extra_property", `${path}.${key}`, `${path}.${key} is not allowed`));
      }
    }
    return true;
  }

  function requireKeys(value, keys, path, errors) {
    if (!isObject(value)) {
      return;
    }
    for (const key of keys) {
      if (value[key] === undefined) {
        errors.push(error("schema", "missing_required", `${path}.${key}`, `${path}.${key} is required`));
      }
    }
  }

  function validateFrame(frame, path, errors, { rectangular = false } = {}) {
    if (!hasOnlyKeys(frame, new Set(["x", "y", "width", "height"]), path, errors)) {
      return;
    }
    for (const key of ["x", "y", "width", "height"]) {
      if (typeof frame[key] !== "number") {
        errors.push(error("schema", "invalid_type", `${path}.${key}`, `${path}.${key} must be a number`));
      }
    }
    if (errors.some((item) => item.path.startsWith(path) && item.code === "invalid_type")) {
      return;
    }
    if (frame.width <= 0 || frame.width > 205) {
      errors.push(error("schema", "frame_width_out_of_range", `${path}.width`, `${path}.width must be > 0 and <= 205`));
    }
    if (frame.height <= 0 || frame.height > 251) {
      errors.push(error("schema", "frame_height_out_of_range", `${path}.height`, `${path}.height must be > 0 and <= 251`));
    }
    if (rectangular) {
      if (frame.x !== 0) errors.push(error("rule", "rectangular_x_must_be_zero", `${path}.x`, `${path}.x must be 0`));
      if (frame.width !== 205) errors.push(error("rule", "rectangular_full_width", `${path}.width`, `${path}.width must be 205`));
      if (frame.height < 108 || frame.height > 251) errors.push(error("rule", "rectangular_height_range", `${path}.height`, `${path}.height must be between 108 and 251`));
    }
    if (frame.x < 0 || frame.y < 0 || frame.x + frame.width > 205 || frame.y + frame.height > 251) {
      errors.push(error("rule", "frame_outside_canvas", path, `${path} must fit inside the 205 x 251 canvas`));
    }
  }

  function validateTextStyle(style, path, errors) {
    if (!hasOnlyKeys(style, new Set(["fontFamily", "fontSize", "fontWeight", "letterSpacing", "color", "treatment"]), path, errors)) {
      return;
    }
    requireKeys(style, ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "color", "treatment"], path, errors);
    if (typeof style.fontFamily !== "string" || style.fontFamily.length === 0) errors.push(error("schema", "invalid_type", `${path}.fontFamily`, `${path}.fontFamily must be a non-empty string`));
    if (typeof style.fontSize !== "number" || style.fontSize <= 0) errors.push(error("schema", "invalid_type", `${path}.fontSize`, `${path}.fontSize must be a positive number`));
    if (!Number.isInteger(style.fontWeight) || style.fontWeight < 100 || style.fontWeight > 1000) errors.push(error("schema", "invalid_type", `${path}.fontWeight`, `${path}.fontWeight must be an integer from 100 to 1000`));
    if (typeof style.letterSpacing !== "number") errors.push(error("schema", "invalid_type", `${path}.letterSpacing`, `${path}.letterSpacing must be a number`));
    if (!/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(style.color || "")) errors.push(error("schema", "invalid_color", `${path}.color`, `${path}.color must be a hex color`));
    if (!["fill", "outline_stroke"].includes(style.treatment)) errors.push(error("schema", "invalid_enum", `${path}.treatment`, `${path}.treatment is invalid`));
  }

  function validateTimeContainer(container, path, errors) {
    if (!hasOnlyKeys(container, new Set(["id", "role", "value", "frame", "style", "anchor"]), path, errors)) {
      return;
    }
    requireKeys(container, ["id", "role", "value", "frame", "style", "anchor"], path, errors);
    if (typeof container.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(container.id)) errors.push(error("schema", "invalid_id", `${path}.id`, `${path}.id is invalid`));
    if (!["combined", "hour", "minute", "digit_group", "digit", "separator"].includes(container.role)) errors.push(error("schema", "invalid_enum", `${path}.role`, `${path}.role is invalid`));
    if (typeof container.value !== "string" || container.value.length === 0) errors.push(error("schema", "missing_required", `${path}.value`, `${path}.value is required`));
    if (!["center", "top", "left", "right", "bottom", "top_left", "top_right", "bottom_left", "bottom_right"].includes(container.anchor)) errors.push(error("schema", "invalid_enum", `${path}.anchor`, `${path}.anchor is invalid`));
    validateFrame(container.frame, `${path}.frame`, errors);
    validateTextStyle(container.style, `${path}.style`, errors);
  }

  function anchorEdges(anchor) {
    if (anchor === "center") return [];
    return String(anchor || "").split("_").filter(Boolean);
  }

  function isCornerAnchor(anchor) {
    const edges = anchorEdges(anchor);
    return edges.length >= 2 && edges.some((edge) => ["top", "bottom"].includes(edge)) && edges.some((edge) => ["left", "right"].includes(edge));
  }

  function approxEqual(a, b, tolerance = 0.5) {
    return Math.abs(a - b) <= tolerance;
  }

  function unionFrame(frames) {
    const left = Math.min(...frames.map((frame) => frame.x));
    const top = Math.min(...frames.map((frame) => frame.y));
    const right = Math.max(...frames.map((frame) => frame.x + frame.width));
    const bottom = Math.max(...frames.map((frame) => frame.y + frame.height));
    return { x: left, y: top, width: right - left, height: bottom - top };
  }

  function sameTimeTreatment(a, b) {
    return a.fontFamily === b.fontFamily &&
      a.fontWeight === b.fontWeight &&
      a.letterSpacing === b.letterSpacing &&
      a.color === b.color &&
      a.treatment === b.treatment;
  }

  function validateTimeObject(object, path, errors) {
    if (!hasOnlyKeys(object, new Set(["mode", "value", "layer", "frame", "style", "containers"]), path, errors)) {
      return;
    }
    requireKeys(object, ["mode", "value", "layer", "frame", "style", "containers"], path, errors);
    if (!["single_line", "split_hour_minute", "segmented_digits"].includes(object.mode)) errors.push(error("schema", "invalid_enum", `${path}.mode`, `${path}.mode is invalid`));
    if (typeof object.value !== "string" || object.value.length === 0) errors.push(error("schema", "missing_required", `${path}.value`, `${path}.value is required`));
    if (object.layer !== "bottom") errors.push(error("schema", "invalid_const", `${path}.layer`, `${path}.layer must be bottom`));
    validateFrame(object.frame, `${path}.frame`, errors);
    validateTextStyle(object.style, `${path}.style`, errors);
    if (!Array.isArray(object.containers)) {
      errors.push(error("schema", "invalid_type", `${path}.containers`, `${path}.containers must be an array`));
      return;
    }
    if (object.containers.length < 1 || object.containers.length > 6) errors.push(error("schema", "invalid_array_length", `${path}.containers`, `${path}.containers length is invalid`));
    object.containers.forEach((container, index) => validateTimeContainer(container, `${path}.containers[${index}]`, errors));
  }

  function validateDateObject(object, path, errors) {
    if (!hasOnlyKeys(object, new Set(["value", "priority", "layer", "frame", "style", "stackedWithTimeContainerId", "stackGap", "edgePaddingWhenStackedFromEdge"]), path, errors)) {
      return;
    }
    requireKeys(object, ["value", "priority", "layer", "frame", "style", "stackedWithTimeContainerId", "stackGap", "edgePaddingWhenStackedFromEdge"], path, errors);
    if (typeof object.value !== "string" || !/^[A-Z]{3} [0-9]{1,2}$/.test(object.value)) errors.push(error("rule", "date_compact_format", `${path}.value`, `${path}.value must use compact format like SUN 2`));
    if (object.priority !== "secondary") errors.push(error("schema", "invalid_const", `${path}.priority`, `${path}.priority must be secondary`));
    if (object.layer !== "bottom") errors.push(error("schema", "invalid_const", `${path}.layer`, `${path}.layer must be bottom`));
    validateFrame(object.frame, `${path}.frame`, errors);
    validateTextStyle(object.style, `${path}.style`, errors);
    if (typeof object.stackedWithTimeContainerId !== "string" || !/^[a-z][a-z0-9-]*$/.test(object.stackedWithTimeContainerId)) errors.push(error("schema", "invalid_id", `${path}.stackedWithTimeContainerId`, `${path}.stackedWithTimeContainerId is invalid`));
    if (object.stackGap !== 0) errors.push(error("schema", "invalid_const", `${path}.stackGap`, `${path}.stackGap must be 0`));
    if (object.edgePaddingWhenStackedFromEdge !== 16) errors.push(error("schema", "invalid_const", `${path}.edgePaddingWhenStackedFromEdge`, `${path}.edgePaddingWhenStackedFromEdge must be 16`));
  }

  function validateColorSystem(colorSystem, errors) {
    if (!hasOnlyKeys(colorSystem, new Set(["mode", "accentColor", "sourceRule"]), "colorSystem", errors)) {
      return;
    }
    requireKeys(colorSystem, ["mode", "accentColor", "sourceRule"], "colorSystem", errors);
    if (!colorSystemModes.has(colorSystem.mode)) errors.push(error("schema", "invalid_enum", "colorSystem.mode", "colorSystem.mode is invalid"));
    if (!/^#[0-9a-fA-F]{6}$/.test(colorSystem.accentColor || "")) errors.push(error("schema", "invalid_color", "colorSystem.accentColor", "colorSystem.accentColor must be a 6-digit hex color"));
    if (!colorSystemSourceRules.has(colorSystem.sourceRule)) errors.push(error("schema", "invalid_enum", "colorSystem.sourceRule", "colorSystem.sourceRule is invalid"));
  }

  function validateGeneratedIcon(icon, contentType, path, errors) {
    if (!iconTokens[icon]) {
      errors.push(error("schema", "unknown_icon_token", path, `${path} is not in material-symbols-registry.json`));
      return;
    }
    if (!iconTokens[icon].allowedContentTypes.includes(contentType)) {
      errors.push(error("rule", "icon_content_type_mismatch", path, `${path} is not allowed for content type ${contentType}`));
    }
  }

  function validateGeneratedTextBlock(block, path, errors) {
    if (!generatedRectangularTextUnits.has(block.unit)) errors.push(error("schema", "invalid_enum", `${path}.unit`, `${path}.unit is invalid`));
    if (typeof block.text !== "string" || block.text.length === 0 || block.text.length > 36) errors.push(error("rule", "text_length_out_of_range", `${path}.text`, `${path}.text must be 1-36 characters`));
    if (block.maxLines !== undefined && (!Number.isInteger(block.maxLines) || block.maxLines < 1 || block.maxLines > 2)) errors.push(error("schema", "invalid_range", `${path}.maxLines`, `${path}.maxLines is invalid`));
  }

  function validateGeneratedRectangularBlock(block, contentType, path, errors) {
    if (!isObject(block)) {
      errors.push(error("schema", "expected_object", path, `${path} must be an object`));
      return;
    }
    if (!generatedRectangularBlockTypes.has(block.type)) {
      errors.push(error("schema", "invalid_enum", `${path}.type`, `${path}.type is invalid`));
      return;
    }
    if (block.type === "text") {
      validateGeneratedTextBlock(block, path, errors);
    }
    if (block.type === "inline_small_icon_text") {
      validateGeneratedIcon(block.icon, contentType, `${path}.icon`, errors);
      if (!["body", "body_emphasis", "secondary"].includes(block.textUnit)) errors.push(error("schema", "invalid_enum", `${path}.textUnit`, `${path}.textUnit is invalid`));
      if (typeof block.text !== "string" || block.text.length === 0 || block.text.length > 36) errors.push(error("rule", "text_length_out_of_range", `${path}.text`, `${path}.text must be 1-36 characters`));
    }
    if (block.type === "big_icon_text_group") {
      validateGeneratedIcon(block.icon, contentType, `${path}.icon`, errors);
      if (!["left", "right"].includes(block.iconPosition)) errors.push(error("schema", "invalid_enum", `${path}.iconPosition`, `${path}.iconPosition is invalid`));
      if (!Array.isArray(block.textGroup) || block.textGroup.length < 1 || block.textGroup.length > 3) {
        errors.push(error("schema", "invalid_array_length", `${path}.textGroup`, `${path}.textGroup is invalid`));
      } else {
        block.textGroup.forEach((textBlock, index) => validateGeneratedTextBlock(textBlock, `${path}.textGroup[${index}]`, errors));
      }
    }
    if (block.type === "number_text_lockup") {
      if (block.value === undefined) errors.push(error("schema", "missing_required", `${path}.value`, `${path}.value is required`));
      if (block.unitLabel !== undefined && (typeof block.unitLabel !== "string" || block.unitLabel.length > 12)) errors.push(error("rule", "text_length_out_of_range", `${path}.unitLabel`, `${path}.unitLabel is invalid`));
      if (block.secondaryText !== undefined && (typeof block.secondaryText !== "string" || block.secondaryText.length > 18)) errors.push(error("rule", "text_length_out_of_range", `${path}.secondaryText`, `${path}.secondaryText is invalid`));
    }
    if (block.type === "edge_progress_bar") {
      if (!["top", "bottom"].includes(block.edge)) errors.push(error("schema", "invalid_enum", `${path}.edge`, `${path}.edge is invalid`));
      if (typeof block.progress !== "number" || block.progress < 0 || block.progress > 1) errors.push(error("schema", "invalid_range", `${path}.progress`, `${path}.progress is invalid`));
    }
  }

  function validateGeneratedRectangularComposition(composition, contentType, path, errors) {
    if (!isObject(composition)) {
      errors.push(error("schema", "missing_required", path, `${path} is required`));
      return;
    }
    if (!["vertical", "horizontal"].includes(composition.layout)) errors.push(error("schema", "invalid_enum", `${path}.layout`, `${path}.layout is invalid`));
    if (![0, 4, 8, 10, 16].includes(composition.gap)) errors.push(error("schema", "invalid_enum", `${path}.gap`, `${path}.gap is invalid`));
    if (!isObject(composition.padding)) {
      errors.push(error("schema", "missing_required", `${path}.padding`, `${path}.padding is required`));
    } else {
      if (![0, 16].includes(composition.padding.top)) errors.push(error("schema", "invalid_enum", `${path}.padding.top`, `${path}.padding.top is invalid`));
      if (composition.padding.right !== 16) errors.push(error("schema", "invalid_const", `${path}.padding.right`, `${path}.padding.right must be 16`));
      if (![0, 16].includes(composition.padding.bottom)) errors.push(error("schema", "invalid_enum", `${path}.padding.bottom`, `${path}.padding.bottom is invalid`));
      if (composition.padding.left !== 16) errors.push(error("schema", "invalid_const", `${path}.padding.left`, `${path}.padding.left must be 16`));
    }
    if (!Array.isArray(composition.blocks) || composition.blocks.length < 1 || composition.blocks.length > 4) {
      errors.push(error("schema", "invalid_array_length", `${path}.blocks`, `${path}.blocks length is invalid`));
    } else {
      composition.blocks.forEach((block, index) => validateGeneratedRectangularBlock(block, contentType, `${path}.blocks[${index}]`, errors));
    }
  }

  function validateCircularWidget(widget, index, errors) {
    const path = `widgets[${index}]`;
    if (!circularEligibleContentTypes.has(widget.contentType)) errors.push(error("rule", "circular_content_type_not_allowed", `${path}.contentType`, `${path}.contentType cannot use circular rendering`));
    if (!circularComponents.has(widget.component)) errors.push(error("schema", "invalid_enum", `${path}.component`, `${path}.component is invalid`));
    if (!isObject(widget.variant)) {
      errors.push(error("schema", "missing_required", `${path}.variant`, `${path}.variant is required`));
      return;
    }
    if (!circularSizes.has(widget.variant.size)) errors.push(error("schema", "invalid_enum", `${path}.variant.size`, `${path}.variant.size is invalid`));
    if (!["text", "icon", "range", "offset"].includes(widget.variant.property)) errors.push(error("schema", "invalid_enum", `${path}.variant.property`, `${path}.variant.property is invalid`));
    if (!isObject(widget.data)) errors.push(error("schema", "missing_required", `${path}.data`, `${path}.data is required`));
    const expectedFrame = circularSizeFrames[widget.variant.size];
    if (expectedFrame && (widget.frame?.width !== expectedFrame.width || widget.frame?.height !== expectedFrame.height)) {
      errors.push(error("rule", "circular_fixed_size", `${path}.frame`, `${path}.frame must be ${expectedFrame.width}x${expectedFrame.height} for size ${widget.variant.size}`));
    }
    if (widget.component === "close_gauge" && typeof widget.data?.progress !== "number") errors.push(error("schema", "missing_required", `${path}.data.progress`, `${path}.data.progress is required for close_gauge`));
    if (widget.variant.property === "text") {
      if (widget.data?.value === undefined) errors.push(error("schema", "missing_required", `${path}.data.value`, `${path}.data.value is required for text variant`));
    }
    if (widget.component === "close_gauge" && widget.variant.property === "text" && widget.data?.label !== undefined) {
      errors.push(error("rule", "close_gauge_single_text", `${path}.data.label`, "close_gauge text widgets must render only one centered value; use open_gauge when a secondary label is needed"));
    }
    if (widget.component === "close_gauge" && openGaugeMetricKinds.has(widget.data?.metricKind)) {
      errors.push(error("rule", "open_metric_uses_close_gauge", `${path}.component`, `${path} must use open_gauge because ${widget.data.metricKind} moves within a range`));
    }
    if (widget.component === "open_gauge" && closeGaugeMetricKinds.has(widget.data?.metricKind)) {
      errors.push(error("rule", "close_metric_uses_open_gauge", `${path}.component`, `${path} must use close_gauge because ${widget.data.metricKind} moves one direction`));
    }
    if (widget.component === "open_gauge") {
      const bottomTextToken = openGaugeBottomText[widget.variant.size];
      const validateBottomText = (value, fieldPath) => {
        if (isBlank(value)) {
          errors.push(error("schema", "missing_required", fieldPath, `${fieldPath} is required for visible open_gauge bottom content`));
          return;
        }
        if (bottomTextToken && estimateTextWidth(value, bottomTextToken.fontSize) > bottomTextToken.width + 2) {
          errors.push(error("rule", "open_gauge_bottom_text_overflow", fieldPath, `${fieldPath} must fit the ${widget.variant.size} open_gauge bottom text box at ${bottomTextToken.fontSize}pt without clipping`));
        }
      };
      if (widget.variant.property === "text") validateBottomText(widget.data?.label, `${path}.data.label`);
      if (widget.variant.property === "range") {
        validateBottomText(widget.data?.lowLabel, `${path}.data.lowLabel`);
        validateBottomText(widget.data?.highLabel, `${path}.data.highLabel`);
      }
      if (widget.variant.property === "offset") validateBottomText(widget.data?.referenceValue, `${path}.data.referenceValue`);
      if (widget.variant.property === "icon" && isBlank(widget.data?.icon)) {
        errors.push(error("schema", "missing_required", `${path}.data.icon`, `${path}.data.icon is required for visible open_gauge icon content`));
      }
    }
    if (widget.variant.property === "icon") validateGeneratedIcon(widget.data?.icon, widget.contentType, `${path}.data.icon`, errors);
  }

  function validateCircularVariantComposition(layout, errors) {
    const contentTypeCounts = new Map();
    for (const widget of layout.widgets || []) {
      contentTypeCounts.set(widget.contentType, (contentTypeCounts.get(widget.contentType) || 0) + 1);
    }
    for (const [index, widget] of (layout.widgets || []).entries()) {
      if (widget.shape === "circular" && widget.component === "close_gauge" && widget.variant?.property === "text" && contentTypeCounts.get(widget.contentType) === 1) {
        errors.push(error("rule", "solo_close_gauge_prefers_icon", `widgets[${index}].variant.property`, "when close_gauge is the only widget for its content type, use the icon variant so the widget communicates what the data represents"));
      }
    }
  }

  function validateRectangularWidget(widget, index, errors) {
    const path = `widgets[${index}]`;
    if (!rectangularTemplates.has(widget.template)) errors.push(error("schema", "invalid_enum", `${path}.template`, `${path}.template is invalid`));
    if (widget.template === "generated_rectangular_widget") {
      if (!generatedRectangularContentTypes.has(widget.contentType)) errors.push(error("rule", "generated_rectangular_content_type_not_allowed", `${path}.contentType`, `${path}.contentType cannot use generated_rectangular_widget`));
    } else if (widget.contentType !== templateContentTypes[widget.template]) {
      errors.push(error("rule", "strict_template_content_type_mismatch", `${path}.contentType`, `${path}.contentType must be ${templateContentTypes[widget.template]} for ${widget.template}`));
    }
    validateFrame(widget.frame, `${path}.frame`, errors, { rectangular: true });
    if (widget.cornerRadius !== 54) errors.push(error("rule", "rectangular_corner_radius", `${path}.cornerRadius`, `${path}.cornerRadius must be 54`));
    if (widget.cornerSmoothing !== 100) errors.push(error("rule", "rectangular_corner_smoothing", `${path}.cornerSmoothing`, `${path}.cornerSmoothing must be 100`));
    if (!["top", "bottom"].includes(widget.verticalAlignment)) errors.push(error("schema", "invalid_enum", `${path}.verticalAlignment`, `${path}.verticalAlignment is invalid`));
    if (!isObject(widget.data)) errors.push(error("schema", "missing_required", `${path}.data`, `${path}.data is required`));
    if (widget.template === "reminder") {
      if (typeof widget.data?.content !== "string") errors.push(error("schema", "missing_required", `${path}.data.content`, `${path}.data.content is required for reminder`));
      if (typeof widget.data?.dueDatetime !== "string") errors.push(error("schema", "missing_required", `${path}.data.dueDatetime`, `${path}.data.dueDatetime is required for reminder`));
    }
    if (widget.template === "timer_rectangular" && typeof widget.data?.countdown !== "string") errors.push(error("schema", "missing_required", `${path}.data.countdown`, `${path}.data.countdown is required for timer_rectangular`));
    if (widget.template === "music_control") {
      if (typeof widget.data?.song !== "string") errors.push(error("schema", "missing_required", `${path}.data.song`, `${path}.data.song is required for music_control`));
      if (typeof widget.data?.playPauseAction !== "string") errors.push(error("schema", "missing_required", `${path}.data.playPauseAction`, `${path}.data.playPauseAction is required for music_control`));
    }
    if (widget.template === "checklist_full_face" && !Array.isArray(widget.data?.items)) errors.push(error("schema", "missing_required", `${path}.data.items`, `${path}.data.items is required for checklist_full_face`));
    if (widget.template === "generated_rectangular_widget") validateGeneratedRectangularComposition(widget.composition, widget.contentType, `${path}.composition`, errors);
  }

  function rectOverlapDepth(a, b) {
    const xOverlap = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
    const yOverlap = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
    return Math.min(xOverlap, yOverlap);
  }

  function horizontalOverlap(a, b) {
    return Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  }

  function rectsIntersect(a, b) {
    return horizontalOverlap(a, b) > 0 && Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)) > 0;
  }

  function estimateTextWidth(text, fontSize) {
    return String(text).length * fontSize * 0.58;
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

  function validateTextOverflow(layout, errors, warnings) {
    const textObjects = [
      ...(Array.isArray(layout.time?.containers)
        ? layout.time.containers.map((container, index) => [`time.containers[${index}]`, container])
        : [["time", layout.time]]),
      ["date", layout.date]
    ];
    for (const [path, textObject] of textObjects) {
      const estimatedWidth = estimateTextWidth(textObject.value, textObject.style.fontSize);
      if (estimatedWidth > textObject.frame.width + 2) {
        errors.push(error("rule", "text_overflow", `${path}.value`, `${path}.value is estimated to overflow its declared frame`));
      }
      if (textObject.style.fontSize > textObject.frame.height * 1.25) {
        warnings.push(warning("tight_text_height", `${path}.style.fontSize`, `${path} font size is tight for its declared height`));
      }
    }
  }

  function validateSchemaShape(layout) {
    const errors = [];
    if (!hasOnlyKeys(layout, allowedTopLevel, "layout", errors)) return errors;
    requireKeys(layout, ["schemaVersion", "targetContainer", "metadata", "canvas", "colorSystem", "time", "date", "widgets", "layers"], "layout", errors);
    if (layout.schemaVersion !== "1.0.0") errors.push(error("schema", "invalid_const", "layout.schemaVersion", "schemaVersion must be 1.0.0"));
    if (layout.targetContainer !== "Gen Watch Face") errors.push(error("schema", "invalid_const", "layout.targetContainer", "targetContainer must be Gen Watch Face"));
    validateColorSystem(layout.colorSystem, errors);
    validateTimeObject(layout.time, "time", errors);
    validateDateObject(layout.date, "date", errors);
    if (!Array.isArray(layout.widgets)) errors.push(error("schema", "invalid_type", "widgets", "widgets must be an array"));
    if (Array.isArray(layout.widgets) && layout.widgets.length > 3) errors.push(error("schema", "too_many_widgets", "widgets", "widgets must contain at most 3 items"));
    return errors;
  }

  function validateTimePlacement(layout, errors) {
    const { time } = layout;
    const containers = time.containers || [];
    if (time.style.fontFamily !== "SF Compact") {
      errors.push(error("rule", "time_font_family", "time.style.fontFamily", "time must use SF Compact"));
    }
    for (const [index, container] of containers.entries()) {
      const path = `time.containers[${index}]`;
      if (container.style.fontFamily !== "SF Compact") {
        errors.push(error("rule", "time_container_font_family", `${path}.style.fontFamily`, `${path} must use SF Compact`));
      }
      const edges = anchorEdges(container.anchor);
      if (container.anchor === "center") {
        if (!approxEqual(container.frame.x + container.frame.width / 2, 205 / 2) || !approxEqual(container.frame.y + container.frame.height / 2, 251 / 2)) {
          errors.push(error("rule", "time_center_anchor", `${path}.frame`, `${path} anchor=center must be centered in the watch face`));
        }
      }
      if (time.mode === "single_line") {
        if (containers.length !== 1 || container.role !== "combined") {
          errors.push(error("rule", "single_time_container_required", "time.containers", "single_line time must use exactly one combined time container"));
        }
        if (isCornerAnchor(container.anchor) && container.frame.width !== 205) {
          errors.push(error("rule", "combined_time_corner_requires_full_width", `${path}.anchor`, "combined time may align to a watch-face corner only when its container is full width at 205px; otherwise stack date at the corner and place time away from the rounded mask"));
        }
      } else if (container.anchor === "center") {
        errors.push(error("rule", "split_time_container_centered", `${path}.anchor`, "split or segmented time containers must be edge-anchored, not centered"));
      } else if (isCornerAnchor(container.anchor) && container.frame.width <= cornerSafeSplitTimeMinWidth) {
        errors.push(error("rule", "split_time_corner_width", `${path}.frame.width`, `split time containers may align to a watch-face corner only when each corner-anchored container is wider than ${cornerSafeSplitTimeMinWidth}px`));
      }
      const padding = container.frame.width < 105 ? 16 : 0;
      if (edges.includes("top") && !approxEqual(container.frame.y, padding)) {
        errors.push(error("rule", "time_edge_padding", `${path}.frame.y`, `${path} top edge padding must be ${padding}px`));
      }
      if (edges.includes("left") && !approxEqual(container.frame.x, padding)) {
        errors.push(error("rule", "time_edge_padding", `${path}.frame.x`, `${path} left edge padding must be ${padding}px`));
      }
      if (edges.includes("right") && !approxEqual(container.frame.x + container.frame.width, 205 - padding)) {
        errors.push(error("rule", "time_edge_padding", `${path}.frame.x`, `${path} right edge padding must be ${padding}px`));
      }
      if (edges.includes("bottom") && !approxEqual(container.frame.y + container.frame.height, 251 - padding)) {
        errors.push(error("rule", "time_edge_padding", `${path}.frame.y`, `${path} bottom edge padding must be ${padding}px`));
      }
    }
    if (time.mode === "split_hour_minute" && containers.length !== 2) {
      errors.push(error("rule", "split_time_container_count", "time.containers", "split_hour_minute must use exactly two time containers"));
    }
    if (time.mode === "segmented_digits" && containers.length < 2) {
      errors.push(error("rule", "segmented_time_container_count", "time.containers", "segmented_digits must use at least two time containers"));
    }
    const treatmentSource = containers.find((container) => container.role !== "separator") || containers[0];
    if (treatmentSource) {
      for (const [index, container] of containers.entries()) {
        if (container.role !== "separator" && !sameTimeTreatment(container.style, treatmentSource.style)) {
          errors.push(error("rule", "time_treatment_consistency", `time.containers[${index}].style`, "split time containers may vary font size but must share font family, weight, letter spacing, color, and treatment"));
        }
      }
    }
    if (containers.length > 0) {
      const expected = unionFrame(containers.map((container) => container.frame));
      for (const key of ["x", "y", "width", "height"]) {
        if (!approxEqual(time.frame[key], expected[key])) {
          errors.push(error("rule", "time_frame_must_wrap_containers", `time.frame.${key}`, `time.frame must wrap all time containers; expected ${key}=${expected[key]}`));
        }
      }
    }
    if (time.mode === "single_line" && containers.length === 1) {
      const container = containers[0];
      const clearTimeRow = !hasWidgetOnSameRow(layout.widgets || [], container.frame);
      const visuallyFilledWidth = estimateTextWidth(container.value, container.style.fontSize);
      if (clearTimeRow && approxEqual(container.frame.width, 205) && visuallyFilledWidth < 205 * fullWidthTimeFillRatio) {
        errors.push(error("rule", "time_underfills_clear_full_width_row", "time.containers[0].style.fontSize", "when combined time sits on a clear full-width row, increase its font size so the digits visually fill at least 85% of the watch-face width without violating overlap rules"));
      }
    }
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

  function validateRequiredSplitTime(layout, errors) {
    if (layout.widgets?.length === 1 && layout.widgets[0].shape === "circular" && layout.widgets[0].variant?.size !== "L") {
      errors.push(error("rule", "focused_single_circular_uses_large", "widgets[0].variant.size", "when the watch face focuses on one circular-supported widget, use the L circular size"));
    }
    if (!splitTimeRequired(layout)) return;
    if (layout.time.mode !== "split_hour_minute" || layout.time.containers.length !== 2) {
      errors.push(error("rule", "split_time_required_for_circular_layout", "time.mode", "split hour and minute into two vertically stacked containers for this circular-widget layout"));
      return;
    }
    const hour = layout.time.containers.find((container) => container.role === "hour") || layout.time.containers[0];
    const minute = layout.time.containers.find((container) => container.role === "minute") || layout.time.containers[1];
    const stackGap = Math.max(0, Math.max(hour.frame.y, minute.frame.y) - Math.min(hour.frame.y + hour.frame.height, minute.frame.y + minute.frame.height));
    if (horizontalOverlap(hour.frame, minute.frame) <= 0 || stackGap > 4) {
      errors.push(error("rule", "split_time_vertical_stack", "time.containers", "split hour and minute containers must stack vertically with horizontal overlap"));
    }
    const availableColumnWidth = Math.max(hour.frame.width, minute.frame.width);
    const filledColumnWidth = Math.max(estimateTextWidth(hour.value, hour.style.fontSize), estimateTextWidth(minute.value, minute.style.fontSize));
    if (filledColumnWidth < availableColumnWidth * splitTimeFillRatio) {
      errors.push(error("rule", "split_time_underfills_available_space", "time.containers", "when split time is required, increase hour and minute font sizes so they fill the remaining empty space"));
    }
  }

  function validateDatePlacement(layout, errors) {
    const { date, time } = layout;
    if (date.style.fontFamily !== "SF Compact" || date.style.fontWeight !== 400 || date.style.fontSize !== 19) {
      errors.push(error("rule", "date_font_style", "date.style", "date must use SF Compact Regular 19pt"));
    }
    const targetIndex = (time.containers || []).findIndex((container) => container.id === date.stackedWithTimeContainerId);
    if (targetIndex < 0) {
      errors.push(error("rule", "date_stacked_target_missing", "date.stackedWithTimeContainerId", "date must reference one existing time container"));
      return;
    }
    const target = time.containers[targetIndex];
    const dateAbove = approxEqual(date.frame.y + date.frame.height + date.stackGap, target.frame.y);
    const dateBelow = approxEqual(target.frame.y + target.frame.height + date.stackGap, date.frame.y);
    if ((!dateAbove && !dateBelow) || horizontalOverlap(date.frame, target.frame) <= 0) {
      errors.push(error("rule", "date_time_stack", "date.frame", "date must vertically stack with its referenced time container with 0px gap"));
    }
    const targetEdges = anchorEdges(target.anchor);
    if (dateAbove && targetEdges.includes("top") && !approxEqual(date.frame.y, 16)) {
      errors.push(error("rule", "date_edge_padding", "date.frame.y", "date must keep 16px padding when the date/time stack starts from the top edge"));
    }
    if (dateBelow && targetEdges.includes("bottom") && !approxEqual(date.frame.y + date.frame.height, 251 - 16)) {
      errors.push(error("rule", "date_edge_padding", "date.frame.y", "date must keep 16px padding when the date/time stack starts from the bottom edge"));
    }
  }

  function hasChecklistFullFace(layout) {
    return layout.widgets.some((widget) => widget.template === "checklist_full_face");
  }

  function validateWidgetOverlapAndStacking(layout, errors) {
    for (let index = 0; index < layout.widgets.length; index += 1) {
      for (let nextIndex = index + 1; nextIndex < layout.widgets.length; nextIndex += 1) {
        const a = layout.widgets[index];
        const b = layout.widgets[nextIndex];
        if (a.template === "checklist_full_face" || b.template === "checklist_full_face") continue;
        const xOverlap = Math.max(0, Math.min(a.frame.x + a.frame.width, b.frame.x + b.frame.width) - Math.max(a.frame.x, b.frame.x));
        const yOverlap = Math.max(0, Math.min(a.frame.y + a.frame.height, b.frame.y + b.frame.height) - Math.max(a.frame.y, b.frame.y));
        if (xOverlap > 0 && yOverlap > 0) {
          errors.push(error("rule", "widget_widget_overlap", `widgets[${nextIndex}].frame`, `${a.id} and ${b.id} overlap; only time/widget overlap is allowed`));
        }
      }
    }

    const circularWidgets = layout.widgets.filter((widget) => widget.shape === "circular");
    if (layout.widgets.length === 3 && circularWidgets.length === 3) {
      const sorted = [...circularWidgets].sort((a, b) => a.frame.y - b.frame.y);
      const centerX = sorted[0].frame.x + sorted[0].frame.width / 2;
      for (const widget of sorted) {
        const widgetCenterX = widget.frame.x + widget.frame.width / 2;
        if (!approxEqual(widgetCenterX, centerX, 12)) {
          errors.push(error("rule", "three_circular_vertical_stack", `${widget.id}.frame.x`, "three circular widgets must stack vertically in one column instead of spreading horizontally"));
        }
      }
      for (let index = 1; index < sorted.length; index += 1) {
        if (sorted[index].frame.y < sorted[index - 1].frame.y + sorted[index - 1].frame.height) {
          errors.push(error("rule", "three_circular_vertical_stack", `${sorted[index].id}.frame.y`, "three circular widgets must be vertically stacked without overlap"));
        }
      }
    }
  }

  function validateRuleConstraints(layout) {
    const errors = [];
    const warnings = [];
    if (!isObject(layout.metadata)) {
      errors.push(error("schema", "missing_required", "metadata", "metadata is required"));
    } else {
      if (!Array.isArray(layout.metadata.selectedContentTypes)) errors.push(error("schema", "invalid_type", "metadata.selectedContentTypes", "metadata.selectedContentTypes must be an array"));
      if (Array.isArray(layout.metadata.selectedContentTypes)) {
        if (layout.metadata.selectedContentTypes.length > 3) errors.push(error("schema", "too_many_content_types", "metadata.selectedContentTypes", "metadata.selectedContentTypes must contain at most 3 items"));
        for (const type of layout.metadata.selectedContentTypes) {
          if (!contentTypes.has(type)) errors.push(error("schema", "invalid_content_type", "metadata.selectedContentTypes", `metadata.selectedContentTypes contains invalid type ${type}`));
        }
      }
      if (!Number.isInteger(layout.metadata.retryCount)) errors.push(error("schema", "invalid_type", "metadata.retryCount", "metadata.retryCount must be an integer"));
      if (typeof layout.metadata.fallbackUsed !== "boolean") errors.push(error("schema", "invalid_type", "metadata.fallbackUsed", "metadata.fallbackUsed must be a boolean"));
      if (layout.metadata.fallbackUsed) {
        if (typeof layout.metadata.fallbackId !== "string" || layout.metadata.fallbackId.length === 0) errors.push(error("schema", "missing_required", "metadata.fallbackId", "metadata.fallbackId is required when fallbackUsed is true"));
        if (!fallbackReasons.has(layout.metadata.fallbackReason)) errors.push(error("schema", "invalid_enum", "metadata.fallbackReason", "metadata.fallbackReason is invalid"));
      }
    }
    if (layout.canvas?.width !== 205) errors.push(error("schema", "invalid_const", "canvas.width", "canvas.width must be 205"));
    if (layout.canvas?.height !== 251) errors.push(error("schema", "invalid_const", "canvas.height", "canvas.height must be 251"));
    if (layout.canvas?.borderRadius !== 54) errors.push(error("schema", "invalid_const", "canvas.borderRadius", "canvas.borderRadius must be 54"));
    if (layout.canvas?.coordinateSystem !== "fixed") errors.push(error("schema", "invalid_const", "canvas.coordinateSystem", "canvas.coordinateSystem must be fixed"));
    validateFrame(layout.time.frame, "time.frame", errors);
    validateFrame(layout.date.frame, "date.frame", errors);
    validateTimePlacement(layout, errors);
    if (!hasChecklistFullFace(layout)) {
      validateDatePlacement(layout, errors);
    }
    validateTextOverflow(layout, errors, warnings);
    const largestTimeFontSize = Math.max(...layout.time.containers.map((container) => container.style.fontSize));
    if (!hasChecklistFullFace(layout) && layout.date.style.fontSize > largestTimeFontSize * 0.45) errors.push(error("rule", "date_not_secondary", "date.style.fontSize", "date must remain visually secondary to time"));
    const rectangularWidgetCount = layout.widgets.filter((widget) => widget.shape === "rectangular").length;
    const hasChecklistWidget = layout.widgets.some((widget) => widget.contentType === "checklist");
    if (hasChecklistWidget && layout.widgets.length !== compositionRules.checklistOnly.maxWidgets) {
      errors.push(error("rule", "checklist_must_be_only_widget", "widgets", `checklist layouts must contain ${compositionRules.checklistOnly.maxWidgets} widget`));
    } else if (rectangularWidgetCount > 0) {
      if (layout.widgets.length > compositionRules.rectangularPresent.maxWidgets) errors.push(error("rule", "rectangular_present_widget_cap", "widgets", `rectangular-present layouts must contain at most ${compositionRules.rectangularPresent.maxWidgets} widgets`));
      if (rectangularWidgetCount > compositionRules.rectangularPresent.maxRectangularWidgets) errors.push(error("rule", "rectangular_count_cap", "widgets", `layouts must contain at most ${compositionRules.rectangularPresent.maxRectangularWidgets} rectangular widgets`));
    }
    layout.widgets.forEach((widget, index) => {
      const path = `widgets[${index}]`;
      if (!contentTypes.has(widget.contentType)) errors.push(error("schema", "invalid_content_type", `${path}.contentType`, `${path}.contentType is invalid`));
      if (Array.isArray(layout.metadata.selectedContentTypes) && !layout.metadata.selectedContentTypes.includes(widget.contentType)) {
        errors.push(error("rule", "rendered_content_not_selected", `${path}.contentType`, `${path}.contentType must be one of metadata.selectedContentTypes`));
      }
      if (widget.layer !== "top") errors.push(error("schema", "invalid_const", `${path}.layer`, `${path}.layer must be top`));
      validateFrame(widget.frame, `${path}.frame`, errors, { rectangular: widget.shape === "rectangular" });
      if (widget.shape === "circular") validateCircularWidget(widget, index, errors);
      else if (widget.shape === "rectangular") validateRectangularWidget(widget, index, errors);
      else errors.push(error("schema", "invalid_enum", `${path}.shape`, `${path}.shape is invalid`));
    });
    validateRequiredSplitTime(layout, errors);
    validateCircularVariantComposition(layout, errors);
    validateWidgetOverlapAndStacking(layout, errors);
    const overlapTextObjects = [
      ...layout.time.containers.map((container, index) => [`time.containers[${index}]`, container]),
      ["date", layout.date]
    ];
    for (const [path, textObject] of overlapTextObjects) {
      for (const widget of layout.widgets) {
        if (widget.template === "checklist_full_face") continue;
        if (path === "date" && rectsIntersect(textObject.frame, widget.frame)) {
          errors.push(error("rule", "widget_date_overlap", `${path}.frame`, `date overlaps ${widget.id}; only time/widget overlap is allowed`));
          continue;
        }
        const overlapDepth = rectOverlapDepth(textObject.frame, widget.frame);
        if (overlapDepth > 10) {
          errors.push(error("rule", "widget_text_overlap_exceeds_limit", `${path}.frame`, `${path} overlaps ${widget.id} by ${Math.round(overlapDepth)}px`));
        }
      }
    }
    return { errors, warnings };
  }

  function validateLayout(layout) {
    const schemaErrors = validateSchemaShape(layout);
    if (schemaErrors.length > 0) {
      return {
        ok: false,
        stage: "schema",
        summary: `${schemaErrors.length} schema error${schemaErrors.length === 1 ? "" : "s"}`,
        errors: schemaErrors,
        warnings: []
      };
    }
    const { errors, warnings } = validateRuleConstraints(layout);
    return {
      ok: errors.length === 0,
      stage: errors.length > 0 ? "rule" : "accepted",
      summary: errors.length === 0 ? "layout accepted" : `${errors.length} rule error${errors.length === 1 ? "" : "s"}`,
      errors,
      warnings
    };
  }

  return { validateLayout };
}
