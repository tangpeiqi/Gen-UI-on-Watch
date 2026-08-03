# AI UI Generation Pipeline Plan

## Purpose
Build a server-side AI generation pipeline for the web-based Apple Watch UI simulator. The agent should turn user context and design-pack rules into structured watch-face layout JSON, then rely on deterministic validation and approved frontend components for rendering.

The AI should not generate React, HTML, CSS, SVG, arbitrary icon markup, or executable code. It should generate only a constrained layout object that matches `design-pack/layout-schema.json`.

This plan follows the `Gen UI Pipeline` Figma diagram in `2026 Projects` at node `632:2201`. For each generation, the live input comes from the Context panel in `index.html`, the generated watch face renders into the `Gen Watch Face` container in the Preview panel, and every intermediate agent decision should be inspectable in the Debug panel.

## Pipeline Contract

```txt
User provides live context in index.html
        ↓
Pipeline combines live context with demo pseudo context
        ↓
Agent selects useful semantic content types, max 3
        ↓
Agent chooses widget count, shape, component, and variant
        ↓
Agent populates widget data and semantic Material Symbols icon tokens
        ↓
Agent generates constrained watch-face layout JSON
        ↓
Schema validator checks JSON shape
        ↓
Rule validator checks watch-face constraints
        ↓
Frontend renderer maps JSON to approved components in Gen Watch Face
        ↓
Optional: save generation and feedback for iteration
```

The frontend renderer owns all visual implementation details. The model chooses semantic content types, layout strategy, widget shape, component variants, content bindings, and semantic icon tokens within the approved schema.

## Agent Decision Flow

Each generation should produce or log these intermediate decisions before a final layout reaches the renderer:

1. **Read live context:** collect `timeOfDay`, `location`, `activity`, and `goal` from the Context panel in `index.html`.
2. **Load past context:** combine the live context with `demo-data/pseudo-context.md` and `demo-data/pseudo-context.json` so the agent has a larger fictional user picture.
3. **Select semantic content types:** use `design-pack/widget-content-types.md`, `design-pack/widget-content-types.json`, and `design-pack/watch-face-generation-rules.md` to decide which content types are useful. Select no more than three.
4. **Choose widget count and shape:** use the selected content types, their metadata density, the content-type JSON contract, `watch-face-generation-rules.md`, `rectangular-widget-guidelines`, and `circular-widget-guidelines` to decide whether to render one, two, or three widgets, and whether each widget is circular or rectangular.
5. **Populate widgets:** use live context, pseudo context, `widget-content-types.md`, `widget-content-types.json`, and `material-symbols-registry.json` to fill required data fields and choose semantic icon tokens only.
6. **Generate layout:** use `watch-face-generation-rules.md`, circular guidelines, and rectangular guidelines to place time, date, widgets, and layers inside the 205 x 251 `Gen Watch Face` container.
7. **Validate and render:** schema validation and deterministic rule validation must pass before `index.html` renders the layout in the Preview panel.

The Debug panel should eventually show the final layout JSON plus step-level logs for content-type selection, widget-shape selection, icon selection, validation, retry, and fallback decisions.

## Design-Pack Inputs
Load the relevant design-pack files on the backend for each generation request:

- `design-pack/layout-schema.json`
- `design-pack/watch-face-generation-rules.md`
- `design-pack/widget-content-types.md`
- `design-pack/widget-content-types.json`
- `design-pack/circular-widget-guidelines/circular-widget-catalog.json`
- `design-pack/circular-widget-guidelines/circular-widget-visual-specs.json`
- `design-pack/circular-widget-guidelines/CircularGauges.tsx`
- `design-pack/circular-widget-guidelines/README.md`
- `design-pack/rectangular-widget-guidelines/rectangular-widget-composition-guidelines.md`
- `design-pack/rectangular-widget-guidelines/rectangular-widget-catalog.json`
- `design-pack/rectangular-widget-guidelines/rectangular-widget-visual-specs.json`
- `design-pack/rectangular-widget-guidelines/RectangularWidgets.tsx`
- `design-pack/material-symbols-registry.json`
- `demo-data/pseudo-context.md` when the demo uses static context
- `demo-data/pseudo-context.json` when the demo uses static context

The design pack should be compact enough to fit comfortably in the generation prompt, but strict enough that the model can select only approved components, sizes, variants, and icon tokens.

## Structured Output
Finalize `design-pack/layout-schema.json` as the only shape the model may return.

The schema should include required canvas, time, date, widget, layer, and metadata fields. It should constrain widget types with enums, cap rendered widgets at three, require fixed circular size tokens, disallow arbitrary extra properties, and define `data.icon` as a semantic registry token rather than raw icon markup. Time must expose one or more `time.containers` so combined, split, and segmented time layouts can be independently centered or edge-anchored; date must use compact `EEE d` text and declare which time container it stacks with.

Use OpenAI's Responses API with Structured Outputs and `strict: true` against `design-pack/layout-schema.json`. The prompt must instruct the model to return layout JSON only.

## Validation
Run validation in two deterministic phases before anything reaches the frontend:

1. Schema validation checks that the model returned JSON matching `design-pack/layout-schema.json`.
2. Rule validation checks project-specific constraints from `design-pack/watch-face-generation-rules.md` and related component catalogs.

The rule validator should enforce:

- all visible elements fit inside the watch mask
- no more than three rendered widgets
- circular widgets use fixed size tokens only
- rectangular widgets respect minimum height, fixed width intent, and 54px iOS-style corner treatment
- widget-time overlap stays at or below 10px
- split hour and minute typography share family, weight, letter spacing, and color treatment
- date remains secondary and is not grouped into the primary time object
- widgets use valid component variants and required data props
- icons use approved semantic tokens and match allowed content types
- text, icon boxes, and dynamic values do not collide or overflow

Invalid generations should be rejected, retried, repaired, or replaced with deterministic fallbacks.

## Material Symbols
Because the simulator is web-based, use Google's Material Symbols as the existing icon set for generated watch-face widgets. The agent should never draw, invent, inline, or generate custom SVG icons.

Add `design-pack/material-symbols-registry.json` to map project-level semantic icon tokens to official Material Symbol names:

```json
{
  "battery": {
    "materialSymbol": "battery_full",
    "allowedContentTypes": ["battery", "device_status"]
  },
  "weather_rain": {
    "materialSymbol": "rainy",
    "allowedContentTypes": ["weather"]
  },
  "calendar": {
    "materialSymbol": "calendar_month",
    "allowedContentTypes": ["calendar"]
  }
}
```

The model should output only semantic icon keys such as `battery`, `weather_rain`, or `calendar`. The validator should reject any icon token missing from the registry, any token used for the wrong semantic content type, or any icon used in a component variant that does not allow `property=icon`.

For a simple prototype, load Material Symbols in the HTML head:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0,0" />
```

For a public demo, consider self-hosting the Material Symbols font files so rendering does not depend on a runtime request to Google Fonts.

Render icons through a single approved component:

```tsx
function getMaterialSymbolName(iconToken: string): string {
  return materialSymbolsRegistry[iconToken].materialSymbol;
}

function MaterialSymbolIcon({ icon, size }: { icon: string; size: number }) {
  return (
    <span
      className="material-symbols-rounded watch-symbol"
      style={{ fontSize: size, lineHeight: 1 }}
      aria-hidden="true"
    >
      {getMaterialSymbolName(icon)}
    </span>
  );
}
```

Lock the icon style in CSS:

```css
.watch-symbol {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: "Material Symbols Rounded";
  font-weight: 400;
  font-style: normal;
  font-variation-settings:
    "FILL" 0,
    "wght" 400,
    "GRAD" 0,
    "opsz" 24;
  user-select: none;
}
```

Connect `close_gauge.icon` and `open_gauge.icon` to `MaterialSymbolIcon`, sizing the glyph according to the component's existing icon box rather than letting the model choose arbitrary icon dimensions.

## Backend Endpoint
Add a server-side endpoint such as `/api/generate-watch-ui`.

The endpoint should receive the live Context panel values from `index.html`, current time, date, and preferences. It should return either a validated layout or a deterministic fallback layout, plus logs for each agent decision step. API keys must stay on the backend and must never be exposed in browser code or committed to the repository.

For OpenAI, store the key as `OPENAI_API_KEY`.

## Model Strategy
Use `gpt-5.6-terra` as the default model for the first public demo because it offers the best expected balance of constraint reasoning, structured output reliability, latency, and cost.

Use `gpt-5.6-sol` for portfolio-quality showcase generations, final curated examples, or fallback attempts after repeated validation failures.

Use `gpt-5.6-luna` only for cheap drafts, bulk exploration, or internal eval runs where retries are acceptable.

## Build Steps
Build the live generation pipeline in this order:

1. Finalize `design-pack/layout-schema.json` as the only output shape the model may return.
2. Add `design-pack/material-symbols-registry.json` and include icon token constraints in the schema.
3. Implement a local agent-step contract for live context, pseudo context, content-type selection, widget-shape selection, widget population, layout generation, validation, and rendering logs.
4. Implement schema validation before any rule-specific validation or rendering.
5. Implement deterministic watch-face rule validation.
6. Render approved components only in the `Gen Watch Face` container on `index.html`.
7. Create deterministic fallback layouts for common valid compositions.
8. Add `/api/generate-watch-ui`.
9. Load live context, pseudo context, and design-pack inputs on the backend for each request.
10. Call OpenAI's Responses API from the backend using Structured Outputs.
11. Parse model output and run schema plus rule validation.
12. Add retry and repair logic using validation errors.
13. Log anonymized generation records for evaluation.
14. Add public demo guardrails before deployment.

For an execution-ready breakdown with per-phase deliverables and acceptance criteria, see `AI-UI-Generation-Pipeline-Phases.md`.

## Retry And Fallback
If validation fails, send the validation errors back to `gpt-5.6-terra` for one corrected JSON attempt.

If repeated attempts fail, use `gpt-5.6-sol` for a quality-sensitive fallback attempt or return a deterministic fallback layout.

Fallback layouts should cover:

- one circular widget with large time
- two circular widgets with compact time
- one rectangular widget with time above
- mixed circular-and-rectangular layouts
- three compact widgets
- API failure, timeout, invalid output, and exhausted budget states

## Logging And Evaluation
Log anonymized generation records for evaluation:

- provider and model
- prompt version
- schema version
- design-pack version or hash
- validation errors
- retry count
- accepted layout
- fallback usage
- latency
- estimated token cost
- optional user feedback

Use these records to evaluate validation pass rate, retry count, latency, cost, fallback usage, and subjective layout quality across representative watch-face prompts.

## Kimi K3 Evaluation Path
Kimi K3 should be treated as an experimental provider, not the default production model. Keep `gpt-5.6-terra` as the primary model until Kimi K3 proves better on this project's own validation and design-quality evals.

Compare Kimi K3 against `gpt-5.6-terra` using the same schema, prompt inputs, validator, renderer, fallback logic, and logging. Promote Kimi K3 only if it consistently matches or beats Terra on project-specific metrics.

Implementation notes:

1. Add a provider-neutral AI client interface so the backend can call OpenAI or Kimi without changing schema, validation, rendering, fallback layouts, or logging.
2. Store the Kimi API key server-side only as `MOONSHOT_API_KEY`.
3. Add a Kimi provider adapter that calls Moonshot's chat completions endpoint with model `kimi-k3`.
4. Use Kimi structured output with `response_format: { "type": "json_schema" }` and the same `design-pack/layout-schema.json`.
5. Use a stable `prompt_cache_key` for repeated design-pack context if supported.
6. Keep Kimi output behind the same schema validator and deterministic watch-face rule validator as OpenAI output.
7. Add a provider switch such as `AI_PROVIDER=openai` or `AI_PROVIDER=kimi`.
8. Log provider-specific results.

## Public Demo Guardrails
If the website is published online, treat it as a capped public demo rather than an unlimited generator:

- route all generation requests through the backend endpoint
- add per-user or per-IP generation limits, such as 5-20 generations per day
- set a monthly API spending cap and usage alert in the provider dashboard
- cache repeated or common contexts
- use deterministic fallback templates when the API fails, rate limits are hit, or budget is exhausted
- add CAPTCHA, sign-in, or invite-only access if abuse becomes a problem
- keep the design-pack prompt compact so each request uses fewer tokens
