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

  return {
    progress: overrides.progress ?? palette.progress,
    gradient: overrides.gradient ?? palette.gradient,
    measuredDot: overrides.measuredDot ?? palette.measuredDot,
    trackGray: "rgba(140, 140, 140, 0.28)",
    trackDark: "#3D3D3D",
    track: overrides.track,
    valueText: overrides.valueText ?? "#FFFFFF",
    labelText: overrides.labelText ?? "rgba(242, 244, 252, 0.6)",
    lowText: overrides.lowText ?? palette.lowText ?? "#FF6E39",
    highText: overrides.highText ?? palette.highText ?? "#FF385E",
    referenceText: overrides.referenceText ?? palette.referenceText ?? "#38FF4F",
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
  return {
    position: "absolute",
    left: box.x,
    top: box.y,
    width: box.width,
    height: box.height,
    display: "grid",
    placeItems: "center",
    color: "#FFFFFF",
  };
}

function gradientStops(colors: string[]) {
  if (colors.length === 1) {
    return [{ color: colors[0], offset: "0%" }];
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
        <div style={iconBoxStyle(spec.iconBox)}>{icon}</div>
      ) : (
        <>
          <div style={textBoxStyle(spec.text.value, colors.valueText)}>{value}</div>
          <div style={textBoxStyle(spec.text.label, colors.labelText)}>{label}</div>
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
  const currentDotFill =
    colors.measuredDot === "interpolateAlongGradient"
      ? colorAlongGradient(gradientColors, currentDotNormalized)
      : colors.measuredDot || palettes.default.measuredDot;
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
            fill={colors.referenceText}
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

      {property === "icon" && <div style={iconBoxStyle(spec.iconBox)}>{icon}</div>}
      {property === "text" && (
        <>
          <div style={textBoxStyle(spec.text.current, colors.valueText)}>{value}</div>
          <div style={textBoxStyle(spec.text.reference, colors.labelText)}>{label}</div>
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
          <div style={textBoxStyle(spec.text.current, colors.highText)}>{value}</div>
          <div style={textBoxStyle(spec.text.reference, colors.referenceText)}>{referenceValue}</div>
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
