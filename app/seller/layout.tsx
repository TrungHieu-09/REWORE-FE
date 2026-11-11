import type { Metadata } from "next";
import SellerSidebar from "../components/seller/SellerSidebar";
import SellerTopBar from "../components/seller/SellerTopBar";
import SellerGuard from "../components/SellerGuard";
import { SellerShopProvider } from "../components/seller/SellerShopProvider";

export const metadata: Metadata = {
  title: "REWORE — Shop Owner Console",
  description: "Seller dashboard for managing listings, orders, auctions, and analytics on REWORE.",
};

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <SellerGuard>
      <SellerShopProvider>
      <div
        className="min-h-screen bg-[#fff8f5] text-[#231a11] antialiased flex"
        style={{ backgroundImage: "radial-gradient(rgba(35, 26, 17, 0.04) 1px, transparent 0)", backgroundSize: "24px 24px" }}
      >
        {/* Fixed Left Sidebar */}
        <SellerSidebar />

        {/* Main area: top bar + page content */}
        <div className="flex flex-col flex-1 ml-64">
          <SellerTopBar />
          <main className="flex-1 p-8 w-full max-w-[1400px]">
            {children}
          </main>
        </div>
      </div>
      </SellerShopProvider>
    </SellerGuard>
  );
}
