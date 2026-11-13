import { describe, expect, it } from "vitest";
import { brightspaceDeadline, courseName, orgUnit } from "../src/core/adapters/brightspace.js";
import type { RawEvent } from "../src/core/types.js";

// Builds a RawEvent for a test. Pass only the fields that matter; the rest get sensible defaults.
function event(fields: Partial<RawEvent>): RawEvent {
  return {
    uid: "test",
    summary: "",
    location: "",
    description: "",
    categories: [],
    start: new Date("2026-11-07T04:59:00Z"),
    allDay: false,
    ...fields,
  };
}

const CP264 = "CP-264-A - Data Structures II";

describe("orgUnit", () => {
  it.each([
    [CP264, CP264],
    ["Waterloo Campus LH 3094 (EC-120-VA2 - Intro To Microeconomics)", "EC-120-VA2 - Intro To Microeconomics"],
    ["N1002 (Laurier Computing Society)", "Laurier Computing Society"],
  ])("%s → %s", (input, expected) => {
    expect(orgUnit(input)).toBe(expected);
  });
});

describe("courseName", () => {
  it("is the part after the first ' - '", () => {
    expect(courseName(CP264)).toBe("Data Structures II");
    expect(courseName("CP-220-PC-220-Waterloo Labs - Digital Electronics")).toBe("Digital Electronics");
  });

  it("is undefined when there is no ' - '", () => {
    expect(courseName("Laurier Computing Society")).toBeUndefined();
  });
});

describe("brightspaceDeadline", () => {
  it("turns a '- Due' event into a due deadline", () => {
    const d = brightspaceDeadline(event({ summary: "Assignment 04 - Due", location: CP264 }));
    expect(d).toMatchObject({
      kind: "due",
      course: "CP264",
      courseName: "Data Structures II",
      title: "Assignment 04",
      source: "brightspace",
    });
  });

  it("matches suffixes in any capitalization", () => {
    expect(brightspaceDeadline(event({ summary: "Lab 1 - due", location: CP264 }))?.title).toBe("Lab 1");
  });

  it("drops 'Available' and 'Availability Starts' markers", () => {
    expect(brightspaceDeadline(event({ summary: "Lab 07 - Available", location: CP264 }))).toBeNull();
    expect(brightspaceDeadline(event({ summary: "Quiz 2 - Availability Starts", location: CP264 }))).toBeNull();
  });

  it("turns 'Availability Ends' into a closes deadline", () => {
    const d = brightspaceDeadline(event({ summary: "Quiz 6 (Week 7) - Availability Ends", location: CP264 }));
    expect(d).toMatchObject({ kind: "closes", title: "Quiz 6 (Week 7)" });
  });

  it("keeps instructor events that sound important, as events", () => {
    const midterm = brightspaceDeadline(
      event({ summary: "Midterm", location: "Waterloo Campus LH 3094 (EC-120-VA2 - Intro To Microeconomics)" }),
    );
    expect(midterm).toMatchObject({ kind: "event", course: "EC120", courseName: "Intro To Microeconomics" });

    const form = brightspaceDeadline(event({ summary: "Deadline for Final Exam Off Campus Proctor Form", location: CP264 }));
    expect(form?.kind).toBe("event");
  });

  it("treats instructor events that say 'due' as due", () => {
    expect(brightspaceDeadline(event({ summary: "CH 6 due", location: CP264 }))).toMatchObject({ kind: "due", title: "CH 6 due" });
  });

  it("drops instructor noise", () => {
    expect(brightspaceDeadline(event({ summary: "WEEK 8", location: CP264 }))).toBeNull();
    expect(brightspaceDeadline(event({ summary: "Study break with therapy dogs", location: CP264 }))).toBeNull();
  });

  it("falls back to the location text, then 'Other', when there's no course code", () => {
    const centre = brightspaceDeadline(event({ summary: "Exam review", location: "Student Success Centre" }));
    expect(centre).toMatchObject({ course: "Student Success Centre", courseName: undefined });
    expect(brightspaceDeadline(event({ summary: "Exam review" }))?.course).toBe("Other");
  });

  it("moves date-only items to 11:59 PM", () => {
    const d = brightspaceDeadline(
      event({ summary: "Project Phase II - Due", location: CP264, start: new Date(2026, 10, 5), allDay: true }),
    )!;
    expect(d.allDay).toBe(true);
    expect([d.due.getHours(), d.due.getMinutes()]).toEqual([23, 59]);
  });

  it("uses the event's URL, or else the first link in the description", () => {
    const withUrl = event({ summary: "A1 - Due", location: CP264, url: "https://a.example/1" });
    expect(brightspaceDeadline(withUrl)?.url).toBe("https://a.example/1");

    const inDescription = event({ summary: "A1 - Due", location: CP264, description: "A1 - https://a.example/dropbox/1" });
    expect(brightspaceDeadline(inDescription)?.url).toBe("https://a.example/dropbox/1");
  });
});
