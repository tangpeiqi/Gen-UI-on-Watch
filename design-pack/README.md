# Design pack ownership

Use one owner for each decision. generation-guide.md is the sole watch-face layout guide; selection and widget-internal instructions live in their own resources.

| Owner | Responsibility |
| --- | --- |
| `widget-selection-policy.json` | Rank content, select widget count and types, decide circular/rectangular shapes, apply eligibility, expansion, size constraints, and strict-template overrides. |
| `widget-content-types.json` | Semantic data and available metadata, with a Markdown companion for explanation. |
| `circular-widget-guidelines/` | Design selected circular widgets: component/property variants, internal layout, typography, geometry, and visual tokens. |
| `rectangular-widget-guidelines/` | Design selected rectangular widgets: template internals, block grammar, content wrapping, dimensions, typography, and visual tokens. |
| `generation-guide.md` | Place completed widgets; select and fit time/date; establish hierarchy, spacing, mask fit, layering, and the whole-face color theme. |
| `layout-schema.json` | Complete layout output shape. |
| `sample-layouts.json` | Valid complete fixtures; the runtime prompt reuses the first fixture. |
| `scripts/time-layout.mjs` | Shared time fitting. Server metrics are estimated; the browser measures the resolved font for final rendering. |

## Runtime workflow

Follow these stages in order within each generation request; they are not separate API calls:

1. **Select widgets.** Read widgetSelectionPolicy first, using live/past context and widgetContentTypes. Rank content and determine the retained content types, widget count, circular/rectangular shapes, strict templates, and applicable size constraints. Selection decisions belong only to that policy.
2. **Design widgets.** Read the matching widgetDesignResources. Populate real available data and semantic icons, resolve component/property variants or rectangular blocks, and finalize each widget's internal design and required dimensions using its catalog, grammar, and visual specs. Preserve strict component internals. Every widget must be concrete and complete before face composition.
3. **Compose the watch face.** Apply generationGuide to the completed widgets. Place widgets, reserve date space, size and place time/date, establish hierarchy/layers, and select the face theme and semantic accents. Widget specs apply theme inputs internally without changing the completed geometry.
4. **Validate the result.** Check the layout schema, selection policy, widget contracts, and face rules. If the face does not fit, return to widget design to simplify optional detail or to selection according to its policy; then repeat face composition and validation. Never silently shrink fixed widget typography or substitute lower-ranked content during placement. Checklist's component-owned full-face slots remain fixed.

## Boundary contracts

**Color:** generation-guide.md owns theme selection, semantic accent pairs, palette coordination, and time/date colors. Widget resources own how supplied theme inputs apply to surfaces, text, icons, controls, and gauges. They do not select a competing face theme.

**Dimensions:** Widget design establishes content, internal composition, and required dimensions before face layout. Flexible widgets expose their permitted sizing bounds and full-content height requirements. Face composition positions those completed widgets; infeasible combinations return to an earlier stage rather than clipping content or inventing new font sizes.

## Time styling contract alignment

The generation guide permits negative letter spacing and intentional overlap between individual digit containers, with coordinated per-digit gradients as a design option. Negative letterSpacing is already represented in the current schema and renderer. The current contract still anchors segmented containers independently and enforces shared treatment; the fitter reserves space between time parts and the renderer has no time-gradient fields. Before enabling the full segmented effect, align schema, validation, fitting, and rendering for group anchoring, intentional digit overlap, per-digit gradients, and explicit digit stacking order. Do not invent unsupported output fields during generation.

## Editing and verification

1. Update the owner of the decision. Reference another owner instead of repeating its rules.
2. Edit fixed widget tokens in visual specs. Circular prompt/validator text bounds are projected by scripts/design-contracts.mjs.
3. Keep complete examples valid without repair. Update runtime resources whenever their owner changes.
4. Run `node scripts/verify-layout-contracts.mjs`, `node scripts/verify-design-pack.mjs`, and `node scripts/verify-time-layout.mjs`.
5. Restart the local server after design-pack edits; it loads resources at startup and hashes the supplied prompt resources.

These checks do not call the live model. Assess generation quality separately through repeated contexts, first-attempt compliance, retries, and rendered output. Runtime validators and fallback algorithms still implement rules explicitly; these documents are not a general rule compiler.
