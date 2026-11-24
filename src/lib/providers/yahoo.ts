import { z } from "zod";
import { fetchWithTimeout, UpstreamError } from "@/lib/http";
import type { DailyPrice, StockResponse } from "@/types";

const SERVICE = "Yahoo Finance";
const REVALIDATE_SECONDS = 300;
const TRADING_DAYS = 30;
// 30 işlem günü için hafta sonları/tatilleri hesaba katarak daha geniş aralık istiyoruz.
const RANGE = "45d";

const nullableNumbers = z.array(z.number().nullable()).optional();

const chartSchema = z.object({
  chart: z.object({
    result: z
      .array(
        z.object({
          meta: z.object({ currency: z.string().nullish() }).optional(),
          timestamp: z.array(z.number()).optional(),
          indicators: z.object({
            quote: z.array(
              z.object({
                open: nullableNumbers,
                high: nullableNumbers,
                low: nullableNumbers,
                close: nullableNumbers,
                volume: nullableNumbers,
              })
            ),
          }),
        })
      )
      .nullable(),
    error: z.object({ description: z.string().optional() }).nullable().optional(),
  }),
});

/** BIST hisseleri Yahoo Finance'te `.IS` uzantısıyla bulunur. */
export function toYahooSymbol(code: string): string {
  return `${code.toUpperCase()}.IS`;
}

/**
 * Yahoo chart yanıtını günlük fiyat listesine çevirir.
 * Ağ çağrısından ayrı, saf bir fonksiyon olduğu için kolayca test edilir.
 * Veri yoksa `null` döner.
 */
export function parseYahooChart(raw: unknown, symbol: string): StockResponse | null {
  const parsed = chartSchema.safeParse(raw);
  if (!parsed.success) {
    throw new UpstreamError(SERVICE, `${SERVICE} beklenmeyen bir yanıt döndürdü.`);
  }

  const result = parsed.data.chart.result?.[0];
  if (!result) return null;

  const timestamps = result.timestamp ?? [];
  const q = result.indicators.quote[0] ?? {};

  const prices: DailyPrice[] = timestamps.map((ts, i) => ({
    date: new Date(ts * 1000).toISOString().slice(0, 10),
    open: q.open?.[i] ?? null,
    high: q.high?.[i] ?? null,
    low: q.low?.[i] ?? null,
    close: q.close?.[i] ?? null,
    volume: q.volume?.[i] ?? null,
  }));

  return {
    symbol,
    currency: result.meta?.currency ?? "TRY",
    prices: prices.filter((p) => p.close !== null).slice(-TRADING_DAYS),
  };
}

export async function fetchDailyPrices(code: string): Promise<StockResponse | null> {
  const symbol = toYahooSymbol(code);
  const params = new URLSearchParams({ range: RANGE, interval: "1d" });
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`;

  const res = await fetchWithTimeout(SERVICE, url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new UpstreamError(SERVICE, `${SERVICE} hata verdi (HTTP ${res.status}).`, res.status);
  }

  return parseYahooChart(await res.json(), symbol);
}
