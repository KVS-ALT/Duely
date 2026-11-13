import { describe, expect, it } from "vitest";
import { endOfDay, findCourseCode, firstLink, plainText } from "../src/core/adapters/shared.js";

describe("findCourseCode", () => {
  // it.each runs the same test once per row: [input, expected answer]
  it.each([
    ["CP-264-A - Data Structures II", "CP264"],
    ["CP-220-PC-220-Waterloo Labs", "CP220"],
    ["EC-120-VA2 - Intro To Microeconomics", "EC120"],
    ["CS 135 Fall", "CS135"],
    ["COMP-1010", "COMP1010"],
    ["MATH1229A Calculus", "MATH1229A"],
  ])("finds the code in %s", (input, expected) => {
    expect(findCourseCode(input)).toBe(expected);
  });

  it("ignores words that only look like codes", () => {
    expect(findCourseCode("FALL 2026 Seminar")).toBeUndefined();
    expect(findCourseCode("WEEK 1010 review")).toBeUndefined();
  });

  it("returns undefined when there is no code", () => {
    expect(findCourseCode("Student Success Centre")).toBeUndefined();
  });

  it("checks each text in order and returns the first code found", () => {
    expect(findCourseCode("Midterm", "CP-213-A - OOP")).toBe("CP213");
    expect(findCourseCode("CP-264-A", "CP-213-A")).toBe("CP264");
  });
});

describe("endOfDay", () => {
  it("moves a date to 11:59 PM on the same day, local time", () => {
    const d = endOfDay(new Date(2026, 10, 5, 0, 0)); // Nov 5 (months count from 0!)
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 10, 5, 23, 59]);
  });
});

describe("plainText and firstLink (written for you)", () => {
  it("strips HTML", () => {
    expect(plainText("<p>Open&nbsp;book <b>quiz</b></p>")).toBe("Open book quiz");
  });

  it("finds the first link", () => {
    expect(firstLink("Quiz - https://a.example/q?id=3\nView - https://a.example/cal")).toBe("https://a.example/q?id=3");
    expect(firstLink("no links here")).toBeUndefined();
  });
});
