import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FeedError, fetchFeed, isUrl, normalizeFeedUrl } from "../src/core/fetchFeed.js";

const TOKEN = "s3cr3tT0k3n";
const CALENDAR = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n";

// A tiny fake web server on this machine, so tests never touch the real internet.
//   /feed.ics -> a calendar      /gone -> 403 Forbidden      anything else -> an HTML page
let server: Server;
let base: string;

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url?.startsWith("/feed.ics")) res.writeHead(200, { "content-type": "text/calendar" }).end(CALENDAR);
    else if (req.url?.startsWith("/gone")) res.writeHead(403).end();
    else res.writeHead(200, { "content-type": "text/html" }).end("<html>Please log in</html>");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

// Runs fetchFeed and hands back the error it throws (the test fails if it doesn't throw).
async function errorFrom(feed: string): Promise<FeedError> {
  try {
    await fetchFeed(feed);
  } catch (err) {
    return err as FeedError;
  }
  throw new Error("expected fetchFeed to throw");
}

describe("isUrl", () => {
  it("accepts web and webcal links", () => {
    expect(isUrl("https://x.example/a.ics")).toBe(true);
    expect(isUrl("http://x.example/a.ics")).toBe(true);
    expect(isUrl("webcal://x.example/a.ics")).toBe(true);
  });

  it("treats anything else as a file path", () => {
    expect(isUrl("./feed.ics")).toBe(false);
    expect(isUrl("/home/keith/feed.ics")).toBe(false);
  });
});

describe("normalizeFeedUrl", () => {
  it("turns webcal:// into https:// and trims spaces", () => {
    expect(normalizeFeedUrl("  webcal://x.example/a.ics ")).toBe("https://x.example/a.ics");
  });

  it("leaves https links alone", () => {
    expect(normalizeFeedUrl("https://x.example/a.ics")).toBe("https://x.example/a.ics");
  });
});

describe("fetchFeed", () => {
  it("downloads a calendar", async () => {
    expect(await fetchFeed(`${base}/feed.ics?token=${TOKEN}`)).toContain("BEGIN:VCALENDAR");
  });

  it("reads a local .ics file", async () => {
    const path = new URL("./fixtures/brightspace.sample.ics", import.meta.url).pathname;
    expect(await fetchFeed(path)).toContain("BEGIN:VCALENDAR");
  });

  it("explains a missing local file", async () => {
    const err = await errorFrom("./no-such-file.ics");
    expect(err).toBeInstanceOf(FeedError);
    expect(err.message).toContain("Couldn't read");
  });

  it("explains an expired link without leaking the token", async () => {
    const err = await errorFrom(`${base}/gone?token=${TOKEN}`);
    expect(err).toBeInstanceOf(FeedError);
    expect(err.message).toContain("403");
    expect(err.message).toContain("duely setup");
    expect(err.message).not.toContain(TOKEN);
  });

  it("rejects pages that aren't calendars", async () => {
    const err = await errorFrom(`${base}/login?token=${TOKEN}`);
    expect(err).toBeInstanceOf(FeedError);
    expect(err.message).toContain("didn't return a calendar");
    expect(err.message).not.toContain(TOKEN);
  });

  it("explains an unreachable server without leaking the token", async () => {
    const err = await errorFrom(`https://duely-does-not-exist.invalid/feed.ics?token=${TOKEN}`);
    expect(err).toBeInstanceOf(FeedError);
    expect(err.name).toBe("FeedError");
    expect(err.message).toContain("Couldn't reach");
    expect(err.message).not.toContain(TOKEN);
  });
});
