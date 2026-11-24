# Widget guideline review index

Structural pass: 2026-11-24. Search `REVIEW_REQUIRED` across design-pack to locate open issues. IDs remain stable; resolve each with a decision and affected resources rather than silently deleting the note. These are editorial markers, not generation output fields. This pass reorganizes design instructions; it does not approve new components or change fixed visual tokens.

| Marker | Status | Decision / local explanation |
| --- | --- | --- |
| REVIEW_REQUIRED CIRC-01 | Open | [Circular step 3](circular-widget-guidelines/circular-widget-design-guidelines.md#3-choose-a-property-variant): sole Close Gauge icon rule versus numeric coverage |
| REVIEW_REQUIRED CIRC-02 | Open | [Circular step 4](circular-widget-guidelines/circular-widget-design-guidelines.md#4-map-selected-metadata-into-slots): supported mappings for newly eligible and nonnumeric groups |
| REVIEW_REQUIRED RECT-01 | Open | [Strict path](rectangular-widget-guidelines/rectangular-widget-composition-guidelines.md#2a-strict-template-design-path): fixed-template overflow and access to all checklist items |
| REVIEW_REQUIRED RECT-02 | Open | [Generated path](rectangular-widget-guidelines/rectangular-widget-composition-guidelines.md#2b-generated-composition-design-path): generated action/control support |
| REVIEW_REQUIRED RECT-03 | Open | [Field mapping](rectangular-widget-guidelines/rectangular-widget-composition-guidelines.md#3-map-and-format-content): taxonomy-to-template required fields/actions |
| REVIEW_REQUIRED RECT-04 | Open | [Dimensions](rectangular-widget-guidelines/rectangular-widget-composition-guidelines.md#4-resolve-dimensions-and-overflow): generated height bounds |
| REVIEW_REQUIRED RECT-05 | Open | [Theme](rectangular-widget-guidelines/rectangular-widget-composition-guidelines.md#5-apply-the-supplied-theme): surface assignment and secondary color mismatch |
| REVIEW_REQUIRED SHARED-01 | Open | [Detailed reference](rectangular-widget-guidelines/rectangular-widget-composition-guidelines.md#detailed-component-and-composition-reference): duplicated specifications and token ownership |
| REVIEW_REQUIRED SHARED-02 | Open | Selection policy `decisions.fitFallback.pendingReview`: terminal outcome after all permitted recovery fails remains undecided. Guidelines report incompatibility; they do not authorize an extra recovery step. |

Existing time styling and optional-date alignment issues remain documented in [the design-pack README](README.md). Runtime prompt/validator parity with the promoted policy is a separate alignment task; passing existing checks does not establish every new policy branch or rendered design is supported.
