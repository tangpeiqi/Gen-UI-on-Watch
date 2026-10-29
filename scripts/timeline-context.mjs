// Compare local day offsets and clock minutes, avoiding host-timezone and DST assumptions.
export function clockMinutes(value) {
  const text = String(value || "").trim().replace(/^(today|tomorrow)\s*[, ]\s*/i, "");
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (minute > 59 || (match[3] ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (match[3]) hour = hour % 12 + (/pm/i.test(match[3]) ? 12 : 0);
  return hour * 60 + minute;
}

export function runtimeTimelineMinute(context = {}, now = new Date(), timeZone = "America/Los_Angeles") {
  const input = String(context.timeOfDay || "");
  const day = context.dateOffset ?? ({ today: 0, tomorrow: 1 }[String(context.relativeDay || "").toLowerCase()])
    ?? (/^tomorrow\b/i.test(input) ? 1 : 0);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const localMinute = Number(parts.find(p => p.type === "hour").value) * 60 + Number(parts.find(p => p.type === "minute").value);
  const minute = input ? clockMinutes(input) : localMinute;
  return Number.isInteger(day) && minute !== null ? day * 1440 + minute : null;
}

export function entryTimelineMinute(entry) {
  const day = entry.dateOffset ?? ({ today: 0, tomorrow: 1 }[entry.relativeDay]);
  const minute = clockMinutes(entry.time);
  return Number.isInteger(day) && minute !== null ? day * 1440 + minute : null;
}

export function latestReceivedMessage(timeline, reference) {
  if (reference === null) return null;
  return timeline.filter(e => e.kind === "message" && e.direction === "received")
    .map(entry => ({ entry, time: entryTimelineMinute(entry) }))
    .filter(e => e.time !== null && e.time <= reference)
    .sort((a, b) => b.time - a.time)[0]?.entry ?? null;
}

export function nextCalendarEvent(timeline, reference, predicate = () => true) {
  if (reference === null) return null;
  return timeline.filter(e => e.kind === "calendar_event" && predicate(e))
    .map(entry => ({ entry, time: entryTimelineMinute(entry) }))
    .filter(e => e.time !== null && e.time >= reference)
    .sort((a, b) => a.time - b.time)[0]?.entry ?? null;
}

export function latestSnapshot(timeline, reference, kind, { sameDay = false, predicate = () => true } = {}) {
  if (reference === null) return null;
  return timeline.filter(e => e.kind === kind && predicate(e))
    .map(entry => ({ entry, time: entryTimelineMinute(entry) }))
    .filter(e => e.time !== null && e.time <= reference && (!sameDay || Math.floor(e.time / 1440) === Math.floor(reference / 1440)))
    .sort((a, b) => b.time - a.time)[0]?.entry ?? null;
}

export function heartRateAt(timeline, reference) {
  const latest = latestSnapshot(timeline, reference, "heart_rate_reading", { sameDay: true, predicate: e => Number.isFinite(e.bpm) });
  if (!latest) return null;
  const readings = timeline.filter(e => e.kind === "heart_rate_reading" && Number.isFinite(e.bpm))
    .filter(e => { const t = entryTimelineMinute(e); return t !== null && t <= reference && Math.floor(t / 1440) === Math.floor(reference / 1440); });
  return { last_reading: latest.bpm, time_since_last_reading: reference - entryTimelineMinute(latest), today_high: Math.max(...readings.map(e => e.bpm)), today_low: Math.min(...readings.map(e => e.bpm)) };
}

// Reminder due times rank information; this prototype does not track completion.
export function selectReminder(timeline, reference, context = {}) {
  if (reference === null) return null;
  const day = Math.floor(reference / 1440);
  const candidates = timeline.filter(e => e.kind === "reminder").map(entry => {
    const due = entry.due || entry;
    const offset = entry.dateOffset ?? ({ today: 0, tomorrow: 1 }[due.relativeDay]);
    const minute = clockMinutes(due.time);
    // Bedtime is a day-end window, not an invented exact clock time.
    const time = Number.isInteger(offset) ? offset * 1440 + (minute ?? (due.time === "before bedtime" ? 1440 : NaN)) : NaN;
    return { entry, time, day: offset };
  }).filter(e => e.day === day && Number.isFinite(e.time));
  const ignored = new Set(["show", "my", "me", "the", "a", "an", "next", "remind", "reminder", "reminders", "to", "i", "need", "please", "about", "for", "today", "what", "do"]);
  const words = `${context.goal || ""} ${context.activity || ""}`.toLowerCase().match(/[a-z]{3,}/g)?.filter(w => !ignored.has(w)) || [];
  const scored = candidates.map(c => ({ ...c, score: words.filter(w => (c.entry.title || "").toLowerCase().includes(w)).length }));
  const bestScore = Math.max(0, ...scored.map(c => c.score));
  const relevant = bestScore ? scored.filter(c => c.score === bestScore) : scored;
  return relevant.filter(c => c.time >= reference).sort((a, b) => a.time - b.time)[0]?.entry
    ?? relevant.filter(c => c.time < reference).sort((a, b) => b.time - a.time)[0]?.entry ?? null;
}

export function currentWeatherTemperature(timeline, reference) {
  return latestSnapshot(timeline, reference, "weather_temperature_reading", {
    sameDay: true, predicate: entry => Number.isFinite(entry.currentTemperatureF)
  })?.currentTemperatureF ?? null;
}
