import { describe, expect, it } from "vitest";
import { UpstreamError } from "@/lib/http";
import { parseYahooChart, toYahooSymbol } from "./yahoo";

const DAY = 86_400;
const START = Date.UTC(2026, 10, 2) / 1000; // 2026-11-02

function chart(days: number, closeAt: (i: number) => number | null = (i) => 100 + i) {
  const timestamp = Array.from({ length: days }, (_, i) => START + i * DAY);
  const close = timestamp.map((_, i) => closeAt(i));
  return {
    chart: {
      result: [
        {
          meta: { currency: "TRY" },
          timestamp,
          indicators: {
            quote: [{ open: close, high: close, low: close, close, volume: close.map(() => 1000) }],
          },
        },
      ],
      error: null,
    },
  };
}

describe("toYahooSymbol", () => {
  it(".IS uzantısını ekler", () => {
    expect(toYahooSymbol("thyao")).toBe("THYAO.IS");
  });
});

describe("parseYahooChart", () => {
  it("günlük fiyatları tarih biçimiyle döndürür", () => {
    const data = parseYahooChart(chart(2), "THYAO.IS");
    expect(data?.prices).toEqual([
      { date: "2026-11-02", open: 100, high: 100, low: 100, close: 100, volume: 1000 },
      { date: "2026-11-03", open: 101, high: 101, low: 101, close: 101, volume: 1000 },
    ]);
    expect(data?.currency).toBe("TRY");
  });

  it("kapanışı olmayan günleri atlar ve son 30 işlem gününü tutar", () => {
    const data = parseYahooChart(chart(40, (i) => (i === 39 ? null : i)), "X.IS");
    expect(data?.prices).toHaveLength(30);
    expect(data?.prices.at(-1)?.close).toBe(38);
    expect(data?.prices[0]?.close).toBe(9);
  });

  it("sonuç yoksa null döner", () => {
    expect(parseYahooChart({ chart: { result: null, error: { description: "No data" } } }, "X.IS")).toBeNull();
  });

  it("beklenmeyen yanıt yapısında UpstreamError fırlatır", () => {
    expect(() => parseYahooChart({ foo: "bar" }, "X.IS")).toThrow(UpstreamError);
  });
});
