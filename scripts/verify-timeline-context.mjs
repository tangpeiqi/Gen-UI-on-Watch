import assert from "node:assert/strict";
import fs from "node:fs";
import { clockMinutes, runtimeTimelineMinute, latestReceivedMessage, nextCalendarEvent } from "./timeline-context.mjs";
const { timeline } = JSON.parse(fs.readFileSync("demo-data/pseudo-context.json", "utf8"));
const at = timeOfDay => runtimeTimelineMinute({ timeOfDay }, new Date("2026-10-29T20:30:00Z"));
assert.equal(latestReceivedMessage(timeline, at("1:00 PM")), null);
assert.equal(latestReceivedMessage(timeline, at("1:30 PM")).sender, "Jordan");
assert.equal(latestReceivedMessage(timeline, at("1:31 PM")).sender, "Jordan");
assert.equal(latestReceivedMessage(timeline, at("1:42 PM")).sender, "Priya");
assert.equal(latestReceivedMessage(timeline, at("2:05 PM")).sender, "Alex");
assert.equal(nextCalendarEvent(timeline, at("1:30 PM")).title, "Design review");
assert.equal(nextCalendarEvent(timeline, at("1:31 PM")).title, "One-on-one with manager");
assert.equal(nextCalendarEvent(timeline, at("10:00 PM")).relativeDay, "tomorrow");
assert.equal(nextCalendarEvent(timeline, at("tomorrow 10:00 PM")), null);
assert.equal(nextCalendarEvent(timeline, at("10:00 PM"), e => /dinner/i.test(e.title)).relativeDay, "tomorrow");
assert.equal(nextCalendarEvent(timeline, at("tomorrow 10:00 PM"), e => /dinner/i.test(e.title)), null);
assert.equal(clockMinutes("00:00"), 0);
assert.equal(clockMinutes("12:00 AM"), 0);
assert.equal(clockMinutes("12:00 PM"), 720);
assert.equal(clockMinutes("25:00"), null);
assert.equal(clockMinutes("before bedtime"), null);
assert.equal(runtimeTimelineMinute({}, new Date("2026-10-30T06:30:00Z")), 23 * 60 + 30);
assert.equal(runtimeTimelineMinute({ relativeDay: "tomorrow", timeOfDay: "8:00 AM" }), 1440 + 480);
assert.equal(latestReceivedMessage([...timeline].reverse(), at("1:30 PM")).sender, "Jordan");
assert.equal(nextCalendarEvent([...timeline].reverse(), at("1:30 PM")).title, "Design review");
assert.equal(nextCalendarEvent(timeline, at("invalid")), null);
console.log("Timeline lookups: timestamps, received-only messages, event boundaries, day rollover, timezone, invalid inputs, and unsorted entries verified.");

const { latestSnapshot, heartRateAt, selectReminder } = await import("./timeline-context.mjs");
assert.equal(latestSnapshot(timeline, at("11:59 AM"), "activity_summary", { sameDay: true }), null);
assert.equal(latestSnapshot(timeline, at("12:00 PM"), "activity_summary", { sameDay: true }).metadata.sitting_time.value, 180);
assert.equal(latestSnapshot(timeline, at("5:01 PM"), "activity_summary", { sameDay: true }).metadata.sitting_time.value, 390);
assert.equal(latestSnapshot(timeline, at("tomorrow 1:30 PM"), "activity_summary", { sameDay: true }), null);
assert.equal(heartRateAt(timeline, at("7:59 AM")), null);
assert.deepEqual(heartRateAt(timeline, at("12:15 PM")), {last_reading:79,time_since_last_reading:15,today_high:82,today_low:70});
assert.equal(heartRateAt(timeline, at("12:30 PM")).today_high,108);
assert.equal(heartRateAt(timeline, at("tomorrow 1:30 PM")), null);
assert.equal(latestSnapshot(timeline, at("12:59 PM"), "iot_snapshot").thermostat.currentTemperatureF,70);
assert.equal(latestSnapshot(timeline, at("1:00 PM"), "iot_snapshot").thermostat.currentTemperatureF,65);
assert.equal(latestSnapshot(timeline, at("6:44 PM"), "iot_snapshot").thermostat.currentTemperatureF,64);
assert.equal(latestSnapshot(timeline, at("6:45 PM"), "iot_snapshot").thermostat.currentTemperatureF,69);
assert.equal(latestSnapshot(timeline, at("6:00 AM"), "iot_snapshot"), null);
assert.equal(selectReminder(timeline, at("1:30 PM")).title,"Review notes before one-on-one");
assert.equal(selectReminder(timeline, at("2:45 PM")).title,"Review notes before one-on-one");
assert.equal(selectReminder(timeline, at("1:30 PM"), {goal:"remind me to pick up groceries"}).title,"Pick up groceries after work");
assert.equal(selectReminder(timeline, at("tomorrow 9:00 AM")).title,"Confirm dental appointment paperwork");
assert.equal(selectReminder(timeline, at("today 10:00 PM")).title,"Charge watch before bed");
assert.equal(selectReminder(timeline.map(e=>({...e,completed:true})),at("1:30 PM")).title,"Review notes before one-on-one");
console.log("Activity, heart-rate, device snapshots, and due-time reminders verified without completion-state handling.");

const { loadDesignPack, generateFallbackWatchUi } = await import("./fallback-generator.mjs");
const designPack = loadDesignPack();
for (const [goal, timeOfDay, expected] of [
  ["activity summary", "1:30 PM", "Sit 180m"], ["activity summary", "5:30 PM", "Sit 390m"],
  ["heart rate", "12:15 PM", "79"], ["control thermostat", "1:30 PM", "65 F"],
  ["show reminders", "1:30 PM", "Review notes before one-on-one"],
  ["activity summary", "9:00 AM", "No activity summary yet"], ["heart rate", "7:00 AM", "No reading yet"]
]) {
  const result = generateFallbackWatchUi({ context: { goal, timeOfDay, location: "Office" }, designPack, now: new Date("2026-10-29T20:30:00Z") });
  assert.ok(JSON.stringify(result.layout.widgets).includes(expected), goal);
  assert.ok(result.validation.ok, JSON.stringify(result.validation.errors));
}
console.log("Seven data-backed and missing-data fallback layouts validated.");

const { currentWeatherTemperature } = await import("./timeline-context.mjs");
assert.equal(currentWeatherTemperature(timeline, at("6:59 AM")), null);
assert.equal(currentWeatherTemperature(timeline, at("7:00 AM")), 52);
assert.equal(currentWeatherTemperature(timeline, at("12:45 PM")), 58);
assert.equal(currentWeatherTemperature(timeline, at("1:00 PM")), 60);
assert.equal(currentWeatherTemperature(timeline, at("1:59 PM")), 60);
assert.equal(currentWeatherTemperature(timeline, at("tomorrow 1:00 PM")), null);
assert.equal(currentWeatherTemperature([...timeline].reverse(), at("1:00 PM")), 60);
console.log("Hourly weather lookup verified: no future or thermostat readings, exact-hour boundaries, and forecast-only tomorrow.");
