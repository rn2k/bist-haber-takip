// BIST hisse kodları ve arama için kullanılacak şirket adı/anahtar kelimeler.
// Haber metninde bu isimler geçtiğinde ilgili hisse kodu eşleştirilir.

export interface BistStock {
  code: string; // BIST kodu (örn. THYAO)
  name: string; // Görünen şirket adı
  keywords: string[]; // Haber metninde aranacak anahtar kelimeler
}

export const BIST_STOCKS: BistStock[] = [
  { code: "THYAO", name: "Türk Hava Yolları", keywords: ["Türk Hava Yolları", "THY", "Turkish Airlines", "THYAO"] },
  { code: "ASELS", name: "Aselsan", keywords: ["Aselsan", "ASELS"] },
  { code: "GARAN", name: "Garanti BBVA", keywords: ["Garanti BBVA", "Garanti Bankası", "GARAN"] },
  { code: "AKBNK", name: "Akbank", keywords: ["Akbank", "AKBNK"] },
  { code: "ISCTR", name: "İş Bankası", keywords: ["İş Bankası", "Türkiye İş Bankası", "ISCTR"] },
  { code: "YKBNK", name: "Yapı Kredi", keywords: ["Yapı Kredi", "YKBNK"] },
  { code: "KCHOL", name: "Koç Holding", keywords: ["Koç Holding", "KCHOL"] },
  { code: "SAHOL", name: "Sabancı Holding", keywords: ["Sabancı Holding", "SAHOL"] },
  { code: "EREGL", name: "Ereğli Demir Çelik", keywords: ["Ereğli Demir Çelik", "Erdemir", "EREGL"] },
  { code: "BIMAS", name: "BİM", keywords: ["BİM", "BIM Birleşik Mağazalar", "BIMAS"] },
  { code: "SASA", name: "Sasa Polyester", keywords: ["Sasa Polyester", "SASA"] },
  { code: "TUPRS", name: "Tüpraş", keywords: ["Tüpraş", "TUPRS"] },
  { code: "PGSUS", name: "Pegasus", keywords: ["Pegasus", "PGSUS"] },
  { code: "FROTO", name: "Ford Otosan", keywords: ["Ford Otosan", "FROTO"] },
  { code: "TOASO", name: "Tofaş", keywords: ["Tofaş", "TOASO"] },
  { code: "TTKOM", name: "Türk Telekom", keywords: ["Türk Telekom", "TTKOM"] },
  { code: "TCELL", name: "Turkcell", keywords: ["Turkcell", "TCELL"] },
  { code: "ARCLK", name: "Arçelik", keywords: ["Arçelik", "ARCLK"] },
  { code: "VESTL", name: "Vestel", keywords: ["Vestel", "VESTL"] },
  { code: "HALKB", name: "Halkbank", keywords: ["Halkbank", "HALKB"] },
  { code: "VAKBN", name: "VakıfBank", keywords: ["VakıfBank", "VAKBN"] },
  { code: "SISE", name: "Şişecam", keywords: ["Şişecam", "SISE"] },
  { code: "KOZAL", name: "Koza Altın", keywords: ["Koza Altın", "KOZAL"] },
  { code: "KRDMD", name: "Kardemir", keywords: ["Kardemir", "KRDMD"] },
  { code: "MGROS", name: "Migros", keywords: ["Migros", "MGROS"] },
];

const STOCK_CODE_PATTERN = /^[A-Z0-9]{4,6}$/;

const BY_CODE = new Map(BIST_STOCKS.map((s) => [s.code, s]));

/**
 * Metni Türkçe kurallarına göre küçük harfe çevirir ve "ı"yı "i"ye katlar.
 * Böylece İngilizce yazılmış "BIM" ("bım") ile Türkçe "BİM" ("bim") aynı
 * şekilde eşleşir. Unicode NFC normalizasyonu, birleşik karakterlerle
 * (ör. "i" + U+0307) gelen metinleri de tek biçime indirger.
 */
export function normalizeForMatch(text: string): string {
  return text.normalize("NFC").toLocaleLowerCase("tr-TR").replace(/ı/g, "i");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Anahtar kelimenin önünde/arkasında harf veya rakam olmamalı.
// JS'teki \b Türkçe karakterleri tanımadığı için Unicode lookaround kullanıyoruz.
// Böylece "BİM" artık "BİMAS" ya da "bimsiz" içinde eşleşmez, ama
// "BİM'in" veya "(BİM)" gibi kullanımlar eşleşmeye devam eder.
const MATCHERS: { stock: BistStock; patterns: RegExp[] }[] = BIST_STOCKS.map((stock) => ({
  stock,
  patterns: stock.keywords.map(
    (kw) =>
      new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(normalizeForMatch(kw))}(?![\\p{L}\\p{N}])`, "u")
  ),
}));

export function findStocksInText(text: string): BistStock[] {
  const normalized = normalizeForMatch(text);
  return MATCHERS.filter(({ patterns }) => patterns.some((re) => re.test(normalized))).map(
    ({ stock }) => stock
  );
}

/** Kodun hem biçim olarak geçerli hem de takip listesinde olduğunu doğrular. */
export function getStockByCode(code: string): BistStock | undefined {
  const upper = code.toUpperCase();
  if (!STOCK_CODE_PATTERN.test(upper)) return undefined;
  return BY_CODE.get(upper);
}
