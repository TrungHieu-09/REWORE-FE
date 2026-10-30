"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import {
  ApiError,
  apiAssetUrl,
  cartApi,
  ordersApi,
  sellerDisplayName,
  type CartItem,
  type Product,
} from "../lib/api";

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

export default function CartPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderNote, setOrderNote] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    cartApi
      .list({ limit: 50 })
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch((err) => {
        if (!cancelled) setMessage(err instanceof ApiError ? err.message : "Không tải được giỏ hàng.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoading, isLoggedIn, router]);

  const remove = async (productId: string) => {
    const previous = items;
    setItems((current) => current.filter((item) => item.productId !== productId));
    try {
      await cartApi.remove(productId);
    } catch (err) {
      setItems(previous);
      setMessage(err instanceof ApiError ? err.message : "Không thể xóa khỏi giỏ hàng.");
    }
  };

  const buy = async (item: CartItem) => {
    setBusyId(item.id);
    setMessage("");
    try {
      const res = await ordersApi.create({
        productId: item.productId,
        shippingAddress: shippingAddress.trim() || undefined,
        note: orderNote.trim() || undefined,
      });
      setItems((current) => current.filter((cartItem) => cartItem.id !== item.id));
      setMessage(`${res.message} Mã đơn: ${res.data.id}`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể tạo đơn hàng.");
      if (err instanceof ApiError && err.status === 409) {
        setItems((current) =>
          current.map((cartItem) =>
            cartItem.id === item.id
              ? {
                  ...cartItem,
                  isAvailable: false,
                  unavailableReason: "SOLD",
                  product: { ...cartItem.product, status: "SOLD", availabilityStatus: "sold" },
                }
              : cartItem
          )
        );
      }
    } finally {
      setBusyId("");
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.product.price || 0), 0);

  if (isLoading || loading || !isLoggedIn) {
    return (
      <div className="bg-[#fff8f5] min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#974226] border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fff8f5] text-[#231a11] font-body-md antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow w-full max-w-[1200px] mx-auto px-5 sm:px-6 py-8">
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 pt-2 border-b border-[#dbc1b9]/30 mb-8">
          <div>
            <h1 className="font-display-lg text-3xl sm:text-5xl text-[#231a11] tracking-tight font-bold">
              Shopping Bag
            </h1>
            <p className="font-body-md text-sm sm:text-base text-[#55433d] mt-1">
              Curated one-of-one pieces in your selection ({items.length} item{items.length !== 1 ? "s" : ""})
            </p>
            {message && (
              <p className={`text-xs mt-2 font-medium ${message.includes("Mã đơn") ? "text-[#556138]" : "text-[#ba1a1a]"}`}>
                {message}
              </p>
            )}
          </div>

          <Link
            href="/shop"
            className="px-6 py-2.5 bg-white border border-[#dbc1b9] text-[#231a11] rounded-full font-label-md text-xs font-semibold hover:border-[#231a11] transition-all inline-flex items-center gap-2 shadow-xs"
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            <span>Continue Shopping</span>
          </Link>
        </section>

        {items.length === 0 ? (
          <div className="bg-white border border-[#dbc1b9]/40 rounded-3xl p-12 text-center max-w-md mx-auto my-12 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#feeadc] text-[#974226] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">shopping_bag</span>
            </div>
            <h2 className="font-headline-lg text-2xl font-bold text-[#231a11] mb-2">
              Your bag is empty
            </h2>
            <p className="font-body-md text-sm text-[#55433d] mb-6 leading-relaxed">
              Discover unique archival items before they are claimed by other vintage collectors.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-8 py-3 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold hover:bg-[#b65a3c] transition-all shadow-sm"
            >
              Explore Drops
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items Column (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const product = item.product;
                const isItemAvailable = item.isAvailable && product.availabilityStatus === "available";

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#dbc1b9]/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between shadow-xs hover:border-[#dbc1b9] transition-all"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-xl overflow-hidden bg-[#f8e5d6] flex-shrink-0 shadow-xs">
                        {product.images[0] ? (
                          <img
                            src={apiAssetUrl(product.images[0])}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#88726c]">
                            <span className="material-symbols-outlined text-2xl">checkroom</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[#ede1d2] text-[#201b12] text-[10px] font-bold uppercase tracking-wider">
                          {sellerDisplayName(product.seller)}
                        </span>
                        <Link href={`/products/${product.id}`}>
                          <h3 className="font-headline-md text-base text-[#231a11] font-semibold truncate hover:text-[#974226] transition-colors">
                            {product.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-[#55433d]">
                          {product.brand} · {product.size ? `Size ${product.size}` : "OS"} · {conditionLabel(product.condition)}
                        </p>
                        <p className="font-headline-md text-base text-[#974226] font-bold pt-1">
                          {formatVnd(product.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#dbc1b9]/20">
                      <button
                        onClick={() => remove(product.id)}
                        className="text-xs text-[#88726c] hover:text-[#ba1a1a] transition-colors flex items-center gap-1 font-medium"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                        <span>Remove</span>
                      </button>

                      {isItemAvailable ? (
                        <button
                          disabled={busyId === item.id}
                          onClick={() => buy(item)}
                          className="px-6 py-2.5 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold hover:bg-[#b65a3c] transition-all disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-base">lock</span>
                          <span>{busyId === item.id ? "Processing..." : "Buy (Escrow)"}</span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-[#ba1a1a] bg-[#ffdad6] px-3 py-1 rounded-full">
                          Sold / Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checkout & Delivery Summary Column */}
            <div className="lg:col-span-1">
              <div className="bg-[#fff1e8] border border-[#dbc1b9]/40 rounded-2xl p-6 shadow-xs space-y-5 sticky top-28">
                <h2 className="font-headline-lg text-xl font-bold text-[#231a11] pb-3 border-b border-[#dbc1b9]/30">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-[#55433d]">
                    <span>Item Total</span>
                    <span className="font-semibold text-[#231a11]">{formatVnd(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#55433d]">
                    <span>Escrow Verification</span>
                    <span className="text-[#556138] font-semibold">Free &amp; Verified</span>
                  </div>
                  <div className="flex justify-between text-[#55433d]">
                    <span>Authenticity Protocol</span>
                    <span className="text-[#556138] font-semibold">Included</span>
                  </div>
                  <div className="pt-3 border-t border-[#dbc1b9]/30 flex justify-between items-baseline">
                    <span className="font-bold text-base text-[#231a11]">Subtotal</span>
                    <span className="font-display-lg text-2xl font-bold text-[#974226]">
                      {formatVnd(subtotal)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#dbc1b9]/30">
                  <div>
                    <label className="block text-xs font-bold text-[#231a11] mb-1">
                      Shipping Address
                    </label>
                    <input
                      type="text"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="e.g. 123 Nguyen Hue, District 1, HCMC"
                      className="w-full px-4 py-2 bg-white border border-[#dbc1b9]/60 rounded-xl text-xs text-[#231a11] placeholder:text-[#88726c] focus:outline-none focus:border-[#231a11]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#231a11] mb-1">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      rows={2}
                      placeholder="Special instructions for seller..."
                      className="w-full px-4 py-2 bg-white border border-[#dbc1b9]/60 rounded-xl text-xs text-[#231a11] placeholder:text-[#88726c] focus:outline-none focus:border-[#231a11]"
                    ></textarea>
                  </div>
                </div>

                <div className="bg-[#feeadc] p-3.5 rounded-xl text-xs text-[#55433d] flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#974226] text-lg flex-shrink-0">
                    verified_user
                  </span>
                  <p className="leading-relaxed">
                    Orders are held under <strong>REWORE Escrow</strong>. Funds are released to the seller only after you verify the archival condition upon arrival.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
