import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rifa - Gana un premio increíble",
  description: "Rasca y descubre tu número de la suerte",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white father-day-bg`}>
        {children}
      </body>
    </html>
  );
}
