"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { bidsApi, ordersApi, type Bid, type Order } from "@/app/lib/api";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(iso));
}

const statusColor = "bg-[#f2dfd1]/80 text-[#55443d] border border-[#dbc1b9]/60";

export default function TabOverview() {
  const { user } = useAuth();
  const [bids, setBids] = useState<Bid[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      bidsApi.myBids({ limit: 5 }),
      ordersApi.list({ role: "buyer", limit: 5 }),
    ]).then(([bidResult, orderResult]) => {
      if (cancelled) return;
      if (bidResult.status === "fulfilled") setBids(bidResult.value.data);
      if (orderResult.status === "fulfilled") setOrders(orderResult.value.data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const recentActivity = useMemo(() => {
    const bidItems = bids.map((bid) => ({
      id: `bid-${bid.id}`,
      title: `Bid Placed — ${bid.auction?.product?.title ?? "Auction item"}`,
      time: formatDate(bid.createdAt),
      status: bid.isWinning ? "Winning" : "Outbid",
      imageUrl: bid.auction?.product?.images?.[0],
      href: "",
    }));

    const orderItems = orders.map((order) => ({
      id: `order-${order.id}`,
      href: `/orders/${order.id}`,
      title: `Order — ${order.product?.title ?? "Marketplace item"}`,
      time: formatDate(order.createdAt),
      status: order.status,
      imageUrl: order.product?.images?.[0],
    }));

    return [...bidItems, ...orderItems].slice(0, 5);
  }, [bids, orders]);

  const stats = [
    { label: "Items Purchased", value: String(orders.length) },
    { label: "Active Bids", value: String(bids.filter((bid) => bid.auction?.status === "LIVE").length) },
    { label: "Items Sold", value: String(user?.totalSales ?? 0) },
  ];

  return (
    <div className="flex flex-col gap-8 opacity-0 animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-5 border border-[#dbc1b9]/30 shadow-[0_4px_16px_-4px_rgba(43,33,24,0.06)] flex flex-col justify-between h-24 hover:shadow-md transition-shadow"
          >
            <span className="text-[11px] font-semibold text-[#88726c] uppercase tracking-[0.08em]">
              {stat.label}
            </span>
            <span className="font-[family-name:var(--font-playfair)] text-[26px] font-semibold text-[#231a11] leading-none">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      <section>
        <h2 className="font-[family-name:var(--font-playfair)] text-[22px] font-semibold text-[#231a11] mb-5">
          Recent Activity
        </h2>
        <div className="bg-white rounded-[20px] shadow-[0_10px_40px_-10px_rgba(43,33,24,0.07)] border border-[#dbc1b9]/30 overflow-hidden">
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#88726c]">
              No recent activity from the API yet.
            </div>
          ) : recentActivity.map((item, i) => (
            <Link
              key={item.id}
              href={item.href || "/profile#orders"}
              className={`flex items-center gap-4 p-4 group hover:bg-[#fff8f5] transition-colors ${
                i < recentActivity.length - 1 ? "border-b border-[#f2dfd1]" : ""
              }`}
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#feeadc] relative">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="admin-image-placeholder h-full">
                    <span className="material-symbols-outlined">image_not_supported</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-[#231a11] truncate group-hover:text-[#974226] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[12px] text-[#88726c] mt-0.5">{item.time}</p>
              </div>
              <div className="shrink-0">
                <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${statusColor}`}>
                  {item.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
