"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ApiError, bidsApi, type Bid } from "@/app/lib/api";

function formatVND(amount: number) {
  return "₫" + new Intl.NumberFormat("vi-VN").format(amount);
}

function secondsUntil(iso?: string) {
  if (!iso) return "Ended";
  const seconds = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
  if (seconds <= 0) return "Ended";
  const hours = Math.floor(seconds / 3600);
  if (hours < 1) return `${Math.max(1, Math.floor(seconds / 60))}m`;
  if (hours < 24) return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.ceil(hours / 24)}d`;
}

export default function TabMyBids() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    bidsApi
      .myBids({ limit: 50 })
      .then((res) => {
        if (!cancelled) setBids(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage(err instanceof ApiError ? err.message : "Could not load bids.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 opacity-0 animate-fade-in-up">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#231a11] mb-1">
            My Bids
          </h3>
          <p className="text-sm text-[#88726c]">
            {loading ? "Loading bids..." : `${bids.length} bid${bids.length !== 1 ? "s" : ""}`}
          </p>
          {message && <p className="text-sm text-[#ba1a1a] mt-1">{message}</p>}
        </div>
      </div>

      <div className="bg-white rounded-[20px] shadow-[0_4px_24px_-4px_rgba(43,33,24,0.06)] border border-[#f2dfd1] overflow-hidden">
        {!loading && bids.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#88726c]">
            No bids yet. Start bidding to see your auction history here.
          </div>
        ) : bids.map((bid, i) => {
          const auction = bid.auction;
          const product = auction?.product;
          const isWinning = bid.isWinning;
          const image = product?.images?.[0];
          return (
            <div
              key={bid.id}
              className={`flex flex-col sm:flex-row gap-5 p-6 ${
                i < bids.length - 1 ? "border-b border-[#f2dfd1]" : ""
              } hover:bg-[#fff8f5] transition-colors`}
            >
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-[#feeadc]">
                {image ? (
                  <Image src={image} alt={product?.title ?? "Auction item"} fill className="object-cover" />
                ) : (
                  <div className="admin-image-placeholder h-full">
                    <span className="material-symbols-outlined">image_not_supported</span>
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h4 className="text-lg font-semibold text-[#231a11] mb-1">
                    {product?.title ?? "Auction item"}
                  </h4>
                  <p className="text-sm text-[#55443d] mb-3">
                    Auction ends in: <span className="font-semibold text-[#974226]">{secondsUntil(auction?.endTime)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[11px] text-[#88726c] uppercase font-semibold tracking-wider mb-0.5">Your Bid</p>
                    <p className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#231a11]">
                      {formatVND(bid.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#88726c] uppercase font-semibold tracking-wider mb-0.5">Status</p>
                    {isWinning ? (
                      <span className="flex items-center gap-1 text-[13px] font-semibold text-[#556138]">
                        <span className="material-symbols-outlined text-[16px]">trending_up</span>
                        Winning
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[13px] font-semibold text-[#ba1a1a]">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        Outbid
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end sm:min-w-[140px]">
                <a href={`/auctions/live?id=${encodeURIComponent(bid.auctionId)}`} className={`w-full text-center py-2.5 rounded-xl text-xs font-semibold transition-colors ${isWinning ? "bg-[#f2dfd1] text-[#55443d] hover:bg-[#e9d7c8]" : "bg-[#b65a3c] text-white shadow-md shadow-[#b65a3c]/30 hover:bg-[#974226]"}`}>
                  {isWinning ? "View Auction" : "Increase Bid"}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


