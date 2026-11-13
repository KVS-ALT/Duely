/*
 * Small text helpers that every LMS adapter uses
 */

/** Descriptions are often HTML so have to strip the tags and common entities and get rid of extra spaces */
export function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ") // line breaks become spaces
    .replace(/<[^>]+>/g, "") // remove every <tag>
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ") // many spaces/newlines in a row become one space
    .trim();
}

/** The first web link inside some text, or undefined if there isn't one. */
export function firstLink(text: string): string | undefined {
  return text.match(/https?:\/\/[^\s"'<>]+/)?.[0];
}

// Course code can be two to five capital letters, an optional space or dash, then 3-4 digits and an optional letter
const COURSE_CODE = /\b([A-Z]{2,5})[\s-]?(\d{3,4}[A-Z]?)\b/g;

// Words that look like codes but aren't, e.g. "FALL 2026"
const NOT_COURSES = new Set(["FALL", "WINTR", "SPRG", "SUMR", "TERM", "YEAR", "WEEK", "UNIT", "QUIZ", "TEST", "LAB", "PART", "ROOM"]);

export function findCourseCode(...texts: string[]): string | undefined {
  for (const text of texts){
    for (const m of text.matchAll(COURSE_CODE)) {
      if (!NOT_COURSES.has(m[1]!)) {
        return `${m[1]}${m[2]}`;
      }
    }
  }
  return undefined;
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59);
}

