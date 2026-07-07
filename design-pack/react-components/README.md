# React Gauge Components

These components implement the webpage rendering contract described in:

- `../component-catalog.json`
- `../visual-specs.json`

Use the JSON files to decide which component and variant an agent should choose. Use these React components to render the chosen widget consistently in a webpage.

## Components

```tsx
import { CloseGauge, OpenGauge } from "./react-components";
```

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

## Color Overrides

Agents may pick colors based on content. Pass `colors` when the semantic palette is not enough:

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
    gradient: ["#38D4FF", "#FFEA38", "#FF7139"],
    measuredDot: "#FFEA38"
  }}
/>
```
