import React, { type CSSProperties, type ReactNode } from "react";

export type RectangularWidgetColors = {
  widgetAccentColor: string;
  background?: string;
  primaryText?: string;
  secondaryText?: string;
  mutedSurface?: string;
  radioUnselectedStroke?: string;
  radioSelected?: string;
};

type BaseWidgetProps = {
  colors: RectangularWidgetColors;
  className?: string;
  style?: CSSProperties;
  title?: string;
};

export type MusicControlWidgetProps = BaseWidgetProps & {
  song: ReactNode;
  artist?: ReactNode;
  album?: ReactNode;
  progress?: number;
  playbackState?: "playing" | "paused";
};

export type ReminderWidgetProps = BaseWidgetProps & {
  content: ReactNode;
  label?: ReactNode;
  completed?: boolean;
};

export type TimerRectangularWidgetProps = BaseWidgetProps & {
  countdown: ReactNode;
  running?: boolean;
};

export type ChecklistItem = {
  id?: string;
  text: ReactNode;
  completed?: boolean;
};

export type ChecklistFaceProps = BaseWidgetProps & {
  title?: ReactNode;
  dateLabel?: ReactNode;
  timeLabel?: ReactNode;
  items: ChecklistItem[];
};

const fontFamily =
  "SF Compact, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

const defaults = {
  background: "#000000",
  primaryText: "#FFFFFF",
  secondaryText: "rgba(242, 244, 252, 0.6)",
  mutedSurface: "rgba(242, 244, 252, 0.1)",
  radioUnselectedStroke: "#9BA0AA",
  radioSelected: "#F2F4FC",
};

function resolveColors(colors: RectangularWidgetColors) {
  return { ...defaults, ...colors };
}

function clamp01(value = 0) {
  return Math.max(0, Math.min(1, value));
}

function widgetBase(
  width: number,
  height: number,
  colors: ReturnType<typeof resolveColors>,
  style?: CSSProperties,
): CSSProperties {
  return {
    width,
    height,
    boxSizing: "border-box",
    background: colors.background,
    color: colors.primaryText,
    fontFamily,
    letterSpacing: 0,
    overflow: "hidden",
    ...style,
  };
}

function bodyText(style?: CSSProperties): CSSProperties {
  return {
    fontSize: 19,
    lineHeight: "21.5px",
    fontWeight: 400,
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    ...style,
  };
}

function bodyEmphasis(style?: CSSProperties): CSSProperties {
  return {
    ...bodyText(),
    fontWeight: 600,
    ...style,
  };
}

function numberText(style?: CSSProperties): CSSProperties {
  return {
    fontSize: 40,
    lineHeight: "42.5px",
    fontWeight: 400,
    margin: 0,
    whiteSpace: "nowrap",
    ...style,
  };
}

function MaterialIcon({
  name,
  colors,
  label,
}: {
  name: string;
  colors: ReturnType<typeof resolveColors>;
  label: string;
}) {
  return (
    <span
      aria-label={label}
      role="img"
      style={{
        width: 48,
        height: 48,
        display: "grid",
        placeItems: "center",
        color: colors.widgetAccentColor,
        fontFamily: "'Material Symbols Rounded', 'Material Symbols Outlined', sans-serif",
        fontSize: 32,
        fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 32",
        lineHeight: 1,
      }}
    >
      {name}
    </span>
  );
}

function RadioButton({
  checked,
  colors,
}: {
  checked?: boolean;
  colors: ReturnType<typeof resolveColors>;
}) {
  const stroke = checked ? colors.radioSelected : colors.radioUnselectedStroke;
  return (
    <span
      aria-hidden="true"
      style={{
        width: 24,
        height: 24,
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: `2px solid ${stroke}`,
          boxSizing: "border-box",
          display: "grid",
          placeItems: "center",
        }}
      >
        {checked ? (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: colors.radioSelected,
            }}
          />
        ) : null}
      </span>
    </span>
  );
}

function ProgressBar({
  progress,
  colors,
}: {
  progress?: number;
  colors: ReturnType<typeof resolveColors>;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 173,
        height: 12,
        background: colors.mutedSurface,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${clamp01(progress) * 100}%`,
          height: "100%",
          background: colors.widgetAccentColor,
        }}
      />
    </div>
  );
}

export function MusicControlWidget({
  song,
  artist,
  album,
  progress,
  playbackState = "playing",
  colors,
  className,
  style,
  title,
}: MusicControlWidgetProps) {
  const resolved = resolveColors(colors);
  const secondary = artist && album ? <>{artist} / {album}</> : artist ?? album ?? "";

  return (
    <section
      className={className}
      aria-label={title ?? "Music control"}
      style={{
        ...widgetBase(205, 140, resolved, style),
        borderRadius: 54,
        padding: "16px 16px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ width: 173, height: 44 }}>
        <p style={bodyEmphasis({ height: 22 })}>{song}</p>
        <p style={bodyText({ height: 22, color: resolved.secondaryText })}>{secondary}</p>
      </div>
      <div
        style={{
          width: 173,
          height: 48,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <MaterialIcon name="skip_previous" label="Previous" colors={resolved} />
        <MaterialIcon
          name={playbackState === "playing" ? "pause" : "play_arrow"}
          label={playbackState === "playing" ? "Pause" : "Play"}
          colors={resolved}
        />
        <MaterialIcon name="skip_next" label="Next" colors={resolved} />
      </div>
      <ProgressBar progress={progress} colors={resolved} />
    </section>
  );
}

export function ReminderWidget({
  content,
  label = "Reminder",
  completed,
  colors,
  className,
  style,
  title,
}: ReminderWidgetProps) {
  const resolved = resolveColors(colors);

  return (
    <section
      className={className}
      aria-label={title ?? "Reminder"}
      style={{
        ...widgetBase(205, 127, resolved, style),
        borderRadius: 54,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ width: 173, height: 22, paddingLeft: 32, boxSizing: "border-box" }}>
        <p style={bodyText({ color: resolved.secondaryText })}>{label}</p>
      </div>
      <div style={{ width: 173, display: "flex", gap: 8, alignItems: "flex-start" }}>
        <RadioButton checked={completed} colors={resolved} />
        <p
          style={bodyEmphasis({
            width: 140,
            whiteSpace: "normal",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          })}
        >
          {content}
        </p>
      </div>
    </section>
  );
}

export function TimerRectangularWidget({
  countdown,
  running = true,
  colors,
  className,
  style,
  title,
}: TimerRectangularWidgetProps) {
  const resolved = resolveColors(colors);

  return (
    <section
      className={className}
      aria-label={title ?? "Timer"}
      style={{
        ...widgetBase(205, 139, resolved, style),
        borderRadius: 54,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      <p style={numberText()}>{countdown}</p>
      <div
        style={{
          width: 173,
          height: 48,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <MaterialIcon name="restart_alt" label="Reset" colors={resolved} />
        <MaterialIcon name={running ? "pause" : "play_arrow"} label={running ? "Pause" : "Start"} colors={resolved} />
        <MaterialIcon name="close" label="Cancel" colors={resolved} />
      </div>
    </section>
  );
}

export function ChecklistFace({
  title = "Title",
  dateLabel,
  timeLabel,
  items,
  colors,
  className,
  style,
}: ChecklistFaceProps) {
  const resolved = resolveColors(colors);
  const visibleItems = items.slice(0, 4);

  return (
    <section
      className={className}
      aria-label="Checklist"
      style={{
        ...widgetBase(205, 251, resolved, style),
        position: "relative",
        borderRadius: 0,
      }}
    >
      {dateLabel ? <p style={bodyText({ position: "absolute", left: 16, top: 16 })}>{dateLabel}</p> : null}
      {timeLabel ? (
        <p style={bodyText({ position: "absolute", right: 16, top: 16, textAlign: "right" })}>{timeLabel}</p>
      ) : null}
      <p style={bodyEmphasis({ position: "absolute", left: 16, top: 42 })}>{title}</p>
      <div
        style={{
          position: "absolute",
          left: 6,
          top: 71,
          width: 193,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {visibleItems.map((item, index) => (
          <div
            key={item.id ?? index}
            style={{
              width: 193,
              height: 56,
              boxSizing: "border-box",
              borderRadius: 8,
              background: resolved.mutedSurface,
              padding: "0 8px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <RadioButton checked={item.completed} colors={resolved} />
            <p style={bodyText()}>{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export const rectangularTemplateGuidance = {
  music_control: {
    useWhen: ["content type is music_control"],
    mustPreserve: ["song and artist/album text group", "previous/play-pause/next controls", "bottom progress bar"],
  },
  reminder: {
    useWhen: ["content type is reminder"],
    mustPreserve: ["metadata row", "radio button left of reminder content", "Body Emphasis reminder content"],
  },
  timer_rectangular: {
    useWhen: ["content type is timer and rectangular rendering is chosen"],
    alternatives: ["close_gauge circular widget"],
    mustPreserve: ["primary countdown", "reset/start-pause/cancel controls"],
  },
  checklist_full_face: {
    useWhen: ["content type is checklist"],
    mustPreserve: ["only widget on face", "full-face layout", "checklist item rows"],
  },
} as const;
