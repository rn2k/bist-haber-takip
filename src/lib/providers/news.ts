import { z } from "zod";
import { findStocksInText } from "@/lib/bist-stocks";
import { fetchWithTimeout, UpstreamError } from "@/lib/http";
import type { Article } from "@/types";

const SERVICE = "NewsAPI";
const QUERY = '"borsa istanbul" OR BIST OR hisse OR borsa';
const REVALIDATE_SECONDS = 300;

// NewsAPI yanıtını körü körüne güvenmek yerine şemayla doğruluyoruz.
// Eksik/bozuk alanlar uygulamanın derinlerinde değil, burada yakalanır.
const newsApiArticleSchema = z.object({
  source: z.object({ name: z.string().nullish() }).nullish(),
  title: z.string().nullish(),
  description: z.string().nullish(),
  url: z.url(),
  urlToImage: z.string().nullish(),
  publishedAt: z.string(),
});

const newsApiResponseSchema = z.object({
  status: z.literal("ok"),
  articles: z.array(z.unknown()),
});

export type NewsApiArticle = z.infer<typeof newsApiArticleSchema>;

export function buildNewsUrl(): string {
  const params = new URLSearchParams({
    q: QUERY,
    language: "tr",
    sortBy: "publishedAt",
    pageSize: "50",
  });
  return `https://newsapi.org/v2/everything?${params}`;
}

/**
 * Ham NewsAPI makalelerini uygulama modeline çevirir:
 * - şemaya uymayan makaleleri atlar (tek bozuk kayıt tüm listeyi düşürmez),
 * - "[Removed]" yer tutucularını eler,
 * - aynı URL'ye sahip tekrarları birleştirir,
 * - yalnızca en az bir BIST hissesiyle eşleşen haberleri bırakır.
 */
export function toArticles(raw: unknown[]): Article[] {
  const seen = new Set<string>();
  const result: Article[] = [];

  for (const item of raw) {
    const parsed = newsApiArticleSchema.safeParse(item);
    if (!parsed.success) continue;
    const a = parsed.data;

    const title = a.title?.trim();
    if (!title || title === "[Removed]") continue;
    if (seen.has(a.url)) continue;

    const stocks = findStocksInText(`${title} ${a.description ?? ""}`);
    if (stocks.length === 0) continue;

    seen.add(a.url);
    result.push({
      title,
      description: a.description ?? null,
      url: a.url,
      source: a.source?.name ?? "Bilinmeyen kaynak",
      publishedAt: a.publishedAt,
      imageUrl: a.urlToImage ?? null,
      stocks: stocks.map(({ code, name }) => ({ code, name })),
    });
  }

  return result;
}

export async function fetchBistNews(apiKey: string): Promise<Article[]> {
  const res = await fetchWithTimeout(SERVICE, buildNewsUrl(), {
    headers: { "X-Api-Key": apiKey },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!res.ok) {
    // Yanıt gövdesi API anahtarıyla ilgili ayrıntılar içerebilir; istemciye
    // değil, yalnızca sunucu loguna yazılır.
    const body = await res.text().catch(() => "");
    console.error(`[${SERVICE}] HTTP ${res.status}: ${body.slice(0, 500)}`);
    throw new UpstreamError(SERVICE, `${SERVICE} hata verdi (HTTP ${res.status}).`, res.status);
  }

  const parsed = newsApiResponseSchema.safeParse(await res.json());
  if (!parsed.success) {
    throw new UpstreamError(SERVICE, `${SERVICE} beklenmeyen bir yanıt döndürdü.`);
  }

  return toArticles(parsed.data.articles);
}
