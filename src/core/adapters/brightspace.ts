import type { Deadline, DeadlineKind, RawEvent } from "../types.js";
import { endOfDay, findCourseCode, firstLink } from "./shared.js";

// " - Due", " - Available", " - Availability Ends"... at the END of a title, any capitalization
const SUFFIX = /\s+-\s+(available|availability starts?|due|availability ends?|end date|start date)\s*$/i;

// Which markers mean "opens" (skip it) and which mean "closes".
const STARTS = /^(available|availability starts?|start date)$/i;
const ENDS = /^(availability ends?|end date)$/i;

// Instructor events with no marker are kept only if they mention one of these words
const WORTH_KEEPING = /\b(exam|midterm|test|quiz|deadline|due|submi(t|ssion)|presentation|project|essay|report)\b/i;

/** This is to primarily account for how MLS has its location field formatted as it can sometimes be 
"Building Name (Org Unit)" and this extracts the Org Unit from the location field.*/
export function orgUnit(location: string): string {
    if (location.trim().match(/\(([^()]+)\)\s*$/)) {
        return location.trim().match(/\(([^()]+)\)\s*$/)![1]!;
    }
    return location.trim();
}

// // Brightspace names courses "CODE - Name", so the full name is everything after the first " - " (e.g. "Data Structures II"); undefined if there's no " - "
export function courseName(unit: string): string | undefined {
  const i = unit.indexOf(" - ");
  if (i === -1) return undefined;
  return unit.slice(i + 3).trim();
}
/** Turn one Brightspace event into a Deadline, or null if it isn't a deadline. */
export function brightspaceDeadline(event: RawEvent): Deadline | null {
  // Step 1: is it a deadline, and what kind?
  const summary = event.summary.trim();
  const marker = summary.match(SUFFIX)?.[1];

  let kind: DeadlineKind;
  if (!marker) {
    if (!WORTH_KEEPING.test(summary)) return null;
    kind = /\bdue\b/i.test(summary) ? "due" : "event";
  } else if (STARTS.test(marker)) {
    return null;
  } else {
    kind = ENDS.test(marker) ? "closes" : "due";
  }

  // Step 2: which course?
  const unit = orgUnit(event.location);
  const code = findCourseCode(unit, summary);

  // Step 3: build the clean Deadline.
  return {
    kind,
    course: code ?? (unit || "Other"),
    courseName: code ? courseName(unit) : undefined,
    title: summary.replace(SUFFIX, "") || "Untitled",
    due: event.allDay ? endOfDay(event.start) : event.start,
    allDay: event.allDay,
    url: event.url ?? firstLink(event.description),
    source: "brightspace",
  };
}
