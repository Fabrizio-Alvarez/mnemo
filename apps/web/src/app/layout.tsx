import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mnemo — tarjetas de estudio",
  description:
    "Flashcards personales con repetición espaciada (SM-2). Contenido en Markdown, estado en Postgres.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mnemo",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  // cover: habilita env(safe-area-inset-*) para el notch/gesture bar de iOS.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <header className="border-b border-foreground/10">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
            <Link
              href="/"
              className="flex h-11 items-center gap-2 text-lg font-semibold tracking-tight"
            >
              <span aria-hidden className="text-accent">◆</span> Mnemo
            </Link>
            <nav className="flex gap-2 text-sm text-muted">
              <Link href="/" className="flex h-11 items-center rounded-md px-2 hover:bg-foreground/5 hover:text-foreground">
                Mazos
              </Link>
              <Link href="/stats" className="flex h-11 items-center rounded-md px-2 hover:bg-foreground/5 hover:text-foreground">
                Stats
              </Link>
              <Link href="/importar" className="flex h-11 items-center rounded-md px-2 hover:bg-foreground/5 hover:text-foreground">
                Importar
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-3xl px-6 pb-8 text-xs text-muted">
          Contenido en <code>decks/*.md</code> · estado SRS en Postgres · algoritmo SM-2
        </footer>
      </body>
    </html>
  );
}
