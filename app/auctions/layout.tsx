import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import AuthGuard from "@/app/components/AuthGuard";

export const metadata: Metadata = {
  title: "Auctions — REWORE",
  description:
    "Đấu giá đồ 2hand trên REWORE: xem phiên đang diễn ra, sắp mở và sắp kết thúc.",
};

export default function AuctionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <Navbar />
      {children}
    </AuthGuard>
  );
}
