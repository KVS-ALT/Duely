import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readEvents } from "../src/core/events.js";

// An anonymized copy of a real MyLS feed: 11 events, one of them cancelled.
const ics = readFileSync(new URL("./fixtures/brightspace.sample.ics", import.meta.url), "utf8");
const events = readEvents(ics);
const find = (summary: string) => events.find((e) => e.summary === summary);

describe("readEvents", () => {
  it("returns every event except cancelled ones", () => {
    expect(events).toHaveLength(10);
    expect(find("Cancelled Lab - Due")).toBeUndefined();
  });

  it("flattens summary, location and description into plain text", () => {
    const e = find("Assignment 04 - Due")!;
    expect(e.location).toBe("CP-264-A - Data Structures II");
    expect(e.description).toContain("https://learn.example.edu/d2l/lms/dropbox/1");
  });

  it("uses empty text and an empty list when a field is missing", () => {
    const e = find("Lab 07 - Available")!;
    expect(e.description).toBe("");
    expect(e.categories).toEqual([]);
    expect(e.url).toBeUndefined();
  });

  it("turns DTSTART into a real Date", () => {
    const e = find("Assignment 04 - Due")!;
    expect(e.start).toBeInstanceOf(Date);
    expect(e.start.toISOString()).toBe("2026-10-29T03:59:00.000Z");
  });

  it("marks date-only events as all-day", () => {
    expect(find("Project Phase II - Due")!.allDay).toBe(true);
    expect(find("Assignment 04 - Due")!.allDay).toBe(false);
  });

  it("keeps each event's UID", () => {
    expect(find("Midterm")!.uid).toBe("a6@example.edu");
  });
});
