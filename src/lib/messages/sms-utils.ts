export type SmsEncoding = "gsm" | "unicode";

export type SmsStats = {
  length: number;
  segments: number;
  encoding: SmsEncoding;
  charsRemaining: number;
};

const GSM_SINGLE = 160;
const GSM_MULTI = 153;
const UNICODE_SINGLE = 70;
const UNICODE_MULTI = 67;

function hasUnicodeChars(text: string): boolean {
  return /[^\u0000-\u007F]/.test(text);
}

export function getSmsStats(body: string): SmsStats {
  const encoding: SmsEncoding = hasUnicodeChars(body) ? "unicode" : "gsm";
  const length = body.length;

  if (length === 0) {
    return { length: 0, segments: 0, encoding, charsRemaining: GSM_SINGLE };
  }

  const singleLimit = encoding === "unicode" ? UNICODE_SINGLE : GSM_SINGLE;
  const multiLimit = encoding === "unicode" ? UNICODE_MULTI : GSM_MULTI;

  if (length <= singleLimit) {
    return {
      length,
      segments: 1,
      encoding,
      charsRemaining: singleLimit - length,
    };
  }

  const segments = Math.ceil(length / multiLimit);
  const usedInLastSegment = length % multiLimit || multiLimit;

  return {
    length,
    segments,
    encoding,
    charsRemaining: multiLimit - usedInLastSegment,
  };
}
