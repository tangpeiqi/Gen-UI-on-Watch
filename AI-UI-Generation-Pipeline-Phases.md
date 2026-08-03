# AI UI Generation Pipeline Phases

This breaks `AI-UI-Generation-Pipeline-Plan.md` into implementation phases that can be completed one by one. It follows the `Gen UI Pipeline` Figma diagram in `2026 Projects` at node `632:2201`.

The current baseline is `index.html`: a static web simulator with a Context panel, Debug panel, Preview panel, and a 205 x 251 `Gen Watch Face` container. Each generation starts from the Context panel and ends by rendering a validated watch-face layout inside that container.

## Phase 0: Baseline Simulator Contract

**Goal:** Keep the current static simulator stable while defining the browser surface the pipeline will use.

**Work:**
- Treat `index.html` as the first UI shell and input surface.
- Preserve the context form fields: time of day, location, activity, and optional goal.
- Preserve the Debug tabs for logs and generated layout JSON.
- Preserve the `Gen Watch Face` container dimensions: 205 x 251 with 54px radius.
- Make the Generate button the single entry point for every generation attempt.

**Done when:**
- The page still opens as a standalone HTML simulator.
- Clicking Generate captures Context panel values and updates debug output.
- The preview remains deterministic and visually intact.

## Phase 1: Agent Step Contract

**Goal:** Encode the Figma diagram as a concrete generation sequence before adding AI.

**Work:**
- Define the ordered pipeline steps:
  - read live context from `index.html`
  - load pseudo context from `demo-data/pseudo-context.md` and `demo-data/pseudo-context.json`
  - select useful content types, max three
  - choose widget count, shape, component, and variant
  - populate widget data and Material Symbols icon tokens
  - generate layout JSON
  - validate
  - render into `Gen Watch Face`
- Define a debug log shape for each step.
- Define what intermediate step data should be visible in the Debug panel.
- Define the Debug panel information split:
  - `Generated Layout JSON` shows only the final render contract plus compact metadata, such as selected content types, retry count, fallback status, provider, model, prompt version, schema version, and context source.
  - `Logs` shows the step-by-step story: context summary, pseudo-context facts used, content-type reasoning, widget-selection reasoning, icon-selection notes, generation attempts, validation summary, retries, fallback decisions, model metadata, latency, and cost estimate.
  - A future `Validation` view can show structured schema and rule validation results when validation becomes complex enough to deserve its own tab.
- Define a `Copy Debug Bundle` action for Codex handoff. The copied bundle should include the live context, relevant pseudo-context summary, selected content types, widget decisions, generated layout JSON, validation results, renderer logs, model metadata when available, and a short prompt scaffold asking Codex to diagnose whether the issue is in layout generation, validation, or renderer code.
- Keep the step contract provider-neutral so deterministic fallbacks, OpenAI, and future providers use the same sequence.

**Done when:**
- Generate can run through a mocked step sequence locally.
- Debug logs show each step in order.
- The Debug panel separates final layout JSON from human-readable pipeline reasoning.
- The Debug panel can copy a single debug bundle that can be pasted directly into Codex for diagnosis and fixes.
- The final mocked output is still the only object passed toward validation and rendering.

## Phase 2: Layout Schema And Valid Sample Layouts

**Goal:** Define the one JSON shape the AI, fallbacks, validators, and renderer will all share.

**Work:**
- Add `design-pack/layout-schema.json`.
- Define required top-level fields for schema version, canvas, metadata, time, date, widgets, and layers, including containerized time placement and date-to-time stack metadata.
- Include metadata fields for selected content types and generation-step provenance.
- Include compact debug metadata in `metadata`, such as `selectedContentTypes`, `retryCount`, `fallbackUsed`, `contextSource`, `provider`, `model`, `promptVersion`, and `schemaVersion`.
- Cap visible widgets at three.
- Constrain circular widget size tokens to `S`, `M`, and `L`.
- Constrain circular component IDs to approved catalog components.
- Constrain rectangular templates to approved rectangular catalog templates.
- Disallow arbitrary extra properties.
- Add hand-authored valid sample layouts for renderer and validator testing.

**Done when:**
- A JSON Schema validator can accept valid sample layouts.
- The same validator rejects extra fields, invalid widget counts, invalid component names, arbitrary circular sizes, and missing required data.
- The simulator can display one sample layout JSON in the Debug panel.

## Phase 3: Semantic Content And Icon Registry

**Goal:** Make content-type choice and icon choice deterministic enough to validate.

**Work:**
- Treat `design-pack/widget-content-types.md` and `design-pack/widget-content-types.json` as the source of truth for semantic content selection.
- Add `design-pack/material-symbols-registry.json`.
- Map project semantic icon tokens to official Material Symbols names.
- Add allowed content type constraints to each icon token.
- Update the schema so widget `data.icon` accepts semantic icon tokens only.
- Decide the first supported semantic token set for the demo, likely calendar, weather, workout, timer, heart rate, battery, reminder, music, and commute.

**Done when:**
- Sample layouts include selected content types.
- Sample layouts use semantic icon keys only.
- Validation rejects unknown icon keys.
- Validation rejects icon keys used with incompatible content types.
- `index.html` can load Material Symbols without exposing any AI logic.

## Phase 4: Widget Selection Logic

**Goal:** Turn selected content types into legal widget shape, component, and variant choices.

**Work:**
- Read widget metadata density from `widget-content-types.json`.
- Use `watch-face-generation-rules.md` to decide whether the layout should use one, two, or three widgets.
- Use `design-pack/circular-widget-guidelines/circular-widget-catalog.json` for circular component and variant options.
- Use `design-pack/rectangular-widget-guidelines/rectangular-widget-catalog.json` for rectangular template options.
- Add `design-pack/widget-selection-policy.json` as the Phase 4 executable decision contract.
- Guide the model with this selection sequence:
  - rank candidate content types by usefulness to the current context
  - choose a renderable composition from the ranked candidates
  - choose widget shapes for the composition
  - cap rendered content types based on the selected widget shapes
  - emit only the widgets that fit the final legal composition
- Define circular widget eligibility as a whitelist:
  - `workout`
  - `timer`
  - `heart_rate`
  - `iot_control`
  - `weather`
- Treat circular eligibility as permission, not a requirement. Eligible content types may still choose rectangular rendering when they need detail, controls, or text density.
- Treat every other content type as rectangular-only. If a rectangular-only content type does not yet have a strict rectangular template, it must wait for generated rectangular composition support instead of being forced into a circular widget.
- Apply composition caps after shape selection:
  - all-circular layouts may render up to three widgets
  - rectangular-present layouts may render at most two widgets total
  - rectangular-present layouts may use one rectangular widget plus one circular widget, or two rectangular widgets
  - checklist layouts still render exactly one full-face widget
- Apply strict template ownership before generic widget selection:
  - `music_control` must use the `music_control` rectangular template.
  - `reminder` must use the `reminder` rectangular template.
  - `checklist` must use the `checklist_full_face` template and must be the only rendered widget.
  - `timer` may use a circular `close_gauge`, but if it renders rectangular it must use `timer_rectangular`.
  - Generative rectangular-only content types such as `upcoming_event`, `map_navigation`, `last_message`, `sleep_summary`, and `activity_summary` must not borrow strict templates unless they are explicitly promoted into a matching strict content type.
- Create deterministic selection examples for:
  - one circular widget
  - two circular widgets
  - one rectangular widget
  - mixed circular-and-rectangular widgets
  - three compact circular widgets

**Done when:**
- The local pipeline can explain why each widget was selected.
- Selected widgets always reference approved components, templates, sizes, and variants.
- Debug logs distinguish content-type selection from widget-shape selection.
- Validation rejects strict template borrowing, such as rendering `upcoming_event` with the `reminder` template.
- Validation rejects circular widgets for rectangular-only content types, such as rendering `upcoming_event` as an `open_gauge`.
- Validation rejects rectangular-present layouts with three rendered widgets.

## Phase 5: Deterministic Frontend Renderer

**Goal:** Render trusted layout JSON through approved web components only.

**Work:**
- Replace the current `.static-face` placeholder with a renderer that reads validated layout JSON.
- Implement primitive renderers for time, date, circular widgets, and rectangular widgets.
- Render circular widgets from `circular-widget-visual-specs.json` and the catalog contract.
- Render rectangular widgets from `rectangular-widget-visual-specs.json` and the template catalog contract.
- Route icons through one Material Symbols rendering helper.
- Render only inside the `Gen Watch Face` container in the Preview panel.
- Keep logs and generated JSON visible during every render attempt.

**Done when:**
- The simulator can render hand-authored valid sample layouts without any backend.
- Unknown components or invalid layout objects fail visibly in debug logs instead of rendering.
- The watch preview never renders arbitrary HTML, CSS, SVG, or executable code from layout JSON.

## Phase 6: Local Schema And Rule Validation

**Goal:** Reject bad layouts before rendering.

**Work:**
- Add a local validation module.
- Run JSON Schema validation first.
- Add deterministic rule validation for project-specific constraints:
  - all visible elements fit inside the 205 x 251 watch-face mask
  - no more than three rendered widgets
  - circular widgets use only legal size tokens
  - rectangular widgets use full width and legal heights
  - widget-time overlap is at or below 10px
  - split hour and minute typography stays visually unified
  - date remains secondary
  - widget data matches catalog requirements
  - icon tokens are valid for their semantic content type
  - text and dynamic values do not overflow their declared boxes

**Done when:**
- Validation returns structured error objects suitable for debug logs and future repair prompts.
- The renderer receives only accepted layouts.
- Invalid sample fixtures cover the major rejection paths.

## Phase 7: Deterministic Fallback Layouts

**Goal:** Make the simulator reliable before adding AI latency, failure, or cost.

**Work:**
- Add fallback layouts for common compositions:
  - one circular widget with large time
  - two circular widgets with compact time
  - one rectangular widget with time above
  - mixed circular-and-rectangular layout
  - three compact widgets
  - API failure, timeout, invalid output, and budget-exhausted states
- Pick fallback content from live Context panel values plus `demo-data/pseudo-context.json`.
- Send fallback layouts through the same schema validator, rule validator, and renderer.

**Done when:**
- Every fallback validates successfully.
- The Generate button can produce a believable deterministic watch face without AI.
- Debug logs clearly show when a fallback was used.

## Phase 8: Backend Endpoint Without AI

**Goal:** Introduce the server boundary and request/response contract before calling a model.

**Work:**
- Add a small backend endpoint, `/api/generate-watch-ui`.
- Accept live Context panel values, current time, date, and preferences.
- Load `demo-data/pseudo-context.md` and `demo-data/pseudo-context.json`.
- Load required design-pack files.
- Return a validated deterministic fallback layout.
- Return step logs for content selection, widget selection, layout generation, validation, and fallback status.
- Keep API keys out of browser code.

**Done when:**
- `index.html` calls `/api/generate-watch-ui` from Generate.
- The endpoint returns `{ layout, logs, validation }`.
- The frontend renders the returned layout and debug output.
- Running without `OPENAI_API_KEY` still works.

## Phase 9: OpenAI Structured Output Generation

**Goal:** Add the first real AI layout generation path behind the same contract.

**Work:**
- Add an OpenAI provider adapter.
- Store the key only in `OPENAI_API_KEY`.
- Use the Responses API with Structured Outputs and `strict: true`.
- Prompt the model with live context, pseudo context, compact design-pack context, and the ordered agent-step instructions.
- Require layout JSON only.
- Run model output through schema validation and rule validation before rendering.

**Done when:**
- A successful model response renders in the simulator.
- Invalid model output never reaches the renderer.
- Debug logs show model, prompt version, schema version, selected content types, selected widgets, retry count, validation status, and fallback status.

## Phase 10: Retry, Repair, And Quality Fallbacks

**Goal:** Turn validation failures into recoverable generation attempts.

**Work:**
- On first validation failure, send structured validation errors back for one repair attempt.
- Keep the repair prompt aligned to the same step contract and schema.
- After repeated failure, switch to deterministic fallback.
- Optionally add a quality-sensitive fallback attempt using the higher-quality model setting described in the plan.
- Keep all accepted outputs behind the same validators.
- Default to one validation repair retry. `OPENAI_VALIDATION_RETRIES` may override this locally, but the baseline Phase 10 contract is initial attempt plus one repair attempt.
- Return `validationAttempts` from `/api/generate-watch-ui`, including the response id, selected content types, widget decisions, validation result, and whether the attempt was a repair.
- Include `validationAttempts` in the copied debug bundle so Codex can diagnose the original invalid output and the repaired output from one paste.

**Done when:**
- Validation errors are visible in debug logs.
- Repair attempts use the same schema and rule contract.
- Exhausted retries reliably produce a deterministic fallback instead of a blank preview.
- The frontend can copy the repair history back into Codex through the debug bundle.

## Phase 11: Logging And Evaluation

**Goal:** Make generation quality measurable.

**Work:**
- Log anonymized generation records.
- Include provider, model, prompt version, schema version, design-pack version or hash, live context summary, selected content types, selected widgets, validation errors, retry count, accepted layout, fallback usage, latency, estimated token cost, and optional user feedback.
- Add a small eval set of representative Context panel inputs.
- Compare pass rate, fallback rate, latency, cost, and subjective layout quality.
- Store backend generation records locally as JSONL at `logs/generation-records.jsonl` by default. Keep `logs/` ignored by Git.
- Add `evals/watch-ui-contexts.json` as the representative eval case set.
- Add `scripts/run-evals.mjs`. It always runs fallback-only evals locally, and when a server is available at `EVAL_ENDPOINT` or `http://127.0.0.1:8787/api/generate-watch-ui`, it also runs backend/OpenAI evals through the real endpoint.
- Write eval reports to ignored local files under `eval-results/`.

**Done when:**
- Each generation creates a structured local record.
- Eval runs can compare fallback-only, OpenAI, and repaired generations.
- The debug UI can expose enough metadata to understand why a layout was accepted or replaced.
- Running `node scripts/run-evals.mjs` prints pass/fallback/repair/latency summaries and writes a JSON report.

## Phase 12: Experimental Provider And Public Demo Guardrails

**Goal:** Prepare the project for broader testing without making the demo fragile or expensive.

**Work:**
- Add a provider-neutral AI client interface.
- Add Kimi K3 behind `AI_PROVIDER=kimi` and `MOONSHOT_API_KEY`.
- Keep OpenAI as the default provider until evals prove otherwise.
- Add public-demo protections:
  - per-user or per-IP generation limits
  - provider budget handling
  - repeated-context caching
  - deterministic fallback on rate limits or budget exhaustion
  - optional CAPTCHA, sign-in, or invite-only access

**Done when:**
- Provider choice does not affect schema, validation, rendering, fallback, or logging.
- Public demo failure modes produce graceful fallback layouts.
- No API key or private user context is exposed to the browser.

## Recommended Execution Order

1. Phase 1: Agent step contract.
2. Phase 2: Layout schema and valid sample layouts.
3. Phase 3: Semantic content and icon registry.
4. Phase 4: Widget selection logic.
5. Phase 5: Deterministic frontend renderer.
6. Phase 6: Local schema and rule validation.
7. Phase 7: Deterministic fallback layouts.
8. Phase 8: Backend endpoint without AI.
9. Phase 9: OpenAI structured output generation.
10. Phase 10: Retry, repair, and quality fallbacks.
11. Phase 11: Logging and evaluation.
12. Phase 12: Experimental provider and public demo guardrails.

The key sequencing principle is: live context before content selection, content selection before widget selection, widget selection before layout, schema before model calls, validation before rendering, and deterministic fallback before network dependency.
