import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Баня.Сауна — аренда бань и саун",
  description:
    "Портал для поиска и онлайн-бронирования бань и саун по городам России",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Баня.Сауна
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/catalog" className="hover:text-foreground">
                Каталог
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Баня.Сауна
        </footer>
      </body>
    </html>
  );
}
