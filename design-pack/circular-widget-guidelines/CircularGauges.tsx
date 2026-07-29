import React, { type CSSProperties, type ReactNode, useId } from "react";

export type GaugeSize = "S" | "M" | "L";
export type MetricKind =
  | "default"
  | "weather_temperature"
  | "activity"
  | "battery"
  | "heart_rate"
  | string;

export type ColorOverrides = {
  widgetAccentColor?: string;
  gradientColors?: string[];
  setColor?: string;
  offsetColor?: string;
  progress?: string;
  gradient?: string[];
  track?: string;
  valueText?: string;
  labelText?: string;
  lowText?: string;
  highText?: string;
  referenceText?: string;
  measuredDot?: string;
  dotOutline?: string;
};

type GaugeBaseProps = {
  size?: GaugeSize;
  metricKind?: MetricKind;
  colors?: ColorOverrides;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

type ResolvedColors = {
  trackGray: string;
  trackDark: string;
  track?: string;
  widgetAccentColor: string;
  setColor: string;
  offsetColor: string;
  valueText: string;
  labelText: string;
  lowText: string;
  highText: string;
  referenceText: string;
  dotOutline: string;
  progress: string;
  gradient: string[];
  measuredDot: string;
};

export type CloseGaugeProps = GaugeBaseProps & {
  property: "text" | "icon";
  progress: number;
  value?: ReactNode;
  label?: ReactNode;
  icon?: ReactNode;
};

export type OpenGaugeProps = GaugeBaseProps & {
  property: "text" | "icon" | "range" | "offset";
  value?: ReactNode;
  label?: ReactNode;
  icon?: ReactNode;
  min?: number;
  max?: number;
  lowLabel?: ReactNode;
  highLabel?: ReactNode;
  referenceValue?: ReactNode;
  measuredValue?: number;
  referenceMeasuredValue?: number;
};

export type GaugeVariantGuidance = {
  useWhen: string[];
  avoidWhen?: string[];
  preferOver?: string[];
  dataRequirements?: string[];
  examples?: string[];
};

export type GaugeColorGuidance = {
  source: string;
  rules: string[];
  variantRules?: Record<string, string[]>;
};

type TextBox = {
  fontSize: number;
  lineHeight: number;
  box: { x: number; y: number; width: number; height: number };
  align?: "left" | "center" | "right";
};

const fontFamily =
  "SF Compact, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

const closeSizes = {
  S: {
    diameter: 72,
    strokeWidth: 8,
    radius: 31.5,
    center: { x: 36, y: 36 },
    iconBox: { x: 20, y: 20, width: 32, height: 32 },
    text: {
      value: { fontSize: 22, lineHeight: 24.5, box: { x: 9.6, y: 24.8, width: 52.8, height: 22.4 } },
      label: { fontSize: 10, lineHeight: 12.5, box: { x: 16, y: 47.2, width: 40, height: 9.6 } },
    },
  },
  M: {
    diameter: 90,
    strokeWidth: 10,
    radius: 39.5,
    center: { x: 45, y: 45 },
    iconBox: { x: 26, y: 26, width: 38, height: 38 },
    text: {
      value: { fontSize: 32, lineHeight: 34.5, box: { x: 12, y: 31, width: 66, height: 28 } },
      label: { fontSize: 15, lineHeight: 17.5, box: { x: 20, y: 59, width: 50, height: 12 } },
    },
  },
  L: {
    diameter: 149,
    strokeWidth: 15,
    radius: 66.5,
    center: { x: 74.5, y: 74.5 },
    iconBox: { x: 42, y: 43, width: 64, height: 64 },
    text: {
      value: { fontSize: 42, lineHeight: 44.5, box: { x: 41, y: 52, width: 67, height: 45 } },
      label: { fontSize: 18, lineHeight: 20.5, box: { x: 57, y: 97, width: 35, height: 21 } },
    },
  },
} as const;

const openSizes = {
  S: {
    diameter: 72,
    strokeWidth: 8,
    radius: 31.5,
    center: { x: 36, y: 36 },
    measureDot: { diameter: 8.21, strokeWidth: 2 },
    iconBox: { x: 20, y: 20, width: 32, height: 32 },
    text: {
      current: { fontSize: 22, lineHeight: 24.5, box: { x: 18, y: 23, width: 35, height: 25 } },
      low: { fontSize: 15, lineHeight: 17.5, box: { x: 13.05, y: 54, width: 19, height: 18 }, align: "left" },
      high: { fontSize: 15, lineHeight: 17.5, box: { x: 40.07, y: 54, width: 19, height: 18 }, align: "right" },
      reference: { fontSize: 15, lineHeight: 17.5, box: { x: 26.54, y: 54, width: 18, height: 18 } },
    },
  },
  M: {
    diameter: 90,
    strokeWidth: 10,
    radius: 39.5,
    center: { x: 45, y: 45 },
    measureDot: { diameter: 10.27, strokeWidth: 2 },
    iconBox: { x: 26, y: 26, width: 38, height: 38 },
    text: {
      current: { fontSize: 32, lineHeight: 34.5, box: { x: 19, y: 27, width: 51, height: 35 } },
      low: { fontSize: 18, lineHeight: 20.5, box: { x: 16.31, y: 69, width: 23, height: 21 }, align: "left" },
      high: { fontSize: 18, lineHeight: 20.5, box: { x: 50.34, y: 69, width: 23, height: 21 }, align: "right" },
      reference: { fontSize: 18, lineHeight: 20.5, box: { x: 34.43, y: 69, width: 21, height: 21 } },
    },
  },
  L: {
    diameter: 149,
    strokeWidth: 15,
    radius: 66.5,
    center: { x: 74.5, y: 74.5 },
    measureDot: { diameter: 17, strokeWidth: 3 },
    iconBox: { x: 42, y: 43, width: 64, height: 64 },
    text: {
      current: { fontSize: 48, lineHeight: 44.5, box: { x: 36, y: 52, width: 77, height: 45 } },
      low: { fontSize: 32, lineHeight: 44.5, box: { x: 27, y: 104, width: 38, height: 45 }, align: "left" },
      high: { fontSize: 32, lineHeight: 44.5, box: { x: 85, y: 104, width: 38, height: 45 }, align: "right" },
      reference: { fontSize: 32, lineHeight: 44.5, box: { x: 57, y: 104, width: 35, height: 45 } },
    },
  },
} as const;

const palettes: Record<string, Required<Pick<ColorOverrides, "progress" | "gradient" | "measuredDot">> & ColorOverrides> = {
  default: {
    progress: "#FF385E",
    gradient: ["#FF6D38", "#FF385E"],
    measuredDot: "#FF564A",
    lowText: "#FF6E39",
    highText: "#FF385E",
  },
  weather_temperature: {
    progress: "#FF7139",
    gradient: ["#38D4FF", "#38FF4F", "#FF7139"],
    measuredDot: "interpolateAlongGradient",
    lowText: "#38D4FF",
    highText: "#FF7139",
    referenceText: "#38FF4F",
  },
  activity: {
    progress: "#FF385E",
    gradient: ["#FF6D38", "#FF385E"],
    measuredDot: "#FF385E",
  },
  battery: {
    progress: "#38FF4F",
    gradient: ["#38FF4F", "#B7FF38"],
    measuredDot: "#38FF4F",
  },
  heart_rate: {
    progress: "#FF385E",
    gradient: ["#FF7139", "#FF385E"],
    measuredDot: "#FF385E",
  },
};

function resolveColors(metricKind: MetricKind = "default", overrides: ColorOverrides = {}): ResolvedColors {
  const palette = palettes[metricKind] || palettes.default;
  const widgetAccentColor = overrides.widgetAccentColor ?? overrides.progress ?? palette.progress;
  const gradient =
    overrides.gradientColors ??
    overrides.gradient ??
    (overrides.widgetAccentColor ? [widgetAccentColor] : palette.gradient ?? [widgetAccentColor]);
  const setColor = overrides.setColor ?? gradient[0] ?? widgetAccentColor;
  const offsetColor = overrides.offsetColor ?? gradient[gradient.length - 1] ?? widgetAccentColor;

  return {
    progress: widgetAccentColor,
    gradient,
    measuredDot: overrides.measuredDot ?? palette.measuredDot,
    trackGray: "rgba(140, 140, 140, 0.28)",
    trackDark: "#3D3D3D",
    track: overrides.track,
    widgetAccentColor,
    setColor,
    offsetColor,
    valueText: overrides.valueText ?? widgetAccentColor,
    labelText: overrides.labelText ?? widgetAccentColor,
    lowText: overrides.lowText ?? setColor,
    highText: overrides.highText ?? offsetColor,
    referenceText: overrides.referenceText ?? setColor,
    dotOutline: overrides.dotOutline ?? "#000000",
  };
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function degToRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function pointOnCircle(center: { x: number; y: number }, radius: number, angleDegrees: number) {
  const radians = degToRad(angleDegrees);
  return {
    x: center.x + radius * Math.cos(radians),
    y: center.y + radius * Math.sin(radians),
  };
}

function arcPath(
  center: { x: number; y: number },
  radius: number,
  startAngle: number,
  sweepAngle: number,
) {
  const start = pointOnCircle(center, radius, startAngle);
  const end = pointOnCircle(center, radius, startAngle + sweepAngle);
  const largeArcFlag = Math.abs(sweepAngle) > 180 ? 1 : 0;
  const sweepFlag = sweepAngle >= 0 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

function normalizeMeasuredValue(value: number, min?: number, max?: number) {
  if (typeof min !== "number" || typeof max !== "number" || min === max) {
    return 0.5;
  }

  return clamp((value - min) / (max - min));
}

function asNumber(value: ReactNode) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function measureDotPoint(value: number, min: number | undefined, max: number | undefined, size: GaugeSize) {
  const spec = openSizes[size];
  const normalized = normalizeMeasuredValue(value, min, max);
  const angle = 135 + normalized * 270;

  return pointOnCircle(spec.center, spec.radius, angle);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return undefined;
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function mixHex(start: string, end: string, amount: number) {
  const startRgb = hexToRgb(start);
  const endRgb = hexToRgb(end);

  if (!startRgb || !endRgb) {
    return end;
  }

  const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * amount);
  const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * amount);
  const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * amount);

  return `rgb(${r}, ${g}, ${b})`;
}

function colorAlongGradient(colors: string[], normalized: number) {
  if (colors.length === 0) {
    return "#FFFFFF";
  }

  if (colors.length === 1) {
    return colors[0];
  }

  const scaled = clamp(normalized) * (colors.length - 1);
  const startIndex = Math.floor(scaled);
  const endIndex = Math.min(startIndex + 1, colors.length - 1);
  const localAmount = scaled - startIndex;

  return mixHex(colors[startIndex], colors[endIndex], localAmount);
}

function textBoxStyle(box: TextBox, color: string): CSSProperties {
  return {
    position: "absolute",
    left: box.box.x,
    top: box.box.y,
    width: box.box.width,
    height: box.box.height,
    display: "flex",
    alignItems: "center",
    justifyContent: box.align === "left" ? "flex-start" : box.align === "right" ? "flex-end" : "center",
    color,
    fontFamily,
    fontSize: box.fontSize,
    fontWeight: 457,
    lineHeight: `${box.lineHeight}px`,
    letterSpacing: 0,
    textAlign: box.align || "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
  };
}

function iconBoxStyle(box: { x: number; y: number; width: number; height: number }): CSSProperties {
  return iconBoxStyleWithColor(box, "#FFFFFF");
}

function iconBoxStyleWithColor(
  box: { x: number; y: number; width: number; height: number },
  color: string,
): CSSProperties {
  return {
    position: "absolute",
    left: box.x,
    top: box.y,
    width: box.width,
    height: box.height,
    display: "grid",
    placeItems: "center",
    color,
  };
}

function gradientStops(colors: string[]) {
  if (colors.length === 1) {
    return [
      { color: colors[0], offset: "0%" },
      { color: colors[0], offset: "100%" },
    ];
  }

  return colors.map((color, index) => ({
    color,
    offset: `${(index / (colors.length - 1)) * 100}%`,
  }));
}

function GaugeFrame({
  className,
  style,
  size,
  title,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  size: number;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      style={{
        position: "relative",
        width: size,
        height: size,
        flex: "0 0 auto",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CloseGauge({
  property,
  size = "M",
  progress,
  value,
  label,
  icon,
  metricKind = "default",
  colors: colorOverrides,
  className,
  style,
  title,
}: CloseGaugeProps) {
  const spec = closeSizes[size];
  const colors = resolveColors(metricKind, colorOverrides);
  const sweep = clamp(progress) * 300;

  return (
    <GaugeFrame className={className} style={style} size={spec.diameter} title={title}>
      <svg
        aria-hidden="true"
        width={spec.diameter}
        height={spec.diameter}
        viewBox={`0 0 ${spec.diameter} ${spec.diameter}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <circle
          cx={spec.center.x}
          cy={spec.center.y}
          r={spec.radius}
          fill="none"
          stroke={colors.trackGray}
          strokeWidth={spec.strokeWidth}
          strokeLinecap="round"
        />
        {sweep > 0 && (
          <path
            d={arcPath(spec.center, spec.radius, 270, sweep)}
            fill="none"
            stroke={colors.progress}
            strokeWidth={spec.strokeWidth}
            strokeLinecap="round"
          />
        )}
      </svg>

      {property === "icon" ? (
        <div style={iconBoxStyleWithColor(spec.iconBox, colors.widgetAccentColor)}>{icon}</div>
      ) : (
        <>
          <div style={textBoxStyle(spec.text.value, colors.widgetAccentColor)}>{value}</div>
          <div style={textBoxStyle(spec.text.label, colors.widgetAccentColor)}>{label}</div>
        </>
      )}
    </GaugeFrame>
  );
}

export function OpenGauge({
  property,
  size = "M",
  value,
  label,
  icon,
  min,
  max,
  lowLabel,
  highLabel,
  referenceValue,
  measuredValue,
  referenceMeasuredValue,
  metricKind = "default",
  colors: colorOverrides,
  className,
  style,
  title,
}: OpenGaugeProps) {
  const spec = openSizes[size];
  const colors = resolveColors(metricKind, colorOverrides);
  const gradientColors = colors.gradient || palettes.default.gradient;
  const gradientId = `open-gauge-gradient-${useId().replace(/[^a-z0-9_-]/gi, "")}`;
  const currentDotValue = typeof measuredValue === "number" ? measuredValue : asNumber(value);
  const referenceDotValue =
    typeof referenceMeasuredValue === "number"
      ? referenceMeasuredValue
      : asNumber(referenceValue);
  const currentDotNormalized =
    typeof currentDotValue === "number" ? normalizeMeasuredValue(currentDotValue, min, max) : 0.5;
  const interpolatedAccent = colorAlongGradient(gradientColors, currentDotNormalized);
  const currentDotFill =
    property === "range" && !colorOverrides?.measuredDot
      ? interpolatedAccent
      : colors.measuredDot === "interpolateAlongGradient"
      ? interpolatedAccent
      : property === "offset"
        ? colors.offsetColor
        : colors.measuredDot || interpolatedAccent;
  const dotRadius = spec.measureDot.diameter / 2;
  const showDots = property === "range" || property === "offset";
  const showTrack = property !== "range";

  return (
    <GaugeFrame className={className} style={style} size={spec.diameter} title={title}>
      <svg
        aria-hidden="true"
        width={spec.diameter}
        height={spec.diameter}
        viewBox={`0 0 ${spec.diameter} ${spec.diameter}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            {gradientStops(gradientColors).map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>

        {showTrack && (
          <path
            d={arcPath(spec.center, spec.radius, 135, 270)}
            fill="none"
            stroke={colors.track || colors.trackDark}
            strokeWidth={spec.strokeWidth}
            strokeLinecap="round"
          />
        )}
        <path
          d={arcPath(spec.center, spec.radius, 135, 270)}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={spec.strokeWidth}
          strokeLinecap="round"
        />

        {showDots && property === "offset" && typeof referenceDotValue === "number" && (
          <MeasuredDot
            point={measureDotPoint(referenceDotValue, min, max, size)}
            radius={dotRadius}
            strokeWidth={spec.measureDot.strokeWidth}
            fill={colors.setColor}
            stroke={colors.dotOutline}
          />
        )}
        {showDots && typeof currentDotValue === "number" && (
          <MeasuredDot
            point={measureDotPoint(currentDotValue, min, max, size)}
            radius={dotRadius}
            strokeWidth={spec.measureDot.strokeWidth}
            fill={currentDotFill}
            stroke={colors.dotOutline}
          />
        )}
      </svg>

      {property === "icon" && <div style={iconBoxStyleWithColor(spec.iconBox, interpolatedAccent)}>{icon}</div>}
      {property === "text" && (
        <>
          <div style={textBoxStyle(spec.text.current, interpolatedAccent)}>{value}</div>
          <div style={textBoxStyle(spec.text.reference, interpolatedAccent)}>{label}</div>
        </>
      )}
      {property === "range" && (
        <>
          <div style={textBoxStyle(spec.text.current, colors.valueText)}>{value}</div>
          <div style={textBoxStyle(spec.text.low, colors.lowText)}>{lowLabel}</div>
          <div style={textBoxStyle(spec.text.high, colors.highText)}>{highLabel}</div>
        </>
      )}
      {property === "offset" && (
        <>
          <div style={textBoxStyle(spec.text.current, colors.offsetColor)}>{value}</div>
          <div style={textBoxStyle(spec.text.reference, colors.setColor)}>{referenceValue}</div>
        </>
      )}
    </GaugeFrame>
  );
}

function MeasuredDot({
  point,
  radius,
  strokeWidth,
  fill,
  stroke,
}: {
  point: { x: number; y: number };
  radius: number;
  strokeWidth: number;
  fill: string;
  stroke: string;
}) {
  return (
    <circle
      cx={point.x}
      cy={point.y}
      r={radius}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}

export const gaugeSpecs = {
  closeSizes,
  openSizes,
};

export const gaugeColorGuidance = {
  close_gauge: {
    source: "watch-face-generation-rules.md widget_accent_color",
    rules: [
      "Close Gauge can only have one accent color.",
      "The single accent color must be the widget_accent_color resolved by watch-face-generation-rules.md.",
      "Apply widget_accent_color to the value arc, text, number, and icon.",
      "The base ring must always use the translucent light grey track color.",
    ],
  },
  open_gauge: {
    source: "watch-face-generation-rules.md widget_accent_color and optional two-color circular gauge rule",
    rules: [
      "Open Gauge can use one accent color or two colors, decided by watch-face-generation-rules.md.",
      "If one accent color is used, it must be widget_accent_color.",
      "If two colors are used, the open ring must use those colors as a gradient from start to end.",
    ],
    variantRules: {
      text: [
        "The measure, text, number, and icon color must be the color between the start and end of the gradient based on the measure position normalized from start to end.",
        "When only one accent color is used, the measure, text, number, and icon all use widget_accent_color.",
      ],
      icon: [
        "The measure, text, number, and icon color must be the color between the start and end of the gradient based on the measure position normalized from start to end.",
        "When only one accent color is used, the measure, text, number, and icon all use widget_accent_color.",
      ],
      range: [
        "The low number must use the start color of the gradient.",
        "The high number must use the end color of the gradient.",
        "The measured dot should use the color between the start and end of the gradient based on the measured value position normalized from start to end.",
      ],
      offset: [
        "The two colors are assigned as set and offset colors.",
        "The text and measure representing the set number must use the set color.",
        "The text and measure representing the offset number must use the offset color.",
        "The value arc must use the gradient from the set color to the offset color.",
      ],
    },
  },
} satisfies Record<"close_gauge" | "open_gauge", GaugeColorGuidance>;

export const gaugeVariantGuidance = {
  close_gauge: {
    useWhen: [
      "Use close_gauge when the value can only go one direction, either increase from 0 to 1 or 0 to 100, or decrease from a set number down to 0, aka a countdown.",
    ],
    selectionPriority: [
      "Use text when we need unit of measurement.",
      "Use icon when the metric is secondary and recognizable without a number.",
    ],
    variants: {
      text: {
        useWhen: [
          "The metric has one important readable value.",
          "What the value refers to is obvious with the unit of measurement, and we don't need any icons as context, ",
        ],
        avoidWhen: [
          "The metric is not important and the user only needs to know a rough estimate",
          "The value is too long to remain legible inside the selected circular size.",
        ],
        preferOver: [
          "Prefer over icon when exact value recognition matters.",
          "Prefer over open_gauge.text when the the value can only go on direction",
        ],
        dataRequirements: [
          "Requires value, label, and progress.",
          "Progress must be normalized from 0 to 1 before rendering.",
        ],
        examples: [
          "Activity progress with value 82 and label move.",
          "Battery percentage with value 64 and label batt.",
        ],
      },
      icon: {
        useWhen: [
          "The metric is secondary and user needs only a rough estimate.",
          "The metric can be understood from a familiar icon alone.",
        ],
        avoidWhen: [
          "The user needs an exact value.",
          "The icon would be ambiguous without a text label.",
        ],
        preferOver: [
          "Prefer over text when the icon is enough to communicate the context and the exact value is not important.",
          "Prefer over open_gauge.icon when the value can only go one direction",
        ],
        dataRequirements: [
          "Requires icon and progress.",
          "Progress must be normalized from 0 to 1 before rendering.",
        ],
        examples: [
          "Small battery icon gauge.",
          "Secondary mindfulness or hydration icon gauge.",
        ],
      },
    },
  },
  open_gauge: {
    useWhen: [
      "Use open_gauge when the value can start at any point within a set range, and can go both direction, up and down, as long as it is within the range.",
    ],
    selectionPriority: [
      "Use text when one value is enough and we need the text to tell us the metadata of the metric.",
      "Use icon when one value is enough and the icon can communicate the metadata of the metric ",
      "Use range when min/max context is essential.",
      "Use offset when comparing against a reference, target, baseline, or previous value.",
    ],
    variants: {
      text: {
        useWhen: [
          "The metric has one readable value and we need the text to tell us the metadata of the metric.",
          "The value should be visible, but range or comparison labels would be unnecessary.",
        ],
        avoidWhen: [
          "Range or offset context is available and meaningful.",
        ],
        preferOver: [
          "Prefer over range and offset when extra numbers are not available, not necessary or would add clutter.",
          "Prefer over icon when the the letter count can fit or an icon alone is not enough to communicate the meaning of the metadata.",
        ],
        dataRequirements: [
          "Requires value and optional label.",
        ],
        examples: [
          "Current UV index when no scale labels are shown.",
          "Current AQI value.",
        ],
      },
      icon: {
        useWhen: [
          "The metadata of what the metric means can be recognized by icon alone.",
          "The value should be visible, but range or comparison labels would be unnecessary.",
        ],
        avoidWhen: [
          "The icon is not self-explanatory.",
          "Range or offset context is available and meaningful.",
        ],
        preferOver: [
          "Prefer over range and offset when extra numbers are not available, not necessary or would add clutter.",
          "Prefer over text when the metadata of the metrics has too many letter count to fit or an icon alone is enough to communicate the meaning of the metadata.",
        ],
        dataRequirements: [
          "Requires value icon.",
        ],
        examples: [
          "Small weather condition icon with the current temperature gauge.",
          "Small sleep icon with the sleep score from last night.",
        ],
      },
      range: {
        useWhen: [
          "The metric has meaningful lower and upper bounds.",
          "The current value should be understood relative to a range.",
          "There is another widget on the watch face from the same content type and users will know what the numbers mean when looking at all the widgets together.",
        ],
        avoidWhen: [
          "There is no meaningful min and max.",
          "The endpoint labels would be decorative rather than informative.",
          "It is the only widget from that content type so users won’t know what the numbers mean.",
        ],
        preferOver: [
          "Prefer over text or icon when min/max context changes how the user understands the current value.",
          "Prefer over offset when the endpoints are bounds rather than a reference or baseline.",
        ],
        dataRequirements: [
          "Requires value, min, max, lowLabel, highLabel, and measuredValue.",
          "The measured dot must use normalized = clamp((measuredValue - min) / (max - min), 0, 1).",
          "If measuredValue equals max, the dot must sit on the right/lower edge of the open gauge ring. Vice versa for min.",
        ],
        examples: [
          "Weather temperature with low 55, high 68, current 68 when there is another widget showing weather condition.",
        ],
      },
      offset: {
        useWhen: [
          "The metric compares the current value against a target, baseline, previous value, or reference.",
          "The secondary value explains whether the current value is ahead, behind, high, low, or changed.",
          "Two measured positions on the same arc would make the comparison easier to understand.",
        ],
        avoidWhen: [
          "The secondary value would be arbitrary or confusing.",
          "The metric is better explained as low/current/high bounds.",
          "Only one scalar value matters.",
        ],
        preferOver: [
          "Prefer over range when the second number is a reference rather than a bound.",
          "Prefer over text or icon when comparison is the main point of the widget.",
        ],
        dataRequirements: [
          "Requires value, referenceValue, and optional min and max value.",
          "Each measured dot must be positioned from its own normalized value within min and max.",
        ],
        examples: [
          "Current heart rate compared with resting heart rate.",
          "Current pace compared with target pace.",
          "Current temperature in the house compared with set temperature for thermostat.",
        ],
      },
    },
  },
} satisfies {
  close_gauge: {
    useWhen: string[];
    selectionPriority: string[];
    variants: Record<"text" | "icon", GaugeVariantGuidance>;
  };
  open_gauge: {
    useWhen: string[];
    selectionPriority: string[];
    variants: Record<"text" | "icon" | "range" | "offset", GaugeVariantGuidance>;
  };
};
