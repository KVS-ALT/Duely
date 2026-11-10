/**
 * Feed links contain a private token. Anything that might be printed
 * (errors, logs) shows only the host, never the full link.
 */
export function redact(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/…`;
  } catch {
    return "<feed url>";
  }
}

/** Replace every copy of the secret link inside a message with its redacted form. */
export function scrub(message: string, url: string | undefined): string {
  if (!url) return message;
  return message.replaceAll(url, redact(url));
}
