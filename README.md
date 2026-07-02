# BIST Haber & Hisse Takip

Borsa İstanbul (BIST) ile ilgili güncel haberleri listeler; her haberde geçen
hisseye tıklayınca o hissenin **son 30 günlük** fiyat verilerini (açılış,
yüksek, düşük, kapanış, hacim) tablo halinde gösterir.

## Kullanılan Teknolojiler
- **Next.js 15 (App Router)** – hem frontend hem backend (API route'ları)
- **Tailwind CSS** – arayüz
- **NewsAPI.org** – haber verisi
- **Yahoo Finance (ücretsiz, key gerektirmeyen chart endpoint'i)** – hisse fiyat verisi

## Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. [newsapi.org](https://newsapi.org/register) adresinden ücretsiz bir hesap
   açıp API anahtarınızı alın.

3. `.env.local.example` dosyasını kopyalayıp `.env.local` yapın ve
   anahtarınızı girin:
   ```bash
   cp .env.local.example .env.local
   ```
   ```
   NEWS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

5. Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Nasıl Çalışır?

- `src/lib/bist-stocks.ts` içinde tanımlı BIST hisseleri (kod + anahtar
  kelimeler) listesi vardır. Listeyi dilediğiniz gibi genişletebilirsiniz.
- `src/app/api/news/route.ts` NewsAPI'den Türkçe borsa haberlerini çeker ve
  haber metninde geçen hisseleri otomatik eşleştirir.
- `src/app/api/stock/[code]/route.ts` seçilen hissenin son 30 işlem gününe ait
  fiyat verisini Yahoo Finance'ten çeker (`KOD.IS` formatında, örn. `THYAO.IS`).
- Ana sayfada haberler listelenir; bir haberdeki hisse etiketine tıklandığında
  sağ tarafta o hissenin 30 günlük tablosu belirir.

## Notlar / Sınırlamalar

- NewsAPI ücretsiz plan **sadece localhost/geliştirme** amaçlı kullanım için
  uygundur; canlıya (production) almak isterseniz ücretli plana geçmeniz
  gerekir.
- Yahoo Finance endpoint'i resmi/belgelenmiş bir API değildir, gayri resmi
  olarak yaygın şekilde kullanılır; ileride değişebilir. Sorun yaşarsanız
  Alpha Vantage veya Collect API gibi alternatiflere geçilebilir.
- Hisse eşleştirmesi basit anahtar kelime taramasıyla yapılır; yanlış
  pozitif/negatifler olabilir, `bist-stocks.ts` dosyasından ince ayar
  yapabilirsiniz.


