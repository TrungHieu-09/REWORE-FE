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
  type AuctionEligibility,
  type Order,
  type Product,
  type SellerSubscriptionSummary,
} from "@/app/lib/api";

const normalizeEligibility = (
  response: AuctionEligibility | { data: AuctionEligibility }
) => ("data" in response ? response.data : response);

const formatSubscriptionExpiry = (value?: string | null) =>
  value ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "Không giới hạn";

export default function SellerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [eligibility, setEligibility] = useState<AuctionEligibility | null>(null);
  const [subscriptionSummary, setSubscriptionSummary] = useState<SellerSubscriptionSummary | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [premiumReference, setPremiumReference] = useState("");
  const [premiumNote, setPremiumNote] = useState("");
  const [requestingPremium, setRequestingPremium] = useState(false);

  const sellerStatus = user?.sellerStatus ?? (user?.role === "SELLER" ? "APPROVED" : "NONE");
  const canLiveAuction = eligibility?.eligible ?? false;
  const currentPlan = eligibility?.currentPlan ?? user?.sellerSubscriptionPlan ?? "FREE";
  const subscriptionExpiresAt = eligibility?.subscriptionExpiresAt ?? user?.sellerSubscriptionExpiresAt ?? null;
  const subscriptionActive = eligibility?.subscriptionActive ?? currentPlan === "PREMIUM";
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
      sellerApi.auctionEligibility(),
      sellerApi.subscription(),
    ]).then(([productResult, auctionResult, orderResult, eligibilityResult, subscriptionResult]) => {
      if (cancelled) return;

      if (productResult.status === "fulfilled") setProducts(productResult.value.data);
      if (auctionResult.status === "fulfilled") {
        setAuctions(auctionResult.value.data.filter((auction) => auction.sellerId === user.id));
      }
      if (orderResult.status === "fulfilled") setOrders(orderResult.value.data);
      if (eligibilityResult.status === "fulfilled") {
        setEligibility(normalizeEligibility(eligibilityResult.value));
      } else {
        setEligibility(null);
      }
      if (subscriptionResult.status === "fulfilled") {
        setSubscriptionSummary(subscriptionResult.value.data);
      }

      const firstError = [productResult, auctionResult, orderResult, eligibilityResult, subscriptionResult].find(
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

  const paidRevenue = orders
    .filter((order) => ["PAID", "SHIPPED", "DELIVERED"].includes(order.status))
    .reduce((sum, order) => sum + order.totalPrice + order.shippingFee, 0);

  const requestPremium = async () => {
    setRequestingPremium(true);
    setMessage("");
    try {
      const res = await sellerApi.requestPremium({
        durationMonths: 1,
        paymentReference: premiumReference.trim() || undefined,
        note: premiumNote.trim() || undefined,
      });
      setSubscriptionSummary((current) => current ? { ...current, pendingRequest: res.data } : current);
      setPremiumReference("");
      setPremiumNote("");
      setMessage("Đã gửi yêu cầu Premium. Admin sẽ xác nhận thanh toán thủ công.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Không thể gửi yêu cầu Premium.");
    } finally {
      setRequestingPremium(false);
    }
  };

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
      title: "My Listings",
      description: "Loaded from /api/products filtered by your seller id.",
      available: true,
      href: "/seller/listings",
      stat: `${products.filter((product) => product.status === "ACTIVE").length} active`,
    },
    {
      icon: "receipt_long",
      title: "Orders",
      description: "Confirm shipments after admin verifies manual transfer payments.",
      available: true,
      href: "/seller/orders",
      stat: `${orders.length} orders`,
    },
    {
      icon: "gavel",
      title: "Live Auctions",
      description: canLiveAuction
        ? "Gói Premium đang active, shop có thể tạo phòng đấu giá."
        : loading
        ? "Đang kiểm tra gói Premium..."
        : "Đăng ký gói Premium để mở tính năng tạo phòng đấu giá.",
      available: canLiveAuction,
      href: "/seller/auctions",
      stat: `${auctions.filter((auction) => auction.status === "LIVE").length} live`,
    },
    {
      icon: "shopping_bag",
      title: "Orders",
      description: "Xem và xử lý đơn hàng từ buyer của bạn.",
      available: true,
      href: "/seller/orders",
      stat: `${orders.length} đơn`,
    },
    {
      icon: "query_stats",
      title: "Analytics",
      description: "Thống kê doanh thu, lượt xem và hiệu suất cửa hàng.",
      available: true,
      href: "/seller/analytics",
      stat: `₫${new Intl.NumberFormat("vi-VN").format(paidRevenue)}`,
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
            You can only access selling tools after your seller profile is approved by admin.
          </p>
          <Link
            href={sellerStatus === "PENDING" || sellerStatus === "PENDING_VERIFICATION" || sellerStatus === "REJECTED" || sellerStatus === "SUSPENDED" ? "/profile/become-seller/status" : "/profile/become-seller"}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#974226] px-6 py-3 text-[13px] font-semibold text-white hover:bg-[#b65a3c] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            {sellerStatus === "NONE" ? "Apply to become seller" : "View seller status"}
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
              Gói hiện tại: <strong className="text-[#974226]">{currentPlan}</strong>. {loading ? "Loading seller data..." : "Dashboard data is mapped to backend APIs."}
            </p>
            {message && <p className="mt-2 text-sm text-[#ba1a1a]">{message}</p>}
          </div>

          <div
            className="mb-10 bg-white rounded-[20px] border border-[#dbc1b9]/30 shadow-[0_4px_20px_-4px_rgba(43,33,24,0.06)] p-5 md:p-6 flex flex-col sm:flex-row items-center gap-5 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="flex-1 w-full">
              <div className="flex justify-between text-[12px] text-[#88726c] mb-2 font-medium">
                <span>Seller plan: {currentPlan}</span>
                <span>{subscriptionActive ? `Hết hạn: ${formatSubscriptionExpiry(subscriptionExpiresAt)}` : "Live Auctions yêu cầu Premium"}</span>
              </div>
              <div className="w-full h-2.5 bg-[#f2dfd1] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#974226] rounded-full transition-all duration-1000"
                  style={{ width: `${canLiveAuction ? 100 : 35}%` }}
                />
              </div>
            </div>
            {canLiveAuction ? (
              <span className="shrink-0 px-3 py-1.5 rounded-full bg-[#dae9b5] text-[#3f4b25] text-[12px] font-bold border border-[#becc9b]/60 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                Live Auctions unlocked
              </span>
            ) : (
              <span className="shrink-0 text-[13px] text-[#88726c] font-medium">
                {loading ? "Checking Live Auctions" : "Upgrade Premium to unlock"}
              </span>
            )}
          </div>

          {!subscriptionActive && (
            <section
              className="mb-10 bg-white rounded-[20px] border border-[#dbc1b9]/30 shadow-[0_4px_20px_-4px_rgba(43,33,24,0.06)] p-5 md:p-6 opacity-0 animate-fade-in-up"
              style={{ animationDelay: "0.08s" }}
            >
              <div className="flex flex-col lg:flex-row gap-5 lg:items-end">
                <div className="flex-1">
                  <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#974226] mb-2">
                    Premium Seller
                  </p>
                  <h2 className="font-[family-name:var(--font-playfair)] text-[24px] font-semibold text-[#231a11] mb-2">
                    Mở khoá đấu giá và đăng sản phẩm không giới hạn
                  </h2>
                  <p className="text-[13px] text-[#88726c] leading-relaxed">
                    Gói Free đăng tối đa {subscriptionSummary?.monthlyFreeProductLimit ?? 10} sản phẩm/tháng. Premium dự kiến ₫{new Intl.NumberFormat("vi-VN").format(subscriptionSummary?.premiumMonthlyPrice ?? 75000)}/tháng, admin sẽ xác nhận sau khi shop chuyển khoản.
                  </p>
                </div>
                {subscriptionSummary?.pendingRequest ? (
                  <div className="rounded-[18px] border border-[#dbc1b9]/60 bg-[#fff8f5] px-5 py-4 min-w-[260px]">
                    <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#974226]">Đang chờ duyệt</p>
                    <p className="mt-1 text-[13px] text-[#55433d]">
                      Yêu cầu {subscriptionSummary.pendingRequest.durationMonths} tháng đang chờ admin xác nhận.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 w-full lg:max-w-[420px]">
                    <input
                      className="admin-input"
                      value={premiumReference}
                      onChange={(event) => setPremiumReference(event.target.value)}
                      placeholder="Mã giao dịch / nội dung chuyển khoản"
                    />
                    <textarea
                      className="admin-textarea"
                      value={premiumNote}
                      onChange={(event) => setPremiumNote(event.target.value)}
                      placeholder="Ghi chú cho admin"
                    />
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#974226] px-5 py-3 text-[13px] font-semibold text-white hover:bg-[#b65a3c] transition-colors disabled:opacity-60"
                      disabled={requestingPremium}
                      onClick={requestPremium}
                    >
                      <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                      {requestingPremium ? "Đang gửi..." : "Gửi yêu cầu Premium"}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

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
