"use client";

import { useEffect, useState } from "react";
import StockTable from "@/components/StockTable";

interface StockRef {
  code: string;
  name: string;
}

interface Article {
  title: string;
  description: string | null;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl: string | null;
  stocks: StockRef[];
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<StockRef | null>(null);

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setArticles(data.articles ?? []);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            BIST Haber & Hisse Takip
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Borsa haberleri ve haberde geçen hissenin son 30 günlük fiyat
            hareketi
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <p className="text-sm text-neutral-400">Haberler yükleniyor…</p>
        )}

        {!loading && !error && articles.length === 0 && (
          <p className="text-sm text-neutral-400">
            Şu anda hisseyle eşleşen haber bulunamadı.
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <ul className="space-y-4">
            {articles.map((a, i) => (
              <li
                key={i}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
              >
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-neutral-100 hover:underline"
                >
                  {a.title}
                </a>
                <p className="mt-1 text-xs text-neutral-500">
                  {a.source} · {new Date(a.publishedAt).toLocaleString("tr-TR")}
                </p>
                {a.description && (
                  <p className="mt-2 text-sm text-neutral-400">
                    {a.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {a.stocks.map((s) => (
                    <button
                      key={s.code}
                      onClick={() => setSelectedStock(s)}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        selectedStock?.code === s.code
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                      }`}
                    >
                      {s.code} · {s.name}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <div className="md:sticky md:top-10 md:self-start">
            {selectedStock ? (
              <StockTable stock={selectedStock} />
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-800 p-6 text-sm text-neutral-500">
                Bir haberdeki hisse etiketine tıklayarak son 30 günlük fiyat
                tablosunu görebilirsiniz.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
