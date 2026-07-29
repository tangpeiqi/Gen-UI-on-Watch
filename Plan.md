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

## AI UI Generation Pipeline
The detailed plan for the agent-based UI generation pipeline now lives in `AI-UI-Generation-Pipeline-Plan.md`.

That document covers the server-side generation flow, structured JSON output, schema and rule validation, Material Symbols icon handling, model/provider strategy, retry and fallback behavior, logging, evaluation, and public-demo guardrails.

## Files To Add
- `Plan.md`
- `design-pack/guideline.md`
- `design-pack/design-tokens.json`
- `design-pack/Circular Widget Guidelines/circular-widget-catalog.json`
- `design-pack/Circular Widget Guidelines/circular-widget-visual-specs.json`
- `design-pack/Circular Widget Guidelines/CircularGauges.tsx`
- `design-pack/Circular Widget Guidelines/README.md`
- `design-pack/layout-schema.json`
- `design-pack/examples.json`
- `design-pack/figma-index.md`
- `design-pack/previews/.gitkeep`
- `demo-data/README.md`
- `demo-data/pseudo-context.json`
- `AI-UI-Generation-Pipeline-Plan.md`

## Test Plan
- Confirm `Plan.md` exists and includes the hierarchy exactly.
- Confirm `Plan.md` links to `AI-UI-Generation-Pipeline-Plan.md`.
- Confirm `AI-UI-Generation-Pipeline-Plan.md` documents the AI pipeline, API-key handling, model recommendation, Material Symbols handling, and public-demo guardrails.
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
