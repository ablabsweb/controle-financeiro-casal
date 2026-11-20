import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arthur & Pyetra | Finanças",
  description: "Controle financeiro do casal e do novo apê",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-[#09090b] text-zinc-100">
        {children}
      </body>
    </html>
  );
}