import { NextResponse } from "next/server";
import { EnvError } from "@/lib/env";
import { UpstreamError } from "@/lib/http";
import type { ApiError } from "@/types";

export function jsonError(message: string, status: number) {
  return NextResponse.json<ApiError>({ error: message }, { status });
}

/**
 * Hataları tutarlı HTTP durum kodlarına çevirir:
 * - yapılandırma hatası → 500
 * - dış servis hatası   → 502 (Bad Gateway): sorun bizde değil, bağlı servisde
 * - beklenmeyen hata    → 500, ayrıntı yalnızca sunucu loguna yazılır
 */
export function handleRouteError(err: unknown, context: string) {
  if (err instanceof EnvError) {
    return jsonError(err.message, 500);
  }
  if (err instanceof UpstreamError) {
    console.warn(`[${context}] ${err.service}: ${err.message}`);
    return jsonError(err.message, 502);
  }
  console.error(`[${context}] Beklenmeyen hata`, err);
  return jsonError("Beklenmeyen bir hata oluştu.", 500);
}
