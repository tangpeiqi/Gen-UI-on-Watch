# React Gauge Components

These components implement the webpage rendering contract described in:

- `./circular-widget-catalog.json`
- `./circular-widget-visual-specs.json`

Use the JSON files to decide which component and variant an agent should choose. Use these React components to render the chosen widget consistently in a webpage.

## Components

```tsx
import { CloseGauge, OpenGauge, gaugeColorGuidance, gaugeVariantGuidance } from "./CircularGauges";
```


## Variant Guidance

Variant selection guidance lives in `gaugeVariantGuidance` so an agent can inspect when to use each variant before rendering a component.

```tsx
const guidance = gaugeVariantGuidance.open_gauge.variants.range;

console.log(guidance.useWhen);
console.log(guidance.avoidWhen);
```

Use it as the decision layer:

- `close_gauge`: use when the value can only go one direction, either increase from 0 to 1 or 0 to 100, or decrease from a set number down to 0 as a countdown.
- `open_gauge`: use when the value can start at any point within a set range, and can go both direction, up and down, as long as it is within the range.
- `close_gauge.text`: one readable value with normalized progress.
- `close_gauge.icon`: secondary recognizable metric with no exact value needed.
- `open_gauge.text`: one readable value with a lighter open-arc visual.
- `open_gauge.icon`: secondary recognizable metric that should match open-arc rhythm.
- `open_gauge.range`: current value relative to meaningful min/max bounds.
- `open_gauge.offset`: current value compared with a target, baseline, previous value, or reference.

## Close Gauge

```tsx
<CloseGauge
  property="text"
  size="M"
  value="82"
  label="move"
  progress={0.82}
  metricKind="activity"
/>
```

```tsx
<CloseGauge
  property="icon"
  size="S"
  icon={<BatteryIcon />}
  progress={0.64}
  metricKind="battery"
/>
```

## Open Gauge Range

The measured dot is placed from `min`, `max`, and `measuredValue`.

```tsx
<OpenGauge
  property="range"
  size="M"
  value="68"
  min={55}
  max={68}
  lowLabel="55"
  highLabel="68"
  measuredValue={68}
  metricKind="weather_temperature"
/>
```

For this weather example, `measuredValue` equals `max`, so the dot is rendered at the right/lower edge of the open gauge ring.

## Open Gauge Offset

```tsx
<OpenGauge
  property="offset"
  size="L"
  value="76"
  referenceValue="72"
  min={60}
  max={90}
  measuredValue={76}
  referenceMeasuredValue={72}
  metricKind="heart_rate"
/>
```

## Color Contract

Circular gauge colors are decided by `watch-face-generation-rules.md`.

`CloseGauge` can only have one accent color. Use the resolved `widget_accent_color` for the value arc, text, number, and icon. The base ring always uses the translucent light grey track.

```tsx
<CloseGauge
  property="text"
  size="M"
  value="82"
  label="move"
  progress={0.82}
  colors={{ widgetAccentColor }}
/>
```

`OpenGauge` can use one accent color or two colors.

If it uses one accent color, pass the resolved `widget_accent_color`:

```tsx
<OpenGauge
  property="text"
  size="M"
  value="8"
  min={0}
  max={11}
  measuredValue={8}
  colors={{ widgetAccentColor }}
/>
```

If it uses two colors, pass them as `gradientColors`. The open ring uses those colors as its gradient.

```tsx
<OpenGauge
  property="range"
  size="M"
  value="8"
  min={0}
  max={11}
  lowLabel="0"
  highLabel="11"
  measuredValue={8}
  colors={{
    gradientColors: ["#38D4FF", "#FF7139"]
  }}
/>
```

Variant-specific color rules:

- `open_gauge.text` and `open_gauge.icon`: text, number, icon, and measure use the color between the gradient start and end based on normalized measure position.
- `open_gauge.range`: low uses the start color; high uses the end color; the measured dot follows the normalized position on the gradient.
- `open_gauge.offset`: the two colors become set and offset colors. Set text/measure use the set color; offset text/measure use the offset color; the value arc uses the gradient from set to offset.

Agents can inspect the same rules programmatically:

```tsx
console.log(gaugeColorGuidance.open_gauge.variantRules?.offset);
```
