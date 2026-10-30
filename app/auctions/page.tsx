"use client";

import { useEffect, useMemo, useState } from "react";
import type { Auction, AuctionCategory } from "./_types";
import CategoryFilterBar from "./_components/CategoryFilterBar";
import FeaturedAuctionCard from "./_components/FeaturedAuctionCard";
import AuctionGridCard from "./_components/AuctionGridCard";
import ReputationSidebar from "./_components/ReputationSidebar";
import Footer from "../components/Footer";
import { ApiError, auctionsApi, type Auction as ApiAuction } from "@/app/lib/api";

const DEFAULT_AUCTIONS: Auction[] = [
  {
    id: "auc-1",
    title: "1994 Yohji Yamamoto Double-Breasted Wool Trousers",
    category: "Denim & Tailoring",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCVORHaDw1vxnq8hjUQkbmUtNmMohHSYOUBiA0h9QrxSFfx2czkRLI6beOk7Oc6aCtAaIqaQgmftwsAgXRE5f598eV8rrZFhxEWVHGdlAseOUNkY51sodpPuZPplzmj0ipGmYy8bioQ7guu5uDfnf7BFH_S65zg53fgjMjMLQIDTabGVEkGpsPUTDx6ICuDEp-KZ-T8OPlSuO6Oj2LXJBMh18qW1VT9uh0iw4LkVa4",
    imageAlt: "Yohji Yamamoto Double-Breasted Wool Trousers",
    status: "live",
    currentBid: 670000,
    startingBid: 400000,
    endsInSeconds: 3420,
    watcherCount: 14,
  },
  {
    id: "auc-2",
    title: "Loro Piana Hand-Spun Mohair Cable Knit",
    category: "Knitwear",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7UtZiuwyQppux9C9LdY3Nfe951L96v1NkAFLleaplpsQgyfx-VMCoOEbMuZQgPKnlu6iVjrkRz2HNSxnNqvFNeMduoyiyQNUhHfiaJdeNSIfb_-RxAknupUV_Ah_NW4QYyNnosJmfNkTZ8ZejJTW8elJQpGOXV6la5j6xZtYf3kKAbbowq_hhkbSEVEg9-dEwj9RIiya52Q17bRDmTaRrDmCdrux7IxlRbFyqy9g",
    imageAlt: "Loro Piana Cable Knit",
    status: "live",
    currentBid: 850000,
    startingBid: 500000,
    endsInSeconds: 7850,
    watcherCount: 22,
  },
  {
    id: "auc-3",
    title: "1998 Helmut Lang Distressed Moto Jacket",
    category: "Outerwear",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCcGGVCvPOJQmShGOY3CBKfG3kpotIZWyV2sIInXEoo5fvyW8x25cDlT-had0uVrtzdbSOKvlvCUgnLojgNai2zT2uCEbXcq_bfekVlRMUj3k-oGNYV3oW9fv_RMw56ej1le_C2mFJ0ggeuIbZOVzWAF6cXD7nONUO3ify024M57MDVEu9uhNMLlULSG0SYJRhx_JZbPZEpWn3Q5pEheBKRPyOnBiZwuDhntJR-VQA",
    imageAlt: "Helmut Lang Moto Jacket",
    status: "starts_soon",
    currentBid: 2450000,
    startingBid: 1800000,
    startsInLabel: "45m",
    watcherCount: 39,
  },
  {
    id: "auc-4",
    title: "Studio D'Artisan Raw 16oz Selvedge Denim",
    category: "Denim & Tailoring",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCkkmVQrMW4VpLXouGum0M1kR-paNGepBLD7jkwMVkOkL7xrBHpT3M9QQYOs_WSIF555iYnVttmZzB106q0LrRRnlO7fTgUYlBFFL9fjY9LVrYq7wlm5egl53gM8kleNOoiNcBywMpZX02w4xC7sFAVoMgzPRFGYjxXCK22hq3B3KxvMD2Wwqc-osgef9WuXhfXq_5jfUkyA0_Jn04fG2YkPzZBK7HcOAqz1aHDZ4",
    imageAlt: "Selvedge Denim",
    status: "upcoming",
    currentBid: 920000,
    startingBid: 920000,
    startsInLabel: "18:00",
    watcherCount: 18,
  },
  {
    id: "auc-5",
    title: "Archive Céline Triomphe Box Bag in Black Box Calfskin",
    category: "Bags & Leather",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ_pcB9_UKa_3vam3g8gm0kht8A-60_3oplkf2sSmSQ76rjslMmUsj3ol1AdGfE7nAyQ63FwIS0rGmKlCiNZXRx-ol4SXCZIotSWpkWE9o37PEN-IhItUdW3usULlkmpiOUfbQkIHYph5UGrrwC7o_MGnsbd4REDNQCiaW21s1q5CFPskn8CH0QsGSGIIVxXn16J3ouog9y4evu6GsDpAdz1Apl6bEiNqVoF45h5s",
    imageAlt: "Céline Triomphe Box Bag",
    status: "upcoming",
    currentBid: 3200000,
    startingBid: 2800000,
    startsInLabel: "Tomorrow",
    watcherCount: 45,
  },
  {
    id: "auc-6",
    title: "Church's Tobacco Suede Goodyear-Welted Chelsea Boots",
    category: "Footwear",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDJO1z0IWed4Gh1401W_vfDkMS2_JLbeje8q_7eu9ZS-vc0jyMsvtgjeWFhz8kuNEmgJYIIk39AAGLB3MMOyZMkHxQXlVwuspcNaskxS-JYHz9Yh36c-nsXeNIK07zuILaDmhV1_EV5QsO2551FDR8l2Tv8fdeWSC0XewdmPyqMi_hUovW6fG_XLUgkJlY4r6HOdc02YLyxty2xkxp9ZXG5o3t7X8-5-rayr_Ljp1o",
    imageAlt: "Church's Chelsea Boots",
    status: "upcoming",
    currentBid: 1250000,
    startingBid: 1000000,
    startsInLabel: "2d",
    watcherCount: 16,
  },
];

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
  const [auctions, setAuctions] = useState<Auction[]>(DEFAULT_AUCTIONS);
  const [dataLoading, setDataLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    auctionsApi
      .list({ limit: 50 })
      .then((res) => {
        if (!cancelled && res.data && res.data.length > 0) {
          setAuctions(res.data.map(mapApiAuction));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setApiMessage(
            err instanceof ApiError
              ? err.message
              : "Using curated auction showcase."
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
              Bid on rare archival items in verified real-time drops. Every piece is backed by our Authenticated Escrow Hold protection.
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

          {filteredFeatured.length === 0 && filteredGrid.length === 0 && (
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
