"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState, LoadingSkeleton } from "../../components/admin/AdminStates";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { ApiError, auctionsApi, type Auction } from "../../lib/api";
import { formatShortDate, formatVnd, normalizedStatusLabel } from "../../admin/_utils";

const auctionTone = (status: Auction["status"]) => {
  if (status === "LIVE") return "red";
  if (status === "UPCOMING") return "orange";
  if (status === "ENDED") return "green";
  return "neutral";
};

export default function SellerAuctionsPage() {
  const { user, isLoading } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Cập nhật mốc thời gian mỗi 30 giây để nút "đóng phiên" hiện đúng lúc.
  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const replaceAuction = (updated: Auction) =>
    setAuctions((items) =>
      items.map((item) => (item.id === updated.id ? { ...item, ...updated, product: updated.product ?? item.product } : item))
    );

  const cancelAuction = async (auction: Auction) => {
    if (!window.confirm("Hủy phiên đấu giá này? Sản phẩm sẽ quay lại trạng thái bán thường.")) return;
    setBusyId(auction.id);
    setMessage("");
    try {
      const res = await auctionsApi.cancel(auction.id);
      replaceAuction(res.data);
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể hủy phiên đấu giá.");
    } finally {
      setBusyId("");
    }
  };

  const closeAuction = async (auction: Auction) => {
    if (!window.confirm("Chốt phiên đấu giá và tạo đơn cho người thắng?")) return;
    setBusyId(auction.id);
    setMessage("");
    try {
      const res = await auctionsApi.close(auction.id);
      replaceAuction(res.data);
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể chốt phiên đấu giá.");
    } finally {
      setBusyId("");
    }
  };

  const sellerStatus = user?.sellerStatus ?? (user?.role === "SELLER" ? "APPROVED" : "NONE");
  const isSeller = user?.role === "SELLER" && sellerStatus === "APPROVED";
  const liveCount = useMemo(() => auctions.filter((auction) => auction.status === "LIVE").length, [auctions]);

  useEffect(() => {
    if (isLoading || !user?.id || !isSeller) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setMessage("");

      auctionsApi
        .list({ limit: 50 })
        .then((result) => {
          if (cancelled) return;
          setAuctions(result.data.filter((auction) => auction.sellerId === user.id));
        })
        .catch((err) => {
          if (cancelled) return;
          setMessage(err instanceof ApiError ? err.message : "Không tải được dữ liệu đấu giá.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isLoading, isSeller, user?.id]);

  return (
    <div className="seller-create-root">
      <main className="seller-create-layout">
        {!isLoading && !isSeller ? (
          <section className="seller-create-locked">
            <span className="material-symbols-outlined">lock</span>
            <h1>Seller tools are locked</h1>
            <p>Bạn chưa có shop. Đăng sản phẩm đầu tiên để mở shop và dùng các công cụ này.</p>
            <Link href="/seller/products/new">Đăng sản phẩm đầu tiên</Link>
          </section>
        ) : (
          <div className="seller-listings-page">
            <header className="seller-create-head">
              <div>
                <div className="seller-create-kicker">
                  <span className="material-symbols-outlined">gavel</span>
                  Live Auctions
                </div>
                <h1>Đấu giá của shop</h1>
                <p>Theo dõi phiên đấu giá đã tạo. Chọn một sản phẩm đã đăng để mở phiên đấu giá.</p>
                {message && <p className="seller-listing-error">{message}</p>}
              </div>
              <Link href="/seller/auctions/new" className="seller-add-listing">
                <span className="material-symbols-outlined">add</span>
                Tạo đấu giá
              </Link>
            </header>

            <section className="seller-listing-stats">
              <article>
                <span>Tổng đấu giá</span>
                <strong>{auctions.length}</strong>
              </article>
              <article>
                <span>Đang live</span>
                <strong>{liveCount}</strong>
              </article>
            </section>

            {loading ? (
              <LoadingSkeleton rows={4} />
            ) : auctions.length === 0 ? (
              <EmptyState icon="gavel" title="Chưa có đấu giá" desc="Tạo phiên đấu giá đầu tiên từ một sản phẩm đã đăng." />
            ) : (
              <section className="seller-listing-list">
                {auctions.map((auction) => (
                  <article className="seller-listing-card" key={auction.id}>
                    <div className="seller-listing-image">
                      <div className="seller-listing-image-fallback">
                        <span className="material-symbols-outlined">gavel</span>
                      </div>
                    </div>
                    <div className="seller-listing-body">
                      <div className="seller-listing-main">
                        <div>
                          <h2>{auction.product?.title ?? "Auction item"}</h2>
                          <p>{formatShortDate(auction.startTime)} - {formatShortDate(auction.endTime)}</p>
                        </div>
                        <span className="sp-price">{formatVnd(auction.currentBid || auction.startPrice)}</span>
                      </div>
                      <div className="seller-listing-meta">
                        <StatusBadge label={normalizedStatusLabel(auction.status)} tone={auctionTone(auction.status)} />
                        <span>
                          <span className="material-symbols-outlined">payments</span>
                          Start: {formatVnd(auction.startPrice)}
                        </span>
                        <span>
                          <span className="material-symbols-outlined">trending_up</span>
                          Step: {formatVnd(auction.minIncrement)}
                        </span>
                      </div>
                      {(auction.status === "LIVE" || auction.status === "UPCOMING") && (
                        <div className="flex flex-wrap gap-2 pt-3">
                          {auction.status === "LIVE" && new Date(auction.endTime).getTime() <= nowMs && (
                            <button
                              type="button"
                              disabled={busyId === auction.id}
                              onClick={() => closeAuction(auction)}
                              className="px-4 py-2 rounded-full bg-[#556138] text-white text-xs font-semibold hover:bg-[#6d7a4f] disabled:opacity-50"
                            >
                              Chốt phiên &amp; tạo đơn
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busyId === auction.id}
                            onClick={() => cancelAuction(auction)}
                            className="px-4 py-2 rounded-full border border-[#ba1a1a]/40 text-[#ba1a1a] text-xs font-semibold hover:bg-[#ffdad6]/40 disabled:opacity-50"
                          >
                            Hủy phiên
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
