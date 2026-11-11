//Imports
import { readFile } from "node:fs/promises";
import { redact } from "./redact.js";

// FeedError Class
export class FeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedError";
  }
}

//Checks if url is valid
export function isUrl(feed: string): boolean {
  return feed.startsWith("http://") || feed.startsWith("https://") || feed.startsWith("webcal://");
}

//Converts webcal to https
export function normalizeFeedUrl(feed: string): string {
  const url = feed.trim();
  if (url.startsWith("webcal://")) {
    return url.replace("webcal://", "https://");
  }
  return url;
}

//Fetches the feed from the given URL or file path
export async function fetchFeed(feed: string): Promise<string> {
  // 1. Not a URL? Then it's a file path.
  if (await isUrl(feed) == false){
    try {
      return await readFile(feed, "utf-8");
    } catch {
      throw new FeedError(`Couldn't read ${redact(feed)}`);
    }
  }

  // Get the normalized URL (webcal -> https)
  const url = await normalizeFeedUrl(feed);

  //Try to fetch url with a 15 second timeout and if it fails throw a FeedError that includes the url
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new FeedError(`Couldn't reach ${redact(url)}`);
  }

  // If the response is not ok throw a FeedError
  if (!res.ok) {
    throw new FeedError(
      `${redact(url)} responded ${res.status}. Your feed link may have expired: get a new one from your LMS calendar and run \`duely setup\`.`,
    );  }
  // If the response is ok check if the text includes "BEGIN:VCALENDAR" and if not throw a FeedError
  const text = await res.text();
  if (!text.includes("BEGIN:VCALENDAR")) {
    throw new FeedError(`${redact(url)} didn't return a calendar`);
  }
  return text;
}