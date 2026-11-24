import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-response";
import { getServerEnv } from "@/lib/env";
import { fetchBistNews } from "@/lib/providers/news";
import type { NewsResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { NEWS_API_KEY } = getServerEnv();
    const articles = await fetchBistNews(NEWS_API_KEY);
    return NextResponse.json<NewsResponse>({ articles });
  } catch (err) {
    return handleRouteError(err, "api/news");
  }
}
