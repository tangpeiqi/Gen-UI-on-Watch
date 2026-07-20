# Widget Content Types

This document defines semantic widget content types for the generative UI agent. Use it with `watch-face-generation-rules.md`: this file defines what information can be shown for each type, while the watch-face generation rules decide whether the type renders as a single widget, multiple widgets, or a mixed group.

The content taxonomy should not make the final layout-budget decision. It should identify useful metadata, which fields can stand alone as compact metrics, which fields need text space, and which fields require controls.

## Selection Contract

```yaml
semantic_widget_selection:
  steps:
    - read_current_context
    - combine_with_prepopulated_pseudo_context
    - infer_up_to_three_semantic_content_types
    - extract_required_metadata
    - extract_available_optional_metadata
    - identify_primary_display_value
    - identify_splittable_metric_fields
    - identify_detail_fields
    - identify_control_fields
    - pass_content_metadata_to_watch_face_generation_rules

  rules:
    - id: semantic-before-layout
      strictness: must
      rule: Choose semantic content types before choosing widget count, shape, or layout.

    - id: max-three-types
      strictness: must
      rule: Select at most three semantic content types from the combined context.

    - id: required-metadata-first
      strictness: must
      rule: Required metadata must be prioritized over optional metadata.

    - id: optional-only-when-available
      strictness: must
      rule: Optional metadata should render only when available from context or specifically requested.

    - id: strategy-owned-by-layout
      strictness: must
      rule: Final single, multi, or mixed rendering strategy is decided by watch-face-generation-rules.md.
```

## Metadata Role Columns

Use the following terms in the content type table:

- `primary`: The strongest single value or text group for a one-widget summary.
- `splittable_metrics`: Fields that can become separate compact widgets when layout budget allows.
- `detail_fields`: Fields that usually need rectangular text space.
- `control_fields`: Interactive actions; these require rectangular rendering when visible.
- `conditional_fields`: Fields that render only under specific context conditions.

## Content Type Summary

| Type | Required Metadata | Optional Metadata | Primary | Splittable Metrics | Detail / Control Rules |
|---|---|---|---|---|---|
| `workout` | `workout_type`, `duration`, `calories_burned` | `calorie_goal`, `past_week_average`, `elapsed_time`, `progress` | workout summary | `duration`, `calories_burned`, `progress` | Comparisons to goal or past week average need detail space. |
| `activity_summary` | `sitting_time`, `standing_time`, `walking_time` | `last_three_day_average`, `trend` | activity summary | `sitting_time`, `standing_time`, `walking_time` | Average and trend copy need detail space. |
| `upcoming_event` | `time`, `event_name` | `location`, `travel_time`, `calendar_name` | event name and time | `time`, `travel_time` | Location and event name usually need detail space. |
| `timer` | `timer_label`, `countdown` | `start_action`, `pause_action`, `cancel_action`, `total_duration`, `remaining_seconds` | countdown | `countdown`, `progress` | Start, pause, or cancel controls require rectangular rendering. |
| `heart_rate` | `last_reading` | `time_since_last_reading`, `activity_high`, `activity_low`, `activity_type` | last reading | `last_reading`, `activity_high`, `activity_low` | Activity type and time since reading are detail fields. |
| `last_message` | `sender`, `content` | `timestamp`, `app`, `unread_count` | sender and content | `unread_count` | Message preview needs rectangular text space. |
| `iot_control` | `device_name`, `status` | `current_value`, `set_value`, `room`, `control_action` | device status | `status`, `current_value`, `set_value` | Control actions require rectangular rendering. |
| `map_navigation` | `destination`, `traffic_condition`, `travel_time` | `time_to_leave`, `distance`, `next_step` | destination and travel time | `travel_time`, `time_to_leave`, `distance` | Destination, traffic, and next step need detail space. |
| `sleep_summary` | `quality_rating`, `score`, `hours_asleep` | `trend`, `sleep_goal`, `previous_average` | sleep score or summary | `quality_rating`, `score`, `hours_asleep` | Trend and comparison fields need detail space. |
| `music_control` | `song`, `play_pause_action` | `album`, `artist`, `next_action`, `previous_action`, `artwork` | song and playback state | playback state | Playback controls require rectangular rendering. |
| `reminder` | `content`, `due_datetime` | `mark_complete_action`, `priority`, `list_name` | reminder content and due time | `due_datetime`, `priority` | Mark complete requires rectangular rendering. |
| `weather` | `condition`, `current_temperature`, `high_temperature`, `low_temperature` | `rain_chance`, `wind`, `location` | current temperature and condition | `current_temperature`, `high_temperature`, `low_temperature`, `rain_chance` | Show rain chance when condition includes rain. Show wind only when specifically requested. |
| `checklist` | `items` | `completed_items`, `title`, `progress`, `due_datetime` | checklist items | `progress`, `due_datetime` | The checklist list itself must be rectangular and scrollable. |

## Content Type Definitions

```yaml
content_types:
  workout:
    purpose: Show active or recent workout progress and effort.
    use_when:
      - user asks about a workout
      - context includes exercise, calories, elapsed time, or workout progress
    metadata:
      required:
        workout_type: string
        duration: duration
        calories_burned: number
      optional:
        calorie_goal: number
        past_week_average: number
        elapsed_time: duration
        progress: number
    presentation_affordances:
      primary: workout_summary
      splittable_metrics:
        - duration
        - calories_burned
        - progress
      detail_fields:
        - workout_type
        - calorie_goal
        - past_week_average

  activity_summary:
    purpose: Compare sitting, standing, and walking time to recent behavior.
    metadata:
      required:
        sitting_time: duration
        standing_time: duration
        walking_time: duration
      optional:
        last_three_day_average: object
        trend: string
    presentation_affordances:
      primary: activity_summary
      splittable_metrics:
        - sitting_time
        - standing_time
        - walking_time
      detail_fields:
        - last_three_day_average
        - trend

  upcoming_event:
    purpose: Show the next calendar event.
    metadata:
      required:
        time: datetime_or_time
        event_name: string
      optional:
        location: string
        travel_time: duration
        calendar_name: string
    presentation_affordances:
      primary: event_name_with_time
      splittable_metrics:
        - time
        - travel_time
      detail_fields:
        - event_name
        - location
        - calendar_name

  timer:
    purpose: Show an inferred or active countdown.
    metadata:
      required:
        timer_label: string
        countdown: duration
      optional:
        start_action: action
        pause_action: action
        cancel_action: action
        total_duration: duration
        remaining_seconds: number
    presentation_affordances:
      primary: countdown
      splittable_metrics:
        - countdown
        - progress
      detail_fields:
        - timer_label
      control_fields:
        - start_action
        - pause_action
        - cancel_action
    rules:
      - Visible controls require rectangular rendering.

  heart_rate:
    purpose: Show the latest heart rate reading and optional activity range.
    metadata:
      required:
        last_reading: number
      optional:
        time_since_last_reading: duration
        activity_high: number
        activity_low: number
        activity_type: string
    presentation_affordances:
      primary: last_reading
      splittable_metrics:
        - last_reading
        - activity_high
        - activity_low
      detail_fields:
        - time_since_last_reading
        - activity_type

  last_message:
    purpose: Show the latest message preview.
    metadata:
      required:
        sender: string
        content: string
      optional:
        timestamp: datetime_or_time
        app: string
        unread_count: number
    presentation_affordances:
      primary: sender_and_content
      splittable_metrics:
        - unread_count
      detail_fields:
        - sender
        - content
        - timestamp
        - app
    rules:
      - Message previews need rectangular text space unless reduced to unread count.

  iot_control:
    purpose: Show smart device status and optional setpoint or control state.
    metadata:
      required:
        device_name: string
        status: string
      optional:
        current_value: number_or_string
        set_value: number_or_string
        room: string
        control_action: action
    presentation_affordances:
      primary: device_status
      splittable_metrics:
        - status
        - current_value
        - set_value
      detail_fields:
        - device_name
        - room
      control_fields:
        - control_action
    rules:
      - Visible controls require rectangular rendering.

  map_navigation:
    purpose: Show navigation timing and travel conditions.
    metadata:
      required:
        destination: string
        traffic_condition: string
        travel_time: duration
      optional:
        time_to_leave: datetime_or_time
        distance: distance
        next_step: string
    presentation_affordances:
      primary: destination_and_travel_time
      splittable_metrics:
        - travel_time
        - time_to_leave
        - distance
      detail_fields:
        - destination
        - traffic_condition
        - next_step

  sleep_summary:
    purpose: Show sleep quality, score, duration, and optional trend.
    metadata:
      required:
        quality_rating: string
        score: number
        hours_asleep: duration
      optional:
        trend: string
        sleep_goal: duration
        previous_average: duration
    presentation_affordances:
      primary: sleep_score_or_summary
      splittable_metrics:
        - quality_rating
        - score
        - hours_asleep
      detail_fields:
        - trend
        - sleep_goal
        - previous_average

  music_control:
    purpose: Show current music and playback controls.
    metadata:
      required:
        song: string
        play_pause_action: action
      optional:
        album: string
        artist: string
        next_action: action
        previous_action: action
        artwork: image
    presentation_affordances:
      primary: song_and_playback_state
      splittable_metrics:
        - playback_state
      detail_fields:
        - song
        - album
        - artist
        - artwork
      control_fields:
        - play_pause_action
        - next_action
        - previous_action
    rules:
      - Visible playback controls require rectangular rendering.

  reminder:
    purpose: Show a reminder and due time.
    metadata:
      required:
        content: string
        due_datetime: datetime
      optional:
        mark_complete_action: action
        priority: string
        list_name: string
    presentation_affordances:
      primary: content_and_due_time
      splittable_metrics:
        - due_datetime
        - priority
      detail_fields:
        - content
        - list_name
      control_fields:
        - mark_complete_action
    rules:
      - Visible mark complete controls require rectangular rendering.

  weather:
    purpose: Show current weather and daily temperature range.
    metadata:
      required:
        condition: string
        current_temperature: number
        high_temperature: number
        low_temperature: number
      optional:
        rain_chance: percent
        wind: speed
        location: string
    presentation_affordances:
      primary: current_temperature_and_condition
      splittable_metrics:
        - current_temperature
        - high_temperature
        - low_temperature
        - rain_chance
      detail_fields:
        - condition
        - location
      conditional_fields:
        rain_chance: Show when condition includes rain.
        wind: Show only when specifically requested from context input.

  checklist:
    purpose: Show a scrollable list of checklist items.
    metadata:
      required:
        items: array
      optional:
        completed_items: array
        title: string
        progress: number
        due_datetime: datetime
    presentation_affordances:
      primary: checklist_items
      splittable_metrics:
        - progress
        - due_datetime
      detail_fields:
        - title
        - items
        - completed_items
    rules:
      - The checklist list itself must be rectangular and scrollable.
```
