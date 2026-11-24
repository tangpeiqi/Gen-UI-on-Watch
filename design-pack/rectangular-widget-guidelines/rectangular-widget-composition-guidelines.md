# Rectangular widget design guide

Design already-selected rectangular content through either a strict template or the generated composition grammar. Selection policy owns rank, scope, shape, count, strict-template assignment, and recovery. Content types own semantics and formulas. This guide owns internal composition and required dimensions; generation guide owns placement and theme assignment.

## 1. Consume selected content and the assigned template

Receive content type, selected groups, required and selected optional fields, displayed details/controls, and the assigned template. Preserve relationships among values, goals, labels, and actions. Follow the shared content-preservation contract in ../README.md.

Use eligible data and synthetic demo completion authorized upstream by selection policy; preserve provenance internally. Do not fill component slots with independently invented facts. Available optional metadata is not automatically selected for display.

Selection can propose a representation and request its dimensions before finalizing companion widgets. Return the actual required height; do not force the content into 108px to obtain a preferred composition. The policy owns that threshold and its consequences.

## 2A. Strict-template design path

1. Read the assigned catalog entry and matching visual spec. Music, reminder, rectangular timer, and checklist use their assigned strict templates; do not borrow them for other content types.
2. Map selected data and supported actions/state into the declared slots. Check taxonomy-to-component naming, such as `play_pause_action` to the supported playback control input.
3. Preserve required regions, control slots, fixed typography, and dimensions. Do not rearrange or add slots.
4. Verify that all selected information fits and all required inputs are available. Return incompatibilities to the owning policy stage; do not silently omit information or invent action behavior.

### Checklist full-face exception

Use the locked `checklist_full_face` visual spec, including its title/list structure and component-owned time/date slots. Its frame is 205 × 251 at the origin. Model-authored content fills supported title, items, and checked/completed state. Selection owns standalone eligibility; ordinary face placement and external time/date stacking do not apply.

> **REVIEW_REQUIRED RECT-01 — Fixed-template overflow and checklist access.** Full wrapping can exceed fixed music/reminder/timer slots. Checklist taxonomy calls for a scrollable list, while RectangularWidgets.tsx currently slices to four items. Review full-content access and overflow behavior for each template. Do not shrink fonts, silently cut items, or enlarge locked geometry as an undocumented repair.

## 2B. Generated-composition design path

1. Use `generated_rectangular_widget` and generated-rectangular-widget-schema.json for content assigned that representation.
2. Map selected fields to approved blocks: `text`, `inline_small_icon_text`, `big_icon_text_group`, `number_text_lockup`, and `edge_progress_bar`.
3. Establish the primary value/message, identifying context, and supporting selected details using the approved typography roles. Use supported horizontal/vertical composition, gaps, padding, and block limits.
4. Wrap all text and calculate required height from actual content, icons, padding, gaps, and edge bars. Check all lines remain visible.
5. Validate against the schema and report unsupported selected information instead of inventing blocks or controls.

For `last_message`, sender/timestamp may use the inline message icon; message content must be plain text without an icon. Plain text uses `unit`; inline icon text uses `textUnit` with body, body_emphasis, or secondary. Semantic icons must come from material-symbols-registry.json.

> **REVIEW_REQUIRED RECT-02 — Generated controls are not represented by the grammar.** IoT may select `control_action`, but the five approved blocks contain no general action-control block. Radio-button primitives in the reference do not authorize a new generated block. Review the required schema/renderer capability or supported representation before claiming such a widget can render.

## 3. Map and format content

Keep required and selected optional fields represented. Equivalent compact formatting is allowed; removing groups, selected details, or controls is a content-scope change governed by policy. Do not turn an action into decorative text and call it a control. Follow the derived-metric guidance below for labels and bounded fills.

> **REVIEW_REQUIRED RECT-03 — Semantic-to-template field coverage.** Catalog required/optional fields do not fully match taxonomy requirements (for example reminder completion action, timer total duration/actions, and checklist title/completed state/action). Review explicit adapters and visible/action coverage. Preserve existing output fields; do not invent schema properties to bridge the mismatch.

## 4. Resolve dimensions and overflow

Regular rectangles are full width. Visual specs own exact typography, geometry, padding, and strict-template sizes; the generated schema owns supported fields and numeric bounds. Preserve 16px padding except the attached edge of an edge progress bar, which uses zero padding. Compute wrapped-content height before whole-face placement; outer clipping is not permission to hide required content.

Do not truncate, ellipsize, line-clamp, emit `maxLines`, or shrink fixed typography. Try supported internal arrangements that preserve selected information. If none fit the permitted contract, report the incompatibility. Whole-face recovery follows the selection policy's ordered `fitFallback`; do not independently remove optional blocks.

> **REVIEW_REQUIRED RECT-04 — Height contracts disagree.** The previous runtime prose allowed generated heights 108–251px, while generated-rectangular-widget-schema.json permits 108–180px. Review the intended supported range and align schema, validation, renderer, and examples together. For current output, obey the schema; a required height outside its range is an incompatibility, not permission to clamp or clip. The selection policy's 108px branch and generation guide's two-rectangle budget are separate composition decisions.

## 5. Apply the supplied theme

Consume the accent pair and `surfaceMode` assigned by generation guide. Apply those roles through visual specs: dark background/white foreground for accent_surface, black background/light-accent foreground for black_surface, with the prescribed secondary opacity. Keep geometry unchanged. Always emit the supported surfaceMode field.

> **REVIEW_REQUIRED RECT-05 — Surface assignment conflict.** The catalog restricts two rectangles to one accent_surface, but generation guide permits either surface for the additional rectangle. Generation guide owns assignment. Review and align the catalog and runtime checks; local templates must not independently choose a competing assignment. Also reconcile the catalog's off-white secondary token with the guide's white-at-60% contract.

## 6. Validate and hand off

Check selected-field/action coverage, strict-template preservation or generated-schema validity, full text visibility, metric meaning, supported icons, and required dimensions. Hand the complete internal design to face composition, which supplies final placement/theme without changing geometry. Do not emit unsupported reasoning or diagnostic fields.

Review markers below and above identify editorial decisions, not extra output fields or permission to relax contracts. See ../widget-guidelines-review.md for the shared index.

## Detailed component and composition reference

The retained reference below documents existing units, patterns, and strict-template anatomy. Catalogs own component inputs; visual specs own exact fixed tokens; the generated schema owns allowed blocks/fields. Repeated token tables are reference copies, not independent authorities. The design procedure above governs content preservation and stage boundaries.

> **REVIEW_REQUIRED SHARED-01 — Repeated specification ownership.** Markdown/YAML, catalog JSON, visual specs, and TSX still repeat some tokens and guidance. Audit parity and derive or remove duplicate copies in a follow-up; do not change fixed visual tokens during this structural pass. Some generated-unit/pattern definitions currently exist only in this reference, so retain them until an authoritative structured replacement exists.

## Atomic Units

| Unit | Role | Size | Typography | Color | Notes |
| --- | --- | --- | --- | --- | --- |
| Numbers | Primary numeric value | Intrinsic to text content | SF Compact Regular, 40px, 42.5px line height | #FFFFFF | Use for the dominant data value in a rectangular widget. |
| Body Emphasis | Emphasized body text | Intrinsic to text content | SF Compact Semibold, 19px, 21.5px line height | #FFFFFF | Use for short labels, status phrases, or secondary values that need emphasis. |
| Body | Standard body text | Intrinsic to text content | SF Compact Regular, 19px, 21.5px line height | #FFFFFF | Use for normal readable text at the main body scale. |
| Secondary | Muted supporting text | Intrinsic to text content | SF Compact Regular, 19px, 21.5px line height | rgba(255, 255, 255, 0.6) | Use for captions, secondary labels, timestamps, or lower-priority supporting information. |
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
    color: "rgba(255, 255, 255, 0.6)"

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
    symbol_color: resolved by surfaceMode

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
    symbol_color: resolved by surfaceMode

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
        color: resolved by surfaceMode
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
- Never truncate, ellipsize, or line-clamp rectangular-widget text. If text does not fit on the current line, wrap it to the next line below.
- Use equivalent compact formatting, a vertical composition, or a taller permitted frame so every wrapped line remains visible. Removing selected fields or groups requires an explicit content-scope revision under selection policy.
- Do not use `maxLines` or any equivalent clamping hint in `generated_rectangular_widget` composition.
- Keep text vertically centered in its layout region.
- Do not synthesize additional text styles unless a future guideline explicitly adds them.
- Preserve the distinction between regular, semibold, and muted secondary text.

## Color Rules

```yaml
colors:
  surface_mode:
    black_surface:
      widget_background: "#000000"
      primary_text: widget_accent_color.light
      secondary_text: widget_accent_color.light at 60% opacity
      material_symbol_icon: widget_accent_color.light
      secondary_icon: widget_accent_color.light at 60% opacity
      progress_bar_value: widget_accent_color.light
    accent_surface:
      widget_background: widget_accent_color.dark
      primary_text: "#FFFFFF"
      secondary_text: "rgba(255, 255, 255, 0.6)"
      material_symbol_icon: "#FFFFFF"
      secondary_icon: "rgba(255, 255, 255, 0.6)"
      progress_bar_value: "#FFFFFF"
  icon_container: none
  progress_bar_base: "rgba(242, 244, 252, 0.1)"
  radio_unselected_stroke: "#9BA0AA"
  radio_selected: "#F2F4FC"
```

- Every rectangular widget must declare `surfaceMode` as `black_surface` or `accent_surface`.
- Consume the `surfaceMode` role assigned during face composition by `generation-guide.md`; this document defines its internal rendering.
- On `black_surface`, text, Material Symbols icons, and progress-bar values use the light role of `widget_accent_color`; secondary text and icons use the same light accent at 60% opacity.
- On `accent_surface`, the widget background uses the dark role of `widget_accent_color`; text, Material Symbols icons, and progress-bar values use white; secondary text and icons use white at 60% opacity.
- Icon containers have no fill.
- `widget_accent_color` is assigned exclusively by `generation-guide.md`; consume its resolved theme inputs.
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
  symbol_color: resolved by surfaceMode
  accent_source:
    owner: generation-guide.md
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
      rule: Render the selected Material Symbols icon in the light widget_accent_color on black_surface, and in white on accent_surface.
    - id: accent-owned-by-content-type
      strictness: must
      rule: Use widget_accent_color resolved by generation-guide.md; do not determine it inside the local composition pattern.
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
      - id: icon-small-text-wraps
        strictness: must
        rule: Paired text must wrap below within the available text column when needed; do not truncate with an ellipsis.

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
      - id: number-lockup-wraps-secondary
        strictness: must
        rule: If the unit label or qualifier cannot fit on the number's baseline, wrap the qualifier to a new line below instead of truncating.

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

These templates are stricter than the general composition patterns. When `widget-selection-policy.json` maps a widget content type to one of these templates, the agent must preserve the template structure and only substitute content, selected icons, control state, progress values, and `widget_accent_color`.

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
          content: Reminder
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
      - id: reminder-no-time
        strictness: must
        rule: Do not render due time, date, or timestamp text inside the reminder widget.

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
        width: 50
        height: 22
        unit: body
        align: right
        font: SF Compact Regular 19pt
      title:
        x: 16
        y: 42
        width: 173
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
      - id: checklist-full-face-template
        strictness: must
        rule: When selected by widget-selection-policy.json, preserve this full-face component structure.
      - id: checklist-locked-figma-component
        strictness: must
        rule: Preserve the Figma component geometry exactly: widget x=0 y=0 width=205 height=251, date x=16 y=16 width=70 height=22, time x=139 y=16 width=50 height=22, title x=16 y=42, list x=6 y=71 width=193.
      - id: checklist-fill-content-only
        strictness: must
        rule: The AI may fill title, items, and checked/completed state only. It must not invent a separate watch-face time/date layout around the checklist.
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


## Derived metric rendering

Shape selection and fixed-template requirements remain owned by `../widget-selection-policy.json`. Read formulas and data meaning from `../widget-content-types.json`.

| Content / metric | Rectangular representation |
|---|---|
| Workout: `time_progress`, `calorie_progress` | Linear progress bar, with actual values and targets in labels when shown. |
| Activity summary: `sitting_time_progress`, `standing_time_progress`, `walking_time_progress` | Linear progress bars comparing accumulated daily time with the corresponding daily goal. Label sitting as limit used; standing and walking as target reached. |
| Timer: `remaining_progress` | Linear progress bar for remaining time, full at 1 and empty at 0, within the required timer template. |


Preserve required and selected optional metadata. Do not add available but unselected fields or remove selected fields independently. Rendering must not change the underlying derived metric. Keep ratios above 1 intact even when a bounded visual fill is capped. A completed workout must not be drawn as 100% solely because it ended.

Use `min(1, max(0, ratio))` for bounded bar fill. Preserve the actual ratio in percentage labels: a ratio of 1.5 is labeled “150% of daily limit” for sitting or “150% of daily goal” for standing/walking, even when the bar is full. Exceeding the sitting limit must not be presented as positive goal achievement. Timer progress already has a defined range of 0–1; use it directly, decreasing as the timer counts down.

When the denominator is missing or nonpositive, show available raw values without a derived bar or percentage. Do not invent progress or substitute zero. Follow existing fixed-template rules and do not add new slots to a locked template.

For upcoming events, format `time_to_leave` in the user's local timezone as a departure time, for example “Leave at 2:30 PM,” rather than as a travel duration.
