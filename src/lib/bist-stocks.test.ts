import { describe, expect, it } from "vitest";
import { findStocksInText, getStockByCode, normalizeForMatch } from "./bist-stocks";

const codes = (text: string) => findStocksInText(text).map((s) => s.code);

describe("normalizeForMatch", () => {
  it("Türkçe büyük İ ve I harflerini doğru küçültür", () => {
    expect(normalizeForMatch("İŞ BANKASI")).toBe("iş bankasi");
  });

  it("noktasız ı'yı i'ye katlar", () => {
    expect(normalizeForMatch("BIM")).toBe(normalizeForMatch("BİM"));
  });
});

describe("findStocksInText", () => {
  it("şirket adını ve kodunu eşleştirir", () => {
    expect(codes("Türk Hava Yolları yeni uçak siparişi verdi")).toEqual(["THYAO"]);
    expect(codes("ASELS hisseleri güne yükselişle başladı")).toEqual(["ASELS"]);
  });

  it("büyük/küçük harf ve Türkçe karakter farklarını tolere eder", () => {
    expect(codes("TÜPRAŞ rafineri bakımı")).toEqual(["TUPRS"]);
    expect(codes("türk telekom fiber yatırımı")).toEqual(["TTKOM"]);
  });

  it("Türkçe ekli kullanımları eşleştirir", () => {
    expect(codes("Akbank'ın net kârı arttı")).toEqual(["AKBNK"]);
    expect(codes("THY'nin yolcu sayısı rekor kırdı")).toEqual(["THYAO"]);
  });

  it("kelimenin içinde geçen kısa anahtarları eşleştirmez (yanlış pozitif)", () => {
    // Eski includes() tabanlı eşleştirme bunları yanlışlıkla yakalıyordu.
    expect(codes("Bimsiz bir alışveriş deneyimi")).toEqual([]);
    expect(codes("THYS adlı fon")).toEqual([]);
    expect(codes("Sasalı sanayi bölgesi")).toEqual([]);
  });

  it("İngilizce yazılmış metinde dotless I sorununu çözer", () => {
    expect(codes("BIM shares rose")).toEqual(["BIMAS"]);
  });

  it("bir metinde birden fazla hisseyi bulur ve her birini bir kez döndürür", () => {
    const result = codes("Koç Holding ve KCHOL ile Ford Otosan hisseleri");
    expect(result).toEqual(["KCHOL", "FROTO"]);
  });

  it("hiçbir hisse geçmiyorsa boş döner", () => {
    expect(codes("Merkez Bankası faiz kararını açıkladı")).toEqual([]);
  });
});

describe("getStockByCode", () => {
  it("listedeki kodu büyük/küçük harf duyarsız bulur", () => {
    expect(getStockByCode("thyao")?.name).toBe("Türk Hava Yolları");
  });

  it("listede olmayan veya biçimi bozuk kodları reddeder", () => {
    expect(getStockByCode("XXXXX")).toBeUndefined();
    expect(getStockByCode("THYAO/../../v7")).toBeUndefined();
    expect(getStockByCode("")).toBeUndefined();
    expect(getStockByCode("A".repeat(50))).toBeUndefined();
  });
});
