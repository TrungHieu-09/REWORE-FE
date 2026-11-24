import Image from "next/image";
import Link from "next/link";
import type { Auction } from "../_types";
import LiveBadge from "./LiveBadge";
import CountdownTimer from "./CountdownTimer";

interface AuctionGridCardProps {
  auction: Auction;
}

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " ₫";
}

export default function AuctionGridCard({ auction }: AuctionGridCardProps) {
  const isLive = auction.status === "live";
  const isUpcoming =
    auction.status === "starts_soon" || auction.status === "starts_tomorrow";

  return (
    <article className="group cursor-pointer flex flex-col p-3 -m-3 rounded-2xl transition-all duration-300 hover:bg-white hover:shadow-[0_12px_32px_-8px_rgba(43,33,24,0.12)] hover:-translate-y-1">
      {/* Image container */}
      <div className="relative w-full aspect-[4/5] rounded-[20px] overflow-hidden mb-4 bg-[#feeadc]">
        {auction.imageUrl ? (
          <Image
            src={auction.imageUrl}
            alt={auction.imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="admin-image-placeholder h-full">
            <span className="material-symbols-outlined">image_not_supported</span>
            <span>Không có ảnh</span>
          </div>
        )}

        {/* Gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top badge */}
        <div className="absolute top-3 left-3">
          <LiveBadge
            status={auction.status}
            startsInLabel={auction.startsInLabel}
            variant="tag"
          />
        </div>

        {/* Live countdown overlay */}
        {isLive && auction.endsInSeconds !== undefined && (
          <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm">
            <CountdownTimer
              initialSeconds={auction.endsInSeconds}
              className="text-sm font-bold"
            />
          </div>
        )}

        {/* Watcher count */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="material-symbols-outlined text-[12px]">
            visibility
          </span>
          {auction.watcherCount}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-[#88726c]">
          {auction.category}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-[family-name:var(--font-manrope)] font-semibold text-[15px] text-[#231a11] mb-1 line-clamp-1 group-hover:text-[#974226] transition-colors duration-200">
        {auction.title}
      </h3>

      {/* Price */}
      <p className="font-[family-name:var(--font-playfair)] text-[17px] font-semibold text-[#231a11] mb-3">
        {isLive ? "Current: " : "Starting: "}
        {formatVND((isLive ? auction.currentBid : auction.startingBid) ?? 0)}
      </p>

      {/* CTA */}
      {isLive ? (
        <Link
          href={`/auctions/live?id=${encodeURIComponent(auction.id)}`}
          className="
            block text-center w-full py-2.5 bg-[#b65a3c] text-white rounded-xl
            text-xs font-semibold tracking-wide
            hover:bg-[#974226] active:scale-[0.98] transition-all duration-200
            shadow-sm shadow-[#b65a3c]/20 hover:shadow-md hover:shadow-[#974226]/25
          "
        >
          Join Auction
        </Link>
      ) : (
        <button
          className="
            w-full py-2.5 border-2 border-[#b65a3c] text-[#b65a3c] rounded-xl
            text-xs font-semibold tracking-wide
            group-hover:bg-[#b65a3c] group-hover:text-white
            active:scale-[0.98] transition-all duration-200
          "
        >
          {isUpcoming ? "Set Reminder" : "Notify Me"}
        </button>
      )}
    </article>
  );
}
