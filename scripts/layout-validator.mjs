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
      if (frame.height < 80 || frame.height > 251) errors.push(error("rule", "rectangular_height_range", `${path}.height`, `${path}.height must be between 80 and 251`));
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

  function validateTextObject(object, path, errors) {
    if (!hasOnlyKeys(object, new Set(["mode", "value", "priority", "layer", "frame", "style"]), path, errors)) {
      return;
    }
    if (typeof object.value !== "string" || object.value.length === 0) errors.push(error("schema", "missing_required", `${path}.value`, `${path}.value is required`));
    if (object.layer !== "bottom") errors.push(error("schema", "invalid_const", `${path}.layer`, `${path}.layer must be bottom`));
    validateFrame(object.frame, `${path}.frame`, errors);
    validateTextStyle(object.style, `${path}.style`, errors);
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
    if (widget.component === "close_gauge" && typeof widget.data?.progress !== "number") errors.push(error("schema", "missing_required", `${path}.data.progress`, `${path}.data.progress is required for close_gauge`));
    if (widget.variant.property === "text") {
      if (widget.data?.value === undefined) errors.push(error("schema", "missing_required", `${path}.data.value`, `${path}.data.value is required for text variant`));
      if (typeof widget.data?.label !== "string") errors.push(error("schema", "missing_required", `${path}.data.label`, `${path}.data.label is required for text variant`));
    }
    if (widget.variant.property === "icon") validateGeneratedIcon(widget.data?.icon, widget.contentType, `${path}.data.icon`, errors);
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

  function estimateTextWidth(text, fontSize) {
    return String(text).length * fontSize * 0.58;
  }

  function validateTextOverflow(layout, errors, warnings) {
    for (const [path, textObject] of [["time", layout.time], ["date", layout.date]]) {
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
    validateTextObject(layout.time, "time", errors);
    validateTextObject(layout.date, "date", errors);
    if (!Array.isArray(layout.widgets)) errors.push(error("schema", "invalid_type", "widgets", "widgets must be an array"));
    if (Array.isArray(layout.widgets) && layout.widgets.length > 3) errors.push(error("schema", "too_many_widgets", "widgets", "widgets must contain at most 3 items"));
    return errors;
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
    validateTextOverflow(layout, errors, warnings);
    if (layout.date.style.fontSize > layout.time.style.fontSize * 0.45) errors.push(error("rule", "date_not_secondary", "date.style.fontSize", "date must remain visually secondary to time"));
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
      if (widget.layer !== "top") errors.push(error("schema", "invalid_const", `${path}.layer`, `${path}.layer must be top`));
      validateFrame(widget.frame, `${path}.frame`, errors, { rectangular: widget.shape === "rectangular" });
      if (widget.shape === "circular") validateCircularWidget(widget, index, errors);
      else if (widget.shape === "rectangular") validateRectangularWidget(widget, index, errors);
      else errors.push(error("schema", "invalid_enum", `${path}.shape`, `${path}.shape is invalid`));
    });
    for (const [path, textObject] of [["time", layout.time], ["date", layout.date]]) {
      for (const widget of layout.widgets) {
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
