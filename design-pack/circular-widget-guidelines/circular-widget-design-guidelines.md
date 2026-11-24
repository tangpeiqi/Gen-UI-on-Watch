# Circular widget design guide

Turn selected semantic content into a complete circular widget. Read this procedure before the matching catalog and visual specs. Selection policy owns content ranking, scope, shape, widget count, group allocation, size, and recovery; this guide owns component/property selection and internal design. Content types own metadata meaning and formulas. Generation guide owns placement and theme assignment.

## 1. Consume the selected content and constraints

Receive the selected content type, situation, metric groups, required and selected optional metadata, displayed details/controls, group-to-widget allocation, and assigned size. Keep related actual values, goals, units, and derived metrics together. Do not independently expand, merge, or remove groups or change size.

Preserve the shared content contract in ../README.md: available metadata is not automatically selected metadata. Use supplied eligible values and synthetic demo completion already authorized by selection policy, retaining their source meaning internally. Do not invent values, ranges, or references just to populate a component. Missing essential inputs return to content scope under the policy.

## 2. Choose the component from metric meaning

- Use `close_gauge` for directional progress or remaining fractions, including workout/activity progress and countdown. It requires valid normalized visual progress.
- Use `open_gauge` for values moving within a meaningful range, including temperature, heart rate, precipitation probability, and comparisons with a reference. Use valid bounds and measurements required by its catalog contract.
- Circular eligibility does not establish representability. If no approved component expresses all selected information, report the incompatibility to selection; do not quietly discard a field or create an unsupported component.

## 3. Choose a property variant

| Variant | Visible representation and required inputs |
| --- | --- |
| `close_gauge.text` | Center `value`, valid `progress`, optional short unit `label` |
| `close_gauge.icon` | Center semantic `icon` and valid `progress`; no numeric center slot |
| `open_gauge.text` | Center `value` and required short bottom `label` |
| `open_gauge.icon` | Center `value` and required semantic `icon` in the bottom slot |
| `open_gauge.range` | Current value, `lowLabel`, `highLabel`, and valid numeric range/measurement inputs |
| `open_gauge.offset` | Current value, `referenceValue`, and valid measurement/reference inputs |

Read the catalog for the complete input contract. Never leave a required slot empty. Choose icons from material-symbols-registry.json compatible with the content type.

> **REVIEW_REQUIRED CIRC-01 — Sole Close Gauge identification versus numeric coverage.** The catalog requires `property=icon` when this is the only widget for its content type, but that variant has no numeric value slot. Decide whether an icon and arc adequately represent selected actual/target values, or revise the component/variant rule. Until resolved, preserve the catalog restriction and report incompatible selected content instead of claiming hidden numeric data is displayed.

## 4. Map selected metadata into slots

| Selected information | Mapping guidance |
| --- | --- |
| Workout time/calorie group | Use taxonomy-derived progress for the arc; map the actual time/calories and units to supported value/label slots when using text. Preserve selected targets and report a coverage conflict if they cannot be expressed. |
| Timer countdown | Map `remaining_progress` to Close Gauge fill: full at start, empty at zero. Apply the variant coverage check to selected countdown information. |
| Weather temperature range | Map current temperature to `value`/`measuredValue`, selected low/high to range inputs and labels when valid. Do not fabricate missing bounds. |
| Heart-rate reading/range | Map `last_reading` to the current value; selected daily low/high can supply range labels/bounds when valid. A selected age-of-reading detail must also fit an approved slot. |
| Activity summary | Preserve sitting as limit used and standing/walking as target reached. Use the taxonomy-derived ratio with actual values and goals wherever supported; eligibility comes from policy, not a local rectangular-only rule. |
| Other eligible groups | Map each selected field to supported slots and verify complete semantic coverage. Eligibility alone is not a new component definition. |

Format durations, units, and references without changing their meaning. A field used to calculate an arc is not automatically equivalent to a visible numeric label. Keep actual ratios above 1 intact; clamp only bounded visual fill using `min(1, max(0, ratio))`. Percentage labels show the actual ratio. A completed workout is not automatically 100%. Timer's defined remaining fraction is already bounded.

Do not invent progress or substitute zero for missing/nonpositive denominators. If an approved representation can show the selected raw values without progress, use it; otherwise return the incompatibility to selection/content scope.

> **REVIEW_REQUIRED CIRC-02 — Coverage for newly eligible groups.** Activity summary, sleep summary, and nonnumeric status/condition groups need reviewed mappings for every selected required field, including goals, identity labels, and units. Some groups may not fit current gauge slots. Approve mappings or component additions explicitly; do not infer arbitrary gauge bounds or lose selected fields.

## 5. Verify the assigned size

Consume `circularTokens` projected from circular-widget-visual-specs.json. Use the assigned token's exact frame and internal geometry. Visual specs own font sizes, text-box widths, icon slots, and ring construction; do not independently copy or override tokens here.

Check every formatted value and label against its fixed bounds. Use equivalent compact notation only when meaning remains clear. Do not shrink text, scale the gauge, change size, or remove selected metadata to fit. An unselected optional slot may remain empty; a selected unit or detail cannot be omitted just because its slot clips.

## 6. Apply supplied theme roles

Generation guide assigns the light accent. Apply it internally through visual specs to values, text, icons, and gauge parts, preserving fixed neutral tracks. Do not select a separate face palette, dark circular accent, or independent two-hue gradient. Theme application does not change dimensions or content.

## 7. Validate and hand off

Verify selected-field coverage, semantic identity, valid metric inputs, required variant slots, fixed size, and text fit. Return the complete supported widget fields and required dimensions for face composition. Preserve provenance and coverage reasoning internally; do not add unsupported diagnostic fields to layout JSON.

Selection may request a feasibility check before finalizing a representation. Report an incompatible component/size honestly. Whole-face failures follow `widgetSelectionPolicy.decisions.fitFallback` in order; this guide does not independently remove optional content. Placement belongs to generation guide.

Review markers are editorial issues, not permission to relax a contract. See ../widget-guidelines-review.md for the cross-folder review index.
