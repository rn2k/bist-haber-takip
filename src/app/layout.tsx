import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BIST Haber & Hisse Takip",
  description: "Borsa haberleri ve ilgili hissenin 30 günlük fiyat takibi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
