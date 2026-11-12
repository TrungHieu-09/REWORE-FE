"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  ApiError,
  auctionsApi,
  ordersApi,
  productsApi,
  sellerApi,
  type Auction,
  type Order,
  type Product,
  type SellerStats,
} from "@/app/lib/api";

export default function SellerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const sellerStatus = user?.sellerStatus ?? (user?.role === "SELLER" ? "APPROVED" : "NONE");
  const isSeller = user?.role === "SELLER" && sellerStatus === "APPROVED";

  useEffect(() => {
    if (user?.role === "ADMIN") router.replace("/admin");
  }, [router, user?.role]);

  useEffect(() => {
    if (!user?.id || !isSeller) {
      return;
    }
    let cancelled = false;

    Promise.allSettled([
      productsApi.list({ sellerId: user.id, limit: 50 }),
      auctionsApi.list({ limit: 50 }),
      ordersApi.list({ role: "seller", limit: 50 }),
      sellerApi.stats(),
    ]).then(([productResult, auctionResult, orderResult, statsResult]) => {
      if (cancelled) return;

      if (productResult.status === "fulfilled") setProducts(productResult.value.data);
      if (auctionResult.status === "fulfilled") {
        setAuctions(auctionResult.value.data.filter((auction) => auction.sellerId === user.id));
      }
      if (orderResult.status === "fulfilled") setOrders(orderResult.value.data);
      if (statsResult.status === "fulfilled") setStats(statsResult.value.data);

      const firstError = [productResult, auctionResult, orderResult, statsResult].find(
        (result) => result.status === "rejected"
      );
      if (firstError?.status === "rejected") {
        const err = firstError.reason;
        setMessage(err instanceof ApiError ? err.message : "Some seller data could not be loaded.");
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isSeller, user?.id]);

  const features = [
    {
      icon: "add_circle",
      title: "List an Item",
      description: "Create a product with multipart image upload.",
      available: isSeller,
      href: "/seller/products/new",
      stat: `${products.length} listings`,
    },
    {
      icon: "inventory_2",
      title: "Inventory",
      description: "Kho hàng: xem, sửa và ẩn các sản phẩm đã đăng.",
      available: true,
      href: "/seller/inventory",
      stat: `${products.filter((product) => product.status === "ACTIVE").length} đang bán`,
    },
    {
      icon: "receipt_long",
      title: "Orders",
      description: "Xem và xử lý đơn hàng từ buyer, giao hàng sau khi admin xác nhận thanh toán.",
      available: true,
      href: "/seller/orders",
      stat: `${orders.length} đơn`,
    },
    {
      icon: "gavel",
      title: "Live Auctions",
      description: "Mở phiên đấu giá từ các sản phẩm đã đăng.",
      available: true,
      href: "/seller/auctions",
      stat: `${auctions.filter((auction) => auction.status === "LIVE").length} live`,
    },
    {
      icon: "description",
      title: "Reports",
      description: "Báo cáo doanh thu, phí sàn và tiền sàn đã chuyển cho shop.",
      available: true,
      href: "/seller/reports",
      stat: `₫${new Intl.NumberFormat("vi-VN").format(stats?.payout.net ?? 0)}`,
    },
  ];

  return (
    <div className="w-full">
      {!isSeller ? (
        <div className="bg-white rounded-[24px] shadow-[0_12px_48px_-8px_rgba(43,33,24,0.09)] border border-[#dbc1b9]/30 p-8 md:p-12 text-center max-w-[620px] mx-auto mt-8">
          <div className="w-16 h-16 rounded-full bg-[#f2dfd1] flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-[30px] text-[#974226]">hourglass_empty</span>
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-[32px] font-semibold text-[#231a11] mb-3">
            Seller dashboard is locked
          </h1>
          <p className="text-[15px] text-[#55433d] leading-relaxed mb-7">
            Tài khoản người bán do admin cấp. Hãy liên hệ để được kích hoạt.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#974226] px-6 py-3 text-[13px] font-semibold text-white hover:bg-[#b65a3c] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            Về cửa hàng
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-10 opacity-0 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#974226] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  storefront
                </span>
              </div>
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#974226]">
                Seller Dashboard
              </p>
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-[36px] md:text-[44px] font-bold text-[#231a11] leading-tight mb-2">
              Welcome back, {user?.name ?? "Seller"}!
            </h1>
            <p className="text-[16px] text-[#55433d]">
              {loading ? "Loading seller data..." : "Quản lý sản phẩm, đơn hàng và đấu giá của shop."}
            </p>
            {message && <p className="mt-2 text-sm text-[#ba1a1a]">{message}</p>}
          </div>

          <div
            className="mb-10 bg-white rounded-[20px] border border-[#dbc1b9]/30 shadow-[0_4px_20px_-4px_rgba(43,33,24,0.06)] p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-5 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="flex-1">
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#974226] mb-1">Phí sàn</p>
              <p className="text-[14px] text-[#55433d] leading-relaxed">
                Sàn trừ {stats?.platformFees.rate ?? 5}% giá hàng của mỗi đơn hoàn tất vào tiền thanh toán cho bạn. Bạn không phải nạp hay trả tiền trước.
              </p>
            </div>
            <div className="flex gap-6 shrink-0">
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#88726c]">Chờ sàn chuyển</span>
                <strong className="text-[18px] text-[#231a11]">₫{new Intl.NumberFormat("vi-VN").format(stats?.payout.pending ?? 0)}</strong>
              </div>
              <div>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#88726c]">Phí sàn đã trừ</span>
                <strong className="text-[18px] text-[#231a11]">₫{new Intl.NumberFormat("vi-VN").format(stats?.platformFees.total ?? 0)}</strong>
              </div>
            </div>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.10s" }}
          >
            {features.map((f) => (
              <div
                key={f.title}
                className={`bg-white rounded-[20px] p-6 border shadow-[0_4px_20px_-4px_rgba(43,33,24,0.06)] flex flex-col gap-4 transition-all duration-300 ${
                  f.available
                    ? "border-[#dbc1b9]/30 hover:shadow-[0_10px_32px_-6px_rgba(43,33,24,0.1)] hover:-translate-y-0.5 cursor-pointer group"
                    : "border-[#f2dfd1] opacity-60 cursor-not-allowed"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                  f.available
                    ? "bg-[#ffdbd0]/50 group-hover:bg-[#974226]"
                    : "bg-[#f2dfd1]"
                }`}>
                  <span
                    className={`material-symbols-outlined text-[22px] transition-colors duration-300 ${
                      f.available ? "text-[#974226] group-hover:text-white" : "text-[#88726c]"
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {f.icon}
                  </span>
                </div>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#974226] mb-2">{f.stat}</p>
                  <h3 className="font-[family-name:var(--font-playfair)] text-[17px] font-semibold text-[#231a11] mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-[13px] text-[#88726c] leading-relaxed">{f.description}</p>
                </div>
                {f.available && (
                  <Link href={f.href} className="mt-auto flex items-center gap-1 text-[12px] font-semibold text-[#974226] group-hover:gap-2 transition-all">
                    <span>Open</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div
            className="text-center opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.18s" }}
          >
            <div className="inline-flex items-center gap-2 bg-[#f2dfd1]/40 border border-[#dbc1b9]/30 rounded-full px-5 py-2.5 text-[13px] text-[#88726c]">
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              Product creation and listing management are connected to backend APIs.
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/profile" className="text-[13px] font-semibold text-[#974226] hover:underline underline-offset-4">
              ← Back to Profile
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
