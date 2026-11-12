"use client";

import Link from "next/link";
import { shopInitials, useSellerShop } from "./SellerShopProvider";

export default function SellerTopBar() {
  const { profile, stats } = useSellerShop();
  const shopName = profile?.shopName ?? "Cửa hàng của tôi";
  const feeLabel = `Phí sàn ${stats?.platformFees.rate ?? 5}%`;
  const pendingOrders = stats?.orders.byStatus.PENDING ?? 0;

  return (
    <header className="sticky top-0 z-40 bg-[#fff8f5] border-b border-[#dbc1b9]/30 flex justify-between items-center h-16 px-6">
      {/* Left: Search */}
      <div className="relative w-96">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#88726c] text-[20px]">
          search
        </span>
        <input
          type="text"
          placeholder="Search orders, listings, buyers..."
          className="w-full pl-10 pr-4 py-2 bg-white rounded-full border border-[#dbc1b9]/50 text-[14px] placeholder:text-[#88726c] text-[#231a11] focus:outline-none focus:ring-1 focus:ring-[#231a11] focus:border-[#231a11] transition-all shadow-sm"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Link
          href="/seller/orders"
          className="relative p-2.5 rounded-full hover:bg-[#f2dfd1]/50 transition-all text-[#55433d] hover:text-[#231a11]"
          title={pendingOrders > 0 ? `${pendingOrders} đơn đang chờ xử lý` : "Không có đơn chờ xử lý"}
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          {pendingOrders > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#974226]" />}
        </Link>

        {/* Messages */}
        <Link
          href="/messages"
          className="relative p-2.5 rounded-full hover:bg-[#f2dfd1]/50 transition-all text-[#55433d] hover:text-[#231a11]"
          title="Messages"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
        </Link>

        <div className="h-6 w-px bg-[#dbc1b9]/40 mx-1" />

        {/* Account */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-[#f2dfd1]/50 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-[#ffdbd0] border border-[#dbc1b9] flex items-center justify-center text-[#974226] font-bold text-xs">
            {shopInitials(shopName)}
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-[13px] font-bold text-[#231a11] leading-tight">{shopName}</span>
            <span className="block text-[11px] text-[#88726c] leading-tight">{feeLabel}</span>
          </div>
          <span className="material-symbols-outlined text-[#88726c] text-[18px]">expand_more</span>
        </Link>
      </div>
    </header>
  );
}
