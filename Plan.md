# Add Project Plan And Design Pack Placeholders

## Summary
Create a repo-level `Plan.md` and scaffold the initial `design-pack` folder for the generative Apple Watch UI simulator. The plan should document the intended generation hierarchy:

```txt
Figma components/templates
        ↓
Design pack: guideline.md + tokens + component catalog + examples
        ↓
AI generates structured JSON
        ↓
Website validates JSON
        ↓
Website renders with your approved components
```

## Project Goal
Create a web-based Apple Watch generative UI simulator, with no dependency on actual watch hardware.

## Workflow Hierarchy
Your Figma components/templates are the design source of truth. The design pack converts them into agent-usable rules and structured references. The AI generates JSON. The website validates that JSON. The renderer displays only approved components.

## First-Version Focus
Prioritize the AI agent pipeline using your own design system and guidelines, rather than having the agent directly reference Apple's guidelines.

## Demo Data First Step
The first project step is to create a static pseudo-data layer that makes generated watch UIs feel realistic before live integrations exist.

This data should represent a fictional busy active user in Seattle, WA. It should eventually include weather, calendar events, to-do list items, past workouts, recent heart rate, and movement/activity context such as standing, walking, and sitting time since today started.

The pseudo data should be stable snapshot-based demo data rather than live API data. This keeps the demo predictable, easy to review, and safe from real personal data. It should live in `demo-data/`, separate from `design-pack/`: design rules live in `design-pack`, while demo content lives in `demo-data`.

## Design Pack Role
Provide the agent with `guideline.md`, design tokens, component catalog, layout schema, examples, and Figma mapping/index references.

## Implementation Direction
AI generation should produce structured JSON only. The website should own validation, rendering, fallback behavior, and component constraints.

## AI Pipeline
The website should use a server-side AI generation flow:

```txt
User inputs context
        ↓
Backend loads the design pack
        ↓
AI model generates structured UI JSON
        ↓
Schema validator checks the JSON
        ↓
Rule validator checks design guideline constraints
        ↓
Website renders approved components only
        ↓
Optional: save generation + feedback for iteration
```

The AI should not generate React, HTML, CSS, or arbitrary executable code. It should generate only a constrained layout object that matches `design-pack/layout-schema.json`. The frontend renderer should map that JSON to approved components from the local component library.

## API Key And Model Recommendation
Live AI generation requires an API key for the chosen model provider. For OpenAI, the key should be stored only on the backend as an environment variable such as `OPENAI_API_KEY`; it must never be exposed in frontend browser code or committed to the repository. If Kimi K3 is tested later, its Moonshot API key should follow the same backend-only pattern with an environment variable such as `MOONSHOT_API_KEY`.

Use OpenAI's Responses API with Structured Outputs so generated UI data follows the layout schema. Use `gpt-5.6-terra` as the default model for the first public demo because it offers the best expected balance of constraint reasoning, structured output reliability, latency, and cost. Use `gpt-5.6-sol` for portfolio-quality showcase generations, final curated examples, or fallback attempts after repeated validation failures. Use `gpt-5.6-luna` only for cheap drafts, bulk exploration, or internal eval runs where retries are acceptable.

The generation pipeline should be schema-first: the model returns only JSON that conforms to `design-pack/layout-schema.json`, then the backend runs a deterministic validator after generation. The validator should enforce both schema correctness and watch-face design rules, including mask fit, maximum widget count, fixed circular size tokens, rectangular minimum height and corner treatment, controlled widget-time overlap, split-time typography invariants, date priority, and collision checks. Invalid generations should be rejected, retried, or replaced with deterministic fallback templates before anything reaches the renderer.

## GPT-5.6 Terra Pipeline Build Steps
Build the live generation pipeline in the following order:

1. Finalize `design-pack/layout-schema.json` as the only output shape the model may return. Include required canvas, time, date, widget, layer, and metadata fields; constrain widget types with enums; cap rendered widgets at three; and disallow arbitrary extra properties.
2. Implement a schema validator that checks every generated layout against `design-pack/layout-schema.json` before any rule-specific validation or rendering runs.
3. Implement a deterministic watch-face rule validator that enforces the hard rules from `design-pack/watch-face-generation-rules.md`, including mask fit, fixed circular size tokens, rectangular sizing and corner treatment, maximum widget count, widget-time overlap, split-time typography consistency, date priority, and collision checks.
4. Create deterministic fallback layouts for common valid compositions, such as one circular widget with large time, two circular widgets with compact time, one rectangular widget with time above, a mixed circular-and-rectangular layout, and three compact widgets.
5. Add a server-side endpoint such as `/api/generate-watch-ui`. This endpoint should receive user context, current time, date, and preferences, then return either a validated layout or a deterministic fallback layout.
6. Load the design pack on the backend for each generation request. Include the layout schema, watch-face rules, widget content taxonomy, component catalog, design tokens, examples, and pseudo context as needed.
7. Call OpenAI's Responses API from the backend only, using `gpt-5.6-terra` and Structured Outputs with `strict: true` against `design-pack/layout-schema.json`. The prompt should instruct the model to return layout JSON only, not React, HTML, CSS, SVG, prose, or executable code.
8. Parse the model output, run schema validation, then run the deterministic watch-face rule validator. Only validated layouts may be sent to the frontend renderer.
9. Add retry and repair logic. If validation fails, send the validation errors back to `gpt-5.6-terra` for one corrected JSON attempt. If repeated attempts fail, use `gpt-5.6-sol` for a quality-sensitive fallback attempt or return a deterministic fallback layout.
10. Render approved components only. The frontend should map validated JSON to the local component library and should never execute or render arbitrary model-generated code.
11. Log anonymized generation records for evaluation, including model name, prompt version, validation errors, retry count, accepted layout, fallback usage, latency, and estimated token cost.
12. Add public demo guardrails before deployment, including backend-only API keys, per-user or per-IP limits, monthly spending caps, cached repeated contexts, deterministic fallbacks for API failures, and optional CAPTCHA, sign-in, or invite-only access.

## Kimi K3 Evaluation Path
Kimi K3 should be treated as an experimental provider, not the default production model. Keep `gpt-5.6-terra` as the primary model until Kimi K3 proves better on this project's own validation and design-quality evals.

Kimi K3 is worth testing because it is a newly released long-context model with strong coding and frontend-oriented claims, support for JSON Schema structured output, tool calls, prompt caching, and a roughly 1M-token context window. For this project, those strengths are useful only if the model can reliably produce valid watch-face layout JSON under the deterministic rules in `design-pack/watch-face-generation-rules.md`.

Compare Kimi K3 against `gpt-5.6-terra` using the same schema, prompt inputs, validator, renderer, and fallback logic. Track validation pass rate, retry count, latency, token cost, fallback usage, and subjective layout quality across at least 100-300 representative watch-face prompts. Promote Kimi K3 only if it consistently matches or beats Terra on those project-specific metrics.

Implementation notes for Kimi K3:

1. Add a provider-neutral AI client interface so the backend can call OpenAI or Kimi without changing the schema, validator, renderer, fallback layouts, or logging.
2. Store the Kimi API key server-side only as `MOONSHOT_API_KEY`.
3. Add a Kimi provider adapter that calls Moonshot's chat completions endpoint with model `kimi-k3`.
4. Use Kimi structured output with `response_format: { "type": "json_schema" }` and the same `design-pack/layout-schema.json`.
5. Use a stable `prompt_cache_key` for repeated design-pack context so Kimi can reuse cached prompt context where supported.
6. Keep Kimi output behind the same schema validator and deterministic watch-face rule validator as OpenAI output.
7. Add a provider switch such as `AI_PROVIDER=openai` or `AI_PROVIDER=kimi` for local testing and A/B evals.
8. Log provider-specific results with fields such as provider, model, validation errors, retry count, latency, estimated cost, fallback usage, and accepted layout.

## Public Demo Strategy
If the website is published online, treat it as a capped public demo rather than an unlimited generator:

- Route all generation requests through a backend endpoint, such as `/api/generate-watch-ui`.
- Add per-user or per-IP generation limits, such as 5-20 generations per day.
- Set a monthly API spending cap and usage alert in the provider dashboard.
- Cache repeated or common contexts to reduce duplicate API calls.
- Use deterministic fallback templates when the API fails, rate limits are hit, or the monthly budget is exhausted.
- Add CAPTCHA, sign-in, or invite-only access if abuse or automated traffic becomes a problem.
- Keep the design-pack prompt compact so each request uses fewer tokens.

## Files To Add
- `Plan.md`
- `design-pack/guideline.md`
- `design-pack/design-tokens.json`
- `design-pack/component-catalog.json`
- `design-pack/layout-schema.json`
- `design-pack/examples.json`
- `design-pack/figma-index.md`
- `design-pack/previews/.gitkeep`
- `demo-data/README.md`
- `demo-data/pseudo-context.json`

## Test Plan
- Confirm `Plan.md` exists and includes the hierarchy exactly.
- Confirm `Plan.md` documents the AI pipeline, API-key handling, model recommendation, and public-demo guardrails.
- Confirm `Plan.md` mentions pseudo data as the first implementation step.
- Confirm `design-pack` exists with the six placeholder files.
- Confirm `design-pack/previews` exists without creating the three PNG placeholder files.
- Confirm `demo-data` exists.
- Confirm `demo-data/pseudo-context.json` exists but contains no drafted JSON content yet.
- Confirm no website implementation or design-pack content is added yet.
- Confirm no live data integrations, app code, API calls, or generated sample data are added.

## Assumptions
- Since the PNG placeholders are not needed, `design-pack/previews/.gitkeep` should be used only to preserve the empty previews folder in git.
- Placeholder files should be empty for now unless the implementer needs a minimal newline.
- No app code, build setup, or AI integration should be added in this step.
- The first deployed online version should use `gpt-5.6-terra` by default, with `gpt-5.6-sol` reserved for quality-sensitive fallback or showcase runs and `gpt-5.6-luna` reserved for low-cost drafts or eval sweeps.
- Kimi K3 may be added as an experimental provider after the provider-neutral schema, validator, renderer, fallback, and logging layers exist.
- `demo-data/pseudo-context.json` should remain empty for now because the content will be brainstormed later.
