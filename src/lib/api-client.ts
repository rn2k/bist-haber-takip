import type { ApiError } from "@/types";

/**
 * Kendi API route'larımıza tipli istek atar. Hata yanıtlarını (JSON veya değil)
 * tek tip bir Error'a çevirir; bileşenler `data.error` kontrolü yapmak zorunda kalmaz.
 */
export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // JSON olmayan yanıt (ör. platformun HTML hata sayfası)
  }

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as ApiError).error)
        : `İstek başarısız oldu (HTTP ${res.status}).`;
    throw new Error(message);
  }

  return body as T;
}
