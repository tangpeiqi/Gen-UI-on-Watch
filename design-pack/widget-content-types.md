# Widget Content Types

This document defines semantic widget content types for the generative UI agent. Use it with `widget-selection-policy.json`: this file defines what information can be shown for each type, while the selection policy decides whether the type renders as a single widget, multiple widgets, or a mixed group.

The content taxonomy should not make the final layout-budget decision. It should define related metadata groups, which fields need text space, and which fields require controls.

## Ownership

Selection sequence, ranking, eligibility, count, and shape decisions belong to `widget-selection-policy.json`. This taxonomy supplies the data fields and metadata roles used by selection and widget design. Widget guidelines own how those fields are displayed.

## Metadata Roles

The content definitions use these metadata roles:

- `metric_groups`: Groups of related metadata within a content type. Each group lists required and optional metadata, plus derived metrics where applicable.
- `detail_fields`: Descriptive metadata such as names, labels, explanations, and comparisons.
- `control_fields`: Metadata representing interactive actions such as start, pause, or mark complete.

Required metadata is the core content; optional metadata is additional information that may be available.

## Metric Groups

Each content type contains metric groups with `metadata.required` and `metadata.optional`. Workout lists its groups separately for during and after a workout. Derived metrics are calculated from the metadata.

Rules for splitting groups across widgets or combining groups in one widget belong to `widget-selection-policy.json`.

The JSON companion uses camelCase keys; the YAML below uses snake_case equivalents. Group IDs in the summary refer to the definitions below. These are first-draft groupings for review.

## Metadata Value Types

- `icon`: An approved icon token for the content type.
- `string_or_icon_or_both`: A text string, an object with an icon token, or an object with both text and an icon token. For example: `"Running"`, `{"icon": "workout_running"}`, or `{"text": "Running", "icon": "workout_running"}`. Rendered icons must use an approved icon token for the content type.

## Content Type Summary

A dash (—) means no metadata is currently labeled with that role.

| Type | Required Metadata | Optional Metadata | Metric Groups | Detail Fields | Control Fields |
|---|---|---|---|---|---|
| `workout` (during workout) | `workout_type`, `elapsed_time`, `calories_burned` | `calorie_goal`, `target_duration` | `type`, `time`, `calorie` | — | — |
| `workout` (after workout) | `workout_type`, `duration`, `calories_burned` | `calorie_goal`, `target_duration` | `type`, `time`, `calorie` | — | — |
| `activity_summary` | `sitting_time`, `standing_time`, `walking_time` | — | `sitting`, `standing`, `walking` | — | — |
| `upcoming_event` | `time`, `event_name` | `location`, `time_to_leave` | `upcoming_event` | `event_name`, `location` | — |
| `timer` | `countdown`, `total_duration` | `timer_label`, `start_action`, `pause_action`, `cancel_action` | `countdown` | `timer_label` | `start_action`, `pause_action`, `cancel_action` |
| `heart_rate` | `last_reading` | `time_since_last_reading`, `today_high`, `today_low` | `heart_rate` | `time_since_last_reading` | — |
| `last_message` | `sender`, `content` | `timestamp` | `message` | `sender`, `content`, `timestamp` | — |
| `iot_control` | `status`, `current_value` | `device_name`, `set_value`, `room`, `control_action` | `status`, `value` | `device_name`, `room` | `control_action` |
| `map_navigation` | `destination`, `travel_time` | `traffic_condition`, `distance` | `map_navigation` | `destination`, `traffic_condition` | — |
| `sleep_summary` | `score`, `sleep_label`, `hours_asleep` | `quality_rating`, `sleep_goal` | `quality`, `hours` | — | — |
| `music_control` | `song`, `play_pause_action` | `album`, `artist`, `next_action`, `previous_action`, `artwork` | `playback` | `song`, `album`, `artist`, `artwork` | `play_pause_action`, `next_action`, `previous_action` |
| `reminder` | `content`, `mark_complete_action` | — | `task` | `content` | `mark_complete_action` |
| `weather` | `condition`, `current_temperature` | `high_temperature`, `low_temperature`, `rain_chance`, `precipitation_label`, `wind`, `wind_label` | `condition`, `temperature_range`, `precipitation`, `wind` | — | — |
| `checklist` | `items`, `completed_items`, `title`, `mark_complete_action` | — | `list` | `title`, `items`, `completed_items` | `mark_complete_action` |

## Content Type Definitions

```yaml
content_types:
  workout:
    purpose: "Show active or recent workout progress and effort."
    use_when:
      - "user asks about a workout"
      - "context includes exercise, calories, elapsed time, or workout progress"
    metric_groups:
      during_workout:
        - id: "type"
          metadata:
            required:
              workout_type: "string_or_icon_or_both"
            optional: {}
        - id: "time"
          metadata:
            required:
              elapsed_time: "duration"
            optional:
              target_duration: "duration"
          derived_metrics:
            - "time_progress"
        - id: "calorie"
          metadata:
            required:
              calories_burned: "number"
            optional:
              calorie_goal: "number"
          derived_metrics:
            - "calorie_progress"
      after_workout:
        - id: "type"
          metadata:
            required:
              workout_type: "string_or_icon_or_both"
            optional: {}
        - id: "time"
          metadata:
            required:
              duration: "duration"
            optional:
              target_duration: "duration"
          derived_metrics:
            - "time_progress"
        - id: "calorie"
          metadata:
            required:
              calories_burned: "number"
            optional:
              calorie_goal: "number"
          derived_metrics:
            - "calorie_progress"
    presentation_affordances:
      detail_fields: []
    derived_metrics:
      time_progress:
        available_when: "target_duration is positive and the applicable elapsed_time or duration is present; normalize both durations to the same unit before dividing."
        formula_by_situation:
          during_workout: "elapsed_time / target_duration"
          after_workout: "duration / target_duration"
        unavailable_when: "The numerator is absent, or the denominator is absent or nonpositive; no derived ratio is defined."
        meaning: "Ratio of actual time to target duration; may exceed 1. A completed workout does not necessarily meet its target."
      calorie_progress:
        available_when: "calorie_goal is positive and calories_burned is present; use the same calorie unit for both values."
        formula_by_situation:
          during_workout: "calories_burned / calorie_goal"
          after_workout: "calories_burned / calorie_goal"
        unavailable_when: "The numerator is absent, or the denominator is absent or nonpositive; no derived ratio is defined."
        meaning: "Ratio of calories burned to calorie goal; may exceed 1. A completed workout does not necessarily meet its calorie goal."
    metadata_notes:
      - "Use during_workout metadata for an ongoing workout and after_workout metadata for a completed workout; both use the workout content type."
      - "elapsed_time is time completed so far during an ongoing workout; duration is the final total length of a completed workout. target_duration is the optional planned total length in either situation."
      - "time_progress is derived from elapsed_time / target_duration during a workout or duration / target_duration after a workout. calorie_progress is derived from calories_burned / calorie_goal in both situations when the goal is positive; both progress metrics are derived, not input metadata."
  activity_summary:
    purpose: "Show cumulative sitting, standing, and walking time."
    metric_groups:
      - id: "sitting"
        metadata:
          required:
            sitting_time: "duration"
          optional: {}
      - id: "standing"
        metadata:
          required:
            standing_time: "duration"
          optional: {}
      - id: "walking"
        metadata:
          required:
            walking_time: "duration"
          optional: {}
    presentation_affordances:
      detail_fields: []
  upcoming_event:
    purpose: "Show the next calendar event."
    metric_groups:
      - id: "upcoming_event"
        metadata:
          required:
            event_name: "string"
            time: "datetime_or_time"
          optional:
            location: "string"
            time_to_leave: "datetime_or_time"
    presentation_affordances:
      detail_fields:
        - "event_name"
        - "location"
    metadata_notes:
      - "time_to_leave is the recommended departure date/time to arrive at the event by its start time; it is not a travel duration."
  timer:
    purpose: "Show an inferred or active countdown."
    metric_groups:
      - id: "countdown"
        metadata:
          required:
            countdown: "duration"
            total_duration: "duration"
          optional:
            timer_label: "string"
            start_action: "action"
            pause_action: "action"
            cancel_action: "action"
        derived_metrics:
          - "remaining_progress"
    presentation_affordances:
      detail_fields:
        - "timer_label"
      control_fields:
        - "start_action"
        - "pause_action"
        - "cancel_action"
    derived_metrics:
      remaining_progress:
        available_when: "countdown is present and total_duration is positive; normalize both durations to the same unit before dividing."
        formula: "min(1, max(0, countdown / total_duration))"
        range:
          - 0
          - 1
        meaning: "Remaining fraction of the timer: 1 means countdown equals total_duration; 0 means countdown is zero. Progress decreases as the timer counts down."
        unavailable_when: "The numerator is absent, or the denominator is absent or nonpositive; no derived ratio is defined."
  heart_rate:
    purpose: "Show the latest heart rate reading and optional high and low recorded today."
    metric_groups:
      - id: "heart_rate"
        metadata:
          required:
            last_reading: "number"
          optional:
            time_since_last_reading: "duration"
            today_high: "number"
            today_low: "number"
    presentation_affordances:
      detail_fields:
        - "time_since_last_reading"
    metadata_notes:
      - "Today means since midnight in the user's local timezone."
      - "today_high and today_low are the highest and lowest recorded heart rate readings today; they do not imply continuous monitoring or depend on an activity."
  last_message:
    purpose: "Show the latest message preview."
    metric_groups:
      - id: "message"
        metadata:
          required:
            sender: "string"
            content: "string"
          optional:
            timestamp: "datetime_or_time"
    presentation_affordances:
      detail_fields:
        - "sender"
        - "content"
        - "timestamp"
  iot_control:
    purpose: "Show smart device status and current value, with optional device information, setpoint, and control action."
    metric_groups:
      - id: "status"
        metadata:
          required:
            status: "string"
          optional:
            device_name: "string_or_icon_or_both"
            room: "string"
      - id: "value"
        metadata:
          required:
            current_value: "number_or_string"
          optional:
            set_value: "number_or_string"
            control_action: "action"
    presentation_affordances:
      detail_fields:
        - "device_name"
        - "room"
      control_fields:
        - "control_action"
  map_navigation:
    purpose: "Show navigation timing and travel conditions."
    metric_groups:
      - id: "map_navigation"
        metadata:
          required:
            destination: "string"
            travel_time: "duration"
          optional:
            traffic_condition: "string"
            distance: "distance"
    presentation_affordances:
      detail_fields:
        - "destination"
        - "traffic_condition"
  sleep_summary:
    purpose: "Show sleep quality and hours asleep, with an optional sleep goal."
    metric_groups:
      - id: "quality"
        metadata:
          required:
            score: "number"
            sleep_label: "string_or_icon_or_both"
          optional:
            quality_rating: "string"
      - id: "hours"
        metadata:
          required:
            hours_asleep: "number"
          optional:
            sleep_goal: "number"
    presentation_affordances:
      detail_fields: []
    metadata_notes:
      - "hours_asleep and sleep_goal are measured in hours and may include fractional hours, such as 7.5."
  music_control:
    purpose: "Show current music and playback controls."
    metric_groups:
      - id: "playback"
        metadata:
          required:
            song: "string"
            play_pause_action: "action"
          optional:
            album: "string"
            artist: "string"
            next_action: "action"
            previous_action: "action"
            artwork: "image"
    presentation_affordances:
      detail_fields:
        - "song"
        - "album"
        - "artist"
        - "artwork"
      control_fields:
        - "play_pause_action"
        - "next_action"
        - "previous_action"
  reminder:
    purpose: "Show a reminder to-do item with a completion affordance."
    metric_groups:
      - id: "task"
        metadata:
          required:
            content: "string"
            mark_complete_action: "action"
          optional: {}
    presentation_affordances:
      detail_fields:
        - "content"
      control_fields:
        - "mark_complete_action"
  weather:
    purpose: "Show current weather and daily temperature range."
    metric_groups:
      - id: "condition"
        metadata:
          required:
            condition: "string_or_icon_or_both"
          optional: {}
      - id: "temperature_range"
        metadata:
          required:
            current_temperature: "number"
          optional:
            high_temperature: "number"
            low_temperature: "number"
      - id: "precipitation"
        metadata:
          required: {}
          optional:
            rain_chance: "percent"
            precipitation_label: "icon"
      - id: "wind"
        metadata:
          required: {}
          optional:
            wind: "speed"
            wind_label: "icon"
    presentation_affordances:
      detail_fields: []
  checklist:
    purpose: "Show a scrollable list of checklist items."
    metric_groups:
      - id: "list"
        metadata:
          required:
            items: "array"
            completed_items: "array"
            title: "string"
            mark_complete_action: "action"
          optional: {}
    presentation_affordances:
      detail_fields:
        - "title"
        - "items"
        - "completed_items"
      control_fields:
        - "mark_complete_action"
```
