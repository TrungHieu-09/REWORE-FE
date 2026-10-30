"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import {
  ApiError,
  apiAssetUrl,
  sellerDisplayName,
  wishlistApi,
  type Product,
  type WishlistItem as ApiWishlistItem,
} from "@/app/lib/api";

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  shop: string;
  shopInitial: string;
  meta: string;
  price: number;
  priceLabel: string;
  img?: string;
  badge: "available" | "upcoming" | "auction";
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function conditionLabel(condition: Product["condition"]) {
  return condition
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapWishlistItem(item: ApiWishlistItem): WishlistItem {
  const product = item.product;
  const shopName = sellerDisplayName(product.seller);
  return {
    id: item.id,
    productId: item.productId,
    name: product.title,
    shop: shopName,
    shopInitial: shopName ? shopName[0].toUpperCase() : "R",
    meta: [
      product.brand,
      product.size ? `Size ${product.size}` : null,
      conditionLabel(product.condition),
    ]
      .filter(Boolean)
      .join(" · "),
    price: product.price,
    priceLabel: formatVnd(product.price),
    img: product.images[0] ? apiAssetUrl(product.images[0]) : "",
    badge: product.status === "AUCTION" ? "auction" : "available",
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading, user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    wishlistApi
      .list({ limit: 50 })
      .then((res) => {
        if (!cancelled) setItems(res.data.map(mapWishlistItem));
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage(
            err instanceof ApiError
              ? err.message
              : "Could not load wishlist from API."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoading, isLoggedIn, router]);

  const remove = async (productId: string) => {
    const previous = items;
    setItems((prev) => prev.filter((item) => item.productId !== productId));

    try {
      await wishlistApi.remove(productId);
    } catch (err) {
      setItems(previous);
      setMessage(
        err instanceof ApiError ? err.message : "Could not remove wishlist item."
      );
    }
  };

  const buyerScore = user?.reputation ?? 86;

  return (
    <div className="bg-[#fff8f5] text-[#231a11] font-body-md antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow w-full max-w-[1200px] mx-auto px-5 sm:px-6 py-8">
        {/* Page Header */}
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 pt-2 border-b border-[#dbc1b9]/30 mb-8">
          <div>
            <h1 className="font-display-lg text-3xl sm:text-5xl text-[#231a11] tracking-tight font-bold">
              Curated Wishlist
            </h1>
            <p className="font-body-md text-sm sm:text-base text-[#55433d] mt-1">
              Your saved one-of-one pieces and tracked archival drops ({items.length} item{items.length !== 1 ? "s" : ""})
            </p>
            {message && <p className="text-xs text-[#ba1a1a] mt-2 font-medium">{message}</p>}
          </div>

          <Link
            href="/shop"
            className="px-6 py-2.5 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold hover:bg-[#b65a3c] transition-all inline-flex items-center gap-2 shadow-xs"
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            <span>Browse Drops</span>
          </Link>
        </section>

        {/* Reputation Banner */}
        <section className="mb-8 w-full bg-[#fff1e8] border border-[#dbc1b9]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#e9d7c8]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-[#556138]"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={`${Math.min(Math.max(buyerScore, 10), 100)}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <span className="absolute font-label-md text-xs font-bold text-[#556138]">
                {buyerScore}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-label-md text-sm font-bold text-[#231a11]">
                  Escrow Priority — {buyerScore >= 50 ? "Verified Eligible" : "Standard Tier"}
                </h4>
                <span className="inline-flex items-center gap-1 text-[11px] bg-[#dae9b5] text-[#151f01] font-semibold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#556138]"></span> 15-Minute Hold Enabled
                </span>
              </div>
              <p className="font-body-md text-xs text-[#55433d] mt-0.5">
                Saved items will immediately notify you when a live auction starts or price drops.
              </p>
            </div>
          </div>

          <Link
            href="/shop"
            className="font-label-md text-xs text-[#974226] font-semibold hover:underline inline-flex items-center gap-1 flex-shrink-0"
          >
            <span>Explore live items</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </section>

        {/* Wishlist Items Grid */}
        {dataLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-[#974226] border-t-transparent animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-[#dbc1b9]/40 rounded-3xl p-12 text-center max-w-md mx-auto my-12 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#ffdbd0] text-[#974226] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">favorite</span>
            </div>
            <h2 className="font-headline-lg text-2xl font-bold text-[#231a11] mb-2">
              Nothing saved yet
            </h2>
            <p className="font-body-md text-sm text-[#55433d] mb-6 leading-relaxed">
              Browse the curated archive and tap the heart on any one-of-one item to keep it in your personal vault.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-8 py-3 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold hover:bg-[#b65a3c] transition-all shadow-sm"
            >
              Explore Drops
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <article key={item.id} className="group flex flex-col cursor-pointer">
                <div className="relative aspect-[3/4] w-full rounded-[20px] overflow-hidden bg-[#f8e5d6] shadow-sm">
                  {item.img ? (
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="relative aspect-[3/4] w-full h-full rounded-[20px] overflow-hidden bg-[#ede1d2]/50 border border-[#dbc1b9]/30 flex flex-col items-center justify-center p-6 text-center">
                      <span className="material-symbols-outlined text-2xl text-[#88726c] mb-2">checkroom</span>
                      <span className="font-label-md text-xs text-[#231a11] font-semibold">Image unavailable</span>
                    </div>
                  )}

                  {/* Top-right heart button (Remove) */}
                  <button
                    onClick={() => remove(item.productId)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-md bg-white text-[#974226] flex items-center justify-center transition-all z-10 shadow-xs hover:bg-[#ffdbd0]"
                    title="Remove from wishlist"
                  >
                    <span
                      className="material-symbols-outlined text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      favorite
                    </span>
                  </button>

                  {/* Status badge */}
                  {item.badge === "auction" && (
                    <div className="absolute top-3 left-3 bg-[#4a2e63] text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      AUCTION
                    </div>
                  )}

                  {/* Price pill */}
                  <div className="absolute bottom-3 left-3 backdrop-blur-md bg-white/70 px-3 py-1 rounded-full text-[#231a11] shadow-xs">
                    <span className="font-headline-md text-sm font-bold tracking-tight">
                      {item.priceLabel}
                    </span>
                  </div>

                  {/* Slide-up action on hover */}
                  <div className="absolute inset-x-3 bottom-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                    <Link
                      href={`/products/${item.productId}`}
                      className="w-full py-2.5 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold shadow-md hover:bg-[#b65a3c] flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      <span>View Item</span>
                    </Link>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <Link href={`/products/${item.productId}`}>
                    <h3 className="font-headline-md text-base text-[#231a11] truncate group-hover:text-[#974226] transition-colors font-semibold">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="font-label-sm text-xs text-[#55433d]">{item.meta}</p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="w-4 h-4 rounded-full bg-[#ede1d2] flex items-center justify-center text-[9px] font-bold text-[#201b12]">
                      {item.shopInitial}
                    </span>
                    <span className="font-label-sm text-[12px] text-[#655d52]">{item.shop}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
