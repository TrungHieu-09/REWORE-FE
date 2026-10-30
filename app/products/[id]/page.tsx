"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import LoginModal from "../../components/LoginModal";
import { useAuth } from "../../context/AuthContext";
import {
  ApiError,
  apiAssetUrl,
  cartApi,
  ordersApi,
  productsApi,
  sellerDisplayName,
  wishlistApi,
  type Product,
  type ProductCondition,
} from "../../lib/api";

const CONDITION_LABEL: Record<ProductCondition, string> = {
  NEW: "New with tags",
  LIKE_NEW: "Like New",
  GOOD: "Good Vintage Condition",
  FAIR: "Fair Vintage Wear",
  POOR: "Distressed Archive",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  available: "AVAILABLE",
  upcoming_drop: "UPCOMING DROP",
  held: "IN ESCROW HOLD",
  sold: "SOLD OUT",
};

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id ?? "";
  const { isLoggedIn, isLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [wishlistOn, setWishlistOn] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [cartOn, setCartOn] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [orderBusy, setOrderBusy] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState("general");

  useEffect(() => {
    if (!productId) return;

    let cancelled = false;
    setLoading(true);
    setMessage("");

    productsApi
      .get(productId)
      .then((res) => {
        if (!cancelled) {
          setProduct(res.data);
          setActiveImage(0);
          if (isLoggedIn) {
            Promise.allSettled([
              cartApi.check(res.data.id),
              wishlistApi.check(res.data.id),
            ]).then(([cartResult, wishlistResult]) => {
              if (cancelled) return;
              if (cartResult.status === "fulfilled") setCartOn(cartResult.value.isInCart);
              if (wishlistResult.status === "fulfilled") setWishlistOn(wishlistResult.value.isInWishlist);
            });
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setMessage(err instanceof ApiError ? err.message : "Không tải được sản phẩm.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, productId]);

  const images = useMemo(() => {
    if (!product?.images?.length) return [];
    return product.images.map((img) => apiAssetUrl(img));
  }, [product]);

  const mainImage = images[activeImage] || images[0] || "";
  const sellerName = product ? sellerDisplayName(product.seller) : "REWORE Seller";
  const canBuy = product?.status === "ACTIVE" && product?.availabilityStatus === "available";

  const toggleWishlist = async () => {
    if (!product) return;
    if (!isLoggedIn) {
      setModalSource("wishlist");
      setLoginModalOpen(true);
      return;
    }

    setWishlistBusy(true);
    const nextState = !wishlistOn;
    setWishlistOn(nextState);

    try {
      if (nextState) {
        await wishlistApi.add(product.id);
      } else {
        await wishlistApi.remove(product.id);
      }
    } catch (err) {
      if (nextState && err instanceof ApiError && err.status === 409) return;
      setWishlistOn(!nextState);
      setMessage(err instanceof ApiError ? err.message : "Cập nhật wishlist thất bại.");
    } finally {
      setWishlistBusy(false);
    }
  };

  const addToCart = async () => {
    if (!product) return;
    if (!isLoggedIn) {
      setModalSource("cart");
      setLoginModalOpen(true);
      return;
    }

    setCartBusy(true);
    try {
      await cartApi.add(product.id);
      setCartOn(true);
      setMessage("Đã thêm món này vào giỏ hàng.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setCartOn(true);
        return;
      }
      setMessage(err instanceof ApiError ? err.message : "Không thể thêm vào giỏ hàng.");
    } finally {
      setCartBusy(false);
    }
  };

  const buyNow = async () => {
    if (!product) return;
    if (!isLoggedIn) {
      setModalSource("hold");
      setLoginModalOpen(true);
      return;
    }

    setOrderBusy(true);
    setMessage("");

    try {
      const res = await ordersApi.create({
        productId: product.id,
        shippingAddress: shippingAddress.trim() || undefined,
        note: orderNote.trim() || undefined,
      });

      setProduct((current) =>
        current ? { ...current, status: "SOLD", availabilityStatus: "sold" } : current
      );
      setMessage(`Đơn hàng #${res.data.id} đã được tạo thành công dưới bảo vệ Escrow.`);
      setTimeout(() => router.push("/profile"), 2000);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể tạo đơn hàng.");
      if (err instanceof ApiError && err.status === 409) {
        setProduct((current) =>
          current ? { ...current, status: "SOLD", availabilityStatus: "sold" } : current
        );
      }
    } finally {
      setOrderBusy(false);
    }
  };

  return (
    <div className="bg-[#fff8f5] text-[#231a11] font-body-md antialiased min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow w-full max-w-[1200px] mx-auto px-5 sm:px-6 py-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#88726c] hover:text-[#974226] transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Back to Curated Shop</span>
          </Link>
        </div>

        {loading || isLoading ? (
          <div className="flex items-center justify-center py-28">
            <div className="w-8 h-8 rounded-full border-2 border-[#974226] border-t-transparent animate-spin"></div>
          </div>
        ) : !product ? (
          <div className="bg-white border border-[#dbc1b9]/40 rounded-3xl p-12 text-center max-w-md mx-auto my-12 shadow-xs">
            <span className="material-symbols-outlined text-4xl text-[#88726c] mb-3">inventory_2</span>
            <h1 className="font-headline-lg text-2xl font-bold text-[#231a11] mb-2">Item Not Found</h1>
            <p className="text-sm text-[#55433d] mb-6">This item may have been sold or removed from the archive.</p>
            <Link
              href="/shop"
              className="inline-flex px-6 py-2.5 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold"
            >
              Browse other drops
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {message && (
              <div className="bg-[#fff1e8] border border-[#dbc1b9] rounded-2xl p-4 text-xs font-semibold text-[#231a11] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#974226]">info</span>
                <span>{message}</span>
              </div>
            )}

            {/* Product Detail Grid (Gallery + Details Panel) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Gallery (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="relative aspect-[3/4] w-full rounded-[24px] overflow-hidden bg-[#f8e5d6] shadow-md border border-[#dbc1b9]/30">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#88726c]">
                      <span className="material-symbols-outlined text-4xl mb-2">checkroom</span>
                      <span className="font-label-md text-sm">Archival scan in progress</span>
                    </div>
                  )}

                  {/* Top badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#974226] text-white text-[11px] font-bold tracking-wider uppercase shadow-xs">
                      {AVAILABILITY_LABEL[product.availabilityStatus ?? "available"] || product.status}
                    </span>
                  </div>

                  {/* Frosted Heart Button */}
                  <button
                    onClick={toggleWishlist}
                    className={`absolute top-4 right-4 w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all z-10 shadow-xs ${
                      wishlistOn ? "bg-white text-[#974226]" : "bg-white/50 text-[#231a11] hover:bg-white/80"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ fontVariationSettings: wishlistOn ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      favorite
                    </span>
                  </button>
                </div>

                {/* Thumbnails row */}
                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pt-2">
                    {images.map((img, idx) => (
                      <button
                        key={`${img}-${idx}`}
                        onClick={() => setActiveImage(idx)}
                        className={`relative w-20 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                          activeImage === idx ? "border-[#974226] scale-102" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs uppercase font-bold tracking-widest text-[#974226]">
                      {product.brand || "Vintage Atelier"}
                    </span>
                    <span className="text-xs text-[#88726c]">·</span>
                    <span className="text-xs font-semibold text-[#55433d]">
                      {product.category}
                    </span>
                  </div>

                  <h1 className="font-display-lg text-2xl sm:text-3xl font-bold text-[#231a11] tracking-tight leading-snug">
                    {product.title}
                  </h1>

                  <p className="font-display-lg text-2xl sm:text-3xl text-[#974226] font-bold mt-3">
                    {formatVnd(product.price)}
                  </p>
                </div>

                {/* Seller Strip */}
                <div className="bg-[#fff1e8] border border-[#dbc1b9]/40 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#feeadc] text-[#974226] font-bold flex items-center justify-center text-sm border border-[#dbc1b9]/50">
                      {sellerName[0]?.toUpperCase() || "S"}
                    </div>
                    <div>
                      <h4 className="font-label-md text-sm font-bold text-[#231a11] flex items-center gap-1.5">
                        <span>{sellerName}</span>
                        {product.seller?.isVerified && (
                          <span className="material-symbols-outlined text-[#556138] text-base" title="Verified Seller">
                            verified
                          </span>
                        )}
                      </h4>
                      <p className="font-body-md text-xs text-[#55433d]">
                        {product.seller?.isVerified ? "Verified Boutique Atelier" : "Community Curator"}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] bg-[#dae9b5] text-[#151f01] font-semibold px-2 py-0.5 rounded-full">
                    Top Rated
                  </span>
                </div>

                {/* Garment Facts Grid */}
                <div className="grid grid-cols-2 gap-3 bg-white border border-[#dbc1b9]/40 rounded-2xl p-4 text-xs">
                  <div>
                    <span className="text-[#88726c] block mb-0.5">Condition</span>
                    <strong className="text-[#231a11] font-semibold">{CONDITION_LABEL[product.condition]}</strong>
                  </div>
                  <div>
                    <span className="text-[#88726c] block mb-0.5">Size</span>
                    <strong className="text-[#231a11] font-semibold">{product.size || "Free Size"}</strong>
                  </div>
                  <div>
                    <span className="text-[#88726c] block mb-0.5">Color Palette</span>
                    <strong className="text-[#231a11] font-semibold">{product.color || "Archival Earth"}</strong>
                  </div>
                  <div>
                    <span className="text-[#88726c] block mb-0.5">Authenticity</span>
                    <strong className="text-[#556138] font-semibold">Verified Escrow</strong>
                  </div>
                </div>

                {/* Delivery details & Purchase controls */}
                <div className="space-y-3 pt-2">
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Shipping delivery address"
                    className="w-full px-4 py-2.5 bg-white border border-[#dbc1b9]/60 rounded-xl text-xs text-[#231a11] focus:outline-none focus:border-[#231a11]"
                  />
                  <input
                    type="text"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    placeholder="Order note for seller (optional)"
                    className="w-full px-4 py-2.5 bg-white border border-[#dbc1b9]/60 rounded-xl text-xs text-[#231a11] focus:outline-none focus:border-[#231a11]"
                  />

                  <div className="flex gap-3 pt-2">
                    <button
                      disabled={!canBuy || orderBusy}
                      onClick={buyNow}
                      className="flex-1 py-3 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold hover:bg-[#b65a3c] transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">lock</span>
                      <span>{canBuy ? (orderBusy ? "Creating Escrow Order..." : "Buy with Escrow") : "Sold Out"}</span>
                    </button>

                    <button
                      disabled={!canBuy || cartBusy || cartOn}
                      onClick={addToCart}
                      className="px-5 py-3 border border-[#974226] text-[#974226] rounded-full font-label-md text-xs font-semibold hover:bg-[#feeadc] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">shopping_bag</span>
                      <span>{cartOn ? "In Bag" : "Add to Bag"}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-[#88726c] text-center pt-1">
                    Protected by REWORE 15-Minute Priority Escrow Hold Protocol.
                  </p>
                </div>

                {/* Description */}
                <div className="border-t border-[#dbc1b9]/30 pt-4">
                  <h3 className="font-headline-md text-sm font-bold text-[#231a11] mb-2">
                    Archival Notes &amp; Provenance
                  </h3>
                  <p className="font-body-md text-xs text-[#55433d] leading-relaxed whitespace-pre-line">
                    {product.description || "A verified circular luxury piece carefully inspected for material integrity and provenance."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        actionSource={modalSource}
      />
    </div>
  );
}
