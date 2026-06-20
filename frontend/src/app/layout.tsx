import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "VERA — Viva Evaluation and Report Automator",
  description:
    "Turn any GitHub repository into a structured architecture breakdown, project report, and personalized Viva flashcards. Built for engineering students.",
  keywords: ["viva preparation", "project analysis", "github", "AI", "engineering", "codebase analysis", "VERA"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
