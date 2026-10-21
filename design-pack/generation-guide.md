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
- Rectangular widgets attach directly to the top or bottom watch-face edge: top-aligned y=0; bottom-aligned y=251-height. Their finalized full-width frames use x=0. With two rectangles, place one at each edge and preserve space for time/date between them.
- Place time/date opposite the visual weight of widgets when possible. Favor useful hierarchy and balanced negative space over merely packing boxes into the canvas.
- Widgets render above time/date: widget layer is top, time/date layer is bottom, and IDs appear in the matching layers.top/layers.bottom arrays.
- Widgets must not overlap other widgets. Outside checklist, date must not overlap widgets; time/widget overlap is permitted only up to 10px and must preserve legibility.

## Time and date (except checklist)

Follow these steps in order. checklist_full_face retains its component-owned slots and typography.

### 1. Apply fixed typography and date format

- Use SF Compact for all time and date text.
- Date uses Regular 19pt and a three-letter uppercase weekday followed by the numeric day, such as SUN 2.

### 2. Identify available regions

- Find the space inside the 205 x 251 watch mask not occupied by the completed widgets. Reserve room for both time and its date stack.
- Available regions are layout space, not final text containers. Date must not overlap widgets; time may overlap widgets by at most 10px when legibility is preserved.

### 3. Choose the time mode from the region's shape

- Use single_line for one combined time container for landscape or square region with width similar to or bigger than its height.
- Prefer split_hour_minute, with hour above minute, for portrait regions taller than they are wide. Typical cases include one S or M circle without a rectangle, two S or M circles in opposite corners, or three S circles in a column along one side.
- Use segmented_digits when fitting tall numerals into a narrow region would require substantial digit overlap through negative letter spacing. Give each digit and visible separator its own container, composed as one time group; preserve reading order and legibility. Mild spacing adjustments may remain single_line.

### 4. Place and anchor time together with date

- For combined time using a full-width region, choose top or bottom alignment and center it horizontally. For non-full-width time, including individual hour/minute containers, choose corner anchoring. Anchor segmented_digits as one group.
- Apply external padding from each anchored canvas edge: 16px when the fitted time width is less than 105px, otherwise 0px. For segmented_digits, use the group's width. Move text farther inward only where the rounded mask requires it; padding stays outside text bounds.
- Stack date vertically with one referenced time container at zero gap. If time owns the top/bottom anchor, put date inward: below top-anchored time or above bottom-anchored time. Alternatively, corner-anchor date with 16px padding from both adjacent edges and put its referenced time container inward.
- Set date.stackedWithTimeContainerId, stackGap 0, and edgePaddingWhenStackedFromEdge 16. Keep date clear of widgets.

### 5. Finalize time styling and fit the text bounds

- Tune font size and letter spacing together to fill the allocated region. Negative spacing can support taller numerals in narrow space; use the largest legible size that fits both dimensions without stretching glyphs. If substantial overlap becomes necessary, return to step 3 and use segmented_digits.
- Split hour/minute containers share font weight, letter spacing, and color treatment; their font sizes may differ. Coordinate all time styling with the face's color theme.
- For overlapping segmented digits, prefer coordinated per-digit horizontal gradients and intentional front-to-back ordering to distinguish crossing strokes. Preserve consistent font family, weight, and palette. Reference: [overlapping time digits](https://www.figma.com/design/3biDt7StqMPp22ws1FVx3v/2026-Projects?node-id=551-422). Emit only supported style fields; gradients require schema and renderer support. Use supported fill or outline treatments where appropriate.
- Fit each time container tightly to its final visible text width and height, including letter spacing and outline stroke. Add no internal padding or line-height whitespace. time.frame is the bounding union of time.containers.
- Confirm the final bounds still satisfy the chosen anchors, the 105px padding threshold, date stacking, mask fit, and overlap limits. If styling changes the required padding or fit, revisit placement before returning the layout.

## Color theme

- Respect explicit requests for colorful, multicolor, monochrome, or single-color modes. Otherwise one visible semantic content type should use mono_tone. For two or three visible content types, balance mono_tone and multicolor roughly equally across requests, favoring semantic distinction or visual unity as appropriate.
- mono_tone uses one coordinated chromatic accent, with black, white, and opacity variations as support. Use the primary content type's accent theme across the face; time and date use its light accent. Widgets consume that shared theme through their component specs.
- multicolor assigns each content type its semantic accent theme; widgets of the same type share it. Time and date use white. Component-specific gauge color derivation remains owned by circular widget specs.
- Assign accent_surface to the most important rectangular widget and black_surface to any other rectangle. Widget specs own the internal background/text/icon treatment for these roles.
- Use the semantic accent pairs below as defaults. Light accents serve black surfaces and time/date; dark accents serve accent surfaces. Adjust only when user intent, meaningful status, or contrast requires it, while preserving the selected theme and per-widget consistency.

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

- Coordinate time treatments with the face theme. Fill, outline, and per-digit gradient design choices must preserve legibility; heavy numerals may use an outline when it improves openness. Only emit treatments and gradient fields supported by the supplied schema and renderer.

## Output and final validation

- The supplied layout schema owns output fields. Return layout JSON and content; the renderer owns visual implementation. Always include colorSystem, layers, and time.containers.
- Use time.value/date.value and time.style/date.style; never time.text, date.text, time.fontSize, or date.fontSize. time.frame is the bounding union of its containers.
- Do not output top-level composition, deferredContentTypes, reasoning, or notes. Widget composition fields follow the rectangular grammar.
- Recheck schema, mask fit, text bounds, layering, legibility, and permitted overlap for the whole face. Respect the selection policy and each completed widget's contract.
- If previousValidationFailures is present, repair those exact failures without introducing new ones. Return to the owning stage when the repair changes selection or widget design.
