import { sync, type VEvent } from "node-ical";
import type { RawEvent } from "./types.js";

/** node-ical gives some fields as text and some as { val: text } so have to always return plain text ("" if missing). */
function text(value: unknown): string {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && "val" in value) return String(value.val);
    return "";
}

/** Read calendar text and return its events as clean RawEvent objects, skipping cancelled ones. */
export function readEvents(ics: string): RawEvent[] {
  const calendar = sync.parseICS(ics);
  const events: RawEvent[] = [];

  for (const item of Object.values(calendar)) {
    if (!item || item.type !== "VEVENT") continue;
    const e = item as VEvent;
    if (e.status === "CANCELLED") continue;

    events.push({
      uid: e.uid,
      summary: text(e.summary),
      location: text(e.location),
      description: text(e.description),
      categories: e.categories ?? [],
      start: e.start,
      end: e.end,
      allDay: e.datetype === "date",
      url: typeof e.url === "string" ? e.url : undefined,
    });
  }

  return events;
}

