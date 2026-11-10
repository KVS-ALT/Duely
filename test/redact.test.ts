import { describe, expect, it } from "vitest";
import { redact, scrub } from "../src/core/redact.js";

// A fake feed link shaped like a real Brightspace one. The token is the secret part.
const TOKEN = "s3cr3tT0k3n";
const FEED = `https://learn.school.ca/d2l/le/calendar/feed/user/feed.ics?token=${TOKEN}`;

describe("redact", () => {
  it("keeps only the protocol and host", () => {
    expect(redact(FEED)).toBe("https://learn.school.ca/…");
  });

  it("never contains the token", () => {
    expect(redact(FEED)).not.toContain(TOKEN);
  });

  it("returns a placeholder for text that isn't a URL", () => {
    expect(redact("not a link")).toBe("<feed url>");
  });
});

describe("scrub", () => {
  it("replaces every copy of the URL inside a message", () => {
    const message = `Failed to load ${FEED}, retried ${FEED}`;
    expect(scrub(message, FEED)).toBe("Failed to load https://learn.school.ca/…, retried https://learn.school.ca/…");
  });

  it("leaves the message alone when there is no URL to hide", () => {
    expect(scrub("Something broke", undefined)).toBe("Something broke");
  });
});
