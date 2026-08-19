import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mnemo — tarjetas de estudio",
  description:
    "Flashcards personales con repetición espaciada (SM-2). Contenido en Markdown, estado en Postgres.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <header className="border-b border-foreground/10">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span aria-hidden className="text-accent">◆</span> Mnemo
            </Link>
            <Link href="/" className="text-sm text-muted hover:text-foreground">
              Mazos
            </Link>
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
