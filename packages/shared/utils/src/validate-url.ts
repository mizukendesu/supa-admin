const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^\[::1\]$/,
  /^\[::ffff:/i,
];

const LOCAL_DEV_HOST_PATTERNS = [/^localhost$/i, /^127\.\d+\.\d+\.\d+$/];

export type ValidateTargetUrlOptions = {
  allowLocalTargetUrls?: boolean;
};

export function validateTargetUrl(
  url: string,
  options: ValidateTargetUrlOptions = {},
): { ok: true } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLocalHost = LOCAL_DEV_HOST_PATTERNS.some((pattern) =>
    pattern.test(hostname),
  );

  if (options.allowLocalTargetUrls && isLocalHost) {
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, reason: "Only HTTP(S) URLs are allowed" };
    }
    return { ok: true };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "Only HTTPS URLs are allowed" };
  }

  if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
    return {
      ok: false,
      reason: "Private or local network URLs are not allowed",
    };
  }

  return { ok: true };
}
