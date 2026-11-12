"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { shopInitials, useSellerShop } from "./SellerShopProvider";

const navItems = [
  { icon: "dashboard", label: "Dashboard", href: "/seller/dashboard" },
  { icon: "shopping_bag", label: "Orders", href: "/seller/orders", key: "orders" },
  { icon: "inventory_2", label: "Inventory", href: "/seller/inventory" },
  { icon: "gavel", label: "Auctions", href: "/seller/auctions", key: "auctions" },
  { icon: "description", label: "Reports", href: "/seller/reports" },
  { icon: "settings", label: "Settings", href: "/seller/settings" },
];

export default function SellerSidebar() {
  const pathname = usePathname();
  const { profile, stats } = useSellerShop();
  const shopName = profile?.shopName ?? "Cửa hàng của tôi";
  const isApproved = !profile || profile.status === "APPROVED";
  const counts: Record<string, number> = {
    orders: stats?.orders.byStatus.PENDING ?? 0,
    auctions: stats?.liveAuctions ?? 0,
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-[#fff1e8] border-r border-[#dbc1b9]/30 shadow-sm z-50 flex flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="px-6 py-5 flex items-center gap-3 border-b border-[#ede1d2]/50">
          <div className="w-10 h-10 rounded-xl bg-[#974226] flex items-center justify-center text-white shadow-sm">
            <span className="font-bold text-lg tracking-tighter">R</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[18px] font-bold text-[#974226] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              REWORE
            </span>
            <span className="text-[10px] font-semibold text-[#55433d] uppercase tracking-wider">
              Shop Owner Console
            </span>
          </div>
        </div>

        {/* Seller Profile Snippet */}
        <div className="px-5 py-4 mx-3 my-3 bg-[#ede1d2]/40 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#f2dfd1] border border-[#dbc1b9]/40 flex items-center justify-center text-[#974226] font-bold text-sm">
            {shopInitials(shopName)}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold text-[#231a11] truncate">{shopName}</span>
              <span className="material-symbols-outlined text-[#974226] text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <span className="text-[11px] font-semibold text-[#556138] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#556138] inline-block" />
              {isApproved ? "Verified Merchant" : "Chờ kích hoạt"}
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="px-4 mb-2">
          <Link
            href="/seller/products/new"
            className="w-full bg-[#974226] hover:bg-[#b65a3c] text-white text-[13px] font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-150"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            List New Item
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="mt-3 flex flex-col space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-3 text-[13px] font-semibold transition-all duration-200 ${
                  isActive
                    ? "text-[#974226] border-r-4 border-[#974226] bg-[#974226]/5 font-bold"
                    : "text-[#55443d] hover:text-[#231a11] hover:bg-[#f8e5d6]/60"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.key && counts[item.key] > 0 && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#ede1d2] text-[#6b6357] font-semibold">
                    {counts[item.key]}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: Store Status */}
      <div className="p-4 m-3 rounded-xl bg-white border border-[#dbc1b9]/30">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] font-medium text-[#55433d]">Store Status</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#556138]">
            <span className={`w-2 h-2 rounded-full ${isApproved ? "bg-[#556138]" : "bg-[#ba1a1a]"}`} />
            {isApproved ? "Live" : "Tạm dừng"}
          </span>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#974226] hover:underline"
        >
          View Public Storefront
          <span className="material-symbols-outlined text-[14px]">north_east</span>
        </Link>
      </div>
    </aside>
  );
}
