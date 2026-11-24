# Widget selection policy review

Promotion update, 2026-11-20: the reviewed policy is now official at [widget-selection-policy.json](../widget-selection-policy.json), version 2.0.0. The separate draft has been removed. The retired v1 policy is historical only. Runtime policy readers now consume the v2 structure. The terminal fit-fallback decision remains open; promotion does not invent a sixth recovery step. The remainder records the historical review and is not a competing policy.

Reviewed 2026-11-03 against `widget-selection-policy.v1.retired.json` (1.2.0), the then-current draft, taxonomy, generation guide, and widget catalogs. This is a policy comparison and example review, not runtime activation or a rendered-layout test. The phrase “privacy review” is interpreted in the conversation's context as the final policy review; this is not a privacy/security audit of the application.

## Old policy coverage

| Old section | Draft disposition |
| --- | --- |
| `schemaVersion`, `purpose`, `sourceDocuments` | Replaced by draft metadata and explicit ownership. |
| `globalRules`: maximum three widgets | Preserved in `rendering.compositionLimits`. |
| `globalRules`: semantic before shape | Preserved by the five decisions and ranking rules. |
| Strict overrides and no template borrowing | Preserved in `rectangleRequirements`; checklist precedence runs first. |
| Circular whitelist | Intentionally expanded to include `activity_summary` and `sleep_summary`. |
| Message intent primary | Generalized to explicit-intent priority; message previews remain rectangular-only. No keyword priority override is necessary. |
| Maximum three semantic types | Preserved in content scope, with priorities 1–4 filtering and one priority-5 fallback. |
| `selectionSequence` | Replaced by the five decisions. Ranking remains intact; third-ranked type is dropped when two of three require rectangles. Unlike the old rule, both retained types are not forced into rectangles. |
| Emit only retained widgets and log omissions | Final layout includes only retained widgets and schema-supported fields. Omission logging is deferred to implementation; this draft does not require an internal diagnostic mechanism. |
| `circularEligibility` | Preserved with the expanded whitelist and a preference for circles when rectangles are not required. |
| Generic rectangular representation | Restored explicitly: non-strict rectangular content uses `generated_rectangular_widget` under its schema. |
| `circularSelectionDelegation` | Components and property variants delegated to widget resources. Size decisions now belong to the policy scenarios. The old passive-timer M-or-L solo exception is superseded by one circle → L. |
| `compositionRules` | Preserved and refined by the 108px limit, fixed circle sizes, and checklist rank handling. |
| `strictTemplateRules` | Music, reminder, checklist, and rectangular timer keep strict templates; no custom replacements. Circular timer component/variant is delegated. |
| `generativeContentRules`: workout | Preserved through general selected-information rules: targets and progress do not alone require rectangles. Gauge choice delegated. |
| `generativeContentRules`: weather | Explicitly retired by user decision; normal scope, expansion, size, and synthetic-data rules apply. |
| `generativeContentRules`: IoT | Selected controls/details determine shape. Old keyword-based forcing (e.g. merely saying “thermostat”) is superseded by the agreed general rule. |
| `generativeContentRules`: timer | Selected labels, controls, or creation/setup require the strict rectangle. Merely being a cooking/task timer does not independently force a rectangle. |
| `contentExpansionRules` | Preserved group relationships and optional expansion. Multiple-circle mode now requires exactly one circle per selected group. Scope revisions are explicit. |
| `semanticInputs` | Distributed across eligibility, ranking, and scope; no second competing workflow. |
| `contentRenderingRules` | Selection constraints preserved/generalized as above. Checklist geometry and widget internals delegated to widget resources. |
| `deterministicExamples` | Replaced with four worked decision traces, including height branches and checklist variants. They are illustrations, not new constraints or final layout output. |

## Corrections made during review

- Replaced stale migration and ranking-handoff text that claimed already-defined limits were pending.
- Added shared document-ownership and supported-output constraints.
- Restored the explicit generated-rectangle rule and strict-template protection.
- Added rectangular visual specs and generated grammar to delegated resources.
- Connected any successful two-rectangle conversion to the one-rectangle branch so a rectangle above 108px gets an S companion, not an unspecified size.
- Replaced incremental examples with traces that identify candidate priorities, selected groups and fields, rectangle requirements, heights, final counts/shapes/sizes, and fallback results.

## Important interactions and remaining decisions

1. **Terminal fit failure remains unresolved.** The agreed five steps do not specify what to do when the top type's required or goal-essential content still cannot fit. Do not silently invent a sixth step, shrink fixed typography, or discard that essential content. A failed-generation result versus a further explicit simplification rule still needs a product decision.
2. **Two genuinely required rectangles cannot convert without reassessment.** With unchanged selected fields and constraints, a required rectangle cannot become a legal circle. The conversion branch is a verification opportunity; if the requirement still holds, the lower-ranked type is dropped. This preserves the user's conditional conversion rule rather than assuming circular eligibility alone is enough.
3. **Existing fixed templates exceed 108px.** The current catalog gives music 140px, reminder 127px, and timer 139px. Therefore a higher-ranked one of these templates excludes a second required rectangle. A mixed layout can have only one S circle. The old reminder-plus-two-circles example was incompatible with this rule.
4. **Size and count legality do not establish physical fit.** Examples use clearly stated hypothetical design measurements/fit-check results. No rendered screenshot or geometric validation has been run for them. Actual designs still require widget validation and whole-face validation.
5. **Activation is a separate coordinated change.** Runtime prompts/validators and widget resources still contain old assumptions, including narrower eligibility, old timer/weather behavior, missing-observation handling, and time anchoring. The provider also contains old data-handling language. Do not load both policies as competing authorities. Reconcile those dependencies when activating the reviewed draft.
6. **Synthetic provenance is internal context.** Generated demo values must remain distinguishable from supplied observations through the decisions. The policy does not introduce unsupported provenance or reasoning fields into final layout JSON. A concrete diagnostic representation remains an implementation concern.

## Example scope

- **Rank preservation and height boundary:** top-three rectangle count drops the third type, then the surviving rectangle's height selects M or S companions. Expansion is tied to exact selected groups.
- **Weather under general rules:** available forecast/observations feed selected groups; priority-5 background is excluded; two weather circles use M rather than a weather-only exception.
- **Checklist precedence:** first-ranked checklist owns the face; second-ranked checklist is dropped before rectangle counting so the third candidate is not accidentally lost.
- **Fit recovery:** preserve top intent, try placement, drop the lower-ranked type, skip inapplicable recovery steps, then remove only a nonessential optional top-type field.

The all-priority-5 fallback remains specified by the rule but no longer has a separate repetitive example. The examples illustrate contextual rankings, not deterministic scores for the named content types.
