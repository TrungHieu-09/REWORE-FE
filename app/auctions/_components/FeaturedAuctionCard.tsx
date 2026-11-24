import Image from "next/image";
import Link from "next/link";
import type { Auction } from "../_types";
import LiveBadge from "./LiveBadge";
import CountdownTimer from "./CountdownTimer";

interface FeaturedAuctionCardProps {
  auction: Auction;
}

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

export default function FeaturedAuctionCard({
  auction,
}: FeaturedAuctionCardProps) {
  return (
    <article
      className="
        group relative bg-white rounded-[20px] overflow-hidden
        shadow-[0_4px_24px_-4px_rgba(43,33,24,0.10)]
        hover:shadow-[0_20px_40px_-8px_rgba(43,33,24,0.18)]
        transition-all duration-500 ease-out hover:-translate-y-1 flex flex-col md:flex-row
      "
    >
      {/* Image */}
      <div className="relative w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
        {auction.imageUrl ? (
          <Image
            src={auction.imageUrl}
            alt={auction.imageAlt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="admin-image-placeholder h-full">
            <span className="material-symbols-outlined">image_not_supported</span>
            <span>Không có ảnh</span>
          </div>
        )}
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Badge */}
        <div className="absolute top-4 left-4">
          <LiveBadge status={auction.status} variant="pill" />
        </div>

        {/* Watcher count */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-1 rounded-full">
          <span className="material-symbols-outlined text-[13px]">visibility</span>
          {auction.watcherCount} watching
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-7 w-full md:w-1/2 flex flex-col justify-between">
        <div>
          {/* Category tag */}
          <span className="inline-block mb-3 px-2.5 py-1 rounded-md bg-[#f2dfd1] text-[#55433d] text-[11px] font-semibold tracking-wider uppercase">
            {auction.category}
          </span>

          {/* Title */}
          <h3
            className="font-[family-name:var(--font-playfair)] text-[22px] md:text-[26px] font-semibold text-[#231a11] leading-tight mb-3
              group-hover:text-[#974226] transition-colors duration-300"
          >
            {auction.title}
          </h3>

          {/* Current bid */}
          <p className="text-[#55433d] text-sm font-medium mb-1">Current bid</p>
          <p className="font-[family-name:var(--font-playfair)] text-[28px] font-bold text-[#231a11] mb-6">
            {formatVND(auction.currentBid ?? 0)}
          </p>
        </div>

        <div>
          {/* Timer row */}
          <div className="flex items-center justify-between mb-4 bg-[#fff1e8] rounded-lg px-4 py-3">
            <span className="text-[#55443d] text-xs font-semibold tracking-wide">
              Ends in
            </span>
            <CountdownTimer
              initialSeconds={auction.endsInSeconds ?? 0}
              className="text-2xl font-bold"
            />
          </div>

          {/* CTA */}
          <Link
            href={`/auctions/live?id=${encodeURIComponent(auction.id)}`}
            className="
              block text-center w-full py-3.5 bg-[#b65a3c] text-white rounded-xl
              font-semibold text-sm tracking-wide
              hover:bg-[#974226] active:scale-[0.98]
              transition-all duration-200
              shadow-md shadow-[#b65a3c]/30 hover:shadow-lg hover:shadow-[#974226]/30
            "
          >
            Join Auction
          </Link>
        </div>
      </div>
    </article>
  );
}
