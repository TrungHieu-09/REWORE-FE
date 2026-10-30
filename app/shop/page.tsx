"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";
import {
  ApiError,
  apiAssetUrl,
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

const DEFAULT_CURATED_ITEMS: ShopItem[] = [
  {
    id: "curated-1",
    name: "Double-Breasted Wool Trench",
    brand: "Burberry Prorsum",
    size: "40 / M",
    condition: "Like New",
    meta: "Burberry Prorsum · 40 / M · Like New",
    shop: "Milano Archive Vault",
    shopInitial: "M",
    price: 1850000,
    priceLabel: "1.850.000đ",
    badge: "available",
    category: "Jackets",
    style: "Tailored",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBOEP4otC-ryHgvPKYY-VV9r3rrSR0PCSaMkTmKlTjj9QEvR_Aoj38k5mtIngo0hqqDy1y4nEFkJl9NYfIr5lfS4uuj7gNZAiSFsFCMSpQZ-CzameX0uCaS9JPCmCq5PQpYmGSFIzxieK7KNX0UtnYqbRHjcwEySsWTG3vZMQffyf2KG1G8sdWxqk8tyZqFxbUkdoQmjhqOn1ThJ_qZNO0T4WTWkNV7o_RzQYdTvfc",
  },
  {
    id: "curated-2",
    name: "1998 Distressed Moto Jacket",
    brand: "Helmut Lang",
    size: "L",
    condition: "Excellent",
    meta: "Helmut Lang · L · Excellent",
    shop: "Atelier V",
    shopInitial: "A",
    price: 2450000,
    priceLabel: "2.450.000đ",
    badge: "held",
    badgeLabel: "HELD (08:24)",
    heldCountdown: "08:24",
    category: "Jackets",
    style: "Streetwear",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCcGGVCvPOJQmShGOY3CBKfG3kpotIZWyV2sIInXEoo5fvyW8x25cDlT-had0uVrtzdbSOKvlvCUgnLojgNai2zT2uCEbXcq_bfekVlRMUj3k-oGNYV3oW9fv_RMw56ej1le_C2mFJ0ggeuIbZOVzWAF6cXD7nONUO3ify024M57MDVEu9uhNMLlULSG0SYJRhx_JZbPZEpWn3Q5pEheBKRPyOnBiZwuDhntJR-VQA",
  },
  {
    id: "curated-3",
    name: "Hand-Spun Mohair Cable Knit",
    brand: "Loro Piana",
    size: "M",
    condition: "Pristine",
    meta: "Loro Piana · M · Pristine",
    shop: "Cotswold Vintage",
    shopInitial: "C",
    price: 850000,
    priceLabel: "850.000đ",
    badge: "auction",
    category: "Hoodies",
    style: "Vintage",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7UtZiuwyQppux9C9LdY3Nfe951L96v1NkAFLleaplpsQgyfx-VMCoOEbMuZQgPKnlu6iVjrkRz2HNSxnNqvFNeMduoyiyQNUhHfiaJdeNSIfb_-RxAknupUV_Ah_NW4QYyNnosJmfNkTZ8ZejJTW8elJQpGOXV6la5j6xZtYf3kKAbbowq_hhkbSEVEg9-dEwj9RIiya52Q17bRDmTaRrDmCdrux7IxlRbFyqy9g",
  },
  {
    id: "curated-4",
    name: "90s Bias-Cut Silk Slip Dress",
    brand: "Jil Sander",
    size: "S",
    condition: "Like New",
    meta: "Jil Sander · S · Like New",
    shop: "SoHo Relics",
    shopInitial: "S",
    price: 1120000,
    priceLabel: "1.120.000đ",
    badge: "available",
    category: "Dresses",
    style: "Minimalist",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDHXggzqzxRLrSQ6l8b1DobJsDQ9NaAlbZ-1DFnbhDL1FECj9mtgNOTPw7kTbb_sKWv4ipVlW2tBXtaBgBeIDNrZxLVn4zycwXG785C6VPSIiUxAu3aSuQLaXA-OQnItN9WlFaDfv5dO6_4YV6LTsuAiYIW3pEMWn5W65am9i5jetfO4yr7rKGBsC1bPGHWfRBcMzEwu2vpFhMME4nD0pySGotig0ja0f9ibL1tnIc",
  },
  {
    id: "curated-5",
    name: "Raw 16oz Selvedge Denim",
    brand: "Studio D'Artisan",
    size: "32x32",
    condition: "Deadstock",
    meta: "Studio D'Artisan · 32x32 · Deadstock",
    shop: "Kojima Goods Co.",
    shopInitial: "K",
    price: 920000,
    priceLabel: "920.000đ",
    badge: "upcoming",
    dropTime: "18:00",
    category: "Denim",
    style: "Workwear",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCkkmVQrMW4VpLXouGum0M1kR-paNGepBLD7jkwMVkOkL7xrBHpT3M9QQYOs_WSIF555iYnVttmZzB106q0LrRRnlO7fTgUYlBFFL9fjY9LVrYq7wlm5egl53gM8kleNOoiNcBywMpZX02w4xC7sFAVoMgzPRFGYjxXCK22hq3B3KxvMD2Wwqc-osgef9WuXhfXq_5jfUkyA0_Jn04fG2YkPzZBK7HcOAqz1aHDZ4",
  },
  {
    id: "curated-6",
    name: "Poplin Tailored Oxford Shirt",
    brand: "Margaret Howell",
    size: "M",
    condition: "Very Good",
    meta: "Margaret Howell · M · Very Good",
    shop: "London Haberdashery",
    shopInitial: "L",
    price: 450000,
    priceLabel: "450.000đ",
    badge: "available",
    category: "Shirts",
    style: "Minimalist",
    imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "curated-7",
    name: "Archive Triomphe Box Bag",
    brand: "Céline",
    size: "One Size",
    condition: "Excellent",
    meta: "Céline · One Size · Excellent",
    shop: "Rue de Verneuil Vault",
    shopInitial: "R",
    price: 3200000,
    priceLabel: "3.200.000đ",
    badge: "sold",
    category: "Bags",
    style: "Vintage",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAZ_pcB9_UKa_3vam3g8gm0kht8A-60_3oplkf2sSmSQ76rjslMmUsj3ol1AdGfE7nAyQ63FwIS0rGmKlCiNZXRx-ol4SXCZIotSWpkWE9o37PEN-IhItUdW3usULlkmpiOUfbQkIHYph5UGrrwC7o_MGnsbd4REDNQCiaW21s1q5CFPskn8CH0QsGSGIIVxXn16J3ouog9y4evu6GsDpAdz1Apl6bEiNqVoF45h5s",
  },
  {
    id: "curated-8",
    name: "Plaited Fringe Cashmere Scarf",
    brand: "Johnstons of Elgin",
    size: "OS",
    condition: "New",
    meta: "Johnstons of Elgin · OS · New",
    shop: "Edinburgh Looms",
    shopInitial: "E",
    price: 164000,
    priceLabel: "164.000đ",
    badge: "available",
    category: "Accessories",
    style: "Vintage",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC14GyoLm4wJpyQygnV1es-QKkQJPrOgETZ4zqx9MXNGOmrbXDFxDU7Ei3TnrlyZT1uiQGkm4n0qTjfY2uvHeosHRQV7RIYOCBroWxOEVTnLvLvuCyhY9jbj19o5V2qP2NfTpE0UX-rPFkl_wnGcrU2UQTcEAtXsfNdCfvlmeFbiZR_4aEMZH52eNTKQBi7P4TpSUm-o83sboqBKv-nWSqJOPiRLfDOjj7-iV-Wex8",
  },
  {
    id: "curated-9",
    name: "Alpaca Blend Ribbed Cardigan",
    brand: "Our Legacy",
    size: "48 / M",
    condition: "Pristine",
    meta: "Our Legacy · 48 / M · Pristine",
    shop: "Nordic Resale",
    shopInitial: "N",
    price: 1450000,
    priceLabel: "1.450.000đ",
    badge: "available",
    category: "Hoodies",
    style: "Minimalist",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDICbjTVVKTrgO2s3hBvmbQr4_XTLD7fHAH1Xzf2dTjBHC9ZH1IudfYiugFLYF6s3c3ioRzrE3o4LM5N853D9fbby5vptVfNJHCFs2Yfqyoq6hVCLRDmMc_8IxGP_NJjY1__K1tMXy7aRttmbpTcpClIOB09TrX19BO1zSASWhHHYKRDktQlT6fMoUgyNeJxFXkbngkcjCBMaKaErat2frF-XjqokWMTD2SCkewaDE",
  },
  {
    id: "curated-10",
    name: "Double-Pleated Wool Trousers",
    brand: "Yohji Yamamoto",
    size: "3 / L",
    condition: "Good",
    meta: "Yohji Yamamoto · 3 / L · Good",
    shop: "Tokyo Guild",
    shopInitial: "T",
    price: 670000,
    priceLabel: "670.000đ",
    badge: "auction",
    category: "Denim",
    style: "Tailored",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCVORHaDw1vxnq8hjUQkbmUtNmMohHSYOUBiA0h9QrxSFfx2czkRLI6beOk7Oc6aCtAaIqaQgmftwsAgXRE5f598eV8rrZFhxEWVHGdlAseOUNkY51sodpPuZPplzmj0ipGmYy8bioQ7guu5uDfnf7BFH_S65zg53fgjMjMLQIDTabGVEkGpsPUTDx6ICuDEp-KZ-T8OPlSuO6Oj2LXJBMh18qW1VT9uh0iw4LkVa4",
  },
  {
    id: "curated-11",
    name: "Archival Washed Field Vest",
    brand: "Engineered Garments",
    size: "M",
    condition: "Like New",
    meta: "Engineered Garments · M · Like New",
    shop: "Brooklyn Surplus",
    shopInitial: "B",
    price: 520000,
    priceLabel: "520.000đ",
    badge: "available",
    category: "Jackets",
    style: "Workwear",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBayaFbZCcwMeuuTIXtBaHkbmijatDE2m5S8vEroCOJ6kQ9U9IoJnRtOhgSvdZ-eKsKao09T66kXeFMuqm7j6t9bvp5eHeeCbRjcNxIuRGtKnGSwHCuWnm3m3cF1mfT1i-e3kR0PT1kD8H8EXDQXBw9L1LdRZHp4iyNftGDoMs5DCGdi0AM9RtMs7HpVdDD3eIH8RZGb0GbkQFKU9Ynz7Hqr8K7FYVrMSxD1M7CyJE",
  },
  {
    id: "curated-12",
    name: "Tobacco Suede Chelsea Boots",
    brand: "Church's",
    size: "42 EU",
    condition: "Excellent",
    meta: "Church's · 42 EU · Excellent",
    shop: "Cobbler Archive",
    shopInitial: "C",
    price: 1250000,
    priceLabel: "1.250.000đ",
    badge: "available",
    category: "Accessories",
    style: "Vintage",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDJO1z0IWed4Gh1401W_vfDkMS2_JLbeje8q_7eu9ZS-vc0jyMsvtgjeWFhz8kuNEmgJYIIk39AAGLB3MMOyZMkHxQXlVwuspcNaskxS-JYHz9Yh36c-nsXeNIK07zuILaDmhV1_EV5QsO2551FDR8l2Tv8fdeWSC0XewdmPyqMi_hUovW6fG_XLUgkJlY4r6HOdc02YLyxty2xkxp9ZXG5o3t7X8-5-rayr_Ljp1o",
  },
];

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
  { label: "All", value: "all" },
  { label: "Available", value: "available" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Auction", value: "auction" },
  { label: "Sold", value: "sold" },
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
    brand: product.brand || "Vintage Atelier",
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
  const { isLoggedIn, isLoading, user } = useAuth();

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeAvailability, setActiveAvailability] = useState<"all" | Badge>("all");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<string>("general");
  const [noticeMessage, setNoticeMessage] = useState<string>("");

  const [items, setItems] = useState<ShopItem[]>(DEFAULT_CURATED_ITEMS);
  const [dataLoading, setDataLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);

  // Fetch real API items if available
  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);

    Promise.allSettled([
      productsApi.list({ limit: 50, sortBy: "newest" }),
      isLoggedIn ? wishlistApi.list({ limit: 50 }) : Promise.resolve({ data: [] }),
    ])
      .then(([productsResult, wishlistResult]) => {
        if (cancelled) return;

        const wishlistIds = new Set<string>();
        if (wishlistResult.status === "fulfilled" && "data" in wishlistResult.value) {
          (wishlistResult.value.data as any[]).forEach((item) => {
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
        // Fallback gracefully to default curated items
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
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

  const handleHoldAction = (item: ShopItem) => {
    if (!isLoggedIn) {
      setModalSource("hold");
      setLoginModalOpen(true);
      return;
    }

    setNoticeMessage(`Đã đặt quyền giữ 15 phút cho: "${item.name}". Hệ thống escrow đang khóa đơn hàng.`);
    setTimeout(() => setNoticeMessage(""), 4500);
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
    setSelectedSize("");
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

    if (selectedSize) {
      result = result.filter((i) =>
        i.size.toLowerCase().includes(selectedSize.toLowerCase())
      );
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
      if (selectedPriceRange === "<500k") {
        result = result.filter((i) => i.price < 500000);
      } else if (selectedPriceRange === "500k-1.5m") {
        result = result.filter((i) => i.price >= 500000 && i.price <= 1500000);
      } else if (selectedPriceRange === "1.5m-3m") {
        result = result.filter((i) => i.price > 1500000 && i.price <= 3000000);
      } else if (selectedPriceRange === ">3m") {
        result = result.filter((i) => i.price > 3000000);
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
    selectedSize,
    selectedCondition,
    selectedStyle,
    selectedPriceRange,
    sortBy,
  ]);

  const displayedItems = filteredItems.slice(0, visibleCount);
  const buyerScore = user?.reputation ?? 86;

  // Split displayed items to place editorial banner after first 8 items
  const firstBatch = displayedItems.slice(0, 8);
  const secondBatch = displayedItems.slice(8);

  return (
    <div className="bg-[#fff8f5] text-[#231a11] font-body-md antialiased min-h-screen flex flex-col selection:bg-[#ffdbd0] selection:text-[#3a0b00]">
      {/* Top App Bar Navigation */}
      <Navbar />

      {/* Global alert toast if action triggered */}
      {noticeMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#392e25] text-white px-6 py-3 rounded-full shadow-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-[#dae9b5] text-lg">check_circle</span>
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* MAIN CONTENT CANVAS (1200px Max) */}
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-5 sm:px-6 py-8">
        {/* PAGE HEADER */}
        <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 pt-2">
          <div>
            <h1 className="font-display-lg text-3xl sm:text-5xl text-[#231a11] tracking-tight font-bold">
              For You
            </h1>
            <p className="font-body-md text-sm sm:text-base text-[#55433d] mt-1">
              Picked for your style · Updated 4 minutes ago
            </p>
          </div>

          {/* Sort Dropdown Selector */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="sort-select"
              className="font-label-sm text-xs text-[#55433d] tracking-wider uppercase font-semibold"
            >
              Sort By
            </label>
            <div className="relative">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-[#dbc1b9]/60 text-[#231a11] font-label-md text-xs font-semibold py-2.5 pl-4 pr-10 rounded-full shadow-xs focus:border-[#231a11] focus:ring-0 cursor-pointer"
              >
                <option value="newest">Newest arrivals</option>
                <option value="low-to-high">Price: low to high</option>
                <option value="high-to-low">Price: high to low</option>
                <option value="ending-soon">Ending soon</option>
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
              {/* Size Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "size" ? null : "size")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dbc1b9]/60 bg-white text-xs font-medium text-[#231a11] hover:bg-[#f8e5d6]/40 transition-colors"
                >
                  <span>{selectedSize ? `Size: ${selectedSize}` : "Size"}</span>
                  <span className="text-xs">▾</span>
                </button>
                {openDropdown === "size" && (
                  <div className="absolute left-0 top-full mt-1.5 w-36 bg-white border border-[#dbc1b9]/40 rounded-xl shadow-lg p-2 z-50 space-y-1">
                    {["XS", "S", "M", "L", "XL"].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => {
                          setSelectedSize(selectedSize === sz ? "" : sz);
                          setOpenDropdown(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium ${
                          selectedSize === sz ? "bg-[#feeadc] text-[#974226]" : "hover:bg-[#fff8f5]"
                        }`}
                      >
                        Size {sz}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
                      { label: "Dưới 500k", val: "<500k" },
                      { label: "500k — 1.5M", val: "500k-1.5m" },
                      { label: "1.5M — 3M", val: "1.5m-3m" },
                      { label: "Trên 3M", val: ">3m" },
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
                {selectedSize && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ede1d2] text-[#201b12] text-xs font-medium">
                    Size: {selectedSize}
                    <button
                      onClick={() => setSelectedSize("")}
                      className="hover:text-[#974226] font-bold ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                )}
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

        {/* SLIM "YOUR REPUTATION" STRIP */}
        <section className="mb-8 w-full bg-[#fff1e8] border border-[#dbc1b9]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            {/* Circular Progress Ring (Score in Olive) */}
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
                  Buyer Score — {buyerScore >= 50 ? "Eligible" : "Standard"}
                </h4>
                <span className="inline-flex items-center gap-1 text-[11px] bg-[#dae9b5] text-[#151f01] font-semibold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#556138]"></span> Verified Tier
                </span>
              </div>
              <p className="font-body-md text-xs text-[#55433d] mt-0.5">
                Your trusted status grants priority 15-minute escrow hold privileges on live drops.
              </p>
            </div>
          </div>

          <Link
            href="/profile"
            className="font-label-md text-xs text-[#974226] font-semibold hover:underline inline-flex items-center gap-1 flex-shrink-0 self-end sm:self-center"
          >
            <span>View profile</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </section>

        {/* PRODUCT GRID: BATCH 1 (Cards 1-8) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {firstBatch.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              onToggleWishlist={() => toggleWishlist(item)}
              onHold={() => handleHoldAction(item)}
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
                Tonight's Curated Drop — 02:45:10
              </div>

              <h2 className="font-display-lg text-2xl sm:text-4xl text-white tracking-tight leading-tight font-bold">
                Curated Archive: Milanese Leather &amp; 90s Tailoring
              </h2>

              <p className="font-body-md text-[#ffeee1]/90 text-sm sm:text-base leading-relaxed max-w-md">
                Forty-two single-owner masterpieces sourced directly from private ateliers across Lombardy.
                Includes documented provenance and verified escrow hold.
              </p>

              <div className="pt-2 flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => handleActionClick("reminder")}
                  className="px-6 py-3 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold hover:bg-[#b65a3c] transition-all active:scale-95 shadow-sm inline-flex items-center gap-2"
                >
                  <span>Set Reminder</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
                <Link
                  href="/auctions"
                  className="px-5 py-3 border border-white/40 hover:bg-white/10 rounded-full font-label-md text-xs font-semibold text-white transition-colors"
                >
                  Explore Drop
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
                onHold={() => handleHoldAction(item)}
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
              Load more
            </button>
          )}
          <p className="font-label-sm text-xs text-[#55433d]">
            Showing {Math.min(visibleCount, filteredItems.length)} of {filteredItems.length} items
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

// Subcomponent for individual luxury product card
function ProductCard({
  item,
  onToggleWishlist,
  onHold,
  onActionClick,
}: {
  item: ShopItem;
  onToggleWishlist: () => void;
  onHold: () => void;
  onActionClick: (type: string) => void;
}) {
  const isSold = item.badge === "sold";
  const isHeld = item.badge === "held";
  const isAuction = item.badge === "auction";
  const isUpcoming = item.badge === "upcoming";

  const productUrl = item.apiId ? `/products/${item.apiId}` : `/products/${item.id}`;

  return (
    <article className={`group flex flex-col cursor-pointer ${isSold ? "opacity-85" : ""}`}>
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
            <span className="font-label-md text-xs text-[#231a11] font-semibold">Image unavailable</span>
            <span className="font-body-md text-[11px] text-[#88726c] mt-1">
              Archival scan in re-verification
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
          {isHeld ? (
            <button
              disabled
              className="w-full py-2.5 bg-[#655d52] text-white rounded-full font-label-md text-xs font-semibold shadow-md opacity-90 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">lock_clock</span>
              <span>Currently in Escrow</span>
            </button>
          ) : isAuction ? (
            <Link
              href={item.apiId ? `/products/${item.apiId}` : "/auctions"}
              className="w-full py-2.5 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold shadow-md hover:bg-[#b65a3c] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">gavel</span>
              <span>Place Bid</span>
            </Link>
          ) : isUpcoming ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActionClick("reminder");
              }}
              className="w-full py-2.5 bg-[#556138] text-white rounded-full font-label-md text-xs font-semibold shadow-md hover:bg-[#6d7a4f] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">notifications_active</span>
              <span>Notify Drop</span>
            </button>
          ) : isSold ? (
            <button
              disabled
              className="w-full py-2.5 bg-[#655d52]/70 text-white rounded-full font-label-md text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Sold Out</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHold();
              }}
              className="w-full py-2.5 bg-[#974226] text-white rounded-full font-label-md text-xs font-semibold shadow-md hover:bg-[#b65a3c] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">timer</span>
              <span>Hold Item (15m)</span>
            </button>
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
