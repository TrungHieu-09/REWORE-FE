"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";
import {
  ApiError,
  apiAssetUrl,
  cartApi,
  productsApi,
  sellerDisplayName,
  wishlistApi,
  type Product as ApiProduct,
} from "@/app/lib/api";

type Badge = "available" | "upcoming" | "auction" | "held" | "sold";

interface ShopItem {
  id: string | number;
  apiId?: string;
  name: string;
  brand: string;
  size: string;
  condition: string;
  meta: string;
  shop: string;
  shopInitial: string;
  price: number;
  priceLabel: string;
  badge: Badge;
  badgeLabel?: string;
  imageUrl?: string;
  isWishlist?: boolean;
  heldCountdown?: string;
  dropTime?: string;
  category: string;
  style: string;
}


const CATEGORIES = [
  "All",
  "Jackets",
  "Shirts",
  "Dresses",
  "Denim",
  "Hoodies",
  "Bags",
  "Accessories",
];

const AVAILABILITY_TABS: { label: string; value: "all" | Badge }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Còn hàng", value: "available" },
  { label: "Sắp mở", value: "upcoming" },
  { label: "Đấu giá", value: "auction" },
  { label: "Đã bán", value: "sold" },
];

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function conditionLabel(condition: ApiProduct["condition"]) {
  return condition
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapApiProductToShopItem(
  product: ApiProduct,
  index: number,
  wishlistIds: Set<string>
): ShopItem {
  const badge: Badge =
    product.status === "SOLD" || product.availabilityStatus === "sold"
      ? "sold"
      : product.status === "AUCTION"
      ? "auction"
      : product.availabilityStatus === "upcoming_drop"
      ? "upcoming"
      : product.availabilityStatus === "held"
      ? "held"
      : "available";

  const shopName = sellerDisplayName(product.seller);

  return {
    id: product.id,
    apiId: product.id,
    name: product.title,
    brand: product.brand || "Hàng si",
    size: product.size ? `Size ${product.size}` : "Free Size",
    condition: conditionLabel(product.condition),
    meta: [product.brand, product.size ? `Size ${product.size}` : null, conditionLabel(product.condition)]
      .filter(Boolean)
      .join(" · "),
    shop: shopName,
    shopInitial: shopName ? shopName[0].toUpperCase() : "R",
    price: product.price,
    priceLabel: formatVnd(product.price),
    badge,
    imageUrl: product.images[0] ? apiAssetUrl(product.images[0]) : "",
    isWishlist: wishlistIds.has(product.id),
    category: product.category || "Accessories",
    style: "Vintage",
  };
}

export default function ShopPage() {
  const { isLoggedIn } = useAuth();

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeAvailability, setActiveAvailability] = useState<"all" | Badge>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<string>("general");
  const [noticeMessage, setNoticeMessage] = useState<string>("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [cartIds, setCartIds] = useState<string[]>([]);
  const [cartBusyId, setCartBusyId] = useState<string>("");

  const [items, setItems] = useState<ShopItem[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Fetch real API items if available
  useEffect(() => {
    let cancelled = false;

    Promise.allSettled([
      productsApi.list({ limit: 100, sortBy: "newest" }),
      isLoggedIn ? wishlistApi.list({ limit: 100 }) : Promise.resolve({ data: [] }),
    ])
      .then(([productsResult, wishlistResult]) => {
        if (cancelled) return;

        const wishlistIds = new Set<string>();
        if (wishlistResult.status === "fulfilled" && "data" in wishlistResult.value) {
          (wishlistResult.value.data as { productId?: string }[]).forEach((item) => {
            if (item.productId) wishlistIds.add(item.productId);
          });
        }

        if (
          productsResult.status === "fulfilled" &&
          productsResult.value.data &&
          productsResult.value.data.length > 0
        ) {
          const apiItems = productsResult.value.data.map((p, i) =>
            mapApiProductToShopItem(p, i, wishlistIds)
          );
          setItems(apiItems);
        }
      })
      .catch(() => {
        // Lỗi tải thì để danh sách trống
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const toggleWishlist = async (item: ShopItem) => {
    if (!isLoggedIn) {
      setModalSource("wishlist");
      setLoginModalOpen(true);
      return;
    }

    const nextWishlist = !item.isWishlist;
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, isWishlist: nextWishlist } : x))
    );

    if (item.apiId) {
      try {
        if (nextWishlist) {
          await wishlistApi.add(item.apiId);
        } else {
          await wishlistApi.remove(item.apiId);
        }
      } catch (err) {
        if (nextWishlist && err instanceof ApiError && err.status === 409) return;
        setItems((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, isWishlist: item.isWishlist } : x))
        );
      }
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    cartApi
      .list({ limit: 100 })
      .then((res) => {
        if (!cancelled) setCartIds(res.data.map((cartItem) => cartItem.productId));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const showNotice = (message: string, isError = false) => {
    setNoticeIsError(isError);
    setNoticeMessage(message);
    window.setTimeout(() => setNoticeMessage(""), 4500);
  };

  const handleAddToCart = async (item: ShopItem) => {
    if (!isLoggedIn) {
      setModalSource("cart");
      setLoginModalOpen(true);
      return;
    }

    if (!item.apiId) {
      showNotice("Sản phẩm này chưa có trong hệ thống nên chưa thể thêm vào giỏ.", true);
      return;
    }

    const productId = item.apiId;
    setCartBusyId(productId);
    try {
      await cartApi.add(productId);
      setCartIds((current) => (current.includes(productId) ? current : [...current, productId]));
      showNotice(`Đã thêm "${item.name}" vào giỏ hàng.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setCartIds((current) => (current.includes(productId) ? current : [...current, productId]));
        showNotice(`"${item.name}" đã có sẵn trong giỏ hàng.`);
      } else {
        showNotice(err instanceof Error && err.message ? err.message : "Không thể thêm vào giỏ hàng.", true);
      }
    } finally {
      setCartBusyId("");
    }
  };

  const handleActionClick = (type: string) => {
    if (!isLoggedIn) {
      setModalSource(type);
      setLoginModalOpen(true);
    } else {
      setNoticeMessage("Thông báo đã được ghi nhận vào tài khoản của bạn.");
      setTimeout(() => setNoticeMessage(""), 4000);
    }
  };

  const clearAllFilters = () => {
    setActiveCategory("All");
    setActiveAvailability("all");
    setSelectedCondition("");
    setSelectedStyle("");
    setSelectedPriceRange("");
    setSortBy("newest");
  };

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (activeCategory !== "All") {
      result = result.filter(
        (i) => i.category.toLowerCase() === activeCategory.toLowerCase()
      );
    }

    if (activeAvailability !== "all") {
      result = result.filter((i) => i.badge === activeAvailability);
    }

    if (selectedCondition) {
      result = result.filter((i) =>
        i.condition.toLowerCase().includes(selectedCondition.toLowerCase())
      );
    }

    if (selectedStyle) {
      result = result.filter(
        (i) => i.style.toLowerCase() === selectedStyle.toLowerCase()
      );
    }

    if (selectedPriceRange) {
      if (selectedPriceRange === "<200k") {
        result = result.filter((i) => i.price < 200000);
      } else if (selectedPriceRange === "200k-350k") {
        result = result.filter((i) => i.price >= 200000 && i.price <= 350000);
      } else if (selectedPriceRange === "350k-500k") {
        result = result.filter((i) => i.price > 350000 && i.price <= 500000);
      } else if (selectedPriceRange === ">500k") {
        result = result.filter((i) => i.price > 500000);
      }
    }

    if (sortBy === "low-to-high") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "high-to-low") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [
    items,
    activeCategory,
    activeAvailability,
    selectedCondition,
    selectedStyle,
    selectedPriceRange,
    sortBy,
  ]);

  const displayedItems = filteredItems.slice(0, visibleCount);

  // Split displayed items to place editorial banner after first 8 items
  const firstBatch = displayedItems.slice(0, 8);
  const secondBatch = displayedItems.slice(8);

  return (
    <div className="bg-[#fff8f5] text-[#231a11] font-body-md antialiased min-h-screen flex flex-col selection:bg-[#ffdbd0] selection:text-[#3a0b00]">
      {/* Top App Bar Navigation */}
      <Navbar />

      {/* Global alert toast if action triggered */}
      {noticeMessage && (
        <div
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] text-white px-6 py-3 rounded-full shadow-lg text-sm flex items-center gap-2 ${
            noticeIsError ? "bg-[#ba1a1a]" : "bg-[#392e25]"
          }`}
          role="status"
        >
          <span className={`material-symbols-outlined text-lg ${noticeIsError ? "text-white" : "text-[#dae9b5]"}`}>
            {noticeIsError ? "error" : "check_circle"}
          </span>
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* MAIN CONTENT CANVAS (1200px Max) */}
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-5 sm:px-6 py-8">
        {/* PAGE HEADER */}
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 pt-2">
          <div>
            <h1 className="font-display-lg text-3xl sm:text-5xl text-[#231a11] tracking-tight font-bold">
              Đồ 2hand mới đăng
            </h1>
            <p className="font-body-md text-sm sm:text-base text-[#55433d] mt-1">
              Giá từ 100K đến 500K · Mỗi món chỉ có một chiếc
            </p>
          </div>

          {/* Sort Dropdown Selector */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="sort-select"
              className="font-label-sm text-xs text-[#55433d] tracking-wider uppercase font-semibold"
            >
              Sắp xếp
            </label>
            <div className="relative">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-[#dbc1b9]/60 text-[#231a11] font-label-md text-xs font-semibold py-2.5 pl-4 pr-10 rounded-full shadow-xs focus:border-[#231a11] focus:ring-0 cursor-pointer"
              >
                <option value="newest">Mới đăng</option>
                <option value="low-to-high">Giá: thấp đến cao</option>
                <option value="high-to-low">Giá: cao đến thấp</option>
                <option value="ending-soon">Sắp kết thúc</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#88726c] text-base">
                expand_more
              </span>
            </div>
          </div>
        </section>

        {/* STICKY HORIZONTAL FILTER BAR */}
        <section className="sticky top-20 z-40 bg-[#fff8f5]/95 backdrop-blur-md py-3 -mx-2 px-2 border-b border-[#dbc1b9]/30 space-y-3 mb-6">
          {/* Primary Category Pills & Quick Controls */}
          <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2 rounded-full font-label-md text-xs font-semibold transition-all active:scale-95 whitespace-nowrap shadow-xs ${
                      isActive
                        ? "bg-[#974226] text-white shadow-sm"
                        : "bg-white border border-[#dbc1b9]/50 hover:border-[#231a11] text-[#231a11]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Availability Segmented Control */}
            <div className="hidden xl:flex items-center bg-[#f8e5d6]/60 p-1 rounded-full border border-[#dbc1b9]/30 text-xs font-medium">
              {AVAILABILITY_TABS.map((tab) => {
                const isSelected = activeAvailability === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveAvailability(tab.value)}
                    className={`px-3 py-1 rounded-full transition-all ${
                      isSelected
                        ? "bg-white text-[#231a11] shadow-xs font-bold"
                        : "text-[#55433d] hover:text-[#231a11]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Second Row: Filter Dropdowns & Active Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Condition Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "cond" ? null : "cond")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dbc1b9]/60 bg-white text-xs font-medium text-[#231a11] hover:bg-[#f8e5d6]/40 transition-colors"
                >
                  <span>{selectedCondition ? `Cond: ${selectedCondition}` : "Condition"}</span>
                  <span className="text-xs">▾</span>
                </button>
                {openDropdown === "cond" && (
                  <div className="absolute left-0 top-full mt-1.5 w-44 bg-white border border-[#dbc1b9]/40 rounded-xl shadow-lg p-2 z-50 space-y-1">
                    {["New", "Like New", "Excellent", "Very Good", "Good"].map((cnd) => (
                      <button
                        key={cnd}
                        onClick={() => {
                          setSelectedCondition(selectedCondition === cnd ? "" : cnd);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium ${
                          selectedCondition === cnd ? "bg-[#feeadc] text-[#974226]" : "hover:bg-[#fff8f5]"
                        }`}
                      >
                        {cnd}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "price" ? null : "price")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dbc1b9]/60 bg-white text-xs font-medium text-[#231a11] hover:bg-[#f8e5d6]/40 transition-colors"
                >
                  <span>{selectedPriceRange ? "Price filter" : "Price"}</span>
                  <span className="text-xs">▾</span>
                </button>
                {openDropdown === "price" && (
                  <div className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-[#dbc1b9]/40 rounded-xl shadow-lg p-2 z-50 space-y-1">
                    {[
                      { label: "Dưới 200k", val: "<200k" },
                      { label: "200k — 350k", val: "200k-350k" },
                      { label: "350k — 500k", val: "350k-500k" },
                      { label: "Trên 500k", val: ">500k" },
                    ].map((p) => (
                      <button
                        key={p.val}
                        onClick={() => {
                          setSelectedPriceRange(selectedPriceRange === p.val ? "" : p.val);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium ${
                          selectedPriceRange === p.val ? "bg-[#feeadc] text-[#974226]" : "hover:bg-[#fff8f5]"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Style Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "style" ? null : "style")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dbc1b9]/60 bg-white text-xs font-medium text-[#231a11] hover:bg-[#f8e5d6]/40 transition-colors"
                >
                  <span>{selectedStyle ? `Style: ${selectedStyle}` : "Style"}</span>
                  <span className="text-xs">▾</span>
                </button>
                {openDropdown === "style" && (
                  <div className="absolute left-0 top-full mt-1.5 w-40 bg-white border border-[#dbc1b9]/40 rounded-xl shadow-lg p-2 z-50 space-y-1">
                    {["Vintage", "Tailored", "Streetwear", "Minimalist", "Workwear"].map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setSelectedStyle(selectedStyle === st ? "" : st);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium ${
                          selectedStyle === st ? "bg-[#feeadc] text-[#974226]" : "hover:bg-[#fff8f5]"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="h-4 w-px bg-[#dbc1b9]/50 mx-1 hidden sm:inline-block"></span>

              {/* Removable active filter chips */}
              <div className="flex items-center gap-2">
                {selectedCondition && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ede1d2] text-[#201b12] text-xs font-medium">
                    Condition: {selectedCondition}
                    <button
                      onClick={() => setSelectedCondition("")}
                      className="hover:text-[#974226] font-bold ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedStyle && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ede1d2] text-[#201b12] text-xs font-medium">
                    Style: {selectedStyle}
                    <button
                      onClick={() => setSelectedStyle("")}
                      className="hover:text-[#974226] font-bold ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {selectedPriceRange && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ede1d2] text-[#201b12] text-xs font-medium">
                    Price filtered
                    <button
                      onClick={() => setSelectedPriceRange("")}
                      className="hover:text-[#974226] font-bold ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={clearAllFilters}
              className="text-[#974226] hover:text-[#b65a3c] font-label-sm text-xs font-semibold underline underline-offset-4 transition-colors"
            >
              Clear all
            </button>
          </div>
        </section>

        {/* SLIM PLATFORM TRUST & COMMERCE STRIP */}
        <section className="mb-8 w-full bg-[#fff1e8] border border-[#dbc1b9]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#feeadc] border border-[#dbc1b9]/40 flex-shrink-0 flex items-center justify-center text-[#974226]">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-label-md text-sm font-bold text-[#231a11]">
                  Mua sắm Thời trang Tuyển chọn &amp; Đấu giá Minh bạch
                </h4>
                <span className="inline-flex items-center gap-1 text-[11px] bg-[#dae9b5] text-[#151f01] font-semibold px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#556138]"></span>
                  100% Escrow Bảo đảm
                </span>
              </div>
              <p className="font-body-md text-xs text-[#55433d] mt-0.5">
                Đồ thường mua ngay dễ dàng qua Giỏ hàng. Đồ hiếm được người bán mở đấu giá để bạn trả giá tự do theo giá trị mong muốn.
              </p>
            </div>
          </div>

          <Link
            href="/auctions"
            className="px-4 py-2 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold hover:bg-[#b65a3c] transition-all inline-flex items-center gap-1.5 flex-shrink-0 self-end sm:self-center shadow-xs active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">gavel</span>
            <span>Khám phá Live Auctions</span>
          </Link>
        </section>

        {/* PRODUCT GRID: BATCH 1 (Cards 1-8) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {firstBatch.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onToggleWishlist={() => toggleWishlist(item)}
              onAddToCart={() => handleAddToCart(item)}
              inCart={Boolean(item.apiId && cartIds.includes(item.apiId))}
              cartBusy={Boolean(item.apiId && cartBusyId === item.apiId)}
              onActionClick={handleActionClick}
            />
          ))}
        </div>

        {/* INTERSPERSED EDITORIAL BANNER (Span 4 cols) */}
        <section className="my-12 relative w-full rounded-[24px] overflow-hidden shadow-md">
          <div className="relative min-h-[340px] flex items-center px-6 sm:px-14 py-12">
            {/* Background image */}
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCk4tS-sVgHddlAqH2E1PHbMkHSLRAlVV15lllVHVi-02bgB3R3HkmBn9Z6_MMH7qN5XxCmxZQ9l85LXNQ7avbbSKRVG_p06a6p1iq0xbe26nFmknb2BPIRSz6KRGYsvxVhc6Qi7tG3kLzmstUz3cmKCmPyFpdDt0s80BP6IMN5fiYfrO4HbZXKiJQvOHOBsD-E6YfbtioIHY8Mdl12isI0fmxY4bYS7AQJcBcw-ko"
              alt="Editorial lookbook"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Dark warm editorial gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#392e25]/95 via-[#392e25]/80 to-transparent"></div>

            <div className="relative z-10 max-w-xl text-[#ffeee1] space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#974226]/85 backdrop-blur-md text-white text-[12px] font-semibold tracking-wider uppercase">
                <span className="w-2 h-2 rounded-full bg-[#dae9b5] animate-ping"></span>
                Đồ si tuyển mỗi tuần
              </div>

              <h2 className="font-display-lg text-2xl sm:text-4xl text-white tracking-tight leading-tight font-bold">
                Áo khoác, quần jean và giày 2hand giá từ 100K
              </h2>

              <p className="font-body-md text-[#ffeee1]/90 text-sm sm:text-base leading-relaxed max-w-md">
                Mỗi món chỉ có một chiếc, mô tả rõ tình trạng thật. Tiền được sàn giữ đến khi bạn nhận hàng.
              </p>

              <div className="pt-2 flex items-center gap-4 flex-wrap">
                <Link
                  href="/seller/products/new"
                  className="px-6 py-3 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold hover:bg-[#b65a3c] transition-all active:scale-95 shadow-sm inline-flex items-center gap-2"
                >
                  <span>Đăng bán đồ của bạn</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <Link
                  href="/auctions"
                  className="px-5 py-3 border border-white/40 hover:bg-white/10 rounded-full font-label-md text-xs font-semibold text-white transition-colors"
                >
                  Xem đấu giá
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT GRID: BATCH 2 (Cards 9-12+) */}
        {secondBatch.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {secondBatch.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onToggleWishlist={() => toggleWishlist(item)}
                onAddToCart={() => handleAddToCart(item)}
                inCart={Boolean(item.apiId && cartIds.includes(item.apiId))}
                cartBusy={Boolean(item.apiId && cartBusyId === item.apiId)}
                onActionClick={handleActionClick}
              />
            ))}
          </div>
        )}

        {/* BOTTOM PAGINATION / LOAD MORE */}
        <section className="mt-16 mb-12 flex flex-col items-center justify-center gap-3">
          {visibleCount < filteredItems.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="px-8 py-3 rounded-full border border-[#974226] text-[#974226] hover:bg-[#974226] hover:text-white transition-all duration-200 font-label-md text-xs font-semibold shadow-xs active:scale-95"
            >
              Xem thêm
            </button>
          )}
          <p className="font-label-sm text-xs text-[#55433d]">
            Đang hiện {Math.min(visibleCount, filteredItems.length)} trên {filteredItems.length} món
          </p>
        </section>
      </main>

      {/* FOOTER */}
      <Footer />

      {/* LOGIN MODAL */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        actionSource={modalSource}
      />
    </div>
  );
}

// Thẻ sản phẩm
function ProductCard({
  item,
  onToggleWishlist,
  onAddToCart,
  inCart,
  cartBusy,
  onActionClick,
}: {
  item: ShopItem;
  onToggleWishlist: () => void;
  onAddToCart: () => void;
  inCart: boolean;
  cartBusy: boolean;
  onActionClick: (type: string) => void;
}) {
  const router = useRouter();
  const isSold = item.badge === "sold";
  const isHeld = item.badge === "held";
  const isAuction = item.badge === "auction";
  const isUpcoming = item.badge === "upcoming";

  const productUrl = item.apiId ? `/products/${item.apiId}` : `/products/${item.id}`;

  return (
    <article
      className={`group flex flex-col cursor-pointer ${isSold ? "opacity-85" : ""}`}
      onClick={() => router.push(productUrl)}
    >
      {/* 3/4 Aspect Ratio Card Container */}
      <div className="relative aspect-[3/4] w-full rounded-[20px] overflow-hidden bg-[#f8e5d6] shadow-sm">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isSold ? "grayscale-[20%]" : ""
            }`}
          />
        ) : (
          /* Fallback image placeholder */
          <div className="relative aspect-[3/4] w-full h-full rounded-[20px] overflow-hidden bg-[#ede1d2]/50 border border-[#dbc1b9]/30 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#feeadc] flex items-center justify-center text-[#88726c] mb-3">
              <span className="material-symbols-outlined text-2xl">checkroom</span>
            </div>
            <span className="font-label-md text-xs text-[#231a11] font-semibold">Chưa có ảnh</span>
            <span className="font-body-md text-[11px] text-[#88726c] mt-1">
              Món này chưa có ảnh
            </span>
          </div>
        )}

        {/* Status Badges */}
        {isHeld && (
          <div className="absolute top-3 left-3 bg-[#b65a3c] text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-xs">
            {item.badgeLabel || "HELD (08:24)"}
          </div>
        )}
        {isAuction && (
          <div className="absolute top-3 left-3 bg-[#4a2e63] text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            AUCTION
          </div>
        )}
        {isUpcoming && (
          <div className="absolute top-3 left-3 bg-[#556138] text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-xs">
            UPCOMING ({item.dropTime || "18:00"})
          </div>
        )}
        {isSold && (
          <div className="absolute top-3 left-3 bg-[#655d52] text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-xs">
            SOLD
          </div>
        )}

        {/* Frosted Heart Button */}
        {!isSold && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist();
            }}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all z-10 shadow-xs ${
              item.isWishlist
                ? "bg-white text-[#974226]"
                : "bg-white/40 hover:bg-white/70 text-[#231a11]"
            }`}
            title="Wishlist"
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{ fontVariationSettings: item.isWishlist ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          </button>
        )}

        {/* Price Pill Badge */}
        <div className="absolute bottom-3 left-3 backdrop-blur-md bg-white/70 px-3 py-1 rounded-full text-[#231a11] shadow-xs">
          <span className="font-headline-md text-xs sm:text-sm font-bold tracking-tight">
            {item.priceLabel}
          </span>
        </div>

        {/* Slide-up Action Bar on Hover */}
        <div className="absolute inset-x-3 bottom-3 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
          {isAuction ? (
            <Link
              href={item.apiId ? `/products/${item.apiId}` : "/auctions"}
              onClick={(e) => e.stopPropagation()}
              className="w-full py-2.5 bg-[#4a2e63] text-white rounded-full font-label-md text-xs font-semibold shadow-md hover:bg-[#5e3b7d] transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">gavel</span>
              <span>Tham gia Đấu giá</span>
            </Link>
          ) : isSold ? (
            <button
              disabled
              className="w-full py-2.5 bg-[#655d52]/70 text-white rounded-full font-label-md text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Đã bán hết</span>
            </button>
          ) : isUpcoming ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActionClick("reminder");
              }}
              className="w-full py-2.5 bg-[#556138] text-white rounded-full font-label-md text-xs font-semibold shadow-md hover:bg-[#6d7a4f] transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">notifications_active</span>
              <span>Nhắc nhở mở bán</span>
            </button>
          ) : isHeld ? (
            <button
              disabled
              className="w-full py-2.5 bg-[#655d52] text-white rounded-full font-label-md text-xs font-semibold shadow-md opacity-90 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">lock_clock</span>
              <span>Đang trong Escrow</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <button
                disabled={cartBusy}
                onClick={(e) => {
                  e.stopPropagation();
                  if (inCart) {
                    router.push("/cart");
                  } else {
                    onAddToCart();
                  }
                }}
                className={`flex-1 py-2.5 rounded-full font-label-md text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-70 ${
                  inCart ? "bg-white text-[#556138] hover:bg-[#f2f6e6]" : "bg-[#974226] text-white hover:bg-[#b65a3c]"
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">{inCart ? "check" : "shopping_bag"}</span>
                <span>{cartBusy ? "Đang thêm..." : inCart ? "Đã trong giỏ · Xem giỏ" : "Thêm vào giỏ"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Details Under Image */}
      <div className="mt-3 space-y-1">
        <Link href={productUrl}>
          <h3 className="font-headline-md text-sm sm:text-base text-[#231a11] truncate group-hover:text-[#974226] transition-colors font-semibold">
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
  );
}
