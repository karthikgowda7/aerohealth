import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroHealth",
  description: "Turbofan engine health monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-800 bg-slate-900 text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight text-white hover:text-slate-200">
              AeroHealth
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/" className="text-slate-200 transition-colors hover:text-white">
                Fleet
              </Link>
              <Link href="/work-orders" className="text-slate-200 transition-colors hover:text-white">
                Work Orders
              </Link>
              <Link href="/model" className="text-slate-200 transition-colors hover:text-white">
                Model
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}
