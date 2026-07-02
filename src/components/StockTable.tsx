"use client";

import { useEffect, useState } from "react";

interface StockRef {
  code: string;
  name: string;
}

interface DailyPrice {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export default function StockTable({ stock }: { stock: StockRef }) {
  const [prices, setPrices] = useState<DailyPrice[]>([]);
  const [currency, setCurrency] = useState("TRY");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/stock/${stock.code}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPrices(data.prices ?? []);
          setCurrency(data.currency ?? "TRY");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [stock.code]);

  const format = (n: number | null) =>
    n === null ? "-" : n.toLocaleString("tr-TR", { maximumFractionDigits: 2 });

  const first = prices[0]?.close ?? null;
  const last = prices[prices.length - 1]?.close ?? null;
  const change =
    first !== null && last !== null ? ((last - first) / first) * 100 : null;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium">
          {stock.code} · {stock.name}
        </h2>
        {change !== null && (
          <span
            className={`text-xs font-medium ${
              change >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}% (30 gün)
          </span>
        )}
      </div>

      {loading && <p className="text-sm text-neutral-400">Yükleniyor…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && prices.length > 0 && (
        <div className="max-h-[28rem] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-neutral-900 text-neutral-500">
              <tr>
                <th className="py-1.5 pr-2">Tarih</th>
                <th className="py-1.5 pr-2">Açılış</th>
                <th className="py-1.5 pr-2">En Yüksek</th>
                <th className="py-1.5 pr-2">En Düşük</th>
                <th className="py-1.5 pr-2">Kapanış</th>
                <th className="py-1.5">Hacim</th>
              </tr>
            </thead>
            <tbody>
              {[...prices].reverse().map((p) => (
                <tr key={p.date} className="border-t border-neutral-800">
                  <td className="py-1.5 pr-2 text-neutral-300">{p.date}</td>
                  <td className="py-1.5 pr-2">{format(p.open)}</td>
                  <td className="py-1.5 pr-2">{format(p.high)}</td>
                  <td className="py-1.5 pr-2">{format(p.low)}</td>
                  <td className="py-1.5 pr-2 font-medium">
                    {format(p.close)} {currency}
                  </td>
                  <td className="py-1.5">
                    {p.volume?.toLocaleString("tr-TR") ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && prices.length === 0 && (
        <p className="text-sm text-neutral-500">Veri bulunamadı.</p>
      )}
    </div>
  );
}
