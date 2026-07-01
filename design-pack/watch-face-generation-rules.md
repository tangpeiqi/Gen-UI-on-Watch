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

  rules:
    - id: widgets-above-time
      strictness: must
      rule: Widgets must be visually layered above time and date.

    - id: controlled-overlap
      strictness: must
      rule: Widgets may overlap time or date only when the overlap is 10px or less.

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
```

## Widget Types

```yaml
widgets:
  circular:
    shape: circle
    resizing: fixed_only
    allowed_sizes:
      small:
        width: 72
        height: 72
      medium:
        width: 90
        height: 90
      large:
        width: 149
        height: 149
    rules:
      - id: circular-fixed-size
        strictness: must
        rule: Circular widgets must use exactly one allowed size token.

      - id: no-arbitrary-circle-scaling
        strictness: must
        rule: Circular widgets must not be stretched or scaled to arbitrary dimensions.

  rectangular:
    shape: rounded_rectangle
    width:
      behavior: fixed
      preferred: full_canvas
      value: 205
    height:
      behavior: flexible
      min: 80
      max: remaining_available_space
    corner_radius:
      value: 54
      unit: px
    corner_smoothing:
      value: 100
      unit: percent
      platform_intent: iOS continuous corner treatment
    resizing: vertical_only
    rules:
      - id: rectangular-flex-height
        strictness: must
        rule: Rectangular widgets may flex vertically, but should keep full watch-face width unless a layout pattern explicitly reserves side space.

      - id: rectangular-min-height
        strictness: must
        rule: Rectangular widget height must be at least 80px.

      - id: rectangular-ios-corners
        strictness: must
        rule: Rectangular widgets must use 54px corner radius with 100% corner smoothing.
```

## Time Object

The time object may be one text layer, two text layers, or multiple segmented text layers. When split across text layers, the parts should behave as one visual system.

```yaml
time:
  priority: primary
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

  split_time_invariants:
    hour_and_minute_must_match:
      - font_family
      - font_weight
      - letter_spacing
      - color_treatment

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

    - id: split-time-consistency
      strictness: must
      rule: Split hour and minute may use different font sizes, but must share font family, weight, letter spacing, and color treatment.

    - id: time-legibility
      strictness: must
      rule: Time must remain readable after widget overlap, masking, and text scaling are applied.
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

The agent should infer widget shape from information density, importance, and expected content.

```yaml
widget_classification:
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
      rule: After counting widgets, determine whether each widget should be circular or rectangular before choosing final layout geometry.

    - id: content-drives-shape
      strictness: should
      rule: Choose widget shape based on content needs, not only visual variety.
```

## Layout Selection Algorithm

```yaml
layout_selection:
  steps:
    - read_user_context
    - extract_required_information
    - count_widgets
    - classify_each_widget_as_circular_or_rectangular
    - choose_time_mode
    - choose_circular_size_tokens
    - select_candidate_layout_family
    - reserve_date_space_if_needed
    - assign_rectangular_flexible_regions
    - place_widgets_on_top_layers
    - place_time_and_date_on_bottom_layers
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
    good_patterns:
      - rectangle_top_time_middle_rectangle_bottom
      - compact_time_top_two_rectangles_bottom
```

## Three Widget Layout Rules

```yaml
three_widgets:
  three_circular:
    rules:
      - use_small_or_medium_circles
      - avoid_large_circle_unless_other_widgets_are_minimal
      - use_time_split_or_compact_mode
    good_patterns:
      - vertical_stack_on_one_side_split_time_on_other
      - two_circles_top_one_circle_bottom
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

  three_rectangular:
    rules:
      - use_only_if_all_widgets_need_text_or_chart_space
      - keep_time_compact
      - reject_if_any_rectangle_falls_below_min_height
```

## Rectangular Widget Flexing

```yaml
rectangular_flexing:
  single_rectangle:
    formula: available_height_after_time_date_gaps
    clamp:
      min: 80
      max: remaining_available_space

  multiple_rectangles:
    default_formula: floor((available_height - gaps_between_rectangles) / rectangle_count)
    priority_split:
      primary_widget_percent_range: [60, 70]
      secondary_widget_percent_range: [30, 40]

  rules:
    - id: rectangle-absorbs-variation
      strictness: should
      rule: Use rectangular widget height to absorb layout variation before shrinking time below legible size.

    - id: rectangle-width-stability
      strictness: should
      rule: Prefer full-width rectangular widgets for clear structure and visual calm.
```

## Candidate Scoring

```yaml
candidate_scoring:
  reward:
    - time_legibility
    - useful_widget_content
    - balanced_visual_weight
    - circular_widgets_use_fixed_size_tokens
    - rectangular_widgets_fill_available_space_cleanly
    - date_is_clear_but_secondary
    - controlled_overlap_creates_dynamic_composition
    - layout_feels_intentional_inside_watch_mask

  penalize:
    - time_too_small
    - arbitrary_circular_widget_size
    - uncontrolled_overlap
    - cramped_date
    - widgets_that_hide_important_time_digits
    - rectangular_widget_height_below_minimum
    - too_many_elements_centered_on_same_axis
    - layout_that_feels_like_evenly_packed_boxes
```

## Validation

```yaml
validation:
  required:
    - all_visible_elements_inside_mask
    - circular_widgets_use_allowed_sizes
    - rectangular_widgets_use_54px_radius
    - rectangular_widgets_use_100_percent_corner_smoothing
    - rectangular_widgets_meet_min_height
    - widgets_layer_above_time_and_date
    - widget_time_overlap_does_not_exceed_10px
    - split_hour_minute_styles_are_consistent
    - time_remains_legible
    - date_remains_secondary

  reject_if:
    - any_element_outside_watch_mask
    - circular_widget_has_arbitrary_size
    - rectangular_widget_height_below_80px
    - rectangular_widget_missing_ios_corner_treatment
    - widget_time_overlap_exceeds_10px
    - widget_overlap_makes_time_unreadable
    - split_hour_and_minute_have_different_weight
    - split_hour_and_minute_have_different_letter_spacing
    - split_hour_and_minute_have_different_font_family
    - split_hour_and_minute_have_different_color_treatment
    - date_competes_with_time
    - layout_has_unresolved_collision
```

## Agent Instruction Summary

```text
Generate watch faces from constraints, not fixed templates. Count the requested widgets, classify each widget as circular or rectangular based on its content, choose the time mode, choose circular size tokens, then select and validate a layout family. Circular widgets must use fixed size tokens. Rectangular widgets flex vertically and use 54px radius with 100% iOS-style corner smoothing. Widgets sit above time and date, and may overlap time by up to 10px when it improves the composition. Split hour and minute text may differ in size and placement, but must share font family, weight, letter spacing, and color treatment. Always validate mask fit, legibility, overlap, widget usefulness, and visual balance before returning a layout.
```
