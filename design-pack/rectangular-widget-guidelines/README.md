# Rectangular widget guidelines

Design already-selected rectangular content into complete widgets. Begin with [the design guide](rectangular-widget-composition-guidelines.md), then follow its strict-template or generated-composition path.

| Resource | Responsibility |
| --- | --- |
| [Design guide](rectangular-widget-composition-guidelines.md) | Design procedure, content mapping, wrapping, required height, and handoff; retained detailed composition reference |
| [Catalog](rectangular-widget-catalog.json) | Strict templates, supported input slots, and fixed contracts |
| [Visual specs](rectangular-widget-visual-specs.json) | Exact strict-template geometry and shared visual tokens |
| [Generated schema](generated-rectangular-widget-schema.json) | Supported generated blocks, fields, and bounds |
| [Renderer](RectangularWidgets.tsx) | React implementation of strict templates |

Selection policy assigns shape/template and owns recovery. Content types define semantic fields/formulas. Generation guide assigns placement/theme. See the [shared ownership and content contract](../README.md).

Open issues use stable `REVIEW_REQUIRED` IDs in the guide and [review index](../widget-guidelines-review.md). The runtime loads the design guide directly.
