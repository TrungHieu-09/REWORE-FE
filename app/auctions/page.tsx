"use client";

import { useEffect, useMemo, useState } from "react";
import type { Auction, AuctionCategory } from "./_types";
import CategoryFilterBar from "./_components/CategoryFilterBar";
import FeaturedAuctionCard from "./_components/FeaturedAuctionCard";
import AuctionGridCard from "./_components/AuctionGridCard";
import ReputationSidebar from "./_components/ReputationSidebar";
import Footer from "../components/Footer";
import { ApiError, auctionsApi, type Auction as ApiAuction } from "@/app/lib/api";

function secondsUntil(iso: string) {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

function startsInLabel(iso: string) {
  const seconds = secondsUntil(iso);
  if (seconds <= 0) return "Soon";
  const hours = Math.floor(seconds / 3600);
  if (hours < 1) return `${Math.max(1, Math.floor(seconds / 60))}m`;
  if (hours < 24) return `${hours}h`;
  if (hours < 48) return "Tomorrow";
  return `${Math.ceil(hours / 24)}d`;
}

function mapApiAuction(auction: ApiAuction): Auction {
  const product = auction.product;
  const isLive = auction.status === "LIVE";
  return {
    id: auction.id,
    title: product?.title ?? "REWORE Auction",
    category: product?.category ?? "Other",
    imageUrl: product?.images?.[0],
    imageAlt: product?.title ?? "REWORE auction item",
    status: isLive ? "live" : auction.status === "UPCOMING" ? "starts_soon" : "upcoming",
    currentBid: auction.currentBid,
    startingBid: auction.startPrice,
    endsInSeconds: isLive ? secondsUntil(auction.endTime) : undefined,
    startsInLabel: isLive ? undefined : startsInLabel(auction.startTime),
    watcherCount: auction._count?.bids ?? auction.bids?.length ?? 0,
  };
}

export default function LiveAuctionsPage() {
  const [activeCategory, setActiveCategory] = useState<AuctionCategory>("All");
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    auctionsApi
      .list({ limit: 50 })
      .then((res) => {
        if (!cancelled) {
          setAuctions((res.data ?? []).map(mapApiAuction));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setApiMessage(
            err instanceof ApiError
              ? err.message
              : "Không tải được danh sách đấu giá."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(auctions.map((auction) => auction.category))).sort()],
    [auctions]
  );

  const filteredAuctions = useMemo(
    () =>
      activeCategory === "All"
        ? auctions
        : auctions.filter((auction) => auction.category === activeCategory),
    [activeCategory, auctions]
  );

  const filteredFeatured = filteredAuctions.filter(
    (auction) => auction.status === "live"
  );
  const filteredGrid = filteredAuctions.filter(
    (auction) => auction.status !== "live"
  );

  return (
    <div className="min-h-screen bg-[#fff8f5] text-[#231a11] flex flex-col font-body-md antialiased">
      <main className="flex-grow max-w-[1280px] mx-auto px-5 md:px-12 py-10 flex flex-col lg:flex-row gap-8 w-full">
        <div className="flex-1 min-w-0">
          <header className="mb-10">
            <h1 className="font-display-lg text-4xl md:text-5xl font-bold text-[#231a11] leading-[1.1] tracking-tight mb-3">
              Live Auctions
            </h1>
            <p className="text-[#55433d] text-base leading-relaxed max-w-xl">
              Đặt giá đồ 2hand theo thời gian thực. Tiền thắng đấu giá được sàn giữ đến khi bạn nhận hàng.
            </p>
            <p className="mt-3 text-xs font-semibold text-[#88726c] uppercase tracking-wider">
              {filteredAuctions.length} auction items active
            </p>
          </header>

          <div className="mb-8">
            <CategoryFilterBar
              active={activeCategory}
              categories={categories}
              onChange={setActiveCategory}
            />
          </div>

          {filteredFeatured.length > 0 && (
            <section className="mb-14">
              <h2 className="font-headline-lg text-2xl font-bold text-[#231a11] mb-6 flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#974226] opacity-60" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#974226]" />
                </span>
                Happening Now
              </h2>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {filteredFeatured.map((auction) => (
                  <FeaturedAuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            </section>
          )}

          {filteredGrid.length > 0 && (
            <section>
              <h2 className="font-headline-lg text-2xl font-bold text-[#231a11] mb-6">
                Upcoming &amp; Ending Soon
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {filteredGrid.map((auction) => (
                  <AuctionGridCard key={auction.id} auction={auction} />
                ))}
              </div>
            </section>
          )}

          {dataLoading && (
            <div className="py-24 flex flex-col items-center gap-3 text-center">
              <span className="material-symbols-outlined text-4xl text-[#974226] animate-spin">progress_activity</span>
              <p className="text-[#88726c] font-medium">Đang tải phiên đấu giá...</p>
            </div>
          )}

          {!dataLoading && apiMessage && (
            <div className="py-16 flex flex-col items-center gap-3 text-center bg-white rounded-3xl border border-[#dbc1b9]/40 p-12">
              <span className="material-symbols-outlined text-5xl text-[#ba1a1a]">error</span>
              <p className="text-[#55433d] font-medium">{apiMessage}</p>
            </div>
          )}

          {!dataLoading && !apiMessage && auctions.length === 0 && (
            <div className="py-24 flex flex-col items-center gap-3 text-center bg-white rounded-3xl border border-[#dbc1b9]/40 p-12">
              <span className="material-symbols-outlined text-5xl text-[#dbc1b9]">gavel</span>
              <p className="font-headline-lg text-xl font-bold text-[#231a11]">Chưa có phiên đấu giá nào</p>
              <p className="text-[#88726c] text-sm">Hãy quay lại sau — các phiên mới sẽ xuất hiện tại đây.</p>
            </div>
          )}

          {!dataLoading && auctions.length > 0 && filteredFeatured.length === 0 && filteredGrid.length === 0 && (
            <div className="py-24 flex flex-col items-center gap-3 text-center bg-white rounded-3xl border border-[#dbc1b9]/40 p-12">
              <span className="material-symbols-outlined text-5xl text-[#dbc1b9]">
                search_off
              </span>
              <p className="text-[#88726c] font-medium">
                No auctions found in <strong>{activeCategory}</strong>.
              </p>
              <button
                onClick={() => setActiveCategory("All")}
                className="mt-2 text-[#974226] text-sm font-semibold hover:underline"
              >
                View all auctions →
              </button>
            </div>
          )}
        </div>

        {/* Reputation Sidebar */}
        <div className="lg:w-80 flex-shrink-0">
          <ReputationSidebar />
        </div>
      </main>

      <Footer />
    </div>
  );
}
