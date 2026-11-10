/** What kind of date this is: a due date, the moment something closes, or an event like a midterm. */
export type DeadlineKind = "due" | "closes" | "event";

/** Which LMS the feed came from. */
export type Source = "brightspace" | "canvas" | "moodle" | "generic";

/** One deadline, in the same shape no matter which LMS it came from. */
export interface Deadline {
  kind: DeadlineKind;
  /** Short course code, e.g. "CP264". Falls back to the full course name, or "Other". */
  course: string;
  /** Full course name when the feed has one, e.g. "Data Structures II". */
  courseName?: string;
  /** Cleaned-up item name, e.g. "Assignment 03". */
  title: string;
  /** When it's due. */
  due: Date;
  /** True when the feed gave only a date, no time. We treat those as 11:59 PM. */
  allDay: boolean;
  /** Link to the item in the LMS, if the feed has one. */
  url?: string;
  source: Source;
}
