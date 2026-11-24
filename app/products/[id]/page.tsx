"use client";

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
  conversationsApi,
  holdsApi,
  productsApi,
  sellerDisplayName,
  wishlistApi,
  type Product,
  type ProductCondition,
} from "../../lib/api";

const CONDITION_LABEL: Record<ProductCondition, string> = {
  NEW: "Mới, còn tag",
  LIKE_NEW: "Như mới",
  GOOD: "Còn tốt",
  FAIR: "Đã dùng nhiều",
  POOR: "Cũ, có lỗi",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  available: "CÒN HÀNG",
  upcoming_drop: "SẮP MỞ BÁN",
  held: "ĐANG ĐƯỢC GIỮ",
  sold: "ĐÃ BÁN",
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
  const { isLoggedIn, isLoading, user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [wishlistOn, setWishlistOn] = useState(false);
  const [cartOn, setCartOn] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [holdBusy, setHoldBusy] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState("general");

  useEffect(() => {
    if (!productId) return;

    let cancelled = false;
    // Đổi sản phẩm thì bật cờ đang tải trước khi gọi API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  useEffect(() => {
    if (!product?.hold) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [product?.hold]);

  const images = useMemo(() => {
    if (!product?.images?.length) return [];
    return product.images.map((img) => apiAssetUrl(img));
  }, [product]);

  const mainImage = images[activeImage] || images[0] || "";
  const sellerName = product ? sellerDisplayName(product.seller) : "REWORE Seller";
  const isOwn = Boolean(product && user?.id === product.sellerId);
  const heldByMe = Boolean(product?.hold?.heldByMe);
  const heldByOther = Boolean(product?.hold && !product.hold.heldByMe);
  const holdSecondsLeft = product?.hold ? Math.max(0, Math.floor((new Date(product.hold.expiresAt).getTime() - nowMs) / 1000)) : 0;
  const canHold = product?.status === "ACTIVE" && product?.availabilityStatus === "available";
  const canBuy = !isOwn && (canHold || (heldByMe && holdSecondsLeft > 0));
  const isAuction = product?.status === "AUCTION";

  const toggleWishlist = async () => {
    if (!product) return;
    if (!isLoggedIn) {
      setModalSource("wishlist");
      setLoginModalOpen(true);
      return;
    }

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

  const reloadProduct = async () => {
    if (!product) return;
    try {
      const res = await productsApi.get(product.id);
      setProduct(res.data);
    } catch {
      // keep the current view
    }
  };

  const buyNow = () => {
    if (!product) return;
    if (!isLoggedIn) {
      setModalSource("hold");
      setLoginModalOpen(true);
      return;
    }
    router.push(`/checkout?productId=${product.id}`);
  };

  const holdProduct = async () => {
    if (!product) return;
    if (!isLoggedIn) {
      setModalSource("hold");
      setLoginModalOpen(true);
      return;
    }

    setHoldBusy(true);
    setMessage("");
    try {
      const res = await holdsApi.create(product.id);
      setMessage(res.message);
      await reloadProduct();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể giữ hàng.");
      await reloadProduct();
    } finally {
      setHoldBusy(false);
    }
  };

  const releaseHold = async () => {
    if (!product) return;
    setHoldBusy(true);
    setMessage("");
    try {
      const mine = await holdsApi.mine();
      const hold = mine.data.find((item) => item.productId === product.id);
      if (hold) {
        const res = await holdsApi.release(hold.id);
        setMessage(res.message);
      }
      await reloadProduct();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể huỷ giữ hàng.");
    } finally {
      setHoldBusy(false);
    }
  };

  const startChat = async () => {
    if (!product) return;
    if (!isLoggedIn) {
      setModalSource("hold");
      setLoginModalOpen(true);
      return;
    }
    try {
      const res = await conversationsApi.start({ sellerId: product.sellerId, productId: product.id });
      router.push(`/messages?c=${res.data.id}`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Không thể mở cuộc trò chuyện.");
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
            <span>Về cửa hàng</span>
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
            <p className="text-sm text-[#55433d] mb-6">Món này có thể đã bán hoặc đã bị gỡ.</p>
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
                      <span className="font-label-md text-sm">Chưa có ảnh</span>
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
                      {product.brand || "Hàng si"}
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
                        Người bán trên REWORE
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
                    <strong className="text-[#231a11] font-semibold">{product.color || "Chưa ghi"}</strong>
                  </div>
                  <div>
                    <span className="text-[#88726c] block mb-0.5">Authenticity</span>
                    <strong className="text-[#556138] font-semibold">Verified Escrow</strong>
                  </div>
                </div>

                {/* Delivery details & Purchase controls */}
                <div className="space-y-3 pt-2">
                  {isAuction ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-[#feeadc]/60 border border-[#974226]/30 text-xs text-[#974226]">
                        <p className="font-semibold flex items-center gap-1.5 mb-1">
                          <span className="material-symbols-outlined text-base">gavel</span>
                          Sản phẩm mở bán theo hình thức Đấu giá
                        </p>
                        <p className="text-[#55433d]">
                          Món đồ độc bản này được người bán đưa vào sàn đấu giá để người mua tự do trả giá. Bạn có thể tham gia trả giá ngay tại phòng đấu giá trực tiếp.
                        </p>
                      </div>

                      <Link
                        href="/auctions"
                        className="w-full py-3.5 bg-[#4a2e63] text-white rounded-full font-label-md text-xs font-semibold hover:bg-[#5e3b7d] transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-base">gavel</span>
                        <span>Tham gia Đấu giá món này</span>
                      </Link>
                    </div>
                  ) : (
                    <>
                      {heldByMe && holdSecondsLeft > 0 && (
                        <div className="p-3 rounded-2xl bg-[#fff2de] border border-[#f3cca0] text-xs text-[#8b4c09] flex items-center justify-between gap-3">
                          <span className="font-semibold">Món này đang được giữ riêng cho bạn</span>
                          <span className="px-2.5 py-1 rounded-full bg-white text-[#974226] font-mono font-bold">
                            {String(Math.floor(holdSecondsLeft / 60)).padStart(2, "0")}:{String(holdSecondsLeft % 60).padStart(2, "0")}
                          </span>
                        </div>
                      )}
                      {heldByOther && (
                        <div className="p-3 rounded-2xl bg-[#f2dfd1]/60 border border-[#dbc1b9] text-xs text-[#55433d]">
                          Món này đang được người khác giữ. Quay lại sau ít phút, nếu họ không mua món sẽ được mở lại.
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          disabled={!canBuy}
                          onClick={buyNow}
                          className="flex-1 py-3 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold hover:bg-[#b65a3c] transition-all disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-base">lock</span>
                          <span>
                            {isOwn
                              ? "Sản phẩm của bạn"
                              : canBuy
                              ? "Mua ngay (Bảo vệ Escrow)"
                              : heldByOther
                              ? "Đang được người khác giữ"
                              : "Đã bán hết"}
                          </span>
                        </button>

                        <button
                          disabled={!canBuy || cartBusy || cartOn}
                          onClick={addToCart}
                          className="px-5 py-3 border border-[#974226] text-[#974226] rounded-full font-label-md text-xs font-semibold hover:bg-[#feeadc] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-base">shopping_bag</span>
                          <span>{cartOn ? "Đã trong giỏ" : "Thêm vào giỏ"}</span>
                        </button>
                      </div>

                      {!isOwn && (
                        <div className="flex gap-3">
                          {canHold && (
                            <button
                              disabled={holdBusy}
                              onClick={holdProduct}
                              className="flex-1 py-2.5 border border-[#556138] text-[#556138] rounded-full font-label-md text-xs font-semibold hover:bg-[#f2f6e6] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-base">timer</span>
                              <span>{holdBusy ? "Đang giữ..." : "Giữ hàng"}</span>
                            </button>
                          )}
                          {heldByMe && (
                            <button
                              disabled={holdBusy}
                              onClick={releaseHold}
                              className="flex-1 py-2.5 border border-[#dbc1b9] text-[#55433d] rounded-full font-label-md text-xs font-semibold hover:bg-[#feeadc] transition-all disabled:opacity-50"
                            >
                              Huỷ giữ
                            </button>
                          )}
                          <button
                            onClick={startChat}
                            className="flex-1 py-2.5 border border-[#dbc1b9] text-[#231a11] rounded-full font-label-md text-xs font-semibold hover:bg-[#feeadc] transition-all flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-base">chat</span>
                            <span>Nhắn tin cho shop</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  <p className="text-[11px] text-[#88726c] text-center pt-1">
                    Được bảo vệ 100% bởi REWORE Escrow: Tiền chỉ chuyển cho người bán sau khi bạn nhận và kiểm định hàng.
                  </p>
                </div>

                {/* Description */}
                <div className="border-t border-[#dbc1b9]/30 pt-4">
                  <h3 className="font-headline-md text-sm font-bold text-[#231a11] mb-2">
                    Mô tả món đồ
                  </h3>
                  <p className="font-body-md text-xs text-[#55433d] leading-relaxed whitespace-pre-line">
                    {product.description || "Người bán chưa thêm mô tả. Nhắn tin cho shop để hỏi thêm về tình trạng."}
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
