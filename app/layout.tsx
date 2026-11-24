import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { SellerProvider } from "./context/SellerContext";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "REWORE — Chợ đồ 2hand",
  description:
    "Chợ đồ 2hand: mua bán quần áo, giày, túi đã qua sử dụng giá tốt, an tâm với giữ tiền trung gian.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${manrope.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-screen">
        <AuthProvider>
          <SellerProvider>
            {children}
          </SellerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

