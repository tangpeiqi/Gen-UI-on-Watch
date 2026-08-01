# Rectangular Widget Composition Guidelines

This document defines the atomic visual units available for composing rectangular widgets in the generative watch face. Assembly rules, valid patterns, and content-specific guidance will be added after the atomic vocabulary is stable.

## Design Intent

Rectangular widgets should be built from a small set of repeatable typographic, icon, and control units. The generator should choose from these units, preserve their visual roles, and compose them inside the rectangular widget container without inventing new type sizes, weights, icon sizes, or control styles.

## Atomic Units

| Unit | Role | Size | Typography | Color | Notes |
| --- | --- | --- | --- | --- | --- |
| Numbers | Primary numeric value | Intrinsic to text content | SF Compact Regular, 40px, 42.5px line height | #FFFFFF | Use for the dominant data value in a rectangular widget. |
| Body Emphasis | Emphasized body text | Intrinsic to text content | SF Compact Semibold, 19px, 21.5px line height | #FFFFFF | Use for short labels, status phrases, or secondary values that need emphasis. |
| Body | Standard body text | Intrinsic to text content | SF Compact Regular, 19px, 21.5px line height | #FFFFFF | Use for normal readable text at the main body scale. |
| Secondary | Muted supporting text | Intrinsic to text content | SF Compact Regular, 19px, 21.5px line height | rgba(242, 244, 252, 0.6) | Use for captions, secondary labels, timestamps, or lower-priority supporting information. |
| Icon Big | Primary icon container | 48 x 48 | N/A | Container: no fill; symbol: widget accent color | Circular icon slot. Use when the icon is a key part of the widget identity. |
| Icon Small | Supporting icon container | 24 x 24 | N/A | Container: no fill; symbol: widget accent color | Circular icon slot. Use for compact symbols, status markers, or accessory icons. |
| Progress Bar | Linear progress indicator | 173 x 12 | N/A | Base: rgba(242, 244, 252, 0.1); value: widget accent color | Use for bounded progress, completion, range fulfillment, or level indicators. |
| Radio Button | Binary selection control | 24 x 24 | N/A | Unselected stroke: #9BA0AA; selected stroke/fill: #F2F4FC | Use when a rectangular widget needs a compact selected/unselected state. |

## Unit Specs

```yaml
atomic_units:
  numbers:
    type: text
    role: primary_numeric_value
    sizing: intrinsic_to_text_content
    typography:
      family: SF Compact
      weight: regular
      font_size: 40
      line_height: 42.5
      horizontal_align: left
      vertical_align: center
    color: "#FFFFFF"

  body_emphasis:
    type: text
    role: emphasized_body_text
    sizing: intrinsic_to_text_content
    typography:
      family: SF Compact
      weight: semibold
      font_size: 19
      line_height: 21.5
      horizontal_align: left
      vertical_align: center
    color: "#FFFFFF"

  body:
    type: text
    role: standard_body_text
    sizing: intrinsic_to_text_content
    typography:
      family: SF Compact
      weight: regular
      font_size: 19
      line_height: 21.5
      horizontal_align: left
      vertical_align: center
    color: "#FFFFFF"

  secondary:
    type: text
    role: muted_supporting_text
    sizing: intrinsic_to_text_content
    typography:
      family: SF Compact
      weight: regular
      font_size: 19
      line_height: 21.5
      horizontal_align: left
      vertical_align: center
    color: "rgba(242, 244, 252, 0.6)"

  icon_big:
    type: icon_container
    role: primary_icon
    icon_source: Material Symbols
    box:
      width: 48
      height: 48
    shape:
      kind: circle
      corner_radius: 24
    fill: none
    symbol_color: widget_accent_color

  icon_small:
    type: icon_container
    role: accessory_icon
    icon_source: Material Symbols
    box:
      width: 24
      height: 24
    shape:
      kind: circle
      corner_radius: 24
    fill: none
    symbol_color: widget_accent_color

  progress_bar:
    type: progress_indicator
    role: linear_progress
    box:
      width: 173
      height: 12
    shape:
      kind: rectangle
      corner_radius: 0
    layers:
      base:
        color: "rgba(242, 244, 252, 0.1)"
        width: 173
        height: 12
      value:
        color: widget_accent_color
        height: 12
        width_behavior: proportional_to_progress
    data:
      progress:
        type: number
        range: [0, 1]

  radio_button:
    type: selection_control
    role: binary_selection
    box:
      width: 24
      height: 24
    states:
      unselected:
        outer_ring:
          diameter: 16
          stroke: "#9BA0AA"
          stroke_width: 2
          fill: none
      selected:
        outer_ring:
          diameter: 16
          stroke: "#F2F4FC"
          stroke_width: 2
          fill: none
        inner_dot:
          diameter: 10
          fill: "#F2F4FC"
```

## Shared Typography Rules

- Use SF Compact for all rectangular-widget text.
- Use 0 letter spacing.
- Let text width and height be determined by the actual text content and the widget layout.
- Keep text vertically centered in its layout region.
- Do not synthesize additional text styles unless a future guideline explicitly adds them.
- Preserve the distinction between regular, semibold, and muted secondary text.

## Color Rules

```yaml
colors:
  primary_text: "#FFFFFF"
  secondary_text: "rgba(242, 244, 252, 0.6)"
  icon_container: none
  material_symbol_icon: widget_accent_color
  progress_bar_base: "rgba(242, 244, 252, 0.1)"
  progress_bar_value: widget_accent_color
  radio_unselected_stroke: "#9BA0AA"
  radio_selected: "#F2F4FC"
```

- Primary values and emphasized text use white.
- Secondary text uses the muted secondary color.
- Icon containers have no fill.
- Material Symbols icons render in `widget_accent_color`.
- `widget_accent_color` is resolved by `watch-face-generation-rules.md` using `widget-content-types.md`, `widget-content-types.json`, and other layout or context factors.
- Progress bars use a muted base layer and a value layer that aligns with the widget's chosen accent color.
- Radio buttons use a muted stroke when unselected and a full-opacity stroke plus inner dot when selected.

## Rectangular Container Rules

```yaml
rectangular_container:
  width: 205
  width_unit: pt
  horizontal_position:
    x: 0
    behavior: full_watch_face_width
  corner_radius:
    value: 54
    unit: pt
  corner_smoothing:
    value: 60
    unit: percent
  inner_padding:
    default:
      top: 16
      right: 16
      bottom: 16
      left: 16
    unit: px
    progress_bar_edge_exception:
      top_progress_bar:
        top: 0
      bottom_progress_bar:
        bottom: 0
  clipping:
    clip_content_to_widget_bounds: true
  rules:
    - id: rectangular-full-width
      strictness: must
      rule: Rectangular widgets must always be 205pt wide.
    - id: rectangular-default-inner-padding
      strictness: must
      rule: Rectangular widgets must use 16px inner padding on top, right, bottom, and left by default.
    - id: progress-bar-padding-exception
      strictness: must
      rule: If a progress bar is attached to the top or bottom edge, set that attached edge's inner padding to 0px so the progress bar leans against the widget edge.
    - id: rectangular-clip-content
      strictness: must
      rule: Rectangular widgets must clip content to the widget bounds so child content cannot bleed outside the rounded rectangle.
```

## Icon Selection And Accent Color

```yaml
icon_color_contract:
  icon_source: Material Symbols
  symbol_color: widget_accent_color
  accent_source:
    owner: watch-face-generation-rules.md
    semantic_inputs:
      - widget-content-types.md
      - widget-content-types.json
    key: widget_accent_color
  rules:
    - id: material-symbols-only
      strictness: must
      rule: When an icon is needed, choose a symbol from Material Symbols.
    - id: symbol-uses-widget-accent
      strictness: must
      rule: Render the selected Material Symbols icon in the widget_accent_color.
    - id: accent-owned-by-content-type
      strictness: must
      rule: Use widget_accent_color resolved by watch-face-generation-rules.md; do not determine it inside the local composition pattern.
    - id: icon-container-no-fill
      strictness: must
      rule: Icon containers must not add a background fill behind the Material Symbols icon.
```

## Composition Patterns

These patterns define how atomic units may be assembled inside a rectangular widget. Treat the pattern rules as generator constraints, not visual suggestions.

## Generated Rectangular Widget Schema

Generative rectangular widgets that are not covered by strict templates must use `generated-rectangular-widget-schema.json`.

The schema allows only the atomic units and composition patterns in this document:

- `text`
- `inline_small_icon_text`
- `big_icon_text_group`
- `number_text_lockup`
- `edge_progress_bar`

The schema rejects arbitrary HTML, CSS, SVG, script, unapproved icon names, unapproved type units, and freeform visual primitives. Strict template content types are excluded from `generated_rectangular_widget`; Music Control, Reminder, Timer, and Checklist must keep using their required templates.

```yaml
composition_patterns:
  inline_small_icon_text:
    purpose: Attach a compact icon to a short text unit.
    structure:
      direction: horizontal
      children:
        - icon_small
        - one_of: [body, body_emphasis, secondary]
    spacing:
      gap: 4
      vertical_alignment: center
      padding: 0
    rules:
      - id: icon-small-left-inline
        strictness: must
        rule: Icon Small must always sit inline on the left side of a Body, Body Emphasis, or Secondary text unit.
      - id: icon-small-not-standalone
        strictness: must
        rule: Icon Small must not be used as a standalone element inside a rectangular widget.
      - id: icon-small-no-right-side
        strictness: must
        rule: Icon Small must not be placed to the right of text.
      - id: icon-small-text-only
        strictness: must
        rule: Icon Small must not be paired directly with Numbers, Progress Bar, Radio Button, or Icon Big.

  big_icon_text_group:
    purpose: Pair a primary icon with a stacked text group.
    structure:
      direction: horizontal
      children_allowed_orders:
        - [icon_big, text_group]
        - [text_group, icon_big]
      text_group:
        direction: vertical
        allowed_children:
          - [numbers, body, secondary]
          - [body, secondary]
          - [body_emphasis, secondary]
    spacing:
      widget_padding: 16
      icon_text_gap: 8
      vertical_alignment: center
      text_group_gap: 0
    rules:
      - id: icon-big-side-placement
        strictness: must
        rule: Icon Big must be placed on either the left or right side of the text group within the rectangular widget.
      - id: icon-big-not-inline
        strictness: must
        rule: Icon Big must not be inserted inline between text units.
      - id: icon-big-centered-with-group
        strictness: should
        rule: Icon Big should be vertically centered against the full text group.

  number_text_lockup:
    purpose: Attach a unit label or qualifier to a primary number.
    structure:
      direction: horizontal
      children:
        - numbers
        - one_or_more_of: [body, secondary]
    spacing:
      gap: 4
      vertical_alignment: baseline
      padding: 0
    rules:
      - id: number-first
        strictness: must
        rule: Numbers must be the first unit in a number text lockup.
      - id: number-lockup-text-types
        strictness: must
        rule: Numbers may form a lockup with Body, Secondary, or both.
      - id: number-lockup-baseline
        strictness: should
        rule: Text units in the lockup should align to the baseline of the number.

  edge_progress_bar:
    purpose: Show progress as a structural edge of the rectangular widget.
    structure:
      position: top_or_bottom_edge
      children:
        - progress_bar
    spacing:
      vertical_padding: 0
      top_position_y: 0
      bottom_position_y: widget_height_minus_progress_bar_height
      horizontal_position: align_to_widget_content_inset
      attached_edge_inner_padding: 0
    rules:
      - id: progress-bar-edge-only
        strictness: must
        rule: Progress Bar must be placed against either the top or bottom edge of the rectangular widget.
      - id: progress-bar-no-vertical-padding
        strictness: must
        rule: Progress Bar must have no vertical gap from the edge it is attached to.
      - id: progress-bar-not-floating
        strictness: must
        rule: Progress Bar must not float in the middle of the widget content area.
      - id: progress-bar-accent
        strictness: must
        rule: Progress Bar value color must use the widget accent color.
```

## Pattern Guidance

- Use `inline_small_icon_text` for compact metadata rows, status labels, and secondary facts.
- Use `big_icon_text_group` when the icon is part of the widget's main identity or helps classify the text group at a glance.
- Use `number_text_lockup` when a number needs a unit, short label, or secondary qualifier on the same baseline.
- Use `edge_progress_bar` when progress should read as part of the rectangular widget container rather than as a standalone row.

## Content-Specific Layout Templates

These templates are stricter than the general composition patterns. When `watch-face-generation-rules.md` maps a widget content type to one of these templates, the agent must preserve the template structure and only substitute content, selected icons, control state, progress values, and `widget_accent_color`.

All regular rectangular widgets use the full watch-face width: 205pt wide, 54pt corner radius, and 60% corner smoothing. Regular rectangular widget content uses 16px inner padding on all sides. When a progress bar is attached to the top or bottom edge, that attached edge's padding is 0px. All regular rectangular widgets clip child content to their rounded bounds. Template dimensions below use watch-face points; in the web simulator, 1pt maps to 1 CSS px.

```yaml
rectangular_layout_templates:
  music_control:
    applies_to_content_type: music_control
    strictness: must
    widget:
      width: 205
      height: 140
      corner_radius: 54
      corner_smoothing: 60
      clip_content: true
      layout: vertical
      padding: { top: 16, right: 16, bottom: 0, left: 16 }
      gap: 10
    regions:
      text_group:
        width: 173
        height: 44
        layout: vertical
        gap: 0
        children:
          - body_emphasis: song
          - secondary: artist_or_album
      controls:
        width: 173
        height: 48
        layout: horizontal
        distribution: space_between
        buttons:
          - previous
          - play_pause
          - next
      progress:
        template: edge_progress_bar
        position: bottom
        width: 173
        height: 12
    rules:
      - id: music-template-only
        strictness: must
        rule: Music Control must use this rectangular template when rendered as a rectangular widget.
      - id: music-controls-required
        strictness: must
        rule: Preserve the previous, play/pause, and next control slots.
      - id: music-progress-bottom
        strictness: must
        rule: Preserve the bottom progress bar with no bottom padding.

  reminder:
    applies_to_content_type: reminder
    strictness: must
    widget:
      width: 205
      height: 127
      corner_radius: 54
      corner_smoothing: 60
      clip_content: true
      layout: vertical
      padding: { top: 16, right: 16, bottom: 16, left: 16 }
      gap: 8
    regions:
      metadata_row:
        width: 173
        height: 22
        left_reserved_space: 32
        text:
          unit: secondary
          content: reminder_label_or_due_context
      task_row:
        width: 173
        layout: horizontal
        gap: 8
        children:
          - radio_button
          - body_emphasis: reminder_content
    rules:
      - id: reminder-template-only
        strictness: must
        rule: Reminder must use this rectangular template when rendered.
      - id: reminder-radio-left
        strictness: must
        rule: The radio button must sit on the left of the reminder content.
      - id: reminder-content-emphasis
        strictness: must
        rule: The main reminder content must use Body Emphasis.

  timer_rectangular:
    applies_to_content_type: timer
    strictness: must_when_timer_is_rectangular
    widget:
      width: 205
      height: 139
      corner_radius: 54
      corner_smoothing: 60
      clip_content: true
      layout: vertical
      padding: { top: 16, right: 16, bottom: 16, left: 16 }
      gap: 16
    regions:
      countdown:
        unit: numbers
        content: countdown
        format: timer_duration
      controls:
        width: 173
        height: 48
        layout: horizontal
        distribution: space_between
        buttons:
          - reset
          - start_pause
          - cancel
    rules:
      - id: timer-rectangular-template
        strictness: must
        rule: If Timer is rendered as a rectangular widget, it must use this template.
      - id: timer-rectangular-controls
        strictness: must
        rule: Preserve reset, start/pause, and cancel control slots.
      - id: timer-countdown-primary
        strictness: must
        rule: The countdown must be the primary Numbers unit.

  checklist_full_face:
    applies_to_content_type: checklist
    strictness: must
    widget:
      width: 205
      height: 251
      layout: full_watch_face
      corner_radius: follows_watch_mask
      occupies_entire_watch_face: true
    regions:
      date:
        x: 16
        y: 16
        unit: body
      current_time:
        x: 139
        y: 16
        unit: body
        align: right
      title:
        x: 16
        y: 42
        unit: body_emphasis
      list:
        x: 6
        y: 71
        width: 193
        layout: vertical
        gap: 2
        visible_item_count: 4
        item:
          width: 193
          height: 56
          corner_radius: 8
          fill: "rgba(242, 244, 252, 0.1)"
          padding: { left: 8, right: 8 }
          gap: 4
          children:
            - radio_button
            - body: checklist_item_text
    rules:
      - id: checklist-only-widget
        strictness: must
        rule: Checklist must be the only widget on the watch face.
      - id: checklist-full-face-template
        strictness: must
        rule: Checklist must use this full-face checklist template, not a normal rectangular widget mixed with other widgets.
      - id: checklist-list-items
        strictness: must
        rule: Render checklist items as rows with radio buttons on the left and Body text on the right.
```

## Rejected Compositions

- Do not place Icon Small above, below, or to the right of text.
- Do not pair Icon Small directly with Numbers.
- Do not place Icon Big inside a text line.
- Do not place Progress Bar with vertical padding from the top or bottom edge.
- Do not use Progress Bar as an arbitrary divider between text rows.
- Do not invent extra variants of these lockups unless the guideline adds them.

## Composition Placeholders

The following sections are intentionally left as placeholders for the next design pass:

- Widget anatomy
- Required and optional regions
- Alignment rules
- Text truncation behavior
- Data binding rules
- Empty, loading, and error states
- Accepted and rejected examples
