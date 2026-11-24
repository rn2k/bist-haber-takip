import { NextResponse, type NextRequest } from "next/server";
import { handleRouteError, jsonError } from "@/lib/api-response";
import { getStockByCode } from "@/lib/bist-stocks";
import { fetchDailyPrices } from "@/lib/providers/yahoo";
import type { StockResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/stock/[code]">) {
  const { code } = await ctx.params;

  // Kullanıcı girdisi dış servise gitmeden önce takip listesine göre doğrulanır.
  // Böylece rastgele string'ler Yahoo URL'ine eklenemez.
  const stock = getStockByCode(code);
  if (!stock) {
    return jsonError(`Geçersiz veya takip edilmeyen hisse kodu: ${code.slice(0, 12)}`, 400);
  }

  try {
    const data = await fetchDailyPrices(stock.code);
    if (!data) {
      return jsonError(`${stock.code} için veri bulunamadı.`, 404);
    }
    return NextResponse.json<StockResponse>(data);
  } catch (err) {
    return handleRouteError(err, "api/stock");
  }
}
