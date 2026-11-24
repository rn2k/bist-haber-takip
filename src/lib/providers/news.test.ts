import { describe, expect, it } from "vitest";
import { buildNewsUrl, toArticles } from "./news";

const article = (overrides: Record<string, unknown> = {}) => ({
  source: { id: null, name: "Bloomberg HT" },
  author: null,
  title: "Aselsan yeni sözleşme imzaladı",
  description: "Savunma şirketi ihracat anlaşması duyurdu.",
  url: "https://example.com/aselsan",
  urlToImage: null,
  publishedAt: "2026-11-20T08:00:00Z",
  content: null,
  ...overrides,
});

describe("toArticles", () => {
  it("haberi uygulama modeline çevirir ve hisseleri ekler", () => {
    const [a] = toArticles([article()]);
    expect(a).toEqual({
      title: "Aselsan yeni sözleşme imzaladı",
      description: "Savunma şirketi ihracat anlaşması duyurdu.",
      url: "https://example.com/aselsan",
      source: "Bloomberg HT",
      publishedAt: "2026-11-20T08:00:00Z",
      imageUrl: null,
      stocks: [{ code: "ASELS", name: "Aselsan" }],
    });
  });

  it("hisseyle eşleşmeyen haberleri eler", () => {
    expect(toArticles([article({ title: "Altın fiyatları", description: null })])).toEqual([]);
  });

  it("aynı URL'yi tekrar eden haberleri birleştirir", () => {
    expect(toArticles([article(), article()])).toHaveLength(1);
  });

  it("[Removed] yer tutucularını ve şemaya uymayan kayıtları atlar", () => {
    const result = toArticles([
      article({ title: "[Removed]", url: "https://example.com/1" }),
      article({ url: "geçersiz-url" }),
      { tamamen: "bozuk" },
      null,
      article({ url: "https://example.com/ok" }),
    ]);
    expect(result.map((a) => a.url)).toEqual(["https://example.com/ok"]);
  });

  it("kaynak adı yoksa varsayılan değeri kullanır", () => {
    const [a] = toArticles([article({ source: null })]);
    expect(a.source).toBe("Bilinmeyen kaynak");
  });
});

describe("buildNewsUrl", () => {
  it("sorgu parametrelerini doğru kodlar", () => {
    const url = new URL(buildNewsUrl());
    expect(url.hostname).toBe("newsapi.org");
    expect(url.searchParams.get("language")).toBe("tr");
    expect(url.searchParams.get("q")).toContain('"borsa istanbul"');
  });
});
