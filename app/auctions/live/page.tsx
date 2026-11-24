"use client";

import { Suspense, useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  ApiError,
  auctionsApi,
  bidsApi,
  sellerDisplayName,
  type Auction,
  type Bid,
} from "@/app/lib/api";

type BidEntry = { id: string; user: string; initials: string; amount: number; ago: string };

function fmt(n: number) {
  return "₫" + new Intl.NumberFormat("vi-VN").format(n);
}

function initials(name?: string | null) {
  const clean = name?.trim();
  return clean ? clean.charAt(0).toUpperCase() : "U";
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return seconds <= 5 ? "Just now" : `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function secondsUntil(iso?: string) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

function mapBid(bid: Bid): BidEntry {
  const name = bid.bidder?.name ?? "Bidder";
  return {
    id: bid.id,
    user: `@${name}`,
    initials: initials(name),
    amount: bid.amount,
    ago: timeAgo(bid.createdAt),
  };
}

function useCountdown(targetIso?: string) {
  const [sec, setSec] = useState(() => secondsUntil(targetIso));

  useEffect(() => {
    const id = setInterval(() => setSec(secondsUntil(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const seconds = (sec % 60).toString().padStart(2, "0");
  return { display: hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`, seconds: sec };
}

function LiveAuctionContent() {
  const { isLoggedIn } = useAuth();
  const searchParams = useSearchParams();
  const requestedAuctionId = searchParams.get("id");
  const [activeThumb, setActiveThumb] = useState(0);
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [bids, setBids] = useState<BidEntry[]>([]);
  const [bidPlaced, setBidPlaced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    // Có ?id=... thì mở đúng phiên đó, nếu không thì lấy phiên LIVE đầu tiên
    const loadAuction = requestedAuctionId
      ? auctionsApi.get(requestedAuctionId)
      : auctionsApi
          .list({ status: "LIVE", limit: 1 })
          .then((res) => {
            const firstLive = res.data[0];
            return firstLive ? auctionsApi.get(firstLive.id) : null;
          });

    loadAuction
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setMessage("No live auction from API right now.");
          return;
        }
        setAuction(res.data);
        const apiBids = res.data.bids?.map(mapBid) ?? [];
        setBids(apiBids.length ? apiBids : []);
        setBidAmount(res.data.currentBid + res.data.minIncrement);
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage(
            err instanceof ApiError
              ? err.message
              : "Could not load live auction from API."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestedAuctionId]);

  // Cập nhật lịch sử bid gần như realtime bằng GET /api/bids/auction/:id (5 giây/lần)
  useEffect(() => {
    if (!auction?.id || auction.status !== "LIVE") return;
    let cancelled = false;
    const auctionId = auction.id;

    const refresh = () => {
      bidsApi
        .forAuction(auctionId, { limit: 20 })
        .then((res) => {
          if (cancelled || !res.data?.length) return;
          const latest = res.data.map(mapBid);
          setBids(latest);
          const top = Math.max(...res.data.map((bid) => bid.amount));
          setBidAmount((current) => Math.max(current, top + (auction.minIncrement ?? 0)));
        })
        .catch(() => {
          /* giữ dữ liệu cũ nếu lần poll này lỗi */
        });
    };

    const timer = setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [auction?.id, auction?.status, auction?.minIncrement]);

  const thumbnails = useMemo(() => {
    const images = auction?.product?.images?.filter(Boolean) ?? [];
    return images;
  }, [auction]);

  const productName = auction?.product?.title ?? "Live auction";
  const productDescription = auction?.product?.description ?? "";
  const seller = auction?.seller ?? auction?.product?.seller;
  const sellerName = sellerDisplayName(auction?.product?.seller ?? auction?.seller, sellerDisplayName(seller, "Seller"));
  const minIncrement = auction?.minIncrement ?? 0;
  const currentBid = Math.max(auction?.currentBid ?? 0, bids[0]?.amount ?? 0);
  const watching = auction?._count?.bids ?? bids.length;
  const { display: timeDisplay, seconds } = useCountdown(auction?.endTime);
  const isEndingSoon = seconds <= 30;
  const isLiveAuction = auction?.status === "LIVE";

  async function quickBid(increment: number) {
    await placeBid(currentBid + increment);
  }

  async function placeBid(amount = bidAmount) {
    if (amount <= currentBid || !auction) return;
    if (!isLoggedIn) {
      setMessage("Please log in before placing a bid.");
      return;
    }
    try {
      const res = await bidsApi.create({ auctionId: auction.id, amount });
      const newEntry = mapBid(res.data);
      setBids((prev) => [newEntry, ...prev]);
      setBidAmount(amount + minIncrement);
      setBidPlaced(true);
      setTimeout(() => setBidPlaced(false), 2500);
      historyRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Could not place bid.");
    }
  }

  return (
    <div className="la-root">
      <div className="la-topbar">
        <nav className="la-breadcrumb">
          <a href="/auctions" className="la-bc-link">Auctions</a>
          <span className="la-bc-sep">›</span>
          <span className="la-bc-cur">{productName}</span>
        </nav>
        <div className={`la-live-pill${isEndingSoon ? " ending" : ""}`}>
          <span className="la-live-dot" />
          {loading ? "CONNECTING" : isLiveAuction ? (isEndingSoon ? "ENDING SOON" : "LIVE · CONNECTED") : "NO LIVE AUCTION"}
        </div>
      </div>

      {message && <p className="mx-auto max-w-[1280px] px-5 md:px-12 pb-4 text-sm text-[#ba1a1a]">{message}</p>}

      {!loading && !auction ? (
        <div className="mx-auto max-w-[720px] px-5 md:px-12 py-24 text-center">
          <span className="material-symbols-outlined text-[64px] text-[#dbc1b9]">gavel</span>
          <h1 className="font-[family-name:var(--font-playfair)] text-[34px] font-semibold text-[#231a11] mt-4">
            Chưa có phiên live
          </h1>
          <p className="text-[#88726c] mt-2">Khi backend có phiên đấu giá live, phòng đấu giá sẽ hiển thị tại đây.</p>
        </div>
      ) : (

      <div className="la-grid">
        <aside className="la-product-panel">
          <div className="la-main-img-wrap">
            {thumbnails[activeThumb] ? (
              <Image
                src={thumbnails[activeThumb]}
                alt={productName}
                fill
                className="la-main-img"
                style={{ objectFit: "cover" }}
                sizes="400px"
              />
            ) : (
              <div className="admin-image-placeholder h-full">
                <span className="material-symbols-outlined">image_not_supported</span>
                <span>Không có ảnh</span>
              </div>
            )}
            <div className="la-est-badge">Start {fmt(auction?.startPrice ?? 0)}</div>
          </div>

          <div className="la-thumbs">
            {thumbnails.map((src, i) => (
              <button
                key={src}
                className={`la-thumb${activeThumb === i ? " active" : ""}`}
                onClick={() => setActiveThumb(i)}
              >
                <Image src={src} alt="" fill className="la-thumb-img" style={{ objectFit: "cover" }} sizes="80px" />
              </button>
            ))}
          </div>

          <div className="la-product-info">
            <h1 className="la-product-name">{productName}</h1>
            <p className="la-product-desc">{productDescription}</p>
            <div className="la-product-tags">
              <span className="la-tag olive">{auction?.product?.category ?? "Vintage"}</span>
              {auction?.product?.size && <span className="la-tag">Size: {auction.product.size}</span>}
              {auction?.product?.condition && <span className="la-tag">Condition: {auction.product.condition.replace("_", " ")}</span>}
            </div>
          </div>
        </aside>

        <main className="la-bid-panel">
          <div className={`la-bid-flash${bidPlaced ? " show" : ""}`}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
            Your bid of {fmt(bids[0]?.amount ?? bidAmount)} was placed!
          </div>

          <div className="la-timer-section">
            <p className="la-timer-label">TIME REMAINING</p>
            <div className={`la-timer-digits${isEndingSoon ? " ending" : ""}`}>
              {timeDisplay}
            </div>
            {isEndingSoon && (
              <p className="la-timer-warning">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
                Auction is ending soon.
              </p>
            )}
          </div>

          <div className="la-divider" />

          <div className="la-current-bid-section">
            <p className="la-cb-label">Current Bid</p>
            <div className="la-cb-amount">{fmt(currentBid)}</div>
            <div className="la-cb-bidder">
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#556138", fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              <span>{bids[0]?.user ?? `@${sellerName}`}</span>
            </div>
          </div>

          <div className="la-divider" />

          <div className="la-trust-row">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#88726c" }}>shield_person</span>
            <span className="la-trust-text">Minimum increment: {fmt(minIncrement)}</span>
            <span className="la-eligible-badge">Eligible</span>
          </div>

          <div className="la-quick-bids">
            {[minIncrement, minIncrement * 2, minIncrement * 5].map((inc) => (
              <button key={inc} className="la-quick-btn" onClick={() => quickBid(inc)} disabled={!auction}>
                + {fmt(inc)}
              </button>
            ))}
          </div>

          <div className="la-custom-bid-row">
            <span className="la-currency-prefix">₫</span>
            <input
              className="la-bid-input"
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              min={currentBid + minIncrement}
              step={minIncrement}
            />
          </div>

          <button
            className="la-place-bid-btn"
            onClick={() => placeBid()}
            disabled={!auction || bidAmount < currentBid + minIncrement}
          >
            Place Bid
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
          </button>

          {!isEndingSoon && (
            <p className="la-reset-note">Bids are validated by the backend against the live current bid.</p>
          )}
        </main>

        <aside className="la-sidebar">
          <div className="la-watchers-card">
            <div className="la-watcher-stat">
              <span className="la-watcher-num">{watching}</span>
              <span className="la-watcher-lbl">BIDS</span>
            </div>
            <div className="la-watcher-divider" />
            <div className="la-watcher-stat">
              <span className="la-watcher-num">{bids.length}</span>
              <span className="la-watcher-lbl">ACTIVE</span>
            </div>
          </div>

          <div className="la-history-card">
            <div className="la-history-header">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>history</span>
              LIVE HISTORY
            </div>
            <div className="la-history-list" ref={historyRef}>
              {bids.length === 0 ? (
                <p className="p-4 text-sm text-[#88726c]">No bids yet. Be the first bidder.</p>
              ) : bids.map((b, i) => (
                <div
                  key={b.id}
                  className={`la-history-row${i === 0 ? " top-bid" : ""}`}
                >
                  <div
                    className="la-hist-avatar"
                    style={{
                      background: i === 0 ? "#feeadc" : "#f2dfd1",
                      color: i === 0 ? "#974226" : "#55433d",
                    }}
                  >
                    {b.initials}
                  </div>
                  <div className="la-hist-info">
                    <span className="la-hist-user">{b.user}</span>
                    <span className="la-hist-ago">{b.ago}</span>
                  </div>
                  <span className={`la-hist-amount${i === 0 ? " top" : ""}`}>
                    {fmt(b.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="la-seller-card">
            <p className="la-seller-title">Sold by</p>
            <div className="la-seller-row">
              <div className="la-seller-avatar">{initials(sellerName)}</div>
              <div>
                <p className="la-seller-name">@{sellerName}</p>
                <p className="la-seller-meta">Reputation {seller?.reputation ?? 0} · {auction?.product?.seller?.isVerified || seller?.isVerified ? "Verified" : "Unverified"}</p>
              </div>
              {(auction?.product?.seller?.isVerified || seller?.isVerified) && (
                <span className="material-symbols-outlined la-seller-verified" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              )}
            </div>
            <div className="la-seller-stats">
              <div className="la-seller-stat">
                <span className="la-ss-val">{auction?.status ?? "LIVE"}</span>
                <span className="la-ss-lbl">Status</span>
              </div>
              <div className="la-seller-stat">
                <span className="la-ss-val">{auction?.product?.viewCount ?? 0}</span>
                <span className="la-ss-lbl">Views</span>
              </div>
              <div className="la-seller-stat">
                <span className="la-ss-val">{auction?.product?._count?.wishlistItems ?? 0}</span>
                <span className="la-ss-lbl">Saved</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
      )}
    </div>
  );
}




export default function LiveAuctionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fff8f5]" />}>
      <LiveAuctionContent />
    </Suspense>
  );
}
