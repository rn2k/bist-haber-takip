// İstemci ve sunucu arasında paylaşılan tipler.
// Daha önce bu tipler page.tsx, StockTable.tsx ve route dosyalarında
// ayrı ayrı tanımlanıyordu; tek kaynak burası.

export interface StockRef {
  code: string;
  name: string;
}

export interface Article {
  title: string;
  description: string | null;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl: string | null;
  stocks: StockRef[];
}

export interface DailyPrice {
  date: string; // YYYY-MM-DD
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export interface NewsResponse {
  articles: Article[];
}

export interface StockResponse {
  symbol: string;
  currency: string;
  prices: DailyPrice[];
}

export interface ApiError {
  error: string;
}
