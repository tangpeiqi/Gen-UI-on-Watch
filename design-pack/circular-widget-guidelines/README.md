# Circular widget guidelines

Design already-selected circular content into complete widgets. Begin with [the design guide](circular-widget-design-guidelines.md).

| Resource | Responsibility |
| --- | --- |
| [Design guide](circular-widget-design-guidelines.md) | Design sequence, semantic field mapping, content preservation, fit, and handoff |
| [Catalog](circular-widget-catalog.json) | Approved components, variants, data slots, and input requirements |
| [Visual specs](circular-widget-visual-specs.json) | Exact geometry, typography, text bounds, and internal visual tokens |
| [Component usage](component-usage.md) | Developer API examples, excluded from generation instructions |
| [Renderer](CircularGauges.tsx) | React implementation of the component contract |

Read the design guide first, then the relevant catalog entry and visual specs. Selection, count, shape, size, and group allocation belong to [selection policy](../widget-selection-policy.json); semantic fields and formulas belong to [content types](../widget-content-types.json); placement and theme assignment belong to [generation guide](../generation-guide.md).

Open issues use stable `REVIEW_REQUIRED` IDs in the design guide and the shared [review index](../widget-guidelines-review.md). The runtime loads the design guide, not this file or component usage examples.
