# Circular component usage

Developer reference for `CircularGauges.tsx`. These examples demonstrate component APIs, not complete generated widgets. Follow [the design guide](circular-widget-design-guidelines.md) for generation decisions. Catalogs own supported slots; visual specs own exact tokens. Exported TSX guidance must remain aligned with those resources. Independent two-hue gradients are not permitted in generated watch faces.

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

For generated watch faces, `generation-guide.md` assigns the light accent to every circular gauge. Dark accents are only for rectangular accent surfaces. Use the single-accent API for generated faces; the two-color examples below describe reusable component capability, not permission to choose independent hues in watch-face generation.

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

