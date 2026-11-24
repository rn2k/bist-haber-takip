import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET as getNews } from "./news/route";
import { GET as getStock } from "./stock/[code]/route";

const ctx = (code: string) => ({ params: Promise.resolve({ code }) });
const req = {} as NextRequest;

function mockFetch(impl: (url: string) => Response | Promise<Response>) {
  return vi.spyOn(globalThis, "fetch").mockImplementation((input) => Promise.resolve(impl(String(input))));
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/stock/[code]", () => {
  it("geçersiz kodu dış servise gitmeden 400 ile reddeder", async () => {
    const spy = mockFetch(() => Response.json({}));
    const res = await getStock(req, ctx("../../etc"));
    expect(res.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("geçerli kod için fiyatları döndürür", async () => {
    const ts = Date.UTC(2026, 10, 2) / 1000;
    const spy = mockFetch(() =>
      Response.json({
        chart: {
          result: [{ meta: { currency: "TRY" }, timestamp: [ts], indicators: { quote: [{ close: [300] }] } }],
          error: null,
        },
      })
    );
    const res = await getStock(req, ctx("thyao"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.symbol).toBe("THYAO.IS");
    expect(body.prices[0].close).toBe(300);
    expect(String(spy.mock.calls[0][0])).toContain("/THYAO.IS?");
  });

  it("Yahoo hata verirse 502 döner", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch(() => new Response("boom", { status: 503 }));
    const res = await getStock(req, ctx("ASELS"));
    expect(res.status).toBe(502);
  });
});

describe("GET /api/news", () => {
  it("API anahtarı yoksa açıklayıcı bir 500 döner", async () => {
    vi.stubEnv("NEWS_API_KEY", "");
    const res = await getNews();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/NEWS_API_KEY/);
  });

  it("NewsAPI hata gövdesini istemciye sızdırmaz", async () => {
    vi.stubEnv("NEWS_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch(() => new Response('{"message":"Your API key test-key is invalid"}', { status: 401 }));
    const res = await getNews();
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain("test-key");
  });

  it("eşleşen haberleri döndürür ve anahtarı başlıkta gönderir", async () => {
    vi.stubEnv("NEWS_API_KEY", "test-key");
    const spy = mockFetch(() =>
      Response.json({
        status: "ok",
        articles: [
          { source: { name: "AA" }, title: "Migros mağaza sayısını artırdı", url: "https://e.com/1", publishedAt: "2026-11-20T08:00:00Z" },
          { source: { name: "AA" }, title: "Hava durumu", url: "https://e.com/2", publishedAt: "2026-11-20T08:00:00Z" },
        ],
      })
    );
    const res = await getNews();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.articles).toHaveLength(1);
    expect(body.articles[0].stocks[0].code).toBe("MGROS");
    const init = spy.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)["X-Api-Key"]).toBe("test-key");
  });
});
