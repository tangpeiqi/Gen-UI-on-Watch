# Generation Guide

This is the sole owner of the overall watch-face composition: widget placement, time/date typography and layout, visual hierarchy, and color-theme selection. Runtime workflow and document ownership are defined in [README.md](README.md).

## Inputs and boundaries

- Begin face composition with the widgets already selected by widgetSelectionPolicy and fully designed using the applicable circular or rectangular widget resources. Each widget must have its content, internal composition, component/template, variant, and required dimensions established.
- Widget ranking, count, eligibility, shape, expansion, and strict-template selection belong exclusively to widget-selection-policy.json. Do not make new selection decisions during face placement.
- Widget-internal typography, padding, icons, controls, geometry, and rendering tokens belong to the circular and rectangular widget resources. Preserve their completed designs; do not shrink their fonts or alter fixed tokens to make the face fit.
- Resolve a widget's required height from its full content before placing time/date. Flexible widgets may expose permitted sizing bounds; do not stretch them beyond those bounds. If the face cannot fit, return to widget design to simplify optional detail or to selection under widgetSelectionPolicy, then compose the face again.
- The face supplies the overall color theme and semantic accents. Widget specs apply those inputs internally to their surfaces, text, icons, and gauge parts. Theme application must not change widget geometry or content.
- checklist_full_face owns its entire fixed layout, including its time/date slots. Use the rectangular component contract instead of the general placement, time/date, prominence, and widget/date-overlap rules below.
- Hard constraints take priority over visual preferences. Examples illustrate structure; use the request's actual time and metadata.

## Canvas, hierarchy, and widget placement

- Use the 205 x 251 canvas and its 54px rounded watch mask. All visible content must fit the mask. Widgets remain readable and useful.
- Place all completed widgets before placing time and date.
- Circular widgets must always sit at watch-face corners or edges. Leave exactly 6px between each circular frame and every canvas edge to which it is aligned. Never place a circular widget freely in the interior.
- Do not alter finalized circular widget sizes: no resizing, scaling, or stretching during face composition. If a composition cannot fit, return to the owning selection/widget-design stage.
- With one or two circular widgets and no rectangular widget, place each circle at any of the four watch-face corners. Choose distinct corners for two circles and preserve non-overlap and mask fit.
- With two circular widgets and a rectangular widget, arrange the circles side by side in one horizontal row against the top or bottom watch-face edge. Preserve their sizes and keep the row clear of the rectangle.
- With three circular widgets, arrange them vertically in one column against the left or right watch-face edge. Distribute the column over the watch-face height without overlap; align the first circle to the top edge and the last circle to the bottom edge. Do not arrange three circles horizontally.
- Rectangular widgets attach directly to the top or bottom watch-face edge: top-aligned y=0; bottom-aligned y=251-height. Their finalized full-width frames use x=0. With two rectangles, place one at each edge. Do not shrink fixed typography or clip required content to force the selected widgets to fit.
- With two rectangular widgets, time is required and date may be omitted to preserve time legibility. In all other layouts, keep the date unless the selected full-face component provides its own date slot.
- Place time/date opposite the visual weight of widgets when possible. Favor useful hierarchy and balanced negative space over merely packing boxes into the canvas.
- Widgets render above time/date: widget layer is top, time/date layer is bottom, and IDs appear in the matching layers.top/layers.bottom arrays.
- Widgets must not overlap other widgets. Outside checklist, date must not overlap widgets; time/widget overlap is permitted only up to 10px and must preserve legibility.

## Time and date (except checklist)

Follow these steps in order. checklist_full_face retains its component-owned slots and typography.

### 1. Apply fixed typography and date format

- Use SF Compact for all time and date text.
- When shown, date uses Regular 19pt and a three-letter uppercase weekday followed by the numeric day, such as SUN 2.

### 2. Identify available regions

- Find the space inside the 205 x 251 watch mask not occupied by the completed widgets. Reserve room for time and, when shown, its date stack. With two rectangles, use the middle band between their finalized frames.
- Available regions are layout space, not final text containers. Date must not overlap widgets; time may overlap widgets by at most 10px when legibility is preserved.

### 3. Choose the time mode from the region's shape

- Use single_line for one combined time container for landscape or square region with width similar to or bigger than its height.
- Prefer split_hour_minute, with hour above minute, for portrait regions taller than they are wide. Typical cases include one S or M circle without a rectangle, two S or M circles in opposite corners, or three S circles in a column along one side.
- Use segmented_digits when fitting tall numerals into a narrow region would require substantial digit overlap through negative letter spacing. Give each digit and visible separator its own container, composed as one time group; preserve reading order and legibility. Mild spacing adjustments may remain single_line.

### 4. Place and anchor time together with date

- With two rectangles, place time in the reserved middle band and center it horizontally; this takes precedence over the canvas-edge anchoring rules below. If date is omitted, do not reserve a date slot or apply date-stacking rules.
- For combined time using a full-width region, choose top or bottom alignment and center it horizontally. For non-full-width time, including individual hour/minute containers, choose corner anchoring. Anchor segmented_digits as one group.
- Apply external padding from each anchored canvas edge: 16px when the fitted time width is less than 105px, otherwise 0px. For segmented_digits, use the group's width. Move text farther inward only where the rounded mask requires it; padding stays outside text bounds.
- When date is shown, stack it vertically with one referenced time container at zero gap. If time owns the top/bottom anchor, put date inward: below top-anchored time or above bottom-anchored time. Alternatively, corner-anchor date with 16px padding from both adjacent edges and put its referenced time container inward.
- When date is shown, set date.stackedWithTimeContainerId, stackGap 0, and edgePaddingWhenStackedFromEdge 16. Keep date clear of widgets.

### 5. Finalize time styling and fit the text bounds

- Tune font size and letter spacing together to fill the allocated region. Negative spacing can support taller numerals in narrow space; use the largest legible size that fits both dimensions without stretching glyphs. If substantial overlap becomes necessary, return to step 3 and use segmented_digits.
- Split hour/minute containers share font weight, letter spacing, and color treatment; their font sizes may differ. Coordinate all time styling with the face's color theme.
- For overlapping segmented digits, use intentional front-to-back ordering and, when permitted by the Color theme rules, coordinated per-digit horizontal gradients to distinguish crossing strokes. Preserve consistent font family, weight, and palette. Reference: [overlapping time digits](https://www.figma.com/design/3biDt7StqMPp22ws1FVx3v/2026-Projects?node-id=551-422). Emit only supported style fields; gradients require schema and renderer support. Use supported fill or outline treatments where appropriate.
- Fit each time container tightly to its final visible text width and height, including letter spacing and outline stroke. Add no internal padding or line-height whitespace. time.frame is the bounding union of time.containers.
- Confirm the final bounds still satisfy the chosen anchors, the 105px padding threshold, date stacking, mask fit, and overlap limits. If styling changes the required padding or fit, revisit placement before returning the layout.

## Color theme

### 1. Use the content-type accent colors

Use the exact light/dark accent pair below for each content type; do not substitute other hues. The selected color mode determines whether a widget uses its own pair or shares the highest-ranked content type's pair.

| Content type | Light accent | Dark accent |
| --- | --- | --- |
| weather | #3CD3FE | #004559 |
| reminder | #FFD600 | #594B00 |
| map_navigation | #6D7CFF | #000959 |
| iot_control | #00DAC3 | #005950 |
| last_message | #0091FF | #003359 |
| workout / activity_summary | #FF375F | #590012 |
| upcoming_event | #00D2E0 | #005459 |
| timer | #FF9230 | #592A00 |
| heart_rate | #FF4245 | #590001 |
| sleep_summary | #DB34F2 | #4E0059 |
| music_control | #30D158 | #004D13 |
| checklist | #B78A66 | #592800 |

### 2. Choose the color mode

- One visible content type: use mono_tone.
- More than one visible content type: balance mono_tone and multicolor roughly equally across requests.

### 3. Assign colors within the selected mode

- **mono_tone:** Use the sole visible content type's accent pair. If multiple types are visible, use the pair belonging to the highest-ranked visible type from widget-selection-policy.json. Apply that shared theme to every widget; time and date use its light accent.
- **multicolor:** Give each content type its own accent pair. Widgets of the same type share the same accent treatment. Time and date use white.

### 4. Apply light accents and rectangular surface roles

- Circular widgets always use the assigned light accent; the dark accent is reserved for rectangular accent surfaces.
- Assign accent_surface to the most important rectangle. For each other rectangle, choose accent_surface or black_surface based on hierarchy, contrast, and overall visual balance. Widget specs implement the following surface contract without changing widget geometry:

| Rectangular surface | Background | Primary text/icons | Secondary text/icons |
| --- | --- | --- | --- |
| accent_surface | Assigned dark accent | White, 100% opacity | White, 60% opacity |
| black_surface | Black | Assigned light accent, 100% opacity | Assigned light accent, 60% opacity |

### 5. Choose solid color or gradient for time

- When time occupies at most one third of the watch face, use a solid color for its fill or stroke. When it occupies more than one third, a gradient is permitted. Assess the combined area of the fitted time containers, excluding unused available space and counting overlapping regions only once.
- For non-segmented time, gradients run top to bottom, from 100% opacity at the top to 0% at the bottom. Split hour/minute containers use the same direction and treatment.
- For segmented_digits, per-digit gradients run left to right, from 100% opacity on the left to 0% on the right. Preserve contrast and reading order where digits overlap.
- Gradients fade the time color assigned by the selected mode; they do not introduce new hues. Date keeps its assigned solid color. Emit only gradient fields supported by the schema and renderer; until those are available, use the supported solid fill or stroke treatment.

## Output and final validation

- The supplied layout schema owns output fields. Return layout JSON and content; the renderer owns visual implementation. Always include colorSystem, layers, and time.containers.
- Use time.value/time.style and, when date is shown, date.value/date.style; never time.text, date.text, time.fontSize, or date.fontSize. time.frame is the bounding union of its containers.
- Do not output top-level composition, deferredContentTypes, reasoning, or notes. Widget composition fields follow the rectangular grammar.
- If date is omitted, do not include a visible date element or its ID in the rendered layers; the schema must support this optional-date case.
- Recheck schema, mask fit, text bounds, layering, legibility, and permitted overlap for the whole face. Respect the selection policy and each completed widget's contract.
- If previousValidationFailures is present, repair those exact failures without introducing new ones. Return to the owning stage when the repair changes selection or widget design.
