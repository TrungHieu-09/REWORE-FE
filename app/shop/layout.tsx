import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "REWORE — Curated Vintage & Circular Luxury",
  description:
    "Curated archival vintage fashion, verified authenticated escrow holds, and live circular luxury drops.",
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
