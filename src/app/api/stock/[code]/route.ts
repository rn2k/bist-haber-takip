import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DailyPrice {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const symbol = `${code.toUpperCase()}.IS`; // BIST hisseleri Yahoo Finance'te .IS uzantısıyla bulunur

  
  const range = "45d";
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=1d`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Yahoo Finance hata verdi: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return NextResponse.json(
        { error: `${symbol} için veri bulunamadı.` },
        { status: 404 }
      );
    }

    const timestamps: number[] = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0] ?? {};

    const prices: DailyPrice[] = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      open: quote.open?.[i] ?? null,
      high: quote.high?.[i] ?? null,
      low: quote.low?.[i] ?? null,
      close: quote.close?.[i] ?? null,
      volume: quote.volume?.[i] ?? null,
    }));

    // Son 30 işlem gününü al
    const last30 = prices.filter((p) => p.close !== null).slice(-30);

    return NextResponse.json({
      symbol,
      currency: result.meta?.currency ?? "TRY",
      prices: last30,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Hisse verisi alınırken hata oluştu: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
