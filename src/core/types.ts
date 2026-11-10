export type DeadlineKind = "due" | "closes" | "event";
export type Source = "brightspace" | "canvas" | "moodle" | "generic";

export interface Deadline {
  // The kind of deadline it is  
  kind: DeadlineKind;
  // The course code for the deadline
  course: string;
  // Name of the course (optional)
  courseName?: string;
  // The title of the deadline
  title: string;
  // The due date of the deadline
  due: string;
  // Whether the deadline is an all-day event or not
  allDay: boolean;
  // The URL for the deadline (optional)
  url?: string;
  // The source of the deadline
  source: Source;
}

