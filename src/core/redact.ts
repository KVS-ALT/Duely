export function redact(url: string | undefined): string{
    try {
        const u = new URL(url);
        return `${u.protocol}//${u.host}/…`;
    } catch (e) {
        return "<feed url>";
    }
}

export function scrub(message: string, url: string | undefined): string {
    if (!url) {
        return message;
    }
    const redacted = redact(url);
    return message.replaceAll(url, redacted);
}