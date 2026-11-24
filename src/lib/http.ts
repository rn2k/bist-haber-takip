/** Dış servis (NewsAPI, Yahoo) hata verdiğinde fırlatılır. */
export class UpstreamError extends Error {
  constructor(
    public readonly service: string,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

export const DEFAULT_TIMEOUT_MS = 8_000;

/**
 * Zaman aşımlı fetch. Dış servis yanıt vermezse istek sonsuza kadar
 * asılı kalmaz; AbortSignal.timeout ile kesilir ve UpstreamError'a çevrilir.
 */
export async function fetchWithTimeout(
  service: string,
  url: string,
  init: RequestInit & { next?: { revalidate?: number } } = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    const name = (err as Error).name;
    if (name === "TimeoutError" || name === "AbortError") {
      throw new UpstreamError(service, `${service} ${timeoutMs} ms içinde yanıt vermedi.`);
    }
    throw new UpstreamError(service, `${service} isteği başarısız: ${(err as Error).message}`);
  }
}
