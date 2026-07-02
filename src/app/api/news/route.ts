import { NextResponse } from "next/server";
import { findStocksInText } from "@/lib/bist-stocks";

export const dynamic = "force-dynamic";

interface NewsApiArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "NEWS_API_KEY tanımlı değil. .env.local dosyasına ekleyin." },
      { status: 500 }
    );
  }

  // Borsa / BIST ile ilgili Türkçe haberleri arıyoruz.
  const query = encodeURIComponent(
    '"borsa istanbul" OR BIST OR hisse OR "borsa" '
  );
  const url = `https://newsapi.org/v2/everything?q=${query}&language=tr&sortBy=publishedAt&pageSize=50`;

  try {
    const res = await fetch(url, {
      headers: { "X-Api-Key": apiKey },
      // NewsAPI sonuçları çok sık değişmediği için kısa süreliğine cache'liyoruz
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `NewsAPI hata verdi: ${res.status} ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const articles: NewsApiArticle[] = data.articles ?? [];

    // Her haberi taşınan metinle hisse kodlarıyla eşleştiriyoruz
    const enriched = articles
      .map((a) => {
        const text = `${a.title ?? ""} ${a.description ?? ""}`;
        const stocks = findStocksInText(text);
        return {
          title: a.title,
          description: a.description,
          url: a.url,
          source: a.source?.name ?? "Bilinmeyen kaynak",
          publishedAt: a.publishedAt,
          imageUrl: a.urlToImage,
          stocks: stocks.map((s) => ({ code: s.code, name: s.name })),
        };
      })
      // Sadece bir BIST hissesiyle eşleşen haberleri gösteriyoruz
      .filter((a) => a.stocks.length > 0);

    return NextResponse.json({ articles: enriched });
  } catch (err) {
    return NextResponse.json(
      { error: `Haberler alınırken hata oluştu: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
