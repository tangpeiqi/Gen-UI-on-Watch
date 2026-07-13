# Widget Content Types

This document defines semantic widget types for the generative UI agent. Use it with `watch-face-generation-rules.md`: this file decides what information a widget represents, while the watch-face rules decide geometry, placement, sizing, and validation.

The agent should choose a semantic content type first, extract metadata second, and choose one or more rendered widgets third. A content type is not limited to one shape. For example, `activity_summary` may render as one rectangular summary or as three circular widgets for sitting, standing, and walking time.

## Selection Contract

```yaml
semantic_widget_selection:
  steps:
    - read_user_context
    - infer_semantic_widget_type
    - extract_required_metadata
    - extract_available_optional_metadata
    - choose_rendering_strategy
    - expand_into_one_or_more_rendered_widgets
    - map_each_rendered_widget_to_circular_or_rectangular_shape
    - validate_against_watch_face_generation_rules

  rules:
    - id: semantic-before-shape
      strictness: must
      rule: Choose the semantic content type before choosing circular or rectangular shape.

    - id: one-type-many-widgets
      strictness: must
      rule: A single semantic content type may render as multiple widgets when separate metadata fields are clearer as individual glanceable metrics.

    - id: required-metadata-first
      strictness: must
      rule: Required metadata must be prioritized over optional metadata.

    - id: optional-only-when-available
      strictness: must
      rule: Optional metadata should render only when available from context or specifically requested.

    - id: controls-use-rectangular
      strictness: must
      rule: If the rendered widget includes buttons or controls, use a rectangular widget.
```

## Rendering Strategy Columns

Use the following terms in the content type table:

- `single_circular`: One circular widget for a single metric, status, progress ring, or short value.
- `multi_circular`: Multiple circular widgets from one semantic type, usually one per metric.
- `single_rectangular`: One rectangular widget for multi-line text, controls, lists, timelines, or dense summaries.
- `mixed`: A combination of circular and rectangular widgets from one semantic type.
- `not_recommended`: Avoid this strategy unless the user context strongly requires it.

## Content Type Summary

| Type | Required Metadata | Optional Metadata | Recommended Rendering Strategies | Shape Rules |
|---|---|---|---|---|
| `workout` | `workout_type`, `duration`, `calories_burned` | `calorie_goal`, `past_week_average`, `elapsed_time`, `progress` | `single_rectangular`, `multi_circular`, `mixed` | Use `multi_circular` for type/duration/calories as separate glanceable metrics. Use `single_rectangular` when comparing calories to goal or past week average. |
| `activity_summary` | `sitting_time`, `standing_time`, `walking_time` | `last_three_day_average`, `trend` | `multi_circular`, `single_rectangular` | Prefer `multi_circular` when each activity time is equally important. Use `single_rectangular` when comparison text or trend explanation matters. |
| `upcoming_event` | `time`, `event_name` | `location`, `travel_time`, `calendar_name` | `single_rectangular`, `mixed` | Use `single_rectangular` for event name plus details. Use `mixed` only when the time deserves a circular countdown or time badge beside a rectangular event card. |
| `timer` | `timer_label`, `countdown` | `start_action`, `pause_action`, `cancel_action`, `total_duration`, `remaining_seconds` | `single_circular`, `single_rectangular` | Use `single_circular` when there are no visible buttons. Use `single_rectangular` whenever start, pause, or cancel buttons are shown. |
| `heart_rate` | `last_reading` | `time_since_last_reading`, `activity_high`, `activity_low`, `activity_type` | `single_circular`, `single_rectangular`, `mixed` | Use `single_circular` for last reading. Use `single_rectangular` or `mixed` when high/low and activity context are shown together. |
| `last_message` | `sender`, `content` | `timestamp`, `app`, `unread_count` | `single_rectangular` | Text preview needs horizontal space. Circular rendering is `not_recommended` unless reduced to unread count or sender initials. |
| `iot_control` | `device_name`, `status` | `current_value`, `set_value`, `room`, `control_action` | `single_rectangular`, `single_circular`, `mixed` | Use `single_circular` for simple on/off or lock status. Use `single_rectangular` when current value, set value, or controls are visible. |
| `map_navigation` | `destination`, `traffic_condition`, `travel_time` | `time_to_leave`, `distance`, `next_step` | `single_rectangular`, `mixed` | Use `single_rectangular` for destination and traffic. Use `mixed` when travel time or leave time is promoted as a circular metric. |
| `sleep_summary` | `quality_rating`, `score`, `hours_asleep` | `trend`, `sleep_goal`, `previous_average` | `single_rectangular`, `multi_circular`, `mixed` | Use `multi_circular` for score, hours, and quality as separate metrics. Use `single_rectangular` when trend or comparison copy is important. |
| `music_control` | `song`, `play_pause_action` | `album`, `artist`, `next_action`, `previous_action`, `artwork` | `single_rectangular` | Controls and song text require rectangular layout. Circular rendering is `not_recommended` unless showing only play/pause status. |
| `reminder` | `content`, `due_datetime` | `mark_complete_action`, `priority`, `list_name` | `single_rectangular`, `mixed` | Use `single_rectangular` for content plus due time. Use `mixed` only when due time is separated as a circular urgency badge. |
| `weather` | `condition`, `current_temperature`, `high_temperature`, `low_temperature` | `rain_chance`, `wind`, `location` | `single_circular`, `single_rectangular`, `multi_circular`, `mixed` | Show `rain_chance` when condition includes rain. Show `wind` only when specifically requested from context. Use circular gauge for current/high/low, rectangular for detailed conditions. |
| `checklist` | `items` | `completed_items`, `title`, `progress`, `due_datetime` | `single_rectangular`, `mixed` | The checklist list itself must be rectangular and scrollable. Use `mixed` only when progress is also promoted to a circular widget. |

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
    rendering_strategies:
      - id: workout_summary_card
        strategy: single_rectangular
        use_when:
          - calories need comparison to a goal or past week average
          - workout type and duration need text labels
      - id: workout_metric_rings
        strategy: multi_circular
        use_when:
          - workout_type, duration, and calories_burned can each be represented as compact metrics
      - id: workout_focus_plus_summary
        strategy: mixed
        use_when:
          - one metric is primary and the remaining metadata still needs text

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
    rendering_strategies:
      - id: activity_three_rings
        strategy: multi_circular
        use_when:
          - sitting, standing, and walking are equally important
      - id: activity_comparison_card
        strategy: single_rectangular
        use_when:
          - averages or trend labels need to be visible

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
    rendering_strategies:
      - id: event_card
        strategy: single_rectangular
      - id: event_time_badge_and_card
        strategy: mixed
        use_when:
          - event time or time until event should be visually emphasized

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
    rendering_strategies:
      - id: timer_countdown_ring
        strategy: single_circular
        use_when:
          - no visible controls are shown
      - id: timer_control_card
        strategy: single_rectangular
        use_when:
          - start_action, pause_action, or cancel_action is visible
    rules:
      - Buttons require rectangular rendering.

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
    rendering_strategies:
      - id: heart_rate_ring
        strategy: single_circular
      - id: heart_rate_range_card
        strategy: single_rectangular
      - id: heart_rate_ring_plus_range
        strategy: mixed

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
    rendering_strategies:
      - id: message_preview_card
        strategy: single_rectangular

  iot_control:
    purpose: Show smart device status and optional setpoint/control state.
    metadata:
      required:
        device_name: string
        status: string
      optional:
        current_value: number_or_string
        set_value: number_or_string
        room: string
        control_action: action
    rendering_strategies:
      - id: device_status_ring
        strategy: single_circular
        use_when:
          - status is the only displayed device value
      - id: device_control_card
        strategy: single_rectangular
        use_when:
          - current_value, set_value, or control_action is shown
      - id: device_status_plus_control
        strategy: mixed

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
    rendering_strategies:
      - id: navigation_card
        strategy: single_rectangular
      - id: travel_time_plus_navigation
        strategy: mixed

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
    rendering_strategies:
      - id: sleep_summary_card
        strategy: single_rectangular
      - id: sleep_metric_rings
        strategy: multi_circular
      - id: sleep_score_plus_summary
        strategy: mixed

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
    rendering_strategies:
      - id: music_control_card
        strategy: single_rectangular
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
    rendering_strategies:
      - id: reminder_card
        strategy: single_rectangular
      - id: reminder_due_badge_and_card
        strategy: mixed
        use_when:
          - due time or urgency should be emphasized separately

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
    rendering_strategies:
      - id: weather_temperature_gauge
        strategy: single_circular
      - id: weather_detail_card
        strategy: single_rectangular
      - id: weather_metric_rings
        strategy: multi_circular
      - id: weather_gauge_plus_detail
        strategy: mixed
    rules:
      - Show rain_chance when condition includes rain.
      - Show wind only if the user specifically asks for wind or context explicitly requests wind.

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
    rendering_strategies:
      - id: checklist_scroll_card
        strategy: single_rectangular
      - id: checklist_progress_plus_scroll_card
        strategy: mixed
        use_when:
          - progress should be promoted separately from the list
    rules:
      - The list container must be rectangular and scrollable.
```
