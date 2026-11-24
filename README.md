# BIST Haber & Hisse Takip

[![CI](https://github.com/rn2k/bist-haber-takip/actions/workflows/ci.yml/badge.svg)](https://github.com/rn2k/bist-haber-takip/actions/workflows/ci.yml)

Borsa İstanbul (BIST) ile ilgili güncel haberleri listeler; her haberde geçen
hisseye tıklayınca o hissenin **son 30 günlük** fiyat verilerini (açılış,
yüksek, düşük, kapanış, hacim) tablo halinde gösterir.

## Kullanılan Teknolojiler
- **Next.js 16 (App Router)** + **TypeScript** – hem frontend hem backend (route handler'lar)
- **Tailwind CSS 4** – arayüz
- **Zod** – ortam değişkenleri, kullanıcı girdisi ve dış API yanıtlarının doğrulanması
- **Vitest** – unit ve route handler testleri
- **GitHub Actions** – her push/PR'da lint, typecheck, test ve build
- **NewsAPI.org** – haber verisi
- **Yahoo Finance (ücretsiz, key gerektirmeyen chart endpoint'i)** – hisse fiyat verisi

## Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. [newsapi.org](https://newsapi.org/register) adresinden ücretsiz bir hesap
   açıp API anahtarınızı alın.

3. `.env.example` dosyasını kopyalayıp `.env.local` yapın ve
   anahtarınızı girin:
   ```bash
   cp .env.example .env.local
   ```
   ```
   NEWS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

5. Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm test` | Testleri çalıştırır (`npm run test:watch` ile izleme modu) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Route tiplerini üretir ve `tsc --noEmit` çalıştırır |
| `npm run check` | Lint + typecheck + test (push öncesi) |
| `npm run build` | Production build |

Node.js 22+ gerekir (`.nvmrc`).

## Proje Yapısı

```
src/
├── app/
│   ├── api/news/route.ts          # GET /api/news – ince route handler
│   ├── api/stock/[code]/route.ts  # GET /api/stock/:code – girdi doğrulama + fiyat
│   └── page.tsx                   # Ana sayfa (client)
├── components/StockTable.tsx
├── lib/
│   ├── providers/news.ts          # NewsAPI istemcisi + yanıt şeması + dönüştürme
│   ├── providers/yahoo.ts         # Yahoo chart istemcisi + saf parse fonksiyonu
│   ├── bist-stocks.ts             # Hisse listesi ve Türkçe duyarlı eşleştirme
│   ├── env.ts                     # Zod ile ortam değişkeni doğrulaması
│   ├── http.ts                    # Zaman aşımlı fetch, UpstreamError
│   ├── api-response.ts            # Hata → HTTP durum kodu eşlemesi
│   └── api-client.ts              # İstemci tarafı tipli fetch
└── types/index.ts                 # Paylaşılan tipler
```

## Hata Yönetimi

| Durum | HTTP |
| --- | --- |
| Geçersiz / takip edilmeyen hisse kodu | `400` (dış servise istek atılmaz) |
| Hisse için veri yok | `404` |
| `NEWS_API_KEY` eksik | `500` (açıklayıcı mesajla) |
| NewsAPI / Yahoo hata verdi, zaman aşımı (8 sn) veya beklenmeyen yanıt | `502` |

Dış servislerin hata gövdeleri istemciye iletilmez, yalnızca sunucu loguna yazılır.

## Nasıl Çalışır?

- `src/lib/bist-stocks.ts` içinde tanımlı BIST hisseleri (kod + anahtar
  kelimeler) listesi vardır. Listeyi dilediğiniz gibi genişletebilirsiniz.
- `/api/news`, NewsAPI'den Türkçe borsa haberlerini çeker, yanıtı şemayla
  doğrular, tekrar eden ve `[Removed]` haberleri eler, metinde geçen
  hisseleri eşleştirir.
- Eşleştirme kelime sınırına duyarlıdır: "BİM" artık "Bimsiz" içinde
  eşleşmez, ama "BİM'in" gibi ekli kullanımlar eşleşir. Türkçe `I/İ`
  farkı da tolere edilir.
- `/api/stock/:code`, kodu önce takip listesine göre doğrular, ardından son
  30 işlem gününe ait fiyat verisini Yahoo Finance'ten çeker (`KOD.IS`
  formatında, örn. `THYAO.IS`).
- Ana sayfada haberler listelenir; bir haberdeki hisse etiketine tıklandığında
  sağ tarafta o hissenin 30 günlük tablosu belirir.

## Notlar / Sınırlamalar

- NewsAPI ücretsiz plan **sadece localhost/geliştirme** amaçlı kullanım için
  uygundur; canlıya (production) almak isterseniz ücretli plana geçmeniz
  gerekir.
- Yahoo Finance endpoint'i resmi/belgelenmiş bir API değildir, gayri resmi
  olarak yaygın şekilde kullanılır; ileride değişebilir. Sorun yaşarsanız
  Alpha Vantage veya Collect API gibi alternatiflere geçilebilir.
- Hisse eşleştirmesi anahtar kelime tabanlıdır; kelime sınırı kontrolü
  yanlış pozitifleri azaltır ama ortadan kaldırmaz. `bist-stocks.ts`
  dosyasından ince ayar yapabilirsiniz.
- Veriler henüz kalıcı olarak saklanmıyor; her istek (5 dk cache ile) dış
  servislere gider. Bir sonraki aşamada PostgreSQL + arka plan worker'ı
  eklenecek.


