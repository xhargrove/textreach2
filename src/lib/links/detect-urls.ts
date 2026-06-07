const URL_PATTERN =
  /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

const TRAILING_PUNCTUATION = /[.,;:!?)]+$/;

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN);
  if (!matches) return [];

  const seen = new Set<string>();
  const urls: string[] = [];

  for (const match of matches) {
    const cleaned = match.replace(TRAILING_PUNCTUATION, "");
    if (!seen.has(cleaned)) {
      seen.add(cleaned);
      urls.push(cleaned);
    }
  }

  return urls;
}

export function replaceUrlsInBody(
  body: string,
  replacements: { originalUrl: string; trackingUrl: string }[]
): string {
  if (replacements.length === 0) return body;

  let result = body;
  const sorted = [...replacements].sort(
    (a, b) => b.originalUrl.length - a.originalUrl.length
  );

  for (const { originalUrl, trackingUrl } of sorted) {
    const escaped = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`${escaped}([.,;:!?)]+)?`, "g");
    result = result.replace(pattern, (_, trailing = "") => {
      return `${trackingUrl}${trailing}`;
    });
  }

  return result;
}
