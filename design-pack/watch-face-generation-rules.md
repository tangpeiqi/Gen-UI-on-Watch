# Watch Face Generation Rules

This rulebook defines how an AI agent should generate compact watch face layouts from user context, requested information, and required widgets. The system is constraint-based: the agent should produce new layouts by following principles, sizing tokens, placement rules, and validation checks, instead of copying fixed templates.

## Design Principles

1. Time is the primary visual object.
2. Widgets are secondary, but must remain readable and useful.
3. Circular widgets provide rhythm and emphasis. They must use fixed size tokens.
4. Rectangular widgets absorb layout variation. They use fixed width and flexible height.
5. Time typography carries the personality of the face and may adapt through size, weight, letter spacing, and color treatment.
6. The hour and minute may be split into separate text boxes for more expressive layouts, but they must stay visually unified.
7. Widgets sit on top layers. Time and date sit on bottom layers.
8. Widgets may overlap time when it creates a more dynamic layout, but overlap must be controlled and legibility must remain intact.
9. Layouts should feel balanced inside the watch mask, not simply packed into available space.

## Rule Strictness

Use the following strictness levels when interpreting this document:

```yaml
strictness:
  must: Hard constraint. Reject the layout if this rule is violated.
  should: Strong preference. Use unless user context or a better composition requires an exception.
  may: Optional variation. Use when it improves the layout.
  reject_if: Invalid output. Do not return the layout.
```

## Canvas

```yaml
canvas:
  width: 205
  height: 251
  coordinate_system: fixed
  mask:
    type: watch_face
    all_visible_elements_must_fit_inside_mask: true
  safe_padding:
    minimum: 6
    preferred: 16
  major_element_gap:
    minimum: 6
    preferred_range: [8, 10]
  vertical_zones:
    top:
      y_range: [0, 83]
    middle:
      y_range: [83, 166]
    bottom:
      y_range: [166, 251]
```

## Layering

```yaml
layering:
  bottom_layers:
    - time
    - date
  top_layers:
    - widgets

  widget_time_overlap:
    allowed: true
    max_overlap_px: 10
    must_preserve_time_legibility: true
    must_preserve_widget_legibility: true

  widget_date_overlap:
    allowed: false

  widget_widget_overlap:
    allowed: false

  rules:
    - id: widgets-above-time
      strictness: must
      rule: Widgets must be visually layered above time and date.

    - id: controlled-overlap
      strictness: must
      rule: Widgets may overlap time only when the overlap is 10px or less. Widgets must not overlap date.

    - id: no-widget-widget-overlap
      strictness: must
      rule: Widgets must not overlap other widgets. The only allowed overlap on the watch face is controlled time/widget overlap.

    - id: overlap-for-composition
      strictness: should
      rule: Use overlap only when it makes the layout more dynamic, playful, or spatially integrated.
```

## Date

```yaml
date:
  priority: secondary
  height: 22
  preferred_width_range: [61, 65]
  format:
    pattern: "EEE d"
    weekday:
      length: 3
      casing: uppercase
      examples:
        sunday: SUN
        saturday: SAT
        thursday: THU
    day_of_month:
      numeric: true
      ordinal_suffix: false
    examples:
      - "SUN 2"
      - "SAT 8"
      - "THU 11"
  typography:
    font_family: SF Compact
    font_weight: Regular
    font_size: 19
    font_size_unit: pt
    letter_spacing: 0
  relationship_to_time:
    required: true
    rule: Date must vertically stack with one time_container instead of being placed independently on the watch face.
    stack_target: one_time_container
    stack_gap: 0
    stack_gap_unit: px
    edge_padding_when_stack_starts_from_edge: 16
    edge_padding_unit: px
    applies_to:
      - combined_time_single_container
      - split_time_hour_container
      - split_time_minute_container
      - segmented_time_container
  allowed_positions:
    - top_left
    - top_right
    - above_time
    - between_time_and_widgets
    - beside_small_widget
  rules:
    - id: date-secondary
      strictness: must
      rule: Date must not visually compete with the time.

    - id: date-not-inside-time
      strictness: must
      rule: Date must not be grouped as part of the primary time object.

    - id: date-compact-format
      strictness: must
      rule: Date must use a three-letter uppercase weekday followed by the numeric day of month with no ordinal suffix, such as SUN 2.

    - id: date-font-style
      strictness: must
      rule: Date must use SF Compact, Regular, 19pt.

    - id: date-stacks-with-time-container
      strictness: must
      rule: Date must vertically stack with one time_container and must not be placed elsewhere independently on the watch face.

    - id: date-time-stack-zero-gap
      strictness: must
      rule: Date must use 0px vertical padding between itself and the time_container it stacks with.

    - id: corner-date-time-stack-direction
      strictness: must
      rule: When time is placed on a watch-face corner, date must stack vertically inward after the time, away from that corner: below top-corner time, or above bottom-corner time. When date is placed on a watch-face corner, date must keep 16px padding from the watch-face edge and time must stack vertically inward from the date: below top-corner date, or above bottom-corner date.
```

## Widget Types

```yaml
widgets:
  circular:
    shape: circle
    resizing: fixed_only
    edge_alignment:
      edge_padding: 6
      unit: px
      applies_when_aligned_to:
        - top
        - left
        - bottom
        - right
    allowed_sizes:
      small:
        width: 72
        height: 72
      medium:
        width: 90
        height: 90
      large:
        width: 150
        height: 150
    rules:
      - id: circular-fixed-size
        strictness: must
        rule: Circular widgets must use exactly one allowed size token: S is 72x72px, M is 90x90px, and L is 150x150px.

      - id: no-arbitrary-circle-scaling
        strictness: must
        rule: Circular widgets must not be stretched or scaled to arbitrary dimensions.

      - id: close-gauge-one-centered-text
        strictness: must
        rule: Close Gauge text widgets must render one centered value and may include an optional footnote only when needed for unit metadata. The footnote must use the fixed close-gauge footnote box width and must not clip.

      - id: solo-close-gauge-uses-icon
        strictness: must
        rule: When a Close Gauge is the only widget for its content type, use the icon variant instead of the text variant so the widget communicates what kind of data it represents.

      - id: open-vs-close-gauge-selection
        strictness: must
        rule: Use Open Gauge for metrics that move back and forth within a range, such as temperature, heart rate/BPM, precipitation probability, UV, air quality, recovery, and pace. Use Close Gauge for one-direction metrics, such as countdown timer, workout/activity progress, battery, completion, hydration, and focus progress.

      - id: open-gauge-bottom-content-required
        strictness: must
        rule: When Open Gauge uses the text or icon variant, fill the visible bottom content slot; text variant requires a short bottom label, and icon variant requires a bottom icon plus a centered value. The Open Gauge icon variant must not render the icon in the center. Range requires lowLabel and highLabel. Offset requires referenceValue.

      - id: open-gauge-bottom-text-size
        strictness: must
        rule: Open Gauge bottom text must use the fixed Figma font size and fixed text box width for the selected circular size and must not clip.
        tokens:
          S: 15pt font, 48px box width
          M: 18pt font, 60px box width
          L: 32pt font, 96px box width

      - id: circular-center-value-text-width
        strictness: must
        rule: Open Gauge center values and Close Gauge text variant center values must use the fixed text box width for the selected circular size and must not clip.
        tokens:
          S: 55px box width
          M: 65px box width
          L: 115px box width

      - id: close-gauge-footnote-text-width
        strictness: must
        rule: When Close Gauge text uses an optional footnote or unit label, the footnote must use the fixed text box width for the selected circular size and must not clip.
        tokens:
          S: 40px box width
          M: 50px box width
          L: 80px box width

      - id: circular-edge-padding
        strictness: must
        rule: When a circular widget aligns with the top, left, bottom, or right edge of the watch face, leave exactly 6px padding between the circle and that edge.

  rectangular:
    shape: rounded_rectangle
    width:
      behavior: fixed
      required: full_canvas
      value: 205
      x: 0
    height:
      behavior: flexible
      min: 108
      max: remaining_available_space
    alignment:
      allowed_vertical_edges:
        - top
        - bottom
      top_aligned_y: 0
      bottom_aligned_y_formula: canvas_height - rectangular_widget_height
      horizontal_padding: 0
      vertical_edge_padding: 0
    inner_padding:
      default:
        top: 16
        right: 16
        bottom: 16
        left: 16
      unit: px
      progress_bar_edge_exception:
        top_progress_bar_sets_top_padding: 0
        bottom_progress_bar_sets_bottom_padding: 0
    clipping:
      clip_content_to_widget_bounds: true
    corner_radius:
      value: 54
      unit: pt
    corner_smoothing:
      value: 60
      unit: percent
      platform_intent: iOS continuous corner treatment
    resizing: vertical_only
    rules:
      - id: rectangular-flex-height
        strictness: must
        rule: Rectangular widgets must always use the full 205pt watch-face width and may flex vertically only.

      - id: rectangular-edge-attached
        strictness: must
        rule: Rectangular widgets must be attached directly to the top or bottom edge of the watch face with no padding.

      - id: rectangular-no-inset
        strictness: must
        rule: Rectangular widgets must not be horizontally inset; x must be 0 and width must be 205pt.

      - id: rectangular-min-height
        strictness: must
        rule: Rectangular widget height must be at least 108px.

      - id: rectangular-ios-corners
        strictness: must
        rule: Rectangular widgets must use 54pt corner radius with 60% corner smoothing.

      - id: rectangular-inner-padding
        strictness: must
        rule: Rectangular widgets must use 16px inner padding on top, right, bottom, and left unless a progress bar is attached to the top or bottom edge.

      - id: rectangular-progress-padding-exception
        strictness: must
        rule: When a progress bar is attached to the top edge, top padding must be 0px; when attached to the bottom edge, bottom padding must be 0px.

      - id: rectangular-clips-content
        strictness: must
        rule: Rectangular widgets must clip content to the widget bounds so child content cannot bleed outside the rounded rectangle.
```

## Time Object

The time object may be one text layer, two text layers, or multiple segmented text layers. When split across text layers, the parts should behave as one visual system.

```yaml
time:
  priority: primary
  typography:
    font_family: SF Compact
    font_weight: layout_variable
    font_size: layout_variable
    letter_spacing: layout_variable
  allowed_modes:
    - single_line
    - split_hour_minute
    - segmented_digits

  scale_tokens:
    compact:
      font_size_range: [36, 45]
    standard:
      font_size_range: [64, 80]
    large:
      font_size_range: [96, 120]
    oversized_split:
      hour_font_size_range: [80, 100]
      minute_font_size_range: [100, 120]

  flexible_typography_properties:
    - font_size
    - font_weight
    - letter_spacing
    - color
    - color_gradient
    - outline_stroke

  split_time_invariants:
    hour_and_minute_must_match:
      - font_family
      - font_weight
      - letter_spacing
      - color_treatment

  split_time_required_when:
    - condition: one_S_or_M_circular_widget_on_watch_face
      rule: Split the hour and minute into two containers and stack them vertically.
    - condition: two_S_circular_widgets_occupy_opposite_corners
      rule: Split the hour and minute into two containers and stack them vertically.
    - condition: three_S_circular_widgets_stack_vertically_on_one_side
      rule: Split the hour and minute into two containers and stack them vertically.
    container_rule: The hour and minute containers must be vertically stacked with horizontal overlap, while preserving shared font family, weight, letter spacing, and color treatment.
    fill_rule: When split time is required, increase the hour and minute font sizes so the two containers fill the remaining empty space on the watch face without violating mask fit or widget/time overlap limits.
    min_visual_fill_ratio: 0.55

  positioning:
    time_container_definition: A time_container is the bounding box of one rendered time part. Combined time has one time_container. Split hour/minute time has separate hour and minute time_containers. Segmented digit time may have one container per digit group or per digit.
    combined_time:
      container_count: 1
      allowed_anchor_modes:
        - center
        - top_edge
        - left_edge
        - right_edge
        - bottom_edge
      center:
        rule: Center the single time_container within the watch face when no edge anchor creates a stronger layout.
    split_or_segmented_time:
      container_count: multiple
      allowed_anchor_modes_per_container:
        - top_edge
        - left_edge
        - right_edge
        - bottom_edge
      center_allowed: false
      shared_alignment_required: false
      rule: Each time_container must be independently anchored to at least one watch-face edge; multiple time_containers do not need to use the same edge alignment.
      examples:
        - hour_container: top_left
          minute_container: bottom_right
        - hour_container: top_left
          minute_container: bottom_left
    edge_alignment:
      width_threshold: 105
      corner_safe_split_width_threshold: 110
      unit: px
      narrow_time_container:
        condition: individual_time_container_width < 105
        edge_padding: 16
      wide_time_container:
        condition: individual_time_container_width >= 105
        edge_padding: 0
      formulas:
        top_edge_y: edge_padding
        left_edge_x: edge_padding
        right_edge_x: canvas_width - individual_time_container_width - edge_padding
        bottom_edge_y: canvas_height - individual_time_container_height - edge_padding
    disallowed:
      - arbitrary_midfield_positioning
      - visually_unanchored_time_containers
      - centered_split_time_container
      - combined_time_corner_anchor_when_not_full_width
      - split_time_corner_anchor_when_container_width_is_105px_or_less

  sizing_goal:
    rule: Time should fill the remaining empty space as much as possible after widgets and date are placed.
    clear_row_fill:
      condition: Combined time sits on a horizontal row where widgets do not block the available width.
      full_width_container_min_visual_fill_ratio: 0.85
      optimization_target_visual_fill_ratio: 0.95
      rule: Increase the time font size so the digits visually fill the clear horizontal space, as long as the enlarged time stays inside the watch mask and does not overlap any widget by more than 10px.
    constraints:
      - preserve_time_legibility
      - keep_required_widget_time_overlap_at_or_below_10px
      - stay_inside_watch_mask
      - preserve_required_edge_padding_when_edge_aligned
      - preserve_split_time_style_consistency

  rendering_treatments:
    fill:
      use_when:
        - time_weight_is_regular_or_medium
        - layout_needs_maximum_legibility
        - time_color_or_gradient_should_read_as_solid_shape
    outline_stroke:
      use_when:
        - time_weight_is_heavy
        - filled_heavy_numbers_feel_too_dense
        - layout_needs_more_air_through_the_time_shapes
      treatment:
        fill_color: none_or_transparent
        stroke_color: time_color_treatment
        stroke_alignment: centered_or_outside_when_supported
      caution:
        - preserve_digit_legibility
        - avoid_stroke_so_thin_that_time_loses_presence
        - avoid_stroke_so_thick_that_counters_close_up

  split_time_may_differ:
    - font_size
    - position
    - alignment
    - text_box_width
    - text_box_height

  rules:
    - id: time-primary
      strictness: should
      rule: Time should be the most prominent visual element unless user context explicitly prioritizes widgets.

    - id: time-font-family
      strictness: must
      rule: Time must use SF Compact. Font weight, size, and letter spacing may vary based on layout.

    - id: time-container-anchoring
      strictness: must
      rule: Combined time has one time_container that must be centered or aligned to the top, left, right, or bottom edge; split or segmented time has multiple time_containers, and each one must be anchored to at least one top, left, right, or bottom edge.

    - id: time-corner-width-and-padding
      strictness: must
      rule: When time is placed on a watch-face corner, the padding between time and the watch-face edge must be 0px. If hour and minute are in the same container, that container must be 205px wide, its text must be center-aligned in the container, and the font size should increase until the text visually fills the container. If hour and minute are in separated containers, each corner-anchored container must be wider than 105px and its font size should increase to fill the container.

    - id: time-corner-mask-safety
      strictness: must
      rule: Avoid cutting time into the rounded watch mask. Combined time may align to a watch-face corner only when the time_container is full width at 205px and spans x=0..205. Split hour/minute containers may align to a corner only when each corner-anchored container is wider than 105px.

    - id: corner-time-date-stack
      strictness: should
      rule: When time is on a corner, place it directly against the watch-face edge and stack the date vertically inward after the time, away from that corner. When date is on a corner, place it with 16px edge padding and stack time vertically inward from the date. Date-corner time may be small, split, or big full-width 205px and does not need to satisfy corner-time width rules unless the time container itself is corner-anchored.

    - id: time-fill-empty-space
      strictness: should
      rule: Increase time size or adjust split-time arrangement to fill remaining empty space when possible, without violating overlap, mask, edge-padding, or legibility rules.

    - id: split-time-consistency
      strictness: must
      rule: Split hour and minute may use different font sizes, but must share font family, weight, letter spacing, and color treatment.

    - id: time-legibility
      strictness: must
      rule: Time must remain readable after widget overlap, masking, and text scaling are applied.

    - id: heavy-time-can-use-outline
      strictness: should
      rule: If the time numbers use a heavy font weight, consider using outline strokes instead of fill color.

    - id: outline-time-preserves-style-consistency
      strictness: must
      rule: If split hour and minute use outline strokes, both parts must share the same stroke color treatment, stroke width logic, font family, font weight, and letter spacing.
```

## Time Mode Selection

```yaml
time_mode_selection:
  single_line:
    use_when:
      - available_width_is_clear
      - layout_needs_stability
      - rectangular_widgets_occupy_top_or_bottom

  split_hour_minute:
    use_when:
      - layout_needs_more_vertical_expression
      - circular_widgets_occupy_one_side
      - time_can_wrap_around_widgets
      - hour_and_minute_need_different_scale

  segmented_digits:
    use_when:
      - layout_needs_precise_spacing
      - time_sits_between_multiple_widgets
      - agent_needs_control_over_each_digit
    caution:
      - maintain_consistent_style_across_all_digits
      - avoid_excessive_spacing_that_hurts_readability
```

## Widget Classification

The agent should infer semantic content type before it chooses widget shape. Use `widget-content-types.md` and `widget-content-types.json` to identify the content domain, required metadata, optional metadata, and presentation affordances. The watch-face layout rules decide whether each semantic content type renders as one widget or expands into multiple widgets.

```yaml
widget_classification:
  semantic_first:
    reference:
      - widget-content-types.md
      - widget-content-types.json
    steps:
      - infer_semantic_widget_type_from_user_context
      - extract_required_and_optional_metadata_for_that_type
      - identify_metadata_that_can_be_summarized_or_split
      - defer_single_multi_or_mixed_strategy_to_layout_selection
      - map_selected_metadata_to_visual_components_after_strategy_is_chosen

    rules:
      - id: semantic-type-before-shape
        strictness: must
        rule: Determine the semantic widget type before choosing circular or rectangular geometry.

      - id: content-type-expansion-is-layout-owned
        strictness: must
        rule: Use the layout selection rules, not the content type taxonomy alone, to decide whether one semantic content type renders as one widget or expands into multiple widgets.

    - id: render-only-available-metadata
      strictness: must
      rule: Render required metadata when available, render optional metadata only when present or explicitly requested, and do not invent absent real-world values.

    - id: message-intent-selects-last-message
      strictness: must
      rule: If the user asks about messages, texts, chat, DMs, unread items, sender, or their latest or last message, select last_message as the primary content type.

    - id: message-content-has-no-icon
      strictness: must
      rule: For last_message rectangular widgets, sender and timestamp may use an optional message icon, but the message content itself must render as plain text without an icon.

    - id: preserve-context-specific-fields
      strictness: should
      rule: If the user specifically asks for a normally hidden optional field, such as weather wind, include it in the rendered metadata.

  circular:
    best_for:
      - single_metric
      - icon_plus_short_value
      - progress_ring
      - status
      - weather_icon
      - activity_ring
      - battery
      - heart_rate

  rectangular:
    best_for:
      - multiple_lines
      - timeline
      - list
      - chart
      - detailed_weather
      - calendar
      - workout_summary
      - message_preview
      - content_that_needs_horizontal_space

  rules:
    - id: classify-before-layout
      strictness: must
      rule: After semantic content extraction, determine how many rendered widgets are needed and whether each rendered widget should be circular or rectangular before choosing final layout geometry.

    - id: content-drives-shape
      strictness: should
      rule: Choose widget shape based on content needs, not only visual variety.

    - id: controls-require-rectangle
      strictness: must
      rule: Interactive controls such as start, pause, cancel, play, next, previous, or mark complete must render in a rectangular widget unless a component-specific rule explicitly allows otherwise.

    - id: workout-summary-requires-rectangle
      strictness: should
      rule: Compact workout progress/status may use a circular Close Gauge, but workout or exercise summary, recap, stats, details, calories, duration, distance, pace, completion, or comparison requests should use generated_rectangular_widget so the summary text and numbers remain readable.

    - id: timer-control-requires-rectangle
      strictness: should
      rule: Passive countdown status may use a circular Close Gauge, but timer creation, labeled timers, duration setup, cooking/task-specific timers, or visible start/pause/cancel/reset controls should use the strict timer_rectangular template.

    - id: iot-control-requires-rectangle
      strictness: should
      rule: Passive compact device status may use a circular widget, but IoT control, toggle, turn on/off, setpoint, room, thermostat, temperature, light, fan, heater, AC, lock/unlock, or adjustment requests should use generated_rectangular_widget so device name, state, and action remain readable.

    - id: weather-only-uses-rich-weather-layout
      strictness: should
      rule: When Weather is the only selected content type, prioritize either one generated_rectangular_widget weather summary or three S circular weather widgets split into condition, temperature range, and chance of precipitation. Do not use one L circular weather widget unless the user explicitly asks for one compact weather metric.
```

## Color System

The watch face may use either a mono-tone color system or a multicolor system. Resolve the color system after semantic content classification and widget count, before final widget and time rendering.

```yaml
color_system:
  allowed_modes:
    - mono_tone
    - multicolor

  mode_selection:
    content_type_count_defaults:
      one_widget_content_type:
        preferred_mode: mono_tone
      two_widget_content_types:
        allowed_modes:
          - mono_tone
          - multicolor
        selection_guidance: Balance mono-tone and multicolor at roughly equal rates across multi-content requests.
      three_widget_content_types:
        allowed_modes:
          - mono_tone
          - multicolor
        selection_guidance: Balance mono-tone and multicolor at roughly equal rates across multi-content requests, while still considering hierarchy, distinction, and overall visual balance.
    mono_tone:
      use_when:
        - one_widget_content_type_is_present
        - layout_needs_strong_visual_unity
        - widgets_share_a_single_mood_or_theme
        - user_context_implies_one_dominant_status_or_accent
    multicolor:
      use_when:
        - multi_content_balance_selects_multicolor
        - multiple_widgets_need_distinct_semantic_colors
        - user_context_explicitly_requests_color_variety
        - data_categories_would_be_less_clear_with_one_accent
    rules:
      - id: one-content-type-prefers-mono-tone
        strictness: should
        rule: If there is only one widget content type on the watch face, prioritize mono-tone mode.

      - id: two-content-types-prefers-multicolor
        strictness: should
        rule: Legacy compatibility rule. New layouts with two visible widget content types should use multi-content-balanced-color-mode instead of always prioritizing multicolor.

      - id: three-content-types-flexible-color-mode
        strictness: may
        rule: If there are three widget content types on the watch face, choose either mono-tone or multicolor based on hierarchy, distinction, and visual balance.

      - id: multi-content-balanced-color-mode
        strictness: should
        rule: If there are two or three visible widget content types on the watch face and the user did not explicitly request a color mode, choose mono-tone and multicolor at roughly equal rates across requests.

  mono_tone:
    definition: Use one chromatic accent color across the whole watch face, with black, white, and opacity variations allowed as neutral support.
    allowed_chromatic_colors:
      count: 1
      source: widget_accent_color_or_time_accent_color
    allowed_neutrals:
      - black
      - white
    allowed_variations:
      - opacity
      - gradient_opacity_fade
    time_and_date_treatment:
      color: widget_accent_color
      rule: Time numbers and date use the same accent color as the widget content type.

    widget_majority_layout:
      condition: widgets_occupy_majority_of_screen
      time_treatment:
        color: solid
        gradient_allowed: false
      widget_treatments:
        black_surface:
          widget_background: black
          primary_text: accent_color
          secondary_text:
            color: accent_color
            opacity: 60
        primary_accent_surface:
          primary_widget_background: accent_color
          primary_widget_text: white
          primary_widget_secondary_text:
            color: white
            opacity: 60
          other_widget_background: black
          other_widget_text: accent_color
          other_widget_secondary_text:
            color: accent_color
            opacity: 60

    time_majority_layout:
      condition: time_numbers_occupy_at_least_one_third_of_screen
      time_gradient_allowed: true
      gradient_treatments:
        horizontal_opacity_fade:
          direction: left_to_right
          left_stop:
            color: accent_color
            opacity: 100
          right_stop:
            color: accent_color
            opacity: 0
          letter_spacing: -12
          use_when:
            - time_numbers_are_very_compact
            - layout_needs_strong_motion_or_fade
        vertical_opacity_fade:
          direction: top_to_bottom
          top_stop:
            color: accent_color
            opacity: 100
          bottom_stop:
            color: accent_color
            opacity: 0
          letter_spacing: regular
          use_when:
            - time_numbers_need_normal_readability
            - time_is_stacked_or_vertically_dominant

    rules:
      - id: mono-tone-one-accent
        strictness: must
        rule: In mono-tone mode, use only one chromatic accent color across widgets, time, date, gradients, and accent-bearing parts.

      - id: mono-tone-time-date-use-widget-accent
        strictness: must
        rule: In mono-tone mode, time numbers and date must use the same accent color as the widget.

      - id: mono-tone-widget-majority-solid-time
        strictness: must
        rule: When widgets occupy the majority of the screen in mono-tone mode, time numbers must use one solid color, not a gradient.

      - id: mono-tone-black-widget-surface
        strictness: should
        rule: Widgets may use black backgrounds with accent-colored primary text and accent-colored secondary text at 60% opacity.

      - id: mono-tone-primary-accent-surface
        strictness: should
        rule: The primary widget may use the accent color as its background with white primary text and white secondary text at 60% opacity; all other widgets should use black backgrounds.

      - id: mono-tone-time-gradient-threshold
        strictness: must
        rule: In mono-tone mode, time numbers may use a gradient only when they occupy at least one third of the watch face.

      - id: horizontal-fade-compact-spacing
        strictness: may
        rule: When time uses a left-to-right opacity fade from 100% accent to 0% accent, the time may use very compact -12px letter spacing.

      - id: vertical-fade-regular-spacing
        strictness: must
        rule: When time uses a top-to-bottom opacity fade, time numbers must use regular letter spacing.

  multicolor:
    definition: Each widget content type receives its own accent color so multiple semantic content types can remain distinct on the same watch face.
    accent_assignment:
      per_widget_content_type:
        count: 1
        source: widget_accent_color
      same_content_type_multiple_widgets:
        rule: Widgets generated from the same semantic content type should share that content type's accent color unless a component-specific gauge rule derives adjacent colors from it.
    time_and_date_treatment:
      color: white
      rule: Time numbers and date use white in multicolor mode so widget accent colors can carry the content-type distinction.

    rectangular_widget_treatments:
      option_1_black_surface:
        widget_background: black
        primary_text: widget_content_type_accent_color
        icons: widget_content_type_accent_color
        secondary_text:
          color: widget_content_type_accent_color
          opacity: 60
      option_2_accent_surface:
        widget_background: widget_content_type_accent_color
        primary_text: white
        icons: white
        secondary_text:
          color: white
          opacity: 60

    two_rectangular_widgets:
      max_accent_surface_widgets: 1
      option_2_owner: more_important_rectangular_widget
      less_important_widget_treatment: option_1_black_surface

    any_rectangular_widgets:
      surface_mode_field: surfaceMode
      primary_rectangular_widget: accent_surface
      secondary_rectangular_widgets: black_surface
      rule: Every rectangular widget must declare surfaceMode. The most important rectangular widget uses accent_surface by default; if a second rectangular widget renders, it must use black_surface.

    rectangular_present:
      option_2_required_owner: most_important_rectangular_widget
      rule: If multicolor mode is selected and at least one rectangular widget is present, the most important rectangular widget must use option_2_accent_surface.

    circular_widget_treatments:
      close_gauge:
        color_source: widget_content_type_accent_color
        rule: Use the accent color of that widget content type for the close gauge. Close Gauge is for one-direction metrics and may show one centered value plus an optional unit footnote that fits the fixed footnote box. If the close gauge is the only widget for its content type, choose the icon variant instead of text.
      open_gauge:
        color_source: widget_content_type_accent_color
        derived_colors:
          min_value_color: adjacent_hue_counterclockwise_from_accent
          max_value_color: adjacent_hue_clockwise_from_accent
        rule: Pick two hue-adjacent colors from the accent color, one from each direction on the hue spectrum, and map them to the gauge ring's min and max values. Open Gauge is required for range-like metrics such as temperature, heart rate/BPM, and precipitation probability. Open Gauge text/icon variants must not leave the bottom content empty; icon variant renders the value in the center and the icon in the bottom slot. Text bottom labels must use S=15pt, M=18pt, or L=32pt and fit without clipping.
        usage_reference:
          - Circular Widget Guidelines/circular-widget-catalog.json
          - Circular Widget Guidelines/circular-widget-visual-specs.json

    rules:
      - id: multicolor-one-accent-per-content-type
        strictness: must
        rule: In multicolor mode, assign each widget content type exactly one accent color.

      - id: multicolor-time-date-use-white
        strictness: must
        rule: In multicolor mode, time numbers and date must use white.

      - id: multicolor-rect-option-1
        strictness: may
        rule: A rectangular widget may use black background with its content type accent color on text and icons; secondary text uses the same accent at 60% opacity.

      - id: multicolor-rect-option-2
        strictness: may
        rule: A rectangular widget may use its content type accent color as the widget background, with white text and icons; secondary text uses white at 60% opacity.

      - id: multicolor-primary-rectangle-accent-surface
        strictness: must
        rule: If multicolor mode is selected and at least one rectangular widget is present, the most important rectangular widget must use option_2_accent_surface.

      - id: rectangular-surface-mode-explicit
        strictness: must
        rule: Every rectangular widget must include surfaceMode with either black_surface or accent_surface so the renderer can apply the intended background and foreground colors.

      - id: multicolor-two-rectangles-one-accent-surface
        strictness: must
        rule: When two rectangular widgets are presented, only the more important rectangular widget may use option_2_accent_surface.

      - id: multicolor-secondary-rectangle-black-surface
        strictness: must
        rule: When two rectangular widgets are presented, the less important rectangular widget must use option_1_black_surface.

      - id: multicolor-close-gauge-accent
        strictness: must
        rule: Close gauge widgets must use the accent color of their widget content type.

      - id: multicolor-open-gauge-adjacent-hues
        strictness: must
        rule: Open gauge widgets must derive two adjacent hue colors from the widget content type accent, one from each direction on the hue spectrum, and map those colors to the gauge ring's min and max values according to the circular widget guidelines.
```

## Widget Accent Color

`widget_accent_color` is resolved by this rulebook after semantic content classification and before final component rendering. Use `widget-content-types.md` and `widget-content-types.json` as the primary semantic input, then adjust only as needed for context, contrast, and multi-widget harmony.

```yaml
widget_accent_color:
  owner: watch-face-generation-rules.md
  semantic_inputs:
    - widget-content-types.md
    - widget-content-types.json
  consumers:
    - Rectangular Widget Guidelines/rectangular-widget-composition-guidelines.md
    - Rectangular Widget Guidelines/rectangular-widget-catalog.json
    - Rectangular Widget Guidelines/rectangular-widget-visual-specs.json
    - Circular Widget Guidelines/circular-widget-catalog.json
    - Circular Widget Guidelines/circular-widget-visual-specs.json

  resolution_steps:
    - determine_semantic_widget_type
    - read_content_type_metadata_and_presentation_affordances
    - choose_default_accent_for_content_type
    - adjust_for_specific_metadata_when_meaningful
    - adjust_for_contrast_against_widget_background
    - adjust_for_multi_widget_distinction_and_overall_watch_face_harmony
    - assign_widget_accent_color_to_all_accented_parts_of_that_widget

  default_semantic_mapping:
    workout: activity_accent
    activity_summary: activity_accent
    upcoming_event: calendar_accent
    timer: timer_accent
    heart_rate: heart_accent
    last_message: communication_accent
    iot_control: device_accent
    map_navigation: navigation_accent
    sleep_summary: sleep_accent
    music_control: media_accent
    reminder: reminder_accent
    weather: weather_condition_accent
    checklist: task_accent

  content_type_accent_theme:
    usage:
      light: Use on text, icons, and accent-bearing details when the widget background is black.
      dark: Use as the widget background when text and icons on top are white.
    colors:
      weather:
        light: "#3CD3FE"
        dark: "#004559"
      reminder:
        light: "#FFD600"
        dark: "#594B00"
      map_navigation:
        light: "#6D7CFF"
        dark: "#000959"
      iot_control:
        light: "#00DAC3"
        dark: "#005950"
      last_message:
        light: "#0091FF"
        dark: "#003359"
      workout:
        light: "#FF375F"
        dark: "#590012"
      activity_summary:
        light: "#FF375F"
        dark: "#590012"
      upcoming_event:
        light: "#00D2E0"
        dark: "#005459"
      timer:
        light: "#FF9230"
        dark: "#592A00"
      heart_rate:
        light: "#FF4245"
        dark: "#590001"
      sleep_summary:
        light: "#DB34F2"
        dark: "#4E0059"
      music_control:
        light: "#30D158"
        dark: "#004D13"
      checklist:
        light: "#B78A66"
        dark: "#592800"

  adjustment_factors:
    - content_type
    - specific_metadata_values
    - urgency_or_priority
    - positive_neutral_or_warning_state
    - weather_condition_or_environmental_state
    - selected_widget_shape
    - number_of_widgets_on_face
    - neighboring_widget_accent_colors
    - time_color_treatment
    - contrast_against_widget_background

  rules:
    - id: accent-resolved-after-content-type
      strictness: must
      rule: Resolve widget_accent_color only after the semantic widget content type has been selected.

    - id: content-type-primary-accent-source
      strictness: must
      rule: Use widget-content-types.md and widget-content-types.json as the primary semantic source for choosing widget_accent_color.

    - id: use-canonical-content-type-accent-theme
      strictness: must
      rule: Use content_type_accent_theme as the canonical light and dark accent pair for each supported widget content type.

    - id: light-dark-accent-role
      strictness: must
      rule: Use the light accent on text and icons over black backgrounds, and use the dark accent as a widget background when text and icons are white.

    - id: accent-can-consider-context
      strictness: should
      rule: Adjust the accent color when metadata state, urgency, weather condition, nearby widget colors, or contrast makes the default semantic accent weaker.

    - id: one-accent-per-widget
      strictness: must
      rule: Each rendered widget must have one widget_accent_color that is shared by its accented visual parts.

    - id: accent-consumers-stay-consistent
      strictness: must
      rule: Material Symbols icons, progress-bar value layers, circular gauge progress, and other accent-bearing parts of the same widget must use the same widget_accent_color unless a component-specific range or gradient rule explicitly overrides it.

    - id: accent-not-owned-by-composition
      strictness: must
      rule: Composition guidelines may consume widget_accent_color but must not define it.
```

## Strict Content Template Overrides

Some semantic content types have strict rendering templates. These rules override the general rendering strategy and rectangular composition patterns whenever the matching content type is selected.

```yaml
strict_content_template_overrides:
  music_control:
    allowed_shapes:
      - rectangular
    required_template: rectangular_layout_templates.music_control
    template_source: Rectangular Widget Guidelines/rectangular-widget-composition-guidelines.md
    rules:
      - id: music-control-rectangular-template
        strictness: must
        rule: Music Control must render as a rectangular widget using the music_control layout template.

      - id: music-control-no-freeform-layout
        strictness: must
        rule: Do not generate a freeform Music Control rectangular layout.

  reminder:
    allowed_shapes:
      - rectangular
    required_template: rectangular_layout_templates.reminder
    template_source: Rectangular Widget Guidelines/rectangular-widget-composition-guidelines.md
    rules:
      - id: reminder-rectangular-template
        strictness: must
        rule: Reminder must render as a rectangular widget using the reminder layout template.

      - id: reminder-no-freeform-layout
        strictness: must
        rule: Do not generate a freeform Reminder rectangular layout.

  timer:
    allowed_shapes:
      - circular
      - rectangular
    circular:
      allowed_component: close_gauge
      source: Circular Widget Guidelines/circular-widget-catalog.json
    rectangular:
      required_template: rectangular_layout_templates.timer_rectangular
      template_source: Rectangular Widget Guidelines/rectangular-widget-composition-guidelines.md
    rules:
      - id: timer-circular-or-template-rectangle
        strictness: must
        rule: Timer may render as a Close Gauge circular widget or as a rectangular widget using the timer_rectangular template.

      - id: timer-rectangular-no-freeform
        strictness: must
        rule: If Timer renders as rectangular, do not generate a freeform Timer layout.

  checklist:
    allowed_shapes:
      - full_watch_face_rectangular
    required_template: rectangular_layout_templates.checklist_full_face
    template_source: Rectangular Widget Guidelines/rectangular-widget-composition-guidelines.md
    rules:
      - id: checklist-only-widget
        strictness: must
        rule: Checklist must be the only widget on the watch face.

      - id: checklist-full-face-template
        strictness: must
        rule: Checklist must use the checklist_full_face template as a locked Figma component, not as a prompt-composed rectangular widget.

      - id: checklist-strict-figma-frame
        strictness: must
        rule: Checklist must occupy the full 205x251 watch face at frame x=0, y=0, width=205, height=251, with surfaceMode accent_surface and verticalAlignment top.

      - id: checklist-strict-component-slots
        strictness: must
        rule: Checklist owns its own small date/time/title/list slots. Date uses frame x=16, y=16, width=70, height=22. Time uses one compact right-aligned slot x=139, y=16, width=50, height=22 with SF Compact Regular 19pt. Do not add a separate large watch-face time/date stack around checklist.

      - id: checklist-disables-other-widgets
        strictness: must
        rule: When Checklist is selected, do not render other semantic content types as widgets on the same face.

      - id: checklist-fill-content-only
        strictness: must
        rule: The generator may only fill checklist title, items, and checked/completed state; it must preserve the Figma component regions and row styling exactly.

  global_rules:
    - id: strict-template-overrides-general-layout
      strictness: must
      rule: These content-specific template rules override generic shape choice, widget count, rectangular composition, and layout variation rules.

    - id: substitute-content-only
      strictness: must
      rule: Within strict templates, substitute real content and state only; preserve required regions, order, control slots, and edge-attached progress placement.
```

## Rendering Strategy Selection

Rendering strategy depends on semantic content count, available watch-face space, metadata density, and the maximum number of rendered widgets. The content type taxonomy defines what data can be shown; this section decides how many widgets to render and whether a content type is represented as a single widget, multiple widgets, or a mixed group.

```yaml
rendering_strategy_selection:
  limits:
    max_semantic_content_types: 3
    max_rendered_widgets: 3
    every_selected_content_type_needs_at_least_one_widget: true

  strategy_terms:
    single:
      definition: One semantic content type renders as one widget.
      allowed_shapes:
        - circular
        - rectangular
    multi:
      definition: One semantic content type renders as multiple widgets of the same shape.
      allowed_shapes:
        - circular
        - rectangular
    mixed:
      definition: One semantic content type renders as multiple widgets using both circular and rectangular shapes.
      allowed_shapes:
        - circular
        - rectangular

  dense_rectangular_widget:
    definition: A rectangular widget whose body content needs extra vertical space to remain readable.
    scope_note: This is not a global ban on two rectangular widgets. It applies only when at least one rectangular widget crosses the dense-content threshold.
    triggers:
      - body_text_line_count_greater_than: 4
      - text_line_count_with_numbers_greater_than_or_equal_to: 3
    constraints:
      max_rendered_widgets_when_present: 2
      max_rectangular_widgets_when_present: 1
      allowed_second_widget_shape: circular
      third_widget_allowed: false
    rules:
      - id: dense-rectangle-only-rectangle
        strictness: must
        rule: When a rectangular widget has more than 4 lines of body text, or 3 or more lines of text including numbers, that dense rectangular widget must be the only rectangular widget on the watch face.

      - id: dense-rectangle-second-widget-circular-only
        strictness: must
        rule: If a dense rectangular widget is already present and the face needs a second widget, do not add another rectangular widget; the second widget must be circular.

      - id: dense-rectangle-no-third-widget
        strictness: must
        rule: Do not render a third widget when a dense rectangular widget is present.

  content_type_count_rules:
    one_content_type:
      allowed_total_rendered_widgets: [1, 2, 3]
      allowed_strategies:
        - single
        - multi
        - mixed
      guidance:
        - Use single when the content has one primary value, a compact summary, controls, or text that should stay grouped.
        - Use multi when separate metadata fields are equally important and more glanceable as individual widgets.
        - Use mixed when one metric deserves circular emphasis and the remaining details need rectangular space.

    two_content_types:
      allowed_total_rendered_widgets: [2, 3]
      allowed_strategy_combinations:
        - first_content_type: single
          second_content_type: single
          total_widgets: 2
        - first_content_type: single
          second_content_type: multi_or_mixed
          total_widgets: 3
        - first_content_type: multi_or_mixed
          second_content_type: single
          total_widgets: 3
      guidance:
        - Use two widgets when both content types can be summarized clearly.
        - Use three widgets only when one content type has metadata that benefits strongly from separation.
        - Do not expand both content types.

    three_content_types:
      allowed_total_rendered_widgets: [3]
      allowed_strategy_combinations:
        - first_content_type: single
          second_content_type: single
          third_content_type: single
          total_widgets: 3
      guidance:
        - Each content type must render as exactly one widget.
        - Do not use multi or mixed expansion when three semantic content types are selected.
        - Prefer compact summaries and omit optional metadata unless explicitly requested.

  space_decision_factors:
    - number_of_semantic_content_types
    - total_required_metadata_fields
    - optional_metadata_requested_by_user
    - controls_or_buttons_present
    - text_length
    - body_text_line_count
    - text_line_count_with_numbers
    - whether_values_are_comparable_as_individual_metrics
    - available_space_after_time_and_date
    - circular_size_tokens_that_can_fit
    - rectangular_min_height_constraints

  rules:
    - id: max-three-content-types
      strictness: must
      rule: Select no more than three semantic content types from the combined context.

    - id: max-three-rendered-widgets
      strictness: must
      rule: Render no more than three widgets total.

    - id: three-types-force-single
      strictness: must
      rule: When three semantic content types are selected, each content type must use one single widget.

    - id: two-types-one-may-expand
      strictness: must
      rule: When two semantic content types are selected, render either two single widgets or three widgets where only one content type expands.

    - id: one-type-flexible-expansion
      strictness: should
      rule: When one semantic content type is selected, choose single, multi, or mixed based on metadata usefulness and available space.

    - id: dense-rectangular-content-overrides-widget-count
      strictness: must
      rule: Dense rectangular widgets override generic one, two, and three widget expansion rules only after the dense-content threshold is crossed; keep the dense rectangle as the only rectangular widget, allow at most one circular companion widget, and do not render a third widget.
```

## Layout Selection Algorithm

```yaml
layout_selection:
  steps:
    - read_user_context
    - infer_semantic_widget_types
    - extract_required_and_optional_metadata_for_each_semantic_type
    - assess_content_type_count_metadata_density_and_available_space
    - choose_rendering_strategy_for_each_semantic_type
    - count_rendered_widgets_after_semantic_expansion
    - classify_each_rendered_widget_as_circular_or_rectangular
    - map_semantic_metadata_to_visual_components
    - choose_color_system_mode
    - resolve_widget_accent_color
    - choose_circular_size_tokens
    - choose_time_mode
    - choose_time_color_treatment
    - select_candidate_layout_family
    - reserve_date_space_if_needed
    - assign_rectangular_flexible_regions
    - place_widgets_on_top_layers
    - place_time_and_date_on_bottom_layers
    - expand_time_to_fill_clear_horizontal_space
    - allow_controlled_widget_time_overlap_if_useful
    - validate_spacing_legibility_mask_and_overlap
    - score_candidates
    - return_highest_scoring_valid_layout
```

## One Widget Layout Rules

```yaml
one_widget:
  circular:
    rules:
      - use_large_when_user_focuses_on_one_widget
      - use_large_when_widget_is_hero
      - use_medium_when_time_is_also_large
      - place_opposite_the_visual_weight_of_time
    good_patterns:
      - large_circle_top_time_bottom
      - large_circle_bottom_time_top
      - medium_circle_corner_large_time
      - split_time_wrapping_around_circle

  rectangular:
    rules:
      - use_full_width
      - fill_largest_unused_vertical_region
      - place_time_above_or_below
    good_patterns:
      - time_top_rectangle_bottom
      - rectangle_top_time_bottom
      - compact_time_with_tall_rectangle
```

## Two Widget Layout Rules

```yaml
two_widgets:
  two_circular:
    rules:
      - prefer_medium_pair_when_space_allows
      - use_small_pair_when_time_needs_more_space
      - place_as_horizontal_pair_or_balanced_opposites
      - split_hour_and_minute_vertically_when_two_small_circles_occupy_opposite_corners
    good_patterns:
      - time_top_two_circles_bottom
      - two_circles_top_time_middle
      - split_time_between_two_circles

  circular_and_rectangular:
    rules:
      - circular_widget_usually_uses_compact_corner_or_top_area
      - rectangular_widget_fills_remaining_major_region
      - time_sits_between_or_opposite_widgets
    good_patterns:
      - circular_top_left_time_top_right_rectangle_bottom
      - time_top_circular_nearby_rectangle_bottom
      - circular_top_rectangle_bottom_compact_time

  two_rectangular:
    rules:
      - stack_vertically
      - allow_one_rectangle_to_be_taller_if_content_priority_requires
      - keep_time_compact_or_between_rectangles
      - reject_if_either_rectangle_is_dense
    good_patterns:
      - rectangle_top_time_middle_rectangle_bottom
      - compact_time_top_two_rectangles_bottom
```

## Three Widget Layout Rules

```yaml
three_widgets:
  three_circular:
    rules:
      - use_small_circles_by_default
      - stack_all_three_circles_vertically_in_one_column
      - use_the_full_watch_face_height_for_the_circle_column
      - do_not_arrange_three_circles_horizontally
      - do_not_overlap_circular_widgets
      - split_hour_and_minute_vertically
    good_patterns:
      - vertical_stack_on_one_side_split_time_on_other
      - three_circles_side_column_time_left

  two_circular_one_rectangular:
    rules:
      - place_circular_pair_on_one_side_or_one_band
      - rectangular_widget_occupies_opposite_full_width_band
      - time_sits_between_or_overlaps_slightly_under_widgets
    good_patterns:
      - circular_pair_top_time_middle_rectangle_bottom
      - rectangle_top_time_middle_circular_pair_bottom

  one_circular_two_rectangular:
    rules:
      - use_compact_time
      - stack_rectangles_or_make_one_priority_rectangle
      - place_circular_widget_in_remaining_corner_or_side_gap
      - reject_if_either_rectangle_is_dense

  three_rectangular:
    rules:
      - use_only_if_all_widgets_need_text_or_chart_space
      - keep_time_compact
      - reject_if_any_rectangle_falls_below_min_height
      - reject_if_any_rectangle_is_dense
```

## Rectangular Widget Flexing

```yaml
rectangular_flexing:
  single_rectangle:
    formula: max(content_required_height_after_wrapping, available_height_after_time_date_gaps)
    clamp:
      min: 108
      max: remaining_available_space_or_canvas_edge

  multiple_rectangles:
    default_formula: floor((available_height - gaps_between_rectangles) / rectangle_count)
    priority_split:
      primary_widget_percent_range: [60, 70]
      secondary_widget_percent_range: [30, 40]

  rules:
    - id: rectangle-absorbs-variation
      strictness: must
      rule: Size rectangular widgets from their content first. The widget must be tall enough for wrapped text, icons, number lockups, padding, and gaps before time/date are sized.

    - id: rectangle-fills-remaining-band
      strictness: should
      rule: A single rectangular widget should fill the remaining watch-face band from its top edge to the nearest watch-face edge; place time and date in the leftover band.

    - id: rectangle-full-width-edge-alignment
      strictness: must
      rule: Rectangular widgets must always be full-width and top- or bottom-aligned to the watch face without padding.
```

## Candidate Scoring

```yaml
candidate_scoring:
  reward:
    - time_legibility
    - time_uses_sf_compact
    - time_containers_follow_mode_specific_anchoring
    - time_fills_available_empty_space
    - full_width_time_visually_fills_clear_row
    - date_uses_compact_uppercase_format
    - date_uses_sf_compact_regular_19pt
    - date_vertically_stacks_with_time_container
    - useful_widget_content
    - balanced_visual_weight
    - circular_widgets_use_fixed_size_tokens
    - rectangular_widgets_fill_available_space_cleanly
    - date_is_clear_but_secondary
    - controlled_overlap_creates_dynamic_composition
    - color_system_supports_layout_hierarchy
    - mono_tone_uses_one_accent_consistently
    - multicolor_assigns_distinct_accents_by_content_type
    - multicolor_rectangular_surfaces_reflect_widget_importance
    - multicolor_gauge_colors_follow_component_type
    - time_gradient_matches_screen_occupation_and_spacing_rules
    - horizontal_time_gradient_uses_compact_spacing_when_layout_is_tight
    - heavy_time_uses_outline_stroke_when_it_improves_airiness
    - layout_feels_intentional_inside_watch_mask

  penalize:
    - time_too_small
    - time_uses_non_sf_compact_font
    - time_container_arbitrarily_positioned
    - split_time_container_not_edge_anchored
    - time_leaves_large_unused_empty_space
    - date_uses_full_weekday_name
    - date_uses_wrong_font_style
    - date_floats_independently_from_time
    - date_time_stack_has_gap
    - arbitrary_circular_widget_size
    - uncontrolled_overlap
    - cramped_date
    - widgets_that_hide_important_time_digits
    - rectangular_widget_height_below_minimum
    - too_many_elements_centered_on_same_axis
    - mono_tone_uses_multiple_chromatic_accents
    - multicolor_missing_content_type_accent
    - two_rectangular_widgets_both_use_accent_background
    - less_important_rectangle_uses_accent_background
    - open_gauge_uses_unrelated_gradient_colors
    - time_gradient_used_when_widgets_dominate
    - vertical_time_gradient_with_compact_spacing
    - outline_time_reduces_digit_legibility
    - split_outline_time_has_inconsistent_stroke_treatment
    - layout_that_feels_like_evenly_packed_boxes
```

## Validation

```yaml
validation:
  required:
    - all_visible_elements_inside_mask
    - circular_widgets_use_allowed_sizes
    - circular_widgets_use_6px_padding_when_edge_aligned
    - rectangular_widgets_use_205pt_width
    - rectangular_widgets_use_x0
    - rectangular_widgets_are_top_or_bottom_edge_aligned
    - rectangular_widgets_have_no_edge_padding
    - rectangular_widgets_use_54pt_radius
    - rectangular_widgets_use_60_percent_corner_smoothing
    - rectangular_widgets_use_16px_inner_padding
    - rectangular_progress_bar_edge_padding_is_zero
    - rectangular_widgets_clip_content
    - rectangular_widgets_meet_min_height
    - widgets_layer_above_time_and_date
    - widget_time_overlap_does_not_exceed_10px
    - split_hour_minute_styles_are_consistent
    - outline_time_stroke_treatment_is_consistent_when_used
    - time_uses_sf_compact
    - time_containers_follow_mode_specific_anchoring
    - corner_time_uses_zero_edge_padding
    - time_attempts_to_fill_remaining_empty_space_when_possible
    - date_uses_three_letter_uppercase_weekday
    - date_uses_numeric_day_without_ordinal_suffix
    - date_uses_sf_compact_regular_19pt
    - date_vertically_stacks_with_one_time_container
    - date_time_stack_gap_is_0px
    - corner_date_time_stack_direction_matches_corner_owner
    - time_remains_legible
    - date_remains_secondary
    - strict_content_templates_are_applied_when_required
    - checklist_is_only_widget_when_selected
    - dense_rectangular_widget_is_only_rectangular_widget
    - dense_rectangular_widget_has_no_more_than_one_circular_companion
    - dense_rectangular_widget_blocks_third_widget
    - color_system_mode_is_selected
    - color_rules_for_selected_mode_are_applied
    - mono_tone_rules_are_applied_when_mono_tone_is_selected
    - mono_tone_uses_single_chromatic_accent_when_selected
    - mono_tone_time_and_date_use_widget_accent_when_selected
    - mono_tone_widget_majority_uses_solid_time_when_selected
    - mono_tone_time_gradient_only_when_time_occupies_at_least_one_third_when_selected
    - multicolor_rules_are_applied_when_multicolor_is_selected
    - multicolor_each_widget_content_type_has_one_accent
    - multicolor_time_and_date_use_white_when_selected
    - every_rectangular_widget_declares_surfaceMode
    - primary_rectangular_widget_uses_accent_surface
    - multicolor_two_rectangles_use_only_one_accent_surface
    - multicolor_close_gauge_uses_content_type_accent
    - multicolor_open_gauge_uses_adjacent_hue_pair_from_content_type_accent
    - vertical_time_gradient_uses_regular_letter_spacing

  reject_if:
    - any_element_outside_watch_mask
    - circular_widget_has_arbitrary_size
    - circular_widget_edge_aligned_without_6px_padding
    - rectangular_widget_width_is_not_205pt
    - rectangular_widget_x_is_not_0
    - rectangular_widget_is_not_top_or_bottom_aligned
    - rectangular_widget_has_padding_from_watch_face_edge
    - rectangular_widget_height_below_108px
    - rectangular_widget_missing_54pt_radius_or_60_percent_corner_smoothing
    - rectangular_widget_missing_16px_inner_padding
    - rectangular_progress_bar_has_inner_padding_on_attached_edge
    - rectangular_widget_content_bleeds_outside_bounds
    - widget_time_overlap_exceeds_10px
    - widget_overlap_makes_time_unreadable
    - time_uses_font_other_than_sf_compact
    - time_container_is_arbitrarily_positioned
    - split_or_segmented_time_container_is_centered
    - split_or_segmented_time_container_is_not_edge_anchored
    - corner_time_has_edge_padding
    - combined_corner_time_container_is_not_205px_wide
    - split_corner_time_container_is_not_wider_than_105px
    - date_uses_full_weekday_name
    - date_weekday_is_not_three_letter_uppercase
    - date_uses_ordinal_suffix
    - date_uses_font_other_than_sf_compact_regular_19pt
    - date_is_placed_independently_from_time_containers
    - date_does_not_vertically_stack_with_a_time_container
    - date_time_stack_gap_is_not_0px
    - corner_time_date_does_not_stack_away_from_corner
    - corner_date_missing_16px_edge_padding
    - split_hour_and_minute_have_different_weight
    - split_hour_and_minute_have_different_letter_spacing
    - split_hour_and_minute_have_different_font_family
    - split_hour_and_minute_have_different_color_treatment
    - split_outline_hour_and_minute_have_different_stroke_treatment
    - outline_time_is_not_legible
    - date_competes_with_time
    - layout_has_unresolved_collision
    - music_control_uses_non_template_layout
    - reminder_uses_non_template_layout
    - rectangular_timer_uses_non_template_layout
    - checklist_shares_face_with_other_widgets
    - checklist_uses_normal_rectangular_widget_instead_of_full_face_template
    - dense_rectangular_widget_shares_face_with_another_rectangular_widget
    - dense_rectangular_widget_has_more_than_one_companion_widget
    - dense_rectangular_widget_appears_in_three_widget_layout
    - mono_tone_uses_more_than_one_chromatic_accent
    - mono_tone_time_or_date_uses_non_widget_accent
    - mono_tone_time_uses_gradient_when_widgets_occupy_majority
    - mono_tone_time_gradient_used_below_one_third_screen_occupation
    - multicolor_widget_content_type_has_no_accent_color
    - multicolor_widget_content_type_uses_multiple_base_accents
    - multicolor_time_or_date_uses_non_white
    - rectangular_widget_missing_surfaceMode
    - primary_rectangular_widget_missing_accent_surface
    - two_rectangular_widgets_both_use_option_2_accent_surface
    - less_important_rectangular_widget_uses_option_2_accent_surface
    - close_gauge_ignores_widget_content_type_accent
    - open_gauge_uses_colors_not_adjacent_to_widget_content_type_accent
    - vertical_opacity_fade_time_uses_negative_12px_spacing
```

## Agent Instruction Summary

```text
Generate watch faces from constraints, not fixed templates, except when a strict content template override applies. First combine current context with pseudo context, then infer up to three semantic content types. Use widget-content-types.md or widget-content-types.json to extract metadata and identify primary values, splittable metrics, detail fields, controls, conditional fields, and strict rendering constraints. Apply strict overrides before generic layout selection: Music Control must use the music_control rectangular template, Reminder must use the reminder rectangular template, Timer may use a Close Gauge circular widget or the timer_rectangular template, and Checklist must be the only widget using the locked checklist_full_face Figma component. For Checklist, do not invent a watch face: use the exact 205x251 component frame, date slot x=16 y=16 w=70 h=22, compact right-aligned time slot x=139 y=16 w=50 h=22 with SF Compact Regular 19pt, title slot x=16 y=42, and list region x=6 y=71 w=193; fill only title, items, and checked/completed state. Then choose the rendering strategy from layout constraints: one content type may use single, multi, or mixed rendering; two content types may render as two single widgets or three widgets where only one type expands; three content types must each render as one single widget unless Checklist is selected, in which case no other widget may render. Never render more than three widgets total. If a rectangular widget has more than 4 lines of body text, or 3 or more lines of text including numbers, treat it as dense: make it the only rectangular widget, add at most one circular companion widget, and never render a third widget. This dense rule is not a global ban on two rectangular widgets; it prevents adding a second rectangle when the first rectangle already needs extra space. After strategy selection, classify each rendered widget as circular or rectangular, choose mono-tone or multicolor, resolve the widget accent color, choose rectangular surfaceMode, choose the time mode and time color treatment, choose circular size tokens, then select and validate a layout family. Compact workout progress/status may use a circular Close Gauge, but workout or exercise summary, recap, stats, details, calories, duration, distance, pace, completion, or comparison requests should use generated_rectangular_widget so the summary text and numbers remain readable. Passive countdown status may use a circular Close Gauge, but timer creation, labeled timers, duration setup, cooking/task-specific timers, or visible start/pause/cancel/reset controls should use timer_rectangular. Passive compact device status may use a circular widget, but IoT control, toggle, turn on/off, setpoint, room, thermostat, temperature, light, fan, heater, AC, lock/unlock, or adjustment requests should use generated_rectangular_widget. When Weather is the only selected content type, prioritize either one generated_rectangular_widget weather summary or three S circular weather widgets split into condition, temperature range, and chance of precipitation; do not use one L circular weather widget unless the user explicitly asks for one compact weather metric. Date must use compact uppercase format such as SUN 2, with SF Compact Regular 19pt. Date must vertically stack with one time_container instead of floating independently; the gap between date and that time_container is 0px. When time is placed on a watch-face corner, it must use 0px padding to the watch-face edge, and the date must stack vertically inward after the time, away from that corner: below top-corner time, or above bottom-corner time. Combined corner time uses one 205px-wide container spanning x=0..205; its text must be center-aligned in the container, and its font size should increase until the text visually fills the container. Split corner time uses separated hour/minute containers; each corner-anchored container must be wider than 105px and should increase font size to fill its container. When date is placed on a watch-face corner, date keeps 16px padding from the watch-face edge and time stacks vertically inward from the date: below top-corner date, or above bottom-corner date. Date-corner time may be small, split, or big full-width 205px and does not need to satisfy corner-time width rules unless the time container itself is corner-anchored. Time must use SF Compact; weight, size, and letter spacing may vary by layout. Combined time uses one time_container that must be centered or anchored to top/left/right/bottom. Split or segmented time uses multiple time_containers; each container must be independently anchored to at least one top/left/right/bottom edge, and the containers do not need to share the same alignment. Time should fill remaining empty space when possible without violating mask, edge-padding, legibility, or the 10px widget overlap limit. Prefer mono-tone when there is one visible widget content type. When two or three visible widget content types are rendered, choose mono-tone and multicolor at roughly equal rates across requests, unless the user explicitly asks for colorful, multicolor, monochrome, or single-color treatment. In mono-tone mode, use one chromatic accent with black, white, and opacity support; time numbers and date use the same accent color as the widget. If widgets occupy the majority of the screen, use solid-color time; if time occupies at least one third of the screen, time may use a gradient. Horizontal left-to-right opacity fades may use -12px letter spacing when the time is compact; vertical top-to-bottom fades must use regular letter spacing. In multicolor mode, assign each widget content type one accent color, while time numbers and date use white. Every rectangular widget must include surfaceMode. The primary rectangular widget should use accent_surface with dark widget_accent_color as the background and white text/icons; if two rectangular widgets are present, only the more important one may use accent_surface and the less important one must use black_surface with light widget_accent_color text/icons. Close gauges use the content type accent and are only for one-direction metrics; text close gauges show one centered value and may include an optional footnote only when needed for unit metadata; the footnote must use fixed box widths S=40px, M=50px, L=80px and must not clip. Open gauges are required for range-like metrics such as temperature, heart rate/BPM, and precipitation probability; they derive two hue-adjacent colors from that accent and map them to the gauge ring's min and max values. Circular widgets must use fixed size tokens S=72x72px, M=90x90px, or L=150x150px; Open Gauge center values and Close Gauge text variant center values must use fixed box widths S=55px, M=65px, and L=115px and must not clip; keep 6px padding from any watch-face edge they align to. Rectangular widgets are always full width at 205pt, x=0, top- or bottom-aligned to the watch face with no edge padding, flex vertically, use 54pt radius with 60% iOS-style corner smoothing, use 16px inner padding on all sides, and clip content to the rounded widget bounds. If a progress bar is attached to the top or bottom widget edge, that attached edge's inner padding must be 0px so the progress bar leans directly against the edge. Widgets sit above time and date, and may overlap time by up to 10px when it improves the composition. Split hour and minute text may differ in size and placement, but must share font family, weight, letter spacing, and color treatment. If time numbers use a heavy font weight, consider outline strokes instead of fill color, while preserving digit legibility and consistent stroke treatment across split time parts. Always validate mask fit, legibility, overlap, color-system compliance, widget usefulness, strict template compliance, dense rectangular constraints, and visual balance before returning a layout.
```

Latest layout addendum: widgets must never overlap other widgets or the date; the only allowed overlap is widget/time overlap up to 10px. Three circular widgets must stack vertically in one column and use the watch-face height instead of forming a horizontal row. When time is placed on a corner, padding between time and the watch-face edge must be 0px. Combined time may use a corner anchor only when its container is full width at 205px, spans x=0..205, uses center-aligned text, and increases font size to fill that container. Split hour/minute containers may use corner anchors only when each corner-anchored container is wider than 105px and each font size increases to fill its container. Date stacks vertically inward after corner time, away from the corner. When date is placed on a corner, it keeps 16px edge padding and time stacks vertically inward from the date. Date-corner time may be small, split, or big full-width 205px.

Latest time-fill addendum: after placing all widgets, inspect the horizontal row where time will sit. If that row has more available horizontal space, increase the time font size so the time uses the available width, as long as the enlarged time still fits the watch mask and does not overlap any widget by more than 10px. When a combined single-line time container is full width at 205px and no widget blocks that row, the rendered digits should be center-aligned and visually fill at least 85% of the watch-face width; aim closer to 95% when optimizing or repairing. When split hour/minute containers sit on a corner, each container should visually fill its own wider-than-105px container while preserving mask fit.

Latest circular addendum: if a close_gauge is the only widget for that content type, choose the icon variant instead of the text variant so the widget explains the data type. Open Gauge text and icon variants must fill their visible bottom content: text requires a short bottom label, icon requires a centered value plus a valid semantic icon in the bottom slot, range requires lowLabel and highLabel, and offset requires referenceValue. The open_gauge icon variant must not render the icon in the center. Open Gauge center values and Close Gauge text variant center values use fixed box widths of L=115px, M=65px, and S=55px. Open Gauge bottom text uses fixed Figma font sizes of L=32pt, M=18pt, and S=15pt plus fixed bottom text box widths of L=96px, M=60px, and S=48px; keep labels short enough that the bottom text box does not clip. Close Gauge text footnotes use fixed box widths of L=80px, M=50px, and S=40px.

Latest time and color addendum: choose circular size tokens before choosing time mode. Split hour and minute into two vertically stacked containers when there is only one S or M circular widget on the face, when two S circular widgets occupy opposite corners, or when three S circular widgets stack vertically on one side. When this split happens, increase the hour and minute font sizes so they fill the remaining empty space on the watch face while preserving mask fit and the widget/time overlap limit. When the user context calls for a focused one-widget face and circular rendering is supported, show one L circular widget. In multicolor mode, if any rectangular widget is present, the most important rectangular widget must use the accent color as its background with white text and icons; if two rectangular widgets are present, only that most important rectangle may use the accent background.
