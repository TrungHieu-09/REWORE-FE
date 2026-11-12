"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useHold } from "../context/HoldContext";
import { useAuth } from "../context/AuthContext";
import {
  ApiError,
  apiAssetUrl,
  cartApi,
  ordersApi,
  productsApi,
  sellerDisplayName,
  type Order,
  type Product,
} from "../lib/api";

type CheckoutStep = "checkout" | "payment" | "success";
type ShippingMethod = "standard" | "express";
type PaymentMethod = "vietqr" | "momo" | "zalopay" | "cod";

interface CheckoutItemView {
  id: string;
  title: string;
  shopName: string;
  brand: string;
  size: string;
  conditionLabel: string;
  price: number;
  imageUrl: string;
  isRealProduct: boolean;
  isAvailable: boolean;
}

function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN")}đ`;
}

function conditionToLabel(condition?: string): string {
  if (!condition) return "Secondhand";
  const map: Record<string, string> = {
    NEW: "Mới 100%",
    LIKE_NEW: "Như mới",
    GOOD: "Tình trạng tốt",
    FAIR: "Khá",
    POOR: "Đã qua sử dụng",
  };
  return map[condition] || condition;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productIdParam = searchParams.get("productId");

  const { heldItems, confirmSold, getRemainingSeconds } = useHold();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<CheckoutStep>("checkout");
  const [realProduct, setRealProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  // Load real product from ?productId=... or fallback to first available item in user's cart
  useEffect(() => {
    let cancelled = false;

    if (productIdParam && /^\d+$/.test(productIdParam)) {
      setLoadingProduct(false);
      return;
    }

    if (productIdParam) {
      setLoadingProduct(true);
      productsApi
        .get(productIdParam)
        .then((res) => {
          if (!cancelled) setRealProduct(res.data);
        })
        .catch(() => {
          if (!cancelled) setRealProduct(null);
        })
        .finally(() => {
          if (!cancelled) setLoadingProduct(false);
        });
      return () => {
        cancelled = true;
      };
    }

    if (authLoading) return;

    if (!isLoggedIn) {
      setLoadingProduct(false);
      return;
    }

    setLoadingProduct(true);
    cartApi
      .list({ limit: 10 })
      .then((res) => {
        if (cancelled) return;
        const firstAvailable =
          res.data.find((item) => item.isAvailable) || res.data[0];
        setRealProduct(firstAvailable ? firstAvailable.product : null);
      })
      .catch(() => {
        if (!cancelled) setRealProduct(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingProduct(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, productIdParam]);

  const numericHoldId =
    productIdParam && /^\d+$/.test(productIdParam) ? parseInt(productIdParam, 10) : null;
  const heldItem = numericHoldId
    ? heldItems.find((i) => i.id === numericHoldId)
    : undefined;

  const itemView: CheckoutItemView | null = useMemo(() => {
    if (realProduct) {
      return {
        id: realProduct.id,
        title: realProduct.title,
        shopName: sellerDisplayName(realProduct.seller, "REWORE Shop"),
        brand: realProduct.brand || realProduct.category || "Vintage",
        size: realProduct.size ? `Size ${realProduct.size}` : "Freesize",
        conditionLabel: conditionToLabel(realProduct.condition),
        price: realProduct.price,
        imageUrl: realProduct.images?.[0]
          ? apiAssetUrl(realProduct.images[0])
          : "/shop-blazer.png",
        isRealProduct: true,
        isAvailable:
          realProduct.status === "ACTIVE" &&
          realProduct.availabilityStatus === "available",
      };
    }
    if (heldItem) {
      return {
        id: String(heldItem.id),
        title: heldItem.name,
        shopName: heldItem.shop,
        brand: "Đang giữ hàng",
        size: heldItem.meta || "Vintage",
        conditionLabel: "Đã kiểm duyệt",
        price: heldItem.price < 1000 ? heldItem.price * 1000 : heldItem.price,
        imageUrl: heldItem.img || "/shop-blazer.png",
        isRealProduct: false,
        isAvailable: true,
      };
    }
    return null;
  }, [heldItem, realProduct]);

  // Form states
  const [editingAddress, setEditingAddress] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderNote, setOrderNote] = useState("");

  useEffect(() => {
    if (user) {
      setRecipientName((prev) => prev || user.name || "");
      setRecipientPhone((prev) => prev || user.phone || "");
      setShippingAddress((prev) => prev || user.address || "");
      if (!user.phone || !user.address) {
        setEditingAddress(true);
      }
    } else {
      setEditingAddress(true);
    }
  }, [user]);

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vietqr");

  const [qrSeconds, setQrSeconds] = useState(15 * 60);
  useEffect(() => {
    if (step !== "payment") return;
    const interval = setInterval(() => {
      setQrSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const qrFormatted = `${String(Math.floor(qrSeconds / 60)).padStart(2, "0")}:${String(
    qrSeconds % 60
  ).padStart(2, "0")}`;

  const holdSeconds = heldItem ? getRemainingSeconds(heldItem.id) : 0;
  const holdFormatted = `${String(Math.floor(holdSeconds / 60)).padStart(2, "0")}:${String(
    holdSeconds % 60
  ).padStart(2, "0")}`;

  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [orderRefCode, setOrderRefCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofMessage, setProofMessage] = useState("");
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  const shippingFee = shippingMethod === "express" ? 45000 : 25000;
  const totalAmount = (itemView?.price || 0) + shippingFee;

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Ignore clipboard errors
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemView) return;

    if (!isLoggedIn && itemView.isRealProduct) {
      router.push(`/login?redirect=${encodeURIComponent(`/checkout?productId=${itemView.id}`)}`);
      return;
    }

    if (!recipientName.trim() || !recipientPhone.trim() || !shippingAddress.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.");
      setEditingAddress(true);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (itemView.isRealProduct) {
        const res = await ordersApi.create({
          productId: itemView.id,
          receiverName: recipientName.trim(),
          receiverPhone: recipientPhone.trim(),
          shippingAddress: shippingAddress.trim(),
          note: orderNote.trim() || undefined,
        });
        setCreatedOrder(res.data);
        setOrderRefCode(res.data.qrCodeRef || `RW-${res.data.id.slice(-6).toUpperCase()}`);
      } else if (heldItem) {
        const code = `RW-${Math.floor(100000 + Math.random() * 900000)}`;
        confirmSold(heldItem.id, code);
        setOrderRefCode(code);
      }

      if (paymentMethod === "cod") {
        setStep("success");
      } else {
        setQrSeconds(15 * 60);
        setStep("payment");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError ? err.message : "Không thể tạo đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadProof = async (file: File) => {
    setProofFile(file);
    if (!createdOrder) {
      setProofMessage("Đã đính kèm ảnh biên lai chuyển khoản.");
      return;
    }
    setUploadingProof(true);
    setProofMessage("");
    try {
      const res = await ordersApi.uploadPaymentProof(createdOrder.id, file);
      setCreatedOrder(res.data);
      setProofMessage("Đã tải lên ảnh xác nhận chuyển khoản!");
    } catch (err) {
      setProofMessage(
        err instanceof ApiError ? err.message : "Không thể tải lên ảnh biên lai."
      );
    } finally {
      setUploadingProof(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f5] text-[#231a11] font-body-md flex flex-col">
      <Navbar />

      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-10">
        {loadingProduct ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-sm text-[#55433d]">
            <div className="w-8 h-8 rounded-full border-2 border-[#974226] border-t-transparent animate-spin" />
            <span>Đang tải thông tin thanh toán...</span>
          </div>
        ) : !itemView ? (
          <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 md:p-10 text-center border border-[#dbc1b9]/40 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#feeadc] text-[#974226] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">shopping_bag</span>
            </div>
            <h1 className="font-headline-md text-2xl font-bold text-[#231a11] mb-2">
              Chưa có sản phẩm để thanh toán
            </h1>
            <p className="text-sm text-[#55433d] mb-6 leading-relaxed">
              Hãy chọn một món đồ từ giỏ hàng hoặc trang khám phá để tiến hành đặt hàng qua Escrow.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/shop"
                className="px-6 py-3 bg-[#974226] hover:bg-[#b65a3c] text-white rounded-full text-sm font-semibold transition-all"
              >
                Khám phá cửa hàng
              </Link>
              <Link
                href="/cart"
                className="px-6 py-3 bg-white border border-[#dbc1b9] text-[#231a11] hover:bg-[#fff1e8] rounded-full text-sm font-semibold transition-all"
              >
                Xem giỏ hàng
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Breadcrumb & Escrow badge */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-sm text-[#55433d]">
                <Link href="/cart" className="hover:text-[#974226] transition-colors">
                  Giỏ hàng
                </Link>
                <span className="text-[#dbc1b9]">/</span>
                <span className={step === "checkout" ? "text-[#974226] font-semibold" : ""}>
                  Thanh toán
                </span>
                <span className="text-[#dbc1b9]">/</span>
                <span className={step !== "checkout" ? "text-[#974226] font-semibold" : "text-[#88726c]"}>
                  {step === "payment" ? "Chuyển khoản VietQR" : "Xác nhận"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fff1e8] text-[#556138] text-xs font-semibold border border-[#556138]/20">
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lock
                </span>
                <span>Bảo vệ bởi REWORE Escrow</span>
              </div>
            </div>

            {/* =============================================================== */}
            {/* STEP 1: CHECKOUT FORM                                           */}
            {/* =============================================================== */}
            {step === "checkout" && (
              <form
                onSubmit={handlePlaceOrder}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                {/* LEFT COLUMN */}
                <div className="lg:col-span-7 space-y-6">
                  {/* 1. Delivery Address */}
                  <section className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(43,33,24,0.05)] border border-[#f8e5d6]/60">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-[#f8e5d6] text-[#974226] font-headline-md text-sm flex items-center justify-center font-bold">
                          1
                        </span>
                        <h2 className="font-headline-md text-xl sm:text-2xl font-semibold text-[#231a11]">
                          Địa chỉ nhận hàng
                        </h2>
                      </div>
                      {recipientName && recipientPhone && shippingAddress && (
                        <button
                          type="button"
                          onClick={() => setEditingAddress((v) => !v)}
                          className="text-[#974226] hover:text-[#b65a3c] text-sm font-semibold hover:underline"
                        >
                          {editingAddress ? "Xong" : "Thay đổi"}
                        </button>
                      )}
                    </div>

                    {!editingAddress && recipientName && recipientPhone && shippingAddress ? (
                      <div className="rounded-2xl p-5 bg-[#fff1e8] border border-[#f8e5d6] flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-[#231a11] font-bold">
                              {recipientName}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#556138]/15 text-[#556138]">
                              Mặc định
                            </span>
                          </div>
                          <p className="text-sm text-[#55433d] mb-1">{recipientPhone}</p>
                          <p className="text-sm text-[#231a11] leading-relaxed">
                            {shippingAddress}
                          </p>
                          {orderNote && (
                            <p className="text-xs text-[#6b6357] mt-2 italic">
                              Ghi chú: {orderNote}
                            </p>
                          )}
                        </div>
                        <span className="material-symbols-outlined text-[#556138] text-[22px]">
                          verified
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-[#55433d] mb-1.5">
                              Họ và tên người nhận *
                            </label>
                            <input
                              type="text"
                              required
                              value={recipientName}
                              onChange={(e) => setRecipientName(e.target.value)}
                              placeholder="Nguyễn Văn A"
                              className="w-full px-4 py-2.5 rounded-xl bg-[#fff8f5] border border-[#dbc1b9] text-sm text-[#231a11] focus:outline-none focus:border-[#974226]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#55433d] mb-1.5">
                              Số điện thoại *
                            </label>
                            <input
                              type="text"
                              required
                              value={recipientPhone}
                              onChange={(e) => setRecipientPhone(e.target.value)}
                              placeholder="0901 234 567"
                              className="w-full px-4 py-2.5 rounded-xl bg-[#fff8f5] border border-[#dbc1b9] text-sm text-[#231a11] focus:outline-none focus:border-[#974226]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#55433d] mb-1.5">
                            Địa chỉ chi tiết (Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP) *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="18 Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP.HCM"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#fff8f5] border border-[#dbc1b9] text-sm text-[#231a11] focus:outline-none focus:border-[#974226]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#55433d] mb-1.5">
                            Ghi chú cho shop &amp; shipper (Không bắt buộc)
                          </label>
                          <input
                            type="text"
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            placeholder="Giao giờ hành chính, gọi trước khi đến..."
                            className="w-full px-4 py-2.5 rounded-xl bg-[#fff8f5] border border-[#dbc1b9] text-sm text-[#231a11] focus:outline-none focus:border-[#974226]"
                          />
                        </div>
                      </div>
                    )}
                  </section>

                  {/* 2. Delivery Method */}
                  <section className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(43,33,24,0.05)] border border-[#f8e5d6]/60">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-7 h-7 rounded-full bg-[#f8e5d6] text-[#974226] font-headline-md text-sm flex items-center justify-center font-bold">
                        2
                      </span>
                      <h2 className="font-headline-md text-xl sm:text-2xl font-semibold text-[#231a11]">
                        Phương thức giao hàng
                      </h2>
                    </div>

                    <div className="space-y-3">
                      <label className="block cursor-pointer">
                        <div
                          className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                            shippingMethod === "standard"
                              ? "border-2 border-[#974226] bg-[#fff1e8]"
                              : "border border-[#dbc1b9]/60 hover:border-[#88726c] bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <input
                              type="radio"
                              name="shipping"
                              checked={shippingMethod === "standard"}
                              onChange={() => setShippingMethod("standard")}
                              className="mt-1 w-4 h-4 text-[#974226] accent-[#974226]"
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-[#231a11]">
                                  Giao hàng tiêu chuẩn (3–5 ngày)
                                </span>
                                <span className="text-xs bg-[#feeadc] px-2 py-0.5 rounded text-[#55433d] font-medium">
                                  Khuyên dùng
                                </span>
                              </div>
                              <p className="text-xs text-[#55433d] mt-1">
                                Giao Hàng Nhanh / ViettelPost có mã vận đơn theo dõi
                              </p>
                            </div>
                          </div>
                          <span className="font-headline-md text-lg font-semibold text-[#231a11] pl-4">
                            25.000đ
                          </span>
                        </div>
                      </label>

                      <label className="block cursor-pointer">
                        <div
                          className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                            shippingMethod === "express"
                              ? "border-2 border-[#974226] bg-[#fff1e8]"
                              : "border border-[#dbc1b9]/60 hover:border-[#88726c] bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <input
                              type="radio"
                              name="shipping"
                              checked={shippingMethod === "express"}
                              onChange={() => setShippingMethod("express")}
                              className="mt-1 w-4 h-4 text-[#974226] accent-[#974226]"
                            />
                            <div>
                              <span className="text-sm font-bold text-[#231a11] block">
                                Giao nhanh nội thành / hỏa tốc (1–2 ngày)
                              </span>
                              <p className="text-xs text-[#55433d] mt-1">
                                GrabExpress / Ahamove ưu tiên giao tận tay
                              </p>
                            </div>
                          </div>
                          <span className="font-headline-md text-lg font-semibold text-[#231a11] pl-4">
                            45.000đ
                          </span>
                        </div>
                      </label>
                    </div>
                  </section>

                  {/* 3. Payment Method */}
                  <section className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(43,33,24,0.05)] border border-[#f8e5d6]/60">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="w-7 h-7 rounded-full bg-[#f8e5d6] text-[#974226] font-headline-md text-sm flex items-center justify-center font-bold">
                        3
                      </span>
                      <h2 className="font-headline-md text-xl sm:text-2xl font-semibold text-[#231a11]">
                        Phương thức thanh toán
                      </h2>
                    </div>

                    <div className="space-y-3">
                      <label className="block cursor-pointer">
                        <div
                          className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                            paymentMethod === "vietqr"
                              ? "border-2 border-[#974226] bg-[#ffdbd0]/25"
                              : "border border-[#dbc1b9]/60 hover:border-[#88726c] bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <input
                              type="radio"
                              name="payment_method"
                              checked={paymentMethod === "vietqr"}
                              onChange={() => setPaymentMethod("vietqr")}
                              className="w-4 h-4 text-[#974226] accent-[#974226]"
                            />
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-[#dbc1b9]/50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#974226] text-[22px]">
                                  qr_code_2
                                </span>
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-[#231a11]">
                                    Chuyển khoản VietQR
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#dae9b5] text-[#151f01]">
                                    Miễn phí giao dịch
                                  </span>
                                </div>
                                <p className="text-xs text-[#55433d]">
                                  Quét mã QR từ app ngân hàng bất kỳ (VCB, MB, Techcombank...)
                                </p>
                              </div>
                            </div>
                          </div>
                          {paymentMethod === "vietqr" && (
                            <span className="material-symbols-outlined text-[#974226]">
                              check_circle
                            </span>
                          )}
                        </div>
                      </label>

                      <label className="block cursor-pointer">
                        <div
                          className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                            paymentMethod === "momo"
                              ? "border-2 border-[#974226] bg-[#ffdbd0]/25"
                              : "border border-[#dbc1b9]/60 hover:border-[#88726c] bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <input
                              type="radio"
                              name="payment_method"
                              checked={paymentMethod === "momo"}
                              onChange={() => setPaymentMethod("momo")}
                              className="w-4 h-4 text-[#974226] accent-[#974226]"
                            />
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#A50064] text-white flex items-center justify-center font-bold text-xs">
                                MoMo
                              </div>
                              <div>
                                <span className="text-sm font-bold text-[#231a11] block">
                                  Ví MoMo
                                </span>
                                <p className="text-xs text-[#55433d]">
                                  Quét mã thanh toán nhanh qua ứng dụng MoMo
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>

                      <label className="block cursor-pointer">
                        <div
                          className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                            paymentMethod === "zalopay"
                              ? "border-2 border-[#974226] bg-[#ffdbd0]/25"
                              : "border border-[#dbc1b9]/60 hover:border-[#88726c] bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <input
                              type="radio"
                              name="payment_method"
                              checked={paymentMethod === "zalopay"}
                              onChange={() => setPaymentMethod("zalopay")}
                              className="w-4 h-4 text-[#974226] accent-[#974226]"
                            />
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#0068FF] text-white flex items-center justify-center font-bold text-xs">
                                Zalo
                              </div>
                              <div>
                                <span className="text-sm font-bold text-[#231a11] block">
                                  ZaloPay
                                </span>
                                <p className="text-xs text-[#55433d]">
                                  Thanh toán qua số dư ZaloPay hoặc ngân hàng liên kết
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>

                      <label className="block cursor-pointer">
                        <div
                          className={`p-4 rounded-2xl flex items-center justify-between transition-all ${
                            paymentMethod === "cod"
                              ? "border-2 border-[#974226] bg-[#ffdbd0]/25"
                              : "border border-[#dbc1b9]/60 hover:border-[#88726c] bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <input
                              type="radio"
                              name="payment_method"
                              checked={paymentMethod === "cod"}
                              onChange={() => setPaymentMethod("cod")}
                              className="w-4 h-4 text-[#974226] accent-[#974226]"
                            />
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#feeadc] text-[#55433d] flex items-center justify-center">
                                <span className="material-symbols-outlined text-[20px]">
                                  payments
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-bold text-[#231a11] block">
                                  Thanh toán khi nhận hàng (COD)
                                </span>
                                <p className="text-xs text-[#55433d]">
                                  Kiểm tra hàng rồi thanh toán tiền mặt cho shipper
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="mt-6 p-4 rounded-2xl bg-[#fff1e8] border border-[#feeadc] flex items-start gap-3">
                      <span
                        className="material-symbols-outlined text-[#556138] text-[22px] mt-0.5"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        lock
                      </span>
                      <div className="text-xs text-[#55433d] leading-relaxed">
                        <span className="font-bold text-[#231a11]">
                          Chính sách bảo vệ Escrow:
                        </span>{" "}
                        Tiền của bạn được giữ an toàn tại REWORE và chỉ giải ngân cho shop sau khi
                        bạn nhận hàng và xác nhận đúng tình trạng mô tả trong 48 giờ.
                      </div>
                    </div>
                  </section>
                </div>

                {/* RIGHT COLUMN: ORDER SUMMARY */}
                <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
                  <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgba(43,33,24,0.05)] border border-[#f8e5d6]/60">
                    {heldItem && (
                      <div className="mb-5 p-3 rounded-2xl bg-[#fff2de] border border-[#f3cca0] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#8b4c09]">
                          <span className="material-symbols-outlined text-[18px]">timer</span>
                          <span>Đang giữ độc quyền cho bạn</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-white text-[#974226] font-mono font-bold text-xs">
                          {holdFormatted}
                        </span>
                      </div>
                    )}

                    <h3 className="font-headline-md text-xl sm:text-2xl font-semibold text-[#231a11] mb-5">
                      Tóm tắt đơn hàng
                    </h3>

                    <div className="flex gap-4 pb-6 border-b border-[#f8e5d6]">
                      <div className="w-24 h-28 rounded-2xl overflow-hidden bg-[#feeadc] flex-shrink-0 relative">
                        <Image
                          src={itemView.imageUrl}
                          alt={itemView.title}
                          fill
                          sizes="96px"
                          className="object-cover"
                          unoptimized={itemView.imageUrl.startsWith("http")}
                        />
                      </div>

                      <div className="flex-grow flex flex-col justify-between min-w-0">
                        <div>
                          <h4 className="font-bold text-base text-[#231a11] line-clamp-1">
                            {itemView.title}
                          </h4>
                          <p className="text-xs text-[#55433d] mt-0.5">{itemView.shopName}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#fff1e8] text-[#55433d]">
                              {itemView.brand}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#fff1e8] text-[#55433d]">
                              {itemView.size}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#dae9b5] text-[#151f01] font-medium">
                              {itemView.conditionLabel}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-right">
                          <span className="font-headline-md text-xl text-[#974226] font-bold">
                            {formatVnd(itemView.price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="py-5 space-y-3 text-sm text-[#55433d]">
                      <div className="flex justify-between items-center">
                        <span>Tạm tính</span>
                        <span className="text-[#231a11] font-semibold">
                          {formatVnd(itemView.price)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>
                          {shippingMethod === "express"
                            ? "Giao nhanh / Hỏa tốc"
                            : "Giao hàng tiêu chuẩn"}
                        </span>
                        <span className="text-[#231a11] font-semibold">
                          {formatVnd(shippingFee)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Phí bảo vệ Escrow</span>
                        <span className="text-[#556138] font-bold">Miễn phí</span>
                      </div>

                      <div className="pt-3 border-t border-[#f8e5d6] flex justify-between items-baseline">
                        <span className="font-headline-md text-xl text-[#231a11] font-bold">
                          Tổng thanh toán
                        </span>
                        <span className="font-headline-lg text-3xl text-[#974226] font-bold tracking-tight">
                          {formatVnd(totalAmount)}
                        </span>
                      </div>
                    </div>

                    {!itemView.isAvailable && (
                      <div className="mb-4 p-3 rounded-xl bg-[#ffdad6] text-[#93000a] text-xs font-medium">
                        Sản phẩm này hiện không còn khả dụng để đặt mua.
                      </div>
                    )}

                    {errorMessage && (
                      <div className="mb-4 p-3 rounded-xl bg-[#ffdad6] text-[#93000a] text-xs font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !itemView.isAvailable}
                      className="w-full py-4 px-6 rounded-2xl bg-[#974226] hover:bg-[#b65a3c] disabled:opacity-50 text-white text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <span>
                        {isSubmitting
                          ? "Đang tạo đơn hàng..."
                          : `Đặt hàng & Thanh toán ${formatVnd(totalAmount)}`}
                      </span>
                      {!isSubmitting && (
                        <span className="material-symbols-outlined text-[18px]">
                          arrow_forward
                        </span>
                      )}
                    </button>

                    <p className="mt-4 text-center text-xs text-[#55433d] flex items-center justify-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-[#556138]">
                        verified_user
                      </span>
                      <span>Giao dịch an toàn · Hoàn tiền 100% nếu sai mô tả</span>
                    </p>
                  </div>
                </div>
              </form>
            )}

            {/* =============================================================== */}
            {/* STEP 2: VIETQR PAYMENT                                          */}
            {/* =============================================================== */}
            {step === "payment" && (
              <div className="max-w-[540px] mx-auto">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(43,33,24,0.05)] border border-[#f8e5d6]/60 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#ffdbd0]/50 text-[#7b2e14] text-xs font-semibold mb-3">
                    Chuyển khoản qua VietQR
                  </span>
                  <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#231a11] font-bold">
                    Quét mã để thanh toán
                  </h1>
                  <p className="text-sm text-[#55433d] mt-1">
                    Mở ứng dụng ngân hàng (VCB, MB, Techcombank...) hoặc ví điện tử để quét mã.
                  </p>

                  <div className="my-5 py-3 px-6 rounded-2xl bg-[#fff1e8] border border-[#feeadc] inline-block">
                    <span className="text-[11px] text-[#55433d] block uppercase tracking-wider font-semibold">
                      Số tiền cần chuyển
                    </span>
                    <span className="font-headline-lg text-3xl text-[#974226] font-bold">
                      {formatVnd(totalAmount)}
                    </span>
                  </div>

                  {/* QR Container */}
                  <div className="w-60 h-60 mx-auto p-4 bg-white rounded-3xl border-2 border-[#974226]/30 shadow-md relative flex items-center justify-center">
                    <svg className="w-full h-full text-[#231a11]" fill="currentColor" viewBox="0 0 200 200">
                      <rect fill="#974226" height="50" rx="6" width="50" x="10" y="10" />
                      <rect fill="#ffffff" height="30" rx="3" width="30" x="20" y="20" />
                      <rect fill="#974226" height="18" rx="2" width="18" x="26" y="26" />
                      <rect fill="#974226" height="50" rx="6" width="50" x="140" y="10" />
                      <rect fill="#ffffff" height="30" rx="3" width="30" x="150" y="20" />
                      <rect fill="#974226" height="18" rx="2" width="18" x="156" y="26" />
                      <rect fill="#974226" height="50" rx="6" width="50" x="10" y="140" />
                      <rect fill="#ffffff" height="30" rx="3" width="30" x="20" y="150" />
                      <rect fill="#974226" height="18" rx="2" width="18" x="26" y="156" />
                      <rect height="20" rx="1" width="8" x="70" y="15" />
                      <rect height="8" rx="1" width="15" x="85" y="15" />
                      <rect height="12" rx="1" width="18" x="110" y="15" />
                      <rect height="10" rx="1" width="20" x="70" y="45" />
                      <rect height="8" rx="1" width="24" x="100" y="38" />
                      <rect height="8" rx="1" width="18" x="15" y="70" />
                      <rect height="15" rx="1" width="15" x="40" y="70" />
                      <rect height="24" rx="1" width="8" x="15" y="90" />
                      <rect height="8" rx="1" width="25" x="30" y="100" />
                      <rect height="10" rx="1" width="15" x="45" y="120" />
                      <rect height="8" rx="1" width="15" x="145" y="70" />
                      <rect height="20" rx="1" width="18" x="170" y="70" />
                      <rect height="8" rx="1" width="20" x="145" y="90" />
                      <rect height="15" rx="1" width="15" x="175" y="100" />
                      <rect height="15" rx="1" width="8" x="145" y="120" />
                      <rect height="12" rx="1" width="15" x="70" y="145" />
                      <rect height="8" rx="1" width="30" x="95" y="145" />
                      <rect height="20" rx="1" width="8" x="70" y="165" />
                      <rect height="15" rx="1" width="18" x="90" y="170" />
                      <rect height="15" rx="1" width="15" x="120" y="160" />
                      <rect height="8" rx="1" width="10" x="145" y="145" />
                      <rect height="12" rx="1" width="20" x="165" y="145" />
                      <rect height="8" rx="1" width="25" x="145" y="165" />
                      <rect height="20" rx="1" width="10" x="180" y="165" />
                    </svg>
                    <div className="absolute inset-0 m-auto w-12 h-12 rounded-xl bg-white shadow-md border border-[#dbc1b9] flex flex-col items-center justify-center p-1">
                      <span className="text-[10px] font-black text-[#974226] tracking-tighter">
                        REWORE
                      </span>
                      <span className="text-[8px] font-semibold text-[#556138]">VIETQR</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#8b4c09]">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span>
                      Mã QR có hiệu lực trong:{" "}
                      <strong className="font-mono text-[#974226] text-sm">{qrFormatted}</strong>
                    </span>
                  </div>

                  {/* Transfer Info */}
                  <div className="mt-6 text-left space-y-3 bg-[#fff1e8] p-4 sm:p-5 rounded-2xl border border-[#feeadc]">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#55433d]">Ngân hàng:</span>
                      <span className="font-bold text-[#231a11]">Vietcombank (VCB)</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-[#feeadc]">
                      <div>
                        <span className="text-[#55433d] block">Số tài khoản:</span>
                        <span className="font-mono font-bold text-base text-[#231a11]">
                          1029 482 019
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy("1029482019", "acc")}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                          copiedKey === "acc"
                            ? "bg-[#dae9b5] border-[#556138]/30 text-[#151f01]"
                            : "bg-white border-[#dbc1b9] text-[#974226] hover:bg-[#ffdbd0]/30"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedKey === "acc" ? "check" : "content_copy"}
                        </span>
                        <span>{copiedKey === "acc" ? "Đã chép" : "Sao chép"}</span>
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-[#feeadc]">
                      <span className="text-[#55433d]">Chủ tài khoản:</span>
                      <span className="font-bold text-[#231a11]">CONG TY CP REWORE VIETNAM</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-[#feeadc]">
                      <div>
                        <span className="text-[#55433d] block">Nội dung chuyển khoản:</span>
                        <span className="font-mono font-bold text-base text-[#974226]">
                          {orderRefCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(orderRefCode, "memo")}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                          copiedKey === "memo"
                            ? "bg-[#dae9b5] border-[#556138]/30 text-[#151f01]"
                            : "bg-white border-[#dbc1b9] text-[#974226] hover:bg-[#ffdbd0]/30"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedKey === "memo" ? "check" : "content_copy"}
                        </span>
                        <span>{copiedKey === "memo" ? "Đã chép" : "Sao chép"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Upload Payment Proof */}
                  <div className="mt-4 p-4 rounded-2xl bg-[#fff8f5] border border-dashed border-[#dbc1b9] flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                    <div className="text-xs text-[#55433d]">
                      <span className="font-semibold text-[#231a11] block">
                        Tải ảnh biên lai chuyển khoản
                      </span>
                      <span>
                        {proofFile
                          ? `${proofFile.name}${proofMessage ? ` — ${proofMessage}` : ""}`
                          : "Giúp admin xác nhận thanh toán nhanh hơn"}
                      </span>
                    </div>
                    <input
                      ref={proofInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadProof(file);
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingProof}
                      onClick={() => proofInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-white border border-[#dbc1b9] text-xs font-semibold text-[#974226] hover:bg-[#fff1e8] whitespace-nowrap"
                    >
                      {uploadingProof ? "Đang tải..." : "Chọn ảnh bill"}
                    </button>
                  </div>

                  <div className="mt-6 pt-5 border-t border-[#f8e5d6]">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("success");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#556138] hover:bg-[#6d7a4f] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>Tôi đã chuyển khoản</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* STEP 3: SUCCESS                                                 */}
            {/* =============================================================== */}
            {step === "success" && (
              <div className="max-w-[640px] mx-auto">
                <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgba(43,33,24,0.05)] border border-[#f8e5d6]/60 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#dae9b5] text-[#556138] mx-auto flex items-center justify-center mb-6 shadow-sm">
                    <span
                      className="material-symbols-outlined text-[44px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  </div>

                  <span className="inline-block px-3 py-1 rounded-full bg-[#556138]/10 text-[#556138] text-xs font-semibold mb-2">
                    Mã đơn #{orderRefCode}
                  </span>
                  <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#231a11] font-bold mb-2">
                    Đặt hàng thành công!
                  </h1>
                  <p className="text-sm sm:text-base text-[#55433d] max-w-md mx-auto leading-relaxed">
                    Đơn hàng trị giá <strong className="text-[#231a11]">{formatVnd(totalAmount)}</strong>{" "}
                    đã được ghi nhận. Shop <strong className="text-[#231a11]">{itemView.shopName}</strong>{" "}
                    sẽ chuẩn bị đóng gói sau khi xác nhận thanh toán.
                  </p>

                  {/* 3-step tracker */}
                  <div className="mt-8 p-5 bg-[#fff1e8] rounded-2xl border border-[#feeadc] text-left">
                    <h4 className="text-xs font-bold text-[#231a11] uppercase tracking-wider mb-4">
                      Tiến trình đơn hàng Escrow
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-8 h-8 rounded-full bg-[#556138] text-white flex items-center justify-center text-xs font-bold">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        </div>
                        <span className="text-xs font-bold text-[#231a11] mt-2">
                          Đã tạo đơn
                        </span>
                        <span className="text-[11px] text-[#556138] font-medium">Vừa xong</span>
                      </div>

                      <div className="flex flex-col items-center text-center">
                        <div className="w-8 h-8 rounded-full bg-[#feeadc] text-[#55433d] border border-[#dbc1b9] flex items-center justify-center text-xs font-bold">
                          2
                        </div>
                        <span className="text-xs font-bold text-[#231a11] mt-2">
                          Đóng gói &amp; Giao hàng
                        </span>
                        <span className="text-[11px] text-[#55433d]">Dự kiến 1–3 ngày</span>
                      </div>

                      <div className="flex flex-col items-center text-center">
                        <div className="w-8 h-8 rounded-full bg-[#feeadc] text-[#55433d] border border-[#dbc1b9] flex items-center justify-center text-xs font-bold">
                          3
                        </div>
                        <span className="text-xs font-bold text-[#231a11] mt-2">
                          Nhận &amp; Kiểm hàng
                        </span>
                        <span className="text-[11px] text-[#55433d]">Bảo vệ 48h</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary table */}
                  <div className="mt-6 text-left border-y border-[#f8e5d6] py-4 space-y-2.5 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-[#55433d]">Sản phẩm:</span>
                      <span className="font-bold text-[#231a11] text-right">
                        {itemView.title}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#55433d]">Người nhận:</span>
                      <span className="text-[#231a11] text-right">
                        {recipientName} · {recipientPhone}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#55433d]">Địa chỉ giao:</span>
                      <span className="text-[#231a11] text-right max-w-[280px]">
                        {shippingAddress}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-[#feeadc]">
                      <span className="text-[#231a11] font-bold">Tổng cộng:</span>
                      <span className="font-headline-md text-xl text-[#974226] font-bold">
                        {formatVnd(totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/profile")}
                      className="flex-1 py-3.5 px-6 rounded-2xl bg-[#974226] hover:bg-[#b65a3c] text-white text-sm font-semibold shadow-sm transition-all"
                    >
                      Xem đơn hàng trong Trang cá nhân
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/shop")}
                      className="flex-1 py-3.5 px-6 rounded-2xl border border-[#974226] text-[#974226] hover:bg-[#ffdbd0]/25 text-sm font-semibold transition-all"
                    >
                      Tiếp tục mua sắm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fff8f5] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#974226] border-t-transparent animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
